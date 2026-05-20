---
name: data-catalog-builder
description: |
  Data catalog and metadata management covering catalog architecture, DataHub and Amundsen setup, automated metadata ingestion, data lineage tracking, data discovery UX, classification and tagging, data governance integration, business glossaries, ownership models, and search optimization for enterprise data discoverability.
  Use when the user asks about data catalog builder, data catalog builder best practices, or needs guidance on data catalog builder implementation.
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

# Data Catalog Builder

## Overview

A data catalog is the organized inventory of data assets in an organization, making data discoverable, understandable, and trustworthy. This skill covers building and operating data catalogs that serve as the single source of truth for metadata, lineage, ownership, and data governance across the enterprise.

## Catalog Architecture

```
                    +-------------------+
                    |   Search & UI     |
                    |   (Discovery)     |
                    +--------+----------+
                             |
                    +--------v----------+
                    |  Metadata Store   |
                    |  (Graph DB / ES)  |
                    +--------+----------+
                             |
          +------------------+------------------+
          |                  |                  |
  +-------v------+  +-------v------+  +--------v-----+
  | Ingestion    |  | Lineage      |  | Governance   |
  | Connectors   |  | Tracker      |  | Engine       |
  +-------+------+  +-------+------+  +--------+-----+
          |                  |                  |
  +-------v------+  +-------v------+  +--------v-----+
  | Data Sources |  | Orchestrators|  | Policies     |
  | (DBs, Lakes, |  | (Airflow,    |  | (Access,     |
  |  APIs, Files)|  |  Spark, dbt) |  |  PII, Class.)|
  +--------------+  +--------------+  +--------------+
```

## DataHub Implementation

### Configuration and Ingestion

```yaml
# datahub-ingestion-recipe.yaml
source:
  type: postgres
  config:
    host_port: "warehouse.company.com:5432"
    database: analytics
    username: "${DATAHUB_PG_USER}"
    password: "${DATAHUB_PG_PASSWORD}"
    include_tables: true
    include_views: true
    schema_pattern:
      allow:
        - "analytics.*"
        - "staging.*"
      deny:
        - ".*_tmp$"
        - ".*_backup$"
    profiling:
      enabled: true
      profile_table_level_only: false
      max_number_of_fields_to_profile: 50
      profile_table_row_count_estimate_only: false
    classification:
      enabled: true
      classifiers:
        - type: datahub
          config:
            pii_detection: true
            info_types_config:
              - EMAIL_ADDRESS
              - PHONE_NUMBER
              - CREDIT_CARD_NUMBER
              - US_SSN

sink:
  type: datahub-rest
  config:
    server: "[reference URL]"
    token: "${DATAHUB_TOKEN}"
```

### Programmatic Metadata Emission

```python
from datahub.emitter.mce_builder import make_dataset_urn
from datahub.emitter.rest_emitter import DatahubRestEmitter
from datahub.metadata.schema_classes import (
    DatasetPropertiesClass,
    OwnershipClass,
    OwnerClass,
    OwnershipTypeClass,
    TagAssociationClass,
    GlossaryTermAssociationClass,
    InstitutionalMemoryClass,
    InstitutionalMemoryMetadataClass,
)
from datahub.metadata.com.linkedin.pegasus2avro.mxe import MetadataChangeEvent

emitter = DatahubRestEmitter("[reference URL]")

dataset_urn = make_dataset_urn(platform="snowflake", name="analytics.orders")

# Set dataset properties
properties = DatasetPropertiesClass(
    name="Orders",
    description="Customer orders with line items and payment details",
    customProperties={
        "data_tier": "gold",
        "refresh_frequency": "hourly",
        "sla_freshness": "2 hours",
        "row_count_estimate": "50M",
        "pii_classification": "contains_pii",
    },
    qualifiedName="snowflake.prod.analytics.orders",
)

# Set ownership
ownership = OwnershipClass(
    owners=[
        OwnerClass(
            owner="urn:li:corpuser:alice@company.com",
            type=OwnershipTypeClass.DATA_STEWARD,
        ),
        OwnerClass(
            owner="urn:li:corpGroup:commerce-team",
            type=OwnershipTypeClass.TECHNICAL_OWNER,
        ),
    ]
)

# Emit metadata
emitter.emit_mce(MetadataChangeEvent(
    proposedSnapshot=DatasetSnapshotClass(
        urn=dataset_urn,
        aspects=[properties, ownership],
    )
))
```

### Lineage Emission

```python
from datahub.emitter.mce_builder import make_dataset_urn
from datahub.metadata.schema_classes import (
    UpstreamClass,
    UpstreamLineageClass,
    DatasetLineageTypeClass,
)

# Define lineage: orders_analytics depends on raw_orders + customers
lineage = UpstreamLineageClass(
    upstreams=[
        UpstreamClass(
            dataset=make_dataset_urn("postgres", "raw.orders"),
            type=DatasetLineageTypeClass.TRANSFORMED,
        ),
        UpstreamClass(
            dataset=make_dataset_urn("postgres", "raw.customers"),
            type=DatasetLineageTypeClass.TRANSFORMED,
        ),
    ]
)

emitter.emit_mce(MetadataChangeEvent(
    proposedSnapshot=DatasetSnapshotClass(
        urn=make_dataset_urn("snowflake", "analytics.order_metrics"),
        aspects=[lineage],
    )
))
```

## Data Lineage Tracking

### Automated Lineage from SQL Parsing

```python
from sqllineage.runner import LineageRunner

def extract_lineage_from_sql(sql: str) -> dict:
    """Parse SQL to extract table-level lineage."""
    runner = LineageRunner(sql)

    return {
        "source_tables": [str(t) for t in runner.source_tables()],
        "target_tables": [str(t) for t in runner.target_tables()],
        "columns": {
            str(col): [str(src) for src in runner.get_column_lineage()]
            for col in runner.target_tables()
        }
    }

# Example
sql = """
INSERT INTO analytics.order_summary
SELECT
    o.region,
    c.segment,
    SUM(o.amount) as total_revenue,
    COUNT(DISTINCT o.customer_id) as customer_count
FROM raw.orders o
JOIN raw.customers c ON o.customer_id = c.id
WHERE o.status = 'completed'
GROUP BY o.region, c.segment
"""

lineage = extract_lineage_from_sql(sql)
# {'source_tables': ['raw.orders', 'raw.customers'],
#  'target_tables': ['analytics.order_summary']}
```

### dbt Lineage Integration

```yaml
# dbt_project integration with DataHub
# profiles.yml includes DataHub emission

# models/marts/order_metrics.sql
# Lineage is automatically captured from ref() and source()
{{
  config(
    materialized='incremental',
    unique_key='order_date || region',
    meta={
      'owner': 'analytics-team',
      'tier': 'gold',
      'contains_pii': false,
    }
  )
}}

SELECT
    DATE_TRUNC('day', o.created_at) as order_date,
    o.region,
    COUNT(*) as order_count,
    SUM(o.total_amount) as revenue
FROM {{ ref('stg_orders') }} o
WHERE o.status != 'cancelled'
{% if is_incremental() %}
  AND o.created_at > (SELECT MAX(order_date) FROM {{ this }})
{% endif %}
GROUP BY 1, 2
```

## Business Glossary

### Glossary Structure

```yaml
# business-glossary.yaml
glossary:
  - term: "Customer"
    definition: >
      An individual or organization that has completed at least one
      purchase. Prospects and leads are not customers until first purchase.
    owner: commerce-team
    related_terms: [Account, Buyer, Client]
    authoritative_source: "analytics.dim_customers"
    aliases: [buyer, purchaser, client]

  - term: "Revenue"
    definition: >
      Net amount received from completed orders after discounts, returns,
      and refunds. Excludes taxes, shipping, and pending orders.
    owner: finance-team
    calculation: "SUM(order_total) - SUM(refunds) - SUM(discounts)"
    related_terms: [GMV, Net Revenue, ARR]
    authoritative_source: "analytics.fact_revenue"
    important_notes:
      - "Differs from GMV which includes cancelled orders"
      - "Does not include subscription revenue (see ARR)"

  - term: "Active User"
    definition: >
      A user who has performed at least one qualifying action within
      the measurement period. Qualifying actions: login, purchase,
      API call, or dashboard view. Bot traffic is excluded.
    owner: product-team
    variants:
      DAU: "Active within last 24 hours"
      WAU: "Active within last 7 days"
      MAU: "Active within last 30 days"
    authoritative_source: "analytics.user_activity"
```

## Data Classification and Tagging

### Classification Framework

```python
class DataClassifier:
    """Automated data classification for catalog enrichment."""

    CLASSIFICATION_RULES = {
        'pii_email': {
            'pattern': r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
            'tag': 'pii:email',
            'governance': 'restricted',
            'match_threshold': 0.7,
        },
        'pii_phone': {
            'pattern': r'^\+?[\d\s\-\(\)]{7,15}$',
            'tag': 'pii:phone',
            'governance': 'restricted',
            'match_threshold': 0.6,
        },
        'pii_ssn': {
            'pattern': r'^\d{3}-\d{2}-\d{4}$',
            'tag': 'pii:ssn',
            'governance': 'highly_restricted',
            'match_threshold': 0.5,
        },
        'financial': {
            'column_names': ['revenue', 'amount', 'price', 'cost', 'salary'],
            'tag': 'data_class:financial',
            'governance': 'confidential',
        },
    }

    def classify_column(self, column_name, sample_values):
        tags = []
        for rule_name, rule in self.CLASSIFICATION_RULES.items():
            if 'pattern' in rule:
                match_rate = self._pattern_match_rate(sample_values, rule['pattern'])
                if match_rate >= rule.get('match_threshold', 0.5):
                    tags.append(rule['tag'])
            if 'column_names' in rule:
                if any(kw in column_name.lower() for kw in rule['column_names']):
                    tags.append(rule['tag'])
        return tags

    def classify_dataset(self, df):
        classification = {}
        for col in df.columns:
            sample = df[col].dropna().head(1000)
            classification[col] = {
                'tags': self.classify_column(col, sample),
                'governance_level': self._highest_governance(col, sample),
            }
        return classification
```

## Ownership Model

```yaml
ownership_model:
  roles:
    data_owner:
      description: "Business stakeholder accountable for data quality and access"
      responsibilities:
        - Approve access requests
        - Define data quality requirements
        - Approve schema changes
        - Ensure regulatory compliance

    technical_owner:
      description: "Engineering team maintaining the pipeline and infrastructure"
      responsibilities:
        - Maintain ingestion pipelines
        - Fix data quality issues
        - Manage schema evolution
        - Monitor SLAs

    data_steward:
      description: "Subject matter expert who curates metadata and definitions"
      responsibilities:
        - Maintain descriptions and documentation
        - Manage business glossary entries
        - Review classification and tagging
        - Answer data consumer questions

  assignment_rules:
    - "Every dataset MUST have a data_owner and technical_owner"
    - "Datasets with PII MUST have a data_steward"
    - "Ownership reviewed quarterly"
    - "Orphaned datasets flagged after 90 days without owner activity"
```

## Search Optimization

### Improving Data Discovery

```python
class CatalogSearchOptimizer:
    """Strategies for improving catalog search quality."""

    def build_search_document(self, dataset_metadata):
        """Create enriched search document for indexing."""
        return {
            "name": dataset_metadata.name,
            "qualified_name": dataset_metadata.qualified_name,
            "description": dataset_metadata.description,
            "columns": [c.name for c in dataset_metadata.columns],
            "column_descriptions": [c.description for c in dataset_metadata.columns],
            "tags": dataset_metadata.tags,
            "glossary_terms": dataset_metadata.glossary_terms,
            "owner": dataset_metadata.owner,
            "team": dataset_metadata.team,
            "tier": dataset_metadata.tier,
            "usage_count": dataset_metadata.query_count_30d,
            "freshness": dataset_metadata.last_updated,
            # Boost fields for relevance
            "aliases": dataset_metadata.aliases,
            "upstream_names": [u.name for u in dataset_metadata.upstream],
            "downstream_count": len(dataset_metadata.downstream),
        }

    def rank_results(self, results, user_context):
        """Re-rank search results based on user context."""
        for result in results:
            score = result.base_score
            # Boost datasets owned by user's team
            if result.team == user_context.team:
                score *= 1.5
            # Boost frequently used datasets
            score *= 1 + (result.usage_count / 1000)
            # Boost gold-tier datasets
            if result.tier == 'gold':
                score *= 1.3
            # Penalize stale datasets
            if result.days_since_update > 90:
                score *= 0.7
            result.final_score = score
        return sorted(results, key=lambda r: r.final_score, reverse=True)
```

## Catalog Implementation Checklist

```
Foundation:
  [ ] Select catalog platform (DataHub, Amundsen, OpenMetadata, or custom)
  [ ] Deploy infrastructure (graph DB, search index, API)
  [ ] Configure authentication and authorization
  [ ] Set up automated ingestion for top 10 data sources

Metadata Quality:
  [ ] Define business glossary with 20+ core terms
  [ ] Assign ownership to all critical datasets
  [ ] Write descriptions for top 50 most-queried datasets
  [ ] Classify PII and sensitive columns
  [ ] Tag datasets with data tier (bronze/silver/gold)

Lineage:
  [ ] Integrate SQL parsing for automated column lineage
  [ ] Connect dbt for model lineage
  [ ] Connect orchestrator (Airflow/Dagster) for pipeline lineage
  [ ] Verify end-to-end lineage for 5 critical data paths

Governance:
  [ ] Define data classification levels
  [ ] Implement access request workflow
  [ ] Configure PII detection rules
  [ ] Set up ownership review cadence
  [ ] Define deprecation process for retired datasets

Adoption:
  [ ] Integrate catalog link into BI tool descriptions
  [ ] Add catalog search to Slack bot
  [ ] Track catalog usage metrics (searches, page views)
  [ ] Run onboarding sessions for data consumers
  [ ] Measure discovery time before/after catalog
```

## When to Use

**Use this skill when:**
- Designing or implementing data catalog builder solutions
- Reviewing or improving existing data catalog builder approaches
- Making architectural or implementation decisions about data catalog builder
- Learning data catalog builder patterns and best practices
- Troubleshooting data catalog builder-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Data Catalog Builder Analysis

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

**Input:** "Help me implement data catalog builder for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended data catalog builder approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When data catalog builder must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
