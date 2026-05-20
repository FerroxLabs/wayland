---
name: analytics-engineer
description: |
  Analytics engineering expertise covering dbt best practices, metrics layer design, semantic modeling, dashboard design principles, KPI definition, A/B test analysis, cohort analysis, funnel analysis, retention analysis, and SQL style guide for building trusted, well-documented analytical systems.
  Use when the user asks about analytics engineer, analytics engineer best practices, or needs guidance on analytics engineer implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "data-science sql analysis"
  category: "data-engineering"
  subcategory: "pipelines-etl"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Analytics Engineer

## Overview

Analytics engineering sits at the intersection of data engineering and data analysis. It is the discipline of building reliable, tested, documented transformation layers that turn raw data into trusted datasets for analysis and decision-making. The analytics engineer owns the transformation layer and ensures that every metric has a single, verified definition.

## dbt Best Practices

### Model Layering

```
Raw Layer (sources):
  - Defined in YAML, not modified
  - Tested with source freshness checks
  - 1:1 mapping with source tables

Staging Layer (stg_):
  - One model per source table
  - Rename columns to business-friendly names
  - Cast types, standardize formats
  - Light filtering (remove test/internal data)
  - Materialized as views (lightweight)

Intermediate Layer (int_):
  - Business logic, joins, complex transforms
  - Named by entity and action: int_orders_pivoted_to_customers
  - Often ephemeral (inlined into downstream)
  - Break complex transforms into composable steps

Marts Layer (dim_, fct_, rpt_):
  - Final business entities consumed by BI tools
  - Materialized as tables or incremental
  - Heavily tested and documented
  - Organized by business domain (finance/, marketing/, product/)

Metrics Layer:
  - Metric definitions in YAML
  - Single source of truth for KPIs
  - Used by BI tools via metrics API
```

### Naming Conventions

```yaml
# models/staging/stg_stripe__charges.sql
# Pattern: stg_{source}__{entity}

# models/intermediate/int_payments_pivoted_to_orders.sql
# Pattern: int_{entity}_{transformation}

# models/marts/finance/fct_monthly_revenue.sql
# Pattern: {prefix}_{entity}  where prefix = dim (dimension), fct (fact), rpt (report)
```

### Incremental Model Patterns

```sql
-- models/marts/core/fct_events.sql
{{
    config(
        materialized='incremental',
        unique_key='event_id',
        incremental_strategy='merge',
        partition_by={
            'field': 'event_date',
            'data_type': 'date',
            'granularity': 'day'
        },
        cluster_by=['event_type', 'user_id'],
    )
}}

WITH source_events AS (
    SELECT * FROM {{ ref('stg_amplitude__events') }}

    # ... (condensed) ...
    event_properties,
    user_properties,
    platform,
    app_version,
    _loaded_at
FROM deduped
WHERE row_num = 1
```

### Macros for Reusability

```sql
-- macros/cents_to_dollars.sql
{% macro cents_to_dollars(column_name, precision=2) %}
    ROUND({{ column_name }}::NUMERIC / 100, {{ precision }})
{% endmacro %}

-- macros/date_spine.sql
{% macro date_spine(start_date, end_date) %}
    WITH date_spine AS (
        {{ dbt_utils.date_spine(
            datepart="day",
            start_date="'" ~ start_date ~ "'",
            end_date="'" ~ end_date ~ "'"
        ) }}
    )
    SELECT date_day AS dt FROM date_spine
{% endmacro %}

-- macros/customer_segment.sql
# ... (condensed) ...
-- Usage in model:
SELECT
    customer_id,
    lifetime_revenue,
    total_orders,
    {{ customer_segment('lifetime_revenue', 'total_orders') }} AS segment
FROM {{ ref('int_customer_orders_summary') }}
```

## Metrics Layer

### Metric Definitions

```yaml
# models/metrics/revenue_metrics.yml
version: 2

metrics:
  - name: monthly_recurring_revenue
    label: Monthly Recurring Revenue (MRR)
    description: >
      Sum of all active subscription monthly values. Annual subscriptions
      are divided by 12. Excludes one-time charges and credits.
    type: derived
    type_params:
      expr: "mrr_new + mrr_expansion - mrr_contraction - mrr_churn"
      metrics:
        - name: mrr_new
        - name: mrr_expansion
        - name: mrr_contraction
        - name: mrr_churn

  # ... (condensed) ...
    label: Net Revenue Retention (NRR)
    description: >
      Revenue from existing customers this period / revenue from
      same cohort in prior period. >100% means expansion exceeds churn.
    type: derived
    type_params:
      expr: "current_period_revenue / prior_period_revenue * 100"
```

### KPI Definition Framework

Every KPI should have these components documented:

```yaml
kpi:
  name: Customer Acquisition Cost (CAC)
  owner: marketing-analytics
  definition: >
    Total sales and marketing spend in a period divided by the number
    of new customers acquired in that period.
  formula: >
    (SUM(marketing_spend) + SUM(sales_spend)) / COUNT(DISTINCT new_customer_id)
  data_sources:
    - table: fct_marketing_spend
      columns: [spend_amount, spend_date, channel]
    - table: fct_sales_spend
      columns: [spend_amount, spend_date, rep_id]
    - table: dim_customer
      columns: [customer_id, first_purchase_date]
  grain: monthly
  dimensions:
    - channel (organic, paid_search, social, referral)
    - region (us, eu, apac)
    - segment (enterprise, mid_market, smb)
  targets:
    - period: Q1 2024
      target: 150.00
      currency: USD
  caveats:
    - Excludes free trial users who never converted
    - Marketing spend is allocated by attribution model (last-touch)
    - Seasonal variations expected in Q4 (holiday spend)
```

## Dashboard Design Principles

### Layout Hierarchy

```
Level 1: Executive Summary (top of dashboard)
  - 3-5 KPIs with sparklines showing trend
  - Red/yellow/green indicators against targets
  - Time period selector

Level 2: Trend Analysis (middle)
  - Time series charts for key metrics
  - Comparison overlays (this period vs prior period)
  - Annotations for significant events

Level 3: Dimensional Breakdown (bottom)
  - Bar/column charts by segment
  - Tables with sortable columns
  - Drill-down capability to detail
```

### Chart Selection Guide

| Data Pattern | Chart Type | When to Use |
|-------------|------------|-------------|
| Trend over time | Line chart | Continuous metrics over sequential time |
| Comparison | Bar chart (horizontal) | Comparing categories |
| Composition | Stacked bar | Part-to-whole over categories |
| Distribution | Histogram / box plot | Understanding data spread |
| Relationship | Scatter plot | Correlation between two measures |
| Part-to-whole (static) | Donut / treemap | Showing proportions at one point in time |
| Geographic | Choropleth map | Regional variation |
| Progress to goal | Bullet chart / gauge | KPI vs target |
| Funnel | Funnel chart | Sequential step conversion |

### Design Anti-Patterns

1. **3D charts**: Distort perception; always use 2D
2. **Dual axes**: Misleading scale comparisons; use two separate charts
3. **Pie charts with >5 slices**: Unreadable; use horizontal bar
4. **Truncated Y-axis**: Exaggerates differences; always start at 0 for bar charts
5. **Red/green only**: ~8% of males are color-blind; use shapes/patterns too
6. **Too many metrics**: >10 metrics on one dashboard causes cognitive overload

## A/B Test Analysis

```sql
-- A/B test analysis framework

-- Step 1: Define experiment population
WITH experiment_users AS (
    SELECT
        user_id,
        variant,           -- 'control' or 'treatment'
        assignment_date
    FROM experiment_assignments
    WHERE experiment_id = 'pricing_page_v2'
      AND assignment_date BETWEEN '2024-06-01' AND '2024-06-30'
),

-- Step 2: Compute primary metric per user
user_metrics AS (
    SELECT
        eu.user_id,
        eu.variant,
        # ... (condensed) ...

SELECT * FROM variant_summary;

-- Step 4: Statistical significance (computed in Python)
-- For proportions (conversion rate): use chi-squared or z-test
-- For continuous metrics (revenue): use t-test or Mann-Whitney U
-- Always check: sample size sufficient? AA test validates randomization?
```

```python
from scipy import stats
import numpy as np

def ab_test_significance(control_data, treatment_data, metric_type='continuous'):
    """
    Calculate statistical significance of A/B test.

    metric_type: 'continuous' for revenue, 'binary' for conversion
    """
    if metric_type == 'continuous':
        # Welch's t-test (does not assume equal variance)
        t_stat, p_value = stats.ttest_ind(
            control_data, treatment_data, equal_var=False
        )
        effect_size = (treatment_data.mean() - control_data.mean()) / control_data.std()

    elif metric_type == 'binary':
        # Z-test for proportions
        # ... (condensed) ...
        'effect_size': effect_size,
        'confidence_level': 0.95,
        'control_mean': control_data.mean(),
        'treatment_mean': treatment_data.mean(),
        'relative_lift': (treatment_data.mean() - control_data.mean()) / control_data.mean() * 100,
        'sample_size': {'control': len(control_data), 'treatment': len(treatment_data)},
    }
```

## Cohort Analysis

```sql
-- Monthly retention cohort analysis
WITH user_cohorts AS (
    SELECT
        user_id,
        DATE_TRUNC('month', first_purchase_date) AS cohort_month
    FROM dim_customer
),

user_activity AS (
    SELECT
        o.user_id,
        DATE_TRUNC('month', o.order_date) AS activity_month
    FROM fct_orders o
),

cohort_retention AS (
    SELECT
        c.cohort_month,
        # ... (condensed) ...
    cr.months_since_signup,
    cr.active_users,
    ROUND(cr.active_users::NUMERIC / cs.cohort_size * 100, 1) AS retention_pct
FROM cohort_retention cr
JOIN cohort_sizes cs ON cr.cohort_month = cs.cohort_month
WHERE cr.months_since_signup BETWEEN 0 AND 12
ORDER BY cr.cohort_month, cr.months_since_signup;
```

## Funnel Analysis

```sql
-- Conversion funnel: signup -> activation -> first purchase -> repeat purchase
WITH funnel AS (
    SELECT
        u.user_id,
        u.signup_date,
        u.signup_channel,
        1 AS step_1_signup,
        CASE WHEN u.activation_date IS NOT NULL THEN 1 ELSE 0 END AS step_2_activated,
        CASE WHEN fp.first_purchase_date IS NOT NULL THEN 1 ELSE 0 END AS step_3_purchased,
        CASE WHEN rp.second_purchase_date IS NOT NULL THEN 1 ELSE 0 END AS step_4_repeat
    FROM dim_user u
    LEFT JOIN (
        SELECT user_id, MIN(order_date) AS first_purchase_date
        FROM fct_orders GROUP BY 1
    ) fp ON u.user_id = fp.user_id
    LEFT JOIN (
        SELECT user_id, MIN(order_date) AS second_purchase_date
        FROM (
            # ... (condensed) ...
    SUM(step_3_purchased) AS purchased,
    ROUND(SUM(step_3_purchased)::NUMERIC / SUM(step_2_activated) * 100, 1) AS purchase_rate,
    SUM(step_4_repeat) AS repeat_purchasers,
    ROUND(SUM(step_4_repeat)::NUMERIC / NULLIF(SUM(step_3_purchased), 0) * 100, 1) AS repeat_rate
FROM funnel
GROUP BY 1
ORDER BY signups DESC;
```

## Retention Analysis

```sql
-- Dollar-based Net Revenue Retention
WITH monthly_cohort_revenue AS (
    SELECT
        c.cohort_month,
        DATE_TRUNC('month', o.order_date) AS revenue_month,
        DATEDIFF('month', c.cohort_month, DATE_TRUNC('month', o.order_date)) AS month_number,
        SUM(o.net_amount) AS revenue
    FROM (
        SELECT user_id, DATE_TRUNC('month', MIN(order_date)) AS cohort_month
        FROM fct_orders GROUP BY 1
    ) c
    JOIN fct_orders o ON c.user_id = o.user_id
    GROUP BY 1, 2, 3
)

SELECT
    cohort_month,
    month_number,
    revenue,
    FIRST_VALUE(revenue) OVER (PARTITION BY cohort_month ORDER BY month_number) AS month_0_revenue,
    ROUND(revenue / FIRST_VALUE(revenue) OVER (
        PARTITION BY cohort_month ORDER BY month_number
    ) * 100, 1) AS revenue_retention_pct
FROM monthly_cohort_revenue
WHERE month_number <= 12
ORDER BY cohort_month, month_number;
```

## SQL Style Guide

```sql
-- FORMATTING RULES:
-- 1. Keywords in UPPERCASE
-- 2. One clause per line (SELECT, FROM, WHERE, GROUP BY, etc.)
-- 3. Indentation: 4 spaces
-- 4. Comma-leading style (easier to comment out columns)
-- 5. CTEs named with meaningful names (not cte1, cte2)
-- 6. Table aliases: full words, not single letters (orders, not o)
-- 7. Explicit JOIN type (INNER JOIN, LEFT JOIN - never implicit joins)
-- 8. Column aliases with AS keyword

-- EXAMPLE:
WITH monthly_orders AS (
    SELECT
        customer_id
        ,DATE_TRUNC('month', order_date) AS order_month
        ,COUNT(DISTINCT order_id) AS order_count
        ,SUM(net_amount) AS total_revenue
        ,AVG(net_amount) AS avg_order_value
    # ... (condensed) ...
    ,AVG(orders.avg_order_value) AS avg_order_value
FROM monthly_orders AS orders
INNER JOIN customer_segments AS segments
    ON orders.customer_id = segments.customer_id
GROUP BY 1, 2
HAVING SUM(orders.total_revenue) > 0
ORDER BY 1, 2
```

## Decision Framework for Analytics Engineers

1. **Where does the logic live?** -> dbt models, not BI tool calculated fields
2. **How is it tested?** -> dbt tests (generic + singular) on every model
3. **Is the metric defined once?** -> Metrics layer, referenced everywhere
4. **Can a stakeholder find the definition?** -> dbt docs, data dictionary
5. **Is the pipeline observable?** -> dbt run results, freshness checks, alerts
6. **Can it be reproduced?** -> Version-controlled SQL, deterministic transforms

## When to Use

**Use this skill when:**
- Designing or implementing analytics engineer solutions
- Reviewing or improving existing analytics engineer approaches
- Making architectural or implementation decisions about analytics engineer
- Learning analytics engineer patterns and best practices
- Troubleshooting analytics engineer-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Analytics Engineer Analysis

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

**Input:** "Help me implement analytics engineer for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended analytics engineer approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When analytics engineer must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
