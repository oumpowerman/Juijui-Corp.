
import React, { useState } from 'react';
import { User, DutyConfig, Duty } from '../types';
import { useDuty } from '../hooks/useDuty';
import { format, endOfWeek, eachDayOfInterval, addWeeks } from 'date-fns';
import { ChevronLeft, ChevronRight, Dices, Settings, CalendarDays } from 'lucide-react';
import MentorTip from './MentorTip';
import { useGlobalDialog } from '../context/GlobalDialogContext';

// Sub Components
import DutyCalendarGrid from './duty/DutyCalendarGrid';
import RandomizerModal from './duty/RandomizerModal';
import ConfigModal from './duty/ConfigModal';
import MyDutyWidget from './dashboard/member/MyDutyWidget';
import SwapInbox from './duty/SwapInbox';
import SwapRequestModal from './duty/SwapRequestModal';

interface DutyViewProps {
    users: User[];
    currentUser?: User;
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
        duties, configs, swapRequests, isLoading, 
        saveConfigs, addDuty, toggleDuty, deleteDuty, 
        calculateRandomDuties, saveDuties, cleanupOldDuties, submitProof,
        requestSwap, respondSwap 
    } = useDuty(currentUser);

    const { showAlert } = useGlobalDialog();

    // View State
    const [currentDate, setCurrentDate] = useState(new Date());
    
    // Add Duty State
    const [isAddMode, setIsAddMode] = useState<Date | null>(null);
    const [newDutyTitle, setNewDutyTitle] = useState('');
    const [assigneeId, setAssigneeId] = useState('');

    // --- Randomizer State ---
    const [isRandomModalOpen, setIsRandomModalOpen] = useState(false);
    
    // --- Config Modal State ---
    const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
    const [editingConfigs, setEditingConfigs] = useState<DutyConfig[]>([]);

    // --- Swap Request State ---
    const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
    const [sourceDutyForSwap, setSourceDutyForSwap] = useState<Duty | null>(null);

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

    // --- Swap Handler ---
    const handleInitiateSwap = (duty: Duty) => {
        setSourceDutyForSwap(duty);
        setIsSwapModalOpen(true);
    };

    const handleConfirmSwap = (targetDutyId: string) => {
        if (sourceDutyForSwap) {
            requestSwap(sourceDutyForSwap.id, targetDutyId);
            setIsSwapModalOpen(false);
            setSourceDutyForSwap(null);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-24 relative">
            <MentorTip variant="green" messages={[
                "ใหม่! ระบบแลกเวร (Swap Request) 🔄 ขอกันดีๆ ไม่ต้องตีกัน",
                "ถ่ายรูปส่งการบ้าน 📸 เพื่อยืนยันความบริสุทธิ์ใจว่าทำจริง!"
            ]} />

            {/* --- HERO SECTION --- */}
            <div>
                {/* 1. Alerts */}
                {currentUser && <SwapInbox requests={swapRequests} currentUser={currentUser} onRespond={respondSwap} />}

                {/* 2. My Mission Card */}
                {currentUser && <MyDutyWidget duties={duties} currentUser={currentUser} />}
            </div>

            {/* --- CONTROL DOCK --- */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-col xl:flex-row items-center justify-between gap-4 sticky top-2 z-30">
                
                {/* Left: Title */}
                <div className="flex items-center gap-3">
                    <div className="bg-indigo-50 p-2 rounded-xl text-indigo-600">
                        <CalendarDays className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-gray-800 tracking-tight">Duty Roster</h2>
                        <p className="text-xs text-gray-500 font-medium">ตารางเวรประจำสัปดาห์</p>
                    </div>
                </div>

                {/* Center: Navigator */}
                <div className="flex items-center bg-gray-50 p-1 rounded-xl border border-gray-200">
                    <button onClick={() => setCurrentDate(addWeeks(currentDate, -1))} className="p-2 hover:bg-white hover:shadow-sm rounded-lg text-gray-500 hover:text-indigo-600 transition-all">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="px-6 text-center min-w-[140px]">
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">WEEK OF</p>
                        <p className="text-indigo-600 font-black text-sm">
                            {format(start, 'd MMM')} - {format(end, 'd MMM')}
                        </p>
                    </div>
                    <button onClick={() => setCurrentDate(addWeeks(currentDate, 1))} className="p-2 hover:bg-white hover:shadow-sm rounded-lg text-gray-500 hover:text-indigo-600 transition-all">
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => setIsRandomModalOpen(true)}
                        className="flex items-center px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all active:scale-95"
                    >
                        <Dices className="w-4 h-4 mr-2" />
                        สุ่มเวร (Randomizer)
                    </button>
                    <button 
                        onClick={handleOpenConfig}
                        className="p-2.5 bg-white border border-gray-200 text-gray-500 hover:text-indigo-600 hover:border-indigo-200 rounded-xl transition-all"
                        title="ตั้งค่ากติกา"
                    >
                        <Settings className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* --- GRID --- */}
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
                onRequestSwap={handleInitiateSwap}
            />

            {/* Modals */}
            <RandomizerModal 
                isOpen={isRandomModalOpen}
                onClose={() => setIsRandomModalOpen(false)}
                users={activeUsers}
                configs={configs}
                calculateDuties={calculateRandomDuties}
                onSaveToDB={saveDuties}
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

            {currentUser && (
                <SwapRequestModal 
                    isOpen={isSwapModalOpen}
                    onClose={() => setIsSwapModalOpen(false)}
                    sourceDuty={sourceDutyForSwap}
                    allDuties={duties}
                    users={users}
                    currentUser={currentUser}
                    onConfirmSwap={handleConfirmSwap}
                />
            )}
        </div>
    );
};

export default DutyView;
