
import { useState, useMemo } from 'react';
import { Task, Status, Priority, DashboardConfig, User } from '../types';
import { isAfter, isBefore, addDays, isSameMonth, getISOWeek } from 'date-fns';
import { useDashboardConfig } from './useDashboardConfig';
import { CHART_COLORS_MAP } from '../components/dashboard/admin/constants';

export type TimeRangeOption = 'THIS_MONTH' | 'LAST_30' | 'LAST_90' | 'CUSTOM' | 'ALL';
export type ViewScope = 'ALL' | 'ME';

// Theme Definitions moved here to keep logic centralized
export const WEEKLY_THEMES = [
    {
        id: 'MODERN_CLEAN',
        name: 'Modern Clean ☁️',
        getStyle: (color: string) => ({
            container: `bg-white border border-gray-100 shadow-lg shadow-gray-200/50 hover:shadow-xl hover:border-${color}-200`,
            iconBg: `bg-${color}-50 text-${color}-600`,
            textCount: `text-gray-800`,
            label: `text-gray-500 font-bold uppercase tracking-wider`,
            decoration: null
        })
    },
    {
        id: 'SOFT_POP',
        name: 'Soft Pop 🍬',
        getStyle: (color: string) => ({
            container: `bg-${color}-50/60 border-2 border-${color}-100 shadow-sm hover:shadow-md hover:bg-${color}-50`,
            iconBg: `bg-white text-${color}-500 shadow-sm`,
            textCount: `text-${color}-900`,
            label: `text-${color}-700 font-bold`,
            decoration: 'blob' // Simplified marker for component to render
        })
    },
    {
        id: 'NEO_GLASS',
        name: 'Neo Glass 💎',
        getStyle: (color: string) => ({
            container: `bg-white/80 backdrop-blur-xl border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-gray-100 hover:ring-${color}-300`,
            iconBg: `bg-gradient-to-br from-${color}-500 to-${color}-600 text-white shadow-lg shadow-${color}-200`,
            textCount: `text-gray-800`,
            label: `text-gray-500 font-bold`,
            decoration: 'line'
        })
    },
    {
        id: 'BOLD_STROKE',
        name: 'Bold Stroke ✏️',
        getStyle: (color: string) => ({
            container: `bg-white border-l-[6px] border-${color}-500 shadow-sm border-y border-r border-gray-200 hover:shadow-md`,
            iconBg: `bg-gray-100 text-${color}-600`,
            textCount: `text-gray-900`,
            label: `text-gray-600 font-black uppercase`,
            decoration: null
        })
    }
];

export const useDashboardStats = (tasks: Task[], currentUser: User) => {
    const today = new Date();
    const { configs, isLoading: configLoading } = useDashboardConfig();

    // Local State for Filters
    const [timeRange, setTimeRange] = useState<TimeRangeOption>('LAST_30');
    const [customDays, setCustomDays] = useState<number>(7);
    const [viewScope, setViewScope] = useState<ViewScope>(currentUser.role === 'ADMIN' ? 'ALL' : 'ME');

    // --- Weekly Theme Logic ---
    const currentWeekNum = getISOWeek(today);
    const themeIndex = currentWeekNum % WEEKLY_THEMES.length;
    const currentTheme = WEEKLY_THEMES[themeIndex];

    // --- Filtering Logic ---
    const checkDateInRange = (date: Date) => {
        switch (timeRange) {
            case 'THIS_MONTH': return isSameMonth(date, today);
            case 'LAST_30': return isAfter(date, addDays(today, -30));
            case 'LAST_90': return isAfter(date, addDays(today, -90));
            case 'CUSTOM': return isAfter(date, addDays(today, -customDays));
            case 'ALL': return true;
            default: return true;
        }
    };

    const filteredTasks = useMemo(() => {
        return tasks.filter(t => {
            // 1. Scope Filter (Me vs All)
            if (viewScope === 'ME') {
                const isAssignee = t.assigneeIds?.includes(currentUser.id);
                const isOwner = t.ideaOwnerIds?.includes(currentUser.id);
                const isEditor = t.editorIds?.includes(currentUser.id);
                if (!isAssignee && !isOwner && !isEditor) return false;
            }

            // 2. Time Range Filter
            if (timeRange === 'ALL') return true;
            const isInRange = checkDateInRange(t.endDate);
            if (t.status === 'DONE' || t.status === 'APPROVE') {
                return isInRange;
            } else {
                return isInRange || isBefore(t.endDate, today); // Show if in range OR overdue
            }
        });
    }, [tasks, viewScope, timeRange, customDays, currentUser.id]);

    // --- Stats Generation ---
    const cardStats = useMemo(() => {
        return configs.map(config => {
            const matchingTasks = filteredTasks.filter(t => {
                if (config.filterType === 'STATUS') {
                    return (config.statusKeys || []).includes(t.status || '');
                } 
                else if (config.filterType === 'FORMAT') {
                    return (config.statusKeys || []).includes(t.contentFormat || '');
                }
                else if (config.filterType === 'PILLAR') {
                    return (config.statusKeys || []).includes(t.pillar || '');
                }
                else if (config.filterType === 'CATEGORY') {
                    return (config.statusKeys || []).includes(t.category || '');
                }
                return false;
            });

            return {
                ...config,
                tasks: matchingTasks,
                count: matchingTasks.length
            };
        });
    }, [configs, filteredTasks]);

    // --- Urgent & Due Soon Logic ---
    const urgentTasks = useMemo(() => filteredTasks
        .filter(t => (t.priority === 'URGENT' || t.priority === 'HIGH') && !(t.status === 'DONE' || t.status === 'APPROVE'))
        .sort((a, b) => a.endDate.getTime() - b.endDate.getTime())
        .slice(0, 3), [filteredTasks]);

    const dueSoon = useMemo(() => filteredTasks
        .filter(t => isAfter(t.endDate, today) && isBefore(t.endDate, addDays(today, 3)) && !(t.status === 'DONE' || t.status === 'APPROVE'))
        .slice(0, 3), [filteredTasks, today]);

    // --- Chart Data ---
    const chartData = useMemo(() => {
        return cardStats.map(stat => ({
            name: stat.label,
            value: stat.count,
            color: CHART_COLORS_MAP[stat.colorTheme || 'blue'] || '#3b82f6'
        })).filter(d => d.value > 0);
    }, [cardStats]);

    const totalFilteredTasks = filteredTasks.length;
    const doneTasksCount = filteredTasks.filter(t => t.status === 'DONE' || t.status === 'APPROVE').length;
    const progressPercentage = totalFilteredTasks > 0 ? Math.round((doneTasksCount / totalFilteredTasks) * 100) : 0;

    const getTimeRangeLabel = () => {
        switch(timeRange) {
            case 'THIS_MONTH': return 'เดือนนี้';
            case 'LAST_30': return '30 วันล่าสุด';
            case 'LAST_90': return '90 วันล่าสุด';
            case 'CUSTOM': return `ย้อนหลัง ${customDays} วัน`;
            case 'ALL': return 'ทั้งหมด (All Time)';
        }
    };

    return {
        // State
        timeRange, setTimeRange,
        customDays, setCustomDays,
        viewScope, setViewScope,
        
        // Data
        configLoading,
        currentTheme,
        cardStats,
        urgentTasks,
        dueSoon,
        chartData,
        totalFilteredTasks,
        progressPercentage,
        
        // Helpers
        getTimeRangeLabel
    };
};
