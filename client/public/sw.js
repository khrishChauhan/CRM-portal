// Khushi Technology - Service Worker
const CACHE_NAME = 'khushitech-v3';
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
]

// Install: cache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  )
  self.skipWaiting()
})

// Activate: remove old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

async function networkThenCache(request) {
  const response = await fetch(request)
  if (response && response.ok && response.type === 'basic') {
    const cache = await caches.open(CACHE_NAME)
    cache.put(request, response.clone())
  }
  return response
}

// Fetch: network-first, fallback to cache
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return
  if (!event.request.url.startsWith(self.location.origin)) return

  // Keep SPA routes working on refresh/offline by serving the shell for navigations.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cachedShell = await caches.match('/index.html')
        return cachedShell || caches.match('/')
      })
    )
    return
  }

  event.respondWith(
    networkThenCache(event.request).catch(() => caches.match(event.request))
  )
})
