
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Task, User, AppNotification } from '../types';
import { startOfDay, isSameDay } from 'date-fns';
import { mapGameLogToNotification, mapTaskToNotification } from '../lib/notificationMappers';

export const useSystemNotifications = (tasks: Task[], currentUser: User | null) => {
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    
    // Ref to track locally applied read time to prevent stale data override during sync gap
    const localReadTimeRef = useRef<Date | null>(null);

    // --- MAIN FETCH EFFECT ---
    useEffect(() => {
        if (!currentUser) return;

        const fetchAllNotifications = async () => {
            const today = new Date();
            
            // Resolve effective read time: Max(DB Time, Local Action Time)
            const profileReadTime = currentUser.lastReadNotificationAt || new Date(0);
            const lastReadTime = localReadTimeRef.current && localReadTimeRef.current > profileReadTime 
                ? localReadTimeRef.current 
                : profileReadTime;

            // 1. Fetch Persistent Notifications from DB (Real rows)
            const { data: dbNotifs } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', currentUser.id)
                .order('created_at', { ascending: false })
                .limit(20);

            // 2. Fetch recent Game Logs (Rewards/Penalties)
            const { data: gameLogs } = await supabase
                .from('game_logs')
                .select('*')
                .eq('user_id', currentUser.id)
                .order('created_at', { ascending: false })
                .limit(20); // Fetch more to allow deduping

            // 3. Generate Dynamic Alerts (Computed on the fly)
            const dynamicNotifs: AppNotification[] = [];

            // A. Map Game Logs to Notifications & Track Penalties
            // We do this BEFORE Tasks to know what has been penalized today
            const penalizedTaskIdsToday = new Set<string>();
            const processedLogKeys = new Set<string>();

            if (gameLogs) {
                gameLogs.forEach((log: any) => {
                    // Check if this log is a penalty for a task that happened TODAY
                    if (log.action_type === 'TASK_LATE' && log.related_id) {
                        const logDate = new Date(log.created_at);
                        if (isSameDay(logDate, today)) {
                            penalizedTaskIdsToday.add(log.related_id);
                        }
                    }

                    // Deduplicate logs visually
                    const dedupKey = `${log.action_type}_${log.related_id || log.id}`;
                    if (processedLogKeys.has(dedupKey)) return; 
                    processedLogKeys.add(dedupKey);

                    const notif = mapGameLogToNotification(log, lastReadTime);
                    dynamicNotifs.push(notif);
                });
            }

            // B. Task Logic (Overdue / Upcoming) - Uses imported Mapper
            tasks.forEach(task => {
                // IMPORTANT: If this task was already penalized today (found in gameLogs),
                // SKIP generating the generic "Overdue" alert.
                // The user will see the "โดนหักคะแนน!" notification instead.
                if (penalizedTaskIdsToday.has(task.id)) return;

                const notif = mapTaskToNotification(task, currentUser, lastReadTime);
                if (notif) dynamicNotifs.push(notif);
            });

            // C. Admin Checks (Leave Requests)
            if (currentUser.role === 'ADMIN') {
                const { data: leaves } = await supabase
                    .from('leave_requests')
                    .select(`*, profiles:profiles!leave_requests_user_id_fkey(full_name)`)
                    .eq('status', 'PENDING');

                if (leaves) {
                    leaves.forEach((req: any) => {
                        dynamicNotifs.push({
                            id: `leave_${req.id}`,
                            type: 'APPROVAL_REQ',
                            title: '📋 คำขออนุมัติใหม่',
                            message: `คุณ ${req.profiles?.full_name} ส่งคำขอ: "${req.reason}"`,
                            date: new Date(req.created_at),
                            isRead: new Date(req.created_at) < lastReadTime,
                            actionLink: 'ATTENDANCE'
                        });
                    });
                }
            }

            // 4. Merge & Map DB Notifs
            const mappedDbNotifs: AppNotification[] = (dbNotifs || []).map((n: any) => ({
                id: n.id,
                type: n.type,
                title: n.title,
                message: n.message,
                taskId: n.related_id,
                date: new Date(n.created_at),
                isRead: n.is_read || new Date(n.created_at) < lastReadTime,
                actionLink: n.link_path,
                // Metadata isn't typically stored in simple notifications yet, but structured for future
            }));

            const combined = [...mappedDbNotifs, ...dynamicNotifs];
            
            // Sort by Date DESC
            combined.sort((a, b) => b.date.getTime() - a.date.getTime());

            setNotifications(combined);

            // Calculate Unread: (DB items not read) + (Dynamic items fresher than lastRead)
            const effectiveUnread = combined.filter(n => n.date > lastReadTime).length;
            setUnreadCount(effectiveUnread);
        };

        fetchAllNotifications();

        // Subscribe to NEW db notifications, GAME LOGS, and LEAVE REQUESTS (For Admin)
        const channel = supabase
            .channel('system-notifications-v2')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${currentUser.id}` }, () => {
                fetchAllNotifications();
            })
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'game_logs', filter: `user_id=eq.${currentUser.id}` }, () => {
                 fetchAllNotifications();
            })
            // NEW: Listen for leave requests so Admins get instant alerts
            .on('postgres_changes', { event: '*', schema: 'public', table: 'leave_requests' }, () => {
                 fetchAllNotifications();
            })
            .subscribe();
            
        // Polling for time-based updates (e.g. task becoming overdue)
        const interval = setInterval(fetchAllNotifications, 60000);

        return () => {
            supabase.removeChannel(channel);
            clearInterval(interval);
        };

    }, [tasks, currentUser?.id, currentUser?.lastReadNotificationAt]); 

    // Actions
    const markAsViewed = async () => {
        if (!currentUser) return;
        
        // Update local ref to prevent race condition reversion
        const now = new Date();
        localReadTimeRef.current = now;
        
        setUnreadCount(0); // Optimistic UI update

        try {
            // Update Profile Timestamp
            await supabase.from('profiles').update({ last_read_notification_at: now.toISOString() }).eq('id', currentUser.id);
            
            // Optionally: Mark all DB notifications as read
            await supabase.from('notifications').update({ is_read: true }).eq('user_id', currentUser.id).eq('is_read', false);
        } catch (err) {
            console.error(err);
        }
    };

    const dismissNotification = async (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
        
        // Try to delete from DB if it's a UUID (DB ID) and NOT a dynamic/game ID
        if (!id.includes('_')) {
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
