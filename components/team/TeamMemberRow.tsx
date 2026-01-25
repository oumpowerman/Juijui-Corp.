
import React, { memo, useMemo } from 'react';
import { User, Task, Status } from '../../types';
import { Crown, BatteryFull, BatteryCharging, Battery, BatteryWarning, Users, Briefcase as JobIcon, Sparkles } from 'lucide-react';
import { STATUS_COLORS, WORK_STATUS_CONFIG } from '../../constants';
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

// 🎨 Cute Color Palettes for Bubbles
const BUBBLE_THEMES = [
    { name: 'Pink', bg: 'from-pink-50 via-white to-rose-50', border: 'border-pink-200', text: 'text-pink-600', icon: 'text-pink-400 fill-pink-100', shadow: 'rgba(236, 72, 153, 0.2)' },
    { name: 'Blue', bg: 'from-sky-50 via-white to-blue-50', border: 'border-sky-200', text: 'text-sky-600', icon: 'text-sky-400 fill-sky-100', shadow: 'rgba(14, 165, 233, 0.2)' },
    { name: 'Purple', bg: 'from-purple-50 via-white to-violet-50', border: 'border-purple-200', text: 'text-purple-600', icon: 'text-purple-400 fill-purple-100', shadow: 'rgba(168, 85, 247, 0.2)' },
    { name: 'Orange', bg: 'from-orange-50 via-white to-amber-50', border: 'border-orange-200', text: 'text-orange-600', icon: 'text-orange-400 fill-orange-100', shadow: 'rgba(249, 115, 22, 0.2)' },
    { name: 'Green', bg: 'from-emerald-50 via-white to-green-50', border: 'border-emerald-200', text: 'text-emerald-600', icon: 'text-emerald-400 fill-emerald-100', shadow: 'rgba(16, 185, 129, 0.2)' },
    { name: 'Teal', bg: 'from-teal-50 via-white to-cyan-50', border: 'border-teal-200', text: 'text-teal-600', icon: 'text-teal-400 fill-teal-100', shadow: 'rgba(20, 184, 166, 0.2)' },
    { name: 'Rose', bg: 'from-rose-50 via-white to-red-50', border: 'border-rose-200', text: 'text-rose-600', icon: 'text-rose-400 fill-rose-100', shadow: 'rgba(225, 29, 72, 0.2)' },
    { name: 'Indigo', bg: 'from-indigo-50 via-white to-violet-50', border: 'border-indigo-200', text: 'text-indigo-600', icon: 'text-indigo-400 fill-indigo-100', shadow: 'rgba(79, 70, 229, 0.2)' },
];

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

    // 🎲 Daily Random Color: Combines UserID + Today's Date String to create a seed
    const bubbleTheme = useMemo(() => {
        if (!user.id) return BUBBLE_THEMES[0];
        
        const todayStr = new Date().toDateString(); // e.g., "Mon Oct 27 2023" (Changes every day)
        const seedString = user.id + todayStr; 
        
        let hash = 0;
        for (let i = 0; i < seedString.length; i++) {
            hash = seedString.charCodeAt(i) + ((hash << 5) - hash);
        }
        
        const index = Math.abs(hash) % BUBBLE_THEMES.length;
        return BUBBLE_THEMES[index];
    }, [user.id]); // Re-calculates if user changes or component remounts (effectively daily if user refreshes)

    // 🎭 Random Animation Delay
    const animDelay = useMemo(() => Math.random() * 2, []);

    const workload = tasks.length;
    const statusInfo = getJuijuiScore(workload);
    const levelProgress = (user.xp % 1000) / 10;
    const isMe = user.id === currentUser?.id;

    // Status Indicator Color Logic
    const getStatusColor = (status: string) => {
        switch(status) {
            case 'ONLINE': return 'bg-green-500 ring-green-200';
            case 'BUSY': return 'bg-red-500 ring-red-200';
            case 'SICK': return 'bg-orange-500 ring-orange-200';
            case 'VACATION': return 'bg-blue-500 ring-blue-200';
            case 'MEETING': return 'bg-purple-500 ring-purple-200';
            default: return 'bg-gray-400 ring-gray-200';
        }
    };
    
    const workStatusConfig = WORK_STATUS_CONFIG[user.workStatus || 'ONLINE'];
    const statusColorClass = getStatusColor(user.workStatus || 'ONLINE');

    return (
        <div className={`grid grid-cols-8 min-h-[130px] group transition-colors relative ${isMe ? 'bg-indigo-50/10' : 'hover:bg-gray-50/30'}`}>
            <style>{`
                @keyframes wiggle-float {
                    0%, 100% { transform: translateY(0) rotate(-3deg); }
                    50% { transform: translateY(-6px) rotate(3deg); }
                }
                .animate-wiggle-float {
                    animation: wiggle-float 3.5s ease-in-out infinite;
                }
            `}</style>

            {/* Member Profile Column */}
            <div 
                className="col-span-1 p-3 flex flex-col items-center text-center border-r border-gray-100 bg-white z-10 relative cursor-pointer hover:bg-gray-50 transition-colors pt-6"
                onClick={() => onSelectUser(user)}
            >
                <div className="relative mb-2 mt-2">
                    {/* 💬 Feeling Bubble (Updated: Daily Random Color) */}
                    {user.feeling && (
                        <div 
                            className="absolute -top-12 left-1/2 transform -translate-x-1/2 z-30 animate-wiggle-float w-max max-w-[160px] origin-bottom-center"
                            style={{ animationDelay: `${animDelay}s` }}
                        >
                            <div className={`
                                relative
                                bg-gradient-to-r ${bubbleTheme.bg}
                                border-2 ${bubbleTheme.border}
                                ${bubbleTheme.text} font-bold text-[10px]
                                px-3 py-1.5 
                                rounded-2xl rounded-bl-none
                                flex items-center gap-1.5
                            `}
                            style={{ boxShadow: `3px 3px 0px ${bubbleTheme.shadow}` }}
                            >
                                <Sparkles className={`w-3 h-3 ${bubbleTheme.icon} shrink-0`} />
                                <span className="truncate italic">"{user.feeling}"</span>
                                
                                {/* Inner White Triangle Mask */}
                                <div className="absolute -bottom-[5px] left-[0px] w-0 h-0 
                                    border-t-[6px] border-r-[6px] 
                                    border-t-white 
                                    border-r-transparent">
                                </div>
                                {/* Border Triangle */}
                                <div className={`absolute -bottom-[8px] left-[-2px] w-0 h-0 border-t-[8px] border-r-[8px] border-r-transparent z-[-1]`}
                                     style={{ borderTopColor: 'currentColor', opacity: 0.3 }}
                                ></div>
                             </div>
                        </div>
                    )}

                    {/* 🖼️ Avatar Container */}
                    <div className="relative">
                        <div className={`p-1 rounded-full border-2 transition-transform hover:scale-105 duration-300 ${isMe ? 'border-indigo-200' : 'border-gray-100'}`}>
                            <img src={user.avatarUrl} className="w-12 h-12 rounded-full object-cover" alt={user.name} />
                        </div>
                        
                        {/* 🔴 STATUS INDICATOR (Top-Left) */}
                        <div 
                            className={`absolute -top-1 -left-1 w-4 h-4 rounded-full border-2 border-white ring-2 ${statusColorClass} shadow-sm z-20 flex items-center justify-center`}
                            title={`Status: ${workStatusConfig.label}`}
                        >
                             {/* Optional: Tiny icon inside dot if needed, but solid color is cleaner */}
                        </div>

                        {/* 👑 Admin Badge (Top-Right) */}
                        {user.role === 'ADMIN' && (
                            <span className="absolute -top-2 -right-2 bg-yellow-400 text-white p-0.5 rounded-full border-2 border-white shadow-sm z-20">
                                <Crown className="w-3 h-3 fill-white" />
                            </span>
                        )}
                        
                        {/* 🆙 Level Badge (Bottom-Right) */}
                        <div className="absolute -bottom-1 -right-1 bg-indigo-600 text-white text-[8px] px-1.5 rounded-full border-2 border-white font-bold shadow-sm z-20">
                            Lv.{user.level}
                        </div>
                    </div>
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
