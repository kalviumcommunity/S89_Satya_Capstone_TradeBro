const CACHE_NAME = 'tradebro-v2';
const OLD_CACHES = ['tradebro-v1'];

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      ...OLD_CACHES.map(cache => caches.delete(cache)),
      self.clients.claim()
    ])
  );
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests from http/https
  if (event.request.method !== 'GET' || 
      !event.request.url.startsWith('http') ||
      event.request.url.includes('chrome-extension') ||
      event.request.url.includes('moz-extension')) {
    return;
  }
  
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response && response.status === 200) {
          try {
            const responseClone = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => cache.put(event.request, responseClone))
              .catch(() => {}); // Ignore cache errors silently
          } catch (e) {
            // Ignore any caching errors
          }
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});