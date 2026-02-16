
import { GameActionType, GameActionResult, Difficulty, GameConfig } from '../types';
import { differenceInDays, isBefore, format } from 'date-fns';
import th from 'date-fns/locale/th';

// --- DEFAULT FALLBACK CONFIGURATION ---
// Used when DB is offline or loading
export const DEFAULT_GAME_CONFIG = {
    GLOBAL_MULTIPLIERS: {
        XP_PER_HOUR: 20,
        COIN_PER_TASK: 10,
        COIN_BONUS_EARLY: 20,
        COIN_DUTY: 5,
        BASE_XP_PER_LEVEL: 1000,
        // New Flexible Keys
        XP_BONUS_EARLY: 50,
        XP_DUTY_COMPLETE: 20,
        XP_DUTY_LATE_SUBMIT: 5,
        P_DUTY_ASSIST: 10,
    },

    // XP Calculation
    DIFFICULTY_XP: {
        EASY: 50,
        MEDIUM: 100,
        HARD: 250
    },

    // Penalty Rates
    PENALTY_RATES: {
        HP_PENALTY_LATE: 5,           // Base damage per day
        HP_PENALTY_LATE_MULTIPLIER: 2, // Progressive multiplier (Compound damage)
        HP_PENALTY_MISSED_DUTY: 10,
        COIN_PENALTY_LATE_PER_DAY: 5,
        // New Flexible Keys
        HP_PENALTY_DUTY_LATE_SUBMIT: 3,
        HP_PENALTY_EARLY_LEAVE_RATE: 1, // Deduct 1 HP...
        HP_PENALTY_EARLY_LEAVE_INTERVAL: 10 // ...every 10 minutes
    },

    // Attendance Rules
    ATTENDANCE_RULES: {
        ON_TIME: { xp: 15, hp: 0, coins: 5 },
        LATE: { xp: 0, hp: -5, coins: 0 },
        ABSENT: { xp: 0, hp: -20, coins: -50 },
        NO_SHOW: { xp: 0, hp: -100, coins: -100 },
        LEAVE: { xp: 0, hp: 0, coins: 0 },
        EARLY_LEAVE: { xp: 0, hp: 0, coins: 0 },
        WFH: { xp: 10, hp: 0, coins: 0 },
        SITE: { xp: 20, hp: 0, coins: 10 }
    },

    // KPI Rewards (New Section)
    KPI_REWARDS: {
        A: { xp: 1000, coins: 500 },
        B: { xp: 500, coins: 200 },
        C: { xp: 200, coins: 50 },
        D: { xp: 0, coins: 0 }
    },

    // New Dynamic Configs
    LEVELING_SYSTEM: {
        formula: "LINEAR",
        base_xp_per_level: 1000,
        max_level: 100,
        level_up_bonus_coins: 500
    },
    ITEM_MECHANICS: {
        time_warp_refund_cap_hp: 20,
        time_warp_refund_percent: 100,
        shop_tax_rate: 0
    },
    AUTO_JUDGE_CONFIG: {
        negligence_penalty_hp: 20,
        lookback_days_check: 60,
        allow_holiday_penalty: false,
        negligence_threshold_days: 1
    },
    SYSTEM_MAINTENANCE: {
        duty_cleanup_days: 180,
        logs_cleanup_days: 365,
        notification_cleanup_days: 30
    },
    ATTENDANCE_GRADING_RULES: [
        { grade: "A+", max_late: 0, color: "bg-green-100 text-green-700", label: "Excellent" },
        { grade: "A", max_late: 1, color: "bg-emerald-100 text-emerald-700", label: "Good" },
        { grade: "B", max_late: 2, color: "bg-blue-100 text-blue-700", label: "Fair" },
        { grade: "C", max_late: 4, color: "bg-yellow-100 text-yellow-700", label: "Warning" },
        { grade: "F", max_late: 999, color: "bg-red-100 text-red-700", label: "Critical" }
    ]
};

export const calculateLevel = (xp: number, config: any = DEFAULT_GAME_CONFIG): number => {
    // Prefer LEVELING_SYSTEM, fallback to GLOBAL_MULTIPLIERS, then default
    const base = config.LEVELING_SYSTEM?.base_xp_per_level || config.GLOBAL_MULTIPLIERS?.BASE_XP_PER_LEVEL || 1000;
    return Math.floor(xp / base) + 1;
};

// Helper for date formatting
const formatDate = (date: Date | string) => {
    if (!date) return '';
    try {
        return format(new Date(date), 'd MMM', { locale: th });
    } catch (e) {
        return '';
    }
};

export const evaluateAction = (action: GameActionType, context: any, config: any = DEFAULT_GAME_CONFIG): GameActionResult => {
    // Ensure config exists, else fallback
    const cfg = config || DEFAULT_GAME_CONFIG;
    const diffXP = cfg.DIFFICULTY_XP || DEFAULT_GAME_CONFIG.DIFFICULTY_XP;
    const penalties = cfg.PENALTY_RATES || DEFAULT_GAME_CONFIG.PENALTY_RATES;
    const attendanceRules = cfg.ATTENDANCE_RULES || DEFAULT_GAME_CONFIG.ATTENDANCE_RULES;
    const globals = cfg.GLOBAL_MULTIPLIERS || DEFAULT_GAME_CONFIG.GLOBAL_MULTIPLIERS;
    const kpiRewards = cfg.KPI_REWARDS || DEFAULT_GAME_CONFIG.KPI_REWARDS;

    switch (action) {
        case 'TASK_COMPLETE': {
            const { difficulty, estimatedHours, endDate, title } = context;
            const taskName = title || 'งาน';
            // 1. Base XP
            let xp = diffXP[difficulty as Difficulty] || diffXP.MEDIUM;
            
            // 2. Hourly Bonus
            if (estimatedHours > 0) {
                xp += Math.floor(estimatedHours * (globals.XP_PER_HOUR || 20));
            }

            // 3. Early Bonus
            const isEarly = differenceInDays(new Date(endDate), new Date()) >= 1;
            let coins = globals.COIN_PER_TASK || 10;
            if (isEarly) {
                coins += globals.COIN_BONUS_EARLY || 20;
                xp += globals.XP_BONUS_EARLY || 50; // Dynamic Early XP Bonus
            }

            return {
                xp,
                hp: 0,
                coins,
                message: isEarly ? `🚀 ส่งงานไวสุดยอด!: ${taskName}` : `✅ ปิดงานสำเร็จ: ${taskName}`,
                details: `+${xp} XP, +${coins} JP`
            };
        }

        case 'TASK_LATE': {
            // UPDATED: Support Progressive Penalty passed via context
            // If customPenalty is provided (from AutoJudge), use it. Otherwise use default base.
            const basePenalty = penalties.HP_PENALTY_LATE || 5;
            const hpPenalty = context.customPenalty ? Math.abs(context.customPenalty) : basePenalty;
            const daysLate = context.daysLate || 1;
            const daysLateText = daysLate > 0 ? ` (ช้า ${daysLate} วัน)` : '';
            const taskTitle = context.title ? `"${context.title}"` : 'งาน';

            return {
                xp: 0,
                hp: -hpPenalty,
                coins: -(penalties.COIN_PENALTY_LATE_PER_DAY || 5),
                message: `โดนหักคะแนน! ${taskTitle} ล่าช้า${daysLateText}`,
                details: `-${hpPenalty} HP`
            };
        }

        case 'DUTY_COMPLETE': {
            const xpReward = globals.XP_DUTY_COMPLETE || 20;
            const coinReward = globals.COIN_DUTY || 5;
            const dateStr = context.date ? ` (${formatDate(context.date)})` : '';
            
            return {
                xp: xpReward, 
                hp: 0,
                coins: coinReward,
                message: `ทำเวรเสร็จสิ้น${dateStr} เยี่ยมมาก!`,
                details: `+${xpReward} XP, +${coinReward} JP`
            };
        }
        
        case 'DUTY_ASSIST': {
            const xpReward = globals.XP_DUTY_ASSIST || 30; // More XP for kindness
            const coinReward = globals.COIN_DUTY || 5;
            const targetName = context.targetName || 'เพื่อน';
            return {
                xp: xpReward,
                hp: 0,
                coins: coinReward,
                message: `สุดยอด! ช่วยทำเวรแทน ${targetName}`,
                details: `Hero Bonus: +${xpReward} XP`
            };
        }

        case 'DUTY_MISSED': {
            // Update: Show Date in Message
            const dateStr = context.date ? ` (${formatDate(context.date)})` : '';
            
            // FIX: Prioritize customPenalty (from AutoJudge Negligence Protocol)
            const penalty = context.customPenalty ? Math.abs(context.customPenalty) : (penalties.HP_PENALTY_MISSED_DUTY || 10);
            
            // FIX: Use custom description if provided (e.g. "เพิกเฉยต่อหน้าที่")
            const message = context.description || `ลืมทำเวร!${dateStr} ระวังหลังเดาะนะ`;

            return {
                xp: 0,
                hp: -penalty,
                coins: 0,
                message: message,
                details: `-${penalty} HP`
            };
        }

        case 'DUTY_LATE_SUBMIT': {
            const lateXp = globals.XP_DUTY_LATE_SUBMIT || 5;
            const lateHpPenalty = penalties.HP_PENALTY_DUTY_LATE_SUBMIT || 3;
            const dateStr = context.date ? ` (${formatDate(context.date)})` : '';

            return {
                xp: lateXp, 
                hp: -lateHpPenalty, 
                coins: 0,
                message: `ส่งเวรย้อนหลัง${dateStr}`,
                details: `-${lateHpPenalty} HP, +${lateXp} XP`
            };
        }

        case 'ATTENDANCE_CHECK_IN': {
            const status = context.status; // 'ON_TIME' | 'LATE'
            const rule = attendanceRules[status] || attendanceRules.ON_TIME;
            
            const timeStr = context.time ? ` @ ${context.time}` : '';
            const dateStr = context.date ? ` (${formatDate(context.date)})` : '';
            
            let msg = status === 'LATE' 
                ? `เข้างานสาย${timeStr}${dateStr}` 
                : `เข้างานตรงเวลา${timeStr}`;
            
            return {
                xp: rule.xp,
                hp: rule.hp,
                coins: rule.coins,
                message: msg,
                details: `${rule.xp > 0 ? `+${rule.xp} XP` : ''} ${rule.hp < 0 ? `${rule.hp} HP` : ''}`
            };
        }

        case 'ATTENDANCE_ABSENT': {
            const rule = attendanceRules.ABSENT;
            const dateStr = context.date ? ` (${formatDate(context.date)})` : '';
            return {
                xp: rule.xp,
                hp: rule.hp,
                coins: rule.coins,
                message: `ขาดงาน!${dateStr}`,
                details: `${rule.hp} HP`
            };
        }

        case 'ATTENDANCE_NO_SHOW': {
             const rule = attendanceRules.NO_SHOW;
             const dateStr = context.date ? ` (${formatDate(context.date)})` : '';
             return {
                 xp: rule.xp,
                 hp: rule.hp,
                 coins: rule.coins,
                 message: `หายตัวไปเลย (No Show)${dateStr}`,
                 details: 'CRITICAL PENALTY'
             };
        }
        
        case 'ATTENDANCE_EARLY_LEAVE': {
             // Dynamic calc based on missing minutes
             const interval = penalties.HP_PENALTY_EARLY_LEAVE_INTERVAL || 10;
             const rate = penalties.HP_PENALTY_EARLY_LEAVE_RATE || 1;
             
             const penalty = Math.ceil((context.missingMinutes || 0) / interval) * rate;
             const missingStr = context.missingMinutes ? ` (ขาด ${context.missingMinutes} นาที)` : '';

             return {
                 xp: 0,
                 hp: -penalty,
                 coins: 0,
                 message: `กลับก่อนเวลา${missingStr}`,
                 details: `-${penalty} HP`
             };
        }

        case 'SHOP_PURCHASE':
            return {
                xp: 0,
                hp: 0,
                coins: context.cost ? -context.cost : 0, // Handled in component usually, but for logging
                message: 'ซื้อไอเทมสำเร็จ',
                details: ''
            };
            
        case 'ITEM_USE':
            return {
                xp: 0,
                hp: 0,
                coins: 0,
                message: 'ใช้ไอเทมสำเร็จ',
                details: ''
            };
            
        case 'MANUAL_ADJUST':
            return {
                xp: context.xp || 0,
                hp: context.hp || 0,
                coins: context.coins || 0,
                message: 'Admin ปรับค่าพลัง',
                details: 'Manual Adjustment'
            };
            
        case 'TIME_WARP_REFUND':
             return {
                 xp: 0,
                 hp: 0, // Logic handles update directly
                 coins: 0,
                 message: 'Time Warp! คืนค่าพลังแล้ว',
                 details: 'Refunded'
             };

        // --- NEW: KPI REWARDS ---
        case 'KPI_REWARD': {
            const grade = context.grade || 'D';
            // Use Dynamic Rewards
            const r = kpiRewards[grade] || kpiRewards['D'] || { xp: 0, coins: 0 };
            
            return {
                xp: r.xp,
                hp: 0,
                coins: r.coins,
                message: `KPI Reward: Grade ${grade}`,
                details: `+${r.xp} XP, +${r.coins} JP`
            };
        }

        default:
            return { xp: 0, hp: 0, coins: 0, message: '', details: '' };
    }
};
