
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ReviewSession, ReviewStatus } from '../types';
import { useToast } from '../context/ToastContext';

export const useReviews = () => {
    const [reviews, setReviews] = useState<ReviewSession[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { showToast } = useToast();

    const fetchReviews = async () => {
        setIsLoading(true);
        try {
            // Join with Tasks to get Title
            const { data, error } = await supabase
                .from('task_reviews')
                .select(`
                    *,
                    tasks (
                        id, title, status, channel_id, start_date, end_date
                    )
                `)
                .order('scheduled_at', { ascending: true });

            if (error) throw error;

            if (data) {
                const mappedReviews: ReviewSession[] = data.map((r: any) => ({
                    id: r.id,
                    taskId: r.task_id,
                    round: r.round,
                    scheduledAt: new Date(r.scheduled_at),
                    reviewerId: r.reviewer_id,
                    status: r.status,
                    feedback: r.feedback,
                    isCompleted: r.is_completed,
                    task: r.tasks ? {
                        id: r.tasks.id,
                        title: r.tasks.title,
                        status: r.tasks.status,
                        channelId: r.tasks.channel_id,
                        startDate: new Date(r.tasks.start_date),
                        endDate: new Date(r.tasks.end_date),
                        // ... basic task info needed for display
                    } as any : undefined
                }));
                setReviews(mappedReviews);
            }
        } catch (err: any) {
            console.error(err);
            // showToast('โหลดข้อมูลตรวจงานไม่สำเร็จ', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const updateReviewStatus = async (reviewId: string, status: ReviewStatus, feedback?: string) => {
        try {
            const { error } = await supabase
                .from('task_reviews')
                .update({ 
                    status, 
                    feedback,
                    is_completed: status === 'PASSED' // Auto complete if passed? Or separate? Let's keep flexible.
                })
                .eq('id', reviewId);

            if (error) throw error;

            setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, status, feedback } : r));
            showToast(status === 'PASSED' ? 'อนุมัติงานแล้ว! ✅' : 'ส่งกลับแก้ไขแล้ว 🛠️', status === 'PASSED' ? 'success' : 'warning');
        } catch (err: any) {
            showToast('อัปเดตไม่สำเร็จ: ' + err.message, 'error');
        }
    };

    // Realtime
    useEffect(() => {
        const channel = supabase
            .channel('realtime-reviews')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'task_reviews' },
                () => { fetchReviews(); }
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

    useEffect(() => {
        fetchReviews();
    }, []);

    return {
        reviews,
        isLoading,
        updateReviewStatus,
        fetchReviews
    };
};
