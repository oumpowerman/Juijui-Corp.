
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { addMonths, endOfMonth, endOfWeek, isSameDay } from 'date-fns';
import { supabase } from '../lib/supabase';
import { Task, ChipConfig, FilterType } from '../types';
import { DEFAULT_CHIPS } from '../constants';

interface UseCalendarProps {
    tasks: Task[];
    userId?: string;
    onMoveTask: (task: Task) => void;
}

export const useCalendar = ({ tasks, userId, onMoveTask }: UseCalendarProps) => {
    // --- Navigation State ---
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isExpanded, setIsExpanded] = useState(false);

    // --- Filter State ---
    const [viewMode, setViewMode] = useState<'CONTENT' | 'TASK' | 'PLAN'>('CONTENT');
    const [showPlanOverlay, setShowPlanOverlay] = useState<boolean>(() => {
        try {
            const saved = localStorage.getItem('calendar_plan_overlay');
            return saved !== null ? saved === 'true' : true; // Default ON
        } catch {
            return true;
        }
    });

    const togglePlanOverlay = useCallback(() => {
        setShowPlanOverlay(prev => {
            const next = !prev;
            try {
                localStorage.setItem('calendar_plan_overlay', String(next));
            } catch {}
            return next;
        });
    }, []);

    const [filterChannelId, setFilterChannelId] = useState<string>('ALL');
    
    const [activeChipIds, setActiveChipIds] = useState<string[]>([]);
    
    const [customChips, setCustomChips] = useState<ChipConfig[]>([]);

    const [showFilters, setShowFilters] = useState(false);
    const [dragOverDate, setDragOverDate] = useState<Date | null>(null);
    const [isManageModalOpen, setIsManageModalOpen] = useState(false);

    // --- Fetch Custom Chips from DB ---
    const fetchCustomChips = useCallback(async () => {
        if (!userId) return;
        try {
            // 1. Fetch existing filters
            const { data, error } = await supabase
                .from('smart_filters')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: true });

            if (error) throw error;
            
            // 2. If NO filters exist, SEED the default ones into DB
            /*
            if (data && data.length === 0) {
                const seedData = DEFAULT_CHIPS.map(chip => ({
                    id: `${chip.id}_${userId}`, // Suffix with userId to ensure global uniqueness
                    user_id: userId,
                    label: chip.label,
                    type: chip.type,
                    value: chip.value,
                    color_theme: chip.colorTheme,
                    scope: chip.scope || 'CONTENT',
                    mode: chip.mode || 'INCLUDE'
                }));

                // Use upsert to handle potential race conditions during initial seeding
                const { error: seedError } = await supabase
                    .from('smart_filters')
                    .upsert(seedData, { onConflict: 'id' });

                if (seedError) throw seedError;

                // Set state to default chips with user-specific IDs
                const chipsWithUserIds = DEFAULT_CHIPS.map(chip => ({
                    ...chip,
                    id: `${chip.id}_${userId}`
                }));
                setCustomChips(chipsWithUserIds);
                return;
            }
            */
            if (data && data.length === 0) {
                setCustomChips([]);
                return;
            }

            // 3. If filters exist, use them as the Source of Truth
            if (data) {
                const dbChips: ChipConfig[] = data.map(d => ({
                    id: d.id,
                    label: d.label,
                    type: d.type as FilterType,
                    value: d.value,
                    colorTheme: d.color_theme,
                    scope: d.scope,
                    mode: d.mode
                }));

                setCustomChips(dbChips);
            }
        } catch (err) {
            console.error('Failed to fetch/seed smart filters:', err);
        }
    }, [userId]);

    useEffect(() => {
        fetchCustomChips();
    }, [fetchCustomChips]);

    useEffect(() => {
        setActiveChipIds([]);
    }, [viewMode]);

    const toggleFilters = useCallback(() => setShowFilters(prev => !prev), []);

    const nextMonth = useCallback(() => setCurrentDate(prev => addMonths(prev, 1)), []);
    const prevMonth = useCallback(() => setCurrentDate(prev => addMonths(prev, -1)), []);
    const nextWeek = useCallback(() => setCurrentDate(prev => {
        const next = new Date(prev);
        next.setDate(next.getDate() + 7);
        return next;
    }), []);
    const prevWeek = useCallback(() => setCurrentDate(prev => {
        const prevDate = new Date(prev);
        prevDate.setDate(prevDate.getDate() - 7);
        return prevDate;
    }), []);
    const goToToday = useCallback(() => setCurrentDate(new Date()), []);

    const getStartOfWeek = useCallback((d: Date) => {
        const date = new Date(d);
        const day = date.getDay();
        const diff = date.getDate() - day; 
        date.setDate(diff);
        date.setHours(0,0,0,0);
        return date;
    }, []);

    const { startDate, endDate } = useMemo(() => {
        const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const monthEnd = endOfMonth(monthStart);
        return {
            startDate: getStartOfWeek(monthStart),
            endDate: endOfWeek(monthEnd, { weekStartsOn: 0 })
        };
    }, [currentDate.getFullYear(), currentDate.getMonth(), getStartOfWeek]);

    // Helper: Check if task matches chip criteria
    const checkMatch = (t: Task, chip: ChipConfig) => {
        switch (chip.type) {
            case 'CHANNEL': return t.channelId === chip.value;
            case 'FORMAT': {
                const formats = t.contentFormats || [];
                return formats.includes(chip.value);
            }
            case 'STATUS': return t.status === chip.value;
            case 'PILLAR': return t.pillar === chip.value;
            case 'CATEGORY': return t.category === chip.value;
            case 'ASSIGNEE': return t.assigneeIds?.includes(chip.value);
            default: return false;
        }
    };

    // Memoize Filter Logic with Exclusion Support
    const filterTasks = useCallback((tasksToFilter: Task[]) => {
        let filtered = tasksToFilter.filter(t => {
            if (viewMode === 'CONTENT') {
                if (t.type === 'CONTENT') return true;
                if (showPlanOverlay && t.type === 'PLAN') {
                    // Privacy check: If user is logged in, check assigneeIds
                    if (userId && t.assigneeIds && t.assigneeIds.length > 0) {
                        return t.assigneeIds.includes(userId);
                    }
                    return true;
                }
                return false;
            }
            if (viewMode === 'PLAN') {
                if (t.type !== 'PLAN') return false;
                // Privacy / Visibility: If user is logged in, show only plans assigned to or created by them
                if (userId && t.assigneeIds && t.assigneeIds.length > 0) {
                    return t.assigneeIds.includes(userId);
                }
                return true;
            }
            // In TASK Mode
            if (t.type === 'TASK') return true;
            if (showPlanOverlay && t.type === 'PLAN') {
                if (userId && t.assigneeIds && t.assigneeIds.length > 0) {
                    return t.assigneeIds.includes(userId);
                }
                return true;
            }
            return false;
        });

        if (activeChipIds.length > 0 && Array.isArray(customChips)) {
            // Get all active chip objects
            const activeChips = customChips.filter(c => activeChipIds.includes(c.id));
            
            // Separate into Include and Exclude lists
            const excludeChips = activeChips.filter(c => c.mode === 'EXCLUDE');
            const includeChips = activeChips.filter(c => c.mode !== 'EXCLUDE'); // Default to INCLUDE if undefined

            filtered = filtered.filter(t => {
                // 1. Exclusion Logic: If matches ANY exclude chip -> HIDE IT
                if (excludeChips.length > 0) {
                    const shouldExclude = excludeChips.some(chip => checkMatch(t, chip));
                    if (shouldExclude) return false;
                }

                // 2. Inclusion Logic: If there are include chips, MUST match AT LEAST ONE
                if (includeChips.length > 0) {
                    const isIncluded = includeChips.some(chip => checkMatch(t, chip));
                    if (!isIncluded && t.type !== 'PLAN') return false;
                }

                return true;
            });
        }
        return filtered;
    }, [viewMode, showPlanOverlay, activeChipIds, customChips, userId]);

    const getTasksForDay = useCallback((day: Date) => {
        return tasks.filter(task => {
            if (task.isUnscheduled) return false;

            const isMatchingPlan = (t: Task) => {
                if (userId && t.assigneeIds && t.assigneeIds.length > 0 && !t.assigneeIds.includes(userId)) {
                    return false;
                }

                if (t.isMonthlyRecurring || t.recurrence === 'MONTHLY') {
                    const dayNum = day.getDate();
                    const sDay = t.routineStartDay !== undefined 
                        ? t.routineStartDay 
                        : (t.startDate ? new Date(t.startDate).getDate() : dayNum);
                    const eDay = t.routineEndDay !== undefined 
                        ? t.routineEndDay 
                        : (t.endDate ? new Date(t.endDate).getDate() : sDay);
                    
                    if (sDay <= eDay) {
                        return dayNum >= sDay && dayNum <= eDay;
                    } else {
                        // Wraps around month boundary
                        return dayNum >= sDay || dayNum <= eDay;
                    }
                }

                // One-time date range
                if (t.startDate && t.endDate) {
                    const tStart = new Date(t.startDate);
                    tStart.setHours(0, 0, 0, 0);
                    const tEnd = new Date(t.endDate);
                    tEnd.setHours(23, 59, 59, 999);
                    const d = new Date(day);
                    d.setHours(12, 0, 0, 0);
                    return d >= tStart && d <= tEnd;
                }

                if (t.endDate) return isSameDay(day, new Date(t.endDate));
                if (t.startDate) return isSameDay(day, new Date(t.startDate));
                return false;
            };

            const isMatchingTask = (t: Task) => {
                if (t.startDate && t.endDate) {
                    const tStart = new Date(t.startDate);
                    tStart.setHours(0, 0, 0, 0);
                    const tEnd = new Date(t.endDate);
                    tEnd.setHours(23, 59, 59, 999);
                    const d = new Date(day);
                    d.setHours(12, 0, 0, 0);
                    return d >= tStart && d <= tEnd;
                }
                if (t.endDate) return isSameDay(day, new Date(t.endDate));
                if (t.startDate) return isSameDay(day, new Date(t.startDate));
                return false;
            };
            
            if (viewMode === 'CONTENT') {
                if (task.type === 'CONTENT') {
                    return isSameDay(day, new Date(task.endDate));
                }
                if (showPlanOverlay && task.type === 'PLAN') {
                    return isMatchingPlan(task);
                }
                return false;
            }

            // In PLAN Mode: Support monthly recurring routines and multi-day spans
            if (viewMode === 'PLAN') {
                if (task.type !== 'PLAN') return false;
                return isMatchingPlan(task);
            }

            // In TASK Mode: calculate date range [startDate, endDate]
            if (task.type === 'TASK') {
                return isMatchingTask(task);
            }
            if (showPlanOverlay && task.type === 'PLAN') {
                return isMatchingPlan(task);
            }

            return false;
        });
    }, [tasks, viewMode, showPlanOverlay, userId]);

    const saveChip = async (chip: ChipConfig) => {
        if (!userId) return;

        // Optimistic Update
        setCustomChips(prev => {
            const current = Array.isArray(prev) ? prev : [];
            if (current.find(c => c.id === chip.id)) {
                return current.map(c => c.id === chip.id ? chip : c);
            } else {
                return [...current, chip];
            }
        });

        try {
            const { error } = await supabase
                .from('smart_filters')
                .upsert({
                    id: chip.id,
                    user_id: userId,
                    label: chip.label,
                    type: chip.type,
                    value: chip.value,
                    color_theme: chip.colorTheme,
                    scope: chip.scope || 'CONTENT',
                    mode: chip.mode || 'INCLUDE',
                    updated_at: new Date().toISOString()
                });
            if (error) throw error;
        } catch (err) {
            console.error('Failed to save smart filter:', err);
        }
    };

    const deleteChip = async (id: string) => {
        if (!userId) return;

        // Optimistic Update
        setCustomChips(prev => (Array.isArray(prev) ? prev : []).filter(c => c.id !== id));
        setActiveChipIds(prev => prev.filter(cId => cId !== id));

        try {
            const { error } = await supabase
                .from('smart_filters')
                .delete()
                .eq('id', id)
                .eq('user_id', userId);
            if (error) throw error;
        } catch (err) {
            console.error('Failed to delete smart filter:', err);
        }
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

    // --- Global dragend listener to completely clear stuck drag highlights ---
    useEffect(() => {
        const handleGlobalDragEnd = () => {
            setDragOverDate(null);
        };
        window.addEventListener('dragend', handleGlobalDragEnd);
        return () => {
            window.removeEventListener('dragend', handleGlobalDragEnd);
        };
    }, []);

    // Memoize Drag Handlers
    const handleDragStart = useCallback((e: React.DragEvent, taskId: string) => {
        e.dataTransfer.setData("taskId", taskId);
        e.dataTransfer.effectAllowed = "move";

        // Set JSON data for Workbox
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            const dragData = {
                title: task.title,
                type: task.type, // 'CONTENT' or 'TASK'
                content_id: task.id
            };
            e.dataTransfer.setData('application/json', JSON.stringify(dragData));
            e.dataTransfer.setData('taskData', JSON.stringify(task));
        }
    }, [tasks]);

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

        let taskToMove = tasks.find(t => t.id === taskId);
        if (!taskToMove) {
            const taskDataStr = e.dataTransfer.getData("taskData");
            if (taskDataStr) {
                try {
                    const parsed = JSON.parse(taskDataStr);
                    if (parsed.startDate) parsed.startDate = new Date(parsed.startDate);
                    if (parsed.endDate) parsed.endDate = new Date(parsed.endDate);
                    if (parsed.shootDate) parsed.shootDate = new Date(parsed.shootDate);
                    if (parsed.createdAt) parsed.createdAt = new Date(parsed.createdAt);
                    if (parsed.updatedAt) parsed.updatedAt = new Date(parsed.updatedAt);
                    taskToMove = parsed;
                } catch (err) {
                    console.error("Failed to parse dragged task data:", err);
                }
            }
        }
        
        // ALLOW DROP IF: 
        // 1. Task exists AND
        // 2. Dates are different OR Task was Unscheduled (Stock)
        if (taskToMove) {
             const isDifferentDate = !isSameDay(taskToMove.endDate, targetDate);
             const wasUnscheduled = taskToMove.isUnscheduled;

             if (isDifferentDate || wasUnscheduled) {
                const updatedTask = { 
                    ...taskToMove, 
                    startDate: targetDate, 
                    endDate: targetDate,
                    isUnscheduled: false // IMPORTANT: Always schedule it upon drop
                };
                onMoveTask(updatedTask);
             }
        }
    }, [tasks, onMoveTask]);

    return {
        currentDate,
        viewMode,
        showPlanOverlay,
        setShowPlanOverlay,
        togglePlanOverlay,
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
        toggleFilters,
        setIsExpanded,
        setIsManageModalOpen,

        nextMonth,
        prevMonth,
        nextWeek,
        prevWeek,
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
