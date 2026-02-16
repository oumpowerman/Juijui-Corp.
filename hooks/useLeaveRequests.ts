
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
    const { processAction } = useGamification(); // Connect to Game Engine

    const fetchRequests = async () => {
        setIsLoading(true);
        try {
            // Specify foreign key explicitly to resolve ambiguity between user_id and approver_id
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
                    rejectionReason: r.rejection_reason, // Map from DB
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

    // --- NEW: Calculate Leave Usage ---
    const leaveUsage: LeaveUsage = useMemo(() => {
        const usage: LeaveUsage = {
            SICK: 0, VACATION: 0, PERSONAL: 0, EMERGENCY: 0,
            LATE_ENTRY: 0, OVERTIME: 0, FORGOT_CHECKIN: 0, FORGOT_CHECKOUT: 0
        };

        if (!currentUser) return usage;

        requests.forEach(req => {
            if (req.userId === currentUser.id && req.status === 'APPROVED') {
                // For day-based leaves, count days
                if (['SICK', 'VACATION', 'PERSONAL', 'EMERGENCY'].includes(req.type)) {
                    const days = differenceInDays(new Date(req.endDate), new Date(req.startDate)) + 1;
                    usage[req.type] += days;
                } else {
                    // For incident-based (Late, OT, Forgot), count incidents
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
    ) => {
        if (!currentUser) return;
        try {
            const startDateStr = format(startDate, 'yyyy-MM-dd');

            // --- 1. DUPLICATE CHECK ---
            // เช็คว่ามีคำขอประเภทเดียวกัน ในวันเดียวกัน ที่สถานะเป็น PENDING หรือ APPROVED อยู่แล้วหรือไม่
            const { data: existingRequest } = await supabase
                .from('leave_requests')
                .select('id, status')
                .eq('user_id', currentUser.id)
                .eq('type', type)
                .eq('start_date', startDateStr)
                .in('status', ['PENDING', 'APPROVED']) // เช็คทั้งรอและอนุมัติแล้ว
                .maybeSingle();

            if (existingRequest) {
                if (existingRequest.status === 'PENDING') {
                    showToast('คุณได้ส่งคำขอนี้ไปแล้วครับ (รอหัวหน้าอนุมัติอยู่) ⏳', 'warning');
                } else {
                    showToast('คำขอนี้ได้รับการอนุมัติไปแล้วครับ ✅', 'info');
                }
                return false; // Stop process
            }

            // --- 2. UPLOAD PROOF ---
            let attachmentUrl = null;
            if (file) {
                const fileExt = file.name.split('.').pop();
                const fileName = `leave-${currentUser.id}-${Date.now()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage.from('chat-files').upload(`proofs/${fileName}`, file);
                if (uploadError) throw uploadError;
                const { data } = supabase.storage.from('chat-files').getPublicUrl(`proofs/${fileName}`);
                attachmentUrl = data.publicUrl;
            }

            // --- 3. INSERT REQUEST ---
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

            // Notify Chat
            const msg = `📢 **${currentUser.name}** แจ้งขอลา/แก้ไขเวลา (${type}) \n📅 ${format(startDate, 'd MMM')} \n📝: ${reason}`;
            await supabase.from('team_messages').insert({
                content: msg,
                is_bot: true,
                message_type: 'TEXT',
                user_id: null
            });

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
                
                // IMPORTANT: Shift Date (The date the shift started)
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

                     // **GAMIFICATION TRIGGER**
                     await processAction(request.userId, 'ATTENDANCE_CHECK_IN', {
                         status: 'ON_TIME', 
                         time: timeStr
                     });

                } else if (request.type === 'FORGOT_CHECKOUT') {
                     // Smart Cross-Day Logic
                     const [hours, minutes] = timeStr.split(':').map(Number);
                     const checkOutDateTime = new Date(request.startDate); // Start from Shift Date
                     checkOutDateTime.setHours(hours, minutes, 0, 0);

                     // If check-out time is in early morning (e.g. < 5 AM), assume it's next day
                     if (hours < 5) {
                         checkOutDateTime.setDate(checkOutDateTime.getDate() + 1);
                     }

                     // Try to update existing log for the SHIFT DATE
                     const { data: log } = await supabase.from('attendance_logs')
                        .select('id')
                        .eq('user_id', request.userId)
                        .eq('date', shiftDateStr) // Key is Shift Date
                        .single();
                     
                     if (log) {
                        await supabase.from('attendance_logs').update({
                             check_out_time: checkOutDateTime.toISOString(),
                             status: 'COMPLETED',
                             note: `[APPROVED CORRECTION] ${request.reason}`
                        }).eq('id', log.id);
                        
                        await processAction(request.userId, 'DUTY_COMPLETE', { 
                            reason: 'Manual Checkout Approved' 
                        });

                     } else {
                         // Fallback create (Ensure date is Shift Date)
                         const defaultStart = new Date(request.startDate);
                         defaultStart.setHours(10, 0, 0, 0);

                         await supabase.from('attendance_logs').insert({
                             user_id: request.userId,
                             date: shiftDateStr, // Keep Shift Date as key
                             check_in_time: defaultStart.toISOString(),
                             check_out_time: checkOutDateTime.toISOString(),
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

            // 3. Notify User
            await supabase.from('team_messages').insert({
                content: `✅ คำขอของ **${request.user?.name}** (${request.type}) ได้รับการอนุมัติแล้ว`,
                is_bot: true,
                message_type: 'TEXT',
                user_id: null
            });
            
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

    // Update: Accept reason
    const rejectRequest = async (id: string, reason: string) => {
        try {
            await supabase
                .from('leave_requests')
                .update({ 
                    status: 'REJECTED', 
                    approver_id: currentUser.id,
                    rejection_reason: reason // Save to DB
                })
                .eq('id', id);
            
            // Fetch request details to notify user
            const { data: req } = await supabase.from('leave_requests').select('user_id, type').eq('id', id).single();
            if (req) {
                 await supabase.from('notifications').insert({
                     user_id: req.user_id,
                     type: 'INFO',
                     title: '❌ คำขอถูกปฏิเสธ',
                     message: `คำขอ ${req.type} ของคุณไม่ผ่านการอนุมัติ เนื่องจาก: ${reason}`,
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
        leaveUsage, // Exported
        isLoading,
        submitRequest,
        approveRequest,
        rejectRequest
    };
};
