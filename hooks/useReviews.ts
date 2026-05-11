
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
        if (isFirstLoad.current && !isBackground) setIsLoading(true);
        
        try {
            const { data, error } = await supabase
                .from('task_reviews')
                .select(`
                    *,
                    tasks (*),
                    contents (*)
                `)
                .order('scheduled_at', { ascending: false })
                .limit(100); 

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
                        submissionNotes: r.submission_notes,
                        qualityScore: r.quality_score,
                        feedbackCategories: r.feedback_categories || [],
                        submissionAssetUrl: r.submission_asset_url,
                        manualBonus: r.manual_bonus,
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
                            estimatedHours: sourceData.estimated_hours || 0,
                            sla_revert_count: sourceData.sla_revert_count || 0
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

    // --- NEW: FETCH SINGLE REVIEW (For Realtime Optimization) ---
    const fetchSingleReview = useCallback(async (id: string) => {
        try {
            const { data, error } = await supabase
                .from('task_reviews')
                .select(`
                    *,
                    tasks (*),
                    contents (*)
                `)
                .eq('id', id)
                .single();

            if (error || !data) return;

            const sourceData = data.tasks || data.contents;
            if (!sourceData) return;

            const mapped: ReviewSession = {
                id: data.id,
                taskId: data.task_id || data.content_id,
                round: data.round,
                scheduledAt: new Date(data.scheduled_at),
                reviewerId: data.reviewer_id,
                status: data.status,
                feedback: data.feedback,
                isCompleted: data.is_completed,
                submissionNotes: data.submission_notes,
                qualityScore: data.quality_score,
                feedbackCategories: data.feedback_categories || [],
                submissionAssetUrl: data.submission_asset_url,
                manualBonus: data.manual_bonus,
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
                    type: data.contents ? 'CONTENT' : 'TASK',
                    assets: sourceData.assets || [],
                    targetPosition: sourceData.target_position,
                    caution: sourceData.caution,
                    importance: sourceData.importance,
                    difficulty: sourceData.difficulty || 'MEDIUM',
                    estimatedHours: sourceData.estimated_hours || 0,
                    sla_revert_count: sourceData.sla_revert_count || 0
                } as any
            };

            setReviews(prev => {
                const exists = prev.find(r => r.id === id);
                if (exists) {
                    return prev.map(r => r.id === id ? mapped : r);
                }
                return [mapped, ...prev]; // Prepend new items
            });
        } catch (err) {
            console.error("Single Review Fetch Error:", err);
        }
    }, []);

    const updateReviewStatus = async (
        reviewId: string, 
        status: ReviewStatus, 
        feedback?: string, 
        reviewerId?: string,
        qualityScore?: number,
        categories?: string[],
        manualBonus?: number
    ) => {
        try {
            const payload: any = { 
                status, 
                feedback,
                is_completed: status === 'PASSED',
                quality_score: qualityScore,
                feedback_categories: categories,
                manual_bonus: manualBonus
            };

            if (reviewerId) payload.reviewer_id = reviewerId;

            const { error } = await supabase
                .from('task_reviews')
                .update(payload)
                .eq('id', reviewId);

            if (error) throw error;
            
            // Optimistic update local state for UI responsiveness
            setReviews(prev => prev.map(r => 
                r.id === reviewId ? { ...r, status, feedback, isCompleted: status === 'PASSED', reviewerId: reviewerId || r.reviewerId, manualBonus: manualBonus ?? r.manualBonus } : r
            ));

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
            .channel('quality-gate-realtime-surgical')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'task_reviews' }, (payload) => {
                if (payload.eventType === 'DELETE') {
                    setReviews(prev => prev.filter(r => r.id !== payload.old.id));
                } else if (payload.new && payload.new.id) {
                    // Surgical Fetch & Update
                    fetchSingleReview(payload.new.id);
                }
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tasks' }, (payload) => {
                // If a task is updated, we might need to update reviews that point to it
                setReviews(prev => prev.map(r => {
                    if (r.taskId === payload.new.id) {
                        return { ...r, task: { ...r.task, ...payload.new } as any };
                    }
                    return r;
                }));
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'contents' }, (payload) => {
                setReviews(prev => prev.map(r => {
                    if (r.taskId === payload.new.id) {
                        return { ...r, task: { ...r.task, ...payload.new } as any };
                    }
                    return r;
                }));
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchReviews, fetchSingleReview]);

    return {
        reviews,
        setReviews, // Export for optimistic manual updates
        isLoading,
        highlightedId,
        updateReviewStatus,
        fetchReviews
    };
};
