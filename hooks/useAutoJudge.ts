
import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { User, Status } from '../types';
import { useGamification } from './useGamification';
import { addDays, format, isBefore, startOfDay } from 'date-fns';
import { isTaskCompleted } from '../constants';

export const useAutoJudge = (currentUser: User | null) => {
    const { processAction } = useGamification(currentUser);
    const hasRun = useRef(false);

    const checkAndPunish = async () => {
        if (!currentUser || hasRun.current) return;
        
        // --- 1. Prevent running multiple times per session ---
        // Also check localStorage to prevent running on refresh multiple times a day if needed,
        // but since we check for 'is_penalized' in DB, it is safe to run on every mount (idempotent).
        hasRun.current = true;

        try {
            const yesterdayStr = format(addDays(new Date(), -1), 'yyyy-MM-dd');
            const todayStr = format(new Date(), 'yyyy-MM-dd');

            // --- A. CHECK MISSED DUTIES (Past dates only) ---
            const { data: missedDuties, error: dutyError } = await supabase
                .from('duties')
                .select('*')
                .eq('assignee_id', currentUser.id)
                .lt('date', todayStr) // Strictly before today
                .eq('is_done', false)
                .eq('is_penalized', false); // Not yet punished

            if (!dutyError && missedDuties && missedDuties.length > 0) {
                for (const duty of missedDuties) {
                    // 1. Execute Punishment
                    await processAction(currentUser.id, 'DUTY_MISSED', duty);
                    
                    // 2. Mark as Penalized
                    await supabase
                        .from('duties')
                        .update({ is_penalized: true })
                        .eq('id', duty.id);
                }
            }

            // --- B. CHECK OVERDUE TASKS (Tasks & Contents) ---
            // We check both tables. Only punish if not Done/Approve.
            
            // B1. General Tasks
            const { data: overdueTasks, error: taskError } = await supabase
                .from('tasks')
                .select('*')
                .contains('assignee_ids', [currentUser.id]) // I am assignee
                .lt('end_date', todayStr) // Deadline passed
                .eq('is_penalized', false);

            if (!taskError && overdueTasks) {
                for (const task of overdueTasks) {
                    if (!isTaskCompleted(task.status)) {
                        await processAction(currentUser.id, 'TASK_LATE', task);
                        await supabase.from('tasks').update({ is_penalized: true }).eq('id', task.id);
                    }
                }
            }

            // B2. Contents
            // Logic: Owner or Assignee (Sub) gets punished? Usually Owner responsible for deadline.
            // Let's go with Assignees + Owner for now to be strict.
            const { data: overdueContents, error: contentError } = await supabase
                .from('contents')
                .select('*')
                .or(`assignee_ids.cs.{${currentUser.id}},idea_owner_ids.cs.{${currentUser.id}}`) // Check both fields
                .lt('end_date', todayStr)
                .eq('is_unscheduled', false) // Ignore stock
                .eq('is_penalized', false);

            if (!contentError && overdueContents) {
                for (const content of overdueContents) {
                    if (!isTaskCompleted(content.status)) {
                        await processAction(currentUser.id, 'TASK_LATE', content);
                        await supabase.from('contents').update({ is_penalized: true }).eq('id', content.id);
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
        }, 3000); // Wait 3s after load to not block UI rendering
        
        return () => clearTimeout(timeout);
    }, [currentUser?.id]); // Run once per user login session
};
