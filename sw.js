/* Currículo Aleson — service worker offline. */
const VERSION = 'cv-v1';
const ASSETS = [
  './',
  './index.html',
  './css/styles.css?v=1',
  './manifest.webmanifest?v=1',
  './cv-page-1.png?v=1',
  './curriculo-aleson-pungirum.pdf',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).catch(() => caches.match('./index.html')));
    return;
  }
  if (new URL(req.url).origin === location.origin) {
    e.respondWith(caches.match(req).then((c) => c || fetch(req)));
  }
});
