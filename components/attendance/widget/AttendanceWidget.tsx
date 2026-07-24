
import React, { useState, useMemo } from 'react';
import { useMasterData } from '../../../hooks/useMasterData';
import { useLeaveRequests } from '../../../hooks/useLeaveRequests';
import { User } from '../../../types';
import { LeaveType } from '../../../types/attendance';
import { isWithinInterval, startOfDay, endOfDay, isFuture, isSameDay, isValid } from 'date-fns';

import AttendanceControl from '../containers/AttendanceControl';
import AttendanceStats from '../containers/AttendanceStats';
import AttendanceAlerts from '../containers/AttendanceAlerts';
import UpcomingLeaveList from './UpcomingLeaveList';
import LeaveRequestModal from '../leave-request/LeaveRequestModal';

interface AttendanceWidgetProps {
    user: User;
    onNavigateToHistory?: (date?: string, requestType?: LeaveType) => void;
}

const AttendanceWidget: React.FC<AttendanceWidgetProps> = ({ user, onNavigateToHistory }) => {
    // Hooks
    const { masterOptions } = useMasterData(); 
    const { submitRequest, leaveUsage, pendingUsage, requests } = useLeaveRequests(user);

    // UI State
    const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
    const [leaveModalType, setLeaveModalType] = useState<LeaveType | undefined>(undefined);
    const [linkedRemoteType, setLinkedRemoteType] = useState<'WFH' | 'ONSITE' | undefined>(undefined);
    const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);

    // --- TIME-SCOPED LOGIC V12 (The Fix) ---
    const today = new Date();

    // 1. "Today's Active Leave" (Affects Current Status)
    const todayActiveLeave = useMemo(() => {
        const CORRECTION_TYPES = ['FORGOT_CHECKIN', 'LATE_ENTRY', 'FORGOT_CHECKOUT', 'FORGOT_BOTH', 'OUT_OF_RANGE_CHECKOUT'];

        const activeRequests = requests.filter(req => {
            if (req.status === 'REJECTED') return false;
            
            const startDate = new Date(req.startDate);
            const endDate = new Date(req.endDate);
            
            // Safety check: ensure dates are valid
            if (!isValid(startDate) || !isValid(endDate)) return false;
            
            const start = startOfDay(startDate);
            const end = endOfDay(endDate);
            
            // Safety check: only call isWithinInterval if start <= end
            if (start > end) return false;
            
            return isWithinInterval(today, { start, end });
        });

        if (activeRequests.length === 0) return null;

        activeRequests.sort((a, b) => {
            const isCorrA = CORRECTION_TYPES.includes(a.type);
            const isCorrB = CORRECTION_TYPES.includes(b.type);

            const getScore = (req: typeof a, isCorr: boolean) => {
                if (!isCorr && req.status === 'APPROVED') return 1;
                if (!isCorr && req.status === 'PENDING') return 2;
                if (isCorr) return 3;
                return 4;
            };

            return getScore(a, isCorrA) - getScore(b, isCorrB);
        });

        return activeRequests[0];
    }, [requests, today]);

    // 2. "Future Requests" (For Upcoming UI - Non-blocking)
    const upcomingRequests = useMemo(() => {
        return requests
            .filter(req => {
                const startDate = new Date(req.startDate);
                if (!isValid(startDate)) return false;
                
                const start = startOfDay(startDate);
                return isFuture(start) && !isSameDay(start, today) && req.status !== 'REJECTED';
            })
            .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
            .slice(0, 3);
    }, [requests, today]);

    // 3. Approved WFH Check
    const todayApprovedWFH = useMemo(() => {
        return todayActiveLeave?.type === 'WFH' && todayActiveLeave.status === 'APPROVED';
    }, [todayActiveLeave]);

    // --- Handlers ---
    const handleLeaveSubmit = async (type: LeaveType, start: Date, end: Date, reason: string, file?: File, linkedRemoteType?: 'WFH' | 'ONSITE'): Promise<boolean> => {
        const result = await submitRequest(type, start, end, reason, file, linkedRemoteType);
        if (result) {
            setIsCheckInModalOpen(false);
        }
        return !!result;
    };

    return (
        <div className="space-y-6">
            {/* 1. Alerts Section */}
            <AttendanceAlerts 
                userId={user.id} 
                onAction={onNavigateToHistory}
            />

            {/* 2. Control Center */}
            <AttendanceControl 
                user={user}
                todayActiveLeave={todayActiveLeave}
                onLeaveSubmit={handleLeaveSubmit}
                onOpenLeave={(type?: LeaveType, workType?: 'WFH' | 'ONSITE') => {
                    setLeaveModalType(type);
                    setLinkedRemoteType(workType);
                    setIsLeaveModalOpen(true);
                }}
                isCheckInModalOpen={isCheckInModalOpen}
                setIsCheckInModalOpen={setIsCheckInModalOpen}
            />

            {/* 3. Stats Board */}
            <AttendanceStats userId={user.id} />

            {/* 4. Future Requests */}
            <UpcomingLeaveList requests={upcomingRequests} />

            {/* Modals */}
            <LeaveRequestModal 
                isOpen={isLeaveModalOpen}
                onClose={() => {
                    setIsLeaveModalOpen(false);
                    setLeaveModalType(undefined);
                    setLinkedRemoteType(undefined);
                }}
                onSubmit={handleLeaveSubmit}
                masterOptions={masterOptions}
                leaveUsage={leaveUsage}
                pendingUsage={pendingUsage}
                requests={requests} 
                fixedType={leaveModalType}
                linkedRemoteType={linkedRemoteType}
            />
        </div>
    );
};

export default AttendanceWidget;
