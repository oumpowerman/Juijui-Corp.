import { useState, useCallback } from 'react';
import { Task } from '../../../types';

interface UseCalendarModalsProps {
  onSelectTask: (task: Task) => void;
  onMoveTask: (task: Task) => void;
  onDelayTask?: (taskId: string, newDate: Date, reason: string) => void;
}

export const useCalendarModals = ({
  onSelectTask,
  onMoveTask,
  onDelayTask,
}: UseCalendarModalsProps) => {
  // --- Delay Logic ---
  const [delayModalOpen, setDelayModalOpen] = useState(false);
  const [pendingDelayTask, setPendingDelayTask] = useState<Task | null>(null);

  const handleMoveAttempt = useCallback((updatedTask: Task) => {
    onMoveTask(updatedTask);
  }, [onMoveTask]);

  const confirmDelay = useCallback((reason: string) => {
    if (pendingDelayTask && onDelayTask) {
      onDelayTask(pendingDelayTask.id, pendingDelayTask.endDate, reason);
      setDelayModalOpen(false);
      setPendingDelayTask(null);
    }
  }, [pendingDelayTask, onDelayTask]);

  // --- Highlights Logic ---
  const [highlightModalOpen, setHighlightModalOpen] = useState(false);
  const [selectedHighlightDate, setSelectedHighlightDate] = useState<Date | null>(null);

  const handleDayContextMenu = useCallback((day: Date) => {
    setSelectedHighlightDate(day);
    setHighlightModalOpen(true);
  }, []);

  // --- Plan/Schedules Custom Form States ---
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [selectedPlanDate, setSelectedPlanDate] = useState<Date | null>(null);
  const [selectedPlanData, setSelectedPlanData] = useState<Task | null>(null);

  const handleTaskClick = useCallback((task: Task) => {
    if (task.type === 'PLAN') {
      setSelectedPlanDate(task.startDate instanceof Date ? task.startDate : new Date(task.startDate));
      setSelectedPlanData(task);
      setPlanModalOpen(true);
    } else {
      onSelectTask(task);
    }
  }, [onSelectTask]);

  const handleOpenPlanForDate = useCallback((date: Date, planData: Task | null = null) => {
    setSelectedPlanDate(date);
    setSelectedPlanData(planData);
    setPlanModalOpen(true);
  }, []);

  // --- Day Task List Modal ---
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [selectedDayTasks, setSelectedDayTasks] = useState<Task[]>([]);
  const [selectedDayDate, setSelectedDayDate] = useState<Date>(new Date());

  const handleDayClick = useCallback((day: Date, dayTasks: Task[]) => {
    setSelectedDayDate(day);
    setSelectedDayTasks(dayTasks);
    setIsListModalOpen(true);
  }, []);

  return {
    // Delay Modal
    delayModalOpen,
    setDelayModalOpen,
    pendingDelayTask,
    setPendingDelayTask,
    handleMoveAttempt,
    confirmDelay,

    // Highlight Modal
    highlightModalOpen,
    setHighlightModalOpen,
    selectedHighlightDate,
    setSelectedHighlightDate,
    handleDayContextMenu,

    // Plan Modal
    planModalOpen,
    setPlanModalOpen,
    selectedPlanDate,
    setSelectedPlanDate,
    selectedPlanData,
    setSelectedPlanData,
    handleTaskClick,
    handleOpenPlanForDate,

    // Day List Modal
    isListModalOpen,
    setIsListModalOpen,
    selectedDayTasks,
    setSelectedDayTasks,
    selectedDayDate,
    setSelectedDayDate,
    handleDayClick,
  };
};
