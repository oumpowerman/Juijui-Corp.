
import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { User, AnnualHoliday } from '../types';
import { useGamification } from './useGamification';
import { addDays, format, isBefore, isWeekend, subDays, differenceInCalendarDays, eachDayOfInterval, isSameDay, parseISO } from 'date-fns';
import { isTaskCompleted } from '../constants';

export const useAutoJudge = (currentUser: User | null) => {
    const { processAction } = useGamification(currentUser);
    const hasRun = useRef(false);

    // Helper: Check if a specific date is a working day (Not Weekend & Not Holiday)
    const isWorkingDay = (date: Date, holidays: AnnualHoliday[], exceptions: any[]) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        
        // 1. Check Exceptions (Highest Priority)
        const exception = exceptions.find(e => e.date === dateStr);
        if (exception) {
            return exception.type === 'WORK_DAY'; // If forced work day, return true. If forced holiday, return false.
        }

        // 2. Check Annual Holidays
        const isAnnualHoliday = holidays.some(h => 
            h.isActive && h.day === date.getDate() && h.month === (date.getMonth() + 1)
        );
        if (isAnnualHoliday) return false;

        // 3. Check Weekend
        return !isWeekend(date);
    };

    // Helper: Count working days passed since deadline until now (exclusive of today)
    const countWorkingDaysLate = (dutyDate: Date, today: Date, holidays: AnnualHoliday[], exceptions: any[]) => {
        let count = 0;
        let current = addDays(dutyDate, 1);
        
        while (isBefore(current, today)) {
             if (isWorkingDay(current, holidays, exceptions)) {
                 count++;
             }
             current = addDays(current, 1);
        }
        return count;
    };

    const checkAndPunish = async () => {
        if (!currentUser || hasRun.current) return;
        
        // Lock to prevent double execution
        hasRun.current = true;

        try {
            const today = new Date();
            const todayStr = format(today, 'yyyy-MM-dd');

            // --- PRELOAD HOLIDAY DATA ---
            const { data: annualHolidays } = await supabase.from('annual_holidays').select('*');
            const { data: calendarExceptions } = await supabase.from('calendar_exceptions').select('*');
            
            const holidays = (annualHolidays || []).map((h:any) => ({
                id: h.id, name: h.name, day: h.day, month: h.month, typeKey: h.type_key, isActive: h.is_active
            }));
            const exceptions = calendarExceptions || [];

            // --- PRELOAD USER LEAVES (Important for Fairness) ---
            // Check approved leaves that cover recent past
            const { data: userLeaves } = await supabase
                .from('leave_requests')
                .select('*')
                .eq('user_id', currentUser.id)
                .eq('status', 'APPROVED')
                .gte('end_date', format(addDays(today, -60), 'yyyy-MM-dd')); // Look back 60 days

            const isUserOnLeave = (dateStr: string) => {
                if (!userLeaves) return false;
                // Parse date string carefully to avoid timezone issues
                const checkDate = new Date(dateStr); 
                checkDate.setHours(12, 0, 0, 0); // Set to noon to avoid edge cases

                return userLeaves.some(leave => {
                    const start = new Date(leave.start_date);
                    start.setHours(0, 0, 0, 0);
                    const end = new Date(leave.end_date);
                    end.setHours(23, 59, 59, 999);
                    return checkDate >= start && checkDate <= end;
                });
            };

            // --- A. CHECK MISSED DUTIES (Past dates only) ---
            const { data: missedDuties, error: dutyError } = await supabase
                .from('duties')
                .select('*')
                .eq('assignee_id', currentUser.id)
                .lt('date', todayStr)
                .eq('is_done', false)
                .neq('penalty_status', 'ABANDONED') 
                .neq('penalty_status', 'ACCEPTED_FAULT')
                .neq('penalty_status', 'LATE_COMPLETED')
                .neq('penalty_status', 'EXCUSED');

            if (!dutyError && missedDuties && missedDuties.length > 0) {
                for (const duty of missedDuties) {
                    const dutyDateStr = duty.date; // YYYY-MM-DD
                    const dutyDate = new Date(dutyDateStr);

                    // 1. HUMANITY CHECK: Was user on leave that day?
                    if (isUserOnLeave(dutyDateStr)) {
                        console.log(`[AutoJudge] Excusing duty ${duty.id} because user was on leave.`);
                        await supabase
                            .from('duties')
                            .update({ 
                                penalty_status: 'EXCUSED',
                                is_done: true // Mark as done so it clears from dashboard
                            })
                            .eq('id', duty.id);
                        continue; // Skip punishment logic
                    }
                    
                    // 2. Calculate "Working Days Passed Since Duty"
                    const workingDaysLate = countWorkingDaysLate(dutyDate, today, holidays, exceptions);

                    if (workingDaysLate === 0) {
                        // CASE 1: Grace Period / Tribunal Day
                        if (duty.penalty_status === 'NONE') {
                            await supabase
                                .from('duties')
                                .update({ penalty_status: 'AWAITING_TRIBUNAL' })
                                .eq('id', duty.id);
                        }
                    } 
                    else if (workingDaysLate >= 1) {
                        // CASE 2: Execution Day
                        if (duty.penalty_status !== 'ABANDONED') {
                             await supabase
                                .from('duties')
                                .update({ 
                                    is_penalized: true, 
                                    penalty_status: 'ABANDONED' 
                                })
                                .eq('id', duty.id);
                            
                            // Severe Penalty
                            await processAction(currentUser.id, 'DUTY_MISSED', {
                                ...duty,
                                reason: 'ABANDONED_DUTY'
                            });
                        }
                    }
                }
            }

            // --- B. CHECK OVERDUE TASKS (Tasks & Contents) ---
            const { data: overdueTasks } = await supabase
                .from('tasks')
                .select('*')
                .contains('assignee_ids', [currentUser.id]) 
                .lt('end_date', todayStr) 
                .eq('is_penalized', false);

            if (overdueTasks) {
                for (const task of overdueTasks) {
                    if (!isTaskCompleted(task.status)) {
                        const deadlineStr = task.end_date; // YYYY-MM-DD from DB

                        // HUMANITY CHECK: Only punish if NOT on leave ON DEADLINE DATE
                        if (isUserOnLeave(deadlineStr)) {
                            // Mark as penalized so we don't check again (Excused)
                            // But DO NOT call processAction (No HP deduction)
                            await supabase.from('tasks').update({ is_penalized: true }).eq('id', task.id);
                            console.log(`Task ${task.title} excused due to leave on deadline.`);
                        } else {
                            // Real Punishment
                            await supabase.from('tasks').update({ is_penalized: true }).eq('id', task.id);
                            await processAction(currentUser.id, 'TASK_LATE', task);
                        }
                    }
                }
            }

            // --- C. CHECK ABSENT ---
            // Check yesterday specific attendance logic (if yesterday was working day)
            const yesterday = subDays(today, 1);
            const yesterdayStr = format(yesterday, 'yyyy-MM-dd');
            
            const wasYesterdayWorkingDay = isWorkingDay(yesterday, holidays, exceptions);
            
            if (wasYesterdayWorkingDay && !isUserOnLeave(yesterdayStr)) {
                // Check if user has checked in
                const { data: attendance } = await supabase
                    .from('attendance_logs')
                    .select('id')
                    .eq('user_id', currentUser.id)
                    .eq('date', yesterdayStr)
                    .maybeSingle();

                if (!attendance) {
                     // Check if already penalized to prevent duplicates
                     const { data: existingPenalty } = await supabase
                        .from('game_logs')
                        .select('id')
                        .eq('user_id', currentUser.id)
                        .eq('action_type', 'ATTENDANCE_ABSENT')
                        .ilike('description', `%${yesterdayStr}%`)
                        .maybeSingle();

                     if (!existingPenalty) {
                         await processAction(currentUser.id, 'ATTENDANCE_ABSENT', { date: yesterdayStr });
                     }
                }
            }

        } catch (err) {
            console.error("Auto Judge Error:", err);
        }
    };

    useEffect(() => {
        const timeout = setTimeout(() => {
            checkAndPunish();
        }, 5000); // 5 sec delay to ensure other data is loaded
        
        return () => clearTimeout(timeout);
    }, [currentUser?.id]); 
};
