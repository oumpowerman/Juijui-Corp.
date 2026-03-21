
import { useState, useEffect, useCallback, useMemo } from 'react';
import { AttendanceLog } from '../../types/attendance';
import { mapAttendanceLog } from './shared';
import { useUserSession } from '../../context/UserSessionContext';

export const useAttendanceAlerts = (userId: string) => {
    const { attendanceLogs } = useUserSession();

    const actionRequiredLog = useMemo(() => {
        if (!userId || !attendanceLogs) return null;

        // Filter logs for the current user and status
        const userActionLogs = attendanceLogs.filter(log => 
            log.userId === userId && log.status === 'ACTION_REQUIRED'
        );

        // Sort descending by date and get the first one
        if (userActionLogs.length > 0) {
            return userActionLogs.sort((a, b) => b.date.localeCompare(a.date))[0];
        }

        return null;
    }, [userId, attendanceLogs]);

    return { actionRequiredLog, isAlertsLoading: false, refreshAlerts: () => {} };
};
