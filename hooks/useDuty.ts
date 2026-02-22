
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Duty, User, DutyConfig, DutySwap, AnnualHoliday } from '../types';
import { useToast } from '../context/ToastContext';
import { addDays, isWeekend, getDay, format } from 'date-fns';
import { useGamification } from './useGamification'; // Import Engine
import { useGameConfig } from '../context/GameConfigContext';

const DEFAULT_CONFIGS: DutyConfig[] = [
    { dayOfWeek: 1, requiredPeople: 1, taskTitles: ['เวรทั่วไป'] }, 
    { dayOfWeek: 2, requiredPeople: 1, taskTitles: ['เวรทั่วไป'] }, 
    { dayOfWeek: 3, requiredPeople: 1, taskTitles: ['เวรทั่วไป'] }, 
    { dayOfWeek: 4, requiredPeople: 1, taskTitles: ['เวรทั่วไป'] }, 
    { dayOfWeek: 5, requiredPeople: 2, taskTitles: ['เคลียร์ขยะ', 'ถูพื้น'] }, 
];

// Removed constant HISTORY_LOOKBACK_DAYS, used from config instead

export const useDuty = (currentUser?: User) => {
    const [duties, setDuties] = useState<Duty[]>([]);
    const [configs, setConfigs] = useState<DutyConfig[]>([]);
    const [swapRequests, setSwapRequests] = useState<DutySwap[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { showToast } = useToast();
    const { processAction } = useGamification(); // Initialize Engine
    const { config } = useGameConfig(); // NEW: Get config for cleanup

    // --- Calendar Context States ---
    const [annualHolidays, setAnnualHolidays] = useState<AnnualHoliday[]>([]);
    const [calendarExceptions, setCalendarExceptions] = useState<any[]>([]);

    const fetchCalendarMetadata = async () => {
        try {
            const [hRes, eRes] = await Promise.all([
                supabase.from('annual_holidays').select('*').eq('is_active', true),
                supabase.from('calendar_exceptions').select('*')
            ]);
            if (hRes.data) setAnnualHolidays(hRes.data.map((h: any) => ({
                id: h.id, name: h.name, day: h.day, month: h.month, typeKey: h.type_key, isActive: h.is_active
            })));
            if (eRes.data) setCalendarExceptions(eRes.data);
        } catch (err) {
            console.error("Failed to fetch calendar metadata for Duty", err);
        }
    };

    const isDayWorking = (date: Date): boolean => {
        const dateStr = format(date, 'yyyy-MM-dd');
        
        // 1. Check Exceptions (Highest Priority)
        const exception = calendarExceptions.find(e => e.date === dateStr);
        if (exception) return exception.type === 'WORK_DAY';

        // 2. Check Annual Holidays
        const isAnnual = annualHolidays.some(h => h.day === date.getDate() && h.month === (date.getMonth() + 1));
        if (isAnnual) return false;

        // 3. Default Weekend Check
        return !isWeekend(date);
    };

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
                    proofImageUrl: d.proof_image_url,
                    isPenalized: d.is_penalized,
                    penaltyStatus: d.penalty_status,
                    appealReason: d.appeal_reason,
                    appealProofUrl: d.appeal_proof_url,
                    abandonedAt: d.abandoned_at ? new Date(d.abandoned_at) : undefined,
                    clearedBySystem: d.cleared_by_system || false
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
        fetchCalendarMetadata();

        const dutyChannel = supabase
            .channel('realtime-duties')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'duties' }, () => fetchDuties())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'duty_configs' }, () => fetchConfigs())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'duty_swaps' }, () => fetchSwapRequests())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'calendar_exceptions' }, () => fetchCalendarMetadata())
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

    const submitProof = async (
        dutyId: string, 
        file: File, 
        userName: string,
        externalUploadFn?: (file: File) => Promise<string | null>
    ) => {
        try {
            let imageUrl = null;

            // 1. Try External Upload (Google Drive) First
            if (externalUploadFn) {
                try {
                    // This function should already return the viewable link
                    imageUrl = await externalUploadFn(file);
                } catch (extErr) {
                    console.warn("External upload failed, falling back to Supabase", extErr);
                    // Fallthrough to Supabase
                }
            }

            // 2. Fallback to Supabase Storage if no external URL
            if (!imageUrl) {
                const fileExt = file.name.split('.').pop();
                const fileName = `duty-proof-${dutyId}-${Date.now()}.${fileExt}`;
                
                const { error: uploadError } = await supabase.storage
                    .from('chat-files') 
                    .upload(fileName, file);

                if (uploadError) throw uploadError;

                const { data: urlData } = supabase.storage
                    .from('chat-files')
                    .getPublicUrl(fileName);
                
                imageUrl = urlData.publicUrl;
            }

            if (!imageUrl) throw new Error("Could not upload image to any storage provider.");

            // 3. Update Duty Record
            const { error: dbError } = await supabase
                .from('duties')
                .update({ 
                    is_done: true,
                    proof_image_url: imageUrl
                })
                .eq('id', dutyId);

            if (dbError) throw dbError;

            // 4. Send Message to Chat
            const duty = duties.find(d => d.id === dutyId);
            if (duty) {
                const isAssist = currentUser && currentUser.id !== duty.assigneeId;
                const message = isAssist 
                    ? `🦸‍♂️ **${userName}** เป็นฮีโร่! ช่วยทำเวรแทนเจ้าของเวร "${duty.title}" เรียบร้อย!` : `📸 **${userName}** ส่งการบ้านเวร "${duty.title}" เรียบร้อย! \n(Proof: ${format(new Date(), 'HH:mm')})`;
                
                await supabase.from('team_messages').insert({
                    content: message,
                    is_bot: true, 
                    message_type: 'TEXT', 
                    user_id: null
                });
                
                await supabase.from('team_messages').insert({
                    content: imageUrl,
                    is_bot: true,
                    message_type: 'IMAGE',
                    user_id: null
                });

                if (isAssist && currentUser) {
                    processAction(currentUser.id, 'DUTY_ASSIST', { ...duty, targetName: 'เพื่อนร่วมทีม' });
                } else if (duty.assigneeId) {
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

    const submitAppeal = async (
        dutyId: string,
        reason: string,
        file?: File,
        userName?: string,
        externalUploadFn?: (file: File) => Promise<string | null>
    ) => {
        try {
            let proofUrl = null;
            if (file) {
                 if (externalUploadFn) {
                     proofUrl = await externalUploadFn(file);
                 }
                 if (!proofUrl) {
                    const fileExt = file.name.split('.').pop();
                    const fileName = `duty-appeal-${dutyId}-${Date.now()}.${fileExt}`;
                    const { error: uploadError } = await supabase.storage.from('chat-files').upload(fileName, file);
                    if (!uploadError) {
                         const { data } = supabase.storage.from('chat-files').getPublicUrl(fileName);
                         proofUrl = data.publicUrl;
                    }
                 }
            }

            const { error } = await supabase
                .from('duties')
                .update({ 
                    penalty_status: 'UNDER_REVIEW',
                    appeal_reason: reason,
                    appeal_proof_url: proofUrl
                })
                .eq('id', dutyId);

            if (error) throw error;
            
            // Notify Admin
            const duty = duties.find(d => d.id === dutyId);
            if (duty) {
                 const message = `🙏 **${userName || 'User'}** ส่งคำร้องอุทธรณ์เวร "${duty.title}" \n📝 เหตุผล: "${reason}"`;
                 await supabase.from('team_messages').insert({
                    content: message,
                    is_bot: true, 
                    message_type: 'TEXT', 
                    user_id: null
                });
            }

            showToast('ส่งคำร้องแล้ว รอ Admin ตรวจสอบครับ', 'success');
            return true;
        } catch (err: any) {
             console.error(err);
             showToast('ส่งคำร้องไม่สำเร็จ: ' + err.message, 'error');
             return false;
        }
    };

    const cleanupOldDuties = async () => {
        // Use Dynamic Config or Default
        const cleanupDays = config?.SYSTEM_MAINTENANCE?.duty_cleanup_days || 90;
        const cutoffDate = format(addDays(new Date(), -cleanupDays), 'yyyy-MM-dd');
        
        try {
            const { error } = await supabase
                .from('duties')
                .delete()
                .lt('date', cutoffDate);
            if (error) throw error;
            showToast(`ล้างข้อมูลเก่ากว่า ${cleanupDays} วันเรียบร้อย`, 'success');
        } catch (err: any) {
            showToast('ล้างข้อมูลล้มเหลว: ' + err.message, 'error');
        }
    };

    const calculateRandomDuties = async (startDate: Date, mode: 'ROTATION' | 'DURATION', weeksToGenerate: number, activeUsers: User[]) => {
        if (activeUsers.length === 0) return [];

        // Fetch leaves for the generation period to avoid assigning to people on leave
        const endDate = addDays(startDate, weeksToGenerate * 7);
        const { data: leaves } = await supabase
            .from('leave_requests')
            .select('user_id, start_date, end_date')
            .eq('status', 'APPROVED')
            .gte('end_date', format(startDate, 'yyyy-MM-dd'))
            .lte('start_date', format(endDate, 'yyyy-MM-dd'));

        const isUserOnLeaveOnDate = (userId: string, date: Date) => {
            if (!leaves) return false;
            const d = format(date, 'yyyy-MM-dd');
            return leaves.some(l => l.user_id === userId && d >= l.start_date && d <= l.end_date);
        };

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
        
        const getNextUsers = (count: number, date: Date): User[] => {
            const selected: User[] = [];
            let attempts = 0;
            const maxAttempts = userQueue.length * 2;

            while (selected.length < count && attempts < maxAttempts) {
                attempts++;
                if (userQueue.length === 0) {
                    userQueue = shuffle(activeUsers);
                }
                
                const user = userQueue[0];
                // Check if user is on leave
                if (isUserOnLeaveOnDate(user.id, date)) {
                    // Move to back of queue and try next
                    userQueue.push(userQueue.shift()!);
                    continue;
                }

                selected.push(userQueue.shift()!);
                assignedUserIds.add(user.id);
            }

            // Fallback if everyone is on leave (rare)
            if (selected.length < count) {
                const remainingNeeded = count - selected.length;
                for (let i = 0; i < remainingNeeded; i++) {
                    if (userQueue.length === 0) userQueue = shuffle(activeUsers);
                    const user = userQueue.shift()!;
                    selected.push(user);
                    assignedUserIds.add(user.id);
                }
            }
            return selected;
        };

        const draftDuties: Duty[] = [];
        let currentGenDate = new Date(startDate);
        let daysGenerated = 0;
        
        // Target is based on WORK DAYS, not calendar days
        const targetWorkDays = weeksToGenerate * 5; 

        while (true) {
            if (mode === 'DURATION') {
                if (daysGenerated >= targetWorkDays) break;
            } else if (mode === 'ROTATION') {
                if (assignedUserIds.size >= activeUsers.length && daysGenerated % 5 === 0) break;
                if (daysGenerated > activeUsers.length * 5) break; 
            }
            
            // Safety break to prevent infinite loops if misconfigured
            if (daysGenerated > 60) break; 

            // --- KEY CHANGE: Check if this is a working day ---
            if (isDayWorking(currentGenDate)) {
                // Determine day of week to get config (0=Sun, 1=Mon...6=Sat)
                let dayNum = getDay(currentGenDate);
                
                // If it's a weekend (Special workday), use Friday's config or default
                if (dayNum === 0 || dayNum === 6) dayNum = 5; 

                const config = configs.find(c => c.dayOfWeek === dayNum) || { 
                    dayOfWeek: dayNum, requiredPeople: 1, taskTitles: ['เวรประจำวัน'] 
                };

                const peopleNeeded = config.requiredPeople;
                const assignedUsers = getNextUsers(peopleNeeded, currentGenDate);

                assignedUsers.forEach((user, idx) => {
                    let title = config.taskTitles[idx];
                    if (!title || title.trim() === '') {
                        title = config.taskTitles[0] || 'เวรประจำวัน';
                        if (peopleNeeded > 1) title += ` (${idx + 1})`;
                    }
                    
                    draftDuties.push({
                        id: crypto.randomUUID(),
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
            // 1. Validation
            const ownDuty = duties.find(d => d.id === ownDutyId);
            const targetDuty = duties.find(d => d.id === targetDutyId);

            if (!ownDuty || !targetDuty) throw new Error("ไม่พบข้อมูลเวร");
            if (ownDuty.isDone) throw new Error("เวรของคุณทำเสร็จแล้ว ไม่สามารถแลกได้");
            if (targetDuty.isDone) throw new Error("เวรเป้าหมายทำเสร็จแล้ว ไม่สามารถแลกได้");
            if (ownDuty.assigneeId === targetDuty.assigneeId) throw new Error("ไม่สามารถแลกเวรกับตัวเองได้");
            
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (new Date(ownDuty.date) < today) throw new Error("ไม่สามารถแลกเวรที่ผ่านมาแล้วได้");
            if (new Date(targetDuty.date) < today) throw new Error("ไม่สามารถแลกเวรเป้าหมายที่ผ่านมาแล้วได้");

            // 2. Insert Swap Request
            const { error } = await supabase.from('duty_swaps').insert({
                requestor_id: currentUser.id,
                own_duty_id: ownDutyId,
                target_duty_id: targetDutyId,
                status: 'PENDING'
            });
            if (error) throw error;

            // 3. Notify Target User
            await supabase.from('notifications').insert({
                user_id: targetDuty.assigneeId,
                type: 'APPROVAL_REQ',
                title: '🔄 มีคำขอแลกเวร',
                message: `คุณ ${currentUser.name} ขอแลกเวร "${ownDuty.title}" (${format(new Date(ownDuty.date), 'd MMM')}) กับเวรของคุณ`,
                is_read: false,
                link_path: 'DUTY'
            });

            showToast('ส่งคำขอแลกเวรแล้ว รออีกฝั่งตอบรับนะครับ 🔄', 'success');
        } catch (err: any) {
            showToast('ส่งคำขอไม่สำเร็จ: ' + err.message, 'error');
        }
    };

    const respondSwap = async (swapId: string, accept: boolean) => {
        try {
            // 1. Fetch Swap Details (Need requestor_id)
            const { data: swap } = await supabase.from('duty_swaps').select('own_duty_id, target_duty_id, requestor_id').eq('id', swapId).single();
            if (!swap) return;

            if (!accept) {
                await supabase.from('duty_swaps').update({ status: 'REJECTED' }).eq('id', swapId);
                
                // Notify Requestor of Rejection
                await supabase.from('notifications').insert({
                    user_id: swap.requestor_id,
                    type: 'INFO',
                    title: '❌ คำขอแลกเวรถูกปฏิเสธ',
                    message: 'เพื่อนไม่สะดวกแลกเวรในครั้งนี้',
                    is_read: false,
                    link_path: 'DUTY'
                });

                showToast('ปฏิเสธการแลกเวรแล้ว', 'info');
                return;
            }

            // 2. Fetch current assignees to swap
            const { data: dutiesData } = await supabase.from('duties').select('id, assignee_id').in('id', [swap.own_duty_id, swap.target_duty_id]);
            if (!dutiesData || dutiesData.length !== 2) return;

            const duty1 = dutiesData[0];
            const duty2 = dutiesData[1];

            // 3. Perform Swap
            await supabase.from('duties').update({ assignee_id: duty2.assignee_id }).eq('id', duty1.id);
            await supabase.from('duties').update({ assignee_id: duty1.assignee_id }).eq('id', duty2.id);

            // 4. Update Swap Status
            await supabase.from('duty_swaps').update({ status: 'APPROVED' }).eq('id', swapId);
            
            // 5. Notify Requestor of Success
            await supabase.from('notifications').insert({
                user_id: swap.requestor_id,
                type: 'INFO',
                title: '✅ คำขอแลกเวรสำเร็จ',
                message: 'เวรของคุณถูกสลับเรียบร้อยแล้ว',
                is_read: false,
                link_path: 'DUTY'
            });

            showToast('แลกเวรสำเร็จ! อัปเดตตารางแล้ว ✅', 'success');
            
        } catch (err: any) {
            showToast('เกิดข้อผิดพลาด: ' + err.message, 'error');
        }
    };

    const clearFutureDutiesForUser = async (userId: string) => {
        try {
            const todayStr = format(new Date(), 'yyyy-MM-dd');
            const { error } = await supabase
                .from('duties')
                .delete()
                .eq('assignee_id', userId)
                .gte('date', todayStr)
                .eq('is_done', false);
            
            if (error) throw error;
            showToast('เคลียร์ตารางเวรในอนาคตของพนักงานคนนี้เรียบร้อย', 'info');
        } catch (err: any) {
            showToast('เคลียร์ตารางเวรไม่สำเร็จ: ' + err.message, 'error');
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
        submitAppeal,
        requestSwap,
        respondSwap,
        clearFutureDutiesForUser,
        calendarMetadata: { annualHolidays, calendarExceptions }
    };
};
