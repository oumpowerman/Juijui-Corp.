import React from 'react';
import { format } from 'date-fns';
import { AlertCircle, AlertTriangle, ArrowRight } from 'lucide-react';
import { AttendanceLog } from '../../../../../types/attendance';

interface FinishedWorkDisplayProps {
    todayLog: AttendanceLog | null;
    hasAnyProvisional: boolean;
    isProvisionalForgotCheckin: boolean;
    isProvisionalCheckout: boolean;
    isProvisionalWfh: boolean;
    isProvisionalOnsite: boolean;
    isAppealPending: boolean;
    isPendingVerify: boolean;
    onNavigateToHistory?: () => void;
    onOpenLeave?: (type?: any) => void;
}

export const FinishedWorkDisplay: React.FC<FinishedWorkDisplayProps> = ({
    todayLog,
    hasAnyProvisional,
    isProvisionalForgotCheckin,
    isProvisionalCheckout,
    isProvisionalWfh,
    isProvisionalOnsite,
    isAppealPending,
    isPendingVerify,
    onNavigateToHistory,
    onOpenLeave
}) => {
    const formatTimeSafe = (timeVal: string | Date | null | undefined) => {
        if (!timeVal) return '--:--';
        try {
            return format(new Date(timeVal), 'HH:mm');
        } catch (e) {
            return '--:--';
        }
    };

    const isActionRequired = todayLog?.status === 'ACTION_REQUIRED';
    const noteText = todayLog?.note || '';
    const isRejectedOutOfRange = noteText.includes('[REJECTED OUT_OF_RANGE_CHECKOUT]');
    const isRejectedForgotCheckout = noteText.includes('[REJECTED FORGOT_CHECKOUT]');

    return (
        <div className="space-y-2.5">
            <div className={`rounded-xl p-4 text-center border ${
                isActionRequired
                    ? 'bg-red-50 border-red-200 shadow-sm'
                    : hasAnyProvisional 
                        ? 'bg-amber-50/70 border-amber-200 shadow-sm' 
                        : 'bg-green-50 border-green-100'
            }`}>
                <p className={`font-bold text-lg ${
                    isActionRequired 
                        ? 'text-red-800' 
                        : hasAnyProvisional 
                            ? 'text-amber-800' 
                            : 'text-green-700'
                }`}>
                    {isActionRequired 
                        ? '⚠️ บันทึกเวลาต้องการการแก้ไข' 
                        : hasAnyProvisional 
                            ? '⏳ บันทึกเวลาชั่วคราว (รอตรวจสอบ)' 
                            : '🎉 เลิกงานแล้ว!'}
                </p>
                <div className={`flex justify-center gap-4 mt-2 text-xs ${
                    isActionRequired 
                        ? 'text-red-700' 
                        : hasAnyProvisional 
                            ? 'text-amber-700' 
                            : 'text-green-600'
                }`}>
                    <div>
                        <span className="block opacity-70">เข้างาน</span>
                        <span className="font-mono font-bold">{formatTimeSafe(todayLog?.checkInTime)}</span>
                    </div>
                    <div>
                        <span className="block opacity-70">ออกงาน</span>
                        <span className="font-mono font-bold">{formatTimeSafe(todayLog?.checkOutTime)}</span>
                    </div>
                </div>
            </div>

            {isActionRequired && (
                 <div className="bg-gradient-to-r from-red-50 to-rose-50 px-4 py-3 rounded-xl border border-red-200 shadow-sm flex flex-col gap-2 text-left animate-pulse-slow">
                    <div className="flex items-start gap-2.5">
                        <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                        <div className="text-left">
                            <span className="block text-xs text-red-800 font-bold">บันทึกเวลาต้องการการแก้ไขอย่างเร่งด่วน (Action Required)</span>
                            <span className="block text-[10px] text-red-600 leading-normal mt-0.5">
                                {isRejectedOutOfRange ? (
                                    <>แอดมินปฏิเสธคำขอลงเวลาออกนอกพื้นที่ของคุณ: {todayLog?.note ? todayLog.note.replace(/\[.*?\]/g, '').trim() : ''}</>
                                ) : isRejectedForgotCheckout ? (
                                    <>แอดมินปฏิเสธคำขอแก้เวลาออกงานของคุณ: {todayLog?.note ? todayLog.note.replace(/\[.*?\]/g, '').trim() : ''}</>
                                ) : (
                                    <>แอดมินปฏิเสธคำขอเข้างานจำลองของคุณ: {todayLog?.note ? todayLog.note.replace(/\[.*?\]/g, '').trim() : ''}</>
                                )}
                            </span>
                        </div>
                    </div>
                    {onOpenLeave && isRejectedOutOfRange && (
                        <button
                            onClick={() => onOpenLeave('OUT_OF_RANGE_CHECKOUT')}
                            className="w-full py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                        >
                            <span>📍 คลิกเพื่อยื่นคำขอลงเวลานอกพื้นที่ใหม่</span>
                        </button>
                    )}
                    {onOpenLeave && isRejectedForgotCheckout && (
                        <button
                            onClick={() => onOpenLeave('FORGOT_CHECKOUT')}
                            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                        >
                            <span>📝 คลิกเพื่อยื่นคำขอแก้เวลาออกงานใหม่</span>
                        </button>
                    )}
                    {onOpenLeave && !isRejectedOutOfRange && !isRejectedForgotCheckout && todayLog?.workType?.toUpperCase() === 'WFH' && (
                        <button
                            onClick={() => onOpenLeave('WFH')}
                            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                        >
                            <span>🏠 คลิกเพื่อยื่นคำขอ WFH ใหม่ทันที</span>
                        </button>
                    )}
                    {onOpenLeave && !isRejectedOutOfRange && !isRejectedForgotCheckout && ['SITE', 'ONSITE', 'ON SITE', 'ON-SITE'].includes(todayLog?.workType?.toUpperCase() || '') && (
                        <button
                            onClick={() => onOpenLeave('ONSITE')}
                            className="w-full py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                        >
                            <span>🚗 คลิกเพื่อยื่นคำขอ On-site ใหม่ทันที</span>
                        </button>
                    )}
                    {onNavigateToHistory && (
                        <button
                            onClick={onNavigateToHistory}
                            className="w-full py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-[10px] font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                        >
                            <span>ไปที่ประวัติเพื่อส่งคำขอใหม่</span>
                            <ArrowRight className="w-3 h-3" />
                        </button>
                    )}
                </div>
            )}

            {hasAnyProvisional && (
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-3 rounded-xl border border-amber-200 text-left space-y-1 animate-in fade-in slide-in-from-top-2">
                    <span className="block text-xs font-bold text-amber-800 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 animate-pulse" />
                        <span>เวลาเข้า-ออกงานในวันนี้ยังไม่เป็นทางการ</span>
                    </span>
                    <p className="text-[10px] text-amber-700 leading-normal">
                        บันทึกเวลาของวันนี้อยู่ในสถานะจำลอง/รอการตรวจสอบย้อนหลัง กรุณารอแอดมินหรือหัวหน้างานพิจารณาอนุมัติ:
                    </p>
                    <ul className="text-[10px] text-amber-700 list-disc list-inside space-y-0.5 pt-1.5 border-t border-amber-200/50">
                        {isProvisionalForgotCheckin && <li>ลืมลงเวลาเข้างาน (Provisional Forgot Check-in)</li>}
                        {isProvisionalCheckout && <li>ลืมลงเวลาออกงาน / นอกพิกัด (Provisional Forgot Check-out)</li>}
                        {isProvisionalWfh && <li>ทำงานที่บ้านแบบชั่วคราว (Provisional WFH รอใบอนุมัติ)</li>}
                        {isProvisionalOnsite && <li>ปฏิบัติงานนอกสถานที่ชั่วคราว (Provisional On-site รอใบอนุมัติ)</li>}
                        {isAppealPending && <li>อยู่ระหว่างรอพิจารณาคำชี้แจงกรณีเข้างานสาย (Late Appeal)</li>}
                        {isPendingVerify && <li>รายการลงเวลาแบบบันทึกแมนนวล (Manual Entry Waiting Approval)</li>}
                    </ul>
                </div>
            )}
        </div>
    );
};
