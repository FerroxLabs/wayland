---
name: clickhouse-analyst
description: |
  ClickHouse columnar OLAP expert covering table engine selection (MergeTree family), materialized views, aggregating merge trees, data sharding and replication, query optimization for analytical workloads, data ingestion patterns, and partition management for high-performance analytics.
  Use when the user asks about clickhouse analyst, clickhouse analyst best practices, or needs guidance on clickhouse analyst implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "database sql data-science"
  category: "backend-systems"
  subcategory: "database"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# ClickHouse Analyst

You are an expert ClickHouse Analyst who designs and operates high-performance analytical systems. You understand ClickHouse's columnar storage architecture, select appropriate table engines for each workload, build materialized views for pre-aggregation, optimize queries that scan billions of rows in seconds, and architect clusters for both throughput and reliability.

## ClickHouse Architecture Fundamentals

```
ClickHouse is a column-oriented OLAP database designed for:
  - Sub-second queries over billions of rows
  - High-throughput data ingestion (millions of rows/sec)
  - Efficient compression of columnar data
  - Real-time analytics with minimal query latency

Key architectural properties:
  - Column storage: only reads columns referenced in the query
  - Vectorized execution: processes data in batches (SIMD optimized)
  - Sparse primary index: index granules (~8192 rows) not individual rows
  - Data is sorted by primary key within each part
  - Compression: LZ4 by default, ZSTD for higher compression
  - No transactions, no UPDATE/DELETE in traditional sense
```

### When ClickHouse Excels vs When It Does Not

```
EXCELS AT:
  - Aggregation queries (COUNT, SUM, AVG, quantiles) over large datasets
  - Time-series analytics and log analysis
  - Real-time dashboards with many concurrent queries
  - Wide tables (100+ columns, queries touch 5-10)
  - Append-heavy workloads with immutable data

NOT IDEAL FOR:
  - OLTP workloads (frequent single-row updates, point lookups)
  - Transactions (no ACID transactions)
  - Complex joins across large tables (better as pre-joined/denormalized)
  - Small datasets (<1M rows, use PostgreSQL instead)
  - Frequent deletes or updates of individual rows
```

## Table Engines

### MergeTree Family

```sql
-- MergeTree: The foundational engine for analytics
CREATE TABLE events (
    event_date Date,
    event_time DateTime,
    user_id UInt64,
    event_type LowCardinality(String),
    page_url String,
    duration_ms UInt32,
    properties Map(String, String)
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(event_date)      -- Monthly partitions
ORDER BY (event_type, user_id, event_time)  -- Primary key / sort order
TTL event_date + INTERVAL 90 DAY       -- Auto-delete after 90 days
SETTINGS
    index_granularity = 8192,           -- Rows per index granule
    min_bytes_for_wide_part = 10485760; -- 10 MB threshold for wide format
```

### Engine Selection Guide

```
Engine                  | Use Case                          | Key Feature
------------------------|-----------------------------------|---------------------------
MergeTree               | General analytics                 | Sorted storage, partitions
ReplacingMergeTree      | Deduplication by key              | Keeps latest version by ver column
SummingMergeTree        | Pre-aggregated counters           | Sums numeric columns on merge
AggregatingMergeTree    | Complex pre-aggregations          | Stores intermediate agg states
CollapsingMergeTree     | Mutable rows via insert+cancel    | +1/-1 sign column for updates
VersionedCollapsingMergeTree | Same, with version tracking | Handles out-of-order inserts
```

```sql
-- ReplacingMergeTree: Deduplicate by keeping latest row per key
CREATE TABLE user_profiles (
    user_id UInt64,
    name String,
    email String,
    updated_at DateTime
)
ENGINE = ReplacingMergeTree(updated_at)  -- Keep row with highest updated_at
ORDER BY user_id;

-- SummingMergeTree: Auto-sum numeric columns for same key
CREATE TABLE daily_metrics (
    date Date,
    site_id UInt32,
    page_views UInt64,
    unique_visitors UInt64,
    revenue Float64
)
ENGINE = SummingMergeTree((page_views, unique_visitors, revenue))
PARTITION BY toYYYYMM(date)
ORDER BY (site_id, date);

-- Insert incremental data; ClickHouse sums on background merge
INSERT INTO daily_metrics VALUES ('2025-01-15', 1, 1500, 200, 450.00);
INSERT INTO daily_metrics VALUES ('2025-01-15', 1, 300, 50, 100.00);
-- After merge: (2025-01-15, 1, 1800, 250, 550.00)

-- IMPORTANT: Use FINAL or GROUP BY to get correct results before merge completes
SELECT site_id, date, sum(page_views), sum(unique_visitors), sum(revenue)
FROM daily_metrics
GROUP BY site_id, date;
```

## Materialized Views

### Architecture

```
Materialized views in ClickHouse are trigger-based:
  - They process new data as it is inserted into the source table
  - They do NOT retroactively process existing data
  - The result is stored in a separate target table
  - Source table and target table can use different engines

Data flow:
  INSERT → Source Table → Materialized View → Target Table
                              (transforms)

Key rules:
  - MV only sees newly inserted rows (not updates or deletes)
  - Multiple MVs can read from the same source
  - Use AggregatingMergeTree for target when pre-aggregating
  - Populate existing data with INSERT INTO target SELECT ... FROM source
```

### Pre-Aggregation Pattern

```sql
-- Source: raw page view events
CREATE TABLE page_views (
    timestamp DateTime,
    user_id UInt64,
    page_url String,
    country LowCardinality(String),
    device LowCardinality(String),
    duration_ms UInt32
)
ENGINE = MergeTree()
PARTITION BY toYYYYMMDD(timestamp)
ORDER BY (page_url, timestamp);

-- Target: hourly aggregations
CREATE TABLE page_views_hourly (
    hour DateTime,
    page_url String,
    country LowCardinality(String),
    views AggregateFunction(count, UInt64),
    unique_users AggregateFunction(uniq, UInt64),
    avg_duration AggregateFunction(avg, UInt32),
    p95_duration AggregateFunction(quantile(0.95), UInt32)
)
ENGINE = AggregatingMergeTree()
PARTITION BY toYYYYMM(hour)
ORDER BY (page_url, country, hour);

-- Materialized view: transforms inserts into aggregates
CREATE MATERIALIZED VIEW page_views_hourly_mv
TO page_views_hourly
AS SELECT
    toStartOfHour(timestamp) AS hour,
    page_url,
    country,
    countState() AS views,
    uniqState(user_id) AS unique_users,
    avgState(duration_ms) AS avg_duration,
    quantileState(0.95)(duration_ms) AS p95_duration
FROM page_views
GROUP BY hour, page_url, country;

-- Query the pre-aggregated data (uses Merge combinators)
SELECT
    hour,
    page_url,
    country,
    countMerge(views) AS total_views,
    uniqMerge(unique_users) AS unique_users,
    avgMerge(avg_duration) AS avg_duration_ms,
    quantileMerge(0.95)(p95_duration) AS p95_duration_ms
FROM page_views_hourly
WHERE hour >= '2025-01-15 00:00:00'
  AND hour < '2025-01-16 00:00:00'
GROUP BY hour, page_url, country
ORDER BY total_views DESC;
```

## Query Optimization

### Primary Key (ORDER BY) Design

```
The ORDER BY clause defines the primary key and sort order within parts.
This determines which queries can skip data efficiently.

Rules for ORDER BY column selection:
  1. Put low-cardinality filter columns first (event_type, status)
  2. Then higher-cardinality columns used in filters (user_id)
  3. Then time column for range queries (timestamp)

Example:
  ORDER BY (event_type, user_id, timestamp)

  Fast queries:
    WHERE event_type = 'click'                              -- skips all non-click data
    WHERE event_type = 'click' AND user_id = 123            -- very selective
    WHERE event_type = 'click' AND user_id = 123 AND timestamp > ... -- optimal

  Slow queries:
    WHERE user_id = 123                     -- must scan all event_types
    WHERE timestamp > '2025-01-01'          -- must scan all event_types and users
    Fix: Add a secondary index or create a separate MV sorted by (user_id, timestamp)
```

### Skipping Indexes

```sql
-- Data skipping indexes help ClickHouse skip granules for non-primary-key columns

-- Bloom filter index: good for equality checks on high-cardinality columns
ALTER TABLE events ADD INDEX idx_session_id session_id
  TYPE bloom_filter(0.01) GRANULARITY 4;

-- Set index: good for low-cardinality columns
ALTER TABLE events ADD INDEX idx_country country
  TYPE set(100) GRANULARITY 4;

-- Min-max index: good for range queries
ALTER TABLE events ADD INDEX idx_amount amount
  TYPE minmax GRANULARITY 4;

-- ngrambf_v1: good for LIKE '%substring%' queries
ALTER TABLE events ADD INDEX idx_url page_url
  TYPE ngrambf_v1(3, 256, 2, 0) GRANULARITY 4;

-- After adding index, materialize for existing data:
ALTER TABLE events MATERIALIZE INDEX idx_session_id;
```

### Query Performance Tips

```sql
-- 1. Use PREWHERE instead of WHERE for expensive filters
-- ClickHouse auto-promotes some WHERE conditions to PREWHERE
-- You can manually control it:
SELECT * FROM events
PREWHERE event_type = 'purchase'   -- Evaluated first (skips granules)
WHERE duration_ms > 1000;           -- Evaluated on remaining rows

-- 2. Use LowCardinality for string columns with <10K unique values
-- Stores as dictionary-encoded integers, 2-5x faster
CREATE TABLE events (
    event_type LowCardinality(String),   -- ~50 unique values
    country LowCardinality(String),       -- ~200 unique values
    page_url String                        -- millions of unique URLs, keep as String
);

-- 3. Approximate functions for faster results
SELECT uniqExact(user_id) FROM events;  -- Exact, slower
SELECT uniq(user_id) FROM events;        -- ~2% error, much faster
SELECT uniqHLL12(user_id) FROM events;   -- ~1.6% error, HyperLogLog

-- 4. SAMPLE for exploratory queries on large tables
SELECT avg(duration_ms) FROM events SAMPLE 0.1;  -- 10% sample

-- 5. Avoid SELECT * -- only select needed columns
-- ClickHouse is columnar: fewer columns = less data read
SELECT event_type, count() FROM events GROUP BY event_type;
```

## Sharding and Replication

### Cluster Architecture

```
ClickHouse Cluster with 2 shards, 2 replicas each:

  ┌─────── Shard 1 ────────┐    ┌─────── Shard 2 ────────┐
  │ Replica 1A  Replica 1B │    │ Replica 2A  Replica 2B │
  │ (primary)   (standby)  │    │ (primary)   (standby)  │
  └─────────────────────────┘    └─────────────────────────┘

Data is distributed across shards by sharding key.
Each shard's data is replicated for high availability.
```

### Distributed Table Setup

```sql
-- Local table on each shard (using ReplicatedMergeTree for HA)
CREATE TABLE events_local ON CLUSTER my_cluster (
    event_date Date,
    event_time DateTime,
    user_id UInt64,
    event_type LowCardinality(String),
    payload String
)
ENGINE = ReplicatedMergeTree('/clickhouse/tables/{shard}/events', '{replica}')
PARTITION BY toYYYYMM(event_date)
ORDER BY (event_type, user_id, event_time);

-- Distributed table that spans all shards
CREATE TABLE events ON CLUSTER my_cluster AS events_local
ENGINE = Distributed(my_cluster, default, events_local, sipHash64(user_id));
-- sipHash64(user_id) is the sharding key: same user always goes to same shard

-- Insert into distributed table (auto-routes to correct shard)
INSERT INTO events VALUES (...);

-- Query distributed table (auto-aggregates across shards)
SELECT event_type, count() FROM events GROUP BY event_type;
```

## Data Ingestion Patterns

### Batch Ingestion Best Practices

```
RULE: Insert in batches of 10,000-1,000,000 rows. Never insert one row at a time.

Why: Each INSERT creates a new "part" on disk. Too many small parts cause:
  - Excessive background merges
  - "Too many parts" errors (default limit: 300 active parts per partition)
  - Degraded query performance

Recommended patterns:
  1. Buffer in application, flush every 10-60 seconds or 100K rows
  2. Use Buffer table engine as an intermediate buffer
  3. Use Kafka engine for streaming ingestion (batches internally)
```

```sql
-- Buffer table engine: automatically batches inserts
CREATE TABLE events_buffer AS events_local
ENGINE = Buffer(default, events_local,
    16,    -- num_layers (parallel buffers)
    10,    -- min_time (flush after 10 seconds)
    100,   -- max_time (flush after 100 seconds max)
    10000, -- min_rows (flush after 10K rows)
    1000000, -- max_rows (flush after 1M rows)
    10000000, -- min_bytes (10 MB)
    100000000 -- max_bytes (100 MB)
);

-- Kafka engine for streaming ingestion
CREATE TABLE events_kafka (
    event_time DateTime,
    user_id UInt64,
    event_type String,
    payload String
)
ENGINE = Kafka()
SETTINGS
    kafka_broker_list = 'kafka1:9092,kafka2:9092',
    kafka_topic_list = 'events',
    kafka_group_name = 'clickhouse_consumer',
    kafka_format = 'JSONEachRow',
    kafka_num_consumers = 4;

-- Materialized view moves data from Kafka to MergeTree
CREATE MATERIALIZED VIEW events_kafka_mv TO events_local AS
SELECT * FROM events_kafka;
```

## Partition Management

```sql
-- List partitions and their sizes
SELECT partition, name, rows, bytes_on_disk,
       formatReadableSize(bytes_on_disk) AS size
FROM system.parts
WHERE table = 'events' AND active
ORDER BY partition DESC;

-- Drop old partitions (instant operation)
ALTER TABLE events DROP PARTITION '202401';

-- Detach partition (keeps data on disk but removes from table)
ALTER TABLE events DETACH PARTITION '202401';

-- Move partition to another table (for archival)
ALTER TABLE events MOVE PARTITION '202401' TO TABLE events_archive;

-- TTL-based automatic cleanup
ALTER TABLE events MODIFY TTL event_date + INTERVAL 90 DAY;

-- TTL with tiered storage (move old data to cold storage)
ALTER TABLE events MODIFY TTL
    event_date + INTERVAL 7 DAY TO VOLUME 'hot',
    event_date + INTERVAL 30 DAY TO VOLUME 'warm',
    event_date + INTERVAL 90 DAY TO VOLUME 'cold',
    event_date + INTERVAL 365 DAY DELETE;
```

## ClickHouse Operations Checklist

```
Schema Design:
[ ] ORDER BY columns match primary query filters (low cardinality first)
[ ] Partition key chosen for efficient data lifecycle (monthly or daily)
[ ] LowCardinality applied to string columns with <10K distinct values
[ ] Materialized views built for common aggregation patterns
[ ] Appropriate table engine selected (MergeTree vs Aggregating vs Replacing)

Ingestion:
[ ] Batch inserts of 10K-1M rows (never single-row inserts)
[ ] Buffer engine or application-side batching in place
[ ] Kafka engine configured for streaming sources
[ ] Monitoring "too many parts" warnings

Query Performance:
[ ] Queries filter on primary key prefix columns
[ ] SELECT lists only needed columns (never SELECT *)
[ ] Approximate functions used where exact counts not required
[ ] Skipping indexes added for non-primary-key filter columns
[ ] Query log analyzed for slow queries: system.query_log

Operations:
[ ] Replication configured for high availability (ReplicatedMergeTree)
[ ] Partition TTL set for automatic data lifecycle management
[ ] Monitoring: merge lag, part count, replication queue, query latency
[ ] Backup strategy: BACKUP TABLE or filesystem snapshots
[ ] Capacity planning: storage growth, query concurrency limits
```

## When to Use

**Use this skill when:**
- Designing or implementing clickhouse analyst solutions
- Reviewing or improving existing clickhouse analyst approaches
- Making architectural or implementation decisions about clickhouse analyst
- Learning clickhouse analyst patterns and best practices
- Troubleshooting clickhouse analyst-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Clickhouse Analyst Analysis

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

**Input:** "Help me implement clickhouse analyst for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended clickhouse analyst approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When clickhouse analyst must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
