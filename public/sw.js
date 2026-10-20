// Service Worker for Arabi Sohoj with robust caching and instant-update dev safety
const CACHE_NAME = 'arabi-sohoj-v4';
const AUTHOR_CACHE_NAME = 'arabi-sohoj-author-messages-v4';

// Precache essential application assets
const PRECACHE_ASSETS = [
  '/',
  '/manifest.json',
  '/author-messages.json',
  '/icon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  // Activate worker immediately
  self.skipWaiting();
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS).catch(() => {})),
      caches.open(AUTHOR_CACHE_NAME).then((cache) => cache.add('/author-messages.json').catch(() => {}))
    ])
  );
});

self.addEventListener('activate', (event) => {
  const currentCaches = [CACHE_NAME, AUTHOR_CACHE_NAME];
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => !currentCaches.includes(key))
          .map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Cache-First strategy helper for Author Content
async function cacheFirstAuthorContent(request) {
  const authorCache = await caches.open(AUTHOR_CACHE_NAME);
  const cachedResponse = await authorCache.match(request);
  if (cachedResponse) {
    fetch(request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          authorCache.put(request, networkResponse.clone());
        }
      })
      .catch(() => {});
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      authorCache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (err) {
    const fallback = await caches.match('/author-messages.json');
    if (fallback) return fallback;
    throw err;
  }
}

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. Author messages JSON
  if (url.pathname.includes('author-messages.json')) {
    event.respondWith(cacheFirstAuthorContent(event.request));
    return;
  }

  // 2. DO NOT intercept Vite development modules, HMR, or source files
  if (
    url.pathname.includes('/@') ||
    url.pathname.includes('/src/') ||
    url.pathname.includes('node_modules') ||
    url.search.includes('t=')
  ) {
    return; // Pass through straight to network
  }

  // 3. Navigation Requests - Network first, fallback to cached
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cachedIndex = await caches.match('/index.html');
        if (cachedIndex) return cachedIndex;
        const rootMatch = await caches.match('/');
        if (rootMatch) return rootMatch;
        return new Response('অফলাইন মোড: আরবি সহজ লোড করা হয়েছে।', {
          headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
      })
    );
    return;
  }

  // 4. Production static assets
  if (
    url.pathname.startsWith('/assets/') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.svg')
  ) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        return (
          cachedResponse ||
          fetch(event.request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const clone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
            }
            return networkResponse;
          })
        );
      })
    );
    return;
  }
});

// Explicit offline cache trigger from UI
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CACHE_AUTHOR_MESSAGES') {
    caches.open(AUTHOR_CACHE_NAME).then((cache) => {
      fetch('/author-messages.json')
        .then((res) => {
          if (res.ok) {
            cache.put('/author-messages.json', res.clone());
            event.ports[0]?.postMessage({ status: 'SUCCESS', timestamp: Date.now() });
          }
        })
        .catch((err) => {
          event.ports[0]?.postMessage({ status: 'ERROR', error: err?.message });
        });
    });
  }
});
