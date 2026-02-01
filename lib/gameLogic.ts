
import { GameActionType, GameActionResult, Difficulty, GameConfig } from '../types';
import { differenceInDays, isBefore } from 'date-fns';

// --- DEFAULT FALLBACK CONFIGURATION ---
// Used when DB is offline or loading
export const DEFAULT_GAME_CONFIG = {
    XP_PER_HOUR: 20,
    DIFFICULTY_XP: {
        EASY: 50,
        MEDIUM: 100,
        HARD: 250
    } as any,
    COIN_PER_TASK: 10,
    COIN_BONUS_EARLY: 20,
    COIN_DUTY: 5,
    HP_PENALTY_LATE: 5,
    HP_PENALTY_MISSED_DUTY: 10,
    COIN_PENALTY_LATE_PER_DAY: 5,
    ATTENDANCE: {
        ON_TIME: { xp: 15, hp: 0, coins: 5 },
        LATE:    { xp: 0, hp: -5, coins: 0 },
        ABSENT:  { xp: 0, hp: -20, coins: -50 },
        NO_SHOW: { xp: 0, hp: -100, coins: -100 },
        LEAVE:   { xp: 0, hp: 0, coins: 0 },
        EARLY_LEAVE: { xp: 0, hp: 0, coins: 0 },
        WFH: { xp: 10, hp: 0, coins: 0 },
        SITE: { xp: 20, hp: 0, coins: 10 }
    } as any,
    BASE_XP_PER_LEVEL: 1000
};

// --- HELPER: Calculate Level from XP ---
export const calculateLevel = (totalXp: number, config: any = DEFAULT_GAME_CONFIG): number => {
    const base = config.GLOBAL_MULTIPLIERS?.BASE_XP_PER_LEVEL || config.BASE_XP_PER_LEVEL || 1000;
    return 1 + Math.floor(totalXp / base);
};

// --- CORE: Rule Evaluation Engine ---
export const evaluateAction = (
    action: GameActionType | string, 
    context: any,
    config: any = DEFAULT_GAME_CONFIG // Now accepts dynamic config
): GameActionResult => {
    
    let result: GameActionResult = {
        xp: 0,
        hp: 0,
        coins: 0,
        message: 'Action processed'
    };

    // Mapping Config Keys to Logic Variables
    // The config object passed here should be the merged object from GameConfigContext
    const ATTENDANCE = config.ATTENDANCE_RULES || config.ATTENDANCE;
    const MULTIPLIERS = config.GLOBAL_MULTIPLIERS || config;
    const PENALTIES = config.PENALTY_RATES || config;
    const DIFF_XP = config.DIFFICULTY_XP || config.DIFFICULTY_XP;

    switch (action) {
        // --- ATTENDANCE GROUP ---
        case 'ATTENDANCE_CHECK_IN':
            if (context.status === 'LATE') {
                result = {
                    ...ATTENDANCE.LATE,
                    message: `เข้างานสาย! 🐢 (${context.time})`,
                    details: `HP ${ATTENDANCE.LATE.hp}`
                };
            } else {
                result = {
                    ...ATTENDANCE.ON_TIME,
                    message: `เข้างานตรงเวลา! ☀️ (${context.time})`,
                    details: `+${ATTENDANCE.ON_TIME.xp} XP`
                };
            }
            break;

        case 'ATTENDANCE_ABSENT':
            result = {
                ...ATTENDANCE.ABSENT,
                message: 'ขาดงานโดยไม่แจ้ง! 👻',
                details: `HP ${ATTENDANCE.ABSENT.hp}, Coin ${ATTENDANCE.ABSENT.coins}`
            };
            break;

        case 'ATTENDANCE_NO_SHOW':
             result = {
                ...ATTENDANCE.NO_SHOW,
                message: 'หายเงียบ (No Show)! โดนหนักนะ 💀',
                details: `HP ${ATTENDANCE.NO_SHOW.hp}, Coin ${ATTENDANCE.NO_SHOW.coins}`
            };
            break;

        case 'ATTENDANCE_LEAVE':
            result = {
                ...ATTENDANCE.LEAVE,
                message: 'วันลาพักผ่อน 🏖️',
                details: 'รักษาสุขภาพนะครับ (ไม่หักคะแนน)'
            };
            break;

        // --- EXISTING GROUPS ---
        case 'TASK_COMPLETE':
            result = calculateTaskCompletion(context, config);
            break;
        case 'TASK_LATE':
            result = calculateTaskLate(context, config);
            break;
        case 'DUTY_COMPLETE':
            result = { 
                xp: 20, 
                hp: 0, 
                coins: MULTIPLIERS.COIN_DUTY || 5, 
                message: 'ขอบคุณที่ช่วยดูแลความสะอาด! 🧹',
                details: `+20 XP, +${MULTIPLIERS.COIN_DUTY || 5} Coins`
            };
            break;
        case 'DUTY_MISSED':
            const dutyPenalty = PENALTIES.HP_PENALTY_MISSED_DUTY || 10;
            result = {
                xp: 0,
                hp: -dutyPenalty,
                coins: 0,
                message: 'ลืมทำเวร! ระวังหลังเดาะนะ 🩸',
                details: `HP ลดลง ${dutyPenalty}%`
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

const calculateTaskCompletion = (task: any, config: any): GameActionResult => {
    const diff: Difficulty = task.difficulty || 'MEDIUM';
    const hours = Number(task.estimatedHours) || 0;
    
    const MULTIPLIERS = config.GLOBAL_MULTIPLIERS || config;
    const DIFF_XP = config.DIFFICULTY_XP || config.DIFFICULTY_XP;

    // 1. Base XP
    let xp = DIFF_XP[diff] || DIFF_XP.MEDIUM;
    
    // 2. Hourly Bonus
    xp += Math.floor(hours * (MULTIPLIERS.XP_PER_HOUR || 20));

    // 3. Early Bonus?
    let coins = MULTIPLIERS.COIN_PER_TASK || 10;
    const now = new Date();
    const dueDate = new Date(task.endDate);
    
    let message = `งานเสร็จแล้ว! รับรางวัลตอบแทน 🎉`;
    let details = `+${xp} XP`;

    // Check if Early (> 24 hours before deadline)
    if (isBefore(now, new Date(dueDate.getTime() - 24 * 60 * 60 * 1000))) {
        const bonus = MULTIPLIERS.COIN_BONUS_EARLY || 20;
        coins += bonus;
        xp += 50; // Early XP bonus (Hardcoded for now or add to config later)
        message = `สุดยอด! ส่งงานก่อนกำหนดไวมาก ⚡️`;
        details += ` (Early Bonus +50 XP, +${bonus} Coins)`;
    } else {
        details += `, +${coins} Coins`;
    }

    return { xp, hp: 0, coins, message, details };
};

const calculateTaskLate = (task: any, config: any): GameActionResult => {
    const now = new Date();
    const dueDate = new Date(task.endDate);
    const daysLate = differenceInDays(now, dueDate);
    
    if (daysLate <= 0) return { xp: 0, hp: 0, coins: 0, message: '' };

    const PENALTIES = config.PENALTY_RATES || config;

    const hpLoss = PENALTIES.HP_PENALTY_LATE || 5; 
    const coinPenaltyPerDay = PENALTIES.COIN_PENALTY_LATE_PER_DAY || 5;
    const coinLoss = Math.min(50, daysLate * coinPenaltyPerDay); 

    return {
        xp: 0,
        hp: -hpLoss,
        coins: -coinLoss,
        message: `ส่งงานช้าไป ${daysLate} วัน! โดนหักคะแนน 🐢`,
        details: `HP -${hpLoss}, Coins -${coinLoss}`
    };
};
