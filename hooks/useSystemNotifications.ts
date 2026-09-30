
import { useState, useMemo } from 'react';
import { Task, User, AppNotification } from '../types';
import { isSameDay } from 'date-fns';
import { mapTaskToNotification } from '../lib/notificationMappers';
import { useNotificationContext } from '../context/NotificationContext';
import { useChecklistCadenceAlerts } from './company-checklist/useChecklistCadenceAlerts';

export const useSystemNotifications = (tasks: Task[], currentUser: User | null, onEvent?: () => void) => {
    const { 
        notifications: dbNotifs, 
        gameLogs, 
        leaveRequests,
        otRequests = [],
        deadlineRequests,
        markAsRead: contextMarkAsRead, 
        markNotificationAsRead: contextMarkNotificationAsRead,
        dismissNotification: contextDismissNotification 
    } = useNotificationContext();

    // Zero-Bandwidth Company Checklist Cadence Alerts (reads in-memory MasterDataContext + localStorage)
    const { pendingAlerts: checklistCadenceAlerts } = useChecklistCadenceAlerts(!!currentUser);

    const [dismissedDynamicIds, setDismissedDynamicIds] = useState<string[]>(() => {
        try {
            return JSON.parse(localStorage.getItem('dismissed_dynamic_notification_ids') || '[]');
        } catch {
            return [];
        }
    });

    const [acknowledgedDynamicIds, setAcknowledgedDynamicIds] = useState<string[]>(() => {
        try {
            return JSON.parse(localStorage.getItem('acknowledged_notification_ids') || '[]');
        } catch {
            return [];
        }
    });
    
    // Combine and Map Notifications
    const { notifications, unreadCount } = useMemo(() => {
        if (!currentUser) return { notifications: [], unreadCount: 0 };

        const today = new Date();
        const lastReadTime = currentUser.lastReadNotificationAt ? new Date(currentUser.lastReadNotificationAt) : new Date(0);

        const dynamicNotifs: AppNotification[] = [];
        const penalizedTaskIdsToday = new Set<string>();

        const acknowledgedIds = acknowledgedDynamicIds;

        // 0. Map Pending Recurring Company Checklists (Zero Network / Zero Extra Bandwidth)
        checklistCadenceAlerts.forEach(({ preset, evaluation }) => {
            const notifId = `chk_due_${preset.id}_${evaluation.cycleKey}`;
            const cycleDate = evaluation.cycleStartDate || today;
            dynamicNotifs.push({
                id: notifId,
                type: 'UPCOMING',
                title: `⏰ ครบรอบเช็คลิสต์: ${preset.title}`,
                message: `${evaluation.statusBadgeText} (${evaluation.periodLabel}) — กดเพื่อเปิดกระดานเช็คลิสต์และบันทึกส่งประจำรอบ`,
                relatedId: preset.id,
                date: cycleDate,
                isRead: acknowledgedIds.includes(notifId) || cycleDate < lastReadTime,
                actionLink: 'COMPANY_CHECKLIST',
                metadata: {
                    checklistId: preset.id,
                    cadenceLabel: evaluation.cadenceLabel,
                    periodLabel: evaluation.periodLabel,
                    autoCaseTitle: evaluation.autoCaseTitle
                }
            });
        });

        // 1. Process Game Logs for Deduplication
        gameLogs.forEach((log: any) => {
            if (log.action_type === 'TASK_LATE' && log.related_id) {
                const logDate = new Date(log.created_at);
                if (isSameDay(logDate, today)) {
                    penalizedTaskIdsToday.add(log.related_id);
                }
            }
        });

        // 2. Map Tasks
        tasks.forEach(task => {
            if (penalizedTaskIdsToday.has(task.id)) return;
            const notif = mapTaskToNotification(task, currentUser, lastReadTime);
            if (notif) {
                if (acknowledgedIds.includes(notif.id)) {
                    notif.isRead = true;
                }
                dynamicNotifs.push(notif);
            }
        });

        // 3. Map Leave Requests
        leaveRequests.forEach((req: any) => {
            if (req.status && req.status !== 'PENDING') return;
            const notifId = `leave_${req.id}`;
            dynamicNotifs.push({
                id: notifId,
                type: 'APPROVAL_REQ',
                title: '📋 คำขอลาใหม่',
                message: `คุณ ${req.profiles?.full_name} ส่งคำขอ: "${req.reason}"`,
                date: new Date(req.created_at),
                isRead: acknowledgedIds.includes(notifId) || new Date(req.created_at) < lastReadTime,
                actionLink: 'ATTENDANCE'
            });
        });

        // 3.5. Map OT Requests
        otRequests.forEach((req: any) => {
            if (req.status && req.status !== 'PENDING') return;
            const notifId = `ot_${req.id}`;
            const timeDisplay = req.start_time && req.end_time ? `${req.start_time}-${req.end_time}` : '';
            const hrsDisplay = req.duration_hours ? ` (${req.duration_hours} ชม.)` : '';
            dynamicNotifs.push({
                id: notifId,
                type: 'APPROVAL_REQ',
                title: '⏰ คำขอ OT ใหม่',
                message: `คุณ ${req.profiles?.full_name || 'พนักงาน'} ส่งคำขอ OT ${timeDisplay}${hrsDisplay}: "${req.reason}"`,
                date: new Date(req.created_at),
                isRead: acknowledgedIds.includes(notifId) || new Date(req.created_at) < lastReadTime,
                actionLink: 'ATTENDANCE'
            });
        });

        // 4. Map Deadline Requests
        deadlineRequests.forEach((req: any) => {
            if (req.status && req.status !== 'PENDING') return;
            const notifId = `deadline_${req.id}`;
            dynamicNotifs.push({
                id: notifId,
                type: 'APPROVAL_REQ',
                title: '📅 คำขอเลื่อน Deadline',
                message: `คุณ ${req.user?.name} ขอเลื่อนงาน: "${req.taskTitle || 'งานบางอย่าง'}"`,
                date: new Date(req.created_at),
                isRead: acknowledgedIds.includes(notifId) || new Date(req.created_at) < lastReadTime,
                actionLink: 'ADMIN_DASHBOARD'
            });
        });

        const mappedDbNotifs: AppNotification[] = dbNotifs.map((n: any) => {
            const isAcknowledgedLocal = acknowledgedIds.includes(n.id);
            return {
                id: n.id,
                type: n.type,
                title: n.title,
                message: n.message,
                taskId: n.related_id,
                date: new Date(n.created_at),
                isRead: n.is_read || isAcknowledgedLocal || new Date(n.created_at) < lastReadTime,
                is_read: n.is_read || isAcknowledgedLocal, // Add raw DB field for compatibility
                actionLink: n.link_path,
            };
        });

        const combined = [...mappedDbNotifs, ...dynamicNotifs].filter(n => !dismissedDynamicIds.includes(n.id));
        combined.sort((a, b) => b.date.getTime() - a.date.getTime());

        const unread = combined.filter(n => !n.isRead).length;

        return { notifications: combined, unreadCount: unread };
    }, [dbNotifs, gameLogs, leaveRequests, otRequests, deadlineRequests, tasks, currentUser, dismissedDynamicIds, acknowledgedDynamicIds, checklistCadenceAlerts]);

    const markNotificationAsRead = async (id: string) => {
        if (!acknowledgedDynamicIds.includes(id)) {
            const nextAck = [...acknowledgedDynamicIds, id];
            setAcknowledgedDynamicIds(nextAck);
            try {
                localStorage.setItem('acknowledged_notification_ids', JSON.stringify(nextAck));
            } catch (_) {}
        }
        await contextMarkNotificationAsRead(id);
    };

    const markAllAsRead = async () => {
        const dynamicIds = notifications.filter(n => n.id.includes('_')).map(n => n.id);
        if (dynamicIds.length > 0) {
            const merged = Array.from(new Set([...acknowledgedDynamicIds, ...dynamicIds]));
            setAcknowledgedDynamicIds(merged);
            try {
                localStorage.setItem('acknowledged_notification_ids', JSON.stringify(merged));
            } catch (_) {}
        }
        await contextMarkAsRead();
    };

    const dismissNotification = async (id: string) => {
        if (id.includes('_')) {
            const nextDismissed = [...dismissedDynamicIds, id];
            setDismissedDynamicIds(nextDismissed);
            try {
                localStorage.setItem('dismissed_dynamic_notification_ids', JSON.stringify(nextDismissed));
            } catch (e) {
                console.error("Failed to save dismissed dynamic notifications:", e);
            }
        }
        await contextDismissNotification(id);
    };

    return {
        notifications,
        unreadCount,
        dismissNotification,
        markNotificationAsRead,
        markAsViewed: markAllAsRead,
        markAllAsRead 
    };
};
