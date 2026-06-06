---
name: javascript-testing-patterns
description: |
  Guides expert-level JavaScript and TypeScript testing: Vitest vs Jest decision tree, ESM mocking strategies, snapshot testing, coverage configuration, and test runner selection for modern projects.
  Use when the user asks about JavaScript testing, Vitest, Jest, mocking ESM, snapshot testing, coverage, test runner selection, TypeScript testing.
  Do NOT use when the user asks about Node.js project setup (use `nodejs-project-setup`), general testing concepts (use `unit-testing-patterns`), E2E testing (use `e2e-testing-patterns`).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "javascript testing tdd"
  category: "software-engineering"
  subcategory: "languages-runtimes"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# JavaScript Testing Patterns

## When to Use

**Use this skill when the user asks about:**
- Choosing between Vitest and Jest for a new or existing JavaScript/TypeScript project
- Mocking ES modules (ESM) -- `import` statements, dynamic `import()`, or packages that only ship ESM
- Configuring test coverage thresholds, Istanbul/V8 providers, and coverage exclusion patterns
- Setting up snapshot testing, inline snapshots, or snapshot update workflows
- Testing TypeScript code including type-level assertions, declaration testing, or ts-jest vs native TypeScript support
- Writing tests for async/await code, Promises, timers, or event emitters
- Structuring test files, fixture patterns, and factory functions for complex domain objects
- Migrating a Jest codebase to Vitest or upgrading a legacy Babel-Jest pipeline
- Configuring test parallelism, worker threads, and test isolation modes
- Writing parameterized/data-driven tests for multiple input/output scenarios

**Do NOT use this skill when:**
- The user needs to initialize a Node.js project from scratch -- use `nodejs-project-setup` instead
- The user is asking about general testing vocabulary (unit vs. integration vs. contract) without a JavaScript-specific angle -- use `unit-testing-patterns`
- The user needs Playwright, Cypress, Puppeteer, or any browser-driven E2E testing -- use `e2e-testing-patterns`
- The user is asking about React component testing with React Testing Library as the primary concern -- this skill covers the runner/mocking layer; a component-testing skill covers the rendering layer
- The user is asking about API contract testing with Pact or schema validation tools
- The user is asking about performance benchmarking frameworks (Vitest bench is adjacent but out of scope here)

---

## Process

### 1. Identify the Project Context and Constraints

Before recommending any tooling, gather the facts that determine every downstream decision.

- **Module system in use:** Is the project CommonJS (`"type": "module"` absent or `require()` throughout), pure ESM (`"type": "module"` in package.json), or a hybrid with both? ESM-only projects rule out certain Jest configurations that rely on synchronous `require()` transforms.
- **Bundler/transpiler in use:** Vite projects are almost always better served by Vitest. Webpack or esbuild projects work fine with either. Babel-only projects that rely on `@babel/preset-env` need extra care when switching runners.
- **TypeScript version and config strictness:** TypeScript ≥ 5.0 with `"moduleResolution": "bundler"` or `"node16"` changes how test runners locate `.d.ts` files and how path aliases are resolved.
- **Existing test investment:** Count existing test files. Fewer than 50 tests -- migrate fully. 50-500 tests -- run both runners in parallel during transition. 500+ tests -- migrate by package/folder boundary.
- **CI time budget:** Ask about acceptable test suite wall-clock time. Vitest's thread-based parallelism with a shared worker pool typically runs 1.5x--3x faster than Jest on suites with many small tests. Jest's `--runInBand` is essential for database integration tests to avoid connection pool exhaustion.
- **Browser/JSDOM requirement:** Tests needing browser globals (`window`, `document`, `localStorage`) require JSDOM or Happy-DOM environments. Configure this at the file level with `@vitest-environment jsdom` docblock or in `vitest.config.ts` per glob pattern.

### 2. Choose the Test Runner -- Apply the Decision Tree

This is the highest-leverage decision. It is difficult to reverse without migrating test files.

- **Start with Vitest if:**
  - The project uses Vite as its build tool (Vitest reuses the same Vite config, plugin pipeline, and alias resolution -- zero duplication)
  - The project is pure ESM or TypeScript-first (Vitest handles both natively without Babel)
  - The team wants native TypeScript support without `ts-jest` or a Babel transform
  - Hot Module Replacement (HMR) in watch mode matters (Vitest re-runs only affected tests, not the full suite)
  - The project needs inline type-checking during tests using `vitest --typecheck`

- **Keep or adopt Jest if:**
  - The project uses Create React App, Next.js (non-Turbopack), or NestJS -- all ship with first-class Jest support
  - The team has deep Jest institutional knowledge and a large snapshot corpus
  - The project requires `jest-circus`, `jest-jasmine2`, or custom runners for complex async scheduling
  - Third-party testing utilities (e.g., `@testing-library/jest-dom`, MSW v1 handlers) are tightly coupled to Jest's global injection model
  - The project targets Node.js ≤ 16 where Vitest's ESM requirements are harder to satisfy

- **During migration from Jest to Vitest:**
  - Install `vitest` and add `"test": "vitest"` as a parallel script alongside `"test:jest": "jest"`
  - Vitest's API is Jest-compatible for `describe`, `it`, `expect`, `beforeEach`, `afterEach`, `vi` (equivalent to `jest`)
  - Replace `jest.fn()` with `vi.fn()`, `jest.mock()` with `vi.mock()`, `jest.spyOn()` with `vi.spyOn()`
  - `jest.useFakeTimers()` becomes `vi.useFakeTimers()` -- behavior is nearly identical
  - Globals (`describe`, `it`, `expect`) are opt-in in Vitest via `globals: true` in config -- set this first to avoid modifying every test file during migration

### 3. Configure the Runner -- Specific Settings That Matter

A correct configuration prevents hours of debugging mysterious test failures.

**Vitest configuration (`vitest.config.ts`):**
```typescript
import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-plugin-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,                    // expose describe/it/expect globally
    environment: 'node',             // or 'jsdom', 'happy-dom', 'edge-runtime'
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'dist', 'e2e/**'],
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',                // faster; use 'istanbul' for branch accuracy
      reporter: ['text', 'lcov', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.d.ts', 'src/**/*.test.ts', 'src/test/**'],
      thresholds: {
        lines: 80,
        branches: 75,
        functions: 80,
        statements: 80,
      },
    },
    pool: 'threads',                 // 'forks' for Node.js child processes; use for native modules
    poolOptions: {
      threads: { singleThread: false },
    },
  },
})
```

**Jest configuration (`jest.config.ts`):**
```typescript
import type { Config } from 'jest'

const config: Config = {
  preset: 'ts-jest/presets/default-esm',  // for ESM TypeScript
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',  // rewrite .js imports to resolve .ts files
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { useESM: true }],
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.test.{ts,tsx}',
    '!src/test/**',
  ],
  coverageThreshold: {
    global: { lines: 80, branches: 75, functions: 80, statements: 80 },
  },
  testMatch: ['<rootDir>/src/**/*.test.{ts,tsx}'],
}

export default config
```

**Key settings with rationale:**
- `pool: 'threads'` in Vitest uses `worker_threads` -- fast but cannot load native `.node` addons. Use `pool: 'forks'` for projects with native modules (e.g., `sharp`, `bcrypt`, `sqlite3`).
- `environment: 'happy-dom'` is 10-15x faster than `jsdom` for pure DOM manipulation tests. Use `jsdom` when tests rely on specific CSS layout behavior or `MutationObserver` edge cases.
- `setupFiles` runs before each test file in isolation. `globalSetup` runs once before all tests and cannot access `vi`/`jest` globals -- use for starting database servers or mock HTTP servers.

### 4. Design the Mocking Strategy -- ESM Is the Hard Part

ESM mocking is the most common source of confusion and broken tests. Apply these patterns precisely.

**Static ESM mock with `vi.mock()` / `jest.mock()` (hoisted):**
```typescript
// Module mocking is HOISTED to the top of the file by the test runner,
// even if written later in the source. This is not normal JS execution order.
vi.mock('../services/emailService', () => ({
  sendEmail: vi.fn().mockResolvedValue({ messageId: 'test-123' }),
  validateAddress: vi.fn().mockReturnValue(true),
}))

// For modules with a default export:
vi.mock('../utils/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}))
```

**The ESM interop problem and solution:**
- Packages distributed as pure ESM (e.g., `node-fetch` v3, `chalk` v5, `nanoid` v4, `execa` v7) cannot be mocked with synchronous `jest.mock()` in standard Jest + Node.js because Jest's module registry uses CommonJS `require()` internally.
- **Solution 1 (preferred for Jest):** Use `jest-mock-extended` or add `"transformIgnorePatterns": []` and transform the ESM package through Babel. In `jest.config.ts`: `transformIgnorePatterns: ['node_modules/(?!(node-fetch|chalk|nanoid)/)']`.
- **Solution 2:** Wrap the ESM dependency in a thin adapter module you own. Mock the adapter, not the package. This also decouples your code from the vendor API.
- **Solution 3 (Vitest):** Vitest handles ESM natively -- `vi.mock('node-fetch')` works without transforms because Vitest operates on the same ESM graph as Vite.

**Spying without replacing (non-destructive mocking):**
```typescript
import * as fs from 'node:fs/promises'

const readFileSpy = vi.spyOn(fs, 'readFile').mockResolvedValue('file content' as any)

afterEach(() => {
  vi.restoreAllMocks()  // resets ALL spies created with spyOn
})
```

**Manual mocks (`__mocks__` directory):**
- Place a file at `src/__mocks__/nodemailer.ts` to auto-mock the `nodemailer` package for all tests in the project.
- For relative imports, the `__mocks__` directory must be adjacent to the module being mocked.
- Call `vi.mock('nodemailer')` or `jest.mock('nodemailer')` in the test file to activate the manual mock -- it does not activate automatically for non-node_modules packages.

**Timer mocking:**
```typescript
beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2024-01-15T10:00:00Z'))  // deterministic "now"
})

afterEach(() => {
  vi.useRealTimers()
})

it('retries after 5 seconds', async () => {
  const promise = retryWithDelay(operation, { delayMs: 5000, maxAttempts: 3 })
  await vi.advanceTimersByTimeAsync(5000)  // advances fake clock AND flushes promises
  expect(operation).toHaveBeenCalledTimes(2)
})
```

### 5. Design Fixtures and Test Data Factories

Poor data setup is the second most common source of flaky or hard-to-read tests.

**Object Mother / Factory function pattern:**
```typescript
// src/test/factories/user.factory.ts
import { User } from '../domain/user'

let idCounter = 0

export function createUser(overrides: Partial<User> = {}): User {
  return {
    id: `user-${++idCounter}`,
    email: `user${idCounter}@example.com`,
    name: 'Test User',
    role: 'member',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    isActive: true,
    ...overrides,
  }
}

// Usage in tests -- explicit only what matters:
const adminUser = createUser({ role: 'admin' })
const inactiveUser = createUser({ isActive: false, email: 'inactive@example.com' })
```

**Reset state between tests:**
- Reset the `idCounter` in `beforeEach` or use a closure that resets on module load per test
- In Vitest, use `vi.isolateModules()` to get a fresh module instance including its internal state
- Never share mutable fixtures between `describe` blocks across different test files

**Database fixture seeding:**
- For integration tests with a real database, use a transaction-per-test strategy: begin a transaction in `beforeEach`, run the test, rollback in `afterEach` -- no cleanup queries needed
- For read-heavy integration tests, seed once in `beforeAll` and use read-only fixtures
- Use a dedicated test database with a name suffix (`_test`) -- never the development or staging database

### 6. Write Parameterized Tests for Data-Intensive Scenarios

`it.each` / `test.each` eliminates copy-paste test duplication while maintaining readable output.

```typescript
describe('validateEmail', () => {
  it.each([
    // [input, expected, description]
    ['user@example.com',     true,  'standard email'],
    ['user+tag@example.com', true,  'plus-addressed email'],
    ['user@sub.domain.co',   true,  'subdomain email'],
    ['',                     false, 'empty string'],
    ['notanemail',           false, 'missing @ symbol'],
    ['@nodomain.com',        false, 'missing local part'],
    ['user@',                false, 'missing domain'],
    ['user @example.com',    false, 'space in local part'],
  ])('returns %s for "%s" (%s)', (input, expected, _description) => {
    expect(validateEmail(input)).toBe(expected)
  })
})
```

**Template literal version for readability:**
```typescript
it.each`
  price    | qty  | expected
  ${10}    | ${3} | ${30}
  ${25.50} | ${2} | ${51}
  ${0}     | ${5} | ${0}
`('price=$price qty=$qty -> total=$expected', ({ price, qty, expected }) => {
  expect(calculateTotal(price, qty)).toBeCloseTo(expected, 2)
})
```

**When NOT to use `it.each`:**
- When each case requires substantially different setup or teardown logic -- write separate named tests
- When the parameterized table obscures the business intent -- a test named "should reject negative prices" is more scannable than a row in a table

### 7. Configure Snapshot Testing Correctly

Snapshots are useful for large output objects but become a liability when overused.

**Inline snapshots (preferred for small outputs):**
```typescript
it('formats a user profile card', () => {
  const result = formatProfileCard({ name: 'Alice', role: 'admin', joinYear: 2022 })
  expect(result).toMatchInlineSnapshot(`
    {
      "badge": "Admin",
      "displayName": "Alice",
      "memberSince": "2022",
      "subtitle": "Administrator since 2022",
    }
  `)
})
```

**File snapshots (for large outputs like HTML, SQL, or serialized ASTs):**
- Snapshots live in `__snapshots__/filename.test.ts.snap`
- Run `vitest --update-snapshots` or `jest --updateSnapshot` to regenerate
- Always review snapshot diffs in PRs -- a snapshot change is a behavior change
- Exclude dynamic values before snapshotting: strip timestamps, random IDs, and environment-specific paths using `expect.any(Date)` or a custom serializer

**Custom snapshot serializer example:**
```typescript
// Strips UUIDs from snapshot output
expect.addSnapshotSerializer({
  test: (val) => typeof val === 'string' && /[0-9a-f-]{36}/.test(val),
  print: () => '"[UUID]"',
})
```

**When to avoid snapshots:**
- Do not snapshot primitive values (`expect(count).toBe(5)` is clearer than a snapshot)
- Do not snapshot error messages that change frequently
- Do not snapshot entire API responses -- assert on specific fields that represent the contract

### 8. Configure Coverage for CI Enforcement

Coverage gates prevent regression but must be configured carefully to avoid false confidence.

- **V8 provider** (`provider: 'v8'`): Uses Node.js's built-in V8 coverage engine. Fast, no instrumentation overhead, but branch detection can miss certain patterns (short-circuit evaluation, optional chaining).
- **Istanbul provider** (`provider: 'istanbul'`): Instruments code at build time. 20-40% slower but more accurate branch coverage, especially for `??`, `?.`, and ternary expressions.
- **Recommended thresholds for production services:** lines ≥ 80%, branches ≥ 75%, functions ≥ 80%. Do not set 100% -- it incentivizes testing implementation details over behavior.
- **Per-file thresholds** (Vitest ≥ 1.0): Use `perFile: true` in thresholds to catch new files added without tests rather than letting them be absorbed by global averages.
- **Exclude patterns that must always be excluded:** migration files, generated GraphQL types, Prisma client output, configuration files, barrel index files (`index.ts` that only re-export), and type declaration files.

```typescript
// vitest.config.ts coverage exclusions
coverage: {
  exclude: [
    'src/**/*.d.ts',
    'src/**/__mocks__/**',
    'src/test/**',
    'src/**/index.ts',         // barrel files
    'src/generated/**',        // codegen output
    'src/migrations/**',
    '**/*.config.{ts,js}',
    '**/*.stories.{ts,tsx}',   // Storybook
  ],
}
```

---

## Output Format

When advising on JavaScript testing setup, produce a response structured as follows:

```
## Testing Configuration Decision

**Runner Selected:** [Vitest | Jest] -- [one-sentence justification]
**TypeScript Strategy:** [native | ts-jest | babel-jest] -- [reason]
**Environment:** [node | jsdom | happy-dom] -- [reason]
**Coverage Provider:** [v8 | istanbul] -- [reason]

---

## Configuration File

[Full vitest.config.ts or jest.config.ts with comments]

---

## Test File Structure

// File: src/[module-path]/[module].test.ts

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
// or: import { describe, it, expect, jest } from '@jest/globals'

// Module mock (hoisted automatically -- declare before imports logically)
vi.mock('[dependency-path]', () => ({
  [exportedName]: vi.fn([default-behavior]),
}))

// Factory for test data
function create[Entity](overrides = {}) {
  return { [fields with sensible defaults], ...overrides }
}

describe('[ModuleUnderTest]', () => {
  let [subject]: [SubjectType]

  beforeEach(() => {
    vi.clearAllMocks()
    [subject] = new [Module]({ [dep]: mock[Dep] })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('[methodName]', () => {
    it('[behavior] when [condition]', async () => {
      // Arrange
      const input = create[Entity]({ [relevant override] })
      mock[Dep].[method].mockResolvedValue([test-response])

      // Act
      const result = await [subject].[method](input)

      // Assert
      expect(result).toEqual([expected-value])
      expect(mock[Dep].[method]).toHaveBeenCalledOnce()
      expect(mock[Dep].[method]).toHaveBeenCalledWith([expected-args])
    })

    it.each([
      [[input1], [expected1], '[case description 1]'],
      [[input2], [expected2], '[case description 2]'],
    ])('[behavior]: %s -> %s (%s)', (input, expected) => {
      expect([subject].[method](input)).toEqual(expected)
    })
  })
})

---

## Coverage Thresholds

| Metric     | Threshold | Rationale                              |
|------------|-----------|----------------------------------------|
| Lines      | 80%       | Baseline for production services       |
| Branches   | 75%       | Lower -- edge branches often impractical |
| Functions  | 80%       | Every public function should be called |
| Statements | 80%       | Aligned with lines threshold           |

---

## Mock Strategy Summary

| Dependency Type         | Strategy                          | Tool                  |
|-------------------------|-----------------------------------|-----------------------|
| Internal module         | vi.mock / jest.mock (static)      | vi.mock('../service') |
| Pure ESM npm package    | Adapter wrapper + mock wrapper    | Wrap then vi.mock     |
| Node built-in (fs, http)| vi.spyOn on namespace import      | vi.spyOn(fs, 'read')  |
| Time / Date             | Fake timers + setSystemTime       | vi.useFakeTimers()    |
| HTTP calls              | MSW (mock service worker)         | setupServer()         |
| Database                | Repository interface mock         | vi.fn() per method    |
```

---

## Rules

1. **Never mock what you do not own without a wrapper.** If you mock `axios`, `node-fetch`, or `pg` directly, your tests break every time the library changes its API. Wrap external I/O in a thin adapter (`HttpClient`, `DatabaseClient`) and mock only the adapter. This keeps mocks stable and the production boundary explicit.

2. **ESM module mocks must be declared before the import that uses them.** Both `vi.mock()` and `jest.mock()` are hoisted by the test runner's transform, but the factory function must not reference variables declared in the test file scope using `let` or `const` -- only `vi.fn()` calls and literals. Breaking this rule causes "Cannot access before initialization" errors that appear non-deterministically.

3. **`vi.clearAllMocks()` vs `vi.resetAllMocks()` vs `vi.restoreAllMocks()` are not interchangeable.** `clearAllMocks` clears call history and instances but keeps implementations. `resetAllMocks` also removes mock implementations (returns `undefined` by default). `restoreAllMocks` restores `spyOn` mocks to their original implementations. Call `clearAllMocks` in `beforeEach` for normal cleanup; call `restoreAllMocks` in `afterEach` when using `spyOn` on real modules.

4. **Never use `expect.assertions(n)` as your only async guard.** Always `await` the async result directly. `expect.assertions(1)` catches missed assertions but does not prevent a test from passing if the assertion fires in an unrelated path. Combine `await` with explicit assertion counts only for rejection-path tests.

5. **Set `testTimeout` explicitly for integration tests.** Vitest's default timeout is 5000ms; Jest's is 5000ms. Network-dependent or database-backed integration tests need 15000--30000ms. Set the timeout at the `describe` level using `vi.setConfig({ testTimeout: 20000 })` or the `timeout` option in `it('...', fn, timeout)` -- do not raise the global timeout for the whole suite.

6. **Do not import from `vitest` and use Jest globals simultaneously.** When `globals: true` is set in Vitest config, `describe`/`it`/`expect` are injected globally. Explicitly importing them from `vitest` still works but creates confusion. Pick one pattern and enforce it with an ESLint rule (`eslint-plugin-vitest` rule `no-import-node-test` or `consistent-test-it`).

7. **Snapshot files must be committed to version control.** Treating `__snapshots__` directories as build artifacts causes CI to fail on the first run in a clean environment. Add a lint rule or CI step that fails if snapshot files are listed in `.gitignore`.

8. **Coverage thresholds should increase monotonically over the life of a project.** Never lower a coverage threshold to make CI pass. If a feature is added without tests, the correct response is to write the tests, not to drop the threshold. Track threshold history in the config file's git log as documentation.

9. **Parallel test execution requires shared resource isolation.** Tests that write to the filesystem, a database, or a shared port must either use unique resource identifiers per test (e.g., a UUID-named temp directory, a randomly assigned port) or run serially with `--pool forks --poolOptions.forks.singleFork true`. Never assume test files run in a predictable order.

10. **Type-level tests belong in the test suite.** Use `expectTypeOf` (Vitest) or `tsd` (Jest-compatible) to assert that TypeScript types are correct. For a function `parseDate(s: string): Date`, assert `expectTypeOf(parseDate).returns.toEqualTypeOf<Date>()`. These catch type regressions that no runtime assertion can catch and document the public API contract in executable form.

---

## Edge Cases

### Pure ESM Packages That Cannot Be Transformed

Packages like `nanoid` v4, `chalk` v5, `execa` v7, `node-fetch` v3, and `p-queue` v7 ship only ESM. In Jest + CommonJS environments, `jest.mock()` fails because Jest's module registry cannot intercept ESM static imports without full ESM experimental mode.

**Handling approach:**
- For each pure-ESM package your code depends on, create a thin adapter: `src/lib/idGenerator.ts` wraps `nanoid`, exports `generateId`. Mock `../lib/idGenerator` instead of `nanoid`.
- Alternatively, configure `transformIgnorePatterns` in Jest to compile the specific ESM package: `transformIgnorePatterns: ['node_modules/(?!(nanoid|chalk)/)']`. Add `@babel/plugin-transform-modules-commonjs` to the Babel config used by Jest.
- In Vitest, no workaround is needed -- `vi.mock('nanoid')` works as expected because Vitest operates on the native ESM graph.

### TypeScript Path Aliases Not Resolving in Tests

Projects using `"paths"` in `tsconfig.json` (e.g., `@/*` mapping to `src/*`) frequently fail because the test runner does not read `tsconfig.json` paths automatically.

**Handling approach:**
- In Vitest: Add `vite-plugin-tsconfig-paths` to `vitest.config.ts` plugins. This reads `tsconfig.json` and configures Vite's resolver automatically.
- In Jest: Add `moduleNameMapper` entries in `jest.config.ts` that mirror each `paths` entry: `'^@/(.*)$': '<rootDir>/src/$1'`. Use `jest-resolve-tsconfig-paths` to automate this mapping from `tsconfig.json`.
- Validate the resolution by running a single test that imports a path-aliased module: `vitest run src/test/alias-resolution.test.ts`.

### Mocking `Date` and `Math.random()` for Deterministic Tests

Tests involving timestamp generation, UUID creation, or randomized behavior are non-deterministic by default, causing flaky assertions.

**Handling approach:**
- Use `vi.setSystemTime(new Date('2024-06-01T12:00:00Z'))` inside `beforeEach` after calling `vi.useFakeTimers()`. `new Date()` and `Date.now()` return deterministic values.
- Mock `Math.random` with `vi.spyOn(Math, 'random').mockReturnValue(0.5)` for tests that depend on random behavior.
- For UUID generation: mock the `crypto.randomUUID` method directly: `vi.spyOn(crypto, 'randomUUID').mockReturnValue('00000000-0000-0000-0000-000000000001')`.
- Always restore real timers and random in `afterEach` -- leaked fake timers are the most common source of "passes locally, fails in CI" bugs.

### Tests Passing Individually But Failing When Run Together (Test Pollution)

This is caused by shared mutable state: module-level variables, uncleaned DOM state, or singleton instances that persist across tests.

**Diagnosis:** Run `vitest --reporter verbose` and look for tests that pass when run with `vitest run src/specific.test.ts` but fail in the full suite. The failing test runs after a test that corrupts shared state.

**Handling approach:**
- Add `vi.isolateModules()` wrapping the import of modules that maintain module-level state (e.g., a singleton registry or a connection pool stored in module scope).
- For DOM tests, call `document.body.innerHTML = ''` in `afterEach` or use `@testing-library/react`'s `cleanup()` which is called automatically when imported.
- Enable `--sequence.shuffle` in CI: `vitest run --sequence.shuffle --sequence.seed 42`. If tests fail with shuffle that pass without it, there is state pollution. The seed makes the failure reproducible.
- Set `isolate: true` in Vitest config to give each test file its own module registry (this is the default) -- do not disable it for convenience.

### Coverage Gaps from Dynamic Imports and Conditional Requires

Dynamic `import()` calls and code paths that only execute in specific environments (e.g., `if (process.env.NODE_ENV === 'production')`) frequently appear as uncovered branches.

**Handling approach:**
- For dynamic imports, write a test that exercises the code path and `await`s the import: `const module = await import('../heavyFeature'); module.run()`.
- For environment-conditional code, use `vi.stubEnv('NODE_ENV', 'production')` (Vitest ≥ 0.28) or `process.env.NODE_ENV = 'production'` with a restore in `afterEach`. Never hardcode `process.env` changes without restoring them.
- For code that is genuinely not testable (platform-specific native bindings, catastrophic error paths), use Istanbul/V8 ignore comments sparingly: `/* v8 ignore next 3 */` or `/* istanbul ignore next */`. Document why the ignore is justified in the same comment.

### Slow Test Suites in CI (Over 3 Minutes for Unit Tests)

Unit test suites taking over 3 minutes indicate incorrect configuration, not a fundamental performance limit.

**Diagnosis checklist:**
- `--coverage` enabled during unit test runs adds 30-60% overhead. Run coverage only on scheduled CI runs or pre-merge checks, not on every push.
- `environment: 'jsdom'` initialized for every test file adds ~100ms per file. Use `environment: 'node'` as the default and scope JSDOM to specific globs: `environmentMatchGlobs: [['src/components/**', 'jsdom']]`.
- Watch for `globalSetup` that starts real servers or databases synchronously -- these serialize all test file startup. Use in-memory alternatives (SQLite, `msw` mock server) for unit/integration tests.
- Vitest's `pool: 'threads'` with `maxWorkers` defaulting to `os.cpus().length - 1` is optimal for CPU-bound tests. For I/O-bound tests (hitting a real database), limit workers to prevent connection pool exhaustion: `poolOptions: { threads: { maxWorkers: 4 } }`.
- Run `vitest bench` or measure with `--reporter verbose` to identify the 10 slowest test files. Those files contain the optimization opportunities.

### Testing Code That Uses `AbortController`, Streams, or Web APIs

Node.js 18+ includes `fetch`, `ReadableStream`, `AbortController`, and `Blob` globally, but older Node.js versions and some Jest environments do not. Tests referencing these globals fail with "ReferenceError: fetch is not defined".

**Handling approach:**
- For Node.js 16-17: polyfill in `setupFiles`: `import 'whatwg-fetch'` or `import { fetch } from 'undici'` and assign to `globalThis.fetch`.
- For `AbortController` tests: exercise the signal's `abort()` method directly in tests -- do not rely on timeout behavior. `const controller = new AbortController(); controller.abort(); expect(controller.signal.aborted).toBe(true)`.
- For streams: use Node.js `stream.Readable.from([...data])` to create test streams without file I/O.
- MSW (Mock Service Worker) v2 with the `node` integration handles `fetch` interception correctly in Node.js 18+ test environments without polyfills.

---

## Example

**Input from user:** "I'm starting a new TypeScript project with Vite and Node.js 20. I need to test a `UserService` class that has a dependency on a `UserRepository` (database) and sends welcome emails via an email service. What testing setup should I use and how do I write the tests?"

---

**Output:**

## Testing Configuration Decision

**Runner Selected:** Vitest -- The project uses Vite, so Vitest shares the same config and plugin pipeline with zero duplication. Native TypeScript and ESM support eliminate the need for Babel or ts-jest transforms.

**TypeScript Strategy:** Native (Vitest handles `.ts` files directly via esbuild transform built into Vite)

**Environment:** node -- This is a server-side service with no browser globals needed.

**Coverage Provider:** istanbul -- More accurate branch coverage for TypeScript conditional logic and optional chaining patterns common in service layers.

---

## Configuration File

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-plugin-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    exclude: ['node_modules', 'dist'],
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'lcov', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/*.test.ts',
        'src/test/**',
        'src/**/index.ts',
        'src/generated/**',
      ],
      thresholds: {
        lines: 80,
        branches: 75,
        functions: 80,
        statements: 80,
      },
    },
  },
})
```

```typescript
// src/test/setup.ts
import { vi, afterEach } from 'vitest'

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
})
```

---

## Domain Objects (for reference)

```typescript
// src/domain/user.ts
export interface User {
  id: string
  email: string
  name: string
  role: 'member' | 'admin'
  createdAt: Date
  isActive: boolean
}

// src/repositories/userRepository.ts
export interface UserRepository {
  findById(id: string): Promise<User | null>
  findByEmail(email: string): Promise<User | null>
  save(user: Omit<User, 'id' | 'createdAt'>): Promise<User>
}

// src/services/emailService.ts
export interface EmailService {
  sendWelcomeEmail(to: string, name: string): Promise<{ messageId: string }>
}
```

---

## Test File

```typescript
// src/services/userService.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { UserService } from './userService'
import type { UserRepository } from '../repositories/userRepository'
import type { EmailService } from './emailService'
import type { User } from '../domain/user'

// ── Test Data Factory ──────────────────────────────────────────────────────
let userIdCounter = 0

function createUser(overrides: Partial<User> = {}): User {
  const id = `user-${++userIdCounter}`
  return {
    id,
    email: `${id}@example.com`,
    name: 'Test User',
    role: 'member',
    createdAt: new Date('2024-01-15T10:00:00Z'),
    isActive: true,
    ...overrides,
  }
}

// ── Mocks ─────────────────────────────────────────────────────────────────
function createMockUserRepository(): UserRepository {
  return {
    findById: vi.fn(),
    findByEmail: vi.fn(),
    save: vi.fn(),
  }
}

function createMockEmailService(): EmailService {
  return {
    sendWelcomeEmail: vi.fn(),
  }
}

// ── Tests ─────────────────────────────────────────────────────────────────
describe('UserService', () => {
  let userRepository: UserRepository
  let emailService: EmailService
  let userService: UserService

  beforeEach(() => {
    userIdCounter = 0  // reset counter for deterministic IDs
    userRepository = createMockUserRepository()
    emailService = createMockEmailService()
    userService = new UserService({ userRepository, emailService })

    // Deterministic timestamps for all tests in this suite
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-15T10:00:00Z'))
  })

  // ── registerUser ─────────────────────────────────────────────────────────
  describe('registerUser', () => {
    it('creates a new user and sends a welcome email when the email is not taken', async () => {
      // Arrange
      const input = { email: 'alice@example.com', name: 'Alice', role: 'member' as const }
      const savedUser = createUser({ email: input.email, name: input.name })

      vi.mocked(userRepository.findByEmail).mockResolvedValue(null)
      vi.mocked(userRepository.save).mockResolvedValue(savedUser)
      vi.mocked(emailService.sendWelcomeEmail).mockResolvedValue({ messageId: 'msg-001' })

      // Act
      const result = await userService.registerUser(input)

      // Assert -- returned value
      expect(result).toEqual(savedUser)

      // Assert -- repository was called with correct args
      expect(userRepository.findByEmail).toHaveBeenCalledOnce()
      expect(userRepository.findByEmail).toHaveBeenCalledWith('alice@example.com')
      expect(userRepository.save).toHaveBeenCalledOnce()
      expect(userRepository.save).toHaveBeenCalledWith({
        email: 'alice@example.com',
        name: 'Alice',
        role: 'member',
        isActive: true,
      })

      // Assert -- email was sent after successful save
      expect(emailService.sendWelcomeEmail).toHaveBeenCalledOnce()
      expect(emailService.sendWelcomeEmail).toHaveBeenCalledWith('alice@example.com', 'Alice')
    })

    it('throws ConflictError when the email is already registered', async () => {
      // Arrange
      const existingUser = createUser({ email: 'taken@example.com' })
      vi.mocked(userRepository.findByEmail).mockResolvedValue(existingUser)

      // Act & Assert
      await expect(
        userService.registerUser({ email: 'taken@example.com', name: 'Bob', role: 'member' })
      ).rejects.toThrow('Email already registered: taken@example.com')

      // Assert -- no save or email when conflict detected
      expect(userRepository.save).not.toHaveBeenCalled()
      expect(emailService.sendWelcomeEmail).not.toHaveBeenCalled()
    })

    it('does not send welcome email when repository save fails', async () => {
      // Arrange
      vi.mocked(userRepository.findByEmail).mockResolvedValue(null)
      vi.mocked(userRepository.save).mockRejectedValue(new Error('Database connection lost'))

      // Act & Assert
      await expect(
        userService.registerUser({ email: 'new@example.com', name: 'Carol', role: 'member' })
      ).rejects.toThrow('Database connection lost')

      expect(emailService.sendWelcomeEmail).not.toHaveBeenCalled()
    })
  })

  // ── getUserById ──────────────────────────────────────────────────────────
  describe('getUserById', () => {
    it('returns the user when found', async () => {
      const user = createUser({ id: 'user-99' })
      vi.mocked(userRepository.findById).mockResolvedValue(user)

      const result = await userService.getUserById('user-99')

      expect(result).toEqual(user)
      expect(userRepository.findById).toHaveBeenCalledWith('user-99')
    })

    it('throws NotFoundError when user does not exist', async () => {
      vi.mocked(userRepository.findById).mockResolvedValue(null)

      await expect(userService.getUserById('missing-id')).rejects.toThrow(
        'User not found: missing-id'
      )
    })
  })

  // ── Role validation -- parameterized ─────────────────────────────────────
  describe('registerUser role validation', () => {
    it.each([
      ['member',  true,  'standard member role is valid'],
      ['admin',   true,  'admin role is valid'],
      ['guest',   false, 'guest is not a permitted role'],
      ['',        false, 'empty string is not a permitted role'],
      ['ADMIN',   false, 'roles are case-sensitive'],
    ] as const)('role="%s" isValid=%s (%s)', async (role, isValid, _description) => {
      vi.mocked(userRepository.findByEmail).mockResolvedValue(null)

      const action = () =>
        userService.registerUser({ email: 'x@example.com', name: 'X', role: role as any })

      if (isValid) {
        vi.mocked(userRepository.save).mockResolvedValue(createUser({ role: role as any }))
        vi.mocked(emailService.sendWelcomeEmail).mockResolvedValue({ messageId: 'ok' })
        await expect(action()).resolves.toBeDefined()
      } else {
        await expect(action()).rejects.toThrow('Invalid role')
      }
    })
  })
})
```

---

## Coverage Thresholds

| Metric     | Threshold | Rationale                                          |
|------------|-----------|----------------------------------------------------|
| Lines      | 80%       | Baseline for production services                   |
| Branches   | 75%       | Lower -- some error branches require complex setup |
| Functions  | 80%       | Every public method on UserService must be called  |
| Statements | 80%       | Aligned with lines threshold                       |

---

## Mock Strategy Summary

| Dependency        | Strategy                                | Tool                        |
|-------------------|-----------------------------------------|-----------------------------|
| UserRepository    | Interface-based mock factory            | `vi.fn()` per method        |
| EmailService      | Interface-based mock factory            | `vi.fn()` per method        |
| `Date.now()` / `new Date()` | Fake timers + setSystemTime  | `vi.useFakeTimers()`        |
| Database (future) | Transaction rollback per test           | Real DB in `beforeEach`     |
| HTTP email API    | MSW `setupServer` with node integration | `@mswjs/msw` v2             |

---

**Running the tests:**
```bash
# Run once
npx vitest run

# Watch mode (re-runs affected tests on file save)
npx vitest

# Coverage report
npx vitest run --coverage

# Update snapshots
npx vitest run --update-snapshots

# Type check alongside tests (Vitest ≥ 0.30)
npx vitest --typecheck
```
