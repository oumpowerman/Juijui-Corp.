
import React, { useMemo } from 'react';
import { WeeklyQuest, Task, Platform, ViewMode } from '../../../types';
import { Target, ChevronRight, Layers, Zap, CheckCircle2, AlertTriangle, Folder, Clock } from 'lucide-react';
import { addDays, isWithinInterval, isPast, isToday, differenceInDays, endOfDay, startOfDay } from 'date-fns';

interface QuestOverviewWidgetProps {
    quests: WeeklyQuest[];
    tasks: Task[];
    onNavigate: (view: ViewMode) => void;
}

const QuestOverviewWidget: React.FC<QuestOverviewWidgetProps> = ({ quests, tasks, onNavigate }) => {
    
    // --- Helper: Calculate Individual Quest Progress ---
    const getQuestProgress = (quest: WeeklyQuest) => {
        if (quest.questType === 'MANUAL') return quest.manualProgress || 0;

        const qStart = startOfDay(new Date(quest.weekStartDate));
        const qEnd = endOfDay(quest.endDate ? new Date(quest.endDate) : addDays(qStart, 6));

        const matches = tasks.filter(t => {
            if (t.isUnscheduled || !t.endDate) return false;
            const taskDate = new Date(t.endDate);
            // Check if task is within quest duration
            const inRange = isWithinInterval(taskDate, { start: qStart, end: qEnd });
            
            if (!inRange) return false;
            if (quest.channelId && t.channelId !== quest.channelId) return false;
            if (quest.targetStatus && t.status !== quest.targetStatus && t.status !== 'DONE') return false;

            // Platform Check
            let matchPlatform = true;
            if (quest.targetPlatform) {
                if (quest.targetPlatform === 'ALL') {
                     matchPlatform = (t.targetPlatforms && t.targetPlatforms.length > 0) || false;
                } else {
                     const hasSpecific = t.targetPlatforms?.includes(quest.targetPlatform as Platform);
                     const hasAll = t.targetPlatforms?.includes('ALL');
                     matchPlatform = hasSpecific || hasAll || false;
                }
            }

            // Format Check
            let matchFormat = true;
            if (quest.targetFormat && quest.targetFormat.length > 0) {
                 matchFormat = t.contentFormat ? quest.targetFormat.includes(t.contentFormat) : false;
            }

            return matchPlatform && matchFormat;
        });

        return matches.length;
    };

    // --- Logic: Grouping & Filtering ---
    const { majorQuests, totalPercent } = useMemo(() => {
        const groups: Record<string, { 
            id: string,
            title: string, 
            totalCurrent: number, 
            totalTarget: number, 
            questCount: number,
            completedCount: number,
            daysLeft: number,
            isUrgent: boolean 
        }> = {};

        const today = new Date();
        let grandTotalCurrent = 0;
        let grandTotalTarget = 0;

        // 1. Filter ACTIVE Quests only (Today must be within start-end)
        const activeQuests = quests.filter(q => {
            const start = startOfDay(new Date(q.weekStartDate));
            const end = endOfDay(q.endDate ? new Date(q.endDate) : addDays(start, 6));
            return isWithinInterval(today, { start, end });
        });

        // 2. Process Grouping
        activeQuests.forEach(q => {
            const current = getQuestProgress(q);
            const target = q.targetCount;
            const isDone = current >= target;
            
            // Determine Group Key (Use ID or 'GENERAL')
            const groupKey = (q.groupId && q.groupTitle) ? q.groupId : 'GENERAL';
            const groupTitle = (q.groupId && q.groupTitle) ? q.groupTitle : 'ภารกิจทั่วไป (General)';

            // Calculate urgency for this specific quest
            const start = startOfDay(new Date(q.weekStartDate));
            const end = endOfDay(q.endDate ? new Date(q.endDate) : addDays(start, 6));
            const daysLeft = differenceInDays(end, today);
            // Urgent if less than 2 days left and not done
            const isUrgent = daysLeft <= 1 && !isDone;

            if (!groups[groupKey]) {
                groups[groupKey] = { 
                    id: groupKey,
                    title: groupTitle, 
                    totalCurrent: 0, 
                    totalTarget: 0, 
                    questCount: 0,
                    completedCount: 0,
                    daysLeft: daysLeft, // Take first quest's days left as proxy, or find min
                    isUrgent: false 
                };
            }

            // Aggregate Stats
            const cappedCurrent = Math.min(current, target);
            groups[groupKey].totalCurrent += cappedCurrent;
            groups[groupKey].totalTarget += target;
            groups[groupKey].questCount += 1;
            if (isDone) groups[groupKey].completedCount += 1;
            
            // If any quest in group is urgent, mark group as urgent
            if (isUrgent) groups[groupKey].isUrgent = true;
            // Update min days left
            groups[groupKey].daysLeft = Math.min(groups[groupKey].daysLeft, daysLeft);

            grandTotalCurrent += cappedCurrent;
            grandTotalTarget += target;
        });

        // 3. Convert to Array & Sort
        const list = Object.values(groups).map(g => {
            const percent = g.totalTarget > 0 ? Math.round((g.totalCurrent / g.totalTarget) * 100) : 0;
            return { ...g, percent };
        }).sort((a, b) => {
            // Urgent first
            if (a.isUrgent !== b.isUrgent) return a.isUrgent ? -1 : 1;
            // Then by lowest percent (Work needed)
            if (a.percent !== b.percent) return a.percent - b.percent;
            return 0;
        });

        const overallPercent = grandTotalTarget > 0 ? Math.round((grandTotalCurrent / grandTotalTarget) * 100) : 0;

        return { majorQuests: list, totalPercent: overallPercent };

    }, [quests, tasks]);

    const activeGroupsCount = majorQuests.length;

    // --- Empty State ---
    if (activeGroupsCount === 0) {
        return (
            <div 
                onClick={() => onNavigate('WEEKLY')}
                className="bg-white rounded-[2.5rem] border-2 border-dashed border-indigo-100 p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-indigo-50/30 transition-all h-full min-h-[320px] group relative overflow-hidden"
            >
                <div className="absolute inset-0 bg-indigo-50/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="w-20 h-20 bg-white border-4 border-indigo-50 rounded-full flex items-center justify-center mb-6 text-indigo-300 group-hover:scale-110 group-hover:border-indigo-200 transition-all shadow-sm">
                    <Target className="w-10 h-10" />
                </div>
                <h3 className="font-bold text-gray-700 text-lg">ไม่มีภารกิจในสัปดาห์นี้</h3>
                <p className="text-sm text-gray-400 mt-2 max-w-[200px] leading-relaxed">
                    ภารกิจเดิมหมดเวลา หรือยังไม่ได้สร้างภารกิจใหม่
                </p>
                <button className="mt-6 px-6 py-3 bg-indigo-600 text-white rounded-2xl text-sm font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95 group-hover:-translate-y-1">
                    + สร้างภารกิจใหม่
                </button>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-white/60 relative overflow-hidden flex flex-col h-full group hover:shadow-xl hover:shadow-indigo-100/50 transition-all duration-500 min-h-[350px]">
            
            {/* Header / Banner */}
            <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 p-6 pb-8 relative shrink-0">
                <div className="absolute top-0 right-0 w-48 h-48 bg-white opacity-[0.07] rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none animate-pulse"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500 opacity-20 rounded-full blur-3xl -ml-10 -mb-10 pointer-events-none"></div>
                
                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-5">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl text-white shadow-inner border border-white/10">
                                <Layers className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-white tracking-tight leading-none">Weekly Progress</h3>
                                <p className="text-indigo-200 text-xs font-bold uppercase tracking-wider mt-1.5 opacity-80">ความคืบหน้ารวม (Active)</p>
                            </div>
                        </div>
                        
                        <div className="text-right">
                            <div className="flex items-baseline justify-end gap-1">
                                <span className="text-4xl font-black text-white leading-none tracking-tighter drop-shadow-md">{totalPercent}</span>
                                <span className="text-lg text-indigo-300 font-bold">%</span>
                            </div>
                        </div>
                    </div>

                    {/* Overall Progress Bar */}
                    <div className="relative">
                        <div className="flex justify-between text-[10px] font-bold text-indigo-200 mb-1.5 px-1">
                            <span>ความคืบหน้าทีม</span>
                            <span>{activeGroupsCount} Active Groups</span>
                        </div>
                        <div className="h-2.5 w-full bg-black/20 rounded-full overflow-hidden backdrop-blur-sm shadow-inner border border-white/5">
                            <div 
                                className={`h-full rounded-full transition-all duration-1000 ${totalPercent >= 100 ? 'bg-green-400' : 'bg-gradient-to-r from-yellow-400 to-orange-500'}`}
                                style={{ width: `${totalPercent}%` }}
                            >
                                <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite]"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* List Body */}
            <div className="flex-1 flex flex-col overflow-hidden bg-[#f8fafc]">
                <div className="overflow-y-auto p-4 space-y-3 flex-1">
                    {majorQuests.map((group) => {
                        const isDone = group.percent >= 100;
                        const isGeneral = group.id === 'GENERAL';
                        // Urgency logic: Red if urgent & not done. Green if done.
                        const isUrgent = group.isUrgent && !isDone;

                        return (
                            <div 
                                key={group.id} 
                                onClick={() => onNavigate('WEEKLY')}
                                className={`
                                    p-4 rounded-2xl border transition-all relative overflow-hidden group/card cursor-pointer
                                    ${isDone 
                                        ? 'bg-green-50/40 border-green-200 hover:bg-green-50' 
                                        : isUrgent
                                            ? 'bg-red-50/40 border-red-200 hover:bg-red-50' 
                                            : 'bg-white border-gray-100 hover:border-indigo-300 hover:shadow-md'
                                    }
                                `}
                            >
                                {/* Icon & Title */}
                                <div className="flex justify-between items-start mb-3 relative z-10">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className={`
                                            w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border transition-colors shadow-sm
                                            ${isDone 
                                                ? 'bg-green-100 border-green-200 text-green-600' 
                                                : isGeneral 
                                                    ? 'bg-gray-100 border-gray-200 text-gray-500' 
                                                    : 'bg-indigo-50 border-indigo-100 text-indigo-600 group-hover/card:bg-indigo-100'}
                                        `}>
                                            {isDone ? <CheckCircle2 className="w-6 h-6" /> : isUrgent ? <AlertTriangle className="w-6 h-6 animate-pulse" /> : <Folder className="w-6 h-6" />}
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className={`text-sm font-bold truncate mb-0.5 ${isDone ? 'text-green-800' : isUrgent ? 'text-red-700' : 'text-gray-800'}`}>
                                                {group.title}
                                            </h4>
                                            <div className="flex items-center gap-2">
                                                <p className="text-[10px] text-gray-400 font-bold bg-white/50 px-1.5 py-0.5 rounded border border-gray-100/50">
                                                    {group.questCount} ภารกิจย่อย
                                                </p>
                                                {isUrgent && (
                                                    <span className="text-[10px] font-bold text-red-500 flex items-center bg-red-100/50 px-1.5 py-0.5 rounded border border-red-100">
                                                        <Clock className="w-3 h-3 mr-1"/> เหลือ {group.daysLeft} วัน
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-right shrink-0">
                                        <span className={`text-xl font-black ${isDone ? 'text-green-600' : isUrgent ? 'text-red-500' : 'text-indigo-600'}`}>
                                            {group.percent}%
                                        </span>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden relative z-10">
                                    <div 
                                        className={`h-full rounded-full transition-all duration-1000 ${isDone ? 'bg-green-500' : isUrgent ? 'bg-red-500' : 'bg-indigo-500'}`} 
                                        style={{ width: `${group.percent}%` }}
                                    ></div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* View All Button */}
                <div className="p-4 pt-2 bg-gradient-to-t from-white to-transparent">
                    <button 
                        onClick={() => onNavigate('WEEKLY')}
                        className="w-full py-3 bg-white border border-gray-200 hover:border-indigo-300 hover:text-indigo-600 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-1 group/btn shadow-sm hover:shadow-md"
                    >
                        ดูรายละเอียดทั้งหมด <ChevronRight className="w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default QuestOverviewWidget;
