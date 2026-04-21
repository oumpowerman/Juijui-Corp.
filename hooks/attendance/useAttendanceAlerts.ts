
import { useState, useEffect, useCallback, useMemo } from 'react';
import { AttendanceLog } from '../../types/attendance';
import { mapAttendanceLog } from './shared';
import { useUserSession } from '../../context/UserSessionContext';
import { getWorkingDaysDifference } from '../../lib/attendanceUtils';
import { useMasterData } from '../useMasterData';

export const useAttendanceAlerts = (userId: string) => {
    const { attendanceLogs } = useUserSession();
    const { annualHolidays, calendarExceptions } = useMasterData();

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
                const workingDaysDiff = getWorkingDaysDifference(new Date(log.date), new Date(), annualHolidays, calendarExceptions);
                return {
                    ...log,
                    isLate: workingDaysDiff > 3
                };
            });
    }, [userId, attendanceLogs, annualHolidays, calendarExceptions]);

    return { actionRequiredLogs, isAlertsLoading: false, refreshAlerts: () => {} };
};
