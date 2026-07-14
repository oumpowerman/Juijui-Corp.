import { supabase } from '../lib/supabase';
import { LeaveRequest, LeaveType, RequestStatus } from '../types/attendance';
import { format, eachDayOfInterval, isValid } from 'date-fns';
import { alignOtHoursWithClockOut, calculateEstimatedPayout } from '../utils/otCalculator';
import { attendanceService } from './attendanceService';
import { mergeAttendanceNotes, getLateMinutes, checkIsLate } from '../lib/attendanceUtils';
import { checkLeaveQuota, buildOtAuditLog, buildAttendanceCorrectionPayload } from '../utils/adminApprovalHelpers';

export interface ApproveOtRequestParams {
    otReq: any;
    currentUser: any;
    customOtHours?: number;
    customStartTime?: string;
    customEndTime?: string;
    adminNote?: string;
    processAction: (userId: string, actionType: any, payload?: any) => Promise<any>;
}

export interface ApproveLeaveRequestParams {
    request: LeaveRequest;
    currentUser: any;
    customOtHours?: number;
    customStartTime?: string;
    customEndTime?: string;
    adminNote?: string;
    masterOptions: any[];
    annualHolidays: any[];
    calendarExceptions: any[];
    processAction: (userId: string, actionType: any, payload?: any) => Promise<any>;
}

export interface RejectRequestParams {
    id: string;
    reason: string;
    currentUser: any;
    isDedicatedOtRequest: boolean;
    otReq?: any;
    targetReq?: LeaveRequest;
    customCheckInTime?: string;
    masterOptions: any[];
    processAction: (userId: string, actionType: any, payload?: any) => Promise<any>;
    rejectionMode?: 'ABSENT' | 'ACTION_REQUIRED' | 'KEEP_WORKING';
}

export const adminApprovalService = {
    /**
     * Approves a dedicated OT request (from the `ot_requests` table).
     */
    async approveOtRequestTransaction({
        otReq,
        currentUser,
        customOtHours,
        customStartTime,
        customEndTime,
        adminNote,
        processAction
    }: ApproveOtRequestParams): Promise<{ success: boolean; checkOutMsg: string }> {
        const isFixedOt = otReq.isFixed || (otReq.reason && otReq.reason.includes('[OT:FIXED]'));

        let finalHours = otReq.durationHours;
        let checkOutMsg = '';

        if (customOtHours !== undefined) {
            finalHours = customOtHours;
        } else if (isFixedOt) {
            finalHours = 0;
            checkOutMsg = '';
        } else {
            // Get actual clock-out logs from DB
            const { data: attendanceLogs } = await supabase
                .from('attendance_logs')
                .select('*')
                .eq('user_id', otReq.userId);

            const employeeLog = (attendanceLogs || []).find(
                log => log.user_id === otReq.userId && log.date === otReq.date
            );

            const aligned = alignOtHoursWithClockOut(
                otReq.date,
                otReq.startTime,
                otReq.endTime,
                otReq.durationHours,
                employeeLog?.check_out_time
            );
            finalHours = aligned.finalHours;
            checkOutMsg = aligned.message;
        }

        // Recalculate estimated payout based on final verified hours
        const baseSalary = otReq.baseSalaryAtTime || 0;
        let multiplier = 1.5;
        if (otReq.type === 'HOLIDAY_OVERTIME') multiplier = 3.0;
        else if (otReq.type === 'HOLIDAY') multiplier = 2.0;

        const finalPayout = isFixedOt ? 0 : calculateEstimatedPayout(baseSalary, finalHours, multiplier);

        const updatePayload: any = {
            duration_hours: finalHours,
            computed_payout: finalPayout,
            approved_by: currentUser.id,
            approved_at: new Date().toISOString()
        };

        if (customStartTime) updatePayload.start_time = customStartTime;
        if (customEndTime) updatePayload.end_time = customEndTime;

        // Construct audit log and merge with adminNote
        const isTimeModified = (customStartTime && customStartTime !== otReq.startTime) || 
                               (customEndTime && customEndTime !== otReq.endTime) || 
                               (customOtHours !== undefined && customOtHours !== otReq.durationHours);

        const { finalDbNote } = buildOtAuditLog(
            otReq.startTime,
            otReq.endTime,
            otReq.durationHours,
            customStartTime || otReq.startTime,
            customEndTime || otReq.endTime,
            finalHours,
            adminNote,
            isTimeModified
        );

        if (finalDbNote) {
            updatePayload.rejection_reason = finalDbNote; // Save combined note in rejection_reason column
        }

        await attendanceService.updateOtRequestStatus(otReq.id, 'APPROVED', updatePayload);

        const dateDisplay = format(new Date(otReq.date), 'd MMM yyyy');
        
        // Build a custom notification message with edit logs
        let notifMsg = `คำขอ OT วันที่: ${dateDisplay} (${finalHours} ชม.) ได้รับการอนุมัติแล้ว\nรายละเอียดเดิม: ${otReq.reason}`;
        
        if (isTimeModified) {
            const origStartStr = otReq.startTime.substring(0, 5);
            const origEndStr = otReq.endTime.substring(0, 5);
            const newStartStr = (customStartTime || otReq.startTime).substring(0, 5);
            const newEndStr = (customEndTime || otReq.endTime).substring(0, 5);
            
            notifMsg += `\n\n⚙️ [แอดมินแก้ไขสิทธิ์และเวลาปฏิบัติงาน]\n• เวลาเดิม: ${origStartStr} - ${origEndStr} น. (${otReq.durationHours} ชม.)\n• เวลาใหม่: ${newStartStr} - ${newEndStr} น. (${finalHours} ชม.)`;
        }
        
        if (adminNote) {
            notifMsg += `\n\n📝 บันทึกจากแอดมิน: ${adminNote}`;
        }

        await supabase.from('notifications').insert({
            user_id: otReq.userId,
            type: 'INFO',
            title: '✅ อนุมัติคำขอพิเศษ (OT)',
            message: notifMsg,
            is_read: false,
            link_path: 'ATTENDANCE'
        });

        await supabase.from('team_messages').insert({
            content: `✅ คำขอ OT ของ **${otReq.user?.name || 'พนักงาน'}** วันที่ ${dateDisplay} (${finalHours} ชม.) ได้รับการอนุมัติแล้ว${checkOutMsg}${adminNote ? `\n📝 บันทึก: ${adminNote}` : ''}`,
            is_bot: true,
            message_type: 'TEXT',
            user_id: null
        });

        return { success: true, checkOutMsg };
    },

    /**
     * Approves a leave or attendance correction request (from the `leave_requests` table).
     */
    async approveLeaveOrCorrectionTransaction({
        request,
        currentUser,
        customOtHours,
        customStartTime,
        customEndTime,
        adminNote,
        masterOptions,
        annualHolidays,
        calendarExceptions,
        processAction
    }: ApproveLeaveRequestParams): Promise<{ success: boolean; type: string; infoMsg?: string }> {
        const LEAVE_TYPES = ['SICK', 'VACATION', 'PERSONAL', 'EMERGENCY', 'UNPAID'];
        const CORRECTION_TYPES = ['LATE_ENTRY', 'FORGOT_CHECKIN', 'FORGOT_CHECKOUT', 'FORGOT_BOTH'];
        const SPECIAL_TYPES = ['WFH', 'OVERTIME', 'ONSITE'];

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

        await attendanceService.updateLeaveRequestStatus(request.id, 'APPROVED', { 
            approver_id: currentUser.id,
            rejection_reason: finalDbNote
        });

        let notifTitle = '✅ คำขอได้รับการอนุมัติ';
        if (CORRECTION_TYPES.includes(request.type)) notifTitle = '🛠️ อนุมัติการแก้ไขเวลา';
        if (SPECIAL_TYPES.includes(request.type)) notifTitle = '✨ อนุมัติคำขอพิเศษ';

        const dateDisplay = format(request.startDate, 'd MMM yyyy');
        const fullDateDisplay = request.startDate.getTime() === request.endDate.getTime() 
            ? dateDisplay 
            : `${dateDisplay} - ${format(request.endDate, 'd MMM yyyy')}`;

        let notifMsg = `รายการ: ${request.type === 'OVERTIME' ? 'ขอ OT' : request.type}\nวันที่: ${fullDateDisplay}`;
        
        if (request.type === 'OVERTIME' && isTimeModified) {
            notifMsg += `\n\n⚙️ [แอดมินแก้ไขสิทธิ์และเวลาปฏิบัติงาน]\n• รายละเอียดเดิม: ${request.reason}\n• รายละเอียดใหม่: ${updatedReason}`;
        } else {
            notifMsg += `\nรายละเอียด: ${request.reason || '-'}`;
        }
        
        if (adminNote) {
            notifMsg += `\n\n📝 บันทึกจากแอดมิน: ${adminNote}`;
        }

        await supabase.from('notifications').insert({
            user_id: request.userId,
            type: 'INFO',
            title: notifTitle,
            message: notifMsg,
            is_read: false,
            link_path: 'ATTENDANCE'
        });

        // Special work handling (WFH / OVERTIME / ONSITE)
        if (SPECIAL_TYPES.includes(request.type)) {
            if (request.type === 'WFH' || request.type === 'ONSITE') {
                const shiftDateStr = format(request.startDate, 'yyyy-MM-dd');
                const { data: freshLog } = await supabase
                    .from('attendance_logs')
                    .select('id, note')
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
                    await supabase.from('attendance_logs')
                        .update({ note: newNote })
                        .eq('id', freshLog.id);
                }

                if (request.type === 'WFH') {
                    await supabase.from('team_messages').insert({
                        content: `🏠 **${request.user?.name}** ได้รับอนุมัติ WFH (อย่าลืม Check-in เมื่อเริ่มงานนะ!)`,
                        is_bot: true,
                        message_type: 'TEXT',
                        user_id: null
                    });
                } else if (request.type === 'ONSITE') {
                    await supabase.from('team_messages').insert({
                        content: `📍 **${request.user?.name}** ได้รับอนุมัติปฏิบัติงาน Onsite นอกสถานที่แล้ว`,
                        is_bot: true,
                        message_type: 'TEXT',
                        user_id: null
                    });
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
        }

        // Correction handling
        else if (CORRECTION_TYPES.includes(request.type)) {
            const timeMatch = request.reason.match(/\[TIME:(\d{2}:\d{2})(-\d{2}:\d{2})?\]/);
            const timeStr = timeMatch ? timeMatch[1] : '00:00';
            const endTimeStr = timeMatch && timeMatch[2] ? timeMatch[2].substring(1) : null;
            const shiftDateStr = format(request.startDate, 'yyyy-MM-dd');

            const { data: freshLog } = await supabase
                .from('attendance_logs')
                .select('*')
                .eq('user_id', request.userId)
                .eq('date', shiftDateStr)
                .maybeSingle();

            if (request.type === 'LATE_ENTRY' && freshLog) {
                const newNote = `${freshLog.note || ''} [APPROVED LATE_ENTRY] ${request.reason}`.replace('[APPEAL_PENDING]', '').trim();
                await supabase.from('attendance_logs')
                    .update({ status: 'WORKING', note: newNote })
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
                }

                const payload = buildAttendanceCorrectionPayload({
                    userId: request.userId,
                    date: shiftDateStr,
                    type: request.type as 'FORGOT_CHECKIN' | 'LATE_ENTRY',
                    checkInTime: checkInDateTime.toISOString(),
                    reason: request.reason,
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

            if (request.type !== 'FORGOT_CHECKOUT') {
                const configData = masterOptions.filter(o => o.type === 'WORK_CONFIG');
                const startTimeStr = configData?.find(c => c.key === 'START_TIME')?.label || '10:00';
                const buffer = parseInt(configData?.find(c => c.key === 'LATE_BUFFER')?.label || '15');
                
                const checkInDateTime = new Date(`${shiftDateStr}T${timeStr}:00`);
                const isLate = checkIsLate(checkInDateTime, startTimeStr, buffer);
                
                let lateMinutes = 0;
                let calculatedStatus: 'LATE' | 'ON_TIME' = 'ON_TIME';

                if (request.type === 'LATE_ENTRY' || isLate) {
                    calculatedStatus = 'LATE';
                    lateMinutes = getLateMinutes(checkInDateTime, startTimeStr, buffer);
                }

                await processAction(request.userId, 'ATTENDANCE_CHECK_IN', { 
                    status: calculatedStatus, 
                    time: timeStr,
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
                    await supabase.from('attendance_logs').update({
                        check_out_time: checkOutDateTime.toISOString(),
                        status: 'COMPLETED',
                        note: mergeAttendanceNotes(freshLogCheckout.note, `[APPROVED CORRECTION] ${request.reason}`)
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

        // Leave requests handling
        else if (LEAVE_TYPES.includes(request.type)) {
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

        await supabase.from('team_messages').insert({
            content: `✅ คำขอของ **${request.user?.name}** (${request.type}) ได้รับการอนุมัติแล้ว`,
            is_bot: true,
            message_type: 'TEXT',
            user_id: null
        });

        return { success: true, type: request.type };
    },

    /**
     * Rejects any request (either from `ot_requests` or `leave_requests`).
     */
    async rejectRequestTransaction({
        id,
        reason,
        currentUser,
        isDedicatedOtRequest,
        otReq,
        targetReq,
        customCheckInTime,
        masterOptions,
        processAction,
        rejectionMode
    }: RejectRequestParams): Promise<{ success: boolean }> {
        if (isDedicatedOtRequest) {
            if (!otReq) throw new Error('ไม่พบข้อมูลคำขอ OT');

            await supabase
                .from('ot_requests')
                .update({
                    status: 'REJECTED',
                    rejection_reason: reason,
                    approved_by: currentUser.id,
                    approved_at: new Date().toISOString()
                })
                .eq('id', id);

            const dateDisplay = format(new Date(otReq.date), 'd MMM yyyy');
            await supabase.from('notifications').insert({
                user_id: otReq.userId,
                type: 'INFO',
                title: '❌ ปฏิเสธคำขอพิเศษ (OT)',
                message: `คำขอ OT วันที่: ${dateDisplay} ถูกปฏิเสธ\nเหตุผล: ${reason}`,
                is_read: false,
                link_path: 'ATTENDANCE'
            });

            return { success: true };
        }

        // General leave_requests table reject logic
        const { data: req } = await supabase.from('leave_requests').select('*').eq('id', id).single();
        await attendanceService.updateLeaveRequestStatus(id, 'REJECTED', {
            approver_id: currentUser.id,
            rejection_reason: reason
        });

        if (req && req.type === 'FORGOT_CHECKOUT') {
            await supabase.from('attendance_logs').update({ status: 'ACTION_REQUIRED' }).eq('user_id', req.user_id).eq('date', req.start_date);
        }

        if (req && (req.type === 'WFH' || req.type === 'ONSITE')) {
            const { data: freshLog } = await supabase.from('attendance_logs')
                .select('*')
                .eq('user_id', req.user_id)
                .eq('date', req.start_date)
                .maybeSingle();

            if (freshLog) {
                const mode = rejectionMode || 'ABSENT'; // Default is ABSENT
                let cleanedNote = freshLog.note || '';

                if (mode !== 'ACTION_REQUIRED') {
                    cleanedNote = cleanedNote
                        .replace(/\[PROVISIONAL_WFH\]/g, '')
                        .replace(/\[PROVISIONAL_ONSITE\]/g, '')
                        .replace(/\[UNAUTHORIZED_WFH\]/g, '')
                        .replace(/\s+/g, ' ')
                        .trim();
                }

                if (mode === 'ABSENT') {
                    cleanedNote = mergeAttendanceNotes(cleanedNote, `[REJECTED_PROVISIONAL_ABSENT] ปฏิเสธสิทธิ์ย้อนหลังและปรับเป็นขาดงาน: ${reason}`);
                    
                    await supabase.from('attendance_logs').update({
                        status: 'ABSENT',
                        check_in_time: null,
                        check_out_time: null,
                        note: cleanedNote
                    }).eq('id', freshLog.id);

                    // Update profiles status
                    await supabase.from('profiles').update({ work_status: 'OFFLINE' }).eq('id', req.user_id);

                    // Gamification engine penalty
                    try {
                        await processAction(req.user_id, 'ATTENDANCE_ABSENT');
                    } catch (gameErr) {
                        console.error('Failed to process ATTENDANCE_ABSENT gamification action:', gameErr);
                    }
                } else if (mode === 'ACTION_REQUIRED') {
                    cleanedNote = mergeAttendanceNotes(cleanedNote, `[REJECTED_PROVISIONAL_CORRECTION] ปฏิเสธคำร้องเพื่อให้พนักงานยื่นส่งประวัติใหม่: ${reason}`);

                    await supabase.from('attendance_logs').update({
                        status: 'ACTION_REQUIRED',
                        note: cleanedNote
                    }).eq('id', freshLog.id);
                } else if (mode === 'KEEP_WORKING') {
                    const configData = masterOptions.filter(o => o.type === 'WORK_CONFIG');
                    const startTimeStr = configData?.find(c => c.key === 'START_TIME')?.label || '10:00';
                    const buffer = parseInt(configData?.find(c => c.key === 'LATE_BUFFER')?.label || '15');

                    let timeStr = '10:00';
                    if (customCheckInTime) {
                        timeStr = customCheckInTime;
                    } else if (freshLog.check_in_time) {
                        try {
                            const d = new Date(freshLog.check_in_time);
                            const hours = String(d.getHours()).padStart(2, '0');
                            const minutes = String(d.getMinutes()).padStart(2, '0');
                            timeStr = `${hours}:${minutes}`;
                        } catch (e) {
                            timeStr = '10:00';
                        }
                    }

                    const checkInDateTime = new Date(`${req.start_date}T${timeStr}:00`);
                    const isLate = checkIsLate(checkInDateTime, startTimeStr, buffer);

                    let lateMinutes = 0;
                    let calculatedStatus: 'LATE' | 'ON_TIME' = 'ON_TIME';

                    if (isLate) {
                        calculatedStatus = 'LATE';
                        lateMinutes = getLateMinutes(checkInDateTime, startTimeStr, buffer);
                    }

                    try {
                        await processAction(req.user_id, 'ATTENDANCE_CHECK_IN', { 
                            status: calculatedStatus, 
                            time: timeStr,
                            lateMinutes: lateMinutes
                        });
                    } catch (gameErr) {
                        console.error('Failed to process ATTENDANCE_CHECK_IN gamification action:', gameErr);
                    }

                    const tag = req.type === 'WFH' ? '[REJECTED_WFH]' : '[REJECTED_ONSITE]';
                    cleanedNote = mergeAttendanceNotes(cleanedNote, `${tag} (ปรับเวลาเป็น: ${timeStr}) ปฏิเสธการอนุมัติย้อนหลังและให้ทำงานต่อ: ${reason}`);

                    await supabase.from('attendance_logs').update({
                        status: calculatedStatus === 'LATE' ? 'LATE' : 'WORKING',
                        check_in_time: checkInDateTime.toISOString(),
                        note: cleanedNote
                    }).eq('id', freshLog.id);
                } else {
                    // KEEP_WORKING / existing fallback behavior
                    const tag = req.type === 'WFH' ? '[REJECTED_WFH]' : '[REJECTED_ONSITE]';
                    cleanedNote = mergeAttendanceNotes(cleanedNote, `${tag} ปฏิเสธการอนุมัติย้อนหลัง: ${reason}`);

                    await supabase.from('attendance_logs').update({
                        note: cleanedNote
                    }).eq('id', freshLog.id);
                }
            }
        }

        if (req && req.type === 'FORGOT_CHECKIN') {
            const { data: freshLog } = await supabase.from('attendance_logs')
                .select('*')
                .eq('user_id', req.user_id)
                .eq('date', req.start_date)
                .maybeSingle();

            const configData = masterOptions.filter(o => o.type === 'WORK_CONFIG');
            const startTimeStr = configData?.find(c => c.key === 'START_TIME')?.label || '10:00';
            const buffer = parseInt(configData?.find(c => c.key === 'LATE_BUFFER')?.label || '15');
            
            const timeMatch = req.reason ? req.reason.match(/\[TIME:(\d{2}:\d{2})\]/) : null;
            const timeStr = customCheckInTime || (timeMatch ? timeMatch[1] : '10:00');
            const checkInDateTime = new Date(`${req.start_date}T${timeStr}:00`);
            const isLate = checkIsLate(checkInDateTime, startTimeStr, buffer);

            let lateMinutes = 0;
            let calculatedStatus: 'LATE' | 'ON_TIME' = 'ON_TIME';

            if (isLate) {
                calculatedStatus = 'LATE';
                lateMinutes = getLateMinutes(checkInDateTime, startTimeStr, buffer);
            }

            await processAction(req.user_id, 'ATTENDANCE_CHECK_IN', { 
                status: calculatedStatus, 
                time: timeStr,
                lateMinutes: lateMinutes
            });

            let cleanedNote = freshLog?.note || '';
            cleanedNote = cleanedNote.replace(/\[PROVISIONAL_FORGOT_CHECKIN\]/g, '').replace(/\s+/g, ' ').trim();

            const updatedNote = mergeAttendanceNotes(cleanedNote, `[REJECTED FORGOT_CHECKIN] (ปรับเวลาเป็น: ${timeStr}) ${reason}`);
            await supabase.from('attendance_logs').update({
                status: calculatedStatus === 'LATE' ? 'LATE' : 'WORKING',
                check_in_time: checkInDateTime.toISOString(),
                note: updatedNote
            }).eq('user_id', req.user_id).eq('date', req.start_date);
        }

        if (req && req.type === 'OVERTIME') {
            const dateStr = req.start_date;
            const { data: freshLog } = await supabase.from('attendance_logs')
                .select('id, note')
                .eq('user_id', req.user_id)
                .eq('date', dateStr)
                .maybeSingle();

            if (freshLog) {
                const newNote = (freshLog.note || '').replace('[OT_PENDING:', '[OT_REJECTED:').trim();
                await supabase.from('attendance_logs').update({ note: newNote }).eq('id', freshLog.id);
            }
        }

        if (targetReq) {
            const dateDisplay = format(targetReq.startDate, 'd MMM yyyy');
            await supabase.from('notifications').insert({
                user_id: targetReq.userId,
                type: 'INFO',
                title: '❌ ปฏิเสธคำขอ',
                message: `คำขอประเภท: ${targetReq.type} วันที่: ${dateDisplay} ถูกปฏิเสธ\nเหตุผล: ${reason}`,
                is_read: false,
                link_path: 'ATTENDANCE'
            });

            await supabase.from('team_messages').insert({
                content: `❌ คำขอของ **${targetReq.user?.name || 'พนักงาน'}** (${targetReq.type}) ถูกปฏิเสธ`,
                is_bot: true,
                message_type: 'TEXT',
                user_id: null
            });
        }

        return { success: true };
    }
};
