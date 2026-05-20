---
name: csharp-testing-patterns
description: |
  Guides expert-level C# testing: xUnit, Moq, FluentAssertions, WebApplicationFactory for integration testing, and test architecture patterns for .NET applications.
  Use when the user asks about C# testing, xUnit, Moq, FluentAssertions, WebApplicationFactory, .NET testing, integration testing.
  Do NOT use when the user asks about C# project setup (use `csharp-project-setup`), C# ASP.NET (use `csharp-aspnet-patterns`), general testing concepts (use `unit-testing-patterns`).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "csharp testing tdd"
  category: "software-engineering"
  subcategory: "languages-runtimes"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# C# Testing Patterns

## When to Use

**Use this skill when:**
- The user asks how to write unit tests for C# classes, services, or methods using xUnit, NUnit, or MSTest
- The user asks how to mock dependencies with Moq, NSubstitute, or FakeItEasy in .NET projects
- The user asks about FluentAssertions syntax, custom assertion chains, or assertion failure messages
- The user asks how to set up WebApplicationFactory for integration testing ASP.NET Core endpoints
- The user asks about test project structure, naming conventions, or test architecture in .NET solutions
- The user asks about data-driven tests, theory attributes, inline data, or member data in xUnit
- The user asks about test coverage tools, Coverlet configuration, or CI coverage gates in .NET
- The user asks how to test EF Core repositories with an in-memory database or SQLite test provider
- The user asks about testing background services, hosted services, or message consumers in .NET

**Do NOT use this skill when:**
- The user asks about setting up a new C# project, configuring .csproj files, or solution structure (use `csharp-project-setup`)
- The user asks about designing ASP.NET Core middleware, controllers, or the request pipeline outside of a testing context (use `csharp-aspnet-patterns`)
- The user asks about general testing theory, test pyramid concepts, or framework-agnostic TDD principles (use `unit-testing-patterns`)
- The user asks about performance benchmarking using BenchmarkDotNet -- that is a separate measurement discipline
- The user asks about load testing or stress testing with k6 or NBomber -- those are not unit/integration test concerns

---

## Process

### 1. Assess the Testing Scope and Classify Test Types

Before writing a single line of test code, determine which layer of the test pyramid the work lives in.

- **Pure domain logic** (calculators, validators, parsers, value objects): write fast, dependency-free unit tests. No mocks needed. These should run in under 1 ms each.
- **Classes with injected dependencies** (services, repositories, handlers): write unit tests using mock objects to isolate the subject under test. Every external collaborator is replaced.
- **Multiple real components collaborating** (e.g., a service + repository + EF Core context): write integration tests using real implementations with controlled infrastructure -- an in-memory or SQLite database, a test-specific IoC container.
- **HTTP API surface** (controllers, minimal API handlers, middleware): write integration tests using `WebApplicationFactory<TProgram>` to spin up the full ASP.NET Core pipeline in-process.
- **Message consumers, hosted services**: write integration tests with real or fake message bus implementations to test the full processing loop.
- Classify tests with a naming suffix or directory: `*.Unit.Tests`, `*.Integration.Tests`. Keep them in separate projects to allow selective CI execution.
- Never mix unit and integration tests in the same project -- they have different execution characteristics and infrastructure needs.

### 2. Configure the xUnit Project Correctly

xUnit is the dominant choice for .NET because of its parallelism model, extensibility, and lack of test-class-level shared mutable state.

- Add packages: `xunit`, `xunit.runner.visualstudio`, `Microsoft.NET.Test.Sdk`, `coverlet.collector`.
- For assertions: add `FluentAssertions` (version 6.x or later). Do NOT mix FluentAssertions with raw `Assert.*` calls in the same project -- choose one and commit.
- For mocking: add `Moq` (4.20+) or `NSubstitute` (5.x+). Moq uses a lambda-based setup API; NSubstitute uses a return-value interception style. Moq is more explicit and is preferred when teams need to verify call behavior. NSubstitute is preferred for readability when behavior verification is rare.
- Add `xunit.categories` or a `[Trait("Category", "Unit")]` helper to allow `dotnet test --filter Category=Unit` in CI.
- Set `<Nullable>enable</Nullable>` and `<ImplicitUsings>enable</ImplicitUsings>` in test projects -- same as production code.
- Configure `xunit.runner.json` for deterministic parallelism:

```json
{
  "parallelizeAssembly": true,
  "parallelizeTestCollections": true,
  "maxParallelThreads": 4
}
```

- Set `<IsPackable>false</IsPackable>` in every test `.csproj` to prevent accidental packaging.

### 3. Design the Test Class and Fixture Architecture

xUnit's lifecycle model differs from NUnit and MSTest. Understanding it prevents resource leaks and flaky tests.

- **Per-test setup** (cheapest, safest): put setup in the constructor of the test class. xUnit instantiates a new class instance for every `[Fact]`. This is the default and covers most unit test needs.
- **Shared setup across tests in one class**: implement `IClassFixture<TFixture>`. The fixture is constructed once per test class. Use this for expensive-to-create objects like `HttpClient` or database connections that are read-only during tests.
- **Shared setup across multiple test classes**: implement `ICollectionFixture<TFixture>` and annotate classes with `[Collection("CollectionName")]`. Use this for a shared in-memory database seeded once.
- **Teardown**: implement `IDisposable` or `IAsyncDisposable` on the fixture. Never rely on finalizers for test cleanup.
- Never put shared mutable state in a `IClassFixture` -- mutable shared fixtures cause test ordering dependencies. Keep fixtures immutable after construction.
- For async setup, use `IAsyncLifetime` (xUnit 2.x) or `InitializeAsync`/`DisposeAsync` from `IAsyncLifetime`.

```csharp
public class OrderServiceFixture : IAsyncLifetime
{
    public AppDbContext DbContext { get; private set; } = null!;

    public async Task InitializeAsync()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        DbContext = new AppDbContext(options);
        await DbContext.Database.EnsureCreatedAsync();
    }

    public async Task DisposeAsync() => await DbContext.DisposeAsync();
}
```

### 4. Write Unit Tests with Moq and FluentAssertions

Effective unit tests have three regions: Arrange, Act, Assert. Make these regions visible with blank lines or comments.

- **Naming**: use the pattern `MethodUnderTest_StateUnderTest_ExpectedBehavior`. Example: `ProcessOrder_WhenStockIsInsufficient_ThrowsInsufficientStockException`.
- **Moq setup**: use `Mock<T>()`. Call `mock.Setup(x => x.Method(It.IsAny<Type>())).Returns(value)` for return values. Use `mock.SetupAsync` for async methods returning `Task<T>`. Use `It.IsAny<T>()` for loose matching and `It.Is<T>(x => predicate)` for strict matching.
- **Moq verification**: call `mock.Verify(x => x.Method(It.Is<Order>(o => o.Id == expectedId)), Times.Once())` after the Act step. Always specify `Times.*` -- do not rely on default behavior for call count.
- **FluentAssertions**:
  - For exceptions: `action.Should().ThrowExactly<InsufficientStockException>().WithMessage("*stock*")`.
  - For collections: `result.Should().HaveCount(3).And.ContainSingle(x => x.IsApproved)`.
  - For objects: `result.Should().BeEquivalentTo(expected, opts => opts.Excluding(x => x.CreatedAt))` -- the `Excluding` option is essential for objects with auto-generated timestamps or IDs.
  - For async: `await act.Should().ThrowAsync<InvalidOperationException>()`.
- Avoid asserting on implementation details (private method calls, internal state). Assert on observable output and side effects via mocks.
- Each test should have exactly one logical assertion concept. It is acceptable to have multiple `Should()` calls if they all verify the same behavioral outcome.

```csharp
[Fact]
public async Task ProcessOrder_WhenStockIsInsufficient_ThrowsInsufficientStockException()
{
    // Arrange
    var inventoryService = new Mock<IInventoryService>();
    inventoryService
        .Setup(x => x.GetAvailableStockAsync(It.IsAny<Guid>()))
        .ReturnsAsync(0);

    var sut = new OrderService(inventoryService.Object);
    var order = OrderBuilder.Default().WithQuantity(5).Build();

    // Act
    Func<Task> act = () => sut.ProcessOrderAsync(order);

    // Assert
    await act.Should()
        .ThrowExactly<InsufficientStockException>()
        .WithMessage("*insufficient stock*");

    inventoryService.Verify(
        x => x.GetAvailableStockAsync(order.ProductId),
        Times.Once());
}
```

### 5. Use Theory Tests for Parameterized Cases

Avoid duplicating test logic by using `[Theory]` with data sources when the same behavior must be verified across multiple inputs.

- **`[InlineData]`**: for simple, primitive values known at compile time. Supports up to ~5 parameters before it becomes unreadable.
- **`[MemberData]`**: for complex objects or large data sets. Provide data via a `public static IEnumerable<object[]>` property or a `TheoryData<T1, T2>` typed collection (xUnit 2.7+). `TheoryData` is preferred because it is type-safe.
- **`[ClassData]`**: for cases where the data generation logic is complex enough to deserve its own class implementing `IEnumerable<object[]>`.
- Name the test with intent: `ValidateEmail_WithVariousFormats_ReturnsExpectedResult(string email, bool expected)`.
- Do not use `[Theory]` when the different inputs require fundamentally different assertions -- those should be separate `[Fact]` tests with descriptive names.
- Never put business logic in `[InlineData]` or `[MemberData]` expressions -- compute expected values from literals, not from the SUT.

```csharp
[Theory]
[MemberData(nameof(InvalidOrderData))]
public void CreateOrder_WithInvalidInput_ThrowsValidationException(
    string productId, int quantity, string expectedMessage)
{
    var act = () => Order.Create(productId, quantity);

    act.Should()
        .ThrowExactly<ValidationException>()
        .WithMessage(expectedMessage);
}

public static TheoryData<string, int, string> InvalidOrderData => new()
{
    { "", 1, "*product ID*" },
    { "SKU-001", 0, "*quantity must be positive*" },
    { "SKU-001", -5, "*quantity must be positive*" },
    { "SKU-001", 10_001, "*exceeds maximum*" }
};
```

### 6. Write Integration Tests with WebApplicationFactory

`WebApplicationFactory<TProgram>` bootstraps the full ASP.NET Core host in-process, including the DI container, middleware pipeline, and routing. This makes it ideal for testing controller behavior, middleware effects, and end-to-end request/response contracts.

- Reference `Microsoft.AspNetCore.Mvc.Testing` in the integration test project.
- Override `ConfigureWebHost` to replace real infrastructure with test doubles:

```csharp
public class TestWebAppFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureServices(services =>
        {
            // Replace real DbContext with SQLite in-memory
            var descriptor = services.SingleOrDefault(
                d => d.ServiceType == typeof(DbContextOptions<AppDbContext>));
            if (descriptor is not null) services.Remove(descriptor);

            services.AddDbContext<AppDbContext>(options =>
                options.UseSqlite("DataSource=:memory:"));

            // Replace real external HTTP client
            services.AddSingleton<IPaymentGateway, FakePaymentGateway>();
        });

        builder.UseEnvironment("Testing");
    }
}
```

- Use `IClassFixture<TestWebAppFactory>` to reuse the factory across tests in a class. Use `ICollectionFixture` to share it across multiple test classes.
- Seed the database in a `SeedAsync` helper called from `InitializeAsync` -- never seed from test code directly.
- Test authentication by calling `factory.WithWebHostBuilder(...)` to add a fake JWT scheme, or by implementing a `TestAuthHandler` that issues a claims principal for a known test user.
- Do not test validation logic, domain logic, or business rules through the HTTP layer -- use unit tests for those. Reserve `WebApplicationFactory` tests for: routing, authorization, request/response serialization, middleware effects, and cross-cutting concerns.
- Assert HTTP status codes, response headers, and JSON body using `System.Net.Http.Json` extensions: `await response.Content.ReadFromJsonAsync<OrderDto>()`.

### 7. Test EF Core Repositories and Data Access

EF Core provides specific test strategies. Choose based on what you need to validate.

- **In-memory provider** (`UseInMemoryDatabase`): fastest but does not enforce relational constraints (foreign keys, unique indexes). Safe only for testing LINQ query logic and basic CRUD. Never use it to verify constraint behavior.
- **SQLite in-memory** (`UseSqlite("DataSource=:memory:")`): enforces SQL constraints, supports transactions, requires migrations to be applied. This is the recommended approach for testing repository logic with realistic constraint behavior. Call `dbContext.Database.EnsureCreatedAsync()` after construction.
- **Real database via TestContainers**: use `Testcontainers.MsSqlServer` or `Testcontainers.PostgreSql` NuGet packages to spin up a real database in Docker for full fidelity. Apply migrations with `dbContext.Database.MigrateAsync()`. Slower but catches dialect-specific issues. Reserve for CI pipeline integration test runs.
- Always create a new `DbContext` instance per test to prevent change tracker contamination between tests.
- Never test EF Core internals -- test the behavior of your repository methods and the data they return.

### 8. Configure Coverage, Mutation Testing, and CI Gates

Coverage measurement is a safety net, not a goal. Use it to identify untested paths, not to chase 100%.

- Use `coverlet.collector` (included in the xUnit project template) for coverage collection: `dotnet test --collect:"XPlat Code Coverage"`.
- Generate reports with `ReportGenerator`: `dotnet reportgenerator -reports:coverage.xml -targetdir:coveragereport -reporttypes:Html`.
- Set realistic branch coverage thresholds in CI: 80% for established codebases, 70% for new projects under active development. Never gate on line coverage alone -- branch coverage is more meaningful.
- Exclude from coverage: `[assembly: ExcludeFromCodeCoverage]` on auto-generated code, migrations, program entry points, and pure DTOs.
- For deeper quality validation, add `Stryker.NET` (mutation testing). Run `dotnet-stryker` to introduce mutations and verify tests catch them. A mutation score below 60% indicates tests are not verifying behavior.
- In CI (GitHub Actions example):

```yaml
- name: Run Tests with Coverage
  run: dotnet test --configuration Release --collect:"XPlat Code Coverage" --results-directory ./coverage

- name: Check Coverage Threshold
  run: |
    dotnet reportgenerator \
      -reports:./coverage/**/coverage.cobertura.xml \
      -targetdir:./coverage/report \
      -reporttypes:Cobertura
    # Fail if branch coverage < 80%
    python scripts/check_coverage.py --threshold 80
```

---

## Output Format

When helping a user implement or review C# testing patterns, produce output in this structure:

```
## Test Architecture Decision

**Test Type:** [Unit | Integration | Component]
**Subject Under Test:** [ClassName.MethodName or API endpoint]
**Dependencies Identified:** [list all injected dependencies]
**Mocking Strategy:** [Mock with Moq | Fake implementation | In-memory DB | WebApplicationFactory]

---

## Test Project Configuration

### Packages (add to .csproj)
| Package | Version | Purpose |
|---------|---------|---------|
| xunit | 2.9.x | Test runner and attributes |
| xunit.runner.visualstudio | 2.8.x | VS Test Explorer integration |
| Microsoft.NET.Test.Sdk | 17.x | dotnet test CLI support |
| FluentAssertions | 6.12.x | Readable assertion API |
| Moq | 4.20.x | Mock object framework |
| coverlet.collector | 6.x | Code coverage collection |
| Microsoft.AspNetCore.Mvc.Testing | 8.x | WebApplicationFactory (integration only) |

---

## Test Class Structure

```csharp
// [naming: {ProjectName}.Tests/{Layer}/{ClassName}Tests.cs]

public class [ClassName]Tests : IClassFixture<[FixtureType]>   // omit fixture if not needed
{
    // Dependencies
    private readonly Mock<[IDependency]> _mockDependency;
    private readonly [ClassName] _sut;  // "sut" = system under test

    public [ClassName]Tests()
    {
        _mockDependency = new Mock<[IDependency]>();
        _sut = new [ClassName](_mockDependency.Object);
    }

    // Test methods follow naming: MethodName_State_ExpectedOutcome
    [Fact]
    public async Task MethodName_WhenCondition_ExpectedBehavior()
    {
        // Arrange
        // Act
        // Assert (FluentAssertions)
    }
}
```

---

## Coverage Configuration (Directory.Build.props or .csproj)

```xml
<PropertyGroup>
  <CollectCoverage>true</CollectCoverage>
  <CoverletOutputFormat>cobertura</CoverletOutputFormat>
  <Threshold>80</Threshold>
  <ThresholdType>branch</ThresholdType>
  <ExcludeByAttribute>ExcludeFromCodeCoverage,GeneratedCode</ExcludeByAttribute>
  <Exclude>[*.Migrations]*,[*.Program]*</Exclude>
</PropertyGroup>
```
```

---

## Rules

1. **Never use `[SetUp]`/`[TearDown]` attribute patterns from NUnit in xUnit.** xUnit has no `[SetUp]` attribute. Setup goes in the constructor; teardown goes in `IDisposable.Dispose()`. Mixing NUnit patterns in xUnit breaks the test lifecycle model.

2. **Never use `Mock<T>()` with `MockBehavior.Loose` when behavior verification matters.** `MockBehavior.Strict` causes unset calls to throw immediately, surfacing unexpected interactions. Use `Strict` for service orchestrators where unexpected calls indicate a design problem, and `Loose` only for pure data-access mocks.

3. **Never share `Mock<T>` instances between tests via static fields.** Each test must construct its own mocks. Shared mocks accumulate state across tests (setup calls stack, verification counters accumulate), causing false passes and order-dependent failures.

4. **Never use `Thread.Sleep` or `Task.Delay` as synchronization primitives.** Async code must be tested with `async Task` test methods. Use `await` throughout. If testing time-dependent behavior, inject `TimeProvider` (from .NET 8) or `IClock` abstraction and control time in tests.

5. **Always use `BeEquivalentTo` with explicit exclusions for domain objects.** `Equals` overrides on domain objects may not cover all comparison dimensions. `BeEquivalentTo` does deep structural comparison by default, which catches regressions in nested objects -- but always exclude auto-generated fields like `Id`, `CreatedAt`, and `RowVersion`.

6. **Never call `mock.VerifyAll()` as a substitute for explicit `Verify()` calls.** `VerifyAll()` verifies all setups were called, but a setup that was never called without a corresponding `Verify()` fails silently when `VerifyAll()` is absent. Be explicit about what behavior you are verifying and why.

7. **Never use `UseInMemoryDatabase` for tests that verify constraint or transaction behavior.** The EF Core in-memory provider does not enforce unique indexes, foreign key constraints, or database-level validation. Use `UseSqlite("DataSource=:memory:")` for constraint testing and TestContainers for full SQL Server/PostgreSQL dialect testing.

8. **Always create isolated database instances per test or per test class.** Use `Guid.NewGuid().ToString()` as the database name when using in-memory providers. Sharing a database name across test classes causes data contamination, especially when EF Core's change tracker is involved.

9. **Never assert on log output as the primary verification mechanism.** Log messages are implementation details and change frequently. Assert on return values, thrown exceptions, state changes, and explicit mock verifications. Log assertions are acceptable only for structured logging tests where the log event is the observable contract.

10. **Always configure `xunit.runner.json` to limit parallel threads explicitly.** Unrestricted parallelism causes intermittent failures in integration tests that share infrastructure (ports, file handles, database names). Set `maxParallelThreads` to the number of available CPU cores or 4, whichever is lower. Separate integration tests into a `[Collection]` with a single shared fixture to serialize them.

---

## Edge Cases

### Legacy Codebase Without Dependency Injection
When the codebase uses `new` keywords to instantiate dependencies inside methods (static dependencies, service locators, `HttpClient` constructed inline), direct mocking is not possible.

- Introduce a seam using the **Extract and Override** pattern: extract the hard dependency call into a `protected virtual` method, then create a test subclass that overrides it.
- For `HttpClient` specifically: wrap it behind `IHttpClientFactory` or an `IExternalServiceClient` interface. Never mock `HttpClient` directly -- mock the `HttpMessageHandler` using `MockHttpMessageHandler` from the `RichardSzalay.MockHttp` NuGet package.
- Do not attempt to refactor the entire class before testing. Add the seam, write tests, then refactor safely.

### Testing Authenticated Endpoints with WebApplicationFactory
The real authentication stack requires valid JWT tokens or cookies. In test environments, this creates a circular dependency.

- Create a `TestAuthHandler` implementing `AuthenticationHandler<AuthenticationSchemeOptions>` that automatically authenticates any request with a configurable `ClaimsPrincipal`. Register it in `ConfigureWebHost` with `services.AddAuthentication("TestScheme")`.
- Add a `WithClaims(...)` extension method on `HttpClient` to inject test claims per request via a custom `DelegatingHandler`.
- Never disable authentication entirely in tests -- that makes authorization tests meaningless. Always test both authenticated and unauthenticated paths.

### Testing Code That Uses `DateTime.UtcNow` Directly
Code that calls `DateTime.UtcNow` or `DateTimeOffset.UtcNow` directly is non-deterministic and non-testable for time-sensitive logic.

- In .NET 8+, inject `TimeProvider` (built-in abstract class) as a dependency and use `FakeTimeProvider` from `Microsoft.Extensions.TimeProvider.Testing` in tests. Call `fakeTimeProvider.Advance(TimeSpan.FromHours(1))` to simulate time passing.
- In .NET 6/7, introduce an `IClock` interface with a `UtcNow` property. Mock or stub it in tests.
- Never use `DateTime.UtcNow` directly in code that has time-dependent branching logic (expiry checks, scheduling, token validation).

### EF Core Repository Tests with Slow TestContainers Startup
Spinning up a PostgreSQL or SQL Server container takes 3--10 seconds per test session. Without proper sharing, this makes integration test suites prohibitively slow.

- Use `ICollectionFixture<DatabaseFixture>` to start the container once for the entire test run. Keep the fixture stateless after initialization -- each test method should run migrations on a fresh schema using a unique database name within the same container instance.
- Alternatively, use `Respawn` (the NuGet package by Jimmy Bogard) to reset database state between tests by deleting rows in dependency order rather than recreating the schema. `await respawner.ResetAsync(connection)` is typically 10x faster than `EnsureDeleted`/`EnsureCreated`.
- Tag TestContainer tests with `[Trait("Category", "Database")]` and run them separately from fast unit tests in CI.

### Testing MediatR Handlers, CQRS Commands, and Queries
In CQRS architectures using MediatR, there is a temptation to test handlers through the `IMediator.Send()` interface. This couples tests to the mediator pipeline unnecessarily for pure business logic.

- For handler logic: instantiate the handler directly with mocked dependencies and invoke `Handle(command, CancellationToken.None)` directly. Do not involve `IMediator` at all.
- For pipeline behavior testing (validation behaviors, transaction behaviors): write separate tests for each `IPipelineBehavior<TRequest, TResponse>` implementation, passing a mock `next` delegate.
- For end-to-end request dispatch tests: use `WebApplicationFactory` to test the full HTTP request -- MediatR is an implementation detail at this level.
- Never mock `IMediator` in unit tests of controllers that call `_mediator.Send(...)`. Instead, test the controller with real MediatR configured in an integration test, or test the handler directly in a unit test.

### Flaky Integration Tests Due to Port Conflicts
When multiple test projects run in parallel in CI and each creates a `WebApplicationFactory`, Kestrel may attempt to bind to the same port.

- `WebApplicationFactory` by default uses the test server's in-process transport, not Kestrel on a real port. Use `CreateClient()`, not `CreateDefaultClient(new Uri("http://localhost:5000"))` -- the latter requires a real port.
- If using `WebApplicationFactory` with a real Kestrel port for external client testing (rare), use port 0 to let the OS assign an ephemeral port and retrieve it via `factory.Server.Features.Get<IServerAddressesFeature>()`.
- Isolate integration test collections with `[Collection("IntegrationTests")]` and `[CollectionDefinition("IntegrationTests", DisableParallelization = true)]` to prevent concurrent factory construction.

### Testing Internal Classes
Production code often uses `internal` visibility for domain logic that should not be in the public API.

- Add `[assembly: InternalsVisibleTo("ProjectName.Tests")]` to the production project's `AssemblyInfo.cs` or directly in the `.csproj`. This grants the test assembly access to all internal types.
- Do NOT make types `public` solely to enable testing. Visibility is a design contract. Exposing internals to the test assembly is the correct solution.
- For Moq to mock `internal` interfaces, also add `[assembly: InternalsVisibleTo("DynamicProxyGenAssembly2")]` -- this is required because Moq generates a dynamic subclass at runtime.

---

## Example

**Input:** "I'm building an e-commerce order processing service. I have an `OrderService` that depends on `IInventoryService` and `IPaymentGateway`. I need unit tests for the `PlaceOrderAsync` method which checks stock, charges the customer, and creates an order record. How should I set this up with xUnit, Moq, and FluentAssertions?"

**Output:**

### Test Architecture Decision

**Test Type:** Unit  
**Subject Under Test:** `OrderService.PlaceOrderAsync`  
**Dependencies Identified:** `IInventoryService`, `IPaymentGateway`, `IOrderRepository`  
**Mocking Strategy:** Mock all three interfaces with Moq; use `MockBehavior.Strict` for `IPaymentGateway` to catch unexpected charge attempts

---

### Packages (add to `OrderService.Tests.csproj`)

| Package | Version | Purpose |
|---------|---------|---------|
| xunit | 2.9.x | Test runner |
| xunit.runner.visualstudio | 2.8.x | VS Test Explorer |
| Microsoft.NET.Test.Sdk | 17.x | dotnet test support |
| FluentAssertions | 6.12.x | Assertion API |
| Moq | 4.20.x | Mock objects |
| coverlet.collector | 6.x | Coverage collection |

---

### Full Test Implementation

```csharp
// File: OrderService.Tests/Unit/OrderServiceTests.cs

using FluentAssertions;
using Moq;
using Xunit;
using ECommerce.Orders;
using ECommerce.Inventory;
using ECommerce.Payments;

namespace ECommerce.Tests.Unit;

public class OrderServiceTests
{
    private readonly Mock<IInventoryService> _inventoryService;
    private readonly Mock<IPaymentGateway> _paymentGateway;
    private readonly Mock<IOrderRepository> _orderRepository;
    private readonly OrderService _sut;

    public OrderServiceTests()
    {
        // Use Strict to catch any unexpected payment calls
        _paymentGateway = new Mock<IPaymentGateway>(MockBehavior.Strict);
        _inventoryService = new Mock<IInventoryService>();
        _orderRepository = new Mock<IOrderRepository>();

        _sut = new OrderService(
            _inventoryService.Object,
            _paymentGateway.Object,
            _orderRepository.Object);
    }

    // -------------------------------------------------------
    // Happy path
    // -------------------------------------------------------

    [Fact]
    public async Task PlaceOrderAsync_WhenStockAvailableAndPaymentSucceeds_ReturnsConfirmedOrder()
    {
        // Arrange
        var customerId = Guid.NewGuid();
        var productId = Guid.NewGuid();
        var request = new PlaceOrderRequest(customerId, productId, Quantity: 2, UnitPrice: 49.99m);

        _inventoryService
            .Setup(x => x.GetAvailableStockAsync(productId))
            .ReturnsAsync(10);

        _paymentGateway
            .Setup(x => x.ChargeAsync(customerId, 99.98m, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PaymentResult(Success: true, TransactionId: "TXN-001"));

        _orderRepository
            .Setup(x => x.SaveAsync(It.IsAny<Order>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _sut.PlaceOrderAsync(request, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Status.Should().Be(OrderStatus.Confirmed);
        result.TransactionId.Should().Be("TXN-001");
        result.TotalAmount.Should().Be(99.98m);

        _orderRepository.Verify(
            x => x.SaveAsync(
                It.Is<Order>(o =>
                    o.CustomerId == customerId &&
                    o.ProductId == productId &&
                    o.Status == OrderStatus.Confirmed),
                It.IsAny<CancellationToken>()),
            Times.Once());
    }

    // -------------------------------------------------------
    // Stock insufficient -- no payment should be attempted
    // -------------------------------------------------------

    [Fact]
    public async Task PlaceOrderAsync_WhenStockInsufficient_ThrowsInsufficientStockException()
    {
        // Arrange
        var productId = Guid.NewGuid();
        var request = new PlaceOrderRequest(Guid.NewGuid(), productId, Quantity: 5, UnitPrice: 20m);

        _inventoryService
            .Setup(x => x.GetAvailableStockAsync(productId))
            .ReturnsAsync(3); // Only 3 available, 5 requested

        // Act
        Func<Task> act = () => _sut.PlaceOrderAsync(request, CancellationToken.None);

        // Assert
        await act.Should()
            .ThrowExactly<InsufficientStockException>()
            .WithMessage("*insufficient stock*");

        // Strict MockBehavior ensures _paymentGateway was never called.
        // If ChargeAsync is called, the strict mock throws automatically.
        _orderRepository.Verify(
            x => x.SaveAsync(It.IsAny<Order>(), It.IsAny<CancellationToken>()),
            Times.Never());
    }

    // -------------------------------------------------------
    // Payment failure -- order must be marked failed, not saved as confirmed
    // -------------------------------------------------------

    [Fact]
    public async Task PlaceOrderAsync_WhenPaymentFails_ThrowsPaymentFailedException()
    {
        // Arrange
        var customerId = Guid.NewGuid();
        var productId = Guid.NewGuid();
        var request = new PlaceOrderRequest(customerId, productId, Quantity: 1, UnitPrice: 100m);

        _inventoryService
            .Setup(x => x.GetAvailableStockAsync(productId))
            .ReturnsAsync(50);

        _paymentGateway
            .Setup(x => x.ChargeAsync(customerId, 100m, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PaymentResult(Success: false, TransactionId: null));

        // Act
        Func<Task> act = () => _sut.PlaceOrderAsync(request, CancellationToken.None);

        // Assert
        await act.Should()
            .ThrowExactly<PaymentFailedException>()
            .WithMessage("*payment declined*");

        _orderRepository.Verify(
            x => x.SaveAsync(
                It.Is<Order>(o => o.Status == OrderStatus.Confirmed),
                It.IsAny<CancellationToken>()),
            Times.Never());
    }

    // -------------------------------------------------------
    // Parameterized: quantity edge cases
    // -------------------------------------------------------

    [Theory]
    [MemberData(nameof(InvalidQuantityData))]
    public async Task PlaceOrderAsync_WithInvalidQuantity_ThrowsValidationException(
        int quantity, string expectedMessageFragment)
    {
        // Arrange
        var request = new PlaceOrderRequest(Guid.NewGuid(), Guid.NewGuid(), quantity, 10m);

        // Act
        Func<Task> act = () => _sut.PlaceOrderAsync(request, CancellationToken.None);

        // Assert -- validation should fire before any dependency is touched
        await act.Should()
            .ThrowExactly<ValidationException>()
            .WithMessage(expectedMessageFragment);

        _inventoryService.Verify(
            x => x.GetAvailableStockAsync(It.IsAny<Guid>()),
            Times.Never());
    }

    public static TheoryData<int, string> InvalidQuantityData => new()
    {
        { 0,      "*quantity must be greater than zero*" },
        { -1,     "*quantity must be greater than zero*" },
        { 10_001, "*exceeds maximum order quantity*" }
    };
}
```

---

### Coverage Configuration (`OrderService.Tests.csproj` fragment)

```xml
<PropertyGroup>
  <TargetFramework>net8.0</TargetFramework>
  <IsPackable>false</IsPackable>
  <Nullable>enable</Nullable>
  <ImplicitUsings>enable</ImplicitUsings>
</PropertyGroup>

<ItemGroup>
  <PackageReference Include="xunit" Version="2.9.*" />
  <PackageReference Include="xunit.runner.visualstudio" Version="2.8.*" />
  <PackageReference Include="Microsoft.NET.Test.Sdk" Version="17.*" />
  <PackageReference Include="FluentAssertions" Version="6.12.*" />
  <PackageReference Include="Moq" Version="4.20.*" />
  <PackageReference Include="coverlet.collector" Version="6.*">
    <IncludeAssets>runtime; build; native; contentfiles; analyzers; buildtransitive</IncludeAssets>
    <PrivateAssets>all</PrivateAssets>
  </PackageReference>
</ItemGroup>
```

---

### CI Command to Run and Gate Coverage

```bash
dotnet test OrderService.Tests \
  --configuration Release \
  --collect:"XPlat Code Coverage" \
  --results-directory ./TestResults \
  -- DataCollectionRunSettings.DataCollectors.DataCollector.Configuration.Threshold=80 \
     DataCollectionRunSettings.DataCollectors.DataCollector.Configuration.ThresholdType=branch
```

**What this test suite achieves:**
- Happy path verifies the full orchestration chain: stock check -> charge -> save
- Strict `MockBehavior` on `IPaymentGateway` guarantees no charge is attempted when stock is insufficient -- the test does not need an explicit `Verify` call for this
- Each failure mode (`InsufficientStock`, `PaymentFailed`, `ValidationException`) is isolated in its own `[Fact]` with a precise assertion
- Quantity boundary cases use `TheoryData<int, string>` for type safety -- the four cases cover zero, negative, and the upper boundary
- All tests are async-safe, use `Func<Task>` for exception assertions, and have zero shared state between tests
