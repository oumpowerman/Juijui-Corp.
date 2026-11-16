import React, { useState } from 'react';
import { DeadlineRequest, User } from '../../../types';
import { motion, AnimatePresence } from 'framer-motion';
import {
    SlidersHorizontal,
    CalendarDays,
    AlertCircle,
    FileText,
    UserCheck,
    ArrowLeft,
    CheckCircle,
    XCircle,
    Info,
    Loader2
} from 'lucide-react';
import DatePickerModal, { formatDisplayDate } from '../../ui/DatePickerModal';
import { getCalendarDayDiff, parseLocalYMD, toLocalYMD } from '../../../utils/dateUtils';

interface DeadlineRequestsInspectorProps {
    selectedReq: DeadlineRequest | null;
    insights: {
        requester: any;
        activeTasks: any[];
        parentTask: any;
        diffDays: number;
        workloadRank: string;
    } | null;
    customDate: string;
    setCustomDate: (val: string) => void;
    rejectionReason: string;
    setRejectionReason: (val: string) => void;
    isProcessingBatch: boolean;
    rejectionTemplates: string[];
    handleApprove: (req: DeadlineRequest) => void;
    handleReject: (req: DeadlineRequest, reasonText: string) => void;
    setSelectedReq: (req: DeadlineRequest | null) => void;
    currentUser?: User;
    duplicateCount?: number;
}

const DeadlineRequestsInspector: React.FC<DeadlineRequestsInspectorProps> = ({
    selectedReq,
    insights,
    customDate,
    setCustomDate,
    rejectionReason,
    setRejectionReason,
    isProcessingBatch,
    rejectionTemplates,
    handleApprove,
    handleReject,
    setSelectedReq,
    currentUser,
    duplicateCount = 1
}) => {
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

    const originalDeadline = selectedReq?.originalDeadline || insights?.parentTask?.endDate;
    const requestedYmd = selectedReq ? toLocalYMD(selectedReq.newDeadline) : '';
    const isDateModifiedByAdmin = Boolean(selectedReq && customDate && customDate !== requestedYmd);
    const effectiveDiffDays = selectedReq
        ? getCalendarDayDiff(originalDeadline, customDate || requestedYmd)
        : 0;

    const approverName = selectedReq?.approver?.name || 'Admin ท่านอื่น';
    const isDirectedToOtherAdmin = Boolean(
        selectedReq?.approverId && selectedReq.approverId !== currentUser?.id
    );

    return (
        <div className="lg:col-span-7 bg-slate-50/60 flex flex-col min-h-0 h-full text-left">
            <AnimatePresence mode="wait">
                {!selectedReq ? (
                    <motion.div
                        key="empty-inspector"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.16 }}
                        className="flex-1 flex flex-col items-center justify-center text-center p-8"
                    >
                        <div className="w-14 h-14 bg-indigo-50 border border-indigo-200/70 text-indigo-600 rounded-2xl flex items-center justify-center mb-3">
                            <SlidersHorizontal className="w-6 h-6" />
                        </div>
                        <h3 className="text-sm text-slate-800 font-bold">เลือกคำขอจากรายการด้านซ้ายเพื่อพิจารณา</h3>
                        <p className="text-xs text-slate-500 max-w-sm mt-1 leading-relaxed">
                            ตรวจสอบกำหนดส่งเดิม ภาระงานคงค้างของพนักงาน และกำหนดวันที่อนุมัติหรือส่งเหตุผลการปฏิเสธได้จากหน้านี้
                        </p>
                    </motion.div>
                ) : (
                    <motion.div
                        key={selectedReq.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.15 }}
                        className="flex-1 flex flex-col min-h-0 h-full"
                    >
                        {/* Mobile Back Bar */}
                        <div className="lg:hidden px-4 py-2.5 bg-white border-b border-slate-200/80 flex items-center justify-between shrink-0">
                            <button
                                type="button"
                                onClick={() => setSelectedReq(null)}
                                className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 py-1"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                กลับไปหน้ารายการคำขอ
                            </button>
                            <span className="text-[11px] text-slate-400 font-medium">รายละเอียดคำขอ</span>
                        </div>

                        {/* Scrollable Inspector Body */}
                        <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-4">
                            {/* Employee Header */}
                            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200/80">
                                <div className="flex items-center gap-3 min-w-0">
                                    {insights?.requester?.avatarUrl || selectedReq.user?.avatarUrl ? (
                                        <img
                                            src={insights?.requester?.avatarUrl || selectedReq.user?.avatarUrl}
                                            alt={selectedReq.user?.name || 'พนักงาน'}
                                            referrerPolicy="no-referrer"
                                            className="w-11 h-11 rounded-full object-cover border border-slate-200 shrink-0"
                                        />
                                    ) : (
                                        <div className="w-11 h-11 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-sm shrink-0">
                                            {selectedReq.user?.name?.charAt(0) || '?'}
                                        </div>
                                    )}
                                    <div className="min-w-0">
                                        <h3 className="text-sm text-slate-800 font-bold truncate">
                                            {selectedReq.user?.name || 'พนักงาน'}
                                        </h3>
                                        <p className="text-xs text-slate-500 mt-0.5 truncate">
                                            {insights?.requester?.position || 'ทีมงาน'} · ส่งเมื่อ{' '}
                                            <span className="tabular-nums">
                                                {new Date(selectedReq.createdAt).toLocaleDateString('th-TH', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </span>
                                        </p>
                                    </div>
                                </div>

                                <div className="text-right shrink-0 tabular-nums">
                                    <span
                                        className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-xl font-semibold border ${
                                            insights?.diffDays && insights.diffDays >= 7
                                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                                : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                        }`}
                                    >
                                        <CalendarDays className="w-3.5 h-3.5" />
                                        ขอเลื่อน +{insights?.diffDays || 0} วัน
                                    </span>
                                </div>
                            </div>

                            {/* Approver Routing Note (Non-blocking for all Admins) */}
                            {selectedReq.approverId ? (
                                isDirectedToOtherAdmin ? (
                                    <div className="px-3.5 py-2.5 bg-indigo-50/70 border border-indigo-200/80 rounded-2xl flex items-center gap-2.5 text-xs text-indigo-900">
                                        <Info className="w-4 h-4 text-indigo-600 shrink-0" />
                                        <span>
                                            คำขอนี้ระบุส่งถึง <strong>{approverName}</strong> · คุณสามารถพิจารณาอนุมัติหรือปฏิเสธแทนได้
                                        </span>
                                    </div>
                                ) : (
                                    <div className="px-3.5 py-2.5 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-800">
                                        <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                                        <span>คำขอนี้ส่งตรงถึงคุณเพื่อพิจารณา</span>
                                    </div>
                                )
                            ) : (
                                <div className="px-3.5 py-2.5 bg-white border border-slate-200/80 rounded-2xl text-xs text-slate-600">
                                    คำขอนี้ไม่ได้ระบุชื่อผู้รับเฉพาะเจาะจง (Admin ทุกคนสามารถพิจารณาได้)
                                </div>
                            )}

                            {/* Legacy duplicate warning if > 1 pending request exists */}
                            {duplicateCount > 1 && (
                                <div className="px-3.5 py-2.5 bg-amber-50/80 border border-amber-200 rounded-2xl text-xs text-amber-800">
                                    พบคำขอเลื่อนค้างอยู่ <strong>{duplicateCount} รายการ</strong> บนงานเดียวกัน เมื่อคุณกดตัดสินใจ ระบบจะปิดคำขอซ้ำที่ค้างอยู่ให้อัตโนมัติ
                                </div>
                            )}

                            {/* Task / Goal Context & Dates */}
                            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-2.5">
                                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                                    <span className="font-semibold text-indigo-700">
                                        {selectedReq.requestType === 'GOAL' ? 'เป้าหมาย (Goal)' : 'งานทั่วไป (Task)'}
                                    </span>
                                    <span className="tabular-nums">
                                        กำหนดส่งเดิม: <strong className="text-slate-800">{originalDeadline ? formatDisplayDate(originalDeadline) : '-'}</strong>
                                    </span>
                                </div>
                                <h4 className="text-sm text-slate-900 font-bold leading-snug">
                                    {selectedReq.taskTitle || 'ไม่พบชื่องานในระบบ'}
                                </h4>
                                <p className="text-xs text-slate-600 tabular-nums">
                                    วันที่พนักงานขอเลื่อนไป: <strong className="text-indigo-700">{formatDisplayDate(selectedReq.newDeadline)}</strong>
                                </p>
                            </div>

                            {/* Employee Reason */}
                            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-1.5">
                                <h4 className="text-xs text-slate-600 flex items-center gap-1.5 font-bold">
                                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                                    เหตุผลจากพนักงาน
                                </h4>
                                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50/70 border border-slate-100 rounded-xl p-3">
                                    "{selectedReq.reason || 'ไม่ได้ระบุเหตุผล'}"
                                </p>
                            </div>

                            {/* Workload Snapshot */}
                            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-3">
                                <div className="flex items-center justify-between gap-2">
                                    <h4 className="text-xs text-slate-700 flex items-center gap-1.5 font-bold">
                                        <AlertCircle className="w-3.5 h-3.5 text-indigo-500" />
                                        ภาระงานอื่นที่ยังไม่เสร็จของพนักงาน
                                    </h4>
                                    <span
                                        className={`text-[11px] px-2.5 py-0.5 rounded-lg font-semibold tabular-nums ${
                                            insights?.activeTasks && insights.activeTasks.length >= 3
                                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                        }`}
                                    >
                                        {insights?.activeTasks?.length || 0} งาน · {insights?.workloadRank}
                                    </span>
                                </div>

                                {insights?.activeTasks && insights.activeTasks.length > 0 ? (
                                    <div className="divide-y divide-slate-100 max-h-[115px] overflow-y-auto pr-1">
                                        {insights.activeTasks.map((t) => (
                                            <div key={t.id} className="py-1.5 flex justify-between items-center gap-2 text-xs">
                                                <span className="text-slate-700 truncate flex-1 font-medium">{t.title}</span>
                                                <div className="flex items-center gap-2 shrink-0 text-[11px] text-slate-400 tabular-nums">
                                                    <span>{t.status}</span>
                                                    <span>·</span>
                                                    <span>{formatDisplayDate(t.endDate)}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-400 italic">
                                        ไม่มีงานค้างอื่นในขณะนี้
                                    </p>
                                )}
                            </div>

                            {/* Unified Decision Control Panel */}
                            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-4">
                                {/* 1. Single Target Approval Date */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div>
                                        <h5 className="text-xs font-bold text-slate-800">กำหนดวันส่งที่จะอนุมัติ</h5>
                                        <p className="text-[11px] text-slate-500 mt-0.5">
                                            {isDateModifiedByAdmin
                                                ? `ปรับเปลี่ยนจากวันที่พนักงานขอ (รวมเลื่อน +${effectiveDiffDays} วัน)`
                                                : 'ค่าเริ่มต้นตรงตามวันที่พนักงานขอ สามารถคลิกเพื่อปรับวันได้'}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <button
                                            type="button"
                                            onClick={() => setIsDatePickerOpen(true)}
                                            disabled={isProcessingBatch}
                                            className="px-3.5 py-2 border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50 rounded-xl text-xs text-indigo-800 font-bold transition-colors flex items-center gap-2 tabular-nums disabled:opacity-50"
                                        >
                                            <span>{formatDisplayDate(customDate)}</span>
                                            <CalendarDays className="w-4 h-4 text-indigo-500" />
                                        </button>
                                        {isDateModifiedByAdmin && (
                                            <button
                                                type="button"
                                                onClick={() => setCustomDate(requestedYmd)}
                                                className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 underline"
                                            >
                                                คืนค่าที่ขอ
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <DatePickerModal
                                    isOpen={isDatePickerOpen}
                                    onClose={() => setIsDatePickerOpen(false)}
                                    selectedDate={parseLocalYMD(customDate)}
                                    onSelect={(date) => {
                                        const ymd = toLocalYMD(date);
                                        if (ymd) setCustomDate(ymd);
                                    }}
                                />

                                {/* 2. Rejection Reason Templates & Custom Input */}
                                <div className="pt-3 border-t border-slate-100 space-y-2">
                                    <label className="block text-xs font-semibold text-slate-600">
                                        เหตุผลประกอบการปฏิเสธ (ส่งแจ้งเตือนให้พนักงานเห็นทันทีเมื่อกดปฏิเสธ)
                                    </label>
                                    <div className="flex flex-wrap gap-1.5">
                                        {rejectionTemplates.map((tpl, idx) => {
                                            const isActive = rejectionReason === tpl;
                                            return (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    disabled={isProcessingBatch}
                                                    onClick={() => setRejectionReason(isActive ? '' : tpl)}
                                                    className={`px-2.5 py-1 border text-[11px] rounded-xl text-left transition-colors ${
                                                        isActive
                                                            ? 'bg-rose-50 border-rose-300 text-rose-800 font-semibold'
                                                            : 'bg-slate-50 hover:bg-rose-50/50 border-slate-200 text-slate-600 hover:text-rose-700'
                                                    }`}
                                                >
                                                    {tpl}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <textarea
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        disabled={isProcessingBatch}
                                        placeholder="เลือกข้อความด้านบน หรือพิมพ์เหตุผลเพิ่มเติมที่นี่กรณีไม่อนุมัติ..."
                                        className="w-full px-3 py-2 bg-slate-50/70 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-300 resize-none h-16"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Sticky Unified Decision Footer */}
                        <div className="px-4 sm:px-6 py-3.5 bg-white border-t border-slate-200/80 flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-2.5 shrink-0 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
                            <button
                                type="button"
                                onClick={() => setSelectedReq(null)}
                                disabled={isProcessingBatch}
                                className="hidden lg:inline-flex px-3.5 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs text-slate-600 hover:text-slate-900 transition-colors font-semibold"
                            >
                                ปิดรายละเอียด
                            </button>

                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto sm:justify-end">
                                <button
                                    type="button"
                                    onClick={() => handleReject(selectedReq, rejectionReason)}
                                    disabled={isProcessingBatch}
                                    className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl text-xs transition-colors font-bold flex items-center justify-center gap-1.5 disabled:opacity-50"
                                >
                                    {isProcessingBatch ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                        <XCircle className="w-3.5 h-3.5" />
                                    )}
                                    ปฏิเสธคำขอ
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleApprove(selectedReq)}
                                    disabled={isProcessingBatch || !customDate}
                                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs transition-colors shadow-sm font-bold flex items-center justify-center gap-1.5 tabular-nums disabled:opacity-50"
                                >
                                    {isProcessingBatch ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                        <CheckCircle className="w-3.5 h-3.5" />
                                    )}
                                    อนุมัติเป็นวันที่ {formatDisplayDate(customDate)}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default DeadlineRequestsInspector;
