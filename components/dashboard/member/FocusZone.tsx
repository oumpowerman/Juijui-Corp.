
import React, { useState } from 'react';
import { Task, Channel, User } from '../../../types';
import { AlertTriangle, Wrench, ArrowRight, CheckCircle2, Clock, List, Flame, Siren, Megaphone } from 'lucide-react';
import { isPast, isToday, addDays, isBefore, differenceInDays } from 'date-fns';
import TaskCategoryModal from '../../TaskCategoryModal';
import { isTaskCompleted } from '../../../constants';

// --- Card Component (Mission Alert Style) ---
interface CardItemProps {
    task: Task;
    isRevise?: boolean;
    channels: Channel[];
    users: User[];
    onOpenTask: (task: Task) => void;
}

const CardItem: React.FC<CardItemProps> = ({ task, isRevise = false, channels, users, onOpenTask }) => {
    const today = new Date();
    const isOverdue = isPast(task.endDate) && !isToday(task.endDate);
    const channel = channels.find(c => c.id === task.channelId);
    
    // Determine Assignee to show
    const assigneeId = task.assigneeIds?.[0] || task.ideaOwnerIds?.[0] || task.editorIds?.[0];
    const assignee = users.find(u => u.id === assigneeId);

    const getDeadlineText = (date: Date) => {
        const diff = differenceInDays(date, today);
        if (diff < 0) return `${Math.abs(diff)} วันที่แล้ว`;
        if (diff === 0) return 'ส่งวันนี้!';
        if (diff === 1) return 'พรุ่งนี้';
        return `อีก ${diff} วัน`;
    };

    return (
        <div 
            onClick={() => onOpenTask(task)}
            className={`
                relative p-4 rounded-2xl border-l-4 transition-all cursor-pointer group/item flex flex-col gap-2 shadow-sm hover:-translate-y-1 hover:shadow-md
                ${isRevise 
                    ? 'bg-red-50/80 border-l-red-400 border-y border-r border-white/50 hover:bg-red-50' 
                    : 'bg-amber-50/80 border-l-amber-400 border-y border-r border-white/50 hover:bg-amber-50'
                }
            `}
        >
            {/* Header: Status Pill */}
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                    {channel && (
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-md border bg-white/80 ${channel.color}`}>
                            {channel.name}
                        </span>
                    )}
                    {isRevise && (
                         <span className="flex items-center text-[9px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-md">
                            <Wrench className="w-3 h-3 mr-1" /> แก้ไข
                        </span>
                    )}
                    {!isRevise && isOverdue && (
                        <span className="flex items-center text-[9px] font-black text-white bg-red-500 px-2 py-0.5 rounded-md shadow-sm animate-pulse">
                            🔥 สายแล้ว!
                        </span>
                    )}
                     {!isRevise && !isOverdue && (
                        <span className="flex items-center text-[9px] font-black text-amber-700 bg-amber-200 px-2 py-0.5 rounded-md">
                            ⚡ ด่วน
                        </span>
                    )}
                </div>
            </div>

            {/* Content: Title */}
            <div>
                <h4 className="font-bold text-gray-800 text-sm leading-snug line-clamp-2 group-hover/item:text-indigo-700 transition-colors">
                    {task.title}
                </h4>
            </div>

            {/* Footer: User & Date */}
            <div className="flex items-center justify-between pt-2 border-t border-black/5 mt-1">
                {/* User Check */}
                <div className="flex items-center gap-2">
                    {assignee ? (
                        <div className="flex items-center gap-1.5 bg-white/60 pr-2 pl-1 py-0.5 rounded-full border border-black/5">
                            <img src={assignee.avatarUrl} className="w-4 h-4 rounded-full object-cover" />
                            <span className="text-[10px] font-bold text-gray-600 truncate max-w-[60px]">{assignee.name.split(' ')[0]}</span>
                        </div>
                    ) : (
                        <span className="text-[10px] text-gray-400 italic">...</span>
                    )}
                </div>

                {/* Date */}
                <div className={`flex items-center text-[10px] font-black ${isOverdue ? 'text-red-600' : 'text-gray-500'}`}>
                    <Clock className="w-3 h-3 mr-1" />
                    {getDeadlineText(task.endDate)}
                </div>
            </div>
            
            {/* Action Arrow (Hover) */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/item:opacity-100 transition-opacity transform group-hover/item:translate-x-1">
                <div className="p-1 bg-white rounded-full shadow-sm text-indigo-600">
                    <ArrowRight className="w-4 h-4" />
                </div>
            </div>
        </div>
    );
};

interface FocusZoneProps {
    tasks: Task[];
    channels: Channel[]; 
    users: User[];
    onOpenTask: (task: Task) => void;
}

const FocusZone: React.FC<FocusZoneProps> = ({ tasks, channels, users, onOpenTask }) => {
    const today = new Date();
    
    const [viewAllType, setViewAllType] = useState<'URGENT' | 'REVISE' | null>(null);

    // Filter Logic
    const urgentTasks = tasks.filter(t => {
        const isDone = isTaskCompleted(t.status as string);
        if (isDone) return false;
        if (t.isUnscheduled) return false;
        
        const isOverdue = isPast(t.endDate) && !isToday(t.endDate);
        const isDueSoon = isToday(t.endDate) || (isBefore(t.endDate, addDays(today, 2)) && !isPast(t.endDate));
        
        return isOverdue || isDueSoon || t.priority === 'URGENT';
    }).sort((a,b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime());

    const reviseTasks = tasks.filter(t => {
        if (t.isUnscheduled) return false;
        const s = t.status as string;
        // Strict checks for revise keywords still okay, but ensure not done
        if (isTaskCompleted(s)) return false; 
        
        return s === 'FEEDBACK' || s === 'REVISE' || s.includes('EDIT_DRAFT');
    });

    if (urgentTasks.length === 0 && reviseTasks.length === 0) {
        return (
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-[2.5rem] p-8 text-center shadow-sm border-4 border-white flex flex-col items-center justify-center h-full min-h-[300px]">
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm animate-bounce-slow">
                    <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                </div>
                <h2 className="text-xl font-black text-emerald-800 mb-1">
                    ว่างจัง... ฮูเล่! ✨
                </h2>
                <p className="text-emerald-600/70 text-sm font-medium">
                    ไม่มีงานด่วนหรือแก้ไข พักผ่อนได้เลย
                </p>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-rose-50/80 to-orange-50/80 backdrop-blur-md rounded-[2.5rem] border-4 border-white shadow-xl shadow-orange-100/50 p-5 h-full flex flex-col gap-5 relative overflow-hidden">
            
            {/* Background Blob */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-white opacity-20 rounded-full blur-3xl pointer-events-none -mr-10 -mt-10"></div>

            {/* Title */}
            <h3 className="text-lg font-black text-slate-700 px-1 flex items-center relative z-10">
                <div className="p-2 bg-white rounded-xl shadow-sm mr-3 text-red-500 animate-pulse">
                     <Siren className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">EMERGENCY</span>
                    <span>งานเข้า! (Mission)</span>
                </div>
            </h3>

            <div className="flex flex-col gap-4 relative z-10 overflow-y-auto pr-1 flex-1">
                {/* 1. REVISE ZONE (Top Priority) */}
                {reviseTasks.length > 0 && (
                    <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-center px-2">
                            <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider flex items-center">
                                <Wrench className="w-3 h-3 mr-1" /> ต้องแก้ (Revise)
                            </span>
                        </div>
                        <div className="space-y-2">
                            {reviseTasks.slice(0, 3).map(task => (
                                <CardItem 
                                    key={task.id} 
                                    task={task} 
                                    isRevise={true} 
                                    channels={channels} 
                                    users={users}
                                    onOpenTask={onOpenTask} 
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* 2. URGENT ZONE */}
                {urgentTasks.length > 0 && (
                    <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-center px-2 mt-2">
                             <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider flex items-center">
                                <Flame className="w-3 h-3 mr-1" /> ไฟลุก (Urgent)
                            </span>
                        </div>
                        <div className="space-y-2">
                            {urgentTasks.slice(0, reviseTasks.length > 0 ? 2 : 4).map(task => (
                                <CardItem 
                                    key={task.id} 
                                    task={task} 
                                    channels={channels} 
                                    users={users}
                                    onOpenTask={onOpenTask} 
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* View All Button */}
            {(urgentTasks.length > 3 || reviseTasks.length > 3) && (
                <button 
                    onClick={() => setViewAllType(reviseTasks.length > 0 ? 'REVISE' : 'URGENT')}
                    className="mt-auto w-full py-3 bg-white/80 border border-white text-slate-500 rounded-2xl text-xs font-bold hover:text-indigo-600 hover:bg-white transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                    <List className="w-3 h-3" /> ดูทั้งหมด
                </button>
            )}

            {/* Drill Down Modal */}
            <TaskCategoryModal 
                isOpen={!!viewAllType}
                onClose={() => setViewAllType(null)}
                title={viewAllType === 'REVISE' ? 'รายการงานแก้ / รอปรับ (Revise)' : 'รายการงานด่วน / ใกล้ส่ง (Urgent)'}
                tasks={viewAllType === 'REVISE' ? reviseTasks : urgentTasks}
                channels={channels}
                onEditTask={onOpenTask}
                colorTheme={viewAllType === 'REVISE' ? 'red' : 'orange'}
            />
        </div>
    );
};

export default FocusZone;
