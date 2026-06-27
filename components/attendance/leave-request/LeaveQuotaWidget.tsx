
import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LeaveUsage, LeaveType } from '../../../types/attendance';
import { Palmtree, HeartPulse, Briefcase, ChevronRight, Sparkles, Star, Cloud, FileText } from 'lucide-react';
import { useMasterData } from '../../../hooks/useMasterData';
import LeaveHistorySummary from './LeaveHistorySummary';

// Simple, elegant React local component to animate and count up numbers smoothly when mounting
const AnimatedCounter: React.FC<{ value: number }> = ({ value }) => {
    const [count, setCount] = React.useState(0);

    React.useEffect(() => {
        let start = 0;
        const end = value;
        if (end === 0) {
            setCount(0);
            return;
        }
        const duration = 1000; // ms
        const startTime = performance.now();

        const animate = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out quad formula for pleasant deceleration
            const easeProgress = progress * (2 - progress);
            
            const current = Math.round(easeProgress * (end - start) + start);
            setCount(current);

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                setCount(end);
            }
        };

        requestAnimationFrame(animate);
    }, [value]);

    return <span>{count}</span>;
};

interface LeaveQuotaWidgetProps {
    leaveUsage: LeaveUsage;
    onHistoryClick?: () => void;
}

const PASTEL_THEMES: Record<string, any> = {
    'VACATION': { 
        bg: 'bg-[#E0F7FA]', 
        text: 'text-[#00ACC1]', 
        bar: 'bg-gradient-to-r from-[#4DD0E1] to-[#00BCD4]', 
        glow: 'shadow-[0_0_15px_rgba(0,188,212,0.4)]',
        icon: Palmtree,
        label: 'พักร้อน',
        accent: 'text-[#80DEEA]'
    },
    'SICK': { 
        bg: 'bg-[#FCE4EC]', 
        text: 'text-[#D81B60]', 
        bar: 'bg-gradient-to-r from-[#F06292] to-[#E91E63]', 
        glow: 'shadow-[0_0_15px_rgba(233,30,99,0.4)]',
        icon: HeartPulse,
        label: 'ลาป่วย',
        accent: 'text-[#F8BBD0]'
    },
    'PERSONAL': { 
        bg: 'bg-[#F3E5F5]', 
        text: 'text-[#8E24AA]', 
        bar: 'bg-gradient-to-r from-[#BA68C8] to-[#9C27B0]', 
        glow: 'shadow-[0_0_15px_rgba(156,39,176,0.4)]',
        icon: Briefcase,
        label: 'ลากิจ',
        accent: 'text-[#E1BEE7]'
    },
    'DEFAULT': {
        bg: 'bg-slate-50',
        text: 'text-slate-600',
        bar: 'bg-gradient-to-r from-slate-400 to-slate-600',
        glow: 'shadow-[0_0_15px_rgba(71,85,105,0.4)]',
        icon: FileText,
        label: 'อื่นๆ',
        accent: 'text-slate-300'
    }
};

const LeaveQuotaWidget: React.FC<LeaveQuotaWidgetProps> = ({ leaveUsage, onHistoryClick }) => {
    const { masterOptions } = useMasterData();
    const [view, setView] = useState<'quota' | 'history'>('quota');
    const [initialFilter, setInitialFilter] = useState<string | null>(null);
    
    const displayOptions = useMemo(() => {
        return masterOptions
            .filter(o => o.type === 'LEAVE_TYPE' && o.isActive)
            .filter(o => {
                try {
                    const meta = o.description ? JSON.parse(o.description) : {};
                    return meta.category === 'STANDARD';
                } catch (e) {
                    return false;
                }
            })
            .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    }, [masterOptions]);

    return (
        <div className="bg-white rounded-none sm:rounded-[3rem] border-0 sm:border-4 border-[#F8F9FA] shadow-none sm:shadow-[0_20px_50px_rgba(0,0,0,0.05)] p-5 sm:p-8 relative overflow-hidden group h-full sm:h-[75vh] sm:max-h-[780px] sm:min-h-[580px] flex flex-col justify-between" id="leave-quota-widget-container">
            <AnimatePresence mode="wait">
                {view === 'history' ? (
                    <motion.div
                        key="history"
                        initial={{ opacity: 0, x: 15 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -15 }}
                        transition={{ duration: 0.22, ease: "easeInOut" }}
                        className="h-full flex flex-col justify-between w-full"
                    >
                        <LeaveHistorySummary 
                            onBack={() => {
                                setView('quota');
                                setInitialFilter(null);
                            }} 
                            borderless={true} 
                            initialFilterType={initialFilter || undefined}
                        />
                    </motion.div>
                ) : (
                    <motion.div
                        key="quota"
                        initial={{ opacity: 0, x: -15 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 15 }}
                        transition={{ duration: 0.22, ease: "easeInOut" }}
                        className="h-full flex flex-col justify-between w-full relative"
                    >
                        {/* Background Decor - Cute Floating Elements */}
                        <motion.div 
                            animate={{ y: [0, -10, 0], rotate: [0, 5, 0] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute top-4 right-10 text-[#FFD54F] opacity-20"
                        >
                            <Star className="w-8 h-8 fill-current" />
                        </motion.div>
                        <motion.div 
                            animate={{ x: [0, 10, 0], y: [0, 5, 0] }}
                            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                            className="absolute bottom-10 left-4 text-[#B2EBF2] opacity-30"
                        >
                            <Cloud className="w-12 h-12 fill-current" />
                        </motion.div>

                        {/* Header */}
                        <div className="flex justify-between items-center mb-4 sm:mb-6 relative z-10 pr-10 sm:pr-0">
                            <div className="flex flex-col">
                                <h3 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-2 sm:gap-3">
                                    <motion.div 
                                        whileHover={{ rotate: 360, scale: 1.2 }}
                                        transition={{ type: "spring", stiffness: 260, damping: 20 }}
                                        className="p-2.5 sm:p-3 bg-gradient-to-br from-indigo-500 to-purple-500 text-white rounded-xl sm:rounded-2xl shadow-lg shadow-indigo-200"
                                    >
                                        <Sparkles className="w-4 sm:w-5 h-4 sm:h-5" />
                                    </motion.div>
                                    <span className="tracking-tight">โควตาวันลา</span>
                                </h3>
                                <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1 ml-11 sm:ml-14">My Leave Quota</p>
                            </div>
                            
                            <motion.button 
                                whileHover={{ x: 5 }}
                                onClick={() => {
                                    setInitialFilter(null);
                                    setView('history');
                                }}
                                className="px-3 py-1.5 sm:px-4 sm:py-2 bg-slate-50 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-xl sm:rounded-2xl text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1 border border-slate-100 cursor-pointer"
                            >
                                ประวัติ <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
                            </motion.button>
                        </div>

                        {/* Quota Bars mapped to interactive Cards */}
                        <div className="space-y-4 sm:space-y-5 relative z-10 flex-1 flex flex-col justify-center">
                            {displayOptions.map((option, index) => {
                                const type = option.key;
                                let limit = 0;
                                try {
                                    const meta = option.description ? JSON.parse(option.description) : {};
                                    limit = meta.defaultQuota || 0;
                                } catch (e) {}

                                const used = leaveUsage[type as LeaveType] || 0;
                                const remaining = Math.max(0, limit - used);
                                const percentUsed = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
                                
                                const theme = PASTEL_THEMES[type] || PASTEL_THEMES['DEFAULT'];
                                const Icon = theme.icon;

                                return (
                                    <motion.div 
                                        key={type}
                                        initial={{ opacity: 0, y: 35, scale: 0.93 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        transition={{ 
                                            type: "spring",
                                            damping: 15,
                                            stiffness: 100,
                                            delay: index * 0.12 
                                        }}
                                        whileHover={{ scale: 1.025, y: -2 }}
                                        whileTap={{ scale: 0.985 }}
                                        onClick={() => {
                                            setInitialFilter(type);
                                            setView('history');
                                        }}
                                        className="relative cursor-pointer p-3.5 sm:p-4 bg-slate-50/40 hover:bg-slate-50 border border-transparent hover:border-slate-100 hover:shadow-md hover:shadow-slate-100/50 rounded-2xl sm:rounded-[1.5rem] transition-all duration-200 select-none group/card"
                                    >
                                        <div className="flex justify-between items-end mb-2 sm:mb-3 px-1">
                                            <div className="flex items-center gap-2 sm:gap-3">
                                                <motion.div 
                                                    animate={{ 
                                                        rotate: [0, -10, 10, -10, 0],
                                                        scale: [1, 1.1, 1]
                                                    }}
                                                    transition={{ 
                                                        duration: 2, 
                                                        repeat: Infinity, 
                                                        repeatDelay: 3 + index,
                                                        ease: "easeInOut" 
                                                    }}
                                                    className={`p-2 sm:p-2.5 ${theme.bg} ${theme.text} rounded-xl sm:rounded-2xl shadow-sm border border-white`}
                                                >
                                                    <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                                                </motion.div>
                                                <div>
                                                    <span className="text-xs sm:text-sm font-bold text-slate-700 block leading-none group-hover/card:text-indigo-600 transition-colors">{option.label}</span>
                                                    <span className={`text-[9px] sm:text-[10px] font-bold ${theme.accent} uppercase tracking-widest block mt-1`}>{type}</span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-0.5">Remaining</p>
                                                <div className="flex items-baseline gap-0.5 sm:gap-1">
                                                    <span className={`text-xl sm:text-2xl font-bold tracking-tighter ${remaining === 0 ? 'text-rose-500' : 'text-slate-800'}`}>
                                                        <AnimatedCounter value={remaining} />
                                                    </span>
                                                    <span className="text-[10px] sm:text-xs font-bold text-slate-400">/ {limit} วัน</span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Progress Track - 3D Style */}
                                        <div className="h-3.5 sm:h-4.5 w-full bg-slate-100 rounded-full p-1 border border-slate-200/50 shadow-inner relative group/bar overflow-hidden">
                                            {/* Bar with Glow and Gradient */}
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: `${percentUsed}%` }}
                                                transition={{ 
                                                    duration: 1.2, 
                                                    ease: "circOut",
                                                    delay: index * 0.12 
                                                }}
                                                className={`h-full rounded-full relative ${theme.bar} ${theme.glow} border border-white/30`}
                                            >
                                                {/* Glass Shine Effect */}
                                                <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent h-1/2 rounded-full"></div>
                                                
                                                {/* Animated Shimmer */}
                                                <motion.div 
                                                    animate={{ x: ['-100%', '200%'] }}
                                                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-1/2 h-full skew-x-[-20deg]"
                                                />
                                            </motion.div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>

                        {/* Bottom Decor */}
                        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-indigo-50 rounded-full blur-[80px] opacity-60 pointer-events-none"></div>
                        <div className="absolute -top-12 -right-12 w-48 h-48 bg-purple-50 rounded-full blur-[80px] opacity-60 pointer-events-none"></div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default LeaveQuotaWidget;
