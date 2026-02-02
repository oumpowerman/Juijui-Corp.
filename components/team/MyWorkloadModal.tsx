
import React, { useState, useMemo } from 'react';
import { Task, User, Channel } from '../../types';
import { X, Calendar, Layers, UserCircle, AlertTriangle, Clock, CheckCircle2, ArrowRight, LayoutGrid, List } from 'lucide-react';
import { format, isPast, isToday, isTomorrow, isSameWeek, addDays } from 'date-fns';
import { isTaskCompleted } from '../../constants';

interface MyWorkloadModalProps {
    isOpen: boolean;
    onClose: () => void;
    tasks: Task[];
    currentUser: User;
    channels: Channel[];
    onOpenTask: (task: Task) => void;
}

type GroupMode = 'DATE' | 'CHANNEL' | 'ROLE';
type ViewMode = 'GRID' | 'LIST';

const MyWorkloadModal: React.FC<MyWorkloadModalProps> = ({ 
    isOpen, onClose, tasks, currentUser, channels, onOpenTask 
}) => {
    const [groupMode, setGroupMode] = useState<GroupMode>('DATE');
    const [viewMode, setViewMode] = useState<ViewMode>('GRID');

    // 1. Filter: Get only MY active tasks
    const myActiveTasks = useMemo(() => {
        return tasks.filter(t => {
            // Must be involved
            const isMe = t.assigneeIds.includes(currentUser.id) || 
                         t.ideaOwnerIds?.includes(currentUser.id) || 
                         t.editorIds?.includes(currentUser.id);
            
            // Must not be done
            const isDone = isTaskCompleted(t.status as string);
            
            return isMe && !isDone;
        }).sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime());
    }, [tasks, currentUser]);

    // 2. Helper: Get my role in this task
    const getMyRole = (t: Task) => {
        const roles = [];
        if (t.ideaOwnerIds?.includes(currentUser.id)) roles.push('Owner 💡');
        if (t.editorIds?.includes(currentUser.id)) roles.push('Editor ✂️');
        if (t.assigneeIds.includes(currentUser.id)) roles.push('Support 🤝');
        return roles.join(' & ') || 'Member';
    };

    // 3. Grouping Logic
    const groupedTasks = useMemo(() => {
        const groups: Record<string, Task[]> = {};
        
        myActiveTasks.forEach(task => {
            let key = 'Other';
            
            if (groupMode === 'DATE') {
                const due = new Date(task.endDate);
                if (task.isUnscheduled) key = '📦 Unscheduled (Stock)';
                else if (isPast(due) && !isToday(due)) key = '🔥 Overdue (งานค้าง)';
                else if (isToday(due)) key = '📅 Today (วันนี้)';
                else if (isTomorrow(due)) key = '⏳ Tomorrow (พรุ่งนี้)';
                else if (isSameWeek(due, new Date(), { weekStartsOn: 1 })) key = '🗓️ This Week (สัปดาห์นี้)';
                else key = '🔮 Upcoming (ล่วงหน้า)';
            } 
            else if (groupMode === 'CHANNEL') {
                const ch = channels.find(c => c.id === task.channelId);
                key = ch ? ch.name : '🌐 General / Other';
            } 
            else if (groupMode === 'ROLE') {
                key = getMyRole(task);
            }

            if (!groups[key]) groups[key] = [];
            groups[key].push(task);
        });

        // Custom Sort Keys for Date Mode
        if (groupMode === 'DATE') {
            const order = ['🔥 Overdue (งานค้าง)', '📅 Today (วันนี้)', '⏳ Tomorrow (พรุ่งนี้)', '🗓️ This Week (สัปดาห์นี้)', '🔮 Upcoming (ล่วงหน้า)', '📦 Unscheduled (Stock)'];
            // Reconstruct object with sorted keys
            const sortedGroups: Record<string, Task[]> = {};
            order.forEach(k => {
                if (groups[k]) sortedGroups[k] = groups[k];
            });
            return sortedGroups;
        }

        return groups;
    }, [myActiveTasks, groupMode, channels]);

    // Stats
    const overdueCount = myActiveTasks.filter(t => !t.isUnscheduled && isPast(t.endDate) && !isToday(t.endDate)).length;
    const todayCount = myActiveTasks.filter(t => !t.isUnscheduled && isToday(t.endDate)).length;

    if (!isOpen) return null;

    // NOTE: Z-Index set to 60 to sit above sidebar (50) but BELOW TaskModal (will set to 200)
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200 font-sans">
            <div className="bg-white w-full max-w-5xl h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border-4 border-indigo-50 animate-in zoom-in-95">
                
                {/* Header */}
                <div className="px-8 py-6 bg-indigo-600 text-white shrink-0 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10"><Calendar className="w-40 h-40" /></div>
                    
                    <div className="flex justify-between items-start relative z-10">
                        <div className="flex items-center gap-4">
                            <div className="p-1 bg-white/20 rounded-full border-2 border-white/30">
                                <img src={currentUser.avatarUrl} className="w-16 h-16 rounded-full object-cover bg-white" />
                            </div>
                            <div>
                                <h2 className="text-3xl font-black">สวัสดี, {currentUser.name.split(' ')[0]}! 👋</h2>
                                <p className="text-indigo-100 text-base font-medium mt-1">นี่คือรายการงานที่ค้างอยู่ของคุณ</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-3 bg-white/20 hover:bg-white/30 rounded-full transition-colors text-white">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Stats Bar */}
                    <div className="flex gap-4 mt-6">
                        <div className="flex items-center gap-2 bg-black/20 px-4 py-2 rounded-xl border border-white/10 backdrop-blur-md">
                            <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse"></div>
                            <span className="text-sm font-bold">{myActiveTasks.length} Active Tasks</span>
                        </div>
                        {overdueCount > 0 && (
                            <div className="flex items-center gap-2 bg-red-500/80 px-4 py-2 rounded-xl border border-red-400 backdrop-blur-md text-white">
                                <AlertTriangle className="w-4 h-4" />
                                <span className="text-sm font-bold">{overdueCount} งานล่าช้า</span>
                            </div>
                        )}
                        {todayCount > 0 && (
                            <div className="flex items-center gap-2 bg-orange-500/80 px-4 py-2 rounded-xl border border-orange-400 backdrop-blur-md text-white">
                                <Clock className="w-4 h-4" />
                                <span className="text-sm font-bold">{todayCount} ส่งวันนี้</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Controls */}
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex flex-col md:flex-row items-center justify-between shrink-0 gap-4">
                    
                    {/* Group Controls */}
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider hidden md:block">Group By:</span>
                        <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-sm flex-1 md:flex-none">
                            <button 
                                onClick={() => setGroupMode('DATE')} 
                                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${groupMode === 'DATE' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                            >
                                <Calendar className="w-4 h-4" /> วันส่ง
                            </button>
                            <button 
                                onClick={() => setGroupMode('CHANNEL')} 
                                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${groupMode === 'CHANNEL' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                            >
                                <Layers className="w-4 h-4" /> ช่องรายการ
                            </button>
                            <button 
                                onClick={() => setGroupMode('ROLE')} 
                                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${groupMode === 'ROLE' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                            >
                                <UserCircle className="w-4 h-4" /> หน้าที่
                            </button>
                        </div>
                    </div>

                    {/* View Mode Toggle */}
                    <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
                        <button 
                            onClick={() => setViewMode('GRID')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'GRID' ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                            title="Grid View"
                        >
                            <LayoutGrid className="w-5 h-5" />
                        </button>
                        <button 
                            onClick={() => setViewMode('LIST')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'LIST' ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                            title="List View"
                        >
                            <List className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content List */}
                <div className="flex-1 overflow-y-auto p-6 bg-[#f8fafc] space-y-8 scrollbar-thin scrollbar-thumb-gray-200">
                    {Object.keys(groupedTasks).length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400">
                            <CheckCircle2 className="w-20 h-20 text-emerald-300 mb-6" />
                            <h3 className="text-2xl font-bold text-gray-600">สุดยอด! เคลียร์งานหมดแล้ว</h3>
                            <p className="text-base mt-2">พักผ่อนได้เลย หรือไปช่วยเพื่อนทำก็ได้นะ</p>
                        </div>
                    ) : (
                        Object.entries(groupedTasks).map(([groupTitle, items]) => {
                            const tasksInGroup = items as Task[]; // Cast to Task[] to fix unknown error
                            return (
                                <div key={groupTitle} className="animate-in slide-in-from-bottom-2 duration-500">
                                    <h3 className="text-base font-black text-gray-500 uppercase tracking-wider mb-4 flex items-center">
                                        <span className="w-3 h-3 rounded-full bg-indigo-400 mr-3"></span>
                                        {groupTitle} 
                                        <span className="ml-3 bg-gray-200 text-gray-600 text-xs px-2.5 py-1 rounded-full">{tasksInGroup.length}</span>
                                    </h3>
                                    
                                    <div className={`grid gap-4 ${viewMode === 'GRID' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                                        {tasksInGroup.map(task => {
                                            const channel = channels.find(c => c.id === task.channelId);
                                            const isOverdue = !task.isUnscheduled && isPast(task.endDate) && !isToday(task.endDate);
                                            
                                            // LIST VIEW RENDER
                                            if (viewMode === 'LIST') {
                                                return (
                                                    <div 
                                                        key={task.id}
                                                        onClick={() => onOpenTask(task)}
                                                        className={`
                                                            bg-white p-4 rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer flex items-center gap-4 group relative overflow-hidden
                                                            ${isOverdue ? 'border-l-4 border-l-red-400' : 'border-l-4 border-l-indigo-400'}
                                                        `}
                                                    >
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                {channel && (
                                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${channel.color}`}>
                                                                        {channel.name}
                                                                    </span>
                                                                )}
                                                                <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                                                                    {getMyRole(task)}
                                                                </span>
                                                                {isOverdue && (
                                                                    <span className="text-[10px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded animate-pulse">
                                                                        Late!
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <h4 className="font-bold text-gray-800 text-base truncate group-hover:text-indigo-600 transition-colors">
                                                                {task.title}
                                                            </h4>
                                                        </div>

                                                        <div className="flex items-center gap-4 text-right shrink-0">
                                                            <div className={`text-sm font-bold ${isOverdue ? 'text-red-500' : 'text-gray-500'}`}>
                                                                {task.isUnscheduled ? 'Stock' : format(task.endDate, 'd MMM')}
                                                            </div>
                                                            <div className="p-2 rounded-full bg-gray-50 text-gray-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                                                <ArrowRight className="w-5 h-5" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            }

                                            // GRID VIEW RENDER
                                            return (
                                                <div 
                                                    key={task.id} 
                                                    onClick={() => onOpenTask(task)}
                                                    className={`
                                                        bg-white p-5 rounded-3xl border-2 transition-all cursor-pointer group hover:shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[160px]
                                                        ${isOverdue ? 'border-red-100 hover:border-red-300' : 'border-gray-100 hover:border-indigo-300'}
                                                    `}
                                                >
                                                    {/* Left Accent */}
                                                    <div className={`absolute left-0 top-0 bottom-0 w-2 ${channel?.color.replace('text-', 'bg-').split(' ')[0] || 'bg-gray-300'}`}></div>

                                                    <div className="pl-4">
                                                        <div className="flex justify-between items-start mb-3">
                                                            <div className="flex flex-wrap gap-2">
                                                                {channel && (
                                                                    <span className="text-[10px] font-bold bg-gray-50 text-gray-500 px-2.5 py-1 rounded-lg border border-gray-100">
                                                                        {channel.name}
                                                                    </span>
                                                                )}
                                                                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
                                                                    {getMyRole(task)}
                                                                </span>
                                                            </div>
                                                            {isOverdue && (
                                                                <span className="text-[10px] font-bold text-white bg-red-500 px-2 py-1 rounded-lg animate-pulse shadow-sm">
                                                                    LATE
                                                                </span>
                                                            )}
                                                        </div>

                                                        <h4 className="font-black text-gray-800 text-lg line-clamp-2 group-hover:text-indigo-600 transition-colors mb-4 leading-tight">
                                                            {task.title}
                                                        </h4>
                                                        
                                                        <div className="flex justify-between items-end mt-auto border-t border-gray-50 pt-3">
                                                            <div className={`flex items-center text-xs font-bold ${isOverdue ? 'text-red-500' : 'text-gray-400'}`}>
                                                                <Calendar className="w-4 h-4 mr-1.5" />
                                                                {task.isUnscheduled ? 'No Date' : format(task.endDate, 'd MMM')}
                                                            </div>
                                                            <div className="p-2 rounded-full bg-gray-50 text-gray-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                                                                <ArrowRight className="w-4 h-4" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

            </div>
        </div>
    );
};

export default MyWorkloadModal;
