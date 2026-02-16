
import React, { memo } from 'react';
import { Task, ChipConfig, MasterOption } from '../../types';
import { COLOR_THEMES } from '../../constants';
import { TaskDisplayMode } from '../CalendarView';

interface CalendarTaskPillProps {
    task: Task;
    index: number;
    viewMode: 'CONTENT' | 'TASK';
    displayMode: TaskDisplayMode; // Added
    isExpanded: boolean;
    activeChipIds: string[];
    customChips: ChipConfig[];
    masterOptions?: MasterOption[];
    onDragStart: (e: React.DragEvent, taskId: string) => void;
    onClick: (task: Task) => void;
}

const CalendarTaskPill: React.FC<CalendarTaskPillProps> = ({
    task,
    index,
    viewMode,
    displayMode,
    isExpanded,
    activeChipIds,
    customChips,
    masterOptions,
    onDragStart,
    onClick
}) => {

    // Helper to get styling for the main card container
    const getTaskStyle = (t: Task) => {
        // Default Clean Style: White bg with colored left border indicator
        // Update: Respect Minimal mode by removing heavy backgrounds
        let styleClass = viewMode === 'CONTENT' 
            ? 'bg-white border-l-4 border-l-indigo-500 border-y border-r border-gray-100 text-gray-700 hover:shadow-md' 
            : 'bg-white border-l-4 border-l-emerald-500 border-y border-r border-gray-100 text-gray-700 hover:shadow-md';

        // Override if a Smart Filter (Chip) matches
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
                    // Apply theme background but ensure text is readable
                    styleClass = `${theme.bg} ${theme.text} ${theme.border} hover:opacity-90 font-medium border-l-4 border-l-current`;
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

    // Calculate layout classes based on expanded state
    const taskBaseClass = isExpanded 
        ? "w-full text-xs px-2 py-1.5 rounded-md cursor-grab active:cursor-grabbing transition-all shadow-sm leading-snug flex items-center justify-between gap-2 overflow-hidden mb-1.5"
        : "w-full text-[12px] px-1.5 py-1 rounded-md border truncate cursor-grab active:cursor-grabbing hover:scale-105 transition-all shadow-sm flex items-center gap-1 mb-0.5";

    // Resolve Status Label & Color from Master Data
    let statusLabel = '';
    let statusColor = 'bg-gray-100 text-gray-600 border-gray-200'; // Default Fallback
    let statusEmoji = '';

    if (masterOptions) {
        const statusOpt = masterOptions.find(o => (o.type === 'STATUS' || o.type === 'TASK_STATUS') && o.key === task.status);
        if (statusOpt) {
            // Remove numbering (e.g. "01 Idea" -> "Idea") for cleaner look
            const cleanLabel = statusOpt.label.replace(/^\d+\s*/, '');
            statusLabel = cleanLabel;
            
            // Extract Emoji for Emoji Mode
            const emojiMatch = statusOpt.label.match(/[\p{Emoji}\u200d]+/u);
            statusEmoji = emojiMatch ? emojiMatch[0] : '';

            // Truncate if too long
            if (statusLabel.length > 12) statusLabel = statusLabel.substring(0, 10) + '..';
            
            if (statusOpt.color) {
                statusColor = statusOpt.color;
            }
        } else {
            statusLabel = task.status;
        }
    }

    // --- RENDER LOGIC BASED ON DISPLAY MODE ---
    const renderContent = () => {
        switch (displayMode) {
            case 'MINIMAL':
                return (
                    <span className="truncate flex-1 font-bold">{task.title}</span>
                );
            case 'DOT':
                return (
                    <div className="flex items-center gap-2 overflow-hidden w-full">
                         <div className={`w-2 h-2 rounded-full shrink-0 ${getTaskDotClass(task)}`}></div>
                         <span className="truncate flex-1 font-bold">{task.title}</span>
                    </div>
                );
            case 'EMOJI':
                return (
                     <div className="flex items-center gap-1.5 overflow-hidden w-full">
                         {statusEmoji && <span className="text-[12px] shrink-0">{statusEmoji}</span>}
                         <span className="truncate flex-1 font-bold">{task.title}</span>
                    </div>
                );
            case 'FULL':
            default:
                // Default Expanded View with Badge
                return (
                    <>
                        <span className="truncate flex-1 font-bold">{task.title}</span>
                        {statusLabel && (
                            <span className={`
                                text-[9px] font-black uppercase tracking-wider shrink-0 px-2 py-0.5 rounded-md border
                                ${statusColor}
                                ${!isExpanded ? 'hidden lg:inline-block' : ''}
                                shadow-sm
                            `}>
                                {statusLabel}
                            </span>
                        )}
                    </>
                );
        }
    };

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
                    animate-spring group
                    ${isExpanded ? 'block' : 'hidden md:flex'}
                    ${taskBaseClass}
                    ${getTaskStyle(task)}
                `}
                title={`${task.title} (${statusLabel})`}
            >
                {renderContent()}
            </div>

            {/* Mobile / Collapsed Dot View (Always Dots on Mobile for space) */}
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
