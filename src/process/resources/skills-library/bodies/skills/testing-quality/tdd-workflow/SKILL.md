---
name: tdd-workflow
description: |
  Guides expert-level tdd workflow implementation: tdd and clean-code decision frameworks, production-ready patterns, and concrete templates for tdd workflow workflows.
  Use when the user asks about tdd workflow, tdd workflow configuration, or tdd best practices for tdd projects.
  Do NOT use when the user needs a different testing quality capability -- check sibling skills in the testing quality subcategory.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "tdd testing clean-code"
  category: "testing-quality"
  subcategory: "testing-quality"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# TDD Workflow

## When to Use

**Use this skill when:**
- User asks how to implement test-driven development from scratch on a greenfield project and needs a concrete Red-Green-Refactor workflow
- User has a partially tested codebase and wants to adopt TDD incrementally without halting feature delivery
- User is writing a specific unit or integration test and is stuck on how to structure the test-first cycle for that particular function, class, or module
- User asks about assertion strategies, test doubles (mocks, stubs, fakes, spies), or test granularity decisions in a TDD context
- User wants to understand when TDD genuinely improves design (dependency injection, interface segregation) vs. when it introduces friction
- User asks about testing frameworks, assertion libraries, or test runner configuration specific to their stack (Jest, pytest, RSpec, JUnit, NUnit, Go testing, etc.)
- User wants guidance on test naming conventions, folder structures, or the "arrange-act-assert" pattern
- User is experiencing test suite rot -- slow tests, brittle tests, tests that test implementation details -- and wants to refactor toward correct TDD discipline
- User asks about mutation testing, test coverage thresholds, or test quality metrics

**Do NOT use this skill when:**
- User needs end-to-end testing strategy using browser automation (Cypress, Playwright, Selenium) -- use the E2E testing skill instead
- User is asking about CI/CD pipeline configuration for running tests -- use the CI/CD pipeline skill
- User needs contract testing for microservices (Pact, Spring Cloud Contract) -- use the contract testing skill
- User wants static analysis, linting, or type-checking setup -- use the code quality static analysis skill
- User is asking about load testing or performance benchmarking -- use the performance testing skill
- User needs acceptance test-driven development (ATDD) with stakeholder-facing scenarios (Cucumber, Behave, SpecFlow) -- use the BDD/ATDD skill
- User only wants to add tests to existing untested code without applying the TDD cycle -- guide them toward the legacy code testing skill
- User is asking about general software architecture patterns with no specific testing question -- use the architecture design skill

---

## Process

### 1. Establish Context Before Writing Any Test

Before opening a test file, gather the following information to make concrete recommendations:

- **Language and testing framework:** The cycle mechanics differ between Jest (JavaScript/TypeScript), pytest (Python), RSpec (Ruby), JUnit 5 (Java/Kotlin), NUnit/xUnit (C#), and the Go standard library. Framework-specific patterns matter -- Jest uses `describe/it` blocks with `expect(x).toBe(y)`; pytest uses plain functions with `assert x == y`; RSpec uses `describe/context/it` with matcher DSL.
- **Unit under test boundaries:** Determine whether this is pure logic (no I/O, no side effects), a service layer (depends on repositories or external APIs), or a controller/handler (depends on framework routing). The boundary determines which test doubles are needed.
- **Team TDD maturity level:** Beginners confuse TDD with "write tests after coding." Confirm the user understands the cycle before recommending advanced patterns like London-style (mockist) TDD or parameterized property-based testing.
- **Existing test suite health:** Check if a test suite already exists. If tests exist but bypass TDD discipline (coverage added post-hoc, tests that mirror implementation), note this before recommending the workflow.
- **Domain complexity:** High-domain-logic code (pricing engines, rules evaluators, state machines) benefits most from TDD. Infrastructure glue code (dependency wiring, configuration loaders) benefits least and often produces brittle tests.

### 2. Write the Failing Test First (Red Phase)

The Red phase is the most violated step in TDD. Enforce these specifics:

- **Write exactly one test.** Do not write a test suite skeleton before any code exists. One test, one behavioral expectation, run it, watch it fail.
- **Verify it fails for the right reason.** A test that fails because the class does not exist is not the same as a test that fails because the behavior is wrong. Strive for the second category -- create the minimal skeleton (empty class, empty method returning `None`/`null`/`0`) so the test fails on the assertion, not on a `NameError` or `ClassNotFoundException`.
- **Name the test after the behavior, not the method.** Prefer `test_returns_zero_for_empty_cart()` over `test_calculate_total()`. The test name is documentation; it should describe what the system does, not which method is called.
- **One assertion per test concept** -- not one `assert` statement. A test for "a discount of 10% applies when order total exceeds $100" may need two assertions: the discounted price is correct AND the discount metadata is populated. Both belong together because they test the same behavior.
- **Use the Arrange-Act-Assert (AAA) structure explicitly:** Separate the three sections with blank lines or comments. This is not stylistic -- it prevents the common mistake of setup leaking into the assertion.
- **Acceptance criteria drive the test:** If there is a ticket or user story, map each acceptance criterion to exactly one or more test cases before writing any production code.

### 3. Write the Minimum Production Code to Pass (Green Phase)

The Green phase discipline is to write the smallest, ugliest, most straightforward code that makes the test pass:

- **Fake it till you make it:** Return a hardcoded value if that makes the test green. This sounds absurd but forces you to write the next test that breaks the hardcoded assumption.
- **Do not write code for requirements you have not yet tested.** If your test says "returns 5", do not write `return x + y` -- write `return 5`. The next test forces you to generalize.
- **Triangulation:** Write at least two or three tests with different inputs before generalizing the algorithm. Triangulation prevents premature abstraction.
- **No error handling until there is a test for the error case.** Adding defensive `try/catch` or `if x is None` guards without a failing test is speculation, not TDD.
- **Keep the green phase under 3 minutes.** If it takes longer, the test is too large. Stop, split the behavioral expectation into smaller increments, and write a simpler test first.
- **Run all tests after making the failing test pass.** Confirm you have not broken anything else. If something breaks, you introduced an unintended side effect -- fix it before proceeding.

### 4. Refactor Without Changing Behavior (Refactor Phase)

The refactor phase is where clean code emerges. The safety net of a passing test suite is what makes aggressive refactoring possible:

- **Apply the "Four Rules of Simple Design" in order:** (1) Tests pass, (2) Reveals intent, (3) No duplication (DRY), (4) Fewest elements. Do not optimize for the fourth rule until the first three are satisfied.
- **Eliminate duplication within the production code.** Common duplication targets: magic numbers (replace with named constants), repeated conditional checks (extract to a predicate method), similar object construction (extract to a factory or builder).
- **Eliminate duplication within the test code.** Test smell indicators: copied setup blocks (extract to `beforeEach`/`setUp`/`let`), repeated assertion patterns (extract to a custom assertion helper), identical input data construction (extract to a test data builder).
- **Rename until the code reads like prose.** After refactoring, a developer who did not write the code should be able to read the method and understand what it does without comments.
- **Do not refactor production code and tests simultaneously.** Refactor production code first (tests still green), commit, then refactor tests (still green), commit. Mixing both changes makes failures hard to diagnose.
- **Run the full test suite after every individual refactoring step.** Do not batch multiple refactors before running tests.
- **The refactor phase is when to introduce design patterns** (Strategy, Template Method, Specification, etc.) -- but only when duplication or complexity makes the pattern earn its complexity overhead.

### 5. Manage Test Doubles Correctly

Test doubles are the most misused tool in TDD. Use precise terminology and rules:

- **Dummy:** Passed as an argument but never used. Use when a constructor or method requires a parameter you do not care about in this test.
- **Stub:** Returns a canned answer to a query. Use when the unit under test calls a dependency to read data (repository `findById`, clock `now()`, external rate service `getRate()`).
- **Mock:** Pre-programmed with expectations -- it verifies that a specific call was made. Use when the behavior you are testing is that the unit sends a command to a collaborator (email service `send()`, audit log `record()`, event bus `publish()`).
- **Fake:** A working, lightweight implementation. Use for in-memory repositories, in-memory message queues, or SQLite standing in for PostgreSQL in integration tests.
- **Spy:** A real object that records what was called. Use sparingly -- spies couple tests to implementation details more than stubs.
- **The rule of thumb:** Mock commands (state-changing operations), stub queries (data-returning operations). Do not mock queries -- if you mock `getTotal()` to return `100`, you are not testing that `getTotal()` computes correctly.
- **Do not mock types you do not own.** Do not mock `HttpClient`, `SqlConnection`, or third-party library classes directly. Wrap them in an interface you own, then mock the interface. This decouples tests from third-party API changes.
- **Avoid over-mocking.** If a test mocks 5 or more collaborators, the production class under test has too many responsibilities. This is a design signal -- split the class.

### 6. Organize the Test Suite for Long-Term Sustainability

- **Mirror the source directory structure.** `src/domain/pricing/DiscountCalculator.ts` maps to `tests/domain/pricing/DiscountCalculator.test.ts` (or `__tests__/domain/pricing/DiscountCalculator.test.ts` in Jest conventions). This makes it trivial to locate tests for any production file.
- **Separate unit tests from integration tests at the folder or file-naming level.** Use `*.unit.test.ts` vs `*.integration.test.ts`, or `tests/unit/` vs `tests/integration/`. This allows CI to run fast unit tests on every commit and slower integration tests on PR merge.
- **Apply the test pyramid:** Aim for 70% unit tests, 20% integration tests, 10% end-to-end tests by count. The exact percentages are guidelines, not rules, but the shape (many small fast tests, few large slow tests) is the principle.
- **Set coverage thresholds as a floor, not a goal.** A 90% coverage threshold prevents regression -- it does not guarantee quality. Configure `--coverageThreshold` (Jest), `--cov-fail-under` (pytest), or Jacoco minimums in build config, but do not write tests just to hit the number.
- **Configure the test runner for deterministic, isolated test execution.** Tests must not depend on execution order. Use fresh state setup in `beforeEach`/`setUp` for every test. Shared mutable state between tests is the most common cause of flaky test suites.

### 7. Apply the TDD Cycle to Bug Fixes

Every bug fix is an opportunity to strengthen the test suite:

- **Before fixing a bug, write a test that reproduces it.** Run the test -- it must fail (red). If it does not fail, you do not understand the bug yet.
- **Write the minimal reproducing test.** The test must be as small and focused as possible. If you need 200 lines of setup to reproduce the bug, extract the root cause into a smaller unit test.
- **Fix the bug.** The test turns green.
- **Check whether the bug indicates missing tests for neighboring behaviors.** A bug in a discount calculation edge case often means there are untested edge cases for other discount types.
- **Never delete the bug reproduction test.** It is now a regression guard.

### 8. Evaluate and Evolve the Test Suite

A TDD practice that does not self-evaluate accumulates test debt:

- **Run mutation testing** (Stryker for JavaScript/TypeScript, mutmut or Cosmic Ray for Python, PIT for Java) quarterly or on critical modules. A mutation score below 70% on core domain logic indicates tests that pass for the wrong reasons.
- **Track test execution time.** Unit test suites above 30 seconds on a developer machine will be skipped. Profile the slow tests with `--verbose` or `--testTimeout` flags. Common culprits: real I/O in unit tests, unbounded loops in test setup, un-mocked timers.
- **Review test failure messages for clarity.** When a test fails, the failure message should immediately tell you what behavior broke without reading the test body. If the message is `AssertionError: False is not true`, the assertion is too generic -- use specific matchers with descriptive messages.
- **Delete tests that test implementation details.** Tests that break when you rename a private method, change an internal data structure, or refactor an algorithm without changing behavior are testing the wrong thing. Identify them in post-refactor retrospectives.
- **Apply test code reviews with equal rigor to production code reviews.** Test code rots faster than production code because there is no linter or type checker enforcing good test practices by default.

---

## Output Format

When helping a user implement a TDD workflow, produce the following structured response:

```
## TDD Workflow Plan: [Feature or Module Name]

### Context Summary
- Language / Framework: [e.g., TypeScript with Jest, Python with pytest]
- Unit Under Test: [Class, function, or module name]
- Collaborators / Dependencies: [List what needs to be doubled]
- TDD Style: [Chicago/Classical or London/Mockist]
- Phase: [Starting fresh | Adding to existing | Bug fix | Refactor coverage]

---

### Test Case List (Before Writing Any Code)

| # | Behavior to Test | Input | Expected Output | Double Needed? |
|---|-----------------|-------|-----------------|----------------|
| 1 | [e.g., returns 0 for empty cart] | empty array | 0 | No |
| 2 | [e.g., sums item prices] | [{price:10},{price:5}] | 15 | No |
| 3 | [e.g., applies 10% discount over $100] | [{price:60},{price:50}] | 99.00 | No |
| 4 | [e.g., calls audit log on checkout] | valid cart | -- | Mock: AuditLog |

---

### Red Phase -- Failing Test

```[language]
[Complete test code with AAA structure labeled]
```

**Run command:** [e.g., `npx jest --testPathPattern=CartCalculator --watch`]
**Expected failure:** [What the error message should say]

---

### Green Phase -- Minimal Production Code

```[language]
[Complete minimal implementation that makes the test pass]
```

**Run command:** [Same command]
**Confirmation:** All [N] tests passing, [N] new assertions

---

### Refactor Phase

**Identified issues:**
- [e.g., magic number 0.10 should be a named constant DISCOUNT_RATE]
- [e.g., discount logic is inline in calculate() -- extract to applyDiscount()]

```[language]
[Refactored production code]
```

**Tests still passing:** Yes / No (if No, diagnosis here)

---

### Next Test to Write

[Name and behavior of the next test case from the list above]

---

### Test Double Setup

```[language]
[Mock/stub/fake code if applicable]
```

---

### Recommended Coverage Threshold

| Layer | Threshold | Rationale |
|-------|-----------|-----------|
| Domain / Core Logic | 90%+ | High business value, low tolerance for regressions |
| Application Services | 80%+ | Depends on integration boundaries |
| Infrastructure / Adapters | 60%+ | Integration tests cover more here |
| Controllers / Handlers | 70%+ | Unit tests for logic, integration tests for routing |
```

---

## Rules

1. **NEVER write production code before a failing test exists.** Not a single line of application logic should exist without a corresponding red test. This is the foundational discipline -- if the user says "I'll write tests after," redirect them to the TDD cycle explicitly.

2. **NEVER mock a type you do not own.** Mocking `axios`, `fetch`, `psycopg2`, or `SqlConnection` directly couples tests to third-party implementation details. Always wrap external dependencies in an interface or adapter that you control, then mock the interface.

3. **NEVER write a test that tests multiple unrelated behaviors.** A test named `test_cart_operations` that tests add, remove, and checkout is three tests masquerading as one. Each test must have a single reason to fail.

4. **ALWAYS name tests in the format: `[unit]_[scenario]_[expected outcome]`** or plain English behavior descriptions. Examples: `calculateTotal_withEmptyCart_returnsZero` (xUnit naming) or `"returns 0 when cart is empty"` (Jest/RSpec style). Never use names like `test1`, `testCalculate`, or `testCase`.

5. **NEVER let a test pass without first seeing it fail.** If you write a test and it is immediately green, you have either tested something that was already implemented, or the test has a structural flaw (wrong assertion, testing a mock not the real code, wrong import). Investigate before moving on.

6. **NEVER use `sleep()`, `Thread.sleep()`, or `time.sleep()` in tests.** Real timers make tests slow and non-deterministic. Use a clock abstraction (`IClock`, `Clock` interface) that can be injected with a fake clock in tests and the system clock in production.

7. **ALWAYS run the full test suite before and after every refactor step.** Partial test runs hide regressions. Configure your IDE or editor to run all tests on save, or at minimum before every git commit via a pre-commit hook.

8. **NEVER use `@Ignore`, `xit`, `xtest`, `skip`, or `pytest.mark.skip` as a permanent state.** Skipped tests are lies -- they claim a behavior is tested when it is not. If a test is consistently skipped, delete it and file a ticket to restore it. A skipped test that stays skipped for more than one sprint is a zombie test.

9. **NEVER assert on implementation details.** Tests should verify observable behavior (return values, side effects via interfaces, state changes visible through public API). Tests that verify private method call counts, internal variable names, or specific algorithm steps break on every refactoring and add zero confidence.

10. **ALWAYS treat the test suite as a first-class design artifact.** Test code goes through code review, refactoring, and naming standards with the same rigor as production code. A poorly maintained test suite destroys TDD adoption faster than any other factor -- teams abandon TDD because the tests are painful to maintain, not because TDD itself is wrong.

---

## Edge Cases

### Legacy Codebase Without Seams

When introducing TDD to existing code with deep coupling, the standard cycle cannot start because the code under test cannot be instantiated in isolation. Apply the Seam Model from Michael Feathers' "Working Effectively with Legacy Code":
- Identify a "seam" -- a place where you can change behavior without editing the code being called. Common seams: constructor injection, property injection, factory methods, interface extraction.
- Use the "Sprout Method" technique: instead of modifying an existing untested method, write the new behavior as a separate new method (with TDD), then call it from the untested method. This lets you test the new behavior without needing to test the legacy code.
- Use the "Characterization Test" technique: write tests that document what the existing code actually does (even if wrong), providing a safety net before any refactoring. These are not TDD tests -- they are change detectors.
- Budget 20-30% of the time for legacy seam work. It is slow and unglamorous but the foundation for sustainable TDD adoption.

### Testing Asynchronous Code

Async behavior is one of the most common sources of flaky tests:
- **JavaScript/TypeScript with Jest:** Always return the promise or use `async/await` in test functions. Tests that do not await async calls will pass vacuously even when the assertion would fail. Use `expect.assertions(N)` to verify that a specific number of assertions ran, preventing false passes in async tests.
- **Python with pytest:** Use `pytest-asyncio` with the `@pytest.mark.asyncio` decorator. Do not mix synchronous and asynchronous test patterns in the same module.
- **Event-driven systems:** Use a `FakeEventBus` that collects published events in a list. Assert on the contents of that list. Never use real message brokers (Kafka, RabbitMQ, SQS) in unit tests -- use an in-memory fake.
- **Polling and retry logic:** Fake the clock by injecting a `ClockService` that returns controlled time values. Test that the retry interval is 2 seconds by advancing the fake clock by 1999ms and asserting no retry occurred, then by 2000ms and asserting a retry occurred.

### Parameterized and Data-Driven Tests

Many TDD practitioners write one test per input/output pair, causing test suite explosion for calculation-heavy logic:
- Use parameterized tests to test multiple input scenarios through the same behavioral assertion. Jest: `it.each([[input1, expected1], [input2, expected2]])`. pytest: `@pytest.mark.parametrize`. JUnit 5: `@ParameterizedTest` with `@MethodSource`.
- Each row in a parameterized test must still have a descriptive name. `it.each` accepts template strings: `"returns %s when given %s"`. Unnamed parameterized tests produce failure messages like `test case 7 failed` with no diagnostic value.
- For edge cases at numeric boundaries (0, 1, -1, `MAX_INT`, `MIN_INT`, `NaN`, `null`, empty string), always write parameterized tests. Business logic that passes for `n=5` often fails at `n=0` or `n=1` in ways that TDD would have caught.

### When TDD Slows Down UI Components

TDD for rendering logic (React components, Vue components, Angular templates) is genuinely harder than for domain logic:
- **Do not unit test rendering details.** Testing that a button has `class="btn-primary"` or that an SVG path has a specific `d` attribute is brittle and low value.
- **Test behavior, not structure.** Test that clicking a button calls the handler, that submitting a form with invalid data shows an error message, that a loading spinner appears while data is fetching.
- **Use React Testing Library, Vue Testing Utils, or Angular TestBed** with the philosophy of testing from the user's perspective (query by accessible role, label, or text) rather than by CSS class or component internals.
- **Move business logic out of components into pure functions or services, then TDD the pure functions.** A well-separated component has almost no testable logic -- all logic lives in a service that is trivially testable.
- Snapshot tests are NOT TDD. They test that nothing changed, not that the behavior is correct. Use sparingly for intentional visual regression detection only.

### Over-Mocking and Loss of Confidence

A test suite that mocks every collaborator can achieve 95% coverage while giving zero confidence that the system actually works end-to-end:
- **Symptom:** Tests pass but the application fails in staging. All tests use mocks that return perfect data; real integrations return unexpected formats or errors.
- **Diagnosis:** Apply the "integration test missing" check -- for every mock that replaces a real I/O boundary (database, HTTP call, file system), there must be at least one integration test that exercises the real boundary with a real dependency (in-memory database, WireMock, local file).
- **Prescription:** Use the Chicago/Classical style (test with real collaborators wherever feasible, fake only at I/O boundaries) rather than the London/Mockist style (mock everything except the unit under test) for most applications. Reserve London style for architectures with clearly defined ports and adapters (Hexagonal Architecture).
- **Threshold:** If more than 40% of test lines are mock setup code, the design has too much coupling between collaborators and the tests are masking design problems.

### Tests That Become the Bottleneck

When a project reaches 5,000+ unit tests, execution time matters:
- **Profile before optimizing.** Use `--verbose` to identify the top 10 slowest tests. In Jest, use `--detectOpenHandles` to find tests that are not cleaning up connections or timers.
- **Parallelize by default.** Jest runs test files in parallel by default with worker threads. Ensure your tests are stateless enough to run in any order across workers -- do not use module-level mutable variables.
- **Use test sharding for CI.** Split test suites across CI workers using `--shard=1/4`, `--shard=2/4` etc. (Jest 28+, pytest-split). A 30-second local test suite should not become a 10-minute CI bottleneck.
- **Guard against test coupling through shared databases.** If integration tests share a database, use transaction rollback per test (wrap each test in a transaction that is rolled back, never committed) or use per-test schema isolation with test-specific prefixes.

### Nested Contexts vs. Flat Test Files

As test files grow, organization becomes a readability problem:
- **RSpec and Jest:** Nested `describe`/`context` blocks work well up to 3 levels deep. Beyond 3 levels of nesting, extract to a separate test file with a more specific name.
- **pytest:** Flat test functions with descriptive names scale better than class-based nesting. Use `class TestWhenUserIsUnauthenticated:` only when grouping tests by a shared precondition that requires different `@pytest.fixture` values.
- **The "given-when-then" naming convention** maps to RSpec and Jest naturally: outer `describe("CartCalculator")`, `describe("when cart is empty")` (given/context), `it("returns zero total")` (then). This triple-nesting is the sweet spot.

---

## Example

**Input from user:** "I'm building a discount engine in Python. The rule is: orders over $100 get 10% off, orders over $200 get 20% off, orders under $100 get no discount. I want to implement this with TDD using pytest. Where do I start?"

**Output:**

### TDD Workflow Plan: DiscountCalculator

#### Context Summary
- Language / Framework: Python 3.10+ with pytest
- Unit Under Test: `DiscountCalculator.calculate_discount(order_total: float) -> float`
- Collaborators / Dependencies: None -- pure function, no test doubles needed
- TDD Style: Chicago/Classical (no mocking required for pure logic)
- Phase: Starting fresh -- no production code exists yet

---

#### Test Case List (Written Before Any Production Code)

| # | Behavior to Test | Input | Expected Output | Double Needed? |
|---|-----------------|-------|-----------------|----------------|
| 1 | No discount for order below $100 | 50.00 | 50.00 | No |
| 2 | No discount for order exactly $100 (boundary) | 100.00 | 100.00 | No |
| 3 | 10% discount for order just above $100 | 100.01 | 90.009 (round to 2dp: 90.01) | No |
| 4 | 10% discount for order of $150 | 150.00 | 135.00 | No |
| 5 | 10% discount for order exactly $200 (boundary) | 200.00 | 180.00 | No |
| 6 | 20% discount for order just above $200 | 200.01 | 160.008 (round: 160.01) | No |
| 7 | 20% discount for order of $250 | 250.00 | 200.00 | No |
| 8 | Zero order total (edge) | 0.00 | 0.00 | No |
| 9 | Negative total (invalid input) | -10.00 | raises ValueError | No |

---

#### Step 1 -- Red Phase: Write the First Failing Test

Create `tests/domain/test_discount_calculator.py`:

```python
# tests/domain/test_discount_calculator.py

import pytest
from src.domain.discount_calculator import DiscountCalculator


class TestDiscountCalculator:

    def test_no_discount_when_order_total_is_below_100(self):
        # Arrange
        calculator = DiscountCalculator()
        order_total = 50.00

        # Act
        result = calculator.calculate_discount(order_total)

        # Assert
        assert result == 50.00
```

**Run command:**
```bash
pytest tests/domain/test_discount_calculator.py -v
```

**Expected failure:**
```
ModuleNotFoundError: No module named 'src.domain.discount_calculator'
```

This is expected. Now create the minimal skeleton so the test fails on the assertion, not on the import:

```python
# src/domain/discount_calculator.py

class DiscountCalculator:
    def calculate_discount(self, order_total: float) -> float:
        return None
```

**Re-run.** Expected failure now:
```
AssertionError: assert None == 50.0
```
Good -- the test fails on the assertion. The Red phase is correctly established.

---

#### Step 2 -- Green Phase: Minimal Code to Pass Test 1

```python
# src/domain/discount_calculator.py

class DiscountCalculator:
    def calculate_discount(self, order_total: float) -> float:
        return order_total  # Minimal: return input unchanged
```

**Run command:**
```bash
pytest tests/domain/test_discount_calculator.py -v
```

**Result:** 1 passed. No refactoring needed yet -- the code is already minimal and readable.

---

#### Step 3 -- Red Phase: Add Test 2 (Boundary at $100)

```python
    def test_no_discount_when_order_total_is_exactly_100(self):
        # Arrange
        calculator = DiscountCalculator()

        # Act
        result = calculator.calculate_discount(100.00)

        # Assert
        assert result == 100.00
```

**Run.** This test passes immediately because `return order_total` handles it. This is expected -- the boundary case was implicit in the first implementation. Proceed.

---

#### Step 4 -- Red Phase: Add Test 3 (10% discount above $100)

```python
    def test_applies_10_percent_discount_when_order_total_exceeds_100(self):
        # Arrange
        calculator = DiscountCalculator()
        order_total = 150.00

        # Act
        result = calculator.calculate_discount(order_total)

        # Assert
        assert result == 135.00
```

**Run.** Expected failure:
```
AssertionError: assert 150.0 == 135.0
```

**Green phase -- minimal implementation:**

```python
class DiscountCalculator:
    def calculate_discount(self, order_total: float) -> float:
        if order_total > 100.00:
            return order_total * 0.90
        return order_total
```

**Run all tests.** 3 passed.

---

#### Step 5 -- Red Phase: Add Test 5 (Boundary at $200 -- still 10%)

```python
    def test_applies_10_percent_discount_when_order_total_is_exactly_200(self):
        calculator = DiscountCalculator()
        result = calculator.calculate_discount(200.00)
        assert result == 180.00
```

**Run.** This test passes immediately -- `200.00 * 0.90 == 180.00`. Proceed.

---

#### Step 6 -- Red Phase: Add Test 6 (20% discount above $200)

```python
    def test_applies_20_percent_discount_when_order_total_exceeds_200(self):
        calculator = DiscountCalculator()
        result = calculator.calculate_discount(250.00)
        assert result == 200.00
```

**Run.** Expected failure:
```
AssertionError: assert 225.0 == 200.0
```
(Current code applies 10% to 250, giving 225, not 200.)

**Green phase:**

```python
class DiscountCalculator:
    def calculate_discount(self, order_total: float) -> float:
        if order_total > 200.00:
            return order_total * 0.80
        if order_total > 100.00:
            return order_total * 0.90
        return order_total
```

**Run all tests.** 5 passed.

---

#### Step 7 -- Red Phase: Add Test 9 (Invalid negative input)

```python
    def test_raises_value_error_when_order_total_is_negative(self):
        calculator = DiscountCalculator()
        with pytest.raises(ValueError, match="Order total cannot be negative"):
            calculator.calculate_discount(-10.00)
```

**Run.** Expected failure:
```
Failed: DID NOT RAISE <class 'ValueError'>
```

**Green phase:**

```python
class DiscountCalculator:
    def calculate_discount(self, order_total: float) -> float:
        if order_total < 0:
            raise ValueError("Order total cannot be negative")
        if order_total > 200.00:
            return order_total * 0.80
        if order_total > 100.00:
            return order_total * 0.90
        return order_total
```

**Run all tests.** 6 passed.

---

#### Step 8 -- Refactor Phase

**Identified issues in production code:**
1. Magic numbers `0.80`, `0.90`, `100.00`, `200.00` have no names -- they cannot be understood without context
2. The discount tiers are hardcoded -- if business adds a 30% tier at $500, the method requires modification (Open/Closed Principle violation)

**Refactored production code:**

```python
# src/domain/discount_calculator.py
from dataclasses import dataclass


@dataclass(frozen=True)
class DiscountTier:
    minimum_order: float
    discount_rate: float


class DiscountCalculator:
    DISCOUNT_TIERS = [
        DiscountTier(minimum_order=200.00, discount_rate=0.20),
        DiscountTier(minimum_order=100.00, discount_rate=0.10),
    ]

    def calculate_discount(self, order_total: float) -> float:
        if order_total < 0:
            raise ValueError("Order total cannot be negative")

        for tier in self.DISCOUNT_TIERS:
            if order_total > tier.minimum_order:
                return round(order_total * (1 - tier.discount_rate), 2)

        return order_total
```

**Run all tests.** 6 passed. Refactoring is complete.

---

#### Step 9 -- Refactor Phase: Parameterize Repetitive Tests

**Identified issue in test code:** Tests 1-7 have identical structure but different inputs. Extract to parameterized tests:

```python
# tests/domain/test_discount_calculator.py

import pytest
from src.domain.discount_calculator import DiscountCalculator


class TestDiscountCalculatorAppliesCorrectDiscount:

    @pytest.mark.parametrize("order_total,expected_result", [
        (50.00,   50.00),   # Below threshold -- no discount
        (100.00,  100.00),  # Exactly at $100 boundary -- no discount
        (100.01,  90.01),   # Just above $100 -- 10% discount
        (150.00,  135.00),  # Mid-range -- 10% discount
        (200.00,  180.00),  # Exactly at $200 boundary -- 10% discount
        (200.01,  160.01),  # Just above $200 -- 20% discount
        (250.00,  200.00),  # Well above $200 -- 20% discount
        (0.00,    0.00),    # Zero order -- no discount
    ])
    def test_calculates_discounted_total(self, order_total, expected_result):
        calculator = DiscountCalculator()
        result = calculator.calculate_discount(order_total)
        assert result == expected_result, (
            f"Expected {expected_result} for order total {order_total}, got {result}"
        )

    def test_raises_value_error_when_order_total_is_negative(self):
        calculator = DiscountCalculator()
        with pytest.raises(ValueError, match="Order total cannot be negative"):
            calculator.calculate_discount(-10.00)
```

**Run all tests.** 9 passed (8 parameterized + 1 exception test). Execution time: under 100ms.

---

#### Recommended Coverage Threshold for This Module

| Layer | Threshold | Configuration |
|-------|-----------|---------------|
| `src/domain/` (core logic like DiscountCalculator) | 95%+ | `--cov-fail-under=95` in pytest.ini |
| `src/application/` (service orchestration) | 85%+ | Same config file |
| `src/infrastructure/` (DB adapters, HTTP clients) | 65%+ | Lower -- integration tests cover remainder |

**pytest.ini configuration:**

```ini
[pytest]
addopts =
    --cov=src
    --cov-report=term-missing
    --cov-fail-under=90
    -v
testpaths = tests
```

---

#### Next Test to Write

From the test case list, the boundary precision tests (100.01 and 200.01) are now covered via parameterization. The next area to TDD would be:

**"Discount calculator integrates with Order entity"** -- test that `Order.apply_discount()` calls `DiscountCalculator.calculate_discount()` and stores the result. This test will require a stub for `DiscountCalculator` injected via the `Order` constructor, validating the integration without testing discount logic again.
