
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Task, TaskLog, ReviewSession } from '../types';

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
    };
    sortConfig: { key: string; direction: 'asc' | 'desc' } | null;
}

export const useContentStock = ({ page, pageSize, searchQuery, filters, sortConfig }: UseContentStockProps) => {
    const [contents, setContents] = useState<Task[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    // Map Raw DB Data to Task Type (Simplified for Content List)
    const mapSupabaseToTask = (data: any): Task => {
        return {
            id: data.id,
            title: data.title,
            description: data.description || '',
            type: 'CONTENT',
            status: data.status,
            priority: data.priority,
            tags: data.tags || [],
            pillar: data.pillar,
            contentFormat: data.content_format,
            category: data.category,
            remark: data.remark,
            startDate: new Date(data.start_date),
            endDate: new Date(data.end_date),
            channelId: data.channel_id,
            targetPlatforms: data.target_platform || [],
            isUnscheduled: data.is_unscheduled,
            assigneeIds: data.assignee_ids || [],
            ideaOwnerIds: data.idea_owner_ids || [],
            editorIds: data.editor_ids || [],
            assets: data.assets || [],
            difficulty: data.difficulty || 'MEDIUM',
            estimatedHours: data.estimated_hours || 0,
            // Minimal mapping for list view
            assigneeType: 'TEAM', 
            reviews: [],
            logs: []
        };
    };

    const fetchContents = useCallback(async () => {
        setIsLoading(true);
        try {
            // Start building the query
            let query = supabase
                .from('contents')
                .select('*', { count: 'exact' });

            // 1. Apply Filters
            if (filters.showStockOnly) {
                query = query.eq('is_unscheduled', true);
            }

            if (filters.channelId !== 'ALL') {
                query = query.eq('channel_id', filters.channelId);
            }

            if (filters.format !== 'ALL') {
                query = query.eq('content_format', filters.format);
            }

            if (filters.pillar !== 'ALL') {
                query = query.eq('pillar', filters.pillar);
            }

            if (filters.category !== 'ALL') {
                // Fuzzy search for category since it might be key or label in legacy data
                // For better performance, exact match on key is preferred if data is clean
                query = query.eq('category', filters.category);
            }

            if (filters.statuses.length > 0) {
                query = query.in('status', filters.statuses);
            }

            // 2. Apply Search
            if (searchQuery) {
                // Search across multiple columns
                query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,remark.ilike.%${searchQuery}%`);
            }

            // 3. Apply Sorting
            if (sortConfig) {
                // Map frontend sort keys to DB columns
                let dbColumn = 'created_at';
                switch (sortConfig.key) {
                    case 'title': dbColumn = 'title'; break;
                    case 'status': dbColumn = 'status'; break;
                    case 'date': dbColumn = 'end_date'; break;
                    case 'remark': dbColumn = 'remark'; break;
                    default: dbColumn = 'end_date'; // Default to date
                }
                
                query = query.order(dbColumn, { ascending: sortConfig.direction === 'asc' });
            } else {
                // Default sort
                query = query.order('end_date', { ascending: false });
            }

            // 4. Apply Pagination
            const from = (page - 1) * pageSize;
            const to = from + pageSize - 1;
            query = query.range(from, to);

            // Execute
            const { data, error, count } = await query;

            if (error) throw error;

            if (data) {
                setContents(data.map(mapSupabaseToTask));
                setTotalCount(count || 0);
            }
        } catch (err) {
            console.error('Error fetching contents:', err);
        } finally {
            setIsLoading(false);
        }
    }, [page, pageSize, searchQuery, filters, sortConfig]);

    // Initial Fetch & Refetch on deps change
    useEffect(() => {
        fetchContents();
    }, [fetchContents]);

    // Realtime Subscription
    useEffect(() => {
        const channel = supabase
            .channel('realtime-content-stock')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'contents' },
                () => {
                    // Debounce/Throttle could be added here for high traffic
                    fetchContents();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchContents]);

    return {
        contents,
        totalCount,
        isLoading,
        refresh: fetchContents
    };
};
