
import { useState, useCallback, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { AttendanceLog } from '../../types/attendance';
import { mapAttendanceLog } from './shared';

export interface AttendanceFilters {
    startDate?: string;
    endDate?: string;
    status?: string;
    workType?: string;
}

export const useAttendanceHistory = (userId: string) => {
    const [isHistoryLoading, setIsHistoryLoading] = useState(false);
    const abortControllerRef = useRef<AbortController | null>(null);

    const getAttendanceLogs = useCallback(async (page: number, pageSize: number, filters: AttendanceFilters) => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        setIsHistoryLoading(true);
        try {
            let query = supabase
                .from('attendance_logs')
                .select('*', { count: 'exact' })
                .eq('user_id', userId)
                .order('date', { ascending: false });

            if (filters.startDate) query = query.gte('date', filters.startDate);
            if (filters.endDate) query = query.lte('date', filters.endDate);
            if (filters.workType && filters.workType !== 'ALL') query = query.eq('work_type', filters.workType);
            
            const from = (page - 1) * pageSize;
            const to = from + pageSize - 1;
            query = query.range(from, to).abortSignal(abortControllerRef.current.signal);

            const { data, count, error } = await query;
            
            if (error) {
                if (error.code !== '20') throw error;
            }

            const mappedLogs: AttendanceLog[] = (data || []).map(mapAttendanceLog);
            return { data: mappedLogs, count: count || 0 };

        } catch (err: any) {
            if (err.name === 'AbortError') {
                 return { data: [], count: 0 };
            }
            console.error("Fetch logs failed", err);
            return { data: [], count: 0 };
        } finally {
            setIsHistoryLoading(false);
        }
    }, [userId]);

    return { getAttendanceLogs, isHistoryLoading };
};
