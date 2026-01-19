
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { TaskComment, User } from '../types';
import { useToast } from '../context/ToastContext';

export const useTaskComments = (taskId: string | undefined, currentUser: User | undefined) => {
    const [comments, setComments] = useState<TaskComment[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { showToast } = useToast();

    // Helper to map DB to Type
    const mapComment = (data: any): TaskComment => ({
        id: data.id,
        taskId: data.task_id,
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
            availablePoints: data.profiles.available_points || 0
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
                    profiles (id, full_name, avatar_url, role, position, email, xp, level, available_points)
                `)
                .eq('task_id', taskId)
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
            const payload = {
                task_id: taskId,
                user_id: currentUser.id,
                content: content.trim()
            };

            const { error } = await supabase.from('task_comments').insert(payload);
            if (error) throw error;
            
            // Note: Realtime subscription will handle the UI update
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
                { event: 'INSERT', schema: 'public', table: 'task_comments', filter: `task_id=eq.${taskId}` },
                async (payload) => {
                    const newId = payload.new.id;
                    // Fetch full data for the new comment (to get profile)
                    const { data } = await supabase
                        .from('task_comments')
                        .select(`*, profiles (id, full_name, avatar_url, role, position, email, xp, level, available_points)`)
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
    }, [taskId]);

    // Initial Fetch
    useEffect(() => {
        if (taskId) {
            fetchComments();
        } else {
            setComments([]);
        }
    }, [taskId]);

    return {
        comments,
        isLoading,
        sendComment
    };
};
