---
name: php-testing-patterns
description: |
  Guides expert-level php testing patterns implementation: php and testing decision frameworks, production-ready patterns, and concrete templates for php testing patterns workflows.
  Use when the user asks about php testing patterns, php testing patterns configuration, or php best practices for php projects.
  Do NOT use when the user needs a different languages runtimes capability -- check sibling skills in the languages runtimes subcategory.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "php testing tdd"
  category: "software-engineering"
  subcategory: "languages-runtimes"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# PHP Testing Patterns

## When to Use

**Use this skill when:**
- User asks how to structure PHPUnit test classes, test suites, or test configuration for a PHP project
- User wants to implement TDD, BDD, or mutation testing workflows in a PHP codebase
- User needs guidance on mocking, stubbing, or faking dependencies in PHP using PHPUnit, Mockery, or Prophecy
- User asks about test doubles, data providers, test isolation, or avoiding shared state between tests
- User wants to add testing to an existing Laravel, Symfony, Slim, or plain PHP application
- User is asking about code coverage targets, mutation score thresholds, or CI integration for PHP tests
- User needs to test infrastructure concerns in PHP -- database repositories, HTTP clients, queue consumers, file system operations
- User asks about Pest PHP, Behat, Codeception, or how to choose between PHP testing frameworks

**Do NOT use this skill when:**
- User needs frontend JavaScript testing for a PHP application -- use a JavaScript testing skill
- User is asking about API contract testing with OpenAPI or Pact -- check the contract testing skill
- User needs load or performance testing tools like k6 or Gatling -- those are separate concerns
- User is asking about PHP static analysis with PHPStan or Psalm -- use the PHP static analysis skill
- User needs CI/CD pipeline configuration that goes beyond test execution -- check the CI/CD pipeline skill
- User is asking about general PHP architecture patterns without a testing angle -- check the PHP architecture skill
- User wants database schema migration tooling -- that is separate from testing the data layer

---

## Process

### 1. Assess the PHP Project Context

Before recommending any testing pattern, gather the following specific information:

- **Framework in use:** Laravel, Symfony, Slim, WordPress, or framework-free. Each has idiomatic test helpers and base classes that change what you scaffold.
- **PHP version:** PHP 8.0+ enables named arguments, attributes, and match expressions that affect how test data providers are declared. PHP 7.4 projects cannot use these idioms.
- **Existing test coverage:** Run `./vendor/bin/phpunit --coverage-text` to get the current line, method, and class coverage. If coverage is zero, start with integration tests for the most business-critical path before writing unit tests.
- **Dependency injection style:** Constructor injection makes mocking trivial. Service locator or static facades (Laravel) require specific helpers like `app()->instance()` or `Mockery::mock()` bound to the container.
- **Test execution time:** Run `./vendor/bin/phpunit --log-junit test-results.xml` and inspect slow tests. If the suite takes more than 90 seconds locally, the team will skip it. Identify the slow subset and isolate it.
- **Database interaction:** Determine whether the codebase uses an ORM (Eloquent, Doctrine), raw PDO, or a query builder. Each requires different database testing strategies -- in-memory SQLite, transactions with rollback, or a dedicated test database with fixtures.

### 2. Select the Testing Framework and Toolchain

PHP has a settled ecosystem. Make concrete choices, not generic ones:

- **PHPUnit 10/11:** The standard. Use it unless the team explicitly prefers Pest. PHPUnit 10 dropped legacy annotations in favor of PHP 8 attributes (`#[Test]`, `#[DataProvider]`, `#[Before]`). All new projects should target PHPUnit 11.
- **Pest PHP 2/3:** A wrapper over PHPUnit with a functional API. Use it when the team comes from a JavaScript/Ruby background, when tests read as specifications, or when the codebase is Laravel-first. Pest's `it()` and `describe()` blocks map directly to Gherkin-style thinking without requiring Behat.
- **Mockery 1.6+:** Prefer over PHPUnit's built-in mock objects for complex interaction expectations. PHPUnit mocks are verbose for chained methods and partial mocks. Mockery's `shouldReceive()->once()->with()->andReturn()` chain is more readable.
- **Prophecy:** Bundled with older PHPUnit versions. Avoid in new projects -- Mockery is more actively maintained and integrates better with Pest.
- **Codeception:** Use only when end-to-end acceptance tests against a real browser (via Selenium or Playwright PHP bindings) are required. It is overkill for unit and integration testing.
- **Infection PHP (mutation testing):** Install as a dev dependency. Target a mutation score indicator (MSI) above 70% for critical domain logic. Run it in CI on changed files only, not the entire suite.
- **php-code-coverage with Xdebug or PCOV:** PCOV is 3--5x faster than Xdebug for coverage collection and does not require the full debugger extension. Use PCOV in CI; use Xdebug locally only when debugging.

Install the recommended baseline:
```bash
composer require --dev phpunit/phpunit:^11 mockery/mockery:^1.6 fakerphp/faker:^1.23 infection/infection:^0.29
```

### 3. Establish the Test Directory Structure

A well-organized test directory prevents the most common long-term maintenance problems:

```
tests/
  Unit/
    Domain/
      Order/
        OrderTest.php
        OrderItemTest.php
      Pricing/
        DiscountCalculatorTest.php
    Application/
      CreateOrderHandlerTest.php
  Integration/
    Repository/
      OrderRepositoryTest.php
    Http/
      OrderControllerTest.php
  Fixture/
    Factory/
      OrderFactory.php
    Stubs/
      stripe_charge_success.json
  Support/
    TestCase.php
    DatabaseTestCase.php
    HttpTestCase.php
```

Key rules for this structure:
- `Unit/` tests have zero I/O. No database, no HTTP, no filesystem. They must run in under 5ms each.
- `Integration/` tests touch real infrastructure -- a test database, a real HTTP client pointed at a wiremock server, or a real filesystem in `/tmp`.
- `Fixture/` holds stateless factory objects and static stub files. Never embed fixture data inside test methods.
- `Support/` holds abstract base test cases with setup helpers, not generic traits that leak state.

Configure `phpunit.xml` to map test suites explicitly:
```xml
<testsuites>
  <testsuite name="Unit">
    <directory>tests/Unit</directory>
  </testsuite>
  <testsuite name="Integration">
    <directory>tests/Integration</directory>
  </testsuite>
</testsuites>
```

This allows `./vendor/bin/phpunit --testsuite Unit` to run only fast tests in pre-commit hooks.

### 4. Implement Core Unit Testing Patterns

Unit tests in PHP follow these concrete patterns:

**Arrange-Act-Assert (AAA) with strict naming:**
```php
#[Test]
public function it_applies_percentage_discount_to_subtotal(): void
{
    // Arrange
    $calculator = new DiscountCalculator();
    $order = new Order(subtotal: Money::of(10000, 'USD')); // $100.00

    // Act
    $result = $calculator->apply(new PercentageDiscount(rate: 0.10), $order);

    // Assert
    $this->assertEquals(Money::of(9000, 'USD'), $result->discountedTotal());
}
```

**Data providers for boundary testing:**
```php
#[DataProvider('discountBoundaryProvider')]
#[Test]
public function it_clamps_discount_to_item_subtotal(int $discountCents, int $expectedCents): void
{
    $result = $this->calculator->apply(
        new FixedDiscount(Money::of($discountCents, 'USD')),
        new Order(subtotal: Money::of(500, 'USD'))
    );
    $this->assertEquals(Money::of($expectedCents, 'USD'), $result->discountedTotal());
}

public static function discountBoundaryProvider(): array
{
    return [
        'discount less than subtotal'  => [200, 300],
        'discount equal to subtotal'   => [500, 0],
        'discount greater than subtotal' => [700, 0],
    ];
}
```

**Test doubles -- choosing the right one:**
- **Stub:** Returns a fixed value. Use when the return value drives the unit under test's behavior but you do not care how many times it is called.
- **Mock:** Asserts interaction. Use when the purpose of the unit is to call a collaborator correctly -- for example, ensuring an event is dispatched.
- **Spy:** Records calls for later assertion. Use with Mockery's `shouldHaveReceived()` for post-act verification, which reads more naturally.
- **Fake:** A real, working implementation without side effects. Use for repositories -- an `InMemoryOrderRepository` that stores in an array is faster and more realistic than a mock.

```php
// Mock -- assert the event IS dispatched
$eventBus = Mockery::mock(EventBusInterface::class);
$eventBus->shouldReceive('dispatch')
    ->once()
    ->with(Mockery::type(OrderPlacedEvent::class));

// Fake -- test repository behavior without a database
$repository = new InMemoryOrderRepository();
$handler = new CreateOrderHandler($repository, $eventBus);
$handler->handle(new CreateOrderCommand(...));
$this->assertCount(1, $repository->all());
```

### 5. Implement Integration Testing Patterns

Integration tests require special infrastructure management:

**Database integration tests -- transaction rollback strategy:**
```php
abstract class DatabaseTestCase extends TestCase
{
    protected PDO $pdo;

    protected function setUp(): void
    {
        parent::setUp();
        $this->pdo = DatabaseConnection::get();
        $this->pdo->beginTransaction();
    }

    protected function tearDown(): void
    {
        $this->pdo->rollBack();
        parent::tearDown();
    }
}
```
This pattern runs each test in an uncommitted transaction. It is 10--20x faster than truncating tables between tests and does not require a test-specific database schema reset.

**HTTP integration tests -- use an in-process client:**
In Laravel, use `$this->getJson('/api/orders')` which invokes the kernel without a real HTTP socket. In Symfony, use `$this->client->request('GET', '/api/orders')` from `WebTestCase`. Never fire real HTTP requests from unit or integration tests -- use a real HTTP client only in acceptance tests.

**Doctrine/ORM integration tests:**
Use an in-memory SQLite database for Doctrine integration tests when the schema does not use MySQL-specific features. Configure a separate `test` entity manager that uses `doctrine/dbal` SQLite:
```yaml
# config/test/doctrine.yaml
doctrine:
  dbal:
    url: 'sqlite:///%kernel.project_dir%/var/test.db'
  orm:
    auto_schema_tool: create
```

For tests that require MySQL-specific behavior (JSON columns, full-text search), provision a real MySQL container in CI using Docker Compose and `depends_on` health checks.

**Wiremock / HTTP stub servers:**
When testing code that calls external APIs, do not use Mockery to mock the HTTP client interface. Instead, use a real HTTP server stub. PHPUnit has no built-in server stub, but you can use the `wiremock-php` package or a simple PHP built-in server fixture. This catches serialization bugs, header handling, and timeout behavior that interface mocks cannot.

### 6. Apply Object Mother and Test Builder Patterns

Hardcoded test data scattered across test methods is the most common cause of brittle test suites. Use these two patterns:

**Object Mother** -- a factory class that returns pre-configured domain objects:
```php
final class OrderMother
{
    public static function placed(): Order
    {
        return new Order(
            id: OrderId::generate(),
            customerId: CustomerId::fromString('cust-001'),
            items: [OrderItemMother::oneUnit()],
            status: OrderStatus::PLACED,
            placedAt: new DateTimeImmutable('2024-01-15 10:00:00'),
        );
    }

    public static function withItems(OrderItem ...$items): Order
    {
        return new Order(
            id: OrderId::generate(),
            customerId: CustomerId::fromString('cust-001'),
            items: $items,
            status: OrderStatus::DRAFT,
            placedAt: null,
        );
    }
}
```

**Test Builder** -- a fluent builder for tests that need precise control:
```php
final class OrderBuilder
{
    private CustomerId $customerId;
    private array $items = [];
    private OrderStatus $status = OrderStatus::DRAFT;

    public static function anOrder(): self
    {
        return new self();
    }

    public function withCustomer(string $id): self
    {
        $clone = clone $this;
        $clone->customerId = CustomerId::fromString($id);
        return $clone;
    }

    public function withItems(OrderItem ...$items): self
    {
        $clone = clone $this;
        $clone->items = $items;
        return $clone;
    }

    public function build(): Order
    {
        return new Order(
            id: OrderId::generate(),
            customerId: $this->customerId ?? CustomerId::fromString('cust-default'),
            items: $this->items,
            status: $this->status,
            placedAt: null,
        );
    }
}
```

Use the builder when a test cares about specific field values. Use the mother when a test just needs a valid object and does not care about its exact state.

### 7. Configure Coverage and Mutation Testing

**Coverage thresholds in phpunit.xml:**
```xml
<coverage>
  <report>
    <html outputDirectory="coverage"/>
    <clover outputFile="coverage.xml"/>
  </report>
  <include>
    <directory suffix=".php">src</directory>
  </include>
  <exclude>
    <directory>src/Infrastructure/Migrations</directory>
  </exclude>
</coverage>
<source>
  <include>
    <directory suffix=".php">src</directory>
  </include>
</source>
```

Set minimum coverage in CI, not in phpunit.xml, using `--coverage-text` output parsed by a shell assertion:
```bash
COVERAGE=$(./vendor/bin/phpunit --coverage-text | grep "Lines:" | head -1 | grep -o '[0-9]*\.[0-9]*%' | head -1)
```
Target 80% line coverage for application code. Do not target 100% -- the last 10--15% typically covers trivial getters, generated code, and defensive branches that are not worth the maintenance cost.

**Infection PHP mutation testing:**
```bash
./vendor/bin/infection --threads=4 --min-msi=70 --min-covered-msi=80 --filter=src/Domain
```

Key thresholds:
- MSI (Mutation Score Indicator) below 60%: test suite is not providing meaningful coverage -- add tests.
- MSI 60--75%: acceptable for application services and infrastructure.
- MSI 75--90%: target for domain model and business logic.
- MSI above 90%: likely over-tested; check if tests are asserting trivial implementation details.

Run Infection only against `src/Domain` and `src/Application` in CI. Infrastructure code (database adapters, HTTP controllers) has lower ROI for mutation testing.

### 8. Integrate with CI and Enforce Quality Gates

A complete PHP test CI step in GitHub Actions:

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: '8.3'
          extensions: pcov
          coverage: pcov
      - name: Install dependencies
        run: composer install --no-interaction --prefer-dist
      - name: Run unit tests
        run: ./vendor/bin/phpunit --testsuite Unit --coverage-clover coverage.xml
      - name: Run integration tests
        run: ./vendor/bin/phpunit --testsuite Integration
        env:
          DATABASE_URL: sqlite:///:memory:
      - name: Check coverage threshold
        run: |
          php -r "
            \$xml = simplexml_load_file('coverage.xml');
            \$lines = (float)\$xml->project->metrics['coveredstatements'] / (float)\$xml->project->metrics['statements'] * 100;
            if (\$lines < 80) { echo 'Coverage ' . round(\$lines, 1) . '% is below 80%'; exit(1); }
          "
      - name: Run mutation tests (domain only)
        run: ./vendor/bin/infection --threads=4 --min-msi=70 --filter=src/Domain --no-progress
```

---

## Output Format

When presenting a PHP testing recommendation to a user, use this structure:

```
## PHP Testing Assessment

### Project Context
- PHP Version: [version]
- Framework: [framework or "none"]
- Testing Framework: [PHPUnit version | Pest version]
- Current Coverage: [line % | "none"]
- Suite Execution Time: [seconds | "unknown"]

### Toolchain Decision

| Tool              | Chosen     | Alternative       | Reason for Choice                          |
|-------------------|------------|-------------------|--------------------------------------------|
| Test runner       | PHPUnit 11 | Pest 3            | [reason]                                   |
| Mocking           | Mockery    | PHPUnit built-in  | [reason]                                   |
| Coverage driver   | PCOV       | Xdebug            | [reason]                                   |
| Mutation testing  | Infection  | none              | [reason]                                   |
| Fixture strategy  | Object Mother + Builder | Faker-only | [reason]                          |

### Directory Structure
[Annotated directory tree for this project's test layout]

### Pattern Recommendations

#### Unit Tests
- [specific pattern with code snippet]

#### Integration Tests
- [specific pattern with infrastructure setup detail]

#### Coverage Targets
- Domain layer: [MSI target]% mutation score
- Application layer: [line coverage]%
- Infrastructure layer: [line coverage]%

### phpunit.xml Configuration
[Complete phpunit.xml for this project]

### CI Integration
[Relevant CI step for this project's environment]

### Next Steps (Prioritized)
1. [First action -- most impactful, least effort]
2. [Second action]
3. [Third action]
```

---

## Rules

1. **Never mock what you do not own.** Do not mock third-party library classes (e.g., Guzzle `Client`, Doctrine `EntityManager`). Wrap them in your own interface and mock the interface. This prevents your tests from asserting on library internals that change between library versions.

2. **Never test private methods directly.** If a private method is complex enough to test, it belongs in a separate class. Testing private methods via reflection creates tests that are tightly coupled to implementation, not behavior.

3. **Never share mutable state between tests.** Static properties, global state, and `$_SERVER`/`$_GET` superglobals mutated in one test will corrupt later tests. Use `setUp()` and `tearDown()` to restore state. Call `Mockery::close()` in `tearDown()` to prevent Mockery expectation leaks.

4. **Never use `@covers` annotations as a proxy for real coverage.** The `@covers` annotation in PHPUnit restricts coverage reporting to specified classes, hiding gaps. It provides false confidence. Remove `@covers` from all tests and let the `<include>` source directive in `phpunit.xml` define coverage scope.

5. **Data provider methods must be static.** As of PHPUnit 10, data provider methods that are not declared `static` throw a deprecation warning. They will fail in PHPUnit 12. Enforce `static` on all `#[DataProvider]` methods from day one.

6. **Integration tests that touch a database must clean up unconditionally.** Use `try/finally` or the transaction rollback pattern in `tearDown()`. If a test throws an exception mid-execution, `tearDown()` is still called, but only if the cleanup is in `tearDown()` -- not in an ad hoc method called at the end of the test.

7. **Assertions must assert behavior, not implementation.** Asserting `$this->assertCount(3, $spy->calls)` is an implementation assertion. Asserting `$this->assertEquals(Money::of(2700, 'USD'), $result->total())` is a behavior assertion. Behavioral assertions survive refactoring; implementation assertions do not.

8. **Test names must describe the behavior being verified.** Method names like `testCalculate()` or `test1()` are worthless. Names must follow `it_[verb]_[condition]_[expected_outcome]` or `given_[context]_when_[action]_then_[result]`. PHPUnit prints the method name on failure -- that name is the only context a future developer has without reading the test body.

9. **Never use `sleep()` or `time()` directly in tests.** Inject a `ClockInterface` (PSR-20) into any class that depends on the current time, and use a `FrozenClock` or `MockClock` in tests. Tests that call `sleep()` are slow and non-deterministic in CI environments under load.

10. **Enforce test isolation at the suite level, not through test ordering.** Never rely on a specific test execution order to make the suite pass. PHPUnit can randomize test order with `--order-by=random` -- run this in CI to catch hidden ordering dependencies. A suite that fails on random order has hidden shared state bugs.

---

## Edge Cases

### Legacy Codebase With No Dependency Injection

Many PHP codebases use `new` inside methods, static calls (`Model::find()`), or global function calls (`curl_exec()`). You cannot mock these directly.

**Handling approach:**
- Introduce a thin adapter class that wraps the static or global call. For example, wrap `curl_exec()` behind a `HttpClientInterface`. Then mock the interface.
- For Eloquent static calls in Laravel, use `Model::shouldReceive()` (via `mockery/mockery` integration with the service container) rather than mocking the model class directly.
- Apply the Mikado method: draw a dependency graph of what needs to change to make a class testable, then make changes from the leaves inward. Do not start by changing the class under test -- start with its dependencies.
- If the class cannot be refactored immediately, write a characterization test (also called a Golden Master test): capture the current output, assert the output does not change, then refactor knowing you will catch regressions.

### Tests That Depend on the Current Date or Time

Tests that call `new DateTime('now')`, `time()`, or `Carbon::now()` directly will produce different results depending on when they run. This causes intermittent CI failures, especially for tests that check expiry logic, scheduling, or age calculations.

**Handling approach:**
- Extract a `ClockInterface` with a `now(): DateTimeImmutable` method.
- Inject it into all classes that need the current time.
- In tests, use a `FrozenClock('2024-03-15 12:00:00')` that always returns the same timestamp.
- For Laravel Carbon, call `Carbon::setTestNow('2024-03-15 12:00:00')` in `setUp()` and `Carbon::setTestNow(null)` in `tearDown()`.
- Never test for "greater than now" -- always test for exact equality with a known frozen time.

### Testing Event-Driven or Async Code

PHP is primarily synchronous, but applications that use queues (Laravel Queues, Symfony Messenger, RabbitMQ consumers) need to test handler logic without a running broker.

**Handling approach:**
- Test the message handler class as a pure unit test, injecting fake dependencies. The handler receives a message DTO and produces side effects -- test those side effects.
- For dispatch-side testing in Laravel, use `Queue::fake()` and assert `Queue::assertPushed(ProcessOrderJob::class)`. This asserts the dispatch without processing.
- For Symfony Messenger, use `InMemoryTransport` in the test environment and call `$messageBus->dispatch()` -- the transport stores the message synchronously for inspection.
- Never write tests that start a real queue worker process. Those are acceptance tests, not unit or integration tests.

### Flaky Tests From Database Sequence or Auto-Increment IDs

Tests that assert on auto-increment IDs (e.g., `$this->assertEquals(1, $order->id)`) will fail when tests run in different orders, when other tests insert rows first, or when sequences are not reset.

**Handling approach:**
- Never assert on auto-increment integer IDs. Use UUIDs or ULIDs as entity identifiers in domain objects.
- If the existing schema uses integer IDs, assert on business keys (order reference numbers, customer emails) rather than database-generated IDs.
- For SQLite integration tests, use `PRAGMA auto_increment_reset` or drop and recreate the schema before each test class (not each test method -- schema recreation is slow at the method level).

### Testing File System Operations

Tests that read from or write to the actual filesystem create dependencies on the host environment, pollute the repository, and fail in parallel test execution when multiple workers write to the same path.

**Handling approach:**
- Use the `league/flysystem` filesystem abstraction in production code and inject the adapter. In tests, use `League\Flysystem\InMemory\InMemoryFilesystemAdapter`.
- If the code uses `file_get_contents` or `file_put_contents` directly, wrap it behind a `FileStorageInterface` and inject that.
- When a real filesystem must be used (testing file permissions, testing binary writes), use `sys_get_temp_dir() . '/' . uniqid('test_', true)` to create an isolated directory per test, and delete it in `tearDown()`.
- Never use hardcoded paths like `/tmp/test-output.csv`. Hardcoded paths fail in Docker containers where `/tmp` may not exist or may be read-only.

### High Test Execution Time in CI

If the full test suite takes more than 3 minutes in CI, developers stop running it locally and PRs accumulate undetected failures.

**Handling approach:**
- Profile with `./vendor/bin/phpunit --log-junit results.xml` and parse for tests exceeding 500ms. Each test above 500ms is a candidate for optimization.
- Separate the `Integration` and `Unit` suites. Run unit tests in pre-push hooks (target: under 15 seconds). Run integration tests only in CI.
- Use PHPUnit's `--processes` flag (via `paratest/paratest`) to run tests in parallel: `./vendor/bin/paratest --processes=4`. Paratest requires database isolation -- each process needs its own test database or must use SQLite in-memory.
- Cache Composer dependencies in CI using `composer install --prefer-dist --no-scripts --no-progress` and the `vendor/` directory cached by content hash of `composer.lock`.
- Use PCOV instead of Xdebug for coverage. PCOV adds roughly 10--20% overhead; Xdebug adds 200--400% overhead to test execution time.

### Circular Dependencies in Service Tests

Application service classes often depend on multiple repositories, event buses, and other services. Building the full dependency tree in a test becomes a 30-line `setUp()` method.

**Handling approach:**
- Create a `TestContainer` helper in `tests/Support/` that builds a pre-configured service with all fake dependencies wired in:
```php
final class TestContainer
{
    public static function orderService(): array
    {
        $repository = new InMemoryOrderRepository();
        $eventBus = new CollectingEventBus();
        $clock = new FrozenClock('2024-01-01');
        $service = new OrderService($repository, $eventBus, $clock);
        return [$service, $repository, $eventBus];
    }
}
```
- Return the service AND its fakes as a tuple so tests can inspect side effects on the fakes.
- Never rebuild this wiring in individual test classes -- if the constructor signature changes, you want one place to update.

---

## Example

**Input:** "I'm building a Laravel 11 application with PHP 8.3. We have an `OrderService` that places orders, applies discounts, and dispatches a `OrderPlacedEvent`. The class currently has no tests. We also call Stripe's API inside the service. How should I test this?"

**Output:**

## PHP Testing Assessment

### Project Context
- PHP Version: 8.3
- Framework: Laravel 11
- Testing Framework: PHPUnit 11 (Laravel default) -- consider Pest 3 if team prefers fluent syntax
- Current Coverage: 0% (no tests exist)
- Suite Execution Time: unknown -- establish baseline after first suite

### Problem Diagnosis

The `OrderService` has three testing problems that must be solved before writing any tests:

1. **Stripe API called directly inside the service** -- this is an untestable design. Stripe calls must be wrapped behind an interface.
2. **`OrderPlacedEvent` dispatched via Laravel's static `Event::dispatch()`** -- this requires either `Event::fake()` in Laravel integration tests or injecting an event dispatcher interface for unit tests.
3. **Discounting logic inside the service** -- this should be extracted to a `DiscountCalculator` value object so it can be unit tested in isolation.

### Step 1: Introduce the Stripe Adapter Interface

**Do not mock `\Stripe\StripeClient` directly.** Create:

```php
// src/Payment/PaymentGatewayInterface.php
interface PaymentGatewayInterface
{
    public function charge(Money $amount, string $customerId): ChargeResult;
}

// src/Payment/StripePaymentGateway.php
final class StripePaymentGateway implements PaymentGatewayInterface
{
    public function __construct(private readonly \Stripe\StripeClient $stripe) {}

    public function charge(Money $amount, string $customerId): ChargeResult
    {
        $charge = $this->stripe->charges->create([
            'amount'   => $amount->getMinorAmount()->toInt(),
            'currency' => strtolower($amount->getCurrency()->getCurrencyCode()),
            'customer' => $customerId,
        ]);
        return ChargeResult::fromStripeCharge($charge);
    }
}
```

Now `OrderService` accepts `PaymentGatewayInterface` via constructor injection, and tests inject a `FakePaymentGateway`.

### Step 2: Create the Fake Payment Gateway

```php
// tests/Support/Fake/FakePaymentGateway.php
final class FakePaymentGateway implements PaymentGatewayInterface
{
    private array $charges = [];
    private bool $shouldFail = false;

    public function charge(Money $amount, string $customerId): ChargeResult
    {
        if ($this->shouldFail) {
            throw new PaymentFailedException('Card declined (test)');
        }
        $result = ChargeResult::success(chargeId: 'ch_test_' . uniqid());
        $this->charges[] = ['amount' => $amount, 'customerId' => $customerId, 'result' => $result];
        return $result;
    }

    public function willFail(): void { $this->shouldFail = true; }

    public function lastCharge(): array { return end($this->charges); }

    public function chargeCount(): int { return count($this->charges); }
}
```

### Step 3: Write the Unit Tests

```php
// tests/Unit/Application/PlaceOrderHandlerTest.php

final class PlaceOrderHandlerTest extends TestCase
{
    private FakePaymentGateway $paymentGateway;
    private InMemoryOrderRepository $repository;
    private CollectingEventDispatcher $events;
    private PlaceOrderHandler $handler;

    protected function setUp(): void
    {
        $this->paymentGateway = new FakePaymentGateway();
        $this->repository     = new InMemoryOrderRepository();
        $this->events         = new CollectingEventDispatcher();
        $this->handler        = new PlaceOrderHandler(
            $this->repository,
            $this->paymentGateway,
            new DiscountCalculator(),
            $this->events,
            new FrozenClock('2024-03-15 10:00:00'),
        );
    }

    #[Test]
    public function it_places_an_order_and_charges_the_customer(): void
    {
        // Arrange
        $command = new PlaceOrderCommand(
            customerId: 'cust-123',
            items: [new OrderItemDto(sku: 'SKU-001', quantity: 2, unitPrice: Money::of(5000, 'USD'))],
            discountCode: null,
        );

        // Act
        $this->handler->handle($command);

        // Assert -- repository
        $orders = $this->repository->all();
        $this->assertCount(1, $orders);
        $this->assertEquals(Money::of(10000, 'USD'), $orders[0]->subtotal());

        // Assert -- payment
        $this->assertEquals(1, $this->paymentGateway->chargeCount());
        $this->assertEquals(Money::of(10000, 'USD'), $this->paymentGateway->lastCharge()['amount']);

        // Assert -- event dispatched
        $this->assertCount(1, $this->events->dispatched(OrderPlacedEvent::class));
    }

    #[Test]
    public function it_applies_percentage_discount_before_charging(): void
    {
        $command = new PlaceOrderCommand(
            customerId: 'cust-123',
            items: [new OrderItemDto(sku: 'SKU-001', quantity: 1, unitPrice: Money::of(10000, 'USD'))],
            discountCode: 'SAVE10', // 10% off
        );

        $this->handler->handle($command);

        $this->assertEquals(
            Money::of(9000, 'USD'),
            $this->paymentGateway->lastCharge()['amount']
        );
    }

    #[Test]
    public function it_does_not_persist_the_order_when_payment_fails(): void
    {
        $this->paymentGateway->willFail();
        $command = new PlaceOrderCommand(
            customerId: 'cust-123',
            items: [new OrderItemDto(sku: 'SKU-001', quantity: 1, unitPrice: Money::of(10000, 'USD'))],
            discountCode: null,
        );

        $this->expectException(PaymentFailedException::class);
        $this->handler->handle($command);

        $this->assertCount(0, $this->repository->all());
        $this->assertCount(0, $this->events->dispatched(OrderPlacedEvent::class));
    }

    #[Test]
    public function it_sets_placed_at_to_the_current_clock_time(): void
    {
        $command = new PlaceOrderCommand(
            customerId: 'cust-123',
            items: [new OrderItemDto(sku: 'SKU-001', quantity: 1, unitPrice: Money::of(5000, 'USD'))],
            discountCode: null,
        );

        $this->handler->handle($command);

        $order = $this->repository->all()[0];
        $this->assertEquals(
            new DateTimeImmutable('2024-03-15 10:00:00'),
            $order->placedAt()
        );
    }
}
```

### Step 4: Write the Discount Calculator Unit Tests

The discount calculator has clear boundaries -- extract and test independently:

```php
// tests/Unit/Domain/Pricing/DiscountCalculatorTest.php

final class DiscountCalculatorTest extends TestCase
{
    private DiscountCalculator $calculator;

    protected function setUp(): void
    {
        $this->calculator = new DiscountCalculator();
    }

    #[DataProvider('percentageDiscountProvider')]
    #[Test]
    public function it_calculates_percentage_discounts_correctly(
        int $subtotalCents,
        float $rate,
        int $expectedCents
    ): void {
        $result = $this->calculator->apply(
            new PercentageDiscount(rate: $rate),
            Money::of($subtotalCents, 'USD')
        );
        $this->assertEquals(Money::of($expectedCents, 'USD'), $result);
    }

    public static function percentageDiscountProvider(): array
    {
        return [
            '10% off $100.00'           => [10000, 0.10, 9000],
            '25% off $80.00'            => [8000,  0.25, 6000],
            '100% off (full discount)'  => [5000,  1.00, 0],
            '0% off (no discount)'      => [5000,  0.00, 5000],
            '10% off $0.01 (rounding)'  => [1,     0.10, 1],  // floor to minimum unit
        ];
    }
}
```

### Step 5: Write a Laravel Integration Test

Use Laravel's `RefreshDatabase` trait and `Event::fake()` for a higher-level integration test:

```php
// tests/Integration/Http/OrderControllerTest.php

final class OrderControllerTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function it_places_an_order_via_the_api(): void
    {
        Event::fake([OrderPlacedEvent::class]);

        // Bind a fake payment gateway in the service container
        $this->app->instance(PaymentGatewayInterface::class, new FakePaymentGateway());

        $customer = Customer::factory()->create();

        $response = $this->actingAs($customer)->postJson('/api/orders', [
            'items' => [
                ['sku' => 'SKU-001', 'quantity' => 1, 'unit_price_cents' => 5000],
            ],
        ]);

        $response->assertCreated()
                 ->assertJsonStructure(['id', 'total_cents', 'placed_at']);

        $this->assertDatabaseHas('orders', [
            'customer_id'    => $customer->id,
            'total_cents'    => 5000,
        ]);

        Event::assertDispatched(OrderPlacedEvent::class, function (OrderPlacedEvent $event) use ($customer): bool {
            return $event->customerId === (string) $customer->id;
        });
    }
}
```

### Step 6: Configure phpunit.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<phpunit xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:noNamespaceSchemaLocation="vendor/phpunit/phpunit/phpunit.xsd"
         bootstrap="vendor/autoload.php"
         colors="true"
         failOnRisky="true"
         failOnWarning="true">
  <testsuites>
    <testsuite name="Unit">
      <directory>tests/Unit</directory>
    </testsuite>
    <testsuite name="Integration">
      <directory>tests/Integration</directory>
    </testsuite>
  </testsuites>
  <source>
    <include>
      <directory suffix=".php">src</directory>
    </include>
    <exclude>
      <directory>src/Infrastructure/Migrations</directory>
      <directory>src/Infrastructure/Config</directory>
    </exclude>
  </source>
  <coverage>
    <report>
      <html outputDirectory="coverage"/>
      <clover outputFile="coverage.xml"/>
    </report>
  </coverage>
  <php>
    <env name="APP_ENV" value="testing"/>
    <env name="DB_CONNECTION" value="sqlite"/>
    <env name="DB_DATABASE" value=":memory:"/>
    <env name="CACHE_DRIVER" value="array"/>
    <env name="QUEUE_CONNECTION" value="sync"/>
  </php>
</phpunit>
```

### Coverage and Mutation Targets for This Project

| Layer                   | Tool       | Target     | Rationale                                                    |
|-------------------------|------------|------------|--------------------------------------------------------------|
| Domain (DiscountCalc)   | Infection  | MSI ≥ 80%  | Pure logic -- high mutation ROI                              |
| Application (Handler)   | PHPUnit    | Lines ≥ 85%| Business orchestration -- behavior tests cover all branches  |
| Infrastructure (Gateway)| PHPUnit    | Lines ≥ 60%| Adapter wraps external library -- focus on mapping logic     |
| HTTP Controllers        | PHPUnit    | Lines ≥ 70%| Integration tests cover the happy path and main error cases  |

### Next Steps (Prioritized)

1. **Introduce `PaymentGatewayInterface` and `FakePaymentGateway` today** -- this is blocking all meaningful unit tests for `PlaceOrderHandler`.
2. **Write `PlaceOrderHandlerTest` covering: success, discount application, payment failure** -- three tests, high business value, establishes the testing pattern for the team.
3. **Create `DiscountCalculatorTest` with the data provider** -- validates boundary logic and serves as the team's example of the data provider pattern.
4. **Add the `phpunit.xml` configuration above** -- establishes SQLite in-memory for integration tests and separates unit/integration suites.
5. **Add `CollectingEventDispatcher` and `InMemoryOrderRepository` fakes to `tests/Support/Fake/`** -- reusable across all future application service tests.
6. **Install and configure Infection PHP targeting `src/Domain`** -- run after coverage reaches 80% for domain layer; use `--min-msi=70` as initial gate.
