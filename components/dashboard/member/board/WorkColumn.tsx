
import React from 'react';
import { Task, User, MasterOption } from '../../../../types';
import { Backpack, Play, Coffee, CheckCircle2, Zap } from 'lucide-react';
import WorkCard from './WorkCard';

type ColumnType = 'TODO' | 'DOING' | 'WAITING' | 'DONE';

interface WorkColumnProps {
    type: ColumnType;
    tasks: Task[];
    users: User[];
    masterOptions: MasterOption[]; // Add Prop
    isDroppable: boolean;
    onDropTask: (taskId: string, targetType: ColumnType) => void;
    onOpenTask: (task: Task) => void;
    onViewAll?: () => void;
}

const WorkColumn: React.FC<WorkColumnProps> = ({ 
    type, tasks, users, masterOptions, isDroppable, onDropTask, onOpenTask, onViewAll 
}) => {
    
    // Header Config
    const headerConfig = {
        'TODO': { icon: <Backpack className="w-4 h-4" />, title: "รอทำ (To Do)", bg: "bg-gray-50", text: "text-gray-600", border: "border-gray-200" },
        'DOING': { icon: <Play className="w-4 h-4" />, title: "ลุยงาน (Doing)", bg: "bg-indigo-50", text: "text-indigo-600", border: "border-indigo-200" },
        'WAITING': { icon: <Coffee className="w-4 h-4" />, title: "รอตรวจ (Waiting)", bg: "bg-orange-50", text: "text-orange-600", border: "border-orange-200" },
        'DONE': { icon: <CheckCircle2 className="w-4 h-4" />, title: "เสร็จแล้ว (Done)", bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-200" }
    }[type];

    const handleDragOver = (e: React.DragEvent) => {
        if (isDroppable) {
            e.preventDefault(); // Allow drop
            e.dataTransfer.dropEffect = "move";
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        if (!isDroppable) return;
        e.preventDefault();
        const taskId = e.dataTransfer.getData("text/plain");
        if (taskId) {
            onDropTask(taskId, type);
        }
    };

    const renderEmptyState = () => {
        const style = "text-center py-12 text-xs font-medium border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-2 h-full min-h-[150px]";
        
        if (type === 'TODO') return (
            <div className={`${style} border-gray-200 text-gray-400`}>
                <Backpack className="w-6 h-6 opacity-30" />
                <span>ไม่มีงานค้าง</span>
            </div>
        );
        if (type === 'DOING') return (
            <div className={`${style} border-indigo-200 text-indigo-400 bg-indigo-50/30`}>
                <Zap className="w-6 h-6 opacity-30" />
                <span>ลากงานมาวางที่นี่เพื่อเริ่มทำ!</span>
            </div>
        );
        if (type === 'WAITING') return (
            <div className={`${style} border-orange-200 text-orange-400 bg-orange-50/30`}>
                <Coffee className="w-6 h-6 opacity-30" />
                <span>ไม่มีงานรอตรวจ ชิวๆ เลย</span>
            </div>
        );
        return (
            <div className={`${style} border-emerald-100 text-emerald-400 bg-emerald-50/30`}>
                <CheckCircle2 className="w-6 h-6 opacity-30" />
                <span>ยังไม่มีงานที่เสร็จ</span>
            </div>
        );
    };

    // Container Style
    let containerStyle = "rounded-[1.5rem] p-3 flex flex-col h-full transition-colors duration-300";
    if (type === 'DOING') containerStyle += " bg-white border-2 border-indigo-100 shadow-sm relative";
    else if (type === 'WAITING') containerStyle += " bg-orange-50/30 border border-orange-100";
    else if (type === 'DONE') containerStyle += " bg-emerald-50/30 border border-emerald-100";
    else containerStyle += " bg-slate-50/50 border border-slate-200";

    // Logic: Limit items to 3
    const DISPLAY_LIMIT = 3;
    const hasMoreItems = tasks.length > DISPLAY_LIMIT;
    const badgeColor = hasMoreItems 
        ? 'bg-red-100 text-red-600 border-red-200 ring-1 ring-red-100' // Highlight if overflow
        : 'bg-white text-gray-600 border-gray-100'; // Normal

    return (
        <div 
            className={containerStyle}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            {/* Header */}
            <div className={`flex items-center justify-between mb-4 p-3 rounded-xl border ${headerConfig.border} ${headerConfig.bg}`}>
                <div className={`flex items-center gap-2 text-sm font-black uppercase tracking-tight ${headerConfig.text}`}>
                    {headerConfig.icon}
                    {headerConfig.title}
                </div>
                <span className={`text-xs font-black px-2 py-0.5 rounded-lg shadow-sm border transition-colors ${badgeColor}`}>
                    {tasks.length}
                </span>
            </div>

            {/* Content */}
            <div className={`flex-1 overflow-y-auto pr-1 scrollbar-hide flex flex-col gap-0 relative ${isDroppable ? 'min-h-[200px]' : ''}`}>
                {/* Drag Overlay Hint */}
                {isDroppable && tasks.length > 0 && (
                    <div className="absolute inset-0 bg-indigo-50/0 pointer-events-none transition-colors duration-300 peer-active:bg-indigo-50/20" />
                )}

                {tasks.length > 0 ? (
                    tasks.slice(0, DISPLAY_LIMIT).map(task => (
                        <WorkCard 
                            key={task.id}
                            task={task}
                            users={users}
                            masterOptions={masterOptions}
                            columnType={type}
                            isDraggable={type === 'TODO' || type === 'DOING'}
                            onDragStart={(e, id) => {
                                e.dataTransfer.setData("text/plain", id);
                                e.dataTransfer.effectAllowed = "move";
                            }}
                            onClick={onOpenTask}
                        />
                    ))
                ) : (
                    renderEmptyState()
                )}

                {(tasks.length > DISPLAY_LIMIT || type === 'DONE') && onViewAll && (
                    <button 
                        onClick={onViewAll} 
                        className={`w-full py-3 text-xs font-bold mt-2 border-t transition-colors rounded-b-xl hover:bg-white/50 ${
                            type === 'WAITING' ? 'text-orange-500 hover:text-orange-700 border-orange-200' :
                            type === 'DONE' ? 'text-emerald-600 hover:text-emerald-800 border-emerald-200 bg-emerald-50/50' :
                            'text-slate-400 hover:text-slate-600 border-slate-200'
                        }`}
                    >
                        {type === 'DONE' ? '📜 ดูประวัติงานเสร็จทั้งหมด' : `+ ดูทั้งหมด (${tasks.length})`}
                    </button>
                )}
            </div>
        </div>
    );
};

export default WorkColumn;
