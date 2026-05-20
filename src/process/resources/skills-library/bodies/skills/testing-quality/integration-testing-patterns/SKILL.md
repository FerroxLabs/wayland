---
name: integration-testing-patterns
description: |
  Guides expert-level integration testing patterns implementation: automation and best-practices decision frameworks, production-ready patterns, and concrete templates for integration testing patterns workflows.
  Use when the user asks about integration testing patterns, integration testing patterns configuration, or testing best practices for integration projects.
  Do NOT use when the user needs a different testing quality capability -- check sibling skills in the testing quality subcategory.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "testing automation best-practices"
  category: "testing-quality"
  subcategory: "testing-quality"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Integration Testing Patterns

## When to Use

**Use this skill when:**
- A user wants to design or improve integration tests that verify interactions between two or more real components -- databases, message queues, HTTP APIs, caches, or third-party services
- A user asks how to structure tests that span service boundaries, such as testing a REST endpoint that writes to PostgreSQL and publishes to a Kafka topic
- A user needs to decide between real infrastructure vs. test doubles (fakes, stubs, mocks, contract tests) for a given integration boundary
- A user asks about test environment setup, container-based test dependencies, or database seeding strategies for integration suites
- A user is experiencing flaky integration tests and wants to diagnose and fix the root cause
- A user wants to add integration tests to a CI/CD pipeline and needs guidance on parallelization, isolation, and execution time budgets
- A user needs to verify data consistency, transactional behavior, or eventual consistency semantics across system components

**Do NOT use this skill when:**
- The user needs unit testing guidance -- unit tests mock all external dependencies and test a single class or function in isolation; redirect to a unit testing skill
- The user needs end-to-end (E2E) or browser-based testing -- those involve full UI flows through a deployed environment; redirect to an E2E testing skill
- The user needs a contract testing (consumer-driven contract) deep-dive -- Pact and similar tools have their own skill
- The user is asking about load or performance testing -- throughput and latency testing under simulated traffic is a separate concern
- The user wants general CI/CD pipeline architecture -- pipeline design is a DevOps/platform concern, not a testing-patterns concern
- The user is asking about static analysis, linting, or code quality gates unrelated to test execution

---

## Process

### 1. Identify Integration Boundaries and Risk Surface

Before writing a single test, map what you are actually integrating.

- List every external system the component under test communicates with: relational databases (PostgreSQL, MySQL), NoSQL stores (MongoDB, Redis), message brokers (Kafka, RabbitMQ, SQS), HTTP APIs (internal microservices, third-party REST/gRPC), file systems, or blob storage (S3, GCS)
- Classify each boundary by its failure risk: network partitions, schema drift, ordering guarantees, transactional atomicity, and auth/auth expiry
- Identify which boundaries are owned by your team vs. an external team vs. a third party -- ownership affects which test strategy applies (real infrastructure, shared test environment, or a contract test)
- Draw a simple boundary map: one box per component, one labeled arrow per integration point. This map becomes the test coverage checklist
- Prioritize boundaries where bugs are expensive to detect late: money movement, data loss, security decisions, SLA-critical paths

### 2. Choose the Right Test Double Strategy Per Boundary

Different integration boundaries warrant different levels of realism. Apply this decision framework:

- **Use a real embedded or containerized dependency** when: the component behavior (SQL query planning, index usage, serialization format, locking semantics) cannot be faithfully reproduced by a fake, the team owns the dependency, and test execution time allows it. Examples: Testcontainers-managed PostgreSQL for repository tests, embedded Kafka for event-driven service tests
- **Use an in-memory fake** when: a real implementation is too slow or complex for the test suite, and the fake faithfully implements the contract. Examples: H2 in-memory DB for simple CRUD (with caution -- see Edge Cases), an in-process HTTP server like WireMock for third-party REST APIs
- **Use a consumer-driven contract test** when: the boundary is an API owned by another team and you cannot spin up their service in your CI pipeline. The consumer records expectations; the provider verifies them independently
- **Use a stub (canned response)** only for read-only, non-critical paths where the response content does not affect control flow significantly
- Never mock at the network layer with general-purpose mocking frameworks (e.g., Mockito mocking an HTTP client method) for integration tests -- this tests the mock, not the integration

**Decision matrix:**

| Boundary Type | Recommended Strategy | Acceptable Fallback |
|---|---|---|
| Owned relational DB | Testcontainers (real DB) | In-memory same dialect only |
| Owned NoSQL store | Testcontainers | Embedded emulator if available |
| Owned message broker | Testcontainers / embedded broker | In-process fake with same API |
| Internal service API | Consumer contract test | WireMock stub with recorded responses |
| Third-party REST API | WireMock stub + contract | Recorded HTTP cassette (VCR) |
| Cloud blob storage (S3) | LocalStack in container | SDK-provided fake |
| File system | Real temp directory | None -- always use real FS |

### 3. Design Test Isolation and State Management

Isolation is the single largest driver of test reliability. Flakiness almost always traces to shared mutable state.

- **Database isolation -- prefer transaction rollback:** Wrap each test in a database transaction, run the test, then roll back. This is faster than truncation and guarantees clean state. Works for tests that do not themselves commit (e.g., do not test transaction behavior). Use per-test rollback by default
- **Database isolation -- use schema-per-test for commit-level tests:** When testing transactional behavior (two-phase commit, savepoints, LISTEN/NOTIFY), create a dedicated schema per test class and drop it in teardown. This adds ~50--200ms per class but enables testing real commit semantics
- **Database isolation -- truncation order matters:** When truncation is necessary, truncate in reverse foreign-key dependency order or use TRUNCATE ... CASCADE. Never delete without considering referential integrity
- **Message broker isolation:** Use a unique topic/queue name per test (generated with a UUID suffix). Never rely on a shared topic being empty at test start. Tear down topics in afterAll hooks
- **HTTP stub isolation:** Reset WireMock stubs after each test class, not after each test, unless tests within a class have conflicting stub requirements. Use stub priority when stubs must coexist
- **Port allocation:** Never hard-code ports for test containers. Use `getMappedPort()` or equivalent dynamic port resolution to prevent port conflicts in parallel test runs
- **Parallel execution:** Mark tests that share container infrastructure as belonging to the same execution group. Use JUnit 5's `@ResourceLock`, pytest's `pytest-xdist` worker groups, or Go's `t.Parallel()` with shared `TestMain` setup to control container lifecycle at the right scope

### 4. Implement Deterministic Data Seeding

Test data is not an afterthought -- it is part of the test contract.

- Use an explicit fixture-loading strategy: SQL seed scripts for relational stores, JSON fixtures for document stores, Avro/Protobuf fixtures for schema-validated message payloads
- Prefer builder patterns over fixture files for complex domain objects: a `CustomerBuilder` that sets sensible defaults but allows override in each test is more readable and resilient to schema changes than a static JSON fixture
- Never use production data snapshots as test seeds -- they contain PII, drift from current schema, and create GDPR/HIPAA compliance risks
- Apply the Minimal Data Principle: seed only the rows/documents required by the specific test case. Avoid "universe" seed scripts that load 200 rows -- they obscure intent and slow down tests
- For ordered or time-dependent data (event logs, audit trails, CDC streams), use deterministic timestamps: `2024-01-15T10:00:00Z`, `2024-01-15T10:01:00Z` rather than `NOW()` or `System.currentTimeMillis()`. Tests that depend on wall-clock time are inherently flaky
- Label seed data ownership in comments or in a metadata column (e.g., `_test_run_id`) when debugging shared-environment tests

### 5. Structure Tests Using the Arrange-Act-Assert-Cleanup Pattern

Integration tests require an explicit cleanup phase that unit tests typically omit.

- **Arrange:** Spin up or acquire the test dependency, seed data, configure stubs. Keep arrangement code in `@BeforeEach` / setup fixtures for reuse, but keep test-specific data in the test body for readability
- **Act:** Invoke the real component under test -- call the repository method, publish the message, hit the HTTP endpoint via a real HTTP client (RestTemplate, requests, net/http). Never mock the component under test itself
- **Assert:** Verify the observable outcome: returned value, database row state, message published to broker, HTTP response status and body. Use specific assertions -- assert the exact row count, the exact field value, the exact message payload -- not just "something was written"
- **Cleanup:** Explicitly clean up side effects not covered by transaction rollback: created files, sent emails (captured by a test SMTP server), published messages, external API calls. Do not rely on test ordering for cleanup
- Separate assertions about the primary outcome from assertions about side effects. If a service method should both persist a record AND publish an event, assert both independently with clear labels

### 6. Handle Asynchronous and Eventually-Consistent Behaviors

Async behavior is the second leading cause of flaky integration tests after shared state.

- **Never use `Thread.sleep()` or `time.sleep()` as a synchronization primitive.** It makes tests slow when the operation completes early and flaky when it completes late
- Use Awaitility (Java), `tenacity` (Python), or `eventually` (Go) with an explicit timeout and polling interval. Set the timeout to 10x the expected operation latency under normal load, not the worst-case latency. Example: if a Kafka consumer typically processes within 200ms, set a 2-second timeout with 100ms polling
- For database-level async operations (triggers, materialized view refresh, CDC), poll the assertion target directly rather than asserting the source event
- When testing idempotency, run the same action twice and assert the outcome is identical to running it once. Idempotency tests must always use the same idempotency key/deduplication ID
- For event-driven systems, use an in-process consumer that subscribes to the output topic and captures messages into a concurrent queue. Assert against the captured messages with Awaitility. This is more reliable than reading from the broker directly in assertions
- Distinguish between "published" (broker acknowledged) and "consumed" (downstream handler ran). Test each separately if both matter

### 7. Integrate into CI/CD with Appropriate Categorization

Integration tests must fit within pipeline time budgets without sacrificing signal quality.

- Categorize tests into three tiers and enforce with tags or test profiles:
  - **Fast integration (< 5s per test, < 2min total):** in-memory fakes, pre-warmed containers reused across the suite. Run on every commit
  - **Standard integration (< 30s per test, < 10min total):** Testcontainers with container reuse enabled, WireMock stubs. Run on every PR
  - **Slow integration (< 5min per test, < 20min total):** full-stack composition tests, multi-service scenarios. Run nightly or pre-merge on main
- Enable Testcontainers container reuse (`TESTCONTAINERS_REUSE_ENABLE=true` + `.reusable(true)`) to cut container startup from 10--30s to sub-second on developer machines and warm CI agents
- Use test result caching (Gradle build cache, pytest-cache, Go test cache) to skip re-running tests whose source inputs have not changed
- Publish integration test results as JUnit XML and surface them in the CI UI. Do not bury failures in raw log output
- Gate merges on integration test pass. Never treat integration test failures as "flaky -- ignore" without filing a ticket and a deadline for resolution

### 8. Diagnose and Remediate Flaky Integration Tests

A flaky integration test is a bug in your test infrastructure. Treat it as such.

- Enable test retry with a **maximum of 1 retry** in CI. If a test still fails on retry, it is genuinely broken. Retry count is a flakiness detection mechanism, not a fix
- When a test flakes, capture: container logs, application logs, assertion values, timestamps, and thread/goroutine dumps. Most flakiness is diagnosable from these artifacts
- Categorize the flakiness root cause:
  - **Shared state leak:** another test left data in the DB, queue, or cache. Fix: strengthen isolation (transaction rollback, unique identifiers)
  - **Timing assumption:** polling timeout too low for CI environment latency. Fix: increase Awaitility timeout, not sleep duration
  - **Port conflict:** hard-coded port used by another test process. Fix: dynamic port allocation
  - **Container startup race:** test starts before the container is ready. Fix: use proper health check wait strategies -- wait for a health endpoint, not just port open
  - **Non-deterministic ordering:** test relies on database query returning rows in insertion order without ORDER BY. Fix: add explicit ORDER BY to assertions
- Track flakiness rate per test over 30 days. A test with > 1% flakiness rate requires immediate remediation. A test that fails more than twice without a fix is quarantined until fixed

---

## Output Format

When responding to a user asking for integration testing guidance, structure your response as follows:

```
## Integration Boundary Analysis

### Boundaries Identified
| Boundary | Owner | Risk Level | Recommended Strategy |
|----------|-------|------------|---------------------|
| [component] -> [dependency] | [team/external] | High/Med/Low | [real/fake/contract/stub] |

### Test Infrastructure Requirements
- Container dependencies: [list with versions]
- Test framework: [framework + relevant plugins]
- Key libraries: [Testcontainers, WireMock, Awaitility, etc.]

---

## Test Structure

### Isolation Strategy
[Per-test transaction rollback / schema-per-class / unique-topic-per-test / etc.]
Rationale: [why this strategy fits the specific scenario]

### Data Seeding Approach
[Builder pattern / SQL fixture / JSON fixture]
Seed scope: [per-test / per-class / per-suite]

### Async Handling
Timeout: [N]ms | Polling interval: [N]ms | Library: [Awaitility/tenacity/etc.]

---

## Implementation

### Test Setup (language-specific)
[Concrete code showing container setup, seed, and teardown]

### Representative Test Cases
[3-5 concrete test cases covering: happy path, not-found/empty, constraint violation,
async event assertion, idempotency]

### Anti-Patterns Avoided
[Explicit list of what was deliberately NOT done and why]

---

## CI/CD Integration

| Tier | Tag | Max Duration | Trigger |
|------|-----|--------------|---------|
| Fast | @FastIntegration | 2 min | Every commit |
| Standard | @Integration | 10 min | Every PR |
| Slow | @SlowIntegration | 20 min | Nightly |

### Container Reuse Configuration
[Environment variable and code snippet for enabling reuse]
```

---

## Rules

1. **Never use `Thread.sleep()` or equivalent as an assertion synchronization mechanism.** It is the single most common cause of flaky integration tests and hides real timing problems. Use polling libraries with explicit timeouts always.

2. **Never use H2 in-memory database to test code that targets PostgreSQL, MySQL, or another specific SQL dialect.** H2's compatibility modes do not replicate constraint behavior, JSON operators, window functions, or lock semantics. A test passing on H2 can mask a production bug. Use Testcontainers with the real database image.

3. **Never share a running container across parallel test workers without explicit isolation at the data layer.** Two test workers writing to the same database table without transaction isolation will produce race conditions that are extremely difficult to diagnose. Isolate by schema, by transaction rollback, or by unique-prefix row ownership.

4. **Always use dynamic port allocation for test containers.** Hard-coded ports like `5432`, `9092`, or `6379` cause immediate failures when the port is already in use on the host machine or in a CI agent running multiple jobs. Use `getMappedPort()` or equivalent.

5. **Testcontainers images must be pinned to a specific version tag.** Using `latest` causes non-deterministic test failures when a new version of postgres or kafka is published with breaking changes. Pin to a patch version: `postgres:16.2`, `confluentinc/cp-kafka:7.6.1`.

6. **Every integration test must assert the full observable outcome, not just the return value.** If a method saves a record and publishes an event, the test must assert that the record was saved with the correct field values AND that the event was published with the correct payload. Asserting only the return value allows silent failures in side effects.

7. **Test setup and teardown code must be idempotent.** If teardown fails halfway through and the test is re-run, the setup must succeed. Use `CREATE TABLE IF NOT EXISTS`, `DROP TABLE IF EXISTS`, and idempotent container lifecycle management.

8. **Never read from a message broker topic in an assertion by consuming the entire topic from the beginning.** This is slow, order-dependent, and pollutes shared test topics. Instead, capture messages in-process via a dedicated test consumer that subscribes before the Act phase and collects messages into a list.

9. **WireMock stubs must verify call count after each test.** Creating a stub but never asserting it was called allows the component to bypass the integration entirely with no test failure. Use `verify(1, postRequestedFor(urlEqualTo(...)))` or equivalent.

10. **Integration test execution time is a first-class metric.** Measure and track p95 test execution time per test class. A test class that takes > 60 seconds on average is a candidate for refactoring -- either the setup is doing too much work, or the test scope is too wide and should be split. Set a hard CI timeout at 1.5x the expected runtime to catch regressions automatically.

---

## Edge Cases

### H2 Compatibility Mode False Confidence
When a team switches from H2 in-memory to a real PostgreSQL container, they frequently discover that 5--20% of existing tests fail. Common culprits: PostgreSQL's stricter constraint checking (e.g., `UNIQUE` partial indexes, `CHECK` constraints, `ON DELETE` cascade behavior), use of PostgreSQL-specific functions (`JSONB` operators, `array_agg`, `generate_series`), and case-sensitive identifier handling. When migrating: run both H2 and PostgreSQL suites in parallel for one sprint, catalog every divergence, and fix the PostgreSQL failures first. Then remove H2 entirely. Do not maintain both permanently.

### Container Startup Latency in CI
On cold CI agents, Testcontainers can take 30--60 seconds to start a PostgreSQL container and 60--90 seconds for Kafka. This is unacceptable for a suite running on every commit. Mitigation strategies in priority order: (1) Enable container reuse with `TESTCONTAINERS_REUSE_ENABLE=true` and `.reusable(true)` -- reduces repeat startup to < 1s. (2) Use a CI-specific Docker layer cache to pre-pull images. (3) Use a shared test environment for slow integration tests rather than spinning containers per-run. (4) Use Spring Boot's `@SpringBootTest` application context caching or equivalent framework-level caching to avoid re-initializing the application per test class. Never work around this by increasing test timeouts.

### Multi-Tenant Data Isolation
When the system under test is multi-tenant and uses row-level security (RLS), tenant discriminator columns, or schema-per-tenant isolation, integration tests must explicitly verify tenant boundary enforcement. Create two test tenants in the seed. Assert that queries for tenant A do not return tenant B's data. Assert that writes for tenant A do not modify tenant B's rows. Failing to test this allows tenant data leakage bugs to pass all tests and reach production. This is a compliance and security risk, not just a correctness risk.

### Transactional Outbox Pattern Testing
When testing the Transactional Outbox pattern (write to DB and outbox table atomically, relay publishes to broker), standard transaction-rollback isolation breaks the test because the relay process runs outside the test transaction. Instead: (1) Use schema-per-test isolation with real commits. (2) Start a lightweight relay component within the test process that polls the outbox table. (3) Assert that messages appear in the in-process test consumer within the Awaitility timeout. Never test the outbox by asserting the database write alone -- that misses the integration between the relay and the broker.

### Third-Party API Rate Limiting in Integration Tests
If integration tests make real HTTP calls to third-party APIs (payment processors, geocoding services, OAuth providers), they will hit rate limits in CI, incur costs, and fail non-deterministically when the API is unavailable. Solution: always stub third-party APIs with WireMock or a recorded HTTP cassette (Betamax, VCR.py). Record the real interactions once in a controlled environment, commit the cassette to source control, and replay during tests. Re-record quarterly or when the API contract changes. Never run tests that make real external API calls in standard CI. Reserve those for a dedicated nightly smoke test suite that validates the recorded cassettes are still accurate.

### Database Migration Compatibility Testing
Integration tests must run against the same schema version as production. When using Flyway or Liquibase, run migrations programmatically as part of the test suite setup before any test accesses the database. Do not use a pre-migrated container image -- it will drift from the current migration scripts. Also add a dedicated test class that verifies the migration sequence is idempotent: apply all migrations, roll back to a prior version (if the DB supports it), and re-apply. This catches migration scripts that are not re-runnable and deployment rollback failures before they reach production.

### Eventual Consistency with Multiple Consumers
In event-driven architectures, a single event may trigger multiple downstream consumers (notification service, analytics, audit log). Integration tests that only assert one consumer's outcome silently miss failures in others. When testing such flows: register a test consumer for every relevant output topic before triggering the action. Assert that each expected topic received its message within the Awaitility window. If the assertion window is too tight, consumers may miss messages published before they subscribe -- always subscribe before acting, never after.

### Containerized Tests in Kubernetes CI Environments
Docker-in-Docker (DinD) and Testcontainers in Kubernetes CI (Tekton, Argo Workflows) require specific configuration. The `DOCKER_HOST` environment variable must point to the DinD sidecar or a remote Docker socket. The Ryuk container (used by Testcontainers for resource cleanup) requires privileged mode or must be disabled (`TESTCONTAINERS_RYUK_DISABLED=true`) with manual cleanup. Shared network namespaces mean `localhost` in the test process may not resolve to the container -- use `container.getHost()` explicitly. Test this infrastructure configuration with a minimal "smoke" test that starts a single postgres container before onboarding the full suite.

---

## Example

**Input:** "We have a Spring Boot order service that handles order creation. When an order is created, it saves the order to PostgreSQL and publishes an `order.created` event to Kafka. We want to write integration tests for the `OrderService.createOrder()` method. We're using JUnit 5, Testcontainers, and Kafka. How should we structure these tests?"

**Output:**

## Integration Boundary Analysis

### Boundaries Identified
| Boundary | Owner | Risk Level | Recommended Strategy |
|----------|-------|------------|---------------------|
| OrderService -> PostgreSQL | Our team | High | Testcontainers (postgres:16.2) |
| OrderService -> Kafka | Our team | High | Testcontainers (confluentinc/cp-kafka:7.6.1) |

### Test Infrastructure Requirements
- Container dependencies: `postgres:16.2`, `confluentinc/cp-kafka:7.6.1`
- Test framework: JUnit 5, Spring Boot Test
- Key libraries: Testcontainers 1.19+, Awaitility 4.2+, spring-kafka-test, Flyway (schema migration)

---

## Test Structure

### Isolation Strategy
Per-test transaction rollback for all tests that do not test commit semantics. Because `createOrder()` publishes to Kafka (which is not transaction-scoped with the DB), use schema-per-test-class isolation with real commits for this service.

Rationale: The Kafka publish happens after the DB commit. A rollback-based approach would roll back the DB write after the Kafka message is already published, making the assertion impossible to write correctly.

### Data Seeding Approach
Builder pattern for `Order` and `Customer` domain objects. Seed a valid customer row in `@BeforeEach`. Each test creates its own `Order` with test-specific values.

### Async Handling
Kafka consumer timeout: 5000ms | Polling interval: 100ms | Library: Awaitility 4.2

---

## Implementation

### Container Setup

```java
@SpringBootTest
@Testcontainers
@ActiveProfiles("integration-test")
class OrderServiceIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres =
        new PostgreSQLContainer<>("postgres:16.2")
            .withDatabaseName("orders_test")
            .withUsername("test")
            .withPassword("test")
            .withReuse(true);  // reuse across runs when TESTCONTAINERS_REUSE_ENABLE=true

    @Container
    static KafkaContainer kafka =
        new KafkaContainer(DockerImageName.parse("confluentinc/cp-kafka:7.6.1"))
            .withReuse(true);

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.kafka.bootstrap-servers", kafka::getBootstrapServers);
    }

    @Autowired
    private OrderService orderService;

    @Autowired
    private OrderRepository orderRepository;

    // In-process Kafka consumer to capture published events
    private KafkaTestConsumer<String, OrderCreatedEvent> eventConsumer;

    private static final String CUSTOMER_ID = "cust-001";
    private static final String OUTPUT_TOPIC = "order.created";

    @BeforeEach
    void setUp(@Autowired EmbeddedKafkaBroker embeddedKafka) {
        // Subscribe to output topic BEFORE any action is taken
        eventConsumer = new KafkaTestConsumer<>(
            kafka.getBootstrapServers(),
            "test-group-" + UUID.randomUUID(),  // unique group per test
            OUTPUT_TOPIC,
            OrderCreatedEvent.class
        );

        // Seed prerequisite customer row
        jdbcTemplate.update(
            "INSERT INTO customers (id, name, email, status) VALUES (?, ?, ?, ?)",
            CUSTOMER_ID, "Alice Test", "alice@example.com", "ACTIVE"
        );
    }

    @AfterEach
    void tearDown() {
        eventConsumer.close();
        // Schema-per-test-class: truncate owned tables in reverse FK order
        jdbcTemplate.execute("TRUNCATE TABLE order_items CASCADE");
        jdbcTemplate.execute("TRUNCATE TABLE orders CASCADE");
        jdbcTemplate.execute("TRUNCATE TABLE customers CASCADE");
    }
```

### Representative Test Cases

```java
    // Test 1: Happy path -- order saved and event published
    @Test
    @DisplayName("createOrder saves order to DB and publishes order.created event")
    void createOrder_happyPath_persistsAndPublishesEvent() {
        // Arrange
        CreateOrderRequest request = CreateOrderRequest.builder()
            .customerId(CUSTOMER_ID)
            .items(List.of(
                new OrderItem("sku-abc", 2, new BigDecimal("14.99")),
                new OrderItem("sku-xyz", 1, new BigDecimal("9.99"))
            ))
            .build();

        // Act
        OrderResult result = orderService.createOrder(request);

        // Assert -- return value
        assertThat(result.getOrderId()).isNotNull();
        assertThat(result.getStatus()).isEqualTo(OrderStatus.CONFIRMED);
        assertThat(result.getTotalAmount()).isEqualByComparingTo(new BigDecimal("39.97"));

        // Assert -- database state (not just the return value)
        Optional<Order> savedOrder = orderRepository.findById(result.getOrderId());
        assertThat(savedOrder).isPresent();
        assertThat(savedOrder.get().getCustomerId()).isEqualTo(CUSTOMER_ID);
        assertThat(savedOrder.get().getItems()).hasSize(2);
        assertThat(savedOrder.get().getCreatedAt()).isNotNull();

        // Assert -- Kafka event published (async, with Awaitility)
        await()
            .atMost(5, SECONDS)
            .pollInterval(100, MILLISECONDS)
            .untilAsserted(() -> {
                List<OrderCreatedEvent> events = eventConsumer.getReceivedMessages();
                assertThat(events).hasSize(1);
                OrderCreatedEvent event = events.get(0);
                assertThat(event.getOrderId()).isEqualTo(result.getOrderId());
                assertThat(event.getCustomerId()).isEqualTo(CUSTOMER_ID);
                assertThat(event.getTotalAmount()).isEqualByComparingTo(new BigDecimal("39.97"));
                assertThat(event.getTimestamp()).isNotNull();
            });
    }

    // Test 2: Customer not found -- no DB write, no event
    @Test
    @DisplayName("createOrder throws CustomerNotFoundException when customer does not exist")
    void createOrder_unknownCustomer_throwsAndDoesNotPublish() {
        // Arrange
        CreateOrderRequest request = CreateOrderRequest.builder()
            .customerId("cust-nonexistent")
            .items(List.of(new OrderItem("sku-abc", 1, new BigDecimal("14.99"))))
            .build();

        // Act + Assert -- exception thrown
        assertThatThrownBy(() -> orderService.createOrder(request))
            .isInstanceOf(CustomerNotFoundException.class)
            .hasMessageContaining("cust-nonexistent");

        // Assert -- nothing written to DB
        assertThat(orderRepository.findByCustomerId("cust-nonexistent")).isEmpty();

        // Assert -- no event published (wait briefly to catch spurious publishes)
        await()
            .during(500, MILLISECONDS)
            .atMost(600, MILLISECONDS)
            .untilAsserted(() ->
                assertThat(eventConsumer.getReceivedMessages()).isEmpty()
            );
    }

    // Test 3: Constraint violation -- empty item list
    @Test
    @DisplayName("createOrder rejects order with no items and does not publish event")
    void createOrder_emptyItems_throwsValidationException() {
        CreateOrderRequest request = CreateOrderRequest.builder()
            .customerId(CUSTOMER_ID)
            .items(Collections.emptyList())
            .build();

        assertThatThrownBy(() -> orderService.createOrder(request))
            .isInstanceOf(InvalidOrderException.class);

        // Verify no partial write
        long orderCount = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM orders WHERE customer_id = ?",
            Long.class, CUSTOMER_ID
        );
        assertThat(orderCount).isZero();
    }

    // Test 4: Idempotency -- same idempotency key, second call returns same result
    @Test
    @DisplayName("createOrder is idempotent when called twice with the same idempotency key")
    void createOrder_duplicateIdempotencyKey_returnsFirstResultAndPublishesOneEvent() {
        String idempotencyKey = UUID.randomUUID().toString();
        CreateOrderRequest request = CreateOrderRequest.builder()
            .customerId(CUSTOMER_ID)
            .idempotencyKey(idempotencyKey)
            .items(List.of(new OrderItem("sku-abc", 1, new BigDecimal("14.99"))))
            .build();

        // Act -- call twice with same key
        OrderResult first = orderService.createOrder(request);
        OrderResult second = orderService.createOrder(request);

        // Assert -- both return the same order
        assertThat(second.getOrderId()).isEqualTo(first.getOrderId());
        assertThat(second.getTotalAmount()).isEqualByComparingTo(first.getTotalAmount());

        // Assert -- only one row in DB
        long orderCount = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM orders WHERE customer_id = ?",
            Long.class, CUSTOMER_ID
        );
        assertThat(orderCount).isOne();

        // Assert -- only one Kafka event published (not two)
        await()
            .atMost(5, SECONDS)
            .pollInterval(100, MILLISECONDS)
            .untilAsserted(() ->
                assertThat(eventConsumer.getReceivedMessages()).hasSize(1)
            );
    }

    // Test 5: Database constraint -- duplicate order ID generation (adversarial)
    @Test
    @DisplayName("createOrder handles ID collision gracefully by retrying")
    void createOrder_idCollision_retriesAndSucceeds() {
        // Pre-insert an order with a known UUID to force a collision on first attempt
        String collidingId = "order-collision-001";
        jdbcTemplate.update(
            "INSERT INTO orders (id, customer_id, status, total_amount, created_at) VALUES (?, ?, ?, ?, ?)",
            collidingId, CUSTOMER_ID, "CONFIRMED", new BigDecimal("5.00"), Instant.now()
        );

        // Mock the ID generator to return the colliding ID first, then a fresh ID
        // (assumes OrderIdGenerator is injectable)
        when(orderIdGenerator.generate())
            .thenReturn(collidingId)
            .thenReturn("order-fresh-002");

        CreateOrderRequest request = CreateOrderRequest.builder()
            .customerId(CUSTOMER_ID)
            .items(List.of(new OrderItem("sku-abc", 1, new BigDecimal("14.99"))))
            .build();

        OrderResult result = orderService.createOrder(request);

        assertThat(result.getOrderId()).isEqualTo("order-fresh-002");
        assertThat(orderRepository.findById("order-fresh-002")).isPresent();
    }
```

### Anti-Patterns Deliberately Avoided

- No `Thread.sleep()` -- all async assertions use Awaitility with 5s timeout and 100ms polling
- No H2 in-memory database -- `postgres:16.2` container ensures real constraint and query behavior
- No hard-coded port 5432 -- `@DynamicPropertySource` reads `postgres.getJdbcUrl()` dynamically
- No `latest` image tags -- pinned to `postgres:16.2` and `confluentinc/cp-kafka:7.6.1`
- No assertion on return value alone -- both DB state and Kafka event are explicitly asserted
- No shared Kafka consumer group across tests -- group ID includes `UUID.randomUUID()` to prevent offset conflicts
- No `eventConsumer` subscription after Act -- subscription happens in `@BeforeEach`, before any action

---

## CI/CD Integration

| Tier | Tag | Max Duration | Trigger |
|------|-----|--------------|---------|
| Fast | `@Tag("fast-integration")` | 2 min | Every commit |
| Standard | `@Tag("integration")` | 10 min | Every PR |
| Slow | `@Tag("slow-integration")` | 20 min | Nightly / pre-merge to main |

These tests belong in the **Standard** tier -- run on every PR, not on every commit.

### Container Reuse Configuration

```bash
# Developer machine: add to ~/.testcontainers.properties
testcontainers.reuse.enable=true
```

```java
// In container definition:
new PostgreSQLContainer<>("postgres:16.2")
    .withReuse(true);  // label applied to container for reuse detection
```

```yaml
# CI agent: set environment variable
TESTCONTAINERS_REUSE_ENABLE: "true"
```

With reuse enabled, container startup drops from ~20s cold to ~200ms warm. On a suite of 50 integration tests, this saves 15+ minutes of CI time per run.
