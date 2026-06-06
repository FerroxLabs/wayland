---
name: angular-signals-patterns
description: |
  Guides expert-level angular signals patterns implementation: typescript and frameworks decision frameworks, production-ready patterns, and concrete templates for angular signals patterns workflows.
  Use when the user asks about angular signals patterns, angular signals patterns configuration, or typescript best practices for angular projects.
  Do NOT use when the user needs a different web development capability -- check sibling skills in the web development subcategory.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "typescript frameworks frontend architecture"
  category: "web-development"
  subcategory: "web-development"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Angular Signals Patterns

## When to Use

**Use this skill when:**
- User asks how to implement Angular Signals (introduced in Angular 16, stabilized in Angular 17+) for reactive state management in components, services, or application-wide stores
- User wants to replace RxJS-heavy component state with signal-based reactivity and needs guidance on which patterns to use and when
- User asks about `signal()`, `computed()`, `effect()`, `toSignal()`, `toObservable()`, or the `input()` / `output()` / `model()` signal-based component APIs introduced in Angular 17--18
- User needs to design a signal-based state management architecture -- local component state, feature-level stores, or global application state using the SignalStore pattern from NgRx or custom implementations
- User is migrating a component or service from `BehaviorSubject`-based patterns to signals and needs a concrete migration path with interop strategies
- User wants to understand signal equality functions, custom comparators, or how to prevent unnecessary recomputations in deep object graphs
- User asks about `linkedSignal()`, resource signals, or the experimental async signal primitives introduced in Angular 18+
- User is debugging unexpected signal re-evaluations, glitch-prone computed chains, or `effect()` infinite loops

**Do NOT use this skill when:**
- User is working with Angular versions below 16 -- signals do not exist; redirect to RxJS observable patterns for Angular state management
- User needs general RxJS patterns not related to signal interop -- check the rxjs-patterns skill in this subcategory
- User is building with React, Vue, Svelte, or Solid.js, even though those frameworks have analogous reactive primitives -- the APIs and scheduling semantics differ fundamentally
- User needs Angular component architecture guidance unrelated to reactivity (routing, lazy loading, module organization) -- check the angular-architecture skill
- User is asking about NgRx Actions/Reducers/Effects in the traditional Redux pattern -- check the ngrx-redux-patterns skill unless they specifically ask about NgRx SignalStore
- User needs server-side rendering hydration strategies in Angular -- signals interact with SSR in specific ways covered by the angular-ssr skill

---

## Process

### 1. Identify the Reactivity Scope and State Ownership

Before writing any signal code, classify what kind of state is being managed and where it lives.

- **Local component state** -- data that only one component needs, never shared upward or across routes. Use `signal()` directly in the component class. No service injection needed.
- **Shared feature state** -- data shared between sibling or parent/child components within one route or feature area. Use an injectable service with `signal()` properties, scoped with `providedIn: 'root'` or a feature-level `providers` array.
- **Global application state** -- user session, auth tokens, app configuration, notifications. Use a dedicated signal-based store class, either hand-rolled or via NgRx SignalStore.
- **Derived/computed state** -- anything that is a pure function of other signals. Always use `computed()` -- never store derived state in a writable signal and keep it synchronized with `effect()`.
- Ask the user: "Is this state read by more than one component? Does it need to survive navigation? Does it need undo/redo or devtools inspection?" These answers determine the appropriate pattern tier.

### 2. Define the Signal Graph Structure

Design the signal dependency graph before implementation to avoid creating brittle or cyclical dependencies.

- Draw the full state as a directed acyclic graph (DAG): writable signals are leaf inputs, `computed()` signals are intermediate nodes, template bindings and `effect()` calls are terminal sinks.
- Identify which signals are "source of truth" (`WritableSignal<T>`) vs. derived projections (`Signal<T>` from `computed()`).
- Keep the graph shallow: chains longer than 3--4 levels of `computed()` calls become difficult to debug and can introduce latency in recomputation during a single change detection cycle.
- Never make a computed signal depend on a `WritableSignal` that the computed signal's consumer also writes to -- this creates a logical cycle that Angular's glitch-free algorithm cannot resolve cleanly.
- For collections, decide whether the signal holds the entire array (`signal<Item[]>([])`) or a map (`signal<Map<string, Item>>(new Map())`) based on how updates will be performed. Replacing the entire array on every mutation is correct but causes `computed()` consumers of individual items to recompute even when unrelated items change.

### 3. Implement Writable Signals with Correct Mutation Patterns

Signal mutations must be performed correctly to trigger reactivity and avoid stale references.

- Use `signal<T>(initialValue)` with an explicit generic type annotation always -- do not rely on inference when the initial value is `null`, `undefined`, or an empty array, as inference will produce too-narrow types.
  ```typescript
  // BAD: infers signal<never[]>
  const items = signal([]);
  // GOOD
  const items = signal<Item[]>([]);
  ```
- Use `.set(newValue)` when replacing the entire value.
- Use `.update(prev => newValue)` when the new value depends on the previous value -- this is the correct pattern for array mutations and counter increments.
  ```typescript
  items.update(prev => [...prev, newItem]);   // append
  items.update(prev => prev.filter(i => i.id !== id)); // remove
  count.update(n => n + 1);                   // increment
  ```
- Never mutate the signal's value in place (e.g., `items().push(x)`) -- this does not notify Angular's reactive graph and produces stale UI.
- Use `.mutate()` only if available in your Angular version (it was removed in Angular 17.1 in favor of always-immutable updates with `.update()`). If the codebase is on 16.x, `.mutate()` exists but signals the team to plan for removal.
- For deep objects, use a custom equality function to prevent re-renders when semantically identical objects are produced:
  ```typescript
  const config = signal<Config>(initialConfig, {
    equal: (a, b) => JSON.stringify(a) === JSON.stringify(b)
  });
  ```
  Use `JSON.stringify` only for small, serializable objects. For large objects, write a structural comparator or use a library like `fast-deep-equal`.

### 4. Build Computed Signals for Derived State

`computed()` is the most powerful primitive for keeping derived state in sync without explicit subscription management.

- Every `computed()` call creates a memoized, lazy value. It only recomputes when at least one of its signal dependencies has changed since the last read.
- Express computed signals as pure functions -- no HTTP calls, no DOM manipulation, no logging inside `computed()`. Those belong in `effect()`.
  ```typescript
  readonly filteredItems = computed(() =>
    this.items().filter(item => item.active && item.category === this.selectedCategory())
  );
  readonly totalPrice = computed(() =>
    this.cartItems().reduce((sum, item) => sum + item.price * item.quantity, 0)
  );
  ```
- Use `computed()` for template-facing boolean flags: `readonly isLoading = computed(() => this.status() === 'loading')`. This is cleaner than storing a separate `isLoading` writable signal.
- Computed signals are not writable -- if you find yourself wanting to write to a computed value, you have identified a missing writable signal that the computed should depend on.
- Computed signals are synchronous. They cannot await Promises or subscribe to Observables. For async derived values, use `toSignal()` wrapping an Observable pipeline, or the experimental `resource()` API in Angular 18+.
- Avoid computeds that depend on more than 6--8 distinct signals -- this is a code smell indicating the component or service has too many responsibilities. Split the state.

### 5. Use `effect()` Correctly for Side Effects

`effect()` is the most commonly misused signal API. Apply it with discipline.

- `effect()` runs once immediately after creation and again whenever any signal it reads changes. It runs inside the Angular change detection context.
- Legitimate uses for `effect()`:
  - Synchronizing signal state to `localStorage` or `sessionStorage`
  - Logging/analytics when specific signals change
  - Integrating with imperative third-party libraries (e.g., setting a chart library's data when a signal changes)
  - Triggering router navigation based on auth state changes
- Illegitimate uses that indicate a design problem:
  - Writing to a signal inside `effect()` to keep two signals synchronized -- use `computed()` instead
  - Making HTTP calls inside `effect()` -- use an Observable or `resource()` API instead
  - Replacing `ngOnChanges` with `effect()` -- use signal-based `input()` with `computed()` instead
- To write to a signal inside an `effect()` when truly necessary (rare), use the `allowSignalWrites` option:
  ```typescript
  effect(() => {
    const value = this.externalSignal();
    this.localSignal.set(processValue(value));
  }, { allowSignalWrites: true });
  ```
  This option exists to escape hatches, not as a default pattern. If you use it more than once per class, reconsider the design.
- Always clean up `effect()` by using the `DestroyRef` injection or calling the returned cleanup function. In components and directives, effects registered in the constructor are cleaned up automatically on destroy. In services, use `inject(DestroyRef).onDestroy()` to clean up manually created effects.
- Never create `effect()` calls outside of an injection context (constructor, field initializer, or a function called during injection) without explicitly providing an injector.

### 6. Wire Signal-Based Component Inputs and Outputs

Angular 17.1+ introduced signal-based `input()`, `output()`, and `model()` APIs that replace `@Input()`, `@Output()`, and `@Input()/@Output()` pairs.

- Use `input<T>()` for required inputs and `input<T>(defaultValue)` for optional inputs with defaults:
  ```typescript
  readonly userId = input.required<string>();          // throws if not provided
  readonly pageSize = input<number>(25);               // optional, defaults to 25
  ```
- Signal inputs are `InputSignal<T>`, which is a read-only `Signal<T>`. Use them in `computed()` and templates exactly like writable signals: `this.userId()`.
- Use `model<T>()` for two-way binding -- it creates a `ModelSignal<T>` that is both readable and writable, generating an implicit `(valueChange)` event output:
  ```typescript
  readonly selectedDate = model<Date | null>(null);
  // Parent binds with [(selectedDate)]="parentDate"
  // Child updates with: this.selectedDate.set(newDate)
  ```
- Use `output<T>()` for event emissions -- it replaces `EventEmitter` and is not a signal but an `OutputEmitterRef`:
  ```typescript
  readonly itemSelected = output<Item>();
  // Emit with: this.itemSelected.emit(item)
  ```
- Never mix `@Input()` decorators with `input()` signals in the same component -- it is confusing and produces maintenance problems. Migrate the entire component at once.
- `input()` signals are not writable from inside the component -- only the parent can change them. If you need writable internal state that mirrors an input, derive it: `readonly internalValue = signal(this.externalInput())`.

### 7. Implement Signal-Based Service Stores

For feature or global state, implement a signal store as a plain injectable service or using NgRx SignalStore.

**Hand-rolled signal store pattern:**
```typescript
@Injectable({ providedIn: 'root' })
export class CartStore {
  // Private writable signals -- only this store mutates state
  private readonly _items = signal<CartItem[]>([]);
  private readonly _status = signal<'idle' | 'loading' | 'error'>('idle');

  // Public read-only projections
  readonly items: Signal<CartItem[]> = this._items.asReadonly();
  readonly status: Signal<'idle' | 'loading' | 'error'> = this._status.asReadonly();

  // Computed selectors
  readonly totalItems = computed(() => this._items().reduce((sum, i) => sum + i.quantity, 0));
  readonly totalPrice = computed(() => this._items().reduce((sum, i) => sum + i.price * i.quantity, 0));
  readonly isEmpty = computed(() => this._items().length === 0);

  // Commands (methods that mutate state)
  addItem(item: CartItem): void {
    this._items.update(items => {
      const existing = items.find(i => i.productId === item.productId);
      if (existing) {
        return items.map(i => i.productId === item.productId
          ? { ...i, quantity: i.quantity + item.quantity }
          : i
        );
      }
      return [...items, item];
    });
  }

  removeItem(productId: string): void {
    this._items.update(items => items.filter(i => i.productId !== productId));
  }

  clearCart(): void {
    this._items.set([]);
  }
}
```

- Always expose state as `.asReadonly()` signals from services -- components should never directly mutate service-owned signals.
- Group store methods into "commands" (state mutations) and "queries" (computed projections). Commands are methods; queries are `computed()` properties.
- For async operations, integrate with `toSignal()` and manage loading/error state explicitly:
  ```typescript
  loadItems(): void {
    this._status.set('loading');
    this.http.get<CartItem[]>('/api/cart').pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: items => { this._items.set(items); this._status.set('idle'); },
      error: () => this._status.set('error')
    });
  }
  ```

### 8. Integrate Signals with RxJS Using Interop APIs

Signals and Observables coexist in Angular -- know the correct bridge for each direction.

- **Observable to Signal** -- use `toSignal(observable$, options)`:
  ```typescript
  readonly searchResults = toSignal(
    this.searchQuery$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(query => this.searchService.search(query))
    ),
    { initialValue: [] }  // avoids Signal<T | undefined>
  );
  ```
  Always provide `initialValue` unless the observable is guaranteed to emit synchronously, because `toSignal()` without `initialValue` creates `Signal<T | undefined>` and causes undefined-access errors in templates.
- **Signal to Observable** -- use `toObservable(signal)`:
  ```typescript
  readonly results$ = toObservable(this.searchQuery).pipe(
    debounceTime(300),
    switchMap(q => this.http.get<Result[]>(`/api/search?q=${q}`))
  );
  ```
  `toObservable()` uses `effect()` internally and emits on each signal change. It must be called in an injection context.
- For HTTP calls, prefer keeping the Observable pipeline and exposing the result as a signal via `toSignal()`. Do not convert HTTP Observables into Promises just to use with signals -- the Observable pipeline gives you operators like `switchMap`, `catchError`, and `retry` that are difficult to replicate imperatively.
- The experimental `resource()` API in Angular 18+ handles the async signal use case natively:
  ```typescript
  readonly userResource = resource({
    request: () => ({ id: this.userId() }),
    loader: ({ request }) => fetch(`/api/users/${request.id}`).then(r => r.json())
  });
  // Access: this.userResource.value(), this.userResource.isLoading(), this.userResource.error()
  ```

---

## Output Format

When advising on Angular Signals patterns, produce output in this structure:

```
## Signal Architecture Assessment

### State Classification
| State Slice       | Type         | Owner            | Pattern          |
|-------------------|--------------|------------------|------------------|
| [state name]      | local/shared/global | component/service/store | signal/computed/toSignal |

### Signal Graph Diagram (text representation)
[WritableSignal] --> [computed] --> [template binding]
                 --> [computed] --> [effect (side effect)]

### Implementation

#### Signal Definitions
// Writable signals with types
// Computed signals
// Effects (with justification)

#### Service Store (if applicable)
// Full store class with private writable, public readonly, computed selectors, command methods

#### Interop Layer (if mixing RxJS)
// toSignal() / toObservable() calls with options

### Migration Path (if replacing existing code)
Phase 1: [specific migration step -- which component or service to migrate first]
Phase 2: [next migration step]
Phase 3: [cleanup and removal of old patterns]

### Tradeoffs Accepted
- [specific tradeoff and why it is acceptable for this context]
```

---

## Rules

1. NEVER declare a `signal()` without an explicit TypeScript generic type annotation when the initial value could be misread by inference -- especially for `null`, `undefined`, empty arrays, and union types. Missing generics cause runtime undefined-access errors that TypeScript does not catch at compile time.

2. NEVER write to a signal inside a `computed()` callback -- Angular's glitch-free algorithm prevents this, and attempting it throws a runtime error. If you find yourself wanting to, you need to restructure the graph so the writable signal is an input and the computed is the output.

3. ALWAYS call `effect()` and `toSignal()` inside an injection context (constructor, field initializer, `runInInjectionContext()`). Calling them outside throws `NG0203: inject() must be called from an injection context`. This is the most common runtime error when adopting signals.

4. NEVER expose a `WritableSignal` directly from a service -- always use `.asReadonly()` to return a `Signal<T>`. Components that can freely mutate service state break encapsulation and make bugs impossible to trace.

5. ALWAYS provide `initialValue` to `toSignal()` unless the source Observable is guaranteed to emit synchronously (e.g., `of(value)`, `from([])`, or a BehaviorSubject). Without `initialValue`, the resulting type is `Signal<T | undefined>` and templates will throw on first render.

6. NEVER use `effect()` to synchronize two writable signals (keeping `signalA` updated whenever `signalB` changes). This is a `computed()` use case. Using `effect()` for this creates asynchronous update behavior that causes the UI to flash intermediate states.

7. NEVER create signal-based stores with mutable public state properties. The pattern `readonly items = signal<Item[]>([])` on a service is wrong because any injector can call `.set()` or `.update()`. Always private the writable signal and expose `.asReadonly()`.

8. ALWAYS unsubscribe or clean up `toObservable()` and manually created `effect()` calls in services. Services provided at root live for the application lifetime, but feature-scoped services may be destroyed. Use `takeUntilDestroyed(this.destroyRef)` on Observable chains derived from signals.

9. NEVER mix `@Input()` decorator-based inputs with signal `input()` on the same component property. The two systems are not compatible for the same binding. Migrate the entire component's inputs at once to avoid confusing the Angular compiler and template type checker.

10. ALWAYS prefer `computed()` over storing derived state in a writable signal. If you see a pattern where `ngOnChanges` or an `effect()` sets one signal based on another, that derived signal should be a `computed()`. Redundant writable signals for derived data become inconsistent when update paths are missed.

11. NEVER use `JSON.stringify` as an equality comparator for signals that hold large objects or objects with circular references -- it is O(n) on every change detection cycle and will throw on circular structures. Write a structural comparator or use `fast-deep-equal` for complex objects.

12. ALWAYS test computed signal logic in isolation using `TestBed.runInInjectionContext()` or by instantiating the store/service directly in unit tests. Angular's signal primitives work in test environments -- there is no need to mock them.

---

## Edge Cases

### Legacy RxJS-Heavy Codebase Migration

When introducing signals to a codebase built on `BehaviorSubject` + `async` pipe patterns, do not attempt to rewrite all reactive state at once.

- Start at the leaf components -- components that only consume state and never share it upward. Replace their local `BehaviorSubject` properties with `signal()`.
- Use `toSignal()` at the component boundary to convert incoming service Observables to signals for template consumption, without touching the service itself.
- Migrate services only after all consumers have been updated to use signal-based APIs. The intermediate state -- services emitting Observables, components converting with `toSignal()` -- is stable and production-safe.
- Expect a 3--6 month migration timeline for a 50+ component application. Do not set a deadline that forces a rushed migration -- a partially migrated codebase with `toSignal()` bridges is correct and maintainable.

### Signals Inside `OnPush` Change Detection Components

Angular Signals are deeply integrated with the Zoneless / `OnPush` change detection model.

- Signals read in a template automatically schedule a check for that component when their value changes -- this works correctly with both default and `OnPush` change detection.
- With `OnPush`, if you read a signal inside a method called from a template event handler, the signal read does not register a reactive dependency because it happens outside the template rendering pass. Always surface signal values through the template directly (`{{ mySignal() }}`) or through `computed()` properties accessed in the template.
- Computed signals accessed only in `OnPush` component methods (not templates) do not trigger change detection. This is a common source of "stale UI" bugs when migrating from RxJS.
- When using Zoneless Angular (experimental in Angular 18+), signals are the primary change detection trigger. In this mode, `setTimeout`, `setInterval`, and Promise callbacks do NOT trigger change detection. Any async result must be stored back into a signal to update the UI.

### Signal Equality and Unnecessary Recomputation

Angular compares signal values with `Object.is()` by default. This causes issues with non-primitive values.

- Primitive values (`string`, `number`, `boolean`) work correctly with `Object.is()` -- a signal holding `42` updated to `42` does NOT trigger recomputation.
- Reference types (arrays, objects) compared with `Object.is()` will trigger recomputation even if the contents are identical, because a new reference is always "not equal" to the previous reference.
- When using `.update()` on an array to produce a filtered or mapped copy, every downstream `computed()` will recompute even if the filter result is identical to the previous value. Add a custom `equal` function to the signal definition to prevent this:
  ```typescript
  const ids = signal<string[]>([], {
    equal: (a, b) => a.length === b.length && a.every((v, i) => v === b[i])
  });
  ```
- Custom equality functions must be pure, fast, and side-effect-free. They run during every `.set()` and `.update()` call.

### Signals in Angular Route Resolvers and Guards

Route resolvers and guards in Angular 17+ can use signals via `inject()` and `toSignal()`, but with important constraints.

- Route resolvers must return a value synchronously or as a Promise/Observable. They cannot return a `Signal<T>` directly. Use `firstValueFrom(toObservable(signal))` if you need to expose signal-derived data to a resolver.
- Guards using signal-based auth stores should use `computed()` to derive the guard condition, then convert to an Observable for the router:
  ```typescript
  export const authGuard = () => {
    const authStore = inject(AuthStore);
    return authStore.isAuthenticated() || router.createUrlTree(['/login']);
  };
  ```
  This works synchronously because `isAuthenticated()` reads a signal synchronously.
- Avoid `toObservable()` in guards unless the auth state legitimately needs to resolve asynchronously (e.g., waiting for an HTTP check). Most signal-based guards should return synchronously.

### NgRx SignalStore Integration

NgRx SignalStore (introduced in NgRx 17) is the library-supported signal store pattern and has specific conventions.

- `signalStore()` creates a class-based store using `withState()`, `withComputed()`, `withMethods()`, and `withHooks()` feature functions.
- State defined with `withState()` is automatically made available as individual deep signals -- a state property `{ user: { name: 'Alice' } }` becomes accessible as `store.user()` and `store.user.name()`.
- Use `patchState(store, partial)` inside `withMethods()` to mutate state -- never use the internal signal directly.
- NgRx SignalStore's `withEntities()` feature from `@ngrx/signals/entities` provides a complete entity management solution with signals, including selectors for `ids`, `entities`, `entityMap`, and methods like `addEntity`, `updateEntity`, `removeEntity`. Prefer this over hand-rolling entity CRUD in signal arrays.
- SignalStore methods can use `rxMethod()` to handle Observable-based side effects (HTTP calls, debouncing) while keeping the store's state management in signals. This is the recommended pattern for async operations in NgRx SignalStore.

### Performance Degradation with Large Signal Graphs

When a single user action triggers updates across dozens of computed signals, the change detection overhead can become noticeable.

- Angular's signal runtime processes updates in topological order (glitch-free) -- a single change does not cause intermediate dirty states to be read. However, if 40+ `computed()` signals all depend on one root signal, all 40 recompute synchronously before the next render.
- Profile signal overhead using Angular DevTools' "change detection" tab. If a single user interaction shows 50ms+ in signal recomputation before rendering, the graph is too wide.
- Restructure wide graphs by introducing intermediate signals that group related computations: instead of 20 computeds reading `allItems()`, introduce `activeItems = computed(() => allItems().filter(i => i.active))` and have the 20 derivations read `activeItems()`.
- For very large lists (1000+ items), consider whether a signal should hold the entire list or an index/map structure. Filtering a `signal<Item[]>` of 10,000 items in a `computed()` that runs on every keystroke is a real performance problem. Move filtering to the server or use virtual scrolling.

### Testing Signal-Based Components and Services

Signal primitives work in TestBed, but there are testing patterns specific to signals.

- `TestBed.runInInjectionContext(() => { ... })` allows you to create signals, effects, and call `toSignal()` / `toObservable()` in tests without a component fixture.
- To test that a `computed()` reacts correctly, set the dependency signal's value and immediately read the computed -- no async tick is needed because computed values are synchronously derived:
  ```typescript
  store.setItems([{ id: '1', active: true }, { id: '2', active: false }]);
  expect(store.activeItems()).toHaveLength(1);
  ```
- To test `effect()` side effects, call `TestBed.flushEffects()` after setting signal values -- effects are batched and do not run synchronously. Without flushing, effect-driven behavior will not appear in test assertions.
- Use `jasmine.createSpyObj` or `jest.fn()` on the external system that the `effect()` calls (e.g., `localStorage.setItem`) and assert after `TestBed.flushEffects()`.

---

## Example

**Input:** "I'm building an e-commerce product listing page in Angular 17. I have a ProductService that fetches products via HTTP. The page has search, category filter, sort, and pagination. Multiple child components display the filtered results, loading state, and pagination controls. What's the correct signals architecture?"

**Output:**

## Signal Architecture Assessment

### State Classification

| State Slice | Type | Owner | Pattern |
|---|---|---|---|
| `searchQuery` | local UI state | `ProductListStore` | `signal<string>('')` |
| `selectedCategory` | local UI state | `ProductListStore` | `signal<string \| null>(null)` |
| `sortOrder` | local UI state | `ProductListStore` | `signal<SortOrder>('relevance')` |
| `currentPage` | local UI state | `ProductListStore` | `signal<number>(1)` |
| `rawProducts` | server data | `ProductListStore` | `toSignal(http$, { initialValue: [] })` |
| `filteredProducts` | derived | `ProductListStore` | `computed()` |
| `totalPages` | derived | `ProductListStore` | `computed()` |
| `isLoading` | derived from Observable | `ProductListStore` | `signal<boolean>(false)` |
| `error` | derived from Observable | `ProductListStore` | `signal<string \| null>(null)` |

### Signal Graph

```
searchQuery ──────┐
selectedCategory ─┼──> [filterParams: computed] ──> HTTP trigger (toObservable)
sortOrder ────────┤                                       │
currentPage ──────┘                                  rawProducts (toSignal)
                                                          │
                                              filteredProducts (computed)
                                                          │
                                              ┌───────────┴────────────┐
                                        template bindings         totalPages (computed)
                                        (product-grid, pagination)
```

### Implementation

```typescript
// product-list.store.ts
import { Injectable, computed, signal, inject } from '@angular/core';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { switchMap, catchError, tap, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { of } from 'rxjs';
import { HttpClient } from '@angular/common/http';

export type SortOrder = 'relevance' | 'price-asc' | 'price-desc' | 'newest';

interface FilterParams {
  query: string;
  category: string | null;
  sort: SortOrder;
  page: number;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  imageUrl: string;
}

@Injectable()  // NOT providedIn: 'root' -- scoped to the feature route
export class ProductListStore {
  private readonly http = inject(HttpClient);

  // ── Writable source signals (private -- only this store mutates them) ──
  private readonly _searchQuery = signal<string>('');
  private readonly _selectedCategory = signal<string | null>(null);
  private readonly _sortOrder = signal<SortOrder>('relevance');
  private readonly _currentPage = signal<number>(1);
  private readonly _isLoading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  // ── Public read-only projections ──
  readonly searchQuery = this._searchQuery.asReadonly();
  readonly selectedCategory = this._selectedCategory.asReadonly();
  readonly sortOrder = this._sortOrder.asReadonly();
  readonly currentPage = this._currentPage.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();

  // ── Computed filter params (collapses 4 signals into one fetch trigger) ──
  private readonly filterParams = computed<FilterParams>(() => ({
    query: this._searchQuery(),
    category: this._selectedCategory(),
    sort: this._sortOrder(),
    page: this._currentPage(),
  }));

  // ── HTTP trigger: filterParams Observable drives product fetching ──
  // toObservable converts the computed signal into a stream
  // debounceTime(300) prevents fetching on every keystroke
  private readonly products$ = toObservable(this.filterParams).pipe(
    debounceTime(300),
    distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
    tap(() => {
      this._isLoading.set(true);
      this._error.set(null);
    }),
    switchMap(params =>
      this.http.get<{ products: Product[]; total: number }>(
        '/api/products',
        { params: this.buildHttpParams(params) }
      ).pipe(
        catchError(err => {
          this._error.set('Failed to load products. Please try again.');
          this._isLoading.set(false);
          return of({ products: [], total: 0 });
        })
      )
    ),
    tap(() => this._isLoading.set(false))
  );

  // ── Convert HTTP Observable to a signal for template consumption ──
  private readonly productResponse = toSignal(
    this.products$,
    { initialValue: { products: [], total: 0 } }
  );

  // ── Public computed selectors ──
  readonly products = computed(() => this.productResponse().products);
  readonly totalResults = computed(() => this.productResponse().total);
  readonly totalPages = computed(() => Math.ceil(this.totalResults() / 24));  // 24 per page
  readonly hasResults = computed(() => this.products().length > 0);
  readonly isEmpty = computed(() =>
    !this.isLoading() && !this.error() && !this.hasResults()
  );

  // ── Commands (state mutation methods) ──
  setSearchQuery(query: string): void {
    this._searchQuery.set(query.trim());
    this._currentPage.set(1);  // reset pagination on search change
  }

  setCategory(category: string | null): void {
    this._selectedCategory.set(category);
    this._currentPage.set(1);
  }

  setSortOrder(sort: SortOrder): void {
    this._sortOrder.set(sort);
    this._currentPage.set(1);
  }

  goToPage(page: number): void {
    const total = this.totalPages();
    if (page < 1 || page > total) return;  // guard invalid page numbers
    this._currentPage.set(page);
  }

  private buildHttpParams(params: FilterParams): Record<string, string> {
    const result: Record<string, string> = {
      q: params.query,
      sort: params.sort,
      page: String(params.page),
      pageSize: '24',
    };
    if (params.category) result['category'] = params.category;
    return result;
  }
}
```

```typescript
// product-list.component.ts
import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { ProductListStore, SortOrder } from './product-list.store';

@Component({
  selector: 'app-product-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,  // signals work with OnPush
  providers: [ProductListStore],                     // feature-scoped -- one instance per route
  template: `
    <app-search-bar
      [value]="store.searchQuery()"
      (search)="store.setSearchQuery($event)"
    />
    <app-category-filter
      [selected]="store.selectedCategory()"
      (categoryChange)="store.setCategory($event)"
    />
    <app-sort-selector
      [current]="store.sortOrder()"
      (sortChange)="store.setSortOrder($event)"
    />

    @if (store.isLoading()) {
      <app-loading-skeleton [rows]="8" />
    } @else if (store.error()) {
      <app-error-message [message]="store.error()!" />
    } @else if (store.isEmpty()) {
      <app-empty-state [query]="store.searchQuery()" />
    } @else {
      <app-product-grid [products]="store.products()" />
      <app-pagination
        [currentPage]="store.currentPage()"
        [totalPages]="store.totalPages()"
        (pageChange)="store.goToPage($event)"
      />
      <p class="results-count">{{ store.totalResults() }} results</p>
    }
  `
})
export class ProductListComponent {
  readonly store = inject(ProductListStore);
}
```

```typescript
// product-list.store.spec.ts
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ProductListStore } from './product-list.store';

describe('ProductListStore', () => {
  let store: ProductListStore;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ProductListStore],
    });
    store = TestBed.inject(ProductListStore);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should reset to page 1 when search query changes', () => {
    store.goToPage(3);
    expect(store.currentPage()).toBe(3);

    store.setSearchQuery('shoes');
    expect(store.currentPage()).toBe(1);
    expect(store.searchQuery()).toBe('shoes');
  });

  it('should compute isEmpty correctly', () => {
    // Before any HTTP response, isLoading is true, so isEmpty should be false
    expect(store.isEmpty()).toBe(false);
  });
});
```

### Migration Path (from existing BehaviorSubject-based component)

**Phase 1 (Week 1):** Add `ProductListStore` service alongside the existing component. Do not change the existing component yet. Validate the store logic in isolation with unit tests.

**Phase 2 (Week 2):** Replace the existing component's template with signal-based bindings, using `toSignal()` to bridge any remaining Observable dependencies from parent services that have not yet been migrated.

**Phase 3 (Week 3):** Remove the old BehaviorSubject properties and `async` pipes from the component. Remove `ngOnInit` Observable subscriptions. Delete the old manual subscription teardown logic in `ngOnDestroy`.

### Tradeoffs Accepted

- Using `JSON.stringify` for `distinctUntilChanged` on `filterParams` is acceptable here because the filter params object is small (4 fields, all primitives) and the comparator only runs on debounced emissions -- not on every signal change.
- The store is scoped to the route via `providers: [ProductListStore]` rather than `providedIn: 'root'`, meaning the HTTP request is cancelled and state is reset on every navigation away from the page. This is the correct behavior for a search page but would be wrong for a persistent shopping cart -- which should use `providedIn: 'root'` and explicit clear commands.
- `ChangeDetectionStrategy.OnPush` is mandatory alongside signals for performance -- without it, Angular runs full change detection on every event even though signals provide precise dirty tracking. Any component that consumes signals from this store should also use `OnPush`.
