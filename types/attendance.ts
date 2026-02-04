
import { User } from './core';

export type WorkLocation = 'OFFICE' | 'WFH' | 'SITE' | 'LEAVE';
export type AttendanceStatus = 'WORKING' | 'COMPLETED' | 'ABSENT' | 'LATE' | 'LEAVE' | 'EARLY_LEAVE' ;

export interface LocationDef {
    id: string;
    name: string;
    lat: number;
    lng: number;
    radiusMeters: number;
}

export interface AttendanceLog {
    id: string;
    userId: string;
    date: string; // YYYY-MM-DD
    checkInTime: Date | null;
    checkOutTime: Date | null;
    workType: WorkLocation;
    status: AttendanceStatus;
    note?: string;
    user?: User; // Joined profile
}

export interface AttendanceStats {
    totalDays: number;
    lateDays: number;
    onTimeDays: number;
    absentDays: number;
    totalHours: number;
}

// --- NEW: Leave Request Types (Updated) ---
export type LeaveType = 'SICK' | 'VACATION' | 'PERSONAL' | 'EMERGENCY' | 'LATE_ENTRY' | 'OVERTIME' | 'FORGOT_CHECKIN' | 'FORGOT_CHECKOUT';
export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface LeaveRequest {
    id: string;
    userId: string;
    type: LeaveType;
    startDate: Date;
    endDate: Date;
    reason: string;
    attachmentUrl?: string;
    status: RequestStatus;
    approverId?: string;
    createdAt: Date;
    user?: User;
}