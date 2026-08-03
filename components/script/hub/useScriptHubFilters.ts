import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { ScriptHubMode } from './ScriptModeSwitcher';

interface UseScriptHubFiltersProps {
    fetchScripts: (options: any) => Promise<void>;
    initialMode: ScriptHubMode;
    mode: ScriptHubMode;
    setMode: React.Dispatch<React.SetStateAction<ScriptHubMode>>;
    pageSize: number;
}

export const useScriptHubFilters = ({
    fetchScripts,
    initialMode,
    mode,
    setMode,
    pageSize
}: UseScriptHubFiltersProps) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const location = useLocation();

    // Persistent tracking of where we came from (e.g., from Shoot Queue)
    const originRef = useRef<string | null>(location.state?.from || searchParams.get('origin') || null);

    // Update origin if state or query parameters appear
    useEffect(() => {
        if (location.state?.from) {
            originRef.current = location.state.from;
        } else if (searchParams.get('origin')) {
            originRef.current = searchParams.get('origin');
        }
    }, [location.state, searchParams]);

    // UI state
    const [viewTab, setViewTab] = useState<'QUEUE' | 'LIBRARY' | 'HISTORY'>('LIBRARY');
    const [layoutMode, setLayoutMode] = useState<'GRID' | 'LIST'>('LIST'); 

    // Single Source of Truth: Retrieve page directly from URL parameter
    const pageVal = parseInt(searchParams.get('scriptPage') || '1', 10);
    const page = isNaN(pageVal) || pageVal < 1 ? 1 : pageVal;

    // Custom setPage to sync with URL query param
    const setPage = useCallback((newPageOrFn: number | ((prev: number) => number)) => {
        setSearchParams(prevParams => {
            const newParams = new URLSearchParams(prevParams);
            const currentPageVal = parseInt(newParams.get('scriptPage') || '1', 10);
            const currentPage = isNaN(currentPageVal) || currentPageVal < 1 ? 1 : currentPageVal;
            const nextVal = typeof newPageOrFn === 'function' ? newPageOrFn(currentPage) : newPageOrFn;
            const validNextVal = nextVal < 1 ? 1 : nextVal;
            
            if (validNextVal > 1) {
                newParams.set('scriptPage', validNextVal.toString());
            } else {
                newParams.delete('scriptPage');
            }
            return newParams;
        }, { replace: true });
    }, [setSearchParams]);

    // Initialize layout mode based on screen width
    useEffect(() => {
        const isMobile = window.innerWidth < 768;
        setLayoutMode(isMobile ? 'GRID' : 'LIST');
    }, []);

    // Active search params
    const searchQuery = searchParams.get('q') || '';
    const isDeepSearch = searchParams.get('deep') === 'true';
    const urlScriptId = searchParams.get('scriptId');

    // Filter list states
    const [filterOwner, setFilterOwner] = useState<string[]>([]);
    const [filterStatus, setFilterStatus] = useState<string[]>(['ALL']);
    const [filterChannel, setFilterChannel] = useState<string[]>([]);
    const [filterCategory, setFilterCategory] = useState<string>('ALL');
    const [filterTags, setFilterTags] = useState<string[]>([]);
    const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');

    // Automatically clear owner filters in Studio mode (as it represents own workspace)
    useEffect(() => {
        if (mode === 'STUDIO') {
            setFilterOwner([]);
        }
    }, [mode]);

    // --- SEARCH HANDLERS (useCallback for stability) ---
    const handleSetSearchQuery = useCallback((val: string) => {
        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            if (val) newParams.set('q', val);
            else newParams.delete('q');
            return newParams;
        }, { replace: true });
    }, [setSearchParams]);

    const handleSetDeepSearch = useCallback((val: boolean) => {
        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            if (val) newParams.set('deep', 'true');
            else newParams.delete('deep');
            return newParams;
        }, { replace: true });
    }, [setSearchParams]);

    // Pagination Helper
    const handlePageChange = (newPage: number, totalPages: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setPage(newPage);
        }
    };

    // 1. แปลงสถานะอาร์เรย์ให้เป็นข้อความพื้นฐาน (เพื่อเฝ้าดูการเปลี่ยนแปลงของค่าจริง ไม่ใช่ Reference)
    const filterOwnerKey = filterOwner.join(',');
    const filterChannelKey = filterChannel.join(',');
    const filterStatusKey = filterStatus.join(',');
    const filterTagsKey = filterTags.join(',');

    // Track previous filters to detect actual changes (and skip on initial mount/page-only change)
    const prevFiltersRef = useRef<{
        searchQuery: string;
        viewTab: string;
        filterOwnerKey: string;
        filterChannelKey: string;
        filterCategory: string;
        filterStatusKey: string;
        filterTagsKey: string;
        isDeepSearch: boolean;
    } | null>(null);

    // Reset page on filter changes (skip on initial mount or when only page changes)
    useEffect(() => {
        const currentFilters = {
            searchQuery,
            viewTab,
            filterOwnerKey,
            filterChannelKey,
            filterCategory,
            filterStatusKey,
            filterTagsKey,
            isDeepSearch
        };

        if (prevFiltersRef.current === null) {
            // Initial mount: save filters and do not reset page
            prevFiltersRef.current = currentFilters;
            return;
        }

        // Check if any of the actual filters changed
        const didFilterChange =
            prevFiltersRef.current.searchQuery !== searchQuery ||
            prevFiltersRef.current.viewTab !== viewTab ||
            prevFiltersRef.current.filterOwnerKey !== filterOwnerKey ||
            prevFiltersRef.current.filterChannelKey !== filterChannelKey ||
            prevFiltersRef.current.filterCategory !== filterCategory ||
            prevFiltersRef.current.filterStatusKey !== filterStatusKey ||
            prevFiltersRef.current.filterTagsKey !== filterTagsKey ||
            prevFiltersRef.current.isDeepSearch !== isDeepSearch;

        if (didFilterChange) {
            setPage(1);
        }

        // Always update the ref with current filters
        prevFiltersRef.current = currentFilters;
    }, [
        searchQuery,
        viewTab,
        filterOwnerKey,
        filterChannelKey,
        filterCategory,
        filterStatusKey,
        filterTagsKey,
        isDeepSearch,
        setPage
    ]);

    // --- DEBOUNCE & QUERY DEDUPLICATION ---
    const [debouncedOptions, setDebouncedOptions] = useState(() => ({
        page,
        searchQuery,
        viewTab,
        filterOwner,
        filterChannel,
        filterCategory,
        filterTags,
        filterStatus,
        sortOrder,
        isDeepSearch,
        isPersonal: initialMode === 'STUDIO'
    }));

    const debounceTimeoutRef = useRef<any>(null);
    const lastFetchedKeyRef = useRef<string>('');

    useEffect(() => {
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
            debounceTimeoutRef.current = null;
        }

        const nextOptions = {
            page,
            searchQuery,
            viewTab,
            filterOwner,
            filterChannel,
            filterCategory,
            filterTags,
            filterStatus,
            sortOrder,
            isDeepSearch,
            isPersonal: mode === 'STUDIO'
        };

        // If 'page', 'viewTab', 'sortOrder', or 'isPersonal' changed, update immediately.
        // Otherwise (search and filter updates), apply 500ms debounce.
        setDebouncedOptions(prev => {
            const isImmediateChange = 
                prev.page !== nextOptions.page ||
                prev.viewTab !== nextOptions.viewTab ||
                prev.sortOrder !== nextOptions.sortOrder ||
                prev.isPersonal !== nextOptions.isPersonal;

            if (isImmediateChange) {
                return nextOptions;
            } else {
                debounceTimeoutRef.current = setTimeout(() => {
                    setDebouncedOptions(nextOptions);
                }, 500);
                return prev;
            }
        });

        return () => {
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        page, 
        searchQuery, 
        viewTab, 
        filterOwnerKey, 
        filterChannelKey, 
        filterCategory, 
        filterTagsKey, 
        filterStatusKey, 
        sortOrder, 
        isDeepSearch, 
        mode
    ]);

    // Perform query deduplication and fire fetch
    useEffect(() => {
        if (mode === 'LAB') return; // Skip main scripts fetch in LAB mode

        const sortedOwner = [...debouncedOptions.filterOwner].sort();
        const sortedChannel = [...debouncedOptions.filterChannel].sort();
        const sortedTags = [...debouncedOptions.filterTags].sort();
        const sortedStatus = [...debouncedOptions.filterStatus].sort();
        
        const normalizedIsDeepSearch = debouncedOptions.searchQuery ? debouncedOptions.isDeepSearch : false;

        const serializationKey = JSON.stringify({
            page: debouncedOptions.page,
            searchQuery: debouncedOptions.searchQuery,
            viewTab: debouncedOptions.viewTab,
            filterOwner: sortedOwner,
            filterChannel: sortedChannel,
            filterCategory: debouncedOptions.filterCategory,
            filterTags: sortedTags,
            filterStatus: sortedStatus,
            sortOrder: debouncedOptions.sortOrder,
            isDeepSearch: normalizedIsDeepSearch,
            isPersonal: debouncedOptions.isPersonal
        });

        if (serializationKey === lastFetchedKeyRef.current) {
            return;
        }

        lastFetchedKeyRef.current = serializationKey;

        fetchScripts({
            page: debouncedOptions.page,
            pageSize,
            searchQuery: debouncedOptions.searchQuery,
            viewTab: debouncedOptions.viewTab,
            filterOwner: debouncedOptions.filterOwner,
            filterChannel: debouncedOptions.filterChannel,
            filterCategory: debouncedOptions.filterCategory,
            filterTags: debouncedOptions.filterTags,
            filterStatus: debouncedOptions.filterStatus,
            sortOrder: debouncedOptions.sortOrder,
            isDeepSearch: normalizedIsDeepSearch,
            isPersonal: debouncedOptions.isPersonal
        });
    }, [debouncedOptions, fetchScripts, mode, pageSize]);

    return {
        searchParams,
        setSearchParams,
        originRef,
        viewTab,
        setViewTab,
        layoutMode,
        setLayoutMode,
        page,
        setPage,
        searchQuery,
        isDeepSearch,
        urlScriptId,
        filterOwner,
        setFilterOwner,
        filterStatus,
        setFilterStatus,
        filterChannel,
        setFilterChannel,
        filterCategory,
        setFilterCategory,
        filterTags,
        setFilterTags,
        sortOrder,
        setSortOrder,
        handleSetSearchQuery,
        handleSetDeepSearch,
        handlePageChange
    };
};
