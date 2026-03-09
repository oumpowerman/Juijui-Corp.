
import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Task, Status, Channel, User, MasterOption } from '../../../types';
import { AlertTriangle, ArrowRight, PartyPopper, CalendarClock, Clock, Siren, ChevronRight, LayoutTemplate, CheckSquare, Filter, X } from 'lucide-react';
import { format, isPast, isToday, isTomorrow, differenceInCalendarDays, addDays, isBefore } from 'date-fns';
import { STATUS_COLORS, STATUS_LABELS, isTaskCompleted } from '../../../constants';

interface UrgentTasksWidgetProps {
    tasks: Task[]; // Raw tasks (filtered by scope in parent or here)
    channels: Channel[];
    users: User[];
    masterOptions: MasterOption[]; // New Prop for VLOOKUP
    viewScope: 'ALL' | 'ME';
    currentUser: User;
    onEditTask: (task: Task) => void;
    onNavigateToCalendar: () => void;
}

type FilterType = 'ALL' | 'OVERDUE' | 'TODAY' | 'SOON';

const UrgentTasksWidget: React.FC<UrgentTasksWidgetProps> = ({
    tasks,
    channels,
    users,
    masterOptions,
    viewScope,
    currentUser,
    onEditTask,
    onNavigateToCalendar
}) => {
    const [activeFilter, setActiveFilter] = useState<FilterType>('ALL');

    // --- 1. Filter Logic (The Brain) ---
    const { displayTasks, stats, rawActiveTasks } = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Filter: Active Tasks & Scope
        const activeTasks = tasks.filter(t => {
            // Must not be done & not unscheduled
            if (t.isUnscheduled || isTaskCompleted(t.status as string)) return false;

            // Scope Check
            if (viewScope === 'ME') {
                const isAssignee = t.assigneeIds?.includes(currentUser.id);
                const isOwner = t.ideaOwnerIds?.includes(currentUser.id);
                const isEditor = t.editorIds?.includes(currentUser.id);
                if (!isAssignee && !isOwner && !isEditor) return false;
            }
            return true;
        });

        // Categorize for Stats
        let overdueCount = 0;
        let todayCount = 0;
        let upcomingCount = 0; // Next 2 days

        activeTasks.forEach(t => {
            const endDate = new Date(t.endDate);
            endDate.setHours(0, 0, 0, 0);

            if (isBefore(endDate, today)) overdueCount++;
            else if (isToday(endDate)) todayCount++;
            else if (isBefore(endDate, addDays(today, 3))) upcomingCount++;
        });

        // Sort based on Priority Rule (Overdue > Urgent Priority > Date)
        const smartSorted = [...activeTasks].sort((a, b) => {
            const dateA = new Date(a.endDate).getTime();
            const dateB = new Date(b.endDate).getTime();
            
            // 1. Overdue comes first
            const isOverdueA = dateA < today.getTime();
            const isOverdueB = dateB < today.getTime();
            if (isOverdueA && !isOverdueB) return -1;
            if (!isOverdueA && isOverdueB) return 1;

            // 2. Urgent Priority
            if (a.priority === 'URGENT' && b.priority !== 'URGENT') return -1;
            if (a.priority !== 'URGENT' && b.priority === 'URGENT') return 1;

            // 3. Date Ascending
            return dateA - dateB;
        });

        // --- Apply Active Filter for Display ---
        let finalDisplayList = smartSorted;
        if (activeFilter === 'OVERDUE') {
            finalDisplayList = activeTasks.filter(t => {
                const d = new Date(t.endDate); d.setHours(0,0,0,0);
                return isBefore(d, today);
            }).sort((a,b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime());
        } else if (activeFilter === 'TODAY') {
            finalDisplayList = activeTasks.filter(t => {
                const d = new Date(t.endDate); d.setHours(0,0,0,0);
                return isToday(d);
            });
        } else if (activeFilter === 'SOON') {
            finalDisplayList = activeTasks.filter(t => {
                const d = new Date(t.endDate); d.setHours(0,0,0,0);
                return !isBefore(d, today) && !isToday(d) && isBefore(d, addDays(today, 3));
            });
        } else {
            // Default 'ALL': Top 5 Priority
            finalDisplayList = smartSorted.slice(0, 5);
        }

        return {
            displayTasks: finalDisplayList,
            stats: { overdue: overdueCount, today: todayCount, upcoming: upcomingCount, total: activeTasks.length },
            rawActiveTasks: activeTasks
        };
    }, [tasks, viewScope, currentUser, activeFilter]);

    // --- 2. Helper Renderers ---

    const getDelayBadge = (date: Date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const target = new Date(date);
        target.setHours(0, 0, 0, 0);

        const diff = differenceInCalendarDays(target, today);

        if (diff < 0) {
            // Calculate severity for badge color
            const daysLate = Math.abs(diff);
            let badgeClass = "bg-red-100 text-red-600";
            if (daysLate > 7) badgeClass = "bg-red-200 text-red-800 border-red-300";
            else if (daysLate > 3) badgeClass = "bg-red-100 text-red-700";

            return (
                <div className={`flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded shadow-sm border border-transparent ${badgeClass}`}>
                    <AlertTriangle className="w-3 h-3" />
                    สาย {daysLate} วัน
                </div>
            );
        }
        if (diff === 0) {
            return (
                <div className="flex items-center gap-1 text-[10px] font-black text-orange-700 bg-orange-100 px-2 py-0.5 rounded border border-orange-200">
                    <Clock className="w-3 h-3" />
                    วันนี้!
                </div>
            );
        }
        if (diff === 1) {
            return <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">พรุ่งนี้</span>;
        }
        return <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{format(date, 'd MMM')}</span>;
    };

    const getAssigneeAvatar = (task: Task) => {
        const uid = task.assigneeIds[0] || task.ideaOwnerIds?.[0] || task.editorIds?.[0];
        const user = users.find(u => u.id === uid);
        if (!user) return <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-[10px] text-gray-400 font-bold">?</div>;
        return <img src={user.avatarUrl} className="w-8 h-8 rounded-full border-2 border-white object-cover shadow-sm" title={user.name} />;
    };

    const toggleFilter = (type: FilterType) => {
        if (activeFilter === type) {
            setActiveFilter('ALL');
        } else {
            setActiveFilter(type);
        }
    };

    return (
        <div className="glass-card rounded-[2.5rem] overflow-hidden flex flex-col h-full relative transition-all duration-500 shadow-indigo-100/50">
            
            {/* --- Header: Stats Filter --- */}
            <div className="p-6 pb-8 border-b border-white/40 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-red-100/30 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none opacity-60"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-100/20 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none opacity-40"></div>
                
                <div className="flex justify-between items-start relative z-10 mb-6">
                    <div className="flex items-center gap-4">
                        <motion.div 
                            animate={stats.overdue > 0 ? { scale: [1, 1.1, 1] } : {}}
                            transition={{ repeat: Infinity, duration: 2 }}
                            className={`p-3.5 rounded-2xl shadow-sm border transition-colors ${stats.overdue > 0 ? 'bg-red-50 text-red-500 border-red-100' : 'bg-green-50 text-green-500 border-green-100'}`}
                        >
                            <Siren className={`w-7 h-7 ${stats.overdue > 0 ? 'animate-pulse' : ''}`} />
                        </motion.div>
                        <div>
                            <h3 className="font-black text-2xl tracking-tighter text-slate-800">งานด่วน (Priority)</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                                    {activeFilter === 'ALL' ? (viewScope === 'ME' ? 'เฉพาะงานของคุณ' : 'ภาพรวมทั้งทีม') : `กรอง: ${activeFilter}`}
                                </p>
                                {activeFilter !== 'ALL' && (
                                    <button onClick={() => setActiveFilter('ALL')} className="text-[10px] text-red-500 font-black uppercase tracking-widest bg-red-50 hover:bg-red-100 px-2 py-0.5 rounded-full flex items-center transition-all">
                                        <X className="w-3 h-3 mr-1" /> Clear
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Clickable Stats Bar */}
                <div className="grid grid-cols-3 gap-4 relative z-10">
                    <motion.button 
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => toggleFilter('OVERDUE')}
                        className={`rounded-2xl p-3 border text-center transition-all ${activeFilter === 'OVERDUE' ? 'bg-red-100 border-red-300 ring-4 ring-red-500/10' : 'bg-red-50/50 border-white/60 hover:border-red-200'}`}
                    >
                        <span className={`block text-3xl font-black leading-none mb-1 ${stats.overdue > 0 ? 'text-red-500' : 'text-slate-300'}`}>{stats.overdue}</span>
                        <span className="text-[10px] text-red-400 uppercase font-black tracking-widest">Overdue</span>
                    </motion.button>
                    <motion.button 
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => toggleFilter('TODAY')}
                        className={`rounded-2xl p-3 border text-center transition-all ${activeFilter === 'TODAY' ? 'bg-orange-100 border-orange-300 ring-4 ring-orange-500/10' : 'bg-orange-50/50 border-white/60 hover:border-orange-200'}`}
                    >
                        <span className="block text-3xl font-black text-orange-500 leading-none mb-1">{stats.today}</span>
                        <span className="text-[10px] text-orange-400 uppercase font-black tracking-widest">Today</span>
                    </motion.button>
                    <motion.button 
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => toggleFilter('SOON')}
                        className={`rounded-2xl p-3 border text-center transition-all ${activeFilter === 'SOON' ? 'bg-yellow-100 border-yellow-300 ring-4 ring-yellow-500/10' : 'bg-yellow-50/50 border-white/60 hover:border-yellow-200'}`}
                    >
                        <span className="block text-3xl font-black text-yellow-500 leading-none mb-1">{stats.upcoming}</span>
                        <span className="text-[10px] text-yellow-600 uppercase font-black tracking-widest">Soon</span>
                    </motion.button>
                </div>
            </div>

            {/* --- Body: Task List --- */}
            <div className="flex-1 p-6 space-y-4 overflow-y-auto scrollbar-thin">
                {displayTasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <motion.div
                            animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }}
                            transition={{ repeat: Infinity, duration: 3 }}
                        >
                            <PartyPopper className="w-16 h-16 mb-4 text-amber-400 opacity-80" />
                        </motion.div>
                        <p className="font-black text-slate-600 text-lg">
                            {activeFilter === 'ALL' ? 'สถานการณ์ปกติ (All Clear)' : 'ไม่มีรายการในหมวดนี้'}
                        </p>
                        <p className="text-xs text-slate-400 font-bold mt-1">
                            {activeFilter === 'ALL' ? 'ไม่มีงานด่วนหรือค้างส่ง เยี่ยมมาก!' : 'ลองเลือกหมวดอื่นดูนะครับ'}
                        </p>
                    </div>
                ) : (
                    displayTasks.map((task, idx) => {
                        const isContent = task.type === 'CONTENT';
                        const today = new Date(); today.setHours(0,0,0,0);
                        const taskEnd = new Date(task.endDate); taskEnd.setHours(0,0,0,0);
                        const daysOverdue = differenceInCalendarDays(today, taskEnd);

                        const lookupType = task.type === 'CONTENT' ? 'STATUS' : 'TASK_STATUS';
                        const statusOption = masterOptions.find(o => o.type === lookupType && o.key === task.status);

                        const statusLabel = statusOption ? statusOption.label : (STATUS_LABELS[task.status as Status] || task.status);
                        const statusColor = statusOption ? statusOption.color : (STATUS_COLORS[task.status as Status] || 'bg-gray-100 text-gray-600 border-gray-200');

                        let containerClass = "bg-white/40 border-white/60 hover:border-indigo-300 hover:bg-white/80";
                        let stripClass = "bg-slate-200";

                        if (daysOverdue > 0) {
                            if (daysOverdue > 7) {
                                containerClass = "bg-red-50/60 border-red-200 hover:border-red-400 hover:bg-red-50 shadow-sm shadow-red-100/50";
                                stripClass = "bg-red-500 animate-pulse";
                            } else if (daysOverdue > 3) {
                                containerClass = "bg-red-50/40 border-red-100 hover:border-red-300 hover:bg-red-50/60";
                                stripClass = "bg-red-400";
                            } else {
                                containerClass = "bg-red-50/20 border-red-100/50 hover:border-red-200 hover:bg-red-50/40";
                                stripClass = "bg-red-300";
                            }
                        } else if (daysOverdue === 0) {
                            containerClass = "bg-orange-50/30 border-orange-100 hover:border-orange-300 hover:bg-orange-50/50";
                            stripClass = "bg-orange-400";
                        }

                        return (
                            <motion.div 
                                key={task.id} 
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                whileHover={{ scale: 1.02, x: 5 }}
                                onClick={() => onEditTask(task)}
                                className={`
                                    relative flex items-center gap-4 p-4 rounded-3xl border backdrop-blur-sm transition-all cursor-pointer group hover:shadow-xl
                                    ${containerClass}
                                `}
                            >
                                {/* Left Strip Indicator */}
                                <div className={`absolute left-0 top-4 bottom-4 w-1.5 rounded-r-full ${stripClass}`}></div>

                                <div className="pl-2 shrink-0">
                                    {getAssigneeAvatar(task)}
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <div className={`flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full border ${isContent ? 'text-purple-600 bg-purple-50 border-purple-100' : 'text-blue-600 bg-blue-50 border-blue-100'}`}>
                                            {isContent ? <LayoutTemplate className="w-3 h-3"/> : <CheckSquare className="w-3 h-3"/>}
                                            {isContent ? 'CONTENT' : 'TASK'}
                                        </div>
                                        {getDelayBadge(new Date(task.endDate))}
                                    </div>

                                    <h4 className="font-black text-base text-slate-800 truncate group-hover:text-indigo-600 transition-colors tracking-tight">
                                        {task.title}
                                    </h4>

                                    <div className="mt-2 flex items-center">
                                         <span className={`text-[10px] font-black px-3 py-1 rounded-full border truncate max-w-[180px] shadow-sm ${statusColor}`}>
                                            {statusLabel}
                                        </span>
                                    </div>
                                </div>

                                <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-all -translate-x-4 group-hover:translate-x-0">
                                    <div className="p-2 bg-white rounded-2xl text-indigo-500 shadow-lg border border-indigo-50">
                                        <ChevronRight className="w-5 h-5" />
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })
                )}
            </div>

            {/* --- Footer: View All --- */}
            {activeFilter === 'ALL' && stats.total > 5 && (
                <div className="p-4 border-t border-white/40 bg-white/30 backdrop-blur-md">
                    <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onNavigateToCalendar}
                        className="w-full py-3.5 flex items-center justify-center gap-2 text-xs font-black text-slate-500 hover:text-indigo-600 hover:bg-white rounded-2xl border border-white/60 hover:border-indigo-100 transition-all shadow-sm uppercase tracking-widest"
                    >
                        <CalendarClock className="w-4 h-4" />
                        ดูงานที่เหลืออีก {stats.total - 5} รายการ
                    </motion.button>
                </div>
            )}
        </div>
    );
};

export default UrgentTasksWidget;
