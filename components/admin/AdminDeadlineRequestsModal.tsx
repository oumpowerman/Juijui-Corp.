import React, { useEffect, useState, useMemo } from 'react';
import BaseModal from '../common/BaseModal';
import { DeadlineRequest, User, Task } from '../../types';
import { useDeadlineRequests } from '../../hooks/useDeadlineRequests';
import { useToast } from '../../context/ToastContext';
import { useNotificationContext } from '../../context/NotificationContext';
import { useTaskContext } from '../../context/TaskContext';
import { getCalendarDayDiff, parseLocalYMD, toLocalYMD } from '../../utils/dateUtils';

import DeadlineRequestsHeader from './deadline/DeadlineRequestsHeader';
import DeadlineRequestsFilters from './deadline/DeadlineRequestsFilters';
import DeadlineRequestsList from './deadline/DeadlineRequestsList';
import DeadlineRequestsInspector from './deadline/DeadlineRequestsInspector';
import DeadlineRequestsBatchBar from './deadline/DeadlineRequestsBatchBar';

interface AdminDeadlineRequestsModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentUser: User;
    users?: User[];
    tasks?: Task[];
    metrics: {
        total: number;
        urgent: number;
        longExtensions: number;
        topRequester: string;
    };
}

const REJECTION_TEMPLATES = [
    'เหตุผลยังไม่เพียงพอต่อการเลื่อนกำหนดส่ง',
    'งานนี้มีกำหนดส่งมอบ/ออนแอร์ด่วน ไม่สามารถเลื่อนได้',
    'การเลื่อนส่งผลกระทบต่อแผนงานส่วนอื่นของทีม',
    'ระยะเวลาที่ขอเลื่อนนานเกินเกณฑ์ (เกิน 7 วัน) กรุณาปรับวันใหม่'
];

const AdminDeadlineRequestsModal: React.FC<AdminDeadlineRequestsModalProps> = ({
    isOpen,
    onClose,
    currentUser,
    users = [],
    tasks = []
}) => {
    const { resolveRequest } = useDeadlineRequests(currentUser);
    const { deadlineRequests: requests, isLoading: isFetching, refreshData } = useNotificationContext();
    const { fetchTasks } = useTaskContext();
    const { showToast } = useToast();

    const [localRequests, setLocalRequests] = useState<DeadlineRequest[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isProcessingBatch, setIsProcessingBatch] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState<'ALL' | 'ASSIGNED_TO_ME' | 'URGENT' | 'LONG' | 'CRITICAL'>('ALL');
    const [sortBy, setSortBy] = useState<'NEWEST' | 'OLDEST' | 'NEW_DEADLINE' | 'EMPLOYEE'>('NEWEST');
    const [selectedReq, setSelectedReq] = useState<DeadlineRequest | null>(null);
    const [customDate, setCustomDate] = useState<string>('');
    const [rejectionReason, setRejectionReason] = useState<string>('');

    // Sync local optimistic list with NotificationContext
    useEffect(() => {
        setLocalRequests(requests);
    }, [requests]);

    // Clean up stale selections if items were resolved
    useEffect(() => {
        setSelectedIds((prev) => prev.filter((id) => localRequests.some((r) => r.id === id)));
        if (selectedReq && !localRequests.some((r) => r.id === selectedReq.id)) {
            setSelectedReq(null);
        }
    }, [localRequests, selectedReq]);

    // Sync customDate and reset rejectionReason whenever selected request changes
    useEffect(() => {
        if (selectedReq) {
            setCustomDate(toLocalYMD(selectedReq.newDeadline));
            setRejectionReason('');
        } else {
            setCustomDate('');
            setRejectionReason('');
        }
    }, [selectedReq]);

    // Count duplicate pending rows per task/goal so Admin knows if legacy duplicates exist
    const duplicateCounts = useMemo(() => {
        const map = new Map<string, number>();
        localRequests.forEach((r) => {
            const key = `${r.requestType || 'TASK'}:${r.taskId}`;
            map.set(key, (map.get(key) || 0) + 1);
        });
        return map;
    }, [localRequests]);

    const metrics = useMemo(() => {
        const total = localRequests.length;
        const now = new Date();

        const urgent = localRequests.filter((r) => {
            const originalEnd = r.originalDeadline ? new Date(r.originalDeadline) : null;
            if (!originalEnd) return false;
            return originalEnd.getTime() < now.getTime() || originalEnd.getTime() - now.getTime() < 24 * 60 * 60 * 1000;
        }).length;

        const longExtensions = localRequests.filter((r) => {
            if (!r.originalDeadline) return false;
            return getCalendarDayDiff(r.originalDeadline, r.newDeadline) >= 7;
        }).length;

        const requestersCount: Record<string, number> = {};
        localRequests.forEach((r) => {
            const name = r.user?.name || 'พนักงาน';
            requestersCount[name] = (requestersCount[name] || 0) + 1;
        });

        let topRequester = 'ไม่มี';
        let maxReqVal = 0;
        Object.entries(requestersCount).forEach(([name, count]) => {
            if (count > maxReqVal) {
                maxReqVal = count;
                topRequester = `${name} (${count} รายการ)`;
            }
        });

        return { total, urgent, longExtensions, topRequester };
    }, [localRequests]);

    const myRequestsCount = useMemo(() => {
        return localRequests.filter((r) => !r.approverId || r.approverId === currentUser.id).length;
    }, [localRequests, currentUser.id]);

    const filteredRequests = useMemo(() => {
        let result = [...localRequests];
        const now = new Date();

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(
                (r) =>
                    r.user?.name?.toLowerCase().includes(query) ||
                    r.taskTitle?.toLowerCase().includes(query) ||
                    r.reason?.toLowerCase().includes(query)
            );
        }

        if (filterCategory === 'ASSIGNED_TO_ME') {
            result = result.filter((r) => !r.approverId || r.approverId === currentUser.id);
        } else if (filterCategory === 'URGENT') {
            result = result.filter((r) => {
                const originalEnd = r.originalDeadline ? new Date(r.originalDeadline) : null;
                if (!originalEnd) return false;
                return originalEnd.getTime() < now.getTime() || originalEnd.getTime() - now.getTime() < 24 * 60 * 60 * 1000;
            });
        } else if (filterCategory === 'LONG') {
            result = result.filter((r) => {
                if (!r.originalDeadline) return false;
                return getCalendarDayDiff(r.originalDeadline, r.newDeadline) >= 7;
            });
        } else if (filterCategory === 'CRITICAL') {
            result = result.filter((r) => {
                const userPendingCount = tasks.filter(
                    (t) =>
                        t.assigneeIds.includes(r.requestedBy) &&
                        t.status !== 'DONE' &&
                        t.status !== 'FINAL'
                ).length;
                return userPendingCount >= 3;
            });
        }

        if (sortBy === 'NEWEST') {
            result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        } else if (sortBy === 'OLDEST') {
            result.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        } else if (sortBy === 'NEW_DEADLINE') {
            result.sort((a, b) => a.newDeadline.getTime() - b.newDeadline.getTime());
        } else if (sortBy === 'EMPLOYEE') {
            result.sort((a, b) => (a.user?.name || '').localeCompare(b.user?.name || ''));
        }

        return result;
    }, [localRequests, searchQuery, filterCategory, sortBy, tasks, currentUser.id]);

    const otherAdminCount = useMemo(() => {
        return localRequests.filter(
            (r) => selectedIds.includes(r.id) && r.approverId && r.approverId !== currentUser.id
        ).length;
    }, [localRequests, selectedIds, currentUser.id]);

    const removeTargetRequestsOptimistically = (targetType: 'TASK' | 'GOAL', targetId: string) => {
        setLocalRequests((prev) =>
            prev.filter((r) => !((r.requestType || 'TASK') === targetType && r.taskId === targetId))
        );
        if (selectedReq && (selectedReq.requestType || 'TASK') === targetType && selectedReq.taskId === targetId) {
            setSelectedReq(null);
        }
    };

    const handleApprove = async (req: DeadlineRequest) => {
        if (!customDate) {
            showToast('กรุณาเลือกวันที่ที่ต้องการอนุมัติ', 'error');
            return;
        }
        const targetDate = parseLocalYMD(customDate);
        if (!targetDate) {
            showToast('รูปแบบวันที่ไม่ถูกต้อง', 'error');
            return;
        }

        setIsProcessingBatch(true);
        const previousLocal = [...localRequests];
        const previousSelected = selectedReq ? { ...selectedReq } : null;
        const reqType = req.requestType || 'TASK';

        removeTargetRequestsOptimistically(reqType, req.taskId);

        const { success, error } = await resolveRequest(req.id, req.taskId, true, targetDate, reqType);
        setIsProcessingBatch(false);

        if (success) {
            showToast('อนุมัติการเลื่อนกำหนดส่งสำเร็จ', 'success');
            Promise.all([fetchTasks(), refreshData()]).catch((err) =>
                console.error('Error syncing after approve:', err)
            );
        } else {
            setLocalRequests(previousLocal);
            setSelectedReq(previousSelected);
            showToast('เกิดข้อผิดพลาด: ' + error, 'error');
        }
    };

    const handleReject = async (req: DeadlineRequest, reasonText: string) => {
        setIsProcessingBatch(true);
        const previousLocal = [...localRequests];
        const previousSelected = selectedReq ? { ...selectedReq } : null;
        const reqType = req.requestType || 'TASK';
        const trimmedReason = reasonText.trim();

        removeTargetRequestsOptimistically(reqType, req.taskId);

        const { success, error } = await resolveRequest(
            req.id,
            req.taskId,
            false,
            undefined,
            reqType,
            trimmedReason || undefined
        );
        setIsProcessingBatch(false);

        if (success) {
            showToast(
                trimmedReason ? `ปฏิเสธคำขอและส่งเหตุผลถึงพนักงานแล้ว` : 'ปฏิเสธคำขอเลื่อนกำหนดส่งแล้ว',
                'warning'
            );
            Promise.all([fetchTasks(), refreshData()]).catch((err) =>
                console.error('Error syncing after reject:', err)
            );
        } else {
            setLocalRequests(previousLocal);
            setSelectedReq(previousSelected);
            showToast('เกิดข้อผิดพลาดในการปฏิเสธคำขอ: ' + error, 'error');
        }
    };

    const toggleSelect = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
    };

    const handleSelectAll = () => {
        if (selectedIds.length === filteredRequests.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredRequests.map((r) => r.id));
        }
    };

    const handleBatchResolve = async (isApproved: boolean) => {
        if (selectedIds.length === 0) return;
        setIsProcessingBatch(true);

        const previousLocal = [...localRequests];
        const previousSelected = selectedReq ? { ...selectedReq } : null;
        const previousSelectedIds = [...selectedIds];

        const selectedItems = previousLocal.filter((r) => selectedIds.includes(r.id));

        // Deduplicate by (requestType, taskId) so sibling duplicate rows are resolved in one clean pass
        const uniqueTargetsMap = new Map<string, DeadlineRequest>();
        selectedItems.forEach((req) => {
            const key = `${req.requestType || 'TASK'}:${req.taskId}`;
            if (!uniqueTargetsMap.has(key)) {
                uniqueTargetsMap.set(key, req);
            }
        });
        const uniqueTargets = Array.from(uniqueTargetsMap.values());

        // Optimistically clear all sibling rows for affected targets
        const affectedKeys = new Set(uniqueTargetsMap.keys());
        setLocalRequests((prev) =>
            prev.filter((r) => !affectedKeys.has(`${r.requestType || 'TASK'}:${r.taskId}`))
        );
        setSelectedIds([]);
        if (selectedReq && affectedKeys.has(`${selectedReq.requestType || 'TASK'}:${selectedReq.taskId}`)) {
            setSelectedReq(null);
        }

        let successCount = 0;
        let failCount = 0;

        try {
            const results = await Promise.all(
                uniqueTargets.map(async (req) => {
                    const reqType = req.requestType || 'TASK';
                    const { success } = await resolveRequest(
                        req.id,
                        req.taskId,
                        isApproved,
                        isApproved ? req.newDeadline : undefined,
                        reqType,
                        isApproved ? undefined : 'ไม่ผ่านเกณฑ์การพิจารณาแบบกลุ่ม'
                    );
                    return success;
                })
            );
            successCount = results.filter((r) => r === true).length;
            failCount = results.length - successCount;
        } catch (e) {
            console.error('Batch processing error:', e);
            failCount = uniqueTargets.length;
        }

        setIsProcessingBatch(false);

        if (successCount > 0) {
            showToast(
                isApproved
                    ? `อนุมัติคำขอสำเร็จ ${successCount} งาน`
                    : `ปฏิเสธคำขอสำเร็จ ${successCount} งาน`,
                'success'
            );
            Promise.all([fetchTasks(), refreshData()]).catch((err) =>
                console.error('Error syncing after batch resolve:', err)
            );
        }
        if (failCount > 0) {
            setLocalRequests(previousLocal);
            setSelectedIds(previousSelectedIds);
            setSelectedReq(previousSelected);
            showToast(`มีรายการที่ไม่สามารถดำเนินการได้ ${failCount} รายการ กรุณาลองใหม่`, 'error');
        }
    };

    const insights = useMemo(() => {
        if (!selectedReq) return null;

        const requester = users.find((u) => u.id === selectedReq.requestedBy);
        const activeTasks = tasks.filter(
            (t) =>
                t.assigneeIds.includes(selectedReq.requestedBy) &&
                t.status !== 'DONE' &&
                t.status !== 'FINAL' &&
                t.id !== selectedReq.taskId
        );

        const parentTask =
            selectedReq.requestType === 'GOAL'
                ? ({ id: selectedReq.taskId, title: selectedReq.goalTitle, endDate: selectedReq.originalDeadline } as any)
                : tasks.find((t) => t.id === selectedReq.taskId);

        const originalEnd = selectedReq.originalDeadline || parentTask?.endDate || null;
        const diffDays = originalEnd ? getCalendarDayDiff(originalEnd, selectedReq.newDeadline) : 0;

        return {
            requester,
            activeTasks,
            parentTask,
            diffDays,
            workloadRank:
                activeTasks.length >= 4
                    ? 'งานค้างหนาแน่น'
                    : activeTasks.length >= 2
                        ? 'งานค้างปานกลาง'
                        : 'ภาระงานคล่องตัว'
        };
    }, [selectedReq, users, tasks]);

    const currentDupCount = selectedReq
        ? duplicateCounts.get(`${selectedReq.requestType || 'TASK'}:${selectedReq.taskId}`) || 1
        : 1;

    return (
        <BaseModal
            isOpen={isOpen}
            onClose={onClose}
            closeOnBackdropClick={!isProcessingBatch}
            closeOnEscape={!isProcessingBatch}
            containerClassName="p-0 sm:p-4"
            backdropClassName="bg-slate-900/40 backdrop-blur-sm"
            windowClassName="bg-white w-full max-w-6xl h-[94vh] sm:h-[90vh] rounded-t-[2rem] sm:rounded-3xl border border-slate-200/80 shadow-2xl flex flex-col overflow-hidden relative"
        >
            {/* Header */}
            <DeadlineRequestsHeader
                requestsCount={localRequests.length}
                metrics={metrics}
                onClose={onClose}
            />

            {/* Filters */}
            <DeadlineRequestsFilters
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                filterCategory={filterCategory}
                setFilterCategory={setFilterCategory}
                sortBy={sortBy}
                setSortBy={setSortBy}
                requestsLength={localRequests.length}
                filteredCount={filteredRequests.length}
                metrics={metrics}
                myRequestsCount={myRequestsCount}
            />

            {/* Responsive Split-Pane Workspace: Master-Detail on mobile, 12-col Split on Desktop */}
            <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 relative overflow-hidden">
                <div className={`${selectedReq ? 'hidden lg:flex' : 'flex'} lg:col-span-5 flex-col min-h-0 h-full`}>
                    <DeadlineRequestsList
                        filteredRequests={filteredRequests}
                        selectedIds={selectedIds}
                        selectedReq={selectedReq}
                        isFetching={isFetching}
                        tasks={tasks}
                        toggleSelect={toggleSelect}
                        handleSelectAll={handleSelectAll}
                        setSelectedReq={setSelectedReq}
                        currentUser={currentUser}
                        duplicateCounts={duplicateCounts}
                    />
                </div>

                <div className={`${selectedReq ? 'flex' : 'hidden lg:flex'} lg:col-span-7 flex-col min-h-0 h-full`}>
                    <DeadlineRequestsInspector
                        selectedReq={selectedReq}
                        insights={insights}
                        customDate={customDate}
                        setCustomDate={setCustomDate}
                        rejectionReason={rejectionReason}
                        setRejectionReason={setRejectionReason}
                        isProcessingBatch={isProcessingBatch}
                        rejectionTemplates={REJECTION_TEMPLATES}
                        handleApprove={handleApprove}
                        handleReject={handleReject}
                        setSelectedReq={setSelectedReq}
                        currentUser={currentUser}
                        duplicateCount={currentDupCount}
                    />
                </div>
            </div>

            {/* Dedicated Non-Overlapping Batch Action Dock */}
            <DeadlineRequestsBatchBar
                selectedIds={selectedIds}
                isProcessingBatch={isProcessingBatch}
                handleBatchResolve={handleBatchResolve}
                otherAdminCount={otherAdminCount}
            />
        </BaseModal>
    );
};

export default AdminDeadlineRequestsModal;
