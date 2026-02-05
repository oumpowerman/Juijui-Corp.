
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Task, User, AppNotification } from '../types';
import { isBefore, isAfter, addDays, differenceInCalendarDays, isSameDay, startOfDay, isValid } from 'date-fns';
import { isTaskCompleted } from '../constants';
import { 
    mapGameLogToNotification, 
    mapTaskOverdueNotification, 
    mapTaskUpcomingNotification, 
    mapLeaveRequestNotification,
    mapDbNotification 
} from '../utils/notificationMappers';

export const useSystemNotifications = (tasks: Task[], currentUser: User | null) => {
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    
    // Ref to track locally applied read time to prevent stale data override
    const localReadTimeRef = useRef<Date | null>(null);

    // --- MAIN FETCH EFFECT ---
    useEffect(() => {
        if (!currentUser) return;

        const fetchAllNotifications = async () => {
            const today = startOfDay(new Date());
            
            // 1. Resolve Effective Read Time
            // Use local ref if it's fresher (optimistic update), otherwise DB
            const dbReadTime = currentUser.lastReadNotificationAt || new Date(0);
            const lastReadTime = localReadTimeRef.current && localReadTimeRef.current > dbReadTime 
                ? localReadTimeRef.current 
                : dbReadTime;

            // 2. FETCH DATA (Limited for UI Performance)
            // ------------------------------------------------
            const { data: dbNotifs } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', currentUser.id)
                .order('created_at', { ascending: false })
                .limit(20);

            const { data: gameLogs } = await supabase
                .from('game_logs')
                .select('*')
                .eq('user_id', currentUser.id)
                .order('created_at', { ascending: false })
                .limit(20);

            // 3. GENERATE & MERGE (Layer 2: Logic)
            // ------------------------------------------------
            const combined = new Map<string, AppNotification>();

            // A. Map DB Notifications
            dbNotifs?.forEach(n => {
                combined.set(n.id, mapDbNotification(n, lastReadTime));
            });

            // B. Map Game Logs
            gameLogs?.forEach(log => {
                const n = mapGameLogToNotification(log, lastReadTime);
                combined.set(n.id, n);
            });

            // C. Dynamic Task Alerts
            tasks.forEach(task => {
                if (isTaskCompleted(task.status) || task.isUnscheduled) return;
                
                // Only relevant people
                const isRelated = task.assigneeIds.includes(currentUser.id) || 
                                  task.ideaOwnerIds?.includes(currentUser.id) || 
                                  task.editorIds?.includes(currentUser.id);
                
                const endDateObj = new Date(task.endDate);
                if (!isValid(endDateObj)) return;

                // Overdue
                if (isBefore(endDateObj, today) && !isSameDay(endDateObj, today)) {
                    if (isRelated || currentUser.role === 'ADMIN') {
                        const n = mapTaskOverdueNotification(task, today, lastReadTime);
                        // Only add if "date" (generated now) is newer than lastRead
                        // Or we can treat dynamic alerts as always "relevant" but mark read if viewed recently?
                        // For simplicity: Dynamic alerts are always "Unread" visually until action taken, 
                        // BUT for the counter, we only count them if we haven't opened the menu recently.
                        n.isRead = new Date() < lastReadTime; 
                        combined.set(n.id, n);
                    }
                } 
                // Upcoming
                else if (isAfter(endDateObj, today) && isBefore(endDateObj, addDays(today, 3)) && isRelated) {
                    const n = mapTaskUpcomingNotification(task, today, lastReadTime);
                    n.isRead = new Date() < lastReadTime;
                    combined.set(n.id, n);
                }
            });

            // D. Admin Leave Requests
            if (currentUser.role === 'ADMIN') {
                const { data: leaves } = await supabase
                    .from('leave_requests')
                    .select(`*, profiles:profiles!leave_requests_user_id_fkey(full_name)`)
                    .eq('status', 'PENDING');

                leaves?.forEach(req => {
                    const n = mapLeaveRequestNotification(req, lastReadTime);
                    combined.set(n.id, n);
                });
            }

            // 4. SORT & SET
            const sorted = Array.from(combined.values()).sort((a, b) => 
                b.date.getTime() - a.date.getTime()
            );
            
            setNotifications(sorted);

            // 5. CALCULATE UNREAD COUNT (Accurate Strategy)
            // ------------------------------------------------
            // For DB items: Trust the is_read flag + check against lastReadTime
            // For Dynamic items: Check against lastReadTime
            
            // NOTE: Ideally we query COUNT from DB for older unread items not in limit(20)
            // But for V2 MVP, calculating from the merged set (and maybe assumes user clears list often) is safer for performance.
            // A truly scalable way requires a separate 'SELECT count(*) FROM notifications WHERE is_read=false'
            
            const { count: dbUnreadCount } = await supabase
                .from('notifications')
                .select('id', { count: 'exact', head: true })
                .eq('user_id', currentUser.id)
                .eq('is_read', false);

            const dynamicUnread = sorted.filter(n => 
                !n.id.includes('-') && // Filter out DB UUIDs which we counted above
                n.date > lastReadTime
            ).length;

            setUnreadCount((dbUnreadCount || 0) + dynamicUnread);
        };

        fetchAllNotifications();

        // Subscribe to NEW events
        const channel = supabase
            .channel('system-notifications-v2')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${currentUser.id}` }, () => fetchAllNotifications())
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'game_logs', filter: `user_id=eq.${currentUser.id}` }, () => fetchAllNotifications())
            .subscribe();
            
        const interval = setInterval(fetchAllNotifications, 60000);

        return () => {
            supabase.removeChannel(channel);
            clearInterval(interval);
        };

    }, [tasks, currentUser?.id, currentUser?.lastReadNotificationAt]);

    // --- ACTIONS ---

    const markAsViewed = async () => {
        if (!currentUser) return;
        
        const now = new Date();
        localReadTimeRef.current = now; // Optimistic
        setUnreadCount(0); // Optimistic

        try {
            // Update Profile Timestamp
            await supabase.from('profiles').update({ last_read_notification_at: now.toISOString() }).eq('id', currentUser.id);
            // Mark DB notifications read
            await supabase.from('notifications').update({ is_read: true }).eq('user_id', currentUser.id).eq('is_read', false);
        } catch (err) {
            console.error(err);
        }
    };

    const dismissNotification = async (id: string) => {
        // UI Remove
        setNotifications(prev => prev.filter(n => n.id !== id));
        // DB Remove (if applicable)
        if (!id.includes('_') && !id.startsWith('game_')) {
             await supabase.from('notifications').delete().eq('id', id);
        }
    };

    return {
        notifications,
        unreadCount,
        dismissNotification,
        markAsViewed,
        markAllAsRead: markAsViewed
    };
};
