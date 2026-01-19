
import { useState, useEffect } from 'react';
import { Task, User, AppNotification, Status } from '../types';
import { isBefore, isAfter, addDays, differenceInDays, isSameDay } from 'date-fns';
import { isTaskCompleted } from '../constants'; // Use centralized helper

export const useSystemNotifications = (tasks: Task[], currentUser: User | null) => {
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (!currentUser) return;

        const newNotifications: AppNotification[] = [];
        const today = new Date();

        tasks.forEach(task => {
            // Skip done tasks or unscheduled
            // Use smart completion check here
            if (isTaskCompleted(task.status) || task.isUnscheduled) return;

            // Check ownership (Assignee, Owner, Editor)
            const isRelated = task.assigneeIds.includes(currentUser.id) || 
                              task.ideaOwnerIds?.includes(currentUser.id) || 
                              task.editorIds?.includes(currentUser.id);

            // 1. OVERDUE CHECK
            if (isBefore(task.endDate, today) && !isSameDay(task.endDate, today)) {
                // If I am related OR I am Admin (Admins see all overdue)
                if (isRelated || currentUser.role === 'ADMIN') {
                    const daysLate = differenceInDays(today, task.endDate);
                    newNotifications.push({
                        id: `overdue_${task.id}`,
                        type: 'OVERDUE',
                        title: '🔥 งานเลยกำหนดส่ง (Overdue)',
                        message: `งาน "${task.title}" ล่าช้าไป ${daysLate} วันแล้ว รีบเคลียร์ด่วน!`,
                        taskId: task.id,
                        date: task.endDate,
                        isRead: false
                    });
                }
            }

            // 2. UPCOMING CHECK (Next 3 days)
            else if (isAfter(task.endDate, today) && isBefore(task.endDate, addDays(today, 3)) && isRelated) {
                const daysLeft = differenceInDays(task.endDate, today);
                newNotifications.push({
                    id: `upcoming_${task.id}`,
                    type: 'UPCOMING',
                    title: '⏳ ใกล้ถึงกำหนดส่ง',
                    message: `งาน "${task.title}" ต้องส่งในอีก ${daysLeft} วัน (${daysLeft === 0 ? 'วันนี้' : ''})`,
                    taskId: task.id,
                    date: task.endDate,
                    isRead: false
                });
            }

            // 3. REVIEW CHECK (For Status = FEEDBACK)
            if (task.status === Status.FEEDBACK) {
                // Show to Idea Owner (who might need to review) or Admin
                const isReviewer = task.ideaOwnerIds?.includes(currentUser.id) || currentUser.role === 'ADMIN';
                if (isReviewer) {
                    newNotifications.push({
                        id: `review_${task.id}`,
                        type: 'REVIEW',
                        title: '👀 มีงานรอตรวจ (Review)',
                        message: `งาน "${task.title}" ส่งมาแล้ว รอคุณเข้าไปตรวจครับ`,
                        taskId: task.id,
                        date: new Date(), // Now
                        isRead: false
                    });
                }
            }
        });

        // Sort by priority: Overdue > Review > Upcoming
        const typePriority = { 'OVERDUE': 0, 'REVIEW': 1, 'UPCOMING': 2, 'INFO': 3 };
        
        newNotifications.sort((a, b) => {
            if (typePriority[a.type] !== typePriority[b.type]) {
                return typePriority[a.type] - typePriority[b.type];
            }
            return new Date(b.date).getTime() - new Date(a.date).getTime();
        });

        setNotifications(newNotifications);
        setUnreadCount(newNotifications.length);

    }, [tasks, currentUser]);

    return {
        notifications,
        unreadCount
    };
};
