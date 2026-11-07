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
  const relatedId = data?.relatedId || data?.taskId || data?.metadata?.request_id || data?.metadata?.checklistId;
  const notifType = data?.type || data?.category;

  if (!rawUrl && !relatedId) return fallback;

  // If rawUrl is already a resolved query deep link (e.g. /?view=ATTENDANCE&...), preserve it directly
  if (typeof rawUrl === 'string' && rawUrl.startsWith('/?')) {
    return rawUrl;
  }

  if (rawUrl === 'ATTENDANCE' || rawUrl === 'ADMIN_APPROVALS' || rawUrl === 'LEAVE') {
    const isApproval = rawUrl === 'ADMIN_APPROVALS' || notifType === 'APPROVAL_REQ';
    const targetTab = isApproval ? 'APPROVALS' : 'HISTORY';
    if (relatedId) {
      return `/?view=ATTENDANCE&tab=${targetTab}&highlightReqId=${encodeURIComponent(relatedId)}`;
    }
    return `/?view=ATTENDANCE&tab=${targetTab}`;
  }

  if (rawUrl === 'COMPANY_CHECKLIST') {
    if (relatedId) {
      return `/?view=COMPANY_CHECKLIST&presetId=${encodeURIComponent(relatedId)}`;
    }
    return '/?view=COMPANY_CHECKLIST';
  }

  const viewKeyMap = {
    ContentStock: '/?view=ContentStock',
    STOCK: '/?view=ContentStock',
    QUALITY_GATE: '/?view=QUALITY_GATE',
    ADMIN_DASHBOARD: '/?view=DASHBOARD',
    DASHBOARD: '/?view=DASHBOARD',
    TEAM_CHAT: '/?view=CHAT',
    CHAT: '/?view=CHAT',
    CALENDAR: '/?view=CALENDAR',
    MEETING: '/?view=MEETINGS',
    MEETINGS: '/?view=MEETINGS',
    DUTY: '/?view=DUTY',
    FINANCE: '/?view=FINANCE',
    GOALS: '/?view=GOALS',
    FEEDBACK: '/?view=FEEDBACK',
    KPI: '/?view=KPI',
    WEEKLY: '/?view=WEEKLY',
    WIKI: '/?view=WIKI',
    LEADERBOARD: '/?view=LEADERBOARD',
    TEAM: '/?view=TEAM'
  };

  if (rawUrl && viewKeyMap[rawUrl]) {
    let resolved = viewKeyMap[rawUrl];
    const supportsTaskModal = ['ContentStock', 'STOCK', 'DASHBOARD', 'ADMIN_DASHBOARD', 'QUALITY_GATE', 'CALENDAR'].includes(rawUrl);
    if (relatedId && supportsTaskModal) {
      resolved += `&openTaskId=${encodeURIComponent(relatedId)}`;
    }
    return resolved;
  }

  if (relatedId && (!rawUrl || rawUrl === '/')) {
    return `/?openTaskId=${encodeURIComponent(relatedId)}`;
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
        ...(data.data || {}),
        url: targetUrl,
        actionLink: data.actionLink || undefined
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

  const notifData = event.notification.data || {};
  const targetUrl = resolveNotificationTargetUrl(notifData.url || notifData.actionLink, notifData);

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.postMessage({
            type: 'PUSH_NOTIFICATION_CLICK',
            url: targetUrl,
            data: notifData
          });
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
