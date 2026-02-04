
import React, { useMemo, useState } from 'react';
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
        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full relative transition-all duration-500">
            
            {/* --- Header: Stats Filter --- */}
            <div className="p-5 pb-6 border-b border-gray-100 relative overflow-hidden bg-white">
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none opacity-60"></div>
                
                <div className="flex justify-between items-start relative z-10 mb-4">
                    <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl shadow-sm border transition-colors ${stats.overdue > 0 ? 'bg-red-50 text-red-500 border-red-100' : 'bg-green-50 text-green-500 border-green-100'}`}>
                            <Siren className={`w-6 h-6 ${stats.overdue > 0 ? 'animate-pulse' : ''}`} />
                        </div>
                        <div>
                            <h3 className="font-black text-xl tracking-tight text-gray-800">งานด่วน (Priority)</h3>
                            <div className="flex items-center gap-2">
                                <p className="text-xs text-gray-400 font-bold">
                                    {activeFilter === 'ALL' ? (viewScope === 'ME' ? 'เฉพาะงานของคุณ' : 'ภาพรวมทั้งทีม') : `กรอง: ${activeFilter}`}
                                </p>
                                {activeFilter !== 'ALL' && (
                                    <button onClick={() => setActiveFilter('ALL')} className="text-[10px] text-gray-400 hover:text-red-500 bg-gray-100 hover:bg-red-50 px-1.5 py-0.5 rounded flex items-center transition-colors">
                                        <X className="w-3 h-3 mr-1" /> Clear
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Clickable Stats Bar */}
                <div className="grid grid-cols-3 gap-3 relative z-10">
                    <button 
                        onClick={() => toggleFilter('OVERDUE')}
                        className={`rounded-xl p-2 border text-center transition-all active:scale-95 ${activeFilter === 'OVERDUE' ? 'bg-red-100 border-red-300 ring-2 ring-red-200' : 'bg-red-50 border-red-100 hover:border-red-200'}`}
                    >
                        <span className={`block text-2xl font-black leading-none ${stats.overdue > 0 ? 'text-red-500' : 'text-gray-300'}`}>{stats.overdue}</span>
                        <span className="text-[10px] text-red-400 uppercase font-bold">Overdue</span>
                    </button>
                    <button 
                        onClick={() => toggleFilter('TODAY')}
                        className={`rounded-xl p-2 border text-center transition-all active:scale-95 ${activeFilter === 'TODAY' ? 'bg-orange-100 border-orange-300 ring-2 ring-orange-200' : 'bg-orange-50 border-orange-100 hover:border-orange-200'}`}
                    >
                        <span className="block text-2xl font-black text-orange-500 leading-none">{stats.today}</span>
                        <span className="text-[10px] text-orange-400 uppercase font-bold">Today</span>
                    </button>
                    <button 
                        onClick={() => toggleFilter('SOON')}
                        className={`rounded-xl p-2 border text-center transition-all active:scale-95 ${activeFilter === 'SOON' ? 'bg-yellow-100 border-yellow-300 ring-2 ring-yellow-200' : 'bg-yellow-50 border-yellow-100 hover:border-yellow-200'}`}
                    >
                        <span className="block text-2xl font-black text-yellow-500 leading-none">{stats.upcoming}</span>
                        <span className="text-[10px] text-yellow-600 uppercase font-bold">Soon</span>
                    </button>
                </div>
            </div>

            {/* --- Body: Task List --- */}
            {/* REMOVED max-h-[500px] to allow container to control height via flex */}
            <div className="flex-1 bg-white p-4 space-y-3 overflow-y-auto">
                {displayTasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center text-gray-400">
                        <PartyPopper className="w-12 h-12 mb-3 text-yellow-400 opacity-80" />
                        <p className="font-bold text-gray-600">
                            {activeFilter === 'ALL' ? 'สถานการณ์ปกติ (All Clear)' : 'ไม่มีรายการในหมวดนี้'}
                        </p>
                        <p className="text-xs">
                            {activeFilter === 'ALL' ? 'ไม่มีงานด่วนหรือค้างส่ง เยี่ยมมาก!' : 'ลองเลือกหมวดอื่นดูนะครับ'}
                        </p>
                    </div>
                ) : (
                    displayTasks.map(task => {
                        const isContent = task.type === 'CONTENT';
                        
                        // Calculate Overdue Days for Color Grading
                        const today = new Date(); today.setHours(0,0,0,0);
                        const taskEnd = new Date(task.endDate); taskEnd.setHours(0,0,0,0);
                        const daysOverdue = differenceInCalendarDays(today, taskEnd);

                        // --- VLOOKUP LOGIC ---
                        // Lookup Status Label from MasterOptions
                        const lookupType = task.type === 'CONTENT' ? 'STATUS' : 'TASK_STATUS';
                        const statusOption = masterOptions.find(o => o.type === lookupType && o.key === task.status);

                        const statusLabel = statusOption ? statusOption.label : (STATUS_LABELS[task.status as Status] || task.status);
                        const statusColor = statusOption ? statusOption.color : (STATUS_COLORS[task.status as Status] || 'bg-gray-100 text-gray-600 border-gray-200');
                        // ---------------------

                        // Dynamic Severity Style
                        let containerClass = "bg-white border-gray-100 hover:border-indigo-200";
                        let stripClass = "bg-gray-300";

                        if (daysOverdue > 0) {
                            // Late
                            if (daysOverdue > 7) {
                                containerClass = "bg-red-100 border-red-300 shadow-sm hover:border-red-400"; // Severe
                                stripClass = "bg-red-600 animate-pulse";
                            } else if (daysOverdue > 3) {
                                containerClass = "bg-red-50 border-red-200 hover:border-red-300"; // Medium
                                stripClass = "bg-red-500";
                            } else {
                                containerClass = "bg-red-50/40 border-red-100 hover:border-red-200"; // Light
                                stripClass = "bg-red-400";
                            }
                        } else if (daysOverdue === 0) {
                            // Today
                            containerClass = "bg-orange-50/50 border-orange-100 hover:border-orange-200";
                            stripClass = "bg-orange-500";
                        }

                        return (
                            <div 
                                key={task.id} 
                                onClick={() => onEditTask(task)}
                                className={`
                                    relative flex items-center gap-3 p-3 rounded-2xl border transition-all cursor-pointer group hover:shadow-md
                                    ${containerClass}
                                `}
                            >
                                {/* Left Strip Indicator */}
                                <div className={`absolute left-0 top-3 bottom-3 w-1 rounded-r-full ${stripClass}`}></div>

                                <div className="pl-2 shrink-0">
                                    {getAssigneeAvatar(task)}
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                    {/* Top Row: Type & Date */}
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className={`flex items-center gap-1 text-[9px] font-black px-1.5 py-0.5 rounded border ${isContent ? 'text-purple-600 bg-purple-50 border-purple-100' : 'text-blue-600 bg-blue-50 border-blue-100'}`}>
                                            {isContent ? <LayoutTemplate className="w-3 h-3"/> : <CheckSquare className="w-3 h-3"/>}
                                            {isContent ? 'Content' : 'Task'}
                                        </div>
                                        {getDelayBadge(new Date(task.endDate))}
                                    </div>

                                    {/* Title */}
                                    <h4 className="font-bold text-sm text-gray-800 truncate group-hover:text-indigo-600 transition-colors">
                                        {task.title}
                                    </h4>

                                    {/* Bottom Row: Status Badge (Correct Label) */}
                                    <div className="mt-1.5 flex items-center">
                                         <span className={`text-[10px] font-bold px-2 py-0.5 rounded border truncate max-w-[150px] ${statusColor}`}>
                                            {statusLabel}
                                        </span>
                                    </div>
                                </div>

                                <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0">
                                    <div className="p-1.5 bg-white border border-gray-200 rounded-lg text-gray-400 shadow-sm hover:text-indigo-600">
                                        <ChevronRight className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* --- Footer: View All --- */}
            {/* Show "View All" button only if we are in 'ALL' filter and there are more items */}
            {activeFilter === 'ALL' && stats.total > 5 && (
                <div className="p-3 border-t border-gray-100 bg-gray-50/50">
                    <button 
                        onClick={onNavigateToCalendar}
                        className="w-full py-2.5 flex items-center justify-center gap-2 text-xs font-bold text-gray-500 hover:text-indigo-600 hover:bg-white rounded-xl border border-transparent hover:border-gray-200 transition-all shadow-sm"
                    >
                        <CalendarClock className="w-3.5 h-3.5" />
                        ดูงานที่เหลืออีก {stats.total - 5} รายการ
                    </button>
                </div>
            )}
        </div>
    );
};

export default UrgentTasksWidget;
