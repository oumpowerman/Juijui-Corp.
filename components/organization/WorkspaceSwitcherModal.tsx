import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import {
    Building2,
    Check,
    Copy,
    KeyRound,
    Link2,
    Plus,
    RefreshCw,
    ShieldCheck,
    UserCheck,
    UserPlus,
    Users,
    X,
    Clock,
    Sparkles,
    Crown
} from 'lucide-react';
import { useOrganization } from '../../context/OrganizationContext';
import { useToast } from '../../context/ToastContext';
import { SAAS_PLAN_PRESETS } from '../../lib/multiTenantMigrationSql';
import { PlanTier } from '../../types';

const WORKSPACE_COLOR_PRESETS = [
    { label: 'Indigo', value: 'bg-indigo-50 text-indigo-700 border-indigo-200', dot: 'bg-indigo-600' },
    { label: 'Emerald', value: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-600' },
    { label: 'Rose', value: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-600' },
    { label: 'Amber', value: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-600' },
    { label: 'Sky', value: 'bg-sky-50 text-sky-700 border-sky-200', dot: 'bg-sky-600' },
    { label: 'Violet', value: 'bg-violet-50 text-violet-700 border-violet-200', dot: 'bg-violet-600' }
];

const modalVariants: Variants = {
    hidden: { opacity: 0, y: 24, scale: 0.98 },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] as const }
    },
    exit: {
        opacity: 0,
        y: 16,
        scale: 0.98,
        transition: { duration: 0.16, ease: [0.16, 1, 0.3, 1] as const }
    }
};

export const WorkspaceSwitcherModal: React.FC = () => {
    const {
        isSwitcherOpen,
        closeSwitcherModal,
        activeModalTab,
        setActiveModalTab,
        isSuperAdmin,
        currentOrg,
        myOrganizations,
        myMemberships,
        currentOrgMembers,
        pendingJoinRequests,
        isOrgAdmin,
        pendingInviteCodeFromUrl,
        pendingClaimTokenFromUrl,
        switchOrganization,
        createOrganization,
        claimOrganizationOwnership,
        joinOrganizationByCode,
        approveMemberRequest,
        rejectMemberRequest,
        regenerateInviteCode
    } = useOrganization();

    const { showToast } = useToast();

    // Create Form State (Super Admin Only)
    const [newOrgName, setNewOrgName] = useState('');
    const [newOrgDesc, setNewOrgDesc] = useState('');
    const [newOrgColor, setNewOrgColor] = useState(WORKSPACE_COLOR_PRESETS[0].value);
    const [newOrgPlan, setNewOrgPlan] = useState<PlanTier>('PRO');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Join Form State
    const [inviteCodeInput, setInviteCodeInput] = useState('');
    const [joinResultMessage, setJoinResultMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Claim Owner Form State
    const [claimTokenInput, setClaimTokenInput] = useState('');
    const [claimResultMessage, setClaimResultMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        if (pendingInviteCodeFromUrl) {
            setInviteCodeInput(pendingInviteCodeFromUrl);
        }
    }, [pendingInviteCodeFromUrl]);

    useEffect(() => {
        if (pendingClaimTokenFromUrl) {
            setClaimTokenInput(pendingClaimTokenFromUrl);
        }
    }, [pendingClaimTokenFromUrl]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isSwitcherOpen) {
                closeSwitcherModal();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isSwitcherOpen, closeSwitcherModal]);

    if (!isSwitcherOpen) return null;

    const activeMemberCount = currentOrgMembers.filter(m => m.status === 'ACTIVE').length;
    const maxMemberQuota = currentOrg.maxMembers || 100;

    const handleCopyInviteCode = (code: string) => {
        navigator.clipboard.writeText(code);
        showToast(`คัดลอกรหัสเชิญ ${code} แล้ว`, 'success');
    };

    const handleCopyInviteLink = (code: string) => {
        const url = `${window.location.origin}/?join_org=${encodeURIComponent(code)}`;
        navigator.clipboard.writeText(url);
        showToast('คัดลอกลิงก์เชิญเข้าสู่องค์กรแล้ว', 'success');
    };

    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newOrgName.trim() || isSubmitting || !isSuperAdmin) return;
        setIsSubmitting(true);
        const preset = SAAS_PLAN_PRESETS[newOrgPlan] || SAAS_PLAN_PRESETS.PRO;
        const created = await createOrganization({
            name: newOrgName.trim(),
            description: newOrgDesc.trim(),
            color: newOrgColor,
            planTier: newOrgPlan,
            maxMembers: preset.defaultMaxMembers,
            allowedModules: [...preset.defaultModules],
            generateOwnerClaimLink: true
        });
        setIsSubmitting(false);
        if (created) {
            setNewOrgName('');
            setNewOrgDesc('');
            setActiveModalTab('SWITCH');
            closeSwitcherModal();
        }
    };

    const handleJoinSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteCodeInput.trim() || isSubmitting) return;
        setIsSubmitting(true);
        setJoinResultMessage(null);
        const res = await joinOrganizationByCode(inviteCodeInput);
        setIsSubmitting(false);
        setJoinResultMessage({
            type: res.success ? 'success' : 'error',
            text: res.message
        });
        if (res.success && res.status === 'ACTIVE') {
            setInviteCodeInput('');
            closeSwitcherModal();
        }
    };

    const handleClaimSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!claimTokenInput.trim() || isSubmitting) return;
        setIsSubmitting(true);
        setClaimResultMessage(null);
        const res = await claimOrganizationOwnership(claimTokenInput);
        setIsSubmitting(false);
        setClaimResultMessage({
            type: res.success ? 'success' : 'error',
            text: res.message
        });
        if (res.success) {
            setClaimTokenInput('');
            closeSwitcherModal();
        }
    };

    return (
        <AnimatePresence>
            <div
                onClick={closeSwitcherModal}
                className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm"
            >
                <motion.div
                    variants={modalVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    onClick={e => e.stopPropagation()}
                    className="w-full max-w-xl max-h-[92vh] sm:max-h-[85vh] flex flex-col bg-white dark:bg-slate-900 rounded-t-[2rem] sm:rounded-3xl shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800"
                >
                    {/* 1. Rigid Header */}
                    <div className="flex-shrink-0 px-5 sm:px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                                <Building2 className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                                <h3 className="font-bold text-gray-900 dark:text-white text-base truncate">
                                    จัดการองค์กร & สลับ Workspace
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-slate-400 truncate">
                                    ปัจจุบัน: {currentOrg.name} · แพ็กเกจ {currentOrg.planTier || 'ENTERPRISE'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={closeSwitcherModal}
                            className="p-2 -mr-2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 rounded-xl min-w-[40px] min-h-[40px] flex items-center justify-center transition-colors"
                            aria-label="ปิดหน้าต่าง"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Segmented Navigation Bar */}
                    <div className="flex-shrink-0 px-5 sm:px-6 pt-3 pb-2 bg-slate-50/70 dark:bg-slate-800/40 border-b border-gray-100 dark:border-slate-800">
                        <div className="grid grid-cols-4 gap-1 p-1 bg-slate-200/70 dark:bg-slate-800 rounded-xl">
                            <button
                                type="button"
                                onClick={() => setActiveModalTab('SWITCH')}
                                className={`py-2 px-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap truncate ${
                                    activeModalTab === 'SWITCH'
                                        ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                                }`}
                            >
                                สลับองค์กร ({myOrganizations.length})
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveModalTab('JOIN')}
                                className={`py-2 px-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap truncate ${
                                    activeModalTab === 'JOIN'
                                        ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                                }`}
                            >
                                รหัสเชิญทีม
                            </button>
                            {isSuperAdmin ? (
                                <button
                                    type="button"
                                    onClick={() => setActiveModalTab('CREATE')}
                                    className={`py-2 px-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap truncate ${
                                        activeModalTab === 'CREATE'
                                            ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                                    }`}
                                >
                                    + เปิดองค์กรลูกค้า
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setActiveModalTab('CLAIM')}
                                    className={`py-2 px-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap truncate ${
                                        activeModalTab === 'CLAIM'
                                            ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                                    }`}
                                >
                                    รับมอบองค์กร
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => setActiveModalTab('MEMBERS')}
                                className={`py-2 px-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap truncate flex items-center justify-center gap-1.5 ${
                                    activeModalTab === 'MEMBERS'
                                        ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                                }`}
                            >
                                <span>สมาชิก</span>
                                {pendingJoinRequests.length > 0 && (
                                    <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-500 text-white rounded-full tabular-nums">
                                        {pendingJoinRequests.length}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* 2. Scrollable Body */}
                    <div className="flex-1 overflow-y-auto overscroll-contain px-5 sm:px-6 py-4 space-y-4">
                        {activeModalTab === 'SWITCH' && (
                            <div className="space-y-4">
                                {/* Active Workspace Invite Card */}
                                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
                                    <div className="flex items-center justify-between gap-2">
                                        <div>
                                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                                รหัสเชิญเข้าทีมปัจจุบัน · โควตา <span className="font-mono tabular-nums font-bold text-slate-700 dark:text-slate-200">{activeMemberCount}/{maxMemberQuota}</span> คน
                                            </p>
                                            <p className="text-lg font-bold font-mono tabular-nums text-indigo-600 dark:text-indigo-400 tracking-wider mt-0.5">
                                                {currentOrg.inviteCode}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <button
                                                type="button"
                                                onClick={() => handleCopyInviteCode(currentOrg.inviteCode)}
                                                className="px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-indigo-300 transition-colors flex items-center gap-1.5"
                                            >
                                                <Copy className="w-3.5 h-3.5" /> คัดลอกรหัส
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleCopyInviteLink(currentOrg.inviteCode)}
                                                className="px-3 py-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 rounded-xl hover:bg-indigo-100 transition-colors flex items-center gap-1.5"
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
                                            {isSuperAdmin ? `องค์กรทั้งหมดในแพลตฟอร์ม (${myOrganizations.length})` : `องค์กรที่คุณสังกัดอยู่ (${myOrganizations.length})`}
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
                                                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center font-bold text-sm shrink-0 ${org.color || 'bg-indigo-50 text-indigo-700 border-indigo-200'}`}>
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
                                                            className="px-3 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors"
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
                        )}

                        {activeModalTab === 'JOIN' && (
                            <form onSubmit={handleJoinSubmit} className="space-y-4">
                                <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900 flex items-start gap-3">
                                    <KeyRound className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                                    <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
                                        <p className="font-bold text-slate-900 dark:text-white">
                                            เข้าร่วมทีมขององค์กรด้วยรหัสเชิญ (Staff Invite Code)
                                        </p>
                                        <p>
                                            สำหรับพนักงานในบริษัท: กรอกรหัสเชิญที่ได้รับจากผู้ดูแลองค์กรของคุณเพื่อส่งคำขอเข้าทีม
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                        รหัสเชิญเข้าทีม (Invite Code)
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={inviteCodeInput}
                                        onChange={e => setInviteCodeInput(e.target.value.toUpperCase())}
                                        placeholder="เช่น JUIJUI-HQ หรือ ORG-8F4K92"
                                        className="w-full px-4 py-3 text-base font-mono font-bold tracking-wider uppercase border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                                    />
                                </div>

                                {joinResultMessage && (
                                    <div
                                        className={`p-3.5 rounded-xl text-xs font-semibold border ${
                                            joinResultMessage.type === 'success'
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                : 'bg-rose-50 text-rose-700 border-rose-200'
                                        }`}
                                    >
                                        {joinResultMessage.text}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={!inviteCodeInput.trim() || isSubmitting}
                                    className="w-full py-3 px-5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                                >
                                    <UserPlus className="w-4 h-4" />
                                    {isSubmitting ? 'กำลังตรวจสอบรหัสเชิญ...' : 'ส่งคำขอเข้าร่วมองค์กร'}
                                </button>
                            </form>
                        )}

                        {activeModalTab === 'CLAIM' && (
                            <form onSubmit={handleClaimSubmit} className="space-y-4">
                                <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex items-start gap-3">
                                    <Crown className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                                    <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
                                        <p className="font-bold text-slate-900 dark:text-white">
                                            รับมอบสิทธิ์เจ้าขององค์กร (Owner Onboarding Token)
                                        </p>
                                        <p>
                                            สำหรับลูกค้าที่สั่งซื้อแพ็กเกจ: กรอกรหัสรับมอบองค์กร (Owner Claim Token) ที่ได้รับจากผู้ให้บริการ เพื่อเปิดใช้งานและรับสิทธิ์เป็น OWNER ทันที
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                        รหัสรับมอบองค์กร (Owner Claim Token)
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={claimTokenInput}
                                        onChange={e => setClaimTokenInput(e.target.value.toUpperCase())}
                                        placeholder="เช่น COMP-8F4K92-X7M9P2"
                                        className="w-full px-4 py-3 text-base font-mono font-bold tracking-wider uppercase border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                                    />
                                </div>

                                {claimResultMessage && (
                                    <div
                                        className={`p-3.5 rounded-xl text-xs font-semibold border ${
                                            claimResultMessage.type === 'success'
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                : 'bg-rose-50 text-rose-700 border-rose-200'
                                        }`}
                                    >
                                        {claimResultMessage.text}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={!claimTokenInput.trim() || isSubmitting}
                                    className="w-full py-3 px-5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                                >
                                    <Crown className="w-4 h-4" />
                                    {isSubmitting ? 'กำลังยืนยันสิทธิ์เจ้าขององค์กร...' : 'ยืนยันรับมอบสิทธิ์เป็น OWNER ขององค์กร'}
                                </button>
                            </form>
                        )}

                        {activeModalTab === 'CREATE' && isSuperAdmin && (
                            <form onSubmit={handleCreateSubmit} className="space-y-4">
                                <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900 flex items-start gap-3">
                                    <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                                    <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
                                        <p className="font-bold text-slate-900 dark:text-white">
                                            เปิดองค์กรใหม่ให้ลูกค้าด่วน (Super Admin Quick Provision)
                                        </p>
                                        <p>
                                            สร้าง Workspace ใหม่พร้อมชุดข้อมูลตั้งต้นและลิงก์ส่งมอบสิทธิ์เจ้าขององค์กร (หากต้องการเลือกเปิด-ปิด Module รายตัวแบบละเอียด สามารถตั้งค่าได้ที่หน้า Master Data &gt; Multi-Tenant SaaS)
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                        ชื่อองค์กร / บริษัทลูกค้า *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={newOrgName}
                                        onChange={e => setNewOrgName(e.target.value)}
                                        placeholder="เช่น บริษัท ครีเอทีฟ สตูดิโอ จำกัด"
                                        className="w-full px-4 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                            แพ็กเกจเริ่มต้น (Plan Tier)
                                        </label>
                                        <select
                                            value={newOrgPlan}
                                            onChange={e => setNewOrgPlan(e.target.value as PlanTier)}
                                            className="w-full px-3.5 py-2.5 text-sm font-bold border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                                        >
                                            <option value="STARTER">STARTER (10 คน · โมดูลพื้นฐาน)</option>
                                            <option value="PRO">PRO (30 คน · สตูดิโอเต็มรูปแบบ)</option>
                                            <option value="ENTERPRISE">ENTERPRISE (100 คน · ครบทุกโมดูล)</option>
                                            <option value="LIFETIME">LIFETIME (ตลอดชีพ · ครบทุกโมดูล)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                            คำอธิบายองค์กร
                                        </label>
                                        <input
                                            type="text"
                                            value={newOrgDesc}
                                            onChange={e => setNewOrgDesc(e.target.value)}
                                            placeholder="เช่น แพ็กเกจรายปี"
                                            className="w-full px-3.5 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                        โทนสีประจำองค์กร
                                    </label>
                                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                                        {WORKSPACE_COLOR_PRESETS.map(preset => (
                                            <button
                                                key={preset.label}
                                                type="button"
                                                onClick={() => setNewOrgColor(preset.value)}
                                                className={`py-2 px-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                                                    newOrgColor === preset.value
                                                        ? `${preset.value} ring-2 ring-indigo-500/40`
                                                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600'
                                                }`}
                                            >
                                                <span className={`w-2.5 h-2.5 rounded-full ${preset.dot}`} />
                                                <span>{preset.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={!newOrgName.trim() || isSubmitting}
                                    className="w-full py-3 px-5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    {isSubmitting ? 'กำลังเปิดองค์กรให้ลูกค้า...' : 'เปิดองค์กรใหม่และสร้างลิงก์ส่งมอบสิทธิ์'}
                                </button>
                            </form>
                        )}

                        {activeModalTab === 'MEMBERS' && (
                            <div className="space-y-4">
                                {/* Admin Invite Control Bar */}
                                {isOrgAdmin && (
                                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div>
                                            <p className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                                                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                                                การควบคุมรหัสเชิญ ({currentOrg.inviteCode}) · โควตา <span className="font-mono tabular-nums">{activeMemberCount}/{maxMemberQuota}</span> คน
                                            </p>
                                            <p className="text-[11px] text-slate-500 mt-0.5">
                                                สามารถรีเซ็ตรหัสเชิญใหม่ได้ทันทีหากต้องการยกเลิกรหัสเดิม
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => regenerateInviteCode(currentOrg.id)}
                                            className="px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-indigo-300 transition-colors flex items-center justify-center gap-1.5 shrink-0"
                                        >
                                            <RefreshCw className="w-3.5 h-3.5" /> รีเซ็ตรหัสเชิญ
                                        </button>
                                    </div>
                                )}

                                {/* Pending Approval Queue */}
                                {pendingJoinRequests.length > 0 && (
                                    <div className="space-y-2">
                                        <p className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                                            <Clock className="w-4 h-4" />
                                            คำขอเข้าร่วมที่รอการอนุมัติ ({pendingJoinRequests.length})
                                        </p>
                                        {pendingJoinRequests.map(req => (
                                            <div
                                                key={req.id}
                                                className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex items-center justify-between gap-3"
                                            >
                                                <div className="min-w-0">
                                                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                                        {req.user?.name || 'ผู้ใช้งานรออนุมัติ'}
                                                    </p>
                                                    <p className="text-xs text-slate-500 truncate">
                                                        {req.user?.email || req.userId}
                                                    </p>
                                                </div>
                                                {isOrgAdmin ? (
                                                    <div className="flex items-center gap-1.5 shrink-0">
                                                        <button
                                                            type="button"
                                                            onClick={() => approveMemberRequest(req.id)}
                                                            className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors flex items-center gap-1"
                                                        >
                                                            <UserCheck className="w-3.5 h-3.5" /> อนุมัติ
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => rejectMemberRequest(req.id)}
                                                            className="px-2.5 py-1.5 text-xs font-bold text-rose-600 bg-white border border-rose-200 hover:bg-rose-50 rounded-xl transition-colors"
                                                        >
                                                            ปฏิเสธ
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs font-semibold text-amber-600">
                                                        รอ Admin อนุมัติ
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Active Members List */}
                                <div className="space-y-2">
                                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                        <Users className="w-4 h-4" />
                                        สมาชิกในองค์กรนี้ (<span className="font-mono tabular-nums">{activeMemberCount} / {maxMemberQuota}</span> คน)
                                    </p>
                                    <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
                                        {currentOrgMembers
                                            .filter(m => m.status === 'ACTIVE')
                                            .map(member => (
                                                <div
                                                    key={member.id}
                                                    className="px-4 py-3 flex items-center justify-between gap-3"
                                                >
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        {member.user?.avatarUrl ? (
                                                            <img
                                                                src={member.user.avatarUrl}
                                                                alt={member.user.name}
                                                                referrerPolicy="no-referrer"
                                                                className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                                                            />
                                                        ) : (
                                                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">
                                                                {(member.user?.name || 'U').slice(0, 1).toUpperCase()}
                                                            </div>
                                                        )}
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                                                                {member.user?.name || 'สมาชิกในทีม'}
                                                            </p>
                                                            <p className="text-xs text-slate-500 truncate">
                                                                {member.user?.position || member.user?.email || 'Member'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 shrink-0">
                                                        {member.role}
                                                    </span>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 3. Rigid Sticky Footer */}
                    <div className="flex-shrink-0 px-5 sm:px-6 py-3.5 bg-gray-50/80 dark:bg-slate-800/80 border-t border-gray-100 dark:border-slate-800 flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center gap-2 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 text-center sm:text-left">
                            ข้อมูลทุกตารางแยกตามองค์กรด้วยระบบ Multi-Tenant Isolation
                        </span>
                        <button
                            type="button"
                            onClick={closeSwitcherModal}
                            className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-gray-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl hover:bg-gray-50 transition-colors"
                        >
                            ปิดหน้าต่าง
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default WorkspaceSwitcherModal;

