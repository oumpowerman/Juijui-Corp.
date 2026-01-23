
import React, { memo } from 'react';
import { User, Task, Status } from '../../types';
import { Crown, BatteryFull, BatteryCharging, Battery, BatteryWarning, Users, Briefcase as JobIcon } from 'lucide-react';
import { STATUS_COLORS } from '../../constants';
import UserStatusBadge from '../UserStatusBadge';
import { isToday } from 'date-fns';

interface TeamMemberRowProps {
    user: User;
    tasks: Task[]; // Pre-filtered tasks for this user
    weekDays: Date[];
    currentUser: User | null;
    onEditTask: (task: Task) => void;
    onSelectUser: (user: User) => void;
    isTaskOnDay: (task: Task, day: Date) => boolean;
}

const TeamMemberRow: React.FC<TeamMemberRowProps> = ({ 
    user, 
    tasks, 
    weekDays, 
    currentUser, 
    onEditTask, 
    onSelectUser,
    isTaskOnDay 
}) => {
    // Logic: Calculate Workload Status
    const getJuijuiScore = (workload: number) => {
        if (workload === 0) return { text: 'ว่างจัด (Free)', color: 'text-green-600 bg-green-100', icon: <BatteryFull className="w-4 h-4" /> };
        if (workload <= 3) return { text: 'ชิวๆ (Chill)', color: 'text-blue-600 bg-blue-100', icon: <BatteryCharging className="w-4 h-4" /> };
        if (workload <= 6) return { text: 'ตึงมือ (Busy)', color: 'text-orange-600 bg-orange-100', icon: <Battery className="w-4 h-4" /> };
        return { text: 'งานเดือด! (On Fire)', color: 'text-red-600 bg-red-100 animate-pulse', icon: <BatteryWarning className="w-4 h-4" /> };
    };

    const workload = tasks.length;
    const statusInfo = getJuijuiScore(workload);
    const levelProgress = (user.xp % 1000) / 10;
    const isMe = user.id === currentUser?.id;

    return (
        <div className={`grid grid-cols-8 min-h-[130px] group transition-colors relative ${isMe ? 'bg-indigo-50/10' : 'hover:bg-gray-50/30'}`}>
            {/* Member Profile Column */}
            <div 
                className="col-span-1 p-3 flex flex-col items-center text-center border-r border-gray-100 bg-white z-10 relative cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => onSelectUser(user)}
            >
                {/* User Status Badge */}
                <div className="mb-2">
                    <UserStatusBadge user={user} size="sm" showLabel={false} />
                </div>

                <div className="relative mb-2 mt-1">
                    <div className={`p-1 rounded-full border-2 ${isMe ? 'border-indigo-200' : 'border-gray-100'}`}>
                        <img src={user.avatarUrl} className="w-12 h-12 rounded-full object-cover" alt={user.name} />
                    </div>
                    {user.role === 'ADMIN' && <span className="absolute -top-1 -right-1 bg-yellow-400 text-white p-0.5 rounded-full border-2 border-white shadow-sm"><Crown className="w-3 h-3 fill-white" /></span>}
                    <div className="absolute -bottom-1 -right-1 bg-indigo-600 text-white text-[9px] px-1.5 rounded-full border-2 border-white font-bold shadow-sm">Lv.{user.level}</div>
                </div>
                
                <p className={`text-xs font-bold truncate w-full mb-0.5 ${isMe ? 'text-indigo-700' : 'text-gray-800'}`}>{(user.name || 'Unknown').split(' ')[0]}</p>
                <p className="text-[9px] text-gray-400 font-medium mb-2">{user.position || 'Member'}</p>
                
                {/* XP Bar */}
                <div className="w-full bg-gray-100 rounded-full h-1 overflow-hidden mb-2">
                    <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${levelProgress}%` }}></div>
                </div>
                
                {/* Workload Pill */}
                <div className={`text-[9px] px-2 py-0.5 rounded-md font-bold flex items-center justify-center gap-1 w-full border ${statusInfo.color.replace('text-', 'border-').replace('bg-', 'bg-opacity-20 ')} bg-white text-gray-600`}>
                    {statusInfo.icon}
                    {workload} Tasks
                </div>
            </div>

            {/* Calendar Grid for this user */}
            {weekDays.map(day => {
                const dayTasks = tasks.filter(t => isTaskOnDay(t, day));
                return (
                    <div key={day.toString()} className={`col-span-1 border-l border-gray-100 p-1.5 relative flex flex-col gap-1 ${isToday(day) ? 'bg-indigo-50/20' : ''}`}>
                        {dayTasks.map(task => {
                            const isTeamTask = task.assigneeType === 'TEAM';
                            
                            const cardStyle = isTeamTask 
                                ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200 text-emerald-900 shadow-sm ring-1 ring-emerald-100' // Team Style
                                : `bg-white ${STATUS_COLORS[task.status as Status]}`; // Solo Style (Standard)

                            return (
                                <div key={task.id} onClick={() => onEditTask(task)} className={`text-[10px] p-1.5 rounded-lg cursor-pointer border shadow-sm truncate hover:scale-105 transition-transform font-medium flex items-center group/task relative ${cardStyle}`}>
                                    {isTeamTask ? (
                                        <Users className="w-3 h-3 mr-1 text-emerald-600 shrink-0" /> // Team Icon
                                    ) : (
                                        <JobIcon className="w-3 h-3 mr-1 opacity-50 shrink-0" />
                                    )}
                                    <span className="truncate">{task.title}</span>
                                </div>
                            );
                        })}
                    </div>
                );
            })}
        </div>
    );
};

export default memo(TeamMemberRow);
