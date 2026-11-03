import React from 'react';
import { motion } from 'framer-motion';
import { Filter, LayoutTemplate, CheckSquare } from 'lucide-react';

interface UrgentTasksFilterTabsProps {
    id?: string;
    selectedType: 'ALL' | 'CONTENT' | 'TASK';
    onChangeType: (type: 'ALL' | 'CONTENT' | 'TASK') => void;
    contentCount: number;
    taskCount: number;
    allCount: number;
}

const tabSpringTransition = {
    type: 'spring' as const,
    stiffness: 380,
    damping: 30,
};

export const UrgentTasksFilterTabs: React.FC<UrgentTasksFilterTabsProps> = ({
    id = "urgent-tasks-filter-tabs",
    selectedType,
    onChangeType,
    contentCount,
    taskCount,
    allCount,
}) => {
    const tabs = [
        { id: 'ALL' as const, label: 'ทั้งหมด', icon: Filter, count: allCount, color: 'text-slate-600' },
        { id: 'CONTENT' as const, label: 'คอนเทนต์', icon: LayoutTemplate, count: contentCount, color: 'text-purple-600' },
        { id: 'TASK' as const, label: 'งานทั่วไป', icon: CheckSquare, count: taskCount, color: 'text-blue-600' }
    ];

    return (
        <div id={id} className="flex justify-center w-full px-3 sm:px-6 mb-4 relative z-10">
            <div className="grid grid-cols-3 bg-slate-100/70 backdrop-blur-md p-1 rounded-full border border-white/60 shadow-inner w-full max-w-md relative overflow-hidden">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = selectedType === tab.id;
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            id={`tab-btn-${tab.id.toLowerCase()}`}
                            onClick={() => onChangeType(tab.id)}
                            className="relative py-2 px-1.5 sm:px-3 rounded-full flex items-center justify-center text-[11px] sm:text-xs font-bold transition-colors cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/40"
                            style={{ WebkitTapHighlightColor: 'transparent' }}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="active-segmented-tab"
                                    className={`absolute inset-0 rounded-full shadow-sm border ${
                                        tab.id === 'ALL'
                                            ? 'bg-white border-slate-200/60'
                                            : tab.id === 'CONTENT'
                                            ? 'bg-purple-50 border-purple-200/70'
                                            : 'bg-blue-50 border-blue-200/70'
                                    }`}
                                    transition={tabSpringTransition}
                                />
                            )}
                            <span className="relative z-10 flex items-center justify-center gap-1 sm:gap-1.5 min-w-0 whitespace-nowrap">
                                <motion.span
                                    animate={{ scale: isActive ? 1.08 : 1 }}
                                    transition={tabSpringTransition}
                                    className="flex items-center justify-center shrink-0"
                                >
                                    <Icon className={`w-3 h-3 sm:w-3.5 sm:h-3.5 transition-colors ${isActive ? tab.color : 'text-slate-400'}`} />
                                </motion.span>
                                <span className={`whitespace-nowrap truncate transition-colors ${isActive ? 'text-slate-800 font-bold' : 'text-slate-500 font-medium'}`}>
                                    {tab.label}
                                </span>
                                <motion.span
                                    key={tab.count}
                                    initial={{ scale: 0.85, opacity: 0.7 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={tabSpringTransition}
                                    className={`text-[9px] sm:text-[10px] px-1.5 py-0.5 leading-none rounded-full font-bold tabular-nums shrink-0 transition-colors ${
                                        isActive 
                                        ? (tab.id === 'CONTENT' ? 'bg-purple-200/70 text-purple-700' : tab.id === 'TASK' ? 'bg-blue-200/70 text-blue-700' : 'bg-slate-200/80 text-slate-700') 
                                        : 'bg-slate-200/50 text-slate-500'
                                    }`}
                                >
                                    {tab.count}
                                </motion.span>
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

