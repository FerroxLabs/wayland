---
name: streaming-architect
description: |
  Real-time data streaming expertise covering Kafka architecture, stream processing with Flink and Kafka Streams, exactly-once semantics, windowing strategies (tumbling, sliding, session), watermarks, late data handling, schema registry, consumer group management, and production deployment patterns.
  Use when the user asks about streaming architect, streaming architect best practices, or needs guidance on streaming architect implementation.
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

# Streaming Architect

## Overview

Real-time streaming is the architecture of processing data as it arrives, rather than in batches. This skill covers the design, implementation, and operation of streaming systems that handle millions of events per second with low latency, high reliability, and exactly-once processing guarantees.

## Kafka Architecture

### Core Components

```
Producers -> Brokers (Partitioned Topics) -> Consumers (Consumer Groups)

Topic: "orders" (6 partitions, replication factor 3)
  Partition 0: [msg0, msg6, msg12, ...]  -> Leader: Broker 1, Followers: 2, 3
  Partition 1: [msg1, msg7, msg13, ...]  -> Leader: Broker 2, Followers: 1, 3
  Partition 2: [msg2, msg8, msg14, ...]  -> Leader: Broker 3, Followers: 1, 2
  Partition 3: [msg3, msg9, msg15, ...]  -> Leader: Broker 1, Followers: 2, 3
  Partition 4: [msg4, msg10, msg16, ...] -> Leader: Broker 2, Followers: 1, 3
  Partition 5: [msg5, msg11, msg17, ...] -> Leader: Broker 3, Followers: 1, 2
```

### Topic Design

```python
from confluent_kafka.admin import AdminClient, NewTopic

admin = AdminClient({'bootstrap.servers': 'broker1:9092,broker2:9092,broker3:9092'})

# Partition count guidelines:
# - Target throughput / per-partition throughput = min partitions
# - More partitions = more parallelism but more overhead
# - Cannot reduce partitions after creation
# - Rule of thumb: start with 6-12 for moderate throughput, 30-100 for high

topics = [
    NewTopic(
        topic='events.raw',
        num_partitions=12,
        # ... (condensed) ...
        }
    ),
]

admin.create_topics(topics)
```

### Producer Patterns

```python
from confluent_kafka import Producer, KafkaError
import json
import time

class ReliableProducer:
    """Production-grade Kafka producer with retry and delivery guarantees."""

    def __init__(self, bootstrap_servers, topic):
        self.topic = topic
        self.producer = Producer({
            'bootstrap.servers': bootstrap_servers,
            'acks': 'all',                         # Wait for all ISR replicas
            'enable.idempotence': True,             # Exactly-once producer
            'max.in.flight.requests.per.connection': 5,  # With idempotence, safe up to 5
            # ... (condensed) ...
    def __enter__(self):
        return self

    def __exit__(self, *args):
        self.flush()
```

### Consumer Patterns

```python
from confluent_kafka import Consumer, KafkaError, TopicPartition
import json

class ReliableConsumer:
    """Production-grade Kafka consumer with manual offset management."""

    def __init__(self, bootstrap_servers, group_id, topics):
        self.consumer = Consumer({
            'bootstrap.servers': bootstrap_servers,
            'group.id': group_id,
            'auto.offset.reset': 'earliest',
            'enable.auto.commit': False,          # Manual offset commits
            'max.poll.interval.ms': 300000,       # 5 min max processing time
            'session.timeout.ms': 45000,
            # ... (condensed) ...
        """Commit current offsets (call after successful processing)."""
        self.consumer.commit(asynchronous=False)

    def close(self):
        self.consumer.close()
```

## Exactly-Once Semantics

### Kafka Transactions (Producer-Side)

```python
from confluent_kafka import Producer

# Transactional producer: atomic writes across multiple partitions/topics
producer = Producer({
    'bootstrap.servers': 'broker1:9092',
    'transactional.id': 'my-app-instance-1',  # Unique per instance
    'acks': 'all',
    'enable.idempotence': True,
})

producer.init_transactions()

try:
    producer.begin_transaction()
# ... (condensed) ...

    producer.commit_transaction()
except Exception as e:
    producer.abort_transaction()
    raise
```

### End-to-End Exactly-Once Pipeline

```
Source -> Kafka (idempotent producer)
  -> Consumer (read_committed isolation)
    -> Process
      -> Transactional Producer (atomic write + offset commit)
        -> Sink
```

Key requirements:
1. **Producer**: `enable.idempotence=true`, `transactional.id` set
2. **Consumer**: `isolation.level=read_committed`
3. **Processing**: Deterministic transforms (same input = same output)
4. **Offset management**: Offsets committed within the same transaction as output

## Windowing Strategies

### Window Types

```python
# Apache Flink windowing examples (conceptual, applicable to any framework)

# 1. Tumbling Window: Fixed-size, non-overlapping
# [0-5min] [5-10min] [10-15min] ...
# Use for: Periodic aggregation (counts per minute, hourly revenue)
events \
    .key_by("user_id") \
    .window(TumblingEventTimeWindows.of(Time.minutes(5))) \
    .aggregate(CountAggregator())

# 2. Sliding Window: Fixed-size, overlapping by slide interval
# [0-10min] [5-15min] [10-20min] ...  (10-min window, 5-min slide)
# Use for: Moving averages, smoothed metrics
events \
    # ... (condensed) ...
events \
    .key_by("user_id") \
    .window(GlobalWindows.create()) \
    .trigger(CountTrigger.of(100))  # Fire every 100 events
    .aggregate(AccumulatingAggregator())
```

### Kafka Streams Windowing (Java)

```java
// Tumbling window aggregation
KTable<Windowed<String>, Long> counts = events
    .groupByKey()
    .windowedBy(TimeWindows.ofSizeWithNoGrace(Duration.ofMinutes(5)))
    .count(Materialized.as("event-counts"));

// Sliding window (hopping)
KTable<Windowed<String>, Double> avgValues = events
    .groupByKey()
    .windowedBy(
        TimeWindows.ofSizeAndGrace(
            Duration.ofMinutes(10),   // window size
            Duration.ofMinutes(2)     // grace period for late data
        ).advanceBy(Duration.ofMinutes(1))  // slide/hop
    # ... (condensed) ...
        SessionInfo::new,
        (key, event, session) -> session.addEvent(event),
        (key, s1, s2) -> s1.merge(s2),
        Materialized.as("user-sessions")
    );
```

## Watermarks and Late Data

### Watermark Concept

```
Event Time:    |-------|-------|-------|-------|
               t=0     t=10    t=20    t=30

Processing Time progresses ->

Watermark = "I believe all events with event_time <= W have arrived"

With watermark delay of 5 seconds:
  When processing-time clock is at T, watermark = max(event_times_seen) - 5s

Late data = event arriving after watermark has passed its event_time
```

### Handling Late Data

```python
# Spark Structured Streaming: watermark + late data policy
from pyspark.sql.functions import window, col

windowed_counts = (
    events
    .withWatermark("event_time", "10 minutes")  # Allow 10 min late
    .groupBy(
        window("event_time", "5 minutes"),
        "event_type"
    )
    .count()
)

# Output modes with watermarks:
# ... (condensed) ...
query = windowed_counts.writeStream \
    .outputMode("append") \
    .format("parquet") \
    .option("checkpointLocation", "/checkpoints/windowed") \
    .start("/output/windowed_counts")
```

### Late Data Strategies

| Strategy | Behavior | Use When |
|----------|----------|----------|
| Drop late data | Discard events arriving after watermark | Metrics where approximation is acceptable |
| Side output | Route late data to separate stream | Need to reprocess late data differently |
| Allowed lateness | Keep window state beyond watermark | Need accurate counts, can tolerate delays |
| Retraction | Update previous results | Dashboard/materialized view updates |

## Schema Registry

```python
from confluent_kafka.schema_registry import SchemaRegistryClient
from confluent_kafka.schema_registry.avro import AvroSerializer, AvroDeserializer
from confluent_kafka.serialization import SerializationContext, MessageField

# Schema Registry client
registry = SchemaRegistryClient({'url': '[reference URL]'})

# Define Avro schema
order_schema_str = """
{
    "type": "record",
    "name": "Order",
    "namespace": "com.company.events",
    "fields": [
        # ... (condensed) ...
        value=avro_serializer(
            order_dict,
            SerializationContext(topic, MessageField.VALUE)
        ),
    )
```

## Consumer Groups

### Rebalancing Strategies

```python
from confluent_kafka import Consumer

# Eager rebalancing (default): stop all consumers, reassign all partitions
# Cooperative rebalancing: incremental reassignment, minimal disruption

consumer = Consumer({
    'bootstrap.servers': 'broker1:9092',
    'group.id': 'order-processor',
    'partition.assignment.strategy': 'cooperative-sticky',
    # Options:
    # 'range' - Assigns contiguous partitions per topic
    # 'roundrobin' - Round-robin across all partitions
    # 'cooperative-sticky' - Incremental rebalance, sticky assignment
})
```

### Consumer Group Monitoring

```shell
# Check consumer group lag
kafka-consumer-groups.shell-cmd --bootstrap-server broker1:9092 \
    --group order-processor --describe

# Output:
# TOPIC    PARTITION  CURRENT-OFFSET  LOG-END-OFFSET  LAG  HOST
# orders   0          15234           15240            6    /10.0.1.5
# orders   1          18902           19100            198  /10.0.1.6
# orders   2          12456           12456            0    /10.0.1.7

# Key metrics to monitor:
# - Consumer lag per partition (should be near 0 for real-time)
# - Consumer lag trend (growing = consumer cannot keep up)
# - Number of active consumers vs partitions
# - Rebalance frequency (too frequent = unstable consumers)
```

## Stream Processing Topology Design

### Stateless Operations

```
Filter -> Map -> FlatMap -> Branch

Example: Event routing
  Input: raw events
  -> Filter: discard malformed
  -> Map: parse JSON, extract fields
  -> Branch:
       purchase events -> purchase topic
       click events -> clickstream topic
       error events -> error topic
```

### Stateful Operations

```
Aggregate -> Join -> Dedup

Example: Real-time dashboard
  Input: page views
  -> Window(5min tumbling)
  -> GroupBy(page_url)
  -> Count()
  -> Output: page_view_counts per 5-min window

Example: Stream-stream join
  Input A: orders
  Input B: payments
  -> Join on order_id within 1-hour window
  -> Output: enriched order with payment status
```

### Production Deployment Patterns

```yaml
# Kubernetes deployment for Kafka Streams application
apiVersion: apps/v1
kind: Deployment
metadata:
  name: order-processor
spec:
  replicas: 6  # Match partition count or be a divisor
  selector:
    matchLabels:
      app: order-processor
  template:
    spec:
      containers:
        - name: processor
          # ... (condensed) ...
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0  # Zero-downtime deployment
```

## Capacity Planning

### Throughput Calculation

```
Producer throughput per broker:
  Network: min(network_bandwidth, disk_write_speed) / replication_factor

Consumer throughput:
  Limited by: network_bandwidth, consumer processing speed, partition count

Example:
  10 GB/s network per broker
  3 brokers, replication factor 3
  Producer throughput: 10 GB/s / 3 (replication) = ~3.3 GB/s per broker
  Total cluster throughput: ~10 GB/s (limited by replication)

  With 12 partitions, 6 consumers:
  Each consumer handles 2 partitions
  Per-consumer throughput needed: total_throughput / 6
```

### Retention and Storage

```
Storage per topic = throughput * retention_period * replication_factor

Example:
  1 GB/hour throughput
  7-day retention
  Replication factor 3
  Storage = 1 GB/h * 168h * 3 = 504 GB per topic

Total cluster storage = sum(all topics) + 20% overhead
```

## Decision Framework

1. **Do you need < 100ms latency?** -> True streaming (Kafka + Flink/Kafka Streams)
2. **Do you need exactly-once?** -> Kafka transactions + Flink checkpoints
3. **Is your logic pure SQL?** -> Kafka Streams with ksqlDB
4. **Do you need complex event processing?** -> Flink CEP
5. **Is it simple enrichment/routing?** -> Kafka Streams or Kafka Connect + SMTs
6. **Do you need to join streams?** -> Flink (stream-stream joins are most robust)
7. **Are you already in the Spark ecosystem?** -> Spark Structured Streaming

## When to Use

**Use this skill when:**
- Designing or implementing streaming architect solutions
- Reviewing or improving existing streaming architect approaches
- Making architectural or implementation decisions about streaming architect
- Learning streaming architect patterns and best practices
- Troubleshooting streaming architect-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Streaming Architect Analysis

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

**Input:** "Help me implement streaming architect for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended streaming architect approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When streaming architect must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
