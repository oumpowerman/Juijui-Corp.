import React, { useState, useMemo, useEffect } from 'react';
import { startOfDay, endOfDay, isBefore, isAfter } from 'date-fns';
import { SavedChecklistRecord } from '../../../../types';
import {
    StatusFilterType,
    DateFilterMode,
    DatePickerTarget,
    PageEllipsisItem
} from '../types';

interface UseSavedRecordsFilterAndPaginationArgs {
    savedRecords: SavedChecklistRecord[];
    expandedRecordId: string | null;
}

export const useSavedRecordsFilterAndPagination = ({
    savedRecords,
    expandedRecordId
}: UseSavedRecordsFilterAndPaginationArgs) => {
    const now = useMemo(() => new Date(), []);

    // 1. Filters State
    const [historyPresetFilter, setHistoryPresetFilter] = useState<string>('ALL');
    const [statusFilter, setStatusFilter] = useState<StatusFilterType>('ALL');
    const [dateFilterMode, setDateFilterMode] = useState<DateFilterMode>('ALL_TIME');
    const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth()); // 0-11
    const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
    const [customStartDate, setCustomStartDate] = useState<Date | undefined>(undefined);
    const [customEndDate, setCustomEndDate] = useState<Date | undefined>(undefined);
    const [historySearch, setHistorySearch] = useState<string>('');

    // DatePickerModal state
    const [activeDatePickerTarget, setActiveDatePickerTarget] =
        useState<DatePickerTarget>(null);

    // 2. Pagination State (Supports 10,000+ records effortlessly)
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(20);
    const [jumpPageInput, setJumpPageInput] = useState<string>('');

    // Available Years derived from records + current year range
    const availableYears = useMemo(() => {
        const yearSet = new Set<number>([
            now.getFullYear() - 1,
            now.getFullYear(),
            now.getFullYear() + 1
        ]);
        savedRecords.forEach(r => {
            const d = new Date(r.submittedAt);
            if (!isNaN(d.getTime())) {
                yearSet.add(d.getFullYear());
            }
        });
        return Array.from(yearSet).sort((a, b) => b - a);
    }, [savedRecords, now]);

    // 3. Multi-dimensional Filtering
    const filteredSavedRecords = useMemo(() => {
        const q = historySearch.trim().toLowerCase();

        return savedRecords.filter(rec => {
            // A. Preset filter
            if (historyPresetFilter !== 'ALL' && rec.checklistId !== historyPresetFilter) {
                return false;
            }

            // B. Completion status filter (100% vs < 100%)
            const isComplete = rec.totalCount > 0 && rec.checkedCount >= rec.totalCount;
            if (statusFilter === 'COMPLETE' && !isComplete) return false;
            if (statusFilter === 'INCOMPLETE' && isComplete) return false;

            // C. Date / Month-Year / Custom Range filter
            const submittedDate = new Date(rec.submittedAt);
            if (!isNaN(submittedDate.getTime())) {
                if (dateFilterMode === 'THIS_MONTH') {
                    if (
                        submittedDate.getMonth() !== now.getMonth() ||
                        submittedDate.getFullYear() !== now.getFullYear()
                    ) {
                        return false;
                    }
                } else if (dateFilterMode === 'MONTH_YEAR') {
                    if (
                        submittedDate.getMonth() !== selectedMonth ||
                        submittedDate.getFullYear() !== selectedYear
                    ) {
                        return false;
                    }
                } else if (dateFilterMode === 'CUSTOM_RANGE') {
                    if (
                        customStartDate &&
                        isBefore(submittedDate, startOfDay(customStartDate))
                    ) {
                        return false;
                    }
                    if (customEndDate && isAfter(submittedDate, endOfDay(customEndDate))) {
                        return false;
                    }
                }
            }

            // D. Text search
            if (q) {
                const titleMatch = rec.caseTitle.toLowerCase().includes(q);
                const presetMatch = rec.checklistTitle.toLowerCase().includes(q);
                const submitterMatch = rec.submittedByName.toLowerCase().includes(q);
                const noteMatch = (rec.summaryNote || '').toLowerCase().includes(q);
                const itemCheckerMatch = rec.snapshotSections?.some(sec =>
                    sec.items.some(it => (it.checkedByName || '').toLowerCase().includes(q))
                );
                return (
                    titleMatch ||
                    presetMatch ||
                    submitterMatch ||
                    noteMatch ||
                    itemCheckerMatch
                );
            }

            return true;
        });
    }, [
        savedRecords,
        historyPresetFilter,
        statusFilter,
        dateFilterMode,
        selectedMonth,
        selectedYear,
        customStartDate,
        customEndDate,
        historySearch,
        now
    ]);

    // Reset to page 1 whenever filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [
        historyPresetFilter,
        statusFilter,
        dateFilterMode,
        selectedMonth,
        selectedYear,
        customStartDate,
        customEndDate,
        historySearch,
        pageSize
    ]);

    // Summary counts for status pills
    const statusCounts = useMemo(() => {
        let complete = 0;
        let incomplete = 0;
        savedRecords.forEach(r => {
            if (r.totalCount > 0 && r.checkedCount >= r.totalCount) {
                complete += 1;
            } else {
                incomplete += 1;
            }
        });
        return { complete, incomplete };
    }, [savedRecords]);

    // Pagination calculations
    const totalRecords = filteredSavedRecords.length;
    const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
    const safePage = Math.min(currentPage, totalPages);

    const paginatedRecords = useMemo(() => {
        const startIdx = (safePage - 1) * pageSize;
        return filteredSavedRecords.slice(startIdx, startIdx + pageSize);
    }, [filteredSavedRecords, safePage, pageSize]);

    // Visible page numbers with ellipsis for 10,000+ items (e.g., 500 pages)
    const pageNumbers = useMemo<PageEllipsisItem[]>(() => {
        const pages: PageEllipsisItem[] = [];
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
            return pages;
        }

        pages.push(1);
        if (safePage > 3) {
            pages.push('ELLIPSIS_LEFT');
        }

        const start = Math.max(2, safePage - 1);
        const end = Math.min(totalPages - 1, safePage + 1);
        for (let i = start; i <= end; i++) {
            pages.push(i);
        }

        if (safePage < totalPages - 2) {
            pages.push('ELLIPSIS_RIGHT');
        }
        pages.push(totalPages);
        return pages;
    }, [totalPages, safePage]);

    // Active Record in Detail Modal
    const activeDetailIndex = useMemo(() => {
        if (!expandedRecordId) return -1;
        return filteredSavedRecords.findIndex(r => r.id === expandedRecordId);
    }, [filteredSavedRecords, expandedRecordId]);

    const activeDetailRecord = useMemo(() => {
        if (activeDetailIndex >= 0) return filteredSavedRecords[activeDetailIndex];
        if (!expandedRecordId) return null;
        return savedRecords.find(r => r.id === expandedRecordId) || null;
    }, [activeDetailIndex, filteredSavedRecords, savedRecords, expandedRecordId]);

    const hasActiveFilters =
        historyPresetFilter !== 'ALL' ||
        statusFilter !== 'ALL' ||
        dateFilterMode !== 'ALL_TIME' ||
        historySearch.trim() !== '';

    const isDateSubDrawerOpen =
        dateFilterMode === 'MONTH_YEAR' || dateFilterMode === 'CUSTOM_RANGE';

    const handleResetFilters = () => {
        setHistoryPresetFilter('ALL');
        setStatusFilter('ALL');
        setDateFilterMode('ALL_TIME');
        setCustomStartDate(undefined);
        setCustomEndDate(undefined);
        setHistorySearch('');
        setCurrentPage(1);
    };

    const handleJumpPageSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const parsed = parseInt(jumpPageInput, 10);
        if (!isNaN(parsed) && parsed >= 1 && parsed <= totalPages) {
            setCurrentPage(parsed);
            setJumpPageInput('');
        }
    };

    return {
        // Filter states & setters
        historyPresetFilter,
        setHistoryPresetFilter,
        statusFilter,
        setStatusFilter,
        dateFilterMode,
        setDateFilterMode,
        selectedMonth,
        setSelectedMonth,
        selectedYear,
        setSelectedYear,
        customStartDate,
        setCustomStartDate,
        customEndDate,
        setCustomEndDate,
        historySearch,
        setHistorySearch,
        activeDatePickerTarget,
        setActiveDatePickerTarget,
        availableYears,
        statusCounts,
        hasActiveFilters,
        isDateSubDrawerOpen,
        handleResetFilters,

        // Pagination states & derived data
        currentPage,
        setCurrentPage,
        pageSize,
        setPageSize,
        jumpPageInput,
        setJumpPageInput,
        handleJumpPageSubmit,
        filteredSavedRecords,
        paginatedRecords,
        totalRecords,
        totalPages,
        safePage,
        pageNumbers,

        // Detail Modal states
        activeDetailIndex,
        activeDetailRecord
    };
};
