import { useState, useEffect, useMemo, useCallback } from 'react';
import { LeaveRequest, LeaveType, RequestStatus } from '../types/attendance';
import { useToast } from '../context/ToastContext';
import { useGlobalDialog } from '../context/GlobalDialogContext';
import { format } from 'date-fns';
import { useUserSession } from '../context/UserSessionContext';
import { useMasterData } from './useMasterData';
import { attendanceService } from '../services/attendanceService';
import {
    useLeaveUsageCalculator,
    useAttendanceProofUploader,
    useProvisionalAttendanceSync,
    useOtRequestSubmitter,
    useLeaveRequestSubmitter,
    checkLateSubmissionRule
} from './my-requests';

// Re-export utility functions
export { checkLateSubmissionRule };

/**
 * Orchestrator hook for managing current user's leave & overtime requests,
 * calculating usage quotas, and dispatching submissions.
 */
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
    const { showLoading, hideLoading } = useGlobalDialog();

    // 1. Proof attachment uploader
    const { uploadProofFiles } = useAttendanceProofUploader();

    // 2. Provisional attendance sync side-effects
    const { syncProvisionalAttendance } = useProvisionalAttendanceSync();

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
    }, [currentUser?.id, contextLeaveRequests, contextOtRequests, isContextReady, enabled, fetchMyRequests]);

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

    // 3. Leave quota and pending usage calculator
    const { leaveUsage, pendingUsage } = useLeaveUsageCalculator({
        requests,
        currentUser,
        annualHolidays,
        calendarExceptions,
        enabled
    });

    // 4. OT submitter
    const { submitOtRequest } = useOtRequestSubmitter({
        currentUser,
        annualHolidays,
        calendarExceptions,
        refreshLeaves,
        refreshAttendance,
        refreshOTRequests,
        fetchMyRequests
    });

    // 5. Leave & Correction submitter
    const { submitLeaveRequest } = useLeaveRequestSubmitter({
        currentUser,
        annualHolidays,
        calendarExceptions,
        syncProvisionalAttendance,
        refreshLeaves,
        refreshAttendance,
        refreshOTRequests,
        fetchMyRequests
    });

    // Unified submit entrypoint
    const submitRequest = async (
        type: LeaveType, 
        startDate: Date, 
        endDate: Date, 
        reason: string, 
        file?: File | File[],
        linkedRemoteType?: 'WFH' | 'ONSITE',
        isHalfDay?: boolean,
        halfDaySession?: string,
        isInstantCheckIn?: boolean,
        coords?: { lat?: number | null; lng?: number | null; locationName?: string | null }
    ): Promise<boolean> => {
        if (!currentUser?.id) return false;
        showLoading('กำลังอัปโหลดไฟล์และส่งคำขอเข้าระบบ...');
        try {
            // Upload proof files via multi-tier uploader
            const uploadedUrls = await uploadProofFiles(file, currentUser);
            const startDateStr = format(startDate, 'yyyy-MM-dd');

            // --- OT Request Handling ---
            if (type === 'OVERTIME') {
                return await submitOtRequest({
                    startDate,
                    startDateStr,
                    reason,
                    uploadedUrls
                });
            }

            // --- Standard Leave / Time Correction Handling ---
            return await submitLeaveRequest({
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
            });
        } catch (err: any) {
            showToast('ส่งคำขอไม่สำเร็จ: ' + err.message, 'error');
            return false;
        } finally {
            hideLoading();
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
    }, [currentUser?.id, showToast]);

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
