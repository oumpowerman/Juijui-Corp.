import { supabase } from '../../lib/supabase';
import { checkIsLate, getLateMinutes, mergeAttendanceNotes, calculateCheckOutStatus } from '../../lib/attendanceUtils';

/**
 * Handles rejection logic for WFH and Onsite requests.
 */
export async function rejectWfhOnsiteRequest({
    req,
    reason,
    rejectionMode,
    customCheckInTime,
    masterOptions,
    processAction
}: {
    req: any;
    reason: string;
    rejectionMode?: 'ABSENT' | 'ACTION_REQUIRED' | 'KEEP_WORKING';
    customCheckInTime?: string;
    masterOptions: any[];
    processAction: (userId: string, actionType: any, payload?: any) => Promise<any>;
}) {
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
                .replace(/\[PROVISIONAL_CHECKOUT\]/g, '')
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

/**
 * Handles rejection logic for Forgot Check-in requests.
 */
export async function rejectForgotCheckInRequest({
    req,
    reason,
    customCheckInTime,
    masterOptions,
    processAction
}: {
    req: any;
    reason: string;
    customCheckInTime?: string;
    masterOptions: any[];
    processAction: (userId: string, actionType: any, payload?: any) => Promise<any>;
}) {
    // ลบแถวบันทึก (Row) ของวันที่เป็นปัญหานั้นออกจากตาราง attendance_logs โดยตรง
    await supabase.from('attendance_logs')
        .delete()
        .eq('user_id', req.user_id)
        .eq('date', req.start_date);
}

/**
 * Handles rejection logic for Late Entry requests.
 */
export async function rejectLateEntryRequest({
    req,
    reason,
    masterOptions,
    processAction
}: {
    req: any;
    reason: string;
    masterOptions: any[];
    processAction: (userId: string, actionType: any, payload?: any) => Promise<any>;
}) {
    const { data: freshLog } = await supabase.from('attendance_logs')
        .select('*')
        .eq('user_id', req.user_id)
        .eq('date', req.start_date)
        .maybeSingle();

    if (freshLog) {
        let actualCheckInDateTime: Date | null = null;
        let actualTimeStr = '10:00';
        if (freshLog.check_in_time) {
            try {
                actualCheckInDateTime = new Date(freshLog.check_in_time);
                const hours = String(actualCheckInDateTime.getHours()).padStart(2, '0');
                const minutes = String(actualCheckInDateTime.getMinutes()).padStart(2, '0');
                actualTimeStr = `${hours}:${minutes}`;
            } catch (e) {
                actualCheckInDateTime = null;
            }
        }

        const configData = masterOptions.filter(o => o.type === 'WORK_CONFIG');
        const startTimeStr = configData?.find(c => c.key === 'START_TIME')?.label || '10:00';
        const buffer = parseInt(configData?.find(c => c.key === 'LATE_BUFFER')?.label || '15');

        let isLate = false;
        let lateMinutes = 0;
        let calculatedStatus: 'LATE' | 'ON_TIME' = 'ON_TIME';

        if (actualCheckInDateTime) {
            isLate = checkIsLate(actualCheckInDateTime, startTimeStr, buffer);
            if (isLate) {
                calculatedStatus = 'LATE';
                lateMinutes = getLateMinutes(actualCheckInDateTime, startTimeStr, buffer);
            }
        }

        try {
            await processAction(req.user_id, 'ATTENDANCE_CHECK_IN', { 
                status: calculatedStatus, 
                time: actualTimeStr,
                lateMinutes: lateMinutes
            });
        } catch (gameErr) {
            console.error('Failed to process ATTENDANCE_CHECK_IN gamification action on late entry rejection:', gameErr);
        }

        let cleanedNote = freshLog.note || '';
        cleanedNote = cleanedNote
            .replace(/\[APPEAL_PENDING\]/g, '')
            .replace(/\[PROVISIONAL_LATE_ENTRY(:.*?)?\]/g, '')
            .replace(/\s+/g, ' ')
            .trim();

        const updatedNote = mergeAttendanceNotes(cleanedNote, `[REJECTED LATE_ENTRY] ปฏิเสธคำร้องเข้าสาย (สายจริงจากเกณฑ์ปกติ: ${lateMinutes} นาที) เหตุ flow-ปกติ: ${reason}`);
        
        const targetLogStatus = freshLog.check_out_time 
            ? (calculatedStatus === 'LATE' ? 'LATE' : 'COMPLETED') 
            : 'WORKING';

        await supabase.from('attendance_logs').update({
            status: targetLogStatus,
            note: updatedNote
        }).eq('id', freshLog.id);
    }
}

/**
 * Handles rejection logic for Forgot Check-out / Provisional Check-out requests.
 */
export async function rejectForgotCheckOutRequest({
    req,
    reason,
    masterOptions,
    processAction
}: {
    req: any;
    reason: string;
    masterOptions: any[];
    processAction: (userId: string, actionType: any, payload?: any) => Promise<any>;
}) {
    const { data: freshLog } = await supabase.from('attendance_logs')
        .select('*')
        .eq('user_id', req.user_id)
        .eq('date', req.start_date)
        .maybeSingle();

    if (freshLog) {
        const noteText = freshLog.note || '';
        const isProvisionalCheckout = noteText.includes('[PROVISIONAL_CHECKOUT]');
        const isEarlyLeaveAppeal = isProvisionalCheckout && 
            !req.reason?.includes('(Location Mismatch)');

        if (isEarlyLeaveAppeal) {
            // 1. Calculate missing minutes and apply early leave penalty
            let missingMinutes = 0;
            let checkOutDate = new Date();

            if (freshLog.check_in_time && freshLog.check_out_time) {
                const checkInDate = new Date(freshLog.check_in_time);
                checkOutDate = new Date(freshLog.check_out_time);

                const configData = masterOptions.filter(o => o.type === 'WORK_CONFIG');
                const minHoursStr = configData?.find(c => c.key === 'MIN_HOURS')?.label || '9';
                const minHours = parseFloat(minHoursStr) || 9;

                const calcResult = calculateCheckOutStatus(checkInDate, checkOutDate, minHours);
                missingMinutes = Math.round(calcResult.missingMinutes || 0);
            }

            // Clean up note text (remove provisional tags, etc.)
            let cleanedNote = noteText
                .replace(/\[PROVISIONAL_CHECKOUT\]/g, '')
                .replace(/\s+/g, ' ')
                .trim();

            const updatedNote = mergeAttendanceNotes(
                cleanedNote, 
                `[REJECTED EARLY_LEAVE_APPEAL] ปฏิเสธการยกเว้นโทษกลับก่อนเวลา (ขาด ${missingMinutes} นาที) ปรับหักคะแนน: ${reason}`
            );

            // 2. Set attendance log status to COMPLETED (since checkout time is kept, but they are subject to penalty)
            await supabase.from('attendance_logs').update({
                status: 'COMPLETED',
                note: updatedNote
            }).eq('id', freshLog.id);

            // 3. Process early leave gamification penalty immediately
            if (missingMinutes > 0 && processAction) {
                try {
                    await processAction(req.user_id, 'ATTENDANCE_EARLY_LEAVE', {
                        missingMinutes,
                        date: checkOutDate
                    });
                } catch (gameErr) {
                    console.error('Failed to process ATTENDANCE_EARLY_LEAVE gamification action on early checkout rejection:', gameErr);
                }
            }
        } else {
            // Normal forgot checkout rejection -> set status to ACTION_REQUIRED
            let cleanedNote = noteText
                .replace(/\[PROVISIONAL_CHECKOUT\]/g, '')
                .replace(/\s+/g, ' ')
                .trim();
            const tag = '[REJECTED FORGOT_CHECKOUT]';
            const label = 'ปฏิเสธการแก้เวลาออก';
            const updatedNote = mergeAttendanceNotes(
                cleanedNote, 
                `${tag} ${label}: ${reason}`
            );

            await supabase.from('attendance_logs').update({
                status: 'ACTION_REQUIRED',
                note: updatedNote
            }).eq('id', freshLog.id);
        }
    }
}

/**
 * Handles rejection of an Out of Range Checkout request.
 */
export async function rejectOutOfRangeCheckoutRequest({
    req,
    reason
}: {
    req: any;
    reason: string;
}) {
    const { data: freshLog } = await supabase.from('attendance_logs')
        .select('*')
        .eq('user_id', req.user_id)
        .eq('date', req.start_date)
        .maybeSingle();

    if (freshLog) {
        const noteText = freshLog.note || '';
        let cleanedNote = noteText
            .replace(/\[PROVISIONAL_CHECKOUT\]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
        const tag = '[REJECTED OUT_OF_RANGE_CHECKOUT]';
        const label = 'ปฏิเสธการแก้เวลาออกนอกพื้นที่';
        const updatedNote = mergeAttendanceNotes(
            cleanedNote, 
            `${tag} ${label}: ${reason}`
        );

        await supabase.from('attendance_logs').update({
            status: 'ACTION_REQUIRED',
            note: updatedNote
        }).eq('id', freshLog.id);
    }
}
