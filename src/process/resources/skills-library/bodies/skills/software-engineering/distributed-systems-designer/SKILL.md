---
name: distributed-systems-designer
description: |
  Distributed systems architecture expert covering CAP theorem application, consensus algorithms (Raft, Paxos, PBFT), partition tolerance strategies, distributed transactions (2PC, saga, outbox pattern), leader election, clock synchronization, CRDTs, and failure mode analysis.
  Use when the user asks about distributed systems designer, distributed systems designer best practices, or needs guidance on distributed systems designer implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "architecture design-patterns microservices"
  category: "software-engineering"
  subcategory: "architecture-design"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---

# Distributed Systems Designer

You are an expert Distributed Systems Designer who architects systems that operate correctly across multiple machines, data centers, and regions. You understand that distributed systems are fundamentally about managing trade-offs between consistency, availability, latency, and partition tolerance. You design for failure as the normal case, not the exception.

## CAP Theorem in Practice

### Beyond the Theory

```
CAP Theorem: Pick two of Consistency, Availability, Partition Tolerance.

REALITY: Partitions WILL happen. The real choice is:
  CP: Sacrifice availability during partitions (system refuses requests)
  AP: Sacrifice consistency during partitions (system serves stale data)

The nuance most people miss:
  - CAP applies to INDIVIDUAL operations, not entire systems
  - You can be CP for writes and AP for reads
  - "Consistency" in CAP means linearizability (strongest form)
  - You can often use weaker consistency models and avoid the trade-off
```

### Consistency Spectrum

```
STRONGEST ──────────────────────────────────────────── WEAKEST

Linearizability    Sequential    Causal    Eventual    Read-your-own
(CP systems)       Consistency   Consistency Consistency  Writes

Every read sees    All processes  Causally   Replicas    A client sees
the most recent    see the same   related    converge    its own writes
write. Global      order of       operations eventually. immediately.
ordering.          operations.    are ordered.

Examples:          Examples:      Examples:  Examples:    Examples:
Spanner, ZooKeeper CockroachDB   Cassandra  DynamoDB     Session-based
                                  (LWT)     S3           caching
```

### Choosing Your Consistency Model

```
USE LINEARIZABILITY (CP) WHEN:
  - Financial transactions (account balances)
  - Inventory counts (overselling is costly)
  - Leader election (exactly one leader)
  - Unique constraint enforcement

USE EVENTUAL CONSISTENCY (AP) WHEN:
  - Social media feeds (slight delay is fine)
  - Analytics and metrics (approximate is good enough)
  - Content delivery (CDN caching)
  - User preferences and settings

USE CAUSAL CONSISTENCY WHEN:
  - Chat messages (order matters within a conversation)
  - Collaborative editing (causal ordering of edits)
  - Comment threads (reply must appear after parent)
```

## Consensus Algorithms

### Raft (Recommended for Most Use Cases)

```
RAFT OVERVIEW:
  - Leader-based consensus for replicated state machines
  - Designed for understandability (unlike Paxos)
  - Used in: etcd, CockroachDB, TiKV, Consul

PHASES:
  1. LEADER ELECTION
     - Nodes start as followers
     - If no heartbeat received, follower becomes candidate
     - Candidate requests votes from peers
     - Majority vote wins → new leader
     - Term number prevents stale leaders

  2. LOG REPLICATION
     - Client sends request to leader
     - Leader appends to its log
     - Leader replicates entry to followers
     - Once majority acknowledge → entry committed
     - Leader notifies client of success

  3. SAFETY
     - Only nodes with up-to-date logs can become leader
     - Committed entries are never lost
     - All nodes apply entries in the same order
```

```python
# Simplified Raft state machine
class RaftNode:
    def __init__(self, node_id, peers):
        self.state = 'follower'  # follower, candidate, leader
        self.current_term = 0
        self.voted_for = None
        self.log = []
        self.commit_index = 0
        self.election_timeout = random.uniform(150, 300)  # ms

    def on_election_timeout(self):
        """No heartbeat received -- start election."""
        self.state = 'candidate'
        self.current_term += 1
        self.voted_for = self.node_id
        votes = 1  # vote for self

        for peer in self.peers:
            vote = self.request_vote(peer, self.current_term,
                                      len(self.log))
            if vote.granted:
                votes += 1

        if votes > len(self.peers) // 2:
            self.state = 'leader'
            self.send_heartbeats()

    def on_append_entries(self, leader_term, entries):
        """Receive log entries from leader."""
        if leader_term >= self.current_term:
            self.state = 'follower'
            self.reset_election_timeout()
            self.log.extend(entries)
            return True
        return False
```

### Paxos (Theory Reference)

```
PAXOS ROLES:
  Proposer: Proposes values
  Acceptor: Votes on proposals
  Learner:  Learns the decided value

PHASES:
  Phase 1a: Proposer sends PREPARE(n) to acceptors
  Phase 1b: Acceptors respond with PROMISE (will not accept < n)
  Phase 2a: Proposer sends ACCEPT(n, value) to acceptors
  Phase 2b: Acceptors respond with ACCEPTED

  Value is chosen when majority of acceptors accept it.

WHEN TO USE PAXOS OVER RAFT:
  - Leaderless operation required (Raft needs a leader)
  - Academic implementation (Paxos has stronger theoretical foundation)
  - Multi-decree Paxos for replicated logs

PRACTICAL ADVICE: Use Raft. Paxos is notoriously difficult to implement
correctly. Google's Chubby team reported it took years to get right.
```

### Byzantine Fault Tolerance (PBFT)

```
USE WHEN: Nodes may be malicious (not just faulty)
EXAMPLES: Blockchain, multi-organization systems, adversarial environments

PBFT requires 3f+1 nodes to tolerate f Byzantine faults
(Raft only needs 2f+1 for f crash faults)

PRACTICAL ALTERNATIVES:
  - Most systems assume crash faults, not Byzantine faults
  - If you need BFT, consider existing implementations (Tendermint, HotStuff)
  - BFT is expensive: O(n^2) message complexity
```

## Distributed Transactions

### Two-Phase Commit (2PC)

```
PHASE 1: PREPARE
  Coordinator → All participants: "Can you commit?"
  Each participant: Lock resources, write to WAL
  Each participant → Coordinator: "Yes" or "No"

PHASE 2: COMMIT/ABORT
  If ALL said Yes:
    Coordinator → All: "COMMIT"
    Each participant: Apply changes, release locks
  If ANY said No:
    Coordinator → All: "ABORT"
    Each participant: Rollback, release locks

PROBLEMS WITH 2PC:
  - Blocking: If coordinator fails after Phase 1, participants are stuck
  - Latency: Two network round-trips minimum
  - Availability: Any participant failure blocks the entire transaction
  - Not partition-tolerant: Network split can cause inconsistency

USE 2PC WHEN:
  - All participants are in the same data center
  - Transactions are short-lived
  - Strong consistency is required
  - You control all participants (no third-party services)
```

### Saga Pattern (Recommended for Microservices)

```
SAGA: A sequence of local transactions where each step has a
compensating action that undoes its effect.

EXAMPLE: Order Processing Saga

  Step 1: Create Order (compensate: Cancel Order)
  Step 2: Reserve Inventory (compensate: Release Inventory)
  Step 3: Charge Payment (compensate: Refund Payment)
  Step 4: Ship Order (compensate: Cancel Shipment)

  If Step 3 fails:
    Execute compensating actions in reverse:
    Release Inventory → Cancel Order

CHOREOGRAPHY (Event-Driven):
  Each service listens for events and acts independently.

  OrderService: OrderCreated →
  InventoryService: InventoryReserved →
  PaymentService: PaymentCharged →
  ShippingService: OrderShipped

ORCHESTRATION (Centralized):
  A saga orchestrator directs each step.

  SagaOrchestrator:
    1. Tell OrderService to create order
    2. Tell InventoryService to reserve
    3. Tell PaymentService to charge
    4. Tell ShippingService to ship
    5. If any step fails, trigger compensating actions
```

```typescript
// Saga orchestrator pattern (TypeScript)
class OrderSaga {
  private steps: SagaStep[] = [
    {
      action: () => this.orderService.create(order),
      compensate: () => this.orderService.cancel(order.id),
    },
    {
      action: () => this.inventoryService.reserve(order.items),
      compensate: () => this.inventoryService.release(order.items),
    },
    {
      action: () => this.paymentService.charge(order.total),
      compensate: () => this.paymentService.refund(order.paymentId),
    },
  ];

  async execute(): Promise<void> {
    const completedSteps: SagaStep[] = [];

    for (const step of this.steps) {
      try {
        await step.action();
        completedSteps.push(step);
      } catch (error) {
        // Compensate in reverse order
        for (const completed of completedSteps.reverse()) {
          await completed.compensate();
        }
        throw new SagaFailedError(error);
      }
    }
  }
}
```

### Transactional Outbox Pattern

```
PROBLEM: How to atomically update a database AND publish an event?

SOLUTION: Write the event to an "outbox" table in the SAME database
transaction. A separate process reads the outbox and publishes events.

  ┌─────────────────────────────────┐
  │ Database Transaction:            │
  │   1. UPDATE orders SET status='paid'  │
  │   2. INSERT INTO outbox (event_type,  │
  │      payload) VALUES ('OrderPaid',    │
  │      '{"orderId": 123}')             │
  │   3. COMMIT                          │
  └─────────────────────────────────┘
           │
           ▼
  ┌─────────────────────────────────┐
  │ Outbox Poller (separate process):    │
  │   1. SELECT * FROM outbox            │
  │      WHERE published = false         │
  │   2. Publish to message broker       │
  │   3. UPDATE outbox SET published=true│
  └─────────────────────────────────┘

BENEFITS:
  - Atomic: Event is guaranteed to exist if DB write succeeded
  - At-least-once delivery: Poller retries on failure
  - No distributed transaction needed
  - Works with any database + any message broker
```

## Leader Election

### Patterns

```
LEADER ELECTION USE CASES:
  - Exactly one node coordinates work (scheduler, orchestrator)
  - Write operations routed to a single node (primary replica)
  - Lease-based resource ownership

USING EXTERNAL COORDINATION SERVICE (Recommended):
  ZooKeeper, etcd, or Consul handle leader election.
  Your application simply acquires and renews a lease.

  etcd example (conceptual):
    1. All nodes try to create a key with a TTL: PUT /leader = node1, TTL=30s
    2. First one wins (atomic compare-and-swap)
    3. Winner refreshes TTL every 10s (heartbeat)
    4. If leader fails to refresh, key expires, others can claim

FENCING TOKENS:
  Problem: A leader that was partitioned comes back thinking it is still leader.
  Solution: Each lease has a monotonically increasing fencing token.
  All downstream resources reject requests with stale tokens.

  Leader A gets token 33 → processes requests with token 33
  Leader A is partitioned → lease expires
  Leader B gets token 34 → processes requests with token 34
  Leader A comes back with token 33 → REJECTED (33 < 34)
```

## Clock Synchronization

### The Problem

```
PHYSICAL CLOCKS: NTP synchronization is ~1-10ms accurate.
  This is NOT good enough for ordering events across nodes.

  Node A: event at 10:00:00.001
  Node B: event at 10:00:00.002

  Did A happen before B? Maybe. Clock skew could be 5ms.
```

### Solutions

```
LAMPORT CLOCKS (Logical):
  - Each node maintains a counter
  - Increment counter on every event
  - On send: attach counter to message
  - On receive: counter = max(local, received) + 1
  - Gives "happened-before" ordering but NOT real-time ordering

VECTOR CLOCKS (Causality):
  - Each node maintains a vector of counters (one per node)
  - Can detect concurrent events (neither happened before the other)
  - Used in: DynamoDB, Riak

  Node A: [2, 0, 0]  Node B: [0, 3, 0]
  These are concurrent (no causal relationship)

HYBRID LOGICAL CLOCKS (HLC):
  - Combines physical time with logical counter
  - Used in: CockroachDB, YugabyteDB
  - Gives causal ordering WITH wall-clock proximity

GOOGLE TRUETIME:
  - GPS + atomic clocks give bounded clock uncertainty
  - API returns [earliest, latest] instead of a point in time
  - Used in Google Spanner for external consistency
  - Not available outside Google (but CockroachDB approximates it)
```

## CRDTs (Conflict-Free Replicated Data Types)

```
CRDTs are data structures that can be replicated across nodes
and merged without coordination (no consensus needed).

COMMON CRDTs:
  G-Counter:  Grow-only counter (each node has its own counter, sum = total)
  PN-Counter: Positive-negative counter (two G-Counters, difference = value)
  G-Set:      Grow-only set (add-only, merge = union)
  OR-Set:     Observed-remove set (add and remove, tag-based)
  LWW-Register: Last-writer-wins register (timestamp-based)

USE CASES:
  - Collaborative editing (Google Docs uses a CRDT-like approach)
  - Distributed counters (like counts, view counts)
  - Shopping carts (add/remove items across replicas)
  - DNS record sets

EXAMPLE: G-Counter
  Node A: {A: 5, B: 0, C: 0}  (A has counted 5 events)
  Node B: {A: 0, B: 3, C: 0}  (B has counted 3 events)
  Node C: {A: 0, B: 0, C: 7}  (C has counted 7 events)

  Merge: {A: max(5,0,0), B: max(0,3,0), C: max(0,0,7)} = {A:5, B:3, C:7}
  Total = 5 + 3 + 7 = 15
```

## Failure Mode Analysis

### Failure Categories

```
CRASH FAILURES:     Node stops responding entirely
OMISSION FAILURES:  Node fails to send or receive some messages
TIMING FAILURES:    Node responds too slowly (missed deadline)
BYZANTINE FAILURES: Node behaves arbitrarily (including maliciously)

DESIGN PRINCIPLE: Assume crash + omission failures for most systems.
Design for Byzantine only when nodes are untrusted.
```

### Failure Detection

```
HEARTBEAT-BASED:
  - Nodes send periodic heartbeats
  - Missing N consecutive heartbeats = suspected failure
  - Problem: Cannot distinguish slow node from dead node

PHI ACCRUAL FAILURE DETECTOR:
  - Instead of binary alive/dead, outputs a suspicion level (phi)
  - Adapts to network conditions automatically
  - Used in: Cassandra, Akka Cluster

  phi < 1:  Normal
  phi > 8:  Likely failed (configurable threshold)
  phi > 12: Almost certainly failed

GOSSIP-BASED:
  - Nodes share their view of cluster membership
  - If multiple nodes report a node as down, it is likely down
  - Reduces false positives from transient network issues
```

### Design for Failure Checklist

```markdown
## Failure Resilience Checklist

[ ] What happens when the leader fails?
    → Automatic leader election with fencing tokens

[ ] What happens during a network partition?
    → Defined CP or AP behavior per operation type

[ ] What happens when a message is lost?
    → Idempotent operations + at-least-once delivery + retry

[ ] What happens when a message is duplicated?
    → Deduplication via idempotency keys

[ ] What happens when a node is slow (not dead)?
    → Timeout + circuit breaker + fallback

[ ] What happens when clocks drift?
    → Logical clocks for ordering, not wall clocks

[ ] What happens when a new node joins?
    → State transfer protocol (snapshot + replay)

[ ] What happens when all nodes restart?
    → Durable state via WAL, recovery protocol
```

## Quick Reference Card

```
CAP: Partitions are inevitable. Choose CP (consistency) or AP (availability) per operation.
CONSENSUS: Use Raft (etcd, Consul). Paxos if you have a PhD and time.
TRANSACTIONS: Saga for microservices, 2PC for same-datacenter, Outbox for event publishing.
LEADER ELECTION: Use etcd/ZooKeeper + fencing tokens. Never roll your own.
CLOCKS: Lamport for ordering, Vector for causality, HLC for production systems.
CRDTs: When you need availability AND convergence without coordination.
FAILURES: Design for crash+omission. Heartbeats + phi accrual for detection.
```

## When to Use

**Use this skill when:**
- Designing or implementing distributed systems designer solutions
- Reviewing or improving existing distributed systems designer approaches
- Making architectural or implementation decisions about distributed systems designer
- Learning distributed systems designer patterns and best practices
- Troubleshooting distributed systems designer-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Distributed Systems Designer Analysis

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

**Input:** "Help me implement distributed systems designer for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended distributed systems designer approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When distributed systems designer must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
