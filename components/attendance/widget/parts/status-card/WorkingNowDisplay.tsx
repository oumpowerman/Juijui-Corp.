import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { MapPin, LogOut, AlertCircle, AlertTriangle, ArrowRight, Camera, Sparkles, Navigation, Clock, ChevronRight } from 'lucide-react';
import { AttendanceLog, LocationDef, LeaveRequest, AttendanceCheckpoint } from '../../../../../types/attendance';
import { CheckOutModal } from '../../CheckOutModal';
import { FieldCheckpointModal } from '../../FieldCheckpointModal';
import { attendanceService } from '../../../../../services/attendanceService';

interface WorkingNowDisplayProps {
    todayLog: AttendanceLog;
    availableLocations: LocationDef[];
    onCheckOut: (location?: { lat: number, lng: number }, locationName?: string, reason?: string, proofUrl?: string) => Promise<void>;
    handleCheckOutRequest: (timeStr: string, reason: string) => Promise<boolean>;
    handleOvertimeSubmit: (otMinutes: number, reason: string) => Promise<boolean>;
    onNavigateToHistory?: () => void;
    onOpenLeave?: (type?: any) => void;
    todayActiveLeave?: LeaveRequest | null;
    isApprovedLeaveToday?: boolean;
    todayRequests?: any[];
    isDesktop?: boolean;
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
    isApprovedLeaveToday,
    todayRequests,
    isDesktop = false
}) => {
    const [isCheckOutModalOpen, setIsCheckOutModalOpen] = useState(false);
    const [isCheckpointModalOpen, setIsCheckpointModalOpen] = useState(false);
    const [todayCheckpoints, setTodayCheckpoints] = useState<AttendanceCheckpoint[]>([]);
    const [showQuickList, setShowQuickList] = useState(false);

    const loadCheckpoints = useCallback(async () => {
        if (!todayLog?.userId) return;
        try {
            const list = await attendanceService.getTodayCheckpoints(todayLog.userId, todayLog.id);
            setTodayCheckpoints(list);
        } catch (err) {
            console.error("Error loading today checkpoints:", err);
        }
    }, [todayLog?.userId, todayLog?.id]);

    useEffect(() => {
        loadCheckpoints();
    }, [loadCheckpoints]);

    const formatTimeSafe = (timeVal: string | Date | null | undefined) => {
        if (!timeVal) return '--:--';
        try {
            return format(new Date(timeVal), 'HH:mm');
        } catch (e) {
            return '--:--';
        }
    };

    // Calculate approved/pending status of various requests to prevent conflicting banners
    const isWfhApproved = (isApprovedLeaveToday && todayActiveLeave?.type === 'WFH') || 
        !!(todayRequests && todayRequests.some(r => r.type === 'WFH' && r.status === 'APPROVED'));

    const isOnsiteApproved = (isApprovedLeaveToday && todayActiveLeave?.type === 'ONSITE') || 
        !!(todayRequests && todayRequests.some(r => (r.type === 'ONSITE' || r.type === 'OFFSITE') && r.status === 'APPROVED'));

    const isLateApproved = !!(todayRequests && todayRequests.some(r => r.type === 'LATE_ENTRY' && r.status === 'APPROVED'));

    const isAppealPending = (todayLog?.status === 'APPEAL' || !!todayLog?.note?.includes('[APPEAL_PENDING]')) && !isLateApproved;
    const isProvisionalLate = !!todayLog?.note?.includes('[PROVISIONAL_LATE_ENTRY]') && !isLateApproved;
    const isProvisionalForgotCheckin = !!todayLog?.note?.includes('[PROVISIONAL_FORGOT_CHECKIN]');
    
    // Suppress provisional warnings if they actually have approved requests
    const isProvisionalWfh = !!todayLog?.note?.includes('[PROVISIONAL_WFH]') && !isWfhApproved;
    const isProvisionalOnsite = !!todayLog?.note?.includes('[PROVISIONAL_ONSITE]') && !isOnsiteApproved;
    
    const isProvisionalGps = !!todayLog?.note?.includes('[PROVISIONAL_GPS_SPOOF_APPEAL]') || !!todayLog?.note?.includes('[GPS_SPOOF_APPEAL_PENDING]');
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
            {(isApprovedLeaveToday && todayActiveLeave?.type === 'WFH') && (
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
            {(isApprovedLeaveToday && todayActiveLeave?.type === 'ONSITE') && (
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
                        <span className="block text-[10px] text-violet-600 leading-normal mt-0.5">ใบคำขอแจ้งเข้าสายยังไม่ได้รับการอนุมัติ</span> {/*ระบบให้เข้างานชั่วคราว หากได้รับการอนุมัติจะไม่ถูกหักคะแนนหากเข้าสายตามเวลาที่ขอไว้*/}
                    </div>
                </div>
            )}
            
            {isProvisionalLate && (
                 <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-3 rounded-xl border border-amber-200 shadow-sm flex items-start gap-2.5 animate-pulse-slow">
                    <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div className="text-left">
                        <span className="block text-xs text-amber-800 font-bold">อยู่ระหว่างรอพิจารณาคำชี้แจงกรณีเข้างานสาย (Late Appeal / Provisional)</span>
                        <span className="block text-[10px] text-amber-600 leading-normal mt-0.5">ใบคำขอแจ้งเข้าสายยังไม่ได้รับการอนุมัติ</span> {/*ระบบให้เข้างานชั่วคราว หากได้รับการอนุมัติจะไม่ถูกหักคะแนนหากเข้าสายตามเวลาที่ขอไว้*/}
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

            {isProvisionalGps && (
                 <div className="bg-gradient-to-r from-purple-50 to-indigo-50 px-4 py-3 rounded-xl border border-purple-200 shadow-sm flex items-start gap-2.5 animate-pulse-slow">
                    <AlertCircle className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
                    <div className="text-left">
                        <span className="block text-xs text-purple-800 font-bold">📍 ลงเวลาแบบจำลอง (อุทธรณ์พิกัด GPS)</span>
                        <span className="block text-[10px] text-purple-600 leading-normal mt-0.5">คำขออุทธรณ์พิกัด GPS ของคุณอยู่ระหว่างรอการตรวจสอบและอนุมัติจากแอดมิน ระบบให้ลงเวลาทำงานชั่วคราวแล้ว</span>
                    </div>
                </div>
            )}

            {isPendingVerify && (
                 <div className="bg-yellow-50 px-4 py-2 rounded-xl border border-yellow-100 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-600 animate-pulse" />
                    <span className="text-xs text-yellow-700 font-bold">รายการนี้รอตรวจสอบ (Manual Entry)</span>
                </div>
            )}

            {/* FIELD CHECKPOINT / SHOOT REPORT BUTTON & BADGE */}
            <div className="space-y-2 pt-1">
                <button
                    disabled={isDesktop}
                    onClick={() => setIsCheckpointModalOpen(true)}
                    className={`w-full py-3.5 rounded-2xl font-bold transition-all flex items-center justify-center gap-2.5 cursor-pointer relative overflow-hidden group
                        ${isDesktop
                            ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed shadow-none'
                            : 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-700 hover:to-cyan-600 text-white shadow-lg shadow-indigo-200/60 active:scale-98'
                        }
                    `}
                >
                    <div className="p-1 bg-white/20 rounded-lg group-hover:rotate-12 transition-transform">
                        <MapPin className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-xs tracking-wide">
                        📍 TimeStamp รายงานออกกอง / จุดปฏิบัติงาน
                    </span>
                    <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300 animate-pulse" />
                </button>

                {/* Checkpoint Summary Badge */}
                {todayCheckpoints && todayCheckpoints.length > 0 ? (
                    <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-2.5 text-left transition-all">
                        <button
                            type="button"
                            onClick={() => setShowQuickList(!showQuickList)}
                            className="w-full flex items-center justify-between text-xs font-semibold text-indigo-900 cursor-pointer"
                        >
                            <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-cyan-500 animate-ping" />
                                <span>วันนี้รายงานไปแล้ว <strong className="text-indigo-600 font-bold">{todayCheckpoints.length}</strong> จุด</span>
                            </span>
                            <span className="text-[11px] text-indigo-600 flex items-center font-medium hover:underline">
                                {showQuickList ? 'ซ่อนรายการ' : 'ดูรายการ'}
                                <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showQuickList ? 'rotate-90' : ''}`} />
                            </span>
                        </button>

                        {/* Expandable Mini List */}
                        {showQuickList && (
                            <div className="mt-2.5 pt-2 border-t border-indigo-100/80 space-y-1.5 max-h-40 overflow-y-auto">
                                {todayCheckpoints.map((cp, idx) => (
                                    <div key={cp.id || idx} className="p-2 bg-white rounded-xl border border-indigo-100/60 flex items-start justify-between gap-2 shadow-2xs">
                                        <div className="text-left space-y-0.5">
                                            <div className="flex items-center gap-1">
                                                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md">
                                                    #{idx + 1}
                                                </span>
                                                <span className="text-xs font-bold text-slate-800">
                                                    {cp.locationName || cp.location_name}
                                                </span>
                                            </div>
                                            {cp.note && (
                                                <p className="text-[11px] text-slate-500 line-clamp-1">
                                                    📝 {cp.note}
                                                </p>
                                            )}
                                        </div>
                                        <span className="text-[10px] font-mono font-bold text-indigo-600 shrink-0 bg-indigo-50/80 px-1.5 py-0.5 rounded-md">
                                            {formatTimeSafe(cp.checkpointTime || cp.checkpoint_time)} น.
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center">
                        <span className="text-[11px] text-slate-400 font-medium">
                            ยังไม่มีการบันทึกจุดออกกองในวันนี้
                        </span>
                    </div>
                )}
            </div>

            <div className="pt-1">
                <button 
                    disabled={isDesktop}
                    onClick={() => setIsCheckOutModalOpen(true)}
                    className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2
                        ${isDesktop 
                            ? 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed shadow-none' 
                            : 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-200 active:scale-95'
                        }
                    `}
                >
                    <LogOut className="w-5 h-5" /> ตอกบัตรออก (Check Out)
                </button>
            </div>

            <CheckOutModal 
                isOpen={isCheckOutModalOpen}
                onClose={() => setIsCheckOutModalOpen(false)}
                onConfirm={onCheckOut}
                onRequest={handleCheckOutRequest}
                availableLocations={availableLocations}
                checkInTime={todayLog.checkInTime ? new Date(todayLog.checkInTime) : new Date()} 
                onOvertimeSubmit={handleOvertimeSubmit}
                workType={todayLog?.workType}
                note={todayLog?.note}
            />

            <FieldCheckpointModal
                isOpen={isCheckpointModalOpen}
                onClose={() => setIsCheckpointModalOpen(false)}
                attendanceId={todayLog?.id}
                userId={todayLog?.userId}
                availableLocations={availableLocations}
                onSuccess={loadCheckpoints}
            />
        </div>
    );
};
