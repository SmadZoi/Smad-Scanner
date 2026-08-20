const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = 'fib786-scanner-' + CACHE_VERSION;

const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Install: cache the app shell (the static files that make up the interface)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// Activate: clear out any old versioned caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k.startsWith('fib786-scanner-') && k !== CACHE_NAME)
            .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch strategy:
// - Binance API calls (live price data) -> always go to the network, never cached.
// - Everything else (the app's own files) -> network first, falling back to cache
//   when offline, so you always get the latest version when you have a connection,
//   and the app still opens when you don't.
self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  if (url.includes('api.binance.com')) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
