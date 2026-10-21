import {
    Organization,
    OrganizationMember,
    OrganizationRole,
    OrganizationMemberStatus,
    PlanTier,
    SubscriptionStatus,
    SubscriptionInvoice
} from '../../types';
import {
    PRIMARY_DEFAULT_ORG_ID,
    SAAS_PLAN_PRESETS,
    ALL_SIDEBAR_MODULE_KEYS
} from '../../lib/multiTenantMigrationSql';

export interface CreateOrganizationInput {
    name: string;
    slug?: string;
    description?: string;
    color?: string;
    logoUrl?: string;
    planTier?: PlanTier;
    subscriptionStatus?: SubscriptionStatus;
    expiresAt?: string | null;
    gracePeriodDays?: number;
    maxMembers?: number;
    allowedModules?: string[] | null;
    billingEmail?: string | null;
    assignOwnerUserId?: string | null;
    generateOwnerClaimLink?: boolean;
}

export interface UpdateOrganizationLicenseInput {
    name?: string;
    description?: string;
    color?: string;
    planTier?: PlanTier;
    subscriptionStatus?: SubscriptionStatus;
    expiresAt?: string | null;
    gracePeriodDays?: number;
    maxMembers?: number;
    allowedModules?: string[] | null;
    billingEmail?: string | null;
    ownerId?: string | null;
    regenerateClaimToken?: boolean;
    isActive?: boolean;
}

export type WorkspaceModalTab = 'SWITCH' | 'CREATE' | 'JOIN' | 'MEMBERS' | 'CLAIM';

export interface SubscriptionEngineResult {
    computedSubscriptionStatus: SubscriptionStatus;
    daysUntilExpiry: number | null;
    graceDaysRemaining: number | null;
    isSubscriptionLocked: boolean;
}

export interface OrganizationContextType {
    isReady: boolean;
    isNativeMultiTenantDB: boolean;
    isSuperAdmin: boolean;
    isInSuperAdminPortal: boolean;
    currentOrg: Organization;
    myOrganizations: Organization[];
    allPlatformOrganizations: Organization[];
    myMemberships: OrganizationMember[];
    currentOrgMembers: OrganizationMember[];
    pendingJoinRequests: OrganizationMember[];
    currentMembershipRole: OrganizationRole;
    currentMembershipStatus: OrganizationMemberStatus;
    isOrgAdmin: boolean;
    isSwitcherOpen: boolean;
    pendingInviteCodeFromUrl: string | null;
    pendingClaimTokenFromUrl: string | null;

    // Commercial Licensing & Subscription State
    computedSubscriptionStatus: SubscriptionStatus;
    daysUntilExpiry: number | null;
    graceDaysRemaining: number | null;
    isSubscriptionLocked: boolean;
    isModuleAllowed: (viewKey: string) => boolean;
    invoices: SubscriptionInvoice[];

    // Actions
    setIsInSuperAdminPortal: (inPortal: boolean) => void;
    enterCustomerWorkspace: (orgId: string) => Promise<boolean>;
    returnToSuperAdminPortal: () => void;
    openSwitcherModal: (initialTab?: WorkspaceModalTab) => void;
    closeSwitcherModal: () => void;
    activeModalTab: WorkspaceModalTab;
    setActiveModalTab: (tab: WorkspaceModalTab) => void;
    switchOrganization: (orgId: string) => Promise<boolean>;
    createOrganization: (input: CreateOrganizationInput) => Promise<Organization | null>;
    updateOrganizationLicense: (orgId: string, updates: UpdateOrganizationLicenseInput) => Promise<boolean>;
    renewOrganizationSubscription: (
        orgId: string,
        cycle: 'MONTHLY' | 'YEARLY' | 'LIFETIME',
        amount?: number,
        note?: string
    ) => Promise<boolean>;
    submitRenewalRequest: (input: {
        billingCycle: 'MONTHLY' | 'YEARLY';
        amount: number;
        note?: string;
        slipUrl?: string;
    }) => Promise<boolean>;
    approveInvoiceRequest: (invoiceId: string) => Promise<boolean>;
    rejectInvoiceRequest: (invoiceId: string) => Promise<boolean>;
    claimOrganizationOwnership: (claimToken: string) => Promise<{
        success: boolean;
        orgName?: string;
        message: string;
    }>;
    joinOrganizationByCode: (inviteCode: string) => Promise<{
        success: boolean;
        status?: OrganizationMemberStatus;
        orgName?: string;
        message: string;
    }>;
    approveMemberRequest: (memberId: string) => Promise<boolean>;
    rejectMemberRequest: (memberId: string) => Promise<boolean>;
    cancelPendingJoinRequest: (orgId: string) => Promise<boolean>;
    regenerateInviteCode: (orgId?: string) => Promise<string | null>;
    toggleInviteEnabled: (enabled: boolean) => Promise<boolean>;
    refreshOrganizations: () => Promise<void>;
}

export const DEFAULT_PRIMARY_ORGANIZATION: Organization = {
    id: PRIMARY_DEFAULT_ORG_ID,
    name: 'บริษัท จุ๋ยจุ๋ย จำกัด (Primary Workspace)',
    slug: 'juijui-hq',
    description: 'องค์กรหลักของระบบ (ข้อมูลเริ่มต้นและบริษัทย่อยในเครือ)',
    color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    inviteCode: 'JUIJUI-HQ',
    inviteEnabled: true,
    planTier: 'LIFETIME',
    subscriptionStatus: 'ACTIVE',
    expiresAt: null,
    gracePeriodDays: 7,
    maxMembers: 999,
    allowedModules: [...ALL_SIDEBAR_MODULE_KEYS],
    isActive: true
};

export const generateRandomInviteCode = (prefix = 'ORG'): string => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let suffix = '';
    for (let i = 0; i < 6; i++) {
        suffix += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const cleanPrefix = prefix.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 4) || 'ORG';
    return `${cleanPrefix}-${suffix}`;
};

export const generateOwnerClaimToken = (prefix = 'CLAIM'): string => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let token = '';
    for (let i = 0; i < 12; i++) {
        token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const cleanPrefix = prefix.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 4) || 'OWN';
    return `${cleanPrefix}-${token.slice(0, 6)}-${token.slice(6)}`;
};

export const parseAllowedModules = (raw: any, fallbackPlanTier?: PlanTier): string[] => {
    if (Array.isArray(raw) && raw.length > 0) {
        return raw.map(String);
    }
    if (typeof raw === 'string' && raw.trim().startsWith('[')) {
        try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed.map(String);
        } catch {
            // ignore malformed JSON
        }
    }
    const preset = SAAS_PLAN_PRESETS[fallbackPlanTier || 'ENTERPRISE'] || SAAS_PLAN_PRESETS.ENTERPRISE;
    return [...preset.defaultModules];
};

export const mapOrgFromDB = (row: any, memberCount?: number): Organization => {
    const planTier: PlanTier = (row.plan_tier || row.planTier || 'ENTERPRISE') as PlanTier;
    return {
        id: row.id,
        name: row.name || 'ไม่ระบุชื่อองค์กร',
        slug: row.slug || 'workspace',
        description: row.description || '',
        logoUrl: row.logo_url || row.logoUrl || '',
        color: row.color || 'bg-indigo-50 text-indigo-700 border-indigo-200',
        inviteCode: row.invite_code || row.inviteCode || 'JUIJUI-HQ',
        inviteEnabled: row.invite_enabled !== false && row.inviteEnabled !== false,
        ownerId: row.owner_id || row.ownerId || null,
        planTier,
        subscriptionStatus: (row.subscription_status || row.subscriptionStatus || 'ACTIVE') as SubscriptionStatus,
        expiresAt: row.expires_at ? new Date(row.expires_at) : row.expiresAt ? new Date(row.expiresAt) : null,
        gracePeriodDays: typeof row.grace_period_days === 'number' ? row.grace_period_days : 7,
        maxMembers: typeof row.max_members === 'number' ? row.max_members : (SAAS_PLAN_PRESETS[planTier]?.defaultMaxMembers || 100),
        allowedModules: parseAllowedModules(row.allowed_modules ?? row.allowedModules, planTier),
        ownerClaimToken: row.owner_claim_token || row.ownerClaimToken || null,
        billingEmail: row.billing_email || row.billingEmail || null,
        externalCustomerId: row.external_customer_id || row.externalCustomerId || null,
        memberCount: typeof memberCount === 'number' ? memberCount : row.memberCount,
        isActive: row.is_active !== false && row.isActive !== false,
        createdAt: row.created_at ? new Date(row.created_at) : undefined,
        updatedAt: row.updated_at ? new Date(row.updated_at) : undefined
    };
};

export const mapInvoiceFromDB = (inv: any, orgNameMap: Map<string, string>): SubscriptionInvoice => ({
    id: inv.id,
    orgId: inv.org_id,
    orgName: orgNameMap.get(inv.org_id) || 'องค์กรลูกค้า',
    invoiceNumber: inv.invoice_number,
    planTier: (inv.plan_tier || 'PRO') as PlanTier,
    amount: Number(inv.amount || 0),
    currency: inv.currency || 'THB',
    billingCycle: inv.billing_cycle || 'MONTHLY',
    paymentMethod: inv.payment_method || 'BANK_TRANSFER',
    paymentStatus: inv.payment_status || 'PENDING',
    slipUrl: inv.slip_url || null,
    note: inv.note || null,
    externalChargeId: inv.external_charge_id || null,
    periodStart: inv.period_start ? new Date(inv.period_start) : null,
    periodEnd: inv.period_end ? new Date(inv.period_end) : null,
    approvedBy: inv.approved_by || null,
    createdAt: inv.created_at ? new Date(inv.created_at) : new Date()
});

export const computeSubscriptionEngine = (currentOrg: Organization): SubscriptionEngineResult => {
    // Primary Default Org or LIFETIME tier never expires
    if (currentOrg.id === PRIMARY_DEFAULT_ORG_ID || currentOrg.planTier === 'LIFETIME') {
        return {
            computedSubscriptionStatus: 'ACTIVE',
            daysUntilExpiry: null,
            graceDaysRemaining: null,
            isSubscriptionLocked: false
        };
    }

    const explicitStatus = currentOrg.subscriptionStatus || 'ACTIVE';
    if (explicitStatus === 'SUSPENDED') {
        return {
            computedSubscriptionStatus: 'SUSPENDED',
            daysUntilExpiry: 0,
            graceDaysRemaining: 0,
            isSubscriptionLocked: true
        };
    }

    if (!currentOrg.expiresAt) {
        return {
            computedSubscriptionStatus: explicitStatus,
            daysUntilExpiry: null,
            graceDaysRemaining: null,
            isSubscriptionLocked: explicitStatus === 'EXPIRED'
        };
    }

    const nowMs = Date.now();
    const expiryMs = new Date(currentOrg.expiresAt).getTime();
    const diffDays = Math.ceil((expiryMs - nowMs) / (1000 * 60 * 60 * 24));
    const graceDays = typeof currentOrg.gracePeriodDays === 'number' ? currentOrg.gracePeriodDays : 7;

    if (diffDays >= 0) {
        return {
            computedSubscriptionStatus: explicitStatus === 'TRIAL' ? 'TRIAL' : 'ACTIVE',
            daysUntilExpiry: diffDays,
            graceDaysRemaining: graceDays,
            isSubscriptionLocked: false
        };
    }

    const daysPastExpiry = Math.abs(diffDays);
    if (daysPastExpiry <= graceDays) {
        return {
            computedSubscriptionStatus: 'GRACE_PERIOD',
            daysUntilExpiry: diffDays,
            graceDaysRemaining: Math.max(0, graceDays - daysPastExpiry),
            isSubscriptionLocked: false
        };
    }

    return {
        computedSubscriptionStatus: 'EXPIRED',
        daysUntilExpiry: diffDays,
        graceDaysRemaining: 0,
        isSubscriptionLocked: true
    };
};
