import { useCallback } from 'react';
import { format } from 'date-fns';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';
import { attendanceService } from '../../services/attendanceService';
import { calculateOtBreakdownWithHours } from '../../utils/otCalculator';

export interface SubmitOtParams {
    startDate: Date;
    startDateStr: string;
    reason: string;
    uploadedUrls: string[];
}

interface UseOtRequestSubmitterProps {
    currentUser?: any;
    annualHolidays: any;
    calendarExceptions: any;
    refreshLeaves?: () => Promise<void> | void;
    refreshAttendance?: () => Promise<void> | void;
    refreshOTRequests?: () => Promise<void> | void;
    fetchMyRequests: () => Promise<void> | void;
}

/**
 * Hook to handle the submission workflow for Overtime (OT) requests.
 */
export const useOtRequestSubmitter = ({
    currentUser,
    annualHolidays,
    calendarExceptions,
    refreshLeaves,
    refreshAttendance,
    refreshOTRequests,
    fetchMyRequests
}: UseOtRequestSubmitterProps) => {
    const { showToast } = useToast();

    const submitOtRequest = useCallback(async ({
        startDate,
        startDateStr,
        reason,
        uploadedUrls
    }: SubmitOtParams): Promise<boolean> => {
        if (!currentUser?.id) return false;

        const isFixedOt = reason.includes('[OT:FIXED]');

        // Try matching new format: [OT:18:30-20:30] (2hr) Reason
        const otTimeMatch = reason.match(/\[OT:(\d{2}:\d{2})-(\d{2}:\d{2})\]/);
        const startTime = otTimeMatch ? otTimeMatch[1] : '18:30';
        const endTime = otTimeMatch ? otTimeMatch[2] : '20:30';

        // Match hours from new format "(Xhr)" or old format "[OT:Xhr]"
        const otHoursMatch = reason.match(/\(([\d\.]+)hr\)/) || reason.match(/\[OT:([\d\.]+)hr\]/);
        const otHours = otHoursMatch ? parseFloat(otHoursMatch[1]) : 2.0;

        // Clean the reason prefix
        let cleanReason = reason
            .replace(/\[OT:\d{2}:\d{2}-\d{2}:\d{2}\]\s*\([\d\.]+hr\)\s*/, '')
            .replace(/\[OT:[\d\.]+hr\]\s*/, '')
            .trim();

        if (isFixedOt) {
            cleanReason = `[OT:FIXED] ${cleanReason.replace(/\[OT:FIXED\]/g, '').trim()}`;
        }

        const { data: existing = null } = await supabase
            .from('ot_requests')
            .select('id, status')
            .eq('user_id', currentUser.id)
            .eq('date', startDateStr)
            .in('status', ['PENDING', 'APPROVED'])
            .maybeSingle();

        if (existing) {
            if (existing.status === 'PENDING') {
                showToast('คุณได้ส่งคำขอ OT ของวันนี้ไปแล้ว และกำลังรออนุมัติอยู่ ⏳', 'warning');
            } else {
                showToast('คำขอ OT ของวันนี้ได้รับการอนุมัติเรียบร้อยแล้วครับ ✅', 'info');
            }
            return false;
        }

        const baseSalary = currentUser.baseSalary || 0;
        const otBreakdown = calculateOtBreakdownWithHours(otHours, startDate, baseSalary, annualHolidays, calendarExceptions);
        const otType = otBreakdown.primaryType;
        const estimatedPayout = isFixedOt ? 0 : otBreakdown.estimatedPayout;

        const insertedOt = await attendanceService.insertOtRequest({
            user_id: currentUser.id,
            date: startDateStr,
            start_time: startTime,
            end_time: endTime,
            duration_hours: otHours,
            reason: cleanReason,
            type: otType,
            status: 'PENDING',
            base_salary_at_time: baseSalary,
            computed_payout: estimatedPayout,
            attachment_urls: uploadedUrls,
            is_fixed: isFixedOt
        });

        const displayReason = isFixedOt ? cleanReason.replace(/\[OT:FIXED\]/g, '').trim() : cleanReason;
        const otDisplayStr = isFixedOt ? 'เหมาจ่าย' : `${otHours} ชม.`;
        const msg = `📢 **${currentUser.name}** ส่งคำขอ OT (${otDisplayStr}) \n📅 ${format(startDate, 'd MMM')} \n📝: ${displayReason}`;
        await supabase.from('team_messages').insert({
            content: msg,
            is_bot: true,
            message_type: 'TEXT',
            user_id: null
        });

        try {
            const { data: admins } = await supabase.from('profiles').select('id').eq('role', 'ADMIN');
            if (admins && admins.length > 0) {
                const otNotifs = admins.map(admin => ({
                    user_id: admin.id,
                    type: 'APPROVAL_REQ',
                    title: '⏰ คำขอ OT ใหม่',
                    message: `คุณ ${currentUser.name || 'พนักงาน'} ส่งคำขอ OT (${otDisplayStr}) วันที่ ${format(startDate, 'd MMM')}: "${displayReason}"`,
                    is_read: false,
                    link_path: 'ATTENDANCE',
                    related_id: insertedOt?.id || null,
                    metadata: {
                        request_type: 'OT',
                        employee_name: currentUser.name,
                        date: startDateStr,
                        start_time: startTime,
                        end_time: endTime,
                        duration: otHours,
                        is_fixed: isFixedOt,
                        ot_type: otType,
                        reason: displayReason
                    }
                }));
                await supabase.from('notifications').insert(otNotifs);
            }
        } catch (notiErr) {
            console.error("Failed to insert admin OT notifications:", notiErr);
        }

        showToast('ส่งคำขอ OT เรียบร้อย รออนุมัติครับ 📨', 'success');
        if (refreshLeaves) await refreshLeaves();
        if (refreshAttendance) await refreshAttendance();
        if (refreshOTRequests) {
            await refreshOTRequests();
        }
        fetchMyRequests();
        return true;
    }, [
        currentUser,
        annualHolidays,
        calendarExceptions,
        showToast,
        refreshLeaves,
        refreshAttendance,
        refreshOTRequests,
        fetchMyRequests
    ]);

    return {
        submitOtRequest
    };
};
