import { supabase } from '../lib/supabase';
import { format, differenceInCalendarDays, isSameDay } from 'date-fns';
import { User, AnnualHoliday } from '../types';
import { isTaskCompleted } from '../constants';
import { isUserOnLeave, isHolidayOrException } from '../utils/judgeUtils';

import { toValidUuid } from '../utils/gamificationUtils';

export const useTaskJudge = (
    currentUser: User | null,
    isProcessingRef: React.MutableRefObject<Set<string>>,
    processAction: any,
    config: any,
    gameLogs: any[],
    isLoading: boolean
) => {
    // Helper to check if a penalty already exists (Check local memory first, then DB for robustness)
    const hasPenaltyInLogs = async (actionType: string, relatedId?: string, descriptionMatch?: string) => {
        if (isLoading || !currentUser) return true; // Assume exists while loading or if no user
        const targetId = toValidUuid(relatedId || null);

        // 1. Check local context logs first (Fast)
        const localMatch = gameLogs.some(log => {
            // Check if log belongs to current user (Crucial for Admins)
            const matchUser = log.user_id === currentUser.id;
            if (!matchUser) return false;

            const matchType = log.action_type === actionType;
            const matchId = !targetId || log.related_id === targetId;
            const matchDesc = !descriptionMatch || (log.description && log.description.includes(descriptionMatch));
            return matchType && matchId && matchDesc;
        });

        if (localMatch) return true;

        // 2. If not in local logs (e.g. pushed out of last 100), check DB directly (Robust)
        if (targetId) {
            try {
                const { data, error } = await supabase
                    .from('game_logs')
                    .select('id')
                    .eq('user_id', currentUser.id)
                    .eq('related_id', targetId)
                    .limit(1);
                
                if (error) {
                    console.error("[TaskJudge] DB Penalty Check Error:", error);
                    return false;
                }
                
                if (data && data.length > 0) return true;
            } catch (err) {
                console.error("[TaskJudge] DB Penalty Check Exception:", err);
            }
        }

        return false;
    };

    const runTaskChecks = async (
        today: Date,
        todayStr: string,
        holidays: AnnualHoliday[],
        exceptions: any[],
        userLeaves: any[]
    ) => {
        if (!currentUser) return;

        // --- CONFIG VALUES ---
        const allowHolidayPenalty = config?.AUTO_JUDGE_CONFIG?.allow_holiday_penalty ?? false;
        const basePenalty = config?.PENALTY_RATES?.HP_PENALTY_LATE || 5; 
        const multiplier = config?.PENALTY_RATES?.HP_PENALTY_LATE_MULTIPLIER || 2;

        const { data: overdueTasks, error: taskError } = await supabase
            .from('tasks')
            .select('*')
            .contains('assignee_ids', [currentUser.id]) 
            .lt('end_date', todayStr); // งานที่เลย Deadline

        if (!taskError && overdueTasks) {
            for (const task of overdueTasks) {
                // 1. ถ้างานเสร็จแล้ว หรือเป็นงาน Unscheduled หรือกำลังประมวลผล ข้ามไป
                const rawStatus = task.status || '';
                const normalizedStatus = rawStatus.trim().toUpperCase();
                const isPassed = isTaskCompleted(normalizedStatus);
                
                if (
                    isPassed || 
                    normalizedStatus === 'CANCELLED' ||
                    task.is_unscheduled || 
                    normalizedStatus === 'WAITING' || 
                    normalizedStatus === 'APPROVE' || 
                    normalizedStatus === 'PASSED' ||
                    isProcessingRef.current.has(task.id)
                ) {
                    if (isPassed && !task.is_unscheduled) {
                        console.log(`[TaskJudge] Skipping task ${task.id} because it is COMPLETED (Status: ${normalizedStatus})`);
                    }
                    continue;
                }
                
                // 2. เช็คว่า "วันนี้" โดนหักคะแนนไปหรือยัง? (Idempotency Check)
                // Shorten key to avoid potential DB column length limits
                const shortTaskId = task.id.substring(0, 8);
                const shortUserId = currentUser.id.substring(0, 8);
                const penaltyKey = `LATE:${shortTaskId}:${shortUserId}:${todayStr}`;
                const alreadyPenalized = await hasPenaltyInLogs('TASK_LATE', penaltyKey);
                
                if (alreadyPenalized) continue;

                // 3. เช็คว่า "วันนี้" ลา หรือเป็นวันหยุดหรือไม่? (Humanity Check)
                if (!allowHolidayPenalty && isHolidayOrException(today, holidays, exceptions)) {
                    continue;
                }

                const leaveCheck = isUserOnLeave(todayStr, userLeaves || []);
                if (leaveCheck.onLeave) {
                    if (leaveCheck.status === 'PENDING') {
                        console.log(`[TaskJudge] Deferring task ${task.id} penalty because leave is PENDING.`);
                    }
                    continue;
                }
                
                // 4. คำนวณความเสียหายแบบ Progressive
                const deadlineStr = task.end_date;
                const deadline = new Date(deadlineStr);
                const daysLate = differenceInCalendarDays(today, deadline);
                
                if (daysLate <= 0) continue; 

                // Lock task
                isProcessingRef.current.add(task.id);

                try {
                    const progressiveDamage = basePenalty + (daysLate * multiplier);
                    
                    // 5. ลงดาบ
                    await supabase.from('tasks').update({ 
                        is_penalized: true,
                        last_penalized_at: new Date().toISOString() 
                    }).eq('id', task.id);

                    await processAction(currentUser.id, 'TASK_LATE', { 
                        ...task, 
                        id: penaltyKey,
                        customPenalty: progressiveDamage, 
                        daysLate: daysLate
                    });
                } finally {
                    // Unlock
                    isProcessingRef.current.delete(task.id);
                }
            }
        }
    };

    return { runTaskChecks };
};
