
import React, { useState } from 'react';
import { Task, Channel, User, Status, MasterOption } from '../types';
import { STATUS_LABELS, STATUS_COLORS, PLATFORM_ICONS } from '../constants';
import { Plus, MoreHorizontal, Calendar, User as UserIcon, Filter, Check, AlertCircle, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import MentorTip from './MentorTip';

interface BoardViewProps {
    tasks: Task[];
    channels: Channel[];
    users: User[];
    masterOptions: MasterOption[]; // New Prop
    onEditTask: (task: Task) => void;
    onAddTask: (status: Status) => void;
    onUpdateStatus: (task: Task, newStatus: Status) => void;
    onOpenSettings: () => void;
}

const BoardView: React.FC<BoardViewProps> = ({ 
    tasks, 
    channels, 
    users, 
    masterOptions,
    onEditTask, 
    onAddTask, 
    onUpdateStatus 
}) => {
    const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
    const [selectedChannelId, setSelectedChannelId] = useState<string>('ALL');

    // --- Dynamic Columns Logic ---
    // 1. Get Status Options from Master Data
    const statusOptions = masterOptions
        .filter(o => o.type === 'STATUS' && o.isActive)
        .sort((a, b) => a.sortOrder - b.sortOrder);

    // 2. If no statuses defined, use fallback logic or empty state
    // For now, we will show an empty state guiding user to settings if empty.
    const hasStatuses = statusOptions.length > 0;

    const handleDragStart = (e: React.DragEvent, taskId: string) => {
        setDraggedTaskId(taskId);
        e.dataTransfer.setData('taskId', taskId);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault(); // Allow drop
    };

    const handleDrop = (e: React.DragEvent, statusKey: string) => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData('taskId');
        const task = tasks.find(t => t.id === taskId);
        
        // Cast string key to Status enum (assuming data integrity is managed via Master Data)
        if (task && task.status !== statusKey) {
            onUpdateStatus(task, statusKey as Status);
        }
        setDraggedTaskId(null);
    };

    const getChannelInfo = (channelId?: string) => {
        return channels.find(c => c.id === channelId);
    };

    const getAssigneeAvatar = (userIds?: string[]) => {
        if (!userIds || userIds.length === 0) return null;
        const user = users.find(u => u.id === userIds[0]);
        return user?.avatarUrl;
    };

    if (!hasStatuses) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center animate-in fade-in">
                <div className="bg-red-50 p-6 rounded-3xl border-2 border-red-100 max-w-md">
                    <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-red-900 mb-2">ยังไม่ได้ตั้งค่าสถานะงาน (Status)</h3>
                    <p className="text-red-600 mb-6 text-sm">
                        ระบบต้องการข้อมูล Status เพื่อสร้างกระดานบอร์ด<br/>
                        กรุณาไปที่เมนู <span className="font-bold">Admin {'>'} ตั้งค่าระบบ {'>'} Status</span>
                    </p>
                    <div className="flex justify-center">
                        <span className="text-xs text-gray-400 bg-white px-3 py-2 rounded-lg border border-gray-200">
                            หรือติดต่อ Admin ให้ตั้งค่า
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-140px)] flex flex-col animate-in fade-in duration-500">
            <MentorTip variant="blue" messages={["ลากการ์ดงานไปมาเพื่อเปลี่ยนสถานะได้เลย (Drag & Drop)", "กดที่ชื่อช่องด้านบนเพื่อดูเฉพาะงานของช่องนั้นๆ ได้นะ"]} className="mb-4 flex-shrink-0" />
            
            {/* --- CHANNEL FILTER CHIPS --- */}
            <div className="flex items-center gap-2 overflow-x-auto pb-4 px-1 flex-shrink-0 scrollbar-hide">
                <div className="flex items-center text-xs font-bold text-gray-400 uppercase mr-2 shrink-0">
                    <Filter className="w-3 h-3 mr-1" /> กรองช่อง:
                </div>
                
                <button
                    onClick={() => setSelectedChannelId('ALL')}
                    className={`
                        px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap shadow-sm border shrink-0 flex items-center
                        ${selectedChannelId === 'ALL'
                            ? 'bg-gray-800 text-white border-gray-800 ring-2 ring-gray-300' 
                            : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50 hover:text-indigo-600'}
                    `}
                >
                    {selectedChannelId === 'ALL' && <Check className="w-3 h-3 mr-1" />}
                    รวมทุกช่อง (All)
                </button>

                {channels.map(channel => {
                    const isActive = selectedChannelId === channel.id;
                    const colorClass = (channel.color || 'bg-indigo-100').split(' ')[0] || 'bg-indigo-100'; // Fallback

                    return (
                        <button
                            key={channel.id}
                            onClick={() => setSelectedChannelId(channel.id)}
                            className={`
                                px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap shadow-sm border shrink-0 flex items-center
                                ${isActive 
                                    ? `bg-white text-gray-800 border-indigo-500 ring-2 ring-indigo-200` 
                                    : `bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:-translate-y-0.5`}
                            `}
                        >
                            <span className={`w-2 h-2 rounded-full mr-1.5 ${colorClass}`}></span>
                            {channel.name}
                            {isActive && <Check className="w-3 h-3 ml-1.5 text-indigo-600" />}
                        </button>
                    );
                })}
            </div>

            {/* --- BOARD COLUMNS (DYNAMIC) --- */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
                <div className="flex h-full gap-4 min-w-max px-2">
                    {statusOptions.map((option) => {
                        const statusKey = option.key; // e.g. "TODO", "SCRIPT"
                        const statusLabel = option.label;
                        const statusColor = option.color || 'bg-gray-100 text-gray-600';

                        // Filter Tasks
                        const columnTasks = tasks.filter(t => {
                            const matchStatus = t.status === statusKey;
                            const matchChannel = selectedChannelId === 'ALL' || t.channelId === selectedChannelId;
                            return matchStatus && matchChannel;
                        });

                        return (
                            <div 
                                key={option.id}
                                className="w-80 flex flex-col bg-gray-50/50 rounded-xl border border-gray-200/60 max-h-full"
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, statusKey)}
                            >
                                {/* Column Header (Increased Font Size) */}
                                <div className="p-4 flex justify-between items-center bg-white/50 backdrop-blur-sm rounded-t-xl border-b border-gray-100 sticky top-0 z-10">
                                    <div className="flex items-center gap-2 max-w-[80%]">
                                        <span className={`px-3 py-1 rounded-lg text-base font-bold border truncate ${statusColor}`}>
                                            {statusLabel}
                                        </span>
                                        <span className="text-sm text-gray-400 font-bold bg-white px-2 py-0.5 rounded-md border border-gray-100">
                                            {columnTasks.length}
                                        </span>
                                    </div>
                                    <div className="flex gap-1">
                                        <button onClick={() => onAddTask(statusKey as Status)} className="p-1.5 hover:bg-gray-200 rounded text-gray-400 hover:text-gray-600 transition-colors">
                                            <Plus className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Task List */}
                                <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin scrollbar-thumb-gray-200">
                                    {columnTasks.length === 0 && (
                                        <div className="h-20 flex items-center justify-center text-sm text-gray-300 italic font-medium">
                                            ว่าง
                                        </div>
                                    )}
                                    
                                    {columnTasks.map(task => {
                                        const channel = getChannelInfo(task.channelId);
                                        const avatar = getAssigneeAvatar(task.assigneeIds.length > 0 ? task.assigneeIds : task.ideaOwnerIds);
                                        const channelColorClass = (channel?.color || '').split(' ')[0] || 'bg-gray-100';

                                        return (
                                            <div
                                                key={task.id}
                                                draggable
                                                onDragStart={(e) => handleDragStart(e, task.id)}
                                                onClick={() => onEditTask(task)}
                                                className={`
                                                    bg-white p-4 rounded-xl shadow-sm border border-gray-200 cursor-grab active:cursor-grabbing hover:shadow-md transition-all group relative animate-in zoom-in-95 duration-200
                                                    ${draggedTaskId === task.id ? 'opacity-50 border-dashed border-indigo-400' : ''}
                                                `}
                                            >
                                                {/* Cover/Tag Line (Increased Font Size) */}
                                                <div className="flex items-center gap-1.5 mb-2.5 flex-wrap">
                                                    {channel && (
                                                        <span className={`text-xs px-2 py-1 rounded border font-bold truncate max-w-[120px] ${channel.color}`}>
                                                            {channel.name}
                                                        </span>
                                                    )}
                                                    {task.contentFormat && (
                                                        <span className="text-xs bg-purple-50 text-purple-600 px-2 py-1 rounded border border-purple-100 font-bold">
                                                            {task.contentFormat}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Title (Increased Font Size) */}
                                                <h4 className="text-lg font-bold text-gray-800 leading-snug mb-3 group-hover:text-indigo-600 transition-colors">
                                                    {task.title}
                                                </h4>

                                                {/* Footer Info */}
                                                <div className="flex justify-between items-end pt-2 border-t border-gray-50">
                                                    <div className="flex items-center text-xs font-bold text-gray-500 bg-gray-50 px-2 py-1 rounded-lg">
                                                        <Calendar className="w-3.5 h-3.5 mr-1.5" />
                                                        {task.isUnscheduled ? 'No Date' : format(task.endDate, 'd MMM')}
                                                    </div>
                                                    
                                                    {avatar ? (
                                                        <img src={avatar} className="w-6 h-6 rounded-full object-cover border border-gray-100" />
                                                    ) : (
                                                        <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-300">
                                                            <UserIcon className="w-3.5 h-3.5" />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    
                                    {/* Drop Zone Indicator */}
                                    <div className="h-12 border-2 border-dashed border-transparent transition-colors rounded-xl flex items-center justify-center text-sm font-bold text-transparent hover:border-indigo-200 hover:text-indigo-300">
                                        Drop here
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default BoardView;
