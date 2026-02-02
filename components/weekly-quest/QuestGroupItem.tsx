
import React, { useState, useMemo } from 'react';
import { WeeklyQuest, Task } from '../../types';
import { ChevronDown, ChevronRight, Layers, Trash2, RefreshCw } from 'lucide-react';
import { useQuestCalculator } from '../../hooks/useQuestCalculator';
import QuestItem from './QuestItem';

interface QuestGroupItemProps {
    groupId: string;
    groupTitle: string;
    quests: WeeklyQuest[];
    allTasks: Task[];
    isManageMode: boolean;
    editingId: string | null;
    setEditingId: (id: string | null) => void;
    onUpdateQuest?: (id: string, updates: Partial<WeeklyQuest>) => void;
    onDeleteQuest: (id: string) => void;
    onReviveQuest?: (quest: WeeklyQuest) => void;
    onUpdateManualProgress: (questId: string, val: number) => void;
    showConfirm: (msg: string, title: string) => Promise<boolean>;
}

const QuestGroupItem: React.FC<QuestGroupItemProps> = ({
    groupId, groupTitle, quests, allTasks, isManageMode,
    editingId, setEditingId,
    onUpdateQuest, onDeleteQuest, onReviveQuest, onUpdateManualProgress, showConfirm
}) => {
    const [isExpanded, setIsExpanded] = useState(true);

    // Calculate Group Stats
    const stats = useMemo(() => {
        let totalCurrent = 0;
        let totalTarget = 0;
        let failedCount = 0;

        quests.forEach(q => {
            // Need rudimentary calc here for summary
            // Ideally extract logic or use simplified calc
            // For now, let's use the hook for each? No, hooks inside loops are bad.
            // Let's rely on basic logic similar to QuestCard
             const progress = q.questType === 'MANUAL' ? (q.manualProgress || 0) : 0; // Partial, auto calc needs tasks
             totalTarget += q.targetCount;
        });
        
        return { totalTarget }; // Simplified
    }, [quests]);

    // To get accurate progress for the group bar, we rely on individual QuestItems rendering
    // But for the header summary, we might need a context or just sum visual cues
    // For V1, let's make the header simple: "X Quests"
    
    // Check if ALL are failed?
    // We'll let the individual items show their status.

    const handleDeleteGroup = async () => {
        if(await showConfirm(`ต้องการลบกลุ่ม "${groupTitle}" และภารกิจย่อยทั้งหมด (${quests.length}) ใช่หรือไม่?`, 'ลบทั้งกลุ่ม')) {
            quests.forEach(q => onDeleteQuest(q.id));
        }
    };

    return (
        <div className="bg-slate-50 border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
            {/* Header */}
            <div 
                className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-xl shadow-sm text-indigo-600 border border-slate-100">
                        <Layers className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-800 text-lg">{groupTitle}</h4>
                        <p className="text-xs text-slate-500 font-bold">{quests.length} ภารกิจย่อย</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                     {isManageMode && (
                         <button 
                            onClick={(e) => { e.stopPropagation(); handleDeleteGroup(); }}
                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                         >
                             <Trash2 className="w-4 h-4" />
                         </button>
                     )}
                     <div className="text-slate-400">
                        {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </div>
                </div>
            </div>

            {/* Body */}
            {isExpanded && (
                <div className="p-3 pt-0 space-y-3 border-t border-slate-100 bg-white/50">
                    <div className="h-2"></div> {/* Spacer */}
                    {quests.map(quest => (
                        <QuestItem 
                            key={quest.id}
                            quest={quest}
                            allTasks={allTasks}
                            isManageMode={isManageMode}
                            editingId={editingId}
                            setEditingId={setEditingId}
                            onUpdateQuest={onUpdateQuest}
                            onDeleteQuest={onDeleteQuest}
                            onReviveQuest={onReviveQuest}
                            showConfirm={showConfirm}
                            onUpdateManualProgress={onUpdateManualProgress}
                        />
                    ))}
                    <div className="h-1"></div> {/* Spacer */}
                </div>
            )}
        </div>
    );
};

export default QuestGroupItem;
