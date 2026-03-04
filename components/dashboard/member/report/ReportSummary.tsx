import React from 'react';
import { Target, Zap, Award, TrendingUp } from 'lucide-react';
import GlassyCard from './GlassyCard';

interface ReportSummaryProps {
    totalCompleted: number;
    productivityRate: number;
    totalXPEarned: number;
    topRole: string;
}

const ReportSummary: React.FC<ReportSummaryProps> = ({ totalCompleted, productivityRate, totalXPEarned, topRole }) => {
    const stats = [
        { 
            label: 'Completed', 
            value: totalCompleted, 
            sub: 'Tasks', 
            icon: <Target className="w-5 h-5" />, 
            color: 'text-indigo-600', 
            bg: 'bg-indigo-50' 
        },
        { 
            label: 'Productivity', 
            value: `${productivityRate}%`, 
            sub: 'Efficiency', 
            icon: <TrendingUp className="w-5 h-5" />, 
            color: 'text-emerald-600', 
            bg: 'bg-emerald-50' 
        },
        { 
            label: 'XP Gained', 
            value: `+${totalXPEarned.toLocaleString()}`, 
            sub: 'Experience', 
            icon: <Zap className="w-5 h-5" />, 
            color: 'text-amber-600', 
            bg: 'bg-amber-50' 
        },
        { 
            label: 'Top Role', 
            value: topRole, 
            sub: 'Specialization', 
            icon: <Award className="w-5 h-5" />, 
            color: 'text-pink-600', 
            bg: 'bg-pink-50' 
        },
    ];

    return (
        <div className="grid grid-cols-4 gap-6 mb-10">
            {stats.map((stat, i) => (
                <GlassyCard key={i} delay={i * 0.1} className="p-6 text-center group">
                    <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner group-hover:scale-110 transition-transform duration-500`}>
                        {stat.icon}
                    </div>
                    <p className="text-4xl font-black text-slate-800 mb-1 tracking-tighter">{stat.value}</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{stat.label}</p>
                    <div className="mt-2 h-1 w-8 bg-slate-100 mx-auto rounded-full group-hover:w-16 transition-all duration-500" />
                </GlassyCard>
            ))}
        </div>
    );
};

export default ReportSummary;
