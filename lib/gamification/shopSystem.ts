import { supabase } from '../supabase';
import { ShopItem } from '../../types';

/**
 * 🛒 useShop (The Merchant)
 * หน้าที่: จัดการเรื่องการดึงรายการสินค้าและการซื้อ (Buy Logic)
 */
export const fetchShopItems = async () => {
    try {
        const { data, error } = await supabase
            .from('shop_items')
            .select('*')
            .eq('is_active', true)
            .order('price', { ascending: true });

        if (error) throw error;
        
        // Map snake_case to camelCase
        const mappedData = (data || []).map(item => ({
            ...item,
            effectType: item.effect_type,
            effectValue: item.effect_value,
            isActive: item.is_active
        }));

        return mappedData;
    } catch (err) {
        console.error('Error fetching shop items:', err);
        return [];
    }
};

export const buyItem = async (userId: string, item: ShopItem) => {
    try {
        // 1. 💰 Check Balance: ตรวจสอบเงินในกระเป๋า
        const { data: user, error: fetchError } = await supabase
            .from('profiles')
            .select('available_points')
            .eq('id', userId)
            .single();

        if (fetchError || !user) throw new Error('User not found');
        if (user.available_points < item.price) {
            return { success: false, message: 'แต้มไม่พอครับ! ไปทำงานเก็บแต้มก่อนนะ' };
        }

        // 2. 💸 Deduct Points: หักเงิน
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ available_points: user.available_points - item.price })
            .eq('id', userId);

        if (updateError) throw updateError;

        // 3. 📦 Add to Inventory: เพิ่มของเข้ากระเป๋า
        const { error: inventoryError } = await supabase
            .from('user_inventory')
            .insert({
                user_id: userId,
                item_id: item.id,
                is_used: false,
                purchased_at: new Date().toISOString()
            });

        if (inventoryError) throw inventoryError;

        // 4. 📝 Log Transaction: บันทึกประวัติการซื้อ
        await supabase.from('game_logs').insert({
            user_id: userId,
            action_type: 'SHOP_PURCHASE',
            jp_change: -item.price,
            description: `ซื้อไอเทม ${item.name} (-${item.price} JP)`
        });

        return { success: true, message: `ซื้อ ${item.name} สำเร็จ!` };

    } catch (err: any) {
        console.error('Buy Item Error:', err);
        return { success: false, message: err.message || 'เกิดข้อผิดพลาดในการซื้อ' };
    }
};
