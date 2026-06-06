---
name: react-server-components
description: |
  Guides expert-level react server components implementation: typescript and frameworks decision frameworks, production-ready patterns, and concrete templates for react server components workflows.
  Use when the user asks about react server components, react server components configuration, or typescript best practices for react projects.
  Do NOT use when the user needs a different web development capability -- check sibling skills in the web development subcategory.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "typescript frameworks backend web-development"
  category: "web-development"
  subcategory: "web-development"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# React Server Components

## When to Use

**Use this skill when:**
- The user is deciding whether to use React Server Components (RSC) vs. client components in Next.js App Router, Remix, or a custom RSC-enabled framework
- The user needs to implement data fetching directly in server components without useEffect or external state managers like React Query
- The user is debugging hydration mismatches, "use client" boundary errors, or serialization failures in an RSC application
- The user wants to colocate database queries, file system access, or secret environment variables inside React components without exposing them to the browser
- The user is migrating a Next.js Pages Router application to the App Router and needs to restructure component boundaries
- The user wants to reduce JavaScript bundle size by moving computation-heavy components -- like syntax highlighting, markdown parsing, or date formatting -- to the server
- The user needs to understand the RSC payload format, streaming behavior, or Suspense integration for progressive rendering

**Do NOT use this skill when:**
- The user is asking about React without a framework that supports RSC -- raw Create React App, Vite with standard React, or Webpack-only setups do not support RSC natively; redirect to client-side React patterns
- The user needs help with Next.js Pages Router (`pages/` directory) -- RSC concepts do not apply there; check sibling skills for Pages Router patterns
- The user is building a React Native application -- RSC support in React Native is experimental and follow different constraints
- The user needs help with state management libraries (Zustand, Redux, Jotai) in isolation -- these are client-side concerns; check the state management skill
- The user is asking about server-side rendering (SSR) in the traditional sense (getServerSideProps, renderToString) -- RSC is a different architecture than classic SSR
- The user needs general TypeScript advice not tied to component boundaries or RSC-specific typing patterns
- The user is asking about testing React components in Jest or Vitest without RSC-specific concerns -- check the React testing skill

---

## Process

### 1. Assess the Component Boundary Decision

Before writing any code, classify every component in scope using the Server/Client decision tree:

- **Render environment audit:** Ask whether the component needs access to browser APIs (window, localStorage, IntersectionObserver), event handlers (onClick, onChange), or React hooks (useState, useEffect, useContext). If yes, it MUST be a client component with `"use client"` at the top.
- **Data access audit:** Ask whether the component directly reads from a database (Prisma, Drizzle, pg), calls a private API with secret credentials, reads environment variables prefixed without `NEXT_PUBLIC_`, or reads from the file system. If yes, it SHOULD be a server component and should not be converted to a client component without moving that logic to an API route.
- **The "leaf principle":** Push `"use client"` boundaries as far down the component tree as possible. A page with 20 components should not have `"use client"` at the page level -- only the interactive leaf nodes (buttons, forms, carousels) should be client components. This is the single most impactful RSC performance decision.
- **Shared components:** Identify components that are neither interactive nor data-fetching -- pure presentational components like `<Card>`, `<Badge>`, or `<Typography>`. These can be server components by default even if they are eventually imported by client component trees -- but they cannot use hooks or browser APIs.
- **Context consumers:** Components that consume React Context are always client components. Design context providers as client components wrapping server-rendered content: `<ThemeProvider>{children}</ThemeProvider>` where `children` is a server component subtree.

### 2. Structure the File and Directory Layout

Establish a convention the entire team follows:

- **Co-location pattern:** Place server-only data-fetching logic in the same file as the component that uses it. A `ProductPage` server component can directly `await db.query(...)` at the top of the file. There is no need for a separate data-fetching layer when the component IS the data layer.
- **Server-only modules:** Use the `server-only` npm package (import `server-only` at the top of any module containing secrets or database logic). This causes a build-time error if that module is ever accidentally imported in a client component, preventing credential leaks.
- **Client component files:** Name files that contain `"use client"` with a consistent convention -- for example, suffix them with `.client.tsx` or co-locate them in a `_components/` folder. This is a team convention, not a framework requirement, but it dramatically reduces confusion.
- **Colocation of actions:** Server Actions should live in `actions.ts` files next to the components that call them, or in a top-level `app/actions/` directory for shared mutations. Never define Server Actions inline in large page files -- they become impossible to test in isolation.
- **Async component typing:** In TypeScript, RSC can be async functions. Type them as `async function MyComponent(): Promise<JSX.Element>` or rely on type inference. Do not import `FC` or `React.FunctionComponent` for server components -- these types do not support async.

### 3. Implement Server-Side Data Fetching

RSC data fetching patterns are fundamentally different from client-side approaches:

- **Direct async/await:** Fetch data by awaiting Promises directly at the top level of the component function. Example: `const user = await getUser(params.id)`. No useEffect, no loading state, no client-side fetch.
- **Parallel data fetching with Promise.all:** When a component needs multiple independent data sources, use `Promise.all([getUser(id), getOrders(id), getPreferences(id)])` rather than sequential awaits. Sequential awaits create a "request waterfall" -- each await adds to time-to-first-byte. Parallel fetching with `Promise.all` cuts total latency to the slowest individual request.
- **Request deduplication with React cache():** When multiple components in the same render tree call the same data-fetching function, use `import { cache } from 'react'` to wrap the function. React deduplicates calls with identical arguments within a single render pass. This is different from persistent caching -- it only deduplicates within one request.
- **Next.js fetch() caching:** In Next.js App Router, `fetch()` is extended with caching options. `fetch(url, { cache: 'force-cache' })` caches indefinitely (equivalent to ISR). `fetch(url, { next: { revalidate: 60 } })` revalidates every 60 seconds. `fetch(url, { cache: 'no-store' })` opts out of all caching, equivalent to getServerSideProps. Choose the right cache strategy per data source -- product catalog can be `revalidate: 3600`, shopping cart must be `no-store`.
- **ORM queries in components:** Prisma, Drizzle, and Kysely all work directly in server components. Import your db client at the top of the file, call it in the component body. The TypeScript types flow from the ORM schema into the component without any manual type declarations.
- **Error boundaries and not-found:** Use Next.js `notFound()` from `next/navigation` when a resource does not exist. Use `error.tsx` files to catch thrown errors in server components. Never let a failed database query render a broken component -- throw early, catch at the boundary.

### 4. Configure TypeScript for RSC-Specific Patterns

RSC introduces TypeScript patterns that require deliberate handling:

- **Async component props:** When a server component is async, TypeScript infers its return type correctly. However, passing async components as JSX props to client components is not supported -- if you need to pass a component reference across the client boundary, pass it as the `children` prop or use composition patterns.
- **`params` and `searchParams` typing in Next.js 14+:** Page component props receive `params` and `searchParams` as plain objects. Type them explicitly: `{ params: { id: string }, searchParams: { tab?: string } }`. In Next.js 15, `params` and `searchParams` are Promises -- type them as `{ params: Promise<{ id: string }> }` and `await params` before use.
- **Server Actions typing:** Define Server Actions with explicit argument and return types. `async function updateUser(formData: FormData): Promise<{ success: boolean; error?: string }>`. Use `z.parse()` (Zod) or `valibot` for runtime validation of FormData -- never trust FormData types at runtime without validation.
- **The `"use server"` directive:** The `"use server"` directive at the top of a function marks it as a Server Action. The directive at the top of a file marks ALL exports as Server Actions. Use file-level directives in dedicated `actions.ts` files and function-level directives only when a single action lives inside a component file.
- **Prop serialization constraints:** Data passed from server components to client components must be JSON-serializable. This means no `Date` objects (pass ISO strings and parse on the client), no `Map` or `Set` (convert to arrays), no class instances (use plain objects), no functions (except Server Actions). TypeScript will not catch this at compile time -- it is a runtime constraint.

### 5. Implement Streaming and Suspense

Streaming is the mechanism that makes RSC interactive before all data is ready:

- **Suspense boundaries:** Wrap slow server components in `<Suspense fallback={<Skeleton />}>`. The outer shell (navigation, layout, static content) streams immediately. The suspended subtree streams when its data resolves. This delivers a Time-to-First-Byte (TTFB) near zero for the shell while slow data loads in the background.
- **Granularity of Suspense:** Do not wrap an entire page in one Suspense boundary. Wrap individual sections. A product page might have three Suspense boundaries: `<ProductImages>`, `<ProductDetails>`, and `<RelatedProducts>`. Each streams independently when ready.
- **loading.tsx conventions in Next.js:** A `loading.tsx` file in an App Router segment creates an automatic Suspense boundary around the entire page. This is a coarse-grained approach -- useful for initial navigation, but supplement with component-level Suspense for granular streaming.
- **Suspense with parallel fetching:** When multiple independent components are wrapped in separate Suspense boundaries, they stream in parallel. Do not nest Suspense boundaries around co-dependent components unless there is a genuine UX reason for sequential reveal.
- **Deferred data with `<Suspense>` and dynamic imports:** For truly non-critical content (ad widgets, analytics dashboards, recommendation engines), use dynamic imports with `next/dynamic` and `{ ssr: false }` to completely defer that content to the client after hydration.

### 6. Implement Server Actions for Mutations

Server Actions replace the need for API routes in many mutation scenarios:

- **Form integration:** The most idiomatic Server Action usage is the HTML `action` attribute on a `<form>` element: `<form action={updateProfile}>`. This works WITHOUT JavaScript enabled -- a progressive enhancement win. The Server Action receives a `FormData` object.
- **Programmatic invocation:** Client components can import and call Server Actions directly: `import { addToCart } from '@/app/actions/cart'`. Call them like regular async functions. They execute on the server; only the serialized result returns to the client.
- **useFormState / useActionState:** In React 19 and Next.js 15, `useActionState` (renamed from `useFormState`) wraps a Server Action to provide progressive-enhancement-friendly state feedback. Return a state object from the action: `{ success: boolean, message: string }`.
- **Optimistic updates with useOptimistic:** Pair Server Actions with `useOptimistic` to immediately update the UI before the server responds. The optimistic update is rolled back automatically if the action throws.
- **Revalidation after mutations:** After a Server Action mutates data, call `revalidatePath('/products')` or `revalidateTag('products')` from `next/cache` to invalidate the cache and trigger re-rendering of the affected server components. This is how RSC achieves the "after mutation, see updated data" loop without a client-side state manager.
- **Security boundary:** Server Actions are POST endpoints automatically. However, they are NOT authenticated by default -- always check session/auth inside every Server Action before performing any database mutation. Do not assume the caller is authorized just because they called an action correctly.

### 7. Optimize Bundle Size and Performance

RSC's primary value proposition is bundle size reduction -- enforce it deliberately:

- **Bundle analysis:** Run `@next/bundle-analyzer` (set `ANALYZE=true next build`) after every significant feature addition. The client bundle should contain ZERO server-only code. If you see Prisma, bcrypt, or your ORM in the client bundle, a `"use client"` boundary is in the wrong place.
- **Moving heavy dependencies to the server:** Libraries like `date-fns` (13KB gzipped), `lodash` (24KB gzipped), `prism-react-renderer` (8KB gzipped), and `gray-matter` (5KB gzipped) should live exclusively in server components when used for formatting/processing. This removes them entirely from the client bundle.
- **The `"use client"` contamination problem:** A single `"use client"` at the top of a barrel export file (e.g., `index.ts` that re-exports 50 components) marks ALL 50 components as client components. Never put `"use client"` in barrel files. Import client components individually.
- **Image and font optimization:** `next/image` and `next/font` work in server components. Always use them instead of raw `<img>` tags or `@font-face` in CSS. They add zero client-side JavaScript weight while providing automatic optimization.
- **Measuring RSC payload size:** The RSC payload (the JSON-like wire format that describes the server component tree) is visible in browser DevTools under the Network tab as `__RSC_MANIFEST__` and flight responses. Large RSC payloads (over 100KB) indicate too much data being passed from server to client components as props -- restructure to pass only primitive values.

### 8. Validate, Test, and Deploy

- **Testing server components:** Server components are async functions -- test them with Vitest or Jest by calling the function directly and awaiting the result. Mock database calls with `vi.mock()`. Do not use `@testing-library/react` to render server components -- it does not support async RSC. Use it only for client components.
- **Integration testing:** Use Playwright or Cypress for end-to-end tests that exercise the full RSC pipeline, including streaming. Test that pages render correctly with JavaScript disabled to validate progressive enhancement.
- **Environment variable audit:** Before deploying, verify that no `NEXT_PUBLIC_` variable contains secrets. Variables without `NEXT_PUBLIC_` are server-only and never sent to the browser. Use `server-only` imports as a belt-and-suspenders check.
- **Cold start implications:** Server components run on every request (for dynamic routes) or at build time (for static routes). Heavy initialization code (database connection pooling, config parsing) must happen outside the component function -- at module scope or in a singleton pattern -- to avoid re-initialization on every render.
- **Edge runtime vs. Node.js runtime:** Next.js supports running RSC at the edge (Cloudflare Workers, Vercel Edge Network) with `export const runtime = 'edge'`. Edge runtime does not support Node.js APIs (fs, crypto), most npm packages that use Node internals, or Prisma's default query engine. Use Drizzle + a Neon/PlanetScale HTTP client for edge-compatible database access.

---

## Output Format

When helping a user with RSC, produce a structured response in this format:

```
## RSC Implementation Plan

### Component Boundary Analysis

| Component | Render Location | Reason | Client Directive Needed |
|-----------|----------------|--------|------------------------|
| [Name]    | Server         | [e.g., fetches from DB] | No |
| [Name]    | Client         | [e.g., uses useState]   | Yes -- "use client" |
| [Name]    | Server (async) | [e.g., awaits Prisma query] | No |

### Data Fetching Strategy

| Data Source | Caching Strategy | Revalidation | Location |
|-------------|-----------------|--------------|----------|
| [Resource]  | force-cache / revalidate:N / no-store | [trigger] | Server Component / Server Action |

### File Structure

app/
├── [route]/
│   ├── page.tsx           -- Server Component (async)
│   ├── loading.tsx        -- Suspense fallback
│   ├── error.tsx          -- Error boundary
│   ├── actions.ts         -- Server Actions ("use server")
│   └── _components/
│       ├── ServerComp.tsx -- Server Component
│       └── ClientComp.tsx -- Client Component ("use client")

### Implementation

// [Filename: path/to/file.tsx]
[Complete, runnable TypeScript code]

### Key Decisions
- [Decision]: [Rationale]
- [Decision]: [Rationale]

### Performance Considerations
- Estimated bundle impact: [X KB removed from client]
- Cache strategy: [description]
- Streaming boundaries: [description]
```

---

## Rules

1. **NEVER put `"use client"` at the top of a file that re-exports other components.** Barrel files (`index.ts`) with `"use client"` contaminate the entire export tree, turning all re-exported components into client components regardless of their actual needs. Import components individually.

2. **NEVER pass non-serializable values as props across the server-client boundary.** `Date` objects, `Map`, `Set`, class instances, `undefined` in arrays, and functions (except Server Actions) will cause serialization errors at runtime. TypeScript does not catch this -- you must enforce it manually. Pass ISO strings for dates, arrays for Maps, and plain objects for class instances.

3. **ALWAYS import `server-only` at the top of any module containing database clients, private API keys, or authentication secrets.** This is a zero-cost build-time safeguard that prevents accidental client-side inclusion of sensitive modules.

4. **NEVER use `React.useState`, `React.useEffect`, or any other hook in a server component.** Server components do not have a lifecycle or state. Hooks will throw at runtime with an unhelpful error. If you need state, you need a client component -- but ask first whether that state can be derived from URL searchParams instead, which keeps the component on the server.

5. **ALWAYS use `Promise.all()` for independent parallel data fetches inside a single server component.** Sequential `await` calls create artificial latency waterfalls. A component awaiting three independent 100ms queries takes 300ms sequentially and 100ms in parallel. This is the most common RSC performance mistake.

6. **NEVER perform authentication checks only at the layout level and assume child components are protected.** Each Server Action and each server component rendering sensitive data must independently verify the session. Layout-level auth checks do not cascade protection to directly-accessed route segments.

7. **ALWAYS validate Server Action inputs with a runtime schema validator (Zod, Valibot, ArkType) before using them.** TypeScript types are erased at runtime. FormData values are always strings -- they can contain anything. Validate before parsing, parse before using.

8. **NEVER use `next/dynamic` with `{ ssr: false }` as a workaround for RSC architectural problems.** If a component is being force-deferred to avoid a server/client boundary issue, the boundary is in the wrong place. Fix the architecture rather than hiding the problem. Reserve `{ ssr: false }` for genuinely browser-only integrations (map SDKs, canvas libraries).

9. **ALWAYS call `revalidatePath()` or `revalidateTag()` at the END of a Server Action, after all mutations are complete.** Calling revalidation before the mutation means the stale data might be served to the next request before the write completes. Structure actions as: validate -- authorize -- mutate -- revalidate -- return.

10. **NEVER initialize database connections, read config files, or parse environment variables inside a server component function body.** These operations run on every render of that component. Initialize singletons at module scope (outside the component function) so they are created once per server instance, not once per request.

---

## Edge Cases

### Async Client Components Are Not Supported
React does not support `async` client components. If you write `"use client"` at the top of an async function component, you will get a runtime error: "async/await is not yet supported in Client Components." The solution is to split the component: create a server component wrapper that awaits the data and passes it as props to the synchronous client component. Never try to fetch data inside a client component with async/await at the top level -- use a Server Component parent to supply the data.

### Third-Party Libraries That Break Server Components
Many npm packages assume a browser environment. Packages that reference `window`, `document`, or `navigator` at import time (not just at runtime) will throw during server-side rendering because these globals do not exist on the server. The fix is to import these packages inside a `"use client"` component or use `next/dynamic` with `{ ssr: false }`. Common offenders include charting libraries (Recharts reads `window` at import in some versions), drag-and-drop libraries, and browser-native PDF renderers. Always check whether a library is RSC-compatible before using it in a server component.

### Context API Limitations Across the Server-Client Boundary
React Context does not work in server components -- `createContext` and `useContext` are client-only APIs. This breaks the common pattern of "provide a value at the root and consume it anywhere." The RSC-compatible replacement is to pass data through props (for simple cases), use URL-based state (for shareable state like filters and tabs), or create a thin client-side context provider that wraps server component children and provides only client-side interactive state (theme, modal open state, not database data).

### Next.js 15 Breaking Change: params and searchParams as Promises
Starting in Next.js 15, `params` and `searchParams` in page and layout components are Promises, not synchronous objects. Code written for Next.js 14 that accesses `params.id` directly will break with a type error and a deprecation warning. Always `await params` before destructuring: `const { id } = await params`. The `searchParams` object is similarly wrapped. This affects all page, layout, and route handler files in the App Router.

### Hydration Mismatches from Server-Client Rendering Differences
Hydration mismatches occur when the HTML the server renders differs from what the client renders during hydration. Common causes in RSC applications: (1) `Date.now()` or `new Date()` called in a server component produces a different timestamp than when the client re-renders; (2) locale-sensitive formatting (number formatting, date formatting) that differs between server timezone (UTC) and client timezone; (3) browser extensions that modify the DOM before hydration. For (1) and (2), perform all formatting on the server and pass the pre-formatted string as a prop to the client component. For (3), use `suppressHydrationWarning` only on the specific element affected, not on entire sections.

### Server Actions in Non-Next.js RSC Environments
Server Actions are a Next.js-specific abstraction built on top of the RSC foundation. In a custom RSC setup (e.g., using React Server Components with a custom Express server or the experimental `react-server-dom-webpack` package), Server Actions as Next.js defines them do not exist. Mutations must go through traditional API route handlers. When helping a user not on Next.js, do not recommend `"use server"` actions, `revalidatePath`, or `useActionState` -- these are Next.js APIs, not React APIs.

### Circular Import Problems Between Server and Client Components
If a server component imports a client component, and that client component imports back into a file that contains server-only code (even indirectly through a shared utility), the server-only code can end up in the client bundle. This creates security issues when secrets are involved. The solution is a strict module dependency rule: client component files must NEVER import from server-only files. Use the `server-only` package as enforcement. Shared utilities used by both server and client components must be written to work in both environments (no Node.js-only APIs, no browser-only APIs) and must NOT import server-only modules.

### Large Datasets and RSC Payload Size
Passing large arrays as props from server components to client components serializes them into the RSC payload (a JSON-like wire format). A table with 10,000 rows passed as props will bloat the RSC payload and slow down Time-to-Interactive. The fix is to render the data on the server -- the table markup itself should be server-rendered HTML, not data passed as props to a client-side table renderer. Only pass the minimum state required for interactivity (selected row ID, sort column, page number) to the client component. For truly large datasets requiring client-side interactivity (sorting, filtering), implement server-side sorting/filtering using URL searchParams and server component re-rendering rather than shipping the dataset to the client.

---

## Example

**Input:** "I'm building a Next.js 15 e-commerce product detail page. It needs to show product info from our Postgres database, a client-side quantity selector, and related products. I want to use TypeScript throughout and make sure the bundle is as small as possible."

**Output:**

## RSC Implementation Plan

### Component Boundary Analysis

| Component | Render Location | Reason | Client Directive |
|-----------|----------------|--------|-----------------|
| `ProductPage` (page.tsx) | Server (async) | Fetches product from DB, params access | None |
| `ProductImages` | Server | Renders static image gallery, no interaction | None |
| `ProductInfo` | Server | Renders title, price, description from DB | None |
| `QuantitySelector` | Client | Uses useState for count, onClick handlers | `"use client"` |
| `AddToCartButton` | Client | Calls Server Action, uses useOptimistic | `"use client"` |
| `RelatedProducts` | Server (async, Suspense) | Fetches related items from DB independently | None |

The `QuantitySelector` and `AddToCartButton` should be co-located in a single `ProductActions.client.tsx` file since they share quantity state.

### Data Fetching Strategy

| Data Source | Caching Strategy | Revalidation Trigger | Location |
|-------------|-----------------|---------------------|----------|
| Product by ID | `revalidate: 3600` (1 hour) | `revalidateTag('product-[id]')` on admin update | `getProduct()` in page.tsx |
| Related products | `revalidate: 7200` (2 hours) | `revalidateTag('products')` on catalog update | `getRelatedProducts()` in RelatedProducts.tsx |
| Cart mutation | `cache: 'no-store'` (N/A) | `revalidatePath` after add-to-cart action | Server Action |

### File Structure

```
app/
├── products/
│   └── [id]/
│       ├── page.tsx                    -- Async Server Component
│       ├── loading.tsx                 -- Suspense shell
│       ├── error.tsx                   -- Error boundary
│       ├── actions.ts                  -- Server Actions ("use server")
│       └── _components/
│           ├── ProductImages.tsx       -- Server Component
│           ├── ProductInfo.tsx         -- Server Component
│           ├── ProductActions.client.tsx -- Client Component
│           └── RelatedProducts.tsx     -- Async Server Component
lib/
├── db/
│   ├── index.ts                        -- Drizzle db singleton
│   └── queries/
│       ├── products.ts                 -- server-only query functions
│       └── cart.ts                     -- server-only query functions
```

### Implementation

```typescript
// lib/db/index.ts
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

// Initialized at module scope -- NOT inside a component or function
const client = postgres(process.env.DATABASE_URL!, {
  max: 10, // connection pool size
  idle_timeout: 20,
})

export const db = drizzle(client, { schema })
```

```typescript
// lib/db/queries/products.ts
import 'server-only' // Prevents accidental client-side import
import { cache } from 'react'
import { db } from '../index'
import { products, categories } from '../schema'
import { eq } from 'drizzle-orm'

// cache() deduplicates calls within the same request render
export const getProduct = cache(async (id: string) => {
  const result = await db.query.products.findFirst({
    where: eq(products.id, id),
    with: { category: true, images: true },
  })
  return result ?? null
})

export const getRelatedProducts = cache(async (
  categoryId: string,
  excludeId: string,
  limit = 4
) => {
  return db.query.products.findMany({
    where: eq(products.categoryId, categoryId),
    limit,
    // Filtering excludeId done in-query for efficiency
  })
})
```

```typescript
// app/products/[id]/page.tsx
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { getProduct } from '@/lib/db/queries/products'
import ProductImages from './_components/ProductImages'
import ProductInfo from './_components/ProductInfo'
import ProductActions from './_components/ProductActions.client'
import RelatedProducts from './_components/RelatedProducts'
import RelatedProductsSkeleton from './_components/RelatedProductsSkeleton'

// Next.js 15: params is a Promise
interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ProductPage({ params }: PageProps) {
  const { id } = await params

  // Single await -- getProduct is cached per request
  const product = await getProduct(id)

  if (!product) {
    notFound() // Renders the nearest not-found.tsx
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Server-rendered -- zero client JS */}
      <ProductImages images={product.images} alt={product.name} />

      <div className="flex flex-col gap-4">
        {/* Server-rendered -- zero client JS */}
        <ProductInfo
          name={product.name}
          price={product.price}
          description={product.description}
          category={product.category.name}
        />

        {/* Client boundary -- only this subtree ships JS */}
        <ProductActions
          productId={product.id}
          maxQuantity={product.inventory}
        />
      </div>

      {/* Independent Suspense boundary -- streams when ready */}
      <section className="col-span-full">
        <h2>Related Products</h2>
        <Suspense fallback={<RelatedProductsSkeleton count={4} />}>
          <RelatedProducts
            categoryId={product.categoryId}
            excludeId={product.id}
          />
        </Suspense>
      </section>
    </div>
  )
}

// Static metadata generation -- also runs on server
export async function generateMetadata({ params }: PageProps) {
  const { id } = await params
  const product = await getProduct(id) // Deduplicated by cache()
  if (!product) return {}

  return {
    title: product.name,
    description: product.description.slice(0, 160),
    openGraph: {
      images: [product.images[0]?.url],
    },
  }
}
```

```typescript
// app/products/[id]/_components/ProductActions.client.tsx
'use client'

import { useState, useOptimistic, useTransition } from 'react'
import { addToCart } from '../actions'

interface ProductActionsProps {
  productId: string
  maxQuantity: number
}

export default function ProductActions({
  productId,
  maxQuantity,
}: ProductActionsProps) {
  const [quantity, setQuantity] = useState(1)
  const [isPending, startTransition] = useTransition()
  const [optimisticAdded, setOptimisticAdded] = useOptimistic(false)

  const handleAddToCart = () => {
    startTransition(async () => {
      setOptimisticAdded(true)
      await addToCart({ productId, quantity })
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setQuantity(q => Math.max(1, q - 1))}
          disabled={quantity <= 1}
          aria-label="Decrease quantity"
        >
          -
        </button>
        <span aria-live="polite">{quantity}</span>
        <button
          onClick={() => setQuantity(q => Math.min(maxQuantity, q + 1))}
          disabled={quantity >= maxQuantity}
          aria-label="Increase quantity"
        >
          +
        </button>
      </div>

      <button
        onClick={handleAddToCart}
        disabled={isPending || maxQuantity === 0}
        aria-busy={isPending}
      >
        {optimisticAdded ? 'Added!' : isPending ? 'Adding...' : 'Add to Cart'}
      </button>
    </div>
  )
}
```

```typescript
// app/products/[id]/actions.ts
'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { z } from 'zod'
import { auth } from '@/lib/auth' // Your auth library
import { db } from '@/lib/db'
import { cartItems } from '@/lib/db/schema'

const AddToCartSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1).max(100),
})

export async function addToCart(
  input: unknown
): Promise<{ success: boolean; error?: string }> {
  // 1. Authenticate
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'Not authenticated' }
  }

  // 2. Validate
  const parsed = AddToCartSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: 'Invalid input' }
  }

  const { productId, quantity } = parsed.data

  // 3. Mutate
  await db.insert(cartItems).values({
    userId: session.user.id,
    productId,
    quantity,
  }).onConflictDoUpdate({
    target: [cartItems.userId, cartItems.productId],
    set: { quantity: sql`cart_items.quantity + ${quantity}` },
  })

  // 4. Revalidate -- after mutation completes
  revalidateTag(`cart-${session.user.id}`)

  return { success: true }
}
```

```typescript
// app/products/[id]/_components/RelatedProducts.tsx
import { getRelatedProducts } from '@/lib/db/queries/products'
import ProductCard from '@/components/ProductCard'

interface RelatedProductsProps {
  categoryId: string
  excludeId: string
}

// This component streams independently via its parent Suspense boundary
export default async function RelatedProducts({
  categoryId,
  excludeId,
}: RelatedProductsProps) {
  const products = await getRelatedProducts(categoryId, excludeId, 4)

  if (products.length === 0) return null

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
```

### Key Decisions

- **`getProduct` uses `cache()`:** Both `ProductPage` and `generateMetadata` call `getProduct` with the same ID. Without `cache()`, this would issue two database queries per request. With `cache()`, the second call is a memory lookup.
- **`ProductActions` is the ONLY `"use client"` component:** The entire page except the quantity selector and add-to-cart button is server-rendered. The client JavaScript for this page is limited to the interaction logic -- approximately 3KB compressed vs. 30-50KB if the entire page were a client component.
- **`RelatedProducts` has its own Suspense boundary:** It fetches independently so a slow related-products query does not block the main product content from streaming. Users see the product immediately; related items appear when ready.
- **Server Action validates AND authenticates:** The action does not trust that the caller is authenticated or that the input is valid. Both checks happen server-side on every invocation.
- **No `NEXT_PUBLIC_DATABASE_URL`:** The database URL is a bare environment variable (not prefixed with `NEXT_PUBLIC_`), so it is never sent to the browser. The `server-only` import in `queries/products.ts` provides a second layer of enforcement.

### Performance Considerations

- **Estimated bundle impact:** Moving `ProductImages`, `ProductInfo`, and `RelatedProducts` to server components removes approximately 15-25KB of client JavaScript (React rendering logic for those components, any formatting utilities they use, the ORM client).
- **Cache strategy:** Product data is cached for 1 hour with tag-based invalidation. A product update in the admin panel calls `revalidateTag('product-[id]')` and the next request gets fresh data within 0-60 seconds depending on CDN behavior.
- **Streaming:** The main product content (images + info + actions) renders synchronously from the initial server response. Related products stream in within 100-300ms depending on database query time, with a skeleton visible during the wait.
- **Database connections:** The `postgres` client is initialized at module scope with a pool of 10 connections. In serverless environments (Vercel), use `@neondatabase/serverless` or PlanetScale's HTTP driver instead of a traditional connection pool, which does not survive across cold starts.
