
export type Role = 'ADMIN' | 'MEMBER';
export type WorkStatus = 'ONLINE' | 'BUSY' | 'SICK' | 'VACATION' | 'MEETING';
export type ViewMode = 'DASHBOARD' | 'CALENDAR' | 'TEAM' | 'CHAT' | 'STOCK' | 'CHECKLIST' | 'CHANNELS' | 'SCRIPT_HUB' | 'MEETINGS' | 'DUTY' | 'QUALITY_GATE' | 'KPI' | 'FEEDBACK' | 'MASTER_DATA' | 'WEEKLY' | 'GOALS' | 'WIKI' | 'SYSTEM_GUIDE' | 'ATTENDANCE' | 'FINANCE' | 'LEADERBOARD';

export interface User {
    id: string;
    email: string;
    name: string;
    role: Role;
    avatarUrl: string;
    position: string;
    phoneNumber?: string;
    bio?: string;
    feeling?: string;
    isApproved: boolean;
    isActive: boolean;
    xp: number;
    level: number;
    availablePoints: number;
    hp: number;
    maxHp: number;
    workStatus: WorkStatus;
    leaveStartDate?: Date | null;
    leaveEndDate?: Date | null;
}
