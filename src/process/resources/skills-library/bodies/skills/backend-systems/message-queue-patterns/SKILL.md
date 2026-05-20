---
name: message-queue-patterns
description: |
  Guides expert-level message queue patterns implementation: architecture and automation decision frameworks, production-ready patterns, and concrete templates for message queue patterns workflows.
  Use when the user asks about message queue patterns, message queue patterns configuration, or backend best practices for message projects.
  Do NOT use when the user needs a different backend infrastructure capability -- check sibling skills in the backend infrastructure subcategory.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "backend architecture automation"
  category: "backend-systems"
  subcategory: "backend-infrastructure"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Message Queue Patterns

## When to Use

**Use this skill when:**
- The user asks which message queue pattern (competing consumers, pub/sub, dead-letter, saga, outbox) to use for a specific architecture problem
- The user is designing an event-driven or microservices system and needs to decouple producers from consumers
- The user asks about ordering guarantees, at-least-once vs. exactly-once delivery, or consumer group semantics
- The user needs to implement reliable async processing -- job queues, task distribution, event streaming, or command routing
- The user is debugging message queue problems: duplicate processing, consumer lag, poison messages, ordering violations, or delivery failures
- The user wants to implement the Transactional Outbox pattern, Saga orchestration/choreography, or CQRS event publishing
- The user asks about broker selection (RabbitMQ, Apache Kafka, Amazon SQS, Redis Streams, Google Pub/Sub, NATS) and how their semantics affect pattern choice

**Do NOT use this skill when:**
- The user needs help with in-process event emitters (Node.js EventEmitter, Python asyncio queues) -- those are not distributed message queues
- The user is asking about task scheduling (cron jobs, delayed execution) without a queue component -- check the job-scheduling skill
- The user needs WebSocket or Server-Sent Event real-time push to browsers -- that is a different communication pattern
- The user is asking about REST API design or synchronous RPC -- check the API design skill
- The user needs database replication or CDC (Change Data Capture) without a queue overlay -- check the data-replication skill
- The user is building a simple in-memory cache with pub/sub (Redis PUBLISH/SUBSCRIBE without persistence) -- that is a cache-invalidation pattern, not a durable queue
- The user is asking about service mesh inter-service communication (Istio, Linkerd retries, circuit breakers at the network layer)

---

## Process

### 1. Identify the Core Delivery Requirement

Start by pinning down the delivery semantics the system actually needs. This determines which brokers and patterns are even viable.

- **At-most-once:** Message may be lost if consumer crashes. Acceptable for metrics, telemetry, or notification best-effort. Redis PUBLISH/SUBSCRIBE, UDP-based transports.
- **At-least-once:** Message is redelivered if not acknowledged. Consumer must be idempotent. Default for RabbitMQ, SQS, Kafka consumer groups (without transactions), Google Pub/Sub.
- **Exactly-once:** Message processed exactly one time. Requires either idempotent consumers + deduplication keys, or broker-level transactions. Kafka Transactions API, SQS FIFO with deduplication IDs.
- Ask the user: Can your consumer handle processing the same message twice with the same outcome? If yes, at-least-once with idempotency is almost always preferable to exactly-once because it is far simpler to implement and operate.
- Identify whether ordering matters within a stream, within a partition, or globally. Global ordering across all messages is almost never achievable at scale without severe throughput limitations.
- Ask whether the producer and consumer share a database. If yes, the Transactional Outbox pattern is likely required to avoid dual-write inconsistency.

### 2. Map the Communication Topology

Identify which structural pattern matches the system's needs before selecting a broker:

- **Point-to-point (Work Queue / Competing Consumers):** One producer, N consumers, each message processed by exactly one consumer. Used for task distribution, background jobs, rate-limited external API calls. Key metric: consumer count scales with queue depth / processing rate.
- **Publish/Subscribe (Fan-out):** One producer, N consumers, each consumer receives every message. Used for event broadcasting: cache invalidation across services, audit log writes, notification dispatch. Requires topic/exchange routing, not a simple queue.
- **Request/Reply over queues:** Producer sends command on a request queue with a `reply_to` header pointing to a private reply queue. Consumer processes and responds. Use only when synchronous-style interactions must cross service boundaries asynchronously. Set aggressive TTLs (2--10 seconds) or the pattern degrades into a slow RPC.
- **Event streaming (log-based):** Messages are immutable, ordered, and retained indefinitely. Consumers track their own offset. Used for event sourcing, audit trails, stream processing, and replay. Kafka and Kinesis are the canonical implementations.
- **Priority queues:** Messages carry a priority integer (0--255 in RabbitMQ). High-priority items jump ahead of lower-priority ones in the queue. Useful for premium-tier processing; dangerous if low-priority messages starve indefinitely -- set a maximum priority depth (8 levels is a practical limit to avoid performance degradation in RabbitMQ).
- **Dead Letter Queue (DLQ):** A secondary queue that receives messages the primary queue cannot process -- TTL expired, max delivery attempts exceeded, consumer rejection (nack without requeue). Every production queue should have an associated DLQ.

### 3. Select the Right Broker

Match broker capabilities to the delivery and topology requirements identified in steps 1 and 2:

- **RabbitMQ:** Use when you need sophisticated routing (direct, fanout, topic, headers exchanges), complex topologies, or AMQP protocol compatibility. Native priority queues. At-least-once delivery. Message TTLs and per-queue DLQs built in. Not suited for replay, event streaming, or high-throughput log tailing (>100K msg/s sustained without clustering).
- **Apache Kafka:** Use when you need durable log retention for replay, high throughput (millions of events/second per cluster), stream processing (Kafka Streams, ksqlDB), or strict partition-level ordering. Consumer groups provide competing consumer semantics within a topic partition. Retention-based cleanup (time or size) replaces TTLs. Operational complexity is significant.
- **Amazon SQS (Standard + FIFO):** Use when you are on AWS and want a fully managed queue with zero operational overhead. Standard queues are at-least-once with no ordering. FIFO queues are exactly-once within a message group (300 msg/s without batching, 3000/s with). SQS pairs naturally with SNS for fan-out (SNS topic -> multiple SQS queues).
- **Redis Streams:** Use for lightweight, low-latency streaming with consumer group semantics. Persistent (AOF or RDB), replayable within retention window. Best when Kafka is operationally too heavy. Not suitable for very high cardinality topics or multi-datacenter replication.
- **Google Cloud Pub/Sub:** Use when on GCP. At-least-once delivery, global by default, 7-day retention, scales to millions of messages/second automatically. Dead-letter topics supported natively. Subscription filters available.
- **NATS / NATS JetStream:** Use for ultra-low latency (<1ms), IoT, edge computing, or when a lightweight footprint is critical. NATS core is at-most-once; JetStream adds persistence and at-least-once semantics with consumer durability.

### 4. Design for Idempotency and Deduplication

Every production message consumer must be idempotent. This is non-negotiable with at-least-once delivery.

- Include a **message ID** (UUID v4 or ULID) in every message envelope. The consumer stores processed IDs in a dedupe store (Redis with `SET NX EX 86400`, a database unique constraint, or a bloom filter for approximate deduplication at scale).
- Use **conditional writes** -- include a version/etag in the message and apply optimistic locking when updating the target entity. If the version does not match, the message is stale and can be discarded.
- Design handlers so that applying the same operation twice produces the same result: `SET balance = 100` is idempotent; `INCREMENT balance BY 10` is not. Convert non-idempotent operations to idempotent form using the message ID as an operation key.
- For Kafka specifically: use the **Idempotent Producer** (`enable.idempotence=true`) to prevent duplicate sends at the producer level. Use **Transactions** (`transactional.id`, `isolation.level=read_committed`) when producing to multiple partitions atomically.
- Set a dedupe window appropriate to your maximum redelivery interval. If SQS visibility timeout is 5 minutes and retry policy allows 10 retries, the dedupe window must exceed 50 minutes. Add a safety margin (2x) and use 2 hours.

### 5. Implement the Transactional Outbox Pattern (When Required)

Use this pattern whenever a service must atomically update its own database AND publish a message. The dual-write problem (DB commit succeeds, publish fails -- or vice versa) causes data inconsistency without this pattern.

- Create an `outbox` table in the service's own database with columns: `id UUID PK`, `aggregate_type VARCHAR`, `aggregate_id UUID`, `event_type VARCHAR`, `payload JSONB`, `created_at TIMESTAMP`, `processed_at TIMESTAMP NULL`.
- In the same database transaction that updates business data, INSERT a row into the outbox table. The message is not yet published.
- A separate **outbox relay process** (can be a background thread, a separate service, or Debezium CDC) polls or watches the outbox table, publishes each unprocessed row to the broker, then marks `processed_at`.
- For Kafka: use Debezium to stream the outbox table changes via CDC -- zero polling delay, no missed events. Configure the Debezium outbox event router SMT (Single Message Transform) to route messages based on `aggregate_type` to the correct topic.
- For RabbitMQ or SQS: a polling relay with a 1--5 second interval is acceptable for most workloads. Use `SELECT ... WHERE processed_at IS NULL ORDER BY created_at LIMIT 100 FOR UPDATE SKIP LOCKED` to prevent multiple relay instances from processing the same row.
- Retain outbox rows for at least 24 hours after processing for debugging. Archive to cold storage after 7 days.

### 6. Design the Dead Letter Queue and Retry Strategy

Every queue needs a DLQ and a documented retry policy before the first consumer is deployed.

- Define **max delivery attempts** based on error type: transient errors (network timeout, DB connection) warrant 3--5 retries with exponential backoff starting at 1 second. Permanent errors (deserialization failure, schema violation, invalid business rule) should dead-letter immediately after 1 attempt -- retrying will never help.
- Implement **exponential backoff with jitter** in the consumer: `sleep = min(base * 2^attempt, cap) + random(0, jitter)`. Typical values: base=1s, cap=300s (5 minutes), jitter=cap*0.25. This prevents thundering herd when a downstream dependency recovers after an outage.
- Tag every message sent to the DLQ with metadata: original queue name, failure reason, exception class, stack trace (truncated to 1KB), delivery attempt count, original timestamp, and consumer hostname. This makes DLQ triage far faster.
- Build a **DLQ processor** -- do not manually replay messages. The processor should: inspect the failure reason, apply a fix if possible (schema migration, data correction), then republish to the original queue. Never delete from the DLQ without either reprocessing or explicit analyst sign-off.
- Set DLQ retention high: 14 days minimum. SQS default is 4 days -- explicitly set `MessageRetentionPeriod` to 1209600 (14 days) for all DLQs.
- Alert on DLQ depth > 0. A non-empty DLQ always indicates a processing problem that requires investigation. Use CloudWatch Alarm, Datadog monitor, or Prometheus `rabbitmq_queue_messages` metric.

### 7. Implement Saga Pattern for Distributed Transactions

When a business operation spans multiple services, use the Saga pattern instead of distributed (2PC) transactions.

- **Choreography Saga:** Services react to events without a central coordinator. Service A completes its step and publishes an event. Service B listens for that event and performs its step. Compensating transactions are triggered when a service publishes a failure event. Use when the saga has 2--4 steps and you can tolerate the debugging complexity of tracing distributed event chains.
- **Orchestration Saga:** A dedicated saga orchestrator (state machine) sends commands to each service and waits for replies. The orchestrator tracks state explicitly (typically in a database). Use for sagas with 5+ steps, complex business logic, or when you need a single authoritative view of transaction state.
- Every saga step must have a compensating transaction that is also idempotent. Document compensation logic in the same PR as the forward logic -- never ship a forward step without its compensation.
- Use a saga state table with columns: `saga_id UUID`, `saga_type`, `current_step`, `status` (STARTED/COMPLETED/COMPENSATING/FAILED), `payload JSONB`, `updated_at`. Log every step transition.
- Implement a **saga timeout** -- sagas that do not complete within a configured window (e.g., 30 minutes for a payment flow) automatically trigger compensation. This prevents sagas from hanging indefinitely due to a downstream service that never responds.
- For Kafka-based choreography, use a dedicated saga events topic per saga type. Keep saga events separate from domain events to avoid consumer coupling.

### 8. Validate, Monitor, and Tune

Production message queue systems require ongoing operational visibility.

- **Consumer lag** is the primary operational metric. Alert when lag exceeds 60 seconds of backlog at current throughput. Calculate: `lag = latest_offset - consumer_offset` (Kafka), `ApproximateNumberOfMessagesNotVisible + ApproximateNumberOfMessagesVisible` (SQS).
- Track **message age** (time from publish to consume). P99 should be within SLA. A spike in message age is often the first signal of a slow consumer or downstream bottleneck.
- Use **schema registries** (Confluent Schema Registry for Kafka, custom for others) and enforce schema compatibility rules. Use backward-compatible schema evolution: add optional fields only, never remove or rename required fields. Validate at publish time, not only at consume time.
- Set up **end-to-end tracing** by propagating trace context (W3C traceparent header, or a custom `correlation_id` field) through the message envelope. Consumers extract and continue the trace span. This makes distributed debugging tractable.
- Tune consumer **prefetch/concurrency**: RabbitMQ `basicQos(prefetchCount=1)` for fair dispatch; Kafka `max.poll.records=500` with session timeout 45s and max poll interval 5 minutes for batch processing. Do not set prefetch too high -- it turns a distributed queue back into a centralized bottleneck.
- For Kafka: partition count determines maximum parallelism. A topic with 12 partitions can have at most 12 active consumers in a consumer group. Size partitions at initial design time -- repartitioning is operationally painful. A common formula: `partitions = max(desired_throughput / single_partition_throughput, desired_consumer_count * 2)`.

---

## Output Format

```
## Message Queue Pattern Design: [System Name]

### Delivery Requirements
| Requirement          | Value                    | Rationale                         |
|----------------------|--------------------------|-----------------------------------|
| Delivery guarantee   | at-least-once            | Consumer is idempotent             |
| Ordering requirement | Per-entity (partition)   | Entity updates must be sequential |
| Max acceptable lag   | 30 seconds P99           | SLA requirement                   |
| Retention            | 7 days                   | Replay and audit requirement      |

### Broker Selection
**Selected:** [Broker Name]
**Alternatives considered:** [Broker A] -- rejected because [specific reason]; [Broker B] -- rejected because [specific reason]
**Rationale:** [2-4 sentences on why this broker's semantics match the requirements]

### Topology Diagram (text)
[Producer Service]
      |
      | publishes OrderPlaced event
      v
[orders topic / exchange]
      |--- [Partition 0] --> [Inventory Service Consumer Group]
      |--- [Partition 1] --> [Inventory Service Consumer Group]
      |--- [Fanout]      --> [Audit Log Service]
                         --> [Notification Service]

### Queue/Topic Configuration
| Queue/Topic Name     | Partitions | Retention | DLQ Name              | Max Retries | Backoff       |
|----------------------|------------|-----------|----------------------|-------------|---------------|
| orders.placed        | 12         | 7 days    | orders.placed.dlq    | 5           | exp, 1s--5min |
| orders.payment.cmd   | 6          | 1 day     | orders.payment.dlq   | 3           | exp, 1s--2min |

### Consumer Design
**Consumer Group:** [group-name]
**Prefetch / max.poll.records:** [value]
**Idempotency mechanism:** [message ID + Redis SET NX / DB unique constraint / optimistic lock]
**Concurrency model:** [N threads / async coroutines / process pool]

### Message Envelope Schema
```json
{
  "id": "ulid or uuid-v4",
  "type": "OrderPlaced",
  "version": "1.0",
  "source": "order-service",
  "timestamp": "2024-03-15T10:30:00Z",
  "correlation_id": "trace-propagation-id",
  "payload": { ... },
  "metadata": {
    "retry_count": 0,
    "original_queue": null
  }
}
```

### Retry & DLQ Policy
| Error Type           | Action             | Max Attempts | Backoff Strategy       |
|----------------------|--------------------|--------------|------------------------|
| Network timeout      | Retry              | 5            | Exp, base 1s, cap 300s |
| Deserialization fail | DLQ immediately    | 1            | None                   |
| Business rule fail   | DLQ immediately    | 1            | None                   |
| DB connection error  | Retry              | 3            | Exp, base 2s, cap 60s  |

### Transactional Outbox (if applicable)
- Outbox table: [schema.outbox_events]
- Relay mechanism: [Debezium CDC / polling relay, interval Xs]
- Retention: [24h processed, 7d archived]

### Saga Design (if applicable)
- Saga type: [choreography / orchestration]
- Steps: [step1 -> step2 -> step3]
- Compensation: [step3_compensate -> step2_compensate -> step1_compensate]
- Timeout: [30 minutes]
- State table: [schema.saga_state]

### Monitoring & Alerting
| Metric                    | Warning Threshold | Critical Threshold | Tool              |
|---------------------------|-------------------|--------------------|-------------------|
| Consumer lag (seconds)    | >30s              | >120s              | Prometheus/Burrow |
| DLQ depth                 | >0                | >50                | CloudWatch/DD     |
| Message age P99           | >10s              | >60s               | Custom metric     |
| Consumer error rate       | >1%               | >5%                | APM               |

### Implementation Notes
- [Specific gotcha or non-obvious configuration detail]
- [Schema evolution policy]
- [Local development setup -- e.g., Docker Compose with broker]
```

---

## Rules

1. **Never perform a dual-write without the Transactional Outbox pattern.** Writing to a database and publishing to a message broker in two separate operations will eventually produce inconsistency. This is not a theoretical risk -- it will happen in production during network partitions, application restarts, and GC pauses.

2. **Every queue in production must have a corresponding Dead Letter Queue configured before the queue is used.** Deploying a queue without a DLQ means failed messages are silently dropped or endlessly requeued, causing invisible data loss or runaway retry storms.

3. **Never consume without acknowledging explicitly.** Auto-ack modes in RabbitMQ and implicit offset commits in Kafka (with `enable.auto.commit=true`) cause message loss when consumers crash between processing and commit. Always use manual acknowledgment and commit only after the processing operation is durably complete.

4. **Partition count is effectively immutable in Kafka -- size it correctly the first time.** Increasing partitions is possible but triggers consumer group rebalance, invalidates key-based ordering for existing keys, and disrupts stateful stream processing. Use the formula: `partitions = max(desired_throughput / single_partition_throughput, target_consumer_count * 2)`, minimum 3 for fault tolerance.

5. **Never use a message queue to synchronously block a request-response cycle longer than 2 seconds.** Request/Reply over queues becomes a liability at that latency. Users notice. If you need synchronous semantics, use a direct HTTP/gRPC call. Queues are for decoupling, not replacing synchronous communication with hidden latency.

6. **Message payload schemas must be versioned and backward compatible.** Adding a new required field to a message schema without a version bump will silently break all existing consumers. Use schema evolution rules: add optional fields only, never remove fields, never change field types. Increment the `version` field in the envelope and support N-1 versions in consumers during rolling deployments.

7. **Consumer concurrency must not exceed the safe concurrency level of downstream dependencies.** Spinning up 50 consumer threads that all query the same Postgres instance will cause connection exhaustion. Calculate: `max_consumers = (db_connection_pool_size * 0.8) / connections_per_consumer_thread`. For external APIs, apply rate limiting at the consumer level.

8. **Never log or store message payloads containing PII, credentials, or PCI data in DLQs, outbox tables, or monitoring systems without field-level encryption or tokenization.** Dead letter queues are often less secured than primary queues. Audit access controls on DLQs separately from operational queues.

9. **Saga compensating transactions must be idempotent and must always succeed.** A compensation that can fail leaves the saga in an unresolvable stuck state. Design compensations to be terminal -- they may log a failure if the forward action was never applied, but they must always complete the state machine transition. Use the "saga log" as the source of truth, not the state of external services.

10. **Consumer lag alerts must be time-based, not count-based, for variable-throughput systems.** 10,000 messages of lag means nothing without knowing throughput. At 50,000 msg/s that is 200ms of lag (fine). At 100 msg/s that is 100 seconds of lag (alert). Convert lag counts to time by dividing by the rolling average consumption rate over the last 5 minutes.

---

## Edge Cases

### Poison Message Handling
A poison message is one that consistently causes the consumer to crash or throw an unhandled exception. Without protection, the message is requeued indefinitely, crashing consumers in a loop.
- Implement a **delivery count check** before processing: if `delivery_count > max_retries`, route to DLQ without processing.
- In RabbitMQ, use the `x-delivery-count` header (requires `x-quorum-queue`). In Kafka, track redeliveries in a separate consumer offset store or use a counter in the message header set by the retry topic.
- For Kafka, implement a **retry topic chain**: `orders.placed` -> `orders.placed.retry.1` (delay 30s) -> `orders.placed.retry.2` (delay 5m) -> `orders.placed.retry.3` (delay 30m) -> `orders.placed.dlq`. Each retry topic is a separate topic with a consumer that applies the delay using `Thread.sleep` or a scheduled wakeup based on publish timestamp in the message header.
- Set a circuit breaker on the consumer that stops polling when the error rate exceeds 20% in a 60-second window. This prevents retry amplification from propagating failures downstream.

### Consumer Group Rebalancing Storms (Kafka)
When new consumers join or leave a consumer group, Kafka triggers a rebalance, during which all consumers stop processing. Frequent rebalances cause throughput collapse.
- Use **Cooperative Sticky Rebalancing** (KIP-429): set `partition.assignment.strategy=org.apache.kafka.clients.consumer.CooperativeStickyAssignor`. This allows incremental rebalancing -- only partitions that change ownership are revoked.
- Set `session.timeout.ms=45000` and `max.poll.interval.ms=300000` (5 minutes). Consumer processing that takes longer than `max.poll.interval.ms` is interpreted as a crashed consumer and triggers rebalance. Batch jobs that process large payloads must complete within this window or commit intermediate offsets.
- Use **static group membership** (`group.instance.id`) for consumers that are expected to return after a restart (e.g., Kubernetes pods with stable names). Static members get a `heartbeat.interval.ms * 3` grace period before their partitions are reassigned, preventing rebalance during rolling deployments.

### Schema Evolution Breaking Changes
A consumer deployed before a producer sends a new mandatory field will fail with a deserialization error.
- Never deploy a producer with a breaking schema change before all consumers are upgraded. Use a **consumer-first deployment order**: deploy consumers that handle both old and new schema versions, then deploy the producer that sends the new version.
- Maintain the previous schema version in the consumer for at least 2 release cycles (typically 2 weeks). After all producers are updated, deprecation of old schema support can begin.
- Use **Avro or Protobuf** with a schema registry for Kafka. These enforce compatibility modes at publish time (`BACKWARD`, `FORWARD`, `FULL`). `BACKWARD` is the safest default: new schema can read old messages. Reject schema registration that violates the configured compatibility mode.
- For JSON-based queues without a schema registry, enforce a `version` field in the message envelope and route to version-specific handler methods in the consumer.

### High-Volume Fan-out to Slow Consumers
When a topic has 50 subscribers and one subscriber is consistently slow, the slow subscriber's lag grows unboundedly while fast subscribers are current.
- In Kafka, each subscriber is an independent consumer group with its own offsets. A slow consumer group does not affect fast ones. Retention must be long enough to accommodate the slow consumer's maximum expected lag.
- In RabbitMQ fan-out, each subscriber has its own queue bound to the exchange. Set `x-max-length` and `x-overflow: reject-publish` or `drop-head` per queue so a slow subscriber's queue does not grow unboundedly and cause memory pressure on the broker.
- Implement **back-pressure signals** -- if a subscriber's queue depth exceeds a threshold, the subscriber service can publish a back-pressure event that the producer uses to reduce publish rate (token bucket at the producer level).
- For guaranteed delivery to slow subscribers that process analytically (reporting, data warehouse), consider a separate Kafka topic with longer retention (30 days) specifically for batch consumers, rather than forcing real-time consumers to wait.

### Exactly-Once Processing Without Broker Transactions
When using a broker that does not natively support transactions (SQS Standard, older RabbitMQ without quorum queues), achieve effectively-once semantics at the application level.
- Store a `processed_messages` table (or Redis hash) keyed by `message_id`. Before processing: `INSERT INTO processed_messages (id, processed_at) VALUES ($1, NOW()) ON CONFLICT DO NOTHING RETURNING id`. If no row is returned, the message was already processed -- skip it and ack.
- Use a **conditional update pattern**: include the expected current state in the update query. `UPDATE orders SET status='paid', version=5 WHERE id=$1 AND version=4`. If zero rows are updated, the message is a duplicate -- ack it without error.
- Set a Redis TTL on the dedupe key at 2x the maximum redelivery window. For SQS with a 14-day retention and 10 retries at 5-minute intervals, the dedupe window needs to be at least 7 days. Use `SETEX message_id 604800 1`.
- Be aware that none of these approaches are truly exactly-once -- they are at-least-once with idempotent handling. Document this distinction explicitly in architecture documentation.

### Ordering Guarantees with Multiple Producers
When multiple service instances produce to the same Kafka topic, partition-key-based ordering can be violated if different instances produce messages for the same entity out of order due to network delay.
- Use the entity ID as the partition key: `kafkaProducer.send(new ProducerRecord<>(topic, entityId.toString(), payload))`. This ensures all messages for the same entity go to the same partition, preserving order within that entity.
- For RabbitMQ, ordering is not guaranteed across multiple producers or after requeue. If order matters, use a single-active consumer per entity, or use consistent hashing exchange to route to a specific consumer.
- Do not conflate event ordering with causality. Use **vector clocks** or **logical timestamps** (a monotonically increasing sequence number per entity stored in the database) in the message envelope. Consumers can detect and handle out-of-order delivery by buffering events until the expected sequence number arrives.

### Broker Outage and Producer Resilience
When the message broker is unavailable, naive producers either drop messages or block indefinitely.
- Implement the **local fallback outbox**: on broker connection failure, write to the outbox table (which is always available as long as the DB is up). The outbox relay retries publication once the broker recovers. This is the same outbox used for the dual-write pattern -- getting it right solves two problems.
- Configure producer retries and timeouts explicitly: Kafka `retries=Integer.MAX_VALUE`, `delivery.timeout.ms=120000` (2 minutes), `acks=all`. For SQS, wrap `sendMessage` in a retry loop with a circuit breaker (fail open after 5 consecutive failures to avoid blocking request threads).
- Set **circuit breaker thresholds** on the producer: if 10 consecutive publish attempts fail within 30 seconds, open the circuit and route to the local outbox for 60 seconds before attempting to half-open. Libraries like Resilience4j or Polly implement this pattern.
- Never use unbounded retry loops on the producer in the hot path of a synchronous request. Offload to the outbox and return a response to the caller immediately.

---

## Example

**Input:** "We're building an e-commerce order processing system. When an order is placed, we need to: reserve inventory, charge the customer's card, send a confirmation email, and update the analytics warehouse. Services are in Python and Node.js. We're on AWS. What message queue pattern should we use and how should we set it up?"

**Output:**

## Message Queue Pattern Design: E-Commerce Order Processing

### Delivery Requirements

| Requirement        | Value                          | Rationale                                                       |
|--------------------|--------------------------------|-----------------------------------------------------------------|
| Delivery guarantee | At-least-once                  | All consumers will be idempotent; simpler than exactly-once     |
| Ordering           | Per-order (not global)         | Inventory and payment events for the same order must be ordered |
| Max acceptable lag | 5 seconds P99 (payment/inv), 60s (email/analytics) | Payment SLA is strict; email and analytics are best-effort |
| Retention          | 7 days                         | Replay for analytics backfill; audit requirement               |

### Broker Selection

**Selected:** Amazon SQS + Amazon SNS (fan-out topology)

**Alternatives considered:**
- Apache Kafka -- rejected because operational overhead is excessive for a team without Kafka expertise, and the throughput (expected 500--5,000 orders/day) does not justify it
- RabbitMQ on EC2 -- rejected because self-managed broker adds operational burden; no clear advantage over SQS at this scale
- Kafka on MSK -- rejected for same throughput reasons; revisit if daily orders exceed 500,000

**Rationale:** SNS publishes the `OrderPlaced` event to a single topic. Four SQS queues subscribe to that SNS topic -- one per downstream concern. This decouples the order service from all four consumers. SQS FIFO is used for inventory and payment (where order-per-entity matters and we need deduplication); SQS Standard is used for email and analytics (where ordering is irrelevant and higher throughput is preferred). All queues are managed by AWS -- zero broker operations.

### Topology Diagram

```
[Order Service (Python)]
         |
         | INSERT into outbox_events table (same DB transaction as order record)
         |
[Outbox Relay (Lambda, polls every 5s)]
         |
         | SNS Publish: OrderPlaced event
         v
[SNS Topic: ecommerce-order-events]
         |
         |--- [SQS FIFO: inventory-reservation.fifo]     --> [Inventory Service (Python)]
         |--- [SQS FIFO: payment-processing.fifo]        --> [Payment Service (Node.js)]
         |--- [SQS Standard: email-notifications]        --> [Email Service (Node.js)]
         |--- [SQS Standard: analytics-ingest]           --> [Analytics Worker (Python)]
         |
         Each SQS queue has a corresponding DLQ:
         inventory-reservation.fifo         --> inventory-reservation-dlq.fifo
         payment-processing.fifo            --> payment-processing-dlq.fifo
         email-notifications                --> email-notifications-dlq
         analytics-ingest                   --> analytics-ingest-dlq
```

### Queue Configuration

| Queue Name                    | Type     | Visibility Timeout | Retention   | DLQ                          | Max Receives | Dedup Window |
|-------------------------------|----------|--------------------|-------------|------------------------------|--------------|--------------|
| inventory-reservation.fifo    | FIFO     | 30s                | 7 days      | inventory-reservation-dlq    | 5            | 5 minutes    |
| payment-processing.fifo       | FIFO     | 60s                | 7 days      | payment-processing-dlq       | 3            | 5 minutes    |
| email-notifications           | Standard | 30s                | 4 days      | email-notifications-dlq      | 5            | N/A          |
| analytics-ingest              | Standard | 120s               | 14 days     | analytics-ingest-dlq         | 10           | N/A          |

**Notes:**
- Payment visibility timeout is 60s because the Stripe API call can take up to 20s and we need a safety margin.
- Analytics allows 10 receives because transient warehouse connection failures are expected during maintenance windows.
- FIFO dedup window is 5 minutes (the SQS maximum). MessageDeduplicationId is set to the `order_id + event_type` composite.

### Message Envelope Schema

```json
{
  "id": "01HV3QKZPJ5W8BXNQF2GTRDME7",
  "type": "OrderPlaced",
  "version": "1.0",
  "source": "order-service",
  "timestamp": "2024-03-15T10:30:00.000Z",
  "correlation_id": "req-7f3a9b2c-1d4e-4f5a-8c6b-9d0e1f2a3b4c",
  "payload": {
    "order_id": "ord_9f8e7d6c5b4a",
    "customer_id": "cust_1a2b3c4d",
    "items": [
      { "sku": "WIDGET-001", "quantity": 2, "unit_price_cents": 1999 }
    ],
    "subtotal_cents": 3998,
    "currency": "USD"
  },
  "metadata": {
    "retry_count": 0,
    "original_queue": null
  }
}
```

**Note:** Customer PII (name, email address) is NOT in the event payload. The email service fetches it from the customer service using `customer_id`. This prevents PII exposure in queue messages, DLQs, and CloudWatch logs.

### Transactional Outbox Implementation

The order service cannot safely call SNS.publish() in the same request that commits the order to the database -- a crash between the two operations would lose the event or create a phantom event.

**Outbox table (PostgreSQL):**

```sql
CREATE TABLE outbox_events (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type  VARCHAR(100) NOT NULL,
    aggregate_id UUID NOT NULL,
    payload     JSONB NOT NULL,
    sns_topic_arn VARCHAR(200) NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ NULL,
    error_message TEXT NULL
);

CREATE INDEX idx_outbox_unprocessed
    ON outbox_events (created_at)
    WHERE processed_at IS NULL;
```

**Order service (Python) -- within the order placement transaction:**

```python
async def place_order(conn, order_data: dict) -> str:
    async with conn.transaction():
        order_id = await conn.fetchval(
            "INSERT INTO orders (...) VALUES (...) RETURNING id",
            *order_data.values()
        )
        event_payload = build_order_placed_event(order_id, order_data)
        await conn.execute(
            """INSERT INTO outbox_events
               (event_type, aggregate_id, payload, sns_topic_arn)
               VALUES ($1, $2, $3, $4)""",
            "OrderPlaced",
            order_id,
            json.dumps(event_payload),
            os.environ["SNS_ORDER_EVENTS_ARN"]
        )
    return order_id
```

**Outbox relay (Lambda, triggered on 5-second EventBridge schedule):**

```python
def handler(event, context):
    rows = db.execute("""
        SELECT id, payload, sns_topic_arn
        FROM outbox_events
        WHERE processed_at IS NULL
        ORDER BY created_at
        LIMIT 50
        FOR UPDATE SKIP LOCKED
    """)
    for row in rows:
        try:
            sns.publish(
                TopicArn=row["sns_topic_arn"],
                Message=row["payload"],
                MessageGroupId=json.loads(row["payload"])["payload"]["order_id"],
                MessageDeduplicationId=row["id"]
            )
            db.execute(
                "UPDATE outbox_events SET processed_at = NOW() WHERE id = $1",
                row["id"]
            )
        except Exception as e:
            db.execute(
                "UPDATE outbox_events SET error_message = $1 WHERE id = $2",
                str(e), row["id"]
            )
```

### Saga Design: Payment + Inventory (Orchestration)

Payment and inventory reservation must be atomic at the business level. If payment fails, inventory must be released. If inventory is unavailable, payment must not be charged.

**Saga type:** Orchestration (dedicated Order Saga Lambda)

**Steps and compensation:**

```
Forward:
  1. ReserveInventory  --> InventoryService.reserve(order_id, items)
  2. ChargePayment     --> PaymentService.charge(order_id, amount, payment_method)
  3. ConfirmOrder      --> OrderService.confirm(order_id)

Compensation (executed in reverse):
  3. [No compensation for confirm -- emit OrderFailed event instead]
  2. RefundPayment     --> PaymentService.refund(order_id)  [idempotent: check refund_idempotency_key]
  1. ReleaseInventory  --> InventoryService.release(order_id)  [idempotent: check reservation status]
```

**Saga state table:**

```sql
CREATE TABLE order_saga_state (
    saga_id      UUID PRIMARY KEY,
    order_id     UUID NOT NULL UNIQUE,
    current_step VARCHAR(50) NOT NULL,
    status       VARCHAR(20) NOT NULL CHECK (status IN
                     ('STARTED','IN_PROGRESS','COMPLETED','COMPENSATING','FAILED')),
    payload      JSONB NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    timeout_at   TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '30 minutes'
);
```

**Timeout enforcement:** EventBridge rule runs every 5 minutes, queries `WHERE status NOT IN ('COMPLETED','FAILED') AND timeout_at < NOW()`, and triggers compensation for each timed-out saga.

### Idempotency Implementation (Inventory Service Example)

```python
async def reserve_inventory(order_id: str, items: list) -> bool:
    # Idempotency check -- prevents duplicate reservation on retry
    existing = await db.fetchrow(
        "SELECT status FROM inventory_reservations WHERE order_id = $1",
        order_id
    )
    if existing:
        return existing["status"] == "RESERVED"  # Already done, return cached result

    # Attempt reservation
    async with db.transaction():
        for item in items:
            updated = await db.fetchval("""
                UPDATE inventory
                SET reserved_qty = reserved_qty + $1
                WHERE sku = $2
                  AND (available_qty - reserved_qty) >= $1
                RETURNING id
            """, item["quantity"], item["sku"])
            if not updated:
                raise InsufficientInventoryError(item["sku"])

        await db.execute("""
            INSERT INTO inventory_reservations (order_id, items, status, created_at)
            VALUES ($1, $2, 'RESERVED', NOW())
        """, order_id, json.dumps(items))

    return True
```

### Retry & DLQ Policy

| Consumer         | Error Type                  | Action          | Max Attempts | Backoff                    |
|------------------|-----------------------------|-----------------|--------------|----------------------------|
| Inventory        | DB connection error         | Retry           | 5            | Exp 1s, cap 30s, jitter 25% |
| Inventory        | InsufficientInventoryError  | DLQ immediately | 1            | None -- business failure    |
| Payment          | Stripe timeout              | Retry           | 3            | Exp 2s, cap 60s            |
| Payment          | Stripe card_declined        | DLQ immediately | 1            | None -- trigger compensation |
| Email            | SMTP connection error       | Retry           | 5            | Exp 1s, cap 120s           |
| Analytics        | Warehouse connection error  | Retry           | 10           | Exp 5s, cap 300s           |

### Monitoring & Alerting

| Metric                              | Warning    | Critical   | Tool                          |
|-------------------------------------|------------|------------|-------------------------------|
| inventory-reservation queue depth   | >100 msgs  | >500 msgs  | CloudWatch SQS metrics        |
| payment-processing queue depth      | >50 msgs   | >200 msgs  | CloudWatch SQS metrics        |
| Any DLQ depth                       | >0         | >10        | CloudWatch Alarm -> PagerDuty |
| Saga timeout rate (per hour)        | >5         | >20        | Custom CloudWatch metric      |
| Outbox relay lag (unprocessed rows) | >50        | >200       | RDS query -> CloudWatch       |
| Order saga P99 completion time      | >60s       | >180s      | X-Ray trace percentile        |

### Local Development Setup

```yaml
# docker-compose.yml
services:
  localstack:
    image: localstack/localstack:3.2
    ports: ["4566:4566"]
    environment:
      SERVICES: sqs,sns
      DEFAULT_REGION: us-east-1
    volumes:
      - ./localstack-init:/etc/localstack/init/ready.d

  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: orders
      POSTGRES_USER: app
      POSTGRES_PASSWORD: localdev
    ports: ["5432:5432"]
```

```bash
# localstack-init/01-queues.sh -- runs on container start
awslocal sns create-topic --name ecommerce-order-events
awslocal sqs create-queue --queue-name inventory-reservation.fifo \
  --attributes FifoQueue=true,ContentBasedDeduplication=false
awslocal sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:000000000000:ecommerce-order-events \
  --protocol sqs \
  --notification-endpoint arn:aws:sqs:us-east-1:000000000000:inventory-reservation.fifo
```

### Implementation Notes

- The FIFO message group ID is set to `order_id`. This means all events for the same order are processed sequentially by the same consumer (within that queue), preventing race conditions on order state.
- `MessageDeduplicationId` is the outbox row UUID. This ensures that if the outbox relay publishes twice before marking processed (e.g., Lambda timeout after publish but before DB update), SNS/SQS deduplicates within the 5-minute window.
- The analytics-ingest queue uses SQS Standard (not FIFO) because the analytics warehouse can tolerate out-of-order inserts and duplicate handling is done at the warehouse layer using `MERGE` / `INSERT ... ON CONFLICT DO UPDATE`.
- All Lambda consumers use SQS event source mappings with `batchSize=1` for payment and inventory (to simplify partial batch failure handling) and `batchSize=10` for email and analytics (throughput optimization).
- Schema changes to `OrderPlaced` follow consumer-first deployment: update email and analytics consumers to accept both `version: "1.0"` and `version: "1.1"` before deploying the order service that emits `1.1`.
