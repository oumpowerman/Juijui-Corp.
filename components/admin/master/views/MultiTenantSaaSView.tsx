import React, { useMemo } from 'react';
import { Building2, Crown, RefreshCw } from 'lucide-react';
import { useOrganization } from '../../../../context/OrganizationContext';
import { WorkspaceInvitesTab } from './multi-tenant/WorkspaceInvitesTab';
import { TenantSubscriptionOverview } from './multi-tenant/TenantSubscriptionOverview';

const MultiTenantSaaSView: React.FC = () => {
    const {
        isSuperAdmin,
        currentOrg,
        currentOrgMembers,
        pendingJoinRequests,
        invoices,
        isOrgAdmin,
        computedSubscriptionStatus,
        daysUntilExpiry,
        openSwitcherModal,
        approveMemberRequest,
        rejectMemberRequest,
        regenerateInviteCode,
        submitRenewalRequest,
        refreshOrganizations,
        returnToSuperAdminPortal
    } = useOrganization();

    const activeMemberCount = useMemo(
        () => currentOrgMembers.filter(m => m.status === 'ACTIVE').length,
        [currentOrgMembers]
    );

    return (
        <div className="space-y-6">
            {/* Customer Organization Header */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                    <div className="p-3 rounded-2xl bg-indigo-600 text-white shadow-sm shrink-0">
                        <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">
                            ข้อมูลองค์กร รหัสเชิญทีม และแพ็กเกจการใช้งาน ({currentOrg.name})
                        </h2>
                        <p className="text-xs text-slate-500 mt-1">
                            จัดการรหัสเชิญสำหรับพนักงานในบริษัท อนุมัติคำขอเข้าร่วมทีม และตรวจสอบสถานะแพ็กเกจขององค์กรคุณ
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                        type="button"
                        onClick={refreshOrganizations}
                        className="px-3.5 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5"
                    >
                        <RefreshCw className="w-3.5 h-3.5" /> รีเฟรชข้อมูล
                    </button>

                    {isSuperAdmin && (
                        <button
                            type="button"
                            onClick={returnToSuperAdminPortal}
                            className="px-4 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
                        >
                            <Crown className="w-4 h-4 text-amber-400" />
                            เปิดศูนย์ควบคุมแพลตฟอร์ม (Super Admin Portal)
                        </button>
                    )}
                </div>
            </div>

            {/* Section 1: Team Invite Code & Member Approval Queue */}
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

            {/* Section 2: Current Company Subscription Plan & Renewal History */}
            <TenantSubscriptionOverview
                currentOrg={currentOrg}
                computedSubscriptionStatus={computedSubscriptionStatus}
                daysUntilExpiry={daysUntilExpiry}
                invoices={invoices}
                onSubmitRenewalRequest={submitRenewalRequest}
            />
        </div>
    );
};

export default MultiTenantSaaSView;
