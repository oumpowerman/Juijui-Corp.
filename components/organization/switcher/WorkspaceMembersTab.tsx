import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    Clock,
    Crown,
    RefreshCw,
    Search,
    ShieldCheck,
    UserCheck,
    Users,
    UserX
} from 'lucide-react';
import { useOrganization } from '../../../context/OrganizationContext';
import { useUserSession } from '../../../context/UserSessionContext';
import { useCompanies } from '../../../hooks/useCompanies';
import { OrganizationMember } from '../../../types';
import {
    staggerContainerVariants,
    staggerItemVariants
} from './workspaceSwitcherConstants';

interface WorkspaceMembersTabProps {
    activeMemberCount: number;
    maxMemberQuota: number;
}

type MemberCategoryFilter = 'ALL' | 'ACTIVE' | 'PENDING' | 'INACTIVE';

interface HydratedMemberItem {
    member: OrganizationMember;
    displayName: string;
    displayEmail: string;
    displayPosition: string;
    avatarUrl: string;
    category: 'ACTIVE' | 'PENDING' | 'INACTIVE';
}

export const WorkspaceMembersTab: React.FC<WorkspaceMembersTabProps> = ({
    activeMemberCount,
    maxMemberQuota
}) => {
    const {
        currentOrg,
        currentOrgMembers,
        isOrgAdmin,
        approveMemberRequest,
        rejectMemberRequest,
        regenerateInviteCode
    } = useOrganization();

    const { allUsers, fetchMissingProfiles, fetchTeamMembers } = useUserSession();
    const { activeCompanies } = useCompanies();

    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<MemberCategoryFilter>('ALL');
    const [isHydrating, setIsHydrating] = useState(false);
    const [selectedCompanyByMember, setSelectedCompanyByMember] = useState<Record<string, string>>({});

    // Ensure all member profiles (including is_active = false or PENDING/INACTIVE) are hydrated on mount
    useEffect(() => {
        let isMounted = true;
        const hydrateProfiles = async () => {
            const missingIds = currentOrgMembers
                .filter(m => !m.user?.name && !allUsers.some(u => u.id === m.userId))
                .map(m => m.userId)
                .filter(Boolean);

            const hasAnyMissing = missingIds.length > 0;
            if (hasAnyMissing || !allUsers.some(u => !u.isActive)) {
                setIsHydrating(true);
                await Promise.all([
                    hasAnyMissing ? fetchMissingProfiles(missingIds) : Promise.resolve([]),
                    fetchTeamMembers()
                ]);
                if (isMounted) setIsHydrating(false);
            }
        };

        hydrateProfiles();
        return () => {
            isMounted = false;
        };
    }, [currentOrgMembers, allUsers, fetchMissingProfiles, fetchTeamMembers]);

    // Merge member data with live allUsers lookup so inactive/pending members always have name & avatar
    const hydratedMembers = useMemo<HydratedMemberItem[]>(() => {
        return currentOrgMembers.map(member => {
            const liveUser = allUsers.find(u => u.id === member.userId);
            const resolvedUser = liveUser || member.user;

            const isProfileInactive =
                resolvedUser?.isActive === false ||
                resolvedUser?.status === 'INACTIVE' ||
                member.status === 'REJECTED';

            const category: 'ACTIVE' | 'PENDING' | 'INACTIVE' =
                member.status === 'PENDING'
                    ? 'PENDING'
                    : isProfileInactive
                    ? 'INACTIVE'
                    : 'ACTIVE';

            return {
                member,
                displayName: resolvedUser?.name || 'ไม่ระบุชื่อสมาชิก',
                displayEmail: resolvedUser?.email || '',
                displayPosition: resolvedUser?.position || 'Member',
                avatarUrl: resolvedUser?.avatarUrl || '',
                category
            };
        });
    }, [currentOrgMembers, allUsers]);

    // Filter by search query
    const searchedMembers = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return hydratedMembers;
        return hydratedMembers.filter(
            item =>
                item.displayName.toLowerCase().includes(q) ||
                item.displayEmail.toLowerCase().includes(q) ||
                item.displayPosition.toLowerCase().includes(q) ||
                item.member.role.toLowerCase().includes(q)
        );
    }, [hydratedMembers, searchQuery]);

    const pendingList = useMemo(
        () => searchedMembers.filter(item => item.category === 'PENDING'),
        [searchedMembers]
    );
    const activeList = useMemo(
        () => searchedMembers.filter(item => item.category === 'ACTIVE'),
        [searchedMembers]
    );
    const inactiveList = useMemo(
        () => searchedMembers.filter(item => item.category === 'INACTIVE'),
        [searchedMembers]
    );

    const totalCounts = useMemo(() => {
        return {
            ALL: hydratedMembers.length,
            ACTIVE: hydratedMembers.filter(i => i.category === 'ACTIVE').length,
            PENDING: hydratedMembers.filter(i => i.category === 'PENDING').length,
            INACTIVE: hydratedMembers.filter(i => i.category === 'INACTIVE').length
        };
    }, [hydratedMembers]);

    const renderAvatar = (item: HydratedMemberItem, isMuted = false) => {
        if (item.avatarUrl) {
            return (
                <div className="relative shrink-0">
                    <img
                        src={item.avatarUrl}
                        alt={item.displayName}
                        referrerPolicy="no-referrer"
                        className={`w-9 h-9 rounded-full object-cover border border-slate-200 ${
                            isMuted ? 'grayscale opacity-75' : ''
                        }`}
                    />
                    {!isMuted && item.category === 'ACTIVE' && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white" />
                    )}
                </div>
            );
        }
        return (
            <div className="relative shrink-0">
                <div
                    className={`w-9 h-9 rounded-full font-bold text-xs flex items-center justify-center ${
                        isMuted
                            ? 'bg-slate-200 text-slate-600'
                            : item.category === 'PENDING'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                    }`}
                >
                    {(item.displayName || 'U').slice(0, 1).toUpperCase()}
                </div>
                {!isMuted && item.category === 'ACTIVE' && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white" />
                )}
            </div>
        );
    };

    const renderRoleBadge = (role: string) => {
        const upper = (role || 'MEMBER').toUpperCase();
        if (upper === 'OWNER') {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200/80">
                    <Crown className="w-2.5 h-2.5 text-amber-500" />
                    OWNER
                </span>
            );
        }
        if (upper === 'ADMIN') {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/80">
                    <ShieldCheck className="w-2.5 h-2.5 text-indigo-500" />
                    ADMIN
                </span>
            );
        }
        return (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200/70">
                {upper}
            </span>
        );
    };

    return (
        <motion.div
            variants={staggerContainerVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="space-y-4"
        >
            {/* Admin Invite Control Bar */}
            {isOrgAdmin && (
                <motion.div
                    variants={staggerItemVariants}
                    className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 via-white to-indigo-50/40 border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                >
                    <div>
                        <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <ShieldCheck className="w-4 h-4 text-indigo-600" />
                            <span>
                                การควบคุมรหัสเชิญ (<span className="font-mono text-indigo-600">{currentOrg.inviteCode}</span>) · โควตา{' '}
                            </span>
                            <span className="font-mono tabular-nums text-slate-900">
                                {activeMemberCount}/{maxMemberQuota}
                            </span>{' '}
                            คน
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                            สามารถรีเซ็ตรหัสเชิญใหม่ได้ทันทีหากต้องการยกเลิกรหัสเดิมเพื่อความปลอดภัย
                        </p>
                    </div>
                    <motion.button
                        type="button"
                        whileHover={{ y: -1 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => regenerateInviteCode(currentOrg.id)}
                        className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200/90 rounded-xl hover:border-indigo-300 hover:text-indigo-700 shadow-2xs transition-all flex items-center justify-center gap-1.5 shrink-0 whitespace-nowrap"
                    >
                        <RefreshCw className="w-3.5 h-3.5 text-indigo-500" />
                        <span>รีเซ็ตรหัสเชิญ</span>
                    </motion.button>
                </motion.div>
            )}

            {/* Search & Category Filter Controls */}
            <motion.div variants={staggerItemVariants} className="space-y-2.5">
                <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="ค้นหาชื่อ, ตำแหน่ง หรืออีเมลสมาชิก..."
                        className="w-full pl-9 pr-4 py-2.5 text-xs font-medium border border-slate-200 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-2xs"
                    />
                </div>

                {/* Segmented Category Filter with layoutId Sliding Pill */}
                <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100/90 rounded-xl border border-slate-200/60 relative">
                    {(
                        [
                            { key: 'ALL', label: 'ทั้งหมด', count: totalCounts.ALL },
                            { key: 'ACTIVE', label: 'ใช้งานอยู่', count: totalCounts.ACTIVE },
                            { key: 'PENDING', label: 'รออนุมัติ', count: totalCounts.PENDING },
                            { key: 'INACTIVE', label: 'พักงาน', count: totalCounts.INACTIVE }
                        ] as const
                    ).map(tab => {
                        const isSelected = categoryFilter === tab.key;
                        return (
                            <button
                                key={tab.key}
                                type="button"
                                onClick={() => setCategoryFilter(tab.key)}
                                className={`relative z-10 py-1.5 px-2 rounded-lg text-[11px] font-bold transition-colors whitespace-nowrap truncate ${
                                    isSelected
                                        ? 'text-indigo-700'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                {isSelected && (
                                    <motion.div
                                        layoutId="activeMemberCategoryFilter"
                                        className="absolute inset-0 bg-white rounded-lg shadow-2xs border border-indigo-100/80 -z-10"
                                        transition={{
                                            type: 'spring',
                                            stiffness: 460,
                                            damping: 34
                                        }}
                                    />
                                )}
                                {tab.label} (<span className="font-mono tabular-nums">{tab.count}</span>)
                            </button>
                        );
                    })}
                </div>
            </motion.div>

            {isHydrating && (
                <div className="text-xs text-slate-500 flex items-center gap-2 px-1">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                    <span>กำลังซิงค์ข้อมูลโปรไฟล์สมาชิกทั้งหมด...</span>
                </div>
            )}

            {/* 1. หมวดรออนุมัติ (PENDING) */}
            {(categoryFilter === 'ALL' || categoryFilter === 'PENDING') && pendingList.length > 0 && (
                <motion.div variants={staggerItemVariants} className="space-y-2">
                    <p className="text-xs font-bold text-amber-700 flex items-center gap-1.5 px-0.5">
                        <Clock className="w-4 h-4 text-amber-500" />
                        <span>
                            คำขอเข้าร่วมที่รอการอนุมัติ (<span className="font-mono tabular-nums">{pendingList.length}</span>)
                        </span>
                    </p>
                    <div className="space-y-2">
                        {pendingList.map(item => {
                            const selectedCompId =
                                selectedCompanyByMember[item.member.id] ||
                                (activeCompanies.length > 0 ? activeCompanies[0].id : '');
                            return (
                                <motion.div
                                    key={item.member.id}
                                    variants={staggerItemVariants}
                                    className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-50/90 via-white to-amber-50/40 border border-amber-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        {renderAvatar(item)}
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-slate-900 truncate">
                                                {item.displayName}
                                            </p>
                                            <p className="text-xs text-slate-500 truncate">
                                                {item.displayPosition}
                                                {item.displayEmail ? ` · ${item.displayEmail}` : ''}
                                            </p>
                                        </div>
                                    </div>
                                    {isOrgAdmin ? (
                                        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                                            {activeCompanies.length > 0 && (
                                                <select
                                                    value={selectedCompId}
                                                    onChange={e =>
                                                        setSelectedCompanyByMember(prev => ({
                                                            ...prev,
                                                            [item.member.id]: e.target.value
                                                        }))
                                                    }
                                                    aria-label="เลือกสังกัดบริษัทในเครือ"
                                                    className="px-2.5 py-1.5 text-xs font-bold text-slate-700 bg-white border border-amber-300 rounded-xl outline-none focus:border-indigo-500"
                                                >
                                                    {activeCompanies.map(comp => (
                                                        <option key={comp.id} value={comp.id}>
                                                            {comp.shortName ? `[${comp.shortName}] ` : ''}
                                                            {comp.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            )}
                                            <motion.button
                                                type="button"
                                                whileHover={{ scale: 1.03 }}
                                                whileTap={{ scale: 0.96 }}
                                                onClick={() =>
                                                    approveMemberRequest(
                                                        item.member.id,
                                                        selectedCompId || undefined
                                                    )
                                                }
                                                className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-2xs transition-colors flex items-center gap-1 whitespace-nowrap"
                                            >
                                                <UserCheck className="w-3.5 h-3.5" /> อนุมัติ
                                            </motion.button>
                                            <motion.button
                                                type="button"
                                                whileHover={{ scale: 1.03 }}
                                                whileTap={{ scale: 0.96 }}
                                                onClick={() => rejectMemberRequest(item.member.id)}
                                                className="px-2.5 py-1.5 text-xs font-bold text-rose-600 bg-white border border-rose-200 hover:bg-rose-50 rounded-xl transition-colors whitespace-nowrap"
                                            >
                                                ปฏิเสธ
                                            </motion.button>
                                        </div>
                                    ) : (
                                        <span className="text-xs font-semibold text-amber-700 bg-amber-100/80 px-2.5 py-1 rounded-lg shrink-0">
                                            รอ Admin อนุมัติ
                                        </span>
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>
                </motion.div>
            )}

            {/* 2. หมวดใช้งานอยู่ (ACTIVE) */}
            {(categoryFilter === 'ALL' || categoryFilter === 'ACTIVE') && (
                <motion.div variants={staggerItemVariants} className="space-y-2">
                    <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5 px-0.5">
                        <Users className="w-4 h-4 text-emerald-600" />
                        <span>
                            สมาชิกที่ใช้งานอยู่ (<span className="font-mono tabular-nums">{activeList.length} / {maxMemberQuota}</span> คน)
                        </span>
                    </p>
                    {activeList.length > 0 ? (
                        <div className="divide-y divide-slate-100 border border-slate-200/90 rounded-2xl overflow-hidden bg-white shadow-2xs">
                            {activeList.map(item => (
                                <div
                                    key={item.member.id}
                                    className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        {renderAvatar(item)}
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-slate-800 truncate">
                                                {item.displayName}
                                            </p>
                                            <p className="text-xs text-slate-500 truncate">
                                                {item.displayPosition}
                                                {item.displayEmail ? ` · ${item.displayEmail}` : ''}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-xs font-semibold shrink-0 flex items-center gap-2">
                                        <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                            ใช้งานอยู่
                                        </span>
                                        {renderRoleBadge(item.member.role)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-6 text-center rounded-2xl border border-slate-200/80 bg-slate-50/50 text-xs text-slate-500">
                            ไม่พบรายชื่อสมาชิกที่ใช้งานอยู่ในหมวดนี้
                        </div>
                    )}
                </motion.div>
            )}

            {/* 3. หมวดไม่ได้ใช้งาน / พักงาน (INACTIVE) */}
            {(categoryFilter === 'ALL' || categoryFilter === 'INACTIVE') && inactiveList.length > 0 && (
                <motion.div variants={staggerItemVariants} className="space-y-2">
                    <p className="text-xs font-bold text-slate-500 flex items-center gap-1.5 px-0.5">
                        <UserX className="w-4 h-4 text-slate-400" />
                        <span>
                            สมาชิกที่ไม่ได้ใช้งาน / พักงาน (<span className="font-mono tabular-nums">{inactiveList.length}</span> คน)
                        </span>
                    </p>
                    <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-2xl overflow-hidden bg-slate-50/70">
                        {inactiveList.map(item => (
                            <div
                                key={item.member.id}
                                className="px-4 py-3 flex items-center justify-between gap-3 opacity-80"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    {renderAvatar(item, true)}
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-slate-700 truncate">
                                            {item.displayName}
                                        </p>
                                        <p className="text-xs text-slate-500 truncate">
                                            {item.displayPosition}
                                            {item.displayEmail ? ` · ${item.displayEmail}` : ''}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-xs font-semibold text-slate-500 shrink-0 flex items-center gap-2">
                                    <span className="text-[11px] text-slate-400">
                                        {item.member.status === 'REJECTED' ? 'ปฏิเสธคำขอ' : 'พักงาน'}
                                    </span>
                                    {renderRoleBadge(item.member.role)}
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Empty State when filter returns nothing */}
            {searchedMembers.length === 0 && (
                <motion.div
                    variants={staggerItemVariants}
                    className="p-8 text-center rounded-2xl border border-slate-200/80 bg-slate-50/50 text-xs text-slate-500"
                >
                    ไม่พบรายชื่อสมาชิกที่ตรงกับคำค้นหา &ldquo;{searchQuery}&rdquo;
                </motion.div>
            )}
        </motion.div>
    );
};

