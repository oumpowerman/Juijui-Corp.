import { useState, useCallback, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { ContentAnalytics, Task } from '../types';
import { mapSupabaseToAnalytics } from '../services/analyticsService';
import { startOfMonth, endOfMonth, subDays, isWithinInterval } from 'date-fns';
import { useTaskContext } from '../context/TaskContext';

export interface ContentWithAnalytics extends Task {
    analytics?: ContentAnalytics[];
}

export const useContentAnalyticsFetcher = () => {
    const { tasks: contextTasks, isFetching: isContextFetching } = useTaskContext();
    const [analyticsData, setAnalyticsData] = useState<Record<string, ContentAnalytics[]>>({});
    const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
    
    const [platformFilter, setPlatformFilter] = useState('ALL');
    const [channelFilter, setChannelFilter] = useState(() => localStorage.getItem('defaultAnalyticsChannel') || '');
    const [timeRange, setTimeRange] = useState('CURRENT_MONTH');

    // 1. Filter context tasks locally based on view settings
    const filteredTasks = useMemo(() => {
        let startDate: Date | null = null;
        let endDate: Date | null = null;

        if (timeRange === 'CURRENT_MONTH') {
            startDate = startOfMonth(new Date());
            endDate = endOfMonth(new Date());
        } else if (timeRange !== 'ALL') {
            const days = parseInt(timeRange);
            startDate = subDays(new Date(), days);
            endDate = new Date();
        }

        return contextTasks.filter(task => {
            if (task.type !== 'CONTENT') return false;
            
            const matchesChannel = channelFilter === 'ALL' || task.channelId === channelFilter;
            if (!matchesChannel) return false;

            if (startDate && endDate) {
                const taskDate = task.endDate || task.startDate || task.createdAt;
                return isWithinInterval(taskDate, { start: startDate, end: endDate });
            }

            return true;
        });
    }, [contextTasks, channelFilter, timeRange]);

    // 2. Fetch detailed analytics only for the tasks currently in view
    // Use a ref to track what we've already fetched to avoid redundant calls
    const lastFetchedIdsRef = useMemo(() => ({ ids: "" }), []);

    const fetchAnalytics = useCallback(async () => {
        const contentIds = filteredTasks.map(t => t.id).sort();
        const idsKey = contentIds.join(',');
        
        if (filteredTasks.length === 0 || idsKey === lastFetchedIdsRef.ids) return;
        
        setIsLoadingAnalytics(true);
        try {
            // Keep track of what we are fetching
            lastFetchedIdsRef.ids = idsKey;

            const { data: analyticsRaw, error } = await supabase
                .from('content_analytics')
                .select('*')
                .in('content_id', contentIds)
                .order('captured_at', { ascending: true });

            if (error) throw error;

            const mapped = (analyticsRaw || []).map(a => mapSupabaseToAnalytics(a));
            
            // Group by contentId
            const grouped = mapped.reduce((acc, curr) => {
                if (!acc[curr.contentId]) acc[curr.contentId] = [];
                acc[curr.contentId].push(curr);
                return acc;
            }, {} as Record<string, ContentAnalytics[]>);

            setAnalyticsData(grouped);
        } catch (err) {
            console.error('Failed to fetch analytics enrichment:', err);
            // Reset ref on error to allow retry
            lastFetchedIdsRef.ids = "";
        } finally {
            setIsLoadingAnalytics(false);
        }
    }, [filteredTasks, lastFetchedIdsRef]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchAnalytics();
        }, 150); // Small debounce
        return () => clearTimeout(timer);
    }, [fetchAnalytics]);

    // 3. Merge tasks with their analytics
    const enrichedData = useMemo(() => {
        return filteredTasks.map(task => ({
            ...task,
            analytics: analyticsData[task.id] || []
        }));
    }, [filteredTasks, analyticsData]);

    // 4. Calculate pending tasks (Tasks that should have analytics but don't)
    const pendingTasks = useMemo(() => {
        const sevenDaysAgo = subDays(new Date(), 7);
        const thirtyDaysAgo = subDays(new Date(), 30);

        return contextTasks.filter(task => {
            if (task.type !== 'CONTENT' || task.isUnscheduled) return false;
            
            const taskDate = task.endDate || task.startDate;
            if (!taskDate) return false;

            const isInPendingWindow = taskDate >= thirtyDaysAgo && taskDate <= sevenDaysAgo;
            if (!isInPendingWindow) return false;

            const status = (task.status || '').toUpperCase();
            const isDone = status.includes('DONE') || ['PUBLISHED', 'FINAL', 'POSTED', 'COMPLETE', 'COMPLETED'].includes(status);
            if (!isDone) return false;

            // Check if ANY analytics exist for this content (using the hasAnalytics flag from context)
            return !task.hasAnalytics;
        });
    }, [contextTasks]);

    return {
        data: enrichedData,
        pendingTasks,
        isLoading: isContextFetching || isLoadingAnalytics,
        platformFilter,
        setPlatformFilter,
        channelFilter,
        setChannelFilter,
        timeRange,
        setTimeRange,
        refetch: fetchAnalytics
    };
};
