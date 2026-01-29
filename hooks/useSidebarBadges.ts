
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '../types';
import { isAfter } from 'date-fns';

interface SidebarBadges {
    qualityGate: number;
    feedback: number;
    meeting: number;
}

export const useSidebarBadges = (currentUser: User) => {
    const [badges, setBadges] = useState<SidebarBadges>({
        qualityGate: 0,
        feedback: 0,
        meeting: 0
    });

    // Keys for LocalStorage
    const MEETING_VIEW_KEY = `juijui_last_view_meeting_${currentUser.id}`;

    const fetchBadges = async () => {
        if (!currentUser) return;

        try {
            // 1. Quality Gate Logic
            // Admin sees ALL Pending. Users see Pending where they are involved.
            let query = supabase
                .from('task_reviews')
                .select('id, task:tasks!task_reviews_task_id_fkey(assignee_ids, idea_owner_ids)', { count: 'exact', head: false }) // Select count
                .eq('status', 'PENDING');

            const { data: reviewData, error: reviewError } = await query;
            
            let qualityCount = 0;
            if (!reviewError && reviewData) {
                if (currentUser.role === 'ADMIN') {
                    qualityCount = reviewData.length;
                } else {
                    // Filter locally for simplicity (or use complex query)
                    qualityCount = reviewData.filter((r: any) => {
                        const t = r.task;
                        if (!t) return false;
                        const assignees = t.assignee_ids || [];
                        const owners = t.idea_owner_ids || [];
                        return assignees.includes(currentUser.id) || owners.includes(currentUser.id);
                    }).length;
                }
            }

            // 2. Feedback Logic
            // Admin sees Pending. Users see Approved created in last 24h.
            let feedbackQuery = supabase.from('feedbacks').select('id', { count: 'exact', head: true });
            
            if (currentUser.role === 'ADMIN') {
                feedbackQuery = feedbackQuery.eq('status', 'PENDING');
            } else {
                const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
                feedbackQuery = feedbackQuery.eq('status', 'APPROVED').gt('created_at', yesterday);
            }
            const { count: feedbackCount } = await feedbackQuery;

            // 3. Meeting Logic
            // New meetings created AFTER last view time AND user is attendee
            const lastViewedMeeting = localStorage.getItem(MEETING_VIEW_KEY);
            // Default to 7 days ago if never viewed, to avoid notification bomb on first load
            const checkTime = lastViewedMeeting || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

            const { count: meetingCount } = await supabase
                .from('meeting_logs')
                .select('id', { count: 'exact', head: true })
                .gt('created_at', checkTime)
                .contains('attendees', [currentUser.id]); // Check if user ID is in array

            setBadges({
                qualityGate: qualityCount,
                feedback: feedbackCount || 0,
                meeting: meetingCount || 0
            });

        } catch (err) {
            console.error("Error fetching badges:", err);
        }
    };

    // Realtime Subscriptions
    useEffect(() => {
        fetchBadges();

        const channel = supabase
            .channel('sidebar-badges')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'task_reviews' }, fetchBadges)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'feedbacks' }, fetchBadges)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'meeting_logs' }, fetchBadges)
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [currentUser.id]);

    // Action to clear badge
    const markAsViewed = (type: 'MEETING') => {
        if (type === 'MEETING') {
            localStorage.setItem(MEETING_VIEW_KEY, new Date().toISOString());
            setBadges(prev => ({ ...prev, meeting: 0 }));
        }
    };

    return { badges, markAsViewed };
};
