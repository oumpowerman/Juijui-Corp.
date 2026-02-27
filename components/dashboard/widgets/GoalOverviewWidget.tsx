
import React, { useMemo } from 'react';
import { Goal, ViewMode } from '../../../types';
import { TrendingUp, ChevronRight, Star, Trophy, CheckCircle2, Target, Zap, Rocket, Flame, ArrowUpRight } from 'lucide-react';
import { PLATFORM_ICONS } from '../../../constants';
import { differenceInDays, format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { th } from 'date-fns/locale';

interface GoalOverviewWidgetProps {
    goals: Goal[];
    onNavigate: (view: ViewMode) => void;
}

const GoalOverviewWidget: React.FC<GoalOverviewWidgetProps> = ({ goals, onNavigate }) => {
    
    // --- Logic: Process Data ---
    const activeGoals = useMemo(() => {
        const filtered = goals.filter(g => !g.isArchived);
        const mapped = filtered.map(g => {
            const percent = Math.min(100, Math.round((g.currentValue / g.targetValue) * 100));
            const daysLeft = differenceInDays(new Date(g.deadline), new Date());
            return { ...g, percent, daysLeft };
        });

        return mapped.sort((a, b) => {
            if (b.percent !== a.percent) return b.percent - a.percent;
            return a.daysLeft - b.daysLeft;
        });
    }, [goals]);

    const topGoals = activeGoals.slice(0, 3);
    const totalGoals = activeGoals.length;
    
    // Aggregate Progress Calculation (Sum of Current / Sum of Target)
    const { totalCurrent, totalTarget, overallPercent } = useMemo(() => {
        const current = activeGoals.reduce((sum, g) => sum + g.currentValue, 0);
        const target = activeGoals.reduce((sum, g) => sum + g.targetValue, 0);
        const percent = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
        return { totalCurrent: current, totalTarget: target, overallPercent: percent };
    }, [activeGoals]);

    const totalPotentialXP = activeGoals.reduce((sum, g) => sum + (g.percent < 100 ? g.rewardXp : 0), 0);
    const completedCount = activeGoals.filter(g => g.percent >= 100).length;

    // Find the most urgent goal
    const urgentGoal = useMemo(() => {
        return [...activeGoals]
            .filter(g => g.percent < 100)
            .sort((a, b) => a.daysLeft - b.daysLeft)[0];
    }, [activeGoals]);

    // --- Empty State ---
    if (goals.length === 0) {
        return (
            <div 
                onClick={() => onNavigate('GOALS')}
                className="bg-white rounded-[2.5rem] border border-dashed border-emerald-200 p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-emerald-50/30 h-full min-h-[280px] group transition-all"
            >
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4 text-emerald-500 group-hover:scale-110 transition-transform">
                    <TrendingUp className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-gray-700">ยังไม่มีเป้าหมาย</h3>
                <p className="text-xs text-gray-400 mt-1">ตั้งเป้าหมายเพื่อรับ XP และรางวัล</p>
                <button className="mt-4 px-5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-emerald-700 transition-colors">
                    + สร้างเป้าหมาย
                </button>
            </div>
        );
    }

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -5 }}
            onClick={() => onNavigate('GOALS')}
            className="bg-white rounded-[3rem] shadow-xl border border-white/60 relative overflow-hidden flex flex-col h-full group hover:shadow-emerald-200/40 transition-all duration-500 min-h-[400px] cursor-pointer"
        >
            {/* --- TOP SECTION: VIBRANT HEADER --- */}
            <div className="p-8 pb-6 relative overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-emerald-50 text-slate-800 border-b border-slate-100">
                {/* Animated Background Elements */}
                <motion.div 
                    animate={{ 
                        scale: [1, 1.2, 1],
                        rotate: [0, 90, 0],
                        opacity: [0.1, 0.2, 0.1]
                    }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                    className="absolute -top-10 -right-10 w-64 h-64 bg-emerald-400 rounded-full blur-[80px] pointer-events-none"
                />
                <motion.div 
                    animate={{ 
                        scale: [1, 1.3, 1],
                        x: [0, 20, 0],
                        opacity: [0.05, 0.1, 0.05]
                    }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -bottom-10 -left-10 w-48 h-48 bg-blue-400 rounded-full blur-[60px] pointer-events-none"
                />
                
                <div className="relative z-10 flex justify-between items-start mb-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <motion.div 
                                animate={{ rotate: [0, 15, -15, 0] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="bg-emerald-500/20 backdrop-blur-md p-1.5 rounded-lg border border-emerald-500/30"
                            >
                                <Trophy className="w-4 h-4 text-emerald-400" />
                            </motion.div>
                            <span className="text-indigo-600 text-[11px] font-bold uppercase tracking-[0.2em]">Squad Mission</span>
                        </div>
                        <h3 className="text-4xl font-bold tracking-tighter leading-none text-slate-900">
                            {overallPercent}<span className="text-xl text-emerald-400/60">%</span>
                        </h3>
                        <p className="text-slate-500 text-[11px] font-bold mt-1 uppercase tracking-widest flex items-center gap-1">
                            <Rocket className="w-3 h-3" /> Total Team Progress
                        </p>
                    </div>

                    <div className="text-right">
                        <motion.div 
                            whileHover={{ scale: 1.1 }}
                            className="bg-white rounded-2xl p-4 border border-slate-200 shadow-lg"
                        >
                            <div className="flex items-center justify-end gap-1.5 text-2xl font-bold text-amber-500 leading-none tracking-tighter">
                                <Zap className="w-5 h-5 text-amber-500" />
                                {totalPotentialXP.toLocaleString()}
                            </div>
                            <p className="text-[9px] text-slate-400 uppercase font-bold tracking-widest mt-1">XP POOL</p>
                        </motion.div>
                    </div>
                </div>

                {/* Aggregate Progress Bar - Large & Animated */}
                <div className="relative pt-2">
                    <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-2">
                            <div className="flex -space-x-2">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="w-5 h-5 rounded-full border-2 border-slate-800 bg-emerald-500 flex items-center justify-center">
                                        <Star className="w-2 h-2 text-white fill-white" />
                                    </div>
                                ))}
                            </div>
                            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                                {completedCount} Goals Cleared
                            </span>
                        </div>
                        <div className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20">
                            {totalCurrent.toLocaleString()} / {totalTarget.toLocaleString()}
                        </div>
                    </div>
                    <div className="h-4 bg-white/5 rounded-full overflow-hidden p-1 border border-white/10 backdrop-blur-sm rounded-t-[3rem]">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${overallPercent}%` }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            className="h-full bg-gradient-to-r from-emerald-400 via-teal-400 to-blue-500 rounded-full shadow-[0_0_20px_rgba(52,211,153,0.6)] relative"
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
            <div className="p-8 flex-1 flex flex-col gap-6">
                {urgentGoal && (
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
                                <h4 className="text-sm font-bold text-rose-600 uppercase tracking-tight">ลุยเลยทีม!</h4>
                                <p className="text-xs font-bold text-rose-400">
                                    {urgentGoal.title} เหลืออีก <span className="text-rose-600 font-bold">{urgentGoal.daysLeft} วัน</span>
                                </p>
                            </div>
                        </div>
                        <ArrowUpRight className="w-5 h-5 text-rose-300 group-hover/urgent:text-rose-500 group-hover/urgent:translate-x-1 group-hover/urgent:-translate-y-1 transition-all" />
                    </motion.div>
                )}

                <div className="space-y-3">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">Active Missions</span>
                        <span className="text-[10px] font-bold text-slate-300 italic">Top 3 Priority</span>
                    </div>
                    
                    <AnimatePresence>
                        {topGoals.map((goal, index) => {
                            const isDone = goal.percent >= 100;
                            return (
                                <motion.div 
                                    key={goal.id} 
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="group/item flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100 hover:shadow-sm"
                                >
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 shadow-sm ${
                                        isDone ? 'bg-emerald-500 text-white shadow-emerald-100' : 'bg-slate-100 text-slate-400 group-hover/item:bg-white group-hover/item:scale-110'
                                    }`}>
                                        {isDone ? <CheckCircle2 className="w-6 h-6" /> : <TrendingUp className="w-6 h-6" />}
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center mb-2">
                                            <h4 className="text-sm font-bold text-slate-800 truncate pr-4">{goal.title}</h4>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-xs font-bold ${isDone ? 'text-emerald-500' : 'text-slate-900'}`}>
                                                    {goal.percent}%
                                                </span>
                                            </div>
                                        </div>
                                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden p-0.5">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: `${goal.percent}%` }}
                                                transition={{ duration: 1, delay: index * 0.1 + 0.5 }}
                                                className={`h-full rounded-full transition-all duration-500 ${
                                                    isDone ? 'bg-emerald-500' : 'bg-gradient-to-r from-slate-300 to-slate-400 group-hover/item:from-emerald-400 group-hover/item:to-teal-500'
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
            <div className="p-8 pt-0 mt-auto">
                <motion.div 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-5 bg-gradient-to-r from-indigo-500 to-emerald-400 hover:from-indigo-600 hover:to-emerald-500 rounded-[2rem] text-white text-sm font-bold transition-all duration-300 flex items-center justify-center gap-3 shadow-2xl shadow-slate-200 group-hover:shadow-emerald-200/50"
                >
                    EXPLORE ALL MISSIONS <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </motion.div>
            </div>
        </motion.div>
    );
};

export default GoalOverviewWidget;
