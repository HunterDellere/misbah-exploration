// sw.js — minimal cache-first service worker.
// Cache name is derived from the registration URL's `?v=` param, set by
// scripts/sw-register.js from data/build-info.json. Each build registers
// a fresh SW with a fresh cache; old caches are evicted on activate.
const VERSION = new URL(self.location.href).searchParams.get('v') || 'dev';
const CACHE = `misbah-${VERSION}`;
const ASSETS = ['./', './index.html', './style.css', './icons/favicon.svg'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(ASSETS))
      .catch(() => {}),
  );
  self.skipWaiting();
});
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))),
  );
  self.clients.claim();
});
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  if (url.origin !== location.origin) return;
  // Network-first for HTML, cache-first for assets
  if (e.request.headers.get('accept')?.includes('text/html')) {
    e.respondWith(
      fetch(e.request)
        .then((r) => {
          const copy = r.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
          return r;
        })
        .catch(() => caches.match(e.request)),
    );
  } else {
    e.respondWith(
      caches.match(e.request).then(
        (c) =>
          c ||
          fetch(e.request).then((r) => {
            const copy = r.clone();
            caches.open(CACHE).then((c) => c.put(e.request, copy));
            return r;
          }),
      ),
    );
  }
});
