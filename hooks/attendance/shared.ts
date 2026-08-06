
import { AttendanceLog } from '../../types/attendance';
import { parseAttendanceMetadata } from '../../lib/attendanceUtils';

export const mapAttendanceLog = (data: any): AttendanceLog => {
    const meta = parseAttendanceMetadata(data.note);
    const rawAttachments: string[] = Array.isArray(data.attachment_urls) ? data.attachment_urls : [];
    const attachmentUrls = rawAttachments.length > 0 
        ? rawAttachments 
        : (meta.proofUrl ? [meta.proofUrl] : []);
    
    return {
        id: data.id,
        userId: data.user_id,
        date: data.date,
        checkInTime: data.check_in_time ? new Date(data.check_in_time) : null,
        checkOutTime: data.check_out_time ? new Date(data.check_out_time) : null,
        workType: data.work_type,
        status: data.status,
        note: data.note,
        attachmentUrls,
        locationLat: data.location_lat ?? meta.location?.lat,
        locationName: data.location_name ?? meta.locationName,
        locationLng: data.location_lng ?? meta.location?.lng,
        checkOutLat: data.check_out_lat,
        checkOutLng: data.check_out_lng,
        checkOutLocationName: data.check_out_location_name
    };
};
