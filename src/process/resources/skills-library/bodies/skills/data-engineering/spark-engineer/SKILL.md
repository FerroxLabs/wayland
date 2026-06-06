---
name: spark-engineer
description: |
  Apache Spark expertise covering RDD vs DataFrame vs Dataset APIs, partitioning strategies, shuffle optimization, broadcast joins, caching, Spark SQL, structured streaming, UDFs, cluster sizing, performance tuning, and PySpark patterns for building scalable distributed data processing applications.
  Use when the user asks about spark engineer, spark engineer best practices, or needs guidance on spark engineer implementation.
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

# Spark Engineer

## Overview

Apache Spark is the de facto standard for large-scale distributed data processing. This skill covers the internals, optimization techniques, and best practices needed to write Spark applications that are both correct and performant at terabyte-to-petabyte scale.

## API Comparison: RDD vs DataFrame vs Dataset

### When to Use Each API

| API | Language | Type Safety | Optimization | Use Case |
|-----|----------|-------------|--------------|----------|
| RDD | Python/Scala/Java | None (Python), Compile-time (Scala) | None (opaque to Catalyst) | Low-level control, custom partitioning, unstructured data |
| DataFrame | Python/Scala/Java/R | Runtime only | Full Catalyst + Tungsten | Most ETL, SQL-like transformations, interop with BI tools |
| Dataset | Scala/Java only | Compile-time | Full Catalyst + Tungsten | Type-safe operations in Scala/Java |

**Rule of thumb**: Use DataFrames (PySpark) or Datasets (Scala) unless you have a specific reason to drop to RDDs.

### DataFrame API Patterns (PySpark)

```python
from pyspark.sql import SparkSession, Window
from pyspark.sql import functions as F
from pyspark.sql.types import StructType, StructField, StringType, IntegerType, TimestampType

spark = SparkSession.builder \
    .appName("etl_pipeline") \
    .config("spark.sql.adaptive.enabled", "true") \
    .config("spark.sql.adaptive.coalescePartitions.enabled", "true") \
    .config("spark.sql.shuffle.partitions", "auto") \
    .getOrCreate()

# Read with schema enforcement (avoid inferSchema in production)
schema = StructType([
    StructField("user_id", IntegerType(), False),
    # ... (condensed) ...
        F.sum("amount").alias("total_amount"),
        F.percentile_approx("amount", 0.5).alias("median_amount"),
    )
    .orderBy("date", "hour")
)
```

## Partitioning Strategies

### Data Partitioning (Storage)

```python
# Write partitioned output (Hive-style partitioning)
result.write \
    .partitionBy("year", "month", "day") \
    .mode("overwrite") \
    .parquet("s3://bucket/output/events/")

# Partition pruning: only reads relevant partitions
filtered = spark.read.parquet("s3://bucket/output/events/") \
    .filter(F.col("year") == 2024) \
    .filter(F.col("month") == 6)
# Spark reads only /year=2024/month=6/ directories

# Bucketing: pre-sort data for join optimization
events.write \
    .bucketBy(256, "user_id") \
    .sortBy("user_id", "timestamp") \
    .saveAsTable("events_bucketed")
# Joins on user_id between bucketed tables avoid shuffle
```

### Execution Partitioning (In-Memory)

```python
# Repartition: full shuffle, use when you need specific partitioning
df_repartitioned = df.repartition(200, "customer_id")

# Coalesce: reduce partitions without full shuffle (narrow dependency)
df_coalesced = df.coalesce(10)  # Only for reducing partition count

# Check current partitioning
print(f"Partitions: {df.rdd.getNumPartitions()}")

# Custom partitioning (RDD level)
rdd = df.rdd.partitionBy(100, lambda key: hash(key) % 100)
```

### Partition Size Guidelines

- **Target partition size**: 128-256 MB (compressed) per partition
- **Max partition count**: 10,000-100,000 for large clusters
- **Min partition count**: 2x number of cores
- **Skew detection**: Check partition sizes via `df.groupBy(spark_partition_id()).count()`

## Shuffle Optimization

Shuffles are the most expensive operation in Spark. Every shuffle writes data to disk and transfers it across the network.

### Common Shuffle Triggers

1. `groupBy().agg()` - Aggregations
2. `join()` - Unless broadcast or co-partitioned
3. `repartition()` - Explicit repartitioning
4. `distinct()` - Deduplication
5. `orderBy()` / `sort()` - Global sorting
6. Window functions with `PARTITION BY`

### Reducing Shuffles

```python
# Anti-pattern: multiple shuffles
result = (
    df.groupBy("user_id").agg(F.count("*").alias("cnt"))
      .filter(F.col("cnt") > 10)
      .join(user_details, "user_id")
)
# This does TWO shuffles: one for groupBy, one for join

# Optimized: pre-partition to align both operations
df_partitioned = df.repartition(200, "user_id")
result = (
    df_partitioned
    .groupBy("user_id").agg(F.count("*").alias("cnt"))
    .filter(F.col("cnt") > 10)
    .join(user_details.repartition(200, "user_id"), "user_id")
)
# Still two shuffles, but the repartition is shared

# Best: use Adaptive Query Execution (AQE) in Spark 3.x
spark.conf.set("spark.sql.adaptive.enabled", "true")
spark.conf.set("spark.sql.adaptive.skewJoin.enabled", "true")
spark.conf.set("spark.sql.adaptive.coalescePartitions.enabled", "true")
```

## Broadcast Joins

When one side of a join is small enough to fit in memory, broadcast it to avoid shuffle entirely.

```python
from pyspark.sql.functions import broadcast

# Explicit broadcast hint
result = large_df.join(broadcast(small_df), "join_key")

# Auto-broadcast threshold (default 10MB)
spark.conf.set("spark.sql.autoBroadcastJoinThreshold", "50m")  # Increase to 50MB

# Check if broadcast was used
result.explain(True)
# Look for "BroadcastHashJoin" in the physical plan

# Broadcast variable for lookups (RDD-level)
lookup_dict = {"US": "United States", "UK": "United Kingdom"}
bc_lookup = spark.sparkContext.broadcast(lookup_dict)

@F.udf(StringType())
def resolve_country(code):
    return bc_lookup.value.get(code, "Unknown")
```

**Broadcast decision rules**:
- Table < 10 MB: Always broadcast (automatic)
- Table 10-500 MB: Broadcast if memory allows (increase threshold)
- Table > 500 MB: Do not broadcast; use sort-merge join
- Skewed join key: Consider broadcast even for moderate tables

## Caching and Persistence

```python
from pyspark import StorageLevel

# Cache levels (from fastest to most durable)
df.cache()                                              # MEMORY_AND_DISK (default)
df.persist(StorageLevel.MEMORY_ONLY)                    # Fastest, recompute on eviction
df.persist(StorageLevel.MEMORY_AND_DISK)                # Spill to disk
df.persist(StorageLevel.MEMORY_AND_DISK_SER)            # Serialized, less memory
df.persist(StorageLevel.DISK_ONLY)                      # No memory usage
df.persist(StorageLevel.OFF_HEAP)                       # Tungsten off-heap

# IMPORTANT: cache is lazy - trigger materialization
df.cache()
df.count()  # Forces caching

# ... (condensed) ...

# When NOT to cache:
# 1. DataFrame used only once
# 2. DataFrame is very large (will cause memory pressure)
# 3. Storage is the bottleneck (will slow down other tasks)
```

## Spark SQL

```python
# Register DataFrame as temporary view
events.createOrReplaceTempView("events")
user_details.createOrReplaceTempView("users")

# Complex SQL with window functions
result = spark.sql("""
    WITH user_sessions AS (
        SELECT
            user_id,
            timestamp,
            event_type,
            LAG(timestamp) OVER (PARTITION BY user_id ORDER BY timestamp) AS prev_ts,
            CASE
                WHEN UNIX_TIMESTAMP(timestamp) -
                     # ... (condensed) ...
        COLLECT_SET(event_type) AS event_types
    FROM sessions
    GROUP BY user_id, session_id
    HAVING COUNT(*) > 1
""")
```

## Structured Streaming

```python
# Read from Kafka
stream_df = spark.readStream \
    .format("kafka") \
    .option("kafka.bootstrap.servers", "broker1:9092,broker2:9092") \
    .option("subscribe", "events") \
    .option("startingOffsets", "latest") \
    .option("maxOffsetsPerTrigger", 100000) \
    .load()

# Parse and transform
parsed = (
    stream_df
    .selectExpr("CAST(value AS STRING) as json_str", "timestamp as kafka_ts")
    .select(
        # ... (condensed) ...
    .trigger(processingTime="30 seconds")
    .start("s3://bucket/output/windowed_events/")
)

query.awaitTermination()
```

## UDFs: When and How

```python
# AVOID UDFs when possible - they disable Catalyst optimization

# Anti-pattern: UDF for simple logic
@F.udf(StringType())
def categorize_udf(amount):
    if amount > 1000: return "high"
    elif amount > 100: return "medium"
    return "low"

# Better: use built-in functions
df.withColumn("category",
    F.when(F.col("amount") > 1000, "high")
     .when(F.col("amount") > 100, "medium")
     .otherwise("low")
# ... (condensed) ...
    model.fit(pdf[['x1', 'x2']], pdf['y'])
    pdf['prediction'] = model.predict(pdf[['x1', 'x2']])
    return pdf

result = df.groupBy("segment").apply(train_model_per_group)
```

## Cluster Sizing

### Memory Calculation

```
Per Executor:
  Total Memory = spark.executor.memory + spark.executor.memoryOverhead

  spark.executor.memory:
    - 300MB reserved for Spark internals
    - Remaining split: 60% execution (shuffles, joins, sorts, aggregations)
                       40% storage (cache, broadcast variables)
    - Controlled by spark.memory.fraction (default 0.6)
    - Controlled by spark.memory.storageFraction (default 0.5 of fraction)

  spark.executor.memoryOverhead:
    - Default: max(384MB, 0.10 * spark.executor.memory)
    - Increase for PySpark (Python processes), large broadcasts, or off-heap

Sizing formula:
  Data size (compressed on disk) * decompression ratio (~3-5x) * number of passes
  / target partition size (128-256MB)
  = minimum total executor memory needed
```

### Cluster Configuration Recipes

```python
# Small job: 10-100 GB data
spark.conf.set("spark.executor.memory", "4g")
spark.conf.set("spark.executor.cores", "4")
spark.conf.set("spark.executor.instances", "10")
spark.conf.set("spark.sql.shuffle.partitions", "100")

# Medium job: 100 GB - 1 TB data
spark.conf.set("spark.executor.memory", "8g")
spark.conf.set("spark.executor.cores", "4")
spark.conf.set("spark.executor.instances", "50")
spark.conf.set("spark.sql.shuffle.partitions", "500")

# Large job: 1-10 TB data
spark.conf.set("spark.executor.memory", "16g")
# ... (condensed) ...
# Dynamic allocation (recommended for shared clusters)
spark.conf.set("spark.dynamicAllocation.enabled", "true")
spark.conf.set("spark.dynamicAllocation.minExecutors", "5")
spark.conf.set("spark.dynamicAllocation.maxExecutors", "200")
spark.conf.set("spark.dynamicAllocation.executorIdleTimeout", "120s")
```

## Performance Tuning Checklist

### Data Skew

```python
# Detect skew: check partition sizes
df.groupBy(F.spark_partition_id().alias("partition")) \
  .count() \
  .describe("count") \
  .show()
# If max >> mean, you have skew

# Fix 1: Salting (add random prefix to skewed key)
salt_range = 10
df_salted = df.withColumn("salt", (F.rand() * salt_range).cast("int"))
df_salted = df_salted.withColumn("salted_key",
    F.concat(F.col("join_key"), F.lit("_"), F.col("salt"))
)

# ... (condensed) ...

# Fix 2: AQE skew join (Spark 3.0+) - automatic
spark.conf.set("spark.sql.adaptive.skewJoin.enabled", "true")
spark.conf.set("spark.sql.adaptive.skewJoin.skewedPartitionFactor", "5")
spark.conf.set("spark.sql.adaptive.skewJoin.skewedPartitionThresholdInBytes", "256m")
```

### Small Files Problem

```python
# Compaction: merge small files into optimal-sized files
df = spark.read.parquet("s3://bucket/many_small_files/")
df.coalesce(target_file_count).write \
    .mode("overwrite") \
    .parquet("s3://bucket/compacted/")

# Target file count calculation
total_size_bytes = sum(f.size for f in dbutils.fs.ls("s3://bucket/many_small_files/"))
target_file_size = 256 * 1024 * 1024  # 256 MB
target_file_count = max(1, total_size_bytes // target_file_size)

# Prevent small files on write
spark.conf.set("spark.sql.adaptive.coalescePartitions.enabled", "true")
spark.conf.set("spark.sql.adaptive.coalescePartitions.minPartitionSize", "64m")
```

### Essential Spark Configurations

```python
# Must-have configurations for production
configs = {
    # Adaptive Query Execution (Spark 3.0+)
    "spark.sql.adaptive.enabled": "true",
    "spark.sql.adaptive.coalescePartitions.enabled": "true",
    "spark.sql.adaptive.skewJoin.enabled": "true",

    # Serialization
    "spark.serializer": "org.apache.spark.serializer.KryoSerializer",

    # Parquet optimization
    "spark.sql.parquet.filterPushdown": "true",
    "spark.sql.parquet.mergeSchema": "false",
    "spark.hadoop.parquet.enable.summary-metadata": "false",
# ... (condensed) ...
    "spark.memory.storageFraction": "0.5",
}

for k, v in configs.items():
    spark.conf.set(k, v)
```

## Common PySpark Patterns

### Deduplication

```python
# Keep latest record per key
from pyspark.sql import Window

w = Window.partitionBy("user_id").orderBy(F.col("updated_at").desc())
deduped = (
    df.withColumn("rn", F.row_number().over(w))
      .filter(F.col("rn") == 1)
      .drop("rn")
)
```

### Explode and Collect

```python
# Explode: one row per array element
df.select("user_id", F.explode("tags").alias("tag"))

# Collect: aggregate back to arrays
df.groupBy("user_id").agg(
    F.collect_list("tag").alias("all_tags"),
    F.collect_set("tag").alias("unique_tags")
)
```

### Delta Lake Integration

```python
# Delta Lake: ACID transactions on data lakes
from delta.tables import DeltaTable

# Upsert (merge)
delta_table = DeltaTable.forPath(spark, "s3://bucket/delta/customers")
delta_table.alias("target").merge(
    updates_df.alias("source"),
    "target.customer_id = source.customer_id"
).whenMatchedUpdateAll() \
 .whenNotMatchedInsertAll() \
 .execute()

# Time travel
df_yesterday = spark.read.format("delta") \
    .option("timestampAsOf", "2024-06-14") \
    .load("s3://bucket/delta/customers")

# Optimize and Z-Order
spark.sql("OPTIMIZE delta.`s3://bucket/delta/customers` ZORDER BY (region, customer_id)")
```

## Debugging and Monitoring

Key places to investigate Spark performance issues:

1. **Spark UI -> SQL tab**: Check DAG, scan types, exchange (shuffle) nodes
2. **Spark UI -> Stages tab**: Look for stages with high shuffle read/write
3. **Spark UI -> Storage tab**: Verify cached DataFrames
4. **Spark UI -> Executors tab**: Check GC time (>10% is a problem)
5. **Driver logs**: Look for skew warnings, OOM errors
6. **Metrics**: `spark.executor.runTime`, `spark.shuffle.read.bytes`, `spark.jvm.gc.time`

## When to Use

**Use this skill when:**
- Designing or implementing spark engineer solutions
- Reviewing or improving existing spark engineer approaches
- Making architectural or implementation decisions about spark engineer
- Learning spark engineer patterns and best practices
- Troubleshooting spark engineer-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Spark Engineer Analysis

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

**Input:** "Help me implement spark engineer for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended spark engineer approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When spark engineer must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
