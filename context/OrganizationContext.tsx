import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import {
    Organization,
    OrganizationMember,
    OrganizationRole,
    OrganizationMemberStatus,
    PlanTier,
    SubscriptionStatus,
    SubscriptionInvoice
} from '../types';
import {
    PRIMARY_DEFAULT_ORG_ID,
    SAAS_PLAN_PRESETS,
    ALL_SIDEBAR_MODULE_KEYS
} from '../lib/multiTenantMigrationSql';
import { getActiveOrgIdSync, setActiveOrgIdSync } from '../lib/tenantStorage';
import { useUserSession } from './UserSessionContext';
import { useToast } from './ToastContext';

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

interface OrganizationContextType {
    isReady: boolean;
    isNativeMultiTenantDB: boolean;
    isSuperAdmin: boolean;
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

const DEFAULT_PRIMARY_ORGANIZATION: Organization = {
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

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

const generateRandomInviteCode = (prefix = 'ORG'): string => {
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

const parseAllowedModules = (raw: any, fallbackPlanTier?: PlanTier): string[] => {
    if (Array.isArray(raw) && raw.length > 0) {
        return raw.map(String);
    }
    if (typeof raw === 'string' && raw.trim().startsWith('[')) {
        try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed.map(String);
        } catch {
            // ignore
        }
    }
    const preset = SAAS_PLAN_PRESETS[fallbackPlanTier || 'ENTERPRISE'] || SAAS_PLAN_PRESETS.ENTERPRISE;
    return [...preset.defaultModules];
};

const mapOrgFromDB = (row: any, memberCount?: number): Organization => {
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

export const OrganizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const queryClient = useQueryClient();
    const { currentUserProfile, allUsers, fetchProfile } = useUserSession();
    const { showToast } = useToast();

    const [isReady, setIsReady] = useState(false);
    const [isNativeMultiTenantDB, setIsNativeMultiTenantDB] = useState(false);
    const [myOrganizations, setMyOrganizations] = useState<Organization[]>([DEFAULT_PRIMARY_ORGANIZATION]);
    const [allPlatformOrganizations, setAllPlatformOrganizations] = useState<Organization[]>([DEFAULT_PRIMARY_ORGANIZATION]);
    const [myMemberships, setMyMemberships] = useState<OrganizationMember[]>([]);
    const [currentOrgMembers, setCurrentOrgMembers] = useState<OrganizationMember[]>([]);
    const [invoices, setInvoices] = useState<SubscriptionInvoice[]>([]);
    const [selectedOrgId, setSelectedOrgId] = useState<string>(() => getActiveOrgIdSync());

    const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
    const [activeModalTab, setActiveModalTab] = useState<WorkspaceModalTab>('SWITCH');
    const [pendingInviteCodeFromUrl, setPendingInviteCodeFromUrl] = useState<string | null>(null);
    const [pendingClaimTokenFromUrl, setPendingClaimTokenFromUrl] = useState<string | null>(null);

    const isSuperAdmin = useMemo(() => {
        if (!currentUserProfile) return false;
        return Boolean(currentUserProfile.isSuperAdmin) ||
            (currentUserProfile.email || '').toLowerCase() === 'dramaeveryday222@gmail.com';
    }, [currentUserProfile]);

    // Check URL for ?join_org=INVITE_CODE or ?claim_org=CLAIM_TOKEN on mount
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const params = new URLSearchParams(window.location.search);
        const claimToken = params.get('claim_org');
        if (claimToken && claimToken.trim()) {
            setPendingClaimTokenFromUrl(claimToken.trim().toUpperCase());
            setActiveModalTab('CLAIM');
            if (currentUserProfile?.isApproved) {
                setIsSwitcherOpen(true);
            }
            return;
        }
        const joinCode = params.get('join_org');
        if (joinCode && joinCode.trim()) {
            setPendingInviteCodeFromUrl(joinCode.trim().toUpperCase());
            setActiveModalTab('JOIN');
            if (currentUserProfile?.isApproved) {
                setIsSwitcherOpen(true);
            }
        }
    }, [currentUserProfile?.isApproved]);

    const fetchOrganizationsAndMembers = useCallback(async () => {
        if (!currentUserProfile?.id) {
            setIsReady(true);
            return;
        }

        try {
            // 1. Try querying native public.organizations & public.organization_members tables
            const { data: orgRows, error: orgError } = await supabase
                .from('organizations')
                .select('*')
                .order('created_at', { ascending: true });

            if (!orgError && orgRows) {
                setIsNativeMultiTenantDB(true);

                const { data: allMemberRows } = await supabase
                    .from('organization_members')
                    .select('*')
                    .order('joined_at', { ascending: true });

                const memberCountByOrg = new Map<string, number>();
                (allMemberRows || []).forEach((m: any) => {
                    if (m.status === 'ACTIVE') {
                        memberCountByOrg.set(m.org_id, (memberCountByOrg.get(m.org_id) || 0) + 1);
                    }
                });

                const mappedOrgs = orgRows.length > 0
                    ? orgRows.map((r: any) => mapOrgFromDB(r, memberCountByOrg.get(r.id) || 0))
                    : [DEFAULT_PRIMARY_ORGANIZATION];

                setAllPlatformOrganizations(mappedOrgs);

                const userMemberships: OrganizationMember[] = (allMemberRows || [])
                    .filter((m: any) => m.user_id === currentUserProfile.id)
                    .map((m: any) => ({
                        id: m.id,
                        orgId: m.org_id,
                        userId: m.user_id,
                        role: (m.role as OrganizationRole) || 'MEMBER',
                        status: (m.status as OrganizationMemberStatus) || 'ACTIVE',
                        joinedAt: m.joined_at ? new Date(m.joined_at) : undefined
                    }));

                const memberOrgIds = new Set(userMemberships.map(m => m.orgId));
                // Super Admin can access and inspect all organizations seamlessly
                const accessibleOrgs = isSuperAdmin
                    ? mappedOrgs
                    : mappedOrgs.filter(o => o.isActive && memberOrgIds.has(o.id));
                const finalOrgs = accessibleOrgs.length > 0 ? accessibleOrgs : [mappedOrgs[0]];

                setMyOrganizations(finalOrgs);
                setMyMemberships(userMemberships);

                const preferredOrgId =
                    currentUserProfile.currentOrgId ||
                    getActiveOrgIdSync() ||
                    finalOrgs[0]?.id ||
                    PRIMARY_DEFAULT_ORG_ID;

                const validActiveOrg = finalOrgs.find(o => o.id === preferredOrgId) || finalOrgs[0];
                if (validActiveOrg) {
                    setSelectedOrgId(validActiveOrg.id);
                    setActiveOrgIdSync(validActiveOrg.id);

                    const activeOrgMemberRows = (allMemberRows || []).filter(
                        (m: any) => m.org_id === validActiveOrg.id
                    );

                    const enrichedMembers: OrganizationMember[] = activeOrgMemberRows.map((m: any) => {
                        const foundUser = allUsers.find(u => u.id === m.user_id);
                        return {
                            id: m.id,
                            orgId: m.org_id,
                            userId: m.user_id,
                            role: (m.role as OrganizationRole) || 'MEMBER',
                            status: (m.status as OrganizationMemberStatus) || 'ACTIVE',
                            joinedAt: m.joined_at ? new Date(m.joined_at) : undefined,
                            user: foundUser ? {
                                id: foundUser.id,
                                name: foundUser.name,
                                email: foundUser.email,
                                avatarUrl: foundUser.avatarUrl,
                                position: foundUser.position
                            } : undefined
                        };
                    });
                    setCurrentOrgMembers(enrichedMembers);
                }

                // Fetch subscription_invoices if table exists
                const { data: invoiceRows, error: invError } = await supabase
                    .from('subscription_invoices')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(100);

                if (!invError && invoiceRows) {
                    const orgMap = new Map(mappedOrgs.map(o => [o.id, o.name]));
                    setInvoices(
                        invoiceRows.map((inv: any) => ({
                            id: inv.id,
                            orgId: inv.org_id,
                            orgName: orgMap.get(inv.org_id) || 'องค์กรลูกค้า',
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
                        }))
                    );
                }

                setIsReady(true);
                return;
            }

            // 2. Fallback Mode (Before SQL Migration is executed in Supabase SQL Editor)
            setIsNativeMultiTenantDB(false);
            const { data: fallbackOpts } = await supabase
                .from('master_options')
                .select('*')
                .in('type', ['SAAS_WORKSPACE', 'SAAS_WORKSPACE_MEMBER', 'SAAS_INVOICE'])
                .order('sort_order', { ascending: true });

            const workspaceOpts = (fallbackOpts || []).filter((o: any) => o.type === 'SAAS_WORKSPACE');
            const memberOpts = (fallbackOpts || []).filter((o: any) => o.type === 'SAAS_WORKSPACE_MEMBER');
            const invoiceOpts = (fallbackOpts || []).filter((o: any) => o.type === 'SAAS_INVOICE');

            const parsedMembers: OrganizationMember[] = memberOpts.map((m: any) => {
                let meta: any = {};
                try {
                    meta = m.description ? JSON.parse(m.description) : {};
                } catch {
                    meta = {};
                }
                const foundUser = allUsers.find(u => u.id === meta.userId);
                return {
                    id: m.id,
                    orgId: m.parent_key || PRIMARY_DEFAULT_ORG_ID,
                    userId: meta.userId || currentUserProfile.id,
                    role: (meta.role as OrganizationRole) || 'MEMBER',
                    status: (meta.status as OrganizationMemberStatus) || 'ACTIVE',
                    joinedAt: m.created_at ? new Date(m.created_at) : new Date(),
                    user: foundUser ? {
                        id: foundUser.id,
                        name: foundUser.name,
                        email: foundUser.email,
                        avatarUrl: foundUser.avatarUrl,
                        position: foundUser.position
                    } : {
                        id: meta.userId || currentUserProfile.id,
                        name: m.label || currentUserProfile.name,
                        email: meta.email || currentUserProfile.email
                    }
                };
            });

            const primaryDefaultMembers: OrganizationMember[] = allUsers.map(u => ({
                id: `primary-${u.id}`,
                orgId: PRIMARY_DEFAULT_ORG_ID,
                userId: u.id,
                role: u.role === 'ADMIN' ? 'ADMIN' : 'MEMBER',
                status: u.isApproved ? 'ACTIVE' : 'PENDING',
                user: {
                    id: u.id,
                    name: u.name,
                    email: u.email,
                    avatarUrl: u.avatarUrl,
                    position: u.position
                }
            }));

            const combinedMembers = [...primaryDefaultMembers, ...parsedMembers];

            const customOrgs: Organization[] = workspaceOpts.map((w: any) => {
                let meta: any = {};
                try {
                    meta = w.description ? JSON.parse(w.description) : {};
                } catch {
                    meta = {};
                }
                const orgId = w.key || w.id;
                const planTier: PlanTier = (meta.planTier || 'ENTERPRISE') as PlanTier;
                const activeCount = combinedMembers.filter(m => m.orgId === orgId && m.status === 'ACTIVE').length;
                return {
                    id: orgId,
                    name: w.label,
                    slug: meta.slug || w.key?.toLowerCase() || 'workspace',
                    description: meta.description || '',
                    color: w.color || 'bg-indigo-50 text-indigo-700 border-indigo-200',
                    inviteCode: meta.inviteCode || `ORG-${(w.key || 'HQ').slice(0, 6).toUpperCase()}`,
                    inviteEnabled: meta.inviteEnabled !== false,
                    ownerId: meta.ownerId || null,
                    planTier,
                    subscriptionStatus: (meta.subscriptionStatus || 'ACTIVE') as SubscriptionStatus,
                    expiresAt: meta.expiresAt ? new Date(meta.expiresAt) : null,
                    gracePeriodDays: typeof meta.gracePeriodDays === 'number' ? meta.gracePeriodDays : 7,
                    maxMembers: typeof meta.maxMembers === 'number' ? meta.maxMembers : (SAAS_PLAN_PRESETS[planTier]?.defaultMaxMembers || 100),
                    allowedModules: parseAllowedModules(meta.allowedModules, planTier),
                    ownerClaimToken: meta.ownerClaimToken || null,
                    billingEmail: meta.billingEmail || null,
                    memberCount: activeCount,
                    isActive: w.is_active !== false
                };
            });

            const primaryWithCount: Organization = {
                ...DEFAULT_PRIMARY_ORGANIZATION,
                memberCount: primaryDefaultMembers.filter(m => m.status === 'ACTIVE').length
            };

            const allAvailableOrgs = [
                primaryWithCount,
                ...customOrgs.filter(o => o.id !== PRIMARY_DEFAULT_ORG_ID)
            ];

            setAllPlatformOrganizations(allAvailableOrgs);

            const myMem = combinedMembers.filter(m => m.userId === currentUserProfile.id);
            const myOrgIds = new Set(myMem.map(m => m.orgId));
            myOrgIds.add(PRIMARY_DEFAULT_ORG_ID);

            const userOrgs = isSuperAdmin
                ? allAvailableOrgs
                : allAvailableOrgs.filter(o => myOrgIds.has(o.id));
            setMyOrganizations(userOrgs);
            setMyMemberships(myMem);

            const activeId = getActiveOrgIdSync();
            const validOrg = userOrgs.find(o => o.id === activeId) || userOrgs[0] || primaryWithCount;
            setSelectedOrgId(validOrg.id);
            setActiveOrgIdSync(validOrg.id);

            setCurrentOrgMembers(combinedMembers.filter(m => m.orgId === validOrg.id));

            const orgNameMap = new Map(allAvailableOrgs.map(o => [o.id, o.name]));
            const fallbackInvoices: SubscriptionInvoice[] = invoiceOpts.map((inv: any) => {
                let meta: any = {};
                try {
                    meta = inv.description ? JSON.parse(inv.description) : {};
                } catch {
                    meta = {};
                }
                const orgId = inv.parent_key || PRIMARY_DEFAULT_ORG_ID;
                return {
                    id: inv.id,
                    orgId,
                    orgName: orgNameMap.get(orgId) || 'องค์กรลูกค้า',
                    invoiceNumber: inv.key || `INV-${inv.id.slice(0, 6)}`,
                    planTier: (meta.planTier || 'PRO') as PlanTier,
                    amount: Number(meta.amount || 0),
                    currency: meta.currency || 'THB',
                    billingCycle: meta.billingCycle || 'MONTHLY',
                    paymentMethod: meta.paymentMethod || 'BANK_TRANSFER',
                    paymentStatus: meta.paymentStatus || 'PENDING',
                    slipUrl: meta.slipUrl || null,
                    note: meta.note || inv.label || null,
                    periodStart: meta.periodStart ? new Date(meta.periodStart) : null,
                    periodEnd: meta.periodEnd ? new Date(meta.periodEnd) : null,
                    approvedBy: meta.approvedBy || null,
                    createdAt: inv.created_at ? new Date(inv.created_at) : new Date()
                };
            });
            setInvoices(fallbackInvoices);
        } catch (err) {
            console.warn('[OrganizationContext] Fallback to primary workspace:', err);
        } finally {
            setIsReady(true);
        }
    }, [currentUserProfile?.id, currentUserProfile?.currentOrgId, allUsers, isSuperAdmin]);

    useEffect(() => {
        fetchOrganizationsAndMembers();
    }, [fetchOrganizationsAndMembers]);

    const currentOrg = useMemo<Organization>(() => {
        return myOrganizations.find(o => o.id === selectedOrgId) ||
            allPlatformOrganizations.find(o => o.id === selectedOrgId) ||
            myOrganizations[0] ||
            DEFAULT_PRIMARY_ORGANIZATION;
    }, [myOrganizations, allPlatformOrganizations, selectedOrgId]);

    const currentMembership = useMemo<OrganizationMember | undefined>(() => {
        return myMemberships.find(m => m.orgId === currentOrg.id);
    }, [myMemberships, currentOrg.id]);

    const currentMembershipRole: OrganizationRole = useMemo(() => {
        if (isSuperAdmin) return 'OWNER';
        if (currentMembership) return currentMembership.role;
        return currentUserProfile?.role === 'ADMIN' ? 'ADMIN' : 'MEMBER';
    }, [isSuperAdmin, currentMembership, currentUserProfile?.role]);

    const currentMembershipStatus: OrganizationMemberStatus = useMemo(() => {
        if (isSuperAdmin) return 'ACTIVE';
        if (currentMembership) return currentMembership.status;
        return currentUserProfile?.isApproved !== false ? 'ACTIVE' : 'PENDING';
    }, [isSuperAdmin, currentMembership, currentUserProfile?.isApproved]);

    const isOrgAdmin = useMemo(() => {
        return isSuperAdmin || currentMembershipRole === 'OWNER' || currentMembershipRole === 'ADMIN' || currentUserProfile?.role === 'ADMIN';
    }, [isSuperAdmin, currentMembershipRole, currentUserProfile?.role]);

    const pendingJoinRequests = useMemo(() => {
        return currentOrgMembers.filter(m => m.status === 'PENDING');
    }, [currentOrgMembers]);

    // --- COMMERCIAL LICENSING & SUBSCRIPTION ENGINE ---
    const {
        computedSubscriptionStatus,
        daysUntilExpiry,
        graceDaysRemaining,
        isSubscriptionLocked
    } = useMemo(() => {
        // Primary Default Org never expires
        if (currentOrg.id === PRIMARY_DEFAULT_ORG_ID || currentOrg.planTier === 'LIFETIME') {
            return {
                computedSubscriptionStatus: 'ACTIVE' as SubscriptionStatus,
                daysUntilExpiry: null,
                graceDaysRemaining: null,
                isSubscriptionLocked: false
            };
        }

        const explicitStatus = currentOrg.subscriptionStatus || 'ACTIVE';
        if (explicitStatus === 'SUSPENDED') {
            return {
                computedSubscriptionStatus: 'SUSPENDED' as SubscriptionStatus,
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
                computedSubscriptionStatus: explicitStatus === 'TRIAL' ? ('TRIAL' as SubscriptionStatus) : ('ACTIVE' as SubscriptionStatus),
                daysUntilExpiry: diffDays,
                graceDaysRemaining: graceDays,
                isSubscriptionLocked: false
            };
        }

        const daysPastExpiry = Math.abs(diffDays);
        if (daysPastExpiry <= graceDays) {
            return {
                computedSubscriptionStatus: 'GRACE_PERIOD' as SubscriptionStatus,
                daysUntilExpiry: diffDays,
                graceDaysRemaining: Math.max(0, graceDays - daysPastExpiry),
                isSubscriptionLocked: false
            };
        }

        return {
            computedSubscriptionStatus: 'EXPIRED' as SubscriptionStatus,
            daysUntilExpiry: diffDays,
            graceDaysRemaining: 0,
            isSubscriptionLocked: true
        };
    }, [currentOrg]);

    const isModuleAllowed = useCallback((viewKey: string): boolean => {
        if (currentOrg.id === PRIMARY_DEFAULT_ORG_ID) return true;
        const allowed = currentOrg.allowedModules;
        if (!allowed || allowed.length === 0) return true;
        return allowed.includes(viewKey);
    }, [currentOrg.id, currentOrg.allowedModules]);

    const openSwitcherModal = useCallback((initialTab: WorkspaceModalTab = 'SWITCH') => {
        setActiveModalTab(initialTab);
        setIsSwitcherOpen(true);
    }, []);

    const closeSwitcherModal = useCallback(() => {
        setIsSwitcherOpen(false);
    }, []);

    const switchOrganization = useCallback(async (orgId: string): Promise<boolean> => {
        const target =
            myOrganizations.find(o => o.id === orgId) ||
            allPlatformOrganizations.find(o => o.id === orgId);
        if (!target) {
            showToast('ไม่พบองค์กรที่เลือก', 'error');
            return false;
        }

        const membership = myMemberships.find(m => m.orgId === orgId);
        if (!isSuperAdmin && membership && membership.status === 'PENDING') {
            showToast('คำขอเข้าร่วมองค์กรนี้ยังอยู่ระหว่างรอ Admin อนุมัติ', 'warning');
            return false;
        }

        try {
            setSelectedOrgId(orgId);
            setActiveOrgIdSync(orgId);

            if (isNativeMultiTenantDB && currentUserProfile?.id) {
                await supabase
                    .from('profiles')
                    .update({ current_org_id: orgId })
                    .eq('id', currentUserProfile.id);
            }

            await queryClient.invalidateQueries();

            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('org-workspace-switched', { detail: { orgId, orgName: target.name } }));
            }

            await fetchOrganizationsAndMembers();
            showToast(`สลับไปยัง Workspace: ${target.name} เรียบร้อยแล้ว`, 'success');
            return true;
        } catch (err: any) {
            console.error('[OrganizationContext] switchOrganization error:', err);
            showToast('เกิดข้อผิดพลาดในการสลับองค์กร', 'error');
            return false;
        }
    }, [myOrganizations, allPlatformOrganizations, myMemberships, isSuperAdmin, isNativeMultiTenantDB, currentUserProfile?.id, queryClient, fetchOrganizationsAndMembers, showToast]);

    const createOrganization = useCallback(async (input: CreateOrganizationInput): Promise<Organization | null> => {
        if (!currentUserProfile?.id) return null;
        if (!isSuperAdmin) {
            showToast('เฉพาะ Super Admin เท่านั้นที่สามารถเปิดองค์กรใหม่ให้ลูกค้าได้', 'error');
            return null;
        }

        const cleanName = input.name.trim();
        if (!cleanName) {
            showToast('กรุณาระบุชื่อองค์กร', 'error');
            return null;
        }

        const slugBase = (input.slug || cleanName)
            .toLowerCase()
            .replace(/[^a-z0-9ก-๙]+/g, '-')
            .replace(/^-+|-+$/g, '') || `workspace-${Date.now()}`;
        const uniqueSlug = `${slugBase}-${Math.floor(1000 + Math.random() * 9000)}`;
        const inviteCode = generateRandomInviteCode(cleanName);
        const color = input.color || 'bg-indigo-50 text-indigo-700 border-indigo-200';
        const planTier: PlanTier = input.planTier || 'PRO';
        const preset = SAAS_PLAN_PRESETS[planTier] || SAAS_PLAN_PRESETS.PRO;
        const subscriptionStatus: SubscriptionStatus = input.subscriptionStatus || 'ACTIVE';
        const maxMembers = input.maxMembers || preset.defaultMaxMembers;
        const allowedModules = input.allowedModules && input.allowedModules.length > 0
            ? input.allowedModules
            : [...preset.defaultModules];
        const ownerClaimToken = input.generateOwnerClaimLink !== false ? generateOwnerClaimToken(cleanName) : null;
        const targetOwnerId = input.assignOwnerUserId || currentUserProfile.id;

        try {
            if (isNativeMultiTenantDB) {
                const insertPayload: Record<string, any> = {
                    name: cleanName,
                    slug: uniqueSlug,
                    description: input.description || '',
                    color,
                    logo_url: input.logoUrl || '',
                    invite_code: inviteCode,
                    invite_enabled: true,
                    owner_id: targetOwnerId,
                    plan_tier: planTier,
                    subscription_status: subscriptionStatus,
                    expires_at: input.expiresAt || null,
                    grace_period_days: input.gracePeriodDays ?? 7,
                    max_members: maxMembers,
                    allowed_modules: allowedModules,
                    owner_claim_token: ownerClaimToken,
                    billing_email: input.billingEmail || null,
                    is_active: true
                };

                let { data: createdOrg, error: createErr } = await supabase
                    .from('organizations')
                    .insert([insertPayload])
                    .select('*')
                    .single();

                // Fallback if Phase 5 SQL columns haven't been added yet in native DB
                if (createErr) {
                    const minimalPayload = {
                        name: cleanName,
                        slug: uniqueSlug,
                        description: input.description || '',
                        color,
                        logo_url: input.logoUrl || '',
                        invite_code: inviteCode,
                        invite_enabled: true,
                        owner_id: targetOwnerId,
                        plan_tier: planTier,
                        is_active: true
                    };
                    const retry = await supabase
                        .from('organizations')
                        .insert([minimalPayload])
                        .select('*')
                        .single();
                    if (retry.error) throw retry.error;
                    createdOrg = retry.data;
                }

                // Enroll assigned owner & Super Admin
                await supabase
                    .from('organization_members')
                    .insert([{
                        org_id: createdOrg.id,
                        user_id: targetOwnerId,
                        role: 'OWNER',
                        status: 'ACTIVE'
                    }]);

                // Seed default master_options for the new organization via RPC
                await supabase.rpc('seed_organization_defaults', { target_org_id: createdOrg.id });

                const mapped = mapOrgFromDB({
                    ...createdOrg,
                    plan_tier: planTier,
                    subscription_status: subscriptionStatus,
                    expires_at: input.expiresAt || null,
                    max_members: maxMembers,
                    allowed_modules: allowedModules,
                    owner_claim_token: ownerClaimToken,
                    billing_email: input.billingEmail || null
                }, 1);

                await fetchOrganizationsAndMembers();
                showToast(`เปิดองค์กรลูกค้า "${cleanName}" (${planTier}) สำเร็จ!`, 'success');
                return mapped;
            } else {
                // Fallback creation in master_options before SQL migration is run
                const newOrgId = crypto.randomUUID ? crypto.randomUUID() : `org-${Date.now()}`;
                const meta = {
                    slug: uniqueSlug,
                    description: input.description || '',
                    inviteCode,
                    inviteEnabled: true,
                    ownerId: targetOwnerId,
                    planTier,
                    subscriptionStatus,
                    expiresAt: input.expiresAt || null,
                    gracePeriodDays: input.gracePeriodDays ?? 7,
                    maxMembers,
                    allowedModules,
                    ownerClaimToken,
                    billingEmail: input.billingEmail || null
                };

                const { error: optErr } = await supabase
                    .from('master_options')
                    .insert([{
                        type: 'SAAS_WORKSPACE',
                        key: newOrgId,
                        label: cleanName,
                        color,
                        description: JSON.stringify(meta),
                        sort_order: allPlatformOrganizations.length + 1,
                        is_active: true
                    }]);

                if (optErr) throw optErr;

                const ownerUser = allUsers.find(u => u.id === targetOwnerId) || currentUserProfile;
                await supabase
                    .from('master_options')
                    .insert([{
                        type: 'SAAS_WORKSPACE_MEMBER',
                        key: `MEM_${newOrgId.slice(0, 8)}_${ownerUser.id.slice(0, 8)}`,
                        parent_key: newOrgId,
                        label: ownerUser.name,
                        description: JSON.stringify({
                            userId: ownerUser.id,
                            email: ownerUser.email,
                            role: 'OWNER',
                            status: 'ACTIVE'
                        }),
                        sort_order: 1,
                        is_active: true
                    }]);

                const newOrg: Organization = {
                    id: newOrgId,
                    name: cleanName,
                    slug: uniqueSlug,
                    description: input.description || '',
                    color,
                    inviteCode,
                    inviteEnabled: true,
                    ownerId: targetOwnerId,
                    planTier,
                    subscriptionStatus,
                    expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
                    gracePeriodDays: input.gracePeriodDays ?? 7,
                    maxMembers,
                    allowedModules,
                    ownerClaimToken,
                    billingEmail: input.billingEmail || null,
                    memberCount: 1,
                    isActive: true
                };

                await fetchOrganizationsAndMembers();
                showToast(`เปิดองค์กรลูกค้า "${cleanName}" (${planTier}) สำเร็จ!`, 'success');
                return newOrg;
            }
        } catch (err: any) {
            console.error('[OrganizationContext] createOrganization error:', err);
            showToast('ไม่สามารถสร้างองค์กรได้: ' + (err.message || 'Unknown error'), 'error');
            return null;
        }
    }, [currentUserProfile, isSuperAdmin, isNativeMultiTenantDB, allPlatformOrganizations.length, allUsers, fetchOrganizationsAndMembers, showToast]);

    const updateOrganizationLicense = useCallback(async (orgId: string, updates: UpdateOrganizationLicenseInput): Promise<boolean> => {
        if (!isSuperAdmin) {
            showToast('เฉพาะ Super Admin เท่านั้นที่สามารถแก้ไขแพ็กเกจและสิทธิ์โมดูลได้', 'error');
            return false;
        }

        const targetOrg = allPlatformOrganizations.find(o => o.id === orgId);
        if (!targetOrg) return false;

        const nextClaimToken = updates.regenerateClaimToken
            ? generateOwnerClaimToken(updates.name || targetOrg.name)
            : updates.regenerateClaimToken === false
            ? null
            : targetOrg.ownerClaimToken;

        try {
            if (isNativeMultiTenantDB) {
                const dbUpdates: Record<string, any> = {
                    updated_at: new Date().toISOString()
                };
                if (updates.name !== undefined) dbUpdates.name = updates.name;
                if (updates.description !== undefined) dbUpdates.description = updates.description;
                if (updates.color !== undefined) dbUpdates.color = updates.color;
                if (updates.planTier !== undefined) dbUpdates.plan_tier = updates.planTier;
                if (updates.subscriptionStatus !== undefined) dbUpdates.subscription_status = updates.subscriptionStatus;
                if (updates.expiresAt !== undefined) dbUpdates.expires_at = updates.expiresAt;
                if (updates.gracePeriodDays !== undefined) dbUpdates.grace_period_days = updates.gracePeriodDays;
                if (updates.maxMembers !== undefined) dbUpdates.max_members = updates.maxMembers;
                if (updates.allowedModules !== undefined) dbUpdates.allowed_modules = updates.allowedModules;
                if (updates.billingEmail !== undefined) dbUpdates.billing_email = updates.billingEmail;
                if (updates.ownerId !== undefined) dbUpdates.owner_id = updates.ownerId;
                if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
                if (updates.regenerateClaimToken !== undefined) dbUpdates.owner_claim_token = nextClaimToken;

                const { error } = await supabase
                    .from('organizations')
                    .update(dbUpdates)
                    .eq('id', orgId);

                if (error) throw error;

                if (updates.ownerId) {
                    await supabase
                        .from('organization_members')
                        .upsert([{
                            org_id: orgId,
                            user_id: updates.ownerId,
                            role: 'OWNER',
                            status: 'ACTIVE'
                        }], { onConflict: 'org_id,user_id' });
                }
            } else {
                const { data: existing } = await supabase
                    .from('master_options')
                    .select('*')
                    .eq('type', 'SAAS_WORKSPACE')
                    .eq('key', orgId)
                    .maybeSingle();

                if (existing) {
                    let meta: any = {};
                    try {
                        meta = existing.description ? JSON.parse(existing.description) : {};
                    } catch {
                        meta = {};
                    }
                    if (updates.description !== undefined) meta.description = updates.description;
                    if (updates.planTier !== undefined) meta.planTier = updates.planTier;
                    if (updates.subscriptionStatus !== undefined) meta.subscriptionStatus = updates.subscriptionStatus;
                    if (updates.expiresAt !== undefined) meta.expiresAt = updates.expiresAt;
                    if (updates.gracePeriodDays !== undefined) meta.gracePeriodDays = updates.gracePeriodDays;
                    if (updates.maxMembers !== undefined) meta.maxMembers = updates.maxMembers;
                    if (updates.allowedModules !== undefined) meta.allowedModules = updates.allowedModules;
                    if (updates.billingEmail !== undefined) meta.billingEmail = updates.billingEmail;
                    if (updates.ownerId !== undefined) meta.ownerId = updates.ownerId;
                    if (updates.regenerateClaimToken !== undefined) meta.ownerClaimToken = nextClaimToken;

                    await supabase
                        .from('master_options')
                        .update({
                            label: updates.name || existing.label,
                            color: updates.color || existing.color,
                            is_active: updates.isActive !== undefined ? updates.isActive : existing.is_active,
                            description: JSON.stringify(meta)
                        })
                        .eq('id', existing.id);
                }
            }

            await fetchOrganizationsAndMembers();
            showToast(`บันทึกการตั้งค่าลิขสิทธิ์ "${updates.name || targetOrg.name}" เรียบร้อยแล้ว`, 'success');
            return true;
        } catch (err: any) {
            console.error('[OrganizationContext] updateOrganizationLicense error:', err);
            showToast('ไม่สามารถอัปเดตลิขสิทธิ์ได้: ' + err.message, 'error');
            return false;
        }
    }, [isSuperAdmin, allPlatformOrganizations, isNativeMultiTenantDB, fetchOrganizationsAndMembers, showToast]);

    const renewOrganizationSubscription = useCallback(async (
        orgId: string,
        cycle: 'MONTHLY' | 'YEARLY' | 'LIFETIME',
        amount?: number,
        note?: string
    ): Promise<boolean> => {
        if (!isSuperAdmin) {
            showToast('เฉพาะ Super Admin เท่านั้นที่สามารถอนุมัติต่ออายุแพ็กเกจได้', 'error');
            return false;
        }

        const targetOrg = allPlatformOrganizations.find(o => o.id === orgId);
        if (!targetOrg) return false;

        const now = new Date();
        const baseDate = targetOrg.expiresAt && new Date(targetOrg.expiresAt) > now
            ? new Date(targetOrg.expiresAt)
            : now;

        let nextExpiresAt: string | null = null;
        if (cycle === 'MONTHLY') {
            const d = new Date(baseDate);
            d.setDate(d.getDate() + 30);
            nextExpiresAt = d.toISOString();
        } else if (cycle === 'YEARLY') {
            const d = new Date(baseDate);
            d.setDate(d.getDate() + 365);
            nextExpiresAt = d.toISOString();
        } else {
            nextExpiresAt = null;
        }

        const nextPlanTier: PlanTier = cycle === 'LIFETIME' ? 'LIFETIME' : (targetOrg.planTier || 'PRO');
        const preset = SAAS_PLAN_PRESETS[nextPlanTier] || SAAS_PLAN_PRESETS.PRO;
        const resolvedAmount = amount ?? (cycle === 'YEARLY' ? preset.yearlyPriceTHB : cycle === 'MONTHLY' ? preset.monthlyPriceTHB : preset.yearlyPriceTHB);
        const invoiceNumber = `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

        const updated = await updateOrganizationLicense(orgId, {
            planTier: nextPlanTier,
            subscriptionStatus: 'ACTIVE',
            expiresAt: nextExpiresAt,
            isActive: true
        });

        if (!updated) return false;

        try {
            if (isNativeMultiTenantDB) {
                await supabase
                    .from('subscription_invoices')
                    .insert([{
                        org_id: orgId,
                        invoice_number: invoiceNumber,
                        plan_tier: nextPlanTier,
                        amount: resolvedAmount,
                        currency: 'THB',
                        billing_cycle: cycle,
                        payment_method: 'MANUAL',
                        payment_status: 'PAID',
                        note: note || `ต่ออายุแพ็กเกจ (${cycle}) โดย Super Admin`,
                        period_start: baseDate.toISOString(),
                        period_end: nextExpiresAt,
                        approved_by: currentUserProfile?.id || null
                    }]);
            } else {
                await supabase
                    .from('master_options')
                    .insert([{
                        type: 'SAAS_INVOICE',
                        key: invoiceNumber,
                        parent_key: orgId,
                        label: note || `ต่ออายุแพ็กเกจ (${cycle})`,
                        description: JSON.stringify({
                            planTier: nextPlanTier,
                            amount: resolvedAmount,
                            currency: 'THB',
                            billingCycle: cycle,
                            paymentMethod: 'MANUAL',
                            paymentStatus: 'PAID',
                            note: note || `ต่ออายุแพ็กเกจ (${cycle}) โดย Super Admin`,
                            periodStart: baseDate.toISOString(),
                            periodEnd: nextExpiresAt,
                            approvedBy: currentUserProfile?.id || null
                        }),
                        sort_order: 1,
                        is_active: true
                    }]);
            }
            await fetchOrganizationsAndMembers();
            showToast(`ต่ออายุแพ็กเกจให้ "${targetOrg.name}" (${cycle}) เรียบร้อยแล้ว`, 'success');
            return true;
        } catch (err) {
            console.warn('[OrganizationContext] Invoice log warning:', err);
            return true;
        }
    }, [isSuperAdmin, allPlatformOrganizations, updateOrganizationLicense, isNativeMultiTenantDB, currentUserProfile?.id, fetchOrganizationsAndMembers, showToast]);

    const submitRenewalRequest = useCallback(async (input: {
        billingCycle: 'MONTHLY' | 'YEARLY';
        amount: number;
        note?: string;
        slipUrl?: string;
    }): Promise<boolean> => {
        if (!currentUserProfile?.id) return false;
        const invoiceNumber = `REQ-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
        const planTier = currentOrg.planTier || 'PRO';

        try {
            if (isNativeMultiTenantDB) {
                const { error } = await supabase
                    .from('subscription_invoices')
                    .insert([{
                        org_id: currentOrg.id,
                        invoice_number: invoiceNumber,
                        plan_tier: planTier,
                        amount: input.amount,
                        currency: 'THB',
                        billing_cycle: input.billingCycle,
                        payment_method: 'BANK_TRANSFER',
                        payment_status: 'PENDING',
                        slip_url: input.slipUrl || null,
                        note: input.note || `แจ้งชำระเงินต่ออายุแพ็กเกจ ${planTier} (${input.billingCycle})`
                    }]);
                if (error) throw error;
            } else {
                await supabase
                    .from('master_options')
                    .insert([{
                        type: 'SAAS_INVOICE',
                        key: invoiceNumber,
                        parent_key: currentOrg.id,
                        label: input.note || `แจ้งต่ออายุแพ็กเกจ ${planTier}`,
                        description: JSON.stringify({
                            planTier,
                            amount: input.amount,
                            currency: 'THB',
                            billingCycle: input.billingCycle,
                            paymentMethod: 'BANK_TRANSFER',
                            paymentStatus: 'PENDING',
                            slipUrl: input.slipUrl || null,
                            note: input.note || `แจ้งชำระเงินต่ออายุแพ็กเกจ ${planTier}`
                        }),
                        sort_order: 1,
                        is_active: true
                    }]);
            }

            await fetchOrganizationsAndMembers();
            showToast('ส่งรายการแจ้งชำระเงินต่ออายุเรียบร้อยแล้ว รอผู้ดูแลระบบตรวจสอบ', 'success');
            return true;
        } catch (err: any) {
            console.error('[OrganizationContext] submitRenewalRequest error:', err);
            showToast('ไม่สามารถส่งคำขอต่ออายุได้: ' + err.message, 'error');
            return false;
        }
    }, [currentUserProfile?.id, currentOrg.id, currentOrg.planTier, isNativeMultiTenantDB, fetchOrganizationsAndMembers, showToast]);

    const approveInvoiceRequest = useCallback(async (invoiceId: string): Promise<boolean> => {
        if (!isSuperAdmin) return false;
        const targetInv = invoices.find(i => i.id === invoiceId);
        if (!targetInv) return false;

        try {
            const renewed = await renewOrganizationSubscription(
                targetInv.orgId,
                targetInv.billingCycle,
                targetInv.amount,
                `อนุมัติใบแจ้งหนี้ ${targetInv.invoiceNumber}`
            );
            if (!renewed) return false;

            if (isNativeMultiTenantDB) {
                await supabase
                    .from('subscription_invoices')
                    .update({
                        payment_status: 'PAID',
                        approved_by: currentUserProfile?.id || null,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', invoiceId);
            } else {
                await supabase
                    .from('master_options')
                    .delete()
                    .eq('id', invoiceId);
            }

            await fetchOrganizationsAndMembers();
            return true;
        } catch (err: any) {
            showToast('เกิดข้อผิดพลาดในการอนุมัติบิล: ' + err.message, 'error');
            return false;
        }
    }, [isSuperAdmin, invoices, renewOrganizationSubscription, isNativeMultiTenantDB, currentUserProfile?.id, fetchOrganizationsAndMembers, showToast]);

    const rejectInvoiceRequest = useCallback(async (invoiceId: string): Promise<boolean> => {
        if (!isSuperAdmin) return false;
        try {
            if (isNativeMultiTenantDB) {
                await supabase
                    .from('subscription_invoices')
                    .update({
                        payment_status: 'REJECTED',
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', invoiceId);
            } else {
                await supabase
                    .from('master_options')
                    .delete()
                    .eq('id', invoiceId);
            }
            await fetchOrganizationsAndMembers();
            showToast('ปฏิเสธรายการแจ้งชำระเงินแล้ว', 'info');
            return true;
        } catch (err: any) {
            showToast('ไม่สามารถปฏิเสธรายการได้: ' + err.message, 'error');
            return false;
        }
    }, [isSuperAdmin, isNativeMultiTenantDB, fetchOrganizationsAndMembers, showToast]);

    const claimOrganizationOwnership = useCallback(async (rawToken: string) => {
        if (!currentUserProfile?.id) {
            return { success: false, message: 'กรุณาเข้าสู่ระบบก่อนรับมอบสิทธิ์เจ้าขององค์กร' };
        }
        const token = rawToken.trim().toUpperCase();
        if (!token) {
            return { success: false, message: 'กรุณาระบุรหัสรับมอบองค์กร (Owner Claim Token)' };
        }

        try {
            let matchedOrg = allPlatformOrganizations.find(
                o => (o.ownerClaimToken || '').toUpperCase() === token
            );

            if (!matchedOrg && isNativeMultiTenantDB) {
                const { data: orgRow } = await supabase
                    .from('organizations')
                    .select('*')
                    .ilike('owner_claim_token', token)
                    .eq('is_active', true)
                    .maybeSingle();

                if (orgRow) {
                    matchedOrg = mapOrgFromDB(orgRow);
                }
            }

            if (!matchedOrg) {
                return { success: false, message: 'ไม่พบองค์กรจากรหัสรับมอบสิทธิ์นี้ หรือรหัสอาจถูกใช้งานไปแล้ว' };
            }

            if (isNativeMultiTenantDB) {
                await supabase
                    .from('organizations')
                    .update({
                        owner_id: currentUserProfile.id,
                        owner_claim_token: null,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', matchedOrg.id);

                await supabase
                    .from('organization_members')
                    .upsert([{
                        org_id: matchedOrg.id,
                        user_id: currentUserProfile.id,
                        role: 'OWNER',
                        status: 'ACTIVE'
                    }], { onConflict: 'org_id,user_id' });
            } else {
                const { data: existing } = await supabase
                    .from('master_options')
                    .select('*')
                    .eq('type', 'SAAS_WORKSPACE')
                    .eq('key', matchedOrg.id)
                    .maybeSingle();

                if (existing) {
                    const meta = existing.description ? JSON.parse(existing.description) : {};
                    meta.ownerId = currentUserProfile.id;
                    meta.ownerClaimToken = null;
                    await supabase
                        .from('master_options')
                        .update({ description: JSON.stringify(meta) })
                        .eq('id', existing.id);
                }

                await supabase
                    .from('master_options')
                    .insert([{
                        type: 'SAAS_WORKSPACE_MEMBER',
                        key: `OWN_${matchedOrg.id.slice(0, 6)}_${currentUserProfile.id.slice(0, 6)}`,
                        parent_key: matchedOrg.id,
                        label: currentUserProfile.name,
                        description: JSON.stringify({
                            userId: currentUserProfile.id,
                            email: currentUserProfile.email,
                            role: 'OWNER',
                            status: 'ACTIVE'
                        }),
                        sort_order: 1,
                        is_active: true
                    }]);
            }

            // Unlock profile immediately (is_approved = true, role = 'ADMIN', current_org_id)
            await supabase
                .from('profiles')
                .update({
                    is_approved: true,
                    role: 'ADMIN',
                    current_org_id: matchedOrg.id
                })
                .eq('id', currentUserProfile.id);

            setPendingClaimTokenFromUrl(null);
            if (typeof window !== 'undefined') {
                sessionStorage.removeItem('juijui_pending_onboarding_code');
                if (window.location.search.includes('claim_org')) {
                    window.history.replaceState({}, '', window.location.pathname);
                }
            }

            await fetchOrganizationsAndMembers();
            await switchOrganization(matchedOrg.id);
            await fetchProfile();
            showToast(`คุณได้รับสิทธิ์ OWNER ของ "${matchedOrg.name}" เรียบร้อยแล้ว!`, 'success');
            return {
                success: true,
                orgName: matchedOrg.name,
                message: `รับมอบองค์กร "${matchedOrg.name}" สำเร็จ! ระบบได้ปลดล็อกและสลับเข้าสู่ Workspace ของคุณแล้ว`
            };
        } catch (err: any) {
            console.error('[OrganizationContext] claimOrganizationOwnership error:', err);
            return { success: false, message: 'เกิดข้อผิดพลาด: ' + (err.message || 'ไม่สามารถรับมอบองค์กรได้') };
        }
    }, [currentUserProfile, allPlatformOrganizations, isNativeMultiTenantDB, fetchOrganizationsAndMembers, switchOrganization, fetchProfile, showToast]);

    const joinOrganizationByCode = useCallback(async (rawCode: string) => {
        if (!currentUserProfile?.id) {
            return { success: false, message: 'กรุณาเข้าสู่ระบบก่อนเข้าร่วมองค์กร' };
        }
        const code = rawCode.trim().toUpperCase();
        if (!code) {
            return { success: false, message: 'กรุณากรอกรหัสเชิญ (Invite Code)' };
        }

        try {
            if (isNativeMultiTenantDB) {
                const { data: targetOrg, error: lookupErr } = await supabase
                    .from('organizations')
                    .select('*')
                    .ilike('invite_code', code)
                    .eq('is_active', true)
                    .maybeSingle();

                if (lookupErr || !targetOrg) {
                    return { success: false, message: 'ไม่พบองค์กรจากรหัสเชิญนี้ กรุณาตรวจสอบความถูกต้อง' };
                }

                if (targetOrg.invite_enabled === false) {
                    return { success: false, message: 'องค์กรนี้ปิดรับการเข้าร่วมด้วยรหัสเชิญชั่วคราว' };
                }

                const { data: existingMem } = await supabase
                    .from('organization_members')
                    .select('*')
                    .eq('org_id', targetOrg.id)
                    .eq('user_id', currentUserProfile.id)
                    .maybeSingle();

                if (existingMem) {
                    if (existingMem.status === 'ACTIVE') {
                        await switchOrganization(targetOrg.id);
                        return {
                            success: true,
                            status: 'ACTIVE' as OrganizationMemberStatus,
                            orgName: targetOrg.name,
                            message: `คุณเป็นสมาชิกของ ${targetOrg.name} อยู่แล้ว ระบบได้สลับ Workspace ให้ทันที`
                        };
                    }
                    return {
                        success: true,
                        status: existingMem.status as OrganizationMemberStatus,
                        orgName: targetOrg.name,
                        message: `คำขอเข้าร่วม ${targetOrg.name} ของคุณอยู่ระหว่างรอ Admin อนุมัติ`
                    };
                }

                const { error: joinErr } = await supabase
                    .from('organization_members')
                    .insert([{
                        org_id: targetOrg.id,
                        user_id: currentUserProfile.id,
                        role: 'MEMBER',
                        status: 'PENDING'
                    }]);

                if (joinErr) throw joinErr;

                await fetchOrganizationsAndMembers();
                setPendingInviteCodeFromUrl(null);
                showToast(`ส่งคำขอเข้าร่วม "${targetOrg.name}" แล้ว รอ Admin อนุมัติ`, 'info');
                return {
                    success: true,
                    status: 'PENDING' as OrganizationMemberStatus,
                    orgName: targetOrg.name,
                    message: `ส่งคำขอเข้าร่วม "${targetOrg.name}" สำเร็จ! กรุณารอ Admin ขององค์กรกดอนุมัติ`
                };
            } else {
                const { data: workspaceOpts } = await supabase
                    .from('master_options')
                    .select('*')
                    .eq('type', 'SAAS_WORKSPACE');

                let matchedOrg: Organization | null = null;
                if (code === DEFAULT_PRIMARY_ORGANIZATION.inviteCode) {
                    matchedOrg = DEFAULT_PRIMARY_ORGANIZATION;
                } else {
                    for (const w of workspaceOpts || []) {
                        try {
                            const meta = w.description ? JSON.parse(w.description) : {};
                            if ((meta.inviteCode || '').toUpperCase() === code) {
                                matchedOrg = {
                                    id: w.key || w.id,
                                    name: w.label,
                                    slug: meta.slug || 'workspace',
                                    inviteCode: meta.inviteCode,
                                    inviteEnabled: meta.inviteEnabled !== false,
                                    isActive: true
                                };
                                break;
                            }
                        } catch {
                            // Ignore parse errors
                        }
                    }
                }

                if (!matchedOrg) {
                    return { success: false, message: 'ไม่พบองค์กรจากรหัสเชิญนี้ กรุณาตรวจสอบความถูกต้อง' };
                }

                await supabase
                    .from('master_options')
                    .insert([{
                        type: 'SAAS_WORKSPACE_MEMBER',
                        key: `REQ_${matchedOrg.id.slice(0, 6)}_${currentUserProfile.id.slice(0, 6)}_${Date.now().toString().slice(-4)}`,
                        parent_key: matchedOrg.id,
                        label: currentUserProfile.name,
                        description: JSON.stringify({
                            userId: currentUserProfile.id,
                            email: currentUserProfile.email,
                            role: 'MEMBER',
                            status: 'PENDING'
                        }),
                        sort_order: 10,
                        is_active: true
                    }]);

                await fetchOrganizationsAndMembers();
                setPendingInviteCodeFromUrl(null);
                showToast(`ส่งคำขอเข้าร่วม "${matchedOrg.name}" แล้ว รอ Admin อนุมัติ`, 'info');
                return {
                    success: true,
                    status: 'PENDING' as OrganizationMemberStatus,
                    orgName: matchedOrg.name,
                    message: `ส่งคำขอเข้าร่วม "${matchedOrg.name}" สำเร็จ! กรุณารอ Admin กดอนุมัติ`
                };
            }
        } catch (err: any) {
            console.error('[OrganizationContext] joinOrganizationByCode error:', err);
            return { success: false, message: 'เกิดข้อผิดพลาด: ' + (err.message || 'ไม่สามารถเข้าร่วมได้') };
        }
    }, [currentUserProfile, isNativeMultiTenantDB, switchOrganization, fetchOrganizationsAndMembers, showToast]);

    const approveMemberRequest = useCallback(async (memberId: string): Promise<boolean> => {
        const activeCount = currentOrgMembers.filter(m => m.status === 'ACTIVE').length;
        const maxAllowed = currentOrg.maxMembers || 100;

        if (activeCount >= maxAllowed) {
            showToast(
                `ไม่สามารถอนุมัติได้ เนื่องจากสมาชิกในองค์กรเต็มโควตาแพ็กเกจแล้ว (${activeCount}/${maxAllowed} คน) กรุณาอัปเกรดแพ็กเกจ`,
                'error'
            );
            return false;
        }

        const targetMember = currentOrgMembers.find(m => m.id === memberId);

        try {
            if (isNativeMultiTenantDB) {
                const { error } = await supabase
                    .from('organization_members')
                    .update({ status: 'ACTIVE', updated_at: new Date().toISOString() })
                    .eq('id', memberId);
                if (error) throw error;
            } else {
                if (targetMember) {
                    await supabase
                        .from('master_options')
                        .update({
                            description: JSON.stringify({
                                userId: targetMember.userId,
                                email: targetMember.user?.email || '',
                                role: targetMember.role,
                                status: 'ACTIVE'
                            })
                        })
                        .eq('id', memberId);
                }
            }

            // Auto-unlock the approved user's profile (is_approved = true) and set current_org_id if not set
            if (targetMember?.userId) {
                await supabase
                    .from('profiles')
                    .update({
                        is_approved: true,
                        current_org_id: currentOrg.id
                    })
                    .eq('id', targetMember.userId);
            }

            await fetchOrganizationsAndMembers();
            showToast('อนุมัติสมาชิกเข้าสู่องค์กรและปลดล็อกสิทธิ์เข้าใช้งานเรียบร้อยแล้ว', 'success');
            return true;
        } catch (err: any) {
            console.error('[OrganizationContext] approveMemberRequest error:', err);
            showToast('ไม่สามารถอนุมัติสมาชิกได้: ' + err.message, 'error');
            return false;
        }
    }, [isNativeMultiTenantDB, currentOrgMembers, currentOrg.id, currentOrg.maxMembers, fetchOrganizationsAndMembers, showToast]);

    const rejectMemberRequest = useCallback(async (memberId: string): Promise<boolean> => {
        try {
            if (isNativeMultiTenantDB) {
                const { error } = await supabase
                    .from('organization_members')
                    .delete()
                    .eq('id', memberId);
                if (error) throw error;
            } else {
                await supabase
                    .from('master_options')
                    .delete()
                    .eq('id', memberId);
            }
            await fetchOrganizationsAndMembers();
            showToast('ปฏิเสธคำขอเข้าร่วมองค์กรแล้ว', 'info');
            return true;
        } catch (err: any) {
            console.error('[OrganizationContext] rejectMemberRequest error:', err);
            showToast('ไม่สามารถลบคำขอได้: ' + err.message, 'error');
            return false;
        }
    }, [isNativeMultiTenantDB, fetchOrganizationsAndMembers, showToast]);

    const cancelPendingJoinRequest = useCallback(async (orgId: string): Promise<boolean> => {
        if (!currentUserProfile?.id) return false;
        try {
            if (isNativeMultiTenantDB) {
                const { error } = await supabase
                    .from('organization_members')
                    .delete()
                    .eq('org_id', orgId)
                    .eq('user_id', currentUserProfile.id)
                    .eq('status', 'PENDING');
                if (error) throw error;
            } else {
                const pendingMem = myMemberships.find(m => m.orgId === orgId && m.status === 'PENDING');
                if (pendingMem) {
                    await supabase
                        .from('master_options')
                        .delete()
                        .eq('id', pendingMem.id);
                }
            }
            await fetchOrganizationsAndMembers();
            showToast('ยกเลิกคำขอเข้าร่วมองค์กรเดิมแล้ว คุณสามารถกรอกรหัสใหม่ได้ทันที', 'info');
            return true;
        } catch (err: any) {
            console.error('[OrganizationContext] cancelPendingJoinRequest error:', err);
            showToast('ไม่สามารถยกเลิกคำขอได้: ' + err.message, 'error');
            return false;
        }
    }, [currentUserProfile?.id, isNativeMultiTenantDB, myMemberships, fetchOrganizationsAndMembers, showToast]);

    const regenerateInviteCode = useCallback(async (orgId?: string): Promise<string | null> => {
        const targetOrg = allPlatformOrganizations.find(o => o.id === (orgId || currentOrg.id)) || currentOrg;
        const newCode = generateRandomInviteCode(targetOrg.slug || targetOrg.name);

        try {
            if (isNativeMultiTenantDB) {
                const { error } = await supabase
                    .from('organizations')
                    .update({ invite_code: newCode, updated_at: new Date().toISOString() })
                    .eq('id', targetOrg.id);
                if (error) throw error;
            } else {
                const { data: existing } = await supabase
                    .from('master_options')
                    .select('*')
                    .eq('type', 'SAAS_WORKSPACE')
                    .eq('key', targetOrg.id)
                    .maybeSingle();

                if (existing) {
                    const meta = existing.description ? JSON.parse(existing.description) : {};
                    meta.inviteCode = newCode;
                    await supabase
                        .from('master_options')
                        .update({ description: JSON.stringify(meta) })
                        .eq('id', existing.id);
                }
            }
            await fetchOrganizationsAndMembers();
            showToast(`สร้างรหัสเชิญใหม่สำเร็จ: ${newCode}`, 'success');
            return newCode;
        } catch (err: any) {
            console.error('[OrganizationContext] regenerateInviteCode error:', err);
            showToast('ไม่สามารถรีเซ็ตรหัสเชิญได้', 'error');
            return null;
        }
    }, [allPlatformOrganizations, currentOrg, isNativeMultiTenantDB, fetchOrganizationsAndMembers, showToast]);

    const toggleInviteEnabled = useCallback(async (enabled: boolean): Promise<boolean> => {
        try {
            if (isNativeMultiTenantDB) {
                const { error } = await supabase
                    .from('organizations')
                    .update({ invite_enabled: enabled, updated_at: new Date().toISOString() })
                    .eq('id', currentOrg.id);
                if (error) throw error;
            }
            await fetchOrganizationsAndMembers();
            showToast(enabled ? 'เปิดรับสมาชิกรหัสเชิญแล้ว' : 'ปิดรับสมาชิกรหัสเชิญชั่วคราว', 'info');
            return true;
        } catch (err: any) {
            console.error('[OrganizationContext] toggleInviteEnabled error:', err);
            return false;
        }
    }, [currentOrg.id, isNativeMultiTenantDB, fetchOrganizationsAndMembers, showToast]);

    return (
        <OrganizationContext.Provider
            value={{
                isReady,
                isNativeMultiTenantDB,
                isSuperAdmin,
                currentOrg,
                myOrganizations,
                allPlatformOrganizations,
                myMemberships,
                currentOrgMembers,
                pendingJoinRequests,
                currentMembershipRole,
                currentMembershipStatus,
                isOrgAdmin,
                isSwitcherOpen,
                pendingInviteCodeFromUrl,
                pendingClaimTokenFromUrl,
                computedSubscriptionStatus,
                daysUntilExpiry,
                graceDaysRemaining,
                isSubscriptionLocked,
                isModuleAllowed,
                invoices,
                openSwitcherModal,
                closeSwitcherModal,
                activeModalTab,
                setActiveModalTab,
                switchOrganization,
                createOrganization,
                updateOrganizationLicense,
                renewOrganizationSubscription,
                submitRenewalRequest,
                approveInvoiceRequest,
                rejectInvoiceRequest,
                claimOrganizationOwnership,
                joinOrganizationByCode,
                approveMemberRequest,
                rejectMemberRequest,
                cancelPendingJoinRequest,
                regenerateInviteCode,
                toggleInviteEnabled,
                refreshOrganizations: fetchOrganizationsAndMembers
            }}
        >
            {children}
        </OrganizationContext.Provider>
    );
};

export const useOrganization = () => {
    const context = useContext(OrganizationContext);
    if (!context) {
        throw new Error('useOrganization must be used within an OrganizationProvider');
    }
    return context;
};

