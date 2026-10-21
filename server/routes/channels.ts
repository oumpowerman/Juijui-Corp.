import { Router, Request, Response } from 'express';
import { serverSupabase } from '../utils/supabase.js';
import { resolveRequestOrgId } from '../utils/tenantContext.js';
import { syncSingleChannelFollowers } from '../services/followerSyncService.js';

const router = Router();

// Server-side cache for aggregate content counts scoped per organization
interface CachedCountData {
    total: number;
    counts: Record<string, number>;
    timestamp: number;
    source: 'rpc' | 'head_aggregate';
}

const countCacheByOrg: Record<string, CachedCountData> = {};
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

    try {
        const activeOrgId = await resolveRequestOrgId(req);
        const cacheKey = `${activeOrgId || 'GLOBAL'}:${rawChannelIds || 'ALL'}`;
        const existingCache = countCacheByOrg[cacheKey];

        // 1. Return in-memory cache if valid within 60s
        if (!forceRefresh && existingCache && (Date.now() - existingCache.timestamp < CACHE_TTL_MS)) {
            return res.json({
                success: true,
                total: existingCache.total,
                counts: existingCache.counts,
                source: existingCache.source,
                cached: true,
            });
        }

        // 2. Aggregate head counts per channel scoped to activeOrgId
        let targetChannelIds: string[] = [];
        if (rawChannelIds && rawChannelIds.trim()) {
            targetChannelIds = rawChannelIds.split(',').map(s => s.trim()).filter(Boolean);
        } else {
            let channelsQuery = serverSupabase.from('channels').select('id');
            if (activeOrgId) {
                channelsQuery = channelsQuery.eq('org_id', activeOrgId);
            }
            const { data: channelsData } = await channelsQuery;
            if (channelsData) {
                targetChannelIds = channelsData.map((c: { id: string }) => c.id);
            }
        }

        const fallbackPromises = targetChannelIds.map(async (channelId) => {
            let contentCountQuery = serverSupabase
                .from('contents')
                .select('*', { count: 'exact', head: true })
                .eq('channel_id', channelId);
            if (activeOrgId) {
                contentCountQuery = contentCountQuery.eq('org_id', activeOrgId);
            }
            const { count, error } = await contentCountQuery;
            return { channelId, count: error ? 0 : (count || 0) };
        });

        const fallbackResults = await Promise.all(fallbackPromises);
        const fallbackCountsMap: Record<string, number> = {};
        let fallbackSum = 0;
        fallbackResults.forEach((item) => {
            fallbackCountsMap[item.channelId] = item.count;
            fallbackSum += item.count;
        });

        countCacheByOrg[cacheKey] = {
            total: fallbackSum,
            counts: fallbackCountsMap,
            timestamp: Date.now(),
            source: 'head_aggregate',
        };

        return res.json({
            success: true,
            total: fallbackSum,
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

/**
 * Endpoint: POST /api/channels/:id/sync-followers
 * Synchronizes followers for a single channel in isolation.
 * Runs in ~1-2 seconds with parallel platform scrapers.
 */
router.post('/api/channels/:id/sync-followers', async (req: Request, res: Response) => {
    const rawId = req.params.id;
    const channelId = Array.isArray(rawId) ? rawId[0] : rawId;
    if (!channelId || typeof channelId !== 'string') {
        return res.status(400).json({
            success: false,
            error: 'Missing channelId parameter',
        });
    }

    try {
        const result = await syncSingleChannelFollowers(channelId);
        return res.json({
            success: true,
            result,
        });
    } catch (err: any) {
        console.error(`[Channels API] Error syncing followers for channel ${channelId}:`, err);
        return res.status(500).json({
            success: false,
            error: err?.message || 'Failed to sync channel followers',
        });
    }
});

export default router;
