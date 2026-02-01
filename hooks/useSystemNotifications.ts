
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Task, User, AppNotification } from '../types';
import { isBefore, isAfter, addDays, differenceInDays, isSameDay } from 'date-fns';
import { isTaskCompleted } from '../constants';

export const useSystemNotifications = (tasks: Task[], currentUser: User | null) => {
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    
    // Local state for dismissed notifications
    const [dismissedIds, setDismissedIds] = useState<string[]>(() => {
        try {
            const saved = localStorage.getItem('juijui_dismissed_notifs');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    });

    const [viewedIds, setViewedIds] = useState<string[]>(() => {
        try {
            const saved = localStorage.getItem('juijui_viewed_notifs');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    });

    useEffect(() => {
        localStorage.setItem('juijui_dismissed_notifs', JSON.stringify(dismissedIds));
    }, [dismissedIds]);

    useEffect(() => {
        localStorage.setItem('juijui_viewed_notifs', JSON.stringify(viewedIds));
    }, [viewedIds]);

    const dismissNotification = (id: string) => {
        setDismissedIds(prev => [...prev, id]);
    };

    const markAsViewed = () => {
        const currentIds = notifications.map(n => n.id);
        if (currentIds.length > 0) {
            setViewedIds(prev => [...new Set([...prev, ...currentIds])]);
        }
    };

    const markAllAsRead = () => {
        const allIds = notifications.map(n => n.id);
        setDismissedIds(prev => [...new Set([...prev, ...allIds])]);
    };

    useEffect(() => {
        if (!currentUser) return;

        const fetchNotifications = async () => {
            const newNotifications: AppNotification[] = [];
            const today = new Date();
            const yesterday = addDays(today, -1);

            // --- 1. TASK NOTIFICATIONS ---
            tasks.forEach(task => {
                if (isTaskCompleted(task.status) || task.isUnscheduled) return;

                const isAssignee = task.assigneeIds.includes(currentUser.id);
                const isRelated = isAssignee || 
                                  task.ideaOwnerIds?.includes(currentUser.id) || 
                                  task.editorIds?.includes(currentUser.id);

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

                if (isBefore(task.endDate, today) && !isSameDay(task.endDate, today)) {
                    if (isRelated || currentUser.role === 'ADMIN') {
                        const id = `overdue_${task.id}_${formatDateKey(today)}`;
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
                } else if (isAfter(task.endDate, today) && isBefore(task.endDate, addDays(today, 3)) && isRelated) {
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

            // --- 2. LEAVE REQUEST NOTIFICATIONS (ADMIN ONLY) ---
            if (currentUser.role === 'ADMIN') {
                const { data: leaves } = await supabase
                    .from('leave_requests')
                    .select(`*, profiles:profiles!leave_requests_user_id_fkey(full_name)`) // Explicit FK to avoid ambiguity
                    .eq('status', 'PENDING');

                if (leaves) {
                    leaves.forEach((req: any) => {
                        const id = `leave_${req.id}`;
                        if (!dismissedIds.includes(id)) {
                            let title = '📋 คำขออนุมัติใหม่';
                            if (req.type === 'LATE_ENTRY') title = '⏰ ขอเข้าสาย (Late Entry)';
                            if (req.type === 'OVERTIME') title = '🌙 ขอทำ OT (Overtime)';
                            
                            newNotifications.push({
                                id,
                                type: 'APPROVAL_REQ',
                                title: title,
                                message: `คุณ ${req.profiles?.full_name || 'Unknown'} ส่งคำขอเข้ามา: "${req.reason}"`,
                                date: new Date(req.created_at),
                                isRead: false,
                                actionLink: 'ATTENDANCE' // Custom hint for router
                            });
                        }
                    });
                }
            }

            // Sort
            const typePriority = { 'APPROVAL_REQ': 0, 'OVERDUE': 1, 'REVIEW': 2, 'NEW_ASSIGNMENT': 3, 'UPCOMING': 4, 'INFO': 5 };
            
            newNotifications.sort((a, b) => {
                if (typePriority[a.type] !== typePriority[b.type]) {
                    return typePriority[a.type] - typePriority[b.type];
                }
                return new Date(b.date).getTime() - new Date(a.date).getTime();
            });

            setNotifications(newNotifications);
            const unviewedCount = newNotifications.filter(n => !viewedIds.includes(n.id)).length;
            setUnreadCount(unviewedCount);
        };

        fetchNotifications();
        
        // Polling every minute to keep it fresh
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);

    }, [tasks, currentUser, dismissedIds, viewedIds]);

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
