
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { AttendanceStats } from '../../types/attendance';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { checkIsLate } from '../../lib/attendanceUtils';

export const useAttendanceStats = (userId: string) => {
    const [stats, setStats] = useState<AttendanceStats>({
        totalDays: 0,
        lateDays: 0,
        onTimeDays: 0,
        absentDays: 0,
        totalHours: 0,
        currentStreak: 0 
    });
    const [isStatsLoading, setIsStatsLoading] = useState(true);
    const todayDateStr = format(new Date(), 'yyyy-MM-dd');

    const fetchStats = useCallback(async (targetDate: Date = new Date()) => {
        if (!userId) return;
        setIsStatsLoading(true);
        try {
            const start = format(startOfMonth(targetDate), 'yyyy-MM-dd');
            const end = format(endOfMonth(targetDate), 'yyyy-MM-dd');

            const { data, error } = await supabase
                .from('attendance_logs')
                .select('date, check_in_time, check_out_time, status') 
                .eq('user_id', userId)
                .gte('date', start)
                .lte('date', end);

            const { data: configData } = await supabase.from('master_options').select('key, label').eq('type', 'WORK_CONFIG');
            const startTimeStr = configData?.find(c => c.key === 'START_TIME')?.label || '10:00';
            const buffer = parseInt(configData?.find(c => c.key === 'LATE_BUFFER')?.label || '0');

            if (error) throw error;

            let lateCount = 0;
            let onTimeCount = 0;
            let totalHours = 0;

            if (data) {
                data.forEach((log: any) => {
                    if (log.check_in_time) {
                        const checkIn = new Date(log.check_in_time);
                        if (checkIsLate(checkIn, startTimeStr, buffer)) {
                            lateCount++;
                        } else {
                            onTimeCount++;
                        }

                        if (log.check_out_time) {
                            const checkOut = new Date(log.check_out_time);
                            const diffMs = checkOut.getTime() - checkIn.getTime();
                            const hours = diffMs / (1000 * 60 * 60);
                            totalHours += hours;
                        }
                    }
                });
            }

            const { data: streakLogs } = await supabase
                .from('attendance_logs')
                .select('date, check_in_time, status')
                .eq('user_id', userId)
                .order('date', { ascending: false })
                .limit(20);

            let currentStreak = 0;
            if (streakLogs) {
                let skipToday = false;
                const todayRecord = streakLogs.find((l:any) => l.date === todayDateStr);
                
                if (todayRecord) {
                    if (todayRecord.status === 'LATE') {
                        currentStreak = 0;
                        skipToday = true;
                    } else if (todayRecord.check_in_time) {
                        const checkIn = new Date(todayRecord.check_in_time);
                        if (checkIsLate(checkIn, startTimeStr, buffer)) {
                             currentStreak = 0;
                             skipToday = true;
                        } else {
                             currentStreak = 1;
                             skipToday = true;
                        }
                    }
                }

                if (currentStreak !== 0 || !todayRecord) {
                    for (const log of streakLogs) {
                        if (skipToday && log.date === todayDateStr) continue;
                        if (log.status === 'LEAVE') continue;
                        if (log.status === 'ABSENT' || log.status === 'LATE') break;
                        if (log.check_in_time) {
                            const checkIn = new Date(log.check_in_time);
                            if (checkIsLate(checkIn, startTimeStr, buffer)) break;
                            currentStreak++;
                        } else {
                             break;
                        }
                    }
                }
            }

            setStats({
                totalDays: data?.length || 0,
                lateDays: lateCount,
                onTimeDays: onTimeCount,
                absentDays: 0, 
                totalHours: Math.round(totalHours),
                currentStreak
            });
        } catch (err) {
            console.error("Fetch stats failed", err);
        } finally {
            setIsStatsLoading(false);
        }
    }, [userId, todayDateStr]);

    useEffect(() => {
        fetchStats();
        const channel = supabase.channel(`attendance-stats-${userId}`)
            .on('postgres_changes', { 
                event: '*', 
                schema: 'public', 
                table: 'attendance_logs', 
                filter: `user_id=eq.${userId}` 
            }, () => {
                fetchStats();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId, fetchStats]);

    return { stats, isStatsLoading, refreshStats: fetchStats };
};
