import { Router, Request, Response } from 'express';
import { 
  syncAllChannelFollowers, 
  getFollowerSyncLastRun,
  getFollowerSyncConfig,
  rescheduleFollowerCronJob
} from '../services/followerSyncService.js';
import { serverSupabase } from '../utils/supabase.js';
import { 
  createSyncSession, 
  getSyncSession, 
  handleSessionProgressEvent 
} from '../services/syncSessionStore.js';
import { 
  validateMetaAccessToken,
  extractInstagramUsername,
  fetchInstagramFollowersForToken
} from '../services/metaGraphApiService.js';

const router = Router();

// Validate CRON authorization (supports Header Authorization Bearer, x-cron-secret header, or session/admin)
function isAuthorized(req: Request): boolean {
    const configuredSecret = process.env.CRON_SECRET || 'juijui-cron-secret-key-2026';
    
    // 1. Check Bearer Authorization Header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.replace('Bearer ', '').trim();
        if (token === configuredSecret) return true;
    }

    // 2. Check X-Cron-Secret header
    const customHeader = req.headers['x-cron-secret'] as string | undefined;
    if (customHeader && customHeader === configuredSecret) return true;

    // 3. Check query secret param
    const querySecret = req.query.secret as string | undefined;
    if (querySecret && querySecret === configuredSecret) return true;

    // 4. Manual sync from web app UI or admin
    if (req.query.source === 'manual' || (req.body && req.body.source === 'manual')) {
        return true;
    }

    // 5. Check if authenticated user session exists (e.g. from internal App Admin click)
    const session = (req as any).session;
    if (session?.user?.role === 'ADMIN' || session?.user?.id) {
        return true;
    }

    // 6. In local/dev environments or internal preview, allow internal trigger
    if (process.env.NODE_ENV !== 'production') {
        return true;
    }

    return false;
}

/**
 * Endpoint: POST /api/cron/sync-followers-start
 * Starts follower synchronization as a background job and returns a sessionId for live polling
 */
router.post('/api/cron/sync-followers-start', async (req: Request, res: Response) => {
    if (!isAuthorized(req)) {
        return res.status(401).json({
            success: false,
            error: 'Unauthorized: Invalid or missing cron secret authorization',
        });
    }

    const source = (req.query.source as 'cron' | 'api' | 'manual') || 'manual';

    // 1. Create session
    const session = createSyncSession();

    // 2. Launch background worker with onProgress updater
    syncAllChannelFollowers(source, (event) => {
        handleSessionProgressEvent(session.id, event);
    }).catch((err: any) => {
        console.error(`[CronRoute] Background sync session ${session.id} error:`, err);
        handleSessionProgressEvent(session.id, {
            type: 'error',
            percentage: session.percentage,
            message: err?.message || 'การดึงข้อมูลขัดข้องบนเซิร์ฟเวอร์',
            timestamp: new Date().toISOString(),
        });
    });

    // 3. Immediately respond with sessionId
    return res.json({
        success: true,
        sessionId: session.id,
        session,
    });
});

/**
 * Endpoint: GET /api/cron/sync-status
 * Polls the real-time state of an ongoing follower sync session
 */
router.get('/api/cron/sync-status', (req: Request, res: Response) => {
    const sessionId = (req.query.sessionId as string) || '';
    if (!sessionId) {
        return res.status(400).json({
            success: false,
            error: 'Missing required query parameter: sessionId',
        });
    }

    const session = getSyncSession(sessionId);
    if (!session) {
        return res.status(404).json({
            success: false,
            error: 'Sync session not found or expired',
        });
    }

    // Set no-cache headers to ensure polling always gets fresh data
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    return res.json({
        success: true,
        session,
    });
});

/**
 * Endpoint: POST & GET /api/cron/sync-followers-stream
 * Server-Sent Events (SSE) stream for live progress tracking during manual sync
 */
const handleFollowerSyncStream = async (req: Request, res: Response) => {
    if (!isAuthorized(req)) {
        return res.status(401).json({
            success: false,
            error: 'Unauthorized: Invalid or missing cron secret authorization',
        });
    }

    const source = (req.query.source as 'cron' | 'api' | 'manual') || 'manual';

    // Set SSE headers
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no', // Disable proxy buffering (Nginx)
    });

    const sendProgress = (eventData: any) => {
        try {
            res.write(`data: ${JSON.stringify(eventData)}\n\n`);
            if (typeof (res as any).flush === 'function') {
                (res as any).flush();
            }
        } catch (writeErr) {
            console.warn('[CronRoute] Stream write error:', writeErr);
        }
    };

    // Keep-alive ping interval
    const pingInterval = setInterval(() => {
        try {
            res.write(': ping\n\n');
        } catch {
            clearInterval(pingInterval);
        }
    }, 5000);

    req.on('close', () => {
        clearInterval(pingInterval);
    });

    try {
        await syncAllChannelFollowers(source, sendProgress);
    } catch (err: any) {
        sendProgress({
            type: 'error',
            percentage: 0,
            message: err?.message || 'Sync failed on server',
            timestamp: new Date().toISOString(),
        });
    } finally {
        clearInterval(pingInterval);
        res.end();
    }
};

router.post('/api/cron/sync-followers-stream', handleFollowerSyncStream);
router.get('/api/cron/sync-followers-stream', handleFollowerSyncStream);

/**
 * Endpoint: POST /api/cron/sync-followers
 * Triggers follower synchronization across all channels.
 * Can be called by:
 *   - Supabase pg_cron / Cloud Scheduler (with Authorization: Bearer <CRON_SECRET>)
 *   - Frontend Admin manual sync button
 */
router.post('/api/cron/sync-followers', async (req: Request, res: Response) => {
    if (!isAuthorized(req)) {
        return res.status(401).json({
            success: false,
            error: 'Unauthorized: Invalid or missing cron secret authorization',
        });
    }

    const source = (req.query.source as 'cron' | 'api' | 'manual') || 'api';

    try {
        const summary = await syncAllChannelFollowers(source);
        return res.json({
            success: true,
            message: `Successfully synchronized ${summary.totalChannelsChecked} channels (${summary.totalChannelsUpdated} updated)`,
            summary,
        });
    } catch (err: any) {
        console.error('[CronRoute] Follower sync error:', err);
        return res.status(500).json({
            success: false,
            error: err?.message || 'Failed to sync followers',
        });
    }
});

/**
 * Endpoint: GET /api/cron/sync-followers
 * Also supports GET for easy testing and simple Webhook triggers
 */
router.get('/api/cron/sync-followers', async (req: Request, res: Response) => {
    if (!isAuthorized(req)) {
        return res.status(401).json({
            success: false,
            error: 'Unauthorized: Invalid or missing cron secret authorization',
        });
    }

    const source = (req.query.source as 'cron' | 'api' | 'manual') || 'cron';

    try {
        const summary = await syncAllChannelFollowers(source);
        return res.json({
            success: true,
            message: `Successfully synchronized ${summary.totalChannelsChecked} channels (${summary.totalChannelsUpdated} updated)`,
            summary,
        });
    } catch (err: any) {
        console.error('[CronRoute] Follower sync error:', err);
        return res.status(500).json({
            success: false,
            error: err?.message || 'Failed to sync followers',
        });
    }
});

/**
 * Endpoint: GET /api/cron/follower-sync-last-run
 * Returns the most recent global follower sync run status and timestamp
 */
router.get('/api/cron/follower-sync-last-run', async (req: Request, res: Response) => {
    try {
        const lastRun = await getFollowerSyncLastRun();
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
        return res.json({
            success: true,
            lastRun,
        });
    } catch (err: any) {
        return res.status(500).json({
            success: false,
            error: err?.message || 'Failed to fetch last run info',
        });
    }
});

/**
 * Endpoint: POST /api/cron/reschedule
 * Updates configuration in backend memory
 */
router.post('/api/cron/reschedule', async (req: Request, res: Response) => {
    try {
        const config = req.body?.config;
        await rescheduleFollowerCronJob(config);
        return res.json({ success: true, message: 'Follower sync configuration updated' });
    } catch (err: any) {
        return res.status(500).json({ success: false, error: err?.message || 'Failed to update schedule' });
    }
});

/**
 * Endpoint: GET /api/cron/info
 * Returns cron webhook URL, secret hints, and example SQL snippet for Supabase pg_cron setup
 */
router.get('/api/cron/info', async (req: Request, res: Response) => {
    try {
        const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
        const host = req.headers['x-forwarded-host'] || req.headers.host || '';
        const appUrl = `${protocol}://${host}`;
        const configuredSecret = process.env.CRON_SECRET || 'juijui-cron-secret-key-2026';

        return res.json({
            success: true,
            appUrl,
            webhookUrl: `${appUrl}/api/cron/sync-followers?source=cron`,
            cronSecret: configuredSecret,
        });
    } catch (err: any) {
        return res.status(500).json({ success: false, error: err?.message || 'Failed to get cron info' });
    }
});

/**
 * Endpoint: POST /api/follower-sync/test-meta-token
 * Validates Meta Access Token and lists accessible Instagram Business accounts
 */
router.post('/api/follower-sync/test-meta-token', async (req: Request, res: Response) => {
    try {
        const { accessToken, businessAccountId, targetUsername } = req.body || {};
        const result = await validateMetaAccessToken(accessToken, businessAccountId);

        let targetMatch: { matched: boolean; username: string; followersCount?: number; name?: string } | undefined = undefined;

        if (result.isValid && targetUsername) {
            const cleanTarget = extractInstagramUsername(targetUsername);
            if (cleanTarget) {
                // Check if directly in discovered accounts
                const foundInAccounts = result.accounts.find(
                    a => a.username.toLowerCase() === cleanTarget.toLowerCase()
                );
                if (foundInAccounts) {
                    targetMatch = {
                        matched: true,
                        username: foundInAccounts.username,
                        followersCount: foundInAccounts.followersCount,
                        name: foundInAccounts.name,
                    };
                } else {
                    // Try direct token query
                    const directCount = await fetchInstagramFollowersForToken(
                        cleanTarget,
                        accessToken,
                        businessAccountId,
                        'Test Verification'
                    );
                    if (typeof directCount === 'number') {
                        targetMatch = {
                            matched: true,
                            username: cleanTarget,
                            followersCount: directCount,
                        };
                    }
                }
            }
        }

        return res.json({
            success: result.isValid,
            user: result.user,
            accounts: result.accounts,
            targetMatch,
            isNeverExpiring: result.isNeverExpiring,
            expiresAt: result.expiresAt,
            expiresInSeconds: result.expiresInSeconds,
            tokenType: result.tokenType,
            error: result.error,
        });
    } catch (err: any) {
        return res.status(500).json({
            success: false,
            error: err?.message || 'Failed to validate Meta access token',
        });
    }
});

// In-memory cache for IG Connection Overview (5 minutes TTL)
interface CachedIgConnections {
    data: any;
    timestamp: number;
}
let igConnectionsCache: CachedIgConnections | null = null;
const IG_CONNECTIONS_CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * Endpoint: GET /api/follower-sync/ig-connections
 * Returns the Meta Graph connection status for all channels in the system
 */
router.get('/api/follower-sync/ig-connections', async (req: Request, res: Response) => {
    const force = req.query.force === '1' || req.query.force === 'true';
    if (!force && igConnectionsCache && (Date.now() - igConnectionsCache.timestamp < IG_CONNECTIONS_CACHE_TTL_MS)) {
        return res.json({
            success: true,
            ...igConnectionsCache.data,
            cached: true,
        });
    }

    try {
        const config = await getFollowerSyncConfig();
        const metaApi = config.metaApi;

        // 1. Gather all active tokens
        const tokensToTest: Array<{ token: string; businessAccountId?: string; label: string }> = [];
        const seenTokens = new Set<string>();

        if (metaApi?.tokenPool && Array.isArray(metaApi.tokenPool)) {
            for (const item of metaApi.tokenPool) {
                const t = (item.accessToken || '').trim();
                if (t && item.enabled !== false && !seenTokens.has(t)) {
                    tokensToTest.push({
                        token: t,
                        businessAccountId: item.businessAccountId,
                        label: item.label || 'Token Pool'
                    });
                    seenTokens.add(t);
                }
            }
        }

        const globalToken = (metaApi?.accessToken || process.env.META_ACCESS_TOKEN || '').trim();
        if (globalToken && !seenTokens.has(globalToken)) {
            tokensToTest.push({
                token: globalToken,
                businessAccountId: metaApi?.businessAccountId,
                label: 'Global Token'
            });
            seenTokens.add(globalToken);
        }

        // 2. Discover accounts from all active tokens
        const discoveredAccounts: Array<{
            id: string;
            username: string;
            name?: string;
            followersCount: number;
            pageName?: string;
            tokenLabel: string;
        }> = [];

        for (const tItem of tokensToTest) {
            try {
                const valResult = await validateMetaAccessToken(tItem.token, tItem.businessAccountId);
                if (valResult.isValid && Array.isArray(valResult.accounts)) {
                    for (const acc of valResult.accounts) {
                        discoveredAccounts.push({
                            id: acc.id,
                            username: acc.username.toLowerCase(),
                            name: acc.name,
                            followersCount: acc.followersCount,
                            pageName: acc.pageName,
                            tokenLabel: tItem.label
                        });
                    }
                }
            } catch (accErr) {
                console.warn(`[IG Connections] Error discovering accounts for ${tItem.label}:`, accErr);
            }
        }

        // 3. Fetch all channels
        const { data: channelsData, error: chErr } = await serverSupabase
            .from('channels')
            .select('id, name, logoUrl, color, social_links, followers, meta_api, status, group_id, group_name')
            .order('name');

        if (chErr) throw chErr;

        const channels = channelsData || [];
        const channelStatuses = channels.map((ch: any) => {
            const igUrl = ch.social_links?.INSTAGRAM || ch.social_links?.instagram || '';
            if (!igUrl || typeof igUrl !== 'string' || !igUrl.trim()) {
                return {
                    channelId: ch.id,
                    channelName: ch.name,
                    logoUrl: ch.logoUrl,
                    color: ch.color,
                    groupName: ch.group_name,
                    status: 'NO_IG_LINK',
                    igUrl: '',
                    igUsername: '',
                    message: 'ยังไม่มีลิงก์ IG',
                    isMetaConnected: false,
                };
            }

            const cleanUsername = extractInstagramUsername(igUrl);
            const channelMeta = ch.meta_api;
            const hasChannelOverride = Boolean(channelMeta?.enabled !== false && channelMeta?.accessToken?.trim());

            if (hasChannelOverride) {
                return {
                    channelId: ch.id,
                    channelName: ch.name,
                    logoUrl: ch.logoUrl,
                    color: ch.color,
                    groupName: ch.group_name,
                    status: 'CONNECTED',
                    igUrl,
                    igUsername: cleanUsername || '',
                    matchedType: 'channel_override',
                    matchedTokenLabel: 'Token เฉพาะช่อง',
                    message: 'เชื่อมต่อผ่าน Token เฉพาะช่อง',
                    isMetaConnected: true,
                };
            }

            if (cleanUsername) {
                const normUser = cleanUsername.toLowerCase();
                const matched = discoveredAccounts.find(
                    a => a.username === normUser || a.username.replace(/[^a-z0-9]/g, '') === normUser.replace(/[^a-z0-9]/g, '')
                );

                if (matched) {
                    return {
                        channelId: ch.id,
                        channelName: ch.name,
                        logoUrl: ch.logoUrl,
                        color: ch.color,
                        groupName: ch.group_name,
                        status: 'CONNECTED',
                        igUrl,
                        igUsername: cleanUsername,
                        matchedType: 'token_pool',
                        matchedAccount: matched,
                        matchedTokenLabel: matched.tokenLabel,
                        message: `เชื่อมต่อแล้ว (พบใน ${matched.pageName || matched.name || 'Token'} - ${matched.tokenLabel})`,
                        isMetaConnected: true,
                    };
                }
            }

            return {
                channelId: ch.id,
                channelName: ch.name,
                logoUrl: ch.logoUrl,
                color: ch.color,
                groupName: ch.group_name,
                status: 'NOT_FOUND_IN_TOKEN',
                igUrl,
                igUsername: cleanUsername || '',
                message: 'มีลิงก์ IG แต่ยังไม่พบใน Token ที่เชื่อมต่อไว้',
                isMetaConnected: false,
            };
        });

        const summary = {
            totalChannels: channels.length,
            connectedCount: channelStatuses.filter((s: any) => s.status === 'CONNECTED').length,
            notFoundCount: channelStatuses.filter((s: any) => s.status === 'NOT_FOUND_IN_TOKEN').length,
            noLinkCount: channelStatuses.filter((s: any) => s.status === 'NO_IG_LINK').length,
            activeTokensCount: tokensToTest.length,
            discoveredAccountsCount: discoveredAccounts.length,
        };

        const resultData = {
            channels: channelStatuses,
            summary,
            discoveredAccounts,
            timestamp: new Date().toISOString(),
        };

        igConnectionsCache = {
            data: resultData,
            timestamp: Date.now(),
        };

        return res.json({
            success: true,
            ...resultData,
            cached: false,
        });

    } catch (err: any) {
        console.error('[IG Connections] Error checking connection statuses:', err);
        return res.status(500).json({
            success: false,
            error: err?.message || 'Failed to check IG connections',
        });
    }
});

export default router;
