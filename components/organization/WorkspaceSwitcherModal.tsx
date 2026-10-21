import React, { useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Crown, X } from 'lucide-react';
import { useOrganization } from '../../context/OrganizationContext';
import { useUserSession } from '../../context/UserSessionContext';
import {
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
    badge?: number | string;
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
                label: `สลับองค์กร (${myOrganizations.length})`
            },
            {
                id: 'JOIN',
                label: 'รหัสเชิญทีม'
            }
        ];

        if (isSuperAdmin) {
            tabs.push({
                id: 'CREATE',
                label: '+ เปิดองค์กรลูกค้า'
            });
        } else {
            tabs.push({
                id: 'CLAIM',
                label: 'รับมอบองค์กร'
            });
        }

        tabs.push({
            id: 'MEMBERS',
            label: 'สมาชิก',
            badge: pendingJoinRequests.length > 0 ? pendingJoinRequests.length : undefined
        });

        return tabs;
    }, [myOrganizations.length, isSuperAdmin, pendingJoinRequests.length]);

    return (
        <AnimatePresence>
            {isSwitcherOpen && (
                <motion.div
                    variants={backdropVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    onClick={closeSwitcherModal}
                    className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm"
                >
                    <motion.div
                        variants={modalVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        onClick={e => e.stopPropagation()}
                        className="w-full sm:w-[580px] max-w-xl h-[88vh] max-h-[92vh] sm:h-[620px] sm:max-h-[85vh] flex flex-col bg-white dark:bg-slate-900 rounded-t-[2rem] sm:rounded-3xl shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800"
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
                                type="button"
                                onClick={closeSwitcherModal}
                                className="p-2 -mr-2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 rounded-xl min-w-[40px] min-h-[40px] flex items-center justify-center transition-colors"
                                aria-label="ปิดหน้าต่าง"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Apple-style Segmented Navigation Bar with Animated Sliding Indicator */}
                        <div className="flex-shrink-0 px-5 sm:px-6 pt-3 pb-2.5 bg-slate-50/70 dark:bg-slate-800/40 border-b border-gray-100 dark:border-slate-800">
                            <div className="grid grid-cols-4 p-1 bg-slate-200/70 dark:bg-slate-800 rounded-xl relative">
                                {navTabs.map(tab => {
                                    const isActive = activeModalTab === tab.id;
                                    return (
                                        <motion.button
                                            key={tab.id}
                                            type="button"
                                            whileTap={{ scale: 0.97 }}
                                            onClick={() => setActiveModalTab(tab.id)}
                                            className={`relative z-10 py-2 px-2 text-xs font-bold rounded-lg transition-colors whitespace-nowrap truncate flex items-center justify-center gap-1.5 min-w-0 ${
                                                isActive
                                                    ? 'text-indigo-600 dark:text-indigo-400'
                                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                                            }`}
                                        >
                                            {isActive && (
                                                <motion.div
                                                    layoutId="activeWorkspaceTabHighlight"
                                                    className="absolute inset-0 bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-black/[0.04] dark:border-white/[0.06] -z-10"
                                                    transition={{
                                                        type: 'spring',
                                                        stiffness: 480,
                                                        damping: 36
                                                    }}
                                                />
                                            )}
                                            <span className="truncate">{tab.label}</span>
                                            {tab.badge !== undefined && (
                                                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-500 text-white rounded-full font-mono tabular-nums leading-tight">
                                                    {tab.badge}
                                                </span>
                                            )}
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 2. Scrollable Body with strict height containment & Smooth Tab Cross-Fade */}
                        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 sm:px-6 py-4">
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
                        <div className="flex-shrink-0 px-5 sm:px-6 py-3.5 bg-gray-50/80 dark:bg-slate-800/80 border-t border-gray-100 dark:border-slate-800 flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center gap-2 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
                            {isSuperAdmin ? (
                                <button
                                    type="button"
                                    onClick={returnToSuperAdminPortal}
                                    className="w-full sm:w-auto px-3.5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                                >
                                    <Crown className="w-3.5 h-3.5 text-amber-400" />
                                    เปิดศูนย์ควบคุมแพลตฟอร์ม (Super Admin Portal)
                                </button>
                            ) : (
                                <span className="text-[11px] text-slate-500 dark:text-slate-400 text-center sm:text-left">
                                    ข้อมูลทุกตารางแยกตามองค์กรด้วยระบบ Multi-Tenant Isolation
                                </span>
                            )}
                            <button
                                type="button"
                                onClick={closeSwitcherModal}
                                className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-gray-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                            >
                                ปิดหน้าต่าง
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default WorkspaceSwitcherModal;
