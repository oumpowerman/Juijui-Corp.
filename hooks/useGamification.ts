
import { useCallback, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { GameActionType, ShopItem, UserInventoryItem } from '../types';
import { useToast } from '../context/ToastContext';
import { evaluateAction, calculateLevel } from '../lib/gameLogic';

export const useGamification = (currentUser?: any) => {
    const { showToast } = useToast();
    const [shopItems, setShopItems] = useState<ShopItem[]>([]);
    const [userInventory, setUserInventory] = useState<UserInventoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // --- Core Engine ---
    const processAction = useCallback(async (
        userId: string, 
        action: GameActionType, 
        context: any = {}
    ) => {
        try {
            // 1. Calculate Delta using Rule Engine
            const result = evaluateAction(action, context);
            if (result.xp === 0 && result.hp === 0 && result.coins === 0 && !result.message) return;

            // 2. Fetch Current User State (to ensure atomicity, ideally use RPC, but Client-side is okay for V1)
            const { data: user, error: fetchError } = await supabase
                .from('profiles')
                .select('xp, hp, available_points, level')
                .eq('id', userId)
                .single();

            if (fetchError || !user) throw new Error('User not found');

            // 3. Apply Changes
            const newXp = Math.max(0, user.xp + result.xp);
            const newHp = Math.min(100, Math.max(0, user.hp + result.hp)); // Clamp 0-100
            const newCoins = Math.max(0, user.available_points + result.coins);
            
            // Check Level Up
            const newLevel = calculateLevel(newXp);
            const isLevelUp = newLevel > user.level;

            // 4. Update Database
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ 
                    xp: newXp, 
                    hp: newHp, 
                    available_points: newCoins,
                    level: newLevel
                })
                .eq('id', userId);

            if (updateError) throw updateError;

            // 5. Log Transaction
            await supabase.from('game_logs').insert({
                user_id: userId,
                action_type: action,
                xp_change: result.xp,
                hp_change: result.hp,
                jp_change: result.coins,
                description: result.message,
                related_id: context.id || null
            });

            // 6. UI Feedback
            if (result.message) {
                showToast(result.message + (result.details ? ` (${result.details})` : ''), result.hp < 0 ? 'error' : 'success');
            }

            if (isLevelUp) {
                setTimeout(() => {
                    showToast(`🎉 Level Up! ยินดีด้วยคุณเลื่อนเป็น Lv.${newLevel}`, 'success');
                    // Optional: Trigger confetti effect via global event
                }, 1000);
            }

        } catch (err) {
            console.error("Gamification Error:", err);
        }
    }, [showToast]);


    // --- Shop & Inventory System ---
    
    const fetchShopItems = async () => {
        const { data } = await supabase.from('shop_items').select('*').eq('is_active', true);
        if (data) {
            setShopItems(data.map((i: any) => ({
                id: i.id,
                name: i.name,
                description: i.description,
                price: i.price,
                icon: i.icon,
                effectType: i.effect_type,
                effectValue: i.effect_value
            })));
        }
    };

    const fetchUserInventory = async () => {
        if (!currentUser?.id) return;
        const { data } = await supabase
            .from('user_inventory')
            .select(`
                id, item_id, is_used, 
                shop_items (id, name, description, icon, effect_type, effect_value)
            `)
            .eq('user_id', currentUser.id)
            .eq('is_used', false); // Show only active items

        if (data) {
            setUserInventory(data.map((i: any) => ({
                id: i.id,
                itemId: i.item_id,
                userId: currentUser.id,
                isUsed: i.is_used,
                item: i.shop_items ? {
                    id: i.shop_items.id,
                    name: i.shop_items.name,
                    description: i.shop_items.description,
                    price: 0, // Owned items don't show price
                    icon: i.shop_items.icon,
                    effectType: i.shop_items.effect_type,
                    effectValue: i.shop_items.effect_value
                } : undefined
            })));
        }
    };

    const buyItem = async (item: ShopItem) => {
        if (!currentUser) return;
        setIsLoading(true);

        try {
            // 1. Check Points
            const { data: user } = await supabase
                .from('profiles')
                .select('available_points')
                .eq('id', currentUser.id)
                .single();
            
            if (!user || user.available_points < item.price) {
                showToast('เงินไม่พอครับ! ไปทำงานเก็บเงินก่อนนะ 💸', 'error');
                setIsLoading(false);
                return;
            }

            // 2. Deduct Points & Add Item (Transaction)
            const newBalance = user.available_points - item.price;
            
            await supabase.from('profiles').update({ available_points: newBalance }).eq('id', currentUser.id);
            
            await supabase.from('user_inventory').insert({
                user_id: currentUser.id,
                item_id: item.id,
                is_used: false
            });

            await supabase.from('game_logs').insert({
                user_id: currentUser.id,
                action_type: 'SHOP_PURCHASE',
                jp_change: -item.price,
                description: `ซื้อไอเทม: ${item.name}`
            });

            showToast(`ซื้อ ${item.name} เรียบร้อย! 🎒`, 'success');
            
            // Refresh
            fetchUserInventory();
            // Trigger profile refresh in parent if possible, or expect realtime

        } catch (err: any) {
            showToast('ซื้อไม่สำเร็จ: ' + err.message, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const useItem = async (inventoryId: string, item: ShopItem) => {
        if (!currentUser) return;
        setIsLoading(true);

        try {
            // 1. Apply Effect
            if (item.effectType === 'HEAL_HP') {
                const { data: user } = await supabase.from('profiles').select('hp, max_hp').eq('id', currentUser.id).single();
                if (user) {
                    const newHp = Math.min(user.max_hp, user.hp + item.effectValue);
                    await supabase.from('profiles').update({ hp: newHp }).eq('id', currentUser.id);
                    showToast(`ฟื้นฟูพลัง! HP +${item.effectValue} ❤️`, 'success');
                }
            } 
            else if (item.effectType === 'SKIP_DUTY') {
                 // Future: Flag duty as skipped
                 showToast('ใช้บัตรกันเวรแล้ว! (Effect Placeholder)', 'info');
            }
            else {
                 showToast('ไอเทมนี้ยังไม่มีผลในระบบ Beta', 'warning');
            }

            // 2. Mark as Used
            await supabase
                .from('user_inventory')
                .update({ is_used: true, used_at: new Date().toISOString() })
                .eq('id', inventoryId);

            // 3. Log
             await supabase.from('game_logs').insert({
                user_id: currentUser.id,
                action_type: 'ITEM_USE',
                description: `ใช้ไอเทม: ${item.name}`
            });

            // Refresh
            fetchUserInventory();

        } catch (err: any) {
            showToast('ใช้ไอเทมไม่สำเร็จ: ' + err.message, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (currentUser) {
            fetchShopItems();
            fetchUserInventory();
        }
    }, [currentUser]);

    return {
        processAction,
        shopItems,
        userInventory,
        buyItem,
        useItem,
        isLoading
    };
};
