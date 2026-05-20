---
name: kotlin-testing-patterns
description: |
  Guides expert-level kotlin testing patterns implementation: kotlin and testing decision frameworks, production-ready patterns, and concrete templates for kotlin testing patterns workflows.
  Use when the user asks about kotlin testing patterns, kotlin testing patterns configuration, or kotlin best practices for kotlin projects.
  Do NOT use when the user needs a different languages runtimes capability -- check sibling skills in the languages runtimes subcategory.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "kotlin testing tdd"
  category: "software-engineering"
  subcategory: "languages-runtimes"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Kotlin Testing Patterns

## When to Use

**Use this skill when:**
- The user is building or maintaining a Kotlin project (JVM, Android, Multiplatform) and wants to write better tests -- unit, integration, or end-to-end
- The user asks about test organization, naming conventions, coroutine testing, or Kotlin-specific DSL patterns for tests
- The user wants to apply TDD in Kotlin and needs guidance on how to structure test-first workflows with Kotlin idioms
- The user is migrating a Java test suite to Kotlin and wants to modernize patterns (JUnit 4 → JUnit 5 + Kotlin extensions, Mockito → MockK)
- The user wants to reduce test brittleness, improve test readability, or reduce boilerplate in existing Kotlin tests
- The user needs concrete guidance on testing coroutines, `Flow`, `StateFlow`, or `SharedFlow`
- The user is setting up a Kotlin Multiplatform project and needs to understand how to share test logic across platforms
- The user wants to implement property-based testing in Kotlin using Kotest or kotlinx-fuzzer

**Do NOT use this skill when:**
- The user is asking about Android UI testing with Espresso or Compose -- check the Android UI testing skill in the mobile subcategory
- The user needs CI/CD pipeline configuration for running Kotlin tests -- check the CI/CD pipeline skill
- The user is asking about performance profiling or benchmarking (JMH) -- check the JVM performance skill
- The user needs database migration testing in Spring -- check the Spring Boot testing skill
- The user is asking about contract testing with Pact -- check the contract testing skill
- The user wants general Kotlin language guidance unrelated to testing -- check the Kotlin language fundamentals skill
- The user is asking purely about Gradle or Maven build configuration without a testing angle

---

## Process

### 1. Assess the Project Context

Before recommending any patterns, establish the full testing context:

- **Kotlin target:** Is this JVM-only, Android, or Kotlin Multiplatform (KMP)? KMP requires `commonTest` source sets and limits which assertion libraries are available (Kotest assertions and kotlin.test work; JUnit 5 does not work in native targets).
- **Existing test framework:** Identify whether JUnit 4, JUnit 5, Kotest, or Spek is already in use. Migration cost varies significantly -- JUnit 4 to JUnit 5 is straightforward; Spek is largely abandoned and should be migrated away.
- **Coroutines presence:** Check if `kotlinx.coroutines` is a dependency. If yes, coroutine-specific testing patterns are mandatory, not optional.
- **Mocking requirements:** Identify whether the codebase uses interfaces (MockK works naturally) or final classes (MockK handles this; Mockito requires the `mockito-kotlin` bridge and `mock-maker-inline`).
- **Team size and test coverage baseline:** A team with 0% test coverage needs different patterns than one at 60% trying to reach 80%. Prioritize accordingly.
- **Build system:** Gradle with Kotlin DSL (`build.gradle.kts`) is the standard. Confirm the `testImplementation` dependency scope is used correctly.

### 2. Establish the Test Framework Stack

Choose the test framework stack based on the context assessment, then apply consistently across the project:

- **Recommended default stack (JVM/Android):**
  - Test runner: JUnit 5 (`junit-jupiter`) with `@Test` from `org.junit.jupiter.api`
  - Assertions: Kotest assertions (`kotest-assertions-core`) -- prefer over JUnit 5 built-ins for fluent, readable Kotlin syntax
  - Mocking: MockK (`mockk` 1.13+) -- Kotlin-native, handles `object`, `companion object`, coroutine extensions natively
  - Coroutine testing: `kotlinx-coroutines-test` with `runTest` and `TestCoroutineScheduler`
  - Parameterized: JUnit 5 `@ParameterizedTest` with `@MethodSource` or Kotest data-driven testing

- **Recommended stack for KMP:**
  - Test runner: `kotlin.test` (maps to the correct platform runner automatically)
  - Assertions: `kotlin.test.assertEquals` / Kotest assertions with the `kotest-assertions-core` multiplatform artifact
  - No MockK in native targets -- use interface fakes and test doubles instead

- **Dependency configuration (Gradle Kotlin DSL):**
  ```kotlin
  dependencies {
      testImplementation("io.kotest:kotest-assertions-core:5.8.0")
      testImplementation("io.mockk:mockk:1.13.9")
      testImplementation("org.junit.jupiter:junit-jupiter:5.10.1")
      testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.7.3")
      testRuntimeOnly("org.junit.platform:junit-platform-launcher")
  }
  tasks.test {
      useJUnitPlatform()
  }
  ```

- **Never mix** MockK and Mockito in the same module -- the interaction between `mock-maker-inline` and MockK's agent can cause test ordering failures.

### 3. Define Test Organization and Naming Conventions

Consistent structure is the foundation of a maintainable test suite:

- **Package mirroring:** Place tests in `src/test/kotlin` mirroring the exact package of the class under test. A class `com.example.payments.PaymentProcessor` has its tests in `com.example.payments.PaymentProcessorTest`.
- **Test class naming:** Use `[ClassUnderTest]Test` for unit tests. Use `[FeatureName]IntegrationTest` for integration tests that require external systems.
- **Test function naming:** Use backtick-quoted function names with natural language: `` `should return zero balance when account is newly created` ``. This is idiomatic Kotlin and produces readable test reports. Limit to 80 characters.
- **Nested classes with `@Nested` (JUnit 5):** Group tests by method or scenario. Each `@Nested` inner class tests one public method or one logical scenario. Nest no more than 2 levels deep.
- **Source set separation:** Keep unit tests in `src/test`, integration tests in `src/integrationTest` (configure a separate Gradle source set), and contract tests in `src/contractTest`. This enables fast unit test feedback loops independent of slower integration tests.
- **Test file size limit:** If a test file exceeds 400 lines, it indicates the class under test has too many responsibilities. Split both the production class and the test file.

### 4. Apply Kotlin-Idiomatic Test Patterns

Kotlin enables several testing patterns that are impossible or verbose in Java. Apply these consistently:

- **Data class test fixtures with factory functions:** Never construct domain objects inline in every test. Create `TestFixtures.kt` files with factory functions that provide sensible defaults and accept only what needs to vary:
  ```kotlin
  fun aUser(
      id: UserId = UserId("test-user-1"),
      email: Email = Email("user@example.com"),
      role: Role = Role.MEMBER
  ): User = User(id = id, email = email, role = role)
  ```
  Call sites become: `aUser(role = Role.ADMIN)` -- readable and minimal.

- **Subject Under Test (SUT) initialization with `lateinit var`:** In JUnit 5, use `@BeforeEach` to construct the SUT fresh for each test. Never use class-level `val` for mutable fakes -- this causes test pollution:
  ```kotlin
  private lateinit var sut: PaymentProcessor
  private val paymentGateway = mockk<PaymentGateway>()

  @BeforeEach
  fun setUp() {
      clearAllMocks()
      sut = PaymentProcessor(paymentGateway)
  }
  ```

- **Kotest assertion extensions over assertEquals:** Prefer `result.shouldBe(expected)`, `list.shouldContainExactly(...)`, `exception.shouldHaveMessage("...")` over JUnit-style assertions. They produce better failure messages and read like specifications.

- **Sealed class exhaustive testing:** When a function returns a sealed class, test every branch. Use `when` expressions in test assertions to enforce exhaustiveness at compile time:
  ```kotlin
  val result = sut.process(payment)
  result.shouldBeInstanceOf<PaymentResult.Success>()
  result as PaymentResult.Success
  result.transactionId.shouldNotBeBlank()
  ```

- **Extension functions for repeated assertion logic:** If the same multi-step assertion appears in 3+ tests, extract it into a local extension function:
  ```kotlin
  private fun PaymentResult.shouldBeSuccessfulWith(amount: Money) {
      this.shouldBeInstanceOf<PaymentResult.Success>()
      (this as PaymentResult.Success).amount shouldBe amount
  }
  ```

- **`@TestInstance(Lifecycle.PER_CLASS)` for expensive setup:** When a test class requires an expensive resource (database connection, Testcontainer), use `PER_CLASS` lifecycle and initialize once in `@BeforeAll`. This reduces test suite runtime significantly for integration tests -- often by 60-80% compared to `PER_METHOD` with container restarts.

### 5. Implement Coroutine Testing Patterns

Coroutine testing is the most common source of flaky or incorrect Kotlin tests. Apply these patterns without exception:

- **Always use `runTest` from `kotlinx-coroutines-test`:** Never use `runBlocking` in tests. `runTest` is coroutine-test-aware, skips virtual time delays, and fails fast on uncaught exceptions. `runBlocking` hides timing bugs and produces slow tests:
  ```kotlin
  @Test
  fun `should emit loading then success`() = runTest {
      val result = sut.fetchUserProfile(userId)
      result shouldBe UserProfile(...)
  }
  ```

- **Testing `Flow` with `turbine`:** Add the `app.cash.turbine:turbine` library. It provides a coroutine-aware Flow testing DSL that eliminates the need for `toList()` hacks or manual `Job` cancellation:
  ```kotlin
  @Test
  fun `should emit three state transitions`() = runTest {
      sut.uiState.test {
          awaitItem().shouldBeInstanceOf<UiState.Loading>()
          awaitItem().shouldBeInstanceOf<UiState.Success>()
          cancelAndIgnoreRemainingEvents()
      }
  }
  ```

- **Virtual time control with `TestCoroutineScheduler`:** Use `advanceTimeBy()` or `advanceUntilIdle()` to control timing without real delays. Tests with `delay(5000)` in production code should still complete in milliseconds:
  ```kotlin
  @Test
  fun `should retry after 3 seconds`() = runTest {
      advanceTimeBy(3_001)
      verify { paymentGateway.retry() }
  }
  ```

- **`MockK` coroutine support:** Use `coEvery`, `coVerify`, and `coAnswers` for suspending functions. Using `every` on a `suspend fun` will compile but fail at runtime:
  ```kotlin
  coEvery { paymentGateway.charge(any()) } returns ChargeResult.Success
  coVerify(exactly = 1) { paymentGateway.charge(payment) }
  ```

- **`StateFlow` and `SharedFlow` testing:** Collect into a `MutableList` within a coroutine launched before the action, then cancel after assertion. Or use Turbine. Never use `stateFlow.value` alone as the assertion -- it misses intermediate emissions.

- **`UnconfinedTestDispatcher` vs `StandardTestDispatcher`:** Use `UnconfinedTestDispatcher` when you want coroutines to run eagerly without explicit `advanceUntilIdle()` calls (simpler tests). Use `StandardTestDispatcher` (default) when you need precise control over coroutine execution order.

### 6. Apply Mocking Strategies with MockK

MockK is the standard mocking library for Kotlin. Use it correctly:

- **Prefer fakes over mocks for value objects and simple collaborators:** If a collaborator has fewer than 3 methods and no side effects, write a hand-crafted fake class. Mocks for simple collaborators create verbose test setup and hide intent.
- **`relaxed = true` for mocks with many methods:** `mockk<Repository>(relaxed = true)` returns default values for all unstubbed calls. Use this when you only care about a subset of interactions. Do NOT use `relaxed = true` when you need strict verification -- it silently swallows unexpected calls.
- **Spy carefully:** `spyk()` wraps a real object. Use it only when you need to partially mock a class and calling the real implementation for some methods is correct. Overuse of spies indicates the design has too many responsibilities in one class.
- **Capture arguments with `CapturingSlot`:** When you need to assert on the argument passed to a mock:
  ```kotlin
  val slot = slot<ChargeRequest>()
  coEvery { gateway.charge(capture(slot)) } returns ChargeResult.Success
  sut.processPayment(order)
  slot.captured.amount shouldBe Money(100, Currency.USD)
  ```
- **Verify interaction counts explicitly:** Use `verify(exactly = 1)`, `verify(exactly = 0)`, or `verify(atLeast = 1)`. Never rely on `verify { ... }` alone without an `exactly` parameter for critical side effects -- it defaults to `atLeast = 1` which misses duplicate call bugs.
- **`verifySequence` for ordered interaction testing:** When the order of calls matters (e.g., log before charge, then notify), use `verifySequence { }` which asserts exact order and exact count together.

### 7. Structure Property-Based and Parameterized Tests

Move beyond example-based tests for business logic with wide input domains:

- **JUnit 5 `@ParameterizedTest` for discrete cases:** Use for boundary values and known equivalence classes. Combine with `@CsvSource` for inline data:
  ```kotlin
  @ParameterizedTest
  @CsvSource(
      "0, ZERO",
      "1, POSITIVE",
      "-1, NEGATIVE",
      "Int.MAX_VALUE, POSITIVE"
  )
  fun `should classify amounts correctly`(amount: Int, expected: Classification) {
      classify(amount) shouldBe Classification.valueOf(expected)
  }
  ```
- **Kotest property testing for wide domains:** Use `checkAll` from `kotest-property` to generate hundreds of random inputs. Define `Arb` generators for domain types:
  ```kotlin
  @Test
  fun `amount should never exceed balance after deduction`() = runTest {
      checkAll(Arb.positiveInt(), Arb.positiveInt()) { balance, deduction ->
          whenever(deduction <= balance) {
              val result = account.deduct(balance, deduction)
              result.remaining shouldBeGreaterThanOrEqualTo 0
          }
      }
  }
  ```
- **Shrinking:** Kotest property testing includes automatic shrinking -- when a property fails, it finds the smallest failing input. This is critically valuable for debugging. Do not disable shrinking unless the domain type is irreducible.
- **Run property tests with a fixed seed in CI:** Set `PropertyTesting.defaultSeed` in your test configuration to make property tests deterministic in CI while still running randomly locally. This prevents flakiness from random input variation.

### 8. Verify and Enforce Test Quality

Tests are code. Apply quality gates:

- **Coverage thresholds:** Configure JaCoCo (JVM) or Kover (Kotlin-native aware alternative) with line coverage >= 80% and branch coverage >= 70% for business logic modules. Exclude generated code, data classes with no logic, and DI configuration classes from coverage reporting.
- **Mutation testing with Pitest:** Run Pitest quarterly on core business logic modules. A mutation score below 60% indicates tests are asserting on the wrong things. Target 75%+ mutation score for payment, authorization, or financial calculation logic.
- **Test execution time budgets:** Unit tests should complete in under 5 seconds for a module with 200 tests. Integration tests should complete in under 60 seconds per module. If a test suite exceeds these thresholds, profile with `--profile` in Gradle to find slow tests.
- **Kover for multiplatform coverage:** JaCoCo does not work with Kotlin/Native. Use the `org.jetbrains.kotlinx.kover` Gradle plugin for KMP projects. Configure it to exclude `*.generated.*` packages.
- **Flaky test detection:** Configure test retry (`maxRetries = 2`) in Gradle's `test` task only as a temporary measure while investigating. A test that passes on retry is always hiding a real problem -- nondeterministic state, shared mutable state, or real timing dependency. Fix within 2 sprints or delete.

---

## Output Format

When responding to a user about Kotlin testing patterns, structure the response as follows:

```
## Kotlin Testing Assessment: [Project/Feature Name]

### Context Summary
- Kotlin target: [JVM | Android | KMP]
- Test framework: [Current] → [Recommended if different]
- Coroutines: [Yes | No]
- Coverage baseline: [X%]
- Primary gap: [What is missing or broken]

### Framework Stack Decision

| Concern             | Chosen Tool              | Rationale                                      |
|---------------------|--------------------------|------------------------------------------------|
| Test runner         | JUnit 5 / kotlin.test    | [reason]                                       |
| Assertions          | Kotest assertions         | Fluent Kotlin DSL, better failure messages     |
| Mocking             | MockK                    | Kotlin-native, coroutine support built-in      |
| Coroutine testing   | kotlinx-coroutines-test  | runTest, virtual time, TestDispatcher          |
| Flow testing        | Turbine                  | Eliminates manual collection boilerplate       |
| Property testing    | Kotest property          | [if applicable]                                |

### Test Organization Structure
src/
  test/kotlin/
    com/example/[module]/
      [ClassName]Test.kt          -- unit tests, one class per production class
      fixtures/
        [Domain]Fixtures.kt       -- factory functions for test data
  integrationTest/kotlin/
    com/example/[module]/
      [Feature]IntegrationTest.kt -- requires external systems

### Pattern Templates

#### [Pattern 1: e.g., Unit Test with MockK and Kotest]
[Full code example]

#### [Pattern 2: e.g., Coroutine + Flow test with Turbine]
[Full code example]

#### [Pattern 3: e.g., Property-based test]
[Full code example, if applicable]

### Dependency Configuration (build.gradle.kts)
[Exact dependency block]

### Quality Gates
- Line coverage target: [X]%
- Branch coverage target: [X]%
- Mutation score target: [X]% (for [module])
- Max unit test suite runtime: [X] seconds
- Integration test timeout: [X] seconds per test

### Action Plan
1. [Immediate -- next 1-2 days]
2. [Short term -- next sprint]
3. [Medium term -- next quarter]
```

---

## Rules

1. **NEVER use `runBlocking` in tests.** It masks timing bugs and produces slow tests. `runTest` from `kotlinx-coroutines-test` is always the correct choice for suspending test bodies. This is the single most common Kotlin testing mistake.

2. **NEVER stub with `every` on a `suspend fun`.** MockK requires `coEvery` for suspending functions. Using `every` compiles but throws `MockKException` at runtime in most configurations, wasting debugging time.

3. **NEVER share mutable mock state between tests without calling `clearAllMocks()` or `clearMocks()` in `@BeforeEach`.** MockK stubs accumulate across test instances when `@TestInstance(PER_CLASS)` is used. Uncleaned mocks cause test ordering dependencies -- tests pass individually but fail in suite.

4. **NEVER use `Thread.sleep()` in tests.** In coroutine tests, use `advanceTimeBy()`. In integration tests, use Awaitility (`await().atMost(5, SECONDS).until { ... }`). `Thread.sleep()` makes test suites slow and brittle.

5. **NEVER write a test without at least one assertion on the meaningful outcome.** MockK `verify` blocks do not count as assertions on return values. A test that only verifies a mock was called but does not assert on what the SUT returned or emitted is incomplete.

6. **NEVER test Kotlin `data class` equality with field-by-field manual comparisons.** Data classes provide structural equality for free. Use `result shouldBe expectedDataClassInstance`. Field-by-field checks mask when new fields are added to the data class.

7. **ALWAYS inject test dispatchers via constructor or parameter injection rather than hardcoding `Dispatchers.IO` in production code.** Production classes that hardcode dispatchers cannot be tested with `TestCoroutineScheduler`. Use `CoroutineDispatcher` as a constructor parameter defaulting to `Dispatchers.IO` in production.

8. **ALWAYS name tests as specifications, not as implementations.** `` `should throw PaymentException when card is declined` `` is a specification. `testProcessPaymentCardDeclined` is an implementation name. Specification names survive refactoring; implementation names become stale.

9. **NEVER test private methods directly.** Testing private methods through reflection is a strong signal that the private logic should be extracted to a separate class with its own public interface. Refactor first, then test through the public API.

10. **ALWAYS configure `useJUnitPlatform()` in Gradle `test` task when using JUnit 5.** Without this, JUnit 5 tests compile and appear to pass (0 tests run) because the JUnit 4 runner finds no tests. This is a silent failure mode that has burned many teams.

11. **NEVER use `@Suppress("UNCHECKED_CAST")` to force-cast mock return types.** If a generic return type requires a cast suppression in test code, the production API design has a type safety problem. Fix the production API or use Kotest's `shouldBeInstanceOf<T>()` with smart cast.

12. **ALWAYS separate the Arrange, Act, and Assert phases with blank lines.** The AAA pattern is mandatory for readability. Tests longer than 30 lines without AAA separation are processing too much in one test and should be split.

---

## Edge Cases

### Kotlin Multiplatform Tests with No MockK

MockK does not support Kotlin/Native targets. When writing shared tests in `commonTest`:
- Use hand-written fake implementations of interfaces instead of mocks. This is the correct approach regardless of MockK availability -- it forces better interface design.
- Keep `expect`/`actual` test helpers for platform-specific behavior (e.g., file system access, clock).
- Use `kotlin.test.assertEquals` or Kotest's multiplatform assertions artifact (`kotest-assertions-core` published with KMP targets).
- Separate tests that require platform-specific mocking into `jvmTest` or `androidTest` source sets where MockK works normally.
- Design production code with `interface`-based dependencies rather than concrete class dependencies specifically because it makes KMP testing possible without mocking frameworks.

### Testing Kotlin `object` and `companion object`

MockK can mock Kotlin `object` singletons using `mockkObject()`, but this requires careful teardown:
```kotlin
@BeforeEach fun setUp() { mockkObject(Analytics) }
@AfterEach fun tearDown() { unmockkObject(Analytics) }
```
Forgetting `unmockkObject` causes the mock to persist across tests in the JVM process, creating cross-test contamination that is extremely difficult to debug. Consider this a red flag in design -- if you need to mock a singleton, the singleton should be refactored to a scoped dependency. Use `mockkObject` only as a migration aid on legacy code.

### Testing Classes with Inline Functions and Reified Type Parameters

MockK cannot mock inline functions or intercept reified type calls because they are inlined at the call site. If a collaborator uses `inline reified` functions:
- Wrap the inline call in a non-inline function in the production class so the wrapper can be tested via the SUT.
- Test the inline function's behavior directly with unit tests on the function itself rather than trying to mock it.
- Consider using a fake implementation of the surrounding interface rather than mocking the specific class with inline functions.

### Flaky Tests in Coroutine-Heavy Code

If coroutine tests are intermittently failing:
1. First, check that `runTest` is used everywhere -- a single `runBlocking` in a shared helper can corrupt the test coroutine context.
2. Check for `GlobalScope` usage in production code -- coroutines launched in `GlobalScope` are not controlled by `TestCoroutineScheduler` and execute on real time.
3. Check for dispatcher hardcoding (`Dispatchers.Default` without injection) -- these escape the test dispatcher's control.
4. Use `TestScope.backgroundScope` for coroutines that should outlive the test body but be cancelled before `runTest` completes.
5. Enable `kotlinx.coroutines` debug mode by setting the system property `kotlinx.coroutines.debug=on` in the Gradle `test` task JVM arguments to get detailed coroutine stack traces on failure.

### Legacy Java Tests Being Migrated to Kotlin

When converting a Java/JUnit 4 test suite to Kotlin/JUnit 5:
- Convert test files incrementally, one class at a time. Do not mass-convert with IntelliJ's Java-to-Kotlin converter on test files -- it produces valid Kotlin but does not apply idiomatic Kotlin patterns.
- Replace `@Rule` with JUnit 5 extensions (`@ExtendWith`). The `TemporaryFolder` rule becomes `@TempDir`.
- Replace `@RunWith(MockitoJUnitRunner::class)` with `@ExtendWith(MockKExtension::class)` and replace all Mockito stubs with MockK equivalents.
- Replace `assertEquals(expected, actual)` (JUnit 4 argument order) with Kotest's `actual shouldBe expected`. The argument order swap is a common conversion bug -- Kotest's style eliminates the ambiguity.
- Replace `@Before`/`@After` with `@BeforeEach`/`@AfterEach`. These are not aliases -- the old annotations are from JUnit 4 and will be silently ignored if the JUnit 5 engine is used without JUnit 4 backward compatibility support.

### Testing Kotlin DSL Builders

When production code exposes a DSL (builder pattern with lambda receivers), test both the DSL interface and the resulting built object:
```kotlin
@Test
fun `should build valid report configuration from DSL`() {
    val config = reportConfig {
        title = "Monthly Revenue"
        currency = Currency.USD
        dateRange = DateRange.lastMonth()
    }
    config.title shouldBe "Monthly Revenue"
    config.currency shouldBe Currency.USD
    config.isValid() shouldBe true
}
```
Also test the DSL with missing required fields to confirm it throws `IllegalStateException` with a clear message, not `NullPointerException`. DSL builders that produce invalid state silently are a common source of production bugs.

### High-Volume Integration Test Suites with Testcontainers

When a module has 50+ integration tests all requiring a database container:
- Use a companion object or `object` with `@BeforeAll` (JUnit 5 `PER_CLASS` lifecycle) to share a single container instance across all tests in a class.
- For sharing a container across multiple test classes, use the `Singleton Container` pattern -- a Kotlin `object` that starts the container lazily and registers a JVM shutdown hook for cleanup. This reduces test suite startup time from O(n_classes * startup_time) to O(1 * startup_time).
- Configure Testcontainers with `withReuse(true)` during local development only (controlled by an environment variable). Never enable container reuse in CI -- it causes state leakage between pipeline runs.
- Use `@Transactional` with `Rollback` or truncate tables in `@AfterEach` to ensure test isolation. Never rely on test execution order for database state cleanup.

---

## Example

**Input:** "We have a Kotlin JVM service for processing subscription renewals. The `SubscriptionRenewalService` depends on a `PaymentGateway` (interface) and an `EmailNotifier` (interface). It has a `suspend fun renewSubscription(subscriptionId: String): RenewalResult` that charges the customer and sends a confirmation email. The result is a sealed class with `Success`, `PaymentFailed`, and `AccountSuspended`. We have no tests right now and want to start with this class. We use coroutines throughout."

**Output:**

## Kotlin Testing Assessment: SubscriptionRenewalService

### Context Summary
- Kotlin target: JVM
- Test framework: None currently → JUnit 5 + Kotest assertions + MockK + kotlinx-coroutines-test
- Coroutines: Yes -- `suspend fun` on primary method, coroutine-aware mocking required
- Coverage baseline: 0% → target 85% line, 75% branch for this class
- Primary gap: Zero test coverage on business-critical payment logic with multiple outcome branches

### Framework Stack Decision

| Concern           | Chosen Tool               | Rationale                                                   |
|-------------------|---------------------------|-------------------------------------------------------------|
| Test runner       | JUnit 5                   | Supports `@Nested`, backtick names, lifecycle control       |
| Assertions        | Kotest assertions         | `shouldBe`, `shouldBeInstanceOf` fit sealed class branches  |
| Mocking           | MockK                     | `coEvery`/`coVerify` for suspend functions                  |
| Coroutine testing | kotlinx-coroutines-test   | `runTest` + virtual time, no real delays in tests           |
| Flow testing      | N/A for this class        | No Flow emitted from this method                            |

### Dependency Configuration (build.gradle.kts)

```kotlin
dependencies {
    testImplementation("io.kotest:kotest-assertions-core:5.8.0")
    testImplementation("io.mockk:mockk:1.13.9")
    testImplementation("org.junit.jupiter:junit-jupiter:5.10.1")
    testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.7.3")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
}

tasks.test {
    useJUnitPlatform()
    jvmArgs("-Dkotlinx.coroutines.debug=on")
}
```

### Test Fixtures (src/test/kotlin/com/example/subscriptions/fixtures/SubscriptionFixtures.kt)

```kotlin
package com.example.subscriptions.fixtures

import com.example.subscriptions.Subscription
import com.example.subscriptions.SubscriptionId
import com.example.subscriptions.CustomerId
import com.example.subscriptions.Money
import java.util.Currency

fun aSubscription(
    id: SubscriptionId = SubscriptionId("sub-001"),
    customerId: CustomerId = CustomerId("cust-abc"),
    monthlyAmount: Money = Money(2999, Currency.getInstance("USD")),
    isActive: Boolean = true
): Subscription = Subscription(
    id = id,
    customerId = customerId,
    monthlyAmount = monthlyAmount,
    isActive = isActive
)
```

### Full Test Class (src/test/kotlin/com/example/subscriptions/SubscriptionRenewalServiceTest.kt)

```kotlin
package com.example.subscriptions

import com.example.subscriptions.fixtures.aSubscription
import io.kotest.matchers.shouldBe
import io.kotest.matchers.types.shouldBeInstanceOf
import io.mockk.*
import kotlinx.coroutines.test.runTest
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test

class SubscriptionRenewalServiceTest {

    private val paymentGateway = mockk<PaymentGateway>()
    private val emailNotifier = mockk<EmailNotifier>()
    private lateinit var sut: SubscriptionRenewalService

    @BeforeEach
    fun setUp() {
        clearAllMocks()
        sut = SubscriptionRenewalService(paymentGateway, emailNotifier)
    }

    @Nested
    inner class `when payment succeeds` {

        @Test
        fun `should return Success with transaction ID`() = runTest {
            // Arrange
            val subscription = aSubscription()
            coEvery {
                paymentGateway.charge(subscription.customerId, subscription.monthlyAmount)
            } returns ChargeResult.Approved(transactionId = "txn-999")
            coEvery { emailNotifier.sendRenewalConfirmation(any(), any()) } just Runs

            // Act
            val result = sut.renewSubscription(subscription.id.value)

            // Assert
            result.shouldBeInstanceOf<RenewalResult.Success>()
            (result as RenewalResult.Success).transactionId shouldBe "txn-999"
        }

        @Test
        fun `should send confirmation email after successful charge`() = runTest {
            // Arrange
            val subscription = aSubscription()
            coEvery {
                paymentGateway.charge(subscription.customerId, subscription.monthlyAmount)
            } returns ChargeResult.Approved(transactionId = "txn-999")
            coEvery { emailNotifier.sendRenewalConfirmation(any(), any()) } just Runs

            // Act
            sut.renewSubscription(subscription.id.value)

            // Assert
            coVerify(exactly = 1) {
                emailNotifier.sendRenewalConfirmation(subscription.customerId, "txn-999")
            }
        }

        @Test
        fun `should NOT send email before charge completes`() = runTest {
            // Arrange
            val subscription = aSubscription()
            coEvery {
                paymentGateway.charge(subscription.customerId, subscription.monthlyAmount)
            } returns ChargeResult.Approved(transactionId = "txn-999")
            coEvery { emailNotifier.sendRenewalConfirmation(any(), any()) } just Runs

            // Act
            sut.renewSubscription(subscription.id.value)

            // Assert -- order: charge THEN email, never reversed
            coVerifySequence {
                paymentGateway.charge(subscription.customerId, subscription.monthlyAmount)
                emailNotifier.sendRenewalConfirmation(subscription.customerId, "txn-999")
            }
        }
    }

    @Nested
    inner class `when payment is declined` {

        @Test
        fun `should return PaymentFailed with decline reason`() = runTest {
            // Arrange
            val subscription = aSubscription()
            coEvery {
                paymentGateway.charge(subscription.customerId, subscription.monthlyAmount)
            } returns ChargeResult.Declined(reason = "Insufficient funds")

            // Act
            val result = sut.renewSubscription(subscription.id.value)

            // Assert
            result.shouldBeInstanceOf<RenewalResult.PaymentFailed>()
            (result as RenewalResult.PaymentFailed).reason shouldBe "Insufficient funds"
        }

        @Test
        fun `should NOT send email when payment is declined`() = runTest {
            // Arrange
            val subscription = aSubscription()
            coEvery {
                paymentGateway.charge(subscription.customerId, subscription.monthlyAmount)
            } returns ChargeResult.Declined(reason = "Card expired")

            // Act
            sut.renewSubscription(subscription.id.value)

            // Assert
            coVerify(exactly = 0) { emailNotifier.sendRenewalConfirmation(any(), any()) }
        }
    }

    @Nested
    inner class `when account is suspended` {

        @Test
        fun `should return AccountSuspended without attempting charge`() = runTest {
            // Arrange -- subscription marked inactive represents suspended account
            val suspended = aSubscription(isActive = false)

            // Act
            val result = sut.renewSubscription(suspended.id.value)

            // Assert
            result.shouldBeInstanceOf<RenewalResult.AccountSuspended>()
            coVerify(exactly = 0) { paymentGateway.charge(any(), any()) }
        }
    }

    @Nested
    inner class `when payment gateway throws exception` {

        @Test
        fun `should propagate PaymentGatewayException without sending email`() = runTest {
            // Arrange
            val subscription = aSubscription()
            coEvery {
                paymentGateway.charge(any(), any())
            } throws PaymentGatewayException("Gateway timeout")

            // Act + Assert
            val exception = runCatching {
                sut.renewSubscription(subscription.id.value)
            }.exceptionOrNull()

            exception.shouldBeInstanceOf<PaymentGatewayException>()
            coVerify(exactly = 0) { emailNotifier.sendRenewalConfirmation(any(), any()) }
        }
    }
}
```

### Quality Gates

- Line coverage target: 90% (payment logic is zero-tolerance for untested paths)
- Branch coverage target: 80% (all three sealed class branches must be covered)
- Mutation score target: 75% for this module (run Pitest monthly)
- Max unit test suite runtime: 500ms for this class (all tests use virtual time)
- Integration test timeout: 30 seconds per test when a real gateway sandbox is used

### Action Plan

1. **Immediate (Day 1):** Add dependencies, create `SubscriptionRenewalServiceTest.kt` with the tests above, confirm all pass with `./gradlew test`. Fix any dispatcher injection issues found during implementation.
2. **Short term (Sprint 1):** Apply the same patterns to the 3 other service classes in the subscriptions module. Create the `fixtures/` package with shared test data factories. Configure JaCoCo with 80% line coverage enforcement on the `subscriptions` module to prevent regression.
3. **Medium term (Month 2):** Add property-based tests for the `MoneyCalculator` used internally by `SubscriptionRenewalService` to validate no rounding errors occur across 1000+ generated currency amounts. Set up the `integrationTest` source set for testing against the real payment gateway sandbox.
