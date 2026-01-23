
import React from 'react';
import { ListTodo, Film, MessageCircle, CheckCircle2, LayoutTemplate, ArrowRight } from 'lucide-react';
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
                const styles = currentTheme.getStyle(colorKey);
                
                return (
                    <div 
                        key={stat.id}
                        onClick={() => onCardClick(`${stat.label} (${timeRangeLabel})`, stat.tasks, colorKey)}
                        className={`
                            relative overflow-hidden group cursor-pointer transition-all duration-300 active:scale-95
                            p-5 md:p-6 rounded-[2rem] flex flex-col justify-between h-32 md:h-40
                            ${styles.container}
                        `}
                    >
                        {/* Dynamic Decoration from Theme */}
                        {styles.decoration === 'blob' && (
                            <div className={`absolute -right-4 -bottom-4 w-24 h-24 bg-${colorKey}-200/20 rounded-full blur-xl pointer-events-none`} />
                        )}
                        {styles.decoration === 'line' && (
                            <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-${colorKey}-400 to-${colorKey}-200 opacity-50`} />
                        )}
                        {typeof styles.decoration !== 'string' && styles.decoration}

                        <div className="flex justify-between items-start relative z-10">
                            <p className={`text-xs md:text-sm ${styles.label}`}>
                                {stat.label}
                            </p>
                            <div className={`p-2.5 rounded-2xl ${styles.iconBg} group-hover:scale-110 transition-transform duration-300`}>
                                <Icon className="w-5 h-5 md:w-6 md:h-6" />
                            </div>
                        </div>
                        
                        <div className="relative z-10 flex items-end justify-between">
                            <p className={`text-4xl md:text-5xl font-black tracking-tight leading-none ${styles.textCount}`}>
                                {stat.count}
                            </p>
                            <div className="bg-white/50 backdrop-blur-sm px-2 py-1 rounded-lg border border-black/5 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
                                <span className="text-[10px] font-bold text-gray-500 flex items-center">
                                    ดูรายละเอียด <ArrowRight className="w-3 h-3 ml-1" />
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
