import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { DeadlineRequest, User } from '../types';

export const useDeadlineRequests = (currentUser?: User) => {
    const [isLoading, setIsLoading] = useState(false);

    // 1. Fetch Pending Requests for a specific Task
    const getPendingRequestForTask = useCallback(async (taskId: string): Promise<DeadlineRequest | null> => {
        try {
            const { data, error } = await supabase
                .from('task_deadline_requests')
                .select(`
                    id, task_id, requested_by, new_deadline, reason, status, created_at,
                    profiles:requested_by (full_name, avatar_url)
                `)
                .eq('task_id', taskId)
                .eq('status', 'PENDING')
                .maybeSingle();
            
            if (error) throw error;
            if (!data) return null;

            const profile = Array.isArray(data.profiles) ? data.profiles[0] : data.profiles;

            return {
                id: data.id,
                taskId: data.task_id,
                requestedBy: data.requested_by,
                newDeadline: new Date(data.new_deadline),
                reason: data.reason,
                status: data.status,
                createdAt: new Date(data.created_at),
                user: profile ? { name: profile.full_name, avatarUrl: profile.avatar_url } : undefined
            };
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
                    id, task_id, requested_by, new_deadline, reason, status, created_at,
                    profiles:requested_by (full_name, avatar_url),
                    tasks:task_id (title)
                `)
                .eq('status', 'PENDING')
                .order('created_at', { ascending: false });
            
            if (error) throw error;

            return (data || []).map(req => {
                const profile = Array.isArray(req.profiles) ? req.profiles[0] : req.profiles;
                const task = Array.isArray(req.tasks) ? req.tasks[0] : req.tasks;
                
                return {
                    id: req.id,
                    taskId: req.task_id,
                    requestedBy: req.requested_by,
                    newDeadline: new Date(req.new_deadline),
                    reason: req.reason,
                    status: req.status,
                    createdAt: new Date(req.created_at),
                    user: profile ? { name: profile.full_name, avatarUrl: profile.avatar_url } : undefined,
                    taskTitle: task?.title // Add task title for admin view
                } as DeadlineRequest & { taskTitle?: string };
            });
        } catch (err) {
            console.error('Error fetching all pending requests:', err);
            return [];
        } finally {
            setIsLoading(false);
        }
    }, []);

    // 3. Create a new Request (Member)
    const createRequest = useCallback(async (taskId: string, newDateStr: string, reason: string): Promise<{ success: boolean; data?: DeadlineRequest; error?: string }> => {
        if (!currentUser) return { success: false, error: 'Not authenticated' };
        
        try {
            setIsLoading(true);
            const { data, error } = await supabase
                .from('task_deadline_requests')
                .insert({
                    task_id: taskId,
                    requested_by: currentUser.id,
                    new_deadline: new Date(newDateStr).toISOString(),
                    reason: reason,
                    status: 'PENDING'
                })
                .select()
                .single();

            if (error) throw error;

            // Log the action
            await supabase.from('task_logs').insert({
                task_id: taskId,
                action: 'DEADLINE_EXTENSION_REQUESTED',
                details: `ขอเลื่อนส่งงานเป็นวันที่ ${newDateStr} เหตุผล: ${reason}`,
                user_id: currentUser.id
            });

            return { 
                success: true, 
                data: {
                    id: data.id,
                    taskId: data.task_id,
                    requestedBy: data.requested_by,
                    newDeadline: new Date(data.new_deadline),
                    reason: data.reason,
                    status: data.status,
                    createdAt: new Date(data.created_at),
                    user: { name: currentUser.name, avatarUrl: currentUser.avatarUrl || '' }
                }
            };
        } catch (err: any) {
            console.error('Error creating request:', err);
            return { success: false, error: err.message };
        } finally {
            setIsLoading(false);
        }
    }, [currentUser]);

    // 4. Resolve a Request (Admin)
    const resolveRequest = useCallback(async (requestId: string, taskId: string, isApproved: boolean, newDate?: Date): Promise<{ success: boolean; error?: string }> => {
        if (!currentUser || currentUser.role !== 'ADMIN') return { success: false, error: 'Unauthorized' };

        try {
            setIsLoading(true);
            const status = isApproved ? 'APPROVED' : 'REJECTED';
            
            // Update Request Status
            const { error: reqError } = await supabase
                .from('task_deadline_requests')
                .update({ 
                    status,
                    resolved_at: new Date().toISOString(),
                    resolved_by: currentUser.id
                })
                .eq('id', requestId);
                
            if (reqError) throw reqError;

            // If Approved, update Task End Date
            if (isApproved && newDate) {
                const { error: taskError } = await supabase
                    .from('tasks')
                    .update({ end_date: newDate.toISOString() })
                    .eq('id', taskId);
                
                if (taskError) throw taskError;
            }

            // Add Log
            await supabase.from('task_logs').insert({
                task_id: taskId,
                action: isApproved ? 'DEADLINE_EXTENSION_APPROVED' : 'DEADLINE_EXTENSION_REJECTED',
                details: isApproved ? `อนุมัติการเลื่อน Deadline เป็นวันที่ ${newDate?.toISOString().split('T')[0]}` : `ปฏิเสธคำขอเลื่อน Deadline`,
                user_id: currentUser.id
            });

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
        resolveRequest
    };
};
