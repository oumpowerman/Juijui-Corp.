import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import {
    Search,
    CheckCircle2,
    Clock,
    Trash2,
    Play,
    Eye,
    X,
    PackageCheck,
    Truck,
    ArchiveRestore,
    User as UserIcon,
    Calendar,
    FileText,
    Layout,
    Check,
    XCircle,
    ChevronLeft,
    ChevronRight,
    Loader2,
    RotateCcw
} from 'lucide-react';
import { ShootTripRecord, ShootRoundKey, ShootRoundReport } from '../../types';
import { getActiveOrgIdSync } from '../../lib/tenantStorage';
import {
    SHOOT_ROUND_META,
    ShootDateFilterPreset,
    ShootTripQueryParams,
    ShootTripPaginatedResult
} from '../../context/ChecklistContext';

interface ShootTripHistoryViewProps {
    records: ShootTripRecord[];
    activeTripId?: string;
    onResumeTrip: (trip: ShootTripRecord) => Promise<void>;
    onDeleteTrip: (tripId: string) => Promise<void>;
    fetchPaginatedShootTrips: (params: ShootTripQueryParams) => Promise<ShootTripPaginatedResult>;
}

const ROUND_ORDER: ShootRoundKey[] = ['PACK_OUT', 'PACK_BACK', 'RETURN_STORAGE'];
const PAGE_SIZE_OPTIONS = [10, 20, 50];

const getDefaultYearMonth = () => {
    const d = new Date();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${d.getFullYear()}-${m}`;
};

const formatDateTime = (iso?: string) => {
    if (!iso) return '-';
    try {
        const d = new Date(iso);
        return d.toLocaleDateString('th-TH', {
            day: 'numeric',
            month: 'short',
            year: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch {
        return '-';
    }
};

const formatTimeOnly = (iso?: string) => {
    if (!iso) return '-';
    try {
        const d = new Date(iso);
        return d.toLocaleTimeString('th-TH', {
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch {
        return '-';
    }
};

const buildPageNumbers = (currentPage: number, totalPages: number): (number | 'ELLIPSIS')[] => {
    if (totalPages <= 7) {
        return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | 'ELLIPSIS')[] = [1];
    if (currentPage > 3) {
        pages.push('ELLIPSIS');
    }
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let p = start; p <= end; p++) {
        pages.push(p);
    }
    if (currentPage < totalPages - 2) {
        pages.push('ELLIPSIS');
    }
    pages.push(totalPages);
    return pages;
};

const ShootTripHistoryView: React.FC<ShootTripHistoryViewProps> = ({
    records: fallbackRecords,
    activeTripId,
    onResumeTrip,
    onDeleteTrip,
    fetchPaginatedShootTrips
}) => {
    const [activeOrgId, setActiveOrgId] = useState<string>(() => getActiveOrgIdSync());

    // Filter & Pagination State
    const [searchInput, setSearchInput] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'IN_PROGRESS' | 'COMPLETED'>('ALL');
    const [datePreset, setDatePreset] = useState<ShootDateFilterPreset>('ALL');
    const [customMonth, setCustomMonth] = useState<string>(() => getDefaultYearMonth());
    const [dateFrom, setDateFrom] = useState<string>('');
    const [dateTo, setDateTo] = useState<string>('');
    const [page, setPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(10);

    // Detail Modal State
    const [selectedTrip, setSelectedTrip] = useState<ShootTripRecord | null>(null);
    const [selectedRoundTab, setSelectedRoundTab] = useState<ShootRoundKey>('PACK_OUT');
    const [itemFilterMode, setItemFilterMode] = useState<'ALL' | 'UNCHECKED'>('ALL');

    // Multi-Tenant Workspace Switch Listener (Rule 4 of AGENTS.md)
    useEffect(() => {
        const handleWorkspaceSwitch = (e: Event) => {
            const customEvent = e as CustomEvent<{ orgId?: string }>;
            const nextOrgId = customEvent.detail?.orgId || getActiveOrgIdSync();
            setActiveOrgId(nextOrgId);
            setPage(1);
            setSelectedTrip(null);
        };
        window.addEventListener('org-workspace-switched', handleWorkspaceSwitch);
        return () => window.removeEventListener('org-workspace-switched', handleWorkspaceSwitch);
    }, []);

    // Debounce search query (300ms) & reset page to 1
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchInput.trim());
            setPage(1);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchInput]);

    // Reset to page 1 when filters or page size change
    const handleStatusChange = (nextStatus: 'ALL' | 'IN_PROGRESS' | 'COMPLETED') => {
        setStatusFilter(nextStatus);
        setPage(1);
    };

    const handleDatePresetChange = (nextPreset: ShootDateFilterPreset) => {
        setDatePreset(nextPreset);
        setPage(1);
    };

    const handlePageSizeChange = (nextSize: number) => {
        setPageSize(nextSize);
        setPage(1);
    };

    const handleClearAllFilters = () => {
        setSearchInput('');
        setDebouncedSearch('');
        setStatusFilter('ALL');
        setDatePreset('ALL');
        setDateFrom('');
        setDateTo('');
        setPage(1);
    };

    const effectiveMonthKey = datePreset === 'CUSTOM_MONTH' ? customMonth : '';

    // Build instant local page from already-cached fallbackRecords (Stale-While-Revalidate)
    const localInstantData = useMemo<ShootTripPaginatedResult | undefined>(() => {
        if (fallbackRecords.length === 0) return undefined;
        if (datePreset !== 'ALL') return undefined;

        const q = debouncedSearch.toLowerCase();
        const searchMatched = fallbackRecords.filter(rec => {
            if (!q) return true;
            const matchTitle = rec.title?.toLowerCase().includes(q);
            const matchPreset = rec.presetName?.toLowerCase().includes(q);
            const matchItem = Object.values(rec.rounds || {}).some(r =>
                r?.items?.some(
                    i =>
                        i.text.toLowerCase().includes(q) ||
                        i.checkedByName?.toLowerCase().includes(q)
                )
            );
            return Boolean(matchTitle || matchPreset || matchItem);
        });

        const inProgCount = searchMatched.filter(
            r => !(r.rounds?.PACK_OUT && r.rounds?.PACK_BACK && r.rounds?.RETURN_STORAGE)
        ).length;
        const compCount = searchMatched.length - inProgCount;

        const statusMatched = searchMatched.filter(rec => {
            if (statusFilter === 'ALL') return true;
            const isAllDone = Boolean(
                rec.rounds?.PACK_OUT && rec.rounds?.PACK_BACK && rec.rounds?.RETURN_STORAGE
            );
            return (isAllDone ? 'COMPLETED' : 'IN_PROGRESS') === statusFilter;
        });

        const from = (page - 1) * pageSize;
        const to = from + pageSize;
        const slice = statusMatched.slice(from, to);

        return {
            records: slice,
            totalCount: statusMatched.length,
            totalPages: Math.max(1, Math.ceil(statusMatched.length / pageSize)),
            page,
            pageSize,
            summaryCounts: {
                all: searchMatched.length,
                inProgress: inProgCount,
                completed: compCount
            },
            storageSource: 'SQL_TABLE'
        };
    }, [fallbackRecords, datePreset, debouncedSearch, statusFilter, page, pageSize]);

    // Server-side Paginated Query with Tenant-Isolated Query Key & Silent Background Revalidation
    const {
        data: remotePaginatedData,
        isLoading,
        isFetching
    } = useQuery({
        queryKey: [
            'shoot_trip_paginated',
            activeOrgId,
            page,
            pageSize,
            debouncedSearch,
            statusFilter,
            datePreset,
            effectiveMonthKey,
            dateFrom,
            dateTo
        ],
        queryFn: () =>
            fetchPaginatedShootTrips({
                page,
                pageSize,
                searchQuery: debouncedSearch,
                statusFilter,
                datePreset,
                customMonth: effectiveMonthKey,
                dateFrom,
                dateTo
            }),
        placeholderData: keepPreviousData,
        staleTime: 1000 * 15,
        gcTime: 1000 * 60 * 5,
        refetchOnMount: 'always'
    });

    const paginatedData = remotePaginatedData || localInstantData;
    const showInitialBlockingLoader = isLoading && !paginatedData;

    const displayedRecords = paginatedData?.records || [];
    const totalCount = paginatedData?.totalCount ?? 0;
    const totalPages = paginatedData?.totalPages ?? 1;
    const summaryCounts = paginatedData?.summaryCounts || {
        all: fallbackRecords.length,
        inProgress: fallbackRecords.filter(
            r => !(r.rounds?.PACK_OUT && r.rounds?.PACK_BACK && r.rounds?.RETURN_STORAGE)
        ).length,
        completed: fallbackRecords.filter(r =>
            Boolean(r.rounds?.PACK_OUT && r.rounds?.PACK_BACK && r.rounds?.RETURN_STORAGE)
        ).length
    };

    const hasActiveFilters =
        Boolean(debouncedSearch) || statusFilter !== 'ALL' || datePreset !== 'ALL';

    const handleOpenDetail = (trip: ShootTripRecord, initialRound?: ShootRoundKey) => {
        setSelectedTrip(trip);
        if (initialRound && trip.rounds?.[initialRound]) {
            setSelectedRoundTab(initialRound);
        } else if (trip.rounds?.RETURN_STORAGE) {
            setSelectedRoundTab('RETURN_STORAGE');
        } else if (trip.rounds?.PACK_BACK) {
            setSelectedRoundTab('PACK_BACK');
        } else {
            setSelectedRoundTab('PACK_OUT');
        }
        setItemFilterMode('ALL');
    };

    const currentDetailRoundReport: ShootRoundReport | undefined =
        selectedTrip?.rounds?.[selectedRoundTab];

    const groupedDetailItems = useMemo(() => {
        if (!currentDetailRoundReport?.items) return {};
        const groups: Record<string, typeof currentDetailRoundReport.items> = {};
        currentDetailRoundReport.items.forEach(item => {
            if (itemFilterMode === 'UNCHECKED' && item.isChecked) return;
            const groupName = item.categoryLabel || 'อุปกรณ์ทั่วไป';
            if (!groups[groupName]) groups[groupName] = [];
            groups[groupName].push(item);
        });
        return groups;
    }, [currentDetailRoundReport, itemFilterMode]);

    const getRoundIcon = (rk: ShootRoundKey) => {
        switch (rk) {
            case 'PACK_OUT':
                return <PackageCheck className="w-4 h-4" />;
            case 'PACK_BACK':
                return <Truck className="w-4 h-4" />;
            case 'RETURN_STORAGE':
                return <ArchiveRestore className="w-4 h-4" />;
        }
    };

    const pageNumbers = useMemo(
        () => buildPageNumbers(page, totalPages),
        [page, totalPages]
    );

    const rangeStart = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
    const rangeEnd = Math.min(totalCount, page * pageSize);

    return (
        <div className="space-y-4">
            {/* SQL Search, Date/Month Filter & Status Bar */}
            <div className="bg-white/80 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl border border-white/60 shadow-sm space-y-3">
                {/* Row 1: Search Input + Status Filter Tabs */}
                <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
                    <div className="relative flex-1">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            value={searchInput}
                            onChange={e => setSearchInput(e.target.value)}
                            placeholder="ค้นหาชื่อคิวออกกอง, ชื่อชุด Preset, อุปกรณ์ หรือชื่อคนติ๊ก..."
                            className="w-full pl-10 pr-9 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-indigo-400 transition-all"
                        />
                        {searchInput && (
                            <button
                                type="button"
                                onClick={() => setSearchInput('')}
                                className="p-1.5 text-gray-400 hover:text-gray-600 absolute right-2 top-1/2 -translate-y-1/2 rounded-lg"
                                title="ล้างคำค้นหา"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
                        <button
                            type="button"
                            onClick={() => handleStatusChange('ALL')}
                            className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all min-h-[40px] ${
                                statusFilter === 'ALL'
                                    ? 'bg-slate-900 text-white shadow-sm'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            ทั้งหมด ({summaryCounts.all})
                        </button>
                        <button
                            type="button"
                            onClick={() => handleStatusChange('IN_PROGRESS')}
                            className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all min-h-[40px] flex items-center gap-1.5 ${
                                statusFilter === 'IN_PROGRESS'
                                    ? 'bg-amber-500 text-white shadow-sm'
                                    : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                            }`}
                        >
                            <Clock className="w-3.5 h-3.5" />
                            <span>กำลังออกกอง ({summaryCounts.inProgress})</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => handleStatusChange('COMPLETED')}
                            className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all min-h-[40px] flex items-center gap-1.5 ${
                                statusFilter === 'COMPLETED'
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            }`}
                        >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>คืนคลังครบแล้ว ({summaryCounts.completed})</span>
                        </button>
                    </div>
                </div>

                {/* Row 2: Month / Date Range Filter Controls */}
                <div className="pt-2.5 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
                        <span className="text-xs font-semibold text-gray-500 flex items-center gap-1 mr-1 shrink-0">
                            <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                            <span>ช่วงเวลา:</span>
                        </span>

                        {(
                            [
                                { key: 'ALL', label: 'ทุกช่วงเวลา' },
                                { key: 'THIS_MONTH', label: 'เดือนนี้' },
                                { key: 'LAST_MONTH', label: 'เดือนที่แล้ว' },
                                { key: 'CUSTOM_MONTH', label: 'เลือกเดือน' },
                                { key: 'CUSTOM_RANGE', label: 'กำหนดช่วงวันที่' }
                            ] as { key: ShootDateFilterPreset; label: string }[]
                        ).map(opt => (
                            <button
                                key={opt.key}
                                type="button"
                                onClick={() => handleDatePresetChange(opt.key)}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all min-h-[34px] ${
                                    datePreset === opt.key
                                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold'
                                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-transparent'
                                }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>

                    {/* Conditional Month Picker or Custom Date Range Inputs */}
                    <div className="flex items-center gap-2 flex-wrap">
                        {datePreset === 'CUSTOM_MONTH' && (
                            <input
                                type="month"
                                value={customMonth}
                                onChange={e => {
                                    setCustomMonth(e.target.value);
                                    setPage(1);
                                }}
                                className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none focus:border-indigo-400 min-h-[36px]"
                            />
                        )}

                        {datePreset === 'CUSTOM_RANGE' && (
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <input
                                    type="date"
                                    value={dateFrom}
                                    onChange={e => {
                                        setDateFrom(e.target.value);
                                        setPage(1);
                                    }}
                                    className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none focus:border-indigo-400 min-h-[36px]"
                                />
                                <span className="text-xs text-gray-400 font-semibold">ถึง</span>
                                <input
                                    type="date"
                                    value={dateTo}
                                    onChange={e => {
                                        setDateTo(e.target.value);
                                        setPage(1);
                                    }}
                                    className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none focus:border-indigo-400 min-h-[36px]"
                                />
                            </div>
                        )}

                        {hasActiveFilters && (
                            <button
                                type="button"
                                onClick={handleClearAllFilters}
                                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors flex items-center gap-1 min-h-[34px]"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>ล้างตัวกรอง</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Loading Indicator */}
            {showInitialBlockingLoader ? (
                <div className="bg-white/90 rounded-3xl border border-gray-100 p-12 text-center space-y-3">
                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto" />
                    <p className="text-sm font-semibold text-gray-600">
                        กำลังดึงข้อมูลประวัติการออกกอง...
                    </p>
                </div>
            ) : displayedRecords.length === 0 ? (
                <div className="bg-white/90 rounded-3xl border border-gray-100 p-12 text-center space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto">
                        <PackageCheck className="w-7 h-7" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800">
                        {hasActiveFilters
                            ? 'ไม่พบประวัติการออกกองตามตัวกรองที่เลือก'
                            : 'ยังไม่มีประวัติรายงานการออกกอง'}
                    </h3>
                    <p className="text-sm text-gray-500 max-w-md mx-auto">
                        {hasActiveFilters
                            ? 'ลองเปลี่ยนคำค้นหา หรือปรับตัวกรองช่วงเวลาและสถานะเพื่อดูรายการอื่น'
                            : 'เมื่อทีมงานติ๊กเช็คอุปกรณ์และกดส่งรายงานในแต่ละรอบ (หยิบออกคลัง / ยกกลับ / คืนเข้าคลัง) ประวัติจะถูกบันทึกไว้ที่นี่โดยอัตโนมัติ'}
                    </p>
                    {hasActiveFilters && (
                        <button
                            type="button"
                            onClick={handleClearAllFilters}
                            className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-colors"
                        >
                            แสดงประวัติทั้งหมด
                        </button>
                    )}
                </div>
            ) : (
                <div className="space-y-3.5 relative">
                    {isFetching && (
                        <div className="flex items-center justify-end gap-1.5 text-xs font-semibold text-indigo-600 px-1">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>กำลังอัปเดตข้อมูล...</span>
                        </div>
                    )}

                    {displayedRecords.map(trip => {
                        const isAllDone = Boolean(
                            trip.rounds?.PACK_OUT &&
                                trip.rounds?.PACK_BACK &&
                                trip.rounds?.RETURN_STORAGE
                        );
                        const isCurrentlyActive = activeTripId === trip.id;

                        const nextPendingRound: ShootRoundKey | null = !trip.rounds?.PACK_OUT
                            ? 'PACK_OUT'
                            : !trip.rounds?.PACK_BACK
                              ? 'PACK_BACK'
                              : !trip.rounds?.RETURN_STORAGE
                                ? 'RETURN_STORAGE'
                                : null;

                        return (
                            <div
                                key={trip.id}
                                className={`bg-white/75 backdrop-blur-md rounded-2xl border transition-all overflow-hidden shadow-sm hover:shadow-md ${
                                    isCurrentlyActive
                                        ? 'border-indigo-400 ring-2 ring-indigo-200/50'
                                        : 'border-white/60'
                                }`}
                            >
                                {/* Top Card Header */}
                                <div className="p-4 sm:p-5 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="space-y-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h3 className="font-bold text-gray-900 text-base sm:text-lg truncate">
                                                {trip.title}
                                            </h3>
                                            {isAllDone ? (
                                                <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                    ครบทั้ง 3 รอบ
                                                </span>
                                            ) : (
                                                <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    รอ
                                                    {nextPendingRound
                                                        ? SHOOT_ROUND_META[nextPendingRound].label
                                                        : 'ดำเนินการ'}
                                                </span>
                                            )}
                                            {isCurrentlyActive && (
                                                <span className="px-2 py-0.5 rounded-lg text-[11px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-200">
                                                    คิวปัจจุบัน
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                                            {trip.presetName && (
                                                <span className="flex items-center gap-1 font-semibold text-gray-600">
                                                    <Layout className="w-3.5 h-3.5 text-indigo-500" />
                                                    ชุด: {trip.presetName}
                                                </span>
                                            )}
                                            <span className="flex items-center gap-1 tabular-nums">
                                                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                                อัปเดตล่าสุด {formatDateTime(trip.updatedAt)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Card Actions */}
                                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                                        {!isAllDone && nextPendingRound && (
                                            <button
                                                type="button"
                                                onClick={() => onResumeTrip(trip)}
                                                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 min-h-[40px]"
                                            >
                                                <Play className="w-3.5 h-3.5 fill-current" />
                                                <span>
                                                    ทำต่อ: {SHOOT_ROUND_META[nextPendingRound].shortLabel}
                                                </span>
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => handleOpenDetail(trip)}
                                            className="px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-all flex items-center gap-1.5 min-h-[40px]"
                                        >
                                            <Eye className="w-3.5 h-3.5" />
                                            <span>ดูรายงาน</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => onDeleteTrip(trip.id)}
                                            className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
                                            title="ลบประวัตินี้"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* 3-Round Progress Strip */}
                                <div className="p-3 sm:p-4 bg-gray-50/60 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                    {ROUND_ORDER.map(roundKey => {
                                        const meta = SHOOT_ROUND_META[roundKey];
                                        const rep = trip.rounds?.[roundKey];
                                        const isComplete =
                                            rep &&
                                            rep.totalCount > 0 &&
                                            rep.checkedCount === rep.totalCount;

                                        return (
                                            <button
                                                key={roundKey}
                                                type="button"
                                                onClick={() => handleOpenDetail(trip, roundKey)}
                                                className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between gap-2 ${
                                                    rep
                                                        ? isComplete
                                                            ? 'bg-white border-emerald-200 hover:border-emerald-300 shadow-sm'
                                                            : 'bg-white border-amber-200 hover:border-amber-300 shadow-sm'
                                                        : 'bg-gray-100/70 border-dashed border-gray-200 text-gray-400 hover:bg-gray-100'
                                                }`}
                                            >
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800">
                                                        <span
                                                            className={
                                                                rep
                                                                    ? isComplete
                                                                        ? 'text-emerald-600'
                                                                        : 'text-amber-600'
                                                                    : 'text-gray-400'
                                                            }
                                                        >
                                                            {getRoundIcon(roundKey)}
                                                        </span>
                                                        <span className="truncate">{meta.shortLabel}</span>
                                                    </div>
                                                    {rep ? (
                                                        <div className="text-[11px] text-gray-500 mt-1 truncate">
                                                            ส่งโดย{' '}
                                                            <span className="font-semibold text-gray-700">
                                                                {rep.submittedByName}
                                                            </span>{' '}
                                                            •{' '}
                                                            <span className="tabular-nums">
                                                                {formatTimeOnly(rep.submittedAt)} น.
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <div className="text-[11px] text-gray-400 mt-1">
                                                            ยังไม่ได้ส่งรายงานรอบนี้
                                                        </div>
                                                    )}
                                                </div>

                                                {rep ? (
                                                    <div className="shrink-0 text-right">
                                                        <span
                                                            className={`px-2 py-0.5 rounded-lg text-xs font-bold tabular-nums ${
                                                                isComplete
                                                                    ? 'bg-emerald-50 text-emerald-700'
                                                                    : 'bg-amber-50 text-amber-700'
                                                            }`}
                                                        >
                                                            {rep.checkedCount}/{rep.totalCount}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-[11px] font-semibold text-gray-400 shrink-0">
                                                        รอเช็ค
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}

                    {/* Numbered Page Pagination & Page Size Selector Bar */}
                    <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
                        {/* Left: Range Summary & Page Size Selector */}
                        <div className="flex items-center gap-3 flex-wrap justify-center sm:justify-start w-full sm:w-auto">
                            <span className="text-xs font-semibold text-gray-600 tabular-nums">
                                แสดง <span className="font-bold text-gray-900">{rangeStart}</span>–
                                <span className="font-bold text-gray-900">{rangeEnd}</span> จากทั้งหมด{' '}
                                <span className="font-bold text-indigo-600">{totalCount}</span> คิวออกกอง
                            </span>

                            <div className="flex items-center gap-1.5">
                                <span className="text-xs text-gray-400">|</span>
                                <label className="text-xs font-semibold text-gray-500">
                                    แสดงหน้าละ:
                                </label>
                                <select
                                    value={pageSize}
                                    onChange={e => handlePageSizeChange(Number(e.target.value))}
                                    className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 focus:outline-none focus:border-indigo-400 min-h-[36px]"
                                >
                                    {PAGE_SIZE_OPTIONS.map(size => (
                                        <option key={size} value={size}>
                                            {size} รายการ
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Right: Page Number Buttons */}
                        {totalPages > 1 && (
                            <div className="flex items-center gap-1 flex-wrap justify-center">
                                <button
                                    type="button"
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page <= 1}
                                    className="px-2.5 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold disabled:opacity-40 disabled:pointer-events-none transition-all min-w-[40px] min-h-[40px] flex items-center justify-center gap-1"
                                    title="หน้าก่อนหน้า"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                    <span className="hidden sm:inline">ก่อนหน้า</span>
                                </button>

                                {pageNumbers.map((item, idx) =>
                                    item === 'ELLIPSIS' ? (
                                        <span
                                            key={`ellipsis-${idx}`}
                                            className="px-2 text-xs font-bold text-gray-400 select-none"
                                        >
                                            ...
                                        </span>
                                    ) : (
                                        <button
                                            key={item}
                                            type="button"
                                            onClick={() => setPage(item)}
                                            className={`min-w-[40px] min-h-[40px] px-3 py-2 rounded-xl text-xs font-bold tabular-nums transition-all flex items-center justify-center ${
                                                page === item
                                                    ? 'bg-indigo-600 text-white shadow-sm'
                                                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                                            }`}
                                        >
                                            {item}
                                        </button>
                                    )
                                )}

                                <button
                                    type="button"
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page >= totalPages}
                                    className="px-2.5 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold disabled:opacity-40 disabled:pointer-events-none transition-all min-w-[40px] min-h-[40px] flex items-center justify-center gap-1"
                                    title="หน้าถัดไป"
                                >
                                    <span className="hidden sm:inline">ถัดไป</span>
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Trip Detail Modal (3-Layer Flexbox Contract) */}
            {selectedTrip &&
                createPortal(
                    <div
                        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
                        onClick={() => setSelectedTrip(null)}
                    >
                        <div
                            className="w-full max-w-2xl max-h-[92vh] sm:max-h-[85vh] flex flex-col bg-white rounded-t-[2rem] sm:rounded-3xl shadow-2xl overflow-hidden border border-gray-100 animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* 1. Rigid Header */}
                            <div className="flex-shrink-0 px-5 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                                <div className="min-w-0 pr-3">
                                    <h3 className="font-bold text-gray-900 text-base sm:text-lg truncate">
                                        {selectedTrip.title}
                                    </h3>
                                    <p className="text-xs text-gray-500 font-medium">
                                        รายละเอียดการเช็คอุปกรณ์รายชิ้นแยกตามรอบ
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSelectedTrip(null)}
                                    className="p-2 -mr-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl min-w-[40px] min-h-[40px] flex items-center justify-center transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* 2. Scrollable Body */}
                            <div className="flex-1 overflow-y-auto overscroll-contain px-5 sm:px-6 py-4 space-y-4">
                                {/* 3-Round Selector Tabs */}
                                <div className="grid grid-cols-3 gap-2 bg-gray-100 p-1.5 rounded-2xl">
                                    {ROUND_ORDER.map(rk => {
                                        const meta = SHOOT_ROUND_META[rk];
                                        const rep = selectedTrip.rounds?.[rk];
                                        const isActive = selectedRoundTab === rk;

                                        return (
                                            <button
                                                key={rk}
                                                type="button"
                                                onClick={() => setSelectedRoundTab(rk)}
                                                className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 min-h-[48px] ${
                                                    isActive
                                                        ? 'bg-white text-indigo-600 shadow-sm'
                                                        : 'text-gray-600 hover:text-gray-900'
                                                }`}
                                            >
                                                <span className="truncate max-w-full">
                                                    {meta.shortLabel}
                                                </span>
                                                {rep ? (
                                                    <span
                                                        className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold tabular-nums ${
                                                            rep.checkedCount === rep.totalCount
                                                                ? 'bg-emerald-50 text-emerald-700'
                                                                : 'bg-amber-50 text-amber-700'
                                                        }`}
                                                    >
                                                        {rep.checkedCount}/{rep.totalCount} ชิ้น
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] text-gray-400 font-medium">
                                                        ยังไม่ส่ง
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>

                                {!currentDetailRoundReport ? (
                                    <div className="py-12 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200 space-y-3">
                                        <Clock className="w-10 h-10 text-gray-300 mx-auto" />
                                        <div className="text-sm font-bold text-gray-700">
                                            ยังไม่มีการส่งรายงานในรอบ "
                                            {SHOOT_ROUND_META[selectedRoundTab].label}"
                                        </div>
                                        <p className="text-xs text-gray-500">
                                            คุณสามารถกดปุ่ม "ทำต่อรอบนี้" ด้านล่างเพื่อโหลดรายการกลับไปเช็คต่อได้ทันที
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        {/* Submitter Info Banner */}
                                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                                            <div className="flex items-center justify-between gap-2 flex-wrap">
                                                <div className="flex items-center gap-2.5">
                                                    {currentDetailRoundReport.submittedByAvatar ? (
                                                        <img
                                                            src={
                                                                currentDetailRoundReport.submittedByAvatar
                                                            }
                                                            alt={
                                                                currentDetailRoundReport.submittedByName
                                                            }
                                                            className="w-9 h-9 rounded-full object-cover border border-white shadow-sm"
                                                            referrerPolicy="no-referrer"
                                                        />
                                                    ) : (
                                                        <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
                                                            <UserIcon className="w-4 h-4" />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <div className="text-xs text-gray-500 font-medium">
                                                            ผู้กดส่งปิดรอบ (
                                                            {currentDetailRoundReport.roundLabel})
                                                        </div>
                                                        <div className="text-sm font-bold text-gray-900">
                                                            {currentDetailRoundReport.submittedByName}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="text-right">
                                                    <div className="text-xs text-gray-500 font-medium">
                                                        เวลาที่ส่ง
                                                    </div>
                                                    <div className="text-xs font-bold text-gray-800 tabular-nums">
                                                        {formatDateTime(
                                                            currentDetailRoundReport.submittedAt
                                                        )}{' '}
                                                        น.
                                                    </div>
                                                </div>
                                            </div>

                                            {currentDetailRoundReport.note && (
                                                <div className="p-2.5 rounded-xl bg-white border border-slate-200/70 text-xs text-gray-700 flex items-start gap-2">
                                                    <FileText className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                                                    <div>
                                                        <span className="font-bold text-gray-800">
                                                            หมายเหตุ:{' '}
                                                        </span>
                                                        {currentDetailRoundReport.note}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Filter All vs Unchecked */}
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-gray-600">
                                                รายการอุปกรณ์ ({currentDetailRoundReport.checkedCount}
                                                /{currentDetailRoundReport.totalCount} ชิ้น)
                                            </span>
                                            <div className="flex items-center gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => setItemFilterMode('ALL')}
                                                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                                                        itemFilterMode === 'ALL'
                                                            ? 'bg-slate-800 text-white'
                                                            : 'bg-gray-100 text-gray-600'
                                                    }`}
                                                >
                                                    ทั้งหมด
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setItemFilterMode('UNCHECKED')}
                                                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                                                        itemFilterMode === 'UNCHECKED'
                                                            ? 'bg-amber-600 text-white'
                                                            : 'bg-amber-50 text-amber-700'
                                                    }`}
                                                >
                                                    เฉพาะที่ไม่ได้ติ๊ก (
                                                    {currentDetailRoundReport.totalCount -
                                                        currentDetailRoundReport.checkedCount}
                                                    )
                                                </button>
                                            </div>
                                        </div>

                                        {/* Categorized Item List with Checker Attribution */}
                                        <div className="space-y-3">
                                            {Object.entries(groupedDetailItems).map(
                                                ([catLabel, catItems]) => (
                                                    <div
                                                        key={catLabel}
                                                        className="rounded-2xl border border-gray-100 overflow-hidden bg-white"
                                                    >
                                                        <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                                                            <span className="text-xs font-bold text-gray-800">
                                                                {catLabel}
                                                            </span>
                                                            <span className="text-[11px] font-semibold text-gray-500 tabular-nums">
                                                                {catItems.filter(i => i.isChecked).length}
                                                                /{catItems.length}
                                                            </span>
                                                        </div>
                                                        <div className="divide-y divide-gray-100">
                                                            {catItems.map((item, idx) => (
                                                                <div
                                                                    key={`${item.itemId}-${idx}`}
                                                                    className={`px-4 py-3 flex items-center justify-between gap-3 ${
                                                                        item.isChecked
                                                                            ? 'bg-white'
                                                                            : 'bg-amber-50/30'
                                                                    }`}
                                                                >
                                                                    <div className="flex items-center gap-3 min-w-0">
                                                                        {item.isChecked ? (
                                                                            <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                                                                                <Check className="w-3.5 h-3.5 stroke-[3px]" />
                                                                            </div>
                                                                        ) : (
                                                                            <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                                                                                <XCircle className="w-4 h-4" />
                                                                            </div>
                                                                        )}
                                                                        <span
                                                                            className={`text-sm font-medium truncate ${
                                                                                item.isChecked
                                                                                    ? 'text-gray-800'
                                                                                    : 'text-amber-900 font-semibold'
                                                                            }`}
                                                                        >
                                                                            {item.text}
                                                                        </span>
                                                                    </div>

                                                                    {item.isChecked ? (
                                                                        <div className="flex items-center gap-1.5 shrink-0 bg-gray-50 px-2.5 py-1 rounded-full border border-gray-100">
                                                                            {item.checkedByAvatar ? (
                                                                                <img
                                                                                    src={
                                                                                        item.checkedByAvatar
                                                                                    }
                                                                                    alt={
                                                                                        item.checkedByName
                                                                                    }
                                                                                    className="w-4 h-4 rounded-full object-cover"
                                                                                    referrerPolicy="no-referrer"
                                                                                />
                                                                            ) : (
                                                                                <UserIcon className="w-3 h-3 text-indigo-500" />
                                                                            )}
                                                                            <span className="text-[11px] font-semibold text-gray-700 max-w-[90px] truncate">
                                                                                {item.checkedByName ||
                                                                                    'ทีมงาน'}
                                                                            </span>
                                                                            {item.checkedAt && (
                                                                                <span className="text-[10px] text-gray-400 tabular-nums">
                                                                                    {formatTimeOnly(
                                                                                        item.checkedAt
                                                                                    )}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    ) : (
                                                                        <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[11px] font-bold shrink-0">
                                                                            ไม่ได้ติ๊ก
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* 3. Rigid Sticky Footer */}
                            <div className="flex-shrink-0 px-5 sm:px-6 py-3.5 bg-gray-50/80 border-t border-gray-100 flex flex-col-reverse sm:flex-row sm:justify-between gap-2 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
                                <button
                                    type="button"
                                    onClick={() => setSelectedTrip(null)}
                                    className="w-full sm:w-auto px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors min-h-[44px]"
                                >
                                    ปิดหน้าต่าง
                                </button>
                                {!(
                                    selectedTrip.rounds?.PACK_OUT &&
                                    selectedTrip.rounds?.PACK_BACK &&
                                    selectedTrip.rounds?.RETURN_STORAGE
                                ) && (
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            const tripToResume = selectedTrip;
                                            setSelectedTrip(null);
                                            await onResumeTrip(tripToResume);
                                        }}
                                        className="w-full sm:w-auto px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 min-h-[44px]"
                                    >
                                        <Play className="w-4 h-4 fill-current" />
                                        <span>ดึงคิวนี้กลับมาเช็คต่อ</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>,
                    document.body
                )}
        </div>
    );
};

export default ShootTripHistoryView;
