
import { User, TaskAsset, FilterType, ViewMode } from './index';

// --- SCRIPT ---
export type ScriptType = 'MONOLOGUE' | 'DIALOGUE';
export type ScriptStatus = 'DRAFT' | 'REVIEW' | 'FINAL' | 'SHOOTING' | 'DONE';

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
    shareToken?: string;
    isPublic?: boolean;
}

export interface Script extends ScriptSummary {
    content: string;
    characters?: string[];
}

// --- CHECKLIST ---
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

// --- MEETING ---
export type MeetingCategory = 'GENERAL' | 'PROJECT' | 'CRISIS' | 'CREATIVE' | 'HR';

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
    decisions?: string; 
    category: MeetingCategory; 
    attendees: string[];
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
    authorId: string;
    agenda?: MeetingAgendaItem[];
    assets?: TaskAsset[];
}

// --- FEEDBACK ---
export type FeedbackType = 'IDEA' | 'ISSUE' | 'SHOUTOUT';
export type FeedbackStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

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

// --- DUTY ---
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

// --- WIKI ---
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

// --- SYSTEM ---
export interface NotificationPreferences {
    newAssignments: boolean;
    upcomingDeadlines: boolean;
    taskCompletions: boolean;
    systemUpdates: boolean;
    emailAlerts: boolean;
}

export interface AppNotification {
    id: string;
    type: 'OVERDUE' | 'UPCOMING' | 'REVIEW' | 'INFO' | 'NEW_ASSIGNMENT' | 'APPROVAL_REQ';
    title: string;
    message: string;
    taskId?: string;
    date: Date;
    isRead: boolean;
    actionLink?: string; // Optional link for navigation
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

export interface BackupOptions {
    tasks: boolean;
    contents: boolean;
    chats: boolean;
    profiles: boolean;
}

export interface StorageStats {
    usedBytes: number;
    fileBytes: number; 
    dbBytes: number;   
    fileCount: number;
    limitBytes: number;
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

export interface Greeting {
    id: string;
    text: string;
    category?: string;
    isActive: boolean;
}
