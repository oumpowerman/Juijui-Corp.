import { supabase } from '../../lib/supabase';
import { CONTENT_FULL_SELECT_FIELDS } from '../../lib/taskSchema';
import { StockFilters, StockSortConfig } from './types';

interface BuildStockQueryParams {
    page: number;
    pageSize: number;
    searchQuery: string;
    filters: StockFilters;
    sortConfig: StockSortConfig | null;
    isUsingMemoryFilter?: boolean;
}

/**
 * Builds the main query for fetching content stock items with pagination, filters, and sorting.
 */
export const buildContentStockQuery = (
    { page, pageSize, searchQuery, filters, sortConfig, isUsingMemoryFilter }: BuildStockQueryParams,
    client = supabase
) => {
    let query = client
        .from('contents')
        .select(CONTENT_FULL_SELECT_FIELDS, { count: 'exact' });

    // 1. Search Query
    if (searchQuery) {
        let searchTags: string[] = [];
        let cleanSearchQuery = searchQuery;
        
        const hashTags = searchQuery.match(/#\S+/g);
        if (hashTags) {
            searchTags = hashTags.map(tag => tag.slice(1).trim()).filter(Boolean);
            cleanSearchQuery = searchQuery.replace(/#\S+/g, '').trim();
        }

        if (searchTags.length > 0) {
            query = query.contains('tags', searchTags);
        }

        if (cleanSearchQuery) {
            query = query.or(`title.ilike.%${cleanSearchQuery}%,remark.ilike.%${cleanSearchQuery}%,shoot_location.ilike.%${cleanSearchQuery}%`);
        }
    }

    // 2. Channel Filter
    if (filters.channelId && filters.channelId.length > 0) {
        const hasNoChannel = filters.channelId.includes('NO_CHANNEL');
        const realChannels = filters.channelId.filter(id => id !== 'NO_CHANNEL');
        
        if (hasNoChannel && realChannels.length > 0) {
            query = query.or(`channel_id.in.(${realChannels.join(',')}),channel_id.is.null`);
        } else if (hasNoChannel) {
            query = query.is('channel_id', null);
        } else {
            query = query.in('channel_id', realChannels);
        }
    }
    
    // 3. Format, Pillar, Category
    if (filters.format && filters.format.length > 0) {
        query = query.overlaps('content_formats', filters.format);
    }
    
    if (filters.pillar && filters.pillar.length > 0) {
        query = query.in('pillar', filters.pillar);
    }

    if (filters.category && filters.category.length > 0) {
        query = query.in('category', filters.category);
    }
    
    // 4. Stock Only
    if (filters.showStockOnly) {
        query = query.eq('is_unscheduled', true);
    }

    // 5. Missing Storage
    if (filters.onlyMissingStorage) {
        query = query
            .or('local_path.is.null,drive_label.is.null')
            .or('status.ilike.%edit%,status.ilike.%feedback%,status.ilike.%approve%,status.ilike.%done%,status.ilike.%publish%,status.ilike.%posted%,status.ilike.%complete%,status.ilike.%success%');
    }

    // 6. Active vs Archive / Overdue Tab Logic
    if (filters.onlyOverdue) {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        query = query
            .or('status.ilike.%done%,status.ilike.%publish%,status.ilike.%posted%,status.ilike.%complete%,status.ilike.%success%')
            .lte('end_date', sevenDaysAgo.toISOString())
            .eq('is_unscheduled', false)
            .neq('analytics_status', 'COMPLETE');

        if (filters.statuses && filters.statuses.length > 0) {
            query = query.in('status', filters.statuses);
        }
    } else if (filters.contentSubTab === 'ARCHIVE') {
        query = query.or('status.ilike.%done%,status.ilike.%publish%,status.ilike.%posted%,status.ilike.%complete%,status.ilike.%success%');
    } else {
        // Default to ACTIVE: exclude terminal statuses
        query = query
            .not('status', 'ilike', '%done%')
            .not('status', 'ilike', '%publish%')
            .not('status', 'ilike', '%posted%')
            .not('status', 'ilike', '%complete%')
            .not('status', 'ilike', '%success%');
        
        if (filters.statuses && filters.statuses.length > 0) {
            query = query.in('status', filters.statuses);
        }
    }
    
    // 7. Shoot Date Range Filter
    if (filters.hasShootDate) {
        query = query.not('shoot_date', 'is', null);
    }
    if (filters.shootDateStart) {
        query = query.gte('shoot_date', filters.shootDateStart);
    }
    if (filters.shootDateEnd) {
        query = query.lte('shoot_date', filters.shootDateEnd);
    }

    // 8. Sorting
    if (sortConfig) {
        const sortKeyMap: Record<string, string> = {
            'title': 'title', 
            'status': 'status', 
            'date': 'end_date', 
            'publishDate': 'end_date',
            'shootDate': 'shoot_date',
            'remark': 'remark',
            'shortNote': 'remark',
            'ideaOwner': 'idea_owner_ids',
            'editor': 'editor_ids',
            'helper': 'assignee_ids',
            'createdAt': 'created_at'
        };
        const dbKey = sortKeyMap[sortConfig.key] || 'created_at';
        
        const isPublishDateSort = sortConfig.key === 'publishDate' || sortConfig.key === 'date';
        if (isPublishDateSort) {
            query = query.order('is_unscheduled', { ascending: true });
        }

        query = query.order(dbKey, { 
            ascending: sortConfig.direction === 'asc',
            nullsFirst: false 
        });
    } else {
        query = query.order('created_at', { ascending: false });
    }

    // 9. Pagination (bypassed if memory filter is active)
    if (!isUsingMemoryFilter) {
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;
        query = query.range(from, to);
    }

    return query;
};

/**
 * Builds the query to count overdue analytics tasks.
 */
export const buildOverdueCountQuery = (filters: StockFilters, client = supabase) => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    let overdueQuery = client
        .from('contents')
        .select('*', { count: 'exact', head: true })
        .or('status.ilike.%done%,status.ilike.%publish%,status.ilike.%posted%,status.ilike.%complete%,status.ilike.%success%')
        .lte('end_date', sevenDaysAgo.toISOString())
        .eq('is_unscheduled', false)
        .neq('analytics_status', 'COMPLETE');

    if (filters.channelId && filters.channelId.length > 0) {
        const hasNoChannel = filters.channelId.includes('NO_CHANNEL');
        const realChannels = filters.channelId.filter(id => id !== 'NO_CHANNEL');
        if (hasNoChannel && realChannels.length > 0) {
            overdueQuery = overdueQuery.or(`channel_id.in.(${realChannels.join(',')}),channel_id.is.null`);
        } else if (hasNoChannel) {
            overdueQuery = overdueQuery.is('channel_id', null);
        } else {
            overdueQuery = overdueQuery.in('channel_id', realChannels);
        }
    }

    return overdueQuery;
};

/**
 * Builds the query to count tasks with missing storage (local_path or drive_label).
 */
export const buildMissingStorageCountQuery = (filters: StockFilters, client = supabase) => {
    let missingStorageQuery = client
        .from('contents')
        .select('*', { count: 'exact', head: true })
        .or('local_path.is.null,drive_label.is.null');

    if (filters.contentSubTab === 'ARCHIVE') {
        missingStorageQuery = missingStorageQuery
            .or('status.ilike.%done%,status.ilike.%publish%,status.ilike.%posted%,status.ilike.%complete%,status.ilike.%success%');
    } else {
        missingStorageQuery = missingStorageQuery
            .or('status.ilike.%edit%,status.ilike.%feedback%,status.ilike.%approve%');
    }

    if (filters.channelId && filters.channelId.length > 0) {
        const hasNoChannel = filters.channelId.includes('NO_CHANNEL');
        const realChannels = filters.channelId.filter(id => id !== 'NO_CHANNEL');
        if (hasNoChannel && realChannels.length > 0) {
            missingStorageQuery = missingStorageQuery.or(`channel_id.in.(${realChannels.join(',')}),channel_id.is.null`);
        } else if (hasNoChannel) {
            missingStorageQuery = missingStorageQuery.is('channel_id', null);
        } else {
            missingStorageQuery = missingStorageQuery.in('channel_id', realChannels);
        }
    }

    return missingStorageQuery;
};

/**
 * Builds query to count contents with unassigned channel (channel_id is null).
 */
export const buildUnassignedChannelCountQuery = (client = supabase) => {
    return client
        .from('contents')
        .select('*', { count: 'exact', head: true })
        .is('channel_id', null);
};
