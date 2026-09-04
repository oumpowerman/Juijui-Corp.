import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, 
    History, 
    Loader2, 
    Calendar, 
    Heart, 
    Sparkles, 
    Flame, 
    AlertTriangle, 
    CheckCircle2, 
    ChevronDown,
    Filter
} from 'lucide-react';
import { User } from '../../../../../types';
import { format, isToday, isYesterday, isThisWeek, isThisMonth } from 'date-fns';
import { th } from 'date-fns/locale';

export type HistoryFilterType = 'ALL' | 'PENALTY' | 'HEAL' | 'EARNED';

interface MemberHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User | null;
    fetchGameLogs: (userId: string, page?: number, pageSize?: number, filter?: 'ALL' | 'EARNED' | 'SPENT' | 'PENALTY') => Promise<any[]>;
}

const PAGE_SIZE = 25;

export const MemberHistoryModal: React.FC<MemberHistoryModalProps> = ({
    isOpen,
    onClose,
    user,
    fetchGameLogs
}) => {
    const [logs, setLogs] = useState<any[]>([]);
    const [page, setPage] = useState<number>(1);
    const [hasMore, setHasMore] = useState<boolean>(true);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
    const [activeFilter, setActiveFilter] = useState<HistoryFilterType>('ALL');

    // 1. Fetch First Page / When Filter or User Changes
    const loadInitialLogs = useCallback(async (selectedFilter: HistoryFilterType) => {
        if (!user) return;
        setIsLoading(true);
        setPage(1);

        try {
            // Map frontend filter to hook filter
            let apiFilter: 'ALL' | 'EARNED' | 'SPENT' | 'PENALTY' = 'ALL';
            if (selectedFilter === 'PENALTY') apiFilter = 'PENALTY';
            if (selectedFilter === 'EARNED') apiFilter = 'EARNED';

            const data = await fetchGameLogs(user.id, 1, PAGE_SIZE, apiFilter);
            let filteredData = data || [];

            // If filter is HEAL (custom frontend filter for positive HP)
            if (selectedFilter === 'HEAL') {
                filteredData = filteredData.filter(log => (log.hpChange || 0) > 0);
            }

            setLogs(filteredData);
            setHasMore((data || []).length === PAGE_SIZE);
        } catch (err) {
            console.error("Failed to load logs:", err);
            setLogs([]);
            setHasMore(false);
        } finally {
            setIsLoading(false);
        }
    }, [user, fetchGameLogs]);

    useEffect(() => {
        if (isOpen && user) {
            loadInitialLogs(activeFilter);
        } else {
            setLogs([]);
            setPage(1);
            setHasMore(true);
        }
    }, [isOpen, user, activeFilter, loadInitialLogs]);

    // 2. Load More (Pagination)
    const handleLoadMore = async () => {
        if (!user || isLoadingMore || !hasMore) return;
        setIsLoadingMore(true);
        const nextPage = page + 1;

        try {
            let apiFilter: 'ALL' | 'EARNED' | 'SPENT' | 'PENALTY' = 'ALL';
            if (activeFilter === 'PENALTY') apiFilter = 'PENALTY';
            if (activeFilter === 'EARNED') apiFilter = 'EARNED';

            const nextData = await fetchGameLogs(user.id, nextPage, PAGE_SIZE, apiFilter);
            let filteredNextData = nextData || [];

            if (activeFilter === 'HEAL') {
                filteredNextData = filteredNextData.filter(log => (log.hpChange || 0) > 0);
            }

            setLogs(prev => [...prev, ...filteredNextData]);
            setPage(nextPage);
            setHasMore((nextData || []).length === PAGE_SIZE);
        } catch (err) {
            console.error("Failed to load more logs:", err);
            setHasMore(false);
        } finally {
            setIsLoadingMore(false);
        }
    };

    // 3. Mini Summary Stats Calculation
    const summaryStats = useMemo(() => {
        let totalHpLost = 0;
        let totalHpHealed = 0;
        let manualAdjustCount = 0;
        let totalJpEarned = 0;

        logs.forEach(log => {
            const hp = log.hpChange || 0;
            const jp = log.jpChange || 0;

            if (hp < 0) totalHpLost += Math.abs(hp);
            if (hp > 0) totalHpHealed += hp;
            if (jp > 0) totalJpEarned += jp;
            if (log.actionType === 'MANUAL_ADJUST' || log.description?.includes('GM ปรับ')) {
                manualAdjustCount += 1;
            }
        });

        return {
            totalHpLost,
            totalHpHealed,
            manualAdjustCount,
            totalJpEarned
        };
    }, [logs]);

    // 4. Date Grouping (Today, Yesterday, This Week, This Month, Earlier)
    const groupedLogs = useMemo(() => {
        const groups: { title: string; count: number; items: any[] }[] = [
            { title: 'วันนี้ (Today)', count: 0, items: [] },
            { title: 'เมื่อวานนี้ (Yesterday)', count: 0, items: [] },
            { title: 'สัปดาห์นี้ (This Week)', count: 0, items: [] },
            { title: 'เดือนนี้ (This Month)', count: 0, items: [] },
            { title: 'ก่อนหน้านี้ (Earlier)', count: 0, items: [] },
        ];

        logs.forEach(log => {
            const date = new Date(log.createdAt);
            if (isToday(date)) {
                groups[0].items.push(log);
            } else if (isYesterday(date)) {
                groups[1].items.push(log);
            } else if (isThisWeek(date, { weekStartsOn: 1 })) {
                groups[2].items.push(log);
            } else if (isThisMonth(date)) {
                groups[3].items.push(log);
            } else {
                groups[4].items.push(log);
            }
        });

        return groups.filter(g => g.items.length > 0);
    }, [logs]);

    return createPortal(
        <AnimatePresence>
            {isOpen && user && (
                <motion.div 
                    key="member-history-modal-wrapper"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 z-[2100] flex items-center justify-center p-3 sm:p-4 font-sans select-none"
                >
                    {/* Backdrop */}
                    <div 
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-xs"
                    />

                    {/* Modal Content */}
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
                        className="relative bg-white w-full max-w-xl h-[85vh] max-h-[750px] min-h-[480px] rounded-3xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden z-10"
                    >
                        {/* 1. Header (Shrink-0) */}
                        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 via-white to-purple-50/40 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-600/20 shrink-0">
                                    <History className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-black text-gray-900 flex items-center gap-1.5">
                                        ประวัติ Game Logs & HP
                                    </h4>
                                    <p className="text-[11px] text-gray-500 font-medium">
                                        {user.name} • {user.position || 'ไม่มีตำแหน่ง'} • <span className="text-purple-700 font-bold">HP: {user.hp ?? 100}/{user.maxHp ?? 100}</span>
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={onClose}
                                className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* 2. Mini Summary Bar (Shrink-0) */}
                        <div className="px-4 sm:px-5 py-2.5 bg-gray-50/80 border-b border-gray-100 grid grid-cols-3 gap-2 shrink-0">
                            <div className="bg-white p-2 sm:p-2.5 rounded-xl border border-red-100 flex items-center gap-2 shadow-2xs">
                                <div className="w-7 h-7 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                                    <Flame className="w-3.5 h-3.5" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] text-gray-500 font-bold truncate">หัก HP รวม</p>
                                    <p className="text-xs font-black text-red-600 truncate">
                                        -{summaryStats.totalHpLost} HP
                                    </p>
                                </div>
                            </div>

                            <div className="bg-white p-2 sm:p-2.5 rounded-xl border border-emerald-100 flex items-center gap-2 shadow-2xs">
                                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                                    <Heart className="w-3.5 h-3.5 fill-current" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] text-gray-500 font-bold truncate">ฟื้นฟู HP รวม</p>
                                    <p className="text-xs font-black text-emerald-600 truncate">
                                        +{summaryStats.totalHpHealed} HP
                                    </p>
                                </div>
                            </div>

                            <div className="bg-white p-2 sm:p-2.5 rounded-xl border border-purple-100 flex items-center gap-2 shadow-2xs">
                                <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                                    <Sparkles className="w-3.5 h-3.5" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] text-gray-500 font-bold truncate">ปรับโดย Admin</p>
                                    <p className="text-xs font-black text-purple-700 truncate">
                                        {summaryStats.manualAdjustCount} ครั้ง
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* 3. Action Filter Tabs (Shrink-0) */}
                        <div className="px-4 sm:px-5 py-2.5 bg-white border-b border-gray-100 flex items-center gap-1.5 overflow-x-auto shrink-0 scrollbar-none">
                            <button
                                type="button"
                                onClick={() => setActiveFilter('ALL')}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                                    activeFilter === 'ALL'
                                        ? 'bg-gray-900 text-white shadow-xs'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                ทั้งหมด
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveFilter('PENALTY')}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                                    activeFilter === 'PENALTY'
                                        ? 'bg-rose-600 text-white shadow-xs'
                                        : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                                }`}
                            >
                                <AlertTriangle className="w-3.5 h-3.5" />
                                <span>ลด HP / บทลงโทษ</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveFilter('HEAL')}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                                    activeFilter === 'HEAL'
                                        ? 'bg-emerald-600 text-white shadow-xs'
                                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                }`}
                            >
                                <Heart className="w-3.5 h-3.5 fill-current" />
                                <span>เพิ่ม / ฟื้นฟู HP</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveFilter('EARNED')}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                                    activeFilter === 'EARNED'
                                        ? 'bg-amber-600 text-white shadow-xs'
                                        : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                                }`}
                            >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>ได้รับแต้ม JP</span>
                            </button>
                        </div>

                        {/* 4. Content List (Flex-1 Scrollable Area) */}
                        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 min-h-0 scrollbar-thin">
                            {isLoading ? (
                                <div className="h-full min-h-[220px] flex flex-col items-center justify-center text-gray-400 gap-2">
                                    <Loader2 className="w-7 h-7 animate-spin text-purple-600" />
                                    <span className="text-xs font-bold">กำลังโหลดประวัติ Game Logs...</span>
                                </div>
                            ) : logs.length === 0 ? (
                                <div className="h-full min-h-[220px] flex flex-col items-center justify-center text-center text-gray-400 space-y-2 py-8">
                                    <History className="w-10 h-10 mx-auto opacity-30 stroke-1" />
                                    <p className="text-xs sm:text-sm font-bold text-gray-600">ไม่พบประวัติตามเงื่อนไขที่เลือก</p>
                                    <p className="text-[11px] text-gray-400 max-w-xs">ลองสลับตัวกรองหมวดหมู่อื่นเพื่อดูรายการเพิ่มเติม</p>
                                </div>
                            ) : (
                                <>
                                    {/* Date Grouped Sections */}
                                    {groupedLogs.map((group) => (
                                        <div key={group.title} className="space-y-2">
                                            {/* Date Section Header */}
                                            <div className="flex items-center gap-2 px-1">
                                                <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                                                <h5 className="text-[11px] font-black text-gray-600 uppercase tracking-wider">
                                                    {group.title}
                                                </h5>
                                                <span className="text-[10px] font-bold text-gray-400">
                                                    ({group.items.length} รายการ)
                                                </span>
                                            </div>

                                            {/* Items inside Group */}
                                            <div className="space-y-2">
                                                {group.items.map((log) => {
                                                    const isPositiveHp = (log.hpChange || 0) > 0;
                                                    const isNegativeHp = (log.hpChange || 0) < 0;
                                                    const isPositiveJp = (log.jpChange || 0) > 0;
                                                    const isNegativeJp = (log.jpChange || 0) < 0;

                                                    return (
                                                        <div 
                                                            key={log.id}
                                                            className="p-3 sm:p-3.5 rounded-2xl border border-gray-100 bg-white hover:border-purple-200 hover:shadow-xs flex items-center justify-between gap-3 transition-colors shadow-2xs"
                                                        >
                                                            <div className="min-w-0 flex-1">
                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                    <span className="text-xs font-black text-gray-900">
                                                                        {log.description || log.actionType}
                                                                    </span>
                                                                    {log.actionType === 'MANUAL_ADJUST' && (
                                                                        <span className="px-1.5 py-0.5 rounded-md bg-purple-50 text-purple-700 text-[9px] font-black border border-purple-100">
                                                                            GM Adjust
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center gap-1.5 text-[10px] text-gray-400 mt-1">
                                                                    <Calendar className="w-3 h-3" />
                                                                    <span>
                                                                        {log.createdAt ? format(new Date(log.createdAt), 'd MMM yyyy, HH:mm น.', { locale: th }) : '-'}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            {/* Changes Pill */}
                                                            <div className="shrink-0 flex items-center gap-1.5">
                                                                {log.hpChange !== 0 && (
                                                                    <span className={`px-2 py-0.5 rounded-lg text-xs font-black flex items-center gap-0.5 ${
                                                                        isPositiveHp 
                                                                            ? 'bg-emerald-100 text-emerald-700' 
                                                                            : isNegativeHp 
                                                                            ? 'bg-rose-100 text-rose-700' 
                                                                            : 'bg-gray-100 text-gray-600'
                                                                    }`}>
                                                                        {isPositiveHp ? '+' : ''}{log.hpChange} HP
                                                                    </span>
                                                                )}
                                                                {log.jpChange !== 0 && (
                                                                    <span className={`px-1.5 py-0.5 rounded-lg text-[10px] font-bold border ${
                                                                        isPositiveJp 
                                                                            ? 'bg-amber-50 text-amber-700 border-amber-200' 
                                                                            : 'bg-gray-50 text-gray-700 border-gray-200'
                                                                    }`}>
                                                                        {isPositiveJp ? '+' : ''}{log.jpChange} JP
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}

                                    {/* Load More Button */}
                                    {hasMore && (
                                        <div className="pt-2 pb-1 text-center">
                                            <button
                                                type="button"
                                                onClick={handleLoadMore}
                                                disabled={isLoadingMore}
                                                className="px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50 shadow-2xs"
                                            >
                                                {isLoadingMore ? (
                                                    <>
                                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                        <span>กำลังโหลดประวัติเก่า...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <ChevronDown className="w-3.5 h-3.5" />
                                                        <span>โหลดประวัติเพิ่มเติม (หน้าถัดไป)</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* 5. Footer (Shrink-0) */}
                        <div className="p-3.5 border-t border-gray-100 bg-gray-50 flex items-center justify-between shrink-0 text-xs">
                            <span className="text-gray-500 font-medium">
                                โหลดแล้ว <span className="font-black text-gray-900">{logs.length}</span> รายการ
                            </span>
                            <button
                                onClick={onClose}
                                className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl text-xs font-bold transition-colors cursor-pointer active:scale-95"
                            >
                                ปิดหน้าต่าง
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
};
