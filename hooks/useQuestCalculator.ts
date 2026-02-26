
import { useMemo } from 'react';
import { WeeklyQuest, Task } from '../types';
import { addDays, differenceInDays, isPast, isToday } from 'date-fns';
import { isTaskMatchingQuest } from '../utils/questUtils';

export const useQuestCalculator = (quest: WeeklyQuest, allTasks: Task[]) => {
    
    const matchingTasks = useMemo(() => {
        if (quest.questType === 'MANUAL') return [];
        return allTasks.filter(t => isTaskMatchingQuest(t, quest));
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
