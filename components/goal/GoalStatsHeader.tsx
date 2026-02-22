
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
        <div className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm flex items-start justify-between relative overflow-hidden group hover:shadow-xl hover:shadow-indigo-50 transition-all duration-500">
            {/* Watermark Icon - Bottom Right Corner */}
            <div className={`absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 group-hover:scale-110 group-hover:-rotate-12 transition-all duration-700 ${color}`}>
                <Icon className="w-24 h-24" />
            </div>
            
            <div className="relative z-10">
                <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2">{label}</p>
                <h3 className="text-3xl font-black text-gray-800 tracking-tighter">{value}</h3>
                {subtext && <p className="text-[10px] text-gray-400 mt-1.5 font-bold flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                    {subtext}
                </p>}
            </div>

            <div className={`relative z-10 p-3 rounded-2xl ${color.replace('text-', 'bg-').replace('600', '50').replace('500', '50')} ${color} shadow-inner border border-white/50`}>
                <Icon className="w-5 h-5" />
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
