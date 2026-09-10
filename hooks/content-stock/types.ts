import { Task, MasterOption } from '../../types';

export interface StockFilters {
    channelId: string[];
    format: string[];
    pillar: string[];
    category: string[];
    statuses: string[];
    showStockOnly: boolean;
    onlyOverdue?: boolean;
    onlyMissingStorage?: boolean;
    hasShootDate?: boolean;
    shootDateStart?: string;
    shootDateEnd?: string;
    contentSubTab?: 'ACTIVE' | 'ARCHIVE';
    checklistProgress?: string[];
}

export interface StockSortConfig {
    key: string;
    direction: 'asc' | 'desc';
}

export interface UseContentStockProps {
    page: number;
    pageSize: number;
    searchQuery: string;
    filters: StockFilters;
    sortConfig: StockSortConfig | null;
    masterOptions?: MasterOption[];
}

export interface StockCacheItem {
    contents: Task[];
    totalCount: number;
    overdueCount: number;
    missingStorageCount: number;
    timestamp: number;
}

// Global cache map to persist query results across unmount/remount (SWR-like behavior)
export const stockCacheMap = new Map<string, StockCacheItem>();

export const clearStockCache = (): void => {
    stockCacheMap.clear();
};

export const isStorageRequiredStatus = (status: string): boolean => {
    if (!status) return false;
    const s = status.toUpperCase();
    return s.includes('EDIT') || 
           s.includes('FEEDBACK') || 
           s.includes('APPROVE') || 
           s.includes('DONE') || 
           s.includes('PUBLISH') || 
           s.includes('POSTED') || 
           s.includes('COMPLETE') || 
           s.includes('SUCCESS');
};
