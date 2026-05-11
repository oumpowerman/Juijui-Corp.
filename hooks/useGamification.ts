import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useGameConfig } from '../context/GameConfigContext';
import { User, ShopItem, GameActionType } from '../types';
import { updateGameStats } from '../lib/gamification/gameStats';
import { logGameAction } from '../lib/gamification/gameLogs';
import { handleDeathSequence } from '../lib/gamification/deathSystem';
import { fetchShopItems, buyItem } from '../lib/gamification/shopSystem';
import { fetchUserInventory, useItem } from '../lib/gamification/inventorySystem';
import { toValidUuid } from '../utils/gamificationUtils';

export const useGamification = (currentUser: User | null = null) => {
    const { config } = useGameConfig();
    const [shopItems, setShopItems] = useState<ShopItem[]>([]);
    const [userInventory, setUserInventory] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // --- 1. 📊 Stats Management ---
    const handleAction = useCallback(async (userId: string, action: GameActionType, context: any = {}) => {
        try {
            // IDEMPOTENCY CHECK: If a unique ID is provided (like "ABSENT:2026-05-11"),
            // verify we haven't already processed this exact event in the DB.
            const targetId = toValidUuid(context.id || null);
            if (targetId) {
                const { data: existingLog } = await supabase
                    .from('game_logs')
                    .select('id')
                    .eq('user_id', userId)
                    .eq('related_id', targetId)
                    .maybeSingle();
                
                if (existingLog) {
                    console.log(`[Gamification] Action ${action} for ${userId} with key ${targetId} already exists. Skipping.`);
                    return null;
                }
            }

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
    // Removed automatic initial load to prevent unnecessary network requests at top-level hooks (like useAutoJudge)
    // Components that need shop/inventory data should call loadShopItems/loadUserInventory explicitly or use the returned state.
    
    // However, for backward compatibility and ease of use, we can keep it but maybe only if a flag is passed?
    // Or just let the components call the load functions.
    // Let's change it to only load if specifically requested via a prop or just remove the useEffect.
    // Most components using useGamification (like Shop or Inventory) will likely want this data.
    // But useAutoJudge doesn't.
    
    // Let's remove the useEffect and let the components handle it.
    // I will check where useGamification is used.

    // --- 4. 🛠️ Legacy Support / Admin Tools ---
    const processAction = handleAction; // Alias for backward compatibility

    const adminAdjustStats = useCallback(async (userId: string, adjustments: { hp?: number, xp?: number, coins?: number }, reason: string) => {
        try {
            setIsLoading(true);
            
            // Use handleAction (which calls updateGameStats and logGameAction)
            // with action 'MANUAL_ADJUST' to let the game engine handle level recalculation
            const result = await handleAction(userId, 'MANUAL_ADJUST', {
                hp: adjustments.hp || 0,
                xp: adjustments.xp || 0,
                coins: adjustments.coins || 0,
                reason,
                adminName: currentUser?.name || 'Admin'
            });

            return { success: !!result, result };
        } catch (e: any) {
            console.error("Admin Adjust Error:", e);
            return { success: false, message: e.message };
        } finally {
            setIsLoading(false);
        }
    }, [handleAction, currentUser]);

    const fetchGameLogs = useCallback(async (userId: string, page = 1, pageSize = 50, filter: 'ALL' | 'EARNED' | 'SPENT' | 'PENALTY' = 'ALL') => {
        try {
            let query = supabase
                .from('game_logs')
                .select('*')
                .eq('user_id', userId);

            // Apply Filters
            if (filter === 'EARNED') {
                query = query.gt('jp_change', 0);
            } else if (filter === 'SPENT') {
                query = query.lt('jp_change', 0);
            } else if (filter === 'PENALTY') {
                // Include negative HP, negative XP, and negative JP (excluding shop purchases)
                query = query.or('hp_change.lt.0,xp_change.lt.0,and(jp_change.lt.0,action_type.neq.SHOP_PURCHASE)');
            }

            const { data, error } = await query
                .order('created_at', { ascending: false })
                .range((page - 1) * pageSize, page * pageSize - 1);

            if (error) throw error;

            // Transform snake_case to camelCase
            return (data || []).map(log => ({
                id: log.id,
                userId: log.user_id,
                actionType: log.action_type,
                xpChange: log.xp_change,
                hpChange: log.hp_change,
                jpChange: log.jp_change,
                description: log.description,
                createdAt: new Date(log.created_at),
                relatedId: log.related_id
            }));
        } catch (error) {
            console.error("Fetch Game Logs Error:", error);
            return [];
        }
    }, []);

    return {
        handleAction,
        processAction, // Export alias
        adminAdjustStats, // Export admin function
        fetchGameLogs, // Export log fetcher
        loadShopItems, // Export loader
        loadUserInventory, // Export loader
        shopItems,
        userInventory,
        buyItem: handleBuyItem,
        useItem: handleUseItem,
        isLoading
    };
};
