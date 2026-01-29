
// Enums and Unions
export type Role = 'ADMIN' | 'MEMBER';
export type TaskType = 'CONTENT' | 'TASK';
export type Status = 'TODO' | 'DOING' | 'DONE' | 'BLOCKED' | 'IDEA' | 'SCRIPT' | 'SHOOTING' | 'EDIT_CLIP' | 'FEEDBACK' | 'EDIT_DRAFT_1' | 'FEEDBACK_1' | 'EDIT_DRAFT_2' | 'APPROVE' | 'WAITING' | 'REVISE' | 'FINAL' | string;
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type Platform = 'YOUTUBE' | 'FACEBOOK' | 'TIKTOK' | 'INSTAGRAM' | 'OTHER' | 'ALL';
export type ContentPillar = 'ENTERTAINMENT' | 'EDUCATION' | 'LIFESTYLE' | 'PROMO' | 'REALTIME' | 'COMEDY' | 'STREET' | 'DEEP_TALK' | 'BEHIND' | 'FAN_INTERACTION' | 'OTHER' | string;
export type ContentFormat = 'SHORT_FORM' | 'LONG_FORM' | 'PICTURE' | 'ALBUM' | 'REELS' | 'STORY' | 'POST_H' | 'OTHER' | string;
export type AssetCategory = 'SCRIPT' | 'THUMBNAIL' | 'VIDEO_DRAFT' | 'INVOICE' | 'REF' | 'LINK' | 'OTHER';
export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type WorkStatus = 'ONLINE' | 'BUSY' | 'SICK' | 'VACATION' | 'MEETING';
export type ViewMode = 'DASHBOARD' | 'CALENDAR' | 'TEAM' | 'CHAT' | 'STOCK' | 'CHECKLIST' | 'CHANNELS' | 'SCRIPT_HUB' | 'MEETINGS' | 'DUTY' | 'QUALITY_GATE' | 'KPI' | 'FEEDBACK' | 'MASTER_DATA' | 'WEEKLY' | 'GOALS' | 'WIKI' | 'SYSTEM_GUIDE';
export type ReviewStatus = 'PENDING' | 'PASSED' | 'REVISE';
export type AssigneeType = 'TEAM' | 'INDIVIDUAL';
export type ScriptType = 'MONOLOGUE' | 'DIALOGUE';
export type ScriptStatus = 'DRAFT' | 'REVIEW' | 'FINAL' | 'SHOOTING' | 'DONE';
export type MeetingCategory = 'GENERAL' | 'PROJECT' | 'CRISIS' | 'CREATIVE' | 'HR';
export type FilterType = 'STATUS' | 'FORMAT' | 'CHANNEL' | 'PILLAR' | 'CATEGORY';
export type FeedbackType = 'IDEA' | 'ISSUE' | 'SHOUTOUT';
export type FeedbackStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type GameActionType = 'TASK_COMPLETE' | 'TASK_LATE' | 'DUTY_COMPLETE' | 'DUTY_MISSED' | 'MANUAL_ADJUST' | 'SHOP_PURCHASE' | 'ITEM_USE' | 'TIME_WARP_REFUND';

// Interfaces

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

export interface Channel {
    id: string;
    name: string;
    description?: string;
    color: string;
    platforms: Platform[];
    logoUrl?: string;
    platform?: Platform; // Legacy
}

export interface TaskPerformance {
    views: number;
    likes: number;
    shares: number;
    comments: number;
    revenue: number;
    reflection: string;
}

export interface TaskAsset {
    id: string;
    name: string;
    url: string;
    type: 'LINK' | 'FILE';
    category: AssetCategory;
    createdAt: Date;
}

export interface ReviewSession {
    id: string;
    taskId: string;
    round: number;
    scheduledAt: Date;
    reviewerId?: string | null;
    status: ReviewStatus;
    feedback?: string;
    isCompleted: boolean;
    task?: Task;
}

export interface TaskLog {
    id: string;
    taskId: string;
    userId?: string;
    action: string;
    details: string;
    reason?: string;
    createdAt: Date;
    user?: { name: string; avatarUrl: string };
}

export interface Task {
    id: string;
    type: TaskType;
    title: string;
    description: string;
    status: Status | string;
    priority: Priority;
    tags: string[];
    startDate: Date;
    endDate: Date;
    createdAt?: Date; // Added for Notification Logic
    
    // Content specific
    channelId?: string;
    targetPlatforms?: Platform[];
    pillar?: ContentPillar | string;
    contentFormat?: ContentFormat | string;
    category?: string;
    isUnscheduled?: boolean;
    
    // People
    assigneeIds: string[];
    ideaOwnerIds?: string[];
    editorIds?: string[];
    assigneeType?: AssigneeType;
    
    // Details
    remark?: string;
    assets?: TaskAsset[];
    reviews?: ReviewSession[];
    logs?: TaskLog[];
    
    // Gamification & Meta
    difficulty?: Difficulty;
    estimatedHours?: number;
    performance?: TaskPerformance;
    
    // New fields
    targetPosition?: string;
    caution?: string;
    importance?: string;
    publishedLinks?: Record<string, string>;
    
    // Production
    shootDate?: Date;
    shootLocation?: string;

    // Trinity Phase 2: Sub-tasks
    contentId?: string; // If this task is a sub-task of a content
    
    // Board Promotion
    showOnBoard?: boolean;
    parentContentTitle?: string;
}

export interface MasterOption {
    id: string;
    type: string; 
    key: string;
    label: string;
    color: string;
    sortOrder: number;
    isActive: boolean;
    isDefault?: boolean;
    parentKey?: string;
}

export interface ChecklistItem {
    id: string;
    text: string;
    isChecked: boolean;
    categoryId: string;
}

export interface ChecklistPreset {
    id: string;
    name: string;
    items: { text: string; categoryId: string }[];
}

export interface InventoryItem {
    id: string;
    name: string;
    description?: string;
    categoryId: string;
    imageUrl?: string;
}

export interface ChipConfig {
    id: string;
    label: string;
    type: FilterType;
    value: string;
    colorTheme: string;
    scope?: 'CONTENT' | 'TASK';
    mode?: 'INCLUDE' | 'EXCLUDE'; // New field for Exclusion logic
}

export interface NotificationPreferences {
    newAssignments: boolean;
    upcomingDeadlines: boolean;
    taskCompletions: boolean;
    systemUpdates: boolean;
    emailAlerts: boolean;
}

export interface AppNotification {
    id: string;
    type: 'OVERDUE' | 'UPCOMING' | 'REVIEW' | 'INFO' | 'NEW_ASSIGNMENT';
    title: string;
    message: string;
    taskId?: string;
    date: Date;
    isRead: boolean;
}

export interface ChatMessage {
    id: string;
    content: string;
    userId: string | null;
    isBot: boolean;
    messageType: 'TEXT' | 'IMAGE' | 'FILE' | 'TASK_CREATED';
    createdAt: Date;
    user?: User;
}

export interface WeeklyQuest {
    id: string;
    title: string;
    weekStartDate: Date;
    endDate?: Date; // Added for flexible duration
    channelId?: string;
    targetCount: number;
    targetPlatform?: Platform | 'ALL';
    targetFormat?: string[]; // CHANGED: Now supports array of formats
    targetStatus?: string;
    questType: 'AUTO' | 'MANUAL';
    manualProgress?: number;
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

export interface WikiArticle {
    id: string;
    title: string;
    category: string;
    content: string;
    targetRoles?: string[];
    createdAt: Date;
    lastUpdated: Date;
    isPinned: boolean;
    coverImage?: string;
    helpfulCount?: number;
    createdBy?: string;
    updatedBy?: string;
    author?: { name: string; avatarUrl: string };
    lastEditor?: { name: string; avatarUrl: string };
}

export interface Duty {
    id: string;
    title: string;
    assigneeId: string;
    date: Date;
    isDone: boolean;
    proofImageUrl?: string;
    isPenalized?: boolean;
}

export interface DutyConfig {
    dayOfWeek: number;
    requiredPeople: number;
    taskTitles: string[];
}

export interface DutySwap {
    id: string;
    requestorId: string;
    targetDutyId: string;
    ownDutyId: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    createdAt: Date;
    requestor?: { name: string; avatarUrl: string };
    targetDuty?: { title: string; date: string; assigneeId: string };
    ownDuty?: { title: string; date: string; assigneeId: string };
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

export interface DashboardConfig {
    id: string;
    key: string;
    label: string;
    icon?: string;
    colorTheme?: string;
    statusKeys?: string[];
    filterType?: FilterType;
    sortOrder: number;
}

export interface ScriptSummary {
    id: string;
    title: string;
    status: ScriptStatus;
    version: number;
    authorId: string;
    contentId?: string;
    createdAt: Date;
    updatedAt: Date;
    author?: { name: string; avatarUrl: string };
    ideaOwnerId?: string;
    ideaOwner?: { name: string; avatarUrl: string };
    linkedTaskTitle?: string;
    estimatedDuration: number;
    scriptType: ScriptType;
    isInShootQueue: boolean;
    channelId?: string;
    category?: string;
    tags: string[];
    objective?: string;
    lockedBy?: string;
    lockedAt?: Date;
    locker?: { name: string; avatarUrl: string };
    // Sharing
    shareToken?: string;
    isPublic?: boolean;
}

export interface Script extends ScriptSummary {
    content: string;
    characters?: string[];
}

export interface FeedbackItem {
    id: string;
    type: FeedbackType;
    content: string;
    status: FeedbackStatus;
    isAnonymous: boolean;
    createdAt: Date;
    voteCount: number;
    hasVoted: boolean;
    creatorName?: string;
    creatorAvatar?: string;
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

export interface BackupOptions {
    tasks: boolean;
    contents: boolean;
    chats: boolean;
    profiles: boolean;
}

export interface StorageStats {
    usedBytes: number;
    fileBytes: number; // Size of files in storage buckets
    dbBytes: number;   // Size of database tables/indexes
    fileCount: number;
    limitBytes: number;
}

export interface GameActionResult {
    xp: number;
    hp: number;
    coins: number;
    message: string;
    details?: string;
}

export interface MeetingAgendaItem {
    id: string;
    topic: string;
    duration?: number;
    isCompleted: boolean;
}

export interface MeetingLog {
    id: string;
    title: string;
    date: Date;
    content: string;
    decisions?: string; // New: Separated Decisions Field
    category: MeetingCategory; 
    attendees: string[];
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
    authorId: string;
    agenda?: MeetingAgendaItem[];
    assets?: TaskAsset[];
}

export interface MenuGroup {
    id: string;
    title: string;
    icon: any; 
    items: { view: ViewMode; label: string; icon: any }[];
    adminOnly?: boolean;
}

export interface CalendarHighlight {
    id: string;
    date: Date;
    typeKey: string;
    note?: string;
}

export interface AnnualHoliday {
    id: string;
    name: string;
    day: number;
    month: number;
    typeKey: string;
    isActive: boolean;
}

export interface TaskComment {
    id: string;
    taskId: string;
    userId: string;
    content: string;
    createdAt: Date;
    user?: User;
}

export interface Greeting {
    id: string;
    text: string;
    category?: string;
    isActive: boolean;
}
