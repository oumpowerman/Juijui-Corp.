import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
    Organization,
    OrganizationMember,
    OrganizationRole,
    OrganizationMemberStatus,
    SubscriptionInvoice
} from '../types';
import { PRIMARY_DEFAULT_ORG_ID } from '../lib/multiTenantMigrationSql';
import { getActiveOrgIdSync } from '../lib/tenantStorage';
import { useUserSession } from './UserSessionContext';
import { useToast } from './ToastContext';
import {
    CreateOrganizationInput,
    UpdateOrganizationLicenseInput,
    WorkspaceModalTab,
    OrganizationContextType,
    DEFAULT_PRIMARY_ORGANIZATION,
    generateOwnerClaimToken,
    computeSubscriptionEngine
} from './organization/types';
import { fetchNativeOrganizationsBundle } from './organization/organizationRepository';
import { useOrganizationLicensingDomain } from './organization/useOrganizationLicensingDomain';
import { useOrganizationBillingDomain } from './organization/useOrganizationBillingDomain';
import { useOrganizationMembersDomain } from './organization/useOrganizationMembersDomain';

export type {
    CreateOrganizationInput,
    UpdateOrganizationLicenseInput,
    WorkspaceModalTab,
    OrganizationContextType
};
export { generateOwnerClaimToken };

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export const OrganizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const queryClient = useQueryClient();
    const { currentUserProfile, allUsers, fetchProfile, fetchMissingProfiles } = useUserSession();
    const { showToast } = useToast();

    const [isReady, setIsReady] = useState(false);
    const [isNativeMultiTenantDB, setIsNativeMultiTenantDB] = useState(true);
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

    const [isInSuperAdminPortal, setIsInSuperAdminPortalState] = useState<boolean>(() => {
        if (typeof window === 'undefined') return false;
        const saved = sessionStorage.getItem('juijui_superadmin_portal_mode');
        if (saved === 'WORKSPACE') return false;
        if (saved === 'PORTAL') return true;
        return true; // Default to Portal for Super Admin unless deep linked
    });

    const setIsInSuperAdminPortal = useCallback((inPortal: boolean) => {
        setIsInSuperAdminPortalState(inPortal);
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('juijui_superadmin_portal_mode', inPortal ? 'PORTAL' : 'WORKSPACE');
        }
    }, []);

    // Ensure Super Admin defaults to Portal unless opening a specific deep link
    useEffect(() => {
        if (!isSuperAdmin) {
            setIsInSuperAdminPortalState(false);
            return;
        }
        if (typeof window === 'undefined') return;
        const params = new URLSearchParams(window.location.search);
        const hasDeepLink =
            params.has('taskId') ||
            params.has('contentId') ||
            params.has('highlightTaskId') ||
            params.has('openTaskId') ||
            params.has('claim_org') ||
            params.has('join_org');

        if (hasDeepLink) {
            setIsInSuperAdminPortal(false);
        } else if (!sessionStorage.getItem('juijui_superadmin_portal_mode')) {
            setIsInSuperAdminPortal(true);
        }
    }, [isSuperAdmin, setIsInSuperAdminPortal]);

    // 1. Check URL for ?join_org=INVITE_CODE or ?claim_org=CLAIM_TOKEN on mount
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

    // 2. Centralized Native Multi-Tenant Data Loader
    const fetchOrganizationsAndMembers = useCallback(async () => {
        if (!currentUserProfile?.id) {
            setIsReady(true);
            return;
        }

        try {
            const loaded = await fetchNativeOrganizationsBundle({
                currentUser: currentUserProfile,
                allUsers,
                isSuperAdmin,
                fetchMissingProfiles
            });

            setIsNativeMultiTenantDB(true);
            setAllPlatformOrganizations(loaded.allPlatformOrganizations);
            setMyOrganizations(loaded.myOrganizations);
            setMyMemberships(loaded.myMemberships);
            setSelectedOrgId(loaded.resolvedActiveOrgId);
            setCurrentOrgMembers(loaded.currentOrgMembers);
            setInvoices(loaded.invoices);
        } catch (err) {
            console.warn('[OrganizationContext] Failed to load native organization tables:', err);
        } finally {
            setIsReady(true);
        }
    }, [currentUserProfile, allUsers, isSuperAdmin, fetchMissingProfiles]);

    useEffect(() => {
        fetchOrganizationsAndMembers();
    }, [fetchOrganizationsAndMembers]);

    // 3. Derived Workspace & Role State
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
        return (
            isSuperAdmin ||
            currentMembershipRole === 'OWNER' ||
            currentMembershipRole === 'ADMIN' ||
            currentUserProfile?.role === 'ADMIN'
        );
    }, [isSuperAdmin, currentMembershipRole, currentUserProfile?.role]);

    const pendingJoinRequests = useMemo(() => {
        return currentOrgMembers.filter(m => m.status === 'PENDING');
    }, [currentOrgMembers]);

    // 4. Commercial Licensing & Subscription Engine
    const {
        computedSubscriptionStatus,
        daysUntilExpiry,
        graceDaysRemaining,
        isSubscriptionLocked
    } = useMemo(() => computeSubscriptionEngine(currentOrg), [currentOrg]);

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

    // 5. Initialize Domain Action Hooks
    const licensingDomain = useOrganizationLicensingDomain({
        currentUserProfile,
        isSuperAdmin,
        myOrganizations,
        allPlatformOrganizations,
        myMemberships,
        setSelectedOrgId,
        setPendingClaimTokenFromUrl,
        fetchOrganizationsAndMembers,
        fetchProfile,
        queryClient,
        showToast
    });

    const billingDomain = useOrganizationBillingDomain({
        currentUserProfile,
        isSuperAdmin,
        currentOrg,
        allPlatformOrganizations,
        invoices,
        updateOrganizationLicense: licensingDomain.updateOrganizationLicense,
        fetchOrganizationsAndMembers,
        showToast
    });

    const membersDomain = useOrganizationMembersDomain({
        currentUserProfile,
        currentOrg,
        allPlatformOrganizations,
        currentOrgMembers,
        setPendingInviteCodeFromUrl,
        switchOrganization: licensingDomain.switchOrganization,
        fetchOrganizationsAndMembers,
        showToast
    });

    const enterCustomerWorkspace = useCallback(async (orgId: string): Promise<boolean> => {
        const switched = await licensingDomain.switchOrganization(orgId);
        if (switched) {
            setIsInSuperAdminPortal(false);
            setIsSwitcherOpen(false);
        }
        return switched;
    }, [licensingDomain.switchOrganization, setIsInSuperAdminPortal]);

    const returnToSuperAdminPortal = useCallback(() => {
        setIsInSuperAdminPortal(true);
        setIsSwitcherOpen(false);
    }, [setIsInSuperAdminPortal]);

    // 6. Compose Memoized Context Value
    const value = useMemo<OrganizationContextType>(() => ({
        isReady,
        isNativeMultiTenantDB,
        isSuperAdmin,
        isInSuperAdminPortal,
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
        setIsInSuperAdminPortal,
        enterCustomerWorkspace,
        returnToSuperAdminPortal,
        openSwitcherModal,
        closeSwitcherModal,
        activeModalTab,
        setActiveModalTab,
        switchOrganization: licensingDomain.switchOrganization,
        createOrganization: licensingDomain.createOrganization,
        updateOrganizationLicense: licensingDomain.updateOrganizationLicense,
        renewOrganizationSubscription: billingDomain.renewOrganizationSubscription,
        submitRenewalRequest: billingDomain.submitRenewalRequest,
        approveInvoiceRequest: billingDomain.approveInvoiceRequest,
        rejectInvoiceRequest: billingDomain.rejectInvoiceRequest,
        claimOrganizationOwnership: licensingDomain.claimOrganizationOwnership,
        joinOrganizationByCode: membersDomain.joinOrganizationByCode,
        approveMemberRequest: membersDomain.approveMemberRequest,
        rejectMemberRequest: membersDomain.rejectMemberRequest,
        cancelPendingJoinRequest: membersDomain.cancelPendingJoinRequest,
        regenerateInviteCode: membersDomain.regenerateInviteCode,
        toggleInviteEnabled: membersDomain.toggleInviteEnabled,
        refreshOrganizations: fetchOrganizationsAndMembers
    }), [
        isReady,
        isNativeMultiTenantDB,
        isSuperAdmin,
        isInSuperAdminPortal,
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
        setIsInSuperAdminPortal,
        enterCustomerWorkspace,
        returnToSuperAdminPortal,
        openSwitcherModal,
        closeSwitcherModal,
        activeModalTab,
        licensingDomain.switchOrganization,
        licensingDomain.createOrganization,
        licensingDomain.updateOrganizationLicense,
        licensingDomain.claimOrganizationOwnership,
        billingDomain.renewOrganizationSubscription,
        billingDomain.submitRenewalRequest,
        billingDomain.approveInvoiceRequest,
        billingDomain.rejectInvoiceRequest,
        membersDomain.joinOrganizationByCode,
        membersDomain.approveMemberRequest,
        membersDomain.rejectMemberRequest,
        membersDomain.cancelPendingJoinRequest,
        membersDomain.regenerateInviteCode,
        membersDomain.toggleInviteEnabled,
        fetchOrganizationsAndMembers
    ]);

    return (
        <OrganizationContext.Provider value={value}>
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
