import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '../types';
import { format } from 'date-fns';

export interface SidebarBadges {
    qualityGate: number;
    feedback: number;
    memberApproval: number;
    myDuty: number;
}

export const useSidebarBadges = (currentUser: User) => {
    const [badges, setBadges] = useState<SidebarBadges>({
        qualityGate: 0,
        feedback: 0,
        memberApproval: 0,
        myDuty: 0
    });

    const fetchBadges = async () => {
        if (!currentUser) return;
        const isAdmin = currentUser.role === 'ADMIN';
        const todayStr = format(new Date(), 'yyyy-MM-dd');

        try {
            // 1. Quality Gate Logic (Pending Reviews)
            let qgQuery = supabase.from('task_reviews').select('id, task:tasks!inner(assignee_ids, idea_owner_ids, editor_ids)', { count: 'exact', head: false }).eq('status', 'PENDING');
            
            const { data: qgData } = await qgQuery;
            let qgCount = 0;
            
            if (qgData) {
                if (isAdmin) {
                    qgCount = qgData.length;
                } else {
                    // Filter for member involvement
                    qgCount = qgData.filter((r: any) => {
                         const t = r.task;
                         if (!t) return false;
                         return (t.assignee_ids || []).includes(currentUser.id) || 
                                (t.idea_owner_ids || []).includes(currentUser.id) ||
                                (t.editor_ids || []).includes(currentUser.id);
                    }).length;
                }
            }

            // 2. Feedback Logic (Voice of Team)
            // Admin sees Pending.
            let fbCount = 0;
            if (isAdmin) {
                const { count } = await supabase
                    .from('feedbacks')
                    .select('id', { count: 'exact', head: true })
                    .eq('status', 'PENDING');
                fbCount = count || 0;
            }

            // 3. Member Approval (Admin Only)
            let maCount = 0;
            if (isAdmin) {
                const { count } = await supabase
                    .from('profiles')
                    .select('id', { count: 'exact', head: true })
                    .eq('is_approved', false);
                maCount = count || 0;
            }

            // 4. My Duty (Today & Not Done)
            // Shows a badge if I have a duty today that isn't done
            const { count: dutyCount } = await supabase.from('duties')
                .select('id', { count: 'exact', head: true })
                .eq('assignee_id', currentUser.id)
                .eq('date', todayStr)
                .eq('is_done', false);

            setBadges({
                qualityGate: qgCount,
                feedback: fbCount,
                memberApproval: maCount,
                myDuty: dutyCount || 0
            });

        } catch (err) {
            console.error("Error fetching sidebar badges:", err);
        }
    };

    // Realtime Subscriptions
    useEffect(() => {
        fetchBadges();

        const channel = supabase.channel('sidebar-badges-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'task_reviews' }, fetchBadges)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'feedbacks' }, fetchBadges)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchBadges)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'duties' }, fetchBadges)
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [currentUser.id]);

    return { badges };
};  