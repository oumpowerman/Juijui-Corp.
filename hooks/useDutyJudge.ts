import React from 'react';
import { User, AnnualHoliday } from '../types';

/**
 * Duty penalty & Negligence Protocol rules (ABANDONED + second-stage repeat
 * penalty + system clearing) have been migrated server-side to multi-tenant,
 * org-scoped Supabase `pg_cron` (`20261117000000_multitenant_duty_penalty_pg_cron.sql`).
 *
 * Manual user actions (late proof redemption, tribunal appeal, fault
 * acceptance, and dashboard ABANDONED acknowledgment) remain active in UI hooks/views.
 * Kept as a clean no-op interface for backwards compatibility.
 */
export const useDutyJudge = (
    _currentUser: User | null,
    _isProcessingRef: React.MutableRefObject<Set<string>>,
    _processAction: any,
    _config: any,
    _gameLogs: any[],
    _isLoading: boolean
) => {
    const runDutyChecks = async (
        _today: Date,
        _todayStr: string,
        _holidays: AnnualHoliday[],
        _exceptions: any[],
        _userLeaves: any[]
    ) => {
        // Intentionally no-op: handled on schedule by org-scoped pg_cron (`duty_penalty_cron`).
    };

    return { runDutyChecks };
};
