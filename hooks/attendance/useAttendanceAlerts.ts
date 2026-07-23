
import { useState, useEffect, useCallback, useMemo } from 'react';
import { AttendanceLog, LeaveType } from '../../types/attendance';
import { mapAttendanceLog } from './shared';
import { useUserSession } from '../../context/UserSessionContext';
import { getWorkingDaysDifference } from '../../lib/attendanceUtils';
import { useMasterData } from '../useMasterData';
import { format, parseISO } from 'date-fns';
import th from 'date-fns/locale/th';

export type AlertIssueType = 'MISSING_CHECKIN' | 'MISSING_CHECKOUT' | 'MISSING_BOTH';

export interface ActionRequiredAlertItem extends AttendanceLog {
    isLate: boolean;
    issueType: AlertIssueType;
    requestType: LeaveType;
    title: string;
    message: string;
}

export const useAttendanceAlerts = (userId: string) => {
    const { attendanceLogs } = useUserSession();
    const { annualHolidays, calendarExceptions } = useMasterData();

    const actionRequiredLogs = useMemo<ActionRequiredAlertItem[]>(() => {
        if (!userId || !attendanceLogs) return [];

        // Filter logs for current user & ACTION_REQUIRED
        // Ignore logs where both checkInTime and checkOutTime exist (handled in StatusCard)
        const userActionLogs = attendanceLogs.filter(log => {
            if (log.userId !== userId || log.status !== 'ACTION_REQUIRED') return false;
            // If both checkIn and checkOut exist, it's not a missing time issue
            if (log.checkInTime && log.checkOutTime) return false;
            return true;
        });

        // Sort descending by date
        return userActionLogs
            .sort((a, b) => b.date.localeCompare(a.date))
            .map(log => {
                const workingDaysDiff = getWorkingDaysDifference(new Date(log.date), new Date(), annualHolidays, calendarExceptions);
                const isLate = workingDaysDiff > 3;

                let issueType: AlertIssueType = 'MISSING_CHECKOUT';
                let requestType: LeaveType = 'FORGOT_CHECKOUT';
                let title = isLate ? 'ลืมลงเวลาเลิกงาน (เกินกำหนด)' : 'ลืมลงเวลาเลิกงาน';

                let formattedDate = log.date;
                try {
                    formattedDate = format(parseISO(log.date), 'dd MMM yyyy', { locale: th });
                } catch {
                    formattedDate = log.date;
                }

                let message = `คุณลืมลงเวลาออกของวันที่ ${formattedDate}`;

                if (!log.checkInTime && log.checkOutTime) {
                    issueType = 'MISSING_CHECKIN';
                    requestType = 'FORGOT_CHECKIN';
                    title = isLate ? 'ลืมลงเวลาเข้างาน (เกินกำหนด)' : 'ลืมลงเวลาเข้างาน';
                    message = `คุณลืมลงเวลาเข้าของวันที่ ${formattedDate}`;
                } else if (!log.checkInTime && !log.checkOutTime) {
                    issueType = 'MISSING_BOTH';
                    requestType = 'FORGOT_BOTH';
                    title = isLate ? 'ลืมลงเวลาเข้าและออกงาน (เกินกำหนด)' : 'ลืมลงเวลาเข้าและออกงาน';
                    message = `คุณลืมลงเวลาเข้าและออกงานของวันที่ ${formattedDate}`;
                }

                return {
                    ...log,
                    isLate,
                    issueType,
                    requestType,
                    title,
                    message
                };
            });
    }, [userId, attendanceLogs, annualHolidays, calendarExceptions]);

    return { actionRequiredLogs, isAlertsLoading: false, refreshAlerts: () => {} };
};

