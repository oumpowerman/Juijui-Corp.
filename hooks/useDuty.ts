
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Duty, User, DutyConfig, DutySwap } from '../types';
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

export const useDuty = (currentUser?: User) => {
    const [duties, setDuties] = useState<Duty[]>([]);
    const [configs, setConfigs] = useState<DutyConfig[]>([]);
    const [swapRequests, setSwapRequests] = useState<DutySwap[]>([]);
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

    // Fetch Swap Requests
    const fetchSwapRequests = async () => {
        try {
            const { data, error } = await supabase
                .from('duty_swaps')
                .select(`
                    *,
                    requestor:profiles!duty_swaps_requestor_id_fkey(full_name, avatar_url),
                    target_duty:duties!duty_swaps_target_duty_id_fkey(title, date, assignee_id),
                    own_duty:duties!duty_swaps_own_duty_id_fkey(title, date, assignee_id)
                `)
                .eq('status', 'PENDING')
                .order('created_at', { ascending: false });

            if (error) throw error;
            if (data) {
                const mappedSwaps: DutySwap[] = data.map((s: any) => ({
                    id: s.id,
                    requestorId: s.requestor_id,
                    targetDutyId: s.target_duty_id,
                    ownDutyId: s.own_duty_id,
                    status: s.status,
                    createdAt: new Date(s.created_at),
                    requestor: s.requestor ? { name: s.requestor.full_name, avatarUrl: s.requestor.avatar_url } : undefined,
                    targetDuty: s.target_duty,
                    ownDuty: s.own_duty
                }));
                setSwapRequests(mappedSwaps);
            }
        } catch (err) {
            console.error('Fetch swaps failed', err);
        }
    };

    // Initialize & Realtime
    useEffect(() => {
        fetchDuties();
        fetchConfigs();
        fetchSwapRequests();

        const dutyChannel = supabase
            .channel('realtime-duties')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'duties' }, () => fetchDuties())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'duty_configs' }, () => fetchConfigs())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'duty_swaps' }, () => fetchSwapRequests())
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
        
        const newStatus = !duty.isDone;

        // 1. Optimistic Update (Immediate UI Change)
        setDuties(prev => prev.map(d => d.id === id ? { ...d, isDone: newStatus } : d));
        
        try {
            const { error } = await supabase
                .from('duties')
                .update({ is_done: newStatus })
                .eq('id', id);
            
            if (error) throw error;
            
            // Note: Realtime subscription will re-sync eventually, but UI is already updated.
            
        } catch (err: any) {
            console.error('Toggle duty failed', err);
            // 2. Rollback on Error
            setDuties(prev => prev.map(d => d.id === id ? { ...d, isDone: !newStatus } : d));
            showToast('อัปเดตสถานะไม่สำเร็จ: ' + err.message, 'error');
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

    const submitProof = async (dutyId: string, file: File, userName: string) => {
        try {
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

            const { error: dbError } = await supabase
                .from('duties')
                .update({ 
                    is_done: true,
                    proof_image_url: imageUrl
                })
                .eq('id', dutyId);

            if (dbError) throw dbError;

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

                if (duty.assigneeId) {
                    processAction(duty.assigneeId, 'DUTY_COMPLETE', duty);
                }
            }

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

    // --- REVISED: Generate Draft (Pure Logic) ---
    const calculateRandomDuties = (startDate: Date, mode: 'ROTATION' | 'DURATION', weeksToGenerate: number, activeUsers: User[]) => {
        if (activeUsers.length === 0) return [];

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

        const draftDuties: Duty[] = [];
        let currentGenDate = new Date(startDate);
        let daysGenerated = 0;
        const targetDaysForDuration = weeksToGenerate * 5; 

        while (true) {
            if (mode === 'DURATION') {
                if (daysGenerated >= targetDaysForDuration) break;
            } else if (mode === 'ROTATION') {
                if (assignedUserIds.size >= activeUsers.length && daysGenerated % 5 === 0) break; // Complete cycle + full weeks
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
                    
                    draftDuties.push({
                        id: crypto.randomUUID(), // Temp ID for draft
                        title,
                        assigneeId: user.id,
                        date: new Date(currentGenDate),
                        isDone: false
                    });
                });
                
                daysGenerated++;
            }
            currentGenDate = addDays(currentGenDate, 1);
        }
        return draftDuties;
    };

    // --- NEW: Save Draft Duties (Commit) ---
    const saveDuties = async (newDuties: Duty[]) => {
        try {
            if (newDuties.length === 0) return;
            
            // Determine range to clear old duties
            const dates = newDuties.map(d => d.date.getTime());
            const minDate = new Date(Math.min(...dates));
            const maxDate = new Date(Math.max(...dates));
            
            const startStr = format(minDate, 'yyyy-MM-dd');
            const endStr = format(maxDate, 'yyyy-MM-dd');

            // 1. Clear overlapping duties
            const { error: deleteError } = await supabase.from('duties')
                .delete()
                .gte('date', startStr)
                .lte('date', endStr);
            
            if (deleteError) throw deleteError;
            
            // 2. Insert new ones
            const payload = newDuties.map(d => ({
                title: d.title,
                assignee_id: d.assigneeId,
                date: format(d.date, 'yyyy-MM-dd'),
                is_done: d.isDone
            }));

            const { error } = await supabase.from('duties').insert(payload);
            if (error) throw error;
            
            showToast('บันทึกตารางเวรเรียบร้อย 🎉', 'success');
        } catch (err: any) {
            showToast('บันทึกไม่สำเร็จ: ' + err.message, 'error');
        }
    };

    // --- SWAP LOGIC ---
    const requestSwap = async (ownDutyId: string, targetDutyId: string) => {
        if (!currentUser) return;
        try {
            const { error } = await supabase.from('duty_swaps').insert({
                requestor_id: currentUser.id,
                own_duty_id: ownDutyId,
                target_duty_id: targetDutyId,
                status: 'PENDING'
            });
            if (error) throw error;
            showToast('ส่งคำขอแลกเวรแล้ว รออีกฝั่งตอบรับนะครับ 🔄', 'success');
        } catch (err: any) {
            showToast('ส่งคำขอไม่สำเร็จ: ' + err.message, 'error');
        }
    };

    const respondSwap = async (swapId: string, accept: boolean) => {
        try {
            if (!accept) {
                await supabase.from('duty_swaps').update({ status: 'REJECTED' }).eq('id', swapId);
                showToast('ปฏิเสธการแลกเวรแล้ว', 'info');
                return;
            }

            // Transaction: Swap Assignees
            const { data: swap } = await supabase.from('duty_swaps').select('own_duty_id, target_duty_id').eq('id', swapId).single();
            if (!swap) return;

            // Get current assignees
            const { data: dutiesData } = await supabase.from('duties').select('id, assignee_id').in('id', [swap.own_duty_id, swap.target_duty_id]);
            if (!dutiesData || dutiesData.length !== 2) return;

            const duty1 = dutiesData[0];
            const duty2 = dutiesData[1];

            // Perform Swap
            await supabase.from('duties').update({ assignee_id: duty2.assignee_id }).eq('id', duty1.id);
            await supabase.from('duties').update({ assignee_id: duty1.assignee_id }).eq('id', duty2.id);

            // Update Swap Status
            await supabase.from('duty_swaps').update({ status: 'APPROVED' }).eq('id', swapId);
            
            showToast('แลกเวรสำเร็จ! อัปเดตตารางแล้ว ✅', 'success');
            
        } catch (err: any) {
            showToast('เกิดข้อผิดพลาด: ' + err.message, 'error');
        }
    };

    return {
        duties,
        configs,
        swapRequests,
        isLoading,
        saveConfigs,
        addDuty,
        toggleDuty,
        deleteDuty,
        calculateRandomDuties,
        saveDuties,
        cleanupOldDuties,
        submitProof,
        requestSwap,
        respondSwap
    };
};
