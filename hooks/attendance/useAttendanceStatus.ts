
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { AttendanceLog } from '../../types/attendance';
import { format } from 'date-fns';
import { mapAttendanceLog } from './shared';

export const useAttendanceStatus = (userId: string) => {
    const [todayLog, setTodayLog] = useState<AttendanceLog | null>(null);
    const [outdatedLog, setOutdatedLog] = useState<AttendanceLog | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const todayDateStr = format(new Date(), 'yyyy-MM-dd');

    const fetchStatus = useCallback(async () => {
        if (!userId) return;
        setIsLoading(true);
        try {
            // A. Get LATEST Active Session (Could be today or past)
            const { data: activeLog } = await supabase
                .from('attendance_logs')
                .select('*')
                .eq('user_id', userId)
                .in('status', ['WORKING', 'PENDING_VERIFY'])
                .is('check_out_time', null)
                .order('date', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (activeLog) {
                const mapped = mapAttendanceLog(activeLog);
                if (mapped.date === todayDateStr) {
                    setTodayLog(mapped);
                    setOutdatedLog(null);
                } else {
                    setOutdatedLog(mapped);
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
                setOutdatedLog(null);
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

    return { todayLog, outdatedLog, isLoading, refresh: fetchStatus };
};
