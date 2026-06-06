---
name: svelte-runes-patterns
description: |
  Guides expert-level svelte 5 runes patterns implementation: javascript and frameworks decision frameworks, production-ready patterns, and concrete templates for svelte runes patterns workflows.
  Use when the user asks about svelte 5 runes patterns, svelte runes patterns configuration, or javascript best practices for svelte projects.
  Do NOT use when the user needs a different web development capability -- check sibling skills in the web development subcategory.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "javascript frameworks frontend best-practices"
  category: "web-development"
  subcategory: "web-development"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Svelte Runes Patterns

## When to Use

**Use this skill when:**
- The user is building a Svelte 5 component and asks how to manage reactive state using `$state`, `$derived`, or `$effect`
- The user is migrating from Svelte 4 stores (`writable`, `readable`, `derived`) to Svelte 5 runes and needs a conversion strategy
- The user asks about cross-component state sharing in Svelte 5 without a global store library
- The user wants to understand when to use `$effect` versus `$derived` versus event handlers for side effects
- The user is experiencing infinite reactive loops, stale values, or unexpected re-renders in a Svelte 5 application
- The user asks how to write reactive class instances, context-based state, or universal (isomorphic) reactive logic in Svelte 5
- The user wants to implement fine-grained reactivity for performance-sensitive UIs (large lists, real-time dashboards, canvas-driven interfaces)
- The user needs to lift state out of a component while preserving reactivity

**Do NOT use this skill when:**
- The user is on Svelte 4 or earlier and has not migrated -- use a Svelte 4 stores skill instead
- The user needs SvelteKit routing, server-side rendering, or `load` function patterns -- those are SvelteKit-specific concerns
- The user is asking about Svelte component composition patterns (slots, snippets, props API design) unrelated to reactivity
- The user needs build tooling configuration (Vite, SvelteKit adapter setup) -- check the build tooling skill
- The user is asking about testing Svelte components with Vitest or Playwright -- check the component testing skill
- The user needs TypeScript generic typing of Svelte components -- check the Svelte TypeScript skill
- The user is asking about general JavaScript reactivity patterns outside of Svelte (signals, MobX, Vue reactivity)
- The user needs CSS or animation patterns in Svelte -- check the Svelte transitions and animations skill

---

## Process

### 1. Identify the Reactivity Problem Category

Before writing any code, classify the user's problem into one of five categories. Each maps to a different rune strategy.

- **Local component state** -- a value that is owned and mutated only inside one component. Always reach for `$state` first.
- **Derived computation** -- a value that is always a pure function of other reactive values. Use `$derived` or `$derived.by` for complex multi-expression logic.
- **Side effects that synchronize with reactive state** -- DOM manipulations, `fetch` calls, subscriptions. Use `$effect` with explicit awareness of its dependency tracking rules.
- **Shared cross-component state** -- state that multiple unrelated components need to read and write. Use reactive class instances exported from `.svelte.js` modules, or Svelte context with `$state` at the parent.
- **Props and bindable values** -- data flowing in from parents or two-way bound to child components. Use `$props()` with optional destructuring defaults, and `$bindable()` for two-way bindings.

### 2. Apply the Correct Rune Primitive

For each category, use the following decision rules:

- **`$state(value)`** -- creates a deeply reactive proxy for objects and arrays. Mutations to nested properties (e.g., `list.push(item)`, `obj.name = "x"`) are tracked automatically. Use primitives directly: `let count = $state(0)`.
- **`$state.raw(value)`** -- creates a shallowly reactive value. Reassignment triggers updates; mutation does not. Use this for large data structures where you replace the whole value (e.g., sorted arrays, paginated data) and do not want deep proxy overhead.
- **`$derived(expr)`** -- a synchronous, lazy computation. Svelte caches the value and recomputes only when dependencies change. The expression must be side-effect-free.
- **`$derived.by(() => { ... })`** -- use when the derivation requires multiple statements, intermediate variables, or control flow (loops, conditionals). Still must be pure.
- **`$effect(() => { ... })`** -- runs after the component mounts and after each reactive update. Tracks any `$state` or `$derived` values accessed synchronously inside it. Return a cleanup function to tear down subscriptions or timers.
- **`$effect.pre(() => { ... })`** -- runs before the DOM is updated. Use for reading DOM layout measurements that need to happen before a paint, such as calculating element height before an animation.
- **`$props()`** -- destructure component props. Provide defaults inline: `let { count = 0, label = "Click me" } = $props()`. Props are read-only inside the child by default.
- **`$bindable(default)`** -- marks a prop as two-way bindable. Wrap the default value: `let { value = $bindable("") } = $props()`. The parent can then use `bind:value`.
- **`$inspect(value)`** -- development-only rune that logs reactive value changes with a stack trace. Remove before production. Accepts multiple arguments: `$inspect(count, list)`.

### 3. Structure Shared State Using `.svelte.js` Modules

When state must be shared across the component tree without threading props, follow this pattern:

- Create a file with the `.svelte.js` extension (or `.svelte.ts` for TypeScript). Runes are available in these files at the module level.
- Define a reactive class or a factory function that returns reactive objects. Do NOT export bare `$state` variables at module level if you need encapsulation -- they become module singletons and cannot be reset per-instance.
- For per-subtree state (not truly global), pass instances through Svelte context (`setContext` / `getContext`) with a typed symbol key.
- For truly global singletons (theme, auth, feature flags), export a class instance or a frozen reactive object.

```javascript
// counter.svelte.js
export class Counter {
  count = $state(0);
  step = $state(1);

  get doubled() {
    return $derived.by(() => this.count * 2);
  }

  increment() {
    this.count += this.step;
  }

  reset() {
    this.count = 0;
  }
}
```

- Do NOT use `$effect` inside class constructors -- class instances may be created outside the component lifecycle. Effects belong in component `<script>` blocks or in explicit setup/teardown methods called by the component.

### 4. Design Effects Correctly

`$effect` is the most commonly misused rune. Apply these rules precisely:

- **Dependency tracking is synchronous and automatic.** Any `$state` or `$derived` value read synchronously inside an effect body is tracked. Values read inside `setTimeout`, `Promise.then`, or event callbacks are NOT tracked.
- **Avoid writing to `$state` inside `$effect`.** This creates feedback loops. If you write to state inside an effect, Svelte reschedules the effect, which may write again -- an infinite loop. Use `$derived` instead when the pattern is "state A always determines state B".
- **Return a cleanup function** whenever the effect subscribes to external resources:

```javascript
$effect(() => {
  const controller = new AbortController();
  fetch(url, { signal: controller.signal })
    .then(r => r.json())
    .then(data => { result = data; });
  return () => controller.abort();
});
```

- **`$effect` runs after mount.** It does NOT run during server-side rendering. If you need SSR-safe initialization, do it in module-level code or inside `$derived`.
- **Batch multiple related effects** -- if two effects always run together and share dependencies, combine them into one. Separate effects for orthogonal concerns.

### 5. Handle Props and Two-Way Binding

- Always destructure `$props()` at the top of the script block, before any other reactive declarations.
- Provide sensible defaults for every prop to avoid undefined errors: `let { items = [], onSelect = () => {} } = $props()`.
- Use `$bindable()` sparingly -- only when the parent genuinely needs two-way synchronization (form inputs, controlled components). Prefer callback props (`onChange`) for one-directional data flow when that is clearer.
- For rest props (spread attributes to a root element), use the rest syntax: `let { class: className, ...attrs } = $props()`.
- Do NOT destructure props with renaming and then attempt to reassign -- `$bindable` is required for any prop the component writes back to.

### 6. Migrate from Svelte 4 Stores

Map each Svelte 4 store type to its Svelte 5 rune equivalent:

| Svelte 4 | Svelte 5 Equivalent | Notes |
|---|---|---|
| `writable(value)` | `$state(value)` in `.svelte.js` | Exported from a shared module |
| `readable(value, start)` | `$state` + `$effect` setup/teardown | Effect handles the subscription |
| `derived(store, fn)` | `$derived(() => fn(value))` | Pure function of other `$state` |
| `get(store)` | Direct variable access | No `get()` helper needed |
| `$store` auto-subscription | Direct variable access | No `$` prefix needed in runes mode |
| `store.update(fn)` | `value = fn(value)` or method call | Mutate directly |

- Svelte 4 stores still work in Svelte 5 components. Migrate incrementally -- start with new state, then port store-dependent logic.
- In runes mode (files with `<svelte:options runes={true} />` or the project-level `runes: true` Svelte config), the `$` auto-subscription syntax is unavailable.

### 7. Validate and Debug Reactive Graphs

- Use `$inspect(value)` during development to trace when and why values change. It prints the value and a stack trace on every change.
- Watch for **diamond dependencies** -- `$derived` A and `$derived` B both depend on `$state` X; `$derived` C depends on both A and B. Svelte's fine-grained reactivity resolves these correctly, but be aware that a single change to X triggers a single synchronous recomputation, not a cascade.
- If a component re-renders more than expected, add `$inspect` to each `$derived` value to identify which dependency is changing.
- Check for accidental reactivity: accessing a `$state` object inside a non-reactive context (a regular function called outside an effect or template) returns the current value but does NOT subscribe. This is intentional -- only template expressions, `$derived`, and `$effect` bodies track dependencies.
- For TypeScript projects, `$state`, `$derived`, and `$props` are fully typed by inference. Annotate explicitly when inference fails: `let items = $state<Item[]>([])`.

### 8. Apply Performance Patterns for Large-Scale UIs

- Use `$state.raw` for arrays that are always replaced wholesale (sorted results, paginated pages). The deep proxy from `$state` has overhead on large arrays accessed in tight loops.
- Prefer `$derived` over `$effect` for computed values -- `$derived` is lazy (only computes when read) while `$effect` runs eagerly on every change.
- For list rendering, assign stable keys using `{#each items as item (item.id)}`. Without a key, Svelte destroys and recreates DOM nodes on reorder.
- For very large lists (1000+ items), combine `$state.raw` with virtualization libraries (e.g., svelte-virtual or a custom `IntersectionObserver`-based solution) -- runes do not automatically virtualize DOM.
- Avoid creating new objects or arrays inside `$derived` expressions if they are compared by reference downstream -- the derived value changes on every computation even if the data is identical. Use a stable reference or memoize with a custom equality check.

---

## Output Format

When helping a user with a Svelte 5 runes question, structure your response as follows:

```
## Problem Classification
[One sentence identifying which reactivity category this falls into]

## Recommended Rune(s)
[The specific rune(s) to use and why, with trade-offs if alternatives exist]

## Implementation

### Component Code
```svelte
<script>
  // Rune declarations at top
  // Props destructuring first ($props)
  // State declarations ($state)
  // Derived values ($derived)
  // Effects last ($effect)
</script>

<!-- Template -->
```

### Shared State Module (if applicable)
```javascript
// filename.svelte.js
// Exported class or factory function
```

## Key Decisions
| Decision | Choice | Rationale |
|---|---|---|
| [decision point] | [choice made] | [why] |

## Common Mistakes to Avoid
- [Specific anti-pattern relevant to this use case]
- [Another anti-pattern]

## Migration Note (if applicable)
[How this differs from Svelte 4 and what to update]
```

---

## Rules

1. **NEVER use `$state` at the top level of a `.svelte.js` module without wrapping it in a class or function** -- top-level module state is a true singleton shared across all component instances and all users in SSR environments. This causes state leakage between requests.

2. **NEVER write to reactive state inside `$derived`** -- `$derived` must be a pure computation. Writing to `$state` inside a `$derived` block causes undefined behavior and Svelte will warn in development. If you need to produce a side effect, use `$effect`.

3. **ALWAYS return a cleanup function from `$effect` when it creates subscriptions, timers, or event listeners** -- failing to clean up causes memory leaks and stale closures that update state after the component unmounts.

4. **NEVER read reactive values inside asynchronous callbacks within `$effect` and expect them to be tracked** -- dependency tracking ends at the first `await`. Capture the values synchronously before any async operation if you need to re-run the effect when they change.

5. **ALWAYS call `$props()` exactly once at the top of the component script block** -- calling it multiple times or inside conditional blocks is not supported and produces errors.

6. **NEVER use `$effect` as a substitute for `$derived`** -- if your effect only reads state and writes another piece of state, that is a derived value. Use `$derived`. Reserve `$effect` for genuine external side effects (DOM, network, subscriptions).

7. **ALWAYS use `$state.raw` for data that is large (objects with 100+ properties, arrays with 1000+ elements) and replaced atomically** -- the deep reactive proxy adds per-property overhead that compounds at scale. Profile with Chrome DevTools Performance tab if unsure.

8. **NEVER access `$inspect` in production builds** -- `$inspect` is a development-only tool. Svelte strips it in production builds automatically, but relying on its output in production code paths is a bug.

9. **ALWAYS use a typed Symbol as the context key when sharing reactive instances via `setContext`/`getContext`** -- string keys collide across library boundaries. Use `const KEY = Symbol('myFeatureContext')` in a shared constants file.

10. **NEVER mutate props directly inside a child component unless the prop is declared with `$bindable()`** -- direct prop mutation is silently ignored or throws a runtime error in strict mode. Use callback props or `$bindable` explicitly.

---

## Edge Cases

### Reactive State in SSR (SvelteKit)

In SvelteKit with server-side rendering, components run on the server where there is no DOM and no persistent component lifecycle. Rules to follow:

- `$effect` and `$effect.pre` do NOT run during SSR. Do not depend on them for initial data fetching -- use SvelteKit `load` functions instead.
- Module-level singletons in `.svelte.js` files are shared across all server requests in a single Node.js process. Never store user-specific data (auth state, session data) in module-level `$state` singletons. Use context or per-request stores.
- `$derived` values run fine on the server since they are pure computations.
- For conditional client-only behavior, check `typeof window !== 'undefined'` inside effects or use the SvelteKit `browser` import from `$app/environment`.

### Infinite Reactive Loops

Symptom: the browser tab freezes or shows a "Maximum update depth exceeded" style error. Cause: an `$effect` that writes to a `$state` value it also reads.

Resolution steps:
1. Identify the effect writing to state. Add `$inspect` to the written value to see how often it changes.
2. Check if the write is conditional -- if the new value equals the current value, Svelte will skip the update, breaking the loop. Add an equality guard: `if (newValue !== currentValue) { currentValue = newValue; }`.
3. Better: determine if the written value is actually a derived value of other state, and replace the effect with `$derived`.
4. If the effect must write to state for a valid side effect (e.g., normalizing user input), use `$effect.pre` with explicit early-exit conditions.

### Migrating a Component Using Multiple Stores

A Svelte 4 component that subscribes to 3+ stores presents a migration challenge because store subscriptions were transparent (`$storeName` syntax). In runes mode:

- Convert each `writable` store to a `.svelte.js` module exporting a class with the equivalent state and methods.
- Import the class and instantiate it -- either at module level (singleton) or in context (per-subtree).
- Replace all `$storeName.property` accesses with direct property access on the imported instance.
- Replace `storeName.update(fn)` calls with direct method calls or property assignments.
- Migrate one store at a time in separate commits. Svelte 4 stores and Svelte 5 runes coexist during migration.

### Class Instances with Reactive Getters

Using `$derived` inside a class body requires care because `$derived` returns a value, not a getter automatically:

```javascript
// WRONG -- $derived is not a class field getter
class Timer {
  elapsed = $state(0);
  formatted = $derived(`${this.elapsed}s`); // This does not work as expected in a class
}

// CORRECT -- use a getter with $derived.by inside the get block
class Timer {
  elapsed = $state(0);
  get formatted() {
    return `${this.elapsed}s`; // Plain getter, reactive because it reads $state
  }
}
```

Plain getters on class instances that read `$state` properties ARE reactive in templates and `$derived` computations because Svelte tracks property access on reactive objects. No `$derived` wrapper is needed inside a class getter that reads `this.someState`.

### Testing Runes-Based State Modules

`.svelte.js` modules with runes cannot be unit-tested with plain Vitest without a Svelte compiler step because `$state`, `$derived`, etc. are compiler transforms, not runtime functions. Solutions:

- Configure `vitest.config.js` to include `.svelte.js` in the Svelte plugin transform list: `svelte({ extensions: ['.svelte', '.svelte.js'] })`.
- Write component-level tests using `@testing-library/svelte` and mount a thin wrapper component that uses the shared state module -- test behavior through the component interface rather than the module directly.
- For pure business logic that does not need reactivity, extract it into a plain `.js` file. Only put reactive state in `.svelte.js`.

### Reactive State with WebSocket or EventSource Subscriptions

Long-lived connections that push data need careful effect lifecycle management:

```javascript
$effect(() => {
  const ws = new WebSocket(`wss://api.example.com/feed?channel=${channelId}`);
  // channelId must be $state or $derived for the effect to re-run when it changes

  ws.addEventListener('message', (event) => {
    const data = JSON.parse(event.data);
    messages = [...messages, data]; // messages is $state
  });

  ws.addEventListener('error', () => {
    connectionStatus = 'error'; // connectionStatus is $state
  });

  return () => {
    ws.close();
  };
});
```

The `channelId` read inside the effect body registers as a dependency. When `channelId` changes, Svelte runs the cleanup (closing the old WebSocket) and re-runs the effect (opening a new one). This is the correct pattern -- do NOT manage connection lifecycle manually with separate open/close effects.

### Runes in Non-Component TypeScript Files (.svelte.ts)

Runes work in `.svelte.ts` files the same way they work in `.svelte.js`. The TypeScript compiler alone cannot process runes -- the Svelte compiler runs first, then TypeScript. Ensure:

- `tsconfig.json` does NOT include `.svelte.js` or `.svelte.ts` files in `include` with `isolatedModules: true` without the Svelte preprocessor in the chain.
- `$state<T>(value)` accepts a type parameter for explicit typing: `let users = $state<User[]>([])`.
- `$derived` infers its return type automatically from the expression.
- `$props()` infers prop types from the destructuring with default values. For complex types, declare an interface and use `$props() as MyProps`.

---

## Example

**Input:** "I'm building a shopping cart feature in Svelte 5. I have a `CartItem` type with `id`, `name`, `price`, and `quantity`. I need: a shared cart state module, a cart item component that can update quantity and remove itself, a cart summary component showing total, and the whole thing needs to work with SvelteKit SSR."

---

**Output:**

## Problem Classification

This is a **shared cross-component state** problem -- the cart state must be readable and mutable from unrelated components (item list, cart summary, header badge count) without prop drilling. SSR compatibility requires avoiding module-level singletons.

## Recommended Runes

- `$state` inside a class for cart item collection (mutable, deeply tracked)
- `$state.raw` is NOT appropriate here -- we mutate individual items (quantity changes) rather than replacing the array wholesale
- Plain class getters for derived totals (reactive without `$derived` wrapper needed inside the class)
- Svelte context (`setContext`/`getContext`) to pass the cart instance per-page-load, preventing SSR request bleeding

## Implementation

### Shared Cart State Module

```javascript
// src/lib/cart.svelte.js

export class Cart {
  /** @type {CartItem[]} */
  items = $state([]);

  get totalItems() {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  get subtotal() {
    return this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  get formattedSubtotal() {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(this.subtotal);
  }

  /**
   * @param {{ id: string, name: string, price: number }} product
   */
  addItem(product) {
    const existing = this.items.find(i => i.id === product.id);
    if (existing) {
      existing.quantity += 1;
    } else {
      this.items.push({ ...product, quantity: 1 });
    }
  }

  /**
   * @param {string} id
   * @param {number} quantity
   */
  updateQuantity(id, quantity) {
    if (quantity <= 0) {
      this.removeItem(id);
      return;
    }
    const item = this.items.find(i => i.id === id);
    if (item) item.quantity = quantity;
  }

  /** @param {string} id */
  removeItem(id) {
    this.items = this.items.filter(i => i.id !== id);
  }

  clear() {
    this.items = [];
  }
}
```

### Context Setup (SvelteKit Root Layout)

```svelte
<!-- src/routes/+layout.svelte -->
<script>
  import { setContext } from 'svelte';
  import { Cart } from '$lib/cart.svelte.js';

  // Create a new Cart instance per render (SSR-safe -- not a singleton)
  const cart = new Cart();

  // Use a Symbol key to avoid collisions with library context
  export const CART_KEY = Symbol('cart');
  setContext(CART_KEY, cart);

  let { children } = $props();
</script>

{@render children()}
```

### Context Access Helper

```javascript
// src/lib/useCart.svelte.js
import { getContext } from 'svelte';
import { CART_KEY } from '../routes/+layout.svelte';

/** @returns {import('./cart.svelte.js').Cart} */
export function useCart() {
  const cart = getContext(CART_KEY);
  if (!cart) {
    throw new Error('useCart must be called within a component tree that has setContext(CART_KEY)');
  }
  return cart;
}
```

### Cart Item Component

```svelte
<!-- src/lib/components/CartItem.svelte -->
<script>
  import { useCart } from '$lib/useCart.svelte.js';

  let { item } = $props();
  // item shape: { id: string, name: string, price: number, quantity: number }

  const cart = useCart();

  const formattedPrice = $derived(
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
      .format(item.price * item.quantity)
  );

  function handleQuantityChange(event) {
    const newQty = parseInt(event.target.value, 10);
    if (!isNaN(newQty)) {
      cart.updateQuantity(item.id, newQty);
    }
  }
</script>

<li class="cart-item">
  <span class="cart-item__name">{item.name}</span>
  <label class="cart-item__qty">
    <span class="sr-only">Quantity for {item.name}</span>
    <input
      type="number"
      min="1"
      max="99"
      value={item.quantity}
      onchange={handleQuantityChange}
    />
  </label>
  <span class="cart-item__price">{formattedPrice}</span>
  <button
    type="button"
    aria-label="Remove {item.name} from cart"
    onclick={() => cart.removeItem(item.id)}
  >
    Remove
  </button>
</li>
```

### Cart Summary Component

```svelte
<!-- src/lib/components/CartSummary.svelte -->
<script>
  import { useCart } from '$lib/useCart.svelte.js';
  import CartItem from './CartItem.svelte';

  const cart = useCart();
</script>

{#if cart.items.length === 0}
  <p class="cart-summary--empty">Your cart is empty.</p>
{:else}
  <section class="cart-summary" aria-label="Shopping cart">
    <h2>Cart ({cart.totalItems} {cart.totalItems === 1 ? 'item' : 'items'})</h2>
    <ul class="cart-summary__list">
      {#each cart.items as item (item.id)}
        <CartItem {item} />
      {/each}
    </ul>
    <footer class="cart-summary__footer">
      <p class="cart-summary__subtotal">
        Subtotal: <strong>{cart.formattedSubtotal}</strong>
      </p>
      <button type="button" onclick={() => cart.clear()}>Clear cart</button>
      <a href="/checkout">Proceed to checkout</a>
    </footer>
  </section>
{/if}
```

## Key Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Singleton vs. context | Context (`setContext`) | Prevents state leakage between SSR requests -- each render gets a fresh `Cart` instance |
| `$state` vs. `$state.raw` | `$state` | Individual item quantity mutations are tracked; `$state.raw` would miss `.quantity =` writes |
| Derived totals | Plain class getters | Getters reading `$state` properties are reactive in templates without `$derived` wrapper; avoids redundancy |
| `removeItem` via `filter` | Replace array reference | `this.items = this.items.filter(...)` triggers reactivity; `splice` mutates in place and DOES work with `$state`, but `filter` is clearer |
| Quantity update clamping | Delegate to `updateQuantity` | Centralizes the zero-quantity-means-remove rule; components do not implement business logic |
| Formatted currency | `Intl.NumberFormat` in derived | SSR-compatible, locale-aware, no external dependency |

## Common Mistakes to Avoid

- **Do NOT export a `Cart` singleton at module level in `cart.svelte.js`.** `export const cart = new Cart()` creates one cart shared across all SSR requests in the same Node.js process. Different users' carts would be mixed together. Always instantiate in the layout and distribute via context.
- **Do NOT use `$effect` to compute the subtotal** -- the subtotal is a pure function of `items`. Using an effect to write `subtotal = items.reduce(...)` creates unnecessary state and a potential loop. The class getter is always in sync automatically.
- **Do NOT forget stable keys in `{#each}` loops** -- `{#each cart.items as item (item.id)}` is required. Without `(item.id)`, Svelte patches list items by index, destroying and recreating DOM on any reorder or splice, losing input focus and triggering incorrect animations.
- **Do NOT read `cart.items.length` and `cart.items[0].name` in separate template locations without understanding they both track the same reactive array** -- this is fine and correct, but developers sometimes add redundant `$derived` wrappers thinking they need to "cache" the access. They do not.

## Migration Note

In Svelte 4, this cart would be a `writable` store (`writable<CartItem[]>([])`), distributed via context as a plain store. Components subscribed with `$cart`. The migration path is:

1. Replace `writable([])` with a `Cart` class instance containing `items = $state([])`
2. Replace `$cart` auto-subscriptions with direct `cart.items` access
3. Replace `cart.update(items => [...items, newItem])` with `cart.addItem(product)` method calls
4. Remove all `import { writable, derived, get } from 'svelte/store'` imports from the module
