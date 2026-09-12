// Minimal service worker — just enough to satisfy PWA installability
// (Chrome requires one registered before it will offer "Add to Home
// Screen" / before a TWA will treat the site as an app).
//
// Deliberately does NOT cache anything: this app depends on live sync
// (/api/room) and ships frequent updates, so a cached shell would go
// stale and mask new deploys — which is exactly what an earlier,
// caching version of this file did. Every fetch goes straight to the
// network.

const CACHE_VERSION = 'bingo-v2';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(names.filter((n) => n !== CACHE_VERSION).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});

