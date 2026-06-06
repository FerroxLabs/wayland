---
name: mysql-optimizer
description: |
  MySQL optimization expertise covering query optimization with EXPLAIN analysis, indexing strategies, InnoDB tuning, slow query log analysis, connection pooling, replication architectures (master-slave, group replication), partitioning, character set handling, and backup strategies using mysqldump and Percona XtraBackup.
  Use when the user asks about mysql optimizer, mysql optimizer best practices, or needs guidance on mysql optimizer implementation.
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

# MySQL Optimizer

## Core Philosophy

MySQL optimization is a systematic discipline. Every performance issue has a root cause discoverable through methodical analysis. The optimization workflow is: measure, analyze with EXPLAIN, identify the bottleneck, fix it, and verify the improvement. Never optimize without evidence.

## Query Optimization with EXPLAIN

### Reading EXPLAIN Output

```sql
EXPLAIN FORMAT=TREE
SELECT o.id, o.total, c.name
FROM orders o
JOIN customers c ON o.customer_id = c.id
WHERE o.status = 'pending'
  AND o.created_at > '2025-01-01'
ORDER BY o.created_at DESC
LIMIT 20;
```

### EXPLAIN Key Columns

| Column | What to Look For |
|--------|-----------------|
| `type` | `ALL` (full scan) is bad. Best to worst: `system > const > eq_ref > ref > range > index > ALL` |
| `key` | Which index is used. `NULL` means no index |
| `rows` | Estimated rows examined. High numbers indicate missing indexes |
| `filtered` | Percentage of rows remaining after table condition. Low values mean scanning lots of unused rows |
| `Extra` | `Using filesort` (expensive sort), `Using temporary` (temp table), `Using index` (covering index, good) |

### EXPLAIN ANALYZE (MySQL 8.0.18+)

```sql
EXPLAIN ANALYZE
SELECT c.name, COUNT(*) as order_count, SUM(o.total) as total_spent
FROM customers c
JOIN orders o ON c.id = o.customer_id
WHERE o.created_at >= '2025-01-01'
GROUP BY c.id
HAVING total_spent > 1000
ORDER BY total_spent DESC
LIMIT 10;

-- Shows actual execution times and row counts vs estimates
-- -> Limit: 10 row(s)  (actual time=45.3..45.3 rows=10 loops=1)
--     -> Sort: total_spent DESC, limit input to 10 row(s)
--         -> Filter: (total_spent > 1000)
--             -> Table scan on <temporary>
```

### Common EXPLAIN Anti-Patterns and Fixes

```sql
-- Problem 1: Full table scan (type=ALL)
EXPLAIN SELECT * FROM orders WHERE YEAR(created_at) = 2025;
-- Fix: Avoid functions on indexed columns
SELECT * FROM orders WHERE created_at >= '2025-01-01' AND created_at < '2026-01-01';

-- Problem 2: Using filesort on large result set
EXPLAIN SELECT * FROM orders WHERE customer_id = 123 ORDER BY created_at DESC;
-- Fix: Composite index matching WHERE + ORDER BY
CREATE INDEX idx_customer_date ON orders (customer_id, created_at DESC);

-- Problem 3: Using temporary (GROUP BY / DISTINCT)
EXPLAIN SELECT status, COUNT(*) FROM orders GROUP BY status;
-- Fix: Index on the GROUP BY column
CREATE INDEX idx_status ON orders (status);

-- Problem 4: Implicit type conversion
EXPLAIN SELECT * FROM users WHERE phone = 5551234567;  -- phone is VARCHAR
-- Fix: Use correct type
SELECT * FROM users WHERE phone = '5551234567';
```

## Indexing Strategy

### Index Types

```sql
-- B-tree index (default, general purpose)
CREATE INDEX idx_email ON users (email);

-- Composite index (column order follows query patterns)
CREATE INDEX idx_composite ON orders (customer_id, status, created_at);
-- Supports queries filtering on:
-- (customer_id), (customer_id, status), (customer_id, status, created_at)
-- Does NOT support: (status), (status, created_at), (created_at)

-- Covering index (all query columns in index)
CREATE INDEX idx_covering ON orders (customer_id, status, created_at, total);
-- Query uses "Using index" (index-only scan, no table lookup)
SELECT status, created_at, total FROM orders WHERE customer_id = 123;

-- Prefix index (for long text columns)
CREATE INDEX idx_url ON pages (url(100));

-- Full-text index
CREATE FULLTEXT INDEX idx_content ON articles (title, body);
SELECT * FROM articles WHERE MATCH(title, body) AGAINST('mysql optimization' IN BOOLEAN MODE);

-- Spatial index
CREATE SPATIAL INDEX idx_location ON stores (location);

-- Descending index (MySQL 8.0+)
CREATE INDEX idx_recent ON events (created_at DESC);

-- Invisible index (test impact without dropping)
ALTER TABLE orders ALTER INDEX idx_status INVISIBLE;
-- Monitor performance, then:
ALTER TABLE orders ALTER INDEX idx_status VISIBLE;
-- Or drop if not needed
```

### Index Selection Guidelines

```
1. Start with queries from the slow query log
2. Identify WHERE, JOIN, ORDER BY, and GROUP BY columns
3. Build composite indexes following the order:
   - Equality conditions first (WHERE status = 'active')
   - Range conditions next (WHERE created_at > '2025-01-01')
   - ORDER BY / GROUP BY columns last
4. Include SELECT columns for covering index when feasible
5. Avoid over-indexing: each index slows writes
6. Use FORCE INDEX only as last resort
```

### Index Maintenance

```sql
-- Check index usage (MySQL 8.0+ with sys schema)
SELECT * FROM sys.schema_unused_indexes WHERE object_schema = 'mydb';

-- Check duplicate/redundant indexes
SELECT * FROM sys.schema_redundant_indexes WHERE table_schema = 'mydb';

-- Index statistics
SHOW INDEX FROM orders;
ANALYZE TABLE orders;  -- Update index statistics

-- Index size
SELECT table_name, index_name,
       ROUND(stat_value * @@innodb_page_size / 1024 / 1024, 2) AS size_mb
FROM mysql.innodb_index_stats
WHERE database_name = 'mydb' AND stat_name = 'size';
```

## InnoDB Tuning

### Critical Parameters

```ini
# my.cnf / my.ini

[mysqld]
# Buffer pool: 70-80% of available RAM on dedicated server
innodb_buffer_pool_size = 24G
innodb_buffer_pool_instances = 8   # 1 per GB, max 64

# Redo log: larger = better write performance, longer recovery
innodb_redo_log_capacity = 4G      # MySQL 8.0.30+

# I/O configuration
innodb_io_capacity = 2000          # IOPS for background tasks (SSD: 2000-10000)
innodb_io_capacity_max = 4000
innodb_flush_method = O_DIRECT     # Linux: bypass OS cache
innodb_flush_neighbors = 0         # Disable for SSD

# Concurrency
innodb_thread_concurrency = 0      # Let InnoDB manage
innodb_read_io_threads = 8
innodb_write_io_threads = 8

# Doublewrite buffer
innodb_doublewrite = ON            # Data safety

# Change buffer
innodb_change_buffer_max_size = 25  # Percentage of buffer pool

# Flush behavior
innodb_flush_log_at_trx_commit = 1  # 1=ACID safest, 2=per second, 0=OS decides
sync_binlog = 1                     # Sync binlog on each commit
```

### Buffer Pool Monitoring

```sql
-- Buffer pool utilization
SELECT
  ROUND(@@innodb_buffer_pool_size / 1024 / 1024 / 1024, 2) AS pool_size_gb,
  ROUND(data_length / 1024 / 1024 / 1024, 2) AS data_size_gb
FROM (
  SELECT SUM(data_length + index_length) AS data_length
  FROM information_schema.tables
  WHERE table_schema NOT IN ('mysql', 'information_schema', 'performance_schema', 'sys')
) t;

-- Buffer pool hit rate (should be > 99%)
SHOW STATUS LIKE 'Innodb_buffer_pool_read%';
-- Hit rate = 1 - (Innodb_buffer_pool_reads / Innodb_buffer_pool_read_requests)
```

## Slow Query Log Analysis

### Configuration

```ini
[mysqld]
slow_query_log = ON
slow_query_log_file = [system-path]
long_query_time = 0.5           # Log queries taking > 500ms
log_queries_not_using_indexes = ON
min_examined_row_limit = 1000   # Only log if examining > 1000 rows
log_slow_admin_statements = ON
log_slow_replica_statements = ON
```

### Analysis with pt-query-digest

```shell
# Percona Toolkit: aggregate and rank slow queries
pt-query-digest [system-path] --limit=20

# Filter by database
pt-query-digest [system-path] --filter '$event->{db} eq "mydb"'

# Filter by time range
pt-query-digest [system-path] --since '2025-03-01' --until '2025-03-02'
```

### Performance Schema Queries

```sql
-- Top queries by total execution time
SELECT
  DIGEST_TEXT AS query_pattern,
  COUNT_STAR AS executions,
  ROUND(SUM_TIMER_WAIT / 1e12, 2) AS total_seconds,
  ROUND(AVG_TIMER_WAIT / 1e12, 4) AS avg_seconds,
  SUM_ROWS_EXAMINED,
  SUM_ROWS_SENT,
  FIRST_SEEN, LAST_SEEN
FROM performance_schema.events_statements_summary_by_digest
ORDER BY SUM_TIMER_WAIT DESC
LIMIT 20;
```

## Connection Pooling

### ProxySQL Configuration

```sql
-- Add MySQL backend servers
INSERT INTO mysql_servers (hostgroup_id, hostname, port, weight) VALUES
  (10, 'mysql-primary', 3306, 100),
  (20, 'mysql-replica-1', 3306, 50),
  (20, 'mysql-replica-2', 3306, 50);

-- Query rules: route reads to replicas
INSERT INTO mysql_query_rules (rule_id, active, match_pattern, destination_hostgroup) VALUES
  (1, 1, '^SELECT.*FOR UPDATE', 10),
  (2, 1, '^SELECT', 20),
  (3, 1, '.*', 10);

LOAD MYSQL SERVERS TO RUNTIME;
LOAD MYSQL QUERY RULES TO RUNTIME;
SAVE MYSQL SERVERS TO DISK;
SAVE MYSQL QUERY RULES TO DISK;
```

## Replication

### Async Replication (Master-Replica)

```sql
-- On primary
CREATE USER 'repl'@'%' IDENTIFIED BY 'YOUR_SECURE_PASSWORD_HERE';  -- CHANGE THIS PASSWORD
GRANT REPLICATION SLAVE ON *.* TO 'repl'@'%';

-- On replica
CHANGE REPLICATION SOURCE TO
  SOURCE_HOST='primary-host',
  SOURCE_USER='repl',
  SOURCE_PASSWORD='YOUR_SECURE_PASSWORD_HERE',  -- CHANGE THIS PASSWORD
  SOURCE_AUTO_POSITION=1;
START REPLICA;

-- Monitor replication
SHOW REPLICA STATUS\G
```

### Group Replication (Multi-Primary)

```sql
-- Bootstrap first node
SET GLOBAL group_replication_bootstrap_group=ON;
START GROUP_REPLICATION;
SET GLOBAL group_replication_bootstrap_group=OFF;

-- Join additional nodes
START GROUP_REPLICATION;
```

## Partitioning

```sql
-- Range partitioning by date
CREATE TABLE events (
    id BIGINT AUTO_INCREMENT,
    event_type VARCHAR(50),
    payload JSON,
    created_at DATETIME NOT NULL,
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (TO_DAYS(created_at)) (
    PARTITION p2025_01 VALUES LESS THAN (TO_DAYS('2025-02-01')),
    PARTITION p2025_02 VALUES LESS THAN (TO_DAYS('2025-03-01')),
    PARTITION p_future VALUES LESS THAN MAXVALUE
);

-- Partition management
ALTER TABLE events ADD PARTITION (
    PARTITION p2025_04 VALUES LESS THAN (TO_DAYS('2025-05-01'))
);
ALTER TABLE events DROP PARTITION p2024_01;
```

## Character Set Handling

```sql
-- Use utf8mb4 everywhere (full Unicode including emoji)
CREATE DATABASE mydb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Convert existing table
ALTER TABLE users CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Collation comparison:
-- utf8mb4_unicode_ci: Standard Unicode (case-insensitive)
-- utf8mb4_0900_ai_ci: MySQL 8.0 default, accent-insensitive
-- utf8mb4_bin: Binary (case-sensitive, exact match)
```

## Backup Strategies

### mysqldump (Logical Backup)

```shell
mysqldump --single-transaction --routines --triggers --events \
  --set-gtid-purged=ON --source-data=2 \
  --databases mydb > backup_$(date +%Y%m%d).sql
```

### Percona XtraBackup (Physical Backup)

```shell
# Full backup (online, non-blocking for InnoDB)
xtrabackup --backup --target-dir=/backups/full/$(date +%Y%m%d) \
  --user=root --password=pass

# Incremental backup
xtrabackup --backup --target-dir=/backups/inc/$(date +%Y%m%d) \
  --incremental-basedir=/backups/full/20250301

# Prepare and restore
xtrabackup --prepare --target-dir=/backups/full/20250301
xtrabackup --copy-back --target-dir=/backups/full/20250301
```

| Method | Speed | Size | Locking | Granularity |
|--------|-------|------|---------|-------------|
| mysqldump | Slow | Small | No (InnoDB) | Database/Table |
| mydumper | Medium | Small | Minimal | Database/Table |
| XtraBackup | Fast | Large | No | Full/Incremental |

## When to Use

**Use this skill when:**
- Designing or implementing mysql optimizer solutions
- Reviewing or improving existing mysql optimizer approaches
- Making architectural or implementation decisions about mysql optimizer
- Learning mysql optimizer patterns and best practices
- Troubleshooting mysql optimizer-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Mysql Optimizer Analysis

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

**Input:** "Help me implement mysql optimizer for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended mysql optimizer approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When mysql optimizer must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
