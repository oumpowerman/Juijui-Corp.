import express from 'express';
import webpush from 'web-push';
import { serverSupabase as supabase } from '../utils/supabase.js';

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

/**
 * Helper to ensure push_subscriptions table exists in Supabase
 */
let isTableChecked = false;
async function ensureSubscriptionsTable() {
    if (isTableChecked) return;
    try {
        // Test query on push_subscriptions
        const { error } = await supabase
            .from('push_subscriptions')
            .select('id')
            .limit(1);

        if (error && error.code === '42P01') {
            console.warn('[WebPush] Table push_subscriptions does not exist yet. Please create it in Supabase SQL editor or run migration.');
        } else {
            isTableChecked = true;
        }
    } catch (err) {
        console.error('[WebPush] ensureSubscriptionsTable error:', err);
    }
}
ensureSubscriptionsTable();

/**
 * 1. GET /api/push/vapid-public-key
 * Returns VAPID public key for client-side subscription creation
 */
router.get('/api/push/vapid-public-key', (req, res) => {
    res.json({
        success: true,
        publicKey: VAPID_PUBLIC_KEY
    });
});

/**
 * 2. POST /api/push/subscribe
 * Saves or updates a device push subscription
 */
router.post('/api/push/subscribe', async (req, res) => {
    try {
        const { subscription, userId, userAgent } = req.body;

        if (!subscription || !subscription.endpoint || !subscription.keys) {
            return res.status(400).json({ success: false, error: 'Invalid subscription payload' });
        }

        const endpoint = subscription.endpoint;
        const p256dh = subscription.keys.p256dh;
        const auth = subscription.keys.auth;
        const uAgent = userAgent || req.headers['user-agent'] || 'Unknown Device';

        // Upsert into push_subscriptions table
        const { data, error } = await supabase
            .from('push_subscriptions')
            .upsert({
                user_id: userId || null,
                endpoint,
                p256dh,
                auth,
                user_agent: uAgent,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'endpoint'
            })
            .select();

        if (error) {
            console.error('[WebPush] Failed to save subscription in Supabase:', error);
            // Even if table doesn't exist yet, return helpful message
            return res.status(500).json({ success: false, error: error.message });
        }

        console.log(`[WebPush] Subscription registered for user ${userId || 'anonymous'}`);
        return res.json({ success: true, data });
    } catch (err: any) {
        console.error('[WebPush] Subscribe error:', err);
        return res.status(500).json({ success: false, error: err.message || 'Internal Server Error' });
    }
});

/**
 * 3. POST /api/push/unsubscribe
 * Removes a device push subscription
 */
router.post('/api/push/unsubscribe', async (req, res) => {
    try {
        const { endpoint, userId } = req.body;

        if (!endpoint) {
            return res.status(400).json({ success: false, error: 'Endpoint is required' });
        }

        let query = supabase.from('push_subscriptions').delete().eq('endpoint', endpoint);
        if (userId) {
            query = query.eq('user_id', userId);
        }

        const { error } = await query;
        if (error) {
            console.error('[WebPush] Unsubscribe error:', error);
            return res.status(500).json({ success: false, error: error.message });
        }

        console.log('[WebPush] Subscription removed for endpoint:', endpoint.substring(0, 30) + '...');
        return res.json({ success: true, message: 'Unsubscribed successfully' });
    } catch (err: any) {
        console.error('[WebPush] Unsubscribe exception:', err);
        return res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * 4. POST /api/push/test
 * Sends a test push notification to verify subscription
 */
router.post('/api/push/test', async (req, res) => {
    try {
        const { userId, endpoint, title, message, url } = req.body;

        const payload = {
            title: title || 'Kontent OS Test',
            message: message || 'ทดสอบการแจ้งเตือนแบบ Push บนอุปกรณ์ของคุณเรียบร้อยแล้ว!',
            url: url || '/',
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            tag: 'test-notification',
            timestamp: Date.now()
        };

        if (endpoint) {
            const { data: subData } = await supabase
                .from('push_subscriptions')
                .select('*')
                .eq('endpoint', endpoint)
                .maybeSingle();

            if (subData) {
                await sendSingleWebPush(subData, payload);
                return res.json({ success: true, message: 'Test push sent to endpoint' });
            }
        }

        if (userId) {
            const sentCount = await sendPushToUser(userId, payload);
            return res.json({ success: true, message: `Test push dispatched to ${sentCount} device(s)` });
        }

        return res.status(400).json({ success: false, error: 'userId or endpoint required' });
    } catch (err: any) {
        console.error('[WebPush] Test error:', err);
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
        // If 404 or 410 Gone, subscription is no longer valid; delete it
        if (err.statusCode === 404 || err.statusCode === 410) {
            console.log(`[WebPush] Subscription expired (${err.statusCode}). Removing endpoint from DB.`);
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
export async function sendPushToUser(userId: string, payload: {
    title: string;
    message: string;
    url?: string;
    actionLink?: string;
    icon?: string;
    badge?: string;
    tag?: string;
    data?: any;
}) {
    if (!userId) return 0;

    try {
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
            icon: payload.icon || '/icon-192.png',
            badge: payload.badge || '/icon-192.png',
            tag: payload.tag || 'general-notification',
            data: payload.data || {},
            timestamp: Date.now()
        };

        const results = await Promise.allSettled(
            subscriptions.map((sub: any) => sendSingleWebPush(sub, formattedPayload))
        );

        const successfulCount = results.filter(r => r.status === 'fulfilled' && (r.value as any).success).length;
        console.log(`[WebPush] Dispatched push to ${successfulCount}/${subscriptions.length} device(s) for user ${userId}`);
        return successfulCount;
    } catch (err) {
        console.error(`[WebPush] sendPushToUser error for user ${userId}:`, err);
        return 0;
    }
}

/**
 * Auto-Trigger Engine:
 * Listen to Realtime INSERT on the 'notifications' table and dispatch Web Push automatically!
 */
let realtimeChannel: any = null;
function initNotificationPushListener() {
    if (realtimeChannel) return;

    try {
        realtimeChannel = supabase
            .channel('server-push-notification-auto-trigger')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'notifications'
            }, async (payload: any) => {
                const newNotif = payload.new;
                if (!newNotif || !newNotif.user_id) return;

                console.log(`[WebPush Auto-Trigger] New notification for user ${newNotif.user_id}: "${newNotif.title}"`);

                const pushPayload = {
                    title: newNotif.title || 'Kontent OS',
                    message: newNotif.message || '',
                    actionLink: newNotif.action_link || (newNotif.task_id ? `/task/${newNotif.task_id}` : '/'),
                    url: newNotif.action_link || (newNotif.task_id ? `/task/${newNotif.task_id}` : '/'),
                    tag: newNotif.type || 'app-notification',
                    icon: '/icon-192.png',
                    data: {
                        id: newNotif.id,
                        type: newNotif.type,
                        taskId: newNotif.task_id,
                        metadata: newNotif.metadata
                    }
                };

                await sendPushToUser(newNotif.user_id, pushPayload);
            })
            .subscribe((status: string) => {
                if (status === 'SUBSCRIBED') {
                    console.log('[WebPush] Server-side notification listener subscribed successfully.');
                }
            });
    } catch (err) {
        console.error('[WebPush] Error setting up Realtime listener:', err);
    }
}

// Start listener
initNotificationPushListener();

export default router;
