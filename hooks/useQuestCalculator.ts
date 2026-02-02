
import { useMemo } from 'react';
import { WeeklyQuest, Task, Platform } from '../types';
import { addDays, isWithinInterval, differenceInDays, isPast, isToday } from 'date-fns';

export const useQuestCalculator = (quest: WeeklyQuest, allTasks: Task[]) => {
    
    const matchingTasks = useMemo(() => {
        if (quest.questType === 'MANUAL') return [];
        
        const qStart = new Date(quest.weekStartDate);
        qStart.setHours(0, 0, 0, 0);
        const qEnd = quest.endDate ? new Date(quest.endDate) : addDays(qStart, 6);
        qEnd.setHours(23, 59, 59, 999);

        return allTasks.filter(t => {
            if (!t.endDate) return false;
            const taskDate = new Date(t.endDate);
            const inRange = isWithinInterval(taskDate, { start: qStart, end: qEnd });
            if (!inRange) return false;

            const matchChannel = quest.channelId ? t.channelId === quest.channelId : true;
            const matchStatus = quest.targetStatus ? t.status === quest.targetStatus : t.status === 'DONE';
            
            let matchPlatform = true;
            if (quest.targetPlatform) {
                if (quest.targetPlatform === 'ALL') {
                     matchPlatform = (t.targetPlatforms && t.targetPlatforms.length > 0) || false;
                } else {
                     const hasSpecific = t.targetPlatforms?.includes(quest.targetPlatform as Platform);
                     const hasAll = t.targetPlatforms?.includes('ALL');
                     matchPlatform = hasSpecific || hasAll || false;
                }
            }
            
            let matchFormat = true;
            if (quest.targetFormat && quest.targetFormat.length > 0) {
                 matchFormat = t.contentFormat ? quest.targetFormat.includes(t.contentFormat) : false;
            }
            
            return matchStatus && matchChannel && matchPlatform && matchFormat;
        });
    }, [quest, allTasks]);

    const progress = quest.questType === 'MANUAL' ? (quest.manualProgress || 0) : matchingTasks.length;
    const percent = Math.min((progress / quest.targetCount) * 100, 100);
    const isCompleted = percent >= 100;

    const qEnd = quest.endDate ? new Date(quest.endDate) : addDays(new Date(quest.weekStartDate), 6);
    
    // Date Status
    let timeLeftLabel = '';
    const diff = differenceInDays(qEnd, new Date());
    if (isPast(qEnd) && !isToday(qEnd)) timeLeftLabel = 'จบแล้ว';
    else if (isToday(qEnd)) timeLeftLabel = 'วันสุดท้าย';
    else timeLeftLabel = `เหลือ ${diff} วัน`;

    const isExpired = isPast(qEnd) && !isToday(qEnd);
    const isFailed = isExpired && !isCompleted;

    return {
        matchingTasks,
        progress,
        percent,
        isCompleted,
        isExpired,
        isFailed,
        timeLeftLabel,
        qEnd
    };
};
