
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { ScriptComment } from '../types';
import { useToast } from '../context/ToastContext';

export const useScriptComments = (scriptId: string) => {
    const [comments, setComments] = useState<ScriptComment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { showToast } = useToast();

    const fetchComments = useCallback(async () => {
        if (!scriptId) return;
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('script_comments')
                .select(`
                    *,
                    profiles(full_name, avatar_url)
                `)
                .eq('script_id', scriptId)
                .order('created_at', { ascending: true }); // Oldest first for thread-like feel

            if (error) throw error;

            if (data) {
                setComments(data.map((c: any) => ({
                    id: c.id,
                    scriptId: c.script_id,
                    userId: c.user_id,
                    content: c.content,
                    selectedText: c.selected_text,
                    highlightId: c.highlight_id,
                    status: c.status,
                    createdAt: new Date(c.created_at),
                    user: c.profiles ? {
                        name: c.profiles.full_name,
                        avatarUrl: c.profiles.avatar_url
                    } : undefined
                })));
            }
        } catch (err) {
            console.error("Fetch comments failed", err);
        } finally {
            setIsLoading(false);
        }
    }, [scriptId]);

    // Realtime
    useEffect(() => {
        fetchComments();
        const channel = supabase.channel(`comments:${scriptId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'script_comments', filter: `script_id=eq.${scriptId}` }, () => fetchComments())
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [scriptId, fetchComments]);

    const addComment = async (
        userId: string, 
        content: string, 
        highlightId?: string, 
        selectedText?: string
    ) => {
        try {
            const { data, error } = await supabase.from('script_comments').insert({
                script_id: scriptId,
                user_id: userId,
                content,
                highlight_id: highlightId || null,
                selected_text: selectedText || null,
                status: 'OPEN'
            })
            .select(`
                *,
                profiles(full_name, avatar_url)
            `)
            .single();

            if (error) throw error;

            if (data) {
                // 2. Manual Update State immediately
                const newComment: ScriptComment = {
                    id: data.id,
                    scriptId: data.script_id,
                    userId: data.user_id,
                    content: data.content,
                    selectedText: data.selected_text,
                    highlightId: data.highlight_id,
                    status: data.status,
                    createdAt: new Date(data.created_at),
                    user: data.profiles ? {
                        name: data.profiles.full_name,
                        avatarUrl: data.profiles.avatar_url
                    } : undefined
                };
                
                setComments(prev => [...prev, newComment]);
            }
            
            // 3. Optional Refresh to be sure
            fetchComments();
            
            return true;
        } catch (err: any) {
            showToast('ส่งคอมเมนต์ไม่สำเร็จ: ' + err.message, 'error');
            return false;
        }
    };

    const resolveComment = async (commentId: string) => {
        // Optimistic Update: Update local state immediately
        const previousComments = [...comments];
        setComments(prev => prev.map(c => 
            c.id === commentId ? { ...c, status: 'RESOLVED' } : c
        ));

        try {
            const { error } = await supabase
                .from('script_comments')
                .update({ status: 'RESOLVED' })
                .eq('id', commentId);

            if (error) throw error;
            showToast('Marked as resolved', 'success');
        } catch (err: any) {
            console.error(err);
            // Rollback on error
            setComments(previousComments);
            showToast('อัปเดตสถานะไม่สำเร็จ: ' + err.message, 'error');
        }
    };

    const deleteComment = async (commentId: string) => {
        // Optimistic Update: Remove from local state immediately
        const previousComments = [...comments];
        setComments(prev => prev.filter(c => c.id !== commentId));

        try {
            const { error } = await supabase.from('script_comments').delete().eq('id', commentId);
            if (error) throw error;
            showToast('ลบคอมเมนต์แล้ว', 'info');
        } catch (err: any) {
            console.error(err);
            // Rollback on error
            setComments(previousComments);
            showToast('ลบไม่สำเร็จ: ' + err.message, 'error');
        }
    };

    return {
        comments,
        isLoading,
        addComment,
        resolveComment,
        deleteComment
    };
};
