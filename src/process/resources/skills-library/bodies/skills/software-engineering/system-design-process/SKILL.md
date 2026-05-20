---
name: system-design-process
description: |
  Guides expert-level system design process implementation: best-practices and design-patterns decision frameworks, production-ready patterns, and concrete templates for system design process workflows.
  Use when the user asks about system design process, system design process configuration, or architecture best practices for system projects.
  Do NOT use when the user needs a different architecture design capability -- check sibling skills in the architecture design subcategory.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "architecture best-practices design-patterns"
  category: "software-engineering"
  subcategory: "architecture-design"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# System Design Process

## When to Use

**Use this skill when:**
- A user is starting a greenfield system and needs to work through requirements, capacity estimates, component selection, and data modeling before writing code
- A user is preparing for a system design interview and needs a structured, repeatable process to walk through a complex distributed system problem in 45--60 minutes
- A user needs to design a specific subsystem -- an API gateway, a notification pipeline, a search index, a rate limiter -- with concrete trade-off analysis and component selection
- A user is evaluating an existing architecture for scalability bottlenecks, single points of failure, or reliability gaps and wants a systematic audit framework
- A user needs to produce an Architecture Decision Record (ADR), a design document, or an RFC that explains the rationale behind a system architecture for team review
- A user is choosing between architectural styles (monolith vs. microservices, event-driven vs. request/response, SQL vs. NoSQL) and needs a structured trade-off framework tied to their specific constraints
- A user is designing for a specific non-functional requirement -- 99.99% availability, sub-100ms p99 latency, 10 million daily active users, PCI-DSS compliance -- and needs to know which patterns apply

**Do NOT use this skill when:**
- The user needs help implementing a specific algorithm or data structure -- use a coding or data structures skill instead
- The user is asking about infrastructure-as-code configuration (Terraform, Kubernetes manifests) -- use the infrastructure-design skill
- The user wants to evaluate or select a specific database technology in isolation -- use the database-selection skill
- The user is designing an API contract (REST, GraphQL, gRPC schema) without the broader system context -- use the API design skill
- The user has already made all architectural decisions and only needs implementation guidance -- use the relevant implementation skill
- The user is asking about software development process (agile, sprint planning, retrospectives) -- that is project management, not system design

---

## Process

### 1. Clarify Requirements and Establish Scope (5--10 minutes in an interview; 1--3 days in production)

- Extract **functional requirements**: What does the system do? Identify the 3--5 core use cases. For a URL shortener these are: shorten a URL, redirect to the original URL, track click analytics. Do not let scope creep include every possible feature.
- Extract **non-functional requirements (NFRs)**: Latency targets (p50, p95, p99), availability SLA (99.9% = 8.7 hours/year downtime, 99.99% = 52 minutes/year), consistency model (strong vs. eventual), durability guarantees, and compliance requirements (GDPR, HIPAA, PCI-DSS).
- Identify **explicit constraints**: Budget (on-premises vs. cloud, instance costs), team size (a 4-person team cannot maintain 20 microservices), technology stack mandates, and existing infrastructure that must be integrated.
- Define **system boundaries**: What is in scope for this design? What external services are treated as black boxes (payment processors, third-party auth providers, CDN providers)?
- Confirm **read/write ratio**: Most systems are read-heavy (social feeds: 100:1), some are write-heavy (logging pipelines: 1:100), and the ratio fundamentally drives caching strategy, replication topology, and database selection.
- Explicitly state what you are **NOT designing**: for a ride-sharing system, you might exclude the payment flow, driver onboarding, and fraud detection. Scoping exclusions prevents 60-minute overruns.

### 2. Estimate Scale and Capacity (back-of-envelope calculations)

- Calculate **daily active users (DAU)** and derive **requests per second (RPS)**: DAU × average requests per user per day ÷ 86,400 seconds. For 50M DAU with 10 requests/user/day: (50M × 10) ÷ 86,400 ≈ 5,800 RPS average. Apply a 2--3x peak multiplier for traffic spikes → ~15,000 peak RPS.
- Estimate **storage requirements**: (new records per day) × (average record size in bytes) × (retention period in days). For a Twitter-like system with 500M tweets/day at 300 bytes each over 5 years: 500M × 300 × 1,825 = ~275 TB raw. Add 20--30% overhead for indexes.
- Estimate **bandwidth**: peak RPS × average response size. At 15,000 RPS with 10KB average responses = 150 MB/s = 1.2 Gbps outbound. This determines CDN requirements and network costs.
- Calculate **memory for caching**: identify the hot dataset. Applying the 80/20 rule, 20% of content serves 80% of traffic. For 275 TB of content, the hot dataset is ~55 TB -- too large for a single Redis node (max ~512 GB practical), so you need Redis Cluster with many shards or a tiered cache.
- Derive **server count**: at ~10,000 RPS per application server (assuming lightweight stateless handlers), 15,000 peak RPS needs a minimum of 2 servers with headroom. Add at least 50% spare capacity: 3 servers minimum, deploy 5 for redundancy and rolling updates.
- Write these numbers down explicitly. They anchor every subsequent decision and prevent hand-waving.

### 3. Define the High-Level Architecture

- Start with the **three-tier canonical starting point**: load balancer → stateless application tier → persistent storage tier. Every deviation from this baseline requires explicit justification.
- Choose the **architectural style** using this decision tree:
  - Single team, <50K RPS, bounded domain, early stage → **Modular monolith** (deploy as one unit, organize as modules internally, extract services only when pain is real and measured)
  - Multiple teams, independent deployment needed, clearly bounded subdomains, >50K RPS in specific domains → **Microservices** (accept the operational overhead: service mesh, distributed tracing, polyglot persistence)
  - Audit requirements, complex business workflows, temporal queries → **Event sourcing + CQRS** (accept append-only event log with separate read models; use Kafka or EventStoreDB as the event log)
  - High fan-out notifications, async processing, decoupled producers/consumers → **Event-driven with a message broker** (Kafka for high-throughput durable streams, RabbitMQ for complex routing, SQS for simple managed queuing)
- Draw the **component diagram** with explicit data flow arrows. Every arrow represents a network call with latency, failure modes, and retry logic.
- Identify and call out **stateful vs. stateless components**: stateless components scale horizontally with zero coordination; stateful components (databases, caches, queues) require coordination and are where complexity lives.

### 4. Design the Data Model and Storage Layer

- Select **primary storage** for each data entity:
  - Transactional data with complex relationships and ACID requirements → PostgreSQL (mature, feature-rich, handles 10K--50K writes/sec on a single node with proper indexing)
  - Wide-column, time-series, high write throughput (>100K writes/sec), geographically distributed → Apache Cassandra (tunable consistency, linear write scalability, no joins)
  - Flexible schema, document-oriented, rapid iteration → MongoDB (BSON documents, aggregation pipeline, atlas search)
  - Full-text search, faceted navigation, complex scoring → Elasticsearch (inverted index, relevance scoring, near-real-time indexing)
  - Graph relationships (social networks, recommendation graphs, fraud detection) → Neo4j or AWS Neptune
  - Blob storage for media/files → S3-compatible object storage (local MinIO, cloud S3/GCS/Azure Blob)
- Define the **primary key strategy** for each entity. Poor key choices cause hotspots. In Cassandra, a partition key of `user_id` concentrates all writes for a celebrity account on one node -- add a bucket suffix (`user_id + time_bucket`) to spread the load.
- Design **indexes deliberately**: every secondary index has a write amplification cost. For PostgreSQL, a table with 5 indexes has ~5x write cost. Index only fields that appear in WHERE clauses with high cardinality. Use partial indexes for filtered queries (e.g., `WHERE status = 'pending'`).
- Plan the **data access patterns** before schema: in NoSQL systems (Cassandra, DynamoDB), schema is derived from queries, not from a normalized entity model. List every query the system needs to serve, then design tables to serve those queries efficiently.
- Address **data lifecycle**: hot data (last 7 days, serves 95% of queries) → primary database; warm data (7--90 days) → compressed archival storage or separate slower database tier; cold data (>90 days) → S3 Glacier or equivalent with queryable metadata index.

### 5. Design Critical Components and APIs

- Design the **API layer**: define the primary endpoints (REST, GraphQL, or gRPC) with request/response shapes. For REST: specify the HTTP method, path, required headers (authentication), request body schema, success response (2xx), and error responses (4xx, 5xx). For gRPC: define the proto service and message types.
- Design the **authentication and authorization flow**: never design a system without addressing auth. For public APIs: OAuth 2.0 with JWT bearer tokens (stateless, scalable) or API keys with HMAC signing. For internal services: mTLS with service identities (SPIFFE/SPIRE in a service mesh) or short-lived JWT service tokens.
- Design the **caching strategy** as a multi-layer hierarchy:
  - L1: In-process cache (local HashMap or Guava Cache) for extremely hot, rarely changing data (config, feature flags) -- zero network latency, invalidation is hard
  - L2: Distributed cache (Redis Cluster) for shared session state, hot user profiles, computed aggregations -- sub-millisecond latency, TTL-based expiry
  - L3: CDN edge cache for static assets and cacheable API responses -- nearest edge node delivery, Cache-Control headers drive behavior
  - Cache-aside pattern: application checks cache, on miss fetches from DB and populates cache. Write-through: write to cache and DB atomically (slower writes, always-fresh cache). Write-behind: write to cache, async flush to DB (fast writes, risk of data loss on cache failure).
- Design the **rate limiting layer**: implement token bucket (allows bursts up to bucket size) or sliding window log (precise but memory-intensive). Per-user limits (100 req/min), per-IP limits (1,000 req/min), and global limits (1M req/min) are independent axes. Store counters in Redis with atomic INCR + TTL. For distributed rate limiting without Redis, use a gossip protocol for approximate counting.
- For asynchronous workflows, design the **task queue**: Kafka topic per task type with consumer groups, dead-letter queue (DLQ) for poison messages (after 3 retries, route to DLQ with full message context for debugging), idempotency keys on all task handlers to handle redelivery safely.

### 6. Address Reliability, Availability, and Fault Tolerance

- Calculate the **composite availability** of the system: if each component has 99.9% availability and they are in series, overall availability = 0.999^n. Three components in series = 0.999^3 = 99.7%. This is why redundancy (parallel paths) is essential for high-SLA systems.
- Design for **failure at every layer**:
  - Application tier: horizontal redundancy with health checks. Load balancer removes unhealthy instances within 2--3 health check intervals (typically 10--30 seconds).
  - Database: primary-replica replication for reads (1 primary, 2+ replicas). Automatic failover (Patroni for PostgreSQL, Orchestrator for MySQL) with a target RTO of <30 seconds.
  - Cache: Redis Sentinel (3+ sentinels) for single master failover, or Redis Cluster (6+ nodes: 3 masters, 3 replicas) for both HA and horizontal scaling.
  - Message broker: Kafka with replication factor 3, min.insync.replicas=2 so writes succeed when 2/3 replicas acknowledge.
- Define **circuit breaker thresholds**: open the circuit (stop sending requests to a dependency) when the error rate exceeds 50% over a 10-second window with at least 20 requests sampled. Use half-open state to probe recovery. Libraries: Resilience4j (Java/Kotlin), Polly (.NET), Hystrix (legacy Java).
- Define **timeout and retry budgets**: set aggressive timeouts (p99 latency of the dependency + 20% buffer). Use exponential backoff with jitter: base_delay × 2^attempt + random(0, base_delay). Cap retries at 3 attempts for synchronous calls, unlimited with DLQ for async. Budget the total retry time so it does not exceed the caller's own timeout.
- Plan **graceful degradation**: identify which features can be disabled under load (show cached/stale profile data instead of live, disable personalization and serve generic rankings, skip analytics writes under backpressure). Design explicit fallback behaviors before you need them.
- Address **data consistency**: in a distributed system you cannot have both strong consistency and high availability simultaneously (CAP theorem, Brewer 2000). Choose: CP (consistent under partition, may be unavailable -- ZooKeeper, HBase) or AP (available under partition, may be stale -- Cassandra, DynamoDB). Most user-facing systems tolerate eventual consistency for reads but require strong consistency for financial transactions.

### 7. Address Scalability and Performance Bottlenecks

- Identify **bottlenecks** by annotating the data flow diagram with RPS and data volume at each component boundary. The component receiving the highest load with the least horizontal scalability is the primary bottleneck.
- Horizontal scaling strategies:
  - Stateless application servers: add instances behind a load balancer. Use consistent hashing in the load balancer for sticky sessions if needed.
  - Database read scaling: add read replicas, direct all SELECT queries to replicas, reserve primary for writes only.
  - Database write scaling: vertical scaling first (larger instance -- often cheaper than sharding). When writes exceed single-node capacity, shard by a natural partition key (user_id, tenant_id, geographic region). Use range-based sharding (predictable but can hotspot) or hash-based sharding (uniform distribution but range queries span shards).
  - Queue scaling: Kafka scales horizontally by adding partitions (consumers scale linearly with partition count, up to the partition count). Target <1 second consumer lag under normal load; alerting at 10 seconds lag.
- Optimize the **critical path latency**: for a <100ms p99 target, budget each hop. A typical synchronous path: CDN edge (5ms) → load balancer (1ms) → application server (10ms processing) → cache lookup (1ms on hit) → database query (5--20ms on indexed read) → response serialization (2ms). Total: ~44ms. This leaves headroom for retries and variable network conditions.
- Address **fan-out problems**: a social media post from a user with 10 million followers cannot write to 10 million inboxes synchronously. Use a hybrid: pre-compute feeds for users with <10,000 followers (push model), fetch and merge at read time for celebrities (pull model). This is Facebook's "celebrity problem" solution.
- Design **pre-computation and materialized views**: for complex aggregate queries (leaderboards, dashboards, analytics), compute the result offline (batch job or stream processing) and store the result. Serve the pre-computed result directly rather than running expensive queries at request time. Update on a schedule (every 5 minutes for leaderboards) or on event triggers.

### 8. Define Observability, Deployment, and Operational Concerns

- Define the **three pillars of observability**:
  - Metrics: instrument every service with the four golden signals -- latency (p50, p95, p99), traffic (RPS), errors (error rate %), saturation (CPU %, memory %, queue depth). Use Prometheus + Grafana or a managed equivalent.
  - Logs: structured JSON logs with a correlation ID (trace ID) on every log line. Every request generates a trace ID at the entry point (load balancer or API gateway) and propagates it through all downstream calls via headers (X-Request-ID or W3C TraceContext).
  - Traces: distributed tracing (OpenTelemetry instrumentation → Jaeger or Zipkin backend) shows the full call graph of a request across services. Essential for diagnosing latency in microservices architectures.
- Define **SLOs and error budgets**: SLO = the target reliability level (99.9% availability). Error budget = 1 - SLO = 0.1% of requests allowed to fail per month. When the error budget is exhausted, freeze feature deployments until reliability is restored. Track SLO burn rate: burning >2% of monthly budget in an hour triggers a page.
- Plan the **deployment strategy**:
  - Blue/green: two identical production environments. Shift traffic instantly by updating the load balancer. Zero-downtime, instant rollback, but doubles infrastructure cost during the cutover window.
  - Canary: route 1--5% of traffic to the new version. Monitor error rates and latency for 30--60 minutes. Gradually increase percentage (5% → 25% → 50% → 100%) or rollback immediately if metrics degrade.
  - Feature flags: decouple code deployment from feature activation. Deploy dark (code in production, flag off), enable for internal users, then progressively roll out. LaunchDarkly, Unleash, or Flagsmith for flag management.
- Define the **data migration strategy**: never modify a live schema without a multi-phase migration. Phase 1: add the new column (nullable, no default), deploy code that writes to both old and new columns. Phase 2: backfill historical rows. Phase 3: deploy code that reads from the new column only. Phase 4: drop the old column. Each phase is a separate deployment with a validation step.

---

## Output Format

Produce a structured design document with the following sections:

```
## System Design: [System Name]

### Requirements

**Functional:**
- [Core use case 1]
- [Core use case 2]
- [Core use case 3]

**Non-Functional:**
| NFR              | Target                     | Justification                          |
|------------------|----------------------------|----------------------------------------|
| Availability     | 99.99% (52 min/year)       | [business reason]                      |
| Read latency     | p99 < 100ms                | [user experience threshold]            |
| Write latency    | p99 < 500ms                | [business reason]                      |
| Throughput       | [X] RPS peak               | [DAU × requests × peak multiplier]     |
| Data retention   | [X] years                  | [compliance or product reason]         |
| Consistency      | Eventual / Strong          | [justification for choice]             |

**Out of Scope:**
- [Excluded concern 1]
- [Excluded concern 2]

---

### Capacity Estimates

| Metric                  | Calculation                                | Result           |
|-------------------------|--------------------------------------------|------------------|
| Daily active users      | [source / assumption]                      | [X]M DAU         |
| Average RPS             | [DAU] × [req/user/day] ÷ 86,400           | [X] RPS          |
| Peak RPS (3x)           | [avg RPS] × 3                              | [X] RPS          |
| Storage per day         | [records/day] × [avg record size]          | [X] GB/day       |
| Total storage (5 years) | [storage/day] × 1,825 + 25% overhead      | [X] TB           |
| Outbound bandwidth      | [peak RPS] × [avg response size]           | [X] Gbps         |
| Cache hot dataset (20%) | 0.2 × [total active dataset]              | [X] GB           |
| Application servers     | [peak RPS] ÷ [RPS/server] × 1.5 headroom | [X] servers      |

---

### Architecture Overview

**Style:** [Modular Monolith | Microservices | Event-Driven | Event Sourcing + CQRS]
**Justification:** [2--3 sentences: why this style matches the requirements and constraints]

**Component Diagram (described):**
```
[Client] → [CDN] → [API Gateway / Load Balancer]
                         ↓
              [Application Service(s)]
              ↙         ↓          ↘
[Cache Layer]  [Primary Database]  [Message Queue]
(Redis Cluster)  (PostgreSQL/       (Kafka / SQS)
                  Cassandra)
                         ↓
                  [Read Replicas]        [Async Workers]
                                              ↓
                                     [Blob Storage / Search]
```

---

### Data Model

**Entity: [Entity Name]**
| Field        | Type            | Constraints                    | Notes                         |
|--------------|-----------------|--------------------------------|-------------------------------|
| id           | UUID / BIGINT   | PRIMARY KEY                    | Use ULID for sortable UUIDs   |
| [field]      | [type]          | [NOT NULL / INDEX / FK]        | [explanation]                 |

**Storage Selection:**
| Entity           | Storage Engine      | Rationale                                              |
|------------------|---------------------|--------------------------------------------------------|
| [Entity 1]       | PostgreSQL          | ACID, relational, <10K writes/sec                      |
| [Entity 2]       | Cassandra           | High write throughput, time-series access pattern      |
| [Entity 3]       | Elasticsearch       | Full-text search, faceted filtering                    |
| [Media files]    | S3 object storage   | Cheap durable blob storage, CDN-compatible             |

**Access Patterns:**
| Query                          | Storage / Index Used              | Expected Latency |
|--------------------------------|-----------------------------------|------------------|
| [Query description]            | [Table + index or cache hit]      | [X] ms           |

---

### API Design

**Endpoint: [Verb] /api/v1/[resource]**
- Auth: Bearer JWT, scope: [scope_name]
- Rate limit: [X] requests per minute per user
- Request: `{ "field": "type" }`
- Response 200: `{ "field": "type" }`
- Response 4xx: `{ "error": "code", "message": "human-readable" }`
- Response 5xx: `{ "error": "internal_error", "request_id": "uuid" }`

---

### Reliability Design

| Failure Scenario            | Detection                        | Mitigation                              | RTO     |
|-----------------------------|----------------------------------|-----------------------------------------|---------|
| Application server crash    | Load balancer health check       | Auto-restart + reroute traffic          | <30s    |
| Database primary failure    | Patroni / health monitor         | Automatic failover to replica           | <30s    |
| Cache failure               | Redis Sentinel                   | Fall through to database, elevated load | 0s      |
| Dependency timeout          | Circuit breaker (50% error rate) | Serve cached/degraded response          | 0s      |
| Message queue partition     | Consumer lag alert (>10s)        | Scale consumers, DLQ for poison msgs    | <5min   |

**Circuit Breaker Settings:**
- Open threshold: 50% error rate over 10-second window with minimum 20 requests
- Half-open probe: 1 request per 30 seconds
- Close threshold: 3 consecutive successes

**Retry Policy:**
- Max attempts: 3
- Backoff: exponential with jitter -- delay = min(base × 2^attempt + rand(0, base), max_delay)
- base = 100ms, max_delay = 2,000ms

---

### Scalability Plan

| Bottleneck                  | Scaling Strategy                        | Trigger Threshold              |
|-----------------------------|-----------------------------------------|--------------------------------|
| Application tier            | Horizontal scale-out (add instances)    | CPU > 70% sustained 5 min      |
| Database reads              | Add read replicas                       | Replica lag > 1s or CPU > 80%  |
| Database writes             | Vertical scale, then shard by [key]     | Write queue depth > 1,000      |
| Cache                       | Add Redis Cluster shards                | Memory utilization > 75%       |
| Message processing          | Add Kafka partitions + consumers        | Consumer lag > 10 seconds      |

---

### Observability

**Key Metrics (Four Golden Signals):**
| Signal      | Metric Name                    | Alert Threshold               |
|-------------|--------------------------------|-------------------------------|
| Latency     | http_request_duration_p99      | > [X] ms for 5 minutes        |
| Traffic     | http_requests_total (RPS)      | > [peak RPS] × 1.2            |
| Errors      | http_errors_rate               | > 1% for 5 minutes            |
| Saturation  | cpu_utilization, memory_usage  | CPU > 80%, Memory > 85%       |

**SLO:** [X]% availability over 30-day rolling window
**Error Budget:** [1 - SLO] × 30 days × 24 hours = [X] hours per month

---

### Key Trade-offs and Decision Record

| Decision                       | Options Considered                        | Choice                   | Rationale                                         |
|--------------------------------|-------------------------------------------|--------------------------|---------------------------------------------------|
| [Decision area]                | [Option 1] vs. [Option 2] vs. [Option 3] | [Chosen option]          | [2--3 sentence justification with trade-offs]     |
```

---

## Rules

1. **Never skip capacity estimation.** Every architectural decision -- database selection, caching strategy, sharding approach, server count -- must be anchored in numbers. A system designed for 1,000 RPS is fundamentally different from one designed for 1,000,000 RPS. State your assumptions explicitly when data is unavailable.

2. **Never conflate availability SLA with durability.** 99.99% availability (uptime) and 99.999999999% (11 nines) data durability are different axes. Availability is about the system being reachable; durability is about data not being lost. Design mechanisms for each independently.

3. **Never propose microservices as the default.** A microservices architecture adds operational overhead that requires a mature platform team, service mesh, distributed tracing, and robust CI/CD. For teams under 20 engineers or systems under 50K RPS per domain, a well-structured modular monolith delivers faster and is easier to evolve. Justify microservices with real scaling or team independence requirements.

4. **Always address the primary key and partitioning strategy for every database table.** A UUID primary key in Cassandra as a partition key will perform catastrophically at scale. A timestamp-based partition key in DynamoDB will create a hot partition under write load. State the partition key, sort key, and distribution rationale for every entity.

5. **Never design synchronous chains longer than 3 hops.** Each synchronous hop adds latency and multiplies the failure probability. Service A calls B calls C calls D means a 0.1% failure rate per service compounds to 0.4% system failure rate. Break deep chains with async messaging or aggregator patterns.

6. **Always specify consistency requirements per operation.** Not all operations need the same consistency level. Cassandra's QUORUM reads provide strong consistency at the cost of latency; ONE reads are faster but may return stale data. Specify per-query consistency: strong consistency for financial balance reads, eventual consistency for social feed ranking.

7. **Never design a write path without idempotency.** Every write operation that can be retried (any operation over a network can be retried) must be idempotent. Use idempotency keys (client-generated UUID sent with the request, stored server-side for 24 hours) to prevent duplicate processing.

8. **Always design the schema migration path before the schema itself.** If adding a new column to a 10-billion-row table requires locking the table, the feature is blocked for hours. PostgreSQL supports transactional DDL for most changes, but NOT NULL constraints on existing columns require a multi-phase migration. State the migration strategy as part of the data model design.

9. **Never leave a single point of failure (SPOF) without acknowledging and justifying it.** Every system has practical SPOFs (the DNS registrar, the certificate authority, the cloud region). The rule is not to eliminate all SPOFs but to identify every one and make a deliberate choice: tolerate it (with documented RTO), mitigate it (with redundancy), or eliminate it (with multi-region active-active). Unacknowledged SPOFs are design defects.

10. **Always state the CAP theorem position and its implications for user experience.** If you choose AP (available, partition-tolerant) -- as most high-traffic web systems do -- then explicitly describe what a user experiences when reading stale data: "A user may see a like count that is up to 5 seconds out of date." If you choose CP, describe what happens during a partition: "Write requests will fail with a 503 until the primary is re-elected." Both are valid choices; leaving it unstated is not.

---

## Edge Cases

**Thundering herd on cache cold start:** When a cache cluster restarts or a new deployment happens, all instances start with empty caches simultaneously, sending a massive spike of traffic directly to the database. Mitigate with probabilistic early expiration (regenerate cached values when TTL is within 10% of expiry, not at exactly 0), cache warming jobs that pre-populate hot keys from the database during deployment, and circuit breakers on the cache-miss path that shed load if the database queuing depth exceeds a threshold. Never expire all keys with the same TTL -- add ±10% random jitter to prevent synchronized mass expiration.

**Write amplification in fan-out systems:** A social platform where a post must be written to millions of followers' feeds (push model) creates a write amplification problem that can overwhelm the database. For the top 0.01% of users (celebrities with >1M followers), switch to a pull model: do not write to their followers' feeds at query time; instead, merge celebrity posts at read time into the follower's feed. This requires tracking which celebrities a user follows and fetching their recent posts separately, but eliminates 99% of the write amplification. Benchmark the hybrid read cost vs. the write amplification cost for your specific distribution.

**Schema evolution in event sourcing systems:** In an event-sourced system, events are immutable and stored permanently. If the schema of an event changes (a field is renamed, a new required field is added), old events in the store cannot be updated. Handle this with event upcasting: when replaying events, apply a transformation function that converts old event versions to the current schema before passing them to the aggregate. Version every event type explicitly (UserCreatedV1, UserCreatedV2). Never mutate historical events.

**Cross-region data residency requirements:** GDPR (EU), PIPL (China), and other data localization laws may require that certain user data never leaves a specific geographic region. A global system with a single primary database violates this. Design per-region data stores for regulated data (EU user PII stays in Frankfurt, US user PII stays in Virginia) with a global routing layer that directs requests to the correct regional store based on the user's residency. Accept that cross-region reads for regulated data are prohibited -- design accordingly and handle cases where a user travels to a different region.

**Hot partitions in sharded databases:** When sharding by user_id using hash-based sharding, a celebrity account generating 100x the traffic of a normal user lands on one shard and overwhelms it. Solutions: (1) detect hot shards in real-time by monitoring write/read rates per shard and automatically re-shard hot accounts to dedicated shards; (2) for read hot spots, use a shard-specific read replica pool; (3) for write hot spots on a specific entity (a global counter), use a distributed counter with local increments aggregated asynchronously (CRDT counter semantics). The key insight is that uniform shard assignment does not mean uniform load.

**Distributed transaction coordination across services:** When a business operation requires atomic updates across multiple services (debit account A and credit account B -- if one fails, the other must roll back), traditional 2PC is impractical in microservices (coordinator is a SPOF, performance degrades with participant count). Use the Saga pattern instead: each service executes a local transaction and publishes an event; if a downstream step fails, compensating transactions roll back each completed step. Choreography Sagas (services react to events) work for simple flows; Orchestration Sagas (a saga orchestrator coordinates the sequence) are more debuggable for complex multi-step business processes.

**Backpressure and queue overflow:** When consumers cannot keep up with producers, queue depth grows unboundedly until memory is exhausted or messages expire. Design explicit backpressure signals: (1) Kafka consumers expose consumer lag; alert and auto-scale when lag exceeds 10 seconds; (2) implement bounded queues with explicit overflow policies (drop oldest, drop newest, or block producer); (3) implement load shedding at the API gateway: when the internal queue depth exceeds a threshold, return 503 with Retry-After headers rather than accepting work you cannot process. Never let a system silently drop messages -- log every dropped message with the reason.

**Database connection pool exhaustion:** At high concurrency, application servers can exhaust the database's maximum connection limit (PostgreSQL defaults to 100 connections). Each application server with 50 threads × 10 servers = 500 connections -- already 5x the default. Solutions: (1) use a connection pooler at the application layer (HikariCP: max 10 connections per application server instance); (2) deploy a server-side connection pooler (PgBouncer in transaction pooling mode, which multiplexes thousands of application connections onto dozens of database connections); (3) size the PostgreSQL max_connections based on RAM (each connection uses 5--10 MB), typically 200--500 connections maximum for a dedicated database server. Connection pool exhaustion under load is one of the most common failure modes in web systems -- design for it explicitly.

---

## Example

**Input:** "I need to design a URL shortening service like bit.ly. It needs to handle a large scale and be production-ready. Walk me through the full design."

**Output:**

---

## System Design: URL Shortening Service

### Requirements

**Functional:**
- Shorten a long URL into a unique 7-character short code (e.g., `sht.ly/aB3xK2p`)
- Redirect a short URL to its original long URL with minimal latency
- Allow users to create custom aliases (e.g., `sht.ly/mycompany`)
- Track click analytics: timestamp, geographic region (from IP), user agent, referrer
- Optionally set an expiration date on a short URL

**Non-Functional:**

| NFR          | Target                 | Justification                                                          |
|--------------|------------------------|------------------------------------------------------------------------|
| Availability | 99.99% (52 min/year)   | Broken links are catastrophic for customer trust and SEO               |
| Read latency | p99 < 20ms             | Redirect adds to user-perceived page load time; must be near-invisible |
| Write latency| p99 < 500ms            | URL creation is not on the critical user path                          |
| Throughput   | 100K RPS peak (reads)  | 100:1 read:write ratio at 50M DAU                                      |
| Data retention| 5 years minimum       | Business requirement for analytics and link persistence                |
| Consistency  | Eventual for analytics, strong for redirect | Clicks can be counted asynchronously; redirect MUST return the correct URL |

**Out of Scope:**
- User authentication and account management
- Team/organization URL management
- Malware and phishing URL detection
- QR code generation

---

### Capacity Estimates

| Metric                  | Calculation                                  | Result        |
|-------------------------|----------------------------------------------|---------------|
| Daily active users      | Assumption: 50M DAU                          | 50M DAU       |
| URL creations/day       | 50M × 0.1 (10% of users create per day)      | 5M writes/day |
| Average write RPS       | 5M ÷ 86,400                                  | ~58 RPS       |
| Peak write RPS (3x)     | 58 × 3                                       | ~175 RPS      |
| Redirects/day           | 5M writes × 100 reads each (read:write 100:1)| 500M reads    |
| Average read RPS        | 500M ÷ 86,400                                | ~5,800 RPS    |
| Peak read RPS (3×)      | 5,800 × 3                                    | ~17,400 RPS   |
| Storage per URL record  | short_code (7B) + long_url (512B avg) + metadata (200B) | ~720B/record |
| Storage per year        | 5M × 365 × 720B                              | ~1.3 TB/year  |
| Total storage (5 years) | 1.3 TB × 5 + 20% index overhead              | ~7.8 TB       |
| Outbound bandwidth      | 17,400 RPS × 1KB avg redirect response       | ~17 MB/s      |
| Cache hot dataset (80/20)| 20% of 5-year dataset in hot access          | ~1.56 TB -- use Redis Cluster |

---

### Architecture Overview

**Style:** Microservices -- two distinct services with radically different scaling profiles

**Justification:** The write path (URL creation at ~175 RPS) and the read path (redirect at ~17,400 RPS) have a 100:1 ratio. Separating them into a Write Service and a Read/Redirect Service allows each to scale independently. The Write Service can run on 2 instances; the Redirect Service needs 20+. Coupling them in a monolith forces over-provisioning of the write path or under-provisioning of the read path.

**Component Diagram:**

```
[Browser / Client]
       ↓
[CDN Edge Cache] ← caches redirect responses with Cache-Control: max-age=3600
       ↓ (cache miss)
[Load Balancer]
    ↙        ↘
[Redirect     [Write
 Service]      Service]
 (20 pods)     (2 pods)
    ↓              ↓
[Redis Cluster]  [PostgreSQL Primary]
(hot URL cache)      ↓
    ↑          [PG Read Replicas × 2]
    ↑ (cache miss)
[PostgreSQL Read Replica]
    
[Redirect Service]
       ↓ (async, fire-and-forget)
[Kafka topic: click_events]
       ↓
[Analytics Consumer]
       ↓
[ClickHouse (analytics DB)]
```

---

### Data Model

**Entity: short_urls**

| Field        | Type            | Constraints                          | Notes                                           |
|--------------|-----------------|--------------------------------------|-------------------------------------------------|
| short_code   | CHAR(7)         | PRIMARY KEY                          | Base62 encoded, 7 chars = 62^7 = 3.5T combos   |
| long_url     | TEXT            | NOT NULL, max 2048 chars             | Store the original URL verbatim                 |
| user_id      | UUID            | NULLABLE, INDEX                      | NULL for anonymous links                        |
| created_at   | TIMESTAMPTZ     | NOT NULL, DEFAULT NOW()              | UTC, used for TTL calculation                   |
| expires_at   | TIMESTAMPTZ     | NULLABLE, INDEX                      | NULL = never expires; cron job purges expired   |
| custom_alias | BOOLEAN         | NOT NULL, DEFAULT FALSE              | Flag to skip collision check on custom codes    |
| click_count  | BIGINT          | NOT NULL, DEFAULT 0                  | Denormalized counter, updated asynchronously    |

**Partitioning strategy:** PostgreSQL with no partitioning initially (7.8 TB is manageable on a single PostgreSQL instance with SSDs). Partition by `created_at` range if table exceeds 50M rows and vacuum performance degrades.

**Entity: click_events (ClickHouse analytics table)**

| Field        | Type            | Notes                                          |
|--------------|-----------------|------------------------------------------------|
| short_code   | LowCardinality(String) | Partition key for ClickHouse sharding   |
| clicked_at   | DateTime64(3)   | Millisecond precision, sort key                |
| country_code | LowCardinality(String) | Derived from IP via MaxMind GeoIP2 DB   |
| user_agent   | String          | Raw UA string, parse at query time             |
| referrer     | Nullable(String)| HTTP Referer header                            |

ClickHouse stores this as a columnar MergeTree table ordered by `(short_code, clicked_at)`, enabling fast range scans for per-link analytics dashboards.

**Storage Selection:**

| Entity        | Storage Engine         | Rationale                                                    |
|---------------|------------------------|--------------------------------------------------------------|
| short_urls    | PostgreSQL 15          | ACID, simple schema, 175 writes/sec well within single-node capacity |
| Redirect cache| Redis Cluster (6 nodes)| Sub-millisecond lookup, LRU eviction, stores 1.56 TB hot dataset |
| click_events  | ClickHouse             | Columnar, exceptional aggregate query performance on time-series click data |

**Access Patterns:**

| Query                              | Storage / Path                         | Expected Latency |
|------------------------------------|----------------------------------------|------------------|
| Redirect: lookup by short_code     | Redis (cache hit: ~95% hit rate)       | <1 ms            |
| Redirect: lookup by short_code     | PostgreSQL read replica (cache miss)   | 5--10 ms          |
| Create short URL                   | PostgreSQL primary (INSERT)            | 10--20 ms         |
| Analytics: clicks per link per day | ClickHouse MergeTree aggregate query   | 50--200 ms        |
| User's link history                | PostgreSQL read replica (INDEX user_id)| 10--20 ms         |

---

### Short Code Generation Strategy

The most critical design decision for a URL shortener is how to generate unique short codes without collisions at scale.

**Option 1: Random Base62 (chosen):** Generate 7 random characters from [a-zA-Z0-9]. Check for collision in PostgreSQL before inserting. At 5M URLs/day × 5 years = 25M total URLs, collision probability with 3.5T possible codes is 25M/3.5T = 0.0007% -- effectively zero. Implementation: `random_code = base62(random_bytes(7))`, attempt INSERT, retry once on unique constraint violation.

**Option 2: MD5 hash of long URL:** Take first 7 chars of MD5 of the long URL. Same long URL always produces the same code (deduplication benefit). Problem: if two users shorten the same URL, they share a single short code and analytics -- usually wrong behavior for a business product.

**Option 3: Centralized auto-increment counter:** Single counter distributed as a Snowflake-like ID, encoded in Base62. Requires a coordination service (ZooKeeper, Redis INCR) -- a SPOF and a bottleneck. Pre-allocated ID ranges (each Write Service instance claims a range of 1M IDs) solves the hot spot but adds complexity.

**Chosen:** Option 1 (random Base62). Simplest implementation, near-zero collision probability at this scale, no coordination overhead.

---

### API Design

**POST /api/v1/urls -- Create short URL**
- Auth: Optional Bearer JWT (anonymous links allowed)
- Rate limit: 100 requests per minute per IP (unauthenticated); 1,000 per minute per user (authenticated)
- Request: `{ "long_url": "https://...", "custom_alias": "mylink", "expires_in_days": 30 }`
- Response 201: `{ "short_code": "aB3xK2p", "short_url": "https://sht.ly/aB3xK2p", "expires_at": "2025-01-01T00:00:00Z" }`
- Response 409: `{ "error": "alias_taken", "message": "Custom alias 'mylink' is already in use" }`
- Response 422: `{ "error": "invalid_url", "message": "The provided URL is not reachable or is malformed" }`

**GET /{short_code} -- Redirect**
- Auth: None
- Response 301 (permanent redirect -- CDN cacheable) for non-expiring links; 302 (temporary redirect) for expiring links
- Response header: `Location: https://original-long-url.com/path`
- Response 404: `{ "error": "not_found", "message": "This link does not exist or has expired" }`

**GET /api/v1/urls/{short_code}/analytics -- Click analytics**
- Auth: Bearer JWT, must be link owner
- Query params: `?from=2024-01-01&to=2024-12-31&granularity=day`
- Response 200: `{ "short_code": "aB3xK2p", "total_clicks": 45231, "series": [{"date": "2024-01-01", "clicks": 122, "top_countries": [...]}] }`

---

### Reliability Design

| Failure Scenario             | Detection                         | Mitigation                                          | RTO    |
|------------------------------|-----------------------------------|-----------------------------------------------------|--------|
| Redirect Service crash       | Load balancer health check (5s)   | Kubernetes restarts pod; traffic rerouted in <30s   | <30s   |
| Redis Cluster node failure   | Redis Cluster gossip protocol     | Cluster promotes replica automatically; degraded hit rate during failover | <10s |
| PostgreSQL primary failure   | Patroni health monitor            | Automatic failover to replica; ~20s promotion time  | <30s   |
| PostgreSQL replica unavail.  | Application health check          | Fall back to primary for reads (elevated primary load) | 0s  |
| Kafka broker failure         | Kafka leader election             | Partitions re-assigned to surviving brokers         | <30s   |
| CDN outage                   | Synthetic monitoring (5 min check)| DNS failover to origin load balancer (TTL 60s)      | <2min  |

**Circuit Breaker on PostgreSQL (from Redirect Service):**
- Open threshold: >30% error rate over 5-second window with minimum 10 requests
- Half-open: probe every 5 seconds with a single request
- During open state: serve stale Redis cache only; return 503 if cache misses with `Retry-After: 30`

**Cache Strategy:**
- Populate Redis on write (write-through): when a new short URL is created, immediately write it to Redis with TTL = min(expires_at - now, 24h). Long TTL for permanent links; short TTL for expiring links.
- On redirect cache miss: fetch from PostgreSQL read replica, populate cache, serve response.
- Cache eviction: LRU with `maxmemory-policy allkeys-lru`. Redis Cluster sized for 1.56 TB hot dataset across 6 master nodes (260 GB per master node -- use r6g.2xlarge: 64 GB each, so 12 master nodes to fit 1.56 TB).

**Idempotency:**
- Write Service uses PostgreSQL's `INSERT ... ON CONFLICT (short_code) DO NOTHING` to safely handle retried requests.
- Custom alias creation is idempotent when the same user submits the same alias+URL pair (return existing record).

---

### Scalability Plan

| Bottleneck           | Scaling Strategy                                          | Trigger                         |
|----------------------|-----------------------------------------------------------|---------------------------------|
| Redirect Service     | Horizontal scale-out (Kubernetes HPA)                     | CPU > 70% sustained for 3 min  |
| Redis Cluster reads  | Add read replicas per shard (Redis Cluster supports replicas per master) | Memory > 75% or connection count > 10K |
| PostgreSQL writes    | Vertical scale (writes are 175 RPS -- single node is fine to 50K+) | Write latency p99 > 200ms      |
| PostgreSQL reads     | Add read replicas (currently 2, scale to 5)               | Read replica CPU > 80%          |
| Kafka throughput     | Add partitions to click_events topic                      | Consumer lag > 10s             |
| ClickHouse analytics | Add ClickHouse shards                                     | Query latency p99 > 5s         |

**CDN caching eliminates ~80% of origin load.** Most popular short links receive 80% of traffic and can be cached at the CDN edge with `Cache-Control: public, max-age=3600` for permanent links. This reduces actual Redirect Service RPS from 17,400 to ~3,500 RPS at the origin -- a 5x reduction.

---

### Observability

**Key Metrics:**
