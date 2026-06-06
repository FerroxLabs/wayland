---
name: microservices-design
description: |
  Guides expert-level microservices design implementation: architecture and microservices decision frameworks, production-ready patterns, and concrete templates for microservices design workflows.
  Use when the user asks about microservices design, microservices design configuration, or architecture best practices for microservices projects.
  Do NOT use when the user needs a different backend infrastructure capability -- check sibling skills in the backend infrastructure subcategory.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "architecture backend microservices"
  category: "backend-systems"
  subcategory: "backend-infrastructure"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Microservices Design

## When to Use

**Use this skill when:**
- A user is decomposing a monolith and needs guidance on identifying service boundaries using domain-driven design (DDD) bounded contexts, seams analysis, or strangler fig patterns
- A user is designing a greenfield distributed system and needs help with service granularity decisions, communication patterns (sync vs. async), and data ownership models
- A user needs to choose between choreography-based and orchestration-based saga patterns for distributed transactions
- A user is designing inter-service communication and must decide between REST/HTTP, gRPC, GraphQL federation, or event-driven messaging (Kafka, RabbitMQ, NATS)
- A user needs to design an API gateway, service mesh topology, or sidecar proxy configuration for a microservices cluster
- A user is troubleshooting a microservices system with cascading failures, thundering herd issues, or distributed tracing gaps
- A user needs to design a data strategy -- per-service databases, CQRS, event sourcing, or polyglot persistence

**Do NOT use this skill when:**
- The user has a team of fewer than 4 engineers or an application serving fewer than ~10,000 daily active users -- recommend a modular monolith instead; use the monolith architecture skill
- The user is asking about container orchestration specifics (Kubernetes deployment manifests, Helm charts) -- use the container-orchestration skill
- The user needs CI/CD pipeline design for deploying microservices -- use the deployment-pipelines skill
- The user is asking about service-level observability implementation (Prometheus metric exposition, OpenTelemetry instrumentation code) -- use the observability skill
- The user needs API design in isolation (REST contract design, OpenAPI specification authoring) -- use the api-design skill
- The user is asking about database schema design or query optimization within a single service -- use the database-design skill
- The user wants general backend architecture advice without a distributed systems context -- use the backend-architecture skill

---

## Process

### Step 1 -- Assess Decomposition Readiness and Organizational Fit

Before designing any service boundary, establish whether the system is ready for microservices:

- **Apply Conway's Law check:** The service topology must reflect team topology. A system with 3 backend engineers cannot realistically own 15 services. A healthy ratio is 1 autonomous team (4--8 engineers) per 2--4 services, with clear ownership.
- **Evaluate the "Microservices Premium":** Microservices impose operational overhead -- distributed tracing, network latency, eventual consistency, independent deployments. This overhead is only worth paying when the monolith's coupling cost exceeds the distribution cost. Ask: Are independent deployability, independent scalability, or technology heterogeneity genuine requirements? If all three answers are "no," recommend a modular monolith.
- **Identify the decomposition driver:** Decomposition may be driven by scaling hot spots (a single component at 100x the load of others), independent release cadence (different teams need to deploy without coordination), compliance isolation (PCI data must be isolated), or team autonomy. Each driver leads to different service boundaries.
- **Assess data maturity:** Microservices require each service to own its data store. If the system has a single shared database with cross-cutting joins everywhere, document the data coupling as the primary migration risk. Do not proceed without a data decoupling strategy.
- **Document the "as-is" system map:** Before designing boundaries, map the current system. List all modules/components, their data dependencies, their traffic volumes, and their release frequencies. This is the input to the decomposition exercise.

### Step 2 -- Define Service Boundaries Using Domain-Driven Design

Service boundaries are the most consequential decision in microservices design. Wrong boundaries cause chatty services, distributed monoliths, and broken data consistency.

- **Identify Bounded Contexts:** A bounded context is a linguistic boundary -- within it, a given term means exactly one thing. Map the domain language used by different teams or business units. If "customer" means something different to the billing team than to the support team, those are separate bounded contexts and likely separate services.
- **Use Event Storming:** Conduct a structured event storming session. Place domain events on a timeline (e.g., "OrderPlaced", "PaymentCaptured", "InventoryReserved"). Group events into aggregates, then group aggregates into bounded contexts. Services emerge from bounded contexts, not the other way around.
- **Apply the "Single Reason to Change" test:** Each service should change for exactly one business reason. If adding a new payment method also requires changing the order service and the notification service, the boundary is wrong. Redraw it.
- **Recognize common wrong boundaries:** Avoid decomposing by technical layer (a "database service", a "validation service") -- this creates technical coupling, not business alignment. Avoid decomposing too granularly -- a "UserAddress service" that exists only to store addresses is too fine-grained. The minimum viable service owns at least one aggregate, exposes a meaningful API, and can be deployed independently.
- **Validate with the "team can describe it in one sentence" rule:** If a team cannot clearly articulate what a service is responsible for and what it is not responsible for, the boundary needs refinement.
- **Map context relationships:** Document how bounded contexts relate -- Partnership (two teams deploy together), Customer-Supplier (one team depends on another's contract), Conformist (downstream accepts upstream model as-is), Anticorruption Layer (downstream translates upstream model), Published Language (shared formal contract). These relationships determine integration patterns.

### Step 3 -- Design the Communication Architecture

Communication patterns determine latency characteristics, coupling, and resilience.

- **Default to asynchronous messaging for cross-service workflows:** Use synchronous HTTP/gRPC only when the caller genuinely needs an immediate response to proceed (e.g., a user-facing read request, a real-time fraud check). Use asynchronous messaging (Kafka, RabbitMQ, AWS SQS) for all workflows where eventual consistency is acceptable.
- **Choose gRPC over REST for internal service-to-service calls** when services are on the same network, when performance matters (binary Protocol Buffers serialization is 3--10x smaller than JSON), and when strong contracts are required. Use REST/JSON for external-facing APIs or when clients are browsers/mobile apps.
- **Apply the Saga pattern for distributed transactions:** Never use two-phase commit (2PC) in microservices -- it creates tight coupling and availability dependencies. Use Sagas instead. Choreography-based sagas (each service reacts to events and emits events) work well for simple flows under ~5 steps. Orchestration-based sagas (a dedicated orchestrator service drives the workflow) are better for complex flows, as they centralize rollback logic and make the workflow visible.
- **Design for idempotency on all message consumers:** Every service consuming messages must handle duplicate delivery gracefully. Assign a unique correlation ID to every operation and check for it before processing. Store the correlation ID in the same database transaction as the business state change.
- **Design the API Gateway layer:** The gateway is the single ingress point for external clients. It should handle authentication/authorization, rate limiting, request routing, and protocol translation (REST-to-gRPC). Do not put business logic in the gateway. Common implementations: Kong, AWS API Gateway, Nginx with Lua, or custom Go/Node.js proxy.
- **Consider a service mesh for internal traffic:** A service mesh (Istio, Linkerd, Consul Connect) handles mutual TLS between services, circuit breaking, retries, and distributed tracing at the infrastructure level, removing these concerns from application code. Adopt a mesh when you have 10+ services or when mTLS enforcement is a compliance requirement.

### Step 4 -- Design the Data Architecture

Data ownership is the hardest part of microservices. Each service must own its data -- no sharing database schemas.

- **Enforce the "no shared database" rule absolutely:** Two services querying the same table is a distributed monolith. If service B needs data owned by service A, service B must either call service A's API or subscribe to service A's events and maintain its own read model.
- **Choose the right database per service:** Microservices enable polyglot persistence. Use PostgreSQL for transactional data with relational constraints. Use Redis for session data, rate limiting counters, and caches with TTL. Use Cassandra or DynamoDB for write-heavy time-series or high-scale key-value data. Use Elasticsearch for full-text search read models. Match the database to the access pattern, not to organizational inertia.
- **Apply CQRS where read and write models diverge significantly:** Command Query Responsibility Segregation separates the write model (normalized, transactional) from the read model (denormalized, optimized for queries). This is especially valuable when a service's write throughput and read throughput have very different characteristics, or when the read model must aggregate data across multiple aggregates.
- **Use the Outbox Pattern to guarantee event publishing:** Storing a domain event in a message broker inside a transaction is impossible. Instead, write the event to an "outbox" table in the same database transaction as the state change. A separate process (Debezium CDC, a polling publisher) reads the outbox and publishes to the message broker. This ensures exactly-once publishing with no dual-write failures.
- **Design for eventual consistency explicitly:** Document which operations are eventually consistent and what the maximum expected lag is (e.g., "inventory read model lags behind inventory writes by < 500ms under normal load"). Expose this in API documentation so callers can design appropriately.
- **Manage schema migrations per service independently:** Each service runs its own migration tool (Flyway, Liquibase, or golang-migrate). Migrations must be backward-compatible -- add columns before removing them, use expand-contract patterns for breaking changes, and deploy the new code before dropping old columns.

### Step 5 -- Design for Resilience

Distributed systems fail in partial and unexpected ways. Resilience must be designed in, not added later.

- **Apply the Circuit Breaker pattern on all synchronous downstream calls:** A circuit breaker monitors failure rates. When failures exceed a threshold (e.g., 50% error rate over a 10-second window), the circuit opens and the caller fast-fails instead of waiting for timeouts. This prevents cascading failures. Implement with Resilience4j (Java), Polly (.NET), or at the service mesh layer.
- **Set aggressive timeouts:** Every network call must have a timeout. A default of 1--3 seconds for internal service calls is typical. Never use the language default (often infinite). Pair timeouts with circuit breakers -- a service that is slow is worse than one that is down, because slow services exhaust thread pools.
- **Implement exponential backoff with jitter on retries:** Retrying immediately on failure amplifies load. Retry after 100ms, then 200ms, then 400ms (exponential), with a random jitter of ±25% to prevent thundering herds. Limit retries to 3--5 attempts. Only retry idempotent operations.
- **Apply bulkhead isolation:** Allocate separate thread pools or connection pools for different downstream dependencies. If one downstream is slow, it should exhaust only its own pool, not the entire service's concurrency capacity.
- **Design fallback behaviors explicitly:** For every circuit breaker, define the fallback: return cached data, return a degraded response, or queue the request for later processing. "Fail fast with a clear error" is better than "hang silently."
- **Perform chaos engineering in staging:** Inject latency, kill individual service instances, simulate network partitions. Tools like Chaos Monkey, Gremlin, or Toxiproxy verify that resilience patterns work under realistic failure conditions.

### Step 6 -- Design the Observability Stack

You cannot debug a microservices system without structured observability. Logs alone are insufficient.

- **Implement the three pillars:** Metrics (what is happening numerically), Logs (what happened in detail), and Traces (how a request traveled across services). All three are required.
- **Use distributed tracing with correlation IDs:** Every inbound request generates a trace ID. The trace ID propagates in HTTP headers (W3C TraceContext: `traceparent`) and message headers across all service calls. Use OpenTelemetry as the vendor-neutral instrumentation layer, then export to Jaeger, Zipkin, or a commercial backend (Honeycomb, Datadog APM).
- **Emit structured logs in JSON format:** Every log entry must include: service name, version, trace ID, span ID, timestamp (UTC, ISO 8601), log level, and a message. Do not concatenate strings. Structured logs are queryable in log aggregation platforms (Loki, Elasticsearch, Splunk).
- **Define golden signal SLIs for every service:** The four golden signals are Latency (p50, p95, p99), Traffic (requests/sec), Errors (error rate %), and Saturation (CPU, memory, queue depth). Define SLOs against these: e.g., "p99 latency < 200ms for the Orders API 99.9% of the time over a 30-day window."
- **Implement health check endpoints:** Every service must expose `/health/live` (is the process running?) and `/health/ready` (can the service handle traffic? -- checks downstream dependencies). Kubernetes uses liveness and readiness probes against these endpoints.

### Step 7 -- Design the Deployment and Service Contract Strategy

Microservices derive their value from independent deployability. This requires careful contract management.

- **Version APIs explicitly:** Use URL path versioning (/v1/, /v2/) for REST APIs. For event schemas, use a schema registry (Confluent Schema Registry, AWS Glue Schema Registry) with compatibility enforcement (BACKWARD compatibility by default -- new consumers can read old messages).
- **Follow the expand-contract pattern for breaking changes:** Phase 1: add the new field/endpoint/event (expand). Deploy all consumers. Phase 2: remove the old field/endpoint/event (contract). This prevents hard coupling between deployment timings.
- **Use consumer-driven contract testing:** Tools like Pact enable consumer services to define the contract they expect from a provider. The provider runs the consumer's contract as part of its own test suite. This catches breaking changes before deployment, without requiring all services to run simultaneously in a test environment.
- **Design for zero-downtime deployments:** Use blue-green deployments (maintain two identical environments, switch traffic) or canary releases (route 5% of traffic to new version, ramp up on success). Database migrations must always be backward-compatible with the currently-deployed version of the service.
- **Maintain a service catalog:** Every service must have machine-readable documentation: its owner team, SLA, dependencies, API contract (OpenAPI spec or Protobuf), event schema, runbook location, and on-call contact. Tools: Backstage, OpsLevel, or a simple internal wiki with a consistent template.

### Step 8 -- Review and Validate the Design

Before committing to implementation, validate the design against known failure modes.

- **Run an Architecture Decision Record (ADR) review:** Each significant decision (service boundary, communication pattern, data store choice, saga strategy) should be captured as an ADR with context, decision, and consequences. ADRs are numbered and stored in the service repository.
- **Perform a failure mode analysis:** For each service, ask: what happens if this service goes down? What degrades? What fails completely? What becomes inconsistent? Document answers and ensure the system has defined behavior for each scenario.
- **Validate the data flow end-to-end:** Trace a representative business process (e.g., "user places an order") through the system. List every service call, every database write, every event published. Verify that failure at any step either leaves the system consistent or triggers a compensation transaction.
- **Review for the "distributed monolith" antipattern:** If more than 30% of deployments require coordinating changes across 3+ services simultaneously, the boundaries may be wrong. If service A fails and service B always fails too, there is hidden coupling. If services share a database, they are not truly independent.

---

## Output Format

Use this template when presenting a microservices design recommendation:

```
## Microservices Design Specification: [System/Feature Name]

### Context Summary
- Business domain: [e.g., e-commerce order fulfillment]
- Team structure: [e.g., 3 teams, 8 engineers each]
- Current state: [e.g., Rails monolith, ~500k req/day]
- Decomposition driver: [e.g., scaling hot spot on inventory; independent release cadence for payments]

---

### Service Boundary Map

| Service Name       | Bounded Context      | Owns Aggregate(s)         | Database         | Team Owner    |
|--------------------|---------------------|---------------------------|-----------------|---------------|
| orders-service     | Order Management    | Order, OrderLineItem       | PostgreSQL       | Fulfillment   |
| inventory-service  | Inventory           | SKU, StockLedger           | PostgreSQL       | Catalog       |
| payments-service   | Payments            | Payment, Refund            | PostgreSQL       | Payments      |
| notifications-svc  | Notifications       | Notification, Template     | PostgreSQL       | Platform      |
| user-service       | Identity            | User, Profile, Session     | PostgreSQL+Redis | Platform      |

---

### Communication Architecture

| Interaction                          | Pattern          | Protocol       | Justification                              |
|--------------------------------------|-----------------|----------------|--------------------------------------------|
| Client → API                         | Sync request    | REST/HTTPS     | User-facing, needs immediate response      |
| orders → inventory (reservation)     | Sync call       | gRPC           | Must confirm availability before order     |
| orders → payments (charge)           | Orchestrated saga| Kafka events  | Distributed transaction, compensation needed|
| payments → notifications             | Async event     | Kafka          | Fire-and-forget, eventual consistency OK   |
| inventory read model                 | CQRS projection  | Kafka CDC      | High read:write ratio, separate query model|

---

### Data Architecture Decisions

| Service            | Write Store      | Read Store       | Event Pattern     | Migration Tool |
|--------------------|-----------------|-----------------|-------------------|----------------|
| orders-service     | PostgreSQL       | N/A              | Outbox → Kafka    | Flyway          |
| inventory-service  | PostgreSQL       | Redis (cache)    | Outbox → Kafka    | Flyway          |
| payments-service   | PostgreSQL       | N/A              | Outbox → Kafka    | Flyway          |

---

### Saga Design: Order Placement

**Type:** Orchestration-based (OrderOrchestrator service)

| Step | Command Sent           | Success Event               | Failure Compensation              |
|------|------------------------|-----------------------------|------------------------------------|
| 1    | ReserveInventory       | InventoryReserved           | -- (first step, no prior to undo) |
| 2    | AuthorizePayment       | PaymentAuthorized           | ReleaseInventoryReservation        |
| 3    | ConfirmOrder           | OrderConfirmed              | RefundPayment, ReleaseInventory    |
| 4    | SendConfirmationEmail  | NotificationSent            | -- (non-critical, log failure)    |

---

### Resilience Configuration

| Service             | Timeout (outbound) | Circuit Breaker Threshold | Retry Policy              | Fallback                        |
|---------------------|--------------------|--------------------------|---------------------------|---------------------------------|
| orders-service      | 2s (inventory)     | 50% errors / 10s window  | 3x, exp backoff + jitter  | Return HTTP 503, surface to user|
| orders-service      | 3s (payments)      | 30% errors / 10s window  | 2x (non-idempotent, caution)| Queue for async retry          |
| inventory-service   | 1s (Redis cache)   | 80% errors / 5s window   | 1x, no jitter             | Fall through to PostgreSQL      |

---

### Observability Setup

- Tracing: OpenTelemetry SDK → Jaeger (internal) / Datadog APM (production)
- Metrics: Prometheus exposition format, scraped every 15s, stored in Thanos
- Logs: JSON structured, shipped via Fluentd to Loki
- Correlation: W3C `traceparent` header propagated across all HTTP and Kafka calls
- Alerting SLOs:
  - orders-service: p99 latency < 300ms | error rate < 0.1% | measured over 30-day window
  - payments-service: p99 latency < 500ms | error rate < 0.01% | measured over 30-day window

---

### Deployment Strategy

- Deployment pattern: Canary releases (5% → 25% → 100%, 10 min soak at each stage)
- Contract testing: Pact broker, consumer contracts run in provider CI pipelines
- Schema registry: Confluent Schema Registry, BACKWARD compatibility enforced
- Health endpoints: /health/live and /health/ready on all services, port 8081
- Service catalog: Backstage, updated via CI pipeline on merge to main

---

### Architecture Decision Records

| ADR # | Decision                                      | Status   |
|-------|-----------------------------------------------|----------|
| ADR-001 | Use orchestration-based saga for order flow | Accepted |
| ADR-002 | gRPC for inventory reservation (sync)        | Accepted |
| ADR-003 | PostgreSQL per service, no shared schemas    | Accepted |
| ADR-004 | Outbox pattern for guaranteed event delivery | Accepted |
| ADR-005 | Service mesh (Istio) deferred until 10+ svc  | Proposed |
```

---

## Rules

1. **Never share a database between two services.** Two services reading the same table or schema is a distributed monolith, not microservices. If it cannot be avoided in the short term (legacy migration), document it explicitly as technical debt with a removal date.

2. **Never use distributed two-phase commit (2PC).** 2PC creates tight availability coupling -- if the coordinator is unavailable, all participants are blocked. Use Sagas (choreography or orchestration) for all cross-service transactions. The additional complexity is mandatory, not optional.

3. **Never design service boundaries along technical layers.** A "validation service" or "persistence service" is not a microservice -- it is a distributed library. All service boundaries must follow business domain boundaries (bounded contexts).

4. **Always assign a single team as the owner of each service.** No service may have joint ownership. Joint ownership means no clear accountability for SLAs, on-call response, or API contract stability. If two teams both need a capability, one owns the service and the other is a customer.

5. **Never create synchronous call chains longer than 3 hops for user-facing requests.** A user request that causes Service A to call B, which calls C, which calls D creates compounded latency (latencies multiply) and catastrophic failure amplification. Redesign long chains with async messaging, request fan-out aggregation, or boundary revision.

6. **Always implement idempotency on all message consumers and all POST/PUT/PATCH endpoints.** At-least-once delivery is the default guarantee in every message broker. Assume every message will be delivered 2+ times and design accordingly. Use idempotency keys stored with the business state.

7. **Never expose a service's internal data model as its API contract.** The API contract is a public interface that must be versioned and stable. The internal database schema is a private implementation detail. Coupling them means every schema refactor breaks consumers.

8. **Always set explicit timeouts on every outbound network call.** No timeout means a slow dependency can exhaust all threads/connections, taking down the caller. The default in most HTTP clients is "no timeout" or "system TCP timeout" (minutes). Set it explicitly: 500ms--3s for internal calls, 5--10s for external APIs.

9. **Apply the Strangler Fig pattern when migrating from a monolith.** Never attempt a "big bang" rewrite of a monolith into microservices. Route new traffic to the new service while the old monolith handles existing traffic. Migrate one bounded context at a time. Maintain a facade (API gateway or proxy) that routes to either the monolith or the new service based on the operation.

10. **Do not adopt microservices to solve a people or process problem.** Microservices solve deployment coupling and scaling isolation. They do not fix poor code quality, unclear product ownership, or organizational dysfunction. If the real problem is slow deployments due to manual processes, fix the CI/CD pipeline first. If the real problem is unclear ownership, fix the org chart first.

---

## Edge Cases

### Migrating a Shared Database (The "Shared Schema" Monolith)

The most common microservices migration scenario involves a single relational database with dozens of tables and cross-cutting foreign key relationships. Do not attempt to split the database before splitting the code. The sequence is: (1) separate the application codepaths first -- introduce service interfaces in the monolith code that isolate data access by bounded context; (2) deploy the new service with its own database and dual-write: write to both the old shared table and the new service's table while reads still hit the old table; (3) once the new service's data is verified consistent, move reads to the new service; (4) remove the dual-write and drop the old table. This process takes weeks to months per service. Rushing it is the primary cause of microservices migration disasters.

### Event Schema Evolution and Backward Compatibility

When a service publishes events consumed by 5+ downstream services, changing an event schema risks breaking all consumers simultaneously. Always use a schema registry with compatibility checks. The BACKWARD compatibility rule means: a consumer using the old schema can read messages produced with the new schema. This allows consumers to upgrade at their own pace. Never remove a required field without a deprecation period of at least 2 full deployment cycles. Never rename a field -- add the new field alongside the old one, migrate consumers, then remove the old field. When a breaking change is unavoidable, publish a new event topic (e.g., `orders.v2.placed`) and route consumers in parallel during migration.

### The Chatty Service Antipattern

If profiling shows that fulfilling a single API request requires 20+ inter-service calls, the service decomposition is likely too fine-grained. This manifests as p99 latency >1s on operations that should be fast, and cascading failures where a single slow dependency causes widespread degradation. Resolution options in priority order: (1) redesign the boundary -- merge the chatty services into one if they represent a single cohesive domain; (2) introduce an aggregator service or Backend for Frontend (BFF) that makes parallel calls and assembles the response; (3) introduce a read-optimized projection (CQRS read model) that pre-computes the assembled response asynchronously. Never solve chatty services by simply increasing timeouts -- that treats the symptom, not the cause.

### Service Discovery in Multi-Region or Hybrid Cloud Deployments

Standard Kubernetes DNS-based service discovery (ClusterIP services) does not work across clusters or clouds. When a microservices system spans multiple regions for availability or latency reasons, implement either: (1) a service mesh with multi-cluster federation (Istio multi-cluster, Linkerd multi-cluster) that handles cross-cluster mTLS and service discovery; or (2) an API gateway per region with explicit cross-region routing rules. Never rely on hardcoded IP addresses or external DNS for internal service-to-service calls -- it creates brittle dependencies that break during failover scenarios. Each region must be able to operate independently (active-active preferred, active-passive acceptable) without real-time dependency on a remote region for critical paths.

### The "Too Many Sagas" Complexity Problem

When a system has 15+ orchestrated sagas, the cognitive overhead of understanding the overall system workflow becomes extreme. Symptoms: engineers cannot explain what happens to data in a failure scenario; compensation logic has never been tested in production; on-call incidents take hours to diagnose because the state machine is unclear. Mitigations: (1) consolidate simple linear workflows into choreography-based sagas (no central orchestrator, simpler mental model); (2) invest in saga state visualization -- a dashboard showing all in-flight saga instances and their current step is invaluable for operations; (3) test compensation logic explicitly in CI using contract tests; (4) consider whether some of the sagas can be eliminated by redesigning service boundaries to keep the transaction within a single service.

### High-Security and Compliance Requirements (PCI-DSS, HIPAA, SOC 2)

Microservices that handle sensitive data (payment card data, health records, PII) require additional design constraints. Isolate regulated workloads into their own network segment (VPC, namespace) with explicit ingress/egress rules -- a microservices architecture makes this isolation tractable because the boundary is clear. Enforce mTLS on all communication to/from regulated services (service mesh is the practical path). Implement field-level encryption for sensitive fields at rest and in transit -- the encryption key must not be accessible to services that do not have a business need to read the plaintext. Audit every access to sensitive data: structured log entries with actor, timestamp, operation, and resource ID. Implement network egress filtering to prevent data exfiltration. Conduct threat modeling per service for regulated workloads -- the STRIDE model is appropriate.

### Versioning When Multiple API Consumers Have Different Upgrade Timelines

Enterprise environments often have mobile clients (iOS/Android) that cannot force-upgrade users, third-party integrations on contractual SLAs, and internal services on independent release cycles. All of them consume the same API. Strategy: (1) maintain at minimum N and N-1 API versions simultaneously; (2) use a sunset header (`Sunset: Sat, 01 Jan 2026 00:00:00 GMT`) on deprecated endpoints to signal end-of-life to consumers; (3) implement usage analytics on each API version endpoint to identify which clients are still using deprecated versions before removing them; (4) never remove an API version that still has >0 calls per day without explicit coordinated migration confirmation from all consumers.

---

## Example

**Input:** "We're building a food delivery platform. We have a team of 24 engineers split into 4 teams. We currently have a Node.js monolith that handles everything: user accounts, restaurant menus, order placement, payment processing, and delivery driver tracking. We're hitting scaling issues on the order placement and driver tracking parts specifically, and the payments team wants to deploy independently. What microservices architecture would you recommend?"

---

**Output:**

## Microservices Design Specification: Food Delivery Platform

### Context Summary
- **Business domain:** Food delivery platform (consumer ordering, restaurant operations, driver logistics, payments)
- **Team structure:** 24 engineers, 4 teams (~6 engineers each)
- **Current state:** Node.js monolith, scaling bottlenecks on order placement and driver tracking, payments team blocked on independent deployments
- **Decomposition drivers:**
  1. Scaling isolation: order placement and driver tracking are hot spots requiring independent scaling
  2. Independent release cadence: payments team needs to ship without coordinating with other teams
  3. Compliance isolation: payment data (PCI-DSS scope) benefits from boundary isolation

---

### Service Boundary Map

Apply event storming to identify domain events: `OrderPlaced`, `OrderAccepted` (by restaurant), `DriverAssigned`, `DriverLocationUpdated`, `OrderPickedUp`, `OrderDelivered`, `PaymentCaptured`, `PaymentRefunded`, `MenuItemUpdated`, `UserRegistered`.

These events cluster into four bounded contexts that map directly to the four teams:

| Service Name         | Bounded Context     | Owns Aggregates                      | Database                    | Team Owner     |
|----------------------|---------------------|--------------------------------------|-----------------------------|----------------|
| user-service         | Identity            | User, Address, Session               | PostgreSQL + Redis (sessions)| Platform Team  |
| catalog-service      | Restaurant Catalog  | Restaurant, Menu, MenuItem, Hours    | PostgreSQL + Redis (read cache)| Catalog Team  |
| orders-service       | Order Management    | Order, OrderLineItem, OrderStatus    | PostgreSQL                  | Orders Team    |
| payments-service     | Payments            | Payment, Refund, PaymentMethod       | PostgreSQL (PCI segment)    | Payments Team  |
| delivery-service     | Delivery Logistics  | DeliveryJob, DriverLocation, Route   | PostgreSQL + Redis (live loc)| Delivery Team  |
| notifications-svc    | Notifications       | Notification, Template               | PostgreSQL                  | Platform Team  |

**Notes on boundary decisions:**
- `catalog-service` and `orders-service` are separate despite both touching "order items" -- the catalog owns the definition of what can be ordered; orders owns the snapshot of what was ordered (including price at time of order, which must not change if the menu changes later)
- `delivery-service` is isolated specifically for the driver tracking scaling requirement -- it will handle 10--50 location updates per second per active driver via WebSocket connections, a completely different scaling profile than orders
- `notifications-svc` is owned by Platform Team alongside `user-service` to avoid a fifth team for a low-complexity service

---

### Communication Architecture

| Interaction                              | Pattern              | Protocol         | Justification                                      |
|------------------------------------------|---------------------|------------------|----------------------------------------------------|
| Mobile/web client → API                  | Sync request         | REST/HTTPS       | User-facing; immediate response required           |
| orders → catalog (price validation)      | Sync call            | gRPC             | Must validate price and availability at order time |
| orders → payments (charge)               | Orchestrated saga    | Kafka events     | Distributed transaction; compensation logic needed |
| orders → delivery (dispatch)             | Async event          | Kafka            | Fire-and-forget; delivery picks up when ready      |
| payments → orders (payment result)       | Async event          | Kafka            | Saga response; eventual update acceptable          |
| delivery → orders (status updates)       | Async event          | Kafka            | Status sync; eventual consistency OK (< 2s lag)    |
| any service → notifications              | Async event          | Kafka            | Non-critical path; all notification triggers async |
| driver app → delivery (location)         | WebSocket            | WSS              | 1--5 second location update frequency; persistent connection |

**API Gateway:** Single ingress via Kong. Handles JWT validation, rate limiting (100 req/min per authenticated user, 10 req/min unauthenticated), and routing. No business logic in the gateway.

---

### Saga Design: Order Placement (Orchestration-Based)

**Orchestrator:** `orders-service` contains the saga orchestrator as an internal component (not a separate service -- the team is 6 engineers). The orchestrator state is persisted in the `order_saga_state` table in the orders PostgreSQL database.

| Step | Command Published         | Kafka Topic                | Success Event              | Compensation Command               |
|------|---------------------------|----------------------------|----------------------------|------------------------------------|
| 1    | ValidateCart              | catalog.commands           | CartValidated              | -- (first step)                   |
| 2    | ReservePaymentMethod      | payments.commands          | PaymentMethodReserved      | -- (authorization, not charge)    |
| 3    | CapturePayment            | payments.commands          | PaymentCaptured            | RefundPayment                      |
| 4    | DispatchDelivery          | delivery.commands          | DeliveryDispatched         | CancelDelivery + RefundPayment     |
| 5    | SendOrderConfirmation     | notifications.commands     | NotificationSent           | -- (non-critical; log failure)    |

**Failure behavior:**
- Cart validation failure (step 1): return HTTP 422 to caller with specific item error
- Payment capture failure (step 3): return HTTP 402 to caller; saga terminates
- Delivery dispatch failure (step 4): trigger RefundPayment compensation; return HTTP 503; alert on-call

---

### Data Architecture Decisions

**Outbox Pattern Implementation** (applies to all services):

Each service has an `outbox` table:
```sql
CREATE TABLE outbox (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic       VARCHAR(255) NOT NULL,
  payload     JSONB NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published   BOOLEAN NOT NULL DEFAULT FALSE
);
```

State change and outbox insert happen in the same database transaction. A Debezium CDC connector reads the `outbox` table via PostgreSQL logical replication and publishes to Kafka. This guarantees exactly-once event publishing.

**CQRS for delivery-service:**

Driver location updates arrive at 10--50 updates/second per driver. Querying the current location of all active drivers in a geographic area for order dispatch cannot hit PostgreSQL at this rate. Design:
- Write model: each location update appended to `driver_location_events` table (PostgreSQL, partitioned by day)
- Read model: Redis hash per driver ID, updated on each location event, TTL 30 seconds (if no update, driver is considered offline). Geospatial queries use Redis GEOADD/GEORADIUS commands.

**Schema for payments-service** (PCI isolation):
- Deployed in a separate Kubernetes namespace with NetworkPolicy blocking all egress except to its own database and the Kafka brokers
- Card data stored with AES-256 encryption at field level; encryption keys managed by AWS KMS, not accessible to other services
- All access logged to immutable audit log (append-only PostgreSQL table with row-level security)

---

### Resilience Configuration

| Service          | Dependency          | Timeout | Circuit Breaker              | Retry Policy             | Fallback                            |
|------------------|---------------------|---------|------------------------------|--------------------------|-------------------------------------|
| orders-service   | catalog (gRPC)      | 1.5s    | 40% errors / 10s window      | 2x, 100ms + jitter       | Reject order with "service unavailable" |
| orders-service   | payments (Kafka)    | N/A     | N/A (async)                  | Kafka producer retry: 5x | Dead-letter topic: payments.dlq     |
| delivery-service | Redis (geo queries) | 200ms   | 70% errors / 5s window       | 1x immediate             | Fall through to PostgreSQL query    |
| catalog-service  | Redis (read cache)  | 100ms   | 80% errors / 5s window       | None                     | Fall through to PostgreSQL          |

**Bulkhead configuration for orders-service:**
- Separate thread pool for catalog gRPC calls: max 20 concurrent requests
- Separate thread pool for saga orchestration: max 50 concurrent sagas
- Default HTTP handler pool: 200 threads
- Rationale: a slow catalog response cannot exhaust the handler pool for all other order operations

---

### Observability Setup

- **Tracing:** OpenTelemetry Node.js SDK on all services; export to Jaeger (dev/staging), Datadog APM (production); W3C `traceparent` propagated in all HTTP headers and Kafka message headers
- **Metrics:** Prometheus client per service; custom metrics: `orders_placed_total`, `saga_step_duration_seconds`, `driver_location_updates_total`, `payment_capture_duration_seconds`
- **Logs:** Winston (Node.js) configured for JSON output; fields: `service`, `version`, `traceId`, `spanId`, `level`, `message`, `timestamp`; shipped via Fluent Bit to Loki
- **SLOs:**

| Service          | SLI                          | SLO Target      |
|------------------|------------------------------|-----------------|
| orders-service   | p99 order placement latency  | < 800ms         |
| orders-service   | Error rate (5xx)             | < 0.5%          |
| payments-service | p99 payment capture latency  | < 1200ms        |
| payments-service | Error rate (5xx)             | < 0.05%         |
| delivery-service | p99 location update latency  | < 300ms         |
| catalog-service  | p99 menu read latency        | < 150ms         |

---

### Migration Plan from Monolith (Strangler Fig)

The monolith is not replaced in a single cutover. The sequence:

1. **Week 1--4 -- Payments Service:** Extract the payments bounded context first because the team has the strongest deployment independence motivation. Stand up `payments-service` with its own database. Use a database sync job to dual-write payments data to the new service during transition. Route `/api/v1/payments/*` traffic through Kong to the new service. Decommission payment code in monolith once data sync is verified consistent for 2 weeks.

2. **Week 5--10 -- Catalog Service:** Lowest risk extraction. Restaurant menu data is largely read-heavy. Stand up `catalog-service`. Migrate read traffic first (catalog reads are stateless). Then migrate write traffic. This service's extraction also produces the gRPC contract that `orders-service` will later consume.

3. **Week 11--18 -- Delivery Service:** Stand up `delivery-service` with Redis geospatial layer. This is the second scaling hot spot. Route WebSocket connections from driver apps to the new service. Maintain a REST adapter in the monolith that proxies delivery status queries to the new service.

4. **Week 19--28 -- Orders Service + Saga:** Most complex extraction. The orders flow currently has inline calls to payments and delivery. Replace these with the Kafka saga. This is the highest-risk migration step -- run shadow mode (execute both old and new order paths in parallel, compare results) for 2 weeks before cutting over.

5. **Week 29--32 -- User Service:** Extract identity/session management last. Implement JWT issuance in the new service; the monolith becomes a JWT consumer rather than a session issuer.

---

### Architecture Decision Records

| ADR #   | Decision                                                                  | Status   | Rationale Summary                                                    |
|---------|---------------------------------------------------------------------------|----------|----------------------------------------------------------------------|
| ADR-001 | Orchestration-based saga for order placement                              | Accepted | 5-step transaction with non-trivial rollback logic; central visibility needed |
| ADR-002 | gRPC for orders → catalog price validation                                | Accepted | Synchronous, latency-sensitive; binary protocol reduces p99         |
| ADR-003 | Redis GEOADD for driver location read model                               | Accepted | Native geospatial queries, 50--50k driver scale, sub-10ms reads     |
| ADR-004 | Outbox pattern via Debezium CDC for all event publishing                  | Accepted | Guarantees no lost events under database transaction rollback       |
| ADR-005 | Payments service in isolated Kubernetes namespace (PCI scope reduction)   | Accepted | Network isolation reduces PCI audit scope; required by security team|
| ADR-006 | Service mesh (Istio) deferred until 6+ services in production             | Proposed | Current 6 services can use application-level circuit breakers; revisit at 10 services |
| ADR-007 | Strangler Fig migration rather than big-bang rewrite                      | Accepted | Monolith handles $X revenue; zero-downtime migration mandatory      |
