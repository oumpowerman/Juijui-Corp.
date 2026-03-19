
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { AttendanceLog, WorkLocation, AttendanceStats } from '../types/attendance';
import { useToast } from '../context/ToastContext';
import { format } from 'date-fns';
import startOfMonth from 'date-fns/startOfMonth';
import endOfMonth from 'date-fns/endOfMonth';
import { useGamification } from './useGamification';
import { calculateCheckOutStatus, checkIsLate, parseAttendanceMetadata } from '../lib/attendanceUtils';

import { useAttendanceStatus } from './attendance/useAttendanceStatus';
import { useAttendanceActions } from './attendance/useAttendanceActions';
import { useAttendanceStats } from './attendance/useAttendanceStats';
import { useAttendanceHistory, AttendanceFilters } from './attendance/useAttendanceHistory';
import { useAttendanceAlerts } from './attendance/useAttendanceAlerts';

export type { AttendanceFilters };

export const useAttendance = (userId: string) => {
    const { todayLog, outdatedLogs, isLoading: isStatusLoading, refresh: refreshStatus } = useAttendanceStatus(userId);
    const { checkIn, manualCheckIn, checkOut, isActionLoading } = useAttendanceActions(userId);
    const { stats, isStatsLoading, refreshStats } = useAttendanceStats(userId);
    const { getAttendanceLogs, isHistoryLoading } = useAttendanceHistory(userId);
    const { actionRequiredLog, isAlertsLoading, refreshAlerts } = useAttendanceAlerts(userId);

    const isLoading = isStatusLoading || isStatsLoading || isAlertsLoading;

    const refresh = () => {
        refreshStatus();
        refreshStats();
        refreshAlerts();
    };

    return {
        todayLog,
        outdatedLogs,
        actionRequiredLog,
        stats,
        isLoading,
        isActionLoading,
        isHistoryLoading,
        checkIn,
        manualCheckIn,
        checkOut: (location?: any, locationName?: string, reason?: string) => 
            todayLog ? checkOut(todayLog, location, locationName, reason) : Promise.resolve(false),
        getAttendanceLogs,
        refresh
    };
};
