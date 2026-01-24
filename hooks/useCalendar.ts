
import React, { useState, useEffect, useCallback } from 'react';
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
    
    const [activeChipIds, setActiveChipIds] = useState<string[]>([]);
    
    const [customChips, setCustomChips] = useState<ChipConfig[]>(() => {
        try {
            const saved = localStorage.getItem('juijui_smart_chips');
            if (!saved || saved === 'undefined' || saved === 'null') {
                return DEFAULT_CHIPS;
            }
            const parsed = JSON.parse(saved);
            return Array.isArray(parsed) ? parsed : DEFAULT_CHIPS;
        } catch (e) {
            console.error("Failed to load chips, resetting to default:", e);
            return DEFAULT_CHIPS;
        }
    });

    const [showFilters, setShowFilters] = useState(true);
    const [dragOverDate, setDragOverDate] = useState<Date | null>(null);
    const [isManageModalOpen, setIsManageModalOpen] = useState(false);

    useEffect(() => {
        setActiveChipIds([]);
        setShowFilters(true);
    }, [viewMode]);

    useEffect(() => {
        if(customChips && Array.isArray(customChips)) {
            localStorage.setItem('juijui_smart_chips', JSON.stringify(customChips));
        }
    }, [customChips]);

    const nextMonth = useCallback(() => setCurrentDate(prev => addMonths(prev, 1)), []);
    const prevMonth = useCallback(() => setCurrentDate(prev => addMonths(prev, -1)), []);
    const goToToday = useCallback(() => setCurrentDate(new Date()), []);

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

    // Memoize Filter Logic
    const filterTasks = useCallback((tasksToFilter: Task[]) => {
        let filtered = tasksToFilter.filter(t => t.type === viewMode);

        if (activeChipIds.length > 0 && Array.isArray(customChips)) {
            filtered = filtered.filter(t => {
                return activeChipIds.some(chipId => {
                    const chip = customChips.find(c => c.id === chipId);
                    if (!chip) return false;

                    switch (chip.type) {
                        case 'CHANNEL': return t.channelId === chip.value;
                        case 'FORMAT': return t.contentFormat === chip.value;
                        case 'STATUS': return t.status === chip.value;
                        case 'PILLAR': return t.pillar === chip.value;
                        default: return false;
                    }
                });
            });
        }
        return filtered;
    }, [viewMode, activeChipIds, customChips]);

    const getTasksForDay = useCallback((day: Date) => {
        return tasks.filter(task => isSameDay(day, task.endDate) && !task.isUnscheduled);
    }, [tasks]);

    const saveChip = (chip: ChipConfig) => {
        setCustomChips(prev => {
            const current = Array.isArray(prev) ? prev : [];
            if (current.find(c => c.id === chip.id)) {
                return current.map(c => c.id === chip.id ? chip : c);
            } else {
                return [...current, chip];
            }
        });
    };

    const deleteChip = (id: string) => {
        setCustomChips(prev => (Array.isArray(prev) ? prev : []).filter(c => c.id !== id));
        setActiveChipIds(prev => prev.filter(cId => cId !== id));
    };

    const toggleChip = (id: string) => {
        if (id === 'ALL') {
            setActiveChipIds([]);
        } else {
            setActiveChipIds(prev => 
                prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
            );
        }
    };

    // Memoize Drag Handlers
    const handleDragStart = useCallback((e: React.DragEvent, taskId: string) => {
        e.dataTransfer.setData("taskId", taskId);
        e.dataTransfer.effectAllowed = "move";
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent, day: Date) => {
        e.preventDefault(); 
        e.dataTransfer.dropEffect = "move";
        // Optimized: Only update state if date actually changes
        setDragOverDate(prev => (!prev || !isSameDay(day, prev)) ? day : prev);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent, targetDate: Date) => {
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
    }, [tasks, onMoveTask]);

    return {
        currentDate,
        viewMode,
        filterChannelId,
        activeChipIds,
        customChips: Array.isArray(customChips) ? customChips : [],
        isExpanded,
        showFilters,
        dragOverDate,
        isManageModalOpen,
        
        startDate,
        endDate,

        setViewMode,
        setFilterChannelId,
        toggleChip,
        setIsExpanded,
        setIsManageModalOpen,

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
        setDragOverDate 
    };
};
