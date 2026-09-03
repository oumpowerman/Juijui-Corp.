import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { format } from 'date-fns';
import { 
    MapPin, 
    LogOut, 
    AlertCircle, 
    AlertTriangle, 
    ArrowRight, 
    Camera, 
    Sparkles, 
    Navigation, 
    Clock, 
    ChevronRight,
    ExternalLink,
    X,
    Image as ImageIcon
} from 'lucide-react';
import { AttendanceLog, LocationDef, LeaveRequest, AttendanceCheckpoint } from '../../../../../types/attendance';
import { CheckOutModal } from '../../CheckOutModal';
import { FieldCheckpointModal } from '../../FieldCheckpointModal';
import { attendanceService } from '../../../../../services/attendanceService';
import { getDirectDriveUrl } from '../../../../../lib/imageUtils';

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
    const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

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
            <div className="space-y-1.5 pt-1">
                <button
                    disabled={isDesktop}
                    onClick={() => setIsCheckpointModalOpen(true)}
                    className={`w-full py-2 px-3.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer
                        ${isDesktop
                            ? 'bg-slate-50 text-slate-400 border border-slate-200 cursor-not-allowed shadow-none'
                            : 'bg-slate-50/90 hover:bg-indigo-50/70 border border-slate-200 hover:border-indigo-300 text-slate-700 hover:text-indigo-700 shadow-2xs active:scale-98'
                        }
                    `}
                >
                    <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span>📍 จุดปฏิบัติงานนอกสถานที่</span>
                    {todayCheckpoints && todayCheckpoints.length > 0 && (
                        <span className="ml-1 px-1.5 py-0.2 bg-indigo-100 text-indigo-700 rounded-full text-[10px] font-bold">
                            {todayCheckpoints.length}
                        </span>
                    )}
                </button>

                {/* Checkpoint Summary Badge */}
                {todayCheckpoints && todayCheckpoints.length > 0 && (
                    <div className="bg-indigo-50/60 border border-indigo-100/80 rounded-xl p-2.5 text-left transition-all">
                        <button
                            type="button"
                            onClick={() => setShowQuickList(!showQuickList)}
                            className="w-full flex items-center justify-between text-xs font-semibold text-indigo-900 cursor-pointer"
                        >
                            <span className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-ping" />
                                <span>รายงานจุดปฏิบัติงานแล้ว <strong className="text-indigo-600 font-bold">{todayCheckpoints.length}</strong> จุด</span>
                            </span>
                            <span className="text-[11px] text-indigo-600 flex items-center font-medium hover:underline">
                                {showQuickList ? 'ซ่อนรายการ' : 'ดูรายการ'}
                                <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showQuickList ? 'rotate-90' : ''}`} />
                            </span>
                        </button>

                        {/* Expandable Rich List */}
                        {showQuickList && (
                            <div className="mt-2 pt-2 border-t border-indigo-100/80 space-y-2 max-h-60 overflow-y-auto pr-0.5">
                                {todayCheckpoints.map((cp, idx) => {
                                    const photo = cp.photoUrl || cp.photo_url;
                                    const hasGps = cp.latitude && cp.longitude;

                                    return (
                                        <div key={cp.id || idx} className="p-2.5 bg-white rounded-xl border border-indigo-100/70 shadow-2xs space-y-1.5">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex items-center gap-1.5 min-w-0">
                                                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded-md shrink-0 border border-indigo-100/60">
                                                        #{idx + 1}
                                                    </span>
                                                    <span className="text-xs font-bold text-slate-800 truncate">
                                                        {cp.locationName || cp.location_name}
                                                    </span>
                                                </div>
                                                <span className="text-[10px] font-mono font-bold text-indigo-600 shrink-0 bg-indigo-50/80 px-2 py-0.5 rounded-md flex items-center gap-1">
                                                    <Clock className="w-2.5 h-2.5 text-indigo-500" />
                                                    {formatTimeSafe(cp.checkpointTime || cp.checkpoint_time)} น.
                                                </span>
                                            </div>

                                            {cp.note && (
                                                <p className="text-[11px] text-slate-600 bg-slate-50/80 p-1.5 rounded-lg border border-slate-100 leading-snug">
                                                    📝 {cp.note}
                                                </p>
                                            )}

                                            <div className="flex items-center justify-between gap-2 pt-0.5 text-[10px]">
                                                {hasGps ? (
                                                    <a
                                                        href={`https://www.google.com/maps?q=${cp.latitude},${cp.longitude}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-cyan-700 hover:text-cyan-900 font-semibold flex items-center gap-1 hover:underline"
                                                    >
                                                        <Navigation className="w-3 h-3 text-cyan-600" />
                                                        <span>{cp.latitude?.toFixed(4)}, {cp.longitude?.toFixed(4)}</span>
                                                        <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
                                                    </a>
                                                ) : (
                                                    <span className="text-slate-400">ไม่มีพิกัด GPS</span>
                                                )}

                                                {photo && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setPreviewPhoto(photo)}
                                                        className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                                                    >
                                                        <ImageIcon className="w-3 h-3 text-indigo-500" /> ดูรูปถ่าย
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
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

            {/* Photo Lightbox Modal for Staff */}
            {previewPhoto && typeof document !== 'undefined' && createPortal(
                <div 
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs"
                    onClick={() => setPreviewPhoto(null)}
                >
                    <div 
                        className="relative max-w-lg w-full bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-700"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-4 flex items-center justify-between border-b border-slate-800 text-white">
                            <span className="text-xs font-bold flex items-center gap-1.5">
                                <Camera className="w-4 h-4 text-cyan-400" /> ภาพถ่ายจุดออกกอง
                            </span>
                            <button
                                onClick={() => setPreviewPhoto(null)}
                                className="p-1.5 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="p-2 max-h-[70vh] flex items-center justify-center bg-black/50">
                            <img
                                src={getDirectDriveUrl(previewPhoto)}
                                alt="Checkpoint evidence"
                                className="max-h-[65vh] w-auto object-contain rounded-xl"
                            />
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};
