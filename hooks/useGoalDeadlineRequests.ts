import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '../types';
import { useUserSession } from '../context/UserSessionContext';

export interface GoalDeadlineRequest {
    id: string;
    goalId: string;
    requestedBy: string;
    approverId?: string;
    approver?: { name: string; avatarUrl: string; position?: string };
    newDeadline: Date;
    reason: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    createdAt: Date;
    resolvedAt?: Date;
    resolvedBy?: string;
    user?: { name: string; avatarUrl: string };
    goalTitle?: string;
}

export const useGoalDeadlineRequests = (passedUser?: User) => {
    const { currentUserProfile } = useUserSession();
    const currentUser = passedUser || currentUserProfile || undefined;
    const [isLoading, setIsLoading] = useState(false);

    // 1. Fetch Pending Requests for a specific Goal
    const getPendingRequestForGoal = useCallback(async (goalId: string): Promise<GoalDeadlineRequest | null> => {
        try {
            const { data, error } = await supabase
                .from('goal_deadline_requests')
                .select(`
                    id, goal_id, requested_by, resolved_by, new_deadline, reason, status, created_at,
                    profiles:requested_by (full_name, avatar_url, position),
                    approver:resolved_by (full_name, avatar_url, position)
                `)
                .eq('goal_id', goalId)
                .eq('status', 'PENDING')
                .maybeSingle();
            
            if (error) throw error;
            if (!data) return null;

            // Handle nested objects / arrays from supabase relations
            const profile = Array.isArray(data.profiles) ? data.profiles[0] : data.profiles;
            const approverProfile = Array.isArray(data.approver) ? data.approver[0] : data.approver;

            return {
                id: data.id,
                goalId: data.goal_id,
                requestedBy: data.requested_by,
                approverId: data.resolved_by || undefined,
                newDeadline: new Date(data.new_deadline),
                reason: data.reason,
                status: data.status,
                createdAt: new Date(data.created_at),
                user: profile ? { name: profile.full_name, avatarUrl: profile.avatar_url } : undefined,
                approver: approverProfile ? { name: approverProfile.full_name, avatarUrl: approverProfile.avatar_url, position: approverProfile.position } : undefined
            };
        } catch (err) {
            console.error('Error fetching pending goal request:', err);
            return null;
        }
    }, []);

    // 2. Fetch ALL Pending Requests (For Admin Dashboard)
    const getAllPendingRequests = useCallback(async (): Promise<GoalDeadlineRequest[]> => {
        try {
            setIsLoading(true);
            const { data, error } = await supabase
                .from('goal_deadline_requests')
                .select(`
                    id, goal_id, requested_by, resolved_by, new_deadline, reason, status, created_at,
                    profiles:requested_by (full_name, avatar_url, position),
                    approver:resolved_by (full_name, avatar_url, position),
                    goals:goal_id (title)
                `)
                .eq('status', 'PENDING')
                .order('created_at', { ascending: false });
            
            if (error) throw error;

            return (data || []).map(req => {
                const profile = Array.isArray(req.profiles) ? req.profiles[0] : req.profiles;
                const approverProfile = Array.isArray(req.approver) ? req.approver[0] : req.approver;
                const goal = Array.isArray(req.goals) ? req.goals[0] : req.goals;
                
                return {
                    id: req.id,
                    goalId: req.goal_id,
                    requestedBy: req.requested_by,
                    approverId: req.resolved_by || undefined,
                    newDeadline: new Date(req.new_deadline),
                    reason: req.reason,
                    status: req.status,
                    createdAt: new Date(req.created_at),
                    user: profile ? { name: profile.full_name, avatarUrl: profile.avatar_url } : undefined,
                    approver: approverProfile ? { name: approverProfile.full_name, avatarUrl: approverProfile.avatar_url, position: approverProfile.position } : undefined,
                    goalTitle: goal?.title
                } as GoalDeadlineRequest;
            });
        } catch (err) {
            console.error('Error fetching all pending goal requests:', err);
            return [];
        } finally {
            setIsLoading(false);
        }
    }, []);

    // 3. Create a new Request (Member)
    const createRequest = useCallback(async (goalId: string, newDateStr: string, reason: string, approverId?: string): Promise<{ success: boolean; data?: GoalDeadlineRequest; error?: string }> => {
        if (!currentUser) return { success: false, error: 'Not authenticated' };
        
        try {
            setIsLoading(true);
            const insertPayload: any = {
                goal_id: goalId,
                requested_by: currentUser.id,
                new_deadline: new Date(newDateStr).toISOString(),
                reason: reason,
                status: 'PENDING'
            };
            if (approverId) {
                insertPayload.resolved_by = approverId;
            }

            const { data, error } = await supabase
                .from('goal_deadline_requests')
                .insert(insertPayload)
                .select(`
                    id, goal_id, requested_by, resolved_by, new_deadline, reason, status, created_at,
                    approver:resolved_by (full_name, avatar_url, position)
                `)
                .single();

            if (error) throw error;

            // 🔔 Create Notification for the assigned approver, or fallback to Admins
            let targetUserIds: string[] = [];
            if (approverId) {
                targetUserIds = [approverId];
            } else {
                const { data: admins } = await supabase.from('profiles').select('id').eq('role', 'ADMIN');
                targetUserIds = (admins || []).map(a => a.id);
            }

            if (targetUserIds.length > 0) {
                const notifications = targetUserIds.map(targetId => ({
                    user_id: targetId,
                    type: 'APPROVAL_REQ',
                    title: '📅 คำขอเลื่อน Deadline เป้าหมาย',
                    message: `คุณ ${currentUser.name} ขอเลื่อนเป้าหมาย: "${reason.substring(0, 50)}${reason.length > 50 ? '...' : ''}"`,
                    related_id: goalId,
                    link_path: 'GOALS'
                }));
                await supabase.from('notifications').insert(notifications);
            }

            const approverProfile = data.approver ? (Array.isArray(data.approver) ? data.approver[0] : data.approver) : undefined;

            return { 
                success: true, 
                data: {
                    id: data.id,
                    goalId: data.goal_id,
                    requestedBy: data.requested_by,
                    approverId: data.resolved_by || undefined,
                    newDeadline: new Date(data.new_deadline),
                    reason: data.reason,
                    status: data.status,
                    createdAt: new Date(data.created_at),
                    user: { name: currentUser.name, avatarUrl: currentUser.avatarUrl || '' },
                    approver: approverProfile ? { name: approverProfile.full_name, avatarUrl: approverProfile.avatar_url, position: approverProfile.position } : undefined
                }
            };
        } catch (err: any) {
            console.error('Error creating goal request:', err);
            return { success: false, error: err.message };
        } finally {
            setIsLoading(false);
        }
    }, [currentUser]);

    // 4. Resolve a Request (Admin)
    const resolveRequest = useCallback(async (requestId: string, goalId: string, isApproved: boolean, newDate?: Date): Promise<{ success: boolean; error?: string }> => {
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
            return { success: false, error: `Unauthorized (User Role: ${userRole || 'NONE'})` };
        }

        try {
            setIsLoading(true);
            const status = isApproved ? 'APPROVED' : 'REJECTED';
            
            // Update Request Status
            const { error: reqError } = await supabase
                .from('goal_deadline_requests')
                .update({ 
                    status,
                    resolved_at: new Date().toISOString(),
                    resolved_by: userId
                })
                .eq('id', requestId);
                
            if (reqError) throw reqError;

            // If Approved, update Goal Deadline and increment extension count
            if (isApproved && newDate) {
                // First get current extension_count
                const { data: goalData } = await supabase
                    .from('goals')
                    .select('extension_count')
                    .eq('id', goalId)
                    .maybeSingle();

                const currentCount = goalData?.extension_count || 0;

                const { error: goalError } = await supabase
                    .from('goals')
                    .update({ 
                        deadline: newDate.toISOString(),
                        extension_count: currentCount + 1
                    })
                    .eq('id', goalId);
                
                if (goalError) throw goalError;
            }

            return { success: true };
        } catch (err: any) {
            console.error('Error resolving goal request:', err);
            return { success: false, error: err.message };
        } finally {
            setIsLoading(false);
        }
    }, [currentUser]);

    return {
        isLoading,
        getPendingRequestForGoal,
        getAllPendingRequests,
        createRequest,
        resolveRequest
    };
};
