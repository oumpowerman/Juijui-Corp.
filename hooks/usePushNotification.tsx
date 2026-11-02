import { useState, useEffect, useCallback } from 'react';
import { getActiveOrgIdSync } from '../lib/tenantStorage';

function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

async function ensureServiceWorkerReady(): Promise<ServiceWorkerRegistration | null> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return null;

    try {
        let reg = await navigator.serviceWorker.getRegistration('/');
        if (!reg) {
            const swUrl = (import.meta as any).env?.DEV ? '/push-sw.js' : '/sw.js';
            reg = await navigator.serviceWorker.register(swUrl, { scope: '/' });
        }

        const readyReg = await Promise.race([
            navigator.serviceWorker.ready,
            new Promise<ServiceWorkerRegistration | null>((resolve) =>
                setTimeout(() => resolve(reg || null), 4000)
            )
        ]);

        return readyReg || reg || null;
    } catch (err) {
        console.warn('[usePushNotification] ensureServiceWorkerReady warning:', err);
        return null;
    }
}

function buildTenantHeaders(userId?: string): Record<string, string> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json'
    };
    const orgId = getActiveOrgIdSync();
    if (orgId) headers['x-org-id'] = orgId;
    if (userId) headers['x-user-id'] = userId;
    return headers;
}

export function usePushNotification(userId?: string) {
    const [isSupported, setIsSupported] = useState(false);
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [canInstallPwa, setCanInstallPwa] = useState<boolean>(
        typeof window !== 'undefined' && Boolean((window as any).__deferredPwaInstallPrompt)
    );

    // Environment checks
    const isInIframe = typeof window !== 'undefined' && window.self !== window.top;
    const isIos = typeof window !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isAndroid = typeof window !== 'undefined' && /Android/i.test(navigator.userAgent);
    const isStandalonePwa = typeof window !== 'undefined' && (
        (navigator as any).standalone === true ||
        window.matchMedia('(display-mode: standalone)').matches
    );
    const isIosPwaInstalled = isIos && isStandalonePwa;

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const onInstallAvailable = () => {
            setCanInstallPwa(Boolean((window as any).__deferredPwaInstallPrompt));
        };
        window.addEventListener('pwa-install-available', onInstallAvailable);
        return () => window.removeEventListener('pwa-install-available', onInstallAvailable);
    }, []);

    const promptInstallPwa = useCallback(async (): Promise<boolean> => {
        if (typeof window === 'undefined') return false;
        const deferredPrompt = (window as any).__deferredPwaInstallPrompt;
        if (!deferredPrompt) return false;

        try {
            deferredPrompt.prompt();
            const choiceResult = await deferredPrompt.userChoice;
            (window as any).__deferredPwaInstallPrompt = null;
            setCanInstallPwa(false);
            return choiceResult?.outcome === 'accepted';
        } catch (err) {
            console.warn('[usePushNotification] PWA install prompt error:', err);
            return false;
        }
    }, []);

    // Check support and current subscription status
    const checkSubscription = useCallback(async () => {
        if (typeof window === 'undefined') return;

        const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
        setIsSupported(supported);

        if (!supported) {
            setIsLoading(false);
            return;
        }

        try {
            setPermission(Notification.permission);

            if (Notification.permission === 'granted') {
                const registration = await ensureServiceWorkerReady();
                if (registration && registration.pushManager) {
                    const subscription = await registration.pushManager.getSubscription();
                    setIsSubscribed(!!subscription);
                } else {
                    setIsSubscribed(false);
                }
            } else {
                setIsSubscribed(false);
            }
        } catch (err: any) {
            console.warn('[usePushNotification] Error checking subscription:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        checkSubscription();
    }, [checkSubscription]);

    // Re-sync subscription org context when workspace switches (AGENTS.md Rule #4)
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const handleWorkspaceSwitch = async () => {
            if (!userId || Notification.permission !== 'granted') return;
            const registration = await ensureServiceWorkerReady();
            const subscription = await registration?.pushManager?.getSubscription();
            if (subscription) {
                fetch('/api/push/subscribe', {
                    method: 'POST',
                    headers: buildTenantHeaders(userId),
                    body: JSON.stringify({
                        subscription: subscription.toJSON(),
                        userId,
                        orgId: getActiveOrgIdSync(),
                        userAgent: navigator.userAgent
                    })
                }).catch(() => {});
            }
        };

        window.addEventListener('org-workspace-switched', handleWorkspaceSwitch);
        return () => window.removeEventListener('org-workspace-switched', handleWorkspaceSwitch);
    }, [userId]);

    // Subscribe to Web Push
    const subscribeToPush = useCallback(async (currentUserId?: string) => {
        setIsLoading(true);
        setError(null);

        const targetUserId = currentUserId || userId;
        const activeOrgId = getActiveOrgIdSync();

        try {
            if (isInIframe) {
                throw new Error('กรุณาเปิดแอปในแท็บใหม่ (New Tab) เพื่อให้เบราว์เซอร์อนุญาตสิทธิ์การแจ้งเตือน');
            }

            if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
                throw new Error('อุปกรณ์หรือเบราว์เซอร์นี้ยังไม่รองรับ Push Notifications');
            }

            // 1. Request Permission
            const perm = await Notification.requestPermission();
            setPermission(perm);

            if (perm !== 'granted') {
                throw new Error('คุณยังไม่ได้อนุญาตการแจ้งเตือน (Permission Denied)');
            }

            // 2. Fetch VAPID Public Key
            let vapidPublicKey = (import.meta as any).env?.VITE_VAPID_PUBLIC_KEY;
            if (!vapidPublicKey) {
                const keyRes = await fetch('/api/push/vapid-public-key', {
                    headers: buildTenantHeaders(targetUserId)
                });
                const keyData = await keyRes.json();
                if (keyData.success && keyData.publicKey) {
                    vapidPublicKey = keyData.publicKey;
                }
            }

            if (!vapidPublicKey) {
                throw new Error('ไม่พบ VAPID Public Key จากเซิร์ฟเวอร์');
            }

            // 3. Register SW & Subscribe to Push Manager
            const registration = await ensureServiceWorkerReady();
            if (!registration || !registration.pushManager) {
                throw new Error('ไม่สามารถเริ่มต้น Service Worker สำหรับรับแจ้งเตือนได้');
            }

            let subscription = await registration.pushManager.getSubscription();
            const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

            if (!subscription) {
                subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: convertedVapidKey
                });
            }

            // 4. Send Subscription to Backend with orgId
            const res = await fetch('/api/push/subscribe', {
                method: 'POST',
                headers: buildTenantHeaders(targetUserId),
                body: JSON.stringify({
                    subscription: subscription.toJSON(),
                    userId: targetUserId,
                    orgId: activeOrgId,
                    userAgent: navigator.userAgent
                })
            });

            const data = await res.json();
            if (!data.success) {
                console.warn('[usePushNotification] Backend subscribe notice:', data.error);
            }

            setIsSubscribed(true);
            return { success: true };
        } catch (err: any) {
            console.error('[usePushNotification] Subscribe failed:', err);
            setError(err.message || 'เกิดข้อผิดพลาดในการเปิดการแจ้งเตือน');
            return { success: false, error: err.message };
        } finally {
            setIsLoading(false);
        }
    }, [userId, isInIframe]);

    // Unsubscribe from Web Push
    const unsubscribeFromPush = useCallback(async (currentUserId?: string) => {
        setIsLoading(true);
        setError(null);

        const targetUserId = currentUserId || userId;

        try {
            if (!('serviceWorker' in navigator) || !('PushManager' in window)) return { success: true };

            const registration = await ensureServiceWorkerReady();
            const subscription = await registration?.pushManager?.getSubscription();

            if (subscription) {
                await fetch('/api/push/unsubscribe', {
                    method: 'POST',
                    headers: buildTenantHeaders(targetUserId),
                    body: JSON.stringify({
                        endpoint: subscription.endpoint,
                        userId: targetUserId,
                        orgId: getActiveOrgIdSync()
                    })
                });

                await subscription.unsubscribe();
            }

            setIsSubscribed(false);
            return { success: true };
        } catch (err: any) {
            console.error('[usePushNotification] Unsubscribe failed:', err);
            setError(err.message || 'เกิดข้อผิดพลาดในการยกเลิก');
            return { success: false, error: err.message };
        } finally {
            setIsLoading(false);
        }
    }, [userId]);

    // Test push notification
    const testPush = useCallback(async (targetUserId?: string) => {
        const uid = targetUserId || userId;
        try {
            let subscriptionData: any = null;
            const reg = await ensureServiceWorkerReady();

            if (reg && reg.pushManager) {
                const sub = await reg.pushManager.getSubscription();
                if (sub) {
                    subscriptionData = sub.toJSON();
                }
            }

            // Trigger client OS notification preview directly if supported
            if (reg && 'showNotification' in reg && Notification.permission === 'granted') {
                reg.showNotification('🔔 ทดสอบการแจ้งเตือน Kontent OS', {
                    body: 'ระบบแจ้งเตือนแบบ Push บนอุปกรณ์ของคุณทำงานได้สมบูรณ์แบบแล้ว!',
                    icon: '/icon-192.png',
                    badge: '/icon-192.png',
                    tag: 'test-notification',
                    vibrate: [200, 100, 200],
                    data: { url: '/' }
                } as any).catch(() => {});
            }

            // Dispatch via backend web-push
            const res = await fetch('/api/push/test', {
                method: 'POST',
                headers: buildTenantHeaders(uid),
                body: JSON.stringify({
                    userId: uid,
                    orgId: getActiveOrgIdSync(),
                    subscription: subscriptionData,
                    endpoint: subscriptionData?.endpoint,
                    title: '🔔 ทดสอบการแจ้งเตือน Kontent OS',
                    message: 'ระบบแจ้งเตือนแบบ Push บนอุปกรณ์ของคุณทำงานได้สมบูรณ์แบบแล้ว!',
                    url: '/'
                })
            });

            return await res.json();
        } catch (err: any) {
            console.error('[usePushNotification] Test push failed:', err);
            return { success: false, error: err.message };
        }
    }, [userId]);

    return {
        isSupported,
        permission,
        isSubscribed,
        isLoading,
        error,
        isInIframe,
        isIos,
        isAndroid,
        isStandalonePwa,
        isIosPwaInstalled,
        canInstallPwa,
        promptInstallPwa,
        subscribeToPush,
        unsubscribeFromPush,
        testPush,
        refresh: checkSubscription
    };
}
