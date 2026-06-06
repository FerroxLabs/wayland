---
name: vue-state-management
description: |
  Guides expert-level vue state management implementation: javascript and frameworks decision frameworks, production-ready patterns, and concrete templates for vue state management workflows.
  Use when the user asks about vue state management, vue state management configuration, or javascript best practices for vue projects.
  Do NOT use when the user needs a different web development capability -- check sibling skills in the web development subcategory.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "javascript frameworks frontend design-patterns"
  category: "web-development"
  subcategory: "web-development"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Vue State Management

## When to Use

**Use this skill when:**
- User is choosing between Pinia, Vuex 4, Composables + `provide`/`inject`, or local component state for a Vue 3 (or Vue 2 + Composition API) project and needs a principled recommendation
- User has an existing Vuex 3/4 store that is growing unwieldy (god stores, circular action dependencies, deeply nested module namespacing) and needs a migration or refactor path
- User is implementing cross-component state that outlives any single component's lifecycle -- shopping carts, authentication state, multi-step form wizards, real-time WebSocket data
- User is debugging reactive state problems: unintended mutations, stale computed properties, watchers firing too often or not at all, or `toRef`/`toRefs` misuse
- User needs to integrate server-side state (REST or GraphQL responses) with client-side UI state and must decide where the boundary lives
- User is building a large-scale Vue 3 app with 5+ engineers and needs store organization patterns, naming conventions, and testing strategies
- User wants to add TypeScript to an existing Pinia or Vuex store without a full rewrite
- User needs SSR-safe state management in Nuxt 3 or a custom Vue SSR setup

**Do NOT use this skill when:**
- User needs React state management -- use the react-state-management skill instead
- User is asking about Vue component props/emits patterns for parent-child communication -- that is covered by the vue-component-communication skill
- User needs server state caching strategies specifically (TanStack Query for Vue, Apollo Client) -- those warrant their own skill with query/mutation lifecycle focus
- User is asking about CSS state like `:hover` or animation transitions, not JavaScript reactive state
- User needs general JavaScript module system advice unrelated to Vue reactivity
- User is building a Vue 2 application without the Composition API plugin -- Vuex 3 patterns differ enough to require separate guidance

---

## Process

### 1. Diagnose the State Category and Scope

Before recommending any tool, classify what kind of state the user actually needs to manage. Ask clarifying questions if the input is ambiguous.

- **Local UI state** -- form field values, modal open/closed, accordion expansion, tooltip visibility. This state is ephemeral and component-specific. It belongs in `ref()` or `reactive()` inside the component, never in a global store.
- **Shared UI state** -- active tab in a layout shared by many routes, sidebar collapsed state, theme preference. This can live in a composable or a small Pinia store, but does NOT need actions or mutations.
- **Domain/Business state** -- the authenticated user object, a shopping cart, workspace settings, permissions. This is the primary candidate for Pinia stores or Vuex modules.
- **Server/Async state** -- paginated list responses, cached API data, loading/error states per request. This often belongs in a dedicated async composable (e.g., wrapping `useFetch`) or a library like VueUse's `useAsyncState` rather than a raw Pinia store, because you need cache invalidation, deduplication, and background refetching logic.
- **Form state** -- multi-field validation, dirty tracking, submission state. Use VeeValidate or FormKit rather than a custom store unless the form spans multiple routes.

Identify which of these categories (or combination) the user is dealing with. A common mistake is routing all five categories into a monolithic global store.

### 2. Apply the State Management Decision Tree

Use this framework to select the right tool for the diagnosed state category:

- **Single component, ephemeral** -- use `ref()` / `reactive()` in the `<script setup>` block. No abstraction needed.
- **Shared across 2-5 closely related components** -- use `provide`/`inject` with a composable that returns reactive refs. Define the injection key with `InjectionKey<T>` from Vue for TypeScript safety. This avoids global store overhead for contained subtrees.
- **Shared across the entire app, low complexity** -- use a Pinia store with `defineStore` in Options Store syntax if the team is junior/migrating from Vuex, or Setup Store syntax if using Composition API fluently. Pinia with Setup Store is the Vue 3 canonical recommendation as of Vue core team guidance.
- **Shared across the entire app, complex async workflows** -- use Pinia with explicit `$patch`, async actions, and `storeToRefs` for reactive destructuring. Add `pinia-plugin-persistedstate` if persistence to `localStorage` is needed.
- **Legacy Vue 2 / Vuex 3 codebase** -- keep Vuex 3, add typed module helpers, and migrate incrementally to Pinia using the `@pinia/testing` utilities when budget allows.
- **Vue 2 with Composition API plugin (2.7+)** -- Pinia 2 supports this. Recommend Pinia over continued Vuex investment.
- **Nuxt 3** -- Pinia is the first-class solution via `@pinia/nuxt`. Use `useNuxtApp().$pinia` only for plugin-level access. State hydration from server to client requires `useState()` for simple cases or Pinia's SSR guide pattern for complex ones.

### 3. Design the Store Architecture

Once the tool is selected, design the store structure before writing any code.

- **Split by domain, not by layer.** A `useUserStore` store is correct. A `useActionsStore` that contains all actions from the entire app is wrong.
- **Naming convention:** store files go in `src/stores/`, named `user.ts`, `cart.ts`, `notifications.ts`. The store ID matches the filename: `defineStore('user', ...)`.
- **Pinia Setup Store structure** -- declare state as `ref()` and `reactive()`, getters as `computed()`, actions as plain `async` functions, then `return` all public surface. Do NOT return implementation-private refs -- they will appear in DevTools unnecessarily.
- **Pinia Options Store structure** -- use `state: () => ({...})`, `getters: { ... }`, `actions: { ... }`. This pattern is better for teams migrating from Vuex because the mental model is identical.
- **Store composition** -- Pinia stores can call other stores inside actions. Import the needed store with `useCartStore()` inside the action function body, not at module level, to avoid circular dependency issues during SSR.
- **Module namespacing (Vuex 4)** -- always use `namespaced: true` for modules. Access with `store.dispatch('cart/addItem')` or use `createNamespacedHelpers('cart')`. Flat module structures (fewer than 3 levels deep) are strongly preferred over deeply nested trees.
- **State shape** -- normalize relational data. If storing a list of orders, use `{ ids: string[], byId: Record<string, Order> }` rather than a raw array. This makes O(1) lookup and partial updates straightforward.

### 4. Implement with Production-Ready Patterns

Write the actual store implementation with correctness, debuggability, and performance in mind.

- **Type everything.** Define TypeScript interfaces for all state shapes before writing the store. `interface CartState { items: CartItem[]; couponCode: string | null; isCheckingOut: boolean }`. Never use `any` in store state.
- **Avoid reactive() for root store state in Pinia Setup Stores.** Use `ref()` for primitives and arrays. Use `reactive()` only for objects where you deliberately want deep reactivity on all nested properties and understand the identity caveats with `toRef`.
- **Use `$patch` for multi-property mutations.** Calling `store.count++; store.name = 'x'` triggers two separate reactivity updates. `store.$patch({ count: 1, name: 'x' })` batches them. Use the function form of `$patch` for mutations that depend on current state: `store.$patch((state) => { state.items.push(newItem) })`.
- **Action error handling** -- every async action must handle errors explicitly. Wrap in try/catch and set an error state property. Never let async actions throw silently. Pattern: set `isLoading = true` before the `await`, use `finally` to reset `isLoading = false`, catch to set `error = err.message`.
- **Getters are memoized** -- computed properties in Pinia are cached. Do not put API calls or side effects in getters. Keep getters as pure derivations of state: totals, filters, sorted lists.
- **Reset pattern** -- implement a `$reset()` override in Setup Stores (Pinia does not auto-generate it for Setup Stores). Store the initial state in a factory function: `const initialState = () => ({ count: 0, items: [] })`. In the reset action, call `Object.assign(state, initialState())`.

### 5. Connect Stores to Components Correctly

Misuse of Pinia/Vuex in components is a leading cause of reactivity bugs.

- **Pinia in components** -- always call `useCartStore()` inside `setup()` or `<script setup>`. Never call it at module level (breaks SSR). Destructure with `storeToRefs()` to preserve reactivity: `const { items, total } = storeToRefs(cartStore)`. Destructuring without `storeToRefs` produces non-reactive plain values -- this is one of the most common Pinia bugs.
- **Actions do not need storeToRefs** -- actions are plain functions and retain their binding. Destructure them directly: `const { addItem, removeItem } = cartStore`.
- **Vuex in components with Composition API** -- use `useStore()` from `vuex` and then `computed(() => store.getters['cart/total'])`. Do NOT use `mapState` / `mapGetters` in `setup()` -- they are Options API helpers and do not work correctly there.
- **Avoid watching entire stores** -- `watch(store, ...)` watches the entire store object and fires on any state change. Watch specific computed refs or `storeToRefs` outputs.
- **Component-local caching** -- if a component calls a store action that fetches data on mount, add a `loaded` flag to the store state to prevent redundant fetches when the component remounts. Pattern: `onMounted(() => { if (!store.isLoaded) store.fetchData() })`.

### 6. Handle Async State and Side Effects

Async state is where most production bugs originate. Apply these patterns rigorously.

- **Loading state granularity** -- a single `isLoading: boolean` is insufficient for components that make multiple parallel requests. Use `loadingStates: Record<string, boolean>` keyed by operation name, or a `Set<string>` of in-flight operation IDs.
- **Optimistic updates** -- for user-initiated mutations (liking a post, reordering a list), apply the state change immediately, then roll back in the catch block if the API call fails. Store a `previousState` snapshot before mutation for rollback.
- **Debouncing in actions** -- if an action is triggered by user input (search, autosave), implement debouncing inside the action using a module-level debounce timer or VueUse's `useDebounceFn`. Do NOT debounce in the component -- the debounce state will reset on component unmount.
- **Request cancellation** -- long-running fetch actions should accept and use an `AbortController`. Store the controller on the store instance (`this._abortController`) and cancel in a `cancelFetch` action. This prevents race conditions when parameters change rapidly.
- **Polling** -- implement polling with a `setInterval` stored in a module-level variable, started in an action and cleared in a `stopPolling` action. Always clear in `onUnmounted` or via a store `$dispose` subscription.

### 7. Test the Store in Isolation

Stores should be unit-testable without mounting components.

- **Pinia testing setup** -- use `createPinia()` and `setActivePinia()` in the `beforeEach` of each test file. This creates a fresh Pinia instance per test, preventing state leakage between tests.
- **Mock external dependencies** -- mock API modules (e.g., `vi.mock('@/api/cart')`) and assert that actions call the right API functions with the right arguments and set the correct state on success and failure.
- **Test state transitions directly** -- call actions and then assert on store state: `await cartStore.addItem(item); expect(cartStore.items).toHaveLength(1)`. No component mounting needed.
- **Test getters independently** -- set store state manually and assert getter output: `cartStore.$patch({ items: [{ price: 10, qty: 2 }] }); expect(cartStore.total).toBe(20)`.
- **Vuex testing** -- use `createStore` from `vuex` to instantiate a real store in tests. For module tests, create a store with only the module under test. Mock the HTTP layer (Axios, Fetch) with `vi.mock` or `msw`.
- **Pinia plugin testing** -- if using `pinia-plugin-persistedstate`, mock `localStorage` with `vi.stubGlobal('localStorage', createLocalStorageMock())` before creating the test Pinia.

### 8. Optimize and Monitor in Production

Apply performance and observability patterns before shipping.

- **Vue DevTools integration** -- Pinia integrates with Vue DevTools automatically. Name your stores with meaningful IDs (`'user'`, `'checkout'`) -- these appear as store labels in DevTools timeline. For Vuex, enable `strict: true` in development to catch direct state mutations outside mutations.
- **Bundle size** -- Pinia adds ~1.5KB gzipped to the bundle vs Vuex's ~3.5KB. For micro-frontends or performance-critical apps, this matters. Pinia stores are also tree-shakeable -- unused stores are not included in the bundle.
- **Subscription hooks** -- use `store.$subscribe((mutation, state) => { ... })` for cross-cutting concerns like analytics event firing, audit logging, or persistence to `sessionStorage`. Use `store.$onAction(({ name, after, onError }) => { ... })` for action-level instrumentation (timing, error reporting to Sentry).
- **Large list performance** -- storing thousands of records in Pinia triggers deep reactivity tracking overhead. For large datasets (1000+ items), store them as `shallowRef()` rather than `ref()`, and use `triggerRef()` after mutations to manually notify dependents. Alternatively, store large collections outside Vue's reactivity system and expose computed views of small subsets.
- **Memory leaks** -- stores created with `defineStore` are singletons by default. In SSR, a new Pinia instance must be created per request -- never share a Pinia instance across requests. In Nuxt 3, `@pinia/nuxt` handles this automatically.

---

## Output Format

When responding to a user, structure the output as follows based on what they need:

```markdown
## State Management Recommendation: [Project/Feature Name]

### Diagnosis
**State category:** [Local UI / Shared UI / Domain / Server/Async / Form]
**Scope:** [Component-local / Feature-scoped / App-global]
**Selected tool:** [ref/reactive / provide-inject composable / Pinia Setup Store / Pinia Options Store / Vuex 4 module]
**Rationale:** [2-3 sentences explaining the decision based on their specific context]

---

### Architecture Decision Matrix

| Criterion                  | provide/inject | Pinia Setup Store | Pinia Options Store | Vuex 4 Module |
|---------------------------|---------------|-------------------|---------------------|---------------|
| TypeScript ergonomics     | Excellent     | Excellent         | Good                | Fair          |
| DevTools support          | Partial       | Full              | Full                | Full          |
| SSR safety                | Manual        | Built-in          | Built-in            | Built-in      |
| Learning curve            | Low           | Medium            | Low                 | Medium        |
| Boilerplate               | Minimal       | Low               | Medium              | High          |
| Plugin ecosystem          | None          | Rich              | Rich                | Moderate      |
| Recommended for project   | [Yes/No]      | [Yes/No]          | [Yes/No]            | [Yes/No]      |

---

### Store Design

**File:** `src/stores/[domain].ts`
**Store ID:** `'[domain]'`
**State shape:**
```ts
interface [Domain]State {
  // List all state properties with types
}
```

---

### Implementation

```ts
// Full, runnable store implementation
```

---

### Component Integration

```vue
<!-- Full component example showing correct store usage -->
```

---

### Testing Strategy

```ts
// Full test suite skeleton
```

---

### Known Risks and Mitigations
| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| [specific risk] | High/Med/Low | [specific action] |
```

---

## Rules

1. **NEVER recommend Vuex 4 for new Vue 3 projects.** The Vue core team officially recommends Pinia as the successor to Vuex. Vuex 4 is maintenance-mode only. The only valid reason to use Vuex 4 in a new project is if the team is migrating an enormous existing Vuex 3 codebase and cannot justify a Pinia migration alongside the Vue 3 upgrade.

2. **NEVER destructure Pinia store state without `storeToRefs`.** `const { count } = useCounterStore()` produces a plain number that loses reactivity. This is the single most common Pinia bug in production codebases. Always use `const { count } = storeToRefs(useCounterStore())`.

3. **NEVER put API call logic directly in components.** All HTTP requests that affect shared state must live in store actions. Components call actions and read reactive state -- they do not manage loading flags, error messages, or response parsing directly. This is a testability and consistency constraint.

4. **NEVER mutate Pinia state outside of actions in production code.** Although Pinia allows direct mutation (unlike Vuex), restrict mutations to actions in all team environments. Enable `disableDevtoolsObservation: false` and instruct engineers to watch for out-of-action mutations in DevTools. In Vuex, `strict: true` enforces this with a runtime error.

5. **NEVER use `reactive()` for top-level store state in Pinia Setup Stores.** `reactive()` loses reactivity when spread (`...store`) and cannot be replaced wholesale. Use `ref()` for each top-level state property. The exception is when you deliberately need a reactive object with many nested properties that are always mutated together.

6. **ALWAYS define TypeScript interfaces for store state before implementing the store.** State shape must be explicit and versioned. Anonymous objects (`state: () => ({ items: [] })`) without type annotations create ambiguity about what `items` contains and cause silent type errors downstream.

7. **ALWAYS implement explicit error state in async actions.** The pattern `error: string | null = null` must be reset to `null` at the start of every action invocation, set in the catch block, and exposed as a getter-readable property. Components must be able to display error state without additional logic.

8. **NEVER store derived data in state.** If a value can be computed from other state (e.g., `cartTotal` computed from `cartItems`), it must be a getter/computed, not a state property. Storing derived data creates synchronization bugs when the source state changes but the derived state is not updated.

9. **NEVER call `useStore()` or `useXxxStore()` at the top level of a module file.** Store access must happen inside `setup()`, inside a component lifecycle hook, or inside an action -- never at module initialization time. Calling a store composable at module level will throw in SSR because no active Pinia instance exists during module evaluation.

10. **ALWAYS dispose of store subscriptions and polling intervals.** If a component or plugin registers a `$subscribe` or `$onAction` callback, it must call the returned unsubscribe function in `onUnmounted` or equivalent cleanup. Failure to unsubscribe causes memory leaks and ghost listeners that fire after the component is destroyed.

---

## Edge Cases

### SSR and Nuxt 3 State Hydration

In server-rendered Vue apps, state initialized on the server must be serialized and hydrated on the client without mismatch. With Pinia in Nuxt 3:
- The server creates a Pinia instance per request via `@pinia/nuxt`, serializes state into `__nuxt_state`, and the client hydrates from it.
- Stores that contain non-serializable values (class instances, functions, `Date` objects, circular references) will break hydration. Use plain JSON-serializable primitives only in SSR-exposed store state. For `Date` values, store as ISO strings and parse in getters.
- Stores that fetch data in `setup()` of a page component will fire on both server and client. Use `useAsyncData` or `useFetch` from Nuxt rather than store actions for initial data fetching in pages -- these composables handle deduplication automatically.
- For custom SSR (non-Nuxt), pass the Pinia instance via `app.use(pinia)` after creating it with `createPinia()`. Serialize state with `pinia.state.value` and rehydrate on the client by calling `pinia.state.value = window.__INITIAL_STATE__`.

### Migrating from Vuex 4 to Pinia

Large codebases cannot be migrated in a single PR. Use the interoperability bridge:
- Install Pinia alongside Vuex 4. Both can coexist in the same app.
- Migrate one Vuex module to a Pinia store at a time, starting with the most isolated module (no cross-module action calls).
- In modules that call actions in the module being migrated, temporarily call the Pinia store from Vuex actions using `useXxxStore()` (valid inside action functions).
- Remove the Vuex module after all consumers are updated. Remove Vuex entirely when all modules are migrated.
- Expect the migration to take 4-8 weeks for a codebase with 15+ Vuex modules. Do not rush it -- a broken migration is worse than staying on Vuex 4.

### Micro-Frontend and Module Federation

When multiple Vue micro-frontends share state:
- Each micro-frontend should own its Pinia instance and its stores. Do not share a Pinia instance across module federation boundaries -- this causes version conflicts and coupling.
- Use a shared event bus (a tiny pub/sub module versioned separately) for cross-micro-frontend communication rather than shared stores.
- If data truly must be shared (authenticated user, global notifications), fetch it independently in each micro-frontend's Pinia store, sourced from the same backend endpoint. Accept eventual consistency between MFEs.
- Pinia's `$subscribe` can sync state to `BroadcastChannel` for cross-tab and cross-MFE synchronization at the browser level without coupling store implementations.

### Large Normalized Dataset Performance

When a Pinia store holds 5,000+ records (e.g., a data grid, a chat message history, a large product catalog):
- Use `shallowRef` for the collection: `const items = shallowRef<Product[]>([])`. Vue will not deeply track every item's internal properties, reducing reactivity overhead significantly.
- Expose computed views rather than the full collection: `const pageItems = computed(() => items.value.slice(page.value * 50, (page.value + 1) * 50))`.
- After mutating `shallowRef` contents in-place (e.g., `items.value.push(x)`), call `triggerRef(items)` to notify dependents.
- For record lookup by ID, maintain a parallel `byId: shallowRef<Record<string, Product>>({})` map. Keep it in sync with the array via the mutation action. This gives O(1) lookup without scanning the array on every access.
- Benchmark with Vue DevTools performance profiling before and after -- the difference for 10,000+ items can be 60%+ reduction in update time.

### Persistent State and Cross-Tab Synchronization

When state must survive page refresh (`localStorage`) and stay in sync across browser tabs:
- Use `pinia-plugin-persistedstate`. Configure `storage: localStorage`, `paths: ['user.token', 'user.preferences']` -- never persist entire stores blindly. Sensitive data (tokens, PII) should use `sessionStorage` or be encrypted before persistence.
- For cross-tab sync, the plugin's `serializer` option combined with a `storage` adapter based on `BroadcastChannel` enables real-time sync. Alternatively, listen to the native `storage` event: `window.addEventListener('storage', (e) => { if (e.key === 'pinia/user') store.$patch(JSON.parse(e.newValue)) })`.
- Be aware of race conditions: if two tabs write to the same persisted key simultaneously, last-write-wins. For conflict-sensitive data (e.g., a shopping cart), prefer server-side persistence (write to API on change, read from API on load) over `localStorage`.

### Circular Store Dependencies

Two Pinia stores that import each other create a circular module dependency that causes `undefined` store references at runtime:
- `authStore` calling `userStore` and `userStore` calling `authStore` is a circular dependency.
- Resolution: import the dependent store inside the action function body, not at the top of the module. `async function fetchProfile() { const auth = useAuthStore(); ... }`. This defers the import until runtime when all modules are initialized.
- If the circularity is inherent to the domain model, consider a third `sessionStore` that both can import without circular dependency.
- Detect circular imports early by running `madge --circular src/stores/` in CI.

### State Hydration from URL / Query Params

For apps where UI state should be bookmarkable (filters, pagination, sort order):
- Store the source of truth in the URL (`/products?page=2&sort=price-asc&brand=nike`) and derive store state from it.
- Use `vue-router`'s `currentRoute` as a reactive source: `const page = computed(() => Number(route.query.page) || 1)`. Read from URL; write to URL via `router.push`.
- Do NOT duplicate URL state into a Pinia store -- this creates two sources of truth that diverge. The Pinia store should hold domain data (the actual product records) while the router holds UI navigation state.
- On initial load, parse URL params in a `onMounted` or route navigation guard and call the appropriate store action to fetch data for those params.

---

## Example

**Input:** "We're building a Vue 3 e-commerce checkout flow. We have a cart store that needs to persist across page refreshes, sync across tabs, handle promo code validation (async API call), and show per-item loading states for quantity updates. We use TypeScript and Pinia. What does the full implementation look like?"

---

### State Management Recommendation: E-Commerce Checkout Cart

#### Diagnosis
**State category:** Domain state (cart items, promo codes) + Async state (quantity update per item, promo validation)
**Scope:** App-global (persists across page refreshes, shared across tabs)
**Selected tool:** Pinia Setup Store with `pinia-plugin-persistedstate`
**Rationale:** The cart is a canonical domain store -- it outlives any single component, needs persistence, and has complex async actions. Setup Store syntax gives maximum TypeScript expressiveness and composability. Options Store was rejected because the async granularity (per-item loading states using a Map) is more naturally expressed with `ref<Map<>>()` than in the Options API style.

---

#### Architecture Decision Matrix

| Criterion                  | provide/inject | Pinia Setup Store | Pinia Options Store | Vuex 4 Module |
|---------------------------|---------------|-------------------|---------------------|---------------|
| TypeScript ergonomics     | Excellent     | Excellent         | Good                | Fair          |
| DevTools support          | Partial       | Full              | Full                | Full          |
| SSR safety                | Manual        | Built-in          | Built-in            | Built-in      |
| Learning curve            | Low           | Medium            | Low                 | Medium        |
| Boilerplate               | Minimal       | Low               | Medium              | High          |
| Plugin ecosystem          | None          | Rich              | Rich                | Moderate      |
| Recommended for project   | No            | **Yes**           | No                  | No            |

---

#### Store Design

**File:** `src/stores/cart.ts`
**Store ID:** `'cart'`

---

#### Implementation

```ts
// src/types/cart.ts
export interface CartItem {
  productId: string
  variantId: string
  name: string
  imageUrl: string
  unitPrice: number      // in cents to avoid floating point errors
  quantity: number
  maxQuantity: number    // stock ceiling for UI enforcement
}

export interface PromoCode {
  code: string
  discountType: 'percentage' | 'fixed'
  discountValue: number  // percentage 0-100 or fixed cents
  minimumOrderCents: number
}

export interface CartState {
  items: CartItem[]
  promoCode: PromoCode | null
  promoError: string | null
  isValidatingPromo: boolean
}
```

```ts
// src/stores/cart.ts
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { CartItem, PromoCode } from '@/types/cart'
import { validatePromoCode, updateCartItemQuantity } from '@/api/cart'

export const useCartStore = defineStore(
  'cart',
  () => {
    // ── State ─────────────────────────────────────────────────────────────
    const items = ref<CartItem[]>([])
    const promoCode = ref<PromoCode | null>(null)
    const promoError = ref<string | null>(null)
    const isValidatingPromo = ref(false)

    // Per-item loading state: productId+variantId composite key -> boolean
    // Using a Map avoids O(n) array scans and keeps the ref surface minimal
    const itemLoadingStates = ref<Map<string, boolean>>(new Map())

    // ── Private helpers ───────────────────────────────────────────────────
    const itemKey = (productId: string, variantId: string) =>
      `${productId}::${variantId}`

    const initialState = () => ({
      items: [] as CartItem[],
      promoCode: null as PromoCode | null,
      promoError: null as string | null,
    })

    // ── Getters ───────────────────────────────────────────────────────────
    const subtotalCents = computed(() =>
      items.value.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
    )

    const discountCents = computed(() => {
      if (!promoCode.value) return 0
      const promo = promoCode.value
      if (subtotalCents.value < promo.minimumOrderCents) return 0
      if (promo.discountType === 'percentage') {
        return Math.round(subtotalCents.value * (promo.discountValue / 100))
      }
      return Math.min(promo.discountValue, subtotalCents.value)
    })

    const totalCents = computed(() =>
      Math.max(0, subtotalCents.value - discountCents.value)
    )

    const itemCount = computed(() =>
      items.value.reduce((sum, item) => sum + item.quantity, 0)
    )

    const isItemLoading = computed(
      () => (productId: string, variantId: string) =>
        itemLoadingStates.value.get(itemKey(productId, variantId)) ?? false
    )

    const isCartEmpty = computed(() => items.value.length === 0)

    // ── Actions ───────────────────────────────────────────────────────────
    function addItem(item: CartItem): void {
      const existing = items.value.find(
        (i) => i.productId === item.productId && i.variantId === item.variantId
      )
      if (existing) {
        const newQty = Math.min(
          existing.quantity + item.quantity,
          existing.maxQuantity
        )
        existing.quantity = newQty
      } else {
        items.value.push({ ...item })
      }
    }

    function removeItem(productId: string, variantId: string): void {
      const index = items.value.findIndex(
        (i) => i.productId === productId && i.variantId === variantId
      )
      if (index !== -1) items.value.splice(index, 1)
    }

    async function updateQuantity(
      productId: string,
      variantId: string,
      newQuantity: number
    ): Promise<void> {
      const key = itemKey(productId, variantId)
      const item = items.value.find(
        (i) => i.productId === productId && i.variantId === variantId
      )
      if (!item) return
      if (newQuantity < 1) {
        removeItem(productId, variantId)
        return
      }
      if (newQuantity > item.maxQuantity) return

      // Optimistic update
      const previousQuantity = item.quantity
      item.quantity = newQuantity
      itemLoadingStates.value.set(key, true)

      try {
        await updateCartItemQuantity({ productId, variantId, quantity: newQuantity })
      } catch (err) {
        // Roll back on failure
        item.quantity = previousQuantity
        console.error('[CartStore] updateQuantity failed, rolled back', err)
      } finally {
        itemLoadingStates.value.set(key, false)
      }
    }

    async function applyPromoCode(code: string): Promise<void> {
      promoError.value = null
      isValidatingPromo.value = true

      try {
        const validated = await validatePromoCode(code, subtotalCents.value)
        promoCode.value = validated
      } catch (err: unknown) {
        promoCode.value = null
        promoError.value =
          err instanceof Error ? err.message : 'Invalid promo code'
      } finally {
        isValidatingPromo.value = false
      }
    }

    function removePromoCode(): void {
      promoCode.value = null
      promoError.value = null
    }

    function $reset(): void {
      const initial = initialState()
      items.value = initial.items
      promoCode.value = initial.promoCode
      promoError.value = initial.promoError
      itemLoadingStates.value.clear()
    }

    return {
      // State
      items,
      promoCode,
      promoError,
      isValidatingPromo,
      // Getters
      subtotalCents,
      discountCents,
      totalCents,
      itemCount,
      isItemLoading,
      isCartEmpty,
      // Actions
      addItem,
      removeItem,
      updateQuantity,
      applyPromoCode,
      removePromoCode,
      $reset,
    }
  },
  {
    // pinia-plugin-persistedstate config
    persist: {
      storage: localStorage,
      // Only persist user-meaningful state -- not loading flags, not errors
      paths: ['items', 'promoCode'],
    },
  }
)
```

---

#### Component Integration

```vue
<!-- src/components/CartLineItem.vue -->
<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useCartStore } from '@/stores/cart'
import type { CartItem } from '@/types/cart'

const props = defineProps<{ item: CartItem }>()

const cartStore = useCartStore()

// storeToRefs preserves reactivity for state and getters
const { isItemLoading } = storeToRefs(cartStore)

// Actions are plain functions -- no storeToRefs needed
const { updateQuantity, removeItem } = cartStore

const isLoading = computed(() =>
  isItemLoading.value(props.item.productId, props.item.variantId)
)

function onQuantityChange(event: Event) {
  const qty = Number((event.target as HTMLInputElement).value)
  updateQuantity(props.item.productId, props.item.variantId, qty)
}
</script>

<template>
  <div class="cart-line-item" :class="{ 'cart-line-item--loading': isLoading }">
    <img :src="item.imageUrl" :alt="item.name" />
    <span class="name">{{ item.name }}</span>
    <input
      type="number"
      :value="item.quantity"
      :min="1"
      :max="item.maxQuantity"
      :disabled="isLoading"
      @change="onQuantityChange"
    />
    <span class="price">{{ (item.unitPrice * item.quantity / 100).toFixed(2) }}</span>
    <button :disabled="isLoading" @click="removeItem(item.productId, item.variantId)">
      Remove
    </button>
    <span v-if="isLoading" class="spinner" aria-label="Updating quantity..." />
  </div>
</template>
```

---

#### Testing Strategy

```ts
// src/stores/__tests__/cart.spec.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCartStore } from '../cart'
import * as cartApi from '@/api/cart'

vi.mock('@/api/cart', () => ({
  validatePromoCode: vi.fn(),
  updateCartItemQuantity: vi.fn(),
}))

const mockItem = {
  productId: 'prod-1',
  variantId: 'var-sm',
  name: 'Test Shirt',
  imageUrl: '/img/shirt.jpg',
  unitPrice: 2999, // $29.99
  quantity: 1,
  maxQuantity: 5,
}

describe('useCartStore', () => {
  beforeEach(() => {
    // Fresh Pinia instance prevents state leakage between tests
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('adds an item to the cart', () => {
    const store = useCartStore()
    store.addItem(mockItem)
    expect(store.items).toHaveLength(1)
    expect(store.itemCount).toBe(1)
  })

  it('merges duplicate items instead of adding a second entry', () => {
    const store = useCartStore()
    store.addItem(mockItem)
    store.addItem({ ...mockItem, quantity: 2 })
    expect(store.items).toHaveLength(1)
    expect(store.items[0].quantity).toBe(3)
  })

  it('respects maxQuantity when merging', () => {
    const store = useCartStore()
    store.addItem({ ...mockItem, quantity: 4 })
    store.addItem({ ...mockItem, quantity: 3 }) // would be 7, max is 5
    expect(store.items[0].quantity).toBe(5)
  })

  it('calculates subtotal correctly', () => {
    const store = useCartStore()
    store.addItem({ ...mockItem, quantity: 2 }) // 2 * 2999 = 5998
    expect(store.subtotalCents).toBe(5998)
  })

  it('rolls back quantity on API failure', async () => {
    vi.mocked(cartApi.updateCartItemQuantity).mockRejectedValue(
      new Error('Network error')
    )
    const store = useCartStore()
    store.addItem(mockItem) // quantity: 1
    await store.updateQuantity('prod-1', 'var-sm', 3)
    // Should roll back to original quantity 1
    expect(store.items[0].quantity).toBe(1)
  })

  it('sets and clears per-item loading state during updateQuantity', async () => {
    vi.mocked(cartApi.updateCartItemQuantity).mockResolvedValue(undefined)
    const store = useCartStore()
    store.addItem(mockItem)

    const promise = store.updateQuantity('prod-1', 'var-sm', 2)
    expect(store.isItemLoading('prod-1', 'var-sm')).toBe(true)
    await promise
    expect(store.isItemLoading('prod-1', 'var-sm')).toBe(false)
  })

  it('applies a percentage promo code correctly', async () => {
    vi.mocked(cartApi.validatePromoCode).mockResolvedValue({
      code: 'SAVE10',
      discountType: 'percentage',
      discountValue: 10,
      minimumOrderCents: 0,
    })
    const store = useCartStore()
    store.addItem({ ...mockItem, quantity: 1 }) // $29.99
    await store.applyPromoCode('SAVE10')
    expect(store.discountCents).toBe(300) // 10% of 2999 = 299.9 -> 300
    expect(store.totalCents).toBe(2699)
  })

  it('sets promoError on invalid promo code', async () => {
    vi.mocked(cartApi.validatePromoCode).mockRejectedValue(
      new Error('Code expired')
    )
    const store = useCartStore()
    await store.applyPromoCode('EXPIRED')
    expect(store.promoCode).toBeNull()
    expect(store.promoError).toBe('Code expired')
  })

  it('resets all state via $reset', () => {
    const store = useCartStore()
    store.addItem(mockItem)
    store.$reset()
    expect(store.items).toHaveLength(0)
    expect(store.promoCode).toBeNull()
    expect(store.totalCents).toBe(0)
  })
})
```

---

#### Known Risks and Mitigations

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| `itemLoadingStates` Map is not persisted -- on refresh, all loading states correctly reset | Low (intended) | Document that loading state is ephemeral by design |
| Stale `maxQuantity` after stock changes | Medium | Refresh cart from API on checkout page mount, compare stock vs stored `maxQuantity` |
| Promo code still applied after cart items are removed that push subtotal below minimum | Medium | Add a `watchEffect` in the promo getter that returns 0 discount when `subtotalCents < promo.minimumOrderCents`; already handled in `discountCents` getter |
| `localStorage` state desync if cart schema changes between deployments | High | Version the persisted key: `key: 'cart-v2'`. On mismatch, `$reset()` and migrate gracefully |
| Two tabs simultaneously updating the same item quantity produce conflicting local states | Low-Medium | Use server-authoritative state on checkout page: fetch fresh cart from API before rendering payment step |
