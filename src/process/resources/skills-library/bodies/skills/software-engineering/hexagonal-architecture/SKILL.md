---
name: hexagonal-architecture
description: |
  Guides expert-level hexagonal architecture implementation: design-patterns and clean-code decision frameworks, production-ready patterns, and concrete templates for hexagonal architecture workflows.
  Use when the user asks about hexagonal architecture, hexagonal architecture configuration, or architecture best practices for hexagonal projects.
  Do NOT use when the user needs a different architecture design capability -- check sibling skills in the architecture design subcategory.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "architecture design-patterns clean-code"
  category: "software-engineering"
  subcategory: "architecture-design"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Hexagonal Architecture

## When to Use

**Use this skill when:**
- A user wants to implement Ports and Adapters (Hexagonal) architecture in a new or existing application and needs concrete structural guidance
- A user is struggling with tight coupling between their domain logic and infrastructure concerns (databases, message queues, HTTP frameworks) and needs an architectural pattern to separate them
- A user wants to make their application testable without spinning up external dependencies like PostgreSQL, Redis, or third-party APIs
- A user needs to swap infrastructure implementations -- for example, migrating from REST to gRPC, from PostgreSQL to MongoDB, or from synchronous HTTP to event-driven messaging -- without rewriting domain logic
- A user is designing a domain-driven application and needs a structural pattern that maps cleanly onto bounded contexts and aggregates
- A user wants to evaluate whether hexagonal architecture is appropriate for their project and needs a concrete decision framework with trade-offs
- A user needs code templates, folder structures, or interface design patterns for a specific programming language within this architecture
- A user is onboarding a team to hexagonal architecture and needs explanatory material, naming conventions, or internal guidelines

**Do NOT use this skill when:**
- The user needs guidance on microservices decomposition strategy -- use a microservices design skill instead; hexagonal architecture applies within a single service, not across service boundaries
- The user is building a simple CRUD application with minimal business logic where the overhead of ports and adapters adds no value -- recommend a simpler layered architecture
- The user asks about event-driven architecture patterns like sagas, event sourcing, or CQRS as primary topics -- those are distinct patterns that can complement hexagonal architecture but require dedicated skills
- The user needs a frontend architecture pattern -- component architecture and state management patterns for React or Vue are handled in separate skills
- The user is asking about deployment topology, container orchestration, or cloud infrastructure -- those concerns live outside the application architecture layer this skill addresses
- The user needs guidance on testing strategies broadly -- while hexagonal architecture enables specific testing approaches, a general testing skill should cover TDD, BDD, and test pyramid decisions

---

## Process

### 1. Establish the Domain Core First

Before writing any infrastructure code, define and isolate the domain model completely.

- Identify the core business entities and their behaviors. In an e-commerce system this means Order, Customer, Product, and Payment -- not OrderRepository or PaymentGateway.
- Write domain objects as pure value objects and entities with no framework imports, no ORM annotations, and no HTTP concerns. A Java Order class should have zero Spring annotations. A Python Order class should have no SQLAlchemy columns.
- Define aggregate roots -- the single entry point for each cluster of domain objects. Enforce invariants inside the aggregate, not in service layers. For example, an Order aggregate enforces that line items cannot be added after the order is submitted.
- Map domain events that the core needs to emit: OrderPlaced, PaymentFailed, InventoryReserved. These are pure data structures, not infrastructure messages.
- Confirm the domain core has zero external dependencies. Run `grep -r "import" src/domain/` and flag any import that references an infrastructure library. The only acceptable imports are the standard library, peer domain objects, and shared kernel types.

### 2. Define Inbound Ports (Driving Side)

Inbound ports are interfaces that describe what the application can do, expressed in domain vocabulary.

- Create one interface per use case, not per entity. `PlaceOrderUseCase` is correct. `OrderService` is a smell -- it implies a grab-bag of unrelated operations.
- Name interfaces after business capabilities: `AuthenticateUserUseCase`, `ProcessRefundUseCase`, `GenerateInvoiceUseCase`. Avoid technical names like `UserManager` or `OrderProcessor`.
- Each use case interface typically has a single method. `PlaceOrderUseCase.execute(command: PlaceOrderCommand): OrderId` is the canonical pattern. Commands carry the input data; the return type carries only what the caller needs.
- Use Command objects (input DTOs) and Result objects (output DTOs) at port boundaries, never raw domain entities. This prevents domain object mutation from outside the core and allows the port signature to evolve independently.
- Inbound ports live in the `application` layer (sometimes called `core` or `hexagon`). They are implemented by application services inside the same layer.

### 3. Define Outbound Ports (Driven Side)

Outbound ports are interfaces that the domain core declares when it needs something from the outside world.

- Name outbound ports after what the domain needs, not what provides it. `OrderRepository` is correct. `PostgresOrderStorage` belongs in the adapter layer, not the port definition.
- Common outbound port categories: persistence (repositories), external services (payment gateways, email senders, SMS providers), event publishing (domain event dispatchers), and clock/random sources (for testability of time-dependent logic).
- Keep port methods domain-oriented. `OrderRepository.save(order: Order)` and `OrderRepository.findById(orderId: OrderId): Optional[Order]` are correct. Avoid leaking query language details: `findByStatusAndCreatedAtBetween` is acceptable but `executeRawSQL` is not.
- Outbound ports are defined in the domain or application layer but implemented in the infrastructure layer. This is the Dependency Inversion Principle applied structurally. The domain never imports from infrastructure -- infrastructure imports from the domain.
- For external service ports, define them narrowly. If the domain only needs to charge a credit card, define `PaymentGateway.charge(amount: Money, token: PaymentToken): ChargeResult`. Do not expose refund, subscription, or webhook methods on the same port if the domain does not need them at this boundary.

### 4. Implement Application Services (Use Case Implementations)

Application services are the orchestrators inside the hexagon. They implement inbound ports and use outbound ports.

- Each application service method corresponds to exactly one use case. It retrieves domain objects via outbound ports, invokes domain logic on those objects, and then persists the result via outbound ports.
- Application services should contain zero business logic. "If the order total exceeds $1000, apply a 10% discount" belongs in the Order aggregate, not the application service. The service calls `order.applyDiscountPolicy(policy)` and trusts the domain to decide.
- Transaction boundaries belong at the application service level, not the domain. Wrap the entire use case execution in a single transaction. If your framework provides a `@Transactional` annotation, apply it to the application service method -- never to domain objects.
- Application services handle cross-cutting concerns: logging at the use case entry/exit point (not inside domain objects), publishing domain events after a successful transaction, and coordinating calls across multiple outbound ports when the use case requires it.
- Return Results, not exceptions, for expected failure modes. `PlaceOrderResult` can be a discriminated union of `OrderPlaced(orderId)` or `PlacementFailed(reason: OutOfStock | PaymentDeclined | InvalidAddress)`. Reserve exceptions for truly unexpected technical failures.

### 5. Implement Adapters

Adapters translate between the hexagon's language and the outside world's language.

- **Inbound adapters** (driving adapters) receive external requests and invoke inbound ports. Examples: REST controllers, GraphQL resolvers, CLI command handlers, message queue consumers, gRPC service implementations, scheduled job runners.
- **Outbound adapters** (driven adapters) implement outbound ports using real infrastructure. Examples: JPA/SQLAlchemy repository implementations, Stripe SDK wrappers, SendGrid email senders, Kafka producers, Redis cache clients.
- Each adapter should be thin. An HTTP adapter's only job is to parse the HTTP request, map it to a Command object, call the use case, and map the Result to an HTTP response. If an adapter contains conditionals about business rules, those rules belong in the domain.
- Name adapters by their technology: `PostgresOrderRepository`, `StripePaymentGateway`, `HttpOrderController`, `KafkaOrderEventPublisher`. The technology name in the class name makes the adapter layer obvious.
- Adapters handle technology-specific error mapping. A `PostgresOrderRepository` catches `DataIntegrityViolationException` and re-throws a domain-level `OrderAlreadyExistsException` so the application service sees only domain errors.

### 6. Design the Folder Structure

Structure enforces architecture. A flat `src/` folder defeats the purpose of hexagonal architecture.

- Canonical folder structure (technology-agnostic):
  ```
  src/
  ├── domain/
  │   ├── model/          # Entities, value objects, aggregates
  │   ├── events/         # Domain events (pure data)
  │   └── exceptions/     # Domain-specific exception types
  ├── application/
  │   ├── ports/
  │   │   ├── inbound/    # Use case interfaces + Command/Result types
  │   │   └── outbound/   # Repository and external service interfaces
  │   └── services/       # Use case implementations (application services)
  └── infrastructure/
      ├── adapters/
      │   ├── inbound/    # HTTP controllers, CLI handlers, message consumers
      │   └── outbound/   # DB repositories, external API clients, event publishers
      ├── config/         # Dependency injection wiring, framework config
      └── persistence/    # ORM models, migration files (separate from domain models)
  ```
- In Python, enforce boundaries with import linters like `import-linter` or `pydepcheck`. Configure rules that forbid `domain` from importing `infrastructure` or `application`.
- In Java/Kotlin, use ArchUnit tests to assert that classes in `domain` packages have no dependencies on `infrastructure` packages. A typical ArchUnit rule runs in CI and fails the build if a developer accidentally imports a JPA entity into the domain.
- In TypeScript/Node.js, use ESLint with `eslint-plugin-import` and configure `no-restricted-imports` rules, or use NX's module boundary rules if working in a monorepo.
- Keep ORM/persistence models strictly in `infrastructure/persistence/`. Map between persistence models and domain entities in the outbound adapter, not in the domain itself. A domain `Order` entity and a `OrderOrmModel` are different classes connected by a mapper.

### 7. Wire Dependencies and Configure the Composition Root

The composition root is where all the pieces come together. It is the only place where concrete implementations are bound to interfaces.

- The composition root lives entirely in the `infrastructure/config` layer. It is the only place that knows about all other layers simultaneously.
- Use constructor injection everywhere. Field injection and service locators hide dependencies and make testing harder. A class's required ports should be obvious from its constructor signature.
- In Spring Boot (Java/Kotlin): `@Configuration` classes in `infrastructure/config` instantiate adapters and inject them into application services. Application services and domain objects should be `@Component`-free where possible to keep them framework-agnostic.
- In Python (FastAPI or Flask): use a dependency injection framework like `injector` or `lagom`, or manually wire dependencies in a `container.py` module. Call `container.wire(modules=[...])` at startup.
- In Node.js/TypeScript: use a DI container like `tsyringe` or `inversify`, or implement a simple manual factory module that creates and wires all dependencies before the HTTP server starts listening.
- The test composition root is separate from the production one. In tests, swap real outbound adapters for in-memory or stub implementations. This is where hexagonal architecture pays off -- a full application service test runs without a database by substituting `InMemoryOrderRepository` for `PostgresOrderRepository`.

### 8. Validate Architecture Integrity Continuously

Architecture degrades without enforcement. Build automated checks into CI.

- Write architecture fitness functions: automated tests that assert structural rules. "No class in `domain` imports from `infrastructure`" should fail the CI build, not just a code review.
- Track dependency count metrics. An application service that takes more than 5-6 outbound ports in its constructor is a sign of a god service that should be decomposed.
- Review port granularity quarterly. Ports that have grown to 10+ methods are a smell indicating the port is doing too much -- split into narrower interfaces.
- Use mutation testing (PIT for Java, mutmut for Python, Stryker for TypeScript) on domain logic to verify test coverage is meaningful, not just present. Domain objects should achieve near-100% mutation score given their critical business logic.
- Track the ratio of domain tests to integration tests. A healthy hexagonal codebase should have 70-80% of tests as fast unit tests of domain and application services (using in-memory adapters), 15-20% as integration tests of individual adapters (testing the real PostgreSQL adapter against a test database), and 5-10% as end-to-end tests.

---

## Output Format

When providing hexagonal architecture guidance, structure the response as follows:

```
## Hexagonal Architecture Design: [System Name]

### Context Assessment
- Application type: [domain-rich service / CRUD / event-driven / etc.]
- Team size and experience: [relevant to complexity decisions]
- Key infrastructure concerns: [which external systems require adapters]
- Primary testability goal: [what the user wants to test without real infrastructure]

### Domain Core Design

#### Aggregates and Entities
| Aggregate Root | Key Invariants | Domain Events Emitted |
|----------------|---------------|----------------------|
| [Name]         | [rule1, rule2] | [EventName1, EventName2] |

#### Value Objects
| Value Object | Validation Rules | Why Not a Primitive |
|--------------|-----------------|---------------------|
| [Name]       | [constraints]   | [domain meaning]    |

### Port Definitions

#### Inbound Ports (Use Cases)
| Port Interface         | Command Input        | Result Output              |
|------------------------|---------------------|---------------------------|
| [UseCaseInterface]     | [CommandType]       | [ResultType / union type] |

#### Outbound Ports (Dependencies)
| Port Interface         | Responsibility          | Implementations Planned    |
|------------------------|------------------------|---------------------------|
| [RepositoryInterface]  | [what domain needs]    | [PostgresImpl, InMemoryImpl] |

### Adapter Plan
| Adapter Name              | Type     | Port Implemented           | Technology      |
|---------------------------|----------|---------------------------|-----------------|
| [HttpOrderController]     | Inbound  | [PlaceOrderUseCase]       | FastAPI/Spring  |
| [PostgresOrderRepository] | Outbound | [OrderRepository]         | SQLAlchemy/JPA  |

### Recommended Folder Structure
[Language-specific directory tree]

### Architecture Enforcement Strategy
- Import linting tool: [tool name and configuration snippet]
- Architecture test approach: [ArchUnit / import-linter / ESLint rules]
- Key forbidden dependency directions: [explicit rules]

### Implementation Code Templates
[Concrete code examples for: domain entity, inbound port + command, outbound port,
 application service, at least one adapter, composition root wiring]

### Trade-off Notes
| Decision | Alternative Considered | Reason for Choice |
|----------|----------------------|-------------------|
| [choice] | [alternative]        | [reasoning]       |
```

---

## Rules

1. **Never place business logic in adapters.** If an HTTP controller contains an `if` statement that determines which use case to invoke based on business state, that decision belongs in the domain or application layer. Adapters only translate and delegate.

2. **Never let domain objects depend on framework types.** A domain entity annotated with `@Entity` (JPA), `db.Model` (SQLAlchemy), or `@Schema` (Mongoose) is no longer a pure domain object -- it is an ORM model disguised as a domain object. Maintain separate persistence models and map between them.

3. **Outbound port interfaces must live in the domain or application layer, not the infrastructure layer.** If `OrderRepository` is defined next to `PostgresOrderRepository`, the dependency direction is wrong. The infrastructure adapts to the domain's declared needs, not the other way around.

4. **Never use the same DTO class across multiple layers.** A `CreateOrderRequest` from the HTTP layer, a `PlaceOrderCommand` for the application port, and an `OrderOrmModel` for persistence are three different classes for good reason. Collapsing them creates tight coupling that defeats the architecture.

5. **Application services must not return domain entities directly to adapters.** Return dedicated output types (Result objects or DTOs). If an adapter receives a live domain entity, it can call domain methods inappropriately, violating encapsulation.

6. **Use case interfaces must have a single method.** An interface named `OrderUseCases` with `placeOrder`, `cancelOrder`, `refundOrder`, and `updateShipping` violates the Interface Segregation Principle and creates unnecessary coupling between callers. One interface, one method.

7. **In-memory adapter implementations are first-class code, not throwaway test helpers.** `InMemoryOrderRepository` used in unit tests must correctly implement the full `OrderRepository` contract, including query semantics. A buggy in-memory implementation produces passing tests that fail in production.

8. **Domain events must be published after transaction commit, not before.** Publishing a `OrderPlaced` event inside a transaction that subsequently rolls back creates an inconsistency. Use a transactional outbox pattern or an after-commit hook provided by the framework to guarantee events are published only after the transaction succeeds.

9. **Port granularity should match the pace of change.** If `PaymentGateway` and `FraudDetectionService` are almost always changed together and always deployed together, they may belong as a single port. If they evolve independently and could be swapped independently, keep them separate. Premature splitting adds interface proliferation without benefit.

10. **Never skip the anti-corruption layer when integrating with legacy or external systems.** A third-party API returns `cust_id`, `ord_dt`, and `pmt_stat`. Mapping these directly into domain types couples the domain to the external system's naming. Define an anti-corruption layer inside the outbound adapter that translates to `customerId: CustomerId`, `orderDate: LocalDate`, `paymentStatus: PaymentStatus` before crossing into the domain.

---

## Edge Cases

### Legacy Codebase Migration

Introducing hexagonal architecture into an existing monolith with tangled layers requires a strangler fig approach, not a rewrite.

- Identify one bounded context or vertical slice (e.g., the payment flow) that is currently being modified for a business reason. Apply hexagonal architecture to that slice only.
- Create a facade that wraps the legacy code. The facade implements the new outbound port interface but internally calls the old service. This is the anti-corruption layer -- the new domain talks to the port; the old code is hidden behind the adapter.
- Do not move domain logic out of existing services until tests cover that logic. Write characterization tests (also called golden master tests) against the existing behavior first, then refactor.
- Expect the migration to take 6-18 months for a medium-sized codebase (50k-200k lines of code). Attempting full migration faster creates instability. Track migration progress with a metric: percentage of use cases implemented through ports vs. direct calls.
- Watch for "hexagonal islands" -- new hexagonal code that still calls old procedural code directly because a port was not defined for that dependency. Every external call must cross a port boundary, even temporarily through an adapter that wraps the legacy call.

### Hexagonal Architecture in Microservices

When each microservice uses hexagonal architecture internally, cross-service communication introduces new adapter considerations.

- Synchronous HTTP/gRPC calls to other services become outbound adapters. Define a `UserProfilePort` in the service that needs user data; implement it as `HttpUserProfileAdapter` that calls the user service. Never call another microservice's API directly from a domain object or application service.
- Asynchronous message consumption (Kafka, RabbitMQ, SQS) creates inbound adapters. A `KafkaInventoryEventConsumer` subscribes to inventory events and calls the appropriate use case via the inbound port. The domain knows nothing about Kafka.
- The domain events concept requires clarification: domain events emitted inside one service's hexagon are not the same as integration events published on a message bus. The internal domain event triggers application-layer reactions; the integration event is published by an outbound adapter after the transaction commits. These are two separate models.
- Each microservice has its own hexagon. Do not share domain objects across services. If Order Service and Shipping Service both need an `Address` concept, each defines its own `Address` value object for its own bounded context.

### High-Performance and Latency-Sensitive Applications

The port/adapter translation layers introduce object mapping overhead. For most applications this is negligible (sub-millisecond). For high-throughput systems (tens of thousands of requests per second), profile before abstracting.

- Measure the mapping overhead with a profiler (async-profiler for JVM, py-spy for Python, clinic.js for Node) under realistic load. If mapping between persistence model and domain entity accounts for more than 2-3% of request latency, consider optimization strategies.
- For read-heavy paths, implement a dedicated query model that bypasses the domain layer entirely -- this is compatible with hexagonal architecture. Define a `OrderSummaryQuery` outbound port with a `findSummariesByCustomer(customerId)` method that returns flat DTOs directly from a SQL query. This is the read side of a lightweight CQRS approach.
- Never cache inside domain objects. Define a `CachingOrderRepository` outbound adapter that wraps the real `PostgresOrderRepository` and adds Redis caching. Swap it in the composition root. The domain and application service are unaware of caching.
- If the domain core is computationally expensive (complex pricing engines, risk calculations), make it stateless and design it for parallel execution. Pure functions in the domain core are trivially parallelizable.

### Testing Strategy Complications

The primary promise of hexagonal architecture is fast, isolated tests. Failures to achieve this usually stem from port design mistakes.

- If unit tests of application services still require a real database, the outbound ports have leaked infrastructure concerns (e.g., the port method returns a database cursor or a lazy-loaded ORM proxy). Redesign the port to return fully-materialized domain objects.
- In-memory repository implementations for test use can diverge from real implementations over time. Write a shared contract test suite -- a set of parameterized tests that run against both `InMemoryOrderRepository` and `PostgresOrderRepository`. The contract test verifies that both implementations honor the same semantics for `save`, `findById`, and query methods.
- Adapter integration tests should run against real infrastructure using Docker-based test containers (Testcontainers for JVM and Python, testcontainers-node for TypeScript). Do not mock the database in adapter tests -- the adapter's entire job is to interact correctly with the real technology.
- Watch for test coupling through shared state in in-memory implementations. Each test must start with a clean in-memory store. Use a `clear()` method or recreate the in-memory adapter in the test setup method.

### Shared Kernel and Multi-Bounded-Context Applications

When a single application (not microservices) spans multiple bounded contexts, hexagonal architecture requires additional discipline.

- Define a Shared Kernel package for types that genuinely cross context boundaries: `Money`, `CustomerId`, `EmailAddress`. Keep it minimal -- any type that is "shared everywhere" tends to become a dumping ground.
- Each bounded context has its own hexagon: its own domain objects, its own ports, its own adapters. Within a single process, inter-context communication goes through application-layer events or explicit service calls via defined interfaces -- never through direct object references to another context's aggregates.
- If two contexts share a database (common in modular monoliths), their outbound adapters may connect to the same PostgreSQL instance but must use different schemas or table prefixes. Context A's adapter must not query Context B's tables.
- A "coordination use case" that spans multiple bounded contexts belongs in an orchestration layer above both hexagons. It calls inbound ports of each context in sequence, handling rollback or compensation if a step fails.

### Framework-Specific Pitfalls

Several popular frameworks have idioms that conflict with hexagonal architecture.

- **Django (Python):** Django's ORM models are tightly coupled to the database and to the web framework. The standard Django pattern of putting business logic in models violates hexagonal principles. Separate Django models into `infrastructure/persistence/` and define pure Python domain classes in `domain/model/`. Use `from_orm()` factory methods on domain classes or dedicated mappers to translate.
- **Ruby on Rails:** ActiveRecord mixes persistence and domain logic in a single class. Adopt a service object pattern where Rails models act only as persistence models. Extract domain logic to plain Ruby objects (POROs) in a `domain/` directory. Use `app/adapters/` for inbound and outbound adapters.
- **Spring Boot (Java):** Spring's auto-scanning and `@Autowired` can accidentally inject any bean anywhere. Restrict component scanning to the infrastructure layer. Use explicit `@Configuration` classes to wire the application rather than relying on classpath scanning for domain and application classes.
- **NestJS (TypeScript):** NestJS decorators (`@Injectable`, `@Controller`) encourage mixing infrastructure concerns into business logic. Keep domain and application service classes as plain TypeScript classes. Define NestJS providers in an infrastructure module that wraps the plain classes.

### Evolving Ports Over Time

Ports are interfaces, but interfaces evolve. Changing a port interface without breaking existing adapters requires care.

- Apply the Open/Closed Principle to port evolution. Add new methods to a port only if all existing implementations can implement them. If a new capability needs a substantially different contract, define a new port rather than mutating the existing one.
- Use the Tolerant Reader pattern in inbound ports when commands are passed in from external systems. Ignore unknown fields in Command objects rather than rejecting them, allowing the sending adapter to evolve independently.
- Version outbound ports explicitly when breaking changes are unavoidable: `OrderRepositoryV2` alongside `OrderRepository` during a migration period. Update adapters one at a time. Remove `OrderRepository` only after all adapters are migrated.
- Track port stability with a dependency metric. A port that has changed its interface more than 3 times in 6 months is unstable and likely means the domain model in that area is still being discovered. Treat it as a draft interface and avoid building multiple adapters against it until it stabilizes.

---

## Example

**Input:** "I'm building an order management service in Python. It needs to accept orders via a REST API, store them in PostgreSQL, publish order events to Kafka, and integrate with an external Stripe payment gateway. The team of 4 wants it to be highly testable. What does the full hexagonal architecture look like for this?"

**Output:**

---

## Hexagonal Architecture Design: Order Management Service

### Context Assessment
- Application type: Domain-rich service with external integrations
- Team size and experience: 4 engineers -- hexagonal adds moderate upfront investment, high long-term return
- Key infrastructure concerns: PostgreSQL persistence, Kafka event publishing, Stripe HTTP integration, REST API exposure
- Primary testability goal: Test order placement logic, payment charging, and event publishing without real Kafka, PostgreSQL, or Stripe

---

### Domain Core Design

#### Aggregates and Entities
| Aggregate Root | Key Invariants | Domain Events Emitted |
|----------------|---------------|----------------------|
| Order | Items cannot be added after submission; total must be > $0; status transitions are one-directional | OrderPlaced, OrderCancelled, PaymentFailed |
| OrderItem | Quantity must be >= 1; unit price must be >= $0.01 | (none -- managed by Order aggregate) |

#### Value Objects
| Value Object | Validation Rules | Why Not a Primitive |
|--------------|-----------------|---------------------|
| OrderId | UUID v4 format, immutable | Prevents passing a CustomerId where an OrderId is expected |
| Money | Amount >= 0, currency is ISO 4217 3-letter code, stored as integer cents | Prevents floating point arithmetic errors on financial amounts |
| PaymentToken | Non-empty string, max 255 chars | Represents a Stripe payment method ID with domain meaning |
| OrderStatus | Enum: PENDING, CONFIRMED, CANCELLED, REFUNDED | Encodes valid state transitions, prevents invalid string values |

---

### Port Definitions

#### Inbound Ports (Use Cases)
| Port Interface | Command Input | Result Output |
|----------------|--------------|---------------|
| `PlaceOrderUseCase` | `PlaceOrderCommand(customer_id, items: list[OrderItemData], payment_token)` | `PlaceOrderResult` -- union of `OrderPlaced(order_id)` or `PlacementFailed(reason)` |
| `CancelOrderUseCase` | `CancelOrderCommand(order_id, requested_by_customer_id)` | `CancelOrderResult` -- union of `OrderCancelled(order_id)` or `CancellationFailed(reason)` |
| `GetOrderUseCase` | `GetOrderQuery(order_id, requesting_customer_id)` | `OrderSummary` DTO or `OrderNotFound` |

#### Outbound Ports (Dependencies)
| Port Interface | Responsibility | Implementations Planned |
|----------------|---------------|------------------------|
| `OrderRepository` | Persist and retrieve Order aggregates | `PostgresOrderRepository`, `InMemoryOrderRepository` |
| `PaymentGateway` | Charge and refund payment tokens | `StripePaymentGateway`, `StubPaymentGateway` |
| `OrderEventPublisher` | Publish domain events to message bus | `KafkaOrderEventPublisher`, `InMemoryOrderEventPublisher` |

---

### Adapter Plan
| Adapter Name | Type | Port Implemented | Technology |
|---|---|---|---|
| `HttpOrderController` | Inbound | `PlaceOrderUseCase`, `CancelOrderUseCase`, `GetOrderUseCase` | FastAPI |
| `PostgresOrderRepository` | Outbound | `OrderRepository` | SQLAlchemy Core (not ORM) |
| `StripePaymentGateway` | Outbound | `PaymentGateway` | stripe-python SDK |
| `KafkaOrderEventPublisher` | Outbound | `OrderEventPublisher` | confluent-kafka-python |

---

### Recommended Folder Structure (Python)

```
src/
├── domain/
│   ├── model/
│   │   ├── order.py          # Order aggregate, OrderItem entity
│   │   ├── order_id.py       # OrderId value object
│   │   ├── money.py          # Money value object
│   │   └── order_status.py   # OrderStatus enum + transition rules
│   ├── events/
│   │   ├── order_placed.py   # OrderPlaced domain event (dataclass)
│   │   └── order_cancelled.py
│   └── exceptions/
│       ├── order_not_found.py
│       └── invalid_order_transition.py
├── application/
│   ├── ports/
│   │   ├── inbound/
│   │   │   ├── place_order_use_case.py   # Protocol/ABC + Command + Result types
│   │   │   ├── cancel_order_use_case.py
│   │   │   └── get_order_use_case.py
│   │   └── outbound/
│   │       ├── order_repository.py       # Protocol/ABC
│   │       ├── payment_gateway.py        # Protocol/ABC
│   │       └── order_event_publisher.py  # Protocol/ABC
│   └── services/
│       ├── place_order_service.py        # Implements PlaceOrderUseCase
│       ├── cancel_order_service.py
│       └── get_order_service.py
└── infrastructure/
    ├── adapters/
    │   ├── inbound/
    │   │   └── http/
    │   │       ├── order_controller.py   # FastAPI router
    │   │       └── order_schemas.py      # Pydantic request/response models
    │   └── outbound/
    │       ├── postgres_order_repository.py
    │       ├── stripe_payment_gateway.py
    │       └── kafka_order_event_publisher.py
    ├── persistence/
    │   ├── order_orm_model.py   # SQLAlchemy Table definitions
    │   └── order_mapper.py      # Maps ORM rows <-> Order domain objects
    └── config/
        ├── container.py         # Composition root -- wires everything together
        └── settings.py          # Environment variable loading (pydantic-settings)
tests/
├── domain/                      # Pure unit tests, zero infrastructure
├── application/                 # Service tests using in-memory adapters
├── adapters/                    # Integration tests per adapter using testcontainers
└── contract/                    # Shared contract tests for InMemory vs Postgres repo
```

---

### Architecture Enforcement Strategy
- Import linting tool: `import-linter` with the following `.importlinter` configuration:
  ```ini
  [importlinter]
  root_package = src

  [importlinter:contract:domain-independence]
  name = Domain must not import from application or infrastructure
  type = forbidden
  source_modules = src.domain
  forbidden_modules = src.application, src.infrastructure

  [importlinter:contract:application-independence]
  name = Application must not import from infrastructure
  type = forbidden
  source_modules = src.application
  forbidden_modules = src.infrastructure
  ```
- Run `lint-imports` in CI as a required check. Block merge if it fails.
- Key forbidden dependency directions: `domain` -> `application`, `domain` -> `infrastructure`, `application` -> `infrastructure`

---

### Implementation Code Templates

#### Domain Entity -- `Order` Aggregate

```python
# src/domain/model/order.py
from dataclasses import dataclass, field
from typing import List
from src.domain.model.order_id import OrderId
from src.domain.model.money import Money
from src.domain.model.order_status import OrderStatus
from src.domain.events.order_placed import OrderPlaced
from src.domain.exceptions.invalid_order_transition import InvalidOrderTransition

@dataclass
class OrderItem:
    product_id: str
    quantity: int
    unit_price: Money

    def __post_init__(self):
        if self.quantity < 1:
            raise ValueError("Quantity must be at least 1")
        if self.unit_price.amount_cents <= 0:
            raise ValueError("Unit price must be positive")

    @property
    def subtotal(self) -> Money:
        return Money(self.unit_price.amount_cents * self.quantity, self.unit_price.currency)


@dataclass
class Order:
    order_id: OrderId
    customer_id: str
    items: List[OrderItem]
    status: OrderStatus = OrderStatus.PENDING
    _domain_events: List = field(default_factory=list, repr=False, compare=False)

    def __post_init__(self):
        if not self.items:
            raise ValueError("An order must have at least one item")

    @property
    def total(self) -> Money:
        currency = self.items[0].unit_price.currency
        total_cents = sum(item.subtotal.amount_cents for item in self.items)
        return Money(total_cents, currency)

    def confirm_payment(self) -> None:
        if self.status != OrderStatus.PENDING:
            raise InvalidOrderTransition(
                f"Cannot confirm payment for order in status {self.status}"
            )
        self.status = OrderStatus.CONFIRMED
        self._domain_events.append(OrderPlaced(order_id=self.order_id, total=self.total))

    def cancel(self) -> None:
        if self.status not in (OrderStatus.PENDING, OrderStatus.CONFIRMED):
            raise InvalidOrderTransition(
                f"Cannot cancel order in status {self.status}"
            )
        self.status = OrderStatus.CANCELLED

    def pull_domain_events(self) -> List:
        events = list(self._domain_events)
        self._domain_events.clear()
        return events
```

#### Inbound Port -- `PlaceOrderUseCase`

```python
# src/application/ports/inbound/place_order_use_case.py
from dataclasses import dataclass
from typing import Union, List
from typing import Protocol

@dataclass
class OrderItemData:
    product_id: str
    quantity: int
    unit_price_cents: int
    currency: str

@dataclass
class PlaceOrderCommand:
    customer_id: str
    items: List[OrderItemData]
    payment_token: str

@dataclass
class OrderPlacedResult:
    order_id: str

@dataclass
class PlacementFailedResult:
    reason: str  # "payment_declined" | "out_of_stock" | "invalid_address"

PlaceOrderResult = Union[OrderPlacedResult, PlacementFailedResult]

class PlaceOrderUseCase(Protocol):
    def execute(self, command: PlaceOrderCommand) -> PlaceOrderResult:
        ...
```

#### Outbound Port -- `OrderRepository`

```python
# src/application/ports/outbound/order_repository.py
from typing import Optional, Protocol
from src.domain.model.order import Order
from src.domain.model.order_id import OrderId

class OrderRepository(Protocol):
    def save(self, order: Order) -> None:
        ...

    def find_by_id(self, order_id: OrderId) -> Optional[Order]:
        ...

    def find_by_customer_id(self, customer_id: str) -> list[Order]:
        ...
```

#### Application Service -- `PlaceOrderService`

```python
# src/application/services/place_order_service.py
import uuid
from src.application.ports.inbound.place_order_use_case import (
    PlaceOrderCommand, PlaceOrderResult, OrderPlacedResult, PlacementFailedResult
)
from src.application.ports.outbound.order_repository import OrderRepository
from src.application.ports.outbound.payment_gateway import PaymentGateway
from src.application.ports.outbound.order_event_publisher import OrderEventPublisher
from src.domain.model.order import Order, OrderItem
from src.domain.model.order_id import OrderId
from src.domain.model.money import Money

class PlaceOrderService:
    def __init__(
        self,
        order_repository: OrderRepository,
        payment_gateway: PaymentGateway,
        event_publisher: OrderEventPublisher,
    ) -> None:
        self._order_repository = order_repository
        self._payment_gateway = payment_gateway
        self._event_publisher = event_publisher

    def execute(self, command: PlaceOrderCommand) -> PlaceOrderResult:
        order = Order(
            order_id=OrderId(str(uuid.uuid4())),
            customer_id=command.customer_id,
            items=[
                OrderItem(
                    product_id=item.product_id,
                    quantity=item.quantity,
                    unit_price=Money(item.unit_price_cents, item.currency),
                )
                for item in command.items
            ],
        )

        charge_result = self._payment_gateway.charge(
            amount=order.total,
            token=command.payment_token,
        )

        if not charge_result.success:
            return PlacementFailedResult(reason="payment_declined")

        order.confirm_payment()
        self._order_repository.save(order)

        for event in order.pull_domain_events():
            self._event_publisher.publish(event)

        return OrderPlacedResult(order_id=str(order.order_id))
```

#### Outbound Adapter -- `StripePaymentGateway`

```python
# src/infrastructure/adapters/outbound/stripe_payment_gateway.py
import stripe
from src.application.ports.outbound.payment_gateway import PaymentGateway, ChargeResult
from src.domain.model.money import Money

class StripePaymentGateway:
    def __init__(self, api_key: str) -> None:
        stripe.api_key = api_key

    def charge(self, amount: Money, token: str) -> ChargeResult:
        try:
            intent = stripe.PaymentIntent.create(
                amount=amount.amount_cents,
                currency=amount.currency.lower(),
                payment_method=token,
                confirm=True,
                automatic_payment_methods={"enabled": True, "allow_redirects": "never"},
            )
            return ChargeResult(success=True, charge_id=intent.id)
        except stripe.error.CardError as e:
            # Map Stripe's domain error to our domain vocabulary -- anti-corruption
            return ChargeResult(success=False, failure_reason=e.code)
        except stripe.error.StripeError as e:
            # Unexpected infrastructure failure -- let it propagate as exception
            raise RuntimeError(f"Stripe infrastructure failure: {e}") from e
```

#### Composition Root -- `container.py`

```python
# src/infrastructure/config/container.py
from src.infrastructure.adapters.outbound.postgres_order_repository import PostgresOrderRepository
from src.infrastructure.adapters.outbound.stripe_payment_gateway import StripePaymentGateway
from src.infrastructure.adapters.outbound.kafka_order_event_publisher import KafkaOrderEventPublisher
from src.application.services.place_order_service import PlaceOrderService
from src.infrastructure.config.settings import Settings

def build_place_order_use_case(settings: Settings) -> PlaceOrderService:
    repository = PostgresOrderRepository(connection_string=settings.database_url)
    gateway = StripePaymentGateway(api_key=settings.stripe_api_key)
    publisher = KafkaOrderEventPublisher(
        bootstrap_servers=settings.kafka_bootstrap_servers,
        topic=settings.order_events_topic,
    )
    return PlaceOrderService(
        order_repository=repository,
        payment_gateway=gateway,
        event_publisher=publisher,
    )
```

#### Test Using In-Memory Adapters

```python
# tests/application/test_place_order_service.py
from src.application.services.place_order_service import PlaceOrderService
from src.application.ports.inbound.place_order_use_case import (
    PlaceOrderCommand, OrderItemData, OrderPlacedResult, PlacementFailedResult
)
from tests.fakes.in_memory_order_repository import InMemoryOrderRepository
from tests.fakes.stub_payment_gateway import StubPaymentGateway
from tests.fakes.in_memory_order_event_publisher import InMemoryOrderEventPublisher

def make_service(payment_succeeds: bool = True) -> PlaceOrderService:
    return PlaceOrderService(
        order_repository=InMemoryOrderRepository(),
        payment_gateway=StubPaymentGateway(succeeds=payment_succeeds),
        event_publisher=InMemoryOrderEventPublisher(),
    )

def test_successful_order_placement():
    service = make_service(payment_succeeds=True)
    command = PlaceOrderCommand(
        customer_id="cust-123",
        items=[OrderItemData(product_id="prod-456", quantity=2, unit_price_cents=1500, currency="USD")],
        payment_token="tok_visa",
    )
    result = service.execute(command)
    assert isinstance(result, OrderPlacedResult)
    assert result.order_id is not None

def test_payment_declined_returns_failure_result():
    service = make_service(payment_succeeds=False)
    command = PlaceOrderCommand(
        customer_id="cust-123",
        items=[OrderItemData(product_id="prod-456", quantity=1, unit_price_cents=999, currency="USD")],
        payment_token="tok_declined",
    )
    result = service.execute(command)
    assert isinstance(result, PlacementFailedResult)
    assert result.reason == "payment_declined"
```

---

### Trade-off Notes

| Decision | Alternative Considered | Reason for Choice |
|---|---|---|
| Separate persistence models from domain entities | Use SQLAlchemy ORM directly on domain classes | ORM annotations on domain classes create framework coupling that prevents testing domain logic without a DB session |
| One use case interface per operation | Single `OrderService` interface with all order methods | ISP compliance -- HTTP controller only needs `PlaceOrderUseCase`, not access to cancel/refund methods |
| Results as union types instead of exceptions for business failures | Raise `PaymentDeclinedException` from service | Forces callers to handle expected failures explicitly; exceptions are reserved for unexpected infrastructure failures |
| Publish events after save, not inside transaction | Use DB transaction + event publish as atomic unit | Simplest approach without requiring transactional outbox infrastructure; acceptable for eventual consistency requirement |
| Plain Python `Protocol` for ports | `ABC` abstract base classes | `Protocol` enables structural typing -- adapters do not need to inherit from port classes, reducing coupling |
