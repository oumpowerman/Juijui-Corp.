import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { LeaveRequest, LeaveType, LeaveUsage, RequestStatus } from '../types/attendance';
import { ATTENDANCE_REGISTRY } from '../constants/attendanceRegistry';
import { useToast } from '../context/ToastContext';
import { useGlobalDialog } from '../context/GlobalDialogContext';
import { eachDayOfInterval, format, isValid } from 'date-fns';
import { useGoogleDrive } from './useGoogleDrive';
import { useUserSession } from '../context/UserSessionContext';
import { useMasterData } from './useMasterData';
import { isWorkingDay, countWorkingDaysBetween } from '../utils/judgeUtils';
import { calculateOtMultiplier, calculateEstimatedPayout } from '../utils/otCalculator';
import { attendanceService } from '../services/attendanceService';

export const useMyRequests = (currentUser?: any, options: { enabled?: boolean } = {}) => {
    const { enabled = true } = options;
    const { 
        leaveRequests: contextLeaveRequests, 
        otRequests: contextOtRequests, 
        allUsers, 
        isReady: isContextReady, 
        refreshOTRequests,
        refreshAttendance,
        refreshLeaves
    } = useUserSession();
    
    const { annualHolidays, calendarExceptions } = useMasterData();
    const [rawRequests, setRawRequests] = useState<LeaveRequest[]>([]);
    const [isLoading, setIsLoading] = useState(enabled);
    const [isLoadingHistorical, setIsLoadingHistorical] = useState(false);
    const { showToast } = useToast();
    const { showConfirm } = useGlobalDialog();
    const { uploadFileToDrive, isReady: isDriveReady } = useGoogleDrive();

    const checkLateSubmissionRule = (
        requestDate: Date,
        submittedDate: Date,
        annualHolidays: any,
        calendarExceptions: any,
        user: any
    ): boolean => {
        if (!isValid(requestDate) || !isValid(submittedDate)) return false;
        const requestDay = new Date(requestDate.getFullYear(), requestDate.getMonth(), requestDate.getDate());
        const submittedDay = new Date(submittedDate.getFullYear(), submittedDate.getMonth(), submittedDate.getDate());
        
        if (requestDay >= submittedDay) return false;

        const workingDaysCount = countWorkingDaysBetween(
            requestDay,
            submittedDay,
            annualHolidays || [],
            calendarExceptions || [],
            user
        );

        return workingDaysCount > 2;
    };

    const fetchMyRequests = useCallback(async () => {
        if (!enabled || !currentUser?.id) return;
        setIsLoading(true);
        try {
            const data = await attendanceService.fetchCombinedRequests(currentUser.id, { all: false });
            setRawRequests(data);
        } catch (err: any) {
            console.error("Fetch my requests failed", err);
        } finally {
            setIsLoading(false);
        }
    }, [enabled, currentUser?.id]);

    useEffect(() => {
        if (!enabled) {
            setIsLoading(false);
            return;
        }
        if (!currentUser?.id) return;

        if (!isContextReady) {
            fetchMyRequests();
            return;
        }

        // Merge and filter personal requests from context
        const personalLeaves = contextLeaveRequests.filter(r => r.userId === currentUser.id && r.type !== 'OVERTIME');
        const personalOts: LeaveRequest[] = (contextOtRequests || [])
            .filter(r => r.userId === currentUser.id)
            .map(r => ({
                id: r.id,
                userId: r.userId,
                type: 'OVERTIME' as LeaveType,
                startDate: new Date(r.date + 'T' + r.startTime),
                endDate: new Date(r.date + 'T' + r.endTime),
                reason: `[OT:${r.durationHours}hr] ${r.reason}`,
                status: r.status as RequestStatus,
                createdAt: new Date(r.createdAt),
                rejectionReason: r.rejectionReason,
                user: currentUser ? {
                    id: currentUser.id,
                    name: currentUser.name,
                    avatarUrl: currentUser.avatarUrl,
                    position: currentUser.position
                } : undefined
            }));

        const combined = [...personalLeaves, ...personalOts];
        combined.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        setRawRequests(combined);
        setIsLoading(false);
    }, [currentUser?.id, contextLeaveRequests, contextOtRequests, isContextReady, enabled]);

    const requests = useMemo(() => {
        if (!enabled) return [];
        return rawRequests.map(req => {
            if (req.user) return req;
            const user = allUsers.find(u => u.id === req.userId);
            return {
                ...req,
                user: user ? {
                    id: user.id,
                    name: user.name,
                    avatarUrl: user.avatarUrl,
                    position: user.position
                } : undefined
            };
        });
    }, [rawRequests, allUsers, enabled]);

    const leaveUsage: LeaveUsage = useMemo(() => {
        const usage = {} as LeaveUsage;
        Object.keys(ATTENDANCE_REGISTRY).forEach(k => {
            usage[k as LeaveType] = 0;
        });

        if (!enabled || !currentUser?.id) return usage;

        const LEAVE_TYPES = Object.values(ATTENDANCE_REGISTRY)
            .filter(item => item.category === 'LEAVE')
            .map(item => item.id);

        requests.forEach(req => {
            if (req.userId === currentUser.id && req.status === 'APPROVED') {
                if (LEAVE_TYPES.includes(req.type)) {
                    const start = new Date(req.startDate);
                    const end = new Date(req.endDate);
                    if (!isValid(start) || !isValid(end) || start > end) return; 
                    
                    const days = eachDayOfInterval({ start, end });
                    const workingDaysCount = days.filter(d => 
                        isWorkingDay(d, annualHolidays, calendarExceptions, currentUser)
                    ).length;
                    
                    usage[req.type as keyof LeaveUsage] += workingDaysCount;
                } else {
                    usage[req.type as keyof LeaveUsage] += 1;
                }
            }
        });

        return usage;
    }, [requests, currentUser?.id, annualHolidays, calendarExceptions, enabled]);

    const pendingUsage: LeaveUsage = useMemo(() => {
        const usage = {} as LeaveUsage;
        Object.keys(ATTENDANCE_REGISTRY).forEach(k => {
            usage[k as LeaveType] = 0;
        });

        if (!enabled || !currentUser?.id) return usage;

        const LEAVE_TYPES = Object.values(ATTENDANCE_REGISTRY)
            .filter(item => item.category === 'LEAVE')
            .map(item => item.id);

        requests.forEach(req => {
            if (req.userId === currentUser.id && req.status === 'PENDING') {
                if (LEAVE_TYPES.includes(req.type)) {
                    const start = new Date(req.startDate);
                    const end = new Date(req.endDate);
                    if (!isValid(start) || !isValid(end) || start > end) return; 
                    
                    const days = eachDayOfInterval({ start, end });
                    const workingDaysCount = days.filter(d => 
                        isWorkingDay(d, annualHolidays, calendarExceptions, currentUser)
                    ).length;
                    
                    usage[req.type as keyof LeaveUsage] += workingDaysCount;
                } else {
                    usage[req.type as keyof LeaveUsage] += 1;
                }
            }
        });

        return usage;
    }, [requests, currentUser?.id, annualHolidays, calendarExceptions, enabled]);

    const submitRequest = async (
        type: LeaveType, 
        startDate: Date, 
        endDate: Date, 
        reason: string, 
        file?: File,
        linkedRemoteType?: 'WFH' | 'ONSITE'
    ): Promise<boolean> => {
        if (!currentUser?.id) return false;
        try {
            const startDateStr = format(startDate, 'yyyy-MM-dd');
            const timestamp = Date.now();
            const linkId = linkedRemoteType ? `LINK_FORGOT_${currentUser.id}_${startDateStr}_${timestamp}` : null;
            const finalReasonWithLink = linkId ? `[LINKID:${linkId}] ${reason}` : reason;

            // --- OT Request Handling ---
            if (type === 'OVERTIME') {
                const isFixedOt = reason.includes('[OT:FIXED]');

                // Try matching new format: [OT:18:30-20:30] (2hr) Reason
                const otTimeMatch = reason.match(/\[OT:(\d{2}:\d{2})-(\d{2}:\d{2})\]/);
                const startTime = otTimeMatch ? otTimeMatch[1] : '18:30';
                const endTime = otTimeMatch ? otTimeMatch[2] : '20:30';

                // Match hours from new format "(Xhr)" or old format "[OT:Xhr]"
                const otHoursMatch = reason.match(/\(([\d\.]+)hr\)/) || reason.match(/\[OT:([\d\.]+)hr\]/);
                const otHours = otHoursMatch ? parseFloat(otHoursMatch[1]) : 2.0;

                // Clean the reason prefix
                let cleanReason = reason
                    .replace(/\[OT:\d{2}:\d{2}-\d{2}:\d{2}\]\s*\([\d\.]+hr\)\s*/, '')
                    .replace(/\[OT:[\d\.]+hr\]\s*/, '')
                    .trim();

                if (isFixedOt) {
                    cleanReason = `[OT:FIXED] ${cleanReason.replace(/\[OT:FIXED\]/g, '').trim()}`;
                }

                const { data: existing = null } = await supabase
                    .from('ot_requests')
                    .select('id, status')
                    .eq('user_id', currentUser.id)
                    .eq('date', startDateStr)
                    .in('status', ['PENDING', 'APPROVED'])
                    .maybeSingle();

                if (existing) {
                    if (existing.status === 'PENDING') {
                        showToast('คุณได้ส่งคำขอ OT ของวันนี้ไปแล้ว และกำลังรออนุมัติอยู่ ⏳', 'warning');
                    } else {
                        showToast('คำขอ OT ของวันนี้ได้รับการอนุมัติเรียบร้อยแล้วครับ ✅', 'info');
                    }
                    return false;
                }

                // Upload attachment specifically for OT if provided
                let otAttachmentUrl: string | null = null;
                if (file) {
                    let driveSuccess = false;
                    if (isDriveReady) {
                        try {
                            showToast('กำลังอัปโหลดไปที่ Google Drive...', 'info');
                            const currentYear = format(new Date(), 'yyyy');
                            const currentMonth = format(new Date(), 'MM');
                            const driveResult = await uploadFileToDrive(file, ['Juijui_Assets', 'Attendance', 'Leaves', currentYear, currentMonth, currentUser.name || 'Unknown']);
                            otAttachmentUrl = driveResult.thumbnailUrl || driveResult.url;
                            driveSuccess = true;
                        } catch (driveErr: any) {
                            console.warn("Drive upload failed, falling back to Supabase", driveErr);
                        }
                    }

                    if (!driveSuccess) {
                        try {
                            showToast('กำลังอัปโหลดไปที่ Storage สำรอง...', 'info');
                            const fileExt = file.name.split('.').pop();
                            const fileName = `${currentUser.id}_${Date.now()}.${fileExt}`;
                            const { error: uploadErr } = await supabase.storage
                                .from('chat-files')
                                .upload(`proofs/${fileName}`, file);

                            if (uploadErr) throw uploadErr;

                            const { data } = supabase.storage.from('chat-files').getPublicUrl(`proofs/${fileName}`);
                            otAttachmentUrl = data.publicUrl;
                        } catch (supabaseErr: any) {
                            console.error("Supabase upload failed", supabaseErr);
                            throw new Error("ไม่สามารถอัปโหลดไฟล์ได้ทั้ง Google Drive และ Supabase");
                        }
                    }
                }

                const baseSalary = currentUser.baseSalary || 0;
                const { type: otType, multiplier } = calculateOtMultiplier(startDate, annualHolidays, calendarExceptions);
                const estimatedPayout = isFixedOt ? 0 : calculateEstimatedPayout(baseSalary, otHours, multiplier);

                const insertedOt = await attendanceService.insertOtRequest({
                    user_id: currentUser.id,
                    date: startDateStr,
                    start_time: startTime,
                    end_time: endTime,
                    duration_hours: otHours,
                    reason: cleanReason,
                    type: otType,
                    status: 'PENDING',
                    base_salary_at_time: baseSalary,
                    computed_payout: estimatedPayout,
                    attachment_url: otAttachmentUrl,
                    is_fixed: isFixedOt
                });

                const displayReason = isFixedOt ? cleanReason.replace(/\[OT:FIXED\]/g, '').trim() : cleanReason;
                const otDisplayStr = isFixedOt ? 'เหมาจ่าย' : `${otHours} ชม.`;
                const msg = `📢 **${currentUser.name}** ส่งคำขอ OT (${otDisplayStr}) \n📅 ${format(startDate, 'd MMM')} \n📝: ${displayReason}`;
                await supabase.from('team_messages').insert({
                    content: msg,
                    is_bot: true,
                    message_type: 'TEXT',
                    user_id: null
                });

                try {
                    const { data: admins } = await supabase.from('profiles').select('id').eq('role', 'ADMIN');
                    if (admins && admins.length > 0) {
                        const otNotifs = admins.map(admin => ({
                            user_id: admin.id,
                            type: 'APPROVAL_REQ',
                            title: '⏰ คำขอ OT ใหม่',
                            message: `คุณ ${currentUser.name || 'พนักงาน'} ส่งคำขอ OT (${otDisplayStr}) วันที่ ${format(startDate, 'd MMM')}: "${displayReason}"`,
                            is_read: false,
                            link_path: 'ATTENDANCE',
                            related_id: insertedOt?.id || null,
                            metadata: { request_type: 'OT' }
                        }));
                        await supabase.from('notifications').insert(otNotifs);
                    }
                } catch (notiErr) {
                    console.error("Failed to insert admin OT notifications:", notiErr);
                }

                showToast('ส่งคำขอ OT เรียบร้อย รออนุมัติครับ 📨', 'success');
                if (refreshLeaves) await refreshLeaves();
                if (refreshAttendance) await refreshAttendance();
                if (refreshOTRequests) {
                    await refreshOTRequests();
                }
                fetchMyRequests();
                return true;
            }

            // --- Late Submission Rule check ---
            const CORRECTION_TYPES = ['LATE_ENTRY', 'FORGOT_CHECKIN', 'FORGOT_CHECKOUT', 'FORGOT_BOTH', 'OUT_OF_RANGE_CHECKOUT'];
            let isLateSubmission = false;
            if (CORRECTION_TYPES.includes(type)) {
                isLateSubmission = checkLateSubmissionRule(startDate, new Date(), annualHolidays, calendarExceptions, currentUser);
            }

            // Check duplicate leave request
            const LEAVE_TYPES = Object.values(ATTENDANCE_REGISTRY)
                .filter(item => item.category === 'LEAVE')
                .map(item => item.id);

            const isNewLeave = LEAVE_TYPES.includes(type);

            if (isNewLeave) {
                const { data: existingLeaves } = await supabase
                    .from('leave_requests')
                    .select('id, type, status')
                    .eq('user_id', currentUser.id)
                    .in('type', LEAVE_TYPES)
                    .eq('start_date', startDateStr)
                    .in('status', ['PENDING', 'APPROVED']);

                if (existingLeaves && existingLeaves.length > 0) {
                    const approvedLeave = existingLeaves.find(l => l.status === 'APPROVED');
                    if (approvedLeave) {
                        showToast('คุณมีวันลาที่ได้รับการอนุมัติแล้วในวันนี้ครับ ✅', 'warning');
                        return false;
                    }

                    const pendingLeave = existingLeaves.find(l => l.status === 'PENDING');
                    if (pendingLeave) {
                        const originalTypeName = ATTENDANCE_REGISTRY[pendingLeave.type as LeaveType]?.label || pendingLeave.type;
                        const newTypeName = ATTENDANCE_REGISTRY[type]?.label || type;
                        const confirmReplace = await showConfirm(
                            `ในระบบมีคำขอลา [${originalTypeName}] ที่อยู่ระหว่างรออนุมัติอยู่แล้วในวันนี้\nคุณต้องการ ยกเลิกคำขอเดิม แล้วยื่นคำขอ [${newTypeName}] นี้เข้าไปแทนที่หรือไม่?`,
                            'ตรวจพบคำขอลาซ้ำซ้อน'
                        );

                        if (confirmReplace) {
                            await supabase
                                .from('leave_requests')
                                .update({ 
                                    status: 'REJECTED',
                                    reason: `[REJECTED_FOR_REPLACEMENT] ${newTypeName}`
                                })
                                .eq('id', pendingLeave.id);
                        } else {
                            return false;
                        }
                    }
                }
            } else {
                const { data: existingRequest } = await supabase
                    .from('leave_requests')
                    .select('id, status')
                    .eq('user_id', currentUser.id)
                    .eq('type', type)
                    .eq('start_date', startDateStr)
                    .in('status', ['PENDING', 'APPROVED']) 
                    .maybeSingle();

                if (existingRequest) {
                    if (existingRequest.status === 'PENDING') {
                        showToast('คำขอนี้ส่งไปแล้ว รออนุมัติครับ ⏳', 'warning');
                    } else {
                        showToast('คำขอนี้อนุมัติแล้วครับ ✅', 'info');
                    }
                    return false; 
                }
            }

            let attachmentUrl: string | null = null;
            if (file) {
                let driveSuccess = false;
                if (isDriveReady) {
                    try {
                        showToast('กำลังอัปโหลดไปที่ Google Drive...', 'info');
                        const currentYear = format(new Date(), 'yyyy');
                        const currentMonth = format(new Date(), 'MM');
                        const driveResult = await uploadFileToDrive(file, ['Juijui_Assets', 'Attendance', 'Leaves', currentYear, currentMonth, currentUser.name || 'Unknown']);
                        attachmentUrl = driveResult.thumbnailUrl || driveResult.url;
                        driveSuccess = true;
                    } catch (driveErr: any) {
                        console.warn("Drive upload failed, falling back to Supabase", driveErr);
                    }
                }

                if (!driveSuccess) {
                    try {
                        showToast('กำลังอัปโหลดไปที่ Storage สำรอง...', 'info');
                        const fileExt = file.name.split('.').pop();
                        const fileName = `${currentUser.id}_${Date.now()}.${fileExt}`;
                        const { error: uploadErr } = await supabase.storage
                            .from('chat-files')
                            .upload(`proofs/${fileName}`, file);

                        if (uploadErr) throw uploadErr;

                        const { data } = supabase.storage.from('chat-files').getPublicUrl(`proofs/${fileName}`);
                        attachmentUrl = data.publicUrl;
                    } catch (supabaseErr: any) {
                        console.error("Supabase upload failed", supabaseErr);
                        throw new Error("ไม่สามารถอัปโหลดไฟล์ได้ทั้ง Google Drive และ Supabase");
                    }
                }
            }

            // Insert primary request (e.g. FORGOT_CHECKIN)
            const insertedLeaveReq = await attendanceService.insertLeaveRequest({
                user_id: currentUser.id,
                type,
                start_date: startDateStr,
                end_date: format(endDate, 'yyyy-MM-dd'),
                reason: isLateSubmission ? `[LATE_SUBMISSION] ${finalReasonWithLink}` : finalReasonWithLink,
                attachment_url: attachmentUrl,
                status: 'PENDING'
            });

            // Insert secondary request (e.g. WFH or ONSITE) linked with same LINKID if not already exists
            if (linkedRemoteType && linkId) {
                const { data: existingRemote } = await supabase
                    .from('leave_requests')
                    .select('id')
                    .eq('user_id', currentUser.id)
                    .eq('type', linkedRemoteType)
                    .eq('start_date', startDateStr)
                    .in('status', ['PENDING', 'APPROVED'])
                    .maybeSingle();

                if (!existingRemote) {
                    const dualReason = `[LINKID:${linkId}] ขออนุมัติปฏิบัติงานรีโมทโดยไม่ได้ขออนุญาตล่วงหน้า (เนื่องจากอยู่นอกพิกัดหลัก)`;
                    await attendanceService.insertLeaveRequest({
                        user_id: currentUser.id,
                        type: linkedRemoteType,
                        start_date: startDateStr,
                        end_date: startDateStr,
                        reason: dualReason,
                        attachment_url: null,
                        status: 'PENDING'
                    });
                }
            }

            if (type === 'FORGOT_CHECKIN') {
                const { data: existingLog } = await supabase
                    .from('attendance_logs')
                    .select('*')
                    .eq('user_id', currentUser.id)
                    .eq('date', startDateStr)
                    .maybeSingle();

                let finalNote = '[PROVISIONAL_FORGOT_CHECKIN]';
                if (linkedRemoteType) {
                    finalNote = `[PROVISIONAL_FORGOT_CHECKIN] [PROVISIONAL_${linkedRemoteType}]`;
                }
                if (existingLog?.note) {
                    if (!existingLog.note.includes('[PROVISIONAL_FORGOT_CHECKIN]')) {
                        finalNote = `${existingLog.note} ${finalNote}`.trim();
                    } else {
                        finalNote = existingLog.note;
                    }
                }

                const payload: any = {
                    user_id: currentUser.id,
                    date: startDateStr,
                    check_in_time: startDate.toISOString(),
                    status: 'WORKING',
                    note: finalNote,
                    work_type: linkedRemoteType || existingLog?.work_type || 'OFFICE'
                };

                await supabase.from('attendance_logs').upsert(payload, { onConflict: 'user_id, date' });
                
                if (startDateStr === format(new Date(), 'yyyy-MM-dd')) {
                    await supabase.from('profiles').update({ work_status: 'ONLINE' }).eq('id', currentUser.id);
                }
            }

            if (type === 'LATE_ENTRY') {
                const { data: existingLog } = await supabase
                    .from('attendance_logs')
                    .select('*')
                    .eq('user_id', currentUser.id)
                    .eq('date', startDateStr)
                    .maybeSingle();

                let finalNote = '[PROVISIONAL_LATE_ENTRY]';
                if (linkedRemoteType) {
                    finalNote = `[PROVISIONAL_LATE_ENTRY] [PROVISIONAL_${linkedRemoteType}]`;
                }
                if (existingLog?.note) {
                    if (!existingLog.note.includes('[PROVISIONAL_LATE_ENTRY]')) {
                        finalNote = `${existingLog.note} ${finalNote}`.trim();
                    } else {
                        finalNote = existingLog.note;
                    }
                }

                const payload: any = {
                    user_id: currentUser.id,
                    date: startDateStr,
                    check_in_time: startDate.toISOString(),
                    status: 'WORKING',
                    note: finalNote,
                    work_type: linkedRemoteType || existingLog?.work_type || 'OFFICE'
                };

                await supabase.from('attendance_logs').upsert(payload, { onConflict: 'user_id, date' });
                
                if (startDateStr === format(new Date(), 'yyyy-MM-dd')) {
                    await supabase.from('profiles').update({ work_status: 'ONLINE' }).eq('id', currentUser.id);
                }
            }

            if (type === 'FORGOT_CHECKOUT' || type === 'OUT_OF_RANGE_CHECKOUT') {
                await supabase.from('attendance_logs').update({ status: 'PENDING_VERIFY' }).eq('user_id', currentUser.id).eq('date', startDateStr);
            }

            if (type === 'WFH' || type === 'ONSITE') {
                const { data: existingLog } = await supabase
                    .from('attendance_logs')
                    .select('*')
                    .eq('user_id', currentUser.id)
                    .eq('date', startDateStr)
                    .maybeSingle();

                if (existingLog) {
                    await supabase
                        .from('attendance_logs')
                        .update({ status: 'PENDING_VERIFY' })
                        .eq('id', existingLog.id);
                }
            }

            const displayType = linkedRemoteType ? `${type} + ${linkedRemoteType}` : type;
            const msg = `📢 **${currentUser.name}** ส่งคำขอ (${displayType}) \n📅 ${format(startDate, 'd MMM')} \n📝: ${reason}`;
            await supabase.from('team_messages').insert({
                content: msg,
                is_bot: true,
                message_type: 'TEXT',
                user_id: null
            });

            try {
                const { data: admins } = await supabase.from('profiles').select('id').eq('role', 'ADMIN');
                if (admins && admins.length > 0) {
                    const labelPrimary = ATTENDANCE_REGISTRY[type]?.label || type;
                    const labelSecondary = linkedRemoteType ? ` + ${ATTENDANCE_REGISTRY[linkedRemoteType]?.label || linkedRemoteType}` : '';
                    const labelCombine = `${labelPrimary}${labelSecondary}`;

                    const generalNotifs = admins.map(admin => ({
                        user_id: admin.id,
                        type: 'APPROVAL_REQ',
                        title: `📋 คำขออนุมัติ [${labelCombine}]`,
                        message: `คุณ ${currentUser.name || 'พนักงาน'} ส่งคำขอ [${labelCombine}] วันที่ ${format(startDate, 'd MMM')}: "${reason}"`,
                        is_read: false,
                        link_path: 'ATTENDANCE',
                        related_id: insertedLeaveReq?.id || null,
                        metadata: { request_type: type }
                    }));
                    await supabase.from('notifications').insert(generalNotifs);
                }
            } catch (notiErr) {
                console.error("Failed to insert admin general notifications:", notiErr);
            }

            showToast('ส่งคำขอเรียบร้อย รออนุมัติครับ 📨', 'success');
            if (refreshLeaves) await refreshLeaves();
            if (refreshAttendance) await refreshAttendance();
            if (refreshOTRequests) await refreshOTRequests();
            fetchMyRequests();
            return true;
        } catch (err: any) {
            showToast('ส่งคำขอไม่สำเร็จ: ' + err.message, 'error');
            return false;
        }
    };

    const fetchRequestsForRange = useCallback(async (start?: Date, end?: Date): Promise<LeaveRequest[]> => {
        if (!currentUser?.id) return [];
        setIsLoadingHistorical(true);
        try {
            const options: any = { all: false };
            if (start) options.startDate = format(start, 'yyyy-MM-dd');
            if (end) options.endDate = format(end, 'yyyy-MM-dd');
            const data = await attendanceService.fetchCombinedRequests(currentUser.id, options);
            return data;
        } catch (err) {
            console.error("Fetch requests for range failed", err);
            showToast('ดึงข้อมูลประวัติย้อนหลังล้มเหลว', 'error');
            return [];
        } finally {
            setIsLoadingHistorical(false);
        }
    }, [currentUser?.id]);

    return {
        requests,
        leaveUsage,
        pendingUsage,
        isLoading,
        isLoadingHistorical,
        submitRequest,
        fetchMyRequests,
        fetchRequestsForRange
    };
};
