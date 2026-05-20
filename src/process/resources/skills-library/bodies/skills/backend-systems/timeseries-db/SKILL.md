---
name: timeseries-db
description: |
  Time-series database design and operations covering InfluxDB, TimescaleDB, and QuestDB patterns, data retention policies, continuous aggregates, downsampling strategies, compression techniques, optimized query patterns for time-series data, alerting on metrics, IoT data modeling, and Grafana integration for visualization.
  Use when the user asks about timeseries db, timeseries db best practices, or needs guidance on timeseries db implementation.
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

# Time-Series Database Specialist

## Core Philosophy

Time-series data is unique: it arrives in chronological order, is rarely updated after creation, and queries almost always involve time ranges and aggregations. Successful time-series architecture requires understanding these access patterns and choosing storage engines, schemas, and retention policies that exploit them.

## Database Selection Decision Tree

```
What is your primary use case?
  Metrics/Monitoring (Prometheus-style) -> InfluxDB or VictoriaMetrics
  SQL analytics on time-series -> TimescaleDB (PostgreSQL extension)
  High-throughput financial/IoT ingestion -> QuestDB
  Already using PostgreSQL -> TimescaleDB
  Need ecosystem/Flux language -> InfluxDB
  Maximum write throughput -> QuestDB
  Complex JOINs with relational data -> TimescaleDB
```

## TimescaleDB (PostgreSQL Extension)

### Setup and Hypertables

```sql
-- Install TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Create a regular table, then convert to hypertable
CREATE TABLE metrics (
    time        TIMESTAMPTZ NOT NULL,
    sensor_id   INTEGER NOT NULL,
    temperature DOUBLE PRECISION,
    humidity    DOUBLE PRECISION,
    pressure    DOUBLE PRECISION,
    location    TEXT
);

-- Convert to hypertable (auto-partitions by time)
SELECT create_hypertable('metrics', 'time',
    chunk_time_interval => INTERVAL '1 day',
    if_not_exists => TRUE
);

-- Add space partitioning for multi-tenant (optional)
SELECT add_dimension('metrics', 'sensor_id', number_partitions => 4);

-- Create indexes optimized for time-series queries
CREATE INDEX idx_metrics_sensor_time ON metrics (sensor_id, time DESC);
```

### Continuous Aggregates

Pre-compute common aggregations that update automatically as new data arrives.

```sql
-- Create a continuous aggregate for hourly summaries
CREATE MATERIALIZED VIEW metrics_hourly
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 hour', time) AS bucket,
    sensor_id,
    AVG(temperature) AS avg_temp,
    MIN(temperature) AS min_temp,
    MAX(temperature) AS max_temp,
    AVG(humidity) AS avg_humidity,
    COUNT(*) AS sample_count
FROM metrics
GROUP BY bucket, sensor_id
WITH NO DATA;  -- Backfill separately if needed

-- Set refresh policy (auto-refresh every hour, covering last 3 hours)
SELECT add_continuous_aggregate_policy('metrics_hourly',
    start_offset => INTERVAL '3 hours',
    end_offset => INTERVAL '1 hour',
    schedule_interval => INTERVAL '1 hour'
);

# ... (condensed) ...
    sensor_id,
    AVG(avg_temp) AS avg_temp,
    MIN(min_temp) AS min_temp,
    MAX(max_temp) AS max_temp,
    SUM(sample_count) AS sample_count
FROM metrics_hourly
GROUP BY time_bucket('1 day', bucket), sensor_id
WITH NO DATA;
```

### Compression

```sql
-- Enable compression
ALTER TABLE metrics SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = 'sensor_id',
    timescaledb.compress_orderby = 'time DESC'
);

-- Add compression policy (compress data older than 7 days)
SELECT add_compression_policy('metrics', INTERVAL '7 days');

-- Manual compression
SELECT compress_chunk(c.chunk_name)
FROM timescaledb_information.chunks c
WHERE c.hypertable_name = 'metrics'
  AND c.range_start < NOW() - INTERVAL '7 days'
  AND NOT c.is_compressed;

-- Check compression stats
SELECT
    hypertable_name,
    chunk_name,
    before_compression_total_bytes,
    after_compression_total_bytes,
    ROUND((1 - after_compression_total_bytes::numeric / before_compression_total_bytes) * 100, 1) AS compression_ratio_pct
FROM timescaledb_information.compressed_chunk_stats
WHERE hypertable_name = 'metrics';
```

### Data Retention

```sql
-- Automatically drop data older than 90 days
SELECT add_retention_policy('metrics', INTERVAL '90 days');

-- Drop specific chunks manually
SELECT drop_chunks('metrics', older_than => INTERVAL '90 days');

-- Move old data to cheaper tablespace before dropping
-- (requires separate tablespace setup)
SELECT move_chunk(
    chunk => '_timescaledb_internal._hyper_1_5_chunk',
    destination_tablespace => 'cold_storage'
);
```

### TimescaleDB Query Patterns

```sql
-- Last value per sensor (common dashboard query)
SELECT DISTINCT ON (sensor_id)
    sensor_id, time, temperature, humidity
FROM metrics
ORDER BY sensor_id, time DESC;

-- Or using TimescaleDB's last() function (faster)
SELECT
    sensor_id,
    last(temperature, time) AS latest_temp,
    last(humidity, time) AS latest_humidity,
    last(time, time) AS latest_time
FROM metrics
WHERE time > NOW() - INTERVAL '1 hour'
GROUP BY sensor_id;

-- Time-bucketed aggregation
SELECT
    time_bucket('15 minutes', time) AS bucket,
    sensor_id,
    AVG(temperature) AS avg_temp,
    percentile_cont(0.95) WITHIN GROUP (ORDER BY temperature) AS p95_temp
# ... (condensed) ...
SELECT
    time_bucket('5 minutes', time) AS bucket,
    sensor_id,
    (last(temperature, time) - first(temperature, time)) /
    EXTRACT(EPOCH FROM (last(time, time) - first(time, time))) AS temp_change_per_sec
FROM metrics
WHERE time > NOW() - INTERVAL '1 hour'
GROUP BY bucket, sensor_id;
```

## InfluxDB

### Data Model (Line Protocol)

```
# Measurement,TagSet FieldSet Timestamp
temperature,sensor_id=s1,location=warehouse value=22.5,humidity=65.2 1710500000000000000
temperature,sensor_id=s2,location=office value=21.3,humidity=58.7 1710500000000000000
```

### InfluxDB Schema Design Rules

- **Measurements**: Similar to tables. Group by data type/source.
- **Tags**: Indexed metadata for filtering (string only). Use for dimensions you filter/group by.
- **Fields**: Actual data values (numbers, strings, booleans). NOT indexed.
- **Timestamps**: Nanosecond precision by default.

**Cardinality warning**: Avoid high-cardinality tags (like UUIDs or IP addresses). Each unique tag combination creates a new series. Millions of series degrade performance.

### Flux Queries (InfluxDB 2.x)

```flux
// Basic query with filtering and aggregation
from(bucket: "iot_data")
  |> range(start: -24h)
  |> filter(fn: (r) => r._measurement == "temperature")
  |> filter(fn: (r) => r.location == "warehouse")
  |> aggregateWindow(every: 15m, fn: mean, createEmpty: false)
  |> yield(name: "mean_temperature")

// Moving average
from(bucket: "iot_data")
  |> range(start: -7d)
  |> filter(fn: (r) => r._measurement == "temperature" and r._field == "value")
  |> timedMovingAverage(every: 1h, period: 6h)

// Alerting: detect values above threshold
from(bucket: "iot_data")
  |> range(start: -5m)
  |> filter(fn: (r) => r._measurement == "temperature" and r._field == "value")
  |> last()
  |> map(fn: (r) => ({r with alert: if r._value > 30.0 then "critical" else "ok"}))
  |> filter(fn: (r) => r.alert == "critical")

// Downsampling task
option task = {name: "downsample_hourly", every: 1h}

from(bucket: "iot_data")
  |> range(start: -task.every)
  |> filter(fn: (r) => r._measurement == "temperature")
  |> aggregateWindow(every: 1h, fn: mean)
  |> to(bucket: "iot_data_downsampled", org: "myorg")
```

### InfluxDB Retention and Downsampling

```flux
// Create buckets with different retention periods
// Via CLI or API:
// influx bucket create --name iot_data --retention 30d
// influx bucket create --name iot_data_monthly --retention 365d
// influx bucket create --name iot_data_yearly --retention 0 (infinite)

// Task to downsample daily averages into monthly bucket
option task = {name: "downsample_daily", every: 1d}

from(bucket: "iot_data")
  |> range(start: -1d)
  |> filter(fn: (r) => r._measurement == "temperature")
  |> aggregateWindow(every: 1d, fn: mean)
  |> set(key: "_measurement", value: "temperature_daily")
  |> to(bucket: "iot_data_monthly")
```

## QuestDB

### High-Performance Ingestion

QuestDB uses a columnar storage engine optimized for time-series with SQL interface.

```sql
-- Create table with designated timestamp
CREATE TABLE sensors (
    timestamp TIMESTAMP,
    sensor_id SYMBOL CAPACITY 1000,    -- SYMBOL type for low-cardinality strings
    location SYMBOL CAPACITY 100,
    temperature DOUBLE,
    humidity DOUBLE,
    pressure DOUBLE
) TIMESTAMP(timestamp) PARTITION BY DAY
WAL;  -- Write-Ahead Log for concurrent ingestion

-- High-performance ingestion via ILP (InfluxDB Line Protocol)
-- sensors,sensor_id=s1,location=warehouse temperature=22.5,humidity=65.2 1710500000000000000

-- Query with time-range filtering
SELECT
    timestamp, sensor_id, temperature
FROM sensors
WHERE timestamp IN '2025-03-15'
  AND sensor_id = 's1'
ORDER BY timestamp;

# ... (condensed) ...
-- LATEST ON (last value per group, highly optimized)
SELECT * FROM sensors
LATEST ON timestamp PARTITION BY sensor_id;

-- ASOF JOIN (join by nearest timestamp)
SELECT s.timestamp, s.sensor_id, s.temperature, e.event_type
FROM sensors s
ASOF JOIN events e ON (s.sensor_id = e.sensor_id);
```

## IoT Data Modeling

### Schema Design for IoT

```sql
-- Wide table approach (fewer JOINs, better for Grafana)
CREATE TABLE device_telemetry (
    time        TIMESTAMPTZ NOT NULL,
    device_id   TEXT NOT NULL,
    device_type TEXT,
    location    TEXT,
    -- Measurements
    temperature  DOUBLE PRECISION,
    humidity     DOUBLE PRECISION,
    battery_pct  DOUBLE PRECISION,
    signal_rssi  INTEGER,
    -- Status
    is_online    BOOLEAN DEFAULT TRUE
);

-- Narrow table approach (flexible, schema-less)
CREATE TABLE measurements (
    time        TIMESTAMPTZ NOT NULL,
    device_id   TEXT NOT NULL,
    metric_name TEXT NOT NULL,
    value       DOUBLE PRECISION NOT NULL,
    tags        JSONB DEFAULT '{}'
);

-- Wide is preferred when:
-- - Fixed set of measurements per device type
-- - Need to correlate multiple measurements at same timestamp
-- - Query performance is critical

-- Narrow is preferred when:
-- - Device types vary widely
-- - New measurement types are added frequently
-- - Flexibility is more important than performance
```

### Device State Tracking

```sql
-- Track device online/offline status changes
CREATE TABLE device_status_changes (
    time        TIMESTAMPTZ NOT NULL,
    device_id   TEXT NOT NULL,
    status      TEXT NOT NULL,  -- 'online', 'offline', 'error'
    reason      TEXT
);

-- Query: find devices offline for more than 1 hour
WITH latest_status AS (
    SELECT DISTINCT ON (device_id)
        device_id, status, time
    FROM device_status_changes
    ORDER BY device_id, time DESC
)
SELECT device_id, status, time,
       NOW() - time AS offline_duration
FROM latest_status
WHERE status = 'offline'
  AND time < NOW() - INTERVAL '1 hour';
```

## Alerting on Metrics

### Threshold-Based Alerts

```sql
-- Simple threshold alert query
SELECT device_id, AVG(temperature) AS avg_temp
FROM device_telemetry
WHERE time > NOW() - INTERVAL '5 minutes'
GROUP BY device_id
HAVING AVG(temperature) > 40.0;

-- Rate-of-change alert (temperature rising too fast)
WITH recent AS (
    SELECT
        device_id,
        time_bucket('1 minute', time) AS bucket,
        AVG(temperature) AS avg_temp
    FROM device_telemetry
    WHERE time > NOW() - INTERVAL '10 minutes'
    GROUP BY device_id, bucket
)
SELECT
    device_id,
    (last(avg_temp, bucket) - first(avg_temp, bucket)) AS temp_change,
    first(bucket, bucket) AS period_start,
    last(bucket, bucket) AS period_end
# ... (condensed) ...
    WHERE time > NOW() - INTERVAL '24 hours'
    GROUP BY device_id
)
SELECT d.device_id, d.time, d.temperature, s.mean_temp, s.std_temp
FROM device_telemetry d
JOIN stats s ON d.device_id = s.device_id
WHERE d.time > NOW() - INTERVAL '5 minutes'
  AND ABS(d.temperature - s.mean_temp) > 3 * s.std_temp;
```

## Grafana Integration

### Data Source Configuration

```yaml
# Grafana provisioning: datasources/timescaledb.yaml
apiVersion: 1
datasources:
  - name: TimescaleDB
    type: postgres
    url: timescaledb:5432
    database: iot_data
    user: grafana_reader
    jsonData:
      sslmode: require
      maxOpenConns: 10
      postgresVersion: 1500
      timescaledb: true
    secureJsonData:
      password: ${GRAFANA_DB_PASSWORD}
```

### Optimized Grafana Queries

```sql
-- Template variable for device selection
-- Variable query:
SELECT DISTINCT device_id FROM device_telemetry ORDER BY device_id;

-- Dashboard panel query (uses Grafana's $__timeFilter macro)
SELECT
    $__timeGroupAlias(time, $__interval),
    device_id AS metric,
    AVG(temperature) AS "Temperature"
FROM device_telemetry
WHERE $__timeFilter(time)
  AND device_id IN ($device_id)
GROUP BY 1, 2
ORDER BY 1;

-- Heatmap panel
SELECT
    $__timeGroupAlias(time, '1h'),
    device_id,
    AVG(temperature)
FROM device_telemetry
WHERE $__timeFilter(time)
GROUP BY 1, 2
ORDER BY 1;
```

## Downsampling Strategy

### Multi-Tier Retention

```
Raw data (1-second resolution) -> Keep 7 days
1-minute aggregates            -> Keep 30 days
1-hour aggregates              -> Keep 1 year
1-day aggregates               -> Keep forever
```

```sql
-- TimescaleDB implementation
-- Tier 1: Raw data with 7-day retention
SELECT add_retention_policy('metrics', INTERVAL '7 days');

-- Tier 2: 1-minute continuous aggregate with 30-day retention
CREATE MATERIALIZED VIEW metrics_1min WITH (timescaledb.continuous) AS
SELECT time_bucket('1 minute', time) AS bucket, sensor_id,
       AVG(temperature), MIN(temperature), MAX(temperature), COUNT(*)
FROM metrics GROUP BY bucket, sensor_id;

SELECT add_retention_policy('metrics_1min', INTERVAL '30 days');

-- Tier 3: 1-hour continuous aggregate with 1-year retention
CREATE MATERIALIZED VIEW metrics_1hour WITH (timescaledb.continuous) AS
SELECT time_bucket('1 hour', bucket) AS bucket, sensor_id,
       AVG(avg), MIN(min), MAX(max), SUM(count)
FROM metrics_1min GROUP BY time_bucket('1 hour', bucket), sensor_id;

SELECT add_retention_policy('metrics_1hour', INTERVAL '365 days');
```

## When to Use

**Use this skill when:**
- Designing or implementing timeseries db solutions
- Reviewing or improving existing timeseries db approaches
- Making architectural or implementation decisions about timeseries db
- Learning timeseries db patterns and best practices
- Troubleshooting timeseries db-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Timeseries Db Analysis

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

**Input:** "Help me implement timeseries db for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended timeseries db approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When timeseries db must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
