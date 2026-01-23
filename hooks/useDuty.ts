
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Duty, User, DutyConfig } from '../types';
import { useToast } from '../context/ToastContext';
import { addDays, isWeekend, getDay, format } from 'date-fns';
import { useGamification } from './useGamification'; // Import Engine

const DEFAULT_CONFIGS: DutyConfig[] = [
    { dayOfWeek: 1, requiredPeople: 1, taskTitles: ['เวรทั่วไป'] }, 
    { dayOfWeek: 2, requiredPeople: 1, taskTitles: ['เวรทั่วไป'] }, 
    { dayOfWeek: 3, requiredPeople: 1, taskTitles: ['เวรทั่วไป'] }, 
    { dayOfWeek: 4, requiredPeople: 1, taskTitles: ['เวรทั่วไป'] }, 
    { dayOfWeek: 5, requiredPeople: 2, taskTitles: ['เคลียร์ขยะ', 'ถูพื้น'] }, 
];

const HISTORY_LOOKBACK_DAYS = 90;

export const useDuty = () => {
    const [duties, setDuties] = useState<Duty[]>([]);
    const [configs, setConfigs] = useState<DutyConfig[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { showToast } = useToast();
    const { processAction } = useGamification(); // Initialize Engine

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
                    isDone: d.is_done,
                    proofImageUrl: d.proof_image_url
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

    // --- New: Submit Proof Logic (With Auto-Chat & Gamification) ---
    const submitProof = async (dutyId: string, file: File, userName: string) => {
        try {
            // 1. Upload Image
            const fileExt = file.name.split('.').pop();
            const fileName = `duty-proof-${dutyId}-${Date.now()}.${fileExt}`;
            
            const { error: uploadError } = await supabase.storage
                .from('chat-files') 
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage
                .from('chat-files')
                .getPublicUrl(fileName);
            
            const imageUrl = urlData.publicUrl;

            // 2. Update Duty Record
            const { error: dbError } = await supabase
                .from('duties')
                .update({ 
                    is_done: true,
                    proof_image_url: imageUrl
                })
                .eq('id', dutyId);

            if (dbError) throw dbError;

            // 3. Auto-Post to Team Chat
            const duty = duties.find(d => d.id === dutyId);
            if (duty) {
                const message = `📸 **${userName}** ส่งการบ้านเวร "${duty.title}" เรียบร้อย! \n(Proof: ${format(new Date(), 'HH:mm')})`;
                await supabase.from('team_messages').insert({
                    content: message,
                    is_bot: true, 
                    message_type: 'IMAGE', 
                    user_id: null
                });
                
                await supabase.from('team_messages').insert({
                    content: imageUrl,
                    is_bot: true,
                    message_type: 'IMAGE',
                    user_id: null
                });

                // 4. Trigger Gamification
                // Need assignee ID. If it's the current user calling, we assume success.
                if (duty.assigneeId) {
                    processAction(duty.assigneeId, 'DUTY_COMPLETE', duty);
                }
            }

            // showToast('ส่งการบ้านเรียบร้อย! แจ้งในแชทให้แล้วครับ', 'success'); // Toast handled by game engine
            return true;
        } catch (err: any) {
            console.error(err);
            showToast('ส่งหลักฐานไม่สำเร็จ: ' + err.message, 'error');
            return false;
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
    const generateRandomDuties = async (startDate: Date, mode: 'ROTATION' | 'DURATION', weeksToGenerate: number, activeUsers: User[]) => {
        if (activeUsers.length === 0) {
            showToast('ไม่พบสมาชิกที่ Active เลยครับ', 'error');
            return [];
        }

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

        let userQueue = shuffle(activeUsers); 
        const assignedUserIds = new Set<string>();
        
        const getNextUsers = (count: number): User[] => {
            const selected: User[] = [];
            for (let i = 0; i < count; i++) {
                if (userQueue.length === 0) {
                    userQueue = shuffle(activeUsers);
                    if (activeUsers.length > 1 && userQueue[0].id === selected[selected.length - 1]?.id) {
                         userQueue.push(userQueue.shift()!); 
                    }
                }
                const user = userQueue.shift()!;
                selected.push(user);
                assignedUserIds.add(user.id);
            }
            return selected;
        };

        const newDutiesPayload: any[] = [];
        let currentGenDate = new Date(startDate);
        let daysGenerated = 0;
        const targetDaysForDuration = weeksToGenerate * 5; 

        while (true) {
            if (mode === 'DURATION') {
                if (daysGenerated >= targetDaysForDuration) break;
            } else if (mode === 'ROTATION') {
                if (assignedUserIds.size >= activeUsers.length) break;
                if (daysGenerated > activeUsers.length * 5) break; 
            }

            if (!isWeekend(currentGenDate)) {
                const dayNum = getDay(currentGenDate);
                const config = configs.find(c => c.dayOfWeek === dayNum) || { 
                    dayOfWeek: dayNum, requiredPeople: 1, taskTitles: ['เวรทั่วไป'] 
                };

                const peopleNeeded = config.requiredPeople;
                const assignedUsers = getNextUsers(peopleNeeded);

                assignedUsers.forEach((user, idx) => {
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
            currentGenDate = addDays(currentGenDate, 1);
        }

        try {
            const endGenDate = addDays(currentGenDate, -1); 
            const startStr = format(startDate, 'yyyy-MM-dd');
            const endStr = format(endGenDate, 'yyyy-MM-dd');

            const { error: deleteError } = await supabase.from('duties')
                .delete()
                .gte('date', startStr)
                .lte('date', endStr);
            
            if (deleteError) throw deleteError;
            
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
        cleanupOldDuties,
        submitProof
    };
};
