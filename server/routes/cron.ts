import { Router, Request, Response } from 'express';
import { syncAllChannelFollowers } from '../services/followerSyncService.js';
import { 
  createSyncSession, 
  getSyncSession, 
  handleSessionProgressEvent 
} from '../services/syncSessionStore.js';

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

export default router;
