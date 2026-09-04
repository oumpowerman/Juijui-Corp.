import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    Check,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    User as UserIcon,
    Calendar,
    Clock,
    FileText,
    Tag
} from 'lucide-react';
import { ParsedLeaveItemPreview, LEAVE_TYPE_MAP } from '../../../../../services/leaveImportValidator';
import { User } from '../../../../../types';
import { revalidateLeaveItem } from './revalidateLeaveItem';

interface LeaveItemEditModalProps {
    isOpen: boolean;
    item: ParsedLeaveItemPreview | null;
    allUsers: User[];
    onClose: () => void;
    onSave: (updatedItem: ParsedLeaveItemPreview) => void;
}

export const LeaveItemEditModal: React.FC<LeaveItemEditModalProps> = ({
    isOpen,
    item,
    allUsers,
    onClose,
    onSave
}) => {
    const [userId, setUserId] = useState<string>('');
    const [leaveType, setLeaveType] = useState<string>('SICK');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [isHalfDay, setIsHalfDay] = useState<boolean>(false);
    const [halfDaySession, setHalfDaySession] = useState<'AM' | 'PM'>('AM');
    const [reason, setReason] = useState<string>('');

    // Initialize state when item changes
    useEffect(() => {
        if (!item) return;
        setUserId(item.userId || '');
        setLeaveType(item.leaveType || 'SICK');
        setStartDate(item.startDate || '');
        setEndDate(item.endDate || item.startDate || '');
        setIsHalfDay(item.isHalfDay || false);
        setHalfDaySession(item.halfDaySession || 'AM');
        setReason(item.rawReason || item.reason.replace('[MIGRATED] ประวัติการลาย้อนหลัง: ', '') || '');
    }, [item]);

    // Live validation
    const draftValidation = useMemo(() => {
        if (!item) return null;

        const draftItem: ParsedLeaveItemPreview = {
            ...item,
            userId: userId || null,
            leaveType,
            startDate,
            endDate: endDate || startDate,
            startDateObj: startDate ? new Date(startDate) : null,
            endDateObj: (endDate || startDate) ? new Date(endDate || startDate) : null,
            isHalfDay,
            halfDaySession: isHalfDay ? halfDaySession : null,
            reason: reason ? `[MIGRATED] ประวัติการลาย้อนหลัง: ${reason}` : '[MIGRATED] ประวัติการลาย้อนหลัง'
        };

        return revalidateLeaveItem(draftItem, allUsers);
    }, [item, userId, leaveType, startDate, endDate, isHalfDay, halfDaySession, reason, allUsers]);

    const handleSave = () => {
        if (!draftValidation) return;
        onSave(draftValidation);
        onClose();
    };

    if (!isOpen || !item) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[2300] flex items-center justify-center p-3 sm:p-5 font-sans select-none overflow-y-auto">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs cursor-pointer"
                />

                {/* Edit Modal Window */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.94, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.94, y: 15 }}
                    transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                    className="relative bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden z-10 max-h-[90vh]"
                >
                    {/* Header */}
                    <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 via-white to-blue-50/30 shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20 font-black text-sm">
                                #{item.index}
                            </div>
                            <div>
                                <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                                    แก้ไขข้อมูลการลา (Quick Fix)
                                </h4>
                                <p className="text-xs text-slate-500 font-medium">
                                    แถวที่ #{item.index} ในไฟล์ที่นำเข้า
                                </p>
                            </div>
                        </div>

                        {/* Live Validation Indicator */}
                        <div className="flex items-center gap-2">
                            {draftValidation?.isValid ? (
                                <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold shadow-2xs">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                    <span>ข้อมูลผ่านเกณฑ์</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-full text-xs font-bold shadow-2xs">
                                    <XCircle className="w-4 h-4 text-rose-600" />
                                    <span>ยังมีข้อผิดพลาด</span>
                                </div>
                            )}

                            <button
                                type="button"
                                onClick={onClose}
                                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Form Body */}
                    <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
                        {/* Errors & Warnings Notification inside Editor */}
                        {draftValidation && draftValidation.errors.length > 0 && (
                            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl space-y-1">
                                <p className="text-[11px] font-black text-rose-700 flex items-center gap-1.5">
                                    <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                                    <span>สิ่งที่ต้องแก้ไขให้ถูกต้อง:</span>
                                </p>
                                <ul className="list-disc list-inside text-rose-600 text-[11px] font-medium pl-1">
                                    {draftValidation.errors.map((err, idx) => (
                                        <li key={idx}>{err}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {draftValidation && draftValidation.warnings.length > 0 && (
                            <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-2xl space-y-1">
                                <p className="text-[11px] font-black text-amber-800 flex items-center gap-1.5">
                                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                                    <span>ข้อสังเกต:</span>
                                </p>
                                <ul className="list-disc list-inside text-amber-700 text-[11px] font-medium pl-1">
                                    {draftValidation.warnings.map((warn, idx) => (
                                        <li key={idx}>{warn}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* 1. Employee Selector */}
                        <div className="space-y-1.5">
                            <label className="font-bold text-slate-800 flex items-center justify-between">
                                <span className="flex items-center gap-1.5">
                                    <UserIcon className="w-3.5 h-3.5 text-blue-500" />
                                    <span>พนักงาน (Employee)</span>
                                    <span className="text-rose-500 font-black">*</span>
                                </span>
                                {item.rawEmail && (
                                    <span className="text-[10px] text-slate-400 font-normal font-mono">
                                        ค่าเดิม: {item.rawEmail}
                                    </span>
                                )}
                            </label>
                            <select
                                value={userId}
                                onChange={(e) => setUserId(e.target.value)}
                                className={`w-full px-3.5 py-2.5 bg-white rounded-xl border text-xs font-bold outline-none transition-all ${
                                    !userId
                                        ? 'border-rose-300 bg-rose-50/20 focus:ring-2 focus:ring-rose-400'
                                        : 'border-slate-200 text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                                }`}
                            >
                                <option value="">-- กรุณาเลือกพนักงานในระบบ --</option>
                                {allUsers.map((u) => (
                                    <option key={u.id} value={u.id}>
                                        {u.name} ({u.email || 'ไม่มีอีเมล'}) {u.position ? `[${u.position}]` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* 2. Leave Type */}
                        <div className="space-y-1.5">
                            <label className="font-bold text-slate-700 flex items-center gap-1.5">
                                <Tag className="w-3.5 h-3.5 text-blue-500" />
                                <span>ประเภทการลา (Leave Type)</span>
                            </label>
                            <select
                                value={leaveType}
                                onChange={(e) => setLeaveType(e.target.value)}
                                className="w-full px-3.5 py-2 bg-white rounded-xl border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:border-blue-500"
                            >
                                {Object.values(LEAVE_TYPE_MAP).map((t) => (
                                    <option key={t.key} value={t.key}>
                                        {t.label} ({t.key})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* 3. Dates */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {/* Start Date */}
                            <div className="space-y-1.5">
                                <label className="font-bold text-slate-700 flex items-center gap-1">
                                    <Calendar className="w-3.5 h-3.5 text-blue-500" />
                                    <span>วันที่เริ่มต้นลา (Start Date)</span>
                                    <span className="text-rose-500 font-black">*</span>
                                </label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => {
                                        setStartDate(e.target.value);
                                        if (!endDate || endDate < e.target.value) {
                                            setEndDate(e.target.value);
                                        }
                                    }}
                                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:border-blue-500"
                                />
                            </div>

                            {/* End Date */}
                            <div className="space-y-1.5">
                                <label className="font-bold text-slate-700 flex items-center gap-1">
                                    <Calendar className="w-3.5 h-3.5 text-blue-500" />
                                    <span>วันที่สิ้นสุดลา (End Date)</span>
                                    <span className="text-rose-500 font-black">*</span>
                                </label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:border-blue-500"
                                />
                            </div>
                        </div>

                        {/* 4. Half-day Options */}
                        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-2.5">
                            <div className="flex items-center justify-between">
                                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={isHalfDay}
                                        onChange={(e) => setIsHalfDay(e.target.checked)}
                                        className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                                    />
                                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                                    <span>เป็นการลาครึ่งวัน (0.5 วัน)</span>
                                </label>

                                {isHalfDay && (
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setHalfDaySession('AM')}
                                            className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                                                halfDaySession === 'AM'
                                                    ? 'bg-blue-600 text-white shadow-xs'
                                                    : 'bg-white text-slate-600 border border-slate-200'
                                            }`}
                                        >
                                            ช่วงเช้า (AM)
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setHalfDaySession('PM')}
                                            className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                                                halfDaySession === 'PM'
                                                    ? 'bg-blue-600 text-white shadow-xs'
                                                    : 'bg-white text-slate-600 border border-slate-200'
                                            }`}
                                        >
                                            ช่วงบ่าย (PM)
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 5. Reason */}
                        <div className="space-y-1.5">
                            <label className="font-bold text-slate-700 flex items-center gap-1">
                                <FileText className="w-3.5 h-3.5 text-slate-400" />
                                <span>เหตุผลการลา</span>
                            </label>
                            <textarea
                                rows={2}
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="ระบุเหตุผลการลา..."
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none font-medium"
                            />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2.5 shrink-0">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                        >
                            ยกเลิก
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-blue-600/20 active:scale-95"
                        >
                            <Check className="w-4 h-4" />
                            <span>บันทึกและตรวจความถูกต้อง</span>
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
