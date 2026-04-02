
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { Task, User, AppNotification } from '../types';
import { isSameDay } from 'date-fns';
import { mapGameLogToNotification, mapTaskToNotification } from '../lib/notificationMappers';
import { useNotificationContext } from '../context/NotificationContext';

export const useSystemNotifications = (tasks: Task[], currentUser: User | null, onEvent?: () => void) => {
    const { 
        notifications: dbNotifs, 
        gameLogs, 
        leaveRequests,
        deadlineRequests,
        markAsRead: contextMarkAsRead, 
        dismissNotification: contextDismissNotification 
    } = useNotificationContext();
    
    // Combine and Map Notifications
    const { notifications, unreadCount } = useMemo(() => {
        if (!currentUser) return { notifications: [], unreadCount: 0 };

        const today = new Date();
        const lastReadTime = currentUser.lastReadNotificationAt ? new Date(currentUser.lastReadNotificationAt) : new Date(0);

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
                title: '📋 คำขอลาใหม่',
                message: `คุณ ${req.profiles?.full_name} ส่งคำขอ: "${req.reason}"`,
                date: new Date(req.created_at),
                isRead: new Date(req.created_at) < lastReadTime,
                actionLink: 'ATTENDANCE'
            });
        });

        // 4. Map Deadline Requests
        deadlineRequests.forEach((req: any) => {
            dynamicNotifs.push({
                id: `deadline_${req.id}`,
                type: 'APPROVAL_REQ',
                title: '📅 คำขอเลื่อน Deadline',
                message: `คุณ ${req.user?.name} ขอเลื่อนงาน: "${req.taskTitle || 'งานบางอย่าง'}"`,
                date: new Date(req.created_at),
                isRead: new Date(req.created_at) < lastReadTime,
                actionLink: 'ADMIN_DASHBOARD'
            });
        });

        // 5. Map DB Notifications
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

        const unread = combined.filter(n => n.date > lastReadTime).length;

        return { notifications: combined, unreadCount: unread };
    }, [dbNotifs, gameLogs, leaveRequests, deadlineRequests, tasks, currentUser]);

    return {
        notifications,
        unreadCount,
        dismissNotification: contextDismissNotification,
        markAsViewed: contextMarkAsRead,
        markAllAsRead: contextMarkAsRead 
    };
};
