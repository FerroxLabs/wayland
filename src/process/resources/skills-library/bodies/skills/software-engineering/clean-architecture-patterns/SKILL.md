---
name: clean-architecture-patterns
description: |
  Guides expert-level clean architecture patterns implementation: clean-code and design-patterns decision frameworks, production-ready patterns, and concrete templates for clean architecture patterns workflows.
  Use when the user asks about clean architecture patterns, clean architecture patterns configuration, or architecture best practices for clean projects.
  Do NOT use when the user needs a different architecture design capability -- check sibling skills in the architecture design subcategory.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "architecture clean-code design-patterns"
  category: "software-engineering"
  subcategory: "architecture-design"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Clean Architecture Patterns

## When to Use

**Use this skill when:**
- User asks how to structure a new application using Clean Architecture, Hexagonal Architecture, or Ports and Adapters principles
- User has a monolith with tangled business logic mixed into controllers, database models, or framework code and wants to untangle it
- User needs to decide between Clean Architecture, layered architecture (N-tier), CQRS, Event-Driven Architecture, or Vertical Slice Architecture for a specific project context
- User wants to implement a specific structural pattern -- Use Cases, Entities, Repository pattern, Domain Services, Application Services -- and is unsure how to wire them together
- User is migrating from a framework-coupled codebase (Rails ActiveRecord-style, Django models with business logic, Spring Service/Controller spaghetti) to a decoupled architecture
- User needs to enforce dependency rules across layers and wants concrete enforcement tools (ArchUnit, Dependency Cruiser, import linting)
- User is designing a system where the domain model must survive multiple delivery mechanisms -- REST API, CLI, message queue consumer, batch job -- without duplication
- User asks about testing strategy in the context of architecture: how to achieve fast unit tests, independent of databases and HTTP clients

**Do NOT use this skill when:**
- User is asking about microservice decomposition boundaries -- use the domain-driven-design or microservices-decomposition skill instead
- User needs infrastructure-level architectural decisions (load balancing, CDN placement, database sharding) -- use the infrastructure-architecture skill
- User is asking about a specific framework's built-in MVC structure (how Django class-based views work, how Rails concerns work) -- use the framework-specific skill
- User needs CQRS and Event Sourcing implementation patterns in depth -- use the cqrs-event-sourcing skill which covers projection rebuilding, event store selection, and saga patterns
- User is asking about code review or refactoring a specific function or class without an architectural scope -- use the code-review skill
- User wants API design patterns (REST vs GraphQL vs gRPC) independent of internal architecture -- use the api-design skill

---

## Process

### 1. Establish the Architectural Context and Pain Points

Before recommending any pattern, diagnose what is actually broken or at risk.

- Ask: Is business logic currently in controllers, HTTP handlers, or ORM model methods? This is the primary signal that Clean Architecture will help.
- Ask: Can the team run the full test suite without a running database or HTTP server? If no, the current architecture has infrastructure coupled to domain logic.
- Ask: Has the codebase been described as "we can't change the ORM without rewriting everything" or "adding a feature requires touching 6 files across unrelated folders"? These indicate missing layer boundaries.
- Identify the primary delivery mechanism (REST, GraphQL, gRPC, CLI) and secondary mechanisms (background jobs, event consumers) -- Clean Architecture is most valuable when there are 2+ delivery mechanisms or 2+ data stores.
- Determine team size and experience. Teams under 3 engineers or projects under 6 months of expected lifespan may not justify full Clean Architecture overhead -- consider Modular Monolith with clear package boundaries instead.
- Identify the language and ecosystem, because enforcement tooling and idioms differ significantly: Java/Kotlin with ArchUnit, TypeScript with dependency-cruiser and eslint-import rules, Python with import-linter, C# with NetArchTest.

### 2. Explain the Dependency Rule and Layer Model

The single most important concept in Clean Architecture is the Dependency Rule: source code dependencies must point inward only. Outer layers depend on inner layers -- never the reverse.

- Define the four canonical layers from innermost to outermost:
  - **Entities (Domain):** Pure business objects and business rules. No imports from frameworks, ORMs, or HTTP libraries. These are the highest-stability, highest-abstraction components. A `Money` value object, an `Order` aggregate, a `UserAccount` entity with its invariants live here.
  - **Use Cases (Application):** Orchestrates the flow of data to and from Entities to achieve a business goal. Defines input ports (interfaces for what the use case accepts) and output ports (interfaces it calls to interact with infrastructure). A `PlaceOrderUseCase`, `TransferFundsUseCase`, or `GenerateMonthlyReportUseCase` lives here. Depends only on the Domain layer.
  - **Interface Adapters:** Converts data from the format most convenient for use cases and entities to the format most convenient for external agents. Contains Controllers, Presenters, Gateways, and Repository implementations. A `OrderController` that parses HTTP JSON into a `PlaceOrderCommand`, or a `PostgresOrderRepository` that implements the `OrderRepository` interface defined in the Use Case layer.
  - **Frameworks and Drivers (Infrastructure):** The outermost ring. Database drivers, web frameworks, message brokers, file system, external APIs. Nothing in inner layers should know these exist by name.
- Emphasize: The Domain layer defines interfaces (ports) that the Infrastructure layer implements (adapters). This is the Dependency Inversion Principle applied at the architectural scale.
- Use concrete language: "Your `UserRepository` interface belongs in the Use Case or Domain layer. The `PostgresUserRepository` class belongs in the Infrastructure layer. The Use Case injects the interface -- not the concrete class."

### 3. Define the Structural Mapping for the Specific Project

Translate abstract layers into actual folder structure and module boundaries for the user's stack.

- For a **TypeScript/Node.js** project, a canonical layout:
  ```
  src/
    domain/
      entities/          # Pure domain objects, no imports from src/infrastructure
      value-objects/     # Immutable, equality by value
      domain-services/   # Domain logic spanning multiple aggregates
      repositories/      # Interface definitions only (IOrderRepository)
      events/            # Domain event definitions
    application/
      use-cases/         # One file per use case, depends on domain interfaces
      dtos/              # Input/output data shapes for use cases
      ports/             # Input port interfaces (IPlaceOrderUseCase)
    infrastructure/
      persistence/       # Repository implementations (TypeORM, Prisma, raw SQL)
      http/              # Express/Fastify controllers, route handlers
      messaging/         # Kafka/RabbitMQ consumers and publishers
      external-services/ # HTTP clients for third-party APIs
    di/                  # Dependency injection wiring (composition root)
  ```
- For a **Java/Spring** project, use package-level boundaries enforced with ArchUnit tests:
  ```
  com.company.app/
    domain/
    application/
    adapters/
      web/
      persistence/
      messaging/
    config/  # Spring @Configuration, dependency wiring only
  ```
- For a **Python/FastAPI** project, enforce boundaries with import-linter and explicit `__init__.py` exports:
  ```
  src/
    domain/
    application/
    adapters/
      api/
      database/
      external/
    main.py  # FastAPI app instantiation, DI wiring
  ```
- Specify: The `di/` or `config/` or `main.py` module is the only place where concrete implementations are assembled. This is the **Composition Root** -- the single location where interfaces are bound to their implementations. This is not a layer; it is the wiring harness.

### 4. Design the Use Case Interface and Data Flow

Show the user exactly how data flows through the architecture for a single feature.

- A Use Case should accept a **Command** or **Query** object (a plain data struct/class with no behavior) and return a **Result** object or throw a domain exception.
- The Use Case implementation:
  1. Validates the command (or delegates to a domain service/entity)
  2. Loads required entities through repository interfaces
  3. Calls entity methods to execute business logic (entities mutate themselves and emit domain events)
  4. Persists changed entities through repository interfaces
  5. Publishes domain events (optional -- through an event publisher interface)
  6. Returns a Result DTO
- The Use Case must **not** know about HTTP status codes, SQL queries, JSON serialization, or message broker topics. If those terms appear in a use case class, there is a layer violation.
- Show the transformation chain: HTTP Request --> Controller parses to `PlaceOrderCommand` --> Use Case runs domain logic --> Repository persists --> Use Case returns `PlaceOrderResult` DTO --> Controller serializes to HTTP Response. Each arrow is a translation at a layer boundary.
- Use Cases should be thin orchestrators -- if business logic accumulates in the use case itself rather than in entities or domain services, the domain model is anemic and needs enrichment.

### 5. Define Repository and Port Contracts

The Repository pattern is the most commonly misimplemented part of Clean Architecture. Define it correctly.

- Repository interfaces must be defined in the domain or application layer, not the infrastructure layer. The infrastructure layer implements them.
- A repository interface should speak the language of the domain, not the database: `findActiveOrdersByCustomerId(customerId: CustomerId): Promise<Order[]>`, not `select * from orders where customer_id = ? and status != 'CANCELLED'`.
- A repository interface should accept and return **domain entities**, not ORM model objects or database rows. The `PostgresOrderRepository` is responsible for mapping between `Order` domain entities and the ORM representation.
- Avoid generic repositories (`GenericRepository<T>`) -- they leak infrastructure concerns into the domain by forcing callers to construct query predicates using infrastructure types.
- Secondary ports (outbound ports) beyond repositories follow the same rule: define the interface in the application layer. `IEmailNotificationPort.send(notification: OrderConfirmationNotification): Promise<void>` lives in application; `SendGridEmailAdapter` lives in infrastructure.
- For CQRS-adjacent scenarios: read-model queries do not need to pass through the domain layer. A thin query handler can call a read-optimized data access object directly in the infrastructure layer, bypassing domain entities entirely, as long as it is clearly separated from the write-side use cases.

### 6. Enforce Boundaries with Tooling

Architectural rules that are not enforced will erode within weeks on a team.

- **TypeScript:** Configure `eslint-plugin-import` with `no-restricted-imports` rules, or use `dependency-cruiser` with a `.dependency-cruiser.js` config that declares forbidden dependency paths. Run in CI on every pull request.
  ```js
  // .dependency-cruiser.js excerpt
  forbidden: [
    { name: "domain-must-not-depend-on-infrastructure",
      from: { path: "^src/domain" },
      to: { path: "^src/infrastructure" } },
    { name: "application-must-not-depend-on-infrastructure",
      from: { path: "^src/application" },
      to: { path: "^src/infrastructure" } }
  ]
  ```
- **Java/Spring:** Use ArchUnit in a dedicated test class. Write rules like `noClasses().that().resideInPackage("..domain..").should().dependOnClassesThat().resideInPackage("..infrastructure..")`. Run as part of the unit test suite.
- **Python:** Use `import-linter` with a `setup.cfg` contract section specifying forbidden imports. Integrates with pytest.
- **C#:** Use NetArchTest with xUnit or NUnit. Define `Types.InAssembly(assembly).That().ResideInNamespace("Domain").ShouldNot().HaveDependencyOn("Infrastructure")`.
- Set up pre-commit hooks using Husky (Node), pre-commit (Python), or Lefthook (polyglot) to run architecture checks before code is pushed.
- Establish a policy: architecture violations caught by tooling are treated as build failures, not warnings. A warning that doesn't break the build will be ignored within 30 days.

### 7. Define the Testing Strategy by Layer

Clean Architecture's primary practical benefit is testability. Make this explicit.

- **Domain/Entity tests:** Pure unit tests with no mocking. Zero dependencies on infrastructure. These should run in under 1ms each and cover all business invariants, calculation logic, and domain event emission.
- **Use Case tests:** Unit tests with mocked/stubbed repository interfaces and other port interfaces. Use in-memory implementations rather than Mockito/jest.mock where possible -- they are more expressive and catch more bugs. A `InMemoryOrderRepository` that stores data in a `Map<string, Order>` is a more reliable test double than a mock with `verify()` assertions.
- **Adapter/Infrastructure tests:** Integration tests that actually hit the database, message broker, or HTTP endpoint. Use Testcontainers for PostgreSQL, MySQL, Kafka, Redis -- spin up real infrastructure in Docker for tests, tear down after. These tests validate the mapping layer (ORM to domain entity translation) and are slower but essential.
- **End-to-end/Acceptance tests:** Drive the full application stack through the outermost interface (HTTP, CLI). Keep these minimal -- they are expensive to run and maintain. Cover the critical user journeys, not every edge case.
- The test pyramid for Clean Architecture: ~60-70% unit tests (domain + use case layer), ~25-30% integration tests (adapter layer), ~5-10% end-to-end tests.
- Use Case tests should not use `@SpringBootTest` or `TestClient` -- if a use case test requires the web framework to boot, there is a layer violation.

### 8. Handle Cross-Cutting Concerns Without Polluting Layers

Logging, authentication, authorization, caching, and transactions are the most common sources of layer violations.

- **Transactions:** Define a transaction boundary abstraction in the application layer: `IUnitOfWork` or `ITransactionManager`. The Use Case calls `unitOfWork.commit()`. The infrastructure implementation wraps the database session. Never import database transaction APIs into Use Cases directly.
- **Logging:** Use a logger interface defined in the application layer. The infrastructure layer provides the Winston, Logback, or structlog implementation. Log at the adapter level (what HTTP request came in, what was the response code) and at the use case level (business events: "order placed", "payment declined") -- not at the domain entity level.
- **Authentication/Authorization:** Authentication (who is this?) is an infrastructure concern -- the HTTP adapter extracts and validates the token. Authorization (are they allowed?) is an application concern -- the Use Case receives an `AuthenticatedUser` value object and enforces access rules against domain entities. Do not do authorization in controllers.
- **Caching:** Implement caching in a decorator that wraps the repository interface. `CachedOrderRepository` wraps `PostgresOrderRepository`, both implementing `IOrderRepository`. The Use Case never knows caching exists.
- **Validation:** Input validation (is this a valid UUID?) happens in the controller/adapter before constructing the command. Business validation (can this order be placed given current inventory?) happens in the domain entity or domain service.

---

## Output Format

When advising on Clean Architecture patterns, produce the following structured output:

```
## Clean Architecture Assessment

### Context Summary
- Codebase profile: [greenfield / brownfield migration / partial adoption]
- Primary language and ecosystem: [TypeScript / Java / Python / C# / Go / other]
- Delivery mechanisms: [list all: REST API, CLI, queue consumer, batch job, etc.]
- Team size and Clean Architecture experience: [n engineers, experience level]
- Key pain point being addressed: [testability / coupling / multiple delivery mechanisms / etc.]

---

### Layer Mapping

| Layer            | Contents in This Project         | Enforcement Tool              |
|------------------|----------------------------------|-------------------------------|
| Domain (Entities)| [entity/aggregate names]         | [tooling: ArchUnit, dep-cruiser] |
| Application (Use Cases) | [use case names]          | [tooling]                     |
| Interface Adapters | [controllers, presenters, gateways] | [tooling]               |
| Infrastructure   | [DB, HTTP framework, external APIs] | [tooling]                  |
| Composition Root | [DI config module]               | --                            |

---

### Dependency Rule Violations Identified
[List any current or anticipated violations with recommended remediation]

---

### Recommended Folder Structure

\`\`\`
[Concrete folder tree for this specific project]
\`\`\`

---

### Use Case Implementation Template

\`\`\`typescript (or language of choice)
// Application Layer -- Use Case
interface PlaceOrderCommand {
  customerId: string;
  lineItems: { productId: string; quantity: number }[];
  shippingAddressId: string;
}

interface PlaceOrderResult {
  orderId: string;
  estimatedDeliveryDate: Date;
  totalAmountCents: number;
}

// Input port -- defined in application layer
interface IPlaceOrderUseCase {
  execute(command: PlaceOrderCommand): Promise<PlaceOrderResult>;
}

// Output ports -- defined in application layer, implemented in infrastructure
interface IOrderRepository {
  save(order: Order): Promise<void>;
  findById(orderId: OrderId): Promise<Order | null>;
}

interface IInventoryPort {
  checkAvailability(productId: string, quantity: number): Promise<boolean>;
}

class PlaceOrderUseCase implements IPlaceOrderUseCase {
  constructor(
    private readonly orderRepository: IOrderRepository,
    private readonly inventoryPort: IInventoryPort,
  ) {}

  async execute(command: PlaceOrderCommand): Promise<PlaceOrderResult> {
    // Domain logic delegated to entities
    const order = Order.create({
      customerId: CustomerId.of(command.customerId),
      lineItems: command.lineItems,
    });

    for (const item of order.lineItems) {
      const available = await this.inventoryPort.checkAvailability(
        item.productId.value,
        item.quantity,
      );
      if (!available) {
        throw new InsufficientInventoryError(item.productId.value);
      }
    }

    await this.orderRepository.save(order);

    return {
      orderId: order.id.value,
      estimatedDeliveryDate: order.estimatedDeliveryDate,
      totalAmountCents: order.total.amountCents,
    };
  }
}
\`\`\`

---

### Architecture Decision Record (ADR)

**Title:** [Architecture pattern decision]
**Status:** Proposed / Accepted / Deprecated
**Context:** [What problem is being solved, what forces are in tension]
**Decision:** [The specific structural decision made]
**Consequences:** [What becomes easier, what becomes harder, what new constraints apply]

---

### Testing Strategy

| Layer              | Test Type        | Example Tooling           | Infra Required |
|--------------------|------------------|---------------------------|----------------|
| Domain entities    | Pure unit        | Jest, JUnit, pytest       | None           |
| Use cases          | Unit w/ in-memory doubles | Jest, JUnit      | None           |
| Adapters/repos     | Integration      | Testcontainers + Jest     | Docker         |
| Full stack         | E2E              | Supertest, RestAssured    | Docker Compose |

---

### Enforcement Configuration
[Specific tooling config snippet for the user's ecosystem]
```

---

## Rules

1. NEVER allow a domain entity or use case to import from the infrastructure layer by any path -- not transitively, not through re-exports. A single such import destroys the testability guarantee that is the primary benefit of Clean Architecture.

2. NEVER place business rules in controllers, route handlers, or HTTP middleware. If a controller contains an `if` statement that makes a business decision (not a routing decision), that logic belongs in a Use Case or domain entity.

3. ALWAYS define repository and port interfaces in the application or domain layer. If the interface definition lives in the infrastructure package, the dependency direction is inverted and inner layers cannot use it without depending outward.

4. NEVER return ORM entities (ActiveRecord objects, JPA `@Entity` classes, Mongoose documents) from repository methods to use cases. Map them to domain entities inside the repository implementation. Leaking ORM objects into the use case layer creates a hidden dependency on the ORM.

5. ALWAYS use a Composition Root -- a single, explicit location where all interfaces are wired to their implementations. Avoid distributed `new ConcreteClass()` calls scattered across use cases or domain services. In Spring, this is `@Configuration` classes. In Node.js, it is typically `src/di/container.ts`. In Python, it is `main.py` or an `dependencies.py` module.

6. NEVER conflate the domain model with the persistence model. A domain `Order` entity with rich behavior is not the same thing as an `orders` database row. The repository is responsible for the translation. Accepting ORM constraints (e.g., requiring a no-arg constructor, requiring `@Column` annotations) on domain entities means the ORM is dictating domain model design -- a critical inversion.

7. ALWAYS write one Use Case per business operation. A single `OrderService` class with 12 methods (`placeOrder`, `cancelOrder`, `fulfillOrder`, `refundOrder`, etc.) is not a Use Case -- it is a service class that will accumulate dependencies and become a maintenance burden. Each operation gets its own class with its own constructor-injected dependencies.

8. NEVER mock what you own in use case tests. Use in-memory implementations (fake objects) of repository interfaces rather than `jest.mock()` or Mockito mocks. Mocks verify interaction patterns; fakes verify behavior. A `InMemoryOrderRepository` that throws `DuplicateOrderError` when saving an order with an existing ID tests real behavior that a mock cannot capture.

9. ALWAYS enforce layer boundaries in CI with automated tooling. Architectural conventions without automated enforcement degrade within weeks on teams of 3+ engineers. Choose one enforcement tool (ArchUnit, dependency-cruiser, import-linter, NetArchTest) and treat violations as build failures.

10. NEVER apply Clean Architecture uniformly to all parts of a system. CRUD-heavy administration screens, reporting queries, and data migration scripts rarely benefit from full Use Case / Repository abstraction. Apply the pattern where business complexity justifies it; use simpler patterns (thin controllers with direct query objects) for genuinely simple CRUD operations. Document the decision explicitly so future developers do not apply it inconsistently by accident.

---

## Edge Cases

### Legacy Codebase with Business Logic in ActiveRecord/ORM Models

Rails, Laravel, Django, and similar frameworks encourage putting business logic directly in model classes that inherit from ORM base classes. Migrating this to Clean Architecture cannot be done in a single refactor.

- Use the **Strangler Fig** pattern: wrap the legacy model behind a repository interface. The repository implementation delegates to the legacy ORM model internally, but the Use Case sees only the interface. This creates the seam without touching the legacy code immediately.
- Extract business methods from ORM models one at a time into plain domain objects. Start with the most frequently changed or most bug-prone methods.
- Add ArchUnit/dependency-cruiser rules from day one, but set them to `warn` rather than `fail` initially. Track the count of violations over time -- the trend line matters more than the current count.
- Expect 6--18 months for a mature legacy codebase to reach full Clean Architecture compliance in a team working on it part-time.
- Resist the urge to rewrite from scratch. Rewrites discard implicit domain knowledge encoded in edge-case handling that was added after production incidents.

### Anemic Domain Model Masquerading as Clean Architecture

A common failure mode: the architecture looks structurally correct (layers, interfaces, repositories) but all business logic lives in Use Cases while domain entities are data bags with only getters and setters. This is the Transaction Script pattern in Clean Architecture clothing.

- Identify anemic domain models by looking for Use Cases with `if/else` chains that make business decisions: `if (order.status === 'PENDING' && payment.status === 'CONFIRMED') { order.status = 'CONFIRMED'; }`. This logic belongs in `order.confirm(payment)`.
- Move behavior into entities by asking: "What invariant is this code protecting, and which entity owns that invariant?" The entity that owns the data should own the rule.
- Domain entities should throw domain exceptions for invalid state transitions, not return boolean success flags.
- The symptom of an anemic domain is that Use Cases are hard to test because they have complex branching logic -- once logic moves into entities, Use Case tests become simple orchestration tests.

### Multiple Bounded Contexts Sharing a Database

In a monolith, multiple business domains (Orders, Inventory, Billing) may share a single relational database. Clean Architecture per-domain is straightforward, but the seams between domains need design.

- Each bounded context gets its own set of repositories and domain entities. The `Order` entity in the Orders domain is not the same class as the `Order` summary read by the Billing domain.
- Cross-domain data access must go through a published interface (application service, domain event), not a direct repository call from one domain into another's tables.
- A domain event publisher interface in the application layer (`IOrderEventPublisher`) decouples the Order domain from Billing. The Billing domain subscribes to `OrderPlacedEvent` and maintains its own read model.
- If two domains truly must share a table (legacy schema), encapsulate that shared access in a single Anti-Corruption Layer adapter that both domains use -- do not let both domains have repositories pointing at the same table independently.

### Dependency Injection Container Complexity

When using a DI container (InversifyJS, Spring, Dagger, Python-inject), the Composition Root can become unwieldy and hard to debug.

- Keep container registration flat and explicit rather than using convention-based auto-wiring for anything more than trivial bindings. Implicit auto-wiring hides what is actually wired to what and makes debugging "wrong concrete class injected" issues extremely difficult.
- Use factory methods or provider functions for Use Cases rather than singleton binding -- Use Cases should typically be request-scoped, not singletons. Singletons cause state leakage between requests if Use Cases accidentally hold mutable state.
- If the Composition Root grows beyond ~150 lines, split it by domain module: `OrdersModule`, `BillingModule`, `InventoryModule`, each exporting their own bindings and assembled in the application root.
- In TypeScript without decorators (to avoid Reflect.metadata), prefer pure functional DI -- factory functions that accept dependencies and return instances. This is simpler to trace and does not require a container at all for small-to-medium projects.

### High-Throughput / Low-Latency Systems Where Abstraction Overhead Matters

Clean Architecture adds indirection layers. In systems processing 50,000+ transactions per second with sub-10ms latency requirements, the cost of virtual dispatch, interface indirection, and object mapping can be measurable.

- Profile before optimizing away abstractions. In most languages and at most throughputs, the overhead is immeasurable compared to database and network I/O.
- For hot paths (high-frequency read operations), use a read model that bypasses the domain layer entirely -- a thin query object that runs an optimized SQL query and returns a DTO directly to the controller. Document this as an intentional deviation from the standard pattern.
- Avoid mapping between domain entities and ORM objects multiple times per request. Profile the mapping cost with a realistic object graph before assuming it is a bottleneck.
- In Go and C, where interface dispatch overhead is more significant, consider value-type domain objects rather than interface-polymorphism-heavy designs. Clean Architecture principles still apply, but idioms differ.

### Testing in an Event-Driven Architecture with Domain Events

When domain entities emit events (`order.domainEvents` collection), the testing pattern changes.

- Domain entity tests should assert on the events emitted, not just on the final state: `expect(order.domainEvents).toContainEqual(expect.objectContaining({ type: 'OrderPlaced', orderId: order.id.value }))`.
- The Use Case is responsible for dispatching domain events after persisting entities. The event dispatcher is an injected port interface: `IEventPublisher`. Use Cases call `this.eventPublisher.publish(order.domainEvents)` after `save()`.
- In-memory event buses in tests allow other aggregates' handlers to run inline, validating the end-to-end domain event flow without infrastructure.
- Clear domain events from aggregates after dispatching, or they will be re-dispatched on subsequent loads from the repository.

### Microservice Boundary Coincides with Clean Architecture Module

When a Clean Architecture module is extracted into a microservice, the internal structure should not need to change significantly -- only the infrastructure adapters change.

- The domain and application layers move into the new service unchanged.
- Repository implementations that previously queried a shared database now query the service's private database.
- Cross-service calls that were previously in-process domain event handlers become infrastructure adapters: an HTTP client or message consumer implementing the same application-layer interface.
- This is the primary long-term advantage: if Clean Architecture is applied correctly from the start, extracting a service is an infrastructure change, not a domain model change.

---

## Example

**Input:** "We're building a fintech payment processing API in TypeScript with Node.js. The API receives payment requests over REST, processes them against external payment providers (Stripe, Braintree), applies our own risk-scoring logic, and stores transaction records in PostgreSQL. We have 5 engineers, and two of us have used Clean Architecture before. We also need a background worker that retries failed payments. How should we structure this?"

---

**Output:**

## Clean Architecture Assessment

### Context Summary
- **Codebase profile:** Greenfield
- **Language and ecosystem:** TypeScript / Node.js (Fastify recommended over Express for performance; Prisma for ORM with manual mapping to domain entities)
- **Delivery mechanisms:** REST API (primary), background retry worker (secondary) -- this dual delivery mechanism is the strongest signal that Clean Architecture is appropriate here
- **Team size and experience:** 5 engineers, 2 with CA experience -- introduce patterns incrementally, pair the experienced engineers with others on the first two Use Cases
- **Key pain point being addressed:** Decoupling business logic from payment provider SDKs (Stripe, Braintree APIs change frequently), enabling the retry worker to reuse domain logic without duplicating it

---

### Layer Mapping

| Layer              | Contents in This Project                                              | Enforcement Tool    |
|--------------------|-----------------------------------------------------------------------|---------------------|
| Domain (Entities)  | `PaymentTransaction` aggregate, `Money` value object, `RiskScore` value object, `PaymentStatus` enum, `PaymentAttempt` entity, domain events | dependency-cruiser  |
| Application (Use Cases) | `InitiatePaymentUseCase`, `RetryFailedPaymentUseCase`, `GetTransactionStatusUseCase` | dependency-cruiser  |
| Interface Adapters | `PaymentController` (Fastify), `RetryWorkerAdapter` (queue consumer), `StripePaymentGateway`, `BraintreePaymentGateway`, `PrismaTransactionRepository` | dependency-cruiser  |
| Infrastructure     | Fastify app instance, Prisma client, Stripe SDK client, Braintree SDK client, BullMQ worker | dependency-cruiser  |
| Composition Root   | `src/di/container.ts` -- binds all interfaces to implementations      | --                  |

---

### Dependency Rule Violations to Avoid

- Do NOT import the Stripe SDK in `InitiatePaymentUseCase`. The use case must depend on `IPaymentGatewayPort`, not `StripeClient`.
- Do NOT use Prisma's generated types (`Prisma.TransactionCreateInput`) in the domain layer or use case layer. Define `PaymentTransaction` as a pure domain class; map to Prisma types inside `PrismaTransactionRepository`.
- Do NOT put the retry scheduling logic in the Use Case. The Use Case declares what should happen (`payment.markForRetry()`); the infrastructure adapter (`BullMQRetryScheduler`) implements the `IRetrySchedulerPort` interface.

---

### Recommended Folder Structure

```
src/
  domain/
    entities/
      PaymentTransaction.ts       # Aggregate root -- owns status transitions
      PaymentAttempt.ts           # Child entity: single attempt against a provider
    value-objects/
      Money.ts                    # Currency + amount, arithmetic, comparison
      RiskScore.ts                # 0-100 score, threshold logic
      PaymentStatus.ts            # Enum: PENDING | PROCESSING | SUCCESS | FAILED | RETRYING
    events/
      PaymentInitiated.ts
      PaymentSucceeded.ts
      PaymentFailed.ts
    repositories/
      ITransactionRepository.ts   # Interface: save(), findById(), findPendingRetries()
    ports/
      IPaymentGatewayPort.ts      # Interface: charge(attempt): Promise<GatewayResult>
      IRiskScoringPort.ts         # Interface: score(transaction): Promise<RiskScore>
      IRetrySchedulerPort.ts      # Interface: scheduleRetry(transactionId, delayMs)
  application/
    use-cases/
      InitiatePaymentUseCase.ts
      RetryFailedPaymentUseCase.ts
      GetTransactionStatusUseCase.ts
    dtos/
      InitiatePaymentCommand.ts
      InitiatePaymentResult.ts
      RetryPaymentCommand.ts
  infrastructure/
    persistence/
      PrismaTransactionRepository.ts   # Implements ITransactionRepository
      mappers/
        TransactionMapper.ts           # Domain entity <-> Prisma model
    payment-gateways/
      StripePaymentGateway.ts          # Implements IPaymentGatewayPort
      BraintreePaymentGateway.ts       # Implements IPaymentGatewayPort
    risk-scoring/
      InternalRiskScoringAdapter.ts    # Implements IRiskScoringPort
    retry/
      BullMQRetryScheduler.ts          # Implements IRetrySchedulerPort
      RetryWorkerAdapter.ts            # BullMQ worker -- calls RetryFailedPaymentUseCase
    http/
      PaymentController.ts             # Fastify route handler
      PaymentRouter.ts
  di/
    container.ts                       # Composition root -- all interface bindings
  main.ts                              # Fastify app + BullMQ worker startup
```

---

### Use Case Implementation Template

```typescript
// src/domain/repositories/ITransactionRepository.ts
export interface ITransactionRepository {
  save(transaction: PaymentTransaction): Promise<void>;
  findById(id: TransactionId): Promise<PaymentTransaction | null>;
  findPendingRetries(maxAttempts: number, beforeDate: Date): Promise<PaymentTransaction[]>;
}

// src/domain/ports/IPaymentGatewayPort.ts
export interface GatewayResult {
  success: boolean;
  providerTransactionId: string | null;
  failureCode: string | null;
  failureMessage: string | null;
}

export interface IPaymentGatewayPort {
  charge(attempt: PaymentAttempt): Promise<GatewayResult>;
}

// src/application/dtos/InitiatePaymentCommand.ts
export interface InitiatePaymentCommand {
  customerId: string;
  amountCents: number;
  currencyCode: string;   // ISO 4217: "USD", "EUR"
  paymentMethodToken: string;
  idempotencyKey: string;
  preferredGateway: "stripe" | "braintree";
}

export interface InitiatePaymentResult {
  transactionId: string;
  status: "PROCESSING" | "SUCCESS" | "FAILED";
  providerTransactionId: string | null;
}

// src/application/use-cases/InitiatePaymentUseCase.ts
export class InitiatePaymentUseCase {
  constructor(
    private readonly transactionRepository: ITransactionRepository,
    private readonly paymentGateway: IPaymentGatewayPort,
    private readonly riskScoring: IRiskScoringPort,
    private readonly retryScheduler: IRetrySchedulerPort,
    private readonly eventPublisher: IEventPublisher,
  ) {}

  async execute(command: InitiatePaymentCommand): Promise<InitiatePaymentResult> {
    const money = Money.of(command.amountCents, command.currencyCode);

    // Domain entity creation enforces invariants (throws if currency unsupported, amount <= 0)
    const transaction = PaymentTransaction.initiate({
      customerId: CustomerId.of(command.customerId),
      amount: money,
      paymentMethodToken: command.paymentMethodToken,
      idempotencyKey: command.idempotencyKey,
    });

    // Application-layer concern: risk gate before charging
    const riskScore = await this.riskScoring.score(transaction);
    if (riskScore.exceedsThreshold(RiskScore.HIGH_RISK_THRESHOLD)) {
      transaction.block(riskScore);
      await this.transactionRepository.save(transaction);
      await this.eventPublisher.publish(transaction.domainEvents);
      throw new PaymentBlockedByRiskError(transaction.id.value, riskScore.value);
    }

    const attempt = transaction.createAttempt(command.preferredGateway);
    const result = await this.paymentGateway.charge(attempt);

    if (result.success) {
      transaction.recordSuccess(attempt, result.providerTransactionId!);
    } else {
      transaction.recordFailure(attempt, result.failureCode!, result.failureMessage!);
      if (transaction.isEligibleForRetry()) {
        // Exponential backoff: attempt 1 = 30s, attempt 2 = 120s, attempt 3 = 600s
        const delayMs = Math.pow(4, transaction.attemptCount) * 30_000;
        await this.retryScheduler.scheduleRetry(transaction.id.value, delayMs);
      }
    }

    await this.transactionRepository.save(transaction);
    await this.eventPublisher.publish(transaction.domainEvents);
    transaction.clearDomainEvents();

    return {
      transactionId: transaction.id.value,
      status: transaction.status,
      providerTransactionId: result.providerTransactionId,
    };
  }
}
```

---

### Architecture Decision Record (ADR)

**Title:** Use Clean Architecture with per-gateway adapter pattern for payment processing  
**Status:** Accepted  
**Context:** The system must support Stripe and Braintree as payment gateways, with the ability to add a third gateway or switch primary gateways within a quarter. Risk scoring logic is proprietary and must remain independent of any gateway SDK. A background retry worker must reuse the same payment processing logic as the API without code duplication. These requirements create strong pressure for decoupling business logic from infrastructure.  
**Decision:** Apply Clean Architecture with explicit port interfaces (`IPaymentGatewayPort`, `IRiskScoringPort`) in the application layer. Each gateway gets its own adapter class. The retry worker is an infrastructure-layer adapter that invokes the same `RetryFailedPaymentUseCase` as if it were an HTTP request. Prisma is used for persistence but is strictly isolated to the infrastructure layer via a repository mapper pattern.  
**Consequences:** Adding a third payment gateway requires only a new adapter class implementing `IPaymentGatewayPort` and a wiring change in the Composition Root -- no Use Case code changes. Use Cases are fully testable without Stripe/Braintree credentials or a PostgreSQL instance. The mapping layer between Prisma models and domain entities adds approximately 80--120 lines of boilerplate per aggregate, which is an accepted trade-off for the domain model freedom gained.

---

### Testing Strategy

| Layer                  | Test Type             | Tooling                        | Infra Required  |
|------------------------|-----------------------|--------------------------------|-----------------|
| `PaymentTransaction`, `Money`, `RiskScore` | Pure unit | Vitest, zero mocks | None |
| `InitiatePaymentUseCase` | Unit with in-memory doubles | Vitest + `InMemoryTransactionRepository` | None |
| `PrismaTransactionRepository` | Integration | Vitest + Testcontainers (PostgreSQL 15) | Docker |
| `StripePaymentGateway` | Integration | Vitest + Stripe test mode keys | Network (Stripe sandbox) |
| Full payment flow | E2E | Supertest against Fastify app + Testcontainers | Docker |

For the Use Case unit tests, implement `InMemoryTransactionRepository` as a real in-memory store:

```typescript
// src/infrastructure/testing/InMemoryTransactionRepository.ts
export class InMemoryTransactionRepository implements ITransactionRepository {
  private store = new Map<string, PaymentTransaction>();

  async save(transaction: PaymentTransaction): Promise<void> {
    this.store.set(transaction.id.value, transaction);
  }

  async findById(id: TransactionId): Promise<PaymentTransaction | null> {
    return this.store.get(id.value) ?? null;
  }

  async findPendingRetries(maxAttempts: number, beforeDate: Date): Promise<PaymentTransaction[]> {
    return [...this.store.values()].filter(
      t => t.status === "RETRYING" &&
           t.attemptCount < maxAttempts &&
           t.lastAttemptAt < beforeDate
    );
  }
}
```

---

### Enforcement Configuration

```js
// .dependency-cruiser.js
module.exports = {
  forbidden: [
    {
      name: "domain-no-infrastructure",
      severity: "error",
      from: { path: "^src/domain" },
      to: { path: "^src/(infrastructure|di)" },
    },
    {
      name: "application-no-infrastructure",
      severity: "error",
      from: { path: "^src/application" },
      to: { path: "^src/(infrastructure|di)" },
    },
    {
      name: "domain-no-application",
      severity: "error",
      from: { path: "^src/domain" },
      to: { path: "^src/application" },
    },
  ],
  options: { tsConfig: { fileName: "tsconfig.json" } },
};
```

Add to CI pipeline (`package.json`):
```json
{
  "scripts": {
    "check:architecture": "depcruise src --config .dependency-cruiser.js",
    "pretest": "npm run check:architecture"
  }
}
```

This configuration means any pull request that accidentally imports a Prisma type or Stripe SDK class into a Use Case or domain entity will fail the CI pipeline before it can be merged. The architecture rules are self-enforcing from day one.
