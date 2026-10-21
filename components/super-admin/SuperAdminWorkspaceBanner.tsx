import React from 'react';
import { ArrowLeft, Building2, Crown, ShieldCheck } from 'lucide-react';
import { useOrganization } from '../../context/OrganizationContext';

export const SuperAdminWorkspaceBanner: React.FC = () => {
    const {
        isSuperAdmin,
        isInSuperAdminPortal,
        currentOrg,
        allPlatformOrganizations,
        computedSubscriptionStatus,
        daysUntilExpiry,
        switchOrganization,
        returnToSuperAdminPortal
    } = useOrganization();

    if (!isSuperAdmin || isInSuperAdminPortal) {
        return null;
    }

    return (
        <div className="sticky top-0 z-[85] w-full bg-slate-900 text-white border-b border-slate-800 px-3 sm:px-6 py-2 shadow-md">
            <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2.5 min-w-0">
                    <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold shrink-0">
                        <Crown className="w-4 h-4" />
                        <span>SUPER ADMIN INSPECTION</span>
                    </div>
                    <span className="text-slate-600 hidden sm:inline">·</span>
                    <div className="flex items-center gap-2 text-xs min-w-0">
                        <span className="text-slate-300 shrink-0">กำลังเข้าดูบ้านลูกค้า:</span>
                        <span className="font-bold text-white truncate max-w-[200px]">
                            {currentOrg.name}
                        </span>
                        <span className="text-slate-400 font-mono text-[11px] shrink-0">
                            ({currentOrg.planTier || 'PRO'} · {computedSubscriptionStatus}
                            {daysUntilExpiry !== null ? ` · เหลือ ${daysUntilExpiry} วัน` : ''})
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    {/* Quick Tenant Jump Selector */}
                    {allPlatformOrganizations.length > 1 && (
                        <div className="relative flex items-center">
                            <Building2 className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
                            <select
                                value={currentOrg.id}
                                onChange={e => switchOrganization(e.target.value)}
                                className="pl-8 pr-6 py-1.5 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 max-w-[210px] truncate"
                                title="สลับไปดูบริษัทลูกค้าอื่นทันที"
                            >
                                {allPlatformOrganizations.map(org => (
                                    <option key={org.id} value={org.id}>
                                        {org.name} ({org.planTier || 'PRO'})
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={returnToSuperAdminPortal}
                        className="px-3.5 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-sm transition-colors flex items-center gap-1.5 whitespace-nowrap"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        กลับศูนย์ควบคุมแพลตฟอร์ม ({allPlatformOrganizations.length} บริษัท)
                    </button>
                </div>
            </div>
        </div>
    );
};
