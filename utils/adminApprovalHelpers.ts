import { eachDayOfInterval, isValid } from 'date-fns';
import { isWorkingDay } from './judgeUtils';
import { LeaveRequest } from '../types/attendance';
import { mergeAttendanceNotes, resolveAttendanceLogStatus } from '../lib/attendanceUtils';

export interface QuotaCheckResult {
    limit: number;
    approvedDaysCount: number;
    currentRequestedDays: number;
    totalUsedIfApproved: number;
    isExceeded: boolean;
}

/**
 * Calculations for checking a user's leave requests against their master quotas.
 */
export function checkLeaveQuota(
    request: LeaveRequest,
    userApprovedRequests: any[] | null,
    masterOptions: any[] | null,
    annualHolidays: any[],
    calendarExceptions: any[]
): QuotaCheckResult {
    const selectedOption = (masterOptions || []).find(o => o.key === request.type);
    let limit = 999;
    if (selectedOption?.description) {
        try {
            const metadata = JSON.parse(selectedOption.description);
            limit = metadata.defaultQuota || 999;
        } catch (e) {
            // ignore
        }
    }

    let approvedDaysCount = 0;
    if (userApprovedRequests) {
        for (const req of userApprovedRequests) {
            const start = new Date(req.start_date);
            const end = new Date(req.end_date);
            if (isValid(start) && isValid(end) && start <= end) {
                const days = eachDayOfInterval({ start, end });
                const workingDaysCount = days.filter(d => 
                    isWorkingDay(d, annualHolidays || [], calendarExceptions || [], request.user as any)
                ).length;
                approvedDaysCount += workingDaysCount;
            }
        }
    }

    // Calculate days for current request
    const days = eachDayOfInterval({ start: request.startDate, end: request.endDate });
    const currentRequestedDays = days.filter(d => 
        isWorkingDay(d, annualHolidays || [], calendarExceptions || [], request.user as any)
    ).length;

    const totalUsedIfApproved = approvedDaysCount + currentRequestedDays;

    return {
        limit,
        approvedDaysCount,
        currentRequestedDays,
        totalUsedIfApproved,
        isExceeded: limit < 999 && totalUsedIfApproved > limit
    };
}

/**
 * Builds administrative audit logs for Overtime (OT) adjustments.
 */
export function buildOtAuditLog(
    origStart: string,
    origEnd: string,
    origHours: number,
    newStart: string,
    newEnd: string,
    finalHours: number,
    adminNote?: string,
    isTimeModified?: boolean
): { auditLogText: string; finalDbNote: string } {
    let auditLogText = '';
    if (isTimeModified) {
        const origStartStr = origStart.substring(0, 5);
        const origEndStr = origEnd.substring(0, 5);
        const newStartStr = newStart.substring(0, 5);
        const newEndStr = newEnd.substring(0, 5);
        
        auditLogText = `⚙️ [แอดมินแก้ไขสิทธิ์และเวลาปฏิบัติงาน]\n• เวลาเดิม: ${origStartStr} - ${origEndStr} น. (${origHours.toFixed(2)} ชม.)\n• เวลาใหม่: ${newStartStr} - ${newEndStr} น. (${finalHours.toFixed(2)} ชม.)`;
    }

    let finalDbNote = '';
    if (auditLogText) {
        finalDbNote = auditLogText;
        if (adminNote) {
            finalDbNote += `\n----------------------------------\n📝 บันทึกจากแอดมิน: ${adminNote}`;
        }
    } else if (adminNote) {
        finalDbNote = adminNote;
    }

    return { auditLogText, finalDbNote };
}

export interface AttendanceCorrectionPayloadOptions {
    userId: string;
    date: string;
    type: 'FORGOT_BOTH' | 'FORGOT_CHECKIN' | 'LATE_ENTRY' | 'LEAVE';
    checkInTime?: string;
    checkOutTime?: string;
    reason?: string;
    originalStatusNote?: string;
    existingNote?: string | null;
    leaveType?: string;
    isLate?: boolean;
}

/**
 * Formats data payloads for inserting or updating attendance records.
 */
export function buildAttendanceCorrectionPayload({
    userId,
    date,
    type,
    checkInTime,
    checkOutTime,
    reason = '',
    originalStatusNote = '',
    existingNote = '',
    leaveType = '',
    isLate = false
}: AttendanceCorrectionPayloadOptions) {
    if (type === 'FORGOT_BOTH') {
        const finalNote = mergeAttendanceNotes(existingNote, `${originalStatusNote}[APPROVED FORGOT_BOTH] ${reason}`);
        const resolvedStatus = resolveAttendanceLogStatus(checkInTime, checkOutTime, finalNote);
        return {
            user_id: userId,
            date: date,
            check_in_time: checkInTime,
            check_out_time: checkOutTime,
            work_type: 'OFFICE',
            status: resolvedStatus,
            note: finalNote
        };
    } else if (type === 'FORGOT_CHECKIN' || type === 'LATE_ENTRY') {
        const finalNote = mergeAttendanceNotes(existingNote, `${originalStatusNote}[APPROVED ${type}] ${reason}`);
        const payload: any = {
            user_id: userId,
            date: date,
            check_in_time: checkInTime,
            work_type: 'OFFICE',
            note: finalNote
        };

        if (checkOutTime) {
            payload.check_out_time = checkOutTime;
            const resolvedStatus = resolveAttendanceLogStatus(checkInTime, checkOutTime, finalNote);
            payload.status = resolvedStatus === 'COMPLETED' && (type === 'LATE_ENTRY' || isLate) ? 'LATE' : resolvedStatus;
        } else {
            payload.status = 'WORKING';
        }

        return payload;
    } else { // LEAVE
        return {
            user_id: userId,
            date: date,
            work_type: 'LEAVE',
            status: 'LEAVE',
            note: mergeAttendanceNotes(existingNote, `[APPROVED LEAVE: ${leaveType}] ${reason}`)
        };
    }
}
