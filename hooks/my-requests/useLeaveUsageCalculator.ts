import { useMemo } from 'react';
import { isValid, eachDayOfInterval } from 'date-fns';
import { LeaveRequest, LeaveType, LeaveUsage } from '../../types/attendance';
import { ATTENDANCE_REGISTRY } from '../../constants/attendanceRegistry';
import { isWorkingDay, countWorkingDaysBetween } from '../../utils/judgeUtils';

/**
 * Checks if a request was submitted more than 2 working days after the request date
 */
export const checkLateSubmissionRule = (
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

interface UseLeaveUsageCalculatorProps {
    requests: LeaveRequest[];
    currentUser?: any;
    annualHolidays: any;
    calendarExceptions: any;
    enabled?: boolean;
}

/**
 * Hook to calculate approved and pending leave usage as well as late submission evaluation.
 */
export const useLeaveUsageCalculator = ({
    requests,
    currentUser,
    annualHolidays,
    calendarExceptions,
    enabled = true
}: UseLeaveUsageCalculatorProps) => {
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
                    if (req.isHalfDay) {
                        usage[req.type as keyof LeaveUsage] += 0.5;
                    } else {
                        const start = new Date(req.startDate);
                        const end = new Date(req.endDate);
                        if (!isValid(start) || !isValid(end) || start > end) return; 
                        
                        const days = eachDayOfInterval({ start, end });
                        const workingDaysCount = days.filter(d => 
                            isWorkingDay(d, annualHolidays, calendarExceptions, currentUser)
                        ).length;
                        
                        usage[req.type as keyof LeaveUsage] += workingDaysCount;
                    }
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
                    if (req.isHalfDay) {
                        usage[req.type as keyof LeaveUsage] += 0.5;
                    } else {
                        const start = new Date(req.startDate);
                        const end = new Date(req.endDate);
                        if (!isValid(start) || !isValid(end) || start > end) return; 
                        
                        const days = eachDayOfInterval({ start, end });
                        const workingDaysCount = days.filter(d => 
                            isWorkingDay(d, annualHolidays, calendarExceptions, currentUser)
                        ).length;
                        
                        usage[req.type as keyof LeaveUsage] += workingDaysCount;
                    }
                } else {
                    usage[req.type as keyof LeaveUsage] += 1;
                }
            }
        });

        return usage;
    }, [requests, currentUser?.id, annualHolidays, calendarExceptions, enabled]);

    return {
        leaveUsage,
        pendingUsage,
        checkLateSubmissionRule
    };
};
