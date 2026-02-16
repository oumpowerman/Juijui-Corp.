
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Task } from '../types';

interface UseContentStockProps {
    page: number;
    pageSize: number;
    searchQuery: string;
    filters: {
        channelId: string;
        format: string;
        pillar: string;
        category: string;
        statuses: string[];
        showStockOnly: boolean;
        shootDateStart?: string; // Changed to Start
        shootDateEnd?: string;   // Changed to End
    };
    sortConfig: { key: string; direction: 'asc' | 'desc' } | null;
}

export const useContentStock = ({ page, pageSize, searchQuery, filters, sortConfig }: UseContentStockProps) => {
    const [contents, setContents] = useState<Task[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Refs to access current state inside stable useEffect for Realtime
    const searchRef = useRef(searchQuery);
    const filtersRef = useRef(filters);
    
    // Update Refs when props change
    useEffect(() => {
        searchRef.current = searchQuery;
        filtersRef.current = filters;
    }, [searchQuery, filters]);

    const mapSupabaseToTask = (data: any): Task => ({
        id: data.id,
        type: 'CONTENT',
        title: data.title,
        description: data.description || '',
        status: data.status,
        priority: data.priority,
        startDate: new Date(data.start_date),
        endDate: new Date(data.end_date),
        channelId: data.channel_id,
        // Safety: Ensure arrays are never null
        tags: Array.isArray(data.tags) ? data.tags : [],
        
        targetPlatforms: Array.isArray(data.target_platform) ? data.target_platform : [],
        pillar: data.pillar,
        contentFormat: data.content_format,
        category: data.category,
        isUnscheduled: data.is_unscheduled,
        
        assigneeIds: Array.isArray(data.assignee_ids) ? data.assignee_ids : [],
        ideaOwnerIds: Array.isArray(data.idea_owner_ids) ? data.idea_owner_ids : [],
        editorIds: Array.isArray(data.editor_ids) ? data.editor_ids : [],
        
        remark: data.remark,
        assets: Array.isArray(data.assets) ? data.assets : [],
        
        assigneeType: data.assignee_type || 'TEAM',
        difficulty: data.difficulty || 'MEDIUM',
        estimatedHours: data.estimated_hours || 0,
        caution: data.caution,
        importance: data.importance,
        publishedLinks: data.published_links || {},
        shootDate: data.shoot_date ? new Date(data.shoot_date) : undefined,
        shootLocation: data.shoot_location,
        
        reviews: Array.isArray(data.task_reviews) ? data.task_reviews.map((r: any) => ({
             id: r.id, taskId: r.content_id, round: r.round, scheduledAt: new Date(r.scheduled_at), 
             reviewerId: r.reviewer_id, status: r.status, feedback: r.feedback, isCompleted: r.is_completed
        })) : [],
        logs: []
    });

    const fetchContents = useCallback(async (isBackground = false) => {
        if (!isBackground) setIsLoading(true);
        else setIsRefreshing(true);

        try {
            let query = supabase
                .from('contents')
                .select(`*, task_reviews(id, round, scheduled_at, reviewer_id, status, feedback, is_completed, content_id)`, { count: 'exact' });

            // 1. Search
            if (searchQuery) {
                query = query.or(`title.ilike.%${searchQuery}%,remark.ilike.%${searchQuery}%,shoot_location.ilike.%${searchQuery}%`);
            }

            // 2. Filters
            if (filters.channelId !== 'ALL') query = query.eq('channel_id', filters.channelId);
            if (filters.format !== 'ALL') query = query.eq('content_format', filters.format);
            if (filters.pillar !== 'ALL') query = query.eq('pillar', filters.pillar);
            if (filters.category !== 'ALL') query = query.eq('category', filters.category);
            if (filters.statuses.length > 0) query = query.in('status', filters.statuses);
            
            // 2.1 Shoot Date Range Filter
            if (filters.shootDateStart) {
                query = query.gte('shoot_date', filters.shootDateStart);
            }
            if (filters.shootDateEnd) {
                query = query.lte('shoot_date', filters.shootDateEnd);
            }

            // Fixed: "Stock Only" logic
            if (filters.showStockOnly) {
                query = query.eq('is_unscheduled', true);
            }

            // 3. Sort
            if (sortConfig) {
                const sortKeyMap: Record<string, string> = {
                    'title': 'title', 'status': 'status', 'date': 'end_date', 'remark': 'remark'
                };
                const dbKey = sortKeyMap[sortConfig.key] || 'created_at';
                query = query.order(dbKey, { ascending: sortConfig.direction === 'asc' });
            } else {
                query = query.order('created_at', { ascending: false });
            }

            // 4. Pagination
            const from = (page - 1) * pageSize;
            const to = from + pageSize - 1;
            query = query.range(from, to);

            const { data, error, count } = await query;

            if (error) throw error;

            if (data) {
                setContents(data.map(mapSupabaseToTask));
                setTotalCount(count || 0);
            }
        } catch (err) {
            console.error('Fetch content stock failed:', err);
        } finally {
            if (!isBackground) setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [page, pageSize, searchQuery, filters, sortConfig]);

    // Initial Fetch
    useEffect(() => {
        fetchContents();
    }, [fetchContents]);

    // Ref to access fetch function in realtime callback if needed
    const fetchContentsRef = useRef(fetchContents);
    useEffect(() => {
        fetchContentsRef.current = fetchContents;
    }, [fetchContents]);

    // --- SMART HYDRATION LOGIC ---
    const checkDoesItMatchFilters = (task: Task) => {
        const currentSearch = searchRef.current.toLowerCase();
        const currentFilters = filtersRef.current;

        // Search Match
        if (currentSearch) {
            const titleMatch = (task.title || '').toLowerCase().includes(currentSearch);
            const remarkMatch = (task.remark || '').toLowerCase().includes(currentSearch);
            const locMatch = (task.shootLocation || '').toLowerCase().includes(currentSearch);
            if (!titleMatch && !remarkMatch && !locMatch) return false;
        }

        // Filter Match
        if (currentFilters.channelId !== 'ALL' && task.channelId !== currentFilters.channelId) return false;
        if (currentFilters.format !== 'ALL' && task.contentFormat !== currentFilters.format) return false;
        if (currentFilters.pillar !== 'ALL' && task.pillar !== currentFilters.pillar) return false;
        if (currentFilters.category !== 'ALL' && task.category !== currentFilters.category) return false;
        if (currentFilters.statuses.length > 0 && !currentFilters.statuses.includes(task.status as any)) return false;
        if (currentFilters.showStockOnly && !task.isUnscheduled) return false;
        
        // Shoot Date Range Match
        if (task.shootDate) {
             const taskShootStr = task.shootDate.toISOString().split('T')[0];
             if (currentFilters.shootDateStart && taskShootStr < currentFilters.shootDateStart) return false;
             if (currentFilters.shootDateEnd && taskShootStr > currentFilters.shootDateEnd) return false;
        } else {
             // If filter is active but task has no date, hide it? 
             // Usually yes, if searching for specific date range.
             if (currentFilters.shootDateStart || currentFilters.shootDateEnd) return false;
        }

        return true;
    };

    const handleRealtimeUpdate = async (id: string) => {
        try {
            const { data, error } = await supabase
                .from('contents')
                .select(`*, task_reviews(id, round, scheduled_at, reviewer_id, status, feedback, is_completed, content_id)`)
                .eq('id', id)
                .single();

            if (error || !data) return; 

            const fullTask = mapSupabaseToTask(data);
            const isMatch = checkDoesItMatchFilters(fullTask);

            setContents(prevList => {
                const exists = prevList.some(item => item.id === id);

                if (isMatch) {
                    if (exists) {
                        return prevList.map(item => item.id === id ? fullTask : item);
                    } else {
                        // For inserts/moves into view, we append to top to show activity
                        // But strictly, pagination might miss it if we just prepend.
                        // This acts as a "live stream" of updates.
                        return [fullTask, ...prevList]; 
                    }
                } else {
                    if (exists) {
                        return prevList.filter(item => item.id !== id);
                    } else {
                        return prevList;
                    }
                }
            });

        } catch (err) {
            console.error("Smart Hydration Error:", err);
        }
    };

    // Manual Update Function (Bridge for Global State Sync)
    const updateLocalItem = (task: Task) => {
        // Immediate update without DB fetch (Optimistic from Global State)
        setContents(prevList => {
            const exists = prevList.some(item => item.id === task.id);
            const isMatch = checkDoesItMatchFilters(task);

            if (isMatch) {
                if (exists) {
                     return prevList.map(item => item.id === task.id ? task : item);
                }
                 return prevList;
            } else {
                if (exists) return prevList.filter(item => item.id !== task.id);
                return prevList;
            }
        });
    };

    // Realtime Subscription
    useEffect(() => {
        let refreshTimeout: ReturnType<typeof setTimeout>;
        const triggerCountRefresh = () => {
            clearTimeout(refreshTimeout);
            refreshTimeout = setTimeout(() => {
                // Background refresh to update total counts
                fetchContentsRef.current(true); 
            }, 2000); 
        };

        const channel = supabase
            .channel('realtime-content-stock-smart-v3')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'contents' },
                async (payload) => {
                    const eventType = payload.eventType;
                    const newRec = payload.new as any;
                    const oldRec = payload.old as any;

                    if (eventType === 'UPDATE' || eventType === 'INSERT') {
                        await handleRealtimeUpdate(newRec.id);
                        if (eventType === 'INSERT') triggerCountRefresh();
                    } else if (eventType === 'DELETE') {
                        setContents(prev => prev.filter(item => item.id !== oldRec.id));
                        triggerCountRefresh();
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
            clearTimeout(refreshTimeout);
        };
    }, []);

    return { contents, totalCount, isLoading, isRefreshing, fetchContents, updateLocalItem };
};
