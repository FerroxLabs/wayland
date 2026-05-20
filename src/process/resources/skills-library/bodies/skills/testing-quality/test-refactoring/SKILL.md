---
name: test-refactoring
description: |
  Guides expert-level test refactoring implementation: refactoring and clean-code decision frameworks, production-ready patterns, and concrete templates for test refactoring workflows.
  Use when the user asks about test refactoring, test refactoring configuration, or testing best practices for test projects.
  Do NOT use when the user needs a different testing quality capability -- check sibling skills in the testing quality subcategory.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "testing refactoring clean-code"
  category: "testing-quality"
  subcategory: "testing-quality"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Test Refactoring

## When to Use

**Use this skill when:**
- The user has a test suite where tests are hard to read, consistently require 3+ minutes to understand before modifying, or are frequently skipped because they are too brittle to fix
- The user has duplicate test setup code spread across 5+ test files that must be updated every time the production interface changes
- The user is onboarding to a codebase and the tests provide no useful documentation about intended system behavior
- The user has tests that are failing intermittently (flaky tests) and needs to restructure them to be deterministic -- not just suppress the failures
- The user wants to reduce the cost of maintaining a test suite after a major refactor of production code caused 40%+ of tests to break simultaneously
- The user has a "test iceberg" situation -- unit tests exist but they only test implementation details, not behavior, causing every internal refactor to break the suite
- The user is seeing test run times above 10 minutes for a unit test suite and wants to restructure tests to enable parallel execution and faster feedback

**Do NOT use this skill when:**
- The user needs to write new tests from scratch -- this skill is about improving existing tests, not initial test authoring
- The user is debugging a specific failing test -- that is a test debugging problem, not a refactoring problem
- The user wants to change the testing framework (e.g., migrate from Mocha to Vitest) -- that is a migration skill, not a refactoring skill
- The user needs guidance on test coverage metrics or coverage tooling configuration -- check the test coverage skill in this subcategory
- The user wants to add contract tests or integration tests to a system that has none -- that is test strategy design, not test refactoring
- The user is asking about load testing or performance testing -- those require their own discipline and skill
- The user wants to configure CI/CD pipeline test execution settings -- check the CI pipeline skill

---

## Process

### 1. Diagnose the Specific Test Smell Before Touching Code

Test refactoring without diagnosis produces tests that are cleaner but still wrong. Identify which of the canonical test smells are present before deciding on any technique.

- **Mystery Guest** -- a test depends on external state (database rows, files, environment variables) that is not visible in the test body itself. The fix is always explicit fixture construction inside the test or test setup method.
- **Eager Test** -- a single test method asserts on too many behaviors simultaneously, making the failure message ambiguous. Break these into independent focused test cases, one assertion cluster per behavior.
- **Assertion Roulette** -- multiple assertions with no distinguishing messages. Every assertion must have a descriptive failure message, or each assertion must live in its own named test.
- **Fragile Test** -- tests that break when implementation changes but behavior does not. This signals the test is coupled to internals (private methods, implementation classes, SQL query strings). Re-anchor to the public contract.
- **Slow Test** -- any unit test taking more than 100ms is a smell. Integration tests should not exceed 2 seconds. Tests exceeding these thresholds usually have hidden I/O, network calls, or unbounded loops.
- **Obscure Test** -- requires reading 3+ other classes or files before you can understand what is being tested. Fix by inlining what is needed or extracting clearly named builder/factory methods.
- **Conditional Test Logic** -- if/else or try/catch blocks inside the test body. This is always wrong. The test should have one execution path. Split into separate test cases.

Run the test suite with coverage and timing data before starting. Record baseline metrics: total test count, pass rate, median test duration, slowest 10 tests, and flakiness rate over the last 20 CI runs.

### 2. Establish Refactoring Safety Nets

Never refactor tests while also changing production code. The test suite must be green before starting.

- Commit the current test suite state as a named checkpoint. In Git, tag it: `git tag pre-refactor-YYYY-MM-DD`.
- If the suite has flaky tests, quarantine them by marking them with a skip decorator and a TODO comment referencing a tracking ticket -- do not delete them. Flaky tests in the baseline corrupt your ability to verify that refactoring did not break anything.
- Run the suite 3 times in a row before starting. If results differ between runs, do not proceed -- fix flakiness first or your safety net is unreliable.
- Agree with the team on a freeze period: no production code changes merge to the branch you are working on until the refactoring batch is complete and reviewed. Small batches (10-20 tests) avoid this coordination burden.
- For statically typed languages, ensure the compiler catches renames. If the language is dynamically typed, add a linter pass (e.g., ESLint with `no-unused-vars`, Pylint) to catch dead code introduced by renaming.

### 3. Apply the Extract and Centralize Setup Pattern

The most high-ROI refactoring in most test suites is eliminating duplicated setup code.

- Identify test files where `beforeEach`/`setUp`/fixture blocks exceed 30 lines or are copy-pasted across 3+ files. These are candidates for Object Mother or Test Data Builder extraction.
- **Object Mother pattern** -- create a factory class or module named `[Entity]Mother` (e.g., `UserMother`, `OrderMother`) that produces pre-configured valid domain objects. Methods are named for the scenario: `UserMother.withExpiredSubscription()`, `UserMother.admin()`. This pattern works best when objects have many fields but tests care about only a few.
- **Test Data Builder pattern** -- create a fluent builder that starts with sensible defaults and allows per-field overrides. This is superior to Object Mother when combinations of fields are tested frequently. Example: `new UserBuilder().withRole('admin').withExpiredSubscription().build()`.
- Extract shared infrastructure setup (database connections, HTTP clients, mock servers) into a single test helper module. In Jest this is a `globalSetup` file. In pytest this is a session-scoped `conftest.py` fixture. In JUnit 5 this is an `@ExtendWith` extension. Never put shared setup directly inside `describe`/`class` blocks -- it belongs in dedicated modules.
- After extraction, verify each test still reads as a complete specification: a reader should understand the test without following imports into helper modules.

### 4. Enforce the Arrange-Act-Assert (AAA) Structure

Every test must have exactly three sections. Tests without this structure are always harder to maintain.

- The Arrange section constructs all preconditions and inputs. It should never contain assertions. It should never contain conditional logic. If arrangement requires more than 10 lines, extract a named helper method with a descriptive name.
- The Act section contains exactly one call to the system under test. One line in most cases. If it takes more, the test is testing a workflow, not a unit -- document that explicitly or split the test.
- The Assert section verifies outcomes. Limit to assertions about a single logical concern. If you are asserting both the return value and a side effect, consider whether these are two separate tests. Use assertion libraries that produce descriptive failure messages: AssertJ (Java), FluentAssertions (.NET), pytest-asserting with custom messages, or Chai's `expect` with `.to.equal` and a message parameter.
- Separate the three sections with a blank line. In languages where this is enforced by linter rules (e.g., `jest/no-test-return-statement`), enable them. In other languages, this is a code review convention -- document it in the team's CONTRIBUTING.md.
- Name the test after the behavior being verified, not the method being called. Bad: `testCalculate()`. Good: `total_includes_tax_when_region_is_EU()`. The name should complete this sentence: "It should..." or "Given X when Y then Z".

### 5. Break Coupling to Implementation Details

This is the most technically difficult refactoring and the most impactful.

- Identify tests that import and use internal/private classes directly, or that mock private methods. These tests will break on every internal refactor even when behavior is preserved.
- The fix: test only through the public API surface. If a private method is complex enough to need its own test, extract it to a separate class and test that class directly. Do not use language hacks (reflection in Java, `_private` access in Python, `friend` in C++) to access internals from tests.
- **Over-mocking** is the most common form of implementation coupling. If a test mocks 5+ collaborators, it is testing that the subject calls collaborators in a specific way -- not that it produces correct outputs. Refactor by testing at the boundary where real outputs are observable. Replace deep mock chains with a single fake or in-memory implementation of the interface.
- The Detroit/Chicago school distinction matters here: Detroit (classicist) testing prefers real collaborators with in-memory implementations. London (mockist) testing prefers mocked collaborators. Refactoring toward the Detroit approach eliminates most implementation coupling and produces tests that survive internal restructuring.
- For boundary interactions (HTTP calls, database queries, file I/O), use test doubles at the infrastructure boundary, not deep inside the domain. In a hexagonal architecture, mock the port, not the adapter implementation.
- When you find a test that asserts on log output or console output as the primary mechanism of verification, this is a signal that the function has no meaningful return value or observable side effect. Refactor the production code to return a result, then test the result.

### 6. Restructure Tests for Parallel Execution

Test suites that cannot run in parallel are a structural problem, not a configuration problem.

- Identify tests that share mutable state: static variables, singleton services, shared database rows, shared file paths. These tests cannot be parallelized safely without refactoring.
- Apply test isolation: each test creates its own data and cleans it up. In database tests, use transaction rollback per test (begin transaction in setup, rollback in teardown). Never truncate and re-seed tables in a shared test database -- this blocks parallelism and is slow.
- For file system tests, use OS-provided temp directories (`tempfile.mkdtemp()` in Python, `Files.createTempDirectory()` in Java, `os.MkdirTemp()` in Go) and delete them in teardown.
- For tests that require a port number, use port 0 to get a random available port from the OS. Never hardcode `localhost:8080` in test setup.
- After eliminating shared mutable state, enable parallel execution: `pytest -n auto` (pytest-xdist), `--runInBand false` in Jest, `@Execution(CONCURRENT)` in JUnit 5, `t.Parallel()` in Go. Measure the before/after wall clock time. A well-parallelized suite on an 8-core machine should see 4-6x speedup.
- Tests that must run serially (e.g., tests that exercise a real external service with rate limits) should be tagged and run in a separate non-parallel job. Do not let serial requirements contaminate the main suite.

### 7. Establish and Verify Readability Standards

After structural refactoring, apply readability improvements as a final pass.

- Apply the "newspaper test" to every test: can a new developer on the team understand what this test verifies in 30 seconds without consulting any other file? If not, add more descriptive names or inline critical context.
- Use `describe`/`context` blocks (xUnit test classes in Java, `@Nested` in JUnit 5, module grouping in pytest) to group related tests. The hierarchy should reflect the system's domain concepts, not the class hierarchy.
- Delete dead tests -- tests marked `@Ignore` or `skip` for more than 90 days with no associated ticket should be removed. Dead tests create confusion about whether they represent intended behavior.
- Apply consistent terminology across the entire test suite. If the domain calls it an "invoice", every test that touches invoices uses the word "invoice" -- never "bill", "charge", or "document". This makes the test suite searchable.
- Add a one-line comment above any test that has a non-obvious precondition or that reproduces a specific bug (include the issue/ticket number). This comment is the only comment needed -- the test structure explains everything else.
- Run the full suite one final time. Compare to baseline metrics. Document: number of tests removed, number of tests added, change in total run time, change in line count of test files.

### 8. Capture Decisions and Establish Ongoing Standards

Refactoring has no permanent value if patterns drift back over the following months.

- Write a one-page test style guide in the repository (typically `docs/testing.md` or `TESTING.md`). Include: naming convention, AAA structure requirement, when to use Object Mother vs. Test Data Builder, the parallelism rules, the mocking policy, and the performance thresholds (100ms for unit, 2s for integration).
- Add automated enforcement where possible: custom Checkstyle/PMD rules (Java), Pylint plugins (Python), ESLint rules (JavaScript), custom Roslyn analyzers (.NET). Enforce test naming with a regex if the CI system supports it.
- Define a test quality gate in CI: if any single test in the unit suite exceeds 500ms, the build fails with an explanatory message. This prevents slow tests from quietly accumulating.
- Schedule a quarterly test health review to check: flakiness rate, slowest 10 tests, tests with no assertions (which always pass, catching nothing), test count growth vs. coverage growth ratio.

---

## Output Format

Provide all of the following sections when responding to a test refactoring request:

```markdown
## Test Refactoring Analysis: [Module/Suite Name]

### Baseline Metrics
| Metric                        | Current Value     | Target Value     |
|-------------------------------|-------------------|------------------|
| Total test count              | [N]               | [N ± delta]      |
| Suite run time (wall clock)   | [Xs]              | [Xs / parallel]  |
| Flakiness rate (last 20 runs) | [X%]              | < 1%             |
| Tests > 100ms (unit)          | [N]               | 0                |
| Duplicated setup LOC          | [N lines]         | [N lines]        |
| Tests with conditional logic  | [N]               | 0                |

### Identified Test Smells
| Smell                  | Count | Affected Files                  | Priority |
|------------------------|-------|---------------------------------|----------|
| Eager Test             | [N]   | [file1.test.ts, file2.test.ts]  | High     |
| Mystery Guest          | [N]   | [...]                           | High     |
| Over-mocked tests      | [N]   | [...]                           | Medium   |
| Conditional test logic | [N]   | [...]                           | High     |
| Obscure setup (>30 LOC)| [N]   | [...]                           | Medium   |
| Dead/skipped tests     | [N]   | [...]                           | Low      |

### Refactoring Plan
**Phase 1 -- Safety and Isolation (Day 1)**
- [ ] Tag baseline commit
- [ ] Quarantine [N] flaky tests with ticket references
- [ ] Verify suite passes 3 consecutive runs

**Phase 2 -- Structure (Days 2-3)**
- [ ] Extract [EntityName]Mother / Builder for [entities]
- [ ] Centralize [infrastructure type] setup into [filename]
- [ ] Apply AAA structure to [N] non-conforming tests

**Phase 3 -- Decoupling (Days 3-5)**
- [ ] Replace mock chains in [list of tests] with in-memory fakes
- [ ] Remove direct access to private/internal classes in [list]
- [ ] Re-anchor [N] tests to public API surface

**Phase 4 -- Performance (Day 5)**
- [ ] Enable parallel execution ([framework flag])
- [ ] Isolate database tests with per-test transaction rollback
- [ ] Replace hardcoded port [X] with dynamic port allocation

**Phase 5 -- Readability and Standards (Day 6)**
- [ ] Rename [N] tests to behavior-describing names
- [ ] Delete [N] tests with >90 day skip marker
- [ ] Add testing.md with conventions

### Before / After Examples

#### Smell: [Smell Name] in [filename]
**Before:**
```[language]
[original test code]
```

**After:**
```[language]
[refactored test code]
```

**Rationale:** [One sentence explaining what changed and why it matters]

### Extracted Helpers

#### [HelperName] (Object Mother / Builder / Fixture)
```[language]
[complete implementation of the extracted helper]
```

### Verification Checklist
- [ ] Suite passes with identical results before and after each phase
- [ ] No new `skip` markers introduced
- [ ] Slowest unit test is under 100ms
- [ ] No test imports a private/internal class
- [ ] Every test has a behavior-describing name
- [ ] AAA structure present in all tests (blank line separated)
- [ ] Parallel execution enabled and verified
- [ ] testing.md committed to repository
```

---

## Rules

1. **NEVER refactor tests while production code is simultaneously changing.** The test suite is your safety net for the production refactor. If tests change at the same time as production code, you lose the ability to verify that behavior was preserved. Complete test refactoring on a separate branch first, merge it, then start the production refactor.

2. **NEVER rename a test by describing what the code does -- always describe what the system should do.** `testProcessOrderSetsStatusToComplete` describes implementation. `order_becomes_complete_after_successful_payment_processing` describes behavior. The distinction matters when the implementation changes.

3. **NEVER delete a test without understanding why it was written.** Check the Git blame to find the commit that added it. If it was added to reproduce a bug, keep it or replace it with a better test for the same behavior. Deleting it means the bug can silently recur.

4. **NEVER extract a shared test helper that requires understanding its implementation to understand the test.** If a reader must look at `UserMother.admin()` to know what an admin user means in this context, the abstraction is obscuring information. The helper's name must be its complete specification. When in doubt, inline.

5. **NEVER use `sleep()`, `Thread.sleep()`, or `time.sleep()` in tests.** This is always wrong. Sleeps mask timing-dependent bugs and make the suite unpredictably slow. The correct fix is to either use a deterministic fake clock, poll with a timeout and meaningful backoff (max 5 retries, 100ms initial interval), or restructure the code to make time injectable.

6. **NEVER mock types you do not own.** Mocking third-party library types (e.g., mocking an HTTP client library's response class directly) couples your tests to the third-party API surface. Wrap the external dependency in an interface you own, then mock your interface. This insulates tests from library upgrades and makes the test express your system's requirements, not the library's API.

7. **NEVER allow a single test to take longer than 100ms in the unit test suite.** Anything over this threshold has hidden I/O, network access, unbounded computation, or excessive object construction. Identify the cause and eliminate it. If the test genuinely requires real I/O, tag it as an integration test and move it to the integration suite.

8. **NEVER leave tests that pass trivially due to missing assertions.** A test with no assertions (or only `assert True` / `expect(true).toBe(true)`) is worse than no test -- it registers as coverage while testing nothing and gives false confidence. Add a linter rule or custom assertion check to catch these: `jest/expect-expect`, `pylint no-empty-test`.

9. **NEVER use random data in tests without a seed.** Tests that use `random.random()`, `Math.random()`, `faker.name()`, or equivalent without a fixed seed are non-deterministic. Failures become unreproducible. If random data is needed for property-based tests, use a framework that logs the seed on failure (Hypothesis, fast-check, QuickCheck, jqwik) so the exact case can be reproduced.

10. **NEVER skip the baseline measurement.** Refactoring that does not start with measured metrics has no way to demonstrate value and no way to detect regressions introduced by the refactoring itself. Record total test count, wall clock run time, flakiness rate, and lines of test code before writing a single line of changed test code.

---

## Edge Cases

### Legacy Codebase With No Test Infrastructure at All
When the existing tests are raw `main()` methods, bash scripts, or manual test documentation, there is no infrastructure to refactor. Do not begin extracting helpers or builders into a vacuum -- this will produce helpers that are immediately misaligned with how tests actually need to work. Start by writing 3-5 new tests for the most critical module using the patterns you intend to establish, then use those as the canonical reference for the refactoring work on older tests. The new tests prove the patterns work in this specific codebase before you commit to applying them at scale.

### Test Suite That Caught Real Bugs But Has Zero Readable Structure
This is common in long-lived projects where tests were written reactively to production incidents. Do not refactor these tests without first cataloguing what each test was written to prevent. Add a one-line comment to each test with the original bug description (or ticket number if traceable via git blame) before restructuring. This prevents accidentally weakening a test while making it prettier. Only after cataloguing is it safe to rename, restructure, and extract helpers.

### Test Suite Where 60%+ of Tests Are Integration Tests
In heavily integration-tested codebases, the standard refactoring guidance about 100ms thresholds and parallelism applies differently. Integration tests legitimately take 1-5 seconds each. The refactoring goal shifts: identify tests that can be replaced with unit tests (tests that only test business logic with no I/O dependency), migrate those to the unit suite, and reserve the integration suite for tests that genuinely need real infrastructure. Even 20% migration from integration to unit can reduce CI time by 10+ minutes. Do not attempt to parallelize integration tests sharing a single database instance without first implementing per-test transaction isolation -- parallel writes to shared tables will produce race conditions and false failures.

### Test Refactoring in a Polyglot Repository
When a monorepo contains services in 3+ languages (e.g., Go, TypeScript, Python), resist the urge to apply a single uniform pattern across all of them. The Object Mother pattern expressed in Go uses table-driven tests (`[]struct{ name string; input X; expected Y }`), while in Python it uses pytest fixtures with `parametrize`, and in TypeScript it uses factory functions. The underlying concept is the same -- the implementation must follow each language's idiomatic conventions. Document the shared concept in the repository's TESTING.md, then provide language-specific examples for each ecosystem.

### Tests That Are the Only Documentation of the System
In some codebases, especially in financial services or regulated industries, the test suite is the only accurate specification of system behavior -- the requirements documents are outdated and the original engineers have left. In this case, test readability improvements (better naming, AAA structure, removing mystery guests) are high priority, but deletion and structural changes require explicit approval. Before deleting any test, open a ticket, describe what behavior the test was documenting, confirm with a domain expert that the behavior is still correct and covered elsewhere, then delete. Keep a record of all deletions with rationale for audit purposes.

### Tests Written Against a Dead Interface After a Major Refactor
When 40%+ of tests fail simultaneously because of a large production refactor, the temptation is to delete the broken tests and start fresh. This is almost always the wrong choice. The broken tests contain knowledge about intended behavior, even if they are expressing it against the wrong interface. The correct procedure: for each failing test, identify the behavior it was verifying (ignore the implementation it was calling), write a new test for that behavior against the new interface, then delete the old test. This is slower than deleting and rewriting from scratch, but it ensures no behavioral knowledge is lost.

### Parameterized Tests Gone Wrong
Heavily parameterized tests (`@ParameterizedTest` in JUnit, `@pytest.mark.parametrize`, `test.each` in Jest) are often introduced as a premature abstraction. When a parameterized test has 50+ cases and the failure message says "Case 23 failed", debugging requires reverse-engineering which case number 23 is. Refactor parameterized tests that exceed 10-15 cases to: (1) ensure each case has a descriptive string name in the parameter tuple, (2) split cases by scenario group using separate parameterized methods, and (3) verify that all cases genuinely test the same behavior with different inputs -- if some cases test fundamentally different scenarios, they should be separate named tests, not parameter cases.

---

## Example

**Input:** "Our React/TypeScript frontend application has 847 tests. The suite takes 14 minutes to run in CI, has a 12% flakiness rate, and whenever we refactor a component the tests break even when the user-visible behavior hasn't changed. Our tests look like this example -- can you help me refactor them?"

```typescript
// UserDashboard.test.tsx (representative example of current state)
describe('UserDashboard', () => {
  it('test1', async () => {
    const mockFetch = jest.fn();
    global.fetch = mockFetch;
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 1,
        name: 'John',
        email: 'john@example.com',
        role: 'admin',
        subscription: { status: 'active', planId: 'pro', expiresAt: '2025-12-01' },
        preferences: { theme: 'dark', notifications: true }
      })
    });
    const { container } = render(<UserDashboard userId={1} />);
    await waitFor(() => expect(container.querySelector('.user-name')).toBeTruthy());
    expect(container.querySelector('.user-name')!.textContent).toBe('John');
    expect(container.querySelector('.role-badge')!.textContent).toBe('Admin');
    expect(container.querySelector('.subscription-status')!.textContent).toBe('Active');
    expect(container.querySelector('.plan-name')!.textContent).toBe('Pro');
    expect(container.querySelector('.theme-indicator')!.getAttribute('data-theme')).toBe('dark');
  });

  it('test2', async () => {
    const mockFetch = jest.fn();
    global.fetch = mockFetch;
    mockFetch.mockResolvedValueOnce({ ok: false, status: 403 });
    const { container } = render(<UserDashboard userId={1} />);
    await waitFor(() => expect(container.querySelector('.error-message')).toBeTruthy());
    expect(container.querySelector('.error-message')!.textContent).toBe('Access denied');
  });

  it('test3', async () => {
    const mockFetch = jest.fn();
    global.fetch = mockFetch;
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 2,
        name: 'Jane',
        email: 'jane@example.com',
        role: 'viewer',
        subscription: { status: 'expired', planId: 'basic', expiresAt: '2024-01-01' },
        preferences: { theme: 'light', notifications: false }
      })
    });
    const { container } = render(<UserDashboard userId={2} />);
    await waitFor(() => expect(container.querySelector('.subscription-status')).toBeTruthy());
    expect(container.querySelector('.subscription-status')!.textContent).toBe('Expired');
    expect(container.querySelector('.upgrade-prompt')).toBeTruthy();
  });
});
```

---

**Output:**

## Test Refactoring Analysis: UserDashboard.test.tsx (Representative Suite Sample)

### Baseline Metrics
| Metric                        | Current Value  | Target Value        |
|-------------------------------|----------------|---------------------|
| Total test count              | 847            | ~820 (prune dead)   |
| Suite run time (wall clock)   | 14 min         | < 3 min (parallel)  |
| Flakiness rate (last 20 runs) | 12%            | < 1%                |
| Tests > 100ms (unit)          | ~340 estimated | 0                   |
| Duplicated setup LOC          | High (visible) | Centralized         |
| Tests with no behavior name   | 3 (test1-3)    | 0                   |

### Identified Test Smells in This Sample
| Smell                  | Count | Location                     | Priority |
|------------------------|-------|------------------------------|----------|
| Eager Test             | 1     | `test1` (5 assertions)       | High     |
| Mystery Guest / Mock   | 3     | All tests, `global.fetch`    | High     |
| Assertion Roulette     | 1     | `test1` (no messages)        | High     |
| Non-behavioral name    | 3     | `test1`, `test2`, `test3`    | High     |
| Duplicated setup       | 3     | `mockFetch` block in each    | Medium   |
| CSS selector coupling  | 3     | `.user-name`, `.role-badge`  | Medium   |

### Root Cause of the 12% Flakiness Rate

The `global.fetch = mockFetch` pattern mutates global state. When tests run in the same Jest worker process without guaranteed cleanup, one test's mock bleeds into the next test's execution. `waitFor` with a network mock creates timing sensitivity: if the component re-renders for any reason, `waitFor` can resolve against a stale DOM snapshot. These two issues together account for most frontend test flakiness.

The CSS selector coupling (`container.querySelector('.user-name')`) is why tests break during component refactors -- renaming a CSS class or switching to CSS Modules breaks every test that uses that selector, even when the displayed text is identical.

---

### Refactoring Plan

**Phase 1 -- Safety (Day 1)**
- [ ] Tag baseline: `git tag pre-refactor-2024-01-15`
- [ ] Run suite 3 consecutive times, record exact flakiness pattern
- [ ] Identify and quarantine all tests relying on `global.fetch` mutation without cleanup (search for `global.fetch =` without `afterEach(() => delete global.fetch)`)
- [ ] Enable `--runInBand` temporarily to confirm which failures are genuine vs. parallelism-caused

**Phase 2 -- Infrastructure Setup (Day 1-2)**
- [ ] Install and configure `msw` (Mock Service Worker) as the single HTTP interception layer -- replaces all `global.fetch = jest.fn()` patterns
- [ ] Create `src/tests/handlers.ts` with MSW handlers for all API routes
- [ ] Create `src/tests/server.ts` with MSW server setup and `beforeAll`/`afterAll`/`afterEach` lifecycle
- [ ] Create `src/tests/builders/userBuilder.ts` (see implementation below)

**Phase 3 -- Decouple from CSS Selectors (Days 2-3)**
- [ ] Migrate all assertions from `querySelector('.class-name')` to `getByRole`, `getByText`, `getByTestId` using Testing Library queries
- [ ] Add `data-testid` attributes only for elements that have no accessible role or label (last resort -- prefer semantic queries)
- [ ] Replace `container.querySelector` with `screen.*` queries throughout the suite

**Phase 4 -- Restructure Tests (Days 3-4)**
- [ ] Apply AAA structure and rename all tests to behavior-describing names
- [ ] Split `test1` (Eager Test) into 3 separate focused tests
- [ ] Verify: no test has conditional logic, no test has > 3 assertions on different logical concerns

**Phase 5 -- Parallelism (Day 5)**
- [ ] Confirm MSW is in place (no global mutation, no port conflicts)
- [ ] Remove `--runInBand` flag
- [ ] Measure new wall clock time with `--maxWorkers=50%`

---

### Before / After Examples

#### Smell: Eager Test + Mystery Guest + Non-behavioral Name (`test1`)

**Before:**
```typescript
it('test1', async () => {
  const mockFetch = jest.fn();
  global.fetch = mockFetch;
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({
      id: 1,
      name: 'John',
      email: 'john@example.com',
      role: 'admin',
      subscription: { status: 'active', planId: 'pro', expiresAt: '2025-12-01' },
      preferences: { theme: 'dark', notifications: true }
    })
  });
  const { container } = render(<UserDashboard userId={1} />);
  await waitFor(() => expect(container.querySelector('.user-name')).toBeTruthy());
  expect(container.querySelector('.user-name')!.textContent).toBe('John');
  expect(container.querySelector('.role-badge')!.textContent).toBe('Admin');
  expect(container.querySelector('.subscription-status')!.textContent).toBe('Active');
  expect(container.querySelector('.plan-name')!.textContent).toBe('Pro');
  expect(container.querySelector('.theme-indicator')!.getAttribute('data-theme')).toBe('dark');
});
```

**After:**
```typescript
// src/tests/builders/userBuilder.ts
interface UserOverrides {
  id?: number;
  name?: string;
  email?: string;
  role?: 'admin' | 'viewer' | 'editor';
  subscription?: Partial<Subscription>;
  preferences?: Partial<Preferences>;
}

export function buildUser(overrides: UserOverrides = {}): User {
  return {
    id: overrides.id ?? 1,
    name: overrides.name ?? 'Test User',
    email: overrides.email ?? 'test@example.com',
    role: overrides.role ?? 'viewer',
    subscription: {
      status: 'active',
      planId: 'basic',
      expiresAt: '2099-12-31',
      ...overrides.subscription,
    },
    preferences: {
      theme: 'light',
      notifications: false,
      ...overrides.preferences,
    },
  };
}

// src/tests/server.ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// src/tests/handlers.ts
import { rest } from 'msw';
import { buildUser } from './builders/userBuilder';

export const handlers = [
  rest.get('/api/users/:userId', (req, res, ctx) => {
    return res(ctx.json(buildUser({ id: Number(req.params.userId) })));
  }),
];

// UserDashboard.test.tsx -- refactored
import { server } from '../tests/server';
import { rest } from 'msw';
import { buildUser } from '../tests/builders/userBuilder';
import { render, screen } from '@testing-library/react';
import { UserDashboard } from './UserDashboard';

describe('UserDashboard', () => {
  describe('when the user is an active admin', () => {
    beforeEach(() => {
      server.use(
        rest.get('/api/users/1', (req, res, ctx) =>
          res(ctx.json(buildUser({ id: 1, name: 'John', role: 'admin' })))
        )
      );
    });

    it('displays the user full name', async () => {
      // Arrange
      render(<UserDashboard userId={1} />);

      // Act + Assert (display-only component: act is implicit render)
      expect(await screen.findByRole('heading', { name: 'John' })).toBeInTheDocument();
    });

    it('displays an admin role badge', async () => {
      // Arrange
      render(<UserDashboard userId={1} />);

      // Assert
      expect(await screen.findByText('Admin')).toBeInTheDocument();
    });

    it('shows the active subscription status', async () => {
      // Arrange
      render(<UserDashboard userId={1} />);

      // Assert
      expect(await screen.findByText('Active')).toBeInTheDocument();
    });
  });

  describe('when the API returns 403 Forbidden', () => {
    beforeEach(() => {
      server.use(
        rest.get('/api/users/1', (req, res, ctx) =>
          res(ctx.status(403))
        )
      );
    });

    it('shows an access denied error message', async () => {
      // Arrange
      render(<UserDashboard userId={1} />);

      // Assert
      expect(await screen.findByRole('alert')).toHaveTextContent('Access denied');
    });
  });

  describe('when the user has an expired subscription', () => {
    beforeEach(() => {
      server.use(
        rest.get('/api/users/2', (req, res, ctx) =>
          res(ctx.json(buildUser({
            id: 2,
            name: 'Jane',
            role: 'viewer',
            subscription: { status: 'expired', planId: 'basic', expiresAt: '2024-01-01' },
          })))
        )
      );
    });

    it('shows expired subscription status', async () => {
      // Arrange
      render(<UserDashboard userId={2} />);

      // Assert
      expect(await screen.findByText('Expired')).toBeInTheDocument();
    });

    it('shows an upgrade prompt when subscription is expired', async () => {
      // Arrange
      render(<UserDashboard userId={2} />);

      // Assert
      expect(await screen.findByRole('link', { name: /upgrade/i })).toBeInTheDocument();
    });
  });
});
```

**Rationale for each change:**

- `global.fetch = mockFetch` replaced with MSW -- MSW intercepts at the network layer (using `XMLHttpRequest` and `fetch` interceptors), not by mutating globals. After each test `server.resetHandlers()` runs, eliminating bleed-between-tests flakiness.
- `container.querySelector('.user-name')` replaced with `screen.findByRole('heading', { name: 'John' })` -- the query is now anchored to accessible semantics, not CSS implementation. Renaming the class or switching to CSS Modules does not break the test.
- `test1` split into 3 separate tests -- each test now has one logical assertion cluster. When the "role badge" test fails, it is immediately clear what broke without reading the full test.
- `buildUser()` defaults to a valid user with inert values (`role: 'viewer'`, `subscription.status: 'active'`) -- each test only specifies what is relevant to its scenario, making the test body self-documenting.
- `describe` blocks use scenario language, not class/method language -- a new developer reads "when the user has an expired subscription" and immediately understands the precondition without reading setup code.

### Projected Impact After Full Suite Migration

| Metric                      | Before    | After (projected) |
|-----------------------------|-----------|-------------------|
| Suite run time              | 14 min    | 2.5-3 min         |
| Flakiness rate              | 12%       | < 0.5%            |
| Test files requiring update after CSS rename | ~210 | 0 |
| Test files requiring update after API response shape change | ~847 | 1 (handlers.ts) |
| New developer onboarding time to understand a test | 3-5 min | < 30 sec |

The most significant gain is that all API shape knowledge is now centralized in `handlers.ts` and `userBuilder.ts`. When the `/api/users/:userId` response adds a new field, exactly one file changes -- not 200 test files. This is the structural reason implementation-coupled tests are expensive at scale.
