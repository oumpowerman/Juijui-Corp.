import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Users } from 'lucide-react';
import { User } from '../../../../../types';
import { useTeam } from '../../../../../hooks/useTeam';
import { useGamification } from '../../../../../hooks/useGamification';
import { useToast } from '../../../../../context/ToastContext';

// Sub-components
import { MemberControlHeader } from './MemberControlHeader';
import { MemberControlFilters, StatusFilterType } from './MemberControlFilters';
import { MemberControlCard } from './MemberControlCard';
import { MemberPositionSection } from './MemberPositionSection';
import { MemberHistoryModal } from './MemberHistoryModal';

interface AttendanceMemberControlModalProps {
    isOpen: boolean;
    onClose: () => void;
    users: User[];
    currentUser: User;
}

export const AttendanceMemberControlModal: React.FC<AttendanceMemberControlModalProps> = ({
    isOpen,
    onClose,
    users,
    currentUser
}) => {
    const { toggleUserStatus, removeMember, adjustStatsLocally } = useTeam();
    const { adminAdjustStats, fetchGameLogs } = useGamification(currentUser);
    const { showToast } = useToast();

    // Filters State - Default to 'ACTIVE' and groupByPosition to true
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<StatusFilterType>('ACTIVE');
    const [groupByPosition, setGroupByPosition] = useState<boolean>(true);

    // Active Drawer & History Modal State
    const [activeAdjustUserId, setActiveAdjustUserId] = useState<string | null>(null);
    const [historyModalUser, setHistoryModalUser] = useState<User | null>(null);
    const [togglingUserId, setTogglingUserId] = useState<string | null>(null);

    // Counts for filters
    const counts = useMemo(() => {
        return {
            all: users.length,
            active: users.filter(u => u.isActive).length,
            inactive: users.filter(u => !u.isActive).length,
            lowHp: users.filter(u => (u.hp ?? 100) <= 30).length
        };
    }, [users]);

    // Filter Users
    const filteredUsers = useMemo(() => {
        return users.filter(u => {
            const matchesSearch = 
                u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                u.position?.toLowerCase().includes(searchQuery.toLowerCase());

            if (!matchesSearch) return false;

            if (statusFilter === 'ACTIVE') return u.isActive;
            if (statusFilter === 'INACTIVE') return !u.isActive;
            if (statusFilter === 'LOW_HP') return (u.hp ?? 100) <= 30;

            return true;
        });
    }, [users, searchQuery, statusFilter]);

    // Group Users by Position
    const groupedUsers = useMemo(() => {
        const groups: Record<string, User[]> = {};
        filteredUsers.forEach(u => {
            const pos = u.position?.trim() || 'ยังไม่ระบุตำแหน่ง (Unassigned)';
            if (!groups[pos]) {
                groups[pos] = [];
            }
            groups[pos].push(u);
        });

        return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
    }, [filteredUsers]);

    // Handle Active / Inactive Toggle
    const handleToggleStatus = async (user: User) => {
        setTogglingUserId(user.id);
        try {
            await toggleUserStatus(user.id, user.isActive);
        } finally {
            setTogglingUserId(null);
        }
    };

    // Handle Delete Member
    const handleDeleteMember = async (userId: string) => {
        await removeMember(userId);
    };

    // Toggle HP Adjustment Drawer
    const handleToggleAdjust = (user: User) => {
        setActiveAdjustUserId(prev => prev === user.id ? null : user.id);
    };

    // Save HP Adjustment (Triggers Game Log and Notification)
    const handleSaveAdjustment = async (user: User, amount: number, reason: string): Promise<boolean> => {
        // Optimistic UI Update
        adjustStatsLocally(user.id, { hp: amount });

        try {
            const response = await adminAdjustStats(user.id, { hp: amount }, reason);
            if (response && response.success) {
                showToast(`ปรับ HP ของ ${user.name} (${amount > 0 ? '+' : ''}${amount} HP) และส่งแจ้งเตือนเรียบร้อย ✨`, 'success');
                setActiveAdjustUserId(null);
                return true;
            } else {
                showToast(response?.message || 'การปรับค่า HP ล้มเหลว', 'error');
                return false;
            }
        } catch (err: any) {
            console.error('HP adjustment error:', err);
            showToast('เกิดข้อผิดพลาดในการบันทึก HP', 'error');
            return false;
        }
    };

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div 
                    key="member-control-modal-wrapper"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 z-[2000] flex items-center justify-center p-3 sm:p-4 md:p-6 font-sans select-none"
                >
                    {/* Backdrop with Fade In / Out */}
                    <div 
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-xs"
                    />

                    {/* Modal Container: Fixed Responsive Proportion Height with Scale & Slide Transition */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 15 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ 
                            opacity: 0, 
                            scale: 0.95, 
                            y: 15,
                            transition: { duration: 0.18, ease: "easeIn" }
                        }}
                        transition={{ type: "spring", stiffness: 350, damping: 25 }}
                        className="relative bg-white w-full max-w-2xl h-[85vh] max-h-[750px] min-h-[480px] rounded-3xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden z-10"
                    >
                        {/* Header (Shrink-0) */}
                        <div className="shrink-0">
                            <MemberControlHeader onClose={onClose} />
                        </div>

                        {/* Filters & Search (Shrink-0) */}
                        <div className="shrink-0">
                            <MemberControlFilters 
                                searchQuery={searchQuery}
                                onSearchChange={setSearchQuery}
                                statusFilter={statusFilter}
                                onStatusFilterChange={setStatusFilter}
                                groupByPosition={groupByPosition}
                                onToggleGroupByPosition={() => setGroupByPosition(prev => !prev)}
                                counts={counts}
                            />
                        </div>

                        {/* Member Content Body with Animated Transitions & Flex-1 Scrollable Area */}
                        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 min-h-0 scrollbar-thin">
                            {filteredUsers.length === 0 ? (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="h-full min-h-[220px] flex flex-col items-center justify-center text-center text-gray-400 space-y-2 py-8"
                                >
                                    <Users className="w-12 h-12 mx-auto opacity-30 stroke-1" />
                                    <p className="text-sm font-bold text-gray-600">ไม่พบสมาชิกตามเงื่อนไขที่ค้นหา</p>
                                    <p className="text-xs text-gray-400 max-w-xs">ลองพิมพ์ค้นหาด้วยคำอื่น หรือสลับแท็บสถานะเพื่อดูสมาชิกกลุ่มอื่น</p>
                                </motion.div>
                            ) : (
                                <AnimatePresence mode="wait">
                                    {groupByPosition ? (
                                        /* Grouped View Transition */
                                        <motion.div 
                                            key="grouped-view"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            transition={{ duration: 0.22, ease: "easeOut" }}
                                            className="space-y-4"
                                        >
                                            {groupedUsers.map(([positionName, members], idx) => (
                                                <motion.div
                                                    key={positionName}
                                                    initial={{ opacity: 0, y: 8 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ duration: 0.2, delay: idx * 0.03 }}
                                                >
                                                    <MemberPositionSection 
                                                        positionName={positionName}
                                                        members={members}
                                                        activeAdjustUserId={activeAdjustUserId}
                                                        onToggleAdjust={handleToggleAdjust}
                                                        onSaveAdjustment={handleSaveAdjustment}
                                                        onToggleStatus={handleToggleStatus}
                                                        onDeleteMember={handleDeleteMember}
                                                        onViewHistory={(user) => setHistoryModalUser(user)}
                                                        togglingUserId={togglingUserId}
                                                    />
                                                </motion.div>
                                            ))}
                                        </motion.div>
                                    ) : (
                                        /* Flat List View Transition */
                                        <motion.div 
                                            key="flat-list-view"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            transition={{ duration: 0.22, ease: "easeOut" }}
                                            className="space-y-2.5"
                                        >
                                            {filteredUsers.map((user, idx) => (
                                                <motion.div
                                                    key={user.id}
                                                    initial={{ opacity: 0, y: 6 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ duration: 0.18, delay: Math.min(idx * 0.02, 0.25) }}
                                                >
                                                    <MemberControlCard 
                                                        user={user}
                                                        isAdjusting={activeAdjustUserId === user.id}
                                                        onToggleAdjust={() => handleToggleAdjust(user)}
                                                        onSaveAdjustment={handleSaveAdjustment}
                                                        onToggleStatus={handleToggleStatus}
                                                        onDeleteMember={handleDeleteMember}
                                                        onViewHistory={(u) => setHistoryModalUser(u)}
                                                        isTogglingStatus={togglingUserId === user.id}
                                                    />
                                                </motion.div>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            )}
                        </div>

                        {/* Footer Summary (Shrink-0) */}
                        <div className="shrink-0 p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between text-xs text-gray-500 font-medium">
                            <div>
                                แสดงผล <span className="font-black text-gray-900">{filteredUsers.length}</span> จาก <span className="font-bold text-gray-700">{users.length}</span> คน
                                {groupByPosition && <span className="text-indigo-600 font-bold ml-1.5">({groupedUsers.length} ตำแหน่ง)</span>}
                            </div>
                            <button
                                onClick={onClose}
                                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-bold transition-colors cursor-pointer text-xs active:scale-95"
                            >
                                ปิดหน้าต่าง
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}

            {/* History Logs Modal */}
            <MemberHistoryModal 
                isOpen={!!historyModalUser}
                onClose={() => setHistoryModalUser(null)}
                user={historyModalUser}
                fetchGameLogs={fetchGameLogs}
            />
        </AnimatePresence>,
        document.body
    );
};
