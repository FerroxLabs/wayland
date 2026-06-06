---
name: web-performance
description: |
  Frontend performance optimization expertise covering Core Web Vitals, bundle optimization, code splitting, lazy loading, image and font optimization, caching strategies, service workers, and performance monitoring.
  Use when the user asks about web performance, web performance best practices, or needs guidance on web performance implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "web-development frontend optimization"
  category: "web-development"
  subcategory: "accessibility-performance"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Web Performance

## Purpose

Optimize web application performance across all dimensions -- loading speed, interactivity, visual stability, and runtime efficiency. This skill provides actionable strategies for achieving excellent Core Web Vitals scores and maintaining performance budgets.

## Core Web Vitals

### Metrics Overview

```
LCP (Largest Contentful Paint) -- Loading Performance
  Good:    <= 2.5s
  Needs Improvement: 2.5s - 4.0s
  Poor:    > 4.0s
  What it measures: Time until the largest content element is rendered
  Common LCP elements: hero images, heading text, video posters

FID (First Input Delay) -- Interactivity (being replaced by INP)
  Good:    <= 100ms
  Needs Improvement: 100ms - 300ms
  Poor:    > 300ms

INP (Interaction to Next Paint) -- Responsiveness
  Good:    <= 200ms
  Needs Improvement: 200ms - 500ms
  Poor:    > 500ms
  What it measures: Latency of all user interactions throughout page lifecycle

CLS (Cumulative Layout Shift) -- Visual Stability
  Good:    <= 0.1
  Needs Improvement: 0.1 - 0.25
  Poor:    > 0.25
  What it measures: Sum of unexpected layout shift scores
```

### LCP Optimization Strategy

```
STEP 1: Identify the LCP element
  -> Chrome DevTools > Performance > timings > LCP marker
  -> Usually: <img>, <video>, <h1>, or CSS background-image

STEP 2: Optimize based on element type

If LCP is an IMAGE:
  [ ] Add fetchpriority="high" to the <img> tag
  [ ] Preload the image: <link rel="preload" as="image" href="...">
  [ ] Use modern formats (WebP/AVIF with fallback)
  [ ] Use responsive srcset with appropriate sizes
  [ ] Serve from CDN with appropriate cache headers
  [ ] Remove lazy loading from LCP image (never lazy-load above the fold)

If LCP is TEXT:
  [ ] Preload critical fonts: <link rel="preload" as="font" crossorigin>
  [ ] Use font-display: optional or swap
  [ ] Inline critical CSS
  [ ] Reduce render-blocking resources

If LCP is a CSS BACKGROUND:
  [ ] Convert to <img> tag if possible
  [ ] Preload the background image
  [ ] Inline the critical CSS that defines the background

STEP 3: Reduce TTFB (Time to First Byte)
  [ ] Use CDN for static assets
  [ ] Enable compression (Brotli > gzip)
  [ ] Optimize server response time
  [ ] Use HTTP/2 or HTTP/3
  [ ] Consider stale-while-revalidate caching
```

### INP Optimization Strategy

```
STEP 1: Identify slow interactions
  -> Chrome DevTools > Performance > Interactions track
  -> PerformanceObserver with type: 'event'

STEP 2: Reduce input delay
  [ ] Minimize main thread work during page load
  [ ] Break up long tasks (> 50ms) using scheduler.yield()
  [ ] Defer non-critical JavaScript with defer/async
  [ ] Remove unnecessary event listeners

STEP 3: Reduce processing time
  [ ] Optimize event handler logic
  [ ] Move expensive computation to Web Workers
  [ ] Use requestAnimationFrame for visual updates
  [ ] Debounce/throttle rapid-fire events (scroll, resize, input)

STEP 4: Reduce presentation delay
  [ ] Minimize DOM size (< 1500 nodes ideal)
  [ ] Reduce CSS complexity (avoid expensive selectors)
  [ ] Use content-visibility: auto for offscreen content
  [ ] Avoid forced synchronous layouts (read then write, never interleave)
```

### CLS Optimization Strategy

```
Common CLS causes and fixes:

1. Images without dimensions:
   <img src="hero.jpg" width="800" height="600" alt="..."> ./* Or use aspect-ratio in CSS */
   img { aspect-ratio: 16 / 9; width: 100%; height: auto; }

2. Ads/embeds without reserved space:
   .ad-slot { min-height: 250px; }

3. Web fonts causing layout shift:
   @font-face {
     font-family: 'CustomFont';
     src: url('font.woff2') format('woff2');
     font-display: optional;  /* No FOUT, no layout shift */
     size-adjust: 100.5%;     /* Match fallback metrics */
   }

4. Dynamic content inserted above viewport:
   -> Insert below the fold or use CSS containment
   -> Use transform animations instead of height/margin changes

5. Late-loading components:
   -> Reserve space with skeleton placeholders
   -> Use min-height on containers
```

## Bundle Optimization

### Analysis Tools

```shell
# Webpack
npx webpack-bundle-analyzer stats.json

# Vite
npx vite-bundle-visualizer

# Generic
npx source-map-explorer dist/assets/*.js
```

### Bundle Size Budgets

```
RECOMMENDED BUDGETS:
  Total JS (compressed):      < 200KB
  Main bundle:                < 100KB
  Per-route chunk:            < 50KB
  Third-party total:          < 100KB

PACKAGE SIZE AWARENESS (gzipped):
  react + react-dom:          ~45KB
  vue:                        ~33KB
  lodash (full):              ~25KB  -> Use lodash-es with tree-shaking
  moment.js:                  ~70KB  -> Use date-fns (~7KB for used functions)
  chart.js:                   ~60KB  -> Lazy load
```

### Tree Shaking

```ts
// BAD: Imports entire library
import _ from 'lodash';
_.debounce(fn, 300);

// GOOD: Import specific function
import debounce from 'lodash-es/debounce';
debounce(fn, 300);

// BAD: Barrel file re-exports prevent tree shaking in some bundlers
export * from './utils';

// GOOD: Named exports
export { formatDate } from './date';
export { formatCurrency } from './currency';

// Ensure package.json enables tree shaking
{
  "sideEffects": false,  // or list specific files with side effects
  "module": "dist/index.esm.js"
}
```

## Code Splitting

### Route-Based Splitting (React)

```tsx
import { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Settings = lazy(() => import('./pages/Settings'));
const Analytics = lazy(() => import('./pages/Analytics'));

function App() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/analytics" element={<Analytics />} />
      </Routes>
    </Suspense>
  );
}
```

### Component-Based Splitting

```tsx
// Heavy components loaded on demand
const MarkdownEditor = lazy(() => import('./components/MarkdownEditor'));
const PdfViewer = lazy(() => import('./components/PdfViewer'));
const ChartWidget = lazy(() => import('./components/ChartWidget'));

// Interaction-triggered loading
function CommentSection() {
  const [showEditor, setShowEditor] = useState(false);
  return (
    <div>
      <button onClick={() => setShowEditor(true)}>Write Comment</button>
      {showEditor && (
        <Suspense fallback={<EditorSkeleton />}>
          <MarkdownEditor />
        </Suspense>
      )}
    </div>
  );
}
```

### Prefetching Strategies

```html
<!-- Prefetch likely-next routes -->
<link rel="prefetch" href="/dashboard/chunk.js">

<!-- Preload critical current-route resources -->
<link rel="preload" href="/hero.webp" as="image" fetchpriority="high">
<link rel="preload" href="/critical.css" as="style">
<link rel="preload" href="/font.woff2" as="font" crossorigin>

<!-- DNS prefetch for external origins -->
<link rel="dns-prefetch" href="[reference URL]">

<!-- Preconnect for critical external origins -->
<link rel="preconnect" href="[reference URL]" crossorigin>
```

## Image Optimization

### Decision Matrix

```
Photograph/complex imagery:
  -> AVIF (best compression) with WebP fallback
  -> Use <picture> element for format selection
  -> Responsive srcset for resolution switching

Icons/logos/illustrations:
  -> SVG (inline or sprite)
  -> Optimize with SVGO

Simple graphics with transparency:
  -> WebP or PNG (for legacy)

Animated content:
  -> Short: CSS animation or Lottie
  -> Longer: MP4 video (not GIF -- 10x larger)
```

### Responsive Image Implementation

```html
<picture>
  <!-- AVIF for browsers that support it -->
  <source
    type="image/avif"
    srcset="hero-400.avif 400w, hero-800.avif 800w, hero-1200.avif 1200w"
    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
  >
  <!-- WebP fallback -->
  <source
    type="image/webp"
    srcset="hero-400.webp 400w, hero-800.webp 800w, hero-1200.webp 1200w"
    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
  >
  <!-- JPEG fallback -->
  <img
    src="hero-800.jpg"
    srcset="hero-400.jpg 400w, hero-800.jpg 800w, hero-1200.jpg 1200w"
    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
    alt="Hero image description"
    width="1200" height="600"
    loading="lazy"
    decoding="async"
  >
</picture>

<!-- Above-the-fold LCP image: NO lazy loading, YES fetchpriority -->
<img src="hero.webp" alt="..." width="1200" height="600"
     fetchpriority="high" decoding="async">
```

## Font Loading Strategy

```css
/* Optimal font-face declaration */
@font-face {
  font-family: 'Inter';
  src: url('/fonts/inter-var.woff2') format('woff2');
  font-weight: 100 900;
  font-display: swap;  /* Show fallback immediately, swap when loaded */
  unicode-range: U+0000-00FF, U+0131, U+0152-0153;  /* Latin subset */
}

/* Fallback font metrics matching to reduce CLS */
@font-face {
  font-family: 'Inter-fallback';
  src: local('Arial');
  size-adjust: 107%;
  ascent-supersede: 90%;
  descent-supersede: 22%;
  line-gap-supersede: 0%;
}

body {
  font-family: 'Inter', 'Inter-fallback', system-ui, sans-serif;
}
```

### Font Loading Decision Tree

```
Is this a system font?
  YES -> font-family: system-ui, sans-serif (zero load time)
  NO  -> Is it critical for brand?
    YES -> font-display: swap + preload WOFF2
    NO  -> font-display: optional (no FOUT, may not load on slow networks)
```

## Caching Strategies

### HTTP Cache Headers

```
Static assets (JS, CSS, images with hash in filename):
  Cache-Control: public, max-age=31536000, immutable

HTML documents:
  Cache-Control: no-cache
  (Always revalidate with server, but can use 304)

API responses:
  Cache-Control: private, max-age=0, must-revalidate
  ETag: "abc123"

Fonts:
  Cache-Control: public, max-age=31536000, immutable
  (Fonts rarely change, hash in URL)
```

### Service Worker Caching

```js
// Cache-first for static assets
self.addEventListener('get', (event) => {
  if (event.request.destination === 'image' ||
      event.request.destination === 'style' ||
      event.request.destination === 'script') {
    event.respondWith(
      caches.match(event.request).then(cached =>
        cached || get(event.request).then(response => {
          const clone = response.clone();
          caches.open('static-v1').then(cache => cache.put(event.request, clone));
          return response;
        })
      )
    );
  }
});
```

## Performance Monitoring

### Performance Observer

```ts
// Monitor LCP
new PerformanceObserver((list) => {
  const entries = list.getEntries();
  const lastEntry = entries[entries.length - 1];
  console.log('LCP:', lastEntry.renderTime || lastEntry.loadTime);
}).observe({ type: 'largest-contentful-paint', buffered: true });

// Monitor CLS
let clsValue = 0;
new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (!entry.hadRecentInput) {
      clsValue += entry.value;
    }
  }
  console.log('CLS:', clsValue);
}).observe({ type: 'layout-shift', buffered: true });

// Monitor INP
new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (entry.interactionId) {
      console.log('Interaction:', entry.name, entry.duration, 'ms');
    }
  }
}).observe({ type: 'event', buffered: true, durationThreshold: 16 });

// Monitor Long Tasks
new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    console.log('Long Task:', entry.duration, 'ms');
  }
}).observe({ type: 'longtask' });
```

### Performance Budget Configuration

```json
// bundlesize or size-limit config
{
  "budgets": [
    { "path": "dist/js/main.*.js", "maxSize": "100KB" },
    { "path": "dist/js/vendor.*.js", "maxSize": "150KB" },
    { "path": "dist/css/*.css", "maxSize": "30KB" },
    { "path": "dist/js/*.js", "maxSize": "300KB" }
  ]
}
```

## Performance Optimization Checklist

### Critical Rendering Path
- [ ] Inline critical CSS (above-the-fold)
- [ ] Defer non-critical CSS with media or rel="preload"
- [ ] Defer JavaScript with `defer` attribute
- [ ] Eliminate render-blocking resources
- [ ] Enable Brotli or gzip compression
- [ ] Use HTTP/2 or HTTP/3

### Assets
- [ ] Images in modern formats (AVIF/WebP) with fallbacks
- [ ] Responsive images with srcset and sizes
- [ ] LCP image preloaded with fetchpriority="high"
- [ ] Fonts preloaded (WOFF2 only) with appropriate font-display
- [ ] SVGs optimized with SVGO
- [ ] Videos used instead of GIFs

### JavaScript
- [ ] Route-based code splitting implemented
- [ ] Tree shaking confirmed working
- [ ] Bundle budget enforced in CI
- [ ] Third-party scripts loaded async or deferred
- [ ] Long tasks broken up with scheduler.yield()
- [ ] Web Workers used for heavy computation

### Runtime
- [ ] Virtualized long lists (react-window, @tanstack/virtual)
- [ ] Debounced/throttled rapid event handlers
- [ ] content-visibility: auto for offscreen sections
- [ ] No forced synchronous layouts
- [ ] requestAnimationFrame for visual updates

### Monitoring
- [ ] Real User Monitoring (RUM) collecting Core Web Vitals
- [ ] Performance budgets enforced in CI/CD
- [ ] Lighthouse CI running on every PR
- [ ] Error and slow interaction alerts configured

## When to Use

**Use this skill when:**
- Designing or implementing web performance solutions
- Reviewing or improving existing web performance approaches
- Making architectural or implementation decisions about web performance
- Learning web performance patterns and best practices
- Troubleshooting web performance-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Web Performance Analysis

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

**Input:** "Help me implement web performance for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended web performance approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When web performance must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
