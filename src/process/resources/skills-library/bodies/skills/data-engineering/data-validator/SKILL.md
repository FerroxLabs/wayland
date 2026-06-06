---
name: data-validator
description: |
  Data validation and quality expertise covering Great Expectations patterns, schema validation, statistical validation, referential integrity checks, data profiling, anomaly detection, data contracts, quality scoring, and automated testing strategies for ensuring data reliability throughout the pipeline.
  Use when the user asks about data validator, data validator best practices, or needs guidance on data validator implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "data-science sql testing"
  category: "data-engineering"
  subcategory: "pipelines-etl"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Data Validator

## Overview

Data quality is the foundation upon which all downstream analytics, ML models, and business decisions depend. This skill covers tools, techniques, and patterns for validating data at every stage of the pipeline.

## Great Expectations Patterns

### Setup and Expectation Suites

```python
import great_expectations as gx

context = gx.get_context()
datasource = context.sources.add_pandas("pandas_datasource")

# Build expectation suite
suite = context.add_expectation_suite("customer_quality_suite")

# Table-level
suite.add_expectation(gx.expectations.ExpectTableRowCountToBeBetween(min_value=10000, max_value=10000000))
suite.add_expectation(gx.expectations.ExpectTableColumnCountToEqual(value=15))

# Column-level: customer_id
suite.add_expectation(gx.expectations.ExpectColumnValuesToNotBeNull(column="customer_id"))
suite.add_expectation(gx.expectations.ExpectColumnValuesToBeUnique(column="customer_id"))
suite.add_expectation(gx.expectations.ExpectColumnValuesToMatchRegex(
    column="customer_id", regex=r"^CUS-[A-Z0-9]{8}$"
))

# Column-level: email (allow 1% non-matching for legacy data)
suite.add_expectation(gx.expectations.ExpectColumnValuesToMatchRegex(
    column="email",
    regex=r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$",
    mostly=0.99
))

# Numeric column: revenue
suite.add_expectation(gx.expectations.ExpectColumnValuesToBeBetween(
    column="lifetime_revenue", min_value=0, max_value=10000000, mostly=0.999
))

# Categorical column
suite.add_expectation(gx.expectations.ExpectColumnValuesToBeInSet(
    column="status", value_set=["active", "inactive", "suspended", "pending"]
))
```

### Running Validations in Pipelines

```python
def validate_data(**context):
    ge_context = gx.get_context()
    checkpoint = ge_context.add_or_update_checkpoint(
        name="customer_checkpoint",
        validations=[{
            "batch_request": {"datasource_name": "warehouse", "data_asset_name": "dim_customer"},
            "expectation_suite_name": "customer_quality_suite",
        }],
        action_list=[
            {"name": "store_validation_result", "action": {"class_name": "StoreValidationResultAction"}},
            {"name": "update_data_docs", "action": {"class_name": "UpdateDataDocsAction"}},
        ]
    )
    result = checkpoint.run()
    if not result.success:
        raise ValueError("Data quality check failed")
```

## Schema Validation

### Schema Contract (YAML)

```yaml
name: dim_customer
version: "2.1"
owner: data-engineering
sla_hours: 6
allow_extra_columns: false
min_rows: 50000

columns:
  - name: customer_id
    type: string
    nullable: false
    unique: true
    pattern: "^CUS-[A-Z0-9]{8}$"
  - name: email
    type: string
    nullable: true
    max_length: 255
  - name: lifetime_revenue
    type: float
    nullable: false
    min_value: 0
  - name: status
    type: string
    nullable: false
    allowed_values: ["active", "inactive", "suspended", "pending"]
```

### Schema Drift Detection

```python
class SchemaDriftDetector:
    def __init__(self, schema_store):
        self.store = schema_store

    def detect_drift(self, table_name: str, current_df) -> dict:
        previous_schema = self.store.get_schema(table_name)
        current_schema = self._extract_schema(current_df)
        if previous_schema is None:
            self.store.save_schema(table_name, current_schema)
            return {'status': 'new_table', 'changes': []}

        changes = []
        prev_cols = {c['name']: c for c in previous_schema['columns']}
        curr_cols = {c['name']: c for c in current_schema['columns']}

        for name in set(curr_cols) - set(prev_cols):
            changes.append({'type': 'column_added', 'column': name})
        for name in set(prev_cols) - set(curr_cols):
            changes.append({'type': 'column_removed', 'column': name})
        for name in set(prev_cols) & set(curr_cols):
            if prev_cols[name]['dtype'] != curr_cols[name]['dtype']:
                changes.append({'type': 'type_changed', 'column': name,
                    'from': prev_cols[name]['dtype'], 'to': curr_cols[name]['dtype']})

        if changes:
            self.store.save_schema(table_name, current_schema)
        return {'status': 'drift_detected' if changes else 'no_change', 'changes': changes}
```

## Statistical Validation

```python
from scipy import stats
import numpy as np

class StatisticalValidator:
    @staticmethod
    def detect_outliers_iqr(series, multiplier=1.5):
        Q1, Q3 = series.quantile(0.25), series.quantile(0.75)
        IQR = Q3 - Q1
        lower, upper = Q1 - multiplier * IQR, Q3 + multiplier * IQR
        outliers = series[(series < lower) | (series > upper)]
        return {'count': len(outliers), 'percentage': len(outliers) / len(series) * 100,
                'lower_bound': lower, 'upper_bound': upper}

    @staticmethod
    def compare_distributions(current, historical, significance=0.05):
        stat, p_value = stats.ks_2samp(current.dropna(), historical.dropna())
        return {'test': 'kolmogorov_smirnov', 'statistic': stat, 'p_value': p_value,
                'significant_drift': p_value < significance}

    @staticmethod
    def validate_proportions(series, expected_proportions):
        observed = series.value_counts(normalize=True).sort_index()
        expected = pd.Series(expected_proportions).sort_index()
        all_cats = sorted(set(observed.index) | set(expected.index))
        observed = observed.reindex(all_cats, fill_value=0)
        expected = expected.reindex(all_cats, fill_value=0)
        stat, p_value = stats.chisquare(observed * len(series), expected * len(series))
        return {'test': 'chi_squared', 'p_value': p_value, 'significant_difference': p_value < 0.05}
```

## Referential Integrity

```python
class ReferentialIntegrityChecker:
    def __init__(self, engine):
        self.engine = engine

    def check_fk(self, child_table, child_col, parent_table, parent_col):
        query = f"""
            SELECT COUNT(*) AS orphan_count
            FROM {child_table} c
            LEFT JOIN {parent_table} p ON c.{child_col} = p.{parent_col}
            WHERE p.{parent_col} IS NULL AND c.{child_col} IS NOT NULL
        """
        result = pd.read_sql(query, self.engine).iloc[0]
        return {'child_table': child_table, 'parent_table': parent_table,
                'orphan_count': int(result['orphan_count']),
                'passed': result['orphan_count'] == 0}
```

## Anomaly Detection

```python
class AnomalyDetector:
    def detect_volume_anomaly(self, current_count, historical_counts, z_threshold=3.0):
        mean, std = np.mean(historical_counts), np.std(historical_counts)
        if std == 0:
            return {'is_anomaly': current_count != mean}
        z_score = (current_count - mean) / std
        return {'is_anomaly': abs(z_score) > z_threshold, 'z_score': z_score,
                'expected_range': (mean - z_threshold * std, mean + z_threshold * std)}

    def detect_freshness_anomaly(self, latest_timestamp, expected_frequency_hours):
        from datetime import datetime, timezone
        age_hours = (datetime.now(timezone.utc) - latest_timestamp).total_seconds() / 3600
        return {'is_stale': age_hours > expected_frequency_hours * 2, 'age_hours': age_hours}
```

## Data Quality Scoring

```python
class DataQualityScorer:
    def __init__(self):
        self.dimensions = {
            'completeness': 0.25, 'uniqueness': 0.15, 'validity': 0.25,
            'consistency': 0.15, 'timeliness': 0.10, 'accuracy': 0.10,
        }

    def score(self, validation_results: dict) -> dict:
        scores = {}
        weighted_total = 0
        for dimension, weight in self.dimensions.items():
            if dimension in validation_results:
                dim_score = validation_results[dimension]
                scores[dimension] = {'score': dim_score, 'weight': weight,
                    'grade': 'A' if dim_score >= 95 else 'B' if dim_score >= 85 else 'C' if dim_score >= 70 else 'D' if dim_score >= 50 else 'F'}
                weighted_total += dim_score * weight
        overall = weighted_total / sum(self.dimensions[d] for d in scores) if scores else 0
        return {'overall_score': round(overall, 2), 'dimensions': scores}
```

## Data Contracts

```yaml
contract:
  name: dim_customer
  version: "3.0"
  owner: data-engineering
  consumers: [analytics, marketing-ml, customer-success]

  schema:
    fields:
      - { name: customer_id, type: string, required: true, unique: true }
      - { name: email, type: string, required: false, pii: true }
      - { name: lifetime_revenue, type: "decimal(12,2)", required: true, min: 0 }

  quality:
    freshness: { max_age_hours: 24, field: updated_at }
    volume: { min_rows: 50000, max_row_change_pct: 20 }
    completeness: { email: 95, phone: 80 }

  sla:
    availability: 99.9
    update_frequency: daily

  breaking_changes:
    notification_days: 14
    channels: [{ slack: "#data-contracts" }]
```

## Automated Testing: dbt Integration

```sql
-- tests/generic/test_revenue_positive.sql
{% test positive_revenue(model, column_name) %}
SELECT * FROM {{ model }} WHERE {{ column_name }} < 0
{% endtest %}

-- tests/singular/assert_revenue_reconciliation.sql
WITH warehouse AS (
    SELECT SUM(net_amount) AS total FROM {{ ref('fct_orders') }}
    WHERE order_date = '{{ var("check_date") }}'
),
source AS (
    SELECT SUM(amount) AS total FROM {{ source('stripe', 'charges') }}
    WHERE DATE(created) = '{{ var("check_date") }}'
)
SELECT * FROM warehouse w CROSS JOIN source s
WHERE ABS(w.total - s.total) / GREATEST(s.total, 1) > 0.01
```

## Validation Decision Framework

| Stage | What to Validate | Failure Action |
|-------|-----------------|----------------|
| Ingestion | Schema, encoding, row count | Reject file, alert source team |
| Staging | Types, nulls, basic ranges | Quarantine records, log to DLQ |
| Transform | Business rules, referential integrity | Block downstream, alert owner |
| Load | Row counts match, no duplicates | Rollback, retry with investigation |
| Serving | Freshness, availability, SLA | Alert consumers, serve stale with warning |

## When to Use

**Use this skill when:**
- Designing or implementing data validator solutions
- Reviewing or improving existing data validator approaches
- Making architectural or implementation decisions about data validator
- Learning data validator patterns and best practices
- Troubleshooting data validator-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Data Validator Analysis

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

**Input:** "Help me implement data validator for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended data validator approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When data validator must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
