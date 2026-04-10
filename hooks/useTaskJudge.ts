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
    // Helper to check if a penalty already exists in memory
    const hasPenaltyInLogs = (actionType: string, relatedId?: string, descriptionMatch?: string) => {
        if (isLoading) return true; // Assume exists while loading to be safe
        const targetId = toValidUuid(relatedId || null);
        return gameLogs.some(log => {
            const matchType = log.action_type === actionType;
            const matchId = !targetId || log.related_id === targetId;
            const matchDesc = !descriptionMatch || (log.description && log.description.includes(descriptionMatch));
            return matchType && matchId && matchDesc;
        });
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
                if (
                    isTaskCompleted(task.status) || 
                    task.status === 'CANCELLED' ||
                    task.is_unscheduled || 
                    task.status === 'WAITING' || 
                    isProcessingRef.current.has(task.id)
                ) continue;
                
                // 2. เช็คว่า "วันนี้" โดนหักคะแนนไปหรือยัง? (Idempotency Check)
                // Shorten key to avoid potential DB column length limits
                const shortTaskId = task.id.substring(0, 8);
                const shortUserId = currentUser.id.substring(0, 8);
                const penaltyKey = `LATE:${shortTaskId}:${shortUserId}:${todayStr}`;
                const alreadyPenalized = hasPenaltyInLogs('TASK_LATE', penaltyKey);
                
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
