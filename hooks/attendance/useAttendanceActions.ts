
import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { WorkLocation, AttendanceLog } from '../../types/attendance';
import { useToast } from '../../context/ToastContext';
import { format } from 'date-fns';
import { useGamification } from '../useGamification';
import { calculateCheckOutStatus, checkIsLate, getLateMinutes, mergeAttendanceNotes } from '../../lib/attendanceUtils';
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
        provisionalReason?: string
    ) => {
        setIsActionLoading(true);
        try {
            const now = new Date();
            const configData = masterOptions.filter(o => o.type === 'WORK_CONFIG');
            const startTimeStr = configData?.find(c => c.key === 'START_TIME')?.label || '10:00';
            const buffer = parseInt(configData?.find(c => c.key === 'LATE_BUFFER')?.label || '15');
            const isLate = checkIsLate(now, startTimeStr, buffer);

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
            if (isAppeal) meta.push(`[APPEAL_PENDING]`);
            if (workType === 'WFH' && !isApprovedWFH) {
                meta.push(`[PROVISIONAL_WFH]`);
                meta.push(`[UNAUTHORIZED_WFH]`);
            }
            if (workType === 'SITE' && isProvisionalOnsite) {
                meta.push(`[PROVISIONAL_ONSITE]`);
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
                check_in_time: now.toISOString(),
                work_type: workType,
                status: 'WORKING',
                note: finalNote,
                location_lat: location?.lat,
                location_lng: location?.lng,
                location_name: locationName || 'Unknown Location'
            };

            const { error } = await supabase.from('attendance_logs').upsert(payload, { onConflict: 'user_id, date' });
            if (error) throw error;

            // --- Auto Leave Request Generation for Provisional WFH / Onsite ---
            let isProvisional = false;
            let provisionalType = '';
            
            if (workType === 'WFH' && !isApprovedWFH) {
                isProvisional = true;
                provisionalType = 'WFH';
            } else if (workType === 'SITE' && isProvisionalOnsite) {
                isProvisional = true;
                provisionalType = 'ONSITE';
            }

            if (isProvisional) {
                const finalReason = provisionalReason || (provisionalType === 'WFH' ? 'ลงเวลาแบบจำลอง (Provisional WFH)' : 'ลงเวลาแบบจำลอง (Provisional On-site)');
                const reasonWithTag = `[PROVISIONAL_${provisionalType}] ${finalReason}`;
                
                try {
                    // 1. Insert auto leave request
                    await attendanceService.insertLeaveRequest({
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

                    const typeLabel = provisionalType === 'WFH' ? 'Work From Home (แบบจำลอง)' : 'ปฏิบัติงานนอกสถานที่ (แบบจำลอง)';
                    
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
                            type: 'INFO',
                            title: `🔔 คำขออัตโนมัติ (${provisionalType}) จากพนักงาน`,
                            message: `มีรายการลงเวลาแบบจำลอง (${provisionalType}) ของ ${userName} วันที่ ${format(now, 'dd/MM/yyyy')} โปรดตรวจสอบและอนุมัติ`,
                            is_read: false,
                            link_path: 'ADMIN_APPROVALS'
                        }));
                        await supabase.from('notifications').insert(notifications);
                    }
                } catch (requestErr: any) {
                    console.error("Failed to generate auto provisional leave request", requestErr);
                }
            }

            showToast(isLate && !isAppeal ? 'เข้างานสายนะวันนี้! 🐢' : 'สวัสดีตอนเช้าครับ! ☀️', (isLate && !isAppeal) ? 'warning' : 'success');
            await supabase.from('profiles').update({ work_status: 'ONLINE' }).eq('id', userId);
            
            const lateMinutes = getLateMinutes(now, startTimeStr, buffer);

            await processAction(userId, 'ATTENDANCE_CHECK_IN', {
                status: isAppeal ? 'APPEAL' : (isLate ? 'LATE' : 'ON_TIME'),
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

            const newStatus = todayLog.status === 'PENDING_VERIFY' ? 'PENDING_VERIFY' : 'COMPLETED';
            const updatePayload: any = {
                check_out_time: now.toISOString(),
                status: newStatus,
                note: mergeAttendanceNotes(currentNote, noteAppend),
                check_out_lat: location?.lat,
                check_out_lng: location?.lng,
                check_out_location_name: locationName
            };

            const { error } = await supabase.from('attendance_logs').update(updatePayload).eq('id', todayLog.id);
            if (error) throw error;
            
            await supabase.from('profiles').update({ work_status: 'BUSY' }).eq('id', userId);

            if (calcResult.status === 'COMPLETED' || newStatus === 'PENDING_VERIFY') {
                showToast('เลิกงานแล้ว พักผ่อนเยอะๆ นะครับ 💤', 'success');
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
