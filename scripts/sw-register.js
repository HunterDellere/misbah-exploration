// sw-register.js — register the service worker (disabled on localhost dev)
if ('serviceWorker' in navigator && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
  window.addEventListener('load', () => {
    const base = window.__MISBAH_BASE__ || '';
    navigator.serviceWorker.register(base + 'sw.js').catch(() => {});
  });
}
