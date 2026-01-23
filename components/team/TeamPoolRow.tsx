
import React, { memo } from 'react';
import { Users, AlertCircle, Zap } from 'lucide-react';
import { Task, Status } from '../../types';
import { STATUS_COLORS } from '../../constants';
import { format, isToday } from 'date-fns';

interface TeamPoolRowProps {
    type: 'POOL' | 'UNASSIGNED';
    tasks: Task[];
    weekDays: Date[];
    onEditTask: (task: Task) => void;
    // Helper function moved from parent or duplicated to keep logic self-contained
    isTaskOnDay: (task: Task, day: Date) => boolean;
}

const TeamPoolRow: React.FC<TeamPoolRowProps> = ({ type, tasks, weekDays, onEditTask, isTaskOnDay }) => {
    if (tasks.length === 0) return null;

    const isPool = type === 'POOL';
    const config = isPool ? {
        bg: 'bg-indigo-50/30',
        border: 'border-indigo-100',
        iconBg: 'bg-indigo-100',
        iconColor: 'text-indigo-500',
        Icon: Users,
        title: 'กองกลาง (Pool)',
        sub: 'ช่วยกันทำเด้อ',
        titleColor: 'text-indigo-700',
        borderColor: 'border-indigo-200',
        ringColor: 'ring-indigo-100',
        itemIconColor: 'text-indigo-400'
    } : {
        bg: 'bg-red-50/30',
        border: 'border-red-100',
        iconBg: 'bg-red-100',
        iconColor: 'text-red-500',
        Icon: AlertCircle,
        title: 'งานลอย (Empty)',
        sub: 'รีบหาคนทำด่วน!',
        titleColor: 'text-red-600',
        borderColor: 'border-red-200',
        ringColor: 'ring-red-100',
        itemIconColor: 'text-red-400'
    };

    return (
        <div className={`grid grid-cols-8 min-h-[100px] group ${config.bg} border-b ${config.border}`}>
             <div className={`col-span-1 p-4 flex flex-col items-center justify-center text-center border-r ${config.border}`}>
                <div className={`w-12 h-12 rounded-2xl ${config.iconBg} flex items-center justify-center mb-2 ${config.iconColor} shadow-inner ${!isPool && 'animate-pulse'}`}>
                    <config.Icon className="w-6 h-6" />
                </div>
                <p className={`text-xs font-bold ${config.titleColor}`}>{config.title}</p>
                <p className="text-[9px] text-gray-400">{config.sub}</p>
             </div>
             {weekDays.map(day => {
                const dayTasks = tasks.filter(t => isTaskOnDay(t, day));
                return (
                    <div key={day.toString()} className={`col-span-1 border-l ${config.border} p-1.5 relative flex flex-col gap-1`}>
                        {dayTasks.map(task => (
                            <div key={task.id} onClick={() => onEditTask(task)} className={`text-[10px] p-2 rounded-lg cursor-pointer border shadow-sm truncate hover:scale-105 transition-transform font-medium flex items-center ${STATUS_COLORS[task.status as Status]} ${config.borderColor} bg-white ring-1 ${config.ringColor}`}>
                                {isPool ? <Zap className={`w-3 h-3 mr-1 ${config.itemIconColor}`} /> : <AlertCircle className={`w-3 h-3 mr-1 ${config.itemIconColor}`} />}
                                {task.title}
                            </div>
                        ))}
                    </div>
                );
             })}
        </div>
    );
};

export default memo(TeamPoolRow);
