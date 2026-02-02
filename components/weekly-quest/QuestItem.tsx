
import React, { useState } from 'react';
import { 
    CheckCircle2, MousePointerClick, Database, ChevronUp, ChevronDown, 
    Trash2, Save, Clock, Skull, RefreshCw, X, Edit2, Minus, Plus
} from 'lucide-react';
import { WeeklyQuest, Task, Platform } from '../../types';
import { CONTENT_FORMATS } from '../../constants';
import { useQuestCalculator } from '../../hooks/useQuestCalculator';
import FormatMultiSelect from '../ui/FormatMultiSelect';
import { format } from 'date-fns';

interface QuestItemProps {
    quest: WeeklyQuest;
    allTasks: Task[];
    isManageMode: boolean;
    editingId: string | null;
    setEditingId: (id: string | null) => void;
    onUpdateQuest?: (id: string, updates: Partial<WeeklyQuest>) => void;
    onDeleteQuest: (id: string) => void;
    onReviveQuest?: (quest: WeeklyQuest) => void;
    showConfirm: (msg: string, title: string) => Promise<boolean>;
    onUpdateManualProgress?: (id: string, val: number) => void;
}

const QuestItem: React.FC<QuestItemProps> = ({
    quest, allTasks, isManageMode,
    editingId, setEditingId,
    onUpdateQuest, onDeleteQuest, onReviveQuest, showConfirm, onUpdateManualProgress
}) => {
    const { 
        matchingTasks, progress, percent, isCompleted, isExpired, isFailed, timeLeftLabel 
    } = useQuestCalculator(quest, allTasks);

    const [isExpanded, setIsExpanded] = useState(false);
    
    // Local Edit State
    const isEditing = editingId === quest.id;
    const [editForm, setEditForm] = useState({
        title: quest.title,
        targetCount: quest.targetCount,
        platform: quest.targetPlatform || 'ALL',
        formatKeys: quest.targetFormat || [],
        status: quest.targetStatus || 'DONE'
    });

    // Reset form when edit mode opens
    React.useEffect(() => {
        if (isEditing) {
            setEditForm({
                title: quest.title,
                targetCount: quest.targetCount,
                platform: quest.targetPlatform || 'ALL',
                formatKeys: quest.targetFormat || [],
                status: quest.targetStatus || 'DONE'
            });
        }
    }, [isEditing, quest]);

    const handleSave = () => {
        if (onUpdateQuest) {
            onUpdateQuest(quest.id, { 
                title: editForm.title, 
                targetCount: Number(editForm.targetCount),
                targetPlatform: editForm.platform,
                targetFormat: editForm.formatKeys,
                targetStatus: editForm.status
            });
        }
        setEditingId(null);
    };

    const handleDelete = async () => {
        if (await showConfirm('ต้องการลบภารกิจนี้ใช่หรือไม่?', 'ยืนยันการลบ')) {
            onDeleteQuest(quest.id);
        }
    };
    
    const handleRevive = async () => {
        const confirmed = await showConfirm(
            `ภารกิจ "${quest.title}" จะถูกคัดลอกมายังสัปดาห์ปัจจุบัน (เริ่มวันนี้) และรีเซ็ตความคืบหน้าเป็น 0`, 
            '🔮 ชุบชีวิตภารกิจ (Revive)'
        );
        if (confirmed && onReviveQuest) {
            onReviveQuest(quest);
        }
    };

    // Manual Progress Handler
    const adjustManualProgress = (delta: number) => {
        if (onUpdateManualProgress) {
            const newVal = Math.max(0, (quest.manualProgress || 0) + delta);
            onUpdateManualProgress(quest.id, newVal);
        }
    };

    const formatOptions = Object.entries(CONTENT_FORMATS).map(([k, v]) => ({ key: k, label: v.split(' ')[0] }));

    return (
        <div 
            className={`
                bg-white border rounded-3xl shadow-sm transition-all relative overflow-visible group
                ${isEditing ? 'border-indigo-400 ring-4 ring-indigo-50 z-20' : 'border-gray-200 hover:border-indigo-200 hover:shadow-md'}
                ${isCompleted ? 'bg-gradient-to-r from-emerald-50/50 to-white' : ''}
                ${isFailed ? 'border-dashed border-slate-300 opacity-90' : ''}
            `}
        >
            {isFailed && !isEditing && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-0 opacity-10">
                        <div className="border-4 border-slate-500 text-slate-500 text-5xl font-black uppercase rotate-[-15deg] p-4 rounded-xl">FAILED</div>
                </div>
            )}

            <div className="p-5 relative z-10">
                <div className="flex justify-between items-start gap-4">
                    {/* Left: Icon & Info */}
                    <div className="flex gap-4 flex-1 min-w-0">
                        <div className={`
                            shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg shadow-sm border
                            ${isCompleted ? 'bg-emerald-100 text-emerald-600 border-emerald-200' : 
                                isFailed ? 'bg-slate-200 text-slate-500 border-slate-300' :
                                quest.questType === 'MANUAL' ? 'bg-orange-100 text-orange-600 border-orange-200' : 'bg-blue-100 text-blue-600 border-blue-200'}
                        `}>
                            {isCompleted ? <CheckCircle2 className="w-7 h-7" /> : isFailed ? <Skull className="w-6 h-6" /> : (
                                quest.questType === 'MANUAL' ? <MousePointerClick className="w-6 h-6" /> : <Database className="w-6 h-6" />
                            )}
                        </div>

                        <div className="flex-1 min-w-0">
                            {/* Title Row */}
                            <div className="flex items-center gap-2 mb-2">
                                {isEditing ? (
                                    <input 
                                        type="text" 
                                        value={editForm.title}
                                        onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                                        className="w-full border-b-2 border-indigo-300 outline-none text-lg font-bold text-gray-800 bg-transparent px-1"
                                        autoFocus
                                    />
                                ) : (
                                    <h4 className={`text-lg font-black truncate leading-tight ${isCompleted ? 'text-emerald-800' : isFailed ? 'text-slate-500 line-through' : 'text-gray-800'}`}>
                                        {quest.title}
                                    </h4>
                                )}
                                
                                {/* Revive Button */}
                                {isFailed && !isEditing && onReviveQuest && (
                                    <button 
                                        onClick={handleRevive}
                                        className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-[10px] font-bold border border-green-200 shadow-sm hover:bg-green-200 transition-colors animate-pulse"
                                    >
                                        <RefreshCw className="w-3 h-3" /> ชุบชีวิต (Revive)
                                    </button>
                                )}
                            </div>

                            {/* Conditions & Status */}
                            {isEditing ? (
                                <div className="grid grid-cols-2 gap-2 mt-3 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100">
                                    <div>
                                        <label className="text-[9px] font-bold text-indigo-400 uppercase">Target</label>
                                        <input 
                                            type="number" 
                                            className="w-full border-b border-indigo-200 bg-transparent text-sm font-bold text-indigo-900 outline-none"
                                            value={editForm.targetCount}
                                            onChange={e => setEditForm({...editForm, targetCount: Number(e.target.value)})}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-bold text-indigo-400 uppercase">Platform</label>
                                        <select 
                                            className="w-full border-b border-indigo-200 bg-transparent text-xs font-bold text-indigo-900 outline-none"
                                            value={editForm.platform}
                                            onChange={e => setEditForm({...editForm, platform: e.target.value as any})}
                                        >
                                            <option value="ALL">All</option>
                                            <option value="YOUTUBE">YouTube</option>
                                            <option value="FACEBOOK">Facebook</option>
                                            <option value="TIKTOK">TikTok</option>
                                            <option value="INSTAGRAM">Instagram</option>
                                        </select>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-[9px] font-bold text-indigo-400 uppercase mb-1 block">Format</label>
                                        <FormatMultiSelect 
                                            options={formatOptions}
                                            selectedKeys={editForm.formatKeys}
                                            onChange={(keys) => setEditForm({...editForm, formatKeys: keys})}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-wrap gap-2 text-[10px] font-bold text-gray-500">
                                    <span className="bg-gray-100 px-2 py-1 rounded border border-gray-200">
                                        {quest.targetPlatform === 'ALL' ? 'ทุกช่องทาง' : quest.targetPlatform}
                                    </span>
                                    {quest.targetFormat && quest.targetFormat.length > 0 && (
                                        <span className="bg-gray-100 px-2 py-1 rounded border border-gray-200">
                                            {quest.targetFormat.join(', ')}
                                        </span>
                                    )}
                                    <span className={`flex items-center gap-1 px-2 py-1 rounded border ${isExpired ? 'bg-red-50 text-red-500 border-red-100' : 'bg-gray-50 border-gray-200'}`}>
                                        <Clock className="w-3 h-3" /> {timeLeftLabel}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Progress & Controls */}
                    <div className="flex flex-col items-end gap-2">
                        {isManageMode || isEditing ? (
                            <div className="flex gap-1">
                                {isEditing ? (
                                    <>
                                        <button onClick={() => setEditingId(null)} className="p-2 bg-gray-100 text-gray-500 rounded-lg hover:bg-gray-200"><X className="w-4 h-4"/></button>
                                        <button onClick={handleSave} className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-md"><Save className="w-4 h-4"/></button>
                                    </>
                                ) : (
                                    <>
                                        <button onClick={() => setEditingId(quest.id)} className="p-2 bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-100"><Edit2 className="w-4 h-4"/></button>
                                        <button onClick={handleDelete} className="p-2 bg-white border border-red-200 text-red-500 rounded-lg hover:bg-red-50"><Trash2 className="w-4 h-4"/></button>
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className="text-right">
                                    <div className={`text-2xl font-black leading-none ${isFailed ? 'text-slate-400' : 'text-gray-800'}`}>
                                        {progress}<span className="text-sm text-gray-400 font-bold mx-1">/</span>{quest.targetCount}
                                    </div>
                                    {quest.questType === 'MANUAL' && !isExpired && (
                                        <div className="flex items-center gap-1 mt-1 justify-end">
                                            <button onClick={() => adjustManualProgress(-1)} className="p-1 text-gray-400 hover:bg-gray-100 rounded"><Minus className="w-3 h-3" /></button>
                                            <button onClick={() => adjustManualProgress(1)} className="p-1 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded border border-indigo-100"><Plus className="w-3 h-3" /></button>
                                        </div>
                                    )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Progress Bar (Frozen if failed) */}
                {!isManageMode && !isEditing && (
                    <div className="mt-4 relative h-3 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                        <div 
                            className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ${isCompleted ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : isFailed ? 'bg-slate-400' : 'bg-gradient-to-r from-blue-400 to-indigo-500'}`}
                            style={{ width: `${percent}%` }}
                        />
                    </div>
                )}

                {/* Expand Toggle */}
                {quest.questType === 'AUTO' && matchingTasks.length > 0 && !isManageMode && !isEditing && (
                    <button 
                        onClick={() => setIsExpanded(!isExpanded)} 
                        className="w-full mt-3 pt-2 border-t border-gray-50 flex items-center justify-center text-xs font-bold text-gray-400 hover:text-indigo-600 transition-colors gap-1"
                    >
                        {isExpanded ? 'ซ่อนรายการ' : `ดู ${matchingTasks.length} งานที่นับยอด`} 
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                )}

                {/* Expanded Task List */}
                {isExpanded && (
                    <div className="mt-3 space-y-1 animate-in slide-in-from-top-2">
                        {matchingTasks.map(task => (
                            <div key={task.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-100 text-xs">
                                <CheckCircle2 className="w-3 h-3 text-green-500" />
                                <span className="font-bold text-gray-600 truncate flex-1">{task.title}</span>
                                <span className="text-[10px] text-gray-400">{format(task.endDate, 'd MMM')}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default QuestItem;
