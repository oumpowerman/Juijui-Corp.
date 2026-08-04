import { useState, useEffect, useMemo } from 'react';
import { Task } from '../../../../../types';
import { supabase } from '../../../../../lib/supabase';
import { isStockTerminalStatus } from '../../../../../config/status';
import { isStorageRequiredStatus } from '../../../../../hooks/useContentStock';
import { calculateLocalTopTags, filterMatchingTags, filterTasksByActiveFilters } from '../utils/localTagCalculator';

interface ActiveFilters {
    status?: string[];
    channelId?: string[];
    format?: string[];
    pillar?: string[];
    category?: string[];
    contentSubTab?: 'ACTIVE' | 'ARCHIVE';
    showStockOnly?: boolean;
    onlyOverdue?: boolean;
    onlyMissingStorage?: boolean;
    hasShootDate?: boolean;
    shootDateStart?: string;
    shootDateEnd?: string;
}

export function useServerTags(
    localSearch: string,
    tasks: Task[],
    activeFilters?: ActiveFilters,
    showSuggestions: boolean = false
) {
    const [filteredTags, setFilteredTags] = useState<{ name: string; count: number }[]>([]);
    const [isSearchingTags, setIsSearchingTags] = useState(false);
    const [searchSpeedMs, setSearchSpeedMs] = useState('0ms');
    const [serverTopTags, setServerTopTags] = useState<{ name: string; count: number }[] | null>(null);
    const [dataSource, setDataSource] = useState<'SERVER' | 'LOCAL'>('SERVER');

    // Compute query parameters for active filters to send to the server
    const filterQueryParams = useMemo(() => {
        const queryParams = new URLSearchParams();
        if (activeFilters?.status && activeFilters.status.length > 0) {
            queryParams.append('status', activeFilters.status.join(','));
        }
        if (activeFilters?.channelId && activeFilters.channelId.length > 0) {
            queryParams.append('channelId', activeFilters.channelId.join(','));
        }
        if (activeFilters?.format && activeFilters.format.length > 0) {
            queryParams.append('format', activeFilters.format.join(','));
        }
        if (activeFilters?.pillar && activeFilters.pillar.length > 0) {
            queryParams.append('pillar', activeFilters.pillar.join(','));
        }
        if (activeFilters?.category && activeFilters.category.length > 0) {
            queryParams.append('category', activeFilters.category.join(','));
        }
        if (activeFilters?.contentSubTab) {
            queryParams.append('contentSubTab', activeFilters.contentSubTab);
        }
        if (activeFilters?.showStockOnly) {
            queryParams.append('showStockOnly', 'true');
        }
        if (activeFilters?.onlyOverdue) {
            queryParams.append('onlyOverdue', 'true');
        }
        if (activeFilters?.onlyMissingStorage) {
            queryParams.append('onlyMissingStorage', 'true');
        }
        if (activeFilters?.hasShootDate) {
            queryParams.append('hasShootDate', 'true');
        }
        if (activeFilters?.shootDateStart) {
            queryParams.append('shootDateStart', activeFilters.shootDateStart);
        }
        if (activeFilters?.shootDateEnd) {
            queryParams.append('shootDateEnd', activeFilters.shootDateEnd);
        }
        return queryParams.toString();
    }, [activeFilters]);

    // Compute local fallback top 10 tags
    const localTopTags = useMemo(() => {
        return calculateLocalTopTags(tasks, activeFilters);
    }, [tasks, activeFilters]);

    // Use server-side top tags when available to ensure exact database-wide counts, otherwise use local fallback
    const top10Tags = serverTopTags !== null ? serverTopTags : localTopTags;

    // Fetch top 10 tags with exact database counts
    useEffect(() => {
        let isCurrent = true;
        async function fetchTop10Tags() {
            try {
                let query = supabase
                    .from('contents')
                    .select('tags, status, channel_id, pillar, category, content_formats, is_unscheduled, end_date, local_path, drive_label, shoot_date, analytics_status');
                
                // Apply activeFilters to the database query
                if (activeFilters) {
                    if (activeFilters.channelId && activeFilters.channelId.length > 0) {
                        query = query.in('channel_id', activeFilters.channelId);
                    }
                    if (activeFilters.format && activeFilters.format.length > 0) {
                        query = query.overlaps('content_formats', activeFilters.format);
                    }
                    if (activeFilters.pillar && activeFilters.pillar.length > 0) {
                        query = query.in('pillar', activeFilters.pillar);
                    }
                    if (activeFilters.category && activeFilters.category.length > 0) {
                        query = query.in('category', activeFilters.category);
                    }
                }

                const { data, error } = await query.limit(3000); // Fetch up to 3000 items to cover the whole DB
                if (error) throw error;

                if (isCurrent) {
                    const counts: Record<string, number> = {};
                    if (data && Array.isArray(data)) {
                        data.forEach((row: any) => {
                            // Apply non-query activeFilters locally
                            if (activeFilters) {
                                const isArchive = activeFilters.contentSubTab === 'ARCHIVE';
                                const isTerminalStatus = isStockTerminalStatus(row.status);
                                
                                if (activeFilters.onlyOverdue) {
                                    const sevenDaysAgo = new Date();
                                    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                                    
                                    const endDateObj = row.end_date ? new Date(row.end_date) : null;
                                    const isActuallyOverdue = 
                                        !row.is_unscheduled && 
                                        isTerminalStatus && 
                                        row.analytics_status !== 'COMPLETE' && 
                                        endDateObj && 
                                        endDateObj <= sevenDaysAgo;
                                    
                                    if (!isActuallyOverdue) return;
                                    if (activeFilters.status && activeFilters.status.length > 0 && !activeFilters.status.includes(row.status)) return;
                                } else {
                                    if (isArchive) {
                                        if (!isTerminalStatus) return;
                                    } else {
                                        if (isTerminalStatus) return;
                                        if (activeFilters.status && activeFilters.status.length > 0 && !activeFilters.status.includes(row.status)) return;
                                    }
                                }
                                
                                if (activeFilters.showStockOnly && !row.is_unscheduled) return;

                                // Missing Storage Filter
                                if (activeFilters.onlyMissingStorage) {
                                    if (!isStorageRequiredStatus(row.status || '')) return;
                                    const hasLocalPath = !!row.local_path && row.local_path.trim() !== '';
                                    const hasDriveLabel = !!row.drive_label && row.drive_label.trim() !== '';
                                    if (hasLocalPath && hasDriveLabel) return;
                                }
                                
                                // Shoot Date Filter
                                if (activeFilters.hasShootDate && !row.shoot_date) return;
                                
                                // Shoot Date Range Match
                                if (row.shoot_date) {
                                    const taskShootStr = row.shoot_date.substring(0, 10);
                                    if (activeFilters.shootDateStart && taskShootStr < activeFilters.shootDateStart) return;
                                    if (activeFilters.shootDateEnd && taskShootStr > activeFilters.shootDateEnd) return;
                                } else {
                                    if (activeFilters.shootDateStart || activeFilters.shootDateEnd) return;
                                }
                            }

                            if (Array.isArray(row.tags)) {
                                row.tags.forEach((tag: string) => {
                                    const trimmed = tag?.trim();
                                    if (trimmed) {
                                        counts[trimmed] = (counts[trimmed] || 0) + 1;
                                    }
                                });
                            }
                        });
                    }

                    const dbTopTags = Object.entries(counts)
                        .map(([name, count]) => ({ name, count }))
                        .sort((a, b) => b.count - a.count)
                        .slice(0, 10);

                    setServerTopTags(dbTopTags);
                    setDataSource('SERVER');
                }
            } catch (err) {
                console.warn('Failed to fetch server-side top tags, falling back to local counts:', err);
                setDataSource('LOCAL');
            }
        }
        fetchTop10Tags();
        return () => {
            isCurrent = false;
        };
    }, [tasks, filterQueryParams, activeFilters]);

    // Helper to extract tag typing context
    const currentTagTypeMatch = useMemo(() => localSearch.match(/#(\S*)$/), [localSearch]);
    const filterKeyword = useMemo(() => currentTagTypeMatch ? currentTagTypeMatch[1].toLowerCase() : '', [currentTagTypeMatch]);

    // Fast direct database query routine
    useEffect(() => {
        let isCurrent = true;
        
        async function fetchTags() {
            if (!showSuggestions) return;

            setIsSearchingTags(true);
            const startTime = Date.now();
            try {
                let query = supabase
                    .from('contents')
                    .select('tags, status, channel_id, pillar, category, content_formats, is_unscheduled, end_date, local_path, drive_label, shoot_date, analytics_status');
                
                // Apply activeFilters to the database query
                if (activeFilters) {
                    if (activeFilters.channelId && activeFilters.channelId.length > 0) {
                        query = query.in('channel_id', activeFilters.channelId);
                    }
                    if (activeFilters.format && activeFilters.format.length > 0) {
                        query = query.overlaps('content_formats', activeFilters.format);
                    }
                    if (activeFilters.pillar && activeFilters.pillar.length > 0) {
                        query = query.in('pillar', activeFilters.pillar);
                    }
                    if (activeFilters.category && activeFilters.category.length > 0) {
                        query = query.in('category', activeFilters.category);
                    }
                }

                const { data, error } = await query.limit(3000); // Fetch up to 3000 items
                if (error) throw error;

                if (isCurrent) {
                    const counts: Record<string, number> = {};
                    if (data && Array.isArray(data)) {
                        data.forEach((row: any) => {
                            // Apply non-query activeFilters locally
                            if (activeFilters) {
                                const isArchive = activeFilters.contentSubTab === 'ARCHIVE';
                                const isTerminalStatus = isStockTerminalStatus(row.status);
                                
                                if (activeFilters.onlyOverdue) {
                                    const sevenDaysAgo = new Date();
                                    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                                    
                                    const endDateObj = row.end_date ? new Date(row.end_date) : null;
                                    const isActuallyOverdue = 
                                        !row.is_unscheduled && 
                                        isTerminalStatus && 
                                        row.analytics_status !== 'COMPLETE' && 
                                        endDateObj && 
                                        endDateObj <= sevenDaysAgo;
                                    
                                    if (!isActuallyOverdue) return;
                                    if (activeFilters.status && activeFilters.status.length > 0 && !activeFilters.status.includes(row.status)) return;
                                } else {
                                    if (isArchive) {
                                        if (!isTerminalStatus) return;
                                    } else {
                                        if (isTerminalStatus) return;
                                        if (activeFilters.status && activeFilters.status.length > 0 && !activeFilters.status.includes(row.status)) return;
                                    }
                                }
                                
                                if (activeFilters.showStockOnly && !row.is_unscheduled) return;

                                // Missing Storage Filter
                                if (activeFilters.onlyMissingStorage) {
                                    if (!isStorageRequiredStatus(row.status || '')) return;
                                    const hasLocalPath = !!row.local_path && row.local_path.trim() !== '';
                                    const hasDriveLabel = !!row.drive_label && row.drive_label.trim() !== '';
                                    if (hasLocalPath && hasDriveLabel) return;
                                }
                                
                                // Shoot Date Filter
                                if (activeFilters.hasShootDate && !row.shoot_date) return;
                                
                                // Shoot Date Range Match
                                if (row.shoot_date) {
                                    const taskShootStr = row.shoot_date.substring(0, 10);
                                    if (activeFilters.shootDateStart && taskShootStr < activeFilters.shootDateStart) return;
                                    if (activeFilters.shootDateEnd && taskShootStr > activeFilters.shootDateEnd) return;
                                } else {
                                    if (activeFilters.shootDateStart || activeFilters.shootDateEnd) return;
                                }
                            }

                            if (Array.isArray(row.tags)) {
                                row.tags.forEach((tag: string) => {
                                    const trimmed = tag?.trim();
                                    if (trimmed) {
                                        counts[trimmed] = (counts[trimmed] || 0) + 1;
                                    }
                                });
                            }
                        });
                    }

                    const allDbTags = Object.entries(counts)
                        .map(([name, count]) => ({ name, count }))
                        .sort((a, b) => b.count - a.count);

                    if (!currentTagTypeMatch) {
                        setFilteredTags(allDbTags.slice(0, 12));
                    } else {
                        const sortedMatching = filterMatchingTags(allDbTags, filterKeyword);
                        setFilteredTags(sortedMatching.slice(0, 15));
                    }
                    const speed = Date.now() - startTime;
                    setSearchSpeedMs(`${speed}ms`);
                    setDataSource('SERVER');
                }
            } catch (err) {
                console.warn('Server tags API query failed, falling back to local calculation:', err);
                
                if (isCurrent) {
                    const counts: Record<string, number> = {};
                    const filteredTasks = filterTasksByActiveFilters(tasks, activeFilters);

                    filteredTasks.forEach((task) => {
                        if (Array.isArray(task.tags)) {
                            task.tags.forEach((tag: string) => {
                                const trimmed = tag.trim();
                                if (trimmed) {
                                    counts[trimmed] = (counts[trimmed] || 0) + 1;
                                }
                            });
                        }
                    });
                    const allLocalTags = Object.entries(counts)
                        .map(([name, count]) => ({ name, count }))
                        .sort((a, b) => b.count - a.count);

                    if (!currentTagTypeMatch) {
                        setFilteredTags(allLocalTags.slice(0, 12));
                    } else {
                        const sortedMatching = filterMatchingTags(allLocalTags, filterKeyword);
                        setFilteredTags(sortedMatching);
                    }
                    setSearchSpeedMs('<1ms (offline fallback)');
                    setDataSource('LOCAL');
                }
            } finally {
                if (isCurrent) {
                    setIsSearchingTags(false);
                }
            }
        }

        const fetchDebounce = setTimeout(() => {
            fetchTags();
        }, 100); // Snappy 100ms keystroke debounce specifically for tag suggestions

        return () => {
            isCurrent = false;
            clearTimeout(fetchDebounce);
        };
    }, [filterKeyword, showSuggestions, filterQueryParams, tasks, localTopTags, currentTagTypeMatch, activeFilters]);

    // Automatically sync when client alters/creates/edits task tags
    useEffect(() => {
        fetch('/api/tags/sync', { method: 'POST' }).catch(() => {});
    }, [tasks]);

    return {
        top10Tags,
        filteredTags,
        isSearchingTags,
        searchSpeedMs,
        currentTagTypeMatch,
        filterKeyword,
        dataSource
    };
}
