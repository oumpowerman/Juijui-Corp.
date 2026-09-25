import { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Task, Channel, User, MasterOption, getChecklistGroupKey } from '../types';
import { useToast } from '../context/ToastContext';
import { useContentStock } from './useContentStock';
import { generateContentStockCSVTemplate } from '../services/csvService';
import { validateAndParseStockFile, StockCSVValidationResult, ParsedStockItemPreview } from '../services/stockImportValidator';
import { supabase } from '../lib/supabase';
import { isStockTerminalStatus } from '../config/status';
import {
    SortKey,
    SortDirection,
    StockFilterState,
    StockViewState,
    StockDataResult,
    StockModalState,
    StockImportActions
} from './content-stock/types';

export * from './content-stock/types';

const ITEMS_PER_PAGE = 20;

interface UseContentStockControllerProps {
    globalTasks: Task[];
    channels: Channel[];
    users: User[];
    masterOptions: MasterOption[];
}

export const useContentStockController = ({ globalTasks, channels, users, masterOptions }: UseContentStockControllerProps) => {
    const { showToast } = useToast();

    // --- Filter States ---
    const [searchQuery, setSearchQuery] = useState('');
    const [filterChannel, setFilterChannel] = useState<string[]>([]);
    const [filterFormat, setFilterFormat] = useState<string[]>([]);
    const [filterPillar, setFilterPillar] = useState<string[]>([]);
    const [filterCategory, setFilterCategory] = useState<string[]>([]);
    const [filterStatuses, setFilterStatuses] = useState<string[]>([]);
    const [filterOnlyOverdue, setFilterOnlyOverdue] = useState(false);
    const [filterOnlyMissingStorage, setFilterOnlyMissingStorage] = useState(false);
    const [filterChecklistProgress, setFilterChecklistProgress] = useState<string[]>([]);
    
    // Range Filter
    const [filterHasShootDate, setFilterHasShootDate] = useState(false);
    const [filterShootDateStart, setFilterShootDateStart] = useState('');
    const [filterShootDateEnd, setFilterShootDateEnd] = useState('');
    
    const [showStockOnly, setShowStockOnly] = useState(false);
    const [isFiltering, setIsFiltering] = useState(false);
    const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
    const [selectedContentForAnalytics, setSelectedContentForAnalytics] = useState<Task | null>(null);
    const [searchParams, setSearchParams] = useSearchParams();

    // --- CSV Import Validation States ---
    const [isImportPreviewOpen, setIsImportPreviewOpen] = useState(false);
    const [importValidationResult, setImportValidationResult] = useState<StockCSVValidationResult | null>(null);
    const [isSubmittingImport, setIsSubmittingImport] = useState(false);
    
    const viewTab = (searchParams.get('stockMode') as 'LIST' | 'QUEUE') || 'LIST';
    const contentSubTab = (searchParams.get('stockTab') as 'ACTIVE' | 'ARCHIVE') || 'ACTIVE';

    const setViewTab = useCallback((tab: 'LIST' | 'QUEUE') => {
        setSearchParams(prev => {
            const next = new URLSearchParams(prev);
            next.set('view', 'ContentStock');
            if (tab === 'QUEUE') {
                next.set('stockMode', 'QUEUE');
                next.delete('stockTab');
            } else {
                next.delete('stockMode');
            }
            return next;
        }, { replace: true });
    }, [setSearchParams]);

    const setContentSubTab = useCallback((tab: 'ACTIVE' | 'ARCHIVE' | ((prev: 'ACTIVE' | 'ARCHIVE') => 'ACTIVE' | 'ARCHIVE')) => {
        setSearchParams(prev => {
            const next = new URLSearchParams(prev);
            next.set('view', 'ContentStock');
            next.delete('stockMode');
            
            const currentSubTab = (next.get('stockTab') as 'ACTIVE' | 'ARCHIVE') || 'ACTIVE';
            const nextSubTab = typeof tab === 'function' ? tab(currentSubTab) : tab;
            
            if (nextSubTab === 'ARCHIVE') {
                next.set('stockTab', 'ARCHIVE');
            } else {
                next.delete('stockTab');
            }
            return next;
        }, { replace: true });
    }, [setSearchParams]);

    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

    const currentPage = parseInt(searchParams.get('stockPage') || '1', 10) || 1;
    const setCurrentPage = useCallback((page: number | ((prev: number) => number)) => {
        setSearchParams(prev => {
            const next = new URLSearchParams(prev);
            next.set('view', 'ContentStock');
            
            const currentPageVal = parseInt(next.get('stockPage') || '1', 10) || 1;
            const nextPageVal = typeof page === 'function' ? page(currentPageVal) : page;
            
            if (nextPageVal > 1) {
                next.set('stockPage', nextPageVal.toString());
            } else {
                next.delete('stockPage');
            }
            return next;
        }, { replace: true });
    }, [setSearchParams]);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isImporting, setIsImporting] = useState(false);

    // Reset pagination when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, filterChannel, filterFormat, filterPillar, filterCategory, filterStatuses, filterHasShootDate, filterShootDateStart, filterShootDateEnd, showStockOnly, sortConfig, filterOnlyMissingStorage, filterChecklistProgress, setCurrentPage]);

    const filters = useMemo(() => ({
        channelId: filterChannel,
        format: filterFormat,
        pillar: filterPillar,
        category: filterCategory,
        statuses: filterStatuses,
        hasShootDate: filterHasShootDate,
        shootDateStart: filterShootDateStart,
        shootDateEnd: filterShootDateEnd,
        showStockOnly,
        onlyOverdue: filterOnlyOverdue,
        onlyMissingStorage: filterOnlyMissingStorage,
        contentSubTab,
        checklistProgress: filterChecklistProgress
    }), [filterChannel, filterFormat, filterPillar, filterCategory, filterStatuses, filterHasShootDate, filterShootDateStart, filterShootDateEnd, showStockOnly, filterOnlyOverdue, filterOnlyMissingStorage, contentSubTab, filterChecklistProgress]);

    useEffect(() => {
        setIsFiltering(true);
        const timer = setTimeout(() => setIsFiltering(false), 500);
        return () => clearTimeout(timer);
    }, [filters]);

    // Reset checklist filter if it's a specific step but we are no longer in a single status
    useEffect(() => {
        const isSingleStatus = filterStatuses.length === 1;
        if (!isSingleStatus) {
            const validFilters = filterChecklistProgress.filter(
                f => f === 'COMPLETED' || f === 'INCOMPLETE'
            );
            if (validFilters.length !== filterChecklistProgress.length) {
                setFilterChecklistProgress(validFilters);
            }
        } else {
            const selectedStatus = filterStatuses[0];
            const groupKey = getChecklistGroupKey(selectedStatus, masterOptions);
            const activeSteps = masterOptions.filter(
                o => o.type === 'STATUS_CHECKLIST' && o.parentKey === groupKey && o.isActive
            );
            const stepKeys = activeSteps.map(s => s.key);
            
            const validFilters = filterChecklistProgress.filter(
                f => f === 'COMPLETED' || f === 'INCOMPLETE' || stepKeys.includes(f)
            );
            if (validFilters.length !== filterChecklistProgress.length) {
                setFilterChecklistProgress(validFilters);
            }
        }
    }, [filterStatuses, filterChecklistProgress, masterOptions]);

    const { 
        contents: paginatedTasks, 
        totalCount, 
        overdueCount, 
        missingStorageCount, 
        unassignedChannelCount,
        isLoading, 
        isRefreshing, 
        fetchContents, 
        refreshStock,
        fetchUnassignedChannelCount,
        updateLocalItem, 
        toggleShootQueue, 
        updateSubChecklistProgress 
    } = useContentStock({
        page: currentPage,
        pageSize: ITEMS_PER_PAGE,
        searchQuery,
        filters,
        sortConfig,
        masterOptions
    });

    const handleSort = useCallback((key: SortKey) => {
        setSortConfig(current => {
            if (current && current.key === key) {
                return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' };
            }
            const isDateKey = key === 'date' || key === 'publishDate' || key === 'shootDate';
            return { key, direction: isDateKey ? 'desc' : 'asc' };
        });
    }, []);

    const clearFilters = useCallback(() => {
        setSearchQuery('');
        setFilterChannel([]);
        setFilterFormat([]);
        setFilterPillar([]);
        setFilterCategory([]);
        setFilterHasShootDate(false);
        setFilterShootDateStart('');
        setFilterShootDateEnd('');
        setFilterStatuses([]);
        setFilterOnlyOverdue(false);
        setFilterOnlyMissingStorage(false);
        setFilterChecklistProgress([]);
    }, []);

    const hasActiveFilters = useMemo(() => {
        return !!(searchQuery || 
               filterChannel.length > 0 || 
               filterFormat.length > 0 || 
               filterPillar.length > 0 || 
               filterCategory.length > 0 || 
               filterStatuses.length > 0 || 
               filterHasShootDate || 
               filterShootDateStart || 
               filterShootDateEnd ||
               filterChecklistProgress.length > 0 ||
               filterOnlyOverdue ||
               filterOnlyMissingStorage);
    }, [
        searchQuery, filterChannel, filterFormat, filterPillar, 
        filterCategory, filterStatuses, filterHasShootDate, 
        filterShootDateStart, filterShootDateEnd, filterChecklistProgress,
        filterOnlyOverdue, filterOnlyMissingStorage
    ]);

    const handleProcessFile = useCallback(async (file: File) => {
        if (!file) return;

        setIsImporting(true);
        try {
            const validation = await validateAndParseStockFile(file, users, channels, masterOptions);
            setImportValidationResult(validation);
            setIsImportPreviewOpen(true);
        } catch (err: any) {
            console.error('Import parse error:', err);
            showToast('เกิดข้อผิดพลาดในการอ่านไฟล์: ' + (err.message || err), 'error');
        } finally {
            setIsImporting(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    }, [channels, users, masterOptions, showToast]);

    const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        await handleProcessFile(file);
    }, [handleProcessFile]);

    const handleExecuteImport = useCallback(async (itemsToInsert: ParsedStockItemPreview[]) => {
        if (!itemsToInsert || itemsToInsert.length === 0) {
            showToast('ไม่มีรายการที่พร้อมนำเข้า', 'warning');
            return;
        }

        setIsSubmittingImport(true);
        try {
            const payloads = itemsToInsert.map(item => item.payload);
            const BATCH_SIZE = 100;

            for (let i = 0; i < payloads.length; i += BATCH_SIZE) {
                const chunk = payloads.slice(i, i + BATCH_SIZE);
                const { error } = await supabase.from('contents').insert(chunk);
                if (error) throw error;
            }

            showToast(`นำเข้าสำเร็จ ${itemsToInsert.length} รายการ`, 'success');
            setIsImportPreviewOpen(false);
            setImportValidationResult(null);
            await refreshStock();
            await fetchUnassignedChannelCount();
        } catch (err: any) {
            console.error('Execute import error:', err);
            showToast('เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' + (err.message || err), 'error');
        } finally {
            setIsSubmittingImport(false);
        }
    }, [showToast, refreshStock, fetchUnassignedChannelCount]);

    const handleDownloadTemplate = useCallback(() => {
        try {
            const csvContent = generateContentStockCSVTemplate();
            const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `content_stock_template_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            showToast('ดาวน์โหลดไฟล์ Template สำเร็จ', 'success');
        } catch (err) {
            console.error('Template download error:', err);
            showToast('เกิดข้อผิดพลาดในการดาวน์โหลด Template', 'error');
        }
    }, [showToast]);

    const localUnassignedCount = useMemo(() => {
        if (!globalTasks) return 0;
        return globalTasks.filter(t => {
            const isUnassigned = !t.channelId || t.channelId.trim() === '' || t.channelId === 'NO_CHANNEL';
            if (!isUnassigned) return false;

            const isTerminal = isStockTerminalStatus(t.status) || t.status === 'CANCELLED';
            if (contentSubTab === 'ARCHIVE') {
                return isTerminal;
            } else {
                return !isTerminal;
            }
        }).length;
    }, [globalTasks, contentSubTab]);

    const effectiveUnassignedCount = Math.max(unassignedChannelCount, localUnassignedCount);

    // ==========================================
    // GROUPED OBJECTS (For clean orchestrator)
    // ==========================================
    const filterState: StockFilterState = useMemo(() => ({
        searchQuery,
        setSearchQuery,
        filterChannel,
        setFilterChannel,
        filterFormat,
        setFilterFormat,
        filterPillar,
        setFilterPillar,
        filterCategory,
        setFilterCategory,
        filterStatuses,
        setFilterStatuses,
        filterOnlyOverdue,
        setFilterOnlyOverdue,
        filterOnlyMissingStorage,
        setFilterOnlyMissingStorage,
        filterChecklistProgress,
        setFilterChecklistProgress,
        filterHasShootDate,
        setFilterHasShootDate,
        filterShootDateStart,
        setFilterShootDateStart,
        filterShootDateEnd,
        setFilterShootDateEnd,
        showStockOnly,
        setShowStockOnly,
        isFiltering,
        clearFilters,
        hasActiveFilters,
    }), [
        searchQuery, filterChannel, filterFormat, filterPillar, filterCategory,
        filterStatuses, filterOnlyOverdue, filterOnlyMissingStorage, filterChecklistProgress,
        filterHasShootDate, filterShootDateStart, filterShootDateEnd, showStockOnly,
        isFiltering, clearFilters, hasActiveFilters
    ]);

    const viewState: StockViewState = useMemo(() => ({
        viewTab,
        setViewTab,
        contentSubTab,
        setContentSubTab,
        currentPage,
        setCurrentPage,
        itemsPerPage: ITEMS_PER_PAGE,
        sortConfig,
        handleSort,
        searchParams,
        setSearchParams
    }), [viewTab, setViewTab, contentSubTab, setContentSubTab, currentPage, setCurrentPage, sortConfig, handleSort, searchParams, setSearchParams]);

    const dataResult: StockDataResult = useMemo(() => ({
        paginatedTasks,
        totalCount,
        overdueCount,
        missingStorageCount,
        unassignedChannelCount: effectiveUnassignedCount,
        isLoading,
        isRefreshing,
        fetchContents,
        refreshStock,
        fetchUnassignedChannelCount,
        updateLocalItem,
        toggleShootQueue,
        updateSubChecklistProgress
    }), [
        paginatedTasks, totalCount, overdueCount, missingStorageCount, effectiveUnassignedCount,
        isLoading, isRefreshing, fetchContents, refreshStock, fetchUnassignedChannelCount,
        updateLocalItem, toggleShootQueue, updateSubChecklistProgress
    ]);

    const modalState: StockModalState = useMemo(() => ({
        isInventoryModalOpen,
        setIsInventoryModalOpen,
        openInventoryModal: () => setIsInventoryModalOpen(true),
        closeInventoryModal: () => setIsInventoryModalOpen(false),
        isImportPreviewOpen,
        setIsImportPreviewOpen,
        importValidationResult,
        setImportValidationResult,
        isSubmittingImport,
        selectedContentForAnalytics,
        setSelectedContentForAnalytics
    }), [isInventoryModalOpen, isImportPreviewOpen, importValidationResult, isSubmittingImport, selectedContentForAnalytics]);

    const importActions: StockImportActions = useMemo(() => ({
        fileInputRef,
        isImporting,
        handleFileUpload,
        handleProcessFile,
        handleExecuteImport,
        handleDownloadTemplate
    }), [fileInputRef, isImporting, handleFileUpload, handleProcessFile, handleExecuteImport, handleDownloadTemplate]);

    return {
        // --- 4 Clean Groups ---
        filters: filterState,
        view: viewState,
        data: dataResult,
        modals: modalState,
        importActions,

        // --- Backward Compatibility (ยังคง field เดิมไว้ทั้งหมด) ---
        searchQuery, setSearchQuery,
        filterChannel, setFilterChannel,
        filterFormat, setFilterFormat,
        filterPillar, setFilterPillar,
        filterCategory, setFilterCategory,
        filterStatuses, setFilterStatuses,
        filterOnlyOverdue, setFilterOnlyOverdue,
        filterOnlyMissingStorage, setFilterOnlyMissingStorage,
        filterChecklistProgress, setFilterChecklistProgress,
        filterHasShootDate, setFilterHasShootDate,
        filterShootDateStart, setFilterShootDateStart,
        filterShootDateEnd, setFilterShootDateEnd,
        showStockOnly, setShowStockOnly,
        isFiltering,
        isInventoryModalOpen, setIsInventoryModalOpen,
        selectedContentForAnalytics, setSelectedContentForAnalytics,
        viewTab, setViewTab,
        contentSubTab, setContentSubTab,
        sortConfig, setSortConfig,
        currentPage, setCurrentPage,
        ITEMS_PER_PAGE,
        fileInputRef,
        isImporting,
        isImportPreviewOpen,
        setIsImportPreviewOpen,
        importValidationResult,
        setImportValidationResult,
        isSubmittingImport,
        handleFileUpload,
        handleProcessFile,
        handleExecuteImport,
        handleDownloadTemplate,
        clearFilters,
        handleSort,
        paginatedTasks,
        totalCount,
        overdueCount,
        missingStorageCount,
        unassignedChannelCount: effectiveUnassignedCount,
        isLoading,
        isRefreshing,
        fetchContents,
        refreshStock,
        fetchUnassignedChannelCount,
        updateLocalItem,
        toggleShootQueue,
        updateSubChecklistProgress,
        searchParams,
        setSearchParams
    };
};
