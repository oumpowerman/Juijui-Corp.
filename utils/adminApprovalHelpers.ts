import { eachDayOfInterval, isValid } from 'date-fns';
import { isWorkingDay } from './judgeUtils';
import { LeaveRequest } from '../types/attendance';
import { mergeAttendanceNotes, resolveAttendanceLogStatus, getMaxShiftWithBuffer } from '../lib/attendanceUtils';
import { supabase } from '../lib/supabase';
import { getRegistryItem } from '../constants/attendanceRegistry';

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
    isTimeModified?: boolean,
    isFixed?: boolean
): { auditLogText: string; finalDbNote: string } {
    let auditLogText = '';
    if (isFixed) {
        auditLogText = `⚙️ [อนุมัติ OT แบบเหมาจ่าย (Lump-sum)]`;
    } else if (isTimeModified) {
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
    existingWorkType?: string;
    targetWorkType?: 'OFFICE' | 'WFH' | 'SITE' | string;
    isHalfDay?: boolean;
    halfDaySession?: 'AM' | 'PM' | null | string;
    existingStatus?: string;
    locationLat?: number | null;
    locationLng?: number | null;
    locationName?: string | null;
    checkOutLat?: number | null;
    checkOutLng?: number | null;
    checkOutLocationName?: string | null;
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
    isLate = false,
    existingWorkType,
    targetWorkType,
    isHalfDay = false,
    halfDaySession = null,
    existingStatus,
    locationLat,
    locationLng,
    locationName,
    checkOutLat,
    checkOutLng,
    checkOutLocationName
}: AttendanceCorrectionPayloadOptions) {
    let resolvedWorkType = targetWorkType || 'OFFICE';
    if (!targetWorkType) {
        const noteStr = existingNote || '';
        const reasonStr = reason || '';
        const combined = `${noteStr} ${reasonStr}`;

        if (existingWorkType === 'WFH' || existingWorkType === 'ONSITE' || existingWorkType === 'SITE') {
            resolvedWorkType = existingWorkType === 'ONSITE' ? 'SITE' : existingWorkType;
        } else if (combined.includes('[PROVISIONAL_WFH]') || combined.includes('[REMOTE:WFH]')) {
            resolvedWorkType = 'WFH';
        } else if (combined.includes('[PROVISIONAL_ONSITE]') || combined.includes('[REMOTE:ONSITE]') || combined.includes('[REMOTE:SITE]')) {
            resolvedWorkType = 'SITE';
        }
    }

    if (type === 'FORGOT_BOTH') {
        const finalNote = mergeAttendanceNotes(existingNote, `${originalStatusNote}[APPROVED FORGOT_BOTH] ${reason}`);
        const resolvedStatus = resolveAttendanceLogStatus(checkInTime, checkOutTime, finalNote);
        const finalStatus = resolvedStatus === 'COMPLETED' && isLate ? 'LATE' : resolvedStatus;
        return {
            user_id: userId,
            date: date,
            check_in_time: checkInTime,
            check_out_time: checkOutTime,
            work_type: resolvedWorkType,
            status: finalStatus,
            note: finalNote,
            ...(locationLat !== undefined && { location_lat: locationLat }),
            ...(locationLng !== undefined && { location_lng: locationLng }),
            ...(locationName !== undefined && { location_name: locationName }),
            ...(checkOutLat !== undefined && { check_out_lat: checkOutLat }),
            ...(checkOutLng !== undefined && { check_out_lng: checkOutLng }),
            ...(checkOutLocationName !== undefined && { check_out_location_name: checkOutLocationName })
        };
    } else if (type === 'FORGOT_CHECKIN' || type === 'LATE_ENTRY') {
        const finalNote = mergeAttendanceNotes(existingNote, `${originalStatusNote}[APPROVED ${type}] ${reason}`);
        const payload: any = {
            user_id: userId,
            date: date,
            check_in_time: checkInTime,
            work_type: resolvedWorkType,
            note: finalNote,
            ...(locationLat !== undefined && { location_lat: locationLat }),
            ...(locationLng !== undefined && { location_lng: locationLng }),
            ...(locationName !== undefined && { location_name: locationName }),
            ...(checkOutLat !== undefined && { check_out_lat: checkOutLat }),
            ...(checkOutLng !== undefined && { check_out_lng: checkOutLng }),
            ...(checkOutLocationName !== undefined && { check_out_location_name: checkOutLocationName })
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
        if (isHalfDay && checkInTime) {
            const halfDayTag = halfDaySession === 'AM' ? '[HALF_DAY:AM]' : '[HALF_DAY:PM]';
            const leaveNote = `${halfDayTag} [APPROVED LEAVE: ${leaveType}] ${reason}`;
            const finalNote = mergeAttendanceNotes(existingNote, leaveNote);
            return {
                user_id: userId,
                date: date,
                check_in_time: checkInTime,
                check_out_time: checkOutTime || null,
                work_type: existingWorkType || 'OFFICE',
                status: existingStatus || 'WORKING',
                note: finalNote,
                ...(locationLat !== undefined && { location_lat: locationLat }),
                ...(locationLng !== undefined && { location_lng: locationLng }),
                ...(locationName !== undefined && { location_name: locationName }),
                ...(checkOutLat !== undefined && { check_out_lat: checkOutLat }),
                ...(checkOutLng !== undefined && { check_out_lng: checkOutLng }),
                ...(checkOutLocationName !== undefined && { check_out_location_name: checkOutLocationName })
            };
        } else {
            const halfDayPrefix = isHalfDay ? (halfDaySession === 'AM' ? '[HALF_DAY:AM] ' : '[HALF_DAY:PM] ') : '';
            const leaveNote = `${halfDayPrefix}[APPROVED LEAVE: ${leaveType}] ${reason}`;
            return {
                user_id: userId,
                date: date,
                work_type: 'LEAVE',
                status: 'LEAVE',
                note: mergeAttendanceNotes(existingNote, leaveNote)
            };
        }
    }
}

/**
 * Parses Work Configuration values from masterOptions.
 */
export function parseWorkConfig(masterOptions: any[]) {
    const configData = (masterOptions || []).filter(o => o.type === 'WORK_CONFIG');
    const startTime = configData.find(c => c.key === 'START_TIME')?.label || '10:00';
    const lateBuffer = parseInt(configData.find(c => c.key === 'LATE_BUFFER')?.label || '15', 10);
    const shiftsEnabled = configData.find(c => c.key === 'MULTIPLE_SHIFTS_ENABLED')?.label === 'true';
    const shiftsList = configData.find(c => c.key === 'MULTIPLE_SHIFTS_LIST')?.label || '';
    return {
        startTime,
        lateBuffer,
        multipleShifts: {
            enabled: shiftsEnabled,
            shiftsList
        }
    };
}

/**
 * Removes temporary tags, pending flags, mismatch text, and normalizes whitespaces in attendance notes.
 */
export function cleanAttendanceNoteTags(
    existingNote: string,
    requestType: string,
    extraTagsToClean: string[] = []
): string {
    let cleaned = existingNote || '';
    const registryItem = getRegistryItem(requestType);
    
    if (registryItem) {
        const tagsToClean = [
            registryItem.tags.pending,
            registryItem.tags.provisional,
            '[APPEAL_PENDING]'
        ].filter(Boolean) as string[];
        
        tagsToClean.forEach(tag => {
            const escaped = tag.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
            cleaned = cleaned.replace(new RegExp(escaped, 'g'), '');
        });
    }

    // Dynamic clean for provisional tags with values (e.g. [PROVISIONAL_WFH:some_reason])
    if (registryItem?.tags?.provisional) {
        const innerText = registryItem.tags.provisional.replace(/^\[|\]$/g, '');
        const escapedInner = innerText.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        cleaned = cleaned.replace(new RegExp(`\\[${escapedInner}(:.*?)?\\]`, 'g'), '');
    }

    // Dynamic clean for extra tags
    extraTagsToClean.forEach(tag => {
        const escaped = tag.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        cleaned = cleaned.replace(new RegExp(escaped, 'g'), '');
    });

    return cleaned
        .replace(/\(Location Mismatch\)/g, '')
        .replace(/\[Location Mismatch\]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Decides the target work type (OFFICE, WFH, SITE) based on approved requests, tags, and previous history.
 */
export async function deduceTargetWorkType({
    userId,
    dateStr,
    requestReason,
    existingNote,
    existingWorkType
}: {
    userId: string;
    dateStr: string;
    requestReason?: string;
    existingNote?: string | null;
    existingWorkType?: string | null;
}): Promise<'OFFICE' | 'WFH' | 'SITE'> {
    // 1. Check for approved WFH / ONSITE leave requests on that day
    const { data: approvedRemoteReq } = await supabase
        .from('leave_requests')
        .select('type')
        .eq('user_id', userId)
        .eq('start_date', dateStr)
        .in('type', ['WFH', 'ONSITE'])
        .eq('status', 'APPROVED')
        .maybeSingle();

    if (approvedRemoteReq) {
        return approvedRemoteReq.type === 'WFH' ? 'WFH' : 'SITE';
    }

    // 2. Detect from text-based tags in reason or existing notes
    const combinedText = `${requestReason || ''} ${existingNote || ''}`;
    if (combinedText.includes('[REMOTE:WFH]') || combinedText.includes('[PROVISIONAL_WFH]')) {
        return 'WFH';
    }
    if (combinedText.includes('[REMOTE:ONSITE]') || combinedText.includes('[REMOTE:SITE]') || combinedText.includes('[PROVISIONAL_ONSITE]')) {
        return 'SITE';
    }

    // 3. Fallback to existing work type
    if (existingWorkType === 'WFH' || existingWorkType === 'SITE' || existingWorkType === 'ONSITE') {
        return existingWorkType === 'ONSITE' ? 'SITE' : (existingWorkType as any);
    }

    return 'OFFICE';
}

/**
 * Extracts start time, end time, hours, and cleans OT metadata from Overtime reason strings.
 */
export function parseOtDetailsFromReason(reason: string) {
    const cleanReasonText = reason || '';
    const otRangeMatch = cleanReasonText.match(/\[OT:(\d{2}:\d{2}-\d{2}:\d{2})\]/);
    const originalTimeRange = otRangeMatch ? otRangeMatch[1] : '18:30-20:30';
    const [origStart, origEnd] = originalTimeRange.split('-');
    
    const otHoursMatch = cleanReasonText.match(/\(([\d\.]+)hr\)/) || cleanReasonText.match(/\[OT:([\d\.]+)hr\]/);
    const origHours = otHoursMatch ? parseFloat(otHoursMatch[1]) : 2.0;

    const cleanReason = cleanReasonText
        .replace(/\[OT:\d{2}:\d{2}-\d{2}:\d{2}\]\s*\([\d\.]+hr\)\s*/g, '')
        .replace(/\[OT:[\d\.]+hr\]\s*/g, '')
        .replace(/\[OT_MINUTES:\d+\]/g, '')
        .trim();

    return { origStart, origEnd, origHours, cleanReason };
}

/**
 * Evaluates conditions and returns/refunds HP to employee if eligible.
 */
export async function processHpRefundIfEligible({
    userId,
    dateStr,
    statusBefore,
    noteBefore,
    behavior,
    reason,
    processAction
}: {
    userId: string;
    dateStr: string;
    statusBefore?: string;
    noteBefore?: string | null;
    behavior: any;
    reason: string;
    processAction: (userId: string, actionType: any, payload?: any) => Promise<any>;
}) {
    const isLateSubmission = reason.includes('[LATE_SUBMISSION]');
    if (isLateSubmission) return;

    const absentDesc = behavior?.refundDescriptionAbsent 
        ? `คืนค่า HP ${behavior.refundDescriptionAbsent} ${dateStr}` 
        : `คืนค่า HP จากการแก้สถานะขาดงานวันที่ ${dateStr}`;
        
    const penalizedDesc = behavior?.refundDescriptionPenalized 
        ? `คืนค่า HP ${behavior.refundDescriptionPenalized} ${dateStr}` 
        : `คืนค่า HP จากการแก้เวลาออกงานวันที่ ${dateStr}`;

    if (statusBefore === 'ABSENT' || noteBefore?.includes('[ORIGINALLY: ABSENT]')) {
        await processAction(userId, 'ATTENDANCE_ABSENT_REFUND', {
            originalDescription: absentDesc
        });
    } else if (noteBefore?.includes('[SYSTEM] Penalized')) {
        await processAction(userId, 'ATTENDANCE_CORRECTION_REFUND', {
            originalDescription: penalizedDesc
        });
    }
}

/**
 * Validates check-in time against the max shift + buffer configuration.
 */
export function validateCheckInTime(
    time: string, 
    masterOptions: any[]
): { isValid: boolean; maxAllowedTimeStr: string; maxShiftTimeStr: string; bufferMinutes: number } {
    const { maxAllowedTimeStr, maxShiftTimeStr, bufferMinutes } = getMaxShiftWithBuffer(masterOptions);
    
    const padTime = (timeStr: string) => {
        const clean = timeStr.replace(/[^\d:]/g, '').trim();
        const parts = clean.split(':');
        if (parts.length < 2) return clean;
        return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
    };

    const normalizedTime = padTime(time);
    const normalizedMaxAllowed = padTime(maxAllowedTimeStr);

    const isValid = normalizedTime <= normalizedMaxAllowed;
    return {
        isValid,
        maxAllowedTimeStr,
        maxShiftTimeStr,
        bufferMinutes
    };
}

