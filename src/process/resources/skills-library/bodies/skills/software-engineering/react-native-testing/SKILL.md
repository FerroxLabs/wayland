---
name: react-native-testing
description: |
  Guides expert-level react native testing implementation: javascript and testing decision frameworks, production-ready patterns, and concrete templates for react native testing workflows.
  Use when the user asks about react native testing, react native testing configuration, or mobile best practices for react projects.
  Do NOT use when the user needs a different mobile development capability -- check sibling skills in the mobile development subcategory.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "mobile javascript testing"
  category: "software-engineering"
  subcategory: "mobile-development"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# React Native Testing

## When to Use

**Use this skill when:**
- The user asks how to set up a testing suite for a React Native project from scratch, including choosing between Jest, React Native Testing Library, Detox, and Maestro
- The user wants to write component tests for React Native screens or UI components and needs guidance on `render`, `fireEvent`, `waitFor`, and async patterns
- The user is debugging flaky tests in a React Native CI pipeline and needs strategies for stabilizing timers, animations, and native module mocks
- The user asks about end-to-end testing strategies for React Native apps, including device farm configuration, real device vs. emulator trade-offs, and test synchronization
- The user wants to know how to mock native modules (camera, permissions, push notifications, AsyncStorage) that are not available in Jest's jsdom or Node environment
- The user needs to establish a testing pyramid for a React Native app -- deciding what percentage of tests should be unit, integration, and E2E
- The user asks about code coverage configuration, thresholds, and which coverage metrics actually matter for mobile apps
- The user needs to integrate React Native testing into a CI/CD pipeline (GitHub Actions, Bitrise, CircleCI) with appropriate caching and parallelization strategies

**Do NOT use this skill when:**
- The user needs guidance on React (web) testing -- that involves different tooling, no native module mocking, and browser-specific concerns; use the React web testing skill instead
- The user is asking about native iOS testing with XCTest or Swift -- this is outside the React Native layer
- The user is asking about native Android testing with Espresso or JUnit -- use the Android testing skill
- The user needs help with general JavaScript unit testing concepts not specific to React Native -- use the JavaScript testing fundamentals skill
- The user is building a React Native app and asking about architecture, navigation, or state management without a testing angle -- use the React Native architecture skill
- The user wants to set up monitoring or crash reporting (Sentry, Firebase Crashlytics) for production apps -- this is observability, not testing
- The user is asking about TypeScript configuration, not testing -- use the TypeScript skill

---

## Process

### 1. Audit the Project Context and Testing Baseline

Before recommending any tools or writing any tests, establish the current state of the project:

- Identify the React Native version (bare workflow vs. Expo managed vs. Expo bare), because Expo managed workflow has different native module mock requirements and some Detox configuration varies by RN version
- Check whether `@testing-library/react-native` is already installed; if the project uses `react-test-renderer` directly, it is using a lower-level API and should migrate to RNTL (React Native Testing Library) for user-centric testing
- Determine which native modules are in use: react-native-camera, react-native-permissions, react-native-push-notification, @react-native-async-storage/async-storage, react-native-maps -- each requires its own manual or auto-mock strategy
- Identify the state management library (Redux Toolkit, Zustand, Jotai, MobX, React Query) because this determines how to wrap components in providers during testing
- Determine the navigation library -- React Navigation v6 is by far the most common and has specific patterns for testing navigation actions and route params
- Ask whether the project has an existing Jest configuration; if `jest.config.js` or the `jest` key in `package.json` references `react-native` as the preset, that is the standard starting point
- Establish the CI platform (GitHub Actions, Bitrise, CircleCI, GitLab CI) because E2E test orchestration differs significantly across these

### 2. Configure the Jest Foundation

Jest is the standard test runner for React Native. The configuration must be precise to avoid common failures:

- Use the `react-native` Jest preset as the base: `preset: 'react-native'` -- this configures Babel transforms, module file extensions, and the `haste` module map that React Native's resolution algorithm requires
- Set `transformIgnorePatterns` carefully -- this is the single most common source of SyntaxError failures. The default pattern `node_modules/(?!react-native)` is too narrow. For modern projects with many community packages, use: `node_modules/(?!(react-native|@react-native|@react-navigation|react-native-screens|react-native-safe-area-context|react-native-reanimated|@testing-library)/)`
- Configure `moduleNameMapper` to redirect imports that reference assets (images, SVGs, fonts) to stubs: map `\.(jpg|jpeg|png|gif|webp|svg)$` to `<rootDir>/__mocks__/fileMock.js` which simply exports an empty string or object
- Set `setupFilesAfterFramework` (not `setupFiles`) to `@testing-library/jest-native/extend-expect` to enable custom matchers like `toBeVisible()`, `toHaveTextContent()`, and `toBeDisabled()`
- Add `jest-setup.js` for global mocks that apply to every test: mock `@react-native-async-storage/async-storage` with `@react-native-async-storage/async-storage/jest/async-storage-mock`, mock `react-native-reanimated` with `react-native-reanimated/mock`, and use `jest.useFakeTimers()` globally if animations are pervasive
- Configure `coverageThreshold` globally: start with `statements: 70, branches: 60, functions: 70, lines: 70` and increase thresholds by 5% per quarter -- setting thresholds too high on day one causes the team to write coverage-inflating tests rather than meaningful ones
- Set `testTimeout` to 10000 (10 seconds) -- the default 5 seconds causes false failures for async operations involving animated transitions or debounced inputs

### 3. Mock Native Modules Systematically

Native module mocking is the defining challenge of React Native testing. Every native module must be mocked at the Jest level because the native bridge does not exist in the Node.js test environment:

- Create `__mocks__/` at the project root for manual mocks -- Jest automatically uses files in this directory when `jest.mock('module-name')` is called or when `automock` is enabled for specific paths
- For `react-native` itself, the preset already mocks the core built-in components. Do NOT manually mock `View`, `Text`, `TouchableOpacity`, etc. -- RNTL renders them as accessible elements automatically
- Mock `react-native-permissions` with a factory that returns `RESULTS.GRANTED` by default, but export the `RESULTS` enum so individual tests can override to `DENIED` or `BLOCKED` to test permission-denied flows
- Mock `react-native-camera` by creating a named export for `RNCamera` that renders a plain `View` with a `testID` of `camera-view` -- this allows tests to assert the camera component is mounted without requiring native rendering
- Mock `@react-native-firebase/messaging` to return a resolved promise from `getToken()` and expose a `onMessage` function that stores registered callbacks, allowing tests to trigger them with `firebaseMessaging.onMessage.mock.calls[0][0]({ data: {...} })`
- Mock `react-native-maps` using the community-maintained `__mocks__/react-native-maps.js` pattern that exports all map components as plain `View` wrappers with their `testID` props forwarded
- For `expo-*` modules, Expo provides `jest-expo` preset which handles most Expo SDK module mocks automatically -- always include it as `projects: ['jest-expo/ios', 'jest-expo/android']` in multi-platform Expo projects to catch platform-specific behavior

### 4. Write Component Tests with React Native Testing Library

RNTL provides the primary API for component-level testing. Tests must query by accessibility role, label, or text -- never by CSS class (there are none) or component type directly:

- Use `render()` from `@testing-library/react-native` and always wrap components in their required providers -- create a custom `renderWithProviders()` utility that wraps with `NavigationContainer`, Redux `Provider`, and any theme context; this single utility prevents missing-provider errors across hundreds of tests
- Query DOM using this priority order: `getByRole` (most resilient) > `getByLabelText` > `getByPlaceholderText` > `getByText` > `getByTestId` (least resilient) -- `testID` should only be used when no semantic query is available, because it leaks implementation details
- For `Pressable`, `TouchableOpacity`, and `Button` interactions, use `fireEvent.press(element)` -- do NOT use `userEvent.click()` from the web library; RNTL has a `userEvent` API from v12+ that more closely simulates real user interactions including pointer events
- For text input testing, use `fireEvent.changeText(input, 'new value')` rather than `fireEvent(input, 'change', { nativeEvent: { text: 'new value' } })` -- the former is the intended RNTL abstraction
- For async operations (API calls, navigation, state updates), always use `await waitFor(() => expect(...))` with a timeout -- default `waitFor` timeout is 1000ms, configurable per-call. Do NOT use arbitrary `await new Promise(r => setTimeout(r, 500))` delays
- Test FlatList and SectionList by asserting rendered items rather than the list component itself -- RNTL renders all items in test mode (no virtualization), so `getAllByText('Item Name')` works directly
- For React Navigation v6, import `createNavigationMock` from RNTL's navigation utilities or mock `useNavigation` with `jest.fn()` returning `{ navigate: jest.fn(), goBack: jest.fn(), setOptions: jest.fn() }` -- assert `navigate.toHaveBeenCalledWith('ScreenName', { id: 'abc' })`

### 5. Write Integration Tests for Critical Flows

Integration tests exercise multiple components working together without mocking the component tree:

- An integration test for a login flow renders the `LoginScreen` with real form components, fires `changeText` on email and password inputs, presses the login button, and asserts navigation is called with the correct screen name -- the only mocks are the API call and the navigation container
- Use `msw` (Mock Service Worker) with a Node.js handler for REST or GraphQL API mocking in integration tests -- configure `setupServer(...handlers)` in `jest-setup.js` and `server.resetHandlers()` in `afterEach` to prevent handler bleed between tests
- Test React Query or SWR data-fetching flows by wrapping the component in a `QueryClientProvider` with a fresh `QueryClient` for each test (set `retry: false` and `gcTime: 0` on the test client to prevent caching interference)
- For Redux, test connected components with a real Redux store configured with `configureStore` from Redux Toolkit -- do NOT use a mocked dispatch. Testing with a real store validates that reducers, selectors, and component props wire correctly together
- Integration test boundaries: a good integration test should exercise 3--8 components and 1--3 reducers or hooks, stopping short of E2E navigation across multiple screens (that is E2E territory)
- Aim for integration tests to constitute 20--30% of the testing pyramid in React Native -- lower than web because native rendering and navigation are harder to simulate realistically at this layer

### 6. Implement End-to-End Testing with Detox or Maestro

E2E testing in React Native requires running on a real or simulated device with the actual compiled app bundle:

- **Detox** is the industry-standard gray-box E2E framework for React Native -- it instruments the app with a WebSocket server and synchronizes test commands with the app's idle state, eliminating timing-based flakiness
- Configure Detox with `detox.config.js` at the project root, defining at minimum two configurations: `ios.sim.debug` (iPhone 14 simulator, iOS 16) and `android.emu.debug` (Pixel 4 emulator, API 31)
- Detox uses `device.launchApp({ newInstance: true, permissions: { notifications: 'YES', camera: 'YES' } })` to reset state between test suites -- always launch with `newInstance: true` in `beforeAll` to prevent state bleed
- Detox element queries use `element(by.id('testID'))` or `element(by.text('Button Label'))` -- the `by.id()` matcher requires `testID` props on components, so E2E-critical interactive elements must have `testID` set
- **Maestro** is an emerging alternative to Detox with a YAML-based test definition format -- it is simpler to write but less powerful for gray-box synchronization. Use Maestro for simple smoke tests and onboarding flow validation; use Detox for complex multi-step transactional flows
- Detox tests must run on physical iOS devices in CI to validate APNs push notifications, Face ID, and any feature that the simulator does not support -- use a device farm service or maintain a Mac Mini CI runner with attached devices
- E2E tests should cover the 5--10 highest-value user journeys: login/logout, core feature flow, purchase flow (if applicable), deep link handling, and push notification tap-to-action
- E2E test suite runtime must stay under 20 minutes in CI to remain viable -- if tests exceed this, parallelize across shards using Detox's `--shard` flag or split test files across multiple CI workers

### 7. Establish CI Integration and Performance Baselines

A testing strategy is only as good as its CI enforcement:

- Run Jest unit and integration tests on every pull request -- cache the Jest transform cache (`node_modules/.cache/jest`) and the `node_modules` directory using the `package-lock.json` hash as the cache key; this reduces CI test time from 4--6 minutes to under 90 seconds for medium projects
- Configure Jest `--maxWorkers=50%` in CI environments -- using 100% workers causes memory exhaustion on standard 2-CPU CI runners. On 4-CPU runners, `--maxWorkers=2` is often the sweet spot
- Run Detox E2E tests nightly or on merge to main -- not on every PR, because E2E suite setup (build + run) takes 15--30 minutes for an iOS simulator build
- Use Jest `--testPathPattern` to run only the test files related to changed source files in PR checks -- many CI systems support this via `jest --changedSince origin/main`
- Publish coverage reports to a service (Codecov, Coveralls) and set PR checks to fail if coverage drops more than 2% below the main branch baseline -- this prevents gradual coverage erosion
- Store Detox E2E artifacts (screenshots, videos, device logs) as CI artifacts on failure -- Detox automatically generates these in `artifacts/` when configured with `artifacts: { plugins: { screenshot: 'failing', video: 'failing', log: 'all' } }`
- Set a Jest test performance budget: any single test file taking more than 30 seconds to run is a signal of missing mocks or real timers leaking -- investigate and fix rather than increasing `testTimeout`

### 8. Maintain and Evolve the Test Suite

Tests that are not maintained become liabilities:

- Review and delete snapshot tests aggressively -- snapshot tests created with `toMatchSnapshot()` on large component trees catch nothing meaningful and require constant updating. Use inline snapshots (`toMatchInlineSnapshot()`) for specific, small data structures only
- Audit test mocks quarterly -- when native modules are upgraded (e.g., react-native-reanimated 2 to 3), mocks must be updated to reflect new API shapes; stale mocks produce false-positive passing tests
- Add test coverage requirements to the PR template: any new screen or hook must include at minimum a happy path test, one error state test, and one loading state test
- Run `jest --detectOpenHandles` periodically to find tests that leave async operations running after the test completes -- these cause unpredictable failures in large test suites
- Track the ratio of time-to-fix for flaky tests -- if a single test flakes more than 3 times in a month, it must be fixed or deleted. Flaky tests erode team trust in the CI pipeline faster than any other factor

---

## Output Format

When responding to a React Native testing request, structure the output as follows:

```
## React Native Testing Assessment

### Project Profile
- RN Version: [version]
- Workflow: [bare | expo managed | expo bare]
- Native Modules: [list of native modules requiring mocks]
- State Management: [Redux Toolkit | Zustand | React Query | etc.]
- Navigation: [React Navigation v6 | Expo Router | etc.]
- CI Platform: [GitHub Actions | Bitrise | CircleCI | etc.]

---

### Testing Pyramid Recommendation

| Layer       | Tool(s)                              | Target Coverage | Run Frequency     |
|-------------|--------------------------------------|-----------------|-------------------|
| Unit        | Jest + RNTL                          | 60-70% of tests | Every PR          |
| Integration | Jest + RNTL + msw                    | 20-30% of tests | Every PR          |
| E2E         | Detox (complex) / Maestro (smoke)    | 5-10 key flows  | Nightly / on merge|

---

### Jest Configuration

```js
// jest.config.js
module.exports = {
  preset: 'react-native',
  setupFilesAfterFramework: [
    '@testing-library/jest-native/extend-expect',
    './jest-setup.js',
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|react-native-screens|react-native-safe-area-context|react-native-reanimated|@testing-library)/)',
  ],
  moduleNameMapper: {
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/__mocks__/fileMock.js',
  },
  coverageThreshold: {
    global: {
      statements: 70,
      branches: 60,
      functions: 70,
      lines: 70,
    },
  },
  testTimeout: 10000,
  maxWorkers: '50%',
};
```

---

### Native Module Mocks Required

| Module                              | Mock Strategy                                | File Location                              |
|-------------------------------------|----------------------------------------------|--------------------------------------------|
| @react-native-async-storage         | Community jest mock                          | jest-setup.js                              |
| react-native-reanimated             | react-native-reanimated/mock                 | jest-setup.js                              |
| react-native-permissions            | Manual mock with RESULTS enum                | __mocks__/react-native-permissions.js      |
| @react-native-firebase/messaging    | Manual mock with onMessage callback store    | __mocks__/@react-native-firebase/messaging |
| react-native-maps                   | View-wrapper manual mock                     | __mocks__/react-native-maps.js             |

---

### Component Test Template

```tsx
// src/screens/__tests__/LoginScreen.test.tsx
import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '../../test-utils/renderWithProviders';
import LoginScreen from '../LoginScreen';
import { server } from '../../test-utils/msw-server';
import { rest } from 'msw';

describe('LoginScreen', () => {
  it('navigates to Home on successful login', async () => {
    const mockNavigate = jest.fn();
    jest.spyOn(require('@react-navigation/native'), 'useNavigation')
      .mockReturnValue({ navigate: mockNavigate });

    const { getByPlaceholderText, getByRole } = renderWithProviders(<LoginScreen />);

    fireEvent.changeText(getByPlaceholderText('Email'), 'user@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'secret123');
    fireEvent.press(getByRole('button', { name: 'Log In' }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('Home');
    });
  });

  it('displays validation error when email is empty', async () => {
    const { getByRole, getByText } = renderWithProviders(<LoginScreen />);

    fireEvent.press(getByRole('button', { name: 'Log In' }));

    await waitFor(() => {
      expect(getByText('Email is required')).toBeVisible();
    });
  });

  it('shows error message on API failure', async () => {
    server.use(
      rest.post('/api/auth/login', (req, res, ctx) =>
        res(ctx.status(401), ctx.json({ message: 'Invalid credentials' }))
      )
    );

    const { getByPlaceholderText, getByRole, getByText } = renderWithProviders(<LoginScreen />);

    fireEvent.changeText(getByPlaceholderText('Email'), 'wrong@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'wrongpass');
    fireEvent.press(getByRole('button', { name: 'Log In' }));

    await waitFor(() => {
      expect(getByText('Invalid credentials')).toBeVisible();
    });
  });
});
```

---

### Detox E2E Configuration Snippet

```js
// detox.config.js
module.exports = {
  testRunner: { $0: 'jest', args: { config: 'e2e/jest.config.js' } },
  apps: {
    'ios.debug': { type: 'ios.app', binaryPath: 'ios/build/app.app', build: 'xcodebuild ...' },
    'android.debug': { type: 'android.apk', binaryPath: 'android/app/build/outputs/apk/debug/app-debug.apk' },
  },
  devices: {
    simulator: { type: 'ios.simulator', device: { type: 'iPhone 14', os: 'iOS 16.4' } },
    emulator: { type: 'android.emulator', device: { avdName: 'Pixel_4_API_31' } },
  },
  configurations: {
    'ios.sim.debug': { device: 'simulator', app: 'ios.debug' },
    'android.emu.debug': { device: 'emulator', app: 'android.debug' },
  },
};
```
```

---

## Rules

1. **NEVER use `react-test-renderer` directly** -- it produces hard-to-read output, requires manual act() wrapping, and tests implementation structure rather than user behavior. Always use `@testing-library/react-native`, which renders into a virtual native tree with accessibility semantics.

2. **NEVER query by `testID` as a first resort** -- testID creates a tight coupling between tests and implementation. Reserve testID for elements with no accessible text, role, or label (e.g., a decorative icon that also serves as a tap target in E2E tests). In unit/integration tests, always prefer `getByRole`, `getByLabelText`, or `getByText` first.

3. **ALWAYS configure `transformIgnorePatterns` explicitly** -- the default pattern excludes all of `node_modules`, which causes SyntaxError crashes for any community React Native package that ships untranspiled ESM. An incorrect `transformIgnorePatterns` is the root cause of 80% of "unexpected token" Jest failures in React Native projects.

4. **NEVER leave `act()` warnings unresolved** -- an "act() warning" means state updates are happening outside React's rendering cycle in tests. These warnings predict real production bugs and mask genuine test failures. Wrap all state-triggering async calls in `await act(async () => { ... })` or use `waitFor`, which wraps internally.

5. **NEVER use real timers with animations** -- `react-native-reanimated`, `Animated`, and `LayoutAnimation` use the native timer system. In tests, either mock `react-native-reanimated` entirely (using its provided mock) or call `jest.useFakeTimers()` globally and advance timers with `jest.runAllTimers()` after triggering animated interactions.

6. **ALWAYS reset mocks between tests** -- use `jest.clearAllMocks()` in `afterEach` (or configure `clearMocks: true` globally in `jest.config.js`). Failing to reset mocks causes test order dependency, where passing tests in isolation fail when run in suite because a previous test left a mock in a configured state.

7. **NEVER write Detox tests that rely on arbitrary `waitFor` timeouts** -- Detox's built-in synchronization engine waits for the JS thread to be idle. Using `await element(by.id('x')).waitToBeVisible({ timeout: 5000 })` is the correct pattern; do not add `await new Promise(r => setTimeout(r, 3000))` pauses. Arbitrary delays are the primary source of Detox flakiness.

8. **ALWAYS use a fresh `QueryClient` per test when using React Query** -- a shared `QueryClient` between tests causes cache contamination where data fetched in test A resolves instantly in test B without hitting the mock server, producing false positives. Set `new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })` in a `beforeEach`.

9. **NEVER mock the entire navigation library** -- mocking the entire `@react-navigation/native` module hides real navigation bugs. Instead, mock only `useNavigation` to capture `navigate` calls, and render tests inside a real `NavigationContainer` with `createStackNavigator` for integration tests that test screen transitions.

10. **ALWAYS enforce coverage thresholds in CI rather than locally** -- developers running tests locally with `--coverage` should see reports, but thresholds should only block CI builds. This prevents wasted developer time while still enforcing quality gates at the integration point. Configure `coverageThreshold` in `jest.config.ci.js` and run with `jest --config jest.config.ci.js` in CI pipelines only.

---

## Edge Cases

### Reanimated 2/3 Causing "Cannot read property 'value' of undefined" in Tests

`react-native-reanimated` uses worklets that run on a separate JS engine in production but are unsupported in Jest's V8 environment. Even with `react-native-reanimated/mock` installed, animated components that reference `useSharedValue`, `useAnimatedStyle`, or `withTiming` directly in render will crash unless the mock is loaded in `setupFilesAfterFramework` and the component conditionally handles the mock. Solution: import the mock in `jest-setup.js` as the first entry, and confirm it is listed before `@testing-library/jest-native/extend-expect`. If crashes persist, wrap animated logic in a separate component and test only the non-animated wrapper in unit tests, reserving animated behavior validation for Detox E2E.

### Expo Managed Workflow Module Resolution Failures

In Expo managed workflow projects, some Expo SDK modules (expo-camera, expo-location, expo-notifications) are re-exported through Expo's module system with a different resolution path than bare React Native. Using only `preset: 'react-native'` causes these modules to fail resolution in Jest. Solution: use `preset: 'jest-expo'` instead, and configure `projects: ['jest-expo/ios', 'jest-expo/android']` to run tests against both platform environments. This doubles test run time but catches platform-specific conditional code paths. If runtime is a concern, run only `jest-expo/ios` in PR checks and both platforms in the nightly CI run.

### AsyncStorage Data Persisting Between Tests

Even when using the community mock for `@react-native-async-storage/async-storage`, the mock implementation stores data in a module-level object that persists across tests in the same Jest worker. If test A writes `AsyncStorage.setItem('user', 'alice')` and test B reads `AsyncStorage.getItem('user')` without first calling `AsyncStorage.clear()`, test B sees stale data. Solution: call `AsyncStorage.clear()` in `beforeEach` for any test suite that reads from AsyncStorage, or add it to the global `jest-setup.js` for consistency.

### Detox Tests Hanging on Android Emulator Boot

Detox Android E2E tests frequently hang in CI because the emulator takes 90--120 seconds to fully boot, and Detox attempts to connect before the device is ready. Solution: add an emulator readiness check script before `detox test` in CI -- use `adb wait-for-device` followed by polling `adb shell getprop sys.boot_completed` until it returns `1`, with a 3-minute timeout before failing the CI step. Also configure the emulator with `-no-snapshot-load` and `-no-snapshot-save` flags to prevent snapshot corruption across CI runs.

### Testing Components with Platform-Specific Code (`Platform.OS` Branches)

Components that branch on `Platform.OS === 'ios'` vs `'android'` are only tested for the platform Jest defaults to (iOS, since `react-native` preset sets `Platform.OS = 'ios'`). Android-specific UI paths are untested. Solution: use `Platform.OS` mocking per test by setting `jest.mock('react-native/Libraries/Utilities/Platform', () => ({ OS: 'android', select: jest.fn(obj => obj.android || obj.default) }))` in individual test files or describe blocks that target Android behavior. For the Expo preset, `jest-expo/android` project handles this automatically.

### React Navigation `NavigationContainer` Missing Context Errors

When a component under test calls `useNavigation()` or `useRoute()` and is not wrapped in a `NavigationContainer`, the test throws "Couldn't find a navigation object" at render time. This is distinct from the navigation mock failing -- it means the component was rendered without any navigation context at all. Solution: the `renderWithProviders` utility must always wrap in `NavigationContainer`. For screens that receive route params, use `NavigationContainer` with `initialState` to pre-configure the navigation state, or mock `useRoute` to return `{ params: { id: 'test-id' } }` directly.

### Flaky Tests Caused by `Date.now()` and Time-Dependent Logic

Components that render relative timestamps ("2 minutes ago"), tokens with expiry, or time-based conditional UI produce flaky tests when `Date.now()` advances between test runs. Solution: use `jest.useFakeTimers({ now: new Date('2024-01-15T10:00:00Z') })` to pin the clock to a fixed point. Set this in `jest-setup.js` globally if time-sensitive components are pervasive in the app. Always advance the fake clock explicitly with `jest.advanceTimersByTime(ms)` when testing time-dependent state changes like session expiry warnings.

### Test Suite Memory Exhaustion for Large Component Trees

Projects with 500+ test files often encounter Jest workers running out of memory (process exits with code 9) when components import large dependency trees (routing, icon libraries, rich text editors). Solution: set `--maxWorkers=2` in CI rather than the default 50%, set `workerIdleMemoryLimit: '512MB'` in `jest.config.js` (Jest 28+) to recycle workers that exceed memory limits, and use `jest --logHeapUsage` to identify which test files allocate the most memory. The top offenders often import entire icon packs -- mock them with a simple `() => null` component factory in `__mocks__`.

---

## Example

**Input:** "We have a React Native 0.72 bare workflow app with React Navigation v6, Redux Toolkit, React Query, and react-native-permissions. We're using GitHub Actions for CI. We have no tests currently and want to build a proper testing foundation. Where do we start?"

**Output:**

### Project Profile

- RN Version: 0.72 (bare workflow)
- Workflow: Bare -- native code is accessible, Detox configuration is straightforward
- Native Modules Requiring Mocks: react-native-permissions
- State Management: Redux Toolkit (real store in integration tests) + React Query (fresh QueryClient per test)
- Navigation: React Navigation v6 (NavigationContainer wrapping in renderWithProviders)
- CI Platform: GitHub Actions (cache node_modules, run Jest on every PR, Detox nightly)

---

### Testing Pyramid Recommendation

| Layer       | Tool(s)                          | Target Coverage | Run Frequency      |
|-------------|----------------------------------|-----------------|--------------------|
| Unit        | Jest 29 + RNTL v12               | ~65% of tests   | Every PR           |
| Integration | Jest + RNTL + msw v1             | ~25% of tests   | Every PR           |
| E2E         | Detox 20 (gray-box)              | 6 critical flows| Nightly on main    |

---

### Step 1: Install Dependencies

```bash
# Core testing tools
npm install --save-dev jest@29 @testing-library/react-native@12 \
  @testing-library/jest-native@5 jest-environment-node

# API mocking
npm install --save-dev msw@1

# Permissions mock (community-provided)
# react-native-permissions provides no official Jest mock, so we write one

# E2E
npm install --save-dev detox@20 detox-cli
```

---

### Step 2: Jest Configuration

```js
// jest.config.js
module.exports = {
  preset: 'react-native',
  setupFilesAfterFramework: [
    '@testing-library/jest-native/extend-expect',
    './jest-setup.js',
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|react-native-screens|react-native-safe-area-context|react-native-gesture-handler|react-native-reanimated|react-native-permissions|@testing-library)/)',
  ],
  moduleNameMapper: {
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/__mocks__/fileMock.js',
  },
  coverageThreshold: {
    global: {
      statements: 70,
      branches: 60,
      functions: 70,
      lines: 70,
    },
  },
  testTimeout: 10000,
  clearMocks: true,
};
```

---

### Step 3: Global Jest Setup File

```ts
// jest-setup.js
import '@testing-library/jest-native/extend-expect';

// Silence non-actionable RN warnings in test output
jest.spyOn(console, 'warn').mockImplementation((msg) => {
  if (msg.includes('Animated:') || msg.includes('componentWillReceiveProps')) return;
  console.warn(msg);
});

// AsyncStorage auto-mock provided by the community package
jest.mock('@react-native-async-storage/async-storage',
  () => require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// MSW server lifecycle
import { server } from './src/test-utils/msw-server';
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

---

### Step 4: Native Module Mock -- react-native-permissions

```js
// __mocks__/react-native-permissions.js
const RESULTS = {
  UNAVAILABLE: 'unavailable',
  DENIED: 'denied',
  GRANTED: 'granted',
  BLOCKED: 'blocked',
  LIMITED: 'limited',
};

const PERMISSIONS = {
  IOS: { CAMERA: 'ios.permission.CAMERA', LOCATION_WHEN_IN_USE: 'ios.permission.LOCATION_WHEN_IN_USE' },
  ANDROID: { CAMERA: 'android.permission.CAMERA', ACCESS_FINE_LOCATION: 'android.permission.ACCESS_FINE_LOCATION' },
};

module.exports = {
  RESULTS,
  PERMISSIONS,
  check: jest.fn().mockResolvedValue(RESULTS.GRANTED),
  request: jest.fn().mockResolvedValue(RESULTS.GRANTED),
  checkMultiple: jest.fn().mockResolvedValue({}),
  requestMultiple: jest.fn().mockResolvedValue({}),
  openSettings: jest.fn().mockResolvedValue(undefined),
};
```

---

### Step 5: renderWithProviders Utility

```tsx
// src/test-utils/renderWithProviders.tsx
import React from 'react';
import { render, RenderOptions } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { configureStore } from '@reduxjs/toolkit';
import { rootReducer } from '../store/rootReducer';

function createTestStore(preloadedState = {}) {
  return configureStore({ reducer: rootReducer, preloadedState });
}

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });
}

interface ExtendedRenderOptions extends RenderOptions {
  preloadedState?: Record<string, unknown>;
  store?: ReturnType<typeof createTestStore>;
}

export function renderWithProviders(
  ui: React.ReactElement,
  { preloadedState = {}, store = createTestStore(preloadedState), ...renderOptions }: ExtendedRenderOptions = {}
) {
  const queryClient = createTestQueryClient();

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <NavigationContainer>
            {children}
          </NavigationContainer>
        </QueryClientProvider>
      </Provider>
    );
  }

  return { store, queryClient, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
}
```

---

### Step 6: First Real Test -- Location Permission Screen

```tsx
// src/screens/__tests__/LocationPermissionScreen.test.tsx
import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { check, request, RESULTS, PERMISSIONS } from 'react-native-permissions';
import { renderWithProviders } from '../../test-utils/renderWithProviders';
import LocationPermissionScreen from '../LocationPermissionScreen';

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: mockNavigate, goBack: jest.fn() }),
}));

describe('LocationPermissionScreen', () => {
  beforeEach(() => {
    (check as jest.Mock).mockResolvedValue(RESULTS.DENIED);
    (request as jest.Mock).mockResolvedValue(RESULTS.GRANTED);
  });

  it('renders the permission request UI when permission is denied', async () => {
    const { getByText, getByRole } = renderWithProviders(<LocationPermissionScreen />);

    await waitFor(() => {
      expect(getByText('Allow Location Access')).toBeVisible();
    });

    expect(getByRole('button', { name: 'Enable Location' })).toBeVisible();
  });

  it('requests permission and navigates to Map when user grants access', async () => {
    const { getByRole } = renderWithProviders(<LocationPermissionScreen />);

    await waitFor(() => expect(getByRole('button', { name: 'Enable Location' })).toBeVisible());

    fireEvent.press(getByRole('button', { name: 'Enable Location' }));

    await waitFor(() => {
      expect(request).toHaveBeenCalledWith(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
      expect(mockNavigate).toHaveBeenCalledWith('Map');
    });
  });

  it('shows a blocked state UI when permission is permanently denied', async () => {
    (check as jest.Mock).mockResolvedValue(RESULTS.BLOCKED);

    const { getByText, getByRole } = renderWithProviders(<LocationPermissionScreen />);

    await waitFor(() => {
      expect(getByText("Location access is blocked. Please enable it in your device settings.")).toBeVisible();
    });

    expect(getByRole('button', { name: 'Open Settings' })).toBeVisible();
  });
});
```

---

### Step 7: GitHub Actions CI Configuration

```yaml
# .github/workflows/test.yml
name: Test

on:
  pull_request:
    branches: [main, develop]

jobs:
  unit-and-integration:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run Jest tests
        run: npx jest --ci --coverage --maxWorkers=2 --forceExit

      - name: Upload coverage report
        uses: codecov/codecov-action@v3
        with:
          token: ${{ secrets.CODECOV_TOKEN }}

# Separate nightly workflow for Detox E2E -- not shown here for brevity
# Trigger: schedule: - cron: '0 2 * * *' (2am UTC nightly)
# Runs on: macos-13 runner with Xcode 15 and iOS 16.4 simulator
```

---

### Immediate Next Actions (Priority Order)

1. Install the dependencies listed in Step 1 and commit `jest.config.js`, `jest-setup.js`, and the `__mocks__/` directory as a single PR -- this establishes the foundation without breaking existing code
2. Add `renderWithProviders` to `src/test-utils/` -- all future component tests use this utility
3. Write tests for the three highest-traffic screens (likely auth flow, main feature screen, and settings) -- target 3 tests per screen: happy path, error state, and loading state
4. Add the GitHub Actions workflow -- even with minimal tests, getting CI green establishes the baseline coverage number from which all future coverage requirements are enforced
5. Schedule Detox setup for sprint 2 -- E2E setup requires native build configuration and should not block unit/integration test adoption
