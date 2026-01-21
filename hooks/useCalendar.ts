
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
    
    // CHANGED: activeChipId (string) -> activeChipIds (string[]) to support multi-select
    const [activeChipIds, setActiveChipIds] = useState<string[]>([]);
    
    // Improved Initialization Logic
    const [customChips, setCustomChips] = useState<ChipConfig[]>(() => {
        try {
            const saved = localStorage.getItem('juijui_smart_chips');
            // If nothing saved, or saved is 'undefined'/'null' string, fallback immediately
            if (!saved || saved === 'undefined' || saved === 'null') {
                return DEFAULT_CHIPS;
            }
            const parsed = JSON.parse(saved);
            // Verify structure
            return Array.isArray(parsed) ? parsed : DEFAULT_CHIPS;
        } catch (e) {
            console.error("Failed to load chips, resetting to default:", e);
            return DEFAULT_CHIPS;
        }
    });

    // --- Animation State ---
    const [showFilters, setShowFilters] = useState(true);

    // --- Drag & Drop State ---
    const [dragOverDate, setDragOverDate] = useState<Date | null>(null);

    // --- Modal State (Managed here to simplify parent) ---
    const [isManageModalOpen, setIsManageModalOpen] = useState(false);

    // Effects
    useEffect(() => {
        // When view mode changes, clear active chips to avoid applying irrelevant filters
        setActiveChipIds([]);
        setShowFilters(true); // Always show filters bar if applicable
    }, [viewMode]);

    useEffect(() => {
        // Only save if valid array
        if(customChips && Array.isArray(customChips)) {
            localStorage.setItem('juijui_smart_chips', JSON.stringify(customChips));
        }
    }, [customChips]);

    // Navigation Handlers
    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => setCurrentDate(addMonths(currentDate, -1));
    const goToToday = () => setCurrentDate(new Date());

    // Grid Calculation
    const getStartOfWeek = (d: Date) => {
        const date = new Date(d);
        const day = date.getDay();
        const diff = date.getDate() - day; // Adjust if week starts on Monday
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

        // Multi-select OR Logic
        // Check if any chips are active. The UI ensures only chips relevant to current viewMode are selectable.
        if (activeChipIds.length > 0 && Array.isArray(customChips)) {
            filtered = filtered.filter(t => {
                // Check if task matches ANY of the active chips
                return activeChipIds.some(chipId => {
                    const chip = customChips.find(c => c.id === chipId);
                    if (!chip) return false;

                    switch (chip.type) {
                        case 'CHANNEL':
                            return t.channelId === chip.value;
                        case 'FORMAT':
                            return t.contentFormat === chip.value;
                        case 'STATUS':
                            return t.status === chip.value;
                        case 'PILLAR':
                            return t.pillar === chip.value;
                        default:
                            return false;
                    }
                });
            });
        }
        return filtered;
    };

    const getTasksForDay = (day: Date) => {
        return tasks.filter(task => isSameDay(day, task.endDate));
    };

    // Chip Management
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

    // Toggle Chip Selection
    const toggleChip = (id: string) => {
        if (id === 'ALL') {
            setActiveChipIds([]); // Clear all
        } else {
            setActiveChipIds(prev => 
                prev.includes(id) 
                ? prev.filter(c => c !== id) // Remove if exists
                : [...prev, id] // Add if not exists
            );
        }
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
        activeChipIds, // New Export
        customChips: Array.isArray(customChips) ? customChips : [],
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
        toggleChip, // New Export
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
        setDragOverDate 
    };
};
