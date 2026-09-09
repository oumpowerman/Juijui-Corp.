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
     * Test 2: Morning Overdue Content Summary (Call Real Cron Job RPC / Real Database Data)
     */
    async sendDailyOverdueTestSummary({ dailyAlertTime, dailyOverdueExcludedStatuses, masterOptions }: DailyOverdueTestParams): Promise<OverdueTestResult> {
        // 1. Trigger the actual Postgres Cron Job Stored Procedure directly
        const { error: rpcError } = await supabase.rpc('check_daily_overdue_contents');

        if (!rpcError) {
            // Check if a new notification record was generated in the last 15 seconds
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
        }

        // 2. Fallback: If RPC is not registered on DB instance, run exact real SQL logic from client
        console.warn('RPC check_daily_overdue_contents returned error or not found, calculating real DB state directly:', rpcError);

        const { data: userData } = await supabase.auth.getUser();
        const currentUserId = userData.user?.id;

        // Fetch Profiles Map
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
            if (c.id) channelsMap.set(c.id, { name: c.name || 'ช่องทั่วไป', color: c.color || '#6366f1' });
        });

        // Query only real scheduled contents from database
        const { data: allContents, error: fetchErr } = await supabase
            .from('contents')
            .select('*')
            .is('is_unscheduled', false)
            .order('start_date', { ascending: true });

        if (fetchErr) throw fetchErr;

        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        const excludedUpper = dailyOverdueExcludedStatuses.map((s) => s.toUpperCase());

        // Filter strictly real overdue contents (Scheduled datetime < Now and not excluded)
        const overdueItems: any[] = [];
        (allContents || []).forEach((c: any) => {
            const st = (c.status || 'IDEA').toUpperCase();

            // Smart exclusion check: exact match, keyword inclusion, and terminal keywords
            const isExcluded =
                excludedUpper.some((ex) => ex.trim() !== '' && (st.includes(ex.trim()) || ex.trim().includes(st))) ||
                st.includes('DONE') ||
                st.includes('PUBLISH') ||
                st.includes('POSTED') ||
                st.includes('COMPLETE') ||
                st.includes('APPROVE') ||
                st.includes('SUCCESS') ||
                st.includes('PASSED');

            if (isExcluded) return; // Skip completed/published

            const targetDateStr = (c.end_date || c.start_date || todayStr).split('T')[0];
            const timeStr = c.scheduled_time || '18:00';

            // Compare scheduled datetime with current time
            const [hh, mm] = timeStr.split(':').map((v: string) => parseInt(v, 10) || 0);
            const scheduledDate = new Date(targetDateStr);
            scheduledDate.setHours(hh, mm, 0, 0);

            if (scheduledDate < now) {
                overdueItems.push({
                    ...c,
                    target_date_str: targetDateStr,
                    scheduled_time_str: timeStr,
                });
            }
        });

        if (overdueItems.length === 0) {
            return { type: 'FALLBACK_NO_OVERDUE', count: 0 };
        }

        // Group real overdue contents by channel
        const channelGroupsMap = new Map<string, any>();

        overdueItems.forEach((c: any) => {
            const chId = c.channel_id || 'general';
            const chInfo = channelsMap.get(chId) || { name: 'ช่องทั่วไป', color: '#6366f1' };

            if (!channelGroupsMap.has(chId)) {
                channelGroupsMap.set(chId, {
                    channel_id: chId,
                    channel_name: chInfo.name,
                    channel_color: chInfo.color,
                    items: [],
                });
            }

            // Resolve real member names
            const assignees = Array.isArray(c.assignee_ids)
                ? c.assignee_ids.map((id: string) => profilesMap.get(id) || 'ทีมงาน').join(', ')
                : '-';
            const editors = Array.isArray(c.editor_ids)
                ? c.editor_ids.map((id: string) => profilesMap.get(id) || 'ผู้ตัดต่อ').join(', ')
                : '-';

            const targetDateRaw = (c.end_date || c.start_date || todayStr).split('T')[0];
            let formattedTargetDate = targetDateRaw;
            if (targetDateRaw.includes('-')) {
                const parts = targetDateRaw.split('-');
                if (parts.length === 3) {
                    formattedTargetDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
                }
            }

            const hasTime = !!(c.scheduled_time && c.scheduled_time.trim() !== '');
            const timeStr = hasTime ? c.scheduled_time.trim() : '';
            const formattedDatetime = hasTime
                ? `${formattedTargetDate} ${timeStr} น.`
                : `${formattedTargetDate} (ไม่ระบุเวลา)`;

            // Resolve Status Label & Color from master_options
            const statusOpt = masterOptions.find((opt) =>
                (opt.type === 'STATUS' || opt.type === 'CONTENT_STATUS') && opt.key === c.status
            );
            const statusLabel = statusOpt?.label || c.status || 'IDEA';
            const statusColor = statusOpt?.color || '#64748b';

            channelGroupsMap.get(chId).items.push({
                id: c.id,
                title: c.title || 'ไม่มีชื่อคลิป',
                scheduled_time: hasTime ? timeStr : null,
                target_date: formattedTargetDate,
                formatted_datetime: formattedDatetime,
                status: c.status || 'EDITING',
                status_label: statusLabel,
                status_color: statusColor,
                target_platform: c.target_platform || ['YOUTUBE', 'TIKTOK'],
                assignee_names: assignees,
                editor_names: editors,
            });
        });

        const channelGroups = Array.from(channelGroupsMap.values());
        const totalCount = overdueItems.length;
        const dateStr = new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });

        const testPayload = {
            user_id: currentUserId,
            type: 'DAILY_OVERDUE_CONTENT_SUMMARY',
            title: `⚠️ [สรุปจริง ${dailyAlertTime} น.] รายงานคลิปค้างลงแยกตามช่อง`,
            message: `⚠️ สรุปรายงานคลิปค้างลงประจำเช้า ${dailyAlertTime} น.\n\nพบคลิปที่เลยกำหนดลงทั้งหมด ${totalCount} รายการ\n\nกรุณาตรวจสอบและอัปเดตสถานะครับ`,
            link_path: 'CALENDAR',
            is_read: false,
            line_status: null,
            metadata: {
                date_str: dateStr,
                total_overdue_count: totalCount,
                channels: channelGroups,
                app_name: 'Kontent OS',
            },
        };

        const { error } = await supabase.from('notifications').insert(testPayload);
        if (error) throw error;

        return { type: 'FALLBACK_SUCCESS', count: totalCount };
    },
};
