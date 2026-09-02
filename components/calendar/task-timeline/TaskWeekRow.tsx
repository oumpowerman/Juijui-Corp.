import React, { memo, useMemo } from 'react';
import { 
    format, isSameMonth, isToday, isSameDay, isSameWeek, 
    startOfDay, endOfDay, differenceInCalendarDays 
} from 'date-fns';
import { Task, ChipConfig, CalendarHighlight, MasterOption, Channel, User } from '../../../types';
import TaskMultiDayPill, { TaskTimelineSegment } from './TaskMultiDayPill';
import { PlusCircle } from 'lucide-react';

interface TaskWeekRowProps {
    weekDays: Date[];
    currentDate: Date;
    tasks: Task[];
    isExpanded: boolean;
    dragOverDate: Date | null;
    activeChipIds: string[];
    customChips: ChipConfig[];
    highlights: CalendarHighlight[];
    masterOptions: MasterOption[];
    channels: Channel[];
    users?: User[];
    isFirstWeek?: boolean;
    getTasksForDay: (day: Date) => Task[];
    onDayClick: (day: Date, tasks: Task[]) => void;
    onContextMenu: (day: Date) => void;
    onDragOver: (e: React.DragEvent, day: Date) => void;
    onDragLeave: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent, day: Date) => void;
    onTaskDragStart: (e: React.DragEvent, taskId: string) => void;
    onTaskClick: (task: Task) => void;
}

const TaskWeekRow: React.FC<TaskWeekRowProps> = ({
    weekDays,
    currentDate,
    tasks,
    isExpanded,
    dragOverDate,
    activeChipIds,
    customChips,
    highlights,
    masterOptions,
    channels,
    users = [],
    isFirstWeek = false,
    getTasksForDay,
    onDayClick,
    onContextMenu,
    onDragOver,
    onDragLeave,
    onDrop,
    onTaskDragStart,
    onTaskClick
}) => {
    const weekStart = useMemo(() => startOfDay(weekDays[0]), [weekDays]);
    const weekEnd = useMemo(() => endOfDay(weekDays[6]), [weekDays]);

    // In expanded mode, show up to 7 slots; in standard mode, show 4 slots
    const maxVisibleSlots = isExpanded ? 7 : 4;
    const slotHeight = isExpanded ? 30 : 26;
    const slotGap = 3;
    const headerHeight = isExpanded ? 38 : 32;
    const footerHeight = 26;

    // Tetris Slot Engine for multi-day and single-day tasks in this week
    const { visibleSegments, overflowByDay } = useMemo(() => {
        const grid: (Task | null)[][] = Array.from({ length: 7 }, () => []);
        const segments: TaskTimelineSegment[] = [];
        const overflow: number[] = Array(7).fill(0);

        // 1. Filter tasks that overlap this week interval
        const weekTasks = tasks.filter(t => {
            if (t.isUnscheduled) return false;
            const tStart = startOfDay(new Date(t.startDate || t.endDate));
            const tEnd = endOfDay(new Date(t.endDate || t.startDate));
            return tStart <= weekEnd && tEnd >= weekStart;
        });

        // 2. Sort: Longest duration first, then earlier start dates, then priority, then title
        const sorted = [...weekTasks].sort((a, b) => {
            const startA = new Date(a.startDate || a.endDate).getTime();
            const startB = new Date(b.startDate || b.endDate).getTime();
            const endA = new Date(a.endDate || a.startDate).getTime();
            const endB = new Date(b.endDate || b.startDate).getTime();

            const durA = endA - startA;
            const durB = endB - startB;

            if (durA !== durB) return durB - durA;
            if (startA !== startB) return startA - startB;
            return (a.title || '').localeCompare(b.title || '');
        });

        // 3. Assign slots using 2D Tetris Matrix
        sorted.forEach(task => {
            const tStart = startOfDay(new Date(task.startDate || task.endDate));
            const tEnd = endOfDay(new Date(task.endDate || task.startDate));

            const startDayIndex = differenceInCalendarDays(tStart, weekStart);
            const endDayIndex = differenceInCalendarDays(tEnd, weekStart);

            const startCol = Math.max(0, startDayIndex);
            const endCol = Math.min(6, endDayIndex);

            if (startCol > 6 || endCol < 0) return;

            // Find lowest available row index across all occupied columns
            let rowIndex = 0;
            while (true) {
                let isFree = true;
                for (let c = startCol; c <= endCol; c++) {
                    if (grid[c][rowIndex] !== undefined) {
                        isFree = false;
                        break;
                    }
                }
                if (isFree) break;
                rowIndex++;
            }

            // Fill matrix
            for (let c = startCol; c <= endCol; c++) {
                grid[c][rowIndex] = task;
            }

            const isRealStart = startDayIndex >= 0;
            const isRealEnd = endDayIndex <= 6;
            const continuesFromPrev = startDayIndex < 0;
            const continuesToNext = endDayIndex > 6;

            if (rowIndex < maxVisibleSlots) {
                segments.push({
                    task,
                    startCol,
                    endCol,
                    span: endCol - startCol + 1,
                    slotIndex: rowIndex,
                    isRealStart,
                    isRealEnd,
                    continuesFromPrev,
                    continuesToNext
                });
            } else {
                for (let c = startCol; c <= endCol; c++) {
                    overflow[c]++;
                }
            }
        });

        return {
            visibleSegments: segments,
            overflowByDay: overflow
        };
    }, [tasks, weekStart, weekEnd, maxVisibleSlots]);

    const now = new Date();
    const hasAnyOverflow = overflowByDay.some(count => count > 0);

    // Total content height calculation
    const totalRowMinHeight = headerHeight + (maxVisibleSlots * slotHeight) + ((maxVisibleSlots - 1) * slotGap) + (hasAnyOverflow ? footerHeight + 8 : 12);

    return (
        <div 
            className="relative w-full border-b border-gray-200 bg-gray-100 flex flex-col transition-all duration-200 hover:z-30 group/week"
            style={{ minHeight: `${totalRowMinHeight}px` }}
        >
            {/* 1. Background Grid of 7 Day Columns */}
            <div className="grid grid-cols-7 gap-px w-full h-full absolute inset-0 z-0">
                {weekDays.map((day, colIndex) => {
                    const isCurrentMonth = isSameMonth(day, currentDate);
                    const isTodayDate = isToday(day);
                    const isDragOver = dragOverDate && isSameDay(day, dragOverDate);
                    const isWeekend = colIndex === 0 || colIndex === 6;
                    const dayHighlight = highlights.find(h => isSameDay(h.date, day));

                    let highlightStyle = '';
                    let highlightLabel = '';
                    if (dayHighlight && masterOptions) {
                        const typeOpt = masterOptions.find(o => o.type === 'EVENT_TYPE' && o.key === dayHighlight.typeKey);
                        if (typeOpt) {
                            highlightStyle = (typeOpt.color || 'bg-gray-100 border-gray-200').replace('text-', 'text-opacity-80 text-');
                            highlightLabel = typeOpt.label;
                        }
                    }

                    const bgClass = isDragOver
                        ? 'bg-indigo-100 ring-inset ring-2 ring-indigo-400'
                        : highlightStyle
                            ? `${highlightStyle} bg-opacity-30 border-opacity-40`
                            : isTodayDate
                                ? 'bg-indigo-50/20'
                                : !isCurrentMonth
                                    ? 'bg-gray-50/80 text-gray-300'
                                    : isWeekend
                                        ? 'bg-slate-50/70 hover:bg-white'
                                        : 'bg-white hover:bg-indigo-50/10';

                    let dayTextClass = '';
                    if (isTodayDate) {
                        dayTextClass = 'text-white bg-indigo-600 shadow-md shadow-indigo-200';
                    } else if (isSameWeek(day, now)) {
                        dayTextClass = 'text-emerald-600 font-bold';
                    } else if (day < now) {
                        dayTextClass = 'text-slate-400 font-medium';
                    } else {
                        dayTextClass = 'text-rose-500 font-bold';
                    }

                    const dayTasks = getTasksForDay(day);

                    return (
                        <div
                            key={day.toString()}
                            onClick={() => onDayClick(day, dayTasks)}
                            onContextMenu={(e) => { e.preventDefault(); onContextMenu(day); }}
                            onDragOver={(e) => onDragOver(e, day)}
                            onDragLeave={onDragLeave}
                            onDrop={(e) => onDrop(e, day)}
                            className={`
                                relative flex flex-col justify-between p-1.5 md:p-2 cursor-pointer select-none transition-all
                                ${bgClass}
                            `}
                        >
                            {/* Day Header */}
                            <div className="flex justify-between items-center w-full" style={{ height: `${headerHeight - 8}px` }}>
                                <span className={`
                                    flex items-center justify-center transition-all
                                    ${isExpanded 
                                        ? 'text-sm md:text-base w-7 h-7 rounded-xl' 
                                        : 'text-[11px] md:text-xs w-5 h-5 md:w-6 md:h-6 rounded-lg'
                                    }
                                    ${!isCurrentMonth ? 'opacity-40' : ''}
                                    ${dayTextClass}
                                `}>
                                    {format(day, 'd')}
                                </span>

                                {isExpanded && dayTasks.length > 0 && (
                                    <span className="hidden md:inline-block text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded-full">
                                        {dayTasks.length}
                                    </span>
                                )}
                            </div>

                            {/* Highlight Label */}
                            {highlightLabel && (
                                <div className="hidden md:block text-[9px] font-bold opacity-60 truncate mb-1 px-0.5 text-indigo-900">
                                    {highlightLabel}
                                </div>
                            )}

                            {/* Blank area for middle event bars */}
                            <div className="flex-1" />
                        </div>
                    );
                })}
            </div>

            {/* 2. Middle Overlaid Multi-Day Event Slot Layer */}
            <div 
                className="absolute left-0 right-0 pointer-events-none px-0.5 z-20"
                style={{
                    top: `${headerHeight}px`,
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
                    gridTemplateRows: `repeat(${maxVisibleSlots}, ${slotHeight}px)`,
                    rowGap: `${slotGap}px`,
                }}
            >
                {visibleSegments.map((segment) => (
                    <div 
                        key={`${segment.task.id}-${segment.startCol}-${segment.slotIndex}`}
                        className="pointer-events-auto h-full relative group/segment hover:z-50"
                        style={{
                            gridColumn: `${segment.startCol + 1} / span ${segment.span}`,
                            gridRow: `${segment.slotIndex + 1}`,
                        }}
                    >
                        <TaskMultiDayPill
                            segment={segment}
                            isExpanded={isExpanded}
                            isFirstWeek={isFirstWeek}
                            activeChipIds={activeChipIds}
                            customChips={customChips}
                            masterOptions={masterOptions}
                            channels={channels}
                            users={users}
                            onDragStart={onTaskDragStart}
                            onClick={onTaskClick}
                        />
                    </div>
                ))}
            </div>

            {/* 3. Dedicated Non-Overlapping Overflow Footer Row */}
            {hasAnyOverflow && (
                <div 
                    className="absolute left-0 right-0 bottom-1.5 pointer-events-none z-10 px-1"
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
                        columnGap: '4px',
                        height: `${footerHeight}px`
                    }}
                >
                    {weekDays.map((day, colIndex) => {
                        const overflowCount = overflowByDay[colIndex];
                        if (overflowCount <= 0) return <div key={colIndex} />;

                        const dayTasks = getTasksForDay(day);

                        return (
                            <div key={colIndex} className="flex items-center justify-start pointer-events-auto px-1">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDayClick(day, dayTasks);
                                    }}
                                    className="flex items-center gap-1 w-full max-w-full text-[10px] font-extrabold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 hover:text-indigo-900 border border-indigo-200/80 px-2 py-0.5 rounded-lg shadow-2xs transition-all active:scale-95 truncate"
                                    title={`ดูงานที่เหลืออีก ${overflowCount} งานของวันนี้`}
                                >
                                    <PlusCircle className="w-3 h-3 text-indigo-500 shrink-0" />
                                    <span className="truncate">+{overflowCount} งาน</span>
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default memo(TaskWeekRow);

