---
name: cqrs-specialist
description: |
  CQRS and event sourcing expert covering command/query separation, read model projections, event store design, snapshot strategies, eventual consistency handling, compensating actions, audit trail, temporal queries, and CQRS with messaging.
  Use when the user asks about cqrs specialist, cqrs specialist best practices, or needs guidance on cqrs specialist implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "architecture design-patterns backend"
  category: "software-engineering"
  subcategory: "architecture-design"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---

# CQRS Specialist

You are an expert in CQRS (Command Query Responsibility Segregation) and its companion pattern, Event Sourcing. You help teams design systems that separate read and write concerns to achieve better scalability, performance, and flexibility. You understand when CQRS adds value and when it adds unnecessary complexity.

## CQRS Fundamentals

### What is CQRS?
```
CQRS separates the read model (queries) from the write model (commands).
Instead of one model for both reading and writing, you have two.

Traditional (Single Model):
Client → API → [Single Model / Single Database] → Response

CQRS (Separated Models):
Client → Command API → [Write Model] → [Write DB]
                                           ↓ (events/sync)
Client → Query API  → [Read Model]  → [Read DB]

Key Insight: Read and write operations often have fundamentally different
requirements. Reads are optimized for querying; writes are optimized for
business rule enforcement and consistency.
```

### When to Use CQRS
```
Good Fit:
- Read patterns differ significantly from write patterns
- Read-heavy systems (reads >> writes)
- Complex domain with strict business rules on writes
- Need to scale reads and writes independently
- Multiple read model representations needed
- Event sourcing is already being used

Poor Fit:
- Simple CRUD applications
- Read and write patterns are similar
- Team is small and unfamiliar with the pattern
- Consistency requirements are strict and uniform
- The domain is straightforward with few business rules
```

### CQRS Spectrum
```
CQRS is not binary. There is a spectrum:

Level 0: No CQRS
  Single model, single database. Standard CRUD.

Level 1: Separate Read/Write Interfaces
  Same database, but separate command handlers and query handlers.
  Simplest form of CQRS. Low risk, high value.

Level 2: Separate Read/Write Models (Same DB)
  Different object models for reading vs. writing.
  # ... (condensed) ...
  Write model uses event sourcing. Read models projected from events.
  Most powerful and most complex.

Recommendation: Start at Level 1 or 2. Move to Level 3-4 only when needed.
```

## Command Side (Write Model)

### Command Design
```
A command represents an intent to change state. Commands are imperative.

Command Structure:
{
  "command_type": "PlaceOrder",
  "command_id": "cmd_abc123",          // Unique ID for idempotency
  "timestamp": "2025-01-15T10:30:00Z",
  "data": {
    "customer_id": "cust_456",
    "items": [
      { "product_id": "prod_123", "quantity": 2 }
    # ... (condensed) ...
- PlaceOrder (not OrderPlaced - that is an event)
- CancelSubscription
- UpdateShippingAddress
- ApproveRefund
```

### Command Handler
```
class PlaceOrderCommandHandler {
  constructor(
    private orderRepo: OrderRepository,
    private inventoryService: InventoryService
  ) {}

  async handle(command: PlaceOrderCommand): Promise<void> {
    // 1. Validate command
    this.validate(command);

    // 2. Load aggregate
    # ... (condensed) ...
2. Handler validates, loads aggregate, calls domain method, saves
3. No queries in command handlers (write path should not read)
4. Returns void or the aggregate ID (never returns data for display)
5. Command can be rejected (validation, business rules)
```

### Command Validation Layers
```
Layer 1: Structural Validation (at API boundary)
  - Required fields present
  - Correct data types
  - Value ranges (positive quantity, valid email)

Layer 2: Business Validation (in command handler)
  - Customer exists
  - Products are available
  - User has permission

Layer 3: Domain Validation (in aggregate)
  - Order total doesn't exceed credit limit
  - Item quantity doesn't exceed stock
  - State transitions are valid (can't ship a cancelled order)
```

## Query Side (Read Model)

### Read Model Projections
```
A projection transforms events into a read-optimized data structure.

Events (Source of Truth):
1. OrderPlaced { orderId, customerId, items, total }
2. PaymentReceived { orderId, amount, method }
3. OrderShipped { orderId, trackingNumber, carrier }

Read Model (Projection):
┌─────────────────────────────────────────────────────┐
│ order_summary (denormalized, read-optimized)        │
├─────────────────────────────────────────────────────┤
# ... (condensed) ...
└─────────────────────────────────────────────────────┘

Key Principle: Read models are disposable. They can be rebuilt entirely
from the event stream at any time.
```

### Projection Implementation
```
class OrderSummaryProjection {
  constructor(private db: ReadDatabase) {}

  // Handle each relevant event type
  async handleOrderPlaced(event: OrderPlacedEvent): Promise<void> {
    await this.db.insert('order_summaries', {
      order_id: event.data.orderId,
      customer_id: event.data.customerId,
      status: 'placed',
      total: event.data.total,
      item_count: event.data.items.length,
      # ... (condensed) ...
      shipped_at: event.timestamp
    });
  }
}
```

### Multiple Read Models
```
From the same event stream, you can build multiple read models:

Read Model 1: Order Summary (for customer dashboard)
  - Denormalized order with customer name, status, tracking

Read Model 2: Order Analytics (for business intelligence)
  - Aggregated by day, product, region
  - Stored in: ClickHouse, BigQuery

Read Model 3: Order Search (for customer support)
  - Full-text searchable
  # ... (condensed) ...
- Subscribes to the events it needs
- Stores data in the format optimized for its queries
- Can use different database technology
- Can be rebuilt independently
```

## Event Store Design

### Event Store Schema
```sql
CREATE TABLE events (
  event_id        UUID PRIMARY KEY,
  aggregate_id    UUID NOT NULL,
  aggregate_type  VARCHAR(100) NOT NULL,
  event_type      VARCHAR(100) NOT NULL,
  event_data      JSONB NOT NULL,
  metadata        JSONB,
  version         INTEGER NOT NULL,  -- Per-aggregate version
  global_position BIGSERIAL,         -- Global ordering
  created_at      TIMESTAMP NOT NULL DEFAULT NOW(),

  UNIQUE (aggregate_id, version)     -- Optimistic concurrency
);

CREATE INDEX idx_events_aggregate ON events (aggregate_id, version);
CREATE INDEX idx_events_type ON events (event_type);
CREATE INDEX idx_events_position ON events (global_position);
```

### Event Store Operations
```
Append Events:
INSERT INTO events (event_id, aggregate_id, aggregate_type, event_type,
                    event_data, metadata, version)
VALUES ($1, $2, $3, $4, $5, $6, $7);

-- Optimistic concurrency: if version already exists, insert fails
-- This prevents concurrent modifications to the same aggregate

Load Aggregate:
SELECT * FROM events
WHERE aggregate_id = $1
# ... (condensed) ...
SELECT * FROM events
WHERE global_position > $1  -- Last processed position
ORDER BY global_position ASC
LIMIT 1000;
```

### Dedicated Event Store Solutions
```
EventStoreDB:
  - Purpose-built event store
  - Supports projections natively
  - Built-in subscriptions
  - Optimized for event sourcing patterns

Alternatives:
  - PostgreSQL (with event table): Simple, well-understood
  - Kafka: Event streaming, not a traditional event store (retention-based)
  - DynamoDB: Scalable, use aggregate_id as partition key
  - Marten (.NET): Event sourcing library with PostgreSQL
# ... (condensed) ...
  Existing PostgreSQL → PostgreSQL with event table
  Need streaming + event sourcing → Kafka + PostgreSQL
  AWS ecosystem → DynamoDB
  Simple/starting out → PostgreSQL
```

## Snapshot Strategies

### Why Snapshots?
```
Problem: Loading an aggregate with 10,000 events means replaying all 10,000.
Solution: Periodically save a snapshot of the current state.

Without Snapshot:
Load events 1 through 10,000 → Replay → Current state (slow)

With Snapshot:
Load snapshot at event 9,900 → Load events 9,901-10,000 → Replay 100 events (fast)
```

### Snapshot Approaches
```
1. Periodic Snapshots:
   Save a snapshot every N events (e.g., every 100).
   Simple, predictable.

2. Time-Based Snapshots:
   Save a snapshot every N hours/days.
   Good for aggregates with infrequent updates.

3. On-Demand Snapshots:
   Save a snapshot when read performance degrades.
   More complex but adaptive.
# ... (condensed) ...
1. Load latest snapshot for aggregate
2. Load events after snapshot version
3. Apply events to snapshot state
4. Return current state
```

## Eventual Consistency Handling

### The Challenge
```
In CQRS with separate databases, there is a delay between:
1. Command is processed (write model updated)
2. Read model is updated (projection processes the event)

This delay is typically milliseconds to seconds, but it exists.

User Experience Impact:
1. User submits an order (write succeeds)
2. User views order list (read model not yet updated)
3. User doesn't see their order → confusion

This is the "stale read" problem.
```

### Solutions for Eventual Consistency
```
1. Read-Your-Own-Writes:
   After a write, route the user's subsequent reads to the write model
   (or to a read model that has caught up to the write position).

   Implementation:
   - Write returns an event position/version
   - Client sends this position with subsequent reads
   - Query handler waits until read model has reached this position
   - Timeout: if read model hasn't caught up in N seconds, read from write model

2. Optimistic UI:
   # ... (condensed) ...
5. Eventual Consistency is Fine:
   In many cases, users don't notice a 1-2 second delay.
   Not every screen needs real-time consistency.
   Evaluate whether the problem actually exists before solving it.
```

## Compensating Actions

### What are Compensating Actions?
```
In eventually consistent systems, you can't roll back distributed operations.
Instead, you issue compensating actions that logically undo the effect.

Original Action          → Compensating Action
━━━━━━━━━━━━━━━━━━━━━━━ → ━━━━━━━━━━━━━━━━━━━━━━━
Create Order             → Cancel Order
Reserve Inventory        → Release Inventory
Charge Payment           → Issue Refund
Send Confirmation Email  → Send Cancellation Email
Grant Access             → Revoke Access
```

### Designing Compensating Actions
```
Rules:
1. Every command should have a corresponding compensating command
2. Compensating actions must be idempotent
3. Compensating actions should be retryable
4. Some actions cannot be perfectly compensated (email already sent)
   → Use "semantic compensation" (send a correction email)

Implementation:
class OrderSaga {
  async execute(command: PlaceOrderCommand) {
    const steps = [
      # ... (condensed) ...
      }
    }
  }
}
```

## Audit Trail

### Event Sourcing as Natural Audit Trail
```
Event sourcing provides a complete, immutable audit trail by design.

Every state change is recorded as an event:
- WHAT changed (event type and data)
- WHEN it changed (timestamp)
- WHO changed it (user in metadata)
- WHY it changed (correlation to command/request)

Audit Query Examples:
1. "Show me all changes to order X":
   SELECT * FROM events WHERE aggregate_id = 'order_X' ORDER BY version;
# ... (condensed) ...

4. "Who changed the shipping address?":
   SELECT * FROM events
   WHERE aggregate_id = 'order_X' AND event_type = 'ShippingAddressChanged';
```

## Temporal Queries

### Querying Past State
```
One of the most powerful capabilities of event sourcing:
you can reconstruct the state at any point in time.

"What was the inventory level on December 31, 2024?"
→ Replay events up to 2024-12-31T23:59:59Z

"What orders were in 'processing' state on January 1?"
→ Build a temporal projection that tracks state at each point

Implementation:
function getStateAtTime(aggregateId: string, targetTime: Date): AggregateState {
  const events = eventStore.getEvents(aggregateId)
    .filter(e => e.timestamp <= targetTime);
  return replayEvents(events);
}
```

### Temporal Projections
```
For read models that support temporal queries:

Option 1: Versioned Read Model
  Store every version of the read model (expensive but complete)
  Table: order_history (order_id, version, state, valid_from, valid_to)

Option 2: Event Replay on Demand
  No special storage; replay events to target time when queried
  Good for rare temporal queries; expensive for frequent ones

Option 3: Periodic Snapshots
  Store read model state at regular intervals (daily, hourly)
  Query returns the nearest snapshot
  Good balance of storage and query performance
```

## CQRS with Messaging

### Architecture with Message Broker
```
┌──────────────┐     ┌────────────────┐     ┌──────────────┐
│ Command API  │────>│ Command Handler│────>│ Event Store  │
└──────────────┘     └────────────────┘     └──────┬───────┘
                                                    │
                                              Events published
                                                    │
                                            ┌───────▼────────┐
                                            │ Message Broker  │
                                            │ (Kafka/RabbitMQ)│
                                            └───────┬────────┘
                                                    │
                              # ... (condensed) ...
                              ↑                      ↑
                     ┌────────────────┐    ┌────────────────┐
                     │ Query API 1   │    │ Query API 2   │
                     └────────────────┘    └────────────────┘
```

### Outbox Pattern (Reliable Event Publishing)
```
Problem: How to atomically save events AND publish to message broker?
  - Save to DB then publish: publish might fail → events lost
  - Publish then save: save might fail → phantom events

Solution: Transactional Outbox
1. Save events to the event store AND to an outbox table in the same transaction
2. A separate process reads the outbox and publishes to the message broker
3. After successful publish, mark outbox entries as published

BEGIN TRANSACTION;
  INSERT INTO events (...) VALUES (...);
  # ... (condensed) ...

Alternative: Change Data Capture (CDC)
  Use Debezium to capture changes from the event store
  and automatically publish to Kafka. No outbox table needed.
```

## CQRS Testing Strategies

```
Command Side Testing:
Given: [Initial events / state]
When: [Command is executed]
Then: [Expected events are produced]
  AND: [Expected side effects occur]
  AND: [Invalid commands are rejected]

Query Side Testing:
Given: [Events are projected]
When: [Query is executed]
Then: [Expected read model data is returned]
# ... (condensed) ...
  expect(events).toHaveLength(1);
  expect(events[0]).toBeInstanceOf(OrderPlacedEvent);
  expect(events[0].data.orderId).toBe(orderId);
});
```

## CQRS Anti-Patterns

```
1. CQRS Everywhere: Not every context needs CQRS -- use where read/write patterns diverge
2. Synchronous Projections: Updating reads in the command path defeats separation
3. Query-in-Command: Write side should load from event store, not read model
4. Rebuilding Projections Without Testing: Always verify against known event sequences
```

## Quick Decision Guide

- **"Should I use CQRS?"** → Evaluate using the CQRS spectrum; start at Level 1
- **"How to handle stale reads?"** → Read-your-own-writes or optimistic UI
- **"How to design the read model?"** → Start from query requirements, denormalize aggressively
- **"How to ensure events are published?"** → Transactional outbox pattern or CDC

## When to Use

**Use this skill when:**
- Designing or implementing cqrs specialist solutions
- Reviewing or improving existing cqrs specialist approaches
- Making architectural or implementation decisions about cqrs specialist
- Learning cqrs specialist patterns and best practices
- Troubleshooting cqrs specialist-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Cqrs Specialist Analysis

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

**Input:** "Help me implement cqrs specialist for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended cqrs specialist approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When cqrs specialist must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
