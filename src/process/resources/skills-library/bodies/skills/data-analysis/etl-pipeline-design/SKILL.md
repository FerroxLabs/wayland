---
name: etl-pipeline-design
description: |
  Designs an ETL pipeline specification covering extract (source, frequency, authentication), transform (cleaning, joins, aggregations), and load (target, format, schema). Produces a pipeline spec document describing data flow logic, not executable code.
  Use when the user asks to design a data pipeline, move data between systems, build an ETL or ELT workflow, or plan a data integration process.
  Do NOT use when building application code that happens to read a database (that is software engineering), designing a data warehouse schema (use data-warehouse-design), or setting up pipeline monitoring (use data-pipeline-monitoring).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "data-science analysis planning"
  category: "data-analysis"
  subcategory: "data-engineering"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---
# ETL Pipeline Design

## When to Use

**Use this skill when:**
- The user needs to design a new data pipeline to move data from one or more source systems into a data warehouse, data lake, data mart, or analytics database
- The user wants to plan an ETL or ELT workflow for a new integration -- including the extraction pattern, transformation logic, and load strategy
- The user needs to document the data flow logic for an existing pipeline that has grown organically and lacks a formal specification
- The user wants to redesign a failing, slow, or brittle pipeline -- one that breaks on schema changes, misses records, or cannot scale
- The user asks how to get data from a specific source type (REST API, relational database, SaaS application, flat files, CDC stream) into their analytics environment
- The user needs to design a backfill strategy to populate historical data in a new target table before enabling an incremental pipeline
- The user is planning a migration from one pipeline architecture to another (e.g., moving from nightly batch ETL to ELT with transformation inside the warehouse)

**Do NOT use when:**
- The user wants application code that reads a database to serve a web request -- that is software engineering, not data engineering
- The user wants to design the target data warehouse schema, dimensional model, or star schema -- use `data-warehouse-design`
- The user wants to set up monitoring, alerting, or observability for a running pipeline -- use `data-pipeline-monitoring`
- The user wants to define data quality rules, expectations, or validation frameworks -- use `data-quality-rules`
- The user wants to design a real-time streaming architecture with Kafka, Flink, or Spark Streaming -- use `streaming-data-architecture` (this skill covers micro-batch down to 5-minute intervals but not true event-time streaming)
- The user wants to evaluate or select a pipeline orchestration tool (Airflow vs. Prefect vs. Dagster) -- use `data-tool-selection`
- The user wants to build a feature store pipeline for ML training -- use `ml-feature-pipeline-design` (ML pipelines have point-in-time correctness and feature freshness requirements that require a separate discipline)

---

## Process

### Step 1 -- Gather Pipeline Context

Before designing anything, establish the full context. Missing information at this stage creates ambiguity that propagates into every downstream decision.

- **Source system(s):** What is each source? (PostgreSQL, MySQL, Salesforce, Stripe API, S3 CSV files, Kafka topic, Snowflake external table, Google Analytics 4 export) -- the source type dictates extraction method, authentication, and latency ceiling
- **Target system:** Where does the data land? (Snowflake, BigQuery, Redshift, Databricks Lakehouse, PostgreSQL analytics replica, S3 data lake) -- the target dictates load strategy, upsert mechanism, and supported data types
- **Business purpose:** Why does this pipeline exist? (executive revenue reporting, customer 360 analytics, ML training data, compliance archive, operational dashboard) -- purpose drives freshness requirements and error tolerance
- **Data volume:** Rows per run, average row size in bytes, total table size at maturity -- this determines whether the pipeline can use simple full-extract patterns or requires incremental extraction with checkpointing
- **Freshness requirement:** How stale can the data be before it creates a business problem? (real-time, 15 minutes, 1 hour, by 6 AM daily, weekly) -- this is the single most important constraint on architecture choices
- **Is this new or a redesign?** If redesign, ask what broke, what the current architecture is, and whether backward compatibility with the target schema is required
- **Data sensitivity:** Does the pipeline touch PII, PHI, PCI-scoped data, or trade secrets? -- determines whether masking, tokenization, or field-level encryption must be included in the transform step

### Step 2 -- Design the Extract Step

The extract design must handle source-specific mechanics, authentication, extraction patterns, and failure modes for every source individually.

**Choose the extraction pattern first -- this is the most consequential decision in the extract design:**
- **Full extract** (truncate source and pull everything): Simple, no state management, but unsustainable beyond ~5 million rows or when extraction time exceeds the available window. Use for small, slowly changing reference tables.
- **Incremental by timestamp** (pull records where updated_at > last_run_max_updated_at): Works for most OLTP databases and many APIs. Requires a reliable, indexed updated_at column. Risk: records with backdated timestamps are missed. Mitigation: add a 30--60 minute lookback window (pull records where updated_at > last_run_max_updated_at - 60 minutes) and deduplicate in the transform step.
- **Incremental by auto-increment ID** (pull records where id > last_run_max_id): Safe for insert-only tables with no updates. Simple state management. Fails for tables with updates or deletes.
- **Change Data Capture (CDC)**: Reads the database transaction log (binlog for MySQL, WAL for PostgreSQL, redo log for Oracle) to capture every insert, update, and delete as an event. Zero impact on source query load, captures deletes (impossible with timestamp-based approaches), but requires replication slots, log retention configuration, and a CDC tool (Debezium is the standard open-source option). Use when you need deletes, sub-minute latency, or cannot query the source OLTP database directly.
- **API cursor pagination**: For REST APIs, never use offset pagination (page 1, page 2, page 3) for large datasets -- records shift between pages during extraction. Use cursor-based pagination (next_cursor from response header or body) and store the cursor as pipeline state.

**For each source, document:**
- Connection endpoint, port, database/schema name
- Authentication method: service account with IAM role (preferred for cloud), Vault-managed credential, OAuth2 client credentials, API key in [SECRETS_MANAGER] -- never inline credentials
- The exact SQL query or API endpoint for extraction, including the incremental filter predicate
- Field list with source data types -- do not extract columns the pipeline does not use (column pruning reduces extraction load)
- Extraction schedule as a cron expression (e.g., 0 2 * * * for 2 AM UTC daily) or event trigger
- Retry policy: minimum 3 retries with exponential backoff starting at 5 seconds; cap at 3--5 minutes per retry; log each attempt with timestamp and error code
- Schema drift handling: what the pipeline does when a source column is added, dropped, or changes type (see Edge Cases)

### Step 3 -- Design the Transform Step

Transforms are the logic core of the pipeline. Every transform must be named, sequenced, and independently testable.

**Sequence transforms in this canonical order for correctness and performance:**
1. **Filter early** -- eliminate rows that will never reach the target as early as possible. Filtering before joins reduces join input size dramatically. Example: filter to status IN ('active', 'completed') before joining to a customer dimension.
2. **Clean next** -- handle nulls, cast types, normalize strings, fix encoding. Do this before derived field calculations to avoid null propagation errors.
3. **Join** -- combine sources using explicit join keys and join types. Always document whether a join is INNER (drops unmatched rows -- verify this is intentional), LEFT (keeps all left rows -- document what null right-side values mean), or FULL OUTER. Fanout risk: joins on non-unique keys multiply rows -- always verify join cardinality with row counts before and after.
4. **Deduplicate** -- after joins, duplicates may have been introduced. Deduplicate by the natural key keeping the most recent record by updated_at or a version field.
5. **Aggregate** -- only after cleaning and deduplication. Aggregating dirty or duplicated data produces wrong numbers.
6. **Derive calculated fields** -- computed columns (e.g., gross_margin = (revenue - cogs) / revenue) go last because they depend on cleaned, aggregated data.
7. **Conform dimensions** -- map source-specific codes to enterprise-standard values (ISO country codes, canonical status labels, standard currency codes). This step makes the data joinable to other pipelines.

**For each transform step, document:**
- Step ID (T1, T2, T3...), operation type, input fields/tables, output fields, and explicit logic (SQL expression, formula, or business rule)
- Null handling decisions are business decisions, not technical defaults -- document why each null is replaced with a specific value
- For currency conversion, always specify the exchange rate source, the conversion date logic (use trade date, not load date), and how to handle missing exchange rates
- For string normalization: UPPER() vs. LOWER(), TRIM() on all string fields, remove non-printable characters, handle encoding differences between sources (UTF-8, Latin-1, CP1252)

**ELT vs. ETL choice:**
- **ETL** (transform before load): Use when the target system is expensive per-query (e.g., Redshift on a small cluster), when PII must be masked before it touches the target, or when the transform logic requires imperative code (Python, Spark) rather than SQL
- **ELT** (load raw, transform inside warehouse): Use when the target is a modern columnar warehouse (BigQuery, Snowflake, Databricks) with abundant compute, when you want raw data preserved for replay, or when transform logic changes frequently (easier to rebuild a SQL view than re-run an ETL pipeline). In ELT, the Extract and Load steps move raw data, and a SQL transformation layer (dbt is the standard tool) runs inside the warehouse.

### Step 4 -- Design the Load Step

The load strategy is the second most consequential decision after the extraction pattern. Choosing the wrong one corrupts data or destroys performance.

**Load strategy decision framework:**

| Strategy | When to Use | Risk | Performance |
|---|---|---|---|
| Truncate and reload | Small tables (<1M rows), no concurrent readers, simple | Downtime during load; lose data if load fails | Fast for small tables |
| Append only | Insert-only event tables, log data, immutable facts | Duplicates accumulate if pipeline reruns | Fastest insert performance |
| Upsert / MERGE | Most dimension and fact tables; handles updates + inserts | Slower than append; requires a reliable primary key | Moderate |
| Partition swap | Large fact tables partitioned by date; replace one day's partition at a time | Requires partitioned target table design | Fastest for large tables |
| Swap table | Any size; load into staging table, validate, then rename | Brief lock during rename; requires staging table | Best for zero-downtime |

**For the load design, document:**
- Target schema and table name (fully qualified: database.schema.table)
- Primary key or natural key for upsert operations
- All indexes: cluster keys (for Snowflake), sort keys (for Redshift), ZORDER BY (for Databricks Delta), or B-tree/BRIN indexes (for PostgreSQL)
- Whether the target uses partitioning and by what column
- The exact MERGE key (for upsert) -- composite keys of (source_system_id, record_id) are safer than single-column keys when merging from multiple sources
- Soft delete handling: when a record disappears from the source, does the pipeline set is_deleted = true and deleted_at = CURRENT_TIMESTAMP, or hard-delete it from the target?
- Metadata columns to add on load: _loaded_at TIMESTAMP (when the record was loaded), _source_system VARCHAR (which source it came from), _pipeline_run_id VARCHAR (for lineage tracing)

### Step 5 -- Define Post-Load Validation

Post-load validation is not optional. It is the gate between a pipeline run completing and the data being usable.

**Standard validation checks every pipeline must have:**
- **Row count delta check:** Compare the row count of the target after load to the row count before load. Alert if the delta is outside an expected range (e.g., more than 3x the average daily delta or a decrease in total rows when only inserts were expected). Express the threshold in percentage terms so it scales as data grows.
- **Null check on NOT NULL columns:** Any NOT NULL column with nulls is a pipeline defect. This should cause a hard failure -- halt the pipeline and alert.
- **Freshness check:** Verify the maximum value of the created_at or updated_at field in the loaded data matches the expected extraction window. Stale data in the target is often caused by a silent extract failure that loaded zero new rows without error.
- **Duplicate primary key check:** After upsert, verify no duplicate values exist on the primary key. Run SELECT primary_key, COUNT(*) GROUP BY primary_key HAVING COUNT(*) > 1 -- result should be empty.
- **Referential integrity check:** If the target table has a foreign key to another table, verify that all loaded foreign key values exist in the parent table.
- **Numeric sanity check:** For revenue, counts, or other measurable KPIs, define a plausible range based on historical data. Revenue for a business doing $1M/day should not load as $0 or $1B -- both indicate data errors.

**Validation failure actions must be specific -- never just "alert":**
- Row count drop of 50%+ or zero new rows: Halt pipeline, alert, do NOT update the pipeline state watermark (the next run will re-extract the same window)
- NOT NULL violation: Rollback the load (or swap back to pre-load table), alert with sample violating rows
- Duplicate primary key: Alert and investigate -- do not rollback if data is otherwise valid, but this must be resolved before the next run

### Step 6 -- Define Orchestration and Dependencies

- **DAG structure:** Map the dependency graph explicitly. Which steps can run in parallel? Which must be sequential? Extract steps for independent sources can almost always run in parallel. The transform step cannot start until all extracts it depends on are complete.
- **Retry policy:** Define retries at the step level, not just the pipeline level. A transient API timeout on the extract should retry the extract only, not re-run the entire pipeline. Recommended: 3 retries, exponential backoff (30s, 120s, 300s), then alert and stop.
- **Timeout:** Set timeouts at both the step level and the pipeline level. A pipeline with no timeout will hang indefinitely on a hung database connection. As a starting point: extract timeout = 2x the average extract duration, transform = 3x average (transform runtimes are more variable), total pipeline = 1.5x the sum of individual step timeouts.
- **Pipeline dependencies:** Document upstream dependencies (other pipelines that must complete before this one starts) and downstream dependencies (pipelines or BI refreshes that depend on this one completing). Use a sensor or dependency check in the orchestrator rather than hard-coding start times.
- **Idempotency:** The pipeline must produce the same result if run twice for the same time window. This requires: the load step handles re-insertion gracefully (upsert or truncate, not append), the pipeline state watermark is only advanced after successful post-load validation, and any intermediate staging tables are cleared at the start of each run.
- **Parameterization:** Design the pipeline to accept a run date or date range as a parameter. This enables backfill, retry for a specific day, and testing on historical data.

### Step 7 -- Assess ELT vs. ETL and Tooling Recommendations

- For warehouses with strong SQL compute (Snowflake, BigQuery, Databricks), recommend ELT: extract and load raw data using a dedicated ingestion tool (Fivetran, Airbyte, or custom), then transform using dbt inside the warehouse. This separates concerns cleanly.
- For pipelines requiring PII masking, complex Python logic, or multi-source joins across systems that are not in the same warehouse, ETL with a Python-based pipeline (Airflow + Pandas/PySpark, Prefect, Dagster) is appropriate.
- Note the tool recommendation but do not design the pipeline around a specific tool -- the spec should be tool-agnostic so it can be implemented in any orchestrator.

### Step 8 -- Produce the Pipeline Specification Document

Compile all design decisions from Steps 1--7 into the complete specification using the Output Format below. Every field in the spec should be filled with real values -- no placeholders that say "TBD" or "to be determined." If a decision cannot be made without more information, note the open question explicitly and state the assumption made to proceed.

---

## Output Format

```
## ETL Pipeline Specification: [Pipeline Name]

### Overview

| Property | Value |
|---|---|
| Pipeline name | [descriptive_snake_case_name] |
| Purpose | [Business reason -- what decision or product does this data support] |
| Pattern | [ETL / ELT / Hybrid] |
| Source system(s) | [List all sources] |
| Target system | [Fully qualified target: warehouse.schema.table] |
| Schedule | [Cron expression] e.g., 0 3 * * * (3:00 AM UTC daily) |
| Freshness SLA | [Maximum acceptable age of data in target at any point in time] |
| Estimated volume | [Rows/run and bytes/run; expected 12-month growth rate] |
| Data sensitivity | [PII / PCI / PHI / Internal / Public] |
| Pipeline version | [1.0] |
| Owner | [Team or individual] |
| Last updated | [Date] |

---

### Extract

#### Source [N]: [Source Name]

| Property | Value |
|---|---|
| System type | [PostgreSQL 15 / Salesforce REST API / S3 CSV / Kafka topic / etc.] |
| Connection endpoint | [hostname:port/database or API base URL -- no credentials] |
| Authentication | [Method: e.g., IAM role arn:aws:iam::[ACCOUNT_ID]:role/[ROLE_NAME] or Vault path: secret/data/pipelines/[SOURCE_NAME]] |
| Extraction pattern | [Full extract / Incremental by timestamp / Incremental by ID / CDC] |
| Incremental key | [Field name, data type, index status: e.g., updated_at TIMESTAMP WITH TIME ZONE, indexed] |
| Lookback window | [e.g., 60 minutes -- re-extract records updated in the last 60 minutes of the previous window to catch delayed writes] |
| Extraction query / endpoint | [SQL SELECT statement or API endpoint + query params, with incremental filter] |
| Pagination | [None / Cursor-based (field: next_cursor) / Keyset (field: id > last_id)] |
| Schedule | [Cron: 0 2 * * * -- daily at 02:00 UTC] |
| Expected row count | [~N rows per run] |
| Error handling | [Retry policy: 3 retries, backoff 30s/120s/300s; on exhaustion: alert + skip run without advancing watermark] |
| Schema drift handling | [New columns: log and continue. Dropped required columns: halt and alert. Type change: halt and alert.] |

**Fields extracted:**

| Field Name | Source Type | Required | Notes |
|---|---|---|---|
| [field_name] | [source_type] | Y/N | [Any relevant notes: PII flag, known data quality issues, business definition] |

---

### Transform

**Transformation sequence:**

| Step ID | Operation | Input Fields / Tables | Output Fields | Logic |
|---|---|---|---|---|
| T1 | [Filter] | [table/fields] | [output fields] | [Exact filter predicate: e.g., WHERE status IN ('active','completed') AND deleted_at IS NULL] |
| T2 | [Type cast] | [fields] | [typed fields] | [e.g., CAST(total_price AS DECIMAL(12,2)), CAST(created_at AS TIMESTAMP_NTZ)] |
| T3 | [Null handling] | [fields] | [cleaned fields] | [e.g., COALESCE(country_code, 'UNKNOWN'), COALESCE(email, 'no-email@placeholder.invalid')] |
| T4 | [Join] | [table_a, table_b on key] | [merged fields] | [Join type, join keys, cardinality expectation: 1:1 or N:1. Note if fanout is expected.] |
| T5 | [Deduplicate] | [table + key fields] | [deduped rows] | [ROW_NUMBER() OVER (PARTITION BY [natural_key] ORDER BY updated_at DESC) -- keep rank 1] |
| T6 | [Aggregate] | [fields + GROUP BY] | [aggregated fields] | [GROUP BY dimensions; measures: SUM, COUNT, AVG with explicit NULL handling] |
| T7 | [Derive] | [cleaned fields] | [new computed fields] | [Formula: e.g., gross_margin = (revenue - cogs) / NULLIF(revenue, 0)] |
| T8 | [Conform] | [code fields] | [standardized fields] | [Mapping table or CASE expression: e.g., CASE WHEN source_status = 'COMP' THEN 'completed'] |

**Transformation order rationale:** [Explain why this specific sequence -- not a template explanation, a real explanation for THIS pipeline's logic]

**ELT note (if applicable):** [If transforms run inside the warehouse using dbt or SQL, note the model name and layer: e.g., dbt model orders_daily_agg in the marts layer]

---

### Load

| Property | Value |
|---|---|
| Target table | [warehouse.schema.table_name] |
| Load strategy | [Truncate-reload / Append / Upsert-MERGE / Partition swap / Swap table] |
| MERGE key (if upsert) | [Column(s): e.g., (source_system, order_id)] |
| Partition column (if partitioned) | [e.g., DATE(created_at) -- daily partitions] |
| Soft delete strategy | [Set is_deleted = true + deleted_at = CURRENT_TIMESTAMP when record absent from source extract] |

**Target schema:**

| Column Name | Data Type | Nullable | Default | Source Mapping | Notes |
|---|---|---|---|---|---|
| [col_name] | [type] | Y/N | [default or --] | [T-step or source field] | [PII flag, index, partition key] |
| _loaded_at | TIMESTAMP_NTZ | N | CURRENT_TIMESTAMP | Pipeline metadata | Audit column |
| _source_system | VARCHAR(50) | N | '[source_name]' | Pipeline metadata | Audit column |
| _pipeline_run_id | VARCHAR(36) | N | [UUID per run] | Pipeline metadata | Lineage column |

**Cluster / sort keys:** [e.g., Snowflake: CLUSTER BY (order_date, customer_id)]

---

### Post-Load Validation

| Check ID | Check Description | Query / Method | Expected Result | Action on Failure |
|---|---|---|---|---|
| V1 | Row count delta | COUNT(*) vs. prior run | Delta within [N]% of 7-day avg delta | Alert + do NOT advance watermark |
| V2 | NOT NULL violation on [field] | COUNT(*) WHERE [field] IS NULL | 0 | Halt, rollback load, alert with sample rows |
| V3 | Duplicate primary key | COUNT - COUNT(DISTINCT pk) | 0 | Alert + investigate; block downstream |
| V4 | Freshness | MAX(updated_at) in target | > run_start_time - 2 hours | Alert: possible silent extract failure |
| V5 | Numeric sanity: [metric] | SUM([revenue_col]) WHERE order_date = today | Between [$LOW] and [$HIGH] | Alert with actual value for human review |
| V6 | Referential integrity | LEFT JOIN to [parent_table] WHERE parent.id IS NULL | 0 orphan rows | Alert; optionally quarantine orphan rows |

---

### Pipeline DAG

```
[Source 1 Extract (parallel)] ──────────────────────────────────────────────────────┐
                                                                                      ▼
[Source 2 Extract (parallel)] ──> [Wait: All Extracts Complete] ──> [T1: Filter] ──> [T2: Clean]
                                                                                      │
[Exchange Rate Lookup] ──────────────────────────────────────────────────────────────┘
                                                                      ▼
                                                           [T3: Join] ──> [T4: Dedup] ──> [T5: Derive]
                                                                                               │
                                                                                               ▼
                                                                                          [Load: MERGE]
                                                                                               │
                                                                                               ▼
                                                                               [Post-Load Validation]
                                                                                               │
                                                            ┌──────────────────────────────────┤
                                                            │ PASS: Advance watermark           │ FAIL: Alert + halt
                                                            ▼                                   ▼
                                                  [Downstream Trigger]               [Dead Letter Queue]
```

---

### Orchestration

| Property | Value |
|---|---|
| Recommended tool | [Airflow / Prefect / Dagster / dbt Cloud / tool-agnostic] |
| DAG / flow name | [snake_case_dag_name] |
| Retry policy | [3 retries per step; backoff: 30s, 120s, 300s] |
| Step timeout | [Extract: Xm, Transform: Xm, Load: Xm] |
| Total pipeline timeout | [Xm] |
| SLA breach alert | [If pipeline not complete by [time], alert [channel]] |
| Failure notification | [Slack #[channel] + email [team]; include: step name, error message, run_id, run timestamp] |
| Rollback strategy | [Specific: e.g., MERGE is transactional in Snowflake -- re-run is safe. Or: restore staging table backup.] |
| Idempotency guarantee | [How the pipeline handles being run twice for the same window] |
| Upstream dependencies | [Pipeline names or tables that must be current before this pipeline runs] |
| Downstream dependents | [Pipelines, dbt models, or BI refreshes triggered after this pipeline succeeds] |
| Backfill procedure | [How to run with --start-date and --end-date parameters to load historical data] |

---

### Open Questions

| # | Question | Impact | Assumption Made |
|---|---|---|---|
| 1 | [Unanswered design question] | [What breaks if wrong] | [What the spec assumes pending answer] |
```

---

## Rules

1. **Never inline credentials.** API keys, passwords, connection strings, and OAuth tokens must reference a secrets manager path (e.g., Vault: secret/data/pipelines/salesforce_client_secret) or an environment variable name. A pipeline spec that contains real credentials will be committed to version control. This is a non-negotiable security rule.

2. **The transformation order determines correctness.** Apply this canonical sequence: filter, clean, join, deduplicate, aggregate, derive, conform. Aggregating before deduplication inflates metrics. Joining before filtering wastes compute and risks Cartesian products on unfiltered data. Deriving calculated fields before cleaning propagates nulls into computed columns. Document the order explicitly and explain why.

3. **Every incremental pipeline must define a lookback window.** Never extract records where updated_at > exact_last_watermark. Source systems have delayed writes (OLTP transactions that commit late, batch processes that backdate records). A 30--60 minute lookback window re-extracts the overlap zone and deduplicates in the transform step. Without a lookback window, delayed records are permanently missed.

4. **Every pipeline must be idempotent.** Running the pipeline twice for the same time window must produce the same target state. Append-only pipelines that do not deduplicate are not idempotent. Test idempotency by running the pipeline twice in a row and verifying row counts and values are identical after both runs.

5. **The watermark is only advanced after successful post-load validation.** If validation fails, the pipeline halts and the watermark stays at its previous value. The next run will re-extract the same time window. This ensures missed or invalid data is retried, not silently skipped. Implement the watermark update as the very last step, after all validation checks pass.

6. **Define a soft delete strategy for every table with source deletes.** Timestamp-based incremental extraction cannot detect deletes -- a record deleted from the source will never appear in an incremental extract. Either implement CDC (which captures delete events from the transaction log), run a periodic full-refresh delta check (compare source IDs to target IDs and flag orphans as soft-deleted), or explicitly document that the pipeline does not capture deletes and explain why this is acceptable.

7. **Document join cardinality and fanout risk.** Every join must specify the expected cardinality (1:1, N:1, N:M). A join that unexpectedly becomes N:M multiplies row counts silently and inflates aggregated metrics. Add a row count check immediately after joins that should be N:1 -- if the row count increases, the join has a data quality problem that must be caught before aggregation.

8. **Numeric sanity checks must use real business-calibrated thresholds.** A sanity check that says "revenue should be a positive number" catches almost nothing. Calibrate thresholds to 3 standard deviations from the trailing 30-day mean for continuous metrics, or document the lower and upper plausible bounds explicitly based on business knowledge. Update these thresholds quarterly as the business scales.

9. **Schema drift must have a defined response for each drift type.** New column added: log and continue (additive changes are safe). Column renamed: halt and alert (indistinguishable from a deletion). Column dropped: halt and alert (downstream queries will fail). Data type widened (INT to BIGINT): log and continue. Data type narrowed or changed (VARCHAR to DATE): halt and alert. These rules must be explicit in the spec, not left as "handle at implementation time."

10. **Pipeline specs describe logic, not code.** The spec documents what transformations happen, in what order, with what business logic. It does not specify Spark transformations, Python functions, or SQL syntax unless the SQL is the clearest way to express the logic. The spec must be readable and verifiable by a data analyst or a business stakeholder, not just an engineer.

11. **ELT pipelines must preserve raw data before transformation.** When using ELT, load the raw, unmodified source data into a raw or landing layer first. Transformations run on top of the raw layer. This preserves the ability to replay transformations when business logic changes, without re-extracting from the source. Document the raw table name alongside the transformed table name.

12. **Partitioned tables require a partition pruning strategy.** For tables partitioned by date, the MERGE or load step must target only the affected partitions, not scan the entire table. Document the partition granularity (daily, monthly), the partition column, and explicitly note if historical partitions can be updated (this affects the MERGE key design).

---

## Edge Cases

### Multiple Source Systems with Different Latencies and Schedules

When joining data from two sources that refresh at different rates (e.g., orders from a real-time API and product catalog from a nightly file export), the pipeline must account for stale lookups. Design the extract steps to run independently with their own schedules. The join step should use the most recently available version of the slower source, not wait indefinitely for it to refresh. Document the maximum acceptable staleness for each source in the spec, and add a pre-transform check: if the slower source has not been refreshed within its SLA, halt the pipeline rather than joining stale catalog data to fresh orders. Never silently use stale data.

### Source API with Rate Limits

Calculate the worst-case extraction time: (total records to extract) / (page size) * (seconds per request). For a Stripe API with a 100-request-per-second rate limit and 250 records per page, extracting 500,000 records requires 2,000 API calls -- which at 100 req/sec takes 20 seconds in theory but is often 3--5 minutes in practice due to response latency. If this exceeds the extraction time window, you have three options: (1) negotiate a higher rate limit with the provider, (2) split extraction across multiple API keys if the provider allows it, or (3) switch to a provider-provided bulk export (most SaaS platforms offer nightly data exports via S3 or SFTP that bypass API rate limits). Always design with cursor-based checkpoint resumption: if the extraction is interrupted, resume from the last successful cursor, not from page 1. Store the cursor in the pipeline state table.

### Schema Evolution in the Source Database

OLTP databases evolve constantly -- columns are added, renamed, or removed by application deployments. Design a pre-extraction schema validation step that compares the source table's current column list and types against the documented data contract in the pipeline spec. Run this as the first step, before any data is extracted. Implement it as a lightweight query (SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'orders') and compare the result to the expected schema stored in the pipeline configuration. If validation passes, proceed. If not, halt and alert with a diff of expected vs. actual. This prevents corrupt data from reaching the target -- a missed column means missing data in the target; a type change means load failures or silent numeric errors.

### Target Table Has Concurrent Readers During the Load Window

If analysts, BI dashboards, or other pipelines query the target table during the load, a MERGE operation will hold row-level locks that degrade query performance or cause query timeouts. For Snowflake and BigQuery, MERGE operations are transactional and atomic -- readers see either the pre-merge or post-merge state, never a partial state. For PostgreSQL-based targets, use the swap-table pattern: load into analytics.orders_staging, validate, then execute BEGIN; ALTER TABLE analytics.orders RENAME TO orders_old; ALTER TABLE analytics.orders_staging RENAME TO orders; DROP TABLE orders_old; COMMIT; -- this is atomic and holds the table lock for milliseconds, not minutes. Document which pattern is used and whether the target warehouse supports atomic MERGE.

### Historical Backfill Alongside Live Incremental Pipeline

Backfill introduces two risks: (1) it overwrites data that the incremental pipeline has already loaded, and (2) it runs concurrently with the incremental pipeline and creates race conditions. Design the backfill as a separate parameterized pipeline mode with --start-date and --end-date arguments. Before running backfill, pause the incremental pipeline. Run backfill in date-range chunks (monthly is typically the right granularity) rather than loading all historical data in one run -- this makes failures recoverable without re-processing years of data. Use the same transform and load logic as the incremental pipeline (share the transformation code). After backfill completes, verify the row counts by month match the source, then re-enable the incremental pipeline. For partition-based targets, backfill and incremental can operate on separate partitions and run concurrently -- document this explicitly if using a partitioned load strategy.

### PII and Sensitive Data in the Pipeline

When source data contains PII (customer names, email addresses, phone numbers), PHI (health information), or PCI data (credit card numbers, CVVs), the pipeline spec must include a masking or tokenization step in the transform section. Document: (1) which fields contain sensitive data, (2) the masking technique (hash with SHA-256 + salt for pseudonymization, format-preserving encryption for PCI, nullification for fields not needed in analytics), (3) at what transform step masking is applied (apply it as early as possible -- ideally immediately after extraction before the data is staged anywhere), and (4) whether the pipeline ever writes unmasked data to any intermediate storage (staging tables, S3 temporary files, orchestrator logs). The pipeline spec must explicitly state that raw credentials, full PAN, and unmasked PII never appear in logs, alert messages, or intermediate storage locations.

### Soft Deletes and Delete Propagation

Many OLTP systems use soft deletes (a deleted_at column or an is_active flag) rather than physically removing rows. Incremental extraction by updated_at captures soft deletes because the updated_at timestamp changes when a record is soft-deleted. Hard deletes (physical row removal) are invisible to incremental extraction. For tables where hard deletes occur, implement one of these strategies: (1) periodic full-extract reconciliation -- once per week or month, do a full extract of source IDs and compare to the target; records in the target but not the source have been hard-deleted; mark them as is_deleted = true with deleted_at = reconciliation_run_time; (2) CDC, which captures DELETE events from the transaction log; or (3) explicitly document that hard deletes are not captured, the business impact of this gap, and get sign-off from the data owner. Never silently fail to propagate deletes -- stale records in the target cause inflated counts and incorrect customer states.

### Pipeline Fan-out: One Source, Multiple Targets

Some pipelines need to load the same source data into multiple targets simultaneously (e.g., load Salesforce Opportunities into both the analytics warehouse and an ML feature store). Design a single extract step and branch the transform and load steps per target. Do not extract from the source multiple times for multiple targets -- this doubles the source load and introduces the risk of the two extracts capturing different data if records change between runs. In the DAG, the extract output fans out to multiple parallel transform-and-load branches. Define validation and success criteria for each target independently -- a failure in the feature store load should not roll back a successful warehouse load, but both failures should be reported.

---

## Example

**User Input:** "We need to design a pipeline to pull subscription and payment data from our Stripe account into our BigQuery data warehouse. We have about 50,000 active subscriptions, run about 2,000 payment events per day, and need the data available by 7 AM Pacific for the finance team's daily reconciliation report."

---

## ETL Pipeline Specification: Stripe Payments and Subscriptions to BigQuery

### Overview

| Property | Value |
|---|---|
| Pipeline name | stripe_billing_to_bigquery |
| Purpose | Load daily Stripe subscription and payment data into BigQuery for finance reconciliation, revenue recognition, and subscription analytics. Powers the daily 7 AM finance reconciliation report. |
| Pattern | ELT -- extract raw JSON to BigQuery raw layer; transform using BigQuery SQL inside the warehouse |
| Source system(s) | Stripe REST API v2 (Charges endpoint, Subscriptions endpoint, Customers endpoint) |
| Target system | BigQuery: analytics_prod.finance.stripe_payments_daily (transformed), analytics_prod.raw.stripe_charges (raw), analytics_prod.raw.stripe_subscriptions (raw) |
| Schedule | Extract + Load: 0 2 * * * (2:00 AM Pacific daily) -- leaves 5 hours before the 7 AM report deadline. Transform: triggered by successful load completion. |
| Freshness SLA | Stripe charges updated through 11:59 PM Pacific of the prior day must be visible in BigQuery by 6:00 AM Pacific |
| Estimated volume | ~2,000 charge events/day (~8 KB per charge with nested metadata), ~500 subscription changes/day, ~100 customer updates/day |
| Data sensitivity | PCI-scoped (partial card data), PII (customer name, email). Masking required before writing to transformed layer. |
| Pipeline version | 1.0 |
| Owner | Data Engineering team |
| Last updated | [Date of spec creation] |

---

### Extract

#### Source 1: Stripe Charges API

| Property | Value |
|---|---|
| System type | Stripe REST API v2 |
| Connection endpoint | https://api.stripe.com/v1/charges |
| Authentication | Stripe restricted API key (read-only, Charges scope) stored in GCP Secret Manager: projects/[PROJECT_ID]/secrets/stripe_api_key_readonly/versions/latest |
| Extraction pattern | Incremental by timestamp + cursor pagination |
| Incremental key | created (Unix timestamp); filter: created >= (last_run_watermark - 3600) to apply 1-hour lookback |
| Lookback window | 60 minutes -- Stripe webhooks and late-posting bank events can cause charges to appear with a created timestamp up to 45 minutes behind the actual API response time |
| Extraction query / endpoint | GET /v1/charges?limit=100&created[gte]=[watermark_minus_1hr]&created[lte]=[run_start_unix] |
| Pagination | Cursor-based: use starting_after=[last_charge_id] from each response. Store the last processed charge ID in pipeline state table bigquery: analytics_prod.pipeline_state.stripe_charges_cursor |
| Schedule | 0 2 * * * Pacific (02:00 AM Pacific = 10:00 AM UTC) |
| Expected row count | ~2,100 charges/day (2,000 new + 100 updates in lookback window) |
| Error handling | Retry 3x with backoff: 30s, 120s, 300s. On HTTP 429: honor Retry-After header (typically 30--60s for Stripe). On 5xx: retry. On 4xx except 429: halt and alert (auth or endpoint misconfiguration). On exhaustion: alert Slack #finance-data-alerts + PagerDuty (finance pipeline failure), skip run WITHOUT advancing watermark. |
| Schema drift handling | Stripe adds fields without versioning. New top-level fields: log to pipeline_metadata.schema_changes and continue. Removal of expected required field (id, amount, currency, status, created): halt and alert immediately. |

**Fields extracted:**

| Field Name | Source Type | Required | Notes |
|---|---|---|---|
| id | string | Y | Stripe charge ID, format: ch_[alphanumeric] |
| amount | integer | Y | Amount in smallest currency unit (cents for USD) |
| amount_captured | integer | Y | May differ from amount for partial captures |
| amount_refunded | integer | Y | Cumulative refund amount |
| currency | string | Y | ISO 4217 lowercase (usd, eur, gbp) |
| status | string | Y | succeeded, pending, failed |
| created | integer | Y | Unix timestamp -- incremental key |
| customer | string | N | Stripe customer ID (null for one-time charges) |
| invoice | string | N | Stripe invoice ID (null for non-subscription charges) |
| payment_intent | string | Y | Stripe payment intent ID |
| failure_code | string | N | Stripe failure code if status=failed |
| failure_message | string | N | PII risk: may contain bank-provided messages with card details |
| billing_details.email | string | N | PII: customer email -- mask in transform layer |
| billing_details.name | string | N | PII: cardholder name -- mask in transform layer |
| card.brand | string | N | visa, mastercard, amex, etc. |
| card.last4 | string | N | Last 4 digits only -- PCI compliant to store |
| card.exp_month | integer | N | |
| card.exp_year | integer | N | |
| metadata | object | N | Arbitrary key-value pairs set by the application -- load as JSON string |
| livemode | boolean | Y | Must be true -- filter out test mode charges in T1 |

#### Source 2: Stripe Subscriptions API

| Property | Value |
|---|---|
| System type | Stripe REST API v2 |
| Connection endpoint | https://api.stripe.com/v1/subscriptions |
| Authentication | Same restricted API key as Source 1 -- GCP Secret Manager |
| Extraction pattern | Incremental by timestamp |
| Incremental key | current_period_end (Unix timestamp) -- captures subscriptions entering a new period; supplemented by secondary extract on status = 'canceled' with canceled_at >= watermark |
| Schedule | Same as Source 1: 0 2 * * * Pacific |
| Expected row count | ~500 subscription events/day |
| Error handling | Same retry and alerting policy as Source 1 |

**Fields extracted:**

| Field Name | Source Type | Required | Notes |
|---|---|---|---|
| id | string | Y | Stripe subscription ID, format: sub_[alphanumeric] |
| customer | string | Y | Stripe customer ID -- join key to customers |
| status | string | Y | active, past_due, canceled, trialing, unpaid, incomplete |
| current_period_start | integer | Y | Unix timestamp |
| current_period_end | integer | Y | Unix timestamp -- incremental key |
| canceled_at | integer | N | Unix timestamp; present when status=canceled |
| plan.id | string | Y | Stripe plan/price ID |
| plan.amount | integer | Y | Recurring charge amount in cents |
| plan.currency | string | Y | ISO 4217 |
| plan.interval | string | Y | month, year, week |
| quantity | integer | Y | Seat count or quantity multiplier |
| metadata | object | N | Application-defined tags -- load as JSON string |

---

### Transform

**Transformation sequence (runs inside BigQuery using SQL after raw load completes):**

| Step ID | Operation | Input Fields / Tables | Output Fields | Logic |
|---|---|---|---|---|
| T1 | Filter test data | raw.stripe_charges | livemode = true charges only | WHERE livemode = true -- exclude all Stripe test mode charges (livemode = false) which exist in the same API response |
| T2 | Type cast + unit conversion | amount, amount_captured, amount_refunded, created | amount_usd, created_at | ROUND(amount / 100.0, 2) for all monetary fields (Stripe stores in cents); TIMESTAMP_SECONDS(created) for all Unix timestamps |
| T3 | PII masking | billing_details.email, billing_details.name, failure_message | email_hash, name_hash, failure_message_masked | email_hash = TO_HEX(SHA256(LOWER(TRIM(billing_details.email)) || [SALT_FROM_SECRET_MANAGER])); name_hash = TO_HEX(SHA256(billing_details.name || [SALT])); failure_message: replace content with 'REDACTED' in transformed layer -- preserve in raw layer behind column-level access control |
| T4 | Currency normalization | currency, amount_usd | amount_usd_normalized | For non-USD charges: JOIN to analytics_prod.reference.exchange_rates on currency + DATE(created_at); multiply amount_usd by rate. Exchange rate source: European Central Bank daily rates loaded by a separate pipeline. If exchange rate is missing for a currency + date combination: use the most recent available rate for that currency and log a warning to pipeline_metadata.exchange_rate_warnings |
| T5 | Join subscription context | stripe_charges.invoice, stripe_subscriptions.id | subscription_id, plan_id, plan_interval, subscription_status | LEFT JOIN raw.stripe_subscriptions ON charges.invoice = subscriptions.latest_invoice. Cardinality: N:1 (many charges per subscription). A charge with invoice IS NULL is a one-time charge -- subscription columns will be null; this is expected. |
| T6 | Deduplicate | (id, created_at) -- the charge ID is globally unique in Stripe | One row per charge ID | ROW_NUMBER() OVER (PARTITION BY id ORDER BY _loaded_at DESC) -- keep rank 1. Duplicates arise from the 60-minute lookback window overlap. |
| T7 | Derive calculated fields | amount_usd_normalized, amount_refunded | net_amount_usd, is_refunded, is_failed, charge_date | net_amount_usd = amount_usd_normalized - ROUND(amount_refunded / 100.0, 2); is_refunded = CASE WHEN amount_refunded > 0 THEN true ELSE false END; is_failed = CASE WHEN status = 'failed' THEN true ELSE false END; charge_date = DATE(created_at, 'America/Los_Angeles') -- use Pacific time for finance reconciliation alignment |
| T8 | Conform status codes | status | status_normalized | Stripe statuses are already lowercase English strings -- no normalization needed. Add status_category: 'successful' for status='succeeded', 'in_progress' for status='pending', 'failed' for status='failed' |

**Transformation order rationale:** Filter test data (T1) immediately to prevent test charges contaminating any downstream step. Type cast (T2) before all calculations because monetary math on integers in cents causes downstream confusion. Mask PII (T3) before any join or staging that might write intermediate results -- PII must never appear in the transformed layer. Currency normalization (T4) before aggregation to ensure all amounts are in the same unit. Join subscription context (T5) before deduplication so the dedup comparison includes all fields. Dedup (T6) before derived fields so calculated fields are based on unique records only.

**ELT note:** Raw JSON from Stripe is loaded to analytics_prod.raw.stripe_charges and analytics_prod.raw.stripe_subscriptions without transformation. Steps T1--T8 are implemented as dbt models in the marts layer, materializing to analytics_prod.finance.stripe_payments_daily. The raw layer is governed by column-level access control in BigQuery: the billing_details.name, billing_details.email, and failure_message columns in the raw table require the role roles/bigquery.piiDataViewer to query.

---

### Load

**Raw layer load (before transformation):**

| Property | Value |
|---|---|
| Target table | analytics_prod.raw.stripe_charges |
| Load strategy | Append (raw layer is immutable event log; never overwrite) |
