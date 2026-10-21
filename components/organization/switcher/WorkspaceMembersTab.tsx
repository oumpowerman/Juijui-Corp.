import React, { useState, useEffect, useMemo } from 'react';
import {
    Clock,
    RefreshCw,
    Search,
    ShieldCheck,
    UserCheck,
    Users,
    UserX
} from 'lucide-react';
import { useOrganization } from '../../../context/OrganizationContext';
import { useUserSession } from '../../../context/UserSessionContext';
import { OrganizationMember } from '../../../types';

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

    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<MemberCategoryFilter>('ALL');
    const [isHydrating, setIsHydrating] = useState(false);

    // Ensure all member profiles (including is_active = false or PENDING/INACTIVE) are hydrated on mount
    useEffect(() => {
        let isMounted = true;
        const hydrateProfiles = async () => {
            const missingIds = currentOrgMembers
                .filter(m => !m.user?.name && !allUsers.some(u => u.id === m.userId))
                .map(m => m.userId)
                .filter(Boolean);

            const hasAnyMissing = missingIds.length > 0;
            // Also fetch full team profiles once so any inactive profiles in the workspace are loaded
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
                <img
                    src={item.avatarUrl}
                    alt={item.displayName}
                    referrerPolicy="no-referrer"
                    className={`w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0 ${
                        isMuted ? 'grayscale opacity-75' : ''
                    }`}
                />
            );
        }
        return (
            <div
                className={`w-9 h-9 rounded-full font-bold text-xs flex items-center justify-center shrink-0 ${
                    isMuted
                        ? 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        : item.category === 'PENDING'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                        : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                }`}
            >
                {(item.displayName || 'U').slice(0, 1).toUpperCase()}
            </div>
        );
    };

    return (
        <div className="space-y-4">
            {/* Admin Invite Control Bar */}
            {isOrgAdmin && (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                            <ShieldCheck className="w-4 h-4 text-indigo-600" />
                            การควบคุมรหัสเชิญ ({currentOrg.inviteCode}) · โควตา{' '}
                            <span className="font-mono tabular-nums">
                                {activeMemberCount}/{maxMemberQuota}
                            </span>{' '}
                            คน
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                            สามารถรีเซ็ตรหัสเชิญใหม่ได้ทันทีหากต้องการยกเลิกรหัสเดิม
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => regenerateInviteCode(currentOrg.id)}
                        className="px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-indigo-300 transition-colors flex items-center justify-center gap-1.5 shrink-0 whitespace-nowrap"
                    >
                        <RefreshCw className="w-3.5 h-3.5" /> รีเซ็ตรหัสเชิญ
                    </button>
                </div>
            )}

            {/* Search & Category Filter Controls */}
            <div className="space-y-2.5">
                <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="ค้นหาชื่อ, ตำแหน่ง หรืออีเมลสมาชิก..."
                        className="w-full pl-9 pr-4 py-2 text-xs font-medium border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                    />
                </div>

                {/* Segmented Category Filter */}
                <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl">
                    {(
                        [
                            { key: 'ALL', label: 'ทั้งหมด', count: totalCounts.ALL },
                            { key: 'ACTIVE', label: 'ใช้งานอยู่', count: totalCounts.ACTIVE },
                            { key: 'PENDING', label: 'รออนุมัติ', count: totalCounts.PENDING },
                            { key: 'INACTIVE', label: 'ไม่ได้ใช้งาน', count: totalCounts.INACTIVE }
                        ] as const
                    ).map(tab => (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => setCategoryFilter(tab.key)}
                            className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap truncate ${
                                categoryFilter === tab.key
                                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                            }`}
                        >
                            {tab.label} (<span className="font-mono tabular-nums">{tab.count}</span>)
                        </button>
                    ))}
                </div>
            </div>

            {isHydrating && (
                <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 px-1">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                    <span>กำลังซิงค์ข้อมูลโปรไฟล์สมาชิกทั้งหมด...</span>
                </div>
            )}

            {/* 1. หมวดรออนุมัติ (PENDING) */}
            {(categoryFilter === 'ALL' || categoryFilter === 'PENDING') && pendingList.length > 0 && (
                <div className="space-y-2">
                    <p className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        คำขอเข้าร่วมที่รอการอนุมัติ (<span className="font-mono tabular-nums">{pendingList.length}</span>)
                    </p>
                    <div className="space-y-2">
                        {pendingList.map(item => (
                            <div
                                key={item.member.id}
                                className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex items-center justify-between gap-3"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    {renderAvatar(item)}
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                            {item.displayName}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                            {item.displayPosition}
                                            {item.displayEmail ? ` · ${item.displayEmail}` : ''}
                                        </p>
                                    </div>
                                </div>
                                {isOrgAdmin ? (
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        <button
                                            type="button"
                                            onClick={() => approveMemberRequest(item.member.id)}
                                            className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors flex items-center gap-1 whitespace-nowrap"
                                        >
                                            <UserCheck className="w-3.5 h-3.5" /> อนุมัติ
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => rejectMemberRequest(item.member.id)}
                                            className="px-2.5 py-1.5 text-xs font-bold text-rose-600 bg-white border border-rose-200 hover:bg-rose-50 rounded-xl transition-colors whitespace-nowrap"
                                        >
                                            ปฏิเสธ
                                        </button>
                                    </div>
                                ) : (
                                    <span className="text-xs font-semibold text-amber-600 shrink-0">
                                        รอ Admin อนุมัติ
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 2. หมวดใช้งานอยู่ (ACTIVE) */}
            {(categoryFilter === 'ALL' || categoryFilter === 'ACTIVE') && (
                <div className="space-y-2">
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-emerald-600" />
                        สมาชิกที่ใช้งานอยู่ (<span className="font-mono tabular-nums">{activeList.length} / {maxMemberQuota}</span> คน)
                    </p>
                    {activeList.length > 0 ? (
                        <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
                            {activeList.map(item => (
                                <div
                                    key={item.member.id}
                                    className="px-4 py-3 flex items-center justify-between gap-3"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        {renderAvatar(item)}
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                                                {item.displayName}
                                            </p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                                {item.displayPosition}
                                                {item.displayEmail ? ` · ${item.displayEmail}` : ''}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 shrink-0 flex items-center gap-1.5">
                                        <span className="text-emerald-600 dark:text-emerald-400">ใช้งานอยู่</span>
                                        <span aria-hidden="true">·</span>
                                        <span>{item.member.role}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-6 text-center rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-xs text-slate-500">
                            ไม่พบรายชื่อสมาชิกที่ใช้งานอยู่ในหมวดนี้
                        </div>
                    )}
                </div>
            )}

            {/* 3. หมวดไม่ได้ใช้งาน / พักงาน (INACTIVE) */}
            {(categoryFilter === 'ALL' || categoryFilter === 'INACTIVE') && inactiveList.length > 0 && (
                <div className="space-y-2">
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        <UserX className="w-4 h-4 text-slate-400" />
                        สมาชิกที่ไม่ได้ใช้งาน / พักงาน (<span className="font-mono tabular-nums">{inactiveList.length}</span> คน)
                    </p>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden bg-slate-50/70 dark:bg-slate-900/60">
                        {inactiveList.map(item => (
                            <div
                                key={item.member.id}
                                className="px-4 py-3 flex items-center justify-between gap-3 opacity-80"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    {renderAvatar(item, true)}
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300 truncate">
                                            {item.displayName}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                            {item.displayPosition}
                                            {item.displayEmail ? ` · ${item.displayEmail}` : ''}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 shrink-0 flex items-center gap-1.5">
                                    <span>
                                        {item.member.status === 'REJECTED' ? 'ปฏิเสธคำขอ' : 'ไม่ได้ใช้งาน'}
                                    </span>
                                    <span aria-hidden="true">·</span>
                                    <span>{item.member.role}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Empty State when filter returns nothing */}
            {searchedMembers.length === 0 && (
                <div className="p-8 text-center rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-xs text-slate-500">
                    ไม่พบรายชื่อสมาชิกที่ตรงกับคำค้นหา "{searchQuery}"
                </div>
            )}
        </div>
    );
};
