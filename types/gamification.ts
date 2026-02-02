
import { Platform, User } from './index'; // Import form index to allow circular ref resolution or specific files

export type GameActionType = 'TASK_COMPLETE' | 'TASK_LATE' | 'DUTY_COMPLETE' | 'DUTY_MISSED' | 'MANUAL_ADJUST' | 'SHOP_PURCHASE' | 'ITEM_USE' | 'TIME_WARP_REFUND' | 'ATTENDANCE_CHECK_IN' | 'ATTENDANCE_ABSENT' | 'ATTENDANCE_LEAVE' | 'ATTENDANCE_NO_SHOW';

export interface WeeklyQuest {
    id: string;
    title: string;
    weekStartDate: Date;
    endDate?: Date;
    channelId?: string;
    targetCount: number;
    targetPlatform?: Platform | 'ALL';
    targetFormat?: string[];
    targetStatus?: string;
    questType: 'AUTO' | 'MANUAL';
    manualProgress?: number;
    // New Fields for Grouping
    groupId?: string;
    groupTitle?: string;
}

export interface Reward {
    id: string;
    title: string;
    description?: string;
    cost: number;
    icon?: string;
    isActive: boolean;
}

export interface Redemption {
    id: string;
    userId: string;
    rewardId: string;
    redeemedAt: Date;
    rewardSnapshot?: Reward;
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
    owners: string[];
    boosts: string[];
}

export interface ShopItem {
    id: string;
    name: string;
    description: string;
    price: number;
    icon: string;
    effectType: string;
    effectValue: number;
}

export interface UserInventoryItem {
    id: string;
    itemId: string;
    userId: string;
    isUsed: boolean;
    item?: ShopItem;
}

export interface KPIRecord {
    id: string;
    userId: string;
    evaluatorId: string;
    monthKey: string;
    scores: Record<string, number>;
    feedback: string;
    status: 'DRAFT' | 'FINAL' | 'PAID';
    totalScore: number;
    maxScore: number;
    updatedAt: Date;
}

export interface GameActionResult {
    xp: number;
    hp: number;
    coins: number;
    message: string;
    details?: string;
}

// --- NEW CONFIG TYPES ---
export interface AttendanceRule {
    xp: number;
    hp: number;
    coins: number;
}

export interface GameConfig {
    key: string;
    value: any; // JSONB
    description?: string;
    category?: string;
    updatedAt?: Date;
}

export interface GlobalMultipliers {
    XP_PER_HOUR: number;
    COIN_PER_TASK: number;
    COIN_BONUS_EARLY: number;
    COIN_DUTY: number;
    BASE_XP_PER_LEVEL: number;
}

export interface DifficultyXP {
    EASY: number;
    MEDIUM: number;
    HARD: number;
}

export interface PenaltyRates {
    HP_PENALTY_LATE: number;
    HP_PENALTY_MISSED_DUTY: number;
    COIN_PENALTY_LATE_PER_DAY: number;
}
