/**
 * Dedicated Web Push & Notification Click Handler
 * Imported by Workbox Service Worker in Production (`importScripts: ['/push-sw.js']`)
 * and registered directly in Development mode so Vite modules are never intercepted.
 */

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

function resolveNotificationTargetUrl(rawUrl, data) {
  const fallback = '/';
  if (!rawUrl && (!data || !data.taskId)) return fallback;

  const relatedId = data?.relatedId || data?.taskId;
  if (rawUrl === 'ATTENDANCE') {
    if (relatedId && data?.type === 'APPROVAL_REQ') {
      return `/?view=ATTENDANCE&tab=APPROVALS&highlightReqId=${encodeURIComponent(relatedId)}`;
    }
    if (data?.type === 'APPROVAL_REQ') {
      return '/?view=ATTENDANCE&tab=APPROVALS';
    }
    return '/?view=ATTENDANCE';
  }

  const viewKeyMap = {
    ContentStock: '/?view=STOCK',
    STOCK: '/?view=STOCK',
    QUALITY_GATE: '/?view=QUALITY_GATE',
    ADMIN_DASHBOARD: '/?view=DASHBOARD',
    DASHBOARD: '/?view=DASHBOARD',
    TEAM_CHAT: '/?view=CHAT',
    CHAT: '/?view=CHAT',
    CALENDAR: '/?view=CALENDAR',
    MEETING: '/?view=MEETINGS'
  };

  if (rawUrl && viewKeyMap[rawUrl]) {
    let resolved = viewKeyMap[rawUrl];
    if (relatedId && (rawUrl === 'ContentStock' || rawUrl === 'DASHBOARD')) {
      resolved += `&openTaskId=${encodeURIComponent(relatedId)}`;
    }
    return resolved;
  }

  if (data?.taskId && (!rawUrl || rawUrl === '/')) {
    return `/?openTaskId=${encodeURIComponent(data.taskId)}`;
  }

  if (typeof rawUrl === 'string' && (rawUrl.startsWith('/') || rawUrl.startsWith('http'))) {
    return rawUrl;
  }

  return fallback;
}

self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const title = data.title || 'Kontent OS';
    const targetUrl = resolveNotificationTargetUrl(data.url || data.actionLink, data.data || data);

    const options = {
      body: data.message || data.body || 'คุณมีการแจ้งเตือนใหม่ในระบบ',
      icon: data.icon || '/icon-192.png',
      badge: data.badge || '/icon-192.png',
      vibrate: [200, 100, 200],
      tag: data.tag || 'general-notification',
      renotify: true,
      requireInteraction: false,
      data: {
        url: targetUrl,
        ...(data.data || {})
      },
      actions: data.actions || []
    };

    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  } catch (err) {
    const text = event.data.text();
    event.waitUntil(
      self.registration.showNotification('Kontent OS', {
        body: text,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        vibrate: [200, 100, 200],
        data: { url: '/' }
      })
    );
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          if (targetUrl && targetUrl !== '/') {
            client.navigate(targetUrl).catch(() => {});
          }
          return;
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
