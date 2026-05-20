---
name: streaming-data-architecture
description: |
  Designs a streaming data architecture defining event schema, producer configuration, consumer processing logic, state management approach, and fault tolerance strategy. Produces a system specification document for real-time data pipelines.
  Use when the user asks to design a real-time data pipeline, build an event-driven architecture, implement stream processing, or plan a system that processes data as it arrives rather than in batches.
  Do NOT use for batch ETL pipelines (use etl-pipeline-design), data warehouse design (use data-warehouse-design), or API data extraction (use api-data-extraction).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "data-science analysis planning"
  category: "data-analysis"
  subcategory: "data-engineering"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---
# Streaming Data Architecture

## When to Use

**Use this skill when:**
- The user needs to design a real-time pipeline that processes events as they arrive -- common triggers include "detect fraud as transactions happen," "alert when IoT sensors exceed thresholds," "update dashboards with live clickstream data," or "replicate database changes to downstream systems in real time"
- The user wants to move from a nightly batch job to a continuous processing model, and needs help reasoning through the architectural trade-offs, not just the code
- The user is building a system with multiple independent consumers that each need to react to the same event stream -- for example, an order event that simultaneously feeds a fraud scorer, an inventory service, a notification system, and an analytics aggregator
- The user asks about choosing between streaming technologies such as Kafka, Pulsar, Kinesis, Flink, Spark Streaming, or Kafka Streams, and needs a framework to make the right choice for their use case
- The user needs to design event schemas with forward and backward compatibility guarantees, especially when producer and consumer teams deploy independently
- The user is designing a change data capture (CDC) pipeline to stream database mutations to downstream systems in near real time
- The user has a latency requirement under 60 seconds that cannot be met by micro-batch ETL scheduled runs
- The user needs to perform windowed aggregations over live data -- counting events per user per 5 minutes, computing rolling averages, or detecting velocity patterns

**Do NOT use when:**
- The user wants a scheduled ETL job that runs hourly or nightly, even if the destination is a streaming-adjacent system -- use `etl-pipeline-design`
- The user wants to design a data warehouse schema, dimensional model, or OLAP layer -- use `data-warehouse-design`
- The user wants to poll an external API on a schedule to extract data -- use `api-data-extraction`
- The user wants to set up alerting, dashboards, or observability for an already-designed pipeline -- use `data-pipeline-monitoring`
- The user only needs a simple pub-sub notification system with no aggregation or state -- a message queue like SQS or RabbitMQ may be sufficient and this level of architecture would be overengineering
- The user's "real-time" requirement is actually "within 15 minutes" -- a micro-batch Spark job on a 5-minute schedule is simpler to operate and may be the right tool

---

## Process

### Step 1: Establish the Use Case and Non-Negotiable Requirements

Before touching schema or technology, extract the constraints that eliminate entire design families.

- **Latency target:** Distinguish between sub-100ms (CEP / complex event processing required), 1-5 seconds (standard stream processing), 5-30 seconds (micro-batch acceptable), 30-300 seconds (Lambda or Kappa with mini-batches). The latency target determines whether you need a full streaming engine or whether a simple consumer loop suffices.
- **Event rate and volume:** Gather peak events per second (EPS), average EPS, and expected growth rate. Under 10,000 EPS, a single-partition Kafka topic with a simple consumer loop handles everything. At 100,000+ EPS, partition count, consumer parallelism, and serialization format become primary design concerns.
- **Delivery semantics:** Ask explicitly -- "what happens if a fraud check runs twice on the same order?" vs "what happens if a sensor reading is silently dropped?" This determines whether you need at-most-once, at-least-once, or exactly-once semantics. Note that exactly-once requires idempotent producers, transactional writes, and often a 30-50% throughput penalty.
- **Event loss tolerance:** Assign a cost category: financial loss (no tolerance, requires durable acks and replication factor >= 3), degraded analytics (low tolerance, at-least-once acceptable), logging/telemetry (some tolerance, at-most-once may be fine). This directly sets replication factor, ack mode, and durability configuration.
- **Stateful vs stateless processing:** Ask whether any computation requires knowledge of previous events. Stateless processing (filter, transform, route) is dramatically simpler to scale and recover. Stateful processing (counts, aggregations, session detection, joins between streams) requires explicit state management strategy and is where most streaming systems fail at production scale.
- **Consumer independence:** Ask how many downstream systems need the same events. Fan-out to 3+ consumers is a strong signal to use a persistent log (Kafka, Pulsar, Kinesis) over a destructive queue (RabbitMQ, SQS) so each consumer maintains its own offset and can replay independently.

### Step 2: Design the Event Schema and Serialization Strategy

Event schema is the contract between producers and consumers. Mistakes here propagate across the entire system and are expensive to fix.

- **Universal metadata envelope:** Every event, regardless of type, must carry these fields in a consistent outer envelope: `event_id` (UUIDv4 or ULID -- ULID is preferable because it is lexicographically sortable by time), `event_type` (dot-namespaced string like `order.placed` or `sensor.reading`), `event_timestamp` (ISO-8601 with millisecond precision, from the originating system, NOT the time the message was written to the broker -- this distinction matters for out-of-order handling), `ingested_at` (broker write time for lag computation), `schema_version` (semantic version string), `source_system` (service identifier), `correlation_id` (for distributed tracing across services), `partition_key` (the field value that was used for partitioning, denormalized into the event for debugging).
- **Payload design principles:** Prefer fat events (include enough context that downstream consumers can act without making synchronous API calls) over thin events (just an ID that forces consumers to fetch from upstream). Fat events increase message size but eliminate consumer coupling to upstream APIs, which is critical for resilience. A thin event "order 12345 placed" forces the fraud service to call the order API for details -- if the API is down, fraud scoring stops. A fat event includes order amount, customer ID, and shipping details in the payload.
- **Serialization format selection:**
  - **JSON:** Human-readable, zero schema enforcement, highest per-message overhead (2-5x size of binary formats). Use for low-volume systems (<1,000 EPS), debugging environments, or when consumers are polyglot and cannot easily run Avro/Protobuf libraries.
  - **Apache Avro:** Schema stored in a schema registry; messages contain only a schema ID (4-6 bytes) and binary-encoded payload. Excellent for Kafka. Supports schema evolution with defined compatibility modes (BACKWARD, FORWARD, FULL). Best default choice for most Kafka-based systems.
  - **Protocol Buffers (Protobuf):** Field-tagged binary format. No schema registry required (schemas are distributed as .proto files). Slightly more verbose schema definition than Avro but excellent language support. Preferred when non-JVM consumers (Go, Rust, C++) are significant.
  - **Apache Parquet or ORC:** NOT appropriate for individual event messages. These are columnar formats for batch reads. Do not design streaming events in these formats.
- **Schema registry integration:** For Avro or Protobuf, every schema must be registered in a schema registry before any producer writes to a topic. The schema registry enforces compatibility rules. Set the compatibility mode per subject (per topic): BACKWARD_TRANSITIVE means all existing consumers can read all new messages. This prevents silent data corruption when schemas drift.
- **Schema evolution rules:** Establish these policies upfront and enforce them via the registry: adding optional fields is always safe; removing fields requires a deprecation period during which old consumers are migrated off the field; changing field types is forbidden (add a new field of the new type instead); renaming fields requires adding the new name as an alias and deprecating the old name over two release cycles.
- **Null handling:** Explicitly define whether null is a valid value for each field or whether the field should simply be absent. In Avro, nullable fields must be declared as a union type `["null", "string"]`. Undefined behavior around nulls causes NullPointerExceptions in consumers that are painful to diagnose at runtime.

### Step 3: Design the Message Transport Layer

The transport layer -- topic structure, partitioning, and retention -- is the backbone of the architecture. Mistakes here require reprocessing from scratch.

- **Topic/stream naming convention:** Establish a naming scheme before creating any topics. A reliable convention: `{domain}.{entity}.{event_verb}` -- for example, `commerce.order.placed`, `commerce.order.fulfilled`, `iot.sensor.reading`. This enables namespace-based ACL policies (the fraud team gets read access to `commerce.*`) and makes consumer code self-documenting.
- **Partition count selection:** Partition count determines maximum consumer parallelism and cannot be reduced after creation (in Kafka, it can only be increased, which invalidates key-based ordering guarantees). Calculate as: `ceil(peak_EPS / per_partition_throughput)`. A Kafka partition safely handles 10-40 MB/s depending on hardware; for most application events (1-2 KB per event), a single partition handles ~10,000-20,000 events/second. Add 20-30% headroom. For a 2,000 EPS peak system, 4-6 partitions is appropriate. For 100,000 EPS, 12-24 partitions.
- **Retention period:** Set by the slowest legitimate consumer, plus recovery time buffer. If the downstream data warehouse loads every hour, set retention to 72 hours minimum so you can recover from a 2-day warehouse outage without event loss. For regulatory replay requirements (financial transactions, healthcare events), set a separate archival topic with indefinitely-retained tiered storage.
- **Replication factor:** Never less than 3 in production for any topic you care about. Replication factor 2 means a single broker failure can cause data loss if the leader crashes before the follower has fully replicated. Set `min.insync.replicas=2` with replication factor 3 to require acknowledgment from at least 2 replicas before considering a write successful.
- **Partitioning key strategy:** This is one of the most consequential decisions in the design. Key options:
  - **Entity key (user_id, device_id, order_id):** Guarantees all events for one entity are in the same partition, preserving order per entity. Use when stateful processing needs to see all events for an entity together. Risk: hot partitions if some entities generate far more events than others (power users, popular devices).
  - **Random/round-robin:** Maximum throughput and even distribution. No ordering guarantee. Use for stateless consumers that do not need to see events from the same entity together.
  - **Composite key (user_id + day):** Spreads a power user's events across multiple partitions over time, but groups them within a day. Useful for time-windowed aggregations where daily boundaries align with partition boundaries.
  - **Null key with sticky partitioner:** Kafka's default for null-key messages -- batches messages to the same partition until the batch is full or the linger time expires, improving throughput without requiring a meaningful key.
- **Compacted topics:** For events that represent current state (user profile updates, feature flag changes, device configuration), use log-compacted topics instead of retention-by-time. Kafka will retain only the most recent message per key, providing a changelog that new consumers can replay to reconstruct current state without reading years of history.

### Step 4: Design Producer Configuration

Producers are often the least-designed component of streaming systems, but misconfigured producers cause silent data loss and message duplication.

- **Idempotent producer mode:** In Kafka, enable `enable.idempotence=true` on all producers. This ensures that retried messages due to network timeouts do not create duplicate entries in the topic. This is a nearly free correctness guarantee and should be on by default -- the only cost is that the broker assigns a sequence number to each message batch.
- **Acknowledgment mode:**
  - `acks=0`: Fire and forget. Fastest but messages can be lost if the broker crashes between receive and write. Only appropriate for low-value telemetry data where some loss is acceptable.
  - `acks=1`: Leader acknowledges. Message survives leader crash only if a follower has replicated it before the crash. Acceptable for non-critical analytics events.
  - `acks=all` (or `acks=-1`): All in-sync replicas acknowledge. Highest durability. Required for financial, health, and any event where loss has real consequences. Use in combination with `min.insync.replicas=2`.
- **Producer batching:** Configure `linger.ms` (how long the producer waits to accumulate a batch before sending) and `batch.size` (maximum batch size in bytes). For high-throughput producers, `linger.ms=5` and `batch.size=65536` (64 KB) dramatically improves throughput with negligible latency increase. For low-latency critical events, `linger.ms=0` sends immediately.
- **Compression:** Enable `compression.type=lz4` for most use cases -- it achieves 3-5x compression ratio on JSON events with minimal CPU overhead. For very high throughput (>100 MB/s), `snappy` has slightly lower latency. Avoid `gzip` in the hot path; it is 5-10x slower to compress than lz4 and the size difference is marginal.
- **Circuit breaker at the producer:** If the message broker is unavailable, producers must not silently drop events. Implement a local disk-backed buffer (SQLite or a write-ahead log file) that stores events during broker outages and replays them on reconnection. Define a maximum buffer size -- when the buffer is full, the producer must either block the upstream operation or fail the request with a clear error (not silently discard).
- **Change Data Capture (CDC) producers:** When the event source is a database rather than an application, use a CDC tool (Debezium is the standard choice) to stream database transaction logs to Kafka. CDC events have a specific structure: they include `before` (state before the change), `after` (state after), and `op` (operation: 'c' create, 'u' update, 'd' delete, 'r' snapshot read). Consumer schemas must be designed to handle all four operation types.

### Step 5: Design Consumer Processing Logic

Consumers are where the business logic lives and where most streaming system complexity concentrates.

- **Consumer group design:** Each independent downstream system must be its own consumer group. All instances of the fraud detection service share one consumer group (`fraud-detection`); all instances of the analytics service share another (`analytics-aggregator`). This allows each group to read at its own pace, maintain its own offset, and fail independently. Never have two logically different applications share a consumer group.
- **Stateless processing patterns:**
  - **Filter:** Discard events that do not meet criteria. Implement by reading from input topic and writing only matching events to an output topic. Keep filter logic pure (no external calls) to maintain throughput.
  - **Enrichment/transformation:** Add fields from a lookup table or translate formats. For high-throughput enrichment, cache the lookup data locally (in-process cache with TTL refresh) rather than making a remote API call per event -- a 5ms API call at 10,000 EPS adds 50 seconds of processing time per second of events.
  - **Routing/fan-out:** Split one input stream into multiple output topics based on event content. Route `payment_method=crypto` events to a separate high-scrutiny topic while routing standard payment events to the normal fraud topic.
- **Stateful processing patterns:**
  - **Windowed aggregation:** Count or sum events within a time window. Three window types to know: (1) Tumbling windows -- fixed, non-overlapping intervals (count of orders per customer per 1-hour window). (2) Sliding windows -- fixed size that advances by a smaller step (5-minute window advancing every 30 seconds, giving overlapping counts for velocity detection). (3) Session windows -- grouped by activity gaps (all events within 30 minutes of each other form one session, regardless of clock time).
  - **Stream-table joins:** Enrich a stream event with current state from a compacted topic (treated as a table). Example: join every `order.placed` event with the current state from the `customer.profile` compacted topic to attach credit score tier at the time of the order.
  - **Stream-stream joins:** Join two time-bounded event streams. Example: join `order.placed` events with `payment.authorized` events where both have the same order_id and the payment arrives within 5 minutes of the order. Requires bounded time windows and careful handling of cases where one side never arrives.
  - **Pattern detection (CEP):** Detect sequences of events matching a pattern. Example: "3 failed login attempts followed by a successful login within 2 minutes from a new IP." Frameworks: Flink CEP library, or custom state machines using Kafka Streams' stateful transformations.
- **State store selection:**
  - **In-process RocksDB (Kafka Streams default):** Durable local state backed by changelog topic in Kafka. Survives restarts by replaying the changelog. Best default for Kafka Streams applications. Limitation: state is co-located with the consumer instance, so scaling requires state redistribution.
  - **External cache (Redis):** Useful when state must be shared across consumer instances or accessed by non-streaming applications (e.g., the fraud score UI needs to read the same state as the fraud scorer). Adds network latency per state access (0.5-2ms). Set appropriate TTLs to prevent unbounded memory growth.
  - **External database (PostgreSQL, Cassandra):** Use when state requires complex queries (multi-key lookups, range scans) that key-value stores cannot support. PostgreSQL is fine for state stores up to tens of millions of keys. Cassandra handles billions of keys with multi-region replication. Never use a relational database as a state store for a consumer processing >1,000 EPS unless writes are highly optimized (batch inserts, connection pooling, upsert-based updates).
- **Offset commit strategy:** Never commit offsets before processing is complete. The default Kafka consumer auto-commit commits the offset on a timer, which can commit an offset before the corresponding event was successfully processed -- if the consumer then crashes, that event is silently lost. Disable auto-commit (`enable.auto.commit=false`) and commit offsets manually only after successful processing and output acknowledgment.

### Step 6: Design Fault Tolerance and Recovery

A streaming system that cannot recover correctly from failures is not a streaming system -- it is a liability.

- **At-least-once delivery with idempotent consumers:** The most practical delivery semantic for production systems. The producer may retry, the broker may re-deliver, and the consumer must handle duplicates. Design consumers to be idempotent: processing the same event twice produces the same result as processing it once. Techniques: use `event_id` as a deduplication key in the output database (upsert instead of insert); check for existence before writing; use conditional writes (write only if `event_id` not in deduplication table within last 24 hours).
- **Exactly-once semantics (EOS):** Available in Kafka via transactional producers and the Streams API. The mechanism: producer writes to all output partitions and commits offsets atomically in a single transaction. If the transaction aborts, all writes are rolled back. Consumers reading with `isolation.level=read_committed` will not see uncommitted messages. EOS reduces throughput by approximately 30-50% due to coordination overhead. Only use EOS when business requirements explicitly forbid duplicates AND idempotent consumer design is not feasible.
- **Dead letter queue (DLQ) design:** Every consumer must route unprocessable messages to a DLQ after a configurable number of retries (typically 3). DLQ topic naming: `{original-topic}.dlq` -- for example, `orders.placed.dlq`. The DLQ message must include all original fields plus additional metadata: `dlq_reason` (the exception type and message), `dlq_attempt_count` (number of processing attempts), `dlq_first_failure_timestamp`, `dlq_last_failure_timestamp`, `consumer_group` (which consumer failed), `original_partition`, `original_offset`. This metadata is essential for root-cause analysis and selective reprocessing.
- **Consumer lag management:** Consumer lag (the number of messages in a topic that have not yet been consumed by a consumer group) is the primary health metric of a streaming system. Define three lag thresholds: (1) WARNING -- lag is growing but SLA is not yet breached (begin scaling investigation); (2) CRITICAL -- lag growth rate means SLA will be breached within N minutes (scale consumers immediately); (3) EMERGENCY -- lag is so large that replaying from current position will not catch up before retention expires (escalate, consider point-in-time replay from a known-good offset). Alert on lag as a rate of change, not just an absolute number -- a lag of 100,000 messages is fine if it is decreasing; alarming if it is increasing.
- **Reprocessing strategy:** Define a reprocessing runbook before you need it. For Kafka-based systems: consumer groups can be reset to any committed offset using `kafka-consumer-groups.sh --reset-offsets`. Define who has authority to trigger a reprocess, what downstream systems need to be notified (output databases may need to be cleared or deduplicated), and what the SLA is for completing a full replay of 24 hours of events.
- **Cascading failure prevention:** If consumer processing depends on an external service (database, API, state store), that dependency must have a circuit breaker and a fallback path. Without a circuit breaker, a 5-second database outage causes the consumer to retry thousands of times, creating a thundering herd when the database recovers. The fallback path should log what degraded behavior occurred so it can be reconciled later.

### Step 7: Produce the Architecture Specification Document

Compile all design decisions into the structured specification document defined in the Output Format section. Ensure the document contains:

- A system overview that a new engineer could read and understand the purpose and constraints in under 5 minutes
- Complete event schemas with all fields defined (type, nullable, description), not placeholder names
- All partitioning key decisions with rationale documented inline -- this prevents future engineers from "fixing" the partitioning key and breaking ordering guarantees
- Consumer processing logic described in enough detail that it can be implemented without further design discussion
- The monitoring section must include specific threshold values, not "to be determined" -- thresholds that have not been set before production will not be set until after the first incident
- An explicit section on known trade-offs made: why exactly-once was or was not used, why a particular partition count was chosen, why a particular state store technology was selected

---

## Output Format

```
## Streaming Architecture: [System Name]

### 1. System Overview

| Property | Value |
|----------|-------|
| Use case | [Specific business problem being solved] |
| Peak event rate | [EPS at peak load] |
| Average event rate | [EPS at steady state] |
| End-to-end latency target | [p99 target in seconds] |
| Delivery guarantee | [At-most-once / At-least-once / Exactly-once] |
| Message transport | [Technology: Kafka / Kinesis / Pulsar + version/tier] |
| Stream processing engine | [Kafka Streams / Flink / Spark Structured Streaming / custom consumer] |
| Schema format | [JSON / Avro / Protobuf] |
| Schema registry | [Confluent Schema Registry / AWS Glue / none] |

**Key trade-offs made:**
- [Trade-off 1: e.g., "Chose at-least-once over exactly-once to preserve throughput; consumers are idempotent"]
- [Trade-off 2: e.g., "Fat events chosen over thin events to eliminate consumer coupling to order API"]
- [Trade-off 3: e.g., "Partition count set to 12 to allow future growth without topic recreation"]

---

### 2. Event Schema Definitions

#### 2.1 [event_type_name] (e.g., order.placed)

**Envelope (all events):**
```json
{
  "event_id": "01HQZX... (ULID)",
  "event_type": "[domain].[entity].[verb]",
  "event_timestamp": "2026-02-26T14:30:00.123Z",
  "ingested_at": "2026-02-26T14:30:00.145Z",
  "schema_version": "1.2.0",
  "source_system": "[service-name]",
  "correlation_id": "uuid-v4",
  "partition_key": "[value used as partition key]"
}
```

**Payload (event-specific):**
```json
{
  "data": {
    "[field_name]": {
      "type": "[string | integer | decimal | boolean | object | array]",
      "nullable": [true | false],
      "description": "[what this field means]",
      "example": "[realistic example value]"
    }
  }
}
```

- **Serialization:** [JSON / Avro / Protobuf]
- **Schema registry subject:** [topic-name-value]
- **Compatibility mode:** [BACKWARD_TRANSITIVE / FORWARD_TRANSITIVE / FULL]
- **Evolution rules:** [Specific rules for this event type]

#### 2.2 [Additional event types follow same format]

---

### 3. Producer Configuration

| Producer ID | Source System | Output Topic | Partition Key | Ack Mode | Idempotent | Compression | Fallback on Broker Unavailable |
|-------------|--------------|-------------|---------------|----------|-----------|-------------|-------------------------------|
| [id] | [service] | [topic name] | [key field] | [acks=all/1/0] | [yes/no] | [lz4/snappy/none] | [local buffer / fail request / drop] |

**Producer-specific configuration notes:**
- [Producer ID]: [Any non-standard configuration: batching, linger.ms, special serialization, CDC source details]

---

### 4. Topic / Stream Design

| Topic Name | Partitions | Retention | Replication Factor | min.insync.replicas | Compaction | Purpose |
|-----------|-----------|-----------|-------------------|--------------------|-----------|---------| 
| [topic] | [n] | [7d / 30d / indefinite] | [3] | [2] | [yes/no] | [brief description] |

**Dead letter topics:**

| DLQ Topic | Source Topic | Retention | Partition Count | Consumer |
|-----------|-------------|-----------|-----------------|----------|
| [topic.dlq] | [source] | [90d] | [1] | [manual review process] |

---

### 5. Consumer Design

#### Consumer [N]: [Consumer Name]

| Property | Value |
|----------|-------|
| Consumer group ID | [group-name] |
| Input topic(s) | [topic names] |
| Processing type | [Stateless / Stateful] |
| Framework | [Kafka Streams / Flink / custom consumer loop] |
| Instance count (normal) | [n] |
| Instance count (peak) | [n] |
| Scaling trigger | [consumer lag > X messages / CPU > Y%] |

**Processing logic:**
1. [Step 1 of what this consumer does]
2. [Step 2]
3. [Continue for all processing steps]

**State management (if stateful):**

| State Store | Technology | Data Stored | Key | TTL | Recovery Method |
|------------|-----------|-------------|-----|-----|----------------|
| [store name] | [RocksDB / Redis / PostgreSQL] | [what is stored] | [key field] | [TTL value] | [changelog replay / cache rebuild / cold start] |

**Window definitions (if windowed):**

| Window | Type | Size | Advance / Gap | Purpose | Late Event Handling |
|--------|------|------|---------------|---------|-------------------|
| [name] | [Tumbling/Sliding/Session] | [duration] | [advance or gap duration] | [what it computes] | [drop / route to late-event topic / extend window] |

**Output:**

| Destination | Type | Write Mode | Idempotency Key |
|------------|------|-----------|----------------|
| [db / topic / API] | [table / topic name / endpoint] | [upsert / insert / publish] | [field used for dedup] |

**Fault handling:**

| Failure Mode | Retry Count | Retry Delay | After Max Retries | Fallback Behavior |
|-------------|-------------|-------------|------------------|------------------|
| [Database write failure] | [3] | [exponential: 1s, 2s, 4s] | [route to DLQ] | [continue processing next event] |
| [State store unavailable] | [2] | [500ms] | [degraded mode] | [describe degraded processing] |
| [Deserialization failure] | [0] | [n/a] | [route to DLQ immediately] | [n/a] |

---

### 6. Fault Tolerance Summary

| Failure Scenario | Detection Method | Recovery Steps | Expected Data Impact | RTO |
|-----------------|-----------------|---------------|---------------------|-----|
| Consumer instance crash | Consumer group heartbeat timeout ([n]s) | [Partition rebalance; restart instance] | [Events delayed by rebalance time; none lost] | [<60s] |
| Message broker unavailable | Producer connection failure | [Producer activates local buffer; alert ops; restore broker] | [Events buffered up to [X] GB; replayed on recovery] | [depends on broker HA config] |
| Poison message | Deserialization exception or processing exception | [Route to DLQ after [n] retries] | [Single event unprocessed; isolated in DLQ] | [Immediate; does not block pipeline] |
| State store unavailable | Connection timeout | [Activate fallback / degraded mode; alert ops] | [Describe what degrades] | [<30s for cache; longer for DB] |
| Consumer lag growth | Lag monitoring metric | [Scale consumers; alert] | [Processing delayed; SLA at risk if not resolved] | [<5 min with auto-scale] |
| Out-of-order events | Watermark check in window processor | [Accept within watermark; route late events to late-event topic] | [Windows accurate within watermark bound] | [n/a -- by design] |

---

### 7. Reprocessing Runbook

- **Trigger conditions:** [List scenarios that require reprocessing -- e.g., state store corruption, downstream system outage lasting >X hours, bug in consumer logic]
- **Authority required:** [Who can approve a reprocess -- team lead, on-call engineer]
- **Steps:**
  1. Pause consumer group: `kafka-consumer-groups.sh --bootstrap-server [broker] --group [group] --topic [topic] --reset-offsets --to-datetime [ISO timestamp] --dry-run`
  2. Validate the reset offset and estimated replay volume
  3. Notify downstream systems that may receive duplicate or corrected events
  4. Clear or archive affected records in output database if applicable
  5. Resume consumer with reset offset: remove `--dry-run`
  6. Monitor lag curve to verify catch-up rate
- **Estimated replay rate:** [Events per second the consumer can replay at full speed]
- **Estimated catch-up time for 24-hour replay:** [Calculated: 24h * 3600s * avg_EPS / consumer_replay_rate]

---

### 8. Monitoring and Alerting

| Metric | Source | Warning Threshold | Critical Threshold | Alert Channel | Notes |
|--------|--------|------------------|-------------------|---------------|-------|
| Consumer lag (max across partitions) | Broker metrics | [X messages] | [Y messages] | [Slack / PagerDuty] | [Calculate: alert when lag growth rate implies SLA breach in <10 min] |
| End-to-end latency (p99) | event_timestamp to output write time | [X% of SLA target] | [SLA target] | [PagerDuty] | [Compute in consumer; emit as metric] |
| DLQ message rate | DLQ topic consumer lag | [>0 in 5 min] | [>50 in 1 hour] | [Slack #data-ops] | [Any DLQ activity warrants investigation] |
| Producer error rate | Producer client metrics | [0.01% of sends] | [0.1% of sends] | [PagerDuty] | [Sudden increase indicates broker or network issue] |
| Schema validation failure rate | Consumer deserialization errors | [0.01%] | [0.1%] | [Slack #data-ops] | [May indicate producer-side schema drift] |
| State store operation latency (p99) | Consumer metrics | [10ms] | [50ms] | [Slack #data-ops] | [Above 50ms directly impacts end-to-end latency] |
| Topic disk usage | Broker metrics | [70% of capacity] | [85% of capacity] | [Slack #infra] | [May need to reduce retention or expand storage] |
```

---

## Rules

1. **NEVER omit the delivery guarantee from the specification.** At-most-once, at-least-once, and exactly-once have different producer configurations, consumer logic requirements, and performance characteristics. Omitting this declaration means each component author makes an independent assumption, and those assumptions will contradict each other in production. Exactly-once on Kafka requires `enable.idempotence=true`, transactional API, and `isolation.level=read_committed` on consumers -- all three must be configured together or EOS does not work.

2. **ALWAYS set `acks=all` and `min.insync.replicas=2` together for any data with financial, health, or regulatory significance.** Setting `acks=all` with a replication factor of 3 but leaving `min.insync.replicas=1` (the default) means the broker considers a write durable after only one replica has it -- one broker crash and the data is gone. These two settings are a package deal.

3. **NEVER partition by a field with low cardinality.** Partitioning by `payment_method` (values: credit, debit, paypal, crypto) with 12 partitions means 8 partitions are always empty and all consumers are idle. Partition count must not exceed the cardinality of the partition key. For low-cardinality fields, use a composite key or a derived hash (e.g., `customer_id % 12` distributes evenly without depending on payment method).

4. **ALWAYS disable auto-commit (`enable.auto.commit=false`) on consumers that write to external systems.** Auto-commit uses a timer, not confirmation of successful processing. A crash between the auto-commit firing and the database write completing silently loses events. Commit offsets manually only after the output write is confirmed. Accept that this means duplicate processing is possible on restart -- design the consumer to be idempotent.

5. **NEVER put the processing framework before the use case.** Do not start with "we'll use Flink" and design around Flink's capabilities. Start with latency requirement, event rate, and stateful complexity, then select the framework: Kafka Streams for simple stateful processing within a Kafka ecosystem; Apache Flink for complex CEP, stream-stream joins, or multi-input stateful processing; Spark Structured Streaming for teams with existing Spark infrastructure where micro-batch latency is acceptable; a simple Kafka consumer loop in any language for stateless processing regardless of volume.

6. **DLQ routing is non-negotiable for production systems.** A consumer that crashes and restarts on every encounter with a malformed message creates a cascading outage -- it repeatedly processes the same poison message, never advancing the offset, and all events behind it are blocked. After 3 processing attempts, route the message to a DLQ topic and log the failure. Do not retry indefinitely without an exponential backoff limit.

7. **NEVER use event creation time from the consumer's local clock as the event timestamp.** If the consumer's clock drifts from the producer's clock, event timestamps become inconsistent. The `event_timestamp` field in every event must be set by the producer at the moment the event occurs. The consumer may add `processed_at` to track when it processed the event, but should never overwrite `event_timestamp`.

8. **State store TTLs must be explicitly set and justified.** An in-process RocksDB state store or Redis cache without TTL grows unboundedly and will eventually exhaust memory or disk. For every key stored in state, define: what the maximum number of distinct keys could be, what the natural expiry of that key is (e.g., a session state key can expire after session inactivity timeout + processing buffer), and what the storage requirement is at maximum key count. Fail loudly if these calculations suggest state storage will exceed available capacity within the expected system lifetime.

9. **Partition count changes to existing topics break partition-keyed ordering guarantees.** Kafka can increase the partition count of a topic, but existing events on partition N stay on partition N, and new events for the same key may route to a different partition. This means events for the same key are now spread across two partitions in temporal order. If ordering is required, increasing partition count requires migrating to a new topic (create topic with new partition count, migrate consumers, drain old topic, switch producers). Document this constraint in the specification so it influences initial partition count sizing -- over-provision by 2-3x expected need.

10. **Schema changes must be deployed consumer-first, then producer.** When introducing a new field, deploy all consumers with the updated schema (that can handle the new field) before any producer starts writing the new field. If the producer deploys first, consumers processing events with the new field will either crash (breaking all processing) or silently lose the field (data loss). The deployment order for schema changes is always: registry → consumers → producers. For field removals, the order is reversed: producers stop writing the field first, then consumers are updated to stop reading it.

---

## Edge Cases

### Mixed Streaming and Batch (Lambda Architecture)

When some historical data is in a data warehouse and live data flows through the streaming layer, consumers must reconcile two sources. Design a dual-output pattern: the streaming consumer writes real-time aggregations to a "hot" output table (e.g., `orders_realtime_agg`). A nightly batch job re-processes the same events from the retained Kafka topic and writes to a "cold" output table (e.g., `orders_batch_agg`). Downstream dashboards read from the cold table for data older than 24 hours (more accurate, includes all corrections) and from the hot table for the last 24 hours (less accurate, but live). Define a clear cutover timestamp -- typically the start of the most recent batch window -- below which the dashboard reads from cold and above which from hot. The Kappa architecture alternative eliminates the batch layer entirely: retain all events in Kafka indefinitely and rebuild any derived view by replaying. This simplifies architecture but requires Kafka retention of months to years and consumer replay capability that matches the batch processing speed.

### Out-of-Order and Late-Arriving Events

Events generated by mobile devices, IoT sensors, or distributed services frequently arrive at the broker minutes to hours after their `event_timestamp` due to network partitions, client-side buffering, or retry storms after an outage. When designing windowed aggregations, set a watermark delay: the maximum time the processor waits for late events before closing a window and emitting results. Typical values: 30 seconds for real-time systems, 5-15 minutes for IoT or mobile events where devices can buffer for extended periods. Events arriving after the watermark must be explicitly handled -- three options: (1) Drop and log (simplest, acceptable if late events are rare and the business can tolerate approximate aggregations). (2) Update the already-emitted result (requires the downstream system to accept corrections, complicates consumer idempotency logic). (3) Route to a late-event reprocessing topic that a slower batch process handles separately. Choose option 3 for financial or compliance aggregations where late events must be counted, option 1 for analytics dashboards where an approximate count is acceptable.

### Schema Migration with Active Consumers

A running production system with live consumers cannot stop to migrate schemas. The safe migration pattern: (1) Register new schema version in registry with BACKWARD compatibility (new schema can read old messages). (2) Deploy all consumers with the new schema version. Verify consumers are processing both old and new format events correctly. (3) Deploy producers to start writing new schema. Do not migrate producers until 100% of consumers are running new schema -- otherwise old consumers encounter new messages they cannot deserialize. (4) After all producers are writing new schema and old-schema messages have passed retention, update the schema registry subject to FULL compatibility (prevents accidentally re-introducing the old format). The key failure mode to avoid: deploying producers first means any consumer that misses the deployment window crashes on new-format messages. In Kafka, this blocks that consumer's entire partition assignment.

### Massive Event Rate (100,000+ Events Per Second)

At this scale, several assumptions from lower-volume designs break. JSON serialization alone can consume 30-40% of broker network and disk bandwidth compared to Avro at the same event rate -- switch to Avro or Protobuf. A single Kafka broker node typically handles 200-400 MB/s sustained write throughput; at 100,000 EPS with 1 KB average event size, that is 100 MB/s -- still within a single broker, but leaves no headroom for replication traffic (which multiplies by replication factor). At this scale, plan for dedicated producer-side pre-aggregation: instead of publishing one event per individual action, publish micro-batches of 50-200 events as a single message. Each consumer receives a batch message and unpacks it, reducing broker overhead by 50-200x. Monitor `NetworkProcessorAvgIdlePercent` and `LogFlushRateAndTimeMs` on brokers; these are the first metrics to saturate at high volume.

### Regulatory Retention Requirements (GDPR, HIPAA, PCI-DSS)

For regulated industries, Kafka topics may need to retain events for 7 years (financial) or indefinitely (healthcare audit logs). Storing 7 years on hot broker storage is prohibitively expensive. Use Kafka tiered storage (supported natively in Kafka 3.6+ and Confluent Platform): recent data (last 7 days) stays on fast local broker disks; older data is transparently offloaded to object storage (S3, GCS, Azure Blob). Consumers access old data through the same consumer API -- the tiered storage is transparent. For GDPR right-to-erasure requirements, implement a tombstone strategy: when a user requests deletion, publish a tombstone event (null value, user_id as key) to log-compacted topics. On regular (non-compacted) topics, GDPR compliance requires either field-level encryption of PII with key deletion (encrypt PII with a per-user key stored in a KMS; delete the key on erasure request, rendering all events containing that user's data unreadable) or full event deletion (not natively supported by Kafka without compaction -- implement a consumer that reads, redacts, and republishes to a new topic, then swaps consumer offset to the new topic).

### Multi-Region Active-Active Streaming

When events are produced in multiple geographic regions and consumers in all regions need to see all events, design a hub-and-spoke or mesh replication topology. For Kafka, use MirrorMaker 2 to replicate topics between clusters. Key design decision: prefix replicated topics with the source cluster alias (`us-east.orders.placed` in the EU cluster represents the events that originated in us-east). This prevents cyclical replication (a message replicated from US to EU should not be replicated back to US). Consumers in each region subscribe to all prefixed topics using a wildcard pattern. Be explicit about which operations should be active in which region -- write routing (only the region closest to the user produces events) is simpler than true active-active writes (events produced in multiple regions simultaneously, requiring cross-region merge conflict resolution).

### Consumer Startup State Rebuild

When a stateful consumer starts for the first time (no previous checkpoint) or must rebuild state from scratch (corrupt checkpoint, new deployment requiring fresh state), it must replay historical events to reconstruct state before it can process live events. This creates a "startup lag" during which the consumer is running but its state is not yet current. Options: (1) Read from the beginning of the retention window (simple, but can take hours for high-retention topics). (2) Use a snapshot-based startup: periodically write the full state to a snapshot store; on startup, load the snapshot, then replay only events newer than the snapshot timestamp (typically reduces startup time from hours to minutes). (3) Pre-populate the state store from a database backup before starting the consumer. Define the maximum acceptable state-rebuild time as part of the RTO requirement. A consumer that takes 4 hours to rebuild state has an effective RTO of 4 hours, regardless of how quickly the underlying infrastructure recovers.

---

## Example

**Input:** "We're building a real-time ride-share surge pricing system. When demand in a geographic zone exceeds available drivers, we need to detect this and raise the multiplier within 10 seconds. We get about 5,000 ride requests per minute and 8,000 driver location pings per minute across 200 zones in our city. We need this to be highly accurate -- miscalculating the multiplier costs us revenue directly."

---

## Streaming Architecture: Ride-Share Surge Pricing Engine

### 1. System Overview

| Property | Value |
|----------|-------|
| Use case | Detect demand-supply imbalance per geographic zone and compute surge multiplier within 10 seconds of imbalance onset |
| Peak event rate | 13,000 events/min (~217 EPS) across two event types; peak 3x during rush hour: ~650 EPS |
| Average event rate | 217 EPS steady state |
| End-to-end latency target | p99 < 10 seconds from event to multiplier update |
| Delivery guarantee | At-least-once with idempotent consumers (miscounting a request twice is acceptable; missing a request distorts the multiplier) |
| Message transport | Kafka 3.7 with 3-broker cluster; 3x replication |
| Stream processing engine | Kafka Streams (co-located state, low operational overhead, native Kafka integration) |
| Schema format | Avro (schema-enforced, compact binary for 650 EPS peak) |
| Schema registry | Confluent Schema Registry with BACKWARD_TRANSITIVE compatibility |

**Key trade-offs made:**
- Chose at-least-once over exactly-once to preserve throughput and operational simplicity; consumers use idempotent upsert logic (upsert by zone_id + window_id), so double-counting is corrected on the second write
- Fat events chosen: ride requests include zone_id pre-computed by the API layer (from latitude/longitude geohash lookup), eliminating the need for consumers to perform geospatial lookups per event
- Kafka Streams chosen over Flink because the processing logic (windowed count per zone, ratio computation, multiplier formula) does not require complex CEP or cross-stream joins; Kafka Streams provides this with significantly lower operational overhead
- Partition count set to 24 (well above current need of 8-10) to allow zone count to grow to 1,000 cities without topic recreation

---

### 2. Event Schema Definitions

#### 2.1 ride.request

**Envelope:**
```json
{
  "event_id": "01HRX4Z9K8M...(ULID)",
  "event_type": "ride.request",
  "event_timestamp": "2026-03-15T08:32:14.221Z",
  "ingested_at": "2026-03-15T08:32:14.235Z",
  "schema_version": "1.0.0",
  "source_system": "rider-api",
  "correlation_id": "uuid-v4",
  "partition_key": "zone_downtown_north"
}
```

**Payload:**
```json
{
  "data": {
    "rider_id": { "type": "string", "nullable": false, "description": "Unique rider identifier", "example": "rider_8821aa" },
    "zone_id": { "type": "string", "nullable": false, "description": "Geohash-based zone identifier, precision 5 (~4.9km x 4.9km)", "example": "zone_downtown_north" },
    "latitude": { "type": "double", "nullable": false, "description": "Rider latitude at time of request", "example": 40.7589 },
    "longitude": { "type": "double", "nullable": false, "description": "Rider longitude at time of request", "example": -73.9851 },
    "estimated_fare_usd": { "type": "decimal", "nullable": false, "description": "Estimated fare before surge", "example": 14.50 },
    "ride_type": { "type": "string", "nullable": false, "description": "Enum: standard, xl, premium", "example": "standard" }
  }
}
```

- **Serialization:** Avro
- **Schema registry subject:** `ride.request-value`
- **Compatibility mode:** BACKWARD_TRANSITIVE
- **Evolution rules:** New optional fields may be added with null default; zone_id and rider_id are immutable fields (never rename or remove); estimated_fare_usd must remain decimal type

#### 2.2 driver.location

**Payload:**
```json
{
  "data": {
    "driver_id": { "type": "string", "nullable": false, "description": "Unique driver identifier", "example": "driver_4410bb" },
    "zone_id": { "type": "string", "nullable": false, "description": "Current zone of driver (same geohash scheme as ride.request)", "example": "zone_downtown_north" },
    "latitude": { "type": "double", "nullable": false, "description": "Driver GPS latitude", "example": 40.7601 },
    "longitude": { "type": "double", "nullable": false,
