
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Task, User, AppNotification } from '../types';
import { isSameDay } from 'date-fns';
import { mapGameLogToNotification, mapTaskToNotification } from '../lib/notificationMappers';

export const useSystemNotifications = (tasks: Task[], currentUser: User | null, onEvent?: () => void) => {
    const [dbNotifs, setDbNotifs] = useState<any[]>([]);
    const [gameLogs, setGameLogs] = useState<any[]>([]);
    const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    
    // Ref to track locally applied read time to prevent stale data override during sync gap
    const localReadTimeRef = useRef<Date | null>(null);
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

    // --- DATA FETCHING ---
    const fetchDBData = useCallback(async () => {
        if (!currentUser) return;
        setIsLoading(true);
        try {
            // 1. Fetch Persistent Notifications from DB
            const { data: dbNotifsData } = await supabase
                .from('notifications')
                .select('id, type, title, message, related_id, created_at, is_read, link_path')
                .eq('user_id', currentUser.id)
                .order('created_at', { ascending: false })
                .limit(20);

            // 2. Fetch recent Game Logs
            const { data: gameLogsData } = await supabase
                .from('game_logs')
                .select('id, action_type, related_id, created_at, hp_change, xp_change, jp_change, description')
                .eq('user_id', currentUser.id)
                .order('created_at', { ascending: false })
                .limit(20);

            // 3. Admin Checks (Leave Requests)
            let leaveRequestsData: any[] = [];
            if (currentUser.role === 'ADMIN') {
                const { data: leaves } = await supabase
                    .from('leave_requests')
                    .select(`id, reason, created_at, profiles:profiles!leave_requests_user_id_fkey(full_name)`)
                    .eq('status', 'PENDING');
                if (leaves) leaveRequestsData = leaves;
            }

            setDbNotifs(dbNotifsData || []);
            setGameLogs(gameLogsData || []);
            setLeaveRequests(leaveRequestsData);
        } catch (err) {
            console.error('Error fetching notifications:', err);
        } finally {
            setIsLoading(false);
        }
    }, [currentUser?.id, currentUser?.role]);

    // Debounced fetch for real-time updates
    const debouncedFetch = useCallback(() => {
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = setTimeout(() => {
            fetchDBData();
        }, 2000); // 2 second debounce
    }, [fetchDBData]);

    // --- INITIAL FETCH & REAL-TIME ---
    useEffect(() => {
        if (!currentUser) return;

        fetchDBData();

        const channel = supabase
            .channel(`system-notifications-${currentUser.id}`)
            .on('postgres_changes', { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'notifications', 
                filter: `user_id=eq.${currentUser.id}` 
            }, () => debouncedFetch())
            .on('postgres_changes', { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'game_logs', 
                filter: `user_id=eq.${currentUser.id}` 
            }, () => debouncedFetch())
            .on('postgres_changes', { 
                event: '*', 
                schema: 'public', 
                table: 'leave_requests' 
            }, () => {
                if (currentUser.role === 'ADMIN') debouncedFetch();
            })
            .subscribe();
            
        const interval = setInterval(fetchDBData, 300000); // Poll every 5 minutes instead of 1

        return () => {
            supabase.removeChannel(channel);
            clearInterval(interval);
            if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        };
    }, [currentUser?.id, currentUser?.role, fetchDBData, debouncedFetch]);

    // --- NOTIFICATION MAPPING & MERGING (MEMOIZED) ---
    const { notifications, unreadCount } = useMemo(() => {
        if (!currentUser) return { notifications: [], unreadCount: 0 };

        const today = new Date();
        const profileReadTime = currentUser.lastReadNotificationAt || new Date(0);
        const lastReadTime = localReadTimeRef.current && localReadTimeRef.current > profileReadTime 
            ? localReadTimeRef.current 
            : profileReadTime;

        const dynamicNotifs: AppNotification[] = [];
        const penalizedTaskIdsToday = new Set<string>();
        const processedLogKeys = new Set<string>();

        // 1. Map Game Logs
        gameLogs.forEach((log: any) => {
            if (log.action_type === 'TASK_LATE' && log.related_id) {
                const logDate = new Date(log.created_at);
                if (isSameDay(logDate, today)) {
                    penalizedTaskIdsToday.add(log.related_id);
                }
            }
            const dedupKey = `${log.action_type}_${log.related_id || log.id}`;
            if (processedLogKeys.has(dedupKey)) return; 
            processedLogKeys.add(dedupKey);

            dynamicNotifs.push(mapGameLogToNotification(log, lastReadTime));
        });

        // 2. Map Tasks
        tasks.forEach(task => {
            if (penalizedTaskIdsToday.has(task.id)) return;
            const notif = mapTaskToNotification(task, currentUser, lastReadTime);
            if (notif) dynamicNotifs.push(notif);
        });

        // 3. Map Leave Requests
        leaveRequests.forEach((req: any) => {
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

        // 4. Map DB Notifications
        const mappedDbNotifs: AppNotification[] = dbNotifs.map((n: any) => ({
            id: n.id,
            type: n.type,
            title: n.title,
            message: n.message,
            taskId: n.related_id,
            date: new Date(n.created_at),
            isRead: n.is_read || new Date(n.created_at) < lastReadTime,
            actionLink: n.link_path,
        }));

        const combined = [...mappedDbNotifs, ...dynamicNotifs];
        combined.sort((a, b) => b.date.getTime() - a.date.getTime());

        const effectiveUnread = combined.filter(n => n.date > lastReadTime).length;

        return { notifications: combined, unreadCount: effectiveUnread };
    }, [dbNotifs, gameLogs, leaveRequests, tasks, currentUser, currentUser?.lastReadNotificationAt]);

    // Actions
    const markAsViewed = async () => {
        if (!currentUser) return;
        const now = new Date();
        localReadTimeRef.current = now;
        try {
            await supabase.from('profiles').update({ last_read_notification_at: now.toISOString() }).eq('id', currentUser.id);
            await supabase.from('notifications').update({ is_read: true }).eq('user_id', currentUser.id).eq('is_read', false);
        } catch (err) {
            console.error(err);
        }
    };

    const dismissNotification = async (id: string) => {
        // Local filter for immediate feedback
        if (!id.includes('_')) {
             await supabase.from('notifications').delete().eq('id', id);
             setDbNotifs(prev => prev.filter(n => n.id !== id));
        } else if (id.startsWith('game_')) {
             setGameLogs(prev => prev.filter(log => `game_${log.id}` !== id));
        } else if (id.startsWith('leave_')) {
             setLeaveRequests(prev => prev.filter(req => `leave_${req.id}` !== id));
        }
    };

    return {
        notifications,
        unreadCount,
        dismissNotification,
        markAsViewed,
        markAllAsRead: markAsViewed,
        isLoading
    };
};
