import { useCallback } from 'react';
import { format } from 'date-fns';
import { supabase } from '../../lib/supabase';
import { LeaveType } from '../../types/attendance';
import { ATTENDANCE_REGISTRY, getTypesByCategory } from '../../constants/attendanceRegistry';
import { useToast } from '../../context/ToastContext';
import { useGlobalDialog } from '../../context/GlobalDialogContext';
import { attendanceService } from '../../services/attendanceService';
import { checkLateSubmissionRule } from './useLeaveUsageCalculator';
import { useProvisionalAttendanceSync } from './useProvisionalAttendanceSync';

export interface SubmitLeaveParams {
    type: LeaveType;
    startDate: Date;
    endDate: Date;
    reason: string;
    uploadedUrls: string[];
    linkedRemoteType?: 'WFH' | 'ONSITE';
    isHalfDay?: boolean;
    halfDaySession?: string;
    isInstantCheckIn?: boolean;
    coords?: { lat?: number | null; lng?: number | null; locationName?: string | null };
}

interface UseLeaveRequestSubmitterProps {
    currentUser?: any;
    annualHolidays: any;
    calendarExceptions: any;
    syncProvisionalAttendance: ReturnType<typeof useProvisionalAttendanceSync>['syncProvisionalAttendance'];
    refreshLeaves?: () => Promise<void> | void;
    refreshAttendance?: () => Promise<void> | void;
    refreshOTRequests?: () => Promise<void> | void;
    fetchMyRequests: () => Promise<void> | void;
}

/**
 * Hook to handle the submission workflow for Leave and Time-Correction requests,
 * including conflict detection, provisional attendance sync, and notification dispatching.
 */
export const useLeaveRequestSubmitter = ({
    currentUser,
    annualHolidays,
    calendarExceptions,
    syncProvisionalAttendance,
    refreshLeaves,
    refreshAttendance,
    refreshOTRequests,
    fetchMyRequests
}: UseLeaveRequestSubmitterProps) => {
    const { showToast } = useToast();
    const { showConfirm, showLoading, hideLoading } = useGlobalDialog();

    const submitLeaveRequest = useCallback(async ({
        type,
        startDate,
        endDate,
        reason,
        uploadedUrls,
        linkedRemoteType,
        isHalfDay,
        halfDaySession,
        isInstantCheckIn,
        coords
    }: SubmitLeaveParams): Promise<boolean> => {
        if (!currentUser?.id) return false;

        const startDateStr = format(startDate, 'yyyy-MM-dd');
        const timestamp = Date.now();
        const linkId = linkedRemoteType ? `LINK_FORGOT_${currentUser.id}_${startDateStr}_${timestamp}` : null;

        let finalReasonWithLink = linkId ? `[LINKID:${linkId}] ${reason}` : reason;

        if (linkedRemoteType && !finalReasonWithLink.includes('[REMOTE:')) {
            finalReasonWithLink = `[REMOTE:${linkedRemoteType}] ${finalReasonWithLink}`;
        }

        if (type === 'FORGOT_CHECKOUT' || type === 'OUT_OF_RANGE_CHECKOUT') {
            if (!finalReasonWithLink.includes('[PROVISIONAL_CHECKOUT]')) {
                finalReasonWithLink = `[PROVISIONAL_CHECKOUT] ${finalReasonWithLink}`;
            }
        }

        // --- Late Submission Rule check ---
        const CORRECTION_TYPES = getTypesByCategory('CORRECTION');
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
                .select('id, type, status, is_half_day, half_day_session')
                .eq('user_id', currentUser.id)
                .in('type', LEAVE_TYPES)
                .eq('start_date', startDateStr)
                .in('status', ['PENDING', 'APPROVED']);

            let conflictingApprovedLeave = null;
            let conflictingPendingLeave = null;

            if (existingLeaves && existingLeaves.length > 0) {
                for (const leave of existingLeaves) {
                    const isExistingHalfDay = !!leave.is_half_day;
                    const existingSession = leave.half_day_session;

                    const isNewHalfDay = !!isHalfDay;
                    const newSession = halfDaySession;

                    let hasConflict = false;
                    if (!isExistingHalfDay || !isNewHalfDay) {
                        // If either is a full day leave, they conflict on the same day
                        hasConflict = true;
                    } else {
                        // Both are half days. They conflict only if they share the same session (e.g., both AM or both PM)
                        if (existingSession === newSession) {
                            hasConflict = true;
                        }
                    }

                    if (hasConflict) {
                        if (leave.status === 'APPROVED') {
                            conflictingApprovedLeave = leave;
                        } else if (leave.status === 'PENDING') {
                            conflictingPendingLeave = leave;
                        }
                    }
                }
            }

            if (conflictingApprovedLeave) {
                showToast('คุณมีวันลาที่ได้รับการอนุมัติแล้วในวันนี้ครับ ✅', 'warning');
                return false;
            }

            if (conflictingPendingLeave) {
                const originalTypeName = ATTENDANCE_REGISTRY[conflictingPendingLeave.type as LeaveType]?.label || conflictingPendingLeave.type;
                const newTypeName = ATTENDANCE_REGISTRY[type]?.label || type;
                
                // Hide loading overlay so the user can interact with the confirmation dialog
                hideLoading();

                const confirmReplace = await showConfirm(
                    `ในระบบมีคำขอลา [${originalTypeName}] ที่อยู่ระหว่างรออนุมัติอยู่แล้วในวันนี้\nคุณต้องการ ยกเลิกคำขอเดิม แล้วยื่นคำขอ [${newTypeName}] นี้เข้าไปแทนที่หรือไม่?`,
                    'ตรวจพบคำขอลาซ้ำซ้อน'
                );

                if (confirmReplace) {
                    // Re-show loading as the process resumes
                    showLoading('กำลังอัปโหลดไฟล์และส่งคำขอเข้าระบบ...');
                    await supabase
                        .from('leave_requests')
                        .update({ 
                            status: 'REJECTED',
                            reason: `[REJECTED_FOR_REPLACEMENT] ${newTypeName}`
                        })
                        .eq('id', conflictingPendingLeave.id);
                } else {
                    return false;
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

        // Insert primary request (e.g. FORGOT_CHECKIN)
        const insertedLeaveReq = await attendanceService.insertLeaveRequest({
            user_id: currentUser.id,
            type,
            start_date: startDateStr,
            end_date: format(endDate, 'yyyy-MM-dd'),
            reason: isLateSubmission ? `[LATE_SUBMISSION] ${finalReasonWithLink}` : finalReasonWithLink,
            attachment_urls: uploadedUrls,
            status: 'PENDING',
            is_half_day: isHalfDay,
            half_day_session: halfDaySession
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
                    status: 'PENDING'
                });
            }
        }

        // Check for approved half-day leaves on the target date to link them
        const { data: approvedLeavesForDay } = await supabase
            .from('leave_requests')
            .select('is_half_day, half_day_session')
            .eq('user_id', currentUser.id)
            .eq('status', 'APPROVED')
            .eq('is_half_day', true)
            .eq('start_date', startDateStr);

        const amHalfDay = Boolean(approvedLeavesForDay?.some(l => l.half_day_session === 'AM'));
        const pmHalfDay = Boolean(approvedLeavesForDay?.some(l => l.half_day_session === 'PM'));

        // Execute provisional attendance side effects
        await syncProvisionalAttendance({
            type,
            currentUser,
            startDate,
            endDate,
            startDateStr,
            linkedRemoteType,
            uploadedUrls,
            coords,
            amHalfDay,
            pmHalfDay,
            isInstantCheckIn
        });

        const halfDayStr = isHalfDay ? ` (ลาครึ่งวัน${halfDaySession === 'AM' ? 'เช้า' : 'บ่าย'})` : '';
        const displayType = linkedRemoteType ? `${type} + ${linkedRemoteType}` : type;
        const msg = `📢 **${currentUser.name}** ส่งคำขอ (${displayType}${halfDayStr}) \n📅 ${format(startDate, 'd MMM')} \n📝: ${reason}`;
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
                const labelCombine = `${labelPrimary}${labelSecondary}${halfDayStr}`;

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
    }, [
        currentUser,
        annualHolidays,
        calendarExceptions,
        syncProvisionalAttendance,
        showToast,
        showConfirm,
        showLoading,
        hideLoading,
        refreshLeaves,
        refreshAttendance,
        refreshOTRequests,
        fetchMyRequests
    ]);

    return {
        submitLeaveRequest
    };
};
