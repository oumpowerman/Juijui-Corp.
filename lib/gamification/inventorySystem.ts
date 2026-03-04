import { supabase } from '../supabase';
import { ShopItem, GameConfig } from '../../types';
import { ItemEffectRegistry } from './itemRegistry';

/**
 * 🎒 useInventory (The Inventory Manager)
 * หน้าที่: จัดการเรื่องกระเป๋าและการใช้ไอเทม (Use Logic)
 */
export const fetchUserInventory = async (userId: string) => {
    try {
        const { data, error } = await supabase
            .from('user_inventory')
            .select(`
                id,
                item_id,
                is_used,
                purchased_at,
                used_at,
                item:shop_items (
                    id,
                    name,
                    description,
                    price,
                    effect_type,
                    effect_value,
                    icon,
                    rarity
                )
            `)
            .eq('user_id', userId)
            .eq('is_used', false)
            .order('purchased_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (err) {
        console.error('Error fetching inventory:', err);
        return [];
    }
};

export const useItem = async (userId: string, inventoryId: string, item: ShopItem, config: GameConfig) => {
    try {
        // 1. 🔍 Check Item: ตรวจสอบว่ามีไอเทมจริงไหม
        const { data: inventoryItem, error: fetchError } = await supabase
            .from('user_inventory')
            .select('*')
            .eq('id', inventoryId)
            .eq('user_id', userId)
            .eq('is_used', false)
            .single();

        if (fetchError || !inventoryItem) throw new Error('Item not found or already used');

        // 2. 🧪 Apply Effect: เรียกใช้ Logic จาก ItemEffectRegistry
        const effectHandler = ItemEffectRegistry[item.effectType];
        
        if (!effectHandler) {
            return { success: false, message: `ยังไม่มี Logic สำหรับไอเทมประเภท ${item.effectType}` };
        }

        const result = await effectHandler({
            userId,
            inventoryId,
            item,
            config
        });

        return result;

    } catch (err: any) {
        console.error('Use Item Error:', err);
        return { success: false, message: err.message || 'เกิดข้อผิดพลาดในการใช้ไอเทม' };
    }
};
