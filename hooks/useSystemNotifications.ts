
import { useState, useEffect } from 'react';
import { Task, User, AppNotification } from '../types';
import { isBefore, isAfter, addDays, differenceInDays, isSameDay } from 'date-fns';
import { isTaskCompleted } from '../constants';

export const useSystemNotifications = (tasks: Task[], currentUser: User | null) => {
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    
    // Local state for dismissed notifications (Removed from list entirely)
    const [dismissedIds, setDismissedIds] = useState<string[]>(() => {
        try {
            const saved = localStorage.getItem('juijui_dismissed_notifs');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    });

    // New: Local state for viewed notifications (Clears badge but keeps in list)
    const [viewedIds, setViewedIds] = useState<string[]>(() => {
        try {
            const saved = localStorage.getItem('juijui_viewed_notifs');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    });

    // Save states when they change
    useEffect(() => {
        localStorage.setItem('juijui_dismissed_notifs', JSON.stringify(dismissedIds));
    }, [dismissedIds]);

    useEffect(() => {
        localStorage.setItem('juijui_viewed_notifs', JSON.stringify(viewedIds));
    }, [viewedIds]);

    const dismissNotification = (id: string) => {
        setDismissedIds(prev => [...prev, id]);
    };

    // Clears the badge number (called when opening the modal)
    const markAsViewed = () => {
        const currentIds = notifications.map(n => n.id);
        if (currentIds.length > 0) {
            setViewedIds(prev => [...new Set([...prev, ...currentIds])]);
        }
    };

    // Clears the list (called via button inside modal)
    const markAllAsRead = () => {
        const allIds = notifications.map(n => n.id);
        setDismissedIds(prev => [...new Set([...prev, ...allIds])]);
    };

    useEffect(() => {
        if (!currentUser) return;

        const newNotifications: AppNotification[] = [];
        const today = new Date();
        const yesterday = addDays(today, -1);

        tasks.forEach(task => {
            // Skip done tasks or unscheduled
            if (isTaskCompleted(task.status) || task.isUnscheduled) return;

            // Check ownership
            const isAssignee = task.assigneeIds.includes(currentUser.id);
            const isRelated = isAssignee || 
                              task.ideaOwnerIds?.includes(currentUser.id) || 
                              task.editorIds?.includes(currentUser.id);

            // 1. NEW ASSIGNMENT CHECK
            if (isAssignee && task.createdAt && isAfter(task.createdAt, yesterday)) {
                 const id = `new_${task.id}`;
                 if (!dismissedIds.includes(id)) {
                     newNotifications.push({
                        id,
                        type: 'NEW_ASSIGNMENT',
                        title: '✨ งานใหม่เข้า (New Task)',
                        message: `คุณได้รับมอบหมายงาน "${task.title}"`,
                        taskId: task.id,
                        date: task.createdAt,
                        isRead: false
                     });
                 }
            }

            // 2. OVERDUE CHECK
            if (isBefore(task.endDate, today) && !isSameDay(task.endDate, today)) {
                if (isRelated || currentUser.role === 'ADMIN') {
                    const id = `overdue_${task.id}_${formatDateKey(today)}`; // Change ID daily so it reappears if not done
                    if (!dismissedIds.includes(id)) {
                        const daysLate = differenceInDays(today, task.endDate);
                        newNotifications.push({
                            id,
                            type: 'OVERDUE',
                            title: '🔥 งานเลยกำหนด (Overdue)',
                            message: `งาน "${task.title}" ล่าช้า ${daysLate} วันแล้ว รีบเคลียร์ด่วน!`,
                            taskId: task.id,
                            date: task.endDate,
                            isRead: false
                        });
                    }
                }
            }

            // 3. UPCOMING CHECK (Next 3 days)
            else if (isAfter(task.endDate, today) && isBefore(task.endDate, addDays(today, 3)) && isRelated) {
                const id = `upcoming_${task.id}_${formatDateKey(today)}`;
                if (!dismissedIds.includes(id)) {
                    const daysLeft = differenceInDays(task.endDate, today);
                    newNotifications.push({
                        id,
                        type: 'UPCOMING',
                        title: '⏳ ใกล้ถึงกำหนดส่ง',
                        message: `งาน "${task.title}" ต้องส่งในอีก ${daysLeft} วัน (${daysLeft === 0 ? 'วันนี้' : ''})`,
                        taskId: task.id,
                        date: task.endDate,
                        isRead: false
                    });
                }
            }

            // 4. REVIEW CHECK (For Status = FEEDBACK)
            if (task.status === 'FEEDBACK') {
                const isReviewer = task.ideaOwnerIds?.includes(currentUser.id) || currentUser.role === 'ADMIN';
                const id = `review_${task.id}`;
                if (isReviewer && !dismissedIds.includes(id)) {
                    newNotifications.push({
                        id,
                        type: 'REVIEW',
                        title: '👀 มีงานรอตรวจ (Review)',
                        message: `งาน "${task.title}" ส่งมาแล้ว รอคุณเข้าไปตรวจครับ`,
                        taskId: task.id,
                        date: new Date(),
                        isRead: false
                    });
                }
            }
        });

        // Sort by priority: Overdue > Review > New > Upcoming
        const typePriority = { 'OVERDUE': 0, 'REVIEW': 1, 'NEW_ASSIGNMENT': 2, 'UPCOMING': 3, 'INFO': 4 };
        
        newNotifications.sort((a, b) => {
            if (typePriority[a.type] !== typePriority[b.type]) {
                return typePriority[a.type] - typePriority[b.type];
            }
            return new Date(b.date).getTime() - new Date(a.date).getTime();
        });

        setNotifications(newNotifications);
        
        // Count unread based on what hasn't been viewed yet
        const unviewedCount = newNotifications.filter(n => !viewedIds.includes(n.id)).length;
        setUnreadCount(unviewedCount);

    }, [tasks, currentUser, dismissedIds, viewedIds]);

    // Helper to generate simple date key YYYYMMDD
    const formatDateKey = (date: Date) => {
        return date.toISOString().split('T')[0];
    };

    return {
        notifications,
        unreadCount,
        dismissNotification,
        markAllAsRead,
        markAsViewed
    };
};
