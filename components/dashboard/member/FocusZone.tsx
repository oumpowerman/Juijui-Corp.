
import React, { useState } from 'react';
import { Task, Status, Channel, User } from '../../../types';
import { STATUS_COLORS, STATUS_LABELS } from '../../../constants';
import { AlertTriangle, Wrench, ArrowRight, CheckCircle2, Clock, List, Sparkles } from 'lucide-react';
import { isPast, isToday, addDays, isBefore, differenceInDays } from 'date-fns';
import TaskCategoryModal from '../../TaskCategoryModal';

// --- Card Component (Pastel Style) ---
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
                relative p-4 rounded-3xl border transition-all cursor-pointer group/item flex flex-col gap-3
                ${isRevise 
                    ? 'bg-red-50/40 border-red-100 hover:bg-white hover:shadow-lg hover:shadow-red-100 hover:border-red-200' 
                    : 'bg-white border-white hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-100 shadow-sm'
                }
            `}
        >
            {/* 1. Header: Channel & Status */}
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                    {channel && (
                        <span className={`text-[9px] font-bold px-2 py-1 rounded-lg border ${channel.color}`}>
                            {channel.name}
                        </span>
                    )}
                    {isOverdue && (
                        <span className="flex items-center text-[9px] font-black text-white bg-red-400 px-2 py-1 rounded-lg shadow-sm animate-pulse">
                            🔥 สายแล้ว!
                        </span>
                    )}
                </div>
                <div className={`p-1.5 rounded-full ${isRevise ? 'bg-red-100 text-red-500' : 'bg-gray-100 text-gray-400 group-hover/item:text-indigo-500 group-hover/item:bg-indigo-50'} transition-colors`}>
                    <ArrowRight className="w-3.5 h-3.5" />
                </div>
            </div>

            {/* 2. Content: Title */}
            <div>
                <h4 className="font-bold text-gray-700 text-sm leading-snug line-clamp-2 group-hover/item:text-indigo-700 transition-colors">
                    {task.title}
                </h4>
            </div>

            {/* 3. Footer: User & Date */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100/50">
                {/* User Check */}
                <div className="flex items-center gap-2">
                    {assignee ? (
                        <div className="flex items-center gap-2 bg-gray-50 pr-2 pl-1 py-0.5 rounded-full border border-gray-100">
                            <img src={assignee.avatarUrl} className="w-5 h-5 rounded-full object-cover" />
                            <span className="text-[10px] font-bold text-gray-600 truncate max-w-[60px]">{assignee.name.split(' ')[0]}</span>
                        </div>
                    ) : (
                        <span className="text-[10px] text-gray-300 italic">No Assignee</span>
                    )}
                </div>

                {/* Date */}
                <div className={`flex items-center text-[10px] font-bold ${isOverdue ? 'text-red-500' : 'text-gray-400'}`}>
                    <Clock className="w-3 h-3 mr-1" />
                    {getDeadlineText(task.endDate)}
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
        const isDone = t.status === 'DONE' || t.status === 'APPROVE';
        if (isDone) return false;
        if (t.isUnscheduled) return false;
        
        const isOverdue = isPast(t.endDate) && !isToday(t.endDate);
        const isDueSoon = isToday(t.endDate) || (isBefore(t.endDate, addDays(today, 2)) && !isPast(t.endDate));
        
        return isOverdue || isDueSoon || t.priority === 'URGENT';
    }).sort((a,b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime());

    const reviseTasks = tasks.filter(t => {
        if (t.isUnscheduled) return false;
        const s = t.status as string;
        return s === 'FEEDBACK' || s === 'REVISE' || s.includes('EDIT_DRAFT');
    });

    if (urgentTasks.length === 0 && reviseTasks.length === 0) {
        return (
            <div className="bg-white/60 backdrop-blur-md rounded-[2.5rem] p-8 text-center shadow-sm border border-white flex flex-col items-center justify-center h-full min-h-[300px]">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-4 animate-bounce-slow">
                    <CheckCircle2 className="w-12 h-12 text-green-500" />
                </div>
                <h2 className="text-xl font-black text-gray-700 mb-1">
                    ว่างจัง... ฮูเล่! ✨
                </h2>
                <p className="text-gray-400 text-sm">
                    ไม่มีงานด่วนหรือแก้ไข พักผ่อนได้เลย
                </p>
            </div>
        );
    }

    return (
        <div className="bg-white/60 backdrop-blur-md rounded-[2.5rem] border border-white shadow-sm p-5 h-full flex flex-col gap-6">
            
            {/* Title */}
            <h3 className="text-lg font-black text-gray-700 px-2 flex items-center">
                <span className="bg-rose-100 text-rose-500 p-1.5 rounded-xl mr-2">🔥</span> 
                จุดโฟกัส (Focus Zone)
            </h3>

            {/* 1. REVISE ZONE (Top Priority) */}
            {reviseTasks.length > 0 && (
                <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center px-2">
                        <span className="text-xs font-bold text-red-500 uppercase tracking-wider flex items-center">
                            <Wrench className="w-3 h-3 mr-1" /> งานแก้ (Revise)
                        </span>
                        <span className="bg-red-100 text-red-600 text-[10px] font-black px-2 py-0.5 rounded-full">{reviseTasks.length}</span>
                    </div>
                    <div className="space-y-3">
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
                <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center px-2">
                         <span className="text-xs font-bold text-orange-500 uppercase tracking-wider flex items-center">
                            <AlertTriangle className="w-3 h-3 mr-1" /> ด่วนจี๋ (Urgent)
                        </span>
                        <span className="bg-orange-100 text-orange-600 text-[10px] font-black px-2 py-0.5 rounded-full">{urgentTasks.length}</span>
                    </div>
                    <div className="space-y-3">
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

            {/* View All Button */}
            {(urgentTasks.length > 3 || reviseTasks.length > 3) && (
                <button 
                    onClick={() => setViewAllType(reviseTasks.length > 0 ? 'REVISE' : 'URGENT')}
                    className="mt-auto w-full py-3 bg-white border border-gray-200 text-gray-500 rounded-2xl text-xs font-bold hover:text-indigo-600 hover:border-indigo-200 transition-all flex items-center justify-center gap-2"
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
