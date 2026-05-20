---
name: react-testing-patterns
description: |
  Guides expert-level react testing patterns implementation: typescript and testing decision frameworks, production-ready patterns, and concrete templates for react testing patterns workflows.
  Use when the user asks about react testing patterns, react testing patterns configuration, or typescript best practices for react projects.
  Do NOT use when the user needs a different web development capability -- check sibling skills in the web development subcategory.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "typescript testing frameworks accessibility"
  category: "web-development"
  subcategory: "web-development"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# React Testing Patterns

## When to Use

**Use this skill when:**
- The user asks how to test a specific React component pattern -- hooks, context providers, compound components, portals, or async data fetching
- The user wants to choose between testing approaches: React Testing Library vs Enzyme vs Cypress component testing vs Vitest
- The user is writing TypeScript-typed tests and needs guidance on typing mocks, spy functions, or render helpers
- The user wants to add accessibility assertions to their test suite using jest-axe, @testing-library/jest-dom, or aria role queries
- The user needs to test components that depend on routing (React Router), global state (Redux, Zustand, Jotai), or server state (React Query, SWR)
- The user is setting up a test configuration from scratch -- jest.config.ts, vitest.config.ts, setupTests.ts, or MSW handlers
- The user asks about testing coverage thresholds, CI integration, or test performance (suite taking over 60 seconds)
- The user needs to test error boundaries, Suspense boundaries, or React 18 concurrent rendering behavior
- The user wants patterns for testing custom hooks in isolation without rendering a full component tree
- The user asks about snapshot testing -- when to use it, when to avoid it, and how to maintain snapshots properly

**Do NOT use this skill when:**
- The user needs help with end-to-end testing of full user flows across multiple pages -- use a dedicated E2E skill covering Playwright or Cypress test authoring
- The user is asking about backend API testing, Node.js unit testing, or Express middleware testing -- those have different tool sets
- The user is asking about performance profiling or React DevTools -- that is a separate profiling skill
- The user needs help with React component architecture or design patterns unrelated to testing -- check the React architecture skill
- The user is building a non-React frontend (Vue, Svelte, Angular, Lit) -- testing patterns differ meaningfully enough to require a different skill
- The user only needs to configure CI/CD pipelines generically -- the testing patterns here assume tests are already written
- The user is asking about visual regression testing with tools like Chromatic or Percy -- those require snapshot diffing workflows not covered here

---

## Process

### 1. Establish the Testing Stack and Configuration

Before writing a single test, confirm the foundational toolchain and configuration:

- **Choose the test runner:** Vitest is the recommended default for Vite-based projects (React + Vite, Next.js with custom Vite config). Jest remains the default for Create React App and Next.js projects not using Vite. Vitest offers 2-5x faster cold starts due to native ESM and shared Vite transform pipeline.
- **Set up React Testing Library (RTL):** Install `@testing-library/react`, `@testing-library/user-event` (v14+, which uses async pointer events by default), and `@testing-library/jest-dom`. RTL's `render` is the primary entry point for all component tests.
- **Configure jsdom:** Both Jest and Vitest need a DOM environment. Set `testEnvironment: 'jsdom'` in jest.config.ts or `environment: 'jsdom'` in vitest.config.ts. Add `setupFilesAfterFramework: ['./src/setupTests.ts']` to auto-import `@testing-library/jest-dom` matchers.
- **TypeScript configuration for tests:** Ensure `tsconfig.json` includes test files if you want type checking in tests, OR create a `tsconfig.test.json` that extends the base config with `"types": ["vitest/globals", "@testing-library/jest-dom"]` to avoid polluting production types.
- **Install MSW for network mocking:** `msw` v2 with `@mswjs/data` is the production standard for intercepting fetch and Axios calls in tests without modifying application code. Initialize handlers in `src/mocks/handlers.ts` and the server in `src/mocks/server.ts`.
- **Add jest-axe for accessibility testing:** `jest-axe` wraps the `axe-core` engine and integrates with jest/vitest matchers via `expect(results).toHaveNoViolations()`. This catches WCAG 2.1 AA violations automatically.

A minimal `vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    globals: true,
    coverage: {
      provider: 'v8',
      thresholds: {
        lines: 80,
        branches: 75,
        functions: 80,
        statements: 80,
      },
    },
  },
});
```

A minimal `src/setupTests.ts`:
```typescript
import '@testing-library/jest-dom';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { server } from './mocks/server';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

---

### 2. Classify What You Are Testing and Apply the Right Pattern

React tests fall into four distinct categories. Identify the category before choosing the pattern:

- **Unit: Pure UI components** -- Components with no side effects, no data fetching, no context dependencies. Test rendering output for each significant prop combination. Use `screen.getByRole` queries (not `getByTestId`) as the primary assertion mechanism. Verify accessible names, not implementation details like class names.
- **Integration: Components with dependencies** -- Components that consume context, call hooks that fetch data, or coordinate child components. Wrap in real or mocked providers. Use MSW to intercept API calls rather than mocking `fetch` directly.
- **Hook isolation tests** -- Custom hooks tested with `renderHook` from `@testing-library/react`. This is preferable to testing hooks only through the components that use them, which creates brittle coupling.
- **Accessibility tests** -- Run `axe` on rendered output after all async operations have settled. These complement but do not replace manual screen reader testing.

Decision rule: if a test imports a component file and also imports a mock of a module the component depends on via `vi.mock()` or `jest.mock()`, it is an integration test regardless of size. Name it accordingly and expect it to be slower (200-800ms range is acceptable; over 2 seconds indicates a problem).

---

### 3. Write Queries Using the RTL Priority Hierarchy

The order in which you query the DOM determines how resilient tests are to UI refactoring. Follow this strict priority:

1. `getByRole` with `{ name: 'Submit' }` -- matches by ARIA role and accessible name. This is the single most important query. Use it for buttons, inputs, headings, checkboxes, links, dialogs, and listbox items.
2. `getByLabelText` -- for form inputs associated with a `<label>`. Catches missing label associations, which are accessibility bugs.
3. `getByPlaceholderText` -- fallback for inputs without labels; use it only when you control the placeholder and label is genuinely absent by design.
4. `getByText` -- for non-interactive content. Use `{ exact: false }` when text contains dynamic values.
5. `getByDisplayValue` -- for reading the current value of an input, select, or textarea.
6. `getByAltText` -- for images. Ensures `alt` attributes exist.
7. `getByTitle` -- rarely appropriate; tooltips and title attributes are accessibility anti-patterns in most cases.
8. `getByTestId` -- LAST RESORT. Reserve for cases where the element has no semantic meaning (e.g., a loading skeleton div). When you use `data-testid`, prefix it with the component name (`data-testid="UserCard-avatar"`) to create a namespace.

Never query by CSS class name (`.querySelector('.btn-primary')`). Class names are implementation details and change during refactors without breaking functionality.

---

### 4. Type Mocks and Render Helpers Correctly in TypeScript

Untyped mocks are a source of silent errors. Apply these patterns:

- **Typing vi.fn() / jest.fn() spy arguments:** Use `vi.fn<Parameters<typeof originalFn>, ReturnType<typeof originalFn>>()` or simply let TypeScript infer from the mock implementation. Do NOT cast with `as jest.Mock` -- this erases type safety.
- **Partial mocks with vi.spyOn:** `vi.spyOn(module, 'functionName').mockReturnValue(expectedValue)` -- TypeScript will enforce that `expectedValue` matches the function's real return type.
- **Typing mocked modules:** When using `vi.mock('../api/users')`, create a typed helper:
  ```typescript
  import { getUserById } from '../api/users';
  vi.mock('../api/users');
  const mockGetUserById = vi.mocked(getUserById);
  ```
  `vi.mocked()` preserves the original function signature while allowing mock method calls like `.mockResolvedValue()`.
- **Custom render functions:** Create a `src/test-utils/render.tsx` that wraps RTL's `render` with all providers the app uses (QueryClientProvider, Router, ThemeProvider, Redux store). Type the wrapper's `options` parameter to extend RTL's `RenderOptions`:
  ```typescript
  import { render, RenderOptions } from '@testing-library/react';
  import { ReactElement } from 'react';

  interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
    initialRoute?: string;
  }

  function customRender(ui: ReactElement, options: CustomRenderOptions = {}) {
    const { initialRoute = '/', ...renderOptions } = options;
    return render(ui, {
      wrapper: ({ children }) => (
        <AllProviders initialRoute={initialRoute}>{children}</AllProviders>
      ),
      ...renderOptions,
    });
  }

  export * from '@testing-library/react';
  export { customRender as render };
  ```
  Import from `test-utils` everywhere instead of directly from `@testing-library/react`.

---

### 5. Handle Async Behavior and State Updates

Async behavior is the most common source of flaky tests. Apply these patterns rigorously:

- **Always use `userEvent.setup()`** at the top of the test function, not `userEvent` directly. `userEvent.setup()` returns a bound instance that correctly simulates pointer events, keyboard events, and focus management in sequence. `userEvent.click()` from the top-level import is the legacy API and does not simulate the full event chain.
- **Await all user interactions:** `await user.click(button)` -- every interaction method on the `userEvent` instance is async in v14+.
- **Use `waitFor` for assertions that depend on async state changes:**
  ```typescript
  await waitFor(() => {
    expect(screen.getByText('Data loaded')).toBeInTheDocument();
  });
  ```
  Set a custom timeout when testing slow operations: `waitFor(() => {...}, { timeout: 5000 })`. Default is 1000ms.
- **Use `findBy` queries for elements that appear asynchronously:** `screen.findByRole('alert')` is equivalent to `waitFor(() => screen.getByRole('alert'))` and is more readable for single-element assertions.
- **Wrap React 18 state updates in `act()`:** RTL's `render`, `userEvent` methods, and `waitFor` all call `act()` internally. You should only call `act()` manually when you are triggering state updates outside of RTL's control (e.g., directly invoking a callback prop from outside the component).
- **Avoid `await new Promise(resolve => setTimeout(resolve, 0))`** (timer hacks). Use `vi.useFakeTimers()` and advance time explicitly with `vi.advanceTimersByTimeAsync(1000)` when testing debounced or throttled behavior.

---

### 6. Mock External Dependencies Correctly

The correct mocking strategy depends on the dependency type:

- **HTTP requests -- always use MSW:** Define handlers in `src/mocks/handlers.ts` using `http.get('/api/users', () => HttpResponse.json([...]))`. Override specific handlers per test using `server.use(http.get('/api/users', () => HttpResponse.json([], { status: 500 })))` to simulate error states. MSW intercepts at the network level, which means your actual fetch/axios configuration is exercised, not bypassed.
- **Browser APIs not in jsdom:** Mock `window.matchMedia`, `IntersectionObserver`, `ResizeObserver`, and `navigator.clipboard` in `setupTests.ts`. Provide implementations that return sensible defaults.
- **Timers:** Use `vi.useFakeTimers()` in `beforeEach` and `vi.useRealTimers()` in `afterEach` for tests involving `setTimeout`, `setInterval`, `Date.now()`, or debounce logic.
- **Modules that import environment variables:** Mock at the module level using `vi.mock('../config', () => ({ API_URL: 'http://localhost:3000' }))`. Never read `process.env` directly in component code -- centralize env access in a config module so it can be mocked cleanly.
- **React Router navigation:** Use `MemoryRouter` with `initialEntries` prop for route-based tests. For `useNavigate`, spy on the navigate function using `vi.spyOn` rather than mocking the entire module.
- **Do NOT mock child components unless they are third-party with heavy setup** (e.g., a map library that requires canvas). Mocking child components makes tests brittle and hides integration bugs. Test the full component tree.

---

### 7. Test Custom Hooks with renderHook

Custom hooks deserve isolated tests separate from the components that consume them:

- Import `renderHook` and `act` from `@testing-library/react`. Wrap state-updating calls in `act()` when calling them outside of RTL's async utilities.
- Wrap hooks that require providers using the `wrapper` option:
  ```typescript
  const { result } = renderHook(() => useUserProfile(userId), {
    wrapper: ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>,
  });
  ```
- Access the hook's return value via `result.current`. After triggering updates, always re-read `result.current` -- the reference is live.
- For hooks that return async state, use `waitFor` to poll until the expected state is reached:
  ```typescript
  await waitFor(() => expect(result.current.status).toBe('success'));
  expect(result.current.data).toEqual(expectedUser);
  ```
- Test hook error states by configuring MSW to return error responses. Do not mock the hook's internal fetch calls directly -- that defeats the purpose of testing the hook's error handling logic.

---

### 8. Enforce Accessibility and Coverage Standards

Accessibility testing should be automated and mandatory, not optional:

- **Run axe after every async operation settles:**
  ```typescript
  const { container } = render(<RegistrationForm />);
  await waitFor(() => screen.getByRole('form'));
  const results = await axe(container);
  expect(results).toHaveNoViolations();
  ```
- **Use RTL's ARIA role queries as a first-pass accessibility check:** If you cannot query an element by role and name, the element likely lacks proper ARIA semantics. Fix the component, not the test.
- **Set meaningful coverage thresholds:** 80% line coverage is the industry minimum for production React applications. Set branch coverage to 75% -- this catches untested conditional rendering paths. Do not aim for 100% coverage on everything; focus coverage on business logic hooks and complex conditional rendering, not on simple presentational components.
- **Exclude from coverage:** Add `/* v8 ignore next */` or `/* istanbul ignore next */` annotations sparingly and only for truly untestable code (e.g., environment guard clauses). Exclude generated files (GraphQL types, icon components) via `coverage.exclude` in your config.

---

## Output Format

When helping a user implement or review React testing patterns, provide output in this structure:

```
## Test Strategy for [Component or Hook Name]

### Classification
- Test Category: [Unit | Integration | Hook | Accessibility]
- Dependencies: [List context providers, APIs, router, stores]
- Async Behavior: [Yes/No -- describe what is async]

### Setup

```typescript
// Required imports
import { render, screen, waitFor } from '../test-utils/render';
import userEvent from '@testing-library/user-event';
import { server } from '../mocks/server';
import { http, HttpResponse } from 'msw';
// MSW handler overrides for this test file
```

### Test Cases

| Scenario | Query Strategy | Async | Assertion Type |
|----------|---------------|-------|----------------|
| Default render | getByRole | No | toBeInTheDocument |
| Loading state | getByRole('status') | Yes (findBy) | toBeInTheDocument |
| Success state | findByRole('list') | Yes (waitFor) | toHaveLength(n) |
| Error state | findByRole('alert') | Yes (waitFor) | toHaveTextContent |
| User interaction | getByRole('button') | Yes (await user.click) | onChange called |
| Accessibility | container | Yes (axe) | toHaveNoViolations |

### Implementation

```typescript
describe('[ComponentName]', () => {
  const user = userEvent.setup();

  describe('rendering', () => {
    it('renders [scenario] correctly', async () => {
      // Arrange
      // Act
      // Assert
    });
  });

  describe('interactions', () => {
    it('calls [callback] when [action] occurs', async () => {
      // Arrange
      // Act
      // Assert
    });
  });

  describe('async behavior', () => {
    it('shows loading state then data', async () => {
      // Arrange
      // Act
      // Assert
    });
  });

  describe('accessibility', () => {
    it('has no WCAG violations', async () => {
      // Arrange + Act
      // Assert with axe
    });
  });
});
```

### Mocking Requirements
- MSW Handlers: [list endpoints and response shapes]
- Module Mocks: [list vi.mock calls with rationale]
- Browser API Stubs: [list any window/navigator mocks needed]

### Coverage Targets
- Lines: [target %]
- Branches: [target %]
- Key paths to cover: [list critical conditional branches]
```

---

## Rules

1. **NEVER use `getByTestId` as the primary query strategy.** Every `data-testid` in production component code is a missed opportunity to enforce accessibility semantics. Reserve `getByTestId` for skeleton loaders, animation containers, and other elements with no semantic role. If you add more than 2 `data-testid` attributes in a single component, the component lacks proper ARIA structure -- fix the component.

2. **NEVER import directly from `@testing-library/react` in test files.** Always import from the custom `test-utils/render` wrapper that includes all providers. Tests that forget to wrap in providers produce false positives (the component renders with undefined context and may not crash, but the test is not realistic).

3. **NEVER use `fireEvent` when `userEvent` is available.** `fireEvent.click()` dispatches a single click DOM event. `userEvent.click()` dispatches the full sequence: `pointerover`, `pointerenter`, `mouseover`, `mouseenter`, `pointermove`, `mousemove`, `pointerdown`, `mousedown`, `pointerup`, `mouseup`, `click`. Components with hover states, focus traps, or drag interactions will behave differently under `fireEvent` than in a real browser.

4. **NEVER use `waitFor` with multiple assertions.** A single `waitFor` callback should assert exactly one condition. Multiple assertions inside `waitFor` create timing issues where the first assertion passes but the second fails intermittently. Chain `waitFor` calls or use `findBy` for the first async element, then use synchronous `expect` for subsequent assertions on elements already in the DOM.

5. **NEVER mock modules that are under test.** If you are testing `useAuthFlow`, do not mock `useAuthFlow`'s internal calls to `useTokenRefresh` unless `useTokenRefresh` makes real network calls (in which case, use MSW to mock the network, not the hook). Mocking internals means you are testing the mock, not the code.

6. **ALWAYS reset MSW handlers in `afterEach`.** Call `server.resetHandlers()` after each test. Failing to do so causes handler overrides from one test to bleed into subsequent tests, causing intermittent failures that are extremely difficult to diagnose.

7. **NEVER use snapshot tests for components with dynamic content** (dates, IDs, random values, user-generated content). Snapshots will fail on every run. Use inline assertions instead. Reserve snapshots for purely static components (icon sets, static marketing blocks) and commit to updating them deliberately.

8. **ALWAYS test the error boundary and Suspense fallback states explicitly.** The most common untested code path in React applications is the error state. Write at least one test per data-fetching component that configures MSW to return a 500 error, then asserts the error UI renders correctly and the error message is accessible.

9. **NEVER place `vi.mock()` or `jest.mock()` calls inside `describe` or `it` blocks.** Mock calls are hoisted to the top of the file by the bundler at compile time regardless of where you write them. Placing them inside blocks creates code that reads as if scoping applies when it does not, producing confusing behavior.

10. **ALWAYS clean up side effects in `afterEach`.** Call `vi.clearAllMocks()` (resets call history but keeps implementations) or `vi.resetAllMocks()` (resets implementations too) depending on whether mock implementations are set in `beforeEach`. Use `vi.restoreAllMocks()` only when you used `vi.spyOn` and want to restore the original implementation. Inconsistent cleanup is the root cause of over 60% of intermittent test failures in React projects.

---

## Edge Cases

### Testing Components Wrapped in Multiple Nested Providers

When a component requires 4+ context providers (Router + QueryClient + Redux + Theme + I18n), the `AllProviders` wrapper in `test-utils/render.tsx` can become unwieldy and tests become slow due to provider initialization. Create a `createTestQueryClient()` factory that returns a `QueryClient` with `retry: false` and `gcTime: 0` -- this prevents React Query from retrying failed requests (which would cause tests to hang for several seconds) and from caching data between tests. Set `staleTime: 0` so that components always refetch when they mount in tests, giving you control through MSW handlers. Create the `QueryClient` fresh in each test's `beforeEach`, not once at module level, to prevent query cache pollution between tests.

### Testing Components That Use Portals

Components that render into `document.body` via `ReactDOM.createPortal` (modals, tooltips, toasts) appear outside the container returned by `render()`. Query them using `screen.*` queries (which search the entire document) rather than `within(container).*` queries. When testing modal focus management, use `document.activeElement` to assert focus has moved into the portal. To test that `Escape` closes the modal, use `await user.keyboard('{Escape}')` -- not `fireEvent.keyDown` -- to correctly simulate the full keyboard event sequence.

### Testing Components with IntersectionObserver (Infinite Scroll, Lazy Images)

jsdom does not implement `IntersectionObserver`. Create a mock in `setupTests.ts`:
```typescript
const mockIntersectionObserver = vi.fn().mockImplementation((callback) => ({
  observe: vi.fn().mockImplementation(() => callback([{ isIntersecting: true }])),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));
window.IntersectionObserver = mockIntersectionObserver;
```
This mock fires the callback immediately with `isIntersecting: true`, simulating an element entering the viewport. For tests that need to verify behavior when NOT in the viewport, create an alternate mock that passes `isIntersecting: false`.

### Testing Error Boundaries

React error boundaries require a component to throw during rendering. In tests, create a `ThrowOnRender` test component:
```typescript
const ThrowOnRender = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) throw new Error('Test render error');
  return <div>Safe</div>;
};
```
Suppress the expected `console.error` output that React prints when an error boundary catches an error -- otherwise it pollutes test output and can cause false CI failures. Use `vi.spyOn(console, 'error').mockImplementation(() => {})` in `beforeEach` and restore it in `afterEach`. Assert that the error boundary's fallback UI renders and is accessible using `axe`.

### Testing Components with `useEffect` Data Fetching Without React Query

Components that fetch in `useEffect` directly (using `fetch` or axios) require careful async handling because the fetch fires after render. Configure the MSW handler before rendering. Use `await screen.findByRole(...)` to wait for the loaded state rather than `waitFor(() => screen.getByRole(...))` -- `findBy` has cleaner semantics for single-element async appearance. Always test the loading state by making the MSW handler delay its response: `http.get('/api/data', async () => { await delay(100); return HttpResponse.json(data); })`. Use `vi.useFakeTimers()` to control that delay precisely.

### Testing Zustand or Jotai Stores in Isolation

Global stores that persist state across tests cause the most insidious test pollution. For Zustand, create a store with `createStore` (not `create`) so you can instantiate a fresh store per test:
```typescript
const createTestStore = () => createStore<UserStore>()(userSlice);
let testStore: ReturnType<typeof createTestStore>;
beforeEach(() => { testStore = createTestStore(); });
```
Pass the test store into the component wrapper using the store's context provider. For Jotai, wrap each test's render in a `<Provider store={createStore()}>` where the store is created fresh. Never export a global singleton store from your store module -- always export the creator function.

### Testing React 18 Concurrent Features (Transitions and Deferred Values)

`useTransition` and `useDeferredValue` use React's scheduler and do not flush synchronously in tests. When testing components that use `startTransition`, wrap the interaction that triggers the transition in `act()` explicitly, then use `waitFor` to assert the post-transition state. Be aware that `isPending` state from `useTransition` may be true for only a single render frame -- test it by intercepting a slow MSW response and asserting the pending indicator appears before the response arrives. Set the MSW handler delay to 50ms and assert `isPending` state within a `waitFor` with a `timeout: 100`.

### Testing Components in a Monorepo with Shared Packages

When a tested component imports from a shared internal package (`@company/design-system`, `@company/auth`), configure the test runner's module resolver to use the TypeScript source of those packages rather than their compiled output. Add path aliases in `vitest.config.ts` under `resolve.alias`:
```typescript
resolve: {
  alias: {
    '@company/design-system': path.resolve(__dirname, '../packages/design-system/src'),
  },
}
```
This eliminates the need to rebuild shared packages before running tests, cutting CI time by 30-60% in monorepo setups. If shared packages have their own `setupTests.ts`, import them in the consuming package's setup file to avoid duplicating browser API mocks.

---

## Example

**Input:** "I have a `UserProfileCard` component in TypeScript that fetches user data with React Query's `useQuery`, shows a loading skeleton, shows an error message on failure, and has a 'Follow' button that calls a POST endpoint. How do I test it properly?"

**Output:**

## Test Strategy for UserProfileCard

### Classification
- Test Category: Integration (React Query + network calls + user interaction)
- Dependencies: QueryClientProvider, React Query's `useQuery` and `useMutation`, MSW for network interception
- Async Behavior: Yes -- initial data fetch on mount, mutation on button click

---

### Setup

First, ensure MSW handlers cover both endpoints. In `src/mocks/handlers.ts`:

```typescript
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/users/:userId', ({ params }) => {
    return HttpResponse.json({
      id: params.userId,
      name: 'Ada Lovelace',
      bio: 'Mathematician and first programmer',
      avatarUrl: 'https://example.com/ada.jpg',
      followerCount: 1842,
      isFollowedByCurrentUser: false,
    });
  }),

  http.post('/api/users/:userId/follow', () => {
    return HttpResponse.json({ success: true });
  }),
];
```

In `src/test-utils/render.tsx`:

```typescript
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactElement } from 'react';

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,       // Don't retry on failure -- tests need immediate error state
        staleTime: 0,       // Always refetch so MSW controls responses
        gcTime: 0,          // Don't cache between tests
      },
      mutations: {
        retry: false,
      },
    },
  });
}

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {}

export function render(ui: ReactElement, options: CustomRenderOptions = {}) {
  const queryClient = createTestQueryClient();
  return {
    ...render(ui, {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      ),
      ...options,
    }),
    queryClient,
  };
}

export * from '@testing-library/react';
```

---

### Test File

```typescript
import { render, screen, waitFor, within } from '../test-utils/render';
import userEvent from '@testing-library/user-event';
import { server } from '../mocks/server';
import { http, HttpResponse, delay } from 'msw';
import { axe } from 'jest-axe';
import { UserProfileCard } from './UserProfileCard';

describe('UserProfileCard', () => {
  const user = userEvent.setup();
  const testUserId = 'user-123';

  // ----------------------------------------------------------------
  // Loading State
  // ----------------------------------------------------------------
  describe('loading state', () => {
    it('renders a loading skeleton while fetching user data', async () => {
      // Make the response slow so we can assert the loading state
      server.use(
        http.get('/api/users/:userId', async () => {
          await delay(200);
          return HttpResponse.json({ id: testUserId, name: 'Ada Lovelace' });
        })
      );

      render(<UserProfileCard userId={testUserId} />);

      // Loading skeleton should be present immediately before data arrives
      expect(screen.getByRole('status', { name: /loading user profile/i }))
        .toBeInTheDocument();

      // Wait for data to arrive and skeleton to disappear
      await waitFor(() => {
        expect(screen.queryByRole('status', { name: /loading user profile/i }))
          .not.toBeInTheDocument();
      });
    });
  });

  // ----------------------------------------------------------------
  // Success State
  // ----------------------------------------------------------------
  describe('success state', () => {
    it('renders user name, bio, and follower count after fetch', async () => {
      render(<UserProfileCard userId={testUserId} />);

      // Use findBy for the first async element -- cleaner than waitFor + getBy
      const heading = await screen.findByRole('heading', { name: 'Ada Lovelace' });
      expect(heading).toBeInTheDocument();

      expect(screen.getByText('Mathematician and first programmer')).toBeInTheDocument();
      // Test formatted number -- component should display "1,842 followers"
      expect(screen.getByText('1,842 followers')).toBeInTheDocument();
    });

    it('renders the Follow button in an unfollowed state', async () => {
      render(<UserProfileCard userId={testUserId} />);

      const followButton = await screen.findByRole('button', { name: /follow ada lovelace/i });
      expect(followButton).toBeInTheDocument();
      // Check aria-pressed reflects unfollowed state
      expect(followButton).toHaveAttribute('aria-pressed', 'false');
    });
  });

  // ----------------------------------------------------------------
  // Error State
  // ----------------------------------------------------------------
  describe('error state', () => {
    beforeEach(() => {
      // Suppress expected React Query console.error output
      vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      vi.mocked(console.error).mockRestore();
    });

    it('renders an accessible error message when the API returns 500', async () => {
      server.use(
        http.get('/api/users/:userId', () => {
          return HttpResponse.json(
            { message: 'Internal Server Error' },
            { status: 500 }
          );
        })
      );

      render(<UserProfileCard userId={testUserId} />);

      const alert = await screen.findByRole('alert');
      expect(alert).toHaveTextContent(/failed to load profile/i);
      // Ensure there is a retry button so the user is not stuck
      expect(within(alert).getByRole('button', { name: /try again/i }))
        .toBeInTheDocument();
    });

    it('renders an error when the network request times out', async () => {
      server.use(
        http.get('/api/users/:userId', () => {
          return HttpResponse.error(); // Simulates network failure
        })
      );

      render(<UserProfileCard userId={testUserId} />);

      await screen.findByRole('alert');
      // Verify the error message is helpful, not a raw error object stringification
      expect(screen.getByRole('alert')).not.toHaveTextContent('[object Object]');
    });
  });

  // ----------------------------------------------------------------
  // Follow Interaction
  // ----------------------------------------------------------------
  describe('Follow button interaction', () => {
    it('updates follow button state and follower count after successful follow', async () => {
      render(<UserProfileCard userId={testUserId} />);

      // Wait for component to finish loading
      const followButton = await screen.findByRole('button', { name: /follow ada lovelace/i });

      await user.click(followButton);

      // After the mutation resolves, button label and aria-pressed should update
      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /following ada lovelace/i })
        ).toHaveAttribute('aria-pressed', 'true');
      });

      // Follower count should optimistically or eventually increment
      expect(screen.getByText('1,843 followers')).toBeInTheDocument();
    });

    it('shows an error toast and reverts state when follow mutation fails', async () => {
      server.use(
        http.post('/api/users/:userId/follow', () => {
          return HttpResponse.json({ message: 'Forbidden' }, { status: 403 });
        })
      );

      render(<UserProfileCard userId={testUserId} />);

      const followButton = await screen.findByRole('button', { name: /follow ada lovelace/i });
      await user.click(followButton);

      // Error toast or inline error should appear
      await screen.findByRole('alert');
      expect(screen.getByRole('alert')).toHaveTextContent(/could not follow/i);

      // Button should revert to unfollowed state
      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /follow ada lovelace/i })
        ).toHaveAttribute('aria-pressed', 'false');
      });

      // Follower count should revert to original value
      expect(screen.getByText('1,842 followers')).toBeInTheDocument();
    });

    it('disables the Follow button while the mutation is in flight', async () => {
      server.use(
        http.post('/api/users/:userId/follow', async () => {
          await delay(100); // Slow mutation to catch in-flight state
          return HttpResponse.json({ success: true });
        })
      );

      render(<UserProfileCard userId={testUserId} />);

      const followButton = await screen.findByRole('button', { name: /follow ada lovelace/i });
      await user.click(followButton);

      // Immediately after click, button should be disabled to prevent double-submit
      expect(followButton).toBeDisabled();

      // After mutation resolves, button is re-enabled in following state
      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /following ada lovelace/i })
        ).not.toBeDisabled();
      });
    });
  });

  // ----------------------------------------------------------------
  // Accessibility
  // ----------------------------------------------------------------
  describe('accessibility', () => {
    it('has no WCAG 2.1 AA violations in the loaded state', async () => {
      const { container } = render(<UserProfileCard userId={testUserId} />);

      // Wait for async content before running axe -- axe on a loading skeleton
      // will produce false negatives
      await screen.findByRole('heading', { name: 'Ada Lovelace' });

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no WCAG violations in the error state', async () => {
      server.use(
        http.get('/api/users/:userId', () => {
          return HttpResponse.json({}, { status: 500 });
        })
      );

      const { container } = render(<UserProfileCard userId={testUserId} />);

      await screen.findByRole('alert');

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
```

---

### Test Cases Summary

| Scenario | Query Strategy | Async | Primary Assertion |
|----------|---------------|-------|-------------------|
| Loading skeleton visible | `getByRole('status')` | No (synchronous) | `toBeInTheDocument` |
| Loading skeleton disappears | `queryByRole('status')` | Yes (`waitFor`) | `not.toBeInTheDocument` |
| User name rendered | `findByRole('heading')` | Yes (`findBy`) | `toBeInTheDocument` |
| Follower count formatted | `getByText('1,842 followers')` | No (after await) | `toBeInTheDocument` |
| Follow button unfollowed state | `findByRole('button', { name })` | Yes (`findBy`) | `toHaveAttribute('aria-pressed', 'false')` |
| 500 error shows alert | `findByRole('alert')` | Yes (`findBy`) | `toHaveTextContent` |
| Network error shows alert | `findByRole('alert')` | Yes (`findBy`) | Not to stringify error object |
| Follow success updates UI | `getByRole('button', { name })` | Yes (`waitFor`) | `aria-pressed: true`, count incremented |
| Follow failure reverts UI | `getByRole('alert')` | Yes (`findBy`) | Count unchanged, `aria-pressed: false` |
| Mutation in flight disables button | `followButton` (retained ref) | Yes (`waitFor`) | `toBeDisabled` then `not.toBeDisabled` |
| Loaded state axe scan | `container` | Yes (`findByRole` first) | `toHaveNoViolations` |
| Error state axe scan | `container` | Yes (`findByRole` first) | `toHaveNoViolations` |

---

### Mocking Requirements
- **MSW Handlers:** `GET /api/users/:userId` returns user object; `POST /api/users/:userId/follow` returns `{ success: true }`
- **Per-test overrides:** 500 error on GET, network failure on GET, 403 on POST follow, delayed POST follow
- **Module Mocks:** None -- React Query, fetch, and component internals are all tested through real implementations intercepted by MSW
- **Browser API Stubs:** None required for this component unless it uses IntersectionObserver for avatar lazy loading

### Coverage Targets
- **Lines:** 90%+ (this is a critical user-facing component)
- **Branches:** 85%+ (all conditional render paths: loading, error, success, follow/following state, mutation pending state)
- **Key branches to cover:** `isLoading`, `isError`, `isSuccess`, `mutation.isPending`, `isFollowedByCurrentUser`, follower count formatting edge cases (0 followers, 1 follower, 1000+)
