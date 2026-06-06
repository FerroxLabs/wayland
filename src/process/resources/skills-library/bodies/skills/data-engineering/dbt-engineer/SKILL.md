---
name: dbt-engineer
description: |
  Deep expertise in dbt (data build tool) covering model design, testing strategies, documentation, materialization selection, custom macros, incremental patterns, package management, CI/CD integration, and performance optimization for building reliable, maintainable transformation layers in modern data stacks.
  Use when the user asks about dbt engineer, dbt engineer best practices, or needs guidance on dbt engineer implementation.
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
  difficulty: "intermediate"
---

# dbt Engineer

You are an expert dbt engineer specializing in building production-grade transformation layers. You design well-structured dbt projects with rigorous testing, comprehensive documentation, and optimized materializations. You apply software engineering best practices to analytics code, ensuring every model is version-controlled, tested, and documented.

## Project Structure

### Recommended Directory Layout

```
dbt_project/
  dbt_project.yml
  packages.yml
  models/
    staging/              # 1:1 with source tables
      _staging__sources.yml
      _staging__models.yml
      stg_salesforce__accounts.sql
      stg_stripe__charges.sql
    intermediate/         # Business logic transforms
      _int__models.yml
      int_opportunities_joined_to_accounts.sql
    marts/                # Final business entities
      finance/
        _finance__models.yml
        fct_monthly_revenue.sql
        dim_subscription.sql
  macros/
    generate_schema_name.sql
    cents_to_dollars.sql
  tests/
    generic/
      test_accepted_range.sql
    singular/
      assert_total_revenue_positive.sql
  seeds/
    country_codes.csv
  snapshots/
    snap_accounts.sql
```

### dbt_project.yml Configuration

```yaml
name: 'company_analytics'
version: '1.0.0'
config-version: 2
profile: 'company_analytics'

models:
  company_analytics:
    staging:
      +materialized: view
      +schema: staging
    intermediate:
      +materialized: ephemeral
    marts:
      +materialized: table
      finance:
        +schema: finance
        +grants:
          select: ['finance_analyst_role']
```

## Materialization Selection

### Decision Matrix

| Criteria | View | Table | Incremental | Ephemeral |
|----------|------|-------|-------------|-----------|
| Source rows < 100K | Best | OK | Overkill | OK |
| Source rows 100K-10M | Slow | Best | Good | Avoid |
| Source rows > 10M | Avoid | OK | Best | Avoid |
| Queried by BI tools | Avoid | Best | Best | N/A |
| Referenced by many models | OK | Best | Best | Good |
| Staging layer | Best | Fallback | Avoid | OK |
| Intermediate layer | OK | Fallback | Avoid | Best |
| Marts layer | Avoid | Best | Best for large | Avoid |

### Incremental Model Patterns

```sql
-- Pattern 1: Append-only with watermark
{{
    config(
        materialized='incremental',
        unique_key='event_id',
        incremental_strategy='merge',
        on_schema_change='append_new_columns'
    )
}}

SELECT event_id, user_id, event_type, occurred_at, _loaded_at
FROM {{ ref('stg_segment__events') }}
{% if is_incremental() %}
WHERE _loaded_at > (SELECT MAX(_loaded_at) FROM {{ this }})
{% endif %}


-- Pattern 2: Late-arriving data with lookback window
{{
    config(
        materialized='incremental',
        unique_key='order_id',
        incremental_strategy='merge'
    )
}}

SELECT order_id, customer_id, order_status, total_amount, updated_at
FROM {{ ref('stg_shopify__orders') }}
{% if is_incremental() %}
WHERE updated_at >= (SELECT DATEADD('day', -3, MAX(updated_at)) FROM {{ this }})
{% endif %}


-- Pattern 3: Insert-overwrite with partitioning
{{
    config(
        materialized='incremental',
        unique_key='surrogate_key',
        incremental_strategy='insert_overwrite',
        partition_by={'field': 'event_date', 'data_type': 'date', 'granularity': 'day'},
        cluster_by=['event_type', 'user_id']
    )
}}

SELECT
    {{ dbt_utils.generate_surrogate_key(['event_id', 'event_date']) }} AS surrogate_key,
    event_id, event_date, event_type, user_id
FROM {{ ref('stg_amplitude__events') }}
{% if is_incremental() %}
WHERE event_date >= _dbt_max_partition
{% endif %}
```

## Testing Strategy

### Schema Tests

```yaml
version: 2
models:
  - name: fct_monthly_revenue
    description: Monthly revenue by subscription and product line
    columns:
      - name: revenue_month
        data_tests:
          - not_null
          - dbt_utils.not_constant
      - name: subscription_id
        data_tests:
          - not_null
          - relationships:
              to: ref('dim_subscription')
              field: subscription_id
      - name: mrr_amount
        data_tests:
          - not_null
          - dbt_utils.accepted_range:
              min_value: 0
              max_value: 1000000
      - name: currency_code
        data_tests:
          - accepted_values:
              values: ['USD', 'EUR', 'GBP', 'CAD', 'AUD']
```

### Custom Generic and Singular Tests

```sql
-- tests/generic/test_row_count_within_range.sql
{% test row_count_within_range(model, min_count, max_count) %}
WITH row_count AS (SELECT COUNT(*) AS cnt FROM {{ model }})
SELECT cnt FROM row_count
WHERE cnt < {{ min_count }} OR cnt > {{ max_count }}
{% endtest %}

-- tests/singular/assert_revenue_reconciles.sql
WITH source_total AS (
    SELECT SUM(amount_cents) / 100.0 AS total
    FROM {{ source('stripe', 'charges') }}
    WHERE status = 'succeeded' AND created >= '2024-01-01'
),
mart_total AS (
    SELECT SUM(charge_amount) AS total
    FROM {{ ref('fct_charges') }} WHERE charge_date >= '2024-01-01'
)
SELECT s.total AS source, m.total AS mart, ABS(s.total - m.total) AS diff
FROM source_total s CROSS JOIN mart_total m
WHERE ABS(s.total - m.total) > 1.00
```

## Custom Macros

```sql
-- macros/generate_schema_name.sql
{% macro generate_schema_name(custom_schema_name, node) %}
    {% set default_schema = target.schema %}
    {% if custom_schema_name is not none and target.name == 'prod' %}
        {{ custom_schema_name | trim }}
    {% else %}
        {{ default_schema }}_{{ custom_schema_name | trim }}
    {% endif %}
{% endmacro %}

-- macros/safe_divide.sql
{% macro safe_divide(numerator, denominator, default_value=0) %}
    CASE WHEN {{ denominator }} = 0 OR {{ denominator }} IS NULL
    THEN {{ default_value }}
    ELSE {{ numerator }}::FLOAT / {{ denominator }} END
{% endmacro %}

-- macros/cents_to_dollars.sql
{% macro cents_to_dollars(column_name, precision=2) %}
    ROUND({{ column_name }}::NUMERIC / 100, {{ precision }})
{% endmacro %}
```

## Documentation and Source Freshness

```yaml
# Source freshness configuration
sources:
  - name: salesforce
    database: raw
    schema: salesforce
    freshness:
      warn_after: {count: 12, period: hour}
      error_after: {count: 24, period: hour}
    loaded_at_field: _fivetran_synced
    tables:
      - name: account
        columns:
          - name: id
            data_tests: [unique, not_null]
      - name: opportunity
        freshness:
          error_after: {count: 6, period: hour}
```

## CI/CD Integration

```yaml
# .github/workflows/dbt-ci.yml
name: dbt CI
on:
  pull_request:
    paths: ['models/**', 'macros/**', 'tests/**', 'dbt_project.yml']

jobs:
  dbt-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: install via pip: dbt-snowflake==1.7.*
      - run: dbt deps
      - run: dbt compile --target ci
      - run: |
          dbt run --select state:modified+ --defer --state ./prod-manifest
          dbt test --select state:modified+ --defer --state ./prod-manifest
      - run: sqlfluff lint models/ --dialect snowflake
```

## Model Contracts

```yaml
# Enforce column types and prevent breaking changes
models:
  - name: fct_orders
    config:
      contract:
        enforced: true
    columns:
      - name: order_id
        data_type: varchar(36)
      - name: customer_id
        data_type: varchar(36)
      - name: order_date
        data_type: date
      - name: total_amount
        data_type: number(12,2)
```

## Performance Optimization Checklist

```
[ ] Profile slow models with EXPLAIN / query plan
[ ] Convert large views to tables or incremental
[ ] Use ephemeral for models only referenced once
[ ] Partition by date column (BigQuery, Snowflake, Databricks)
[ ] Cluster by high-cardinality filter columns
[ ] Push filters early (filter in CTEs, not final SELECT)
[ ] Avoid SELECT * in production models
[ ] Replace correlated subqueries with JOINs
[ ] Use approximate functions for large aggregations
```

## Troubleshooting Guide

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| Data wrong after incremental | Incorrect watermark logic | `dbt run --full-refresh -s model_name` |
| CI "relation does not exist" | Missing defer state | Ensure prod manifest artifact available |
| Compilation error in Jinja | Macro syntax issue | `dbt compile -s model_name` to isolate |
| Source freshness warning | Upstream pipeline delay | Check ingestion tool status |
| Tests pass but BI wrong | Stale cache in BI tool | Refresh BI extract; verify grain |
| Slow incremental run | Too many merge keys | Check unique_key cardinality |
| Schema drift errors | Source changed columns | Update source YAML; use `on_schema_change` |

## When to Use

**Use this skill when:**
- Designing or implementing dbt engineer solutions
- Reviewing or improving existing dbt engineer approaches
- Making architectural or implementation decisions about dbt engineer
- Learning dbt engineer patterns and best practices
- Troubleshooting dbt engineer-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Dbt Engineer Analysis

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

**Input:** "Help me implement dbt engineer for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended dbt engineer approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When dbt engineer must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
