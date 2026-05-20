---
name: react-performance-patterns
description: |
  Guides expert-level react performance patterns implementation: javascript and typescript decision frameworks, production-ready patterns, and concrete templates for react performance patterns workflows.
  Use when the user asks about react performance patterns, react performance patterns configuration, or javascript best practices for react projects.
  Do NOT use when the user needs a different web development capability -- check sibling skills in the web development subcategory.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "javascript typescript optimization frontend"
  category: "web-development"
  subcategory: "web-development"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# React Performance Patterns

## When to Use

**Use this skill when:**
- A user asks how to reduce re-renders, improve Time to Interactive (TTI), or lower Cumulative Layout Shift (CLS) in a React application
- A user reports sluggish UI behavior: dropped frames, janky scrolling, slow list rendering, or laggy form inputs
- A user wants to audit and improve Lighthouse scores or Core Web Vitals for a React SPA or SSR app
- A user is implementing a feature that requires memoization, virtualization, lazy loading, or code splitting decisions
- A user asks specifically about React hooks like `useMemo`, `useCallback`, `useTransition`, `useDeferredValue`, or `memo()` and when to apply them
- A user is building high-traffic, data-intensive UIs such as dashboards, infinite scroll feeds, data grids, or real-time update panels
- A user wants to profile a React app with DevTools and interpret flame graphs or component render timelines

**Do NOT use this skill when:**
- The user needs help with React state management architecture -- check the state management skill in the web-development subcategory
- The user is asking about server-side rendering or streaming SSR strategy -- check the Next.js or SSR-specific skill
- The user needs CSS or animation performance (GPU compositing, will-change, GSAP) -- check the CSS performance skill
- The user is asking about bundler optimization (Webpack chunk splitting, tree shaking configuration) -- check the build tooling skill
- The user needs help with API latency, caching strategy, or database query performance -- those are backend concerns
- The user is asking about React Native performance -- that has a distinct set of patterns (bridge, Hermes, Fabric) handled separately
- The user needs general JavaScript performance advice not specific to React's rendering model

---

## Process

### 1. Profile First -- Establish a Measurable Baseline

Never apply optimization patterns without profiling data. Guessing causes wasted effort and unnecessary complexity.

- Open Chrome DevTools, navigate to the **Performance** tab, and record a 3--5 second interaction session. Look for frames that exceed 16.7ms (60fps budget) or 10ms (90fps/120fps budget).
- Use the **React DevTools Profiler** (available as a browser extension or embedded in CRA/Vite dev builds). Record interactions, then inspect the flame graph for components with high "render duration" bars -- anything above 5ms for a single component in an interaction path is a candidate.
- Check the **"Why did this render?"** panel in React DevTools Profiler to identify which props or state changes triggered unnecessary renders.
- Measure Core Web Vitals using `web-vitals` library: `getLCP()`, `getFID()` (or `getINP()` in newer spec), `getCLS()`. Establish pre-optimization numbers. Target LCP < 2.5s, INP < 200ms, CLS < 0.1.
- Run `npx react-scan` or integrate `why-did-you-render` library in development to get automatic console warnings when components re-render with identical props.
- Capture a memory profile using the Chrome **Memory** tab. Take a heap snapshot before and after a user workflow to detect component leaks from uncleared subscriptions or stale closures.

### 2. Categorize the Performance Problem

Different symptoms require different pattern families. Identify which category applies before selecting a solution.

- **Unnecessary re-renders**: Child components re-render when parent state changes but props are unchanged. Pattern family: memoization (`memo`, `useMemo`, `useCallback`), state colocation, context splitting.
- **Expensive computations on the render thread**: Sorting, filtering, or transforming large datasets inside render. Pattern family: `useMemo`, web workers via `useWorker`, or moving computation to a server action.
- **Large lists or grids causing layout thrash**: Rendering thousands of DOM nodes simultaneously. Pattern family: windowing/virtualization (`react-window`, `react-virtual`, TanStack Virtual).
- **Slow initial load / large JS bundles**: High TTI due to loading all component code upfront. Pattern family: `React.lazy`, `Suspense`, route-based code splitting.
- **Blocking renders on low-priority updates**: Search input, filter controls, or typing that triggers heavy downstream computation. Pattern family: `useTransition`, `useDeferredValue`, debouncing.
- **Context causing global re-renders**: A single context value update re-renders every consumer regardless of which field changed. Pattern family: context splitting, selector hooks, Zustand/Jotai atoms.
- **Animation jank or layout-triggered reflows**: Reads and writes to the DOM interleaved in effects. Pattern family: `useLayoutEffect`, batched DOM mutations, CSS-only transitions.

### 3. Apply Memoization Patterns Correctly

Memoization is the most commonly misused React optimization. Apply it only where profiling confirms benefit.

- Use `React.memo(Component)` to wrap a child component when: (a) it renders frequently, (b) its props are stable between parent re-renders, and (c) its render cost is non-trivial (>1ms). Do NOT wrap every component -- the comparison overhead itself has cost.
- Provide a custom comparator to `React.memo` when props contain arrays or objects that are structurally equal but referentially different: `React.memo(Component, (prev, next) => prev.items.length === next.items.length && prev.selectedId === next.selectedId)`. Shallow comparison is the default and fails for nested objects.
- Use `useMemo` for derived data that is expensive to compute: `const sorted = useMemo(() => [...items].sort(compareFn), [items, sortKey])`. The dependency array must be exhaustive. Missing a dependency causes stale data bugs; adding extra dependencies defeats the purpose.
- Use `useCallback` when passing callbacks as props to `memo`-wrapped children or into dependency arrays of other hooks. Without `useCallback`, a new function reference is created every render, breaking memo. Example: `const handleClick = useCallback(() => dispatch({ type: 'SELECT', id }), [dispatch, id])`.
- Avoid `useMemo` for cheap computations (string formatting, simple arithmetic, array access). The overhead of tracking dependencies and comparing values exceeds the cost of recomputing.
- Stabilize context values with `useMemo` to prevent all consumers from re-rendering when the provider's parent re-renders: `const value = useMemo(() => ({ user, logout }), [user, logout])`.

### 4. Implement Virtualization for Long Lists

Rendering thousands of DOM nodes is one of the highest-impact performance problems in data-heavy React apps.

- Use **TanStack Virtual** (formerly `react-virtual`) for maximum flexibility. It supports variable item sizes, horizontal lists, grid layouts, and integrates with any scrollable container. Use `useVirtualizer` hook: `const virtualizer = useVirtualizer({ count: items.length, getScrollElement: () => parentRef.current, estimateSize: () => 48 })`.
- Use **react-window** for simpler fixed-size lists. `FixedSizeList` and `FixedSizeGrid` have minimal bundle size and excellent performance for homogeneous data. Choose `VariableSizeList` when item heights differ (chat messages, expandable rows) but supply an accurate `itemSize` function -- inaccurate estimates cause scroll position drift.
- Always define `itemKey` prop using a stable unique identifier from your data (e.g., record ID), not the array index. Using index as key causes React to remount items during list reorder operations.
- Memoize the row renderer component with `React.memo` and `useCallback` for the click handlers passed into it. Each visible item re-renders independently when list state changes; without memoization, every visible row re-renders on any interaction.
- Set `overscan` to 3--5 items beyond the visible viewport to prevent flashing empty rows during fast scrolling. Higher values consume more memory; lower values increase blank-row flicker.
- For infinite scroll, combine virtualization with intersection observer or the `onScroll` prop. Load the next page when the last rendered item is within 200px of the list bottom. Use TanStack Query's `useInfiniteQuery` for declarative pagination management.

### 5. Apply Code Splitting and Lazy Loading

Reduce initial bundle size to improve TTI and LCP.

- Split at the route level first. This is the highest ROI split because users only need the code for the current route. With React Router: wrap each route's component in `React.lazy(() => import('./pages/Dashboard'))` and wrap the `<Routes>` block in `<Suspense fallback={<PageSkeleton />}>`.
- Split heavy third-party dependencies that are only used in specific features: rich text editors (Tiptap, Quill), chart libraries (Recharts, Chart.js), PDF renderers, map SDKs. Dynamic import them inside the component that needs them or in a custom hook.
- Use `React.lazy` with a retry wrapper for resilience against network failures during chunk loading:
  ```ts
  const lazyWithRetry = (factory: () => Promise<{ default: ComponentType }>) =>
    lazy(() =>
      factory().catch(() => new Promise(resolve => setTimeout(() => resolve(factory()), 1500)))
    );
  ```
- Prefetch routes the user is likely to navigate to next. On hover of a nav link, trigger `import('./pages/Settings')` to warm the browser cache before the click. This makes navigations feel instant.
- Analyze your bundle with `vite-bundle-visualizer` (Vite) or `webpack-bundle-analyzer` (Webpack/CRA). Look for unintended inclusions: moment.js locale files, lodash pulling in the full library, duplicate versions of React.
- Set a budget: keep the initial JS bundle (first paint) below 150KB gzipped for most apps. Dashboard/admin tools may tolerate 200KB. Anything above 300KB gzipped initial JS requires investigation.

### 6. Manage State and Context for Minimal Re-Renders

Poor state placement and context misuse are the most common causes of pervasive re-render problems.

- **Colocate state**: Move state as close as possible to the components that use it. State in a top-level component re-renders the entire tree on each update. State in a leaf component only re-renders that subtree.
- **Split contexts by update frequency**: Separate high-frequency data (mouse position, scroll offset, live data feed) from low-frequency data (user profile, theme, feature flags). Each context update re-renders all consumers, so mixing fast and slow data in one context causes expensive global re-renders.
- **Use selectors**: With Zustand, use selector functions to subscribe only to the slice of state a component needs: `const count = useStore(state => state.count)`. With Redux Toolkit, use `createSelector` from Reselect to memoize derived state selectors -- the selector only recomputes when its input selectors change.
- **Avoid storing derived state**: If `filteredItems` can be computed from `items` and `filterQuery`, do not store `filteredItems` in state. Compute it with `useMemo`. Storing derived state creates synchronization bugs and unnecessary state update cycles.
- **Batch state updates**: React 18 automatically batches state updates in event handlers and async operations (automatic batching). In rare cases where you need manual control outside React, use `flushSync` from `react-dom` to force synchronous updates for DOM measurement.

### 7. Leverage React 18 Concurrent Features

React 18's concurrent rendering model enables new performance patterns unavailable in React 17 and below.

- **`useTransition`**: Wrap state updates that trigger expensive renders in `startTransition`. React will process the transition update at lower priority, keeping the UI responsive to urgent interactions (typing, button clicks) during the update. Use this for search/filter operations, tab switching with heavy content, and pagination. Example: `const [isPending, startTransition] = useTransition(); startTransition(() => setQuery(value))`. Render a spinner or skeleton using the `isPending` boolean.
- **`useDeferredValue`**: When you receive a prop you cannot wrap in `startTransition` (e.g., from a parent), defer it: `const deferredQuery = useDeferredValue(query)`. The component renders first with the old value, then re-renders with the new value when the main thread is idle. Combine with `memo` on the expensive child component to ensure only the deferred re-render triggers it.
- **Selective hydration**: In SSR apps with `renderToPipeableStream`, React 18 selectively hydrates based on user interaction. Components wrapped in `Suspense` hydrate lazily. This means users can interact with parts of the page before the full app is hydrated.
- **`use` hook** (React 19 / experimental): Integrate with Suspense for data fetching by passing a Promise to `use()`. This replaces the pattern of manually managing loading/error state in effects and enables Suspense-based data loading.

### 8. Validate, Monitor, and Document

Optimization work is only complete when it is measured, monitored, and documented.

- Re-run the React DevTools Profiler after applying each change. Confirm render counts and durations have decreased. A pattern that does not show measurable improvement in the profiler should be reconsidered.
- Add `web-vitals` reporting to your analytics pipeline (Datadog RUM, Sentry Performance, or custom endpoint). Track LCP, INP, and CLS in production by percentile (p75 is the Google standard for Core Web Vitals pass/fail thresholds).
- Set up performance budgets in CI. Use `bundlesize` or Vite's `build.rollupOptions.output.manualChunks` with a size check step. Fail the build if a chunk exceeds the agreed limit.
- Document each optimization with a comment explaining the profiling result that motivated it: `// useMemo applied here: sorting 10k items took 23ms without it (profiled 2024-03). Re-evaluate if dataset size changes.`
- Run Lighthouse in CI using `lighthouse-ci`. Set minimum scores: Performance > 85, LCP < 2.5s in lab conditions.

---

## Output Format

When responding to a user's React performance question, structure the response as follows:

```
## Performance Diagnosis: [Feature/Component Name]

### Problem Category
[One of: Unnecessary Re-renders | Expensive Computation | Large List Rendering |
Slow Initial Load | Blocking UI Updates | Context Over-broadcast | Memory Leak]

### Profiling Steps to Confirm
1. [Specific DevTools step]
2. [Specific metric to look for]
3. [Threshold that confirms the issue]

### Recommended Pattern
**Pattern:** [Pattern name, e.g., React.memo + useCallback, Virtualization, useTransition]
**When to apply:** [Specific condition that justifies this pattern]
**Trade-off:** [Maintenance cost or complexity added]

### Implementation

[TypeScript code example -- complete, runnable, with comments explaining the why]

### Before / After Metrics (Target)
| Metric             | Before       | Target After   |
|--------------------|--------------|----------------|
| Render time (ms)   | [X ms]       | [< Y ms]       |
| Re-renders/action  | [N]          | [1]            |
| Bundle size (KB gz)| [X KB]       | [< Y KB]       |
| LCP                | [X s]        | [< 2.5 s]      |
| INP                | [X ms]       | [< 200 ms]     |

### Verification Checklist
- [ ] React DevTools Profiler confirms reduced render duration
- [ ] why-did-you-render shows no spurious re-renders
- [ ] Bundle analyzer confirms chunk size target met
- [ ] web-vitals metrics within threshold in staging
- [ ] No new memory leaks in heap snapshot comparison
```

---

## Rules

1. **NEVER recommend memoization without profiling evidence.** Wrapping every component in `memo` is an anti-pattern. The comparison function itself costs CPU time. Only memoize components whose render duration is measurable and whose props are provably stable.

2. **ALWAYS check the React version before recommending patterns.** `useTransition` and `useDeferredValue` require React 18+. `use()` requires React 19 or experimental channel. `createRoot` is required for concurrent features -- legacy `ReactDOM.render` disables them entirely.

3. **NEVER use array index as a list `key` for mutable lists.** Index keys cause React to reuse DOM nodes incorrectly during reorders, insertions, or deletions, producing visual glitches and incorrect component state. Use stable record IDs from your data source.

4. **ALWAYS place `useCallback` and `useMemo` dependencies exhaustively.** The `react-hooks/exhaustive-deps` ESLint rule enforces this. Suppressing it with `// eslint-disable` is almost always a bug introducing stale closure behavior.

5. **NEVER split context purely to avoid re-renders without first trying state colocation.** Context splitting adds API surface area and coupling. Often, moving state down the tree eliminates the need for context entirely.

6. **ALWAYS use `startTransition` rather than `setTimeout(setState, 0)` for deferring updates in React 18.** The `setTimeout` pattern bypasses React's scheduler and causes visual tearing. `startTransition` integrates with the concurrent renderer to maintain a consistent UI during deferred work.

7. **NEVER virtualize lists with fewer than 100 items.** The overhead of virtualizer setup, scroll event handling, and absolute positioning exceeds the cost of rendering 50--100 simple list items. Virtualization becomes net-positive at roughly 100--200 items, and critical above 500.

8. **ALWAYS memoize the row renderer component when using react-window or TanStack Virtual.** Without `React.memo` on the row component, every scroll event triggers a re-render of all visible rows because the virtualizer recalculates positions and creates new array slices.

9. **NEVER store server data in `useState` when using a data-fetching library.** Using React Query, SWR, or Apollo alongside manual `useState` for server data creates synchronization bugs and double-fetching. Trust the library's cache as the source of truth.

10. **ALWAYS measure the impact of code splitting on user experience, not just bundle size.** A split that saves 50KB but adds a 300ms loading spinner on every navigation may be worse than serving the code upfront. Use prefetching to make lazy routes feel instant.

11. **NEVER use `useLayoutEffect` for data fetching or async operations.** `useLayoutEffect` runs synchronously before the browser paints, blocking the visual update. It is only appropriate for reading DOM measurements (element dimensions, scroll position) that must be applied before the next paint to avoid flicker.

12. **ALWAYS verify that Strict Mode double-invoke behavior is not causing false performance alarms.** In React 18 Strict Mode (development only), effects run twice to detect side effect bugs. A component that appears to render or fetch twice in development may be perfectly optimized in production.

---

## Edge Cases

### Legacy Class Component Codebase
When optimizing a codebase with significant class component usage alongside hooks, avoid mixing `PureComponent` (class-level memoization) with `React.memo` (function component memoization) in the same component tree without understanding how they interact. `PureComponent` does a shallow comparison of both props and state; `React.memo` only compares props. If converting class components to function components incrementally, verify that `shouldComponentUpdate` logic is accurately replicated in either a `memo` comparator or through proper state colocation before removing the class. Do not assume `PureComponent` and `React.memo(Component)` are interchangeable -- they have different APIs and comparison semantics.

### Third-Party Components That Ignore Memoization
Some third-party UI library components (form libraries, charting components, drag-and-drop containers) call internal callbacks on every render, passing new function references that break memoization on your components. Diagnose this by wrapping the third-party component and logging its render count. Solutions include: creating a stable adapter wrapper component that absorbs the library's instability, using `useRef` to store callbacks that need to be stable but access current values, or filing an issue with the library maintainer. Do not blindly add `useMemo`/`useCallback` throughout your codebase to compensate -- fix the instability at the source.

### Real-Time Data Streams (WebSocket, SSE)
Applications receiving data at high frequency (>10 updates/second) can overwhelm React's rendering pipeline even with correct memoization. Apply a throttling or batching layer between the data stream and React state. Use a ref to accumulate incoming updates, then commit them to state at a controlled rate (e.g., 60ms batches using `requestAnimationFrame` or `setInterval`). With React 18, `startTransition` can deprioritize real-time updates so urgent interactions remain responsive, but the update rate must still be controlled upstream -- `startTransition` does not throttle incoming data, it only controls render scheduling priority. Monitor heap usage closely; high-frequency state updates that create new object references cause significant GC pressure.

### SSR Hydration Mismatches Causing Layout Shift
When React hydrates server-rendered HTML, any mismatch between server and client renders triggers a full client-side re-render of the subtree, defeating SSR performance benefits and causing CLS. Common causes: rendering `Date.now()`, `window.innerWidth`, `Math.random()`, or `localStorage` during render. Fix by moving dynamic values into `useEffect` (runs only client-side) and rendering a static placeholder on first render. With Next.js App Router, `use client` components that access browser APIs must be wrapped in `dynamic()` with `{ ssr: false }` to prevent the server from attempting to render them.

### Context with Frequent Updates Across a Large Component Tree
When a context value updates at high frequency (e.g., a cursor position, scroll offset, or live price feed) and has many consumers scattered across a large tree, the performance impact can be severe enough to make the entire UI unresponsive. Options in order of preference: (1) Remove the data from context entirely and use a global observable/store with per-component subscriptions (Zustand, Jotai, or a custom `useSyncExternalStore` implementation). (2) Use a context ref pattern: store the value in a ref instead of state, and notify subscribers manually using an event emitter. This bypasses React's rendering entirely for read-only consumers. (3) As a last resort, use `use-context-selector` to add selector-based subscriptions to React context -- only components whose selected slice changes will re-render.

### Memory Leaks from Stale Closures in Long-Running Components
Dashboard pages or single-page apps that remain mounted for extended sessions accumulate memory from effects that are not cleaned up. Common leak patterns: `setInterval` or `setTimeout` not cleared in the effect cleanup return, event listeners added to `window` or `document` not removed, WebSocket connections not closed, ResizeObserver not disconnected. Diagnose with Chrome Memory tab: take a heap snapshot, perform a workflow, force GC, take another snapshot, compare the delta for retained component instances. Fix by returning a cleanup function from every `useEffect` that creates a persistent resource: `useEffect(() => { const id = setInterval(fetch, 5000); return () => clearInterval(id); }, [fetch])`.

### Bundle Splitting Causing Waterfall Fetches
Aggressive code splitting can create a "render-then-fetch" waterfall where a split component loads, renders, discovers it needs data, and then fetches -- sequentially. This can make a split route feel slower than the unsplit version despite smaller bundle size. Diagnose by examining the Network tab waterfall: if data requests start only after the JS chunk completes loading, you have a waterfall. Fix with route-level data loaders (React Router 6.4+ loaders, Next.js `getServerSideProps` / RSC), which initiate data fetching in parallel with component code loading. Alternatively, prefetch both the chunk and the API response on navigation intent (hover/focus on the link).

### Strict Mode and Development-Only Performance Issues
React's `<StrictMode>` wrapper in development mode deliberately double-invokes component functions and effects to surface bugs. This means profiling in development will show every component rendering twice. NEVER profile for performance in development mode -- always profile in production builds or at minimum in production mode (`npm run build && npx serve dist`). The React DevTools Profiler is the exception: it works on production builds if you include profiling builds (`react-dom/profiling`). When users report performance issues only in development, the most likely cause is Strict Mode double-invocation, not a real production problem.

---

## Example

**Input:** "Our product catalog page has become really slow. We have 2,000 products displayed in a grid with filters and search. The search input lags when typing, and scrolling is janky. We're on React 18 with TypeScript."

---

### Performance Diagnosis: Product Catalog Page

**Problem Category:** Multiple overlapping issues -- Large List Rendering + Blocking UI Updates + Unnecessary Re-renders

### Profiling Steps to Confirm

1. Open React DevTools Profiler, start recording, then type a character into the search input. Look for render bars wider than 16.7ms on the grid container and individual product cards.
2. In the Performance tab, record a scroll interaction. Check for frames exceeding the 16.7ms budget (red frames). Look for "Recalculate Style" and "Layout" events that take >5ms -- these indicate 2,000 DOM nodes causing layout thrash.
3. Enable "Record why each component rendered" in React DevTools. Confirm that all 2,000 ProductCard components show "props changed" on every keystroke -- this confirms the re-render problem.
4. Check bundle size: `npx vite-bundle-visualizer` or open the Network tab on initial load. If the catalog page includes all 2,000 product images eagerly, that explains LCP issues.

### Recommended Patterns (Three Applied Together)

---

**Pattern 1: `useTransition` for Search Input**

The search input update is urgent (user expects instant visual feedback in the `<input>`), but the filtered result computation and re-render of the grid is non-urgent. Separate them with `useTransition`.

```tsx
// CatalogPage.tsx
import { useState, useTransition, useMemo } from 'react';

function CatalogPage({ products }: { products: Product[] }) {
  const [inputValue, setInputValue] = useState('');
  const [query, setQuery] = useState('');
  const [isPending, startTransition] = useTransition();

  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    // Urgent: update input value immediately so the field feels responsive
    setInputValue(e.target.value);

    // Non-urgent: defer the grid re-render to avoid blocking the input
    startTransition(() => {
      setQuery(e.target.value);
    });
  }

  const filteredProducts = useMemo(
    () =>
      products.filter(p =>
        p.name.toLowerCase().includes(query.toLowerCase())
      ),
    [products, query]
  );

  return (
    <div>
      <input
        value={inputValue}
        onChange={handleSearch}
        placeholder="Search products..."
      />
      {/* Show stale results during transition rather than a blank grid */}
      <div style={{ opacity: isPending ? 0.6 : 1, transition: 'opacity 150ms' }}>
        <ProductGrid products={filteredProducts} />
      </div>
    </div>
  );
}
```

---

**Pattern 2: Virtualization for the Product Grid**

Rendering 2,000 ProductCard components simultaneously creates ~2,000 DOM nodes. Virtualize to render only the ~20--30 visible items at any time.

```tsx
// ProductGrid.tsx
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef, memo } from 'react';

const COLUMN_COUNT = 4;
const ROW_HEIGHT = 320; // px -- matches your CSS card height

interface ProductGridProps {
  products: Product[];
}

export const ProductGrid = memo(function ProductGrid({ products }: ProductGridProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  // Compute rows: group products into rows of COLUMN_COUNT
  const rowCount = Math.ceil(products.length / COLUMN_COUNT);

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 4, // Render 4 rows beyond visible viewport to prevent blank flash during scroll
  });

  return (
    <div
      ref={parentRef}
      style={{ height: '80vh', overflowY: 'auto' }}
    >
      {/* Total height spacer tells the browser the true scroll height */}
      <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
        {virtualizer.getVirtualItems().map(virtualRow => {
          const rowStartIndex = virtualRow.index * COLUMN_COUNT;
          const rowProducts = products.slice(rowStartIndex, rowStartIndex + COLUMN_COUNT);

          return (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: virtualRow.start,
                left: 0,
                right: 0,
                height: ROW_HEIGHT,
                display: 'grid',
                gridTemplateColumns: `repeat(${COLUMN_COUNT}, 1fr)`,
                gap: 16,
              }}
            >
              {rowProducts.map(product => (
                // Stable key from data, never index
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
});
```

---

**Pattern 3: Memoize ProductCard to Prevent Re-Renders on Scroll**

Without `memo`, every virtualizer scroll recalculation causes all visible ProductCard components to re-render. With `memo`, they only re-render when their specific product data changes.

```tsx
// ProductCard.tsx
import { memo, useCallback } from 'react';

interface ProductCardProps {
  product: Product;
  onAddToCart: (id: string) => void;
}

// memo with custom comparator: only re-render if product ID or price changes
export const ProductCard = memo(
  function ProductCard({ product, onAddToCart }: ProductCardProps) {
    return (
      <div className="product-card">
        {/* Use loading="lazy" for images below the fold -- native browser lazy load */}
        <img
          src={product.thumbnailUrl}
          alt={product.name}
          loading="lazy"
          width={280}
          height={200}
        />
        <h3>{product.name}</h3>
        <p>${product.price.toFixed(2)}</p>
        <button onClick={() => onAddToCart(product.id)}>Add to Cart</button>
      </div>
    );
  },
  // Custom comparator: avoid re-renders when unrelated catalog state changes
  (prev, next) =>
    prev.product.id === next.product.id &&
    prev.product.price === next.product.price &&
    prev.product.stock === next.product.stock
);
```

---

**Pattern 4: Stabilize the `onAddToCart` Callback**

The `onAddToCart` handler passed to ProductCard must be stable (same reference between renders) or the `memo` comparator is defeated.

```tsx
// In CatalogPage.tsx -- stable callback via useCallback
const handleAddToCart = useCallback((productId: string) => {
  dispatch({ type: 'CART_ADD', payload: productId });
  // useCallback deps: dispatch is stable from useReducer, no other deps
}, [dispatch]);

// Pass stable reference to the grid
<ProductGrid products={filteredProducts} onAddToCart={handleAddToCart} />
```

---

### Before / After Metrics (Target)

| Metric                      | Before (Estimated) | Target After     |
|-----------------------------|--------------------|------------------|
| Keypress-to-render time     | 180--400ms         | < 16ms (input), < 100ms (grid, deferred) |
| DOM nodes (grid visible)    | ~8,000             | ~120 (virtualized) |
| Re-renders per keypress     | 2,001 (all cards + parent) | 1 (parent only during transition) |
| Scroll frame budget (16.7ms)| Exceeded (jank)    | Met consistently |
| LCP (image-heavy first load)| ~4.2s              | < 2.5s (lazy images) |
| INP                         | ~380ms             | < 200ms          |

---

### Verification Checklist

- [ ] React DevTools Profiler: keypress interaction shows only `CatalogPage` rendering at high priority; grid re-render deferred and shows `isPending` correctly
- [ ] React DevTools Profiler: ProductCard components show "Did not render" during scroll events after virtualization
- [ ] `why-did-you-render` library shows zero spurious renders on ProductCard after `memo` + `useCallback` applied
- [ ] Chrome Performance tab: no frames exceed 16.7ms during scroll through the virtualized grid
- [ ] Network tab: product images load lazily (only images near viewport appear in waterfall during initial load)
- [ ] `web-vitals` INP measurement in staging < 200ms at p75 with realistic 2,000-product dataset
- [ ] Heap snapshot before/after 5-minute browsing session shows no increasing retained size trend
