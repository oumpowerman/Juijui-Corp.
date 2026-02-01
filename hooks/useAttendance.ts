
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { AttendanceLog, WorkLocation, AttendanceStats } from '../types/attendance';
import { useToast } from '../context/ToastContext';
import { format, startOfMonth, endOfMonth } from 'date-fns';

export interface AttendanceFilters {
    startDate?: string;
    endDate?: string;
    status?: string;
    workType?: string;
}

export const useAttendance = (userId: string) => {
    const [todayLog, setTodayLog] = useState<AttendanceLog | null>(null);
    const [stats, setStats] = useState<AttendanceStats>({
        totalDays: 0,
        lateDays: 0,
        onTimeDays: 0,
        absentDays: 0,
        totalHours: 0
    });
    const [isLoading, setIsLoading] = useState(true);
    const { showToast } = useToast();
    
    // Refs for AbortController to cancel stale requests
    const abortControllerRef = useRef<AbortController | null>(null);

    const todayDateStr = format(new Date(), 'yyyy-MM-dd');

    // 1. Fetch Today's Status (Modified to find LATEST ACTIVE status)
    const fetchTodayStatus = useCallback(async () => {
        try {
            // Priority 1: Check if there is ANY 'WORKING' status (could be yesterday)
            // Priority 2: If no working status, get today's log (even if completed)
            
            const { data: workingLog } = await supabase
                .from('attendance_logs')
                .select('*')
                .eq('user_id', userId)
                .eq('status', 'WORKING')
                .order('date', { ascending: false }) // Get latest
                .limit(1)
                .maybeSingle();

            if (workingLog) {
                setTodayLog({
                    id: workingLog.id,
                    userId: workingLog.user_id,
                    date: workingLog.date,
                    checkInTime: workingLog.check_in_time ? new Date(workingLog.check_in_time) : null,
                    checkOutTime: workingLog.check_out_time ? new Date(workingLog.check_out_time) : null,
                    workType: workingLog.work_type,
                    status: workingLog.status,
                    note: workingLog.note
                });
            } else {
                // If no active working session, check if we have a record for TODAY
                const { data: todayRecord } = await supabase
                    .from('attendance_logs')
                    .select('*')
                    .eq('user_id', userId)
                    .eq('date', todayDateStr)
                    .maybeSingle(); 

                if (todayRecord) {
                    setTodayLog({
                        id: todayRecord.id,
                        userId: todayRecord.user_id,
                        date: todayRecord.date,
                        checkInTime: todayRecord.check_in_time ? new Date(todayRecord.check_in_time) : null,
                        checkOutTime: todayRecord.check_out_time ? new Date(todayRecord.check_out_time) : null,
                        workType: todayRecord.work_type,
                        status: todayRecord.status,
                        note: todayRecord.note
                    });
                } else {
                    setTodayLog(null); // Not checked in yet
                }
            }
        } catch (err) {
            console.error("Error fetching attendance:", err);
        } finally {
            setIsLoading(false);
        }
    }, [userId, todayDateStr]);

    // 2. Fetch Stats (Overview for Dashboard) - Scoped to Month
    const fetchStats = useCallback(async (targetDate: Date = new Date()) => {
        try {
            const start = format(startOfMonth(targetDate), 'yyyy-MM-dd');
            const end = format(endOfMonth(targetDate), 'yyyy-MM-dd');

            // Select minimal fields for performance
            const { data, error } = await supabase
                .from('attendance_logs')
                .select('check_in_time, check_out_time') 
                .eq('user_id', userId)
                .gte('date', start)
                .lte('date', end);

            if (error) throw error;

            if (data) {
                let lateCount = 0;
                let onTimeCount = 0;
                let totalHours = 0;

                data.forEach((log: any) => {
                    if (log.check_in_time) {
                        const checkIn = new Date(log.check_in_time);
                        const hour = checkIn.getHours();
                        const minute = checkIn.getMinutes();
                        // Late rule: After 10:00 AM
                        if (hour > 10 || (hour === 10 && minute > 0)) {
                            lateCount++;
                        } else {
                            onTimeCount++;
                        }

                        // Hours Calc
                        if (log.check_out_time) {
                            const checkOut = new Date(log.check_out_time);
                            const diffMs = checkOut.getTime() - checkIn.getTime();
                            const hours = diffMs / (1000 * 60 * 60);
                            totalHours += hours;
                        }
                    }
                });

                setStats({
                    totalDays: data.length,
                    lateDays: lateCount,
                    onTimeDays: onTimeCount,
                    absentDays: 0, 
                    totalHours: Math.round(totalHours)
                });
            }
        } catch (err) {
            console.error("Fetch stats failed", err);
        }
    }, [userId]);

    // 3. NEW: Fetch Paginated Logs with Filters & Abort Signal
    const getAttendanceLogs = useCallback(async (page: number, pageSize: number, filters: AttendanceFilters) => {
        // Cancel previous request if any
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        setIsLoading(true);
        try {
            let query = supabase
                .from('attendance_logs')
                .select('*', { count: 'exact' })
                .eq('user_id', userId)
                .order('date', { ascending: false });

            // Apply Filters
            if (filters.startDate) query = query.gte('date', filters.startDate);
            if (filters.endDate) query = query.lte('date', filters.endDate);
            if (filters.workType && filters.workType !== 'ALL') query = query.eq('work_type', filters.workType);
            
            // Pagination
            const from = (page - 1) * pageSize;
            const to = from + pageSize - 1;
            query = query.range(from, to).abortSignal(abortControllerRef.current.signal);

            const { data, count, error } = await query;
            
            if (error) {
                if (error.code !== '20') throw error; // Ignore abort error
            }

            const mappedLogs: AttendanceLog[] = (data || []).map((d: any) => ({
                id: d.id,
                userId: d.user_id,
                date: d.date,
                checkInTime: d.check_in_time ? new Date(d.check_in_time) : null,
                checkOutTime: d.check_out_time ? new Date(d.check_out_time) : null,
                workType: d.work_type,
                status: d.status,
                note: d.note
            }));

            return { data: mappedLogs, count: count || 0 };

        } catch (err: any) {
            if (err.name === 'AbortError') {
                 console.log('Fetch aborted');
                 return { data: [], count: 0 };
            }
            console.error("Fetch logs failed", err);
            return { data: [], count: 0 };
        } finally {
            setIsLoading(false);
        }
    }, [userId]);

    // 4. Check In Action
    const checkIn = async (
        workType: WorkLocation, 
        file?: File, 
        location?: { lat: number, lng: number },
        note?: string,
        externalUploadFn?: (file: File) => Promise<string | null>
    ) => {
        setIsLoading(true);
        try {
            const now = new Date();
            const isLate = now.getHours() >= 10; 

            // Upload Logic
            let proofUrl = null;
            if (file) {
                if (externalUploadFn) {
                    try {
                        proofUrl = await externalUploadFn(file);
                    } catch (extErr) {
                        console.warn("External upload failed", extErr);
                    }
                }
                if (!proofUrl) {
                    const fileExt = file.name.split('.').pop();
                    const fileName = `attendance-${userId}-${Date.now()}.${fileExt}`;
                    const { error: uploadError } = await supabase.storage.from('chat-files').upload(`proofs/${fileName}`, file);
                    if (!uploadError) {
                        const { data: urlData } = supabase.storage.from('chat-files').getPublicUrl(`proofs/${fileName}`);
                        proofUrl = urlData.publicUrl;
                    }
                }
            }

            // Note Construction
            let finalNote = note || '';
            const meta = [];
            if (proofUrl) meta.push(`[PROOF:${proofUrl}]`);
            if (location) meta.push(`[LOC:${location.lat.toFixed(6)},${location.lng.toFixed(6)}]`);
            if (meta.length > 0) finalNote = `${finalNote} ${meta.join(' ')}`.trim();

            const payload = {
                user_id: userId,
                date: todayDateStr,
                check_in_time: now.toISOString(),
                work_type: workType,
                status: 'WORKING',
                note: finalNote
            };

            const { error } = await supabase.from('attendance_logs').insert(payload);
            if (error) throw error;

            showToast(isLate ? 'เข้างานสายนะวันนี้! 🐢' : 'สวัสดีตอนเช้าครับ! ☀️', isLate ? 'warning' : 'success');
            await supabase.from('profiles').update({ work_status: 'ONLINE' }).eq('id', userId);
            
            fetchTodayStatus();
            fetchStats();

        } catch (err: any) {
            console.error(err);
            showToast('Check-in ไม่สำเร็จ: ' + err.message, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    // 5. Check Out Action
    const checkOut = async () => {
        if (!todayLog) return;
        setIsLoading(true);
        try {
            const now = new Date();
            const { error } = await supabase
                .from('attendance_logs')
                .update({
                    check_out_time: now.toISOString(),
                    status: 'COMPLETED'
                })
                .eq('id', todayLog.id);

            if (error) throw error;
            showToast('เลิกงานแล้ว พักผ่อนเยอะๆ นะครับ 💤', 'success');
            await supabase.from('profiles').update({ work_status: 'BUSY' }).eq('id', userId);

            fetchTodayStatus();
            fetchStats();

        } catch (err: any) {
            showToast('Check-out ไม่สำเร็จ: ' + err.message, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (userId) {
            fetchTodayStatus();
            fetchStats();
        }
    }, [userId, fetchTodayStatus, fetchStats]);

    return {
        todayLog,
        stats,
        isLoading,
        checkIn,
        checkOut,
        getAttendanceLogs, 
        refresh: fetchTodayStatus
    };
};
