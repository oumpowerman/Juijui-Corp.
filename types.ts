
export type ViewMode = 'DASHBOARD' | 'CALENDAR' | 'CHAT' | 'TEAM' | 'WEEKLY' | 'GOALS' | 'DUTY' | 'QUALITY_GATE' | 'STOCK' | 'CHECKLIST' | 'WIKI' | 'CHANNELS' | 'MASTER_DATA' | 'KPI';

export type Role = 'ADMIN' | 'MEMBER';

export enum Status {
  TODO = 'TODO',
  DOING = 'DOING',
  BLOCKED = 'BLOCKED',
  IDEA = 'IDEA',
  SCRIPT = 'SCRIPT',
  SHOOTING = 'SHOOTING',
  EDIT_CLIP = 'EDIT_CLIP',
  FEEDBACK = 'FEEDBACK',
  EDIT_DRAFT_1 = 'EDIT_DRAFT_1',
  FEEDBACK_1 = 'FEEDBACK_1',
  EDIT_DRAFT_2 = 'EDIT_DRAFT_2',
  APPROVE = 'APPROVE',
  DONE = 'DONE'
}

export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export type Platform = 'YOUTUBE' | 'FACEBOOK' | 'TIKTOK' | 'INSTAGRAM' | 'OTHER' | 'ALL';

export type ContentPillar = 'COMEDY' | 'STREET' | 'DEEP_TALK' | 'BEHIND' | 'FAN_INTERACTION' | 'EDUCATION' | 'ENTERTAINMENT' | 'LIFESTYLE' | 'PROMO' | 'OTHER' | 'REALTIME';

export type ContentFormat = 'SHORT_FORM' | 'LONG_FORM' | 'PICTURE' | 'ALBUM' | 'REELS' | 'STORY' | 'POST_H' | 'OTHER';

export type AssetCategory = 'SCRIPT' | 'THUMBNAIL' | 'VIDEO_DRAFT' | 'INVOICE' | 'REF' | 'OTHER' | 'LINK';

export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

export type TaskType = 'CONTENT' | 'TASK';

export type FilterType = 'STATUS' | 'FORMAT' | 'CHANNEL' | 'PILLAR' | 'CATEGORY';

export type AssigneeType = 'TEAM' | 'INDIVIDUAL';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  avatarUrl?: string;
  position?: string;
  phoneNumber?: string; // เบอร์โทร
  bio?: string;         // คำแนะนำตัว
  feeling?: string;     // สถานะ/ความรู้สึก
  isApproved: boolean;
  isActive: boolean;
  xp: number;
  level: number;
  availablePoints: number;
}

export interface TaskAsset {
  id: string;
  name: string;
  url: string;
  type: 'LINK' | 'FILE';
  category: AssetCategory;
  createdAt: Date;
}

export interface TaskPerformance {
  views: number;
  likes: number;
  shares: number;
  comments: number;
  revenue: number;
  reflection: string;
}

export type ReviewStatus = 'PENDING' | 'PASSED' | 'REVISE';

export interface ReviewSession {
  id: string;
  taskId: string;
  round: number;
  scheduledAt: Date;
  reviewerId?: string;
  status: ReviewStatus;
  feedback?: string;
  isCompleted: boolean;
  task?: Task;
}

export interface TaskLog {
  id: string;
  taskId: string;
  userId: string;
  action: string;
  details: string;
  reason?: string;
  createdAt: Date;
  user?: { name: string; avatarUrl?: string };
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
  
  channelId?: string;
  targetPlatforms?: Platform[];
  pillar?: ContentPillar | string;
  contentFormat?: ContentFormat | string;
  category?: string;
  remark?: string;
  
  // Assignee Logic
  assigneeType?: AssigneeType;
  assigneeIds: string[];
  targetPosition?: string; 
  
  // Specific Details
  caution?: string; 
  importance?: string; 
  publishedLinks?: Record<string, string>; // CHANGED: Key=Platform, Value=URL

  ideaOwnerIds?: string[];
  editorIds?: string[];
  
  isUnscheduled?: boolean;
  assets?: TaskAsset[];
  reviews?: ReviewSession[];
  logs?: TaskLog[];
  
  difficulty?: Difficulty;
  estimatedHours?: number;
  performance?: TaskPerformance;
}

export interface Channel {
  id: string;
  name: string;
  description?: string;
  color: string;
  platforms: Platform[];
  platform?: Platform;
}

export interface MasterOption {
  id: string;
  type: 'STATUS' | 'FORMAT' | 'PILLAR' | 'CATEGORY' | 'POSITION' | 'RESPONSIBILITY' | 'INV_CAT_L1' | 'INV_CAT_L2' | 'TASK_STATUS' | 'KPI_CRITERIA';
  key: string;
  label: string;
  color?: string;
  sortOrder: number;
  isActive: boolean;
  isDefault?: boolean;
  parentKey?: string;
}

export interface ChipConfig {
    id: string;
    label: string;
    type: FilterType;
    value: string;
    colorTheme: string;
    scope?: 'CONTENT' | 'TASK';
}

export interface DashboardConfig {
    id: string;
    key: string;
    label: string;
    icon?: string;
    colorTheme: string;
    statusKeys: string[];
    filterType?: 'STATUS' | 'FORMAT' | 'PILLAR' | 'CATEGORY';
    sortOrder: number;
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
    user?: { name: string; avatarUrl?: string };
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
    iconName: string;
    color: string;
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
    imageUrl?: string | null;
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
    type: 'OVERDUE' | 'UPCOMING' | 'REVIEW' | 'INFO';
    title: string;
    message: string;
    taskId?: string;
    date: Date;
    isRead: boolean;
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
}

export interface WeeklyQuest {
    id: string;
    title: string;
    weekStartDate: Date;
    channelId?: string;
    targetCount: number;
    targetPlatform?: Platform | 'ALL';
    targetFormat?: string;
    targetStatus?: string;
    questType: 'AUTO' | 'MANUAL';
    manualProgress?: number;
}

export interface ChatMessage {
    id: string;
    content: string;
    userId: string;
    createdAt: Date;
    isBot: boolean;
    messageType?: 'TEXT' | 'TASK_CREATED' | 'IMAGE' | 'FILE';
    user?: User;
}

export interface TaskComment {
    id: string;
    taskId: string;
    userId: string;
    content: string;
    createdAt: Date;
    user?: User;
}

export interface WikiArticle {
    id: string;
    title: string;
    category: string;
    content: string;
    targetRoles: string[];
    lastUpdated: Date;
    isPinned: boolean;
}

export interface Duty {
    id: string;
    title: string;
    assigneeId: string;
    date: Date;
    isDone: boolean;
}

export interface DutyConfig {
    dayOfWeek: number;
    requiredPeople: number;
    taskTitles: string[];
}

export interface KPIRecord {
    id: string;
    userId: string;
    evaluatorId: string;
    monthKey: string; // "YYYY-MM"
    scores: Record<string, number>; // { "CRITERIA_KEY": 5 }
    feedback: string;
    status: 'DRAFT' | 'FINAL' | 'PAID';
    totalScore: number;
    maxScore: number;
    updatedAt: Date;
}
