
import React from 'react';
import { ArrowRight, CheckCircle2, Layout, MousePointerClick, Database, Calendar, Flame, Zap, Skull } from 'lucide-react';
import { WeeklyQuest, Task, Channel, Platform } from '../../types';
import { addDays, isWithinInterval, format, differenceInDays, isPast, isToday } from 'date-fns';

interface QuestCardProps {
    channel?: Channel; 
    quests: WeeklyQuest[];
    allTasks: Task[]; 
    onClick: () => void;
    onUpdateManualProgress?: (id: string, val: number) => void;
}

const QuestCard: React.FC<QuestCardProps> = ({ channel, quests, allTasks, onClick, onUpdateManualProgress }) => {
    
    // --- Logic Reused for Visualization ---
    const getMatchingTasks = (quest: WeeklyQuest) => {
        if (quest.questType === 'MANUAL') return [];
        
        // Dynamic Range
        const qStart = new Date(quest.weekStartDate);
        qStart.setHours(0, 0, 0, 0);
        
        const qEnd = quest.endDate ? new Date(quest.endDate) : addDays(qStart, 6);
        qEnd.setHours(23, 59, 59, 999);

        return allTasks.filter(t => {
            if (t.isUnscheduled) return false;
            if (!t.endDate) return false;
            const taskDate = new Date(t.endDate);
            const inRange = isWithinInterval(taskDate, { start: qStart, end: qEnd });
            if (!inRange) return false;

            const matchChannel = quest.channelId ? t.channelId === quest.channelId : true;
            const matchStatus = quest.targetStatus ? t.status === quest.targetStatus : t.status === 'DONE';
            
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
            
            let matchFormat = true;
            if (quest.targetFormat && quest.targetFormat.length > 0) {
                 matchFormat = t.contentFormat ? quest.targetFormat.includes(t.contentFormat) : false;
            }
            
            return matchStatus && matchChannel && matchPlatform && matchFormat;
        });
    };

    const calculateProgress = (quest: WeeklyQuest) => {
        if (quest.questType === 'MANUAL') return quest.manualProgress || 0;
        return getMatchingTasks(quest).length;
    };

    const calculateOverall = () => {
        if (quests.length === 0) return 0;
        let totalCurrent = 0;
        let totalTarget = 0;
        quests.forEach(q => {
            totalCurrent += Math.min(calculateProgress(q), q.targetCount); 
            totalTarget += q.targetCount;
        });
        return totalTarget === 0 ? 0 : Math.round((totalCurrent / totalTarget) * 100);
    };

    const overallPercent = calculateOverall();
    const isMisc = !channel;
    
    const cardBgColor = isMisc ? 'bg-gray-50' : channel?.color.replace('text-', 'bg-').replace('bg-', 'bg-opacity-10 ') || 'bg-gray-50';
    const textColor = isMisc ? 'text-gray-600' : 'text-gray-800';

    return (
        <div onClick={onClick} className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full hover:shadow-lg hover:border-indigo-200 hover:-translate-y-1 transition-all cursor-pointer group relative">
            {/* Overall Progress Bar */}
            <div className="h-2 w-full bg-gray-100">
                <div 
                    className={`h-full transition-all duration-1000 ${isMisc ? 'bg-gray-400' : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500'}`} 
                    style={{ width: `${overallPercent}%` }}
                ></div>
            </div>

            {/* Card Header */}
            <div className={`px-5 py-5 border-b border-gray-100 ${cardBgColor}`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                            <div className="shrink-0">
                                {isMisc ? (
                                    <div className="w-14 h-14 rounded-2xl bg-white border-4 border-white shadow-md flex items-center justify-center text-gray-400">
                                        <Layout className="w-8 h-8" />
                                    </div>
                                ) : (
                                    channel?.logoUrl ? (
                                        <img 
                                            src={channel.logoUrl} 
                                            alt={channel.name} 
                                            className="w-14 h-14 rounded-2xl object-cover border-4 border-white shadow-md bg-white"
                                        />
                                    ) : (
                                        <div className="w-14 h-14 rounded-2xl bg-white border-4 border-white shadow-md flex items-center justify-center text-xl font-black uppercase text-gray-300">
                                            {channel?.name.substring(0, 2)}
                                        </div>
                                    )
                                )}
                            </div>
                            
                            <div>
                                <h3 className={`font-black text-xl tracking-tight leading-tight ${textColor}`}>
                                    {isMisc ? 'ทั่วไป (Misc)' : channel?.name}
                                </h3>
                                <p className="text-xs opacity-60 font-bold mt-1 flex items-center">
                                    <Calendar className="w-3 h-3 mr-1" /> {quests.length} Quests
                                </p>
                            </div>
                    </div>
                    
                    <div className="text-right">
                        <span className={`text-3xl font-black tracking-tighter ${textColor}`}>{overallPercent}%</span>
                    </div>
                </div>
            </div>

            {/* Quests List (Preview Top 4) */}
            <div className="p-5 flex-1 space-y-3">
                {quests.slice(0, 4).map(quest => {
                    const progress = calculateProgress(quest);
                    const percent = Math.min((progress / quest.targetCount) * 100, 100);
                    const isCompleted = percent >= 100;
                    
                    const qStart = new Date(quest.weekStartDate);
                    const qEnd = quest.endDate ? new Date(quest.endDate) : addDays(qStart, 6);
                    
                    const daysRemaining = differenceInDays(qEnd, new Date());
                    const isFailed = isPast(qEnd) && !isToday(qEnd) && !isCompleted;
                    
                    let heatClass = 'py-1'; 
                    let HeatIcon = null;

                    if (!isCompleted && !isFailed) {
                        if (daysRemaining <= 0) {
                            heatClass = 'bg-red-50 border border-red-200 shadow-[0_0_10px_rgba(239,68,68,0.15)] rounded-lg p-2 -mx-2 animate-pulse';
                            HeatIcon = <Flame className="w-3.5 h-3.5 text-red-600 fill-red-600 animate-bounce shrink-0" />;
                        } else if (daysRemaining === 1) {
                            heatClass = 'bg-orange-50 border border-orange-200 rounded-lg p-2 -mx-2';
                            HeatIcon = <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500 shrink-0" />;
                        }
                    }

                    // --- FAILED STYLE (Haunted) ---
                    if (isFailed) {
                        heatClass = 'bg-slate-100 border border-slate-300 border-dashed rounded-lg p-2 -mx-2 opacity-70 grayscale relative overflow-hidden';
                        HeatIcon = <Skull className="w-3.5 h-3.5 text-slate-500 shrink-0" />;
                    }

                    return (
                        <div key={quest.id} className={`transition-all duration-300 ${heatClass}`}>
                            {/* FAILED STAMP */}
                            {isFailed && (
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 text-[30px] font-black text-slate-300/20 rotate-[-10deg] pointer-events-none select-none z-0">
                                    FAILED
                                </div>
                            )}

                            <div className="flex justify-between items-center mb-1.5 text-sm relative z-10">
                                <div className="flex items-center gap-2 max-w-[75%]">
                                    {/* Icon */}
                                    {HeatIcon ? HeatIcon : (quest.questType === 'MANUAL' ? <MousePointerClick className="w-3 h-3 text-gray-400 shrink-0" /> : <Zap className="w-3 h-3 text-gray-400 shrink-0" />)}
                                    
                                    <span className={`font-medium truncate ${isCompleted ? 'text-gray-400 line-through' : isFailed ? 'text-slate-600 line-through decoration-slate-400' : 'text-gray-700'}`}>
                                        {quest.title}
                                    </span>
                                </div>
                                <div className="text-right flex items-center gap-2">
                                    <span className={`text-xs font-bold ${isCompleted ? 'text-emerald-600' : isFailed ? 'text-slate-500' : 'text-gray-400'}`}>
                                        {progress}/{quest.targetCount}
                                    </span>
                                </div>
                            </div>

                            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden relative z-10">
                                <div className={`h-full rounded-full transition-all duration-700 ${isCompleted ? 'bg-emerald-500' : isFailed ? 'bg-slate-500' : 'bg-indigo-500'}`} style={{ width: `${percent}%` }} />
                            </div>
                        </div>
                    );
                })}
                {quests.length > 4 && <div className="text-center text-xs text-gray-400 font-medium pt-2">+ อีก {quests.length - 4} ภารกิจ</div>}
            </div>
            
            <div className="bg-gray-50 p-3 flex justify-center border-t border-gray-100 text-xs font-bold text-gray-400 group-hover:text-indigo-500 group-hover:bg-indigo-50 transition-colors">
                {isMisc ? 'จัดการภารกิจ' : 'ดูรายละเอียด'} <ArrowRight className="w-3 h-3 ml-1" />
            </div>
        </div>
    );
};

export default QuestCard;
