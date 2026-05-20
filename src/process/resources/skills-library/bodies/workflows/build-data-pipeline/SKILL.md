---
name: build-data-pipeline
description: >-
  Complete workflow for building a production-grade data pipeline from source
  identification through ingestion, transformation, warehousing, and
  dashboarding. Covers batch and streaming patterns, data quality,
  orchestration, and the modern data stack approach to analytics infrastructure.

  Use when the user wants to build data pipeline or needs a structured
  multi-step process for this goal.

  Do NOT use when the request is a single-step task or requires professional
  advice beyond educational guidance.
license: Apache-2.0
type: workflow
skills: >-
  data-pipeline etl-architect sql-master data-modeler dbt-engineer
  data-validator streaming-architect analytics-engineer monitoring-engineer
  data-lakehouse-architect
trigger_phrases: >-
  I want to build a data pipeline I need to set up ETL How do I build a data
  warehouse I want to create analytics dashboards
metadata:
  author: foundry-skills
  version: 1.0.0
  tags: step-by-step planning
  category: software-project
  depends: >-
    data-pipeline etl-architect sql-master data-modeler dbt-engineer
    data-validator streaming-architect analytics-engineer monitoring-engineer
    data-lakehouse-architect
  disclaimer: none
  difficulty: intermediate
---
# Build Data Pipeline

**Estimated time:** 4-8 weeks

A data pipeline is the circulatory system of a data-driven organization -- it moves data from where it is generated to where it creates value. This workflow covers the full modern data stack: extracting data from operational systems, loading it into a warehouse, transforming it with dbt, validating quality, and surfacing insights through dashboards. It supports both batch and streaming patterns and prioritizes reliability, observability, and incremental delivery.

The workflow follows the ELT (Extract-Load-Transform) pattern that dominates modern data engineering: load raw data into the warehouse first, then transform it using SQL-based tools like dbt. This approach leverages the warehouse's compute power and keeps transformations version-controlled and testable.

## When to Use

- User wants to build data pipeline
- User needs a structured, step-by-step process for build data pipeline
- User wants to build a data pipeline
- I need to set up ETL
- How do I build a data warehouse
- Do NOT use when: the request is outside the scope of build data pipeline or requires professional advice beyond educational guidance
- Do NOT use for single-step tasks that one atomic skill can handle independently

## Prerequisites

Before starting this workflow, ensure:

- Access to source data systems (databases, APIs, SaaS tools)
- A data warehouse or lakehouse (Snowflake, BigQuery, Databricks, or Redshift)
- Basic SQL proficiency
- Understanding of the business questions the pipeline should answer
- Cloud provider account with budget for compute and storage
- Stakeholders who will consume the data (analysts, product managers, executives)

## Steps

**Step 1: Identify Data Sources and Requirements** (uses: analytics-engineer)

work backwards from business questions to data requirements. For each question (e.g., "What is our monthly revenue by product?"), identify the source systems, relevant tables/APIs, update frequency, and data volume. Document data freshness requirements: some metrics need real-time streaming, others are fine with daily batch updates. Create a source catalog that maps every data source to its connection method, volume, and quality expectations.

- Input: Business questions that need data-driven answers, Available data sources (databases, APIs, event streams, files), Stakeholder requirements for dashboards and reports
- Output: Business questions catalog with data requirements, Source system inventory (connection type, volume, frequency), Data freshness requirements per metric
- Key focus: Use the Analytics Engineer skill to work backwards from business questions to data requirements

**Step 2: Design the Data Architecture** (uses: data-lakehouse-architect)

choose the architecture pattern: pure data warehouse (Snowflake, BigQuery), data lakehouse (Databricks, Iceberg), or hybrid. Use the Data Modeler skill to design the data model using the medallion architecture: bronze (raw data), silver (cleaned and conformed), gold (business-ready aggregates). Design the dimensional model for the gold layer using star schemas for common analytical patterns.

- Input: Source catalog from Step 1, Data freshness and volume requirements, Budget constraints
- Output: Architecture decision document (warehouse, lakehouse, or hybrid), Medallion architecture design (bronze, silver, gold layers), Dimensional model for gold layer (star schemas)
- Key focus: Use the Data Lakehouse Architect skill to choose the architecture pattern: pure data warehouse (Snowflake, BigQuery), data lakehouse (Databricks, Iceberg), or hybrid

**Step 3: Build the Ingestion Layer** (uses: etl-architect)

design extraction patterns for each source. For databases, use Change Data Capture (CDC) or incremental extraction with high-water marks. For APIs, build paginated extractors with rate limit handling. For event streams, use a message broker. Use the Data Pipeline Orchestrator skill to set up Airflow (or Dagster/Prefect) to orchestrate ingestion jobs with proper scheduling, retries, and failure notifications. Load raw data into the bronze layer without transformation -- preserve the source truth.

- Input: Source catalog from Step 1, Target warehouse from Step 2, Extraction patterns needed (full load, incremental, CDC)
- Output: Ingestion jobs for each data source, Orchestration DAGs with scheduling and dependencies, CDC or incremental extraction configuration
- Key focus: Use the ETL Architect skill to design extraction patterns for each source

**Step 4: Build the Transformation Layer** (uses: dbt-engineer)

build the transformation layer. Create dbt models in three layers: staging (one model per source table, rename and cast columns), intermediate (business logic joins and calculations), and marts (final dimensional models for consumption). Use the SQL Master skill to write performant SQL for complex transformations (window functions, CTEs, incremental materializations). Implement dbt tests for data quality: unique, not_null, accepted_values, and custom relationship tests.

- Input: Bronze layer data from Step 3, Silver and gold layer models from Step 2, Business logic and transformation rules
- Output: dbt project with staging, intermediate, and mart models, dbt tests for data quality (schema tests and custom tests), dbt documentation with model descriptions and column definitions
- Key focus: Use the dbt Engineer skill to build the transformation layer

**Step 5: Implement Data Quality** (uses: data-validator)

implement comprehensive data quality checks beyond basic dbt tests. Add volume checks (row count anomaly detection), freshness checks (data arrived on time), distribution checks (statistical bounds on key metrics), and referential integrity checks (foreign keys resolve). Implement data contracts between producers and consumers. Set up quality scoring so stakeholders can see confidence levels alongside metrics.

- Input: dbt models from Step 4, Data quality expectations from stakeholders, Historical data patterns
- Output: Data quality test suite (volume, freshness, distribution, referential integrity), Data contract definitions for key interfaces, Quality scoring dashboard
- Key focus: Use the Data Validator skill to implement comprehensive data quality checks beyond basic dbt tests

**Step 6: Build Dashboards and Analytics** (uses: analytics-engineer)

build dashboards that answer the business questions identified in Step 1. Design dashboards with progressive disclosure: executive summary at the top, drill-down details below. Define a semantic/metrics layer that provides consistent definitions for key metrics (revenue, churn, DAU). Build self-service analytics views so analysts can explore data without engineering support. Document every metric with its definition, calculation logic, and data source.

- Input: Gold layer mart models from Step 4, Business questions from Step 1, Stakeholder preferences for BI tools
- Output: Executive dashboards for key business metrics, Departmental dashboards (sales, product, marketing, finance), Metrics layer with consistent definitions
- Key focus: Use the Analytics Engineer skill to build dashboards that answer the business questions identified in Step 1

**Step 7: Implement Monitoring and Alerting** (uses: monitoring-engineer)

build pipeline monitoring. Track job execution times, success/failure rates, data volumes, and freshness. Use the Data Pipeline Orchestrator skill to configure Airflow alerting on task failures, SLA misses, and quality check failures. Build an operational dashboard showing pipeline health at a glance. Create runbooks for common failure scenarios (source unavailable, schema change, volume spike).

- Input: Full pipeline from Steps 3-6, SLAs for data freshness and quality, On-call expectations
- Output: Pipeline health dashboard, Job execution monitoring (duration, success rate, data volume), SLA monitoring with alerting
- Key focus: Use the Monitoring Engineer skill to build pipeline monitoring

## Decision Points

- **After Step ?:** 
  - If **After Step 1**: Align with stakeholders on priorities
  - If **After Step 3**: Stabilize ingestion before building transforms
  - If **After Step 4**: Fix transformation logic and add more tests
  - If **After Step 5**: Address data quality issues before building dashboards

## Failure Handling

- **Starting with dashboards:** -- Building dashboards before the data model is solid creates a house of cards. Get the foundation right first.
- **No incremental loads:** -- Full table reloads are slow and expensive. Use CDC or incremental extraction from the start.
- **Transformation in ingestion:** -- Keep ingestion (bronze) as raw as possible. Transform in dbt where it is testable and version-controlled.
- **No data quality checks:** -- Without quality checks, you only learn data is bad when a VP's dashboard looks wrong. Check quality automatically.
- **Metric inconsistency:** -- If revenue means different things on different dashboards, trust in data collapses. Define metrics once in a semantic layer.

## Expected Outcome

When this workflow is complete, the user will have:

1. Pipeline delivers data within freshness SLAs (e.g., daily data available by 7am)
2. Data quality score exceeds 95% across all quality dimensions
3. Dashboards answer the business questions identified in Step 1
4. Self-service analytics reduces ad-hoc data request volume by 50%+
5. Pipeline failures are detected and resolved within the SLA
6. Warehouse costs are predictable and within budget

## Output Format

```
BUILD DATA PIPELINE TRACKER
===========================

[ ] Step 1: Identify Data Sources and Requirements
    Status: [pending/in-progress/complete]
[ ] Step 2: Design the Data Architecture
    Status: [pending/in-progress/complete]
[ ] Step 3: Build the Ingestion Layer
    Status: [pending/in-progress/complete]
[ ] Step 4: Build the Transformation Layer
    Status: [pending/in-progress/complete]
[ ] Step 5: Implement Data Quality
    Status: [pending/in-progress/complete]
[ ] Step 6: Build Dashboards and Analytics
    Status: [pending/in-progress/complete]
[ ] Step 7: Implement Monitoring and Alerting
    Status: [pending/in-progress/complete]

Timeline: ______ weeks
Overall Status: [IN PROGRESS / COMPLETE]
```

**Adaptation notes:**
- Adjust timeline based on user's availability and prior experience
- Steps may be reordered if dependencies allow parallel execution
- Skip optional steps if time or budget is constrained

## Edge Cases

- **Starting with dashboards:** -- Building dashboards before the data model is solid creates a house of cards. Get the foundation right first.
- **No incremental loads:** -- Full table reloads are slow and expensive. Use CDC or incremental extraction from the start.
- **Transformation in ingestion:** -- Keep ingestion (bronze) as raw as possible. Transform in dbt where it is testable and version-controlled.
- **No data quality checks:** -- Without quality checks, you only learn data is bad when a VP's dashboard looks wrong. Check quality automatically.

## Example

**Input:** "I want to build data pipeline and need a structured plan to follow step by step."

**Output:**

**Step 1 (analytics-engineer):** Identify Data Sources and Requirements -- produces concrete deliverables for this phase.

**Step 2 (data-lakehouse-architect-data-modeler):** Design the Data Architecture -- produces concrete deliverables for this phase.

**Step 3 (etl-architect-data-pipeline-orchestrator):** Build the Ingestion Layer -- produces concrete deliverables for this phase.

**Step 4 (dbt-engineer-sql-master):** Build the Transformation Layer -- produces concrete deliverables for this phase.

**Step 5 (data-validator):** Implement Data Quality -- produces concrete deliverables for this phase.

**Step 6 (analytics-engineer):** Build Dashboards and Analytics -- produces concrete deliverables for this phase.

**Step 7 (monitoring-engineer-data-pipeline-orchestrator):** Implement Monitoring and Alerting -- produces concrete deliverables for this phase.

**Result:** User has a complete build data pipeline plan with all deliverables produced, validated, and ready for implementation.
