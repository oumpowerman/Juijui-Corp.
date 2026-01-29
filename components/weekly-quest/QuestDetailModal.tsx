
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
    X, CheckCircle2, MousePointerClick, Database, ChevronUp, ChevronDown, 
    Calendar, Target, Edit2, Trash2, Save, Settings, AlertCircle, 
    ExternalLink, Layers, MonitorPlay, FileText, Clock, CheckSquare, Square
} from 'lucide-react';
import { WeeklyQuest, Task, Channel, Platform } from '../../types';
import { format, addDays, isWithinInterval, differenceInDays, isPast, isToday } from 'date-fns';
import { useGlobalDialog } from '../../context/GlobalDialogContext';
import { STATUS_COLORS, CONTENT_FORMATS } from '../../constants';

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
}

// Re-using MultiSelect component (Duplicate for simplicity within same feature module)
const FormatMultiSelect = ({ 
    options, 
    selectedKeys = [], 
    onChange 
}: { 
    options: { key: string, label: string }[], 
    selectedKeys: string[], 
    onChange: (keys: string[]) => void 
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState<{ top: number, left: number, width: number } | null>(null);

    const updatePosition = () => {
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            setPosition({
                top: rect.bottom + 4,
                left: rect.left,
                width: rect.width
            });
        }
    };

    const toggleOpen = () => {
        if (!isOpen) {
            updatePosition();
        }
        setIsOpen(!isOpen);
    };

    useEffect(() => {
        if (!isOpen) return;
        window.addEventListener('scroll', updatePosition, true);
        window.addEventListener('resize', updatePosition);
        return () => {
            window.removeEventListener('scroll', updatePosition, true);
            window.removeEventListener('resize', updatePosition);
        };
    }, [isOpen]);

    const toggleSelection = (key: string) => {
        if (selectedKeys.includes(key)) {
            onChange(selectedKeys.filter(k => k !== key));
        } else {
            onChange([...selectedKeys, key]);
        }
    };

    const displayText = selectedKeys.length === 0 
        ? '(ทุกรูปแบบ)' 
        : selectedKeys.length === 1 
            ? options.find(o => o.key === selectedKeys[0])?.label || selectedKeys[0]
            : `${selectedKeys.length} รูปแบบ`;

    return (
        <div className="relative w-full" ref={containerRef}>
            <button 
                type="button"
                onClick={toggleOpen}
                className={`w-full border-b-2 border-indigo-200 px-1 py-1 text-xs font-bold flex justify-between items-center bg-transparent ${isOpen ? 'border-indigo-400' : ''}`}
            >
                <span className={`truncate ${selectedKeys.length > 0 ? 'text-indigo-600' : 'text-gray-400'}`}>
                    {displayText}
                </span>
                <ChevronDown className="w-3 h-3 text-gray-400 ml-1 shrink-0" />
            </button>
            
            {isOpen && position && createPortal(
                <>
                    <div className="fixed inset-0 z-[9998]" onClick={() => setIsOpen(false)} />
                    <div 
                        className="fixed z-[9999] bg-white rounded-xl shadow-xl border border-gray-100 p-1.5 max-h-[200px] overflow-y-auto animate-in fade-in zoom-in-95 duration-100"
                        style={{
                            top: position.top,
                            left: position.left,
                            width: position.width
                        }}
                    >
                        {options.map(opt => {
                            const isSelected = selectedKeys.includes(opt.key);
                            return (
                                <div 
                                    key={opt.key}
                                    onClick={() => toggleSelection(opt.key)}
                                    className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors text-xs ${isSelected ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-gray-50 text-gray-600'}`}
                                >
                                    {isSelected 
                                        ? <CheckSquare className="w-3.5 h-3.5 text-indigo-500 shrink-0" /> 
                                        : <Square className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                                    }
                                    <span className="truncate">{opt.label}</span>
                                </div>
                            )
                        })}
                    </div>
                </>,
                document.body
            )}
        </div>
    );
};

const QuestDetailModal: React.FC<QuestDetailModalProps> = ({ 
    isOpen, onClose, channel, quests, allTasks, weekStart, weekEnd, onUpdateManualProgress, onDeleteQuest, onUpdateQuest 
}) => {
    const [expandedQuestId, setExpandedQuestId] = useState<string | null>(quests.length === 1 ? quests[0].id : null);
    const [isManageMode, setIsManageMode] = useState(false);
    
    // Inline Edit State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [editTarget, setEditTarget] = useState(0);
    const [editPlatform, setEditPlatform] = useState<Platform | 'ALL' | ''>('');
    const [editFormatKeys, setEditFormatKeys] = useState<string[]>([]);
    const [editStatus, setEditStatus] = useState('');

    const { showConfirm } = useGlobalDialog();

    if (!isOpen) return null;

    // --- Logic Reused & Enhanced ---
    const getMatchingTasks = (quest: WeeklyQuest) => {
        if (quest.questType === 'MANUAL') return [];
        
        const qStart = new Date(quest.weekStartDate);
        qStart.setHours(0, 0, 0, 0);
        
        const qEnd = quest.endDate ? new Date(quest.endDate) : addDays(qStart, 6);
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
            
            // 3. Platform Check (Wildcard Logic)
            let matchPlatform = true;
            if (quest.targetPlatform) {
                if (quest.targetPlatform === 'ALL') {
                     matchPlatform = (t.targetPlatforms && t.targetPlatforms.length > 0) || false;
                } else {
                     // Check if specific platform matches OR if task is wildcard 'ALL'
                     const hasSpecific = t.targetPlatforms?.includes(quest.targetPlatform as Platform);
                     const hasAll = t.targetPlatforms?.includes('ALL');
                     matchPlatform = hasSpecific || hasAll || false;
                }
            }
            
            // 4. Format check: Array inclusion
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

    const handleDelete = async (id: string) => {
        if (await showConfirm('ต้องการลบภารกิจนี้ใช่หรือไม่?', 'ยืนยันการลบ')) {
            onDeleteQuest(id);
        }
    };

    const startEditing = (quest: WeeklyQuest) => {
        setEditingId(quest.id);
        setEditTitle(quest.title);
        setEditTarget(quest.targetCount);
        setEditPlatform(quest.targetPlatform || 'ALL');
        setEditFormatKeys(quest.targetFormat || []);
        setEditStatus(quest.targetStatus || 'DONE');
    };

    const saveEditing = (id: string) => {
        if (onUpdateQuest) {
            onUpdateQuest(id, { 
                title: editTitle, 
                targetCount: Number(editTarget),
                targetPlatform: editPlatform || 'ALL',
                targetFormat: editFormatKeys,
                targetStatus: editStatus
            });
        }
        setEditingId(null);
    };

    // --- Format Helpers ---
    const getDaysRemaining = (endDateStr?: Date) => {
        if(!endDateStr) return '';
        const end = new Date(endDateStr);
        const today = new Date();
        const diff = differenceInDays(end, today);
        
        if (isPast(end) && !isToday(end)) return 'จบแล้ว';
        if (isToday(end)) return 'วันสุดท้าย';
        return `เหลือ ${diff} วัน`;
    };

    // Styling
    const modalBg = channel?.color.replace('text-', 'bg-').replace('bg-', 'bg-opacity-10 ') || 'bg-gray-50';
    const accentColor = channel?.color.split(' ')[1] || 'text-gray-800';

    // Format Options (Static Fallback)
    const formatOptions = Object.entries(CONTENT_FORMATS).map(([k, v]) => ({ key: k, label: v.split(' ')[0] }));

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
                        quests.map((quest, index) => {
                            const isEditingThis = editingId === quest.id;
                            const matchingTasks = getMatchingTasks(quest);
                            const progress = calculateProgress(quest);
                            const percent = Math.min((progress / quest.targetCount) * 100, 100);
                            const isCompleted = percent >= 100;
                            const isExpanded = expandedQuestId === quest.id;

                            // Date Info
                            const qEnd = quest.endDate ? new Date(quest.endDate) : addDays(new Date(quest.weekStartDate), 6);
                            const timeLeft = getDaysRemaining(qEnd);
                            const isExpired = isPast(qEnd) && !isToday(qEnd);

                            return (
                                <div 
                                    key={quest.id} 
                                    className={`
                                        bg-white border rounded-3xl shadow-sm transition-all relative overflow-visible group
                                        ${isEditingThis ? 'border-indigo-400 ring-4 ring-indigo-50 z-20' : 'border-gray-200 hover:border-indigo-200 hover:shadow-md'}
                                        ${isCompleted ? 'bg-gradient-to-r from-emerald-50/50 to-white' : ''}
                                    `}
                                >
                                    {/* Edit Mode Overlay Badge */}
                                    {isEditingThis && (
                                        <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl z-20 pointer-events-none">
                                            Editing Mode
                                        </div>
                                    )}

                                    <div className="p-5">
                                        <div className="flex justify-between items-start gap-4">
                                            {/* Left: Icon & Info */}
                                            <div className="flex gap-4 flex-1 min-w-0">
                                                <div className={`
                                                    shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg shadow-sm border
                                                    ${isCompleted ? 'bg-emerald-100 text-emerald-600 border-emerald-200' : 
                                                      quest.questType === 'MANUAL' ? 'bg-orange-100 text-orange-600 border-orange-200' : 'bg-blue-100 text-blue-600 border-blue-200'}
                                                `}>
                                                    {isCompleted ? <CheckCircle2 className="w-7 h-7" /> : (
                                                        quest.questType === 'MANUAL' ? <MousePointerClick className="w-6 h-6" /> : <Database className="w-6 h-6" />
                                                    )}
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    {/* Title Row */}
                                                    <div className="flex items-center gap-2 mb-2">
                                                        {isEditingThis ? (
                                                            <input 
                                                                type="text" 
                                                                value={editTitle}
                                                                onChange={(e) => setEditTitle(e.target.value)}
                                                                className="w-full border-b-2 border-indigo-300 outline-none text-lg font-bold text-gray-800 bg-transparent px-1"
                                                                autoFocus
                                                            />
                                                        ) : (
                                                            <h4 className={`text-lg font-black truncate leading-tight ${isCompleted ? 'text-emerald-800' : 'text-gray-800'}`}>
                                                                {quest.title}
                                                            </h4>
                                                        )}
                                                        {!isEditingThis && !isCompleted && isExpired && (
                                                            <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold border border-red-200 whitespace-nowrap">
                                                                หมดเวลา
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Conditions Row (Edit Mode) */}
                                                    {isEditingThis && quest.questType === 'AUTO' && (
                                                        <div className="grid grid-cols-3 gap-2 mb-2">
                                                            <select 
                                                                className="w-full text-xs font-bold border-b-2 border-indigo-200 outline-none py-1 bg-transparent text-gray-600 focus:border-indigo-500"
                                                                value={editPlatform}
                                                                onChange={e => setEditPlatform(e.target.value as Platform | 'ALL')}
                                                            >
                                                                <option value="ALL">All Platforms</option>
                                                                <option value="FACEBOOK">Facebook</option>
                                                                <option value="YOUTUBE">YouTube</option>
                                                                <option value="TIKTOK">TikTok</option>
                                                                <option value="INSTAGRAM">Instagram</option>
                                                            </select>
                                                            
                                                            <FormatMultiSelect 
                                                                options={formatOptions}
                                                                selectedKeys={editFormatKeys}
                                                                onChange={setEditFormatKeys}
                                                            />
                                                            
                                                            <select 
                                                                className="w-full text-xs font-bold border-b-2 border-indigo-200 outline-none py-1 bg-transparent text-gray-600 focus:border-indigo-500"
                                                                value={editStatus}
                                                                onChange={e => setEditStatus(e.target.value)}
                                                            >
                                                                <option value="DONE">Done ✅</option>
                                                                <option value="APPROVE">Approve 👍</option>
                                                            </select>
                                                        </div>
                                                    )}

                                                    {/* Badges Row (View Mode) */}
                                                    {!isEditingThis && (
                                                        <div className="flex flex-wrap gap-2 text-[10px] font-bold text-gray-500">
                                                            {quest.questType === 'AUTO' ? (
                                                                <>
                                                                    <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded border border-gray-200">
                                                                        <MonitorPlay className="w-3 h-3" />
                                                                        {quest.targetPlatform === 'ALL' || !quest.targetPlatform ? 'All Platforms' : quest.targetPlatform}
                                                                    </span>
                                                                    
                                                                    {quest.targetFormat && quest.targetFormat.length > 0 && (
                                                                        <span className="flex items-center gap-1 bg-purple-50 text-purple-700 px-2 py-1 rounded border border-purple-100" title={quest.targetFormat.join(', ')}>
                                                                            <Layers className="w-3 h-3" />
                                                                            {quest.targetFormat.length === 1 ? quest.targetFormat[0] : `${quest.targetFormat.length} Formats`}
                                                                        </span>
                                                                    )}

                                                                    {quest.targetStatus && (
                                                                        <span className="flex items-center gap-1 bg-yellow-50 text-yellow-700 px-2 py-1 rounded border border-yellow-100">
                                                                            <FileText className="w-3 h-3" />
                                                                            Status: {quest.targetStatus}
                                                                        </span>
                                                                    )}
                                                                </>
                                                            ) : (
                                                                <span className="flex items-center gap-1 bg-orange-50 text-orange-700 px-2 py-1 rounded border border-orange-100">
                                                                    <MousePointerClick className="w-3 h-3" /> Manual Count
                                                                </span>
                                                            )}
                                                            
                                                            <span className={`flex items-center gap-1 px-2 py-1 rounded border ${isExpired ? 'bg-red-50 text-red-500 border-red-100' : 'bg-gray-50 border-gray-200'}`}>
                                                                <Clock className="w-3 h-3" /> {timeLeft}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Right: Progress & Controls */}
                                            <div className="flex flex-col items-end gap-2">
                                                 {isManageMode ? (
                                                     <div className="flex gap-1">
                                                         {isEditingThis ? (
                                                            <>
                                                                <button onClick={() => saveEditing(quest.id)} className="p-2 bg-green-500 text-white rounded-lg shadow hover:bg-green-600"><Save className="w-4 h-4"/></button>
                                                                <button onClick={() => setEditingId(null)} className="p-2 bg-gray-200 text-gray-500 rounded-lg hover:bg-gray-300"><X className="w-4 h-4"/></button>
                                                            </>
                                                         ) : (
                                                            <>
                                                                <button onClick={() => startEditing(quest)} className="p-2 bg-white border border-gray-200 text-gray-400 hover:text-indigo-600 hover:border-indigo-200 rounded-lg transition-colors"><Edit2 className="w-4 h-4"/></button>
                                                                <button onClick={() => handleDelete(quest.id)} className="p-2 bg-white border border-gray-200 text-gray-400 hover:text-red-600 hover:border-red-200 rounded-lg transition-colors"><Trash2 className="w-4 h-4"/></button>
                                                            </>
                                                         )}
                                                     </div>
                                                 ) : (
                                                     <div className="flex items-center gap-3">
                                                         {/* Manual Controls */}
                                                         {quest.questType === 'MANUAL' && onUpdateManualProgress && (
                                                             <div className="flex items-center bg-gray-100 rounded-xl p-1 border border-gray-200 shadow-inner">
                                                                 <button onClick={() => onUpdateManualProgress(quest.id, Math.max(0, (quest.manualProgress || 0) - 1))} className="w-7 h-7 flex items-center justify-center bg-white rounded-lg shadow-sm text-gray-500 hover:text-red-500 active:scale-90 transition-all font-bold">-</button>
                                                                 <span className="w-8 text-center text-sm font-black text-gray-700">{quest.manualProgress || 0}</span>
                                                                 <button onClick={() => onUpdateManualProgress(quest.id, (quest.manualProgress || 0) + 1)} className="w-7 h-7 flex items-center justify-center bg-indigo-600 rounded-lg shadow-sm text-white hover:bg-indigo-700 active:scale-90 transition-all font-bold">+</button>
                                                             </div>
                                                         )}

                                                         <div className="text-right">
                                                             <div className="text-2xl font-black text-gray-800 leading-none">
                                                                 {isEditingThis ? (
                                                                     <input type="number" min={1} value={editTarget} onChange={e => setEditTarget(Number(e.target.value))} className="w-16 border-b-2 border-indigo-300 text-center outline-none bg-transparent" />
                                                                 ) : (
                                                                     <span>{progress}<span className="text-sm text-gray-400 font-bold mx-1">/</span>{quest.targetCount}</span>
                                                                 )}
                                                             </div>
                                                         </div>
                                                     </div>
                                                 )}
                                            </div>
                                        </div>

                                        {/* Progress Bar */}
                                        {!isManageMode && (
                                            <div className="mt-4 relative h-3 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                                                <div 
                                                    className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ${isCompleted ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : 'bg-gradient-to-r from-blue-400 to-indigo-500'}`}
                                                    style={{ width: `${percent}%` }}
                                                >
                                                    {/* Shimmer */}
                                                    <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite]"></div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Expand Toggle */}
                                        {quest.questType === 'AUTO' && matchingTasks.length > 0 && !isManageMode && (
                                            <button 
                                                onClick={() => setExpandedQuestId(isExpanded ? null : quest.id)} 
                                                className="w-full mt-3 pt-2 border-t border-gray-50 flex items-center justify-center text-xs font-bold text-gray-400 hover:text-indigo-600 transition-colors gap-1"
                                            >
                                                {isExpanded ? 'ซ่อนรายการ' : `ดู ${matchingTasks.length} งานที่นับยอด`} 
                                                {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                            </button>
                                        )}

                                        {/* Expanded Task List */}
                                        {isExpanded && matchingTasks.length > 0 && !isManageMode && (
                                            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 animate-in slide-in-from-top-2 bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                                                {matchingTasks.map(t => (
                                                    <div key={t.id} className="bg-white p-2.5 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-1 hover:border-indigo-200 transition-colors">
                                                        <div className="flex justify-between items-start">
                                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${STATUS_COLORS[t.status as any] || 'bg-gray-100'}`}>
                                                                {t.status}
                                                            </span>
                                                            <span className="text-[10px] text-gray-400">{format(t.endDate, 'd MMM')}</span>
                                                        </div>
                                                        <div className="font-bold text-xs text-gray-700 truncate" title={t.title}>
                                                            {t.title}
                                                        </div>
                                                        <a href={`/task/${t.id}`} className="text-[10px] text-indigo-500 flex items-center hover:underline mt-1">
                                                            ไปที่งาน <ExternalLink className="w-2.5 h-2.5 ml-1" />
                                                        </a>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
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
