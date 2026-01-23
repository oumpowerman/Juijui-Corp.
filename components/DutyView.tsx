
import React, { useState, useEffect } from 'react';
import { User, Duty, DutyConfig } from '../types';
import { useDuty } from '../hooks/useDuty';
import { format, endOfWeek, eachDayOfInterval, isSameDay, addWeeks } from 'date-fns';
import { ChevronLeft, ChevronRight, Dices, Settings } from 'lucide-react';
import MentorTip from './MentorTip';
import { useGlobalDialog } from '../context/GlobalDialogContext';

// Sub Components
import DutyCalendarGrid from './duty/DutyCalendarGrid';
import RandomizerModal from './duty/RandomizerModal';
import ConfigModal from './duty/ConfigModal';
import MyDutyWidget from './dashboard/member/MyDutyWidget';

interface DutyViewProps {
    users: User[];
    currentUser?: User; // Optional in case needed, but usually passed
}

const WEEK_DAYS_MAP = [
    { num: 1, label: 'วันจันทร์ (Mon)' },
    { num: 2, label: 'วันอังคาร (Tue)' },
    { num: 3, label: 'วันพุธ (Wed)' },
    { num: 4, label: 'วันพฤหัส (Thu)' },
    { num: 5, label: 'วันศุกร์ (Fri)' },
];

const DutyView: React.FC<DutyViewProps> = ({ users, currentUser }) => {
    // Hook Logic
    const { 
        duties, configs, isLoading, 
        saveConfigs, addDuty, toggleDuty, deleteDuty, 
        generateRandomDuties, cleanupOldDuties, submitProof 
    } = useDuty();

    const { showAlert } = useGlobalDialog();

    // View State
    const [currentDate, setCurrentDate] = useState(new Date());
    
    // Add Duty State
    const [isAddMode, setIsAddMode] = useState<Date | null>(null);
    const [newDutyTitle, setNewDutyTitle] = useState('');
    const [assigneeId, setAssigneeId] = useState('');

    // --- Randomizer State ---
    const [isRandomModalOpen, setIsRandomModalOpen] = useState(false);
    const [participatingIds, setParticipatingIds] = useState<string[]>([]);
    const [randomStage, setRandomStage] = useState<'IDLE' | 'SHUFFLING' | 'RESULT'>('IDLE');
    const [loadingText, setLoadingText] = useState('กำลังล้างไพ่...');
    const [previewDuties, setPreviewDuties] = useState<Duty[]>([]);
    const [randomMode, setRandomMode] = useState<'ROTATION' | 'DURATION'>('ROTATION');
    const [randomStartDate, setRandomStartDate] = useState<Date>(new Date()); 
    const [genDurationWeeks, setGenDurationWeeks] = useState<number>(1); 

    // --- Config Modal State ---
    const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
    const [editingConfigs, setEditingConfigs] = useState<DutyConfig[]>([]);

    // Date Calculation
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

    // --- Randomizer Handlers ---
    const handleOpenRandomizer = () => {
        setParticipatingIds(activeUsers.map(u => u.id));
        setRandomStage('IDLE');
        setPreviewDuties([]);
        setRandomMode('ROTATION'); 
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        setRandomStartDate(today >= start && today <= end ? today : start);
        setIsRandomModalOpen(true);
    };

    const handleStartRandomize = () => {
        if (participatingIds.length === 0) {
            showAlert('ต้องเลือกคนอย่างน้อย 1 คนครับ');
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
            const results = await generateRandomDuties(randomStartDate, randomMode, genDurationWeeks, selectedUsers);
            setPreviewDuties(results);
            setRandomStage('RESULT');
        }, 2000);
    };

    // --- Config Handlers ---
    const handleOpenConfig = () => {
        const fullConfigs = WEEK_DAYS_MAP.map(day => {
            const existing = configs.find(c => c.dayOfWeek === day.num);
            return existing ? { ...existing } : { dayOfWeek: day.num, requiredPeople: 1, taskTitles: ['ทำความสะอาด'] };
        });
        setEditingConfigs(fullConfigs);
        setIsConfigModalOpen(true);
    };

    const handleUpdateConfig = (dayNum: number, field: keyof DutyConfig, value: any) => {
        setEditingConfigs(prev => prev.map(c => c.dayOfWeek === dayNum ? { ...c, [field]: value } : c));
    };

    const handleUpdateTitle = (dayNum: number, index: number, value: string) => {
        setEditingConfigs(prev => prev.map(c => {
            if (c.dayOfWeek !== dayNum) return c;
            const newTitles = [...c.taskTitles];
            newTitles[index] = value;
            return { ...c, taskTitles: newTitles };
        }));
    };

    // --- Add Duty Handlers ---
    const handleStartAdd = (day: Date) => {
        setIsAddMode(day); 
        setNewDutyTitle(''); 
        if (activeUsers.length > 0) setAssigneeId(activeUsers[0].id);
    };

    const handleConfirmAdd = () => {
        if (isAddMode && newDutyTitle && assigneeId) {
            addDuty(newDutyTitle, assigneeId, isAddMode);
            setIsAddMode(null);
            setNewDutyTitle('');
            setAssigneeId('');
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20 relative">
            <MentorTip variant="green" messages={[
                "ใหม่! ระบบส่งการบ้าน 📸 ถ่ายรูปยืนยันว่าทำเวรแล้วได้เลย",
                "เมื่อส่งรูป ระบบจะแจ้งเตือนใน Team Chat ให้เพื่อนๆ ทราบอัตโนมัติ"
            ]} />

            {/* My Duty Highlight */}
            {currentUser && <MyDutyWidget duties={duties} currentUser={currentUser} />}

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
                    <button 
                        onClick={handleOpenConfig}
                        className="p-2.5 bg-white border border-gray-200 text-gray-600 hover:text-indigo-600 hover:border-indigo-200 rounded-xl shadow-sm transition-all"
                        title="จัดการกติกาเวร (Rules)"
                    >
                        <Settings className="w-5 h-5" />
                    </button>

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

            {/* Calendar Grid */}
            <DutyCalendarGrid 
                weekDays={weekDays}
                duties={duties}
                users={users}
                currentUser={currentUser || { id: '', name: 'Guest' } as User}
                isAddMode={isAddMode}
                newDutyTitle={newDutyTitle}
                assigneeId={assigneeId}
                onStartAdd={handleStartAdd}
                onCancelAdd={() => setIsAddMode(null)}
                onAdd={handleConfirmAdd}
                setNewDutyTitle={setNewDutyTitle}
                setAssigneeId={setAssigneeId}
                onToggleDuty={toggleDuty}
                onDeleteDuty={deleteDuty}
                onSubmitProof={submitProof}
            />

            {/* Modals */}
            <RandomizerModal 
                isOpen={isRandomModalOpen}
                onClose={() => setIsRandomModalOpen(false)}
                stage={randomStage}
                loadingText={loadingText}
                mode={randomMode}
                setMode={setRandomMode}
                startDate={randomStartDate}
                setStartDate={setRandomStartDate}
                durationWeeks={genDurationWeeks}
                setDurationWeeks={setGenDurationWeeks}
                users={activeUsers}
                selectedIds={participatingIds}
                onToggleUser={(id) => setParticipatingIds(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id])}
                onSelectAll={() => setParticipatingIds(activeUsers.map(u => u.id))}
                onClearAll={() => setParticipatingIds([])}
                onStart={handleStartRandomize}
                onReset={() => { setRandomStage('IDLE'); setPreviewDuties([]); }}
                onConfirm={() => { setIsRandomModalOpen(false); setRandomStage('IDLE'); }}
                configs={configs}
                previewDuties={previewDuties}
            />

            <ConfigModal 
                isOpen={isConfigModalOpen}
                onClose={() => setIsConfigModalOpen(false)}
                configs={editingConfigs}
                onUpdateConfig={handleUpdateConfig}
                onUpdateTitle={handleUpdateTitle}
                onSave={() => { saveConfigs(editingConfigs); setIsConfigModalOpen(false); }}
                onCleanup={cleanupOldDuties}
            />
        </div>
    );
};

export default DutyView;
