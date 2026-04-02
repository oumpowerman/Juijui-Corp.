import { supabase } from '../lib/supabase';
import { addDays, isBefore, isWeekend, format } from 'date-fns';
import { useGameConfig } from '../context/GameConfigContext';
import { AnnualHoliday } from '../types';
import { isHolidayOrException } from '../utils/judgeUtils';
import { useQueryClient } from '@tanstack/react-query';

export const useReviewJudge = () => {
    const { config, updateConfigValue } = useGameConfig();
    const queryClient = useQueryClient();

    const runReviewChecks = async (holidays: AnnualHoliday[], force = false) => {
        // 1. Check if enabled and if we should run (Leader-based Checkpoint)
        const judgeConfig = config?.REVIEW_JUDGE_CONFIG || { 
            enabled: true, 
            expiry_days: 3, 
            auto_revert_status: 'TODO',
            last_run_at: null 
        };
        
        if (!judgeConfig.enabled) return;

        const lastRun = judgeConfig.last_run_at ? new Date(judgeConfig.last_run_at) : null;
        const now = new Date();
        
        // Only run once every 4 hours to save network (unless forced)
        if (!force && lastRun && (now.getTime() - lastRun.getTime()) < 4 * 60 * 60 * 1000) {
            return;
        }

        console.log('[ReviewJudge] Starting SLA check...');

        // 2. Fetch all PENDING reviews
        const { data: pendingReviews, error } = await supabase
            .from('task_reviews')
            .select('*, tasks(*), contents(*)')
            .eq('status', 'PENDING');

        if (error || !pendingReviews) return;

        const expiredReviews = [];
        const expiryDays = judgeConfig.expiry_days || 3;

        for (const review of pendingReviews) {
            const submissionDate = new Date(review.scheduled_at || review.created_at);
            
            // Calculate working days since submission
            let workingDaysPassed = 0;
            let current = addDays(submissionDate, 1);
            
            // Ensure we don't loop forever if 'now' is somehow before 'current'
            while (isBefore(current, now)) {
                const isHoliday = isHolidayOrException(current, holidays, []); 
                const isWeekEnd = isWeekend(current);
                
                if (!isWeekEnd && !isHoliday) {
                    workingDaysPassed++;
                }
                current = addDays(current, 1);
            }

            if (workingDaysPassed >= expiryDays) {
                expiredReviews.push(review);
            }
        }

        if (expiredReviews.length > 0) {
            console.log(`[ReviewJudge] Found ${expiredReviews.length} expired reviews. Reverting...`);
            
            for (const review of expiredReviews) {
                const tomorrow = addDays(now, 1);
                const tomorrowStr = format(tomorrow, 'yyyy-MM-dd');

                // Update Review Status
                await supabase.from('task_reviews').update({
                    status: 'EXPIRED',
                    feedback: `[System] Admin ตรวจไม่ทันภายใน ${expiryDays} วันทำการ ระบบจึงตีกลับงานอัตโนมัติ พร้อมขยายเวลาให้ 1 วัน`
                }).eq('id', review.id);

                // Revert Task/Content Status + Extend Deadline
                const revertStatus = judgeConfig.auto_revert_status || 'TODO';
                const targetTable = review.task_id ? 'tasks' : 'contents';
                const targetId = review.task_id || review.content_id;
                
                if (targetId) {
                    await supabase.from(targetTable).update({
                        status: revertStatus,
                        end_date: tomorrowStr, // ✨ SLA Protection: Extend deadline by 1 day
                        updated_at: new Date().toISOString()
                    }).eq('id', targetId);
                }

                // Log Action
                await supabase.from('task_logs').insert({
                    [review.task_id ? 'task_id' : 'content_id']: targetId,
                    action: 'SYSTEM_REVERT',
                    details: `Admin ตรวจไม่ทันภายใน ${expiryDays} วันทำการ (ขยายเวลาถึง ${tomorrowStr})`,
                    created_at: new Date().toISOString()
                });

                // Notify User (Assignee)
                const sourceData = review.tasks || review.contents;
                if (sourceData?.assignee_ids) {
                    for (const uid of sourceData.assignee_ids) {
                        await supabase.from('notifications').insert({
                            user_id: uid,
                            title: 'งานถูกตีกลับ (SLA Expired)',
                            message: `งาน "${sourceData.title}" ถูกตีกลับเป็น ${revertStatus} เนื่องจาก Admin ตรวจไม่ทันภายในกำหนด (ขยายเวลาให้ถึงพรุ่งนี้)`,
                            type: 'SYSTEM',
                            related_id: targetId,
                            created_at: new Date().toISOString()
                        });
                    }
                }
            }
        }

        // 3. Update Checkpoint
        await updateConfigValue('REVIEW_JUDGE_CONFIG', {
            ...judgeConfig,
            last_run_at: now.toISOString()
        });

        // 4. Invalidate Queries to refresh UI
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
        queryClient.invalidateQueries({ queryKey: ['task_reviews'] });
        
        console.log('[ReviewJudge] SLA check completed.');
    };

    const runWarningChecks = async (userId: string, holidays: AnnualHoliday[]) => {
        if (!userId) return;

        const now = new Date();
        const todayStr = format(now, 'yyyy-MM-dd');

        // Fetch PENDING reviews for this user
        const { data: myReviews, error } = await supabase
            .from('task_reviews')
            .select('*, tasks!inner(*)')
            .eq('status', 'PENDING')
            .contains('tasks.assignee_ids', [userId]);

        if (error || !myReviews) return;

        for (const review of myReviews) {
            const submissionDate = new Date(review.scheduled_at || review.created_at);
            
            let workingDaysPassed = 0;
            let current = addDays(submissionDate, 1);
            
            while (isBefore(current, now)) {
                const isHoliday = isHolidayOrException(current, holidays, []); 
                const isWeekEnd = isWeekend(current);
                if (!isWeekEnd && !isHoliday) workingDaysPassed++;
                current = addDays(current, 1);
            }

            // Day 2 Warning
            if (workingDaysPassed === 2) {
                // Check if already notified today for this specific task warning
                const warningKey = `SLA_WARN:${review.task_id}:${todayStr}`;
                
                const { data: existingNoti } = await supabase
                    .from('notifications')
                    .select('id')
                    .eq('user_id', userId)
                    .eq('related_id', warningKey)
                    .limit(1);

                if (!existingNoti || existingNoti.length === 0) {
                    await supabase.from('notifications').insert({
                        user_id: userId,
                        title: '⚠️ งานใกล้ถูกตีกลับ (SLA Warning)',
                        message: `งาน "${review.tasks?.title}" ค้างตรวจมา 2 วันแล้ว จะถูกดีดกลับพรุ่งนี้ อย่าลืมตาม Admin นะ!`,
                        type: 'SYSTEM',
                        related_id: warningKey,
                        created_at: new Date().toISOString()
                    });
                }
            }
        }
    };

    return { runReviewChecks, runWarningChecks };
};
