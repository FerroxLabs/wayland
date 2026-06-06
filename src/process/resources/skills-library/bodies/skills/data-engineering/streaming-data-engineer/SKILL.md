---
name: streaming-data-engineer
description: |
  Hands-on streaming data engineering covering Apache Kafka producer/consumer tuning, Flink stateful stream processing, Spark Structured Streaming, windowing strategies (tumbling, sliding, session, global), exactly-once semantics, backpressure management, dead-letter queues, schema evolution, and production monitoring patterns.
  Use when the user asks about streaming data engineer, streaming data engineer best practices, or needs guidance on streaming data engineer implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "data-science sql guide"
  category: "data-engineering"
  subcategory: "streaming"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Streaming Data Engineer

## Overview

Streaming data engineering is the discipline of building systems that process unbounded data in near-real-time. Unlike streaming architecture (which focuses on system design), this skill focuses on the hands-on engineering: writing producers and consumers, implementing windowed aggregations, guaranteeing exactly-once delivery, handling backpressure, and operating streaming jobs in production.

## Kafka Producer Engineering

### High-Throughput Producer Configuration

```java
Properties props = new Properties();
props.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, "broker1:9092,broker2:9092");
props.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
props.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, KafkaAvroSerializer.class);

// Throughput tuning
props.put(ProducerConfig.BATCH_SIZE_CONFIG, 65536);         // 64KB batches
props.put(ProducerConfig.LINGER_MS_CONFIG, 20);             // Wait up to 20ms to fill batch
props.put(ProducerConfig.COMPRESSION_TYPE_CONFIG, "lz4");   // LZ4 for speed, zstd for ratio
props.put(ProducerConfig.BUFFER_MEMORY_CONFIG, 67108864);   // 64MB buffer

// Reliability
props.put(ProducerConfig.ACKS_CONFIG, "all");               // All ISR replicas must ACK
props.put(ProducerConfig.ENABLE_IDEMPOTENCE_CONFIG, true);   // Prevent duplicates
props.put(ProducerConfig.MAX_IN_FLIGHT_REQUESTS_PER_CONNECTION, 5); // Safe with idempotence
props.put(ProducerConfig.RETRIES_CONFIG, Integer.MAX_VALUE);
props.put(ProducerConfig.DELIVERY_TIMEOUT_MS_CONFIG, 120000);

KafkaProducer<String, Event> producer = new KafkaProducer<>(props);
```

### Partitioning Strategies

```java
// Custom partitioner for hot-key distribution
public class WeightedPartitioner implements Partitioner {
    @Supersede
    public int partition(String topic, Object key, byte[] keyBytes,
                         Object value, byte[] valueBytes, Cluster cluster) {
        int numPartitions = cluster.partitionCountForTopic(topic);
        if (key == null) return ThreadLocalRandom.current().nextInt(numPartitions);

        String keyStr = (String) key;
        // Spread hot keys across multiple partitions with suffix
        if (isHotKey(keyStr)) {
            int subPartition = ThreadLocalRandom.current().nextInt(4);
            return Math.abs((keyStr + "-" + subPartition).hashCode()) % numPartitions;
        }
        return Math.abs(keyStr.hashCode()) % numPartitions;
    }
}
```

## Consumer Engineering

### Consumer Group Patterns

```python
from confluent_kafka import Consumer, KafkaError, TopicPartition

consumer = Consumer({
    'bootstrap.servers': 'broker1:9092',
    'group.id': 'order-processor-v2',
    'auto.offset.reset': 'earliest',
    'enable.auto.commit': False,            # Manual commit for exactly-once
    'max.poll.interval.ms': 300000,         # 5 min max processing time
    'session.timeout.ms': 45000,
    'heartbeat.interval.ms': 15000,
    'get.min.bytes': 1024,                # Wait for 1KB before returning
    'get.max.wait.ms': 500,
    'max.partition.get.bytes': 1048576,   # 1MB per partition
})

consumer.subscribe(['orders.validated'], on_assign=on_partition_assign)

def process_batch():
    while True:
        msg = consumer.poll(timeout=1.0)
        if msg is None:
            continue
        if msg.error():
            if msg.error().code() == KafkaError._PARTITION_EOF:
                continue
            raise KafkaException(msg.error())

        try:
            event = deserialize(msg.value())
            process_event(event)
            # Commit only after successful processing
            consumer.commit(message=msg, asynchronous=False)
        except ProcessingError as e:
            publish_to_dlq(msg, e)
            consumer.commit(message=msg, asynchronous=False)
```

### Dead Letter Queue Pattern

```python
def publish_to_dlq(original_msg, error):
    dlq_producer.produce(
        topic=f"{original_msg.topic()}.dlq",
        key=original_msg.key(),
        value=original_msg.value(),
        headers={
            'original-topic': original_msg.topic(),
            'original-partition': str(original_msg.partition()),
            'original-offset': str(original_msg.offset()),
            'error-message': str(error),
            'error-timestamp': datetime.utcnow().isoformat(),
            'retry-count': '0',
        }
    )
```

## Apache Flink Stream Processing

### Stateful Windowed Aggregation

```java
DataStream<OrderEvent> orders = env
    .fromSource(kafkaSource, WatermarkStrategy
        .<OrderEvent>forBoundedOutOfOrderness(Duration.ofSeconds(10))
        .withTimestampAssigner((event, ts) -> event.getTimestamp()),
        "orders-source");

// Tumbling window: Fixed-size, non-overlapping
DataStream<RevenueSummary> hourlyRevenue = orders
    .keyBy(OrderEvent::getRegion)
    .window(TumblingEventTimeWindows.of(Time.hours(1)))
    .allowedLateness(Time.minutes(5))
    .sideOutputLateData(lateOutputTag)
    .aggregate(new RevenueAggregator(), new RevenueWindowFunction());

// Sliding window: Fixed-size, overlapping
DataStream<MovingAverage> movingAvg = orders
    .keyBy(OrderEvent::getProductId)
    .window(SlidingEventTimeWindows.of(Time.minutes(30), Time.minutes(5)))
    .aggregate(new AverageAggregator());

// Session window: Gap-based, dynamic size
DataStream<UserSession> sessions = clickstream
    .keyBy(ClickEvent::getUserId)
    .window(EventTimeSessionWindows.withGap(Time.minutes(15)))
    .process(new SessionWindowFunction());
```

### Windowing Strategy Decision Matrix

| Strategy | Use When | Window Size | Overlap | Late Data |
|----------|----------|-------------|---------|-----------|
| Tumbling | Regular aggregation periods | Fixed | No | Allowed lateness |
| Sliding | Moving averages, trends | Fixed | Yes | Allowed lateness |
| Session | User activity grouping | Dynamic | No | Gap-based |
| Global | Custom trigger logic | Unbounded | N/A | Trigger-dependent |
| Count | Fixed-count batches | N items | No | N/A |

### Exactly-Once with Flink + Kafka

```java
// Enable exactly-once checkpointing
env.enableCheckpointing(60000, CheckpointingMode.EXACTLY_ONCE);
env.getCheckpointConfig().setMinPauseBetweenCheckpoints(30000);
env.getCheckpointConfig().setCheckpointTimeout(120000);
env.getCheckpointConfig().setMaxConcurrentCheckpoints(1);
env.getCheckpointConfig().setExternalizedCheckpointRetention(
    ExternalizedCheckpointRetention.RETAIN_ON_CANCELLATION);

// Kafka sink with exactly-once
KafkaSink<String> sink = KafkaSink.<String>builder()
    .setBootstrapServers("broker:9092")
    .setRecordSerializer(KafkaRecordSerializationSchema.builder()
        .setTopic("output-topic")
        .setValueSerializationSchema(new SimpleStringSchema())
        .build())
    .setDeliveryGuarantee(DeliveryGuarantee.EXACTLY_ONCE)
    .setTransactionalIdPrefix("flink-job-v1")
    .build();
```

## Spark Structured Streaming

### Streaming DataFrame Operations

```python
from pyspark.sql import SparkSession
from pyspark.sql.functions import window, col, from_json, avg, count
from pyspark.sql.types import StructType, StringType, DoubleType, TimestampType

spark = SparkSession.builder \
    .config("spark.sql.streaming.checkpointLocation", "/checkpoints/order-agg") \
    .config("spark.sql.shuffle.partitions", 20) \
    .getOrCreate()

schema = StructType() \
    .add("order_id", StringType()) \
    .add("amount", DoubleType()) \
    .add("region", StringType()) \
    .add("event_time", TimestampType())

orders = spark.readStream \
    .format("kafka") \
    .option("kafka.bootstrap.servers", "broker:9092") \
    .option("subscribe", "orders") \
    .option("startingOffsets", "latest") \
    .option("maxOffsetsPerTrigger", 100000) \
    .load() \
    .select(from_json(col("value").cast("string"), schema).alias("data")) \
    .select("data.*") \
    .withWatermark("event_time", "10 minutes")

# Windowed aggregation
revenue_by_region = orders \
    .groupBy(
        window(col("event_time"), "1 hour", "15 minutes"),
        col("region")
    ) \
    .agg(
        count("order_id").alias("order_count"),
        avg("amount").alias("avg_amount")
    )

query = revenue_by_region.writeStream \
    .outputMode("update") \
    .format("delta") \
    .option("checkpointLocation", "/checkpoints/revenue") \
    .trigger(processingTime="30 seconds") \
    .start("/output/revenue_by_region")
```

## Backpressure Management

### Detection and Response

```
Symptoms of backpressure:
  - Consumer lag growing continuously
  - Processing latency increasing over time
  - Memory usage climbing in stream processors
  - Checkpoint durations increasing (Flink)

Diagnosis checklist:
  [ ] Check consumer group lag: kafka-consumer-groups --describe --group <id>
  [ ] Monitor Flink backpressure metrics: taskmanager.job.task.isBackPressured
  [ ] Check Spark streaming batch duration vs trigger interval
  [ ] Review GC logs for memory pressure
  [ ] Profile serialization/deserialization overhead
```

### Backpressure Mitigation Strategies

```python
# Strategy 1: Rate limiting at source
kafka_source_config = {
    'maxOffsetsPerTrigger': 50000,       # Spark: limit records per trigger
    'get.max.bytes': 5242880,          # Kafka consumer: limit get size
}

# Strategy 2: Async processing with bounded queue
import asyncio
from asyncio import Semaphore

semaphore = Semaphore(100)  # Max 100 concurrent operations

async def process_with_backpressure(event):
    async with semaphore:
        result = await process_event_async(event)
        return result

# Strategy 3: Spillable state backend (Flink)
# flink-conf.yaml:
# state.backend: rocksdb
# state.backend.rocksdb.memory.managed: true
# state.backend.rocksdb.memory.fixed-per-slot: 256mb

# Strategy 4: Dynamic scaling
# Monitor lag, scale consumers when threshold exceeded
def autoscale_consumers(current_lag, threshold=100000):
    if current_lag > threshold * 3:
        scale_consumer_group(replicas=current_replicas * 2)
    elif current_lag > threshold:
        scale_consumer_group(replicas=current_replicas + 1)
    elif current_lag < threshold * 0.1:
        scale_consumer_group(replicas=max(1, current_replicas - 1))
```

## Schema Evolution

### Avro Schema Registry Integration

```python
from confluent_kafka.schema_registry import SchemaRegistryClient
from confluent_kafka.schema_registry.avro import AvroSerializer, AvroDeserializer

schema_registry = SchemaRegistryClient({'url': '[reference URL]'})

# Schema evolution compatibility rules:
# BACKWARD  - new schema can read old data (safe for consumers first)
# FORWARD   - old schema can read new data (safe for producers first)
# FULL      - both backward and forward compatible
# NONE      - no compatibility checking

# Set compatibility level
schema_registry.set_compatibility(
    subject_name="orders-value",
    level="BACKWARD"
)

# Safe schema changes (backward compatible):
# - Add optional field with default
# - Remove field that had a default
# - Change field from specific type to union with null

# Unsafe schema changes:
# - Remove required field
# - Change field type
# - Rename field (no concept of rename in Avro)
```

## Production Monitoring

### Key Metrics to Track

```yaml
producer_metrics:
  - record-send-rate          # Records/sec being produced
  - record-error-rate         # Failed sends/sec
  - request-latency-avg       # Average broker response time
  - batch-size-avg            # Bytes per batch
  - buffer-available-bytes    # Remaining buffer capacity

consumer_metrics:
  - records-lag-max           # Maximum partition lag
  - records-consumed-rate     # Records/sec consumed
  - commit-latency-avg       # Offset commit time
  - rebalance-rate           # Consumer group rebalances

flink_metrics:
  - numRecordsInPerSecond    # Input throughput
  - numRecordsOutPerSecond   # Output throughput
  - currentInputWatermark    # Watermark progress
  - lastCheckpointDuration   # Checkpoint time
  - isBackPressured          # Backpressure indicator

alerts:
  - consumer_lag > 100000 for 5m     # Falling behind
  - checkpoint_duration > 60s         # State too large
  - error_rate > 0.01                 # > 1% errors
  - rebalance_count > 3 in 10m       # Unstable group
```

### Streaming Job Health Dashboard Query (Prometheus)

```promql
# Consumer lag trend
sum(kafka_consumer_group_lag) by (group, topic)

# Processing throughput
rate(flink_taskmanager_job_task_numRecordsInPerSecond[5m])

# End-to-end latency (event time to processing time)
histogram_quantile(0.99,
  rate(stream_processing_latency_seconds_bucket[5m])
)

# Backpressure ratio
avg(flink_taskmanager_job_task_isBackPressured) by (task_name)
```

## Delivery Guarantees Decision Guide

| Guarantee | How | Trade-off | Use When |
|-----------|-----|-----------|----------|
| At-most-once | Auto-commit before processing | Fastest, may lose data | Metrics, logs, non-critical |
| At-least-once | Commit after processing | Duplicates possible | Most use cases + idempotent sink |
| Exactly-once | Transactions or idempotent writes | Slowest, most complex | Financial, inventory, billing |

### Implementing Idempotent Consumers

```python
# Pattern: Deduplication with idempotency key
class IdempotentProcessor:
    def __init__(self, redis_client):
        self.redis = redis_client
        self.dedup_ttl = 86400  # 24 hours

    def process(self, event):
        idempotency_key = f"processed:{event.topic}:{event.partition}:{event.offset}"

        # Check if already processed
        if self.redis.exists(idempotency_key):
            return  # Skip duplicate

        # Process within transaction
        with db.begin():
            result = handle_event(event)
            db.execute(insert_result(result))

        # Mark as processed
        self.redis.setex(idempotency_key, self.dedup_ttl, "1")
```

## Common Anti-Patterns

```
ANTI-PATTERN                          FIX
------------------------------------------------------------------
Synchronous HTTP calls in stream      Use async I/O or batch lookups
processing

Unbounded state accumulation          Set state TTL, use windowed state

Processing one record at a time       Use micro-batching or bulk APIs

Ignoring late data                    Configure watermarks + allowed
                                      lateness + side outputs

Committing offsets before processing  Commit after processing succeeds

No dead letter queue                  Always route failed records to DLQ

Hardcoded parallelism                 Size based on partition count and
                                      throughput requirements

No schema management                  Use Schema Registry from day one
```

## When to Use

**Use this skill when:**
- Designing or implementing streaming data engineer solutions
- Reviewing or improving existing streaming data engineer approaches
- Making architectural or implementation decisions about streaming data engineer
- Learning streaming data engineer patterns and best practices
- Troubleshooting streaming data engineer-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Streaming Data Engineer Analysis

## Context Assessment
[Situation summary and constraints]

## Recommended Approach
[Primary recommendation with rationale]

## Implementation Steps
1. [Step with specific details]
2. [Step with specific details]
3. [Step with specific details]

## Trade-offs and Considerations
- [Key trade-off 1]
- [Key trade-off 2]

## Next Steps
- [Immediate action item]
- [Follow-up action item]
```

## Example

**Input:** "Help me implement streaming data engineer for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended streaming data engineer approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When streaming data engineer must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
