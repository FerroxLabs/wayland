---
name: monolith-to-microservices
description: |
  Guides expert-level monolith to microservices migration implementation: refactoring and backend decision frameworks, production-ready patterns, and concrete templates for monolith to microservices workflows.
  Use when the user asks about monolith to microservices migration, monolith to microservices configuration, or architecture best practices for monolith projects.
  Do NOT use when the user needs a different architecture design capability -- check sibling skills in the architecture design subcategory.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "architecture refactoring backend"
  category: "software-engineering"
  subcategory: "architecture-design"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Monolith To Microservices

## When to Use

**Use this skill when:**
- A user has a monolithic application experiencing deployment bottlenecks where a single team's changes block all releases, and they want to decompose into independently deployable units
- A user's monolith has clear bounded domains (e.g., billing, user management, inventory) that have different scaling requirements -- the payment service needs 10x the compute of the admin panel
- A user is planning a strangler fig migration and needs concrete patterns for routing, data decoupling, and incremental cutover without a big-bang rewrite
- A user needs to evaluate whether their codebase is actually ready for microservices and wants a structured readiness assessment
- A user is mid-migration (e.g., they have extracted 2-3 services already) and is encountering problems like distributed transactions, data consistency, or service discovery failures
- A user needs to design the API contracts, event schemas, and data ownership boundaries for a specific decomposition scenario
- A user asks about domain-driven design (DDD) as applied to service boundary identification, aggregates, bounded contexts, or context maps

**Do NOT use this skill when:**
- The user is asking about container orchestration configuration (Kubernetes YAML, Helm charts) without an architectural migration question -- use a Kubernetes/infrastructure skill
- The user wants general REST API design without a migration context -- use an API design skill
- The user is asking about event-driven architecture in general, not specifically in the context of decomposing a monolith -- use an event-driven architecture skill
- The user has a microservices architecture and is asking about service mesh configuration (Istio, Linkerd) for an already-decomposed system
- The user explicitly states their team is fewer than 5 engineers and their system has fewer than 100K daily active users -- advise them a monolith is likely still the right choice and explain why
- The user is asking about database sharding or horizontal scaling within an existing monolith -- use a database scaling skill
- The user wants to migrate from one microservices architecture to another (e.g., reshaping existing service boundaries)

---

## Process

### 1. Assess Migration Readiness and Motivation

Before recommending any migration pattern, establish whether microservices are the right solution and how prepared the organization is.

- **Identify the actual pain point.** Is the problem deployment coupling (one team blocks another), scaling (the entire app must scale when only billing is under load), or organizational Conway's Law pressure (teams are organized by domain, not by technical layer)? The pain point determines which parts to extract first.
- **Apply the Three Signals Test.** Microservices are justified when at least two of three signals are present: (1) the team has grown past 20 engineers working on the same codebase, (2) independent deployment of features is blocked more than 2x per sprint, or (3) specific components need to scale at 5x or more relative to others.
- **Assess operational maturity.** A team moving to microservices must already have: centralized logging with correlation IDs, distributed tracing capability, automated CI/CD pipelines, and a container runtime (Docker + Kubernetes or equivalent). Without these, microservices will create more problems than they solve.
- **Map the existing monolith's dependency graph.** Use static analysis tools (dependency cruiser for Node.js, ArchUnit for Java, pydeps for Python) to generate a module dependency diagram. This reveals which modules are highly coupled (many bidirectional dependencies) vs. loosely coupled (clear input/output contracts).
- **Identify team structure and map it to the codebase.** Conway's Law means service boundaries should reflect team boundaries. Use a team topology map -- stream-aligned teams own one service, platform teams own shared infrastructure services.

### 2. Identify Bounded Contexts and Service Boundaries

Service boundaries are the most consequential architectural decision. Getting them wrong creates a distributed monolith -- the worst of both worlds.

- **Apply Domain-Driven Design bounded context analysis.** Interview domain experts and draw context maps that show where the same word means different things (e.g., "Customer" in billing means a paying entity; in support it means anyone who contacts them). Each distinct meaning is a boundary candidate.
- **Use the four boundary heuristics in order:**
  - **Business capability** -- can this domain be described as a job-to-be-done (e.g., "process payments", "manage inventory")? If yes, it's a candidate service.
  - **Change frequency** -- modules that change together should stay together. Use git log analysis: `git log --format="%H" -- path/to/module | xargs git show --stat` to see co-change patterns. Modules that always change together in the same commit belong in the same service.
  - **Data ownership** -- each service must own its data. If two modules always query each other's tables, splitting them requires careful data duplication or API dependency.
  - **Team ownership** -- a service with no clear team owner will become orphaned. Only create a service if a team can commit to owning it long-term.
- **Avoid the nano-service anti-pattern.** A service that does only one CRUD operation on one table is almost certainly too fine-grained. A healthy microservice has 5-15 distinct operations and represents a meaningful business capability, not a technical function.
- **Draw a context map with relationship types.** Identify upstream/downstream relationships: shared kernel (two services share a library), customer-supplier (downstream service's needs drive upstream's roadmap), or anti-corruption layer (a translation layer that protects a service from a legacy domain model).
- **Document the proposed boundaries as a table** showing: service name, owning team, core entities, exposed operations, consumed events, and produced events.

### 3. Select the Migration Pattern

The migration strategy depends on the monolith's architecture, test coverage, and organizational risk tolerance.

- **Strangler Fig Pattern (default choice for most migrations):** Route traffic through an API gateway or proxy. New functionality is built in microservices from day one. Existing monolith functionality is migrated incrementally -- one bounded context at a time. The monolith is "strangled" as more routes are claimed by microservices until the monolith handles zero traffic and can be decommissioned.
  - Use a reverse proxy (Nginx, Envoy, AWS API Gateway) in front of the monolith. Add routing rules that send specific URL paths or request headers to new services while everything else continues to hit the monolith.
  - The proxy layer becomes the seam for gradual traffic shifting. Use canary routing (5% to new service, 95% to monolith) before full cutover.

- **Branch by Abstraction:** Introduce an abstraction interface in the monolith that wraps the functionality to be extracted. Deploy two implementations behind the interface -- the old in-process implementation and a new HTTP/gRPC client to the new service. Toggle between them with a feature flag. When the new service proves stable, remove the old implementation.
  - This pattern requires good test coverage on the abstraction's behavior, because both implementations must pass the same test suite.

- **Event Interception:** If the monolith emits domain events (or can be instrumented to emit them via change data capture from the database), new microservices can subscribe to these events and build their own read-optimized data stores. The monolith remains the system of record during transition.
  - Use Debezium for PostgreSQL/MySQL change data capture to intercept database-level changes without modifying monolith code.

- **Parallel Run:** Both the monolith and the new service process the same request. Compare results. Use this only for complex business logic migrations where correctness is critical (financial calculations, tax engines). Track divergence rate as a metric; when it reaches 0% for 72+ hours, decommission the monolith path.

- **Choose the right starting service.** Do NOT start with the most complex or most critical service. The first extraction should be: low traffic, low risk, clear boundary, owned by a team that can dedicate 2+ sprints to the migration. Good candidates: notification service, PDF generation, email preferences. Bad first candidates: authentication, order processing, payment.

### 4. Design the Data Architecture

Data is the hardest part of microservices migration. 90% of migration failures involve data coupling.

- **Enforce the "database per service" rule from day one.** Each service gets its own schema or database instance. No cross-service joins. This rule will be violated under time pressure -- establish it as a non-negotiable in the architecture decision record.
- **Choose the data synchronization strategy for each split:**
  - **API composition:** Service A calls Service B's API to get data it needs. Simple but creates runtime coupling. Appropriate for low-frequency reads.
  - **Event-driven data replication:** Service B publishes events when its data changes; Service A maintains its own read-optimized copy. Eventually consistent but decoupled. Appropriate when Service A needs frequent or high-volume reads.
  - **CQRS with separate read models:** High-throughput read scenarios. The write model is owned by the authoritative service; read models are projections consumed by other services.
- **Handle shared reference data.** Data like country codes, currencies, or product categories is often shared. Options: (1) publish as immutable events that all services consume and cache, (2) create a dedicated "reference data service" that returns this data via API with aggressive caching (TTL of 1 hour or longer), or (3) embed static reference data in each service's configuration.
- **Plan for distributed transactions.** When a single user action must write to two services atomically, use the Saga pattern -- not distributed transactions (2PC). Design compensating transactions for every write operation. For example, an "order placed" saga: (1) reserve inventory, (2) charge payment, (3) create order record. If step 2 fails, emit a "release inventory" compensating command.
- **Use the Outbox Pattern** to guarantee event delivery with at-least-once semantics. Instead of publishing an event directly to a message broker, write the event to an `outbox` table in the same database transaction as the state change. A separate relay process reads the outbox and publishes to Kafka/RabbitMQ. This eliminates dual-write failure.

### 5. Design Inter-Service Communication

The communication protocol choice has major implications for coupling, latency, and reliability.

- **Synchronous communication (HTTP/gRPC):** Use for queries where the caller needs the result immediately to complete its own response. Use gRPC when: services are internal only, you need strong schema contracts (protobuf), or performance is critical (gRPC is roughly 7x faster than REST for equivalent payloads). Use REST/JSON when: the service may be called by external clients or teams using different languages.
- **Asynchronous communication (events/messages):** Use for commands that trigger work in another service but don't require an immediate result. Use Kafka when: high throughput (>10K events/second), durable event log needed for replay, or fan-out to many consumers. Use RabbitMQ when: complex routing logic, work queues with competing consumers, or lower operational overhead is acceptable.
- **Define an API contract strategy.** Use OpenAPI 3.0 specifications for REST services. Use protobuf IDL files for gRPC services. Store contracts in a central registry. Use consumer-driven contract testing (Pact) to verify that service changes don't break consumers before deploying.
- **Implement the Circuit Breaker pattern** for all synchronous service-to-service calls. Use a library like Resilience4j (Java), Polly (.NET), or hystrix-go. Set failure threshold at 50% of calls in a 30-second sliding window. Half-open after 60 seconds. Never let a downstream failure cascade into a complete system outage.
- **Set explicit timeouts on all service calls.** Default HTTP clients have no timeout. Set: connection timeout 1s, read timeout 3s, total timeout 10s for non-critical paths, 30s for complex operations. Log all timeout occurrences as warnings. Alert on timeout rate > 1% over 5 minutes.

### 6. Implement Observability Infrastructure

Microservices fail in ways a monolith never does. Observability must be in place before services go to production.

- **Distributed tracing is mandatory.** Every request must carry a trace ID from entry point to all downstream services. Implement OpenTelemetry instrumentation in every service. Export traces to Jaeger or Zipkin. A trace ID must appear in every log line.
- **Structured logging with correlation IDs.** Log in JSON format. Every log entry must include: `trace_id`, `span_id`, `service_name`, `version`, `environment`, and `timestamp` in ISO 8601. Ship to a centralized platform (ELK stack, Grafana Loki, Datadog). Without this, debugging cross-service issues is nearly impossible.
- **Define and publish SLOs per service.** Before a service goes to production, document its Service Level Objectives: availability target (e.g., 99.9%), p50/p95/p99 latency targets, and error rate budget. These become the thresholds for alerting.
- **Implement health check endpoints.** Every service must expose `/health/live` (process is running) and `/health/ready` (service is ready to accept traffic, dependencies are reachable). Kubernetes liveness and readiness probes depend on these.
- **Build a service dependency map** and publish it as a runbook artifact. When Service C goes down, the on-call engineer needs to immediately know which services depend on it and what the fallback behavior is.

### 7. Execute the Migration and Cutover

With patterns chosen and infrastructure in place, execute the migration in structured phases.

- **Phase 1 -- Foundation (weeks 1-4):** Deploy the API gateway/proxy layer in front of the monolith. All traffic still goes to the monolith. This is zero-impact but establishes the routing seam. Deploy centralized logging and tracing. Instrument the monolith to emit OpenTelemetry traces.
- **Phase 2 -- First Service Extraction (weeks 5-10):** Extract the chosen low-risk first service. Write integration tests that prove the new service's behavior matches the monolith's. Run parallel for 1 week with shadow traffic (requests go to both, only monolith response is used). Compare outputs. When divergence rate is 0%, shift 5% of traffic to new service via canary. Increase in steps: 5% -> 25% -> 50% -> 100% over 5 days, monitoring error rates and latency at each step.
- **Phase 3 -- Accelerating Extraction (ongoing):** Each subsequent extraction is faster because the patterns are established. Target one service per 4-6 weeks per team. Maintain a public migration roadmap so stakeholders know what's being worked on.
- **Phase 4 -- Monolith Decommission:** Only when all traffic is routed to microservices and the monolith handles 0 requests for 30 consecutive days should decommission begin. Archive the monolith codebase (do not delete it). Keep the database backups for at least 90 days post-decommission.
- **Track migration health metrics weekly:** percentage of traffic handled by microservices vs. monolith, number of services in production, mean time to deploy per service, cross-service incident rate.

### 8. Validate and Stabilize

Post-extraction validation prevents regressions and confirms the migration is delivering expected benefits.

- **Measure deployment independence.** Can the extracted service be deployed without a monolith release? If yes, the extraction succeeded structurally. If no, there is still a hidden coupling.
- **Run chaos engineering experiments** after each service extraction stabilizes. Use tools like Chaos Monkey or Litmus to inject failures: kill a pod, introduce 500ms latency on a service, drop 10% of network packets. Verify that circuit breakers, retries, and fallbacks behave as designed.
- **Compare operational metrics before and after** for each extracted service: deploy frequency, mean time to recovery (MTTR), change failure rate, and lead time for changes. These are the DORA metrics. A successful microservices extraction should improve at least deploy frequency and MTTR for the extracted domain.
- **Conduct a post-migration architecture review** 30 days after full cutover. Review: are the service boundaries holding up? Have any 2-service co-deployments happened (indicating the boundary was wrong)? Have any new shared database anti-patterns appeared? Adjust boundaries early before technical debt accumulates.

---

## Output Format

When responding to a migration question, structure the output as follows:

```
## Migration Assessment: [System Name]

### Readiness Summary
| Factor                     | Status        | Notes                                      |
|----------------------------|---------------|--------------------------------------------|
| CI/CD pipelines            | ✅ Ready / ❌ Gap | [specific gap or confirmation]          |
| Centralized logging        | ✅ Ready / ❌ Gap | [specific gap or confirmation]          |
| Distributed tracing        | ✅ Ready / ❌ Gap | [specific gap or confirmation]          |
| Container runtime          | ✅ Ready / ❌ Gap | [specific gap or confirmation]          |
| Team size & ownership      | ✅ Ready / ❌ Gap | [specific gap or confirmation]          |
| Test coverage              | ✅ Ready / ❌ Gap | [specific gap or confirmation]          |

**Readiness Verdict:** [Ready to begin / Requires X weeks of foundational work first]

---

### Proposed Service Boundaries

| Service Name         | Owning Team     | Core Entities           | Produces Events              | Consumes Events              | DB Strategy         |
|----------------------|-----------------|-------------------------|------------------------------|------------------------------|---------------------|
| [service-name]       | [team]          | [entity1, entity2]      | [EventName, EventName]       | [EventName, EventName]       | [PostgreSQL schema] |

---

### Migration Pattern Selection

**Recommended Pattern:** [Strangler Fig / Branch by Abstraction / Event Interception / Parallel Run]

**Rationale:** [2-3 sentences explaining why this pattern fits the specific context]

**Alternative considered:** [Pattern name] -- rejected because [specific technical reason]

---

### Phase Plan

| Phase | Duration  | Deliverable                              | Success Criteria                              |
|-------|-----------|------------------------------------------|-----------------------------------------------|
| 1     | [X weeks] | [specific deliverable]                   | [measurable criterion]                        |
| 2     | [X weeks] | [specific deliverable]                   | [measurable criterion]                        |
| 3     | [X weeks] | [specific deliverable]                   | [measurable criterion]                        |

---

### Data Architecture Decisions

For each service split:

**[Service A] <-> [Service B] data relationship:**
- Synchronization strategy: [API composition / event replication / embedded copy]
- Consistency model: [strong / eventual] -- rationale: [reason]
- Shared data risk: [specific table or entity and how it will be handled]

---

### Communication Protocols

| Service Pair              | Protocol        | Pattern                    | Timeout   | Circuit Breaker Threshold |
|---------------------------|-----------------|----------------------------|-----------|---------------------------|
| [ServiceA -> ServiceB]    | REST / gRPC     | Request-response / event   | [Xs]      | [50% / 30s window]        |

---

### Risk Register

| Risk                          | Likelihood | Impact | Mitigation                                      |
|-------------------------------|------------|--------|-------------------------------------------------|
| [specific risk]               | High/Med/Low | High/Med/Low | [concrete mitigation step]             |

---

### Architecture Decision Records (ADRs) Required

- ADR-001: [Decision title] -- [one-line summary of the decision and why]
- ADR-002: [Decision title] -- [one-line summary of the decision and why]
```

---

## Rules

1. **NEVER recommend microservices to a team without operational maturity.** If the team lacks centralized logging, distributed tracing, and automated deployments, microservices will make reliability worse. State this explicitly and recommend building the operational foundation first -- typically 4-8 weeks of work before any extraction begins.

2. **NEVER create service boundaries that require synchronous calls in a chain deeper than 3 hops.** A request chain of ServiceA -> ServiceB -> ServiceC -> ServiceD introduces compounding latency and failure probability. If this pattern appears in the design, the service boundaries are wrong and need to be redrawn before implementation.

3. **NEVER allow two services to share a database schema.** Shared schemas create hidden coupling that defeats the purpose of microservices. When two teams must share data, the correct solution is always an API or an event stream -- never a shared table. This rule has no exceptions during a migration.

4. **ALWAYS start with a low-risk, low-traffic service for the first extraction.** The first service extraction teaches the team the tooling, deployment process, and observability patterns. Choosing a critical service like authentication or payments for the first extraction is a common and dangerous mistake that leads to production incidents.

5. **NEVER implement distributed transactions (2PC).** Two-phase commit is a reliability trap in microservices -- it creates coupling and has catastrophic failure modes when a coordinator goes down. Every multi-service write scenario must use the Saga pattern with compensating transactions instead.

6. **ALWAYS implement consumer-driven contract tests before making any breaking change to a service API.** Schema changes that break consumers are one of the leading causes of microservices production incidents. Run Pact or equivalent contract tests in CI/CD for every service that has consumers.

7. **NEVER let a synchronous service-to-service call be made without a circuit breaker and an explicit timeout.** A hanging downstream service will exhaust thread pools and connection pools upstream within seconds. Every synchronous call must have a timeout (default: 5 seconds) and a circuit breaker with documented fallback behavior.

8. **ALWAYS validate that a service boundary is correct before decommissioning the monolith code path.** The test is simple: have the new service and the monolith process the same input independently and compare outputs (parallel run). Only when divergence is 0% for a statistically meaningful sample (minimum 1,000 requests or 72 hours) should the monolith path be retired.

9. **NEVER migrate more than one service boundary simultaneously in the same team's sprint.** Concurrent extractions create coordination chaos, make incidents harder to diagnose, and result in unclear ownership. One bounded context per team per sprint is the maximum safe rate.

10. **ALWAYS write an Architecture Decision Record (ADR) for every service boundary decision.** ADRs must capture: context (why is this decision being made now), decision (what was chosen), alternatives rejected (and why), and consequences (what becomes easier and what becomes harder). Without ADRs, future engineers will reverse correct decisions because the reasoning is invisible.

---

## Edge Cases

### The Distributed Monolith Anti-Pattern
If a user describes a "microservices" architecture where services cannot be deployed independently (e.g., Service A always needs to be deployed at the same time as Service B), or where services call each other synchronously in deep chains, they have created a distributed monolith. This is worse than the original monolith because it has all the operational complexity of microservices with none of the independence benefits. The fix requires: (1) identifying which services have circular or deep synchronous dependencies, (2) introducing asynchronous event-driven communication to break the coupling, and (3) accepting that some services may need to be merged back together if the domain boundary was wrong. Advise the user directly that their current state is a distributed monolith and that redrawn boundaries are required before they see benefits.

### The Shared Authentication / Session Problem
When extracting services from a monolith that uses server-side sessions (e.g., PHP sessions, Rails sessions stored in cookies/Redis), early service extractions will hit the problem that the new service cannot verify authentication. The correct solution is to migrate to stateless JWT-based authentication or to implement an API gateway that validates tokens before forwarding requests. Stateless JWTs allow each service to independently verify the token with the public key of the identity service -- no inter-service call required at runtime. Warn the user that implementing a centralized identity service as an early step (before other extractions) is often the right sequencing choice.

### The Legacy Database with Implicit Coupling
Many monoliths use a single relational database with implicit coupling -- stored procedures that join across 15 tables, triggers that cascade updates, and views that span domains. Before any service extraction, map all stored procedures and triggers. Stored procedures that span multiple bounded contexts must be migrated to application-layer logic (in the service) before the database can be split. This is often a 4-8 week effort on its own. Use a tool like SchemaSpy to generate the dependency map of the database's foreign keys and views.

### High-Traffic Systems During Migration
For systems handling more than 50K requests per second, traffic shifting during migration must be performed with extreme care. Canary deployments should start at 0.1% (not 5%), and each increment should be held for a minimum of 30 minutes with p99 latency and error rate monitored at 1-minute resolution. Feature flags must be implemented with kill-switch capability -- the ability to shift 100% of traffic back to the monolith within 30 seconds in case of a problem. Never perform cutover steps during peak traffic hours. Schedule them for the lowest-traffic window of the week.

### The Greenfield Service with Legacy Data
When extracting a service, the new service needs to own its data going forward, but historical data lives in the monolith's database. The migration sequence is: (1) write a one-time migration script to copy historical records to the new service's database, (2) deploy the new service in "shadow mode" reading from both stores and comparing results, (3) once verified, update the new service to write to its own database, (4) run the dual-write period for at least 48 hours, (5) stop the monolith from writing to those tables, (6) decommission the monolith's table access. This sequence prevents data loss and allows rollback at any step.

### The Organization That Is Not Conway's Law Aligned
If the team structure doesn't match the desired service boundaries -- for example, a single "backend team" owns all proposed services -- microservices won't deliver independence benefits. Two options: (1) restructure teams to align with service boundaries before migrating (recommended but slow -- 3-6 months of organizational change), or (2) accept a slower migration pace where one team manages multiple services sequentially. Never split a service boundary that no team can own. An unowned service will accumulate incidents and technical debt faster than any monolith.

### Regulatory and Audit Requirements
In regulated industries (PCI-DSS for payments, HIPAA for healthcare, SOC2 for SaaS), service extraction must consider data residency, encryption in transit, access logging, and audit trail requirements. Specifically: (1) All inter-service communication must use mTLS, not just TLS -- each service must have a certificate proving its identity. (2) Any service handling regulated data must log every data access with the identity of the requesting service and the user. (3) Service-to-service communication must be authorized, not just authenticated -- implement a service account model where Service A must be explicitly granted permission to call Service B's sensitive endpoints. Advise the user to engage their compliance team before designing service boundaries for regulated data.

---

## Example

**Input:** "We have a Rails monolith for an e-commerce platform with about 800K daily active users. The codebase is 6 years old with about 350K lines of Ruby. We have a team of 18 engineers split across 4 squads: checkout, catalog, customer, and platform. We deploy once a week because we're scared of breaking things, and checkout is blocked by catalog changes constantly. Our database is a PostgreSQL monolith with about 200 tables. We have basic Datadog APM in place but no distributed tracing. We want to start a microservices migration. What do you recommend?"

---

**Output:**

## Migration Assessment: E-Commerce Rails Platform

### Readiness Summary

| Factor                     | Status        | Notes                                                                 |
|----------------------------|---------------|-----------------------------------------------------------------------|
| CI/CD pipelines            | ✅ Ready        | Assumed present given weekly deploy cadence -- confirm automated tests exist |
| Centralized logging        | ✅ Ready        | Datadog APM in place -- extend to JSON structured logging with trace IDs |
| Distributed tracing        | ❌ Gap          | No distributed tracing -- must be added before first service extraction |
| Container runtime          | ⚠️ Unknown     | Confirm Rails app is containerized (Docker) and runs on Kubernetes or ECS |
| Team size & ownership      | ✅ Ready        | 4 squads map naturally to 4 service domains -- excellent Conway's Law alignment |
| Test coverage              | ⚠️ Unknown     | 350K lines Rails codebase -- confirm >60% unit test coverage before extraction begins |

**Readiness Verdict:** 2-4 weeks of foundational work required before first extraction. Specifically: (1) add OpenTelemetry distributed tracing to the Rails monolith, (2) confirm container runtime, (3) audit test coverage on checkout and catalog modules.

---

### Proposed Service Boundaries

The four squad boundaries map directly to four initial service domains. These should be treated as bounded contexts.

| Service Name         | Owning Team     | Core Entities                        | Produces Events                                      | Consumes Events                               | DB Strategy               |
|----------------------|-----------------|--------------------------------------|------------------------------------------------------|-----------------------------------------------|---------------------------|
| catalog-service      | Catalog squad   | Product, Category, Inventory, Price  | ProductCreated, ProductUpdated, InventoryChanged     | OrderPlaced (to reserve inventory)            | PostgreSQL schema: catalog |
| checkout-service     | Checkout squad  | Cart, Order, OrderLineItem, Coupon   | OrderPlaced, OrderCancelled, PaymentInitiated        | ProductUpdated, InventoryChanged              | PostgreSQL schema: checkout |
| customer-service     | Customer squad  | User, Address, PaymentMethod, Review | CustomerCreated, AddressUpdated                      | OrderPlaced (to update order history)         | PostgreSQL schema: customer |
| notification-service | Platform squad  | Notification, Template, DeliveryLog  | (none)                                               | OrderPlaced, OrderCancelled, CustomerCreated  | PostgreSQL schema: notifications |

**Note:** Payment processing is conspicuously absent from the first-pass boundary list. Payment is a high-risk, high-complexity domain. It should remain in the monolith or be delegated to a third-party service (Stripe, Braintree) through the checkout service -- it should NOT be an early extraction target.

---

### Migration Pattern Selection

**Recommended Pattern:** Strangler Fig via API Gateway routing layer

**Rationale:** The monolith is 6 years old with 350K lines of Ruby -- a big-bang rewrite is not feasible or desirable. The strangler fig pattern allows the four squads to extract their services independently without coordinating on a single large migration. The existing Datadog APM provides a baseline for comparison during traffic shifting.

**Alternative considered:** Branch by Abstraction -- rejected because the Rails codebase likely has significant cross-module dependencies (ActiveRecord associations) that make in-process abstractions difficult to maintain cleanly. The strangler fig at the HTTP layer is cleaner for a Rails app of this age.

**First extraction target:** Notification service -- owned by Platform squad, zero incoming synchronous dependencies from other services, only consumes events, no complex domain logic, and failure does not affect checkout or catalog functionality. This makes it the safest first extraction for the team to learn the operational patterns.

---

### Phase Plan

| Phase | Duration  | Deliverable                                                                        | Success Criteria                                                          |
|-------|-----------|------------------------------------------------------------------------------------|---------------------------------------------------------------------------|
| 1     | 3 weeks   | OpenTelemetry tracing in Rails monolith; API gateway (Nginx or AWS API Gateway) in front of monolith; all traffic still routed to monolith | 100% of requests have trace IDs in Datadog; zero production incidents from gateway introduction |
| 2     | 5 weeks   | Notification service extracted and in production; event bus (Kafka) receiving OrderPlaced and CustomerCreated events | Notification service handles 100% of notification traffic; monolith notification code paths dormant for 30 days |
| 3     | 6 weeks   | Catalog service extracted; checkout reads catalog data via catalog-service API with event-driven cache | Checkout team can deploy without a catalog release; catalog deploys independently 3+ times per sprint |
| 4     | 6 weeks   | Customer service extracted; checkout calls customer-service for address/payment method data | Deploy frequency for all three services: daily or better |
| 5     | 8 weeks   | Checkout service extracted (highest complexity -- last); Saga pattern for order placement across catalog + checkout + customer | Weekly deploy cadence replaced by on-demand per-service deployment; checkout team fully independent |

---

### Data Architecture Decisions

**Catalog <-> Checkout data relationship:**
- Synchronization strategy: Event-driven data replication -- checkout-service maintains a local read-only projection of product names, SKUs, and prices, populated from `ProductUpdated` and `InventoryChanged` Kafka events.
- Consistency model: Eventual -- rationale: a 100-500ms lag in price updates is acceptable for a cart; the final price is always confirmed at order submission time via a synchronous call to catalog-service.
- Shared data risk: The `products` table is currently shared. Checkout stores `product_id` as a foreign key. Post-extraction, checkout stores a denormalized snapshot of product name + price at the time of cart creation. The canonical price lives only in catalog-service.

**Checkout <-> Customer data relationship:**
- Synchronization strategy: API composition -- checkout calls customer-service synchronously to retrieve shipping address and payment method at checkout initiation. This is a low-frequency, low-latency-tolerant call.
- Consistency model: Strong -- rationale: the user's current address must be accurate at the moment they place an order.
- Shared data risk: The `users` table has ~40 columns. Checkout only needs 5 (id, email, name, default_address_id, default_payment_method_id). customer-service will expose a `/customers/{id}/checkout-profile` endpoint returning only these fields, avoiding over-fetching.

**Outbox pattern required for:** checkout-service when publishing `OrderPlaced` events. The order record insert and the outbox event record must be written in the same PostgreSQL transaction. A separate relay process (implemented as a lightweight background job) reads the outbox and publishes to Kafka.

---

### Communication Protocols

| Service Pair                            | Protocol | Pattern             | Timeout | Circuit Breaker Threshold         |
|-----------------------------------------|----------|---------------------|---------|-----------------------------------|
| checkout-service -> catalog-service      | gRPC     | Request-response    | 3s      | 50% failures / 30s window         |
| checkout-service -> customer-service     | gRPC     | Request-response    | 3s      | 50% failures / 30s window         |
| catalog-service -> checkout (inventory)  | Kafka    | Event (async)       | N/A     | Consumer lag alert > 10K messages |
| Any service -> notification-service      | Kafka    | Event (async)       | N/A     | Consumer lag alert > 5K messages  |

**Fallback behavior for checkout -> catalog circuit open:** Serve product data from checkout's local event-driven cache. Log a warning that stale data may be shown. Do not block the cart flow.

**Fallback behavior for checkout -> customer circuit open:** Return a 503 with a user-facing message asking the customer to retry. Do not attempt to serve the checkout without a verified address.

---

### Risk Register

| Risk                                              | Likelihood | Impact | Mitigation                                                                                     |
|---------------------------------------------------|------------|--------|------------------------------------------------------------------------------------------------|
| Stored procedures in PostgreSQL span domains      | High       | High   | Audit all stored procedures in weeks 1-2; migrate cross-domain logic to application code before any DB split |
| Test coverage on catalog module is insufficient   | Medium     | High   | Require 70% unit test coverage on catalog module before Phase 3 begins; Platform squad owns this gate |
| Checkout-catalog coupling deeper than expected    | Medium     | High   | Run ArchUnit or dependency analysis on Rails codebase; map all `has_many through:` and `belongs_to` across the boundary |
| Kafka consumer lag spikes during peak traffic     | Medium     | Medium | Set consumer lag alerting at 10K messages; provision consumers to handle 3x average throughput |
| Engineers unfamiliar with Saga pattern            | High       | High   | Run a 2-day internal workshop on Saga pattern and compensating transactions before Phase 5 begins |
| Monolith database has undocumented triggers       | Medium     | High   | Run `SELECT * FROM information_schema.triggers` audit in week 1; document all triggers before any schema split |

---

### Architecture Decision Records (ADRs) Required

- ADR-001: Service boundary definitions -- documents the four bounded contexts, the team-to-service mapping, and why payment was excluded from Phase 1
- ADR-002: Kafka as the event bus -- documents the choice of Kafka over RabbitMQ, driven by need for durable event replay and fan-out to multiple consumers
- ADR-003: gRPC for synchronous inter-service calls -- documents the choice over REST, driven by internal-only consumers and need for strong schema contracts
- ADR-004: Outbox pattern for OrderPlaced event -- documents why direct Kafka publish from checkout was rejected due to dual-write failure risk
- ADR-005: Notification service as first extraction -- documents the risk-based sequencing rationale and what the team is expected to learn from this first extraction
- ADR-006: Saga pattern for order placement -- documents the rejection of distributed transactions and the compensating transaction design for the inventory-payment-order write sequence
