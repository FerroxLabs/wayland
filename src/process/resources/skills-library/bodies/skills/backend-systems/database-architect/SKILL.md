---
name: database-architect
description: |
  Database schema design expertise covering normalization, denormalization strategies, indexing, query optimization, partitioning, connection pooling, migration management, multi-tenancy patterns, and read replicas.
  Use when the user asks about database architect, database architect best practices, or needs guidance on database architect implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "backend api-design database"
  category: "backend-systems"
  subcategory: "database"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Database Architect

## Purpose

Design database schemas that balance data integrity, query performance, and operational maintainability. This skill covers relational database design principles, indexing strategies, scaling patterns, and migration management for production systems.

## Normalization

### Normal Forms

```
1NF (First Normal Form):
  - Each column contains atomic (indivisible) values
  - Each row is unique (has primary key)
  - No repeating groups

  VIOLATION: tags = "red,blue,green"  (comma-separated)
  FIX:       Create a separate tags table with one row per tag

2NF (Second Normal Form):
  - Meets 1NF
  - No partial dependencies (all non-key columns depend on the FULL primary key)
  - Only relevant with composite primary keys

  VIOLATION: (order_id, product_id) -> product_name
             product_name depends only on product_id, not the full key
  FIX:       Move product_name to the products table

3NF (Third Normal Form):
  - Meets 2NF
  - No transitive dependencies (non-key column depends on another non-key column)

  VIOLATION: user_id -> department_id -> department_name
             department_name depends on department_id, not directly on user_id
  FIX:       Create a departments table, reference via department_id

BCNF (Boyce-Codd Normal Form):
  - Meets 3NF
  - Every determinant is a candidate key
  - Handles edge cases where 3NF allows anomalies

4NF (Fourth Normal Form):
  - Meets BCNF
  - No multi-valued dependencies

5NF (Fifth Normal Form):
  - Meets 4NF
  - No join dependencies

PRACTICAL TARGET: 3NF for OLTP, denormalized for OLAP/reporting.
```

### When to Normalize (and When Not To)

```
NORMALIZE when:
  - Data integrity is critical (financial, medical, legal)
  - Write-heavy workload (fewer update anomalies)
  - Storage space is a concern
  - Multiple applications share the database
  - Schema stability is important

DENORMALIZE when:
  - Read performance is the primary concern
  - Complex joins are causing query bottlenecks
  - Reporting/analytics queries need aggregated data
  - Caching at the database level is beneficial
  - Event-sourced or document-oriented data
```

## Denormalization Strategies

```
STRATEGY                      USE CASE
-------------------------------------------------------------
Duplicated columns            User.email stored in Orders for fast reads
Precomputed aggregates        Product.review_count, Product.avg_rating
Materialized views            Complex reporting queries
JSON columns                  Flexible metadata, user preferences
Denormalized tables           Read-optimized copies of normalized data
Event snapshots               Store full state at point in time
```

### Materialized View Pattern

```sql
-- Create materialized view for dashboard stats
CREATE MATERIALIZED VIEW dashboard_stats AS
SELECT
  DATE(created_at) AS date,
  COUNT(*) AS total_orders,
  SUM(total_amount) AS revenue,
  COUNT(DISTINCT user_id) AS unique_customers,
  AVG(total_amount) AS avg_order_value
FROM orders
WHERE status = 'completed'
GROUP BY DATE(created_at);

-- Refresh periodically
REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_stats;

-- Create index on materialized view
CREATE UNIQUE INDEX idx_dashboard_stats_date ON dashboard_stats(date);
```

## Indexing Strategy

### Index Types and When to Use

```
B-Tree (DEFAULT):
  - Equality and range queries
  - ORDER BY, GROUP BY
  - Most common index type
  CREATE INDEX idx_users_email ON users(email);

Hash:
  - Equality-only queries (= but not < > BETWEEN)
  - Faster than B-Tree for exact match
  CREATE INDEX idx_users_email ON users USING hash(email);

GIN (Generalized Inverted Index):
  - Full-text search
  - JSONB containment (@>, ?)
  - Array overlap (&&)
  CREATE INDEX idx_products_tags ON products USING gin(tags);

GiST (Generalized Search Tree):
  - Geometric/spatial data
  - Range types
  - Full-text search (alternative to GIN)
  CREATE INDEX idx_locations_coords ON locations USING gist(coordinates);

BRIN (Block Range Index):
  - Very large tables with naturally ordered data
  - Minimal storage overhead
  - Timestamp columns on append-only tables
  CREATE INDEX idx_logs_created ON logs USING brin(created_at);

Partial Index:
  - Index a subset of rows
  - Reduces index size and maintenance cost
  CREATE INDEX idx_orders_pending ON orders(created_at) WHERE status = 'pending';

Covering Index (INCLUDE):
  - Include non-indexed columns to enable index-only scans
  CREATE INDEX idx_users_email ON users(email) INCLUDE (name, avatar_url);
```

### Composite Index Rules

```
RULE: The "leftmost prefix" rule
  Index on (a, b, c) can be used for:
    WHERE a = ?
    WHERE a = ? AND b = ?
    WHERE a = ? AND b = ? AND c = ?
    WHERE a = ? ORDER BY b

  CANNOT be used for:
    WHERE b = ?          (skips first column)
    WHERE b = ? AND c = ? (skips first column)

COLUMN ORDER: Equality columns first, then range/sort columns
  Query: WHERE status = 'active' AND created_at > '2025-01-01' ORDER BY name
  Index: (status, created_at, name)

CARDINALITY: Higher cardinality columns first (more unique values)
  Exception: unless low-cardinality column is always in WHERE clause
```

### Index Analysis

```sql
-- Find missing indexes (slow queries)
SELECT
  schemaname, tablename, seq_scan, idx_scan,
  seq_scan - idx_scan AS too_many_seqs,
  pg_size_pretty(pg_relation_size(schemaname || '.' || tablename)) AS table_size
FROM pg_stat_user_tables
WHERE seq_scan > idx_scan
  AND pg_relation_size(schemaname || '.' || tablename) > 100000
ORDER BY seq_scan - idx_scan DESC;

-- Find unused indexes (candidates for removal)
SELECT
  indexrelname, idx_scan, pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND indexrelname NOT LIKE '%_pkey'
ORDER BY pg_relation_size(indexrelid) DESC;

-- Explain analyze for query optimization
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT) SELECT ...;
```

## Query Optimization

### Common Patterns

```sql
-- AVOID: SELECT *
SELECT * FROM users WHERE id = 123;
-- PREFER: Select only needed columns
SELECT id, name, email FROM users WHERE id = 123;

-- AVOID: N+1 queries
-- Application code: for each order, query items separately
-- PREFER: JOIN or subquery
SELECT o.*, i.product_name, i.quantity
FROM orders o
JOIN order_items i ON i.order_id = o.id
WHERE o.user_id = 123;

-- AVOID: Functions on indexed columns (prevents index use)
WHERE YEAR(created_at) = 2025
-- PREFER: Range comparison
WHERE created_at >= '2025-01-01' AND created_at < '2026-01-01'

-- AVOID: OR on different columns (may prevent index use)
WHERE email = 'x' OR phone = 'y'
-- PREFER: UNION
SELECT * FROM users WHERE email = 'x'
UNION
SELECT * FROM users WHERE phone = 'y';

-- Use EXISTS instead of IN for large subqueries
WHERE EXISTS (SELECT 1 FROM orders WHERE orders.user_id = users.id)
-- Instead of
WHERE id IN (SELECT user_id FROM orders)

-- Batch inserts
INSERT INTO items (name, price) VALUES
  ('A', 10), ('B', 20), ('C', 30);
-- Instead of three separate INSERTs
```

## Partitioning

```
PARTITION TYPES:

Range Partitioning (most common):
  - Time-series data (logs, events, metrics)
  - Date ranges (monthly, yearly)

List Partitioning:
  - Categorical data (region, status, type)
  - Tenant-based partitioning

Hash Partitioning:
  - Even distribution when no natural range
  - Parallel query execution
```

```sql
-- Range partitioning by month
CREATE TABLE events (
  id BIGINT GENERATED ALWAYS AS IDENTITY,
  event_type TEXT NOT NULL,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
) PARTITION BY RANGE (created_at);

-- Create partitions
CREATE TABLE events_2025_01 PARTITION OF events
  FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
CREATE TABLE events_2025_02 PARTITION OF events
  FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');

-- Automate partition creation with pg_partman or cron job
-- Index on each partition is created automatically from parent

-- List partitioning by region
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region TEXT NOT NULL,
  total NUMERIC NOT NULL
) PARTITION BY LIST (region);

CREATE TABLE orders_us PARTITION OF orders FOR VALUES IN ('us-east', 'us-west');
CREATE TABLE orders_eu PARTITION OF orders FOR VALUES IN ('eu-west', 'eu-central');
```

## Connection Pooling

```
WHY: Database connections are expensive to create (~50-100ms).
     Each connection uses ~5-10MB of server memory.
     PostgreSQL forks a process per connection.

POOL SIZING FORMULA:
  pool_size = (core_count * 2) + effective_spindle_count
  For SSD: pool_size = core_count * 2 + 1
  Example: 4 cores -> pool_size = 9

TOOLS:
  PgBouncer:     External connection pooler for PostgreSQL
  pgpool-II:     Connection pooler + load balancer
  Application:   Built-in pools (HikariCP, node-pg pool, SQLAlchemy pool)

CONFIGURATION:
  min_pool_size:  2-5    (keep warm connections ready)
  max_pool_size:  10-20  (per application instance)
  idle_timeout:   300s   (close idle connections)
  max_lifetime:   1800s  (recycle connections)
  connection_timeout: 5s (fail fast if pool exhausted)
```

## Migration Management

### Migration Best Practices

```
1. ALWAYS use forward-only migrations in production
   - Never edit a migration that has been applied
   - Create a new migration to fix issues

2. SEPARATE schema changes from data changes
   - Schema migration: ALTER TABLE, CREATE INDEX
   - Data migration: UPDATE, INSERT (separate file)

3. MAKE migrations reversible when possible
   - Include UP and DOWN operations
   - Some changes are irreversible (DROP COLUMN with data)

4. TEST migrations against production-size data
   - A migration that runs in 1ms on dev may lock tables for hours in prod

5. USE zero-downtime migration patterns
   - Add column with DEFAULT (no table rewrite in PG 11+)
   - Create index CONCURRENTLY
   - Never DROP COLUMN in the same deploy as code removal
```

### Zero-Downtime Migration Pattern

```
Phase 1: ADD (backward compatible)
  - Add new column (nullable or with default)
  - Add new table
  - Create index CONCURRENTLY
  - Deploy code that writes to BOTH old and new structures

Phase 2: MIGRATE
  - Backfill data to new structure
  - Deploy code that reads from new structure
  - Keep writing to both for safety

Phase 3: CLEANUP (after validation)
  - Remove old column/table (separate migration)
  - Deploy code that only uses new structure

EXAMPLE: Rename column "name" to "full_name"
  Phase 1: ALTER TABLE users ADD COLUMN full_name TEXT;
  Phase 2: UPDATE users SET full_name = name WHERE full_name IS NULL;
  Phase 3: ALTER TABLE users DROP COLUMN name;
  (Each phase is a separate deploy)
```

## Multi-Tenancy Patterns

```
STRATEGY            ISOLATION     COMPLEXITY    COST
-------------------------------------------------------
Shared DB +         Low           Low           Low
  tenant_id column

Schema per tenant   Medium        Medium        Medium
  (PostgreSQL schemas)

Database per tenant High          High          High

SHARED DATABASE WITH tenant_id:
  - Add tenant_id to every table
  - Add tenant_id to every query (middleware/ORM level)
  - Row-level security (RLS) for defense in depth

  CREATE POLICY tenant_isolation ON orders
    USING (tenant_id = current_setting('app.current_tenant')::uuid);

SCHEMA PER TENANT (PostgreSQL):
  - Each tenant gets a schema (SET search_path = 'tenant_abc')
  - Shared tables in public schema
  - Connection middleware sets search_path
  - Easier data export/deletion for individual tenants
```

## Read Replicas

```
ARCHITECTURE:
  Primary (writes) -> Replica 1 (reads)
                   -> Replica 2 (reads)
                   -> Replica 3 (analytics)

ROUTING STRATEGY:
  Writes:  Always go to primary
  Reads:   Route to replicas
  Reads after write: Route to primary (avoid replication lag)

REPLICATION LAG HANDLING:
  - Monitor lag (SELECT pg_last_wal_replay_lsn())
  - Set maximum acceptable lag (e.g., 5 seconds)
  - Fall back to primary if lag exceeds threshold
  - Use session affinity for post-write reads

APPLICATION PATTERN:
  // Middleware/decorator approach
  @UseDatabase('replica')
  async getUsers() { ... }

  @UseDatabase('primary')
  async createUser() { ... }

  // Post-write read with primary fallback
  async getUserAfterUpdate(id) {
    await this.primary.update(...);
    return this.primary.findById(id);  // Read from primary after write
  }
```

## Database Architecture Checklist

- [ ] Schema normalized to 3NF for transactional tables
- [ ] Strategic denormalization applied for read-heavy queries
- [ ] Primary keys use UUID or ULID (not auto-increment for distributed)
- [ ] Indexes cover all WHERE, JOIN, ORDER BY columns
- [ ] Composite indexes follow leftmost prefix rule
- [ ] Unused indexes identified and removed
- [ ] Query execution plans analyzed for slow queries
- [ ] Connection pooling configured with appropriate limits
- [ ] Migrations are forward-only and zero-downtime compatible
- [ ] Multi-tenancy isolation enforced at query and RLS level
- [ ] Read replicas configured for read-heavy workloads
- [ ] Partitioning applied for tables exceeding millions of rows
- [ ] Backup strategy tested with restore verification
- [ ] Monitoring covers slow queries, connection counts, replication lag

## When to Use

**Use this skill when:**
- Designing or implementing database architect solutions
- Reviewing or improving existing database architect approaches
- Making architectural or implementation decisions about database architect
- Learning database architect patterns and best practices
- Troubleshooting database architect-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Database Architect Analysis

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

**Input:** "Help me implement database architect for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended database architect approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When database architect must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
