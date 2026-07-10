const CACHE_NAME = 'movies-tracker-cache-v2'

self.addEventListener('install', (event) => {
  // Force the new service worker to take over right away
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    }).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return
  if (event.request.url.includes('/api/')) return

  const url = new URL(event.request.url)

  // 1. Navigation requests (HTML pages): NETWORK-FIRST
  // Always try live server first so normal tabs instantly get the latest deployment
  if (event.request.mode === 'navigate' || event.request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone))
          }
          return networkResponse
        })
        .catch(() => {
          return caches.match(event.request).then((cachedResponse) => {
            return cachedResponse || new Response('Offline - Movies Tracker', { status: 503 })
          })
        })
    )
    return
  }

  // 2. Static assets / scripts / images: STALE-WHILE-REVALIDATE
  // Return cached version quickly for performance, but fetch fresh copy from server in background
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone())
            }
            return networkResponse
          })
          .catch(() => cachedResponse)

        return cachedResponse || fetchPromise
      })
    })
  )
})
