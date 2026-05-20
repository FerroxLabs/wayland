---
name: unit-testing-patterns
description: |
  Guides expert-level unit testing patterns implementation: tdd and best-practices decision frameworks, production-ready patterns, and concrete templates for unit testing patterns workflows.
  Use when the user asks about unit testing patterns, unit testing patterns configuration, or testing best practices for unit projects.
  Do NOT use when the user needs a different testing quality capability -- check sibling skills in the testing quality subcategory.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "testing tdd best-practices"
  category: "testing-quality"
  subcategory: "testing-quality"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Unit Testing Patterns

## When to Use

**Use this skill when:**
- User asks how to structure unit tests for a specific module, class, or function and wants guidance beyond "write tests"
- User wants to apply TDD (Test-Driven Development) to a new feature and needs a concrete red-green-refactor workflow
- User is experiencing brittle tests that break frequently on refactoring and wants to understand patterns like the Humble Object or Test Data Builder
- User wants to improve test isolation and is confused about when to use mocks, stubs, fakes, or spies
- User is building a test suite from scratch and needs coverage strategy, naming conventions, and file organization
- User has low test coverage on legacy code and wants a safe approach to adding tests incrementally
- User is asking about specific patterns like AAA (Arrange-Act-Assert), parameterized tests, property-based testing, or test fixtures
- User wants to understand how to test side effects, async code, time-dependent logic, or randomness deterministically

**Do NOT use this skill when:**
- User needs integration testing patterns -- those test multiple real components together and have different isolation rules
- User needs end-to-end or UI testing guidance (Playwright, Cypress, Selenium workflows) -- fundamentally different tooling and scope
- User is asking about test infrastructure (CI/CD pipeline setup, test parallelization at the infrastructure level, container-based test environments)
- User needs load or performance testing patterns -- different tools (k6, Locust, JMeter) and entirely different measurement goals
- User is asking about mutation testing tooling setup (Stryker, Pitest) rather than the underlying unit test patterns those tools verify
- User needs contract testing patterns (Pact, Spring Cloud Contract) -- a specialized category for service boundary testing

---

## Process

### 1. Identify the Testing Scenario and Current Pain Point

Before recommending any pattern, establish what the user is actually trying to solve:

- **Greenfield vs. legacy:** New code allows TDD from the start; legacy code requires characterization tests before refactoring
- **What layer is under test:** Pure functions, stateful classes, I/O-coupled modules, and async workflows each have different isolation strategies
- **Current test quality signals:** Ask whether tests are slow (>100ms per unit test is a red flag), brittle (break on internal refactors), or provide low confidence (pass but bugs ship anyway)
- **Language and ecosystem:** Testing idioms differ substantially -- pytest fixtures vs. JUnit lifecycle annotations vs. Jest module mocking differ in capability and convention
- **Team's existing patterns:** Identify whether tests are already using AAA, what assertion libraries are in use (assertj, hamcrest, chai, should.js), and what mock frameworks exist

### 2. Select the Right Test Double Strategy

Test doubles are the most misunderstood concept in unit testing. Classify dependencies precisely:

- **Stub:** Returns canned data; no behavior verification. Use for query dependencies (database reads, API responses, config values). A stub for a `UserRepository.findById()` returns a hardcoded `User` object.
- **Mock:** Verifies that a specific call was made with specific arguments. Use for command dependencies (sending email, writing to a queue, calling a payment gateway). Overuse of mocks couples tests to implementation details -- limit mock verification to boundary calls.
- **Fake:** A lightweight working implementation (in-memory database, fake message bus). Prefer fakes over mocks when the collaborator has complex behavior that stubs cannot capture realistically. SQLite in-memory or an in-memory `HashMap`-backed repository are canonical fakes.
- **Spy:** Wraps a real object and records calls. Use sparingly -- usually signals the System Under Test (SUT) has too many responsibilities.
- **Dummy:** A placeholder passed but never used. Use for required constructor arguments that are irrelevant to the test scenario.

Decision rule: **use the simplest double that makes the test honest.** Prefer fakes over mocks, prefer stubs over fakes, prefer no double over stubs when the real collaborator is fast and deterministic (e.g., a pure utility class).

### 3. Apply the Appropriate Structural Pattern

Match the test structure to the scenario:

- **AAA (Arrange-Act-Assert):** The baseline for all unit tests. Every test has one `act` call. If you need two `act` calls, you have two tests.
  - Arrange: construct the SUT and all collaborators; set stub return values
  - Act: invoke exactly one method or function
  - Assert: verify exactly one logical outcome (may be multiple assertions about the same outcome)
  - Separate each phase with a blank line; label them with comments (`// Arrange`) in complex tests

- **Given-When-Then (BDD-style):** Semantically equivalent to AAA but emphasizes behavior specification. Use when tests are also serving as living documentation for non-technical stakeholders.

- **Four-Phase Test (Gerard Meszaros):** Arrange-Act-Assert-Teardown. Explicit teardown is required when tests allocate file handles, sockets, or database transactions that must be released. Most modern test runners handle this via `afterEach` hooks.

- **Parameterized Tests:** Use when the same behavior must hold for multiple input/output pairs. Threshold: if you copy-paste the same test body 3+ times changing only literals, convert to parameterized. In JUnit 5: `@ParameterizedTest` with `@CsvSource`. In pytest: `@pytest.mark.parametrize`. In Jest: `test.each`. Keep parameter tables readable -- no more than 8-10 rows before extracting to a file.

- **Property-Based Testing:** Use when the domain has mathematical invariants that hold for all valid inputs rather than specific examples. Canonical invariants: `sort(sort(list)) == sort(list)`, `parse(serialize(x)) == x`, `reverse(reverse(list)) == list`. Tools: Hypothesis (Python), fast-check (JavaScript/TypeScript), jqwik (Java), QuickCheck (Haskell, Erlang). Start with 100 generated examples (default); increase to 500+ for critical financial or security logic.

- **Characterization Tests (Golden Master):** For legacy code with no existing tests, capture the current output (even if buggy) and assert it doesn't change. This creates a safety net for refactoring. Delete and replace with proper tests once the code is understood and cleaned up.

### 4. Apply Naming and Organization Conventions

Test names are the primary documentation of system behavior. Use them accordingly:

- **Naming formula:** `[MethodOrScenario]_[Condition]_[ExpectedResult]` or BDD-style `[given context] [when action] [then outcome]`
  - Good: `calculateTax_whenIncomeExceedsThreshold_appliesHigherRate`
  - Good: `given_expired_token_when_authenticate_then_throws_UnauthorizedException`
  - Bad: `testCalculateTax`, `test1`, `shouldWork`
- **One test class per production class** is the baseline rule. Deviation is acceptable for complex classes with multiple distinct behaviors -- split into `[ClassName]HappyPathTest`, `[ClassName]ErrorHandlingTest`
- **File co-location vs. parallel directory:** Co-location (test file next to source file) works well for JavaScript/TypeScript projects. Parallel `src/test` mirroring the `src/main` tree is standard for Java and Python. Never mix conventions in the same project.
- **Test class organization:** Group tests by the method under test using nested classes (JUnit 5 `@Nested`, pytest classes, describe blocks in Jest). Within each group, order: happy path first, boundary conditions second, error conditions third.

### 5. Design for Testability at the Source

Tests reveal design problems. If a test is hard to write, the production code is usually poorly designed:

- **Constructor injection over service locator:** Dependencies should be passed in, not fetched from a global registry. This makes test doubles trivial to inject.
- **Single Responsibility:** A class with 15 methods is hard to test because it has too many reasons to change. Aim for fewer than 7 public methods on a class before reconsidering the design.
- **Avoid `new` inside methods:** `new EmailService()` inside a business logic method makes it impossible to substitute a test double. Extract to a factory, inject via constructor, or use dependency injection.
- **Pure functions where possible:** A function that takes inputs and returns outputs with no side effects requires no test doubles and has trivially simple tests. Push I/O to the edges of the system.
- **Humble Object pattern:** For classes that are inherently hard to test (UI controllers, event handlers, database adapters), split them into a thin "humble" wrapper that handles I/O and a testable logic object that handles decisions. Test the logic object exhaustively; test the humble object minimally.
- **Seam insertion:** In legacy code without constructor injection, identify "seams" where behavior can be changed without editing the code (subclass-and-override, extract-and-override via `protected` virtual methods, link-time seams via module boundaries).

### 6. Establish Coverage Strategy and Thresholds

Coverage is a tool, not a goal. Use it correctly:

- **Line/statement coverage** is the weakest metric. 100% line coverage can miss all boundary conditions.
- **Branch coverage** is significantly stronger. A threshold of 80% branch coverage is a reasonable minimum for production business logic.
- **Mutation coverage** (measured by Stryker, Pitest, mutmut) is the gold standard. A mutation score above 70% means tests actually catch logical errors, not just execute code. Mutation testing is slow -- run it nightly on CI, not on every commit.
- **Critical path coverage:** Core business logic (pricing engines, authorization checks, financial calculations) should target 90%+ branch coverage and 80%+ mutation score. Infrastructure glue code (HTTP adapters, serializers) is better covered by integration tests -- do not inflate unit test counts here.
- **Coverage exemptions:** Mark generated code, framework boilerplate, and intentionally trivial getters/setters with coverage ignore annotations (`// istanbul ignore next`, `@CoverageIgnore`, `# pragma: no cover`). Never ignore untested logic.
- **The 1:1:1 heuristic:** One assert per test is an aspiration, not a law. Prefer testing one logical outcome. Three assertions about the same object state (checking `user.name`, `user.email`, `user.role` after creation) is fine -- these are asserting one behavior. Three assertions about three different behaviors is three tests.

### 7. Handle Special Testing Scenarios

Address common non-trivial scenarios with specific techniques:

- **Time-dependent logic:** Never call `Date.now()`, `LocalDateTime.now()`, or `time.time()` directly in production code under test. Inject a `Clock` abstraction (Java `java.time.Clock`, custom `ISystemClock` interface) that can be replaced with a fixed-time fake in tests. For JavaScript, use Jest's `jest.useFakeTimers()` or inject a `getNow: () => Date` function.
- **Randomness:** Inject a seeded random number generator or a `RandomProvider` interface. Tests become deterministic by passing a fixed seed.
- **Async code:** Test async logic synchronously where possible by using fakes that resolve immediately. When you must test async: in pytest use `pytest-asyncio`, in Jest use `async/await` in test bodies and `jest.runAllTimers()` for timer-based logic, in JUnit 5 use `CompletableFuture.get()` with an explicit timeout assertion.
- **Filesystem and I/O:** Use an in-memory filesystem abstraction (jimfs for Java, pyfakefs for Python, memfs for Node) rather than hitting the real disk. This keeps tests fast and portable.
- **Event-driven code:** Test command handlers and event processors by invoking them directly with constructed events. Assert on the outgoing events or state changes. Do not test through a real message bus in unit tests.
- **External HTTP APIs:** Use an HTTP-level stub (WireMock for JVM, responses library for Python, nock for Node) when the HTTP client itself is part of what you're testing. Use a fake client interface when you're testing the business logic that calls the client.

### 8. Establish the Test Feedback Loop and CI Integration

A test suite that takes 10 minutes to run will not be run. Speed is a first-class quality attribute:

- **Unit tests must complete in under 2 seconds per test file and under 30 seconds for the entire unit suite** on developer hardware. Anything slower will be skipped locally.
- **Separate test suites by speed:** Tag tests as `@Tag("unit")` vs `@Tag("integration")` in JUnit, use pytest marks (`@pytest.mark.unit`), or use Jest `--testPathPattern`. Run unit tests on every save in watch mode; run integration tests only on pre-push hook or CI.
- **Test ordering independence:** Tests must pass in any order. Use `--randomize` in pytest, `--randomSeed` in Jest, or `@TestMethodOrder(Random.class)` in JUnit to detect order dependencies. Fix any that appear.
- **Flaky test quarantine:** A flaky test that fails intermittently is worse than no test -- it erodes team trust in the entire suite. Tag flaky tests with `@Flaky`, move them to a quarantine suite, file a ticket, and fix within the sprint or delete.
- **Fail fast configuration:** Configure test runners to stop after the first failure in local development (`--failfast` in pytest, `--bail` in Jest). In CI, report all failures for better signal.

---

## Output Format

When delivering unit testing guidance, structure the response as follows:

```
## Unit Testing Analysis: [Module/Class/Feature Name]

### Scenario Classification
- Layer under test: [Pure function | Stateful class | I/O adapter | Async handler]
- Dependency profile: [List key collaborators and their double type]
- Recommended structural pattern: [AAA | Parameterized | Property-based | Characterization]

### Test Double Strategy
| Collaborator          | Double Type | Justification                          |
|-----------------------|-------------|----------------------------------------|
| [CollaboratorName]    | Stub/Fake   | [Why this type was chosen]             |
| [CollaboratorName]    | Mock        | [Command boundary -- verify call made] |

### Naming Convention
- Pattern: [formula being used]
- Example test names for this module:
  - [ConcreteTestName1]
  - [ConcreteTestName2]
  - [ConcreteTestName3]

### Test Structure Template
```[language]
describe('[ClassName or function name]', () => {
  // or class TestClassName:

  describe('[method name]', () => {

    it('[given condition] [when action] [then outcome]', () => {
      // Arrange
      const [dependency] = createStub[Dependency]({ returnValue: [value] });
      const sut = new [ClassName]([dependency]);

      // Act
      const result = sut.[method]([input]);

      // Assert
      expect(result).[assertion];
    });

  });
});
```

### Coverage Targets
- Minimum branch coverage: [%]
- Critical paths requiring 90%+ coverage: [list]
- Mutation testing priority: [High | Medium | Low] -- [reason]

### Edge Cases Requiring Tests
1. [Specific boundary condition]
2. [Specific error condition]
3. [Specific null/empty/zero input]

### Design Feedback (Testability Issues Found)
- [Any identified design problems making this hard to test]
- [Recommended refactoring to improve testability]
```

---

## Rules

1. **NEVER use `new` to construct collaborators inside a test** -- always inject pre-constructed doubles or real objects. Tests that construct their own collaborators cannot control behavior and produce brittle, unpredictable results.

2. **NEVER assert on implementation details** -- only assert on observable output and state. If a refactor that preserves behavior breaks a test, the test was asserting the wrong thing. Avoid asserting that private methods were called; assert that the public result is correct.

3. **NEVER share mutable state between tests** -- each test must construct its own SUT and doubles. Shared state causes order-dependent test failures that are extremely difficult to diagnose. Use `beforeEach` for construction, never `beforeAll` for stateful objects.

4. **NEVER write a test that cannot fail** -- a test that always passes regardless of production code changes is worse than no test (it provides false confidence). After writing a test, temporarily break the production code to confirm the test catches it (this is the "red" in red-green-refactor).

5. **NEVER mock types you don't own** -- mocking third-party library interfaces (e.g., mocking `axios` response objects directly) couples tests to that library's internal structure. Wrap third-party libraries in your own interface and mock that wrapper instead. Your wrapper gets a thin integration test.

6. **ALWAYS test behavior, not state transitions** -- frame tests around "what does this do for a consumer" not "what internal state changes". A test for `OrderService.placeOrder()` should verify the order confirmation is returned and the inventory was reserved, not that an internal `status` field changed from `PENDING` to `CONFIRMED`.

7. **ALWAYS use the Test Data Builder pattern for complex domain objects** -- constructing `new User("John", "Doe", "john@example.com", "ACTIVE", LocalDate.of(1990,1,1), ...)` in every test creates massive duplication and brittleness when constructors change. Create a builder or factory method `UserBuilder.aUser().withEmail("john@example.com").build()` with sensible defaults.

8. **NEVER allow tests to communicate through the filesystem, database, or network in a unit test** -- any test that hits real I/O is an integration test and belongs in a separate suite with different runtime expectations. Use fakes or in-memory implementations.

9. **NEVER ignore test failures by commenting them out** -- a commented-out test is dead code that decays. If a test is wrong, delete it and explain why in a commit message. If the production code is wrong, fix it. If the test is flaky, quarantine it with a tracking ticket, never suppress it silently.

10. **ALWAYS apply the FIRST principles to unit tests:** Fast (< 100ms each), Independent (no ordering dependencies), Repeatable (same result on every machine, every time), Self-validating (binary pass/fail, no manual inspection), Timely (written just before or just after the code, not months later). A test suite violating FIRST is a liability, not an asset.

---

## Edge Cases

### Legacy Code With No Tests and No Dependency Injection

When a codebase has zero tests and classes use `new SomeDependency()` internally with no injection points:

- **Do not refactor before adding tests** -- you will introduce bugs with no safety net
- Apply the **Characterization Test** approach: call the existing code with representative inputs, capture the actual output (including any bugs), and assert that exact output. This locks behavior.
- Use **subclass-and-override seams** for OOP languages: create a test-only subclass that overrides `protected` factory methods to return fakes instead of real dependencies
- Use **extract-and-override** progressively: extract the `new SomeDependency()` call into a `protected` virtual/overridable factory method, then override it in a test subclass
- For static method calls (a common seam problem in Java/C#), use **link seams** via dependency inversion -- introduce an interface, inject it, and the static call becomes a default implementation
- Aim to add 5-10 characterization tests before any refactoring. Each refactoring step should keep all characterization tests green.

### Testing Code With Non-Deterministic External Time

When business logic depends on the current time (subscription expiry, session timeouts, SLA calculations, rate limiting):

- Introduce a `Clock` or `TimeProvider` abstraction immediately -- this is non-negotiable for testable time-dependent logic
- In Java: inject `java.time.Clock`; `Clock.fixed(Instant.parse("2024-03-15T10:00:00Z"), ZoneOffset.UTC)` creates a deterministic test clock
- In Python: use `freezegun` library (`@freeze_time("2024-03-15")`) or inject a `datetime_provider` callable
- In JavaScript/TypeScript: `jest.useFakeTimers({ now: new Date('2024-03-15T10:00:00Z') })` or inject a `getNow: () => Date` function
- **Test boundary conditions at the exact millisecond** -- test that a session expires at exactly T+30 minutes, not just "sometime after T"
- Test leap year dates, DST transition dates, and year boundary dates (December 31 to January 1) -- these are high-probability bug locations

### Deeply Nested or Highly Coupled Classes (God Objects)

When the SUT has 20+ methods and touches 8+ collaborators:

- This is a design problem, not a testing problem -- the test is revealing the issue
- Do not attempt to write comprehensive unit tests for a God Object as-is -- the combinatorial explosion of states makes it impossible
- Apply the **Strangler Fig** pattern: identify cohesive clusters of methods that belong together, extract them into new focused classes with proper injection, test each new class independently
- While the God Object exists, write **characterization tests** at the module boundary rather than trying to unit test internally
- Use **Extract Method** refactorings to create pure functions within the class that can be tested statically or by moving them to helper classes
- Measure progress by tracking the number of dependencies the God Object holds -- reduce from 8 to 4 to 2 over successive iterations

### Async and Concurrent Code

Unit testing async code correctly is one of the most common sources of false-positive tests:

- **In JavaScript/TypeScript with Jest:** always `return` or `await` promises in tests. A test that forgets `await` will pass even when the assertion fails because the test completes before the assertion runs. Enable `asyncio_mode = "auto"` in pytest to avoid the same issue in Python.
- **Test promise rejection explicitly:** assert that a rejected promise produces the correct error, not just that it rejects. `await expect(sut.fetch()).rejects.toThrow(NetworkError)`
- **For concurrent code (threads, goroutines, actors):** unit test the logic without concurrency first. Extract the decision logic into a pure function, test it synchronously with all relevant interleavings as explicit test cases. The concurrency coordination (mutexes, channels) gets a focused concurrency test.
- **Never use `Thread.sleep()` or `asyncio.sleep()` in unit tests** -- this causes slow, flaky tests. Use fake timers or redesign the production code to accept a clock injection.
- **For RxJS/reactive streams:** use `TestScheduler` for marble testing. For other reactive frameworks, use cold observables with deterministic emission sequences.

### Parameterized Tests With Complex Input Domains

When the input space is large and example-based parameterized tests feel insufficient:

- Switch to **property-based testing** when you can express an invariant that must hold for all valid inputs. Examples of invariants: any valid email parsed by your `EmailAddress` value object must survive serialization round-trip; any negative number passed to `calculatePenalty` must return a non-negative penalty; any sorted list passed to `findMedian` must return a value within the min-max range.
- Use **equivalence class partitioning** to structure parameterized test cases: identify ranges of inputs that should behave identically and pick one representative from each class. For a discount calculation: 0 items (empty), 1 item (minimum), 2-9 items (standard), 10-99 items (bulk), 100+ items (enterprise). Test each boundary.
- **Boundary Value Analysis:** always test N-1, N, and N+1 at every threshold. If free shipping applies at $50, test $49.99, $50.00, and $50.01.
- Keep parameterized test tables human-readable. If a row requires a comment to understand, extract that case into a named individual test. Test tables with cryptic numeric columns are maintenance liabilities.

### Testing Error Handling and Exception Paths

Error handling is the most undertested area in most codebases:

- Every `catch` block, every conditional error return, and every validation rejection must have at least one test. If you can see an `if (error)` branch with no corresponding test, that branch is untested.
- **Test that the right error type is thrown** (not just that something is thrown), with the right message content or error code. Asserting `expect(fn).toThrow()` without specifying the type catches any exception including bugs from completely different causes.
- **Test error propagation:** if `UserService.createUser()` wraps a `RepositoryException` in a `UserCreationException`, test that the wrapping preserves the original cause and that the caller receives the domain-level exception, not the infrastructure exception.
- **Test recovery behavior:** if the SUT retries on transient errors, verify the retry count, backoff interval (using fake time), and that it stops retrying after the maximum attempt threshold.
- **Don't rely on `@Test(expected = SomeException.class)`** (JUnit 4 style) -- it will pass even if the exception is thrown in the wrong part of the test (e.g., in the Arrange phase). Always use `assertThrows()` wrapping only the Act call.

### Testing Value Objects and Domain Primitives

Value objects (Email, Money, PhoneNumber, DateRange) are high-value candidates for exhaustive unit testing:

- Test equality semantics explicitly: two value objects with the same value must be equal (`equals()` / `__eq__` / `==`), regardless of reference identity
- Test immutability: operations like `money.add(otherMoney)` must return a new object and leave the original unchanged
- Test all validation rules in the constructor or factory method: invalid inputs must fail loudly (throw, return error) rather than creating an object in an invalid state
- Test the full set of invalid inputs: `null`, empty string, whitespace-only, too long, wrong format, correct format but semantically invalid (e.g., `DateRange` where `end < start`)
- Test string representation (`toString()`, `serialize()`), which is often the output tested in integration scenarios

---

## Example

**Input:** "I'm building an `OrderPricingService` in TypeScript. It takes a cart of items, a customer tier (standard/premium/enterprise), and a coupon code. It calculates the total price with applicable discounts. How should I structure the unit tests?"

**Output:**

## Unit Testing Analysis: OrderPricingService

### Scenario Classification
- **Layer under test:** Stateful class with pure computational logic -- this is ideal for unit testing with no I/O involved
- **Dependency profile:**
  - `CouponRepository` (fetches coupon details by code) -- needs a stub
  - `DiscountRuleEngine` (applies tier-based rules) -- use a fake or real implementation if it's a pure function class
  - `TaxCalculator` (applies regional tax) -- stub with configurable return
- **Recommended structural pattern:** AAA for happy path and error cases; Parameterized for discount tier combinations; Property-based for price invariants

### Test Double Strategy

| Collaborator          | Double Type | Justification                                              |
|-----------------------|-------------|-------------------------------------------------------------|
| `CouponRepository`    | Stub        | Query dependency -- returns coupon data, no side effects    |
| `DiscountRuleEngine`  | Real/Fake   | Pure computation class -- use the real one if it has no I/O |
| `TaxCalculator`       | Stub        | External rate lookup -- deterministic fake return           |
| `Logger`              | Dummy       | Required by constructor but irrelevant to pricing tests     |

### Naming Convention
- **Pattern:** `[method]_[given condition]_[expected result]`
- **Example test names:**
  - `calculateTotal_givenStandardCustomerWithNoCoupon_appliesNoDiscount`
  - `calculateTotal_givenPremiumCustomerWithValidCoupon_stacksDiscounts`
  - `calculateTotal_givenExpiredCoupon_throwsCouponExpiredError`
  - `calculateTotal_givenEnterpriseCustomerWithEmptyCart_returnsZero`
  - `calculateTotal_givenCouponExceedingCartValue_capsDiscountAtCartTotal`
  - `calculateTotal_givenNegativeQuantity_throwsInvalidCartError`

### Test Structure

```typescript
// orderPricingService.test.ts

import { OrderPricingService } from './OrderPricingService';
import { Money } from './Money';
import { CartItem } from './CartItem';
import { CustomerTier } from './CustomerTier';

// --- Test Data Builders ---

const aCartItem = (overrides?: Partial<CartItem>): CartItem => ({
  productId: 'prod-001',
  name: 'Widget',
  unitPrice: Money.of(29.99, 'USD'),
  quantity: 1,
  ...overrides,
});

const aCoupon = (overrides?: Partial<Coupon>): Coupon => ({
  code: 'SAVE10',
  type: 'PERCENTAGE',
  value: 10,
  expiresAt: new Date('2099-12-31'),
  minimumOrderValue: Money.of(0, 'USD'),
  ...overrides,
});

const createStubCouponRepository = (coupon?: Coupon | null) => ({
  findByCode: jest.fn().mockResolvedValue(coupon ?? null),
});

const createStubTaxCalculator = (taxRate = 0) => ({
  calculateTax: jest.fn().mockReturnValue(Money.of(0, 'USD').multiply(taxRate)),
});

// --- Tests ---

describe('OrderPricingService', () => {

  describe('calculateTotal', () => {

    describe('customer tier discounts', () => {

      it.each([
        ['standard', 0,    100.00, 100.00],
        ['premium',  0.10, 100.00, 90.00 ],
        ['enterprise', 0.20, 100.00, 80.00],
      ])(
        'given %s customer with no coupon on $%d cart, returns $%d total',
        async (tier, _discountRate, cartValue, expectedTotal) => {
          // Arrange
          const couponRepo = createStubCouponRepository(null);
          const taxCalc = createStubTaxCalculator(0);
          const sut = new OrderPricingService(couponRepo, taxCalc);
          const cart = [aCartItem({ unitPrice: Money.of(cartValue, 'USD') })];

          // Act
          const result = await sut.calculateTotal(cart, tier as CustomerTier, null);

          // Assert
          expect(result.total).toEqual(Money.of(expectedTotal, 'USD'));
        }
      );

    });

    describe('coupon application', () => {

      it('givenValidPercentageCoupon_appliesDiscountAfterTierDiscount', async () => {
        // Arrange
        const coupon = aCoupon({ code: 'VIP20', type: 'PERCENTAGE', value: 20 });
        const couponRepo = createStubCouponRepository(coupon);
        const taxCalc = createStubTaxCalculator(0);
        const sut = new OrderPricingService(couponRepo, taxCalc);
        const cart = [aCartItem({ unitPrice: Money.of(100.00, 'USD') })];

        // Act
        // Premium tier = 10% off -> $90, then VIP20 coupon = 20% off $90 -> $72
        const result = await sut.calculateTotal(cart, 'premium', 'VIP20');

        // Assert
        expect(result.total).toEqual(Money.of(72.00, 'USD'));
        expect(result.discountBreakdown).toContainEqual({
          source: 'tier:premium',
          amount: Money.of(10.00, 'USD'),
        });
        expect(result.discountBreakdown).toContainEqual({
          source: 'coupon:VIP20',
          amount: Money.of(18.00, 'USD'),
        });
      });

      it('givenCouponDiscountExceedsCartTotal_capsDiscountAtCartTotal', async () => {
        // Arrange
        const coupon = aCoupon({ code: 'FREE100', type: 'FIXED', value: 500 });
        const couponRepo = createStubCouponRepository(coupon);
        const sut = new OrderPricingService(couponRepo, createStubTaxCalculator(0));
        const cart = [aCartItem({ unitPrice: Money.of(50.00, 'USD') })];

        // Act
        const result = await sut.calculateTotal(cart, 'standard', 'FREE100');

        // Assert
        expect(result.total).toEqual(Money.of(0.00, 'USD'));
        // Total cannot go negative -- this is the key invariant
        expect(result.total.isNonNegative()).toBe(true);
      });

      it('givenExpiredCoupon_throwsCouponExpiredError', async () => {
        // Arrange
        const expiredCoupon = aCoupon({
          code: 'OLD10',
          expiresAt: new Date('2020-01-01'), // past date
        });
        const couponRepo = createStubCouponRepository(expiredCoupon);
        const sut = new OrderPricingService(couponRepo, createStubTaxCalculator(0));
        const cart = [aCartItem()];

        // Act & Assert
        await expect(
          sut.calculateTotal(cart, 'standard', 'OLD10')
        ).rejects.toThrow(CouponExpiredError);
      });

    });

    describe('cart validation', () => {

      it('givenEmptyCart_returnsZeroTotal', async () => {
        // Arrange
        const sut = new OrderPricingService(
          createStubCouponRepository(null),
          createStubTaxCalculator(0)
        );

        // Act
        const result = await sut.calculateTotal([], 'standard', null);

        // Assert
        expect(result.total).toEqual(Money.of(0.00, 'USD'));
      });

      it('givenItemWithZeroQuantity_throwsInvalidCartError', async () => {
        // Arrange
        const sut = new OrderPricingService(
          createStubCouponRepository(null),
          createStubTaxCalculator(0)
        );
        const cart = [aCartItem({ quantity: 0 })];

        // Act & Assert
        await expect(
          sut.calculateTotal(cart, 'standard', null)
        ).rejects.toThrow(InvalidCartError);
      });

    });

  });

});
```

### Property-Based Test (Invariants)

```typescript
// Using fast-check for property-based testing
import * as fc from 'fast-check';

describe('OrderPricingService -- invariants', () => {

  it('total is always non-negative regardless of discount combination', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.record({
          unitPrice: fc.float({ min: 0.01, max: 9999.99 }),
          quantity: fc.integer({ min: 1, max: 100 }),
        }), { minLength: 1 }),
        fc.constantFrom('standard', 'premium', 'enterprise'),
        async (cartInputs, tier) => {
          const sut = new OrderPricingService(
            createStubCouponRepository(null),
            createStubTaxCalculator(0)
          );
          const cart = cartInputs.map(i =>
            aCartItem({ unitPrice: Money.of(i.unitPrice, 'USD'), quantity: i.quantity })
          );
          const result = await sut.calculateTotal(cart, tier as CustomerTier, null);
          return result.total.isNonNegative();
        }
      ),
      { numRuns: 200 }
    );
  });

  it('enterprise total is always <= premium total <= standard total for same cart', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.record({
          unitPrice: fc.float({ min: 0.01, max: 999.99 }),
          quantity: fc.integer({ min: 1, max: 50 }),
        }), { minLength: 1 }),
        async (cartInputs) => {
          const cart = cartInputs.map(i =>
            aCartItem({ unitPrice: Money.of(i.unitPrice, 'USD'), quantity: i.quantity })
          );
          const sut = new OrderPricingService(
            createStubCouponRepository(null),
            createStubTaxCalculator(0)
          );
          const [standard, premium, enterprise] = await Promise.all([
            sut.calculateTotal(cart, 'standard', null),
            sut.calculateTotal(cart, 'premium', null),
            sut.calculateTotal(cart, 'enterprise', null),
          ]);
          return (
            enterprise.total.lessThanOrEqual(premium.total) &&
            premium.total.lessThanOrEqual(standard.total)
          );
        }
      ),
      { numRuns: 100 }
    );
  });

});
```

### Coverage Targets

- **Minimum branch coverage:** 90% -- this is pricing logic and directly affects revenue
- **Critical paths requiring 90%+ coverage:**
  - Coupon validation and expiry checks
  - Tier discount stacking logic
  - Cart value floor (non-negative total) enforcement
- **Mutation testing priority:** High -- run Stryker against `OrderPricingService.ts` on every release branch. Target mutation score > 80%.

### Edge Cases Requiring Tests

1. Coupon with `minimumOrderValue` that the cart does not meet -- coupon rejected with `CouponMinimumNotMetError`
2. Cart with 1000+ line items -- verify no performance degradation (test runs in < 50ms)
3. Mixed currency items in cart -- service should reject with `CurrencyMismatchError` or normalize (document the decision)
4. Coupon code lookup returns network error -- verify that `CouponRepositoryError` propagates correctly (do not silently swallow)
5. Tax calculation on discounted total vs. pre-discount total -- verify which amount tax is applied to (this is a business rule that must be explicit in a test)

### Design Feedback (Testability Issues Found)

- **If `CouponRepository` is async, ensure `calculateTotal` is consistently awaited.** Mixed sync/async paths in pricing logic are a common source of bugs that only surface under concurrency.
- **`discountBreakdown` must be part of the return type from the start** -- retrofitting audit/breakdown output after the fact requires changing the public API. Include it now since it was caught in testing.
- **The `DiscountRuleEngine` should remain a pure, stateless class** with no constructor dependencies so it can be used directly in tests without any test doubles. If it needs configuration (tax tables, discount percentages), inject those as a plain data object, not as a service.
