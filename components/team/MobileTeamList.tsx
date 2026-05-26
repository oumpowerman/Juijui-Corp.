import React, { useState, useMemo } from 'react';
import { User, Task, Channel, MasterOption, Priority } from '../../types';
import { 
    format, 
    isWithinInterval, 
    startOfDay, 
    endOfDay, 
    differenceInCalendarDays, 
    isBefore, 
    startOfToday 
} from 'date-fns';
import { STATUS_COLORS, WORK_STATUS_CONFIG } from '../../constants';
import { 
    ChevronDown, 
    ChevronUp, 
    Calendar, 
    Users, 
    Briefcase as JobIcon, 
    AlertCircle, 
    Clock8, 
    Zap, 
    BatteryFull, 
    BatteryCharging, 
    Battery, 
    BatteryWarning,
    Crown,
    Star,
    Sparkles,
    Hourglass
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import FeelingBubble, { BUBBLE_THEMES } from '../common/FeelingBubble';
import UserAvatarWithHP from '../common/UserAvatarWithHP';
import { isStockTerminalStatus } from '../../config/status';

// 7-Level Color Scale for Workload (Matching Desktop Modal)
const WORKLOAD_LEVELS = [
    { max: 5, color: 'bg-slate-200 text-slate-500 border-slate-300', fill: 'bg-slate-400', label: 'Idle' },
    { max: 15, color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', fill: 'bg-emerald-500', label: 'Light' },
    { max: 25, color: 'bg-sky-500/10 text-sky-600 border-sky-500/20', fill: 'bg-sky-500', label: 'Comfy' },
    { max: 35, color: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20', fill: 'bg-indigo-500', label: 'Good' },
    { max: 45, color: 'bg-orange-500/10 text-orange-600 border-orange-500/20', fill: 'bg-orange-500', label: 'Busy' },
    { max: 55, color: 'bg-red-500/10 text-red-600 border-red-500/20', fill: 'bg-red-500', label: 'Heavy' },
    { max: 999, color: 'bg-rose-500/10 text-rose-700 border-rose-500/20', fill: 'bg-rose-600', label: 'Max!' }
];

// Glassy 3D Themes for Tasks
const GLASS_THEMES = [
    { bg: 'bg-blue-400/10', border: 'border-blue-400/20', text: 'text-blue-900', accent: 'bg-blue-400', shadow: 'shadow-blue-500/5' },
    { bg: 'bg-indigo-400/10', border: 'border-indigo-400/20', text: 'text-indigo-900', accent: 'bg-indigo-400', shadow: 'shadow-indigo-500/5' },
    { bg: 'bg-purple-400/10', border: 'border-purple-400/20', text: 'text-purple-900', accent: 'bg-purple-400', shadow: 'shadow-purple-500/5' },
    { bg: 'bg-rose-400/10', border: 'border-rose-400/20', text: 'text-rose-900', accent: 'bg-rose-400', shadow: 'shadow-rose-500/5' },
    { bg: 'bg-amber-400/10', border: 'border-amber-400/20', text: 'text-amber-900', accent: 'bg-amber-400', shadow: 'shadow-amber-500/5' },
    { bg: 'bg-emerald-400/10', border: 'border-emerald-400/20', text: 'text-emerald-900', accent: 'bg-emerald-400', shadow: 'shadow-emerald-500/5' },
    { bg: 'bg-cyan-400/10', border: 'border-cyan-400/20', text: 'text-cyan-900', accent: 'bg-cyan-400', shadow: 'shadow-cyan-500/5' },
    { bg: 'bg-violet-400/10', border: 'border-violet-400/20', text: 'text-violet-900', accent: 'bg-violet-400', shadow: 'shadow-violet-500/5' },
    { bg: 'bg-fuchsia-400/10', border: 'border-fuchsia-400/20', text: 'text-fuchsia-900', accent: 'bg-fuchsia-400', shadow: 'shadow-fuchsia-500/5' },
];

const getPriorityStyle = (priority: Priority) => {
    switch (priority) {
        case 'URGENT': return 'bg-red-50 text-red-700 border-red-200 ring-1 ring-red-100';
        case 'HIGH': return 'bg-orange-50 text-orange-700 border-orange-200';
        case 'MEDIUM': return 'bg-blue-50 text-blue-700 border-blue-200';
        case 'LOW': return 'bg-slate-50 text-slate-600 border-slate-200';
        default: return 'bg-gray-50 text-gray-600 border-gray-200';
    }
};

interface MobileTeamListProps {
    users: User[];
    userTaskMap: Map<string, Task[]>;
    weekDays: Date[];
    onEditTask: (task: Task) => void;
    channels?: Channel[];
    masterOptions?: MasterOption[];
    currentUser?: User | null;
}

interface MobileTeamCardProps {
    user: User;
    tasks: Task[];
    weekDays: Date[];
    onEditTask: (t: Task) => void;
    channels?: Channel[];
    masterOptions?: MasterOption[];
    currentUser?: User | null;
}

const MobileTaskPill: React.FC<{
    task: Task;
    onEditTask: (task: Task) => void;
    channels?: Channel[];
    masterOptions?: MasterOption[];
}> = ({ task, onEditTask, channels, masterOptions }) => {
    // Get end date object safely
    const endDateObj = useMemo(() => {
        if (!task.endDate) return null;
        return task.endDate instanceof Date ? task.endDate : new Date(task.endDate);
    }, [task.endDate]);

    const isOverdue = useMemo(() => {
        if (!task.endDate) return false;
        
        // keywords for finished group (LIKE check)
        const finishedKeywords = ['DONE', 'PUBLISH', 'FINISH', 'COMPLETE', 'APPROVE', 'SUCCESS', 'ARCHIVE', 'POSTED'];
        const currentStatus = (task.status || '').toUpperCase();
        
        const isFinished = finishedKeywords.some(keyword => currentStatus.includes(keyword));
        if (isFinished || !endDateObj) return false;

        return isBefore(endDateObj, startOfToday());
    }, [task.status, task.endDate]);

    // Insight Overdue Logic (Posted but no analytics entered after 7 days)
    const isInsightOverdue = useMemo(() => {
        const isTerminal = isStockTerminalStatus(task.status);
        if (task.type !== 'CONTENT' || task.isUnscheduled || !isTerminal || !task.endDate || task.hasAnalytics) return false;
        return differenceInCalendarDays(startOfToday(), endDateObj!) >= 7;
    }, [task.type, task.status, task.endDate, task.isUnscheduled, task.hasAnalytics, endDateObj]);

    // Resolve Status Label & Color from Master Data
    let statusLabel = task.status;
    let statusColor = 'bg-gray-50 text-gray-600 border-gray-200/50';
    
    if (masterOptions) {
        const statusOpt = masterOptions.find(o => (o.type === 'STATUS' || o.type === 'TASK_STATUS') && o.key === task.status);
        if (statusOpt) {
            statusLabel = statusOpt.label.replace(/^\d+\s*/, '');
            if (statusOpt.color) {
                statusColor = statusOpt.color;
            }
        }
    }

    // Assign dynamic Glassy 3D styling matching desktop
    const taskStyle = useMemo(() => {
        const id = task.id || 'default';
        let hash = 0;
        for (let i = 0; i < id.length; i++) {
            hash = id.charCodeAt(i) + ((hash << 5) - hash);
        }
        const index = Math.abs(hash) % GLASS_THEMES.length;
        const theme = GLASS_THEMES[index];
        const isUrgent = task.priority === 'URGENT';

        return {
            theme,
            className: `
                relative backdrop-blur-md border-t border-white/60 border-b border-black/5
                ${theme.bg} ${theme.border} ${theme.text} ${theme.shadow}
                ${isUrgent ? 'ring-1.5 ring-red-500/40 ring-inset brightness-[1.02]' : ''}
            `
        };
    }, [task.id, task.priority]);

    const targetChannel = useMemo(() => {
        if (!task.channelId || !channels) return null;
        return channels.find(c => c.id === task.channelId);
    }, [task.channelId, channels]);

    return (
        <motion.div
            whileTap={{ scale: 0.98 }}
            onClick={() => onEditTask(task)}
            className={`p-3.5 rounded-2xl border cursor-pointer flex flex-col gap-2.5 transition-shadow ${taskStyle.className}`}
        >
            {/* Side Accent Line */}
            <div className={`absolute left-0 top-0 bottom-0 w-[4.5px] rounded-l-2xl ${taskStyle.theme.accent} opacity-60`} />

            {/* Task Header info */}
            <div className="flex items-start justify-between gap-2 pl-1.5">
                <div className="flex flex-wrap items-center gap-1.5">
                    {/* Channel badge if exists */}
                    {targetChannel && (
                        <span 
                            className="px-2 py-0.5 rounded-lg text-[9px] font-black tracking-wider uppercase border"
                            style={{ 
                                backgroundColor: targetChannel.color?.startsWith('#') ? `${targetChannel.color}15` : undefined,
                                borderColor: targetChannel.color?.startsWith('#') ? `${targetChannel.color}35` : undefined,
                                color: targetChannel.color?.startsWith('#') ? targetChannel.color : undefined
                            }}
                        >
                            {targetChannel.name}
                        </span>
                    )}

                    {/* Format type */}
                    <span className="text-[9px] font-black tracking-wider text-slate-400 uppercase">
                        {task.type === 'CONTENT' ? 'CONTENT PLAN' : 'SUB TASK'}
                    </span>
                </div>

                {/* Priority */}
                {task.priority && (
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold border leading-none ${getPriorityStyle(task.priority)}`}>
                        {task.priority}
                    </span>
                )}
            </div>

            {/* Task Title with cute icon descriptor */}
            <div className="flex items-center gap-2 pl-1.5 min-w-0">
                {task.assigneeType === 'TEAM' ? (
                    <Users className="w-4 h-4 text-indigo-500/70 shrink-0" />
                ) : (
                    <JobIcon className="w-4 h-4 text-slate-400 shrink-0" />
                )}
                <span className="text-xs font-bold text-slate-800 leading-snug line-clamp-2">
                    {task.title}
                </span>
            </div>

            {/* Warning Alert if overdue */}
            {isOverdue && (
                <div className="mx-1.5 px-2.5 py-1.5 rounded-xl bg-red-50 border border-red-100 text-red-600 font-bold text-[10px] flex items-center gap-1.5 leading-none animate-pulse">
                    <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                    <span>งานตกค้างเกินกำหนด ({differenceInCalendarDays(startOfToday(), endDateObj!)} วัน)</span>
                </div>
            )}

            {isInsightOverdue && (
                <div className="mx-1.5 px-2.5 py-1.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 font-bold text-[10px] flex items-center gap-1.5 leading-none">
                    <Clock8 className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span>ค้างสรุปรายงานสถิติสัปดาห์นี้!</span>
                </div>
            )}

            {/* Bottom metadata tags */}
            <div className="flex items-center justify-between border-t border-slate-100/50 pt-2 pl-1.5 mt-0.5">
                {/* Status indicator */}
                <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-extrabold border ${statusColor}`}>
                    {statusLabel}
                </span>

                {/* Hours & Reviews info */}
                <div className="flex items-center gap-2 font-mono text-[10px] text-slate-500">
                    {task.estimatedHours !== undefined && (
                        <span className="flex items-center gap-1 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded-md font-bold text-[9.5px]">
                            <Hourglass className="w-3 h-3 text-amber-500" />
                            {task.estimatedHours}h
                        </span>
                    )}
                    {task.reviews && task.reviews.length > 0 && (
                        <span className="flex items-center gap-0.5 bg-indigo-50 border border-indigo-150/40 text-indigo-600 px-1.5 py-0.5 rounded-md font-bold text-[9.5px]">
                            <Sparkles className="w-3 h-3 text-indigo-500" />
                            Rev: {task.reviews.length}
                        </span>
                    )}
                    {endDateObj && (
                        <span className="flex items-center gap-1 text-[9.5px] text-slate-400">
                            <Calendar className="w-3 h-3 text-slate-300" />
                            {format(endDateObj, 'dd/MM')}
                        </span>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

const MobileTeamCard: React.FC<MobileTeamCardProps> = ({ 
    user, 
    tasks, 
    weekDays, 
    onEditTask, 
    channels, 
    masterOptions, 
    currentUser 
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const today = new Date();

    // Calculate Workload distributed by days matching Desktop row logic!
    const weeklyHours = useMemo(() => {
        const weekStart = startOfDay(weekDays[0]);
        const weekEnd = endOfDay(weekDays[weekDays.length - 1]);
        
        return tasks.reduce((sum, t) => {
            if (t.isUnscheduled || !t.startDate || !t.endDate || !t.estimatedHours) return sum;

            const taskStart = startOfDay(new Date(t.startDate));
            const taskEnd = endOfDay(new Date(t.endDate));

            // Duration in days (min 1 day)
            const totalDurationDays = Math.max(1, differenceInCalendarDays(taskEnd, taskStart) + 1);
            const hoursPerDay = t.estimatedHours / totalDurationDays;

            // overlap with currently viewed week
            const overlapStart = new Date(Math.max(taskStart.getTime(), weekStart.getTime()));
            const overlapEnd = new Date(Math.min(taskEnd.getTime(), weekEnd.getTime()));

            if (overlapStart > overlapEnd) return sum;

            const overlapDays = differenceInCalendarDays(overlapEnd, overlapStart) + 1;
            
            return sum + (hoursPerDay * overlapDays);
        }, 0);
    }, [tasks, weekDays]);

    const workloadLevel = useMemo(() => {
        return WORKLOAD_LEVELS.find(l => weeklyHours <= l.max) || WORKLOAD_LEVELS[WORKLOAD_LEVELS.length - 1];
    }, [weeklyHours]);

    // Workload score labels (Free, Chill, Busy, On Fire)
    const juijuiScore = useMemo(() => {
        if (weeklyHours === 0) return { text: 'ว่างจัด (Free)', color: 'text-green-600 bg-green-50 border-green-100', icon: <BatteryFull className="w-3.5 h-3.5" /> };
        if (weeklyHours <= 15) return { text: 'ชิวๆ (Chill)', color: 'text-blue-600 bg-blue-50 border-blue-100', icon: <BatteryCharging className="w-3.5 h-3.5" /> };
        if (weeklyHours <= 35) return { text: 'ตึงมือ (Busy)', color: 'text-orange-600 bg-orange-50 border-orange-100', icon: <Battery className="w-3.5 h-3.5" /> };
        return { text: 'งานเดือด! (On Fire)', color: 'text-red-600 bg-red-50 border-red-100/50 animate-pulse', icon: <BatteryWarning className="w-3.5 h-3.5" /> };
    }, [weeklyHours]);

    // Active Today's Tasks
    const todaysTasks = useMemo(() => {
        return tasks.filter(t => {
            if (t.isUnscheduled || !t.startDate || !t.endDate) return false;
            const start = startOfDay(new Date(t.startDate));
            const end = endOfDay(new Date(t.endDate));
            return isWithinInterval(today, { start, end });
        });
    }, [tasks, today]);

    // Future & Past Tasks 
    const otherTasks = useMemo(() => {
        return tasks.filter(t => !todaysTasks.includes(t));
    }, [tasks, todaysTasks]);

    const bubbleTheme = useMemo(() => {
        if (!user.id) return BUBBLE_THEMES[0];
        const todayStr = new Date().toDateString(); 
        const seedString = user.id + todayStr; 
        let hash = 0;
        for (let i = 0; i < seedString.length; i++) {
            hash = seedString.charCodeAt(i) + ((hash << 5) - hash);
        }
        const index = Math.abs(hash) % BUBBLE_THEMES.length;
        return BUBBLE_THEMES[index];
    }, [user.id]);

    const isMe = user.id === currentUser?.id;
    const currentLevel = Math.floor((user.xp || 0) / 1000) + 1;
    const levelProgressPercent = ((user.xp || 0) % 1000) / 1000 * 100;

    return (
        <div className={`bg-white rounded-3xl p-5 border border-slate-150/70 shadow-sm mb-4 relative overflow-hidden ${isMe ? 'ring-2 ring-indigo-500/10 bg-indigo-50/5' : ''}`}>
            {/* Visual Side Accent for Me */}
            {isMe && (
                <div className="absolute right-0 top-0 bg-indigo-500 text-white font-black text-[9px] px-3.5 py-1 rounded-bl-xl tracking-widest flex items-center gap-1 shadow-md z-15 select-none">
                    <Crown className="w-2.5 h-2.5" />
                    <span>ME</span>
                </div>
            )}

            {/* Profile Row */}
            <div className="flex gap-4">
                <div className="relative shrink-0">
                    <FeelingBubble 
                        userId={user.id} 
                        feeling={user.feeling} 
                        className="-top-5 left-1/2 -translate-x-1/2 z-[120] scale-90" 
                    />
                    <div className="mt-2.5">
                        <UserAvatarWithHP user={user} isFocused={false} />
                    </div>
                </div>

                <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between gap-1">
                            <h4 className="font-black text-[15px] text-slate-800 truncate leading-none">
                                {user.name}
                            </h4>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${workloadLevel.color}`}>
                                {weeklyHours.toFixed(1)}h
                            </span>
                        </div>
                        <p className="text-xs text-slate-400 font-medium mt-1">{user.position || 'Member'}</p>
                    </div>

                    {/* Level Badge and Game XP bar */}
                    <div className="mt-2.5 space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold">
                            <span className="flex items-center gap-1 text-amber-600">
                                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500 shrink-0" />
                                Level {currentLevel}
                            </span>
                            <span className="font-mono text-slate-400">{user.xp || 0} XP</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden relative">
                            <div 
                                className="h-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-full transition-all duration-500" 
                                style={{ width: `${levelProgressPercent}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Segmented Fuel Workload Meter aligned to Desktop (12 Segments) */}
            <div className="mt-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col gap-2.5">
                <div className="flex items-center justify-between text-[10px] font-bold">
                    <span className="text-slate-400 flex items-center gap-1 uppercase tracking-wider">
                        🔋 โหลดงานสัปดาห์นี้
                    </span>
                    <span className={`px-2 py-0.5 rounded-lg border text-[9.5px] font-black flex items-center gap-1 ${juijuiScore.color}`}>
                        {juijuiScore.icon}
                        {juijuiScore.text}
                    </span>
                </div>

                {/* 12 segment bar */}
                <div className="flex gap-[2px] h-3 w-full bg-slate-200/40 rounded-md p-[1.5px] overflow-hidden">
                    {[...Array(12)].map((_, i) => {
                        const threshold = (i + 1) * (40 / 12);
                        const isActive = weeklyHours >= threshold;
                        return (
                            <div 
                                key={i} 
                                className={`flex-1 rounded-[2px] transition-all duration-700 ${
                                    isActive ? workloadLevel.fill : 'bg-slate-250/50'
                                } ${isActive && weeklyHours > 45 ? 'animate-pulse' : ''}`}
                            />
                        );
                    })}
                </div>
            </div>

            {/* Today's Focus Box */}
            <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-500 animate-pulse" />
                    งานวันนี้ (TODAY'S FOCUS)
                </p>
                {todaysTasks.length > 0 ? (
                    <div className="space-y-3">
                        {todaysTasks.map(task => (
                            <MobileTaskPill
                                key={task.id}
                                task={task}
                                onEditTask={onEditTask}
                                channels={channels}
                                masterOptions={masterOptions}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-[11px] text-slate-400 font-medium italic bg-slate-50/50 border border-slate-100/50 p-4 rounded-xl text-center">
                        ไม่มีงานที่ต้องดูแลวันนี้
                    </div>
                )}
            </div>

            {/* Other Tasks Expansion with Spring Layout Animation */}
            {otherTasks.length > 0 && (
                <div className="mt-4">
                    <button 
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="w-full flex items-center justify-center gap-1.5 text-[11px] font-black text-indigo-600 bg-indigo-50/60 border border-indigo-100/40 py-2.5 rounded-2xl hover:bg-indigo-100 transition-colors cursor-pointer"
                    >
                        <span>{isExpanded ? 'ซ่อนงานอื่นๆ ในสัปดาห์นี้' : `ดูแผนที่เหลืออีก ${otherTasks.length} งาน`}</span>
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    
                    <AnimatePresence>
                        {isExpanded && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                transition={{ type: 'spring', damping: 20, stiffness: 220 }}
                                className="space-y-3 overflow-hidden"
                            >
                                 {otherTasks.map(task => (
                                    <MobileTaskPill
                                        key={task.id}
                                        task={task}
                                        onEditTask={onEditTask}
                                        channels={channels}
                                        masterOptions={masterOptions}
                                    />
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
};

const MobileTeamList: React.FC<MobileTeamListProps> = ({ 
    users, 
    userTaskMap, 
    weekDays, 
    onEditTask, 
    channels, 
    masterOptions, 
    currentUser 
}) => {
    return (
        <div className="pb-32 space-y-1">
            <div className="flex items-center justify-between px-2.5 mb-3 pt-1">
                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-500" />
                    ทีมทาสทุกคน ({users.length})
                </h3>
            </div>
            {users.map(user => (
                <MobileTeamCard 
                    key={user.id} 
                    user={user} 
                    tasks={userTaskMap.get(user.id) || []} 
                    weekDays={weekDays}
                    onEditTask={onEditTask}
                    channels={channels}
                    masterOptions={masterOptions}
                    currentUser={currentUser}
                />
            ))}
        </div>
    );
};

export default MobileTeamList;
