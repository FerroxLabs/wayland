---
name: nextjs-data-patterns
description: |
  Guides expert-level next.js data patterns implementation: typescript and frameworks decision frameworks, production-ready patterns, and concrete templates for nextjs data patterns workflows.
  Use when the user asks about next.js data patterns, nextjs data patterns configuration, or typescript best practices for next.js projects.
  Do NOT use when the user needs a different web development capability -- check sibling skills in the web development subcategory.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "typescript frameworks backend database"
  category: "web-development"
  subcategory: "web-development"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Next.js Data Patterns

## When to Use

**Use this skill when:**
- The user asks how to fetch data in a Next.js App Router project and needs to choose between Server Components, Route Handlers, or client-side fetching
- The user is deciding between `generateStaticParams`, Incremental Static Regeneration (ISR), or fully dynamic rendering for a specific route
- The user needs to implement caching strategies with `fetch` cache options, `unstable_cache`, or React cache deduplication in Next.js 13+
- The user wants to integrate a database (PostgreSQL, MongoDB, Prisma, Drizzle) directly in Server Components and needs patterns for connection pooling, query structuring, and error handling
- The user is building a data-heavy feature -- search, dashboards, paginated lists, real-time feeds -- and needs the correct rendering and fetching architecture for performance
- The user asks about Server Actions, form mutations, and optimistic UI patterns in the App Router
- The user needs to handle authenticated data fetching, per-user caching, and session-aware queries in Next.js
- The user is migrating a Pages Router (`getServerSideProps`, `getStaticProps`) application to the App Router and needs equivalent patterns

**Do NOT use this skill when:**
- The user is asking about general React state management (Zustand, Jotai, Redux) with no Next.js-specific data fetching question -- use a React state management skill
- The user needs CSS, layout, or UI component advice in Next.js -- use a Next.js UI/styling skill
- The user is building a pure API backend with no rendering layer -- use a Node.js/Express API skill
- The user is asking about deployment, CI/CD, or infrastructure for Next.js -- use a deployment skill
- The user is working in the Pages Router exclusively with no intent to migrate -- patterns differ significantly and this skill targets the App Router model primarily
- The user is asking about Next.js authentication flows beyond data fetching concerns -- use an auth skill
- The user needs real-time WebSocket or Server-Sent Events architecture -- use a real-time communication skill

---

## Process

### 1. Identify the Rendering Context and Freshness Requirements

Before selecting any data pattern, establish the rendering model for the route:

- **Determine staleness tolerance:** Data that changes once per day (blog posts, product catalogs) can tolerate ISR with `revalidate: 3600`. Data that changes per-request (cart contents, user dashboards) must be fully dynamic. Data that never changes (documentation, policy pages) should be statically generated.
- **Map routes to rendering strategies:** Static (`force-static`) → ISR with revalidation interval → Dynamic (`force-dynamic`) with per-request fetching. Choose the least dynamic option that satisfies freshness requirements.
- **Identify authentication requirements:** Authenticated routes must always be dynamic or use per-user cache keys. Never cache authenticated responses without user-scoping -- this causes data leakage across users.
- **Check for streaming requirements:** If the route has a slow data dependency (external API, complex DB query), plan to use `Suspense` boundaries to stream fast content immediately and defer slow content.
- **Classify data by source:** First-party database (use Server Component direct query), third-party REST API (use `fetch` with cache control), third-party SDK without fetch (use `unstable_cache` wrapper), client-only data (browser APIs, user interactions -- use client components with SWR or TanStack Query).

### 2. Choose the Data Fetching Layer

Select the correct layer based on context classification from Step 1:

- **Server Components + direct DB queries:** Use this for the majority of data needs in App Router. Import your Prisma client or Drizzle db instance directly. There is no API round-trip overhead. Example: `const posts = await db.post.findMany({ where: { published: true } })` inside an `async` Server Component.
- **Route Handlers (`app/api/route.ts`):** Use exclusively when you need an actual HTTP endpoint -- consumed by third-party webhooks, mobile clients, or client-side fetch calls from Client Components. Do not call your own Route Handlers from Server Components; that is a wasted HTTP round-trip.
- **Server Actions (`'use server'`):** Use for mutations -- form submissions, creating records, deleting items. Server Actions can be called from both Client Components and Server Components. They run on the server, eliminating the need for dedicated mutation Route Handlers for most use cases.
- **Client-side fetching with TanStack Query or SWR:** Use when data must update after initial render without a full page reload -- live search results, polling dashboards, user-triggered data loads. Always pair with a Route Handler that returns JSON.
- **React `cache()` for deduplication:** Wrap expensive DB queries with `cache()` from React when the same query might be called in multiple Server Components within one render tree. The result is memoized for the duration of that request.

### 3. Design the Cache Strategy

Cache decisions determine performance and cost. Apply these rules precisely:

- **`fetch` with Next.js cache options:** `fetch(url, { cache: 'force-cache' })` caches indefinitely (static). `fetch(url, { next: { revalidate: 60 } })` caches for 60 seconds (ISR). `fetch(url, { cache: 'no-store' })` opts out of caching entirely (dynamic). Default behavior in App Router is `force-cache` for GET requests.
- **`unstable_cache` for non-fetch data sources:** Wrap any async function that fetches from a database or SDK that does not use the native `fetch` API. Provide explicit cache keys and revalidation: `unstable_cache(async () => db.query(...), ['cache-key'], { revalidate: 300, tags: ['posts'] })`.
- **On-demand revalidation with cache tags:** Tag fetches with `{ next: { tags: ['product-123'] } }`. Call `revalidateTag('product-123')` from a Server Action or Route Handler when the underlying data changes. This is the correct pattern for CMS-backed sites and e-commerce product pages.
- **Per-user cache isolation:** Always include the user ID or session token as part of the cache key when caching user-specific data. Never use a shared cache key for personalized content.
- **Cache busting with `revalidatePath`:** Call `revalidatePath('/dashboard')` after mutations to purge the route-level cache. Use this after Server Actions that modify data displayed on specific routes.

### 4. Structure Server Component Data Fetching

Apply these patterns for clean, maintainable Server Component data code:

- **Colocate queries with the component that renders the data.** A `<ProductCard>` Server Component should fetch its own product data rather than receiving it drilled from a parent. This makes components independently cacheable and easier to reason about.
- **Parallelize independent queries with `Promise.all`.** When a page component needs user data AND product data AND analytics data, fetch them in parallel: `const [user, products, analytics] = await Promise.all([getUser(), getProducts(), getAnalytics()])`. Never `await` sequentially unless one query depends on another's result.
- **Use `Suspense` for sequential dependencies.** When query B depends on query A's result, place query B in a child component wrapped in `<Suspense fallback={<Skeleton />}>`. The parent resolves A, passes the result as a prop, and the child streams in when B resolves.
- **Separate data access into a dedicated layer.** Create a `lib/data/` or `lib/queries/` directory. Export typed async functions like `getProductById(id: string): Promise<Product | null>`. Server Components import from this layer, never constructing raw queries inline.
- **Type all data access functions with TypeScript.** Define Zod schemas for external API responses. Define TypeScript types (or use Prisma-generated types) for database results. Validate external data at the boundary -- never trust raw API responses.

### 5. Implement Server Actions for Mutations

Structure Server Actions for reliability and correctness:

- **Always mark the file or function with `'use server'`.** Place shared actions in `app/actions/` or `lib/actions/`. Mark the entire file `'use server'` at the top rather than individual functions when the file contains only server-side code.
- **Validate all input with Zod before touching the database.** Never trust form data. Parse with a Zod schema first: `const parsed = ProductSchema.safeParse(formData)`. Return early with an error object if validation fails.
- **Return typed result objects, not thrown errors.** Return `{ success: true, data: product }` or `{ success: false, error: 'Validation failed', fieldErrors: parsed.error.flatten() }`. This allows Client Components to handle errors without try/catch.
- **Call `revalidatePath` or `revalidateTag` after successful mutations.** Revalidation ensures the UI reflects the new state without a manual refresh.
- **Use `redirect()` from `next/navigation` inside Server Actions** to navigate after successful form submission -- for example, after creating a new product, redirect to `/products/${newProduct.id}`.
- **Handle optimistic updates on the Client Component side** using `useOptimistic`. The Server Action handles the real mutation; `useOptimistic` provides immediate UI feedback before the action resolves.

### 6. Handle Error States and Loading UI

Production data patterns require explicit error and loading handling:

- **Use `error.tsx` boundary files** for route-level error handling. Place an `error.tsx` in each route segment that needs isolated error recovery. The `error.tsx` component receives `error` and `reset` props -- always expose the `reset` function to allow retry.
- **Use `loading.tsx` files for route-level suspense fallbacks.** `loading.tsx` automatically wraps the page in a `<Suspense>` boundary. Use skeleton components, not spinners, for better perceived performance.
- **Distinguish between not-found and error states.** Call `notFound()` from `next/navigation` when a resource does not exist (404). Let real errors bubble to `error.tsx`. Never return null for missing data without signaling 404.
- **Wrap third-party API calls in try/catch** within data access functions. Log errors server-side and return a typed error result rather than propagating the raw exception to the component.
- **Set timeouts on external fetches.** Use `AbortController` with a timeout to prevent slow external APIs from hanging the entire render: `const controller = new AbortController(); setTimeout(() => controller.abort(), 5000); fetch(url, { signal: controller.signal })`.

### 7. Optimize for Performance and Bundle Size

Apply these techniques to keep data patterns fast at scale:

- **Never import server-only modules in Client Components.** Use the `server-only` package: `import 'server-only'` at the top of any file that should never be bundled for the client. This throws a build-time error if accidentally imported in a Client Component.
- **Use `select` or projection queries.** Never fetch entire records when you need three fields. In Prisma: `db.user.findMany({ select: { id: true, name: true, email: true } })`. In Drizzle: use column selection. This reduces payload size and query time.
- **Paginate all list queries.** Never fetch unbounded lists. Use cursor-based pagination for feeds and infinite scroll (more efficient than offset for large datasets). Use offset pagination for admin tables where users jump to specific pages. For cursor pagination, return the last item's ID as the cursor.
- **Measure query performance in development.** Log query times using Prisma's `$on('query')` event or Drizzle's `logger: true` option. Queries exceeding 100ms in development will be significantly slower in production -- investigate with `EXPLAIN ANALYZE`.
- **Use database connection pooling.** In serverless environments (Vercel), use PgBouncer, Neon connection pooling, or Prisma Accelerate. Without pooling, each serverless function invocation opens a new connection, exhausting the database connection limit within seconds under moderate load.

### 8. Validate and Test Data Patterns

Before shipping, validate the implementation:

- **Test RSC data fetching with integration tests**, not unit tests. Use Playwright or Cypress to verify that data appears correctly in the rendered HTML, testing the full stack from browser to database.
- **Verify cache behavior explicitly.** In development, check the `.next/cache` directory and Next.js build output (`next build && next start`) to confirm which routes are static vs. dynamic. The build output explicitly labels each route.
- **Test revalidation end-to-end.** After a mutation, verify the cached route reflects the new data within the expected revalidation window. Test `revalidateTag` paths with a seed + mutate + verify sequence.
- **Load test connection pooling.** Use `k6` or `wrk` to simulate 50-100 concurrent requests and verify the database connection count stays within limits. This catches pooling misconfigurations before production.
- **Audit the client bundle.** Run `ANALYZE=true next build` with `@next/bundle-analyzer`. Verify that database clients, server-only utilities, and large Node.js modules are absent from the client bundle. Any server-only dependency in the client bundle is a security and performance bug.

---

## Output Format

When responding to a user about Next.js data patterns, structure output as follows:

```
## Data Pattern Recommendation: [Route or Feature Name]

### Context Assessment
- Rendering strategy: [Static | ISR (revalidate: Ns) | Dynamic | Streaming]
- Data sources: [List each source and its type]
- Auth required: [Yes / No / Partial]
- Freshness requirement: [e.g., "Within 5 minutes" or "Real-time" or "Build-time"]

### Rendering Strategy Decision
| Factor                  | Assessment              | Impact                          |
|-------------------------|-------------------------|---------------------------------|
| Data staleness tolerance | [e.g., 5 minutes]       | ISR with revalidate: 300        |
| Auth dependency          | [e.g., Per-user]        | Force dynamic, scope cache key  |
| External API latency     | [e.g., ~800ms P95]      | Use Suspense streaming boundary |
| Mutation frequency       | [e.g., High]            | On-demand revalidation via tags |

### Implementation

#### Data Access Layer (`lib/data/[entity].ts`)
\`\`\`typescript
// [Description of the query function]
\`\`\`

#### Server Component (`app/[route]/page.tsx`)
\`\`\`typescript
// [Component fetching and rendering the data]
\`\`\`

#### Server Action (`app/actions/[entity].ts`) [if mutations needed]
\`\`\`typescript
// [Validated mutation action with revalidation]
\`\`\`

#### Client Component [if needed]
\`\`\`typescript
// [Client component with optimistic UI or client-side fetching]
\`\`\`

### Cache Strategy Summary
- Cache mechanism: [fetch cache | unstable_cache | React cache | no cache]
- Cache tags: [list tags]
- Revalidation trigger: [time-based | on-demand | never]
- Per-user scoping: [Yes/No -- how implemented]

### Trade-offs and Alternatives
- [Trade-off 1 and when you'd choose the alternative]
- [Trade-off 2 and when you'd choose the alternative]

### Performance Checklist
- [ ] Queries parallelized with Promise.all where independent
- [ ] Select/projection used -- no SELECT * queries
- [ ] Connection pooling configured for serverless
- [ ] Suspense boundaries placed for slow dependencies
- [ ] server-only package protecting data access layer
- [ ] Bundle analyzed -- no server modules in client bundle
```

---

## Rules

1. **NEVER call a Route Handler from a Server Component.** This creates an unnecessary HTTP round-trip, bypasses type safety, and adds latency. Server Components have direct access to the Node.js runtime -- use it. Only create Route Handlers for endpoints consumed by external clients or Client Components.

2. **NEVER share cache keys across different users.** Any data query that depends on user identity must include the user ID in the cache key. Shared cache keys for authenticated data are a critical security vulnerability that leaks private data between users.

3. **NEVER use `useEffect` + `fetch` in a Client Component for data that can be fetched in a Server Component.** This pattern causes waterfalls: the page loads, JavaScript hydrates, the effect fires, and only then does data load. Move the fetch to a Server Component and pass data as props, or use a Suspense boundary.

4. **ALWAYS use connection pooling in serverless environments.** Each Next.js serverless function is stateless. Without PgBouncer, Neon, Prisma Accelerate, or equivalent, concurrent requests will exhaust PostgreSQL's `max_connections` (typically 100 by default). Configure pool size to match expected concurrency, not maximum database capacity.

5. **NEVER put raw database credentials or query logic in Client Components.** Client Component code is bundled and sent to the browser. Any import of `@prisma/client`, database connection strings, or ORM instances in a Client Component exposes these to users. Use `server-only` imports to enforce this at build time.

6. **ALWAYS validate Server Action inputs with Zod before database operations.** Form data is user-controlled input. An unvalidated Server Action is equivalent to an unvalidated API endpoint -- it is exploitable. Define a Zod schema for every Server Action's expected input.

7. **NEVER await sequential queries when they can run in parallel.** Awaiting `getUser()` then `getProducts()` when the two queries are independent doubles the data fetching latency. Use `Promise.all` for independent parallel fetches. Reserve sequential awaiting for cases where query B genuinely requires the result of query A.

8. **ALWAYS specify `revalidate` explicitly in `unstable_cache`.** Without an explicit revalidation value, `unstable_cache` defaults to indefinite caching. For most application data, indefinite caching without on-demand revalidation leads to stale data bugs that are difficult to diagnose in production.

9. **NEVER use `force-dynamic` as a default for all routes.** Opting every route into dynamic rendering eliminates all caching benefits and increases server costs and latency. Audit each route independently. Only use `force-dynamic` when per-request freshness is genuinely required.

10. **ALWAYS place Suspense boundaries strategically, not at the page root.** Wrapping the entire page in a single `Suspense` boundary defeats streaming -- the user sees nothing until all data resolves. Identify which components have slow data dependencies and wrap only those. Fast components should render immediately; only slow components should be deferred.

---

## Edge Cases

### Migrating from `getServerSideProps` to App Router

When migrating a Pages Router page to App Router, `getServerSideProps` maps to an `async` Server Component page with `export const dynamic = 'force-dynamic'`. `getStaticProps` maps to a static Server Component (no dynamic export). `getStaticProps` with `revalidate` maps to `export const revalidate = N` on the page. Do not attempt to lift `getServerSideProps` logic directly -- it accesses `req` and `res` objects that do not exist in App Router. Rewrite it using `cookies()`, `headers()`, and `searchParams` from `next/headers` and the page's `searchParams` prop. Migrate one route at a time using Next.js's coexistence of Pages and App Router.

### Database Connection Exhaustion Under Load

If queries succeed in development but fail in production with "too many connections" errors, the issue is serverless connection pooling. In development, the Next.js dev server is a long-running process with persistent connections. In production on Vercel or similar platforms, each invocation is isolated. Solutions in priority order: (1) Add PgBouncer as a connection pooler in front of PostgreSQL -- configure Prisma with `?pgbouncer=true&connection_limit=1` in the connection string. (2) Use Neon or PlanetScale's built-in connection pooling. (3) Use Prisma Accelerate's global connection pool. Never set `connection_limit` above 5 per serverless function -- with 100 concurrent requests, 5 connections each means 500 connections, which exceeds most managed database plans.

### Authenticated Data with Partial Static Caching

When a page is mostly static but has one authenticated section (e.g., a product page with a user's saved wishlist status), do not force the entire page dynamic. Use the "shell" pattern: render the static product content as a statically cached Server Component. Place only the authenticated wishlist indicator in a Client Component that fetches from a Route Handler using the user's session cookie. Alternatively, use a Suspense boundary where the outer page is statically cached and the authenticated child component opts into dynamic rendering with `cookies()` -- Next.js will make only the necessary segments dynamic.

### Optimistic Updates Conflicting with Server State

When using `useOptimistic` in Client Components with Server Actions, the optimistic state can conflict with the server's actual response if the mutation fails. Always handle this: the `useOptimistic` hook reverts to the actual state when the Server Action settles. Never reflect optimistic state in the URL (e.g., via `router.push`) before the Server Action confirms success -- this leads to broken navigation if the mutation fails. For complex forms, prefer showing a pending indicator over optimistic mutation if failure is plausible.

### Streaming with Slow Third-Party APIs

When a page depends on a third-party API with variable latency (e.g., a shipping cost estimator averaging 1.2s but spiking to 8s at P99), wrapping the component in `Suspense` prevents the slow API from blocking the entire page. However, if the slow API's data is above the fold and critical to the page's purpose, streaming it in late creates a jarring layout shift. In this case: (1) Cache the API response aggressively (revalidate: 300 or longer) to reduce live API calls. (2) Show a skeleton that matches the final layout dimensions precisely. (3) Set a fetch timeout of 5 seconds with a fallback value so P99 outliers do not perpetually show a skeleton.

### ISR Race Conditions on High-Traffic Routes

ISR (Incremental Static Regeneration) uses a stale-while-revalidate model: after the `revalidate` period expires, the next request receives the stale cached response while a background revalidation runs. On high-traffic routes, thousands of concurrent requests may all read the stale cache before the background revalidation completes -- this is correct behavior, not a bug. However, if data correctness is critical (inventory counts, pricing), ISR is inappropriate. Use on-demand revalidation via `revalidateTag` triggered by your CMS or inventory system webhook instead. This gives you ISR-like caching but with precise invalidation when data actually changes.

### TypeScript Type Safety Across the Data Boundary

Prisma and Drizzle generate types from the database schema, but these types include every field including sensitive ones (password hashes, internal flags). Never return raw Prisma/Drizzle model types to Client Components or through Route Handlers. Define explicit DTO (Data Transfer Object) types for each API boundary: `type PublicProduct = Pick<Product, 'id' | 'name' | 'price' | 'slug'>`. Use Zod schemas to both validate incoming data and infer TypeScript types: `type ProductInput = z.infer<typeof ProductSchema>`. Place these shared types in a `types/` directory imported by both server and client code.

### Environment Variable Leakage

Next.js automatically exposes environment variables prefixed with `NEXT_PUBLIC_` to the client bundle. Any variable without this prefix is server-only. However, if a file that uses `process.env.DATABASE_URL` is imported in a Client Component (even transitively), Next.js will attempt to inline it. Symptoms: the database URL appears in the client bundle or is `undefined` at runtime. Prevention: use the `server-only` package on all files containing server-side environment variables. Audit the bundle with `@next/bundle-analyzer` after every new dependency addition to catch transitive leaks early.

---

## Example

**Input:** "I'm building a Next.js 14 App Router e-commerce product page. Each product page should be fast and mostly cacheable, but it needs to show real-time stock availability and handle adding items to the cart. We're using Prisma with PostgreSQL and deploying to Vercel. What data patterns should I use?"

**Output:**

## Data Pattern Recommendation: E-Commerce Product Page (`/products/[slug]`)

### Context Assessment
- Rendering strategy: ISR for static product content (revalidate: 300) + Dynamic for stock + Client-side for cart
- Data sources: PostgreSQL via Prisma (product data, stock count), Server Action (add to cart)
- Auth required: Partial -- cart requires session, product page is public
- Freshness requirement: Product info within 5 minutes; stock availability per-request; cart real-time

### Rendering Strategy Decision

| Factor                  | Assessment                        | Impact                                    |
|-------------------------|-----------------------------------|-------------------------------------------|
| Product data staleness  | Changes infrequently (admin edits) | ISR revalidate: 300, on-demand via tag    |
| Stock availability      | Must be current per request        | Dynamic child component with no-store fetch |
| Cart state              | Per-user, real-time                | Client Component + Server Action          |
| External API latency    | No external APIs -- Prisma direct  | Fast, no Suspense needed for product data |

### Implementation

#### Data Access Layer (`lib/data/products.ts`)

```typescript
import 'server-only';
import { db } from '@/lib/db'; // Prisma client singleton
import { cache } from 'react';
import { unstable_cache } from 'next/cache';

// Public product DTO -- never expose raw Prisma type
export type PublicProduct = {
  id: string;
  name: string;
  slug: string;
  price: number;
  description: string;
  images: string[];
  categoryName: string;
};

// React cache deduplicates within a single render tree
// unstable_cache persists across requests with ISR
export const getProductBySlug = unstable_cache(
  async (slug: string): Promise<PublicProduct | null> => {
    const product = await db.product.findUnique({
      where: { slug, published: true },
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        description: true,
        images: true,
        category: { select: { name: true } },
      },
    });

    if (!product) return null;

    return {
      ...product,
      categoryName: product.category.name,
    };
  },
  ['product-by-slug'], // base cache key -- slug appended at call site
  {
    revalidate: 300, // 5 minutes
    tags: ['products'], // invalidated on any product update
  }
);

// Stock is always fetched fresh -- no caching
export async function getStockByProductId(productId: string): Promise<number> {
  const inventory = await db.inventory.findUnique({
    where: { productId },
    select: { stockCount: true },
  });
  return inventory?.stockCount ?? 0;
}
```

#### Server Component -- Product Page (`app/products/[slug]/page.tsx`)

```typescript
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getProductBySlug } from '@/lib/data/products';
import { StockIndicator } from './StockIndicator'; // dynamic child
import { AddToCartButton } from './AddToCartButton'; // client component
import { ProductImages } from './ProductImages';

// This route is ISR -- revalidate every 5 minutes
// On-demand revalidation via revalidateTag('products') overrides this
export const revalidate = 300;

type Props = {
  params: { slug: string };
};

export default async function ProductPage({ params }: Props) {
  const product = await getProductBySlug(params.slug);

  if (!product) {
    notFound(); // renders not-found.tsx, returns 404
  }

  return (
    <main>
      <ProductImages images={product.images} alt={product.name} />

      <div>
        <h1>{product.name}</h1>
        <p>{product.categoryName}</p>
        <p className="price">${(product.price / 100).toFixed(2)}</p>
        <p>{product.description}</p>

        {/*
          StockIndicator fetches per-request data.
          Wrapping in Suspense means the cached product content
          streams immediately -- stock loads separately.
        */}
        <Suspense fallback={<div className="h-6 w-32 animate-pulse bg-gray-200" />}>
          <StockIndicator productId={product.id} />
        </Suspense>

        {/* Client Component -- manages cart interaction */}
        <AddToCartButton productId={product.id} productName={product.name} />
      </div>
    </main>
  );
}

// Generate static params at build time for top products
export async function generateStaticParams() {
  const slugs = await db.product.findMany({
    where: { published: true },
    select: { slug: true },
    orderBy: { viewCount: 'desc' },
    take: 200, // pre-render top 200 products; others generated on demand
  });
  return slugs.map((p) => ({ slug: p.slug }));
}
```

#### Dynamic Stock Indicator (`app/products/[slug]/StockIndicator.tsx`)

```typescript
// This Server Component opts out of caching -- always per-request fresh
import { getStockByProductId } from '@/lib/data/products';

// Force this component dynamic regardless of parent revalidate setting
export const dynamic = 'force-dynamic';

export async function StockIndicator({ productId }: { productId: string }) {
  const stock = await getStockByProductId(productId);

  if (stock === 0) {
    return <span className="text-red-600 font-medium">Out of stock</span>;
  }
  if (stock <= 5) {
    return <span className="text-amber-600 font-medium">Only {stock} left</span>;
  }
  return <span className="text-green-600 font-medium">In stock</span>;
}
```

#### Server Action -- Add to Cart (`app/actions/cart.ts`)

```typescript
'use server';

import { z } from 'zod';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth/session';
import { revalidatePath } from 'next/cache';

const AddToCartSchema = z.object({
  productId: z.string().cuid(),
  quantity: z.number().int().min(1).max(10),
});

type ActionResult =
  | { success: true; cartItemCount: number }
  | { success: false; error: string };

export async function addToCart(
  input: z.infer<typeof AddToCartSchema>
): Promise<ActionResult> {
  // 1. Validate input
  const parsed = AddToCartSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: 'Invalid product or quantity' };
  }

  // 2. Require authentication
  const session = await getSession();
  if (!session?.userId) {
    return { success: false, error: 'Please sign in to add items to cart' };
  }

  // 3. Verify stock before adding
  const inventory = await db.inventory.findUnique({
    where: { productId: parsed.data.productId },
    select: { stockCount: true },
  });

  if (!inventory || inventory.stockCount < parsed.data.quantity) {
    return { success: false, error: 'Insufficient stock' };
  }

  // 4. Upsert cart item
  await db.cartItem.upsert({
    where: {
      cartId_productId: {
        cartId: session.userId, // cart keyed by user ID
        productId: parsed.data.productId,
      },
    },
    create: {
      cartId: session.userId,
      productId: parsed.data.productId,
      quantity: parsed.data.quantity,
    },
    update: {
      quantity: { increment: parsed.data.quantity },
    },
  });

  // 5. Get updated cart count for optimistic UI feedback
  const cartCount = await db.cartItem.count({
    where: { cartId: session.userId },
  });

  // 6. Revalidate cart UI -- does NOT revalidate product page (product data unchanged)
  revalidatePath('/cart');

  return { success: true, cartItemCount: cartCount };
}
```

#### Client Component -- Add to Cart Button (`app/products/[slug]/AddToCartButton.tsx`)

```typescript
'use client';

import { useState, useTransition } from 'react';
import { addToCart } from '@/app/actions/cart';

type Props = {
  productId: string;
  productName: string;
};

export function AddToCartButton({ productId, productName }: Props) {
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);

  function handleAddToCart() {
    startTransition(async () => {
      const result = await addToCart({ productId, quantity: 1 });

      if (result.success) {
        setFeedback(`Added to cart (${result.cartItemCount} items)`);
        setTimeout(() => setFeedback(null), 3000);
      } else {
        setFeedback(result.error);
      }
    });
  }

  return (
    <div>
      <button
        onClick={handleAddToCart}
        disabled={isPending}
        aria-label={`Add ${productName} to cart`}
        className="btn-primary"
      >
        {isPending ? 'Adding...' : 'Add to Cart'}
      </button>
      {feedback && <p role="status" aria-live="polite">{feedback}</p>}
    </div>
  );
}
```

#### On-Demand Revalidation Webhook (`app/api/webhooks/cms/route.ts`)

```typescript
import { revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

// Called by your CMS when a product is published or updated
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-webhook-secret');

  if (secret !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { event, productSlug } = await req.json();

  if (event === 'product.updated' || event === 'product.published') {
    revalidateTag('products'); // invalidates all ISR caches tagged 'products'
    // Optionally target a specific product path for immediate revalidation:
    // revalidatePath(`/products/${productSlug}`);
  }

  return NextResponse.json({ revalidated: true });
}
```

### Cache Strategy Summary

| Layer                    | Mechanism             | Key                            | Revalidation                         |
|--------------------------|-----------------------|--------------------------------|--------------------------------------|
| Product data             | `unstable_cache`      | `['product-by-slug', slug]`    | Time-based (300s) + `revalidateTag('products')` |
| Stock availability       | No cache              | N/A                            | Per-request always                   |
| Static product params    | `generateStaticParams` | Route segment                 | ISR at route level (300s)            |
| Cart mutation            | Server Action         | N/A                            | `revalidatePath('/cart')` on success |

### Trade-offs and Alternatives

- **ISR vs. fully dynamic:** This design caches product content for 5 minutes and fetches stock per-request. If stock accuracy is critical even within the 5-minute window (flash sales, limited drops), move the entire page to `force-dynamic` and accept higher server costs. If stock accuracy can be loosened to 1-2 minutes, add `unstable_cache` to the stock query with `revalidate: 60`.

- **Server Action vs. Route Handler for cart:** This design uses a Server Action for cart mutations. If you need a mobile app or third-party integration to also add items to cart, extract the cart logic into a Route Handler at `app/api/cart/route.ts` and call it from both the Server Action and external clients. Do not duplicate the business logic -- the Server Action should call the same service function as the Route Handler.

- **Prisma direct vs. API abstraction:** This design queries Prisma directly from Server Components and data access functions. For teams with separate frontend and backend engineers or microservice architectures, replace direct Prisma calls with authenticated internal API calls to a dedicated backend service. The Server Component fetching patterns remain identical -- only the data source changes.

### Performance Checklist

- [x] Product data and category fetched in single Prisma query with `select` projection
- [x] No sequential awaits -- product and stock fetched independently (stock in child component)
- [x] Connection pooling required: set `DATABASE_URL` to PgBouncer endpoint on Vercel with `?pgbouncer=true&connection_limit=1`
- [x] Suspense boundary isolates slow stock fetch from fast product render
- [x] `server-only` on `lib/data/products.ts` prevents client bundle inclusion
- [x] `generateStaticParams` pre-renders top 200 products at build time
- [x] On-demand revalidation webhook registered for instant cache purge on CMS updates
- [x] `AddToCartButton` uses `useTransition` for non-blocking pending state
- [x] Zod validation on Server Action input before any database operation
- [x] Cart cache key scoped to `session.userId` -- no cross-user data leakage
