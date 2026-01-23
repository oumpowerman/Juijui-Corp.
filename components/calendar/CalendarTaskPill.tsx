
import React, { memo } from 'react';
import { Task, ChipConfig } from '../../types';
import { COLOR_THEMES } from '../../constants';

interface CalendarTaskPillProps {
    task: Task;
    index: number;
    viewMode: 'CONTENT' | 'TASK';
    isExpanded: boolean;
    activeChipIds: string[];
    customChips: ChipConfig[];
    onDragStart: (e: React.DragEvent, taskId: string) => void;
    onClick: (task: Task) => void;
}

const CalendarTaskPill: React.FC<CalendarTaskPillProps> = ({
    task,
    index,
    viewMode,
    isExpanded,
    activeChipIds,
    customChips,
    onDragStart,
    onClick
}) => {

    const getTaskStyle = (t: Task) => {
        let styleClass = viewMode === 'CONTENT' 
            ? 'bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-100' 
            : 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100';

        if (activeChipIds.length > 0 && Array.isArray(customChips)) {
            const matchingChipId = activeChipIds.find(chipId => {
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

            if (matchingChipId) {
                const chip = customChips.find(c => c.id === matchingChipId);
                if (chip) {
                    const theme = COLOR_THEMES.find(th => th.id === chip.colorTheme) || COLOR_THEMES[0];
                    styleClass = `${theme.bg} ${theme.text} ${theme.border} hover:opacity-90`;
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

    const taskBaseClass = isExpanded 
        ? "w-full text-xs font-bold px-2 py-1.5 rounded-lg border truncate cursor-grab active:cursor-grabbing hover:scale-[1.02] transition-all shadow-sm leading-snug"
        : "w-full text-[10px] px-1.5 py-1 rounded-md border truncate cursor-grab active:cursor-grabbing hover:scale-105 transition-all shadow-sm";

    return (
        <>
            <div 
                draggable
                onDragStart={(e) => onDragStart(e, task.id)}
                onClick={(e) => {
                    e.stopPropagation(); 
                    onClick(task);
                }}
                style={{ 
                    animationDelay: `${index * 50}ms`, 
                    animationFillMode: 'both' 
                }}
                className={`
                    animate-spring
                    ${isExpanded ? 'block' : 'hidden md:block'}
                    ${taskBaseClass}
                    ${getTaskStyle(task)}
                `}
                title={task.title}
            >
                {task.title}
            </div>

            {!isExpanded && (
                <div 
                    className={`
                        md:hidden w-1.5 h-1.5 rounded-full ${getTaskDotClass(task)}
                        animate-spring
                    `}
                    style={{ animationDelay: `${index * 30}ms`, animationFillMode: 'both' }}
                />
            )}
        </>
    );
};

export default memo(CalendarTaskPill);
