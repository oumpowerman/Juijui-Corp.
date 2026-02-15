
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Goal, User } from '../types';
import { useToast } from '../context/ToastContext';

export const useGoals = (currentUser: User) => {
    const [goals, setGoals] = useState<Goal[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { showToast } = useToast();

    const fetchGoals = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('goals')
                .select(`
                    *,
                    goal_owners (user_id),
                    goal_boosts (user_id)
                `)
                .eq('is_archived', false)
                .order('deadline', { ascending: true });

            if (error) throw error;

            if (data) {
                setGoals(data.map((g: any) => ({
                    id: g.id,
                    title: g.title,
                    platform: g.platform,
                    currentValue: g.current_value,
                    targetValue: g.target_value,
                    deadline: new Date(g.deadline),
                    channelId: g.channel_id,
                    isArchived: g.is_archived,
                    rewardXp: g.reward_xp || 500,
                    rewardCoin: g.reward_coin || 100,
                    owners: g.goal_owners?.map((o: any) => o.user_id) || [],
                    boosts: g.goal_boosts?.map((b: any) => b.user_id) || []
                })));
            }
        } catch (err: any) {
            console.error('Fetch goals error:', err.message || err);
        } finally {
            setIsLoading(false);
        }
    };

    // Realtime Subscription
    useEffect(() => {
        fetchGoals();

        const channel = supabase
            .channel('realtime-goals')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'goals' },
                () => fetchGoals()
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'goal_owners' },
                () => fetchGoals()
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'goal_boosts' },
                () => fetchGoals()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const addGoal = async (goal: Omit<Goal, 'id' | 'owners' | 'boosts'>) => {
        try {
            const payload = {
                title: goal.title,
                platform: goal.platform,
                current_value: goal.currentValue,
                target_value: goal.targetValue,
                deadline: goal.deadline.toISOString(),
                channel_id: goal.channelId || null,
                is_archived: false,
                reward_xp: goal.rewardXp,
                reward_coin: goal.rewardCoin
            };

            const { data, error } = await supabase.from('goals').insert(payload).select().single();
            if (error) throw error;
            
            showToast('สร้างเป้าหมายใหม่สำเร็จ 🎯', 'success');
        } catch (err: any) {
            console.error(err);
            showToast('สร้างไม่สำเร็จ: ' + (err.message || 'Unknown error'), 'error');
        }
    };

    // NEW: Full Update Function
    const updateGoal = async (goal: Goal) => {
        try {
            const payload = {
                title: goal.title,
                platform: goal.platform,
                current_value: goal.currentValue,
                target_value: goal.targetValue,
                deadline: goal.deadline.toISOString(),
                channel_id: goal.channelId || null,
                reward_xp: goal.rewardXp,
                reward_coin: goal.rewardCoin
            };

            const { error } = await supabase
                .from('goals')
                .update(payload)
                .eq('id', goal.id);

            if (error) throw error;

            // Optimistic Update
            setGoals(prev => prev.map(g => g.id === goal.id ? goal : g));
            showToast('แก้ไขเป้าหมายเรียบร้อย ✨', 'success');
        } catch (err: any) {
            console.error(err);
            showToast('แก้ไขไม่สำเร็จ: ' + err.message, 'error');
        }
    };

    const updateGoalValue = async (id: string, currentValue: number) => {
        try {
            setGoals(prev => prev.map(g => g.id === id ? { ...g, currentValue } : g));
            await supabase.from('goals').update({ current_value: currentValue }).eq('id', id);
            showToast('อัปเดตยอดล่าสุดแล้ว! 📈', 'success');
        } catch (err: any) {
            showToast('อัปเดตไม่สำเร็จ', 'error');
        }
    };

    const deleteGoal = async (id: string) => {
        // Confirm logic moved to UI component (GoalView)
        try {
            await supabase.from('goals').delete().eq('id', id);
            showToast('ลบเป้าหมายแล้ว', 'info');
        } catch(err: any) {
            showToast('ลบไม่สำเร็จ', 'error');
        }
    };

    // --- New Features ---
    const toggleOwner = async (goalId: string, userId: string, isOwner: boolean) => {
        try {
            if (isOwner) {
                // Remove
                await supabase.from('goal_owners').delete().eq('goal_id', goalId).eq('user_id', userId);
            } else {
                // Add
                await supabase.from('goal_owners').insert({ goal_id: goalId, user_id: userId });
            }
        } catch (err) {
            console.error(err);
        }
    };

    const toggleBoost = async (goalId: string, isBoosted: boolean) => {
        try {
            if (isBoosted) {
                await supabase.from('goal_boosts').delete().eq('goal_id', goalId).eq('user_id', currentUser.id);
            } else {
                await supabase.from('goal_boosts').insert({ goal_id: goalId, user_id: currentUser.id });
                showToast('ส่งพลังเชียร์แล้ว! 🔥', 'success');
            }
        } catch (err) {
            console.error(err);
        }
    };

    return {
        goals,
        isLoading,
        addGoal,
        updateGoal, // Exported
        updateGoalValue,
        deleteGoal,
        toggleOwner,
        toggleBoost,
        refreshGoals: fetchGoals
    };
};
