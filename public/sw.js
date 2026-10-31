// Kontent OS Service Worker with Background Push Notifications
const CACHE_NAME = 'juijui-planner-v3';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((cacheName) => {
          return cacheName !== CACHE_NAME;
        }).map((cacheName) => {
          return caches.delete(cacheName);
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Network-first strategy for HTML/Root to avoid hash mismatch
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        return response || fetch(event.request);
      })
  );
});

// --- PUSH NOTIFICATION HANDLER ---
self.addEventListener('push', (event) => {
  let data = {
    title: 'Kontent OS',
    message: 'คุณได้รับการแจ้งเตือนใหม่',
    body: 'คุณได้รับการแจ้งเตือนใหม่',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    url: '/',
    tag: 'kontent-notification',
    timestamp: Date.now()
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
    } catch (e) {
      data.message = event.data.text();
      data.body = event.data.text();
    }
  }

  const notificationTitle = data.title || 'Kontent OS';
  const notificationOptions = {
    body: data.message || data.body || '',
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/icon-192.png',
    tag: data.tag || 'general-notification',
    data: {
      url: data.url || data.actionLink || '/',
      id: data.data?.id,
      timestamp: data.timestamp || Date.now()
    },
    vibrate: [200, 100, 200],
    renotify: true,
    requireInteraction: false
  };

  event.waitUntil(
    self.registration.showNotification(notificationTitle, notificationOptions)
  );
});

// --- NOTIFICATION CLICK HANDLER ---
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If a window tab with the app is already open, focus it and navigate
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          if ('navigate' in client && targetUrl !== '/') {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
