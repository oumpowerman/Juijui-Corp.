import { supabase } from '../supabase';
import { GameActionType, GameConfig } from '../../types';
import { evaluateAction } from '../gameLogic';

/**
 * 📜 useGameLogs (The Historian)
 * หน้าที่: จัดการเรื่องประวัติการทำรายการ (History)
 */
export const logGameAction = async (
    userId: string,
    action: GameActionType,
    result: any,
    context: any = {},
    bonusCoins: number = 0
) => {
    try {
        // 1. 📝 Log: บันทึกประวัติการทำรายการ (สำคัญมาก! ตัวนี้จะไปกระตุ้น Toast ให้เด้ง)
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

        // 2. 🎉 Explicit Level Up Event: ถ้าเลเวลอัป ให้สร้าง Log แยกอีกบรรทัดเพื่อความอลังการ
        if (result.isLevelUp) {
            await supabase.from('game_logs').insert({
                user_id: userId,
                action_type: 'LEVEL_UP',
                xp_change: 0,
                hp_change: 0,
                jp_change: bonusCoins, 
                description: `🎉 LEVEL UP! เลื่อนเป็น Lv.${result.newLevel} (รับโบนัส +${bonusCoins} JP)`
            });
        }
    } catch (err) {
        console.error("Game Log Error:", err);
    }
};
