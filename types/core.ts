
export type Role = 'ADMIN' | 'MEMBER';
export type WorkStatus = 'ONLINE' | 'BUSY' | 'SICK' | 'VACATION' | 'MEETING' | 'OFFLINE';
export type ViewMode = 'DASHBOARD' | 'CALENDAR' | 'TEAM' | 'CHAT' | 'ContentStock' | 'CHECKLIST' | 'COMPANY_CHECKLIST' | 'CHANNELS' | 'SCRIPT_HUB' | 'MEETINGS' | 'DUTY' | 'QUALITY_GATE' | 'KPI' | 'FEEDBACK' | 'MASTER_DATA' | 'WEEKLY' | 'GOALS' | 'WIKI' | 'SYSTEM_GUIDE' | 'ATTENDANCE' | 'FINANCE' | 'LEADERBOARD' | 'ASSETS' | 'NEXUS' | 'ROADMAP' | 'ANALYTICS' | 'ULTIMATE_WORKROOM';

export type EmploymentType = 'FULL_TIME' | 'PROBATION' | 'INTERN' | 'FREELANCE' | 'PART_TIME' | 'CONTRACT';

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'DEATH';

export type OrganizationRole = 'OWNER' | 'ADMIN' | 'MEMBER';
export type OrganizationMemberStatus = 'ACTIVE' | 'PENDING' | 'REJECTED';
export type PlanTier = 'STARTER' | 'PRO' | 'ENTERPRISE' | 'LIFETIME';
export type SubscriptionStatus = 'TRIAL' | 'ACTIVE' | 'GRACE_PERIOD' | 'PAST_DUE' | 'EXPIRED' | 'SUSPENDED';

export interface Organization {
    id: string;
    name: string;
    slug: string;
    description?: string;
    logoUrl?: string;
    color?: string;
    inviteCode: string;
    inviteEnabled: boolean;
    ownerId?: string | null;
    planTier?: PlanTier;
    subscriptionStatus?: SubscriptionStatus;
    expiresAt?: Date | null;
    gracePeriodDays?: number;
    maxMembers?: number;
    allowedModules?: string[] | null;
    ownerClaimToken?: string | null;
    billingEmail?: string | null;
    externalCustomerId?: string | null;
    memberCount?: number;
    isActive: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface SubscriptionInvoice {
    id: string;
    orgId: string;
    orgName?: string;
    invoiceNumber: string;
    planTier: PlanTier;
    amount: number;
    currency: string;
    billingCycle: 'MONTHLY' | 'YEARLY' | 'LIFETIME';
    paymentMethod: 'STRIPE' | 'OMISE' | 'BANK_TRANSFER' | 'MANUAL';
    paymentStatus: 'PENDING' | 'PAID' | 'REJECTED' | 'FAILED';
    slipUrl?: string | null;
    note?: string | null;
    externalChargeId?: string | null;
    periodStart?: Date | null;
    periodEnd?: Date | null;
    approvedBy?: string | null;
    createdAt: Date;
}

export interface OrganizationMember {
    id: string;
    orgId: string;
    userId: string;
    role: OrganizationRole;
    status: OrganizationMemberStatus;
    joinedAt?: Date;
    user?: {
        id: string;
        name: string;
        email: string;
        avatarUrl?: string;
        position?: string;
    };
}

export interface Company {
    id: string;
    orgId?: string | null;
    name: string;
    shortName: string;
    code?: string;
    description?: string;
    color?: string;
    logoUrl?: string;
    isActive?: boolean;
    sortOrder?: number;
    createdAt?: Date;
    updatedAt?: Date;
}

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
    status: UserStatus;
    xp: number;
    level: number;
    availablePoints: number;
    hp: number;
    maxHp: number;
    deathCount: number;
    hpDepletedAt?: Date | null;
    workStatus: WorkStatus;
    leaveStartDate?: Date | null;
    leaveEndDate?: Date | null;
    // New Fields for Persistent Notifications
    lastReadChatAt?: Date;
    lastReadNotificationAt?: Date;
    
    // Multi-Tenant SaaS Organization & Sub-Company Affiliate
    isSuperAdmin?: boolean;
    currentOrgId?: string | null;
    companyId?: string | null;
    company?: Company | null;
    
    // HR Fields
    employmentType?: EmploymentType;
    startDate?: Date;
    workDays?: number[]; // [0=Sun, 1=Mon, ..., 6=Sat]
    
    // Payroll V5
    baseSalary?: number;
    bankAccount?: string;
    bankName?: string;
    ssoIncluded?: boolean;
    taxType?: string;

    // Gamification
    equippedFrameId?: string;
    ownedFrameIds?: string[];
    equippedBgId?: string;
    ownedBgIds?: string[];

    // Background Wave option
    waveBgEnabled?: boolean;
    ultimateWorkroomEnabled?: boolean;

    // Notification
    lineUserId?: string;
    createdAt?: Date;
    emoji?: string;

    // Detailed Profile Name Fields
    firstName?: string;
    lastName?: string;
    nickname?: string;
    username?: string;

    // Policy terms tracking
    acceptedTermsVersion?: number;
    acceptedTermsAt?: Date | null;
    
    // PWA App Version Tracking
    appVersion?: string;
}

