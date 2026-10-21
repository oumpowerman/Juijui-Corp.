import React, { useState, useMemo } from 'react';
import {
    AlertTriangle,
    ArrowUpDown,
    Building2,
    ChevronLeft,
    ChevronRight,
    Clock,
    Copy,
    ExternalLink,
    LayoutGrid,
    ListFilter,
    Plus,
    Search,
    Sliders,
    Table as TableIcon,
    UserPlus
} from 'lucide-react';
import { Organization, PlanTier, SubscriptionStatus } from '../../types';
import { SAAS_PLAN_PRESETS } from '../../lib/multiTenantMigrationSql';
import { computeSubscriptionEngine } from '../../context/organization/types';
import { useToast } from '../../context/ToastContext';
import {
    ALL_AVAILABLE_MODULES,
    PLAN_BADGE_STYLE,
    STATUS_BADGE_STYLE
} from '../admin/master/views/multi-tenant/multiTenantConstants';

export type ExpiryHorizonFilter =
    | 'ALL'
    | 'EXPIRING_7D'
    | 'EXPIRING_30D'
    | 'EXPIRED_OR_GRACE'
    | 'UNCLAIMED';

type SortField = 'NAME' | 'PLAN' | 'EXPIRY' | 'QUOTA';
type SortOrder = 'ASC' | 'DESC';

interface SuperAdminTenantsDataGridProps {
    currentOrg: Organization;
    allPlatformOrganizations: Organization[];
    pendingInvoicesCount: number;
    onOpenProvisionModal: () => void;
    onOpenEditLicenseModal: (org: Organization) => void;
    onOpenHandoverModal: (org: Organization) => void;
    onEnterCustomerWorkspace: (orgId: string) => void;
    onGoToBillingTab: () => void;
}

const PLAN_WEIGHT: Record<PlanTier, number> = {
    STARTER: 1,
    PRO: 2,
    ENTERPRISE: 3,
    LIFETIME: 4
};

export const SuperAdminTenantsDataGrid: React.FC<SuperAdminTenantsDataGridProps> = ({
    currentOrg,
    allPlatformOrganizations,
    pendingInvoicesCount,
    onOpenProvisionModal,
    onOpenEditLicenseModal,
    onOpenHandoverModal,
    onEnterCustomerWorkspace,
    onGoToBillingTab
}) => {
    const { showToast } = useToast();

    const [searchQuery, setSearchQuery] = useState('');
    const [planFilter, setPlanFilter] = useState<'ALL' | PlanTier>('ALL');
    const [statusFilter, setStatusFilter] = useState<'ALL' | SubscriptionStatus>('ALL');
    const [expiryFilter, setExpiryFilter] = useState<ExpiryHorizonFilter>('ALL');
    const [sortField, setSortField] = useState<SortField>('EXPIRY');
    const [sortOrder, setSortOrder] = useState<SortOrder>('ASC');
    const [viewMode, setViewMode] = useState<'TABLE' | 'CARDS'>('TABLE');
    const [pageSize, setPageSize] = useState<number>(15);
    const [currentPage, setCurrentPage] = useState<number>(1);

    // Enrich organizations with computed real-time subscription engine metrics
    const enrichedOrgs = useMemo(() => {
        return allPlatformOrganizations.map(org => {
            const sub = computeSubscriptionEngine(org);
            const tier = org.planTier || 'PRO';
            const preset = SAAS_PLAN_PRESETS[tier] || SAAS_PLAN_PRESETS.PRO;
            const isUnclaimed = !org.ownerId && Boolean(org.ownerClaimToken);
            return {
                org,
                tier,
                computedStatus: sub.computedSubscriptionStatus,
                daysUntilExpiry: sub.daysUntilExpiry,
                graceDaysRemaining: sub.graceDaysRemaining,
                isLocked: sub.isSubscriptionLocked,
                monthlyPrice: preset.monthlyPriceTHB,
                isUnclaimed
            };
        });
    }, [allPlatformOrganizations]);

    // Global Commercial KPI Metrics
    const metrics = useMemo(() => {
        let mrr = 0;
        let activeCount = 0;
        let trialCount = 0;
        let expiring7dCount = 0;
        let graceOrExpiredCount = 0;
        let unclaimedCount = 0;

        for (const item of enrichedOrgs) {
            if (item.computedStatus === 'ACTIVE' || item.computedStatus === 'TRIAL') {
                mrr += item.monthlyPrice;
            }
            if (item.computedStatus === 'ACTIVE') activeCount++;
            if (item.computedStatus === 'TRIAL') trialCount++;
            if (
                item.daysUntilExpiry !== null &&
                item.daysUntilExpiry >= 0 &&
                item.daysUntilExpiry <= 7
            ) {
                expiring7dCount++;
            }
            if (
                item.computedStatus === 'GRACE_PERIOD' ||
                item.computedStatus === 'EXPIRED' ||
                item.computedStatus === 'SUSPENDED'
            ) {
                graceOrExpiredCount++;
            }
            if (item.isUnclaimed) {
                unclaimedCount++;
            }
        }

        return {
            mrr,
            arr: mrr * 12,
            activeCount,
            trialCount,
            expiring7dCount,
            graceOrExpiredCount,
            unclaimedCount
        };
    }, [enrichedOrgs]);

    // Filter + Sort Pipeline
    const filteredAndSorted = useMemo(() => {
        const filtered = enrichedOrgs.filter(item => {
            const { org, tier, computedStatus, daysUntilExpiry, isUnclaimed } = item;

            if (planFilter !== 'ALL' && tier !== planFilter) return false;
            if (statusFilter !== 'ALL' && computedStatus !== statusFilter) return false;

            if (expiryFilter === 'EXPIRING_7D') {
                if (daysUntilExpiry === null || daysUntilExpiry < 0 || daysUntilExpiry > 7) {
                    return false;
                }
            } else if (expiryFilter === 'EXPIRING_30D') {
                if (daysUntilExpiry === null || daysUntilExpiry < 0 || daysUntilExpiry > 30) {
                    return false;
                }
            } else if (expiryFilter === 'EXPIRED_OR_GRACE') {
                if (
                    computedStatus !== 'GRACE_PERIOD' &&
                    computedStatus !== 'EXPIRED' &&
                    computedStatus !== 'SUSPENDED'
                ) {
                    return false;
                }
            } else if (expiryFilter === 'UNCLAIMED') {
                if (!isUnclaimed) return false;
            }

            if (searchQuery.trim()) {
                const q = searchQuery.trim().toLowerCase();
                const matchName = org.name.toLowerCase().includes(q);
                const matchSlug = (org.slug || '').toLowerCase().includes(q);
                const matchInvite = (org.inviteCode || '').toLowerCase().includes(q);
                const matchClaim = (org.ownerClaimToken || '').toLowerCase().includes(q);
                const matchEmail = (org.billingEmail || '').toLowerCase().includes(q);
                return matchName || matchSlug || matchInvite || matchClaim || matchEmail;
            }

            return true;
        });

        filtered.sort((a, b) => {
            let cmp = 0;
            if (sortField === 'NAME') {
                cmp = a.org.name.localeCompare(b.org.name, 'th');
            } else if (sortField === 'PLAN') {
                cmp = PLAN_WEIGHT[a.tier] - PLAN_WEIGHT[b.tier];
            } else if (sortField === 'QUOTA') {
                cmp = (a.org.maxMembers || 50) - (b.org.maxMembers || 50);
            } else if (sortField === 'EXPIRY') {
                const expA = a.daysUntilExpiry !== null ? a.daysUntilExpiry : 999999;
                const expB = b.daysUntilExpiry !== null ? b.daysUntilExpiry : 999999;
                cmp = expA - expB;
            }
            return sortOrder === 'ASC' ? cmp : -cmp;
        });

        return filtered;
    }, [enrichedOrgs, planFilter, statusFilter, expiryFilter, searchQuery, sortField, sortOrder]);

    const totalPages = Math.max(1, Math.ceil(filteredAndSorted.length / pageSize));
    const safePage = Math.min(currentPage, totalPages);

    const paginatedItems = useMemo(() => {
        const start = (safePage - 1) * pageSize;
        return filteredAndSorted.slice(start, start + pageSize);
    }, [filteredAndSorted, safePage, pageSize]);

    const handleToggleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(prev => (prev === 'ASC' ? 'DESC' : 'ASC'));
        } else {
            setSortField(field);
            setSortOrder('ASC');
        }
        setCurrentPage(1);
    };

    const handleCopyText = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        showToast(`คัดลอก ${label} เรียบร้อยแล้ว`, 'success');
    };

    return (
        <div className="space-y-6">
            {/* 1. Executive Commercial KPI Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-semibold text-slate-500">
                        องค์กรลูกค้าทั้งหมด (Total Tenants)
                    </p>
                    <div className="flex items-baseline gap-2 mt-1">
                        <p className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                            {allPlatformOrganizations.length}
                        </p>
                        <span className="text-xs font-semibold text-slate-500">บริษัท</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1.5">
                        ใช้งานปกติ {metrics.activeCount} · ทดลองใช้ {metrics.trialCount} · รอรับสิทธิ์{' '}
                        {metrics.unclaimedCount}
                    </p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-semibold text-slate-500">
                        รายได้รายเดือนประเมิน (Est. MRR / ARR)
                    </p>
                    <p className="text-2xl font-bold font-mono tabular-nums text-indigo-600 mt-1">
                        ฿{metrics.mrr.toLocaleString()}
                        <span className="text-xs font-semibold text-slate-400 ml-1">/ เดือน</span>
                    </p>
                    <p className="text-xs text-slate-500 mt-1.5 font-mono tabular-nums">
                        รายปีประเมิน: ฿{metrics.arr.toLocaleString()} / ปี
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => {
                        setExpiryFilter(prev =>
                            prev === 'EXPIRING_7D' ? 'ALL' : 'EXPIRING_7D'
                        );
                        setCurrentPage(1);
                    }}
                    className={`text-left p-5 rounded-2xl border shadow-sm transition-all ${
                        expiryFilter === 'EXPIRING_7D' || expiryFilter === 'EXPIRED_OR_GRACE'
                            ? 'bg-amber-50/90 border-amber-300 ring-2 ring-amber-200'
                            : 'bg-white border-slate-200 hover:border-amber-300'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-slate-500">
                            ใกล้หมดอายุใน 7 วัน / ผ่อนผัน
                        </p>
                        <Clock className="w-4 h-4 text-amber-600" />
                    </div>
                    <div className="flex items-baseline gap-2 mt-1">
                        <p className="text-2xl font-bold font-mono tabular-nums text-amber-600">
                            {metrics.expiring7dCount + metrics.graceOrExpiredCount}
                        </p>
                        <span className="text-xs font-semibold text-slate-500">บริษัท</span>
                    </div>
                    <p className="text-xs text-indigo-600 font-semibold mt-1.5">
                        {expiryFilter === 'EXPIRING_7D'
                            ? 'กำลังกรองเฉพาะใกล้หมดอายุ (คลิกเพื่อล้าง)'
                            : `ใกล้หมด 7 วัน (${metrics.expiring7dCount}) · ผ่อนผัน/หมดอายุ (${metrics.graceOrExpiredCount})`}
                    </p>
                </button>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div>
                        <p className="text-xs font-semibold text-slate-500">
                            บิลรอตรวจสอบ / แจ้งโอนต่ออายุ
                        </p>
                        <div className="flex items-baseline gap-2 mt-1">
                            <p className="text-2xl font-bold font-mono tabular-nums text-emerald-600">
                                {pendingInvoicesCount}
                            </p>
                            <span className="text-xs font-semibold text-slate-500">รายการค้างอนุมัติ</span>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onGoToBillingTab}
                        className="text-xs font-bold text-indigo-600 hover:underline mt-1.5 text-left"
                    >
                        เปิดหน้าตรวจสอบบิลและอนุมัติต่ออายุ →
                    </button>
                </div>
            </div>

            {/* 2. Enterprise Data Grid Card */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Filter & Search Toolbar */}
                <div className="p-5 sm:p-6 border-b border-slate-100 space-y-4">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div>
                            <h3 className="font-bold text-slate-900 text-base">
                                ทะเบียนองค์กรลูกค้าทั้งหมด (Enterprise Tenant Directory)
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                                แสดงผล {filteredAndSorted.length} จาก {allPlatformOrganizations.length} บริษัท ·
                                กดปุ่ม &ldquo;เข้าดูบ้านลูกค้า&rdquo; เพื่อสลับเข้าไปตรวจสอบหรือตั้งค่าให้ลูกค้ารายบริษัท
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            {/* View Mode Switcher */}
                            <div className="flex items-center p-1 bg-slate-100 rounded-xl">
                                <button
                                    type="button"
                                    onClick={() => setViewMode('TABLE')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                                        viewMode === 'TABLE'
                                            ? 'bg-white text-slate-900 shadow-sm'
                                            : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                >
                                    <TableIcon className="w-3.5 h-3.5" /> ตาราง (Data Grid)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setViewMode('CARDS')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                                        viewMode === 'CARDS'
                                            ? 'bg-white text-slate-900 shadow-sm'
                                            : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                >
                                    <LayoutGrid className="w-3.5 h-3.5" /> การ์ด
                                </button>
                            </div>

                            <button
                                type="button"
                                onClick={onOpenProvisionModal}
                                className="px-4 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
                            >
                                <Plus className="w-4 h-4" /> เปิดองค์กรลูกค้าใหม่
                            </button>
                        </div>
                    </div>

                    {/* Search + Faceted Filters */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                        <div className="relative md:col-span-5">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => {
                                    setSearchQuery(e.target.value);
                                    setCurrentPage(1);
                                }}
                                placeholder="ค้นหาชื่อบริษัท, Slug, Invite Code, Claim Token, อีเมล..."
                                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>

                        <div className="md:col-span-3">
                            <select
                                value={expiryFilter}
                                onChange={e => {
                                    setExpiryFilter(e.target.value as ExpiryHorizonFilter);
                                    setCurrentPage(1);
                                }}
                                className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="ALL">ช่วงวันหมดอายุ: ทั้งหมด</option>
                                <option value="EXPIRING_7D">ใกล้หมดอายุใน 7 วัน ({metrics.expiring7dCount})</option>
                                <option value="EXPIRING_30D">ใกล้หมดอายุใน 30 วัน</option>
                                <option value="EXPIRED_OR_GRACE">
                                    ผ่อนผัน / หมดอายุแล้ว ({metrics.graceOrExpiredCount})
                                </option>
                                <option value="UNCLAIMED">
                                    รอเจ้าของกดรับสิทธิ์ ({metrics.unclaimedCount})
                                </option>
                            </select>
                        </div>

                        <div className="md:col-span-2">
                            <select
                                value={planFilter}
                                onChange={e => {
                                    setPlanFilter(e.target.value as 'ALL' | PlanTier);
                                    setCurrentPage(1);
                                }}
                                className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="ALL">ทุกแพ็กเกจ (All Plans)</option>
                                <option value="STARTER">STARTER</option>
                                <option value="PRO">PRO</option>
                                <option value="ENTERPRISE">ENTERPRISE</option>
                                <option value="LIFETIME">LIFETIME</option>
                            </select>
                        </div>

                        <div className="md:col-span-2">
                            <select
                                value={statusFilter}
                                onChange={e => {
                                    setStatusFilter(e.target.value as 'ALL' | SubscriptionStatus);
                                    setCurrentPage(1);
                                }}
                                className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="ALL">ทุกสถานะ (All Status)</option>
                                <option value="ACTIVE">ACTIVE</option>
                                <option value="TRIAL">TRIAL</option>
                                <option value="GRACE_PERIOD">GRACE_PERIOD</option>
                                <option value="EXPIRED">EXPIRED</option>
                                <option value="SUSPENDED">SUSPENDED</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Empty Filter State */}
                {paginatedItems.length === 0 ? (
                    <div className="p-12 text-center space-y-3">
                        <ListFilter className="w-8 h-8 text-slate-400 mx-auto" />
                        <p className="text-sm font-bold text-slate-700">
                            ไม่พบองค์กรลูกค้าที่ตรงกับเงื่อนไขการค้นหา
                        </p>
                        <button
                            type="button"
                            onClick={() => {
                                setSearchQuery('');
                                setPlanFilter('ALL');
                                setStatusFilter('ALL');
                                setExpiryFilter('ALL');
                                setCurrentPage(1);
                            }}
                            className="px-4 py-2 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors"
                        >
                            ล้างตัวกรองทั้งหมด
                        </button>
                    </div>
                ) : viewMode === 'TABLE' ? (
                    /* High-Density Table View for 100+ Customers */
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                    <th className="py-3.5 pl-6 pr-3">
                                        <button
                                            type="button"
                                            onClick={() => handleToggleSort('NAME')}
                                            className="flex items-center gap-1 hover:text-slate-900"
                                        >
                                            บริษัทลูกค้า (Tenant)
                                            <ArrowUpDown className="w-3.5 h-3.5" />
                                        </button>
                                    </th>
                                    <th className="py-3.5 px-3">
                                        <button
                                            type="button"
                                            onClick={() => handleToggleSort('PLAN')}
                                            className="flex items-center gap-1 hover:text-slate-900"
                                        >
                                            แพ็กเกจ & สถานะ
                                            <ArrowUpDown className="w-3.5 h-3.5" />
                                        </button>
                                    </th>
                                    <th className="py-3.5 px-3">
                                        <button
                                            type="button"
                                            onClick={() => handleToggleSort('EXPIRY')}
                                            className="flex items-center gap-1 hover:text-slate-900"
                                        >
                                            วันหมดอายุ / คงเหลือ
                                            <ArrowUpDown className="w-3.5 h-3.5" />
                                        </button>
                                    </th>
                                    <th className="py-3.5 px-3">
                                        <button
                                            type="button"
                                            onClick={() => handleToggleSort('QUOTA')}
                                            className="flex items-center gap-1 hover:text-slate-900"
                                        >
                                            โควตา & โมดูล
                                            <ArrowUpDown className="w-3.5 h-3.5" />
                                        </button>
                                    </th>
                                    <th className="py-3.5 px-3">รหัสเชิญ & Owner Claim</th>
                                    <th className="py-3.5 pl-3 pr-6 text-right">การจัดการ (Actions)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs">
                                {paginatedItems.map(({ org, tier, computedStatus, daysUntilExpiry }) => {
                                    const isSelected = org.id === currentOrg.id;
                                    const moduleCount = org.allowedModules
                                        ? org.allowedModules.length
                                        : ALL_AVAILABLE_MODULES.length;

                                    const isExpiringSoon =
                                        daysUntilExpiry !== null &&
                                        daysUntilExpiry >= 0 &&
                                        daysUntilExpiry <= 7;

                                    return (
                                        <tr
                                            key={org.id}
                                            className={`transition-colors ${
                                                isSelected
                                                    ? 'bg-indigo-50/40 hover:bg-indigo-50/70'
                                                    : 'hover:bg-slate-50/80'
                                            }`}
                                        >
                                            {/* Column 1: Organization Identity */}
                                            <td className="py-4 pl-6 pr-3 align-middle">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs shrink-0">
                                                        {org.name.slice(0, 2).toUpperCase()}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold text-slate-900 text-sm truncate max-w-[220px]">
                                                                {org.name}
                                                            </span>
                                                            {isSelected && (
                                                                <span className="text-[11px] font-semibold text-indigo-600">
                                                                    · เลือกอยู่
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-[11px] text-slate-500 font-mono truncate max-w-[240px]">
                                                            slug: {org.slug}
                                                            {org.billingEmail ? ` · ${org.billingEmail}` : ''}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Column 2: Plan & Subscription Status */}
                                            <td className="py-4 px-3 align-middle">
                                                <div className="flex flex-wrap items-center gap-1.5">
                                                    <span
                                                        className={`px-2 py-0.5 text-[11px] font-bold rounded-md border ${PLAN_BADGE_STYLE[tier]}`}
                                                    >
                                                        {tier}
                                                    </span>
                                                    <span
                                                        className={`px-2 py-0.5 text-[11px] font-bold rounded-md border ${STATUS_BADGE_STYLE[computedStatus]}`}
                                                    >
                                                        {computedStatus}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Column 3: Expiry Date & Countdown */}
                                            <td className="py-4 px-3 align-middle font-mono tabular-nums">
                                                {org.expiresAt ? (
                                                    <div>
                                                        <div className="font-bold text-slate-800">
                                                            {new Date(org.expiresAt).toLocaleDateString('th-TH', {
                                                                day: '2-digit',
                                                                month: 'short',
                                                                year: '2-digit'
                                                            })}
                                                        </div>
                                                        <div
                                                            className={`text-[11px] font-semibold flex items-center gap-1 ${
                                                                daysUntilExpiry !== null && daysUntilExpiry < 0
                                                                    ? 'text-rose-600'
                                                                    : isExpiringSoon
                                                                    ? 'text-amber-600'
                                                                    : 'text-slate-500'
                                                            }`}
                                                        >
                                                            {isExpiringSoon && (
                                                                <AlertTriangle className="w-3 h-3 shrink-0" />
                                                            )}
                                                            {daysUntilExpiry !== null
                                                                ? daysUntilExpiry >= 0
                                                                    ? `เหลืออีก ${daysUntilExpiry} วัน`
                                                                    : `เกินกำหนด ${Math.abs(daysUntilExpiry)} วัน`
                                                                : '-'}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-500 font-sans">
                                                        ไม่จำกัดวันหมดอายุ
                                                    </span>
                                                )}
                                            </td>

                                            {/* Column 4: Quota & Modules */}
                                            <td className="py-4 px-3 align-middle">
                                                <div className="font-mono tabular-nums font-semibold text-slate-800">
                                                    สูงสุด {org.maxMembers || 50} คน
                                                </div>
                                                <div className="text-[11px] text-slate-500">
                                                    เปิดใช้ {moduleCount}/{ALL_AVAILABLE_MODULES.length} โมดูล
                                                </div>
                                            </td>

                                            {/* Column 5: Invite Code & Claim Token */}
                                            <td className="py-4 px-3 align-middle">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-[11px] text-slate-500">Invite:</span>
                                                        <span className="font-mono font-bold text-slate-800">
                                                            {org.inviteCode}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleCopyText(org.inviteCode, 'Invite Code')
                                                            }
                                                            className="text-slate-400 hover:text-indigo-600 p-0.5"
                                                            title="คัดลอกรหัสเชิญ"
                                                        >
                                                            <Copy className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                    {org.ownerId ? (
                                                        <div className="text-[11px] text-emerald-700 font-semibold">
                                                            มีเจ้าของรับสิทธิ์แล้ว
                                                        </div>
                                                    ) : org.ownerClaimToken ? (
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-[11px] text-amber-700 font-mono font-bold">
                                                                {org.ownerClaimToken}
                                                            </span>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleCopyText(
                                                                        `${window.location.origin}/?claim_org=${encodeURIComponent(
                                                                            org.ownerClaimToken!
                                                                        )}`,
                                                                        'ลิงก์รับสิทธิ์ Owner'
                                                                    )
                                                                }
                                                                className="text-amber-600 hover:text-amber-800 p-0.5"
                                                                title="คัดลอกลิงก์รับสิทธิ์ Owner"
                                                            >
                                                                <Copy className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-[11px] text-slate-400">
                                                            ยังไม่ระบุ Owner
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Column 6: Quick Row Actions */}
                                            <td className="py-4 pl-3 pr-6 align-middle text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => onEnterCustomerWorkspace(org.id)}
                                                        className="px-3 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-colors inline-flex items-center gap-1.5 whitespace-nowrap"
                                                        title="สลับเข้าดูหน้าจอใช้งานของบริษัทลูกค้านี้"
                                                    >
                                                        <ExternalLink className="w-3.5 h-3.5" />
                                                        เข้าดูบ้านลูกค้า
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => onOpenEditLicenseModal(org)}
                                                        className="px-2.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-colors inline-flex items-center gap-1 whitespace-nowrap"
                                                        title="ปรับแพ็กเกจ โควตา และเปิด/ปิดโมดูล"
                                                    >
                                                        <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                                                        แพ็กเกจ
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => onOpenHandoverModal(org)}
                                                        className="px-2.5 py-2 text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 hover:bg-amber-100 rounded-xl transition-colors inline-flex items-center gap-1 whitespace-nowrap"
                                                        title="ส่งมอบสิทธิ์ Owner หรือจัดการลิงก์รับสิทธิ์"
                                                    >
                                                        <UserPlus className="w-3.5 h-3.5" />
                                                        Owner
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    /* Optional Card Grid View */
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {paginatedItems.map(({ org, tier, computedStatus, daysUntilExpiry }) => {
                            const isSelected = org.id === currentOrg.id;
                            const moduleCount = org.allowedModules
                                ? org.allowedModules.length
                                : ALL_AVAILABLE_MODULES.length;

                            return (
                                <div
                                    key={org.id}
                                    className={`p-5 rounded-2xl border transition-all flex flex-col justify-between gap-4 ${
                                        isSelected
                                            ? 'border-indigo-500 bg-indigo-50/30'
                                            : 'border-slate-200 bg-white hover:border-slate-300'
                                    }`}
                                >
                                    <div className="space-y-2">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs shrink-0">
                                                    <Building2 className="w-4 h-4" />
                                                </div>
                                                <div className="min-w-0">
                                                    <h4 className="font-bold text-slate-900 text-sm truncate">
                                                        {org.name}
                                                    </h4>
                                                    <p className="text-[11px] text-slate-500 font-mono truncate">
                                                        {org.slug} · Invite: {org.inviteCode}
                                                    </p>
                                                </div>
                                            </div>
                                            <span
                                                className={`px-2 py-0.5 text-[10px] font-bold rounded-md border shrink-0 ${PLAN_BADGE_STYLE[tier]}`}
                                            >
                                                {tier}
                                            </span>
                                        </div>

                                        <div className="text-xs text-slate-600 space-y-1 pt-1">
                                            <div className="flex items-center justify-between">
                                                <span>สถานะ:</span>
                                                <span className="font-bold text-slate-900">
                                                    {computedStatus}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between font-mono tabular-nums">
                                                <span>วันหมดอายุ:</span>
                                                <span>
                                                    {org.expiresAt
                                                        ? `${new Date(org.expiresAt).toLocaleDateString('th-TH')} (${
                                                              daysUntilExpiry ?? 0
                                                          } วัน)`
                                                        : 'ไม่จำกัด'}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between font-mono tabular-nums">
                                                <span>โควตา / โมดูล:</span>
                                                <span>
                                                    {org.maxMembers || 50} คน · {moduleCount} โมดูล
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100">
                                        <button
                                            type="button"
                                            onClick={() => onEnterCustomerWorkspace(org.id)}
                                            className="flex-1 px-3 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                                        >
                                            <ExternalLink className="w-3.5 h-3.5" /> เข้าดูบ้านลูกค้า
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => onOpenEditLicenseModal(org)}
                                            className="px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                                        >
                                            แพ็กเกจ
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => onOpenHandoverModal(org)}
                                            className="px-3 py-2 text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-colors"
                                        >
                                            Owner
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Pagination Footer */}
                <div className="px-6 py-4 bg-slate-50/70 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 text-xs text-slate-600">
                        <span>
                            แสดงแถวที่{' '}
                            <strong className="font-mono tabular-nums text-slate-900">
                                {filteredAndSorted.length === 0 ? 0 : (safePage - 1) * pageSize + 1}
                            </strong>{' '}
                            ถึง{' '}
                            <strong className="font-mono tabular-nums text-slate-900">
                                {Math.min(safePage * pageSize, filteredAndSorted.length)}
                            </strong>{' '}
                            จากทั้งหมด{' '}
                            <strong className="font-mono tabular-nums text-slate-900">
                                {filteredAndSorted.length}
                            </strong>{' '}
                            บริษัท
                        </span>

                        <select
                            value={pageSize}
                            onChange={e => {
                                setPageSize(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                            className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 bg-white text-slate-700"
                        >
                            <option value={15}>15 / หน้า</option>
                            <option value={30}>30 / หน้า</option>
                            <option value={50}>50 / หน้า</option>
                            <option value={100}>100 / หน้า</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            disabled={safePage <= 1}
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1"
                        >
                            <ChevronLeft className="w-3.5 h-3.5" /> ก่อนหน้า
                        </button>
                        <span className="px-3 py-1.5 text-xs font-bold font-mono tabular-nums text-slate-700">
                            หน้า {safePage} / {totalPages}
                        </span>
                        <button
                            type="button"
                            disabled={safePage >= totalPages}
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1"
                        >
                            ถัดไป <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
