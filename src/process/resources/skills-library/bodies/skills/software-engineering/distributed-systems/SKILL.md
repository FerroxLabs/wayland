---
name: distributed-systems
description: |
  Distributed systems patterns expert covering CAP theorem, consensus algorithms (Raft, Paxos), distributed transactions (2PC, saga), consistent hashing, gossip protocols, vector clocks, leader election, distributed locking, and eventual consistency.
  Use when the user asks about distributed systems, distributed systems best practices, or needs guidance on distributed systems implementation.
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

# Distributed Systems

You are an expert in distributed systems design and patterns. You understand the fundamental challenges of building systems across multiple machines -- consistency, availability, partition tolerance, ordering, and failure handling. You help teams navigate these challenges with proven patterns and clear trade-off analysis.

## Fundamental Theorems

### CAP Theorem
```
In a distributed system, you can only guarantee TWO of three properties:

C - Consistency: Every read receives the most recent write
A - Availability: Every request receives a response (success or failure)
P - Partition Tolerance: System continues to operate despite network partitions

Since network partitions are inevitable in distributed systems,
the real choice is between CP and AP:

CP Systems (Consistency + Partition Tolerance):
- During a partition, the system may become unavailable
- Examples: ZooKeeper, HBase, MongoDB (with majority read concern)
- Use when: Financial transactions, inventory management, configuration

AP Systems (Availability + Partition Tolerance):
- During a partition, the system may return stale data
- Examples: Cassandra, DynamoDB, CouchDB
- Use when: Social media feeds, product catalog, analytics

Important Nuance:
CAP is about behavior DURING a partition. When the network is healthy,
you can have all three. The question is: what do you sacrifice when
things go wrong?
```

### PACELC Theorem (Extension of CAP)
```
If there is a Partition (P):
  Choose between Availability (A) and Consistency (C)
Else (E), when system is running normally:
  Choose between Latency (L) and Consistency (C)

Examples:
- DynamoDB: PA/EL (Available during partition, Low latency normally)
- MongoDB: PC/EC (Consistent during partition, Consistent normally)
- Cassandra: PA/EL (Available during partition, Low latency normally)
- PostgreSQL (single): N/A/EC (Not distributed, Consistent normally)
```

### The Eight Fallacies of Distributed Computing
```
1. The network is reliable          → Build retry logic, circuit breakers
2. Latency is zero                  → Design for latency, async where possible
3. Bandwidth is infinite            → Compress, batch, paginate
4. The network is secure            → Encrypt, authenticate, authorize
5. Topology doesn't change          → Use service discovery, not hardcoded IPs
6. There is one administrator       → Design for multi-team operation
7. Transport cost is zero           → Minimize cross-region calls
8. The network is homogeneous       → Handle different protocols and formats
```

## Consensus Algorithms

### Raft (Recommended for Most Use Cases)
```
Purpose: Achieve consensus among distributed nodes on a shared state.

Roles:
- Leader: Handles all client requests, replicates to followers
- Follower: Replicates data from leader, votes in elections
- Candidate: Node attempting to become leader

Key Mechanisms:

1. Leader Election:
   - Followers have randomized election timeouts (150-300ms)
   - If a follower doesn't hear from leader before timeout, becomes candidate
   - Candidate requests votes from all nodes
   - Majority vote wins the election
   - New leader starts sending heartbeats

2. Log Replication:
   - Client sends request to leader
   - Leader appends to its log, sends to followers
   # ... (condensed) ...
- Each election increments the term number
- Nodes reject requests from leaders with stale term numbers
- Prevents split-brain scenarios

Example Flow:
Client → Leader (Term 5) → Append to log → Replicate to 2/4 followers
        → Majority achieved (3/5) → Commit → Respond to client
```

### Paxos (Theoretical Foundation)
```
Roles:
- Proposer: Proposes values
- Acceptor: Accepts or rejects proposals
- Learner: Learns the decided value

Two Phases:

Phase 1 (Prepare):
  Proposer → Acceptors: "Prepare(n)" (n = proposal number)
  Acceptors → Proposer: "Promise(n)" if n > any previously promised

Phase 2 (Accept):
  Proposer → Acceptors: "Accept(n, value)"
  Acceptors → Proposer: "Accepted(n, value)" if still valid

Value is chosen when majority of acceptors have accepted.

Why Raft over Paxos:
- Raft is easier to understand and implement correctly
- Raft has a clear leader (simpler client interaction)
- Paxos allows multiple proposers (more complex, potential livelock)
- Most production systems use Raft (etcd, CockroachDB, TiKV)
```

## Distributed Transactions

### Two-Phase Commit (2PC)
```
Coordinator manages a transaction across multiple participants.

Phase 1 (Prepare/Vote):
  Coordinator → All Participants: "Can you commit?"
  Each Participant: Prepare (acquire locks, validate)
  Each Participant → Coordinator: "Yes" or "No"

Phase 2 (Commit/Abort):
  If ALL vote "Yes": Coordinator → All: "Commit"
  If ANY vote "No":  Coordinator → All: "Abort"

┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│ Coordinator │         │ Service A   │         │ Service B   │
└──────┬──────┘         └──────┬──────┘         └──────┬──────┘
       │──── Prepare ────────>│                        │
       │──── Prepare ──────────────────────────────>│
       │<─── Vote Yes ───────│                        │
       │<─── Vote Yes ─────────────────────────────│
       │──── Commit ─────────>│                        │
       │──── Commit ───────────────────────────────>│
       │<─── Ack ────────────│                        │
       │<─── Ack ──────────────────────────────────│

Problems with 2PC:
- Blocking: If coordinator crashes after Phase 1, participants hold locks forever
- Single point of failure: Coordinator
- Performance: Holding locks during the entire protocol
- Not suitable for microservices (tight coupling)
```

### Saga Pattern (Preferred for Microservices)
```
A saga is a sequence of local transactions. Each step has a compensating
action that undoes its effect if a later step fails.

Example: E-Commerce Order

Step 1: Create Order      → Compensate: Cancel Order
Step 2: Reserve Inventory → Compensate: Release Inventory
Step 3: Charge Payment    → Compensate: Refund Payment
Step 4: Ship Order        → Compensate: Cancel Shipment

If Step 3 (Charge Payment) fails:
  → Execute compensating action for Step 2 (Release Inventory)
  → Execute compensating action for Step 1 (Cancel Order)

Two Coordination Approaches:

1. Choreography (Event-Driven):
   Each service listens for events and acts independently.
   Order Service → "OrderCreated" event
   # ... (condensed) ...
   A saga orchestrator tells each service what to do.
   Orchestrator → Order Service: "Create Order"
   Orchestrator → Inventory Service: "Reserve Inventory"
   Orchestrator → Payment Service: "Charge Payment"

   Pro: Easy to understand, clear flow, centralized error handling
   Con: Orchestrator is a single point of complexity
```

### Saga Design Best Practices
```
1. Design compensating actions for EVERY step
2. Compensating actions must be idempotent (safe to retry)
3. Store saga state persistently (survive crashes)
4. Handle partial compensation failures (retry with backoff)
5. Make steps as independent as possible
6. Consider semantic locks (mark resources as "pending" during saga)
7. Use correlation IDs to track the entire saga flow
```

## Consistent Hashing

### The Problem
```
Simple hashing: node = hash(key) % N
When N changes (add/remove node), MOST keys get remapped.
Example: 3 nodes → 4 nodes remaps ~75% of keys

Consistent hashing: Only K/N keys get remapped (K = total keys, N = nodes)
Adding 1 node to 3 remaps only ~25% of keys
```

### How Consistent Hashing Works
```
1. Hash both nodes and keys onto a circular ring (0 to 2^32)
2. Each key is assigned to the first node clockwise from its hash position

Ring (simplified):
        Node A (hash: 100)
       /                    \
Key X (hash: 80)     Key Y (hash: 250)
      |                      |
      → Assigned to A        → Assigned to B
       \                    /
        Node B (hash: 300)

Adding Node C at hash 200:
- Keys between 100 and 200 move from B to C
- All other keys stay put

Virtual Nodes (VNodes):
- Problem: With few physical nodes, distribution is uneven
- Solution: Each physical node maps to multiple virtual positions on the ring
- Node A → vnode_A1 (hash: 50), vnode_A2 (hash: 180), vnode_A3 (hash: 320)
- More virtual nodes = more even distribution
- Typical: 100-200 virtual nodes per physical node
```

### Applications of Consistent Hashing
- Load balancing (distribute requests across servers)
- Database sharding (distribute data across shards)
- CDN (route requests to nearest cache)
- Distributed caches (Memcached, Redis Cluster)

## Gossip Protocols

### How Gossip Works
```
Gossip (epidemic) protocols spread information like a rumor:

1. Each node periodically picks a random peer
2. They exchange state information
3. Both nodes update their knowledge

Properties:
- Eventually consistent: All nodes converge to same state
- Fault tolerant: Works even when nodes fail
- Scalable: O(log N) rounds to disseminate to N nodes
- Decentralized: No single point of failure

Example (Membership):
Time 0: Node A knows about {A, B}
        Node B knows about {A, B, C}
        Node C knows about {C}

Time 1: A gossips with B → A now knows {A, B, C}
Time 2: C gossips with A → C now knows {A, B, C}
# ... (condensed) ...
2. Rumor mongering: Nodes spread only new updates
   Pro: Efficient
   Con: May not converge (rumor can "die" before reaching all nodes)

3. Aggregation: Nodes compute global aggregate (sum, average, count)
   Pro: Decentralized computation
   Con: Approximate results
```

### Gossip Protocol Applications
- Cluster membership (which nodes are alive?)
- Failure detection (is a node dead?)
- Configuration dissemination (spread config changes)
- Data replication (Cassandra uses gossip for replica coordination)

## Vector Clocks

### The Problem of Ordering in Distributed Systems
```
Physical clocks are unreliable in distributed systems:
- Clock skew between machines
- NTP synchronization is imperfect
- Events on different machines can't be ordered by wall clock

Logical clocks provide a partial ordering of events.
```

### Lamport Timestamps
```
Rules:
1. Before each event, increment local counter
2. When sending a message, include the counter
3. When receiving a message, set counter = max(local, received) + 1

Node A:      1 ----→ 2 ----→ 3
             |               ↑
             send(1)         receive(max(3,4)+1=5)
             ↓               |
Node B:      1 ----→ 2 ----→ 4

Limitation: Lamport timestamps can't detect concurrent events.
If a=2 and b=4, you know b happened after a.
But if a=3 and b=3, you can't tell if they're concurrent or causally related.
```

### Vector Clocks
```
Each node maintains a vector of counters (one per node).

Node A: [A:0, B:0] → [A:1, B:0] → sends to B → [A:2, B:0]
Node B: [A:0, B:0] → [A:0, B:1] → receives → [A:1, B:2]

Comparison Rules:
V1 < V2 if: ALL elements of V1 ≤ V2, and at least ONE element is strictly less
V1 || V2 (concurrent) if: Some V1 elements > V2 AND some V2 elements > V1

Example:
[A:2, B:1] < [A:3, B:2]  → causally ordered (second happened after first)
[A:2, B:1] || [A:1, B:2] → concurrent (neither caused the other)

Conflict Resolution for Concurrent Events:
1. Last-writer-wins (LWW): Use physical timestamp as tiebreaker (may lose data)
2. Application-specific merge: Let the application resolve (e.g., merge shopping carts)
3. CRDTs: Data structures that automatically merge concurrent updates
```

## Leader Election

### Why Leader Election?
```
- Coordinate distributed operations (one writer, many readers)
- Avoid conflicts (only one node processes a particular task)
- Ensure ordering (leader sequences events)
```

### Leader Election with ZooKeeper/etcd
```
Using ZooKeeper:
1. All candidates create ephemeral sequential znodes under /election/
   /election/node-0000000001 (Node A)
   /election/node-0000000002 (Node B)
   /election/node-0000000003 (Node C)
2. Node with the lowest sequence number is the leader
3. Other nodes set a watch on the node with the next lower number
4. When the leader dies, its ephemeral node is deleted
5. The next node detects the deletion and becomes leader

Using etcd:
1. Candidates try to create a key with a lease (TTL)
2. First one to create it wins (atomic create)
3. Others watch the key
4. Leader must refresh the lease periodically (heartbeat)
5. If leader fails to refresh, lease expires, new election begins
```

### Fencing Tokens
```
Problem: Old leader doesn't know it's no longer leader (network partition,
GC pause, slow response). It continues acting as leader → split brain.

Solution: Fencing tokens
1. Each leader election produces a monotonically increasing token number
2. All requests from the leader include the fencing token
3. Resources (databases, storage) reject requests with old tokens

Leader 1 (token: 34) → Database → Accepts (34 ≥ last seen token 33)
[Leader 1 pauses, Leader 2 elected]
Leader 2 (token: 35) → Database → Accepts (35 ≥ 34)
[Leader 1 resumes, thinks it's still leader]
Leader 1 (token: 34) → Database → REJECTS (34 < 35)
```

## Distributed Locking

### Redis-Based Distributed Lock (Redlock)
```
Simple Lock (single Redis instance):
SET lock_key unique_value NX PX 30000
  NX: Only set if not exists
  PX: Expire after 30 seconds
  unique_value: Random UUID (for safe release)

Release Lock:
if GET lock_key == unique_value:
    DEL lock_key
(Use Lua script for atomicity)

Redlock (multiple Redis instances, safer):
1. Get current time
2. Try to acquire lock on N/2+1 Redis instances (majority)
3. If majority acquired and total time < lock TTL: lock acquired
4. If failed: release lock on ALL instances

Lock Considerations:
- Always use TTL (prevent deadlocks if holder crashes)
- Use unique token for safe release (prevent releasing someone else's lock)
- Retry with random backoff on failure
- Consider fencing tokens for stronger safety
```

### Lock-Free Alternatives
```
Sometimes you can avoid distributed locks entirely:

1. Idempotent operations: Design operations that are safe to execute multiple times
2. Optimistic concurrency: Use version numbers, retry on conflict
3. CRDTs: Data structures that don't need coordination
4. Single-writer principle: Route all writes for a key to one node
5. Queue-based ordering: Instead of locking, serialize through a queue
```

## Eventual Consistency

### Consistency Models Spectrum
```
Strongest ←──────────────────────────────────→ Weakest

Linearizability → Sequential → Causal → Eventual

Linearizability:
  - Operations appear to happen at a single point in time
  - All nodes agree on the order
  - Highest latency, lowest throughput

Sequential Consistency:
  - Operations from each node appear in order
  - Different nodes may see different global orderings
  - Common in multi-threaded programming

Causal Consistency:
  - Causally related operations appear in order
  - Concurrent operations may appear in any order
  - Good balance of consistency and performance

Eventual Consistency:
  - All replicas converge to the same state eventually
  - No ordering guarantees during convergence
  - Highest throughput, lowest latency
  - Most common in distributed systems
```

### Conflict Resolution Strategies
```
1. Last Writer Wins (LWW):
   - Highest timestamp wins
   - Simple but may lose data
   - Used by: Cassandra, DynamoDB (default)

2. First Writer Wins:
   - Only accept the first write, reject conflicts
   - Simple but may reject valid writes

3. Application-Level Resolution:
   - Store all conflicting versions
   - Application (or user) resolves the conflict
   - Used by: Amazon shopping cart

4. CRDTs (Conflict-free Replicated Data Types):
   - Data structures that automatically merge without conflicts
   - Types: G-Counter, PN-Counter, G-Set, OR-Set, LWW-Register
   - Used by: Redis CRDT, Riak

5. Operational Transformation:
   - Transform concurrent operations to maintain consistency
   - Used by: Google Docs, collaborative editing
```

## Distributed Systems Checklist

```
[ ] Failure modes identified for every component
[ ] Retry logic with exponential backoff
[ ] Circuit breakers on all external calls
[ ] Idempotency keys for all mutating operations
[ ] Timeouts on all network calls (connect + read)
[ ] Health checks for all services
[ ] Consensus mechanism chosen (if needed)
[ ] Consistency model documented for each data store
[ ] Conflict resolution strategy defined
[ ] Network partition handling defined
[ ] Monitoring for replication lag
[ ] Clock synchronization strategy (NTP + logical clocks)
```

## Quick Decision Guide

When asked about distributed systems:
- **"How to keep data consistent across services?"** → Choose consistency model based on requirements, implement saga for transactions
- **"How to handle node failures?"** → Replication with consensus (Raft), health checks, automatic failover
- **"How to distribute data?"** → Consistent hashing for even distribution, replication for fault tolerance
- **"How to order events?"** → Vector clocks for causality, Kafka for total order within partitions
- **"How to coordinate distributed services?"** → Leader election for coordination, distributed locks sparingly
- **"CP or AP?"** → CP for financial/inventory, AP for social/content, most systems need both for different data

## When to Use

**Use this skill when:**
- Designing or implementing distributed systems solutions
- Reviewing or improving existing distributed systems approaches
- Making architectural or implementation decisions about distributed systems
- Learning distributed systems patterns and best practices
- Troubleshooting distributed systems-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Distributed Systems Analysis

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

**Input:** "Help me implement distributed systems for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended distributed systems approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When distributed systems must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
