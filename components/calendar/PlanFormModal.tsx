import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, Clock, AlignLeft, Users, Trash2, Check, Sparkles } from 'lucide-react';
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
    const [selectedPlanDate, setSelectedPlanDate] = useState<Date | null>(date);
    const [status, setStatus] = useState<Status>('TODO');
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
    const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Populate data when editing
    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setTitle(initialData.title || '');
                setDescription(initialData.description || '');
                setScheduledTime(initialData.scheduledTime || '10:00');
                setAssigneeIds(initialData.assigneeIds || []);
                setSelectedPlanDate(initialData.startDate ? new Date(initialData.startDate) : date);
                setStatus(initialData.status || 'TODO');
            } else {
                setTitle('');
                setDescription('');
                setScheduledTime('10:00');
                setAssigneeIds(currentUser ? [currentUser.id] : []);
                setSelectedPlanDate(date);
                setStatus('TODO');
            }
        }
    }, [isOpen, initialData, currentUser, date]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !selectedPlanDate) return;

        setIsSaving(true);
        try {
            const planData: Task = {
                id: initialData?.id || crypto.randomUUID(),
                type: 'PLAN',
                title: title.trim(),
                description: description.trim(),
                status,
                startDate: selectedPlanDate,
                endDate: selectedPlanDate,
                scheduledTime,
                assigneeIds,
                tags: ['#แพลนงาน'],
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
                {isOpen && selectedPlanDate && (
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
                            className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]" 
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="bg-fuchsia-50/50 px-6 py-4 border-b border-fuchsia-100/50 flex justify-between items-center shrink-0">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 bg-fuchsia-100 text-fuchsia-600 rounded-xl">
                                        <Sparkles className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-fuchsia-950 text-base">
                                            {initialData ? 'แก้ไขแพลน / นัดหมาย' : 'สร้างแพลน / นัดหมายใหม่'}
                                        </h3>
                                        <p className="text-xs text-fuchsia-700/80 font-bold mt-0.5">
                                            ประจำวันที่ {format(selectedPlanDate, 'd MMM yyyy')}
                                        </p>
                                    </div>
                                </div>
                                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-100 rounded-full transition-all">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Form Body */}
                            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-5">
                                {/* Title */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                                        <Calendar className="w-3.5 h-3.5 text-fuchsia-500" />
                                        หัวข้อนัดหมาย / แพลนการทำงาน
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="เช่น นัดสัมภาษณ์ฝึกงาน, ถ่ายคลิปลูกค้า..."
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

                                {/* Date Selection using DatePickerModal */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                                        <Calendar className="w-3.5 h-3.5 text-fuchsia-500" />
                                        วันที่จัดนัดหมาย
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => setIsDatePickerOpen(true)}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 hover:border-fuchsia-300 hover:bg-fuchsia-50/10 text-left text-sm font-semibold text-gray-800 transition-all flex items-center justify-between"
                                    >
                                        <span>{selectedPlanDate ? formatDisplayDate(selectedPlanDate) : 'เลือกวันที่'}</span>
                                        <Calendar className="w-4 h-4 text-fuchsia-400" />
                                    </button>
                                </div>

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

                                {/* Assignees (Multi-select Grid) */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                                        <Users className="w-3.5 h-3.5 text-fuchsia-500" />
                                        ผู้ร่วมแพลนงาน / ผู้เกี่ยวข้อง
                                    </label>
                                    <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1 border border-gray-100 rounded-xl bg-gray-50/50 scrollbar-thin">
                                        {activeUsers.map(user => {
                                            const isSelected = assigneeIds.includes(user.id);
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
                                                        <p className="text-xs truncate font-semibold">{user.name}</p>
                                                    </div>
                                                    {isSelected && <Check className="w-3.5 h-3.5 text-fuchsia-600 shrink-0" />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Footer Actions */}
                                <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-3 shrink-0">
                                    {initialData && onDelete && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                onDelete(initialData.id);
                                                onClose();
                                            }}
                                            className="px-4 py-2.5 text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 font-medium rounded-xl text-sm flex items-center gap-1.5 transition-colors active:scale-[0.98]"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            ลบแพลน
                                        </button>
                                    )}
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
                                            className="flex-1 sm:flex-initial px-6 py-2.5 bg-fuchsia-600 hover:bg-fuchsia-700 disabled:opacity-50 text-white font-medium rounded-xl text-sm flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-fuchsia-100 active:scale-[0.98]"
                                        >
                                            บันทึก
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Custom DatePickerModal Integration */}
            <DatePickerModal
                isOpen={isDatePickerOpen}
                onClose={() => setIsDatePickerOpen(false)}
                selectedDate={selectedPlanDate || undefined}
                onSelect={(newDate) => setSelectedPlanDate(newDate)}
            />

            {/* Custom TimePickerModal Integration */}
            <TimePickerModal
                isOpen={isTimePickerOpen}
                onClose={() => setIsTimePickerOpen(false)}
                initialTime={scheduledTime}
                onSelect={(newTime) => setScheduledTime(newTime)}
            />
        </>,
        document.body
    );
};

export default PlanFormModal;
