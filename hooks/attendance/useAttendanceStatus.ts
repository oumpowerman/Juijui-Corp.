
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { AttendanceLog } from '../../types/attendance';
import { format } from 'date-fns';
import { mapAttendanceLog } from './shared';

export const useAttendanceStatus = (userId: string) => {
    const [todayLog, setTodayLog] = useState<AttendanceLog | null>(null);
    const [outdatedLogs, setOutdatedLogs] = useState<AttendanceLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const todayDateStr = format(new Date(), 'yyyy-MM-dd');

    const fetchStatus = useCallback(async () => {
        if (!userId) return;
        setIsLoading(true);
        try {
            // A. Get LATEST Active Session (Could be today or past)
            const { data: activeLogs } = await supabase
                .from('attendance_logs')
                .select('*')
                .eq('user_id', userId)
                .in('status', ['WORKING', 'PENDING_VERIFY'])
                .is('check_out_time', null)
                .order('date', { ascending: false });

            if (activeLogs && activeLogs.length > 0) {
                const mappedLogs = activeLogs.map(mapAttendanceLog);
                const todayActive = mappedLogs.find(l => l.date === todayDateStr);
                const pastActive = mappedLogs.filter(l => l.date !== todayDateStr);

                setTodayLog(todayActive || null);
                setOutdatedLogs(pastActive);

                if (!todayActive) {
                    const { data: todayRecord } = await supabase
                        .from('attendance_logs')
                        .select('*')
                        .eq('user_id', userId)
                        .eq('date', todayDateStr)
                        .maybeSingle();
                    setTodayLog(todayRecord ? mapAttendanceLog(todayRecord) : null);
                }
            } else {
                const { data: todayRecord } = await supabase
                    .from('attendance_logs')
                    .select('*')
                    .eq('user_id', userId)
                    .eq('date', todayDateStr)
                    .maybeSingle();
                setTodayLog(todayRecord ? mapAttendanceLog(todayRecord) : null);
                setOutdatedLogs([]);
            }
        } catch (err) {
            console.error("Error fetching attendance status:", err);
        } finally {
            setIsLoading(false);
        }
    }, [userId, todayDateStr]);

    useEffect(() => {
        fetchStatus();
        
        const channel = supabase.channel(`attendance-status-${userId}`)
            .on('postgres_changes', { 
                event: '*', 
                schema: 'public', 
                table: 'attendance_logs', 
                filter: `user_id=eq.${userId}` 
            }, () => {
                fetchStatus();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId, fetchStatus]);

    return { todayLog, outdatedLogs, isLoading, refresh: fetchStatus };
};
