import { supabase } from '../supabase';
import { ShopItem, GameConfig } from '../../types';
import { evaluateAction } from '../gameLogic';

/**
 * 🧪 ItemEffectRegistry
 * หน้าที่: เก็บ Logic การทำงานของไอเทมแต่ละชิ้นแยกออกมา
 * ทำให้เพิ่มไอเทมใหม่ได้ง่ายโดยไม่ต้องแก้ Hook หลัก
 */

export interface ItemEffectContext {
    userId: string;
    inventoryId: string;
    item: ShopItem;
    config: GameConfig;
}

export interface ItemEffectResult {
    success: boolean;
    message: string;
    statsUpdate?: any;
}

export const ItemEffectRegistry: Record<string, (ctx: ItemEffectContext) => Promise<ItemEffectResult>> = {
    /**
     * 💊 Heal Potion (ยาแก้ปวดหลัง)
     * Effect: เพิ่ม HP ตามค่า effectValue
     */
    'HEAL_HP': async ({ userId, inventoryId, item, config }) => {
        const { data: user } = await supabase.from('profiles').select('hp, max_hp').eq('id', userId).single();
        
        if (!user) return { success: false, message: 'ไม่พบข้อมูลผู้ใช้' };
        if (user.hp >= user.max_hp) {
            return { success: false, message: 'HP ของคุณเต็มอยู่แล้วครับ! เก็บไว้ใช้ตอนจำเป็นดีกว่านะ' };
        }

        const newHp = Math.min(user.max_hp, user.hp + item.effectValue);
        
        // 1. Update Profile
        const { error: updateError } = await supabase.from('profiles').update({ hp: newHp }).eq('id', userId);
        if (updateError) throw updateError;

        // 2. Mark Item as Used
        await supabase.from('user_inventory').update({ 
            is_used: true, 
            used_at: new Date().toISOString() 
        }).eq('id', inventoryId);

        // 3. Log Action
        const logResult = evaluateAction('ITEM_USE', { 
            itemName: item.name, 
            effectType: item.effectType, 
            effectValue: item.effectValue 
        }, config);

        await supabase.from('game_logs').insert({
            user_id: userId,
            action_type: 'ITEM_USE',
            hp_change: item.effectValue,
            description: logResult.message
        });

        return { success: true, message: `ใช้ ${item.name} สำเร็จ! ฟื้นฟู HP +${item.effectValue}` };
    },

    /**
     * 🛡️ Duty Shield (บัตรกันเวร)
     * Effect: ป้องกันการเสีย HP เมื่อพลาดเวร (Passive)
     */
    'SKIP_DUTY': async () => {
        return { 
            success: false, 
            message: 'ไอเทมนี้ทำงานอัตโนมัติเมื่อคุณพลาดเวรครับ (ไม่ต้องกดใช้)' 
        };
    },

    /**
     * ⏰ Time Warp (นาฬิกาย้อนเวลา)
     * Effect: ล้างโทษล่าสุด (HP Penalty) และคืนแต้มบางส่วน
     */
    'REMOVE_LATE': async ({ userId, inventoryId, item, config }) => {
        // ค้นหา Log ล่าสุดที่เป็นบทลงโทษ (HP < 0)
        const { data: lastPenalty } = await supabase
            .from('game_logs')
            .select('*')
            .eq('user_id', userId)
            .lt('hp_change', 0)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (!lastPenalty) {
            return { success: false, message: 'ไม่พบประวัติบทลงโทษล่าสุดที่สามารถล้างได้ครับ' };
        }

        // 1. คำนวณการคืนค่า (Refund)
        const hpRefund = Math.abs(lastPenalty.hp_change);
        
        const { data: user } = await supabase.from('profiles').select('hp, max_hp, available_points').eq('id', userId).single();
        if (!user) return { success: false, message: 'ไม่พบข้อมูลผู้ใช้' };

        const newHp = Math.min(user.max_hp, user.hp + hpRefund);
        
        // 2. Update Profile
        await supabase.from('profiles').update({ 
            hp: newHp
        }).eq('id', userId);

        // 3. Mark Item as Used
        await supabase.from('user_inventory').update({ 
            is_used: true, 
            used_at: new Date().toISOString() 
        }).eq('id', inventoryId);

        // 4. Log Action
        await supabase.from('game_logs').insert({
            user_id: userId,
            action_type: 'TIME_WARP_REFUND',
            hp_change: hpRefund,
            description: `⏰ ใช้ ${item.name} ล้างโทษจาก: ${lastPenalty.description}`
        });

        return { 
            success: true, 
            message: `ย้อนเวลาสำเร็จ! ล้างโทษ "${lastPenalty.description}" และคืนค่า HP +${hpRefund}` 
        };
    }
};
