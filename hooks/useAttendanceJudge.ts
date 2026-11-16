import React from 'react';
import { User, AnnualHoliday } from '../types';

/**
 * Attendance penalty & cleanup rules (Forgot Checkout, Absent Check, and 7-day
 * stale correction request auto-reject) have been migrated server-side to
 * multi-tenant, org-scoped Supabase `pg_cron` jobs
 * (`20261116000000_multitenant_attendance_penalty_pg_cron.sql`).
 *
 * Kept as a clean no-op interface for backwards compatibility.
 */
export const useAttendanceJudge = (
    _currentUser: User | null,
    _isProcessingRef: React.MutableRefObject<Set<string>>,
    _processAction: any,
    _config: any,
    _gameLogs: any[],
    _notifications: any[],
    _isLoading: boolean
) => {
    const runAttendanceChecks = async (
        _today: Date,
        _todayStr: string,
        _holidays: AnnualHoliday[],
        _exceptions: any[],
        _userLeaves: any[],
        _attendanceLogs: any[]
    ) => {
        // Intentionally no-op: handled on schedule by org-scoped pg_cron jobs.
    };

    return { runAttendanceChecks };
};

