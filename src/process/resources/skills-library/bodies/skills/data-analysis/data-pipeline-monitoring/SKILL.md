---
name: data-pipeline-monitoring
description: |
  Designs a data pipeline monitoring plan with health metrics (latency, error rate, row count variance), alert thresholds, on-call escalation path, and incident response runbook template. Outputs a complete monitoring specification for production data pipelines.
  Use when the user asks to set up monitoring for data pipelines, define SLAs for data freshness, create alerting rules for ETL failures, or build a runbook for pipeline incidents.
  Do NOT use for designing the pipeline itself (use etl-pipeline-design), defining data quality rules on the data (use data-quality-rules), or designing dashboards (use bi-dashboard-spec).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "data-science analysis checklist"
  category: "data-analysis"
  subcategory: "data-engineering"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---
# Data Pipeline Monitoring

## When to Use

**Use this skill when:**
- The user wants to set up automated monitoring for one or more production data pipelines, ETL jobs, or ELT workflows running on orchestrators like Airflow, Prefect, Dagster, dbt Cloud, or AWS Glue
- The user needs to define SLAs for data freshness -- for example, "the orders table must be updated by 06:00 UTC daily" or "the sessions table must never be more than 2 hours stale"
- The user wants to configure alerting thresholds for pipeline health signals: job duration, row count variance, error rates, retry counts, or resource consumption
- The user is building or formalizing an on-call rotation for a data engineering team and needs escalation paths, acknowledgment SLAs, and paging policies
- The user needs a runbook template for common pipeline failure modes so on-call engineers can diagnose and resolve incidents without tribal knowledge
- The user wants to formalize monitoring coverage for a new data platform, a new set of pipelines, or after a production incident exposed a gap in monitoring
- The user wants to tier their pipeline portfolio by criticality and apply differentiated monitoring intensity based on business impact

**Do NOT use when:**
- The user wants to design the pipeline logic itself -- the extract, transform, and load steps, the DAG structure, or the scheduling topology (use `etl-pipeline-design`)
- The user wants to define data quality rules applied to the loaded data -- null checks, uniqueness checks, referential integrity, distribution tests (use `data-quality-rules`)
- The user wants to design a dashboard layout showing business KPIs or analytical output (use `bi-dashboard-spec`)
- The user wants to design a streaming data architecture -- Kafka topics, Flink operators, consumer group lag (use `streaming-data-architecture`; note that dead-letter queue depth monitoring does appear in this skill but only as a signal within a broader pipeline monitoring plan)
- The user wants to define the infrastructure for monitoring tooling -- provisioning Prometheus, deploying Grafana, configuring PagerDuty teams (this skill defines what to monitor and how to respond, not how to provision the monitoring stack)
- The user is asking about application performance monitoring for an operational service that happens to move data (use `service-observability`)

---

## Process

### Step 1: Inventory and Classify Every Pipeline to be Monitored

Before writing a single threshold, you must understand what you are monitoring. A blind threshold is worse than no threshold -- it creates alert fatigue or misses real failures.

- **Collect the pipeline registry.** For each pipeline, record: name, owner team, schedule (cron expression or trigger type), source system, target system, transformation layer (dbt model, Spark job, SQL query, Python script), and approximate row volume per run.
- **Determine criticality tier.** Assign each pipeline to one of three tiers based on business impact:
  - **Tier 1 (Critical):** Pipeline failure directly impacts revenue, customer-facing product behavior, regulatory reporting, or real-time operational decisions. Examples: payment transaction sync, inventory availability update, fraud scoring feature pipeline. Requires 24/7 on-call coverage, 15-minute acknowledgment SLA.
  - **Tier 2 (High):** Pipeline failure affects internal business reporting, executive dashboards, marketing attribution, or partner data feeds. Data being stale for a few hours is visible but not catastrophic. Requires business-hours response, 2-hour acknowledgment SLA.
  - **Tier 3 (Standard):** Pipeline supports exploratory analysis, historical backfills, ML training features not in live serving, or low-frequency operational reports. Failure is noticed within a day. Weekly summary alert is sufficient.
- **Identify dependencies between pipelines.** Many pipelines feed others. The sessionization pipeline may depend on the raw clickstream pipeline. If the upstream fails silently, the downstream produces incorrect results without triggering its own alert. Map these chains and assign dependent pipelines to at least the same tier as their most critical downstream consumer.
- **Document the current monitoring state.** For each pipeline, note what is monitored today: nothing, basic success/fail, duration only, comprehensive. This reveals which pipelines need immediate attention and what historical data exists for baselining.
- **Confirm tooling availability.** Ask which of the following tools are available: orchestration platform (Airflow, Prefect, Dagster, dbt Cloud, Glue), monitoring/metrics (Datadog, Prometheus+Grafana, CloudWatch, New Relic), alerting/paging (PagerDuty, OpsGenie, Slack), log aggregation (Splunk, Elasticsearch/Kibana, CloudWatch Logs, Datadog Logs). If none are available, prescribe the minimum-viable monitoring approach in Step 8.

---

### Step 2: Establish Baselines Before Setting Thresholds

Every threshold must be anchored to observed behavior. Setting arbitrary numbers causes two failure modes: thresholds too tight fire constantly and get ignored; thresholds too loose miss real problems.

- **Collect historical run data.** Pull the last 30 days of pipeline run history from the orchestrator. For each run, record: start time, end time, status (success/failure/skipped), rows processed, error messages. Most orchestrators expose this through a metadata database or API.
- **Compute the following baseline statistics for each pipeline:**
  - **Duration:** mean, standard deviation, 95th percentile, and max. Note day-of-week and day-of-month variation separately -- month-end runs often take 3-5x longer than mid-month runs.
  - **Row count:** mean, standard deviation, and min/max per run. Also compute the week-over-week delta distribution -- a 30% drop may be normal (weekend vs. weekday) or catastrophic (source outage) depending on the pipeline.
  - **Error frequency:** how often errors occur, how often retries resolve them vs. requiring manual intervention, and which error types are most common.
  - **Failure rate:** percentage of runs that fail. A pipeline that fails 2% of runs and self-recovers on retry is healthy. A pipeline that fails 20% of runs is a reliability problem even if it eventually succeeds.
- **For new pipelines with no history:** run the pipeline for 2 full weeks in a shadow monitoring mode -- collect all metrics but do not page anyone. Use the collected data to set initial thresholds, then tune after 30 days.
- **For inherited pipelines with no documentation:** treat the first 30 days as an observation period. Set extremely loose thresholds (3-4 standard deviations) to avoid alert fatigue while you learn the baseline. Tighten thresholds as you accumulate data.
- **Flag statistically anomalous historical runs.** If 3 of the past 30 runs had zero rows due to a known source outage, exclude those from baseline calculations. Thresholds calibrated against failure states will be miscalibrated.

---

### Step 3: Define Health Metrics for Each Pipeline

Each pipeline must have metrics in five categories. A pipeline can succeed on all execution metrics while silently producing wrong data, so all five categories are mandatory.

**Category 1 -- Execution Metrics (did the pipeline run, and did it finish?)**
- Run status: success, failure, running (stuck), skipped, upstream_failed (Airflow-specific)
- Total execution duration (wall clock time from task start to completion)
- Per-step execution duration for pipelines with multiple tasks -- this isolates whether slowdown is in extract, transform, or load phase
- Execution frequency: did the pipeline run at all? A pipeline that is silently skipped produces the same symptom as one that failed -- stale data -- but via a different mechanism
- Retry count per run: a pipeline that succeeds only after 4 retries is not healthy even though status = success

**Category 2 -- Data Volume Metrics (did the pipeline move the expected amount of data?)**
- Absolute row count per run: compare against the baseline distribution, not just a fixed number
- Row count delta from previous run: large swings (>50% in either direction) often indicate source issues, logic bugs, or deduplication failures
- Zero-row runs: always alert, always investigate -- a pipeline completing with zero rows is almost never correct
- Byte volume per run: relevant for file-based pipelines (S3, GCS) where row count is not available
- Duplicate row ratio: if the pipeline uses upsert logic, duplicate key violations or unexpected row count increases indicate upstream duplication
- Null rate for critical columns on insert: if the source is omitting the order_id field, the pipeline may succeed with zero errors but load corrupt data

**Category 3 -- Data Freshness Metrics (is the data in the target current?)**
- Time since last successful run: derived from the orchestrator's run history
- Age of the newest record in the target table: `SELECT MAX(updated_at) FROM analytics.orders` -- this is different from run time because a successful run may load records that are themselves hours old due to source-side delays
- Source-to-warehouse lag: the time between when a record is created/updated in the source system and when it appears in the warehouse. This requires a watermark column in both source and target.
- SLA compliance rate: what percentage of scheduled runs completed before the SLA deadline over the past 30 days. Report this as a percentage for stakeholder communication.

**Category 4 -- Error and Quality Metrics (did the pipeline encounter problems?)**
- Error count per run by error type: schema validation errors, API rate limit errors, authentication errors, transformation errors (division by zero, type cast failures), infrastructure errors (connection timeouts, disk full)
- Retry count: any run requiring more than the expected number of retries (typically 1-2 for transient errors) warrants investigation
- Dead letter queue depth: for streaming pipelines, records that cannot be processed accumulate in a DLQ. Monitor depth and growth rate.
- Schema drift detection: compare actual source schema against the expected schema at the start of each run. Alert on any new, removed, or type-changed columns before they cause downstream failures.
- Partial load detection: for pipelines that process files or batches, verify that all expected files/batches were processed, not just some

**Category 5 -- Resource and Cost Metrics (is the pipeline efficient?)**
- Peak memory usage: for Spark or pandas-based transformations, memory exhaustion causes failures but also causes excessive garbage collection that shows up as duration spikes
- Compute cost per run: for cloud-based jobs (AWS Glue, Databricks, BigQuery slots), cost per run should be stable. A run that costs 10x the baseline usually indicates a query plan regression or an unexpected data volume spike.
- API call count: for pipelines extracting from external APIs, monitor call count against rate limits. A pipeline approaching 80% of its rate limit allocation is a warning; hitting 100% causes failures.
- Storage written per run: unexpected volume increases in target tables or intermediate storage (S3 staging buckets) can indicate logic errors writing duplicate or unbounded data

---

### Step 4: Set Alert Thresholds Using Statistical and Business Logic

Each metric needs two thresholds: warning (investigate proactively) and critical (respond immediately). Set thresholds using the appropriate method for each metric type.

**Statistical thresholds (for metrics without hard business constraints):**
- Warning: value falls outside mean ± 2 standard deviations
- Critical: value falls outside mean ± 3 standard deviations, OR crosses zero (for row counts)
- For right-skewed metrics like duration: use mean + 1.5×IQR for warning, mean + 3×IQR for critical instead of standard deviation, since duration distributions are not normal
- Maintain separate threshold profiles for regular runs vs. high-volume periods (month-end, year-end, campaign launch days). Apply the correct profile based on calendar day.

**Business-defined thresholds (for metrics with SLA commitments):**
- Data freshness SLA: if stakeholders need data by 06:00 UTC, set the critical threshold at 05:30 UTC (30 minutes before SLA breach) to allow time for intervention. Set warning at 05:00 UTC.
- Row count floor: if fewer than 100 orders per day would indicate a severe source problem for a business doing 2,000 orders/day, set that as a hard critical threshold regardless of statistical baseline.
- Error rate ceiling: if any data quality errors on financial records are unacceptable, set the error count threshold at 1 (not a statistical multiple).

**Threshold calibration rules:**
- After the first 30 days of monitoring, review false positive and false negative rates. If any alert fired more than 5 times in 30 days without resulting in a real incident, the threshold is too loose -- tighten it. If a real incident occurred without firing an alert, the threshold is too tight in the wrong direction -- expand coverage.
- Document the rationale for every threshold so future engineers understand why the numbers exist. "Warning at 45 min because avg is 25 min and 2σ = 20 min" is actionable. "Warning at 45 min" is not.
- Never set a critical threshold at the same value as a warning threshold. There must be a meaningful gap that allows the warning to be investigated before it escalates to critical.

---

### Step 5: Design the Alert Routing and Escalation Policy

An alert without a clear owner is noise. Every alert must have a named recipient, a defined channel, and an automatic escalation path that does not depend on human judgment to trigger.

**Alert channels by severity:**
- **Warning alerts:** Route to a monitored Slack channel (e.g., #data-alerts). These require no immediate action but should be triaged during business hours. Tag the on-call engineer directly so the notification is not lost in channel noise.
- **Critical alerts:** Route to PagerDuty or OpsGenie AND the Slack channel simultaneously. PagerDuty handles escalation automatically if acknowledgment does not occur within the SLA. Do not rely on Slack alone for critical alerts -- Slack notifications are missed.
- **Informational alerts:** Route to Slack only, no tagging. Used for pipeline completions, SLA met confirmations, or weekly summaries.

**Escalation levels:**
- **Level 1 (Immediate):** On-call data engineer receives PagerDuty page. Acknowledgment SLA: 15 minutes for Tier 1, 30 minutes for Tier 2.
- **Level 2 (Auto-escalation):** If Level 1 is not acknowledged within SLA, PagerDuty automatically pages the secondary on-call engineer AND the engineering manager. This escalation must be configured in the paging tool -- do not rely on the L1 engineer to manually escalate.
- **Level 3 (Executive escalation):** If the incident is not resolved within 2 hours of the first page (Tier 1) or 4 hours (Tier 2), send an automated email to VP of Data and affected business stakeholders. The email must include: pipeline name, business impact, current data age, and ETA for resolution.

**On-call rotation design:**
- Minimum viable rotation: 3 engineers on a weekly rotation (Primary, Secondary, Manager backup). Never have a rotation of 2 -- it leads to fatigue and resentment.
- Define clear handoff procedure: the outgoing on-call engineer documents all open incidents and pending issues before rotation. Use a handoff Slack message template or a shared incident log.
- For teams in multiple time zones: define overlapping coverage hours and route Tier 1 alerts to the engineer whose local business hours cover the alert time. Avoid waking engineers at 03:00 local time for a Tier 2 alert.
- Define blackout periods (vacations, major holidays) in the paging tool ahead of time so coverage is explicitly reassigned, not assumed.

---

### Step 6: Write the Incident Response Runbook

The runbook transforms institutional knowledge into executable instructions. An on-call engineer at 02:00 AM should be able to diagnose and resolve 80% of incidents by following the runbook without calling anyone. The remaining 20% should have a clear escalation instruction.

**Structure every runbook entry with these seven sections:**

1. **Failure signature:** The exact alert name, affected pipeline, and what the monitoring system shows. Include the Slack message format and PagerDuty alert title so the engineer can immediately confirm they are looking at the right incident.
2. **Business impact statement:** What does this failure mean for the business right now? "The revenue dashboard in Looker is showing yesterday's data. Orders placed in the last [X] hours are not reflected." This tells the engineer how urgently to act and what stakeholders may call about.
3. **Triage checklist:** 3-5 quick diagnostic questions the engineer should answer in the first 5 minutes: Is this a recurring failure or a first occurrence? Is the source system reachable? Are other pipelines from the same source also failing? Did anything deploy recently?
4. **Diagnosis decision tree:** For each common error type, list the exact log message pattern, what it means, and where to look next. Include the specific query to run against the orchestrator metadata database, the log file path, or the Airflow UI navigation path. Do not say "check the logs" -- say "navigate to Airflow > DAGs > shopify_orders > click the failed task instance > click Log tab > search for 'Error' in the log."
5. **Resolution playbook:** For each diagnosis outcome, provide step-by-step resolution instructions. Include whether a rerun is safe (idempotent pipeline) or dangerous (non-idempotent pipeline that may create duplicates). Include the exact command to trigger a backfill if data was missed.
6. **Stakeholder communication template:** A fill-in-the-blank message that the engineer can post immediately after assessing the situation. Most engineers draft this from scratch under pressure, which wastes 10-20 minutes. The template must include: what failed, what data is affected, what the business impact is, what the resolution ETA is, and when the next update will be posted.
7. **Post-incident actions:** What must happen after the incident is resolved -- within 1 hour, within 24 hours, and within 1 week. This includes: sending a resolution notification, filing an incident report, completing the root cause analysis, and assigning prevention action items.

**Cover these specific failure modes in every runbook:**
- Pipeline execution failure (task-level error in the orchestrator)
- Pipeline timeout (duration exceeded maximum allowed runtime)
- Source system unavailable (API down, database unreachable, file not delivered)
- Schema drift (source added, removed, or changed a column)
- Data volume anomaly (zero rows, extreme spike, extreme drop)
- Freshness SLA breach (pipeline ran but data is still stale due to upstream delay)
- Resource exhaustion (OOM kill, disk full, compute timeout)
- Dependency failure (upstream pipeline failed, causing this pipeline to produce stale or wrong data)

---

### Step 7: Define the Monitoring Dashboard Specification

The monitoring dashboard gives the data team and stakeholders a shared operational view of pipeline health. Keep it focused on operational signals, not analytical content.

**Required panels for every monitoring dashboard:**

- **Pipeline Health Overview (the "heat map"):** A grid showing every monitored pipeline as a cell, colored by current status (green = healthy, yellow = warning, red = critical, gray = not run yet in current window). Include the time since last successful run as a label. This panel answers "is anything broken right now" in 3 seconds.
- **Execution Duration Trend (7-day sparklines):** One sparkline per pipeline showing duration over the past 7 days. Gradual duration increases -- a pipeline that took 20 minutes two weeks ago and now takes 40 minutes -- signal query plan degradation, growing data volumes, or resource contention. These trends predict failures before they occur.
- **Data Freshness Tracker:** A table with columns: Pipeline, Target Table/Dataset, Last Successful Run, Newest Record Age, SLA Threshold, Status (SLA Met/Breach). This panel is often embedded in stakeholder-facing dashboards so business users can self-serve answers to "is the data current?"
- **Row Count Trend (30-day per pipeline):** A line chart showing row count per run. Annotate with known events (marketing campaigns, data migrations, holiday periods) so future engineers can distinguish expected anomalies from real ones.
- **Alert Log (rolling 30 days):** A sortable table of all alerts fired, with columns: timestamp, pipeline, alert type, severity, acknowledged by, time to acknowledge, resolved at, time to resolve, root cause (brief). This panel is the primary tool for monitoring SLA compliance of the on-call rotation itself.
- **Cost Trend (cloud pipelines only):** A bar chart showing estimated cost per run over 30 days. Plot against a rolling average baseline. Unexpected cost spikes (>50% above baseline) warrant investigation even if the pipeline succeeded.

---

### Step 8: Define Minimum-Viable Monitoring for Teams Without Tooling

Not every team has Datadog and PagerDuty. Prescribe a working monitoring setup using only tools that are always available.

**The absolute minimum monitoring setup (requires only: a database query, a cron job, and email):**
- Write a SQL query against the orchestrator metadata database (Airflow's `dag_run` table, for example) that returns: pipeline name, last successful run time, time since last success, and SLA threshold.
- Schedule this query to run every 30 minutes as a cron job.
- If any pipeline's time-since-last-success exceeds its SLA threshold, send an email to the on-call engineer.
- This approach covers freshness monitoring with zero tooling investment. It will not catch duration anomalies or row count issues, but it will catch the most common and most damaging failure: stale data.

**Upgrade path:**
- Phase 1 (week 1): Freshness SLA check via cron + email
- Phase 2 (month 1): Add row count checks using the same pattern (query target table counts, compare to stored baselines in a simple tracking table)
- Phase 3 (month 2): Integrate with Slack via webhook for alerting; use a simple Python script to compute 2σ thresholds from stored history
- Phase 4 (quarter 1): Adopt a monitoring platform (Datadog, Grafana + Prometheus) and configure PagerDuty for Tier 1 pipelines
- Phase 5 (quarter 2): Integrate Great Expectations or dbt tests for data quality metrics alongside execution metrics

---

## Output Format

```markdown
## Pipeline Monitoring Plan: [Organization / Team Name]
**Prepared by:** [Name or AI Assistant]
**Date:** [Date]
**Review cycle:** Quarterly or after any Tier 1 incident

---

### 1. Pipeline Inventory and Criticality Classification

| Pipeline Name | Schedule (UTC) | Source | Target | Owner | Tier | Business Impact | Upstream Dependencies |
|---------------|---------------|--------|--------|-------|------|-----------------|----------------------|
| [pipeline_name] | [cron / trigger] | [Source system] | [Target schema.table] | [Team] | [1/2/3] | [Impact if failed or stale] | [Depends on: ...] |

**Tier definitions for this plan:**
- **Tier 1 (Critical):** [List pipelines] -- 15-min acknowledge, 2-hr resolve SLA, 24/7 coverage
- **Tier 2 (High):** [List pipelines] -- 2-hr acknowledge, 8-hr resolve SLA, business hours
- **Tier 3 (Standard):** [List pipelines] -- daily digest, best-effort resolution

---

### 2. Baseline Statistics (from [date range] historical run data)

| Pipeline | Avg Duration | Duration P95 | Avg Row Count | Row Count StdDev | Failure Rate (30-day) | Avg Retries Per Run |
|----------|-------------|-------------|--------------|-----------------|----------------------|-------------------|
| [pipeline_name] | [X min] | [Y min] | [N rows] | [σ rows] | [%] | [count] |

**Baseline notes:** [Document any known anomalies excluded from baseline, e.g., "Month-end runs excluded from shopify_orders duration baseline -- separate threshold profile applied last 3 business days of each month"]

---

### 3. Health Metrics and Alert Thresholds

#### Pipeline: [pipeline_name] (Tier [1/2/3])

**Baseline context:** Average duration [X] min (σ=[Y] min). Average row count [N] (σ=[M]). Runs daily at [time] UTC.

| Metric | Measurement Method | Warning Threshold | Critical Threshold | Alert Channel | Check Frequency |
|--------|-------------------|-------------------|-------------------|---------------|----------------|
| Run status | Orchestrator run state | 1 failure in rolling 24h | 2 consecutive failures | Slack + PagerDuty | Every run |
| Execution duration | Task end_time - start_time | > [avg + 2σ] min | > [avg + 3σ] min OR > [hard cap] min | Slack | Every run |
| Row count -- absolute | COUNT(*) on target partition | < [avg - 2σ] or > [avg + 2σ] | = 0 rows or > [avg + 3σ] | Slack + PagerDuty | Every run |
| Row count delta (vs. prev run) | This run vs. last run | Change > [X]% | Change > [Y]% | Slack | Every run |
| Data freshness | MAX(updated_at) on target table | > [SLA - 30 min] old | > [SLA] old | Slack + PagerDuty | Hourly |
| Source-to-warehouse lag | MAX(source_created_at) vs. MAX(warehouse_loaded_at) | > [X] hours | > [Y] hours | Slack | Every run |
| Schema drift | Schema hash comparison at run start | Any column added or removed | Any column type changed | Slack + PagerDuty | Every run |
| Error count by type | Orchestrator log parsing | Any error (even if retried successfully) | Any error after max retries exhausted | Slack + PagerDuty | Every run |
| Retry count | Orchestrator metadata | > [expected max retries] | [max retries] exhausted + failure | Slack | Every run |
| API call rate (if applicable) | API call counter | > 80% of rate limit quota | > 95% of rate limit quota | Slack | Every 15 min |
| Compute cost (cloud only) | Cloud billing API | > [avg + 50%] | > [avg × 3] | Slack | Every run |
| Memory usage | Container/executor metrics | > 80% of allocation | > 95% OR OOM kill | Slack + PagerDuty | Every 5 min during run |

**Month-end threshold overrides (last 3 business days of month):**
- Duration warning: > [month-end avg + 2σ] min (separate baseline)
- Duration critical: > [month-end hard cap] min

---

### 4. Alert Configuration and Routing

| Alert Severity | Trigger Condition | Primary Channel | Secondary Channel | Recipients | Acknowledge SLA | Resolve SLA |
|---------------|------------------|----------------|------------------|------------|-----------------|-------------|
| Info | Pipeline completed successfully; SLA met | Slack #data-ops | -- | Channel (no tag) | N/A | N/A |
| Warning | Warning threshold crossed | Slack #data-alerts | -- | @on-call-data-eng | 4 hours (business hrs) | Next business day |
| Critical (Tier 1) | Critical threshold crossed | PagerDuty | Slack #data-alerts | On-call engineer | 15 minutes | 2 hours |
| Critical (Tier 2) | Critical threshold crossed | PagerDuty | Slack #data-alerts | On-call engineer | 30 minutes | 8 hours |
| Escalation L2 | L1 not acknowledged within SLA | PagerDuty auto-escalate | Email | Secondary on-call + Eng manager | Auto-triggered | |
| Escalation L3 | Not resolved within [X] hours | Email | Calendar invite | VP Data + affected stakeholders | Auto-triggered | Best effort |

**Alert suppression rules:**
- During confirmed source maintenance windows (pre-scheduled in monitoring tool): suppress all alerts for affected pipelines
- During planned data backfills: suppress row count delta alerts (volume will be abnormal)
- After a deployment: suppress duration and error alerts for the first 2 runs to allow warm-up

---

### 5. On-Call Rotation

| Week | Primary (First Page) | Secondary (Auto-Escalation) | Manager Backup (L3) |
|------|---------------------|---------------------------|---------------------|
| [Week 1 dates] | [Name] | [Name] | [Name] |
| [Week 2 dates] | [Name] | [Name] | [Name] |
| [Week 3 dates] | [Name] | [Name] | [Name] |

**Handoff protocol:** Outgoing on-call posts a handoff message in #data-alerts by [time] on the last day of their rotation containing: (a) open incidents and status, (b) any pipelines with known instability, (c) any threshold changes made during the week.

**Coverage gap policy:** Any rotation slot with no assigned engineer must be filled by manager reassignment -- it may not remain empty. Document coverage gaps in the incident log even if no incident occurred.

---

### 6. Incident Response Runbook

---

#### Runbook Entry: [Pipeline Name] -- Execution Failure

**Alert signature:** PagerDuty alert: "[pipeline_name] FAILED -- [orchestrator]"  
Slack message in #data-alerts: ":red_circle: [pipeline_name] | Status: FAILED | Run: [run_id] | Time: [timestamp]"

**Business impact:** [Which downstream dashboards, reports, models, or systems are affected. How stale is the data right now? What is the SLA and how close to breach?]

**Triage checklist (complete in first 5 minutes):**
- [ ] Is this the first failure or part of a pattern? Check last 7 runs in orchestrator.
- [ ] Are other pipelines from the same source also failing? Check #data-alerts for related alerts.
- [ ] Did anything change recently? Check deployment log or Slack #data-deployments.
- [ ] Is the source system reachable? [Specific URL or command to test connectivity]

**Diagnosis decision tree:**

| Error signature in logs | Meaning | Next step |
|------------------------|---------|-----------|
| `401 Unauthorized` / `403 Forbidden` | API credential expired or revoked | Check secrets manager for expiry; regenerate credential; update secret; rerun |
| `429 Too Many Requests` | API rate limit hit | Check if another process is hitting the API concurrently; wait [X] minutes; rerun |
| `Connection timed out` / `Name resolution failed` | Source system unreachable | Check source system status page; escalate to source system owner; set retry for [X] minutes |
| `KeyError: '[column_name]'` / `Column not found` | Schema drift in source | Run schema comparison query (see below); update pipeline schema config; rerun |
| `MemoryError` / `Java heap space` | Memory exhaustion | Check executor memory allocation; check if data volume increased unexpectedly; increase allocation or optimize query |
| `No such file or directory: [path]` | Input file not delivered | Check upstream file delivery process; contact upstream owner; backfill when file arrives |
| Task `marked as failed by external system` | Infrastructure failure (cluster crash, preemption) | Rerun -- typically transient; escalate if it recurs 3+ times in a session |

**Schema comparison query (run when schema drift is suspected):**
```sql
-- Compare current source columns to expected schema stored in pipeline metadata
SELECT
    expected.column_name,
    expected.data_type AS expected_type,
    actual.data_type AS actual_type,
    CASE WHEN actual.column_name IS NULL THEN 'MISSING'
         WHEN expected.column_name IS NULL THEN 'NEW'
         WHEN expected.data_type != actual.data_type THEN 'TYPE_CHANGED'
         ELSE 'OK' END AS status
FROM pipeline_metadata.expected_schema expected
FULL OUTER JOIN information_schema.columns actual
    ON expected.column_name = actual.column_name
    AND actual.table_name = '[source_table_name]'
WHERE status != 'OK';
```

**Resolution steps:**
1. Identify error type from decision tree above
2. Confirm whether rerun is safe: [Is this pipeline idempotent? Yes/No. If No, what cleanup is required before rerun?]
3. Apply resolution for identified error type
4. Trigger rerun: [Exact command or UI navigation -- e.g., "Airflow UI > DAGs > [pipeline_name] > Latest Run > Clear > Confirm" or `airflow tasks clear [dag_id] -t [task_id] -s [execution_date]`]
5. Monitor the rerun in Airflow logs -- do not assume it succeeded. Watch for the first 3 tasks to complete before stepping away.
6. Verify data landed: run the freshness check query below to confirm data is now current.

**Freshness verification query (run after successful rerun):**
```sql
SELECT
    MAX(updated_at) AS newest_record,
    NOW() - MAX(updated_at) AS record_age,
    COUNT(*) AS row_count_this_run
FROM [target_schema].[target_table]
WHERE DATE(loaded_at) = CURRENT_DATE;
```

**Stakeholder communication template:**
```
[INCIDENT IN PROGRESS] [Pipeline Name] Data Delay -- [Date]

Status: Investigating / Identified / Resolving / Resolved
Affected data: [Target table / dashboard / report name]
Impact: Data in [dashboard/report] reflects information as of [timestamp]. Records from the past [X] hours are not yet available.
Root cause: [Being investigated / Schema change detected / Source system unavailable]
ETA for resolution: [Time]
Next update: [Time]

Contact: [On-call engineer name] via Slack or [escalation channel]
```

**Resolution confirmation message:**
```
[RESOLVED] [Pipeline Name] is now healthy. [Target table] is current as of [timestamp]. [X] rows were loaded in the recovery run. Total data delay: [X] hours. Root cause: [brief]. Incident report will be filed by [date].
```

**Post-incident actions:**
- **Within 1 hour of resolution:** Post resolution confirmation message in #data-alerts and in any stakeholder channels where the incident was communicated
- **Within 24 hours:** File incident report in [incident tracking system] with: timeline, root cause, business impact (hours of data staleness × affected users/reports), and at least one prevention action item
- **Within 1 week:** Prevention action item must have an assigned owner and a target completion date in the project tracker

---

#### Runbook Entry: [Pipeline Name] -- Data Freshness SLA Breach

[Repeat structure above for each failure mode: freshness breach, zero-row run, schema drift, resource exhaustion, dependency failure]

---

### 7. Monitoring Dashboard Specification

| Panel Name | Chart Type | Data Source | Query/Logic | Purpose | Refresh Rate |
|-----------|-----------|-------------|-------------|---------|-------------|
| Pipeline Health Grid | Status grid (green/yellow/red per cell) | Orchestrator metadata API | Last run status + time since last success vs. SLA | Immediate operational status for all pipelines | 1 minute |
| Execution Duration Trend | Multi-line chart, 7-day window, one line per pipeline | Pipeline run log table | Run duration by execution_date, with 7-day rolling avg overlay | Detect gradual degradation before failure | 5 minutes |
| Data Freshness Tracker | Table with conditional formatting | Target table MAX(updated_at) queries | Newest record age vs. SLA per pipeline | Identify stale data assets; shareable with stakeholders | 15 minutes |
| Row Count Trend | Line chart, 30-day, one chart per pipeline | Pipeline run metrics table | Row count per run, with mean ± 2σ bands overlaid | Spot volume anomalies; distinguish expected variance from real anomalies | 5 minutes |
| Alert Log | Sortable and filterable table | Alert management system | Alert timestamp, pipeline, severity, ack by, time-to-ack, time-to-resolve, root cause | Track SLA compliance; identify chronic problem pipelines | 5 minutes |
| Cost Trend (cloud pipelines) | Bar chart, 30-day | Cloud billing API | Estimated cost per run vs. 7-day rolling average | Detect unexpected cost regressions | Daily |
| On-Call Status | Banner | Rotation schedule | Current primary and secondary on-call names and contact | Immediate escalation contact during incident | Real-time |

---

### 8. SLA Compliance Reporting

**Weekly report (auto-generated, sent to data engineering manager and stakeholders):**
- SLA compliance rate per pipeline: percentage of runs that completed before SLA deadline in the past 7 days
- Total incidents by severity: warnings, criticals, escalations
- Mean time to acknowledge (MTTA) and mean time to resolve (MTTR) by tier
- Top 3 most-alerted pipelines (chronic issue candidates)
- Any open action items from previous incident reports

**Monthly report (for VP of Data and department heads):**
- Overall data platform reliability percentage (successful on-time runs / total scheduled runs)
- SLA compliance trend (7 days, 30 days, 90 days) per pipeline tier
- Business impact summary: total hours of data staleness across Tier 1 pipelines
- Top recurring incidents and their prevention status
```

---

## Rules

1. **Never set a threshold without a documented baseline.** A threshold is a hypothesis about what normal looks like. Without historical data, any number is a guess. Guesses cause alert fatigue (too tight) or missed incidents (too loose). If no historical data exists, run in observation mode for 2 weeks before writing thresholds.

2. **A pipeline with status=success is not a healthy pipeline.** A pipeline can exit with code 0, write zero rows, and be flagged as success by the orchestrator. Execution metrics and data metrics must both be monitored independently. Never let execution success substitute for data freshness verification.

3. **Zero-row runs always trigger at least a critical alert.** There is almost no scenario in a production pipeline where processing zero records is correct behavior. A zero-row run means either the source is empty (source failure), the filter logic has a bug, or the pipeline was misdirected. Always page for zero rows on any Tier 1 or Tier 2 pipeline.

4. **Every critical alert must have a named, reachable human assigned before it is activated.** An alert that routes to a team inbox, an unmaintained email list, or a Slack channel nobody monitors is not a real alert. Before enabling any critical alert, verify that a specific human being will receive it on a device they carry during their on-call shift.

5. **Escalation must be automatic, not manual.** If the on-call engineer does not acknowledge within the SLA, the monitoring system must automatically page the next level. Counting on the L1 engineer to manually escalate while they are under stress dealing with an incident creates a systematic gap. Configure auto-escalation in PagerDuty or OpsGenie before going live.

6. **Maintain separate baseline profiles for high-volume calendar periods.** A single threshold set against mid-month averages will false-alarm on month-end runs (which are typically 3-5x slower) or miss real problems on quiet days. Identify all calendar patterns (day-of-week, month-end, fiscal quarter-end, marketing campaigns) and maintain separate threshold profiles for each.

7. **Monitor upstream dependencies, not just the pipeline itself.** If Pipeline B depends on Pipeline A, and Pipeline A fails silently or runs late, Pipeline B will produce incorrect or stale data without triggering its own failure alert. Explicitly model upstream dependency chains and alert when an upstream pipeline's status threatens a downstream SLA.

8. **Schema drift detection must run before the pipeline starts loading data.** Detecting a schema change after 10 million rows have been loaded is dramatically more expensive to remediate than catching it before the first row. Compare the actual source schema to the expected schema at the beginning of the extract phase and halt the pipeline before any data movement if a breaking change is detected.

9. **The runbook must include an explicit idempotency statement for every pipeline before the "rerun" resolution step.** Telling an engineer to rerun a non-idempotent pipeline that uses INSERT (not upsert) will create duplicate data. Every runbook resolution step that involves rerunning must state: "This pipeline is [idempotent/non-idempotent]. [If non-idempotent: run DELETE FROM target WHERE run_id = '[failed_run_id]' before rerunning.]"

10. **Every incident requires a root cause analysis and a prevention action item.** Resolving the immediate symptom (rerunning the pipeline) without understanding why it failed ensures the incident will recur. The post-incident requirement is not bureaucracy -- it is the only mechanism that causes the failure rate to decrease over time. MTTR matters, but reducing incident frequency matters more.

11. **Alert routing must account for time zones and business hours.** A Tier 2 alert that fires at 02:00 AM for the primary on-call engineer should either route to someone in a different time zone who is in business hours, or be held for the engineer's morning with an automated suppression. The exception is Tier 1 pipelines with 24/7 coverage -- those always page immediately regardless of local time.

12. **Cost metrics are first-class monitoring signals, not optional.** A cloud pipeline that succeeds but scans 100x more data than expected due to a missing partition filter is a real failure that will cause a budget overrun. Treat cost per run as a health metric with warning and critical thresholds, not as an afterthought.

---

## Edge Cases

### Hundreds of pipelines on a large data platform

When a platform has 50+ pipelines, applying uniform monitoring intensity is operationally unsustainable. The Tier 1/2/3 classification in the Process section is mandatory, not optional. Additional guidance:
- Group Tier 3 pipelines into a single "platform health" digest that runs daily and sends one summary message listing any Tier 3 pipelines that failed or missed SLA. Do not create individual alerts for Tier 3 pipelines.
- For Tier 2 pipelines, use business-hours-only paging with a 2-hour acknowledgment window. Configure the monitoring tool to queue the alert and deliver it at 09:00 local time if it fires overnight.
- Automate tier classification by creating a pipeline metadata table with a `criticality_tier` column. Monitoring thresholds and routing rules are then dynamically generated from this table. When a new pipeline is onboarded, the engineer must populate this field -- no pipeline enters production without a declared tier.
- Use alert grouping: if 15 pipelines sourced from the same database fail simultaneously, fire one "source system outage" alert rather than 15 individual pipeline alerts. This requires alert correlation logic based on shared source system identifiers.

### Streaming pipelines alongside batch pipelines

Streaming pipelines (Kafka consumers, Flink jobs, Spark Structured Streaming) require fundamentally different monitoring signals than batch pipelines. Do not apply batch monitoring patterns to streaming:
- **Consumer lag** (not "did the job run") is the primary health signal for Kafka-based pipelines. Monitor consumer group lag in number of messages and in time lag. Warning at >5 minutes behind; critical at >15 minutes behind for Tier 1 streaming.
- **Dead letter queue depth** is the streaming equivalent of error count. Monitor DLQ growth rate (messages per minute added to DLQ), not just absolute depth.
- **Throughput (records per second)** replaces row count per run. Set warning thresholds at <50% of expected throughput during active hours.
- **Checkpoint age** for Flink and Spark Streaming: if the latest checkpoint is older than [2x checkpoint interval], the job is likely stuck or restarting in a loop. Alert on checkpoint age.
- Freshness for streaming pipelines is typically measured in seconds or minutes, not hours. Set SLAs accordingly and check every 1 minute rather than every run.

### Pipelines with known non-deterministic volume (event-driven sources)

Some pipelines process files or API responses where volume is driven by external events -- a marketing email blast, a product launch, a partner data dump. Row count thresholds based on historical averages will false-alarm on legitimate volume spikes.
- For pipelines where volume is driven by external campaigns or events, maintain a calendar of known events and automatically apply "high-volume mode" thresholds (wider bands) during those windows. This can be as simple as a boolean flag in the pipeline metadata table set by the owning team.
- Replace absolute row count thresholds with rate-of-change thresholds for event-driven pipelines: alert if the row count in this run is >3σ above the same day-of-week average for the past 4 weeks, rather than above a fixed number.
- For pipelines that occasionally receive zero legitimate records (e.g., a pipeline that processes customer support tickets might have zero records on a Sunday), the zero-row rule must be amended: add a flag `zero_rows_is_valid = TRUE/FALSE` per pipeline, set based on source characteristics. Document the business justification for every pipeline where zero rows is considered valid.

### Pipeline monitoring after a major infrastructure migration

When a team migrates from one orchestrator or data warehouse to another (Airflow to Prefect, Redshift to Snowflake), historical baselines become invalid.
- Freeze the old baselines and run the new system in observation mode for 2-4 weeks before setting production thresholds. New systems have different performance characteristics -- Snowflake queries that took 20 minutes on Redshift may take 3 minutes, making the old duration thresholds trivially easy to satisfy and useless for detecting real degradation.
- During the migration period, run dual monitoring: monitor both the old and new system simultaneously. This lets you compare behavior and catch regressions during the transition without losing visibility into either system.
- Reset the incident history and MTTR/MTTA metrics at migration time. Post-migration metrics should not be contaminated by pre-migration incidents that reflected the old system's failure modes.
- Alert routing may also need to change: if the new orchestrator has a different API or metadata schema, all queries that check run status, duration, and row counts must be updated before going live on the new system.

### Inherited pipelines from a team that no longer exists

When a data engineering team inherits pipelines from a dissolved team, acquired company, or departed contractor, there is typically no documentation, no baseline history, and no runbook.
- Begin with a 30-day observation period. Set no production alerts initially -- only logging. Gather: run history, row count statistics, error frequency, source system identity, and who in the business consumes the output.
- Interview downstream consumers (analysts, business stakeholders, product managers) to understand: what does this data feed, what breaks when it is late, and what anomalies have they noticed in the past? This stakeholder knowledge is often the only documentation that exists.
- Reverse-engineer the pipeline logic to identify: is this pipeline idempotent? Does it have a watermark or does it do a full reload? Are there side effects (emails triggered, records written to source systems)?
- Do NOT add these pipelines to the Tier 1 on-call rotation until you understand them. Add them to Tier 3 monitoring (daily digest) and promote them to Tier 2 or Tier 1 only after the observation period and stakeholder interviews confirm their criticality.
- Assign a 2-week "pipeline archaeology" task to a senior engineer to produce a one-page summary of each inherited pipeline before it is treated as production-grade.

### Alert storms during a major source system outage

When a source database or API goes down, every pipeline sourced from it will fail simultaneously. A naive monitoring setup will fire 20 or 30 individual alerts, flooding the on-call engineer's phone while they are trying to respond.
- Implement alert correlation: tag each pipeline with its source system identifier. In your alerting platform, create a "source outage" composite alert that fires once when 3+ pipelines from the same source fail within a 10-minute window. Suppress the individual pipeline alerts and replace them with a single high-severity source outage alert.
- Maintain a source system dependency map that is used both by the monitoring system and by the runbook. When a source outage is declared, the runbook entry for that source should list all affected downstream pipelines and their business impact, so the engineer can communicate the scope in one message rather than discovering it incrementally.
- Set a maintenance window in the monitoring system as soon as a source outage is confirmed. Suppressing alerts during a known outage prevents alert fatigue from obscuring genuine secondary failures (a different pipeline failing for an unrelated reason while the outage is ongoing).
- Define the post-source-recovery procedure: when the source comes back online, which pipelines should rerun automatically (idempotent, full-reload) vs. which require manual intervention (stateful, watermark-based) to backfill the gap correctly?

---

## Example

**Input:** "We have three pipelines we need to monitor. Stripe payments sync runs hourly and loads to our Postgres data warehouse payments table -- it's critical because our CFO dashboard and revenue recognition system read from it directly. Google Analytics session data runs every 4 hours and loads to analytics.sessions -- it feeds our product team's weekly report. And a weekly Salesforce contact sync that runs Sunday at midnight UTC and loads to analytics.contacts for sales reporting. We use Airflow for orchestration, we have Datadog, and we have PagerDuty. Team of 4 data engineers."

---

**Output:**

```markdown
## Pipeline Monitoring Plan: Data Engineering Team
**Prepared by:** AI Assistant
**Date:** [Current Date]
**Review cycle:** Quarterly or after any Tier 1 incident

---

### 1. Pipeline Inventory and Criticality Classification

| Pipeline Name | Schedule (UTC) | Source | Target | Owner | Tier | Business Impact | Upstream Dependencies |
|---------------|---------------|--------|--------|-------|------|-----------------|----------------------|
| stripe_payments_sync | Hourly (`0 *
