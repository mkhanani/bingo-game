// Minimal service worker — just enough to satisfy PWA installability
// (Chrome requires one registered, even a no-op, before it will offer
// "Add to Home Screen" / before a TWA will treat the site as an app).
// This intentionally does NOT cache game data — /api/room responses must
// always hit the network, since stale bingo state would break the game.

const SHELL_CACHE = 'bingo-shell-v1';
const SHELL_FILES = ['/', '/index.html', '/manifest.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_FILES)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Never cache API calls — game state must always be fresh.
  if (url.pathname.startsWith('/api/')) return;

  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
