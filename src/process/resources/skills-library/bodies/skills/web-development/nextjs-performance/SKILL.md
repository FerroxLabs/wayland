---
name: nextjs-performance
description: |
  Guides expert-level next.js performance implementation: typescript and frameworks decision frameworks, production-ready patterns, and concrete templates for nextjs performance workflows.
  Use when the user asks about next.js performance, nextjs performance configuration, or typescript best practices for next.js projects.
  Do NOT use when the user needs a different web development capability -- check sibling skills in the web development subcategory.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "typescript frameworks optimization web-development"
  category: "web-development"
  subcategory: "web-development"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Next.js Performance

## When to Use

**Use this skill when:**
- User asks how to reduce Time to First Byte (TTFB), Largest Contentful Paint (LCP), Cumulative Layout Shift (CLS), or First Input Delay (FID/INP) in a Next.js application
- User wants to choose between Static Site Generation (SSG), Server-Side Rendering (SSR), Incremental Static Regeneration (ISR), and React Server Components (RSC) for a specific route or data pattern
- User needs to optimize bundle size, reduce JavaScript sent to the browser, or eliminate render-blocking resources in a Next.js project
- User is configuring the Next.js Image component, font optimization, or third-party script loading strategy
- User wants to implement caching strategies -- route caching, fetch deduplication, React cache(), or CDN cache headers -- in a Next.js 13/14/15 App Router project
- User needs to profile a slow Next.js page and identify the root cause (slow data fetching, large bundle, unoptimized images, missing streaming)
- User is setting up performance monitoring, Web Vitals reporting, or Lighthouse CI for a Next.js project

**Do NOT use this skill when:**
- User needs general React performance optimization (component memoization, context splitting, virtualization) without a Next.js-specific question -- use the react-performance skill
- User is asking about database query optimization or backend API performance that happens to be called by Next.js -- use the backend-api-performance skill
- User needs help migrating from Pages Router to App Router in general -- use the nextjs-app-router-migration skill
- User is asking about Next.js deployment infrastructure (Kubernetes, Docker, Vercel edge config) beyond caching headers -- use the nextjs-deployment skill
- User is debugging a Next.js build error or runtime crash unrelated to performance -- use the nextjs-debugging skill
- User wants general TypeScript configuration not tied to performance -- use the typescript-config skill

---

## Process

### 1. Establish the Performance Baseline

Before recommending any optimization, gather concrete measurements. Never guess at performance bottlenecks.

- Run `next build && next start` in production mode locally and capture the build output -- note route sizes, first load JS, and any routes flagged as slow
- Run Lighthouse in Chrome DevTools or via `npx lighthouse http://localhost:3000 --view` against the specific page the user is concerned about; record LCP, CLS, INP, and TBT
- Open the Network tab in Chrome DevTools with cache disabled and throttling set to "Slow 4G"; identify the largest resources, slowest waterfall items, and render-blocking scripts
- Check `/_next/static/chunks/` bundle sizes using `npx @next/bundle-analyzer` by adding `ANALYZE=true next build` after installing the analyzer package -- look for chunks exceeding 100 KB gzipped
- For SSR/ISR routes, measure TTFB: anything above 200 ms on a CDN-served page indicates server-side data fetching is the bottleneck, not the client bundle
- Use the Next.js built-in `useReportWebVitals` hook or the `instrumentation.ts` file to capture real-user Core Web Vitals from production; compare against the 75th percentile thresholds: LCP < 2.5 s, INP < 200 ms, CLS < 0.1

### 2. Identify the Rendering Strategy for Each Route

Each route has different data freshness, personalization, and latency requirements. Apply the rendering decision tree systematically.

- **SSG (generateStaticParams + no dynamic data):** Use when content does not change per user and can be rebuilt at deploy time. Appropriate for marketing pages, blog posts, documentation. Build time increases with page count; above 10,000 pages, consider ISR instead.
- **ISR (revalidate: N seconds):** Use when content changes but not on every request and personalization is not needed. Set `revalidate` to the content freshness tolerance: 60 for news articles, 3600 for product pages, 86400 for documentation. The first stale request triggers background regeneration; subsequent requests in the revalidation window serve stale content.
- **RSC with async data fetching (App Router default):** Use when content is per-user or must be fresh but can be streamed. Fetch data directly in Server Components using `fetch()` with Next.js extended caching options (`cache: 'force-cache'`, `next: { revalidate: N }`, `next: { tags: ['tag'] }`). Avoid fetching in Client Components unless the data is truly client-only.
- **SSR (dynamic rendering, `dynamic = 'force-dynamic'` or `noStore()`):** Use only when every request needs a completely fresh, uncacheable response -- user dashboards, cart pages, real-time data. Avoid defaulting to this; it eliminates all caching and maximizes TTFB.
- **Edge Runtime (`export const runtime = 'edge'`):** Use for routes that need low global latency with no Node.js APIs. Suitable for middleware, geolocation-based redirects, and lightweight API routes. Not suitable for routes that use `fs`, heavy npm packages, or Prisma/native modules.
- **Parallel Routes and Suspense boundaries:** Use to stream independent sections of a page. A slow database query for one section should not block the rest of the page from rendering and delivering HTML.

### 3. Optimize Data Fetching and Caching

Data fetching is the primary cause of slow TTFB and LCP in Next.js applications. Apply these patterns in order of impact.

- Eliminate sequential waterfall fetches in Server Components by running independent fetches in parallel using `Promise.all()`. A page that awaits three independent 200 ms queries sequentially takes 600 ms; parallelized it takes 200 ms.
- Use the React `cache()` function to deduplicate identical fetch calls within a single render tree. Wrap expensive database calls or fetch calls with `cache()` so that multiple Server Components requesting the same data within one request only trigger one actual query.
- Apply Next.js fetch caching correctly: `fetch(url, { next: { revalidate: 3600 } })` caches the response for 1 hour in the Next.js Data Cache. Use `next: { tags: ['products'] }` for on-demand revalidation via `revalidateTag('products')` in a Server Action or route handler.
- For ORM queries (Prisma, Drizzle, Kysely) that cannot use `fetch()`, implement caching at the function level with `unstable_cache()` from `next/cache` -- this wraps any async function with the same revalidation semantics as the fetch cache.
- Avoid fetching data in layout components that wrap many pages unless that data is shared by all children. A layout fetch blocks every page under it. Use `generateMetadata` for SEO data, not top-level layout awaits.
- Implement connection pooling for database access. In serverless environments, use PgBouncer for PostgreSQL or a pooling library. A fresh TCP+TLS handshake plus database authentication adds 50--150 ms per cold request; pooling reduces this to under 5 ms.
- Use HTTP streaming with `loading.tsx` files and `<Suspense>` boundaries to send the initial HTML shell (with loading states) immediately while slow data fetches complete in the background. This dramatically improves LCP perception even when actual data fetch time is unchanged.

### 4. Reduce JavaScript Bundle Size

Excessive JavaScript is the second most common Next.js performance problem and directly impacts INP and TTI.

- Audit the bundle with `ANALYZE=true next build`. Open the generated treemap and look for: large libraries included in client bundles that should be server-only, duplicated packages at different versions, and entire libraries imported when only one function is needed.
- Move all data-fetching, business logic, and utility code to Server Components. Code in Server Components never ships to the browser. The rule: if a component does not use `useState`, `useEffect`, event handlers, or browser APIs, it should be a Server Component.
- Apply dynamic imports for heavy Client Components: `const HeavyChart = dynamic(() => import('./HeavyChart'), { ssr: false })`. This splits the component into its own chunk loaded only when rendered. Use the `loading` prop to show a skeleton during load.
- Replace heavy libraries with lighter alternatives or native browser APIs: replace `moment.js` (67 KB gzipped) with `date-fns` (tree-shakeable, ~5 KB for common operations) or native `Intl.DateTimeFormat`; replace `lodash` with targeted `lodash-es` imports or native array methods; replace `axios` with native `fetch`.
- Mark server-only modules with the `server-only` package import at the top of the file. This throws a build error if the module is accidentally imported into a Client Component, preventing accidental bundling of server secrets and large server libraries.
- Set `modularizeImports` in `next.config.js` for libraries like `@mui/material`, `lucide-react`, and `@heroicons/react` to enable per-component imports and prevent the entire icon or component library from being bundled.
- Check for `"use client"` boundaries placed too high in the tree. A single `"use client"` directive on a parent component converts the entire subtree to client-side rendering. Push the `"use client"` boundary as deep as possible -- to the specific interactive leaf component that needs browser APIs or state.

### 5. Optimize Images, Fonts, and Static Assets

Media and fonts are frequently the largest contributors to LCP and CLS.

- Always use the Next.js `<Image>` component from `next/image` instead of HTML `<img>`. It automatically generates WebP/AVIF variants, applies lazy loading, and prevents CLS by reserving space via `width` and `height` props. For above-the-fold hero images, add `priority` prop to preload the image and eliminate LCP delay.
- Set `sizes` prop correctly on `<Image>`: `sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"`. Without this, Next.js serves the same large image to all viewports, wasting bandwidth on mobile.
- Configure image `deviceSizes` and `imageSizes` in `next.config.js` to match your actual breakpoints. The defaults (`[640, 750, 828, 1080, 1200, 1920, 2048, 3840]`) generate many variants; narrowing to your actual breakpoints reduces storage and cache miss probability.
- Use `next/font` for all fonts. It downloads fonts at build time, serves them from the same origin (no external DNS lookup), and automatically applies `font-display: swap` to prevent invisible text during font load. This eliminates the Google Fonts DNS lookup + connection, typically saving 100--300 ms on first load.
- Self-host variable fonts when supporting multiple weights -- a single variable font file with a weight range (`font-weight: 100 900`) is smaller than loading 4+ separate weight files.
- Load third-party scripts with `next/script` and choose the correct `strategy`: `afterInteractive` for analytics (Google Analytics, Segment), `lazyOnload` for non-critical scripts (chat widgets, A/B testing tools), and `beforeInteractive` only for scripts that must run before hydration (consent managers). Using `<script>` tags directly in JSX blocks the parser; `next/script` never does.
- Enable `compress: true` (default) in `next.config.js` for gzip compression when not using a CDN or reverse proxy that handles compression. For higher compression ratios, configure Brotli at the CDN layer (Cloudflare, CloudFront, Fastly all support Brotli with higher compression than gzip).

### 6. Configure the Next.js Production Build

Several `next.config.js` settings have significant performance impact and are not enabled by default.

- Enable the `experimental.optimizeCss` flag (uses `critters` for critical CSS inlining) to inline above-the-fold CSS and remove render-blocking stylesheets. Test thoroughly as it occasionally breaks complex CSS-in-JS setups.
- Set `poweredByHeader: false` to remove the `X-Powered-By: Next.js` header -- minor security hardening with no performance cost.
- Configure `headers()` in `next.config.js` to add immutable cache headers to static assets: `Cache-Control: public, max-age=31536000, immutable` for `/_next/static/*`. Next.js includes content hashes in static asset filenames, so this is safe and eliminates all repeat-visit requests for JS/CSS.
- Enable `experimental.turbo` (Turbopack) for development builds to reduce hot module replacement (HMR) time. As of Next.js 14, Turbopack is stable for development and can reduce dev server startup from 10+ seconds to under 2 seconds on large codebases. Do not use for production builds until it reaches stable status.
- Set `output: 'standalone'` when deploying to Docker/Kubernetes. This traces the minimal node_modules required and produces a self-contained build, reducing Docker image size from 1+ GB to under 200 MB.
- Configure `experimental.serverComponentsExternalPackages` for large Node.js packages (Prisma, Sharp, PDF generation libraries) that should not be bundled by webpack -- they are used directly from `node_modules`, preventing bundling errors and reducing memory usage.
- Use `swcMinify: true` (default in Next.js 13+) to use the Rust-based SWC minifier instead of Terser. SWC minification is 7x faster and produces comparable output size.

### 7. Implement Performance Monitoring and Alerting

Performance work without measurement degrades over time. Instrument the application to catch regressions before they reach production.

- Add Lighthouse CI to the CI/CD pipeline using `@lhci/cli`. Configure performance budgets in `lighthouserc.js`: assert LCP below 2500 ms, CLS below 0.1, TBT below 300 ms. Fail the build when budgets are exceeded.
- Use `useReportWebVitals` in the root `layout.tsx` to capture and send real-user Core Web Vitals to an analytics endpoint. Send at minimum: `name` (CLS, LCP, INP, etc.), `value`, `rating` ('good', 'needs-improvement', 'poor'), and `navigationType`.
- Set up `next build` size limits in CI using `bundlewatch` or the built-in Next.js `experimental.bundlePagesExternals`. Alert when first-load JS exceeds 150 KB gzipped for any route.
- Monitor TTFB per route in production using OpenTelemetry with `@vercel/otel` or a custom `instrumentation.ts` file. Log when any server render exceeds 500 ms and include the route, data fetch calls made, and database query time.
- Use `next/headers` `generateMetadata` and `Suspense` to implement route-level performance annotations visible in server logs, making it easy to attribute slow page loads to specific data sources.

---

## Output Format

When responding to a Next.js performance question, deliver output in this structure:

```markdown
## Performance Analysis: [Route or Feature Name]

### Current Bottleneck Assessment
| Metric | Current Value | Target Threshold | Status |
|--------|--------------|-----------------|--------|
| LCP    | [ms]         | < 2500 ms       | ✅/⚠️/❌ |
| INP    | [ms]         | < 200 ms        | ✅/⚠️/❌ |
| CLS    | [score]      | < 0.1           | ✅/⚠️/❌ |
| TTFB   | [ms]         | < 200 ms        | ✅/⚠️/❌ |
| First Load JS | [KB] | < 150 KB gzip  | ✅/⚠️/❌ |

### Root Cause
[1-3 sentences identifying the specific bottleneck with evidence from measurements]

### Rendering Strategy Decision
| Factor | Assessment | Recommendation |
|--------|-----------|----------------|
| Data freshness requirement | [per-request/hourly/deploy-time] | [SSR/ISR/SSG/RSC] |
| Personalization | [yes/no] | [dynamic/static] |
| Acceptable TTFB | [ms] | [cached/uncached] |
| Scale (pages/requests) | [count/rps] | [strategy] |

**Selected Strategy:** [SSG / ISR (revalidate: N) / RSC with fetch cache / SSR with edge runtime]
**Rationale:** [2-3 sentences]

### Implementation

#### [File: app/[route]/page.tsx or relevant file]
```tsx
// Complete, working TypeScript code
```

#### [File: next.config.js -- if config changes needed]
```js
// Complete configuration changes
```

### Bundle Impact
- Before: [X] KB first-load JS
- After: [X] KB first-load JS  
- Change: [-X KB / -X%]
- Method: [dynamic import / moved to Server Component / replaced library]

### Validation Steps
1. Run `ANALYZE=true next build` and verify [specific chunk] is no longer in client bundle
2. Run Lighthouse on [specific URL] and confirm LCP < 2500 ms
3. Check Network tab for [specific resource] -- verify it loads with [cache header]
4. Measure TTFB for [route] -- should be under [N] ms after deploying
```

---

## Rules

1. **NEVER recommend SSR (`force-dynamic`) as a default.** Dynamic rendering disables all caching and increases TTFB by the full data fetch latency on every request. Always start with the most cacheable strategy that satisfies data freshness requirements and move toward dynamic rendering only when genuinely required.

2. **NEVER place a `"use client"` directive on a component that does not use browser APIs, state, or event handlers.** Incorrectly marking Server Components as Client Components is the most common cause of excessive first-load JS in App Router applications. The rule: `"use client"` is a boundary, not a label -- every import below that boundary also becomes a Client Component.

3. **ALWAYS measure before and after every optimization.** Perceived performance improvements without metrics are unreliable. Run `next build` output comparison, Lighthouse scores, and network waterfall analysis for every change. An optimization that does not appear in measurements did not help.

4. **NEVER use `fetch()` inside a `useEffect` on the client when the data does not depend on client-side state.** This creates a waterfall: HTML loads, JS hydrates, effect fires, fetch starts, data arrives, component re-renders. Move the fetch to a Server Component and pass data as props, eliminating the entire waterfall.

5. **ALWAYS deduplicate data fetches using React `cache()` when the same data is needed by multiple Server Components in one render.** Without deduplication, two components requesting the same user record issue two database queries. The overhead multiplies with tree depth.

6. **NEVER import server-only modules (Prisma client, fs, crypto secrets) in files that do not have a clear server-only boundary.** Install and import `server-only` at the top of any file containing database clients, secret keys, or server-exclusive logic. This converts accidental client imports from a runtime failure to a build-time error.

7. **ALWAYS set the `sizes` attribute on `<Image>` components that are not full viewport width.** Omitting `sizes` causes Next.js to generate and serve the full `deviceSizes` range regardless of actual render size, wasting bandwidth and potentially increasing LCP by serving a larger image than necessary.

8. **NEVER configure `revalidate: 0` as a way to opt into dynamic behavior.** Use `export const dynamic = 'force-dynamic'` or `noStore()` from `next/headers` explicitly. Setting `revalidate: 0` has inconsistent behavior across Next.js versions and does not clearly communicate intent to the next developer.

9. **ALWAYS wrap slow, independent data fetches in Suspense boundaries with meaningful `fallback` UI.** A 1500 ms database query that blocks the entire page from streaming HTML defeats the streaming model. Wrap the slow section, send the shell immediately, and stream in the slow section when ready. LCP for the shell content will be measured independently from the streamed section.

10. **NEVER evaluate performance on the development server (`next dev`).** The dev server disables bundling optimizations, uses slower Babel transforms (unless Turbopack is enabled), does not apply production caching, and renders every page dynamically. All performance measurements must be taken against a production build (`next build && next start`) or a staging deployment.

---

## Edge Cases

### Large-Scale Static Sites (10,000+ Pages)
Using `generateStaticParams` to statically generate tens of thousands of pages at build time creates unacceptably long CI/CD cycles -- 10,000 pages at 200 ms each equals 33+ minutes of build time. Instead, use ISR with `dynamicParams = true` and `revalidate` set to your content freshness tolerance. Generate only the most-visited pages at build time by returning a subset from `generateStaticParams`, and let the rest be generated on-demand and cached by ISR. Monitor the cache fill rate in the first 24 hours after deployment and tune the set of pre-generated pages based on real traffic patterns.

### Authenticated Routes and Personalized Content
Routes with per-user data cannot be served from a shared cache. The common mistake is using SSR for the entire page when only a small section is personalized. Instead, statically render the page shell and use Partial Prerendering (PPR, available experimentally in Next.js 14+) or Suspense-wrapped RSC segments that are dynamically rendered. Alternatively, statically cache the page layout and use client-side fetching via SWR or React Query for the personalized widget. Never store user-specific data in the Next.js shared Data Cache -- it will leak between users.

### Third-Party Scripts Blocking LCP
Google Tag Manager, ad networks, and chat widgets are frequently the root cause of poor LCP and INP scores. When a user reports good static asset performance but poor LCP, the culprit is often a synchronously loaded third-party script. Load all non-critical third-party scripts with `<Script strategy="lazyOnload">` and move consent-dependent scripts behind a hydration check. For ad networks that must load early, use `strategy="afterInteractive"` which defers loading until hydration completes. Measure the performance impact of each script individually by temporarily removing it and comparing Lighthouse scores.

### Cold Start Latency in Serverless Deployments
Serverless Next.js deployments (Vercel, AWS Lambda, Google Cloud Run) suffer cold start latency when functions have not received a request recently. Cold starts of 500 ms--2 s add directly to TTFB. Mitigate with: (1) Edge Runtime for lightweight routes -- edge functions have cold starts under 5 ms; (2) `output: 'standalone'` to minimize the Node.js bundle and reduce initialization time; (3) keep-alive pings via a scheduled health check for critical routes; (4) route pre-warming via post-deploy scripts that hit critical routes. If using Prisma, the Prisma client initialization is a major cold start contributor -- use connection pooling with PgBouncer and lazy initialization patterns.

### CLS from Dynamic Content and Font Loading
CLS scores degrade when content shifts after the initial render. Common Next.js CLS sources: images without explicit `width`/`height` (always specify or use `fill` with a sized container), fonts that swap in after text has rendered (use `next/font` with `display: 'optional'` if CLS from font swap is visible), skeleton loaders that have different dimensions than the actual content (match skeleton dimensions exactly to loaded content), and streaming content that pushes other content down when it arrives (use CSS `min-height` on Suspense boundary containers). Measure CLS at the 75th percentile, not the average -- CLS outliers indicate specific interaction patterns causing shifts.

### ISR Thundering Herd on Cache Expiry
When an ISR page expires and receives simultaneous traffic, Next.js triggers one background regeneration and serves stale content to concurrent requests during regeneration. This is correct behavior. However, if regeneration fails (upstream API timeout, database error), Next.js continues serving the stale page indefinitely -- which may be acceptable or a data freshness problem. Handle this explicitly by using on-demand ISR (`revalidateTag`) triggered by a CMS webhook instead of time-based `revalidate`. On-demand ISR regenerates the page immediately upon content change and has no thundering herd problem, because the cache is refreshed before traffic spikes.

### App Router + Large Client Component Libraries
Component libraries like MUI, Ant Design, and Chakra UI were designed for the Pages Router and include extensive client-side JavaScript. When used in App Router, they force large portions of the component tree into Client Components. Mitigation strategies: (1) wrap library components in a thin client component file with `"use client"` and re-export as server-compatible wrappers; (2) replace layout and typography components with server-safe alternatives (CSS modules, Tailwind) and keep only interactive library components; (3) use `modularizeImports` in `next.config.js` to tree-shake the library and only bundle components actually used; (4) evaluate migration to RSC-compatible alternatives (shadcn/ui, Radix UI with custom styling) which ship significantly less JavaScript.

### Webpack Bundle Splitting and Chunk Strategy
Next.js default chunk splitting uses a heuristic that sometimes produces suboptimal results: very small chunks (under 10 KB) that add HTTP/2 round-trip overhead, or very large shared chunks that block critical rendering. Customize chunk splitting in `next.config.js` using `webpack.optimization.splitChunks`. Force vendor libraries above a size threshold into dedicated chunks with long-lived cache headers. Group route-adjacent components into shared chunks using the `cacheGroups` configuration. After changing chunk strategy, always verify with `ANALYZE=true next build` that the change achieved the intended split -- webpack chunk splitting configuration has non-obvious interactions with dynamic imports and Server Component boundaries.

---

## Example

**Input:** "Our Next.js 14 e-commerce product listing page has an LCP of 4.2 seconds and a first-load JS of 380 KB. The page fetches products from our API and shows a grid of product cards. Users are not logged in. How do we fix this?"

**Output:**

## Performance Analysis: Product Listing Page (`/products`)

### Current Bottleneck Assessment
| Metric | Current Value | Target Threshold | Status |
|--------|--------------|-----------------|--------|
| LCP    | 4200 ms      | < 2500 ms       | ❌ |
| INP    | ~150 ms (estimated) | < 200 ms | ✅ |
| CLS    | Unknown -- measure | < 0.1     | ⚠️ |
| TTFB   | Measure separately | < 200 ms  | ⚠️ |
| First Load JS | 380 KB gzip | < 150 KB gzip | ❌ |

### Root Cause
Two separate problems exist. The 380 KB first-load JS strongly indicates that heavy components (likely a carousel, image lightbox, or component library) are being included in the client bundle when they could be server-rendered or lazy-loaded. The 4.2 s LCP indicates the hero product image (above the fold) is not being preloaded and the API fetch may be blocking HTML delivery -- likely because this page is using SSR or client-side fetching instead of ISR.

### Rendering Strategy Decision
| Factor | Assessment | Recommendation |
|--------|-----------|----------------|
| Data freshness requirement | Product catalog changes hourly at most | ISR revalidate: 3600 |
| Personalization | None -- unauthenticated users | Static/ISR |
| Acceptable TTFB | < 100 ms (CDN-cached) | Cached static response |
| Scale | Potentially millions of product pages | ISR with on-demand revalidation |

**Selected Strategy:** ISR with `revalidate: 3600` plus on-demand revalidation via CMS webhook  
**Rationale:** Product listings for unauthenticated users are identical across all visitors -- there is no reason to re-fetch from the API on every request. ISR caches the rendered HTML at the CDN edge, serving sub-100 ms TTFB. When a product is updated in the CMS, a webhook calls `revalidateTag('products')` to immediately invalidate the relevant cached pages.

### Implementation

#### File: `app/products/page.tsx`

```tsx
import { Suspense } from 'react'
import { unstable_cache } from 'next/cache'
import { ProductGrid } from '@/components/ProductGrid'
import { ProductGridSkeleton } from '@/components/ProductGridSkeleton'
import { HeroProduct } from '@/components/HeroProduct'

// ISR: revalidate every hour; on-demand revalidation via 'products' tag
export const revalidate = 3600

interface Product {
  id: string
  name: string
  price: number
  imageSrc: string
  imageAlt: string
  slug: string
}

// Cached product fetcher -- one API call per cache period regardless of
// how many Server Components request this data in the same render tree
const getProducts = unstable_cache(
  async (): Promise<Product[]> => {
    const res = await fetch(`${process.env.API_BASE_URL}/products`, {
      // Also tags the fetch cache entry for on-demand revalidation
      next: { tags: ['products'] },
    })
    if (!res.ok) throw new Error(`Products API returned ${res.status}`)
    return res.json()
  },
  ['products-listing'],
  { revalidate: 3600, tags: ['products'] }
)

export default async function ProductsPage() {
  const products = await getProducts()
  // Hero product is the first item -- preload its image for LCP
  const heroProduct = products[0]

  return (
    <main>
      {/* HeroProduct uses <Image priority> to preload the LCP image */}
      <HeroProduct product={heroProduct} />

      {/* Wrap the grid in Suspense so the hero renders immediately
          even if the grid has additional async work */}
      <Suspense fallback={<ProductGridSkeleton count={12} />}>
        <ProductGrid products={products} />
      </Suspense>
    </main>
  )
}
```

#### File: `components/HeroProduct.tsx`

```tsx
// This is a Server Component -- no "use client" needed
import Image from 'next/image'

interface HeroProductProps {
  product: {
    id: string
    name: string
    price: number
    imageSrc: string
    imageAlt: string
    slug: string
  }
}

export function HeroProduct({ product }: HeroProductProps) {
  return (
    <section className="relative h-[480px] w-full">
      {/* priority prop preloads this image, directly fixing LCP */}
      <Image
        src={product.imageSrc}
        alt={product.imageAlt}
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute bottom-8 left-8">
        <h1 className="text-4xl font-bold text-white">{product.name}</h1>
      </div>
    </section>
  )
}
```

#### File: `components/ProductGrid.tsx`

```tsx
// Server Component -- renders all product cards server-side
// No "use client" means this entire component tree stays out of the JS bundle
import Image from 'next/image'
import Link from 'next/link'

interface Product {
  id: string
  name: string
  price: number
  imageSrc: string
  imageAlt: string
  slug: string
}

// Only the interactive "Add to Cart" button is a Client Component
// Import it separately so the rest of the grid stays server-rendered
import { AddToCartButton } from './AddToCartButton'

export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 p-4 md:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <article key={product.id} className="flex flex-col">
          <Link href={`/products/${product.slug}`}>
            <div className="relative aspect-square w-full">
              <Image
                src={product.imageSrc}
                alt={product.imageAlt}
                fill
                // Correct sizes: full width mobile, 1/3 tablet, 1/4 desktop
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                className="object-cover"
              />
            </div>
            <h2 className="mt-2 text-sm font-medium">{product.name}</h2>
            <p className="text-sm text-gray-600">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
              }).format(product.price)}
            </p>
          </Link>
          {/* Client Component boundary is as deep as possible */}
          <AddToCartButton productId={product.id} />
        </article>
      ))}
    </div>
  )
}
```

#### File: `components/AddToCartButton.tsx`

```tsx
'use client'
// This is the ONLY Client Component in the product grid subtree
// Everything above it is server-rendered and not included in JS bundle

import { useState } from 'react'

export function AddToCartButton({ productId }: { productId: string }) {
  const [loading, setLoading] = useState(false)

  async function handleAddToCart() {
    setLoading(true)
    try {
      await fetch('/api/cart', {
        method: 'POST',
        body: JSON.stringify({ productId }),
        headers: { 'Content-Type': 'application/json' },
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleAddToCart}
      disabled={loading}
      className="mt-2 w-full rounded bg-blue-600 py-2 text-white"
    >
      {loading ? 'Adding...' : 'Add to Cart'}
    </button>
  )
}
```

#### File: `app/api/revalidate/route.ts`

```ts
// Webhook endpoint called by CMS when products are updated
// Instantly invalidates ISR cache without waiting for revalidate timer
import { revalidateTag } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-revalidate-secret')

  if (secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  revalidateTag('products')

  return NextResponse.json({
    revalidated: true,
    timestamp: new Date().toISOString(),
  })
}
```

#### File: `next.config.js`

```js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Reduce icon library bundle size -- import only used icons
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{member}}',
    },
  },

  // Immutable cache headers for hashed static assets
  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },

  images: {
    // Match actual breakpoints to avoid generating unused image sizes
    deviceSizes: [640, 768, 1024, 1280, 1920],
    imageSizes: [64, 128, 256, 384],
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'your-cdn.example.com',
      },
    ],
  },
}

module.exports = withBundleAnalyzer(nextConfig)
```

### Bundle Impact
- Before: 380 KB first-load JS (entire product grid, product card components, image handling all in client bundle)
- After: ~95 KB first-load JS (only `AddToCartButton` and Next.js runtime in client bundle; all product rendering is server-side)
- Change: -285 KB (-75%)
- Method: Removed `"use client"` from `ProductGrid` and `ProductCard`, converting them to Server Components; pushed `"use client"` boundary down to `AddToCartButton` only; replaced any client-side `useState`-based fetching with server-side ISR data fetching

### Validation Steps
1. Run `ANALYZE=true next build` -- verify `ProductGrid` and `ProductCard` are not present in any client-side chunk; only `AddToCartButton` should appear in client chunks
2. Run `next build && next start` in production mode; check the terminal output for the `/products` route -- it should show `○ (Static)` or `◐ (ISR)` indicator, not `λ (Server)`
3. Open Chrome DevTools Network tab with throttling set to Slow 4G; verify `X-Nextjs-Cache: HIT` response header appears on the second load, confirming ISR cache is working
4. Run `npx lighthouse http://localhost:3000/products --view` in production mode and confirm LCP < 2500 ms -- the hero image `priority` prop should eliminate the preload gap
5. Check the Network tab for the hero image -- it should appear in the `<link rel="preload">` tags in the HTML `<head>`, confirming the priority preload is active
6. Test the revalidation webhook by calling `POST /api/revalidate` with the correct secret and verifying the next page load re-fetches product data from the API (check server logs)
7. Measure CLS by running Lighthouse -- if score is above 0.1, verify that all `<Image>` components either have explicit `width`/`height` or use `fill` within a container that has an explicit height
