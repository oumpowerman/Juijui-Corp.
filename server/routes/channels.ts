import { Router, Request, Response } from 'express';
import { serverSupabase } from '../utils/supabase.js';

const router = Router();

// Server-side cache for aggregate content counts
interface CachedCountData {
    total: number;
    counts: Record<string, number>;
    timestamp: number;
    source: 'rpc' | 'head_aggregate';
}

let countCache: CachedCountData | null = null;
const CACHE_TTL_MS = 60 * 1000; // 60 seconds cache TTL

/**
 * Endpoint: GET /api/channels/content-counts
 * Performs server-side aggregation (Single-query RPC with Head Count fallback).
 * Query params:
 *   - channelIds: comma-separated list of channel UUIDs (optional)
 *   - force: '1' to bypass cache (e.g. manual refresh button clicked)
 */
router.get('/api/channels/content-counts', async (req: Request, res: Response) => {
    const rawChannelIds = req.query.channelIds as string | undefined;
    const forceRefresh = req.query.force === '1';

    // 1. Return in-memory cache if valid within 60s
    if (!forceRefresh && countCache && (Date.now() - countCache.timestamp < CACHE_TTL_MS)) {
        return res.json({
            success: true,
            total: countCache.total,
            counts: countCache.counts,
            source: countCache.source,
            cached: true,
        });
    }

    try {
        // Total count (0-byte payload, exact count via HTTP header)
        const totalPromise = serverSupabase
            .from('contents')
            .select('*', { count: 'exact', head: true });

        // 2. Primary: Try PostgreSQL RPC Function (1 database pass, GROUP BY channel_id)
        const rpcPromise = serverSupabase.rpc('get_channel_content_counts');

        const [totalResult, rpcResult] = await Promise.allSettled([
            totalPromise,
            rpcPromise,
        ]);

        const totalCount = totalResult.status === 'fulfilled' && !totalResult.value.error
            ? (totalResult.value.count || 0)
            : 0;

        // If RPC succeeds, map grouped rows directly
        if (rpcResult.status === 'fulfilled' && !rpcResult.value.error && Array.isArray(rpcResult.value.data)) {
            const countsMap: Record<string, number> = {};
            rpcResult.value.data.forEach((row: { channel_id?: string; content_count?: number | string }) => {
                if (row.channel_id) {
                    countsMap[row.channel_id] = Number(row.content_count || 0);
                }
            });

            countCache = {
                total: totalCount,
                counts: countsMap,
                timestamp: Date.now(),
                source: 'rpc',
            };

            return res.json({
                success: true,
                total: totalCount,
                counts: countsMap,
                source: 'rpc',
                cached: false,
            });
        }

        // 3. Resilient Fallback: If RPC is not yet created in remote DB, aggregate head counts
        let targetChannelIds: string[] = [];
        if (rawChannelIds && rawChannelIds.trim()) {
            targetChannelIds = rawChannelIds.split(',').map(s => s.trim()).filter(Boolean);
        } else {
            const { data: channelsData } = await serverSupabase
                .from('channels')
                .select('id');
            if (channelsData) {
                targetChannelIds = channelsData.map((c: { id: string }) => c.id);
            }
        }

        const fallbackPromises = targetChannelIds.map(async (channelId) => {
            const { count, error } = await serverSupabase
                .from('contents')
                .select('*', { count: 'exact', head: true })
                .eq('channel_id', channelId);
            return { channelId, count: error ? 0 : (count || 0) };
        });

        const fallbackResults = await Promise.all(fallbackPromises);
        const fallbackCountsMap: Record<string, number> = {};
        fallbackResults.forEach((item) => {
            fallbackCountsMap[item.channelId] = item.count;
        });

        countCache = {
            total: totalCount,
            counts: fallbackCountsMap,
            timestamp: Date.now(),
            source: 'head_aggregate',
        };

        return res.json({
            success: true,
            total: totalCount,
            counts: fallbackCountsMap,
            source: 'head_aggregate',
            cached: false,
        });

    } catch (err: any) {
        console.error('[Channels API] Error aggregating content counts:', err);
        return res.status(500).json({
            success: false,
            error: err?.message || 'Failed to aggregate content counts',
            total: 0,
            counts: {},
        });
    }
});

export default router;
