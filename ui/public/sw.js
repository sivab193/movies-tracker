self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return
  if (event.request.url.includes('/api/')) return
  event.respondWith(
    caches.open('movies-tracker-cache-v1').then((cache) =>
      cache.match(event.request).then((cachedResponse) =>
        cachedResponse || fetch(event.request).then((networkResponse) => {
          cache.put(event.request, networkResponse.clone())
          return networkResponse
        })
      )
    )
  )
})
