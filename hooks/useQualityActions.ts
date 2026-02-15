
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Task, ReviewStatus } from '../types';
import { useToast } from '../context/ToastContext';
import { useGamification } from './useGamification';

export const useQualityActions = () => {
    const { showToast } = useToast();
    const { processAction } = useGamification();
    const [isProcessing, setIsProcessing] = useState(false);

    // XP Distribution Logic (Synced with Engine)
    const distributeXP = async (task: Task, manualBonus: number = 0) => {
        try {
            const peopleToReward = new Set([
                ...(task.assigneeIds || []),
                ...(task.ideaOwnerIds || []),
                ...(task.editorIds || [])
            ]);

            let actualXP = 0;
            const userIds = Array.from(peopleToReward);

            // 1. Give Base XP (Engine calculates from task difficulty/hours)
            for (let i = 0; i < userIds.length; i++) {
                const result = await processAction(userIds[i], 'TASK_COMPLETE', task);
                if (i === 0 && result) {
                    actualXP = result.xp;
                }
            }

            // 2. Give Manual Bonus (If any)
            if (manualBonus !== 0) {
                for (let i = 0; i < userIds.length; i++) {
                    await processAction(userIds[i], 'MANUAL_ADJUST', {
                        xp: manualBonus,
                        hp: 0,
                        coins: 0,
                        message: manualBonus > 0 
                            ? `👍 Bonus: งานคุณภาพเยี่ยม (${task.title})` 
                            : `📉 Penalty: ปรับลดคะแนนงาน (${task.title})`
                    });
                }
                actualXP += manualBonus;
            }

            return actualXP;
        } catch (err) {
            console.error("XP Distribution Error:", err);
            showToast('แจก XP ไม่สำเร็จ แต่บันทึกสถานะงานแล้ว', 'warning');
            return 0;
        }
    };

    const handleConfirmAction = async (
        reviewId: string, 
        action: 'PASS' | 'REVISE', 
        taskId: string, 
        task: Task | undefined,
        feedback: string | undefined,
        updateReviewStatus: (id: string, status: ReviewStatus, feedback?: string, reviewerId?: string) => Promise<void>,
        reviewerId: string,
        manualBonus: number = 0 // New Parameter (8th argument)
    ) => {
        setIsProcessing(true);
        try {
            const tableName = task?.type === 'CONTENT' ? 'contents' : 'tasks';
            
            // Determine Notification Targets
            const recipients = new Set([
                ...(task?.assigneeIds || []),
                ...(task?.ideaOwnerIds || []),
                ...(task?.editorIds || [])
            ]);

            if (action === 'PASS') {
                // 1. Trigger Engine for Rewards & Logs FIRST (Include Bonus)
                let finalXP = 0;
                if (task) {
                    finalXP = await distributeXP(task, manualBonus);
                }

                // 2. Update Review Record
                await updateReviewStatus(reviewId, 'PASSED', undefined, reviewerId);
                
                // 3. Update Task Status to DONE
                await supabase.from(tableName).update({ status: 'DONE' }).eq('id', taskId);
                
                // 4. Log the system change
                await supabase.from('task_logs').insert({
                    task_id: task?.type !== 'CONTENT' ? taskId : null,
                    content_id: task?.type === 'CONTENT' ? taskId : null,
                    action: 'STATUS_CHANGE',
                    details: `Quality Gate: PASSED (Bonus: ${manualBonus}) -> Status set to DONE`,
                    user_id: reviewerId 
                });
                
                // 5. NOTIFICATION: SUCCESS
                if (recipients.size > 0) {
                     const notifications = Array.from(recipients).map(uid => ({
                         user_id: uid,
                         type: 'REVIEW',
                         title: '✅ งานผ่านแล้ว!',
                         message: `งาน "${task?.title}" ได้รับการอนุมัติแล้ว (+${finalXP} XP)`,
                         related_id: taskId,
                         link_path: 'STOCK',
                         is_read: false,
                         metadata: {
                             xp: finalXP,
                             title: task?.title,
                             bonus: manualBonus
                         }
                    }));
                    await supabase.from('notifications').insert(notifications);
                }

                showToast(`🎉 อนุมัติงาน "${task?.title}" เรียบร้อย! (+${finalXP} XP)`, 'success');

            } else {
                if (!feedback?.trim()) {
                    throw new Error("กรุณาระบุสิ่งที่ต้องแก้ไข");
                }
                
                await updateReviewStatus(reviewId, 'REVISE', feedback, reviewerId);
                
                await supabase.from(tableName).update({ status: 'DOING' }).eq('id', taskId);
                
                await supabase.from('task_logs').insert({
                    task_id: task?.type !== 'CONTENT' ? taskId : null,
                    content_id: task?.type === 'CONTENT' ? taskId : null,
                    action: 'STATUS_CHANGE',
                    details: `Quality Gate: REVISE -> ${feedback}`,
                    user_id: reviewerId
                });

                // NOTIFICATION: REVISE
                if (recipients.size > 0) {
                     const notifications = Array.from(recipients).map(uid => ({
                         user_id: uid,
                         type: 'REVIEW',
                         title: '🛠️ งานถูกส่งแก้',
                         message: `งาน "${task?.title}" ต้องแก้ไข: ${feedback}`,
                         related_id: taskId,
                         link_path: 'STOCK',
                         is_read: false,
                         metadata: {
                             feedback: feedback,
                             title: task?.title
                         }
                    }));
                    await supabase.from('notifications').insert(notifications);
                }
            }
            return true;
        } catch (err: any) {
            console.error(err);
            showToast('เกิดข้อผิดพลาด: ' + err.message, 'error');
            return false;
        } finally {
            setIsProcessing(false);
        }
    };

    return {
        handleConfirmAction,
        isProcessing
    };
};
