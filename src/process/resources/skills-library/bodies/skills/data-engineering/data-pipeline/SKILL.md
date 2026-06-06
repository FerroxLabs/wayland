---
name: data-pipeline
description: |
  Data pipeline orchestration expertise covering Airflow DAG design, dbt models, pipeline patterns (batch, micro-batch, streaming), dependency management, idempotency, backfill strategies, data lineage tracking, and monitoring for building reliable, observable data workflows.
  Use when the user asks about data pipeline, data pipeline best practices, or needs guidance on data pipeline implementation.
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
  difficulty: "intermediate"
---

# Data Pipeline Orchestrator

## Overview

Data pipeline orchestration is the discipline of scheduling, coordinating, and monitoring data workflows that move and transform data across systems. This skill covers the design principles, tools, and patterns needed to build pipelines that are reliable, observable, and maintainable.

## Apache Airflow DAG Design

### DAG Structure Best Practices

```python
from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.operators.empty import EmptyOperator
from airflow.providers.common.sql.operators.sql import SQLExecuteQueryOperator
from airflow.utils.task_group import TaskGroup
from airflow.models import Variable

# DAG-level defaults
default_args = {
    'owner': 'data-engineering',
    'depends_on_past': False,
    'email_on_failure': True,
    'email_on_retry': False,
    # ... (condensed) ...
            task_id='check_freshness',
            python_callable=validate_freshness,
        )

    start >> extract_group >> transform_group >> load_group >> validate_group >> end
```

### Airflow Patterns

#### XCom for Inter-Task Communication

```python
# Push data (small values only - max ~48KB in metadata DB)
def extract_task(**context):
    record_count = run_extraction()
    context['ti'].xcom_push(key='record_count', value=record_count)
    return {'status': 'success', 'file_path': 's3://bucket/staging/extract.parquet'}

# Pull data
def transform_task(**context):
    extract_result = context['ti'].xcom_pull(task_ids='extract_crm')
    file_path = extract_result['file_path']
    record_count = context['ti'].xcom_pull(task_ids='extract_crm', key='record_count')
```

#### Dynamic Task Mapping (Airflow 2.3+)

```python
@dag(schedule='@daily', start_date=datetime(2024, 1, 1))
def process_regions():
    @task
    def get_active_regions():
        return ['us-east', 'us-west', 'eu-west', 'ap-southeast']

    @task
    def process_region(region: str):
        # This runs once per region, in parallel
        return extract_and_transform(region)

    @task
    def consolidate(results):
        # Receives list of all results
        return merge_results(results)

    regions = get_active_regions()
    results = process_region.expand(region=regions)
    consolidate(results)
```

#### Branching and Conditional Execution

```python
from airflow.operators.python import BranchPythonOperator

def choose_branch(**context):
    execution_date = context['ds']
    day_of_week = datetime.strptime(execution_date, '%Y-%m-%d').weekday()
    if day_of_week == 0:  # Monday
        return 'full_refresh'
    return 'incremental_load'

branch = BranchPythonOperator(
    task_id='choose_load_strategy',
    python_callable=choose_branch,
)

full_refresh = PythonOperator(task_id='full_refresh', ...)
incremental_load = PythonOperator(task_id='incremental_load', ...)
merge_results = EmptyOperator(task_id='merge', trigger_rule='none_failed_min_one_success')

branch >> [full_refresh, incremental_load] >> merge_results
```

## dbt Models

### Project Structure

```
dbt_project/
  dbt_project.yml
  packages.yml
  models/
    staging/           # 1:1 with source tables, light transformations
      stg_stripe/
        _stg_stripe__models.yml
        stg_stripe__customers.sql
        stg_stripe__payments.sql
      stg_salesforce/
        _stg_salesforce__models.yml
        stg_salesforce__contacts.sql
    intermediate/      # Business logic, joins, complex transforms
      int_customer_payments_pivoted.sql
      # ... (condensed) ...
      assert_total_revenue_matches_stripe.sql
  seeds/
    country_codes.csv
  snapshots/
    snap_customer.sql
```

### dbt Model Patterns

```sql
-- models/staging/stg_stripe/stg_stripe__customers.sql
{{
    config(
        materialized='view',
        tags=['stripe', 'daily']
    )
}}

WITH source AS (
    SELECT * FROM {{ source('stripe', 'customers') }}
),

renamed AS (
    SELECT
        # ... (condensed) ...
       OR o._loaded_at > (SELECT MAX(updated_at) FROM {{ this }})
    {% endif %}
)

SELECT * FROM final
```

### dbt Tests and Documentation

```yaml
# models/marts/core/_core__models.yml
version: 2

models:
  - name: dim_customer
    description: >
      One row per customer. Combines Stripe customer data with order history
      and support ticket metrics.
    columns:
      - name: customer_id
        description: Unique customer identifier from Stripe
        data_tests:
          - unique
          - not_null
      # ... (condensed) ...
      - name: total_orders
        data_tests:
          - dbt_expectations.expect_column_values_to_be_between:
              min_value: 0
              max_value: 100000
```

## Pipeline Patterns

### Batch Processing

```
Schedule -> Extract -> Stage -> Transform -> Load -> Validate -> Notify
                                                         |
                                                    (on failure)
                                                         |
                                                   Dead Letter Queue
```

**Best for**: Daily/hourly reporting, warehouse loads, ML feature computation

### Micro-Batch Processing

```
Continuous Loop:
  1. Poll for new data (every 1-15 minutes)
  2. If data exists: process batch
  3. Checkpoint progress
  4. Sleep until next poll
```

```python
# Micro-batch with Airflow sensor
from airflow.sensors.sql import SqlSensor

wait_for_data = SqlSensor(
    task_id='wait_for_new_records',
    conn_id='source_db',
    sql="""
        SELECT COUNT(*) FROM events
        WHERE created_at > '{{ prev_data_interval_end_success }}'
    """,
    mode='reschedule',  # Free up worker slot while waiting
    poke_interval=300,  # Check every 5 minutes
    timeout=3600,       # Give up after 1 hour
)
```

### Lambda Architecture (Batch + Streaming)

```
Real-time path (speed layer):
  Source -> Kafka -> Stream Processor -> Serving Layer (hot data)

Batch path (batch layer):
  Source -> Data Lake -> Batch Processor -> Serving Layer (complete data)

Serving layer merges both views for queries
```

### Kappa Architecture (Streaming Only)

```
Source -> Kafka (immutable log) -> Stream Processor -> Serving Layer
                                       |
                                  Reprocessing: replay from Kafka offset 0
```

## Dependency Management

### Cross-DAG Dependencies

```python
from airflow.sensors.external_task import ExternalTaskSensor

# Wait for upstream DAG to complete
wait_for_upstream = ExternalTaskSensor(
    task_id='wait_for_raw_data_load',
    external_dag_id='raw_data_ingestion',
    external_task_id='load_complete',
    execution_date_fn=lambda dt: dt,  # Same logical date
    mode='reschedule',
    timeout=7200,
)
```

### Dataset-Driven Scheduling (Airflow 2.4+)

```python
from airflow import Dataset

# Producer DAG: declares output dataset
raw_customers = Dataset("s3://bucket/raw/customers/")

with DAG('ingest_customers', schedule='@hourly') as producer_dag:
    ingest = PythonOperator(
        task_id='ingest',
        python_callable=ingest_fn,
        outlets=[raw_customers],  # Declares this task produces this dataset
    )

# Consumer DAG: triggered when dataset is updated
with DAG('transform_customers', schedule=[raw_customers]) as consumer_dag:
    transform = PythonOperator(
        task_id='transform',
        python_callable=transform_fn,
    )
```

## Idempotency

Every pipeline run must produce the same result regardless of how many times it executes.

### Idempotency Patterns

```python
# Pattern 1: Partition overwrite
def idempotent_load(spark, source_path, target_path, partition_date):
    df = spark.read.parquet(source_path)
    df.write \
        .mode("overwrite") \
        .partitionBy("date") \
        .option("partitionOverwriteMode", "dynamic") \
        .parquet(target_path)

# Pattern 2: DELETE + INSERT in transaction
def idempotent_sql_load(engine, staging_table, target_table, partition_col, partition_val):
    with engine.begin() as conn:
        conn.execute(f"""
            DELETE FROM {target_table}
            # ... (condensed) ...
            WHERE {partition_col} = '{partition_val}'
        """)

# Pattern 3: MERGE/UPSERT with deterministic output
# The result after N runs is identical to the result after 1 run
```

### Execution Date Discipline

```python
# ALWAYS use logical execution date, NEVER wall-clock time
def extract_fn(**context):
    # Correct: process data for the logical execution window
    start = context['data_interval_start']
    end = context['data_interval_end']

    query = f"""
        SELECT * FROM events
        WHERE event_time >= '{start}' AND event_time < '{end}'
    """
    # This is idempotent: same execution date always queries same window
```

## Backfill Strategies

### Airflow Backfill

```shell
# CLI backfill for a date range
airflow dags backfill \
    --start-date 2024-01-01 \
    --end-date 2024-06-30 \
    --reset-dagruns \
    customer_360_daily

# Limit parallelism during backfill
airflow dags backfill \
    --start-date 2024-01-01 \
    --end-date 2024-06-30 \
    --max-active-runs 3 \
    customer_360_daily
```

### Backfill Considerations

1. **Resource contention**: Backfills compete with production runs; use separate pools or time windows
2. **Rate limits**: API sources may throttle; add delays between backfill runs
3. **Dependency ordering**: Backfill upstream DAGs first
4. **Data availability**: Historical source data may have been archived or deleted
5. **Schema changes**: Old data may have different schemas; handle gracefully

## Data Lineage

### Column-Level Lineage

```yaml
# dbt exposure for lineage documentation
version: 2

exposures:
  - name: weekly_revenue_dashboard
    type: dashboard
    maturity: high
    url: [reference URL]
    description: Executive weekly revenue dashboard
    depends_on:
      - ref('fct_revenue')
      - ref('dim_customer')
      - ref('dim_product')
    owner:
      name: Analytics Team
      email: analytics@company.com
```

### Lineage Tracking Implementation

```python
# Simple lineage metadata capture
class LineageTracker:
    def __init__(self, catalog_api):
        self.catalog = catalog_api

    def record_transformation(self, job_id, inputs, outputs, transformation_type):
        lineage_event = {
            'job_id': job_id,
            'timestamp': datetime.utcnow().isoformat(),
            'inputs': [{'dataset': i, 'type': 'read'} for i in inputs],
            'outputs': [{'dataset': o, 'type': 'write'} for o in outputs],
            'transformation_type': transformation_type,
            'run_id': str(uuid.uuid4()),
        }
        self.catalog.emit_lineage(lineage_event)
```

## Monitoring and Alerting

### Key Pipeline Metrics

| Metric | Alert Threshold | Action |
|--------|----------------|--------|
| Pipeline duration | >2x historical p95 | Investigate resource contention or data growth |
| Task failure rate | >0% for critical paths | Page on-call engineer |
| Data freshness | >SLA target | Escalate to pipeline owner |
| Row count deviation | >20% from historical | Investigate source system changes |
| Schema drift | Any unexpected column | Block pipeline, notify data owner |

### Alerting Configuration

```python
from airflow.providers.slack.operators.slack_webhook import SlackWebhookOperator

def on_failure_callback(context):
    task_instance = context['task_instance']
    dag_id = context['dag'].dag_id
    task_id = task_instance.task_id
    execution_date = context['execution_date']
    log_url = task_instance.log_url

    SlackWebhookOperator(
        task_id='slack_alert',
        slack_webhook_conn_id='slack_data_eng',
        message=f"""
:red_circle: Pipeline Failure
*DAG*: {dag_id}
*Task*: {task_id}
*Execution Date*: {execution_date}
*Log*: {log_url}
        """,
    ).execute(context)
```

## Pipeline Design Decision Tree

1. **Latency requirement < 1 second**: Use streaming (Kafka + Flink)
2. **Latency requirement < 5 minutes**: Use micro-batch (Spark Structured Streaming)
3. **Latency requirement < 1 hour**: Use frequent batch (Airflow with short intervals)
4. **Latency requirement < 24 hours**: Use daily batch (Airflow + dbt)
5. **Data volume < 1 GB**: pandas or SQL-based transforms
6. **Data volume 1 GB - 1 TB**: Spark or warehouse-native transforms (dbt)
7. **Data volume > 1 TB**: Spark with dedicated cluster
8. **Complex dependencies**: Airflow for orchestration
9. **SQL-centric transforms**: dbt for transformation, Airflow for orchestration
10. **ML features**: Feature store integration (Feast, Tecton)

## When to Use

**Use this skill when:**
- Designing or implementing data pipeline solutions
- Reviewing or improving existing data pipeline approaches
- Making architectural or implementation decisions about data pipeline
- Learning data pipeline patterns and best practices
- Troubleshooting data pipeline-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Data Pipeline Analysis

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

**Input:** "Help me implement data pipeline for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended data pipeline approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When data pipeline must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
