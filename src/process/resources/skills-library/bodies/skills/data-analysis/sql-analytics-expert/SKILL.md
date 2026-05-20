---
name: sql-analytics-expert
description: |
  Advanced SQL for analytics covering window functions, CTEs, recursive queries, query optimization, pivoting, and complex analytical patterns for data warehouses and analytics databases.
  Use when the user asks about sql analytics expert, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of sql analytics expert or requires a different specialized skill.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "data-science statistics guide advanced sql testing analysis running"
  category: "data-analysis"
  subcategory: "statistics-modeling"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---

# SQL Analytics Expert

You are an expert SQL analyst who writes efficient, readable analytical queries using window functions, CTEs, recursive patterns, and advanced aggregation techniques across modern data warehouses.


## When to Use

**Use this skill when:**
- User asks about sql analytics expert techniques or best practices
- User needs guidance on sql analytics expert concepts
- User wants to implement or improve their approach to sql analytics expert

**Do NOT use when:**
- The request falls outside the scope of sql analytics expert
- User needs a different specialized skill for their specific situation
- The topic requires professional consultation beyond general guidance

## Window Functions

### Ranking Functions

```sql
SELECT
    employee_id,
    department,
    salary,
    -- Different ranking behaviors
    ROW_NUMBER() OVER (PARTITION BY department ORDER BY salary DESC) AS row_num,
    RANK()       OVER (PARTITION BY department ORDER BY salary DESC) AS rank_num,
    DENSE_RANK() OVER (PARTITION BY department ORDER BY salary DESC) AS dense_rank_num,
    NTILE(4)     OVER (PARTITION BY department ORDER BY salary DESC) AS quartile,
    PERCENT_RANK() OVER (PARTITION BY department ORDER BY salary) AS pct_rank
FROM employees;

-- Top N per group (common pattern)
WITH ranked AS (
    SELECT *,
        ROW_NUMBER() OVER (PARTITION BY department ORDER BY salary DESC) AS rn
    FROM employees
)
SELECT * FROM ranked WHERE rn <= 3;
```

### Running Aggregations

```sql
SELECT
    order_date,
    daily_revenue,
    -- Cumulative sum
    SUM(daily_revenue) OVER (ORDER BY order_date) AS cumulative_revenue,
    -- Running average
    AVG(daily_revenue) OVER (ORDER BY order_date) AS running_avg,
    -- Moving average (7-day)
    AVG(daily_revenue) OVER (
        ORDER BY order_date
        ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
    ) AS moving_avg_7d,
    -- Moving sum (30-day range-based)
    SUM(daily_revenue) OVER (
        ORDER BY order_date
        RANGE BETWEEN INTERVAL '29 days' PRECEDING AND CURRENT ROW
    ) AS moving_sum_30d
FROM daily_metrics;
```

### Lag, Lead, and Comparisons

```sql
SELECT
    month,
    revenue,
    -- Previous period
    LAG(revenue, 1) OVER (ORDER BY month) AS prev_month,
    -- Year-over-year
    LAG(revenue, 12) OVER (ORDER BY month) AS same_month_last_year,
    -- Month-over-month growth
    ROUND(100.0 * (revenue - LAG(revenue, 1) OVER (ORDER BY month))
        / NULLIF(LAG(revenue, 1) OVER (ORDER BY month), 0), 2) AS mom_growth_pct,
    -- Year-over-year growth
    ROUND(100.0 * (revenue - LAG(revenue, 12) OVER (ORDER BY month))
        / NULLIF(LAG(revenue, 12) OVER (ORDER BY month), 0), 2) AS yoy_growth_pct,
    -- First and last values in partition
    FIRST_VALUE(revenue) OVER (ORDER BY month) AS first_month_revenue,
    LAST_VALUE(revenue) OVER (
        ORDER BY month
        ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
    ) AS last_month_revenue
FROM monthly_revenue;
```

### Frame Specifications

```sql
-- ROWS vs RANGE vs GROUPS
-- ROWS: physical row count
-- RANGE: logical value range (handles ties differently)
-- GROUPS: groups of tied rows

-- Frame boundaries:
-- UNBOUNDED PRECEDING  = start of partition
-- N PRECEDING          = N rows/values before current
-- CURRENT ROW          = current row
-- N FOLLOWING          = N rows/values after current
-- UNBOUNDED FOLLOWING  = end of partition

-- Example: Centered moving average
AVG(value) OVER (
    ORDER BY date
    ROWS BETWEEN 3 PRECEDING AND 3 FOLLOWING
) AS centered_avg_7d
```

## Common Table Expressions (CTEs)

### Readable Multi-Step Analysis

```sql
WITH
-- Step 1: Calculate daily metrics
daily_metrics AS (
    SELECT
        DATE_TRUNC('day', created_at) AS day,
        COUNT(DISTINCT user_id) AS dau,
        COUNT(*) AS events,
        SUM(revenue) AS daily_revenue
    FROM events
    WHERE created_at >= CURRENT_DATE - INTERVAL '90 days'
    GROUP BY 1
),

-- Step 2: Add rolling averages
with_rolling AS (
    SELECT
        *,
        AVG(dau) OVER (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) AS dau_7d_avg,
        AVG(daily_revenue) OVER (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) AS rev_7d_avg
    FROM daily_metrics
),

-- Step 3: Add week-over-week comparison
with_comparison AS (
    SELECT
        *,
        LAG(dau, 7) OVER (ORDER BY day) AS dau_prev_week,
        ROUND(100.0 * (dau - LAG(dau, 7) OVER (ORDER BY day))
            / NULLIF(LAG(dau, 7) OVER (ORDER BY day), 0), 1) AS dau_wow_pct
    FROM with_rolling
)

SELECT * FROM with_comparison
ORDER BY day DESC;
```

### CTE for Reuse

```sql
WITH user_segments AS (
    SELECT
        user_id,
        CASE
            WHEN total_spend > 1000 THEN 'high_value'
            WHEN total_spend > 100 THEN 'mid_value'
            ELSE 'low_value'
        END AS segment
    FROM (
        SELECT user_id, SUM(amount) AS total_spend
        FROM orders
        GROUP BY user_id
    ) t
)
-- Reuse the CTE in multiple places
SELECT
    s.segment,
    COUNT(DISTINCT s.user_id) AS users,
    AVG(e.session_count) AS avg_sessions,
    AVG(e.feature_usage) AS avg_feature_usage
FROM user_segments s
JOIN user_engagement e ON s.user_id = e.user_id
GROUP BY s.segment;
```

## Recursive Queries

### Hierarchical Data (Org Chart)

```sql
WITH RECURSIVE org_tree AS (
    -- Base case: top-level managers
    SELECT
        employee_id,
        name,
        manager_id,
        1 AS level,
        name AS path
    FROM employees
    WHERE manager_id IS NULL

    UNION ALL

    -- Recursive case: each employee's reports
    SELECT
        e.employee_id,
        e.name,
        e.manager_id,
        ot.level + 1,
        ot.path || ' > ' || e.name
    FROM employees e
    JOIN org_tree ot ON e.manager_id = ot.employee_id
)
SELECT * FROM org_tree ORDER BY path;
```

### Date Series Generation

```sql
WITH RECURSIVE date_series AS (
    SELECT DATE '2024-01-01' AS dt
    UNION ALL
    SELECT dt + INTERVAL '1 day'
    FROM date_series
    WHERE dt < DATE '2024-12-31'
)
SELECT
    ds.dt,
    COALESCE(m.revenue, 0) AS revenue,
    COALESCE(m.orders, 0) AS orders
FROM date_series ds
LEFT JOIN daily_metrics m ON ds.dt = m.metric_date;
```

### Sessionization

```sql
WITH event_gaps AS (
    SELECT
        user_id,
        event_time,
        LAG(event_time) OVER (PARTITION BY user_id ORDER BY event_time) AS prev_event,
        CASE
            WHEN event_time - LAG(event_time) OVER (
                PARTITION BY user_id ORDER BY event_time
            ) > INTERVAL '30 minutes'
            OR LAG(event_time) OVER (PARTITION BY user_id ORDER BY event_time) IS NULL
            THEN 1
            ELSE 0
        END AS new_session
    FROM events
),
sessions AS (
    SELECT
        user_id,
        event_time,
        SUM(new_session) OVER (
            PARTITION BY user_id ORDER BY event_time
        ) AS session_id
    FROM event_gaps
)
SELECT
    user_id,
    session_id,
    MIN(event_time) AS session_start,
    MAX(event_time) AS session_end,
    COUNT(*) AS event_count,
    MAX(event_time) - MIN(event_time) AS session_duration
FROM sessions
GROUP BY user_id, session_id;
```

## Query Optimization

### Indexing Strategy

```sql
-- Covering index for common analytics queries
CREATE INDEX idx_events_user_date ON events (user_id, event_date)
    INCLUDE (event_type, revenue);

-- Partial index for active records
CREATE INDEX idx_active_users ON users (created_at, plan)
    WHERE status = 'active';

-- Expression index
CREATE INDEX idx_events_month ON events (DATE_TRUNC('month', created_at));
```

### EXPLAIN Analysis

```sql
-- Check query plan
EXPLAIN ANALYZE
SELECT
    DATE_TRUNC('month', o.created_at) AS month,
    c.segment,
    SUM(o.amount) AS revenue
FROM orders o
JOIN customers c ON o.customer_id = c.customer_id
WHERE o.created_at >= '2024-01-01'
GROUP BY 1, 2;

-- Key things to look for:
-- Seq Scan on large tables  -> needs index
-- Nested Loop on large sets -> consider Hash Join
-- Sort with high row count  -> add ORDER BY index
-- High actual vs estimated  -> update statistics (ANALYZE)
```

### Common Optimization Patterns

```sql
-- AVOID: Subquery in SELECT (runs per row)
SELECT
    user_id,
    (SELECT COUNT(*) FROM orders WHERE orders.user_id = users.user_id) AS order_count
FROM users;

-- BETTER: Join with aggregation
SELECT
    u.user_id,
    COALESCE(o.order_count, 0) AS order_count
FROM users u
LEFT JOIN (
    SELECT user_id, COUNT(*) AS order_count
    FROM orders
    GROUP BY user_id
) o ON u.user_id = o.user_id;

-- AVOID: DISTINCT on large result sets
SELECT DISTINCT user_id, event_type FROM events;

-- BETTER: GROUP BY (often has better query plan)
SELECT user_id, event_type FROM events GROUP BY user_id, event_type;

-- AVOID: OR conditions on different columns
SELECT * FROM orders WHERE customer_id = 100 OR product_id = 200;

-- BETTER: UNION for separate index usage
SELECT * FROM orders WHERE customer_id = 100
UNION
SELECT * FROM orders WHERE product_id = 200;
```

## Pivoting and Unpivoting

### Manual Pivot with CASE

```sql
SELECT
    product_category,
    SUM(CASE WHEN quarter = 'Q1' THEN revenue ELSE 0 END) AS q1,
    SUM(CASE WHEN quarter = 'Q2' THEN revenue ELSE 0 END) AS q2,
    SUM(CASE WHEN quarter = 'Q3' THEN revenue ELSE 0 END) AS q3,
    SUM(CASE WHEN quarter = 'Q4' THEN revenue ELSE 0 END) AS q4,
    SUM(revenue) AS total
FROM quarterly_sales
GROUP BY product_category
ORDER BY total DESC;
```

### Dynamic Pivot (PostgreSQL with crosstab)

```sql
-- Requires tablefunc extension
CREATE EXTENSION IF NOT EXISTS tablefunc;

SELECT * FROM crosstab(
    'SELECT department, month, revenue
     FROM monthly_revenue
     ORDER BY 1, 2',
    'SELECT DISTINCT month FROM monthly_revenue ORDER BY 1'
) AS ct(
    department TEXT,
    "2024-01" NUMERIC,
    "2024-02" NUMERIC,
    "2024-03" NUMERIC
);
```

### Unpivot with LATERAL / UNNEST

```sql
-- PostgreSQL: UNNEST with VALUES
SELECT
    user_id,
    metric_name,
    metric_value
FROM user_scores,
LATERAL (
    VALUES
        ('engagement', engagement_score),
        ('satisfaction', satisfaction_score),
        ('loyalty', loyalty_score)
) AS t(metric_name, metric_value);
```

## Advanced Analytical Patterns

### Gaps and Islands

```sql
-- Find consecutive active days (islands)
WITH numbered AS (
    SELECT
        user_id,
        active_date,
        active_date - (ROW_NUMBER() OVER (
            PARTITION BY user_id ORDER BY active_date
        ) * INTERVAL '1 day') AS grp
    FROM daily_active_users
)
SELECT
    user_id,
    MIN(active_date) AS streak_start,
    MAX(active_date) AS streak_end,
    COUNT(*) AS streak_length
FROM numbered
GROUP BY user_id, grp
HAVING COUNT(*) >= 7  -- Streaks of 7+ days
ORDER BY streak_length DESC;
```

### Running Total with Reset

```sql
-- Cumulative sum that resets each month
SELECT
    order_date,
    revenue,
    SUM(revenue) OVER (
        PARTITION BY DATE_TRUNC('month', order_date)
        ORDER BY order_date
    ) AS mtd_revenue
FROM daily_revenue;
```

### Median Calculation

```sql
-- Exact median using PERCENTILE_CONT
SELECT
    department,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY salary) AS median_salary,
    PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY salary) AS p25_salary,
    PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY salary) AS p75_salary
FROM employees
GROUP BY department;
```

## SQL Style Guide

| Rule | Example |
|------|---------|
| Uppercase keywords | `SELECT`, `FROM`, `WHERE`, `JOIN` |
| Lowercase identifiers | `user_id`, `created_at` |
| One column per line | Each SELECT column on its own line |
| CTEs over subqueries | Named CTEs are easier to debug |
| Explicit JOIN type | `LEFT JOIN`, not just `JOIN` |
| Table aliases | Short but meaningful: `o` for `orders` |
| Comment complex logic | `-- Exclude test accounts` |
| Consistent indentation | 4 spaces, align ON with JOIN |
| Date functions explicitly | `DATE_TRUNC('month', dt)` not implicit |
| Always handle NULLs | `COALESCE`, `NULLIF` where needed |


## Process

1. **Gather information.** Ask the user clarifying questions to understand their specific situation, goals, and constraints
2. **Analyze context.** Review the information provided and identify key factors relevant to sql analytics expert
3. **Develop recommendations.** Apply domain expertise to create actionable guidance tailored to the user's needs
4. **Present structured output.** Deliver findings in the output format below with clear next steps
5. **Address follow-ups.** Answer additional questions and refine recommendations based on feedback


## Output Format

```template
## Sql Analytics Expert Analysis

### Assessment
[Key findings and observations]

### Recommendations
1. [Primary recommendation]
2. [Secondary recommendation]
3. [Additional suggestions]

### Action Items
- [ ] [First action step]
- [ ] [Second action step]
- [ ] [Follow-up task]
```


## Edge Cases

- **Incomplete information:** Ask clarifying questions before proceeding with recommendations
- **Conflicting requirements:** Prioritize the most critical constraint and note trade-offs
- **Out of scope requests:** Redirect to appropriate specialized skill or professional resource
- **Beginner vs advanced:** Adjust depth and terminology based on user's experience level


## Example

**Input:** "Help me with sql analytics expert for my current situation"

**Output:**

Based on your situation, here is a structured approach to sql analytics expert:

1. **Assessment:** Evaluate your current state and identify key areas for improvement
2. **Strategy:** Develop a targeted plan based on best practices
3. **Implementation:** Execute the plan with specific, measurable steps
4. **Review:** Monitor progress and adjust as needed
