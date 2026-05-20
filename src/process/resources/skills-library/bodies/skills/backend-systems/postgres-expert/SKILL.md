---
name: postgres-expert
description: |
  Advanced PostgreSQL mastery covering indexing strategies (GIN, GiST, BRIN, B-tree), table partitioning, pg_stat analysis, VACUUM tuning, connection pooling with PgBouncer, JSONB operations, full-text search, row-level security, replication topologies, and essential extensions like PostGIS and pg_cron.
  Use when the user asks about postgres expert, postgres expert best practices, or needs guidance on postgres expert implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "database sql backend"
  category: "backend-systems"
  subcategory: "database"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# PostgreSQL Expert

## Core Philosophy

PostgreSQL is not just a relational database -- it is an extensible data platform. Mastery requires understanding its query planner internals, storage engine behavior, and the interplay between configuration parameters. Every decision should be informed by `EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)` output and `pg_stat_*` views.

## Advanced Indexing Strategies

### B-tree (Default)

B-tree indexes are the workhorse. They support equality and range queries on sortable data types.

```sql
-- Composite index: column order matters for query planning
CREATE INDEX idx_orders_customer_date ON orders (customer_id, order_date DESC);

-- Partial index: index only the rows you query
CREATE INDEX idx_active_users ON users (email) WHERE is_active = true;

-- Covering index (INCLUDE): avoid heap fetches entirely
CREATE INDEX idx_orders_covering ON orders (customer_id)
  INCLUDE (total_amount, status);
```

**Decision criteria for B-tree:**
- Use when queries involve `=`, `<`, `>`, `BETWEEN`, `IN`, `IS NULL`
- Place highest-selectivity columns first in composite indexes
- Use partial indexes when queries always filter on a constant predicate
- Use INCLUDE columns to enable index-only scans

### GIN (Generalized Inverted Index)

GIN indexes are designed for composite values -- arrays, JSONB, full-text search vectors.

```sql
-- JSONB containment queries
CREATE INDEX idx_metadata_gin ON products USING gin (metadata jsonb_path_ops);
-- Supports: WHERE metadata @> '{"color": "red"}'

-- Array overlap/containment
CREATE INDEX idx_tags_gin ON articles USING gin (tags);
-- Supports: WHERE tags @> ARRAY['postgresql'] OR tags && ARRAY['database']

-- Full-text search
CREATE INDEX idx_fts ON documents USING gin (to_tsvector('english', body));
```

**GIN tuning:**
- `gin_pending_list_limit`: Controls fastupdate buffer size (default 4MB). Increase for write-heavy workloads, decrease for read-heavy.
- `maintenance_work_mem`: Increase during GIN index creation for faster builds.

### GiST (Generalized Search Tree)

GiST supports geometric, range, and nearest-neighbor queries.

```sql
-- Range types (scheduling, reservations)
CREATE INDEX idx_reservation_period ON reservations USING gist (
  tstzrange(check_in, check_out)
);
-- Supports: WHERE tstzrange(check_in, check_out) && tstzrange('2025-01-01', '2025-01-07')

-- PostGIS spatial queries
CREATE INDEX idx_location ON stores USING gist (geom);
-- Supports: WHERE ST_DWithin(geom, ST_MakePoint(-73.99, 40.73)::geography, 5000)

-- Exclusion constraints (prevent overlapping bookings)
ALTER TABLE reservations ADD CONSTRAINT no_overlap
  EXCLUDE USING gist (room_id WITH =, tstzrange(check_in, check_out) WITH &&);
```

### BRIN (Block Range Index)

BRIN indexes are extremely compact and ideal for naturally ordered data (timestamps, auto-increment IDs).

```sql
-- Time-series data where rows arrive in chronological order
CREATE INDEX idx_events_time_brin ON events USING brin (created_at)
  WITH (pages_per_range = 32);
```

**When to use BRIN:**
- Table is physically sorted by the indexed column (correlation > 0.9)
- Table is large (millions of rows)
- You need a tiny index footprint
- Check correlation: `SELECT correlation FROM pg_stats WHERE tablename = 'events' AND attname = 'created_at';`

### Index Selection Decision Tree

```
Is the column a scalar type with equality/range queries?
  YES -> B-tree (default)
  NO -> Is it JSONB, array, or tsvector?
    YES -> GIN
    NO -> Is it geometric, range, or nearest-neighbor?
      YES -> GiST
      NO -> Is data physically ordered and table is huge?
        YES -> BRIN
        NO -> B-tree with expression index
```

## Table Partitioning

### Declarative Partitioning

```sql
-- Range partitioning by date (most common)
CREATE TABLE events (
    id bigint GENERATED ALWAYS AS IDENTITY,
    event_type text NOT NULL,
    payload jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
) PARTITION BY RANGE (created_at);

-- Create monthly partitions
CREATE TABLE events_2025_01 PARTITION OF events
  FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
CREATE TABLE events_2025_02 PARTITION OF events
  FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');

-- Automate partition creation with pg_partman
CREATE EXTENSION pg_partman;
SELECT partman.create_parent(
  p_parent_table := 'public.events',
  p_control := 'created_at',
  p_type := 'native',
  p_interval := 'monthly',
  p_premake := 3
);
```

### List Partitioning

```sql
CREATE TABLE orders (
    id bigint, region text, total numeric
) PARTITION BY LIST (region);

CREATE TABLE orders_us PARTITION OF orders FOR VALUES IN ('us-east', 'us-west');
CREATE TABLE orders_eu PARTITION OF orders FOR VALUES IN ('eu-west', 'eu-central');
CREATE TABLE orders_default PARTITION OF orders DEFAULT;
```

### Partitioning Best Practices

- Always include the partition key in your WHERE clauses for partition pruning
- Create indexes on each partition (they are not inherited automatically in older versions)
- Use `pg_partman` for automated partition management
- Monitor with `EXPLAIN` to confirm partition pruning is active
- Detach old partitions instead of deleting rows: `ALTER TABLE events DETACH PARTITION events_2023_01;`

## pg_stat Analysis

### Essential Monitoring Views

```sql
-- Table I/O: identify sequential scan-heavy tables needing indexes
SELECT schemaname, relname, seq_scan, seq_tup_read,
       idx_scan, idx_tup_fetch,
       n_tup_ins, n_tup_upd, n_tup_del,
       n_live_tup, n_dead_tup,
       last_vacuum, last_autovacuum, last_analyze
FROM pg_stat_user_tables
ORDER BY seq_scan DESC;

-- Index usage: find unused indexes (candidates for removal)
SELECT schemaname, relname, indexrelname,
       idx_scan, idx_tup_read, idx_tup_fetch,
       pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY pg_relation_size(indexrelid) DESC;

-- Cache hit ratio (should be > 99%)
SELECT
  sum(heap_blks_read) AS heap_read,
  sum(heap_blks_hit) AS heap_hit,
  round(sum(heap_blks_hit) / greatest(sum(heap_blks_hit) + sum(heap_blks_read), 1)::numeric, 4) AS ratio
FROM pg_statio_user_tables;

-- Active queries and locks
SELECT pid, now() - pg_stat_activity.query_start AS duration, query, state, wait_event_type
FROM pg_stat_activity
WHERE state != 'idle' AND pid != pg_backend_pid()
ORDER BY duration DESC;
```

### pg_stat_statements

```sql
CREATE EXTENSION pg_stat_statements;

-- Top queries by total time
SELECT query, calls, total_exec_time, mean_exec_time,
       rows, shared_blks_hit, shared_blks_read
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 20;
```

## VACUUM Tuning

### Understanding VACUUM

PostgreSQL uses MVCC. Dead tuples accumulate from UPDATE and DELETE operations. VACUUM reclaims this space. VACUUM FULL rewrites the entire table (locks it).

### Autovacuum Configuration

```sql
-- Per-table autovacuum tuning for a high-write table
ALTER TABLE events SET (
  autovacuum_vacuum_scale_factor = 0.01,      -- trigger at 1% dead tuples (default 20%)
  autovacuum_analyze_scale_factor = 0.005,
  autovacuum_vacuum_cost_delay = 2,           -- less throttling (default 2ms in v15+)
  autovacuum_vacuum_cost_limit = 1000         -- more work per cycle
);

-- Global settings in postgresql.conf
-- autovacuum_max_workers = 5                 -- default 3
-- autovacuum_naptime = 15s                   -- check more frequently
-- autovacuum_vacuum_cost_delay = 2ms
-- maintenance_work_mem = 1GB
```

### Monitoring VACUUM

```sql
-- Check tables needing vacuum
SELECT relname, n_live_tup, n_dead_tup,
       round(n_dead_tup::numeric / greatest(n_live_tup, 1), 4) AS dead_ratio,
       last_autovacuum
FROM pg_stat_user_tables
WHERE n_dead_tup > 10000
ORDER BY n_dead_tup DESC;

-- Monitor running vacuum progress
SELECT * FROM pg_stat_progress_vacuum;
```

## Connection Pooling with PgBouncer

### PgBouncer Configuration

```ini
; pgbouncer.ini
[databases]
mydb = host=127.0.0.1 port=5432 dbname=mydb

[pgbouncer]
listen_addr = 0.0.0.0
listen_port = 6432
auth_type = scram-sha-256
auth_file = [system-path]

; Pool mode: transaction (recommended for web apps)
pool_mode = transaction

; Pool sizing
default_pool_size = 25
max_client_conn = 1000
min_pool_size = 5
reserve_pool_size = 5
reserve_pool_timeout = 3

; Timeouts
server_idle_timeout = 300
client_idle_timeout = 0
query_timeout = 30
```

**Pool modes:**
- `session`: Client keeps server connection for entire session. Use for apps that use session-level features (prepared statements, temp tables, LISTEN/NOTIFY).
- `transaction`: Connection returned after each transaction. Best for web applications. Cannot use session-level features.
- `statement`: Connection returned after each statement. Most aggressive. No multi-statement transactions.

## JSONB Operations

```sql
-- Store and query JSONB
CREATE TABLE products (
  id serial PRIMARY KEY,
  name text,
  attributes jsonb DEFAULT '{}'
);

-- Containment query (uses GIN index)
SELECT * FROM products WHERE attributes @> '{"color": "red", "size": "L"}';

-- Path extraction
SELECT attributes -> 'dimensions' ->> 'width' AS width FROM products;
SELECT attributes #>> '{dimensions,width}' AS width FROM products;

-- jsonpath queries (PostgreSQL 12+)
SELECT * FROM products
WHERE jsonb_path_exists(attributes, '$.reviews[*] ? (@.rating > 4)');

-- Update nested values
UPDATE products SET attributes = jsonb_set(attributes, '{stock}', '42'::jsonb)
WHERE id = 1;

-- Remove a key
UPDATE products SET attributes = attributes - 'deprecated_field';

-- Aggregate JSONB
SELECT jsonb_agg(jsonb_build_object('id', id, 'name', name)) FROM products;
```

## Full-Text Search

```sql
-- Create a search configuration
ALTER TABLE articles ADD COLUMN search_vector tsvector;

-- Populate and maintain with trigger
CREATE FUNCTION articles_search_trigger() RETURNS trigger AS $$
BEGIN
  NEW.search_vector := setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
                        setweight(to_tsvector('english', coalesce(NEW.body, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trig_articles_search
  BEFORE INSERT OR UPDATE ON articles
  FOR EACH ROW EXECUTE FUNCTION articles_search_trigger();

CREATE INDEX idx_articles_search ON articles USING gin (search_vector);

-- Search with ranking
SELECT id, title, ts_rank(search_vector, query) AS rank
FROM articles, plainto_tsquery('english', 'postgresql indexing performance') AS query
WHERE search_vector @@ query
ORDER BY rank DESC
LIMIT 20;

-- Phrase search
SELECT * FROM articles
WHERE search_vector @@ phraseto_tsquery('english', 'connection pooling');

-- Highlight matches
SELECT ts_headline('english', body, plainto_tsquery('english', 'vacuum tuning'),
  'MaxFragments=3, MaxWords=30, MinWords=15') AS snippet
FROM articles
WHERE search_vector @@ plainto_tsquery('english', 'vacuum tuning');
```

## Row-Level Security

```sql
-- Enable RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Force RLS even for table owner
ALTER TABLE documents FORCE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY tenant_isolation ON documents
  USING (tenant_id = current_setting('app.current_tenant')::int);

CREATE POLICY owner_full_access ON documents
  FOR ALL
  USING (owner_id = current_setting('app.current_user_id')::int);

CREATE POLICY public_read ON documents
  FOR SELECT
  USING (is_public = true);

-- Set context per request (in application)
SET app.current_tenant = '42';
SET app.current_user_id = '7';
```

## Replication

### Streaming Replication

```sql
-- Primary: postgresql.conf
-- wal_level = replica
-- max_wal_senders = 10
-- wal_keep_size = 1GB

-- Standby: create with pg_basebackup
-- pg_basebackup -h primary-host -D [system-path] -U replicator -P -R

-- Monitoring replication lag
SELECT client_addr, state, sent_lsn, write_lsn, flush_lsn, replay_lsn,
       pg_wal_lsn_diff(sent_lsn, replay_lsn) AS replay_lag_bytes
FROM pg_stat_replication;
```

### Logical Replication

```sql
-- Publisher
CREATE PUBLICATION my_pub FOR TABLE users, orders;

-- Subscriber
CREATE SUBSCRIPTION my_sub
  CONNECTION 'host=publisher-host dbname=mydb user=replicator'
  PUBLICATION my_pub;
```

## Essential Extensions

```sql
-- PostGIS: Spatial data
CREATE EXTENSION postgis;
SELECT ST_Distance(
  ST_MakePoint(-73.99, 40.73)::geography,
  ST_MakePoint(-118.24, 34.05)::geography
) / 1000 AS distance_km;

-- pg_cron: Scheduled jobs
CREATE EXTENSION pg_cron;
SELECT cron.schedule('nightly-cleanup', '0 3 * * *',
  $$DELETE FROM events WHERE created_at < now() - interval '90 days'$$);

-- pg_stat_statements: Query performance
CREATE EXTENSION pg_stat_statements;

-- pgcrypto: Encryption
CREATE EXTENSION pgcrypto;
SELECT crypt('password', gen_salt('bf', 10));

-- pg_trgm: Similarity search / fuzzy matching
CREATE EXTENSION pg_trgm;
CREATE INDEX idx_name_trgm ON users USING gin (name gin_trgm_ops);
SELECT * FROM users WHERE name % 'Jon Smth' ORDER BY similarity(name, 'Jon Smth') DESC;
```

## Performance Configuration Checklist

```
# Memory
shared_buffers = 25% of RAM (e.g., 8GB for 32GB system)
effective_cache_size = 75% of RAM
work_mem = RAM / (max_connections * 4) -- start at 64MB, tune per query
maintenance_work_mem = 1GB-2GB

# WAL
wal_buffers = 64MB
checkpoint_completion_target = 0.9
max_wal_size = 4GB

# Query Planner
random_page_cost = 1.1  (for SSD)
effective_io_concurrency = 200  (for SSD)
default_statistics_target = 200  (more accurate plans)

# Parallelism
max_parallel_workers_per_gather = 4
max_parallel_workers = 8
max_worker_processes = 12
parallel_tuple_cost = 0.01
```

## Query Optimization Workflow

1. **Capture**: Enable `pg_stat_statements`, identify top queries by total_exec_time
2. **Analyze**: Run `EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)` on each query
3. **Look for**: Sequential scans on large tables, nested loops with high row counts, sort operations spilling to disk, low cache hit ratios
4. **Fix**: Add indexes, rewrite queries, adjust `work_mem` for sorts, use CTEs vs subqueries appropriately
5. **Validate**: Re-run EXPLAIN, compare execution times, monitor in production

## When to Use

**Use this skill when:**
- Designing or implementing postgres expert solutions
- Reviewing or improving existing postgres expert approaches
- Making architectural or implementation decisions about postgres expert
- Learning postgres expert patterns and best practices
- Troubleshooting postgres expert-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Postgres Expert Analysis

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

**Input:** "Help me implement postgres expert for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended postgres expert approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When postgres expert must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
