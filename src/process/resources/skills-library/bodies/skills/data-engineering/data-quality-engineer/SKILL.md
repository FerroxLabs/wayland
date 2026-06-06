---
name: data-quality-engineer
description: |
  Data quality engineering covering Great Expectations suite design, data contracts between teams, schema validation at ingestion, statistical anomaly detection, automated data profiling, quality scoring frameworks, SLA monitoring, freshness checks, and remediation workflows for maintaining trustworthy data across the organization.
  Use when the user asks about data quality engineer, data quality engineer best practices, or needs guidance on data quality engineer implementation.
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

# Data Quality Engineer

## Overview

Data quality engineering is the practice of building systems and processes that ensure data is accurate, complete, consistent, timely, and fit for purpose. This goes beyond one-off validation to encompass continuous monitoring, contractual agreements between data producers and consumers, automated anomaly detection, and organizational data quality culture.

## Data Quality Dimensions

```
Dimension        Measure                           Example Check
---------------------------------------------------------------------------
Accuracy         Values match real-world truth      Address geocodes within bounds
Completeness     Required fields are populated      customer_email NOT NULL rate > 99%
Consistency      Same facts agree across systems    CRM revenue = billing revenue
Timeliness       Data arrives within SLA            Daily feed lands by 06:00 UTC
Uniqueness       No unwanted duplicates             order_id is unique per day
Validity         Values conform to rules            status IN ('active','inactive')
Freshness        Data is recent enough              max(updated_at) < 2 hours ago
Integrity        Referential relationships hold     Every order.customer_id exists
```

## Great Expectations: Production Patterns

### Multi-Layer Validation Architecture

```python
import great_expectations as gx

context = gx.get_context()

# Layer 1: Landing zone (raw data checks)
landing_suite = context.add_expectation_suite("orders_landing")
landing_suite.add_expectation(
    gx.expectations.ExpectTableRowCountToBeGreaterThan(value=0)
)
landing_suite.add_expectation(
    gx.expectations.ExpectColumnValuesToNotBeNull(column="order_id")
)
landing_suite.add_expectation(
    gx.expectations.ExpectColumnValuesToMatchRegex(
        column="order_id", regex=r"^ORD-\d{10}$"
    )
)

# Layer 2: Staging (business rule checks)
staging_suite = context.add_expectation_suite("orders_staging")
staging_suite.add_expectation(
    gx.expectations.ExpectColumnValuesToBeBetween(
        column="total_amount", min_value=0.01, max_value=999999.99
    )
)
staging_suite.add_expectation(
    gx.expectations.ExpectColumnPairValuesAToBeGreaterThanB(
        column_A="total_amount", column_B="discount_amount", or_equal=True
    )
)
staging_suite.add_expectation(
    gx.expectations.ExpectCompoundColumnsToBeUnique(
        column_list=["order_id", "line_item_number"]
    )
)

# Layer 3: Analytics (statistical checks)
analytics_suite = context.add_expectation_suite("orders_analytics")
analytics_suite.add_expectation(
    gx.expectations.ExpectColumnMeanToBeBetween(
        column="total_amount", min_value=25.0, max_value=500.0
    )
)
analytics_suite.add_expectation(
    gx.expectations.ExpectColumnMedianToBeBetween(
        column="total_amount", min_value=15.0, max_value=200.0
    )
)
analytics_suite.add_expectation(
    gx.expectations.ExpectTableRowCountToBeBetween(
        min_value={"$PARAMETER": "previous_count * 0.8"},
        max_value={"$PARAMETER": "previous_count * 1.5"}
    )
)
```

### Custom Expectations

```python
from great_expectations.expectations import ExpectColumnValuesToMatchCondition

class ExpectRevenueWithinSeasonalBounds(gx.expectations.BatchExpectation):
    """Revenue should be within 3 standard deviations of seasonal average."""

    metric_dependencies = ("column.custom_aggregate",)
    success_keys = ("column", "seasonal_mean", "seasonal_std", "sigma")

    def _validate(self, metrics, runtime_configuration, execution_engine):
        column_mean = metrics["column.mean"]
        seasonal_mean = self.configuration["kwargs"]["seasonal_mean"]
        seasonal_std = self.configuration["kwargs"]["seasonal_std"]
        sigma = self.configuration["kwargs"].get("sigma", 3)

        lower = seasonal_mean - (sigma * seasonal_std)
        upper = seasonal_mean + (sigma * seasonal_std)

        return {
            "success": lower <= column_mean <= upper,
            "result": {
                "observed_value": column_mean,
                "expected_range": [lower, upper],
            }
        }
```

## Data Contracts

### Contract Specification

```yaml
# data-contract: orders-v2.yaml
apiVersion: datacontract/v1.0
kind: DataContract

metadata:
  name: orders-daily
  version: 2.1.0
  owner: commerce-team
  consumers:
    - analytics-team
    - finance-team
    - ml-team

schema:
  type: avro
  fields:
    - name: order_id
      type: string
      required: true
      pattern: "^ORD-\\d{10}$"
      description: Unique order identifier
    - name: customer_id
      type: string
      required: true
      pii: true
    - name: total_amount
      type: decimal
      precision: 10
      scale: 2
      required: true
      constraints:
        min: 0.01
        max: 999999.99
    - name: status
      type: string
      required: true
      enum: [pending, confirmed, shipped, delivered, cancelled, refunded]
    - name: created_at
      type: timestamp
      required: true
      timezone: UTC

sla:
  freshness: 1 hour
  completeness: 99.5%
  availability: 99.9%
  delivery_time: "06:00 UTC daily"
  row_count_range: [10000, 5000000]

quality_rules:
  - name: no_future_orders
    rule: "created_at <= current_timestamp()"
    severity: critical
  - name: amount_consistency
    rule: "total_amount = subtotal + tax - discount"
    severity: critical
  - name: valid_email
    rule: "customer_email LIKE '%@%.%'"
    severity: warning
    threshold: 0.99

breaking_changes:
  notification: 30 days
  channels: [email, slack]
  approval_required: true

on_violation:
  critical: block_pipeline
  warning: alert_and_continue
  info: log_only
```

### Contract Enforcement in Pipeline

```python
class DataContractValidator:
    def __init__(self, contract_path: str):
        self.contract = load_contract(contract_path)

    def validate(self, df) -> ContractResult:
        results = []

        # Schema validation
        results.append(self._validate_schema(df))

        # Quality rules
        for rule in self.contract['quality_rules']:
            results.append(self._validate_rule(df, rule))

        # SLA checks
        results.append(self._validate_freshness(df))
        results.append(self._validate_completeness(df))
        results.append(self._validate_row_count(df))

        violations = [r for r in results if not r.passed]
        critical = [v for v in violations if v.severity == 'critical']

        if critical:
            self._block_pipeline(critical)
            raise ContractViolationError(critical)

        if violations:
            self._send_alerts(violations)

        return ContractResult(passed=len(critical) == 0, violations=violations)

    def _validate_freshness(self, df):
        max_timestamp = df.agg({"created_at": "max"}).collect()[0][0]
        age = datetime.utcnow() - max_timestamp
        sla_hours = parse_duration(self.contract['sla']['freshness'])
        return CheckResult(
            name="freshness",
            passed=age <= sla_hours,
            observed=str(age),
            expected=f"<= {sla_hours}"
        )
```

## Anomaly Detection

### Statistical Anomaly Detection

```python
import numpy as np
from scipy import stats

class DataAnomalyDetector:
    def __init__(self, history_days=90, sensitivity=3.0):
        self.history_days = history_days
        self.sensitivity = sensitivity

    def detect_volume_anomaly(self, current_count, historical_counts):
        """Z-score based volume anomaly detection."""
        mean = np.mean(historical_counts)
        std = np.std(historical_counts)
        if std == 0:
            return False, 0.0

        z_score = (current_count - mean) / std
        is_anomaly = abs(z_score) > self.sensitivity
        return is_anomaly, z_score

    def detect_distribution_shift(self, current_values, historical_values):
        """Kolmogorov-Smirnov test for distribution changes."""
        statistic, p_value = stats.ks_2samp(current_values, historical_values)
        is_anomaly = p_value < 0.01  # 1% significance level
        return is_anomaly, {"statistic": statistic, "p_value": p_value}

    def detect_null_rate_anomaly(self, column_name, current_null_pct, historical_null_pcts):
        """Alert when null rate deviates from historical pattern."""
        mean_null = np.mean(historical_null_pcts)
        std_null = np.std(historical_null_pcts)

        if std_null == 0:
            is_anomaly = current_null_pct != mean_null
        else:
            z = (current_null_pct - mean_null) / std_null
            is_anomaly = abs(z) > self.sensitivity

        return is_anomaly, {
            "column": column_name,
            "current": current_null_pct,
            "expected": mean_null,
        }

    def detect_cardinality_anomaly(self, current_unique, historical_uniques):
        """Detect sudden changes in column cardinality."""
        median_unique = np.median(historical_uniques)
        mad = np.median(np.abs(historical_uniques - median_unique))
        if mad == 0:
            mad = 1.0

        modified_z = 0.6745 * (current_unique - median_unique) / mad
        is_anomaly = abs(modified_z) > self.sensitivity
        return is_anomaly, modified_z
```

## Data Profiling

### Automated Profiling Pipeline

```python
from dataclasses import dataclass
from typing import Dict, List

@dataclass
class ColumnProfile:
    name: str
    dtype: str
    count: int
    null_count: int
    null_pct: float
    unique_count: int
    unique_pct: float
    min_value: any
    max_value: any
    mean: float = None
    median: float = None
    std: float = None
    p5: float = None
    p95: float = None
    top_values: List[tuple] = None
    pattern_matches: Dict[str, float] = None

class DataProfiler:
    def profile_dataframe(self, df) -> Dict[str, ColumnProfile]:
        profiles = {}
        for col in df.columns:
            profiles[col] = self._profile_column(df, col)
        return profiles

    def _profile_column(self, df, col_name):
        col = df[col_name]
        profile = ColumnProfile(
            name=col_name,
            dtype=str(col.dtype),
            count=len(col),
            null_count=col.isnull().sum(),
            null_pct=col.isnull().mean() * 100,
            unique_count=col.nunique(),
            unique_pct=col.nunique() / len(col) * 100 if len(col) > 0 else 0,
            min_value=col.min() if not col.isnull().all() else None,
            max_value=col.max() if not col.isnull().all() else None,
        )

        if col.dtype in ['int64', 'float64']:
            profile.mean = col.mean()
            profile.median = col.median()
            profile.std = col.std()
            profile.p5 = col.quantile(0.05)
            profile.p95 = col.quantile(0.95)

        if col.dtype == 'object':
            profile.top_values = col.value_counts().head(10).to_dict()
            profile.pattern_matches = self._detect_patterns(col)

        return profile

    def _detect_patterns(self, col):
        patterns = {
            'email': r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
            'phone': r'^\+?[\d\s\-\(\)]{7,15}$',
            'uuid': r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
            'date_iso': r'^\d{4}-\d{2}-\d{2}$',
            'url': r'^https?://[^\s]+$',
        }
        results = {}
        non_null = col.dropna()
        for name, pattern in patterns.items():
            match_pct = non_null.str.match(pattern).mean() * 100
            if match_pct > 50:
                results[name] = match_pct
        return results

    def compare_profiles(self, profile_a, profile_b) -> List[str]:
        """Compare two profiles and report significant differences."""
        alerts = []
        for col_name in profile_a:
            if col_name not in profile_b:
                alerts.append(f"Column '{col_name}' missing in new data")
                continue
            a, b = profile_a[col_name], profile_b[col_name]
            if abs(a.null_pct - b.null_pct) > 5:
                alerts.append(f"'{col_name}' null rate changed: {a.null_pct:.1f}% -> {b.null_pct:.1f}%")
            if a.unique_pct > 90 and b.unique_pct < 50:
                alerts.append(f"'{col_name}' cardinality dropped: {a.unique_pct:.0f}% -> {b.unique_pct:.0f}%")
        return alerts
```

## Quality Scoring Framework

```python
class DataQualityScorer:
    """Compute a 0-100 quality score for a dataset."""

    DIMENSION_WEIGHTS = {
        'completeness': 0.25,
        'validity': 0.25,
        'consistency': 0.20,
        'uniqueness': 0.15,
        'timeliness': 0.15,
    }

    def score(self, df, rules) -> QualityReport:
        scores = {}
        scores['completeness'] = self._score_completeness(df, rules)
        scores['validity'] = self._score_validity(df, rules)
        scores['consistency'] = self._score_consistency(df, rules)
        scores['uniqueness'] = self._score_uniqueness(df, rules)
        scores['timeliness'] = self._score_timeliness(df, rules)

        overall = sum(
            scores[dim] * self.DIMENSION_WEIGHTS[dim]
            for dim in scores
        )

        return QualityReport(
            overall_score=round(overall, 1),
            dimension_scores=scores,
            grade=self._grade(overall),
            timestamp=datetime.utcnow()
        )

    @staticmethod
    def _grade(score):
        if score >= 95: return 'A'
        if score >= 85: return 'B'
        if score >= 70: return 'C'
        if score >= 50: return 'D'
        return 'F'
```

## Data Quality Remediation Workflow

```
Detection -> Classification -> Investigation -> Remediation -> Prevention

1. DETECTION
   - Automated checks catch anomaly
   - Quality score drops below threshold

2. CLASSIFICATION
   - Severity: Critical / High / Medium / Low
   - Impact: Which downstream consumers affected?
   - Root cause category: Source / Pipeline / Schema / Infrastructure

3. INVESTIGATION
   - Compare against historical profile
   - Check upstream source systems
   - Review recent pipeline changes
   - Examine specific failing records

4. REMEDIATION
   - Quarantine bad data (move to quarantine table)
   - Apply fix (backfill, correction, re-run)
   - Validate fix against expectations
   - Release corrected data to consumers

5. PREVENTION
   - Add new expectation to catch this class of issue
   - Update data contract if source behavior changed
   - Add monitoring for early detection
   - Document in runbook
```

## Checklist: Data Quality Program Setup

```
[ ] Define quality dimensions and KPIs per dataset
[ ] Implement Great Expectations or equivalent at each pipeline layer
[ ] Establish data contracts between producer and consumer teams
[ ] Build automated profiling for all critical datasets
[ ] Set up anomaly detection on volume, nulls, distributions
[ ] Create quality scoring dashboard with trend tracking
[ ] Define SLAs for freshness, completeness, availability
[ ] Build alerting for SLA breaches and critical violations
[ ] Document remediation runbooks for common failure modes
[ ] Schedule quarterly data quality reviews with stakeholders
[ ] Track quality score trends and set improvement targets
```

## When to Use

**Use this skill when:**
- Designing or implementing data quality engineer solutions
- Reviewing or improving existing data quality engineer approaches
- Making architectural or implementation decisions about data quality engineer
- Learning data quality engineer patterns and best practices
- Troubleshooting data quality engineer-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Data Quality Engineer Analysis

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

**Input:** "Help me implement data quality engineer for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended data quality engineer approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When data quality engineer must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
