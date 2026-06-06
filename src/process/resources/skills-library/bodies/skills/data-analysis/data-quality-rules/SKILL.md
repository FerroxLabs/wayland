---
name: data-quality-rules
description: |
  Produces a data quality rule set defining completeness, validity, consistency, accuracy, and uniqueness rules for each field in a dataset. Includes threshold values and alert conditions for automated monitoring.
  Use when the user asks to define data quality checks, set up data validation rules, create a data quality framework, or establish thresholds for data integrity monitoring.
  Do NOT use for spreadsheet-level input validation (use data-validation-setup), ETL pipeline design (use etl-pipeline-design), or data cleaning operations (use data-cleaning-protocol).
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
# Data Quality Rules

## When to Use

**Use this skill when:**
- The user asks to define data quality rules, checks, or constraints for a specific table, dataset, API feed, or data warehouse layer (staging, ODS, curated, mart)
- The user wants to set up automated data quality monitoring using tools like Great Expectations, dbt tests, Soda Core, Monte Carlo, or custom SQL-based assertion frameworks
- The user needs to establish quality thresholds and alert conditions before a dataset is promoted to production or made available to downstream consumers
- The user wants to create or formalize a data quality framework for their organization -- defining dimensions, ownership, SLAs, and escalation paths
- The user is preparing for a data audit, compliance review, or data contract negotiation and needs a structured rule set to demonstrate data trustworthiness
- The user has experienced a data quality incident (wrong billing, bad report, stale dashboard) and needs a post-incident rule set to prevent recurrence
- The user is onboarding a new data source (third-party API, acquired company's database, new ERP module) and needs to establish baseline quality before integrating it into the warehouse

**Do NOT use when:**
- The user wants to add drop-down menus, cell-level range validation, or conditional formatting in Excel or Google Sheets (use `data-validation-setup`)
- The user wants to design the ETL/ELT pipeline architecture, transformation logic, or orchestration schedule (use `etl-pipeline-design`)
- The user wants to actually fix or clean a specific dirty dataset right now -- deduplication, imputation, standardization (use `data-cleaning-protocol`)
- The user wants to design the schema itself -- choosing data types, primary keys, indexes, normalization level (use `data-schema-design`)
- The user wants to write statistical anomaly detection models or ML-based data quality scoring -- this skill covers rule-based threshold monitoring, not probabilistic anomaly detection (use a dedicated statistical-monitoring skill)
- The user wants to define business metric definitions and KPI logic (use `metric-definition-framework`) -- metric definitions overlap with accuracy rules but are a distinct concern
- The user is asking about application-layer input sanitization or API request validation (use `api-contract-design`)

---

## Process

### Step 1: Establish Context and Impact

Before writing a single rule, understand why data quality matters for THIS specific asset. Poor rules are written in isolation; expert rules are written against the business impact model.

- Ask: What is the data asset's name, location (schema.table or API endpoint), and refresh cadency (real-time stream, hourly batch, daily ETL, weekly load)?
- Ask: What are the downstream consumers -- which dashboards, reports, billing systems, ML models, or third-party syncs depend on this data? Each consumer has different tolerance for failures.
- Ask: What is the SLA for this data? Is it an executive-facing dashboard (zero tolerance for stale or wrong numbers) or an exploratory analytics table (tolerance for 2--5% imperfection)?
- Ask: What quality failures have occurred in the past? Historical incidents reveal the most important rules to write. A team that has been burned by duplicate customer records will care far more about uniqueness rules than a team that hasn't.
- Ask: Who owns this data -- who is responsible when a rule fails? Identify the data producer (team that writes records), data steward (team that monitors quality), and data consumer (team that depends on it). Document all three.
- Ask: Is there a regulatory or compliance dimension? PII fields, financial figures, and healthcare records carry legal obligations that turn WARNING-severity rules into compliance violations.
- Determine the data quality maturity level: Are they starting from scratch with no existing checks (define all five dimensions from the ground up), or refining an existing framework (focus on gaps and threshold calibration)?

### Step 2: Inventory Every Field with Business Context

A field inventory is not a data dictionary copy-paste. It is an assessment of each field's quality risk profile.

- Capture field name, physical data type (VARCHAR(255), BIGINT, DECIMAL(10,2), BOOLEAN, TIMESTAMP WITH TIME ZONE), and nullable status in the source system.
- Identify the field's role: primary key, surrogate key, natural/business key, foreign key, measure, attribute, audit column (created_at, updated_at, created_by), or soft-delete flag (is_deleted, status = 'churned').
- Document the field's business meaning -- not just the column name but what a value actually represents: is `amount` the invoice amount before tax, after tax, in USD, or in the customer's currency?
- For each field, assess: Is this field written by our system or by a third party? Third-party-written fields require external validity checks; our own fields can be traced to application code.
- Flag high-risk fields immediately: any field used in a JOIN condition, any field aggregated in a revenue or count metric, any field that identifies a person (PII), any date/timestamp used for partitioning or filtering.
- Note any known quality issues: "this field is NULL for all records imported before 2021," "this field duplicates the value in another field and should always match," "this field is supposed to be ISO 8601 but legacy records use MM/DD/YYYY."
- Rate each field's criticality: TIER 1 (business-critical, used in financial reporting or billing), TIER 2 (operationally important, used in dashboards or CRM syncs), TIER 3 (supplementary, used for filtering or context only).

### Step 3: Define Rules Across the Five Quality Dimensions

Apply each dimension deliberately to each field, not mechanically. Not every field needs all five dimensions. Use the following decision logic:

**Completeness -- Is the value present when it should be?**
- Apply NOT NULL rules to every field marked required in the business model, regardless of whether the database enforces it (the database constraint is a backstop, not a substitute for monitoring).
- For nullable fields, always define a null rate threshold -- even optional fields should not exceed a reasonable null rate. A field that is 90% null is likely broken, even if nulls are technically allowed.
- Define conditional completeness rules for fields that are required only under certain conditions: `ship_date` must not be null when `order_status = 'shipped'`; `tax_id` must not be null when `country = 'US'` and `plan_type = 'enterprise'`.
- Use specific thresholds: 0% null for primary keys, surrogate keys, and fields used in billing calculations; <1% for required business attributes; <5% for optional enrichment fields. Never accept "some nulls are okay" without a specific number.
- Distinguish null from empty string. For string fields: null means "not provided," empty string means "provided but blank" -- both are failures but they have different root causes. Empty strings usually indicate an application bug (a form submitted with an empty required field). Write separate checks for each.

**Validity -- Does the value conform to expected format, type, and domain?**
- Type conformance: even if the column is typed VARCHAR, check that numeric-meaning fields contain actual numbers, date-meaning fields contain parseable dates, and boolean-meaning fields contain only expected values. Type coercion in ETL pipelines commonly introduces garbage values.
- Pattern checks using regular expressions: email format (`^[^@\s]+@[^@\s]+\.[^@\s]+$`), phone numbers in E.164 format (`^\+[1-9]\d{1,14}$`), US ZIP codes (`^\d{5}(-\d{4})?$`), ISO 3166-1 alpha-2 country codes (must be in the 249-code reference set), UUID format (`^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$`).
- Range checks with business-informed bounds: a `discount_rate` field should be between 0.0 and 1.0; an `age` field should be between 0 and 130; a `price` field in a B2B SaaS context might reasonably be between $0 and $500,000/year. Do not use arbitrary technical maximums (INT max = 2,147,483,647 is not a valid business upper bound for order quantities).
- Enumeration checks: define the exact allowed set. For a `status` field with values active, inactive, pending, churned -- any value outside this set is invalid. Maintain the allowed list as a reference table or a hard-coded list in the rule, not as a vague description.
- Cross-field business logic as validity rules: `unit_price * quantity` should approximately equal `line_total` (within rounding tolerance); `discount_amount` should not exceed `subtotal`; `refund_amount` should not exceed `original_payment_amount`.

**Consistency -- Does the value agree with related values in the same or other datasets?**
- Temporal ordering constraints: `end_date >= start_date`, `shipped_at >= ordered_at`, `last_modified_at >= created_at`. These are among the most frequently violated rules and among the hardest to debug when violated.
- Referential integrity: every foreign key value must exist in the referenced dimension table. In a data warehouse context, this is not guaranteed by the database engine (most warehouses -- Snowflake, BigQuery, Redshift, Databricks -- do not enforce FK constraints). You must check this explicitly: `SELECT COUNT(*) FROM orders o LEFT JOIN customers c ON o.customer_id = c.id WHERE c.id IS NULL` should return 0.
- Cross-system consistency: when the same entity exists in two systems (e.g., a customer record in both the CRM and the billing system), key attributes should match. Define which system is the system of record for each field and check that the secondary system's value matches.
- Aggregation consistency: summary tables should match their source detail tables. `SELECT SUM(mrr) FROM customers` should match `SELECT total_mrr FROM daily_mrr_snapshot WHERE snapshot_date = CURRENT_DATE`. Tolerate only rounding-error differences (< $0.01 per customer).
- Cardinality rules: some relationships should have a fixed cardinality. Each invoice should have exactly one customer (1:1); each customer can have many invoices (1:N). A cardinality violation -- an invoice with no customer or two customers -- is a consistency failure.

**Accuracy -- Does the value reflect the real-world truth?**
- Freshness rules are the most actionable accuracy check: define the maximum acceptable age of the most recent record for each table that receives regular updates. A `last_login_at` that hasn't been updated in 6 months for an "active" user is either accurate (the user is inactive) or a freshness failure in the login event stream.
- Statistical outlier detection using the IQR method or Z-score: flag records where a numeric field is more than 3 standard deviations from the 30-day rolling mean, or outside 1.5x the interquartile range. This is a WARNING-level check; outliers are not always errors. The goal is to surface them for human review.
- Row count drift: compare today's record count or load count to the 7-day and 30-day moving average. A sudden drop of >20% or spike of >50% signals a pipeline failure, data backfill, or accidental truncation. Set a CRITICAL alert at >50% change and a WARNING at >20% change.
- Sum/total drift: for financial tables, track the daily sum of key measures (total MRR, total invoices, total refunds). A day-over-day change exceeding business-plausible bounds (say, >15% daily MRR change for a stable SaaS business) should trigger a WARNING.
- Referencing external truth sources when available: if you have a canonical customer list from a CRM, the count of customers in the data warehouse should match within a defined tolerance (e.g., within 10 records or 0.1%, whichever is smaller).

**Uniqueness -- Are values distinct where they must be?**
- Primary key uniqueness is always CRITICAL at 0% tolerance. This is non-negotiable.
- Business key uniqueness: natural identifiers like email addresses, SSNs, passport numbers, or EIN/VAT numbers should be unique within their applicable scope (e.g., unique per active customer, not across all historical records including churned).
- Composite uniqueness: some tables have no single unique field but should have a unique combination (e.g., `(order_id, line_item_number)` must be unique in an order_items table; `(user_id, date)` must be unique in a daily_activity_summary table).
- Duplicate entity detection (fuzzy): beyond exact-match uniqueness, watch for near-duplicate records representing the same real-world entity. Check for pairs of rows where `email` is the same but `id` differs, or where `(first_name, last_name, company)` matches but `customer_id` differs. These require separate deduplication logic but should be flagged by quality rules.
- Uniqueness within a window: for event tables, check that the same event is not logged twice within a short window (e.g., the same `user_id` + `event_type` + `session_id` should not appear more than once within a 1-second window).

### Step 4: Calibrate Thresholds Against Observed Baselines

Thresholds set without data are guesses. Guesses cause either constant false alarms (thresholds too tight) or missed real failures (thresholds too loose). Both outcomes erode trust in the monitoring system.

- For a dataset with at least 30 days of history: profile the current state. Compute null rates, distinct value counts, min/max/mean/stddev, and pattern match rates for every field. Use these as your baseline.
- Set the initial CRITICAL threshold at 3x the observed worst rate (if the email null rate has never exceeded 0.1%, set CRITICAL at 0.3%). Set WARNING at 2x the observed worst rate (0.2%). This gives headroom for natural variation while catching genuine failures.
- For a brand new dataset with no history: run all rules in INFO mode for 14--30 days. Collect statistics. Then set thresholds as above. Mark all rules as "calibration period" in the rule set until baselines are established.
- Tighten thresholds over time: after 90 days of stable operation with no false alarms, halve the WARNING threshold. After another 90 days, halve again. Converge toward the true business requirement (e.g., 0% nulls on a required field).
- Document the threshold rationale for every rule: "CRITICAL threshold of 0.5% set based on observed baseline of 0.07% over 30 days (baseline x 7 to account for occasional spikes)" is a maintainable rule; "0.5% because it seemed reasonable" is not.

### Step 5: Assign Severity and Response Plans

Severity without a response plan is just noise. Every severity level must map to a concrete, named action taken by a named person or team within a defined time window.

- **CRITICAL:** The data is materially wrong in a way that will cause incorrect downstream behavior if not addressed immediately. Block the downstream pipeline or data sync. Alert via PagerDuty or equivalent. A named responder must acknowledge within 15 minutes and resolve or apply a rollback within 2 hours. Examples: duplicate primary keys, FK referential integrity failure, billing-critical field null rate above threshold, total MRR > 50% different from yesterday.
- **WARNING:** The data has a quality issue that should be investigated and resolved within 24 hours, but downstream consumption can continue with a known caveat. Notify the data quality owner via Slack or email. Examples: email null rate above threshold, outlier values in a non-billing field, day-over-day row count drift of 15--30%.
- **INFO:** A pattern worth tracking but not requiring immediate action. Log to the quality dashboard. Review in the weekly data team meeting. Examples: a field that is approaching (but not exceeding) its WARNING threshold, slow degradation in a completeness metric over 30 days.
- Use the "airplane rule" for CRITICAL severity: would a pilot halt the flight for this? If a downstream consumer (billing system, executive report, regulatory filing) would produce materially wrong output given this failure, the rule is CRITICAL. Everything else is WARNING or INFO.
- Limit CRITICAL rules to the 20--30% most important checks. If 80% of your rules are CRITICAL, you have alert fatigue and your team will start ignoring all alerts. A good distribution is roughly 20% CRITICAL, 50% WARNING, 30% INFO.

### Step 6: Define the Monitoring Schedule and Execution Framework

Rules must map to a specific execution mechanism and schedule, not just exist as documentation.

- **On-load (event-driven):** Rules that must pass before data is made available downstream. Implement as dbt tests (dbt test command runs after dbt run), Great Expectations checkpoints triggered by the Airflow DAG, or SQL assertion queries run by the orchestrator (Airflow, Prefect, Dagster) with a failure action that stops the downstream tasks.
- **Hourly:** Freshness checks only. A cron-based job checks the max(updated_at) or max(created_at) for critical tables and alerts if the value exceeds the SLA. These are lightweight and should not require a full table scan.
- **Daily:** Statistical and trending checks that require aggregation over the full dataset. Row count drift, total MRR drift, 30-day rolling null rate trends. Schedule during off-peak hours, after the daily load completes.
- **Weekly:** Fuzzy duplicate detection, cross-system consistency checks (comparing warehouse to CRM or billing system), and full-table profile refreshes. These are expensive and run on weekends or during maintenance windows.
- Implement rules as executable code, not just documentation. For dbt users: singular tests (custom SQL queries in the tests/ directory) and generic tests (schema.yml assertions using dbt's built-in or dbt_utils / dbt_expectations packages). For non-dbt users: Great Expectations suites, Soda Core checks, or raw SQL assertions wrapped in a testing framework with pass/fail output and a central result store.
- Store test results in a quality result table: `(rule_id, run_timestamp, table_name, field_name, records_checked, records_failed, pass_rate, status, severity)`. This enables trending and historical analysis.

### Step 7: Build the Remediation Playbook

Finding a quality failure is only half the job. The playbook tells responders exactly what to do when a rule fires.

- For each CRITICAL rule, write a specific remediation procedure: (1) immediate containment action -- what do you do RIGHT NOW to stop the bleeding (halt pipeline, quarantine rows, roll back the load); (2) root cause investigation -- which query do you run to understand the scope and origin of the failure; (3) fix action -- how do you correct the data; (4) verification -- how do you confirm the fix worked; (5) post-mortem action -- what process change prevents recurrence.
- For WARNING rules, document the investigation query and a link to the dbt model or ETL script that generates the field. This reduces mean time to investigation from hours to minutes.
- Pre-build the quarantine pattern: a `quarantine` schema or table suffix (e.g., `customers_quarantine`) where records that fail CRITICAL rules are held. They are not deleted -- they are staged for review and potential repair. The main table contains only quality-approved records.
- Define a data quality incident severity matrix: a single CRITICAL rule failure on a billing table = P1 incident; three WARNING failures on a non-critical table = P3 ticket in the backlog; consistent INFO drift over 14 days = change request to tighten thresholds.

### Step 8: Document and Publish the Rule Set

Quality rules that live only in someone's head or a private notebook don't exist for operational purposes.

- Publish the rule set in the data catalog (Atlan, DataHub, Alation, or Confluence) linked to the dataset's metadata page.
- Version-control the rule definitions as code alongside the dbt project or ETL repository. A rule change should require a code review, not just an email.
- Schedule a quarterly rule review: are the thresholds still appropriate? Have new fields been added that need rules? Have downstream consumers changed their tolerance levels?
- Link each rule to the business requirement that motivated it: "C-002: email null rate < 1% -- required because billing system rejects invoices with no email address (JIRA: BILLING-1423)." This context prevents well-meaning engineers from loosening thresholds without understanding the business impact.

---

## Output Format

````
## Data Quality Rules: [schema.table_name]

### Overview

| Attribute | Value |
|-----------|-------|
| Data Asset | [schema.table_name] |
| Data Producer | [Team or system that writes records] |
| Data Steward | [Team responsible for quality monitoring] |
| Data Consumers | [List of downstream systems/reports/teams] |
| Refresh Cadence | [Real-time / Hourly / Daily at HH:MM UTC / Weekly] |
| Quality SLA | [e.g., CRITICAL rules must pass before 06:00 UTC daily] |
| Business Criticality | [TIER 1: Revenue-critical / TIER 2: Operational / TIER 3: Supplementary] |
| Check Framework | [dbt tests / Great Expectations / Soda Core / Custom SQL] |
| Result Store | [Table or system where test results are written] |
| Baseline Established | [Date baselines were profiled, or "Calibration period: XX days remaining"] |
| Last Rule Review | [Date] |
| Next Scheduled Review | [Date] |

---

### Field Inventory

| Field | Physical Type | Nullable | Tier | Role | Business Meaning | Known Issues |
|-------|--------------|----------|------|------|-----------------|--------------|
| [field_1] | [BIGINT] | N | 1 | PK | [What this value represents in the business] | [Any known quirks] |
| [field_2] | [VARCHAR(255)] | N | 1 | Business Key | [Business meaning] | [None] |
| [field_3] | [DECIMAL(10,2)] | N | 1 | Measure | [What is measured, in what units, in what currency] | [Known issue if any] |
| [field_4] | [TIMESTAMP WITH TIME ZONE] | N | 2 | Audit | [When record was created] | [None] |
| [field_5] | [VARCHAR(20)] | N | 1 | Attribute | [What the enum represents] | [None] |
| [field_6] | [VARCHAR(200)] | Y | 3 | Attribute | [When null is acceptable] | [None] |

---

### Quality Rules

#### Completeness Rules

| Rule ID | Field | Rule Description | SQL Test | Threshold | Severity | Check Frequency | Owner |
|---------|-------|-----------------|----------|-----------|----------|-----------------|-------|
| C-001 | [pk_field] | Must not be NULL | `SELECT COUNT(*) FROM t WHERE [pk_field] IS NULL` | 0 records | CRITICAL | On-load | [Team] |
| C-002 | [required_field] | Must not be NULL or empty string | `SELECT COUNT(*) FROM t WHERE [field] IS NULL OR TRIM([field]) = ''` | 0 records | CRITICAL | On-load | [Team] |
| C-003 | [optional_field] | Null rate must not exceed threshold | `SELECT COUNT(*) FILTER (WHERE [field] IS NULL) / COUNT(*) FROM t` | < [N]% | WARNING | On-load | [Team] |
| C-004 | [conditional_field] | Must not be NULL when [condition_field] = '[value]' | `SELECT COUNT(*) FROM t WHERE [condition] AND [field] IS NULL` | 0 records | WARNING | On-load | [Team] |

#### Validity Rules

| Rule ID | Field | Rule Description | SQL Test | Expected | Severity | Check Frequency | Owner |
|---------|-------|-----------------|----------|----------|----------|-----------------|-------|
| V-001 | [email_field] | Must match email format | `SELECT COUNT(*) FROM t WHERE [field] NOT REGEXP '^[^@\s]+@[^@\s]+\.[^@\s]+$'` | 0 records | CRITICAL | On-load | [Team] |
| V-002 | [enum_field] | Must be in allowed set: [val1, val2, val3] | `SELECT COUNT(*) FROM t WHERE [field] NOT IN ('val1','val2','val3')` | 0 records | CRITICAL | On-load | [Team] |
| V-003 | [numeric_field] | Must be between [min] and [max] | `SELECT COUNT(*) FROM t WHERE [field] < [min] OR [field] > [max]` | 0 records | WARNING | On-load | [Team] |
| V-004 | [date_field] | Must not be a future date | `SELECT COUNT(*) FROM t WHERE [field] > CURRENT_TIMESTAMP` | 0 records | WARNING | On-load | [Team] |
| V-005 | [field_a, field_b] | [field_a] * [field_b] must approximately equal [field_c] (within 0.01) | `SELECT COUNT(*) FROM t WHERE ABS([fa] * [fb] - [fc]) > 0.01` | 0 records | CRITICAL | On-load | [Team] |

#### Consistency Rules

| Rule ID | Fields | Rule Description | SQL Test | Expected | Severity | Check Frequency | Owner |
|---------|--------|-----------------|----------|----------|----------|-----------------|-------|
| X-001 | [end_date, start_date] | end_date must be >= start_date | `SELECT COUNT(*) FROM t WHERE end_date < start_date` | 0 records | CRITICAL | On-load | [Team] |
| X-002 | [fk_field] → [ref_schema.ref_table.ref_col] | Every FK value must exist in reference table | `SELECT COUNT(*) FROM t LEFT JOIN ref ON t.[fk] = ref.[pk] WHERE ref.[pk] IS NULL` | 0 records | CRITICAL | On-load | [Team] |
| X-003 | [measure_field, summary_table] | SUM([measure]) must match summary table within tolerance | `SELECT ABS(SUM(t.[measure]) - s.[total]) FROM t, summary_table s WHERE s.date = CURRENT_DATE` | < $[tolerance] | WARNING | Daily | [Team] |
| X-004 | [field_a, field_b] | [business logic constraint] | [SQL test] | [Expected] | WARNING | On-load | [Team] |

#### Accuracy Rules

| Rule ID | Field | Rule Description | SQL Test | Expected | Severity | Check Frequency | Owner |
|---------|-------|-----------------|----------|----------|----------|-----------------|-------|
| A-001 | [timestamp_field] | Most recent record must be within [N] hours (freshness SLA) | `SELECT EXTRACT(EPOCH FROM NOW() - MAX([field]))/3600 FROM t` | < [N] hours | CRITICAL | Hourly | [Team] |
| A-002 | [row_count] | Total row count must be within [N]% of 7-day average | `SELECT COUNT(*) FROM t` vs. `7-day moving avg from quality_results` | Delta < [N]% | CRITICAL | On-load | [Team] |
| A-003 | [measure_field] | Daily SUM must be within [N]% of prior 7-day average | `SELECT SUM([measure]) FROM t WHERE [date_col] = CURRENT_DATE` vs. rolling avg | Delta < [N]% | WARNING | Daily | [Team] |
| A-004 | [numeric_field] | Values must be within 3 standard deviations of 30-day mean | `SELECT COUNT(*) FROM t WHERE ABS([field] - [mean]) > 3 * [stddev]` | < [N] records | WARNING | Daily | [Team] |

#### Uniqueness Rules

| Rule ID | Field(s) | Rule Description | SQL Test | Expected | Severity | Check Frequency | Owner |
|---------|----------|-----------------|----------|----------|----------|-----------------|-------|
| U-001 | [pk_field] | No duplicate primary keys | `SELECT [pk], COUNT(*) FROM t GROUP BY [pk] HAVING COUNT(*) > 1` | 0 rows | CRITICAL | On-load | [Team] |
| U-002 | [business_key] | No duplicate business keys within active records | `SELECT [bkey], COUNT(*) FROM t WHERE [status] != 'inactive' GROUP BY [bkey] HAVING COUNT(*) > 1` | 0 rows | CRITICAL | Daily | [Team] |
| U-003 | ([field_a], [field_b]) | Composite key must be unique | `SELECT [fa],[fb],COUNT(*) FROM t GROUP BY [fa],[fb] HAVING COUNT(*) > 1` | 0 rows | CRITICAL | On-load | [Team] |

---

### Threshold Summary and Calibration Log

| Rule ID | Baseline (Profiled Date) | Current Threshold | Threshold Last Updated | Rationale |
|---------|-------------------------|------------------|----------------------|-----------|
| C-003 | 1.2% null (YYYY-MM-DD) | < 3% null | YYYY-MM-DD | Baseline x2.5 for natural variation headroom |
| A-003 | Avg daily sum $X (YYYY-MM-DD) | Delta < 15% | YYYY-MM-DD | Business permits up to 15% daily MRR swing during promotional periods |

---

### Alert Configuration

| Severity | Response SLA | Notification Channel | Responder | Escalation Path | Downstream Action |
|----------|-------------|---------------------|-----------|-----------------|-------------------|
| CRITICAL | Acknowledge within 15 min; resolve or rollback within 2 hrs | PagerDuty + Slack #data-alerts + email | [Named person/team] | Data Engineering Lead → VP Engineering if >2hr unresolved | **Block** downstream pipeline; hold data sync |
| WARNING | Investigate within 24 hrs; resolve within 5 business days | Slack #data-quality + JIRA ticket auto-created | [Data Quality Owner] | Escalate to Data Engineering if not resolved in 5 days | **Allow** downstream but annotate data freshness/quality flag |
| INFO | Review in weekly data quality meeting | Data quality dashboard | Data team | Log for trend analysis | **No action** required |

---

### Monitoring Dashboard Specification

- **Completeness heatmap:** Grid of fields (rows) × dates (columns), color-coded by null rate. Green < WARNING threshold, yellow between WARNING and CRITICAL, red above CRITICAL.
- **Validity trend:** Line chart per rule, showing % valid records over 30 days. One line per rule. Horizontal reference lines at WARNING and CRITICAL thresholds.
- **Freshness gauge:** Per table, showing current age of most recent record in hours. SLA line marked. Red zone above SLA.
- **Row count trend:** Bar chart of daily record count with 7-day moving average overlay. Alert bands shown.
- **Rule failure log:** Sortable, filterable table: `rule_id | table | field | run_timestamp | records_checked | records_failed | failure_rate | severity | status (open/resolved)`.
- **Quality score summary:** Single composite score per table = (rules passing / total rules) × 100. Trend over 30 days. Broken down by dimension.

---

### Remediation Playbook

| Rule ID | Failure Description | Immediate Containment | Investigation Query | Fix Action | Verification | Prevention |
|---------|--------------------|-----------------------|--------------------|-----------|-----------|-----------| 
| [Rule ID] | [What failed and what it means] | [Stop pipeline? Quarantine rows? Alert whom?] | [Specific SQL to understand scope] | [How to fix the data] | [Query to confirm fix worked] | [Process/code change to prevent recurrence] |

---

### Data Quality Incident Log

| Date | Rule(s) Fired | Severity | Records Affected | Root Cause | Resolution | Time to Resolve | Post-Mortem Link |
|------|--------------|----------|-----------------|-----------|-----------|----------------|-----------------|
| YYYY-MM-DD | [Rule IDs] | CRITICAL | [N rows] | [Brief cause] | [Brief fix] | [HH:MM] | [Link] |

````

---

## Rules

1. **Never write a rule without an executable SQL test.** "Email should be valid" is documentation. `` SELECT COUNT(*) FROM customers WHERE email NOT REGEXP '^[^@\s]+@[^@\s]+\.[^@\s]+$' `` is a rule. Every rule in the output must have a specific, runnable test query or a named test in the chosen framework (e.g., `dbt_expectations.expect_column_values_to_match_regex`).

2. **Primary key uniqueness and referential integrity rules are always CRITICAL at exactly 0% tolerance.** There is no business context in which duplicate PKs or orphaned FK values are acceptable. Do not let a user argue these down to WARNING. A single duplicate PK can cause count inflation, incorrect joins, and financial reporting errors.

3. **Calibrate thresholds before publishing.** If the user cannot provide at least 14 days of profiling data, mark all percentage-based thresholds as provisional and flag them for recalibration. Publishing a 0% null threshold on a field that is currently 3% null guarantees immediate false alarms and destroys team trust in the monitoring system.

4. **Always distinguish null from empty string in completeness rules.** These are separate failure modes: null typically means the value was never provided (pipeline omission, application bug); empty string typically means the value was provided as blank (form validation failure, CSV import error). They require different investigation paths and different fixes. Write explicit checks for both.

5. **Every CRITICAL rule must have a named human responder and a documented downstream action.** "Alert the team" is not a response plan. The rule documentation must name the person or role on-call, their contact method, their acknowledgment SLA, and whether the downstream pipeline is blocked or allowed to continue.

6. **Set alert severity distribution intentionally: aim for no more than 25% of rules as CRITICAL.** Alert fatigue is the single biggest reason data quality programs fail. When everything is CRITICAL, nothing is CRITICAL. Reserve CRITICAL for rules where failure would cause incorrect billing, regulatory violation, or materially wrong executive reporting.

7. **Cross-table consistency rules must name the specific reference table, schema, and column.** "FK must match the source" is not testable. "Every `orders.customer_id` must exist in `analytics.customers.id`" is testable. Ambiguous rules cannot be automated and will not be maintained.

8. **Include at least one freshness rule for every table with a defined refresh cadence.** Stale data is the most common silent data quality failure -- the pipeline breaks, nobody notices, and consumers keep reading 3-day-old data without knowing it. A freshness check on `MAX(created_at)` or `MAX(updated_at)` is a one-line query that prevents this entire class of failure.

9. **Document the business motivation for every rule.** Rules without context get loosened or deleted by the next engineer who doesn't understand why they exist. Each rule should trace to a business requirement, a past incident, or a compliance obligation. "C-002: billing system rejects invoices with null email (incident 2024-03-14)" is a rule that survives organizational turnover.

10. **Review and recalibrate thresholds quarterly.** Data distributions change: product launches bring new customer segments, pricing changes alter MRR distributions, seasonality affects order volumes. A threshold calibrated in January may be wrong by July. Schedule a quarterly rule review in the team calendar and tie it to the rule set's version history.

11. **Write uniqueness rules at the correct scope.** A `email` field may be non-unique across all historical records (a churned customer reactivates with the same email) but unique among active customers. Write the WHERE clause to match the business rule: `WHERE status IN ('active', 'trial')`. Overly broad uniqueness rules cause false positives; overly narrow ones miss real duplicates.

12. **For financial and billing fields, use exact decimal arithmetic in validation queries.** Do not use floating-point comparison for monetary values. Use `ABS(a - b) > 0.01` (absolute tolerance of 1 cent) rather than `a != b`. Floating-point representation errors in DOUBLE or FLOAT columns will cause constant false positives on arithmetic checks.

---

## Edge Cases

### New Dataset with No Historical Baseline
There is no profiling data to calibrate thresholds against. Setting strict thresholds immediately will cause constant false alarms; setting no thresholds monitors nothing.

**Handling:**
- Run all rules in INFO mode for 14--30 days (longer for low-frequency loads). Store all results in the quality result table.
- After the calibration period, compute: null rates, value distribution statistics (min, max, mean, stddev, p5, p95), row count mean and standard deviation, and daily sum mean and standard deviation for measure fields.
- Set initial WARNING threshold at 2x the observed peak rate (e.g., if null rate peaked at 1.3% during calibration, set WARNING at 2.6%). Set CRITICAL at 5x (6.5%).
- Tighten thresholds in three rounds: after 30 days of stable operation (no false alarms), halve the multiplier. After another 30 days, halve again. Target the thresholds converging to the business requirement (e.g., 0% for required fields) within 90--120 days.
- Mark all rules with `[CALIBRATING -- Thresholds provisional until YYYY-MM-DD]` in the rule set.

### Third-Party Data Source with No Quality Guarantees
A data vendor, API provider, or acquired company's database delivers data with unknown or inconsistent quality. You cannot enforce quality at the source.

**Handling:**
- Define all rules at the ingestion boundary -- apply quality checks to the raw landing table before any transformation.
- Create a quarantine pattern: records failing CRITICAL rules go to `[table_name]_quarantine`; records passing go to the normal processing pipeline. Never delete quarantined records -- they are needed for vendor disputes and root cause analysis.
- Do not block the pipeline for WARNING violations from third-party sources unless they exceed a catastrophic threshold (e.g., >20% of records failing). The vendor's quality issues should not halt your pipeline entirely.
- Track vendor quality metrics over time (rolling 30-day pass rates per rule) and include them in vendor SLA reviews or contract negotiations.
- Add a `data_quality_score` column to the processed table: a simple 0.0--1.0 score representing the fraction of quality rules the record passed. Downstream consumers can filter on this column for high-stakes use cases.

### Slowly Changing Dimensions (SCD)
A dimension table uses SCD Type 2 (row versioning with `valid_from`, `valid_to`, `is_current`). Legitimate changes (customer changes address, product changes price) must not be flagged as quality violations.

**Handling:**
- Uniqueness rules must be scoped to current records: `WHERE is_current = TRUE` or `WHERE valid_to IS NULL`. A customer's surrogate key should be unique among current records; historical surrogate keys for the same natural key are expected duplicates.
- Temporal ordering rules apply to the version window: `valid_to >= valid_from` (or `valid_to IS NULL` for the current version) is the correct check, not a global `end_date >= start_date`.
- Add a specific SCD consistency rule: `is_current = TRUE` must occur exactly once per natural key. Query: `SELECT natural_key, SUM(CASE WHEN is_current THEN 1 ELSE 0 END) AS current_count FROM dim_table GROUP BY natural_key HAVING current_count != 1` should return 0 rows.
- Accuracy rules (statistical outlier checks) should be applied to the current version only. Including historical rows in aggregate statistics will distort the distribution.

### Very Large Table (Billions of Rows)
Full-table quality checks on a billion-row table may run for hours, blocking downstream pipelines and consuming excessive compute resources.

**Handling:**
- Tiered execution strategy: on-load checks run on the new/incremental partition only (e.g., records with `created_at >= load_start_time`). Full-table checks run weekly during a scheduled maintenance window.
- Statistical checks (null rates, outlier detection) run on a random stratified sample. Use reservoir sampling or hash-based sampling: `WHERE MOD(HASH(id), 100) < 1` gives a deterministic 1% sample. Document the sampling method and its confidence intervals (at 1% sample of 1B rows = 10M records, a 95% confidence interval on a 0.1% null rate is approximately ±0.006%).
- Uniqueness checks on PKs and business keys can use approximate algorithms (HyperLogLog) to detect near-duplicates without full cross-joins. Most modern warehouses (BigQuery `APPROX_COUNT_DISTINCT`, Redshift `HLL_CREATE_SKETCH`) support this natively.
- Run freshness and row count checks at full table scope -- these are O(1) aggregations and are always fast. Never sample freshness or row count checks.
- Tag each rule with its expected execution time based on the last profiling run. Rules taking more than 10 minutes should automatically trigger a sampling strategy.

### Multiple Tables Sharing a Quality Domain (Data Mesh / Domain-Owned Data)
Multiple teams own different tables in the same logical domain (e.g., three product teams each own a slice of the `events` table). Overlapping quality ownership causes gaps and conflicts.

**Handling:**
- Use a RACI matrix per field: Responsible (who writes the rule and maintains it), Accountable (who is on-call for failures), Consulted (who must be informed of changes to the rule), Informed (who receives alerts).
- Define cross-domain consistency rules explicitly, with ownership assigned to the consuming team rather than the producing team. The producing team cannot be expected to know how their data is used downstream.
- Implement a data contract: a formal, versioned agreement between the producer and consumer that specifies the exact quality rules the producer guarantees. Data contracts can be maintained in YAML alongside the dbt project and enforced at runtime.
- Use a centralized quality results table shared across all domain teams. Each rule is tagged with `domain`, `team`, and `data_product` to enable cross-domain quality dashboards and executive-level quality reporting.

### Composite or Derived Metrics as Quality Subjects
A user wants quality rules not on a raw table but on a calculated metric or a dbt model that joins multiple tables. The "data" being checked is a transformation output, not source data.

**Handling:**
- Apply the same five-dimension framework, but note the additional complexity: a validity failure could originate from any of the source tables feeding the model. Rules on derived models should link back to source-table rules that would explain the failure.
- Add lineage metadata to each rule: "This rule checks the output of model `fct_revenue`. Failures in this rule should first be investigated via rules C-002 (customers.email), X-002 (orders.customer_id FK), and A-003 (daily order sum drift) on the upstream sources."
- For calculated fields, define expected mathematical properties explicitly: `total_revenue = SUM(line_item_amount) - SUM(discount_amount) + SUM(tax_amount)`. Test this identity within a rounding tolerance.
- Freshness for derived models is the freshness of the most upstream dependency. If `fct_revenue` depends on `raw.orders` and `raw.customers`, the freshness SLA for `fct_revenue` is the minimum of the two source freshness SLAs.

### Regulatory and Compliance Requirements (GDPR, HIPAA, SOX, PCI-DSS)
Quality rules on regulated data carry legal weight. A quality failure may not just be a data problem -- it may be a reportable incident.

**Handling:**
- PII completeness rules (email, SSN, date of birth) must meet the standard required by the relevant regulation. Under GDPR, records with identifiable data must be associated with a valid consent record -- add a cross-table consistency rule checking FK to the consent table.
- Under SOX, financial figures reported to auditors must meet accuracy standards. Any accuracy rule (A-001 through A-004) on a SOX-in-scope table should be CRITICAL severity with a 0% tolerance policy and a documented approval workflow for any threshold change.
- Implement immutable audit logging for all quality rule changes. Who changed a threshold, when, and with whose approval must be traceable. Store rule version history in version control with required code review.
- Data retention rules are a sixth quality dimension for regulated data: records must not exist beyond their defined retention period, and records must not be deleted before their minimum retention period. Add explicit retention rules to the rule set for regulated tables.

---

## Example

**Input:** "Define data quality rules for our `orders` table. It has columns: order_id, customer_id, order_status, order_date, shipped_date, line_item_count, subtotal, discount_amount, tax_amount, total_amount, currency_code, warehouse_id. This table feeds our revenue dashboard, our logistics system, and our monthly financial close."

---

## Data Quality Rules: analytics.orders

### Overview

| Attribute | Value |
|-----------|-------|
| Data Asset | analytics.orders |
| Data Producer | E-commerce application (order service), writes via Kafka → Snowflake connector |
| Data Steward | Data Engineering team |
| Data Consumers | Revenue dashboard (Tableau), Logistics system (warehouse allocation), Monthly financial close (NetSuite reconciliation) |
| Refresh Cadence | Near-real-time Kafka stream; Snowflake table updated every 15 minutes |
| Quality SLA | CRITICAL rules must pass before 07:00 UTC daily for financial close. Freshness check every 30 minutes. |
| Business Criticality | TIER 1 -- Revenue-critical. Failures in this table affect financial reporting and logistics. |
| Check Framework | dbt tests (on-load) + Airflow DAG for hourly/daily checks + custom SQL assertions in `quality.rule_results` |
| Result Store | analytics.quality.rule_results |
| Baseline Established | 2024-09-15 (profiled over 60 days) |
| Last Rule Review | 2025-01-10 |
| Next Scheduled Review | 2025-04-10 |

---

### Field Inventory

| Field | Physical Type | Nullable | Tier | Role | Business Meaning | Known Issues |
|-------|--------------|----------|------|------|-----------------|--------------|
| order_id | VARCHAR(36) | N | 1 | PK (UUID) | Globally unique order identifier | Legacy orders pre-2020 use sequential integers, not UUIDs |
| customer_id | BIGINT | N | 1 | FK → customers.id | Links to the purchasing customer | No DB-enforced FK in Snowflake |
| order_status | VARCHAR(20) | N | 1 | Enum Attribute | Current lifecycle status of the order | Status 'legacy_closed' exists only for orders before 2019 |
| order_date | TIMESTAMP WITH TIME ZONE | N | 1 | Audit / Measure | When the customer placed the order | Timezone is always UTC; legacy records may be UTC-naive |
| shipped_date | TIMESTAMP WITH TIME ZONE | Y | 2 | Audit / Measure | When the order left the warehouse. NULL if not yet shipped | NULL is valid for statuses: pending, processing, cancelled |
| line_item_count | INTEGER | N | 2 | Measure | Number of distinct line items on the order | Minimum value is 1 |
| subtotal | DECIMAL(12,2) | N | 1 | Measure | Sum of line items before discount and tax, in currency_code | Must equal sum of order_items.line_total for this order |
| discount_amount | DECIMAL(12,2) | N | 1 | Measure | Total discount applied. 0.00 if no discount | Must be >= 0 and <= subtotal |
| tax_amount | DECIMAL(12,2) | N | 1 | Measure | Tax charged in currency_code | Must be >= 0. Can be 0 for tax-exempt customers |
| total_amount | DECIMAL(12,2) | N | 1 | Measure | Final amount charged: subtotal - discount + tax | Must equal subtotal - discount_amount + tax_amount |
| currency_code | CHAR(3) | N | 1 | Attribute | ISO 4217 currency code | Must be one of: USD, EUR, GBP, CAD, AUD |
| warehouse_id | INTEGER | Y | 2 | FK → warehouses.id | Warehouse fulfilling the order. NULL if not yet assigned | NULL valid when order_status IN ('pending', 'cancelled') |

---

### Quality Rules

#### Completeness Rules

| Rule ID | Field | Rule Description | SQL Test | Threshold | Severity | Check Frequency | Owner |
|---------|-------|-----------------|----------|-----------|----------|-----------------|-------|
| C-001 | order_id | Must not be NULL | `SELECT COUNT(*) FROM analytics.orders WHERE order_id IS NULL` | 0 records | CRITICAL | On-load | Data Engineering |
| C-002 | customer_id | Must not be NULL | `SELECT COUNT(*) FROM analytics.orders WHERE customer_id IS NULL` | 0 records | CRITICAL | On-load | Data Engineering |
| C-003 | order_status | Must not be NULL | `SELECT COUNT(*) FROM analytics.orders WHERE order_status IS NULL` | 0 records | CRITICAL | On-load | Data Engineering |
| C-004 | order_date
