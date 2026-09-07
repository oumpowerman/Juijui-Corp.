import { User } from '../../../types';
import { AttendanceLog } from '../../../types/attendance';

export interface UserStat {
    userId: string;
    present: number;
    late: number;
    leaves: number;
    absent: number;
    totalHours: number;
    avgCheckIn: string;
    logs: AttendanceLog[];
    totalLateMinutes?: number;
    totalOtHours?: number;
    totalOtPayout?: number;
    totalFixedOtDays?: number;
    hasProvisionalForgot?: boolean;
    provisionalForgotCount?: number;
}

export type DateFilterMode = 'MONTH' | 'CUSTOM';
export type ViewMode = 'TABLE' | 'ANALYTICS';
export type LateViewMode = 'DAYS' | 'HOURS';
export type OtViewMode = 'HOURS' | 'LUMP_SUM' | 'BOTH' | 'PAYOUT';
export type HpViewMode = 'MONTHLY' | 'YEARLY';
export type StatFilterType = 'ALL' | 'PRESENT' | 'LATE' | 'ABSENT' | 'LEAVE';
export type SortDirection = 'ASC' | 'DESC';

export interface GradeInfo {
    grade: string;
    color: string;
}

export interface AdminAttendanceDashboardProps {
    users: User[];
}
