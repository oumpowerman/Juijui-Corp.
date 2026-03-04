import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Skull, Zap, Calendar, Target, RefreshCw, ChevronDown, CheckCircle2, Circle } from 'lucide-react';
import { format } from 'date-fns';
import { WeeklyQuest, Task } from '../../../types';
import { isTaskMatchingQuest } from '../../../utils/questUtils';

interface QuestStatCardProps {
    quest?: WeeklyQuest;
    groupTitle?: string;
    subQuests?: WeeklyQuest[];
    tasks: Task[];
    calculateStatus: (quest: WeeklyQuest) => { 
        isCompleted: boolean; 
        isExpired: boolean; 
        progress: number; 
        qEnd: Date; 
        matchingTasks: Task[] 
    };
    progress?: number;
    isCompleted?: boolean;
    isFailed?: boolean;
    qEnd?: Date;
    onRevive?: (quest: WeeklyQuest) => void;
    index: number;
}

export const QuestStatCard: React.FC<QuestStatCardProps> = ({ 
    quest, groupTitle, subQuests, tasks, calculateStatus, progress, isCompleted, isFailed, qEnd, onRevive, index 
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    
    // If it's a group, calculate aggregate stats
    const isGroup = !!groupTitle && !!subQuests;
    const groupStats = isGroup ? subQuests!.reduce((acc, q) => {
        const status = calculateStatus(q);
        acc.totalTarget += q.targetCount;
        acc.totalProgress += status.progress;
        if (status.isCompleted) acc.completedCount++;
        else if (status.isExpired) acc.failedCount++;
        else acc.ongoingCount++;
        return acc;
    }, { totalTarget: 0, totalProgress: 0, completedCount: 0, failedCount: 0, ongoingCount: 0 }) : null;

    const displayTitle = isGroup ? groupTitle : quest?.title;
    const displayProgress = isGroup ? groupStats!.totalProgress : progress!;
    const displayTarget = isGroup ? groupStats!.totalTarget : quest!.targetCount;
    const percent = Math.min((displayProgress / displayTarget) * 100, 100);
    
    const displayIsCompleted = isGroup ? groupStats!.completedCount === subQuests!.length : isCompleted;
    const displayIsFailed = isGroup ? groupStats!.failedCount > 0 && groupStats!.completedCount === 0 : isFailed;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="group relative bg-white/40 backdrop-blur-xl border border-white/50 p-5 rounded-[2.5rem] shadow-sm hover:shadow-md transition-all duration-500"
        >
            <div className="flex items-center gap-5">
                {/* 3D Icon Container - Compact */}
                <div className={`relative w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg border transition-all duration-700 group-hover:rotate-[8deg] group-hover:scale-105
                    ${displayIsCompleted ? 'bg-gradient-to-br from-emerald-100 to-emerald-200 border-emerald-300/50 text-emerald-600' :
                      displayIsFailed ? 'bg-gradient-to-br from-rose-100 to-rose-200 border-rose-300/50 text-rose-600' :
                      'bg-gradient-to-br from-sky-100 to-sky-200 border-sky-300/50 text-sky-600'}
                `}>
                    {displayIsCompleted ? <Trophy className="w-6 h-6" /> : displayIsFailed ? <Skull className="w-6 h-6" /> : <Zap className="w-6 h-6" />}
                </div>

                {/* Content - Compact */}
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-4 mb-2">
                        <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                                {isGroup && <span className="px-2 py-0.5 bg-indigo-500 text-white text-[8px] font-black rounded-md uppercase tracking-tighter">Main Quest</span>}
                                <h4 className={`font-bold text-lg tracking-tight truncate ${displayIsFailed ? 'text-slate-400 line-through decoration-rose-300' : 'text-slate-800'}`}>
                                    {displayTitle}
                                </h4>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                                <span className={`px-2 py-0.5 rounded-full border tracking-widest uppercase
                                    ${displayIsCompleted ? 'bg-emerald-500 text-white border-emerald-400' :
                                      displayIsFailed ? 'bg-rose-500 text-white border-rose-400' :
                                      'bg-sky-500 text-white border-sky-400'}
                                `}>
                                    {displayIsCompleted ? 'Success' : displayIsFailed ? 'Failed' : 'Active'}
                                </span>
                                {!isGroup && qEnd && (
                                    <div className="flex items-center gap-1 bg-slate-100/50 px-2 py-0.5 rounded-full">
                                        <Calendar className="w-3 h-3" />
                                        <span>{format(new Date(quest!.weekStartDate), 'd MMM')} - {format(qEnd, 'd MMM')}</span>
                                    </div>
                                )}
                                {isGroup && (
                                    <span className="text-indigo-500">{subQuests!.length} ภารกิจย่อย</span>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {!isGroup && isFailed && onRevive && (
                                <motion.button 
                                    whileHover={{ scale: 1.1, rotate: 180 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => onRevive(quest!)}
                                    className="p-2 bg-white/80 text-emerald-500 border border-emerald-200 rounded-xl shadow-md hover:bg-emerald-50 transition-all"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                </motion.button>
                            )}
                            <motion.button 
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => setIsExpanded(!isExpanded)}
                                className={`p-2 rounded-xl border transition-all duration-300
                                    ${isExpanded ? 'bg-slate-800 text-white border-slate-700' : 'bg-white/60 text-slate-400 border-white/80 hover:bg-white'}
                                `}
                            >
                                <ChevronDown className={`w-4 h-4 transition-transform duration-500 ${isExpanded ? 'rotate-180' : ''}`} />
                            </motion.button>
                        </div>
                    </div>

                    {/* Progress Bar - Compact */}
                    <div className="space-y-1.5">
                        <div className="flex justify-between items-end">
                            <div className="flex items-center gap-1.5">
                                <Target className="w-3 h-3 text-slate-400" />
                                <span className="text-[10px] font-bold text-slate-600">
                                    {displayProgress} / {displayTarget}
                                </span>
                            </div>
                            <span className="text-[10px] font-bold text-slate-400">{Math.round(percent)}%</span>
                        </div>
                        <div className="relative h-2 bg-slate-200/40 rounded-full overflow-hidden shadow-inner border border-white/10">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${percent}%` }}
                                transition={{ duration: 1, ease: "circOut" }}
                                className={`h-full rounded-full relative
                                    ${displayIsCompleted ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' : 
                                      displayIsFailed ? 'bg-gradient-to-r from-rose-400 to-rose-600' : 
                                      'bg-gradient-to-r from-sky-400 to-indigo-600'}
                                `}
                            >
                                <div className="absolute inset-0 bg-white/20 animate-pulse" />
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Expanded View - Hierarchy */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0, marginTop: 0 }}
                        animate={{ height: 'auto', opacity: 1, marginTop: 16 }}
                        exit={{ height: 0, opacity: 0, marginTop: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="bg-white/30 backdrop-blur-2xl rounded-2xl border border-white/40 p-4 shadow-inner">
                            <div className="flex items-center justify-between mb-4">
                                <h5 className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.15em]">
                                    {isGroup ? 'รายการภารกิจย่อย (Sub-Quests)' : 'รายการงานย่อยที่เกี่ยวข้อง (Tasks)'}
                                </h5>
                                <div className="h-px flex-1 bg-slate-200/50 mx-3" />
                            </div>
                            
                            <div className="space-y-2">
                                {isGroup ? (
                                    subQuests!.map((sq, idx) => {
                                        const sqStatus = calculateStatus(sq);
                                        return (
                                            <SubQuestItem 
                                                key={sq.id}
                                                quest={sq}
                                                status={sqStatus}
                                                index={idx}
                                                onRevive={onRevive}
                                            />
                                        );
                                    })
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {calculateStatus(quest!).matchingTasks.length === 0 ? (
                                            <p className="text-[10px] font-bold italic text-slate-400 py-2 text-center col-span-2">ยังไม่มีงานย่อยที่เชื่อมโยง</p>
                                        ) : (
                                            calculateStatus(quest!).matchingTasks.map((task, idx) => (
                                                <TaskItem key={task.id} task={task} index={idx} />
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

// --- Helper Components for Hierarchy ---

const SubQuestItem = ({ quest, status, index, onRevive }: any) => {
    const [isTaskExpanded, setIsTaskExpanded] = useState(false);
    const sqPercent = Math.min((status.progress / quest.targetCount) * 100, 100);

    return (
        <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white/50 rounded-xl border border-white/60 overflow-hidden"
        >
            <div className="p-3 flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${status.isCompleted ? 'bg-emerald-100 text-emerald-600' : status.isExpired ? 'bg-rose-100 text-rose-600' : 'bg-sky-100 text-sky-600'}`}>
                    {status.isCompleted ? <Trophy className="w-4 h-4" /> : status.isExpired ? <Skull className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-slate-700 truncate">{quest.title}</span>
                        <span className="text-[9px] font-bold text-slate-400">{status.progress}/{quest.targetCount}</span>
                    </div>
                    <div className="h-1 bg-slate-200/40 rounded-full overflow-hidden">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${sqPercent}%` }}
                            className={`h-full ${status.isCompleted ? 'bg-emerald-500' : status.isExpired ? 'bg-rose-500' : 'bg-sky-500'}`}
                        />
                    </div>
                </div>
                <button 
                    onClick={() => setIsTaskExpanded(!isTaskExpanded)}
                    className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"
                >
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isTaskExpanded ? 'rotate-180' : ''}`} />
                </button>
            </div>
            
            <AnimatePresence>
                {isTaskExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-slate-50/50 border-t border-white/40 p-2"
                    >
                        <div className="grid grid-cols-1 gap-1.5">
                            {status.matchingTasks.length === 0 ? (
                                <p className="text-[9px] font-bold italic text-slate-400 py-1 text-center">ไม่มีงานย่อย</p>
                            ) : (
                                status.matchingTasks.map((task: any, idx: number) => (
                                    <TaskItem key={task.id} task={task} index={idx} />
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

const TaskItem = ({ task, index }: any) => (
    <motion.div 
        initial={{ opacity: 0, x: -5 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.03 }}
        className="flex items-center gap-2.5 p-2 bg-white/60 rounded-lg border border-white/80 hover:bg-white transition-all group/task"
    >
        <div className={`p-1 rounded-md transition-colors ${task.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-300'}`}>
            {task.status === 'COMPLETED' ? <CheckCircle2 className="w-3 h-3" /> : <Circle className="w-3 h-3" />}
        </div>
        <div className="flex-1 min-w-0">
            <span className={`text-[10px] font-bold block truncate ${task.status === 'COMPLETED' ? 'text-slate-700' : 'text-slate-500'}`}>
                {task.title}
            </span>
            <span className="text-[8px] font-bold text-slate-400 uppercase">{format(new Date(task.endDate), 'd MMM yyyy')}</span>
        </div>
    </motion.div>
);
