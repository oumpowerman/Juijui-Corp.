import { useCallback, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { GameActionType, ShopItem, UserInventoryItem, GameLog } from '../types';
import { evaluateAction, calculateLevel } from '../lib/gameLogic';
import { useGameConfig } from '../context/GameConfigContext';

/**
 * 🎮 useGamification (The Engine)
 * หน้าที่: คำนวณ Logic เกม, ตัดแต้ม, เพิ่มแต้ม, และ "บันทึก" ลง Database
 * 
 * ⚠️ สำคัญ: ไฟล์นี้จะไม่เรียก useToast() หรือ showToast() เด็ดขาด!
 * เพื่อป้องกันปัญหา Notification เด้งซ้ำซ้อน
 * หน้าที่การแจ้งเตือนถูกย้ายไปที่ `useGameEventListener` (The Watcher)
 */
export const useGamification = (currentUser?: any) => {
    const { config } = useGameConfig();
    const [shopItems, setShopItems] = useState<ShopItem[]>([]);
    const [userInventory, setUserInventory] = useState<UserInventoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // --- Core Engine: Process Any Action ---
    const processAction = useCallback(async (
        userId: string, 
        action: GameActionType, 
        context: any = {}
    ) => {
        try {
            // 1. 📐 Rule Engine: คำนวณหาค่า XP/HP ที่ควรได้
            const result = evaluateAction(action, context, config);
            
            // ถ้าไม่มีการเปลี่ยนแปลงค่าใดๆ เลย ให้จบการทำงาน
            if (result.xp === 0 && result.hp === 0 && result.coins === 0 && !result.message) return result;

            // 2. 📥 Fetch: ดึงค่าปัจจุบันของผู้ใช้
            const { data: user, error: fetchError } = await supabase
                .from('profiles')
                .select('xp, hp, available_points, level')
                .eq('id', userId)
                .single();

            if (fetchError || !user) throw new Error('User not found for gamification update');

            // 3. 🧮 Calculate: คำนวณค่าใหม่
            const newXp = Math.max(0, user.xp + result.xp);
            const newHp = Math.min(100, Math.max(0, user.hp + result.hp)); // HP ห้ามเกิน 100 และห้ามติดลบ
            
            // 4. 🆙 Check Level Up: ตรวจสอบว่าเลเวลอัปไหม
            const newLevel = calculateLevel(newXp, config);
            const isLevelUp = newLevel > user.level;
            
            // ให้โบนัสพิเศษเมื่อเลเวลอัป
            const levelUpBonus = config.LEVELING_SYSTEM?.level_up_bonus_coins ?? 500;
            const bonusCoins = isLevelUp ? levelUpBonus : 0;

            const newCoins = Math.max(0, user.available_points + result.coins + bonusCoins);

            // 5. 💾 Update DB: บันทึกค่าใหม่ลง Profile
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

            // 6. 📝 Log: บันทึกประวัติการทำรายการ (สำคัญมาก! ตัวนี้จะไปกระตุ้น Toast ให้เด้ง)
            // เราบันทึก `result.message` ลงใน description เลย เพื่อให้ Listener อ่านไปแสดงผลได้ทันที
            await supabase.from('game_logs').insert({
                user_id: userId,
                action_type: action,
                xp_change: result.xp,
                hp_change: result.hp,
                jp_change: result.coins + bonusCoins,
                description: result.message,
                related_id: context.id || null
            });

            // 7. 🎉 Explicit Level Up Event: ถ้าเลเวลอัป ให้สร้าง Log แยกอีกบรรทัดเพื่อความอลังการ
            if (isLevelUp) {
                await supabase.from('game_logs').insert({
                    user_id: userId,
                    action_type: 'LEVEL_UP',
                    xp_change: 0,
                    hp_change: 0,
                    jp_change: bonusCoins, 
                    description: `🎉 LEVEL UP! เลื่อนเป็น Lv.${newLevel} (รับโบนัส +${bonusCoins} JP)`
                });
            }

            return result;
        } catch (err) {
            console.error("Gamification Error:", err);
            return null;
        }
    }, [config]);


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
                effectValue: i.effect_value,
                isActive: i.is_active
            })));
        }
    };

    const fetchUserInventory = async () => {
        if (!currentUser?.id) return;
        const { data } = await supabase
            .from('user_inventory')
            .select(`
                id, item_id, is_used, 
                shop_items (id, name, description, icon, effect_type, effect_value, is_active)
            `)
            .eq('user_id', currentUser.id)
            .eq('is_used', false);

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
                    price: 0,
                    icon: i.shop_items.icon,
                    effectType: i.shop_items.effect_type,
                    effectValue: i.shop_items.effect_value,
                    isActive: i.shop_items.is_active
                } : undefined
            })));
        }
    };

    // 🛍️ Buy Item Logic
    const buyItem = async (item: ShopItem) => {
        if (!currentUser) return { success: false, message: 'User not found' };
        setIsLoading(true);

        try {
            // Check Points Balance
            const { data: user } = await supabase
                .from('profiles')
                .select('available_points')
                .eq('id', currentUser.id)
                .single();
            
            if (!user || user.available_points < item.price) {
                return { success: false, message: 'เงินไม่พอครับ! ไปทำงานเก็บเงินก่อนนะ 💸' };
            }

            // Deduct & Add Item
            const newBalance = user.available_points - item.price;
            await supabase.from('profiles').update({ available_points: newBalance }).eq('id', currentUser.id);
            
            await supabase.from('user_inventory').insert({
                user_id: currentUser.id,
                item_id: item.id,
                is_used: false
            });

            // Log Transaction - Use evaluateAction to generate standard message
            const logResult = evaluateAction('SHOP_PURCHASE', { itemName: item.name, cost: item.price }, config);
            
            await supabase.from('game_logs').insert({
                user_id: currentUser.id,
                action_type: 'SHOP_PURCHASE',
                jp_change: logResult.coins,
                description: logResult.message
            });

            fetchUserInventory();
            return { success: true, message: `ซื้อ ${item.name} เรียบร้อย!` };

        } catch (err: any) {
            return { success: false, message: 'ซื้อไม่สำเร็จ: ' + err.message };
        } finally {
            setIsLoading(false);
        }
    };

    // 🧪 Use Item Logic
    const useItem = async (inventoryId: string, item: ShopItem) => {
        if (!currentUser) return { success: false };
        setIsLoading(true);

        try {
            // Apply Effect based on Type
            if (item.effectType === 'HEAL_HP') {
                const { data: user } = await supabase.from('profiles').select('hp, max_hp').eq('id', currentUser.id).single();
                if (user) {
                    const newHp = Math.min(user.max_hp, user.hp + item.effectValue);
                    await supabase.from('profiles').update({ hp: newHp }).eq('id', currentUser.id);
                    
                    // Mark as used
                    await supabase.from('user_inventory').update({ is_used: true, used_at: new Date().toISOString() }).eq('id', inventoryId);
                    
                    // Log -> Use evaluateAction
                    const logResult = evaluateAction('ITEM_USE', { 
                        itemName: item.name, 
                        effectType: item.effectType, 
                        effectValue: item.effectValue 
                    }, config);

                    await supabase.from('game_logs').insert({
                        user_id: currentUser.id,
                        action_type: 'ITEM_USE',
                        description: logResult.message
                    });
                }
            } 
            else if (item.effectType === 'SKIP_DUTY') {
                 // Passive item: Just notify user
                 return { success: false, message: 'ℹ️ ไอเทมนี้เป็นแบบ Passive (พกไว้กันเหนียว) จะทำงานอัตโนมัติเมื่อลืมทำเวรครับ ไม่ต้องกดใช้' };
            }
            else if (item.effectType === 'REMOVE_LATE') {
                 // Time Warp Logic: Find last penalty and refund it
                 const { data: lastPenalty } = await supabase
                    .from('game_logs')
                    .select('*')
                    .eq('user_id', currentUser.id)
                    .lt('hp_change', 0)
                    .in('action_type', ['TASK_LATE', 'DUTY_MISSED'])
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                 if (!lastPenalty) {
                     return { success: false, message: 'ไม่พบประวัติการโดนหักคะแนนล่าสุด (คุณยังเป็นเด็กดีอยู่!)' };
                 }

                 // Configurable Refund
                 const refundCap = config.ITEM_MECHANICS?.time_warp_refund_cap_hp || 20;
                 const refundPct = config.ITEM_MECHANICS?.time_warp_refund_percent || 100;
                 
                 const originalHP = Math.abs(lastPenalty.hp_change);
                 const refundHP = Math.min(originalHP * (refundPct/100), refundCap);
                 const refundCoin = Math.abs(lastPenalty.jp_change || 0);

                 const { data: user } = await supabase.from('profiles').select('hp, max_hp, available_points').eq('id', currentUser.id).single();
                 
                 if (user) {
                     const newHp = Math.min(user.max_hp, user.hp + refundHP);
                     const newPoints = user.available_points + refundCoin;
                     await supabase.from('profiles').update({ hp: newHp, available_points: newPoints }).eq('id', currentUser.id);
                 }

                 await supabase.from('user_inventory').update({ is_used: true, used_at: new Date().toISOString() }).eq('id', inventoryId);

                 // Log -> Use evaluateAction
                 const logResult = evaluateAction('TIME_WARP_REFUND', { 
                    hp: refundHP, 
                    coins: refundCoin, 
                    originalDescription: lastPenalty.description 
                 }, config);
                 
                 await supabase.from('game_logs').insert({
                    user_id: currentUser.id,
                    action_type: 'TIME_WARP_REFUND',
                    hp_change: refundHP,
                    jp_change: refundCoin,
                    description: logResult.message,
                    related_id: lastPenalty.id
                 });
            }
            else {
                 return { success: false, message: 'ไอเทมนี้ยังไม่มีผลในระบบ Beta' };
            }

            fetchUserInventory();
            return { success: true };

        } catch (err: any) {
            return { success: false, message: 'ใช้ไอเทมไม่สำเร็จ: ' + err.message };
        } finally {
            setIsLoading(false);
        }
    };
    
    // 👑 Admin Adjustment Logic
    const adminAdjustStats = async (targetUserId: string, adjustments: { hp?: number, xp?: number, points?: number }, reason: string) => {
        try {
            const { data: user } = await supabase
                .from('profiles')
                .select('hp, xp, available_points, level, max_hp')
                .eq('id', targetUserId)
                .single();
            
            if (!user) throw new Error("User not found");

            let newHp = user.hp;
            let newXp = user.xp;
            let newPoints = user.available_points;
            let newLevel = user.level;

            if (adjustments.hp !== undefined) newHp = Math.min(user.max_hp, Math.max(0, user.hp + adjustments.hp));
            if (adjustments.xp !== undefined) {
                newXp = Math.max(0, user.xp + adjustments.xp);
                newLevel = calculateLevel(newXp, config);
            }
            if (adjustments.points !== undefined) newPoints = Math.max(0, user.available_points + adjustments.points);

            await supabase
                .from('profiles')
                .update({ hp: newHp, xp: newXp, available_points: newPoints, level: newLevel })
                .eq('id', targetUserId);

            // Log -> Use evaluateAction
            const logResult = evaluateAction('MANUAL_ADJUST', {
                xp: adjustments.xp,
                hp: adjustments.hp,
                coins: adjustments.points,
                adminName: currentUser?.name || 'Admin',
                reason: reason
            }, config);

            await supabase.from('game_logs').insert({
                user_id: targetUserId,
                action_type: 'MANUAL_ADJUST',
                hp_change: adjustments.hp || 0,
                xp_change: adjustments.xp || 0,
                jp_change: adjustments.points || 0,
                description: logResult.message
            });

            return { success: true };
        } catch (err: any) {
            console.error(err);
            return { success: false, message: err.message };
        }
    };
    
    const fetchGameLogs = async (userId: string, page: number, pageSize: number = 20, filterType: 'ALL' | 'EARNED' | 'SPENT' | 'PENALTY' = 'ALL') => {
        try {
            let query = supabase
                .from('game_logs')
                .select('*', { count: 'exact' })
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (filterType === 'EARNED') {
                query = query.or('xp_change.gt.0,jp_change.gt.0');
            } else if (filterType === 'SPENT') {
                query = query.lt('jp_change', 0);
            } else if (filterType === 'PENALTY') {
                query = query.or('hp_change.lt.0,jp_change.lt.0').not('action_type', 'eq', 'SHOP_PURCHASE');
            }

            const from = (page - 1) * pageSize;
            const to = from + pageSize - 1;
            
            const { data, count, error } = await query.range(from, to);
            
            if (error) throw error;
            
            return {
                data: (data || []).map((log: any) => ({
                    id: log.id,
                    userId: log.user_id,
                    actionType: log.action_type,
                    xpChange: log.xp_change,
                    hpChange: log.hp_change,
                    jpChange: log.jp_change,
                    description: log.description,
                    createdAt: new Date(log.created_at),
                    relatedId: log.related_id
                }) as GameLog),
                count: count || 0
            };
        } catch (err) {
            console.error('Fetch Logs Error:', err);
            return { data: [], count: 0 };
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
        adminAdjustStats,
        fetchGameLogs,
        isLoading
    };
};