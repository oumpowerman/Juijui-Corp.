import React, { useState, useEffect, useMemo } from 'react';
import { X, Calendar as CalendarIcon, Send, ChevronDown, Check, Loader2, Trash2, Clock } from 'lucide-react';
import BaseModal from '../../common/BaseModal';
import DatePickerModal, { formatDisplayDate } from '../../ui/DatePickerModal';
import { User, MasterOption, DeadlineRequest } from '../../../types';
import { addLocalDaysYMD, getCalendarDayDiff, parseLocalYMD, toLocalYMD } from '../../../utils/dateUtils';

interface DeadlineExtensionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (newDate: string, reason: string, approverId?: string) => Promise<void> | void;
    onUpdate?: (requestId: string, newDate: string, reason: string, approverId?: string) => Promise<void> | void;
    onCancelRequest?: (requestId: string) => Promise<void> | void;
    existingRequest?: DeadlineRequest | null;
    isSubmitting?: boolean;
    currentEndDate: string;
    users?: User[];
    masterOptions?: MasterOption[];
    currentUser?: User;
}

const DeadlineExtensionModal: React.FC<DeadlineExtensionModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    onUpdate,
    onCancelRequest,
    existingRequest,
    isSubmitting = false,
    currentEndDate,
    users = [],
    currentUser
}) => {
    const isEditMode = Boolean(existingRequest);
    const defaultSuggestedDate = useMemo(
        () => (currentEndDate ? addLocalDaysYMD(currentEndDate, 1) : toLocalYMD(new Date())),
        [currentEndDate]
    );

    const [newDate, setNewDate] = useState(defaultSuggestedDate);
    const [reason, setReason] = useState('');
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
    const [selectedApproverId, setSelectedApproverId] = useState<string>('');
    const [isApproverDropdownOpen, setIsApproverDropdownOpen] = useState(false);

    // Filter strictly to active ADMIN users so requests never stall on non-Admin members
    const adminCandidates = useMemo(() => {
        if (!users || users.length === 0) return [];
        return users.filter(
            (u) =>
                u.isActive &&
                u.role === 'ADMIN' &&
                u.id !== currentUser?.id
        );
    }, [users, currentUser?.id]);

    // Reset or pre-fill modal state whenever opened
    useEffect(() => {
        if (!isOpen) {
            setIsApproverDropdownOpen(false);
            return;
        }
        if (existingRequest) {
            setNewDate(toLocalYMD(existingRequest.newDeadline) || defaultSuggestedDate);
            setReason(existingRequest.reason || '');
            setSelectedApproverId(
                existingRequest.approverId && adminCandidates.some((c) => c.id === existingRequest.approverId)
                    ? existingRequest.approverId
                    : adminCandidates[0]?.id || ''
            );
        } else {
            setNewDate(defaultSuggestedDate);
            setReason('');
            setSelectedApproverId(adminCandidates[0]?.id || '');
        }
    }, [isOpen, existingRequest, defaultSuggestedDate, adminCandidates]);

    const selectedApprover = adminCandidates.find((u) => u.id === selectedApproverId);
    const minSelectableDate = useMemo(() => {
        const minStr = currentEndDate ? addLocalDaysYMD(currentEndDate, 1) : '';
        return parseLocalYMD(minStr);
    }, [currentEndDate]);

    const deltaDays = useMemo(
        () => getCalendarDayDiff(currentEndDate, newDate),
        [currentEndDate, newDate]
    );

    const isDateValid = Boolean(newDate && currentEndDate && newDate > currentEndDate);
    const canSubmit = Boolean(!isSubmitting && isDateValid && reason.trim().length > 0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSubmit) return;
        if (isEditMode && existingRequest && onUpdate) {
            await onUpdate(existingRequest.id, newDate, reason.trim(), selectedApproverId || undefined);
        } else {
            await onSubmit(newDate, reason.trim(), selectedApproverId || undefined);
        }
    };

    const handleCancelExisting = async () => {
        if (!existingRequest || !onCancelRequest || isSubmitting) return;
        await onCancelRequest(existingRequest.id);
    };

    return (
        <>
            <BaseModal
                isOpen={isOpen}
                onClose={onClose}
                closeOnBackdropClick={!isSubmitting}
                closeOnEscape={!isSubmitting}
                zIndex={11000}
                windowClassName="bg-white w-full max-w-md max-h-[92vh] sm:max-h-[85vh] flex flex-col rounded-t-[2rem] sm:rounded-3xl border border-slate-200/80 shadow-2xl overflow-hidden"
            >
                {/* 1. Rigid Header */}
                <div className="flex-shrink-0 px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-indigo-50/80 via-white to-rose-50/40">
                    <div className="min-w-0 pr-2 text-left">
                        <div className="flex items-center gap-2">
                            <h3 className="text-base sm:text-lg font-bold text-slate-800 truncate">
                                {isEditMode ? 'แก้ไขคำขอเลื่อนกำหนดส่ง' : 'ขอเลื่อนกำหนดส่งงาน'}
                            </h3>
                            {isEditMode && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 rounded-full shrink-0">
                                    <Clock className="w-3 h-3" />
                                    รออนุมัติ
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                            {isEditMode
                                ? 'ปรับเปลี่ยนวันที่ เหตุผล หรือยกเลิกคำขอเดิมได้ก่อน Admin พิจารณา'
                                : 'ระบุวันที่ต้องการเลื่อน เหตุผล และเลือก Admin ที่ต้องการส่งคำขอ'}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="p-2 -mr-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl min-w-[40px] min-h-[40px] flex items-center justify-center transition-colors disabled:opacity-50"
                        aria-label="ปิดหน้าต่าง"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* 2. Scrollable Body */}
                <form id="deadline-extension-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto overscroll-contain px-5 sm:px-6 py-4 space-y-4 text-left">
                    {/* Current Deadline Summary */}
                    <div className="bg-slate-50/80 border border-slate-200/70 rounded-2xl px-4 py-3 flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-500">กำหนดส่งปัจจุบัน</span>
                        <span className="font-bold text-slate-800 tabular-nums">
                            {formatDisplayDate(currentEndDate)}
                        </span>
                    </div>

                    {/* Approver Selection (Active Admins Only) */}
                    {adminCandidates.length > 0 && (
                        <div className="space-y-1.5">
                            <label className="flex items-center justify-between text-xs font-semibold text-slate-600">
                                <span>ส่งคำขอถึง Admin</span>
                                <span className="text-[11px] text-indigo-600 font-medium">Admin ท่านอื่นสามารถพิจารณาแทนได้</span>
                            </label>

                            <div className="relative">
                                <button
                                    type="button"
                                    disabled={isSubmitting}
                                    onClick={() => setIsApproverDropdownOpen(!isApproverDropdownOpen)}
                                    className="w-full p-2.5 bg-indigo-50/40 border border-indigo-200/80 rounded-2xl flex items-center justify-between hover:bg-indigo-50/70 transition-all text-left disabled:opacity-60"
                                >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        {selectedApprover?.avatarUrl ? (
                                            <img
                                                src={selectedApprover.avatarUrl}
                                                alt={selectedApprover.name}
                                                referrerPolicy="no-referrer"
                                                className="w-8 h-8 rounded-full object-cover border border-indigo-200 shrink-0"
                                            />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">
                                                {selectedApprover?.name?.charAt(0) || 'A'}
                                            </div>
                                        )}
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold text-slate-800 truncate">
                                                {selectedApprover?.name || 'เลือก Admin ผู้อนุมัติ'}
                                            </p>
                                            <p className="text-[11px] text-indigo-600 truncate">
                                                {selectedApprover?.position || 'ผู้ดูแลระบบ (Admin)'}
                                            </p>
                                        </div>
                                    </div>
                                    <ChevronDown className={`w-4 h-4 text-indigo-400 transition-transform shrink-0 ${isApproverDropdownOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {isApproverDropdownOpen && (
                                    <div className="mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-lg max-h-44 overflow-y-auto p-1.5 space-y-1">
                                        {adminCandidates.map((cand) => (
                                            <button
                                                key={cand.id}
                                                type="button"
                                                onClick={() => {
                                                    setSelectedApproverId(cand.id);
                                                    setIsApproverDropdownOpen(false);
                                                }}
                                                className={`w-full p-2 rounded-xl flex items-center justify-between text-left transition-colors ${
                                                    selectedApproverId === cand.id
                                                        ? 'bg-indigo-50 text-indigo-900 font-bold'
                                                        : 'hover:bg-slate-50 text-slate-700'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2 min-w-0">
                                                    {cand.avatarUrl ? (
                                                        <img
                                                            src={cand.avatarUrl}
                                                            alt={cand.name}
                                                            referrerPolicy="no-referrer"
                                                            className="w-6 h-6 rounded-full object-cover shrink-0"
                                                        />
                                                    ) : (
                                                        <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold flex items-center justify-center shrink-0">
                                                            {cand.name.charAt(0)}
                                                        </div>
                                                    )}
                                                    <span className="text-xs truncate">{cand.name}</span>
                                                    <span className="text-[11px] text-slate-400 truncate">
                                                        ({cand.position || 'Admin'})
                                                    </span>
                                                </div>
                                                {selectedApproverId === cand.id && (
                                                    <Check className="w-4 h-4 text-indigo-600 shrink-0" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* New Date Selector */}
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <label className="block text-xs font-semibold text-slate-600">วันที่ต้องการเลื่อนไป</label>
                            {deltaDays > 0 && (
                                <span className="text-[11px] font-semibold text-indigo-600 tabular-nums">
                                    เลื่อนเพิ่ม +{deltaDays} วัน
                                </span>
                            )}
                        </div>
                        <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={() => setIsDatePickerOpen(true)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 hover:bg-white hover:border-indigo-300 outline-none transition-all text-left flex items-center justify-between disabled:opacity-60"
                        >
                            <span className="tabular-nums">{formatDisplayDate(newDate)}</span>
                            <CalendarIcon className="w-4 h-4 text-indigo-500 shrink-0" />
                        </button>
                        {!isDateValid && (
                            <p className="text-[11px] text-rose-600 font-medium">
                                กรุณาเลือกวันใหม่ที่อยู่หลังกำหนดส่งปัจจุบัน
                            </p>
                        )}
                    </div>

                    {/* Reason Input */}
                    <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-slate-600">เหตุผลความจำเป็น</label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            disabled={isSubmitting}
                            placeholder="อธิบายสาเหตุหรือภาระงานที่ต้องขอเลื่อน..."
                            className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none transition-all resize-none h-24 disabled:opacity-60"
                            required
                        />
                    </div>
                </form>

                {/* 3. Rigid Sticky Footer */}
                <div className="flex-shrink-0 px-5 sm:px-6 py-3.5 bg-slate-50/90 border-t border-slate-100 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
                    {isEditMode && onCancelRequest ? (
                        <button
                            type="button"
                            onClick={handleCancelExisting}
                            disabled={isSubmitting}
                            className="w-full sm:w-auto px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            ยกเลิกคำขอเดิม
                        </button>
                    ) : (
                        <div className="hidden sm:block" />
                    )}

                    <div className="flex flex-col-reverse sm:flex-row gap-2 w-full sm:w-auto">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="w-full sm:w-auto px-4 py-2.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
                        >
                            ปิด
                        </button>
                        <button
                            type="submit"
                            form="deadline-extension-form"
                            disabled={!canSubmit}
                            className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
                        >
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            {isSubmitting ? 'กำลังบันทึก...' : isEditMode ? 'บันทึกการแก้ไข' : 'ส่งคำขอเลื่อน'}
                        </button>
                    </div>
                </div>
            </BaseModal>

            <DatePickerModal
                isOpen={isDatePickerOpen}
                onClose={() => setIsDatePickerOpen(false)}
                selectedDate={parseLocalYMD(newDate)}
                minDate={minSelectableDate}
                onSelect={(date) => {
                    const ymd = toLocalYMD(date);
                    if (ymd) setNewDate(ymd);
                }}
            />
        </>
    );
};

export default DeadlineExtensionModal;
