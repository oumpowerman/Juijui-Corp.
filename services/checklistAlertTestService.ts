import { supabase } from '../lib/supabase';

export interface ChecklistAlertTestResult {
    count: number;
    triggered: boolean;
    isMockFallback?: boolean;
}

export const checklistAlertTestService = {
    /**
     * Executes testing and verification for Company Checklist Overdue LINE Alerts.
     * First attempts to run the live Database Stored Procedure (check_daily_company_checklist_overdue).
     * If all checklists are up to date (0 overdue items), sends a test preview notification
     * so admins can immediately verify that LINE Bot & Flex Carousel render accurately.
     */
    async testCompanyChecklistAlert(): Promise<ChecklistAlertTestResult> {
        let rpcExecuted = false;

        // 1. Trigger the actual Postgres Stored Procedure
        try {
            const { error: rpcError } = await supabase.rpc('check_daily_company_checklist_overdue');
            if (!rpcError) {
                rpcExecuted = true;
            } else {
                console.warn('RPC check_daily_company_checklist_overdue returned error (will fallback to sample test):', rpcError);
            }
        } catch (e) {
            console.warn('RPC execution exception:', e);
        }

        // 2. Check if a real notification was generated in the last 15 seconds
        try {
            const { data: recentNotif } = await supabase
                .from('notifications')
                .select('id, metadata, created_at')
                .eq('type', 'COMPANY_CHECKLIST_OVERDUE_ALERT')
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            const isRecent = recentNotif && (Date.now() - new Date(recentNotif.created_at).getTime() < 15000);
            if (isRecent) {
                const count = recentNotif.metadata?.total_overdue_count || 1;
                return { count, triggered: true, isMockFallback: false };
            }
        } catch (_) {}

        // 3. Fallback to generating a preview test notification so LINE group can verify the Flex layout
        const { data: userData } = await supabase.auth.getUser();
        const adminUserId = userData?.user?.id;
        if (!adminUserId) {
            throw new Error('ไม่พบข้อมูลผู้ใช้ปัจจุบันสำหรับส่งข้อความทดสอบ');
        }

        const dateStr = new Date().toLocaleDateString('th-TH', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            timeZone: 'Asia/Bangkok'
        });

        const testPayload = {
            user_id: adminUserId,
            type: 'COMPANY_CHECKLIST_OVERDUE_ALERT',
            title: '⚠️ [ทดสอบระบบ] สรุปรายงานเช็คลิสต์บริษัทค้างตรวจ',
            message: 'ทดสอบส่งข้อความแจ้งเตือนเช็คลิสต์ค้างตรวจเข้า LINE (จำลองตัวอย่าง 2 หัวข้อ)',
            is_read: false,
            link_path: 'COMPANY_CHECKLIST',
            metadata: {
                summary_time: '10:00',
                date_str: dateStr,
                total_overdue_count: 2,
                app_name: 'Kontent OS',
                overdue_checklists: [
                    {
                        id: 'test-preview-1',
                        title: 'ตรวจเช็คอุปกรณ์กล้องและไฟสตูดิโอ A',
                        cycle: 'DAILY',
                        cycle_label: 'รอบประจำวัน',
                        color: 'emerald',
                        icon: 'ShieldCheck',
                        days_overdue: 1,
                        total_items: 8,
                        responsible_roles: 'ฝ่ายกล้อง / ช่างไฟ',
                        last_submitted_at: 'เมื่อวาน 18:30 น.',
                        last_submitted_by: 'สมชาย รักงาน'
                    },
                    {
                        id: 'test-preview-2',
                        title: 'ตรวจความเรียบร้อยและสำรองข้อมูล Storage ประจำสัปดาห์',
                        cycle: 'WEEKLY',
                        cycle_label: 'รอบประจำสัปดาห์',
                        color: 'sky',
                        icon: 'HardDrive',
                        days_overdue: 3,
                        total_items: 5,
                        responsible_roles: 'ทีมตัดต่อ / System Admin',
                        last_submitted_at: '25/09/2026 17:00 น.',
                        last_submitted_by: 'แอดมินระบบ'
                    }
                ]
            }
        };

        const { error: insertErr } = await supabase.from('notifications').insert(testPayload);
        if (insertErr) throw insertErr;

        return { count: 2, triggered: true, isMockFallback: true };
    }
};
