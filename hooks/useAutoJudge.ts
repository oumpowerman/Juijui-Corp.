
import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { User, AnnualHoliday } from '../types';
import { useGamification } from './useGamification';
import { useGameConfig } from '../context/GameConfigContext'; // Import Config
import { addDays, format, isBefore, subDays, differenceInCalendarDays, isSameDay } from 'date-fns';
import { isTaskCompleted } from '../constants';

export const useAutoJudge = (currentUser: User | null) => {
    const { processAction } = useGamification(currentUser);
    const { config } = useGameConfig(); // Use Game Config from DB
    
    // Ref to track items currently being processed to prevent duplicate penalties in the same session
    const isProcessingRef = useRef<Set<string>>(new Set());

    /**
     * 🛠️ HELPER: ตรวจสอบว่าเป็นวันทำงานหรือไม่?
     * เช็ค 3 ระดับ: 
     * 1. Calendar Exception (วันหยุด/ทำงานพิเศษที่แอดมินตั้ง) -> Priority สูงสุด
     * 2. Annual Holiday (วันหยุดประจำปี)
     * 3. User's Personal Schedule (วันทำงานรายบุคคล)
     */
    const isWorkingDay = (date: Date, holidays: AnnualHoliday[], exceptions: any[], user: User | null) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        
        // 1. Check Exceptions (Highest Priority)
        const exception = exceptions.find(e => e.date === dateStr);
        if (exception) {
            // ถ้าเป็น WORK_DAY ให้ถือว่าทำงาน (แม้เป็นวันหยุด)
            // ถ้าเป็น HOLIDAY ให้ถือว่าหยุด (แม้เป็นวันทำงาน)
            return exception.type === 'WORK_DAY'; 
        }

        // 2. Check Annual Holidays
        const isAnnualHoliday = holidays.some(h => 
            h.isActive && h.day === date.getDate() && h.month === (date.getMonth() + 1)
        );
        if (isAnnualHoliday) return false;

        // 3. Check User Personal Schedule
        // Default to Mon-Fri (1-5) if workDays is missing
        const userWorkDays = user?.workDays || [1, 2, 3, 4, 5];
        return userWorkDays.includes(date.getDay());
    };

    /**
     * 🛠️ HELPER: เช็คว่าเป็นวันหยุดบริษัทหรือไม่ (สำหรับใช้เช็คก่อนหักคะแนนทั่วไป)
     */
    const isHolidayOrException = (date: Date, holidays: AnnualHoliday[], exceptions: any[]) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        
        // Check Exception
        const exception = exceptions.find(e => e.date === dateStr);
        if (exception) {
            return exception.type === 'HOLIDAY'; // If explicitly marked as holiday
        }

        // Check Annual Holiday
        return holidays.some(h => 
            h.isActive && h.day === date.getDate() && h.month === (date.getMonth() + 1)
        );
    };

    /**
     * 🛠️ HELPER: นับจำนวนวันที่ล่าช้า (เฉพาะวันทำงาน)
     * ใช้สำหรับคำนวณโทษของ "เวร" (Duty) ที่มักจะไม่นับรวมวันหยุด
     */
    const countWorkingDaysLate = (dutyDate: Date, today: Date, holidays: AnnualHoliday[], exceptions: any[], user: User | null) => {
        let count = 0;
        let current = addDays(dutyDate, 1); // เริ่มนับจากวันถัดไป
        
        // วนลูปจนถึงเมื่อวาน (ไม่รวมวันนี้)
        while (isBefore(current, today)) {
             if (isWorkingDay(current, holidays, exceptions, user)) {
                 count++;
             }
             current = addDays(current, 1);
        }
        return count;
    };

    const checkAndPunish = async () => {
        if (!currentUser) return;
        
        try {
            const today = new Date();
            const todayStr = format(today, 'yyyy-MM-dd');

            // --- CONFIG VALUES ---
            // Fallback to default if not set in DB config
            const negligencePenalty = config?.AUTO_JUDGE_CONFIG?.negligence_penalty_hp || 20;
            const lookbackDays = config?.AUTO_JUDGE_CONFIG?.lookback_days_check || 60;
            const negligenceThreshold = config?.AUTO_JUDGE_CONFIG?.negligence_threshold_days || 1;

            // =========================================================
            // 1. PRELOAD DATA (โหลดข้อมูลที่จำเป็นครั้งเดียว)
            // =========================================================
            
            // 1.1 วันหยุดและข้อยกเว้นปฏิทิน
            const { data: annualHolidays } = await supabase.from('annual_holidays').select('*');
            const { data: calendarExceptions } = await supabase.from('calendar_exceptions').select('*');
            
            const holidays = (annualHolidays || []).map((h:any) => ({
                id: h.id, name: h.name, day: h.day, month: h.month, typeKey: h.type_key, isActive: h.is_active
            }));
            const exceptions = calendarExceptions || [];

            // 1.2 ข้อมูลการลาของผู้ใช้ (เพื่อไม่ให้หักคะแนนถ้าลาถูกต้อง)
            const { data: userLeaves } = await supabase
                .from('leave_requests')
                .select('*')
                .eq('user_id', currentUser.id)
                .in('status', ['APPROVED', 'PENDING']) // ✅ ดึงทั้ง APPROVED และ PENDING
                .gte('end_date', format(addDays(today, -lookbackDays), 'yyyy-MM-dd')); // ดูย้อนหลังตาม Config

            // ฟังก์ชันเช็คว่าผู้ใช้อยู่ระหว่างลาหรือไม่ในวันที่ระบุ
            const isUserOnLeave = (dateStr: string) => {
                if (!userLeaves) return { onLeave: false, status: null };
                const checkDate = new Date(dateStr); 
                checkDate.setHours(12, 0, 0, 0); // เที่ยงวันป้องกันเรื่อง timezone

                const leave = userLeaves.find(leave => {
                    const start = new Date(leave.start_date);
                    start.setHours(0, 0, 0, 0);
                    const end = new Date(leave.end_date);
                    end.setHours(23, 59, 59, 999);
                    return checkDate >= start && checkDate <= end;
                });

                return leave ? { onLeave: true, status: leave.status } : { onLeave: false, status: null };
            };

            // =========================================================
            // SECTION A: DUTIES (เวรทำความสะอาด)
            // =========================================================
            
            // GRACE PERIOD CHECK: 
            // Only judge yesterday's duty if current time is past the grace hour (e.g., 10:00 AM)
            const graceHour = config?.AUTO_JUDGE_CONFIG?.duty_grace_hour || 10;
            const currentHour = today.getHours();
            
            const { data: missedDuties, error: dutyError } = await supabase
                .from('duties')
                .select('*')
                .eq('assignee_id', currentUser.id)
                .lt('date', todayStr) // เวรที่ผ่านมาแล้ว
                .eq('is_done', false) // ยังไม่เสร็จ
                .eq('cleared_by_system', false) // ✅ ป้องกันการดึงเวรที่ระบบเคลียร์ไปแล้วมาประมวลผลซ้ำ
                .neq('penalty_status', 'ACCEPTED_FAULT')
                .neq('penalty_status', 'LATE_COMPLETED')
                .neq('penalty_status', 'EXCUSED');

            if (!dutyError && missedDuties && missedDuties.length > 0) {
                // Check if user has a NEW duty today (to trigger Negligence Protocol)
                const { data: todayDutyData } = await supabase
                    .from('duties')
                    .select('id')
                    .eq('assignee_id', currentUser.id)
                    .eq('date', todayStr)
                    .limit(1);
                
                const hasNewDutyToday = todayDutyData && todayDutyData.length > 0;

                for (const duty of missedDuties) {
                    if (isProcessingRef.current.has(duty.id)) continue;

                    const dutyDateStr = duty.date; 
                    const dutyDate = new Date(dutyDateStr);
                    
                    // 1. GRACE PERIOD: If duty was yesterday and it's before grace hour, skip judging
                    const isYesterday = isSameDay(dutyDate, subDays(today, 1));
                    if (isYesterday && currentHour < graceHour) {
                        console.log(`[AutoJudge] Skipping duty ${duty.id} (Yesterday) - Waiting for grace period until ${graceHour}:00`);
                        continue;
                    }

                    // --- NEGLIGENCE PROTOCOL: CLEAR ABANDONED DUTIES ---
                    // If user has an ABANDONED duty that hasn't been cleared, AND a new duty arrives today
                    if (duty.penalty_status === 'ABANDONED' && !duty.cleared_by_system) {
                         if (hasNewDutyToday) {
                             const lockKey = `negligence-${duty.id}`;
                             if (isProcessingRef.current.has(lockKey)) continue;
                             
                             // ✅ ตรวจสอบจาก game_logs อีกชั้นว่าเคยโดน Negligence Penalty สำหรับเวรนี้ไปหรือยัง
                             const { data: existingNegligence } = await supabase
                                 .from('game_logs')
                                 .select('id')
                                 .eq('user_id', currentUser.id)
                                 .eq('action_type', 'DUTY_MISSED')
                                 .eq('related_id', duty.id)
                                 .ilike('description', '%เพิกเฉย%')
                                 .limit(1);

                             if (!existingNegligence || existingNegligence.length === 0) {
                                 isProcessingRef.current.add(lockKey);
                                 console.log(`[AutoJudge] Negligence Protocol triggered for duty ${duty.id}`);
                                 
                                 // 1. Penalize (Heavy) - Use Config Value
                                 await processAction(currentUser.id, 'DUTY_MISSED', { 
                                     ...duty, 
                                     reason: 'NEGLIGENCE_PROTOCOL', 
                                     customPenalty: negligencePenalty,
                                     description: 'เพิกเฉยต่อหน้าที่จนเวรรอบใหม่มาถึง (System Cleared)'
                                 });

                                 // 2. Clear Duty
                                 await supabase.from('duties').update({ cleared_by_system: true }).eq('id', duty.id);

                                 // 3. Trigger Lock Screen (via Notification)
                                 await supabase.from('notifications').insert({
                                     user_id: currentUser.id,
                                     type: 'SYSTEM_LOCK_PENALTY', // Special Type
                                     title: '⚠️ คุณถูกหักคะแนนฐานเพิกเฉย!',
                                     message: 'เนื่องจากคุณปล่อยเวรเก่าทิ้งไว้จนเวรรอบใหม่มาถึง ระบบได้ทำการหักคะแนนเพิ่มและเคลียร์เวรเก่าออก',
                                     is_read: false,
                                     link_path: 'DUTY',
                                     metadata: { hp: -negligencePenalty }
                                 });
                             } else {
                                 // ถ้ามี Log แล้วแต่ยังไม่ถูกเคลียร์ ให้เคลียร์ซ้ำเพื่อความชัวร์
                                 await supabase.from('duties').update({ cleared_by_system: true }).eq('id', duty.id);
                             }
                         }
                         continue; // Skip standard processing for abandoned duties
                    }

                    // --- STANDARD PROCESSING (If not yet abandoned) ---
                    if (duty.penalty_status === 'ABANDONED') continue; // Already processed as abandoned (but not cleared yet)

                    // ถ้าวันที่ต้องทำเวร เป็นวันหยุด -> ยกประโยชน์ให้ (Excused)
                    if (isHolidayOrException(dutyDate, holidays, exceptions)) {
                        console.log(`[AutoJudge] Excusing duty ${duty.id} because it was a holiday.`);
                        await supabase.from('duties').update({ penalty_status: 'EXCUSED' }).eq('id', duty.id);
                        continue;
                    }

                    // ถ้าวันที่ต้องทำเวร "ลาป่วย/ลากิจ" -> ยกประโยชน์ให้ (Excused)
                    const leaveCheck = isUserOnLeave(dutyDateStr);
                    if (leaveCheck.onLeave) {
                        if (leaveCheck.status === 'APPROVED') {
                            console.log(`[AutoJudge] Excusing duty ${duty.id} because user was on leave.`);
                            await supabase.from('duties').update({ penalty_status: 'EXCUSED', is_done: true }).eq('id', duty.id);
                        } else {
                            console.log(`[AutoJudge] Deferring duty ${duty.id} penalty because leave is PENDING.`);
                        }
                        continue;
                    }
                    
                    // นับจำนวนวันทำการที่เลยกำหนด
                    const workingDaysLate = countWorkingDaysLate(dutyDate, today, holidays, exceptions, currentUser);

                    if (workingDaysLate === 0) {
                        // เลยกำหนดมานิดหน่อย (เช่น เสาร์อาทิตย์) ยังไม่นับ
                        if (duty.penalty_status === 'NONE') {
                            await supabase.from('duties').update({ penalty_status: 'AWAITING_TRIBUNAL' }).eq('id', duty.id);
                        }
                    } 
                    else if (workingDaysLate >= negligenceThreshold) {
                        // เลยกำหนดเกิน Threshold (ตาม Config) -> ตัดสินว่า "ละเลยหน้าที่" (ABANDONED)
                        if (duty.penalty_status !== 'ABANDONED') {
                             isProcessingRef.current.add(duty.id);
                             await supabase.from('duties').update({ 
                                 is_penalized: true, 
                                 penalty_status: 'ABANDONED',
                                 abandoned_at: new Date().toISOString() // Mark time of abandonment
                             }).eq('id', duty.id);
                            
                            // เรียก Action เพื่อหักคะแนน (Initial Abandon Penalty)
                            await processAction(currentUser.id, 'DUTY_MISSED', { ...duty, reason: 'ABANDONED_DUTY' });
                            isProcessingRef.current.delete(duty.id);
                        }
                    }
                }
            }

            // =========================================================
            // SECTION B: TASKS (งานที่ได้รับมอบหมาย) - Progressive Penalty
            // =========================================================
            
            const { data: overdueTasks } = await supabase
                .from('tasks')
                .select('*')
                .contains('assignee_ids', [currentUser.id]) 
                .lt('end_date', todayStr); // งานที่เลย Deadline

            if (overdueTasks) {
                for (const task of overdueTasks) {
                    // 1. ถ้างานเสร็จแล้ว หรือเป็นงาน Unscheduled หรือกำลังประมวลผล ข้ามไป
                    if (
                        isTaskCompleted(task.status) || 
                        task.is_unscheduled || 
                        task.status === 'WAITING' || // ✅ เพิ่มเงื่อนไขนี้
                        isProcessingRef.current.has(task.id)
                    ) continue;
                    
                    // 2. เช็คว่า "วันนี้" โดนหักคะแนนไปหรือยัง?
                    const lastPenalized = task.last_penalized_at ? new Date(task.last_penalized_at) : null;
                    if (lastPenalized && isSameDay(lastPenalized, today)) {
                        continue; // วันนี้โดนไปแล้ว พรุ่งนี้ค่อยว่ากันใหม่
                    }

                    // 3. เช็คว่า "วันนี้" ลาหรือไม่? (Humanity Check)
                    // Note: Task usually count holidays unless strict, but we skip if user is on leave
                    const leaveCheck = isUserOnLeave(todayStr);
                    if (leaveCheck.onLeave) {
                        if (leaveCheck.status === 'PENDING') {
                            console.log(`[AutoJudge] Deferring task ${task.id} penalty because leave is PENDING.`);
                        }
                        continue;
                    }
                    
                    // 4. คำนวณความเสียหายแบบ Progressive (Dynamic from Config)
                    const deadlineStr = task.end_date;
                    const deadline = new Date(deadlineStr);
                    const daysLate = differenceInCalendarDays(today, deadline);
                    
                    if (daysLate <= 0) continue; 

                    // Lock task
                    isProcessingRef.current.add(task.id);

                    // DYNAMIC FORMULA: Base + (Days * Multiplier)
                    const basePenalty = config?.PENALTY_RATES?.HP_PENALTY_LATE || 5; 
                    const multiplier = config?.PENALTY_RATES?.HP_PENALTY_LATE_MULTIPLIER || 2;
                    const progressiveDamage = basePenalty + (daysLate * multiplier);
                    
                    // 5. ลงดาบ
                    await supabase.from('tasks').update({ 
                        is_penalized: true,
                        last_penalized_at: new Date().toISOString() // บันทึกว่าวันนี้โดนแล้ว
                    }).eq('id', task.id);

                    await processAction(currentUser.id, 'TASK_LATE', { 
                        ...task, 
                        customPenalty: progressiveDamage, // ส่งค่าดาเมจแบบคำนวณเองให้ Engine
                        daysLate: daysLate
                    });

                    // Unlock
                    isProcessingRef.current.delete(task.id);
                }
            }

            // =========================================================
            // SECTION C: ABSENT (เช็คการขาดงานย้อนหลัง)
            // =========================================================
            
            // ปรับจากเช็คแค่ "เมื่อวาน" เป็นเช็คย้อนหลัง (Lookback) เพื่อเก็บตกกรณีหายไปหลายวัน
            const absentLookback = config?.AUTO_JUDGE_CONFIG?.absent_lookback_days || 7;
            
            for (let i = 1; i <= absentLookback; i++) {
                const checkDate = subDays(today, i);
                const checkDateStr = format(checkDate, 'yyyy-MM-dd');
                
                // 1. ข้ามถ้า "วันนี้" ไม่ใช่วันทำงาน หรือ เป็นวันหยุด หรือ ลา
                const wasWorkingDay = isWorkingDay(checkDate, holidays, exceptions, currentUser);
                const leaveCheck = isUserOnLeave(checkDateStr);
                
                if (!wasWorkingDay || leaveCheck.onLeave || isHolidayOrException(checkDate, holidays, exceptions)) {
                    // ✅ ถ้าลาแบบ PENDING ให้ส่ง Notification แจ้งเตือนว่าระงับการหักคะแนนไว้ก่อน
                    if (leaveCheck.onLeave && leaveCheck.status === 'PENDING') {
                        const notifyKey = `DEFER-ABSENT-${checkDateStr}`;
                        if (!isProcessingRef.current.has(notifyKey)) {
                            isProcessingRef.current.add(notifyKey);
                            
                            // เช็คว่าเคยแจ้งเตือนไปหรือยัง
                            const { data: notifyData } = await supabase
                                .from('notifications')
                                .select('id')
                                .eq('user_id', currentUser.id)
                                .eq('type', 'INFO')
                                .ilike('message', `%ระงับการหักคะแนนขาดงาน%${checkDateStr}%`)
                                .limit(1);

                            if (!notifyData || notifyData.length === 0) {
                                await supabase.from('notifications').insert({
                                    user_id: currentUser.id,
                                    type: 'INFO',
                                    title: 'ℹ️ การหักคะแนนถูกระงับชั่วคราว',
                                    message: `การหักคะแนนขาดงานของวันที่ ${checkDateStr} ถูกระงับไว้ชั่วคราว เนื่องจากคุณมีใบลาที่รอการอนุมัติ หากใบลาถูกปฏิเสธ ระบบจะดำเนินการหักคะแนนตามปกติ`,
                                    is_read: false,
                                    link_path: 'LEAVE'
                                });
                            }
                        }
                    }
                    continue;
                }

                // 2. ดูว่ามีการลงเวลาไหม?
                const { data: attendanceData } = await supabase
                    .from('attendance_logs')
                    .select('id, status')
                    .eq('user_id', currentUser.id)
                    .eq('date', checkDateStr)
                    .limit(1);

                const attendance = attendanceData && attendanceData.length > 0 ? attendanceData[0] : null;

                // 3. ถ้าไม่มี Log เลย หรือมี Log แต่สถานะไม่ใช่การทำงาน/ลา (เช่น อาจจะเป็น Log เปล่าที่ระบบสร้างค้างไว้)
                if (!attendance) {
                     // เช็คว่าเคยโดนหักคะแนน Absent ของวันนี้ไปหรือยัง (กันหักซ้ำ)
                     const absentLockKey = `ABSENT-${checkDateStr}`;

                     if (!isProcessingRef.current.has(absentLockKey)) {
                         // ✅ ตรวจสอบจาก game_logs อีกชั้นว่าเคยโดนหักคะแนน Absent ของวันนี้ไปหรือยัง
                         const { data: absentPenaltyData } = await supabase
                             .from('game_logs')
                             .select('id')
                             .eq('user_id', currentUser.id)
                             .eq('action_type', 'ATTENDANCE_ABSENT')
                             .ilike('description', `%ABSENT_DATE:${checkDateStr}%`)
                             .limit(1);

                         if (absentPenaltyData && absentPenaltyData.length > 0) {
                             // ถ้ามี Penalty ใน Log แล้วแต่ไม่มี Attendance Log (อาจจะเกิด Error ตอน Insert)
                             // ให้สร้าง Attendance Log ให้สมบูรณ์เพื่อหยุด Loop
                             await supabase.from('attendance_logs').insert({
                                 user_id: currentUser.id,
                                 date: checkDateStr,
                                 status: 'ABSENT',
                                 work_type: 'OFFICE',
                                 note: '[SYSTEM] Auto-marked as Absent (Log Recovery)'
                             });
                             continue;
                         }

                         isProcessingRef.current.add(absentLockKey);

                         // Insert Absent Log and get the ID
                         const { data: newLog, error: insertError } = await supabase.from('attendance_logs').insert({
                             user_id: currentUser.id,
                             date: checkDateStr,
                             status: 'ABSENT',
                             work_type: 'OFFICE',
                             note: '[SYSTEM] Auto-marked as Absent by Judge (Lookback Catch-up)'
                         }).select('id').single();
                         
                         if (!insertError && newLog) {
                             // หักคะแนนขาดงาน
                             await processAction(currentUser.id, 'ATTENDANCE_ABSENT', { 
                                 date: checkDateStr,
                                 id: newLog.id,
                                 reason: `ABSENT_DATE:${checkDateStr}` // ✅ ใส่เพื่อให้ตรวจสอบซ้ำได้แม่นยำ
                             });
                             
                             console.log(`[AutoJudge] ${currentUser.name} marked ABSENT for ${checkDateStr} (Lookback)`);
                         } else {
                             console.error("[AutoJudge] Failed to insert absent log:", insertError);
                         }
                         
                         // Note: We don't delete from isProcessingRef here to prevent re-processing in the same session
                     }
                }
            }

            // =========================================================
            // SECTION D: AUTO-CLEANUP OLD CORRECTION REQUESTS
            // =========================================================
            const { data: oldRequests } = await supabase
                .from('leave_requests')
                .select('id, user_id, type')
                .eq('status', 'PENDING')
                .in('type', ['LATE_ENTRY', 'FORGOT_CHECKIN', 'FORGOT_CHECKOUT', 'FORGOT_BOTH'])
                .lt('created_at', format(subDays(today, 7), 'yyyy-MM-dd')); // 7 calendar days for admin to approve

            if (oldRequests && oldRequests.length > 0) {
                for (const req of oldRequests) {
                    if (isProcessingRef.current.has(`cleanup-${req.id}`)) continue;
                    isProcessingRef.current.add(`cleanup-${req.id}`);

                    await supabase.from('leave_requests').update({
                        status: 'REJECTED',
                        rejection_reason: 'ระบบยกเลิกอัตโนมัติ (เกินกำหนดเวลาตรวจสอบ 7 วัน)'
                    }).eq('id', req.id);

                    await supabase.from('notifications').insert({
                        user_id: req.user_id,
                        type: 'INFO',
                        title: '❌ คำขอถูกยกเลิกอัตโนมัติ',
                        message: `รายการ: ${req.type}\nเหตุผล: เกินกำหนดเวลาตรวจสอบ 7 วัน`,
                        is_read: false,
                        link_path: 'ATTENDANCE'
                    });

                    console.log(`[AutoJudge] Auto-rejected old request ${req.id}`);
                    isProcessingRef.current.delete(`cleanup-${req.id}`);
                }
            }

            // =========================================================
            // SECTION E: FORGOTTEN CHECKOUT PENALTY (ลืมตอกบัตรออกข้ามวัน)
            // =========================================================
            const { data: forgotCheckoutLogs } = await supabase
                .from('attendance_logs')
                .select('id, date, note')
                .eq('user_id', currentUser.id)
                .eq('status', 'WORKING')
                .is('check_out_time', null)
                .lt('date', todayStr); // ข้ามวันแล้ว

            if (forgotCheckoutLogs && forgotCheckoutLogs.length > 0) {
                for (const log of forgotCheckoutLogs) {
                    const lockKey = `FORGOT-OUT-${log.id}`;
                    if (isProcessingRef.current.has(lockKey)) continue;

                    // 1. เช็คว่ามีคำขอแก้เวลา (Correction Request) ที่รออนุมัติของวันนี้หรือไม่
                    const correctionCheck = isUserOnLeave(log.date);
                    if (correctionCheck.onLeave && correctionCheck.status === 'PENDING') {
                        console.log(`[AutoJudge] Deferring forgot checkout penalty for ${log.date} because correction is PENDING.`);
                        continue;
                    }
                    
                    // 2. ตรวจสอบจาก game_logs โดยใช้ Tag เฉพาะ (Robust Check)
                    const { data: penaltyData } = await supabase
                        .from('game_logs')
                        .select('id')
                        .eq('user_id', currentUser.id)
                        .eq('action_type', 'ATTENDANCE_FORGOT_CHECKOUT')
                        .ilike('description', `%[FORGOT_OUT_DATE:${log.date}]%`)
                        .limit(1);

                    if (penaltyData && penaltyData.length > 0) {
                        // ✅ Recovery: ถ้าเคยหักแล้วแต่สถานะยังเป็น WORKING ให้แก้เป็น ACTION_REQUIRED เพื่อหยุด Loop
                        await supabase.from('attendance_logs').update({
                            status: 'ACTION_REQUIRED',
                            note: `${log.note || ''} [SYSTEM] Status recovered (Penalized)`.trim()
                        }).eq('id', log.id);
                        continue;
                    }

                    // 3. เช็คว่าเคยมี Notification ของวันนี้ส่งไปหรือยัง (กันส่งซ้ำจนรกตาราง)
                    // ปรับปรุง: ไม่เช็ค is_read เพื่อให้ถ้าเคยส่งไปแล้ว (แม้จะอ่านแล้ว) ก็ไม่ต้องส่งใหม่
                    const { data: notifyData } = await supabase
                        .from('notifications')
                        .select('id')
                        .eq('user_id', currentUser.id)
                        .eq('type', 'SYSTEM_LOCK_PENALTY')
                        .ilike('message', `%${log.date}%`)
                        .limit(1);

                    if (!notifyData || notifyData.length === 0) {
                        isProcessingRef.current.add(lockKey);

                        // Update status to ACTION_REQUIRED
                        await supabase.from('attendance_logs').update({
                            status: 'ACTION_REQUIRED',
                            note: `${log.note || ''} [SYSTEM] Penalized for forgotten checkout`.trim()
                        }).eq('id', log.id);
                        
                        // Penalty: Deduct HP
                        await processAction(currentUser.id, 'ATTENDANCE_FORGOT_CHECKOUT', {
                            date: log.date,
                            id: log.id,
                            reason: `FORGOT_OUT_DATE:${log.date}` // ✅ ใส่ Tag เพื่อให้ตรวจสอบซ้ำได้แม่นยำ
                        });

                        await supabase.from('notifications').insert({
                            user_id: currentUser.id,
                            type: 'SYSTEM_LOCK_PENALTY',
                            title: '⚠️ หักคะแนน: ลืมตอกบัตรออก',
                            message: `คุณลืมตอกบัตรออกของวันที่ ${log.date} ระบบได้ทำการหักคะแนน กรุณาส่งคำขอแจ้งเวลาออกย้อนหลังเพื่อขอคืนคะแนน`,
                            is_read: false,
                            link_path: 'ATTENDANCE',
                            metadata: { hp: -10, logId: log.id }
                        });

                        console.log(`[AutoJudge] Penalized forgotten checkout for ${log.date}`);
                        // We don't delete from isProcessingRef to keep it locked in this session
                    }
                }
            }

        } catch (err) {
            console.error("Auto Judge Error:", err);
        }
    };

    // ตั้งเวลาให้ทำงานเมื่อ Component Mount และวนทุก 10 นาที
    // เพิ่ม config เป็น dependency เพื่อให้ logic อัปเดตถ้ามีการปรับเปลี่ยนค่ากลาง
    useEffect(() => {
        const initialTimer = setTimeout(() => { checkAndPunish(); }, 5000); 
        const interval = setInterval(() => { checkAndPunish(); }, 10 * 60 * 1000); 
        return () => { clearTimeout(initialTimer); clearInterval(interval); };
    }, [currentUser?.id, config]); 
};
