// CACHE_NAME is versioned per build: the `__WAYLAND_SW_VERSION__` token is
// replaced with the app version at build time (vite.renderer.config.ts
// swVersionInjector plugin). A new version means a new cache name, so the
// `activate` cleanup below purges every prior cache and a stale bundle can
// never survive a release. In dev the token is left as-is (a stable constant).
const SW_VERSION = '__WAYLAND_SW_VERSION__';
const CACHE_NAME = 'wayland-webui-' + SW_VERSION;
const NON_CACHEABLE_PATHS = new Set(['/qr-login']);
const OFFLINE_PAGE_URL = new URL('./index.html', self.location.href).toString();
const PRECACHE_URLS = [
  new URL('./', self.location.href).toString(),
  OFFLINE_PAGE_URL,
  new URL('./manifest.webmanifest', self.location.href).toString(),
  new URL('./pwa/icon-192.png', self.location.href).toString(),
  new URL('./pwa/icon-512.png', self.location.href).toString(),
];

// Minimal self-reloading shell. Returned ONLY when a navigation misses both
// the network and the cache, so a transient offline blip recovers on its own
// instead of leaving the user on a permanent blank page (the #53 failure).
const RECONNECT_HTML =
  '<!doctype html><meta charset="utf-8">' +
  '<meta name="viewport" content="width=device-width,initial-scale=1">' +
  '<title>Reconnecting…</title>' +
  '<body style="margin:0;display:flex;align-items:center;justify-content:center;height:100vh;font-family:system-ui,sans-serif;background:#0b0b0e;color:#888">' +
  'Reconnecting…<script>setTimeout(function(){location.reload()},2000)</script></body>';

function reconnectResponse() {
  return new Response(RECONNECT_HTML, {
    status: 503,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((key) => {
            if (key === CACHE_NAME) {
              return Promise.resolve();
            }
            return caches.delete(key);
          })
        )
      )
      .then(() => self.clients.claim())
  );
});

function shouldHandleRequest(request) {
  if (request.method !== 'GET') {
    return false;
  }

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    return false;
  }

  return !url.pathname.startsWith('/api/') && !NON_CACHEABLE_PATHS.has(url.pathname);
}

// Navigations fail OPEN: a navigation must never resolve to Response.error()
// (a blank root). On a network error or a non-ok response, fall back to the
// cached request, then the cached app shell, then a self-reloading shell.
async function handleNavigate(request) {
  const cache = await caches.open(CACHE_NAME);

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
      return response;
    }
    // A 5xx/4xx for the document: prefer a known-good cached shell over a
    // broken page when we have one, otherwise return the server's response.
    return (await cache.match(request)) || (await cache.match(OFFLINE_PAGE_URL)) || response;
  } catch {
    return (await cache.match(request)) || (await cache.match(OFFLINE_PAGE_URL)) || reconnectResponse();
  }
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return (await cache.match(request)) || (await cache.match(OFFLINE_PAGE_URL)) || Response.error();
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  const networkFetch = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => undefined);

  if (cached) {
    void networkFetch;
    return cached;
  }

  return (await networkFetch) || Response.error();
}

self.addEventListener('fetch', (event) => {
  if (!shouldHandleRequest(event.request)) {
    return;
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(handleNavigate(event.request));
    return;
  }

  const destination = event.request.destination;
  if (['script', 'style'].includes(destination)) {
    event.respondWith(networkFirst(event.request));
  } else if (['image', 'font'].includes(destination)) {
    event.respondWith(staleWhileRevalidate(event.request));
  }
});
