
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Task, ReviewStatus } from '../types';
import { useToast } from '../context/ToastContext';
import { useGamification } from './useGamification';
import { useTaskContext } from '../context/TaskContext';
import { insertAndDispatchNotifications } from '../utils/pushDispatcher';

export const useQualityActions = () => {
    const { showToast } = useToast();
    const { processAction } = useGamification();
    const { setTasks } = useTaskContext();
    const [isProcessing, setIsProcessing] = useState(false);

    // XP Distribution Logic (Synced with Engine)
    const distributeXP = async (task: Task, manualBonus: number = 0, submissionDate?: Date) => {
        try {
            const peopleToReward = new Set([
                ...(task.assigneeIds || []),
                ...(task.ideaOwnerIds || []),
                ...(task.editorIds || [])
            ]);

            let actualXP = 0;
            const userIds = Array.from(peopleToReward);
            const isPenalized = (task.sla_revert_count || 0) >= 3;

            // 1. Give Base XP + Manual Bonus (Engine calculates from task difficulty/hours + adjustment)
            if (!isPenalized) {
                // Prepare context for Engine
                const engineContext = {
                    ...task,
                    manualBonus, // Engine handles this in 'TASK_COMPLETE'
                    // Use submissionDate if provided, for accurate Early Bonus calculation
                    completionDate: submissionDate || new Date()
                };

                // PARALLEL PROCESSING: Distribute to everyone at once
                const results = await Promise.all(
                    userIds.map(uid => processAction(uid, 'TASK_COMPLETE', engineContext))
                );

                // Use the first user's result for display/notification XP value
                if (results.length > 0 && results[0]) {
                    actualXP = results[0].xp;
                }
            } else {
                console.log(`[XP Penalty] Task "${task.title}" has ${task.sla_revert_count} SLA reverts. No XP awarded.`);
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
        updateReviewStatus: (id: string, status: ReviewStatus, feedback?: string, reviewerId?: string, qualityScore?: number, categories?: string[], manualBonus?: number) => Promise<void>,
        reviewerId: string,
        manualBonus: number = 0,
        submissionDate?: Date,
        qualityScore?: number,
        categories?: string[],
        originalReviewerId?: string | null,
        reviewerName?: string
    ) => {
        if (isProcessing) return false;
        setIsProcessing(true);

        const isCrossReview = Boolean(originalReviewerId && originalReviewerId !== reviewerId);

        // --- OPTIMISTIC UI: Update Local State Immediately ---
        const previousTasks: Task[] = []; // For Rollback
        if (task) {
            setTasks(prev => {
                previousTasks.push(...prev);
                return prev.map(t => t.id === taskId ? { ...t, status: action === 'PASS' ? 'DONE' : 'DOING' } : t);
            });
        }

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
                    finalXP = await distributeXP(task, manualBonus, submissionDate);
                }

                // 2. Update Review Record
                await updateReviewStatus(reviewId, 'PASSED', undefined, reviewerId, qualityScore, categories, manualBonus);
                
                // 3. Update Task Status to DONE
                const { error: updateError } = await supabase.from(tableName).update({ status: 'DONE' }).eq('id', taskId);
                if (updateError) throw updateError;
                
                // 4. Log the system change
                await supabase.from('task_logs').insert({
                    task_id: task?.type !== 'CONTENT' ? taskId : null,
                    content_id: task?.type === 'CONTENT' ? taskId : null,
                    action: 'STATUS_CHANGE',
                    details: `Quality Gate: PASSED (Bonus: ${manualBonus})${isCrossReview ? ` [ตรวจแทนโดย ${reviewerName || 'ผู้ตรวจท่านอื่น'}]` : ''} -> Status set to DONE`,
                    user_id: reviewerId,
                    metadata: {
                        category: 'STATUS_QC',
                        decision: 'PASSED',
                        status: 'DONE',
                        bonus: manualBonus,
                        original_reviewer_id: originalReviewerId || reviewerId,
                        is_cross_review: isCrossReview
                    }
                });
                
                // 5. NOTIFICATION: SUCCESS (To Task Assignees)
                if (recipients.size > 0) {
                     const notifications = Array.from(recipients).map(uid => ({
                         user_id: uid,
                         type: 'REVIEW',
                         title: '✅ งานผ่านแล้ว!',
                         message: finalXP > 0 
                            ? `งาน "${task?.title}" ได้รับการอนุมัติแล้ว (+${finalXP} XP)`
                            : `งาน "${task?.title}" ผ่านแล้ว แต่ไม่ได้รับ XP เนื่องจากถูก SLA Revert เกิน 3 ครั้ง`,
                         related_id: taskId,
                         link_path: 'ContentStock',
                         is_read: false,
                         metadata: {
                             xp: finalXP,
                             title: task?.title,
                             bonus: manualBonus,
                             isPenalized: (task?.sla_revert_count || 0) >= 3
                         }
                    }));
                    await insertAndDispatchNotifications(notifications, {
                        category: 'REVIEW',
                        senderId: reviewerId
                    });
                }

                // 6. NOTIFICATION: CROSS-REVIEW ALERT (To Original Assigned Reviewer)
                if (isCrossReview && originalReviewerId) {
                    await insertAndDispatchNotifications([{
                        user_id: originalReviewerId,
                        type: 'REVIEW',
                        title: '📋 มีผู้ตรวจงานแทนคุณ (อนุมัติผ่าน)',
                        message: `${reviewerName || 'ผู้ตรวจท่านอื่น'} ได้ช่วยตรวจและอนุมัติงาน "${task?.title}" แทนคุณเรียบร้อยแล้ว`,
                        related_id: taskId,
                        link_path: 'QUALITY_GATE',
                        is_read: false,
                        metadata: {
                            title: task?.title,
                            action: 'PASSED',
                            delegated_by: reviewerId,
                            delegated_by_name: reviewerName
                        }
                    }], {
                        category: 'REVIEW',
                        senderId: reviewerId
                    });
                }

                const successMessage = (task?.sla_revert_count || 0) >= 3
                    ? `🎉 อนุมัติงาน "${task?.title}" เรียบร้อย! (แต่ไม่ได้รับ XP เนื่องจาก SLA Revert เกิน 3 ครั้ง)`
                    : `🎉 อนุมัติงาน "${task?.title}" เรียบร้อย! (+${finalXP} XP)`;
                
                showToast(successMessage, 'success');

            } else {
                if (!feedback?.trim()) {
                    throw new Error("กรุณาระบุสิ่งที่ต้องแก้ไข");
                }
                
                await updateReviewStatus(reviewId, 'REVISE', feedback, reviewerId, undefined, categories);
                
                const { error: updateError } = await supabase.from(tableName).update({ status: 'DOING' }).eq('id', taskId);
                if (updateError) throw updateError;
                
                await supabase.from('task_logs').insert({
                    task_id: task?.type !== 'CONTENT' ? taskId : null,
                    content_id: task?.type === 'CONTENT' ? taskId : null,
                    action: 'STATUS_CHANGE',
                    details: `Quality Gate: REVISE${isCrossReview ? ` [ตรวจแทนโดย ${reviewerName || 'ผู้ตรวจท่านอื่น'}]` : ''} -> ${feedback}`,
                    user_id: reviewerId,
                    metadata: {
                        category: 'STATUS_QC',
                        decision: 'REVISE',
                        status: 'DOING',
                        feedback,
                        original_reviewer_id: originalReviewerId || reviewerId,
                        is_cross_review: isCrossReview
                    }
                });

                // NOTIFICATION: REVISE (To Task Assignees)
                if (recipients.size > 0) {
                     const notifications = Array.from(recipients).map(uid => ({
                         user_id: uid,
                         type: 'REVIEW',
                         title: '🛠️ งานถูกส่งแก้',
                         message: `งาน "${task?.title}" ต้องแก้ไข: ${feedback}`,
                         related_id: taskId,
                         link_path: 'ContentStock',
                         is_read: false,
                         metadata: {
                             feedback: feedback,
                             title: task?.title
                         }
                    }));
                    await insertAndDispatchNotifications(notifications, {
                        category: 'REVIEW',
                        senderId: reviewerId
                    });
                }

                // NOTIFICATION: CROSS-REVIEW ALERT (To Original Assigned Reviewer)
                if (isCrossReview && originalReviewerId) {
                    await insertAndDispatchNotifications([{
                        user_id: originalReviewerId,
                        type: 'REVIEW',
                        title: '📋 มีผู้ตรวจงานแทนคุณ (ส่งกลับแก้ไข)',
                        message: `${reviewerName || 'ผู้ตรวจท่านอื่น'} ได้ตรวจและตีกลับงาน "${task?.title}" แทนคุณ (หมายเหตุ: ${feedback})`,
                        related_id: taskId,
                        link_path: 'QUALITY_GATE',
                        is_read: false,
                        metadata: {
                            title: task?.title,
                            action: 'REVISE',
                            feedback,
                            delegated_by: reviewerId,
                            delegated_by_name: reviewerName
                        }
                    }], {
                        category: 'REVIEW',
                        senderId: reviewerId
                    });
                }
            }
            return true;
        } catch (err: any) {
            console.error(err);
            // ROLLBACK on error
            if (previousTasks.length > 0) {
                setTasks(previousTasks);
            }
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
