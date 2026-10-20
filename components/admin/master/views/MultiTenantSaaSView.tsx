import React, { useState, useMemo } from 'react';
import { useOrganization } from '../../../../context/OrganizationContext';
import { useDemoSandbox } from '../../../../context/DemoSandboxContext';
import { Organization } from '../../../../types';
import { ConsoleSubTab } from './multi-tenant/multiTenantConstants';
import { SaaSConsoleHeader } from './multi-tenant/SaaSConsoleHeader';
import { SuperAdminTenantsTab } from './multi-tenant/SuperAdminTenantsTab';
import { BillingWebhookTab } from './multi-tenant/BillingWebhookTab';
import { DemoTrialLogsTab } from './multi-tenant/DemoTrialLogsTab';
import { WorkspaceInvitesTab } from './multi-tenant/WorkspaceInvitesTab';
import { SqlMigrationTab } from './multi-tenant/SqlMigrationTab';
import { ProvisionTenantModal } from './multi-tenant/ProvisionTenantModal';
import { EditTenantLicenseModal } from './multi-tenant/EditTenantLicenseModal';
import { OwnerHandoverModal } from './multi-tenant/OwnerHandoverModal';

const MultiTenantSaaSView: React.FC = () => {
    const {
        isSuperAdmin,
        currentOrg,
        allPlatformOrganizations,
        currentOrgMembers,
        pendingJoinRequests,
        invoices: subscriptionInvoices,
        isOrgAdmin,
        openSwitcherModal,
        switchOrganization,
        approveMemberRequest,
        rejectMemberRequest,
        regenerateInviteCode,
        refreshOrganizations,
        createOrganization,
        updateOrganizationLicense,
        approveInvoiceRequest,
        rejectInvoiceRequest
    } = useOrganization();

    const { allTrialSessions, fetchAllDemoTrialSessions } = useDemoSandbox();

    const [activeSubTab, setActiveSubTab] = useState<ConsoleSubTab>(
        isSuperAdmin ? 'SUPER_ADMIN' : 'WORKSPACE_INVITES'
    );

    // Modal Orchestration State
    const [isProvisionModalOpen, setIsProvisionModalOpen] = useState(false);
    const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
    const [handoverOrg, setHandoverOrg] = useState<Organization | null>(null);
    const [initialClaimToken, setInitialClaimToken] = useState<string | null>(null);

    const activeMemberCount = useMemo(
        () => currentOrgMembers.filter(m => m.status === 'ACTIVE').length,
        [currentOrgMembers]
    );

    const pendingInvoicesCount = useMemo(
        () => subscriptionInvoices.filter(inv => inv.paymentStatus === 'PENDING').length,
        [subscriptionInvoices]
    );

    const handleOpenHandoverModal = (org: Organization, tokenOverride?: string | null) => {
        setHandoverOrg(org);
        setInitialClaimToken(tokenOverride ?? org.ownerClaimToken ?? null);
    };

    const handleRefreshAll = async () => {
        await Promise.all([refreshOrganizations(), fetchAllDemoTrialSessions()]);
    };

    return (
        <div className="space-y-6">
            <SaaSConsoleHeader
                isSuperAdmin={isSuperAdmin}
                activeSubTab={activeSubTab}
                onSelectSubTab={setActiveSubTab}
                totalOrgsCount={allPlatformOrganizations.length}
                pendingInvoicesCount={pendingInvoicesCount}
                demoTrialsCount={allTrialSessions.length}
                currentOrgName={currentOrg.name}
                onRefresh={handleRefreshAll}
                onOpenProvisionModal={() => setIsProvisionModalOpen(true)}
            />

            {activeSubTab === 'SUPER_ADMIN' && (
                <SuperAdminTenantsTab
                    isSuperAdmin={isSuperAdmin}
                    currentOrg={currentOrg}
                    allPlatformOrganizations={allPlatformOrganizations}
                    activeMemberCount={activeMemberCount}
                    pendingInvoicesCount={pendingInvoicesCount}
                    onOpenProvisionModal={() => setIsProvisionModalOpen(true)}
                    onOpenEditLicenseModal={org => setEditingOrg(org)}
                    onOpenHandoverModal={org => handleOpenHandoverModal(org)}
                    onSwitchOrganization={switchOrganization}
                    onGoToBillingTab={() => setActiveSubTab('BILLING_WEBHOOK')}
                />
            )}

            {activeSubTab === 'BILLING_WEBHOOK' && (
                <BillingWebhookTab
                    isSuperAdmin={isSuperAdmin}
                    currentOrgId={currentOrg.id}
                    allPlatformOrganizations={allPlatformOrganizations}
                    subscriptionInvoices={subscriptionInvoices}
                    onApproveInvoice={approveInvoiceRequest}
                    onRejectInvoice={rejectInvoiceRequest}
                    onRefreshOrganizations={refreshOrganizations}
                />
            )}

            {activeSubTab === 'DEMO_TRIALS' && <DemoTrialLogsTab />}

            {activeSubTab === 'WORKSPACE_INVITES' && (
                <WorkspaceInvitesTab
                    currentOrg={currentOrg}
                    activeMemberCount={activeMemberCount}
                    isOrgAdmin={isOrgAdmin}
                    pendingJoinRequests={pendingJoinRequests}
                    onOpenSwitcherModal={() => openSwitcherModal('SWITCH')}
                    onRegenerateInviteCode={regenerateInviteCode}
                    onApproveMemberRequest={approveMemberRequest}
                    onRejectMemberRequest={rejectMemberRequest}
                />
            )}

            {activeSubTab === 'SQL_MIGRATION' && <SqlMigrationTab />}

            <ProvisionTenantModal
                isOpen={isProvisionModalOpen}
                onClose={() => setIsProvisionModalOpen(false)}
                onCreateOrganization={createOrganization}
                onCreatedWithClaimToken={(org, claimToken) => handleOpenHandoverModal(org, claimToken)}
            />

            <EditTenantLicenseModal
                editingOrg={editingOrg}
                onClose={() => setEditingOrg(null)}
                onUpdateLicense={updateOrganizationLicense}
            />

            <OwnerHandoverModal
                handoverOrg={handoverOrg}
                initialClaimToken={initialClaimToken}
                allPlatformOrganizations={allPlatformOrganizations}
                onClose={() => {
                    setHandoverOrg(null);
                    setInitialClaimToken(null);
                }}
                onUpdateLicense={updateOrganizationLicense}
                onRefreshOrganizations={refreshOrganizations}
            />
        </div>
    );
};

export default MultiTenantSaaSView;
