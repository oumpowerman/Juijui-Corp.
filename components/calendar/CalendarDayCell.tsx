
import React, { memo } from 'react';
import { format, isSameMonth, isToday, isSameDay } from 'date-fns';
import { Task, ChipConfig } from '../../types';
import CalendarTaskPill from './CalendarTaskPill';

interface CalendarDayCellProps {
    day: Date;
    currentDate: Date;
    tasks: Task[];
    isExpanded: boolean;
    dragOverDate: Date | null;
    viewMode: 'CONTENT' | 'TASK';
    activeChipIds: string[];
    customChips: ChipConfig[];
    
    onDayClick: (day: Date, tasks: Task[]) => void;
    onDragOver: (e: React.DragEvent, day: Date) => void;
    onDragLeave: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent, day: Date) => void;
    onTaskDragStart: (e: React.DragEvent, taskId: string) => void;
    onTaskClick: (task: Task) => void;
}

const CalendarDayCell: React.FC<CalendarDayCellProps> = ({
    day,
    currentDate,
    tasks,
    isExpanded,
    dragOverDate,
    viewMode,
    activeChipIds,
    customChips,
    onDayClick,
    onDragOver,
    onDragLeave,
    onDrop,
    onTaskDragStart,
    onTaskClick
}) => {
    const isCurrentMonth = isSameMonth(day, currentDate);
    const isTodayDate = isToday(day);
    const isDragOver = dragOverDate && isSameDay(day, dragOverDate);

    const maxVisible = isExpanded ? 8 : 3;
    const count = tasks.length;
    
    const containerSpacing = isExpanded ? 'space-y-1.5' : 'space-y-1';
    const containerPadding = isExpanded ? 'px-1.5' : 'px-1';

    return (
        <div 
            onClick={() => onDayClick(day, tasks)}
            onDragOver={(e) => onDragOver(e, day)}
            onDragLeave={onDragLeave}
            onDrop={(e) => onDrop(e, day)}
            className={`
                relative flex flex-col group transition-all cursor-pointer select-none
                ${isExpanded ? 'p-1.5 md:p-3' : 'p-1 md:p-2'}
                ${!isCurrentMonth ? 'bg-gray-50/80 text-gray-300' : 'bg-white hover:bg-indigo-50/10'}
                ${isTodayDate ? 'bg-indigo-50/20 shadow-inner' : ''}
                ${isDragOver ? 'bg-indigo-100 ring-inset ring-2 ring-indigo-400 scale-[0.98] rounded-lg z-10 shadow-lg' : ''}
            `}
        >
            <div className={`flex justify-center md:justify-between items-start mb-1 pointer-events-none relative z-10 ${isExpanded ? 'justify-between w-full' : ''}`}>
                <span className={`
                    font-bold flex items-center justify-center transition-all
                    ${isExpanded 
                        ? 'text-lg w-8 h-8 rounded-xl' 
                        : 'text-[10px] md:text-sm w-5 h-5 md:w-6 md:h-6 rounded-full md:rounded-lg'
                    }
                    ${isTodayDate ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : ''} 
                    ${!isCurrentMonth ? 'opacity-50' : ''}
                `}>
                    {format(day, 'd')}
                </span>
                
                {isExpanded && count > 0 && (
                    <span className="hidden md:inline-block text-xs font-bold text-gray-300 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
                        {count}
                    </span>
                )}
            </div>

            <div className="flex-1 flex flex-col justify-start overflow-hidden w-full">
                <div className={`${isExpanded ? 'flex' : 'hidden md:flex'} flex-col items-center mt-2 w-full ${containerPadding} ${containerSpacing} h-full overflow-hidden`}>
                    {count > 0 && tasks.slice(0, maxVisible).map((task, index) => (
                        <CalendarTaskPill 
                            key={`${task.id}-${viewMode}`}
                            task={task}
                            index={index}
                            viewMode={viewMode}
                            isExpanded={isExpanded}
                            activeChipIds={activeChipIds}
                            customChips={customChips}
                            onDragStart={onTaskDragStart}
                            onClick={onTaskClick}
                        />
                    ))}
                    
                    {tasks.length > maxVisible && (
                        <span 
                            className={`
                                ${isExpanded ? 'text-xs mt-1' : 'text-[9px]'} 
                                text-gray-400 font-bold animate-spring text-center block
                            `}
                            style={{ animationDelay: `${maxVisible * 50}ms`, animationFillMode: 'both' }}
                        >
                            +{tasks.length - maxVisible} more
                        </span>
                    )}
                </div>

                {!isExpanded && (
                    <div className="flex md:hidden flex-wrap content-end justify-center gap-1 p-1 w-full h-full pb-2">
                        {tasks.slice(0, 5).map((task, index) => (
                            <CalendarTaskPill 
                                key={`${task.id}-dot`}
                                task={task}
                                index={index}
                                viewMode={viewMode}
                                isExpanded={false}
                                activeChipIds={activeChipIds}
                                customChips={customChips}
                                onDragStart={onTaskDragStart}
                                onClick={onTaskClick}
                            />
                        ))}
                        {tasks.length > 5 && (
                            <div className="w-1.5 h-1.5 rounded-full bg-gray-300 flex items-center justify-center text-[5px]">
                                +
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default memo(CalendarDayCell);
