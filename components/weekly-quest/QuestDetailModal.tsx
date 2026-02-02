
import React, { useState, useMemo } from 'react';
import { 
    X, Target, Settings, Calendar
} from 'lucide-react';
import { WeeklyQuest, Task, Channel } from '../../types';
import { format } from 'date-fns';
import { useGlobalDialog } from '../../context/GlobalDialogContext';
import QuestItem from './QuestItem';
import QuestGroupItem from './QuestGroupItem';

interface QuestDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    channel?: Channel; 
    quests: WeeklyQuest[];
    allTasks: Task[]; 
    weekStart: Date;
    weekEnd: Date;
    onUpdateManualProgress: (questId: string, newValue: number) => void;
    onDeleteQuest: (id: string) => void;
    onUpdateQuest?: (id: string, updates: Partial<WeeklyQuest>) => void;
    onReviveQuest?: (quest: WeeklyQuest) => void; 
}

const QuestDetailModal: React.FC<QuestDetailModalProps> = ({ 
    isOpen, onClose, channel, quests, allTasks, weekStart, weekEnd, 
    onUpdateManualProgress, onDeleteQuest, onUpdateQuest, onReviveQuest 
}) => {
    const [isManageMode, setIsManageMode] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const { showConfirm } = useGlobalDialog();

    // --- Logic: Grouping ---
    const { groups, orphans } = useMemo(() => {
        const groupsMap: Record<string, { title: string, items: WeeklyQuest[] }> = {};
        const orphansList: WeeklyQuest[] = [];

        quests.forEach(q => {
            if (q.groupId && q.groupTitle) {
                if (!groupsMap[q.groupId]) {
                    groupsMap[q.groupId] = { title: q.groupTitle, items: [] };
                }
                groupsMap[q.groupId].items.push(q);
            } else {
                orphansList.push(q);
            }
        });

        return { groups: groupsMap, orphans: orphansList };
    }, [quests]);

    if (!isOpen) return null;

    const modalBg = channel?.color.replace('text-', 'bg-').replace('bg-', 'bg-opacity-10 ') || 'bg-gray-50';
    const accentColor = channel?.color.split(' ')[1] || 'text-gray-800';

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200 font-sans">
            <div className="bg-[#f8fafc] w-full max-w-3xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] scale-100 animate-in zoom-in-95 duration-200 border-4 border-white ring-1 ring-gray-200">
                
                {/* Detail Header */}
                <div className={`px-6 py-6 border-b border-gray-100 flex justify-between items-start ${modalBg}`}>
                    <div className="flex items-center gap-4">
                        {channel?.logoUrl ? (
                            <img src={channel.logoUrl} className="w-16 h-16 rounded-2xl object-cover shadow-sm border-2 border-white" alt="logo" />
                        ) : (
                            <div className="w-16 h-16 rounded-2xl bg-white border-2 border-white shadow-sm flex items-center justify-center text-2xl font-black text-gray-300">
                                {channel?.name ? channel.name.substring(0,2).toUpperCase() : <Target className="w-8 h-8"/>}
                            </div>
                        )}
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h2 className={`text-2xl font-black ${accentColor}`}>
                                    {channel ? channel.name : 'ทั่วไป (Misc)'}
                                </h2>
                                <span className="bg-white/60 px-2 py-0.5 rounded-lg text-[10px] font-bold text-gray-500 border border-white/50 backdrop-blur-sm">
                                    {quests.length} Quests
                                </span>
                            </div>
                            <p className="text-xs font-bold text-gray-500 flex items-center bg-white/40 w-fit px-2 py-1 rounded-lg">
                                <Calendar className="w-3.5 h-3.5 mr-1.5 opacity-60" />
                                Week: {format(weekStart, 'd MMM')} - {format(weekEnd, 'd MMM')}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {onUpdateQuest && (
                            <button 
                                onClick={() => { setIsManageMode(!isManageMode); setEditingId(null); }}
                                className={`p-2.5 rounded-xl transition-all flex items-center gap-2 px-4 text-xs font-bold shadow-sm ${isManageMode ? 'bg-indigo-600 text-white shadow-indigo-200' : 'bg-white hover:bg-gray-50 text-gray-600 border border-gray-100'}`}
                            >
                                <Settings className="w-4 h-4" /> {isManageMode ? 'เสร็จสิ้น (Done)' : 'จัดการ (Manage)'}
                            </button>
                        )}
                        <button onClick={onClose} className="p-2.5 bg-white border border-gray-100 hover:bg-gray-50 rounded-xl transition-colors text-gray-400">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Detail Body */}
                <div className="p-6 overflow-y-auto flex-1 space-y-5">
                    {quests.length === 0 ? (
                        <div className="text-center py-16 text-gray-400 border-2 border-dashed border-gray-200 rounded-3xl bg-white">
                            <Target className="w-16 h-16 mx-auto mb-3 opacity-20" />
                            <h3 className="text-lg font-bold text-gray-600">ยังไม่มีภารกิจ</h3>
                            <p className="text-sm">สร้างภารกิจใหม่เพื่อเริ่มติดตามผลงาน</p>
                        </div>
                    ) : (
                        <>
                            {/* Render Groups First */}
                            {Object.entries(groups).map(([gId, group]) => {
                                const typedGroup = group as { title: string, items: WeeklyQuest[] };
                                return (
                                    <QuestGroupItem 
                                        key={gId}
                                        groupId={gId}
                                        groupTitle={typedGroup.title}
                                        quests={typedGroup.items}
                                        allTasks={allTasks}
                                        isManageMode={isManageMode}
                                        editingId={editingId}
                                        setEditingId={setEditingId}
                                        onUpdateQuest={onUpdateQuest}
                                        onDeleteQuest={onDeleteQuest}
                                        onReviveQuest={onReviveQuest}
                                        onUpdateManualProgress={onUpdateManualProgress}
                                        showConfirm={showConfirm}
                                    />
                                );
                            })}

                            {/* Render Orphans */}
                            {orphans.map((quest) => (
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
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QuestDetailModal;
