import React, { useState, useMemo, useEffect } from 'react';
import { AttendanceLog, LeaveType, LocationDef, AttendanceStats, LeaveRequest } from '../../../types/attendance';
import { User } from '../../../types';
import { format } from 'date-fns';
import LeaveRequestModal from '../leave-request/LeaveRequestModal';
import { useLeaveRequests } from '../../../hooks/useLeaveRequests';
import { supabase } from '../../../lib/supabase';
import { useToast } from '../../../context/ToastContext';
import { useGlobalDialog } from '../../../context/GlobalDialogContext';
import { useCalendarExceptions } from '../../../hooks/useCalendarExceptions';
import { useAnnualHolidays } from '../../../hooks/useAnnualHolidays';
import { useMasterData } from '../../../hooks/useMasterData';
import { checkNeedsSelfieVerification } from '../../../lib/selfieUtils';
import { useUserSession } from '../../../context/UserSessionContext';
import { isWorkingDay } from '../../../utils/judgeUtils';

// Modular Sub-components
import { DriveStatusBanner } from './parts/status-card/DriveStatusBanner';
import { OutdatedSessionBanner } from './parts/status-card/OutdatedSessionBanner';
import { FinishedWorkDisplay } from './parts/status-card/FinishedWorkDisplay';
import { WorkingNowDisplay } from './parts/status-card/WorkingNowDisplay';
import { NotCheckedInDisplay } from './parts/status-card/NotCheckedInDisplay';

interface StatusCardProps {
    user: User;
    todayLog: AttendanceLog | null;
    outdatedLogs: AttendanceLog[];
    stats: AttendanceStats;
    todayActiveLeave: LeaveRequest | null;
    onCheckOut: (location?: { lat: number, lng: number }, locationName?: string, reason?: string, proofUrl?: string) => Promise<void>; 
    onCheckOutRequest: (type: LeaveType, start: Date, end: Date, reason: string, files?: File[]) => Promise<boolean>; 
    onOpenCheckIn: (isHoliday?: boolean) => void;
    onOpenLeave: (type?: any) => void;
    isDriveReady: boolean;
    isAuthenticated?: boolean;
    onConnectDrive?: () => void;
    onRetryDrive?: () => void;
    onRefresh?: () => void;
    availableLocations: LocationDef[];
    onNavigateToHistory?: () => void;
    startTime: string;
    lateBuffer: number;
    todayRequests?: any[];
    isDesktop?: boolean;
}

const StatusCard: React.FC<StatusCardProps> = ({ 
    user, todayLog, outdatedLogs, stats, todayActiveLeave, onCheckOut, onCheckOutRequest, onOpenCheckIn, onOpenLeave, isDriveReady, isAuthenticated, onConnectDrive, onRetryDrive, onRefresh, availableLocations, onNavigateToHistory,
    startTime, lateBuffer, todayRequests, isDesktop = false
}) => {
    const { showAlert } = useGlobalDialog(); 
    const { showToast } = useToast();

    const { masterOptions } = useMasterData();

    const selfieModeOpt = masterOptions?.find(o => o.type === 'WORK_CONFIG' && o.key === 'SELFIE_VERIFICATION_MODE');
    const selfieMode = selfieModeOpt?.label || 'ALWAYS_ON';
    const selfieDaysOpt = masterOptions?.find(o => o.type === 'WORK_CONFIG' && o.key === 'SELFIE_VERIFICATION_DAYS');
    const selfieDays = selfieDaysOpt?.label || '3';

    const isSelfieEnabled = checkNeedsSelfieVerification(user?.id || '', selfieMode, selfieDays, new Date(), user?.workDays);

    const [loadingTime, setLoadingTime] = useState(0);
    const [isTimeout, setIsTimeout] = useState(false);

    useEffect(() => {
        let interval: any;
        if (!isDriveReady && !isTimeout) {
            interval = setInterval(() => {
                setLoadingTime(prev => {
                    if (prev >= 20) {
                        setIsTimeout(true);
                        clearInterval(interval);
                        return prev;
                    }
                    return prev + 1;
                });
            }, 1000);
        } else if (isDriveReady) {
            setLoadingTime(0);
            setIsTimeout(false);
            if (interval) clearInterval(interval);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isDriveReady, isTimeout]);

    const handleRetry = () => {
        setLoadingTime(0);
        setIsTimeout(false);
        if (onRetryDrive) onRetryDrive();
    };

    const { exceptions } = useCalendarExceptions();
    const { annualHolidays } = useAnnualHolidays();
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const dayStatus = useMemo(() => {
        const currentCheckDate = time; 
        const todayStr = format(currentCheckDate, 'yyyy-MM-dd');
        
        const exception = exceptions.find(e => e.date === todayStr);
        if (exception) {
            if (exception.type === 'HOLIDAY') {
                return { mode: 'HOLIDAY', name: exception.description || 'วันหยุดพิเศษ' };
            }
            if (exception.type === 'WORK_DAY') {
                return { mode: 'SPECIAL_WORK', name: exception.description || 'วันทำงานพิเศษ' };
            }
        }

        const annual = annualHolidays.find(h => h.isActive && h.day === currentCheckDate.getDate() && h.month === (currentCheckDate.getMonth() + 1));
        if (annual) {
            return { mode: 'HOLIDAY', name: annual.name };
        }

        const isWorkDay = isWorkingDay(currentCheckDate, annualHolidays, exceptions, user);
        if (!isWorkDay) {
            const dayOfWeek = currentCheckDate.getDay();
            const dayNames = ['วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์'];
            return { mode: 'HOLIDAY', name: dayNames[dayOfWeek] || 'วันหยุดประจำสัปดาห์' };
        }

        return { mode: 'NORMAL', name: '' };
    }, [exceptions, annualHolidays, time, user]);

    const { otRequests } = useUserSession();

    const approvedFixedOtToday = useMemo(() => {
        const todayStr = format(time, 'yyyy-MM-dd');
        if (otRequests && user?.id) {
            const ot = otRequests.find(req => 
                String(req.userId) === String(user.id) && 
                req.date === todayStr && 
                req.status === 'APPROVED' &&
                (Boolean(req.isFixed) || req.reason?.includes('เหมาจ่าย') || Number(req.fixedAmount) > 0)
            );
            if (ot) return {
                id: String(ot.id),
                reason: ot.reason || 'ปฏิบัติงาน OT เหมาจ่ายตามที่ได้รับอนุมัติ',
                otHours: ot.otHours,
                fixedAmount: ot.fixedAmount
            };
        }
        if (todayActiveLeave?.type === 'OVERTIME' && todayActiveLeave.status === 'APPROVED' && (todayActiveLeave.reason?.includes('เหมาจ่าย') || (todayActiveLeave as any).isFixed)) {
            return {
                id: String(todayActiveLeave.id),
                reason: todayActiveLeave.reason || 'ปฏิบัติงาน OT เหมาจ่ายตามที่ได้รับอนุมัติ',
                otHours: 0,
                fixedAmount: 0
            };
        }
        return null;
    }, [otRequests, user?.id, time, todayActiveLeave]);

    const hasApprovedOT = useMemo(() => {
        if (approvedFixedOtToday) return true;
        if (!otRequests) return false;
        const todayStr = format(time, 'yyyy-MM-dd');
        return otRequests.some(req => 
            String(req.userId) === String(user.id) && 
            req.date === todayStr && 
            req.status === 'APPROVED'
        );
    }, [otRequests, user.id, time, approvedFixedOtToday]);

    const isBlockedByHoliday = useMemo(() => {
        return dayStatus.mode === 'HOLIDAY' && !hasApprovedOT;
    }, [dayStatus.mode, hasApprovedOT]);

    const isLeaveLog = (todayLog?.status === 'LEAVE' || todayLog?.workType === 'LEAVE') && !todayLog?.checkInTime;
    const isApprovedLeaveToday = todayActiveLeave?.status === 'APPROVED';

    const isGpsAppealRejectedToday = !!todayLog?.note?.includes('[REJECTED GPS_SPOOF_APPEAL]') || !!todayLog?.note?.includes('[REJECTED_GPS_SPOOF_APPEAL]');

    const isCheckedOut = !!todayLog?.checkOutTime;
    const isCheckedIn = !!todayLog && !!todayLog.checkInTime && !isLeaveLog && !isGpsAppealRejectedToday; 

    const isProvisionalForgotCheckin = useMemo(() => !!todayLog?.note?.includes('[PROVISIONAL_FORGOT_CHECKIN]'), [todayLog?.note]);
    const isProvisionalLate = useMemo(() => !!todayLog?.note?.includes('[PROVISIONAL_LATE_ENTRY]'), [todayLog?.note]);
    const isProvisionalCheckout = useMemo(() => !!todayLog?.note?.includes('[PROVISIONAL_CHECKOUT]'), [todayLog?.note]);
    const isProvisionalWfh = useMemo(() => !!todayLog?.note?.includes('[PROVISIONAL_WFH]'), [todayLog?.note]);
    const isProvisionalOnsite = useMemo(() => !!todayLog?.note?.includes('[PROVISIONAL_ONSITE]'), [todayLog?.note]);
    const isProvisionalGps = useMemo(() => (!!todayLog?.note?.includes('[PROVISIONAL_GPS_SPOOF_APPEAL]') || !!todayLog?.note?.includes('[GPS_SPOOF_APPEAL_PENDING]')) && !isGpsAppealRejectedToday, [todayLog?.note, isGpsAppealRejectedToday]);
    const isAppealPending = useMemo(() => (todayLog?.status === 'APPEAL' || !!todayLog?.note?.includes('[APPEAL_PENDING]')) && !isGpsAppealRejectedToday, [todayLog?.status, todayLog?.note, isGpsAppealRejectedToday]);
    const isPendingVerify = todayLog?.status === 'PENDING_VERIFY' && !isGpsAppealRejectedToday;

    const hasAnyProvisional = isProvisionalForgotCheckin || isProvisionalLate || isProvisionalCheckout || isProvisionalWfh || isProvisionalOnsite || isProvisionalGps || isAppealPending || isPendingVerify;
    
    const isAdmin = user.role === 'ADMIN';
    
    const [recoveryLogDate, setRecoveryLogDate] = useState<string | null>(null);

    const { leaveUsage, pendingUsage } = useLeaveRequests(user); 

    const handleRecoverySubmit = async (type: LeaveType, start: Date, end: Date, reason: string, files?: File[]) => {
        const targetLog = outdatedLogs.find(l => l.date === recoveryLogDate);
        if (isAdmin && targetLog) {
            try {
                const timeMatch = reason.match(/\[TIME:(\d{2}:\d{2})\]/);
                const timeStr = timeMatch ? timeMatch[1] : '18:00'; 
                
                const logDate = format(new Date(targetLog.date), 'yyyy-MM-dd');
                const fullDateTimeStr = `${logDate}T${timeStr}:00`;

                const { data: freshLog } = await supabase.from('attendance_logs').select('note').eq('id', targetLog.id).single();
                const currentNote = freshLog?.note || targetLog.note || '';
                
                const { error } = await supabase.from('attendance_logs')
                    .update({
                        check_out_time: new Date(fullDateTimeStr).toISOString(),
                        status: 'COMPLETED',
                        note: `${currentNote} [ADMIN FIXED: ${reason}]`.trim()
                    })
                    .eq('id', targetLog.id);

                if (error) throw error;
                
                showToast('แก้ไขเวลาออกเรียบร้อย (Admin Override) ✅', 'success');
                setRecoveryLogDate(null);
                if (onRefresh) onRefresh();
                return true;

            } catch (err: any) {
                console.error(err);
                showToast('แก้ไขไม่สำเร็จ: ' + err.message, 'error');
                return false;
            }
        } else {
            const success = await onCheckOutRequest('FORGOT_CHECKOUT', start, end, reason, files);
            if (success) {
                setRecoveryLogDate(null); 
                await showAlert(
                    'ระบบได้รับข้อมูลเวลาออกงานของคุณแล้ว สถานะของวันนี้จะเปลี่ยนเป็น "รอตรวจสอบ (Pending)" กรุณารอ Admin อนุมัติครับ',
                    'ส่งคำขอเรียบร้อยแล้ว! ✅'
                );
                if (onRefresh) onRefresh();
            }
            return success;
        }
    };

    const handleCheckOutRequest = async (timeStr: string, reason: string, requestType?: LeaveType) => {
        const now = new Date();
        const typeToSubmit = requestType || 'OUT_OF_RANGE_CHECKOUT';
        
        let cleanedReason = reason;
        const needsMismatchTag = typeToSubmit === 'OUT_OF_RANGE_CHECKOUT' || reason.includes('(Location Mismatch)');
        
        if (cleanedReason.includes('(Location Mismatch)')) {
            cleanedReason = cleanedReason.replace(/\s*\(Location Mismatch\)/g, '').trim();
        }
        
        const formattedReason = typeToSubmit === 'EARLY_LEAVE'
            ? `[EARLY:${timeStr}] ${cleanedReason}${needsMismatchTag ? ' (Location Mismatch)' : ''}`
            : `[TIME:${timeStr}] ${cleanedReason}${needsMismatchTag ? ' (Location Mismatch)' : ''}`;
            
        return await onCheckOutRequest(typeToSubmit, now, now, formattedReason);
    };

    const handleOvertimeSubmit = async (otMinutes: number, reason: string) => {
        const now = new Date();
        const success = await onCheckOutRequest('OVERTIME', now, now, reason);
        if (success) {
            await showAlert(
                `ส่งคำขออนุมัติการทำ OT เรียบร้อยแล้วครับ (${Math.floor(otMinutes / 60)} ชม. ${otMinutes % 60} นาที) กรุณารอแอดมินพิจารณาครับ ✨`,
                'ส่งคำขอ OT สำเร็จ!'
            );
            if (onRefresh) onRefresh();
        }
        return success;
    };

    return (
        <div className="space-y-3 relative z-10">
            {/* GOOGLE DRIVE STATUS BANNER */}
            <DriveStatusBanner
                isSelfieEnabled={isSelfieEnabled}
                isDriveReady={isDriveReady}
                isTimeout={isTimeout}
                loadingTime={loadingTime}
                isAuthenticated={!!isAuthenticated}
                onConnectDrive={onConnectDrive}
                onRetryDrive={handleRetry}
            />

            {/* OUTDATED SESSION BANNER */}
            <OutdatedSessionBanner
                outdatedLogs={outdatedLogs}
                onRecoveryClick={setRecoveryLogDate}
            />

            <LeaveRequestModal 
                isOpen={!!recoveryLogDate}
                onClose={() => setRecoveryLogDate(null)}
                onSubmit={handleRecoverySubmit}
                masterOptions={masterOptions}
                leaveUsage={leaveUsage}
                pendingUsage={pendingUsage}
                fixedType="FORGOT_CHECKOUT"
                initialDate={recoveryLogDate ? new Date(recoveryLogDate) : new Date()}
            />

            {/* MAIN STATUS DISPLAY */}
            {isCheckedOut ? (
                <FinishedWorkDisplay
                    todayLog={todayLog}
                    hasAnyProvisional={hasAnyProvisional}
                    isProvisionalForgotCheckin={isProvisionalForgotCheckin}
                    isProvisionalCheckout={isProvisionalCheckout}
                    isProvisionalWfh={isProvisionalWfh}
                    isProvisionalOnsite={isProvisionalOnsite}
                    isAppealPending={isAppealPending}
                    isPendingVerify={isPendingVerify}
                    onNavigateToHistory={onNavigateToHistory}
                    onOpenLeave={onOpenLeave}
                />
            ) : isCheckedIn ? (
                <WorkingNowDisplay
                    todayLog={todayLog!}
                    availableLocations={availableLocations}
                    onCheckOut={onCheckOut}
                    handleCheckOutRequest={handleCheckOutRequest}
                    handleOvertimeSubmit={handleOvertimeSubmit}
                    onNavigateToHistory={onNavigateToHistory}
                    onOpenLeave={onOpenLeave}
                    todayActiveLeave={todayActiveLeave}
                    isApprovedLeaveToday={isApprovedLeaveToday}
                    todayRequests={todayRequests}
                    isDesktop={isDesktop}
                />
            ) : (
                <NotCheckedInDisplay
                    dayStatus={dayStatus}
                    isBlockedByHoliday={isBlockedByHoliday}
                    isLeaveLog={isLeaveLog}
                    isApprovedLeaveToday={isApprovedLeaveToday}
                    todayActiveLeave={todayActiveLeave}
                    stats={stats}
                    onOpenCheckIn={onOpenCheckIn}
                    startTime={startTime}
                    lateBuffer={lateBuffer}
                    onCheckOutRequest={onCheckOutRequest}
                    leaveUsage={leaveUsage}
                    availableLocations={availableLocations}
                    onNavigateToHistory={onNavigateToHistory}
                    todayLog={todayLog}
                    onOpenLeave={onOpenLeave}
                    approvedFixedOtToday={approvedFixedOtToday}
                    isDesktop={isDesktop}
                />
            )}
        </div>
    );
};

export default StatusCard;
