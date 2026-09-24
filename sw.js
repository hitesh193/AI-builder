// Medroute Service Worker
const CACHE_NAME = 'medroute-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/consult.html',
  '/lab-tests.html',
  '/pharmacy.html',
  '/surgeries.html',
  '/gold.html',
  '/insurance.html',
  '/dashboard.html',
  '/css/styles.css',
  '/js/data.js',
  '/js/store.js',
  '/js/main.js',
  '/js/ai-checker.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch(err => console.log('SW cache partial fail', err));
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).catch(() => {
        // Offline fallback
        return caches.match('/index.html');
      });
    })
  );
});
