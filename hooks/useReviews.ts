
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
            // Join with BOTH Tasks and Contents to handle both types
            // Select specific fields to ensure we get caution, importance, etc.
            const { data, error } = await supabase
                .from('task_reviews')
                .select(`
                    *,
                    tasks (
                        *
                    ),
                    contents (
                        *
                    )
                `)
                // SORT CHANGE: Ascending (Oldest first) to prioritize overdue tasks
                .order('scheduled_at', { ascending: true }); 

            if (error) throw error;

            if (data) {
                const mappedReviews: ReviewSession[] = data.map((r: any) => {
                    // Determine which table holds the data
                    const sourceData = r.tasks || r.contents;
                    
                    // Default fallback if data is missing (orphaned review)
                    if (!sourceData) return null;

                    return {
                        id: r.id,
                        taskId: r.task_id || r.content_id, // Support both IDs
                        round: r.round,
                        scheduledAt: new Date(r.scheduled_at),
                        reviewerId: r.reviewer_id,
                        status: r.status,
                        feedback: r.feedback,
                        isCompleted: r.is_completed,
                        task: {
                            id: sourceData.id,
                            title: sourceData.title,
                            description: sourceData.description,
                            status: sourceData.status,
                            channelId: sourceData.channel_id,
                            startDate: new Date(sourceData.start_date),
                            endDate: new Date(sourceData.end_date),
                            // Map People
                            assigneeIds: sourceData.assignee_ids || [],
                            ideaOwnerIds: sourceData.idea_owner_ids || [],
                            editorIds: sourceData.editor_ids || [],
                            assigneeType: sourceData.assignee_type,
                            type: r.contents ? 'CONTENT' : 'TASK', // Determine type by source
                            assets: sourceData.assets || [],
                            // Map Details
                            caution: sourceData.caution,
                            importance: sourceData.importance,
                            difficulty: sourceData.difficulty || 'MEDIUM',
                            estimatedHours: sourceData.estimated_hours || 0
                        } as any
                    };
                }).filter(Boolean) as ReviewSession[]; // Filter out nulls

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
                    is_completed: status === 'PASSED' // Auto complete if passed
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
