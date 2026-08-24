// Service worker: network-first with a cache fallback, so the game
// always runs the freshest deploy when online and still opens offline
// from the last good visit. Every successful same-origin GET is cached
// as it flows through; nothing is precached, so the worker never pins
// a stale build.
const CACHE = 'browsergacha-v1';

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key !== CACHE) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;
  e.respondWith((async () => {
    try {
      const res = await fetch(e.request);
      // Cache only good responses — a 404 (art still being uploaded)
      // must retry the network next time, not stick.
      if (res.ok) {
        const copy = res.clone();
        const cache = await caches.open(CACHE);
        cache.put(e.request, copy);
      }
      return res;
    } catch (err) {
      const hit = await caches.match(e.request);
      if (hit) return hit;
      // Offline navigation with no exact match: serve the cached shell.
      if (e.request.mode === 'navigate') {
        const shell = await caches.match('index.html', { ignoreSearch: true });
        if (shell) return shell;
      }
      return Response.error();
    }
  })());
});
