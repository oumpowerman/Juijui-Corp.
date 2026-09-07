import { useState, useEffect } from 'react';
import { supabase } from '../../../../lib/supabase';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { AttendanceLog } from '../../../../types/attendance';

interface UseAttendanceDashboardDataParams {
    currentMonth: Date;
    dateFilterMode: 'MONTH' | 'CUSTOM';
    customStartDate: Date;
    customEndDate: Date;
}

export const useAttendanceDashboardData = ({
    currentMonth,
    dateFilterMode,
    customStartDate,
    customEndDate
}: UseAttendanceDashboardDataParams) => {
    const [logs, setLogs] = useState<AttendanceLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [snapshots, setSnapshots] = useState<any[]>([]);

    // Fetch HP Snapshots & Realtime Subscription
    useEffect(() => {
        const fetchSnapshots = async () => {
            try {
                const { data, error } = await supabase
                    .from('hp_snapshots')
                    .select('*');
                if (error) {
                    console.warn("hp_snapshots might not exist yet:", error);
                } else if (data) {
                    setSnapshots(data);
                }
            } catch (e) {
                console.warn("Error loading hp_snapshots:", e);
            }
        };
        fetchSnapshots();

        const hpChannel = supabase.channel('hp-snapshots-dashboard')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'hp_snapshots'
            }, () => {
                fetchSnapshots();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(hpChannel);
        };
    }, []);

    // Fetch Attendance Logs for the selected month or range & Realtime Subscription
    useEffect(() => {
        const start = format(dateFilterMode === 'MONTH' ? startOfMonth(currentMonth) : customStartDate, 'yyyy-MM-dd');
        const end = format(dateFilterMode === 'MONTH' ? endOfMonth(currentMonth) : customEndDate, 'yyyy-MM-dd');

        const fetchMonthLogs = async () => {
            setIsLoading(true);
            try {
                const { data, error } = await supabase
                    .from('attendance_logs')
                    .select('*')
                    .gte('date', start)
                    .lte('date', end);

                if (error) throw error;
                
                if (data) {
                    setLogs(data.map((l: any) => ({
                        id: l.id,
                        userId: l.user_id,
                        date: l.date,
                        checkInTime: l.check_in_time ? new Date(l.check_in_time) : null,
                        checkOutTime: l.check_out_time ? new Date(l.check_out_time) : null,
                        workType: l.work_type,
                        status: l.status,
                        note: l.note,
                        locationName: l.location_name,
                        checkOutLocationName: l.check_out_location_name,
                        latitude: l.location_lat,
                        longitude: l.location_lng,
                        checkOutLat: l.check_out_lat,
                        checkOutLng: l.check_out_lng,
                        photoUrl: l.photo_url,
                        checkOutPhotoUrl: l.check_out_photo_url
                    })));
                }
            } catch (err) {
                console.error("Fetch admin logs error", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchMonthLogs();

        const logsChannel = supabase.channel('admin-dashboard-logs')
            .on('postgres_changes', { 
                event: '*', 
                schema: 'public', 
                table: 'attendance_logs',
                filter: `date=gte.${start}&date=lte.${end}`
            }, () => fetchMonthLogs())
            .subscribe();

        return () => {
            supabase.removeChannel(logsChannel);
        };
    }, [currentMonth, dateFilterMode, customStartDate, customEndDate]);

    return {
        logs,
        isLoading,
        snapshots
    };
};