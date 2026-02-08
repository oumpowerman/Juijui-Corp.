
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { AttendanceLog, WorkLocation, AttendanceStats } from '../types/attendance';
import { useToast } from '../context/ToastContext';
import { format } from 'date-fns';
import startOfMonth from 'date-fns/startOfMonth';
import endOfMonth from 'date-fns/endOfMonth';
import { useGamification } from './useGamification';
import { calculateCheckOutStatus, checkIsLate, parseAttendanceMetadata } from '../lib/attendanceUtils';

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
    
    // Connect to Game Engine
    const { processAction } = useGamification();
    
    // Refs for AbortController to cancel stale requests
    const abortControllerRef = useRef<AbortController | null>(null);

    const todayDateStr = format(new Date(), 'yyyy-MM-dd');

    // Helper to map DB response to AttendanceLog type
    const mapAttendanceLog = (data: any): AttendanceLog => {
        // Fallback for legacy data: try to parse from note if columns are empty
        const meta = parseAttendanceMetadata(data.note);
        
        return {
            id: data.id,
            userId: data.user_id,
            date: data.date,
            checkInTime: data.check_in_time ? new Date(data.check_in_time) : null,
            checkOutTime: data.check_out_time ? new Date(data.check_out_time) : null,
            workType: data.work_type,
            status: data.status,
            note: data.note,
            // Prioritize new columns, fallback to parsed note for legacy compatibility
            locationLat: data.location_lat ?? meta.location?.lat,
            locationLng: data.location_lng ?? meta.location?.lng,
            locationName: data.location_name ?? meta.locationName,
            checkOutLat: data.check_out_lat,
            checkOutLng: data.check_out_lng,
            checkOutLocationName: data.check_out_location_name
        };
    };

    // 1. Fetch Today's Status (Modified to find LATEST ACTIVE status)
    const fetchTodayStatus = useCallback(async () => {
        try {
            const { data: workingLog } = await supabase
                .from('attendance_logs')
                .select('*')
                .eq('user_id', userId)
                .eq('status', 'WORKING')
                .order('date', { ascending: false }) // Get latest
                .limit(1)
                .maybeSingle();

            if (workingLog) {
                setTodayLog(mapAttendanceLog(workingLog));
            } else {
                // If no active working session, check if we have a record for TODAY
                const { data: todayRecord } = await supabase
                    .from('attendance_logs')
                    .select('*')
                    .eq('user_id', userId)
                    .eq('date', todayDateStr)
                    .maybeSingle(); 

                if (todayRecord) {
                    setTodayLog(mapAttendanceLog(todayRecord));
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

            // Fetch Config
            const { data: configData } = await supabase.from('master_options').select('key, label').eq('type', 'WORK_CONFIG');
            const startTimeStr = configData?.find(c => c.key === 'START_TIME')?.label || '10:00';
            const buffer = parseInt(configData?.find(c => c.key === 'LATE_BUFFER')?.label || '0');

            if (error) throw error;

            if (data) {
                let lateCount = 0;
                let onTimeCount = 0;
                let totalHours = 0;

                data.forEach((log: any) => {
                    if (log.check_in_time) {
                        const checkIn = new Date(log.check_in_time);
                        // Dynamic Check
                        if (checkIsLate(checkIn, startTimeStr, buffer)) {
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

            const mappedLogs: AttendanceLog[] = (data || []).map(mapAttendanceLog);

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

    // 4. Check In Action (Updated for Structured Data)
    const checkIn = async (
        workType: WorkLocation, 
        file?: File, 
        location?: { lat: number, lng: number },
        locationName?: string, // Added explicitly
        note?: string, // Additional note
        externalUploadFn?: (file: File) => Promise<string | null>
    ) => {
        setIsLoading(true);
        try {
            const now = new Date();
            
            // Fetch Config
            const { data: configData } = await supabase.from('master_options').select('key, label').eq('type', 'WORK_CONFIG');
            const startTimeStr = configData?.find(c => c.key === 'START_TIME')?.label || '10:00';
            const buffer = parseInt(configData?.find(c => c.key === 'LATE_BUFFER')?.label || '15');
            
            const isLate = checkIsLate(now, startTimeStr, buffer);

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

            // Note Construction (Only specific tags + user note)
            let finalNote = note || '';
            const meta = [];
            if (proofUrl) meta.push(`[PROOF:${proofUrl}]`);
            // LOC is now in its own column, so we remove [LOC:...] from note to keep it clean
            // if (location) meta.push(`[LOC:${location.lat.toFixed(6)},${location.lng.toFixed(6)}]`); 
            if (meta.length > 0) finalNote = `${finalNote} ${meta.join(' ')}`.trim();

            const payload: any = {
                user_id: userId,
                date: todayDateStr,
                check_in_time: now.toISOString(),
                work_type: workType,
                status: 'WORKING',
                note: finalNote,
                // New Structured Columns
                location_lat: location?.lat,
                location_lng: location?.lng,
                location_name: locationName || 'Unknown Location'
            };

            const { error } = await supabase.from('attendance_logs').insert(payload);
            if (error) throw error;

            showToast(isLate ? 'เข้างานสายนะวันนี้! 🐢' : 'สวัสดีตอนเช้าครับ! ☀️', isLate ? 'warning' : 'success');
            await supabase.from('profiles').update({ work_status: 'ONLINE' }).eq('id', userId);
            
            // --- TRIGGER GAME EVENT ---
            await processAction(userId, 'ATTENDANCE_CHECK_IN', {
                status: isLate ? 'LATE' : 'ON_TIME',
                time: format(now, 'HH:mm')
            });

            fetchTodayStatus();
            fetchStats();

        } catch (err: any) {
            console.error(err);
            showToast('Check-in ไม่สำเร็จ: ' + err.message, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    // 5. Check Out Action (Updated for Structured Data)
    const checkOut = async (
        location?: { lat: number, lng: number },
        locationName?: string,
        reason?: string
    ) => {
        if (!todayLog || !todayLog.checkInTime) return;
        setIsLoading(true);
        try {
            const now = new Date();
            
            // --- FETCH LATEST CONFIG ---
            const { data: configData } = await supabase
                .from('master_options')
                .select('key, label')
                .eq('type', 'WORK_CONFIG');
                
            const minHoursStr = configData?.find(c => c.key === 'MIN_HOURS')?.label || '9';
            const minHours = parseFloat(minHoursStr) || 9;

            // --- CALCULATE STATUS ---
            const calcResult = calculateCheckOutStatus(
                todayLog.checkInTime,
                now,
                minHours
            );

            // Audit Note
            let noteAppend = '';
            // We store OUT_LOC in dedicated columns now, so removed from note
            if (calcResult.status === 'EARLY_LEAVE') {
                 noteAppend += ` [EARLY: Missing ${calcResult.missingMinutes.toFixed(0)}m]`;
                 if (reason) noteAppend += ` [REASON: ${reason}]`;
            } else {
                 noteAppend += ` [OK: ${calcResult.hoursWorked.toFixed(1)} hrs]`;
            }

            const updatePayload: any = {
                check_out_time: now.toISOString(),
                status: 'COMPLETED',
                note: (todayLog.note || '') + noteAppend,
                // New Structured Columns
                check_out_lat: location?.lat,
                check_out_lng: location?.lng,
                check_out_location_name: locationName
            };

            const { error } = await supabase
                .from('attendance_logs')
                .update(updatePayload)
                .eq('id', todayLog.id);

            if (error) throw error;
            
            await supabase.from('profiles').update({ work_status: 'BUSY' }).eq('id', userId);

            // --- TRIGGER GAME EVENT (Conditional) ---
            if (calcResult.status === 'COMPLETED') {
                showToast('เลิกงานแล้ว พักผ่อนเยอะๆ นะครับ 💤', 'success');
                await processAction(userId, 'DUTY_COMPLETE', {
                    reason: `Work day completed (${calcResult.hoursWorked.toFixed(1)} hrs)`
                });
            } else {
                showToast(`กลับก่อนเวลา! (ขาด ${calcResult.missingMinutes.toFixed(0)} นาที)`, 'warning');
                await processAction(userId, 'ATTENDANCE_EARLY_LEAVE', {
                    missingMinutes: Math.round(calcResult.missingMinutes)
                });
            }

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
