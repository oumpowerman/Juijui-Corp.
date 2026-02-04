
import React, { useState, useMemo, useEffect } from 'react';
import { User, DutyConfig, Duty } from '../types';
import { useDuty } from '../hooks/useDuty';
import { useGoogleDrive } from '../hooks/useGoogleDrive'; // New Import
import { format, endOfWeek, eachDayOfInterval, addWeeks, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight, Dices, Settings, CalendarDays } from 'lucide-react';
import MentorTip from './MentorTip';
import { useGlobalDialog } from '../context/GlobalDialogContext';
import { useGamification } from '../hooks/useGamification';
import { supabase } from '../lib/supabase';

// Sub Components
import DutyCalendarGrid from './duty/DutyCalendarGrid';
import RandomizerModal from './duty/RandomizerModal';
import ConfigModal from './duty/ConfigModal';
import MyDutyWidget from './dashboard/member/MyDutyWidget';
import SwapInbox from './duty/SwapInbox';
import SwapRequestModal from './duty/SwapRequestModal';
import MobileDutyAction from './duty/MobileDutyAction';
import DutyTribunalModal from './duty/DutyTribunalModal'; // Import Tribunal

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
        requestSwap, respondSwap, submitAppeal 
    } = useDuty(currentUser);

    const { processAction } = useGamification(currentUser);
    const { uploadFileToDrive, isReady: isDriveReady } = useGoogleDrive();
    const { showAlert, showConfirm } = useGlobalDialog();

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

    // --- Tribunal State ---
    const [pendingRedemptionDuty, setPendingRedemptionDuty] = useState<Duty | null>(null);

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

    // --- Find My Pending Duty for Today (Mobile Logic) ---
    const myPendingDutyToday = useMemo(() => {
        if (!currentUser) return null;
        const today = new Date();
        return duties.find(d => 
            d.assigneeId === currentUser.id && 
            !d.isDone && 
            isSameDay(new Date(d.date), today)
        );
    }, [duties, currentUser]);

    // --- Check for Pending Penalties (Tribunal Trigger) ---
    useEffect(() => {
        if (currentUser) {
            const tribunalDuty = duties.find(d => 
                d.assigneeId === currentUser.id && 
                d.penaltyStatus === 'AWAITING_TRIBUNAL' &&
                !d.isDone
            );
            if (tribunalDuty) {
                setPendingRedemptionDuty(tribunalDuty);
            }
        }
    }, [duties, currentUser]);

    // --- Wrapper to inject Google Drive logic ---
    const handleSubmitProofWrapper = async (dutyId: string, file: File, userName: string) => {
        // Define uploader if Drive is ready
        const googleDriveUploader = isDriveReady ? async (fileToUpload: File): Promise<string | null> => {
            const currentMonthFolder = format(new Date(), 'yyyy-MM');
            return new Promise((resolve) => {
                uploadFileToDrive(
                    fileToUpload, 
                    (result) => {
                        // Use thumbnailLink hack or full url.
                        const finalUrl = result.thumbnailUrl || result.url;
                        resolve(finalUrl);
                    },
                    ['Duty', currentMonthFolder] 
                );
            });
        } : undefined;

        // Pass to original hook
        return await submitProof(dutyId, file, userName, googleDriveUploader);
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

    // --- Tribunal Handlers ---
    const handleAcceptPenalty = async (duty: Duty) => {
        if (!currentUser) return;
        if (duty.assigneeId !== currentUser.id) return; // SECURITY LOCK
        
        try {
            await supabase.from('duties').update({ 
                is_penalized: true, 
                penalty_status: 'ACCEPTED_FAULT' 
            }).eq('id', duty.id);
            
            await processAction(currentUser.id, 'DUTY_MISSED', duty);
            setPendingRedemptionDuty(null);
        } catch (err) {
            console.error(err);
        }
    };

    const handleRedeem = async (duty: Duty, file: File) => {
        if (!currentUser) return;
        if (duty.assigneeId !== currentUser.id) return; // SECURITY LOCK

        try {
            // 1. Submit Proof (Mark done)
            const success = await handleSubmitProofWrapper(duty.id, file, currentUser.name);
            if (!success) return;

            // 2. Update status to LATE_COMPLETED
            await supabase.from('duties').update({ 
                penalty_status: 'LATE_COMPLETED' 
            }).eq('id', duty.id);

            // 3. Process Logic (Small Penalty or Cost)
            // 'DUTY_LATE_SUBMIT' logic defined in gameLogic (e.g. -3 HP, but marked done)
            await processAction(currentUser.id, 'DUTY_LATE_SUBMIT', duty);

            setPendingRedemptionDuty(null);
        } catch (err) {
            console.error(err);
        }
    };

    const handleAppeal = async (duty: Duty, reason: string, file?: File) => {
        if (!currentUser) return;
        if (duty.assigneeId !== currentUser.id) return; // SECURITY LOCK
        
        const googleDriveUploader = isDriveReady ? async (fileToUpload: File): Promise<string | null> => {
            const currentMonthFolder = format(new Date(), 'yyyy-MM');
            return new Promise((resolve) => {
                uploadFileToDrive(
                    fileToUpload, 
                    (result) => {
                        const finalUrl = result.thumbnailUrl || result.url;
                        resolve(finalUrl);
                    },
                    ['Duty_Appeals', currentMonthFolder] 
                );
            });
        } : undefined;

        await submitAppeal(duty.id, reason, file, currentUser.name, googleDriveUploader);
        setPendingRedemptionDuty(null);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-24 relative">
            
            {/* --- MOBILE ACTION (If has pending duty) --- */}
            <div className="lg:hidden">
                {myPendingDutyToday && currentUser && (
                    <MobileDutyAction 
                        duty={myPendingDutyToday}
                        onToggle={toggleDuty}
                        onSubmitProof={handleSubmitProofWrapper} // Use Wrapper
                        onRequestSwap={handleInitiateSwap}
                        userName={currentUser.name}
                    />
                )}
            </div>

            <MentorTip variant="green" messages={[
                "ใหม่! ระบบแลกเวร (Swap Request) 🔄 ขอกันดีๆ ไม่ต้องตีกัน",
                "ถ่ายรูปส่งการบ้าน 📸 เพื่อยืนยันความบริสุทธิ์ใจว่าทำจริง!",
                "หากลืมทำเวร ระบบจะให้โอกาสแก้ตัวในวันรุ่งขึ้น (Tribunal) อย่าเพิ่งตกใจ!"
            ]} />

            {/* --- HERO SECTION --- */}
            <div>
                {/* 1. Alerts */}
                {currentUser && <SwapInbox requests={swapRequests} currentUser={currentUser} onRespond={respondSwap} />}
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
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">WEEK OF</p>
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
                onSubmitProof={handleSubmitProofWrapper} // Use Wrapper
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

            {/* THE TRIBUNAL MODAL */}
            {pendingRedemptionDuty && (
                <DutyTribunalModal 
                    isOpen={!!pendingRedemptionDuty}
                    pendingDuty={pendingRedemptionDuty}
                    onAcceptPenalty={handleAcceptPenalty}
                    onRedeem={handleRedeem}
                    onAppeal={handleAppeal}
                />
            )}
        </div>
    );
};

export default DutyView;
