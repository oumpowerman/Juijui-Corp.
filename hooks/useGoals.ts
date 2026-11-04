import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Goal, User, Channel, Platform } from '../types';
import { useToast } from '../context/ToastContext';
import { getActiveOrgIdSync, getOrgChannelName } from '../lib/tenantStorage';

const DEFAULT_EMPTY_CHANNELS: Channel[] = [];

/**
 * Computes the follower count of a single channel for a given platform ('ALL' or specific platform).
 */
export const getChannelFollowersByPlatform = (
    channel: Channel | undefined | null,
    platform: Platform | 'ALL'
): number => {
    if (!channel || !channel.followers || typeof channel.followers !== 'object') return 0;
    const normPlat = (platform || 'ALL').toUpperCase();
    if (normPlat === 'ALL') {
        return Object.entries(channel.followers).reduce((sum, [key, val]) => {
            if (key.startsWith('_')) return sum;
            const num = Number(val);
            return sum + (!isNaN(num) && num > 0 ? num : 0);
        }, 0);
    }
    const directVal = (channel.followers as any)[normPlat] ?? (channel.followers as any)[platform];
    const num = Number(directVal);
    return !isNaN(num) && num > 0 ? num : 0;
};

/**
 * Computes the real-time follower count for a Goal based on its channelId and platform.
 */
export const computeGoalFollowerValue = (
    params: { channelId?: string | null; platform: Platform | 'ALL' },
    channels: Channel[]
): number => {
    if (!channels || channels.length === 0) return 0;
    if (params.channelId) {
        const target = channels.find(c => c.id === params.channelId);
        return getChannelFollowersByPlatform(target, params.platform);
    }
    return channels.reduce((sum, ch) => sum + getChannelFollowersByPlatform(ch, params.platform), 0);
};

/**
 * Gets the latest follower sync timestamp relevant to a Goal.
 */
export const getGoalLastSyncedAt = (
    params: { channelId?: string | null },
    channels: Channel[]
): string | null => {
    if (!channels || channels.length === 0) return null;
    if (params.channelId) {
        const target = channels.find(c => c.id === params.channelId);
        if (!target) return null;
        return target.last_sync_followers_at || (target.followers as any)?._last_synced_at || null;
    }
    let latest: string | null = null;
    for (const c of channels) {
        const ts = c.last_sync_followers_at || (c.followers as any)?._last_synced_at;
        if (ts && (!latest || new Date(ts).getTime() > new Date(latest).getTime())) {
            latest = ts;
        }
    }
    return latest;
};

export interface GoalLiveSyncResult {
    success: boolean;
    previousValue: number;
    newValue: number;
    diff: number;
    isNewlyCompleted: boolean;
    syncedAt: string;
    platformBreakdown: {
        platform: string;
        previousCount: number;
        newCount: number;
        diff: number;
        success: boolean;
        error?: string;
    }[];
    errorMessage?: string;
}

export const useGoals = (currentUser?: User | null, externalChannels: Channel[] = DEFAULT_EMPTY_CHANNELS) => {
    const [goals, setGoals] = useState<Goal[]>([]);
    const [liveChannels, setLiveChannels] = useState<Channel[]>(externalChannels);
    const [isLoading, setIsLoading] = useState(true);
    const { showToast } = useToast();

    // Cache latest externalChannels in a stable ref to prevent array recreation from triggering infinite loops
    const externalChannelsRef = useRef(externalChannels);
    useEffect(() => {
        externalChannelsRef.current = externalChannels;
        if (externalChannels && externalChannels.length > 0) {
            setLiveChannels(externalChannels);
        }
    }, [externalChannels]);

    // Concurrency lock to prevent multiple rapid parallel fetches
    const isFetchingRef = useRef(false);
    const lastFetchTimeRef = useRef(0);

    const rewardGoalOwnersIfNeeded = useCallback(async (goal: Goal, newCurrentValue: number) => {
        const wasCompleted = goal.currentValue >= goal.targetValue;
        const isNowCompleted = newCurrentValue >= goal.targetValue;

        if (!wasCompleted && isNowCompleted && goal.owners.length > 0) {
            const now = new Date();
            const isLate = now > new Date(goal.deadline);
            const multiplier = isLate ? (goal.isRedeemed ? 0.3 : 0.5) : 1.0;

            const finalXp = Math.round((goal.rewardXp || 0) * multiplier);
            const finalCoin = Math.round((goal.rewardCoin || 0) * multiplier);

            for (const userId of goal.owners) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('xp, coins')
                    .eq('id', userId)
                    .maybeSingle();
                if (profile) {
                    await supabase
                        .from('profiles')
                        .update({
                            xp: (profile.xp || 0) + finalXp,
                            coins: (profile.coins || 0) + finalCoin,
                        })
                        .eq('id', userId);
                }
            }

            const rewardMessage = isLate
                ? `ภารกิจสำเร็จ (ล่าช้า: ได้รับรางวัลลดลง)! +${finalXp} XP, +${finalCoin} Coins`
                : `ยินดีด้วย! เป้าหมายสำเร็จและจ่ายรางวัลให้ทีมแล้ว +${finalXp} XP, +${finalCoin} Coins`;

            showToast(rewardMessage, isLate ? 'info' : 'success');
            return true;
        }
        return false;
    }, [showToast]);

    const fetchGoalsAndReconcile = useCallback(async (silent = false) => {
        const now = Date.now();
        // Prevent concurrent or hyper-frequent fetches
        if (isFetchingRef.current) return;
        if (silent && now - lastFetchTimeRef.current < 1000) return;

        isFetchingRef.current = true;
        lastFetchTimeRef.current = now;

        if (!silent) setIsLoading(true);
        try {
            const [{ data: goalsData, error: goalsErr }, { data: channelsData, error: chErr }] = await Promise.all([
                supabase
                    .from('goals')
                    .select(`
                        *,
                        goal_owners (user_id),
                        goal_boosts (user_id)
                    `)
                    .eq('is_archived', false)
                    .order('deadline', { ascending: true }),
                supabase
                    .from('channels')
                    .select('*')
                    .order('created_at', { ascending: true }),
            ]);

            if (goalsErr) throw goalsErr;

            let mappedChannels: Channel[] = externalChannelsRef.current;
            if (!chErr && channelsData) {
                mappedChannels = channelsData.map((c: any) => ({
                    ...c,
                    platforms: Array.isArray(c.platforms) ? c.platforms : ['OTHER'],
                    logoUrl: c.logo_url || c.logoUrl,
                    social_links: c.social_links || {},
                    followers: c.followers || {},
                    email: c.email || '',
                    last_sync_followers_at: c.last_sync_followers_at || c.followers?._last_synced_at || null,
                    meta_api: c.meta_api || c.social_links?._meta_api || undefined,
                }));
                setLiveChannels(mappedChannels);
            }

            if (goalsData) {
                const mappedGoals: Goal[] = goalsData.map((g: any) => ({
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
                    isRedeemed: g.is_redeemed || false,
                    extensionCount: g.extension_count || 0,
                    owners: g.goal_owners?.map((o: any) => o.user_id) || [],
                    boosts: g.goal_boosts?.map((b: any) => b.user_id) || [],
                }));

                // Reconcile each goal's currentValue with actual channel followers
                const reconciledGoals: Goal[] = [];
                for (const g of mappedGoals) {
                    const liveValue = computeGoalFollowerValue(
                        { channelId: g.channelId, platform: g.platform },
                        mappedChannels
                    );
                    if (mappedChannels.length > 0 && liveValue !== g.currentValue) {
                        const updatedGoal = { ...g, currentValue: liveValue };
                        reconciledGoals.push(updatedGoal);
                        // Persist updated current_value in background & check completion reward
                        supabase
                            .from('goals')
                            .update({ current_value: liveValue })
                            .eq('id', g.id)
                            .then(({ error }) => {
                                if (!error) {
                                    rewardGoalOwnersIfNeeded(g, liveValue);
                                }
                            });
                    } else {
                        reconciledGoals.push(g);
                    }
                }

                setGoals(reconciledGoals);
            }
        } catch (err: any) {
            // Handle offline or transient network drops gracefully without breaking the app
            console.warn('[useGoals] Fetch goals paused (offline/network drop):', err?.message || err);
        } finally {
            isFetchingRef.current = false;
            if (!silent) setIsLoading(false);
        }
    }, [rewardGoalOwnersIfNeeded]);

    // Keep stable callback reference for subscriptions
    const fetchGoalsRef = useRef(fetchGoalsAndReconcile);
    useEffect(() => {
        fetchGoalsRef.current = fetchGoalsAndReconcile;
    }, [fetchGoalsAndReconcile]);

    // Realtime Subscription (Tenant-scoped channel + Workspace switch listener)
    useEffect(() => {
        // Initial fetch once on mount
        fetchGoalsRef.current(false);

        const channelName = getOrgChannelName('realtime-goals-and-channels');
        const channel = supabase
            .channel(channelName)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'goals' },
                () => fetchGoalsRef.current(true)
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'goal_owners' },
                () => fetchGoalsRef.current(true)
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'goal_boosts' },
                () => fetchGoalsRef.current(true)
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'channels' },
                () => fetchGoalsRef.current(true)
            )
            .subscribe();

        const handleWorkspaceSwitch = () => {
            setGoals([]);
            fetchGoalsRef.current(false);
        };
        window.addEventListener('org-workspace-switched', handleWorkspaceSwitch);

        return () => {
            supabase.removeChannel(channel);
            window.removeEventListener('org-workspace-switched', handleWorkspaceSwitch);
        };
    }, []);


    const addGoal = async (goal: Omit<Goal, 'id' | 'owners' | 'boosts'>) => {
        try {
            const syncedCurrentValue = computeGoalFollowerValue(
                { channelId: goal.channelId, platform: goal.platform },
                liveChannels
            );

            const payload = {
                title: goal.title,
                platform: goal.platform,
                current_value: syncedCurrentValue,
                target_value: goal.targetValue,
                deadline: goal.deadline.toISOString(),
                channel_id: goal.channelId || null,
                is_archived: false,
                reward_xp: goal.rewardXp,
                reward_coin: goal.rewardCoin,
            };

            const { error } = await supabase.from('goals').insert(payload).select().single();
            if (error) throw error;

            showToast('สร้างเป้าหมายใหม่และซิงค์ยอดผู้ติดตามเริ่มต้นสำเร็จ', 'success');
            await fetchGoalsAndReconcile(true);
        } catch (err: any) {
            console.error(err);
            showToast('สร้างไม่สำเร็จ: ' + (err.message || 'Unknown error'), 'error');
        }
    };

    const updateGoal = async (goal: Goal) => {
        try {
            const syncedCurrentValue = computeGoalFollowerValue(
                { channelId: goal.channelId, platform: goal.platform },
                liveChannels
            );

            const payload = {
                title: goal.title,
                platform: goal.platform,
                current_value: syncedCurrentValue,
                target_value: goal.targetValue,
                deadline: goal.deadline.toISOString(),
                channel_id: goal.channelId || null,
                reward_xp: goal.rewardXp,
                reward_coin: goal.rewardCoin,
            };

            const { error } = await supabase
                .from('goals')
                .update(payload)
                .eq('id', goal.id);

            if (error) throw error;

            const updatedGoalObj = { ...goal, currentValue: syncedCurrentValue };
            setGoals(prev => prev.map(g => (g.id === goal.id ? updatedGoalObj : g)));
            await rewardGoalOwnersIfNeeded(goal, syncedCurrentValue);
            showToast('แก้ไขเป้าหมายและอัปเดตยอดซิงค์เรียบร้อย', 'success');
        } catch (err: any) {
            console.error(err);
            showToast('แก้ไขไม่สำเร็จ: ' + err.message, 'error');
        }
    };

    const updateGoalValue = async (id: string, currentValue: number) => {
        try {
            const goal = goals.find(g => g.id === id);
            if (!goal) return;

            setGoals(prev => prev.map(g => (g.id === id ? { ...g, currentValue } : g)));
            await supabase.from('goals').update({ current_value: currentValue }).eq('id', id);

            const rewarded = await rewardGoalOwnersIfNeeded(goal, currentValue);
            if (!rewarded) {
                showToast('อัปเดตยอดผู้ติดตามล่าสุดแล้ว', 'success');
            }
        } catch (err: any) {
            showToast('อัปเดตไม่สำเร็จ', 'error');
        }
    };

    /**
     * Triggers a live follower sync from social platforms via the backend API
     * and updates both the Channel(s) and the Goal's currentValue.
     */
    const syncGoalFollowersFromApi = async (goal: Goal): Promise<GoalLiveSyncResult> => {
        const previousValue = goal.currentValue;
        const activeOrgId = getActiveOrgIdSync();
        const targetChannels = goal.channelId
            ? liveChannels.filter(c => c.id === goal.channelId)
            : liveChannels.filter(c => (c.status || 'ACTIVE') === 'ACTIVE');

        if (targetChannels.length === 0) {
            return {
                success: false,
                previousValue,
                newValue: previousValue,
                diff: 0,
                isNewlyCompleted: false,
                syncedAt: new Date().toISOString(),
                platformBreakdown: [],
                errorMessage: 'ไม่พบข้อมูลช่องสำหรับซิงค์ยอดผู้ติดตาม',
            };
        }

        try {
            const aggregatedBreakdownMap: Record<
                string,
                { platform: string; previousCount: number; newCount: number; diff: number; success: boolean; error?: string }
            > = {};

            let latestSyncTime = new Date().toISOString();

            // Sync each relevant channel via /api/channels/:id/sync-followers
            await Promise.all(
                targetChannels.map(async ch => {
                    const res = await fetch(`/api/channels/${ch.id}/sync-followers`, {
                        method: 'POST',
                        headers: {
                            Accept: 'application/json',
                            'Content-Type': 'application/json',
                            'x-org-id': activeOrgId,
                        },
                    });
                    const data = await res.json();
                    if (!res.ok || !data?.success) {
                        throw new Error(data?.error || `ไม่สามารถดึงข้อมูลช่อง ${ch.name} ได้`);
                    }

                    const result = data.result;
                    if (result?.last_sync_followers_at) {
                        latestSyncTime = result.last_sync_followers_at;
                    }

                    if (Array.isArray(result?.platforms)) {
                        for (const p of result.platforms) {
                            const pKey = String(p.platform || '').toUpperCase();
                            if (goal.platform !== 'ALL' && pKey !== goal.platform) continue;

                            const prevC = Number(p.previousCount) || 0;
                            const newC = Number(p.newCount ?? p.previousCount) || 0;
                            if (!aggregatedBreakdownMap[pKey]) {
                                aggregatedBreakdownMap[pKey] = {
                                    platform: pKey,
                                    previousCount: prevC,
                                    newCount: newC,
                                    diff: newC - prevC,
                                    success: Boolean(p.success),
                                    error: p.error,
                                };
                            } else {
                                aggregatedBreakdownMap[pKey].previousCount += prevC;
                                aggregatedBreakdownMap[pKey].newCount += newC;
                                aggregatedBreakdownMap[pKey].diff += newC - prevC;
                                aggregatedBreakdownMap[pKey].success =
                                    aggregatedBreakdownMap[pKey].success || Boolean(p.success);
                            }
                        }
                    }
                })
            );

            // Refetch latest channels & goals from DB to guarantee consistency
            const { data: freshChannelsData } = await supabase
                .from('channels')
                .select('*')
                .order('created_at', { ascending: true });

            let updatedChannels = liveChannels;
            if (freshChannelsData) {
                updatedChannels = freshChannelsData.map((c: any) => ({
                    ...c,
                    platforms: Array.isArray(c.platforms) ? c.platforms : ['OTHER'],
                    logoUrl: c.logo_url || c.logoUrl,
                    social_links: c.social_links || {},
                    followers: c.followers || {},
                    email: c.email || '',
                    last_sync_followers_at: c.last_sync_followers_at || c.followers?._last_synced_at || null,
                    meta_api: c.meta_api || c.social_links?._meta_api || undefined,
                }));
                setLiveChannels(updatedChannels);
            }

            const newValue = computeGoalFollowerValue(
                { channelId: goal.channelId, platform: goal.platform },
                updatedChannels
            );
            const diff = newValue - previousValue;
            const wasCompleted = previousValue >= goal.targetValue;
            const isNowCompleted = newValue >= goal.targetValue;
            const isNewlyCompleted = !wasCompleted && isNowCompleted;

            // Update goal value in state and DB
            setGoals(prev => prev.map(g => (g.id === goal.id ? { ...g, currentValue: newValue } : g)));
            await supabase.from('goals').update({ current_value: newValue }).eq('id', goal.id);

            await rewardGoalOwnersIfNeeded(goal, newValue);

            if (!isNewlyCompleted) {
                if (diff !== 0) {
                    const sign = diff > 0 ? `+${diff.toLocaleString()}` : diff.toLocaleString();
                    showToast(`ซิงค์ยอดผู้ติดตามสำเร็จ (${sign} รวม ${newValue.toLocaleString()} คน)`, 'success');
                } else {
                    showToast(`ตรวจสอบแล้ว ยอดผู้ติดตามเป็นปัจจุบัน (${newValue.toLocaleString()} คน)`, 'info');
                }
            }

            return {
                success: true,
                previousValue,
                newValue,
                diff,
                isNewlyCompleted,
                syncedAt: latestSyncTime,
                platformBreakdown: Object.values(aggregatedBreakdownMap),
            };
        } catch (err: any) {
            console.error('[useGoals] syncGoalFollowersFromApi error:', err);
            showToast(err?.message || 'ดึงข้อมูลผู้ติดตามไม่สำเร็จ', 'error');
            return {
                success: false,
                previousValue,
                newValue: previousValue,
                diff: 0,
                isNewlyCompleted: false,
                syncedAt: new Date().toISOString(),
                platformBreakdown: [],
                errorMessage: err?.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อระบบซิงค์ผู้ติดตาม',
            };
        }
    };

    const redeemGoal = async (id: string) => {
        try {
            const { error } = await supabase.from('goals').update({ is_redeemed: true }).eq('id', id);
            if (error) throw error;

            setGoals(prev => prev.map(g => (g.id === id ? { ...g, isRedeemed: true } : g)));
            showToast('ปลดล็อกภารกิจเพื่อกู้หน้าคืน! (รางวัลจะลดลงเหลือ 30%)', 'success');
        } catch (err: any) {
            showToast('ขอคืนชีพไม่สำเร็จ', 'error');
        }
    };

    const deleteGoal = async (id: string) => {
        try {
            await supabase.from('goals').delete().eq('id', id);
            setGoals(prev => prev.filter(g => g.id !== id));
            showToast('ลบเป้าหมายแล้ว', 'info');
        } catch (err: any) {
            showToast('ลบไม่สำเร็จ', 'error');
        }
    };

    const toggleOwner = async (goalId: string, userId: string, isCurrentlyOwner: boolean) => {
        const previousGoals = [...goals];
        setGoals(prev =>
            prev.map(g => {
                if (g.id === goalId) {
                    const newOwners = isCurrentlyOwner
                        ? g.owners.filter(uid => uid !== userId)
                        : [...g.owners, userId];
                    return { ...g, owners: newOwners };
                }
                return g;
            })
        );

        try {
            if (isCurrentlyOwner) {
                const { error } = await supabase
                    .from('goal_owners')
                    .delete()
                    .eq('goal_id', goalId)
                    .eq('user_id', userId);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('goal_owners')
                    .insert({ goal_id: goalId, user_id: userId });

                if (error && error.code !== '23505') throw error;

                if (!error) {
                    showToast('เข้าร่วมทีมสำเร็จ!', 'success');
                }
            }
        } catch (err: any) {
            console.error('Toggle owner error:', err);
            setGoals(previousGoals);
            showToast('ไม่สามารถเปลี่ยนสถานะทีมได้ในขณะนี้', 'error');
        }
    };

    const toggleBoost = async (goalId: string, isCurrentlyBoosted: boolean) => {
        const user = currentUser;
        if (!user) return;

        const previousGoals = [...goals];
        setGoals(prev =>
            prev.map(g => {
                if (g.id === goalId) {
                    const newBoosts = isCurrentlyBoosted
                        ? g.boosts.filter(uid => uid !== user.id)
                        : [...g.boosts, user.id];
                    return { ...g, boosts: newBoosts };
                }
                return g;
            })
        );

        try {
            if (isCurrentlyBoosted) {
                const { error } = await supabase
                    .from('goal_boosts')
                    .delete()
                    .eq('goal_id', goalId)
                    .eq('user_id', user.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('goal_boosts')
                    .insert({ goal_id: goalId, user_id: user.id });

                if (error && error.code !== '23505') throw error;

                if (!error) {
                    showToast('ส่งพลังเชียร์แล้ว!', 'success');
                }
            }
        } catch (err: any) {
            console.error('Toggle boost error:', err);
            setGoals(previousGoals);
            showToast('ไม่สามารถส่งพลังเชียร์ได้ในขณะนี้', 'error');
        }
    };

    const requestExtension = async (goalId: string, newDateStr: string, reason: string) => {
        const user = currentUser;
        if (!user) {
            showToast('ขอขยายเวลาไม่สำเร็จ: ไม่พบข้อมูลผู้ใช้', 'error');
            return false;
        }

        try {
            const { error } = await supabase
                .from('goal_deadline_requests')
                .insert({
                    goal_id: goalId,
                    requested_by: user.id,
                    new_deadline: new Date(newDateStr).toISOString(),
                    reason: reason,
                    status: 'PENDING',
                })
                .select()
                .single();

            if (error) throw error;

            const { data: admins } = await supabase.from('profiles').select('id').eq('role', 'ADMIN');
            if (admins && admins.length > 0) {
                const notifications = admins.map(admin => ({
                    user_id: admin.id,
                    type: 'APPROVAL_REQ',
                    title: 'คำขอเลื่อน Deadline เป้าหมาย',
                    message: `คุณ ${user.name} ขอเลื่อนเป้าหมาย: "${reason.substring(0, 50)}${reason.length > 50 ? '...' : ''}"`,
                    related_id: goalId,
                    is_read: false,
                    link_path: 'GOALS',
                }));
                await supabase.from('notifications').insert(notifications);
            }
            showToast('ส่งคำขอเลื่อน Deadline ของเป้าหมายให้แอดมินพิจารณาแล้ว!', 'success');
            return true;
        } catch (err: any) {
            console.error('requestExtension error:', err);
            showToast('ขอขยายเวลาไม่สำเร็จ: ' + err.message, 'error');
            return false;
        }
    };

    return {
        goals,
        liveChannels,
        isLoading,
        addGoal,
        updateGoal,
        updateGoalValue,
        syncGoalFollowersFromApi,
        deleteGoal,
        toggleOwner,
        toggleBoost,
        redeemGoal,
        requestExtension,
        refreshGoals: () => fetchGoalsAndReconcile(false),
    };
};
