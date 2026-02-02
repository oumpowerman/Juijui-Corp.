
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { WeeklyQuest } from '../types';
import { useToast } from '../context/ToastContext';

export const useWeeklyQuests = () => {
    const [quests, setQuests] = useState<WeeklyQuest[]>([]);
    const { showToast } = useToast();

    const fetchQuests = async () => {
        try {
            const { data, error } = await supabase
                .from('weekly_quests')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (data) {
                setQuests(data.map((q: any) => ({
                    id: q.id,
                    title: q.title,
                    weekStartDate: new Date(q.week_start_date),
                    endDate: q.end_date ? new Date(q.end_date) : undefined,
                    channelId: q.channel_id,
                    targetCount: q.target_count,
                    targetPlatform: q.target_platform,
                    // Handle format: DB returns array, ensure it's mapped correctly
                    targetFormat: Array.isArray(q.target_format) ? q.target_format : (q.target_format ? [q.target_format] : []),
                    targetStatus: q.target_status,
                    questType: q.quest_type || 'AUTO',
                    manualProgress: q.manual_progress || 0,
                    // Grouping
                    groupId: q.group_id,
                    groupTitle: q.group_title
                })));
            }
        } catch (err) {
            console.error("Fetch quests failed", err);
        }
    };

    // Realtime Subscription
    useEffect(() => {
        fetchQuests();

        const channel = supabase
            .channel('realtime-weekly-quests')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'weekly_quests' },
                () => {
                    fetchQuests();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const handleAddQuest = async (quest: Omit<WeeklyQuest, 'id'>) => {
        try {
            const newId = crypto.randomUUID();
            const payload = {
                id: newId,
                title: quest.title,
                week_start_date: quest.weekStartDate.toISOString(),
                end_date: quest.endDate ? quest.endDate.toISOString() : null,
                channel_id: quest.channelId || null,
                target_count: quest.targetCount,
                target_platform: quest.targetPlatform || null,
                // Send array to DB
                target_format: (quest.targetFormat && quest.targetFormat.length > 0) ? quest.targetFormat : null,
                target_status: quest.targetStatus || null,
                quest_type: quest.questType,
                manual_progress: quest.manualProgress || 0,
                group_id: quest.groupId || null,
                group_title: quest.groupTitle || null
            };

            const { error } = await supabase.from('weekly_quests').insert(payload);
            if (error) throw error;

            showToast('สร้าง Quest ใหม่แล้ว! 🎯', 'success');
        } catch (err: any) {
            console.error(err);
            showToast('สร้าง Quest ไม่สำเร็จ: ' + err.message, 'error');
        }
    };

    const handleDeleteQuest = async (id: string) => {
        try {
            const { error } = await supabase.from('weekly_quests').delete().eq('id', id);
            if (error) throw error;
            showToast('ลบ Quest เรียบร้อย', 'info');
        } catch (err) {
            showToast('ลบไม่สำเร็จ', 'error');
        }
    };

    // New: Update manual progress
    const updateManualProgress = async (id: string, newProgress: number) => {
        try {
            // Optimistic Update for instant UI feel
            setQuests(prev => prev.map(q => q.id === id ? { ...q, manualProgress: newProgress } : q));

            const { error } = await supabase
                .from('weekly_quests')
                .update({ manual_progress: newProgress })
                .eq('id', id);

            if (error) throw error;
        } catch (err) {
            // Rollback is handled by next fetch if error occurs
            console.error('Update progress failed', err);
        }
    };

    // Updated: Update Quest Details (Flexible)
    const updateQuest = async (id: string, updates: Partial<WeeklyQuest>) => {
        try {
            // Optimistic Update
            setQuests(prev => prev.map(q => q.id === id ? { ...q, ...updates } : q));

            const payload: any = {};
            if (updates.title !== undefined) payload.title = updates.title;
            if (updates.targetCount !== undefined) payload.target_count = updates.targetCount;
            if (updates.targetPlatform !== undefined) payload.target_platform = updates.targetPlatform;
            if (updates.targetFormat !== undefined) payload.target_format = updates.targetFormat;
            if (updates.targetStatus !== undefined) payload.target_status = updates.targetStatus;
            if (updates.questType !== undefined) payload.quest_type = updates.questType;
            // Can add group updates later if needed

            const { error } = await supabase
                .from('weekly_quests')
                .update(payload)
                .eq('id', id);

            if (error) throw error;
            showToast('แก้ไข Quest เรียบร้อย ✨', 'success');
        } catch (err: any) {
             console.error('Update quest failed', err);
             showToast('แก้ไขไม่สำเร็จ: ' + err.message, 'error');
             fetchQuests(); // Revert on error
        }
    };

    return {
        quests,
        fetchQuests,
        handleAddQuest,
        handleDeleteQuest,
        updateManualProgress,
        updateQuest
    };
};
