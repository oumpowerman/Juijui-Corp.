
import React from 'react';
import { ArrowRight, Layout, MousePointerClick, Calendar, Flame, Zap, Skull, Sparkles } from 'lucide-react';
import { WeeklyQuest, Task, Channel } from '../../types';
import { addDays, differenceInDays, isPast, isToday } from 'date-fns';
import { isTaskMatchingQuest } from '../../utils/questUtils';
import { motion, AnimatePresence } from 'framer-motion';

interface QuestCardProps {
    channel?: Channel; 
    quests: WeeklyQuest[];
    allTasks: Task[]; 
    onClick: () => void;
    onUpdateManualProgress?: (id: string, val: number) => void;
}

const QuestCard: React.FC<QuestCardProps> = React.memo(({ channel, quests, allTasks, onClick, onUpdateManualProgress }) => {
    
    // --- Logic Reused for Visualization ---
    const getMatchingTasks = (quest: WeeklyQuest) => {
        if (quest.questType === 'MANUAL') return [];
        return allTasks.filter(t => isTaskMatchingQuest(t, quest));
    };

    const calculateProgress = (quest: WeeklyQuest) => {
        if (quest.questType === 'MANUAL') return quest.manualProgress || 0;
        return getMatchingTasks(quest).length;
    };

    const calculateOverall = () => {
        if (quests.length === 0) return 0;
        let totalCurrent = 0;
        let totalTarget = 0;
        quests.forEach(q => {
            totalCurrent += Math.min(calculateProgress(q), q.targetCount); 
            totalTarget += q.targetCount;
        });
        return totalTarget === 0 ? 0 : Math.round((totalCurrent / totalTarget) * 100);
    };

    const overallPercent = calculateOverall();
    const isMisc = !channel;
    
    const cardBgColor = isMisc ? 'bg-gray-50/50' : channel?.color.replace('text-', 'bg-').replace('bg-', 'bg-opacity-20 ') || 'bg-gray-50/50';
    const textColor = isMisc ? 'text-gray-600' : 'text-gray-800';

    return (
        <motion.div 
            onClick={onClick}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ 
                scale: 1.02, 
                y: -8,
                transition: { type: "spring", stiffness: 400, damping: 10 }
            }}
            whileTap={{ scale: 0.98 }}
            className="group relative flex flex-col h-full cursor-pointer overflow-hidden rounded-[2.5rem] border border-white/40 bg-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.05)] backdrop-blur-xl transition-all duration-500 hover:shadow-[0_20px_40px_rgba(0,0,0,0.1)]"
        >
            {/* Glossy Overlay Effect */}
            <div className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-tr from-white/20 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            
            {/* Overall Progress Bar (Top) */}
            <div className="h-2 w-full bg-gray-100/50 backdrop-blur-sm">
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${overallPercent}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className={`h-full relative ${isMisc ? 'bg-gray-400' : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500'}`}
                >
                    {overallPercent > 0 && (
                        <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.3)_50%,transparent_100%)] animate-shimmer" />
                    )}
                </motion.div>
            </div>

            {/* Card Header */}
            <div className={`relative z-10 px-6 py-6 border-b border-white/20 ${cardBgColor}`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <motion.div 
                            whileHover={{ rotate: [0, -10, 10, -10, 0], transition: { duration: 0.5 } }}
                            className="shrink-0"
                        >
                            {isMisc ? (
                                <div className="w-16 h-16 rounded-[1.5rem] bg-white border-4 border-white shadow-lg flex items-center justify-center text-gray-400">
                                    <Layout className="w-8 h-8" />
                                </div>
                            ) : (
                                channel?.logoUrl ? (
                                    <img 
                                        src={channel.logoUrl} 
                                        alt={channel.name} 
                                        className="w-16 h-16 rounded-[1.5rem] object-cover border-4 border-white shadow-lg bg-white"
                                    />
                                ) : (
                                    <div className="w-16 h-16 rounded-[1.5rem] bg-white border-4 border-white shadow-lg flex items-center justify-center text-2xl font-black uppercase text-gray-300">
                                        {channel?.name.substring(0, 2)}
                                    </div>
                                )
                            )}
                        </motion.div>
                        
                        <div>
                            <h3 className={`font-black text-2xl tracking-tight leading-tight ${textColor}`}>
                                {isMisc ? 'ทั่วไป (Misc)' : channel?.name}
                            </h3>
                            <div className="flex items-center gap-2 mt-1.5">
                                <span className="flex items-center text-[10px] font-black uppercase tracking-widest text-gray-400 bg-white/50 px-2 py-0.5 rounded-full border border-white/50">
                                    <Calendar className="w-3 h-3 mr-1" /> {quests.length} Quests
                                </span>
                                {overallPercent === 100 && (
                                    <motion.span 
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="flex items-center text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100"
                                    >
                                        <Sparkles className="w-3 h-3 mr-1" /> Perfect
                                    </motion.span>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    <div className="text-right">
                        <motion.span 
                            key={overallPercent}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className={`text-4xl font-black tracking-tighter ${textColor} drop-shadow-sm`}
                        >
                            {overallPercent}<span className="text-xl ml-0.5">%</span>
                        </motion.span>
                    </div>
                </div>
            </div>

            {/* Quests List */}
            <div className="relative z-10 p-6 flex-1 space-y-4">
                <AnimatePresence>
                    {quests.slice(0, 4).map((quest, idx) => {
                        const progress = calculateProgress(quest);
                        const percent = Math.min((progress / quest.targetCount) * 100, 100);
                        const isCompleted = percent >= 100;
                        
                        const qStart = new Date(quest.weekStartDate);
                        const qEnd = quest.endDate ? new Date(quest.endDate) : addDays(qStart, 6);
                        
                        const daysRemaining = differenceInDays(qEnd, new Date());
                        const isFailed = isPast(qEnd) && !isToday(qEnd) && !isCompleted;
                        
                        let heatClass = 'py-1'; 
                        let HeatIcon = null;

                        if (!isCompleted && !isFailed) {
                            if (daysRemaining <= 0) {
                                heatClass = 'bg-red-50/80 border border-red-200 shadow-[0_0_15px_rgba(239,68,68,0.1)] rounded-2xl p-3 -mx-2';
                                HeatIcon = <Flame className="w-4 h-4 text-red-600 fill-red-600 animate-pulse shrink-0" />;
                            } else if (daysRemaining === 1) {
                                heatClass = 'bg-orange-50/80 border border-orange-200 rounded-2xl p-3 -mx-2';
                                HeatIcon = <Flame className="w-4 h-4 text-orange-500 fill-orange-500 shrink-0" />;
                            }
                        }

                        if (isFailed) {
                            heatClass = 'bg-slate-100/50 border border-slate-300 border-dashed rounded-2xl p-3 -mx-2 opacity-60 grayscale relative overflow-hidden';
                            HeatIcon = <Skull className="w-4 h-4 text-slate-500 shrink-0" />;
                        }

                        return (
                            <motion.div 
                                key={quest.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className={`group/item transition-all duration-300 ${heatClass}`}
                            >
                                {isFailed && (
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[24px] font-black text-slate-300/20 rotate-[-12deg] pointer-events-none select-none z-0">
                                        FAILED
                                    </div>
                                )}

                                <div className="flex justify-between items-center mb-2 text-sm relative z-10">
                                    <div className="flex items-center gap-2.5 max-w-[75%]">
                                        <div className={`p-1.5 rounded-lg ${isCompleted ? 'bg-emerald-100 text-emerald-600' : isFailed ? 'bg-slate-200 text-slate-500' : 'bg-white shadow-sm text-gray-400'}`}>
                                            {HeatIcon ? HeatIcon : (quest.questType === 'MANUAL' ? <MousePointerClick className="w-3.5 h-3.5" /> : <Zap className="w-3.5 h-3.5" />)}
                                        </div>
                                        
                                        <span className={`font-bold truncate ${isCompleted ? 'text-gray-400 line-through' : isFailed ? 'text-slate-600 line-through decoration-slate-400' : 'text-gray-700'}`}>
                                            {quest.title}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <span className={`text-xs font-black px-2 py-0.5 rounded-md ${isCompleted ? 'bg-emerald-100 text-emerald-700' : isFailed ? 'bg-slate-200 text-slate-600' : 'bg-gray-100 text-gray-500'}`}>
                                            {progress}/{quest.targetCount}
                                        </span>
                                    </div>
                                </div>

                                <div className="h-2 bg-gray-200/50 rounded-full overflow-hidden relative z-10 ring-1 ring-black/5">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${percent}%` }}
                                        transition={{ duration: 1, delay: 0.5 + (idx * 0.1) }}
                                        className={`h-full rounded-full relative ${isCompleted ? 'bg-gradient-to-r from-emerald-400 to-teal-500' : isFailed ? 'bg-slate-400' : 'bg-gradient-to-r from-indigo-400 to-blue-500'}`}
                                    >
                                        {!isFailed && percent > 0 && (
                                            <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.4)_50%,transparent_100%)] animate-shimmer" />
                                        )}
                                    </motion.div>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
                
                {quests.length > 4 && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center text-[10px] text-gray-400 font-black uppercase tracking-widest pt-2"
                    >
                        + อีก {quests.length - 4} ภารกิจที่ซ่อนอยู่
                    </motion.div>
                )}
            </div>
            
            <div className="relative z-10 bg-white/40 backdrop-blur-md p-4 flex items-center justify-center border-t border-white/20 text-[11px] font-black uppercase tracking-widest text-gray-400 group-hover:text-indigo-600 group-hover:bg-white/60 transition-all duration-300">
                <span>{isMisc ? 'จัดการภารกิจ' : 'ดูรายละเอียด'}</span>
                <motion.div
                    animate={{ x: [0, 5, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                >
                    <ArrowRight className="w-3.5 h-3.5 ml-2" />
                </motion.div>
            </div>
        </motion.div>
    );
});

export default QuestCard;
