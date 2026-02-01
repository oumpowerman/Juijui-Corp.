
import React from 'react';
import { ArrowRight, CheckCircle2, Layout, MousePointerClick, Database, Calendar, Flame, Zap } from 'lucide-react';
import { WeeklyQuest, Task, Channel, Platform } from '../../types';
import { addDays, isWithinInterval, format, differenceInDays, isSameDay } from 'date-fns';

interface QuestCardProps {
    channel?: Channel; 
    quests: WeeklyQuest[];
    allTasks: Task[]; // Receive ALL tasks to filter by specific quest range
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
            // 0. Filter out Stock / Unscheduled Items
            if (t.isUnscheduled) return false;

            // 1. Check Date Range (Use Task End Date)
            if (!t.endDate) return false;
            const taskDate = new Date(t.endDate);
            const inRange = isWithinInterval(taskDate, { start: qStart, end: qEnd });
            if (!inRange) return false;

            // 2. Check Criteria
            const matchChannel = quest.channelId ? t.channelId === quest.channelId : true;
            const matchStatus = quest.targetStatus ? t.status === quest.targetStatus : t.status === 'DONE';
            
            // 3. Platform Check (Wildcard Logic)
            let matchPlatform = true;
            if (quest.targetPlatform) {
                if (quest.targetPlatform === 'ALL') {
                     // Quest wants ALL -> Task must have at least one platform
                     matchPlatform = (t.targetPlatforms && t.targetPlatforms.length > 0) || false;
                } else {
                     // Quest wants Specific (e.g. FACEBOOK)
                     // Task counts if it has FACEBOOK OR if task is marked as ALL
                     const hasSpecific = t.targetPlatforms?.includes(quest.targetPlatform as Platform);
                     const hasAll = t.targetPlatforms?.includes('ALL');
                     matchPlatform = hasSpecific || hasAll || false;
                }
            }
            
            // 4. Format Check (Array inclusion)
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
    
    // Styling constants
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
                            {/* Logo / Initials */}
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
                            
                            {/* Name */}
                            <div>
                                <h3 className={`font-black text-xl tracking-tight leading-tight ${textColor}`}>
                                    {isMisc ? 'ทั่วไป (Misc)' : channel?.name}
                                </h3>
                                <p className="text-xs opacity-60 font-bold mt-1 flex items-center">
                                    <Calendar className="w-3 h-3 mr-1" /> {quests.length} Active Plans
                                </p>
                            </div>
                    </div>
                    
                    {/* Percent */}
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
                    
                    // Display Date Range if unusual
                    const qStart = new Date(quest.weekStartDate);
                    const qEnd = quest.endDate ? new Date(quest.endDate) : addDays(qStart, 6);
                    const dateLabel = `${format(qStart, 'd/M')} - ${format(qEnd, 'd/M')}`;
                    
                    const formatCount = quest.targetFormat ? quest.targetFormat.length : 0;

                    // --- HEAT LOGIC (4 Levels) ---
                    const daysRemaining = differenceInDays(qEnd, new Date());
                    
                    let heatClass = 'py-1'; // Default spacing
                    let HeatIcon = null;

                    if (!isCompleted) {
                        if (daysRemaining <= 0) {
                            // Level 4: Inferno (Today/Overdue)
                            heatClass = 'bg-red-50 border border-red-200 shadow-[0_0_10px_rgba(239,68,68,0.15)] rounded-lg p-2 -mx-2 animate-pulse';
                            HeatIcon = <Flame className="w-3.5 h-3.5 text-red-600 fill-red-600 animate-bounce shrink-0" />;
                        } else if (daysRemaining === 1) {
                            // Level 3: Burning (Tomorrow)
                            heatClass = 'bg-orange-50 border border-orange-200 rounded-lg p-2 -mx-2';
                            HeatIcon = <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500 shrink-0" />;
                        } else if (daysRemaining === 2) {
                            // Level 2: Hot (2 Days)
                            heatClass = 'bg-orange-50/50 border border-orange-100 rounded-lg p-2 -mx-2';
                            HeatIcon = <Flame className="w-3.5 h-3.5 text-orange-400 shrink-0" />;
                        } else if (daysRemaining === 3) {
                            // Level 1: Warm (3 Days)
                            heatClass = 'bg-yellow-50/40 border border-yellow-100/50 rounded-lg p-2 -mx-2';
                        }
                    }

                    return (
                        <div key={quest.id} className={`relative transition-all duration-300 ${heatClass}`}>
                            <div className="flex justify-between items-center mb-1.5 text-sm">
                                <div className="flex items-center gap-2 max-w-[75%]">
                                    {/* Heat Icon Priority */}
                                    {HeatIcon ? HeatIcon : (quest.questType === 'MANUAL' && <MousePointerClick className="w-3 h-3 text-gray-400 shrink-0" />)}
                                    
                                    <span className={`font-medium truncate ${isCompleted ? 'text-gray-400 line-through' : daysRemaining <= 0 ? 'text-red-700 font-bold' : 'text-gray-700'}`}>
                                        {quest.title}
                                    </span>
                                    
                                    {/* Format Badge for Auto */}
                                    <div className="flex gap-1 shrink-0">
                                        {quest.questType === 'AUTO' && formatCount > 0 && (
                                            <span className="text-[8px] bg-purple-50 text-purple-600 px-1 rounded border border-purple-100" title={quest.targetFormat?.join(', ')}>
                                                {formatCount === 1 ? quest.targetFormat![0] : `${formatCount} Formats`}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right flex items-center gap-2">
                                     {quest.questType === 'MANUAL' && onUpdateManualProgress && (
                                         <div className="flex items-center bg-gray-100 rounded-lg p-0.5 border border-gray-200" onClick={e => e.stopPropagation()}>
                                             <button 
                                                 onClick={() => onUpdateManualProgress(quest.id, Math.max(0, (quest.manualProgress || 0) - 1))} 
                                                 className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-white rounded transition-colors"
                                             >
                                                 -
                                             </button>
                                             <button 
                                                 onClick={() => onUpdateManualProgress(quest.id, (quest.manualProgress || 0) + 1)} 
                                                 className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-green-500 hover:bg-white rounded transition-colors"
                                             >
                                                 +
                                             </button>
                                         </div>
                                     )}
                                    <span className={`text-xs font-bold ${isCompleted ? 'text-emerald-600' : 'text-gray-400'}`}>{progress}/{quest.targetCount}</span>
                                </div>
                            </div>
                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full transition-all duration-700 ${isCompleted ? 'bg-emerald-500' : daysRemaining <= 0 ? 'bg-red-500' : daysRemaining <= 2 ? 'bg-orange-400' : 'bg-gray-300'}`} style={{ width: `${percent}%` }} />
                            </div>
                            <div className={`text-[9px] text-right mt-0.5 ${daysRemaining <= 1 && !isCompleted ? 'text-red-500 font-bold' : 'text-gray-300'}`}>
                                {dateLabel} {daysRemaining <= 1 && !isCompleted && '(ใกล้หมดเวลา!)'}
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
