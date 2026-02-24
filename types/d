
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
    const [outdatedLog, setOutdatedLog] = useState<AttendanceLog | null>(null); // NEW: Track forgotten check-outs
    const [actionRequiredLog, setActionRequiredLog] = useState<AttendanceLog | null>(null);
    const [stats, setStats] = useState<AttendanceStats>({
        totalDays: 0,
        lateDays: 0,
        onTimeDays: 0,
        absentDays: 0,
        totalHours: 0,
        currentStreak: 0 
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
            locationName: data.location_name ?? meta.locationName,
            locationLng: data.location_lng ?? meta.location?.lng,
            checkOutLat: data.check_out_lat,
            checkOutLng: data.check_out_lng,
            checkOutLocationName: data.check_out_location_name
        };
    };

    // 1. Fetch Today's Status AND Action Required items
    const fetchTodayStatus = useCallback(async () => {
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
                    // It's from the past!
                    setOutdatedLog(mapped);
                    // Still need to check if there's a separate record for TODAY (e.g. already checked in today)
                    const { data: todayRecord } = await supabase
                        .from('attendance_logs')
                        .select('*')
                        .eq('user_id', userId)
                        .eq('date', todayDateStr)
                        .maybeSingle();
                    setTodayLog(todayRecord ? mapAttendanceLog(todayRecord) : null);
                }
            } else {
                // No active session, just check today
                const { data: todayRecord } = await supabase
                    .from('attendance_logs')
                    .select('*')
                    .eq('user_id', userId)
                    .eq('date', todayDateStr)
                    .maybeSingle();
                setTodayLog(todayRecord ? mapAttendanceLog(todayRecord) : null);
                setOutdatedLog(null);
            }

            // B. Get Action Required Log
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
            console.error("Error fetching attendance:", err);
        } finally {
            setIsLoading(false);
        }
    }, [userId, todayDateStr]);

    // 2. Fetch Stats (Overview for Dashboard) - Scoped to Month + Streak Calculation
    const fetchStats = useCallback(async (targetDate: Date = new Date()) => {
        try {
            const start = format(startOfMonth(targetDate), 'yyyy-MM-dd');
            const end = format(endOfMonth(targetDate), 'yyyy-MM-dd');

            // Select minimal fields for performance
            const { data, error } = await supabase
                .from('attendance_logs')
                .select('date, check_in_time, check_out_time, status') 
                .eq('user_id', userId)
                .gte('date', start)
                .lte('date', end);

            // Fetch Config
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
            }

            // --- STREAK CALCULATION (Independent of Month) ---
            // Fetch last 20 logs to check for streak
            const { data: streakLogs } = await supabase
                .from('attendance_logs')
                .select('date, check_in_time, status')
                .eq('user_id', userId)
                .order('date', { ascending: false })
                .limit(20);

            let currentStreak = 0;
            if (streakLogs) {
                // Find if today is already counted
                let skipToday = false;
                const todayRecord = streakLogs.find((l:any) => l.date === todayDateStr);
                
                // If checked in today and NOT late, count it. If late, streak is 0.
                if (todayRecord) {
                    if (todayRecord.status === 'LATE') {
                        // Broken streak today
                        currentStreak = 0;
                        skipToday = true; // Stop loop immediately
                    } else if (todayRecord.check_in_time) {
                        const checkIn = new Date(todayRecord.check_in_time);
                        if (checkIsLate(checkIn, startTimeStr, buffer)) {
                             currentStreak = 0;
                             skipToday = true;
                        } else {
                             // Good today, start counting
                             currentStreak = 1;
                             skipToday = true;
                        }
                    }
                }

                if (currentStreak !== 0 || !todayRecord) {
                    // Continue checking past days
                    for (const log of streakLogs) {
                        if (skipToday && log.date === todayDateStr) continue;
                        
                        // Ignore LEAVE (doesn't break streak, but doesn't add)
                        if (log.status === 'LEAVE') continue;

                        if (log.status === 'ABSENT' || log.status === 'LATE') {
                            break; // Streak broken
                        }

                        // Check time strictly
                        if (log.check_in_time) {
                            const checkIn = new Date(log.check_in_time);
                            if (checkIsLate(checkIn, startTimeStr, buffer)) {
                                break;
                            }
                            // If clean, add to streak
                            currentStreak++;
                        } else {
                             // No check-in time but not absent/late/leave? Weird data, break.
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

    // 4. Check In Action (Updated for Structured Data and Appeals)
    const checkIn = async (
        workType: WorkLocation, 
        file?: File, 
        location?: { lat: number, lng: number },
        locationName?: string, // Added explicitly
        note?: string, // Additional note
        externalUploadFn?: (file: File) => Promise<string | null>,
        isAppeal: boolean = false // NEW Parameter for Appeal
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
            // Add APPEAL tag if needed
            if (isAppeal) meta.push(`[APPEAL_PENDING]`);

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

            showToast(isLate && !isAppeal ? 'เข้างานสายนะวันนี้! 🐢' : 'สวัสดีตอนเช้าครับ! ☀️', (isLate && !isAppeal) ? 'warning' : 'success');
            await supabase.from('profiles').update({ work_status: 'ONLINE' }).eq('id', userId);
            
            // --- TRIGGER GAME EVENT ---
            // Pass Date and Time to Engine for better messaging
            // If Appeal, send 'APPEAL' status to avoid penalty logic in gameLogic
            await processAction(userId, 'ATTENDANCE_CHECK_IN', {
                status: isAppeal ? 'APPEAL' : (isLate ? 'LATE' : 'ON_TIME'),
                date: now,
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

    // 4.1 Manual Check In (For Forgotten Check-in)
    const manualCheckIn = async (
        checkInTime: Date,
        reason: string,
        file?: File,
        externalUploadFn?: (file: File) => Promise<string | null>
    ) => {
        setIsLoading(true);
        try {
            const dateStr = format(checkInTime, 'yyyy-MM-dd');
            
            let proofUrl = null;
            if (file) {
                 if (externalUploadFn) {
                     proofUrl = await externalUploadFn(file);
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

            let note = reason;
            if (proofUrl) note += ` [PROOF:${proofUrl}]`;

            const payload = {
                user_id: userId,
                date: dateStr,
                check_in_time: checkInTime.toISOString(),
                work_type: 'OFFICE', // Default assumption
                status: 'PENDING_VERIFY',
                note: `[MANUAL_ENTRY] ${note}`,
                location_name: 'Manual Entry'
            };

            const { error } = await supabase.from('attendance_logs').insert(payload);
            if (error) throw error;

            showToast('บันทึกเวลาเข้างานแบบ Manual แล้ว (รอตรวจสอบ) ✅', 'success');
            
            // Set status to ONLINE? 
            await supabase.from('profiles').update({ work_status: 'ONLINE' }).eq('id', userId);
            
            fetchTodayStatus();
            fetchStats();
            return true;
        } catch(err: any) {
            showToast('บันทึกไม่สำเร็จ: ' + err.message, 'error');
            return false;
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
            if (calcResult.status === 'EARLY_LEAVE') {
                 noteAppend += ` [EARLY: Missing ${calcResult.missingMinutes.toFixed(0)}m]`;
                 if (reason) noteAppend += ` [REASON: ${reason}]`;
            } else {
                 noteAppend += ` [OK: ${calcResult.hoursWorked.toFixed(1)} hrs]`;
            }

            // Preserve PENDING_VERIFY if it was manual, otherwise COMPLETED
            const newStatus = todayLog.status === 'PENDING_VERIFY' ? 'PENDING_VERIFY' : 'COMPLETED';

            const updatePayload: any = {
                check_out_time: now.toISOString(),
                status: newStatus,
                note: (todayLog.note || '') + noteAppend,
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
            if (calcResult.status === 'COMPLETED' || newStatus === 'PENDING_VERIFY') {
                showToast('เลิกงานแล้ว พักผ่อนเยอะๆ นะครับ 💤', 'success');
                // Even if pending verify, we give benefit of doubt for now or wait for admin?
                // Let's record DUTY_COMPLETE for game log purposes
                await processAction(userId, 'DUTY_COMPLETE', {
                    reason: `Work day completed (${calcResult.hoursWorked.toFixed(1)} hrs)`,
                    date: now 
                });
            } else {
                showToast(`กลับก่อนเวลา! (ขาด ${calcResult.missingMinutes.toFixed(0)} นาที)`, 'warning');
                await processAction(userId, 'ATTENDANCE_EARLY_LEAVE', {
                    missingMinutes: Math.round(calcResult.missingMinutes),
                    date: now 
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
        outdatedLog, // Exported
        actionRequiredLog, // Exported
        stats,
        isLoading,
        checkIn,
        manualCheckIn, // Exported
        checkOut,
        getAttendanceLogs, 
        refresh: fetchTodayStatus
    };
};
