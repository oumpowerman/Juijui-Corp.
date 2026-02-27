
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { AttendanceLog } from '../../types/attendance';
import { mapAttendanceLog } from './shared';

export const useAttendanceAlerts = (userId: string) => {
    const [actionRequiredLog, setActionRequiredLog] = useState<AttendanceLog | null>(null);
    const [isAlertsLoading, setIsAlertsLoading] = useState(true);

    const fetchAlerts = useCallback(async () => {
        if (!userId) return;
        setIsAlertsLoading(true);
        try {
            const { data: actionLog } = await supabase
                .from('attendance_logs')
                .select('*')
                .eq('user_id', userId)
                .eq('status', 'ACTION_REQUIRED')
                .order('date', { ascending: false })
                .limit(1)
                .maybeSingle();
            
            setActionRequiredLog(actionLog ? mapAttendanceLog(actionLog) : null);
        } catch (err) {
            console.error("Error fetching attendance alerts:", err);
        } finally {
            setIsAlertsLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        fetchAlerts();
        const channel = supabase.channel(`attendance-alerts-${userId}`)
            .on('postgres_changes', { 
                event: '*', 
                schema: 'public', 
                table: 'attendance_logs', 
                filter: `user_id=eq.${userId}` 
            }, () => {
                fetchAlerts();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId, fetchAlerts]);

    return { actionRequiredLog, isAlertsLoading, refreshAlerts: fetchAlerts };
};
