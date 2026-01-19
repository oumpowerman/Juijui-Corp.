
export type Role = 'ADMIN' | 'MEMBER';

export enum Status {
  // Generic / Simple Task
  TODO = 'TODO',
  DOING = 'DOING',
  BLOCKED = 'BLOCKED',

  // 01-02: Planning Phase
  IDEA = 'IDEA',
  SCRIPT = 'SCRIPT',
  
  // 03-04: Production Phase
  SHOOTING = 'SHOOTING',
  EDIT_CLIP = 'EDIT_CLIP',
  
  // 05: Feedback Loop 1
  FEEDBACK = 'FEEDBACK',
  
  // 06: Revision 1
  EDIT_DRAFT_1 = 'EDIT_DRAFT_1',
  
  // 07: Feedback Loop 2
  FEEDBACK_1 = 'FEEDBACK_1',
  
  // 08: Revision 2
  EDIT_DRAFT_2 = 'EDIT_DRAFT_2',
  
  // 09-10: Final Phase
  APPROVE = 'APPROVE',
  DONE = 'DONE',
}

export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export type Platform = 'YOUTUBE' | 'TIKTOK' | 'FACEBOOK' | 'INSTAGRAM' | 'OTHER';
export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD'; // New Difficulty Type

// Updated: Channel now represents a Brand which can have multiple platforms
export interface Channel {
  id: string;
  name: string;
  description?: string; // New field for channel concept/details
  color: string;
  platforms: Platform[]; 
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  avatarUrl: string;
  position: string;
  phoneNumber?: string; // New field
  isApproved: boolean;
  isActive: boolean; // NEW: Controls active/inactive status
  xp: number; // NEW: Experience Points (Lifetime)
  level: number; // NEW: User Level
  availablePoints: number; // NEW: Spendable Points for Rewards
}

// --- NEW: Goals System ---
export interface Goal {
    id: string;
    title: string; // e.g. "ผู้ติดตามครบ 100k"
    platform: Platform | 'ALL';
    currentValue: number;
    targetValue: number;
    deadline: Date;
    channelId?: string; // Optional: Link to specific channel
    isArchived: boolean;
}

// --- NEW: Rewards System ---
export interface Reward {
    id: string;
    title: string;
    description: string;
    cost: number;
    icon?: string; // Emoji or Icon name
    isActive: boolean;
}

export interface Redemption {
    id: string;
    userId: string;
    rewardId: string;
    redeemedAt: Date;
    rewardSnapshot?: Reward; // For history display
}

// --- NEW: System Notification Type ---
export interface AppNotification {
    id: string;
    type: 'OVERDUE' | 'UPCOMING' | 'REVIEW' | 'INFO';
    title: string;
    message: string;
    taskId?: string; // If related to a task
    date: Date;
    isRead: boolean;
}

export type TaskType = 'CONTENT' | 'TASK';

// Updated Pillars based on user request
export type ContentPillar = 'COMEDY' | 'STREET' | 'DEEP_TALK' | 'BEHIND' | 'FAN_INTERACTION' | 'EDUCATION' | 'ENTERTAINMENT' | 'LIFESTYLE' | 'PROMO' | 'OTHER';

// New: Content Formats based on user request
export type ContentFormat = 'SHORT_FORM' | 'LONG_FORM' | 'PICTURE' | 'ALBUM' | 'REELS' | 'STORY' | 'POST_H' | 'OTHER';

// New: Asset Category
export type AssetCategory = 'SCRIPT' | 'THUMBNAIL' | 'VIDEO_DRAFT' | 'INVOICE' | 'REF' | 'OTHER';

// New: Task Asset Structure
export interface TaskAsset {
    id: string;
    name: string;
    url: string;
    type: 'LINK' | 'FILE';
    category: AssetCategory;
    uploadedBy?: string;
    createdAt: Date;
}

// --- NEW: Review Session (Quality Gate) ---
export type ReviewStatus = 'PENDING' | 'PASSED' | 'REVISE';

export interface ReviewSession {
    id: string;
    taskId: string;
    round: number; // 1, 2, 3
    scheduledAt: Date; // Booked Time
    reviewerId: string; // CEO/Head
    status: ReviewStatus;
    feedback?: string;
    isCompleted: boolean;
    task?: Task; // Relation
}

// --- NEW: Task Log (Audit Trail) ---
export type LogAction = 'CREATED' | 'UPDATED' | 'STATUS_CHANGE' | 'DELAYED' | 'REVIEW_BOOKED';

export interface TaskLog {
    id: string;
    taskId: string;
    userId: string;
    action: LogAction;
    details: string;
    reason?: string;
    createdAt: Date;
    user?: { name: string, avatarUrl: string };
}

// --- NEW: Performance Metrics (Feedback Loop) ---
export interface TaskPerformance {
    views: number;
    likes: number;
    shares: number;
    comments: number;
    revenue: number;
    reflection: string; // Analysis of why it worked/failed
}

// --- NEW: Wiki Article (Knowledge Base) ---
export interface WikiArticle {
    id: string;
    title: string;
    category: 'ONBOARDING' | 'RULES' | 'TOOLS' | 'GENERAL';
    content: string; // Markdown or HTML string
    targetRoles: string[]; // ['ALL'], ['EDITOR'], ['CREATIVE'], etc.
    lastUpdated: Date;
    authorId?: string;
    isPinned: boolean;
}

// --- NEW: Duty (Roster System) ---
export interface Duty {
    id: string;
    title: string; // e.g. "ทิ้งขยะ", "สั่งข้าว", "เช็คสต็อก"
    assigneeId: string;
    date: Date;
    isDone: boolean;
}

// --- NEW: Duty Config (Master Data) ---
export interface DutyConfig {
    dayOfWeek: number; // 1=Mon, 5=Fri
    requiredPeople: number;
    taskTitles: string[]; // List of specific tasks e.g. ['Sweep', 'Mop']
}

export interface MasterOption {
    id: string;
    type: 'PILLAR' | 'FORMAT' | 'CATEGORY' | 'STATUS';
    key: string;
    label: string;
    color: string;
    sortOrder: number;
    isActive: boolean;
    isDefault?: boolean; // NEW: Flag for default selection
}

// Notification Settings Type
export interface NotificationPreferences {
    newAssignments: boolean;
    upcomingDeadlines: boolean;
    taskCompletions: boolean;
    systemUpdates: boolean;
    emailAlerts: boolean;
}

export interface ChecklistItem {
    id: string;
    text: string;
    isChecked: boolean;
    categoryId: string;
}

export interface ChecklistCategory {
    id: string;
    title: string;
    iconName: string; // 'camera', 'mic', 'light', 'box'
    color: string;
}

export interface ChecklistPreset {
    id: string;
    name: string;
    items: ChecklistItem[];
}

export interface WeeklyQuest {
    id: string;
    title: string;
    weekStartDate: Date;
    channelId?: string; 
    targetCount: number;
    
    // Type of Quest
    questType: 'AUTO' | 'MANUAL'; // NEW: Hybrid System
    manualProgress?: number;      // NEW: For Manual tracking

    // Enhanced Tracking Criteria (For AUTO):
    targetPlatform?: Platform | 'ALL';
    targetFormat?: string; 
    targetStatus?: string;
}

export interface TaskComment {
    id: string;
    taskId: string;
    userId: string;
    content: string;
    createdAt: Date;
    user?: User; // Joined info
}

export interface ChatMessage {
    id: string;
    content: string;
    userId: string;
    createdAt: Date;
    isBot: boolean;
    messageType?: string;
    user?: User;
}

// --- CALENDAR SMART FILTER TYPES ---
export type FilterType = 'CHANNEL' | 'FORMAT' | 'STATUS' | 'PILLAR';

export interface ChipConfig {
    id: string;
    label: string;
    type: FilterType;
    value: string;
    colorTheme: string;
}

export type ViewMode = 'DASHBOARD' | 'CALENDAR' | 'BOARD' | 'TEAM' | 'CHECKLIST' | 'CHANNELS' | 'STOCK' | 'WEEKLY' | 'CHAT' | 'MASTER_DATA' | 'QUALITY_GATE' | 'WIKI' | 'DUTY' | 'GOALS';

export interface Task {
  id: string;
  type: TaskType;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  tags: string[];
  
  // Dates
  startDate: Date;
  endDate: Date;
  isUnscheduled?: boolean; // For "Stock" ideas

  // Content Specific
  pillar?: ContentPillar;
  contentFormat?: ContentFormat;
  category?: string; // Free text or select
  channelId?: string;
  targetPlatforms?: Platform[];
  remark?: string; // Short note shown in calendar

  // Gamification Fields
  difficulty?: Difficulty; // NEW: Easy, Medium, Hard
  estimatedHours?: number; // NEW: Man-hours

  // People
  assigneeIds: string[]; // Workers
  ideaOwnerIds?: string[]; // Owners
  editorIds?: string[]; // Editors

  // New Features
  assets?: TaskAsset[];
  reviews?: ReviewSession[];
  logs?: TaskLog[];
  performance?: TaskPerformance; // NEW: Feedback Loop Data
}
