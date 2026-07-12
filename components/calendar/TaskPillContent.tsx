import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Clock8, Zap, Film } from 'lucide-react';
import { Task } from '../../types';
import { TaskDisplayMode } from '../CalendarView';

interface TaskPillContentProps {
    task: Task;
    displayMode: TaskDisplayMode;
    isUnfinishedContent: boolean;
    isOverdue: boolean;
    isCriticalOverdue: boolean;
    isInsightOverdue: boolean;
    statusLabel: string;
    statusColor: string;
    statusEmoji: string;
    isExpanded: boolean;
}

const getTaskDotClass = (t: Task) => {
    if (t.status === 'DONE' || t.status === 'APPROVE') return 'bg-green-500';
    if (t.status === 'TODO' || t.status === 'IDEA') return 'bg-gray-400';
    if (t.status === 'BLOCKED') return 'bg-red-500';
    return 'bg-indigo-500'; 
};

const TaskPillContent: React.FC<TaskPillContentProps> = ({
    task,
    displayMode,
    isUnfinishedContent,
    isOverdue,
    isCriticalOverdue,
    isInsightOverdue,
    statusLabel,
    statusColor,
    statusEmoji,
    isExpanded,
}) => {
    const analyticsStatus = task.analyticsStatus || (task.hasAnalytics ? 'COMPLETE' : 'NONE');

    const hasAnalyticsIndicator = (analyticsStatus === 'COMPLETE' || analyticsStatus === 'PARTIAL') && (
        <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.25, rotate: analyticsStatus === 'COMPLETE' ? 15 : -10 }}
            className={`shrink-0 flex items-center justify-center w-4 h-4 rounded-full border shadow-sm ${
                analyticsStatus === 'COMPLETE'
                    ? 'bg-purple-100 border-purple-200 text-purple-600'
                    : 'bg-amber-50 border-amber-200 border-dashed text-amber-500 animate-pulse'
            }`}
            title={
                analyticsStatus === 'COMPLETE'
                    ? "Performance Data Entry Complete ✨"
                    : "Performance Data Entry Partially Complete (Some channels missing) ⚡"
            }
        >
            <Zap className={`w-2.5 h-2.5 ${analyticsStatus === 'COMPLETE' ? 'text-purple-600 fill-purple-600' : 'text-amber-500 fill-amber-500 opacity-80'}`} />
        </motion.div>
    );

    const overdueIndicator = isOverdue && (
        <motion.div 
            animate={isCriticalOverdue ? { 
                opacity: [0.4, 1, 0.4],
                x: [0, -1.5, 1.5, -1.5, 1.5, 0]
            } : { 
                scale: [1, 1.2, 1], 
                opacity: [1, 0.6, 1],
                x: [0, -1, 1, -1, 1, 0]
            }}
            transition={{
                opacity: { repeat: Infinity, duration: isCriticalOverdue ? 3 : 1.5 },
                scale: isCriticalOverdue ? undefined : { repeat: Infinity, duration: 1.5 },
                x: {
                    repeat: Infinity,
                    duration: 1.5,
                    repeatDelay: isCriticalOverdue ? 3 : 4
                }
            }}
            className="shrink-0"
        >
            {isCriticalOverdue ? (
                <Clock8 className="w-3.5 h-3.5 text-slate-400" />
            ) : (
                <AlertCircle className="w-3.5 h-3.5 text-red-500" />
            )}
        </motion.div>
    );

    const unfinishedContentIndicator = isUnfinishedContent && (
        <motion.div
            initial={{ scale: 0.8 }}
            animate={{ 
                scale: [1, 1.15, 1],
                opacity: [0.85, 1, 0.85]
            }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="shrink-0 flex items-center justify-center w-5 h-5 bg-rose-50 border border-rose-200/60 rounded-xl text-rose-550 shadow-[0_2px_8px_rgba(244,63,94,0.08)]"
            title="มีคิวลงคลิปวันนี้! (ยังไม่เสร็จสิ้น)"
        >
            <Film className="w-3 h-3 text-rose-500" />
        </motion.div>
    );

    switch (displayMode) {
        case 'MINIMAL':
            return (
                <div className="flex items-center gap-1 overflow-hidden w-full">
                    {isUnfinishedContent && (
                        <span title="มีคิวลงคลิปวันนี้" className="shrink-0 flex items-center">
                            <Film className="w-3 h-3 text-rose-500 animate-pulse" />
                        </span>
                    )}
                    {overdueIndicator}
                    {isInsightOverdue && <AlertCircle className="w-3 h-3 text-rose-500 shrink-0" />}
                    {hasAnalyticsIndicator}
                    <span className="truncate flex-1 font-bold">{task.title}</span>
                </div>
            );
        case 'DOT':
            return (
                <div className="flex items-center gap-2 overflow-hidden w-full">
                     {isUnfinishedContent ? (
                         <span title="มีคิวลงคลิปวันนี้" className="shrink-0 flex items-center">
                             <Film className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                         </span>
                     ) : isOverdue ? overdueIndicator : <div className={`w-2 h-2 rounded-full shrink-0 ${getTaskDotClass(task)}`}></div>}
                     {isInsightOverdue && <AlertCircle className="w-3 h-3 text-rose-500 shrink-0" />}
                     {hasAnalyticsIndicator}
                     <span className="truncate flex-1 font-bold">{task.title}</span>
                </div>
            );
        case 'EMOJI':
            return (
                 <div className="flex items-center gap-1.5 overflow-hidden w-full">
                     {isUnfinishedContent && (
                         <span title="มีคิวลงคลิปวันนี้" className="shrink-0 flex items-center">
                             <Film className="w-3 h-3 text-rose-500 animate-pulse" />
                         </span>
                     )}
                     {isOverdue ? overdueIndicator : (statusEmoji && <span className="text-[12px] shrink-0">{statusEmoji}</span>)}
                     {isInsightOverdue && <AlertCircle className="w-3 h-3 text-rose-500 shrink-0" />}
                     {hasAnalyticsIndicator}
                     <span className="truncate flex-1 font-bold">{task.title}</span>
                </div>
            );
        case 'FULL':
        default:
            // Default Expanded View with Badge
            return (
                <>
                    {isUnfinishedContent && unfinishedContentIndicator}
                    {overdueIndicator}
                    {isInsightOverdue && (
                        <div className="shrink-0 flex items-center justify-center w-5 h-5 bg-rose-100 rounded-full" title="Missing Analytics Insight">
                            <AlertCircle className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
                        </div>
                    )}
                    <span className="truncate flex-1 font-bold">{task.title}</span>
                    {hasAnalyticsIndicator}
                    {statusLabel && (
                        <span className={`
                            text-[9px] font-black uppercase tracking-wider shrink-0 px-2 py-0.5 rounded-md border
                            ${isOverdue ? (isCriticalOverdue ? 'STUCK' : 'OVERDUE') : statusColor}
                            ${!isExpanded ? 'hidden lg:inline-block' : ''}
                            shadow-sm
                        `}>
                            {isOverdue ? (isCriticalOverdue ? 'STUCK' : 'OVERDUE') : statusLabel}
                        </span>
                    )}
                </>
            );
    }
};

export default memo(TaskPillContent);
