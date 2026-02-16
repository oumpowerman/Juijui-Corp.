
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { TaskComment, User, TaskType } from '../types';
import { useToast } from '../context/ToastContext';

export const useTaskComments = (taskId: string | undefined, taskType: TaskType = 'TASK', currentUser: User | undefined) => {
    const [comments, setComments] = useState<TaskComment[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { showToast } = useToast();

    // Determine the correct DB column based on Task Type
    const foreignKey = taskType === 'CONTENT' ? 'content_id' : 'task_id';

    // Helper to map DB to Type
    const mapComment = (data: any): TaskComment => ({
        id: data.id,
        taskId: data.task_id || data.content_id, // Map either ID
        userId: data.user_id,
        content: data.content,
        createdAt: new Date(data.created_at),
        user: data.profiles ? {
            id: data.profiles.id,
            name: data.profiles.full_name,
            avatarUrl: data.profiles.avatar_url,
            role: data.profiles.role,
            position: data.profiles.position,
            email: data.profiles.email,
            isApproved: true,
            isActive: true,
            xp: data.profiles.xp || 0,
            level: data.profiles.level || 1,
            availablePoints: data.profiles.available_points || 0,
            hp: data.profiles.hp || 100,
            maxHp: data.profiles.max_hp || 100,
            workStatus: data.profiles.work_status || 'ONLINE'
        } : undefined
    });

    const fetchComments = async () => {
        if (!taskId) return;
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('task_comments')
                .select(`
                    *,
                    profiles (id, full_name, avatar_url, role, position, email, xp, level, available_points, hp, max_hp, work_status)
                `)
                .eq(foreignKey, taskId)
                .order('created_at', { ascending: true });

            if (error) throw error;
            
            if (data) {
                setComments(data.map(mapComment));
            }
        } catch (err: any) {
            console.error('Error fetching comments:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const sendComment = async (content: string) => {
        if (!taskId || !currentUser || !content.trim()) return;

        try {
            // 1. Insert Comment with Dynamic FK
            const payload = {
                user_id: currentUser.id,
                content: content.trim(),
                [foreignKey]: taskId // Dynamic Key: content_id or task_id
            };

            const { error } = await supabase.from('task_comments').insert(payload);
            if (error) throw error;

            // 2. NOTIFICATION LOGIC
            // Fetch relevant data to notify participants
            let recipients = new Set<string>();
            let title = '';

            if (taskType === 'CONTENT') {
                const { data } = await supabase.from('contents').select('assignee_ids, idea_owner_ids, editor_ids, title').eq('id', taskId).maybeSingle();
                if (data) {
                    title = data.title;
                    [...(data.assignee_ids||[]), ...(data.idea_owner_ids||[]), ...(data.editor_ids||[])].forEach(id => recipients.add(id));
                }
            } else {
                const { data } = await supabase.from('tasks').select('assignee_ids, title').eq('id', taskId).maybeSingle();
                if (data) {
                    title = data.title;
                    (data.assignee_ids || []).forEach((id: string) => recipients.add(id));
                }
            }

            recipients.delete(currentUser.id); // Don't notify self

            if (recipients.size > 0) {
                const notifications = Array.from(recipients).map(uid => ({
                        user_id: uid,
                        type: 'INFO',
                        title: `💬 คอมเมนต์ใหม่: ${title.substring(0, 20)}...`,
                        message: `${currentUser.name}: ${content.substring(0, 50)}...`,
                        related_id: taskId,
                        link_path: 'STOCK', // Generic link
                        is_read: false
                }));
                await supabase.from('notifications').insert(notifications);
            }
            
        } catch (err: any) {
            console.error(err);
            showToast('ส่งคอมเมนต์ไม่สำเร็จ', 'error');
        }
    };

    // Realtime Subscription
    useEffect(() => {
        if (!taskId) return;

        const channel = supabase
            .channel(`comments-${taskId}`)
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'task_comments', filter: `${foreignKey}=eq.${taskId}` },
                async (payload) => {
                    const newId = payload.new.id;
                    const { data } = await supabase
                        .from('task_comments')
                        .select(`*, profiles (id, full_name, avatar_url, role, position, email, xp, level, available_points, hp, max_hp, work_status)`)
                        .eq('id', newId)
                        .single();

                    if (data) {
                        setComments(prev => [...prev, mapComment(data)]);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [taskId, foreignKey]);

    // Initial Fetch
    useEffect(() => {
        if (taskId) {
            fetchComments();
        } else {
            setComments([]);
        }
    }, [taskId, foreignKey]);

    return {
        comments,
        isLoading,
        sendComment
    };
};
