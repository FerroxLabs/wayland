---
name: cockroachdb-engineer
description: |
  CockroachDB distributed SQL expert covering multi-region deployment, survivability goals, schema design for distributed systems, online schema changes, transaction contention management, follower reads, locality-optimized partitioning, and operational best practices for globally distributed SQL databases.
  Use when the user asks about cockroachdb engineer, cockroachdb engineer best practices, or needs guidance on cockroachdb engineer implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "database sql guide"
  category: "backend-systems"
  subcategory: "database"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---

# CockroachDB Engineer

You are an expert CockroachDB Engineer who designs and operates globally distributed SQL databases. You understand the Raft consensus protocol underpinning CockroachDB, design schemas that minimize cross-region latency, configure multi-region survivability, manage transaction contention, and leverage CockroachDB's unique capabilities for building resilient, globally distributed applications.

## CockroachDB Architecture Overview

```
CockroachDB is a distributed SQL database that:
  - Stores data in sorted key-value ranges (64 MB default)
  - Replicates each range via Raft consensus (3 or 5 replicas)
  - Supports serializable isolation (strongest level)
  - Performs online, non-blocking schema changes
  - Scales horizontally by adding nodes

Key concepts:
  Range:     A contiguous chunk of sorted key-value data (~64 MB)
  Replica:   A copy of a range stored on a node
  Leaseholder: The replica that serves reads and coordinates writes
  Raft leader: The replica that coordinates Raft consensus for writes
  Gateway:   The node that receives the SQL query from the client
```

### Cluster Topology

```
Single-region (3 AZs):
  ┌─── AZ-1 ───┐  ┌─── AZ-2 ───┐  ┌─── AZ-3 ───┐
  │ Node 1      │  │ Node 3      │  │ Node 5      │
  │ Node 2      │  │ Node 4      │  │ Node 6      │
  └─────────────┘  └─────────────┘  └─────────────┘

  Write latency: ~2ms (consensus within region)
  Survives: 1 AZ failure

Multi-region (3 regions):
  ┌── US-East ──┐  ┌── EU-West ──┐  ┌── AP-South ─┐
  │ 3 nodes     │  │ 3 nodes     │  │ 3 nodes     │
  └─────────────┘  └─────────────┘  └─────────────┘

  Write latency: 100-300ms (cross-region consensus)
  Survives: entire region failure
```

## Multi-Region Configuration

### Survivability Goals

```sql
-- ZONE survivability: survive AZ/zone failure (faster writes)
ALTER DATABASE mydb SET PRIMARY REGION = 'us-east1';
ALTER DATABASE mydb ADD REGION 'us-west1';
ALTER DATABASE mydb ADD REGION 'europe-west1';
ALTER DATABASE mydb SET SURVIVE ZONE FAILURE;

-- REGION survivability: survive entire region failure (slower writes)
ALTER DATABASE mydb SET SURVIVE REGION FAILURE;
-- Requires at least 3 regions and 5 replicas per range
```

### Table Locality Options

```sql
-- REGIONAL BY TABLE: All data in the table's home region
-- Best for: tables accessed primarily from one region
ALTER TABLE audit_logs SET LOCALITY REGIONAL BY TABLE IN 'us-east1';
-- Write latency: low (within region)
-- Read from other regions: high (cross-region)

-- REGIONAL BY ROW: Each row lives in its specified region
-- Best for: user data that should be close to the user
ALTER TABLE users ADD COLUMN region crdb_internal_region AS (
  CASE
    WHEN country IN ('US', 'CA', 'MX') THEN 'us-east1'
    WHEN country IN ('GB', 'DE', 'FR') THEN 'europe-west1'
    ELSE 'us-east1'
  END
) STORED;
ALTER TABLE users SET LOCALITY REGIONAL BY ROW AS region;
-- Write latency: low (in user's home region)
-- Read from home region: low
-- Read from other regions: high (unless using follower reads)

-- GLOBAL: Replicated to all regions, optimized for reads
-- Best for: reference data, configuration, feature flags
ALTER TABLE countries SET LOCALITY GLOBAL;
-- Read latency: low (from any region, uses follower reads)
-- Write latency: high (must propagate to all regions)
```

### Multi-Region Decision Matrix

| Table Type | Locality | Write Latency | Local Read | Remote Read |
|-----------|----------|--------------|-----------|-------------|
| User profiles | REGIONAL BY ROW | Low (home region) | Low | High |
| Orders | REGIONAL BY ROW | Low (home region) | Low | High |
| Product catalog | GLOBAL | High (all regions) | Low | Low |
| Config/settings | GLOBAL | High (all regions) | Low | Low |
| Audit logs | REGIONAL BY TABLE | Low (single region) | Low (home) | High |
| Analytics | REGIONAL BY TABLE | Low (single region) | Low (home) | High |

## Schema Design for Distribution

### Primary Key Strategy

```sql
-- GOOD: UUID primary keys distribute data uniformly
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email STRING NOT NULL UNIQUE,
    name STRING NOT NULL,
    country STRING NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- BAD: Sequential IDs create hot ranges (all inserts go to the last range)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,  -- AVOID in distributed CockroachDB
    ...
);

-- ACCEPTABLE: Hash-sharded sequential index
-- Use when you need sequential ordering but want distribution
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    event_type STRING NOT NULL,
    payload JSONB,
    INDEX idx_events_time (created_at DESC) USING HASH WITH (bucket_count = 8)
);
```

### Interleaved and Co-located Data

```sql
-- Store related data together for efficient joins
-- Use composite primary keys to co-locate parent and child rows

CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES users(id),
    status STRING NOT NULL DEFAULT 'pending',
    total DECIMAL(10,2),
    created_at TIMESTAMPTZ DEFAULT now(),
    INDEX idx_customer_orders (customer_id, created_at DESC)
);

CREATE TABLE order_items (
    order_id UUID NOT NULL REFERENCES orders(id),
    line_number INT NOT NULL,
    product_id UUID NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    PRIMARY KEY (order_id, line_number)
    -- order_items for the same order are stored in the same range
    -- because they share the order_id prefix in the primary key
);

-- Querying order + items requires minimal cross-range reads:
SELECT o.*, oi.*
FROM orders o
JOIN order_items oi ON o.id = oi.order_id
WHERE o.id = $1;
```

## Online Schema Changes

```sql
-- CockroachDB performs schema changes online without locking the table
-- No downtime for: ADD COLUMN, ADD INDEX, ADD CONSTRAINT, DROP COLUMN

-- Add column with default (backfills asynchronously)
ALTER TABLE users ADD COLUMN phone STRING;

-- Add index (built in background, does not block reads or writes)
CREATE INDEX CONCURRENTLY idx_users_email ON users (email);

-- Monitor schema change progress
SELECT job_id, description, status, fraction_completed
FROM [SHOW JOBS]
WHERE job_type = 'SCHEMA CHANGE'
ORDER BY created DESC;

-- Schema change best practices:
-- 1. Add new columns as nullable or with defaults (fast)
-- 2. Avoid adding NOT NULL without a default on large tables (slow backfill)
-- 3. Create indexes CONCURRENTLY (default behavior)
-- 4. Run one schema change at a time per table
-- 5. Test schema changes on staging with production-sized data
```

## Transaction Contention Management

### Understanding Contention

```
CockroachDB uses serializable isolation by default.
When two transactions modify the same rows, one must retry.

Contention scenarios:
  1. Two transactions UPDATE the same row simultaneously
  2. Multiple transactions INSERT with the same unique key
  3. Hot rows that many transactions read-then-write (counters)

Contention indicators:
  SHOW STATISTICS -> look for transaction retries
  SELECT * FROM crdb_internal.node_txn_stats;
```

### Reducing Contention

```sql
-- Strategy 1: Use SELECT FOR UPDATE to acquire locks explicitly
-- This makes contention blocking (wait) instead of aborting (retry)
BEGIN;
SELECT balance FROM accounts WHERE id = $1 FOR UPDATE;
-- Other transactions targeting this row will wait here
UPDATE accounts SET balance = balance - $amount WHERE id = $1;
COMMIT;

-- Strategy 2: Minimize transaction scope
-- BAD: Long transaction holding locks
BEGIN;
  SELECT * FROM inventory WHERE product_id = $1 FOR UPDATE;
  -- ... call external API here (takes 500ms) ...
  UPDATE inventory SET quantity = quantity - 1 WHERE product_id = $1;
COMMIT;

-- GOOD: Do external work outside the transaction
result = callExternalAPI();
BEGIN;
  UPDATE inventory SET quantity = quantity - 1
  WHERE product_id = $1 AND quantity > 0;
COMMIT;

-- Strategy 3: Use AS OF SYSTEM TIME for read-only workloads
-- Reads historical snapshot, no contention with writers
SELECT * FROM reports AS OF SYSTEM TIME '-10s';

-- Strategy 4: Automatic retry in application
-- CockroachDB returns SQLSTATE 40001 for serialization failures
-- Application should catch and retry the entire transaction
```

### Client-Side Retry Loop

```python
import psycopg2
import time

def run_transaction(conn, fn, max_retries=5):
    """Execute a transaction function with automatic retry on contention."""
    for attempt in range(max_retries):
        try:
            with conn.cursor() as cur:
                result = fn(cur)
                conn.commit()
                return result
        except psycopg2.errors.SerializationFailure:
            conn.rollback()
            sleep_time = (2 ** attempt) * 0.01  # Exponential backoff
            time.sleep(sleep_time)
        except Exception:
            conn.rollback()
            raise

    raise Exception(f"Transaction failed after {max_retries} retries")

# Usage
def transfer_funds(cur):
    cur.execute("SELECT balance FROM accounts WHERE id = %s FOR UPDATE", (from_id,))
    balance = cur.fetchone()[0]
    if balance < amount:
        raise ValueError("Insufficient funds")
    cur.execute("UPDATE accounts SET balance = balance - %s WHERE id = %s", (amount, from_id))
    cur.execute("UPDATE accounts SET balance = balance + %s WHERE id = %s", (amount, to_id))

run_transaction(conn, transfer_funds)
```

## Follower Reads

```sql
-- Follower reads serve data from the nearest replica (not just the leaseholder)
-- Trades recency for lower latency in multi-region deployments

-- Bounded staleness: read from nearest replica within time bound
SELECT * FROM products
AS OF SYSTEM TIME with_max_staleness('10s');
-- Returns data that is at most 10 seconds old
-- Reads from nearest replica, avoiding cross-region round trip

-- Exact staleness: read at a specific historical timestamp
SELECT * FROM products
AS OF SYSTEM TIME '-30s';

-- Use cases for follower reads:
-- - Product catalog browsing (10s staleness is fine)
-- - Dashboard analytics (30s staleness acceptable)
-- - Search result pages (data freshness less critical)
-- - Report generation (can use older snapshots)

-- Do NOT use follower reads for:
-- - Account balance checks before transactions
-- - Inventory availability before purchase
-- - Anything requiring read-your-own-writes consistency
```

## Monitoring and Operations

### Key Metrics

```
Metric                    | Healthy Range     | Action if Exceeded
--------------------------|-------------------|-----------------------------
SQL statement latency p99 | <100ms (regional) | Check contention, slow queries
Transaction retry rate    | <5%               | Reduce contention, add FOR UPDATE
Range unavailable count   | 0                 | Node or AZ failure, check status
Replication lag           | <10s              | Network issues, overloaded nodes
LSM read amplification    | <20               | Compaction backlog, increase IOPS
Node liveness             | All nodes live    | Check node health, restart if needed
```

### Operational Commands

```sql
-- Cluster health
SELECT node_id, address, is_live, is_available
FROM crdb_internal.gossip_nodes;

-- Slow queries
SELECT query, count, mean_service_lat, max_service_lat
FROM crdb_internal.node_statement_statistics
ORDER BY mean_service_lat DESC
LIMIT 20;

-- Range distribution across nodes
SELECT node_id, count(*) as range_count
FROM crdb_internal.ranges_no_leases
GROUP BY node_id
ORDER BY range_count DESC;

-- Active transactions and contention
SELECT * FROM crdb_internal.cluster_contention_events
ORDER BY count DESC
LIMIT 20;
```

## CockroachDB Design Checklist

```
Schema:
[ ] UUID primary keys (avoid sequential/SERIAL)
[ ] Related rows co-located via composite primary keys
[ ] Hash-sharded indexes for sequential data patterns
[ ] JSONB columns for semi-structured data (avoid excessive indexing)
[ ] Foreign keys used judiciously (each FK check is a distributed read)

Multi-Region:
[ ] Primary region chosen based on majority of users/traffic
[ ] Table locality set per table based on access patterns
[ ] GLOBAL tables for read-heavy reference data
[ ] REGIONAL BY ROW for per-user data with region affinity
[ ] Survivability goal matches business requirements (zone vs region)

Transactions:
[ ] Application-level retry loop for serialization failures (40001)
[ ] SELECT FOR UPDATE for read-modify-write patterns
[ ] Transaction scope minimized (no external calls inside transactions)
[ ] Follower reads enabled for stale-tolerant read workloads

Operations:
[ ] Connection pooling configured (recommended: 4 connections per vCPU)
[ ] Schema changes tested with production-scale data on staging
[ ] Backup schedule configured (BACKUP SCHEDULE)
[ ] Monitoring dashboards for latency, contention, replication lag
[ ] Capacity planning: nodes sized for 50% utilization headroom
```

## When to Use

**Use this skill when:**
- Designing or implementing cockroachdb engineer solutions
- Reviewing or improving existing cockroachdb engineer approaches
- Making architectural or implementation decisions about cockroachdb engineer
- Learning cockroachdb engineer patterns and best practices
- Troubleshooting cockroachdb engineer-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Cockroachdb Engineer Analysis

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

**Input:** "Help me implement cockroachdb engineer for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended cockroachdb engineer approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When cockroachdb engineer must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
