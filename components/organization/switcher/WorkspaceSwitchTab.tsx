import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    ArrowRight,
    Award,
    Check,
    Clock,
    Copy,
    Crown,
    Link2,
    Sparkles,
    Users
} from 'lucide-react';
import { useOrganization } from '../../../context/OrganizationContext';
import { useToast } from '../../../context/ToastContext';
import {
    staggerContainerVariants,
    staggerItemVariants
} from './workspaceSwitcherConstants';

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
    const [copiedMode, setCopiedMode] = useState<'CODE' | 'LINK' | null>(null);

    const quotaPercent = Math.min(
        100,
        Math.round((activeMemberCount / Math.max(1, maxMemberQuota)) * 100)
    );

    const quotaBarColor =
        quotaPercent >= 90
            ? 'from-rose-500 to-orange-500'
            : quotaPercent >= 75
            ? 'from-amber-500 to-orange-400'
            : 'from-indigo-500 via-violet-500 to-emerald-500';

    const handleCopyInviteCode = (code: string) => {
        navigator.clipboard.writeText(code);
        setCopiedMode('CODE');
        showToast(`คัดลอกรหัสเชิญ ${code} แล้ว`, 'success');
        setTimeout(() => setCopiedMode(prev => (prev === 'CODE' ? null : prev)), 2000);
    };

    const handleCopyInviteLink = (code: string) => {
        const url = `${window.location.origin}/?join_org=${encodeURIComponent(code)}`;
        navigator.clipboard.writeText(url);
        setCopiedMode('LINK');
        showToast('คัดลอกลิงก์เชิญเข้าสู่องค์กรแล้ว', 'success');
        setTimeout(() => setCopiedMode(prev => (prev === 'LINK' ? null : prev)), 2000);
    };

    return (
        <motion.div
            variants={staggerContainerVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="space-y-4"
        >
            {/* Active Workspace PassCard */}
            <motion.div
                variants={staggerItemVariants}
                className="relative p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-indigo-50/70 via-white to-violet-50/50 border border-indigo-100/90 shadow-xs space-y-3.5 overflow-hidden"
            >
                <div className="pointer-events-none absolute -right-10 -top-10 w-32 h-32 rounded-full bg-indigo-400/10 blur-2xl" />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-100/80 px-2 py-0.5 rounded-md">
                                รหัสเชิญเข้าทีมปัจจุบัน
                            </span>
                            <span className="text-xs font-semibold text-slate-500">
                                โควตาสมาชิก{' '}
                                <span className="font-mono tabular-nums font-bold text-slate-800">
                                    {activeMemberCount}/{maxMemberQuota}
                                </span>{' '}
                                คน
                            </span>
                        </div>

                        <div className="flex items-baseline gap-2 mt-1.5">
                            <p className="text-xl font-bold font-mono tabular-nums text-indigo-700 tracking-wider select-all">
                                {currentOrg.inviteCode}
                            </p>
                            <span className="text-[11px] font-medium text-slate-400">
                                (Staff Invite Code)
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <motion.button
                            type="button"
                            whileHover={{ y: -1 }}
                            whileTap={{ scale: 0.96 }}
                            onClick={() => handleCopyInviteCode(currentOrg.inviteCode)}
                            className={`px-3 py-2 text-xs font-bold rounded-xl border transition-all flex items-center gap-1.5 whitespace-nowrap shadow-2xs ${
                                copiedMode === 'CODE'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                    : 'bg-white text-slate-700 border-slate-200/90 hover:border-indigo-300 hover:text-indigo-700'
                            }`}
                        >
                            {copiedMode === 'CODE' ? (
                                <>
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>คัดลอกแล้ว</span>
                                </>
                            ) : (
                                <>
                                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                                    <span>คัดลอกรหัส</span>
                                </>
                            )}
                        </motion.button>

                        <motion.button
                            type="button"
                            whileHover={{ y: -1 }}
                            whileTap={{ scale: 0.96 }}
                            onClick={() => handleCopyInviteLink(currentOrg.inviteCode)}
                            className={`px-3 py-2 text-xs font-bold rounded-xl border transition-all flex items-center gap-1.5 whitespace-nowrap shadow-2xs ${
                                copiedMode === 'LINK'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                    : 'bg-indigo-50/90 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                            }`}
                        >
                            {copiedMode === 'LINK' ? (
                                <>
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>คัดลอกลิงก์แล้ว</span>
                                </>
                            ) : (
                                <>
                                    <Link2 className="w-3.5 h-3.5" />
                                    <span>ลิงก์เชิญ</span>
                                </>
                            )}
                        </motion.button>
                    </div>
                </div>

                {/* Animated Member Seat Utilization Bar */}
                <div className="space-y-1.5 relative z-10">
                    <div className="h-2 w-full rounded-full bg-slate-200/70 overflow-hidden p-0.5">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${ Math.max(4, quotaPercent) }%` }}
                            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] as const }}
                            className={`h-full rounded-full bg-gradient-to-r ${quotaBarColor}`}
                        />
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2.5 border-t border-indigo-100/80 relative z-10">
                    <p className="text-[11px] font-medium text-slate-500">
                        ส่งรหัสหรือลิงก์เชิญนี้ให้พนักงานในบริษัทเพื่อส่งคำขอเข้าร่วมทีม
                    </p>
                    <motion.button
                        type="button"
                        whileHover={{ scale: 1.02, y: -1 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => {
                            closeSwitcherModal();
                            window.dispatchEvent(new CustomEvent('open-saas-billing-modal'));
                        }}
                        className="px-3.5 py-2 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 rounded-xl shadow-sm shadow-indigo-500/20 transition-all flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"
                    >
                        <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
                        <span>อัปเกรด / ต่ออายุแพ็กเกจ</span>
                    </motion.button>
                </div>
            </motion.div>

            {/* List of My Workspaces */}
            <motion.div variants={staggerItemVariants} className="space-y-2.5">
                <div className="flex items-center justify-between px-0.5">
                    <p className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-indigo-500" />
                        <span>
                            {isSuperAdmin
                                ? `องค์กรทั้งหมดในแพลตฟอร์ม (${myOrganizations.length})`
                                : `องค์กรที่คุณสังกัดอยู่ (${myOrganizations.length})`}
                        </span>
                    </p>
                    {isSuperAdmin && (
                        <button
                            type="button"
                            onClick={() => setActiveModalTab('CLAIM')}
                            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 hover:underline"
                        >
                            <Award className="w-3.5 h-3.5" />
                            <span>ใช้รหัสรับมอบองค์กร</span>
                        </button>
                    )}
                </div>

                <div className="space-y-2.5">
                    {myOrganizations.map(org => {
                        const isCurrent = org.id === currentOrg.id;
                        const mem = myMemberships.find(m => m.orgId === org.id);
                        const status = isSuperAdmin ? 'ACTIVE' : (mem?.status || 'ACTIVE');
                        const role = isSuperAdmin ? 'SUPER ADMIN' : (mem?.role || 'MEMBER');
                        const canSwitch = !isCurrent && status === 'ACTIVE';

                        return (
                            <motion.div
                                key={org.id}
                                variants={staggerItemVariants}
                                whileHover={canSwitch ? { y: -2, scale: 1.005 } : undefined}
                                whileTap={canSwitch ? { scale: 0.995 } : undefined}
                                onClick={() => {
                                    if (canSwitch) {
                                        switchOrganization(org.id);
                                        closeSwitcherModal();
                                    }
                                }}
                                className={`group relative p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 overflow-hidden ${
                                    isCurrent
                                        ? 'bg-gradient-to-r from-indigo-50/80 via-white to-violet-50/40 border-indigo-400 ring-2 ring-indigo-500/15 shadow-sm'
                                        : status === 'ACTIVE'
                                        ? 'bg-white border-slate-200/90 hover:border-indigo-300 hover:shadow-md hover:shadow-indigo-500/5 cursor-pointer'
                                        : 'bg-amber-50/40 border-amber-200 opacity-85'
                                }`}
                            >
                                {/* Left highlight bar for active organization */}
                                {isCurrent && (
                                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-indigo-500 to-violet-600" />
                                )}

                                <div className="flex items-center gap-3.5 min-w-0">
                                    <div
                                        className={`w-11 h-11 rounded-2xl border flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs transition-transform group-hover:scale-105 ${
                                            org.color || 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                        }`}
                                    >
                                        {org.name.slice(0, 2).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-1.5">
                                            <h4 className="font-bold text-sm text-slate-900 truncate max-w-[180px] sm:max-w-[240px]">
                                                {org.name}
                                            </h4>
                                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200/70 shrink-0">
                                                <Crown className="w-2.5 h-2.5 text-amber-500" />
                                                {org.planTier || 'PRO'}
                                            </span>
                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 shrink-0">
                                                {role}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500 truncate mt-1 font-mono tabular-nums">
                                            Invite: <span className="font-semibold text-slate-700">{org.inviteCode}</span> · สมาชิก{' '}
                                            <span className="font-semibold text-slate-700">
                                                {org.memberCount ?? 1}/{org.maxMembers ?? 100}
                                            </span>{' '}
                                            คน
                                        </p>
                                    </div>
                                </div>

                                <div className="shrink-0 flex items-center gap-2">
                                    {status === 'PENDING' ? (
                                        <span className="px-2.5 py-1 rounded-full text-xs font-bold text-amber-700 bg-amber-100/80 border border-amber-200 flex items-center gap-1">
                                            <Clock className="w-3.5 h-3.5" /> รออนุมัติ
                                        </span>
                                    ) : isCurrent ? (
                                        <span className="px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 flex items-center gap-1.5 shadow-2xs">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                            <Check className="w-3.5 h-3.5" />
                                            <span>กำลังใช้งาน</span>
                                        </span>
                                    ) : (
                                        <motion.button
                                            type="button"
                                            whileHover={{ scale: 1.03 }}
                                            whileTap={{ scale: 0.96 }}
                                            onClick={e => {
                                                e.stopPropagation();
                                                switchOrganization(org.id);
                                                closeSwitcherModal();
                                            }}
                                            className="px-3.5 py-2 text-xs font-bold text-indigo-600 bg-indigo-50/90 hover:bg-indigo-600 hover:text-white border border-indigo-200/80 hover:border-indigo-600 rounded-xl transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 shadow-2xs"
                                        >
                                            <span>สลับไปที่นี่</span>
                                            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                                        </motion.button>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </motion.div>
        </motion.div>
    );
};

