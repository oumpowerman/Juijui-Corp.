
import React from 'react';
import { Task, User, Status, MasterOption } from '../../../../types';
import { STATUS_COLORS, STATUS_LABELS } from '../../../../constants';
import { Clock, ArrowRight, Zap, MonitorPlay, CheckSquare } from 'lucide-react';
import { format } from 'date-fns';

interface WorkCardProps {
    task: Task;
    users: User[];
    masterOptions: MasterOption[]; // Add Prop
    isDraggable: boolean;
    onDragStart: (e: React.DragEvent, taskId: string) => void;
    onClick: (task: Task) => void;
    columnType: 'TODO' | 'DOING' | 'WAITING' | 'DONE';
}

const WorkCard: React.FC<WorkCardProps> = ({ task, users, masterOptions, isDraggable, onDragStart, onClick, columnType }) => {
    const assigneeId = task.assigneeIds?.[0] || task.ideaOwnerIds?.[0];
    const user = users.find(u => u.id === assigneeId);

    // --- Type Config ---
    const isContent = task.type === 'CONTENT';
    const typeConfig = isContent ? {
        borderClass: 'border-l-[5px] border-l-purple-400',
        icon: <MonitorPlay className="w-4 h-4 text-purple-500 mt-0.5 shrink-0" />,
        badgeTheme: 'text-purple-600 bg-purple-50 border-purple-100'
    } : {
        borderClass: 'border-l-[5px] border-l-blue-400',
        icon: <CheckSquare className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />,
        badgeTheme: 'text-blue-600 bg-blue-50 border-blue-100'
    };

    // --- Status Label Helper ---
    const getStatusLabel = (status: string) => {
        // 1. Try to find label from Master Options
        const masterStatus = masterOptions.find(opt => 
            (opt.type === 'CONTENT_STATUS' || opt.type === 'TASK_STATUS') && 
            opt.key === status
        );
        
        // 2. Fallback to STATUS_LABELS or raw status
        return masterStatus?.label || STATUS_LABELS[status as Status] || status;
    };

    const statusLabel = getStatusLabel(task.status);

    // Visual styles based on column
    let cardStyle = 'bg-white border-y border-r border-gray-200'; // Remove default border-l to avoid conflict
    
    if (columnType === 'DOING') {
        cardStyle = 'bg-white border-y-2 border-r-2 border-indigo-100 shadow-md ring-1 ring-indigo-50';
    } else if (columnType === 'WAITING') {
        cardStyle = 'bg-orange-50/50 border-y border-r border-orange-100';
    } else if (columnType === 'DONE') {
        cardStyle = 'bg-white border-y border-r border-gray-100 opacity-80 grayscale-[0.3]';
    }

    const hoverStyle = isDraggable 
        ? 'hover:border-indigo-300 hover:shadow-lg cursor-grab active:cursor-grabbing hover:-translate-y-1' 
        : 'hover:border-gray-400 cursor-pointer';

    return (
        <div 
            draggable={isDraggable}
            onDragStart={(e) => onDragStart(e, task.id)}
            onClick={() => onClick(task)}
            className={`
                relative p-4 rounded-r-2xl rounded-l-md transition-all duration-200 flex flex-col gap-2 mb-3 group overflow-hidden
                ${cardStyle}
                ${hoverStyle}
                ${typeConfig.borderClass}
            `}
        >
            <div className="flex justify-between items-start">
                <span className={`text-[9px] px-2 py-0.5 rounded-md font-bold border truncate max-w-[120px] ${STATUS_COLORS[task.status as Status] || 'bg-gray-100'}`}>
                    {statusLabel}
                </span>
                
                {/* Icons based on state */}
                {columnType === 'DOING' && (
                     <div className="flex items-center gap-1 text-[9px] font-bold text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded-full">
                        <Zap className="w-3 h-3" /> Active
                     </div>
                )}
                {columnType === 'WAITING' && (
                    <Clock className="w-3.5 h-3.5 text-orange-400" />
                )}
            </div>
            
            {/* Title with Type Icon */}
            <div className="flex items-start gap-2">
                {typeConfig.icon}
                <h4 className={`font-bold text-sm line-clamp-2 leading-snug transition-colors ${columnType === 'DOING' ? 'text-indigo-900 group-hover:text-indigo-600' : 'text-gray-700'}`}>
                    {task.title}
                </h4>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-gray-50/50 mt-1">
                <div className="flex items-center gap-2">
                    {user ? (
                        <img src={user.avatarUrl} className="w-5 h-5 rounded-full object-cover border border-gray-200" title={user.name} />
                    ) : (
                        <div className="w-5 h-5 rounded-full bg-gray-100"></div>
                    )}
                    <span className="text-[10px] text-gray-400 font-medium">
                        {task.endDate ? format(new Date(task.endDate), 'd MMM') : 'No Date'}
                    </span>
                </div>

                {/* Additional badge for Content Format if available */}
                {task.contentFormat && (
                    <span className={`text-[8px] px-1.5 py-0.5 rounded border font-bold ${typeConfig.badgeTheme} max-w-[80px] truncate`}>
                        {task.contentFormat}
                    </span>
                )}

                {columnType !== 'DONE' && columnType !== 'WAITING' && !task.contentFormat && (
                    <div className={`p-1 rounded-full transition-colors ${columnType === 'DOING' ? 'bg-indigo-50 text-indigo-500' : 'bg-gray-50 text-gray-300'}`}>
                        <ArrowRight className="w-3 h-3" />
                    </div>
                )}
            </div>
        </div>
    );
};

export default WorkCard;
