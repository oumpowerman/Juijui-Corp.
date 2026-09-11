import { useState, useCallback, useEffect } from 'react';
import { Channel } from '../../../types';
import { supabase } from '../../../lib/supabase';

export function useContentCounts(channels: Channel[]) {
  const [contentCountMap, setContentCountMap] = useState<Record<string, number>>({});
  const [totalContentsCount, setTotalContentsCount] = useState<number>(0);
  const [isRefreshingCounts, setIsRefreshingCounts] = useState(false);

  const fetchDirectContentCounts = useCallback(async (force = false) => {
    if (channels.length === 0) {
      setContentCountMap({});
      setTotalContentsCount(0);
      return;
    }

    setIsRefreshingCounts(true);
    try {
      // 1. Primary: Server-Side Aggregation endpoint
      const channelIdsParam = channels.map(c => c.id).join(',');
      const res = await fetch(`/api/channels/content-counts?channelIds=${encodeURIComponent(channelIdsParam)}${force ? '&force=1' : ''}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          const counts: Record<string, number> = json.counts || {};
          const sumOfCounts = Object.values(counts).reduce((sum, n) => sum + (Number(n) || 0), 0);
          const finalTotal = typeof json.total === 'number' && json.total > 0 ? json.total : sumOfCounts;
          setContentCountMap(counts);
          setTotalContentsCount(finalTotal);
          return;
        }
      }

      // 2. Fallback: Direct database query
      const channelPromises = channels.map(async (ch) => {
        const { count, error } = await supabase
          .from('contents')
          .select('*', { count: 'exact', head: true })
          .eq('channel_id', ch.id);
        return { id: ch.id, count: error ? 0 : (count || 0) };
      });

      const channelResults = await Promise.all(channelPromises);

      const map: Record<string, number> = {};
      let fallbackSum = 0;
      channelResults.forEach(r => {
        map[r.id] = r.count;
        fallbackSum += r.count;
      });

      setContentCountMap(map);
      setTotalContentsCount(fallbackSum);
    } catch (err) {
      console.warn('[useContentCounts] Aggregation count error:', err);
    } finally {
      setIsRefreshingCounts(false);
    }
  }, [channels]);

  useEffect(() => {
    fetchDirectContentCounts();
  }, [fetchDirectContentCounts]);

  return {
    contentCountMap,
    totalContentsCount,
    isRefreshingCounts,
    refetchCounts: () => fetchDirectContentCounts(true),
  };
}
