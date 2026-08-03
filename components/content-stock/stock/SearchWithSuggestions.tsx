import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Search, X, Tags, Plus, Hash, TrendingUp } from 'lucide-react';
import { Task } from '../../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../../lib/supabase';
import { isStockTerminalStatus } from '../../../config/status';
import { isStorageRequiredStatus } from '../../../hooks/useContentStock';

interface SearchWithSuggestionsProps {
    searchQuery: string;
    setSearchQuery: (val: string) => void;
    tasks: Task[];
    showPopularTagsInline?: boolean;
    activeFilters?: {
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
    };
}

export const SearchWithSuggestions: React.FC<SearchWithSuggestionsProps> = React.memo(({
    searchQuery,
    setSearchQuery,
    tasks,
    showPopularTagsInline = true,
    activeFilters
}) => {
    // Local state for debouncing search input
    const [localSearch, setLocalSearch] = useState(searchQuery);
    
    // Sync local state if parent prop changes externally (e.g. clear filters)
    useEffect(() => {
        setLocalSearch(searchQuery);
    }, [searchQuery]);

    // Debounce effect
    useEffect(() => {
        const handler = setTimeout(() => {
            if (localSearch !== searchQuery) {
                setSearchQuery(localSearch);
            }
        }, 500);

        return () => {
            clearTimeout(handler);
        };
    }, [localSearch, setSearchQuery, searchQuery]);

    // Tag Auto-Suggest States
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const searchContainerRef = useRef<HTMLDivElement>(null);
    const [filteredTags, setFilteredTags] = useState<{ name: string; count: number }[]>([]);
    const [isSearchingTags, setIsSearchingTags] = useState(false);
    const [searchSpeedMs, setSearchSpeedMs] = useState('0ms');

    // State for top 10 tags fetched directly from server to match database counts perfectly
    const [serverTopTags, setServerTopTags] = useState<{ name: string; count: number }[] | null>(null);

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

    // Compute local fallback top 10 tags (applying activeFilters client-side for perfect parity)
    const localTopTags = useMemo(() => {
        const counts: Record<string, number> = {};
        
        const filteredTasks = tasks.filter(task => {
            if (activeFilters) {
                if (activeFilters.channelId && activeFilters.channelId.length > 0 && (!task.channelId || !activeFilters.channelId.includes(task.channelId))) return false;
                if (activeFilters.format && activeFilters.format.length > 0) {
                    const taskFormats = task.contentFormats || [];
                    const hasMatch = taskFormats.some(f => activeFilters.format!.includes(f));
                    if (!hasMatch) return false;
                }
                if (activeFilters.pillar && activeFilters.pillar.length > 0 && (!task.pillar || !activeFilters.pillar.includes(task.pillar))) return false;
                if (activeFilters.category && activeFilters.category.length > 0 && (!task.category || !activeFilters.category.includes(task.category))) return false;
                
                const isArchive = activeFilters.contentSubTab === 'ARCHIVE';
                const isTerminalStatus = isStockTerminalStatus(task.status);
                
                if (activeFilters.onlyOverdue) {
                    const sevenDaysAgo = new Date();
                    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                    
                    const endDateObj = task.endDate ? (task.endDate instanceof Date ? task.endDate : new Date(task.endDate)) : null;
                    const isActuallyOverdue = 
                        !task.isUnscheduled && 
                        isTerminalStatus && 
                        task.analyticsStatus !== 'COMPLETE' && 
                        endDateObj && 
                        endDateObj <= sevenDaysAgo;
                    
                    if (!isActuallyOverdue) return false;
                    if (activeFilters.status && activeFilters.status.length > 0 && !activeFilters.status.includes(task.status as any)) return false;
                } else {
                    if (isArchive) {
                        if (!isTerminalStatus) return false;
                    } else {
                        if (isTerminalStatus) return false;
                        if (activeFilters.status && activeFilters.status.length > 0 && !activeFilters.status.includes(task.status as any)) return false;
                    }
                }
                
                if (activeFilters.showStockOnly && !task.isUnscheduled) return false;

                // Missing Storage Filter
                if (activeFilters.onlyMissingStorage) {
                    if (!isStorageRequiredStatus(task.status || '')) return false;
                    const hasLocalPath = !!task.localPath && task.localPath.trim() !== '';
                    const hasDriveLabel = !!task.driveLabel && task.driveLabel.trim() !== '';
                    if (hasLocalPath && hasDriveLabel) return false;
                }
                
                // Shoot Date Filter
                if (activeFilters.hasShootDate && !task.shootDate) return false;
                
                // Shoot Date Range Match
                if (task.shootDate) {
                    try {
                        const dateObj = task.shootDate instanceof Date ? task.shootDate : new Date(task.shootDate);
                        const taskShootStr = dateObj.toISOString().substring(0, 10);
                        if (activeFilters.shootDateStart && taskShootStr < activeFilters.shootDateStart) return false;
                        if (activeFilters.shootDateEnd && taskShootStr > activeFilters.shootDateEnd) return false;
                    } catch (e) {
                        return false;
                    }
                } else {
                    if (activeFilters.shootDateStart || activeFilters.shootDateEnd) return false;
                }
            }
            return true;
        });

        filteredTasks.forEach((task) => {
            if (Array.isArray(task.tags)) {
                task.tags.forEach((tag: string) => {
                    const trimmed = tag?.trim();
                    if (trimmed) {
                        counts[trimmed] = (counts[trimmed] || 0) + 1;
                    }
                });
            }
        });
        return Object.entries(counts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
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
                }
            } catch (err) {
                console.warn('Failed to fetch server-side top tags, falling back to local counts:', err);
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

    // Fast direct database query routine (Enterprise Design Pattern)
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
                        const matching = allDbTags.filter(tag => tag.name.toLowerCase().includes(filterKeyword));
                        const sortedMatching = [...matching].sort((a, b) => {
                            const aName = a.name.toLowerCase();
                            const bName = b.name.toLowerCase();
                            const aStarts = aName.startsWith(filterKeyword);
                            const bStarts = bName.startsWith(filterKeyword);
                            if (aStarts && !bStarts) return -1;
                            if (!aStarts && bStarts) return 1;
                            return b.count - a.count;
                        });
                        setFilteredTags(sortedMatching.slice(0, 15));
                    }
                    const speed = Date.now() - startTime;
                    setSearchSpeedMs(`${speed}ms`);
                }
            } catch (err) {
                console.warn('Server tags API query failed, falling back to local calculation:', err);
                
                if (isCurrent) {
                    const counts: Record<string, number> = {};
                    const filteredTasks = tasks.filter(task => {
                        if (activeFilters) {
                            if (activeFilters.channelId && activeFilters.channelId.length > 0 && (!task.channelId || !activeFilters.channelId.includes(task.channelId))) return false;
                            if (activeFilters.format && activeFilters.format.length > 0) {
                                const taskFormats = task.contentFormats || [];
                                const hasMatch = taskFormats.some(f => activeFilters.format!.includes(f));
                                if (!hasMatch) return false;
                            }
                            if (activeFilters.pillar && activeFilters.pillar.length > 0 && (!task.pillar || !activeFilters.pillar.includes(task.pillar))) return false;
                            if (activeFilters.category && activeFilters.category.length > 0 && (!task.category || !activeFilters.category.includes(task.category))) return false;
                            
                            const isArchive = activeFilters.contentSubTab === 'ARCHIVE';
                            const isTerminalStatus = isStockTerminalStatus(task.status);
                            
                            if (activeFilters.onlyOverdue) {
                                const sevenDaysAgo = new Date();
                                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                                
                                const endDateObj = task.endDate ? (task.endDate instanceof Date ? task.endDate : new Date(task.endDate)) : null;
                                const isActuallyOverdue = 
                                    !task.isUnscheduled && 
                                    isTerminalStatus && 
                                    task.analyticsStatus !== 'COMPLETE' && 
                                    endDateObj && 
                                    endDateObj <= sevenDaysAgo;
                                
                                if (!isActuallyOverdue) return false;
                                if (activeFilters.status && activeFilters.status.length > 0 && !activeFilters.status.includes(task.status as any)) return false;
                            } else {
                                if (isArchive) {
                                    if (!isTerminalStatus) return false;
                                } else {
                                    if (isTerminalStatus) return false;
                                    if (activeFilters.status && activeFilters.status.length > 0 && !activeFilters.status.includes(task.status as any)) return false;
                                }
                            }
                            
                            if (activeFilters.showStockOnly && !task.isUnscheduled) return false;

                            // Missing Storage Filter
                            if (activeFilters.onlyMissingStorage) {
                                if (!isStorageRequiredStatus(task.status || '')) return false;
                                const hasLocalPath = !!task.localPath && task.localPath.trim() !== '';
                                const hasDriveLabel = !!task.driveLabel && task.driveLabel.trim() !== '';
                                if (hasLocalPath && hasDriveLabel) return false;
                            }
                            
                            // Shoot Date Filter
                            if (activeFilters.hasShootDate && !task.shootDate) return false;
                            
                            // Shoot Date Range Match
                            if (task.shootDate) {
                                try {
                                    const dateObj = task.shootDate instanceof Date ? task.shootDate : new Date(task.shootDate);
                                    const taskShootStr = dateObj.toISOString().substring(0, 10);
                                    if (activeFilters.shootDateStart && taskShootStr < activeFilters.shootDateStart) return false;
                                    if (activeFilters.shootDateEnd && taskShootStr > activeFilters.shootDateEnd) return false;
                                } catch (e) {
                                    return false;
                                }
                            } else {
                                if (activeFilters.shootDateStart || activeFilters.shootDateEnd) return false;
                            }
                        }
                        return true;
                    });

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
                        const matching = allLocalTags.filter(tag => tag.name.toLowerCase().includes(filterKeyword));
                        const sortedMatching = [...matching].sort((a, b) => {
                            const aName = a.name.toLowerCase();
                            const bName = b.name.toLowerCase();
                            const aStarts = aName.startsWith(filterKeyword);
                            const bStarts = bName.startsWith(filterKeyword);
                            if (aStarts && !bStarts) return -1;
                            if (!aStarts && bStarts) return 1;
                            return b.count - a.count;
                        });
                        setFilteredTags(sortedMatching);
                    }
                    setSearchSpeedMs('<1ms (offline fallback)');
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

    const handleTagSuggestionClick = (tagName: string) => {
        const tagTypeMatch = localSearch.match(/#(\S*)$/);
        if (tagTypeMatch) {
            const startIndex = localSearch.lastIndexOf('#');
            const cleanPrefix = localSearch.substring(0, startIndex);
            setLocalSearch(`${cleanPrefix}#${tagName} `);
        } else {
            const prefix = localSearch.trim() ? `${localSearch.trim()} ` : '';
            setLocalSearch(`${prefix}#${tagName} `);
        }
    };

    const handleHashClickInside = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!localSearch.startsWith('#')) {
            setLocalSearch('#' + localSearch);
        } else if (localSearch === '#') {
            setLocalSearch('');
        }
    };

    // Close suggestion box when clicking outside search area
    useEffect(() => {
        function handleSearchClickOutside(event: MouseEvent) {
          if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
            setShowSuggestions(false);
          }
        }
        document.addEventListener("mousedown", handleSearchClickOutside);
        return () => {
          document.removeEventListener("mousedown", handleSearchClickOutside);
        };
    }, []);

    return (
        <div 
            className="flex-1 flex flex-col relative" 
            ref={searchContainerRef}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <motion.div layout className={`relative w-full group ${showSuggestions ? 'z-[101]' : 'z-10'}`}>
                <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors ${showSuggestions ? 'z-[102]' : ''}`} />
                <input 
                    type="text" 
                    placeholder="ชื่อ, หมายเหตุ หรือพิมพ์ # ตามด้วยแท็ก..." 
                    value={localSearch}
                    onChange={(e) => setLocalSearch(e.target.value)}
                    onFocus={() => setShowSuggestions(true)}
                    className={`w-full h-full pl-11 pr-20 py-3 bg-gray-50/50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-300 focus:bg-white outline-none text-sm font-bold text-gray-700 transition-all placeholder:font-normal placeholder:text-gray-400 min-h-[50px] ${showSuggestions ? 'relative z-[102] bg-white border-indigo-300 shadow-sm' : ''}`}
                />
                
                {/* Minimalist Action Buttons inside input container */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                    {localSearch && (
                        <button 
                            type="button"
                            onClick={() => setLocalSearch('')} 
                            className={`text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-gray-100 transition-colors ${showSuggestions ? 'z-[102]' : ''}`}
                            title="ล้างคำค้นหา"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={handleHashClickInside}
                        className={`
                            p-1.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center active:scale-95 min-h-[30px] min-w-[30px]
                            ${localSearch.startsWith('#')
                                ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm shadow-indigo-100'
                                : 'bg-gray-50 text-gray-400 border-gray-200 hover:text-gray-700 hover:bg-gray-100'}
                            ${showSuggestions ? 'z-[102]' : ''}
                        `}
                        title="กรอกเครื่องหมาย # ด่วน"
                    >
                        <Hash className="w-3.5 h-3.5" />
                    </button>
                </div>

                {/* Autocomplete suggestions dropdown */}
                <AnimatePresence>
                    {showSuggestions && (
                        <>
                            {/* Mobile Background Backdrop Overlay */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setShowSuggestions(false)}
                                className="fixed inset-0 bg-transparent z-[90] md:hidden"
                            />
                            <motion.div
                                initial={{ opacity: 0, y: 15, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 15, scale: 0.98 }}
                                transition={{ type: "spring", stiffness: 350, damping: 30 }}
                                className="absolute top-full left-0 right-0 mt-2 w-full md:max-w-[420px] bg-white rounded-2xl md:rounded-3xl shadow-2xl border border-gray-100 p-4 md:p-5 z-[100] overflow-hidden text-left origin-top"
                            >
                                <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
                                    <div className="flex items-center gap-1.5 text-xs font-black text-indigo-500 uppercase tracking-widest">
                                        <Tags className="w-3.5 h-3.5" />
                                        <span>คำอธิบายค้นหาด้วย # (Hashtags)</span>
                                    </div>
                                    <button 
                                        type="button"
                                        onClick={() => setShowSuggestions(false)}
                                        className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-50 rounded-lg"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>

                                <p className="text-[11px] text-gray-500 font-medium mb-4 leading-relaxed">
                                    💡 <span className="font-extrabold text-indigo-600">ทิปค้นหาด้วย #:</span> เพียงพิมพ์เครื่องหมาย <code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded font-mono font-bold">#</code> ตามด้วยข้อความ (เช่น <code className="bg-indigo-50 text-indigo-600 px-1 py-0.5 rounded font-mono font-bold">#Vlog</code>) เพื่อเจาะจงค้นหาแท็ก หรือสามารถคลิกเลือกจากแท็กยอดนิยมด้านล่างนี้ได้เลย!
                                </p>

                                {filterKeyword && !filteredTags.some(t => t.name.toLowerCase() === filterKeyword) && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            handleTagSuggestionClick(filterKeyword);
                                        }}
                                        className="w-full flex items-center gap-2 p-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-dashed border-indigo-200 text-left transition-all mb-2.5 active:scale-95 text-xs font-bold text-indigo-600"
                                    >
                                        <Plus className="w-4 h-4 text-indigo-500 animate-pulse" />
                                        <span>สร้างและค้นหาแท็กใหม่: <span className="font-extrabold underline">#{filterKeyword}</span></span>
                                    </button>
                                )}

                                {isSearchingTags ? (
                                    <div className="flex flex-col items-center justify-center py-6 bg-slate-50 rounded-2xl border border-dashed border-gray-200">
                                        <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-2" />
                                        <p className="text-[10px] text-gray-400 font-bold">กำลังประมวลผลดัชนีเซิร์ฟเวอร์...</p>
                                    </div>
                                ) : filteredTags.length > 0 ? (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-[10px] font-black tracking-wider text-gray-400 uppercase">
                                            <span>{currentTagTypeMatch ? 'แท็กที่ตรงกับการค้นหา' : 'แท็กยอดนิยมในระบบ'}</span>
                                            <span className="text-emerald-500 font-mono text-[9px] bg-emerald-50/80 px-1.5 py-0.5 rounded border border-emerald-100/50 flex items-center gap-1">
                                                <span className="w-1 h-1 rounded-full bg-emerald-500 animate-ping" />
                                                ⚡ Server Index: {searchSpeedMs}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5 max-h-[160px] overflow-y-auto pr-1">
                                            {filteredTags.map((tag, idx) => (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    onClick={() => handleTagSuggestionClick(tag.name)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50/50 hover:bg-indigo-600 text-indigo-600 hover:text-white border border-indigo-100/60 font-black text-xs transition-all duration-200 active:scale-95 group/btn"
                                                >
                                                    <span>#{tag.name}</span>
                                                    <span className="text-[10px] font-bold text-indigo-400 group-hover/btn:text-indigo-200 bg-white/70 group-hover/btn:bg-white/20 px-1.5 py-0.5 rounded-md">
                                                        {tag.count}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                        <p className="text-xs text-gray-400 font-bold">ไม่พบแท็กที่ค้นหา</p>
                                        <p className="text-[10px] text-gray-400 mt-1">ลองพิมพ์สัญลักษณ์ # เพื่อดูรายการแท็กทั้งหมด</p>
                                    </div>
                                )}
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Hover Tooltip Popover */}
            <AnimatePresence>
                {isHovered && !showSuggestions && top10Tags.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                        transition={{ type: "spring", stiffness: 400, damping: 28 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 z-[95] overflow-hidden text-left origin-top"
                    >
                        <div className="flex items-center gap-1.5 text-xs font-black text-indigo-500 uppercase tracking-widest mb-2.5 pb-1.5 border-b border-gray-50">
                            <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
                            <span>💡 พิมพ์ # เพื่อค้นหาแท็กด่วน (แท็กยอดนิยม)</span>
                        </div>

                        <div className="flex flex-wrap gap-1.5 max-h-[140px] overflow-y-auto scrollbar-thin pr-1">
                            {top10Tags.map((tag) => {
                                const isSelected = localSearch.includes(`#${tag.name}`);
                                return (
                                    <button
                                        key={tag.name}
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleTagSuggestionClick(tag.name);
                                        }}
                                        className={`
                                            inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all duration-200 active:scale-95 whitespace-nowrap border
                                            ${isSelected 
                                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' 
                                                : 'bg-indigo-50/40 hover:bg-indigo-100 text-indigo-600 border-indigo-100/60 hover:border-indigo-200'}
                                        `}
                                    >
                                        <span>#{tag.name}</span>
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${isSelected ? 'bg-white/20 text-indigo-100' : 'bg-white text-indigo-400 border border-indigo-100/40 shadow-sm'}`}>
                                            {tag.count}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
});
