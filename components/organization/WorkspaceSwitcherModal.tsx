import React, { useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Award,
    Building2,
    Crown,
    KeyRound,
    Layers,
    ShieldCheck,
    Sparkles,
    Users,
    X
} from 'lucide-react';
import { useOrganization } from '../../context/OrganizationContext';
import { useUserSession } from '../../context/UserSessionContext';
import {
    overlayContainerVariants,
    backdropVariants,
    modalVariants,
    tabContentVariants
} from './switcher/workspaceSwitcherConstants';
import { WorkspaceSwitchTab } from './switcher/WorkspaceSwitchTab';
import { WorkspaceJoinTab } from './switcher/WorkspaceJoinTab';
import { WorkspaceClaimTab } from './switcher/WorkspaceClaimTab';
import { WorkspaceCreateTab } from './switcher/WorkspaceCreateTab';
import { WorkspaceMembersTab } from './switcher/WorkspaceMembersTab';

interface NavTabItem {
    id: 'SWITCH' | 'JOIN' | 'CREATE' | 'CLAIM' | 'MEMBERS';
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number | string;
    badgeTone?: 'indigo' | 'amber';
}

export const WorkspaceSwitcherModal: React.FC = () => {
    const {
        isSwitcherOpen,
        closeSwitcherModal,
        activeModalTab,
        setActiveModalTab,
        isSuperAdmin,
        currentOrg,
        myOrganizations,
        currentOrgMembers,
        pendingJoinRequests,
        returnToSuperAdminPortal
    } = useOrganization();

    const { allUsers } = useUserSession();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isSwitcherOpen) {
                closeSwitcherModal();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isSwitcherOpen, closeSwitcherModal]);

    const activeMemberCount = useMemo(() => {
        return currentOrgMembers.filter(m => {
            if (m.status !== 'ACTIVE') return false;
            const liveUser = allUsers.find(u => u.id === m.userId) || m.user;
            return liveUser?.isActive !== false && liveUser?.status !== 'INACTIVE';
        }).length;
    }, [currentOrgMembers, allUsers]);

    const maxMemberQuota = currentOrg.maxMembers || 100;

    const navTabs = useMemo<NavTabItem[]>(() => {
        const tabs: NavTabItem[] = [
            {
                id: 'SWITCH',
                label: 'สลับองค์กร',
                icon: Layers,
                badge: myOrganizations.length,
                badgeTone: 'indigo'
            },
            {
                id: 'JOIN',
                label: 'รหัสเชิญทีม',
                icon: KeyRound
            }
        ];

        if (isSuperAdmin) {
            tabs.push({
                id: 'CREATE',
                label: 'เปิดองค์กรใหม่',
                icon: Sparkles
            });
        } else {
            tabs.push({
                id: 'CLAIM',
                label: 'รับมอบองค์กร',
                icon: Award
            });
        }

        tabs.push({
            id: 'MEMBERS',
            label: 'สมาชิก',
            icon: Users,
            badge: pendingJoinRequests.length > 0 ? pendingJoinRequests.length : activeMemberCount,
            badgeTone: pendingJoinRequests.length > 0 ? 'amber' : 'indigo'
        });

        return tabs;
    }, [myOrganizations.length, isSuperAdmin, pendingJoinRequests.length, activeMemberCount]);

    const planTierLabel = currentOrg.planTier || 'ENTERPRISE';

    return (
        <AnimatePresence mode="sync">
            {isSwitcherOpen && (
                <motion.div
                    key="workspace-switcher-overlay"
                    variants={overlayContainerVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden"
                >
                    {/* Decoupled Backdrop Layer so opacity does not multiply with Modal on exit */}
                    <motion.div
                        variants={backdropVariants}
                        onClick={closeSwitcherModal}
                        className="absolute inset-0 bg-slate-950/55 backdrop-blur-md"
                    />

                    {/* Modal Dialog Container (3-Layer Flexbox Contract) */}
                    <motion.div
                        variants={modalVariants}
                        onClick={e => e.stopPropagation()}
                        className="relative z-10 w-full sm:w-[600px] max-w-xl h-[88vh] max-h-[92vh] sm:h-[640px] sm:max-h-[86vh] flex flex-col bg-white rounded-t-[2rem] sm:rounded-3xl shadow-[0_25px_70px_-15px_rgba(15,23,42,0.45)] overflow-hidden border border-slate-200/90 ring-1 ring-indigo-500/10"
                    >
                        {/* Top Executive Gradient Accent Rail */}
                        <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 via-violet-500 to-sky-400 flex-shrink-0" />

                        {/* 1. Rigid Header */}
                        <div className="relative flex-shrink-0 px-5 sm:px-6 py-4 bg-gradient-to-br from-indigo-50/60 via-white to-violet-50/40 border-b border-slate-100 flex items-center justify-between gap-3 overflow-hidden">
                            {/* Subtle Ambient Header Glow */}
                            <div className="pointer-events-none absolute -top-12 -right-12 w-36 h-36 rounded-full bg-indigo-400/10 blur-2xl" />

                            <div className="flex items-center gap-3.5 min-w-0 relative z-10">
                                <motion.div
                                    initial={{ scale: 0.85, rotate: -6 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ type: 'spring', stiffness: 360, damping: 22 }}
                                    className="relative w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-md shadow-indigo-500/20 flex items-center justify-center text-white shrink-0 ring-4 ring-indigo-50"
                                >
                                    <Building2 className="w-5 h-5" />
                                    <span
                                        className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5"
                                        title="Workspace Active"
                                    >
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                        <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white" />
                                    </span>
                                </motion.div>

                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-slate-900 text-base truncate">
                                            จัดการองค์กร & สลับ Workspace
                                        </h3>
                                        <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/80 tracking-wide">
                                            <Sparkles className="w-2.5 h-2.5 text-indigo-500" />
                                            WORKSPACE HUB
                                        </span>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 truncate max-w-[200px] sm:max-w-[240px]">
                                            {currentOrg.name}
                                        </span>
                                        <span className="text-slate-300" aria-hidden="true">
                                            •
                                        </span>
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200/80">
                                            <Crown className="w-3 h-3 text-amber-500" />
                                            {planTierLabel}
                                        </span>
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 font-mono tabular-nums">
                                            <Users className="w-3 h-3 text-slate-500" />
                                            {activeMemberCount}/{maxMemberQuota}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <motion.button
                                type="button"
                                whileHover={{ scale: 1.06, rotate: 90 }}
                                whileTap={{ scale: 0.92 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                                onClick={closeSwitcherModal}
                                className="relative z-10 p-2 -mr-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100/80 rounded-xl min-w-[40px] min-h-[40px] flex items-center justify-center transition-colors"
                                aria-label="ปิดหน้าต่าง"
                            >
                                <X className="w-5 h-5" />
                            </motion.button>
                        </div>

                        {/* Segmented Navigation Bar with Icons & Animated Sliding Pill */}
                        <div className="flex-shrink-0 px-5 sm:px-6 pt-3 pb-2.5 bg-slate-50/80 border-b border-slate-100">
                            <div className="grid grid-cols-4 p-1 bg-slate-200/65 rounded-2xl relative border border-slate-200/60">
                                {navTabs.map(tab => {
                                    const isActive = activeModalTab === tab.id;
                                    const Icon = tab.icon;
                                    return (
                                        <motion.button
                                            key={tab.id}
                                            type="button"
                                            whileTap={{ scale: 0.97 }}
                                            onClick={() => setActiveModalTab(tab.id)}
                                            className={`relative z-10 py-2 px-2 text-xs font-bold rounded-xl transition-colors whitespace-nowrap truncate flex items-center justify-center gap-1.5 min-w-0 ${
                                                isActive
                                                    ? 'text-indigo-700'
                                                    : 'text-slate-600 hover:text-slate-900'
                                            }`}
                                        >
                                            {isActive && (
                                                <motion.div
                                                    layoutId="activeWorkspaceTabHighlight"
                                                    className="absolute inset-0 bg-white rounded-xl shadow-sm border border-indigo-100/80 -z-10"
                                                    transition={{
                                                        type: 'spring',
                                                        stiffness: 460,
                                                        damping: 34
                                                    }}
                                                />
                                            )}
                                            <Icon
                                                className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                                                    isActive ? 'text-indigo-600' : 'text-slate-400'
                                                }`}
                                            />
                                            <span className="truncate">{tab.label}</span>
                                            {tab.badge !== undefined && (
                                                <span
                                                    className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full font-mono tabular-nums leading-none shrink-0 ${
                                                        tab.badgeTone === 'amber'
                                                            ? 'bg-amber-500 text-white shadow-2xs'
                                                            : isActive
                                                            ? 'bg-indigo-100 text-indigo-700'
                                                            : 'bg-slate-300/70 text-slate-700'
                                                    }`}
                                                >
                                                    {tab.badge}
                                                </span>
                                            )}
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 2. Scrollable Body with strict height containment & Smooth Tab Cross-Fade */}
                        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 sm:px-6 py-4 bg-gradient-to-b from-white via-white to-slate-50/40">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeModalTab}
                                    variants={tabContentVariants}
                                    initial="initial"
                                    animate="animate"
                                    exit="exit"
                                    className="space-y-4"
                                >
                                    {activeModalTab === 'SWITCH' && (
                                        <WorkspaceSwitchTab
                                            activeMemberCount={activeMemberCount}
                                            maxMemberQuota={maxMemberQuota}
                                        />
                                    )}

                                    {activeModalTab === 'JOIN' && <WorkspaceJoinTab />}

                                    {activeModalTab === 'CLAIM' && <WorkspaceClaimTab />}

                                    {activeModalTab === 'CREATE' && isSuperAdmin && <WorkspaceCreateTab />}

                                    {activeModalTab === 'MEMBERS' && (
                                        <WorkspaceMembersTab
                                            activeMemberCount={activeMemberCount}
                                            maxMemberQuota={maxMemberQuota}
                                        />
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        {/* 3. Rigid Sticky Footer */}
                        <div className="flex-shrink-0 px-5 sm:px-6 py-3.5 bg-slate-50/90 border-t border-slate-200/80 flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center gap-2 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
                            {isSuperAdmin ? (
                                <motion.button
                                    type="button"
                                    whileHover={{ y: -1, scale: 1.01 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={returnToSuperAdminPortal}
                                    className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 hover:from-slate-800 hover:to-slate-800 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 border border-slate-700/80"
                                >
                                    <Crown className="w-3.5 h-3.5 text-amber-400" />
                                    <span>เปิดศูนย์ควบคุมแพลตฟอร์ม (Super Admin Portal)</span>
                                </motion.button>
                            ) : (
                                <div className="flex items-center justify-center sm:justify-start gap-1.5 text-[11px] font-medium text-slate-500">
                                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                                    <span>แยกฐานข้อมูลปลอดภัยระดับองค์กร (Multi-Tenant Isolation)</span>
                                </div>
                            )}

                            <motion.button
                                type="button"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={closeSwitcherModal}
                                className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 shadow-2xs transition-all flex items-center justify-center gap-2"
                            >
                                <span>ปิดหน้าต่าง</span>
                                <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-semibold text-slate-400 bg-slate-100 rounded border border-slate-200/80">
                                    ESC
                                </kbd>
                            </motion.button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default WorkspaceSwitcherModal;

