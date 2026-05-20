---
name: react-state-management
description: |
  Guides expert-level react state management implementation: javascript and typescript decision frameworks, production-ready patterns, and concrete templates for react state management workflows.
  Use when the user asks about react state management, react state management configuration, or javascript best practices for react projects.
  Do NOT use when the user needs a different web development capability -- check sibling skills in the web development subcategory.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "javascript typescript frontend frameworks"
  category: "web-development"
  subcategory: "web-development"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# React State Management

## When to Use

**Use this skill when:**
- User asks which state management library to choose for a React project (useState vs. useReducer vs. Zustand vs. Redux Toolkit vs. Jotai vs. Recoil vs. React Query)
- User needs to implement a specific state pattern such as optimistic updates, derived state, server state synchronization, or cross-component state sharing
- User is experiencing performance issues caused by excessive re-renders due to state structure or placement decisions
- User wants to migrate from one state management approach to another (e.g., from Redux to Redux Toolkit, or from Redux to Zustand)
- User needs to architect state for a feature with complex async flows -- multi-step forms, real-time data, or polling
- User asks about TypeScript typing strategies for React state (discriminated unions, generic store types, type-safe actions)
- User is debugging state-related issues such as stale closures, zombie child components, or context value thrashing
- User wants to set up a new React project and needs guidance on the correct state management baseline

**Do NOT use this skill when:**
- User needs general React component architecture advice not tied to state -- check the react-component-design skill
- User needs help with CSS-in-JS or styling -- check the react-styling skill
- User is asking about Next.js-specific data fetching patterns (getServerSideProps, server components, React Server Components state) -- check the nextjs-data-fetching skill
- User needs backend API design advice that will feed client state -- check the rest-api-design or graphql-schema-design skill
- User is working with React Native and asking about mobile-specific state concerns (navigation state, offline-first sync) -- check the react-native skill
- User is asking about testing React components in isolation -- check the react-testing skill
- User needs form state management specifically -- Formik, React Hook Form, and Zod integration are covered in the react-forms skill

---

## Process

### Step 1: Classify the State Category

Before recommending any solution, identify which type of state the user is dealing with. These categories have fundamentally different optimal solutions.

- **Server state**: Data that originates on a server, is fetched asynchronously, and must be kept in sync. Examples: user profiles, product listings, paginated feeds. This is the most common category in real apps and is best handled by TanStack Query (React Query) v5, SWR, or Apollo Client -- NOT by Redux or Zustand.
- **UI state**: Ephemeral, local state that controls visual behavior and does not need to persist. Examples: modal open/closed, accordion expanded, tooltip visible. This belongs in `useState` co-located with the component that owns it.
- **Form state**: Transient user input state with validation logic. This belongs in React Hook Form or Formik, not in global state.
- **Global client state**: Application-wide state that is computed on the client, shared across many components, and does not map directly to server data. Examples: current user preferences, shopping cart contents (before checkout), selected items in a multi-select UI. This is where Zustand, Jotai, or Redux Toolkit applies.
- **URL/router state**: State that should survive page refresh and be shareable via link. Examples: search filters, pagination cursor, selected tab. This belongs in URL query params managed via the router, not in component state.
- **Derived state**: Values computed from other state. These should NOT be stored -- they should be computed with `useMemo` or as selector functions.

Ask the user to describe their use case if the classification is ambiguous. Misclassifying server state as global client state is the #1 source of unnecessary complexity in React apps.

### Step 2: Apply the State Co-location Principle

Once the state category is known, determine the correct ownership level before choosing a library.

- Start with the question: "What is the lowest component in the tree that needs access to this state?"
- If only one component needs it: `useState` inside that component. Period.
- If a parent and one or two children need it: lift state to the parent and pass as props. Do not reach for Context yet.
- If siblings across a subtree need it without a natural common parent, or prop drilling exceeds 2--3 levels: introduce React Context for that subtree, or use a store slice if global state is already present.
- If many unrelated components across the entire app tree need it: use a global store (Zustand, Redux Toolkit) or atom-based state (Jotai, Recoil).
- Never put everything in global state to "make it easy to access." This creates implicit coupling and makes components impossible to test in isolation.

### Step 3: Select the Right Tool Using the Decision Framework

Apply this decision matrix based on confirmed requirements:

**For server state (async data from APIs):**
- Default choice: TanStack Query v5 (`@tanstack/react-query`). Provides caching, background refetching, stale-while-revalidate, pagination helpers, optimistic updates, and request deduplication out of the box. Works with REST and GraphQL.
- If already using Apollo Client with GraphQL: stick with Apollo. Its normalized cache is unmatched for deeply relational GraphQL data.
- If the app is very small (< 5 API endpoints, no caching needed): `useEffect` + `useState` is acceptable. Stop there and do not over-engineer.
- If using Next.js 13+ App Router with server components: prefer server-side data fetching with `fetch` and React Cache; use TanStack Query only for client-side interactivity.

**For global client state:**
- Team size 1--3, app complexity low--medium, or team is Redux-fatigued: **Zustand**. Minimal boilerplate, no providers needed, excellent DevTools support via `zustand/middleware`. Bundle size ~1 KB gzipped.
- Atomic/fine-grained state updates needed (many independent pieces that update at different rates): **Jotai**. Atom-based, co-locates state definition with feature files, avoids the "big store object" problem.
- Team has existing Redux expertise, or app requires complex multi-step async workflows with structured action history: **Redux Toolkit (RTK)**. Use `createSlice`, `createAsyncThunk`, and RTK Query. Never write plain Redux in 2024+.
- Complex shared state with strict referential equality needs and React Concurrent Mode support: **Recoil** (or Jotai, which is more stable). Note that Recoil is in maintenance mode at Meta -- prefer Jotai for new projects.
- Enterprise app with strict unidirectional data flow requirements, time-travel debugging, or compliance requirements for full state audit logs: **Redux Toolkit** with Redux DevTools Extension.

**For UI state:**
- Single component: `useState`.
- Complex local state with multiple related sub-values or transitions: `useReducer` inside the component.
- Shared across a small subtree: React Context with `useReducer`. Pattern the context as `[state, dispatch]` tuple following the useReducer convention.

### Step 4: Design the State Shape

This step prevents the most common performance and correctness bugs. Apply these principles:

- **Normalize relational data**: If storing a list of items that are referenced by ID elsewhere, store them as `{ ids: string[], entities: Record<string, Item> }` -- not as a flat array. Redux Toolkit provides `createEntityAdapter` for this. Zustand stores can use the same shape manually.
- **Keep state minimal**: Do not store values that can be derived. If you have `items: Item[]` and need `totalCount`, compute it -- do not store a separate `totalCount` field that must be kept in sync.
- **Avoid deeply nested objects in global stores**: Updating deeply nested state requires immutable update patterns that are verbose and error-prone. Flatten the structure or use Immer (built into Redux Toolkit's `createSlice` and available as a Zustand middleware `immer`).
- **Use discriminated union types in TypeScript** for state that has mutually exclusive modes. Example: `type AsyncState<T> = { status: 'idle' } | { status: 'loading' } | { status: 'success'; data: T } | { status: 'error'; error: string }`. This makes impossible states impossible and exhaustive switch statements safe.
- **Separate concerns in the store**: In Zustand, organize the store into logical slices using the slice pattern even within a single store. In Redux Toolkit, use `combineReducers` to isolate domain slices.

### Step 5: Implement the Chosen Pattern

For **TanStack Query**:
- Wrap the app in `<QueryClientProvider client={queryClient}>` at the root.
- Configure `QueryClient` with sensible defaults: `staleTime: 60_000` (1 minute) for most data, `gcTime: 300_000` (5 minutes), `retry: 1` for non-idempotent queries.
- Define query keys as typed constants or factory functions: `const userKeys = { all: ['users'] as const, detail: (id: string) => ['users', id] as const }`. This prevents key typos and makes invalidation predictable.
- Use `useQuery` for reads, `useMutation` for writes, `useInfiniteQuery` for paginated lists.
- For optimistic updates: use `onMutate` callback to update the cache immediately, `onError` to roll back via `queryClient.setQueryData`, and `onSettled` to invalidate and refetch.

For **Zustand**:
- Create stores with `create<StoreType>()((set, get) => ({ ... }))`. Always provide the TypeScript generic for the store interface.
- Use shallow equality for selectors that return objects: `const { count, increment } = useStore(useShallow(s => ({ count: s.count, increment: s.increment })))`. Without this, every store update triggers a re-render.
- Use the `devtools` middleware in development: `create(devtools(immer((set) => ({ ... }))))`. Middleware order matters: `devtools(immer(subscribeWithSelector(vanilla)))`.
- For large apps, use the slice pattern: define each slice as a function `(set, get, api) => ({...})` and compose them in a single `create` call.

For **Redux Toolkit**:
- Define slices with `createSlice`: actions, reducers, and initial state in one place.
- Use `createAsyncThunk` for async operations. Handle loading/error/success states by responding to the `.pending`, `.fulfilled`, and `.rejected` action types in `extraReducers`.
- Use RTK Query's `createApi` for data fetching rather than writing thunks manually. It auto-generates hooks and manages cache lifecycle.
- Access state with typed selectors: create selectors using `createSelector` from `reselect` for memoization. Colocate selectors in the slice file.

For **React Context + useReducer**:
- Define the reducer separately from the context -- keeps it pure and testable.
- Split context into `StateContext` and `DispatchContext` to prevent components that only dispatch from re-rendering when state changes.
- Memoize the Provider's children with `React.memo` or ensure the context value itself does not change on every render.

### Step 6: Implement Performance Safeguards

Re-render bugs from poor state management are performance killers. Address these proactively:

- **Selector granularity**: Components should subscribe to the smallest slice of state they need. In Zustand: `const count = useStore(s => s.count)` not `const store = useStore()`. In Redux: create specific selectors for each component's data needs.
- **Memoization boundaries**: Use `React.memo` on components whose props come from store selectors. Use `useMemo` for expensive derived computations. Use `useCallback` for action dispatchers passed as props.
- **Identify re-render sources**: Use React DevTools Profiler or the `why-did-you-render` library to identify which component is re-rendering and what prop/state changed. Do not optimize before measuring.
- **Context splitting**: If a single Context contains 5+ fields used by different parts of the tree, split it into multiple Contexts. Every Context update re-renders all consumers regardless of which field changed.
- **Concurrent Mode compatibility**: Avoid `useEffect` for state synchronization -- it causes tearing in Concurrent Mode. Use `useSyncExternalStore` for subscribing to external stores if not using a library that already handles this.

### Step 7: Validate and Test

- **Unit test reducers and selectors** in isolation. They are pure functions -- no React rendering required. Use Vitest or Jest.
- **Integration test store + components** using React Testing Library. Wrap components with the appropriate Provider (QueryClientProvider, Redux Provider, or Zustand store mock). Do NOT mock the store itself -- test the real store logic.
- **Test async state transitions**: In TanStack Query tests, use `msw` (Mock Service Worker) to intercept HTTP requests. In RTK Query tests, use the built-in `setupServer` from `msw`. Assert loading, success, and error states.
- **Verify no memory leaks**: Ensure mutations and subscriptions are properly cleaned up. TanStack Query handles this automatically. Zustand subscriptions via `subscribe` must be unsubscribed in `useEffect` cleanup.
- **E2E state validation**: Use Playwright or Cypress to verify that state is correctly reflected in the UI across full user flows, including page navigations and async operations.

---

## Output Format

When responding to a user's state management question, structure the response as follows:

```
## State Management Recommendation: [Feature or App Name]

### State Classification
| State Piece        | Category         | Reason                              | Recommended Tool     |
|--------------------|------------------|--------------------------------------|----------------------|
| [State Name]       | [server/UI/global/form/URL] | [Why it falls in this category] | [Tool]          |

### Decision Rationale
**Selected approach**: [Tool/pattern name]

**Why this fits your context**:
- [Reason 1 tied to user's specific constraints]
- [Reason 2]
- [Trade-off acknowledged]

**Alternatives considered**:
- [Alternative]: Not chosen because [specific reason]

### Implementation

#### Setup / Installation
```bash
npm install [packages]
```

#### Core Implementation
```typescript
// [Filename]: [Brief description]

[Complete, runnable TypeScript/JavaScript code]
```

#### TypeScript Types
```typescript
[Complete type definitions for the state shape]
```

#### Usage in Components
```typescript
// [Component file]: Demonstrates correct selector/hook usage
[Complete component code with state consumption]
```

### Performance Notes
- [Specific re-render concern and how the implementation avoids it]
- [Memoization decisions]

### Testing Approach
```typescript
// [Test file]: Core test cases
[Test code]
```

### Next Steps
- [Migration path if user has existing state]
- [Follow-on concern to address after this implementation]
```

---

## Rules

1. **NEVER recommend Redux (plain) or Redux with hand-written action constants.** Redux Toolkit has been the official recommendation since 2019. Plain Redux in 2024 is an anti-pattern that adds thousands of lines of boilerplate with no benefit. If a user shows you plain Redux code, migrate it to RTK.

2. **NEVER put server/async data in Zustand or Redux.** Storing API responses in a global store and manually managing loading/error/stale state is the most common mistake in React apps. TanStack Query or SWR handles this category of state with far less code and far more correctness. Only cache server data in a global store as a last resort with explicit justification.

3. **NEVER recommend Recoil for new projects.** Recoil has been in maintenance mode since early 2023 with no active Facebook/Meta development. Recommend Jotai instead for atom-based state needs -- it is actively maintained, smaller, and has a compatible API.

4. **ALWAYS enforce that `useReducer` is preferred over `useState` when state has more than 3 related fields or when next state depends on previous state in complex conditional ways.** The threshold is: if you find yourself writing `setX(prev => ...)` in 3 or more places in a single component, switch to `useReducer`.

5. **NEVER co-locate global store definitions inside component files.** Store definitions belong in dedicated files (e.g., `src/stores/authStore.ts`, `src/store/slices/cartSlice.ts`). Co-location makes circular imports a near-certainty and makes the store impossible to import in test utilities without importing React.

6. **ALWAYS type Zustand stores with an explicit TypeScript interface** passed as a generic parameter. Inferred types from Zustand's `create` become incorrect when using middleware (devtools, immer) due to TypeScript limitations. Define the interface separately and pass it explicitly.

7. **NEVER use React Context for high-frequency updates.** Context re-renders every consumer on every value change. For state that updates more than a few times per second (e.g., real-time cursor positions, scroll positions, animation values), use Zustand's `subscribe` with `useRef`, `useSyncExternalStore`, or a signals library. The threshold is approximately 10+ updates per second.

8. **ALWAYS invalidate TanStack Query cache after mutations.** After a `useMutation` succeeds, call `queryClient.invalidateQueries({ queryKey: userKeys.all })` in the `onSuccess` callback, OR use optimistic updates with rollback. Never let the UI show stale data after a write operation.

9. **NEVER store derived state.** If `totalPrice` can be computed from `cart.items`, do not store `totalPrice` in the store. Create a selector: `const selectTotalPrice = (state) => state.cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0)`. Storing derived state creates synchronization bugs.

10. **ALWAYS use the `useShallow` hook (Zustand) or `createSelector` (Redux) when a component subscribes to multiple store fields.** Subscribing to multiple fields with a single object selector without shallow equality comparison causes the component to re-render on every store update, even when the subscribed fields have not changed. This is the most common performance bug in Zustand applications.

---

## Edge Cases

### Legacy Codebase with Plain Redux

When a user has an existing plain Redux codebase with hand-written action types, reducers, and selectors:
- Do not recommend a full rewrite. RTK is fully compatible with existing Redux stores.
- Migrate one slice at a time using `createSlice`. Replace existing action creators and reducers for one domain first (e.g., auth), leaving others untouched.
- Move selector logic into the slice file or a co-located `selectors.ts` file.
- Replace hand-written async logic (thunks or sagas) with `createAsyncThunk` or RTK Query one route at a time.
- Redux Saga migration: if the codebase uses Redux Saga for complex side effects, do not rip it out immediately. Maintain Saga for existing flows and use `createAsyncThunk` for new flows. Plan a full Saga removal over 6--12 months only after RTK is stable in the codebase.

### Concurrent Mode and Tearing

React 18's Concurrent Mode can cause "tearing" -- where different parts of the UI read different snapshots of the same external store during a single render. This affects Zustand, Redux, and any custom store.
- Libraries updated for React 18 (Zustand v4+, React-Redux v8+, Jotai v2+) implement `useSyncExternalStore` internally and are safe.
- If a user reports subtle inconsistency bugs in React 18 with Concurrent features (`useTransition`, `Suspense`, `useDeferredValue`), check the versions of state management libraries first.
- Custom `useEffect`-based store subscriptions are tearing-unsafe. Replace them with `useSyncExternalStore`.
- React Query's `useSuspenseQuery` (TanStack Query v5) is designed for Concurrent Mode and is safe to use with `Suspense` boundaries.

### Micro-Frontend / Module Federation Architecture

When React state must be shared across independently deployed micro-frontends:
- Do NOT share a Zustand or Redux store instance directly across module federation bundles. Each bundle has its own JavaScript runtime -- sharing store instances causes version conflicts and memory isolation issues.
- Use the URL (query params, hash) as the source of truth for state that must cross micro-frontend boundaries. Both apps read from and write to the same URL.
- For real-time cross-app state: use a custom event bus via `window.dispatchEvent` / `window.addEventListener` with a typed event schema, or a shared BroadcastChannel.
- If both micro-frontends are loaded in the same React tree (via a shell app), a shared Zustand store defined in a separate shared package and imported by both works correctly IF the package is deduplicated in the module federation config (use `shared: { zustand: { singleton: true } }`).

### SSR / Next.js Hydration Mismatches

When using global client state with Server-Side Rendering:
- Zustand and Redux stores must be instantiated per-request on the server, not as module-level singletons. A module-level singleton will bleed state between requests on the server.
- For Next.js with Redux Toolkit: use the `createWrapper` pattern from `next-redux-wrapper` to create a new store per SSR request and merge it with client state during hydration.
- For Zustand with SSR: use `createStore` (not `create`) and initialize it inside the component tree using React Context, following the pattern described in Zustand's documentation for Next.js.
- TanStack Query with SSR: use `dehydrate`/`HydrationBoundary` to serialize query cache on the server and rehydrate on the client. This avoids the initial loading flash and prevents client/server HTML mismatch.
- Never reference `window`, `localStorage`, or browser APIs in store initialization code that runs during SSR. Guard with `typeof window !== 'undefined'`.

### Extremely High-Frequency State Updates (Animations, Realtime)

For state that updates at 60fps (animations) or near-realtime (collaborative editing, live dashboards):
- Do NOT use React state at all for animation values. Use Framer Motion's `useMotionValue` or React Spring's spring values -- these bypass React's render cycle entirely.
- For real-time data at 1--10 updates/second: TanStack Query with a short `refetchInterval` (1000ms) or WebSocket integration via `queryClient.setQueryData` in the socket message handler is appropriate.
- For collaborative editing (operational transforms, CRDTs): use a dedicated library (Yjs, Automerge) and expose its state to React via `useSyncExternalStore`. Do not attempt to model CRDT state in Zustand or Redux -- the write patterns are incompatible.
- For 60fps position/scroll tracking: store the value in a `useRef` and update the DOM imperatively. Only elevate to React state when the value needs to trigger a render.

### Team Migration from Class Components with this.setState

When a team is migrating from legacy class components that use `this.setState` and `this.props`:
- The functional equivalent of `this.setState` with partial updates is `useState` with a spread: `setState(prev => ({ ...prev, newField: value }))`. However, this is a code smell -- if state has 3+ fields that are always updated together, use `useReducer` instead.
- Do not introduce a global state library during a class-to-hooks migration. Tackle these as separate migrations. Complete the hooks migration first, then evaluate if global state is needed.
- Lifecycle methods map as follows: `componentDidMount` → `useEffect(() => {}, [])`, `componentDidUpdate` → `useEffect(() => {}, [deps])`, `componentWillUnmount` → cleanup function in `useEffect`. Stale closure bugs are common during this migration -- always include all referenced variables in the dependency array (use the `exhaustive-deps` ESLint rule from `eslint-plugin-react-hooks`).

### Cross-Tab State Synchronization

When the same React app is open in multiple browser tabs and state must stay consistent (e.g., auth logout, shopping cart):
- Use `BroadcastChannel` API to notify other tabs of state changes. Write a small wrapper that dispatches to the Zustand store or Redux store in all tabs simultaneously.
- TanStack Query has built-in support for cross-tab cache synchronization via `broadcastQueryClient` (experimental in v5). Enable it for data that must stay consistent across tabs.
- For auth state specifically: listen to `storage` events on `localStorage`. When the auth token is removed in one tab, dispatch a logout action in all other tabs via the `storage` event listener.
- Zustand's `subscribeWithSelector` middleware can be combined with a `BroadcastChannel` to create a multi-tab store synchronization layer with approximately 20 lines of code.

---

## Example

**Input from user:** "I'm building a React e-commerce app with TypeScript. We have a team of 4 engineers, using Vite + React 18. The app has a product catalog (fetched from a REST API with pagination), a shopping cart (client-only until checkout), user authentication, and a real-time inventory counter on product pages. What state management setup should I use and can you show me the implementation?"

**Output:**

## State Management Recommendation: E-Commerce React App

### State Classification

| State Piece | Category | Reason | Recommended Tool |
|---|---|---|---|
| Product catalog (paginated) | Server state | Lives on server, fetched async, needs caching and pagination | TanStack Query v5 |
| Shopping cart | Global client state | Client-computed, shared across Header + CartPage + ProductPage | Zustand |
| User authentication (token, user object) | Global client state | App-wide, must persist across refresh | Zustand + localStorage middleware |
| Real-time inventory counter | Server state (polling) | Lives on server, updates frequently | TanStack Query (refetchInterval) |
| Product filter / sort / page | URL state | Must be shareable and survive refresh | URL query params (router) |
| Modal open/closed | UI state | Ephemeral, local to one component | useState |

### Decision Rationale

**Selected approach**: TanStack Query for server state + Zustand for global client state

**Why this fits your context**:
- The catalog and inventory are classic server state. Manually caching paginated data in Redux is hundreds of lines of boilerplate. TanStack Query handles background refetching, pagination, stale-while-revalidate, and deduplication automatically.
- The cart is true global client state -- it does not come from the server and is shared across 3+ unrelated components. Zustand adds ~1 KB to the bundle and requires zero boilerplate.
- Your team of 4 does not need the overhead of Redux Toolkit unless you already have Redux expertise or require strict time-travel debugging. Zustand is maintainable by junior engineers on day one.

**Alternatives considered**:
- Redux Toolkit: Not chosen. No existing Redux codebase, team is new to the project, and RTK's overhead is unnecessary for this scope. Could be introduced later if audit logging becomes a requirement.
- Storing cart in TanStack Query: Not appropriate. The cart is not a server resource until checkout. Treating it as server state would require a cart API for every add/remove action -- overengineered for this use case.
- Jotai instead of Zustand: Valid alternative. Zustand chosen because its single-store model is easier to debug with DevTools for a team of 4 engineers unfamiliar with atomic state.

### Implementation

#### Setup / Installation

```bash
npm install @tanstack/react-query @tanstack/react-query-devtools zustand immer
npm install -D @tanstack/eslint-plugin-query
```

#### TanStack Query Setup

```typescript
// src/lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,        // 1 minute -- products don't change every second
      gcTime: 300_000,          // 5 minutes in cache after last subscriber
      retry: 1,                 // Retry failed requests once
      refetchOnWindowFocus: true, // Refetch stale data when user returns to tab
    },
    mutations: {
      retry: 0,                 // Never retry mutations automatically
    },
  },
});
```

```typescript
// src/main.tsx
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from './lib/queryClient';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

#### Query Key Factory

```typescript
// src/lib/queryKeys.ts
// Centralized query key definitions prevent typos and make invalidation reliable.

export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (filters: ProductFilters) => [...productKeys.lists(), filters] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (id: string) => [...productKeys.details(), id] as const,
  inventory: (id: string) => [...productKeys.detail(id), 'inventory'] as const,
};

export interface ProductFilters {
  page: number;
  pageSize: number;
  category?: string;
  sortBy?: 'price_asc' | 'price_desc' | 'name' | 'newest';
}
```

#### Product Catalog Query (Paginated)

```typescript
// src/features/catalog/hooks/useProducts.ts
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { productKeys, type ProductFilters } from '../../../lib/queryKeys';
import { fetchProducts } from '../../../api/products';

export interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  categoryId: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function useProducts(filters: ProductFilters) {
  return useQuery({
    queryKey: productKeys.list(filters),
    queryFn: () => fetchProducts(filters),
    placeholderData: keepPreviousData, // Prevents content flash during page changes
    select: (data) => data,             // Transform here if API shape differs from UI needs
  });
}
```

#### Real-Time Inventory (Polling)

```typescript
// src/features/catalog/hooks/useProductInventory.ts
import { useQuery } from '@tanstack/react-query';
import { productKeys } from '../../../lib/queryKeys';
import { fetchInventory } from '../../../api/inventory';

export interface InventoryStatus {
  productId: string;
  available: number;
  reserved: number;
  inStock: boolean;
}

export function useProductInventory(productId: string) {
  return useQuery({
    queryKey: productKeys.inventory(productId),
    queryFn: () => fetchInventory(productId),
    refetchInterval: 30_000,       // Poll every 30 seconds
    refetchIntervalInBackground: false, // Pause polling when tab is hidden
    staleTime: 10_000,             // Consider inventory stale after 10 seconds
  });
}
```

#### Zustand Cart Store

```typescript
// src/stores/cartStore.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { useShallow } from 'zustand/react/shallow';

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  imageUrl: string;
  quantity: number;
}

interface CartState {
  items: Record<string, CartItem>; // Keyed by productId for O(1) lookup
}

interface CartActions {
  addItem: (product: Omit<CartItem, 'quantity'>) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
}

// Selectors defined outside the component to avoid recreation on every render
export const selectItemCount = (state: CartState) =>
  Object.values(state.items).reduce((sum, item) => sum + item.quantity, 0);

export const selectTotalPrice = (state: CartState) =>
  Object.values(state.items).reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

export const selectCartItems = (state: CartState) =>
  Object.values(state.items);

type CartStore = CartState & CartActions;

export const useCartStore = create<CartStore>()(
  devtools(
    persist(
      immer((set) => ({
        // Initial state
        items: {},

        addItem: (product) =>
          set((state) => {
            const existing = state.items[product.productId];
            if (existing) {
              existing.quantity += 1;
            } else {
              state.items[product.productId] = { ...product, quantity: 1 };
            }
          }),

        removeItem: (productId) =>
          set((state) => {
            delete state.items[productId];
          }),

        updateQuantity: (productId, quantity) =>
          set((state) => {
            if (quantity <= 0) {
              delete state.items[productId];
            } else if (state.items[productId]) {
              state.items[productId].quantity = quantity;
            }
          }),

        clearCart: () =>
          set((state) => {
            state.items = {};
          }),
      })),
      {
        name: 'shopping-cart',        // localStorage key
        partialize: (state) => ({     // Only persist the items, not the actions
          items: state.items,
        }),
      }
    ),
    { name: 'CartStore' }             // DevTools display name
  )
);
```

#### Authentication Store

```typescript
// src/stores/authStore.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { queryClient } from '../lib/queryClient';

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: 'customer' | 'admin';
}

// Discriminated union prevents accessing user data in non-authenticated state
type AuthState =
  | { status: 'unauthenticated'; user: null; token: null }
  | { status: 'authenticated'; user: User; token: string };

interface AuthActions {
  login: (user: User, token: string) => void;
  logout: () => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  devtools(
    persist(
      immer<AuthStore>((set) => ({
        // Initial state
        status: 'unauthenticated',
        user: null,
        token: null,

        login: (user, token) =>
          set((state) => {
            state.status = 'authenticated';
            // TypeScript narrowing via discriminated union handles these casts safely
            (state as Extract<AuthStore, { status: 'authenticated' }>).user = user;
            (state as Extract<AuthStore, { status: 'authenticated' }>).token = token;
          }),

        logout: () => {
          // Clear all cached server data on logout to prevent data leakage
          queryClient.clear();
          set((state) => {
            state.status = 'unauthenticated';
            state.user = null;
            state.token = null;
          });
        },
      })),
      {
        name: 'auth-store',
        partialize: (state) => ({
          status: state.status,
          user: state.user,
          token: state.token,
        }),
      }
    ),
    { name: 'AuthStore' }
  )
);
```

#### Usage in Components

```typescript
// src/features/cart/components/CartIcon.tsx
// Subscribes to ONLY the item count -- does not re-render when prices change.
import { useCartStore, selectItemCount } from '../../../stores/cartStore';

export function CartIcon() {
  const itemCount = useCartStore(selectItemCount);

  return (
    <div className="cart-icon">
      <ShoppingBagIcon />
      {itemCount > 0 && (
        <span className="cart-badge">{itemCount}</span>
      )}
    </div>
  );
}
```

```typescript
// src/features/catalog/components/ProductCard.tsx
// Demonstrates correct pattern: server state from TanStack Query,
// cart mutations from Zustand, UI state local to component.
import { useState } from 'react';
import { useCartStore } from '../../../stores/cartStore';
import { useProductInventory } from '../hooks/useProductInventory';
import type { Product } from '../hooks/useProducts';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const [added, setAdded] = useState(false);

  // Stable function reference -- not recreated on re-render
  const addItem = useCartStore((s) => s.addItem);

  const { data: inventory, isLoading: inventoryLoading } =
    useProductInventory(product.id);

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="product-card">
      <img src={product.imageUrl} alt={product.name} />
      <h3>{product.name}</h3>
      <p>${product.price.toFixed(2)}</p>

      {!inventoryLoading && inventory && (
        <span className={inventory.inStock ? 'in-stock' : 'out-of-stock'}>
          {inventory.inStock ? `${inventory.available} left` : 'Out of stock'}
        </span>
      )}

      <button
        onClick={handleAddToCart}
        disabled={!inventory?.inStock}
      >
        {added ? 'Added!' : 'Add to Cart'}
      </button>
    </div>
  );
}
```

```typescript
// src/features/catalog/pages/CatalogPage.tsx
// Demonstrates URL state for filters -- survives refresh and is shareable.
import { useSearchParams } from 'react-router-dom';
import { useProducts } from '../hooks/useProducts';
import { ProductCard } from '../components/ProductCard';

export function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = {
    page: Number(searchParams.get('page') ?? '1'),
    pageSize: 24,
    category: searchParams.get('category') ?? undefined,
    sortBy: (searchParams.get('sort') as 'price_asc' | 'newest' | undefined),
  };

  const { data, isLoading, isFetching, isError } = useProducts(filters);

  const setPage = (page: number) => {
    setSearchParams((prev) => {
      prev.set('page', String(page));
      return prev;
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoading) return <ProductGridSkeleton count={24} />;
  if (isError) return <ErrorMessage message="Could not load products." />;

  return (
    <div>
      {isFetching && <RefetchIndicator />} {/* Shows during background refetches */}
      <div className="product-grid">
        {data?.data.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      <Pagination
        currentPage={filters.page}
        totalPages={data?.totalPages ?? 1}
        onPageChange={setPage}
      />
    </div>
  );
}
```

### Performance Notes

- `useCartStore(selectItemCount)` and `useCartStore(s => s.addItem)` subscribe to scalar/stable values. Neither triggers a re-render when unrelated cart fields change.
- `keepPreviousData` in `useProducts` prevents the product grid from unmounting and showing a skeleton on every page change -- the old page data stays visible while the new page loads.
- `refetchIntervalInBackground: false` on the inventory query prevents 30-second polling from running when the user has switched to another browser tab, saving unnecessary API calls.
- The cart items are stored as `Record<string, CartItem>` (keyed by productId) rather than an array. This makes `addItem`, `removeItem`, and `updateQuantity` O(1) operations and avoids `Array.findIndex` on every mutation.

### Testing Approach

```typescript
// src/stores/cartStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useCartStore } from './cartStore';
import { selectTotalPrice, selectItemCount } from './cartStore';

const mockProduct = {
  productId: 'prod-1',
  name: 'Test Widget',
  price: 29.99,
  imageUrl: '/widget.png',
};

describe('cartStore', () => {
  beforeEach(() => {
    // Reset store to initial state between tests
    useCartStore.setState({ items: {} });
  });

  it('adds a new item with quantity 1', () => {
    useCartStore.getState().addItem(mockProduct);
    const state = useCartStore.getState();
    expect(state.items['prod-1']).toEqual({ ...mockProduct, quantity: 1 });
  });

  it('increments quantity when adding an existing item', () => {
    useCartStore.getState().addItem(mockProduct);
    useCartStore.getState().addItem(mockProduct);
    expect(useCartStore.getState().items['prod-1'].quantity).toBe(2);
  });

  it('removes item when updateQuantity is called with 0', () => {
    useCartStore.getState().addItem(mockProduct);
    useCartStore.getState().updateQuantity('prod-1', 0);
    expect(useCartStore.getState().items['prod-1']).toBeUndefined();
  });

  it('calculates total price correctly', () => {
    useCartStore.getState().addItem(mockProduct);
    useCartStore.getState().addItem(mockProduct);
    const total = selectTotalPrice(useCartStore.getState());
    expect(total).toBeCloseTo(59.98);
  });

  it('calculates item count correctly', () => {
    useCartStore.getState().addItem(mockProduct);
    useCartStore.getState().addItem({ ...mockProduct, productId: 'prod-2' });
    expect(selectItemCount(useCartStore.getState())).toBe(2);
  });
});
```

### Next Steps

- Add an `api/products.ts` module that reads the auth token from `useAuthStore.getState().token` and injects it as a Bearer header. Do not pass the token through component props or query function arguments.
- When checkout begins, POST the cart contents to the orders API using a `useMutation`, then call `queryClient.invalidateQueries({ queryKey: productKeys.all })` on success to refresh inventory counts, and call `clearCart()` from the Zustand store.
- Add the `eslint-plugin-react-hooks` rule `react-hooks/exhaustive-deps` to your ESLint config immediately. Set it to `error`, not `warn`. This catches stale closure bugs at the linting stage before they reach production.
- If the app grows to require user-specific product recommendations or recently viewed items, these are server state -- add them as TanStack Query queries, not Zustand slices.
