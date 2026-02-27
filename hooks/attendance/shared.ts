
import { AttendanceLog } from '../../types/attendance';
import { parseAttendanceMetadata } from '../../lib/attendanceUtils';

export const mapAttendanceLog = (data: any): AttendanceLog => {
    const meta = parseAttendanceMetadata(data.note);
    
    return {
        id: data.id,
        userId: data.user_id,
        date: data.date,
        checkInTime: data.check_in_time ? new Date(data.check_in_time) : null,
        checkOutTime: data.check_out_time ? new Date(data.check_out_time) : null,
        workType: data.work_type,
        status: data.status,
        note: data.note,
        locationLat: data.location_lat ?? meta.location?.lat,
        locationName: data.location_name ?? meta.locationName,
        locationLng: data.location_lng ?? meta.location?.lng,
        checkOutLat: data.check_out_lat,
        checkOutLng: data.check_out_lng,
        checkOutLocationName: data.check_out_location_name
    };
};
