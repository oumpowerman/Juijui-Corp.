
import { AppNotification, Task, User } from '../types';
import { differenceInCalendarDays, isBefore, isAfter, addDays, isSameDay, startOfDay, isValid } from 'date-fns';
import { isTaskCompleted } from '../constants';

// This function contains the logic you were looking for (mapping game logs to visual notifications)
export const mapGameLogToNotification = (log: any, lastReadTime: Date): AppNotification => {
    // Determine if it's Good or Bad based on HP/XP change or Action Type
    const isPenalty = log.hp_change < 0 || log.jp_change < 0 || 
                      ['TASK_LATE', 'DUTY_MISSED', 'ATTENDANCE_ABSENT', 'ATTENDANCE_LATE'].includes(log.action_type);
    
    // Special cases for better UX titles
    let title = isPenalty ? '📉 โดนหักคะแนน!' : '🎉 ได้รับรางวัล!';
    if (log.action_type === 'ATTENDANCE_FORGOT_CHECKOUT') title = '⚠️ ลืมตอกบัตรออก';
    if (log.action_type === 'ATTENDANCE_ABSENT') title = '❌ ขาดงาน';
    if (log.action_type === 'TASK_LATE') title = '⏰ ส่งงานล่าช้า';
    if (log.action_type === 'ATTENDANCE_EARLY_LEAVE') title = '🕒 กลับก่อนเวลา';
    if (log.action_type === 'DUTY_MISSED') title = '🚫 เพิกเฉยเวร';
    if (log.action_type === 'DUTY_LATE_SUBMIT') title = '⏰ ส่งเวรล่าช้า';
    
    // Create rich metadata instead of baking into string
    const metadata = {
        hp: log.hp_change,
        xp: log.xp_change,
        coins: log.jp_change,
        reason: log.description
    };

    const profile = log.profiles;

    return {
        id: `game_${log.id}`,
        type: isPenalty ? 'GAME_PENALTY' : 'GAME_REWARD',
        title: title,
        message: log.description, // Keep simple message
        date: new Date(log.created_at),
        isRead: new Date(log.created_at) < lastReadTime,
        metadata: metadata, // Pass structured data
        user: profile ? { 
            name: profile.full_name, 
            avatarUrl: profile.avatar_url,
            id: log.user_id 
        } : undefined
    };
};

// This function handles Task logic (Overdue/Upcoming)
export const mapTaskToNotification = (task: Task, currentUser: User, lastReadTime: Date): AppNotification | null => {
    if (isTaskCompleted(task.status as string) || task.isUnscheduled) return null;

    const isRelated = task.assigneeIds.includes(currentUser.id) || 
                      task.ideaOwnerIds?.includes(currentUser.id) || 
                      task.editorIds?.includes(currentUser.id);

    const today = new Date();
    const startOfToday = startOfDay(today);
    const endDateObj = new Date(task.endDate);

    if (!isValid(endDateObj)) return null;

    // Overdue Logic
    if (isBefore(endDateObj, today) && !isSameDay(endDateObj, today)) {
        if (isRelated || currentUser.role === 'ADMIN') {
            const daysLate = differenceInCalendarDays(today, endDateObj);
            
            return {
                id: `overdue_${task.id}`,
                type: 'OVERDUE',
                title: '🔥 งานเลยกำหนด (Overdue)',
                message: `งาน "${task.title}" ล่าช้า ${isNaN(daysLate) ? '?' : daysLate} วันแล้ว รีบเคลียร์ด่วน!`,
                taskId: task.id,
                date: startOfToday,
                isRead: startOfToday < lastReadTime
            };
        }
    } 
    // Upcoming Logic
    else if (isAfter(endDateObj, today) && isBefore(endDateObj, addDays(today, 3)) && isRelated) {
        const daysLeft = differenceInCalendarDays(endDateObj, today);
        
        return {
            id: `upcoming_${task.id}`,
            type: 'UPCOMING',
            title: '⏳ ใกล้ถึงกำหนดส่ง',
            message: `งาน "${task.title}" ต้องส่งในอีก ${daysLeft} วัน (${daysLeft === 0 ? 'วันนี้' : daysLeft === 1 ? 'พรุ่งนี้' : daysLeft + ' วัน'})`,
            taskId: task.id,
            date: startOfToday,
            isRead: startOfToday < lastReadTime
        };
    }

    return null;
};
