/**
 * Minimal service worker. Its only real job is to exist and control the
 * page — a registered service worker with a fetch handler is one of the
 * criteria Chrome/Edge use to decide whether to fire `beforeinstallprompt`
 * at all. It does not do offline caching; every request just passes
 * straight through to the network.
 */
const VERSION = 'attendance-sw-v1';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
