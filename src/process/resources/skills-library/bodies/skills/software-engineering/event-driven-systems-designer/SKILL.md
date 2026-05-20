---
name: event-driven-systems-designer
description: |
  Event-driven architecture expert covering event sourcing, CQRS, event storming, event schema design, event versioning, idempotency, ordering guarantees, event replay, dead letter handling, and choreography vs orchestration.
  Use when the user asks about event driven systems designer, event driven systems designer best practices, or needs guidance on event driven systems designer implementation.
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

# Event-Driven Systems Designer

You are an expert Event-Driven Architect who designs systems around events as first-class citizens. You understand that event-driven architecture enables loose coupling, scalability, and real-time responsiveness. You also understand the complexity it introduces and when simpler alternatives are appropriate.

## Event-Driven Architecture Fundamentals

### What is an Event?
```
An event is a record of something that happened in the past.
Events are immutable facts. They cannot be changed or deleted.

Event Structure:
{
  "event_id": "evt_abc123",          // Unique identifier
  "event_type": "OrderPlaced",       // What happened
  "aggregate_id": "order_789",       // Which entity
  "aggregate_type": "Order",         // Entity type
  "timestamp": "2025-01-15T10:30:00Z", // When it happened
  "version": 3,                      // Schema version
  "correlation_id": "req_xyz",       // Request tracing
  "causation_id": "evt_abc122",      // What caused this event
  "data": {                          // Event-specific payload
    # ... (condensed) ...
    "user_id": "user_123",
    "source": "checkout-service",
    "ip_address": "192.168.1.1"
  }
}
```

### Event Types
```
1. Domain Events: Business-meaningful occurrences
   - OrderPlaced, PaymentProcessed, UserRegistered
   - Named in past tense (something that happened)
   - Carry business context in the payload

2. Integration Events: Events shared between bounded contexts
   - Published on shared message broker
   - Schema must be stable and versioned
   - Looser coupling than domain events

3. System Events: Infrastructure-level occurrences
   - ServiceStarted, HealthCheckFailed, CircuitBreakerTripped
   - Used for monitoring and operations
```

### When to Use Event-Driven Architecture
```
Good Fit:
- Multiple consumers need to react to the same event
- Decoupled services that should not know about each other
- Real-time data processing and analytics
- Audit trail requirements
- Event sourcing use cases
- High-throughput, asynchronous workloads

Poor Fit:
- Simple CRUD applications with few consumers
- Synchronous request-response is sufficient
- Strong consistency required across all operations
- Team lacks experience with async patterns
- Simple two-service integration
```

## Event Sourcing

### Concept
```
Instead of storing current state, store the sequence of events that led to the state.

Traditional (State-Based):
┌─────────────────────────────┐
│ Orders Table                │
│ order_id: 789               │
│ status: "shipped"           │
│ total: 99.99                │
│ updated_at: 2025-01-15      │
└─────────────────────────────┘

Event Sourced:
┌─────────────────────────────┐
│ Event Store                 │
│ 1. OrderCreated    {items, total}       │
│ 2. PaymentReceived {amount, method}     │
│ 3. OrderConfirmed  {confirmed_at}       │
│ 4. OrderShipped    {tracking_number}    │
└─────────────────────────────┘

Current state = replay all events from the beginning
```

### Event Store Design
```
Schema:
┌──────────────┬──────────────┬──────────────┬────────────┬──────────┐
│ event_id     │ aggregate_id │ event_type   │ data       │ version  │
│ (UUID)       │ (UUID)       │ (string)     │ (JSON)     │ (int)    │
├──────────────┼──────────────┼──────────────┼────────────┼──────────┤
│ evt_001      │ order_789    │ OrderCreated │ {...}      │ 1        │
│ evt_002      │ order_789    │ PaymentRecvd │ {...}      │ 2        │
│ evt_003      │ order_789    │ OrderShipped │ {...}      │ 3        │
└──────────────┴──────────────┴──────────────┴────────────┴──────────┘

Key Design Decisions:
- Append-only (never update or delete events)
- Optimistic concurrency via version number
- Partitioned by aggregate_id for scalability
# ... (condensed) ...

Read Path:
1. Load all events for aggregate
2. Replay events to build current state
3. Return current state
```

### Snapshots
```
Problem: Replaying thousands of events to build state is slow.

Solution: Periodically save a snapshot of the current state.

Read with Snapshot:
1. Load latest snapshot for aggregate (if exists)
2. Load only events AFTER the snapshot version
3. Apply those events to the snapshot state
4. Return current state

Snapshot Strategy:
- Every N events (e.g., every 100 events)
- Time-based (e.g., daily)
- On-demand (when read latency exceeds threshold)

Store snapshots separately from events (events are the source of truth).
```

## Event Storming

### What is Event Storming?
A workshop technique for discovering domain events and modeling business processes.

### Event Storming Workshop Format
```
Duration: 2-4 hours
Participants: Domain experts + developers (5-12 people)
Materials: Large wall, different colored sticky notes

Sticky Note Colors:
🟧 Orange: Domain Events (past tense: "OrderPlaced")
🟦 Blue: Commands (imperative: "Place Order")
🟨 Yellow: Aggregates (entities: "Order")
🟪 Purple: Policies/Rules ("When OrderPlaced, reserve inventory")
🟥 Red: Hot Spots (questions, conflicts, unknowns)
🟩 Green: External Systems ("Payment Gateway")
🧑 Small Yellow: Actors/Users ("Customer")

Workshop Steps:
# ... (condensed) ...
   Event → Policy → Command (OrderPlaced → ReserveInventory policy → ReserveStock command)

6. (20 min) Identify Bounded Contexts: Group related events/commands into contexts

7. (10 min) Mark Hot Spots: Red stickies for unresolved questions
```

## Event Schema Design

### Schema Best Practices
```
1. Include everything the consumer needs (avoid needing to call back to producer)
2. Use past tense for event names (OrderPlaced, not PlaceOrder)
3. Include correlation and causation IDs for tracing
4. Version your schema from day one
5. Be specific: "OrderItemQuantityUpdated" not "OrderUpdated"
6. Don't include derived/computed data (consumers compute their own views)

Good Event Schema:
{
  "event_type": "OrderPlaced",
  "version": 2,
  "data": {
    "order_id": "order_789",
    "customer_id": "cust_456",
    # ... (condensed) ...
    "total": 59.98,          // Derived data (should be computed by consumer)
    "db_record_id": 12345,   // Internal implementation detail
    "updated_fields": ["status"] // Too generic
  }
}
```

### Event Schema Registry
```
Purpose: Centralized management of event schemas

Components:
- Schema definitions (JSON Schema, Avro, Protobuf)
- Version history
- Compatibility checking (backward/forward)
- Consumer/producer registration

Tools:
- Confluent Schema Registry (Kafka)
- AWS Glue Schema Registry
- Apicurio Registry
- Custom implementation
```

## Event Versioning

### Versioning Strategies
```
1. Schema Versioning (Recommended):
   Include version in the event, use schema registry for compatibility.
   {
     "event_type": "OrderPlaced",
     "version": 2,
     ...
   }

2. Event Type Versioning:
   Use different event types for different versions.
   "OrderPlaced_v1", "OrderPlaced_v2"
   Con: Consumers must handle multiple types.

3. Upcasting:
   # ... (condensed) ...
Breaking Changes (Require Migration):
- Removing a required field
- Changing a field's type
- Changing the meaning of a field
→ Create a new event type instead of modifying the existing one
```

## Idempotency

### Why Idempotency Matters
```
In event-driven systems, messages may be delivered more than once:
- Network retries
- Consumer crashes before acknowledging
- At-least-once delivery guarantees

Every consumer must handle duplicate messages safely.
```

### Idempotency Implementation Patterns
```
1. Idempotency Key (Deduplication):
   - Store processed event IDs
   - Before processing, check if event ID has been seen
   - If seen: skip or return cached result
   - Storage: Redis set, database table

   Process:
   1. Receive event with event_id: "evt_abc123"
   2. Check: EXISTS processed_events["evt_abc123"]
   3. If exists: skip (already processed)
   4. If not: process event, then ADD processed_events["evt_abc123"]

   Clean up: Remove old entries after retention period (e.g., 7 days)

# ... (condensed) ...

3. Optimistic Concurrency:
   - Include version/sequence number in the event
   - Only process if version matches expected
   - Reject if version is stale (already processed a newer version)
```

## Ordering Guarantees

### Ordering Levels
```
1. Total Order:
   - All consumers see events in exactly the same order
   - Expensive to maintain across partitions
   - Example: Single-partition Kafka topic

2. Partial Order (Per-Key):
   - Events for the same key are ordered
   - Events for different keys may be reordered
   - Example: Kafka with partition key = entity ID
   - Most common and sufficient for most use cases

3. Causal Order:
   - Causally related events are ordered
   - Concurrent events may be reordered
   - Requires vector clocks or causal tracking

4. No Order:
   - Events may arrive in any order
   - Consumer must handle any ordering
   - Simplest to implement at the producer/broker level
```

### Ensuring Per-Entity Ordering
```
Kafka Example:
- Use entity ID as the partition key
- All events for entity_123 go to the same partition
- Within a partition, ordering is guaranteed
- Different entities can be in different partitions (parallelism)

Producer:
  producer.send(
    topic="order-events",
    key=order_id,        // Partition key
    value=event_data
  )

Consumer:
  Each partition is consumed by exactly one consumer in a consumer group
  → Events for the same order are processed sequentially
```

## Event Replay

### Replay Use Cases
```
1. Rebuilding read models: Create a new projection from event history
2. Bug fixing: Replay events through fixed consumer logic
3. New consumer: Backfill historical data for a new service
4. Testing: Replay production events in test environment
5. Disaster recovery: Rebuild state from event store
```

### Replay Strategy
```
Full Replay:
- Process ALL events from the beginning
- Used for: New projections, disaster recovery
- Challenge: Can take hours/days for large event stores
- Solution: Parallel replay, snapshots

Partial Replay:
- Process events from a specific point
- Used for: Bug fixes (replay from the point the bug was introduced)
- Requires: Event store supports seeking to a position

Selective Replay:
- Process only specific event types or aggregates
- Used for: Targeted rebuilds
- Requires: Filtering capability in event store

Replay Safety:
- Replay must NOT produce side effects (no sending emails, no charging cards)
- Use a replay flag or separate consumer group
- Idempotent consumers handle duplicate processing naturally
- Validate replayed state against expected state before switching
```

## Dead Letter Handling

### Dead Letter Queue (DLQ) Design
```
Main Queue → Consumer → Process
                  ↓ (on failure after N retries)
             Dead Letter Queue → Alert → Manual Review

DLQ Event:
{
  "original_event": { ... },
  "error": "PaymentGatewayTimeout",
  "failure_count": 3,
  "first_failure": "2025-01-15T10:30:00Z",
  "last_failure": "2025-01-15T10:35:00Z",
  "consumer": "payment-service",
  "stack_trace": "..."
}
```

### DLQ Processing Strategy
```
1. Automated Retry:
   - Wait for a configurable delay
   - Re-submit to the main queue
   - Use exponential backoff (1 min, 5 min, 30 min, 2 hours)
   - Maximum retry count before alerting

2. Manual Review:
   - Dashboard showing DLQ contents
   - Ability to inspect individual events
   - Options: retry, skip, modify and retry, move to permanent failure

3. Circuit Breaker Integration:
   - If DLQ rate exceeds threshold, trip circuit breaker
   - Stop processing main queue until issue is resolved
   - Prevents cascading failures

4. Alerting:
   - DLQ depth > 0: Warning
   - DLQ depth growing: Investigate
   - DLQ depth > threshold: Critical (stop processing, investigate)
```

## Choreography vs. Orchestration

### Choreography (Decentralized)
```
Each service listens for events and decides how to react.
No central coordinator.

Order Service → publishes "OrderPlaced"
  ↓ (listens)            ↓ (listens)           ↓ (listens)
Inventory Service     Payment Service      Notification Service
→ "InventoryReserved" → "PaymentProcessed" → "NotificationSent"

Pros:
- Loose coupling (services don't know about each other)
- Easy to add new consumers (just subscribe)
- No single point of failure for coordination

Cons:
- Hard to understand the overall flow (distributed across services)
- Difficult to handle errors (who coordinates the compensation?)
- Can lead to event cycles (A triggers B triggers A)
- Hard to add complex business logic that spans services
```

### Orchestration (Centralized)
```
A central orchestrator manages the workflow.

Orchestrator:
  1. Tell Order Service: "Create Order"
  2. Tell Inventory Service: "Reserve Inventory"
  3. Tell Payment Service: "Process Payment"
  4. Tell Notification Service: "Send Confirmation"

If step 3 fails:
  1. Tell Inventory Service: "Release Inventory"
  2. Tell Order Service: "Cancel Order"
  3. Tell Notification Service: "Send Failure Notice"

Pros:
- Clear, visible workflow in one place
- Easy error handling and compensation
- Easy to add complex business logic

Cons:
- Orchestrator is a point of coupling
- Can become a bottleneck
- Risk of becoming a "god service" that knows too much
```

### Decision Framework
```
Use Choreography when:
- Simple flows (3-4 steps)
- Services are independently valuable
- Low coupling is more important than coordination
- Events have multiple independent consumers

Use Orchestration when:
- Complex flows with many steps
- Error handling requires coordinated rollback (saga)
- Business logic spans multiple services
- Visibility and monitoring of the flow is critical

Hybrid Approach (Common in Practice):
- Orchestration within a bounded context
- Choreography between bounded contexts
- Example: Order orchestrator manages the order saga,
  publishes "OrderCompleted" event that analytics, notifications,
  and other contexts consume via choreography
```

## Event-Driven Architecture Anti-Patterns

```
1. Event as Command:
   Bad: Publishing "SendEmail" event (tells someone to do something)
   Good: Publishing "OrderPlaced" event (states what happened)

2. Too Fine/Coarse Events: Use meaningful granularity ("ProfileUpdated" not "FieldXUpdated")
3. Temporal Coupling: Consumer should handle events regardless of timing
4. Missing Events: All state transitions need corresponding events
5. Shared Database: Consumer should build own read model from events
```

## Quick Decision Guide

When asked about event-driven architecture:
- **"Should I use events or REST?"** → Events for async/decoupled, REST for sync/simple
- **"How to handle failures?"** → DLQ + retry with backoff + circuit breaker
- **"How to ensure ordering?"** → Partition by entity ID, process partitions sequentially
- **"How to handle duplicate events?"** → Implement idempotency via dedup keys
- **"Choreography or orchestration?"** → Simple flows = choreography, complex = orchestration
- **"How to version events?"** → Schema registry + backward compatible changes + upcasting

## When to Use

**Use this skill when:**
- Designing or implementing event driven systems designer solutions
- Reviewing or improving existing event driven systems designer approaches
- Making architectural or implementation decisions about event driven systems designer
- Learning event driven systems designer patterns and best practices
- Troubleshooting event driven systems designer-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Event Driven Systems Designer Analysis

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

**Input:** "Help me implement event driven systems designer for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended event driven systems designer approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When event driven systems designer must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
