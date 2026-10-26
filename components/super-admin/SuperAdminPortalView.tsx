import React, { useState, useMemo } from 'react';
import {
    Building2,
    CreditCard,
    Crown,
    Database,
    ExternalLink,
    LogOut,
    Plus,
    RefreshCw,
    Sparkles
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useOrganization } from '../../context/OrganizationContext';
import { useUserSession } from '../../context/UserSessionContext';
import { useDemoSandbox } from '../../context/DemoSandboxContext';
import { Organization } from '../../types';
import { SuperAdminTenantsDataGrid } from './SuperAdminTenantsDataGrid';
import { BillingWebhookTab } from '../admin/master/views/multi-tenant/BillingWebhookTab';
import { DemoTrialLogsTab } from '../admin/master/views/multi-tenant/DemoTrialLogsTab';
import { SqlMigrationTab } from '../admin/master/views/multi-tenant/SqlMigrationTab';
import { DomainReadinessTab } from '../admin/master/views/multi-tenant/DomainReadinessTab';
import { ProvisionTenantModal } from '../admin/master/views/multi-tenant/ProvisionTenantModal';
import { EditTenantLicenseModal } from '../admin/master/views/multi-tenant/EditTenantLicenseModal';
import { OwnerHandoverModal } from '../admin/master/views/multi-tenant/OwnerHandoverModal';

type PortalTab = 'TENANTS_GRID' | 'BILLING_WEBHOOK' | 'DEMO_TRIALS' | 'SQL_MIGRATION' | 'DOMAIN_LAUNCH';

export const SuperAdminPortalView: React.FC = () => {
    const {
        isSuperAdmin,
        isNativeMultiTenantDB,
        currentOrg,
        allPlatformOrganizations,
        invoices: subscriptionInvoices,
        enterCustomerWorkspace,
        refreshOrganizations,
        createOrganization,
        updateOrganizationLicense,
        approveInvoiceRequest,
        rejectInvoiceRequest
    } = useOrganization();

    const { currentUserProfile } = useUserSession();
    const { allTrialSessions, fetchAllDemoTrialSessions } = useDemoSandbox();

    const [activeTab, setActiveTab] = useState<PortalTab>('TENANTS_GRID');
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Modals State
    const [isProvisionModalOpen, setIsProvisionModalOpen] = useState(false);
    const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
    const [handoverOrg, setHandoverOrg] = useState<Organization | null>(null);
    const [initialClaimToken, setInitialClaimToken] = useState<string | null>(null);

    const pendingInvoicesCount = useMemo(
        () => subscriptionInvoices.filter(inv => inv.paymentStatus === 'PENDING').length,
        [subscriptionInvoices]
    );

    const handleOpenHandoverModal = (org: Organization, tokenOverride?: string | null) => {
        setHandoverOrg(org);
        setInitialClaimToken(tokenOverride ?? org.ownerClaimToken ?? null);
    };

    const handleRefreshAll = async () => {
        setIsRefreshing(true);
        try {
            await Promise.all([refreshOrganizations(), fetchAllDemoTrialSessions()]);
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleLogout = async () => {
        try {
            sessionStorage.removeItem('juijui_superadmin_portal_mode');
            await supabase.auth.signOut();
        } catch (err) {
            console.warn('Logout error:', err);
        } finally {
            window.location.href = '/';
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
            {/* 1. Dedicated Platform Control Plane Top Bar */}
            <header className="sticky top-0 z-40 bg-slate-900 text-white border-b border-slate-800 shadow-sm">
                <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-sm shrink-0">
                            <Crown className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                                    SaaS Platform Control Center
                                </h1>
                                <span className="text-xs font-semibold text-amber-400">
                                    · Super Admin Backoffice
                                </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">
                                ผู้ดูแลแพลตฟอร์ม: {currentUserProfile?.name || 'Super Admin'} (
                                {currentUserProfile?.email}) · ดูแลลูกค้าทั้งหมด{' '}
                                {allPlatformOrganizations.length} บริษัท
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={() => enterCustomerWorkspace(currentOrg.id)}
                            className="px-3.5 py-2.5 text-xs font-bold text-slate-100 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors flex items-center gap-1.5"
                            title="สลับเข้าสู่หน้าจอทำงานรายวันขององค์กรที่เลือกอยู่"
                        >
                            <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
                            เข้าโหมดทำงาน ({currentOrg.name})
                        </button>

                        <button
                            type="button"
                            onClick={handleRefreshAll}
                            className="px-3.5 py-2.5 text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors flex items-center gap-1.5"
                        >
                            <RefreshCw
                                className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`}
                            />
                            รีเฟรช
                        </button>

                        <button
                            type="button"
                            onClick={() => setIsProvisionModalOpen(true)}
                            className="px-4 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
                        >
                            <Plus className="w-4 h-4" />
                            เปิดองค์กรลูกค้าใหม่ (Provision Tenant)
                        </button>

                        <button
                            type="button"
                            onClick={handleLogout}
                            className="px-3 py-2.5 text-xs font-bold text-rose-300 hover:text-white bg-slate-800 hover:bg-rose-600 border border-slate-700 hover:border-rose-500 rounded-xl transition-colors flex items-center gap-1.5"
                            title="ออกจากระบบ"
                        >
                            <LogOut className="w-3.5 h-3.5" />
                            ออก
                        </button>
                    </div>
                </div>

                {/* Portal Sub-navigation Bar */}
                <div className="bg-slate-900/95 border-t border-slate-800/80">
                    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setActiveTab('TENANTS_GRID')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 ${
                                activeTab === 'TENANTS_GRID'
                                    ? 'bg-indigo-600 text-white shadow-sm'
                                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                            }`}
                        >
                            <Building2 className="w-4 h-4" />
                            ทะเบียนองค์กรลูกค้า ({allPlatformOrganizations.length})
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('BILLING_WEBHOOK')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 ${
                                activeTab === 'BILLING_WEBHOOK'
                                    ? 'bg-indigo-600 text-white shadow-sm'
                                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                            }`}
                        >
                            <CreditCard className="w-4 h-4" />
                            อนุมัติบิลต่ออายุ & Payment Webhook
                            {pendingInvoicesCount > 0 && (
                                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-400 text-slate-950 rounded-md font-mono tabular-nums">
                                    {pendingInvoicesCount}
                                </span>
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('DEMO_TRIALS')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 ${
                                activeTab === 'DEMO_TRIALS'
                                    ? 'bg-indigo-600 text-white shadow-sm'
                                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                            }`}
                        >
                            <Sparkles className="w-4 h-4" />
                            ผู้ทดลองเล่น Demo (10 นาที)
                            {allTrialSessions.length > 0 && (
                                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-slate-700 text-slate-100 rounded-md font-mono tabular-nums">
                                    {allTrialSessions.length}
                                </span>
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('SQL_MIGRATION')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 ${
                                activeTab === 'SQL_MIGRATION'
                                    ? 'bg-indigo-600 text-white shadow-sm'
                                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                            }`}
                        >
                            <Database className="w-4 h-4" />
                            สคริปต์ฐานข้อมูล SQL RLS
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('DOMAIN_LAUNCH')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 ${
                                activeTab === 'DOMAIN_LAUNCH'
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : 'text-emerald-300 hover:text-white hover:bg-slate-800'
                            }`}
                        >
                            <Sparkles className="w-4 h-4" />
                            ความพร้อมเปิดโดเมนจริง (100% Launch)
                        </button>
                    </div>
                </div>
            </header>

            {/* 2. Main Portal Workspace Content */}
            <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                {activeTab === 'TENANTS_GRID' && (
                    <SuperAdminTenantsDataGrid
                        currentOrg={currentOrg}
                        allPlatformOrganizations={allPlatformOrganizations}
                        pendingInvoicesCount={pendingInvoicesCount}
                        onOpenProvisionModal={() => setIsProvisionModalOpen(true)}
                        onOpenEditLicenseModal={org => setEditingOrg(org)}
                        onOpenHandoverModal={org => handleOpenHandoverModal(org)}
                        onEnterCustomerWorkspace={orgId => enterCustomerWorkspace(orgId)}
                        onGoToBillingTab={() => setActiveTab('BILLING_WEBHOOK')}
                    />
                )}

                {activeTab === 'BILLING_WEBHOOK' && (
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

                {activeTab === 'DEMO_TRIALS' && <DemoTrialLogsTab />}

                {activeTab === 'SQL_MIGRATION' && <SqlMigrationTab />}

                {activeTab === 'DOMAIN_LAUNCH' && (
                    <DomainReadinessTab
                        isNativeMultiTenantDB={isNativeMultiTenantDB}
                        totalOrganizationsCount={allPlatformOrganizations.length}
                        onGoToSqlTab={() => setActiveTab('SQL_MIGRATION')}
                    />
                )}
            </main>

            {/* 3. Platform Management Modals */}
            <ProvisionTenantModal
                isOpen={isProvisionModalOpen}
                onClose={() => setIsProvisionModalOpen(false)}
                onCreateOrganization={createOrganization}
                onCreatedWithClaimToken={(org, claimToken) =>
                    handleOpenHandoverModal(org, claimToken)
                }
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

export default SuperAdminPortalView;
