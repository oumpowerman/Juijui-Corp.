import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { LeaveRequest, LeaveType, RequestStatus } from '../types/attendance';
import { useToast } from '../context/ToastContext';
import { format } from 'date-fns';
import { useUserSession } from '../context/UserSessionContext';
import { useMasterData } from './useMasterData';
import { useGamification } from './useGamification';
import { useGlobalDialog } from '../context/GlobalDialogContext';
import { attendanceService } from '../services/attendanceService';
import { adminApprovalService } from '../services/adminApprovalService';
import { checkLeaveQuota } from '../utils/adminApprovalHelpers';

export const useAdminApprovals = (currentUser?: any, options: { enabled?: boolean } = {}) => {
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

    const { annualHolidays, calendarExceptions, masterOptions } = useMasterData();
    const { showConfirm } = useGlobalDialog();
    const { processAction, adminAdjustStats } = useGamification();
    const [rawRequests, setRawRequests] = useState<LeaveRequest[]>([]);
    const [isLoading, setIsLoading] = useState(enabled);
    const [isLoadingHistorical, setIsLoadingHistorical] = useState(false);
    const { showToast } = useToast();

    const fetchAllRequests = useCallback(async () => {
        if (!enabled) return;
        setIsLoading(true);
        try {
            const data = await attendanceService.fetchCombinedRequests(undefined, { all: true, isAdmin: true });
            setRawRequests(data);
        } catch (err: any) {
            console.error("Fetch all requests failed", err);
        } finally {
            setIsLoading(false);
        }
    }, [enabled]);

    const fetchRequestsForRange = useCallback(async (start?: Date, end?: Date): Promise<LeaveRequest[]> => {
        if (!enabled) return [];
        setIsLoadingHistorical(true);
        try {
            const options: any = { all: true, isAdmin: true };
            if (start) options.startDate = format(start, 'yyyy-MM-dd');
            if (end) options.endDate = format(end, 'yyyy-MM-dd');
            const data = await attendanceService.fetchCombinedRequests(undefined, options);
            
            // Map users if they aren't fully merged
            return data.map(req => {
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
        } catch (err: any) {
            console.error("Fetch requests for range failed", err);
            showToast('ดึงข้อมูลประวัติย้อนหลังล้มเหลว', 'error');
            return [];
        } finally {
            setIsLoadingHistorical(false);
        }
    }, [enabled, allUsers]);

    useEffect(() => {
        if (!enabled) {
            setIsLoading(false);
            return;
        }
        if (currentUser?.role !== 'ADMIN') return;

        if (!isContextReady) {
            fetchAllRequests();
            return;
        }

        // Merge standard leaves and OT requests from context
        let combinedRequests = [...contextLeaveRequests];
        
        const mappedOtRequests: LeaveRequest[] = (contextOtRequests || []).map(r => ({
            id: r.id,
            userId: r.userId,
            type: 'OVERTIME' as LeaveType,
            startDate: new Date(r.date + 'T' + r.startTime),
            endDate: new Date(r.date + 'T' + r.endTime),
            reason: `[OT:${r.durationHours}hr] ${r.reason}`,
            status: r.status as RequestStatus,
            createdAt: new Date(r.createdAt),
            rejectionReason: r.rejectionReason,
            user: r.user,
            attachmentUrl: r.attachmentUrl
        }));

        combinedRequests = [...combinedRequests, ...mappedOtRequests];
        combinedRequests.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        setRawRequests(combinedRequests);
        setIsLoading(false);
    }, [currentUser?.role, contextLeaveRequests, contextOtRequests, isContextReady, enabled]);

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

    const approveRequest = async (
        request: LeaveRequest, 
        customOtHours?: number, 
        customStartTime?: string, 
        customEndTime?: string,
        adminNote?: string,
        hpPenalty?: number
    ) => {
        if (!currentUser || currentUser.role !== 'ADMIN') {
            showToast('คุณไม่มีสิทธิ์ในการอนุมัติคำขอ', 'error');
            return;
        }

        const isDedicatedOtRequest = (contextOtRequests || []).some(ot => ot.id === request.id);

        if (isDedicatedOtRequest) {
            try {
                const otReq = (contextOtRequests || []).find(r => r.id === request.id);
                if (!otReq) throw new Error('ไม่พบข้อมูลคำขอ OT');

                const { checkOutMsg } = await adminApprovalService.approveOtRequestTransaction({
                    otReq,
                    currentUser,
                    customOtHours,
                    customStartTime,
                    customEndTime,
                    adminNote,
                    processAction
                });

                showToast(`อนุมัติคำขอ OT เรียบร้อยแล้ว${checkOutMsg} 🎉`, 'success');
                if (refreshOTRequests) {
                    await refreshOTRequests();
                }
                fetchAllRequests();
            } catch (err: any) {
                showToast('อนุมัติ OT ล้มเหลว: ' + err.message, 'error');
            }
            return;
        }

        const LEAVE_TYPES = ['SICK', 'VACATION', 'PERSONAL', 'EMERGENCY', 'UNPAID'];

        // Perform validation & Quota confirmation before Optimistic Update & Transaction
        if (LEAVE_TYPES.includes(request.type)) {
            if (request.startDate > request.endDate) {
                showToast('วันที่เริ่มต้นต้องไม่มากกว่าวันที่สิ้นสุดครับ', 'error');
                return;
            }

            // Check Quota and Warn Admin
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

            if (limit < 999) {
                try {
                    // Fetch existing approved requests
                    const { data: userApprovedRequests } = await supabase
                        .from('leave_requests')
                        .select('*')
                        .eq('user_id', request.userId)
                        .eq('type', request.type)
                        .eq('status', 'APPROVED')
                        .neq('id', request.id); // Exclude current request

                    const quotaResult = checkLeaveQuota(
                        request,
                        userApprovedRequests,
                        masterOptions,
                        annualHolidays || [],
                        calendarExceptions || []
                    );

                    if (quotaResult.isExceeded) {
                        const confirmed = await showConfirm(
                            `พนักงานท่านนี้ (${request.user?.name || 'พนักงาน'}) มีวันลาประเภท ${request.type} ที่ได้รับอนุมัติแล้ว ${quotaResult.approvedDaysCount} วัน และคำขอนี้ต้องการลาอีก ${quotaResult.currentRequestedDays} วัน ซึ่งรวมเป็น ${quotaResult.totalUsedIfApproved} วัน เกินจากโควต้าที่ระบุไว้สูงสุดที่ ${quotaResult.limit} วัน\n\nคุณแน่ใจหรือไม่ที่จะอนุมัติคำขอนี้?`,
                            '⚠️ อนุมัติเกินโควต้า'
                        );
                        if (!confirmed) {
                            return;
                        }
                    }
                } catch (err: any) {
                    console.error('Failed to check leave quota:', err);
                }
            }
        }

        // Optimistic UI Update
        setRawRequests(prev => prev.map(r => r.id === request.id ? { ...r, status: 'APPROVED' } : r));

        try {
            const { type } = await adminApprovalService.approveLeaveOrCorrectionTransaction({
                request,
                currentUser,
                customOtHours,
                customStartTime,
                customEndTime,
                adminNote,
                masterOptions,
                annualHolidays: annualHolidays || [],
                calendarExceptions: calendarExceptions || [],
                processAction
            });

            if (type === 'OVERTIME') {
                const hours = customOtHours !== undefined ? customOtHours : 2.0; // fallback or parsed
                showToast(`อนุมัติการทำ OT เรียบร้อย มอบแต้มสำหรับ ${hours} ชม.`, 'success');
            } else if (LEAVE_TYPES.includes(type)) {
                showToast(`อนุมัติวันลา (${type}) และลงบันทึกแล้ว ✅`, 'success');
            } else {
                showToast('ปรับปรุงข้อมูลเวลาให้เรียบร้อยแล้ว ✅', 'success');
            }

            // Deduct HP penalty if specified
            if (hpPenalty && hpPenalty > 0) {
                try {
                    await adminAdjustStats(request.userId, { hp: -hpPenalty }, `หัก HP โดยแอดมินจากการอนุมัติรายการแบบมีเงื่อนไข ${request.type} วันที่ ${format(new Date(request.startDate), 'yyyy-MM-dd')}`);
                } catch (adjErr) {
                    console.error('Failed to deduct HP via adminAdjustStats:', adjErr);
                }
            }

            if (refreshLeaves) await refreshLeaves();
            if (refreshAttendance) await refreshAttendance();
            if (refreshOTRequests) await refreshOTRequests();
            fetchAllRequests();
        } catch (err: any) {
            // Rollback optimistic update
            setRawRequests(prev => prev.map(r => r.id === request.id ? { ...r, status: 'PENDING' } : r));
            showToast('เกิดข้อผิดพลาด: ' + err.message, 'error');
        }
    };

    const rejectRequest = async (id: string, reason: string, customCheckInTime?: string, hpPenalty?: number, rejectionMode?: 'ABSENT' | 'ACTION_REQUIRED' | 'KEEP_WORKING') => {
        if (!currentUser || currentUser.role !== 'ADMIN') {
            showToast('คุณไม่มีสิทธิ์ในการปฏิเสธคำขอ', 'error');
            return;
        }

        const isDedicatedOtRequest = (contextOtRequests || []).some(ot => ot.id === id);
        let otReq: any = null;
        if (isDedicatedOtRequest) {
            otReq = (contextOtRequests || []).find(r => r.id === id);
        }

        const targetReq = requests.find(r => r.id === id);

        // Optimistic UI Update
        setRawRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'REJECTED', rejectionReason: reason } : r));

        try {
            await adminApprovalService.rejectRequestTransaction({
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
            });

            showToast('ปฏิเสธคำขอเรียบร้อย', 'info');

            // Deduct HP penalty if specified
            if (hpPenalty && hpPenalty > 0 && targetReq) {
                try {
                    await adminAdjustStats(targetReq.userId, { hp: -hpPenalty }, `หัก HP โดยแอดมินจากการปฏิเสธคำขอ ${targetReq.type} วันที่ ${format(new Date(targetReq.startDate), 'yyyy-MM-dd')} ด้วยเหตุผล: ${reason}`);
                } catch (adjErr) {
                    console.error('Failed to deduct HP via adminAdjustStats:', adjErr);
                }
            }

            if (refreshLeaves) await refreshLeaves();
            if (refreshAttendance) await refreshAttendance();
            if (refreshOTRequests) await refreshOTRequests();
            fetchAllRequests();
        } catch (err: any) {
            // Rollback optimistic update
            setRawRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'PENDING' } : r));
            showToast('ปฏิเสธคำขอล้มเหลว: ' + err.message, 'error');
        }
    };

    return {
        requests,
        isLoading,
        isLoadingHistorical,
        approveRequest,
        rejectRequest,
        fetchAllRequests,
        fetchRequestsForRange
    };
};
