import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useGameConfig } from '../context/GameConfigContext';
import { User, ShopItem, GameActionType } from '../types';
import { updateGameStats } from '../lib/gamification/gameStats';
import { logGameAction } from '../lib/gamification/gameLogs';
import { handleDeathSequence } from '../lib/gamification/deathSystem';
import { fetchShopItems, buyItem } from '../lib/gamification/shopSystem';
import { fetchUserInventory, useItem } from '../lib/gamification/inventorySystem';

export const useGamification = (currentUser: User | null = null) => {
    const { config } = useGameConfig();
    const [shopItems, setShopItems] = useState<ShopItem[]>([]);
    const [userInventory, setUserInventory] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // --- 1. 📊 Stats Management ---
    const handleAction = useCallback(async (userId: string, action: GameActionType, context: any = {}) => {
        try {
            const result = await updateGameStats(userId, action, context, config);
            
            if (result) {
                await logGameAction(userId, action, result, context, result.bonusCoins);
                
                if (result.isDeath) {
                    await handleDeathSequence(userId, result.deathCount, result);
                }
            }
            return result;
        } catch (error) {
            console.error("Gamification Action Error:", error);
            return null;
        }
    }, [config]);

    // --- 2. 🛒 Shop Management ---
    const loadShopItems = useCallback(async () => {
        setIsLoading(true);
        const items = await fetchShopItems();
        setShopItems(items);
        setIsLoading(false);
    }, []);

    const handleBuyItem = useCallback(async (item: ShopItem) => {
        if (!currentUser) return { success: false, message: 'กรุณาเข้าสู่ระบบก่อนครับ' };
        const result = await buyItem(currentUser.id, item);
        if (result.success) {
            // Refresh inventory and points
            loadUserInventory();
            // Points update is handled by real-time listener in useAuth/useGameEventListener
        }
        return result;
    }, [currentUser]);

    // --- 3. 🎒 Inventory Management ---
    const loadUserInventory = useCallback(async () => {
        if (!currentUser) return;
        setIsLoading(true);
        const inventory = await fetchUserInventory(currentUser.id);
        setUserInventory(inventory);
        setIsLoading(false);
    }, [currentUser]);

    const handleUseItem = useCallback(async (inventoryId: string, item: ShopItem) => {
        if (!currentUser) return { success: false, message: 'กรุณาเข้าสู่ระบบก่อนครับ' };
        const result = await useItem(currentUser.id, inventoryId, item, config);
        if (result.success) {
            loadUserInventory(); // Refresh inventory
        }
        return result;
    }, [currentUser, config]);

    // --- Initial Load ---
    useEffect(() => {
        if (currentUser) {
            loadShopItems();
            loadUserInventory();
        }
    }, [currentUser, loadShopItems, loadUserInventory]);

    // --- 4. 🛠️ Legacy Support / Admin Tools ---
    const processAction = handleAction; // Alias for backward compatibility

    const adminAdjustStats = useCallback(async (userId: string, type: 'XP' | 'HP' | 'COINS', amount: number, reason: string) => {
        try {
            setIsLoading(true);
            const { data: user, error: fetchError } = await supabase.from('profiles').select('xp, hp, max_hp, available_points').eq('id', userId).single();
            if (fetchError || !user) throw new Error('User not found');

            let updates: any = {};
            if (type === 'XP') updates.xp = Math.max(0, user.xp + amount);
            if (type === 'HP') updates.hp = Math.min(user.max_hp, Math.max(0, user.hp + amount));
            if (type === 'COINS') updates.available_points = Math.max(0, user.available_points + amount);

            const { error: updateError } = await supabase.from('profiles').update(updates).eq('id', userId);
            if (updateError) throw updateError;
            
            await supabase.from('game_logs').insert({
                user_id: userId,
                action_type: 'ADMIN_ADJUST',
                xp_change: type === 'XP' ? amount : 0,
                hp_change: type === 'HP' ? amount : 0,
                jp_change: type === 'COINS' ? amount : 0,
                description: `Admin Adjusted: ${reason}`
            });
            
            return { success: true };
        } catch (e: any) {
            console.error("Admin Adjust Error:", e);
            return { success: false, message: e.message };
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchGameLogs = useCallback(async (userId: string) => {
        const { data } = await supabase
            .from('game_logs')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(50);
        return data || [];
    }, []);

    return {
        handleAction,
        processAction, // Export alias
        adminAdjustStats, // Export admin function
        fetchGameLogs, // Export log fetcher
        shopItems,
        userInventory,
        buyItem: handleBuyItem,
        useItem: handleUseItem,
        isLoading
    };
};
