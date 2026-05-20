---
name: java-testing-patterns
description: |
  Guides expert-level Java testing: JUnit 5, Mockito, AssertJ, Testcontainers, parameterized tests, and Spring Boot test slices.
  Use when the user asks about Java testing, JUnit 5, Mockito, AssertJ, Testcontainers, parameterized tests, Spring Boot testing.
  Do NOT use when the user asks about Java project setup (use `java-project-setup`), Java Spring patterns (use `java-spring-patterns`), general testing concepts (use `unit-testing-patterns`).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "java testing tdd"
  category: "software-engineering"
  subcategory: "languages-runtimes"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Java Testing Patterns

## When to Use

**Use this skill when:**
- The user asks how to write unit tests for a Java class, method, or service using JUnit 5 annotations and lifecycle hooks
- The user asks how to mock dependencies in Java using Mockito, including argument captors, stubbing, and verification
- The user asks how to write fluent assertions with AssertJ, including soft assertions and custom assertion classes
- The user asks how to test database interactions, message queues, or HTTP APIs using Testcontainers with real infrastructure
- The user asks how to write parameterized tests with `@ParameterizedTest`, `@CsvSource`, `@MethodSource`, or `@EnumSource`
- The user asks how to test Spring Boot applications using test slices like `@WebMvcTest`, `@DataJpaTest`, or `@SpringBootTest`
- The user asks about test isolation, fixture design, shared state management, or test lifecycle management in Java
- The user asks about coverage configuration with JaCoCo, mutation testing with PIT, or organizing test source sets in Maven or Gradle

**Do NOT use this skill when:**
- The user asks about setting up a Java project from scratch -- use `java-project-setup` instead
- The user asks about Spring dependency injection patterns, AOP, or application context configuration outside of testing -- use `java-spring-patterns` instead
- The user asks about general testing theory, TDD philosophy, or testing vocabulary without a Java-specific context -- use `unit-testing-patterns` instead
- The user asks about performance benchmarking in Java -- JMH benchmarks have their own conventions that are out of scope here
- The user asks about contract testing with Pact or consumer-driven contracts -- that requires its own dedicated skill

---

## Process

### 1. Identify the Test Scope and Layer

Before writing any test code, determine the exact type of test being written. Each layer has a different cost, speed, and isolation profile.

- **Unit test:** Tests a single class or method with all external dependencies replaced by mocks or stubs. Runs in milliseconds. No Spring context. No I/O.
- **Integration test:** Wires together 2-5 real collaborators with mocks at the boundary (e.g., real service + real repository but mocked HTTP client). May start a partial Spring context.
- **Slice test:** Uses a Spring Boot test slice annotation to load only the relevant application layer. `@WebMvcTest` loads MVC components only; `@DataJpaTest` loads JPA repositories and an embedded H2 or Testcontainers database only.
- **System / end-to-end test:** Full Spring Boot application context with real infrastructure via Testcontainers. Slow but high-confidence. Reserve for critical paths only.
- Apply the test pyramid: aim for roughly 70% unit, 20% integration/slice, 10% system tests by count.
- Confirm the project uses JUnit 5 (JUnit Jupiter), not JUnit 4. Key indicator: `@Test` is from `org.junit.jupiter.api`, not `org.junit`.

### 2. Configure the Test Infrastructure

Set up the correct test dependencies and ensure the test runner is properly configured before writing any tests.

- In Maven, the `spring-boot-starter-test` dependency transitively provides: JUnit 5, Mockito 5, AssertJ 3, Hamcrest 2, JSONAssert, JsonPath, and Awaitility. Confirm this is present in `pom.xml` with `scope=test`.
- In Gradle, this is `testImplementation 'org.springframework.boot:spring-boot-starter-test'`. Confirm `useJUnitPlatform()` is set in the `test` task block -- without it, JUnit 5 tests silently pass with zero executions.
- Add Testcontainers BOM (`org.testcontainers:testcontainers-bom`) to dependency management to keep module versions aligned. Add `org.testcontainers:junit-jupiter` and the specific module (e.g., `org.testcontainers:postgresql`).
- Add JaCoCo plugin for coverage. Configure minimum line coverage of 80% and branch coverage of 70% as CI gates. Exclude generated code: DTOs produced by MapStruct, Lombok-generated classes, and Spring-generated proxy classes.
- For mutation testing with PIT (pitest-maven-plugin), configure `targetClasses` to include only your own packages, and set `mutationThreshold` to 60% as a starting baseline.
- Enable the Surefire plugin (Maven) or the `test` task (Gradle) to run JUnit 5 platform. Surefire 2.22.0+ supports JUnit 5 natively.

### 3. Design the Test Class Structure

A well-structured test class is as readable as a specification document. Apply these conventions consistently.

- Name the test class `ClassUnderTestTest` for unit tests (e.g., `OrderServiceTest`). For integration tests, use `ClassUnderTestIT` (the IT suffix is picked up by Maven Failsafe automatically).
- Use `@DisplayName` at the class level to describe the system under test: `@DisplayName("OrderService -- business logic for order lifecycle")`.
- Group related tests using `@Nested` inner classes. Each `@Nested` class should represent one distinct scenario cluster: e.g., `class WhenOrderIsEmpty`, `class WhenOrderExceedsInventory`. Apply `@DisplayName` to each nested class.
- Declare the class under test as a field. For classes with no Spring context, instantiate it directly in `@BeforeEach`. Never use `@SpringBootTest` for a class that can be tested without a Spring context -- it adds 3-30 seconds of startup time.
- Use `@BeforeEach` for cheap per-test setup (creating instances, resetting mocks). Use `@BeforeAll` (static) only for genuinely expensive, read-only setup like loading a large fixture file or starting a Testcontainer that is safe to share across all tests in the class.
- Use `@AfterEach` for cleanup only when a test modifies shared state (e.g., a static cache, a file on disk). Prefer designing tests so cleanup is not needed.

### 4. Write Assertions with AssertJ

AssertJ provides a fluent, readable, and type-safe alternative to JUnit's built-in `Assertions`. It produces superior failure messages.

- Always static-import `org.assertj.core.api.Assertions.assertThat` (and `assertThatThrownBy`, `assertThatCode`, `catchThrowableOfType`).
- Chain assertions: `assertThat(result).isNotNull().hasSize(3).containsExactlyInAnyOrder("A", "B", "C")`. This reads like a sentence and provides a precise failure message.
- For exception testing, use `assertThatThrownBy(() -> service.process(null)).isInstanceOf(IllegalArgumentException.class).hasMessage("Input must not be null")`. Never use `@Test(expected = ...)` (JUnit 4 pattern) or `assertThrows` when you need to assert the exception message -- `assertThatThrownBy` chains are cleaner.
- For multiple assertions that should all run even if one fails, use `SoftAssertions`: `SoftAssertions.assertSoftly(soft -> { soft.assertThat(order.status()).isEqualTo(CONFIRMED); soft.assertThat(order.total()).isEqualByComparingTo("99.99"); })`. This is essential for validating DTOs with multiple fields.
- For floating-point and `BigDecimal` comparisons, use `isEqualByComparingTo("9.99")` rather than `isEqualTo` -- `isEqualTo` on `BigDecimal` considers `9.90` and `9.9` unequal due to scale.
- Use `usingRecursiveComparison()` to compare complex objects field-by-field without implementing `equals()`: `assertThat(actual).usingRecursiveComparison().ignoringFields("id", "createdAt").isEqualTo(expected)`.

### 5. Apply Mockito for Dependency Isolation

Mockito is the standard Java mocking library. Use it precisely -- over-mocking is as harmful as under-mocking.

- Annotate the test class with `@ExtendWith(MockitoExtension.class)` (JUnit 5 integration). This initializes `@Mock` and `@InjectMocks` fields automatically and verifies all stubbing usage after each test (strict stubbing is enabled by default in Mockito 3+).
- Declare mocks with `@Mock` on the field. Declare the class under test with `@InjectMocks` -- Mockito will inject mocks via constructor, setter, or field injection (constructor injection is preferred and most reliable).
- Stub with `when(mock.method(arg)).thenReturn(value)` for simple returns. Use `thenThrow(new RuntimeException())` to simulate failures. Use `thenAnswer(invocation -> ...)` when the return value must depend on the input argument.
- Use `ArgumentCaptor` to verify what arguments were passed to a mock: declare `@Captor ArgumentCaptor<EmailRequest> captor`, then `verify(emailService).send(captor.capture())`, then `assertThat(captor.getValue().recipient()).isEqualTo("user@example.com")`.
- Use `verify(mock, times(1)).method(arg)` for exact invocation counts. Use `verify(mock, never()).method(any())` to assert a code path was not taken. Use `verifyNoMoreInteractions(mock)` sparingly -- it makes tests brittle when adding new functionality.
- Do NOT mock: value objects, DTOs, domain entities with no dependencies, `String`, `List`, `Optional`, or any class you own that is cheap to instantiate. Mocking your own simple classes breaks tests when behavior changes and reveals nothing about correctness.
- Use `@Spy` only when you need to partially mock a real object, typically when testing a class that calls its own overridable methods. Prefer refactoring to avoid the need for spies.

### 6. Write Parameterized Tests

Parameterized tests eliminate copy-paste test duplication and make boundary conditions explicit.

- Annotate with `@ParameterizedTest` instead of `@Test`. Always pair with a source annotation.
- Use `@CsvSource` for simple inline data with 2-5 inputs and 1 expected output: `@CsvSource({"0, EMPTY", "1, SINGLE", "100, BULK"})`. The first line can be a header if you use `useHeadersInDisplayName = true`.
- Use `@MethodSource("provideInvalidInputs")` for complex objects, collections, or when setup logic is needed. The provider method must be `static`, return a `Stream<Arguments>`, and live in the same class (or a separate utility class referenced as `"com.example.TestData#provideInvalidInputs"`).
- Use `@EnumSource(value = OrderStatus.class, names = {"CANCELLED", "REFUNDED"})` to run a test for a subset of enum values.
- Use `@ValueSource(strings = {"", " ", "\t"})` to test boundary values for a single parameter type.
- Name parameterized test methods to include the parameter in the display: `@ParameterizedTest(name = "order with {0} items has status {1}")`. This produces readable test reports.
- Do NOT use `@CsvSource` for more than 6-7 rows -- move to `@CsvFileSource` with a `.csv` file in `src/test/resources`, or use `@MethodSource` with a clearly named factory method.

### 7. Use Testcontainers for Infrastructure Dependencies

Testcontainers provides disposable, real Docker containers for databases, message brokers, and HTTP services. It eliminates the "works on my machine" problem.

- Annotate the test class with `@Testcontainers` (JUnit 5 extension from `testcontainers:junit-jupiter`).
- Declare the container as a `static` field with `@Container` to share one container instance across all tests in the class. Starting a PostgreSQL container takes 2-5 seconds; per-test startup is unacceptable.
- For Spring Boot tests with Testcontainers, use `@DynamicPropertySource` to inject the container's runtime host/port into Spring's `Environment`:
  ```java
  @DynamicPropertySource
  static void postgresProperties(DynamicPropertyRegistry registry) {
      registry.add("spring.datasource.url", postgres::getJdbcUrl);
      registry.add("spring.datasource.username", postgres::getUsername);
      registry.add("spring.datasource.password", postgres::getPassword);
  }
  ```
- For tests that share a container across multiple test classes, define a base class or use a `@TestConfiguration` class with `@ServiceConnection` (Spring Boot 3.1+). `@ServiceConnection` automatically maps container metadata to Spring properties without `@DynamicPropertySource`.
- Pin container image versions explicitly: `new PostgreSQLContainer<>("postgres:16.2-alpine")`. Never use `latest` -- it causes flaky failures when the image changes in CI.
- Use `GenericContainer` for images without a dedicated Testcontainers module. Configure with `.withExposedPorts(8080)`, `.withEnv("KEY", "value")`, and `.waitingFor(Wait.forHttp("/health").forStatusCode(200))`. The wait strategy prevents test failures from race conditions.
- Clean up test data between tests using `@Transactional` on the test class (for `@DataJpaTest` and `@SpringBootTest` with a real DB -- Spring rolls back the transaction after each test). Alternatively, truncate tables in `@BeforeEach`.

### 8. Apply Spring Boot Test Slices

Test slices start a partial application context, loading only the beans relevant to one layer. They are dramatically faster than `@SpringBootTest` for layer-specific tests.

- `@WebMvcTest(OrderController.class)` -- loads only the web layer (controllers, filters, `@ControllerAdvice`). Does NOT load services or repositories. Mock all service dependencies with `@MockBean`. Use `MockMvc` to issue requests: `mockMvc.perform(post("/orders").contentType(APPLICATION_JSON).content(json)).andExpect(status().isCreated()).andExpect(jsonPath("$.id").isNotEmpty())`.
- `@DataJpaTest` -- loads JPA repositories, entity classes, and an embedded database (H2 by default). Does NOT load services or controllers. Use `@AutoConfigureTestDatabase(replace = NONE)` to use Testcontainers instead of H2. Inject `TestEntityManager` to set up data before assertions.
- `@JsonTest` -- tests Jackson serialization and deserialization in isolation. Inject `JacksonTester<OrderDto>` to assert that JSON round-trips correctly. Useful for custom serializers and date format validation.
- `@DataMongoTest`, `@DataRedisTest`, `@DataJdbcTest` -- equivalent slices for MongoDB, Redis, and Spring Data JDBC. Apply the same Testcontainers pattern for real infrastructure.
- Use `@MockBean` (not `@Mock`) within a Spring test context -- `@MockBean` registers the mock as a Spring bean and resets it after each test. `@Mock` only works with `MockitoExtension` outside a Spring context.
- `@SpringBootTest(webEnvironment = RANDOM_PORT)` starts the full context and a real HTTP server. Use `TestRestTemplate` or `WebTestClient` to issue requests. Reserve this for system/smoke tests covering full application paths.
- Avoid `@SpringBootTest` when a slice will do. A `@WebMvcTest` starts in under 500ms; a full `@SpringBootTest` typically takes 5-30 seconds.

---

## Output Format

When helping a user implement Java testing patterns, structure the response with the following sections as applicable. Not every section is required for every query -- tailor to the specific question.

```
## Test Layer Recommendation

| Test Type        | Annotation                   | Context Loaded           | Speed        | Use For                            |
|------------------|------------------------------|--------------------------|--------------|------------------------------------|
| Unit             | @ExtendWith(MockitoExtension)| None                     | <10ms        | Business logic, pure functions     |
| Web Slice        | @WebMvcTest                  | Web layer only           | <500ms       | Controller request/response        |
| JPA Slice        | @DataJpaTest                 | JPA + embedded DB        | 1-3s         | Repository queries                 |
| Integration      | @SpringBootTest              | Full context             | 5-30s        | Critical paths, cross-layer flows  |
| Infrastructure   | @SpringBootTest + Testcontainers | Full context + Docker | 10-60s       | DB, broker, cache interactions     |

## Test Class Template

```java
@DisplayName("[ClassName] -- [short description of what is being tested]")
@ExtendWith(MockitoExtension.class)  // OR @WebMvcTest / @DataJpaTest as appropriate
class OrderServiceTest {

    @Mock
    private InventoryRepository inventoryRepository;

    @Mock
    private PaymentGateway paymentGateway;

    @InjectMocks
    private OrderService orderService;

    @Nested
    @DisplayName("when placing a new order")
    class WhenPlacingNewOrder {

        @Test
        @DisplayName("should confirm order and deduct inventory when stock is sufficient")
        void shouldConfirmOrderWhenStockSufficient() {
            // Arrange
            var order = OrderFixture.validOrder();
            when(inventoryRepository.findStock("SKU-001")).thenReturn(10);
            when(paymentGateway.charge(any())).thenReturn(PaymentResult.success("txn-123"));

            // Act
            var result = orderService.place(order);

            // Assert
            assertThat(result.status()).isEqualTo(OrderStatus.CONFIRMED);
            assertThat(result.paymentReference()).isEqualTo("txn-123");
            verify(inventoryRepository).deduct("SKU-001", order.quantity());
        }

        @Test
        @DisplayName("should throw InsufficientStockException when stock is zero")
        void shouldThrowWhenStockInsufficient() {
            // Arrange
            var order = OrderFixture.validOrder();
            when(inventoryRepository.findStock("SKU-001")).thenReturn(0);

            // Act + Assert
            assertThatThrownBy(() -> orderService.place(order))
                .isInstanceOf(InsufficientStockException.class)
                .hasMessageContaining("SKU-001");

            verify(paymentGateway, never()).charge(any());
        }
    }

    @Nested
    @DisplayName("when validating order quantities")
    class WhenValidatingQuantities {

        @ParameterizedTest(name = "quantity={0} should produce status={1}")
        @CsvSource({
            "0,  INVALID_QUANTITY",
            "-1, INVALID_QUANTITY",
            "1,  VALID",
            "999, VALID",
            "1000, EXCEEDS_MAX"
        })
        @DisplayName("should validate quantity boundaries")
        void shouldValidateQuantityBoundaries(int quantity, String expectedStatus) {
            var result = orderService.validateQuantity(quantity);
            assertThat(result.name()).isEqualTo(expectedStatus);
        }
    }
}
```

## Testcontainers Setup Template

```java
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Testcontainers
class OrderRepositoryIT {

    @Container
    static PostgreSQLContainer<?> postgres =
        new PostgreSQLContainer<>("postgres:16.2-alpine")
            .withDatabaseName("testdb")
            .withUsername("test")
            .withPassword("test");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private TestEntityManager entityManager;

    @Test
    @DisplayName("should find orders by customer email")
    void shouldFindOrdersByCustomerEmail() {
        // Arrange
        entityManager.persist(OrderFixture.withEmail("alice@example.com"));
        entityManager.persist(OrderFixture.withEmail("bob@example.com"));
        entityManager.flush();

        // Act
        var results = orderRepository.findByCustomerEmail("alice@example.com");

        // Assert
        assertThat(results).hasSize(1)
            .first()
            .extracting(Order::customerEmail)
            .isEqualTo("alice@example.com");
    }
}
```

## Coverage Configuration (JaCoCo)
- Minimum line coverage: 80%
- Minimum branch coverage: 70%
- Excluded packages: **/generated/**, **/*MapperImpl**, **/config/**
```

---

## Rules

1. **Never use `@SpringBootTest` for tests that do not require a full application context.** A `@WebMvcTest` or `@DataJpaTest` starts in under 500ms; `@SpringBootTest` regularly takes 10-30 seconds. Using `@SpringBootTest` for unit-level concerns inflates CI build time by minutes across a test suite.

2. **Never use `@Mock` inside a Spring test context (`@WebMvcTest`, `@DataJpaTest`, `@SpringBootTest`).** Use `@MockBean` instead. `@Mock` creates a Mockito mock outside the Spring `ApplicationContext`, so it will not be injected into Spring-managed beans. `@MockBean` registers the mock as a bean and resets it after each test.

3. **Never declare Testcontainers as instance fields when they can be static.** A `static @Container` field is started once per test class. An instance field causes Docker container startup on every test method -- a PostgreSQL container starts in 2-5 seconds, so 20 test methods would add 40-100 seconds of overhead.

4. **Always pin Testcontainers image versions explicitly.** `new PostgreSQLContainer<>("postgres:latest")` will break silently when Docker Hub updates the image. Use versioned tags like `postgres:16.2-alpine`. Treat these version strings the same as dependency versions -- review and update intentionally.

5. **Always enable strict stubbing.** `@ExtendWith(MockitoExtension.class)` enables strict stubbing by default in Mockito 3+. Do not downgrade to lenient mode (`@MockitoSettings(strictness = LENIENT)`) globally -- it masks dead stubbing that indicates tests are testing the wrong thing. Use `lenient()` on individual stubbings only when genuinely needed.

6. **Never use `Thread.sleep()` to wait for asynchronous behavior in tests.** Use Awaitility (included in `spring-boot-starter-test`): `await().atMost(5, SECONDS).until(() -> eventStore.count() == 1)`. Fixed sleeps cause intermittent failures under load and add unnecessary latency under normal conditions.

7. **Never use `@InjectMocks` when constructor injection reveals a design problem.** If a class has 7+ dependencies and `@InjectMocks` is needed to wire them all, this is a signal the class violates the Single Responsibility Principle. The test is making a design smell invisible. Refactor instead.

8. **Always use fixture factory methods instead of constructors in test setup.** Create a `*Fixture` or `*Mother` class (e.g., `OrderFixture`, `CustomerMother`) with static factory methods that return pre-built valid objects. This prevents test brittleness when constructors change and makes intent clear: `OrderFixture.expiredOrder()` is more readable than a 10-line builder chain repeated in every test.

9. **Never assert on private methods directly.** If a private method needs its own test, it is a signal it should be extracted to a package-private or public method on a separate collaborator class. Testing private methods via reflection bypasses access modifiers and couples tests to implementation details -- they break on any refactoring.

10. **Always use `@DisplayName` in English prose on every test method.** Test names like `testOrder1()` or `shouldWork()` produce useless failure messages. Use the pattern `"should [expected outcome] when [condition]"`: `"should reject order when customer is flagged for fraud"`. These names appear in CI reports, Surefire HTML, and IDE test runners, and they serve as living documentation.

---

## Edge Cases

### Circular Bean Dependencies in `@SpringBootTest`
When a full context fails to start with a `BeanCurrentlyInCreationException`, the failing test is surfacing a real application bug, not a test configuration issue. Do not work around it with `@Lazy` injection in test code. Fix the circular dependency in the production code using constructor injection, a separate mediator service, or event-driven decoupling. The test is doing its job.

### Flaky Testcontainers Tests in CI
If Testcontainers tests pass locally but fail in CI, the most common causes are: (1) Docker is not available in the CI agent -- check `docker info` in the CI pipeline and ensure the runner has Docker socket access; (2) the wait strategy is insufficient -- replace `.waitingFor(Wait.forListeningPort())` with a more robust `Wait.forHealthcheck()` or `Wait.forLogMessage(".*database system is ready.*", 1)`; (3) resource exhaustion -- containers from previous builds were not cleaned up. Use `ryuk` (enabled by default in Testcontainers) to ensure cleanup, and consider `--network=host` on Linux CI agents for faster port binding.

### Mockito `UnnecessaryStubbingException`
Strict stubbing throws `UnnecessaryStubbingException` when a stub is declared in `@BeforeEach` but not invoked in every test in the class. The fix is to move stubs from `@BeforeEach` into individual test methods that need them, or into `@Nested` inner class `@BeforeEach` methods that are scoped to the tests that actually use that stub. Do not suppress this exception -- it reveals that a test is not exercising the code path you think it is.

### Testing Lombok-Generated Classes
Lombok annotations like `@Data`, `@Builder`, and `@Value` generate `equals()`, `hashCode()`, and `toString()` at compile time. Do not write tests that only verify Lombok-generated behavior -- that tests the library, not your code. Do write tests for custom `equals()` implementations (when `@EqualsAndHashCode(onlyExplicitlyIncluded = true)` is used), for builder defaults, and for any validation in custom constructors annotated with `@Builder`. Exclude Lombok-generated classes from JaCoCo coverage using the `@lombok.Generated` annotation on your Lombok classes, or configure the JaCoCo exclusion pattern `**/*$*` for inner builder classes.

### Testing with `@Transactional` and Testcontainers
When using `@DataJpaTest` with Testcontainers, each test method is wrapped in a transaction that is rolled back. This is usually correct. However, tests that verify behavior spanning multiple transactions (e.g., an optimistic locking retry, or a `@Transactional(propagation = REQUIRES_NEW)` method) will not work with rollback. For these cases, annotate the test class with `@Commit` or specific test methods with `@Rollback(false)`, and then clean up in `@AfterEach` by deleting the created rows explicitly. Alternatively, truncate the table using a `@BeforeEach` SQL script.

### H2 Compatibility Failures in `@DataJpaTest`
H2's SQL dialect does not perfectly emulate PostgreSQL or MySQL. Tests pass with H2 but fail in production because H2 silently accepts invalid SQL. The correct fix is to use `@AutoConfigureTestDatabase(replace = NONE)` and replace H2 with a Testcontainers database of the same version as production. If the team requires fast feedback without Docker, a pragmatic middle ground is to use H2 with `MODE=PostgreSQL` (via `spring.datasource.url=jdbc:h2:mem:testdb;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE`) and accept the remaining dialect gaps, but document every database feature that is excluded from test coverage.

### Testing Asynchronous Event-Driven Code
When testing a service that publishes events to a Spring `ApplicationEventPublisher` or an `@Async` method, do not test the asynchronous behavior in a unit test. Test the publisher's logic synchronously (verify the event was published with correct payload). Write a separate integration test for the listener. For `@Async` methods in `@SpringBootTest`, either call the `Future` returned by the method or use Awaitility: `await().atMost(Duration.ofSeconds(5)).untilAsserted(() -> verify(emailService, times(1)).send(any()))`. Always configure `@EnableAsync` in a test configuration class and use a `SyncTaskExecutor` in unit tests to execute async methods synchronously.

---

## Example

**User Input:** "I'm building a Spring Boot 3 e-commerce service. I need to write tests for `OrderService`, which depends on `InventoryRepository` (a JPA repository), `PaymentGateway` (a third-party HTTP client), and `ApplicationEventPublisher`. How should I structure and write these tests?"

---

**Analysis:**

`OrderService` has three dependencies: one persistence layer, one external HTTP client, and one Spring framework component. The correct approach is:
1. A pure unit test for `OrderService` with all three dependencies mocked -- this tests business logic at millisecond speed with no I/O.
2. A `@DataJpaTest` integration test for `InventoryRepository` against a real PostgreSQL container -- this tests custom JPQL queries where H2 compatibility is not guaranteed.
3. No test for `ApplicationEventPublisher` interaction other than a `verify()` call confirming event publication -- the listener tests are separate.

---

**Output:**

### Unit Test: `OrderService`

```java
package com.example.orders.service;

import com.example.orders.domain.Order;
import com.example.orders.domain.OrderStatus;
import com.example.orders.events.OrderConfirmedEvent;
import com.example.orders.exception.InsufficientStockException;
import com.example.orders.exception.PaymentDeclinedException;
import com.example.orders.gateway.PaymentGateway;
import com.example.orders.gateway.PaymentResult;
import com.example.orders.repository.InventoryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@DisplayName("OrderService -- business logic for order lifecycle")
@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private InventoryRepository inventoryRepository;

    @Mock
    private PaymentGateway paymentGateway;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    @InjectMocks
    private OrderService orderService;

    @Captor
    private ArgumentCaptor<OrderConfirmedEvent> eventCaptor;

    @Nested
    @DisplayName("when placing an order with sufficient stock")
    class WhenStockIsSufficient {

        private Order order;

        @BeforeEach
        void setUp() {
            order = OrderFixture.validOrder(); // SKU-001, qty=2, price=49.99
        }

        @Test
        @DisplayName("should confirm order and return confirmation with payment reference")
        void shouldConfirmOrderWithPaymentReference() {
            // Arrange
            when(inventoryRepository.findAvailableStock("SKU-001")).thenReturn(10);
            when(paymentGateway.charge(any())).thenReturn(PaymentResult.success("txn-abc123"));

            // Act
            var result = orderService.place(order);

            // Assert
            assertThat(result.status()).isEqualTo(OrderStatus.CONFIRMED);
            assertThat(result.paymentReference()).isEqualTo("txn-abc123");
            assertThat(result.totalCharged()).isEqualByComparingTo(new BigDecimal("99.98"));
        }

        @Test
        @DisplayName("should deduct stock by the exact quantity ordered")
        void shouldDeductCorrectStockQuantity() {
            // Arrange
            when(inventoryRepository.findAvailableStock("SKU-001")).thenReturn(10);
            when(paymentGateway.charge(any())).thenReturn(PaymentResult.success("txn-abc123"));

            // Act
            orderService.place(order);

            // Assert
            verify(inventoryRepository).deductStock("SKU-001", 2);
        }

        @Test
        @DisplayName("should publish OrderConfirmedEvent with correct order ID after successful placement")
        void shouldPublishOrderConfirmedEvent() {
            // Arrange
            when(inventoryRepository.findAvailableStock("SKU-001")).thenReturn(10);
            when(paymentGateway.charge(any())).thenReturn(PaymentResult.success("txn-abc123"));

            // Act
            var result = orderService.place(order);

            // Assert
            verify(eventPublisher).publishEvent(eventCaptor.capture());
            assertThat(eventCaptor.getValue().orderId()).isEqualTo(result.orderId());
            assertThat(eventCaptor.getValue().customerId()).isEqualTo(order.customerId());
        }
    }

    @Nested
    @DisplayName("when placing an order with insufficient stock")
    class WhenStockIsInsufficient {

        @Test
        @DisplayName("should throw InsufficientStockException and not charge payment")
        void shouldThrowAndNotChargePayment() {
            // Arrange
            var order = OrderFixture.validOrder();
            when(inventoryRepository.findAvailableStock("SKU-001")).thenReturn(1);
            // order requests qty=2, but only 1 available

            // Act + Assert
            assertThatThrownBy(() -> orderService.place(order))
                .isInstanceOf(InsufficientStockException.class)
                .hasMessageContaining("SKU-001")
                .hasMessageContaining("requested: 2, available: 1");

            verify(paymentGateway, never()).charge(any());
            verify(eventPublisher, never()).publishEvent(any());
        }
    }

    @Nested
    @DisplayName("when payment gateway declines the charge")
    class WhenPaymentIsDeclined {

        @Test
        @DisplayName("should throw PaymentDeclinedException and restore deducted stock")
        void shouldRestoreStockOnPaymentFailure() {
            // Arrange
            var order = OrderFixture.validOrder();
            when(inventoryRepository.findAvailableStock("SKU-001")).thenReturn(10);
            when(paymentGateway.charge(any())).thenThrow(new PaymentDeclinedException("Card expired"));

            // Act + Assert
            assertThatThrownBy(() -> orderService.place(order))
                .isInstanceOf(PaymentDeclinedException.class)
                .hasMessage("Card expired");

            // Stock must be restored on payment failure
            verify(inventoryRepository).restoreStock("SKU-001", 2);
            verify(eventPublisher, never()).publishEvent(any());
        }
    }

    @Nested
    @DisplayName("when validating order input")
    class WhenValidatingInput {

        @ParameterizedTest(name = "quantity={0} should be valid={1}")
        @CsvSource({
            "0,   false",
            "-1,  false",
            "1,   true",
            "500, true",
            "501, false"
        })
        @DisplayName("should enforce quantity boundaries of 1 to 500 inclusive")
        void shouldEnforceQuantityBoundaries(int quantity, boolean expectedValid) {
            var validationResult = orderService.validateQuantity(quantity);
            assertThat(validationResult.isValid()).isEqualTo(expectedValid);
        }
    }
}
```

### Fixture Factory: `OrderFixture`

```java
package com.example.orders.service;

import com.example.orders.domain.Order;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Test fixture factory for Order domain objects.
 * Centralizes test data construction so that constructor changes
 * require updates in one place rather than across all test classes.
 */
public final class OrderFixture {

    private OrderFixture() {}

    /** Returns a valid order for SKU-001, quantity 2, unit price 49.99, customer C-001. */
    public static Order validOrder() {
        return Order.builder()
            .orderId(UUID.randomUUID().toString())
            .customerId("C-001")
            .sku("SKU-001")
            .quantity(2)
            .unitPrice(new BigDecimal("49.99"))
            .build();
    }

    public static Order withQuantity(int quantity) {
        return validOrder().toBuilder().quantity(quantity).build();
    }

    public static Order withSku(String sku) {
        return validOrder().toBuilder().sku(sku).build();
    }
}
```

### Integration Test: `InventoryRepository`

```java
package com.example.orders.repository;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("InventoryRepository -- custom query correctness against real PostgreSQL")
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Testcontainers
class InventoryRepositoryIT {

    @Container
    static PostgreSQLContainer<?> postgres =
        new PostgreSQLContainer<>("postgres:16.2-alpine")
            .withDatabaseName("orders_test")
            .withUsername("test")
            .withPassword("test");

    @DynamicPropertySource
    static void configureDataSource(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired
    private InventoryRepository inventoryRepository;

    @Autowired
    private TestEntityManager entityManager;

    @Test
    @DisplayName("should return available stock for an existing SKU")
    void shouldReturnAvailableStock() {
        // Arrange
        entityManager.persist(InventoryItem.of("SKU-001", 25));
        entityManager.flush();

        // Act
        int stock = inventoryRepository.findAvailableStock("SKU-001");

        // Assert
        assertThat(stock).isEqualTo(25);
    }

    @Test
    @DisplayName("should return zero for an unknown SKU rather than throwing")
    void shouldReturnZeroForUnknownSku() {
        int stock = inventoryRepository.findAvailableStock("SKU-UNKNOWN");
        assertThat(stock).isZero();
    }

    @Test
    @DisplayName("should decrement stock by the specified quantity using a JPQL update")
    void shouldDeductStockAtomically() {
        // Arrange
        entityManager.persist(InventoryItem.of("SKU-002", 10));
        entityManager.flush();

        // Act
        inventoryRepository.deductStock("SKU-002", 3);
        entityManager.clear(); // evict from first-level cache to force re-read

        // Assert
        int remainingStock = inventoryRepository.findAvailableStock("SKU-002");
        assertThat(remainingStock).isEqualTo(7);
    }
}
```

### Resulting Test Execution Profile

| Test Class                  | Type        | Annotation                    | Typical Runtime |
|-----------------------------|-------------|-------------------------------|-----------------|
| `OrderServiceTest`          | Unit        | `@ExtendWith(MockitoExtension)` | 50-150ms total |
| `InventoryRepositoryIT`     | JPA Slice   | `@DataJpaTest` + Testcontainers | 5-8s (container startup amortized across all IT tests) |

**Advice:** Run unit tests (`*Test`) on every save in watch mode. Run integration tests (`*IT`) as a pre-commit hook or CI stage. The Failsafe plugin separates these automatically by convention.
