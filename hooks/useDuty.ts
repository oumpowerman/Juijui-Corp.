
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Duty, User, DutyConfig } from '../types';
import { useToast } from '../context/ToastContext';
import { addDays, isWeekend, isSameDay, getDay, isBefore } from 'date-fns';

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
                    date: new Date(d.date),
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
            const { error } = await supabase.from('duties').insert({
                title,
                assignee_id: assigneeId,
                date: date.toISOString().split('T')[0],
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
        const cutoffDate = addDays(new Date(), -(HISTORY_LOOKBACK_DAYS * 2)).toISOString().split('T')[0];
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

    const generateRandomDuties = async (weekStart: Date, activeUsers: User[]) => {
        if (activeUsers.length === 0) {
            showToast('ไม่พบสมาชิกที่ Active เลยครับ', 'error');
            return [];
        }

        const workingDays: Date[] = [];
        for (let i = 0; i < 7; i++) {
            const currentDay = addDays(weekStart, i);
            if (!isWeekend(currentDay)) {
                workingDays.push(currentDay);
            }
        }

        if (workingDays.length === 0) return [];

        // 1. Build Priority Queue
        const lastDutyMap = new Map<string, number>();
        activeUsers.forEach(u => lastDutyMap.set(u.id, 0));

        const lookbackDate = addDays(new Date(), -HISTORY_LOOKBACK_DAYS);
        duties.forEach(d => {
            if (lastDutyMap.has(d.assigneeId) && !isBefore(new Date(d.date), lookbackDate)) {
                const dTime = new Date(d.date).getTime();
                const currentLast = lastDutyMap.get(d.assigneeId) || 0;
                if (dTime > currentLast) {
                    lastDutyMap.set(d.assigneeId, dTime);
                }
            }
        });

        let userDeck = [...activeUsers].sort((a, b) => {
            const timeA = lastDutyMap.get(a.id) || 0;
            const timeB = lastDutyMap.get(b.id) || 0;
            if (timeA === timeB) return Math.random() - 0.5;
            return timeA - timeB;
        });

        const drawUsers = (count: number): User[] => {
            const selected: User[] = [];
            for (let k = 0; k < count; k++) {
                if (userDeck.length === 0) {
                    userDeck = [...activeUsers].sort(() => Math.random() - 0.5);
                }
                selected.push(userDeck.shift()!);
            }
            return selected;
        };

        const newDutiesPayload: any[] = [];
        workingDays.forEach(day => {
            const dayNum = getDay(day);
            const config = configs.find(c => c.dayOfWeek === dayNum) || { 
                dayOfWeek: dayNum, requiredPeople: 1, taskTitles: ['เวรทั่วไป'] 
            };

            const peopleNeeded = config.requiredPeople;
            const assignedUsers = drawUsers(peopleNeeded);

            assignedUsers.forEach((user, idx) => {
                const title = config.taskTitles[idx] || config.taskTitles[0] || 'เวรประจำวัน';
                newDutiesPayload.push({
                    title,
                    assignee_id: user.id,
                    date: day.toISOString().split('T')[0],
                    is_done: false
                });
            });
        });

        try {
            // Clear current week first
            const dayStrings = workingDays.map(d => d.toISOString().split('T')[0]);
            await supabase.from('duties').delete().in('date', dayStrings);
            
            // Insert new
            const { data, error } = await supabase.from('duties').insert(newDutiesPayload).select();
            if (error) throw error;
            
            showToast('สุ่มและบันทึกตารางเวรใหม่เรียบร้อย 🎉', 'success');
            return data.map((d: any) => ({
                id: d.id,
                title: d.title,
                assigneeId: d.assignee_id,
                date: new Date(d.date),
                isDone: d.is_done
            }));
        } catch (err: any) {
            showToast('สุ่มล้มเหลว: ' + err.message, 'error');
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
