
import { GameActionType, GameActionResult, Difficulty } from '../types';
import { differenceInDays, isBefore } from 'date-fns';

// --- CONFIGURATION ---
const RULES = {
    // XP Multipliers
    XP_PER_HOUR: 20,
    DIFFICULTY_XP: {
        EASY: 50,
        MEDIUM: 100,
        HARD: 250
    },
    
    // Coins
    COIN_PER_TASK: 10,
    COIN_BONUS_EARLY: 20,
    COIN_DUTY: 5,

    // Penalties
    HP_PENALTY_LATE: 5,
    HP_PENALTY_MISSED_DUTY: 10,
    COIN_PENALTY_LATE_PER_DAY: 5,

    // Leveling
    BASE_XP_PER_LEVEL: 1000
};

// --- HELPER: Calculate Level from XP ---
export const calculateLevel = (totalXp: number): number => {
    // Formula: Level = 1 + floor(XP / 1000)
    // You can make this exponential later if needed: Math.floor(0.1 * Math.sqrt(totalXp)) + 1
    return 1 + Math.floor(totalXp / RULES.BASE_XP_PER_LEVEL);
};

// --- CORE: Rule Evaluation Engine ---
export const evaluateAction = (
    action: GameActionType, 
    context: any // Flexible context (Task object, Duty object, etc.)
): GameActionResult => {
    
    let result: GameActionResult = {
        xp: 0,
        hp: 0,
        coins: 0,
        message: 'Action processed'
    };

    switch (action) {
        case 'TASK_COMPLETE':
            result = calculateTaskCompletion(context);
            break;
        case 'TASK_LATE':
            result = calculateTaskLate(context);
            break;
        case 'DUTY_COMPLETE':
            result = { 
                xp: 20, 
                hp: 0, 
                coins: RULES.COIN_DUTY, 
                message: 'ขอบคุณที่ช่วยดูแลความสะอาด! 🧹',
                details: '+20 XP, +5 Coins'
            };
            break;
        case 'DUTY_MISSED':
            result = {
                xp: 0,
                hp: -RULES.HP_PENALTY_MISSED_DUTY,
                coins: 0,
                message: 'ลืมทำเวร! ระวังหลังเดาะนะ 🩸',
                details: `HP ลดลง ${RULES.HP_PENALTY_MISSED_DUTY}%`
            };
            break;
        case 'MANUAL_ADJUST':
            result = {
                xp: context.xp || 0,
                hp: context.hp || 0,
                coins: context.coins || 0,
                message: context.reason || 'Admin Adjustment'
            };
            break;
        default:
            break;
    }

    return result;
};

// --- SPECIFIC LOGIC HANDLERS ---

const calculateTaskCompletion = (task: any): GameActionResult => {
    const diff: Difficulty = task.difficulty || 'MEDIUM';
    const hours = Number(task.estimatedHours) || 0;
    
    // 1. Base XP
    let xp = RULES.DIFFICULTY_XP[diff] || RULES.DIFFICULTY_XP.MEDIUM;
    
    // 2. Hourly Bonus
    xp += Math.floor(hours * RULES.XP_PER_HOUR);

    // 3. Early Bonus?
    let coins = RULES.COIN_PER_TASK;
    const now = new Date();
    const dueDate = new Date(task.endDate);
    
    let message = `งานเสร็จแล้ว! รับรางวัลตอบแทน 🎉`;
    let details = `+${xp} XP`;

    // Check if Early (> 24 hours before deadline)
    if (isBefore(now, new Date(dueDate.getTime() - 24 * 60 * 60 * 1000))) {
        coins += RULES.COIN_BONUS_EARLY;
        xp += 50; // Early XP bonus
        message = `สุดยอด! ส่งงานก่อนกำหนดไวมาก ⚡️`;
        details += ` (Early Bonus +50 XP, +${RULES.COIN_BONUS_EARLY} Coins)`;
    } else {
        details += `, +${coins} Coins`;
    }

    return { xp, hp: 0, coins, message, details };
};

const calculateTaskLate = (task: any): GameActionResult => {
    const now = new Date();
    const dueDate = new Date(task.endDate);
    const daysLate = differenceInDays(now, dueDate);
    
    if (daysLate <= 0) return { xp: 0, hp: 0, coins: 0, message: '' };

    const hpLoss = RULES.HP_PENALTY_LATE; // Fixed penalty per occurrence usually, or scalable
    const coinLoss = Math.min(50, daysLate * RULES.COIN_PENALTY_LATE_PER_DAY); // Cap at 50

    return {
        xp: 0,
        hp: -hpLoss,
        coins: -coinLoss,
        message: `ส่งงานช้าไป ${daysLate} วัน! โดนหักคะแนน 🐢`,
        details: `HP -${hpLoss}, Coins -${coinLoss}`
    };
};
