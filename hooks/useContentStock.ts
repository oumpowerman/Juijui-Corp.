import { useState, useEffect, useCallback } from 'react';
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
    };
    sortConfig: { key: string; direction: 'asc' | 'desc' } | null;
}

export const useContentStock = ({ page, pageSize, searchQuery, filters, sortConfig }: UseContentStockProps) => {
    const [contents, setContents] = useState<Task[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

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
        tags: data.tags || [],
        
        targetPlatforms: data.target_platform || [],
        pillar: data.pillar,
        contentFormat: data.content_format,
        category: data.category,
        isUnscheduled: data.is_unscheduled,
        
        assigneeIds: data.assignee_ids || [],
        ideaOwnerIds: data.idea_owner_ids || [],
        editorIds: data.editor_ids || [],
        
        remark: data.remark,
        assets: data.assets || [],
        
        // Additional fields to satisfy Task interface
        assigneeType: data.assignee_type || 'TEAM',
        difficulty: data.difficulty || 'MEDIUM',
        estimatedHours: data.estimated_hours || 0,
        caution: data.caution,
        importance: data.importance,
        publishedLinks: data.published_links || {},
        shootDate: data.shoot_date ? new Date(data.shoot_date) : undefined,
        shootLocation: data.shoot_location,
        
        // Empty arrays for list view optimization
        reviews: [],
        logs: []
    });

    const fetchContents = useCallback(async () => {
        setIsLoading(true);
        try {
            let query = supabase
                .from('contents')
                .select('*', { count: 'exact' });

            // 1. Search
            if (searchQuery) {
                query = query.or(`title.ilike.%${searchQuery}%,remark.ilike.%${searchQuery}%`);
            }

            // 2. Filters
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
                query = query.eq('category', filters.category);
            }
            if (filters.statuses.length > 0) {
                query = query.in('status', filters.statuses);
            }
            if (filters.showStockOnly) {
                query = query.eq('is_unscheduled', true);
            }

            // 3. Sort
            if (sortConfig) {
                const sortKeyMap: Record<string, string> = {
                    'title': 'title',
                    'status': 'status',
                    'date': 'end_date',
                    'remark': 'remark'
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
            setIsLoading(false);
        }
    }, [page, pageSize, searchQuery, filters, sortConfig]);

    useEffect(() => {
        fetchContents();
    }, [fetchContents]);

    // Realtime Subscription (Hybrid Logic)
    useEffect(() => {
        const channel = supabase
            .channel('realtime-content-stock')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'contents' },
                (payload) => {
                    if (payload.eventType === 'UPDATE') {
                        // Optimistic update: Update only the specific item in the list directly
                        setContents(prev => prev.map(item => 
                            item.id === payload.new.id ? mapSupabaseToTask(payload.new) : item
                        ));
                    } else {
                        // For INSERT or DELETE, refetch to maintain pagination/sort integrity
                        fetchContents();
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchContents]);

    return { contents, totalCount, isLoading, fetchContents };
};