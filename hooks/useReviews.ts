
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { ReviewSession, ReviewStatus } from '../types';
import { useToast } from '../context/ToastContext';

export const useReviews = () => {
    const [reviews, setReviews] = useState<ReviewSession[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [highlightedId, setHighlightedId] = useState<string | null>(null);
    const { showToast } = useToast();
    const isFirstLoad = useRef(true);

    const fetchReviews = useCallback(async (isBackground = false) => {
        if (isFirstLoad.current) setIsLoading(true);
        
        try {
            const { data, error } = await supabase
                .from('task_reviews')
                .select(`
                    *,
                    tasks (*),
                    contents (*)
                `)
                .order('scheduled_at', { ascending: true }); 

            if (error) throw error;

            if (data) {
                const mappedReviews: ReviewSession[] = data.map((r: any) => {
                    const sourceData = r.tasks || r.contents;
                    if (!sourceData) return null;

                    return {
                        id: r.id,
                        taskId: r.task_id || r.content_id,
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
                            assigneeIds: sourceData.assignee_ids || [],
                            ideaOwnerIds: sourceData.idea_owner_ids || [],
                            editorIds: sourceData.editor_ids || [],
                            assigneeType: sourceData.assignee_type,
                            type: r.contents ? 'CONTENT' : 'TASK',
                            assets: sourceData.assets || [],
                            targetPosition: sourceData.target_position,
                            caution: sourceData.caution,
                            importance: sourceData.importance,
                            difficulty: sourceData.difficulty || 'MEDIUM',
                            estimatedHours: sourceData.estimated_hours || 0
                        } as any
                    };
                }).filter(Boolean) as ReviewSession[];

                setReviews(mappedReviews);
            }
        } catch (err: any) {
            console.error('Fetch reviews error:', err);
        } finally {
            setIsLoading(false);
            isFirstLoad.current = false;
        }
    }, []);

    const updateReviewStatus = async (reviewId: string, status: ReviewStatus, feedback?: string, reviewerId?: string) => {
        try {
            const payload: any = { 
                status, 
                feedback,
                is_completed: status === 'PASSED'
            };

            if (reviewerId) payload.reviewer_id = reviewerId;

            const { error } = await supabase
                .from('task_reviews')
                .update(payload)
                .eq('id', reviewId);

            if (error) throw error;
            setHighlightedId(reviewId);
            showToast(status === 'PASSED' ? 'อนุมัติงานแล้ว! ✅' : 'ส่งกลับแก้ไขแล้ว 🛠️', status === 'PASSED' ? 'success' : 'warning');
        } catch (err: any) {
            showToast('อัปเดตไม่สำเร็จ: ' + err.message, 'error');
        }
    };

    // --- REALTIME ORCHESTRATOR ---
    useEffect(() => {
        fetchReviews();

        const channel = supabase
            .channel('quality-gate-realtime')
            // Listen to Review Changes (New submissions, Pass/Revise)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'task_reviews' }, (payload) => {
                if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                    setHighlightedId(payload.new.id);
                    // Clear highlight after 5 seconds
                    setTimeout(() => setHighlightedId(null), 5000);
                }
                fetchReviews(true);
            })
            // Listen to Task details change (Title, Caution)
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tasks' }, () => {
                fetchReviews(true);
            })
            // Listen to Content details change
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'contents' }, () => {
                fetchReviews(true);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchReviews]);

    return {
        reviews,
        isLoading,
        highlightedId,
        updateReviewStatus,
        fetchReviews
    };
};
