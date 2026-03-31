
import { useState, useEffect, useCallback, useMemo } from 'react';
import { AttendanceLog } from '../../types/attendance';
import { mapAttendanceLog } from './shared';
import { useUserSession } from '../../context/UserSessionContext';
import { getWorkingDaysDifference } from '../../lib/attendanceUtils';

export const useAttendanceAlerts = (userId: string) => {
    const { attendanceLogs } = useUserSession();

    const actionRequiredLogs = useMemo(() => {
        if (!userId || !attendanceLogs) return [];

        // Filter logs for the current user and status
        const userActionLogs = attendanceLogs.filter(log => 
            log.userId === userId && log.status === 'ACTION_REQUIRED'
        );

        // Sort descending by date
        return userActionLogs
            .sort((a, b) => b.date.localeCompare(a.date))
            .map(log => {
                const workingDaysDiff = getWorkingDaysDifference(new Date(log.date), new Date());
                return {
                    ...log,
                    isLate: workingDaysDiff > 3
                };
            });
    }, [userId, attendanceLogs]);

    return { actionRequiredLogs, isAlertsLoading: false, refreshAlerts: () => {} };
};
