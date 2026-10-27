import { supabase } from '../../lib/supabase';
import {
    Organization,
    OrganizationMember,
    OrganizationRole,
    OrganizationMemberStatus,
    SubscriptionInvoice,
    User
} from '../../types';
import { PRIMARY_DEFAULT_ORG_ID } from '../../lib/multiTenantMigrationSql';
import {
    getActiveOrgIdSync,
    getExplicitActiveOrgIdSync,
    setActiveOrgIdSync
} from '../../lib/tenantStorage';
import {
    DEFAULT_PRIMARY_ORGANIZATION,
    mapOrgFromDB,
    mapInvoiceFromDB
} from './types';

export interface LoadedOrganizationDataResult {
    allPlatformOrganizations: Organization[];
    myOrganizations: Organization[];
    myMemberships: OrganizationMember[];
    currentOrgMembers: OrganizationMember[];
    invoices: SubscriptionInvoice[];
    resolvedActiveOrgId: string;
}

export async function fetchNativeOrganizationsBundle(params: {
    currentUser: User;
    allUsers: User[];
    isSuperAdmin: boolean;
    fetchMissingProfiles: (userIds: string[]) => Promise<User[]>;
}): Promise<LoadedOrganizationDataResult> {
    const { currentUser, allUsers, isSuperAdmin, fetchMissingProfiles } = params;

    const [{ data: orgRows, error: orgError }, { data: allMemberRows }, { data: invoiceRows }] = await Promise.all([
        supabase.from('organizations').select('*').order('created_at', { ascending: true }),
        supabase.from('organization_members').select('*').order('joined_at', { ascending: true }),
        supabase.from('subscription_invoices').select('*').order('created_at', { ascending: false }).limit(100)
    ]);

    if (orgError) {
        throw orgError;
    }

    const memberCountByOrg = new Map<string, number>();
    (allMemberRows || []).forEach((m: any) => {
        if (m.status === 'ACTIVE') {
            memberCountByOrg.set(m.org_id, (memberCountByOrg.get(m.org_id) || 0) + 1);
        }
    });

    const mappedOrgs = orgRows && orgRows.length > 0
        ? orgRows.map((r: any) => mapOrgFromDB(r, memberCountByOrg.get(r.id) || 0))
        : [DEFAULT_PRIMARY_ORGANIZATION];

    const userMemberships: OrganizationMember[] = (allMemberRows || [])
        .filter((m: any) => m.user_id === currentUser.id)
        .map((m: any) => ({
            id: m.id,
            orgId: m.org_id,
            userId: m.user_id,
            role: (m.role as OrganizationRole) || 'MEMBER',
            status: (m.status as OrganizationMemberStatus) || 'ACTIVE',
            joinedAt: m.joined_at ? new Date(m.joined_at) : undefined
        }));

    const memberOrgIds = new Set(userMemberships.map(m => m.orgId));
    const accessibleOrgs = isSuperAdmin
        ? mappedOrgs
        : mappedOrgs.filter(
              o => o.isActive && (memberOrgIds.has(o.id) || o.ownerId === currentUser.id)
          );
    const latestOrgFallback =
        accessibleOrgs.length > 0
            ? accessibleOrgs[accessibleOrgs.length - 1]
            : mappedOrgs[mappedOrgs.length - 1] || mappedOrgs[0];
    const finalOrgs = accessibleOrgs.length > 0 ? accessibleOrgs : [latestOrgFallback];

    // Give top priority to explicitly selected/newly provisioned org in sessionStorage/localStorage
    // so a stale currentUser.currentOrgId never overwrites a freshly created organization!
    const explicitStorageOrgId = getExplicitActiveOrgIdSync();
    const preferredOrgId =
        explicitStorageOrgId ||
        currentUser.currentOrgId ||
        getActiveOrgIdSync() ||
        latestOrgFallback?.id ||
        PRIMARY_DEFAULT_ORG_ID;

    const validActiveOrg =
        finalOrgs.find(o => o.id === preferredOrgId) ||
        mappedOrgs.find(o => o.id === preferredOrgId && o.ownerId === currentUser.id) ||
        latestOrgFallback;
    const resolvedActiveOrgId = validActiveOrg?.id || PRIMARY_DEFAULT_ORG_ID;
    setActiveOrgIdSync(resolvedActiveOrgId);

    // Ensure profiles.current_org_id in DB stays synchronized with the resolved active org
    // so PostgreSQL RLS (public.get_active_org_id()) filters to the exact same organization
    if (currentUser.id && currentUser.currentOrgId !== resolvedActiveOrgId) {
        supabase
            .from('profiles')
            .update({ current_org_id: resolvedActiveOrgId })
            .eq('id', currentUser.id)
            .then(() => {});
    }

    const activeOrgMemberRows = (allMemberRows || []).filter(
        (m: any) => m.org_id === resolvedActiveOrgId
    );

    const memberUserIds = activeOrgMemberRows
        .map((m: any) => m.user_id)
        .filter((uid: any): uid is string => Boolean(uid));
    const missingUserIds = memberUserIds.filter(
        (uid: string) => !allUsers.some(u => u.id === uid)
    );

    let resolvedUsers = allUsers;
    if (missingUserIds.length > 0) {
        const hydrated = await fetchMissingProfiles(missingUserIds);
        const mergedMap = new Map(allUsers.map(u => [u.id, u]));
        hydrated.forEach(u => mergedMap.set(u.id, u));
        resolvedUsers = Array.from(mergedMap.values());
    }

    const enrichedMembers: OrganizationMember[] = activeOrgMemberRows.map((m: any) => {
        const foundUser = resolvedUsers.find(u => u.id === m.user_id);
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
                position: foundUser.position,
                isActive: foundUser.isActive,
                status: foundUser.status
            } : undefined
        };
    });

    const orgNameMap = new Map(mappedOrgs.map(o => [o.id, o.name]));
    const mappedInvoices: SubscriptionInvoice[] = (invoiceRows || []).map((inv: any) =>
        mapInvoiceFromDB(inv, orgNameMap)
    );

    return {
        allPlatformOrganizations: mappedOrgs,
        myOrganizations: finalOrgs,
        myMemberships: userMemberships,
        currentOrgMembers: enrichedMembers,
        invoices: mappedInvoices,
        resolvedActiveOrgId
    };
}
