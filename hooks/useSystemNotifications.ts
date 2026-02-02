
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Task, User, AppNotification } from '../types';
import { isBefore, isAfter, addDays, differenceInDays, isSameDay, startOfDay } from 'date-fns';
import { isTaskCompleted } from '../constants';

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
            const startOfToday = startOfDay(today);
            
            // Resolve effective read time: Max(DB Time, Local Action Time)
            const profileReadTime = currentUser.lastReadNotificationAt || new Date(0);
            const lastReadTime = localReadTimeRef.current && localReadTimeRef.current > profileReadTime 
                ? localReadTimeRef.current 
                : profileReadTime;

            // 1. Fetch Persistent Notifications from DB (Real rows)
            const { data: dbNotifs, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', currentUser.id)
                .order('created_at', { ascending: false })
                .limit(20); // Limit recent

            // 2. Generate Dynamic Alerts (Computed on the fly)
            const dynamicNotifs: AppNotification[] = [];

            // A. Task Logic (Overdue / Upcoming)
            tasks.forEach(task => {
                if (isTaskCompleted(task.status) || task.isUnscheduled) return;

                const isRelated = task.assigneeIds.includes(currentUser.id) || 
                                  task.ideaOwnerIds?.includes(currentUser.id) || 
                                  task.editorIds?.includes(currentUser.id);

                // Overdue
                if (isBefore(task.endDate, today) && !isSameDay(task.endDate, today)) {
                    if (isRelated || currentUser.role === 'ADMIN') {
                        const id = `overdue_${task.id}`;
                        const daysLate = differenceInDays(today, task.endDate);
                        dynamicNotifs.push({
                            id,
                            type: 'OVERDUE',
                            title: '🔥 งานเลยกำหนด (Overdue)',
                            message: `งาน "${task.title}" ล่าช้า ${daysLate} วันแล้ว รีบเคลียร์ด่วน!`,
                            taskId: task.id,
                            date: task.endDate, // Keep overdue date as is (historical context)
                            isRead: new Date(task.endDate) < lastReadTime
                        });
                    }
                } 
                // Upcoming
                else if (isAfter(task.endDate, today) && isBefore(task.endDate, addDays(today, 3)) && isRelated) {
                    const id = `upcoming_${task.id}`;
                    const daysLeft = differenceInDays(task.endDate, today);
                    dynamicNotifs.push({
                        id,
                        type: 'UPCOMING',
                        title: '⏳ ใกล้ถึงกำหนดส่ง',
                        message: `งาน "${task.title}" ต้องส่งในอีก ${daysLeft} วัน`,
                        taskId: task.id,
                        // FIX: Use 'startOfToday' instead of 'task.endDate' (future).
                        // This allows the notification to be marked as read for "today", 
                        // but it will reappear tomorrow as a new daily reminder.
                        date: startOfToday,
                        isRead: startOfToday < lastReadTime
                    });
                }
            });

            // B. Admin Checks (Leave Requests)
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

            // 3. Merge & Map DB Notifs
            const mappedDbNotifs: AppNotification[] = (dbNotifs || []).map((n: any) => ({
                id: n.id,
                type: n.type,
                title: n.title,
                message: n.message,
                taskId: n.related_id,
                date: new Date(n.created_at),
                isRead: n.is_read || new Date(n.created_at) < lastReadTime,
                actionLink: n.link_path
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

        // Subscribe to NEW db notifications
        const channel = supabase
            .channel('system-notifications')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${currentUser.id}` }, () => {
                fetchAllNotifications();
            })
            .subscribe();
            
        // Polling for time-based updates (e.g. task becoming overdue)
        const interval = setInterval(fetchAllNotifications, 60000);

        return () => {
            supabase.removeChannel(channel);
            clearInterval(interval);
        };

    }, [tasks, currentUser?.id, currentUser?.lastReadNotificationAt]); // Depend on lastRead from profile

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
        // If it's a real DB notification, delete it or mark read
        // If dynamic, we can't easily "delete" it without local storage state, unless we convert it to DB record marked as read/hidden.
        // For simplicity in this version: Just remove from UI state temporarily
        setNotifications(prev => prev.filter(n => n.id !== id));
        
        // Try to delete from DB if it's a UUID (DB ID)
        if (!id.includes('_')) {
             await supabase.from('notifications').delete().eq('id', id);
        }
    };

    return {
        notifications,
        unreadCount,
        dismissNotification,
        markAsViewed,
        markAllAsRead: markAsViewed // Alias
    };
};
