/* eslint-disable no-undef */
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'
import { registerRoute, setCatchHandler, NavigationRoute } from 'workbox-routing'
import { StaleWhileRevalidate, CacheFirst, NetworkFirst } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'

// @ts-ignore: self.__WB_MANIFEST is injected at build time
precacheAndRoute(self.__WB_MANIFEST || [])
cleanupOutdatedCaches()

// Static assets and app shell: CacheFirst
registerRoute(
  ({ url }) => url.origin === self.location.origin && (url.pathname === '/' || url.pathname.endsWith('.html') || url.pathname.startsWith('/assets/') || url.pathname.startsWith('/icons/') || url.pathname.endsWith('.css') || url.pathname.endsWith('.js')),
  new CacheFirst({
    cacheName: 'app-shell',
    plugins: [new ExpirationPlugin({ maxEntries: 80, maxAgeSeconds: 7 * 24 * 60 * 60 })],
  })
)

// API GETs: NetworkFirst
registerRoute(
  ({ request, url }) => request.method === 'GET' && (url.pathname.startsWith('/api') || url.origin !== self.location.origin),
  new NetworkFirst({
    cacheName: 'api',
    networkTimeoutSeconds: 3,
    plugins: [new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 24 * 60 * 60 })],
  })
)

// Default: SWR
registerRoute(
  () => true,
  new StaleWhileRevalidate({ cacheName: 'runtime' })
)

// Navigation fallbacks for app routes when offline
const offlineFallback = async () => {
  const cache = await caches.open('app-shell')
  const offline = await caches.match('/offline.html')
  if (offline) return offline
  const index = await caches.match('/index.html')
  if (index) return index
  return Response.error()
}

setCatchHandler(async ({ event }) => {
  if (event.request.destination === 'document') {
    return offlineFallback()
  }
  return Response.error()
})

// Optionally, direct navigation routing with fallback
try {
  const navigationHandler = async ({ event }) => {
    try {
      return await fetch(event.request)
    } catch {
      return offlineFallback()
    }
  }
  const navRoute = new NavigationRoute(navigationHandler, {
    allowlist: [/^\/$/, /^\/calendar/, /^\/admin/, /^\/schedules/, /^\/profile/, /^\/auth/],
  })
  // @ts-ignore
  self.workbox.routing.registerRoute(navRoute)
} catch {}