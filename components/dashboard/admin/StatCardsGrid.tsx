
import React from 'react';
import { ListTodo, Film, MessageCircle, CheckCircle2, LayoutTemplate, ArrowRight, Flame } from 'lucide-react';
import { Task } from '../../../types';
import Skeleton from '../../ui/Skeleton';

interface StatCardsGridProps {
    stats: any[];
    loading: boolean;
    currentTheme: any;
    onCardClick: (title: string, tasks: Task[], theme: string) => void;
    timeRangeLabel: string;
}

// Helper for Icon Mapping
const getIconComponent = (iconName: string) => {
    switch (iconName) {
        case 'list-todo': return ListTodo;
        case 'film': return Film;
        case 'message-circle': return MessageCircle;
        case 'check-circle-2': return CheckCircle2;
        default: return LayoutTemplate;
    }
};

const StatCardsGrid: React.FC<StatCardsGridProps> = ({ stats, loading, currentTheme, onCardClick, timeRangeLabel }) => {
    if (loading) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="bg-white p-5 md:p-6 rounded-[2rem] border border-gray-100 h-32 md:h-40 flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-10 w-10 rounded-2xl" />
                        </div>
                        <div className="flex items-end justify-between">
                             <Skeleton className="h-12 w-16" />
                             <Skeleton className="h-6 w-20 rounded-lg" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {stats.map((stat) => {
                const colorKey = stat.colorTheme || 'slate';
                const Icon = getIconComponent(stat.icon || 'circle');
                const styles = currentTheme.getStyle(colorKey); // New Styles from Hook
                const hasUrgent = stat.urgentCount > 0;
                
                // Color Mapping for Icons (to ensure visibility on white bg)
                const iconColorMap: Record<string, string> = {
                    'blue': 'text-blue-500',
                    'green': 'text-emerald-500',
                    'orange': 'text-orange-500',
                    'red': 'text-red-500',
                    'purple': 'text-purple-500',
                    'pink': 'text-pink-500',
                    'indigo': 'text-indigo-500',
                    'slate': 'text-slate-500',
                    'amber': 'text-amber-500',
                    'teal': 'text-teal-500'
                };
                const iconColor = iconColorMap[colorKey] || 'text-slate-400';

                return (
                    <div 
                        key={stat.id}
                        onClick={() => onCardClick(`${stat.label} (${timeRangeLabel})`, stat.tasks, colorKey)}
                        className={`
                            relative overflow-hidden group cursor-pointer transition-all duration-300 active:scale-95
                            p-5 md:p-6 rounded-[1.8rem] flex flex-col justify-between h-36 md:h-44
                            ${styles.container}
                            ${hasUrgent ? 'ring-2 ring-red-100 border-red-200' : ''}
                        `}
                    >
                        {/* Floating Icon Background */}
                        <div className={`absolute -right-4 -top-4 p-4 rounded-full opacity-[0.07] transform group-hover:scale-125 group-hover:rotate-12 transition-transform duration-500 ${iconColor.replace('text-', 'bg-')}`}>
                             <Icon className="w-24 h-24" />
                        </div>

                        {/* 🔥 Fire Notification Badge */}
                        {hasUrgent && (
                        <div className="
                            absolute top-3 right-3 
                            bg-red-500 text-white 
                            rounded-full 
                            p-1 
                            border-2 border-white 
                            z-20 
                            flex items-center justify-center 
                            min-w-[26px] h-[26px]
                            animate-bounce
                            shadow-lg shadow-red-400
                        ">
                            <Flame
                            className="
                                w-3 h-3 
                                fill-white 
                                animate-fire
                                drop-shadow-[0_0_6px_rgba(255,80,0,0.9)]
                            "
                            />

                            <span
                            className="
                                text-[13px] font-bold ml-0.5
                                animate-pulse-fast
                            "
                            >
                            {stat.urgentCount}
                            </span>
                        </div>
                        )}


                        <div className="relative z-10">
                            <p className={`text-xs md:text-sm tracking-wide font-bold uppercase opacity-80 ${iconColor}`}>
                                {stat.label}
                            </p>
                        </div>
                        
                        <div className="relative z-10 mt-auto">
                            <div className="flex items-baseline gap-2">
                                <p className={`text-5xl font-black tracking-tight leading-none ${styles.textCount}`}>
                                    {stat.count}
                                </p>
                            </div>
                            
                            <div className="flex items-center mt-2 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0 duration-300">
                                <span className="text-[10px] font-bold text-gray-400 flex items-center bg-gray-50 px-2 py-0.5 rounded-md">
                                    ดูรายการ <ArrowRight className="w-3 h-3 ml-1" />
                                </span>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default StatCardsGrid;
