
import { User } from './core';

export type TaskType = 'CONTENT' | 'TASK' | 'PLAN';
export type Status = 'TODO' | 'DOING' | 'DONE' | 'BLOCKED' | 'IDEA' | 'SCRIPT' | 'SHOOTING' | 'EDIT_CLIP' | 'FEEDBACK' | 'EDIT_DRAFT_1' | 'FEEDBACK_1' | 'EDIT_DRAFT_2' | 'APPROVE' | 'WAITING' | 'REVISE' | 'FINAL' | string;
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

/**
 * @description แพลตฟอร์ม Social Media ปลายทางที่จะนำคอนเทนต์/คลิปไปเผยแพร่
 * เช่น YouTube, Facebook, TikTok, Instagram
 * 
 * ⚠️ คำเตือน: อย่าสับสนระหว่าง Platform กับ Channel!
 * - Platform = โซเชียลมีเดียที่จะเอาคลิปไปลง (YouTube, TikTok, FB ฯลฯ)
 * - Channel = ช่อง/แบรนด์/รายการผู้ผลิต (เช่น ช่อง Silly Buddies, ช่อง A, ช่อง B)
 * โดย 1 Channel (ช่อง) สามารถมีบัญชีโซเชียลมีเดียได้หลาย Platform
 */
export type Platform = 'YOUTUBE' | 'FACEBOOK' | 'TIKTOK' | 'INSTAGRAM' | 'OTHER' | 'ALL';

export type ContentPillar = 'ENTERTAINMENT' | 'EDUCATION' | 'LIFESTYLE' | 'PROMO' | 'REALTIME' | 'COMEDY' | 'STREET' | 'DEEP_TALK' | 'BEHIND' | 'FAN_INTERACTION' | 'OTHER' | string;
export type ContentFormat = 'SHORT_FORM' | 'LONG_FORM' | 'PICTURE' | 'ALBUM' | 'REELS' | 'STORY' | 'POST_H' | 'OTHER' | string;
export type AssetCategory = 'SCRIPT' | 'THUMBNAIL' | 'VIDEO_DRAFT' | 'INVOICE' | 'REF' | 'LINK' | 'OTHER';
export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type ReviewStatus = 'PENDING' | 'PASSED' | 'REVISE' | 'EXPIRED';
export type AssigneeType = 'TEAM' | 'INDIVIDUAL';
export type FilterType = 'STATUS' | 'FORMAT' | 'CHANNEL' | 'PILLAR' | 'CATEGORY' | 'ASSIGNEE';

export interface ChannelStrategy {
    pillars: {
        key: string;
        targetPercentage: number;
        categories: {
            key: string;
            targetPercentage: number;
        }[];
    }[];
}

/**
 * @description ช่อง / รายการ / แบรนด์ผู้ผลิตคอนเทนต์ (Content Creator / Brand / Show Entity)
 * 
 * ตัวอย่าง:
 * - "Silly Buddies Studio" (ช่องหลัก)
 * - "ช่องสาระบันเทิง A" (รายการ A)
 * - "ช่องเกม B" (รายการ B)
 * 
 * แต่ละ Channel มีบัญชี Social Media ของตัวเองได้หลาย Platform
 * เช่น ช่อง A มีทั้ง YouTube (Channel A), TikTok (Channel A), Facebook (Channel A)
 */
export interface Channel {
    /** รหัสระบุตัวตนของช่อง/รายการ */
    id: string;
    /** ชื่อของช่อง/รายการ/แบรนด์ เช่น "Silly Buddies", "Show A" */
    name: string;
    /** คำอธิบายคอนเซปต์ของช่อง/รายการ */
    description?: string;
    /** สีประจำช่อง (Tailwind class) */
    color: string;
    /** แพลตฟอร์ม Social Media ทั้งหมดที่ช่อง/รายการนี้มีบัญชีใช้งานอยู่ */
    platforms: Platform[];
    /** URL โลโก้ของช่อง/รายการ */
    logoUrl?: string;
    /** กลยุทธ์สัดส่วนคอนเทนต์ของช่อง */
    content_strategy?: ChannelStrategy | null;
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

    // --- NEW: Detailed Review Tracking (Single Source of Truth) ---
    submissionNotes?: string;
    qualityScore?: number;        // 1-5 or 1-100
    feedbackCategories?: string[]; // e.g., ["Visual", "Audio", "Content"]
    submissionAssetUrl?: string;  // Snapshot of the specific file being reviewed
    manualBonus?: number;         // Manual adjustment given during review
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

export interface DeadlineRequest {
    id: string;
    taskId: string;
    requestedBy: string;
    newDeadline: Date;
    reason: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    createdAt: Date;
    resolvedAt?: Date;
    resolvedBy?: string;
    user?: { name: string; avatarUrl: string };
    requestType?: 'TASK' | 'GOAL';
    goalId?: string;
    taskTitle?: string;
    goalTitle?: string;
    originalDeadline?: Date;
}

export interface Client {
    id: string;
    name: string;
    contactPerson?: string;
    email?: string;
    phone?: string;
    logoUrl?: string;
    isActive: boolean;
}

export interface SponsorshipDetail {
    taskId: string;
    clientId?: string;
    client?: Client;
    isSponsored: boolean;
    dealValue: number;
    requirements?: string;
    paymentStatus: 'UNPAID' | 'PARTIAL' | 'PAID' | string;
    isPaid: boolean;
    invoiceUrl?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface Task {
    id: string;
    type: TaskType;
    title: string;
    description: string;
    status: Status | string;
    priority?: Priority;
    tags: string[];
    startDate: Date;
    endDate: Date;
    createdAt?: Date;
    updatedAt?: Date;
    sponsorship?: SponsorshipDetail; // Optional sponsorship data
    
    // Content specific
    /** 
     * ID ของ "ช่อง / แบรนด์ / รายการ" ที่เป็นเจ้าของคลิปนี้ (เช่น ช่อง Silly Buddies, ช่อง A) 
     */
    channelId?: string;
    /** 
     * รายการ "แพลตฟอร์มโซเชียลมีเดีย" ที่จะนำคลิปนี้ไปเผยแพร่จริง (เช่น ['YOUTUBE', 'TIKTOK', 'FACEBOOK']) 
     */
    targetPlatforms?: Platform[];
    pillar?: ContentPillar | string;
    contentFormats?: (ContentFormat | string)[]; // New multi-format support
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
    deadlineRequests?: DeadlineRequest[];
    
    // Gamification & Meta
    difficulty?: Difficulty;
    estimatedHours?: number;
    performance?: TaskPerformance;
    scheduledTime?: string; // HH:mm format
    
    // New fields
    targetPosition?: string;
    caution?: string;
    importance?: string;
    publishedLinks?: Record<string, string>;
    
    // Production
    shootDate?: Date;
    shootLocation?: string;
    shootTripId?: string; // New
    shootTimeStart?: string; // New
    shootTimeEnd?: string;   // New
    shootNotes?: string;     // New
    isInShootQueue?: boolean;
    isSoftFinished?: boolean;
    localPath?: string;
    driveLabel?: string;

    // Sub-tasks
    contentId?: string; 
    showOnBoard?: boolean;
    parentContentTitle?: string;
    roadmapId?: string;

    // Script Link (General Task)
    scriptId?: string;

    // SLA Penalty
    sla_revert_count?: number;
    is_penalized?: boolean;
    last_penalized_at?: Date;
    hasAnalytics?: boolean;
    analyticsStatus?: 'NONE' | 'PARTIAL' | 'COMPLETE' | string;
    subChecklistProgress?: Record<string, boolean>;
    _isPartial?: boolean;

    // Routine & Personal Plan Fields
    isRoutine?: boolean;
    isMonthlyRecurring?: boolean;
    recurrence?: 'NONE' | 'MONTHLY' | 'DAILY' | 'WEEKLY' | string;
    routineStartDay?: number; // 1-31
    routineEndDay?: number;   // 1-31
    colorTheme?: string;
}

export interface ChipConfig {
    id: string;
    label: string;
    type: FilterType;
    value: string;
    colorTheme: string;
    scope?: 'CONTENT' | 'TASK' | 'PLAN';
    mode?: 'INCLUDE' | 'EXCLUDE';
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
    description?: string; // Added description field
    progressValue?: number;
}

export interface TaskComment {
    id: string;
    taskId: string;
    userId: string;
    content: string;
    createdAt: Date;
    user?: User;
}

export interface StorageConfig {
    id: string;
    label: string;
    currentLetter: string;
    description?: string;
    updatedAt: Date;
}

export const getChecklistGroupKey = (statusKey: string, masterOptions: MasterOption[]): string => {
    if (!statusKey || !masterOptions) return statusKey || '';
    const statusOption = masterOptions.find(o => o.type === 'STATUS' && o.key === statusKey);
    return statusOption?.parentKey || statusKey;
};
