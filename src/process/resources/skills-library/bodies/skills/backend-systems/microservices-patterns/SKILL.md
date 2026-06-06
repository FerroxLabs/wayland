---
name: microservices-patterns
description: |
  Guides expert-level microservices implementation patterns implementation: microservices and design-patterns decision frameworks, production-ready patterns, and concrete templates for microservices patterns workflows.
  Use when the user asks about microservices implementation patterns, microservices patterns configuration, or microservices best practices for microservices projects.
  Do NOT use when the user needs a different backend infrastructure capability -- check sibling skills in the backend infrastructure subcategory.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "microservices design-patterns frameworks"
  category: "backend-systems"
  subcategory: "backend-infrastructure"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Microservices Patterns

## When to Use

**Use this skill when:**
- A user is designing a new distributed system and needs guidance on decomposing a monolith or greenfield service into independently deployable units
- A user is experiencing specific operational pain points in an existing microservices system -- such as cascading failures, data consistency issues, or tight coupling between services
- A user asks how to handle cross-cutting concerns like authentication, observability, or configuration management across multiple services
- A user needs to choose between competing patterns for a specific problem (e.g., Saga vs. two-phase commit for distributed transactions, API Gateway vs. BFF for client-facing routing)
- A user is preparing for a production deployment and needs to know which reliability and resilience patterns to apply (circuit breakers, bulkheads, retries with backoff)
- A user asks about inter-service communication patterns -- synchronous REST/gRPC vs. asynchronous messaging, event-driven vs. request-response
- A user is building or reviewing a service mesh setup and needs guidance on sidecar proxies, traffic management, or mTLS configuration

**Do NOT use this skill when:**
- The user needs specific Kubernetes deployment YAML, Helm chart configuration, or container orchestration mechanics -- use a Kubernetes/container orchestration skill
- The user is asking about monolith architecture optimization and has not expressed intent to decompose services
- The user needs guidance on message broker internals (Kafka topic partitioning strategies, RabbitMQ exchange types) -- use a dedicated messaging skill
- The user is asking about database schema design, query optimization, or ORM patterns -- use a database design skill
- The user needs API design specifics (REST vs. GraphQL schema design, OpenAPI specification authoring) -- use an API design skill
- The user wants CI/CD pipeline configuration for microservices deployments -- use a DevOps/deployment skill
- The user is asking about frontend architecture (micro-frontends) without a clear connection to backend service decomposition

---

## Process

### 1. Identify the Core Problem Category

Before recommending any pattern, classify the user's problem into one of five categories. The wrong category leads to the wrong pattern family.

- **Decomposition problems** -- "How do I break this up?" Symptoms: monolith becoming undeployable, team coupling, single-responsibility violations. Apply: Domain-Driven Design (DDD) bounded contexts, Strangler Fig pattern, database-per-service decomposition strategy.
- **Communication problems** -- "How do services talk?" Symptoms: tight temporal coupling, slow response times, synchronous chains 3+ services deep. Apply: async messaging, event-driven patterns, choreography vs. orchestration decision.
- **Data consistency problems** -- "How do I keep data correct across services?" Symptoms: split-brain scenarios, eventual consistency bugs, failed multi-service writes. Apply: Saga pattern (choreography or orchestration), CQRS, event sourcing.
- **Resilience problems** -- "How do I prevent failures from cascading?" Symptoms: one slow service brings down the entire system, retry storms, thundering herd. Apply: circuit breaker, bulkhead, rate limiter, retry with exponential backoff and jitter.
- **Cross-cutting concern problems** -- "How do I handle auth/observability/config uniformly?" Symptoms: duplicated middleware, inconsistent logging, per-service auth logic. Apply: API Gateway, sidecar pattern, service mesh, externalized configuration.

Ask the user clarifying questions if the problem category is not immediately clear. Do not proceed to pattern selection until the category is confirmed.

### 2. Map the User's System Context

Establish the architectural parameters that constrain pattern choices. These directly affect which patterns are viable.

- **Team structure and size** -- Conway's Law is real. A team of 3 cannot effectively operate 15 microservices. Typical guidance: no more than 2 microservices per engineer for a sustainable cognitive load. Teams of fewer than 8 should consider whether they actually need microservices at all or would benefit more from a modular monolith.
- **Data topology** -- Determine whether the user has already separated databases per service. If services share a database, many distributed data patterns are blocked until the database is decomposed. Shared-database microservices is an anti-pattern that negates most decomposition benefits.
- **Latency and consistency budget** -- Identify SLA requirements. P99 latency targets below 50ms constrain you to synchronous patterns for the hot path. Eventual consistency windows of seconds to minutes are typically acceptable for inventory or analytics; they are not acceptable for financial transactions.
- **Existing infrastructure** -- Note what message brokers (Kafka, RabbitMQ, SQS), service meshes (Istio, Linkerd), and API gateways (Kong, AWS API Gateway, Envoy) are already in the stack. Pattern recommendations should leverage existing infrastructure rather than introducing new dependencies.
- **Deployment environment** -- Kubernetes-based deployments unlock sidecar and service mesh patterns. Serverless (Lambda, Cloud Functions) constrains stateful patterns and changes cold start considerations for circuit breakers.

### 3. Apply the Pattern Decision Framework

For each problem category identified in Step 1, walk through the specific decision tree:

**For decomposition:**
- Start with bounded context identification using DDD. A bounded context is a boundary within which a particular domain model is consistent and applies. Services should map 1:1 or 1:N to bounded contexts -- never N:1.
- Apply the "two-pizza rule" heuristic (team fits in a room, can be fed with 2 pizzas) as a size check, but prefer business capability alignment over team size.
- Use the Strangler Fig pattern for decomposition from a monolith: route new feature traffic through a new service while the monolith continues to serve existing traffic. Incrementally migrate endpoints. Never attempt a big-bang rewrite.
- The Branch by Abstraction technique works when you cannot use a facade/proxy -- introduce an abstraction layer in the monolith, implement the new service behind the abstraction, then switch the implementation.

**For communication:**
- Synchronous (REST/gRPC) is appropriate when: the caller needs an immediate response, the operation is query-only or idempotent, the chain is 2 services deep or fewer.
- Asynchronous (event-driven) is appropriate when: operations can tolerate eventual consistency, you need to decouple producer and consumer release cycles, fanout to multiple consumers is required.
- Prefer gRPC over REST for internal service-to-service communication when: you control both client and server, you need streaming, you need strict schema enforcement with Protobuf, or you are targeting sub-10ms internal latency.
- The Choreography pattern (each service reacts to events independently) suits long-running processes with no central coordinator needed. The Orchestration pattern (a coordinator service explicitly calls each step) suits workflows where visibility, error handling, and rollback logic are complex. Use orchestration when you need to see the full saga state in one place.

**For data consistency:**
- Two-phase commit (2PC) across microservices is an anti-pattern. It creates distributed locks, reduces availability, and couples services to a transaction coordinator. Reject it unless operating within a single database's XA transaction scope.
- The Saga pattern is the correct replacement. Each service performs a local transaction and emits an event or message. Compensating transactions undo completed steps on failure. Design compensating transactions for every forward step before you implement the forward step.
- CQRS (Command Query Responsibility Segregation) separates the write model from the read model. Apply CQRS when your read patterns are fundamentally different from your write patterns -- for example, complex join-heavy reporting queries against a write model optimized for transactional updates. Do not apply CQRS everywhere -- it adds significant complexity.
- Event sourcing stores state as a sequence of events rather than current state snapshots. Apply event sourcing when you need a full audit trail, temporal queries, or the ability to replay events to rebuild projections. Expect to deal with schema evolution, snapshot strategies (snapshot every N events), and projection rebuilding time.

**For resilience:**
- Circuit breaker thresholds: open the circuit after 5 failures in a 10-second window (configurable by SLA). Use a half-open probe after 30 seconds. Libraries: Resilience4j (JVM), Polly (.NET), go-resiliency (Go), pybreaker (Python).
- Retry with exponential backoff and jitter: base delay 100ms, multiplier 2x, jitter ±25%, max retries 3-5 for synchronous calls, up to 10 for async workers. Never retry non-idempotent operations without an idempotency key.
- Bulkhead pattern: isolate thread pools or connection pools per downstream dependency. If Service A calls both Service B and Service C, failures in Service C should not exhaust Service A's connection pool for Service B. Implement using separate thread pools (Hystrix-style) or semaphore-based limits.
- Timeout values: set aggressive timeouts -- 250ms for cache reads, 1000ms for database reads, 5000ms for external APIs. A missing timeout on any outbound call is a latency time bomb.

**For cross-cutting concerns:**
- The API Gateway pattern provides a single entry point for external clients -- handles auth, rate limiting, SSL termination, and request routing. Do not route internal service-to-service calls through the API Gateway; that creates a bottleneck and a single point of failure.
- The Backend for Frontend (BFF) pattern creates a dedicated gateway per client type (mobile BFF, web BFF, third-party BFF). Apply BFF when client data requirements differ substantially enough that a generic API forces expensive over-fetching or multiple round trips.
- The Sidecar pattern deploys a helper container alongside the primary service container. Use sidecars for: mTLS termination, metrics collection, log shipping, and service discovery registration. Linkerd and Istio implement this as automatically injected proxies.
- Externalized configuration: use a config server (Spring Cloud Config, Consul, AWS Parameter Store) to store environment-specific configuration outside service binaries. Services must start with defaults if the config server is unavailable -- never hard-fail on missing optional config at startup.

### 4. Identify Anti-Patterns to Avoid

Explicitly name and explain anti-patterns that match the user's context. Anti-pattern awareness prevents expensive mistakes.

- **Distributed monolith** -- Services that must be deployed together, share a database, or require synchronized releases. This is the most common microservices failure mode. It delivers the operational complexity of microservices with none of the independence benefits. Cause: decomposing along technical layers (all controllers in one service) instead of business capabilities.
- **Chatty services** -- A single user request triggers 20+ synchronous inter-service calls. Common when decomposition is too fine-grained. Mitigation: aggregate services, use a BFF to batch calls, or denormalize data into service-local caches.
- **Shared libraries as hidden coupling** -- Sharing a library that contains domain models, not just utilities, couples service release cycles. If Service A and Service B both import a shared "User" domain model library, changing that model requires redeploying both. Keep shared libraries to pure utilities (logging, serialization), never domain objects.
- **Saga without compensating transactions** -- Implementing forward saga steps without designing rollback logic. This creates inconsistent system states on failure. Every saga step must have a defined compensating transaction before the saga is production-ready.
- **Ignoring the Fallacies of Distributed Computing** -- The network is not reliable. Latency is not zero. Bandwidth is not infinite. The network is not secure. Topology changes. There is not one administrator. Transport cost is not zero. The network is not homogeneous. Every inter-service call must be written with these assumptions in mind.

### 5. Provide a Concrete Implementation Plan

Translate the selected patterns into a phased implementation sequence.

- **Phase 1 (Week 1-2):** Establish the communication contract. Define the service interface (OpenAPI spec or Protobuf schema) before writing implementation code. Both producer and consumer teams work against the contract independently.
- **Phase 2 (Week 2-4):** Implement core logic with resilience wrappers from day one. Do not add circuit breakers "later" -- add them during initial implementation. Later never comes.
- **Phase 3 (Week 3-5):** Implement observability. Distributed tracing (OpenTelemetry with Jaeger or Zipkin), structured logging with correlation IDs, and metrics dashboards (Prometheus + Grafana) must be in place before a service goes to production. A service you cannot observe in production is not production-ready.
- **Phase 4 (Week 4-6):** Validate data consistency under failure. Use chaos engineering tools (Chaos Monkey, Toxiproxy, Pumba) to inject network partitions and service failures in staging. Verify saga compensating transactions execute correctly. Verify circuit breakers open and close as expected.
- **Phase 5 (Ongoing):** Review service boundaries quarterly. Services that are always deployed together should be merged. Services that are too large (multiple teams working on the same service) should be split.

### 6. Define Observability Requirements

No microservices pattern recommendation is complete without observability specifications. A pattern that cannot be monitored in production is incomplete.

- **The three pillars:** Metrics (aggregated numeric data -- request rate, error rate, latency percentiles), Logs (discrete events with context), Traces (distributed call chains across services). All three are required. Logs alone are insufficient for debugging distributed systems.
- **Correlation IDs:** Every request entering the system must carry a unique correlation ID (UUID v4 or flake ID). Every service must propagate this ID in all downstream calls and include it in every log line. Use the W3C Trace Context standard (`traceparent` header) for propagation to ensure compatibility with OpenTelemetry.
- **RED metrics per service:** Rate (requests per second), Errors (error rate percentage), Duration (latency percentiles P50/P95/P99). These three metrics catch 90% of production issues. Alert on error rate > 1% and P99 latency > 2x the P50 for the same service.
- **Health check endpoints:** Every service must expose `/health/live` (is the process running) and `/health/ready` (is the service ready to accept traffic -- dependencies up, warm cache loaded). Kubernetes uses these for liveness and readiness probes. Return HTTP 200 with `{"status":"UP"}` or 503 with failure details.

### 7. Document Pattern Decisions as ADRs

Every selected pattern must be recorded in an Architecture Decision Record.

- **ADR format:** Title, Status (Proposed/Accepted/Deprecated), Context (what problem existed), Decision (what pattern was chosen and why), Consequences (trade-offs accepted, operational implications).
- Store ADRs in the service repository under `/docs/adr/` numbered sequentially (ADR-001, ADR-002). Include the date and decision author.
- Flag patterns that may need revisiting -- for example, "ADR-004 -- Using choreography-based saga for order processing. Revisit if saga steps exceed 8 to evaluate orchestration." This prevents stale architectural decisions from becoming permanent by default.
- Rejected alternatives must be documented in the ADR. Future team members will re-evaluate the same trade-offs. Documenting why an option was rejected prevents re-litigating settled decisions.

---

## Output Format

```
## Microservices Pattern Recommendation

### Context Summary
- **System:** [service/system name]
- **Problem Category:** [Decomposition / Communication / Data Consistency / Resilience / Cross-Cutting]
- **Team Size:** [N engineers]
- **Scale Target:** [requests/sec or users]
- **Consistency Requirement:** [strong / eventual, acceptable window]
- **Existing Infrastructure:** [message broker, service mesh, API gateway]

---

### Pattern Selection Decision Matrix

| Pattern | Fits Problem? | Complexity | Operational Burden | Recommended? |
|---------|--------------|------------|-------------------|--------------|
| [Pattern 1] | Yes/No | Low/Med/High | Low/Med/High | ✅ / ❌ / ⚠️ |
| [Pattern 2] | Yes/No | Low/Med/High | Low/Med/High | ✅ / ❌ / ⚠️ |
| [Pattern 3] | Yes/No | Low/Med/High | Low/Med/High | ✅ / ❌ / ⚠️ |

**Legend:** ✅ Recommended -- ⚠️ Conditional -- ❌ Not Recommended

---

### Recommended Patterns

#### Primary Pattern: [Pattern Name]
**Problem it solves:** [1-2 sentences]
**Why this over alternatives:** [Specific trade-off reasoning tied to user's context]
**Implementation summary:**
- [Concrete step 1]
- [Concrete step 2]
- [Concrete step 3]

**Configuration parameters:**
```[language]
// Example configuration or pseudocode
```

**Failure modes to handle:**
- [Failure scenario 1] → [Mitigation]
- [Failure scenario 2] → [Mitigation]

---

#### Supporting Pattern: [Pattern Name]
**Problem it solves:** [1-2 sentences]
**Integration with primary pattern:** [How they work together]
**Implementation notes:**
- [Concrete note 1]
- [Concrete note 2]

---

### Anti-Patterns to Avoid in This Context
1. **[Anti-pattern name]** -- [Why it is specifically dangerous for this user's setup]
2. **[Anti-pattern name]** -- [Why it is specifically dangerous for this user's setup]

---

### Observability Checklist
- [ ] Correlation ID propagated on all inter-service calls
- [ ] RED metrics (Rate, Error, Duration) instrumented per service
- [ ] Distributed traces exported to [Jaeger/Zipkin/vendor]
- [ ] `/health/live` and `/health/ready` endpoints exposed
- [ ] Alert thresholds set: error rate > 1%, P99 > [N]ms

---

### ADR Stub

**ADR-[NNN] -- [Pattern Name] for [Use Case]**
- **Status:** Proposed
- **Date:** [YYYY-MM-DD]
- **Context:** [What problem exists]
- **Decision:** [What pattern is chosen]
- **Consequences:** [Trade-offs, operational implications]
- **Alternatives rejected:** [Pattern name] -- [Reason]
```

---

## Rules

1. **NEVER recommend microservices to a team that does not need them.** If the user's team is fewer than 5 engineers or their system handles fewer than 1,000 requests/day, recommend a modular monolith first. The operational overhead of microservices -- distributed tracing, separate deployments, network failure handling -- requires mature DevOps capability to manage.

2. **NEVER recommend shared databases across services.** If a user's services share a database schema or connection pool, call this out as a critical architectural flaw before discussing any other patterns. Shared databases make service-level independent deployments impossible and invalidate most data isolation benefits.

3. **ALWAYS pair the Saga pattern with compensating transactions.** Never describe a saga flow without explicitly defining the rollback/compensation step for every forward action. A saga without compensating transactions is not a pattern -- it is an incomplete implementation waiting to corrupt data.

4. **NEVER recommend 2PC (two-phase commit) across service boundaries.** Two-phase commit requires all participating services to be synchronously available and creates distributed locks. In a distributed system with independent failure domains, 2PC reduces overall availability to the product of each participant's availability. At three 99.9% available services, 2PC reduces availability to 99.7%.

5. **ALWAYS specify timeout values and retry limits when recommending resilience patterns.** A circuit breaker recommendation without specific threshold values (failure count, time window, half-open timeout) gives the user no actionable guidance. Default values must be included even if noted as "adjust based on SLA."

6. **NEVER recommend the Sidecar or Service Mesh pattern without confirming the user is on Kubernetes or an equivalent container orchestration platform.** Sidecar injection, mTLS, and traffic management via Envoy/Linkerd require container orchestration infrastructure. On bare VMs or serverless platforms, these patterns are not applicable.

7. **ALWAYS include observability requirements when describing any pattern.** A pattern description that does not include how to observe it in production is incomplete. Every pattern recommendation must specify the minimum metrics, log fields, and trace spans required to operate it safely.

8. **NEVER recommend choreography-based sagas when the saga involves more than 8 steps.** Beyond 8 steps, debugging choreography sagas (where state is implicit across events) becomes prohibitively difficult. Above this threshold, recommend orchestration-based sagas with an explicit saga coordinator (e.g., Temporal, AWS Step Functions, Conductor).

9. **ALWAYS warn about the Distributed Monolith anti-pattern when discussing decomposition.** Any decomposition strategy recommendation must include explicit guidance on how to verify that the resulting services are actually independently deployable -- by checking for shared databases, shared in-process state, and synchronized deployment pipelines.

10. **NEVER conflate async messaging with eventual consistency guarantees.** Publishing an event to Kafka or RabbitMQ does not guarantee the event is processed -- consumers can fail, queues can fill, dead-letter queues can overflow. Always specify the at-least-once or exactly-once delivery guarantee of the chosen broker and how the consuming service handles duplicate messages (idempotency keys, deduplication windows).

---

## Edge Cases

### Brownfield Decomposition -- Tightly Coupled Database Schema
When a user is extracting services from a monolith that shares a large relational database with foreign keys crossing business domain boundaries:
- Do not attempt to separate the database in the same sprint as extracting the service. Database decomposition and service extraction are two separate work streams.
- Use the Strangler Fig pattern at the application layer first. Route new traffic to the new service while it still reads/writes the shared database via a compatibility layer or views.
- Once the service is stable and independently deployable (even with shared DB), begin the database separation: add a dedicated schema, replicate data via change data capture (CDC with Debezium or similar), dual-write until the old schema is drained, then cut over.
- Expect the database decomposition phase to take 3-6x longer than the service extraction phase. Account for this in project timelines.

### High-Throughput Event Sourcing -- Projection Rebuilding Time
When a user implements event sourcing for a high-volume service (millions of events per aggregate type):
- Projection rebuilding from event stream zero becomes unacceptably slow at scale. Implement snapshot strategies: serialize a full aggregate snapshot every 100-500 events (tune based on aggregate size and write frequency).
- Store snapshots in a separate table or document store alongside the event log. On rehydration, load the most recent snapshot then replay only events after the snapshot sequence number.
- Partition event streams by aggregate ID to enable parallel projection rebuilding. A single-threaded rebuild of 100 million events at 10k events/second takes 2.7 hours; 10 parallel workers reduce this to 16 minutes.
- Test projection rebuild time explicitly before going to production. The rebuild window defines your recovery time objective (RTO) for projection failures.

### Circuit Breaker in a Serverless Environment
When a user wants circuit breakers but is running on AWS Lambda, Google Cloud Functions, or Azure Functions:
- Traditional circuit breakers (Resilience4j, Polly) maintain state in process memory. Serverless functions are stateless and ephemeral -- circuit breaker state resets on every cold start, making process-local circuit breakers ineffective.
- Move circuit breaker state to a shared external store: Redis with a TTL-based counter is the standard approach. Key pattern: `cb:{service_name}:{window_bucket}:failures` with a 10-second TTL window.
- Alternatively, implement circuit breaking at the API Gateway layer (AWS API Gateway with Lambda authorizers, or a dedicated proxy). This centralizes state and removes the in-process state problem entirely.
- Accept that serverless circuit breakers will have a brief "amnesia" window on the first invocation after the failure window expires -- this is the half-open equivalent and is acceptable behavior.

### Multi-Region Deployment and the Saga Pattern
When a user is running sagas across multiple geographic regions:
- Sagas that span regions introduce variable latency in compensation execution. A saga started in us-east-1 may require compensating a step in eu-west-1. Compensation latency can be 100-200ms higher than forward latency.
- Design sagas to prefer region-local steps. Only cross-region steps when truly necessary (e.g., global inventory check). Accept that cross-region saga completion time P99 will be 3-5x higher than single-region.
- For financial sagas, consider whether an asynchronous compensation model is acceptable or whether the saga must complete atomically within a region. If atomically: constrain saga execution to a single region and replicate the result asynchronously.
- Use idempotency keys with globally unique IDs (ULID or UUID v7) to prevent duplicate compensation execution when cross-region retries occur.

### Versioning Breaking Changes in Event-Driven Systems
When a user needs to evolve the schema of domain events that multiple consumers depend on:
- Events in a distributed system are a public API. Treat them with the same versioning discipline as REST APIs. Never make breaking changes to an event schema in place.
- Use a schema registry (Confluent Schema Registry for Kafka, AWS Glue Schema Registry) with compatibility enforcement set to BACKWARD_COMPATIBLE or FULL mode. This blocks publishing incompatible schemas.
- For major breaking changes, use versioned event types: `OrderPlaced_v1`, `OrderPlaced_v2`. Keep publishing `v1` events until all consumers have migrated to `v2`. Maintain both versions for a defined sunset window (minimum 2 sprint cycles, ideally 30 days).
- The Upcaster pattern transforms old event versions to new versions at consumption time, allowing the consumer to work with a single latest schema internally while accepting multiple published versions.

### Service Mesh Adoption in a Mixed-Technology Environment
When a user is adopting Istio or Linkerd in a fleet where not all services are containerized:
- Service mesh sidecar injection only works for container-based workloads. Legacy services on bare VMs or non-containerized platforms cannot participate directly.
- Use an egress gateway to proxy traffic from mesh services to non-mesh services. This provides observability and mTLS termination at the mesh boundary without requiring the legacy service to be refactored.
- Expect a 2-5ms latency overhead per hop from the Envoy sidecar proxy. For chains of 5 services, this adds 10-25ms end-to-end. Validate this against latency SLAs before adopting a service mesh.
- Adopt the service mesh incrementally: enable observability features (metrics, tracing) first with permissive mTLS mode. Move to strict mTLS mode only after all services in a namespace are enrolled. Mixed permissive/strict modes are a common source of intermittent connection errors.

### Idempotency in At-Least-Once Messaging Systems
When a user is processing messages from Kafka, SQS, or RabbitMQ (all of which guarantee at-least-once delivery):
- Every message consumer must be idempotent. "At-least-once" means duplicates will occur under normal failure scenarios -- consumer restarts, network partitions, rebalancing.
- Implement idempotency at the consumer level using an idempotency store: a Redis set or database table storing processed message IDs with a TTL equal to the message retention period plus a safety margin (e.g., 7 days for a 3-day retention topic).
- The idempotency check must be atomic with the business action. Use database transactions: insert the idempotency key and perform the business write in the same transaction. If the idempotency key insert fails (duplicate key violation), skip the business action and acknowledge the message.
- For Kafka specifically, exactly-once semantics (EOS) are available using the transactional producer API with `isolation.level=read_committed` on consumers. EOS has a ~5-10% throughput overhead compared to at-least-once and requires Kafka 0.11+. Use EOS only when the idempotency store approach is not feasible.

---

## Example

**Input:**
"We have a monolithic Node.js e-commerce application. Order processing, inventory management, and payment are all in one codebase. We're a team of 10 engineers. We're experiencing deployment bottlenecks -- any change to payment code requires a full regression test and redeploy of the entire app. We deploy to AWS and already use SQS and PostgreSQL. We want to break this apart but we are worried about keeping orders, inventory, and payments consistent when things go wrong."

---

**Output:**

## Microservices Pattern Recommendation

### Context Summary
- **System:** E-commerce monolith (Order, Inventory, Payment domains)
- **Problem Category:** Decomposition + Data Consistency (primary), Resilience (secondary)
- **Team Size:** 10 engineers
- **Scale Target:** Not specified -- assume mid-scale e-commerce (100-1,000 orders/hour)
- **Consistency Requirement:** Strong for payment capture, eventual acceptable for inventory reservation (window: seconds)
- **Existing Infrastructure:** AWS SQS (async messaging), PostgreSQL (shared), AWS deployment

---

### Pattern Selection Decision Matrix

| Pattern | Fits Problem? | Complexity | Operational Burden | Recommended? |
|---------|--------------|------------|-------------------|--------------|
| Strangler Fig (decomposition) | Yes | Medium | Low | ✅ |
| Choreography-based Saga | Yes | Medium | Medium | ✅ |
| Orchestration-based Saga | Yes | Medium-High | Medium | ⚠️ Evaluate if steps grow |
| Two-Phase Commit | No -- reduces availability | High | High | ❌ |
| Big-Bang Rewrite | No -- high risk | Very High | Very High | ❌ |
| Database-per-Service | Yes (phase 2) | High | Medium | ✅ Phase 2 only |
| Circuit Breaker (Resilience pattern) | Yes | Low | Low | ✅ |
| BFF (API Gateway variant) | No -- internal concern | Medium | Medium | ❌ Not needed yet |

**Legend:** ✅ Recommended -- ⚠️ Conditional -- ❌ Not Recommended

---

### Recommended Patterns

#### Primary Pattern: Strangler Fig for Phased Decomposition

**Problem it solves:** Enables extracting Payment, Inventory, and Order services from the monolith incrementally without a risky big-bang rewrite. New services go live alongside the monolith, which continues to handle un-migrated flows.

**Why this over alternatives:** A big-bang rewrite with a team of 10 on a production e-commerce system is high-risk and typically takes 2-3x longer than estimated. The Strangler Fig allows you to ship value continuously during the migration and roll back individual service extractions if problems arise.

**Implementation summary:**
- Step 1: Add an HTTP routing layer (AWS API Gateway or a lightweight Express proxy) in front of the monolith. This proxy routes all requests to the monolith initially -- zero behavior change.
- Step 2: Extract the Payment service first. Payment has the clearest boundary, the most painful deployment friction, and the highest business value for independent deployment. Create a new Node.js service with its own repository and deployment pipeline.
- Step 3: Update the routing layer to send `POST /payments/*` and `GET /payments/*` to the new Payment service. All other routes continue to hit the monolith.
- Step 4: The Payment service initially reads/writes the shared PostgreSQL database. Do not separate the database yet. Get the service independently deployable first.
- Step 5: Repeat for Inventory, then for Order service. Each extraction follows the same pattern: new service, route update, shared DB temporarily.
- Step 6: After all three services are extracted and stable, begin database decomposition (see Edge Cases section for CDC-based approach).

**Configuration parameters (routing proxy):**
```javascript
// Express-based routing proxy configuration
const routingRules = [
  { prefix: '/payments', target: process.env.PAYMENT_SERVICE_URL },
  { prefix: '/inventory', target: process.env.INVENTORY_SERVICE_URL },
  { prefix: '/orders', target: process.env.ORDER_SERVICE_URL },
  { prefix: '/', target: process.env.MONOLITH_URL }  // catch-all fallback
];

// Each rule evaluated in order -- first match wins
// Monolith remains the default until all routes are migrated
```

**Failure modes to handle:**
- Payment service is down → Route `/payments` back to monolith via circuit breaker. Flag in proxy: if Payment service circuit is open, fall back to monolith URL. Monitor fallback rate as a service health signal.
- Database schema conflict during transition → Treat shared DB tables as a contract. Document which tables each service owns. Enforce via code review -- no service modifies tables owned by another service during the transition phase.

---

#### Primary Pattern: Choreography-based Saga for Order -- Inventory -- Payment Consistency

**Problem it solves:** Maintains data consistency across Order, Inventory, and Payment services when processing an order -- without distributed transactions or shared database locks.

**Why this over alternatives:** Your team already has SQS, which is an ideal choreography bus for this use case. The order processing saga has 5 or fewer steps (within the 8-step choreography threshold), making choreography debuggable. Two-phase commit is rejected because it reduces system availability to the product of each service's availability: three 99.9% services = 99.7% overall under 2PC.

**Saga flow design:**

```
1. Order Service: Create order record, status = PENDING
   → Publish: OrderCreated {orderId, items[], customerId, totalAmount}

2. Inventory Service: Receives OrderCreated
   → Reserve stock for each line item
   → On success: Publish InventoryReserved {orderId, reservationId}
   → On failure (out of stock): Publish InventoryReservationFailed {orderId, reason}

3. Payment Service: Receives InventoryReserved
   → Charge customer payment method
   → On success: Publish PaymentCaptured {orderId, paymentId, amount}
   → On failure: Publish PaymentFailed {orderId, reason}

4. Order Service: Receives PaymentCaptured
   → Update order status = CONFIRMED
   → Publish OrderConfirmed {orderId}

5. [Notification Service, Fulfillment Service react to OrderConfirmed independently]

COMPENSATING TRANSACTIONS (mandatory):
- If PaymentFailed → Inventory Service subscribes, releases reservation
  Publish InventoryReleased {orderId, reservationId}
- If InventoryReservationFailed → Order Service subscribes, updates status = FAILED
- Order Service always has a terminal state: CONFIRMED or FAILED -- never stuck in PENDING
```

**SQS Queue Configuration:**
```
Queues required:
- order-events (OrderCreated, OrderConfirmed)
- inventory-events (InventoryReserved, InventoryReservationFailed, InventoryReleased)
- payment-events (PaymentCaptured, PaymentFailed)

Each queue:
- Visibility timeout: 30 seconds (must exceed max consumer processing time)
- Dead-letter queue: order-events-dlq, inventory-events-dlq, payment-events-dlq
- DLQ maxReceiveCount: 3 (move to DLQ after 3 failed processing attempts)
- Message retention: 4 days (default SQS; increase to 14 days for audit)

Message format (all events):
{
  "eventType": "OrderCreated",
  "eventVersion": "1",
  "eventId": "01ARZ3NDEKTSV4RRFFQ69G5FAV",  // ULID for ordering + uniqueness
  "correlationId": "...",  // propagated from original HTTP request
  "occurredAt": "2024-03-15T14:22:00.000Z",
  "payload": { ... }
}
```

**Idempotency implementation (Node.js consumer):**
```javascript
async function processInventoryReserved(message) {
  const { eventId } = message;
  
  // Atomic idempotency check + business action in one transaction
  await db.transaction(async (trx) => {
    // Will throw unique constraint violation if already processed
    await trx('processed_events').insert({
      event_id: eventId,
      processed_at: new Date(),
      consumer: 'payment-service'
    });
    
    // Business logic only executes if insert succeeded
    await chargePaymentMethod(message.payload);
  });
}
```

**Failure modes to handle:**
- Inventory Service crashes mid-reservation → SQS visibility timeout expires (30s), message redelivered. Idempotency key prevents double-reservation. Ensure `reserveStock()` is idempotent: check if reservationId already exists before inserting.
- Payment Service charge succeeds but publishing `PaymentCaptured` fails → Implement the Outbox Pattern: write `PaymentCaptured` event to a `payment_outbox` table in the same transaction as recording the payment. A separate poller reads the outbox and publishes to SQS, then marks the row as published. This guarantees at-least-once publishing with exactly-once database writes.
- Saga stuck in PENDING (no terminal event received) → Implement a saga timeout job: query for orders in PENDING status older than 15 minutes, publish a synthetic `OrderTimeoutOccurred` event, trigger full compensation.

---

#### Supporting Pattern: Circuit Breaker for Payment Provider Calls

**Problem it solves:** Prevents the Payment service from hanging indefinitely when the upstream payment gateway is slow or failing, which would cause SQS message consumers to block and eventually exhaust the processing pool.

**Integration with primary pattern:** The Payment service consumer processes `InventoryReserved` messages and calls the payment gateway. Without a circuit breaker, a payment gateway outage causes all Inventory Reserved messages to time out, the SQS visibility timeout expires repeatedly, and messages eventually land in the DLQ -- requiring manual intervention.

**Implementation notes (using `opossum` circuit breaker for Node.js):**
```javascript
const CircuitBreaker = require('opossum');

const paymentGatewayOptions = {
  timeout: 5000,           // 5s timeout -- reject if gateway doesn't respond
  errorThresholdPercentage: 50,  // Open if 50% of calls fail in rolling window
  rollingCountTimeout: 10000,    // 10-second rolling window
  resetTimeout: 30000      // Try half-open probe after 30 seconds
};

const breaker = new CircuitBreaker(callPaymentGateway, paymentGatewayOptions);

breaker.fallback(() => {
  // When circuit is open, publish PaymentFailed immediately
  // rather than waiting for timeout on every message
  return { success: false, reason: 'PAYMENT_GATEWAY_UNAVAILABLE' };
});

breaker.on('open', () => {
  metrics.increment('circuit_breaker.payment_gateway.open');
  logger.error('Payment gateway circuit breaker opened');
});
```

---

### Anti-Patterns to Avoid in This Context

1. **Distributed Monolith** -- If the extracted Payment service can only be deployed when the Order service is also deployed (e.g., because they share a database migration script or a shared library with domain objects), you have created a distributed monolith. Verify independence by having a team member deploy the Payment service to staging without touching Order or Inventory. If it fails, the boundary is not clean.

2. **Saga Without Compensating Transactions** -- Do not go live with the inventory reservation or payment capture saga steps until the compensating transactions (`releaseInventoryReservation`, triggered by `PaymentFailed`) are implemented, tested under SQS message failure injection, and confirmed to reach a terminal order state. An order stuck in PENDING indefinitely will cause customer service escalations and revenue leakage.

3. **Shared Domain Model Library** -- Do not create an NPM package called `@ecommerce/models` that exports `Order`, `Payment`, and `Inventory` TypeScript interfaces and share it across all three services. When the `Order` model needs a new field, you will be forced to coordinate releases across all three services. Each service owns its own internal model. Cross-service data is represented by event payload schemas, not shared classes.

---

### Observability Checklist
- [ ] Correlation ID (`X-Correlation-ID` header) extracted from HTTP requests and injected into all SQS messages as `correlationId` field
- [ ] All SQS message consumers log: `eventId`, `correlationId`, `eventType`, `processingDuration`, `outcome` (success/failure/skipped-duplicate)
- [ ] RED metrics instrumented per service: order creation rate, payment success/failure rate, inventory reservation failure rate
- [ ] Saga completion time tracked: time from `OrderCreated` to `OrderConfirmed` or `OrderFailed` -- alert if P99 exceeds 30 seconds
- [ ] Dead-letter queue depth monitored -- alert if any DLQ depth > 0 (messages in DLQ require human intervention)
- [ ] Circuit breaker state transitions logged and alerted: `circuit_breaker.payment_gateway.open` triggers PagerDuty
- [ ] `/health/live` and `/health/ready` on all three services. `/health/ready` for Payment service verifies: DB connection, SQS queue accessibility, payment gateway reachability

---

### ADR Stub

**ADR-001 -- Choreography-based Saga for Order Processing Consistency**
- **Status:** Proposed
- **Date:** [YYYY-MM-DD]
- **Context:** Order processing spans three independently deployed services (Order, Inventory, Payment). Data must remain consistent when any step fails. Shared database transactions across services are not feasible after database decomposition.
- **Decision:** Implement choreography-based saga using SQS as the event bus. Each service reacts to domain events and publishes the outcome. Compensating transactions are defined for every forward step.
- **Consequences:** System achieves eventual consistency with no distributed locks. Saga debugging requires tracing correlation IDs across three service logs. Requires DLQ monitoring and timeout job for stuck sagas. Team must maintain idempotency logic in all consumers.
- **Alternatives rejected:** Two-Phase Commit -- reduces availability to product of three services' uptime, creates distributed locks, couples services to transaction coordinator. Orchestration-based Saga -- adds complexity of a saga coordinator service; revisit if saga steps grow beyond 8 or debugging choreography becomes unmanageable.
