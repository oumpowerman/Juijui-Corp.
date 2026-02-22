
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
                .eq('status', 'APPROVED')
                .gte('end_date', format(addDays(today, -lookbackDays), 'yyyy-MM-dd')); // ดูย้อนหลังตาม Config

            // ฟังก์ชันเช็คว่าผู้ใช้อยู่ระหว่างลาหรือไม่ในวันที่ระบุ
            const isUserOnLeave = (dateStr: string) => {
                if (!userLeaves) return false;
                const checkDate = new Date(dateStr); 
                checkDate.setHours(12, 0, 0, 0); // เที่ยงวันป้องกันเรื่อง timezone

                return userLeaves.some(leave => {
                    const start = new Date(leave.start_date);
                    start.setHours(0, 0, 0, 0);
                    const end = new Date(leave.end_date);
                    end.setHours(23, 59, 59, 999);
                    return checkDate >= start && checkDate <= end;
                });
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
                .neq('penalty_status', 'ACCEPTED_FAULT')
                .neq('penalty_status', 'LATE_COMPLETED')
                .neq('penalty_status', 'EXCUSED');

            if (!dutyError && missedDuties && missedDuties.length > 0) {
                // Check if user has a NEW duty today (to trigger Negligence Protocol)
                const { data: todayDuty } = await supabase
                    .from('duties')
                    .select('id')
                    .eq('assignee_id', currentUser.id)
                    .eq('date', todayStr)
                    .maybeSingle();
                
                const hasNewDutyToday = !!todayDuty;

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
                             isProcessingRef.current.add(duty.id);
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
                             
                             isProcessingRef.current.delete(duty.id);
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
                    if (isUserOnLeave(dutyDateStr)) {
                        console.log(`[AutoJudge] Excusing duty ${duty.id} because user was on leave.`);
                        await supabase.from('duties').update({ penalty_status: 'EXCUSED', is_done: true }).eq('id', duty.id);
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
                    if (isUserOnLeave(todayStr)) {
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
            // SECTION C: ABSENT (ขาดงานเมื่อวาน)
            // =========================================================
            const yesterday = subDays(today, 1);
            const yesterdayStr = format(yesterday, 'yyyy-MM-dd');
            const wasYesterdayWorkingDay = isWorkingDay(yesterday, holidays, exceptions, currentUser);
            
            // เช็คเฉพาะถ้าเมื่อวานเป็นวันทำงาน (ของคนๆ นี้) และไม่ได้ลา และไม่ใช่วันหยุดประจำปี
            if (wasYesterdayWorkingDay && !isUserOnLeave(yesterdayStr) && !isHolidayOrException(yesterday, holidays, exceptions)) {
                // ดูว่ามีการลงเวลาไหม?
                const { data: attendance } = await supabase.from('attendance_logs').select('id').eq('user_id', currentUser.id).eq('date', yesterdayStr).maybeSingle();

                if (!attendance) {
                     // ถ้าไม่มี -> เช็คว่าเคยโดนหักคะแนน Absent ของเมื่อวานไปหรือยัง (กันหักซ้ำ)
                     const { data: existingPenalty } = await supabase.from('game_logs').select('id').eq('user_id', currentUser.id).eq('action_type', 'ATTENDANCE_ABSENT').ilike('description', `%${yesterdayStr}%`).maybeSingle();
                     
                     // Using a composite key for absent lock to be safe
                     const absentLockKey = `absent-${yesterdayStr}`;

                     if (!existingPenalty && !isProcessingRef.current.has(absentLockKey)) {
                         isProcessingRef.current.add(absentLockKey);

                         // Insert Absent Log
                         await supabase.from('attendance_logs').insert({
                             user_id: currentUser.id,
                             date: yesterdayStr,
                             status: 'ABSENT',
                             work_type: 'OFFICE',
                             note: '[SYSTEM] Auto-marked as Absent by Judge'
                         });
                         
                         // หักคะแนนขาดงาน
                         await processAction(currentUser.id, 'ATTENDANCE_ABSENT', { date: yesterdayStr });
                         console.log(`[AutoJudge] ${currentUser.name} marked ABSENT for ${yesterdayStr}`);
                         
                         isProcessingRef.current.delete(absentLockKey);
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
