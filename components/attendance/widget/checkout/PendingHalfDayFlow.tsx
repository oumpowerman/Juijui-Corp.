import React, { useState } from 'react';
import { Clock, ShieldAlert, CheckCircle2, ArrowRight, XCircle, FileText, AlertCircle, Sparkles, Scale, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { LocationDef, LeaveRequest } from '../../../../types/attendance';
import { useGlobalDialog } from '../../../../context/GlobalDialogContext';
import { motion } from 'framer-motion';

interface PendingHalfDayFlowProps {
    pendingLeave: any;
    statusDetails: any;
    earlyLeaveInterval: number;
    earlyLeaveRate: number;
    isSubmitting: boolean;
    onAcceptProvisional: (reason?: string) => Promise<void>;
    onClose: () => void;
    onSwitchToEarlyLeave?: () => void;
}

export const PendingHalfDayFlow: React.FC<PendingHalfDayFlowProps> = ({
    pendingLeave,
    statusDetails,
    earlyLeaveInterval,
    earlyLeaveRate,
    isSubmitting,
    onAcceptProvisional,
    onClose,
    onSwitchToEarlyLeave,
}) => {
    const { showConfirm } = useGlobalDialog();
    const missingMinutes = statusDetails ? Math.max(0, statusDetails.missingMinutes || 0) : 0;
    const penaltyHP = Math.round(missingMinutes * ((earlyLeaveRate || 1) / (earlyLeaveInterval || 10)));
    const session = pendingLeave?.halfDaySession || pendingLeave?.half_day_session || 'PM';
    const sessionLabel = session === 'AM' ? 'ครึ่งเช้า' : 'ครึ่งบ่าย';
    
    // Translate leave type if available
    const getLeaveTypeLabel = (type: string) => {
        const map: Record<string, string> = {
            'SICK': 'ลาป่วย',
            'VACATION': 'ลาพักร้อน',
            'PERSONAL': 'ลากิจ',
            'EMERGENCY': 'เหตุฉุกเฉิน',
        };
        return map[type] || type || 'ลาครึ่งวัน';
    };

    const leaveTypeName = getLeaveTypeLabel(pendingLeave?.type || pendingLeave?.leaveType);

    const handleAcceptClick = async () => {
        const confirmed = await showConfirm(
            `คุณเลือกออกงานก่อนเวลาโดยยอมรับการหักคะแนนชั่วคราว (-${penaltyHP} HP)\n\nระบบจะบันทึกสถานะออกงานทันที และเมื่อผู้บริหารพิจารณา "อนุมัติ" ใบลาครึ่งวันนี้ ระบบจะทำการ "คืนค่า HP / คะแนน" ให้คุณโดยอัตโนมัติครับ`,
            'ยืนยันออกงาน (หักคะแนนชั่วคราว)',
            true
        );

        if (confirmed) {
            await onAcceptProvisional(`ยอมรับเงื่อนไขออกงานก่อนชั่วคราว (รออนุมัติใบ${leaveTypeName}${sessionLabel})`);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-3.5 text-left"
        >
            {/* Banner: Pending Half-day Leave Status */}
            <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-3.5 space-y-1.5 shadow-sm">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                        <Clock className="w-4 h-4 text-amber-600 animate-pulse shrink-0" />
                        <span>ตรวจพบใบคำขอลา{sessionLabel} (รออนุมัติ)</span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-200/70 text-amber-800 rounded-full">
                        PENDING
                    </span>
                </div>
                <div className="text-[11px] text-amber-800/90 leading-relaxed font-medium space-y-0.5">
                    <div className="flex items-center gap-1">
                        <FileText className="w-3 h-3 text-amber-600 shrink-0" />
                        <span>ประเภท: <strong>{leaveTypeName} ({sessionLabel})</strong></span>
                    </div>
                    {pendingLeave?.reason && (
                        <div className="text-amber-700/80 text-[10.5px] truncate max-w-full">
                            เหตุผล: {pendingLeave.reason.replace(/\[.*?\]/g, '').trim()}
                        </div>
                    )}
                </div>
            </div>

            {/* Instruction Header */}
            <div className="text-center py-0.5">
                <h3 className="text-xs font-bold text-slate-800">เลือกแนวทางการลงเวลาออกงานของคุณ</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                    เนื่องจากใบลาครึ่งวันยังไม่ได้รับการอนุมัติ คุณสามารถเลือกได้ 2 ทาง:
                </p>
            </div>

            {/* 2 Choice Cards */}
            <div className="grid grid-cols-2 gap-2.5">
                {/* Choice 1: Accept Provisional Penalty */}
                <button
                    type="button"
                    onClick={handleAcceptClick}
                    disabled={isSubmitting}
                    className="flex flex-col items-center text-center p-3.5 bg-white hover:bg-emerald-50/50 border-2 border-emerald-200 hover:border-emerald-500 rounded-[1.75rem] transition-all hover:shadow-md active:scale-[0.98] cursor-pointer gap-2.5 min-h-[180px] select-none shadow-sm relative group"
                >
                    <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-600 shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                        <RefreshCw className="w-5 h-5 stroke-[2.2]" />
                    </div>
                    <div className="flex-1 flex flex-col justify-between w-full">
                        <div>
                            <div className="text-xs font-bold text-slate-800 leading-tight">
                                ออกงานทันที<br/>
                                <span className="text-emerald-700">(หักคะแนนชั่วคราว)</span>
                            </div>
                            <div className="text-[10px] font-bold text-rose-600 mt-1">
                                หัก -{penaltyHP} HP ไว้ก่อน
                            </div>
                        </div>
                        <div className="bg-emerald-50/80 rounded-xl p-1.5 border border-emerald-100 mt-1">
                            <div className="text-[9.5px] text-emerald-800 font-medium leading-tight flex items-center justify-center gap-1">
                                <Sparkles className="w-3 h-3 text-emerald-600 shrink-0" />
                                <span>คืนคะแนนทันทีเมื่ออนุมัติ</span>
                            </div>
                        </div>
                    </div>
                </button>

                {/* Choice 2: Wait for Approval */}
                <button
                    type="button"
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="flex flex-col items-center text-center p-3.5 bg-white hover:bg-blue-50/50 border-2 border-blue-200 hover:border-blue-500 rounded-[1.75rem] transition-all hover:shadow-md active:scale-[0.98] cursor-pointer gap-2.5 min-h-[180px] select-none shadow-sm group"
                >
                    <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-200/80 flex items-center justify-center text-blue-600 shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                        <Clock className="w-5 h-5 stroke-[2.2]" />
                    </div>
                    <div className="flex-1 flex flex-col justify-between w-full">
                        <div>
                            <div className="text-xs font-bold text-slate-800 leading-tight">
                                รอผู้บริหารอนุมัติ<br/>
                                <span className="text-blue-700">(ตามขั้นตอน)</span>
                            </div>
                            <div className="text-[10px] font-bold text-blue-600 mt-1">
                                ไม่เสียคะแนนใดๆ
                            </div>
                        </div>
                        <div className="bg-blue-50/80 rounded-xl p-1.5 border border-blue-100 mt-1">
                            <div className="text-[9.5px] text-blue-800 font-medium leading-tight">
                                ปิดหน้าต่างนี้ และรอกดออกงานหลังอนุมัติ
                            </div>
                        </div>
                    </div>
                </button>
            </div>

            {/* Optional Switch to Standard Early Leave */}
            {onSwitchToEarlyLeave && (
                <div className="text-center pt-1">
                    <button
                        type="button"
                        onClick={onSwitchToEarlyLeave}
                        className="text-[11px] font-semibold text-slate-400 hover:text-slate-600 hover:underline transition-colors inline-flex items-center gap-1 cursor-pointer"
                    >
                        <span>หรือต้องการยื่นคำร้องกลับก่อนเวลาแบบปกติแทน?</span>
                        <ArrowRight className="w-3 h-3" />
                    </button>
                </div>
            )}
        </motion.div>
    );
};
