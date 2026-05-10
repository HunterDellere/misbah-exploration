// sw-register.js — register the service worker (disabled on localhost dev).
// Fetches data/build-info.json to stamp the SW URL with a per-build hash so
// each deploy installs a fresh worker and evicts the previous cache.
if (
  'serviceWorker' in navigator &&
  location.hostname !== 'localhost' &&
  location.hostname !== '127.0.0.1'
) {
  window.addEventListener('load', () => {
    const base = window.__MISBAH_BASE__ || '';
    fetch(base + 'data/build-info.json', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : { hash: 'unknown' }))
      .catch(() => ({ hash: 'unknown' }))
      .then((info) => {
        const v = encodeURIComponent(info.hash || 'unknown');
        navigator.serviceWorker.register(base + 'sw.js?v=' + v).catch(() => {});
      });
  });
}
