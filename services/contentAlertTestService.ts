import { supabase } from '../lib/supabase';
import { MasterOption } from '../types';

export interface PreReleaseTestParams {
    leadMinutes: string;
    dailyOverdueExcludedStatuses: string[];
}

export interface DailyOverdueTestParams {
    dailyAlertTime: string;
    dailyOverdueExcludedStatuses: string[];
    masterOptions: MasterOption[];
}

export interface OverdueTestResult {
    type: 'RPC_SUCCESS' | 'RPC_NO_OVERDUE' | 'FALLBACK_SUCCESS' | 'FALLBACK_NO_OVERDUE';
    count: number;
}

/**
 * Service to execute testing and diagnostics for content notification alerts.
 */
export const contentAlertTestService = {
    /**
     * Test 1: Pre-Release Urgent Alert (Single Item Flex - Using Real Database Data)
     */
    async sendPreReleaseTestAlert({ leadMinutes, dailyOverdueExcludedStatuses }: PreReleaseTestParams): Promise<{ title: string }> {
        const { data: userData } = await supabase.auth.getUser();
        const currentUserId = userData.user?.id;

        // Fetch Profiles Map for name resolution
        const { data: profilesData } = await supabase
            .from('profiles')
            .select('id, full_name');
        const profilesMap = new Map<string, string>();
        (profilesData || []).forEach((p: any) => {
            if (p.id && p.full_name) profilesMap.set(p.id, p.full_name);
        });

        // Fetch Channels Map
        const { data: channelsData } = await supabase
            .from('channels')
            .select('id, name, color');
        const channelsMap = new Map<string, { name: string; color: string }>();
        (channelsData || []).forEach((c: any) => {
            if (c.id) channelsMap.set(c.id, { name: c.name || 'ช่องไม่ระบุ', color: c.color || '#6366f1' });
        });

        // Query real candidate content from database (prefer active/upcoming)
        const excludedUpper = dailyOverdueExcludedStatuses.map((s) => s.toUpperCase());
        const { data: candidateContents, error: fetchErr } = await supabase
            .from('contents')
            .select('*')
            .order('start_date', { ascending: false })
            .limit(20);

        if (fetchErr) throw fetchErr;

        // Find best active item or fallback to first available content
        let targetContent = (candidateContents || []).find((c: any) => {
            const st = (c.status || '').toUpperCase();
            return !excludedUpper.includes(st);
        });

        if (!targetContent && candidateContents && candidateContents.length > 0) {
            targetContent = candidateContents[0];
        }

        if (!targetContent) {
            throw new Error('NOT_FOUND_CONTENT');
        }

        // Resolve real channel details
        const chInfo = targetContent.channel_id
            ? channelsMap.get(targetContent.channel_id) || { name: 'ช่องทั่วไป', color: '#6366f1' }
            : { name: 'ช่องทั่วไป', color: '#6366f1' };

        // Resolve real assignee names
        const assignees = Array.isArray(targetContent.assignee_ids)
            ? targetContent.assignee_ids.map((id: string) => profilesMap.get(id) || 'ทีมงาน').join(', ')
            : '-';

        // Resolve real editor names
        const editors = Array.isArray(targetContent.editor_ids)
            ? targetContent.editor_ids.map((id: string) => profilesMap.get(id) || 'ผู้ตัดต่อ').join(', ')
            : '-';

        const testPayload = {
            user_id: currentUserId,
            type: 'CONTENT_PLANNER_ALERT',
            title: `⚠️ [แจ้งเตือนจริง] คอนเทนต์ใกล้ถึงเวลาลง: ${targetContent.title || 'ไม่มีชื่อคลิป'}`,
            message: `เหลือเวลาอีกประมาณ ${leadMinutes} นาที (สถานะปัจจุบัน: ${targetContent.status || 'EDITING'})`,
            related_id: targetContent.id,
            link_path: 'CALENDAR',
            is_read: false,
            line_status: null,
            metadata: {
                content_id: targetContent.id,
                title: targetContent.title || 'ไม่มีชื่อคลิป',
                status: targetContent.status || 'EDITING',
                channel_name: chInfo.name,
                channel_color: chInfo.color,
                target_platform: targetContent.target_platform || ['YOUTUBE', 'TIKTOK', 'FACEBOOK'],
                content_formats: targetContent.content_formats || ['Short Form'],
                scheduled_time: targetContent.scheduled_time || '18:00',
                remaining_minutes: parseInt(leadMinutes, 10) || 30,
                remaining_text: `${leadMinutes} นาที`,
                assignee_names: assignees,
                editor_names: editors,
            },
        };

        const { error } = await supabase.from('notifications').insert(testPayload);
        if (error) throw error;

        return { title: targetContent.title || 'ไม่มีชื่อคลิป' };
    },

    /**
     * Test 2: Morning Overdue Content Summary (Call Real Cron Job RPC on Database)
     */
    async sendDailyOverdueTestSummary({ dailyAlertTime, dailyOverdueExcludedStatuses, masterOptions }: DailyOverdueTestParams): Promise<OverdueTestResult> {
        // 1. Trigger the actual Postgres Cron Job Stored Procedure directly
        const { error: rpcError } = await supabase.rpc('check_daily_overdue_contents');

        if (rpcError) {
            console.error('Database Stored Procedure (check_daily_overdue_contents) failed:', rpcError);
            throw new Error(`Database Stored Procedure (check_daily_overdue_contents) เกิดข้อผิดพลาด: [${rpcError.code || 'ERROR'}] ${rpcError.message || JSON.stringify(rpcError)}`);
        }

        // 2. Check if a new notification record was generated in the last 15 seconds
        const { data: recentNotif } = await supabase
            .from('notifications')
            .select('id, metadata, created_at')
            .eq('type', 'DAILY_OVERDUE_CONTENT_SUMMARY')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        const isRecent = recentNotif && (Date.now() - new Date(recentNotif.created_at).getTime() < 15000);
        if (isRecent) {
            const count = recentNotif.metadata?.total_overdue_count || 0;
            return { type: 'RPC_SUCCESS', count };
        } else {
            return { type: 'RPC_NO_OVERDUE', count: 0 };
        }
    },
};
