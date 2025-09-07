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
  if (event.request.method !== 'GET') return;
  
  // Skip chrome-extension and other unsupported schemes
  if (!event.request.url.startsWith('http')) return;
  
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response.status === 200 && event.request.url.startsWith('http')) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => cache.put(event.request, responseClone))
            .catch(() => {}); // Ignore cache errors
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});