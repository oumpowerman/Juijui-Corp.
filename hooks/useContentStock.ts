import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Task } from '../types';
import { mapContentRowToTask } from '../lib/taskSchema';

// Sub-module Imports
import { 
    UseContentStockProps, 
    StockFilters, 
    StockSortConfig, 
    stockCacheMap, 
    clearStockCache, 
    isStorageRequiredStatus 
} from './content-stock/types';
import { checkDoesItMatchFilters } from './content-stock/contentStockFilterMatcher';
import { 
    buildContentStockQuery, 
    buildOverdueCountQuery, 
    buildMissingStorageCountQuery, 
    buildUnassignedChannelCountQuery 
} from './content-stock/contentStockQueryBuilder';
import { useContentStockRealtime } from './content-stock/useContentStockRealtime';
import { useContentStockActions } from './content-stock/useContentStockActions';

// Re-exports for complete backward compatibility with external components/hooks
export { isStorageRequiredStatus, stockCacheMap, clearStockCache, checkDoesItMatchFilters };
export type { UseContentStockProps, StockFilters, StockSortConfig };

export const useContentStock = ({
    page,
    pageSize,
    searchQuery,
    filters,
    sortConfig,
    masterOptions = []
}: UseContentStockProps) => {
    const [contents, setContents] = useState<Task[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [overdueCount, setOverdueCount] = useState(0);
    const [missingStorageCount, setMissingStorageCount] = useState(0);
    const [unassignedChannelCount, setUnassignedChannelCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Track IDs that have been optimistically added to totalCount to prevent double-counting
    const trackedAddedIds = useRef(new Set<string>());

    // Decoupled count of unassigned channel items: only fetched on initial load or manual refresh
    const fetchUnassignedChannelCount = useCallback(async () => {
        try {
            const { count, error } = await buildUnassignedChannelCountQuery();
            if (!error && count !== null) {
                setUnassignedChannelCount(count);
            }
        } catch (err) {
            console.error('Failed to fetch unassigned channel count:', err);
        }
    }, []);

    const hasFetchedUnassignedCountRef = useRef(false);
    useEffect(() => {
        if (!hasFetchedUnassignedCountRef.current) {
            hasFetchedUnassignedCountRef.current = true;
            fetchUnassignedChannelCount();
        }
    }, [fetchUnassignedChannelCount]);

    const pageRef = useRef(page);
    useEffect(() => {
        pageRef.current = page;
    }, [page]);

    // Refs to access current state inside stable callbacks without stale closures
    const searchRef = useRef(searchQuery);
    const filtersRef = useRef(filters);
    
    useEffect(() => {
        searchRef.current = searchQuery;
        filtersRef.current = filters;
    }, [searchQuery, filters]);

    const mapSupabaseToTask = useCallback((data: any): Task => mapContentRowToTask(data), []);

    // Bound filter matching function
    const checkDoesItMatchFiltersBound = useCallback((task: Task, currentFilters?: any, customSearch?: string) => {
        const activeFilters = currentFilters !== undefined ? currentFilters : filtersRef.current;
        const activeSearch = customSearch !== undefined ? customSearch : (currentFilters !== undefined ? searchQuery : searchRef.current);
        return checkDoesItMatchFilters(task, activeFilters, activeSearch, masterOptions);
    }, [masterOptions, searchQuery]);

    // Data Fetching
    const fetchContents = useCallback(async (isBackground = false) => {
        const cacheKey = JSON.stringify({ page, pageSize, searchQuery, filters, sortConfig });
        
        if (!isBackground) {
            const cached = stockCacheMap.get(cacheKey);
            const now = Date.now();
            if (cached && (now - cached.timestamp < 15000)) {
                setContents(cached.contents);
                setTotalCount(cached.totalCount);
                setOverdueCount(cached.overdueCount);
                setMissingStorageCount(cached.missingStorageCount);
                setIsLoading(false);
                setIsRefreshing(false);
                return;
            }
            setIsLoading(true);
        } else {
            setIsRefreshing(true);
        }

        try {
            const isUsingMemoryFilter = Boolean(filters.checklistProgress && filters.checklistProgress.length > 0);

            const query = buildContentStockQuery({
                page,
                pageSize,
                searchQuery,
                filters,
                sortConfig,
                isUsingMemoryFilter
            });

            const overdueQuery = buildOverdueCountQuery(filters);
            const missingStorageQuery = buildMissingStorageCountQuery(filters);

            const [response, overdueResponse, missingStorageResponse] = await Promise.all([
                query,
                overdueQuery,
                missingStorageQuery
            ]);

            const { data, error, count } = response;
            const { count: overdueDbCount, error: overdueError } = overdueResponse;
            const { count: missingStorageDbCount, error: missingStorageError } = missingStorageResponse;

            if (error) throw error;
            if (overdueError) throw overdueError;
            if (missingStorageError) throw missingStorageError;

            if (data) {
                let mapped = data.map(mapSupabaseToTask);
                let finalCount = count || 0;

                if (isUsingMemoryFilter) {
                    mapped = mapped.filter(task => checkDoesItMatchFiltersBound(task, filters));
                    finalCount = mapped.length;
                    
                    const from = (page - 1) * pageSize;
                    mapped = mapped.slice(from, from + pageSize);
                }

                setContents(mapped);
                setTotalCount(finalCount);
                if (overdueDbCount !== null) {
                    setOverdueCount(overdueDbCount);
                }
                if (missingStorageDbCount !== null) {
                    setMissingStorageCount(missingStorageDbCount);
                }
                
                // Save to SWR Cache
                stockCacheMap.set(cacheKey, {
                    contents: mapped,
                    totalCount: finalCount,
                    overdueCount: overdueDbCount !== null ? overdueDbCount : 0,
                    missingStorageCount: missingStorageDbCount !== null ? missingStorageDbCount : 0,
                    timestamp: Date.now()
                });
                
                trackedAddedIds.current.clear();
            }
        } catch (err) {
            console.error('Fetch content stock failed:', err);
        } finally {
            if (!isBackground) setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [page, pageSize, searchQuery, filters, sortConfig, mapSupabaseToTask, checkDoesItMatchFiltersBound]);

    // Initial Fetch
    useEffect(() => {
        fetchContents();
    }, [fetchContents]);

    const fetchContentsRef = useRef(fetchContents);
    useEffect(() => {
        fetchContentsRef.current = fetchContents;
    }, [fetchContents]);

    const triggerCountRefresh = useCallback(() => {
        fetchContentsRef.current(true); 
    }, []);

    // Sub-hook: Realtime WebSocket & Smart State Hydration
    useContentStockRealtime({
        setContents,
        setTotalCount,
        setUnassignedChannelCount,
        trackedAddedIds,
        pageRef,
        checkDoesItMatchFilters: checkDoesItMatchFiltersBound,
        triggerCountRefresh,
        mapSupabaseToTask
    });

    // Sub-hook: CRUD Actions (Optimistic Local Update, Shoot Queue, Sub Checklist)
    const { 
        updateLocalItem, 
        toggleShootQueue, 
        updateSubChecklistProgress 
    } = useContentStockActions({
        setContents,
        setTotalCount,
        setUnassignedChannelCount,
        trackedAddedIds,
        pageRef,
        checkDoesItMatchFilters: checkDoesItMatchFiltersBound
    });

    const refreshStock = useCallback(async () => {
        await Promise.all([
            fetchContents(true),
            fetchUnassignedChannelCount()
        ]);
    }, [fetchContents, fetchUnassignedChannelCount]);

    return { 
        contents, 
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
    };
};
