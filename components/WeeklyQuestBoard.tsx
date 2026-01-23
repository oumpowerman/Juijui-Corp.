import React, { useState, useMemo } from 'react';
import { Target, Trophy, ChevronLeft, ChevronRight, Plus, Trash2, CheckCircle2, Layout, Sparkles, X, PlusCircle, ArrowRight, MoreHorizontal, ChevronDown, ChevronUp, Calendar, Bell, Filter, MousePointerClick, Database } from 'lucide-react';
import { endOfWeek, addWeeks, format, isWithinInterval, isSameDay } from 'date-fns';
import { Task, Channel, WeeklyQuest, Status, Platform, MasterOption } from '../types';
import { PLATFORM_ICONS, STATUS_LABELS, CONTENT_FORMATS } from '../constants';
import MentorTip from './MentorTip';
import { useWeeklyQuests } from '../hooks/useWeeklyQuests';

interface WeeklyQuestBoardProps {
    tasks: Task[];
    channels: Channel[];
    quests: WeeklyQuest[];
    masterOptions?: MasterOption[]; 
    onAddQuest: (quest: Omit<WeeklyQuest, 'id'>) => void;
    onDeleteQuest: (id: string) => void;
    onOpenSettings: () => void;
}

// Extended interface for local form state
interface PendingQuestItem {
    id: string; 
    title: string;
    targetCount: number;
    platform?: Platform | 'ALL';
    formatKey?: string; 
    statusKey?: string; 
    questType: 'AUTO' | 'MANUAL'; // New field in form
}

const WeeklyQuestBoard: React.FC<WeeklyQuestBoardProps> = ({ tasks, channels, quests, masterOptions = [], onAddQuest, onDeleteQuest, onOpenSettings }) => {
    // We need updateManualProgress from the hook, but it's passed via parent props usually. 
    // To allow this component to be self-contained regarding updates, let's grab the hook here or assume parent passes it.
    const { updateManualProgress } = useWeeklyQuests(); // Hook usage for local update

    const [currentDate, setCurrentDate] = useState(new Date());
    
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [viewingChannelId, setViewingChannelId] = useState<string | null>(null); 
    const [expandedQuestId, setExpandedQuestId] = useState<string | null>(null); 

    const [selectedChannelId, setSelectedChannelId] = useState<string>('');
    const [customChannelName, setCustomChannelName] = useState('');
    const [isCustomChannel, setIsCustomChannel] = useState(false);
    
    // --- MASTER DATA PREPARATION ---
    const statusOptions = masterOptions.filter(o => o.type === 'STATUS' && o.isActive).sort((a,b) => a.sortOrder - b.sortOrder);
    const formatOptions = masterOptions.filter(o => o.type === 'FORMAT' && o.isActive);
    
    const defaultStatusKey = statusOptions.length > 0 
        ? statusOptions[statusOptions.length - 1].key 
        : 'DONE';

    const [questItems, setQuestItems] = useState<PendingQuestItem[]>([
        { id: '1', title: 'ลง Story 📱', targetCount: 5, platform: 'INSTAGRAM', statusKey: defaultStatusKey, questType: 'AUTO' },
    ]);

    // Quick Add
    const [quickAddTitle, setQuickAddTitle] = useState('');
    const [quickAddTarget, setQuickAddTarget] = useState(1);
    const [quickAddType, setQuickAddType] = useState<'AUTO' | 'MANUAL'>('MANUAL'); // Default quick add to Manual for convenience

    // Manual startOfWeek (Monday start)
    const getStartOfWeek = (date: Date) => {
        const d = new Date(date);
        const day = d.getDay();
        const diff = (day === 0 ? -6 : 1); // Monday start
        d.setDate(d.getDate() - day + diff);
        d.setHours(0, 0, 0, 0);
        return d;
    };

    const weekStart = getStartOfWeek(currentDate);
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });

    const nextWeek = () => setCurrentDate(addWeeks(currentDate, 1));
    const prevWeek = () => setCurrentDate(addWeeks(currentDate, -1));

    // --- PERFORMANCE OPTIMIZATION: PRE-FILTER TASKS ---
    const tasksInThisWeek = useMemo(() => {
        return tasks.filter(t => {
            if (!t.endDate) return false;
            return isWithinInterval(new Date(t.endDate), { start: weekStart, end: weekEnd });
        });
    }, [tasks, weekStart, weekEnd]);

    const currentQuests = quests.filter(q => isSameDay(new Date(q.weekStartDate), weekStart));

    const groupedQuests = useMemo(() => {
        const groups: Record<string, WeeklyQuest[]> = {};
        const miscQuests: WeeklyQuest[] = [];

        currentQuests.forEach(q => {
            if (q.channelId) {
                if (!groups[q.channelId]) groups[q.channelId] = [];
                groups[q.channelId].push(q);
            } else {
                miscQuests.push(q);
            }
        });

        return { groups, miscQuests };
    }, [currentQuests]);

    // --- UPDATED LOGIC: USE PRE-FILTERED LIST ---
    const getMatchingTasks = (quest: WeeklyQuest) => {
        if (quest.questType === 'MANUAL') return []; // No tasks map to manual quests

        return tasksInThisWeek.filter(t => {
            // 1. Channel Check
            const matchChannel = quest.channelId ? t.channelId === quest.channelId : true;
            
            // 2. Status Check (Dynamic)
            const matchStatus = quest.targetStatus 
                ? t.status === quest.targetStatus 
                : t.status === 'DONE'; 
            
            // 3. Platform Check (Enhanced for 'ALL')
            let matchPlatform = true;
            if (quest.targetPlatform === 'ALL') {
                matchPlatform = (t.targetPlatforms && t.targetPlatforms.length > 0);
            } else if (quest.targetPlatform) {
                matchPlatform = (t.targetPlatforms && t.targetPlatforms.includes(quest.targetPlatform as Platform));
            }

            // 4. Format Check
            const matchFormat = quest.targetFormat
                ? t.contentFormat === quest.targetFormat
                : true;
            
            return matchStatus && matchChannel && matchPlatform && matchFormat;
        });
    };

    const calculateProgress = (quest: WeeklyQuest) => {
        if (quest.questType === 'MANUAL') {
            return quest.manualProgress || 0;
        }
        return getMatchingTasks(quest).length;
    };

    const calculateChannelOverall = (quests: WeeklyQuest[]) => {
        if (quests.length === 0) return 0;
        let totalCurrent = 0;
        let totalTarget = 0;

        quests.forEach(q => {
            totalCurrent += Math.min(calculateProgress(q), q.targetCount); 
            totalTarget += q.targetCount;
        });

        return totalTarget === 0 ? 0 : Math.round((totalCurrent / totalTarget) * 100);
    };

    const handleAddDefaultItems = () => {
        setQuestItems([
            { id: crypto.randomUUID(), title: 'ลง Story (IG) 📱', targetCount: 5, platform: 'INSTAGRAM', statusKey: defaultStatusKey, questType: 'AUTO' },
            { id: crypto.randomUUID(), title: 'ลง Post (FB) 🖼️', targetCount: 3, platform: 'FACEBOOK', statusKey: defaultStatusKey, questType: 'AUTO' },
            { id: crypto.randomUUID(), title: 'ลง Reels/Shorts 🎬', targetCount: 3, platform: 'ALL', formatKey: 'REELS', statusKey: defaultStatusKey, questType: 'AUTO' },
            { id: crypto.randomUUID(), title: 'ทำความสะอาดสตู 🧹', targetCount: 1, questType: 'MANUAL' },
        ]);
    };

    const handleCreateGroup = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isCustomChannel && !selectedChannelId) {
            alert("กรุณาเลือกช่อง (Channel) หรือพิมพ์ชื่อใหม่ครับ");
            return;
        }

        questItems.forEach(item => {
            if(!item.title) return;
            const finalTitle = isCustomChannel ? `[${customChannelName}] ${item.title}` : item.title;
            onAddQuest({
                title: finalTitle,
                weekStartDate: weekStart,
                targetCount: item.targetCount,
                channelId: isCustomChannel ? undefined : selectedChannelId,
                
                // Fields specific to AUTO
                targetPlatform: item.questType === 'AUTO' ? item.platform : undefined,
                targetFormat: item.questType === 'AUTO' ? item.formatKey : undefined,
                targetStatus: item.questType === 'AUTO' ? item.statusKey : undefined,
                
                // New Fields
                questType: item.questType,
                manualProgress: 0
            });
        });

        setIsCreateModalOpen(false);
        resetCreateForm();
    };

    const resetCreateForm = () => {
        setQuestItems([{ id: '1', title: 'ลง Story 📱', targetCount: 5, platform: 'INSTAGRAM', statusKey: defaultStatusKey, questType: 'AUTO' }]);
        setSelectedChannelId('');
        setCustomChannelName('');
        setIsCustomChannel(false);
    };

    const handleQuickAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if(!quickAddTitle.trim()) return;

        onAddQuest({
            title: quickAddTitle,
            weekStartDate: weekStart,
            targetCount: quickAddTarget,
            channelId: viewingChannelId === 'MISC' ? undefined : viewingChannelId!,
            targetPlatform: undefined,
            targetStatus: defaultStatusKey,
            questType: quickAddType,
            manualProgress: 0
        });
        setQuickAddTitle('');
        setQuickAddTarget(1);
    };

    const handleManualUpdate = (quest: WeeklyQuest, delta: number) => {
        const current = quest.manualProgress || 0;
        const newProgress = Math.max(0, current + delta);
        updateManualProgress(quest.id, newProgress);
    };

    const openCreateModal = () => {
        if(channels.length > 0) setSelectedChannelId(channels[0].id);
        setIsCreateModalOpen(true);
    };

    const viewingChannel = viewingChannelId && viewingChannelId !== 'MISC' 
        ? channels.find(c => c.id === viewingChannelId) 
        : { name: 'ทั่วไป (Misc)', color: 'bg-gray-100 text-gray-700' };
    
    const viewingQuests = viewingChannelId 
        ? (viewingChannelId === 'MISC' ? groupedQuests.miscQuests : groupedQuests.groups[viewingChannelId] || [])
        : [];

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            <MentorTip 
                variant="purple" 
                messages={[
                    "ใหม่! ระบบ Quest แบบ Hybrid: เลือกได้ว่าจะให้ระบบนับยอดอัตโนมัติ (Auto) หรือจะกดนับเอง (Manual)",
                    "ใช้ Manual Quest สำหรับงานที่ไม่มีในระบบ เช่น 'ทำความสะอาด', 'ประชุมทีม', 'ซื้อของ'",
                    "ถ้าต้องการนับยอดรวมทุกแพลตฟอร์ม ให้เลือก 'All Platforms' ในแบบ Auto"
                ]} 
            />

            {/* Header & Nav */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 flex items-center">
                        ภารกิจประจำสัปดาห์ 🎯 (Weekly Quests)
                    </h1>
                    <p className="text-gray-500 mt-1">
                        วางแผนเป้าหมายรายช่อง ติดตามความคืบหน้าแบบ Hybrid
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center bg-white p-1.5 rounded-xl border border-gray-200 shadow-sm">
                        <button onClick={prevWeek} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-indigo-600 transition-colors">
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <div className="px-4 text-center min-w-[160px]">
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">WEEK OF</p>
                            <p className="text-indigo-600 font-black">
                                {format(weekStart, 'd MMM')} - {format(weekEnd, 'd MMM yyyy')}
                            </p>
                        </div>
                        <button onClick={nextWeek} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-indigo-600 transition-colors">
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>

                    <button onClick={onOpenSettings} className="hidden md:flex p-2.5 bg-white text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 border border-gray-200 rounded-xl shadow-sm transition-all active:scale-95">
                        <Bell className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* --- 1. MAIN GRID --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                
                {/* Create Button Card */}
                <button onClick={openCreateModal} className="border-2 border-dashed border-gray-300 rounded-3xl flex flex-col items-center justify-center p-8 text-gray-400 hover:border-indigo-400 hover:text-indigo-500 hover:bg-indigo-50 transition-all min-h-[250px] group">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-indigo-200 group-hover:scale-110 transition-all shadow-sm">
                        <Plus className="w-8 h-8 stroke-[3px]" />
                    </div>
                    <span className="font-bold text-lg">สร้างแผนใหม่ (Create Plan)</span>
                    <span className="text-sm mt-1 opacity-70">เพิ่มภารกิจรายสัปดาห์</span>
                </button>

                {/* Render Channel Groups */}
                {Object.keys(groupedQuests.groups).map(channelId => {
                    const channel = channels.find(c => c.id === channelId);
                    const channelQuests = groupedQuests.groups[channelId];
                    if(!channel) return null;

                    const overallPercent = calculateChannelOverall(channelQuests);

                    return (
                        <div key={channelId} onClick={() => setViewingChannelId(channelId)} className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full hover:shadow-lg hover:border-indigo-200 hover:-translate-y-1 transition-all cursor-pointer group relative">
                            {/* Overall Progress Bar */}
                            <div className="h-2 w-full bg-gray-100">
                                <div className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-1000" style={{ width: `${overallPercent}%` }}></div>
                            </div>

                            {/* Card Header */}
                            <div className={`px-6 py-4 border-b border-gray-100 ${channel.color.replace('text-', 'bg-').replace('bg-', 'bg-opacity-10 ')}`}>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">{channel.name}</h3>
                                        <div className="flex gap-1 mt-1">
                                            {channel.platforms.map(p => {
                                                const Icon = PLATFORM_ICONS[p];
                                                return <Icon key={p} className="w-3 h-3 text-gray-500" />
                                            })}
                                        </div>
                                    </div>
                                    <div className="text-right"><span className="text-2xl font-black text-gray-800">{overallPercent}%</span></div>
                                </div>
                            </div>

                            {/* Quests List */}
                            <div className="p-5 flex-1 space-y-3">
                                {channelQuests.slice(0, 4).map(quest => {
                                    const progress = calculateProgress(quest);
                                    const percent = Math.min((progress / quest.targetCount) * 100, 100);
                                    const isCompleted = percent >= 100;

                                    return (
                                        <div key={quest.id} className="relative">
                                            <div className="flex justify-between items-center mb-1.5 text-sm">
                                                <div className="flex items-center gap-2 max-w-[70%]">
                                                    {quest.questType === 'MANUAL' && <MousePointerClick className="w-3 h-3 text-orange-500 shrink-0" />}
                                                    <span className={`font-medium truncate ${isCompleted ? 'text-gray-400 line-through' : 'text-gray-700'}`}>{quest.title}</span>
                                                    {/* Tracking Badge */}
                                                    <div className="flex gap-1 shrink-0">
                                                        {quest.questType === 'AUTO' && quest.targetFormat && <span className="text-[8px] bg-purple-50 text-purple-600 px-1 rounded border border-purple-100">{quest.targetFormat}</span>}
                                                    </div>
                                                </div>
                                                <span className={`text-xs font-bold ${isCompleted ? 'text-emerald-600' : 'text-gray-400'}`}>{progress}/{quest.targetCount}</span>
                                            </div>
                                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                <div className={`h-full rounded-full transition-all duration-700 ${isCompleted ? 'bg-emerald-500' : 'bg-gray-300'}`} style={{ width: `${percent}%` }} />
                                            </div>
                                        </div>
                                    );
                                })}
                                {channelQuests.length > 4 && <div className="text-center text-xs text-gray-400 font-medium pt-2">+ อีก {channelQuests.length - 4} ภารกิจ</div>}
                            </div>
                            <div className="bg-gray-50 p-3 flex justify-center border-t border-gray-100 text-xs font-bold text-gray-400 group-hover:text-indigo-500 group-hover:bg-indigo-50 transition-colors">ดูรายละเอียด <ArrowRight className="w-3 h-3 ml-1" /></div>
                        </div>
                    );
                })}

                {/* Misc Quests */}
                {groupedQuests.miscQuests.length > 0 && (
                    <div onClick={() => setViewingChannelId('MISC')} className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer group">
                         <div className="h-2 w-full bg-gray-100"><div className="h-full bg-gray-400" style={{ width: `${calculateChannelOverall(groupedQuests.miscQuests)}%` }}></div></div>
                         <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                            <h3 className="font-bold text-lg text-gray-600 flex items-center gap-2"><Layout className="w-5 h-5" /> ทั่วไป (Misc)</h3>
                         </div>
                         <div className="p-5 flex-1 space-y-3">
                            {groupedQuests.miscQuests.slice(0, 4).map(quest => {
                                const progress = calculateProgress(quest);
                                return (
                                    <div key={quest.id} className="flex justify-between items-center text-sm">
                                        <div className="flex items-center gap-2">
                                            {quest.questType === 'MANUAL' && <MousePointerClick className="w-3 h-3 text-orange-500" />}
                                            <span className="text-gray-600 truncate">{quest.title}</span>
                                        </div>
                                        <span className="font-bold text-gray-400">{progress}/{quest.targetCount}</span>
                                    </div>
                                );
                            })}
                         </div>
                         <div className="bg-gray-50 p-3 flex justify-center border-t border-gray-100 text-xs font-bold text-gray-400 group-hover:text-indigo-500 transition-colors">จัดการภารกิจ <ArrowRight className="w-3 h-3 ml-1" /></div>
                    </div>
                )}
            </div>

            {/* --- 2. CREATE PLAN MODAL (Enhanced) --- */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden border border-gray-100 scale-100 animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
                        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 flex justify-between items-start text-white shrink-0">
                            <div>
                                <h3 className="font-bold text-xl flex items-center gap-2">
                                    <Target className="w-6 h-6 text-yellow-300" /> 
                                    สร้างภารกิจใหม่ (Create Plan)
                                </h3>
                                <p className="text-indigo-100 text-sm mt-1">กำหนดเงื่อนไขให้ชัดเจน หรือสร้างแบบ Manual เพื่อนับยอดเอง</p>
                            </div>
                            <button onClick={() => setIsCreateModalOpen(false)} className="bg-white/20 hover:bg-white/30 p-2 rounded-full transition-colors text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1">
                            <form id="quest-form" onSubmit={handleCreateGroup} className="space-y-6">
                                {/* Channel Selection */}
                                <div className="space-y-3">
                                    <label className="text-sm font-bold text-gray-700 flex items-center">1. ภารกิจนี้ของช่องไหน? (Select Channel)</label>
                                    {!isCustomChannel ? (
                                        <div className="flex gap-2">
                                            <select className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-2.5 font-bold text-gray-700 outline-none focus:border-indigo-500 bg-white" value={selectedChannelId} onChange={e => setSelectedChannelId(e.target.value)}>
                                                <option value="" disabled>-- เลือกช่อง (Brand) --</option>
                                                {channels.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                            </select>
                                            <button type="button" onClick={() => setIsCustomChannel(true)} className="px-3 py-2 text-indigo-600 bg-indigo-50 rounded-xl hover:bg-indigo-100 text-xs font-bold whitespace-nowrap">หรือ พิมพ์ชื่อเอง</button>
                                        </div>
                                    ) : (
                                        <div className="flex gap-2 animate-in fade-in slide-in-from-right-4">
                                            <input type="text" autoFocus className="flex-1 border-2 border-indigo-200 rounded-xl px-4 py-2.5 font-bold text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500" placeholder="พิมพ์ชื่อช่อง/แบรนด์ชั่วคราว..." value={customChannelName} onChange={e => setCustomChannelName(e.target.value)} />
                                            <button type="button" onClick={() => setIsCustomChannel(false)} className="px-3 py-2 text-gray-500 bg-gray-100 rounded-xl hover:bg-gray-200 text-xs font-bold whitespace-nowrap">กลับไปเลือก</button>
                                        </div>
                                    )}
                                </div>

                                {/* Quest Items */}
                                <div className="space-y-3">
                                    <div className="flex justify-between items-end">
                                        <label className="text-sm font-bold text-gray-700 flex items-center">2. รายการภารกิจ (Quest Items)</label>
                                        <button type="button" onClick={handleAddDefaultItems} className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 flex items-center"><Sparkles className="w-3 h-3 mr-1" /> โหลดชุดมาตรฐาน</button>
                                    </div>
                                    
                                    <div className="bg-gray-50 rounded-2xl p-4 space-y-3 border border-gray-100">
                                        <div className="grid grid-cols-12 gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2 px-2">
                                            <div className="col-span-1">Type</div>
                                            <div className="col-span-3">ชื่องาน</div>
                                            <div className="col-span-2">Platform</div>
                                            <div className="col-span-2">Format</div>
                                            <div className="col-span-2">Status</div>
                                            <div className="col-span-1 text-center">เป้า</div>
                                            <div className="col-span-1"></div>
                                        </div>

                                        {questItems.map((item, index) => (
                                            <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                                                
                                                {/* Type Toggle */}
                                                <div className="col-span-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => setQuestItems(prev => prev.map(i => i.id === item.id ? { ...i, questType: i.questType === 'AUTO' ? 'MANUAL' : 'AUTO' } : i))}
                                                        className={`w-full py-1.5 rounded text-[10px] font-bold border flex items-center justify-center ${
                                                            item.questType === 'AUTO' 
                                                            ? 'bg-blue-50 text-blue-600 border-blue-200' 
                                                            : 'bg-orange-50 text-orange-600 border-orange-200'
                                                        }`}
                                                        title={item.questType === 'AUTO' ? 'นับยอดอัตโนมัติจาก DB' : 'นับยอดเองด้วยมือ'}
                                                    >
                                                        {item.questType === 'AUTO' ? 'Auto' : 'Manual'}
                                                    </button>
                                                </div>

                                                {/* Title */}
                                                <div className="col-span-3 flex items-center gap-2">
                                                    <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-500 shrink-0">{index + 1}</div>
                                                    <input type="text" className="w-full border border-gray-200 rounded-lg px-2 py-2 text-sm focus:border-indigo-500 outline-none" placeholder="เช่น ลง Story" value={item.title} onChange={e => setQuestItems(prev => prev.map(i => i.id === item.id ? { ...i, title: e.target.value } : i))} />
                                                </div>
                                                
                                                {item.questType === 'AUTO' ? (
                                                    <>
                                                        {/* Platform */}
                                                        <div className="col-span-2">
                                                            <select className="w-full border border-gray-200 rounded-lg px-2 py-2 text-xs font-bold text-gray-600 focus:border-indigo-500 outline-none bg-white" value={item.platform || ''} onChange={e => setQuestItems(prev => prev.map(i => i.id === item.id ? { ...i, platform: e.target.value as Platform | 'ALL' || undefined } : i))}>
                                                                <option value="">(ไม่ระบุ)</option>
                                                                <option value="ALL">🌐 ทุกช่องทาง</option>
                                                                <option value="INSTAGRAM">IG/Story</option>
                                                                <option value="FACEBOOK">Facebook</option>
                                                                <option value="TIKTOK">TikTok</option>
                                                                <option value="YOUTUBE">YouTube</option>
                                                            </select>
                                                        </div>

                                                        {/* Format */}
                                                        <div className="col-span-2">
                                                            <select className="w-full border border-gray-200 rounded-lg px-2 py-2 text-xs font-bold text-gray-600 focus:border-indigo-500 outline-none bg-white" value={item.formatKey || ''} onChange={e => setQuestItems(prev => prev.map(i => i.id === item.id ? { ...i, formatKey: e.target.value || undefined } : i))}>
                                                                <option value="">(ไม่ระบุ)</option>
                                                                {formatOptions.length > 0 ? (
                                                                    formatOptions.map(opt => <option key={opt.key} value={opt.key}>{opt.label}</option>)
                                                                ) : (
                                                                    Object.entries(CONTENT_FORMATS).map(([k, v]) => <option key={k} value={k}>{v.split(' ')[0]}</option>)
                                                                )}
                                                            </select>
                                                        </div>

                                                        {/* Status */}
                                                        <div className="col-span-2">
                                                            <select className="w-full border border-gray-200 rounded-lg px-2 py-2 text-xs font-bold text-green-700 bg-green-50 focus:border-green-500 outline-none" value={item.statusKey || defaultStatusKey} onChange={e => setQuestItems(prev => prev.map(i => i.id === item.id ? { ...i, statusKey: e.target.value || undefined } : i))}>
                                                                {statusOptions.length > 0 ? (
                                                                    statusOptions.map(opt => <option key={opt.key} value={opt.key}>{opt.label}</option>)
                                                                ) : (
                                                                    <>
                                                                        <option value="DONE">Done ✅</option>
                                                                        <option value="APPROVE">Approve 👍</option>
                                                                    </>
                                                                )}
                                                            </select>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="col-span-6 flex items-center justify-center">
                                                        <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full w-full text-center">
                                                            -- Manual Tracking (นับเอง) --
                                                        </span>
                                                    </div>
                                                )}

                                                {/* Count */}
                                                <div className="col-span-1">
                                                    <input type="number" min={1} className="w-full border border-gray-200 rounded-lg px-1 py-2 text-sm text-center focus:border-indigo-500 outline-none" value={item.targetCount} onChange={e => setQuestItems(prev => prev.map(i => i.id === item.id ? { ...i, targetCount: Number(e.target.value) } : i))} />
                                                </div>
                                                
                                                {/* Delete */}
                                                <div className="col-span-1 text-center">
                                                    <button type="button" onClick={() => setQuestItems(prev => prev.filter(i => i.id !== item.id))} className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                                                </div>
                                            </div>
                                        ))}
                                        <button type="button" onClick={() => setQuestItems(prev => [...prev, { id: crypto.randomUUID(), title: '', targetCount: 1, statusKey: defaultStatusKey, questType: 'AUTO' }])} className="w-full py-2 border-2 border-dashed border-gray-300 rounded-xl text-gray-400 hover:text-indigo-500 hover:border-indigo-300 hover:bg-white transition-all flex items-center justify-center text-sm font-bold"><PlusCircle className="w-4 h-4 mr-2" /> เพิ่มรายการ</button>
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 shrink-0">
                             <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-5 py-2.5 text-gray-600 font-bold hover:bg-gray-200 rounded-xl transition-colors">ยกเลิก</button>
                             <button type="submit" form="quest-form" className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center"><CheckCircle2 className="w-5 h-5 mr-2" /> สร้างภารกิจ</button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- 3. DETAIL MODAL --- */}
            {viewingChannelId && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] scale-100 animate-in zoom-in-95 duration-200">
                        {/* Detail Header */}
                        <div className={`px-6 py-5 border-b border-gray-100 flex justify-between items-center ${viewingChannel?.color ? viewingChannel.color.replace('text-', 'bg-').replace('bg-', 'bg-opacity-10 ') : 'bg-gray-50'}`}>
                            <div>
                                <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800">
                                    {viewingChannel?.name}
                                </h2>
                                <p className="text-xs opacity-70 font-medium mt-0.5 text-gray-600">
                                    จัดการภารกิจ: {format(weekStart, 'd MMM')} - {format(weekEnd, 'd MMM')}
                                </p>
                            </div>
                            <button onClick={() => setViewingChannelId(null)} className="p-2 bg-white/50 hover:bg-white rounded-full transition-colors text-gray-500">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Detail Body */}
                        <div className="p-6 overflow-y-auto flex-1 space-y-4">
                            {viewingQuests.length === 0 ? (
                                <div className="text-center py-12 text-gray-400 border-2 border-dashed border-gray-100 rounded-2xl">
                                    <Target className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                    <p>ยังไม่มีภารกิจในช่องนี้</p>
                                </div>
                            ) : (
                                viewingQuests.map(quest => {
                                    const matchingTasks = getMatchingTasks(quest);
                                    const progress = calculateProgress(quest);
                                    const percent = Math.min((progress / quest.targetCount) * 100, 100);
                                    const isCompleted = percent >= 100;
                                    const isExpanded = expandedQuestId === quest.id;

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
                                                            <div className="flex gap-1">
                                                                {quest.questType === 'AUTO' && (
                                                                    <>
                                                                        {quest.targetFormat && <span className="text-[8px] bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded border border-purple-100 font-normal no-underline">{quest.targetFormat}</span>}
                                                                        {quest.targetPlatform === 'ALL' && <span className="text-[8px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100 font-normal no-underline">All Platforms</span>}
                                                                    </>
                                                                )}
                                                                {quest.questType === 'MANUAL' && <span className="text-[8px] bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded border border-orange-100 font-normal no-underline">Manual</span>}
                                                            </div>
                                                        </h4>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex items-center gap-2">
                                                    {/* Manual Controls */}
                                                    {quest.questType === 'MANUAL' && (
                                                        <div className="flex items-center bg-gray-100 rounded-lg p-0.5 mr-2">
                                                            <button 
                                                                onClick={() => handleManualUpdate(quest, -1)} 
                                                                className="w-6 h-6 flex items-center justify-center text-gray-500 hover:bg-white hover:text-red-500 rounded transition-colors"
                                                            >
                                                                -
                                                            </button>
                                                            <span className="w-6 text-center text-xs font-bold">{quest.manualProgress || 0}</span>
                                                            <button 
                                                                onClick={() => handleManualUpdate(quest, 1)} 
                                                                className="w-6 h-6 flex items-center justify-center text-gray-500 hover:bg-white hover:text-green-500 rounded transition-colors"
                                                            >
                                                                +
                                                            </button>
                                                        </div>
                                                    )}

                                                    {quest.questType === 'AUTO' && matchingTasks.length > 0 && (
                                                        <button onClick={() => setExpandedQuestId(isExpanded ? null : quest.id)} className={`p-1.5 rounded-lg flex items-center gap-1 text-xs font-bold transition-colors ${isExpanded ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400 hover:bg-gray-100'}`}>
                                                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                        </button>
                                                    )}
                                                </div>
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
            )}
        </div>
    );
};

export default WeeklyQuestBoard;