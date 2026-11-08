import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar as CalendarIcon, Send, Loader2, Hourglass, TrendingUp, ChevronDown, Check, UserCheck } from 'lucide-react';
import DatePickerModal, { formatDisplayDate } from '../ui/DatePickerModal';
import { User, MasterOption } from '../../types';

interface GoalDeadlineExtensionModalProps {
    isOpen: boolean;
    onClose: () => void;
    goalId: string;
    goalTitle: string;
    currentDeadline: Date;
    onRequestExtension: (goalId: string, newDate: string, reason: string, approverId?: string) => Promise<boolean>;
    currentValue?: number;
    targetValue?: number;
    unit?: string;
    users?: User[];
    masterOptions?: MasterOption[];
    currentUser?: User;
}

const GoalDeadlineExtensionModal: React.FC<GoalDeadlineExtensionModalProps> = ({ 
    isOpen, 
    onClose, 
    goalId, 
    goalTitle, 
    currentDeadline, 
    onRequestExtension, 
    currentValue, 
    targetValue, 
    unit,
    users = [],
    masterOptions = [],
    currentUser
}) => {
    const currentDeadlineDate = new Date(currentDeadline);
    const currentEndDateStr = currentDeadlineDate.toISOString().split('T')[0];

    // Compute minimum selectable date (must be at least 1 day after the current deadline)
    const minSelectableDate = new Date(currentDeadlineDate);
    minSelectableDate.setDate(minSelectableDate.getDate() + 1);
    const minSelectableDateStr = minSelectableDate.toISOString().split('T')[0];

    const [newDate, setNewDate] = useState(minSelectableDateStr);
    const [reason, setReason] = useState('');
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedApproverId, setSelectedApproverId] = useState<string>('');
    const [isApproverDropdownOpen, setIsApproverDropdownOpen] = useState(false);

    // Candidates calculation following QC resolver rules
    const candidates = useMemo(() => {
        if (!users || users.length === 0) return [];
        const userPos = currentUser?.position || '';
        const userPosOpt = masterOptions.find(o => 
            o.type === 'POSITION' && 
            (o.label.toLowerCase().trim() === userPos.toLowerCase().trim() || 
             o.key.toLowerCase().trim() === userPos.toLowerCase().trim())
        );

        let parentUsers: User[] = [];
        if (userPosOpt && userPosOpt.parentKey) {
            const parentPosOpt = masterOptions.find(o => 
                o.type === 'POSITION' && 
                o.key === userPosOpt.parentKey
            );
            if (parentPosOpt) {
                parentUsers = users.filter(u => 
                    u.isActive && 
                    u.id !== currentUser?.id &&
                    (u.position?.toLowerCase().trim() === parentPosOpt?.label.toLowerCase().trim() || 
                     u.position?.toLowerCase().trim() === parentPosOpt?.key.toLowerCase().trim())
                );
            }
        }

        const adminsAndManagers = users.filter(u => 
            u.isActive && 
            u.id !== currentUser?.id && (
                u.role === 'ADMIN' || 
                u.position?.toLowerCase().includes('qc') || 
                u.position?.toLowerCase().includes('manager') || 
                u.position?.toLowerCase().includes('director') || 
                u.position?.toLowerCase().includes('head') || 
                u.position?.toLowerCase().includes('senior') ||
                u.position?.toLowerCase().includes('หัวหน้า') ||
                u.position?.toLowerCase().includes('ผู้ตรวจ')
            )
        );

        const combinedMap = new Map<string, User>();
        parentUsers.forEach(u => combinedMap.set(u.id, u));
        adminsAndManagers.forEach(u => combinedMap.set(u.id, u));
        return Array.from(combinedMap.values());
    }, [users, masterOptions, currentUser]);

    useEffect(() => {
        if (isOpen && candidates.length > 0 && !selectedApproverId) {
            setSelectedApproverId(candidates[0].id);
        }
    }, [isOpen, candidates, selectedApproverId]);

    const selectedApprover = users.find(u => u.id === selectedApproverId);

    // Remaining time calculations
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentDeadlineDateZeroed = new Date(currentDeadlineDate);
    currentDeadlineDateZeroed.setHours(0, 0, 0, 0);

    const remainingTime = currentDeadlineDateZeroed.getTime() - today.getTime();
    const remainingDays = Math.ceil(remainingTime / (1000 * 60 * 60 * 24));

    let remainingBadgeColor = 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    let remainingText = '';
    if (remainingDays > 0) {
        remainingText = `เหลือเวลาอีก ${remainingDays} วัน`;
        if (remainingDays <= 3) {
            remainingBadgeColor = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
        } else if (remainingDays <= 7) {
            remainingBadgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
        } else {
            remainingBadgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
        }
    } else if (remainingDays === 0) {
        remainingText = 'ครบกำหนดวันนี้';
        remainingBadgeColor = 'bg-rose-500/20 text-rose-400 border-rose-500/30 animate-pulse';
    } else {
        remainingText = `เลยกำหนดมาแล้ว ${Math.abs(remainingDays)} วัน`;
        remainingBadgeColor = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    }

    // Delta days calculation
    const targetDate = new Date(newDate);
    targetDate.setHours(0, 0, 0, 0);
    const deltaDays = Math.round((targetDate.getTime() - currentDeadlineDateZeroed.getTime()) / (1000 * 60 * 60 * 24));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newDate || !reason.trim() || isSubmitting) return;
        
        setIsSubmitting(true);
        const success = await onRequestExtension(goalId, newDate, reason, selectedApproverId || undefined);
        setIsSubmitting(false);
        if (success) {
            onClose();
        }
    };

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[11000] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
                    />

                    {/* Modal Card */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 15 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 15 }}
                        transition={{ type: "spring", damping: 25, stiffness: 350 }}
                        className="relative bg-slate-900/90 backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-2xl shadow-black/80 w-full max-w-md overflow-hidden flex flex-col z-10"
                    >
                        {/* Glow Accent Header Line */}
                        <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-80 shrink-0"></div>

                        {/* Header */}
                        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02] shrink-0 text-left">
                            <div>
                                <h3 className="text-xl font-black text-white tracking-tight italic uppercase flex items-center gap-2">
                                    <Hourglass className="w-5 h-5 text-indigo-400" /> ขอขยายเวลาเดดไลน์
                                </h3>
                                <p className="text-[11px] text-indigo-400 font-bold tracking-wider uppercase italic mt-1 line-clamp-1 max-w-[320px]">
                                    เป้าหมาย: {goalTitle}
                                </p>
                            </div>
                            <button 
                                type="button" 
                                onClick={onClose} 
                                disabled={isSubmitting} 
                                className="p-2 bg-white/5 hover:bg-rose-500/20 rounded-xl text-gray-400 hover:text-rose-400 transition-all disabled:opacity-50 shrink-0"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-left overflow-y-auto max-h-[calc(90vh-100px)]">
                            {/* Context Info (Current Progress & Remaining Time) */}
                            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 space-y-3 shadow-inner">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">เดดไลน์ปัจจุบัน</span>
                                    <span className="text-xs font-bold text-white">{formatDisplayDate(currentEndDateStr)}</span>
                                </div>
                                
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">สถานะเวลา</span>
                                    <span className={`text-xs px-2.5 py-0.5 rounded-lg font-bold border ${remainingBadgeColor}`}>
                                        {remainingText}
                                    </span>
                                </div>

                                {currentValue !== undefined && targetValue !== undefined && (
                                    <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">ความคืบหน้า</span>
                                        <span className="text-xs font-bold text-indigo-400 flex items-center gap-1">
                                            <TrendingUp className="w-3.5 h-3.5" />
                                            {currentValue.toLocaleString()} / {targetValue.toLocaleString()} {unit || ''} ({Math.min(100, Math.round((currentValue / targetValue) * 100))}%)
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Approver Selection */}
                            {candidates.length > 0 && (
                                <div className="space-y-1.5">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider ml-1 flex items-center justify-between">
                                        <span>หัวหน้า/ผู้อนุมัติ (Approver)</span>
                                        <span className="text-[10px] text-indigo-400 font-bold lowercase">ส่งคำขอถึงเฉพาะท่านนี้</span>
                                    </label>
                                    
                                    <div className="relative">
                                        <button
                                            type="button"
                                            onClick={() => setIsApproverDropdownOpen(!isApproverDropdownOpen)}
                                            className="w-full p-2.5 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between hover:bg-white/10 transition-all text-left"
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                {selectedApprover?.avatarUrl ? (
                                                    <img 
                                                        src={selectedApprover.avatarUrl} 
                                                        alt={selectedApprover.name}
                                                        className="w-8 h-8 rounded-full object-cover border border-white/20 shrink-0" 
                                                    />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 font-bold text-xs flex items-center justify-center shrink-0">
                                                        {selectedApprover?.name?.charAt(0) || 'ผ'}
                                                    </div>
                                                )}
                                                <div className="min-w-0">
                                                    <p className="text-xs font-bold text-white truncate">
                                                        {selectedApprover?.name || 'เลือกหัวหน้าผู้อนุมัติ'}
                                                    </p>
                                                    <p className="text-[10px] text-indigo-400 truncate">
                                                        {selectedApprover?.position || (selectedApprover?.role === 'ADMIN' ? 'Admin' : 'หัวหน้าสายงาน')}
                                                    </p>
                                                </div>
                                            </div>
                                            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform shrink-0 ${isApproverDropdownOpen ? 'rotate-180' : ''}`} />
                                        </button>

                                        {isApproverDropdownOpen && (
                                            <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl z-30 max-h-48 overflow-y-auto p-1.5 space-y-1 backdrop-blur-xl">
                                                {candidates.map((cand) => (
                                                    <button
                                                        key={cand.id}
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedApproverId(cand.id);
                                                            setIsApproverDropdownOpen(false);
                                                        }}
                                                        className={`w-full p-2 rounded-xl flex items-center justify-between text-left transition-colors ${
                                                            selectedApproverId === cand.id ? 'bg-indigo-600/20 text-white font-bold border border-indigo-500/30' : 'hover:bg-white/5 text-gray-300'
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-2 min-w-0">
                                                            {cand.avatarUrl ? (
                                                                <img src={cand.avatarUrl} alt={cand.name} className="w-6 h-6 rounded-full object-cover shrink-0" />
                                                            ) : (
                                                                <div className="w-6 h-6 rounded-full bg-white/10 text-gray-300 text-[10px] font-bold flex items-center justify-center shrink-0">
                                                                    {cand.name.charAt(0)}
                                                                </div>
                                                            )}
                                                            <span className="text-xs truncate text-white">{cand.name}</span>
                                                            <span className="text-[10px] text-gray-400">({cand.position || cand.role})</span>
                                                        </div>
                                                        {selectedApproverId === cand.id && (
                                                            <Check className="w-4 h-4 text-indigo-400 shrink-0" />
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* New Date Selector */}
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider ml-1">
                                    กำหนดวันส่งใหม่ (New Deadline)
                                </label>
                                <div className="relative">
                                    <button 
                                        type="button" 
                                        onClick={() => setIsDatePickerOpen(true)}
                                        disabled={isSubmitting}
                                        className="w-full pl-5 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-white hover:bg-white/10 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-left flex items-center justify-between disabled:opacity-50 shadow-inner"
                                    >
                                        <span>{formatDisplayDate(newDate)}</span>
                                        <CalendarIcon className="w-5 h-5 text-indigo-400" />
                                    </button>
                                </div>
                                
                                {deltaDays > 0 && (
                                    <div className="flex items-center gap-2 mt-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                                        <span className="text-[11px] font-bold px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg flex items-center gap-1">
                                            ขยายเวลาเพิ่มอีก +{deltaDays} วัน
                                        </span>
                                        <span className="text-[10px] text-gray-400 font-medium italic">
                                            (จากกำหนดส่งเดิม)
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Reason Input */}
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider ml-1">
                                    เหตุผลและความจำเป็น (Reason)
                                </label>
                                <textarea 
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    disabled={isSubmitting}
                                    placeholder="กรุณาอธิบายเหตุผลความจำเป็นที่ต้องขอขยายเวลาเพิ่มเติม..."
                                    className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-gray-500 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all resize-none h-28 disabled:opacity-50 shadow-inner"
                                    required
                                />
                            </div>

                            {/* Action Buttons */}
                            <div className="pt-4 flex gap-3">
                                <button 
                                    type="button" 
                                    onClick={onClose}
                                    disabled={isSubmitting}
                                    className="flex-1 px-5 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white hover:text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-50 uppercase tracking-wider"
                                >
                                    ยกเลิก
                                </button>
                                <button 
                                    type="submit"
                                    disabled={!newDate || !reason.trim() || newDate <= currentEndDateStr || isSubmitting}
                                    className="flex-1 px-5 py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:from-indigo-900 disabled:to-indigo-950 disabled:text-white/30 disabled:border-white/5 border border-indigo-500/30 text-white text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/30 disabled:cursor-not-allowed uppercase tracking-wider"
                                >
                                    {isSubmitting ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Send className="w-4 h-4" />
                                    )}
                                    {isSubmitting ? 'กำลังส่ง...' : 'ส่งคำขอขยายเวลา'}
                                </button>
                            </div>
                        </form>
                    </motion.div>

                    {/* Nested DatePicker */}
                    <DatePickerModal
                        isOpen={isDatePickerOpen}
                        onClose={() => setIsDatePickerOpen(false)}
                        selectedDate={newDate ? new Date(newDate) : undefined}
                        minDate={minSelectableDate}
                        onSelect={(date) => {
                            if (date) {
                                setNewDate(date.toISOString().split('T')[0]);
                            }
                        }}
                    />
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default GoalDeadlineExtensionModal;
