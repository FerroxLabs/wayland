---
name: event-driven-architecture
description: |
  Guides expert-level event-driven architecture implementation: backend and microservices decision frameworks, production-ready patterns, and concrete templates for event driven architecture workflows.
  Use when the user asks about event-driven architecture, event driven architecture configuration, or architecture best practices for event-driven projects.
  Do NOT use when the user needs a different architecture design capability -- check sibling skills in the architecture design subcategory.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "architecture backend microservices"
  category: "software-engineering"
  subcategory: "architecture-design"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---
# Event Driven Architecture

## When to Use

**Use this skill when:**
- A user is designing a system where multiple services need to react to state changes produced by other services, and direct synchronous coupling would create brittleness or latency problems
- A user needs to decouple producers from consumers so that either side can scale, fail, or evolve independently -- the classic microservices integration problem
- A user is implementing workflows that are naturally asynchronous: order processing pipelines, fraud detection, IoT sensor ingestion, audit log streams, or notification fan-out
- A user needs to handle traffic spikes by absorbing bursts into a durable queue or log and processing them at a sustainable rate -- load leveling via an event broker
- A user asks about specific EDA components: event sourcing, CQRS, saga orchestration vs. choreography, outbox pattern, at-least-once delivery, idempotency, consumer groups, dead-letter queues, or event schema registries
- A user is troubleshooting EDA-specific failure modes: duplicate event processing, event ordering violations, poison messages, consumer lag, or split-brain projections
- A user needs to evaluate broker technologies (Kafka, RabbitMQ, Pulsar, NATS, AWS EventBridge, Google Pub/Sub) against their workload profile
- A user is migrating a monolith to microservices and needs a strangler-fig integration strategy using events

**Do NOT use this skill when:**
- The user needs synchronous request-response API design -- use the REST API design or gRPC design skill instead
- The user is asking about stream processing transformations and analytics (Flink, Spark Streaming, ksqlDB queries) rather than the architecture of producers and consumers -- use the stream processing skill
- The user needs infrastructure-level message broker configuration (Kafka broker tuning, ZooKeeper/KRaft setup, partition rebalancing) rather than application-level architecture -- use the Kafka operations skill
- The user is asking about workflow orchestration engines (Temporal, Conductor, Airflow) as a primary topic -- those have their own skill with specific DAG and retry semantics
- The user needs general distributed systems theory without an implementation context -- the scope here is production system design, not academic review
- The user is building a simple CRUD application with fewer than 3 services -- EDA overhead is unjustified at that scale; recommend a simpler synchronous approach first

---

## Process

### Step 1: Establish the Problem Shape and Constraints

Before recommending any pattern, extract the following from the user's description. Ask clarifying questions if any of these are missing.

- **Delivery semantics required:** Does the business domain require at-most-once, at-least-once, or exactly-once processing? Financial debits require exactly-once; analytics counters can tolerate at-least-once with idempotent aggregation; fire-and-forget notifications can accept at-most-once.
- **Ordering requirements:** Must all events for a given entity (e.g., a specific order ID) be processed in sequence? Or is global ordering acceptable? Or is ordering irrelevant (analytics events, logs)? Kafka guarantees partition-level ordering; global ordering across partitions is prohibitively expensive at scale.
- **Throughput and latency envelope:** Estimate peak events per second. Under 10K/s, almost any broker works. 10K--100K/s, Kafka or Pulsar on appropriate hardware. Above 100K/s, you need dedicated partition planning, batching strategies, and horizontal consumer scaling from the start.
- **Consumer fan-out factor:** How many independent consumer groups need to receive each event? If 8 downstream services each react to an OrderPlaced event, a pub/sub log (Kafka, Pulsar) is appropriate. If 1 service processes each task from a queue, RabbitMQ or SQS is simpler.
- **Retention requirements:** Do events need to be replayed days or months later (event sourcing, new consumer onboarding, disaster recovery)? Kafka supports configurable log retention and compaction. Traditional message queues delete messages after acknowledgment.
- **Team operational capability:** A team with no Kafka experience operating a 3-broker Kafka cluster under production load is a significant risk. Managed services (Confluent Cloud, AWS MSK, Google Pub/Sub) trade cost for reduced operational burden.

### Step 2: Select the Architectural Pattern

Apply this decision tree to choose the primary pattern.

**Event Notification** -- Use when a producer announces that something happened and does not care what consumers do with the information. The event payload contains minimal data (entity ID, event type, timestamp). Consumers fetch full state independently if needed. Best for loose coupling where producer evolution should not break consumers.

**Event-Carried State Transfer** -- Use when consumers need to act immediately without a round-trip fetch. The event payload contains all relevant state at the time of the event. Increases event payload size but eliminates consumer dependency on producer APIs. Good for read-model projections and cross-service caches.

**Event Sourcing** -- Use when the system must reconstruct state at any point in time, support temporal queries, or maintain a complete audit trail as a first-class requirement. The event log IS the system of record. Current state is a projection. Adds significant complexity: snapshot management, projection rebuilding, schema evolution. Only justify when audit, temporal replay, or CQRS read models are genuine requirements.

**CQRS (Command Query Responsibility Segregation)** -- Use in conjunction with event sourcing or high read/write asymmetry. Write side processes commands and emits events. Read side maintains denormalized projections optimized for query patterns. Never use CQRS without a clear performance or complexity reason -- it doubles the data model surface area.

**Saga Pattern** -- Use for distributed transactions that span multiple services. Two flavors:
- *Choreography*: Each service listens for events and emits its own. No central coordinator. Works well for linear workflows with fewer than 4--5 steps. Gets hard to reason about with complex branching.
- *Orchestration*: A saga orchestrator (can be a dedicated service, or a workflow engine like Temporal) explicitly commands each step and handles compensating transactions. Use for workflows with more than 5 steps, conditional branching, or complex compensation logic.

**Outbox Pattern** -- ALWAYS use this when services write to a database and publish events. Never publish to a broker inside the same database transaction -- the two-phase commit problem means you can get a committed DB write with no event emitted, or an emitted event with a rolled-back write. Instead: write the event to an outbox table in the same transaction as the domain change. A separate relay process (Debezium CDC, a polling publisher, or Transactional Outbox library) reads the outbox and publishes to the broker. This is not optional for correctness.

### Step 3: Select the Event Broker

Match broker characteristics to requirements established in Step 1.

| Broker | Delivery Guarantee | Max Throughput | Ordering | Retention | Best For |
|---|---|---|---|---|---|
| Apache Kafka | At-least-once; exactly-once with transactions | 1M+ events/s per cluster | Partition-level | Configurable (days to forever) | High-volume streaming, event sourcing, log replay |
| RabbitMQ | At-least-once with acks; at-most-once without | ~50K--200K msg/s | Queue-level FIFO | Until consumed (or TTL) | Task queues, RPC patterns, complex routing |
| Apache Pulsar | At-least-once; exactly-once in transactions | 500K+ events/s | Subscription-level | Tiered (disk + object storage) | Multi-tenant, geo-replication, Kafka alternative |
| NATS JetStream | At-least-once; exactly-once with dedup window | 500K+ msg/s | Subject-level | Configurable | Low-latency, edge, IoT |
| AWS EventBridge | At-least-once | ~10K events/s per bus | No guarantee | 24h replay window | AWS-native fan-out, SaaS integrations |
| Google Pub/Sub | At-least-once | Scales automatically | No guarantee (Ordering Keys add partition-level) | 7-day retention | GCP-native, global scale |
| AWS SQS (FIFO) | Exactly-once (dedup window) | 3K msg/s FIFO; 300K standard | FIFO queue-level | Up to 14 days | Simple task queues, AWS-native |

**Decision rules:**
- If retention and replay are required: Kafka or Pulsar.
- If complex routing rules (header-based, topic exchanges): RabbitMQ.
- If exactly-once without custom dedup: Kafka transactions or SQS FIFO.
- If fully managed with zero ops preferred: EventBridge, Pub/Sub, or MSK Serverless.
- If sub-millisecond latency at edge: NATS JetStream.

### Step 4: Design the Event Schema

A well-designed event schema is the contract between producer and consumer. It must be versioned and schema-managed from day one.

**Event envelope structure (apply to every event regardless of domain):**
```json
{
  "eventId": "uuid-v4",
  "eventType": "order.placed.v1",
  "aggregateId": "order-98765",
  "aggregateType": "Order",
  "occurredAt": "2024-03-15T14:22:00.000Z",
  "producedAt": "2024-03-15T14:22:00.012Z",
  "producer": "order-service",
  "schemaVersion": "1.0.0",
  "correlationId": "uuid-of-originating-request",
  "causationId": "uuid-of-command-that-caused-this",
  "payload": { ... }
}
```

**Schema evolution rules:**
- Use a schema registry (Confluent Schema Registry, AWS Glue Schema Registry, Apicurio) with Avro, Protobuf, or JSON Schema.
- Backward-compatible changes (adding optional fields): bump minor version, consumers must ignore unknown fields.
- Breaking changes (removing fields, changing types): create a new event type version (`order.placed.v2`), run both versions in parallel during migration, deprecate v1 after all consumers have migrated.
- Never remove a field from a published event schema without a versioned migration period of at least 2 deployment cycles.

**Naming conventions:**
- Event types: `{aggregate}.{past-tense-verb}.v{major}` -- `order.placed.v1`, `payment.failed.v2`, `inventory.reserved.v1`
- Topics/subjects: `{domain}.{aggregate}.{event-type}` or aggregate-level `{domain}.{aggregate}` with event type in the envelope

### Step 5: Design for Idempotency and Failure Recovery

At-least-once delivery is the practical reality for most brokers. Design every consumer as if it will receive the same event multiple times.

**Idempotency implementation patterns:**
- **Natural idempotency:** If the operation is naturally idempotent (setting a field to a specific value rather than incrementing it), no extra work is needed. Prefer naturally idempotent operations.
- **Idempotency key store:** Before processing, check a fast store (Redis with TTL, or a database unique constraint on eventId) to see if the event has been processed. If yes, acknowledge and skip. If no, process and record. The check-then-process must be atomic -- use Redis `SET key value NX EX 86400` or a database unique index.
- **Optimistic locking with version:** For event-sourced aggregates, the aggregate version number in the event must match expected version in the store. If it does not, the event is a duplicate or out-of-order -- handle accordingly.
- **Deduplication window:** SQS FIFO provides a 5-minute dedup window. Kafka exactly-once semantics provide producer-side dedup within an epoch. Know the window and design for events that arrive outside it.

**Dead-letter queue (DLQ) strategy:**
- Configure a DLQ for every consumer. After N retries (typically 3--5 with exponential backoff starting at 1s, doubling to a max of 60s), move the message to the DLQ.
- A poison message (malformed payload, schema violation, downstream system down) must never block the consumer pipeline indefinitely.
- Alert on DLQ depth. A growing DLQ is a production incident.
- Build a DLQ replay tool from day one -- operators will need to reprocess DLQ messages after the root cause is fixed.

**Consumer backpressure:**
- Kafka consumers: set `max.poll.records` (default 500, often reduce to 100--200 for heavy processing) and `max.poll.interval.ms` (must be > your per-batch processing time). If processing exceeds the interval, the consumer is evicted from the group.
- For parallel processing within a consumer, use bounded thread pools or async processing with a semaphore. Unbounded parallelism causes memory pressure and out-of-order commits.

### Step 6: Design the Observability Layer

EDA systems are harder to debug than synchronous systems because the call graph is implicit. Observability is not optional.

**Distributed tracing:**
- Propagate `correlationId` and `causationId` through every event. These become OpenTelemetry span context.
- Instrument producers to start a trace span when publishing. Instrument consumers to continue the trace span by extracting context from the event envelope.
- Use a tracing backend (Jaeger, Zipkin, or managed services) to reconstruct the full event flow graph for debugging.

**Key metrics to instrument on every producer:**
- Events published per second by event type
- Publish latency (p50, p95, p99)
- Publish failure rate (broker unavailable, serialization errors)
- Outbox table depth (for outbox pattern) -- alert if growing

**Key metrics to instrument on every consumer:**
- Consumer lag (Kafka: offset lag per partition; this is the single most important Kafka operational metric)
- Processing rate and throughput per consumer group
- Processing latency (p50, p95, p99) per event type
- Error rate and DLQ depth per consumer group
- Rebalance events (frequent rebalancing indicates instability)

**Alert thresholds (starting points, tune to workload):**
- Consumer lag > 10,000 messages: warning
- Consumer lag > 100,000 messages: page
- DLQ depth > 0: warning after 5 minutes
- Publish failure rate > 1%: warning
- Consumer processing latency p99 > 2x baseline: warning

### Step 7: Implement Governance and Operational Runbooks

An EDA system without governance degrades into an unmanageable event spaghetti within 18 months.

**Event catalog:** Maintain a living catalog (can start as a Confluence page or a lightweight service registry) that documents: every event type, its producer, its schema version, all known consumers, and the SLA for processing latency.

**Consumer group ownership:** Every consumer group must have a declared owning team. No anonymous or shared consumer groups. Name consumer groups with team and service context: `payments-team.refund-service.order-completed-handler`.

**Schema registry enforcement:** Make schema registry validation part of the CI/CD pipeline. Producers must register schemas and pass compatibility checks before deploying. Block deployment on breaking schema changes without version bump.

**Topic/subject naming governance:** Establish naming conventions before the first topic is created. Changing topic names is operationally painful (requires consumer migration and data backfill). Use namespaces or prefixes by domain team.

**Capacity planning:** For Kafka, partition count is set at topic creation and is painful to change (repartitioning breaks ordering). Estimate max throughput, divide by target per-partition throughput (typically 10MB/s write, 30MB/s read as a ceiling), and multiply by 3 for headroom. A 1KB event at 50K/s needs at minimum 50MB/s -- 5 partitions at minimum, 15 with headroom.

---

## Output Format

When responding to an EDA design request, structure the output as follows:

```
## Event-Driven Architecture Design: [System Name]

### Problem Shape Summary
| Dimension | Value | Implication |
|-----------|-------|-------------|
| Delivery semantics required | [at-least-once / exactly-once / at-most-once] | [pattern constraint] |
| Peak throughput | [events/s] | [broker sizing constraint] |
| Ordering requirements | [global / partition-level / none] | [partitioning strategy] |
| Retention requirement | [duration] | [log vs. queue broker choice] |
| Consumer fan-out | [N services per event] | [pub/sub vs. point-to-point] |
| Team Kafka experience | [none / some / experienced] | [managed vs. self-hosted] |

---

### Selected Architecture Pattern
**Primary Pattern:** [Event Notification / Event-Carried State Transfer / Event Sourcing / Saga / combination]
**Rationale:** [2-3 sentences explaining why this pattern fits the problem shape]

**Supporting Patterns:**
- Outbox Pattern: [yes/no + why]
- CQRS: [yes/no + why]
- Saga Type: [choreography / orchestration / N/A + why]

---

### Broker Recommendation
**Selected Broker:** [Broker name]
**Rationale:** [2-3 sentences]
**Configuration parameters to set immediately:**
- [param]: [value] -- [reason]
- [param]: [value] -- [reason]

---

### Event Schema Design

#### Event Envelope (Standard -- apply to all events)
\```json
{
  "eventId": "uuid-v4",
  "eventType": "[domain].[entity].[verb].v[N]",
  "aggregateId": "[entity-identifier]",
  "aggregateType": "[EntityType]",
  "occurredAt": "ISO-8601",
  "producedAt": "ISO-8601",
  "producer": "[service-name]",
  "schemaVersion": "1.0.0",
  "correlationId": "uuid",
  "causationId": "uuid",
  "payload": { [domain-specific fields] }
}
\```

#### Key Event Types for This System
| Event Type | Producer | Consumers | Payload Fields | Topic/Subject |
|------------|----------|-----------|----------------|---------------|
| [event.type.v1] | [service] | [service-a, service-b] | [field1, field2] | [topic-name] |

---

### Idempotency Strategy
**Approach:** [natural / idempotency key store / optimistic locking]
**Implementation:** [specific code pattern or data store choice]
**Dedup window:** [duration or N/A]

---

### Dead-Letter Queue Configuration
| Consumer Group | Max Retries | Backoff Strategy | DLQ Topic | Alert Threshold |
|----------------|-------------|------------------|-----------|-----------------|
| [group-name] | [N] | [exponential, 1s base, 60s max] | [dlq-topic] | [depth] |

---

### Observability Setup
**Tracing:** [OpenTelemetry propagation strategy]
**Key Alerts:**
| Metric | Warning Threshold | Critical Threshold | Owner |
|--------|-------------------|---------------------|-------|
| Consumer lag | [N] | [N] | [team] |
| DLQ depth | [N] | [N] | [team] |
| Publish failure rate | [%] | [%] | [team] |

---

### Implementation Sequence
1. [First concrete deliverable -- e.g., "Stand up schema registry and register OrderPlaced v1 schema"]
2. [Second deliverable]
3. [Third deliverable]
(Ordered by dependency -- each step must be completable before the next)

---

### Risks and Mitigations
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| [risk] | [H/M/L] | [H/M/L] | [specific action] |
```

---

## Rules

1. **NEVER publish an event from inside a database transaction without the outbox pattern.** The distributed transaction problem between a relational database commit and a broker publish is a data consistency defect waiting to materialize. Even if it "works" 99.9% of the time, the 0.1% failure creates ghost writes or lost events.

2. **NEVER design a consumer that is not idempotent.** At-least-once delivery is the default for Kafka, RabbitMQ, and every major managed broker. Even brokers that advertise exactly-once have edge cases (network partitions, consumer crashes) that produce duplicates. Idempotency is not optional.

3. **NEVER use topic-per-event-instance (e.g., one Kafka topic per customer or per order).** Topic count in Kafka is not free -- each topic/partition maps to a file handle and memory overhead. Design topics at the entity-type level, not the entity-instance level. Use the aggregate ID in the message key for partition affinity.

4. **NEVER set partition count by default without a capacity calculation.** Kafka default of 1 partition means your consumer group can have exactly 1 active consumer -- no horizontal scaling. Calculate required partitions from throughput requirements before creating any topic. Set a minimum of 6 partitions for any topic that might need horizontal consumer scaling.

5. **NEVER delete a topic or consumer group in a shared Kafka cluster without a migration period.** Consumers may have hardcoded topic names. Producers may still be writing. Create a deprecation timeline (minimum 2 weeks, announce to all stakeholder teams) and monitor lag before deletion.

6. **ALWAYS version event types in the event type field, not just in the schema registry.** Consumers need to dispatch on event type at the application level. `order.placed.v2` lets a consumer explicitly handle both v1 and v2 during migration without schema registry lookups at runtime.

7. **NEVER use a Saga choreography pattern for workflows with compensating transactions on more than 3 services.** The combinatorial explosion of event sequences that each service must handle -- including partial failures, retries, and compensation flows -- becomes unmaintainable. Switch to orchestration via a dedicated saga service or workflow engine.

8. **ALWAYS configure consumer `max.poll.interval.ms` to be greater than your worst-case batch processing time plus a 20% buffer.** The default is 300,000ms (5 minutes). If your consumer does a downstream HTTP call that can take 30s and you process 100 records per poll, your interval must be at least `100 * 30s * 1.2 = 3600s`. Misconfiguration causes continuous consumer group rebalancing under load.

9. **NEVER build an EDA system without a DLQ and a replay tool.** Poison messages will occur in production. Without a DLQ, one malformed event blocks the consumer pipeline for all subsequent events on that partition. Without a replay tool, fixing the root cause still leaves the failed events unprocessed. Both are production-critical from day one.

10. **ALWAYS establish schema compatibility rules in the schema registry before the first production publish.** Schema registry compatibility modes (BACKWARD, FORWARD, FULL) enforce the evolution contract. The default in Confluent Schema Registry is BACKWARD. Decide the right mode for each topic, document the decision, and enforce it in CI. Changing compatibility mode after consumers are in production requires a coordinated migration.

---

## Edge Cases

**Legacy monolith emitting events via Change Data Capture (CDC)**

When the event source is a legacy database that cannot be modified to use an outbox table, use Debezium connected to the database's binary log (MySQL binlog, PostgreSQL WAL, SQL Server CDC). Debezium emits row-level change events to Kafka automatically. The critical challenge: the CDC event represents a database row change, not a domain event. Build a thin transformation consumer that converts CDC events into properly enveloped domain events and re-publishes them to domain topics. Do not let CDC row events leak into domain consumer code -- they are an infrastructure artifact, not a business contract.

**Consumer group rebalancing causing processing storms**

When a Kafka consumer pod is restarted or scaled, a rebalance occurs. During rebalance, all consumers in the group pause. If processing is slow and rebalances are frequent (e.g., Kubernetes rolling deployments every hour), consumers may spend more time paused than processing. Mitigations: use static group membership (`group.instance.id`) to reduce rebalance frequency on rolling restart; use incremental cooperative rebalancing (Kafka 2.4+, set `partition.assignment.strategy=CooperativeStickyAssignor`) so only partitions that need to move are reassigned rather than all partitions; stagger deployments to avoid simultaneous restarts of all consumer pods.

**Event ordering violations from parallel consumer processing**

A common mistake: a Kafka consumer reads 100 messages, spawns 100 threads, and processes them in parallel to maximize throughput. If two events share the same aggregate ID (e.g., two OrderUpdated events for order 123), parallel processing violates ordering. Fix: use Kafka's partition key equal to the aggregate ID (Kafka guarantees in-order delivery within a partition), and process within a partition sequentially or with a per-key serial worker. If parallelism is required within a partition, use a consistent hashing scheme to assign each aggregate ID to a dedicated worker thread and serialize work per key.

**Exactly-once semantics across broker and external system**

Kafka transactions provide exactly-once between Kafka producer and consumer (read-process-publish). They do NOT cover writes to external systems (databases, HTTP APIs, other brokers). If a consumer reads from Kafka, updates a PostgreSQL database, and must achieve exactly-once, use the outbox pattern on the consumer side: write the result and an "processed" record in the same PostgreSQL transaction, with a unique constraint on `eventId`. The Kafka offset commit happens separately -- the database transaction is the source of truth for idempotency. Do not conflate Kafka's exactly-once with end-to-end exactly-once.

**Schema evolution with long-running consumers that cannot be redeployed**

In some environments (embedded systems, air-gapped deployments, regulated environments with slow change control), consumers cannot be updated quickly when a schema changes. Use FULL compatibility (BACKWARD + FORWARD) in the schema registry so that both old and new consumers can read both old and new event versions. This requires strict discipline: optional fields only, no type changes, no removals. Design the payload structure with this constraint from the start if long-running consumers are a known constraint.

**Event fan-out creating thundering herd on downstream services**

A single high-volume event (e.g., `flash-sale.started.v1` triggering 15 consumer services) can cause all consumers to spike simultaneously, overwhelming downstream databases or HTTP APIs. Mitigation strategies: jitter consumer processing (add random sleep 0--500ms before processing if latency SLA allows it); rate-limit consumer processing per consumer group at the application level (a token bucket or semaphore per consumer group); use a dedicated low-throughput consumer group for expensive downstream calls rather than processing at full consumer speed. Monitor downstream service error rates as a leading indicator of fan-out overload.

**Competing consumers violating business-level uniqueness constraints**

Multiple consumer instances in the same consumer group can receive different events for the same aggregate concurrently (events on different partitions). If both events trigger writes to the same row in a shared database, you get concurrent modification issues. Mitigation: use the aggregate ID as the Kafka partition key to guarantee that all events for a given aggregate go to the same partition and are therefore processed by the same consumer instance at any given time. For operations that span multiple aggregates, use optimistic locking with version numbers in the database. Never assume Kafka partition assignment prevents all cross-consumer contention on shared data.

**Event store growing unbounded in event sourcing**

An event-sourced aggregate that accumulates thousands of events makes reconstitution slow -- replaying 50,000 events to rebuild current state is unacceptable in a request path. Implement snapshots: periodically (every N events, where N is typically 50--500 depending on event size and replay frequency) serialize the aggregate's current state as a snapshot. On reconstitution, load the most recent snapshot and replay only events after the snapshot sequence number. Store snapshots in a separate collection/table with an index on `(aggregateId, version)`. Automate snapshot creation -- do not rely on manual triggers.

---

## Example

**Input:** "We're building an e-commerce platform. We have an Order Service (writes order data to PostgreSQL), a Payment Service, an Inventory Service, a Notification Service, and an Analytics Service. When a customer places an order, we need payment charged, inventory reserved, and the customer notified. We're on AWS, our team has basic Kafka experience, we expect up to 5,000 orders/minute at peak (Black Friday), and we need a full audit trail of every order state transition."

---

## Event-Driven Architecture Design: E-Commerce Order Processing Pipeline

### Problem Shape Summary

| Dimension | Value | Implication |
|-----------|-------|-------------|
| Delivery semantics required | Exactly-once for payment/inventory; at-least-once for notifications | Payment and inventory use idempotency key store; notifications use natural idempotency (email dedup by eventId) |
| Peak throughput | 5,000 orders/min = ~83 events/s sustained, ~500/s burst | Well within a 6-partition topic; no exotic scaling needed |
| Ordering requirements | Per-order (aggregate-level) | Use orderId as Kafka partition key |
| Retention requirement | Full audit trail -- indefinite for order events | Kafka with log compaction + time-based retention policy of 2 years minimum |
| Consumer fan-out | 4 services react to order events | Kafka pub/sub log appropriate; each service is its own consumer group |
| Team Kafka experience | Basic | Use AWS MSK (managed Kafka) to reduce operational burden; avoid self-hosted cluster management |

---

### Selected Architecture Pattern

**Primary Pattern:** Event Sourcing + Event-Carried State Transfer (hybrid)

**Rationale:** The audit trail requirement makes event sourcing the correct choice -- the event log is the system of record for all order state transitions. Event-carried state transfer is used in the event payload so that Payment, Inventory, and Notification services can act without fetching back to Order Service, reducing coupling and latency.

**Supporting Patterns:**
- **Outbox Pattern:** Yes -- Order Service writes to PostgreSQL. The OrderPlaced event must be written atomically with the order record. Use Debezium connected to the PostgreSQL WAL to relay outbox table entries to Kafka. This prevents lost events on Order Service crash between DB write and Kafka publish.
- **CQRS:** Yes -- Order Service maintains a write model (event store in PostgreSQL: `order_events` table). A separate read projection consumer maintains a `orders_read` table with current order state for API queries. This separates write throughput from read query patterns.
- **Saga Type:** Orchestration -- The payment + inventory + notification workflow has compensating transactions (if payment fails, the order must be cancelled and inventory released). With 3 services and branching compensation logic, choreography would require each service to understand the full workflow. An Order Saga Orchestrator service (a thin stateful service, or using AWS Step Functions for the managed option) explicitly sequences the steps.

---

### Broker Recommendation

**Selected Broker:** Apache Kafka via AWS MSK (Managed Streaming for Apache Kafka)

**Rationale:** Kafka's durable log with configurable retention satisfies the audit trail requirement. MSK eliminates cluster management overhead appropriate for a team with basic Kafka experience. At 500 events/s burst, MSK with 3 brokers and adequate partition count handles load with significant headroom.

**Configuration parameters to set immediately:**

| Parameter | Value | Reason |
|-----------|-------|--------|
| `log.retention.ms` | `63072000000` (2 years) | Audit trail requirement |
| `log.cleanup.policy` | `compact,delete` | Compaction preserves latest event per key; delete prunes beyond retention |
| `min.insync.replicas` | `2` | Data durability -- require 2 of 3 brokers to acknowledge before producer ack |
| `acks` (producer) | `all` | All in-sync replicas must acknowledge; prevents data loss on broker failure |
| `enable.idempotence` (producer) | `true` | Exactly-once producer-side deduplication within an epoch |
| `max.poll.records` (consumer) | `100` | Limit per-poll batch; prevents long processing intervals triggering rebalance |
| `max.poll.interval.ms` (consumer) | `120000` | 2-minute max for Notification Service which calls external email API |
| `partition.assignment.strategy` | `CooperativeStickyAssignor` | Incremental rebalancing; reduces processing pauses during rolling deployments |

---

### Event Schema Design

#### Event Envelope (Standard)

```json
{
  "eventId": "01HQX7M2A3B4C5D6E7F8G9H0J1",
  "eventType": "order.placed.v1",
  "aggregateId": "order-00842931",
  "aggregateType": "Order",
  "occurredAt": "2024-03-15T14:22:00.000Z",
  "producedAt": "2024-03-15T14:22:00.018Z",
  "producer": "order-service",
  "schemaVersion": "1.0.0",
  "correlationId": "req-9f2a8b1c-d3e4-4f56-a789-0b1c2d3e4f56",
  "causationId": "cmd-3e4f56a7-89b0-1c2d-3e4f-56a789b0c1d2",
  "payload": {
    "orderId": "order-00842931",
    "customerId": "cust-11293847",
    "customerEmail": "jane.doe@example.com",
    "lineItems": [
      { "skuId": "sku-00291", "quantity": 2, "unitPriceCents": 4999 },
      { "skuId": "sku-00847", "quantity": 1, "unitPriceCents": 14999 }
    ],
    "totalAmountCents": 24997,
    "currency": "USD",
    "orderStatus": "PENDING_PAYMENT",
    "shippingAddress": {
      "street": "123 Main St",
      "city": "Austin",
      "state": "TX",
      "postalCode": "78701",
      "country": "US"
    }
  }
}
```

#### Key Event Types for This System

| Event Type | Producer | Consumers | Key Payload Fields | Kafka Topic | Partition Key |
|---|---|---|---|---|---|
| `order.placed.v1` | order-service | order-saga-orchestrator, analytics-service | orderId, customerId, lineItems, totalAmountCents | `ecommerce.order.events` | orderId |
| `payment.charged.v1` | payment-service | order-saga-orchestrator, analytics-service | orderId, paymentId, amountCents, paymentMethod | `ecommerce.payment.events` | orderId |
| `payment.failed.v1` | payment-service | order-saga-orchestrator, analytics-service | orderId, paymentId, failureReason, failureCode | `ecommerce.payment.events` | orderId |
| `inventory.reserved.v1` | inventory-service | order-saga-orchestrator, analytics-service | orderId, reservationId, lineItems, warehouseId | `ecommerce.inventory.events` | orderId |
| `inventory.reservation-failed.v1` | inventory-service | order-saga-orchestrator | orderId, skuId, requestedQty, availableQty | `ecommerce.inventory.events` | orderId |
| `order.confirmed.v1` | order-service | notification-service, analytics-service | orderId, customerId, customerEmail, confirmedAt | `ecommerce.order.events` | orderId |
| `order.cancelled.v1` | order-service | notification-service, analytics-service | orderId, customerId, cancellationReason | `ecommerce.order.events` | orderId |

**Schema registry:** AWS Glue Schema Registry with `BACKWARD` compatibility enforced on all topics. JSON Schema format for team familiarity. Migration to Avro if binary serialization overhead becomes a concern at scale.

---

### Saga Orchestration Flow

```
Customer Request
      |
      v
Order Service (writes OrderPlaced to outbox + DB atomically)
      |
      v (Debezium relays outbox event)
Kafka: ecommerce.order.events
      |
      v
Order Saga Orchestrator (consumer group: order-team.saga-orchestrator.order-placed)
      |
      |-- Command --> Payment Service: "charge payment for order-00842931"
      |                    |
      |              [PaymentCharged OR PaymentFailed]
      |                    |
      |              If PaymentCharged:
      |-- Command --> Inventory Service: "reserve inventory for order-00842931"
      |                    |
      |              [InventoryReserved OR InventoryReservationFailed]
      |                    |
      |              If InventoryReserved:
      |-- Command --> Order Service: "confirm order-00842931"
      |                    |
      |              [OrderConfirmed] --> Notification Service sends email
      |
      |              If PaymentFailed OR InventoryReservationFailed:
      |-- Compensate: Cancel order, release any partial reservations
      |-- Command --> Order Service: "cancel order-00842931, reason=PaymentFailed"
```

**Commands between saga orchestrator and services use a separate command topic** (`ecommerce.order.saga.commands`) with the service name as a header for routing. This keeps domain event topics clean and separates saga orchestration concerns from domain events consumed by analytics and notifications.

---

### Idempotency Strategy

**Payment Service:** Redis-based idempotency key store. Key: `idempotency:payment:{orderId}:{eventId}`, TTL: 72 hours (covers any realistic retry window). Implementation: `SET key "processed" NX EX 259200`. If key already exists, return the previously stored payment result without re-charging. Store the payment result in Redis alongside the processed flag so the orchestrator gets a consistent response on retry.

**Inventory Service:** Database-level unique constraint: `UNIQUE (order_id, reservation_event_id)` on the `inventory_reservations` table. Insert attempt on duplicate raises a unique constraint violation -- catch it and return the existing reservation. Natural exactly-once via database semantics.

**Notification Service:** Email provider (SES) deduplication using `eventId` as the `MessageDeduplicationId` for the outgoing email request. SES itself deduplicates within a 10-minute window. Application-level dedup: store `sent_notifications` table with unique constraint on `eventId` before calling SES.

**Dedup window:** 72 hours Redis TTL for payment; database constraint permanent for inventory; SES 10-minute window + database for notifications.

---

### Dead-Letter Queue Configuration

| Consumer Group | Max Retries | Backoff Strategy | DLQ Topic | Alert Threshold |
|---|---|---|---|---|
| `order-team.saga-orchestrator.order-placed` | 3 | Exponential: 1s, 4s, 16s | `ecommerce.order.events.dlq` | Depth > 0 for > 2 min |
| `payment-team.payment-service.saga-commands` | 5 | Exponential: 2s, 4s, 8s, 16s, 32s | `ecommerce.order.saga.commands.dlq` | Depth > 0 for > 2 min |
| `inventory-team.inventory-service.saga-commands` | 5 | Exponential: 2s, 4s, 8s, 16s, 32s | `ecommerce.inventory.events.dlq` | Depth > 0 for > 2 min |
| `notification-team.notification-service.order-confirmed` | 3 | Exponential: 5s, 30s, 120s | `ecommerce.notification.events.dlq` | Depth > 5 for > 5 min |
| `analytics-team.analytics-service.all-events` | 3 | Exponential: 1s, 4s, 16s | `ecommerce.analytics.events.dlq` | Depth > 100 |

**DLQ replay tool:** A CLI or internal admin UI that reads from a DLQ topic, optionally filters by event type or time range, and re-publishes events to the original topic. Include a dry-run mode. Required before production launch.

---

### Observability Setup

**Tracing:** OpenTelemetry Java/Python agent instrumented on all services. `correlationId` from the event envelope maps to the OTel trace ID. `causationId` maps to the parent span ID. Trace context propagated via event headers (OTel W3C TraceContext format). Traces sent to AWS X-Ray (native MSK integration available). Every consumer logs `{eventId, eventType, aggregateId, processingLatencyMs, outcome}` as structured JSON.

**Key Alerts:**

| Metric | Warning Threshold | Critical Threshold | Owner |
|---|---|---|---|
| Consumer lag: saga-orchestrator | > 1,000 messages | > 10,000 messages | Order Team |
| Consumer lag: payment-service | > 500 messages | > 5,000 messages | Payment Team |
| Consumer lag: inventory-service | > 500 messages | > 5,000 messages | Inventory Team |
| DLQ depth: any DLQ | > 0 for 2 min | > 10 for any duration | Owning team |
| Publish failure rate | > 0.5% | > 2% | Order Team |
| Payment service idempotency key hit rate | > 5% (unexpected surge in dupes) | > 20% | Payment Team |
| Saga completion time p95 | > 10s | > 30s | Order Team |

---

### Kafka Topic Configuration

```
Topic: ecommerce.order.events
  Partitions: 12  (calculated: 500 events/s burst * 1KB avg * safety factor / 10MB/s per partition = 0.05 -- min 12 for future headroom)
  Replication factor: 3
  Retention: 63072000000 ms (2 years)
  Cleanup policy: compact,delete
  Min ISR: 2

Topic: ecommerce.payment.events
  Partitions: 12
  Replication factor: 3
  Retention: 63072000000 ms
  Cleanup policy: compact,delete
  Min ISR: 2

Topic: ecommerce.order.saga.commands
  Partitions: 6
  Replication factor: 3
  Retention: 604800000 ms (7 days -- commands are transient)
  Cleanup policy: delete
  Min ISR: 2

Topic: ecommerce.*.dlq  (one per source topic)
  Partitions: 3
  Replication factor: 3
  Retention: 2592000000 ms (30 days)
  Cleanup policy: delete
  Min ISR: 2
```

---

### Implementation Sequence

1. **Set up AWS MSK cluster and AWS Glue Schema Registry.** Configure 3-broker MSK cluster in private VPC subnets. Set min ISR, retention, and cleanup policies at the cluster default level. Register schema registry with BACKWARD compatibility mode. Verify broker connectivity from each service's VPC subnet.

2. **Implement Outbox table in Order Service and deploy Debezium connector.** Add `order_outbox` table to Order Service's PostgreSQL schema: `(id UUID PK, aggregate_id TEXT, event_type TEXT, payload JSONB, created_at TIMESTAMPTZ, relayed_at TIMESTAMPTZ)`. Configure Debezium PostgreSQL connector pointed at WAL. Verify events flow from outbox to `ecommerce.order.events` Kafka topic before writing any other consumer.

3. **Register all event schemas in the schema registry and enforce in CI.** Write JSON Schema definitions for all 7 event types. Register under the appropriate subject names. Add schema compatibility check as a CI step that blocks merge on breaking changes.

4. **Implement Order Saga Orchestrator.** Build the orchestrator as a stateless consumer (saga state stored in PostgreSQL `order_saga_state` table, keyed by orderId). Implement the happy path first: OrderPlaced -> ChargePayment command -> PaymentCharged -> ReserveInventory command -> InventoryReserved -> ConfirmOrder command. Deploy and smoke test against staging before implementing compensation.

5. **Implement Payment Service and Inventory Service consumers with idempotency.** Payment Service: implement Redis idempotency check before any charge attempt. Inventory Service: implement unique constraint on reservations table. Both services publish their result events back to their respective Kafka topics.

6. **Implement compensation flows in the Saga Orchestrator.** Handle PaymentFailed and InventoryReservationFailed branches. Implement compensating OrderCancelled event emission and any necessary rollback commands. Test failure scenarios explicitly with chaos engineering (kill Payment Service mid-saga, replay events, verify compensation fires correctly).

7. **Implement Notification Service and Analytics Service consumers.** These are read-only consumers with no saga involvement. Notification Service: consume `order.confirmed.v1` and `order.cancelled.v1`, send email via SES with eventId as dedup key. Analytics Service: consume all event topics, write to data warehouse (AWS Redshift or S3 + Athena).

8. **Configure observability, DLQ alerts, and build DLQ replay tool.** Deploy OpenTelemetry collectors to each service. Configure CloudWatch dashboards for consumer lag, DLQ depth, and saga completion time. Build and test the DLQ replay CLI before go-live. Run a load test at 600 orders/minute (20% above peak estimate) and verify lag does not grow unbounded.

---

### Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Debezium connector lag causes delayed event relay from Order Service outbox | Medium | High -- orders appear stuck | Monitor outbox table row count and `created_at` vs `relayed_at` delta; alert if unrelayed rows > 100 or delay > 10s; have manual relay runbook |
| Payment Service Redis idempotency store becomes a single point of failure | Low | High -- duplicate charges | Deploy Redis with replication (AWS ElastiCache Multi-AZ); fall back to database idempotency table if Redis is unavailable |
| Saga state table in Order Saga Orchestrator becomes a hotspot at peak load | Medium | Medium -- slow saga completion | Partition saga state table by orderId hash; add read replica for state queries; index on (order_id, current_step, status) |
| Schema evolution breaks a consumer deployed on a slow release cycle | Medium | Medium -- consumer processing errors | Enforce BACKWARD compatibility; test each schema change against all registered consumer schemas in CI before merge |
| Consumer group rebalancing during Black Friday peak causes processing pauses | Medium | High -- order backlog during peak | Enable CooperativeStickyAssignor; use static group membership (`group.instance.id` per pod); pre-scale consumer groups 30 minutes before peak traffic window |
