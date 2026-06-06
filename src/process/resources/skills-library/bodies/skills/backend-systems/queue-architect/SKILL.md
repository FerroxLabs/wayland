---
name: queue-architect
description: |
  Message queue design expertise covering queue vs topic vs stream, delivery guarantees, dead letter queues, backpressure handling, RabbitMQ/Kafka/SQS patterns, event schema evolution, and ordering guarantees.
  Use when the user asks about queue architect, queue architect best practices, or needs guidance on queue architect implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "backend api-design architecture"
  category: "backend-systems"
  subcategory: "server-infrastructure"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Queue Architect

## Purpose

Design resilient message-driven architectures using queues, topics, and streams. This skill covers pattern selection, delivery guarantee tradeoffs, error handling, scaling strategies, and production operational concerns across major messaging platforms.

## Messaging Primitive Selection

### Queue vs Topic vs Stream

```
QUEUE (Point-to-Point):
  - One producer, one consumer per message
  - Message is removed after consumption
  - Load balancing across consumers
  - Use case: Task distribution, work queues

  Producer -> [Queue] -> Consumer A
                      -> Consumer B  (competing consumers)

TOPIC (Pub/Sub):
  - One producer, multiple consumers per message
  - Each subscriber gets a copy
  - Fan-out pattern
  - Use case: Event notification, broadcasting

  Producer -> [Topic] -> Subscriber A (gets all messages)
                      -> Subscriber B (gets all messages)
                      -> Subscriber C (gets all messages)

STREAM (Log):
  - Ordered, append-only log
  - Consumers can replay from any position
  - Consumer groups for parallel processing
  - Retention-based (not deletion on consume)
  - Use case: Event sourcing, audit logs, real-time analytics

  Producer -> [Stream] -> Consumer Group 1 (offset tracking)
                       -> Consumer Group 2 (different offset)
```

### Technology Selection

```
REQUIREMENT                         RECOMMENDED TECHNOLOGY
--------------------------------------------------------------
Simple task queue                   Redis (Bull/BullMQ), SQS
Guaranteed delivery + routing       RabbitMQ
High throughput event streaming     Kafka, Redpanda
Cloud-native, serverless            SQS + SNS (AWS), Pub/Sub (GCP)
Event sourcing with replay          Kafka, EventStoreDB
Simple pub/sub                      Redis Pub/Sub (ephemeral),
                                    SNS (durable)
Delayed/scheduled messages          BullMQ, SQS (delay), RabbitMQ (plugin)
Priority queues                     RabbitMQ, BullMQ
Complex routing                     RabbitMQ (exchanges)
```

## Delivery Guarantees

### At-Most-Once

```
MESSAGE IS DELIVERED 0 OR 1 TIMES.
  - Fire and skip
  - No acknowledgment, no retry
  - Fastest, simplest
  - Acceptable data loss

USE CASE: Metrics, logs, analytics events where loss of a few
messages is acceptable.

IMPLEMENTATION:
  Producer sends message without waiting for ack.
  Consumer processes without confirming.
```

### At-Least-Once (Most Common)

```
MESSAGE IS DELIVERED 1 OR MORE TIMES.
  - Producer retries until acknowledged
  - Consumer acknowledges after processing
  - Possible duplicates on failure/retry
  - CONSUMER MUST BE IDEMPOTENT

USE CASE: Most business events (orders, payments, notifications).

IMPLEMENTATION:
  1. Producer sends message and waits for broker ack
  2. Consumer receives message
  3. Consumer processes message
  4. Consumer sends acknowledgment to broker
  5. If step 3 or 4 fails, broker redelivers

IDEMPOTENCY STRATEGY:
```

```ts
async function processOrderEvent(event: OrderEvent): Promise<void> {
  // Check idempotency key before processing
  const processed = await db.processedEvents.findUnique({
    where: { eventId: event.id },
  });
  if (processed) return; // Already handled, skip

  await db.$transaction(async (tx) => {
    // Process the event
    await tx.orders.update({
      where: { id: event.orderId },
      data: { status: event.newStatus },
    });

    // Record as processed (idempotency)
    await tx.processedEvents.create({
      data: { eventId: event.id, processedAt: new Date() },
    });
  });
}
```

### Exactly-Once (Effectively)

## Dead Letter Queues (DLQ)

### DLQ Pattern

```
FLOW:
  1. Consumer receives message
  2. Processing fails
  3. Message retried N times
  4. After max retries, message moved to DLQ
  5. DLQ monitored by alerts
  6. Operations team investigates and reprocesses

CONFIGURATION DECISIONS:
  max_retries:          3-5 (before DLQ)
  retry_delay:          Exponential backoff (1s, 5s, 30s, 2min, 10min)
  dlq_retention:        7-30 days
  dlq_alert_threshold:  Any message (or batch threshold)
```

```ts
// BullMQ dead letter queue pattern
import { Queue, Worker } from 'bullmq';

const orderQueue = new Queue('orders', {
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 1000,  // 1s, 2s, 4s, 8s, 16s
    },
    removeOnComplete: { age: 3600 * 24 },  // Keep completed for 24h
    removeOnFail: false,  // Keep failed jobs for inspection
  },
});

const worker = new Worker('orders', async (job) => {
  try {
    await processOrder(job.data);
  } catch (error) {
    # ... (condensed) ...
    await alerting.notify(`Dead letter: Order ${job.data.orderId} failed permanently`, {
      jobId: job.id,
      error: error.message,
      data: job.data,
    });
  }
});
```

### DLQ Reprocessing

```ts
// Reprocess DLQ messages
async function reprocessDeadLetters(queueName: string, count: number = 10) {
  const queue = new Queue(queueName);
  const failedJobs = await queue.getFailed(0, count);

  for (const job of failedJobs) {
    console.log(`Reprocessing job ${job.id}:`, job.data);
    await job.retry();
  }

  return { reprocessed: failedJobs.length };
}
```

## Backpressure Handling

### Strategies

```
1. RATE LIMITING ON PRODUCER:
   Limit message production rate to match consumer throughput.
   Simple but may require buffering on producer side.

2. BOUNDED QUEUE SIZE:
   Set maximum queue length.
   When full: block producer, reject messages, or drop oldest.

3. CONSUMER SCALING:
   Add consumers when queue depth exceeds threshold.
   Kubernetes HPA based on queue length metric.

4. PREFETCH LIMIT:
   Limit number of unacknowledged messages per consumer.
   RabbitMQ: channel.prefetch(10)
   Prevents fast broker from overwhelming slow consumer.

5. CIRCUIT BREAKER:
   If downstream service is slow, stop consuming temporarily.
   Resume after cool-down period.
```

```ts
// Consumer with backpressure (prefetch + circuit breaker)
import CircuitBreaker from 'opossum';

const breaker = new CircuitBreaker(processMessage, {
  timeout: 5000,        // 5s per message
  errorThresholdPercentage: 50,
  resetTimeout: 30000,  // 30s before retrying
});

breaker.on('open', () => {
  console.warn('Circuit breaker OPEN -- pausing consumer');
  consumer.pause();
});

breaker.on('halfOpen', () => {
  console.info('Circuit breaker HALF-OPEN -- resuming consumer');
  consumer.resume();
});
```

## RabbitMQ Patterns

### Exchange Types

```
DIRECT Exchange:
  Routes message to queue with matching routing key.
  Use: Specific task routing (order.created -> order-processing queue)

FANOUT Exchange:
  Routes message to ALL bound queues (ignores routing key).
  Use: Broadcasting (send notification to email, SMS, push queues)

TOPIC Exchange:
  Routes based on routing key pattern matching.
  Pattern: order.* matches order.created, order.updated
  Pattern: order.# matches order.created, order.item.added
  Use: Flexible routing (different consumers for different event types)

HEADERS Exchange:
  Routes based on message headers (not routing key).
  Use: Complex routing rules based on message metadata
```

### RabbitMQ Best Practices

```
PRODUCER:
  - Use publisher confirms (wait for broker ack)
  - Set message persistence (deliveryMode: 2)
  - Use mandatory flag to detect unroutable messages

CONSUMER:
  - Always use manual acknowledgment (not auto-ack)
  - Set prefetch count (QoS) to limit in-flight messages
  - Use consumer cancellation notifications

QUEUE:
  - Set durable: true (survives broker restart)
  - Set appropriate TTL for messages
  - Configure dead letter exchange for failed messages
  - Set queue length limits with overflow policy
```

## Kafka Patterns

### Topic Design

```
TOPIC NAMING CONVENTION:
  <domain>.<entity>.<event-type>
  Example: ecommerce.orders.created
           ecommerce.orders.updated
           payments.transactions.completed

PARTITION STRATEGY:
  - Partition by entity ID (all events for same entity in same partition)
  - Ensures ordering per entity
  - Number of partitions = max parallelism

  producer.send({
    topic: 'orders',
    messages: [{
      key: order.id,        // Partition key
      value: JSON.stringify(event),
      headers: {
        'event-type': 'order.created',
        'event-id': uuid(),
        'timestamp': Date.now().toString(),
      },
    }],
  });
```

### Consumer Group Patterns

```
CONSUMER GROUP:
  - Multiple consumers share the work (one partition per consumer)
  - Each message processed by exactly one consumer in the group
  - Consumer failure: partitions rebalanced to remaining consumers

  const consumer = kafka.consumer({ groupId: 'order-processor' });
  await consumer.subscribe({ topic: 'orders', fromBeginning: false });
  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      await processOrder(JSON.parse(message.value.toString()));
    },
  });

MULTIPLE CONSUMER GROUPS:
  - Each group gets all messages independently
  - Use for: different processing pipelines on same events

  Group 'order-processor'  -> Updates order status
  Group 'analytics'        -> Records analytics
  Group 'notification'     -> Sends notifications
```

## SQS Patterns (AWS)

```ts
// SQS with proper error handling
import { SQSClient, ReceiveMessageCommand, DeleteMessageCommand } from '@aws-sdk/client-sqs';

const sqs = new SQSClient({ region: 'us-east-1' });

async function pollMessages() {
  const { Messages } = await sqs.send(new ReceiveMessageCommand({
    QueueUrl: QUEUE_URL,
    MaxNumberOfMessages: 10,
    WaitTimeSeconds: 20,        // Long polling (reduces cost)
    VisibilityTimeout: 300,     // 5 min to process before retry
    MessageAttributeNames: ['All'],
  }));

  if (!Messages) return;

  await Promise.allSettled(
    Messages.map(async (message) => {
      try {
        # ... (condensed) ...
      } catch (error) {
        console.error('Processing failed, will retry:', error);
        // Message becomes visible again after VisibilityTimeout
      }
    })
  );
}
```

## Event Schema Evolution

### Schema Compatibility Rules

```
BACKWARD COMPATIBLE (consumers can read old AND new):
  - Add optional field with default
  - Remove field that was optional
  - Widen type (int -> long)

FORWARD COMPATIBLE (old consumers can read new messages):
  - Add optional field (old consumers ignore it)
  - Remove optional field

FULL COMPATIBLE:
  - Both backward and forward
  - Only add optional fields with defaults
  - Never remove or rename required fields

BREAKING (requires versioning):
  - Remove required field
  - Rename field
  - Change field type incompatibly
  - Change field semantics
```

### Schema Versioning

```ts
// Include schema version in messages
interface OrderEvent {
  schemaVersion: number;
  eventId: string;
  eventType: 'order.created' | 'order.updated';
  timestamp: string;
  data: OrderEventData;
}

// Consumer handles multiple versions
function processOrderEvent(event: OrderEvent) {
  switch (event.schemaVersion) {
    case 1:
      return processV1(event.data as OrderV1);
    case 2:
      return processV2(event.data as OrderV2);
    default:
      console.warn(`Unknown schema version: ${event.schemaVersion}`);
      // Forward to DLQ for investigation
  }
}

// Schema registry (Kafka + Avro/Protobuf)
// Automatically validates schema compatibility on publish
```

## Ordering Guarantees

```
GLOBAL ORDER (all messages in order):
  - Single partition/queue
  - Single consumer
  - Limits throughput
  - Rarely needed

PER-ENTITY ORDER (messages for same entity in order):
  - Partition by entity ID
  - All events for entity X go to same partition
  - Ordered within partition, not across partitions
  - RECOMMENDED for most use cases

NO ORDER GUARANTEE:
  - Maximum throughput
  - Messages processed in any order
  - Consumer must handle out-of-order
  - Good for independent events

FIFO QUEUES (AWS SQS FIFO):
  - MessageGroupId for per-group ordering
  - MessageDeduplicationId for exactly-once
  - 300 messages/second per group (3000 with batching)
```

## Queue Architecture Checklist

- [ ] Messaging pattern selected (queue, topic, stream) per use case
- [ ] Delivery guarantee chosen (at-least-once for most cases)
- [ ] Consumer idempotency implemented for at-least-once delivery
- [ ] Dead letter queue configured with monitoring and alerts
- [ ] Retry policy defined with exponential backoff
- [ ] Backpressure handling implemented (prefetch, scaling, circuit breaker)
- [ ] Ordering guarantee matches business requirements (per-entity)
- [ ] Schema versioning strategy defined for event evolution
- [ ] Consumer groups configured for parallel processing
- [ ] Monitoring covers queue depth, processing latency, error rates
- [ ] Message TTL set to prevent unbounded queue growth
- [ ] DLQ reprocessing tooling available
- [ ] Producer confirms/acks enabled for guaranteed publishing
- [ ] Partition strategy considers data locality and parallelism

## When to Use

**Use this skill when:**
- Designing or implementing queue architect solutions
- Reviewing or improving existing queue architect approaches
- Making architectural or implementation decisions about queue architect
- Learning queue architect patterns and best practices
- Troubleshooting queue architect-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Queue Architect Analysis

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

**Input:** "Help me implement queue architect for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended queue architect approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When queue architect must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
