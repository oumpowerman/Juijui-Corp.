
import React, { useMemo } from 'react';
import { Goal, ViewMode, Platform } from '../../../types';
import { TrendingUp, ChevronRight, Star, Coins, Trophy, CheckCircle2 } from 'lucide-react';
import { PLATFORM_ICONS } from '../../../constants';
import { differenceInDays } from 'date-fns';

interface GoalOverviewWidgetProps {
    goals: Goal[];
    onNavigate: (view: ViewMode) => void;
}

const GoalOverviewWidget: React.FC<GoalOverviewWidgetProps> = ({ goals, onNavigate }) => {
    
    // --- Logic: Process Data ---
    const activeGoals = useMemo(() => {
        // Filter active only
        const filtered = goals.filter(g => !g.isArchived);
        
        // Calculate percentages
        const mapped = filtered.map(g => {
            const percent = Math.min(100, Math.round((g.currentValue / g.targetValue) * 100));
            const daysLeft = differenceInDays(new Date(g.deadline), new Date());
            return { ...g, percent, daysLeft };
        });

        // Sort: Highest Percent > Closest Deadline
        return mapped.sort((a, b) => {
            if (b.percent !== a.percent) return b.percent - a.percent;
            return a.daysLeft - b.daysLeft;
        });
    }, [goals]);

    const topGoals = activeGoals.slice(0, 3);
    const totalGoals = activeGoals.length;
    
    // Calculate Total Potential Rewards
    const totalPotentialXP = activeGoals.reduce((sum, g) => sum + (g.percent < 100 ? g.rewardXp : 0), 0);
    const completedCount = activeGoals.filter(g => g.percent >= 100).length;

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
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-white/60 relative overflow-hidden flex flex-col h-full group hover:shadow-xl hover:shadow-emerald-100 transition-all duration-500 min-h-[300px]">
            
            {/* Header / Banner */}
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-5 pb-8 relative shrink-0 text-white">
                {/* Decor */}
                <div className="absolute bottom-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full blur-3xl translate-x-10 translate-y-10 pointer-events-none"></div>
                <div className="absolute top-0 left-0 w-16 h-16 bg-white opacity-10 rounded-full blur-2xl -translate-x-5 -translate-y-5 pointer-events-none"></div>

                <div className="relative z-10 flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-2xl text-white shadow-inner border border-white/10">
                            <Trophy className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black tracking-tight leading-none">เป้าหมาย</h3>
                            <p className="text-emerald-100 text-xs font-bold uppercase tracking-wider mt-1">Squad Goals</p>
                        </div>
                    </div>
                    
                    {/* Stats */}
                    <div className="text-right">
                        <div className="flex items-center justify-end gap-1 font-black text-2xl leading-none tracking-tighter">
                            <span className="text-yellow-300 text-lg animate-pulse">✨</span>
                            {totalPotentialXP.toLocaleString()}
                        </div>
                        <p className="text-[8px] text-emerald-100 uppercase font-bold tracking-widest mt-1">XP Pool</p>
                    </div>
                </div>

                {/* Progress Mini Bar */}
                <div className="absolute bottom-0 left-0 w-full px-5 pb-3 flex items-center justify-between text-[10px] font-bold text-emerald-100/80 z-20">
                     <span>สำเร็จแล้ว {completedCount}/{totalGoals}</span>
                     <div className="w-24 h-1.5 bg-black/20 rounded-full overflow-hidden backdrop-blur-sm">
                         <div className="h-full bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.8)]" style={{ width: `${(completedCount/totalGoals)*100}%` }}></div>
                     </div>
                </div>
            </div>

            {/* List Body */}
            <div className="p-3 flex-1 flex flex-col gap-2 overflow-y-auto">
                {topGoals.map((goal) => {
                    const PlatformIcon = PLATFORM_ICONS[goal.platform] || PLATFORM_ICONS['OTHER'];
                    const isDone = goal.percent >= 100;
                    
                    // Progress Color Logic
                    let progressColor = 'bg-indigo-500';
                    if (goal.percent >= 100) progressColor = 'bg-green-500';
                    else if (goal.percent >= 70) progressColor = 'bg-emerald-400';
                    else if (goal.percent >= 30) progressColor = 'bg-yellow-400';
                    else progressColor = 'bg-orange-400';

                    return (
                        <div 
                            key={goal.id} 
                            className="bg-white p-3 rounded-2xl border border-gray-100 flex items-center gap-3 shadow-sm hover:border-emerald-200 transition-colors relative overflow-hidden group/item"
                        >
                            {/* Icon Box */}
                            <div className={`
                                w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border z-10 transition-colors
                                ${isDone ? 'bg-green-50 border-green-100 text-green-600' : 'bg-gray-50 border-gray-100 text-gray-400 group-hover/item:text-emerald-500 group-hover/item:bg-emerald-50'}
                            `}>
                                {isDone ? <CheckCircle2 className="w-5 h-5" /> : <PlatformIcon className="w-5 h-5" />}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0 z-10">
                                <div className="flex justify-between items-center mb-1.5">
                                    <h4 className="text-xs font-bold text-gray-700 truncate mr-2" title={goal.title}>
                                        {goal.title}
                                    </h4>
                                    
                                    {/* Reward Badge or Days Left */}
                                    {isDone ? (
                                        <span className="text-[9px] font-black text-green-600 bg-green-50 px-1.5 py-0.5 rounded border border-green-100">Success!</span>
                                    ) : goal.rewardXp > 0 ? (
                                        <span className="flex items-center text-[9px] font-bold text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-100">
                                            <Star className="w-2.5 h-2.5 mr-0.5 fill-orange-500" /> +{goal.rewardXp}
                                        </span>
                                    ) : (
                                        <span className="text-[9px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">{goal.daysLeft} วัน</span>
                                    )}
                                </div>
                                
                                {/* Bar & Numbers */}
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full rounded-full transition-all duration-1000 ${progressColor}`} 
                                            style={{ width: `${goal.percent}%` }}
                                        ></div>
                                    </div>
                                    <span className="text-[9px] font-bold text-gray-400 min-w-[28px] text-right">
                                        {goal.percent}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {/* View All Button */}
                <button 
                    onClick={() => onNavigate('GOALS')}
                    className="mt-auto w-full py-3 bg-gray-50 hover:bg-emerald-50 text-gray-500 hover:text-emerald-600 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1 group/btn"
                >
                    ดูเป้าหมายทั้งหมด ({totalGoals}) <ChevronRight className="w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform" />
                </button>
            </div>
        </div>
    );
};

export default GoalOverviewWidget;
