---
name: etl-architect
description: |
  Expert ETL pipeline design covering extract patterns (CDC, full load, incremental), transform strategies (SCD types, data cleansing), load patterns (upsert, merge), error handling, data quality checks, scheduling, and orchestration tools for building reliable data integration systems.
  Use when the user asks about etl architect, etl architect best practices, or needs guidance on etl architect implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "data-science sql automation"
  category: "data-engineering"
  subcategory: "pipelines-etl"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---

# ETL Architect

## Overview

ETL (Extract, Transform, Load) is the backbone of data integration. This skill covers the design and implementation of robust, scalable, and maintainable data pipelines that move data reliably between systems. Modern ETL also encompasses ELT (Extract, Load, Transform) where transformations happen inside the target data warehouse.

## Extract Patterns

### Full Load

Full load extracts the entire dataset each time. Simple but expensive.

```python
# Full load pattern with checksum for change detection
import hashlib
import pandas as pd

def full_load_with_checksum(source_query, target_table, engine):
    """Full load with row-level checksum to detect actual changes."""
    df = pd.read_sql(source_query, engine)

    # Add row checksum for downstream deduplication
    checksum_cols = df.columns.tolist()
    # MD5 used for non-cryptographic row checksum only. Do NOT use MD5 for passwords or security.
    df['_row_checksum'] = df[checksum_cols].apply(
        lambda row: hashlib.md5(
            '|'.join(str(v) for v in row).encode()
        # ... (condensed) ...
    df.to_sql(f'{target_table}_staging', engine, if_exists='replace', index=False)
    with engine.begin() as conn:
        conn.execute(f'ALTER TABLE {target_table} RENAME TO {target_table}_old')
        conn.execute(f'ALTER TABLE {target_table}_staging RENAME TO {target_table}')
        conn.execute(f'DROP TABLE IF EXISTS {target_table}_old')
```

**When to use**: Reference/dimension tables under 1M rows, initial loads, data without reliable timestamps.

### Incremental Load

Extract only new or changed records since the last successful run.

```python
# High-water mark incremental extraction
class IncrementalExtractor:
    def __init__(self, source_engine, watermark_store):
        self.source = source_engine
        self.watermarks = watermark_store

    def extract(self, table_name, timestamp_col, batch_size=10000):
        last_watermark = self.watermarks.get(table_name, '1970-01-01')

        query = f"""
            SELECT *
            FROM {table_name}
            WHERE {timestamp_col} > %(watermark)s
            ORDER BY {timestamp_col}
            # ... (condensed) ...
            result = pd.concat(chunks, ignore_index=True)
            self.watermarks.set(table_name, current_watermark)
            return result

        return pd.DataFrame()
```

**Pitfalls**: Late-arriving data, clock skew between systems, records updated without changing the timestamp.

### Change Data Capture (CDC)

CDC captures row-level changes (INSERT, UPDATE, DELETE) from the database transaction log.

```python
# Debezium CDC event processing
import json

def process_cdc_event(event):
    """Process a Debezium CDC event from Kafka."""
    payload = event['payload']
    operation = payload['op']  # c=create, u=update, d=delete, r=read(snapshot)

    result = {
        'operation': operation,
        'timestamp': payload['ts_ms'],
        'source_table': payload['source']['table'],
    }

    # ... (condensed) ...
    "transforms": "unwrap",
    "transforms.unwrap.type": "io.debezium.transforms.ExtractNewRecordState",
    "transforms.unwrap.drop.tombstones": "false",
    "transforms.unwrap.delete.handling.mode": "rewrite"
}
```

**CDC Decision Matrix**:

| Factor | Log-based CDC | Trigger-based CDC | Timestamp-based |
|--------|--------------|-------------------|-----------------|
| Performance impact on source | Minimal | Moderate | Minimal |
| Captures deletes | Yes | Yes | No |
| Captures all changes | Yes | Yes | Only latest state |
| Setup complexity | High | Medium | Low |
| Schema change handling | Requires care | Automatic | Automatic |

## Transform Strategies

### Slowly Changing Dimensions (SCD)

```sql
-- SCD Type 1: Overwrite (no history)
MERGE INTO dim_customer AS target
USING staging_customer AS source
ON target.customer_id = source.customer_id
WHEN MATCHED THEN
    UPDATE SET
        name = source.name,
        email = source.email,
        updated_at = CURRENT_TIMESTAMP
WHEN NOT MATCHED THEN
    INSERT (customer_id, name, email, created_at, updated_at)
    VALUES (source.customer_id, source.name, source.email,
            CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

# ... (condensed) ...
);

-- SCD Type 3: Limited history (previous + current columns)
-- SCD Type 4: Mini-dimension for rapidly changing attributes
-- SCD Type 6: Hybrid (1 + 2 + 3 combined)
```

### Data Cleansing Patterns

```python
import re
from typing import Optional

class DataCleanser:
    """Standard data cleansing operations for ETL pipelines."""

    @staticmethod
    def standardize_phone(phone: Optional[str], country='US') -> Optional[str]:
        if not phone:
            return None
        digits = re.sub(r'[^\d]', '', phone)
        if country == 'US':
            if len(digits) == 10:
                return f'+1{digits}'
            # ... (condensed) ...
                    continue
                if jaro_winkler_similarity(keys[i], keys[j]) >= threshold:
                    duplicates.add(j)

        return [r for idx, r in enumerate(records) if idx not in duplicates]
```

## Load Patterns

### Upsert (MERGE) Pattern

```sql
-- PostgreSQL upsert with conflict handling
INSERT INTO target_table (id, name, value, updated_at)
SELECT id, name, value, NOW()
FROM staging_table
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    value = EXCLUDED.value,
    updated_at = EXCLUDED.updated_at
WHERE target_table.name != EXCLUDED.name
   OR target_table.value != EXCLUDED.value;
-- The WHERE clause prevents unnecessary row versioning
```

### Bulk Load Optimization

```python
# PostgreSQL COPY for maximum throughput
import io
import csv

def bulk_load_postgres(df, table_name, engine):
    """Load DataFrame using PostgreSQL COPY protocol (~10x faster than INSERT)."""
    buffer = io.StringIO()
    df.to_csv(buffer, index=False, header=False, sep='\t', na_rep='\\N',
              quoting=csv.QUOTE_NONE, escapechar='\\')
    buffer.seek(0)

    raw_conn = engine.raw_connection()
    try:
        cursor = raw_conn.cursor()
        # ... (condensed) ...
# Batch size recommendations:
# PostgreSQL COPY: unlimited (streaming), best performance
# INSERT ... VALUES: 1000-5000 rows per statement
# Snowflake COPY INTO: stage files 100-250 MB each
# BigQuery: load jobs, max 15 TB per job, prefer Avro/Parquet
```

## Error Handling

### Dead Letter Queue Pattern

```python
class ETLPipeline:
    def __init__(self):
        self.dead_letter_queue = []
        self.processed_count = 0
        self.error_count = 0

    def process_batch(self, records, transform_fn, max_error_pct=5.0):
        """Process records with dead letter queue for failures."""
        results = []

        for record in records:
            try:
                transformed = transform_fn(record)
                results.append(transformed)
                # ... (condensed) ...
            target.write_dead_letters(self.dead_letter_queue)
            count = len(self.dead_letter_queue)
            self.dead_letter_queue.clear()
            return count
        return 0
```

### Idempotency

```python
# Idempotent load using partition swap
def idempotent_partition_load(df, table, partition_key, partition_value, engine):
    """
    Idempotent load: re-running with same inputs produces same result.
    Uses DELETE + INSERT within a transaction.
    """
    with engine.begin() as conn:
        # Delete existing data for this partition
        conn.execute(
            f"DELETE FROM {table} WHERE {partition_key} = %s",
            (partition_value,)
        )
        # Insert new data
        df.to_sql(table, conn, if_exists='append', index=False)
    # If this runs twice with same data, result is identical
```

## Data Quality Checks

```python
class DataQualityChecker:
    """Run data quality checks between pipeline stages."""

    def __init__(self):
        self.checks = []
        self.results = []

    def add_check(self, name, check_fn, severity='error'):
        self.checks.append({
            'name': name,
            'fn': check_fn,
            'severity': severity  # error, warning, info
        })

    # ... (condensed) ...
        max_ts = df[timestamp_col].max()
        age = (pd.Timestamp.utcnow() - max_ts).total_seconds() / 3600
        passed = age <= max_age_hours
        return passed, f'Data age: {age:.1f}h (max: {max_age_hours}h)'
    return _check
```

## Scheduling and Orchestration

### Scheduling Strategy Decision Tree

1. **How often does source data change?**
   - Real-time -> Streaming (Kafka + Flink/Spark Streaming)
   - Minutes -> Micro-batch (5-15 min intervals)
   - Hourly/Daily -> Batch scheduling

2. **What is the SLA for data freshness?**
   - < 1 minute -> CDC + streaming
   - < 1 hour -> Micro-batch or frequent batch
   - < 24 hours -> Daily batch is sufficient

3. **What is the data volume per batch?**
   - < 100K rows -> Simple scripts, cron
   - 100K-10M rows -> Airflow + pandas/SQL
   - > 10M rows -> Spark/distributed processing

### Pipeline Configuration

```yaml
# Pipeline configuration (environment-driven)
pipeline:
  name: customer_360_daily
  schedule: "0 6 * * *"  # 6 AM UTC daily
  timeout_minutes: 120
  retries: 3
  retry_delay_minutes: 15
  alerts:
    on_failure: ["data-eng@company.com"]
    on_sla_miss: ["data-eng@company.com", "analytics@company.com"]
    sla_minutes: 90

  stages:
    - name: extract_crm
      # ... (condensed) ...
          min: 1000
          max: 10000000
        - type: freshness
          column: updated_at
          max_age_hours: 48
```

## Monitoring and Observability

Key metrics for ETL pipelines:

- **Throughput**: Records processed per second
- **Latency**: Time from source change to target availability
- **Error rate**: Percentage of records that failed transformation
- **Data freshness**: Age of the most recent record in the target
- **Pipeline duration**: Total wall-clock time per run
- **Resource utilization**: CPU, memory, I/O during pipeline execution

```python
# Pipeline metrics emission
class PipelineMetrics:
    def __init__(self, pipeline_name, metrics_backend):
        self.pipeline = pipeline_name
        self.backend = metrics_backend
        self.start_time = None

    def start_run(self):
        self.start_time = time.time()
        self.backend.gauge(f'pipeline.{self.pipeline}.running', 1)

    def end_run(self, status, records_processed, records_failed):
        duration = time.time() - self.start_time
        self.backend.gauge(f'pipeline.{self.pipeline}.running', 0)
        self.backend.timer(f'pipeline.{self.pipeline}.duration', duration)
        self.backend.counter(f'pipeline.{self.pipeline}.records.processed', records_processed)
        self.backend.counter(f'pipeline.{self.pipeline}.records.failed', records_failed)
        self.backend.counter(f'pipeline.{self.pipeline}.runs.{status}', 1)

        if records_processed > 0:
            error_rate = records_failed / (records_processed + records_failed) * 100
            self.backend.gauge(f'pipeline.{self.pipeline}.error_rate', error_rate)
```

## ETL vs ELT Decision Framework

| Factor | ETL | ELT |
|--------|-----|-----|
| Compute cost | Source/pipeline server | Target warehouse |
| Data volume | Better for filtering before load | Better when warehouse is powerful |
| Complexity | Transformations in code | Transformations in SQL |
| Schema flexibility | More control | Relies on warehouse capabilities |
| Latency | May add latency for transforms | Load first, transform on read |
| Best for | Legacy systems, complex logic | Cloud warehouses (Snowflake, BigQuery) |

## When to Use

**Use this skill when:**
- Designing or implementing etl architect solutions
- Reviewing or improving existing etl architect approaches
- Making architectural or implementation decisions about etl architect
- Learning etl architect patterns and best practices
- Troubleshooting etl architect-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Etl Architect Analysis

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

**Input:** "Help me implement etl architect for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended etl architect approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When etl architect must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
