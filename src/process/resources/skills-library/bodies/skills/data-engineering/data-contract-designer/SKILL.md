---
name: data-contract-designer
description: |
  Expertise in designing and enforcing data contracts including schema definitions, API-first data interfaces, versioning strategies, backward and forward compatibility, contract testing, SLA enforcement, data quality assertions, and governance frameworks for reliable producer-consumer data relationships.
  Use when the user asks about data contract designer, data contract designer best practices, or needs guidance on data contract designer implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "data-science sql architecture"
  category: "data-engineering"
  subcategory: "data-modeling"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Data Contract Designer

You are a data contract designer specializing in establishing reliable interfaces between data producers and consumers. You define clear schema contracts, versioning strategies, and enforcement mechanisms that prevent breaking changes, ensure data quality, and enable autonomous team collaboration across the data platform.

## Data Contract Specification

### Contract Definition Format

```yaml
# contracts/sales/orders.contract.yaml
apiVersion: v2.0.0
kind: DataContract
metadata:
  name: sales-orders
  domain: sales
  owner: sales-engineering
  contact: sales-data@company.com
  description: |
    All completed and pending orders from the e-commerce platform.
    Grain: one row per order line item.

schema:
  type: object
  properties:
    order_id:
      type: string
      format: uuid
      required: true
    customer_id:
      type: string
      format: uuid
      required: true
    order_date:
      type: string
      format: date
      required: true
    quantity:
      type: integer
      minimum: 1
      maximum: 10000
      required: true
    unit_price_cents:
      type: integer
      minimum: 0
      required: true
    discount_percent:
      type: number
      minimum: 0.0
      maximum: 100.0
      required: false
      default: 0.0
    order_status:
      type: string
      enum: [pending, confirmed, shipped, delivered, cancelled, returned]
      required: true
    _updated_at:
      type: string
      format: date-time
      required: true

primaryKey: [order_id, line_item_id]

quality:
  assertions:
    - type: uniqueness
      columns: [order_id, line_item_id]
    - type: not_null
      columns: [order_id, customer_id, order_date, order_status]
    - type: freshness
      column: _updated_at
      threshold: "PT6H"
    - type: row_count
      minimum: 1000
    - type: custom_sql
      query: "SELECT COUNT(*) FROM {table} WHERE unit_price_cents < 0"
      threshold: 0
    - type: referential_integrity
      column: customer_id
      references: {contract: customers.contract.yaml, column: customer_id}

sla:
  availability: 99.9%
  freshness: PT6H
  update_frequency: PT15M

versioning:
  strategy: semantic
  current: 2.1.0
  compatibility: backward
```

## Versioning Strategy

### Semantic Versioning for Data

```
MAJOR.MINOR.PATCH

MAJOR (breaking):
  - Column removed or renamed
  - Data type narrowed (BIGINT -> INT)
  - Enum value removed
  - Primary key changed
  - Semantics changed (revenue definition altered)

MINOR (backward-compatible addition):
  - New nullable column added
  - New enum value added
  - Data type widened (INT -> BIGINT)
  - New quality assertion added

PATCH (non-structural):
  - Description updated
  - Quality threshold adjusted
  - SLA updated
```

### Compatibility Matrix

| Change Type | Backward Compatible | Action Required |
|-------------|--------------------|--------------------|
| Add nullable column | Yes | MINOR bump |
| Add required column | No | MAJOR bump + migration |
| Remove column | No | MAJOR bump + deprecation |
| Rename column | No | MAJOR bump |
| Widen type (INT->BIGINT) | Yes | MINOR bump |
| Narrow type (BIGINT->INT) | No | MAJOR bump |
| Add enum value | Yes | MINOR bump |
| Remove enum value | No | MAJOR bump |
| Required -> optional | Yes | MINOR bump |
| Optional -> required | No | MAJOR bump |

### Deprecation Workflow

```
Phase 1: Announce (Week 0)
  - Mark field as deprecated in contract
  - Notify all registered consumers
  - Set removal date (minimum 30 days)

Phase 2: Dual-write (Weeks 1-4)
  - New format available alongside old
  - Track consumer migration progress

Phase 3: Sunset (Week 4+)
  - Verify all consumers migrated via query logs
  - Remove deprecated field, bump MAJOR version
```

## Contract Enforcement

### Backward Compatibility Checker

```python
def check_backward_compatibility(old_contract, new_contract):
    breaking_changes = []
    old_props = old_contract["schema"]["properties"]
    new_props = new_contract["schema"]["properties"]

    for col in old_props:
        if col not in new_props:
            breaking_changes.append(f"Column '{col}' removed")

    for col in old_props:
        if col in new_props:
            old_type = old_props[col].get("type")
            new_type = new_props[col].get("type")
            if old_type != new_type and not is_safe_widening(old_type, new_type):
                breaking_changes.append(f"Column '{col}' type changed: {old_type} -> {new_type}")

    for col in new_props:
        if col not in old_props and new_props[col].get("required", False):
            breaking_changes.append(f"New required column '{col}' added")

    for col in old_props:
        if col in new_props:
            removed_enums = set(old_props[col].get("enum", [])) - set(new_props[col].get("enum", []))
            if removed_enums:
                breaking_changes.append(f"Enum values removed from '{col}': {removed_enums}")

    return breaking_changes

SAFE_WIDENINGS = {("integer", "number")}
def is_safe_widening(old, new):
    return (old, new) in SAFE_WIDENINGS
```

### CI/CD Validation

```yaml
# .github/workflows/contract-validation.yml
name: Data Contract Validation
on:
  pull_request:
    paths: ['contracts/**']

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: install via pip: pyyaml jsonschema
      - run: python scripts/validate_contract_syntax.py contracts/
      - run: |
          python scripts/check_compatibility.py \
            --old contracts/ --new contracts/ \
            --base-ref ${{ github.event.pull_request.base.sha }}
      - run: python scripts/verify_version_bump.py --changed-contracts $(git diff --name-only ${{ github.event.pull_request.base.sha }} -- contracts/)
```

## Consumer Registration

```yaml
# consumers/finance-reporting/orders-dependency.yaml
apiVersion: v1.0.0
kind: ConsumerContract
metadata:
  name: finance-reporting-orders
  consumer: finance-reporting
  owner: finance-analytics

dependency:
  contract: sales/orders.contract.yaml
  minimum_version: "2.0.0"
  maximum_version: "3.0.0"

columns_used:
  - order_id
  - customer_id
  - order_date
  - unit_price_cents
  - quantity

sla_requirements:
  max_latency: PT2H
  availability: 99.5%

usage:
  purpose: "Monthly revenue reporting for SEC filings"
  access_pattern: "Daily batch, full scan of recent 90 days"
```

## Quality Assertions

### Runtime Assertion Engine

```python
from datetime import datetime

class ContractAssertionRunner:
    def __init__(self, spark, contract):
        self.spark = spark
        self.contract = contract

    def run_all(self, table_name):
        assertions = self.contract.get("quality", {}).get("assertions", [])
        results = []
        for a in assertions:
            result = self._run(a, table_name)
            results.append(result)
        return {
            "contract": self.contract["metadata"]["name"],
            "table": table_name,
            "timestamp": datetime.utcnow().isoformat(),
            "passed": all(r["passed"] for r in results),
            "assertions": results
        }

    def _run(self, assertion, table):
        if assertion["type"] == "freshness":
            col = assertion["column"]
            max_val = self.spark.sql(f"SELECT MAX({col}) FROM {table}").collect()[0][0]
            age = datetime.utcnow() - max_val
            threshold = parse_iso_duration(assertion["threshold"])
            return {"type": "freshness", "passed": age <= threshold,
                    "age_seconds": age.total_seconds()}
        elif assertion["type"] == "uniqueness":
            cols = ", ".join(assertion["columns"])
            dups = self.spark.sql(
                f"SELECT COUNT(*) - COUNT(DISTINCT {cols}) FROM {table}"
            ).collect()[0][0]
            return {"type": "uniqueness", "passed": dups == 0, "duplicates": dups}
        elif assertion["type"] == "custom_sql":
            result = self.spark.sql(
                assertion["query"].format(table=table)
            ).collect()[0][0]
            return {"type": "custom_sql", "passed": result <= assertion["threshold"]}
```

## SLA Monitoring

```yaml
alerts:
  - name: orders_freshness_breach
    contract: sales/orders
    sla: freshness
    threshold: PT6H
    check_interval: PT5M
    notification:
      channels: [slack, pagerduty]
      slack_channel: "#data-alerts"
      message: |
        Sales orders data freshness SLA breached.
        Contract: sales/orders v2.1.0
        SLA: 6 hours | Current age: {{ current_age }}
```

## Adoption Checklist

```
Phase 1 - Foundation:
  [ ] Define contract specification format (YAML schema)
  [ ] Build validation tooling (CI/CD)
  [ ] Create contract registry (Git repo or catalog)
  [ ] Document versioning policy
  [ ] Assign owners per domain

Phase 2 - Adoption:
  [ ] Start with 3-5 high-impact datasets
  [ ] Register existing consumers
  [ ] Implement schema validation in ingestion
  [ ] Add freshness and quality checks
  [ ] Establish SLA monitoring dashboards

Phase 3 - Enforcement:
  [ ] Block deployments that break contracts without version bump
  [ ] Automate impact analysis on contract changes
  [ ] Integrate with data catalog for discoverability
  [ ] Regular contract review cadence (quarterly)
```

## When to Use

**Use this skill when:**
- Designing or implementing data contract designer solutions
- Reviewing or improving existing data contract designer approaches
- Making architectural or implementation decisions about data contract designer
- Learning data contract designer patterns and best practices
- Troubleshooting data contract designer-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Data Contract Designer Analysis

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

**Input:** "Help me implement data contract designer for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended data contract designer approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When data contract designer must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
