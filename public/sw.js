// Offline support: Cadence works with no connection, like a real app.
// Only this app's own files are cached. Her data lives in IndexedDB, never here.
const CACHE = 'cadence-v1';
const BASE = new URL(self.registration.scope).pathname; // '/' locally, '/cadence-period-tracker/' on GitHub Pages

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll([BASE, `${BASE}icon.svg`, `${BASE}manifest.webmanifest`])));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  // Pages: network first so updates arrive, cached shell when offline.
  if (e.request.mode === 'navigate') {
    e.respondWith(fetch(e.request).then((res) => {
      caches.open(CACHE).then((c) => c.put(BASE, res.clone()));
      return res;
    }).catch(() => caches.match(BASE)));
    return;
  }
  // Built assets are content-hashed, so cache-first is safe.
  e.respondWith(caches.match(e.request).then((hit) => hit || fetch(e.request).then((res) => {
    if (res.ok) caches.open(CACHE).then((c) => c.put(e.request, res.clone()));
    return res;
  })));
});
