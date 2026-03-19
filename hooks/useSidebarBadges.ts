
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
    financeTrip: number;
    dashboard: number;
    kpi: number;
    wiki: number;
    chat: number;
}

export const useSidebarBadges = (currentUser: User) => {
    const [badges, setBadges] = useState<SidebarBadges>({
        qualityGate: 0,
        feedback: 0,
        memberApproval: 0,
        myDuty: 0,
        attendanceApproval: 0,
        financeTrip: 0,
        dashboard: 0,
        kpi: 0,
        wiki: 0,
        chat: 0
    });

    const fetchBadges = async () => {
        if (!currentUser) return;
        const isAdmin = currentUser.role === 'ADMIN';
        const todayStr = format(new Date(), 'yyyy-MM-dd');

        try {
            // 1. Quality Gate Logic (Pending Reviews)
            let qgQuery = supabase.from('task_reviews')
                .select('id, task:tasks!inner(assignee_ids, idea_owner_ids, editor_ids)', { count: 'exact', head: false })
                .eq('status', 'PENDING');
            
            const { data: qgData, count: qgTotalCount } = await qgQuery;
            let qgCount = 0;
            
            if (qgData) {
                if (isAdmin) {
                    qgCount = qgTotalCount || 0;
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

            // 6. Finance Trip Detection
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

            // 7. Dashboard Overdue Tasks
            const { count: overdueCount } = await supabase
                .from('tasks')
                .select('id', { count: 'exact', head: true })
                .contains('assignee_ids', [currentUser.id])
                .lt('end_date', todayStr)
                .not('status', 'eq', 'COMPLETED');

            // 8. KPI Approval
            let kpiCount = 0;
            if (isAdmin) {
                const monthKey = format(new Date(), 'yyyy-MM');
                const { count } = await supabase
                    .from('kpi_records')
                    .select('id', { count: 'exact', head: true })
                    .eq('month_key', monthKey)
                    .eq('status', 'PENDING');
                kpiCount = count || 0;
            }

            // 9. Wiki Updates
            const threshold = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
            const { count: wikiCount } = await supabase
                .from('wiki_articles')
                .select('id', { count: 'exact', head: true })
                .gt('updated_at', threshold);

            // 10. Chat Unread
            const lastRead = currentUser.lastReadChatAt || new Date(0);
            const { count: chatCount } = await supabase
                .from('team_messages')
                .select('*', { count: 'exact', head: true })
                .gt('created_at', lastRead.toISOString())
                .neq('user_id', currentUser.id);

            setBadges({
                qualityGate: qgCount,
                feedback: fbCount,
                memberApproval: maCount,
                myDuty: dutyCount || 0,
                attendanceApproval: leaveCount,
                financeTrip: tripCount,
                dashboard: overdueCount || 0,
                kpi: kpiCount,
                wiki: wikiCount || 0,
                chat: chatCount || 0
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
            .on('postgres_changes', { event: '*', schema: 'public', table: 'contents' }, fetchBadges)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'shoot_trips' }, fetchBadges)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, fetchBadges)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'kpi_records' }, fetchBadges)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'wiki_articles' }, fetchBadges)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'team_messages' }, fetchBadges)
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [currentUser.id]);

    return { badges };
};
