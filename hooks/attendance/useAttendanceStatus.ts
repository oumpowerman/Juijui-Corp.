
import { useState, useEffect, useCallback, useMemo } from 'react';
import { AttendanceLog } from '../../types/attendance';
import { format } from 'date-fns';
import { mapAttendanceLog } from './shared';
import { useUserSession } from '../../context/UserSessionContext';

export const useAttendanceStatus = (userId: string) => {
    const { attendanceLogs, refreshAttendance } = useUserSession();
    const todayDateStr = format(new Date(), 'yyyy-MM-dd');
    const [isRefreshing, setIsRefreshing] = useState(false);

    const { todayLog, outdatedLogs } = useMemo(() => {
        if (!userId || !attendanceLogs) return { todayLog: null, outdatedLogs: [] };

        // We only care about logs for the specific user (though context should only have current user's logs)
        const userLogs = attendanceLogs.filter(log => log.userId === userId);

        const activeLogs = userLogs.filter(log => 
            ['WORKING', 'PENDING_VERIFY'].includes(log.status) && !log.checkOutTime
        );

        let currentTodayLog = null;

        if (activeLogs.length > 0) {
            currentTodayLog = activeLogs.find(l => l.date === todayDateStr) || null;

            if (!currentTodayLog) {
                currentTodayLog = userLogs.find(l => l.date === todayDateStr) || null;
            }
        } else {
            currentTodayLog = userLogs.find(l => l.date === todayDateStr) || null;
        }

        const currentOutdatedLogs = userLogs.filter(log => {
            if (log.date === todayDateStr) return false;
            if (log.checkOutTime) return false;

            const isNormalOutdated = ['WORKING', 'PENDING_VERIFY'].includes(log.status);
            const isRejectedForgotCheckout = log.status === 'ACTION_REQUIRED' && !!log.checkInTime;

            return isNormalOutdated || isRejectedForgotCheckout;
        });

        return { todayLog: currentTodayLog, outdatedLogs: currentOutdatedLogs };
    }, [userId, attendanceLogs, todayDateStr]);

    const refresh = useCallback(async () => {
        setIsRefreshing(true);
        await refreshAttendance();
        setIsRefreshing(false);
    }, [refreshAttendance]);

    return { todayLog, outdatedLogs, isLoading: isRefreshing, refresh };
};
