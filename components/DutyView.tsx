
import React, { useState, useEffect, useMemo } from 'react';
import { User, Duty, DutyConfig } from '../types';
import { useDuty } from '../hooks/useDuty';
import { format, endOfWeek, eachDayOfInterval, isSameDay, addWeeks, isToday, addDays } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, Trash2, CheckCircle2, Circle, Coffee, Dices, Loader2, X, User as UserIcon, Check, Sparkles, Wand2, RefreshCw, ArrowRight, Settings, Save, ArchiveRestore, Calendar, Clock, Info, Users, Repeat, Hourglass } from 'lucide-react';
import MentorTip from './MentorTip';

interface DutyViewProps {
    users: User[];
}

const WEEK_DAYS_MAP = [
    { num: 1, label: 'วันจันทร์ (Mon)' },
    { num: 2, label: 'วันอังคาร (Tue)' },
    { num: 3, label: 'วันพุธ (Wed)' },
    { num: 4, label: 'วันพฤหัส (Thu)' },
    { num: 5, label: 'วันศุกร์ (Fri)' },
];

const DutyView: React.FC<DutyViewProps> = ({ users }) => {
    const { duties, configs, saveConfigs, addDuty, toggleDuty, deleteDuty, generateRandomDuties, cleanupOldDuties } = useDuty();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isAddMode, setIsAddMode] = useState<Date | null>(null);
    
    // --- Randomizer State ---
    const [isRandomModalOpen, setIsRandomModalOpen] = useState(false);
    const [participatingIds, setParticipatingIds] = useState<string[]>([]);
    const [randomStage, setRandomStage] = useState<'IDLE' | 'SHUFFLING' | 'RESULT'>('IDLE');
    const [loadingText, setLoadingText] = useState('กำลังล้างไพ่...');
    const [previewDuties, setPreviewDuties] = useState<Duty[]>([]);
    
    // New: Random Mode State
    const [randomMode, setRandomMode] = useState<'ROTATION' | 'DURATION'>('ROTATION');
    
    const [randomStartDate, setRandomStartDate] = useState<Date>(new Date()); 
    const [genDurationWeeks, setGenDurationWeeks] = useState<number>(1); // 1, 2, 4 weeks

    // --- Config Modal State ---
    const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
    const [editingConfigs, setEditingConfigs] = useState<DutyConfig[]>([]);

    // Form State
    const [newDutyTitle, setNewDutyTitle] = useState('');
    const [assigneeId, setAssigneeId] = useState('');

    // Manual startOfWeek (Monday start)
    const getStartOfWeek = (date: Date) => {
        const d = new Date(date);
        const day = d.getDay();
        const diff = (day === 0 ? -6 : 1); // Monday start
        d.setDate(d.getDate() - day + diff);
        d.setHours(0, 0, 0, 0);
        return d;
    };

    const start = getStartOfWeek(currentDate);
    const end = endOfWeek(currentDate, { weekStartsOn: 1 });
    const weekDays = eachDayOfInterval({ start, end });

    const activeUsers = users.filter(u => u.isActive);

    // --- Handlers ---

    const handleOpenRandomizer = () => {
        setParticipatingIds(activeUsers.map(u => u.id));
        setRandomStage('IDLE');
        setPreviewDuties([]);
        setRandomMode('ROTATION'); // Default to Rotation
        
        // Default start to today, or start of current view week
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (today >= start && today <= end) {
            setRandomStartDate(today);
        } else {
            setRandomStartDate(start);
        }
        setIsRandomModalOpen(true);
    };

    const handleOpenConfig = () => {
        const fullConfigs = WEEK_DAYS_MAP.map(day => {
            const existing = configs.find(c => c.dayOfWeek === day.num);
            return existing ? { ...existing } : { dayOfWeek: day.num, requiredPeople: 1, taskTitles: ['ทำความสะอาด'] };
        });
        setEditingConfigs(fullConfigs);
        setIsConfigModalOpen(true);
    };

    const handleSaveConfigs = () => {
        saveConfigs(editingConfigs);
        setIsConfigModalOpen(false);
    };

    const toggleParticipant = (id: string) => {
        setParticipatingIds(prev => 
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        );
    };

    const handleStartRandomize = () => {
        if (participatingIds.length === 0) {
            alert('ต้องเลือกคนอย่างน้อย 1 คนครับ');
            return;
        }

        setRandomStage('SHUFFLING');

        const texts = ['กำลังล้างไพ่...', 'วนคิวให้ครบทุกคน...', 'เกลี่ยงานให้เท่ากัน...', 'จัดตารางหลบเสาร์อาทิตย์...', '🔮 โอมเพี้ยง...'];
        let step = 0;
        const interval = setInterval(() => {
            setLoadingText(texts[step % texts.length]);
            step++;
        }, 400);

        setTimeout(async () => {
            clearInterval(interval);
            const selectedUsers = activeUsers.filter(u => participatingIds.includes(u.id));
            
            // Pass mode and duration (duration ignored if ROTATION)
            const results = await generateRandomDuties(randomStartDate, randomMode, genDurationWeeks, selectedUsers);
            setPreviewDuties(results);
            setRandomStage('RESULT');
        }, 2000);
    };

    const handleCloseModal = () => {
        setIsRandomModalOpen(false);
        setRandomStage('IDLE');
        setPreviewDuties([]);
    };

    const handleAdd = () => {
        if (isAddMode && newDutyTitle && assigneeId) {
            addDuty(newDutyTitle, assigneeId, isAddMode);
            setIsAddMode(null);
            setNewDutyTitle('');
            setAssigneeId('');
        }
    };

    const handleStartAdd = (day: Date) => {
        setIsAddMode(day); 
        setNewDutyTitle(''); 
        // Auto-select first user IMMEDIATELY so the button isn't disabled by default
        if (activeUsers.length > 0) {
            setAssigneeId(activeUsers[0].id);
        }
    };

    const getDutiesForDay = (date: Date) => {
        return duties.filter(d => isSameDay(d.date, date));
    };

    const updateDayConfig = (dayNum: number, field: keyof DutyConfig, value: any) => {
        setEditingConfigs(prev => prev.map(c => 
            c.dayOfWeek === dayNum ? { ...c, [field]: value } : c
        ));
    };

    const updateTaskTitle = (dayNum: number, index: number, value: string) => {
        setEditingConfigs(prev => prev.map(c => {
            if (c.dayOfWeek !== dayNum) return c;
            const newTitles = [...c.taskTitles];
            newTitles[index] = value;
            return { ...c, taskTitles: newTitles };
        }));
    };

    // --- Helper to Group Preview Duties by Date ---
    const groupedPreviewDuties = useMemo(() => {
        const groups: Record<string, Duty[]> = {};
        previewDuties.forEach(duty => {
            const dateKey = format(duty.date, 'yyyy-MM-dd');
            if (!groups[dateKey]) groups[dateKey] = [];
            groups[dateKey].push(duty);
        });
        
        // Return sorted array of groups
        return Object.keys(groups).sort().map(dateKey => ({
            date: new Date(dateKey),
            duties: groups[dateKey]
        }));
    }, [previewDuties]);

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20 relative">
            <MentorTip variant="green" messages={[
                "ระบบสุ่มใหม่! จะวนคิวให้ครบทุกคน (Rotation) โดยไม่ตัดจบวันศุกร์",
                "เลือกได้ว่าจะสุ่มเวรล่วงหน้านานแค่ไหน (1, 2, หรือ 4 สัปดาห์)",
            ]} />

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 flex items-center">
                        ตารางเวรประจำสัปดาห์ 🧹 (Duty Roster)
                    </h1>
                    <p className="text-gray-500 mt-1">
                        ใครทำอะไร วันไหน เช็คได้เลยที่นี่
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    {/* Settings Button */}
                    <button 
                        onClick={handleOpenConfig}
                        className="p-2.5 bg-white border border-gray-200 text-gray-600 hover:text-indigo-600 hover:border-indigo-200 rounded-xl shadow-sm transition-all"
                        title="จัดการกติกาเวร (Rules)"
                    >
                        <Settings className="w-5 h-5" />
                    </button>

                    {/* Random Button */}
                    <button 
                        onClick={handleOpenRandomizer}
                        className="flex items-center px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 hover:shadow-indigo-300 hover:-translate-y-0.5 active:scale-95 transition-all mr-2"
                    >
                        <Dices className="w-5 h-5 mr-2" />
                        สุ่มเวร (Randomizer)
                    </button>

                    <div className="flex items-center bg-white p-1.5 rounded-xl border border-gray-200 shadow-sm">
                        <button onClick={() => setCurrentDate(addWeeks(currentDate, -1))} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-indigo-600 transition-colors">
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <div className="px-4 text-center min-w-[160px]">
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">WEEK OF</p>
                            <p className="text-indigo-600 font-black">
                                {format(start, 'd MMM')} - {format(end, 'd MMM')}
                            </p>
                        </div>
                        <button onClick={() => setCurrentDate(addWeeks(currentDate, 1))} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-indigo-600 transition-colors">
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {weekDays.map(day => {
                    const dayDuties = getDutiesForDay(day);
                    const isCurrentDay = isToday(day);
                    const isWeekendDay = day.getDay() === 0 || day.getDay() === 6;

                    return (
                        <div key={day.toString()} className={`rounded-2xl border flex flex-col h-full min-h-[250px] transition-all ${isCurrentDay ? 'bg-indigo-50/50 border-indigo-200 shadow-md ring-1 ring-indigo-100' : isWeekendDay ? 'bg-gray-50/50 border-gray-200' : 'bg-white border-gray-200 shadow-sm'}`}>
                            {/* Day Header */}
                            <div className={`p-4 border-b flex justify-between items-center ${isCurrentDay ? 'border-indigo-100 bg-indigo-100/50' : 'border-gray-100 bg-gray-50'}`}>
                                <div>
                                    <p className={`text-xs font-bold uppercase ${isWeekendDay ? 'text-red-400' : 'text-gray-500'}`}>{format(day, 'EEEE')}</p>
                                    <p className={`text-lg font-black ${isCurrentDay ? 'text-indigo-600' : 'text-gray-800'}`}>{format(day, 'd MMM')}</p>
                                </div>
                                {isCurrentDay && <span className="bg-indigo-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">Today</span>}
                            </div>

                            {/* Duty List */}
                            <div className="p-4 flex-1 space-y-3">
                                {dayDuties.length === 0 && !isAddMode && (
                                    <div className="text-center py-8 opacity-40">
                                        <Coffee className="w-10 h-10 mx-auto mb-2 text-gray-400" />
                                        <p className="text-xs font-bold text-gray-400">วันนี้ชิวๆ ไม่มีเวร</p>
                                    </div>
                                )}

                                {dayDuties.map(duty => {
                                    const user = users.find(u => u.id === duty.assigneeId);
                                    return (
                                        <div key={duty.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all group ${duty.isDone ? 'bg-green-50 border-green-200' : 'bg-white border-gray-100 hover:border-indigo-200 shadow-sm'}`}>
                                            <button onClick={() => toggleDuty(duty.id)} className="shrink-0">
                                                {duty.isDone ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <Circle className="w-5 h-5 text-gray-300 hover:text-indigo-500" />}
                                            </button>
                                            
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm font-bold truncate ${duty.isDone ? 'text-green-700 line-through' : 'text-gray-800'}`}>{duty.title}</p>
                                                <div className="flex items-center gap-1.5 mt-1">
                                                    {user ? (
                                                        <img src={user.avatarUrl} className="w-4 h-4 rounded-full" />
                                                    ) : (
                                                        <div className="w-4 h-4 rounded-full bg-gray-200" />
                                                    )}
                                                    <span className="text-xs text-gray-500">{user?.name || 'Unknown'}</span>
                                                </div>
                                            </div>

                                            <button onClick={() => { if(confirm('ลบเวรนี้?')) deleteDuty(duty.id) }} className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-300 hover:text-red-500 transition-opacity">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    );
                                })}

                                {/* Add Form Inline */}
                                {isAddMode && isSameDay(isAddMode, day) ? (
                                    <div className="bg-white border-2 border-indigo-100 rounded-xl p-3 shadow-md animate-in zoom-in-95">
                                        <input 
                                            autoFocus
                                            className="w-full text-sm font-bold border-b border-gray-100 pb-1 mb-2 outline-none focus:border-indigo-500"
                                            placeholder="ทำอะไรดี? (เช่น กวาดพื้น)"
                                            value={newDutyTitle}
                                            onChange={e => setNewDutyTitle(e.target.value)}
                                        />
                                        <div className="flex gap-2">
                                            <select 
                                                className="flex-1 text-xs bg-gray-50 rounded-lg p-1 outline-none cursor-pointer"
                                                value={assigneeId}
                                                onChange={e => setAssigneeId(e.target.value)}
                                            >
                                                <option value="" disabled>เลือกคนรับผิดชอบ</option>
                                                {activeUsers.map(u => (
                                                    <option key={u.id} value={u.id}>{u.name}</option>
                                                ))}
                                            </select>
                                            <button 
                                                onClick={handleAdd}
                                                disabled={!newDutyTitle || !assigneeId}
                                                className="bg-indigo-600 text-white p-1.5 rounded-lg disabled:opacity-50"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => setIsAddMode(null)} className="text-gray-400 p-1.5">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <button 
                                        onClick={() => handleStartAdd(day)}
                                        className="w-full py-2 border-2 border-dashed border-gray-200 rounded-xl text-xs font-bold text-gray-400 hover:text-indigo-500 hover:border-indigo-200 hover:bg-white transition-all flex items-center justify-center gap-1"
                                    >
                                        <Plus className="w-3 h-3" /> เพิ่มเวร
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* --- CONFIG MODAL --- */}
            {isConfigModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] scale-100 animate-in zoom-in-95 relative border border-gray-100">
                        <div className="px-6 py-5 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-black text-gray-800 flex items-center">
                                    <Settings className="w-5 h-5 mr-2 text-indigo-600" /> จัดการกติกาเวร (Rules)
                                </h3>
                                <p className="text-xs text-gray-500 mt-1">กำหนดจำนวนคนและหน้าที่ในแต่ละวัน</p>
                            </div>
                            <button onClick={() => setIsConfigModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-full text-gray-400 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1 space-y-6">
                            {WEEK_DAYS_MAP.map((dayMap) => {
                                const config = editingConfigs.find(c => c.dayOfWeek === dayMap.num) || { dayOfWeek: dayMap.num, requiredPeople: 1, taskTitles: [''] };
                                
                                return (
                                    <div key={dayMap.num} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                                        <div className="flex justify-between items-center mb-3">
                                            <h4 className="font-bold text-indigo-700">{dayMap.label}</h4>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-gray-500">จำนวนคน:</span>
                                                <select 
                                                    className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-sm font-bold focus:border-indigo-500 outline-none"
                                                    value={config.requiredPeople}
                                                    onChange={(e) => updateDayConfig(dayMap.num, 'requiredPeople', parseInt(e.target.value))}
                                                >
                                                    {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} คน</option>)}
                                                </select>
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-2">
                                            {Array.from({ length: config.requiredPeople }).map((_, idx) => (
                                                <div key={idx} className="flex items-center gap-2">
                                                    <span className="text-xs font-bold text-gray-400 w-6 text-center">{idx + 1}.</span>
                                                    <input 
                                                        type="text"
                                                        className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:border-indigo-500 outline-none"
                                                        placeholder={`หน้าที่ของคนที่ ${idx + 1}`}
                                                        value={config.taskTitles[idx] || ''}
                                                        onChange={(e) => updateTaskTitle(dayMap.num, idx, e.target.value)}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}

                            <div className="pt-4 border-t border-gray-100">
                                <button 
                                    onClick={() => {
                                        if(confirm('คุณแน่ใจนะว่าจะลบประวัติเวรที่เก่ากว่า 180 วัน?')) cleanupOldDuties();
                                    }}
                                    className="flex items-center text-xs font-bold text-orange-500 hover:text-orange-600 bg-orange-50 px-3 py-2 rounded-lg transition-colors w-fit"
                                >
                                    <ArchiveRestore className="w-4 h-4 mr-2" />
                                    ล้างประวัติเก่า (Cleanup History)
                                </button>
                            </div>
                        </div>

                        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                            <button onClick={() => setIsConfigModalOpen(false)} className="px-5 py-2.5 text-gray-500 font-bold hover:bg-gray-200 rounded-xl transition-colors">ยกเลิก</button>
                            <button onClick={handleSaveConfigs} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center">
                                <Save className="w-4 h-4 mr-2" /> บันทึกกติกา
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- RANDOMIZER MODAL --- */}
            {isRandomModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] scale-100 animate-in zoom-in-95 relative border border-gray-100">
                        {/* Shuffling Overlay */}
                        {randomStage !== 'IDLE' && randomStage !== 'RESULT' && (
                            <div className="absolute inset-0 z-20 bg-indigo-600/95 flex flex-col items-center justify-center text-white p-8 text-center animate-in fade-in duration-300">
                                <div className="relative mb-6">
                                    <div className="absolute inset-0 bg-white/20 rounded-full blur-xl animate-pulse"></div>
                                    <div className="relative bg-white text-indigo-600 p-4 rounded-full shadow-xl animate-bounce">
                                        <Dices className="w-10 h-10" />
                                    </div>
                                </div>
                                <h3 className="text-2xl font-black mb-2 animate-pulse">{loadingText}</h3>
                                <p className="text-indigo-200 text-sm">กำลังจัดสรรเวรให้ครบทุกคน...</p>
                            </div>
                        )}

                        {/* Modal Header */}
                        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-indigo-50 to-purple-50">
                            <div>
                                <h3 className="text-xl font-black text-gray-800 flex items-center">
                                    {randomStage === 'RESULT' ? <Sparkles className="w-5 h-5 mr-2 text-indigo-600" /> : <Wand2 className="w-5 h-5 mr-2 text-indigo-600" />}
                                    {randomStage === 'RESULT' ? 'ผลการจับคู่ 🎉' : 'สุ่มเวรอัตโนมัติ (Auto Random)'}
                                </h3>
                                <p className="text-xs text-gray-500 mt-1">
                                    {randomStage === 'RESULT' ? 'ตารางเวรที่ได้ในรอบนี้' : 'ระบบช่วยจัดตารางให้เป็นธรรม'}
                                </p>
                            </div>
                            <button onClick={handleCloseModal} className="p-2 hover:bg-white/50 rounded-full text-gray-400 hover:text-gray-600 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* RESULT STAGE (GROUPED VIEW) */}
                        {randomStage === 'RESULT' ? (
                            <div className="p-6 overflow-y-auto flex-1 bg-white">
                                <div className="space-y-4">
                                    {groupedPreviewDuties.map((group, index) => (
                                        <div 
                                            key={group.date.toISOString()} 
                                            className="flex flex-row gap-4 p-3 rounded-2xl border border-gray-100 bg-gray-50 hover:border-indigo-200 hover:shadow-sm transition-all animate-in slide-in-from-bottom-4"
                                            style={{ animationDelay: `${index * 50}ms` }}
                                        >
                                            {/* Date Column */}
                                            <div className="flex flex-col items-center justify-center min-w-[70px] bg-white rounded-xl border border-gray-200 p-2 h-fit self-start shadow-sm">
                                                <span className="block text-xs text-gray-400 uppercase font-bold tracking-wider">{format(group.date, 'EEE')}</span>
                                                <span className="block text-xl font-black text-indigo-600">{format(group.date, 'd')}</span>
                                            </div>

                                            {/* Team Column */}
                                            <div className="flex-1 flex flex-col gap-2 justify-center">
                                                {/* Header for Group */}
                                                {group.duties.length > 1 && (
                                                    <div className="flex items-center gap-1.5 mb-1">
                                                        <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-200 flex items-center w-fit">
                                                            <Users className="w-3 h-3 mr-1" />
                                                            Team of {group.duties.length}
                                                        </span>
                                                        <div className="h-px bg-gray-200 flex-1"></div>
                                                    </div>
                                                )}

                                                {/* Members List */}
                                                {group.duties.map((duty, idx) => {
                                                    const user = users.find(u => u.id === duty.assigneeId);
                                                    return (
                                                        <div key={idx} className="flex items-center justify-between">
                                                            <div className="flex items-center gap-3">
                                                                {user?.avatarUrl ? (
                                                                    <img src={user.avatarUrl} className="w-8 h-8 rounded-full border-2 border-white shadow-sm object-cover" />
                                                                ) : (
                                                                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500 border-2 border-white shadow-sm">
                                                                        {user?.name.charAt(0)}
                                                                    </div>
                                                                )}
                                                                <div>
                                                                    <p className="text-sm font-bold text-gray-800 leading-tight">{user?.name}</p>
                                                                    <p className="text-xs text-gray-500 font-medium">{duty.title}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                    {previewDuties.length === 0 && <div className="text-center py-10 text-gray-400">ช่วงวันที่เลือกไม่มีวันทำการครับ (ติดเสาร์-อาทิตย์)</div>}
                                </div>
                            </div>
                        ) : (
                            /* SELECTION STAGE */
                            <div className="p-6 overflow-y-auto flex-1 bg-white space-y-6">
                                {/* Random Mode Selector */}
                                <div className="grid grid-cols-2 gap-3">
                                    <button 
                                        onClick={() => setRandomMode('ROTATION')}
                                        className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${randomMode === 'ROTATION' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'}`}
                                    >
                                        <Repeat className="w-6 h-6" />
                                        <span className="text-xs font-bold">วนจนครบคน (Rotation)</span>
                                    </button>
                                    <button 
                                        onClick={() => setRandomMode('DURATION')}
                                        className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${randomMode === 'DURATION' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'}`}
                                    >
                                        <Hourglass className="w-6 h-6" />
                                        <span className="text-xs font-bold">กำหนดช่วงเวลา (Fixed)</span>
                                    </button>
                                </div>

                                {/* Config Preview */}
                                <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                                    <div className="flex justify-between items-center mb-2">
                                        <h4 className="text-xs font-bold text-indigo-800 uppercase flex items-center">
                                            <Info className="w-3 h-3 mr-1.5" /> สรุปกติกาที่ใช้ (Current Config)
                                        </h4>
                                        <button 
                                            onClick={() => { handleCloseModal(); handleOpenConfig(); }} 
                                            className="text-[10px] bg-white border border-indigo-200 text-indigo-600 px-2 py-1 rounded-lg hover:bg-indigo-50 font-bold"
                                        >
                                            แก้ไข
                                        </button>
                                    </div>
                                    <div className="space-y-1.5 bg-white p-3 rounded-lg border border-indigo-100/50">
                                        {WEEK_DAYS_MAP.map(day => {
                                            const cfg = configs.find(c => c.dayOfWeek === day.num);
                                            if (!cfg) return null;
                                            return (
                                                <div key={day.num} className="text-xs flex justify-between text-gray-600">
                                                    <span className="font-medium">{day.label}</span>
                                                    <span className="font-bold text-indigo-600">
                                                        {cfg.requiredPeople} คน 
                                                        <span className="text-gray-400 font-normal ml-1">
                                                            ({cfg.taskTitles.slice(0, cfg.requiredPeople).filter(Boolean).length > 0 
                                                                ? cfg.taskTitles.slice(0, cfg.requiredPeople).join(', ') 
                                                                : 'เวรทั่วไป'})
                                                        </span>
                                                    </span>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>

                                {/* Settings */}
                                <div className="border border-gray-200 rounded-xl p-4">
                                    <div className={`grid gap-4 ${randomMode === 'DURATION' ? 'grid-cols-2' : 'grid-cols-1'}`}>
                                        <div>
                                            <label className="text-xs font-bold text-gray-600 uppercase mb-2 flex items-center">
                                                <Calendar className="w-4 h-4 mr-1.5" /> เริ่มวันที่
                                            </label>
                                            <input 
                                                type="date" 
                                                className="w-full p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none text-gray-700 font-bold bg-white"
                                                value={format(randomStartDate, 'yyyy-MM-dd')}
                                                onChange={(e) => setRandomStartDate(new Date(e.target.value))}
                                            />
                                        </div>
                                        {randomMode === 'DURATION' && (
                                            <div className="animate-in fade-in slide-in-from-right-4">
                                                <label className="text-xs font-bold text-gray-600 uppercase mb-2 flex items-center">
                                                    <Clock className="w-4 h-4 mr-1.5" /> จำนวน (สัปดาห์)
                                                </label>
                                                <select 
                                                    className="w-full p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none text-gray-700 font-bold bg-white"
                                                    value={genDurationWeeks}
                                                    onChange={(e) => setGenDurationWeeks(parseInt(e.target.value))}
                                                >
                                                    <option value={1}>1 สัปดาห์</option>
                                                    <option value={2}>2 สัปดาห์</option>
                                                    <option value={4}>1 เดือน (4 สัปดาห์)</option>
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                    {randomMode === 'ROTATION' && (
                                        <div className="mt-3 text-xs text-indigo-600 bg-indigo-50 p-2 rounded-lg flex items-start">
                                            <Info className="w-4 h-4 mr-2 shrink-0 mt-0.5" />
                                            ระบบจะจัดเวรไปเรื่อยๆ จนกว่าทุกคนที่เลือกจะได้รับงานอย่างน้อย 1 ครั้ง
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-3">
                                        <h4 className="text-sm font-bold text-gray-700">ผู้เข้าร่วม ({participatingIds.length})</h4>
                                        <div className="space-x-2">
                                            <button onClick={() => setParticipatingIds(activeUsers.map(u => u.id))} className="text-[10px] bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded font-bold text-gray-600">เลือกทั้งหมด</button>
                                            <button onClick={() => setParticipatingIds([])} className="text-[10px] bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded font-bold text-gray-600">ล้าง</button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        {activeUsers.map(user => {
                                            const isSelected = participatingIds.includes(user.id);
                                            return (
                                                <div key={user.id} onClick={() => toggleParticipant(user.id)} className={`cursor-pointer flex items-center p-2 rounded-xl border-2 transition-all relative overflow-hidden group ${isSelected ? 'border-indigo-500 bg-indigo-50/50 shadow-sm' : 'border-gray-100 bg-white hover:border-gray-200'}`}>
                                                    <div className="relative mr-3">
                                                        {user.avatarUrl ? <img src={user.avatarUrl} className="w-8 h-8 rounded-full object-cover" /> : <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500"><UserIcon className="w-4 h-4" /></div>}
                                                        {isSelected && <div className="absolute -bottom-1 -right-1 bg-indigo-500 rounded-full border-2 border-white p-0.5"><Check className="w-2 h-2 text-white" /></div>}
                                                    </div>
                                                    <div className="min-w-0"><p className={`text-xs font-bold truncate ${isSelected ? 'text-indigo-700' : 'text-gray-600'}`}>{user.name}</p></div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                            {randomStage === 'RESULT' ? (
                                <>
                                    <button onClick={handleStartRandomize} className="px-5 py-2.5 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 font-bold rounded-xl transition-colors flex items-center"><RefreshCw className="w-4 h-4 mr-2" /> สุ่มใหม่</button>
                                    <button onClick={handleCloseModal} className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg shadow-green-200 transition-all active:scale-95 flex items-center"><CheckCircle2 className="w-4 h-4 mr-2" /> ตกลง (OK)</button>
                                </>
                            ) : (
                                <>
                                    <button onClick={handleCloseModal} className="px-5 py-2.5 text-gray-500 font-bold hover:bg-gray-200 rounded-xl transition-colors">ยกเลิก</button>
                                    <button onClick={handleStartRandomize} disabled={participatingIds.length === 0} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"><Sparkles className="w-4 h-4 mr-2" /> เริ่มสุ่มเลย!</button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DutyView;
