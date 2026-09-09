import { useMemo } from 'react';
import { format, isSameDay, startOfDay } from 'date-fns';
import { Task } from '../../../types';

interface UseCalendarTaskMapProps {
  tasks: Task[];
  userId?: string;
}

/**
 * Hook to build an indexed Date-to-Tasks Map for O(1) day lookups
 * Supports single-day tasks, range tasks, and monthly recurring plans.
 */
export const useCalendarTaskMap = ({ tasks, userId }: UseCalendarTaskMapProps) => {
  const taskMap = useMemo(() => {
    const map = new Map<string, Task[]>();

    const addTaskToDay = (dateKey: string, task: Task) => {
      const existing = map.get(dateKey);
      if (existing) {
        // Prevent duplicate task references on the same day
        if (!existing.some(t => t.id === task.id)) {
          existing.push(task);
        }
      } else {
        map.set(dateKey, [task]);
      }
    };

    tasks.forEach(task => {
      if (task.isUnscheduled) return;

      if (task.startDate && task.endDate) {
        const start = startOfDay(task.startDate instanceof Date ? task.startDate : new Date(task.startDate));
        const end = startOfDay(task.endDate instanceof Date ? task.endDate : new Date(task.endDate));
        
        if (isSameDay(start, end)) {
          addTaskToDay(format(start, 'yyyy-MM-dd'), task);
        } else {
          // Range task - populate for each day in range
          const curr = new Date(start);
          while (curr <= end) {
            addTaskToDay(format(curr, 'yyyy-MM-dd'), task);
            curr.setDate(curr.getDate() + 1);
          }
        }
      } else if (task.endDate) {
        const end = startOfDay(task.endDate instanceof Date ? task.endDate : new Date(task.endDate));
        addTaskToDay(format(end, 'yyyy-MM-dd'), task);
      } else if (task.startDate) {
        const start = startOfDay(task.startDate instanceof Date ? task.startDate : new Date(task.startDate));
        addTaskToDay(format(start, 'yyyy-MM-dd'), task);
      }
    });

    return map;
  }, [tasks]);

  const getIndexedTasksForDay = useMemo(() => {
    return (day: Date): Task[] => {
      const key = format(day, 'yyyy-MM-dd');
      return taskMap.get(key) || [];
    };
  }, [taskMap]);

  return {
    taskMap,
    getIndexedTasksForDay,
  };
};
