import { supabase } from '../supabase';
import { differenceInDays } from 'date-fns';

/**
 * 💀 useDeathSystem (The Reaper)
 * หน้าที่: จัดการ Logic ซับซ้อนตอน HP หมด (Death Sequence)
 */
export const handleDeathSequence = async (userId: string, deathNumber: number, stats: any) => {
    try {
        // 1. Snapshot Overdue Tasks
        const { data: tasks } = await supabase
            .from('tasks')
            .select('id, title, end_date, assignee_ids')
            .contains('assignee_ids', [userId])
            .neq('status', 'DONE')
            .lt('end_date', new Date().toISOString());

        const overdueTasks = (tasks || []).map(t => ({
            id: t.id,
            title: t.title,
            dueDate: t.end_date,
            delayDays: differenceInDays(new Date(), new Date(t.end_date))
        }));

        // 2. Snapshot Recent Logs
        const { data: recentLogs } = await supabase
            .from('game_logs')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(10);

        const snapshotData = {
            overdueTasks,
            recentPenalties: (recentLogs || []).map(l => ({
                actionType: l.action_type,
                hpChange: l.hp_change,
                description: l.description,
                createdAt: l.created_at
            })),
            statsAtDeath: stats
        };

        // 3. Insert Death Log Snapshot
        await supabase
            .from('hp_death_logs')
            .insert({
                user_id: userId,
                death_number: deathNumber,
                snapshot_data: snapshotData
            });

        // 4. Notify via Notifications Table (Triggers Line Notification)
        await supabase.from('notifications').insert({
            user_id: userId,
            type: 'GAME_PENALTY',
            title: '💀 HP ของคุณหมดลงแล้ว!',
            message: `คุณตุยเป็นครั้งที่ ${deathNumber} ระบบได้บันทึกประวัติความผิดพลาดไว้แล้ว`,
            is_read: false
        });
    } catch (err) {
        console.error('Death sequence failed:', err);
    }
};
