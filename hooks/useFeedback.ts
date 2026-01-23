
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { FeedbackItem, FeedbackType, FeedbackStatus, User } from '../types';
import { useToast } from '../context/ToastContext';

export const useFeedback = (currentUser: User) => {
    const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { showToast } = useToast();

    const fetchFeedbacks = async () => {
        setIsLoading(true);
        try {
            // 1. Fetch Feedbacks
            const { data, error } = await supabase
                .from('feedbacks')
                .select(`
                    *,
                    profiles (full_name, avatar_url),
                    feedback_votes (user_id)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (data) {
                // Map and Calculate Votes/Ownership
                const mapped: FeedbackItem[] = data.map((item: any) => {
                    const votes = item.feedback_votes || [];
                    const hasVoted = votes.some((v: any) => v.user_id === currentUser.id);
                    
                    return {
                        id: item.id,
                        type: item.type as FeedbackType,
                        content: item.content,
                        status: item.status as FeedbackStatus,
                        isAnonymous: item.is_anonymous,
                        createdAt: new Date(item.created_at),
                        voteCount: votes.length, // Use actual count from relation
                        hasVoted: hasVoted,
                        creatorName: !item.is_anonymous && item.profiles ? item.profiles.full_name : undefined,
                        creatorAvatar: !item.is_anonymous && item.profiles ? item.profiles.avatar_url : undefined
                    };
                });
                setFeedbacks(mapped);
            }
        } catch (err: any) {
            console.error('Fetch feedback failed:', err);
        } finally {
            setIsLoading(false);
        }
    };

    // Realtime
    useEffect(() => {
        fetchFeedbacks();
        const channel = supabase.channel('realtime-feedbacks')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'feedbacks' }, () => fetchFeedbacks())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'feedback_votes' }, () => fetchFeedbacks())
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, []);

    const submitFeedback = async (content: string, type: FeedbackType, isAnonymous: boolean) => {
        try {
            // If Shoutout, force NOT anonymous (usually), but let's respect the toggle
            // If Direct to Admin (ISSUE), logic handles it via status usually, but here we treat types.
            
            const payload = {
                content,
                type,
                is_anonymous: isAnonymous,
                user_id: currentUser.id,
                status: 'PENDING', // Always pending first for moderation
                vote_count: 0
            };

            const { error } = await supabase.from('feedbacks').insert(payload);
            if (error) throw error;

            showToast('ส่งความคิดเห็นแล้ว! รอแอดมินตรวจสอบครับ 📨', 'success');
            return true;
        } catch (err: any) {
            showToast('ส่งไม่สำเร็จ: ' + err.message, 'error');
            return false;
        }
    };

    const toggleVote = async (id: string, currentStatus: boolean) => {
        try {
            if (currentStatus) {
                // Remove Vote
                await supabase.from('feedback_votes').delete().eq('feedback_id', id).eq('user_id', currentUser.id);
            } else {
                // Add Vote
                await supabase.from('feedback_votes').insert({ feedback_id: id, user_id: currentUser.id });
            }
            // Realtime will update UI
        } catch (err) {
            console.error(err);
        }
    };

    const updateStatus = async (id: string, status: FeedbackStatus) => {
        try {
            await supabase.from('feedbacks').update({ status }).eq('id', id);
            showToast(`อัปเดตสถานะเป็น ${status} แล้ว`, 'info');
        } catch (err) {
            showToast('อัปเดตไม่สำเร็จ', 'error');
        }
    };

    const deleteFeedback = async (id: string) => {
        if(!confirm('ลบข้อความนี้?')) return;
        try {
            await supabase.from('feedbacks').delete().eq('id', id);
            showToast('ลบเรียบร้อย', 'info');
        } catch (err) {
            showToast('ลบไม่สำเร็จ', 'error');
        }
    };

    return {
        feedbacks,
        isLoading,
        submitFeedback,
        toggleVote,
        updateStatus,
        deleteFeedback
    };
};
