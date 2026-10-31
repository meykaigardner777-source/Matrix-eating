const CACHE_NAME = 'omnimacro-core-v4';
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg'
];

// Install: Cache core UI shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate: Cleanup outdated caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch: Stale-while-revalidate for local files, Network-first for live APIs
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Live cloud APIs bypass local cache
  if (
    url.hostname.includes('openfoodfacts.org') ||
    url.hostname.includes('overpass-api.de') ||
    url.hostname.includes('openstreetmap.org') ||
    url.hostname.includes('ipwho.is')
  ) {
    event.respondWith(fetch(event.request).catch(() => new Response('Network Failure')));
    return;
  }

  // Local assets served from cache with query parameter immunity
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((cachedResponse) => {
      return cachedResponse || fetch(event.request);
    })
  );
});

// Notification Click Handler: Focus or Launch App from Lockscreen
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('./index.html?mode=standalone_pwa');
      }
    })
  );
});
