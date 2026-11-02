// Service Worker for Kontent OS (Web Push & Cache Cleanup)
// Delegates Web Push & Notification Click events to /push-sw.js
// Does NOT intercept fetch requests in dev mode to prevent caching Vite .tsx modules.

try {
  importScripts('/push-sw.js');
} catch (e) {
  console.warn('[SW] Failed to import /push-sw.js:', e);
}

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('juijui-planner-'))
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});
