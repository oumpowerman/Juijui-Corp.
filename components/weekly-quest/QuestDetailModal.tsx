
import React, { useState } from 'react';
import { X, CheckCircle2, MousePointerClick, Database, ChevronUp, ChevronDown, Calendar, Target } from 'lucide-react';
import { WeeklyQuest, Task, Channel, Platform } from '../../types';
import { format, addDays, isWithinInterval } from 'date-fns';

interface QuestDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    channel?: Channel; // undefined if misc
    quests: WeeklyQuest[];
    allTasks: Task[]; // Receive all tasks to filter correctly by quest range
    tasksInWeek?: Task[]; // Made optional as it is deprecated/unused
    weekStart: Date;
    weekEnd: Date;
    onUpdateManualProgress: (questId: string, newValue: number) => void;
}

const QuestDetailModal: React.FC<QuestDetailModalProps> = ({ 
    isOpen, onClose, channel, quests, allTasks, weekStart, weekEnd, onUpdateManualProgress 
}) => {
    const [expandedQuestId, setExpandedQuestId] = useState<string | null>(null);

    if (!isOpen) return null;

    // --- Logic Reused (Same as QuestCard) ---
    const getMatchingTasks = (quest: WeeklyQuest) => {
        if (quest.questType === 'MANUAL') return [];
        
        const qStart = new Date(quest.weekStartDate);
        qStart.setHours(0, 0, 0, 0);
        
        const qEnd = addDays(qStart, 6); 
        qEnd.setHours(23, 59, 59, 999);

        return allTasks.filter(t => {
             // 1. Date Range
             if (!t.endDate) return false;
             const taskDate = new Date(t.endDate);
             const inRange = isWithinInterval(taskDate, { start: qStart, end: qEnd });
             if (!inRange) return false;

             // 2. Criteria
            const matchChannel = quest.channelId ? t.channelId === quest.channelId : true;
            const matchStatus = quest.targetStatus ? t.status === quest.targetStatus : t.status === 'DONE';
            let matchPlatform = true;
            if (quest.targetPlatform === 'ALL') {
                matchPlatform = (t.targetPlatforms && t.targetPlatforms.length > 0) || false;
            } else if (quest.targetPlatform) {
                matchPlatform = (t.targetPlatforms && t.targetPlatforms.includes(quest.targetPlatform as Platform)) || false;
            }
            const matchFormat = quest.targetFormat ? t.contentFormat === quest.targetFormat : true;
            return matchStatus && matchChannel && matchPlatform && matchFormat;
        });
    };

    const calculateProgress = (quest: WeeklyQuest) => {
        if (quest.questType === 'MANUAL') return quest.manualProgress || 0;
        return getMatchingTasks(quest).length;
    };

    // Styling
    const modalBg = channel?.color.replace('text-', 'bg-').replace('bg-', 'bg-opacity-10 ') || 'bg-gray-50';

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] scale-100 animate-in zoom-in-95 duration-200">
                {/* Detail Header */}
                <div className={`px-6 py-5 border-b border-gray-100 flex justify-between items-center ${modalBg}`}>
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800">
                            {channel ? channel.name : 'ทั่วไป (Misc)'}
                        </h2>
                        <p className="text-xs opacity-70 font-medium mt-0.5 text-gray-600">
                            Viewing: {format(weekStart, 'd MMM')} - {format(weekEnd, 'd MMM')}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white/50 hover:bg-white rounded-full transition-colors text-gray-500">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Detail Body */}
                <div className="p-6 overflow-y-auto flex-1 space-y-4">
                    {quests.length === 0 ? (
                        <div className="text-center py-12 text-gray-400 border-2 border-dashed border-gray-100 rounded-2xl">
                            <Target className="w-12 h-12 mx-auto mb-2 opacity-20" />
                            <p>ยังไม่มีภารกิจในช่องนี้</p>
                        </div>
                    ) : (
                        quests.map(quest => {
                            const matchingTasks = getMatchingTasks(quest);
                            const progress = calculateProgress(quest);
                            const percent = Math.min((progress / quest.targetCount) * 100, 100);
                            const isCompleted = percent >= 100;
                            const isExpanded = expandedQuestId === quest.id;

                            // Date Info
                            const qStart = new Date(quest.weekStartDate);
                            const qEnd = addDays(qStart, 6);
                            const dateLabel = `${format(qStart, 'd MMM')} - ${format(qEnd, 'd MMM')}`;

                            return (
                                <div key={quest.id} className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm hover:border-indigo-100 transition-colors">
                                    {/* Quest Row */}
                                    <div className="flex justify-between items-center mb-3">
                                        <div className="flex items-center gap-3">
                                            {/* Type Icon */}
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${isCompleted ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
                                                {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : (
                                                    quest.questType === 'MANUAL' ? <MousePointerClick className="w-4 h-4" /> : <Database className="w-4 h-4" />
                                                )}
                                            </div>
                                            <div>
                                                <h4 className={`font-bold flex items-center gap-2 ${isCompleted ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                                                    {quest.title}
                                                    <span className="text-[10px] text-gray-400 font-normal bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                                                        {dateLabel}
                                                    </span>
                                                </h4>
                                                <div className="flex gap-1 mt-1">
                                                     {quest.questType === 'AUTO' && (
                                                            <>
                                                                {quest.targetFormat && <span className="text-[9px] bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded border border-purple-100 font-medium">{quest.targetFormat}</span>}
                                                                {quest.targetPlatform === 'ALL' && <span className="text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100 font-medium">All Platforms</span>}
                                                            </>
                                                        )}
                                                        {quest.questType === 'MANUAL' && <span className="text-[9px] bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded border border-orange-100 font-medium">Manual</span>}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-2">
                                            {/* Manual Controls */}
                                            {quest.questType === 'MANUAL' && (
                                                <div className="flex items-center bg-gray-100 rounded-lg p-0.5 mr-2">
                                                    <button 
                                                        onClick={() => onUpdateManualProgress(quest.id, Math.max(0, (quest.manualProgress || 0) - 1))} 
                                                        className="w-6 h-6 flex items-center justify-center text-gray-500 hover:bg-white hover:text-red-500 rounded transition-colors"
                                                    >
                                                        -
                                                    </button>
                                                    <span className="w-6 text-center text-xs font-bold">{quest.manualProgress || 0}</span>
                                                    <button 
                                                        onClick={() => onUpdateManualProgress(quest.id, (quest.manualProgress || 0) + 1)} 
                                                        className="w-6 h-6 flex items-center justify-center text-gray-500 hover:bg-white hover:text-green-500 rounded transition-colors"
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                            )}

                                            <div className="text-sm font-bold mr-2 text-gray-600">{progress}/{quest.targetCount}</div>

                                            {quest.questType === 'AUTO' && matchingTasks.length > 0 && (
                                                <button onClick={() => setExpandedQuestId(isExpanded ? null : quest.id)} className={`p-1.5 rounded-lg flex items-center gap-1 text-xs font-bold transition-colors ${isExpanded ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400 hover:bg-gray-100'}`}>
                                                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* Progress Bar */}
                                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-2">
                                        <div className={`h-full rounded-full transition-all duration-700 ${isCompleted ? 'bg-emerald-500' : 'bg-indigo-500'}`} style={{ width: `${percent}%` }} />
                                    </div>

                                    {/* Expanded Tasks List */}
                                    {isExpanded && matchingTasks.length > 0 && (
                                        <div className="mt-3 pt-3 border-t border-gray-50 space-y-2 animate-in slide-in-from-top-1">
                                            {matchingTasks.map(t => (
                                                <div key={t.id} className="flex items-center justify-between text-xs bg-gray-50 p-2 rounded-lg">
                                                    <div className="flex items-center gap-2 overflow-hidden">
                                                        <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0" />
                                                        <span className="truncate text-gray-700 font-medium">{t.title}</span>
                                                    </div>
                                                    <span className="text-[10px] text-gray-400 whitespace-nowrap">{format(t.endDate, 'd MMM')}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

export default QuestDetailModal;
