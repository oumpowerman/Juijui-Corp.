
import { AppNotification, Task } from '../types';
import { differenceInCalendarDays, startOfDay } from 'date-fns';

/**
 * 🛡️ Layer 1: Data Standardization & Sanitization
 * Ensure all data entering the notification system is clean and null-safe.
 */

// 1. Game Logs Mapper
export const mapGameLogToNotification = (log: any, lastReadTime: Date): AppNotification => {
    // Sanitize values: Ensure numbers are not null
    const hpChange = log.hp_change ?? 0;
    const xpChange = log.xp_change ?? 0;
    const jpChange = log.jp_change ?? 0;

    // Determine Penalty/Reward based on action type or values
    const isPenalty = hpChange < 0 || jpChange < 0 || 
                      ['TASK_LATE', 'DUTY_MISSED', 'ATTENDANCE_ABSENT', 'ATTENDANCE_LATE'].includes(log.action_type);

    // Dynamic Title
    let title = isPenalty ? '📉 โดนหักคะแนน!' : '🎉 ได้รับรางวัล!';
    if (log.action_type === 'SHOP_PURCHASE') title = '🛍️ ช้อปปิ้งสำเร็จ';
    if (log.action_type === 'ITEM_USE') title = '🧪 ใช้งานไอเทม';

    // Build cleaner message (remove redundant stats from text)
    const message = log.description || (isPenalty ? 'มีการหักคะแนนในระบบ' : 'ได้รับรางวัลจากระบบ');

    return {
        id: `game_${log.id}`,
        type: isPenalty ? 'GAME_PENALTY' : 'GAME_REWARD',
        title: title,
        message: message,
        date: new Date(log.created_at),
        isRead: new Date(log.created_at) < lastReadTime,
        metadata: {
            hp: hpChange,
            xp: xpChange,
            coins: jpChange
        }
    };
};

// 2. Task Overdue Mapper
export const mapTaskOverdueNotification = (task: Task, today: Date, lastReadTime: Date): AppNotification => {
    // Precise Date Calc
    const taskDate = startOfDay(new Date(task.endDate));
    const daysLate = differenceInCalendarDays(today, taskDate);
    
    return {
        id: `overdue_${task.id}_${daysLate}`, // Unique ID per day state to allow dismissal tracking if needed
        type: 'OVERDUE',
        title: '🔥 งานเลยกำหนด (Overdue)',
        message: `งาน "${task.title}" ล่าช้ามาแล้ว ${daysLate} วัน`,
        taskId: task.id,
        date: new Date(), // Alert time is NOW
        isRead: false, // Always unread if it's a fresh alert generation check
        metadata: {
            subText: `Due: ${task.endDate ? new Date(task.endDate).toLocaleDateString('th-TH') : 'N/A'}`
        }
    };
};

// 3. Task Upcoming Mapper
export const mapTaskUpcomingNotification = (task: Task, today: Date, lastReadTime: Date): AppNotification => {
    const taskDate = startOfDay(new Date(task.endDate));
    const daysLeft = differenceInCalendarDays(taskDate, today);
    
    return {
        id: `upcoming_${task.id}_${daysLeft}`,
        type: 'UPCOMING',
        title: '⏳ ใกล้ถึงกำหนดส่ง',
        message: `งาน "${task.title}" ต้องส่งในอีก ${daysLeft} วัน`,
        taskId: task.id,
        date: new Date(),
        isRead: false, // Generated alert
        metadata: {
            subText: daysLeft === 0 ? 'ต้องส่งภายในวันนี้!' : (daysLeft === 1 ? 'ส่งพรุ่งนี้' : '')
        }
    };
};

// 4. Leave Request Mapper
export const mapLeaveRequestNotification = (req: any, lastReadTime: Date): AppNotification => {
    const userName = req.profiles?.full_name || 'พนักงาน (Unknown)';
    
    return {
        id: `leave_${req.id}`,
        type: 'APPROVAL_REQ',
        title: '📋 คำขออนุมัติใหม่',
        message: `คุณ ${userName} ส่งคำขอ: "${req.reason || 'ไม่ระบุเหตุผล'}"`,
        date: new Date(req.created_at),
        isRead: new Date(req.created_at) < lastReadTime,
        actionLink: 'ATTENDANCE',
        metadata: {
            subText: `Type: ${req.type}`
        }
    };
};

// 5. DB Notification Mapper (Standard)
export const mapDbNotification = (n: any, lastReadTime: Date): AppNotification => ({
    id: n.id,
    type: n.type,
    title: n.title,
    message: n.message || '',
    taskId: n.related_id,
    date: new Date(n.created_at),
    isRead: n.is_read || new Date(n.created_at) < lastReadTime,
    actionLink: n.link_path
});
