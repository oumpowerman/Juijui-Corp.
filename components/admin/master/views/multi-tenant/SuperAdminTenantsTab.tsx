import React, { useState, useMemo } from 'react';
import { Plus, Search, Sliders, UserPlus } from 'lucide-react';
import { Organization, PlanTier, SubscriptionStatus } from '../../../../../types';
import { SAAS_PLAN_PRESETS } from '../../../../../lib/multiTenantMigrationSql';
import {
    ALL_AVAILABLE_MODULES,
    PLAN_BADGE_STYLE,
    STATUS_BADGE_STYLE
} from './multiTenantConstants';

interface SuperAdminTenantsTabProps {
    isSuperAdmin: boolean;
    currentOrg: Organization;
    allPlatformOrganizations: Organization[];
    activeMemberCount: number;
    pendingInvoicesCount: number;
    onOpenProvisionModal: () => void;
    onOpenEditLicenseModal: (org: Organization) => void;
    onOpenHandoverModal: (org: Organization) => void;
    onSwitchOrganization: (orgId: string) => void;
    onGoToBillingTab: () => void;
}

export const SuperAdminTenantsTab: React.FC<SuperAdminTenantsTabProps> = ({
    isSuperAdmin,
    currentOrg,
    allPlatformOrganizations,
    activeMemberCount,
    pendingInvoicesCount,
    onOpenProvisionModal,
    onOpenEditLicenseModal,
    onOpenHandoverModal,
    onSwitchOrganization,
    onGoToBillingTab
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [planFilter, setPlanFilter] = useState<'ALL' | PlanTier>('ALL');
    const [statusFilter, setStatusFilter] = useState<'ALL' | SubscriptionStatus>('ALL');

    const mrrEstimate = useMemo(() => {
        return allPlatformOrganizations.reduce((acc, org) => {
            if (org.subscriptionStatus !== 'ACTIVE' && org.subscriptionStatus !== 'TRIAL') return acc;
            const preset = SAAS_PLAN_PRESETS[org.planTier || 'PRO'];
            return acc + (preset?.monthlyPriceTHB || 0);
        }, 0);
    }, [allPlatformOrganizations]);

    const filteredOrganizations = useMemo(() => {
        return allPlatformOrganizations.filter(org => {
            const tier = org.planTier || 'PRO';
            const status = org.subscriptionStatus || 'ACTIVE';
            if (planFilter !== 'ALL' && tier !== planFilter) return false;
            if (statusFilter !== 'ALL' && status !== statusFilter) return false;

            if (searchQuery.trim()) {
                const q = searchQuery.trim().toLowerCase();
                const matchName = org.name.toLowerCase().includes(q);
                const matchSlug = (org.slug || '').toLowerCase().includes(q);
                const matchInvite = (org.inviteCode || '').toLowerCase().includes(q);
                const matchClaim = (org.ownerClaimToken || '').toLowerCase().includes(q);
                return matchName || matchSlug || matchInvite || matchClaim;
            }
            return true;
        });
    }, [allPlatformOrganizations, planFilter, statusFilter, searchQuery]);

    return (
        <div className="space-y-6">
            {/* Commercial KPI Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-semibold text-slate-500">องค์กรลูกค้าทั้งหมด (Total Tenants)</p>
                    <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
                        {allPlatformOrganizations.length} บริษัท
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                        แยกข้อมูลด้วย `org_id` บนฐานข้อมูลเดียวกัน
                    </p>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-semibold text-slate-500">รายได้รายเดือนประเมิน (Est. MRR)</p>
                    <p className="text-2xl font-bold font-mono tabular-nums text-indigo-600 mt-1">
                        ฿{mrrEstimate.toLocaleString()}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                        คำนวณจากแพ็กเกจที่สถานะ ACTIVE / TRIAL
                    </p>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-semibold text-slate-500">แพ็กเกจขององค์กรที่เปิดอยู่</p>
                    <div className="flex items-center gap-2 mt-1">
                        <span
                            className={`px-2.5 py-0.5 text-xs font-bold rounded-lg border ${
                                PLAN_BADGE_STYLE[currentOrg.planTier || 'PRO']
                            }`}
                        >
                            {currentOrg.planTier || 'PRO'}
                        </span>
                        <span
                            className={`px-2.5 py-0.5 text-xs font-bold rounded-lg border ${
                                STATUS_BADGE_STYLE[currentOrg.subscriptionStatus || 'ACTIVE']
                            }`}
                        >
                            {currentOrg.subscriptionStatus || 'ACTIVE'}
                        </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1.5 font-mono tabular-nums">
                        โควตาสมาชิก: {activeMemberCount} / {currentOrg.maxMembers || 50} คน
                    </p>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-semibold text-slate-500">บิลรอตรวจสอบ / ต่ออายุ</p>
                    <p className="text-2xl font-bold font-mono tabular-nums text-amber-600 mt-1">
                        {pendingInvoicesCount} รายการ
                    </p>
                    <button
                        type="button"
                        onClick={onGoToBillingTab}
                        className="text-[11px] font-bold text-indigo-600 hover:underline mt-1 inline-block"
                    >
                        เปิดหน้าตรวจสอบบิลและ Webhook →
                    </button>
                </div>
            </div>

            {/* Customer Organizations Directory */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                        <h3 className="font-bold text-slate-900 text-base">
                            รายชื่อองค์กรลูกค้าและการควบคุมสิทธิ์ (Tenant Licensing Directory)
                        </h3>
                        <p className="text-xs text-slate-500">
                            กำหนดแพ็กเกจ, วันหมดอายุ, โควตาพนักงาน และเลือกเปิด-ปิดเมนู Sidebar รายบริษัท
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                        {/* Search Input */}
                        <div className="relative min-w-[210px] flex-1 sm:flex-initial">
                            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="ค้นหาชื่อบริษัท / รหัสเชิญ..."
                                className="w-full pl-8 pr-3 py-2 text-xs font-semibold border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:border-indigo-500"
                            />
                        </div>

                        {/* Plan Tier Filter */}
                        <select
                            value={planFilter}
                            onChange={e => setPlanFilter(e.target.value as 'ALL' | PlanTier)}
                            className="px-3 py-2 text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                        >
                            <option value="ALL">ทุกแพ็กเกจ</option>
                            <option value="STARTER">STARTER</option>
                            <option value="PRO">PRO</option>
                            <option value="ENTERPRISE">ENTERPRISE</option>
                            <option value="LIFETIME">LIFETIME</option>
                        </select>

                        {/* Status Filter */}
                        <select
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value as 'ALL' | SubscriptionStatus)}
                            className="px-3 py-2 text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                        >
                            <option value="ALL">ทุกสถานะสัญญา</option>
                            <option value="ACTIVE">ACTIVE</option>
                            <option value="TRIAL">TRIAL</option>
                            <option value="GRACE_PERIOD">GRACE_PERIOD</option>
                            <option value="PAST_DUE">PAST_DUE</option>
                            <option value="SUSPENDED">SUSPENDED</option>
                            <option value="EXPIRED">EXPIRED</option>
                        </select>

                        {isSuperAdmin && (
                            <button
                                type="button"
                                onClick={onOpenProvisionModal}
                                className="px-3.5 py-2 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-colors flex items-center gap-1.5"
                            >
                                <Plus className="w-4 h-4" /> เพิ่มองค์กรลูกค้าใหม่
                            </button>
                        )}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase">
                                <th className="py-3.5 px-5">องค์กร / ลูกค้า</th>
                                <th className="py-3.5 px-4">แพ็กเกจ & สถานะ</th>
                                <th className="py-3.5 px-4">สิทธิ์เมนู Sidebar</th>
                                <th className="py-3.5 px-4">โควตาสมาชิก</th>
                                <th className="py-3.5 px-4">วันหมดอายุ</th>
                                <th className="py-3.5 px-5 text-right">การจัดการ (Super Admin)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                            {filteredOrganizations.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-10 px-6 text-center text-xs font-semibold text-slate-500">
                                        ไม่พบองค์กรลูกค้าที่ตรงกับเงื่อนไขการค้นหา
                                    </td>
                                </tr>
                            ) : (
                                filteredOrganizations.map(org => {
                                    const isCurrent = org.id === currentOrg.id;
                                    const tier = org.planTier || 'PRO';
                                    const status = org.subscriptionStatus || 'ACTIVE';
                                    const moduleCountLabel =
                                        !org.allowedModules || org.allowedModules.length === 0
                                            ? `ครบทุก Module (${ALL_AVAILABLE_MODULES.length})`
                                            : `${org.allowedModules.length} / ${ALL_AVAILABLE_MODULES.length} เมนู`;

                                    return (
                                        <tr
                                            key={org.id}
                                            className={`hover:bg-slate-50/80 transition-colors ${
                                                isCurrent ? 'bg-indigo-50/20' : ''
                                            }`}
                                        >
                                            <td className="py-4 px-5">
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className={`w-10 h-10 rounded-xl border flex items-center justify-center font-bold text-xs shrink-0 ${
                                                            org.color || 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                                        }`}
                                                    >
                                                        {org.name.slice(0, 2).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold text-slate-900">{org.name}</span>
                                                            {isCurrent && (
                                                                <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-100 text-indigo-700 rounded-md">
                                                                    กำลังใช้งาน
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-xs text-slate-500 font-mono flex items-center gap-2 mt-0.5">
                                                            <span>Invite: {org.inviteCode}</span>
                                                            {org.ownerClaimToken && (
                                                                <span className="text-amber-600 font-semibold">
                                                                    • รอส่งมอบ Owner ({org.ownerClaimToken})
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="py-4 px-4">
                                                <div className="flex flex-wrap items-center gap-1.5">
                                                    <span
                                                        className={`px-2.5 py-0.5 text-xs font-bold rounded-lg border ${PLAN_BADGE_STYLE[tier]}`}
                                                    >
                                                        {tier}
                                                    </span>
                                                    <span
                                                        className={`px-2.5 py-0.5 text-xs font-bold rounded-lg border ${STATUS_BADGE_STYLE[status]}`}
                                                    >
                                                        {status}
                                                    </span>
                                                </div>
                                            </td>

                                            <td className="py-4 px-4">
                                                <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 font-mono tabular-nums">
                                                    {moduleCountLabel}
                                                </span>
                                            </td>

                                            <td className="py-4 px-4 font-mono tabular-nums text-xs font-bold text-slate-700">
                                                สูงสุด {org.maxMembers || 50} คน
                                            </td>

                                            <td className="py-4 px-4 text-xs font-mono tabular-nums text-slate-600">
                                                {org.expiresAt
                                                    ? new Date(org.expiresAt).toLocaleDateString('th-TH', {
                                                          day: 'numeric',
                                                          month: 'short',
                                                          year: 'numeric'
                                                      })
                                                    : 'ตลอดชีพ (Lifetime)'}
                                            </td>

                                            <td className="py-4 px-5 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => onOpenEditLicenseModal(org)}
                                                        className="px-3 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-colors flex items-center gap-1"
                                                    >
                                                        <Sliders className="w-3.5 h-3.5" />
                                                        ตั้งค่าแพ็กเกจ & Module
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => onOpenHandoverModal(org)}
                                                        className="px-3 py-1.5 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-colors flex items-center gap-1"
                                                        title="สร้างลิงก์ส่งมอบสิทธิ์ Owner หรือระบุเจ้าของ"
                                                    >
                                                        <UserPlus className="w-3.5 h-3.5" />
                                                        ส่งมอบ Owner
                                                    </button>

                                                    {!isCurrent && (
                                                        <button
                                                            type="button"
                                                            onClick={() => onSwitchOrganization(org.id)}
                                                            className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-colors"
                                                        >
                                                            สลับเข้าดู
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
