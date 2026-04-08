import { supabase } from '../supabase';
import { GameActionType, GameConfig } from '../../types';
import { evaluateAction } from '../gameLogic';

/**
 * 📜 useGameLogs (The Historian)
 * หน้าที่: จัดการเรื่องประวัติการทำรายการ (History)
 */
import { toValidUuid } from '../../utils/gamificationUtils';

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
        const description = context.reason 
            ? `${result.message} [${context.reason}]` 
            : result.message;

        const { error: logError } = await supabase.from('game_logs').insert({
            user_id: userId,
            action_type: action,
            xp_change: result.xp,
            hp_change: result.hp,
            jp_change: result.coins + bonusCoins,
            description: description,
            related_id: toValidUuid(context.id || null)
        });

        if (logError) {
            console.error("❌ Failed to insert game log:", logError);
        }

        // 2. 🔔 Notification: บันทึกลงตาราง notifications เพื่อให้ขึ้นที่กระดิ่ง
        // เราจะบันทึกเฉพาะรายการที่เป็นโทษ (Penalty) หรือรางวัลใหญ่ (Level Up/Reward)
        const isPenalty = result.hp < 0 || (result.coins < 0 && action !== 'SHOP_PURCHASE');
        const isSignificantReward = result.isLevelUp || result.xp > 100 || action === 'KPI_REWARD';

        if (isPenalty || isSignificantReward) {
            await supabase.from('notifications').insert({
                user_id: userId,
                type: isPenalty ? 'GAME_PENALTY' : 'GAME_REWARD',
                title: isPenalty ? '📉 มีการปรับลดสถานะ' : '🎁 ได้รับรางวัล!',
                message: description,
                is_read: false,
                link_path: 'DASHBOARD'
            });
        }

        // 3. 🎉 Explicit Level Up Event: ถ้าเลเวลอัป ให้สร้าง Log แยกอีกบรรทัดเพื่อความอลังการ
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
