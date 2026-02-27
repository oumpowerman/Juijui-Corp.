
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { LeaveRequest, LeaveType, LeaveUsage } from '../types/attendance';
import { useToast } from '../context/ToastContext';
import { eachDayOfInterval, format, differenceInDays } from 'date-fns';
import { useGamification } from './useGamification';

export const useLeaveRequests = (currentUser?: any, options: { all?: boolean } = {}) => {
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
            
            // If not fetching all, filter by current user
            if (!options.all && currentUser?.id) {
                query = query.eq('user_id', currentUser.id);
            }
            
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
    }, [currentUser?.id, options.all]);

    const leaveUsage: LeaveUsage = useMemo(() => {
        const usage: LeaveUsage = {
            SICK: 0, VACATION: 0, PERSONAL: 0, EMERGENCY: 0,
            LATE_ENTRY: 0, OVERTIME: 0, FORGOT_CHECKIN: 0, FORGOT_CHECKOUT: 0, WFH: 0
        };

        if (!currentUser) return usage;

        const LEAVE_TYPES = ['SICK', 'VACATION', 'PERSONAL', 'EMERGENCY'];

        requests.forEach(req => {
            if (req.userId === currentUser.id && req.status === 'APPROVED') {
                if (LEAVE_TYPES.includes(req.type)) {
                    const days = differenceInDays(new Date(req.endDate), new Date(req.startDate)) + 1;
                    usage[req.type as keyof LeaveUsage] += days;
                } else {
                    // For non-leave types, we just count the occurrences
                    usage[req.type as keyof LeaveUsage] += 1;
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
            // Check for pending/approved request of same type on same day
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
            
            // If FORGOT_CHECKOUT, flag the log if exists
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
        const LEAVE_TYPES = ['SICK', 'VACATION', 'PERSONAL', 'EMERGENCY'];
        const CORRECTION_TYPES = ['LATE_ENTRY', 'FORGOT_CHECKIN', 'FORGOT_CHECKOUT'];
        const SPECIAL_TYPES = ['WFH', 'OVERTIME'];

        setRequests(prev => prev.map(r => r.id === request.id ? { ...r, status: 'APPROVED' } : r));

        try {
            const { error: updateError } = await supabase
                .from('leave_requests')
                .update({ status: 'APPROVED', approver_id: currentUser.id })
                .eq('id', request.id);
            
            if (updateError) throw updateError;

            // --- 1. NOTIFY USER WITH SPECIFIC TITLES ---
            let notifTitle = '✅ คำขอได้รับการอนุมัติ';
            if (CORRECTION_TYPES.includes(request.type)) notifTitle = '🛠️ อนุมัติการแก้ไขเวลา';
            if (SPECIAL_TYPES.includes(request.type)) notifTitle = '✨ อนุมัติคำขอพิเศษ';

            const dateDisplay = format(request.startDate, 'd MMM yyyy');
            const fullDateDisplay = request.startDate.getTime() === request.endDate.getTime() 
                ? dateDisplay 
                : `${dateDisplay} - ${format(request.endDate, 'd MMM yyyy')}`;

            await supabase.from('notifications').insert({
                user_id: request.userId,
                type: 'INFO',
                title: notifTitle,
                message: `รายการ: ${request.type}\nวันที่: ${fullDateDisplay}\nรายละเอียด: ${request.reason || '-'}`,
                is_read: false,
                link_path: 'ATTENDANCE'
            });

            // --- 2. GROUP BEHAVIOR LOGIC ---

            // A. SPECIAL WORK (WFH, OVERTIME)
            if (SPECIAL_TYPES.includes(request.type)) {
                if (request.type === 'WFH') {
                    await supabase.from('team_messages').insert({
                        content: `🏠 **${request.user?.name}** ได้รับอนุมัติ WFH (อย่าลืม Check-in เมื่อเริ่มงานนะ!)`,
                        is_bot: true,
                        message_type: 'TEXT',
                        user_id: null
                    });
                    showToast('อนุมัติ WFH เรียบร้อย', 'success');
                } else if (request.type === 'OVERTIME') {
                    showToast('อนุมัติการทำ OT เรียบร้อย', 'success');
                }
                return; // No log creation for special types here
            }
            
            // B. CORRECTIONS (Forgot In/Out, Late Entry)
            if (CORRECTION_TYPES.includes(request.type)) {
                const timeMatch = request.reason.match(/\[TIME:(\d{2}:\d{2})\]/);
                const timeStr = timeMatch ? timeMatch[1] : '00:00';
                const shiftDateStr = format(request.startDate, 'yyyy-MM-dd');
                
                if (request.type === 'FORGOT_CHECKIN' || request.type === 'LATE_ENTRY') {
                     const checkInDateTime = new Date(`${shiftDateStr}T${timeStr}:00`);
                     
                     const payload = {
                         user_id: request.userId,
                         date: shiftDateStr,
                         check_in_time: checkInDateTime.toISOString(),
                         work_type: 'OFFICE', // Default to office for correction if unknown
                         status: 'WORKING',   
                         note: `[APPROVED ${request.type}] ${request.reason}`
                     };
                     
                     await supabase.from('attendance_logs').upsert(payload, { onConflict: 'user_id, date' });
                     await supabase.from('profiles').update({ work_status: 'ONLINE' }).eq('id', request.userId);

                     await processAction(request.userId, 'ATTENDANCE_CHECK_IN', { 
                        status: request.type === 'LATE_ENTRY' ? 'LATE' : 'ON_TIME', 
                        time: timeStr 
                     });

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
                         // Fallback: Create a full log if missing
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
                showToast('ปรับปรุงข้อมูลเวลาให้เรียบร้อยแล้ว ✅', 'success');
            } 
            
            // C. LEAVES (Sick, Vacation, etc.)
            else if (LEAVE_TYPES.includes(request.type)) {
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
                showToast(`อนุมัติวันลา (${request.type}) และลงบันทึกแล้ว ✅`, 'success');
            }

            // Global Team Message
            await supabase.from('team_messages').insert({
                content: `✅ คำขอของ **${request.user?.name}** (${request.type}) ได้รับการอนุมัติแล้ว`,
                is_bot: true,
                message_type: 'TEXT',
                user_id: null
            });
            
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
                const { data: log } = await supabase.from('attendance_logs')
                    .select('id, note')
                    .eq('user_id', req.user_id)
                    .eq('date', dateStr)
                    .maybeSingle();

                if (log) {
                    const newNote = (log.note || '').replace('[APPEAL_PENDING]', '[APPEAL REJECTED]').trim();
                    await supabase.from('attendance_logs').update({ note: newNote, status: 'LATE' }).eq('id', log.id);
                }
                
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
