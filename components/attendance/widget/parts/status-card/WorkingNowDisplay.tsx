import React, { useState } from 'react';
import { format } from 'date-fns';
import { MapPin, LogOut, AlertCircle, AlertTriangle, ArrowRight } from 'lucide-react';
import { AttendanceLog, LocationDef, LeaveRequest } from '../../../../../types/attendance';
import { CheckOutModal } from '../../CheckOutModal';

interface WorkingNowDisplayProps {
    todayLog: AttendanceLog;
    availableLocations: LocationDef[];
    onCheckOut: (location?: { lat: number, lng: number }, locationName?: string, reason?: string) => Promise<void>;
    handleCheckOutRequest: (timeStr: string, reason: string) => Promise<boolean>;
    handleOvertimeSubmit: (otMinutes: number, reason: string) => Promise<boolean>;
    onNavigateToHistory?: () => void;
    onOpenLeave?: (type?: any) => void;
    todayActiveLeave?: LeaveRequest | null;
    isApprovedLeaveToday?: boolean;
}

export const WorkingNowDisplay: React.FC<WorkingNowDisplayProps> = ({
    todayLog,
    availableLocations,
    onCheckOut,
    handleCheckOutRequest,
    handleOvertimeSubmit,
    onNavigateToHistory,
    onOpenLeave,
    todayActiveLeave,
    isApprovedLeaveToday
}) => {
    const [isCheckOutModalOpen, setIsCheckOutModalOpen] = useState(false);

    const formatTimeSafe = (timeVal: string | Date | null | undefined) => {
        if (!timeVal) return '--:--';
        try {
            return format(new Date(timeVal), 'HH:mm');
        } catch (e) {
            return '--:--';
        }
    };

    const isAppealPending = todayLog?.status === 'APPEAL' || !!todayLog?.note?.includes('[APPEAL_PENDING]');
    const isProvisionalLate = !!todayLog?.note?.includes('[PROVISIONAL_LATE_ENTRY]');
    const isProvisionalForgotCheckin = !!todayLog?.note?.includes('[PROVISIONAL_FORGOT_CHECKIN]');
    const isProvisionalWfh = !!todayLog?.note?.includes('[PROVISIONAL_WFH]');
    const isProvisionalOnsite = !!todayLog?.note?.includes('[PROVISIONAL_ONSITE]');
    const isPendingVerify = todayLog?.status === 'PENDING_VERIFY';

    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100">
                <span className="text-xs font-bold text-indigo-600 flex items-center">
                    <MapPin className="w-3 h-3 mr-1" /> {todayLog?.workType}
                </span>
                <span className="text-xs text-indigo-400">
                    เข้าเมื่อ: <span className="font-mono font-bold text-indigo-600">{formatTimeSafe(todayLog?.checkInTime)}</span>
                </span>
            </div>

            {/* APPROVED WFH BANNER */}
            {isApprovedLeaveToday && todayActiveLeave?.type === 'WFH' && todayLog?.workType === 'WFH' && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between animate-in slide-in-from-top-2">
                    <div className="flex items-center gap-2.5">
                        <div className="bg-emerald-100 p-1.5 rounded-full text-emerald-600">
                            <span className="text-sm">🏠</span>
                        </div>
                        <div className="text-left">
                            <p className="text-xs font-bold text-emerald-800">กำลังปฏิบัติงานที่บ้าน (WFH อนุมัติแล้ว) ✅</p>
                            <p className="text-[10px] text-emerald-600 font-medium">คุณได้รับการอนุมัติให้ปฏิบัติงานที่บ้านในวันนี้อย่างเป็นทางการ</p>
                        </div>
                    </div>
                </div>
            )}

            {/* APPROVED ONSITE BANNER */}
            {isApprovedLeaveToday && todayActiveLeave?.type === 'ONSITE' && todayLog?.workType === 'SITE' && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between animate-in slide-in-from-top-2">
                    <div className="flex items-center gap-2.5">
                        <div className="bg-emerald-100 p-1.5 rounded-full text-emerald-600">
                            <span className="text-sm">🚗</span>
                        </div>
                        <div className="text-left">
                            <p className="text-xs font-bold text-emerald-800">กำลังปฏิบัติงานนอกสถานที่ (On-site อนุมัติแล้ว) ✅</p>
                            <p className="text-[10px] text-emerald-600 font-medium">คุณได้รับการอนุมัติให้ปฏิบัติงานนอกสถานที่ในวันนี้อย่างเป็นทางการ</p>
                        </div>
                    </div>
                </div>
            )}

            {todayLog?.status === 'ACTION_REQUIRED' && (
                 <div className="bg-gradient-to-r from-red-50 to-rose-50 px-4 py-3 rounded-xl border border-red-200 shadow-sm flex flex-col gap-2 text-left animate-pulse-slow">
                    <div className="flex items-start gap-2.5">
                        <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                        <div className="text-left">
                            <span className="block text-xs text-red-800 font-bold">คำขอได้รับการปฏิเสธและต้องแก้ไข (Action Required)</span>
                            <span className="block text-[10px] text-red-600 leading-normal mt-0.5">
                                แอดมินปฏิเสธคำขอเข้างานจำลองของคุณ: {todayLog?.note ? todayLog.note.replace(/\[.*?\]/g, '').trim() : ''}
                            </span>
                        </div>
                    </div>
                    {onOpenLeave && todayLog?.workType?.toUpperCase() === 'WFH' && (
                        <button
                            onClick={() => onOpenLeave('WFH')}
                            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                        >
                            <span>🏠 คลิกเพื่อยื่นคำขอ WFH ใหม่ทันที</span>
                        </button>
                    )}
                    {onOpenLeave && ['SITE', 'ONSITE', 'ON SITE', 'ON-SITE'].includes(todayLog?.workType?.toUpperCase() || '') && (
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

            {isAppealPending && (
                 <div className="bg-gradient-to-r from-violet-50 to-purple-50 px-4 py-3 rounded-xl border border-violet-200 shadow-sm flex items-start gap-2.5 animate-pulse-slow">
                    <AlertCircle className="w-4 h-4 text-violet-500 shrink-0 mt-0.5" />
                    <div className="text-left">
                        <span className="block text-xs text-violet-800 font-bold">กำลังทำงาน (แจ้งเข้าสายจำลอง)</span>
                        <span className="block text-[10px] text-violet-600 leading-normal mt-0.5">ใบคำขอแจ้งเข้าสายยังไม่ได้รับการอนุมัติ ระบบให้เข้างานชั่วคราว หากได้รับการอนุมัติจะไม่ถูกหักคะแนนหากเข้าสายตามเวลาที่ขอไว้</span>
                    </div>
                </div>
            )}

            {isProvisionalLate && (
                 <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-3 rounded-xl border border-amber-200 shadow-sm flex items-start gap-2.5 animate-pulse-slow">
                    <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div className="text-left">
                        <span className="block text-xs text-amber-800 font-bold">อยู่ระหว่างรอพิจารณาคำชี้แจงกรณีเข้างานสาย (Late Appeal / Provisional)</span>
                        <span className="block text-[10px] text-amber-600 leading-normal mt-0.5">ใบคำขอแจ้งเข้าสายยังไม่ได้รับการอนุมัติ ระบบให้เข้างานชั่วคราว หากได้รับการอนุมัติจะไม่ถูกหักคะแนนหากเข้าสายตามเวลาที่ขอไว้</span>
                    </div>
                </div>
            )}

            {isProvisionalForgotCheckin && (
                 <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-3 rounded-xl border border-amber-200 shadow-sm flex items-start gap-2.5 animate-pulse-slow">
                    <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div className="text-left">
                        <span className="block text-xs text-amber-800 font-bold">เวลานี้ได้รับการจำลองเข้าระบบชั่วคราว</span>
                        <span className="block text-[10px] text-amber-600 leading-normal mt-0.5">เวลาเข้างานของคุณยังไม่ถูกอนุมัติ ระบบอาจจะปรับเปลี่ยนเวลาในภายหลังตามการพิจารณาของแอดมิน</span>
                    </div>
                </div>
            )}

            {isProvisionalWfh && (
                 <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 rounded-xl border border-blue-200 shadow-sm flex items-start gap-2.5 animate-pulse-slow">
                    <AlertCircle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                    <div className="text-left">
                        <span className="block text-xs text-blue-800 font-bold">ลงเวลาแบบจำลอง (Provisional WFH)</span>
                        <span className="block text-[10px] text-blue-600 leading-normal mt-0.5">ไม่พบใบอนุมัติทำงานที่บ้าน (WFH) ล่วงหน้า ระบบตอกบัตรให้ชั่วคราวและลงสิทธิ์แบบยังไม่ได้รับอนุมัติ จนกว่าแอดมินจะพิจารณาอนุมัติย้อนหลัง</span>
                    </div>
                </div>
            )}

            {isProvisionalOnsite && (
                 <div className="bg-gradient-to-r from-orange-50 to-amber-50 px-4 py-3 rounded-xl border border-orange-200 shadow-sm flex items-start gap-2.5 animate-pulse-slow">
                    <AlertCircle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                    <div className="text-left">
                        <span className="block text-xs text-orange-800 font-bold">ลงเวลาแบบจำลอง (Provisional On-site)</span>
                        <span className="block text-[10px] text-orange-600 leading-normal mt-0.5">ไม่พบใบอนุมัติปฏิบัติงานนอกสถานที่ล่วงหน้า ระบบลงเวลาจำลองชั่วคราว กรุณารอแอดมินพิจารณาอนุมัติย้อนหลัง</span>
                    </div>
                </div>
            )}

            {isPendingVerify && (
                 <div className="bg-yellow-50 px-4 py-2 rounded-xl border border-yellow-100 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-600 animate-pulse" />
                    <span className="text-xs text-yellow-700 font-bold">รายการนี้รอตรวจสอบ (Manual Entry)</span>
                </div>
            )}

            <button 
                onClick={() => setIsCheckOutModalOpen(true)}
                className="w-full py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold shadow-lg shadow-red-200 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
                <LogOut className="w-5 h-5" /> ตอกบัตรออก (Check Out)
            </button>

            <CheckOutModal 
                isOpen={isCheckOutModalOpen}
                onClose={() => setIsCheckOutModalOpen(false)}
                onConfirm={onCheckOut}
                onRequest={handleCheckOutRequest}
                availableLocations={availableLocations}
                checkInTime={todayLog.checkInTime ? new Date(todayLog.checkInTime) : new Date()} 
                onOvertimeSubmit={handleOvertimeSubmit}
            />
        </div>
    );
};
