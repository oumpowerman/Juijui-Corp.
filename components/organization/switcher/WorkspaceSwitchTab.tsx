import React from 'react';
import { Check, Clock, Copy, Link2 } from 'lucide-react';
import { useOrganization } from '../../../context/OrganizationContext';
import { useToast } from '../../../context/ToastContext';

interface WorkspaceSwitchTabProps {
    activeMemberCount: number;
    maxMemberQuota: number;
}

export const WorkspaceSwitchTab: React.FC<WorkspaceSwitchTabProps> = ({
    activeMemberCount,
    maxMemberQuota
}) => {
    const {
        isSuperAdmin,
        currentOrg,
        myOrganizations,
        myMemberships,
        switchOrganization,
        closeSwitcherModal,
        setActiveModalTab
    } = useOrganization();

    const { showToast } = useToast();

    const handleCopyInviteCode = (code: string) => {
        navigator.clipboard.writeText(code);
        showToast(`คัดลอกรหัสเชิญ ${code} แล้ว`, 'success');
    };

    const handleCopyInviteLink = (code: string) => {
        const url = `${window.location.origin}/?join_org=${encodeURIComponent(code)}`;
        navigator.clipboard.writeText(url);
        showToast('คัดลอกลิงก์เชิญเข้าสู่องค์กรแล้ว', 'success');
    };

    return (
        <div className="space-y-4">
            {/* Active Workspace Invite Card */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
                <div className="flex items-center justify-between gap-2">
                    <div>
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                            รหัสเชิญเข้าทีมปัจจุบัน · โควตา{' '}
                            <span className="font-mono tabular-nums font-bold text-slate-700 dark:text-slate-200">
                                {activeMemberCount}/{maxMemberQuota}
                            </span>{' '}
                            คน
                        </p>
                        <p className="text-lg font-bold font-mono tabular-nums text-indigo-600 dark:text-indigo-400 tracking-wider mt-0.5">
                            {currentOrg.inviteCode}
                        </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            onClick={() => handleCopyInviteCode(currentOrg.inviteCode)}
                            className="px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-indigo-300 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
                        >
                            <Copy className="w-3.5 h-3.5" /> คัดลอกรหัส
                        </button>
                        <button
                            type="button"
                            onClick={() => handleCopyInviteLink(currentOrg.inviteCode)}
                            className="px-3 py-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 rounded-xl hover:bg-indigo-100 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
                        >
                            <Link2 className="w-3.5 h-3.5" /> ลิงก์เชิญ
                        </button>
                    </div>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    ส่งรหัสหรือลิงก์นี้ให้พนักงานในบริษัทเพื่อขอเข้าทีม (ต้องได้รับการอนุมัติจาก Admin ภายใต้โควตาแพ็กเกจ)
                </p>
            </div>

            {/* List of My Workspaces */}
            <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                        {isSuperAdmin
                            ? `องค์กรทั้งหมดในแพลตฟอร์ม (${myOrganizations.length})`
                            : `องค์กรที่คุณสังกัดอยู่ (${myOrganizations.length})`}
                    </p>
                    {isSuperAdmin && (
                        <button
                            type="button"
                            onClick={() => setActiveModalTab('CLAIM')}
                            className="text-xs font-semibold text-indigo-600 hover:underline"
                        >
                            ใช้รหัสรับมอบองค์กร
                        </button>
                    )}
                </div>

                {myOrganizations.map(org => {
                    const isCurrent = org.id === currentOrg.id;
                    const mem = myMemberships.find(m => m.orgId === org.id);
                    const status = isSuperAdmin ? 'ACTIVE' : (mem?.status || 'ACTIVE');
                    const role = isSuperAdmin ? 'SUPER ADMIN' : (mem?.role || 'MEMBER');

                    return (
                        <div
                            key={org.id}
                            onClick={() => {
                                if (!isCurrent && status === 'ACTIVE') {
                                    switchOrganization(org.id);
                                    closeSwitcherModal();
                                }
                            }}
                            className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                                isCurrent
                                    ? 'bg-indigo-50/60 dark:bg-indigo-950/40 border-indigo-400 dark:border-indigo-500 shadow-sm'
                                    : status === 'ACTIVE'
                                    ? 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 hover:border-indigo-300 cursor-pointer'
                                    : 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 opacity-80'
                            }`}
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <div
                                    className={`w-10 h-10 rounded-xl border flex items-center justify-center font-bold text-sm shrink-0 ${
                                        org.color || 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                    }`}
                                >
                                    {org.name.slice(0, 2).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                                            {org.name}
                                        </h4>
                                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium shrink-0">
                                            · {org.planTier || 'PRO'} · {role}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5 font-mono tabular-nums">
                                        Invite: {org.inviteCode} · สมาชิก {org.memberCount ?? 1}/{org.maxMembers ?? 100} คน
                                    </p>
                                </div>
                            </div>

                            <div className="shrink-0 flex items-center gap-2">
                                {status === 'PENDING' ? (
                                    <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                        <Clock className="w-3.5 h-3.5" /> รออนุมัติ
                                    </span>
                                ) : isCurrent ? (
                                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                        <Check className="w-4 h-4" /> กำลังใช้งาน
                                    </span>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={e => {
                                            e.stopPropagation();
                                            switchOrganization(org.id);
                                            closeSwitcherModal();
                                        }}
                                        className="px-3 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors whitespace-nowrap shrink-0"
                                    >
                                        สลับไปที่นี่
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
