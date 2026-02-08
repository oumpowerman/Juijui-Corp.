
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { LeaveRequest, LeaveType } from '../types/attendance';
import { useToast } from '../context/ToastContext';
import { eachDayOfInterval, format } from 'date-fns';
import { useGamification } from './useGamification';

export const useLeaveRequests = (currentUser?: any) => {
    const [requests, setRequests] = useState<LeaveRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { showToast } = useToast();
    const { processAction } = useGamification(); // Connect to Game Engine

    const fetchRequests = async () => {
        setIsLoading(true);
        try {
            // Specify foreign key explicitly to resolve ambiguity between user_id and approver_id
            const { data, error } = await supabase
                .from('leave_requests')
                .select(`
                    *,
                    profiles:profiles!leave_requests_user_id_fkey (id, full_name, avatar_url, position)
                `)
                .order('created_at', { ascending: false });

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

    // Subscriptions
    useEffect(() => {
        fetchRequests();
        const channel = supabase.channel('leave_requests_realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'leave_requests' }, () => fetchRequests())
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, []);

    const submitRequest = async (
        type: LeaveType, 
        startDate: Date, 
        endDate: Date, 
        reason: string, 
        file?: File
    ) => {
        if (!currentUser) return;
        try {
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
                start_date: format(startDate, 'yyyy-MM-dd'),
                end_date: format(endDate, 'yyyy-MM-dd'),
                reason,
                attachment_url: attachmentUrl,
                status: 'PENDING'
            };

            const { error } = await supabase.from('leave_requests').insert(payload);
            if (error) throw error;

            // Notify Chat
            const msg = `📢 **${currentUser.name}** แจ้งขอลา/แก้ไขเวลา (${type}) \n📅 ${format(startDate, 'd MMM')} \n📝: ${reason}`;
            await supabase.from('team_messages').insert({
                content: msg,
                is_bot: true,
                message_type: 'TEXT',
                user_id: null
            });

            // --- NOTIFY ADMINS ---
            // 1. Fetch Admin IDs
            const { data: admins } = await supabase.from('profiles').select('id').eq('role', 'ADMIN');
            if (admins && admins.length > 0) {
                const notifications = admins.map(admin => ({
                    user_id: admin.id,
                    type: 'APPROVAL_REQ',
                    title: `📋 คำขออนุมัติใหม่: ${currentUser.name}`,
                    message: `${type}: ${reason}`,
                    is_read: false,
                    link_path: 'ATTENDANCE'
                }));
                await supabase.from('notifications').insert(notifications);
            }

            showToast('ส่งคำขอเรียบร้อย รอหัวหน้าอนุมัติครับ 📨', 'success');
            return true;
        } catch (err: any) {
            showToast('ส่งคำขอไม่สำเร็จ: ' + err.message, 'error');
            return false;
        }
    };

    const approveRequest = async (request: LeaveRequest) => {
        try {
            // 1. Update Request Status
            const { error: updateError } = await supabase
                .from('leave_requests')
                .update({ status: 'APPROVED', approver_id: currentUser.id })
                .eq('id', request.id);
            
            if (updateError) throw updateError;

            // 2. Handle Logic based on Type
            if (request.type === 'FORGOT_CHECKIN' || request.type === 'FORGOT_CHECKOUT') {
                // Parse Time from Reason "[TIME:09:00] ..."
                const timeMatch = request.reason.match(/\[TIME:(\d{2}:\d{2})\]/);
                const timeStr = timeMatch ? timeMatch[1] : '00:00';
                
                // Construct Date Object
                const logDate = format(request.startDate, 'yyyy-MM-dd'); // Target Date
                const fullDateTimeStr = `${logDate}T${timeStr}:00`; 
                
                if (request.type === 'FORGOT_CHECKIN') {
                     // Upsert logic
                     const payload = {
                         user_id: request.userId,
                         date: logDate,
                         check_in_time: new Date(fullDateTimeStr).toISOString(),
                         work_type: 'OFFICE', 
                         status: 'WORKING',
                         note: `[APPROVED CORRECTION] ${request.reason}`
                     };
                     await supabase.from('attendance_logs').upsert(payload, { onConflict: 'user_id, date' });

                     // **GAMIFICATION TRIGGER**: Re-calculate score as if checked in now (Retroactive)
                     // Will deduct LATE penalty if timeStr is late, or award ON_TIME if okay.
                     await processAction(request.userId, 'ATTENDANCE_CHECK_IN', {
                         status: 'ON_TIME', // Assuming forgiveness if approved, or check logic?
                         // Let's rely on strict logic: Calculate late status based on approved time
                         time: timeStr
                     });

                } else if (request.type === 'FORGOT_CHECKOUT') {
                     // Update existing log
                     const { data: log } = await supabase.from('attendance_logs').select('id').eq('user_id', request.userId).eq('date', logDate).single();
                     
                     if (log) {
                        await supabase.from('attendance_logs').update({
                             check_out_time: new Date(fullDateTimeStr).toISOString(),
                             status: 'COMPLETED',
                             note: `[APPROVED CORRECTION] ${request.reason}`
                        }).eq('id', log.id);
                        
                        // Award completion points
                        await processAction(request.userId, 'DUTY_COMPLETE', { 
                            reason: 'Manual Checkout Approved' 
                        });

                     } else {
                         // Fallback create
                         const defaultStart = `${logDate}T10:00:00`;
                         await supabase.from('attendance_logs').insert({
                             user_id: request.userId,
                             date: logDate,
                             check_in_time: new Date(defaultStart).toISOString(),
                             check_out_time: new Date(fullDateTimeStr).toISOString(),
                             work_type: 'OFFICE',
                             status: 'COMPLETED',
                             note: `[AUTO-CREATED FOR CHECKOUT] ${request.reason}`
                         });
                     }
                }

            } else {
                // Regular Leave Logic (Sick, Vacation)
                const days = eachDayOfInterval({ start: request.startDate, end: request.endDate });
                const logs = days.map(day => ({
                    user_id: request.userId,
                    date: format(day, 'yyyy-MM-dd'),
                    work_type: 'LEAVE',
                    status: 'LEAVE',
                    note: `[APPROVED LEAVE: ${request.type}] ${request.reason}`
                }));

                const { error: logError } = await supabase
                    .from('attendance_logs')
                    .upsert(logs, { onConflict: 'user_id, date' });

                if (logError) throw logError;

                // **GAMIFICATION**: Log leave (Neutral event, but good for tracking)
                await processAction(request.userId, 'ATTENDANCE_LEAVE', { type: request.type });
            }

            // 3. Notify User (Chat + Persistent Notification)
            await supabase.from('team_messages').insert({
                content: `✅ คำขอของ **${request.user?.name}** (${request.type}) ได้รับการอนุมัติแล้ว`,
                is_bot: true,
                message_type: 'TEXT',
                user_id: null
            });
            
            // Persistent Notification
            await supabase.from('notifications').insert({
                 user_id: request.userId,
                 type: 'INFO',
                 title: '✅ คำขออนุมัติสำเร็จ',
                 message: `คำขอ ${request.type} ได้รับการอนุมัติแล้ว`,
                 is_read: false,
                 link_path: 'ATTENDANCE'
            });

            showToast('อนุมัติและปรับปรุงข้อมูลเวลาให้แล้ว ✅', 'success');
        } catch (err: any) {
            showToast('เกิดข้อผิดพลาด: ' + err.message, 'error');
        }
    };

    const rejectRequest = async (id: string) => {
        try {
            await supabase
                .from('leave_requests')
                .update({ status: 'REJECTED', approver_id: currentUser.id })
                .eq('id', id);
            
            // Fetch request details to notify user
            const { data: req } = await supabase.from('leave_requests').select('user_id, type').eq('id', id).single();
            if (req) {
                 await supabase.from('notifications').insert({
                     user_id: req.user_id,
                     type: 'INFO',
                     title: '❌ คำขอถูกปฏิเสธ',
                     message: `คำขอ ${req.type} ของคุณไม่ผ่านการอนุมัติ`,
                     is_read: false,
                     link_path: 'ATTENDANCE'
                });
            }

            showToast('ปฏิเสธคำขอแล้ว', 'info');
        } catch (err: any) {
            showToast('เกิดข้อผิดพลาด', 'error');
        }
    };

    return {
        requests,
        isLoading,
        submitRequest,
        approveRequest,
        rejectRequest
    };
};
