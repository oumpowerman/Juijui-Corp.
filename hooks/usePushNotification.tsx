import { useState, useEffect, useCallback } from 'react';

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

export function usePushNotification(userId?: string) {
    const [isSupported, setIsSupported] = useState(false);
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // iOS Detection
    const isIos = typeof window !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isIosPwaInstalled = typeof window !== 'undefined' && (
        (navigator as any).standalone === true || 
        window.matchMedia('(display-mode: standalone)').matches
    );

    // Check support and current subscription status
    const checkSubscription = useCallback(async () => {
        if (typeof window === 'undefined') return;

        const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
        setIsSupported(supported);

        if (!supported) {
            setIsLoading(false);
            return;
        }

        setPermission(Notification.permission);

        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            setIsSubscribed(!!subscription);
        } catch (err: any) {
            console.warn('[usePushNotification] Error checking subscription:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        checkSubscription();
    }, [checkSubscription]);

    // Subscribe to Web Push
    const subscribeToPush = useCallback(async (currentUserId?: string) => {
        setIsLoading(true);
        setError(null);

        const targetUserId = currentUserId || userId;

        try {
            if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
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
                const keyRes = await fetch('/api/push/vapid-public-key');
                const keyData = await keyRes.json();
                if (keyData.success && keyData.publicKey) {
                    vapidPublicKey = keyData.publicKey;
                }
            }

            if (!vapidPublicKey) {
                throw new Error('ไม่พบ VAPID Public Key จากเซิร์ฟเวอร์');
            }

            // 3. Register SW & Subscribe to Push Manager
            const registration = await navigator.serviceWorker.ready;
            let subscription = await registration.pushManager.getSubscription();

            if (!subscription) {
                const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
                subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: convertedVapidKey
                });
            }

            // 4. Send Subscription to Backend
            const res = await fetch('/api/push/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subscription: subscription.toJSON(),
                    userId: targetUserId,
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
    }, [userId]);

    // Unsubscribe from Web Push
    const unsubscribeFromPush = useCallback(async (currentUserId?: string) => {
        setIsLoading(true);
        setError(null);

        const targetUserId = currentUserId || userId;

        try {
            if (!('serviceWorker' in navigator) || !('PushManager' in window)) return { success: true };

            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();

            if (subscription) {
                // Inform backend
                await fetch('/api/push/unsubscribe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        endpoint: subscription.endpoint,
                        userId: targetUserId
                    })
                });

                // Unsubscribe on browser
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
            const res = await fetch('/api/push/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: uid,
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
        isIos,
        isIosPwaInstalled,
        subscribeToPush,
        unsubscribeFromPush,
        testPush,
        refresh: checkSubscription
    };
}
