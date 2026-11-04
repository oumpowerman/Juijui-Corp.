
import React, { useMemo } from 'react';
import { Goal, ViewMode } from '../../../types';
import { TrendingUp, ChevronRight, Star, Trophy, CheckCircle2, Zap, Rocket, Flame, ArrowUpRight, Sparkles } from 'lucide-react';
import { differenceInDays } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

interface GoalOverviewWidgetProps {
    goals: Goal[];
    onNavigate: (view: ViewMode) => void;
}

const GoalOverviewWidget: React.FC<GoalOverviewWidgetProps> = ({ goals, onNavigate }) => {
    
    // --- Logic: Process Data ---
    const activeGoals = useMemo(() => {
        const now = new Date();
        const filtered = goals.filter(g => {
            if (g.isArchived) return false;
            
            // Define Failed status (consistent with GoalView)
            const isCompleted = g.currentValue >= g.targetValue;
            const isFailed = !isCompleted && now > new Date(g.deadline);
            
            // Goals that have not failed remain active for aggregate metrics
            return !isFailed;
        });

        const mapped = filtered.map(g => {
            const percent = Math.min(100, Math.round((g.currentValue / g.targetValue) * 100));
            const daysLeft = differenceInDays(new Date(g.deadline), new Date());
            return { ...g, percent, daysLeft };
        });

        return mapped;
    }, [goals]);

    // In-progress missions (percent < 100) specifically for "Active Missions" backlog
    const inProgressGoals = useMemo(() => {
        return activeGoals
            .filter(g => g.percent < 100)
            .sort((a, b) => {
                if (b.percent !== a.percent) return b.percent - a.percent; // closest to 100% first
                return a.daysLeft - b.daysLeft; // then earliest deadline
            });
    }, [activeGoals]);

    // Top 3 priority in-progress missions
    const topGoals = inProgressGoals.slice(0, 3);
    
    // Aggregate Progress Calculation (Sum of Current / Sum of Target) across all active squad missions
    const { totalCurrent, totalTarget, overallPercent } = useMemo(() => {
        const current = activeGoals.reduce((sum, g) => sum + g.currentValue, 0);
        const target = activeGoals.reduce((sum, g) => sum + g.targetValue, 0);
        const percent = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
        return { totalCurrent: current, totalTarget: target, overallPercent: percent };
    }, [activeGoals]);

    const totalPotentialXP = inProgressGoals.reduce((sum, g) => sum + g.rewardXp, 0);
    const completedCount = activeGoals.filter(g => g.percent >= 100).length;

    // Find the most urgent in-progress goal
    const urgentGoal = useMemo(() => {
        return [...inProgressGoals]
            .sort((a, b) => a.daysLeft - b.daysLeft)[0];
    }, [inProgressGoals]);

    // --- Empty State (No Goals created yet) ---
    if (goals.length === 0) {
        return (
            <div 
                onClick={() => onNavigate('GOALS')}
                className="bg-stone-50/60 rounded-[2.5rem] border border-dashed border-emerald-200/80 p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-emerald-50/40 h-full min-h-[280px] group transition-all"
            >
                <div className="w-16 h-16 bg-emerald-100/70 rounded-full flex items-center justify-center mb-4 text-emerald-600 group-hover:scale-110 transition-transform shadow-sm">
                    <TrendingUp className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-stone-800">ยังไม่มีเป้าหมาย</h3>
                <p className="text-xs text-stone-400 mt-1">ตั้งเป้าหมายเพื่อรับ XP และรางวัลของทีม</p>
                <button className="mt-4 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-sm hover:bg-emerald-700 transition-colors">
                    + สร้างเป้าหมาย
                </button>
            </div>
        );
    }

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4 }}
            onClick={() => onNavigate('GOALS')}
            className="bg-white rounded-[2.5rem] sm:rounded-[3rem] shadow-sm hover:shadow-md border border-stone-200/70 relative overflow-hidden flex flex-col h-full group transition-all duration-300 min-h-[400px] cursor-pointer"
        >
            {/* --- TOP SECTION: LIGHT PASTEL EARTH-TONE HEADER --- */}
            <div className="p-6 sm:p-8 pb-6 relative overflow-hidden bg-gradient-to-br from-emerald-50/50 via-stone-50/40 to-teal-50/30 text-stone-800 border-b border-stone-100">
                {/* Subtle Pastel Ambient Orbs */}
                <div className="absolute -top-12 -right-12 w-56 h-56 bg-emerald-200/25 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-amber-100/30 rounded-full blur-3xl pointer-events-none" />
                
                <div className="relative z-10 flex justify-between items-start mb-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="bg-emerald-100/80 p-1.5 rounded-lg border border-emerald-200/60 shadow-xs">
                                <Trophy className="w-4 h-4 text-emerald-700" />
                            </div>
                            <span className="text-emerald-800 text-[11px] font-bold uppercase tracking-[0.18em]">Squad Mission</span>
                        </div>
                        <h3 className="text-4xl font-bold tracking-tight leading-none text-stone-900">
                            {overallPercent}<span className="text-2xl text-emerald-600/70 font-semibold">%</span>
                        </h3>
                        <p className="text-stone-500 text-[11px] font-semibold mt-1 uppercase tracking-wider flex items-center gap-1.5">
                            <Rocket className="w-3.5 h-3.5 text-emerald-600" /> Total Team Progress
                        </p>
                    </div>

                    <div className="text-right">
                        <div className="bg-white/90 backdrop-blur-sm rounded-2xl px-4 py-3 border border-stone-200/70 shadow-xs">
                            <div className="flex items-center justify-end gap-1.5 text-xl font-bold text-amber-600 leading-none tracking-tight">
                                <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                                {totalPotentialXP.toLocaleString()}
                            </div>
                            <p className="text-[10px] text-stone-400 uppercase font-semibold tracking-wider mt-1">XP Pool</p>
                        </div>
                    </div>
                </div>

                {/* Aggregate Progress Bar */}
                <div className="relative pt-1">
                    <div className="flex justify-between items-center mb-2.5">
                        <div className="flex items-center gap-2">
                            <div className="flex -space-x-1.5">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="w-5 h-5 rounded-full border-2 border-white bg-emerald-400 flex items-center justify-center shadow-xs">
                                        <Star className="w-2.5 h-2.5 text-white fill-white" />
                                    </div>
                                ))}
                            </div>
                            <span className="text-xs font-semibold text-stone-600">
                                {completedCount} Goals Cleared
                            </span>
                        </div>
                        <div className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-xl border border-emerald-200/60">
                            {totalCurrent.toLocaleString()} / {totalTarget.toLocaleString()}
                        </div>
                    </div>

                    <div className="h-3.5 bg-stone-100/90 rounded-full overflow-hidden p-0.5 border border-stone-200/60">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${overallPercent}%` }}
                            transition={{ duration: 1.2, ease: "easeOut" }}
                            className="h-full bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 rounded-full relative"
                        >
                            <motion.div 
                                animate={{ x: ["0%", "100%"], opacity: [0, 0.8, 0] }}
                                transition={{ duration: 2.2, repeat: Infinity, ease: "linear" }}
                                className="absolute top-0 left-0 h-full w-16 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                            />
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* --- MIDDLE SECTION: MOTIVATIONAL & ACTIVE MISSIONS BACKLOG --- */}
            <div className="p-6 sm:p-8 flex-1 flex flex-col gap-5">
                {urgentGoal && (
                    <motion.div 
                        initial={{ x: -16, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        className="bg-amber-50/70 border border-amber-200/70 rounded-2xl p-3.5 sm:p-4 flex items-center justify-between group/urgent overflow-hidden relative"
                    >
                        <div className="flex items-center gap-3.5 relative z-10 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-300/50 flex items-center justify-center shrink-0">
                                <Flame className="w-5 h-5 text-amber-600 fill-amber-500/40" />
                            </div>
                            <div className="min-w-0">
                                <h4 className="text-xs font-bold text-amber-800 uppercase tracking-tight">เร่งมือลุยเลยทีม!</h4>
                                <p className="text-xs text-stone-600 truncate">
                                    {urgentGoal.title} <span className="text-amber-700 font-semibold">(เหลืออีก {urgentGoal.daysLeft} วัน)</span>
                                </p>
                            </div>
                        </div>
                        <ArrowUpRight className="w-4 h-4 text-amber-500 group-hover/urgent:translate-x-0.5 group-hover/urgent:-translate-y-0.5 transition-transform shrink-0" />
                    </motion.div>
                )}

                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-stone-500 uppercase tracking-[0.16em]">Active Missions</span>
                        <span className="text-[11px] font-medium text-stone-400">
                            {inProgressGoals.length > 0 ? `เหลืออีก ${inProgressGoals.length} ภารกิจ` : 'สำเร็จครบแล้ว'}
                        </span>
                    </div>
                    
                    {topGoals.length > 0 ? (
                        <div className="space-y-2.5">
                            <AnimatePresence>
                                {topGoals.map((goal, index) => (
                                    <motion.div 
                                        key={goal.id} 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.08 }}
                                        className="group/item flex items-center gap-3.5 p-3 rounded-2xl bg-stone-50/50 hover:bg-stone-50 transition-all border border-stone-200/50 hover:border-stone-200 hover:shadow-xs"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200/60 flex items-center justify-center shrink-0 text-teal-700 group-hover/item:scale-105 transition-transform">
                                            <TrendingUp className="w-5 h-5" />
                                        </div>
                                        
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-center mb-1.5">
                                                <h4 className="text-xs sm:text-sm font-semibold text-stone-800 truncate pr-3">{goal.title}</h4>
                                                <span className="text-xs font-bold text-teal-700 shrink-0">
                                                    {goal.percent}%
                                                </span>
                                            </div>
                                            <div className="h-2 w-full bg-stone-200/60 rounded-full overflow-hidden p-0.5">
                                                <motion.div 
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${goal.percent}%` }}
                                                    transition={{ duration: 0.9, delay: index * 0.08 + 0.2 }}
                                                    className="h-full rounded-full bg-gradient-to-r from-teal-400 to-emerald-400"
                                                />
                                            </div>
                                            <div className="flex items-center justify-between text-[10px] text-stone-400 mt-1">
                                                <span>{goal.currentValue.toLocaleString()} / {goal.targetValue.toLocaleString()}</span>
                                                <span>เหลืออีก {goal.daysLeft} วัน</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    ) : (
                        /* Celebratory All-Cleared State when no in-progress goals remain */
                        <div className="p-5 bg-gradient-to-br from-emerald-50/60 via-teal-50/30 to-stone-50/40 border border-emerald-200/60 rounded-2xl flex flex-col items-center justify-center text-center py-7">
                            <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mb-2.5 shadow-xs border border-emerald-200/70">
                                <Sparkles className="w-6 h-6" />
                            </div>
                            <h4 className="text-xs sm:text-sm font-bold text-stone-800">ภารกิจที่กำลังทำสำเร็จครบแล้ว! 🎉</h4>
                            <p className="text-[11px] text-stone-500 mt-1 max-w-[260px]">
                                ทุกเป้าหมายปัจจุบันทำได้ครบ 100% เรียบร้อยแล้ว สามารถกดดูประวัติหรือสร้างเป้าหมายใหม่ได้ทันที
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* --- BOTTOM SECTION: LIGHT PASTEL CTA --- */}
            <div className="p-6 sm:p-8 pt-0 mt-auto">
                <motion.div 
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="w-full py-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-700 hover:to-teal-700 rounded-2xl text-white text-xs sm:text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 shadow-sm shadow-emerald-200/60"
                >
                    EXPLORE ALL MISSIONS <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </motion.div>
            </div>
        </motion.div>
    );
};

export default GoalOverviewWidget;
