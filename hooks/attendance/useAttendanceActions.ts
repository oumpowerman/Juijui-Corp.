
import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { WorkLocation, AttendanceLog } from '../../types/attendance';
import { useToast } from '../../context/ToastContext';
import { format } from 'date-fns';
import { useGamification } from '../useGamification';
import { calculateCheckOutStatus, checkIsLate, getLateMinutes, mergeAttendanceNotes, getMatchedShiftSlot, resolveAttendanceLogStatus } from '../../lib/attendanceUtils';
import { useMasterData } from '../useMasterData';
import { attendanceService } from '../../services/attendanceService';
import { useUserSession } from '../../context/UserSessionContext';

export const useAttendanceActions = (userId: string) => {
    const { masterOptions } = useMasterData();
    const [isActionLoading, setIsActionLoading] = useState(false);
    const { showToast } = useToast();
    const { processAction } = useGamification();
    const { refreshAttendance, refreshLeaves } = useUserSession();
    const todayDateStr = format(new Date(), 'yyyy-MM-dd');

    const checkIn = async (
        workType: WorkLocation, 
        file?: File, 
        location?: { lat: number, lng: number },
        locationName?: string,
        note?: string,
        externalUploadFn?: (file: File) => Promise<string | null>,
        isAppeal: boolean = false,
        proofUrlParam?: string | null,
        isApprovedWFH: boolean = false,
        isProvisionalOnsite: boolean = false,
        provisionalReason?: string,
        approvedLateTime?: string,
        pendingLateTime?: string,
        pendingLateReason?: string,
        isGpsAppeal: boolean = false,
        gpsAppealReason?: string
    ) => {
        setIsActionLoading(true);
        try {
            const now = new Date();
            const configData = masterOptions.filter(o => o.type === 'WORK_CONFIG');
            const startTimeStr = configData?.find(c => c.key === 'START_TIME')?.label || '10:00';
            const buffer = parseInt(configData?.find(c => c.key === 'LATE_BUFFER')?.label || '15');
            
            const shiftsEnabledOpt = configData?.find(o => o.key === 'MULTIPLE_SHIFTS_ENABLED');
            const shiftsListOpt = configData?.find(o => o.key === 'MULTIPLE_SHIFTS_LIST');
            const isShiftsEnabled = shiftsEnabledOpt?.label === 'true';

            let matchedShift = null;
            if (isShiftsEnabled) {
                const shiftsList = shiftsListOpt?.label ? shiftsListOpt.label.split(',').map(s => s.trim()) : ['08:00', '08:30', '09:00'];
                matchedShift = getMatchedShiftSlot(now, shiftsList, buffer);
            }

            const effectiveStartTime = approvedLateTime || (pendingLateTime && checkIsLate(now, pendingLateTime, buffer) ? pendingLateTime : (matchedShift ? matchedShift.targetStartTime : startTimeStr));
            const isLate = matchedShift ? (matchedShift.isLate || matchedShift.isBlocked) : checkIsLate(now, effectiveStartTime, buffer);

            let finalCheckInTime = now;
            let actualCheckInTag = '';

            if (isShiftsEnabled && matchedShift && !matchedShift.isLate && !matchedShift.isBlocked) {
                const [sh, sm] = matchedShift.targetStartTime.split(':').map(Number);
                const normalizedDate = new Date(now);
                normalizedDate.setHours(sh, sm, 0, 0);
                finalCheckInTime = normalizedDate;

                const actH = String(now.getHours()).padStart(2, '0');
                const actM = String(now.getMinutes()).padStart(2, '0');
                const actS = String(now.getSeconds()).padStart(2, '0');
                actualCheckInTag = `[ACTUAL_CHECK_IN:${actH}:${actM}:${actS}]`;
            }

            let proofUrl = proofUrlParam !== undefined ? proofUrlParam : null;
            if (proofUrlParam === undefined && file) {
                if (externalUploadFn) {
                    try {
                        proofUrl = await externalUploadFn(file);
                    } catch (extErr) {
                        console.warn("External upload failed", extErr);
                        proofUrl = null;
                    }
                }
                if (!proofUrl) {
                    const fileExt = file.name.split('.').pop();
                    const fileName = `attendance-${userId}-${Date.now()}.${fileExt}`;
                    const { error: uploadError } = await supabase.storage.from('chat-files').upload(`proofs/${fileName}`, file);
                    if (!uploadError) {
                        const { data: urlData } = supabase.storage.from('chat-files').getPublicUrl(`proofs/${fileName}`);
                        proofUrl = urlData.publicUrl;
                    }
                }
            }

            let incomingNote = note || '';
            const meta = [];
            if (proofUrl) meta.push(`[PROOF:${proofUrl}]`);
            if (isShiftsEnabled && matchedShift) {
                meta.push(`[TARGET_SHIFT:${matchedShift.targetStartTime}]`);
            }
            if (actualCheckInTag) {
                meta.push(actualCheckInTag);
            }
            
            let finalIsAppeal = isAppeal;
            if (approvedLateTime) {
                const isLatePastApproved = checkIsLate(now, approvedLateTime, buffer);
                if (isLatePastApproved) {
                    finalIsAppeal = false;
                    meta.push(`[LATE_PAST_APPROVED]`);
                    incomingNote = `${incomingNote} [สายเกินคำขอเข้าสาย: ได้รับอนุมัติให้สายได้ถึง ${approvedLateTime} น. แต่เช็คอินจริง ${format(now, 'HH:mm')} น.]`.trim();
                } else {
                    finalIsAppeal = false;
                }
            } else if (pendingLateTime) {
                const isLatePastPending = checkIsLate(now, pendingLateTime, buffer);
                if (isLatePastPending) {
                    finalIsAppeal = false;
                    meta.push(`[LATE_PAST_PENDING]`);
                    incomingNote = `${incomingNote} [สายเกินกว่าที่ยื่นคำขอ: ขอสายได้ถึง ${pendingLateTime} น. แต่เช็คอินจริง ${format(now, 'HH:mm')} น.]`.trim();
                } else {
                    finalIsAppeal = true;
                    meta.push(`[APPEAL_PENDING]`);
                    meta.push(`[PROVISIONAL_LATE_ENTRY: Pending approval for ${pendingLateTime}]`);
                    if (pendingLateReason) {
                        meta.push(`[REASON: ${pendingLateReason}]`);
                    }
                }
            } else if (isAppeal) {
                meta.push(`[APPEAL_PENDING]`);
            }

            if (workType === 'WFH' && !isApprovedWFH) {
                meta.push(`[PROVISIONAL_WFH]`);
                meta.push(`[UNAUTHORIZED_WFH]`);
            }
            if (workType === 'SITE' && isProvisionalOnsite) {
                meta.push(`[PROVISIONAL_ONSITE]`);
            }
            if (isGpsAppeal) {
                meta.push(`[PROVISIONAL_GPS_SPOOF_APPEAL]`);
                meta.push(`[GPS_SPOOF_APPEAL_PENDING]`);
            }
            if (meta.length > 0) incomingNote = `${incomingNote} ${meta.join(' ')}`.trim();

            // FETCH FRESH LOG DATA TO PREVENT OVERWRITE
            const { data: existingLog } = await supabase
                .from('attendance_logs')
                .select('note')
                .eq('user_id', userId)
                .eq('date', todayDateStr)
                .maybeSingle();

            const finalNote = mergeAttendanceNotes(existingLog?.note, incomingNote);

            const payload: any = {
                user_id: userId,
                date: todayDateStr,
                check_in_time: finalCheckInTime.toISOString(),
                work_type: workType,
                status: 'WORKING',
                note: finalNote,
                location_lat: location?.lat,
                location_lng: location?.lng,
                location_name: locationName || 'Unknown Location'
            };

            const { error } = await supabase.from('attendance_logs').upsert(payload, { onConflict: 'user_id, date' });
            if (error) throw error;

            // --- Auto Leave Request Generation for Provisional WFH / Onsite / GPS Appeal ---
            let isProvisional = false;
            let provisionalType = '';
            
            if (workType === 'WFH' && !isApprovedWFH) {
                isProvisional = true;
                provisionalType = 'WFH';
            } else if (workType === 'SITE' && isProvisionalOnsite) {
                isProvisional = true;
                provisionalType = 'ONSITE';
            } else if (isGpsAppeal) {
                isProvisional = true;
                provisionalType = 'GPS_SPOOF_APPEAL';
            }

            if (isProvisional) {
                try {
                    // Check if there is ALREADY an existing PENDING request for today matching this type
                    const { data: existingPendingRequests } = await supabase
                        .from('leave_requests')
                        .select('id, type, created_at, reason')
                        .eq('user_id', userId)
                        .eq('status', 'PENDING')
                        .lte('start_date', todayDateStr)
                        .gte('end_date', todayDateStr);

                    const existingPending = (existingPendingRequests || []).find((req: any) => {
                        if (provisionalType === 'WFH') return req.type === 'WFH';
                        if (provisionalType === 'ONSITE') return req.type === 'ONSITE' || req.type === 'OFFSITE';
                        if (provisionalType === 'GPS_SPOOF_APPEAL') return req.type === 'GPS_SPOOF_APPEAL';
                        return false;
                    });

                    if (existingPending) {
                        console.log(`[CheckIn] Found existing pending request (${existingPending.id}) for ${provisionalType}. Reusing without duplicate creation.`);
                    } else {
                        // Create a NEW leave request only if no pending request exists
                        let finalReason = provisionalReason || (provisionalType === 'WFH' ? 'ลงเวลาแบบจำลอง (Provisional WFH)' : 'ลงเวลาแบบจำลอง (Provisional On-site)');
                        if (provisionalType === 'GPS_SPOOF_APPEAL') {
                            finalReason = gpsAppealReason || 'อุทธรณ์ความปลอดภัยพิกัด GPS ผิดปกติ';
                        }
                        const reasonWithTag = `[PROVISIONAL_${provisionalType}] ${finalReason}`;

                        // 1. Insert auto leave request
                        const leaveReq = await attendanceService.insertLeaveRequest({
                            user_id: userId,
                            type: provisionalType,
                            start_date: todayDateStr,
                            end_date: todayDateStr,
                            reason: reasonWithTag,
                            attachment_url: proofUrl || null,
                            status: 'PENDING'
                        });

                        // Fetch user's profile name for notification
                        const { data: userProfile } = await supabase
                            .from('profiles')
                            .select('full_name')
                            .eq('id', userId)
                            .maybeSingle();
                        const userName = userProfile?.full_name || 'พนักงาน';

                        let typeLabel = provisionalType === 'WFH' ? 'Work From Home (แบบจำลอง)' : 'ปฏิบัติงานนอกสถานที่ (แบบจำลอง)';
                        if (provisionalType === 'GPS_SPOOF_APPEAL') {
                            typeLabel = 'อุทธรณ์พิกัด GPS ผิดปกติ';
                        }
                        
                        // 2. Send bot message alert to team_messages
                        const botMsg = `📢 **ระบบสร้างใบคำขออัตโนมัติ (Provisional)**\n👤 **พนักงาน:** ${userName} (ลงเวลาแบบจำลอง)\nประเภทสิทธิ์: ${typeLabel}\n📅 วันที่: ${format(now, 'd MMM yyyy')}\n📝 เหตุผล: ${finalReason}`;
                        await supabase.from('team_messages').insert({
                            content: botMsg,
                            is_bot: true,
                            message_type: 'TEXT',
                            user_id: null
                        });

                        // 3. Send Notification to all Admins
                        const { data: admins } = await supabase
                            .from('profiles')
                            .select('id')
                            .eq('role', 'ADMIN');

                        if (admins && admins.length > 0) {
                            const notifications = admins.map(adm => ({
                                user_id: adm.id,
                                type: 'APPROVAL_REQ',
                                title: provisionalType === 'GPS_SPOOF_APPEAL' ? `🔔 คำขออุทธรณ์พิกัด GPS จาก ${userName}` : `🔔 คำขออัตโนมัติ (${provisionalType}) จากพนักงาน`,
                                message: provisionalType === 'GPS_SPOOF_APPEAL' 
                                    ? `มีคำขออุทธรณ์พิกัด GPS ผิดปกติของ ${userName} วันที่ ${format(now, 'dd/MM/yyyy')} โปรดตรวจสอบ`
                                    : `มีรายการลงเวลาแบบจำลอง (${provisionalType}) ของ ${userName} วันที่ ${format(now, 'dd/MM/yyyy')} โปรดตรวจสอบและอนุมัติ`,
                                is_read: false,
                                link_path: 'ADMIN_APPROVALS',
                                related_id: leaveReq?.id || null,
                                metadata: {
                                    request_id: leaveReq?.id || null,
                                    request_type: provisionalType,
                                    applicant_name: userName
                                }
                            }));
                            await supabase.from('notifications').insert(notifications);
                        }
                    }
                } catch (requestErr: any) {
                    console.error("Failed to generate or check provisional leave request", requestErr);
                }
            }

            showToast(isLate && !finalIsAppeal ? 'เข้างานสายนะวันนี้! 🐢' : 'สวัสดีตอนเช้าครับ! ☀️', (isLate && !finalIsAppeal) ? 'warning' : 'success');
            await supabase.from('profiles').update({ work_status: 'ONLINE' }).eq('id', userId);
            
            const lateMinutes = matchedShift ? matchedShift.lateMinutes : getLateMinutes(now, effectiveStartTime, buffer);

            await processAction(userId, 'ATTENDANCE_CHECK_IN', {
                status: (finalIsAppeal || isProvisional) ? 'APPEAL' : (isLate ? 'LATE' : 'ON_TIME'),
                date: now,
                time: format(now, 'HH:mm'),
                lateMinutes: lateMinutes
            });

            // Handle Unauthorized WFH Penalty
            if (workType === 'WFH' && !isApprovedWFH) {
                await processAction(userId, 'ATTENDANCE_UNAUTHORIZED_WFH', {
                    date: now
                });
            }

            // Force refresh both attendance and leaves to sync provisional requests instantly
            try {
                await Promise.all([refreshAttendance(), refreshLeaves()]);
            } catch (refErr) {
                console.warn("Failed to refresh session context in useAttendanceActions checkIn:", refErr);
            }

            return true;
        } catch (err: any) {
            console.error(err);
            showToast('Check-in ไม่สำเร็จ: ' + err.message, 'error');
            return false;
        } finally {
            setIsActionLoading(false);
        }
    };

    const manualCheckIn = async (
        checkInTime: Date,
        reason: string,
        file?: File,
        externalUploadFn?: (file: File) => Promise<string | null>
    ) => {
        setIsActionLoading(true);
        try {
            const dateStr = format(checkInTime, 'yyyy-MM-dd');
            let proofUrl = null;
            if (file) {
                if (externalUploadFn) proofUrl = await externalUploadFn(file);
                if (!proofUrl) {
                    const fileExt = file.name.split('.').pop();
                    const fileName = `attendance-${userId}-${Date.now()}.${fileExt}`;
                    const { error: uploadError } = await supabase.storage.from('chat-files').upload(`proofs/${fileName}`, file);
                    if (!uploadError) {
                        const { data: urlData } = supabase.storage.from('chat-files').getPublicUrl(`proofs/${fileName}`);
                        proofUrl = urlData.publicUrl;
                    }
                }
            }

            let incomingNote = reason;
            if (proofUrl) incomingNote += ` [PROOF:${proofUrl}]`;

            // FETCH FRESH LOG DATA TO PREVENT OVERWRITE
            const { data: existingLog } = await supabase
                .from('attendance_logs')
                .select('note')
                .eq('user_id', userId)
                .eq('date', dateStr)
                .maybeSingle();

            const finalNote = mergeAttendanceNotes(existingLog?.note, `[MANUAL_ENTRY] ${incomingNote}`);

            const payload = {
                user_id: userId,
                date: dateStr,
                check_in_time: checkInTime.toISOString(),
                work_type: 'OFFICE',
                status: 'PENDING_VERIFY',
                note: finalNote,
                location_name: 'Manual Entry'
            };

            const { error } = await supabase.from('attendance_logs').upsert(payload, { onConflict: 'user_id, date' });
            if (error) throw error;

            showToast('บันทึกเวลาเข้างานแบบ Manual แล้ว (รอตรวจสอบ) ✅', 'success');
            await supabase.from('profiles').update({ work_status: 'ONLINE' }).eq('id', userId);
            
            // Force refresh both attendance and leaves
            try {
                await Promise.all([refreshAttendance(), refreshLeaves()]);
            } catch (refErr) {
                console.warn("Failed to refresh session context in useAttendanceActions manualCheckIn:", refErr);
            }

            return true;
        } catch(err: any) {
            showToast('บันทึกไม่สำเร็จ: ' + err.message, 'error');
            return false;
        } finally {
            setIsActionLoading(false);
        }
    };

    const checkOut = async (
        todayLog: AttendanceLog,
        location?: { lat: number, lng: number },
        locationName?: string,
        reason?: string
    ) => {
        if (!todayLog || !todayLog.checkInTime) return false;
        setIsActionLoading(true);
        try {
            let now = new Date();
            let isAdjustedCheckout = false;
            let finalReason = reason || '';
            if (reason && reason.includes('[ADJUSTED_CHECKOUT:')) {
                const match = reason.match(/\[ADJUSTED_CHECKOUT:([^\]]+)\]/);
                if (match && match[1]) {
                    now = new Date(match[1]);
                    isAdjustedCheckout = true;
                    finalReason = reason.replace(/\[ADJUSTED_CHECKOUT:[^\]]+\]/, '').trim();
                }
            }

            const configData = masterOptions.filter(o => o.type === 'WORK_CONFIG');
            const minHoursStr = configData?.find(c => c.key === 'MIN_HOURS')?.label || '9';
            const minHours = parseFloat(minHoursStr) || 9;

            const calcResult = calculateCheckOutStatus(todayLog.checkInTime, now, minHours);

            // Fetch fresh log data to ensure we have the latest note (prevent overwriting)
            const { data: freshLog, error: fetchError } = await supabase
                .from('attendance_logs')
                .select('note')
                .eq('id', todayLog.id)
                .single();

            if (fetchError) {
                console.error('Failed to fetch fresh log for check-out:', fetchError);
            }

            const currentNote = freshLog?.note || todayLog.note || '';

            let noteAppend = '';
            if (isAdjustedCheckout) {
                 noteAppend += `[FORGETFUL_ADJUST_CHECKOUT] [OK: ${calcResult.hoursWorked.toFixed(1)} hrs]`;
                 if (finalReason) noteAppend += ` [REASON: ${finalReason}]`;
            } else if (calcResult.status === 'EARLY_LEAVE') {
                 noteAppend += `[EARLY: Missing ${calcResult.missingMinutes.toFixed(0)}m]`;
                 if (finalReason) noteAppend += ` [REASON: ${finalReason}]`;
            } else {
                 noteAppend += `[OK: ${calcResult.hoursWorked.toFixed(1)} hrs]`;
                 if (finalReason) noteAppend += ` [REASON: ${finalReason}]`;
            }

            const isProvisionalCheckout = reason && reason.includes('[PROVISIONAL_CHECKOUT]');
            const finalNote = mergeAttendanceNotes(currentNote, noteAppend);
            const resolvedStatus = resolveAttendanceLogStatus(
                todayLog.checkInTime.toISOString(),
                now.toISOString(),
                finalNote,
                todayLog.status
            );
            const newStatus = (todayLog.status === 'PENDING_VERIFY' || isProvisionalCheckout || resolvedStatus === 'PENDING_VERIFY') ? 'PENDING_VERIFY' : resolvedStatus;
            const updatePayload: any = {
                check_out_time: now.toISOString(),
                status: newStatus,
                note: finalNote,
                check_out_lat: location?.lat,
                check_out_lng: location?.lng,
                check_out_location_name: locationName
            };

            const { error } = await supabase.from('attendance_logs').update(updatePayload).eq('id', todayLog.id);
            if (error) throw error;
            
            await supabase.from('profiles').update({ work_status: 'BUSY' }).eq('id', userId);

            if (calcResult.status === 'COMPLETED' || isProvisionalCheckout) {
                showToast(isProvisionalCheckout ? 'ส่งคำขอตอกบัตรออกงานแล้ว รอแอดมินตรวจสอบนะครับ ⏳' : 'เลิกงานแล้ว พักผ่อนเยอะๆ นะครับ 💤', 'success');
                await processAction(userId, 'ATTENDANCE_CHECK_OUT', {
                    time: format(now, 'HH:mm'),
                    date: now 
                });
            } else {
                showToast(`กลับก่อนเวลา! (ขาด ${calcResult.missingMinutes.toFixed(0)} นาที)`, 'warning');
                await processAction(userId, 'ATTENDANCE_EARLY_LEAVE', {
                    missingMinutes: Math.round(calcResult.missingMinutes),
                    date: now 
                });
            }

            // Force refresh both attendance and leaves
            try {
                await Promise.all([refreshAttendance(), refreshLeaves()]);
            } catch (refErr) {
                console.warn("Failed to refresh session context in useAttendanceActions checkOut:", refErr);
            }

            return true;
        } catch (err: any) {
            showToast('Check-out ไม่สำเร็จ: ' + err.message, 'error');
            return false;
        } finally {
            setIsActionLoading(false);
        }
    };

    return { checkIn, manualCheckIn, checkOut, isActionLoading };
};
