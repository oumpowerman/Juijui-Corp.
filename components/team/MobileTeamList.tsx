
import React, { useState } from 'react';
import { User, Task, Status } from '../../types';
import { format, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { STATUS_COLORS } from '../../constants';
import { ChevronDown, ChevronUp, Calendar } from 'lucide-react';

interface MobileTeamListProps {
    users: User[];
    userTaskMap: Map<string, Task[]>;
    weekDays: Date[];
    onEditTask: (task: Task) => void;
}

const WORKLOAD_LEVELS = [
    { max: 5, color: 'bg-slate-200', text: 'text-slate-500', label: 'Idle' },
    { max: 15, color: 'bg-emerald-300', text: 'text-emerald-700', label: 'Light' },
    { max: 25, color: 'bg-sky-400', text: 'text-sky-700', label: 'Comfy' },
    { max: 35, color: 'bg-indigo-500', text: 'text-white', label: 'Productive' },
    { max: 45, color: 'bg-orange-400', text: 'text-white', label: 'Busy' },
    { max: 55, color: 'bg-red-500', text: 'text-white', label: 'Heavy' },
    { max: 999, color: 'bg-rose-800', text: 'text-white', label: 'Overload' }
];

interface MobileTeamCardProps {
    user: User;
    tasks: Task[];
    onEditTask: (t: Task) => void;
}

const MobileTeamCard: React.FC<MobileTeamCardProps> = ({ user, tasks, onEditTask }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const today = new Date();

    // Calculate Workload
    const weeklyHours = tasks
        .filter(t => !t.isUnscheduled && t.endDate)
        .reduce((sum, t) => sum + (t.estimatedHours || 0), 0);

    const workloadLevel = WORKLOAD_LEVELS.find(l => weeklyHours <= l.max) || WORKLOAD_LEVELS[WORKLOAD_LEVELS.length - 1];

    // Filter Today's Tasks
    const todaysTasks = tasks.filter(t => {
        if (!t.startDate || !t.endDate) return false;
        const start = startOfDay(new Date(t.startDate));
        const end = endOfDay(new Date(t.endDate));
        return isWithinInterval(today, { start, end });
    });

    const otherTasks = tasks.filter(t => !todaysTasks.includes(t));

    return (
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm mb-3">
            <div className="flex items-center gap-3">
                <div className="relative">
                    {user.avatarUrl ? (
                        <img src={user.avatarUrl} className="w-12 h-12 rounded-full object-cover border border-gray-100" />
                    ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-500">
                            {user.name.charAt(0)}
                        </div>
                    )}
                    <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${user.workStatus === 'ONLINE' ? 'bg-green-500' : user.workStatus === 'BUSY' ? 'bg-red-500' : 'bg-gray-300'}`}></div>
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                        <h4 className="font-bold text-gray-800 truncate text-sm">{user.name}</h4>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${workloadLevel.color} ${workloadLevel.text}`}>
                            {weeklyHours}h
                        </span>
                    </div>
                    <p className="text-xs text-gray-500">{user.position || 'Member'}</p>
                    
                    {/* Workload Bar */}
                    <div className="h-1.5 w-full bg-gray-100 rounded-full mt-2 overflow-hidden">
                        <div className={`h-full ${workloadLevel.color}`} style={{ width: `${Math.min((weeklyHours / 40) * 100, 100)}%` }}></div>
                    </div>
                </div>
            </div>

            {/* Today's Focus */}
            <div className="mt-3 pt-3 border-t border-gray-50">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Today's Focus</p>
                {todaysTasks.length > 0 ? (
                    <div className="space-y-2">
                        {todaysTasks.map(task => (
                            <div 
                                key={task.id} 
                                onClick={() => onEditTask(task)} 
                                className={`p-2 rounded-lg border text-xs font-medium cursor-pointer flex items-center justify-between ${STATUS_COLORS[task.status as any] || 'bg-gray-100'}`}
                            >
                                <span className="truncate flex-1">{task.title}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-xs text-gray-400 italic bg-gray-50 p-2 rounded-lg text-center">ไม่มีงานที่ต้องทำวันนี้</p>
                )}
            </div>

            {/* Expand for others */}
            {otherTasks.length > 0 && (
                <div className="mt-3">
                    <button 
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="w-full flex items-center justify-center gap-1 text-[10px] font-bold text-indigo-600 bg-indigo-50 py-2 rounded-lg hover:bg-indigo-100 transition-colors"
                    >
                        {isExpanded ? 'ซ่อนงานอื่นๆ' : `ดูงานอื่นอีก ${otherTasks.length} งาน`}
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                    
                    {isExpanded && (
                        <div className="mt-2 space-y-2 animate-in slide-in-from-top-2">
                             {otherTasks.map(task => (
                                <div key={task.id} onClick={() => onEditTask(task)} className="p-2 rounded-lg border border-gray-100 bg-gray-50 text-xs text-gray-600 cursor-pointer flex justify-between items-center hover:bg-white transition-colors">
                                    <span className="truncate flex-1 font-medium">{task.title}</span>
                                    <span className="text-[9px] text-gray-400 whitespace-nowrap ml-2 flex items-center bg-white px-1.5 py-0.5 rounded border border-gray-100">
                                        <Calendar className="w-2.5 h-2.5 mr-1" />
                                        {format(new Date(task.endDate), 'd MMM')}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const MobileTeamList: React.FC<MobileTeamListProps> = ({ users, userTaskMap, weekDays, onEditTask }) => {
    return (
        <div className="pb-32 space-y-2">
             <div className="flex items-center justify-between px-2 mb-2">
                 <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">Team Overview</h3>
             </div>
            {users.map(user => (
                <MobileTeamCard 
                    key={user.id} 
                    user={user} 
                    tasks={userTaskMap.get(user.id) || []} 
                    onEditTask={onEditTask}
                />
            ))}
        </div>
    );
};

export default MobileTeamList;
