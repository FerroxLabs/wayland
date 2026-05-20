---
name: nextjs-app-router-patterns
description: |
  Guides expert-level next.js app router patterns implementation: typescript and frameworks decision frameworks, production-ready patterns, and concrete templates for nextjs app router patterns workflows.
  Use when the user asks about next.js app router patterns, nextjs app router patterns configuration, or typescript best practices for next.js projects.
  Do NOT use when the user needs a different web development capability -- check sibling skills in the web development subcategory.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "typescript frameworks web-development backend"
  category: "web-development"
  subcategory: "web-development"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Next.js App Router Patterns

## When to Use

**Use this skill when:**
- User is building or migrating a Next.js 13+ application using the App Router (`app/` directory) and needs guidance on file conventions, data fetching patterns, or rendering strategies
- User asks about React Server Components (RSC), Server Actions, Streaming, or Suspense boundaries in the context of Next.js
- User wants to implement type-safe route definitions, layout hierarchies, parallel routes, or intercepting routes
- User needs help structuring a Next.js project with the App Router for team scalability -- folder organization, colocation of components, and module boundaries
- User is diagnosing rendering or caching bugs in the App Router -- stale data, unexpected client-side behavior, or misuse of `use client` directives
- User is integrating authentication, middleware, and protected routes using the App Router conventions
- User wants to migrate from the Pages Router to the App Router incrementally

**Do NOT use this skill when:**
- User is working exclusively with the Next.js Pages Router (`pages/` directory) -- use a Pages Router patterns skill instead
- User needs general React patterns without Next.js involvement -- use a React component patterns skill
- User is asking about Next.js deployment infrastructure (Docker, Kubernetes, Vercel-specific CDN configs) -- use a deployment skill
- User needs end-to-end testing strategy (Playwright, Cypress) -- use a testing skill
- User is asking about state management (Zustand, Redux, Jotai) outside the context of RSC/client boundaries -- use a state management skill
- User needs database ORM design (Prisma schema modeling, query optimization) independent of Next.js data fetching -- use a database skill
- User is on Next.js 12 or earlier -- the App Router did not exist before version 13

---

## Process

### 1. Establish the Rendering Strategy for Each Route

Before writing any code, determine how each route renders its data. The App Router exposes four rendering modes, and mixing them incorrectly causes both performance problems and stale data bugs.

- **Static (default):** Pages rendered at build time. Use when data does not change between user requests -- marketing pages, documentation, blog posts. No data fetching at runtime. Output is cached to CDN.
- **Dynamic:** Pages rendered at request time. Triggered automatically when you call `cookies()`, `headers()`, or `searchParams` inside a Server Component, or when `fetch()` is called with `cache: 'no-store'`. Use for dashboards, account pages, and anything user-specific.
- **Incremental Static Regeneration (ISR):** Use `fetch()` with `next: { revalidate: N }` where N is seconds. Suitable for product listings, pricing pages, or any data that changes on a known cadence. A value of 60 is common for frequently updated data; 3600 for near-static content.
- **Streaming (Partial Rendering):** Use `<Suspense>` boundaries to stream UI shells immediately while slow data fetches complete. This is the correct pattern for pages with independent slow data sources -- never await everything in a single async component when parts could be parallelized.

Map each route in the application to one of these four modes before implementation. Document the choice as a comment at the top of each `page.tsx`.

### 2. Design the Layout Hierarchy

Layout files in the App Router are persistent -- they do not remount on navigation between child routes. This is powerful but requires deliberate design.

- **Root layout** (`app/layout.tsx`): The only file that must include `<html>` and `<body>`. Add global providers (theme, analytics, auth context) here. Keep this file minimal -- every byte here affects every route in the application.
- **Segment layouts**: Create a `layout.tsx` inside any route segment that needs shared UI -- navigation bars, sidebars, breadcrumbs. The layout receives `children` and optionally `params` for dynamic segments.
- **Route groups** (`(groupName)/`): Use parentheses to group routes that share a layout without affecting the URL path. For example, `(auth)/login` and `(auth)/register` can share an auth layout without `/auth/` appearing in the URL.
- **Parallel routes** (`@slot`): Use `@slotName` folders when a single URL must simultaneously render multiple independent views -- dashboards with separate panels, modals alongside the main content. Each slot has its own `loading.tsx` and `error.tsx`.
- **Avoid nesting layouts more than 3 levels deep.** Every nesting level adds complexity to the `params` type and increases the likelihood of layout remounting bugs. If you exceed 3 levels, flatten with route groups or reconsider the URL structure.

### 3. Apply the Server Component vs. Client Component Decision Tree

Every component in the App Router is a Server Component by default. Adding `'use client'` at the top opts the entire subtree into client-side rendering. This decision has significant performance and capability implications.

Use this decision tree for each component:

```
Does this component need:
├── Browser APIs (window, document, localStorage)?        → Client Component
├── Event handlers (onClick, onChange, onSubmit)?         → Client Component
├── React hooks (useState, useEffect, useContext)?        → Client Component
├── Real-time updates (WebSocket, SSE polling)?           → Client Component
└── None of the above?                                    → Server Component

Is this component fetching data?
├── From a database or internal API?                      → Server Component (direct DB access)
├── From a third-party API with a secret key?             → Server Component (keys never exposed)
└── From a public API after user interaction?             → Client Component with SWR or React Query
```

**Critical rule -- push `'use client'` to leaf nodes.** A common mistake is adding `'use client'` to a parent component that contains both interactive elements and data-heavy children. Instead, extract the interactive part into a small client component and keep the parent as a Server Component. Example: a `<ProductPage>` Server Component can import a `<AddToCartButton>` Client Component -- the button is a leaf, so only it pays the client bundle cost.

### 4. Implement Data Fetching Correctly

The App Router fundamentally changes data fetching. There is no `getServerSideProps` or `getStaticProps` -- async Server Components fetch data directly.

- **Direct database access in Server Components:** Import your ORM (Prisma, Drizzle) directly into `page.tsx` or `layout.tsx`. Call `await db.user.findUnique(...)` inline. This eliminates the API round-trip for server-rendered data.
- **Parallel data fetching with `Promise.all`:** When a page needs multiple independent data sources, fetch them in parallel:
  ```typescript
  const [user, products, announcements] = await Promise.all([
    getUser(userId),
    getProducts(categoryId),
    getAnnouncements(),
  ]);
  ```
  Never sequentially await unrelated fetches -- each sequential await adds the full latency of the slowest query to the total render time.
- **Deduplication with `cache()`:** Next.js automatically deduplicates `fetch()` calls with identical URLs and options within a single request. For non-fetch data sources (database queries, Redis lookups), use React's `cache()` wrapper to achieve the same deduplication:
  ```typescript
  import { cache } from 'react';
  export const getUser = cache(async (id: string) => {
    return db.user.findUnique({ where: { id } });
  });
  ```
  Call `getUser(id)` in both a layout and its child page -- the database query executes exactly once.
- **Server Actions for mutations:** Use `'use server'` directive inside async functions for form submissions and data mutations. Server Actions are the correct replacement for dedicated mutation API routes in most cases. Always validate input with Zod before processing:
  ```typescript
  'use server';
  import { z } from 'zod';
  const schema = z.object({ email: z.string().email(), name: z.string().min(1) });
  export async function createUser(formData: FormData) {
    const result = schema.safeParse(Object.fromEntries(formData));
    if (!result.success) return { error: result.error.flatten() };
    await db.user.create({ data: result.data });
    revalidatePath('/users');
  }
  ```

### 5. Configure Caching and Revalidation

The App Router has a four-layer cache system. Misunderstanding it causes the most common production bugs -- serving stale data or, conversely, over-fetching and killing performance.

- **Request Memoization (in-memory, per-request):** Automatic for `fetch()`. Lasts for the duration of a single server render. This is not configurable.
- **Data Cache (persistent, cross-request):** `fetch()` responses are stored on disk or in the CDN. Controlled by `cache` and `next.revalidate` options on each `fetch()` call. Default is `force-cache` (cached indefinitely). Use `cache: 'no-store'` to opt out entirely for a specific fetch.
- **Full Route Cache (static rendering):** The rendered HTML of statically generated pages. Invalidated by `revalidatePath()`, `revalidateTag()`, or deployment.
- **Router Cache (client-side, in-memory):** The browser caches rendered Server Component payloads for already-visited routes. Duration: 30 seconds for dynamic routes, 5 minutes for static routes in Next.js 14+. This causes the "my mutation didn't update the UI" bug -- always call `router.refresh()` or use `revalidatePath()` in Server Actions after mutations.

**Tag-based revalidation** is the most scalable invalidation strategy. Tag fetches at data-fetch time, then invalidate by tag when data changes:
```typescript
// In data fetch
fetch('/api/products', { next: { tags: ['products', `product-${id}`] } });
// In Server Action or API route after mutation
revalidateTag('products');         // invalidates all products
revalidateTag(`product-${id}`);    // invalidates one product
```

### 6. Handle Loading, Error, and Not-Found States

The App Router uses file conventions to handle UI states at the route segment level. Every production route must have all three files.

- **`loading.tsx`:** Renders immediately while the segment's `page.tsx` is fetching. The runtime automatically wraps `page.tsx` in a `<Suspense>` boundary with this as the fallback. Create skeleton UI that matches the page layout -- not a generic spinner -- to minimize layout shift.
- **`error.tsx`:** Must be a Client Component (`'use client'`). Receives `error: Error` and `reset: () => void` props. Call `reset()` to attempt re-rendering the segment. Log the error to your observability service (Sentry, Datadog) in a `useEffect` inside this component:
  ```typescript
  'use client';
  useEffect(() => {
    captureException(error);
  }, [error]);
  ```
- **`not-found.tsx`:** Rendered when `notFound()` is called inside a Server Component. Use this instead of conditionally returning null -- `notFound()` sets the correct 404 HTTP status code, which `null` does not.
- **Global `app/not-found.tsx`:** Catches 404s for routes that do not exist at all (no matching `page.tsx`). This is different from segment-level not-found files.
- **`global-error.tsx`:** Must be a Client Component. Catches errors thrown in the root layout, which the segment-level `error.tsx` cannot catch. Must include its own `<html>` and `<body>` tags since the root layout is unavailable.

### 7. Type-Safe Routing and Params

Dynamic route segments generate `params` objects that are untyped by default. Establish type safety immediately to prevent runtime errors.

- **Typed params:** Each dynamic segment (`[id]`, `[slug]`, `[...catchAll]`) generates a `params` object. Define the type explicitly:
  ```typescript
  // app/products/[categoryId]/[productId]/page.tsx
  interface Props {
    params: { categoryId: string; productId: string };
    searchParams: { sort?: string; page?: string };
  }
  export default async function ProductPage({ params, searchParams }: Props) {
    const page = Number(searchParams.page ?? '1');
  ```
- **`generateStaticParams()`:** For statically generated dynamic routes, export this function to tell Next.js which param values to pre-render at build time. Return an array of param objects. Fetching from a database inside `generateStaticParams` is correct and encouraged:
  ```typescript
  export async function generateStaticParams() {
    const products = await db.product.findMany({ select: { id: true } });
    return products.map((p) => ({ productId: p.id }));
  }
  ```
- **`generateMetadata()`:** Export this async function alongside `generateStaticParams` to produce dynamic SEO metadata. It receives the same `params` and `searchParams` as the page component. Use it to set `title`, `description`, `openGraph`, and `twitter` fields per page.
- **Use `createSearchParamsSchema` pattern:** Validate `searchParams` with Zod at the top of page components. Never trust raw query string values -- users can pass arbitrary strings, and unvalidated searchParams cause subtle bugs:
  ```typescript
  const searchSchema = z.object({
    page: z.coerce.number().min(1).default(1),
    sort: z.enum(['asc', 'desc']).default('desc'),
  });
  const { page, sort } = searchSchema.parse(searchParams);
  ```

### 8. Middleware and Authentication Patterns

Next.js Middleware runs on every request before the page renders. Keep it lightweight -- it executes on the Edge Runtime with strict size limits (1MB default).

- **Authentication gate:** Check for a session token in `cookies()` inside middleware. Redirect unauthenticated users to the login page for protected route groups. Use `NextResponse.redirect()` with the original URL encoded as a query parameter so the login page can redirect back after success.
- **Matcher configuration:** Restrict middleware to only the routes that need it. Never run middleware on static assets:
  ```typescript
  export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|public/).*)'],
  };
  ```
- **Session validation in middleware vs. Server Components:** Middleware should only validate the presence of a session token (fast, cryptographic check). Fetch the full user object in the Server Component or layout that needs it -- do not make database calls in middleware.
- **CSRF protection for Server Actions:** Next.js 14+ includes built-in CSRF protection for Server Actions (origin checking). Do not disable this. For additional protection with external form submissions, add a CSRF token validation layer using the `iron-session` or `csrf` package.

---

## Output Format

When responding to a user about App Router patterns, structure the output as follows:

```
## App Router Pattern Recommendation

### Route Analysis
| Route | Rendering Mode | Data Sources | Revalidation Strategy |
|-------|----------------|--------------|----------------------|
| /     | Static (ISR)   | CMS API      | revalidate: 3600     |
| /dashboard | Dynamic   | DB (user-specific) | no-store      |
| /products/[id] | Static + ISR | DB    | revalidateTag: products |

### Component Boundary Map
[Parent route segment]
├── layout.tsx (Server) -- persistent shell, auth check
│   └── page.tsx (Server) -- primary data fetch
│       ├── <DataHeavySection> (Server) -- DB query direct
│       ├── <InteractiveWidget> (Client) -- 'use client', leaf node
│       └── <Suspense fallback={<WidgetSkeleton />}>
│               └── <SlowDataComponent> (Server) -- streamed

### Data Fetching Implementation
[Concrete TypeScript code for the specific use case]

### Caching Configuration
[Specific revalidation tags, intervals, and invalidation triggers]

### Required Files Checklist
- [ ] app/layout.tsx (root, includes providers)
- [ ] app/(group)/layout.tsx (segment layout if needed)
- [ ] app/(group)/[segment]/page.tsx
- [ ] app/(group)/[segment]/loading.tsx (skeleton)
- [ ] app/(group)/[segment]/error.tsx (Client Component)
- [ ] app/(group)/[segment]/not-found.tsx

### TypeScript Types
[Typed params interfaces, searchParams schemas, return types for data functions]
```

---

## Rules

1. **NEVER use `'use client'` on a parent component that could remain a Server Component.** Audit every `'use client'` placement. If the only reason a parent has `'use client'` is because one child button needs `onClick`, extract the button into its own Client Component file and keep the parent as a Server Component. This preserves RSC payload efficiency.

2. **NEVER call `fetch()` inside a Client Component to retrieve data that could be fetched in a Server Component.** Client-side fetching exposes your data fetching logic to the browser, delays the first meaningful paint, and bypasses Next.js's Data Cache. The only valid reason to fetch in a Client Component is data that depends on real-time user interaction after the initial page load.

3. **ALWAYS validate `searchParams` and `params` with Zod or equivalent at the page boundary.** Raw values from `searchParams` are always strings or string arrays. Passing them directly to database queries or business logic without parsing is a type safety violation and a potential injection vector.

4. **NEVER `await` two independent data fetches sequentially in the same async Server Component.** Sequential awaits multiply latency. If `fetchUser()` takes 50ms and `fetchProducts()` takes 100ms, sequential execution takes 150ms; parallel execution with `Promise.all` takes 100ms. This is a measurable performance regression at scale.

5. **ALWAYS provide a `loading.tsx` file for every route segment that performs data fetching.** Without `loading.tsx`, Next.js does not stream anything to the browser until the entire segment finishes rendering. A 500ms database query means 500ms of blank screen. `loading.tsx` reduces perceived latency to near-zero.

6. **NEVER expose database connection strings, API secret keys, or private environment variables to Client Components.** Only environment variables prefixed with `NEXT_PUBLIC_` are safe to use in Client Components. All secret configuration must remain in Server Components, Route Handlers, or Server Actions. Use `server-only` package to enforce this at compile time:
   ```typescript
   import 'server-only'; // throw build error if imported by client code
   ```

7. **ALWAYS use `revalidatePath()` or `revalidateTag()` inside Server Actions after mutations.** Omitting revalidation causes the Router Cache to serve stale data to the user, making mutations appear to have no effect. Call `revalidatePath('/affected-route')` or `revalidateTag('affected-tag')` as the last operation in every mutation Server Action.

8. **NEVER create a Route Handler (`route.ts`) for data that can be fetched directly in a Server Component.** Route Handlers add a network round-trip, a new caching layer to reason about, and additional attack surface. They are correct for webhooks, OAuth callbacks, file downloads, and responses consumed by external systems -- not for your own UI's data needs.

9. **ALWAYS colocate component files with the route segment that owns them unless they are genuinely shared.** The App Router allows non-page files (components, hooks, utilities) to live inside the `app/` directory without becoming routes -- only `page.tsx`, `layout.tsx`, `route.ts`, and convention files are routable. Use this to colocate private components:
   ```
   app/dashboard/
     page.tsx
     _components/
       DashboardChart.tsx    ← private to this segment
       MetricCard.tsx        ← private to this segment
   ```
   Components shared across multiple segments live in `components/` at the root level.

10. **NEVER ignore TypeScript errors in App Router convention files by casting to `any`.** The `params` object, `searchParams`, Server Action arguments, and `generateMetadata` return types all have strict definitions. If TypeScript reports an error on these, the code has a real structural problem -- do not silence it with a cast. Fix the underlying type mismatch or consult the Next.js type definitions in `next/dist/shared/lib/router/utils/route-regex.d.ts`.

---

## Edge Cases

### Migrating from Pages Router While Running Both Simultaneously
Next.js supports running `pages/` and `app/` directories side by side. During migration, the same route must not exist in both directories -- Next.js throws a build error for conflicts. Strategy: migrate route-by-route, starting with static marketing pages (easiest) and ending with heavily interactive pages (hardest). Shared components used by both routers must be Client Components or plain React components in `components/` -- they cannot use Server Component features like direct database access while still being imported by Pages Router files. Use `next/compat/router` for shared hooks that work in both contexts. Expect migration to take 2-8 weeks for a medium-sized application.

### Server Actions Failing Silently on Validation Errors
A common pattern mistake: Server Actions that `throw new Error(...)` on validation failure. Thrown errors are caught by the nearest `error.tsx`, which shows a full page error screen -- catastrophic for a form submission. Instead, Server Actions should return discriminated union objects:
```typescript
type ActionResult =
  | { success: true; data: User }
  | { success: false; error: { field: string; message: string }[] };
```
The Client Component calling the action reads the result and displays field-level errors inline. Only throw for truly exceptional conditions (database connection failure, unexpected server error).

### Parallel Routes with Intercepting Routes (Modal Patterns)
Implementing a modal that shows a photo when clicked (remaining on the list page) while also supporting a direct URL to that photo as a full page -- the Instagram-style pattern -- requires combining parallel routes and intercepting routes. The `@modal` slot renders the intercepted route as a modal; direct navigation renders the full page. This pattern breaks when the user hard-refreshes on the modal URL because the intercepting route only activates during client navigation. The full page at `app/photos/[id]/page.tsx` must always exist as a fallback. Also provide a `default.tsx` in `@modal` returning `null` so non-modal states do not crash from an unmatched slot.

### Large Bundle Sizes from Accidental Client-Side Imports
When a heavy library (a PDF renderer, a chart library, a rich text editor) is imported inside a file that has `'use client'`, it joins the client JavaScript bundle and bloats every user's download. The solution is dynamic imports with `ssr: false`:
```typescript
import dynamic from 'next/dynamic';
const PDFViewer = dynamic(() => import('@/components/PDFViewer'), {
  ssr: false,
  loading: () => <div>Loading document...</div>,
});
```
Use `next-bundle-analyzer` (configure via `ANALYZE=true next build`) to audit bundle composition. Any single chunk exceeding 200KB warrants investigation. Aim for initial JavaScript below 80KB for the first meaningful paint.

### Authentication Token Refresh in Middleware
When using JWT-based authentication where tokens expire (typically every 15 minutes), middleware must handle token refresh transparently. The naive approach -- refreshing in middleware on every request -- creates a thundering herd on the auth server. Correct pattern: check if the access token expires within the next 60 seconds (grace period), refresh only then, and write the new token back to the response cookies with `response.cookies.set()`. Use a mutex pattern (storing a refresh-in-progress flag in KV storage like Redis or Upstash) to prevent simultaneous refresh requests from multiple edge workers creating duplicate tokens.

### Streaming Hydration Mismatches
When a Server Component streams HTML that contains dynamic content (dates, user locale, random values), React's hydration pass on the client can produce a mismatch if the client renders a different value than the server did. This throws a hydration error that falls back to client-side rendering, defeating the streaming benefit. Solutions: (1) Use `suppressHydrationWarning={true}` on elements where mismatch is expected (timestamps) and update them in `useEffect`. (2) Pass locale and timezone to the server as a cookie so the server and client agree on formatting. (3) Never use `Math.random()` or `Date.now()` directly in rendered output -- derive them from stable server-side data.

### Route Handler Rate Limiting on Edge Runtime
Route Handlers deployed to the Edge Runtime cannot use `node:crypto` (for HMAC signature validation) or native Node.js modules. They also cannot maintain in-memory state between requests. For rate limiting, use an external store: Upstash Redis with the `@upstash/ratelimit` package is the standard solution for Edge-compatible rate limiting. Configure a sliding window algorithm with a limit appropriate to the endpoint (10 requests/second for public APIs, 2 requests/second for authentication endpoints). Return `429 Too Many Requests` with a `Retry-After` header calculated from the rate limit window.

---

## Example

**Input:** "I'm building a product catalog with Next.js 14 App Router. We have a PostgreSQL database with ~50,000 products. Product pages should be fast (SEO is critical), the product list should be filterable by category and price in the URL, and users should be able to add to cart (requires auth). What patterns do you recommend?"

**Output:**

## App Router Pattern Recommendation -- Product Catalog

### Route Analysis

| Route | Rendering Mode | Rationale | Revalidation |
|-------|----------------|-----------|--------------|
| `/products` | Dynamic | `searchParams` (filters) make it request-time | `no-store` for filters; ISR fallback `revalidate: 300` for base list |
| `/products/[slug]` | Static ISR | SEO-critical, product data changes infrequently | `revalidateTag: product-{slug}` on update |
| `/cart` | Dynamic | User-specific, must read session | `cache: 'no-store'` |
| `/api/cart` | Route Handler | Mutation endpoint consumed by client | N/A -- mutation |

### Project Structure

```
app/
├── layout.tsx                          ← root layout, SessionProvider, global styles
├── (catalog)/                          ← route group, shared catalog layout
│   ├── layout.tsx                      ← catalog nav, category sidebar (Server)
│   ├── products/
│   │   ├── page.tsx                    ← product list (Dynamic -- reads searchParams)
│   │   ├── loading.tsx                 ← product grid skeleton
│   │   ├── error.tsx                   ← Client Component, error boundary
│   │   ├── _components/
│   │   │   ├── ProductGrid.tsx         ← Server Component, renders product cards
│   │   │   ├── FilterControls.tsx      ← Client Component ('use client', URL state)
│   │   │   └── ProductCard.tsx         ← Server Component, individual card
│   │   └── [slug]/
│   │       ├── page.tsx                ← product detail (Static ISR)
│   │       ├── loading.tsx
│   │       ├── not-found.tsx
│   │       └── _components/
│   │           ├── ProductImages.tsx    ← Client Component (image carousel)
│   │           └── AddToCartButton.tsx  ← Client Component ('use client')
├── cart/
│   ├── page.tsx                        ← Dynamic, auth-required
│   └── loading.tsx
└── api/
    └── cart/
        └── route.ts                    ← POST handler for cart mutations
```

### Component Boundary Map

```
app/(catalog)/products/[slug]/page.tsx (Server)
├── <ProductImages images={product.images} /> (Client) ← carousel needs state
├── <ProductInfo product={product} /> (Server)         ← pure data display
├── <Suspense fallback={<ReviewsSkeleton />}>
│   └── <ProductReviews productId={product.id} /> (Server) ← slow, streamed
└── <AddToCartButton productId={product.id} /> (Client) ← needs onClick + auth
```

### Data Fetching Implementation

**Product list page with URL-based filtering:**

```typescript
// app/(catalog)/products/page.tsx
import { Suspense } from 'react';
import { z } from 'zod';
import { cache } from 'react';
import { db } from '@/lib/db';
import { ProductGrid } from './_components/ProductGrid';
import { FilterControls } from './_components/FilterControls';
import { ProductGridSkeleton } from './_components/ProductGridSkeleton';

const filterSchema = z.object({
  category: z.string().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().max(100000).optional(),
  sort: z.enum(['price_asc', 'price_desc', 'newest', 'popular']).default('popular'),
  page: z.coerce.number().min(1).default(1),
});

interface Props {
  searchParams: Record<string, string | string[] | undefined>;
}

export default async function ProductsPage({ searchParams }: Props) {
  // Validate all searchParams at the boundary -- never trust raw values
  const filters = filterSchema.parse(searchParams);

  return (
    <div className="grid grid-cols-[280px_1fr] gap-8">
      {/* FilterControls is Client -- it manages URL state via useRouter */}
      <FilterControls currentFilters={filters} />

      {/* Suspense lets the filter UI render immediately while products load */}
      <Suspense key={JSON.stringify(filters)} fallback={<ProductGridSkeleton count={24} />}>
        <ProductGrid filters={filters} />
      </Suspense>
    </div>
  );
}
```

**Product grid as Server Component (direct DB access):**

```typescript
// app/(catalog)/products/_components/ProductGrid.tsx
import { db } from '@/lib/db';
import { ProductCard } from './ProductCard';
import { Pagination } from '@/components/Pagination';

const PAGE_SIZE = 24;

interface Filters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sort: 'price_asc' | 'price_desc' | 'newest' | 'popular';
  page: number;
}

async function getProducts(filters: Filters) {
  const where = {
    ...(filters.category && { categorySlug: filters.category }),
    price: {
      ...(filters.minPrice !== undefined && { gte: filters.minPrice }),
      ...(filters.maxPrice !== undefined && { lte: filters.maxPrice }),
    },
  };

  const orderBy = {
    price_asc:  { price: 'asc' as const },
    price_desc: { price: 'desc' as const },
    newest:     { createdAt: 'desc' as const },
    popular:    { salesCount: 'desc' as const },
  }[filters.sort];

  const [products, total] = await Promise.all([
    db.product.findMany({
      where,
      orderBy,
      skip: (filters.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true, slug: true, name: true,
        price: true, imageUrl: true, rating: true,
      },
    }),
    db.product.count({ where }),
  ]);

  return { products, total, pageCount: Math.ceil(total / PAGE_SIZE) };
}

export async function ProductGrid({ filters }: { filters: Filters }) {
  const { products, pageCount } = await getProducts(filters);

  if (products.length === 0) {
    return <p className="text-center py-16">No products match your filters.</p>;
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      <Pagination currentPage={filters.page} pageCount={pageCount} />
    </>
  );
}
```

**Static ISR product detail page:**

```typescript
// app/(catalog)/products/[slug]/page.tsx
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { db } from '@/lib/db';
import { ProductImages } from './_components/ProductImages';
import { AddToCartButton } from './_components/AddToCartButton';
import { ProductReviews } from './_components/ProductReviews';
import type { Metadata } from 'next';

interface Props {
  params: { slug: string };
}

// cache() deduplicates -- both generateMetadata and the page call this once
const getProduct = cache(async (slug: string) => {
  return db.product.findUnique({
    where: { slug },
    include: { images: true, category: true },
  });
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProduct(params.slug);
  if (!product) return { title: 'Product Not Found' };
  return {
    title: `${product.name} | Our Store`,
    description: product.description.slice(0, 160),
    openGraph: {
      images: [{ url: product.images[0]?.url, width: 1200, height: 630 }],
    },
  };
}

export async function generateStaticParams() {
  // Pre-render top 1000 products at build time; the rest serve on-demand
  const products = await db.product.findMany({
    take: 1000,
    orderBy: { salesCount: 'desc' },
    select: { slug: true },
  });
  return products.map((p) => ({ slug: p.slug }));
}

// ISR: revalidate every 10 minutes; tag-based invalidation on product update
export const revalidate = 600;

export default async function ProductDetailPage({ params }: Props) {
  const product = await getProduct(params.slug);
  if (!product) notFound();

  return (
    <div className="grid grid-cols-2 gap-12">
      <ProductImages images={product.images} />       {/* Client -- carousel */}
      <div>
        <h1 className="text-3xl font-bold">{product.name}</h1>
        <p className="text-2xl">${(product.price / 100).toFixed(2)}</p>
        <p>{product.description}</p>
        <AddToCartButton productId={product.id} />    {/* Client -- onClick */}
      </div>
      {/* Reviews are slow -- stream them independently */}
      <Suspense fallback={<ReviewsSkeleton />}>
        <ProductReviews productId={product.id} />
      </Suspense>
    </div>
  );
}
```

**Add to cart Server Action with validation:**

```typescript
// app/actions/cart.ts
'use server';

import { z } from 'zod';
import { cookies } from 'next/headers';
import { revalidateTag } from 'next/cache';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

const addToCartSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.coerce.number().int().min(1).max(99),
});

type CartActionResult =
  | { success: true; cartItemCount: number }
  | { success: false; error: string };

export async function addToCart(formData: FormData): Promise<CartActionResult> {
  const session = await getSession(cookies());
  if (!session) {
    return { success: false, error: 'You must be signed in to add items to your cart.' };
  }

  const parsed = addToCartSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { success: false, error: 'Invalid product data.' };
  }

  const { productId, quantity } = parsed.data;

  // Verify product exists and has stock
  const product = await db.product.findUnique({
    where: { id: productId },
    select: { stock: true, price: true },
  });
  if (!product || product.stock < quantity) {
    return { success: false, error: 'Insufficient stock.' };
  }

  await db.cartItem.upsert({
    where: { userId_productId: { userId: session.userId, productId } },
    update: { quantity: { increment: quantity } },
    create: { userId: session.userId, productId, quantity },
  });

  // Invalidate the user's cart in the Route Cache
  revalidateTag(`cart-${session.userId}`);

  const cart = await db.cartItem.aggregate({
    where: { userId: session.userId },
    _sum: { quantity: true },
  });

  return { success: true, cartItemCount: cart._sum.quantity ?? 0 };
}
```

**AddToCartButton Client Component consuming the Server Action:**

```typescript
// app/(catalog)/products/[slug]/_components/AddToCartButton.tsx
'use client';

import { useTransition, useState } from 'react';
import { addToCart } from '@/app/actions/cart';

export function AddToCartButton({ productId }: { productId: string }) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ success: boolean; error?: string } | null>(null);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await addToCart(formData);
      setResult(res);
    });
  }

  return (
    <form action={handleSubmit}>
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="quantity" value="1" />
      <button
        type="submit"
        disabled={isPending}
        className="btn-primary w-full"
      >
        {isPending ? 'Adding...' : 'Add to Cart'}
      </button>
      {result && !result.success && (
        <p className="text-red-600 mt-2">{result.error}</p>
      )}
      {result?.success && (
        <p className="text-green-600 mt-2">Added to cart!</p>
      )}
    </form>
  );
}
```

### Caching Configuration Summary

| Data | Strategy | Rationale |
|------|----------|-----------|
| Product list | `cache: 'no-store'` (filtered) | Filters change per request |
| Product detail | `revalidate: 600` + `revalidateTag` | ISR for SEO, tag invalidation on update |
| Product reviews | `revalidate: 300` | Moderate freshness, not critical path |
| Cart data | `revalidateTag: cart-{userId}` | Invalidated on every cart mutation |

### Required Files Checklist

- [x] `app/layout.tsx` -- root layout with session provider
- [x] `app/(catalog)/layout.tsx` -- catalog navigation
- [x] `app/(catalog)/products/page.tsx` -- dynamic list with filter validation
- [x] `app/(catalog)/products/loading.tsx` -- 24-item grid skeleton
- [x] `app/(catalog)/products/error.tsx` -- Client Component with error logging
- [x] `app/(catalog)/products/[slug]/page.tsx` -- ISR detail with generateStaticParams
- [x] `app/(catalog)/products/[slug]/loading.tsx` -- detail page skeleton
- [x] `app/(catalog)/products/[slug]/not-found.tsx` -- 404 for unknown slugs
- [x] `app/actions/cart.ts` -- Server Action with Zod validation
- [ ] `middleware.ts` -- authentication gate for `/cart` routes (implement next)
