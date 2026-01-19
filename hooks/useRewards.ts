
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Reward, User, Redemption } from '../types';
import { useToast } from '../context/ToastContext';

export const useRewards = (currentUser: User | null) => {
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [allRedemptions, setAllRedemptions] = useState<(Redemption & { user?: any })[]>([]); // Added for Admin
    const [isLoading, setIsLoading] = useState(true);
    const { showToast } = useToast();

    const fetchRewards = async () => {
        try {
            const { data, error } = await supabase
                .from('rewards')
                .select('*')
                .order('cost', { ascending: true });

            if (error) throw error;

            if (data) {
                setRewards(data.map((r: any) => ({
                    id: r.id,
                    title: r.title,
                    description: r.description,
                    cost: r.cost,
                    icon: r.icon,
                    isActive: r.is_active
                })));
            }
        } catch (err) {
            console.error('Fetch rewards failed', err);
        } finally {
            setIsLoading(false);
        }
    };

    // NEW: Fetch all redemptions for Admin view
    const fetchAllRedemptions = async () => {
        try {
            const { data, error } = await supabase
                .from('redemptions')
                .select(`
                    *,
                    profiles (id, full_name, avatar_url)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            if (data) {
                setAllRedemptions(data.map((r: any) => ({
                    id: r.id,
                    userId: r.user_id,
                    rewardId: r.reward_id,
                    redeemedAt: new Date(r.created_at),
                    rewardSnapshot: r.reward_snapshot,
                    user: r.profiles ? { name: r.profiles.full_name, avatarUrl: r.profiles.avatar_url } : undefined
                })));
            }
        } catch (err) {
            console.error('Fetch redemptions failed', err);
        }
    };

    const addReward = async (reward: Omit<Reward, 'id'>) => {
        try {
            const { error } = await supabase.from('rewards').insert({
                title: reward.title,
                description: reward.description,
                cost: reward.cost,
                icon: reward.icon,
                is_active: reward.isActive
            });
            if (error) throw error;
            fetchRewards();
            showToast('เพิ่มของรางวัลเรียบร้อย 🎁', 'success');
        } catch (err: any) {
            showToast('เพิ่มไม่สำเร็จ: ' + err.message, 'error');
        }
    };

    const updateReward = async (id: string, updates: Partial<Reward>) => {
        try {
            const payload: any = {};
            if (updates.title) payload.title = updates.title;
            if (updates.description !== undefined) payload.description = updates.description;
            if (updates.cost !== undefined) payload.cost = updates.cost;
            if (updates.icon) payload.icon = updates.icon;
            if (updates.isActive !== undefined) payload.is_active = updates.isActive;

            const { error } = await supabase.from('rewards').update(payload).eq('id', id);
            if (error) throw error;
            fetchRewards();
            showToast('แก้ไขข้อมูลรางวัลแล้ว', 'success');
        } catch (err: any) {
            showToast('แก้ไขไม่สำเร็จ: ' + err.message, 'error');
        }
    };

    const deleteReward = async (id: string) => {
        try {
            const { error } = await supabase.from('rewards').delete().eq('id', id);
            if (error) throw error;
            fetchRewards();
            showToast('ลบรางวัลแล้ว', 'info');
        } catch (err: any) {
            showToast('ลบไม่สำเร็จ: ' + err.message, 'error');
        }
    };

    const redeemReward = async (reward: Reward) => {
        if (!currentUser) return;
        
        if (currentUser.availablePoints < reward.cost) {
            showToast('แต้มไม่พอครับพ้ม! 😅', 'error');
            return;
        }

        if(!confirm(`ยืนยันแลก "${reward.title}" ด้วย ${reward.cost} แต้ม?`)) return;

        try {
            // 1. Deduct Points
            const newBalance = currentUser.availablePoints - reward.cost;
            const { error: profileError } = await supabase
                .from('profiles')
                .update({ available_points: newBalance })
                .eq('id', currentUser.id);

            if (profileError) throw profileError;

            // 2. Log Redemption
            const { error: logError } = await supabase.from('redemptions').insert({
                user_id: currentUser.id,
                reward_id: reward.id,
                reward_snapshot: reward 
            });

            if (logError) throw logError;

            showToast(`แลก "${reward.title}" สำเร็จ! 🎉`, 'success');
        } catch (err: any) {
            console.error(err);
            showToast('แลกรางวัลไม่สำเร็จ: ' + err.message, 'error');
        }
    };

    useEffect(() => {
        fetchRewards();
        if (currentUser?.role === 'ADMIN') {
            fetchAllRedemptions();
        }
    }, [currentUser]);

    return {
        rewards,
        allRedemptions,
        isLoading,
        addReward,
        updateReward,
        deleteReward,
        redeemReward,
        fetchAllRedemptions
    };
};
