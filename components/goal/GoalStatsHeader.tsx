
import React from 'react';
import { Goal } from '../../types';
import { Trophy, Target, TrendingUp, CheckCircle2 } from 'lucide-react';

interface GoalStatsHeaderProps {
    goals: Goal[];
}

const GoalStatsHeader: React.FC<GoalStatsHeaderProps> = ({ goals }) => {
    const activeGoals = goals;
    const completedGoals = activeGoals.filter(g => g.currentValue >= g.targetValue);
    
    const totalProgress = activeGoals.reduce((acc, curr) => acc + (curr.currentValue / curr.targetValue), 0);
    const avgProgress = activeGoals.length > 0 ? Math.round((totalProgress / activeGoals.length) * 100) : 0;

    const StatBox = ({ label, value, icon: Icon, color, subtext }: any) => (
        <div className="bg-slate-900/40 backdrop-blur-xl p-6 rounded-[2.5rem] border border-white/10 shadow-2xl shadow-black/40 flex items-start justify-between relative overflow-hidden group hover:shadow-indigo-500/10 hover:border-indigo-500/40 transition-all duration-500">
            {/* Watermark Icon - Bottom Right Corner */}
            <div className={`absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 group-hover:scale-110 group-hover:-rotate-12 transition-all duration-700 ${color}`}>
                <Icon className="w-24 h-24" />
            </div>
            
            <div className="relative z-10">
                <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mb-3">{label}</p>
                <h3 className="text-4xl font-black text-white tracking-tighter italic">{value}</h3>
                {subtext && <p className="text-[10px] text-gray-500 mt-2 font-black uppercase tracking-widest flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${color.replace('text-', 'bg-')} shadow-[0_0_8px_currentColor]`}></span>
                    {subtext}
                </p>}
            </div>

            <div className={`relative z-10 p-3.5 rounded-2xl bg-white/5 ${color} border border-white/10 shadow-xl`}>
                <Icon className="w-6 h-6" />
            </div>
        </div>
    );

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <StatBox 
                label="Active Missions" 
                value={activeGoals.length} 
                icon={Target} 
                color="text-indigo-400" 
                subtext="Operational"
            />
            <StatBox 
                label="Sync Rate" 
                value={`${Math.min(100, avgProgress)}%`} 
                icon={TrendingUp} 
                color="text-blue-400" 
                subtext="Average Progress"
            />
            <StatBox 
                label="Accomplished" 
                value={completedGoals.length} 
                icon={CheckCircle2} 
                color="text-emerald-400" 
                subtext="Missions Complete"
            />
            <StatBox 
                label="XP Potential" 
                value={activeGoals.reduce((sum, g) => sum + g.rewardXp, 0).toLocaleString()} 
                icon={Trophy} 
                color="text-amber-400" 
                subtext="Total Reward Pool"
            />
        </div>
    );
};

export default GoalStatsHeader;
