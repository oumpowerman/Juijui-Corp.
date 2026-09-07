import { useCallback } from 'react';
import { format } from 'date-fns';
import { supabase } from '../../lib/supabase';
import { LeaveType } from '../../types/attendance';

export interface ProvisionalSyncParams {
    type: LeaveType;
    currentUser: any;
    startDate: Date;
    endDate: Date;
    startDateStr: string;
    linkedRemoteType?: 'WFH' | 'ONSITE';
    uploadedUrls: string[];
    coords?: { lat?: number | null; lng?: number | null; locationName?: string | null };
    amHalfDay?: boolean | null;
    pmHalfDay?: boolean | null;
    isInstantCheckIn?: boolean;
}

/**
 * Hook to handle provisional attendance side-effects (updating attendance_logs and profile status)
 * when leave / time correction requests are submitted.
 */
export const useProvisionalAttendanceSync = () => {

    const syncProvisionalForgotCheckIn = useCallback(async ({
        currentUser,
        startDate,
        startDateStr,
        linkedRemoteType,
        uploadedUrls,
        coords,
        amHalfDay,
        pmHalfDay
    }: Omit<ProvisionalSyncParams, 'type' | 'endDate' | 'isInstantCheckIn'>) => {
        const { data: existingLog } = await supabase
            .from('attendance_logs')
            .select('*')
            .eq('user_id', currentUser.id)
            .eq('date', startDateStr)
            .maybeSingle();

        let finalNote = '[PROVISIONAL_FORGOT_CHECKIN]';
        if (linkedRemoteType) {
            finalNote = `[PROVISIONAL_FORGOT_CHECKIN] [PROVISIONAL_${linkedRemoteType}]`;
        }
        if (existingLog?.note) {
            if (!existingLog.note.includes('[PROVISIONAL_FORGOT_CHECKIN]')) {
                finalNote = `${existingLog.note} ${finalNote}`.trim();
            } else {
                finalNote = existingLog.note;
            }
        }

        if (amHalfDay && !finalNote.includes('[HALF_DAY:AM]')) {
            finalNote = `${finalNote} [HALF_DAY:AM]`.trim();
        }
        if (pmHalfDay && !finalNote.includes('[HALF_DAY:PM]')) {
            finalNote = `${finalNote} [HALF_DAY:PM]`.trim();
        }

        const existingAttachments: string[] = Array.isArray(existingLog?.attachment_urls) ? existingLog.attachment_urls : [];
        const combinedAttachments = Array.from(new Set([...existingAttachments, ...uploadedUrls]));

        const payload: any = {
            user_id: currentUser.id,
            date: startDateStr,
            check_in_time: startDate.toISOString(),
            status: 'WORKING',
            note: finalNote,
            attachment_urls: combinedAttachments,
            work_type: linkedRemoteType || (existingLog?.work_type && existingLog.work_type !== 'LEAVE' && existingLog.work_type !== 'ABSENT' ? existingLog.work_type : 'OFFICE'),
            location_lat: coords?.lat !== undefined ? coords.lat : (existingLog?.location_lat ?? null),
            location_lng: coords?.lng !== undefined ? coords.lng : (existingLog?.location_lng ?? null),
            location_name: coords?.locationName || existingLog?.location_name || (linkedRemoteType || 'Office')
        };

        await supabase.from('attendance_logs').upsert(payload, { onConflict: 'user_id, date' });

        if (startDateStr === format(new Date(), 'yyyy-MM-dd')) {
            await supabase.from('profiles').update({ work_status: 'ONLINE' }).eq('id', currentUser.id);
        }
    }, []);

    const syncProvisionalForgotBoth = useCallback(async ({
        currentUser,
        startDate,
        endDate,
        startDateStr,
        linkedRemoteType,
        uploadedUrls,
        coords,
        amHalfDay,
        pmHalfDay
    }: Omit<ProvisionalSyncParams, 'type' | 'isInstantCheckIn'>) => {
        const { data: existingLog } = await supabase
            .from('attendance_logs')
            .select('*')
            .eq('user_id', currentUser.id)
            .eq('date', startDateStr)
            .maybeSingle();

        let finalNote = '[FORGOT_BOTH_PENDING]';
        if (linkedRemoteType) {
            finalNote = `[FORGOT_BOTH_PENDING] [PROVISIONAL_${linkedRemoteType}]`;
        }

        const wasAbsent = existingLog?.status === 'ABSENT' || existingLog?.note?.includes('[ORIGINALLY: ABSENT]');

        if (existingLog?.note) {
            if (!existingLog.note.includes('[FORGOT_BOTH_PENDING]')) {
                finalNote = `${existingLog.note} ${finalNote}`.trim();
            } else {
                finalNote = existingLog.note;
            }
        }

        if (wasAbsent && !finalNote.includes('[ORIGINALLY: ABSENT]')) {
            finalNote = `[ORIGINALLY: ABSENT] ${finalNote}`;
        }

        if (amHalfDay && !finalNote.includes('[HALF_DAY:AM]')) {
            finalNote = `${finalNote} [HALF_DAY:AM]`.trim();
        }
        if (pmHalfDay && !finalNote.includes('[HALF_DAY:PM]')) {
            finalNote = `${finalNote} [HALF_DAY:PM]`.trim();
        }

        const existingAttachmentsFB: string[] = Array.isArray(existingLog?.attachment_urls) ? existingLog.attachment_urls : [];
        const combinedAttachmentsFB = Array.from(new Set([...existingAttachmentsFB, ...uploadedUrls]));

        const payload: any = {
            user_id: currentUser.id,
            date: startDateStr,
            check_in_time: startDate.toISOString(),
            check_out_time: endDate.toISOString(),
            status: 'PENDING_VERIFY',
            note: finalNote,
            attachment_urls: combinedAttachmentsFB,
            work_type: linkedRemoteType || (existingLog?.work_type && existingLog.work_type !== 'LEAVE' && existingLog.work_type !== 'ABSENT' ? existingLog.work_type : 'OFFICE'),
            location_lat: coords?.lat !== undefined ? coords.lat : (existingLog?.location_lat ?? null),
            location_lng: coords?.lng !== undefined ? coords.lng : (existingLog?.location_lng ?? null),
            location_name: coords?.locationName || existingLog?.location_name || (linkedRemoteType || 'Office'),
            check_out_lat: coords?.lat !== undefined ? coords.lat : (existingLog?.check_out_lat ?? null),
            check_out_lng: coords?.lng !== undefined ? coords.lng : (existingLog?.check_out_lng ?? null),
            check_out_location_name: coords?.locationName || existingLog?.check_out_location_name || (linkedRemoteType || 'Office')
        };

        await supabase.from('attendance_logs').upsert(payload, { onConflict: 'user_id, date' });

        if (startDateStr === format(new Date(), 'yyyy-MM-dd')) {
            await supabase.from('profiles').update({ work_status: 'ONLINE' }).eq('id', currentUser.id);
        }
    }, []);

    const syncProvisionalLateEntry = useCallback(async ({
        currentUser,
        startDate,
        startDateStr,
        linkedRemoteType,
        uploadedUrls,
        coords,
        amHalfDay,
        pmHalfDay
    }: Omit<ProvisionalSyncParams, 'type' | 'endDate' | 'isInstantCheckIn'>) => {
        const { data: existingLog } = await supabase
            .from('attendance_logs')
            .select('*')
            .eq('user_id', currentUser.id)
            .eq('date', startDateStr)
            .maybeSingle();

        let finalNote = '[PROVISIONAL_LATE_ENTRY]';
        if (linkedRemoteType) {
            finalNote = `[PROVISIONAL_LATE_ENTRY] [PROVISIONAL_${linkedRemoteType}]`;
        }
        if (existingLog?.note) {
            if (!existingLog.note.includes('[PROVISIONAL_LATE_ENTRY]')) {
                finalNote = `${existingLog.note} ${finalNote}`.trim();
            } else {
                finalNote = existingLog.note;
            }
        }

        if (amHalfDay && !finalNote.includes('[HALF_DAY:AM]')) {
            finalNote = `${finalNote} [HALF_DAY:AM]`.trim();
        }
        if (pmHalfDay && !finalNote.includes('[HALF_DAY:PM]')) {
            finalNote = `${finalNote} [HALF_DAY:PM]`.trim();
        }

        const existingAttachmentsLE: string[] = Array.isArray(existingLog?.attachment_urls) ? existingLog.attachment_urls : [];
        const combinedAttachmentsLE = Array.from(new Set([...existingAttachmentsLE, ...uploadedUrls]));

        const payload: any = {
            user_id: currentUser.id,
            date: startDateStr,
            check_in_time: startDate.toISOString(),
            status: 'WORKING',
            note: finalNote,
            attachment_urls: combinedAttachmentsLE,
            work_type: linkedRemoteType || (existingLog?.work_type && existingLog.work_type !== 'LEAVE' && existingLog.work_type !== 'ABSENT' ? existingLog.work_type : 'OFFICE'),
            location_lat: coords?.lat !== undefined ? coords.lat : (existingLog?.location_lat ?? null),
            location_lng: coords?.lng !== undefined ? coords.lng : (existingLog?.location_lng ?? null),
            location_name: coords?.locationName || existingLog?.location_name || (linkedRemoteType || 'Office')
        };

        await supabase.from('attendance_logs').upsert(payload, { onConflict: 'user_id, date' });

        if (startDateStr === format(new Date(), 'yyyy-MM-dd')) {
            await supabase.from('profiles').update({ work_status: 'ONLINE' }).eq('id', currentUser.id);
        }
    }, []);

    const syncProvisionalCheckOut = useCallback(async ({
        currentUser,
        endDate,
        startDateStr,
        linkedRemoteType,
        uploadedUrls,
        coords
    }: Pick<ProvisionalSyncParams, 'currentUser' | 'endDate' | 'startDateStr' | 'linkedRemoteType' | 'uploadedUrls' | 'coords'>) => {
        const { data: existingLog } = await supabase
            .from('attendance_logs')
            .select('*')
            .eq('user_id', currentUser.id)
            .eq('date', startDateStr)
            .maybeSingle();

        let finalNote = '[PROVISIONAL_CHECKOUT]';
        if (existingLog?.note) {
            if (!existingLog.note.includes('[PROVISIONAL_CHECKOUT]')) {
                finalNote = `${existingLog.note} ${finalNote}`.trim();
            } else {
                finalNote = existingLog.note;
            }
        }

        const existingAttachmentsFCO: string[] = Array.isArray(existingLog?.attachment_urls) ? existingLog.attachment_urls : [];
        const combinedAttachmentsFCO = Array.from(new Set([...existingAttachmentsFCO, ...uploadedUrls]));

        const payload: any = {
            status: 'PENDING_VERIFY',
            note: finalNote,
            attachment_urls: combinedAttachmentsFCO,
            check_out_time: endDate.toISOString(),
            check_out_lat: coords?.lat !== undefined ? coords.lat : (existingLog?.check_out_lat ?? null),
            check_out_lng: coords?.lng !== undefined ? coords.lng : (existingLog?.check_out_lng ?? null),
            check_out_location_name: coords?.locationName || existingLog?.check_out_location_name || (linkedRemoteType || 'Office')
        };

        await supabase
            .from('attendance_logs')
            .update(payload)
            .eq('user_id', currentUser.id)
            .eq('date', startDateStr);
    }, []);

    const syncProvisionalRemoteStatus = useCallback(async ({
        currentUser,
        startDateStr
    }: {
        currentUser: any;
        startDateStr: string;
    }) => {
        const { data: existingLog } = await supabase
            .from('attendance_logs')
            .select('*')
            .eq('user_id', currentUser.id)
            .eq('date', startDateStr)
            .maybeSingle();

        if (existingLog) {
            await supabase
                .from('attendance_logs')
                .update({ status: 'PENDING_VERIFY' })
                .eq('id', existingLog.id);
        }
    }, []);

    const syncProvisionalAttendance = useCallback(async (params: ProvisionalSyncParams) => {
        const { type, isInstantCheckIn } = params;

        if (type === 'FORGOT_CHECKIN') {
            await syncProvisionalForgotCheckIn(params);
        } else if (type === 'FORGOT_BOTH') {
            await syncProvisionalForgotBoth(params);
        } else if (type === 'LATE_ENTRY' && isInstantCheckIn) {
            await syncProvisionalLateEntry(params);
        } else if (type === 'FORGOT_CHECKOUT' || type === 'OUT_OF_RANGE_CHECKOUT') {
            await syncProvisionalCheckOut(params);
        } else if (type === 'WFH' || type === 'ONSITE') {
            await syncProvisionalRemoteStatus({
                currentUser: params.currentUser,
                startDateStr: params.startDateStr
            });
        }
    }, [
        syncProvisionalForgotCheckIn,
        syncProvisionalForgotBoth,
        syncProvisionalLateEntry,
        syncProvisionalCheckOut,
        syncProvisionalRemoteStatus
    ]);

    return {
        syncProvisionalAttendance,
        syncProvisionalForgotCheckIn,
        syncProvisionalForgotBoth,
        syncProvisionalLateEntry,
        syncProvisionalCheckOut,
        syncProvisionalRemoteStatus
    };
};
