
import { useState, useEffect, useCallback, useMemo } from 'react';
import { AttendanceStats } from '../../types/attendance';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { checkIsLate, getAttendanceSummary } from '../../lib/attendanceUtils';
import { useMasterData } from '../useMasterData';
import { useUserSession } from '../../context/UserSessionContext';

export const useAttendanceStats = (userId: string) => {
    const { masterOptions } = useMasterData();
    const { attendanceLogs } = useUserSession();
    const todayDateStr = format(new Date(), 'yyyy-MM-dd');

    const stats = useMemo(() => {
        if (!userId || !attendanceLogs) return {
            totalDays: 0,
            lateDays: 0,
            onTimeDays: 0,
            absentDays: 0,
            totalHours: 0,
            currentStreak: 0,
            monthlyLogs: []
        };

        const targetDate = new Date();
        const start = format(startOfMonth(targetDate), 'yyyy-MM-dd');
        const end = format(endOfMonth(targetDate), 'yyyy-MM-dd');

        // Filter logs for the current user
        const userLogs = attendanceLogs.filter(log => log.userId === userId);

        // Filter for current month
        const monthlyData = userLogs.filter(log => log.date >= start && log.date <= end);

        // Fetch Config
        const configData = masterOptions.filter(o => o.type === 'WORK_CONFIG');
        const startTimeStr = configData?.find(c => c.key === 'START_TIME')?.label || '10:00';
        const buffer = parseInt(configData?.find(c => c.key === 'LATE_BUFFER')?.label || '0');

        let lateCount = 0;
        let onTimeCount = 0;
        let totalHours = 0;

        monthlyData.forEach(log => {
            const summary = getAttendanceSummary(
                log.checkInTime,
                log.checkOutTime,
                { startTime: startTimeStr, buffer, minHours: 9 }
            );

            if (summary.isLate) {
                lateCount++;
            } else if (log.checkInTime) {
                onTimeCount++;
            }
            totalHours += summary.workHours;
        });

        // Calculate Streak
        // Sort user logs descending by date
        const streakLogs = [...userLogs].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 20);

        let currentStreak = 0;
        if (streakLogs.length > 0) {
            let skipToday = false;
            const todayRecord = streakLogs.find(l => l.date === todayDateStr);
            
            if (todayRecord) {
                const summary = getAttendanceSummary(
                    todayRecord.checkInTime,
                    todayRecord.checkOutTime,
                    { startTime: startTimeStr, buffer, minHours: 9 }
                );

                if (todayRecord.status === 'LATE' || summary.isLate) {
                    currentStreak = 0;
                    skipToday = true;
                } else if (todayRecord.checkInTime) {
                    currentStreak = 1;
                    skipToday = true;
                }
            }

            if (currentStreak !== 0 || !todayRecord) {
                for (const log of streakLogs) {
                    if (skipToday && log.date === todayDateStr) continue;
                    if (log.status === 'LEAVE') continue;
                    if (log.status === 'ABSENT' || log.status === 'LATE') break;
                    
                    const summary = getAttendanceSummary(
                        log.checkInTime,
                        log.checkOutTime,
                        { startTime: startTimeStr, buffer, minHours: 9 }
                    );

                    if (summary.isLate) break;
                    if (log.checkInTime) {
                        currentStreak++;
                    } else {
                        break;
                    }
                }
            }
        }

        return {
            totalDays: monthlyData.length,
            lateDays: lateCount,
            onTimeDays: onTimeCount,
            absentDays: 0, 
            totalHours: Math.round(totalHours),
            currentStreak,
            monthlyLogs: monthlyData
        };
    }, [userId, attendanceLogs, masterOptions, todayDateStr]);

    return { stats, isStatsLoading: false, refreshStats: () => {} };
};
