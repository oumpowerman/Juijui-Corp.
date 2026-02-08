
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Task, ReviewStatus } from '../types';
import { DIFFICULTY_LABELS } from '../constants';
import { useToast } from '../context/ToastContext';

export const useQualityActions = () => {
    const { showToast } = useToast();
    const [isProcessing, setIsProcessing] = useState(false);

    // XP Distribution Logic
    const distributeXP = async (task: Task) => {
        try {
            const baseXP = DIFFICULTY_LABELS[task.difficulty || 'MEDIUM'].xp;
            const hourlyBonus = Math.floor((task.estimatedHours || 0) * 20);
            const isLate = new Date() > new Date(task.endDate);
            const penalty = isLate ? 50 : 0;
            const finalXP = Math.max(10, (baseXP + hourlyBonus) - penalty);

            const peopleToReward = new Set([
                ...(task.assigneeIds || []),
                ...(task.ideaOwnerIds || []),
                ...(task.editorIds || [])
            ]);

            // Execute XP updates
            for (const userId of Array.from(peopleToReward)) {
                // Fetch current user data
                const { data: user, error: getError } = await supabase
                    .from('profiles')
                    .select('xp, available_points')
                    .eq('id', userId)
                    .single();
                
                if (getError) continue; 

                let newXP = (user.xp || 0) + finalXP;
                let newPoints = (user.available_points || 0) + finalXP;
                let newLevel = Math.floor(newXP / 1000) + 1;

                await supabase
                    .from('profiles')
                    .update({ xp: newXP, level: newLevel, available_points: newPoints })
                    .eq('id', userId);
            }
            
            showToast(`🎉 อนุมัติและแจก +${finalXP} XP ให้ทีมงานแล้ว!`, 'success');
        } catch (err) {
            console.error("XP Distribution Error:", err);
            showToast('แจก XP ไม่สำเร็จ แต่บันทึกสถานะงานแล้ว', 'warning');
        }
    };

    const handleConfirmAction = async (
        reviewId: string, 
        action: 'PASS' | 'REVISE', 
        taskId: string, 
        task: Task | undefined,
        feedback: string | undefined,
        updateReviewStatus: (id: string, status: ReviewStatus, feedback?: string, reviewerId?: string) => Promise<void>,
        reviewerId: string // NEW ARGUMENT
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
                // Pass reviewerId here
                await updateReviewStatus(reviewId, 'PASSED', undefined, reviewerId);
                
                await supabase.from(tableName).update({ status: 'DONE' }).eq('id', taskId);
                await supabase.from('task_logs').insert({
                    task_id: task?.type !== 'CONTENT' ? taskId : null,
                    content_id: task?.type === 'CONTENT' ? taskId : null,
                    action: 'STATUS_CHANGE',
                    details: 'Quality Gate: PASSED -> Status set to DONE',
                    user_id: reviewerId // Log who did it
                });

                // Trigger XP Distribution
                if (task) {
                    await distributeXP(task);
                }
                
                // NOTIFICATION: SUCCESS
                if (recipients.size > 0) {
                     const notifications = Array.from(recipients).map(uid => ({
                         user_id: uid,
                         type: 'REVIEW',
                         title: '✅ งานผ่านแล้ว!',
                         message: `งาน "${task?.title}" ได้รับการอนุมัติแล้ว`,
                         related_id: taskId,
                         link_path: 'STOCK',
                         is_read: false
                    }));
                    await supabase.from('notifications').insert(notifications);
                }

            } else {
                if (!feedback?.trim()) {
                    throw new Error("กรุณาระบุสิ่งที่ต้องแก้ไข");
                }
                // Pass reviewerId here
                await updateReviewStatus(reviewId, 'REVISE', feedback, reviewerId);
                
                await supabase.from(tableName).update({ status: 'DOING' }).eq('id', taskId);
                await supabase.from('task_logs').insert({
                    task_id: task?.type !== 'CONTENT' ? taskId : null,
                    content_id: task?.type === 'CONTENT' ? taskId : null,
                    action: 'STATUS_CHANGE',
                    details: `Quality Gate: REVISE -> ${feedback}`,
                    user_id: reviewerId // Log who did it
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
                         is_read: false
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
