import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { DeadlineRequest, User } from '../types';
import { useUserSession } from '../context/UserSessionContext';
import { fetchOrgAdminIds, insertAndDispatchNotifications } from '../utils/pushDispatcher';
import { toLocalMidnightISO, toLocalYMD } from '../utils/dateUtils';

const mapTaskRequestRow = (req: any): DeadlineRequest => {
    const profile = Array.isArray(req.profiles) ? req.profiles[0] : req.profiles;
    const approverProfile = Array.isArray(req.approver) ? req.approver[0] : req.approver;
    const task = Array.isArray(req.tasks) ? req.tasks[0] : req.tasks;

    return {
        id: req.id,
        taskId: req.task_id,
        requestedBy: req.requested_by,
        approverId: req.resolved_by || undefined,
        newDeadline: new Date(req.new_deadline),
        reason: req.reason,
        status: req.status,
        createdAt: new Date(req.created_at),
        user: profile ? { name: profile.full_name, avatarUrl: profile.avatar_url } : undefined,
        approver: approverProfile
            ? { name: approverProfile.full_name, avatarUrl: approverProfile.avatar_url, position: approverProfile.position }
            : undefined,
        taskTitle: task?.title,
        originalDeadline: task?.end_date ? new Date(task.end_date) : undefined,
        requestType: 'TASK'
    };
};

export const useDeadlineRequests = (passedUser?: User) => {
    const { currentUserProfile } = useUserSession();
    const currentUser = passedUser || currentUserProfile || undefined;
    const [isLoading, setIsLoading] = useState(false);

    // 1. Fetch Latest Pending Request for a specific Task (safe against legacy duplicates)
    const getPendingRequestForTask = useCallback(async (taskId: string): Promise<DeadlineRequest | null> => {
        try {
            const { data, error } = await supabase
                .from('task_deadline_requests')
                .select(`
                    id, task_id, requested_by, resolved_by, new_deadline, reason, status, created_at,
                    profiles:requested_by (full_name, avatar_url, position),
                    approver:resolved_by (full_name, avatar_url, position)
                `)
                .eq('task_id', taskId)
                .eq('status', 'PENDING')
                .order('created_at', { ascending: false })
                .limit(1);

            if (error) throw error;
            if (!data || data.length === 0) return null;

            return mapTaskRequestRow(data[0]);
        } catch (err) {
            console.error('Error fetching pending request:', err);
            return null;
        }
    }, []);

    // 2. Fetch ALL Pending Requests (For Admin Dashboard)
    const getAllPendingRequests = useCallback(async (): Promise<DeadlineRequest[]> => {
        try {
            setIsLoading(true);
            const { data, error } = await supabase
                .from('task_deadline_requests')
                .select(`
                    id, task_id, requested_by, resolved_by, new_deadline, reason, status, created_at,
                    profiles:requested_by (full_name, avatar_url, position),
                    approver:resolved_by (full_name, avatar_url, position),
                    tasks:task_id (title, end_date)
                `)
                .eq('status', 'PENDING')
                .order('created_at', { ascending: false });

            if (error) throw error;

            return (data || []).map(mapTaskRequestRow);
        } catch (err) {
            console.error('Error fetching all pending requests:', err);
            return [];
        } finally {
            setIsLoading(false);
        }
    }, []);

    // 3. Create a new Request (Member) with Duplicate Guard
    const createRequest = useCallback(async (
        taskId: string,
        newDateStr: string,
        reason: string,
        approverId?: string
    ): Promise<{ success: boolean; data?: DeadlineRequest; error?: string }> => {
        if (!currentUser) return { success: false, error: 'ไม่พบข้อมูลผู้ใช้งาน' };

        try {
            setIsLoading(true);

            // Guard against duplicate PENDING requests for the same task
            const { data: existingPending, error: checkError } = await supabase
                .from('task_deadline_requests')
                .select('id')
                .eq('task_id', taskId)
                .eq('status', 'PENDING')
                .limit(1);

            if (checkError) throw checkError;
            if (existingPending && existingPending.length > 0) {
                return {
                    success: false,
                    error: 'งานนี้มีคำขอเลื่อนที่รอพิจารณาอยู่แล้ว สามารถแก้ไขหรือยกเลิกคำขอเดิมได้'
                };
            }

            const insertPayload: any = {
                task_id: taskId,
                requested_by: currentUser.id,
                new_deadline: toLocalMidnightISO(newDateStr),
                reason: reason.trim(),
                status: 'PENDING'
            };
            if (approverId) {
                insertPayload.resolved_by = approverId;
            }

            const { data, error } = await supabase
                .from('task_deadline_requests')
                .insert(insertPayload)
                .select(`
                    id, task_id, requested_by, resolved_by, new_deadline, reason, status, created_at,
                    approver:resolved_by (full_name, avatar_url, position)
                `)
                .single();

            if (error) throw error;

            // Log the action
            await supabase.from('task_logs').insert({
                task_id: taskId,
                action: 'DEADLINE_EXTENSION_REQUESTED',
                details: `ขอเลื่อนกำหนดส่งงานเป็นวันที่ ${newDateStr} เหตุผล: ${reason.trim()}`,
                user_id: currentUser.id,
                metadata: {
                    category: 'DATES',
                    newDate: newDateStr,
                    reason: reason.trim(),
                    approverId
                }
            });

            // Notify chosen Admin or all org Admins
            const targetUserIds = approverId ? [approverId] : await fetchOrgAdminIds(currentUser.id);
            if (targetUserIds.length > 0) {
                const trimmedReason = reason.trim();
                const notifications = targetUserIds.map(targetId => ({
                    user_id: targetId,
                    type: 'APPROVAL_REQ',
                    title: '📅 คำขอเลื่อนกำหนดส่งงานใหม่',
                    message: `คุณ ${currentUser.name} ขอเลื่อนกำหนดส่งเป็นวันที่ ${newDateStr}: "${trimmedReason.substring(0, 60)}${trimmedReason.length > 60 ? '...' : ''}"`,
                    related_id: taskId,
                    link_path: 'ADMIN_DASHBOARD',
                    is_read: false
                }));
                await insertAndDispatchNotifications(notifications, {
                    category: 'DEADLINE_REQ',
                    senderId: currentUser.id
                });
            }

            const mapped = mapTaskRequestRow({
                ...data,
                profiles: { full_name: currentUser.name, avatar_url: currentUser.avatarUrl || '' }
            });

            return { success: true, data: mapped };
        } catch (err: any) {
            console.error('Error creating request:', err);
            return { success: false, error: err.message };
        } finally {
            setIsLoading(false);
        }
    }, [currentUser]);

    // 4. Update an existing PENDING Request (Requester)
    const updateRequest = useCallback(async (
        requestId: string,
        taskId: string,
        newDateStr: string,
        reason: string,
        approverId?: string
    ): Promise<{ success: boolean; data?: DeadlineRequest; error?: string }> => {
        if (!currentUser) return { success: false, error: 'ไม่พบข้อมูลผู้ใช้งาน' };

        try {
            setIsLoading(true);
            const updatePayload: any = {
                new_deadline: toLocalMidnightISO(newDateStr),
                reason: reason.trim(),
                resolved_by: approverId || null
            };

            const { data, error } = await supabase
                .from('task_deadline_requests')
                .update(updatePayload)
                .eq('id', requestId)
                .eq('status', 'PENDING')
                .select(`
                    id, task_id, requested_by, resolved_by, new_deadline, reason, status, created_at,
                    profiles:requested_by (full_name, avatar_url, position),
                    approver:resolved_by (full_name, avatar_url, position)
                `)
                .single();

            if (error) throw error;

            await supabase.from('task_logs').insert({
                task_id: taskId,
                action: 'DEADLINE_EXTENSION_UPDATED',
                details: `แก้ไขคำขอเลื่อนกำหนดส่งเป็นวันที่ ${newDateStr} เหตุผล: ${reason.trim()}`,
                user_id: currentUser.id,
                metadata: {
                    category: 'DATES',
                    requestId,
                    newDate: newDateStr,
                    reason: reason.trim(),
                    approverId
                }
            });

            const targetUserIds = approverId ? [approverId] : await fetchOrgAdminIds(currentUser.id);
            if (targetUserIds.length > 0) {
                const trimmedReason = reason.trim();
                const notifications = targetUserIds.map(targetId => ({
                    user_id: targetId,
                    type: 'APPROVAL_REQ',
                    title: '✏️ แก้ไขคำขอเลื่อนกำหนดส่งงาน',
                    message: `คุณ ${currentUser.name} อัปเดตคำขอเลื่อนเป็นวันที่ ${newDateStr}: "${trimmedReason.substring(0, 60)}${trimmedReason.length > 60 ? '...' : ''}"`,
                    related_id: taskId,
                    link_path: 'ADMIN_DASHBOARD',
                    is_read: false
                }));
                await insertAndDispatchNotifications(notifications, {
                    category: 'DEADLINE_REQ',
                    senderId: currentUser.id
                });
            }

            return { success: true, data: mapTaskRequestRow(data) };
        } catch (err: any) {
            console.error('Error updating request:', err);
            return { success: false, error: err.message };
        } finally {
            setIsLoading(false);
        }
    }, [currentUser]);

    // 5. Cancel a PENDING Request (Requester or Admin) - cleans up any legacy duplicates on same task
    const cancelRequest = useCallback(async (
        requestId: string,
        taskId: string
    ): Promise<{ success: boolean; error?: string }> => {
        if (!currentUser) return { success: false, error: 'ไม่พบข้อมูลผู้ใช้งาน' };

        try {
            setIsLoading(true);

            // Attempt delete of pending rows on this task first
            const { data: deletedRows, error: deleteError } = await supabase
                .from('task_deadline_requests')
                .delete()
                .eq('task_id', taskId)
                .eq('status', 'PENDING')
                .select('id');

            // Fallback if RLS blocks DELETE: mark as REJECTED so it leaves PENDING state
            if (deleteError || !deletedRows || deletedRows.length === 0) {
                const { error: fallbackError } = await supabase
                    .from('task_deadline_requests')
                    .update({
                        status: 'REJECTED',
                        resolved_at: new Date().toISOString(),
                        resolved_by: currentUser.id
                    })
                    .eq('id', requestId)
                    .eq('status', 'PENDING');

                if (fallbackError) throw fallbackError;
            }

            await supabase.from('task_logs').insert({
                task_id: taskId,
                action: 'DEADLINE_EXTENSION_CANCELLED',
                details: 'ผู้ขอยกเลิกคำขอเลื่อนกำหนดส่งงาน',
                user_id: currentUser.id,
                metadata: {
                    category: 'DATES',
                    requestId
                }
            });

            return { success: true };
        } catch (err: any) {
            console.error('Error cancelling request:', err);
            return { success: false, error: err.message };
        } finally {
            setIsLoading(false);
        }
    }, [currentUser]);

    // 6. Resolve a Request (Any Admin can resolve; cascades to duplicate pending rows on same target)
    const resolveRequest = useCallback(async (
        requestId: string,
        taskIdOrGoalId: string,
        isApproved: boolean,
        newDate?: Date,
        requestType: 'TASK' | 'GOAL' = 'TASK',
        feedback?: string
    ): Promise<{ success: boolean; error?: string }> => {
        let userRole = currentUser?.role;
        let userId = currentUser?.id;

        if (!userRole || !userId) {
            try {
                const { data: { user: authUser } } = await supabase.auth.getUser();
                if (authUser) {
                    userId = authUser.id;
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('role')
                        .eq('id', authUser.id)
                        .single();
                    if (profile) {
                        userRole = profile.role;
                    }
                }
            } catch (authErr) {
                console.error('Error fetching fallback auth user role:', authErr);
            }
        }

        if (!userRole || userRole.toUpperCase() !== 'ADMIN' || !userId) {
            return { success: false, error: `ไม่มีสิทธิ์ดำเนินการ (Role: ${userRole || 'NONE'})` };
        }

        try {
            setIsLoading(true);
            const status = isApproved ? 'APPROVED' : 'REJECTED';
            const trimmedFeedback = feedback?.trim() || '';
            const resolvedAtIso = new Date().toISOString();

            if (requestType === 'GOAL') {
                // Collect pending requesters on this goal before closing duplicates
                const { data: pendingGoalRows } = await supabase
                    .from('goal_deadline_requests')
                    .select('id, requested_by')
                    .eq('goal_id', taskIdOrGoalId)
                    .eq('status', 'PENDING');

                const { error: reqError } = await supabase
                    .from('goal_deadline_requests')
                    .update({
                        status,
                        resolved_at: resolvedAtIso,
                        resolved_by: userId
                    })
                    .eq('goal_id', taskIdOrGoalId)
                    .eq('status', 'PENDING');

                if (reqError) throw reqError;

                const { data: goalData } = await supabase
                    .from('goals')
                    .select('title, extension_count')
                    .eq('id', taskIdOrGoalId)
                    .maybeSingle();

                if (isApproved && newDate) {
                    const currentCount = goalData?.extension_count || 0;
                    const { error: goalError } = await supabase
                        .from('goals')
                        .update({
                            deadline: toLocalMidnightISO(newDate),
                            extension_count: currentCount + 1
                        })
                        .eq('id', taskIdOrGoalId);

                    if (goalError) throw goalError;
                }

                // Notify requester(s) about GOAL decision
                const requesterIds: string[] = Array.from(
                    new Set(
                        (pendingGoalRows || [])
                            .map((r: any) => r.requested_by)
                            .filter((id: string) => id && id !== userId)
                    )
                );

                if (requesterIds.length > 0) {
                    const newDateFormatted = newDate ? toLocalYMD(newDate) : '';
                    const goalLabel = goalData?.title ? `"${goalData.title}"` : 'เป้าหมาย';
                    const notifications = requesterIds.map(uid => ({
                        user_id: uid,
                        type: 'INFO',
                        title: isApproved ? '✅ อนุมัติเลื่อนกำหนดเป้าหมายแล้ว' : '❌ ไม่อนุมัติคำขอเลื่อนกำหนดเป้าหมาย',
                        message: isApproved
                            ? `คำขอเลื่อนกำหนด${goalLabel} ได้รับอนุมัติเป็นวันที่ ${newDateFormatted}`
                            : trimmedFeedback
                                ? `คำขอเลื่อนกำหนด${goalLabel} ไม่ได้รับอนุมัติ · เหตุผล: ${trimmedFeedback}`
                                : `คำขอเลื่อนกำหนด${goalLabel} ไม่ได้รับอนุมัติ`,
                        related_id: taskIdOrGoalId,
                        link_path: 'GOALS',
                        metadata: { goalId: taskIdOrGoalId, feedback: trimmedFeedback || undefined },
                        is_read: false
                    }));
                    await insertAndDispatchNotifications(notifications, {
                        category: 'DEADLINE_REQ',
                        senderId: userId
                    });
                }
            } else {
                // Collect pending requesters on this task before closing all pending sibling rows
                const { data: pendingTaskRows } = await supabase
                    .from('task_deadline_requests')
                    .select('id, requested_by')
                    .eq('task_id', taskIdOrGoalId)
                    .eq('status', 'PENDING');

                const { error: reqError } = await supabase
                    .from('task_deadline_requests')
                    .update({
                        status,
                        resolved_at: resolvedAtIso,
                        resolved_by: userId
                    })
                    .eq('task_id', taskIdOrGoalId)
                    .eq('status', 'PENDING');

                if (reqError) throw reqError;

                if (isApproved && newDate) {
                    const { error: taskError } = await supabase
                        .from('tasks')
                        .update({ end_date: toLocalMidnightISO(newDate) })
                        .eq('id', taskIdOrGoalId);

                    if (taskError) throw taskError;
                }

                const newDateStr = newDate ? toLocalYMD(newDate) : '';
                const logDetails = isApproved
                    ? `อนุมัติการเลื่อนกำหนดส่งเป็นวันที่ ${newDateStr}`
                    : trimmedFeedback
                        ? `ปฏิเสธคำขอเลื่อนกำหนดส่ง · เหตุผล: ${trimmedFeedback}`
                        : `ปฏิเสธคำขอเลื่อนกำหนดส่ง`;

                await supabase.from('task_logs').insert({
                    task_id: taskIdOrGoalId,
                    action: isApproved ? 'DEADLINE_EXTENSION_APPROVED' : 'DEADLINE_EXTENSION_REJECTED',
                    details: logDetails,
                    user_id: userId,
                    metadata: {
                        category: 'DATES',
                        requestId,
                        isApproved,
                        newDate: newDateStr || null,
                        feedback: trimmedFeedback || null
                    }
                });

                const requesterIds: string[] = Array.from(
                    new Set(
                        (pendingTaskRows || [])
                            .map((r: any) => r.requested_by)
                            .filter((id: string) => id && id !== userId)
                    )
                );

                if (requesterIds.length > 0) {
                    const notifications = requesterIds.map(uid => ({
                        user_id: uid,
                        type: 'INFO',
                        title: isApproved ? '✅ อนุมัติการเลื่อนกำหนดส่งงาน' : '❌ ไม่อนุมัติคำขอเลื่อนกำหนดส่งงาน',
                        message: isApproved
                            ? `คำขอเลื่อนกำหนดส่งงานของคุณได้รับอนุมัติเป็นวันที่ ${newDateStr}`
                            : trimmedFeedback
                                ? `คำขอเลื่อนกำหนดส่งงานของคุณไม่ได้รับอนุมัติ · เหตุผล: ${trimmedFeedback}`
                                : 'คำขอเลื่อนกำหนดส่งงานของคุณไม่ได้รับอนุมัติ',
                        related_id: taskIdOrGoalId,
                        link_path: 'DASHBOARD',
                        metadata: { taskId: taskIdOrGoalId, feedback: trimmedFeedback || undefined },
                        is_read: false
                    }));
                    await insertAndDispatchNotifications(notifications, {
                        category: 'DEADLINE_REQ',
                        senderId: userId
                    });
                }
            }

            return { success: true };
        } catch (err: any) {
            console.error('Error resolving request:', err);
            return { success: false, error: err.message };
        } finally {
            setIsLoading(false);
        }
    }, [currentUser]);

    return {
        isLoading,
        getPendingRequestForTask,
        getAllPendingRequests,
        createRequest,
        updateRequest,
        cancelRequest,
        resolveRequest
    };
};
