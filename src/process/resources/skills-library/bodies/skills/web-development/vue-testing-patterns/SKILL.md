---
name: vue-testing-patterns
description: |
  Guides expert-level vue testing patterns implementation: javascript and testing decision frameworks, production-ready patterns, and concrete templates for vue testing patterns workflows.
  Use when the user asks about vue testing patterns, vue testing patterns configuration, or javascript best practices for vue projects.
  Do NOT use when the user needs a different web development capability -- check sibling skills in the web development subcategory.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "javascript testing frameworks tdd"
  category: "web-development"
  subcategory: "web-development"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Vue Testing Patterns

## When to Use

**Use this skill when:**
- User is writing tests for Vue 3 components using Vitest, Jest, or Vue Test Utils and needs guidance on structure, patterns, or common pitfalls
- User wants to test Pinia stores, composables, or reactive logic in isolation without mounting full components
- User is setting up a testing strategy for a Vue project and needs to decide between unit, integration, and end-to-end test coverage boundaries
- User is migrating tests from Vue 2 / Vue Test Utils v1 / Vue CLI Jest to Vue 3 / Vue Test Utils v2 / Vitest
- User has flaky tests, slow test suites, or tests that break on internal refactors rather than behavioral changes
- User wants to test async operations, watchers, lifecycle hooks, or complex user interactions in Vue components
- User is implementing TDD for a Vue feature and needs concrete patterns for writing tests before components

**Do NOT use this skill when:**
- User needs help setting up end-to-end testing with Cypress or Playwright -- use the e2e-testing skill instead
- User needs help with Vue 3 component architecture or composition API design -- use the vue-composition-api skill
- User needs TypeScript configuration for a Vue project -- use the vue-typescript-setup skill
- User is asking about React Testing Library or Angular testing -- those are different framework skills
- User needs CI/CD pipeline configuration that includes testing -- use the ci-cd-pipeline skill
- User needs performance profiling of Vue applications -- use the vue-performance-optimization skill

---

## Process

### 1. Identify What Needs to Be Tested and at What Level

Before writing a single test, determine the correct testing level for the code under test.

- **Unit tests** target a single composable, utility function, or simple presentational component in isolation. These run in milliseconds and should form the bulk of your suite (70%+ by count).
- **Component integration tests** mount one component with real child components and real Pinia stores, testing the rendered output and user interactions. These are the highest-value tests for Vue -- they test behavior without coupling to implementation.
- **Shallow render tests** are rarely the right choice. Use `shallowMount` only for components with expensive or side-effectful children that cannot be stubbed cleanly. Prefer `mount` for integration value.
- Draw the test boundary at the public contract: props in, emits out, slots rendered, DOM mutations, store state changes. Never test internal `ref` values, internal method calls, or private composable internals.
- Apply the 70/20/10 heuristic: 70% unit tests on composables and utilities, 20% component integration tests, 10% E2E tests on critical paths.

### 2. Configure the Test Environment Correctly

A misconfigured test environment causes more wasted time than poor test design. Get this right first.

- Use **Vitest** as the default for Vue 3 projects. It shares Vite config, supports HMR in watch mode, and has first-class Vue Plugin support. Use Jest only if the project is already committed to it.
- Set `environment: 'jsdom'` or `environment: 'happy-dom'` in `vitest.config.ts`. `happy-dom` is 2-5x faster but has less complete DOM API coverage. Use `happy-dom` unless you hit missing API errors.
- Install `@vue/test-utils@^2`, `@pinia/testing`, and either `vitest` or `jest` + `@vue/vue3-jest`.
- Configure global plugins in `vitest.config.ts` under `test.globals` so you don't repeat them per file:

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
})
```

- Create a `setup.ts` file that installs global plugins (e.g., i18n, router mocks, custom directives) once rather than in every test file.
- Set `server.deps.inline: ['vuetify']` (or your UI library) if using SSR-incompatible dependencies that fail module resolution in Vitest.

### 3. Structure Tests Using the Arrange-Act-Assert Pattern with Vue Semantics

Vue testing has specific timing requirements that break naive AAA implementations.

- Always `await nextTick()` after triggering reactive state changes before asserting on the DOM. Failure to do this is the single most common source of false-passing tests.
- Use `await wrapper.trigger('click')` -- Vue Test Utils triggers return a promise that resolves after the DOM has updated. Always await it.
- Use `flushPromises()` from `@vue/test-utils` after async operations (API calls, async watchers, `onMounted` async work) before asserting. This drains the microtask queue completely.
- Structure test files with `describe` blocks matching component name, then nested `describe` blocks for logical groups (rendering, user interactions, emits, edge cases):

```typescript
describe('UserCard', () => {
  describe('rendering', () => { ... })
  describe('user interactions', () => { ... })
  describe('emitted events', () => { ... })
})
```

- Place `beforeEach` factory functions at the top of each `describe` block. Create a `createWrapper` factory function instead of repeating `mount` calls -- this makes adding props to specific tests trivial without breaking others.

### 4. Mount Components Correctly with Proper Plugin Context

A component mounted without its expected dependencies will fail in ways that obscure the real test intent.

- Use the `global` mounting option to provide plugins per test or per file:

```typescript
const wrapper = mount(UserCard, {
  global: {
    plugins: [createTestingPinia({ initialState: { user: { name: 'Alice' } } })],
    stubs: { RouterLink: true },
    mocks: { $t: (key: string) => key },
  },
  props: { userId: '42' },
})
```

- Use `createTestingPinia` from `@pinia/testing` instead of the real Pinia. It makes all store actions spies by default, preventing real network calls.
- Stub `RouterLink` and `RouterView` with `{ RouterLink: true, RouterView: true }` unless you are specifically testing routing behavior. Real router setup in unit tests adds noise.
- For components that use `provide/inject`, use the `global.provide` mounting option:

```typescript
const wrapper = mount(ThemeConsumer, {
  global: { provide: { theme: 'dark' } },
})
```

- For slots, use the `slots` mounting option with template strings or render functions. Test that the correct slot content is rendered, not the slot mechanism itself.

### 5. Test Composables in Isolation Using `withSetup`

Composables are the most testable unit in Vue 3. Test them directly without mounting a component.

- For composables that require a Vue instance context (lifecycle hooks, `provide/inject`, `getCurrentInstance`), wrap them in a minimal component using a `withSetup` helper:

```typescript
// test/helpers/withSetup.ts
import { createApp } from 'vue'

export function withSetup<T>(composable: () => T): [T, ReturnType<typeof createApp>] {
  let result: T
  const app = createApp({
    setup() {
      result = composable()
      return () => {}
    },
  })
  app.mount(document.createElement('div'))
  return [result!, app]
}
```

- Use this pattern to test lifecycle hooks: call `app.unmount()` to trigger `onUnmounted` handlers and assert cleanup occurred.
- For pure composables (no lifecycle hooks, no `provide/inject`), call them directly in tests inside a `withReactivity` wrapper or simply inline -- Vitest runs in the same Vue reactive context.
- Test the return value of composables, not their internals. If `useCounter` returns `{ count, increment, decrement }`, test those values and functions. Never destructure reactive refs before returning them (they lose reactivity), and verify your composable doesn't do this either.
- Mock `fetch` or `axios` at the module level using `vi.mock` or `jest.mock` before testing composables that make network requests.

### 6. Test Pinia Stores Directly

Pinia stores are plain objects with reactive state -- test them like you would test a class.

- Import the store definition and call it directly inside a `setActivePinia(createPinia())` context:

```typescript
import { setActivePinia, createPinia } from 'pinia'
import { useCartStore } from '@/stores/cart'

beforeEach(() => {
  setActivePinia(createPinia())
})

it('adds item to cart', () => {
  const cart = useCartStore()
  cart.addItem({ id: '1', name: 'Widget', price: 9.99 })
  expect(cart.items).toHaveLength(1)
  expect(cart.total).toBe(9.99)
})
```

- For stores with async actions that call APIs, mock the API module using `vi.mock` at the top of the test file, then verify the store state after the action resolves.
- Test getters independently of actions. If a getter `discountedTotal` depends on `total` and a `discount` property, set state directly and assert the getter's output without going through actions.
- Use `$patch` to set up complex initial state for getter tests rather than calling multiple actions in sequence -- it's faster and more direct.
- For stores that call other stores, use `createTestingPinia` with `initialState` to set up multi-store state in one call.

### 7. Assert on Behavior, Not Implementation

The most important discipline in Vue testing is choosing what to assert.

- Assert on **what the user sees**: `expect(wrapper.text()).toContain('Welcome, Alice')` not `expect(wrapper.vm.displayName).toBe('Welcome, Alice')`.
- Assert on **DOM structure only when it carries semantic meaning**: `expect(wrapper.find('[data-testid="error-message"]').exists()).toBe(true)` is better than `expect(wrapper.find('.error-text').exists()).toBe(true)`.
- Use `data-testid` attributes on elements that tests need to find. Never use CSS classes or element tags as test selectors -- they change for styling reasons and break tests unnecessarily.
- Assert on **emitted events** using `wrapper.emitted()`:

```typescript
await wrapper.find('[data-testid="submit-btn"]').trigger('click')
expect(wrapper.emitted('form-submit')).toHaveLength(1)
expect(wrapper.emitted('form-submit')![0]).toEqual([{ name: 'Alice', email: 'alice@example.com' }])
```

- Avoid `wrapper.vm` access in assertions except for debugging. If you find yourself asserting `wrapper.vm.someInternalState`, your test is too tightly coupled to implementation.
- For component props validation tests, assert that the rendered output reflects the prop value, not that Vue's prop validation system ran.

### 8. Handle Async, Timers, and Network Calls

Async is the leading cause of flaky Vue tests. Follow these patterns consistently.

- Mock `setTimeout`/`setInterval`/`Date.now()` using `vi.useFakeTimers()` in `beforeEach` and `vi.useRealTimers()` in `afterEach`. Advance time with `vi.advanceTimersByTime(ms)` or `vi.runAllTimers()`.
- For debounced or throttled inputs, use fake timers and advance by the debounce duration (e.g., 300ms) before asserting:

```typescript
vi.useFakeTimers()
await wrapper.find('input').trigger('input')
vi.advanceTimersByTime(300)
await nextTick()
expect(mockSearchFn).toHaveBeenCalledWith('query')
```

- Mock `fetch` using `vi.fn()` or use `msw` (Mock Service Worker) for component tests that involve multiple API calls. MSW is preferable for integration tests because it intercepts at the network level and avoids brittle mock setup.
- Always clean up mocks in `afterEach` using `vi.restoreAllMocks()` or `vi.clearAllMocks()`. Configure this globally in `setup.ts` with `afterEach(() => vi.clearAllMocks())`.
- For components using `onMounted` async initialization, `await flushPromises()` immediately after mounting before making assertions.

---

## Output Format

When providing Vue testing guidance, use this structure:

```
## Test Strategy for [Component/Feature Name]

### Testing Level
- Primary: [unit / integration / E2E]
- Rationale: [one sentence explaining why]

### Test File Structure
[filepath and filename]

### Setup & Configuration
[vitest.config.ts or jest.config.ts changes required]
[Required imports and global setup]

### Test Cases

#### [Test Group Name]
| Test Description | Trigger | Assertion |
|-----------------|---------|-----------|
| [description]   | [user action or state change] | [expected outcome] |

#### Factory / Setup Helper
[createWrapper or withSetup code block]

### Test Code
[Complete, runnable test file]

### Common Pitfalls to Avoid
- [Specific mistake for this component/feature type]
```

---

## Rules

1. **NEVER assert on `wrapper.vm` internal state in production tests.** Asserting `wrapper.vm.isLoading === true` tests implementation, not behavior. Assert on the DOM element that reflects loading state (e.g., a spinner element's existence or a button's `disabled` attribute).

2. **ALWAYS await Vue DOM updates before asserting.** Every `trigger()` call, every reactive state mutation visible in the template, every `nextTick`-dependent update must be awaited. Missing a single await causes false positives that pass locally and fail in CI under load.

3. **NEVER use `shallowMount` as a default.** Shallow mounting hides integration failures and produces tests with near-zero refactoring confidence. Use `mount` with explicit stubs for components you do not want to test. Reserve `shallowMount` for components with 10+ heavy child components where mount performance is genuinely problematic.

4. **ALWAYS use `createTestingPinia` instead of real Pinia in component tests.** Real Pinia in tests leads to state leaking between tests unless you manually reset every store. `createTestingPinia` creates a fresh store per test automatically and spies on all actions.

5. **NEVER access `wrapper.vm` to call component methods directly.** Calling `wrapper.vm.handleClick()` bypasses the event system and skips guard logic (e.g., disabled state checks). Use `wrapper.trigger('click')` or `wrapper.find('[data-testid]').trigger('click')` to simulate real user interactions.

6. **ALWAYS clean up side effects in `afterEach`.** Timers, mocked modules, intercepted requests, and global event listeners that are not cleaned up cause test pollution. Use `vi.clearAllMocks()`, `vi.useRealTimers()`, and `wrapper.unmount()` (Vue Test Utils calls this automatically for `mount` but not for manual app instances).

7. **NEVER write tests that depend on test execution order.** Each `it` block must be fully independent. Use `beforeEach` factory functions that reset all state. Tests that pass only when run in a specific order are a hidden form of test debt that will eventually cause CI failures.

8. **ALWAYS use `data-testid` attributes for test selectors, never CSS classes or element types.** Class names change during UI refactors, breaking tests for reasons unrelated to behavior. `data-testid` attributes are explicit testing contracts that communicate intent to future developers.

9. **NEVER mock what you do not own in component tests.** If your component calls a composable, test the component with the real composable (mocking only its external dependencies like APIs). Mocking internal composables couples tests to architecture and makes composable refactors break tests incorrectly.

10. **ALWAYS keep test setup (beforeEach, createWrapper) colocated with the tests that use it.** Global setup files should contain only environment configuration, not component-specific mocks. Component-specific mocks buried in global setup files cause mysterious test failures that are hard to trace.

---

## Edge Cases

### Testing Components with Vue Router

When a component uses `useRouter`, `useRoute`, or `RouterLink`, provide a mock router rather than the real one.

- Install `vue-router@4` in test with `createMemoryHistory()` and a route matching your component's expected `$route.params`:

```typescript
import { createRouter, createMemoryHistory } from 'vue-router'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [{ path: '/users/:id', component: { template: '<div />' } }],
})
router.push('/users/42')
await router.isReady()

const wrapper = mount(UserProfile, {
  global: { plugins: [router] },
})
```

- For components that only read `$route` params without navigating, use a simpler mock via `global.mocks`:

```typescript
global: { mocks: { $route: { params: { id: '42' }, query: {} } } }
```

- Never assert on `router.currentRoute` from within component tests -- assert on the rendered output that reflects route-driven state.

### Testing Components with Teleport

Vue's `Teleport` component renders content outside the component tree, which breaks `wrapper.find()` queries.

- Disable teleport in tests by adding the `attachTo` mounting option pointing to a real DOM node, or use `global.stubs: { Teleport: true }` to render teleported content inline:

```typescript
const wrapper = mount(Modal, {
  global: { stubs: { Teleport: true } },
  props: { isOpen: true },
})
// Now wrapper.find('[data-testid="modal-content"]') works correctly
```

- When testing the behavior of the teleport target (e.g., that a modal appends to `document.body`), use `attachTo: document.body` and query `document.body` directly rather than the wrapper.

### Testing Components with Transitions and Animations

Vue Transition and TransitionGroup components cause timing issues in tests because they rely on CSS animations completing.

- Stub `Transition` and `TransitionGroup` globally in your `setup.ts` to make them render children immediately:

```typescript
// setup.ts
import { config } from '@vue/test-utils'
config.global.stubs = {
  Transition: { template: '<slot />' },
  TransitionGroup: { template: '<slot />' },
}
```

- Never test CSS animation behavior in unit or integration tests -- that belongs in visual regression testing.

### Testing v-model Binding in Custom Components

Testing two-way binding in custom components requires understanding how Vue 3 `v-model` compiles.

- In Vue 3, `v-model` on a custom component compiles to `:modelValue` prop + `@update:modelValue` emit. Test these separately:

```typescript
// Test prop side: does the component display the modelValue?
const wrapper = mount(CustomInput, { props: { modelValue: 'hello' } })
expect(wrapper.find('input').element.value).toBe('hello')

// Test emit side: does typing update the parent via emit?
await wrapper.find('input').setValue('world')
expect(wrapper.emitted('update:modelValue')).toEqual([['world']])
```

- For components using multiple named v-models (Vue 3.x feature), test each named model independently: `v-model:title` compiles to `:title` + `@update:title`.

### Migrating from Vue Test Utils v1 (Vue 2) to v2 (Vue 3)

Several APIs changed in ways that cause silent test failures rather than errors.

- `wrapper.find(Component)` now requires passing the component definition directly, not a string selector matching the component name. `wrapper.findComponent(MyComp)` is the correct API.
- `wrapper.vm.$nextTick()` still works but prefer `nextTick` imported from `vue` -- it is more reliable in the test environment.
- `wrapper.trigger('input')` no longer sets `event.target.value` automatically. Use `wrapper.setValue('text')` for input elements instead.
- The `localVue` pattern (creating a local Vue instance with plugins) is removed entirely. Use `global.plugins` in mount options instead.
- `wrapper.destroy()` is renamed to `wrapper.unmount()`. The old name silently does nothing in v2, which is why you may see test pollution that is hard to trace.

### Testing Composables with `watch` and `watchEffect`

Watchers in composables are asynchronous by default and require special handling.

- Watchers with `{ immediate: false }` (default) do not run synchronously. After changing a reactive dependency, you must `await nextTick()` or `await flushPromises()` before asserting on watcher side effects.
- Watchers with `{ immediate: true }` run synchronously on setup. No await needed for the initial run, but subsequent triggers still need `nextTick`.
- Use `watchEffect` carefully in tests -- it runs immediately and synchronously on first call, but async operations inside it still need `flushPromises()`.
- For composables that set up watchers to synchronize with external state (e.g., `localStorage`, `window.matchMedia`), mock the external dependency before calling the composable and assert that the reactive ref reflects the mocked value after `nextTick`.

### Handling `provide`/`inject` Across Deeply Nested Component Trees

Testing components that rely on `inject` from a distant ancestor requires providing the injection at mount time.

- Use `global.provide` in mount options for the component under test, not just for its parent:

```typescript
const wrapper = mount(DeepChild, {
  global: {
    provide: {
      formContext: { register: vi.fn(), unregister: vi.fn(), validate: vi.fn() },
    },
  },
})
```

- For tests that verify the full provide/inject chain (e.g., a `Form` component providing context to `FormField` children), mount the `Form` component with real `FormField` children as slots. Do not try to simulate the injection manually -- test the integration directly.
- When a component calls `inject` without a default value and the injection is missing, Vue 3 emits a warning but does not throw. Your test will pass with `undefined` injected values causing silent failures. Always assert that injected values are used correctly in the rendered output.

---

## Example

**Input:** "I have a `SearchBar` component that debounces user input by 300ms, calls a Pinia store action `fetchResults(query)`, and shows a loading spinner while the fetch is in flight and an empty state message when results are empty. How do I write comprehensive tests for it?"

**Output:**

### Test Strategy for SearchBar

**Testing Level:** Component Integration test (mounts real component with `createTestingPinia`, tests DOM output and user interactions end-to-end within the component boundary).

**Rationale:** `SearchBar` combines reactive state, debouncing, store interaction, and conditional rendering -- testing these together at the integration level gives high confidence without requiring E2E overhead.

---

#### Component Under Test (for reference)

```vue
<!-- src/components/SearchBar.vue -->
<template>
  <div>
    <input
      data-testid="search-input"
      :value="query"
      @input="onInput"
      placeholder="Search..."
    />
    <div v-if="searchStore.isLoading" data-testid="loading-spinner">Loading...</div>
    <div
      v-else-if="searchStore.results.length === 0 && query.length > 0 && !searchStore.isLoading"
      data-testid="empty-state"
    >
      No results found
    </div>
    <ul data-testid="results-list">
      <li
        v-for="result in searchStore.results"
        :key="result.id"
        data-testid="result-item"
      >
        {{ result.title }}
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import { useSearchStore } from '@/stores/search'

const query = ref('')
const searchStore = useSearchStore()

const debouncedFetch = useDebounceFn((value: string) => {
  searchStore.fetchResults(value)
}, 300)

function onInput(event: Event) {
  query.value = (event.target as HTMLInputElement).value
  if (query.value.length > 0) {
    debouncedFetch(query.value)
  }
}
</script>
```

---

#### Test File

```typescript
// src/components/__tests__/SearchBar.test.ts
import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createTestingPinia } from '@pinia/testing'
import { nextTick } from 'vue'
import SearchBar from '../SearchBar.vue'
import { useSearchStore } from '@/stores/search'

// Factory function -- single source of truth for mounting SearchBar in tests
function createWrapper(overrides: { initialState?: object } = {}) {
  return mount(SearchBar, {
    global: {
      plugins: [
        createTestingPinia({
          createSpy: vi.fn,
          initialState: {
            search: {
              results: [],
              isLoading: false,
              ...overrides.initialState,
            },
          },
        }),
      ],
    },
  })
}

describe('SearchBar', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  // ----------------------------------------------------------------
  describe('initial rendering', () => {
    it('renders an empty input field', () => {
      const wrapper = createWrapper()
      const input = wrapper.find('[data-testid="search-input"]')
      expect(input.exists()).toBe(true)
      expect((input.element as HTMLInputElement).value).toBe('')
    })

    it('does not show loading spinner on initial render', () => {
      const wrapper = createWrapper()
      expect(wrapper.find('[data-testid="loading-spinner"]').exists()).toBe(false)
    })

    it('does not show empty state message when query is empty', () => {
      const wrapper = createWrapper()
      expect(wrapper.find('[data-testid="empty-state"]').exists()).toBe(false)
    })

    it('does not render any result items when results are empty', () => {
      const wrapper = createWrapper()
      expect(wrapper.findAll('[data-testid="result-item"]')).toHaveLength(0)
    })
  })

  // ----------------------------------------------------------------
  describe('debounced search behavior', () => {
    it('does NOT call fetchResults immediately on input', async () => {
      const wrapper = createWrapper()
      const store = useSearchStore()

      await wrapper.find('[data-testid="search-input"]').setValue('vue')
      // Advance time by less than debounce threshold
      vi.advanceTimersByTime(299)
      await nextTick()

      expect(store.fetchResults).not.toHaveBeenCalled()
    })

    it('calls fetchResults with the query after 300ms debounce', async () => {
      const wrapper = createWrapper()
      const store = useSearchStore()

      await wrapper.find('[data-testid="search-input"]').setValue('vue')
      vi.advanceTimersByTime(300)
      await nextTick()

      expect(store.fetchResults).toHaveBeenCalledOnce()
      expect(store.fetchResults).toHaveBeenCalledWith('vue')
    })

    it('calls fetchResults only once when user types rapidly', async () => {
      const wrapper = createWrapper()
      const store = useSearchStore()
      const input = wrapper.find('[data-testid="search-input"]')

      // Simulate rapid typing: v, vu, vue in quick succession
      await input.setValue('v')
      vi.advanceTimersByTime(100)
      await input.setValue('vu')
      vi.advanceTimersByTime(100)
      await input.setValue('vue')
      vi.advanceTimersByTime(300) // Only last keystroke's debounce completes
      await nextTick()

      expect(store.fetchResults).toHaveBeenCalledOnce()
      expect(store.fetchResults).toHaveBeenCalledWith('vue')
    })

    it('does NOT call fetchResults when input is cleared to empty string', async () => {
      const wrapper = createWrapper()
      const store = useSearchStore()

      await wrapper.find('[data-testid="search-input"]').setValue('')
      vi.advanceTimersByTime(300)
      await nextTick()

      expect(store.fetchResults).not.toHaveBeenCalled()
    })
  })

  // ----------------------------------------------------------------
  describe('loading state', () => {
    it('shows loading spinner when store isLoading is true', async () => {
      const wrapper = createWrapper({ initialState: { isLoading: true } })
      expect(wrapper.find('[data-testid="loading-spinner"]').exists()).toBe(true)
    })

    it('hides loading spinner when store isLoading transitions to false', async () => {
      const wrapper = createWrapper({ initialState: { isLoading: true } })
      const store = useSearchStore()

      // Simulate the store completing its fetch
      store.isLoading = false
      await nextTick()

      expect(wrapper.find('[data-testid="loading-spinner"]').exists()).toBe(false)
    })

    it('does not show empty state while loading is in progress', async () => {
      const wrapper = createWrapper({
        initialState: { isLoading: true, results: [] },
      })
      // Type a query to set local query ref
      await wrapper.find('[data-testid="search-input"]').setValue('vue')
      await nextTick()

      // Empty state should NOT show -- loading takes visual priority
      expect(wrapper.find('[data-testid="empty-state"]').exists()).toBe(false)
      expect(wrapper.find('[data-testid="loading-spinner"]').exists()).toBe(true)
    })
  })

  // ----------------------------------------------------------------
  describe('results rendering', () => {
    it('renders result items when store returns results', async () => {
      const wrapper = createWrapper({
        initialState: {
          results: [
            { id: '1', title: 'Vue 3 Fundamentals' },
            { id: '2', title: 'Composition API Deep Dive' },
          ],
          isLoading: false,
        },
      })

      const items = wrapper.findAll('[data-testid="result-item"]')
      expect(items).toHaveLength(2)
      expect(items[0].text()).toBe('Vue 3 Fundamentals')
      expect(items[1].text()).toBe('Composition API Deep Dive')
    })

    it('renders correct number of results from store', async () => {
      const results = Array.from({ length: 10 }, (_, i) => ({
        id: String(i),
        title: `Result ${i}`,
      }))
      const wrapper = createWrapper({ initialState: { results, isLoading: false } })

      expect(wrapper.findAll('[data-testid="result-item"]')).toHaveLength(10)
    })
  })

  // ----------------------------------------------------------------
  describe('empty state', () => {
    it('shows empty state message after search with no results', async () => {
      // Start with no results and not loading
      const wrapper = createWrapper({ initialState: { results: [], isLoading: false } })

      // User has typed a query (simulate post-debounce state)
      await wrapper.find('[data-testid="search-input"]').setValue('xyznotfound')
      vi.advanceTimersByTime(300)
      await flushPromises()

      // Manually update store to simulate action completing with empty results
      const store = useSearchStore()
      store.isLoading = false
      await nextTick()

      expect(wrapper.find('[data-testid="empty-state"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="empty-state"]').text()).toBe('No results found')
    })

    it('does not show empty state when query is blank even if results are empty', async () => {
      const wrapper = createWrapper({ initialState: { results: [], isLoading: false } })
      // input remains empty -- no query typed
      expect(wrapper.find('[data-testid="empty-state"]').exists()).toBe(false)
    })
  })
})
```

---

#### Decision Matrix for SearchBar Test Choices

| Decision | Choice Made | Alternative Considered | Reason |
|----------|-------------|----------------------|--------|
| Pinia setup | `createTestingPinia` | Real Pinia | Prevents state leak, auto-spies actions |
| Timer handling | `vi.useFakeTimers()` | `await new Promise(r => setTimeout(r, 300))` | Fake timers are deterministic and instant |
| Input triggering | `setValue()` | `trigger('input')` | `setValue` correctly sets `event.target.value` |
| Selectors | `data-testid` | CSS classes | CSS classes are styling concerns, not test contracts |
| Test isolation | `beforeEach` factory | Shared wrapper | Each test gets clean state with no pollution risk |
| DOM assertions | `wrapper.find().exists()` | `wrapper.vm.query` | Tests behavior visible to user, not internal state |

---

#### Common Pitfalls Specific to This Component

- **Forgetting `await` on `setValue`:** `setValue` returns a promise. Not awaiting it means the input event fires but Vue's reactive update has not yet propagated when you advance timers.
- **Advancing timers before `setValue` resolves:** Call `await input.setValue(...)` completely before calling `vi.advanceTimersByTime(300)`.
- **Testing debounce with real timers:** Using `setTimeout` in tests makes the suite 300ms slower per debounce test. Always use `vi.useFakeTimers()` for any time-dependent behavior.
- **Asserting empty state without setting `query`:** The empty state condition requires both `results.length === 0` AND `query.length > 0`. Tests that only set store state without setting input value will incorrectly fail to see the empty state.
