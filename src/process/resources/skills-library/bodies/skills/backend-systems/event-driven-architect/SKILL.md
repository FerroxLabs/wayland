---
name: event-driven-architect
description: |
  Event-driven architecture expertise covering event sourcing, CQRS, message brokers (Kafka, RabbitMQ), saga patterns, eventual consistency, idempotency, event schema design, dead letter queues, and building resilient distributed systems.
  Use when the user asks about event driven architect, event driven architect best practices, or needs guidance on event driven architect implementation.
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
  difficulty: "advanced"
---

# Event-Driven Architect

You are an expert in designing event-driven distributed systems. Event-driven architecture decouples producers from consumers, enables asynchronous processing, and makes systems resilient to partial failures. It also introduces complexity that you must manage deliberately: eventual consistency, message ordering, idempotency, and debugging distributed workflows. The goal is not to use events everywhere, but to use them where they genuinely solve problems that synchronous communication cannot.

## When to Use Event-Driven Architecture

### Decision Framework

```
USE EVENTS WHEN:
  ✓ Multiple systems need to react to the same occurrence
  ✓ The producer should not wait for the consumer (async is acceptable)
  ✓ You need temporal decoupling (producer and consumer need not be online simultaneously)
  ✓ You need to replay historical events (event sourcing, audit trail)
  ✓ Load leveling: smooth out traffic spikes via queue buffering

USE SYNCHRONOUS (HTTP/gRPC) WHEN:
  ✗ The caller needs an immediate response (e.g., "is this username available?")
  ✗ The operation must be atomic (all-or-nothing in one step)
  ✗ Simple request-response with one consumer
  ✗ Latency matters more than decoupling
```

### Event-Driven vs Request-Driven

| Aspect | Event-Driven | Request-Driven (HTTP/gRPC) |
|--------|-------------|---------------------------|
| Coupling | Loose (producer doesn't know consumers) | Tight (caller knows the callee) |
| Latency | Higher (async, eventual) | Lower (synchronous) |
| Reliability | Higher (messages persisted in broker) | Lower (if callee is down, call fails) |
| Debugging | Harder (distributed traces needed) | Easier (single call stack) |
| Scaling | Independent (consumer scales separately) | Coupled (both must handle load) |
| Ordering | Needs explicit handling | Natural (sequential calls) |

## Event Design

### Event Types

| Type | Description | Example | Mutability |
|------|------------|---------|------------|
| **Domain event** | Something that happened in the business | `OrderPlaced`, `PaymentReceived` | Immutable fact |
| **Integration event** | Cross-service communication | `UserCreated` (published for other services) | Immutable fact |
| **Command** | Request for action | `ProcessPayment`, `SendEmail` | Can be rejected |
| **Notification** | Fire-and-skip alert | `LowInventoryWarning` | No response expected |

### Event Schema Best Practices

```typescript
// GOOD: Well-designed event
interface OrderPlacedEvent {
  // Metadata (every event should have these)
  eventId: string;           // Unique identifier for idempotency
  eventType: 'OrderPlaced';  // Discriminator for routing
  timestamp: string;         // ISO 8601
  version: 1;                // Schema version for evolution
  source: 'order-service';   // Which service emitted it
  correlationId: string;     // Links related events across services
  causationId: string;       // Which event/command caused this one

  // Payload (domain-specific data)
  data: {
    orderId: string;
    customerId: string;
    items: Array<{
      productId: string;
      quantity: number;
      priceAtOrder: number;   // Snapshot the price at order time
    }>;
    totalAmount: number;
    currency: string;
  };
}

// BAD: Common event design mistakes
interface BadEvent {
  type: 'order';            // Too vague. What happened to the order?
  data: {
    order: Order;           // Entire entity. Too much data. Tight coupling.
    // No event ID (can't deduplicate)
    // No timestamp (can't order events)
    // No version (can't evolve schema)
  };
}
```

### Schema Evolution

```
RULES FOR BACKWARDS-COMPATIBLE EVOLUTION:

  SAFE CHANGES:
    ✓ Add new optional fields
    ✓ Add new event types
    ✓ Add documentation

  UNSAFE CHANGES (require versioning):
    ✗ Remove fields
    ✗ Rename fields
    ✗ Change field types
    ✗ Change semantics of existing fields

  VERSIONING STRATEGY:
    Option A: Version in event type ("OrderPlaced.v2")
    Option B: Version field in metadata (version: 2)
    Option C: Separate topic per version (orders.v1, orders.v2)

  MIGRATION:
    1. Deploy consumers that handle BOTH v1 and v2
    2. Deploy producers that emit v2
    3. Eventually remove v1 handling from consumers
```

## Message Brokers

### Broker Comparison

| Feature | Kafka | RabbitMQ | AWS SQS/SNS | Redis Streams |
|---------|-------|----------|-------------|---------------|
| **Model** | Log-based | Queue-based | Cloud-managed queue | In-memory log |
| **Ordering** | Per partition | Per queue | Best-effort (FIFO available) | Per stream |
| **Retention** | Configurable (days/forever) | Until consumed | 14 days max | Configurable |
| **Throughput** | Very high (millions/sec) | High (10K-50K/sec) | High (auto-scaled) | Very high |
| **Replay** | Yes (seek to offset) | No (consumed = gone) | No | Yes (seek to ID) |
| **Consumer groups** | Built-in | Plugin | Built-in | Built-in |
| **Best for** | High-volume event streaming | Task queues, RPC | Serverless, AWS-native | Simple streaming, caching layer |

### Kafka Architecture

```
TOPIC: order-events (3 partitions)

Producer → ┌─────────────────────────────────────────┐
           │  Partition 0: [msg1] [msg4] [msg7]       │
           │  Partition 1: [msg2] [msg5] [msg8]       │
           │  Partition 2: [msg3] [msg6] [msg9]       │
           └─────────────────────────────────────────┘
                    │          │          │
                    ▼          ▼          ▼
           Consumer Group "payment-service"
              Consumer A   Consumer B   Consumer C
              (reads P0)   (reads P1)   (reads P2)

KEY CONCEPTS:
  - Partitions enable parallel consumption
  - Partition key determines which partition (e.g., orderId)
  - Messages with same key always go to same partition (ordering guarantee)
  - Consumer group: each partition consumed by exactly one consumer
  - Multiple consumer groups can independently read the same topic
```

### Kafka Producer Configuration

```typescript
import { Kafka, Partitioners } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'order-service',
  brokers: ['kafka1:9092', 'kafka2:9092', 'kafka3:9092'],
});

const producer = kafka.producer({
  createPartitioner: Partitioners.DefaultPartitioner,
  idempotent: true,        // Exactly-once within partition
  maxInFlightRequests: 5,
  retry: { retries: 5 },
});

await producer.connect();

// Publish event with ordering guarantee
await producer.send({
  topic: 'order-events',
  messages: [{
    key: order.id,          // Same orderId always goes to same partition
    value: JSON.stringify({
      eventId: uuid(),
      eventType: 'OrderPlaced',
      timestamp: new Date().toISOString(),
      data: { orderId: order.id, items: order.items },
    }),
    headers: {
      'correlation-id': correlationId,
      'content-type': 'application/json',
    },
  }],
});
```

### RabbitMQ Patterns

```
DIRECT EXCHANGE (point-to-point):
  Producer → Exchange → Queue → Consumer
  Use for: Task distribution, work queues

FANOUT EXCHANGE (publish-subscribe):
  Producer → Exchange → Queue A → Consumer A
                     → Queue B → Consumer B
                     → Queue C → Consumer C
  Use for: Broadcasting events to multiple consumers

TOPIC EXCHANGE (pattern-based routing):
  Producer → Exchange → "order.created" → Queue A (bound to "order.*")
                     → "order.shipped"  → Queue A (bound to "order.*")
                     → "order.created"  → Queue B (bound to "*.created")
  Use for: Selective subscription based on routing patterns
```

## Event Sourcing

### Concept

```
TRADITIONAL: Store current state
  users table: { id: 1, name: "Jane", email: "jane@new.com", role: "admin" }
  (Previous states are lost)

EVENT SOURCING: Store the sequence of events
  Event 1: UserCreated { id: 1, name: "Jane", email: "jane@old.com" }
  Event 2: EmailChanged { id: 1, newEmail: "jane@new.com" }
  Event 3: RoleChanged { id: 1, newRole: "admin" }

  Current state = replay(Event 1, Event 2, Event 3)
  State at any point in time = replay events up to that point
```

### Event Store Implementation

```typescript
// Event store interface
interface EventStore {
  // Append events for an aggregate
  append(streamId: string, events: DomainEvent[], expectedVersion: number): Promise<void>;

  // Load all events for an aggregate
  load(streamId: string): Promise<DomainEvent[]>;

  // Load events since a specific version (for snapshots)
  loadFrom(streamId: string, fromVersion: number): Promise<DomainEvent[]>;
}

// Aggregate rebuilds state from events
class Order {
  private state: OrderState;
  private version: number = 0;
  private uncommittedEvents: DomainEvent[] = [];

  static fromEvents(events: DomainEvent[]): Order {
    const order = new Order();
    events.forEach((event) => order.apply(event, false));
    return order;
  }

  placeOrder(items: OrderItem[], customerId: string): void {
    // Validate business rules against CURRENT state
    if (this.state.status !== undefined) {
      throw new Error('Order already exists');
    }
    // Emit event (not mutation)
    this.apply(new OrderPlacedEvent(this.id, items, customerId), true);
  }

  private apply(event: DomainEvent, isNew: boolean): void {
    // Update internal state based on event type
    switch (event.type) {
      case 'OrderPlaced':
        this.state = { status: 'placed', items: event.data.items };
        break;
      case 'OrderShipped':
        this.state = { ...this.state, status: 'shipped' };
        break;
    }
    this.version++;
    if (isNew) this.uncommittedEvents.push(event);
  }
}
```

## CQRS (Command Query Responsibility Segregation)

```
WRITE SIDE (Commands):                 READ SIDE (Queries):
┌─────────────────────┐               ┌─────────────────────┐
│  POST /orders       │               │  GET /orders         │
│  (validate, apply)  │               │  (optimized reads)   │
│                     │               │                      │
│  ┌───────────────┐  │   Events      │  ┌───────────────┐  │
│  │ Event Store   │──┼──────────────>│  │ Read Database  │  │
│  │ (append-only) │  │   (project)   │  │ (denormalized) │  │
│  └───────────────┘  │               │  └───────────────┘  │
└─────────────────────┘               └─────────────────────┘

BENEFITS:
  - Write model optimized for validation and consistency
  - Read model optimized for query patterns (denormalized, materialized views)
  - Independent scaling (reads scale differently from writes)
  - Multiple read models for different query needs

COST:
  - Eventual consistency between write and read sides
  - More infrastructure (two databases, projection process)
  - Only justified when read and write patterns differ significantly
```

## Saga Patterns

### Choreography vs Orchestration

```
CHOREOGRAPHY (event chain):
  OrderService         PaymentService      InventoryService     ShippingService
  │ OrderPlaced ────>  │                   │                    │
  │                    │ PaymentCharged ──> │                    │
  │                    │                   │ InventoryReserved > │
  │                    │                   │                    │ ShipmentCreated
  │ <──────────────────────────────────────────────────────────┘

  PROS: Simple, no central coordinator
  CONS: Hard to track overall progress, hard to debug, circular events possible

ORCHESTRATION (central coordinator):
  Saga Orchestrator
  │
  ├── 1. Command: ChargePayment → PaymentService
  │      Response: PaymentCharged ✓
  │
  ├── 2. Command: ReserveInventory → InventoryService
  │      Response: InventoryReserved ✓
  │
  ├── 3. Command: CreateShipment → ShippingService
  │      Response: ShipmentCreated ✓
  │
  └── 4. Complete saga

  PROS: Clear flow, easy to debug, centralized error handling
  CONS: Single point of failure (the orchestrator), more coupling
```

### Compensating Transactions

```typescript
// Orchestrated saga with compensation
class OrderSaga {
  private steps: SagaStep[] = [
    {
      name: 'chargePayment',
      execute: (ctx) => this.paymentService.charge(ctx.orderId, ctx.amount),
      compensate: (ctx) => this.paymentService.refund(ctx.orderId, ctx.paymentId),
    },
    {
      name: 'reserveInventory',
      execute: (ctx) => this.inventoryService.reserve(ctx.orderId, ctx.items),
      compensate: (ctx) => this.inventoryService.release(ctx.orderId, ctx.reservationId),
    },
    {
      name: 'createShipment',
      execute: (ctx) => this.shippingService.create(ctx.orderId, ctx.address),
      compensate: (ctx) => this.shippingService.cancel(ctx.orderId, ctx.shipmentId),
    },
  ];

  async execute(context: SagaContext): Promise<void> {
    const completedSteps: SagaStep[] = [];

    for (const step of this.steps) {
      try {
        const result = await step.execute(context);
        Object.assign(context, result);  // Merge result into context
        completedSteps.push(step);
      } catch (error) {
        // Compensate all completed steps in reverse order
        for (const completed of completedSteps.reverse()) {
          try {
            await completed.compensate(context);
          } catch (compensateError) {
            // Log and alert: manual intervention needed
            logger.error('Compensation failed', { step: completed.name, error: compensateError });
          }
        }
        throw new SagaFailedError(step.name, error);
      }
    }
  }
}
```

## Idempotency

### Why Idempotency is Non-Negotiable

```
In distributed systems, messages can be delivered:
  - AT MOST ONCE: May lose messages (fast, no duplicates)
  - AT LEAST ONCE: May duplicate messages (reliable, needs idempotency)
  - EXACTLY ONCE: Extremely expensive (requires distributed transactions)

Most systems use AT LEAST ONCE + IDEMPOTENT CONSUMERS
```

### Idempotency Implementation

```typescript
class IdempotentEventHandler {
  constructor(private processedEventStore: ProcessedEventStore) {}

  async handle(event: DomainEvent): Promise<void> {
    // Check if already processed
    const alreadyProcessed = await this.processedEventStore.exists(event.eventId);
    if (alreadyProcessed) {
      logger.info('Duplicate event, skipping', { eventId: event.eventId });
      return;
    }

    // Process the event (your business logic)
    await this.processEvent(event);

    // Mark as processed (ideally in same transaction as business logic)
    await this.processedEventStore.markProcessed(event.eventId);
  }
}

// Database-backed deduplication table
// CREATE TABLE processed_events (
//   event_id VARCHAR(255) PRIMARY KEY,
//   processed_at TIMESTAMP DEFAULT NOW(),
//   handler_name VARCHAR(255)
// );
```

## Dead Letter Queues

```
FLOW:
  Main Queue → Consumer attempts processing
    ├── Success → Acknowledge message
    └── Failure → Retry (with backoff)
        ├── Retry 1 (1 sec delay)
        ├── Retry 2 (5 sec delay)
        ├── Retry 3 (30 sec delay)
        └── Max retries exceeded → Dead Letter Queue (DLQ)

DLQ HANDLING:
  1. Alert on-call engineer when DLQ depth > 0
  2. Investigate: Why did processing fail?
  3. Fix the bug or data issue
  4. Replay messages from DLQ back to main queue
  5. Monitor: ensure messages process successfully
```

## Common Anti-Patterns

1. **Event-driven everything**: Not all communication needs events. Simple request-response between two services is fine. Events add complexity; use them when the decoupling is worth it.

2. **Fat events**: Including the entire entity in every event. Events should contain only what happened, not the complete state. Consumers that need full state should maintain their own read model.

3. **Missing idempotency**: Assuming messages are delivered exactly once. They are not. Every consumer must be idempotent.

4. **No dead letter queue**: Failed messages disappear silently. Always configure a DLQ and monitor its depth.

5. **Synchronous over events**: Calling HTTP endpoints in event handlers and waiting for responses. This defeats the purpose of async processing and creates coupling.

## Event-Driven Architecture Checklist

- [ ] Event types designed with metadata (eventId, timestamp, version, correlation)
- [ ] Schema evolution strategy defined (backwards-compatible or versioned)
- [ ] Message broker selected based on requirements (ordering, replay, throughput)
- [ ] Partition/routing keys chosen for ordering guarantees
- [ ] All consumers are idempotent (deduplication by eventId)
- [ ] Dead letter queues configured with alerting
- [ ] Retry policy defined with exponential backoff
- [ ] Saga pattern chosen (choreography or orchestration) with compensating transactions
- [ ] Eventual consistency communicated to stakeholders (UI shows "processing" states)
- [ ] Distributed tracing enabled (correlation IDs propagated through events)
- [ ] Event catalog documented (which service emits/consumes which events)

## Output Format

```markdown
# Event Driven Architect Analysis

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

**Input:** "Help me implement event driven architect for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended event driven architect approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When event driven architect must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
