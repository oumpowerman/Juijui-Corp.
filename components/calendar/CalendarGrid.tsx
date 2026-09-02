
import React, { useMemo } from 'react';
import { eachDayOfInterval, isSameDay } from 'date-fns';
import { Task, ChipConfig, CalendarHighlight, MasterOption, Channel, User } from '../../types';
import CalendarDayCell from './CalendarDayCell';
import TaskWeekRow from './task-timeline/TaskWeekRow';
import { TaskDisplayMode } from '../CalendarView';

interface CalendarGridProps {
    startDate: Date;
    endDate: Date;
    currentDate: Date;
    isExpanded: boolean;
    dragOverDate: Date | null;
    viewMode: 'CONTENT' | 'TASK' | 'PLAN';
    taskDisplayMode: TaskDisplayMode;
    activeChipIds: string[];
    customChips: ChipConfig[];
    
    // New Props for Highlights
    highlights: CalendarHighlight[];
    masterOptions: MasterOption[];
    channels: Channel[];
    users?: User[];
    
    // Tasks dataset
    allTasks?: Task[];

    // Functions passed down
    getTasksForDay: (day: Date) => Task[];
    filterTasks: (tasks: Task[]) => Task[];
    
    // Event Handlers
    onDayClick: (day: Date, tasks: Task[]) => void;
    onDayContextMenu: (day: Date) => void;
    onDragOver: (e: React.DragEvent, day: Date) => void;
    onDragLeave: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent, day: Date) => void;
    onTaskDragStart: (e: React.DragEvent, taskId: string) => void;
    onTaskClick: (task: Task) => void;
}

const CalendarGrid: React.FC<CalendarGridProps> = ({
    startDate,
    endDate,
    currentDate,
    isExpanded,
    dragOverDate,
    viewMode,
    taskDisplayMode,
    activeChipIds,
    customChips,
    highlights,
    masterOptions,
    channels,
    users = [],
    allTasks = [],
    getTasksForDay,
    filterTasks,
    onDayClick,
    onDayContextMenu,
    onDragOver,
    onDragLeave,
    onDrop,
    onTaskDragStart,
    onTaskClick
}) => {
    const gridDays = useMemo(() => eachDayOfInterval({ start: startDate, end: endDate }), [startDate, endDate]);
    const weekDays = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

    // Group days into weeks of 7 days for TASK & PLAN mode
    const weeks = useMemo(() => {
        const result: Date[][] = [];
        for (let i = 0; i < gridDays.length; i += 7) {
            result.push(gridDays.slice(i, i + 7));
        }
        return result;
    }, [gridDays]);

    // Pre-filter tasks for TASK & PLAN multi-day timeline mode
    const filteredTasksForTimeline = useMemo(() => {
        if (viewMode !== 'TASK' && viewMode !== 'PLAN') return [];
        const filtered = filterTasks(allTasks);

        if (viewMode === 'PLAN') {
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();
            const lastDayInMonth = new Date(year, month + 1, 0).getDate();

            return filtered.map(t => {
                if (t.isMonthlyRecurring || t.recurrence === 'MONTHLY') {
                    const sDay = t.routineStartDay !== undefined ? t.routineStartDay : (t.startDate ? new Date(t.startDate).getDate() : 1);
                    const eDay = t.routineEndDay !== undefined ? t.routineEndDay : (t.endDate ? new Date(t.endDate).getDate() : sDay);

                    const actualSDay = Math.min(Math.max(1, sDay), lastDayInMonth);
                    const actualEDay = Math.min(Math.max(1, eDay), lastDayInMonth);

                    return {
                        ...t,
                        startDate: new Date(year, month, actualSDay, 0, 0, 0),
                        endDate: new Date(year, month, actualEDay, 23, 59, 59, 999)
                    };
                }
                return t;
            });
        }

        return filtered;
    }, [viewMode, allTasks, filterTasks, currentDate]);

    // -------------------------------------------------------------
    // BRANCH 1: TASK & PLAN Mode (Timeline Multi-Day Continuous Grid)
    // -------------------------------------------------------------
    if (viewMode === 'TASK' || viewMode === 'PLAN') {
        return (
            <div 
                key={`calendar-${viewMode.toLowerCase()}-view`}
                className={`
                    bg-white rounded-[1.5rem] shadow-sm border border-gray-200 flex flex-col
                    ${isExpanded ? 'min-h-[85vh] shadow-2xl border-gray-300' : 'ring-4 ring-gray-50/50 flex-1 h-full md:h-auto'} 
                    animate-slide-in-left
                `}
            >
                {/* Weekday Headers */}
                <div className="grid grid-cols-7 border-b border-gray-200 shrink-0 select-none rounded-t-[1.5rem] overflow-hidden">
                    {weekDays.map((day, index) => (
                        <div 
                            key={day} 
                            className={`
                                py-3 text-center font-black uppercase tracking-widest
                                ${isExpanded ? 'text-sm py-4' : 'text-[10px] md:text-xs'} 
                                ${index === 0 || index === 6 ? 'text-red-400 bg-red-50/30' : 'text-gray-500 bg-gray-50/60'}
                            `}
                        >
                            {day}
                        </div>
                    ))}
                </div>

                {/* Weekly Continuous Rows */}
                <div className="flex-1 flex flex-col divide-y divide-gray-200">
                    {weeks.map((week, idx) => (
                        <TaskWeekRow
                            key={week[0]?.toISOString() || idx}
                            weekDays={week}
                            currentDate={currentDate}
                            tasks={filteredTasksForTimeline}
                            isExpanded={isExpanded}
                            dragOverDate={dragOverDate}
                            activeChipIds={activeChipIds}
                            customChips={customChips}
                            highlights={highlights}
                            masterOptions={masterOptions}
                            channels={channels}
                            users={users}
                            isFirstWeek={idx < 2}
                            getTasksForDay={getTasksForDay}
                            onDayClick={onDayClick}
                            onContextMenu={onDayContextMenu}
                            onDragOver={onDragOver}
                            onDragLeave={onDragLeave}
                            onDrop={onDrop}
                            onTaskDragStart={onTaskDragStart}
                            onTaskClick={onTaskClick}
                        />
                    ))}
                </div>
            </div>
        );
    }

    // -------------------------------------------------------------
    // BRANCH 2: CONTENT Mode (Original 100% untouched Classic Grid)
    // -------------------------------------------------------------
    return (
        <div 
            key="calendar-content-view"
            className={`
                bg-white rounded-[1.5rem] shadow-sm border border-gray-200 overflow-hidden
                ${isExpanded ? 'min-h-[85vh] shadow-2xl border-gray-300' : 'ring-4 ring-gray-50/50 flex-1 flex flex-col h-full md:h-auto'} 
                animate-slide-in-left
            `}
        >
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 border-b border-gray-200 shrink-0">
                {weekDays.map((day, index) => (
                    <div key={day} className={`py-3 text-center font-black uppercase tracking-widest ${isExpanded ? 'text-sm py-4' : 'text-[10px] md:text-xs'} ${index === 0 || index === 6 ? 'text-red-400 bg-red-50/30' : 'text-gray-400 bg-gray-50/50'}`}>
                        {day}
                    </div>
                ))}
            </div>

            {/* Days Grid */}
            <div 
                className={`
                    grid grid-cols-7 bg-gray-100 gap-px border-b border-gray-200 flex-1 h-full md:h-auto
                    ${isExpanded 
                        ? 'auto-rows-[minmax(140px,1fr)] md:auto-rows-[minmax(180px,1fr)]' 
                        : 'lg:!grid-rows-none lg:auto-rows-[minmax(120px,1fr)]'
                    }
                `}
                style={!isExpanded ? { gridTemplateRows: `repeat(${gridDays.length / 7}, 1fr)`, '--grid-rows': gridDays.length / 7 } as React.CSSProperties : undefined}
            >
                {gridDays.map((day, idx) => {
                    const dayTasks = getTasksForDay(day);
                    const filteredDayTasks = filterTasks(dayTasks);
                    const dayHighlight = highlights.find(h => isSameDay(h.date, day));

                    return (
                        <CalendarDayCell 
                            key={day.toString()}
                            day={day}
                            currentDate={currentDate}
                            tasks={filteredDayTasks}
                            isExpanded={isExpanded}
                            dragOverDate={dragOverDate}
                            viewMode={viewMode}
                            taskDisplayMode={taskDisplayMode}
                            activeChipIds={activeChipIds}
                            customChips={customChips}
                            highlight={dayHighlight}
                            masterOptions={masterOptions}
                            channels={channels}
                            users={users}
                            isFirstWeek={idx < 14}
                            onDayClick={onDayClick}
                            onContextMenu={onDayContextMenu}
                            onDragOver={onDragOver}
                            onDragLeave={onDragLeave}
                            onDrop={onDrop}
                            onTaskDragStart={onTaskDragStart}
                            onTaskClick={onTaskClick}
                        />
                    );
                })}
            </div>
        </div>
    );
};

export default React.memo(CalendarGrid);
