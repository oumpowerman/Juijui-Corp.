import React, { useState, useCallback } from 'react';
import { Task, User, TaskType } from '../../../types';
import { TeamTaskContextMenuState } from '../../team/modals/TeamTaskContextMenu';
import { TeamTaskDuplicateRequest } from '../../team/modals/TeamTaskDuplicateModal';
import { useGlobalDialog } from '../../../context/GlobalDialogContext';

interface UseCalendarModalsProps {
  onSelectTask: (task: Task, currentViewMode?: string) => void;
  onMoveTask: (task: Task) => void;
  onDelayTask?: (taskId: string, newDate: Date, reason: string) => void;
  onDeleteTask?: (taskId: string, taskType?: TaskType) => void;
  users?: User[];
}

export const useCalendarModals = ({
  onSelectTask,
  onMoveTask,
  onDelayTask,
  onDeleteTask,
  users = [],
}: UseCalendarModalsProps) => {
  const { showConfirm } = useGlobalDialog();

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

  // --- Task Pill Right-Click Context Menu & Quick Duplicate Modal ---
  const [taskContextMenu, setTaskContextMenu] = useState<TeamTaskContextMenuState | null>(null);
  const [duplicateRequest, setDuplicateRequest] = useState<TeamTaskDuplicateRequest | null>(null);

  const handleTaskContextMenu = useCallback((e: React.MouseEvent, task: Task, date?: Date) => {
    e.preventDefault();
    e.stopPropagation();
    const resolvedDate = date || (task.startDate ? new Date(task.startDate) : (task.endDate ? new Date(task.endDate) : new Date()));
    setTaskContextMenu({
      x: e.clientX,
      y: e.clientY,
      task,
      userId: task.assigneeIds?.[0] || '',
      date: resolvedDate,
    });
  }, []);

  const handleContextEdit = useCallback((task: Task) => {
    if (task.type === 'PLAN') {
      setSelectedPlanDate(task.startDate instanceof Date ? task.startDate : new Date(task.startDate || new Date()));
      setSelectedPlanData(task);
      setPlanModalOpen(true);
    } else {
      onSelectTask({ ...task, _openInEditMode: true } as Task, 'EDIT');
    }
  }, [onSelectTask]);

  const handleContextDuplicate = useCallback((task: Task, userId: string, date: Date) => {
    const startDate = task.startDate ? new Date(task.startDate) : date;
    const endDate = task.endDate ? new Date(task.endDate) : startDate;
    const targetUser = users.find(u => u.id === userId);
    setDuplicateRequest({
      sourceTask: task,
      targetUserId: userId,
      targetUser,
      startDate,
      endDate,
    });
  }, [users]);

  const handleContextDelete = useCallback(async (task: Task) => {
    if (!onDeleteTask) return;
    const confirmed = await showConfirm(
      `ต้องการลบงาน "${task.title}" ใช่หรือไม่?`,
      'ยืนยันการลบงาน'
    );
    if (confirmed) {
      onDeleteTask(task.id, task.type === 'CONTENT' ? 'CONTENT' : 'TASK');
    }
  }, [onDeleteTask, showConfirm]);

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

    // Task Context Menu & Duplicate Modal
    taskContextMenu,
    setTaskContextMenu,
    duplicateRequest,
    setDuplicateRequest,
    handleTaskContextMenu,
    handleContextEdit,
    handleContextDuplicate,
    handleContextDelete,
  };
};

