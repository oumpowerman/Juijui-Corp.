
import { Platform, User } from './index';

export type GameActionType = 'TASK_COMPLETE' | 'TASK_LATE' | 'DUTY_COMPLETE' | 'DUTY_ASSIST' | 'DUTY_MISSED' | 'DUTY_LATE_SUBMIT' | 'MANUAL_ADJUST' | 'SHOP_PURCHASE' | 'ITEM_USE' | 'TIME_WARP_REFUND' | 'ATTENDANCE_CHECK_IN' | 'ATTENDANCE_ABSENT' | 'ATTENDANCE_LEAVE' | 'ATTENDANCE_NO_SHOW' | 'ATTENDANCE_EARLY_LEAVE' | 'KPI_REWARD';

export interface WeeklyQuest {
    id: string;
    title: string;
    weekStartDate: Date;
    endDate?: Date;
    channelId?: string;
    targetCount: number;
    targetPlatform?: Platform | 'ALL';
    targetFormat?: string[]; // Array of format keys
    targetStatus?: string;
    questType: 'AUTO' | 'MANUAL';
    manualProgress?: number;
    groupId?: string;
    groupTitle?: string;
    createdAt?: Date;
}

export interface ShopItem {
    id: string;
    name: string;
    description: string;
    price: number;
    icon: string; // Emoji or Lucide icon name
    effectType: 'HEAL_HP' | 'SKIP_DUTY' | 'REMOVE_LATE' | 'OTHER';
    effectValue: number;
    isActive: boolean;
}

export interface UserInventoryItem {
    id: string;
    userId: string;
    itemId: string;
    isUsed: boolean;
    usedAt?: Date;
    item?: ShopItem; // Joined data
}

export interface Goal {
    id: string;
    title: string;
    platform: Platform | 'ALL';
    currentValue: number;
    targetValue: number;
    deadline: Date;
    channelId?: string;
    isArchived: boolean;
    rewardXp: number;
    rewardCoin: number;
    owners: string[]; // User IDs
    boosts: string[]; // User IDs
}

export interface Reward {
    id: string;
    title: string;
    description: string;
    cost: number;
    icon: string;
    isActive: boolean;
}

export interface Redemption {
    id: string;
    userId: string;
    rewardId: string;
    redeemedAt: Date;
    rewardSnapshot?: Reward; // To keep history if reward changes
}

export interface GameActionResult {
    xp: number;
    hp: number;
    coins: number;
    message: string;
    details?: string;
}

export interface GameConfig {
    GLOBAL_MULTIPLIERS: {
        XP_PER_HOUR: number;
        COIN_PER_TASK: number;
        COIN_BONUS_EARLY: number;
        COIN_DUTY: number;
        BASE_XP_PER_LEVEL: number;
        XP_BONUS_EARLY: number;
        XP_DUTY_COMPLETE: number;
        XP_DUTY_LATE_SUBMIT: number;
        XP_DUTY_ASSIST?: number;
        [key: string]: number | undefined;
    };
    DIFFICULTY_XP: {
        EASY: number;
        MEDIUM: number;
        HARD: number;
        [key: string]: number;
    };
    PENALTY_RATES: {
        HP_PENALTY_LATE: number;
        HP_PENALTY_LATE_MULTIPLIER: number;
        HP_PENALTY_MISSED_DUTY: number;
        COIN_PENALTY_LATE_PER_DAY: number;
        HP_PENALTY_DUTY_LATE_SUBMIT: number;
        HP_PENALTY_EARLY_LEAVE_RATE: number;
        HP_PENALTY_EARLY_LEAVE_INTERVAL: number;
        [key: string]: number;
    };
    ATTENDANCE_RULES: Record<string, { xp: number; hp: number; coins: number }>;
    KPI_REWARDS: Record<string, { xp: number; coins: number }>;
}
