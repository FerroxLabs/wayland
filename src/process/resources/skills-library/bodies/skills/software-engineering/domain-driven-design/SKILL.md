---
name: domain-driven-design
description: |
  Guides expert-level domain-driven design implementation: backend and design-patterns decision frameworks, production-ready patterns, and concrete templates for domain driven design workflows.
  Use when the user asks about domain-driven design, domain driven design configuration, or architecture best practices for domain-driven projects.
  Do NOT use when the user needs a different architecture design capability -- check sibling skills in the architecture design subcategory.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "architecture backend design-patterns"
  category: "software-engineering"
  subcategory: "architecture-design"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---
# Domain Driven Design

## When to Use

**Use this skill when:**
- The user is designing or refactoring a complex business application where the domain logic is the core differentiator -- e.g., an insurance underwriting engine, a logistics routing system, a financial trading platform, or a healthcare records system
- The user asks how to model Aggregates, Entities, Value Objects, Domain Events, Repositories, Domain Services, or Application Services
- The user needs guidance on establishing Bounded Contexts, Context Maps, or integrating multiple bounded contexts via Anti-Corruption Layers, Open Host Services, or Published Language patterns
- The user wants to implement Event Sourcing or CQRS as part of a DDD architecture and needs to understand which tactical patterns apply
- The user is conducting an Event Storming session and needs help structuring outputs into a domain model
- The user has a "Big Ball of Mud" codebase and wants to introduce DDD incrementally through a Strangler Fig pattern
- The user needs to decompose a monolith into microservices and wants domain boundaries to guide service decomposition
- The user asks about Ubiquitous Language, domain modeling workshops, or aligning technical design with domain expert knowledge

**Do NOT use this skill when:**
- The user needs CRUD application design for simple data-management tools without complex business rules -- use a simpler layered architecture skill instead
- The user is asking about microservices infrastructure concerns (container orchestration, service mesh, API gateway configuration) -- those are deployment/infrastructure skills
- The user needs database schema design without a domain model context -- use the data modeling skill
- The user is asking about event-driven architecture at the infrastructure level (Kafka topic configuration, consumer group tuning) without a domain model context -- use the event streaming skill
- The user needs general API design guidance without DDD framing -- use the REST or GraphQL API design skill
- The team has fewer than 3 developers and the domain is genuinely simple -- DDD tactical patterns add overhead that is not justified below a complexity threshold
- The user is building a reporting-only system or read-heavy analytics platform where domain behavior is minimal

---

## Process

### 1. Establish the Problem Space -- Distill the Core Domain

Before writing any code, the assistant must help the user understand what they are modeling.

- **Identify the Core Domain** -- the part of the business that is unique, competitively differentiating, and where the investment in sophisticated modeling pays off. Contrast with Supporting Subdomains (necessary but not differentiating) and Generic Subdomains (commodity, buy-don't-build, e.g., authentication, billing via Stripe, email via SendGrid).
- **Apply the Subdomain heuristic**: if a third-party SaaS product can replace a capability within 6 months, it is a Generic Subdomain. If a competing company with the same software would be indistinguishable, it is Supporting. Only the Core Domain deserves full DDD investment.
- **Run a lightweight Event Storming session** (even asynchronously in a document): list all Domain Events in past tense ("Order Placed", "Shipment Delayed", "Policy Underwritten"), then cluster them into process flows. This reveals Aggregates and Bounded Contexts organically from business behavior, not database schema.
- **Extract the Ubiquitous Language**: for each Bounded Context, produce a glossary of 20-50 terms that appear in both domain expert conversation and code. Terms must be precise -- "Order" in the Sales context means something different from "Order" in the Fulfillment context. Enforce these terms in class names, method names, variable names, and test descriptions.
- **Identify ambiguities that signal Bounded Context boundaries**: when domain experts use the same word but mean different things, or use different words for the same concept, a context boundary is present. Document these explicitly.

---

### 2. Define Bounded Contexts and Produce a Context Map

Bounded Contexts are the largest unit of DDD design. Every subsequent tactical decision lives inside a Context.

- **Define one Bounded Context per coherent domain model** -- a single team should own a single Bounded Context. Conway's Law applies: if two teams share a Bounded Context, expect model corruption over time.
- **Size heuristic**: a Bounded Context should be small enough for one team of 4-8 engineers to understand completely, and large enough to represent a complete subdomain. Avoid splitting a single workflow across 3+ contexts -- integration costs grow quadratically.
- **Produce a Context Map** with the following relationship patterns:
  - **Partnership**: two teams co-evolve their contexts together with joint planning. Use when contexts are tightly coupled and teams have equal power.
  - **Shared Kernel**: a small shared model fragment is co-owned by two teams. Acceptable for stable concepts (e.g., a Money value object shared between Sales and Finance). Change cost is high -- shared kernel surface area should be under 5% of any context's model.
  - **Customer-Supplier**: the upstream team provides a model; the downstream team adapts to it. The upstream team prioritizes work based on downstream needs. Common in internal platform relationships.
  - **Conformist**: the downstream team accepts the upstream model without translation. Use when the upstream is an external system (e.g., a payment provider) and adaptation cost exceeds translation cost.
  - **Anti-Corruption Layer (ACL)**: the downstream team wraps the upstream model in a translation layer that exposes the downstream's own language. Use whenever upstream model quality is poor or semantics differ significantly. ACL should implement the Adapter + Facade pattern -- never leak upstream types past the ACL boundary.
  - **Open Host Service**: the upstream context exposes a stable, versioned API (REST, gRPC, events) designed for consumption by multiple downstream contexts. Document as a Published Language.
  - **Separate Ways**: two contexts share no integration. Common for Generic Subdomains where vendor products handle each context independently.
- **Annotate the Context Map with team ownership, integration mechanism (synchronous HTTP, async events, shared database), and SLA expectations** for each relationship.

---

### 3. Design Aggregates -- The Core Tactical Pattern

Aggregates are the most misunderstood DDD pattern. Poor Aggregate design produces either anemic models or performance nightmares.

- **Aggregate invariant rule**: an Aggregate enforces a consistency boundary. All invariants that must be true after any operation must be checkable within a single Aggregate. If an invariant spans two Aggregates, it is either an eventual consistency case, or the Aggregate boundary is wrong.
- **Aggregate sizing rules**:
  - **Default to small Aggregates**. An Aggregate with more than 5-7 child entities is almost always a performance and contention problem. Err toward smaller, then expand only when invariants demand it.
  - **Reference other Aggregates by identity only** (store an `OrderId`, not an `Order` object). Never hold a direct object reference to another Aggregate root.
  - **Ask: "Do these objects change together in the same transaction?"** If Line Items and Orders always change together and their consistency is inseparable, they belong in the same Aggregate. If they change independently, separate them.
- **Aggregate Root responsibilities**: the Root is the only entry point for all mutations. No external code modifies child entities directly. The Root validates all commands against current state before applying changes.
- **Entity vs. Value Object distinction**:
  - **Entity**: has an identity that persists over time and across state changes. `Customer` with `CustomerId` is an Entity -- the same customer exists even if their address changes.
  - **Value Object**: defined entirely by its attributes. Has no identity. Is immutable. `Money(amount=100, currency=USD)` is a Value Object -- two `Money` objects with the same amount and currency are interchangeable. Replace value objects entirely rather than mutating them.
  - **Value Objects should be the majority of your model**. If you find yourself with 20 Entities and 3 Value Objects, you have likely promoted too many concepts to Entity status. Common Value Objects: `Money`, `Address`, `DateRange`, `Email`, `Percentage`, `Coordinates`, `PhoneNumber`.
- **Aggregate command pattern**: model operations as explicit commands (`PlaceOrder`, `CancelShipment`, `ApprovePolicy`) rather than generic setters. Each command method: validates preconditions, applies state change, raises Domain Events.

---

### 4. Model Domain Events and Design the Event Lifecycle

Domain Events are facts about things that have happened in the domain. They are central to both integration and state management.

- **Domain Event naming conventions**: always past tense, always noun-first with verb qualifier. `OrderPlaced`, `PaymentFailed`, `PolicyUnderwritten`, `ShipmentDelayed`. Never `OrderUpdate`, `OrderChange`, or `HandleOrder`.
- **Event payload design**:
  - Include the Aggregate Root ID, the timestamp, a correlation ID (for tracing across context boundaries), and a causation ID (the command or event that caused this event).
  - Include enough data in the event payload so that the consuming context can process it without an immediate callback. If a consumer needs 5 API calls to process one event, the event is under-specified.
  - Do NOT include entire Aggregate state in events unless implementing Event Sourcing. Include the delta plus enough context to act on it.
- **Domain Events vs. Integration Events**: Domain Events are internal to a Bounded Context, fired synchronously within a transaction, handled by other aggregates or projections in the same context. Integration Events cross context boundaries, are published to a message broker (Kafka, RabbitMQ, AWS SNS/SQS), and are versioned contracts. Transform internal Domain Events into Integration Events explicitly at the context boundary.
- **Transactional Outbox pattern**: when publishing Integration Events, never publish directly from within a database transaction. Write the event to an `outbox` table in the same transaction as the domain state change. A background process (relay/CDC via Debezium) reads the outbox and publishes to the broker. This is the correct implementation for at-least-once delivery with no dual-write inconsistency.
- **Event versioning strategy**: use a `schemaVersion` field on all Integration Events. Support N-1 version compatibility in all consumers. Never make breaking changes to an event schema -- add optional fields only. Maintain old event types for at least one release cycle.

---

### 5. Design the Application Layer and Enforce Layer Boundaries

DDD has four distinct layers. Violations of layer boundaries are the most common source of model corruption.

- **Layer definitions**:
  - **Domain Layer**: Entities, Value Objects, Aggregates, Domain Events, Domain Services, Repository interfaces. Zero infrastructure dependencies. Zero framework dependencies. Pure business logic only.
  - **Application Layer**: Application Services (orchestrators), Command/Query handlers, DTOs, port interfaces for external services. Depends on Domain Layer only. Contains transaction boundaries. No business logic -- orchestration only.
  - **Infrastructure Layer**: Repository implementations (JPA, SQLAlchemy, Prisma), message bus adapters, external API clients, ORM mappings. Implements interfaces defined in Domain and Application layers.
  - **Presentation/Interface Layer**: REST controllers, GraphQL resolvers, CLI commands, event consumers. Transforms external input into Application Layer commands/queries.
- **Dependency rule**: dependencies point inward only. Infrastructure depends on Application, which depends on Domain. Domain depends on nothing outside itself. Enforce this with architecture fitness functions (ArchUnit in Java, import-linter in Python, dependency-cruiser in TypeScript).
- **Repository pattern implementation**:
  - Repository interfaces are defined in the Domain Layer and return domain objects, not ORM entities.
  - Repository implementations live in the Infrastructure Layer and handle the translation between ORM/persistence models and domain objects.
  - Repository methods should speak the Ubiquitous Language: `findByCustomerId()`, `findActiveOrdersForCustomer()`, not `findAll()` with filter parameters.
  - Never expose `IQueryable` or raw query builders through the Repository interface -- this leaks infrastructure concerns into the domain.
- **Domain Services vs. Application Services**: a Domain Service contains business logic that does not naturally belong to a single Aggregate (e.g., a `FraudDetectionService` that evaluates a transaction against multiple customer history aggregates). An Application Service orchestrates use cases without containing business logic (e.g., `PlaceOrderApplicationService` fetches the cart, calls `order.place()`, saves via repository, publishes integration events).

---

### 6. Implement CQRS if Read/Write Complexity Diverges

CQRS (Command Query Responsibility Segregation) is a common DDD companion but is not mandatory. Apply it selectively.

- **Apply CQRS when**: read models require denormalized, aggregated views that are expensive to derive from the normalized write model; read throughput is 10x+ higher than write throughput; read models need to be optimized per consumer (mobile vs. desktop vs. reporting); the Aggregate model is too complex to query efficiently with joins.
- **Do NOT apply CQRS when**: the application is mostly CRUD with minimal read complexity; the team has fewer than 4 engineers; the domain does not have clear Command vs. Query separation in its language.
- **CQRS implementation pattern**:
  - Write side: Commands flow through Application Services to Aggregates, which raise Domain Events. State is persisted to a normalized write store.
  - Read side: Domain Events or CDC updates project state into read-optimized stores (PostgreSQL read views, Elasticsearch, Redis, dedicated read replicas). Read models are flat, denormalized projections optimized for specific query patterns.
  - Queries bypass the domain model entirely -- they go directly to the read store via thin Query handlers that return DTOs.
- **Eventual consistency window**: acknowledge to users that after a command completes, the read model may lag by 50ms-2s depending on the projection mechanism. Design UI accordingly -- optimistic UI updates or explicit "processing" states.

---

### 7. Validate, Test, and Enforce the Model

A DDD model that is not enforced degrades into a Big Ball of Mud within 6-18 months.

- **Testing strategy for DDD**:
  - **Unit tests on Aggregates**: test every invariant, every state transition, every Domain Event raised. These tests should have zero infrastructure dependencies and run in under 10ms each. Target 100% coverage of domain logic.
  - **Integration tests on Application Services**: test that commands flow correctly through the orchestration layer, that repositories are called correctly, that integration events are raised. Use in-memory repository fakes, not mocks. Run against a real database in CI.
  - **Contract tests on Integration Events**: use Pact or a schema registry (Confluent Schema Registry, AWS Glue) to validate event schemas between producers and consumers. Run contract tests in CI before any deployment.
  - **Architecture fitness functions**: run ArchUnit / import-linter / dependency-cruiser checks in CI to enforce layer boundaries. Fail the build if Domain Layer imports infrastructure types.
- **Invariant enforcement patterns**:
  - Use factory methods or static constructors on Aggregates instead of public constructors. `Order.place(cart, customerId, pricingPolicy)` enforces creation invariants. A public `new Order()` does not.
  - Raise exceptions for invariant violations from within the domain -- `OrderAlreadyCancelledException`, `InsufficientInventoryException`. Do not use generic `IllegalArgumentException` or `Error` -- domain exceptions carry semantic meaning.
  - Validate Value Objects at construction time. An `Email` value object that accepts `""` is not a value object -- it is a stringly-typed field.
- **Fitness functions to run on every commit**: layer dependency check (no inward violations), Ubiquitous Language term coverage (class names match glossary), Aggregate size check (no Aggregate root with more than 7 direct children), Domain Event naming convention check (past tense verb), Repository interface purity (no ORM types in signatures).

---

### 8. Manage Evolution -- Keeping the Model Aligned with the Domain

A DDD model must evolve as the business evolves. Most DDD failures come from a model that was correct at month 3 and wrong by month 18.

- **Schedule domain model reviews every quarter** with at least one domain expert present. Review the Ubiquitous Language glossary -- has the business changed how it talks about concepts? If yes, update the code.
- **When a Bounded Context needs to split**: the signal is when two teams are editing the same context and their changes conflict frequently, or when the context has grown beyond 8-10 Aggregates with dozens of invariants. Split by extracting one coherent subdomain, introducing an ACL between the new context and the original, then migrating consumers one by one.
- **Anticipate model corruption patterns**:
  - **Anemic Domain Model**: Aggregates are data containers; all logic lives in services. Fix by moving behavior back into entities -- "tell, don't ask."
  - **Fat Aggregate**: one Aggregate root with 15+ children and 50+ fields. Fix by identifying which children change independently and extracting them as separate Aggregates with identity references.
  - **Leaky Abstraction**: ORM entities used directly in the domain layer. Fix by introducing explicit domain objects that translate to/from ORM models in the Infrastructure layer.
  - **God Application Service**: application service contains business logic (discount calculation, fraud scoring). Fix by moving logic back into Aggregates or Domain Services.

---

## Output Format

When helping a user with DDD design, structure the response using the following template:

```
## Domain Model Design: [Context Name]

### Subdomain Classification
| Subdomain          | Type          | Rationale                              | Build/Buy/Partner |
|--------------------|---------------|----------------------------------------|-------------------|
| [Subdomain name]   | Core/Support/Generic | [Why it's classified this way] | [Decision]      |

### Bounded Context Inventory
| Context Name       | Owning Team   | Integration Mechanism  | Key Aggregates          |
|--------------------|---------------|------------------------|-------------------------|
| [Context name]     | [Team]        | [REST/Events/Both]     | [Aggregate1, Aggregate2]|

### Context Map
[Diagram in text or ASCII, showing relationships and their patterns (ACL, Partnership, etc.)]

[ContextA] --Customer/Supplier--> [ContextB]
[ContextB] --ACL--> [ExternalSystem]
[ContextC] --Separate Ways-- [ContextD]

### Aggregate Design: [AggregateName]

**Invariants:**
- [Invariant 1 -- stated as a business rule]
- [Invariant 2]

**Identity:** [AggregateRootId type and generation strategy]

**Entities:** [List with brief role description]

**Value Objects:** [List with attributes and validation rules]

**Domain Events raised:**
- [EventName] -- raised when [condition], payload: [fields]

**Aggregate pseudocode:**
```
class [AggregateName]:
    id: [AggregateRootId]
    [fields: typed with value objects]

    @staticmethod
    factory_method([params]) -> [AggregateName]:
        // validate creation invariants
        // return instance with initial event raised

    def [command_method]([params]) -> None:
        // validate preconditions (raise domain exception if violated)
        // apply state change
        // raise domain event
```

### Domain Events

| Event Name         | Trigger Condition              | Payload Fields                         | Integration? |
|--------------------|-------------------------------|----------------------------------------|--------------|
| [EventName]        | [When raised]                  | [field1, field2, correlationId, ...]   | Yes/No       |

### Layer Boundary Map

Domain Layer:       [List of types]
Application Layer:  [List of application services, command/query handlers]
Infrastructure:     [List of repository implementations, adapters]
Interface Layer:    [Controllers, consumers, CLI]

### Repository Interface

```
interface [AggregateName]Repository:
    find_by_id(id: [AggregateRootId]) -> Optional[[AggregateName]]
    find_by_[business_key]([key]: [type]) -> List[[AggregateName]]
    save(aggregate: [AggregateName]) -> None
    remove(id: [AggregateRootId]) -> None
```

### CQRS Decision
[Apply / Do Not Apply -- with one-sentence rationale based on read/write complexity]

### Fitness Functions to Enforce
- [ ] Layer dependency check (CI gate)
- [ ] Aggregate size check (max [N] direct children)
- [ ] Domain Event naming convention (past tense)
- [ ] Repository interface purity (no ORM types)
- [ ] Ubiquitous Language coverage (class names match glossary)

### Architecture Decision Record (ADR)
**Title:** [Decision made]
**Status:** Accepted
**Context:** [Problem being solved]
**Decision:** [What was decided]
**Consequences:** [Trade-offs accepted]
```

---

## Rules

1. **Never design Aggregates around database tables.** Aggregates enforce business invariants, not storage structure. A 1:1 mapping of Aggregates to tables almost always indicates the model is driven by persistence concerns rather than domain behavior. Design the domain model first, then map to storage.

2. **Never allow two Aggregates to share a database transaction in the happy path.** If a use case requires modifying two Aggregates atomically, the design is wrong -- either the Aggregate boundary needs to change, or the consistency requirement is actually eventual. The exception is compensating transactions in sagas, which are explicit eventual consistency mechanisms, not shortcuts.

3. **Never use the same class for the domain model and the ORM entity.** Annotating domain objects directly with JPA `@Entity`, SQLAlchemy `DeclarativeBase`, or Prisma model types couples the domain to the persistence mechanism. This makes the domain model impossible to test without a database and leaks persistence concerns into business logic.

4. **Never name Domain Events in the present or imperative tense.** `PlaceOrder`, `OrderUpdate`, `OrderCreating` are commands or process names, not events. Domain Events are facts -- they have already occurred. `OrderPlaced`, `PaymentProcessed`, `ShipmentDelayed` are correct.

5. **Never put business logic in Application Services.** The rule is: if deleting the Application Service and calling Aggregate methods directly would break a business rule, the business rule is in the wrong place. Application Services orchestrate; Aggregates decide.

6. **Always version Integration Events from day one.** An unversioned Integration Event schema becomes a migration problem the first time a field changes. Include `schemaVersion: "1.0"` in every Integration Event payload. Define a schema in a schema registry or contract test before the event is consumed by a second context.

7. **Always implement the Repository pattern using the domain's language, not the persistence layer's language.** `findAll({"status": "ACTIVE", "customerId": "123"})` is a persistence API. `findActiveOrdersByCustomer(customerId: CustomerId)` is a domain repository. The first leaks query structure; the second expresses intent.

8. **Never skip the Ubiquitous Language glossary, even for small teams.** The glossary is not documentation overhead -- it is the mechanism by which code stays aligned with domain expert understanding. A glossary with 30 well-defined terms prevents 6-12 months of model drift in a 2-year project.

9. **Always enforce Bounded Context isolation at the code level, not just architecturally.** If two contexts share a codebase package/module, enforce isolation with module-level imports-forbidden rules. Contexts should share nothing except published contracts (event schemas, API contracts). Never share domain model classes between contexts even if they represent similar concepts.

10. **Never apply full DDD tactical patterns (Aggregates, Repositories, Domain Events) to a Generic Subdomain.** A Generic Subdomain should be a bought product, a well-maintained library, or a thin adapter. Applying DDD tactical complexity to commodity functionality (user authentication, PDF generation, email sending) is a waste of engineering effort and a source of accidental complexity.

---

## Edge Cases

### Brownfield Migration -- Introducing DDD to an Existing "Big Ball of Mud"
Never attempt a full rewrite. Apply the Strangler Fig pattern: identify one high-value workflow where the existing code is causing the most pain (frequent bugs, slow development, constant domain expert confusion). Wrap the existing code with an ACL that translates to your new Bounded Context's language. Implement the new domain model alongside the old code. Redirect traffic to the new model one workflow at a time. Delete old code only after the new model is confirmed stable in production. Expect this migration to take 12-24 months for a medium-sized system. Maintain a dual-write period where both models are updated to allow rollback. Key risk: the ACL becomes a permanent fixture -- set an explicit decommission date for the legacy code path on project kick-off.

### Event Sourcing -- When and How to Apply
Event Sourcing (storing the sequence of Domain Events as the system of record rather than current state) should only be applied to the Core Domain, and only when audit trail requirements, temporal queries ("what was the state at time T?"), or complex undo/redo behavior genuinely require it. Event Sourcing adds significant operational complexity: event schema migration, snapshot management (take a snapshot every 50-100 events to avoid replaying thousands of events on load), projection rebuilding, and tooling maturity requirements. The aggregate state is reconstituted by replaying events from the event store. Never apply Event Sourcing to Supporting or Generic Subdomains -- the cost is not justified. If applying Event Sourcing, use an event store purpose-built for it (EventStoreDB) or implement an append-only events table in PostgreSQL with optimistic concurrency via a version/sequence column.

### Distributed Transactions Across Bounded Contexts
When a business process spans multiple Bounded Contexts (e.g., placing an order requires reserving inventory in the Inventory Context and charging payment in the Billing Context), never use distributed two-phase commit (2PC). It creates tight coupling and operational fragility. Instead implement the Saga pattern: either Choreography-based (each context listens for events and reacts, suitable for 2-3 step flows) or Orchestration-based (a dedicated Saga orchestrator sends commands and tracks state, suitable for 4+ step flows). Each saga step must have a defined compensating transaction (e.g., `ReleaseInventoryReservation` compensates `ReserveInventory`). Saga state should be persisted -- a saga that cannot survive a process restart is a reliability bug.

### Multiple Teams, One Codebase -- Monorepo DDD
In a monorepo with multiple teams, each Bounded Context is a separate top-level package/module with strict import boundaries enforced by tooling. Use `dependency-cruiser` (TypeScript/JavaScript), `import-linter` (Python), or ArchUnit (Java/Kotlin) to fail CI if one context imports directly from another. Shared contracts (Integration Event schemas, API specifications) live in a separate `contracts` or `shared-kernel` package that any context may import but no context may add domain logic to. Shared Kernel changes require sign-off from all teams that import it. Teams should deploy their contexts independently -- context boundaries should align with independent deployability.

### Eventual Consistency and User Experience
When a command succeeds but the read model has not yet updated, users expect to see their change reflected immediately. Strategies: (1) Optimistic UI -- update the UI immediately on command success before the read model catches up, then reconcile on next poll; (2) Command acknowledgment with polling -- return a `202 Accepted` with a `Location` header pointing to a status resource the client polls; (3) Include the correlation ID in the command response and let the client subscribe to an event stream filtered by that correlation ID. Never tell users "changes may take a few minutes to appear" without an explicit feedback mechanism -- this is an experience failure.

### Aggregate Versioning and Optimistic Concurrency
Every Aggregate Root must carry a `version` (or `sequenceNumber`) integer that increments on every state change. When saving an Aggregate, include a `WHERE version = [expected version]` clause in the update statement. If zero rows are updated, a concurrent modification occurred -- raise an `OptimisticConcurrencyException` and let the Application Service retry the command (typically 2-3 retries with exponential backoff for idempotent commands, or surface the conflict to the user for non-idempotent commands). Skipping optimistic concurrency control in a multi-user system produces silent data loss -- one user's change overwrites another's without either knowing. This is a correctness requirement, not a performance optimization.

### DDD in Serverless / Function-as-a-Service Environments
DDD tactical patterns are fully compatible with serverless execution models, but with adaptations. Each Lambda/Cloud Function invocation represents one Application Service command or query. The cold-start cost of rehydrating Aggregates from a database on every invocation can be significant -- keep Aggregates small (the sizing rule becomes even more important). Repository implementations must be optimized for short-lived connections (use connection pooling proxies like RDS Proxy, PgBouncer). Domain Events published via the Transactional Outbox still apply -- use DynamoDB Streams or PostgreSQL CDC (via Debezium on Aurora) as the outbox relay mechanism. Avoid storing Aggregate state in function memory between invocations -- serverless functions are stateless by design, and in-memory state is not visible to other instances.

---

## Example

**Input:** "We're building a commercial insurance platform. The core product is pricing and binding policies. We have a team of 7 engineers, a React frontend, a Python backend, and PostgreSQL. We're starting greenfield. How should we structure the DDD architecture?"

---

**Output:**

## Domain Model Design: Commercial Insurance Platform

### Subdomain Classification

| Subdomain              | Type      | Rationale                                                                 | Build/Buy/Partner       |
|------------------------|-----------|---------------------------------------------------------------------------|-------------------------|
| Policy Pricing Engine  | Core      | Proprietary risk models are the competitive differentiator                | Build                   |
| Policy Binding         | Core      | Binding rules encode regulatory and business logic unique to this company | Build                   |
| Claims Intake          | Supporting| Necessary but not differentiated -- follows standard workflow             | Build (thin model)      |
| Document Generation    | Generic   | Policy PDF generation is commodity                                        | Partner (e.g., DocuSign / PDF service) |
| User Authentication    | Generic   | No competitive value in auth                                              | Buy (Auth0 / Cognito)   |
| Payment Processing     | Generic   | Commodity billing                                                         | Partner (Stripe)        |
| Compliance Reporting   | Supporting| Required but rules are externally defined                                 | Build (thin adapter)    |

**Decision**: Invest full DDD tactical patterns only in Policy Pricing and Policy Binding. Claims Intake gets a simplified domain model. Document Generation, Authentication, and Payment use thin adapters with ACLs.

---

### Bounded Context Inventory

| Context Name        | Owning Team     | Integration Mechanism     | Key Aggregates                    |
|---------------------|-----------------|---------------------------|-----------------------------------|
| Quoting             | Pricing Team    | REST (sync) + Events      | Quote, RiskProfile                |
| PolicyManagement    | Binding Team    | Events (async)            | Policy, Endorsement               |
| ClaimsIntake        | Claims Team     | REST (sync) + Events      | Claim                             |
| BillingAdapter      | Platform Team   | Events (async)            | (thin -- delegates to Stripe)     |
| DocumentAdapter     | Platform Team   | REST (sync)               | (thin -- delegates to PDF service)|

---

### Context Map

```
[Quoting] --Customer/Supplier--> [PolicyManagement]
  QuoteBound (Integration Event) triggers Policy creation

[PolicyManagement] --Open Host Service--> [ClaimsIntake]
  PolicyManagement exposes PolicyReadModel via versioned REST API

[PolicyManagement] --ACL--> [BillingAdapter]
  PolicyBound event translated to Stripe charge via ACL

[PolicyManagement] --ACL--> [DocumentAdapter]
  PolicyIssued event triggers PDF generation via ACL

[Quoting] --ACL--> [ExternalRatingBureau]
  External loss data consumed via ACL; bureau types never enter domain

[Auth0] --Conformist-- [Quoting, PolicyManagement]
  Both contexts accept Auth0 JWT tokens -- no translation needed
```

---

### Aggregate Design: Quote (Quoting Context)

**Invariants:**
- A Quote may only be bound if its status is `PRICED` and it has not expired (expiry is 30 days from creation by default, configurable per product line)
- A Quote cannot be re-priced after it has been bound
- Total premium must be greater than zero before a Quote transitions to `PRICED` status
- A Quote must have at least one Coverage line item before pricing can be requested

**Identity:** `QuoteId` -- UUID v4, generated at Quote creation. Never use database auto-increment IDs for Aggregate roots (they leak persistence implementation and are not portable across shards).

**Entities:**
- `Coverage` -- a line of coverage within the quote (e.g., General Liability, Property). Has a `CoverageId`, a `CoverageType` value object, and a calculated `premium`.

**Value Objects:**
- `Money(amount: Decimal, currency: ISO4217Currency)` -- validated: amount >= 0, currency must be a known ISO 4217 code. Immutable. Arithmetic operations return new instances.
- `CoverageType(code: str)` -- validated against a closed set of product line codes. Raises `UnknownCoverageTypeError` if an unrecognized code is provided.
- `QuoteExpiry(expires_at: datetime)` -- expiry is always UTC. Expiry in the past raises `QuoteExpiredError` on creation.
- `RiskScore(value: Decimal)` -- range 0.0 to 10.0. Values outside range raise `InvalidRiskScoreError`.

**Domain Events raised:**
- `QuoteInitiated` -- raised on creation, payload: `quote_id`, `customer_id`, `product_line`, `initiated_at`, `correlation_id`
- `QuotePriced` -- raised when pricing completes, payload: `quote_id`, `total_premium` (Money), `risk_score` (RiskScore), `priced_at`, `correlation_id`
- `QuoteBound` -- raised when customer accepts and binds, payload: `quote_id`, `customer_id`, `bound_at`, `total_premium`, `correlation_id`, `causation_id`
- `QuoteExpired` -- raised by a scheduled job when expiry passes without binding, payload: `quote_id`, `expired_at`, `correlation_id`

**Aggregate pseudocode (Python-idiomatic):**

```python
@dataclass
class Quote:
    id: QuoteId
    customer_id: CustomerId
    product_line: ProductLine
    coverages: list[Coverage]
    status: QuoteStatus  # DRAFT | PRICED | BOUND | EXPIRED
    expiry: QuoteExpiry
    total_premium: Optional[Money]
    version: int
    _events: list[DomainEvent] = field(default_factory=list)

    @staticmethod
    def initiate(
        customer_id: CustomerId,
        product_line: ProductLine,
        expiry_days: int = 30,
        correlation_id: CorrelationId,
    ) -> "Quote":
        expiry = QuoteExpiry.from_now(days=expiry_days)
        quote = Quote(
            id=QuoteId.generate(),
            customer_id=customer_id,
            product_line=product_line,
            coverages=[],
            status=QuoteStatus.DRAFT,
            expiry=expiry,
            total_premium=None,
            version=0,
        )
        quote._events.append(QuoteInitiated(
            quote_id=quote.id,
            customer_id=customer_id,
            product_line=product_line,
            initiated_at=utcnow(),
            correlation_id=correlation_id,
        ))
        return quote

    def add_coverage(self, coverage_type: CoverageType, limits: CoverageLimits) -> None:
        if self.status != QuoteStatus.DRAFT:
            raise QuoteNotInDraftError(self.id, self.status)
        coverage = Coverage.create(CoverageId.generate(), coverage_type, limits)
        self.coverages.append(coverage)

    def apply_pricing(
        self,
        risk_score: RiskScore,
        premium_breakdown: dict[CoverageId, Money],
        correlation_id: CorrelationId,
    ) -> None:
        if self.status != QuoteStatus.DRAFT:
            raise QuoteAlreadyPricedError(self.id)
        if not self.coverages:
            raise NoCoveragesOnQuoteError(self.id)
        for coverage in self.coverages:
            coverage.set_premium(premium_breakdown[coverage.id])
        total = sum(premium_breakdown.values(), Money.zero(Currency.USD))
        if total.amount <= 0:
            raise ZeroPremiumError(self.id)
        self.total_premium = total
        self.status = QuoteStatus.PRICED
        self._events.append(QuotePriced(
            quote_id=self.id,
            total_premium=self.total_premium,
            risk_score=risk_score,
            priced_at=utcnow(),
            correlation_id=correlation_id,
        ))

    def bind(self, correlation_id: CorrelationId) -> None:
        if self.status != QuoteStatus.PRICED:
            raise QuoteNotPricedError(self.id, self.status)
        if self.expiry.has_expired():
            raise QuoteExpiredError(self.id, self.expiry)
        self.status = QuoteStatus.BOUND
        self._events.append(QuoteBound(
            quote_id=self.id,
            customer_id=self.customer_id,
            bound_at=utcnow(),
            total_premium=self.total_premium,
            correlation_id=correlation_id,
            causation_id=CausationId.generate(),
        ))

    def pop_events(self) -> list[DomainEvent]:
        events, self._events = self._events, []
        return events
```

---

### Domain Events

| Event Name      | Trigger Condition                      | Payload Fields                                                           | Integration? |
|-----------------|----------------------------------------|--------------------------------------------------------------------------|--------------|
| QuoteInitiated  | Quote.initiate() called                | quote_id, customer_id, product_line, initiated_at, correlation_id        | No           |
| QuotePriced     | Pricing result applied to quote        | quote_id, total_premium, risk_score, priced_at, correlation_id           | No           |
| QuoteBound      | Customer accepts and binds the quote   | quote_id, customer_id, bound_at, total_premium, correlation_id, causation_id | Yes -- published to PolicyManagement context |
| QuoteExpired    | Scheduled expiry check fires           | quote_id, expired_at, correlation_id                                     | No           |

`QuoteBound` is the sole Integration Event. It is transformed from the internal Domain Event by the `QuotingIntegrationEventPublisher` in the Infrastructure layer, written to the outbox table within the same transaction that saves the Quote state change, and relayed to the message broker by the outbox relay process.

---

### Layer Boundary Map

```
Domain Layer (quoting/domain/):
  Quote, Coverage, RiskProfile (Aggregates)
  QuoteId, CustomerId, Money, CoverageType, RiskScore, QuoteExpiry (Value Objects)
  QuoteRepository (interface), RatingService (Domain Service interface)
  QuoteInitiated, QuotePriced, QuoteBound, QuoteExpired (Domain Events)
  QuoteNotInDraftError, ZeroPremiumError, QuoteExpiredError (Domain Exceptions)

Application Layer (quoting/application/):
  InitiateQuoteCommand, RequestPricingCommand, BindQuoteCommand (Commands)
  InitiateQuoteHandler, RequestPricingHandler, BindQuoteHandler (Command Handlers)
  GetQuoteByIdQuery, ListQuotesByCustomerQuery (Queries)
  GetQuoteByIdHandler, ListQuotesByCustomerHandler (Query Handlers)
  QuoteDTO, CoverageDTO (Data Transfer Objects)

Infrastructure Layer (quoting/infrastructure/):
  PostgresQuoteRepository (implements QuoteRepository)
  ExternalRatingBureauAdapter (implements RatingService via ACL)
  SQLAlchemyQuoteMapper (maps between Quote domain object and ORM model)
  QuoteOutboxRelay (publishes Integration Events from outbox table)
  QuotingIntegrationEventPublisher (transforms Domain Events to Integration Events)

Interface Layer (quoting/interface/):
  QuoteRESTController (FastAPI router -- maps HTTP to Commands/Queries)
  QuoteBoundEventConsumer (for any inbound event reactions -- none currently)
```

---

### Repository Interface

```python
class QuoteRepository(Protocol):
    def find_by_id(self, quote_id: QuoteId) -> Optional[Quote]: ...
    def find_active_quotes_for_customer(self, customer_id: CustomerId) -> list[Quote]: ...
    def find_expiring_before(self, cutoff: datetime) -> list[Quote]: ...
    def save(self, quote: Quote) -> None: ...  # handles both insert and update with optimistic lock
```

The `save` method must implement optimistic concurrency: `UPDATE quotes SET ... version = version + 1 WHERE id = :id AND version = :expected_version`. If `rowcount == 0`, raise `ConcurrentModificationError`.

---

### CQRS Decision

**Apply CQRS -- with separate read models.**

Rationale: Underwriters and brokers need dashboards showing aggregated quote pipeline data (quotes by status, average premium by product line, expiry forecasts) that require denormalized, aggregated views. The normalized domain model cannot serve these efficiently. Read models are projected from Domain Events into a PostgreSQL `quote_read_projections` table with pre-computed aggregates. Queries for individual quote display (the common case) also benefit from the flat read model, avoiding the join between `quotes`, `coverages`, and `risk_profiles`. Estimated read/write ratio: 15:1 based on usage patterns (brokers query quote status frequently between pricing and binding).

---

### Fitness Functions to Enforce (CI Gates)

- [x] Layer dependency check -- `import-linter` configuration: `quoting.domain` must not import from `quoting.infrastructure` or `quoting.interface`
- [x] Aggregate size check -- custom AST check: no Aggregate dataclass may have more than 8 direct field members
- [x] Domain Event naming convention -- regex check on all classes in `quoting/domain/events/`: must match `[A-Z][a-zA-Z]+(ed|d|n)$` (past tense)
- [x] Repository interface purity -- `import-linter`: `QuoteRepository` protocol may not import SQLAlchemy, psycopg2, or any ORM symbol
- [x] Ubiquitous Language coverage -- glossary terms ("Quote", "Coverage", "RiskScore", "Binding", "Premium", "Endorsement") must appear as class names or method names in the domain layer; CI warns if a new glossary term added by domain experts is absent from code within 5 working days

---

### Architecture Decision Record

**Title:** Use Transactional Outbox for QuoteBound Integration Event Publishing

**Status:** Accepted

**Context:** The PolicyManagement context must be notified when a Quote is bound so it can create a Policy. The naive approach is to publish the event to the message broker inside the same Application Service method that saves the Quote. If the broker publish fails after the database commit, the Policy is never created. If the database commit fails after the broker publish, the event is published for a non-existent state change.

**Decision:** Implement the Transactional Outbox pattern. When `Quote.bind()` is called and the Aggregate state is saved to PostgreSQL, the `QuoteBound` Integration Event is also written to an `outbox_events` table within the same database transaction. A background relay process (polling every 500ms, or CDC via Debezium on the WAL) reads unprocessed outbox records and publishes them to the broker, marking them as published on success.

**Consequences:**
- Guaranteed at-least-once delivery of Integration Events with no dual-write inconsistency
- Adds operational dependency on the outbox relay process -- must be monitored and alerted
- Introduces up to 500ms additional latency between Quote binding and Policy creation in the polling implementation (acceptable -- PolicyManagement is an async flow)
- PolicyManagement consumers must be idempotent, as at-least-once delivery means occasional duplicate events
- Deduplication key: `correlation_id` on the `QuoteBound` event is used by PolicyManagement to detect and discard duplicate processing
