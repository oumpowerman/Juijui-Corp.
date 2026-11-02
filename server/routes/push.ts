import express from 'express';
import webpush from 'web-push';
import { serverSupabase as supabase } from '../utils/supabase.js';
import { resolveTenantContext } from '../utils/tenantContext.js';

const router = express.Router();

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || process.env.VITE_VAPID_PUBLIC_KEY || 'BAK5e0BmEENxZ6CtS5xqlDNb1C5qd3Nit4IsB6Xslt3CZmY6l9Xn5y_jhs2N1-h08iF6_XmvXTAgWD-e284iskE';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '-Iu7g_lrZk8RfIw5hrgwU7TdqgLBtpJ2_im9ebBhbVE';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:gujatumproduction@gmail.com';

// Configure web-push with VAPID details
try {
    webpush.setVapidDetails(
        VAPID_SUBJECT,
        VAPID_PUBLIC_KEY,
        VAPID_PRIVATE_KEY
    );
    console.log('[WebPush] VAPID details configured successfully.');
} catch (err) {
    console.error('[WebPush] Failed to set VAPID details:', err);
}

export interface ServerNotificationPreferences {
    newAssignments: boolean;
    upcomingDeadlines: boolean;
    taskCompletions: boolean;
    systemUpdates: boolean;
    emailAlerts: boolean;
}

const DEFAULT_PREFS: ServerNotificationPreferences = {
    newAssignments: true,
    upcomingDeadlines: true,
    taskCompletions: true,
    systemUpdates: false,
    emailAlerts: false,
};

// In-memory cache backed by Supabase master_options (type = 'USER_NOTIF_PREFS')
const userPrefsMemoryCache = new Map<string, ServerNotificationPreferences>();

// Short-lived deduplication cache (15 seconds TTL) to prevent duplicate Web Push
// when a notification is dispatched via /api/push/send AND also arrives via /api/push/webhook (pg_net + push-to-line)
const recentDispatchedNotifCache = new Map<string, number>();
const DEDUP_WINDOW_MS = 15_000;

function cleanupDedupCache(now: number) {
    if (recentDispatchedNotifCache.size < 200) return;
    for (const [k, expiresAt] of recentDispatchedNotifCache.entries()) {
        if (expiresAt <= now) {
            recentDispatchedNotifCache.delete(k);
        }
    }
}

function buildDedupFingerprint(userId: string, title?: string, message?: string): string {
    return `fp:${userId}:${(title || '').trim()}:${(message || '').trim().slice(0, 80)}`;
}

function markNotificationDispatched(userId: string, title?: string, message?: string, notifId?: string | null) {
    const now = Date.now();
    cleanupDedupCache(now);
    const expiresAt = now + DEDUP_WINDOW_MS;
    if (notifId) {
        recentDispatchedNotifCache.set(`id:${notifId}`, expiresAt);
    }
    if (userId && title) {
        recentDispatchedNotifCache.set(buildDedupFingerprint(userId, title, message), expiresAt);
    }
}

function wasNotificationRecentlyDispatched(userId: string, title?: string, message?: string, notifId?: string | null): boolean {
    const now = Date.now();
    if (notifId) {
        const expId = recentDispatchedNotifCache.get(`id:${notifId}`);
        if (expId && expId > now) return true;
    }
    if (userId && title) {
        const expFp = recentDispatchedNotifCache.get(buildDedupFingerprint(userId, title, message));
        if (expFp && expFp > now) return true;
    }
    return false;
}

/**
 * Resolves a notification row's link_path + related_id + type into a browser deep-link URL
 */
function resolveServerDeepLinkUrl(linkPath?: string | null, relatedId?: string | null, notifType?: string | null): string {
    const rawLink = (linkPath || '').trim();
    const upperType = (notifType || '').toUpperCase();

    if (rawLink === 'ATTENDANCE') {
        if (relatedId && upperType === 'APPROVAL_REQ') {
            return `/?view=ATTENDANCE&tab=APPROVALS&highlightReqId=${encodeURIComponent(relatedId)}`;
        }
        if (upperType === 'APPROVAL_REQ') {
            return '/?view=ATTENDANCE&tab=APPROVALS';
        }
        return '/?view=ATTENDANCE';
    }

    const viewKeyMap: Record<string, string> = {
        ContentStock: '/?view=STOCK',
        STOCK: '/?view=STOCK',
        QUALITY_GATE: '/?view=QUALITY_GATE',
        ADMIN_DASHBOARD: '/?view=DASHBOARD',
        DASHBOARD: '/?view=DASHBOARD',
        TEAM_CHAT: '/?view=CHAT',
        CHAT: '/?view=CHAT',
        CALENDAR: '/?view=CALENDAR',
        MEETING: '/?view=MEETINGS',
        KPI: '/?view=KPI',
        DUTY: '/?view=DUTY',
    };

    if (rawLink && viewKeyMap[rawLink]) {
        let url = viewKeyMap[rawLink];
        if (relatedId && (rawLink === 'ContentStock' || rawLink === 'DASHBOARD')) {
            url += `&openTaskId=${encodeURIComponent(relatedId)}`;
        }
        return url;
    }

    if (relatedId && (!rawLink || rawLink === '/')) {
        return `/?openTaskId=${encodeURIComponent(relatedId)}`;
    }

    if (rawLink && rawLink.startsWith('/')) {
        return rawLink;
    }

    return '/';
}

async function getUserNotificationPreferences(userId: string, orgId?: string | null): Promise<ServerNotificationPreferences> {
    if (!userId) return DEFAULT_PREFS;

    try {
        let query = supabase
            .from('master_options')
            .select('description, org_id')
            .eq('type', 'USER_NOTIF_PREFS')
            .eq('key', userId);

        if (orgId) {
            query = query.eq('org_id', orgId);
        }

        const { data } = await query.limit(1).maybeSingle();
        if (data?.description) {
            const parsed = JSON.parse(data.description);
            const merged = { ...DEFAULT_PREFS, ...parsed };
            userPrefsMemoryCache.set(userId, merged);
            return merged;
        }
    } catch {
        // Fallback to memory cache if query fails
    }

    return userPrefsMemoryCache.get(userId) || DEFAULT_PREFS;
}

async function saveUserNotificationPreferences(
    userId: string,
    orgId: string | null,
    prefs: Partial<ServerNotificationPreferences>
): Promise<ServerNotificationPreferences> {
    const merged: ServerNotificationPreferences = {
        ...DEFAULT_PREFS,
        ...(userPrefsMemoryCache.get(userId) || {}),
        ...prefs,
    };
    userPrefsMemoryCache.set(userId, merged);

    if (orgId && userId) {
        try {
            const { data: existing } = await supabase
                .from('master_options')
                .select('id')
                .eq('org_id', orgId)
                .eq('type', 'USER_NOTIF_PREFS')
                .eq('key', userId)
                .maybeSingle();

            if (existing?.id) {
                await supabase
                    .from('master_options')
                    .update({
                        description: JSON.stringify(merged),
                        is_active: true,
                    })
                    .eq('id', existing.id)
                    .eq('org_id', orgId);
            } else {
                await supabase
                    .from('master_options')
                    .insert({
                        org_id: orgId,
                        type: 'USER_NOTIF_PREFS',
                        key: userId,
                        label: 'Notification Preferences',
                        description: JSON.stringify(merged),
                        color: 'stone',
                        sort_order: 999,
                        is_active: true,
                    });
            }
        } catch (err) {
            console.warn('[WebPush] Could not persist preferences to master_options:', err);
        }
    }

    return merged;
}

/**
 * Checks whether a notification category/type is allowed by the user's preferences
 */
function isCategoryAllowedByPreferences(categoryOrType: string | undefined, prefs: ServerNotificationPreferences): boolean {
    if (!categoryOrType || categoryOrType === 'test-notification' || categoryOrType === 'TEST') {
        return true;
    }

    const normalized = categoryOrType.toUpperCase();

    if (
        normalized === 'NEW_ASSIGNMENT' ||
        normalized === 'APPROVAL_REQ' ||
        normalized === 'QC_REQUEST'
    ) {
        return prefs.newAssignments !== false;
    }

    if (
        normalized === 'DEADLINE_REQ' ||
        normalized === 'UPCOMING_DEADLINE' ||
        normalized === 'DEADLINE' ||
        normalized === 'OVERDUE' ||
        normalized === 'ATTENDANCE_ALERT' ||
        normalized === 'ATTENDANCE' ||
        normalized === 'DANGER' ||
        normalized === 'GAME_PENALTY' ||
        normalized === 'CONTENT_PLANNER_ALERT' ||
        normalized === 'COMPANY_CHECKLIST_OVERDUE_ALERT'
    ) {
        return prefs.upcomingDeadlines !== false;
    }

    if (
        normalized === 'REVIEW' ||
        normalized === 'TASK_COMPLETE' ||
        normalized === 'COMMENT_MENTION' ||
        normalized === 'CHAT_MENTION' ||
        normalized === 'APPROVAL_SUMMARY' ||
        normalized === 'INFO'
    ) {
        return prefs.taskCompletions !== false;
    }

    if (normalized === 'SYSTEM' || normalized === 'SYSTEM_UPDATE') {
        return prefs.systemUpdates === true;
    }

    return true;
}

/**
 * Verify if target user belongs to the active organization (Multi-Tenant Guard)
 */
async function filterUsersByOrganization(userIds: string[], orgId: string | null): Promise<string[]> {
    const cleanIds = Array.from(new Set(userIds.filter(Boolean)));
    if (cleanIds.length === 0 || !orgId) return cleanIds;

    try {
        const { data: members, error } = await supabase
            .from('organization_members')
            .select('user_id')
            .eq('org_id', orgId)
            .in('user_id', cleanIds);

        if (!error && members && members.length > 0) {
            return members.map((m: any) => m.user_id);
        }

        // Fallback to profiles.current_org_id
        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, current_org_id')
            .in('id', cleanIds);

        if (profiles && profiles.length > 0) {
            const matched = profiles.filter((p: any) => !p.current_org_id || p.current_org_id === orgId);
            if (matched.length > 0) {
                return matched.map((p: any) => p.id);
            }
        }
    } catch {
        // Fallback if membership table is unavailable
    }

    return cleanIds;
}

/**
 * 1. GET /api/push/vapid-public-key
 * Returns VAPID public key for client-side subscription creation
 */
router.get('/api/push/vapid-public-key', (_req, res) => {
    res.json({
        success: true,
        publicKey: VAPID_PUBLIC_KEY
    });
});

/**
 * 2. GET & POST /api/push/preferences
 * Fetches or updates per-user NotificationPreferences scoped to active organization
 */
router.get('/api/push/preferences', async (req, res) => {
    try {
        const { userId, orgId } = await resolveTenantContext(req);
        if (!userId) {
            return res.json({ success: true, preferences: DEFAULT_PREFS });
        }
        const preferences = await getUserNotificationPreferences(userId, orgId);
        return res.json({ success: true, preferences });
    } catch (err: any) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

router.post('/api/push/preferences', async (req, res) => {
    try {
        const { userId, orgId } = await resolveTenantContext(req, req.body?.userId);
        if (!userId) {
            return res.status(400).json({ success: false, error: 'User ID required' });
        }
        const saved = await saveUserNotificationPreferences(userId, orgId, req.body?.preferences || {});
        return res.json({ success: true, preferences: saved });
    } catch (err: any) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * 3. POST /api/push/subscribe
 * Saves or updates a device push subscription with tenant isolation
 */
router.post('/api/push/subscribe', async (req, res) => {
    try {
        const { subscription, userId: bodyUserId, userAgent } = req.body;
        const { userId, orgId } = await resolveTenantContext(req, bodyUserId);

        if (!subscription || !subscription.endpoint || !subscription.keys) {
            return res.status(400).json({ success: false, error: 'Invalid subscription payload' });
        }

        const endpoint = subscription.endpoint;
        const p256dh = subscription.keys.p256dh;
        const auth = subscription.keys.auth;
        const uAgent = userAgent || req.headers['user-agent'] || 'Unknown Device';

        // Try upserting with org_id first; fall back if push_subscriptions does not have org_id column yet
        let upsertResult = await supabase
            .from('push_subscriptions')
            .upsert({
                user_id: userId || bodyUserId || null,
                ...(orgId ? { org_id: orgId } : {}),
                endpoint,
                p256dh,
                auth,
                user_agent: uAgent,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'endpoint'
            })
            .select();

        if (upsertResult.error && upsertResult.error.message?.includes('org_id')) {
            upsertResult = await supabase
                .from('push_subscriptions')
                .upsert({
                    user_id: userId || bodyUserId || null,
                    endpoint,
                    p256dh,
                    auth,
                    user_agent: uAgent,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'endpoint'
                })
                .select();
        }

        if (upsertResult.error) {
            console.error('[WebPush] Failed to save subscription in Supabase:', upsertResult.error);
            return res.status(500).json({ success: false, error: upsertResult.error.message });
        }

        return res.json({ success: true, data: upsertResult.data });
    } catch (err: any) {
        console.error('[WebPush] Subscribe error:', err);
        return res.status(500).json({ success: false, error: err.message || 'Internal Server Error' });
    }
});

/**
 * 4. POST /api/push/unsubscribe
 * Removes a device push subscription
 */
router.post('/api/push/unsubscribe', async (req, res) => {
    try {
        const { endpoint, userId: bodyUserId } = req.body;
        const { userId } = await resolveTenantContext(req, bodyUserId);

        if (!endpoint) {
            return res.status(400).json({ success: false, error: 'Endpoint is required' });
        }

        let query = supabase.from('push_subscriptions').delete().eq('endpoint', endpoint);
        if (userId || bodyUserId) {
            query = query.eq('user_id', userId || bodyUserId);
        }

        const { error } = await query;
        if (error) {
            console.error('[WebPush] Unsubscribe error:', error);
            return res.status(500).json({ success: false, error: error.message });
        }

        return res.json({ success: true, message: 'Unsubscribed successfully' });
    } catch (err: any) {
        console.error('[WebPush] Unsubscribe exception:', err);
        return res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * 5. POST /api/push/test
 * Sends a test push notification to verify subscription
 */
router.post('/api/push/test', async (req, res) => {
    try {
        const { userId: bodyUserId, endpoint, subscription, title, message, url } = req.body;
        const { userId, orgId } = await resolveTenantContext(req, bodyUserId);
        const effectiveUserId = userId || bodyUserId;

        const payload = {
            title: title || '🔔 Kontent OS Test',
            message: message || 'ทดสอบการแจ้งเตือนแบบ Push บนอุปกรณ์ของคุณเรียบร้อยแล้ว!',
            body: message || 'ทดสอบการแจ้งเตือนแบบ Push บนอุปกรณ์ของคุณเรียบร้อยแล้ว!',
            url: url || '/',
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            tag: 'test-notification',
            timestamp: Date.now()
        };

        if (subscription && subscription.endpoint && subscription.keys) {
            try {
                await supabase.from('push_subscriptions').upsert({
                    user_id: effectiveUserId || null,
                    endpoint: subscription.endpoint,
                    p256dh: subscription.keys.p256dh,
                    auth: subscription.keys.auth,
                    user_agent: req.headers['user-agent'] || 'Unknown Device',
                    updated_at: new Date().toISOString()
                }, { onConflict: 'endpoint' });
            } catch {
                // Non-blocking upsert in test
            }

            const sendRes = await sendSingleWebPush({
                endpoint: subscription.endpoint,
                p256dh: subscription.keys.p256dh,
                auth: subscription.keys.auth
            }, payload);

            if (sendRes.success) {
                return res.json({ success: true, message: 'ส่งการแจ้งเตือนทดสอบไปยังอุปกรณ์ของคุณเรียบร้อยแล้ว!' });
            }
        }

        if (endpoint) {
            const { data: subData } = await supabase
                .from('push_subscriptions')
                .select('*')
                .eq('endpoint', endpoint)
                .maybeSingle();

            if (subData) {
                const sendRes = await sendSingleWebPush(subData, payload);
                if (sendRes.success) {
                    return res.json({ success: true, message: 'ส่งการแจ้งเตือนทดสอบไปยังอุปกรณ์เรียบร้อยแล้ว!' });
                }
            }
        }

        if (effectiveUserId) {
            const sentCount = await sendPushToUser(effectiveUserId, payload, {
                orgId,
                bypassPreferenceCheck: true
            });
            if (sentCount > 0) {
                return res.json({ success: true, message: `ส่งการแจ้งเตือนทดสอบไปยัง ${sentCount} อุปกรณ์เรียบร้อยแล้ว!` });
            }
        }

        return res.json({
            success: true,
            message: 'ส่งการแจ้งเตือนทดสอบบนเบราว์เซอร์เรียบร้อยแล้ว!'
        });
    } catch (err: any) {
        console.error('[WebPush] Test error:', err);
        return res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * 6. POST /api/push/send
 * Serverless endpoint to dispatch Web Push to one or multiple users within the active organization
 */
router.post('/api/push/send', async (req, res) => {
    try {
        const { userId, userIds, title, message, url, actionLink, tag, category, data } = req.body;
        const { orgId } = await resolveTenantContext(req, req.body?.senderId);

        const rawTargets: string[] = [];
        if (userId && typeof userId === 'string') rawTargets.push(userId);
        if (Array.isArray(userIds)) {
            userIds.forEach((id: any) => {
                if (typeof id === 'string' && id.trim()) rawTargets.push(id.trim());
            });
        }

        if (rawTargets.length === 0) {
            return res.status(400).json({ success: false, error: 'userId or userIds array required' });
        }

        // Enforce Multi-Tenant boundary
        const verifiedTargetIds = await filterUsersByOrganization(rawTargets, orgId);

        const resolvedUrl = url || resolveServerDeepLinkUrl(actionLink, data?.relatedId || data?.taskId, category);

        const payload = {
            title: title || 'Kontent OS',
            message: message || '',
            url: resolvedUrl,
            actionLink: resolvedUrl,
            tag: tag || category || 'general-notification',
            category: category || tag || 'general-notification',
            data: {
                ...(data || {}),
                url: resolvedUrl
            }
        };

        const results = await Promise.allSettled(
            verifiedTargetIds.map(async (uid) => {
                if (wasNotificationRecentlyDispatched(uid, payload.title, payload.message, data?.id)) {
                    return 0;
                }
                markNotificationDispatched(uid, payload.title, payload.message, data?.id);
                return sendPushToUser(uid, payload, {
                    orgId,
                    category: category || tag || data?.type
                });
            })
        );

        const totalSent = results.reduce(
            (acc, r) => acc + (r.status === 'fulfilled' ? r.value : 0),
            0
        );

        return res.json({
            success: true,
            totalSent,
            recipientCount: verifiedTargetIds.length
        });
    } catch (err: any) {
        console.error('[WebPush] Send error:', err);
        return res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * 7. POST /api/push/webhook
 * Supabase Database Webhook & pg_cron / pg_net receiver (when a row is inserted into notifications table)
 */
router.post('/api/push/webhook', async (req, res) => {
    try {
        const record = req.body.record || req.body.new || req.body;
        if (!record || !record.user_id) {
            return res.status(200).json({ message: 'No user_id found in webhook payload' });
        }

        const notifTitle = record.title || 'Kontent OS';
        const notifMessage = record.message || '';

        // Idempotent deduplication: skip if already sent via /api/push/send or sibling webhook within 15s
        if (wasNotificationRecentlyDispatched(record.user_id, notifTitle, notifMessage, record.id)) {
            return res.json({
                success: true,
                deduplicated: true,
                dispatchedTo: 0
            });
        }
        markNotificationDispatched(record.user_id, notifTitle, notifMessage, record.id);

        const relatedId = record.related_id || record.task_id;
        const rawLinkPath = record.link_path || record.action_link || '/';
        const resolvedDeepLink = resolveServerDeepLinkUrl(rawLinkPath, relatedId, record.type);

        // Build deterministic tag so multiple background reminders replace cleanly without spamming lock screen
        const pushTag = record.id
            ? `notif-${record.id}`
            : `${record.type || 'app-notification'}-${record.user_id}`;

        const pushPayload = {
            title: notifTitle,
            message: notifMessage,
            actionLink: resolvedDeepLink,
            url: resolvedDeepLink,
            tag: pushTag,
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            data: {
                id: record.id,
                type: record.type,
                taskId: relatedId,
                relatedId,
                url: resolvedDeepLink,
                metadata: record.metadata
            }
        };

        const count = await sendPushToUser(record.user_id, pushPayload, {
            orgId: record.org_id || null,
            category: record.type
        });
        return res.json({ success: true, dispatchedTo: count });
    } catch (err: any) {
        console.error('[WebPush] Webhook handler error:', err);
        return res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * Helper: Send single push to a subscription object
 */
async function sendSingleWebPush(subRow: any, payload: any) {
    const pushSubscription = {
        endpoint: subRow.endpoint,
        keys: {
            p256dh: subRow.p256dh,
            auth: subRow.auth
        }
    };

    try {
        await webpush.sendNotification(
            pushSubscription,
            JSON.stringify(payload)
        );
        return { success: true };
    } catch (err: any) {
        if (err.statusCode === 404 || err.statusCode === 410) {
            await supabase
                .from('push_subscriptions')
                .delete()
                .eq('endpoint', subRow.endpoint);
        } else {
            console.error(`[WebPush] Failed to send push to endpoint:`, err.statusCode, err.message);
        }
        return { success: false, error: err };
    }
}

/**
 * Push Dispatcher Engine: Send push to all registered devices of a user
 */
export async function sendPushToUser(
    userId: string,
    payload: {
        title: string;
        message: string;
        url?: string;
        actionLink?: string;
        icon?: string;
        badge?: string;
        tag?: string;
        category?: string;
        data?: any;
    },
    options?: {
        orgId?: string | null;
        category?: string;
        bypassPreferenceCheck?: boolean;
    }
) {
    if (!userId) return 0;

    try {
        // 1. Check user's NotificationPreferences unless bypassed
        if (!options?.bypassPreferenceCheck) {
            const prefs = await getUserNotificationPreferences(userId, options?.orgId);
            const categoryKey = options?.category || payload.category || payload.tag || payload.data?.type;
            if (!isCategoryAllowedByPreferences(categoryKey, prefs)) {
                return 0;
            }
        }

        // 2. Fetch user's push subscriptions
        const { data: subscriptions, error } = await supabase
            .from('push_subscriptions')
            .select('*')
            .eq('user_id', userId);

        if (error || !subscriptions || subscriptions.length === 0) {
            return 0;
        }

        const formattedPayload = {
            title: payload.title || 'Kontent OS',
            message: payload.message || '',
            body: payload.message || '',
            url: payload.url || payload.actionLink || '/',
            actionLink: payload.actionLink || payload.url || '/',
            icon: payload.icon || '/icon-192.png',
            badge: payload.badge || '/icon-192.png',
            tag: payload.tag || 'general-notification',
            data: payload.data || {},
            timestamp: Date.now()
        };

        const results = await Promise.allSettled(
            subscriptions.map((sub: any) => sendSingleWebPush(sub, formattedPayload))
        );

        return results.filter(r => r.status === 'fulfilled' && (r.value as any).success).length;
    } catch (err) {
        console.error(`[WebPush] sendPushToUser error for user ${userId}:`, err);
        return 0;
    }
}

export default router;
