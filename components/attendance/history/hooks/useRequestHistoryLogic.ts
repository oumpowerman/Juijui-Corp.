import { useState, useMemo, useEffect, useCallback } from 'react';
import { LeaveRequest } from '../../../../types/attendance';

export type FilterStatus = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED';

interface UseRequestHistoryLogicProps {
    requests: LeaveRequest[];
    fetchRequestsForRange?: (start?: Date, end?: Date) => Promise<LeaveRequest[]>;
    isLoadingHistorical?: boolean;
}

export const useRequestHistoryLogic = ({
    requests,
    fetchRequestsForRange,
    isLoadingHistorical = false
}: UseRequestHistoryLogicProps) => {
    const [filter, setFilter] = useState<FilterStatus>('ALL');
    const [isExpanded, setIsExpanded] = useState(false);

    // Month & Year Filter state (default: current month & year)
    const today = useMemo(() => new Date(), []);
    const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
    const [selectedYear, setSelectedYear] = useState(today.getFullYear());
    const [isMonthFilterEnabled, setIsMonthFilterEnabled] = useState(true);

    // Custom Date Range state
    const [isCustomRangeEnabled, setIsCustomRangeEnabled] = useState(false);
    const [customRange, setCustomRange] = useState<{ start: Date; end: Date } | null>(null);
    const [customRangeRequests, setCustomRangeRequests] = useState<LeaveRequest[]>([]);
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
    const [isLocalLoading, setIsLocalLoading] = useState(false);

    // Show All (Full History) state
    const [allRequestsLoaded, setAllRequestsLoaded] = useState<LeaveRequest[]>([]);
    const [hasLoadedAll, setHasLoadedAll] = useState(false);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);

    // Historical Cache & Window Check
    const [historicalCache, setHistoricalCache] = useState<Record<string, LeaveRequest[]>>({});
    
    const sixtyDaysAgo = useMemo(() => {
        const d = new Date();
        d.setDate(d.getDate() - 60);
        return d;
    }, []);

    const isOutsideSixtyDays = useCallback((month: number, year: number) => {
        const endOfSelectedMonth = new Date(year, month + 1, 0, 23, 59, 59);
        return endOfSelectedMonth < sixtyDaysAgo;
    }, [sixtyDaysAgo]);

    // On-Demand Fetching Effect for Monthly Filters
    useEffect(() => {
        if (!isMonthFilterEnabled || isCustomRangeEnabled || !fetchRequestsForRange) return;
        if (!isOutsideSixtyDays(selectedMonth, selectedYear)) return;

        const key = `${selectedYear}-${selectedMonth}`;
        if (historicalCache[key]) return; // already cached

        const loadHistorical = async () => {
            const startOfSelectedMonth = new Date(selectedYear, selectedMonth, 1);
            const endOfSelectedMonth = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59);
            try {
                const data = await fetchRequestsForRange(startOfSelectedMonth, endOfSelectedMonth);
                setHistoricalCache(prev => ({
                    ...prev,
                    [key]: data
                }));
            } catch (err) {
                console.error("Failed to fetch historical requests", err);
            }
        };

        loadHistorical();
    }, [selectedMonth, selectedYear, isMonthFilterEnabled, isCustomRangeEnabled, fetchRequestsForRange, historicalCache, isOutsideSixtyDays]);

    // On-Demand Fetching Effect for Show All (Full History)
    useEffect(() => {
        if (isMonthFilterEnabled || isCustomRangeEnabled) return;
        if (hasLoadedAll || !fetchRequestsForRange) return;

        const loadAll = async () => {
            setIsLocalLoading(true);
            try {
                const data = await fetchRequestsForRange(); // No parameters = ALL
                setAllRequestsLoaded(data);
                setHasLoadedAll(true);
            } catch (err) {
                console.error("Failed to fetch all requests", err);
            } finally {
                setIsLocalLoading(false);
            }
        };

        loadAll();
    }, [isMonthFilterEnabled, isCustomRangeEnabled, hasLoadedAll, fetchRequestsForRange]);

    // Combined Requests (Default 60-day Context + Cached On-Demand)
    const combinedRequests = useMemo(() => {
        const key = `${selectedYear}-${selectedMonth}`;
        const historicalList = (isMonthFilterEnabled && isOutsideSixtyDays(selectedMonth, selectedYear))
            ? (historicalCache[key] || [])
            : [];
        
        const customList = isCustomRangeEnabled ? customRangeRequests : [];
        const showAllList = (!isMonthFilterEnabled && !isCustomRangeEnabled) ? allRequestsLoaded : [];
        
        const all = [...requests, ...historicalList, ...customList, ...showAllList];
        const seen = new Set<string>();
        const uniq = all.filter(item => {
            if (seen.has(item.id)) return false;
            seen.add(item.id);
            return true;
        });

        return uniq.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }, [requests, historicalCache, selectedMonth, selectedYear, isMonthFilterEnabled, isCustomRangeEnabled, customRangeRequests, allRequestsLoaded, isOutsideSixtyDays]);

    const handleCustomRangeConfirm = async (startDate: Date, endDate: Date) => {
        setIsDatePickerOpen(false);
        setCustomRange({ start: startDate, end: endDate });
        setIsCustomRangeEnabled(true);
        setIsMonthFilterEnabled(false);
        setCurrentPage(1);

        if (fetchRequestsForRange) {
            setIsLocalLoading(true);
            try {
                const data = await fetchRequestsForRange(startDate, endDate);
                setCustomRangeRequests(data);
            } catch (err) {
                console.error("Failed to fetch custom range requests", err);
            } finally {
                setIsLocalLoading(false);
            }
        }
    };

    const formatThaiRange = (start: Date, end: Date) => {
        const months = [
            'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
            'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
        ];
        const startDay = start.getDate();
        const startMonth = months[start.getMonth()];
        const startYear = start.getFullYear() + 543;

        const endDay = end.getDate();
        const endMonth = months[end.getMonth()];
        const endYear = end.getFullYear() + 543;

        return `${startDay} ${startMonth} ${startYear} - ${endDay} ${endMonth} ${endYear}`;
    };

    const showLoading = isLoadingHistorical || isLocalLoading;

    const handlePrevMonth = () => {
        if (selectedMonth === 0) {
            setSelectedMonth(11);
            setSelectedYear(prev => prev - 1);
        } else {
            setSelectedMonth(prev => prev - 1);
        }
        setCurrentPage(1);
    };

    const handleNextMonth = () => {
        if (selectedMonth === 11) {
            setSelectedMonth(0);
            setSelectedYear(prev => prev + 1);
        } else {
            setSelectedMonth(prev => prev + 1);
        }
        setCurrentPage(1);
    };

    const getThaiMonthYearLabel = (month: number, year: number) => {
        const months = [
            'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
            'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
        ];
        return `${months[month]} ${year + 543}`;
    };

    // Overall Stats for Collapsed Header Badges
    const overallStats = useMemo(() => ({
        pending: combinedRequests.filter(r => r.status === 'PENDING').length,
        rejected: combinedRequests.filter(r => r.status === 'REJECTED').length
    }), [combinedRequests]);

    // 1. Filter by Month/Year first OR Custom Date Range
    const monthFilteredRequests = useMemo(() => {
        return combinedRequests.filter(req => {
            if (isCustomRangeEnabled && customRange) {
                const reqDate = new Date(req.startDate);
                const start = new Date(customRange.start.getFullYear(), customRange.start.getMonth(), customRange.start.getDate());
                const end = new Date(customRange.end.getFullYear(), customRange.end.getMonth(), customRange.end.getDate(), 23, 59, 59);
                return reqDate >= start && reqDate <= end;
            }
            if (!isMonthFilterEnabled) return true;
            const start = new Date(req.startDate);
            return start.getMonth() === selectedMonth && start.getFullYear() === selectedYear;
        });
    }, [combinedRequests, selectedMonth, selectedYear, isMonthFilterEnabled, isCustomRangeEnabled, customRange]);

    // 2. Compute Tab Stats based on month/year filtered requests
    const stats = useMemo(() => ({
        pending: monthFilteredRequests.filter(r => r.status === 'PENDING').length,
        rejected: monthFilteredRequests.filter(r => r.status === 'REJECTED').length,
        approved: monthFilteredRequests.filter(r => r.status === 'APPROVED').length
    }), [monthFilteredRequests]);

    // 3. Filter by Status Tab
    const finalRequests = useMemo(() => {
        return monthFilteredRequests.filter(r => {
            if (filter === 'ALL') return true;
            return r.status === filter;
        });
    }, [monthFilteredRequests, filter]);

    // 4. Calculate pagination bounds and slice
    const totalPages = Math.max(1, Math.ceil(finalRequests.length / itemsPerPage));
    const paginatedRequests = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return finalRequests.slice(startIndex, startIndex + itemsPerPage);
    }, [finalRequests, currentPage, itemsPerPage]);

    // Keep currentPage within bounds when items change
    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [totalPages, currentPage]);

    return {
        filter,
        setFilter,
        isExpanded,
        setIsExpanded,
        selectedMonth,
        selectedYear,
        isMonthFilterEnabled,
        setIsMonthFilterEnabled,
        isCustomRangeEnabled,
        setIsCustomRangeEnabled,
        customRange,
        setCustomRange,
        isDatePickerOpen,
        setIsDatePickerOpen,
        showLoading,
        overallStats,
        stats,
        totalPages,
        paginatedRequests,
        currentPage,
        setCurrentPage,
        itemsPerPage,
        setItemsPerPage,
        handleCustomRangeConfirm,
        formatThaiRange,
        handlePrevMonth,
        handleNextMonth,
        getThaiMonthYearLabel,
        finalRequestsCount: finalRequests.length,
        combinedRequests
    };
};
