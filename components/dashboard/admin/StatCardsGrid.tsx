
import React from 'react';
import { motion } from 'framer-motion';
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="bg-white/50 backdrop-blur-md p-6 rounded-[2.5rem] border border-white/40 h-44 flex flex-col justify-between shadow-sm">
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => {
                const colorKey = stat.colorTheme || 'slate';
                const Icon = getIconComponent(stat.icon || 'circle');
                const styles = currentTheme.getStyle(colorKey);
                const hasUrgent = stat.urgentCount > 0;
                
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
                    <motion.div 
                        key={stat.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ 
                            scale: 1.05, 
                            y: -5,
                            boxShadow: "0 20px 40px rgba(0,0,0,0.05)"
                        }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onCardClick(`${stat.label} (${timeRangeLabel})`, stat.tasks, colorKey)}
                        className={`
                            relative overflow-hidden group cursor-pointer transition-all duration-300
                            p-6 rounded-[2.5rem] flex flex-col justify-between h-44
                            glass-card
                            ${hasUrgent ? 'ring-4 ring-red-500/10 border-red-200/50' : ''}
                        `}
                    >
                        {/* Background Glow */}
                        <div className={`absolute -right-6 -top-6 p-8 rounded-full opacity-[0.15] transform group-hover:scale-150 group-hover:rotate-12 transition-transform duration-700 ${iconColor.replace('text-', 'bg-')}`}>
                             <Icon className="w-24 h-24" />
                        </div>

                        {/* Fire Notification Badge */}
                        {hasUrgent && (
                        <motion.div 
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                            className="
                                absolute top-4 right-4 
                                bg-gradient-to-br from-red-500 to-rose-600 text-white 
                                rounded-full 
                                p-1.5 
                                border-2 border-white 
                                z-20 
                                flex items-center justify-center 
                                min-w-[30px] h-[30px]
                                shadow-lg shadow-red-400/50
                            "
                        >
                            <Flame className="w-3.5 h-3.5 fill-white" />
                            <span className="text-[13px] font-black ml-0.5">{stat.urgentCount}</span>
                        </motion.div>
                        )}

                        <div className="relative z-10">
                            <p className={`text-[14px] font-kanit tracking-[0.2em] font-bold uppercase opacity-60 ${iconColor}`}>
                                {stat.label}
                            </p>
                        </div>
                        
                        <div className="relative z-10 mt-auto">
                            <div className="flex items-baseline gap-2">
                                <motion.p 
                                    initial={{ scale: 0.5 }}
                                    animate={{ scale: 1 }}
                                    className={`text-6xl font-black tracking-tighter leading-none ${styles.textCount || iconColor}`}
                                >
                                    {stat.count}
                                </motion.p>
                            </div>
                            
                            <div className="flex items-center mt-3 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 duration-300">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center bg-white/80 px-3 py-1 rounded-full shadow-sm">
                                    ดูรายการ <ArrowRight className="w-3 h-3 ml-1.5" />
                                </span>
                            </div>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
};

export default StatCardsGrid;
