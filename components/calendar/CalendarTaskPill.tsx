import React, { memo, useMemo, useState, useEffect } from 'react';
import { Task, ChipConfig, MasterOption, Channel } from '../../types';
import { COLOR_THEMES } from '../../constants';
import { getHexFromColorClass } from '../../utils/color';
import { TaskDisplayMode } from '../CalendarView';
import { isBefore, startOfToday, differenceInDays, isToday } from 'date-fns';
import { AnimatePresence } from 'framer-motion';
import { isStockTerminalStatus } from '../../config/status';

// Subcomponents
import TaskAnimateWrapper from './TaskAnimateWrapper';
import TaskPillContent from './TaskPillContent';
import TaskPillTooltip from './TaskPillTooltip';

interface CalendarTaskPillProps {
    task: Task;
    index: number;
    viewMode: 'CONTENT' | 'TASK';
    displayMode: TaskDisplayMode;
    isExpanded: boolean;
    activeChipIds: string[];
    customChips: ChipConfig[];
    masterOptions?: MasterOption[];
    channels: Channel[];
    dayOfWeek?: number;
    cellDate?: Date;
    isFirstWeek?: boolean;
    onDragStart: (e: React.DragEvent, taskId: string) => void;
    onClick: (task: Task) => void;
}

const CalendarTaskPill = React.forwardRef<HTMLDivElement, CalendarTaskPillProps>(({
    task,
    index,
    viewMode,
    displayMode,
    isExpanded,
    activeChipIds,
    customChips,
    masterOptions,
    channels,
    dayOfWeek,
    cellDate,
    isFirstWeek = false,
    onDragStart,
    onClick
}, ref) => {
    const [isHovered, setIsHovered] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const media = window.matchMedia('(max-width: 768px)');
        setIsMobile(media.matches);
        const listener = (e: MediaQueryListEvent) => setIsMobile(e.matches);
        media.addEventListener('change', listener);
        return () => media.removeEventListener('change', listener);
    }, []);

    // Get end date object safely
    const endDateObj = useMemo(() => {
        if (!task.endDate) return null;
        return task.endDate instanceof Date ? task.endDate : new Date(task.endDate);
    }, [task.endDate]);

    const overdueDays = useMemo(() => {
        if (!endDateObj) return 0;
        return differenceInDays(startOfToday(), endDateObj);
    }, [endDateObj]);

    // Overdue Logic: Not in "DONE" groups and endDate < today
    const isOverdue = useMemo(() => {
        if (!task.endDate) return false;
        
        // keywords for finished group (LIKE check)
        const finishedKeywords = ['DONE', 'PUBLISH', 'FINISH', 'COMPLETE', 'APPROVE', 'SUCCESS', 'ARCHIVE', 'POSTED'];
        const currentStatus = (task.status || '').toUpperCase();
        
        const isFinished = finishedKeywords.some(keyword => currentStatus.includes(keyword));
        if (isFinished) return false;

        // Check if endDate is before today
        const endDateObj = task.endDate instanceof Date ? task.endDate : new Date(task.endDate);
        return isBefore(endDateObj, startOfToday());
    }, [task.status, task.endDate]);

    const isCriticalOverdue = useMemo(() => {
        if (!isOverdue || !task.endDate) return false;
        const endDateObj = task.endDate instanceof Date ? task.endDate : new Date(task.endDate);
        return differenceInDays(startOfToday(), endDateObj) >= 7;
    }, [isOverdue, task.endDate]);

    // Added: Insight Overdue Logic (Posted but no analytics entered after 7 days)
    const isInsightOverdue = useMemo(() => {
        const isTerminal = isStockTerminalStatus(task.status);
        
        // Only show overdue if it's content, terminal, has no analytics yet, and > 7 days since end date
        if (task.type !== 'CONTENT' || task.isUnscheduled || !isTerminal || !task.endDate || task.hasAnalytics) return false;
        
        const endDateObj = task.endDate instanceof Date ? task.endDate : new Date(task.endDate);
        return differenceInDays(startOfToday(), endDateObj) >= 7;
    }, [task.type, task.status, task.endDate, task.isUnscheduled, task.hasAnalytics]);

    // Check if the current item is an active, unfinished content item (clip release planned for today)
    const isUnfinishedContent = useMemo(() => {
        if (task.type !== 'CONTENT') return false;
        if (cellDate && !isToday(cellDate)) return false;
        const finishedKeywords = ['DONE', 'PUBLISH', 'FINISH', 'COMPLETE', 'APPROVE', 'SUCCESS', 'ARCHIVE', 'POSTED'];
        const currentStatus = (task.status || '').toUpperCase();
        return !finishedKeywords.some(keyword => currentStatus.includes(keyword));
    }, [task.type, task.status, cellDate]);

    // Resolve dynamic active hex color from custom chips (pin filters)
    const activeHexColor = useMemo(() => {
        if (!isOverdue && activeChipIds.length > 0 && Array.isArray(customChips)) {
            const matchingChip = customChips.find(chip => {
                if (!activeChipIds.includes(chip.id)) return false;
                
                switch (chip.type) {
                    case 'CHANNEL': return task.channelId === chip.value;
                    case 'FORMAT': return task.contentFormats && task.contentFormats.includes(chip.value);
                    case 'STATUS': return task.status === chip.value;
                    case 'PILLAR': return task.pillar === chip.value;
                    default: return false;
                }
            });
            return matchingChip && matchingChip.colorTheme ? getHexFromColorClass(matchingChip.colorTheme) : null;
        }
        return null;
    }, [activeChipIds, customChips, task, isOverdue]);

    // Helper to get styling for the main card container
    const getTaskStyle = (t: Task) => {
        if (activeHexColor) {
            return 'border-y border-r border-stone-200/60 text-[#1c1917] hover:shadow-md font-semibold';
        }

        let styleClass = viewMode === 'CONTENT' 
            ? 'bg-white border-l-4 border-l-indigo-500 border-y border-r border-gray-100 text-gray-700' 
            : 'bg-white border-l-4 border-l-emerald-500 border-y border-r border-gray-100 text-gray-700';

        if (isOverdue) {
            styleClass = isCriticalOverdue 
                ? 'bg-slate-50 border-l-4 border-l-slate-400 border-y border-r border-slate-200 text-slate-400 opacity-60 grayscale'
                : 'bg-red-50 border-l-4 border-l-red-500 border-y border-r border-red-100 text-red-900';
        }

        if (t.channelId && channels && !isOverdue) {
            const channel = channels.find(c => c.id === t.channelId);
            if (channel && channel.color) {
                if (!channel.color.startsWith('#')) {
                    const borderColorClass = channel.color.startsWith('border-l-') ? channel.color : `border-l-${channel.color}`;
                    styleClass = styleClass.replace(/border-l-[a-z0-9-]+/, borderColorClass);
                }
            }
        }

        if (activeChipIds.length > 0 && Array.isArray(customChips)) {
            const matchingChipId = activeChipIds.find(chipId => {
                const chip = customChips.find(c => c.id === chipId);
                if (!chip) return false;
                
                switch (chip.type) {
                    case 'CHANNEL': return t.channelId === chip.value;
                    case 'FORMAT': return t.contentFormats && t.contentFormats.includes(chip.value);
                    case 'STATUS': return t.status === chip.value;
                    case 'PILLAR': return t.pillar === chip.value;
                    default: return false;
                }
            });

            if (matchingChipId) {
                const chip = customChips.find(c => c.id === matchingChipId);
                if (chip) {
                    const theme = COLOR_THEMES.find(th => th.id === chip.colorTheme) || COLOR_THEMES[0];
                    styleClass = `${theme.bg} ${theme.text} ${theme.border} font-medium border-l-4 border-l-current`;
                }
            }
        }
        return styleClass;
    };

    const getTaskDotClass = (t: Task) => {
        if (t.status === 'DONE' || t.status === 'APPROVE') return 'bg-green-500';
        if (t.status === 'TODO' || t.status === 'IDEA') return 'bg-gray-400';
        if (t.status === 'BLOCKED') return 'bg-red-500';
        return 'bg-indigo-500'; 
    };

    const originClass = useMemo(() => {
        if (dayOfWeek === 0) return 'origin-left';
        if (dayOfWeek === 6) return 'origin-right';
        return 'origin-center';
    }, [dayOfWeek]);

    const taskBaseClass = isExpanded 
        ? `w-full text-xs px-2 py-1.5 rounded-md cursor-grab active:cursor-grabbing shadow-sm leading-snug flex items-center justify-between gap-2 mb-1.5 relative ${originClass}`
        : `w-full text-[12px] px-1.5 py-1 rounded-md border truncate cursor-grab active:cursor-grabbing shadow-sm flex items-center gap-1 mb-0.5 relative ${originClass}`;

    // Resolve Status Label & Color from Master Data
    let statusLabel = '';
    let statusColor = 'bg-gray-100 text-gray-600 border-gray-200';
    let statusEmoji = '';

    if (masterOptions) {
        const statusOpt = masterOptions.find(o => (o.type === 'STATUS' || o.type === 'TASK_STATUS') && o.key === task.status);
        if (statusOpt) {
            const cleanLabel = statusOpt.label.replace(/^\d+\s*/, '');
            statusLabel = cleanLabel;
            
            const emojiMatch = statusOpt.label.match(/[\p{Emoji}\u200d]+/u);
            statusEmoji = emojiMatch ? emojiMatch[0] : '';

            if (statusLabel.length > 12) statusLabel = statusLabel.substring(0, 10) + '..';
            
            if (statusOpt.color) {
                statusColor = statusOpt.color;
            }
        } else {
            statusLabel = task.status;
        }
    }

    const isMobileDot = !isExpanded && isMobile;

    const rootClassName = useMemo(() => {
        if (isMobileDot) {
            const color = task.channelId && channels?.find(c => c.id === task.channelId)?.color;
            const mobileDotBgClass = (() => {
                if (!color) return getTaskDotClass(task);
                if (color.startsWith('#')) return '';
                const base = color.replace('bg-', '').replace('text-', '').replace('border-', '').replace('border-l-', '');
                return `bg-${base}`;
            })();
            return `
                md:hidden w-2 h-2 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.1)] ring-1 ring-white/30
                animate-spring shrink-0 cursor-grab active:cursor-grabbing mb-0.5
                ${mobileDotBgClass}
            `;
        }

        return `
            group
            ${isExpanded ? 'block' : 'hidden md:flex'}
            ${taskBaseClass}
            ${getTaskStyle(task)}
            ${isOverdue ? 'ring-1 ring-red-400/50' : ''}
        `;
    }, [isMobileDot, isExpanded, taskBaseClass, task, channels, isOverdue]);

    const rootStyle = useMemo(() => {
        if (isMobileDot) {
            return {
                animationDelay: `${index * 30}ms`, 
                animationFillMode: 'both',
                backgroundColor: (task.channelId && channels?.find(c => c.id === task.channelId)?.color?.startsWith('#')) 
                    ? channels.find(c => c.id === task.channelId)?.color 
                    : undefined
            };
        }

        return activeHexColor ? {
            backgroundColor: `${activeHexColor}26`,
            borderLeftColor: activeHexColor,
            borderLeftWidth: '4px',
        } : { 
            borderLeftColor: !isOverdue && (task.channelId && channels?.find(c => c.id === task.channelId)?.color?.startsWith('#')) 
                ? channels.find(c => c.id === task.channelId)?.color 
                : undefined
        };
    }, [isMobileDot, index, task.channelId, channels, activeHexColor, isOverdue]);

    return (
        <TaskAnimateWrapper
            ref={ref}
            index={index}
            isMobileDot={isMobileDot}
            isExpanded={isExpanded}
            onDragStart={(e) => onDragStart(e, task.id)}
            onClick={(e) => {
                e.stopPropagation();
                onClick(task);
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            rootStyle={rootStyle}
            rootClassName={rootClassName}
        >
            {!isMobileDot && (
                <TaskPillContent
                    task={task}
                    displayMode={displayMode}
                    isUnfinishedContent={isUnfinishedContent}
                    isOverdue={isOverdue}
                    isCriticalOverdue={isCriticalOverdue}
                    isInsightOverdue={isInsightOverdue}
                    statusLabel={statusLabel}
                    statusColor={statusColor}
                    statusEmoji={statusEmoji}
                    isExpanded={isExpanded}
                />
            )}

            <AnimatePresence>
                {isHovered && (
                    <TaskPillTooltip
                        task={task}
                        viewMode={viewMode}
                        channels={channels}
                        dayOfWeek={dayOfWeek}
                        isFirstWeek={isFirstWeek}
                        isUnfinishedContent={isUnfinishedContent}
                        isOverdue={isOverdue}
                        isCriticalOverdue={isCriticalOverdue}
                        isInsightOverdue={isInsightOverdue}
                        overdueDays={overdueDays}
                        endDateObj={endDateObj}
                        statusLabel={statusLabel}
                        statusColor={statusColor}
                    />
                )}
            </AnimatePresence>
        </TaskAnimateWrapper>
    );
});

export default memo(CalendarTaskPill);
