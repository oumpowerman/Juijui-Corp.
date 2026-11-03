import React, { useEffect, useRef, useState } from 'react';
import { motion, animate } from 'framer-motion';

interface UrgentTasksStatsProps {
    id?: string;
    stats: {
        overdue: number;
        today: number;
        upcoming: number;
    };
    activeFilter: 'ALL' | 'OVERDUE' | 'TODAY' | 'SOON';
    onToggleFilter: (filter: 'ALL' | 'OVERDUE' | 'TODAY' | 'SOON') => void;
}

interface AnimatedCounterProps {
    value: number;
    className?: string;
}

const AnimatedCounter: React.FC<AnimatedCounterProps> = ({ value, className }) => {
    const [displayValue, setDisplayValue] = useState<number>(0);
    const prevValueRef = useRef<number>(0);

    useEffect(() => {
        const fromValue = prevValueRef.current;
        const toValue = value;
        prevValueRef.current = value;

        if (fromValue === toValue) {
            setDisplayValue(toValue);
            return;
        }

        const controls = animate(fromValue, toValue, {
            duration: 0.45,
            ease: [0.16, 1, 0.3, 1] as const,
            onUpdate: (latest) => {
                setDisplayValue(Math.round(latest));
            },
        });

        return () => controls.stop();
    }, [value]);

    return (
        <motion.span
            key={value}
            initial={{ scale: 0.88, y: 3 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 18 }}
            className={` tabular-nums ${className || ''}`}
        >
            {displayValue}
        </motion.span>
    );
};

export const UrgentTasksStats: React.FC<UrgentTasksStatsProps> = ({
    id = "urgent-tasks-stats-container",
    stats,
    activeFilter,
    onToggleFilter,
}) => {
    return (
        <div id={id} className="grid grid-cols-3 gap-4 relative z-10">
            <motion.button 
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 380, damping: 26 }}
                id="btn-filter-overdue"
                onClick={() => onToggleFilter('OVERDUE')}
                className={`rounded-2xl p-3 border text-center transition-colors cursor-pointer ${activeFilter === 'OVERDUE' ? 'bg-red-100 border-red-300 ring-4 ring-red-500/10' : 'bg-red-50/50 border-white/60 hover:border-red-200'}`}
            >
                <AnimatedCounter
                    value={stats.overdue}
                    className={`block text-3xl font-bold leading-none mb-1 ${stats.overdue > 0 ? 'text-red-500' : 'text-slate-300'}`}
                />
                <span className="text-[10px] text-red-500 uppercase font-bold tracking-widest">Overdue</span>
            </motion.button>
            <motion.button 
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 380, damping: 26 }}
                id="btn-filter-today"
                onClick={() => onToggleFilter('TODAY')}
                className={`rounded-2xl p-3 border text-center transition-colors cursor-pointer ${activeFilter === 'TODAY' ? 'bg-orange-100 border-orange-300 ring-4 ring-orange-500/10' : 'bg-orange-50/50 border-white/60 hover:border-orange-200'}`}
            >
                <AnimatedCounter
                    value={stats.today}
                    className="block text-3xl font-bold text-orange-500 leading-none mb-1"
                />
                <span className="text-[10px] text-orange-500 uppercase font-bold tracking-widest">Today</span>
            </motion.button>
            <motion.button 
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 380, damping: 26 }}
                id="btn-filter-soon"
                onClick={() => onToggleFilter('SOON')}
                className={`rounded-2xl p-3 border text-center transition-colors cursor-pointer ${activeFilter === 'SOON' ? 'bg-yellow-100 border-yellow-300 ring-4 ring-yellow-500/10' : 'bg-yellow-50/50 border-white/60 hover:border-yellow-200'}`}
            >
                <AnimatedCounter
                    value={stats.upcoming}
                    className="block text-3xl font-bold text-yellow-500 leading-none mb-1"
                />
                <span className="text-[10px] text-yellow-600 uppercase font-bold tracking-widest">Soon</span>
            </motion.button>
        </div>
    );
};

