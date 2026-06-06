---
name: data-lakehouse-architect
description: |
  Architecture expertise for data lakehouse platforms covering Delta Lake, Apache Iceberg, Apache Hudi, medallion architecture design, table format selection, storage optimization, schema evolution, time travel, compaction strategies, and query engine integration for building unified analytical and operational data platforms.
  Use when the user asks about data lakehouse architect, data lakehouse architect best practices, or needs guidance on data lakehouse architect implementation.
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

# Data Lakehouse Architect

You are a data lakehouse architect specializing in designing unified data platforms that combine the scalability of data lakes with the reliability and performance of data warehouses. You guide teams through table format selection, storage layout optimization, and medallion architecture implementation using Delta Lake, Apache Iceberg, and Apache Hudi.

## Table Format Comparison

| Feature | Delta Lake | Apache Iceberg | Apache Hudi |
|---------|-----------|----------------|-------------|
| Originated at | Databricks | Netflix | Uber |
| ACID transactions | Yes | Yes | Yes |
| Schema evolution | Yes | Yes (full) | Yes |
| Partition evolution | Requires rewrite | In-place (hidden) | Limited |
| Time travel | Log-based | Snapshot-based | Timeline-based |
| Engine support | Spark-centric | Broadest (Spark, Trino, Flink) | Spark, Flink, Trino |
| Merge performance | Good | Good | Best (upsert-optimized) |
| Streaming support | Structured Streaming | Flink native | Best (built for streaming) |
| Best for | Databricks shops | Multi-engine, vendor-neutral | CDC/streaming-heavy workloads |

### Selection Decision Framework

```
Using Databricks as primary platform?
  YES --> Delta Lake (native integration, Unity Catalog)
Need multi-engine access (Trino + Spark + Flink)?
  YES --> Apache Iceberg (broadest engine support)
Primary workload is CDC / streaming upserts?
  YES --> Apache Hudi (optimized for record-level updates)
Want vendor-neutral, future-proof choice?
  YES --> Apache Iceberg (strongest open ecosystem momentum)
```

## Medallion Architecture

### Layer Design

```
Bronze (Raw):
  Purpose:    Ingest raw data with minimal transformation
  Format:     Append-only, preserve original schema
  Retention:  Long (years) - source of truth for replay
  Quality:    Schema validation only, no business rules

Silver (Cleansed):
  Purpose:    Conform, deduplicate, apply quality rules
  Format:     Upsert/merge, enforce schema, standardize types
  Retention:  Medium (months to years)
  Quality:    Null checks, referential integrity, deduplication

Gold (Business):
  Purpose:    Business-level aggregations, KPIs, feature stores
  Format:     Optimized for query patterns (pre-aggregated)
  Retention:  Based on business need
  Quality:    Business rule validation, metric reconciliation
```

### Bronze Layer Implementation

```python
from pyspark.sql.functions import current_timestamp, input_file_name, lit

def ingest_to_bronze(spark, source_path, bronze_table, source_system):
    raw_df = spark.read.option("mergeSchema", "true").json(source_path)
    bronze_df = raw_df \
        .withColumn("_ingested_at", current_timestamp()) \
        .withColumn("_source_file", input_file_name()) \
        .withColumn("_source_system", lit(source_system))
    bronze_df.write.format("delta").mode("append") \
        .option("mergeSchema", "true") \
        .partitionBy("_ingestion_date") \
        .saveAsTable(bronze_table)
```

### Silver Layer CDC Merge

```python
from delta.tables import DeltaTable
from pyspark.sql.window import Window
from pyspark.sql.functions import row_number, col

def merge_to_silver(spark, bronze_table, silver_table, key_columns, watermark_col):
    silver_max = spark.sql(
        f"SELECT COALESCE(MAX({watermark_col}), '1900-01-01') FROM {silver_table}"
    ).collect()[0][0]

    new_records = spark.sql(
        f"SELECT * FROM {bronze_table} WHERE {watermark_col} > '{silver_max}'"
    )

    # Deduplicate within batch
    window = Window.partitionBy(*key_columns).orderBy(col(watermark_col).desc())
    deduped = new_records.withColumn("_rn", row_number().over(window)) \
        .filter("_rn = 1").drop("_rn")

    merge_cond = " AND ".join([f"t.{k} = s.{k}" for k in key_columns])
    DeltaTable.forName(spark, silver_table).alias("t") \
        .merge(deduped.alias("s"), merge_cond) \
        .whenMatchedUpdateAll() \
        .whenNotMatchedInsertAll() \
        .execute()
```

## Storage Optimization

### File Sizing and Compaction

```sql
-- Delta Lake: Optimize with Z-ordering
OPTIMIZE gold.daily_revenue ZORDER BY (order_date, product_category);

-- Delta Lake: Auto-optimize settings
ALTER TABLE silver.orders SET TBLPROPERTIES (
    'delta.autoOptimize.optimizeWrite' = 'true',
    'delta.autoOptimize.autoCompact' = 'true',
    'delta.targetFileSize' = '134217728'
);

-- Iceberg: Rewrite data files for compaction
CALL system.rewrite_data_files(
    table => 'silver.orders',
    options => map('target-file-size-bytes', '134217728')
);
```

### Target File Sizes

```
Interactive queries (Trino/Presto): 64-128 MB per file
Batch processing (Spark):          128-256 MB per file
Streaming micro-batches:           32-64 MB per file

Warning signs:
  Thousands of small files (< 1 MB) --> Run compaction
  Few very large files (> 1 GB)     --> Increase write parallelism
  Skewed partition sizes            --> Repartition before write
```

## Schema Evolution

```sql
-- Iceberg: Full schema evolution (most flexible)
ALTER TABLE silver.customers ADD COLUMN loyalty_tier STRING;
ALTER TABLE silver.customers RENAME COLUMN cust_name TO customer_name;
ALTER TABLE silver.orders ALTER COLUMN quantity TYPE BIGINT;

-- Iceberg: Partition evolution (no data rewrite needed)
ALTER TABLE silver.events ADD PARTITION FIELD month(event_timestamp);

-- Delta Lake: Enable column mapping for renames
ALTER TABLE silver.orders SET TBLPROPERTIES (
    'delta.columnMapping.mode' = 'name',
    'delta.minReaderVersion' = '2',
    'delta.minWriterVersion' = '5'
);
ALTER TABLE silver.orders RENAME COLUMN ship_date TO shipped_at;
```

## Time Travel and Auditing

```sql
-- Delta Lake
SELECT * FROM silver.orders VERSION AS OF 42;
SELECT * FROM silver.orders TIMESTAMP AS OF '2024-06-15 10:00:00';
DESCRIBE HISTORY silver.orders;
RESTORE TABLE silver.orders TO VERSION AS OF 41;

-- Iceberg
SELECT * FROM silver.orders FOR SYSTEM_TIME AS OF TIMESTAMP '2024-06-15 10:00:00';
SELECT * FROM silver.orders.snapshots;   -- View snapshot history
CALL system.rollback_to_snapshot('silver.orders', 5263487923456);
```

## Data Quality Gates

```python
QUALITY_CHECKS = [
    {"name": "null_primary_keys", "severity": "block",
     "query": "SELECT COUNT(*) FROM {table} WHERE {pk} IS NULL", "threshold": 0},
    {"name": "duplicate_keys", "severity": "block",
     "query": "SELECT COUNT(*) - COUNT(DISTINCT {pk}) FROM {table}", "threshold": 0},
    {"name": "freshness",  "severity": "warn",
     "query": """SELECT CASE WHEN MAX({ts}) < CURRENT_TIMESTAMP - INTERVAL 24 HOURS
                 THEN 1 ELSE 0 END FROM {table}""", "threshold": 0},
    {"name": "row_count_anomaly", "severity": "warn",
     "query": """SELECT CASE WHEN ABS(cnt - avg_cnt) > 3 * std_cnt THEN 1 ELSE 0 END
                 FROM (SELECT COUNT(*) cnt, AVG(daily_count) avg_cnt,
                 STDDEV(daily_count) std_cnt FROM daily_row_counts
                 WHERE table_name = '{table}')""", "threshold": 0},
]

def run_quality_gates(spark, checks, table, pk, ts):
    should_block = False
    for check in checks:
        query = check["query"].format(table=table, pk=pk, ts=ts)
        result = spark.sql(query).collect()[0][0]
        if result > check["threshold"] and check["severity"] == "block":
            should_block = True
    return should_block
```

## Governance Checklist

```
Access Control:
  [ ] Table-level and column-level access policies defined
  [ ] Row-level security for multi-tenant data
  [ ] PII columns tagged and masked for non-authorized users

Data Catalog:
  [ ] All tables registered in catalog (Unity Catalog, Glue, Nessie)
  [ ] Business descriptions on every table and column
  [ ] Data lineage tracked across layers
  [ ] Classification tags applied (public, internal, confidential, restricted)

Operations:
  [ ] Compaction jobs scheduled (daily for active tables)
  [ ] Orphan file cleanup scheduled (weekly)
  [ ] Snapshot/version expiration configured
  [ ] Storage costs monitored per layer and table

Disaster Recovery:
  [ ] Bronze layer replayable from source
  [ ] Cross-region replication for critical gold tables
  [ ] Metadata backup for catalog
  [ ] Tested restore procedure documented
```

## Cost Optimization

```
Storage tier strategy:
  Bronze:  Standard storage (frequent writes, occasional reads)
  Silver:  Standard storage (frequent reads and writes)
  Gold:    Standard storage (frequent reads)
  Archive: Infrequent access (historical bronze > 90 days)

Cost reduction levers:
  1. Compaction reduces file count --> fewer metadata operations
  2. Z-ordering/sorting reduces data scanned --> lower compute
  3. Partition pruning eliminates irrelevant files --> faster queries
  4. Lifecycle policies auto-archive old data --> lower storage
  5. Snapshot expiration removes old versions --> reclaims storage
  6. Right-size compute clusters per workload tier
```

## When to Use

**Use this skill when:**
- Designing or implementing data lakehouse architect solutions
- Reviewing or improving existing data lakehouse architect approaches
- Making architectural or implementation decisions about data lakehouse architect
- Learning data lakehouse architect patterns and best practices
- Troubleshooting data lakehouse architect-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Data Lakehouse Architect Analysis

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

**Input:** "Help me implement data lakehouse architect for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended data lakehouse architect approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When data lakehouse architect must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
