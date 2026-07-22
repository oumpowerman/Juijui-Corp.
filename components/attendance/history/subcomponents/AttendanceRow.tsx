import React from 'react';
import { AttendanceLog } from '../../../../types/attendance';
import { findPendingRegistryItemByNote, getWorkTypeStyles } from '../../../../constants/attendanceRegistry';
import { format, isSameDay } from 'date-fns';
import th from 'date-fns/locale/th';
import { 
    AlertTriangle, XCircle, Loader2, Image as ImageIcon 
} from 'lucide-react';
import { getWorkingDaysDifference } from '../../../../lib/attendanceUtils';

interface AttendanceRowProps {
    log: AttendanceLog;
    targetUser: any;
    isLate: (log: AttendanceLog) => boolean;
    getProofUrl: (log: AttendanceLog) => string | null;
    getLocationDisplay: (log: AttendanceLog) => string;
    getWorkHours: (log: AttendanceLog) => string;
    getStatusConfig: (log: AttendanceLog, userStartDate?: Date) => any;
    holidays: any[];
    exceptions: any[];
    onResubmit: (log: AttendanceLog) => void;
    onViewProof: (proofUrl: string) => void;
    isHighlighted?: boolean;
    onClearHighlight?: () => void;
}

export const AttendanceRow: React.FC<AttendanceRowProps> = React.memo(({
    log,
    targetUser,
    isLate,
    getProofUrl,
    getLocationDisplay,
    getWorkHours,
    getStatusConfig,
    holidays,
    exceptions,
    onResubmit,
    onViewProof,
    isHighlighted,
    onClearHighlight
}) => {
    const rowRef = React.useRef<HTMLTableRowElement>(null);
    const [localHighlight, setLocalHighlight] = React.useState(false);
    const [isFading, setIsFading] = React.useState(false);

    React.useEffect(() => {
        if (isHighlighted) {
            setLocalHighlight(true);
            setIsFading(false);
            const scrollTimeout = setTimeout(() => {
                rowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 150);

            // Start fading out after 3 seconds
            const fadeTimeoutId = setTimeout(() => {
                setIsFading(true);
            }, 3000);

            // Fully clear highlight after 4 seconds (1 second fade duration)
            const clearTimeoutId = setTimeout(() => {
                setLocalHighlight(false);
                setIsFading(false);
                if (onClearHighlight) {
                    onClearHighlight();
                }
            }, 4000);

            return () => {
                clearTimeout(scrollTimeout);
                clearTimeout(fadeTimeoutId);
                clearTimeout(clearTimeoutId);
            };
        }
    }, [isHighlighted, onClearHighlight]);

    const noteText = log.note || '';

    // GPS Appeal check
    const isGpsAppealApproved = noteText.includes('[APPROVED GPS_SPOOF_APPEAL]');
    const isGpsAppealRejected = noteText.includes('[REJECTED GPS_SPOOF_APPEAL]') || noteText.includes('[REJECTED_GPS_SPOOF_APPEAL]');

    const late = isLate(log);
    const pendingItem = findPendingRegistryItemByNote(log.note || '');
    const isProvisionalLate = pendingItem?.id === 'LATE_ENTRY';
    const isProvisionalGpsAppeal = (pendingItem?.id === 'GPS_SPOOF_APPEAL' || noteText.includes('[PROVISIONAL_GPS_SPOOF_APPEAL]') || noteText.includes('[GPS_SPOOF_APPEAL_PENDING]')) && !isGpsAppealApproved && !isGpsAppealRejected;
    const isAppeal = log.status === 'APPEAL' || isProvisionalLate || isProvisionalGpsAppeal;
    const proof = getProofUrl(log);
    const statusConfig = getStatusConfig(log, targetUser?.startDate ? new Date(targetUser.startDate) : undefined);
    const StatusIcon = statusConfig.icon;
    const isLeave = log.status === 'LEAVE' || log.workType === 'LEAVE';
    const isPending = log.status === 'PENDING_VERIFY';
    const isNotStarted = statusConfig.label === 'ยังไม่เริ่มงาน';
    const workTypeStyles = getWorkTypeStyles(log.workType);
    
    // Check if it's a late correction (over 3 days)
    const isLateCorrection = log.status === 'ACTION_REQUIRED' && getWorkingDaysDifference(new Date(log.date), new Date(), holidays, exceptions, targetUser) > 3;

    // Check if user forgot to clock out
    const isForgotClockOut = 
        !!log.checkInTime && 
        !log.checkOutTime && 
        !isPending && 
        !isLeave && 
        !isNotStarted && 
        log.status !== 'ABSENT' && 
        log.status !== 'NO_SHOW' && 
        !isSameDay(new Date(log.date), new Date());

    // 1. กลุ่มคำขอ กลับก่อนเวลา (EARLY_LEAVE)
    const isEarlyLeavePending = noteText.includes('[PROVISIONAL_CHECKOUT]') && noteText.includes('[EARLY:');
    const isEarlyLeaveAccept = noteText.includes('[ACCEPT_PENALTY]');
    const isEarlyLeaveRejected = noteText.includes('[REJECTED EARLY_LEAVE_APPEAL]');
    
    // 2. กลุ่มคำขอ ลงเวลานอกพื้นที่ (OUT_OF_RANGE_CHECKOUT)
    const isOutOfRangeApproved = noteText.includes('[APPROVED OUT_OF_RANGE_CHECKOUT]');
    const isOutOfRangeRejected = noteText.includes('[REJECTED OUT_OF_RANGE_CHECKOUT]');
    const isOutOfRangePending = noteText.includes('[PROVISIONAL_CHECKOUT]') && noteText.includes('(Location Mismatch)') && !isOutOfRangeApproved && !isOutOfRangeRejected;
    
    // 3. กลุ่มคำขอ ลืมเช็คเอาท์ (FORGOT_CHECKOUT)
    const isForgotCheckOutApproved = noteText.includes('[APPROVED FORGOT_CHECKOUT]');
    const isForgotCheckOutRejected = noteText.includes('[REJECTED FORGOT_CHECKOUT]');
    const isForgotCheckOutPending = noteText.includes('[PROVISIONAL_CHECKOUT]') && !noteText.includes('[EARLY:') && !noteText.includes('(Location Mismatch)') && !isForgotCheckOutApproved && !isForgotCheckOutRejected;

    return (
        <tr 
            ref={rowRef}
            id={`attendance-row-${log.id}`}
            style={localHighlight ? {
                '--rainbow-alpha': isFading ? '0' : '0.75'
            } as React.CSSProperties : undefined}
            className={`transition-all duration-1000 group ${
                localHighlight
                    ? 'bg-rainbow-pastel animate-gradient-x-slow hover:opacity-95'
                    : isForgotClockOut 
                    ? 'bg-orange-50 hover:bg-orange-100/80 border-l-4 border-l-orange-500' 
                    : 'hover:bg-indigo-50/30'
            }`}
        >
            <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${isSameDay(new Date(log.date), new Date()) ? 'bg-indigo-500 animate-pulse' : 'bg-gray-300'}`}></div>
                    <div>
                        <span className="block text-sm font-bold text-gray-700">{format(new Date(log.date), 'd MMM yyyy')}</span>
                        <span className="text-[10px] text-gray-400 font-medium">{format(new Date(log.date), 'EEEE', { locale: th })}</span>
                    </div>
                </div>
            </td>
            <td className="px-6 py-4">
                {log.status === 'ACTION_REQUIRED' ? (
                    <button 
                        onClick={() => onResubmit(log)}
                        className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold border transition-colors shadow-sm ${
                            isLateCorrection 
                                ? 'bg-gray-500 text-white border-gray-600 hover:bg-gray-600' 
                                : 'bg-red-600 text-white border-red-700 hover:bg-red-700 animate-pulse'
                        }`}
                    >
                        <AlertTriangle className="w-3 h-3" /> 
                        {isLateCorrection ? 'ลงเวลาย้อนหลัง' : 'แก้ไขด่วน!'}
                    </button>
                ) : (
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-lg border uppercase tracking-wide flex items-center w-fit gap-1.5 ${statusConfig.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusConfig.label}
                    </span>
                )}
            </td>
            <td className="px-6 py-4">
                {log.checkInTime ? (
                    <div>
                        <span className={`font-mono font-semibold text-sm ${isGpsAppealApproved ? 'text-emerald-600' : isGpsAppealRejected ? 'text-rose-600' : isProvisionalGpsAppeal ? 'text-rose-600' : isAppeal ? 'text-violet-600' : late ? 'text-red-500' : 'text-emerald-600'}`}>
                            {format(log.checkInTime, 'HH:mm')}
                            {isGpsAppealApproved ? (
                                <span className="ml-2 text-[9px] bg-emerald-100 font-bold px-1.5 py-0.5 rounded text-emerald-700 uppercase border border-emerald-200">🟢 GPS APPROVED</span>
                            ) : isGpsAppealRejected ? (
                                <span className="ml-2 text-[9px] bg-rose-100 font-bold px-1.5 py-0.5 rounded text-rose-700 uppercase border border-rose-200">🔴 REJECTED GPS</span>
                            ) : isProvisionalGpsAppeal ? (
                                <span className="ml-2 text-[9px] bg-rose-100 font-bold px-1.5 py-0.5 rounded text-rose-700 uppercase border border-rose-200">🚨 GPS จำลอง</span>
                            ) : isAppeal ? (
                                <span className="ml-2 text-[9px] bg-violet-100 font-medium px-1.5 py-0.5 rounded text-violet-700 uppercase">APPEAL</span>
                            ) : null}
                            {!isAppeal && !isGpsAppealApproved && late && <span className="ml-2 text-[9px] bg-red-100 font-medium px-1.5 py-0.5 rounded text-red-700 uppercase">LATE</span>}
                        </span>
                        {(() => {
                            const matchShift = log.note?.match(/\[TARGET_SHIFT:([^\]]+)\]/) || log.note?.match(/\[TIME:([0-9]{2}:[0-9]{2})\]/);
                            const matchActual = log.note?.match(/\[ACTUAL_CHECK_IN:([^\]]+)\]/);
                            if (!matchShift) return null;
                            
                            const shiftTimeStr = matchShift[1];
                            let actualTimeStr = '';
                            if (matchActual && matchActual[1]) {
                                const parts = matchActual[1].split(':');
                                if (parts.length >= 2) {
                                    actualTimeStr = `${parts[0]}:${parts[1]}`;
                                } else {
                                    actualTimeStr = matchActual[1];
                                }
                            }

                            return (
                                <div className="space-y-0.5 mt-1">
                                    <span className="inline-flex items-center gap-1 text-[10px] text-teal-700 font-semibold bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200/70 w-fit">
                                        <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
                                        กะ {shiftTimeStr} น.
                                    </span>
                                    {actualTimeStr && (
                                        <span className="block text-[10px] text-slate-400 font-medium italic">
                                            (กดจริง {actualTimeStr} น.)
                                        </span>
                                    )}
                                </div>
                            );
                        })()}
                    </div>
                ) : (isLeave || isNotStarted) ? <span className="text-xs text-gray-400">-</span> : <span className="text-gray-300 text-xs">--:--</span>}
            </td>
            <td className="px-6 py-4">
                {log.checkOutTime ? (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 flex-wrap">
                        <span className="font-mono font-bold text-sm text-gray-600">
                            {format(log.checkOutTime, 'HH:mm')}
                        </span>
                        
                        {/* 1. กลับก่อนเวลาอุทธรณ์ */}
                        {isEarlyLeavePending && (
                            <span className="text-[9px] font-bold bg-amber-50 text-amber-600 border border-amber-200 px-1.5 py-0.5 rounded uppercase tracking-wide">
                                🟠 APPEAL
                            </span>
                        )}
                        {/* 2. นอกพื้นที่อุทธรณ์ */}
                        {isOutOfRangePending && (
                            <span className="text-[9px] font-bold bg-violet-50 text-violet-600 border border-violet-200 px-1.5 py-0.5 rounded uppercase tracking-wide">
                                🟣 OUT OF RANGE
                            </span>
                        )}
                        {/* 3. ลืมออกอุทธรณ์ */}
                        {isForgotCheckOutPending && (
                            <span className="text-[9px] font-bold bg-yellow-50 text-yellow-600 border border-yellow-200 px-1.5 py-0.5 rounded uppercase tracking-wide">
                                🟡 FORGOT
                            </span>
                        )}
                        
                        {/* 4. นอกพื้นที่อนุมัติผ่าน */}
                        {isOutOfRangeApproved && (
                            <span className="text-[9px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200 px-1.5 py-0.5 rounded uppercase tracking-wide">
                                🟢 GPS APPROVED
                            </span>
                        )}
                        {/* 5. แก้เวลาลืมออกอนุมัติผ่าน */}
                        {isForgotCheckOutApproved && (
                            <span className="text-[9px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200 px-1.5 py-0.5 rounded uppercase tracking-wide">
                                🟢 APPROVED
                            </span>
                        )}
                        
                        {/* 6. กลับก่อนเวลา (ตัดแต้ม/ปฏิเสธ) */}
                        {(isEarlyLeaveAccept || isEarlyLeaveRejected) && (
                            <span className="text-[9px] font-bold bg-rose-50 text-rose-600 border border-rose-200 px-1.5 py-0.5 rounded uppercase tracking-wide">
                                🔴 EARLY
                            </span>
                        )}
                        {/* 7. นอกพื้นที่โดนปฏิเสธ */}
                        {isOutOfRangeRejected && (
                            <span className="text-[9px] font-bold bg-red-50 text-red-600 border border-red-200 px-1.5 py-0.5 rounded uppercase tracking-wide">
                                🔴 REJECTED GPS
                            </span>
                        )}
                        {/* 8. ลืมออกโดนปฏิเสธ */}
                        {isForgotCheckOutRejected && (
                            <span className="text-[9px] font-bold bg-red-50 text-red-600 border border-red-200 px-1.5 py-0.5 rounded uppercase tracking-wide">
                                🔴 REJECTED
                            </span>
                        )}
                    </div>
                ) : isPending ? (
                    <span className="text-orange-500 italic text-xs font-bold flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin"/> รออนุมัติ</span>
                ) : (isLeave || isNotStarted) ? (
                    <span className="text-xs text-gray-400">-</span>
                ) : (log.status === 'ABSENT' || log.status === 'NO_SHOW' || !log.checkInTime) ? (
                    <span className="text-red-400 text-xs font-bold flex items-center gap-1 bg-red-50 px-2 py-1 rounded-lg border border-red-100 opacity-70">
                        <XCircle className="w-3 h-3" /> ขาดงาน
                    </span>
                ) : isSameDay(new Date(log.date), new Date()) ? (
                    <span className="text-indigo-500 italic text-xs font-bold flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin"/> Working...</span>
                ) : (
                    <span className="text-red-500 text-xs font-bold flex items-center gap-1 bg-red-50 px-2 py-1 rounded-lg border border-red-100">
                        <AlertTriangle className="w-3 h-3" /> ลืมลงออก
                    </span>
                )}
            </td>
            <td className="px-6 py-4">
                <div className="flex flex-col gap-1">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-lg border uppercase tracking-wide w-fit ${workTypeStyles.bg} ${workTypeStyles.text} ${workTypeStyles.border}`}>
                        {log.workType}
                    </span>
                    {!isLeave && (
                        <span className="text-xs text-gray-500 truncate max-w-[120px]" title={getLocationDisplay(log)}>
                            {getLocationDisplay(log)}
                        </span>
                    )}
                </div>
            </td>
            <td className="px-6 py-4 text-center">
                <span className="text-xs font-mono font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {isLeave ? '8h' : getWorkHours(log)}
                </span>
            </td>
            <td className="px-6 py-4 text-center">
                {proof ? (
                    <button 
                        onClick={() => onViewProof(proof)} 
                        className="p-1.5 bg-white border border-gray-200 hover:border-indigo-300 hover:text-indigo-600 rounded-lg text-gray-400 transition-all shadow-sm"
                    >
                        <ImageIcon className="w-4 h-4" />
                    </button>
                ) : (
                    <span className="text-gray-200 text-lg">•</span>
                )}
            </td>
        </tr>
    );
});

AttendanceRow.displayName = 'AttendanceRow';
export default AttendanceRow;
