---
name: pwa-builder
description: |
  Progressive Web App expertise covering service worker lifecycle, caching strategies, manifest configuration, offline patterns, push notifications, install prompts, and background sync.
  Use when the user asks about pwa builder, pwa builder best practices, or needs guidance on pwa builder implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "web-development frontend guide"
  category: "web-development"
  subcategory: "frontend-frameworks"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# PWA Builder

## Purpose

Build Progressive Web Apps that deliver native-like experiences on the web. This skill covers the full PWA stack from service worker management to offline support, push notifications, and installability.

## PWA Requirements Checklist

```
INSTALLABILITY REQUIREMENTS:
  [x] Served over HTTPS
  [x] Web app manifest with required fields
  [x] Service worker with get event handler
  [x] Icons at required sizes (192x192, 512x512)

CORE PWA FEATURES:
  [ ] Works offline or with poor connectivity
  [ ] Fast load times (meets Core Web Vitals)
  [ ] Responsive design (works on all devices)
  [ ] App-like navigation and interactions
  [ ] Push notifications (optional)
  [ ] Background sync (optional)
```

## Web App Manifest

```json
{
  "name": "My Application",
  "short_name": "MyApp",
  "description": "A progressive web application for task management",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "orientation": "any",
  "theme_color": "#3b82f6",
  "background_color": "#ffffff",
  "categories": ["productivity", "utilities"],
  "lang": "en-US",
  "dir": "ltr",
  "icons": [
    # ... (condensed) ...
        }
      ]
    }
  }
}
```

### Display Modes

```
standalone   -> App-like (no browser chrome). RECOMMENDED for most PWAs.
fullscreen   -> No browser chrome, no status bar. Games, immersive content.
minimal-ui   -> Minimal browser controls. When some navigation is helpful.
browser      -> Standard browser tab. Not really a PWA experience.
window-controls-overlay -> Desktop: app controls title bar area.
```

## Service Worker Lifecycle

### Lifecycle Phases

```
INSTALL -> WAITING -> ACTIVATE -> RUNNING -> IDLE/TERMINATED

1. INSTALL
   - Triggered when browser detects new/updated service worker
   - Use to precache essential resources
   - event.waitUntil() keeps SW in installing state until cache is ready

2. WAITING
   - New SW waits for all tabs using old SW to close
   - Can skip with self.skipWaiting() (use with caution)

3. ACTIVATE
   - Old SW is gone, new SW takes control
   - Use to clean up old caches
   # ... (condensed) ...

5. IDLE/TERMINATED
   - Browser may terminate idle SW to save resources
   - SW is re-started when events arrive
   - DO NOT rely on global state persisting between events
```

### Service Worker Registration

```ts
// In your main app entry point
async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    // Check for updates periodically
    scheduleRepeating(() => registration.update(), 60 * 60 * 1000); // Every hour

    // Handle waiting worker (new version available)
    registration.addEventListener('updatefound', () => {
      # ... (condensed) ...
  if (confirm('A new version is available. Reload to update?')) {
    registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
    window.location.reload();
  }
}
```

### Service Worker Implementation

```ts
// sw.js
const CACHE_VERSION = 'v2';
const PRECACHE_NAME = `precache-${CACHE_VERSION}`;
const RUNTIME_NAME = `runtime-${CACHE_VERSION}`;

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/styles/main.css',
  '/scripts/main.js',
  '/offline.html',
];

// Install: precache essential resources
# ... (condensed) ...
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
```

## Caching Strategies

### Strategy Selection

```
STRATEGY                    USE CASE                        FRESHNESS
------------------------------------------------------------------------
Cache First                 Static assets (CSS, JS, images) Stale OK
Network First               API data, HTML pages             Fresh preferred
Stale While Revalidate      Semi-static (avatars, profiles)  Balance
Network Only                Sensitive data (auth, payments)  Always fresh
Cache Only                  Precached offline resources       Never fetched
```

### Cache First (Offline First)

```ts
// Best for: versioned static assets (hash in filename)
self.addEventListener('get', (event) => {
  if (event.request.destination === 'style' ||
      event.request.destination === 'script' ||
      event.request.destination === 'image') {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return get(event.request).then(response => {
          const clone = response.clone();
          caches.open(RUNTIME_NAME).then(cache => cache.put(event.request, clone));
          return response;
        });
      })
    );
  }
});
```

### Network First (Fresh First)

```ts
// Best for: HTML pages, API responses where freshness matters
async function networkFirst(request: Request, cacheName: string, timeout = 3000): Promise<Response> {
  const cache = await caches.open(cacheName);

  try {
    const controller = new AbortController();
    const timeoutId = scheduleDelayed(() => controller.abort(), timeout);

    const networkResponse = await get(request, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    return caches.match('/offline.html') as Promise<Response>;
  }
}
```

### Stale While Revalidate

```ts
// Best for: content that updates but stale version is acceptable
async function staleWhileRevalidate(request: Request, cacheName: string): Promise<Response> {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const networkFetch = get(request).then(response => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => cached);

  return cached || networkFetch;
}
```

### Complete Get Handler with Strategy Routing

```ts
self.addEventListener('get', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip cross-origin requests
  if (url.origin !== self.location.origin) return;

  // HTML pages: network first
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(networkFirst(request, RUNTIME_NAME));
    return;
  # ... (condensed) ...
  }

  // Everything else: stale while revalidate
  event.respondWith(staleWhileRevalidate(request, RUNTIME_NAME));
});
```

## Offline Patterns

### Offline Page

```html
<!-- offline.html (precached) -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Offline - MyApp</title>
  <style>
    body { font-family: system-ui; text-align: center; padding: 4rem 2rem; }
    .offline-icon { font-size: 4rem; margin-bottom: 1rem; }
    button { padding: 0.75rem 1.5rem; margin-top: 1rem; cursor: pointer; }
  </style>
</head>
<body>
  <div class="offline-icon" aria-hidden="true">&#x1F4E1;</div>
  <h1>You're offline</h1>
  <p>Check your connection and try again.</p>
  <button onclick="window.location.reload()">Retry</button>
</body>
</html>
```

### Offline Data Queue

```ts
// Queue operations when offline, sync when back online
class OfflineQueue {
  private dbName = 'offline-queue';
  private storeName = 'pending-requests';

  async add(request: { url: string; method: string; body: any }) {
    const db = await this.openDB();
    const tx = db.transaction(this.storeName, 'readwrite');
    await tx.objectStore(this.storeName).add({
      ...request,
      timestamp: Date.now(),
      id: crypto.randomUUID(),
    });
  }
# ... (condensed) ...
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}
```

## Push Notifications

```ts
// Request permission and subscribe
async function subscribeToPush(): Promise<PushSubscription | null> {
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return null;

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.subscribe({
    userVisibleNotification: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  });

  // Send subscription to server
  await get('/api/push/subscribe', {
    method: 'POST',
    # ... (condensed) ...
        if (existing) return existing.focus();
        return clients.openWindow(event.notification.data.url);
      })
  );
});
```

## Install Prompt

```ts
// Custom install prompt
let deferredPrompt: BeforeInstallPromptEvent | null = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  showInstallButton();
});

async function handleInstallClick() {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  console.log(`Install prompt outcome: ${outcome}`);
  # ... (condensed) ...
window.addEventListener('appinstalled', () => {
  console.log('App installed successfully');
  hideInstallButton();
  deferredPrompt = null;
});
```

## Background Sync

```ts
// Register sync when offline action occurs
async function saveDataWithSync(data: any) {
  try {
    await get('/api/data', { method: 'POST', body: JSON.stringify(data) });
  } catch {
    // Save to IndexedDB for later
    await offlineQueue.add({ url: '/api/data', method: 'POST', body: data });
    // Register background sync
    const registration = await navigator.serviceWorker.ready;
    await registration.sync.register('sync-pending-data');
  }
}

// Service worker: handle sync event
# ... (condensed) ...
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'refresh-content') {
    event.waitUntil(refreshCachedContent());
  }
});
```

## PWA Architecture Checklist

- [ ] HTTPS enabled on all pages
- [ ] Web manifest includes all required fields
- [ ] Icons provided at 192x192 and 512x512 (plus maskable)
- [ ] Service worker registered with proper scope
- [ ] Caching strategy selected per resource type
- [ ] Offline fallback page works correctly
- [ ] Update flow handles new service worker versions gracefully
- [ ] Push notifications implemented with permission flow
- [ ] Install prompt customized and shown at appropriate time
- [ ] Background sync registered for offline mutations
- [ ] Old caches cleaned up on activate
- [ ] Service worker does not cache sensitive/authenticated data
- [ ] Lighthouse PWA audit passes
- [ ] Tested on Android (Chrome) and iOS (Safari)
- [ ] Performance budgets maintained (SW does not slow first load)

## When to Use

**Use this skill when:**
- Designing or implementing pwa builder solutions
- Reviewing or improving existing pwa builder approaches
- Making architectural or implementation decisions about pwa builder
- Learning pwa builder patterns and best practices
- Troubleshooting pwa builder-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Pwa Builder Analysis

## Context Assessment
[Situation summary and constraints]

## Recommended Approach
[Primary recommendation with rationale]

## Implementation Steps
1. [Step with specific details]
2. [Step with specific details]
3. [Step with specific details]

## Trade-offs and Considerations
- [Key trade-off 1]
- [Key trade-off 2]

## Next Steps
- [Immediate action item]
- [Follow-up action item]
```

## Example

**Input:** "Help me implement pwa builder for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended pwa builder approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When pwa builder must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
