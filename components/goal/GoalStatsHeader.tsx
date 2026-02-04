
import React from 'react';
import { Goal } from '../../types';
import { Trophy, Target, TrendingUp, CheckCircle2 } from 'lucide-react';

interface GoalStatsHeaderProps {
    goals: Goal[];
}

const GoalStatsHeader: React.FC<GoalStatsHeaderProps> = ({ goals }) => {
    const activeGoals = goals.filter(g => !g.isArchived);
    const completedGoals = activeGoals.filter(g => g.currentValue >= g.targetValue);
    
    const totalProgress = activeGoals.reduce((acc, curr) => acc + (curr.currentValue / curr.targetValue), 0);
    const avgProgress = activeGoals.length > 0 ? Math.round((totalProgress / activeGoals.length) * 100) : 0;

    const StatBox = ({ label, value, icon: Icon, color, subtext }: any) => (
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-start justify-between relative overflow-hidden group hover:shadow-md transition-all">
            <div className={`absolute right-0 top-0 p-4 opacity-10 group-hover:scale-110 transition-transform ${color.replace('text-', 'text-')}`}>
                <Icon className="w-16 h-16" />
            </div>
            <div className="relative z-10">
                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">{label}</p>
                <h3 className="text-3xl font-black text-gray-800">{value}</h3>
                {subtext && <p className="text-xs text-gray-400 mt-1 font-medium">{subtext}</p>}
            </div>
            <div className={`p-3 rounded-xl ${color.replace('text-', 'bg-').replace('600', '50')} ${color}`}>
                <Icon className="w-6 h-6" />
            </div>
        </div>
    );

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatBox 
                label="Active Goals" 
                value={activeGoals.length} 
                icon={Target} 
                color="text-indigo-600" 
                subtext="เป้าหมายที่กำลังดำเนินการ"
            />
            <StatBox 
                label="Completion Rate" 
                value={`${Math.min(100, avgProgress)}%`} 
                icon={TrendingUp} 
                color="text-blue-600" 
                subtext="ความคืบหน้าเฉลี่ย"
            />
            <StatBox 
                label="Completed" 
                value={completedGoals.length} 
                icon={CheckCircle2} 
                color="text-emerald-600" 
                subtext="เป้าหมายที่สำเร็จแล้ว"
            />
            <StatBox 
                label="Total Rewards" 
                value={activeGoals.reduce((sum, g) => sum + g.rewardXp, 0).toLocaleString()} 
                icon={Trophy} 
                color="text-amber-500" 
                subtext="XP Pool รวมทั้งหมด"
            />
        </div>
    );
};

export default GoalStatsHeader;
