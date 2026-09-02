import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, Clock, AlignLeft, Users, Trash2, Check, Sparkles, Repeat, Lock, ArrowRight, UserMinus, Globe } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Task, User, Status } from '../../types';
import DatePickerModal, { formatDisplayDate } from '../ui/DatePickerModal';
import TimePickerModal from '../ui/TimePickerModal';

interface PlanFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    date: Date | null;
    initialData?: Task | null;
    users: User[];
    currentUser?: User;
    onSave: (task: Task) => void;
    onDelete?: (taskId: string) => void;
}

const PlanFormModal: React.FC<PlanFormModalProps> = ({
    isOpen,
    onClose,
    date,
    initialData,
    users,
    currentUser,
    onSave,
    onDelete
}) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [scheduledTime, setScheduledTime] = useState('10:00');
    const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
    
    // Privacy Mode: 'PRIVATE' (only me) | 'SHARED' (team)
    const [privacyMode, setPrivacyMode] = useState<'PRIVATE' | 'SHARED'>('PRIVATE');

    // Frequency Mode: 'ONE_TIME' | 'MONTHLY_ROUTINE'
    const [frequencyMode, setFrequencyMode] = useState<'ONE_TIME' | 'MONTHLY_ROUTINE'>('ONE_TIME');
    
    // One-time dates
    const [startDate, setStartDate] = useState<Date | null>(date);
    const [endDate, setEndDate] = useState<Date | null>(date);
    
    // Monthly Routine days (1-31)
    const [routineStartDay, setRoutineStartDay] = useState<number>(date ? date.getDate() : 1);
    const [routineEndDay, setRoutineEndDay] = useState<number>(date ? date.getDate() : 1);
    
    const [status, setStatus] = useState<Status>('TODO');
    const [activeDatePicker, setActiveDatePicker] = useState<'START' | 'END' | null>(null);
    const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isOptingOut, setIsOptingOut] = useState(false);

    // Check if current user is an assignee in a shared multi-person plan
    const canOptOut = Boolean(
        initialData &&
        currentUser?.id &&
        initialData.assigneeIds &&
        initialData.assigneeIds.length > 1 &&
        initialData.assigneeIds.includes(currentUser.id)
    );

    // Populate data when editing
    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setTitle(initialData.title || '');
                setDescription(initialData.description || '');
                setScheduledTime(initialData.scheduledTime || '10:00');
                
                const existingAssignees = initialData.assigneeIds || (currentUser ? [currentUser.id] : []);
                setAssigneeIds(existingAssignees);
                
                // Determine privacy mode based on assignees
                const isOnlyMe = currentUser?.id 
                    ? existingAssignees.length === 1 && existingAssignees[0] === currentUser.id 
                    : existingAssignees.length <= 1;
                setPrivacyMode(isOnlyMe ? 'PRIVATE' : 'SHARED');

                const isMonthly = !!(initialData.isMonthlyRecurring || initialData.recurrence === 'MONTHLY');
                setFrequencyMode(isMonthly ? 'MONTHLY_ROUTINE' : 'ONE_TIME');
                
                const sDate = initialData.startDate ? new Date(initialData.startDate) : (date || new Date());
                const eDate = initialData.endDate ? new Date(initialData.endDate) : sDate;
                setStartDate(sDate);
                setEndDate(eDate);
                
                setRoutineStartDay(initialData.routineStartDay !== undefined ? initialData.routineStartDay : sDate.getDate());
                setRoutineEndDay(initialData.routineEndDay !== undefined ? initialData.routineEndDay : eDate.getDate());
                
                setStatus(initialData.status || 'TODO');
            } else {
                const baseDate = date || new Date();
                setTitle('');
                setDescription('');
                setScheduledTime('10:00');
                setAssigneeIds(currentUser ? [currentUser.id] : []);
                setPrivacyMode('PRIVATE');
                setFrequencyMode('ONE_TIME');
                setStartDate(baseDate);
                setEndDate(baseDate);
                setRoutineStartDay(baseDate.getDate());
                setRoutineEndDay(baseDate.getDate());
                setStatus('TODO');
            }
        }
    }, [isOpen, initialData, currentUser, date]);

    const handlePrivacyChange = (mode: 'PRIVATE' | 'SHARED') => {
        setPrivacyMode(mode);
        if (mode === 'PRIVATE') {
            setAssigneeIds(currentUser ? [currentUser.id] : []);
        } else {
            // When switching to shared, keep current user plus allow picking others
            if (currentUser && !assigneeIds.includes(currentUser.id)) {
                setAssigneeIds(prev => [currentUser.id, ...prev]);
            }
        }
    };

    const handleOptOut = async () => {
        if (!initialData || !currentUser?.id || !canOptOut) return;
        if (!window.confirm('คุณต้องการถอนตัวออกจากนัดหมาย/แพลนนี้ใช่หรือไม่? (รายการนี้จะหายไปจากปฏิทินของคุณ แต่ยังคงอยู่กับสมาชิกคนอื่นในทีม)')) return;

        setIsOptingOut(true);
        try {
            const updatedAssignees = (initialData.assigneeIds || []).filter(id => id !== currentUser.id);
            const updatedPlan: Task = {
                ...initialData,
                assigneeIds: updatedAssignees,
                updatedAt: new Date()
            };
            await onSave(updatedPlan);
            onClose();
        } catch (error) {
            console.error('Failed to opt out of plan:', error);
        } finally {
            setIsOptingOut(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        setIsSaving(true);
        try {
            const isMonthly = frequencyMode === 'MONTHLY_ROUTINE';
            
            // Build start/end date objects
            let finalStartDate: Date;
            let finalEndDate: Date;
            
            if (isMonthly) {
                const now = date || new Date();
                const year = now.getFullYear();
                const month = now.getMonth();
                finalStartDate = new Date(year, month, routineStartDay, 0, 0, 0);
                finalEndDate = new Date(year, month, routineEndDay, 23, 59, 59);
            } else {
                finalStartDate = startDate || date || new Date();
                finalEndDate = endDate || startDate || date || new Date();
                if (finalEndDate < finalStartDate) {
                    finalEndDate = new Date(finalStartDate);
                }
            }

            // Ensure assignees reflect privacy mode
            let finalAssignees = assigneeIds;
            if (privacyMode === 'PRIVATE') {
                finalAssignees = currentUser ? [currentUser.id] : [];
            } else if (finalAssignees.length === 0 && currentUser) {
                finalAssignees = [currentUser.id];
            }

            const planData: Task = {
                id: initialData?.id || crypto.randomUUID(),
                type: 'PLAN',
                title: title.trim(),
                description: description.trim(),
                status,
                startDate: finalStartDate,
                endDate: finalEndDate,
                scheduledTime,
                assigneeIds: finalAssignees,
                isRoutine: isMonthly,
                isMonthlyRecurring: isMonthly,
                recurrence: isMonthly ? 'MONTHLY' : 'NONE',
                routineStartDay: isMonthly ? routineStartDay : undefined,
                routineEndDay: isMonthly ? routineEndDay : undefined,
                tags: isMonthly ? ['#รูทีนประจำเดือน', '#แพลนงาน'] : ['#แพลนงาน'],
                difficulty: 'EASY',
                estimatedHours: 1,
                createdAt: initialData?.createdAt || new Date(),
                updatedAt: new Date()
            };

            await onSave(planData);
            onClose();
        } catch (error) {
            console.error('Failed to save plan:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const toggleAssignee = (userId: string) => {
        setAssigneeIds(prev => 
            prev.includes(userId) 
                ? prev.filter(id => id !== userId) 
                : [...prev, userId]
        );
    };

    const activeUsers = users.filter(u => u.isActive);

    return createPortal(
        <>
            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-[12000] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
                        onClick={(e) => {
                            if (e.target === e.currentTarget) onClose();
                        }}
                    >
                        <motion.div 
                            initial={{ y: 80, opacity: 0, scale: 0.95 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            exit={{ y: 60, opacity: 0, scale: 0.95 }}
                            transition={{ type: 'spring', stiffness: 360, damping: 26 }}
                            className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]" 
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="bg-gradient-to-r from-fuchsia-50/80 via-purple-50/50 to-pink-50/50 px-6 py-4 border-b border-fuchsia-100 flex justify-between items-center shrink-0">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 bg-fuchsia-100 text-fuchsia-600 rounded-xl shadow-xs">
                                        {frequencyMode === 'MONTHLY_ROUTINE' ? (
                                            <Repeat className="w-5 h-5" />
                                        ) : (
                                            <Sparkles className="w-5 h-5" />
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-fuchsia-950 text-base flex items-center gap-2">
                                            {initialData ? 'แก้ไขแพลน / รูทีน' : 'สร้างแพลน / รูทีนใหม่'}
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 shadow-2xs ${
                                                privacyMode === 'PRIVATE'
                                                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                                                    : 'bg-indigo-50 text-indigo-800 border-indigo-200'
                                            }`}>
                                                {privacyMode === 'PRIVATE' ? (
                                                    <><Lock className="w-2.5 h-2.5" /> ส่วนบุคคล (เฉพาะฉัน)</>
                                                ) : (
                                                    <><Globe className="w-2.5 h-2.5" /> แชร์ร่วมกับทีม</>
                                                )}
                                            </span>
                                        </h3>
                                        <p className="text-xs text-fuchsia-700/80 font-medium mt-0.5">
                                            {frequencyMode === 'MONTHLY_ROUTINE' 
                                                ? `วนซ้ำทุกเดือน (วันที่ ${routineStartDay} - ${routineEndDay})` 
                                                : `ช่วงวันที่ ${startDate ? format(startDate, 'd MMM') : ''} - ${endDate ? format(endDate, 'd MMM yyyy') : ''}`}
                                        </p>
                                    </div>
                                </div>
                                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-100 rounded-full transition-all">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Form Body */}
                            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-5">
                                {/* Privacy & Sharing Selector */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center justify-between">
                                        <span className="flex items-center gap-1.5">
                                            <Lock className="w-3.5 h-3.5 text-fuchsia-500" />
                                            ความเป็นส่วนตัว & สิทธิ์การมองเห็น
                                        </span>
                                        <span className="text-[10px] text-fuchsia-600 font-bold bg-fuchsia-50 px-2 py-0.5 rounded-full border border-fuchsia-100">
                                            {privacyMode === 'PRIVATE' ? '🔒 มองเห็นเฉพาะฉัน' : '👥 มองเห็นตามสมาชิกที่เลือก'}
                                        </span>
                                    </label>
                                    <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100/70 rounded-2xl border border-slate-200/60">
                                        <button
                                            type="button"
                                            onClick={() => handlePrivacyChange('PRIVATE')}
                                            className={`
                                                flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all
                                                ${privacyMode === 'PRIVATE'
                                                    ? 'bg-white text-amber-900 shadow-sm border border-amber-200'
                                                    : 'text-slate-500 hover:text-slate-800'
                                                }
                                            `}
                                        >
                                            <Lock className="w-3.5 h-3.5 text-amber-500" />
                                            <span>ส่วนตัว (เฉพาะฉัน)</span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => handlePrivacyChange('SHARED')}
                                            className={`
                                                flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all
                                                ${privacyMode === 'SHARED'
                                                    ? 'bg-white text-indigo-900 shadow-sm border border-indigo-200'
                                                    : 'text-slate-500 hover:text-slate-800'
                                                }
                                            `}
                                        >
                                            <Users className="w-3.5 h-3.5 text-indigo-500" />
                                            <span>แชร์ร่วมกับทีม</span>
                                        </button>
                                    </div>
                                </div>
                                {/* Mode Selector: One-Time vs Monthly Routine */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                                        <Repeat className="w-3.5 h-3.5 text-fuchsia-500" />
                                        รูปแบบความถี่ของแพลน
                                    </label>
                                    <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100/70 rounded-2xl border border-slate-200/60">
                                        <button
                                            type="button"
                                            onClick={() => setFrequencyMode('ONE_TIME')}
                                            className={`
                                                flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all
                                                ${frequencyMode === 'ONE_TIME'
                                                    ? 'bg-white text-fuchsia-900 shadow-sm border border-fuchsia-200'
                                                    : 'text-slate-500 hover:text-slate-800'
                                                }
                                            `}
                                        >
                                            <Calendar className="w-3.5 h-3.5 text-fuchsia-500" />
                                            <span>📅 เฉพาะช่วงวันที่กำหนด</span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setFrequencyMode('MONTHLY_ROUTINE')}
                                            className={`
                                                flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all
                                                ${frequencyMode === 'MONTHLY_ROUTINE'
                                                    ? 'bg-white text-fuchsia-900 shadow-sm border border-fuchsia-200'
                                                    : 'text-slate-500 hover:text-slate-800'
                                                }
                                            `}
                                        >
                                            <Repeat className="w-3.5 h-3.5 text-fuchsia-500" />
                                            <span>🔁 รูทีนประจำทุกเดือน</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Title */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                                        <Calendar className="w-3.5 h-3.5 text-fuchsia-500" />
                                        หัวข้อนัดหมาย / แพลนการทำงาน
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="เช่น นัดสัมภาษณ์งาน, ออกกำลังกาย, ถ่ายคลิป..."
                                        value={title}
                                        onChange={e => setTitle(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/20 focus:border-fuchsia-500 text-sm font-semibold text-gray-800 transition-all placeholder:text-gray-300"
                                    />
                                </div>

                                {/* Status Selector */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                                        <Sparkles className="w-3.5 h-3.5 text-fuchsia-500" />
                                        สถานะนัดหมาย / แพลน
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            { value: 'TODO', label: 'TODO 📋', activeClass: 'bg-stone-100 border-stone-300 text-stone-800 shadow-sm font-bold', inactiveClass: 'bg-white border-gray-200 text-gray-400 hover:bg-gray-50/50' },
                                            { value: 'DOING', label: 'DOING ⚡', activeClass: 'bg-amber-50 border-amber-300 text-amber-850 shadow-sm font-bold', inactiveClass: 'bg-white border-gray-200 text-gray-400 hover:bg-gray-50/50' },
                                            { value: 'DONE', label: 'DONE ✅', activeClass: 'bg-emerald-50 border-emerald-300 text-emerald-850 shadow-sm font-bold', inactiveClass: 'bg-white border-gray-200 text-gray-400 hover:bg-gray-50/50' }
                                        ].map(opt => {
                                            const isSelected = status === opt.value;
                                            return (
                                                <button
                                                    type="button"
                                                    key={opt.value}
                                                    onClick={() => setStatus(opt.value as Status)}
                                                    className={`
                                                        py-2 px-3 rounded-xl border text-xs text-center transition-all active:scale-[0.98] font-bold tracking-wide
                                                        ${isSelected ? opt.activeClass : opt.inactiveClass}
                                                    `}
                                                >
                                                    {opt.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Date Range OR Monthly Routine Range Picker */}
                                {frequencyMode === 'ONE_TIME' ? (
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                                            <Calendar className="w-3.5 h-3.5 text-fuchsia-500" />
                                            ช่วงวันที่จัดนัดหมาย (ยืดได้หลายวัน)
                                        </label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <span className="text-[10px] text-gray-400 font-bold block mb-1">วันที่เริ่มต้น</span>
                                                <button
                                                    type="button"
                                                    onClick={() => setActiveDatePicker('START')}
                                                    className="w-full px-3 py-2 rounded-xl border border-gray-200 hover:border-fuchsia-300 hover:bg-fuchsia-50/10 text-left text-xs font-semibold text-gray-800 transition-all flex items-center justify-between"
                                                >
                                                    <span>{startDate ? formatDisplayDate(startDate) : 'เลือกวันเริ่ม'}</span>
                                                    <Calendar className="w-3.5 h-3.5 text-fuchsia-400" />
                                                </button>
                                            </div>

                                            <div>
                                                <span className="text-[10px] text-gray-400 font-bold block mb-1">วันที่สิ้นสุด</span>
                                                <button
                                                    type="button"
                                                    onClick={() => setActiveDatePicker('END')}
                                                    className="w-full px-3 py-2 rounded-xl border border-gray-200 hover:border-fuchsia-300 hover:bg-fuchsia-50/10 text-left text-xs font-semibold text-gray-800 transition-all flex items-center justify-between"
                                                >
                                                    <span>{endDate ? formatDisplayDate(endDate) : 'เลือกวันสิ้นสุด'}</span>
                                                    <Calendar className="w-3.5 h-3.5 text-fuchsia-400" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    /* Monthly Routine Day Range Selector */
                                    <div className="space-y-2 p-3.5 bg-fuchsia-50/40 rounded-2xl border border-fuchsia-100">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-bold text-fuchsia-950 uppercase tracking-wider flex items-center gap-1.5">
                                                <Repeat className="w-3.5 h-3.5 text-fuchsia-500" />
                                                กำหนดวันที่เกิดรูทีนในทุกเดือน (1-31)
                                            </label>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="flex-1">
                                                <span className="text-[10px] text-fuchsia-700 font-bold block mb-1">ทุกวันที่ (เริ่ม)</span>
                                                <select
                                                    value={routineStartDay}
                                                    onChange={e => {
                                                        const val = parseInt(e.target.value, 10);
                                                        setRoutineStartDay(val);
                                                        if (val > routineEndDay) setRoutineEndDay(val);
                                                    }}
                                                    className="w-full px-3 py-2 rounded-xl border border-fuchsia-200 bg-white font-bold text-sm text-fuchsia-950 focus:outline-none focus:ring-2 focus:ring-fuchsia-400"
                                                >
                                                    {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                                                        <option key={day} value={day}>วันที่ {day}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="pt-4 text-fuchsia-400 font-black">
                                                <ArrowRight className="w-4 h-4" />
                                            </div>

                                            <div className="flex-1">
                                                <span className="text-[10px] text-fuchsia-700 font-bold block mb-1">ถึงวันที่ (จบ)</span>
                                                <select
                                                    value={routineEndDay}
                                                    onChange={e => setRoutineEndDay(parseInt(e.target.value, 10))}
                                                    className="w-full px-3 py-2 rounded-xl border border-fuchsia-200 bg-white font-bold text-sm text-fuchsia-950 focus:outline-none focus:ring-2 focus:ring-fuchsia-400"
                                                >
                                                    {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                                                        <option key={day} value={day} disabled={day < routineStartDay}>
                                                            วันที่ {day}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                        <p className="text-[11px] text-fuchsia-800/80 italic pt-1">
                                            💡 จะแสดงเป็นแถบ multi-day ลากยาวตั้งแต่วันที่ {routineStartDay} ถึง {routineEndDay} ในทุกๆ เดือนอัตโนมัติ
                                        </p>
                                    </div>
                                )}

                                {/* Time Selection using TimePickerModal */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                                        <Clock className="w-3.5 h-3.5 text-fuchsia-500" />
                                        เวลาที่นัดหมาย
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => setIsTimePickerOpen(true)}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 hover:border-fuchsia-300 hover:bg-fuchsia-50/10 text-left text-sm font-semibold text-gray-800 transition-all flex items-center justify-between"
                                    >
                                        <span>{scheduledTime ? `${scheduledTime} น.` : 'เลือกเวลา'}</span>
                                        <Clock className="w-4 h-4 text-fuchsia-400" />
                                    </button>
                                </div>

                                {/* Description */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                                        <AlignLeft className="w-3.5 h-3.5 text-fuchsia-500" />
                                        รายละเอียดของแพลนงาน
                                    </label>
                                    <textarea
                                        rows={3}
                                        placeholder="รายละเอียดเพิ่มเติม สถานที่ หรือลิงก์ที่เกี่ยวข้อง..."
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/20 focus:border-fuchsia-500 text-sm text-gray-700 transition-all placeholder:text-gray-300 resize-none"
                                    />
                                </div>

                                {/* Assignees (When in SHARED mode) */}
                                {privacyMode === 'SHARED' && (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                                                <Users className="w-3.5 h-3.5 text-fuchsia-500" />
                                                เลือกสมาชิกที่ร่วมแพลน
                                            </label>
                                            <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                                                เลือกแล้ว {assigneeIds.length} คน
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-1 border border-gray-100 rounded-xl bg-gray-50/50 scrollbar-thin">
                                            {activeUsers.map(user => {
                                                const isSelected = assigneeIds.includes(user.id);
                                                const isMe = currentUser?.id === user.id;
                                                return (
                                                    <button
                                                        type="button"
                                                        key={user.id}
                                                        onClick={() => toggleAssignee(user.id)}
                                                        className={`
                                                            flex items-center gap-2 p-2 rounded-lg border text-left transition-all active:scale-[0.98]
                                                            ${isSelected 
                                                                ? 'bg-fuchsia-50/70 border-fuchsia-200 text-fuchsia-900 font-bold shadow-sm' 
                                                                : 'bg-white border-gray-100 text-gray-600 hover:bg-gray-50'
                                                            }
                                                        `}
                                                    >
                                                        <img 
                                                            src={user.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.name}`} 
                                                            alt={user.name} 
                                                            className="w-6 h-6 rounded-full border border-gray-200 object-cover shrink-0"
                                                            referrerPolicy="no-referrer"
                                                        />
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-xs truncate font-semibold">
                                                                {user.name} {isMe && '(ฉัน)'}
                                                            </p>
                                                        </div>
                                                        {isSelected && <Check className="w-3.5 h-3.5 text-fuchsia-600 shrink-0" />}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Footer Actions */}
                                <div className="pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3 shrink-0">
                                    <div className="flex items-center gap-2">
                                        {initialData && onDelete && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    onDelete(initialData.id);
                                                    onClose();
                                                }}
                                                className="px-3.5 py-2.5 text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 font-medium rounded-xl text-xs sm:text-sm flex items-center gap-1.5 transition-colors active:scale-[0.98]"
                                                title="ลบแพลนนี้ออกจากระบบทั้งหมด"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                <span>ลบแพลน</span>
                                            </button>
                                        )}

                                        {/* Step 3: Opt-out (ถอนตัวออกจากนัดหมาย) button */}
                                        {canOptOut && (
                                            <button
                                                type="button"
                                                disabled={isOptingOut}
                                                onClick={handleOptOut}
                                                className="px-3.5 py-2.5 text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200/60 font-semibold rounded-xl text-xs sm:text-sm flex items-center gap-1.5 transition-colors active:scale-[0.98]"
                                                title="ถอนตัวออกจากนัดหมายนี้ (นำชื่อคุณออก โดยไม่ลบรายการของคนอื่น)"
                                            >
                                                <UserMinus className="w-4 h-4 text-amber-600" />
                                                <span>ถอนตัวออกจากนัด</span>
                                            </button>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2 ml-auto w-full sm:w-auto">
                                        <button
                                            type="button"
                                            onClick={onClose}
                                            className="flex-1 sm:flex-initial px-5 py-2.5 text-gray-500 hover:text-gray-700 font-medium hover:bg-gray-100 rounded-xl text-sm transition-colors active:scale-[0.98]"
                                        >
                                            ยกเลิก
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isSaving || !title.trim()}
                                            className="flex-1 sm:flex-initial px-6 py-2.5 bg-fuchsia-600 hover:bg-fuchsia-700 disabled:opacity-50 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-fuchsia-100 active:scale-[0.98]"
                                        >
                                            บันทึกแพลน
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Start / End Date Pickers */}
            <DatePickerModal
                isOpen={activeDatePicker === 'START'}
                onClose={() => setActiveDatePicker(null)}
                selectedDate={startDate || undefined}
                onSelect={(newDate) => {
                    setStartDate(newDate);
                    if (endDate && newDate > endDate) {
                        setEndDate(newDate);
                    }
                    setActiveDatePicker(null);
                }}
            />

            <DatePickerModal
                isOpen={activeDatePicker === 'END'}
                onClose={() => setActiveDatePicker(null)}
                selectedDate={endDate || undefined}
                onSelect={(newDate) => {
                    setEndDate(newDate);
                    if (startDate && newDate < startDate) {
                        setStartDate(newDate);
                    }
                    setActiveDatePicker(null);
                }}
            />

            {/* Custom TimePickerModal Integration */}
            <TimePickerModal
                isOpen={isTimePickerOpen}
                onClose={() => setIsTimePickerOpen(false)}
                initialTime={scheduledTime}
                onSelect={(newTime) => {
                    setScheduledTime(newTime);
                    setIsTimePickerOpen(false);
                }}
            />
        </>,
        document.body
    );
};

export default PlanFormModal;

