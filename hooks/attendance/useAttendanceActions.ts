
import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { WorkLocation, AttendanceLog } from '../../types/attendance';
import { useToast } from '../../context/ToastContext';
import { format } from 'date-fns';
import { useGamification } from '../useGamification';
import { calculateCheckOutStatus, checkIsLate } from '../../lib/attendanceUtils';
import { useMasterData } from '../useMasterData';

export const useAttendanceActions = (userId: string) => {
    const { masterOptions } = useMasterData();
    const [isActionLoading, setIsActionLoading] = useState(false);
    const { showToast } = useToast();
    const { processAction } = useGamification();
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
        isApprovedWFH: boolean = false
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

            let finalNote = note || '';
            const meta = [];
            if (proofUrl) meta.push(`[PROOF:${proofUrl}]`);
            if (isAppeal) meta.push(`[APPEAL_PENDING]`);
            if (workType === 'WFH' && !isApprovedWFH) meta.push(`[UNAUTHORIZED_WFH]`);
            if (meta.length > 0) finalNote = `${finalNote} ${meta.join(' ')}`.trim();

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

            const { error } = await supabase.from('attendance_logs').insert(payload);
            if (error) throw error;

            showToast(isLate && !isAppeal ? 'เข้างานสายนะวันนี้! 🐢' : 'สวัสดีตอนเช้าครับ! ☀️', (isLate && !isAppeal) ? 'warning' : 'success');
            await supabase.from('profiles').update({ work_status: 'ONLINE' }).eq('id', userId);
            
            await processAction(userId, 'ATTENDANCE_CHECK_IN', {
                status: isAppeal ? 'APPEAL' : (isLate ? 'LATE' : 'ON_TIME'),
                date: now,
                time: format(now, 'HH:mm')
            });

            // Handle Unauthorized WFH Penalty
            if (workType === 'WFH' && !isApprovedWFH) {
                await processAction(userId, 'ATTENDANCE_UNAUTHORIZED_WFH', {
                    date: now
                });
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

            let note = reason;
            if (proofUrl) note += ` [PROOF:${proofUrl}]`;

            const payload = {
                user_id: userId,
                date: dateStr,
                check_in_time: checkInTime.toISOString(),
                work_type: 'OFFICE',
                status: 'PENDING_VERIFY',
                note: `[MANUAL_ENTRY] ${note}`,
                location_name: 'Manual Entry'
            };

            const { error } = await supabase.from('attendance_logs').insert(payload);
            if (error) throw error;

            showToast('บันทึกเวลาเข้างานแบบ Manual แล้ว (รอตรวจสอบ) ✅', 'success');
            await supabase.from('profiles').update({ work_status: 'ONLINE' }).eq('id', userId);
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
            const now = new Date();
            const configData = masterOptions.filter(o => o.type === 'WORK_CONFIG');
            const minHoursStr = configData?.find(c => c.key === 'MIN_HOURS')?.label || '9';
            const minHours = parseFloat(minHoursStr) || 9;

            const calcResult = calculateCheckOutStatus(todayLog.checkInTime, now, minHours);

            let noteAppend = '';
            if (calcResult.status === 'EARLY_LEAVE') {
                 noteAppend += ` [EARLY: Missing ${calcResult.missingMinutes.toFixed(0)}m]`;
                 if (reason) noteAppend += ` [REASON: ${reason}]`;
            } else {
                 noteAppend += ` [OK: ${calcResult.hoursWorked.toFixed(1)} hrs]`;
            }

            const newStatus = todayLog.status === 'PENDING_VERIFY' ? 'PENDING_VERIFY' : 'COMPLETED';
            const updatePayload: any = {
                check_out_time: now.toISOString(),
                status: newStatus,
                note: (todayLog.note || '') + noteAppend,
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
