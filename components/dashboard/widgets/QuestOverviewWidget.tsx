
import React, { useMemo } from 'react';
import { WeeklyQuest, Task, ViewMode } from '../../../types';
import { Target, ChevronRight, Layers, Zap, CheckCircle2, AlertTriangle, Folder, Clock, Flame, ArrowUpRight, Trophy, Star } from 'lucide-react';
import { addDays, isWithinInterval, differenceInDays, endOfDay, startOfDay } from 'date-fns';
import { isTaskMatchingQuest } from '../../../utils/questUtils';
import { motion, AnimatePresence } from 'framer-motion';

interface QuestOverviewWidgetProps {
    quests: WeeklyQuest[];
    tasks: Task[];
    onNavigate: (view: ViewMode) => void;
}

const QuestOverviewWidget: React.FC<QuestOverviewWidgetProps> = ({ quests, tasks, onNavigate }) => {
    
    // --- Helper: Calculate Individual Quest Progress ---
    const getQuestProgress = (quest: WeeklyQuest) => {
        if (quest.questType === 'MANUAL') return quest.manualProgress || 0;
        return tasks.filter(t => isTaskMatchingQuest(t, quest)).length;
    };

    // --- Logic: Grouping & Filtering ---
    const { majorQuests, totalPercent } = useMemo(() => {
        const groups: Record<string, { 
            id: string,
            title: string, 
            totalCurrent: number, 
            totalTarget: number, 
            questCount: number,
            completedCount: number,
            daysLeft: number,
            isUrgent: boolean 
        }> = {};

        const today = new Date();
        let grandTotalCurrent = 0;
        let grandTotalTarget = 0;

        // 1. Filter ACTIVE Quests only (Today must be within start-end)
        const activeQuests = quests.filter(q => {
            const start = startOfDay(new Date(q.weekStartDate));
            const end = endOfDay(q.endDate ? new Date(q.endDate) : addDays(start, 6));
            return isWithinInterval(today, { start, end });
        });

        // 2. Process Grouping
        activeQuests.forEach(q => {
            const current = getQuestProgress(q);
            const target = q.targetCount;
            const isDone = current >= target;
            
            // Determine Group Key (Use ID or 'GENERAL')
            const groupKey = (q.groupId && q.groupTitle) ? q.groupId : 'GENERAL';
            const groupTitle = (q.groupId && q.groupTitle) ? q.groupTitle : 'ภารกิจทั่วไป (General)';

            // Calculate urgency for this specific quest
            const start = startOfDay(new Date(q.weekStartDate));
            const end = endOfDay(q.endDate ? new Date(q.endDate) : addDays(start, 6));
            const daysLeft = differenceInDays(end, today);
            // Urgent if less than 2 days left and not done
            const isUrgent = daysLeft <= 1 && !isDone;

            if (!groups[groupKey]) {
                groups[groupKey] = { 
                    id: groupKey,
                    title: groupTitle, 
                    totalCurrent: 0, 
                    totalTarget: 0, 
                    questCount: 0,
                    completedCount: 0,
                    daysLeft: daysLeft, // Take first quest's days left as proxy, or find min
                    isUrgent: false 
                };
            }

            // Aggregate Stats
            const cappedCurrent = Math.min(current, target);
            groups[groupKey].totalCurrent += cappedCurrent;
            groups[groupKey].totalTarget += target;
            groups[groupKey].questCount += 1;
            if (isDone) groups[groupKey].completedCount += 1;
            
            // If any quest in group is urgent, mark group as urgent
            if (isUrgent) groups[groupKey].isUrgent = true;
            // Update min days left
            groups[groupKey].daysLeft = Math.min(groups[groupKey].daysLeft, daysLeft);

            grandTotalCurrent += cappedCurrent;
            grandTotalTarget += target;
        });

        // 3. Convert to Array & Sort
        const list = Object.values(groups).map(g => {
            const percent = g.totalTarget > 0 ? Math.round((g.totalCurrent / g.totalTarget) * 100) : 0;
            return { ...g, percent };
        }).sort((a, b) => {
            // Urgent first
            if (a.isUrgent !== b.isUrgent) return a.isUrgent ? -1 : 1;
            // Then by lowest percent (Work needed)
            if (a.percent !== b.percent) return a.percent - b.percent;
            return 0;
        });

        const overallPercent = grandTotalTarget > 0 ? Math.round((grandTotalCurrent / grandTotalTarget) * 100) : 0;

        return { majorQuests: list, totalPercent: overallPercent };

    }, [quests, tasks]);

    const activeGroupsCount = majorQuests.length;
    const topQuests = majorQuests.slice(0, 3);
    const completedCount = majorQuests.filter(q => q.percent >= 100).length;

    // Find the most urgent quest group
    const urgentQuest = useMemo(() => {
        return [...majorQuests]
            .filter(q => q.percent < 100)
            .sort((a, b) => a.daysLeft - b.daysLeft)[0];
    }, [majorQuests]);

    // --- Empty State ---
    if (activeGroupsCount === 0) {
        return (
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => onNavigate('WEEKLY')}
                className="bg-white rounded-[3rem] border-2 border-dashed border-indigo-100 p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-indigo-50/30 transition-all h-full min-h-[350px] group relative overflow-hidden"
            >
                <div className="absolute inset-0 bg-indigo-50/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="w-20 h-20 bg-white border-4 border-indigo-50 rounded-full flex items-center justify-center mb-6 text-indigo-300 group-hover:scale-110 group-hover:border-indigo-200 transition-all shadow-sm">
                    <Target className="w-10 h-10" />
                </div>
                <h3 className="font-bold text-gray-700 text-lg">ไม่มีภารกิจในสัปดาห์นี้</h3>
                <p className="text-sm text-gray-400 mt-2 max-w-[200px] leading-relaxed">
                    ภารกิจเดิมหมดเวลา หรือยังไม่ได้สร้างภารกิจใหม่
                </p>
                <button className="mt-6 px-6 py-3 bg-indigo-600 text-white rounded-2xl text-sm font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95 group-hover:-translate-y-1">
                    + สร้างภารกิจใหม่
                </button>
            </motion.div>
        );
    }

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -5 }}
            onClick={() => onNavigate('WEEKLY')}
            className="bg-white rounded-[3rem] shadow-xl border border-white/60 relative overflow-hidden flex flex-col h-full group hover:shadow-indigo-200/40 transition-all duration-500 min-h-[400px] cursor-pointer"
        >
            {/* --- TOP SECTION: VIBRANT HEADER --- */}
            <div className="p-8 pb-6 relative overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-purple-50 text-slate-800 border-b border-slate-100">
                {/* Animated Background Elements */}
                <motion.div 
                    animate={{ 
                        scale: [1, 1.2, 1],
                        rotate: [0, 90, 0],
                        opacity: [0.1, 0.2, 0.1]
                    }}
                    transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                    className="absolute -top-10 -right-10 w-64 h-64 bg-indigo-400 rounded-full blur-[80px] pointer-events-none"
                />
                <motion.div 
                    animate={{ 
                        scale: [1, 1.3, 1],
                        x: [0, 20, 0],
                        opacity: [0.05, 0.1, 0.05]
                    }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -bottom-10 -left-10 w-48 h-48 bg-purple-400 rounded-full blur-[60px] pointer-events-none"
                />
                
                <div className="relative z-10 flex justify-between items-start mb-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <motion.div 
                                animate={{ rotate: [0, 15, -15, 0] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                className="bg-indigo-500/20 backdrop-blur-md p-1.5 rounded-lg border border-indigo-500/30"
                            >
                                <Layers className="w-4 h-4 text-indigo-500" />
                            </motion.div>
                            <span className="text-indigo-600 text-[11px] font-bold uppercase tracking-[0.2em]">Weekly Quests</span>
                        </div>
                        <h3 className="text-4xl font-bold tracking-tighter leading-none text-slate-900">
                            {totalPercent}<span className="text-xl text-indigo-400/60">%</span>
                        </h3>
                        <p className="text-slate-500 text-[11px] font-bold mt-1 uppercase tracking-widest flex items-center gap-1">
                            <Zap className="w-3 h-3" /> Overall Squad Progress
                        </p>
                    </div>

                    <div className="text-right">
                        <motion.div 
                            whileHover={{ scale: 1.1 }}
                            className="bg-white rounded-2xl p-4 border border-slate-200 shadow-lg"
                        >
                            <div className="flex items-center justify-end gap-1.5 text-2xl font-bold text-indigo-600 leading-none tracking-tighter">
                                <Target className="w-5 h-5 text-indigo-500" />
                                {activeGroupsCount}
                            </div>
                            <p className="text-[9px] text-slate-400 uppercase font-bold tracking-widest mt-1">Active Groups</p>
                        </motion.div>
                    </div>
                </div>

                {/* Aggregate Progress Bar */}
                <div className="relative pt-2">
                    <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-2">
                            <div className="flex -space-x-2">
                                {[...Array(Math.min(3, completedCount || 1))].map((_, i) => (
                                    <div key={i} className="w-5 h-5 rounded-full border-2 border-slate-800 bg-indigo-500 flex items-center justify-center">
                                        <Star className="w-2 h-2 text-white fill-white" />
                                    </div>
                                ))}
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                {completedCount} Groups Completed
                            </span>
                        </div>
                        <div className="text-[10px] font-bold text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                            {totalPercent}% Total
                        </div>
                    </div>
                    <div className="h-4 bg-slate-100 rounded-full overflow-hidden p-1 border border-slate-200/50 backdrop-blur-sm">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${totalPercent}%` }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full shadow-[0_0_20px_rgba(99,102,241,0.4)] relative"
                        >
                            <motion.div 
                                animate={{ x: ["0%", "100%"], opacity: [0, 1, 0] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                className="absolute top-0 left-0 h-full w-20 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                            />
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* --- MIDDLE SECTION: MOTIVATIONAL & LIST --- */}
            <div className="p-8 flex-1 flex flex-col gap-6 bg-white">
                {urgentQuest && (
                    <motion.div 
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex items-center justify-between group/urgent overflow-hidden relative"
                    >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-rose-200/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                        <div className="flex items-center gap-4 relative z-10">
                            <div className="w-12 h-12 bg-rose-500 rounded-xl flex items-center justify-center shadow-lg shadow-rose-200 animate-bounce">
                                <Flame className="w-6 h-6 text-white fill-white" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-rose-600 uppercase tracking-tight">รีบหน่อยทีม!</h4>
                                <p className="text-xs font-bold text-rose-400">
                                    {urgentQuest.title} เหลืออีก <span className="text-rose-600 font-bold">{urgentQuest.daysLeft} วัน</span>
                                </p>
                            </div>
                        </div>
                        <ArrowUpRight className="w-5 h-5 text-rose-300 group-hover/urgent:text-rose-500 group-hover/urgent:translate-x-1 group-hover/urgent:-translate-y-1 transition-all" />
                    </motion.div>
                )}

                <div className="space-y-3">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">Active Groups</span>
                        <span className="text-[10px] font-bold text-slate-300 italic">Top 3 Priority</span>
                    </div>
                    
                    <AnimatePresence>
                        {topQuests.map((group, index) => {
                            const isDone = group.percent >= 100;
                            const isUrgent = group.isUrgent && !isDone;
                            return (
                                <motion.div 
                                    key={group.id} 
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="group/item flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100 hover:shadow-sm"
                                >
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 shadow-sm ${
                                        isDone 
                                            ? 'bg-emerald-500 text-white shadow-emerald-100' 
                                            : isUrgent
                                                ? 'bg-rose-500 text-white shadow-rose-100'
                                                : 'bg-slate-100 text-slate-400 group-hover/item:bg-white group-hover/item:scale-110'
                                    }`}>
                                        {isDone ? <CheckCircle2 className="w-6 h-6" /> : isUrgent ? <AlertTriangle className="w-6 h-6" /> : <Folder className="w-6 h-6" />}
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center mb-2">
                                            <h4 className={`text-sm font-bold truncate pr-4 ${isDone ? 'text-emerald-600' : isUrgent ? 'text-rose-600' : 'text-slate-800'}`}>
                                                {group.title}
                                            </h4>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-xs font-bold ${isDone ? 'text-emerald-500' : isUrgent ? 'text-rose-500' : 'text-slate-900'}`}>
                                                    {group.percent}%
                                                </span>
                                            </div>
                                        </div>
                                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden p-0.5">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: `${group.percent}%` }}
                                                transition={{ duration: 1, delay: index * 0.1 + 0.5 }}
                                                className={`h-full rounded-full transition-all duration-500 ${
                                                    isDone 
                                                        ? 'bg-emerald-500' 
                                                        : isUrgent
                                                            ? 'bg-rose-500'
                                                            : 'bg-gradient-to-r from-slate-300 to-slate-400 group-hover/item:from-indigo-400 group-hover/item:to-purple-500'
                                                }`}
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            </div>

            {/* --- BOTTOM SECTION: CTA --- */}
            <div className="p-8 pt-0 mt-auto bg-white">
                <motion.div 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-5 bg-gradient-to-r from-indigo-500 to-purple-400 hover:from-indigo-600 hover:to-purple-500 rounded-[2rem] text-white text-sm font-bold transition-all duration-300 flex items-center justify-center gap-3 shadow-2xl shadow-slate-200 group-hover:shadow-indigo-200/50"
                >
                    EXPLORE ALL QUESTS <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </motion.div>
            </div>
        </motion.div>
    );
};

export default QuestOverviewWidget;
