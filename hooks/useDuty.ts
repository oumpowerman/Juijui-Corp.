
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Duty, User, DutyConfig } from '../types';
import { useToast } from '../context/ToastContext';
import { addDays, isWeekend, getDay, isBefore, format } from 'date-fns';

const DEFAULT_CONFIGS: DutyConfig[] = [
    { dayOfWeek: 1, requiredPeople: 1, taskTitles: ['เวรทั่วไป'] }, // Mon
    { dayOfWeek: 2, requiredPeople: 1, taskTitles: ['เวรทั่วไป'] }, // Tue
    { dayOfWeek: 3, requiredPeople: 1, taskTitles: ['เวรทั่วไป'] }, // Wed
    { dayOfWeek: 4, requiredPeople: 1, taskTitles: ['เวรทั่วไป'] }, // Thu
    { dayOfWeek: 5, requiredPeople: 2, taskTitles: ['เคลียร์ขยะ', 'ถูพื้น'] }, // Fri
];

const HISTORY_LOOKBACK_DAYS = 90;

export const useDuty = () => {
    const [duties, setDuties] = useState<Duty[]>([]);
    const [configs, setConfigs] = useState<DutyConfig[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { showToast } = useToast();

    // Fetch Duties from DB
    const fetchDuties = async () => {
        try {
            const { data, error } = await supabase
                .from('duties')
                .select('*')
                .order('date', { ascending: true });

            if (error) throw error;
            if (data) {
                setDuties(data.map((d: any) => ({
                    id: d.id,
                    title: d.title,
                    assigneeId: d.assignee_id,
                    date: new Date(d.date), // Local date parsing works if string is YYYY-MM-DD
                    isDone: d.is_done
                })));
            }
        } catch (err) {
            console.error('Fetch duties failed', err);
        }
    };

    // Fetch Configs from DB
    const fetchConfigs = async () => {
        try {
            const { data, error } = await supabase
                .from('duty_configs')
                .select('*')
                .order('day_of_week', { ascending: true });

            if (error) throw error;
            if (data && data.length > 0) {
                setConfigs(data.map((c: any) => ({
                    dayOfWeek: c.day_of_week,
                    requiredPeople: c.required_people,
                    taskTitles: c.task_titles
                })));
            } else {
                setConfigs(DEFAULT_CONFIGS);
            }
        } catch (err) {
            console.error('Fetch duty configs failed', err);
        }
    };

    // Initialize & Realtime
    useEffect(() => {
        fetchDuties();
        fetchConfigs();

        const dutyChannel = supabase
            .channel('realtime-duties')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'duties' }, () => fetchDuties())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'duty_configs' }, () => fetchConfigs())
            .subscribe();

        return () => {
            supabase.removeChannel(dutyChannel);
        };
    }, []);

    const saveConfigs = async (newConfigs: DutyConfig[]) => {
        try {
            for (const config of newConfigs) {
                const { error } = await supabase
                    .from('duty_configs')
                    .upsert({
                        day_of_week: config.dayOfWeek,
                        required_people: config.requiredPeople,
                        task_titles: config.taskTitles
                    });
                if (error) throw error;
            }
            setConfigs(newConfigs);
            showToast('บันทึกการตั้งค่าเวรลงระบบแล้ว ☁️', 'success');
        } catch (err: any) {
            showToast('บันทึกกติกาไม่สำเร็จ: ' + err.message, 'error');
        }
    };

    const addDuty = async (title: string, assigneeId: string, date: Date) => {
        try {
            // Fix: Use local date string instead of UTC to prevent off-by-one error
            const dateStr = format(date, 'yyyy-MM-dd');
            
            const { error } = await supabase.from('duties').insert({
                title,
                assignee_id: assigneeId,
                date: dateStr,
                is_done: false
            });
            if (error) throw error;
            showToast('เพิ่มเวรลงฐานข้อมูลแล้ว', 'success');
        } catch (err: any) {
            showToast('เพิ่มไม่สำเร็จ: ' + err.message, 'error');
        }
    };

    const toggleDuty = async (id: string) => {
        const duty = duties.find(d => d.id === id);
        if (!duty) return;
        
        try {
            const { error } = await supabase
                .from('duties')
                .update({ is_done: !duty.isDone })
                .eq('id', id);
            if (error) throw error;
        } catch (err) {
            console.error('Toggle duty failed', err);
        }
    };

    const deleteDuty = async (id: string) => {
        try {
            const { error } = await supabase.from('duties').delete().eq('id', id);
            if (error) throw error;
            showToast('ลบเวรออกแล้ว', 'info');
        } catch (err: any) {
            showToast('ลบไม่สำเร็จ: ' + err.message, 'error');
        }
    };

    const cleanupOldDuties = async () => {
        const cutoffDate = format(addDays(new Date(), -(HISTORY_LOOKBACK_DAYS * 2)), 'yyyy-MM-dd');
        try {
            const { error } = await supabase
                .from('duties')
                .delete()
                .lt('date', cutoffDate);
            if (error) throw error;
            showToast(`ล้างข้อมูลเก่าเรียบร้อย`, 'success');
        } catch (err: any) {
            showToast('ล้างข้อมูลล้มเหลว: ' + err.message, 'error');
        }
    };

    // --- REVISED RANDOMIZER LOGIC (Queue/Rotation System) ---
    // Updated to accept 'mode' and conditional 'weeksToGenerate'
    const generateRandomDuties = async (startDate: Date, mode: 'ROTATION' | 'DURATION', weeksToGenerate: number, activeUsers: User[]) => {
        if (activeUsers.length === 0) {
            showToast('ไม่พบสมาชิกที่ Active เลยครับ', 'error');
            return [];
        }

        // 1. Prepare User Queue
        // Fisher-Yates Shuffle
        const shuffle = (array: User[]) => {
            let currentIndex = array.length, randomIndex;
            const newArray = [...array];
            while (currentIndex !== 0) {
                randomIndex = Math.floor(Math.random() * currentIndex);
                currentIndex--;
                [newArray[currentIndex], newArray[randomIndex]] = [newArray[randomIndex], newArray[currentIndex]];
            }
            return newArray;
        };

        // Initial Queue
        let userQueue = shuffle(activeUsers); 
        
        // Tracking for ROTATION mode
        const assignedUserIds = new Set<string>();
        
        // Helper to get next N users (refilling queue if needed)
        const getNextUsers = (count: number): User[] => {
            const selected: User[] = [];
            for (let i = 0; i < count; i++) {
                if (userQueue.length === 0) {
                    // Refill and Reshuffle when empty to ensure rotation continues fairly
                    userQueue = shuffle(activeUsers);
                    
                    // Optional: Try to avoid repeating the last user immediately if possible
                    if (activeUsers.length > 1 && userQueue[0].id === selected[selected.length - 1]?.id) {
                         userQueue.push(userQueue.shift()!); // Move front to back
                    }
                }
                const user = userQueue.shift()!;
                selected.push(user);
                assignedUserIds.add(user.id);
            }
            return selected;
        };

        // 2. Generate Days (Skip Weekends)
        const newDutiesPayload: any[] = [];
        let currentGenDate = new Date(startDate);
        let daysGenerated = 0;
        
        // Loop Condition Variable
        const targetDaysForDuration = weeksToGenerate * 5; // Used only if DURATION mode

        // Loop until requirement met
        while (true) {
            // STOP CONDITIONS
            if (mode === 'DURATION') {
                if (daysGenerated >= targetDaysForDuration) break;
            } else if (mode === 'ROTATION') {
                // Stop when everyone has been assigned at least once
                // AND we finish the current day's requirement (implicit in logic)
                if (assignedUserIds.size >= activeUsers.length) break;
                // Safety break to prevent infinite loops if config is weird
                if (daysGenerated > activeUsers.length * 5) break; 
            }

            // Skip weekends
            if (!isWeekend(currentGenDate)) {
                const dayNum = getDay(currentGenDate);
                const config = configs.find(c => c.dayOfWeek === dayNum) || { 
                    dayOfWeek: dayNum, requiredPeople: 1, taskTitles: ['เวรทั่วไป'] 
                };

                const peopleNeeded = config.requiredPeople;
                const assignedUsers = getNextUsers(peopleNeeded);

                assignedUsers.forEach((user, idx) => {
                    // Enhanced Title Logic
                    let title = config.taskTitles[idx];
                    if (!title || title.trim() === '') {
                        title = config.taskTitles[0] || 'เวรประจำวัน';
                        if (peopleNeeded > 1) title += ` (${idx + 1})`;
                    }
                    
                    newDutiesPayload.push({
                        title,
                        assignee_id: user.id,
                        date: format(currentGenDate, 'yyyy-MM-dd'),
                        is_done: false
                    });
                });
                
                daysGenerated++;
            }
            // Move to next day
            currentGenDate = addDays(currentGenDate, 1);
        }

        try {
            // 3. Clear Existing Duties in the Generated Range
            // Determine range for deletion
            const endGenDate = addDays(currentGenDate, -1); // Last generated day
            
            const startStr = format(startDate, 'yyyy-MM-dd');
            const endStr = format(endGenDate, 'yyyy-MM-dd');

            // Delete overlapping
            const { error: deleteError } = await supabase.from('duties')
                .delete()
                .gte('date', startStr)
                .lte('date', endStr);
            
            if (deleteError) throw deleteError;
            
            // 4. Insert New
            const { data, error } = await supabase.from('duties').insert(newDutiesPayload).select();
            if (error) throw error;
            
            if (mode === 'ROTATION') {
                showToast(`จัดเวรให้ครบทุกคนแล้ว! (รวม ${daysGenerated} วันทำการ) 🎉`, 'success');
            } else {
                showToast(`จัดเวร ${weeksToGenerate} สัปดาห์เรียบร้อย 🎉`, 'success');
            }
            
            return data.map((d: any) => ({
                id: d.id,
                title: d.title,
                assigneeId: d.assignee_id,
                date: new Date(d.date),
                isDone: d.is_done
            }));
        } catch (err: any) {
            showToast('จัดเวรล้มเหลว: ' + err.message, 'error');
            return [];
        }
    };

    return {
        duties,
        configs,
        isLoading,
        saveConfigs,
        addDuty,
        toggleDuty,
        deleteDuty,
        generateRandomDuties,
        cleanupOldDuties
    };
};
