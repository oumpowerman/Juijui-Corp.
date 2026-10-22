import { useState, useMemo, useEffect } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import {
    ShootTripRecord,
    ShootRoundKey,
    ShootDateFilterPreset,
    ShootTripQueryParams,
    ShootTripPaginatedResult
} from '../../../types';
import { getActiveOrgIdSync } from '../../../lib/tenantStorage';
import { getDefaultYearMonth } from './historyUtils';

export interface UseTripHistoryPaginationParams {
    fallbackRecords: ShootTripRecord[];
    fetchPaginatedShootTrips: (params: ShootTripQueryParams) => Promise<ShootTripPaginatedResult>;
}

export const useTripHistoryPagination = ({
    fallbackRecords,
    fetchPaginatedShootTrips
}: UseTripHistoryPaginationParams) => {
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

    return {
        // Search & Filter State
        searchInput,
        setSearchInput,
        statusFilter,
        datePreset,
        customMonth,
        setCustomMonth,
        dateFrom,
        setDateFrom,
        dateTo,
        setDateTo,
        hasActiveFilters,

        // Handlers
        handleStatusChange,
        handleDatePresetChange,
        handlePageSizeChange,
        handleClearAllFilters,

        // Pagination
        page,
        setPage,
        pageSize,
        totalCount,
        totalPages,

        // Data & Status
        displayedRecords,
        summaryCounts,
        showInitialBlockingLoader,
        isFetching,

        // Modal Controls
        selectedTrip,
        setSelectedTrip,
        selectedRoundTab,
        setSelectedRoundTab,
        itemFilterMode,
        setItemFilterMode,
        handleOpenDetail
    };
};
