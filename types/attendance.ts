
import { User } from './core';

export type WorkLocation = 'OFFICE' | 'WFH' | 'SITE' | 'LEAVE';
export type AttendanceStatus = 'WORKING' | 'COMPLETED' | 'ABSENT' | 'LATE' | 'LEAVE' | 'EARLY_LEAVE' | 'PENDING_VERIFY' | 'ACTION_REQUIRED' | 'ON_TIME' | 'NO_SHOW';

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
    
    // New Structured Data Columns
    locationLat?: number;
    locationLng?: number;
    locationName?: string;
    checkOutLat?: number;
    checkOutLng?: number;
    checkOutLocationName?: string;
}

export interface AttendanceStats {
    totalDays: number;
    lateDays: number;
    onTimeDays: number;
    absentDays: number;
    totalHours: number;
    currentStreak: number; // NEW: Track consecutive on-time days
}

// --- NEW: Leave Request Types (Updated) ---
// Added 'WFH' to the union type
export type LeaveType = 'SICK' | 'VACATION' | 'PERSONAL' | 'EMERGENCY' | 'LATE_ENTRY' | 'OVERTIME' | 'FORGOT_CHECKIN' | 'FORGOT_CHECKOUT' | 'WFH';
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
    rejectionReason?: string; // NEW: Added rejection reason
    user?: User;
}

// NEW: Helper type for Quota
export type LeaveUsage = Record<LeaveType, number>;
