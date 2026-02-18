
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { LeaveRequest, LeaveType, LeaveUsage } from '../types/attendance';
import { useToast } from '../context/ToastContext';
import { eachDayOfInterval, format, differenceInDays } from 'date-fns';
import { useGamification } from './useGamification';

export const useLeaveRequests = (currentUser?: any) => {
    const [requests, setRequests] = useState<LeaveRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { showToast } = useToast();
    const { processAction } = useGamification(); 

    const fetchRequests = async () => {
        if (requests.length === 0) setIsLoading(true);
        try {
            let query = supabase
                .from('leave_requests')
                .select(`
                    *,
                    profiles:profiles!leave_requests_user_id_fkey (id, full_name, avatar_url, position)
                `)
                .order('created_at', { ascending: false });
            
            const { data, error } = await query;

            if (error) throw error;

            if (data) {
                setRequests(data.map((r: any) => ({
                    id: r.id,
                    userId: r.user_id,
                    type: r.type,
                    startDate: new Date(r.start_date),
                    endDate: new Date(r.end_date),
                    reason: r.reason,
                    attachmentUrl: r.attachment_url,
                    status: r.status,
                    approverId: r.approver_id,
                    createdAt: new Date(r.created_at),
                    rejectionReason: r.rejection_reason,
                    user: r.profiles ? {
                        id: r.profiles.id,
                        name: r.profiles.full_name,
                        avatarUrl: r.profiles.avatar_url,
                        position: r.profiles.position
                    } : undefined
                } as LeaveRequest)));
            }
        } catch (err: any) {
            console.error("Fetch leaves failed", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
        const channel = supabase.channel('leave_requests_realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'leave_requests' }, () => fetchRequests())
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, []);

    const leaveUsage: LeaveUsage = useMemo(() => {
        const usage: LeaveUsage = {
            SICK: 0, VACATION: 0, PERSONAL: 0, EMERGENCY: 0,
            LATE_ENTRY: 0, OVERTIME: 0, FORGOT_CHECKIN: 0, FORGOT_CHECKOUT: 0, WFH: 0
        };

        if (!currentUser) return usage;

        requests.forEach(req => {
            if (req.userId === currentUser.id && req.status === 'APPROVED') {
                if (['SICK', 'VACATION', 'PERSONAL', 'EMERGENCY', 'WFH'].includes(req.type)) {
                    const days = differenceInDays(new Date(req.endDate), new Date(req.startDate)) + 1;
                    usage[req.type] += days;
                } else {
                    usage[req.type] += 1;
                }
            }
        });

        return usage;
    }, [requests, currentUser?.id]);

    const submitRequest = async (
        type: LeaveType, 
        startDate: Date, 
        endDate: Date, 
        reason: string, 
        file?: File
    ): Promise<boolean> => {
        if (!currentUser) return false;
        try {
            const startDateStr = format(startDate, 'yyyy-MM-dd');
            const { data: existingRequest } = await supabase
                .from('leave_requests')
                .select('id, status')
                .eq('user_id', currentUser.id)
                .eq('type', type)
                .eq('start_date', startDateStr)
                .in('status', ['PENDING', 'APPROVED']) 
                .maybeSingle();

            if (existingRequest) {
                if (existingRequest.status === 'PENDING') {
                    showToast('คำขอนี้ส่งไปแล้ว รออนุมัติครับ ⏳', 'warning');
                } else {
                    showToast('คำขอนี้อนุมัติแล้วครับ ✅', 'info');
                }
                return false; 
            }

            let attachmentUrl = null;
            if (file) {
                const fileExt = file.name.split('.').pop();
                const fileName = `leave-${currentUser.id}-${Date.now()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage.from('chat-files').upload(`proofs/${fileName}`, file);
                if (uploadError) throw uploadError;
                const { data } = supabase.storage.from('chat-files').getPublicUrl(`proofs/${fileName}`);
                attachmentUrl = data.publicUrl;
            }

            const payload = {
                user_id: currentUser.id,
                type,
                start_date: startDateStr,
                end_date: format(endDate, 'yyyy-MM-dd'),
                reason,
                attachment_url: attachmentUrl,
                status: 'PENDING'
            };

            const { error } = await supabase.from('leave_requests').insert(payload);
            if (error) throw error;

            if (type === 'FORGOT_CHECKOUT') {
                await supabase.from('attendance_logs').update({ status: 'PENDING_VERIFY' }).eq('user_id', currentUser.id).eq('date', startDateStr);
            }

            const msg = `📢 **${currentUser.name}** ส่งคำขอ (${type}) \n📅 ${format(startDate, 'd MMM')} \n📝: ${reason}`;
            await supabase.from('team_messages').insert({
                content: msg,
                is_bot: true,
                message_type: 'TEXT',
                user_id: null
            });

            showToast('ส่งคำขอเรียบร้อย รออนุมัติครับ 📨', 'success');
            fetchRequests();
            return true;
        } catch (err: any) {
            showToast('ส่งคำขอไม่สำเร็จ: ' + err.message, 'error');
            return false;
        }
    };

    const approveRequest = async (request: LeaveRequest) => {
        setRequests(prev => prev.map(r => r.id === request.id ? { ...r, status: 'APPROVED' } : r));

        try {
            const { error: updateError } = await supabase
                .from('leave_requests')
                .update({ status: 'APPROVED', approver_id: currentUser.id })
                .eq('id', request.id);
            
            if (updateError) throw updateError;

            // --- 1. NOTIFY USER (NEW DETAILED MSG) ---
            const dateDisplay = format(request.startDate, 'd MMM yyyy');
            const fullDateDisplay = request.startDate.getTime() === request.endDate.getTime() 
                ? dateDisplay 
                : `${dateDisplay} - ${format(request.endDate, 'd MMM yyyy')}`;

            await supabase.from('notifications').insert({
                user_id: request.userId,
                type: 'INFO',
                title: '✅ คำขอได้รับการอนุมัติ',
                message: `รายการ: ${request.type}\nวันที่: ${fullDateDisplay}\nรายละเอียด: ${request.reason || '-'}`,
                is_read: false,
                link_path: 'ATTENDANCE'
            });

            // --- SPECIAL LOGIC FOR WFH ---
            // WFH is a "Permission", NOT a "Leave Log". 
            // We DO NOT insert into attendance_logs here. 
            // The user must still "Check In" manually on that day, but the system will allow WFH mode.
            if (request.type === 'WFH') {
                 await supabase.from('team_messages').insert({
                    content: `✅ คำขอ WFH ของ **${request.user?.name}** ได้รับการอนุมัติแล้ว (อย่าลืม Check-in นะ!)`,
                    is_bot: true,
                    message_type: 'TEXT',
                    user_id: null
                });
                
                showToast('อนุมัติ WFH แล้ว (พนักงานต้องกดเช็คอินเอง)', 'success');
                return; // STOP HERE
            }
            
            // --- IF APPROVING LATE ENTRY ---
            if (request.type === 'LATE_ENTRY') {
                // Find existing log if they already checked in (as [APPEAL_PENDING])
                const dateStr = format(request.startDate, 'yyyy-MM-dd');
                const { data: existingLog } = await supabase.from('attendance_logs')
                    .select('id, note')
                    .eq('user_id', request.userId)
                    .eq('date', dateStr)
                    .maybeSingle();

                if (existingLog) {
                    // Update note to remove [APPEAL_PENDING] and add [APPROVED]
                    const newNote = (existingLog.note || '').replace('[APPEAL_PENDING]', '[LATE APPROVED]').trim();
                    await supabase.from('attendance_logs').update({ note: newNote }).eq('id', existingLog.id);
                } else {
                     // If they haven't checked in yet (unlikely if flow is followed, but possible if approved pre-arrival)
                     // We don't create log, just let them check in later. 
                     // When they check in, they might check in normally.
                }
            }

            // --- Logic for Corrections (Forgot In/Out) ---
            if (request.type === 'FORGOT_CHECKIN' || request.type === 'FORGOT_CHECKOUT') {
                const timeMatch = request.reason.match(/\[TIME:(\d{2}:\d{2})\]/);
                const timeStr = timeMatch ? timeMatch[1] : '00:00';
                const shiftDateStr = format(request.startDate, 'yyyy-MM-dd');
                
                if (request.type === 'FORGOT_CHECKIN') {
                     const checkInDateTime = new Date(`${shiftDateStr}T${timeStr}:00`);
                     const payload = {
                         user_id: request.userId,
                         date: shiftDateStr,
                         check_in_time: checkInDateTime.toISOString(),
                         work_type: 'OFFICE', 
                         status: 'WORKING',
                         note: `[APPROVED CORRECTION] ${request.reason}`
                     };
                     await supabase.from('attendance_logs').upsert(payload, { onConflict: 'user_id, date' });
                     await processAction(request.userId, 'ATTENDANCE_CHECK_IN', { status: 'ON_TIME', time: timeStr });

                } else if (request.type === 'FORGOT_CHECKOUT') {
                     const [hours, minutes] = timeStr.split(':').map(Number);
                     const checkOutDateTime = new Date(request.startDate); 
                     checkOutDateTime.setHours(hours, minutes, 0, 0);
                     if (hours < 5) checkOutDateTime.setDate(checkOutDateTime.getDate() + 1);

                     const { data: log } = await supabase.from('attendance_logs').select('id').eq('user_id', request.userId).eq('date', shiftDateStr).single();
                     
                     if (log) {
                        await supabase.from('attendance_logs').update({
                             check_out_time: checkOutDateTime.toISOString(),
                             status: 'COMPLETED',
                             note: `[APPROVED CORRECTION] ${request.reason}`
                        }).eq('id', log.id);
                        await processAction(request.userId, 'DUTY_COMPLETE', { reason: 'Manual Checkout Approved' });
                     } else {
                         const defaultStart = new Date(request.startDate);
                         defaultStart.setHours(10, 0, 0, 0);
                         await supabase.from('attendance_logs').insert({
                             user_id: request.userId,
                             date: shiftDateStr,
                             check_in_time: defaultStart.toISOString(),
                             check_out_time: checkOutDateTime.toISOString(),
                             work_type: 'OFFICE',
                             status: 'COMPLETED',
                             note: `[AUTO-CREATED FOR CHECKOUT] ${request.reason}`
                         });
                     }
                }
            } else if (request.type !== 'LATE_ENTRY') { // Skip log creation for LATE_ENTRY as it's just permission
                // --- Logic for Actual Leaves (Sick, Vacation) ---
                const days = eachDayOfInterval({ start: request.startDate, end: request.endDate });
                const logs = days.map(day => ({
                    user_id: request.userId,
                    date: format(day, 'yyyy-MM-dd'),
                    work_type: 'LEAVE',
                    status: 'LEAVE',
                    note: `[APPROVED LEAVE: ${request.type}] ${request.reason}`
                }));

                const { error: logError } = await supabase.from('attendance_logs').upsert(logs, { onConflict: 'user_id, date' });
                if (logError) throw logError;
                await processAction(request.userId, 'ATTENDANCE_LEAVE', { type: request.type });
            }

            await supabase.from('team_messages').insert({
                content: `✅ คำขอของ **${request.user?.name}** (${request.type}) ได้รับการอนุมัติแล้ว`,
                is_bot: true,
                message_type: 'TEXT',
                user_id: null
            });
            
            showToast('อนุมัติและปรับปรุงข้อมูลเวลาให้แล้ว ✅', 'success');
        } catch (err: any) {
            setRequests(prev => prev.map(r => r.id === request.id ? { ...r, status: 'PENDING' } : r));
            showToast('เกิดข้อผิดพลาด: ' + err.message, 'error');
        }
    };

    const rejectRequest = async (id: string, reason: string) => {
        // Optimistic Update
        const targetReq = requests.find(r => r.id === id);
        setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'REJECTED', rejectionReason: reason } : r));

        try {
            const { data: req } = await supabase.from('leave_requests').select('*').eq('id', id).single();
            await supabase.from('leave_requests').update({ 
                    status: 'REJECTED', 
                    approver_id: currentUser.id,
                    rejection_reason: reason 
                }).eq('id', id);

            if (req && req.type === 'FORGOT_CHECKOUT') {
                 await supabase.from('attendance_logs').update({ status: 'ACTION_REQUIRED' }).eq('user_id', req.user_id).eq('date', req.start_date);
            }
            
            // --- NEW: Handle LATE_ENTRY Rejection Penalty ---
            if (req && req.type === 'LATE_ENTRY') {
                const dateStr = req.start_date;
                // If they checked in (APPEAL PENDING), now update log to LATE and penalize
                const { data: log } = await supabase.from('attendance_logs')
                    .select('id, note')
                    .eq('user_id', req.user_id)
                    .eq('date', dateStr)
                    .maybeSingle();

                if (log) {
                    const newNote = (log.note || '').replace('[APPEAL_PENDING]', '[APPEAL REJECTED]').trim();
                    await supabase.from('attendance_logs').update({ note: newNote, status: 'LATE' }).eq('id', log.id);
                }
                
                // Trigger Penalty Game Event
                await processAction(req.user_id, 'ATTENDANCE_LATE', { date: dateStr });
            }
            
            if (req) {
                 const startDate = new Date(req.start_date);
                 const endDate = new Date(req.end_date);
                 const dateDisplay = format(startDate, 'd MMM yyyy');
                 const fullDateDisplay = startDate.getTime() === endDate.getTime() 
                    ? dateDisplay 
                    : `${dateDisplay} - ${format(endDate, 'd MMM yyyy')}`;

                 await supabase.from('notifications').insert({
                     user_id: req.user_id,
                     type: 'INFO',
                     title: '❌ คำขอถูกปฏิเสธ',
                     message: `รายการ: ${req.type}\nวันที่: ${fullDateDisplay}\nเหตุผล: ${reason}`,
                     is_read: false,
                     link_path: 'ATTENDANCE'
                });
            }

            showToast('ปฏิเสธคำขอแล้ว', 'info');
        } catch (err: any) {
            setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'PENDING' } : r));
            showToast('เกิดข้อผิดพลาด', 'error');
        }
    };

    return {
        requests,
        leaveUsage,
        isLoading,
        submitRequest,
        approveRequest,
        rejectRequest
    };
};
