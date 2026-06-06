---
name: orchestration-engineer
description: |
  Data pipeline orchestration covering Apache Airflow DAG design patterns, Dagster software-defined assets, Prefect flow composition, retry and backfill strategies, dependency management, dynamic task generation, monitoring and alerting, SLA tracking, cross-system orchestration, and production operation patterns.
  Use when the user asks about orchestration engineer, orchestration engineer best practices, or needs guidance on orchestration engineer implementation.
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

# Orchestration Engineer

## Overview

Pipeline orchestration is the practice of defining, scheduling, monitoring, and maintaining complex data workflows. This skill covers the three major orchestration frameworks (Airflow, Dagster, Prefect), common DAG design patterns, error handling strategies, and production operational patterns that keep data flowing reliably.

## Framework Selection Guide

| Factor | Airflow | Dagster | Prefect |
|--------|---------|---------|---------|
| Maturity | Most mature, largest community | Growing rapidly, modern design | Cloud-native, developer-friendly |
| Paradigm | DAGs of tasks (imperative) | Software-defined assets (declarative) | Flows of tasks (Pythonic) |
| Testing | Requires running scheduler | First-class local testing | Easy local execution |
| UI | Functional, complex | Modern, asset-focused | Clean, observation-focused |
| Scaling | Celery/K8s executors | Runs on K8s, multi-process | Workers, K8s, serverless |
| Best For | Complex scheduling, large teams | Asset-centric, data mesh | Rapid development, small teams |
| Dynamic | Limited (dynamic task mapping) | Strong (partitions, configs) | Strong (map, submit) |

## Apache Airflow

### DAG Design Patterns

```python
from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.providers.postgres.operators.postgres import PostgresOperator
from airflow.providers.amazon.aws.transfers.s3_to_redshift import S3ToRedshiftOperator
from airflow.utils.task_group import TaskGroup
from datetime import datetime, timedelta

default_args = {
    'owner': 'data-eng',
    'depends_on_past': False,
    'email_on_failure': True,
    'email': ['data-eng-alerts@company.com'],
    'retries': 3,
    'retry_delay': timedelta(minutes=5),
    'retry_exponential_backoff': True,
    'max_retry_delay': timedelta(minutes=30),
    'execution_timeout': timedelta(hours=2),
    'sla': timedelta(hours=3),
}

with DAG(
    dag_id='etl_orders_daily',
    default_args=default_args,
    description='Daily orders ETL pipeline',
    schedule_interval='0 6 * * *',
    start_date=datetime(2024, 1, 1),
    catchup=False,
    max_active_runs=1,
    tags=['etl', 'orders', 'daily'],
) as dag:

    # Pattern: Task groups for logical organization
    with TaskGroup('extract') as extract_group:
        extract_orders = PythonOperator(
            task_id='extract_orders',
            python_callable=extract_from_api,
            op_kwargs={'endpoint': '/orders', 'date': '{{ ds }}'},
        )
        extract_customers = PythonOperator(
            task_id='extract_customers',
            python_callable=extract_from_db,
            op_kwargs={'table': 'customers', 'date': '{{ ds }}'},
        )

    with TaskGroup('transform') as transform_group:
        validate = PythonOperator(
            task_id='validate_raw_data',
            python_callable=run_quality_checks,
        )
        transform = PythonOperator(
            task_id='transform_orders',
            python_callable=transform_and_enrich,
        )
        validate >> transform

    with TaskGroup('load') as load_group:
        load_warehouse = S3ToRedshiftOperator(
            task_id='load_to_redshift',
            s3_bucket='data-lake',
            s3_key='processed/orders/{{ ds }}/',
            schema='analytics',
            table='orders',
            copy_options=['FORMAT AS PARQUET'],
        )

    notify = PythonOperator(
        task_id='notify_completion',
        python_callable=send_slack_notification,
        trigger_rule='all_done',  # Run even if upstream failed
    )

    extract_group >> transform_group >> load_group >> notify
```

### Dynamic Task Generation

```python
from airflow.decorators import dag, task
from airflow.models import Variable

@dag(schedule_interval='@daily', start_date=datetime(2024, 1, 1), catchup=False)
def dynamic_ingestion():

    @task
    def get_source_configs():
        """Get active source configurations."""
        return Variable.get("active_sources", deserialize_json=True)

    @task
    def extract_source(source_config: dict):
        """Extract data from a single source."""
        connector = get_connector(source_config['type'])
        return connector.extract(source_config)

    @task
    def validate_extract(data_path: str, source_config: dict):
        """Run quality checks on extracted data."""
        return run_expectations(data_path, source_config['quality_suite'])

    @task
    def load_to_lake(data_path: str, source_config: dict):
        """Load validated data to data lake."""
        return write_to_delta(data_path, source_config['target_table'])

    configs = get_source_configs()
    # Dynamic task mapping: creates one branch per source
    extracted = extract_source.expand(source_config=configs)
    validated = validate_extract.expand(
        data_path=extracted,
        source_config=configs
    )
    load_to_lake.expand(data_path=validated, source_config=configs)

dynamic_ingestion()
```

### Airflow Branching and Conditional Logic

```python
from airflow.operators.python import BranchPythonOperator
from airflow.operators.empty import EmptyOperator

def choose_processing_path(**context):
    row_count = context['ti'].xcom_pull(task_ids='count_rows')
    if row_count > 1000000:
        return 'spark_processing'
    elif row_count > 10000:
        return 'pandas_processing'
    else:
        return 'skip_processing'

branch = BranchPythonOperator(
    task_id='choose_path',
    python_callable=choose_processing_path,
)

spark_task = PythonOperator(task_id='spark_processing', ...)
pandas_task = PythonOperator(task_id='pandas_processing', ...)
skip_task = EmptyOperator(task_id='skip_processing')
join = EmptyOperator(task_id='join', trigger_rule='none_failed_min_one_success')

branch >> [spark_task, pandas_task, skip_task] >> join
```

## Dagster

### Software-Defined Assets

```python
from dagster import (
    asset, AssetIn, DailyPartitionsDefinition, MetadataValue,
    Output, AssetMaterialization, define_asset_job, ScheduleDefinition,
    AssetSelection, FreshnessPolicy, AutoMaterializePolicy
)

daily_partitions = DailyPartitionsDefinition(start_date="2024-01-01")

@asset(
    partitions_def=daily_partitions,
    group_name="raw",
    description="Raw orders extracted from commerce API",
    metadata={"owner": "data-eng", "source": "commerce-api"},
    freshness_policy=FreshnessPolicy(maximum_lag_minutes=120),
)
def raw_orders(context) -> Output:
    partition_date = context.partition_key
    data = extract_orders_api(date=partition_date)

    context.add_output_metadata({
        "row_count": len(data),
        "schema": MetadataValue.md(data.dtypes.to_markdown()),
        "preview": MetadataValue.md(data.head().to_markdown()),
    })
    return Output(data, metadata={"rows": len(data)})


@asset(
    ins={"raw_orders": AssetIn()},
    partitions_def=daily_partitions,
    group_name="staging",
    auto_materialize_policy=AutoMaterializePolicy.eager(),
)
def validated_orders(context, raw_orders):
    """Orders that pass quality validation."""
    valid, invalid = validate_orders(raw_orders)

    if len(invalid) > 0:
        context.log.warning(f"Quarantined {len(invalid)} invalid orders")
        save_to_quarantine(invalid, context.partition_key)

    context.add_output_metadata({
        "valid_count": len(valid),
        "invalid_count": len(invalid),
        "pass_rate": f"{len(valid) / len(raw_orders) * 100:.1f}%",
    })
    return valid


@asset(
    ins={"validated_orders": AssetIn()},
    partitions_def=daily_partitions,
    group_name="analytics",
)
def order_metrics(context, validated_orders):
    """Daily aggregated order metrics."""
    metrics = validated_orders.groupby('region').agg(
        total_revenue=('amount', 'sum'),
        order_count=('order_id', 'count'),
        avg_order_value=('amount', 'mean'),
    ).reset_index()

    write_to_warehouse(metrics, 'analytics.order_metrics', context.partition_key)
    return metrics


# Job and schedule
daily_orders_job = define_asset_job(
    name="daily_orders_pipeline",
    selection=AssetSelection.groups("raw", "staging", "analytics"),
    partitions_def=daily_partitions,
)

daily_schedule = ScheduleDefinition(
    job=daily_orders_job,
    cron_schedule="0 6 * * *",
)
```

### Dagster Resources and IO Managers

```python
from dagster import ConfigurableResource, ConfigurableIOManager
import boto3

class S3Resource(ConfigurableResource):
    bucket: str
    region: str = "us-east-1"

    def get_client(self):
        return boto3.client('s3', region_name=self.region)

    def upload(self, key, data):
        self.get_client().put_object(Bucket=self.bucket, Key=key, Body=data)

class DeltaIOManager(ConfigurableIOManager):
    base_path: str

    def handle_output(self, context, obj):
        table_path = f"{self.base_path}/{context.asset_key.path[-1]}"
        if context.has_partition_key:
            obj.write.format("delta").mode("overwrite") \
                .option("replaceWhere", f"date = '{context.partition_key}'") \
                .save(table_path)
        else:
            obj.write.format("delta").mode("overwrite").save(table_path)

    def load_input(self, context):
        table_path = f"{self.base_path}/{context.asset_key.path[-1]}"
        reader = spark.read.format("delta").load(table_path)
        if context.has_partition_key:
            reader = reader.filter(f"date = '{context.partition_key}'")
        return reader
```

## Prefect

### Flow Composition

```python
from prefect import flow, task, get_run_logger
from prefect.tasks import task_input_hash
from prefect.concurrency import concurrency
from datetime import timedelta

@task(
    retries=3,
    retry_delay_seconds=[10, 60, 300],  # Escalating delays
    cache_key_fn=task_input_hash,
    cache_expiration=timedelta(hours=1),
    timeout_seconds=600,
    tags=["extract"],
)
def extract_data(source: str, date: str) -> dict:
    logger = get_run_logger()
    logger.info(f"Extracting {source} for {date}")
    return fetch_source_data(source, date)

@task(retries=2, tags=["transform"])
def transform_data(raw_data: dict, rules: dict) -> dict:
    return apply_transformations(raw_data, rules)

@task(tags=["load"])
def load_data(data: dict, target: str):
    write_to_target(data, target)

@flow(name="etl-pipeline", log_prints=True)
def etl_pipeline(date: str, sources: list[str]):
    """Main ETL flow with parallel extraction."""
    logger = get_run_logger()

    # Parallel extraction using .map()
    raw_datasets = extract_data.map(source=sources, date=[date] * len(sources))

    # Sequential transformation
    transformed = []
    for raw, source in zip(raw_datasets, sources):
        rules = get_transform_rules(source)
        result = transform_data(raw.result(), rules)
        transformed.append(result)

    # Parallel loading
    targets = [f"warehouse.{s}" for s in sources]
    load_data.map(data=transformed, target=targets)

    logger.info(f"ETL complete for {date}, {len(sources)} sources processed")

@flow(name="scheduled-etl")
def scheduled_etl():
    """Scheduled wrapper with error handling."""
    from datetime import date
    sources = ["orders", "customers", "products", "inventory"]
    etl_pipeline(date=date.today().isoformat(), sources=sources)
```

## Retry and Error Handling Patterns

### Retry Strategy Decision Matrix

| Failure Type | Retry? | Strategy | Max Retries | Backoff |
|-------------|--------|----------|-------------|---------|
| API rate limit | Yes | Exponential + jitter | 5 | 30s, 60s, 120s, 240s |
| Network timeout | Yes | Linear | 3 | 30s |
| Auth token expired | Yes (after refresh) | Refresh then retry | 2 | 0s |
| Data validation | No | Route to DLQ | 0 | N/A |
| Schema mismatch | No | Alert and stop | 0 | N/A |
| Resource exhaustion | Yes | Exponential | 3 | 60s, 300s, 900s |
| Upstream not ready | Yes | Fixed interval | 10 | 300s |

### Airflow Retry Configuration

```python
# Task-level retry with exponential backoff
retry_task = PythonOperator(
    task_id='api_extract',
    python_callable=extract_from_api,
    retries=5,
    retry_delay=timedelta(minutes=2),
    retry_exponential_backoff=True,
    max_retry_delay=timedelta(minutes=60),
    execution_timeout=timedelta(hours=1),
    on_retry_callback=log_retry_attempt,
    on_failure_callback=send_failure_alert,
)

# Sensor with timeout (wait for upstream)
from airflow.sensors.external_task import ExternalTaskSensor

wait_for_upstream = ExternalTaskSensor(
    task_id='wait_for_raw_data',
    external_dag_id='ingestion_dag',
    external_task_id='load_complete',
    timeout=7200,           # Wait up to 2 hours
    poke_interval=300,      # Check every 5 minutes
    mode='reschedule',      # Free worker slot while waiting
    allowed_states=['success'],
    failed_states=['failed', 'skipped'],
)
```

## Backfill Strategies

```python
# Airflow: CLI backfill
# airflow dags backfill etl_orders_daily \
#   --start-date 2024-01-01 \
#   --end-date 2024-01-31 \
#   --reset-dagruns

# Dagster: Programmatic backfill
from dagster import build_schedule_context

def trigger_backfill(start_date, end_date):
    """Backfill a date range with concurrency control."""
    dates = generate_date_range(start_date, end_date)

    # Process in batches to avoid overwhelming systems
    batch_size = 5
    for batch in chunks(dates, batch_size):
        for date in batch:
            daily_orders_job.execute_in_process(
                partition_key=date,
                resources={"warehouse": warehouse_resource}
            )
        # Wait for batch completion and verify
        verify_backfill_batch(batch)
```

## Monitoring and Alerting

### Pipeline Health Metrics

```yaml
metrics:
  dag_level:
    - dag_duration_seconds        # Total execution time
    - dag_success_rate            # Success / total runs
    - tasks_failed_count          # Failed tasks per run
    - schedule_delay_seconds      # Time from scheduled to actual start
    - sla_miss_count              # SLA violations

  task_level:
    - task_duration_seconds       # Individual task time
    - task_retry_count            # Retries before success
    - records_processed           # Business metric
    - data_quality_score          # Quality gate result

alerts:
  critical:
    - condition: "dag_failed AND is_business_critical"
      action: pagerduty
    - condition: "sla_miss AND severity = 'high'"
      action: pagerduty + slack
  warning:
    - condition: "dag_duration > 2x median"
      action: slack
    - condition: "task_retry_count > 2"
      action: slack
  info:
    - condition: "backfill_complete"
      action: email
```

## Production Operations Checklist

```
DAG Development:
  [ ] Idempotent tasks (re-runnable without side effects)
  [ ] Appropriate retry configuration per failure mode
  [ ] Timeouts on all tasks (prevent zombie tasks)
  [ ] Task-level SLAs for critical paths
  [ ] XCom usage minimized (pass references, not data)
  [ ] Secrets in secret backend, not in code

Deployment:
  [ ] DAG tested locally before deployment
  [ ] CI validates DAG parsing (no import errors)
  [ ] Database migrations handled before DAG deploys
  [ ] Connections and variables configured in target env
  [ ] Resource requirements documented (pools, concurrency)

Monitoring:
  [ ] SLA miss callbacks configured
  [ ] Failure callbacks with actionable alerts
  [ ] Duration anomaly detection
  [ ] Dependency health checks (upstream sources)
  [ ] Worker/scheduler health monitoring
  [ ] Log retention and search capability

Operations:
  [ ] Backfill runbook documented
  [ ] On-call procedures for common failures
  [ ] DAG versioning strategy (avoid breaking changes)
  [ ] Pool and concurrency limits set
  [ ] Cleanup of old DAG runs and logs
```

## When to Use

**Use this skill when:**
- Designing or implementing orchestration engineer solutions
- Reviewing or improving existing orchestration engineer approaches
- Making architectural or implementation decisions about orchestration engineer
- Learning orchestration engineer patterns and best practices
- Troubleshooting orchestration engineer-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Orchestration Engineer Analysis

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

**Input:** "Help me implement orchestration engineer for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended orchestration engineer approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When orchestration engineer must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
