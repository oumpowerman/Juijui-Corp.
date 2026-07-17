import { supabase } from '../../lib/supabase';
import { LeaveRequest } from '../../types/attendance';
import { format, eachDayOfInterval } from 'date-fns';
import { buildOtAuditLog, buildAttendanceCorrectionPayload } from '../../utils/adminApprovalHelpers';
import { checkIsLate, getLateMinutes, mergeAttendanceNotes } from '../../lib/attendanceUtils';
import { publishToTeamChannel } from './communicationHelpers';

/**
 * Handles approval logic for Special Work Requests: WFH, ONSITE, and OVERTIME.
 */
export async function approveSpecialWorkRequest({
    request,
    customOtHours,
    customStartTime,
    customEndTime,
    adminNote,
    processAction
}: {
    request: LeaveRequest;
    customOtHours?: number;
    customStartTime?: string;
    customEndTime?: string;
    adminNote?: string;
    processAction: (userId: string, actionType: any, payload?: any) => Promise<any>;
}) {
    let finalDbNote = adminNote || '';
    let isTimeModified = false;
    let updatedReason = request.reason;

    if (request.type === 'OVERTIME') {
        isTimeModified = (customStartTime !== undefined) || (customEndTime !== undefined) || (customOtHours !== undefined);
        if (isTimeModified) {
            let cleanReasonText = request.reason || '';
            const otRangeMatch = cleanReasonText.match(/\[OT:(\d{2}:\d{2}-\d{2}:\d{2})\]/);
            const originalTimeRange = otRangeMatch ? otRangeMatch[1] : '18:30-20:30';
            const [origStart, origEnd] = originalTimeRange.split('-');
            
            const otHoursMatch = cleanReasonText.match(/\(([\d\.]+)hr\)/) || cleanReasonText.match(/\[OT:([\d\.]+)hr\]/);
            const origHours = otHoursMatch ? parseFloat(otHoursMatch[1]) : 2.0;

            cleanReasonText = cleanReasonText
                .replace(/\[OT:\d{2}:\d{2}-\d{2}:\d{2}\]\s*\([\d\.]+hr\)\s*/g, '')
                .replace(/\[OT:[\d\.]+hr\]\s*/g, '')
                .replace(/\[OT_MINUTES:\d+\]/g, '')
                .trim();

            const newStart = customStartTime || origStart;
            const newEnd = customEndTime || origEnd;
            const newHours = customOtHours !== undefined ? customOtHours : origHours;

            updatedReason = `[OT:${newStart}-${newEnd}] (${newHours}hr) ${cleanReasonText}`;
            
            const { finalDbNote: computedDbNote } = buildOtAuditLog(
                origStart,
                origEnd,
                origHours,
                newStart,
                newEnd,
                newHours,
                adminNote,
                true
            );
            finalDbNote = computedDbNote;
        }
    }

    if (request.type === 'OVERTIME' && isTimeModified) {
        await supabase.from('leave_requests')
            .update({ reason: updatedReason })
            .eq('id', request.id);
    }

    if (request.type === 'WFH' || request.type === 'ONSITE') {
        const shiftDateStr = format(request.startDate, 'yyyy-MM-dd');
        const { data: freshLog } = await supabase
            .from('attendance_logs')
            .select('id, note, check_out_time')
            .eq('user_id', request.userId)
            .eq('date', shiftDateStr)
            .maybeSingle();

        if (freshLog) {
            let newNote = freshLog.note || '';
            if (request.type === 'WFH') {
                newNote = newNote
                    .replace(/\[PROVISIONAL_WFH\]/g, '')
                    .replace(/\[UNAUTHORIZED_WFH\]/g, '')
                    .replace(/\s+/g, ' ')
                    .trim();
            } else if (request.type === 'ONSITE') {
                newNote = newNote
                    .replace(/\[PROVISIONAL_ONSITE\]/g, '')
                    .replace(/\s+/g, ' ')
                    .trim();
            }
            
            const targetStatus = freshLog.check_out_time ? 'COMPLETED' : 'WORKING';

            await supabase.from('attendance_logs')
                .update({ 
                    note: newNote,
                    status: targetStatus
                })
                .eq('id', freshLog.id);
        }

        if (request.type === 'WFH') {
            await publishToTeamChannel(`🏠 **${request.user?.name}** ได้รับอนุมัติ WFH (อย่าลืม Check-in เมื่อเริ่มงานนะ!)`);
        } else if (request.type === 'ONSITE') {
            await publishToTeamChannel(`📍 **${request.user?.name}** ได้รับอนุมัติปฏิบัติงาน Onsite นอกสถานที่แล้ว`);
        }
    } else if (request.type === 'OVERTIME') {
        const shiftDateStr = format(request.startDate, 'yyyy-MM-dd');
        const { data: freshLog } = await supabase
            .from('attendance_logs')
            .select('id, note')
            .eq('user_id', request.userId)
            .eq('date', shiftDateStr)
            .maybeSingle();

        if (freshLog) {
            const newNote = (freshLog.note || '')
                .replace('[OT_PENDING:', '[OT_APPROVED:')
                .trim();
            await supabase.from('attendance_logs')
                .update({ note: newNote })
                .eq('id', freshLog.id);
        }

        let otHours = 0;
        if (customOtHours !== undefined) {
            otHours = customOtHours;
        } else {
            const otMinutesMatch = request.reason ? request.reason.match(/\[OT_MINUTES:(\d+)\]/) : null;
            const otMinutes = otMinutesMatch ? parseInt(otMinutesMatch[1], 10) : 60;
            otHours = parseFloat((otMinutes / 60).toFixed(1));
        }

        await processAction(request.userId, 'ATTENDANCE_OVERTIME', { 
            hours: otHours, 
            id: `OT_REWARD:${request.id}` 
        });
    }

    return { finalDbNote, updatedReason, isTimeModified };
}

/**
 * Handles approval logic for Attendance Corrections: LATE_ENTRY, FORGOT_BOTH, FORGOT_CHECKIN, FORGOT_CHECKOUT.
 */
export async function approveAttendanceCorrection({
    request,
    customStartTime,
    masterOptions,
    processAction
}: {
    request: LeaveRequest;
    customStartTime?: string;
    masterOptions: any[];
    processAction: (userId: string, actionType: any, payload?: any) => Promise<any>;
}) {
    const timeMatch = request.reason.match(/\[TIME:(\d{2}:\d{2})(-\d{2}:\d{2})?\]/);
    const timeStr = customStartTime || (timeMatch ? timeMatch[1] : '00:00');
    const endTimeStr = timeMatch && timeMatch[2] ? timeMatch[2].substring(1) : null;
    const shiftDateStr = format(request.startDate, 'yyyy-MM-dd');

    const { data: freshLog } = await supabase
        .from('attendance_logs')
        .select('*')
        .eq('user_id', request.userId)
        .eq('date', shiftDateStr)
        .maybeSingle();

    if (request.type === 'FORGOT_CHECKIN' && customStartTime) {
        const updatedReason = request.reason.replace(/\[TIME:\d{2}:\d{2}\]/g, `[TIME:${customStartTime}]`);
        await supabase.from('leave_requests')
            .update({ reason: updatedReason })
            .eq('id', request.id);
    }

    if (request.type === 'LATE_ENTRY' && freshLog) {
        const actualCheckInDateTime = freshLog.check_in_time ? new Date(freshLog.check_in_time) : null;
        const approvedLateDateTime = new Date(`${shiftDateStr}T${timeStr}:00`);
        
        let isActuallyLate = false;
        if (actualCheckInDateTime && actualCheckInDateTime > approvedLateDateTime) {
            isActuallyLate = true;
        }

        const newNote = `${freshLog.note || ''} [APPROVED LATE_ENTRY] ${request.reason}`
            .replace('[APPEAL_PENDING]', '')
            .replace(/\[PROVISIONAL_LATE_ENTRY(:.*?)?\]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
        const targetStatus = freshLog.check_out_time 
            ? (isActuallyLate ? 'LATE' : 'COMPLETED') 
            : 'WORKING';

        await supabase.from('attendance_logs')
            .update({ status: targetStatus, note: newNote })
            .eq('id', freshLog.id);
    } else if (request.type === 'FORGOT_BOTH') {
        const checkInDateTime = new Date(`${shiftDateStr}T${timeStr}:00`);
        const checkOutDateTime = new Date(`${shiftDateStr}T${endTimeStr || '18:00'}:00`);
        const originalStatusNote = freshLog?.status === 'ABSENT' ? '[ORIGINALLY: ABSENT] ' : '';

        const payload = buildAttendanceCorrectionPayload({
            userId: request.userId,
            date: shiftDateStr,
            type: 'FORGOT_BOTH',
            checkInTime: checkInDateTime.toISOString(),
            checkOutTime: checkOutDateTime.toISOString(),
            reason: request.reason,
            originalStatusNote,
            existingNote: freshLog?.note
        });
        await supabase.from('attendance_logs').upsert(payload, { onConflict: 'user_id, date' });
    } else if (request.type === 'FORGOT_CHECKIN' || request.type === 'LATE_ENTRY') {
        const checkInDateTime = new Date(`${shiftDateStr}T${timeStr}:00`);
        const originalStatusNote = freshLog?.status === 'ABSENT' ? '[ORIGINALLY: ABSENT] ' : '';
        
        let cleanedNote = freshLog?.note || '';
        if (request.type === 'FORGOT_CHECKIN') {
            cleanedNote = cleanedNote.replace(/\[PROVISIONAL_FORGOT_CHECKIN\]/g, '').replace(/\s+/g, ' ').trim();
        } else if (request.type === 'LATE_ENTRY') {
            cleanedNote = cleanedNote.replace(/\[PROVISIONAL_LATE_ENTRY\]/g, '').replace(/\s+/g, ' ').trim();
        }

        const configData = masterOptions.filter(o => o.type === 'WORK_CONFIG');
        const startTimeStr = configData?.find(c => c.key === 'START_TIME')?.label || '10:00';
        const buffer = parseInt(configData?.find(c => c.key === 'LATE_BUFFER')?.label || '15');
        const isLate = checkIsLate(checkInDateTime, startTimeStr, buffer);

        let finalReason = request.reason;
        if (request.type === 'FORGOT_CHECKIN' && customStartTime) {
            finalReason = request.reason.replace(/\[TIME:\d{2}:\d{2}\]/g, `[TIME:${customStartTime}]`);
        }

        const payload = buildAttendanceCorrectionPayload({
            userId: request.userId,
            date: shiftDateStr,
            type: request.type as 'FORGOT_CHECKIN' | 'LATE_ENTRY',
            checkInTime: checkInDateTime.toISOString(),
            checkOutTime: freshLog?.check_out_time || undefined,
            isLate,
            reason: finalReason,
            originalStatusNote,
            existingNote: cleanedNote
        });
        await supabase.from('attendance_logs').upsert(payload, { onConflict: 'user_id, date' });
    }

    if (request.type !== 'FORGOT_BOTH') {
        await supabase.from('profiles').update({ work_status: 'ONLINE' }).eq('id', request.userId);
    }

    // Refund HP
    const isLateSubmission = request.reason.includes('[LATE_SUBMISSION]');
    if (!isLateSubmission) {
        if (freshLog?.status === 'ABSENT') {
            await processAction(request.userId, 'ATTENDANCE_ABSENT_REFUND', {
                originalDescription: `คืนค่า HP จากการแก้สถานะขาดงานวันที่ ${shiftDateStr}`
            });
        } else if (freshLog?.note?.includes('[SYSTEM] Penalized')) {
            await processAction(request.userId, 'ATTENDANCE_CORRECTION_REFUND', {
                originalDescription: `คืนค่า HP จากการแก้เวลาออกงานวันที่ ${shiftDateStr}`
            });
        }
    }

    if (request.type !== 'FORGOT_CHECKOUT' && request.type !== 'OUT_OF_RANGE_CHECKOUT') {
        const configData = masterOptions.filter(o => o.type === 'WORK_CONFIG');
        const startTimeStr = configData?.find(c => c.key === 'START_TIME')?.label || '10:00';
        const buffer = parseInt(configData?.find(c => c.key === 'LATE_BUFFER')?.label || '15');
        
        const checkInDateTime = new Date(`${shiftDateStr}T${timeStr}:00`);
        const isLate = checkIsLate(checkInDateTime, startTimeStr, buffer);
        
        let lateMinutes = 0;
        let calculatedStatus: 'LATE' | 'ON_TIME' = 'ON_TIME';
        let checkInTimeForAction = timeStr;

        if (request.type === 'LATE_ENTRY') {
            const actualCheckInDateTime = freshLog?.check_in_time ? new Date(freshLog.check_in_time) : null;
            const approvedLateDateTime = new Date(`${shiftDateStr}T${timeStr}:00`);

            if (actualCheckInDateTime) {
                try {
                    const hours = String(actualCheckInDateTime.getHours()).padStart(2, '0');
                    const minutes = String(actualCheckInDateTime.getMinutes()).padStart(2, '0');
                    checkInTimeForAction = `${hours}:${minutes}`;
                } catch (e) {
                    checkInTimeForAction = timeStr;
                }

                if (actualCheckInDateTime > approvedLateDateTime) {
                    calculatedStatus = 'LATE';
                    lateMinutes = Math.max(0, Math.ceil((actualCheckInDateTime.getTime() - approvedLateDateTime.getTime()) / (1000 * 60)));
                } else {
                    calculatedStatus = 'ON_TIME';
                    lateMinutes = 0;
                }
            } else {
                calculatedStatus = 'ON_TIME';
                lateMinutes = 0;
            }
        } else if (isLate) {
            calculatedStatus = 'LATE';
            lateMinutes = getLateMinutes(checkInDateTime, startTimeStr, buffer);
        }

        await processAction(request.userId, 'ATTENDANCE_CHECK_IN', { 
            status: calculatedStatus, 
            time: checkInTimeForAction,
            lateMinutes: lateMinutes
        });

        if (request.type === 'FORGOT_BOTH') {
            await processAction(request.userId, 'ATTENDANCE_CHECK_OUT', { 
                time: endTimeStr || '18:00',
                date: shiftDateStr
            });
        }
    } else if (request.type === 'FORGOT_CHECKOUT') {
        const [hours, minutes] = timeStr.split(':').map(Number);
        const checkOutDateTime = new Date(request.startDate);
        checkOutDateTime.setHours(hours, minutes, 0, 0);
        if (hours < 5) checkOutDateTime.setDate(checkOutDateTime.getDate() + 1);

        const { data: freshLogCheckout } = await supabase
            .from('attendance_logs')
            .select('id, note, status')
            .eq('user_id', request.userId)
            .eq('date', shiftDateStr)
            .maybeSingle();

        if (freshLogCheckout) {
            let cleanedNoteStr = freshLogCheckout.note || '';
            cleanedNoteStr = cleanedNoteStr.replace(/\[PROVISIONAL_CHECKOUT\]/g, '').replace(/\s+/g, ' ').trim();

            await supabase.from('attendance_logs').update({
                check_out_time: checkOutDateTime.toISOString(),
                status: 'COMPLETED',
                note: mergeAttendanceNotes(cleanedNoteStr, `[APPROVED CORRECTION] ${request.reason}`)
            }).eq('id', freshLogCheckout.id);

            await processAction(request.userId, 'ATTENDANCE_CHECK_OUT', { 
                time: timeStr,
                date: shiftDateStr
            });

            const isCheckoutLateSub = request.reason.includes('[LATE_SUBMISSION]');
            if (!isCheckoutLateSub) {
                if (freshLogCheckout.status === 'ABSENT') {
                    await processAction(request.userId, 'ATTENDANCE_ABSENT_REFUND', {
                        originalDescription: `คืนค่า HP จากการแก้เวลาออกงานวันที่ ${shiftDateStr}`
                    });
                } else if (freshLogCheckout.note?.includes('[SYSTEM] Penalized')) {
                    await processAction(request.userId, 'ATTENDANCE_CORRECTION_REFUND', {
                        originalDescription: `คืนค่า HP จากการแก้เวลาออกงานวันที่ ${shiftDateStr}`
                    });
                }
            }
        } else {
            const defaultStart = new Date(request.startDate);
            defaultStart.setHours(10, 0, 0, 0);
            await supabase.from('attendance_logs').insert({
                user_id: request.userId,
                date: shiftDateStr,
                check_in_time: defaultStart.toISOString(),
                check_out_time: checkOutDateTime.toISOString(),
                work_type: 'OFFICE',
                status: 'COMPLETED',
                note: `[AUTO-CREATED FOR CHECKOUT] ${request.reason}`
            });
        }
    }
}

/**
 * Handles approval logic for Out of Range Checkout requests.
 */
export async function approveOutOfRangeCheckoutRequest({
    request,
    processAction
}: {
    request: LeaveRequest;
    processAction: (userId: string, actionType: any, payload?: any) => Promise<any>;
}) {
    const timeMatch = request.reason.match(/\[TIME:(\d{2}:\d{2})(-\d{2}:\d{2})?\]/);
    const timeStr = timeMatch ? timeMatch[1] : '00:00';
    const shiftDateStr = format(request.startDate, 'yyyy-MM-dd');

    const [hours, minutes] = timeStr.split(':').map(Number);
    const checkOutDateTime = new Date(request.startDate);
    checkOutDateTime.setHours(hours, minutes, 0, 0);
    if (hours < 5) checkOutDateTime.setDate(checkOutDateTime.getDate() + 1);

    const { data: freshLogCheckout } = await supabase
        .from('attendance_logs')
        .select('id, note, status')
        .eq('user_id', request.userId)
        .eq('date', shiftDateStr)
        .maybeSingle();

    if (freshLogCheckout) {
        let cleanedNoteStr = freshLogCheckout.note || '';
        cleanedNoteStr = cleanedNoteStr.replace(/\[PROVISIONAL_CHECKOUT\]/g, '').replace(/\s+/g, ' ').trim();

        await supabase.from('attendance_logs').update({
            check_out_time: checkOutDateTime.toISOString(),
            status: 'COMPLETED',
            note: mergeAttendanceNotes(cleanedNoteStr, `[APPROVED OUT_OF_RANGE_CHECKOUT] ${request.reason}`)
        }).eq('id', freshLogCheckout.id);

        await processAction(request.userId, 'ATTENDANCE_CHECK_OUT', { 
            time: timeStr,
            date: shiftDateStr
        });

        const isCheckoutLateSub = request.reason.includes('[LATE_SUBMISSION]');
        if (!isCheckoutLateSub) {
            if (freshLogCheckout.status === 'ABSENT') {
                await processAction(request.userId, 'ATTENDANCE_ABSENT_REFUND', {
                    originalDescription: `คืนค่า HP จากการแก้เวลาออกนอกพื้นที่วันที่ ${shiftDateStr}`
                });
            } else if (freshLogCheckout.note?.includes('[SYSTEM] Penalized')) {
                await processAction(request.userId, 'ATTENDANCE_CORRECTION_REFUND', {
                    originalDescription: `คืนค่า HP จากการแก้เวลาออกนอกพื้นที่วันที่ ${shiftDateStr}`
                });
            }
        }
    } else {
        const defaultStart = new Date(request.startDate);
        defaultStart.setHours(10, 0, 0, 0);
        await supabase.from('attendance_logs').insert({
            user_id: request.userId,
            date: shiftDateStr,
            check_in_time: defaultStart.toISOString(),
            check_out_time: checkOutDateTime.toISOString(),
            work_type: 'OFFICE',
            status: 'COMPLETED',
            note: `[AUTO-CREATED FOR OUT_OF_RANGE_CHECKOUT] ${request.reason}`
        });
    }
}

/**
 * Handles approval logic for Standard Leave requests: SICK, VACATION, PERSONAL, etc.
 */
export async function approveStandardLeave({
    request,
    processAction
}: {
    request: LeaveRequest;
    processAction: (userId: string, actionType: any, payload?: any) => Promise<any>;
}) {
    const days = eachDayOfInterval({ start: request.startDate, end: request.endDate });
    const dateStrings = days.map(d => format(d, 'yyyy-MM-dd'));

    const { data: existingLogs } = await supabase
        .from('attendance_logs')
        .select('date, note')
        .eq('user_id', request.userId)
        .in('date', dateStrings);

    const logs = days.map(day => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const existing = existingLogs?.find(l => l.date === dateStr);
        return buildAttendanceCorrectionPayload({
            userId: request.userId,
            date: dateStr,
            type: 'LEAVE',
            reason: request.reason,
            existingNote: existing?.note,
            leaveType: request.type
        });
    });

    await supabase.from('attendance_logs').upsert(logs, { onConflict: 'user_id, date' });
    await processAction(request.userId, 'ATTENDANCE_LEAVE', { type: request.type });
}
