
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { FeedbackItem, FeedbackType, FeedbackStatus, User } from '../types';
import { useToast } from '../context/ToastContext';

export const useFeedback = (currentUser: User) => {
    const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { showToast } = useToast();

    const fetchFeedbacks = async () => {
        // Don't set loading to true on background refetches to avoid flickering
        if (feedbacks.length === 0) setIsLoading(true);
        
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
            const payload = {
                content,
                type,
                is_anonymous: isAnonymous,
                user_id: currentUser.id,
                status: 'PENDING',
                vote_count: 0
            };

            const { error } = await supabase.from('feedbacks').insert(payload);
            if (error) throw error;

            // --- NOTIFY ADMINS ---
            const { data: admins } = await supabase.from('profiles').select('id').eq('role', 'ADMIN');
            if (admins && admins.length > 0) {
                 const notifTitle = type === 'ISSUE' ? '🚨 รายงานปัญหา (Private)' : '💡 ความคิดเห็นใหม่';
                 const notifications = admins.map(admin => ({
                    user_id: admin.id,
                    type: 'INFO',
                    title: notifTitle,
                    message: `${isAnonymous ? 'Anonymous' : currentUser.name}: ${content.substring(0, 50)}...`,
                    is_read: false,
                    link_path: 'FEEDBACK'
                }));
                await supabase.from('notifications').insert(notifications);
            }

            showToast('ส่งความคิดเห็นแล้ว! รอแอดมินตรวจสอบครับ 📨', 'success');
            return true;
        } catch (err: any) {
            showToast('ส่งไม่สำเร็จ: ' + err.message, 'error');
            return false;
        }
    };

    const toggleVote = async (id: string, currentStatus: boolean) => {
        // 1. Optimistic Update (เปลี่ยนหน้าเว็บทันที)
        setFeedbacks(prev => prev.map(f => {
            if (f.id === id) {
                return {
                    ...f,
                    hasVoted: !currentStatus,
                    voteCount: currentStatus ? f.voteCount - 1 : f.voteCount + 1
                };
            }
            return f;
        }));

        try {
            if (currentStatus) {
                // UI says Voted -> Remove Vote
                const { error } = await supabase.from('feedback_votes').delete().eq('feedback_id', id).eq('user_id', currentUser.id);
                if (error) throw error;
            } else {
                // UI says Not Voted -> Add Vote
                const { error } = await supabase.from('feedback_votes').insert({ feedback_id: id, user_id: currentUser.id });
                
                // Handle Duplicate Key Error (Race Condition or Sync Issue)
                if (error) {
                    if (error.code === '23505') {
                        console.warn("Vote exists (Sync Issue), toggling OFF instead.");
                        // If insert fails because it exists, perform DELETE instead
                        await supabase.from('feedback_votes').delete().eq('feedback_id', id).eq('user_id', currentUser.id);
                        
                        // Force refresh to correct the count if optimistic update was wrong direction
                        fetchFeedbacks(); 
                    } else {
                        throw error;
                    }
                }
            }
        } catch (err: any) {
            console.error('Toggle vote error:', err);
            // Revert optimistic update on error (Rollback)
            setFeedbacks(prev => prev.map(f => {
                if (f.id === id) {
                    return {
                        ...f,
                        hasVoted: currentStatus, // Revert to original
                        voteCount: currentStatus ? f.voteCount + 1 : f.voteCount - 1 // Revert count
                    };
                }
                return f;
            }));
            showToast('ทำรายการไม่สำเร็จ: ' + err.message, 'error');
        }
    };

    const updateStatus = async (id: string, status: FeedbackStatus) => {
        try {
            await supabase.from('feedbacks').update({ status }).eq('id', id);
            showToast(`อัปเดตสถานะเป็น ${status} แล้ว`, 'info');
            // Optimistic update for status
            setFeedbacks(prev => prev.map(f => f.id === id ? { ...f, status } : f));
        } catch (err) {
            showToast('อัปเดตไม่สำเร็จ', 'error');
        }
    };

    const deleteFeedback = async (id: string) => {
        if(!confirm('ลบข้อความนี้?')) return;
        try {
            await supabase.from('feedbacks').delete().eq('id', id);
            showToast('ลบเรียบร้อย', 'info');
            // Optimistic delete
            setFeedbacks(prev => prev.filter(f => f.id !== id));
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
