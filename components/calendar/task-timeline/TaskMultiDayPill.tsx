import React, { memo, useMemo, useState } from 'react';
import { Task, ChipConfig, MasterOption, Channel, User } from '../../../types';
import { getHexFromColorClass, getUserColorTheme } from '../../../utils/color';
import { isBefore, startOfToday, differenceInDays } from 'date-fns';
import { AnimatePresence } from 'framer-motion';
import { isStockTerminalStatus } from '../../../config/status';
import { ChevronLeft, ChevronRight, CheckCircle2, Clock, AlertCircle, Repeat, Calendar as CalendarIcon } from 'lucide-react';
import TaskPillTooltip from '../TaskPillTooltip';

export interface TaskTimelineSegment {
    task: Task;
    startCol: number;      // 0..6
    endCol: number;        // 0..6
    span: number;          // 1..7
    slotIndex: number;     // 0, 1, 2...
    isRealStart: boolean;  // Task starts on or after this week's startCol day
    isRealEnd: boolean;    // Task ends on or before this week's endCol day
    continuesFromPrev: boolean; // Task started in a previous week
    continuesToNext: boolean;   // Task extends to a future week
}

interface TaskMultiDayPillProps {
    segment: TaskTimelineSegment;
    isExpanded: boolean;
    isFirstWeek?: boolean;
    activeChipIds: string[];
    customChips: ChipConfig[];
    masterOptions?: MasterOption[];
    channels: Channel[];
    users?: User[];
    onDragStart: (e: React.DragEvent, taskId: string) => void;
    onClick: (task: Task) => void;
}

const TaskMultiDayPill: React.FC<TaskMultiDayPillProps> = ({
    segment,
    isExpanded,
    isFirstWeek = false,
    activeChipIds,
    customChips,
    masterOptions,
    channels,
    users = [],
    onDragStart,
    onClick
}) => {
    const { task, startCol, span, slotIndex, isRealStart, isRealEnd, continuesFromPrev, continuesToNext } = segment;
    const [isHovered, setIsHovered] = useState(false);
    const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

    // Get end date object safely
    const endDateObj = useMemo(() => {
        if (!task.endDate) return null;
        return task.endDate instanceof Date ? task.endDate : new Date(task.endDate);
    }, [task.endDate]);

    const overdueDays = useMemo(() => {
        if (!endDateObj) return 0;
        return differenceInDays(startOfToday(), endDateObj);
    }, [endDateObj]);

    // Overdue Logic: Not finished and endDate < today
    const isOverdue = useMemo(() => {
        if (!task.endDate) return false;
        const finishedKeywords = ['DONE', 'PUBLISH', 'FINISH', 'COMPLETE', 'APPROVE', 'SUCCESS', 'ARCHIVE', 'POSTED'];
        const currentStatus = (task.status || '').toUpperCase();
        const isFinished = finishedKeywords.some(k => currentStatus.includes(k));
        if (isFinished) return false;
        return isBefore(endDateObj || new Date(task.endDate), startOfToday());
    }, [task.status, task.endDate, endDateObj]);

    const isCriticalOverdue = useMemo(() => {
        if (!isOverdue || !endDateObj) return false;
        return differenceInDays(startOfToday(), endDateObj) >= 7;
    }, [isOverdue, endDateObj]);

    const isInsightOverdue = useMemo(() => {
        const isTerminal = isStockTerminalStatus(task.status);
        if (task.type !== 'CONTENT' || task.isUnscheduled || !isTerminal || !task.endDate || task.hasAnalytics) return false;
        return differenceInDays(startOfToday(), endDateObj || new Date(task.endDate)) >= 7;
    }, [task.type, task.status, task.endDate, task.isUnscheduled, task.hasAnalytics, endDateObj]);

    // Assignees & Primary Assignee
    const assignees = useMemo(() => {
        if (!task.assigneeIds || task.assigneeIds.length === 0 || !users) return [];
        return users.filter(u => task.assigneeIds.includes(u.id));
    }, [task.assigneeIds, users]);

    const primaryAssignee = useMemo(() => {
        return assignees.length > 0 ? assignees[0] : null;
    }, [assignees]);

    // User Color Theme Assignment
    const userTheme = useMemo(() => {
        const key = primaryAssignee ? (primaryAssignee.id || primaryAssignee.name) : (task.targetPosition || task.id);
        return getUserColorTheme(key);
    }, [primaryAssignee, task.targetPosition, task.id]);

    // Resolve active hex color from custom filter chips
    const activeHexColor = useMemo(() => {
        if (!isOverdue && activeChipIds.length > 0 && Array.isArray(customChips)) {
            const matchingChip = customChips.find(chip => {
                if (!activeChipIds.includes(chip.id)) return false;
                switch (chip.type) {
                    case 'CHANNEL': return task.channelId === chip.value;
                    case 'FORMAT': return task.contentFormats && task.contentFormats.includes(chip.value);
                    case 'STATUS': return task.status === chip.value;
                    case 'PILLAR': return task.pillar === chip.value;
                    case 'ASSIGNEE': return task.assigneeIds && task.assigneeIds.includes(chip.value);
                    default: return false;
                }
            });
            return matchingChip && matchingChip.colorTheme ? getHexFromColorClass(matchingChip.colorTheme) : null;
        }
        return null;
    }, [activeChipIds, customChips, task, isOverdue]);

    // Channel details
    const channel = useMemo(() => {
        if (!task.channelId || !channels) return null;
        return channels.find(c => c.id === task.channelId) || null;
    }, [task.channelId, channels]);

    // Resolve Status Label & Color from Master Data
    const { statusLabel, statusColor, statusEmoji } = useMemo(() => {
        let label = task.status || '';
        let color = 'bg-slate-100/90 text-slate-700 border-slate-200';
        let emoji = '';

        if (masterOptions) {
            const statusOpt = masterOptions.find(o => (o.type === 'STATUS' || o.type === 'TASK_STATUS') && o.key === task.status);
            if (statusOpt) {
                label = statusOpt.label.replace(/^\d+\s*/, '');
                const emojiMatch = statusOpt.label.match(/[\p{Emoji}\u200d]+/u);
                emoji = emojiMatch ? emojiMatch[0] : '';
                if (statusOpt.color) {
                    color = statusOpt.color;
                }
            }
        }

        if (task.type === 'PLAN') {
            if (task.status === 'DONE' || task.status === 'APPROVE') {
                label = 'DONE';
                color = 'bg-emerald-100 text-emerald-800 border-emerald-300';
                emoji = '✅';
            } else if (task.status === 'DOING' || task.status === 'PROGRESS') {
                label = 'DOING';
                color = 'bg-amber-100 text-amber-800 border-amber-300';
                emoji = '⚡';
            } else {
                label = 'TODO';
                color = 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-300';
                emoji = '📋';
            }
        }

        return { statusLabel: label, statusColor: color, statusEmoji: emoji };
    }, [masterOptions, task.status, task.type]);

    // Multi-Day Bar Border Radius & Shape
    const shapeClass = useMemo(() => {
        let classes = '';
        if (isRealStart && isRealEnd) {
            classes += ' rounded-xl mx-0.5 border ';
        } else if (isRealStart && !isRealEnd) {
            classes += ' rounded-l-xl rounded-r-none ml-0.5 mr-0 border-l border-y border-r-0 ';
        } else if (!isRealStart && isRealEnd) {
            classes += ' rounded-r-xl rounded-l-none mr-0.5 ml-0 border-r border-y border-l-0 ';
        } else {
            classes += ' rounded-none mx-0 border-y border-x-0 ';
        }
        return classes;
    }, [isRealStart, isRealEnd]);

    // Dynamic Styling based on Member Color Palette
    const taskStyle = useMemo(() => {
        if (activeHexColor) {
            return 'bg-indigo-50/95 text-indigo-950 border-indigo-300 shadow-2xs';
        }

        if (isOverdue) {
            return isCriticalOverdue 
                ? 'bg-slate-100 text-slate-500 border-slate-300 opacity-75' 
                : 'bg-red-50 text-red-900 border-red-200 shadow-2xs';
        }

        if (task.type === 'PLAN') {
            const isRecur = task.isMonthlyRecurring || task.recurrence === 'MONTHLY';
            return isRecur
                ? 'bg-gradient-to-r from-fuchsia-100/95 via-purple-100/90 to-fuchsia-50/90 border-fuchsia-300 text-fuchsia-950 font-semibold shadow-2xs border-dashed'
                : 'bg-gradient-to-r from-violet-100/95 to-purple-50/90 border-violet-300 text-violet-950 font-semibold shadow-2xs';
        }

        if (task.priority === 'URGENT') {
            return 'bg-rose-50 text-rose-950 border-rose-300 ring-1 ring-rose-400/40 shadow-2xs';
        }
        if (task.priority === 'HIGH') {
            return 'bg-orange-50 text-orange-950 border-orange-200 shadow-2xs';
        }

        // Standard: Use member dynamic pastel theme
        return `${userTheme.bg} ${userTheme.bgHover} ${userTheme.border} ${userTheme.text} shadow-2xs`;
    }, [activeHexColor, isOverdue, isCriticalOverdue, task.type, task.priority, userTheme]);

    const barHeightClass = isExpanded ? 'h-7' : 'h-[26px]';
    const channelAccentColor = channel?.color && channel.color.startsWith('#') ? channel.color : undefined;

    const tooltipCol = segment.endCol >= 5 ? 6 : (startCol <= 1 ? 0 : startCol);

    return (
        <div
            style={{
                gridColumn: `${startCol + 1} / span ${span}`,
                gridRow: `${slotIndex + 1}`,
                borderLeftColor: (isRealStart && channelAccentColor) ? channelAccentColor : undefined,
                borderLeftWidth: (isRealStart && channelAccentColor) ? '4px' : undefined,
            }}
            className={`
                group relative flex items-center justify-between gap-1.5 px-2 py-0.5
                ${barHeightClass} ${shapeClass} ${taskStyle}
                cursor-pointer transition-all duration-150 select-none ${isHovered ? 'z-50 shadow-lg brightness-[1.03]' : 'hover:z-30 hover:shadow-md hover:brightness-[1.03]'} active:scale-[0.99]
            `}
            draggable
            onDragStart={(e) => onDragStart(e, task.id)}
            onClick={(e) => {
                e.stopPropagation();
                onClick(task);
            }}
            onMouseEnter={(e) => {
                setIsHovered(true);
                setMousePos({ x: e.clientX, y: e.clientY });
            }}
            onMouseMove={(e) => {
                setMousePos({ x: e.clientX, y: e.clientY });
            }}
            onMouseLeave={() => {
                setIsHovered(false);
                setMousePos(null);
            }}
        >
            {/* Left Content: Continuous Arrow / Assignee Avatar & Name / Title */}
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
                {continuesFromPrev && (
                    <ChevronLeft className="w-3.5 h-3.5 text-slate-400 shrink-0 -ml-1" />
                )}

                {/* Primary Assignee Avatar or Accent Dot / Routine Icon */}
                {task.type === 'PLAN' ? (
                    <div className="flex items-center gap-1 shrink-0">
                        {task.isMonthlyRecurring || task.recurrence === 'MONTHLY' ? (
                            <span className="w-4 h-4 rounded-full bg-fuchsia-200/90 text-fuchsia-800 flex items-center justify-center shrink-0 shadow-2xs" title="รูทีนประจำทุกเดือน">
                                <Repeat className="w-2.5 h-2.5" />
                            </span>
                        ) : (
                            <span className="w-4 h-4 rounded-full bg-violet-200/90 text-violet-800 flex items-center justify-center shrink-0 shadow-2xs" title="แพลนเฉพาะกิจ">
                                <CalendarIcon className="w-2.5 h-2.5" />
                            </span>
                        )}
                    </div>
                ) : primaryAssignee ? (
                    <div className="flex items-center gap-1 shrink-0">
                        <img
                            src={primaryAssignee.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=64&h=64&fit=crop&crop=faces'}
                            alt={primaryAssignee.name}
                            title={primaryAssignee.name}
                            className={`w-4 h-4 rounded-full border border-white object-cover ring-1 ${userTheme.avatarRing} shadow-2xs shrink-0`}
                            referrerPolicy="no-referrer"
                        />
                        {(span >= 2 || isExpanded) && (
                            <span className="text-[10px] font-black text-slate-700/80 truncate max-w-[65px] hidden sm:inline-block">
                                {primaryAssignee.name}
                            </span>
                        )}
                    </div>
                ) : (
                    <span className={`w-2 h-2 rounded-full shrink-0 ${userTheme.accentDot}`} />
                )}

                {/* Task Title */}
                <span className={`text-[11px] font-bold truncate leading-tight tracking-tight ${task.type === 'PLAN' ? 'text-fuchsia-950 group-hover:text-fuchsia-700' : 'group-hover:text-indigo-600'} transition-colors`}>
                    {task.title}
                </span>

                {/* Routine Tag / Target Position / Role Badge */}
                {task.type === 'PLAN' && (task.isMonthlyRecurring || task.recurrence === 'MONTHLY') && (
                    <span className="hidden sm:inline-flex px-1.5 py-0.2 rounded text-[8px] font-black uppercase tracking-wider bg-fuchsia-200/70 text-fuchsia-900 border border-fuchsia-300/60 shrink-0">
                        ROUTINE
                    </span>
                )}
                {task.targetPosition && task.type !== 'PLAN' && (
                    <span className="hidden md:inline-flex px-1.5 py-0.2 rounded text-[8px] font-black uppercase tracking-wider bg-white/80 text-slate-700 border border-slate-200/80 shrink-0">
                        {task.targetPosition}
                    </span>
                )}
            </div>

            {/* Right Meta: Status & Extra Assignees & Continuation Arrow */}
            <div className="flex items-center gap-1 shrink-0 ml-1">
                {statusLabel && (
                    <span className={`
                        text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded-md border
                        ${statusColor} shrink-0 hidden sm:inline-block max-w-[80px] truncate shadow-2xs
                    `}>
                        {statusEmoji ? `${statusEmoji} ` : ''}{statusLabel}
                    </span>
                )}

                {/* Multiple Assignees Overlap */}
                {assignees.length > 1 && (
                    <div className="hidden lg:flex items-center -space-x-1 shrink-0">
                        {assignees.slice(1, 3).map((user) => (
                            <img
                                key={user.id}
                                src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=64&h=64&fit=crop&crop=faces'}
                                alt={user.name}
                                title={user.name}
                                className="w-3.5 h-3.5 rounded-full border border-white object-cover shadow-2xs"
                                referrerPolicy="no-referrer"
                            />
                        ))}
                        {assignees.length > 3 && (
                            <span className="w-3.5 h-3.5 rounded-full bg-slate-200 text-slate-600 text-[7px] font-black flex items-center justify-center border border-white">
                                +{assignees.length - 3}
                            </span>
                        )}
                    </div>
                )}

                {continuesToNext && (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0 -mr-1" />
                )}
            </div>

            {/* Hover Tooltip */}
            <AnimatePresence>
                {isHovered && mousePos && (
                    <TaskPillTooltip
                        task={task}
                        viewMode={task.type === 'PLAN' ? 'PLAN' : 'TASK'}
                        channels={channels}
                        dayOfWeek={tooltipCol}
                        isFirstWeek={isFirstWeek}
                        isUnfinishedContent={false}
                        isOverdue={isOverdue}
                        isCriticalOverdue={isCriticalOverdue}
                        isInsightOverdue={isInsightOverdue}
                        overdueDays={overdueDays}
                        endDateObj={endDateObj}
                        statusLabel={statusLabel}
                        statusColor={statusColor}
                        users={users}
                        mousePos={mousePos}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default memo(TaskMultiDayPill);

