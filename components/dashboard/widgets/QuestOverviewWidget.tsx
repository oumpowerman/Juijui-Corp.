
import React, { useMemo } from 'react';
import { WeeklyQuest, Task, Platform, ViewMode } from '../../../types';
import { Target, ChevronRight, Zap, CheckCircle2, AlertTriangle, MousePointerClick } from 'lucide-react';
import { PLATFORM_ICONS } from '../../../constants';
import { addDays, differenceInDays, isWithinInterval } from 'date-fns';

interface QuestOverviewWidgetProps {
    quests: WeeklyQuest[];
    tasks: Task[];
    onNavigate: (view: ViewMode) => void;
}

const QuestOverviewWidget: React.FC<QuestOverviewWidgetProps> = ({ quests, tasks, onNavigate }) => {
    
    // --- Logic: Calculate Progress ---
    const getQuestProgress = (quest: WeeklyQuest) => {
        if (quest.questType === 'MANUAL') return quest.manualProgress || 0;

        const qStart = new Date(quest.weekStartDate);
        qStart.setHours(0, 0, 0, 0);
        const qEnd = quest.endDate ? new Date(quest.endDate) : addDays(qStart, 6);
        qEnd.setHours(23, 59, 59, 999);

        const matches = tasks.filter(t => {
            if (t.isUnscheduled || !t.endDate) return false;
            const taskDate = new Date(t.endDate);
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

    // --- Prepare Data ---
    const processedQuests = useMemo(() => {
        const active = quests.map(q => {
            const current = getQuestProgress(q);
            const percent = Math.min((current / q.targetCount) * 100, 100);
            
            // Calculate Time Left
            const qEnd = q.endDate ? new Date(q.endDate) : addDays(new Date(q.weekStartDate), 6);
            const daysLeft = differenceInDays(qEnd, new Date());

            return { ...q, current, percent, daysLeft };
        });

        // Sort: Not Done > Highest Percent > Manual
        return active.sort((a, b) => {
            if (a.percent === 100 && b.percent !== 100) return 1;
            if (a.percent !== 100 && b.percent === 100) return -1;
            return b.percent - a.percent;
        });
    }, [quests, tasks]);

    const topQuests = processedQuests.slice(0, 3);
    const totalQuests = processedQuests.length;
    const completedQuests = processedQuests.filter(q => q.percent >= 100).length;
    const overallProgress = totalQuests > 0 ? Math.round((completedQuests / totalQuests) * 100) : 0;

    // --- Empty State ---
    if (quests.length === 0) {
        return (
            <div 
                onClick={() => onNavigate('WEEKLY')}
                className="bg-white rounded-[2.5rem] border border-dashed border-indigo-200 p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-indigo-50/30 transition-all h-full min-h-[280px] group"
            >
                <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4 text-indigo-400 group-hover:scale-110 transition-transform">
                    <Target className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-gray-700">ยังไม่มีภารกิจ</h3>
                <p className="text-xs text-gray-400 mt-1">ตั้งเป้าหมายประจำสัปดาห์ให้ทีมกันเถอะ</p>
                <button className="mt-4 px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-indigo-700 transition-colors">
                    + สร้างภารกิจ
                </button>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-white/60 relative overflow-hidden flex flex-col h-full group hover:shadow-xl hover:shadow-indigo-100 transition-all duration-500 min-h-[300px]">
            
            {/* Header / Banner */}
            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-800 p-5 pb-8 relative shrink-0">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                
                <div className="relative z-10 flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-2xl text-white shadow-inner border border-white/10">
                            <Target className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-white tracking-tight leading-none">ภารกิจทีม</h3>
                            <p className="text-indigo-200 text-xs font-bold uppercase tracking-wider mt-1">Weekly Quests</p>
                        </div>
                    </div>
                    
                    <div className="text-right">
                        <div className="text-3xl font-black text-white leading-none tracking-tighter">{overallProgress}%</div>
                        <p className="text-[8px] text-indigo-200 uppercase font-bold tracking-widest mt-1">Completion</p>
                    </div>
                </div>

                {/* Main Progress Bar (Bottom of Banner) */}
                <div className="absolute bottom-0 left-0 w-full h-1.5 bg-black/20 backdrop-blur-sm">
                     <div 
                        className="h-full bg-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.8)] transition-all duration-1000 ease-out relative"
                        style={{ width: `${overallProgress}%` }}
                     >
                        <div className="absolute right-0 top-0 bottom-0 w-1 bg-white opacity-50"></div>
                     </div>
                </div>
            </div>

            {/* List Body */}
            <div className="p-3 flex-1 flex flex-col gap-2 overflow-y-auto">
                {topQuests.map((quest) => {
                    const PlatformIcon = quest.targetPlatform && quest.targetPlatform !== 'ALL' 
                        ? PLATFORM_ICONS[quest.targetPlatform] 
                        : (quest.questType === 'MANUAL' ? MousePointerClick : Zap);
                    
                    const isDone = quest.percent >= 100;
                    const isCritical = !isDone && quest.daysLeft <= 1;

                    return (
                        <div 
                            key={quest.id} 
                            className={`
                                p-3 rounded-2xl border flex items-center gap-3 transition-all relative overflow-hidden group/item
                                ${isDone ? 'bg-gray-50 border-gray-100 opacity-80' : 'bg-white border-gray-100 hover:border-indigo-200 hover:shadow-sm'}
                            `}
                        >
                            {/* Icon Box */}
                            <div className={`
                                w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-colors
                                ${isDone ? 'bg-green-100 border-green-200 text-green-600' : 'bg-gray-50 border-gray-100 text-gray-500 group-hover/item:text-indigo-500 group-hover/item:bg-indigo-50'}
                            `}>
                                {isDone ? <CheckCircle2 className="w-5 h-5" /> : <PlatformIcon className="w-5 h-5" />}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0 z-10">
                                <div className="flex justify-between items-center mb-1.5">
                                    <h4 className={`text-xs font-bold truncate pr-2 ${isDone ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                                        {quest.title}
                                    </h4>
                                    {isCritical && (
                                        <span className="text-[8px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded flex items-center font-bold animate-pulse shrink-0">
                                            <AlertTriangle className="w-2.5 h-2.5 mr-0.5" /> ด่วน
                                        </span>
                                    )}
                                </div>
                                
                                {/* Mini Bar */}
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full rounded-full ${isDone ? 'bg-green-500' : isCritical ? 'bg-red-500' : 'bg-indigo-500'}`} 
                                            style={{ width: `${quest.percent}%` }}
                                        ></div>
                                    </div>
                                    <span className="text-[9px] font-bold text-gray-400 min-w-[24px] text-right">
                                        {quest.current}/{quest.targetCount}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {/* View All Button */}
                <button 
                    onClick={() => onNavigate('WEEKLY')}
                    className="mt-auto w-full py-3 bg-gray-50 hover:bg-indigo-50 text-gray-500 hover:text-indigo-600 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 group/btn"
                >
                    ดูภารกิจทั้งหมด ({totalQuests}) <ChevronRight className="w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform" />
                </button>
            </div>
        </div>
    );
};

export default QuestOverviewWidget;
