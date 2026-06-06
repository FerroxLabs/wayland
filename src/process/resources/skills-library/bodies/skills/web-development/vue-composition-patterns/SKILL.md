---
name: vue-composition-patterns
description: |
  Guides expert-level vue composition patterns implementation: javascript and frameworks decision frameworks, production-ready patterns, and concrete templates for vue composition patterns workflows.
  Use when the user asks about vue composition patterns, vue composition patterns configuration, or javascript best practices for vue projects.
  Do NOT use when the user needs a different web development capability -- check sibling skills in the web development subcategory.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "javascript frameworks frontend web-development"
  category: "web-development"
  subcategory: "web-development"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Vue Composition Patterns

## When to Use

**Use this skill when:**
- User asks how to organize logic in a Vue 3 component using `setup()`, `ref`, `reactive`, `computed`, or `watch`
- User wants to extract and share stateful logic across components using composables
- User asks about replacing Options API mixins with Composition API equivalents
- User needs guidance on lifecycle hook usage inside `setup()` -- specifically `onMounted`, `onUnmounted`, `onBeforeUnmount`, and `watchEffect` cleanup
- User wants to structure a large Vue 3 application with clear separation of concerns (data fetching, UI state, business logic)
- User asks about reactivity system internals -- `ref` vs `reactive`, `toRefs`, `shallowRef`, `shallowReactive`, `markRaw`
- User needs to implement dependency injection patterns in Vue using `provide`/`inject` with composables
- User asks about TypeScript integration in Vue 3 Composition API -- `defineProps`, `defineEmits`, `withDefaults`, generic components
- User wants to implement async composables with proper loading/error state management
- User asks about performance patterns -- lazy composables, `computed` memoization, avoiding reactive overhead

**Do NOT use this skill when:**
- User is working in Vue 2 without the `@vue/composition-api` plugin -- defer to Options API patterns
- User asks about Vue Router configuration or Pinia store architecture -- those are separate skills with their own patterns
- User needs help with Vue template syntax (directives, slots, scoped styles) rather than script logic
- User is asking about Nuxt.js-specific composables (`useAsyncData`, `useFetch`) -- Nuxt has its own conventions layered on top
- User needs general JavaScript async patterns not specific to Vue's reactivity system
- User is asking about server-side rendering concerns for SEO -- SSR has additional constraints beyond base composition patterns
- User needs help migrating an entire Options API codebase -- that is a migration project, not a composition pattern question

---

## Process

### 1. Identify the Problem Category

Before writing any code, classify what the user is trying to solve. Vue composition patterns solve distinctly different categories of problems, and the right pattern depends on the category.

- **Stateful UI logic** -- toggles, modals, tabs, form field state that belongs to one component. Use local `ref`/`reactive` inside `setup()` without extraction.
- **Shared stateful logic** -- logic that multiple components need independently (e.g., each table row has its own hover state). Use a composable that returns fresh reactive state on each call.
- **Singleton application state** -- auth, theme, global notifications. Use a module-level `ref`/`reactive` defined outside the composable function so all callers share the same instance.
- **Async data fetching** -- remote data with loading/error/data triple. Use a standardized async composable pattern (see Step 4).
- **Side effect management** -- subscriptions, event listeners, timers, WebSocket connections. Use composables with explicit `onUnmounted` cleanup inside `watchEffect` or lifecycle hooks.
- **Cross-cutting concerns** -- logging, analytics, feature flags that need access from anywhere. Use `provide`/`inject` with a root-level composable.

### 2. Choose the Correct Reactivity Primitive

Vue's reactivity system has multiple primitives with different trade-offs. Choosing the wrong one causes either over-reactivity (unnecessary re-renders) or under-reactivity (missed updates).

- Use `ref` for primitive values: strings, numbers, booleans, and any value that needs to be replaced as a whole. Access via `.value` in script, unwrapped automatically in templates.
- Use `reactive` for objects where you need deep reactivity and will mutate properties in place. Be aware that `reactive` objects lose reactivity when destructured -- always use `toRefs(state)` or `storeToRefs` (Pinia) when destructuring.
- Use `shallowRef` when you hold a large object that should trigger updates only on full replacement, not on property mutations -- common for large datasets or third-party class instances.
- Use `shallowReactive` when you only need first-level property reactivity and the object is large with nested data you control manually.
- Use `markRaw` to opt objects out of reactivity entirely -- use for class instances with private state, DOM elements, or large read-only configuration objects.
- Use `readonly` on state returned from composables that should not be mutated by consumers. This enforces one-directional data flow.
- Use `computed` for any derived value. Never use a method where a `computed` would work -- methods lack memoization and recalculate on every template render.

### 3. Structure Composable Files Correctly

A composable is a function -- named with the `use` prefix by convention -- that encapsulates reactive state and related logic. Structure composables with a consistent internal layout.

- Declare reactive state at the top of the composable function body.
- Declare `computed` properties immediately after the state they derive from.
- Register lifecycle hooks (`onMounted`, `onUnmounted`) after computeds.
- Register watchers (`watch`, `watchEffect`) after lifecycle hooks.
- Declare action functions that mutate state or trigger side effects last.
- Return an explicit object at the end. Never use `return reactive({})` from a composable -- it causes destructuring reactivity loss. Return `{ state: readonly(state), computedValue, actionFn }` individually.
- Name the file `use[FeatureName].ts` and place it in `src/composables/` for shared logic or co-locate it with the component file if it is component-specific.

### 4. Implement Async Composables with the Standard Data Triple

Data fetching is the most common async use case. Inconsistent patterns cause bugs and poor UX. Use this standard structure for every async composable.

```typescript
import { ref, watch, readonly } from 'vue'

export function useFetchUser(userId: Ref<string>) {
  const data = ref<User | null>(null)
  const error = ref<Error | null>(null)
  const isLoading = ref(false)

  async function fetchUser() {
    isLoading.value = true
    error.value = null
    try {
      data.value = await userService.getById(userId.value)
    } catch (e) {
      error.value = e instanceof Error ? e : new Error(String(e))
      data.value = null
    } finally {
      isLoading.value = false
    }
  }

  watch(userId, fetchUser, { immediate: true })

  return {
    data: readonly(data),
    error: readonly(error),
    isLoading: readonly(isLoading),
    refetch: fetchUser,
  }
}
```

- Always reset `error` to `null` at the start of each fetch to clear stale errors.
- Always set `isLoading = false` in `finally` -- never only in `try` or `catch`.
- Accept reactive arguments (`Ref<T>` or `ComputedRef<T>`) rather than raw values so watchers work correctly.
- Return `refetch` so consumers can manually trigger re-fetching without unmounting.
- Handle race conditions for rapid input changes: use an abort controller or a request ID counter that invalidates stale responses.

### 5. Implement Cleanup for Side Effects

Every composable that registers event listeners, intervals, subscriptions, or observers must clean up after itself. Failure to do so causes memory leaks, duplicate handlers, and stale callbacks.

- For DOM event listeners: register in `onMounted`, remove the same function reference in `onUnmounted`.
- For `watchEffect`: the returned stop handle will be called automatically when the component unmounts, but call it manually for conditionally started effects.
- For intervals and timeouts: store the ID in a `ref`, clear it in `onUnmounted`.
- For WebSocket or EventSource connections: close in `onUnmounted`.
- For ResizeObserver, IntersectionObserver, MutationObserver: call `.disconnect()` in `onUnmounted`.
- Use the `tryOnUnmounted` pattern from VueUse when writing utility composables that may be called outside component context -- wrap cleanup registration in a try/catch with `getCurrentInstance()` check.

```typescript
import { onUnmounted, getCurrentInstance } from 'vue'

function safeOnUnmounted(fn: () => void) {
  if (getCurrentInstance()) {
    onUnmounted(fn)
  }
  // else: called outside setup, skip automatic cleanup
}
```

### 6. Use `provide`/`inject` for Deep Dependency Trees

Props drilling beyond 2--3 levels is a sign to use `provide`/`inject`. Structure this as a composable pair, not raw `provide`/`inject` calls in components.

- Define a typed injection key using `InjectionKey<T>` from Vue. This ensures TypeScript catches mismatches between provider and consumer.
- Create a `useProvideX` composable that calls `provide(key, value)` and should be called in the root component or a layout component.
- Create a `useInjectX` composable that calls `inject(key)` with a fallback or throws a clear error if the provider is missing.
- Never inject at the module level -- injection only works during `setup()`. Calling `inject` outside `setup()` will return `undefined` silently in production.

```typescript
// injectionKeys.ts
import type { InjectionKey, Ref } from 'vue'
export const ThemeKey: InjectionKey<Ref<'light' | 'dark'>> = Symbol('theme')

// useProvideTheme.ts
export function useProvideTheme() {
  const theme = ref<'light' | 'dark'>('light')
  provide(ThemeKey, readonly(theme))
  return { theme, toggleTheme: () => { theme.value = theme.value === 'light' ? 'dark' : 'light' } }
}

// useTheme.ts
export function useTheme() {
  const theme = inject(ThemeKey)
  if (!theme) throw new Error('useTheme must be used within a ThemeProvider component')
  return theme
}
```

### 7. Apply TypeScript Patterns for Component Contracts

Vue 3 with `<script setup lang="ts">` enables fully type-safe component contracts. Apply these patterns consistently.

- Use `defineProps` with a type argument (not a runtime validator object) for TypeScript projects: `const props = defineProps<{ userId: string; isActive?: boolean }>()`
- Use `withDefaults` to supply default values for optional props: `withDefaults(defineProps<Props>(), { isActive: false })`
- Use `defineEmits` with a typed signature: `const emit = defineEmits<{ (e: 'update:modelValue', value: string): void }>()`
- For `v-model` support on custom components, use `defineModel()` (Vue 3.4+) which reduces boilerplate significantly vs manual prop + emit.
- Use `defineExpose` sparingly -- only expose methods that a parent genuinely needs to call imperatively (e.g., focus management, scroll methods).
- Write generic components using the `generic` attribute in `<script setup generic="T extends object">` (Vue 3.3+).

### 8. Audit Reactivity and Performance

Composition API makes performance problems explicit but also easy to create. Apply these checks before finalizing any composable.

- Run Vue DevTools and inspect the "Reactivity" tab to confirm that only the expected components re-render when state changes.
- Avoid creating reactive objects inside `computed` getters -- computed values should derive, not create.
- Avoid `watch` with `deep: true` on large objects -- it traverses the entire object tree on every change. Prefer watching specific nested properties or using `watchEffect` with explicit dependency access.
- Avoid calling composables inside loops or conditionals -- composable calls must be deterministic per component instance (same rule as React hooks).
- Use `shallowRef` for list data (arrays of items) and mutate via `items.value = [...items.value, newItem]` rather than `reactive([])` with `.push()` -- the replacement triggers a single update instead of multiple.
- Memoize expensive computed values with `computed(() => ...)` rather than recomputing in the template.
- For lists with 500+ items, combine virtual scrolling (e.g., vue-virtual-scroller) with composables that page data -- do not hold 10,000 reactive objects in a single `ref`.

---

## Output Format

When helping a user with Vue Composition patterns, structure your response as follows:

```
## Pattern: [Pattern Name]

### Problem
[One sentence describing what this pattern solves]

### When to Apply
- [Specific trigger condition 1]
- [Specific trigger condition 2]

### Implementation

// [Filename]: src/composables/use[Name].ts
[Complete, copy-paste-ready TypeScript code]

### Usage in Component

// [Filename]: src/components/[Name].vue
[Complete <script setup> block showing usage]

### Trade-offs

| Concern              | This Pattern          | Alternative           |
|----------------------|-----------------------|-----------------------|
| Reactivity control   | [assessment]          | [assessment]          |
| TypeScript support   | [assessment]          | [assessment]          |
| Testability          | [assessment]          | [assessment]          |
| Bundle size impact   | [assessment]          | [assessment]          |

### Testing Strategy
[Specific notes on how to unit test this composable using @vue/test-utils or vitest]

### Common Mistakes
- [Mistake 1 with explanation]
- [Mistake 2 with explanation]
```

---

## Rules

1. **NEVER destructure a `reactive()` object without `toRefs()`** -- destructuring strips reactivity, creating plain JavaScript variables that will not update the template. This is the single most common Vue Composition API bug.

2. **NEVER call composables conditionally or inside loops** -- composable calls must be at the top level of `setup()` or `<script setup>`. Conditional composable calls break Vue's internal tracking of hook order.

3. **ALWAYS use the `use` prefix for composable function names** -- this is not merely a convention. Vue DevTools and tooling use this prefix to identify composables for debugging and inspection.

4. **NEVER return `reactive()` directly from a composable** -- wrap properties individually with `ref`, then return them as a plain object. Returning `reactive({ a, b })` makes the return value non-destructurable without losing reactivity.

5. **ALWAYS register cleanup for side effects before the composable returns** -- any `addEventListener`, `setInterval`, `new WebSocket()`, or observer registered inside a composable must have a corresponding `onUnmounted` handler in the same composable, not delegated to the consumer.

6. **NEVER use `watch` with `immediate: true` as a substitute for initializing state** -- if the initial value is predictable, initialize it directly. Use `immediate: true` only when a watcher genuinely needs to fire on mount with the current value of a reactive dependency.

7. **ALWAYS distinguish between shared singleton state and per-instance state** -- module-level reactive variables are shared across all component instances. If each component needs independent state, the state must be declared inside the composable function body, not outside it.

8. **NEVER use `any` type in composable signatures** -- TypeScript's ability to catch prop mismatches, inject type mismatches, and return type errors is the primary safety net in large Vue applications. Use `unknown` and narrow with type guards if the type is genuinely unknown.

9. **ALWAYS handle `inject()` return values as potentially undefined** -- unless using a typed `InjectionKey` with a default, `inject()` returns `T | undefined`. Unchecked usage of the result causes runtime errors that TypeScript will not catch without proper narrowing.

10. **NEVER create watchers that watch state they also mutate without a guard** -- a watcher that modifies the same ref it watches creates an infinite reactive loop. Use `watchEffect` carefully, add conditional guards (`if (newVal === prevProcessed) return`), or restructure to break the circular dependency.

---

## Edge Cases

### Composables Called Outside `setup()` Context

If a composable containing `onMounted`, `onUnmounted`, or `inject()` is called from a non-component context (a Pinia store action, a utility function, a test without a Vue app instance), Vue throws a warning and the lifecycle hooks silently do nothing.

**Handling:** Guard lifecycle hook registration with `getCurrentInstance()`. If `getCurrentInstance()` returns `null`, skip lifecycle registration and document that the composable must be called within a component for full functionality. For Pinia store scenarios, move the reactive state out of the composable into the store and use only the pure logic parts.

### Reactive Props Passed to Composables

A common mistake is passing `props.userId` (a raw string) into a composable that expects a `Ref<string>`. The composable's watcher will never fire when `userId` changes because it received a snapshot value at call time.

**Handling:** Accept `MaybeRefOrGetter<T>` (Vue 3.3+ utility type) in composable signatures and use `toValue()` inside the composable to unwrap either format. This makes composables work with both `ref(id)` and `() => props.userId` getter forms, which is the VueUse convention.

```typescript
import { toValue, type MaybeRefOrGetter } from 'vue'

export function useUser(id: MaybeRefOrGetter<string>) {
  watch(() => toValue(id), fetchUser, { immediate: true })
}
// Consumer can pass: useUser(props.userId) OR useUser(userIdRef) OR useUser(() => props.userId)
```

### Race Conditions in Async Composables

When a `watch` triggers multiple async fetches in rapid succession (e.g., user typing into a search input), earlier requests that resolve after later ones will overwrite newer results.

**Handling:** Use an incrementing request ID. At the start of each fetch, capture the current ID. After `await`, check if the stored ID still matches. If not, discard the result. Alternatively, use `AbortController` to cancel in-flight requests when a new one starts.

```typescript
let requestId = 0

async function fetch() {
  const thisId = ++requestId
  isLoading.value = true
  const result = await apiCall()
  if (thisId !== requestId) return // stale response, discard
  data.value = result
  isLoading.value = false
}
```

### Testing Composables with Lifecycle Hooks

Composables that use `onMounted` or `onUnmounted` cannot be tested by calling the composable function directly in Vitest -- the hooks will not fire without a mounting context.

**Handling:** Wrap the composable in a test component using `@vue/test-utils` `mount()` with a minimal component:

```typescript
import { mount } from '@vue/test-utils'
import { useMyComposable } from './useMyComposable'

function mountComposable() {
  let result: ReturnType<typeof useMyComposable>
  const wrapper = mount({ setup() { result = useMyComposable(); return () => null } })
  return { result: result!, wrapper }
}
```

For composables without lifecycle hooks, calling the function directly inside a `withSetup` helper or using the `@vueuse/core` test utilities is sufficient.

### `v-model` with Composables and Child Components

Custom `v-model` implementations using `props.modelValue` + `emit('update:modelValue')` break when the parent's state is managed inside a composable that returns `readonly` state.

**Handling:** Use `defineModel()` (Vue 3.4+) which handles the prop/emit contract internally. For Vue 3.0--3.3, ensure the composable returns a writable `ref` (not `readonly`) for values that need two-way binding, and document that the consumer is responsible for not mutating it directly -- instead calling the composable's update function.

### Large Component Files with Many Composable Calls

A component that calls 8+ composables in its `setup()` block becomes hard to follow, even if each composable is well-designed. This is a sign of a component doing too much.

**Handling:** Group related composables into a single higher-level composable using the facade pattern. For example, a `useProductPage` composable that internally calls `useProductData`, `useInventory`, `useReviews`, and `usePricing`, returning a unified API. The component's `setup()` then has one or two composable calls with clear intent. Document this facade composable explicitly since it is the authoritative description of what the page does.

### Reactivity Loss with Third-Party Class Instances

Assigning a class instance (e.g., a `Map`, a custom `EventEmitter`, or a charting library object) to a `reactive()` container causes Vue to proxy the object, breaking internal methods that rely on `this` identity or private slots.

**Handling:** Use `markRaw()` to wrap third-party class instances before storing them in reactive state. Store configuration or derived values reactively; store the instance as raw.

```typescript
import { ref, markRaw } from 'vue'
import Chart from 'chart.js'

const chartInstance = ref(markRaw(new Chart(canvas, config)))
// chartInstance.value is the Chart object, not proxied
// Update reactive config separately:
const chartData = ref(initialData)
watch(chartData, (data) => { chartInstance.value.data = data; chartInstance.value.update() })
```

---

## Example

**Input:** "I'm building a Vue 3 admin dashboard. I have a `UserTable` component and a `UserDetailPanel` component that both need access to the currently selected user, and both need to trigger a refetch of the user list. I'm using TypeScript and `<script setup>`. How should I structure this with composables?"

**Output:**

This is a shared singleton state problem with an async data layer -- two components need to share the same selected user and the same data fetch. The correct pattern is a singleton composable (module-level state) combined with a separate async composable for the data layer.

---

### Pattern: Singleton State Composable + Async Data Composable

**Problem:** Multiple sibling components need to read and write the same selected user state and trigger shared data refreshes without prop drilling or a full state management library.

---

### Step 1 -- Define the Types

```typescript
// src/types/user.ts
export interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'editor' | 'viewer'
  createdAt: string
}
```

---

### Step 2 -- Create the Singleton Selection Composable

```typescript
// src/composables/useUserSelection.ts
import { ref, readonly } from 'vue'
import type { User } from '@/types/user'

// Module-level state: shared across ALL components that call this composable
const selectedUser = ref<User | null>(null)

export function useUserSelection() {
  function selectUser(user: User) {
    selectedUser.value = user
  }

  function clearSelection() {
    selectedUser.value = null
  }

  return {
    selectedUser: readonly(selectedUser), // consumers cannot mutate directly
    selectUser,
    clearSelection,
  }
}
```

**Why module-level state here:** Both `UserTable` and `UserDetailPanel` must see the same `selectedUser`. If state were inside the function body, each call would create an independent `ref` -- the two components would have separate selections. Module-level state is the correct choice for cross-component shared selection state.

---

### Step 3 -- Create the Async Users List Composable

```typescript
// src/composables/useUserList.ts
import { ref, readonly } from 'vue'
import type { User } from '@/types/user'
import { userApi } from '@/api/userApi'

// Module-level: all consumers share the same list and loading state
const users = ref<User[]>([])
const isLoading = ref(false)
const error = ref<Error | null>(null)
let requestId = 0

async function fetchUsers() {
  const thisId = ++requestId
  isLoading.value = true
  error.value = null

  try {
    const result = await userApi.getAll()
    if (thisId !== requestId) return // discard stale response
    users.value = result
  } catch (e) {
    if (thisId !== requestId) return
    error.value = e instanceof Error ? e : new Error(String(e))
  } finally {
    if (thisId === requestId) {
      isLoading.value = false
    }
  }
}

export function useUserList() {
  return {
    users: readonly(users),
    isLoading: readonly(isLoading),
    error: readonly(error),
    fetchUsers,
  }
}
```

---

### Step 4 -- `UserTable` Component

```vue
<!-- src/components/UserTable.vue -->
<script setup lang="ts">
import { onMounted } from 'vue'
import { useUserList } from '@/composables/useUserList'
import { useUserSelection } from '@/composables/useUserSelection'

const { users, isLoading, error, fetchUsers } = useUserList()
const { selectedUser, selectUser } = useUserSelection()

onMounted(fetchUsers)
</script>

<template>
  <div class="user-table">
    <div v-if="isLoading" class="loading-indicator" aria-live="polite">Loading users...</div>
    <div v-else-if="error" class="error-message" role="alert">
      Failed to load users: {{ error.message }}
      <button @click="fetchUsers">Retry</button>
    </div>
    <table v-else>
      <thead>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Role</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="user in users"
          :key="user.id"
          :class="{ 'is-selected': selectedUser?.id === user.id }"
          @click="selectUser(user)"
        >
          <td>{{ user.name }}</td>
          <td>{{ user.email }}</td>
          <td>{{ user.role }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
```

---

### Step 5 -- `UserDetailPanel` Component

```vue
<!-- src/components/UserDetailPanel.vue -->
<script setup lang="ts">
import { useUserSelection } from '@/composables/useUserSelection'
import { useUserList } from '@/composables/useUserList'

const { selectedUser, clearSelection } = useUserSelection()
const { fetchUsers } = useUserList()

async function handleRoleChange(newRole: string) {
  if (!selectedUser.value) return
  await userApi.updateRole(selectedUser.value.id, newRole)
  await fetchUsers() // refresh the shared list
  // selectedUser remains set to the same user reference
  // the table will reflect the updated data on next render
}
</script>

<template>
  <aside class="user-detail-panel">
    <template v-if="selectedUser">
      <h2>{{ selectedUser.name }}</h2>
      <p>{{ selectedUser.email }}</p>
      <select :value="selectedUser.role" @change="handleRoleChange(($event.target as HTMLSelectElement).value)">
        <option value="admin">Admin</option>
        <option value="editor">Editor</option>
        <option value="viewer">Viewer</option>
      </select>
      <button @click="clearSelection">Close</button>
    </template>
    <template v-else>
      <p>Select a user from the table to view details.</p>
    </template>
  </aside>
</template>
```

---

### Trade-offs

| Concern | Singleton Composable | Pinia Store |
|---|---|---|
| Setup complexity | Minimal -- just a `.ts` file | Requires Pinia install + store file |
| DevTools support | Limited | Full time-travel debugging |
| Server-side rendering | Safe if module reset on request | Requires SSR store instantiation |
| Testability | Easy -- reset module state in test | Easy -- `createTestingPinia()` |
| Scale | Good up to ~5 shared states | Better for 10+ interconnected states |

**Recommendation:** For 2--3 shared states like this user selection scenario, the singleton composable pattern is the right choice. Avoid introducing Pinia until you have 5+ stores or need DevTools time-travel debugging. The composable approach is simpler to understand, easier to co-locate with related components, and has no additional dependencies.

---

### Testing Strategy

```typescript
// src/composables/useUserSelection.test.ts
import { describe, it, expect, beforeEach } from 'vitest'

describe('useUserSelection', () => {
  beforeEach(async () => {
    // Reset module-level state between tests by reimporting
    vi.resetModules()
  })

  it('starts with no selection', async () => {
    const { useUserSelection } = await import('./useUserSelection')
    const { selectedUser } = useUserSelection()
    expect(selectedUser.value).toBeNull()
  })

  it('shares state between two callers', async () => {
    const { useUserSelection } = await import('./useUserSelection')
    const caller1 = useUserSelection()
    const caller2 = useUserSelection()
    const mockUser = { id: '1', name: 'Alice', email: 'alice@example.com', role: 'admin', createdAt: '2024-01-01' }

    caller1.selectUser(mockUser)
    expect(caller2.selectedUser.value?.id).toBe('1')
  })
})
```

Note `vi.resetModules()` in `beforeEach` -- this is essential for singleton composable tests. Without it, state leaks between tests because the module is cached.

---

### Common Mistakes to Avoid

- **Mistake:** Returning `readonly(selectedUser)` but then calling `selectedUser.value = x` in the composable internals. `readonly` only prevents external mutation -- internal writes through the original `ref` still work correctly.
- **Mistake:** Calling `onMounted(fetchUsers)` in both `UserTable` and `UserDetailPanel`. Since `fetchUsers` is shared, both components will trigger a fetch on mount. In this example, `UserDetailPanel` never mounts before `UserTable` so it is fine -- but if both mounted simultaneously, add a guard: `if (!users.value.length && !isLoading.value) await fetchUsers()`.
- **Mistake:** Mutating `selectedUser.value.role` directly in the template after a role change instead of calling `fetchUsers()` to get a fresh server-validated copy. Always treat server data as the source of truth and refetch after mutations.
