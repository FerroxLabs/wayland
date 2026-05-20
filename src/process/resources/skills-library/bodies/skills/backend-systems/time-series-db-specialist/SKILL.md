---
name: time-series-db-specialist
description: |
  Time-series database specialist covering InfluxDB and TimescaleDB deep dives, data retention policies, downsampling strategies, continuous aggregates, compression techniques, IoT data modeling, high-cardinality management, query optimization, and Grafana integration.
  Use when the user asks about time series db specialist, time series db specialist best practices, or needs guidance on time series db specialist implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "database sql guide"
  category: "backend-systems"
  subcategory: "database"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Time-Series DB Specialist

You are an expert Time-Series Database Specialist who designs high-performance data architectures for metrics, IoT, financial data, and observability workloads. You understand that time-series data has unique access patterns -- append-heavy, time-range queries, aggregation-dominant -- and you select and optimize storage engines that exploit these patterns.

## When to Use a Time-Series Database

```
USE A TSDB WHEN:
  - Data is indexed primarily by time
  - Writes are append-only (rarely update existing data)
  - Queries are overwhelmingly time-range based
  - You need efficient aggregation (avg, sum, percentile over time)
  - Data volume is high and growing continuously
  - Older data can be downsampled or archived

USE CASES:
  - Application metrics and monitoring (CPU, memory, latency)
  - IoT sensor data (temperature, pressure, location)
  - Financial market data (price ticks, order book)
  - Event tracking and analytics
  - Log-derived metrics
  - Infrastructure observability

DO NOT USE A TSDB WHEN:
  - You need frequent updates to existing records
  - Queries are primarily by non-time dimensions
  - Data model is highly relational
  - Volume is low (< 10K records/day) -- use PostgreSQL
```

## Database Selection

```
┌─────────────────────────────────────────────────────────────┐
│ DECISION TREE                                                │
│                                                              │
│ Already using PostgreSQL?                                    │
│   YES → TimescaleDB (PostgreSQL extension, full SQL)         │
│   NO  → Need SQL for queries?                               │
│           YES → TimescaleDB or QuestDB                      │
│           NO  → InfluxDB (Flux/InfluxQL)                    │
│                                                              │
│ High write throughput (>1M points/sec)?                     │
│   → QuestDB or ClickHouse                                   │
│                                                              │
│ Prometheus ecosystem?                                        │
│   → VictoriaMetrics or Thanos                               │
│                                                              │
│ Simple metrics + alerting?                                   │
│   → InfluxDB + Grafana                                      │
└─────────────────────────────────────────────────────────────┘
```

## TimescaleDB Deep Dive

### Setup and Hypertable Creation

```sql
-- Enable the extension
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Create a regular table
CREATE TABLE sensor_data (
    time        TIMESTAMPTZ NOT NULL,
    sensor_id   TEXT NOT NULL,
    temperature DOUBLE PRECISION,
    humidity    DOUBLE PRECISION,
    battery     DOUBLE PRECISION
);

-- Convert to a hypertable (this is the magic step)
SELECT create_hypertable('sensor_data', 'time',
    chunk_time_interval => INTERVAL '1 day',
    if_not_exists => TRUE
);

-- Add a composite index for common query patterns
CREATE INDEX idx_sensor_time ON sensor_data (sensor_id, time DESC);

-- Optional: Add space partitioning for high-cardinality sensor_id
SELECT add_dimension('sensor_data', 'sensor_id', number_partitions => 4);
```

### Continuous Aggregates

```sql
-- Pre-compute hourly aggregates (materialized views on steroids)
CREATE MATERIALIZED VIEW sensor_hourly
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 hour', time) AS bucket,
    sensor_id,
    AVG(temperature) AS avg_temp,
    MIN(temperature) AS min_temp,
    MAX(temperature) AS max_temp,
    AVG(humidity) AS avg_humidity,
    COUNT(*) AS sample_count
FROM sensor_data
GROUP BY bucket, sensor_id
WITH NO DATA;

-- Set up automatic refresh policy
SELECT add_continuous_aggregate_policy('sensor_hourly',
    start_offset    => INTERVAL '3 hours',   -- How far back to refresh
    end_offset      => INTERVAL '1 hour',    -- How close to now
    schedule_interval => INTERVAL '1 hour'   -- How often to refresh
);

-- Query the aggregate (fast: reads pre-computed data)
SELECT * FROM sensor_hourly
WHERE sensor_id = 'sensor-42'
  AND bucket >= NOW() - INTERVAL '7 days'
ORDER BY bucket DESC;

-- Hierarchical aggregates: daily from hourly
CREATE MATERIALIZED VIEW sensor_daily
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 day', bucket) AS day,
    sensor_id,
    AVG(avg_temp) AS avg_temp,
    MIN(min_temp) AS min_temp,
    MAX(max_temp) AS max_temp
FROM sensor_hourly
GROUP BY day, sensor_id
WITH NO DATA;
```

### Compression

```sql
-- Enable compression on the hypertable
ALTER TABLE sensor_data SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = 'sensor_id',
    timescaledb.compress_orderby = 'time DESC'
);

-- Compress chunks older than 7 days automatically
SELECT add_compression_policy('sensor_data', INTERVAL '7 days');

-- Check compression ratio
SELECT
    pg_size_pretty(before_compression_total_bytes) AS before,
    pg_size_pretty(after_compression_total_bytes) AS after,
    ROUND((1 - after_compression_total_bytes::numeric /
           before_compression_total_bytes::numeric) * 100, 1) AS ratio_pct
FROM hypertable_compression_stats('sensor_data');

-- Typical compression: 90-95% reduction for numeric time-series data
```

### Data Retention

```sql
-- Automatically drop data older than 90 days
SELECT add_retention_policy('sensor_data', INTERVAL '90 days');

-- For continuous aggregates, keep aggregated data longer
-- Raw data: 90 days
-- Hourly aggregates: 1 year
-- Daily aggregates: 5 years

SELECT add_retention_policy('sensor_hourly', INTERVAL '1 year');
SELECT add_retention_policy('sensor_daily', INTERVAL '5 years');
```

## InfluxDB Deep Dive

### Data Model

```
INFLUX LINE PROTOCOL:
  measurement,tag_key=tag_value field_key=field_value timestamp

EXAMPLE:
  temperature,sensor_id=sensor-42,location=warehouse-a value=23.5 1706140800000000000

CONCEPTS:
  Measurement: Like a table (temperature, cpu_usage, http_requests)
  Tags: Indexed metadata (string only, low cardinality ideal)
  Fields: The actual values (numbers, strings, booleans)
  Timestamp: Nanosecond precision

CRITICAL RULE: Tags create series. High-cardinality tags kill performance.
  GOOD tag: location=warehouse-a (100 distinct values)
  BAD tag: user_id=abc123 (millions of distinct values)
```

### InfluxDB Queries (Flux)

```javascript
// Query last hour of data for a specific sensor
from(bucket: "iot_data")
  |> range(start: -1h)
  |> filter(fn: (r) => r._measurement == "temperature")
  |> filter(fn: (r) => r.sensor_id == "sensor-42")
  |> aggregateWindow(every: 5m, fn: mean)
  |> yield(name: "mean_temp")

// Downsampling task: aggregate to 1-hour buckets
option task = {name: "downsample_temp", every: 1h}

from(bucket: "iot_data")
  |> range(start: -2h, stop: -1h)
  |> filter(fn: (r) => r._measurement == "temperature")
  |> aggregateWindow(every: 1h, fn: mean)
  |> to(bucket: "iot_data_hourly")
```

### InfluxDB Retention and Downsampling

```
STRATEGY: Tiered retention with downsampling

Bucket: iot_data_raw     | Retention: 7 days   | Resolution: raw (every 1s)
Bucket: iot_data_hourly  | Retention: 90 days  | Resolution: 1 hour avg
Bucket: iot_data_daily   | Retention: 5 years  | Resolution: 1 day avg

DOWNSAMPLING TASKS:
  Every hour: Aggregate raw → hourly (mean, min, max, count)
  Every day:  Aggregate hourly → daily (mean, min, max)

RESULT: Recent data at full resolution, old data at reduced resolution
        Saves 99%+ of storage for long-term data
```

## IoT Data Modeling

### Schema Design for IoT

```sql
-- Wide table: One row per timestamp per device, all metrics as columns
CREATE TABLE device_telemetry (
    time        TIMESTAMPTZ NOT NULL,
    device_id   TEXT NOT NULL,
    temperature DOUBLE PRECISION,
    humidity    DOUBLE PRECISION,
    pressure    DOUBLE PRECISION,
    battery_pct DOUBLE PRECISION,
    rssi        INTEGER
);
SELECT create_hypertable('device_telemetry', 'time');

-- PROS: Simpler queries, aligned timestamps, good compression
-- CONS: All NULL if a sensor does not report all metrics

-- Narrow table: One row per metric per timestamp (EAV-style)
CREATE TABLE device_metrics (
    time        TIMESTAMPTZ NOT NULL,
    device_id   TEXT NOT NULL,
    metric_name TEXT NOT NULL,
    value       DOUBLE PRECISION NOT NULL
);
SELECT create_hypertable('device_metrics', 'time');

-- PROS: Flexible, handles heterogeneous devices
-- CONS: Harder to query across metrics, less efficient

-- RECOMMENDATION: Wide table when devices have a fixed schema.
--                 Narrow table when schemas vary per device type.
```

### High-Cardinality Management

```
PROBLEM: Millions of unique tag/label combinations.
  e.g., device_id x metric_name x region = 10M series

SYMPTOMS:
  - Index bloat (memory usage grows unboundedly)
  - Slow queries across all series
  - InfluxDB: "series cardinality" errors

SOLUTIONS:
  1. REDUCE CARDINALITY in tags
     Move high-cardinality fields from tags to fields
     device_id as field (not indexed) if you always query with time range

  2. USE HIERARCHICAL IDs
     Instead of: device_id=abc123def456
     Use: region=us-east, building=warehouse-1, floor=3, device=42

  3. PRE-AGGREGATE
     Instead of storing every device individually:
     Aggregate to building-level or floor-level for dashboards
     Keep device-level data only for drill-down queries

  4. SHARD BY TIME + SPACE
     TimescaleDB: Space partitioning on device_id
     InfluxDB: Separate buckets per region or device type
```

## Query Optimization

### Common Query Patterns

```sql
-- PATTERN 1: Latest value per device
-- Use: Dashboard showing current state of all devices
SELECT DISTINCT ON (device_id)
    device_id, time, temperature, humidity
FROM device_telemetry
WHERE time > NOW() - INTERVAL '1 hour'
ORDER BY device_id, time DESC;

-- PATTERN 2: Time-bucketed aggregation
-- Use: Charts showing trends over time
SELECT
    time_bucket('15 minutes', time) AS bucket,
    AVG(temperature) AS avg_temp,
    MAX(temperature) AS max_temp,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY temperature) AS p95_temp
FROM device_telemetry
WHERE device_id = 'sensor-42'
  AND time > NOW() - INTERVAL '24 hours'
GROUP BY bucket
ORDER BY bucket;

-- PATTERN 3: Anomaly detection
-- Use: Alerting on values outside normal range
SELECT time, device_id, temperature
FROM device_telemetry
WHERE time > NOW() - INTERVAL '1 hour'
  AND temperature > (
    SELECT AVG(temperature) + 3 * STDDEV(temperature)
    FROM device_telemetry
    WHERE device_id = 'sensor-42'
      AND time > NOW() - INTERVAL '24 hours'
  );

-- PATTERN 4: Gap detection
-- Use: Identifying when a device stopped reporting
SELECT
    device_id,
    time AS last_seen,
    NOW() - time AS time_since_last
FROM (
    SELECT DISTINCT ON (device_id) device_id, time
    FROM device_telemetry
    ORDER BY device_id, time DESC
) latest
WHERE time < NOW() - INTERVAL '10 minutes';
```

### Performance Tips

```
1. ALWAYS INCLUDE TIME IN WHERE CLAUSE
   TSDB chunk pruning depends on time range.
   Without a time filter, it scans ALL chunks.

2. USE CONTINUOUS AGGREGATES FOR DASHBOARDS
   Do not compute AVG() over 90 days of raw data on every page load.
   Pre-compute into hourly/daily aggregates.

3. INDEX STRATEGY
   Primary: (time DESC) -- automatic with hypertable
   Secondary: (device_id, time DESC) -- for device-specific queries
   Skip: Do not index every field. Time-series queries rarely filter by value.

4. BATCH INSERTS
   Insert 1000-5000 rows per batch, not one at a time.
   Use COPY for bulk loads (10-100x faster than INSERT).

5. COMPRESSION TIMING
   Compress data older than your typical query lookback window.
   Compressed data is slower to query but uses 90%+ less space.
```

## Grafana Integration

```
DASHBOARD DESIGN FOR TIME-SERIES:

PANEL TYPES:
  - Time series: Primary chart type, shows trends over time
  - Stat: Single number with sparkline (current value)
  - Gauge: Current value vs threshold (battery level, CPU usage)
  - Table: Last N events or anomalies
  - Heatmap: Distribution over time (latency percentiles)

VARIABLE TEMPLATES:
  $device_id: SELECT DISTINCT device_id FROM device_telemetry
  $time_range: Grafana built-in time picker
  $interval: Automatic bucket size based on time range

QUERY TEMPLATE:
  SELECT
    time_bucket('$interval', time) AS time,
    AVG(temperature) AS temperature
  FROM device_telemetry
  WHERE device_id = '$device_id'
    AND $__timeFilter(time)
  GROUP BY 1
  ORDER BY 1;

ALERTING:
  Alert when: avg(temperature) > 40 for 5 minutes
  Notification: Slack channel + PagerDuty
```

## Quick Reference Card

```
CHOOSE: TimescaleDB (SQL + Postgres), InfluxDB (Flux + purpose-built), QuestDB (high throughput)
MODEL: Wide table for fixed schemas, narrow for heterogeneous devices
RETENTION: Raw (7-30 days) → Hourly (90 days-1 year) → Daily (1-5 years)
AGGREGATES: Continuous aggregates (TimescaleDB) or Tasks (InfluxDB) for pre-computation
COMPRESSION: Enable on chunks older than query window. Expect 90%+ reduction.
CARDINALITY: Keep tags/labels low cardinality. Move high-cardinality to fields/values.
QUERIES: Always filter by time. Use pre-computed aggregates for dashboards.
GRAFANA: Time series + stat panels, template variables, auto-interval bucketing
```

## Output Format

```markdown
# Time Series Db Specialist Analysis

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

**Input:** "Help me implement time series db specialist for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended time series db specialist approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When time series db specialist must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
