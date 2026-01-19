
import React, { useState, useEffect } from 'react';
import { addMonths, endOfMonth, endOfWeek, isSameDay } from 'date-fns';
import { Task, ChipConfig } from '../types';
import { DEFAULT_CHIPS } from '../constants';

interface UseCalendarProps {
    tasks: Task[];
    onMoveTask: (task: Task) => void;
}

export const useCalendar = ({ tasks, onMoveTask }: UseCalendarProps) => {
    // --- Navigation State ---
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isExpanded, setIsExpanded] = useState(false);

    // --- Filter State ---
    const [viewMode, setViewMode] = useState<'CONTENT' | 'TASK'>('CONTENT');
    const [filterChannelId, setFilterChannelId] = useState<string>('ALL');
    const [activeChipId, setActiveChipId] = useState<string | 'ALL'>('ALL');
    const [customChips, setCustomChips] = useState<ChipConfig[]>(() => {
        try {
            const saved = localStorage.getItem('juijui_smart_chips');
            return saved ? JSON.parse(saved) : DEFAULT_CHIPS;
        } catch (e) {
            return DEFAULT_CHIPS;
        }
    });

    // --- Animation State ---
    const [showFilters, setShowFilters] = useState(viewMode === 'CONTENT');

    // --- Drag & Drop State ---
    const [dragOverDate, setDragOverDate] = useState<Date | null>(null);

    // --- Modal State (Managed here to simplify parent) ---
    const [isManageModalOpen, setIsManageModalOpen] = useState(false);

    // Effects
    useEffect(() => {
        if (viewMode === 'CONTENT') {
            setShowFilters(true);
        } else {
            const timer = setTimeout(() => setShowFilters(false), 300);
            return () => clearTimeout(timer);
        }
    }, [viewMode]);

    useEffect(() => {
        localStorage.setItem('juijui_smart_chips', JSON.stringify(customChips));
    }, [customChips]);

    // Navigation Handlers
    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => setCurrentDate(addMonths(currentDate, -1));
    const goToToday = () => setCurrentDate(new Date());

    // Grid Calculation
    const getStartOfWeek = (d: Date) => {
        const date = new Date(d);
        const day = date.getDay();
        const diff = date.getDate() - day;
        date.setDate(diff);
        date.setHours(0,0,0,0);
        return date;
    };
    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const monthEnd = endOfMonth(monthStart);
    const startDate = getStartOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

    // Filtering Logic
    const filterTasks = (tasksToFilter: Task[]) => {
        let filtered = tasksToFilter.filter(t => t.type === viewMode);

        if (viewMode === 'CONTENT' && filterChannelId !== 'ALL') {
            filtered = filtered.filter(t => t.channelId === filterChannelId);
        }

        if (viewMode === 'CONTENT' && activeChipId !== 'ALL') {
            const activeChip = customChips.find(c => c.id === activeChipId);
            if (activeChip) {
                switch (activeChip.type) {
                    case 'CHANNEL':
                        filtered = filtered.filter(t => t.channelId === activeChip.value);
                        break;
                    case 'FORMAT':
                        filtered = filtered.filter(t => t.contentFormat === activeChip.value);
                        break;
                    case 'STATUS':
                        filtered = filtered.filter(t => t.status === activeChip.value);
                        break;
                    case 'PILLAR':
                        filtered = filtered.filter(t => t.pillar === activeChip.value);
                        break;
                }
            }
        }
        return filtered;
    };

    const getTasksForDay = (day: Date) => {
        return tasks.filter(task => isSameDay(day, task.endDate));
    };

    // Chip Management
    const saveChip = (chip: ChipConfig) => {
        if (customChips.find(c => c.id === chip.id)) {
            setCustomChips(prev => prev.map(c => c.id === chip.id ? chip : c));
        } else {
            setCustomChips(prev => [...prev, chip]);
        }
    };

    const deleteChip = (id: string) => {
        setCustomChips(prev => prev.filter(c => c.id !== id));
        if (activeChipId === id) setActiveChipId('ALL');
    };

    // Drag & Drop
    const handleDragStart = (e: React.DragEvent, taskId: string) => {
        e.dataTransfer.setData("taskId", taskId);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e: React.DragEvent, day: Date) => {
        e.preventDefault(); 
        e.dataTransfer.dropEffect = "move";
        if (!dragOverDate || !isSameDay(day, dragOverDate)) {
            setDragOverDate(day);
        }
    };

    const handleDrop = (e: React.DragEvent, targetDate: Date) => {
        e.preventDefault();
        setDragOverDate(null);
        
        const taskId = e.dataTransfer.getData("taskId");
        if (!taskId) return;

        const taskToMove = tasks.find(t => t.id === taskId);
        if (taskToMove && !isSameDay(taskToMove.endDate, targetDate)) {
            const updatedTask = { 
                ...taskToMove, 
                startDate: targetDate, 
                endDate: targetDate,
                isUnscheduled: false
            };
            onMoveTask(updatedTask);
        }
    };

    return {
        // State
        currentDate,
        viewMode,
        filterChannelId,
        activeChipId,
        customChips,
        isExpanded,
        showFilters,
        dragOverDate,
        isManageModalOpen,
        
        // Calculated
        startDate,
        endDate,

        // Setters
        setViewMode,
        setFilterChannelId,
        setActiveChipId,
        setIsExpanded,
        setIsManageModalOpen,

        // Handlers
        nextMonth,
        prevMonth,
        goToToday,
        filterTasks,
        getTasksForDay,
        saveChip,
        deleteChip,
        handleDragStart,
        handleDragOver,
        handleDrop,
        setDragOverDate // Exposed for onDragLeave if needed
    };
};
