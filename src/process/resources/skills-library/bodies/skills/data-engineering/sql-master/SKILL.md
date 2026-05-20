---
name: sql-master
description: |
  Advanced SQL expertise including window functions, CTEs, recursive queries, query optimization with EXPLAIN plans, indexing strategies, pivot/unpivot operations, JSON operations, full-text search, stored procedures, and identification of performance anti-patterns across PostgreSQL, MySQL, and SQL Server.
  Use when the user asks about sql master, sql master best practices, or needs guidance on sql master implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "data-science sql guide"
  category: "data-engineering"
  subcategory: "pipelines-etl"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---

# SQL Master

## Overview

This skill provides deep expertise in advanced SQL techniques that separate production-grade database work from basic querying. It covers the full spectrum from analytical window functions through query optimization, enabling you to write SQL that is both correct and performant at scale.

## Window Functions

Window functions operate over a set of rows related to the current row without collapsing the result set. They are essential for ranking, running totals, moving averages, and gap-and-island analysis.

### Ranking Functions

```sql
-- ROW_NUMBER: unique sequential integer, no ties
-- RANK: same rank for ties, gaps after ties
-- DENSE_RANK: same rank for ties, no gaps
SELECT
    employee_id,
    department,
    salary,
    ROW_NUMBER() OVER (PARTITION BY department ORDER BY salary DESC) AS row_num,
    RANK()       OVER (PARTITION BY department ORDER BY salary DESC) AS rank_val,
    DENSE_RANK() OVER (PARTITION BY department ORDER BY salary DESC) AS dense_rank_val,
    NTILE(4)     OVER (PARTITION BY department ORDER BY salary DESC) AS quartile
FROM employees;
```

### Offset Functions

```sql
-- LAG/LEAD: access previous/next rows without self-join
SELECT
    order_date,
    revenue,
    LAG(revenue, 1)  OVER (ORDER BY order_date) AS prev_day_revenue,
    LEAD(revenue, 1) OVER (ORDER BY order_date) AS next_day_revenue,
    revenue - LAG(revenue, 1) OVER (ORDER BY order_date) AS day_over_day_change,
    FIRST_VALUE(revenue) OVER (
        PARTITION BY DATE_TRUNC('month', order_date)
        ORDER BY order_date
        ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
    ) AS first_day_of_month_revenue
FROM daily_revenue;
```

### Frame Specifications

```sql
-- Moving averages with precise frame control
SELECT
    trade_date,
    close_price,
    -- 7-day moving average
    AVG(close_price) OVER (
        ORDER BY trade_date
        ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
    ) AS ma_7,
    -- 30-day moving average
    AVG(close_price) OVER (
        ORDER BY trade_date
        ROWS BETWEEN 29 PRECEDING AND CURRENT ROW
    ) AS ma_30,
    # ... (condensed) ...
WHERE ticker = 'AAPL';

-- RANGE vs ROWS: RANGE groups identical ORDER BY values
-- ROWS treats each row independently
-- GROUPS (PostgreSQL 11+) counts distinct groups
```

## Common Table Expressions (CTEs)

### Standard CTEs

```sql
-- Named subqueries for readability and reuse
WITH monthly_sales AS (
    SELECT
        DATE_TRUNC('month', order_date) AS month,
        SUM(amount) AS total_sales
    FROM orders
    GROUP BY 1
),
monthly_growth AS (
    SELECT
        month,
        total_sales,
        LAG(total_sales) OVER (ORDER BY month) AS prev_month_sales,
        ROUND(
            (total_sales - LAG(total_sales) OVER (ORDER BY month))
            / LAG(total_sales) OVER (ORDER BY month) * 100, 2
        ) AS growth_pct
    FROM monthly_sales
)
SELECT * FROM monthly_growth WHERE growth_pct < 0;
```

### Recursive CTEs

```sql
-- Organizational hierarchy traversal
WITH RECURSIVE org_tree AS (
    -- Base case: top-level managers
    SELECT
        employee_id,
        name,
        manager_id,
        1 AS depth,
        ARRAY[employee_id] AS path,
        name::TEXT AS hierarchy
    FROM employees
    WHERE manager_id IS NULL

    UNION ALL
# ... (condensed) ...
    SELECT dt + INTERVAL '1 day'
    FROM date_series
    WHERE dt < DATE '2024-12-31'
)
SELECT dt FROM date_series;
```

### Gap and Island Analysis

```sql
-- Find consecutive sequences (islands) and gaps
WITH numbered AS (
    SELECT
        event_date,
        event_date - (ROW_NUMBER() OVER (ORDER BY event_date))::INT * INTERVAL '1 day' AS grp
    FROM events
),
islands AS (
    SELECT
        MIN(event_date) AS island_start,
        MAX(event_date) AS island_end,
        COUNT(*) AS island_length
    FROM numbered
    GROUP BY grp
)
SELECT * FROM islands ORDER BY island_start;
```

## Query Optimization

### Reading EXPLAIN Plans

```sql
-- PostgreSQL: always use ANALYZE for actual execution times
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT * FROM orders o
JOIN customers c ON o.customer_id = c.id
WHERE o.order_date > '2024-01-01';

-- Key metrics to examine:
-- 1. Seq Scan vs Index Scan (sequential = full table scan)
-- 2. Actual rows vs Estimated rows (>10x difference = stale statistics)
-- 3. Sort method: external merge = not enough work_mem
-- 4. Nested Loop vs Hash Join vs Merge Join
-- 5. Buffers: shared hit (cache) vs shared read (disk)
```

### Join Strategy Selection (Internal Optimizer Logic)

| Join Type | Best When | Cost |
|-----------|-----------|------|
| Nested Loop | Small outer table, indexed inner | O(n * m) worst, O(n * log m) with index |
| Hash Join | No useful indexes, equality joins | O(n + m) but needs memory |
| Merge Join | Both inputs sorted or indexable | O(n + m) but needs sorting |

### Statistics and Cardinality

```sql
-- PostgreSQL: update statistics
ANALYZE table_name;

-- Check statistics accuracy
SELECT
    schemaname, tablename, n_live_tup, n_dead_tup,
    last_vacuum, last_autovacuum, last_analyze, last_autoanalyze
FROM pg_stat_user_tables;

-- Extended statistics for correlated columns (PostgreSQL 10+)
CREATE STATISTICS stats_name (dependencies)
ON column_a, column_b FROM table_name;
```

## Indexing Strategies

### Index Type Decision Tree

1. **Equality lookups on single column** -> B-tree (default)
2. **Range queries, ORDER BY** -> B-tree
3. **Full-text search** -> GIN on tsvector
4. **JSONB containment queries** -> GIN
5. **Geometric/spatial data** -> GiST or SP-GiST
6. **Low-cardinality columns** -> BRIN (if physically correlated)
7. **Pattern matching (LIKE 'prefix%')** -> B-tree with text_pattern_ops
8. **Pattern matching (LIKE '%middle%')** -> GIN with pg_trgm

### Composite Index Design

```sql
-- Column order matters: most selective first for equality,
-- range conditions last
-- Rule: equality columns first, then range columns, then sort columns

-- For query: WHERE status = 'active' AND created_at > '2024-01-01' ORDER BY name
CREATE INDEX idx_orders_status_created_name
ON orders (status, created_at, name);

-- Covering index: includes all columns needed, avoiding table lookup
CREATE INDEX idx_orders_covering
ON orders (customer_id)
INCLUDE (order_date, total_amount);

-- Partial index: index only relevant rows
CREATE INDEX idx_orders_active
ON orders (customer_id, order_date)
WHERE status = 'active';

-- Expression index
CREATE INDEX idx_users_lower_email
ON users (LOWER(email));
```

### Index Maintenance

```sql
-- Find unused indexes (PostgreSQL)
SELECT
    schemaname, tablename, indexname,
    idx_scan AS times_used,
    pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE idx_scan = 0
AND indexrelid NOT IN (SELECT conindid FROM pg_constraint)
ORDER BY pg_relation_size(indexrelid) DESC;

-- Find missing indexes (tables with high sequential scans)
SELECT
    schemaname, relname,
    seq_scan, seq_tup_read,
    idx_scan, idx_tup_fetch,
    seq_tup_read / GREATEST(seq_scan, 1) AS avg_rows_per_seq_scan
FROM pg_stat_user_tables
WHERE seq_scan > 100
ORDER BY seq_tup_read DESC;
```

## Pivot and Unpivot Operations

```sql
-- PostgreSQL pivot using FILTER
SELECT
    department,
    COUNT(*) FILTER (WHERE status = 'active')   AS active_count,
    COUNT(*) FILTER (WHERE status = 'inactive') AS inactive_count,
    COUNT(*) FILTER (WHERE status = 'pending')  AS pending_count
FROM employees
GROUP BY department;

-- Generic pivot using CASE
SELECT
    product_category,
    SUM(CASE WHEN quarter = 'Q1' THEN revenue END) AS q1_revenue,
    SUM(CASE WHEN quarter = 'Q2' THEN revenue END) AS q2_revenue,
    # ... (condensed) ...
SELECT p.product_id, v.quarter, v.revenue
FROM quarterly_products p
CROSS JOIN LATERAL (
    VALUES ('Q1', p.q1_rev), ('Q2', p.q2_rev), ('Q3', p.q3_rev), ('Q4', p.q4_rev)
) AS v(quarter, revenue);
```

## JSON Operations

```sql
-- PostgreSQL JSONB operations
-- Extract values
SELECT
    data->>'name'                    AS name_text,
    data->'address'->>'city'         AS city,
    data#>>'{address,zip}'           AS zip_alt_syntax,
    jsonb_array_length(data->'tags') AS tag_count
FROM users;

-- Query inside JSON
SELECT * FROM events
WHERE payload @> '{"type": "purchase"}'::jsonb;

-- Aggregate to JSON
# ... (condensed) ...
CROSS JOIN LATERAL jsonb_array_elements(o.items) AS item;

-- JSON path queries (PostgreSQL 12+)
SELECT * FROM events
WHERE payload @? '$.items[*] ? (@.price > 100)';
```

## Full-Text Search

```sql
-- PostgreSQL full-text search setup
ALTER TABLE articles ADD COLUMN search_vector tsvector;

UPDATE articles SET search_vector =
    setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(abstract, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(body, '')), 'C');

CREATE INDEX idx_articles_fts ON articles USING GIN(search_vector);

-- Trigger for automatic updates
CREATE TRIGGER articles_search_update
BEFORE INSERT OR UPDATE ON articles
FOR EACH ROW EXECUTE FUNCTION
    # ... (condensed) ...
FROM articles,
     to_tsquery('english', 'machine & learning & !supervised') AS query
WHERE search_vector @@ query
ORDER BY rank DESC
LIMIT 20;
```

## Stored Procedures and Functions

```sql
-- PostgreSQL: function with proper error handling
CREATE OR REPLACE FUNCTION transfer_funds(
    p_from_account BIGINT,
    p_to_account   BIGINT,
    p_amount       NUMERIC(15,2)
) RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_from_balance NUMERIC(15,2);
    v_result JSONB;
BEGIN
    -- Lock rows in consistent order to prevent deadlocks
    SELECT balance INTO v_from_balance
    # ... (condensed) ...
            'message', SQLERRM,
            'code', SQLSTATE
        );
END;
$$;
```

## Performance Anti-Patterns

### The Deadly Seven

1. **SELECT ***: Fetches unnecessary columns, defeats covering indexes, increases I/O
2. **N+1 queries**: Loop issuing one query per row instead of a single JOIN or IN clause
3. **Functions in WHERE on indexed columns**: `WHERE YEAR(created_at) = 2024` cannot use index; use `WHERE created_at >= '2024-01-01' AND created_at < '2025-01-01'`
4. **Implicit type conversions**: `WHERE varchar_col = 12345` forces full scan; match types explicitly
5. **OR on different columns**: `WHERE col_a = 1 OR col_b = 2` often forces sequential scan; rewrite as UNION ALL
6. **Correlated subqueries that could be joins**: Executes subquery once per outer row
7. **Missing LIMIT on existence checks**: Use `EXISTS(SELECT 1 ...)` not `COUNT(*) > 0`

### Query Rewriting Patterns

```sql
-- Anti-pattern: correlated subquery
SELECT * FROM orders o
WHERE (SELECT MAX(order_date) FROM orders o2 WHERE o2.customer_id = o.customer_id) = o.order_date;

-- Optimized: window function
SELECT * FROM (
    SELECT *, ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY order_date DESC) AS rn
    FROM orders
) sub WHERE rn = 1;

-- Anti-pattern: count for existence
SELECT * FROM customers c
WHERE (SELECT COUNT(*) FROM orders o WHERE o.customer_id = c.id) > 0;

# ... (condensed) ...
JOIN orders o ON c.id = o.customer_id;

-- Optimized: semi-join
SELECT c.* FROM customers c
WHERE EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id);
```

## Advanced Techniques

### GROUPING SETS, CUBE, and ROLLUP

```sql
-- Multiple aggregation levels in one pass
SELECT
    COALESCE(region, '(All Regions)') AS region,
    COALESCE(product, '(All Products)') AS product,
    SUM(revenue) AS total_revenue,
    GROUPING(region) AS is_region_total,
    GROUPING(product) AS is_product_total
FROM sales
GROUP BY GROUPING SETS (
    (region, product),  -- detail
    (region),           -- subtotal by region
    (product),          -- subtotal by product
    ()                  -- grand total
)
ORDER BY GROUPING(region), GROUPING(product), region, product;
```

### Materialized Views

```sql
-- Create materialized view for expensive aggregations
CREATE MATERIALIZED VIEW mv_daily_metrics AS
SELECT
    DATE_TRUNC('day', event_time) AS day,
    event_type,
    COUNT(*) AS event_count,
    COUNT(DISTINCT user_id) AS unique_users,
    AVG(duration_ms) AS avg_duration
FROM events
GROUP BY 1, 2
WITH DATA;

CREATE UNIQUE INDEX ON mv_daily_metrics (day, event_type);

-- Refresh concurrently (requires unique index, no lock on reads)
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_metrics;
```

### Lateral Joins

```sql
-- Top-N per group without window functions
SELECT c.customer_name, recent_orders.*
FROM customers c
CROSS JOIN LATERAL (
    SELECT order_id, order_date, total_amount
    FROM orders o
    WHERE o.customer_id = c.id
    ORDER BY order_date DESC
    LIMIT 3
) AS recent_orders;
```

## Decision Framework

When approaching a SQL problem:

1. **Correctness first**: Write the logically correct query, then optimize
2. **Check the plan**: Always run EXPLAIN ANALYZE before and after optimization
3. **Measure, do not guess**: Use `pg_stat_statements` or query store to find actual slow queries
4. **Index with purpose**: Every index slows writes; ensure it serves real query patterns
5. **Denormalize deliberately**: Only when read patterns demand it, and document why
6. **Test at scale**: Queries that are fast on 1000 rows may be catastrophic on 10 million

## When to Use

**Use this skill when:**
- Designing or implementing sql master solutions
- Reviewing or improving existing sql master approaches
- Making architectural or implementation decisions about sql master
- Learning sql master patterns and best practices
- Troubleshooting sql master-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Sql Master Analysis

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

**Input:** "Help me implement sql master for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended sql master approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When sql master must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
