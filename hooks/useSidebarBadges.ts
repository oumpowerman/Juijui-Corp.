
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '../types';
import { format } from 'date-fns';

export interface SidebarBadges {
    qualityGate: number;
    feedback: number;
    memberApproval: number;
    myDuty: number;
    attendanceApproval: number;
    financeTrip: number; // NEW: Finance Trip Badge
}

export const useSidebarBadges = (currentUser: User) => {
    const [badges, setBadges] = useState<SidebarBadges>({
        qualityGate: 0,
        feedback: 0,
        memberApproval: 0,
        myDuty: 0,
        attendanceApproval: 0,
        financeTrip: 0 // Init
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
                    qgCount = qgData.filter((r: any) => {
                         const t = r.task;
                         if (!t) return false;
                         return (t.assignee_ids || []).includes(currentUser.id) || 
                                (t.idea_owner_ids || []).includes(currentUser.id) ||
                                (t.editor_ids || []).includes(currentUser.id);
                    }).length;
                }
            }

            // 2. Feedback Logic
            let fbCount = 0;
            if (isAdmin) {
                const { count } = await supabase
                    .from('feedbacks')
                    .select('id', { count: 'exact', head: true })
                    .eq('status', 'PENDING');
                fbCount = count || 0;
            }

            // 3. Member Approval
            let maCount = 0;
            if (isAdmin) {
                const { count } = await supabase
                    .from('profiles')
                    .select('id', { count: 'exact', head: true })
                    .eq('is_approved', false);
                maCount = count || 0;
            }

            // 4. My Duty
            const { count: dutyCount } = await supabase.from('duties')
                .select('id', { count: 'exact', head: true })
                .eq('assignee_id', currentUser.id)
                .eq('date', todayStr)
                .eq('is_done', false);

            // 5. Attendance Approval
            let leaveCount = 0;
            if (isAdmin) {
                const { count } = await supabase
                    .from('leave_requests')
                    .select('id', { count: 'exact', head: true })
                    .eq('status', 'PENDING');
                leaveCount = count || 0;
            }

            // 6. Finance Trip Detection (NEW)
            // Logic: Count groupings of unlinked contents
            let tripCount = 0;
            if (isAdmin) {
                const { data: unlinkedData } = await supabase
                    .from('contents')
                    .select('shoot_date, shoot_location')
                    .is('shoot_trip_id', null)
                    .not('shoot_date', 'is', null)
                    .not('shoot_location', 'is', null);
                
                if (unlinkedData) {
                    const groups = new Set<string>();
                    unlinkedData.forEach((c: any) => {
                        const date = c.shoot_date ? c.shoot_date.split('T')[0] : '';
                        const loc = c.shoot_location ? c.shoot_location.trim().toLowerCase() : '';
                        if (date && loc) {
                            groups.add(`${date}_${loc}`);
                        }
                    });
                    tripCount = groups.size;
                }
            }

            setBadges({
                qualityGate: qgCount,
                feedback: fbCount,
                memberApproval: maCount,
                myDuty: dutyCount || 0,
                attendanceApproval: leaveCount,
                financeTrip: tripCount
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
            .on('postgres_changes', { event: '*', schema: 'public', table: 'leave_requests' }, fetchBadges)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'contents' }, fetchBadges) // Listen to content changes for Trip Badge
            .on('postgres_changes', { event: '*', schema: 'public', table: 'shoot_trips' }, fetchBadges) // Listen to trips
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [currentUser.id]);

    return { badges };
};
