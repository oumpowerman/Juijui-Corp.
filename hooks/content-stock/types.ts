import { Dispatch, SetStateAction, RefObject } from 'react';
import { Task, Channel, User, MasterOption } from '../../types';
import { StockCSVValidationResult, ParsedStockItemPreview } from '../../services/stockImportValidator';

export type SortKey = 'title' | 'status' | 'date' | 'remark' | 'publishDate' | 'shootDate' | 'shortNote' | 'ideaOwner' | 'editor' | 'helper' | 'createdAt';
export type SortDirection = 'asc' | 'desc';

export interface StockSortConfig {
    key: string;
    direction: 'asc' | 'desc';
}

export interface StockFilters {
    channelId: string[];
    format: string[];
    pillar: string[];
    category: string[];
    statuses: string[];
    hasShootDate: boolean;
    shootDateStart: string;
    shootDateEnd: string;
    showStockOnly: boolean;
    onlyOverdue: boolean;
    onlyMissingStorage: boolean;
    contentSubTab: 'ACTIVE' | 'ARCHIVE';
    checklistProgress: string[];
}

export interface UseContentStockProps {
    page: number;
    pageSize: number;
    searchQuery: string;
    filters: StockFilters;
    sortConfig: StockSortConfig | null;
    masterOptions?: MasterOption[];
}

export interface StockCacheEntry {
    contents: Task[];
    totalCount: number;
    overdueCount: number;
    missingStorageCount: number;
    timestamp: number;
}

/**
 * Global in-memory cache to prevent re-querying identical stock pages.
 */
export const stockCacheMap = new Map<string, StockCacheEntry>();

/**
 * Clears the stock query in-memory cache.
 */
export const clearStockCache = () => {
    stockCacheMap.clear();
};

/**
 * Checks if a status requires storage paths (Local Path or Drive Label).
 */
export const isStorageRequiredStatus = (status: string | undefined | null): boolean => {
    if (!status) return false;
    const s = status.trim().toUpperCase();
    return s.includes('EDIT') || s.includes('FEEDBACK') || s.includes('APPROVE') || s.includes('DONE') || s.includes('PUBLISH') || s.includes('POSTED');
};

export interface StockFilterState {
    searchQuery: string;
    setSearchQuery: (val: string) => void;
    filterChannel: string[];
    setFilterChannel: Dispatch<SetStateAction<string[]>>;
    filterFormat: string[];
    setFilterFormat: Dispatch<SetStateAction<string[]>>;
    filterPillar: string[];
    setFilterPillar: Dispatch<SetStateAction<string[]>>;
    filterCategory: string[];
    setFilterCategory: Dispatch<SetStateAction<string[]>>;
    filterStatuses: string[];
    setFilterStatuses: Dispatch<SetStateAction<string[]>>;
    filterOnlyOverdue: boolean;
    setFilterOnlyOverdue: (val: boolean) => void;
    filterOnlyMissingStorage: boolean;
    setFilterOnlyMissingStorage: (val: boolean) => void;
    filterChecklistProgress: string[];
    setFilterChecklistProgress: (val: string[]) => void;
    filterHasShootDate: boolean;
    setFilterHasShootDate: (val: boolean) => void;
    filterShootDateStart: string;
    setFilterShootDateStart: (val: string) => void;
    filterShootDateEnd: string;
    setFilterShootDateEnd: (val: string) => void;
    showStockOnly: boolean;
    setShowStockOnly: (val: boolean) => void;
    isFiltering: boolean;
    clearFilters: () => void;
    hasActiveFilters: boolean;
}

export interface StockViewState {
    viewTab: 'LIST' | 'QUEUE';
    setViewTab: (tab: 'LIST' | 'QUEUE') => void;
    contentSubTab: 'ACTIVE' | 'ARCHIVE';
    setContentSubTab: (tab: 'ACTIVE' | 'ARCHIVE' | ((prev: 'ACTIVE' | 'ARCHIVE') => 'ACTIVE' | 'ARCHIVE')) => void;
    currentPage: number;
    setCurrentPage: (page: number | ((prev: number) => number)) => void;
    itemsPerPage: number;
    sortConfig: { key: string; direction: 'asc' | 'desc' } | null;
    handleSort: (key: SortKey) => void;
    searchParams: URLSearchParams;
    setSearchParams: any;
}

export interface StockDataResult {
    paginatedTasks: Task[];
    totalCount: number;
    overdueCount: number;
    missingStorageCount: number;
    unassignedChannelCount: number;
    isLoading: boolean;
    isRefreshing: boolean;
    fetchContents: () => Promise<void>;
    refreshStock: () => Promise<void>;
    fetchUnassignedChannelCount: () => Promise<void>;
    updateLocalItem: (updatedTask: Task, isDelete?: boolean) => void;
    toggleShootQueue: (id: string, currentStatus: boolean) => Promise<boolean>;
    updateSubChecklistProgress: (id: string, progress: Record<string, boolean>) => Promise<boolean>;
}

export interface StockModalState {
    isInventoryModalOpen: boolean;
    setIsInventoryModalOpen: (open: boolean) => void;
    openInventoryModal: () => void;
    closeInventoryModal: () => void;

    isImportPreviewOpen: boolean;
    setIsImportPreviewOpen: (open: boolean) => void;
    importValidationResult: StockCSVValidationResult | null;
    setImportValidationResult: (res: StockCSVValidationResult | null) => void;
    isSubmittingImport: boolean;

    selectedContentForAnalytics: Task | null;
    setSelectedContentForAnalytics: (task: Task | null) => void;
}

export interface StockImportActions {
    fileInputRef: RefObject<HTMLInputElement>;
    isImporting: boolean;
    handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
    handleProcessFile: (file: File) => Promise<void>;
    handleExecuteImport: (itemsToInsert: ParsedStockItemPreview[]) => Promise<void>;
    handleDownloadTemplate: () => void;
}
