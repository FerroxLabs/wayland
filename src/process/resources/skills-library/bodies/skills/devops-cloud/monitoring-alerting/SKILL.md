---
name: monitoring-alerting
description: |
  Guides expert-level monitoring and alerting implementation: debugging and architecture decision frameworks, production-ready patterns, and concrete templates for monitoring alerting workflows.
  Use when the user asks about monitoring and alerting, monitoring alerting configuration, or devops best practices for monitoring projects.
  Do NOT use when the user needs a different devops cloud capability -- check sibling skills in the devops cloud subcategory.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "devops debugging architecture"
  category: "devops-cloud"
  subcategory: "devops-cloud"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Monitoring Alerting

## When to Use

**Use this skill when:**
- User asks how to instrument a new service or application with metrics, logs, and traces from scratch
- User needs to design or audit an alerting strategy -- defining SLOs, SLIs, error budgets, or on-call escalation policies
- User wants to debug why an alert is too noisy, never fires, or fires at the wrong time (alert fatigue, false positives, missed incidents)
- User is choosing between monitoring stacks (Prometheus + Grafana vs. Datadog vs. OpenTelemetry vs. cloud-native options) and needs a trade-off analysis
- User wants to implement production-ready dashboards, runbooks, or incident response workflows
- User needs to tune alert thresholds based on real traffic patterns (percentile-based, static, or anomaly-based)
- User is implementing distributed tracing and needs to correlate spans with metrics and logs
- User wants to design a multi-environment (dev/staging/prod) observability architecture with consistent instrumentation

**Do NOT use this skill when:**
- User needs CI/CD pipeline configuration -- use the CI/CD pipeline skill instead
- User is asking about infrastructure provisioning or IaC (Terraform, Pulumi) without a monitoring context -- use the infrastructure-as-code skill
- User needs container orchestration design (Kubernetes resource limits, HPA) without a monitoring integration angle -- use the container-orchestration skill
- User is asking about log storage, querying, or compliance archival as a pure data engineering problem -- use the data-pipeline skill
- User needs cost optimization analysis for cloud spend without a monitoring context -- use the cloud-cost-optimization skill
- User is asking about general application performance optimization without instrumentation -- use the performance-tuning skill

---

## Process

### 1. Establish the Observability Foundation

Before writing any configuration, understand the three pillars and how they apply to this system:

- **Metrics** are numeric time-series aggregations. They answer "is something wrong?" and "how wrong is it?" They are cheap to store and query. Use them for dashboards, alerting, and capacity planning.
- **Logs** are discrete structured or unstructured events. They answer "what happened?" Use structured JSON logging (not free-text) so logs are machine-queryable. Include `trace_id`, `span_id`, `service`, `environment`, `severity`, and `request_id` fields on every log line.
- **Traces** are causally linked spans across service boundaries. They answer "where did latency come from?" Essential for microservice architectures. Traces are expensive -- sample at 1--10% for high-volume services; use tail-based sampling to keep 100% of error traces.

Audit what the user already has:
- What instrumentation libraries are in use? (OpenTelemetry SDKs, Micrometer, Prometheus client libraries, Datadog APM agents)
- What collection infrastructure exists? (Prometheus scraping, OTLP push, CloudWatch agent, Fluentd/Fluent Bit)
- What storage backends are available? (Prometheus TSDB, Thanos, Cortex, Mimir, VictoriaMetrics, Datadog, New Relic)
- What alerting channels are configured? (PagerDuty, OpsGenie, Slack, email)

### 2. Define Service Level Objectives (SLOs) Before Writing Alerts

Alerts without SLOs are noise. Every alerting strategy must begin here:

- **SLI (Service Level Indicator):** The metric you are measuring. Common SLIs: request success rate, request latency at p99, error rate, saturation (queue depth, CPU).
- **SLO (Service Level Objective):** The target value for the SLI over a time window. Example: "99.9% of requests complete in under 200ms, measured over a rolling 30-day window."
- **Error budget:** The allowed amount of SLO violation. For 99.9% availability over 30 days: 43.2 minutes of allowed downtime. When the error budget is depleted, stop feature work and focus on reliability.
- **Burn rate:** How fast the error budget is being consumed relative to the total window. A burn rate of 1 means budget is consumed at exactly the rate that keeps you at the SLO boundary. A burn rate of 14.4 means the entire 30-day budget will be consumed in 2 hours.

Define SLOs for every user-facing surface before configuring a single alert. Use the formula:

```
error_budget_remaining = (1 - error_rate_over_window) / (1 - SLO_target)
burn_rate = (1 - SLO_target - error_budget_remaining) / time_elapsed_fraction
```

Recommended SLO tiers:
- Critical user journey (checkout, login, payment): 99.95%
- Core product features: 99.9%
- Internal tools and admin surfaces: 99.5%
- Batch jobs and async processing: 99.0%

### 3. Design the Alert Hierarchy Using Multi-Window, Multi-Burn-Rate Alerting

Flat threshold alerts produce chronic noise. Use Google SRE's multi-window, multi-burn-rate approach:

- **Page (wake someone up):** Burn rate > 14.4x over 1 hour AND burn rate > 14.4x over 5 minutes. This catches fast-burning incidents consuming the budget in < 2 hours.
- **Page (slower burn):** Burn rate > 6x over 6 hours AND burn rate > 6x over 30 minutes. This catches sustained degradation consuming the budget in < 5 days.
- **Ticket (non-urgent):** Burn rate > 3x over 3 days. No page; file a ticket for the next business day.
- **Informational:** Burn rate > 1x -- track but do not alert.

For each alert tier, define:
- Severity label (critical, warning, info)
- Routing destination (on-call engineer, team Slack channel, ticketing system)
- Response SLA (15 minutes for critical, 4 hours for warning, next business day for info)
- Runbook URL embedded directly in the alert annotation

Never alert on CPU > 80% without context. Instead: alert on CPU saturation causing latency degradation OR CPU burn rate implying resource exhaustion within N hours.

### 4. Instrument Applications with the Right Metric Types

Each Prometheus/OpenTelemetry metric type serves a specific purpose -- choose correctly:

**Counter:** Monotonically increasing value. Use for total requests, total errors, total bytes sent. Never use for values that can decrease. Name with `_total` suffix (e.g., `http_requests_total`).

**Gauge:** Instantaneous value that can increase or decrease. Use for active connections, queue depth, memory usage, goroutine count. Sample with sufficient frequency (every 15--30 seconds).

**Histogram:** Samples observations into configurable buckets and exposes `_count`, `_sum`, and `_bucket` series. Use for request latency and request size. Configure buckets to match your SLO thresholds -- if your SLO is 200ms, include 0.1, 0.2, 0.5, 1.0, 2.0, 5.0 as bucket boundaries. Use `histogram_quantile()` in Prometheus for p50/p95/p99.

**Summary:** Client-side quantile calculation. Avoid in new instrumentation -- quantiles cannot be aggregated across instances. Use histograms instead.

Label cardinality is the most common instrumentation failure mode. Never use labels with unbounded cardinality (user IDs, request IDs, URLs with path parameters). Limit to stable labels: `service`, `version`, `environment`, `method`, `status_code`, `region`. Each unique label combination creates a new time series; exceeding 1 million active series per Prometheus instance degrades performance severely.

### 5. Configure Collection, Storage, and Retention

Design the metrics pipeline based on scale:

**Single-cluster Prometheus (up to ~1 million active series):**
- Scrape interval: 15 seconds for most targets; 30 seconds for infrastructure
- Retention: 15 days local TSDB (fast queries); remote write to object storage for long-term
- Chunk encoding: Gorilla compression (default in Prometheus 2.x)
- WAL (Write-Ahead Log) size: 2--3x scrape interval data

**Federated or multi-cluster (1--10 million active series):**
- Use Thanos or Grafana Mimir for horizontally scalable storage
- Thanos: deploy Sidecar on each Prometheus, Query layer for global view, Store for object storage queries, Compactor for downsampling
- Downsampling strategy: raw data for 15 days, 5-minute resolution for 90 days, 1-hour resolution for 2 years
- Recording rules to pre-aggregate expensive queries before they hit dashboards

**High-cardinality or large-scale (>10 million active series):**
- VictoriaMetrics or Grafana Mimir -- both support horizontal write sharding
- VictoriaMetrics single-node handles ~30 million active series on commodity hardware
- Separate ingest path from query path to avoid query storms degrading ingestion

For logs:
- Ship with Fluent Bit (preferred over Fluentd for resource efficiency -- ~40MB RAM vs ~100MB)
- Parse structured JSON at source; avoid parsing regex at aggregation layer
- Route to Loki (label-indexed), Elasticsearch/OpenSearch (full-text), or CloudWatch Logs (AWS-native)
- Loki label strategy: match your Prometheus labels exactly (`service`, `environment`, `pod`) to enable metric-to-log correlation

For traces:
- Deploy OpenTelemetry Collector as a DaemonSet (Kubernetes) or sidecar
- Use OTLP gRPC for efficient transport (4--5x more efficient than HTTP/JSON)
- Backend: Jaeger (open source), Grafana Tempo (integrates with Loki/Prometheus), or Datadog APM
- Tail-based sampling: keep 100% of traces with errors or latency > p99 threshold; sample 1% of healthy traces

### 6. Build Dashboards That Enable Decision-Making

Dashboards exist to answer operational questions, not to display every metric:

**The USE Method (for infrastructure/resources):**
- Utilization: % of time resource is busy
- Saturation: queue depth or wait time due to resource being overloaded
- Errors: error rate of the resource

**The RED Method (for services/endpoints):**
- Rate: requests per second
- Errors: error rate (4xx + 5xx / total)
- Duration: latency at p50, p95, p99

Structure every service dashboard with these sections in order:
1. **SLO status panel** -- current error budget remaining (burn gauge 0--100%)
2. **Traffic overview** -- RPS by endpoint, geographic distribution
3. **Error rate** -- 5xx rate, 4xx rate, separated by endpoint and error type
4. **Latency** -- p50/p95/p99 heatmap or time-series, broken down by endpoint
5. **Saturation** -- CPU, memory, active connections, thread pool queue depth
6. **Dependency health** -- downstream service error rates and latencies
7. **Infrastructure** -- pod restarts, OOMKill events, node CPU/memory

Dashboard naming convention: `[team]-[service]-[overview|detail|slo]` (e.g., `payments-checkout-slo`). Tag dashboards with service, team, and environment. Every dashboard must have a `last updated` annotation and an owner label.

Panel guidelines:
- Use aligned color conventions: green = healthy, yellow = warning, red = critical -- use the same thresholds as your alerts
- Always include a time range selector and a refresh interval (15s for incident response, 5m for routine monitoring)
- Avoid table panels with more than 15 rows -- they are unreadable during incidents
- Use Grafana variables for `$environment`, `$service`, `$region` to make dashboards reusable

### 7. Implement Alerting Rules and Routing

Write alerts as code in version-controlled files. Never create alerts manually through a UI.

**Prometheus alert rule structure:**
```yaml
groups:
  - name: service.slo
    interval: 30s
    rules:
      - alert: HighErrorBurnRate
        expr: |
          (
            sum(rate(http_requests_total{status=~"5.."}[1h])) /
            sum(rate(http_requests_total[1h]))
          ) > (14.4 * (1 - 0.999))
        for: 2m
        labels:
          severity: critical
          team: payments
        annotations:
          summary: "Error burn rate critical for {{ $labels.service }}"
          description: "Error burn rate is {{ $value | humanizePercentage }} -- consuming 30-day error budget in < 2 hours"
          runbook_url: "https://wiki.internal/runbooks/payments-high-error-rate"
          dashboard_url: "https://grafana.internal/d/payments-checkout-slo"
```

Alert naming convention: `[Category][Condition][Severity]` -- e.g., `PaymentServiceHighErrorBurnRateCritical`, `DatabaseConnectionPoolSaturationWarning`.

The `for` duration prevents flapping: set to 2--5 minutes for critical alerts, 10--15 minutes for warnings. Never set `for: 0s` except for catastrophic conditions (all instances down).

**Alertmanager routing tree:**
```yaml
route:
  group_by: ['alertname', 'service', 'environment']
  group_wait: 30s        # Wait for more alerts before firing group
  group_interval: 5m     # Minimum time between notifications for same group
  repeat_interval: 4h    # Re-notify if alert still firing after this duration
  receiver: 'slack-general'
  routes:
    - match:
        severity: critical
        environment: production
      receiver: pagerduty-oncall
      continue: false
    - match:
        severity: warning
        environment: production
      receiver: slack-team-channel
      repeat_interval: 12h
    - match:
        environment: staging
      receiver: slack-staging
      inhibit_rules: []   # Never page for staging
```

Inhibition rules prevent alert storms:
- If "all instances of service X are down" fires, inhibit individual instance alerts
- If "database is unreachable" fires, inhibit all application-level errors that are downstream consequences
- If a deployment is in progress (add a `deploying=true` label via webhook), inhibit latency alerts for 10 minutes

### 8. Establish Incident Response and Runbook Standards

Every critical alert must have a runbook before it goes into production. A runbook template:

```markdown
## Alert: [AlertName]

### What is happening
One sentence: what this alert means in plain language.

### Impact
Who is affected and how severely.

### Diagnostic steps
1. Check the SLO dashboard: [link]
2. Run this query to identify affected instances: [PromQL/log query]
3. Check recent deployments: [link to deployment dashboard]
4. Examine error logs: [log query with filters]

### Remediation options
- If caused by traffic spike: [specific scaling action]
- If caused by bad deployment: [rollback command]
- If caused by downstream dependency: [escalation path]

### Escalation
- After 15 minutes without resolution: page [team lead]
- After 30 minutes: engage [on-call architect]

### Post-incident
Link to post-mortem template.
```

Runbooks must be tested: during each incident, a secondary responder follows the runbook exactly as written and notes any gaps. Update runbooks within 24 hours of an incident.

---

## Output Format

### SLO Definition Table

| Service | SLI | SLO Target | Window | Error Budget | Burn Rate (Page) | Burn Rate (Ticket) |
|---------|-----|------------|--------|--------------|-------------------|--------------------|
| checkout-api | Success rate of POST /v1/orders | 99.9% | 30 days | 43.2 min | >14.4x over 1h | >3x over 3d |
| checkout-api | p99 latency of POST /v1/orders | < 500ms | 30 days | 43.2 min | >14.4x over 1h | >3x over 3d |
| inventory-service | Success rate of all reads | 99.5% | 30 days | 3.6 hours | >14.4x over 1h | >3x over 3d |

### Alert Rule Configuration

```yaml
# alerts/[service]-slo-alerts.yaml
groups:
  - name: [service].slo.burn_rate
    interval: 30s
    rules:
      # Fast burn -- page immediately
      - alert: [Service]HighErrorBurnRateCritical
        expr: |
          (
            (
              sum(rate(http_requests_total{service="[service]",status=~"5.."}[1h]))
              / sum(rate(http_requests_total{service="[service]"}[1h]))
            ) > (14.4 * (1 - [slo_target]))
          ) and (
            (
              sum(rate(http_requests_total{service="[service]",status=~"5.."}[5m]))
              / sum(rate(http_requests_total{service="[service]"}[5m]))
            ) > (14.4 * (1 - [slo_target]))
          )
        for: 2m
        labels:
          severity: critical
          team: [owning_team]
          service: [service]
        annotations:
          summary: "High error burn rate: {{ $labels.service }}"
          description: "Burn rate {{ $value }} -- 30-day error budget exhausted in < 2h"
          runbook_url: "[runbook_url]"

      # Slow burn -- ticket
      - alert: [Service]ElevatedErrorBurnRateWarning
        expr: |
          sum(rate(http_requests_total{service="[service]",status=~"5.."}[3d]))
          / sum(rate(http_requests_total{service="[service]"}[3d]))
          > (3 * (1 - [slo_target]))
        for: 15m
        labels:
          severity: warning
          team: [owning_team]
        annotations:
          summary: "Elevated error burn rate: {{ $labels.service }}"
          description: "Sustained elevated error rate may exhaust monthly budget"
```

### Monitoring Stack Decision Matrix

| Factor | Prometheus + Grafana + Thanos | Datadog | Grafana Cloud | AWS CloudWatch |
|--------|-------------------------------|---------|---------------|----------------|
| Cost at scale (10M series) | $300--600/mo (infra only) | $15,000--40,000/mo | $2,000--5,000/mo | $3,000--8,000/mo |
| Operational overhead | High (self-managed) | None | Low | Low |
| Cardinality limits | Configurable (no hard limit) | 1M series per org | 10M series | Limited |
| Custom metrics | Unlimited | $0.05/metric/mo | Included | $0.30/metric/mo |
| Trace/log/metric correlation | Excellent (Tempo + Loki) | Excellent (native) | Excellent (native) | Poor |
| Compliance (HIPAA/SOC2) | Self-managed | Available | Available | Available |
| Best for | Cost-conscious teams, >5M series | Fully-managed, enterprise budget | Mid-size, mixed stack | AWS-native workloads |

### Dashboard Template Sections

```
[Service Name] -- SLO Overview
├── SLO Burn Rate Gauge (0--100% budget remaining)
├── Current Error Rate vs SLO Threshold (last 1h, 6h, 24h, 7d)
├── p50 / p95 / p99 Latency (time-series, 30-min buckets)
├── Request Rate by Endpoint (stacked area)
├── Error Count by Type (5xx breakdown, dependency errors)
├── Infrastructure Saturation (CPU%, Memory%, Active Connections)
└── Recent Deployments (annotation overlay)
```

---

## Rules

1. **Never alert on raw resource metrics without business context.** CPU > 80% is not an actionable alert. Alert on CPU saturation causing queue depth to grow, or project CPU exhaustion within 4 hours using a linear regression recording rule.

2. **Never use label values with unbounded cardinality.** Adding `user_id`, `request_id`, or raw URL paths as Prometheus labels will cause cardinality explosion. Above ~2 million active series, Prometheus query latency degrades exponentially and OOM kills become frequent.

3. **All alert rules must be version-controlled and reviewed like application code.** No alert may be created via the Grafana UI or Alertmanager API directly in production. Use GitOps: merge to main, CI validates PromQL syntax with `promtool check rules`, deployment pipeline applies to cluster.

4. **Every critical alert must have a runbook URL in the annotation before it can be promoted to production.** An alert without a runbook causes responders to spend time during an incident diagnosing the alert itself rather than the underlying problem.

5. **Set `for` duration greater than zero on all alerts.** A `for: 0s` alert fires on the first bad scrape interval and generates extreme noise. Minimum `for: 2m` for critical, `for: 10m` for warning. Exception: use `for: 0s` only for "all instances are down" (i.e., no healthy instances exist).

6. **Use multi-window burn rate alerting, not static thresholds.** A static alert "error rate > 1%" will fire constantly during normal traffic variance. Multi-window burn rate alerts fire only when the SLO window is at real risk, reducing false positives by 60--80% in practice.

7. **Never disable or silence a firing alert without creating a follow-up ticket.** Silencing an alert is borrowing time against reliability. Every silence must have an expiry no longer than 8 hours and a linked issue in the team's tracker.

8. **Histogram buckets must be tuned to the SLO threshold.** Default Prometheus client histogram buckets (0.005, 0.01, 0.025... 10 seconds) are useless for a 200ms SLO. Customize buckets to bracket the target: `[0.05, 0.1, 0.15, 0.2, 0.3, 0.5, 1.0, 2.5, 5.0]`.

9. **Separate on-call routing by environment: never page for staging or development.** Alertmanager routing trees must have an explicit match on `environment: production` for all PagerDuty/OpsGenie routes. Staging alerts route to Slack only. A misfired staging page at 3 AM destroys on-call trust.

10. **Test alert rules quarterly with chaos/fault injection.** Alert rules that have never fired may not fire when needed. Inject synthetic errors (feature flag, load test with forced errors, chaos engineering tool) to validate that critical alerts fire within their `for` duration and route correctly.

---

## Edge Cases

**1. Alert storms after a partial outage recovery**
When a service recovers after a major incident, all suppressed slow-burn alerts may fire simultaneously as metrics return to measurable ranges. Mitigate with inhibition rules: if a "service critically degraded" alert fired within the last 2 hours, inhibit all downstream alerts for 30 minutes post-resolution. In Alertmanager, configure `inhibit_rules` with `equal: ['service', 'environment']` so the source critical alert inhibits secondary warning-level alerts on the same service.

**2. Scrape gaps causing false SLO violations**
If a Prometheus scrape target is temporarily unreachable (pod restart, network blip), the gap in data causes `rate()` and `increase()` functions to return incorrect values for the interval containing the gap. The `for` duration absorbs most transient gaps, but multi-minute scrape outages can cause false SLO burn rate spikes. Mitigate with: `min_over_time(up{job="[target]"}[5m]) == 1` as a condition on high-sensitivity alerts, and alert separately on scrape target unavailability so gaps are visible.

**3. High-cardinality microservice with hundreds of endpoints**
In a service with 200+ distinct API endpoints, per-endpoint SLOs become unmanageable. Tier the approach: define one aggregate SLO for the service, plus individual SLOs only for the top 5--10 most critical endpoints (identified by revenue impact or error frequency). Use recording rules to pre-aggregate per-tier metrics and reduce dashboard query load. Label endpoints by criticality tier (`tier: critical|standard|background`) rather than individual endpoint names.

**4. Multi-cloud or hybrid environments with inconsistent metric naming**
When metrics come from AWS CloudWatch (naming: `AWS/ECS/CPUUtilization`), Prometheus exporters (`container_cpu_usage_seconds_total`), and Datadog (`kubernetes.cpu.usage.total`), normalization is essential. Deploy OpenTelemetry Collector with a `metricstransform` processor to canonicalize names before writing to storage. Define internal naming conventions (OpenTelemetry semantic conventions are the industry standard) and enforce them in CI via a linting step that validates metric names against a schema.

**5. Alerting during planned maintenance windows**
Scheduled maintenance (database failovers, Kubernetes node drains, certificate rotations) will trigger legitimate alerts that are not actionable. Use Alertmanager's `silence` API with a time-bounded silence created automatically by the deployment pipeline -- not manually. In Kubernetes, use a pre-hook job that calls the Alertmanager API: `amtool silence add --duration=30m --comment="Automated: deploy job [job_id]" alertname=~".*" service=[service]`. Never create indefinite silences.

**6. Metrics from short-lived jobs (batch, Kubernetes Jobs)**
Prometheus's pull-based scrape model misses short-lived jobs that complete before they are scraped. Use Prometheus Pushgateway for batch job metrics. Important: do not use Pushgateway for services -- it breaks the instance-per-series model and prevents per-instance alerting. Label pushed metrics with `job`, `batch_id`, and `run_timestamp`. Alert on `time() - push_time_seconds{job="batch-name"} > 86400` (job has not pushed in >24 hours) rather than on the absence of time-series, which is unreliable.

**7. Alert threshold drift over time**
Static thresholds become stale as traffic patterns evolve -- what was a reasonable p99 latency threshold 6 months ago may be wrong today after a major feature launch. Implement quarterly SLO reviews: compare current traffic patterns against SLO thresholds and burn rate history. Use Prometheus query `quantile_over_time(0.99, rate(http_request_duration_seconds_sum[5m])[90d:5m])` to see the rolling 90-day p99 and adjust thresholds based on real data, not intuition.

**8. On-call burnout from alert overload**
When on-call engineers acknowledge more than 5 alerts per shift or more than 2 overnight pages per week, on-call becomes unsustainable. Track alert volume as a metric: `ALERTS{alertstate="firing", severity="critical"}` count over rolling 7-day windows. Set a team target: no more than 2 critical pages per on-call shift. When this threshold is breached, run an alert audit: categorize every alert from the last 30 days as "actionable," "noise," or "unclear." Delete or downgrade noise alerts immediately. Treat alert quality as a first-class engineering task in the next sprint.

---

## Example

**Input:** "We have a Node.js payments API (Express, ~800 req/s at peak) deployed on Kubernetes (EKS). We use Prometheus for metrics scraping. Right now we have a single alert: HTTP 5xx rate > 0.1% for 1 minute. We get paged ~8 times a week, mostly false alarms. Our team of 4 is burning out. How do we fix our alerting?"

---

**Output:**

### Diagnosis

Your current alert -- `5xx rate > 0.1%` for 1 minute -- has three problems:

1. **It fires on rate() instability.** At 800 req/s, a 30-second window with 2--3 5xx errors puts you at 0.1%. Normal traffic variance produces this constantly.
2. **It has no business context.** 0.1% of what? If your SLO is 99.9%, you have a 43-minute error budget per month -- a brief 0.1% spike for 2 minutes consumes only 0.3% of that budget. Not worth a page.
3. **1-minute `for` duration is too short.** Combined with rate() instability, this is a recipe for false pages.

### Step 1 -- Define Your SLO

For a payments API, use a 99.9% success rate SLO over a 30-day window:
- Error budget: 43.2 minutes per month
- This means: tolerate up to 43.2 minutes of 100% outage, OR indefinite low-level errors as long as they don't exceed 0.1% of total requests over the month.

### Step 2 -- Replace the Single Threshold Alert with Multi-Window Burn Rate

Remove your current alert entirely. Add these three rules to `alerts/payments-api-slo.yaml`:

```yaml
groups:
  - name: payments-api.slo
    interval: 30s
    rules:
      # CRITICAL: Fast burn -- page immediately
      # Fires when error budget will be exhausted in < 2 hours
      - alert: PaymentsAPIHighErrorBurnRateCritical
        expr: |
          (
            (
              sum(rate(http_requests_total{service="payments-api",code=~"5.."}[1h]))
              / sum(rate(http_requests_total{service="payments-api"}[1h]))
            ) > (14.4 * 0.001)
          ) and (
            (
              sum(rate(http_requests_total{service="payments-api",code=~"5.."}[5m]))
              / sum(rate(http_requests_total{service="payments-api"}[5m]))
            ) > (14.4 * 0.001)
          )
        for: 2m
        labels:
          severity: critical
          team: payments
          service: payments-api
        annotations:
          summary: "CRITICAL: Payments API burning through error budget"
          description: >
            Error burn rate {{ $value | humanizePercentage }} --
            entire 30-day error budget will be consumed in less than 2 hours.
            Immediate investigation required.
          runbook_url: "https://wiki.internal/runbooks/payments-api-high-error-rate"
          dashboard_url: "https://grafana.internal/d/payments-api-slo"

      # WARNING: Slow burn -- create a ticket, no page
      # Fires when sustained errors will exhaust budget in < 5 days
      - alert: PaymentsAPIElevatedErrorBurnRateWarning
        expr: |
          (
            sum(rate(http_requests_total{service="payments-api",code=~"5.."}[6h]))
            / sum(rate(http_requests_total{service="payments-api"}[6h]))
          ) > (6 * 0.001)
        for: 15m
        labels:
          severity: warning
          team: payments
          service: payments-api
        annotations:
          summary: "WARNING: Payments API error rate elevated"
          description: >
            Sustained error rate {{ $value | humanizePercentage }} over 6h.
            At this rate, 30-day error budget exhausted in < 5 days.
            Investigate before next business day.
          runbook_url: "https://wiki.internal/runbooks/payments-api-high-error-rate"

      # LATENCY: p99 burn rate -- separate SLO for latency
      - alert: PaymentsAPIHighLatencyBurnRateCritical
        expr: |
          (
            sum(rate(http_request_duration_seconds_bucket{
              service="payments-api",
              route=~"/v1/payments.*",
              le="0.5"
            }[1h]))
            / sum(rate(http_request_duration_seconds_count{
              service="payments-api",
              route=~"/v1/payments.*"
            }[1h]))
          ) < (1 - (14.4 * 0.001))
        for: 2m
        labels:
          severity: critical
          team: payments
          service: payments-api
        annotations:
          summary: "CRITICAL: Payments API p99 latency SLO burning"
          description: >
            Less than {{ $value | humanizePercentage }} of payment requests
            completing within 500ms. Latency SLO at risk.
          runbook_url: "https://wiki.internal/runbooks/payments-api-high-latency"
```

### Step 3 -- Fix Histogram Buckets in Your Node.js Instrumentation

The Prometheus Node.js client default buckets (`[0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]` seconds) are acceptable for a 500ms SLO. Verify you have `0.5` as a bucket boundary -- if your SLO is 500ms, `le="0.5"` must exist as a bucket.

In your Express instrumentation:

```javascript
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['service', 'method', 'route', 'code'],
  // Custom buckets bracketing the 500ms SLO
  buckets: [0.05, 0.1, 0.2, 0.3, 0.5, 0.75, 1.0, 2.5, 5.0],
});

// IMPORTANT: normalize route labels to avoid cardinality explosion
// Use /v1/payments/:id, NOT /v1/payments/usr_abc123_xyz789
app.use((req, res, next) => {
  const end = httpRequestDuration.startTimer({
    service: 'payments-api',
    method: req.method,
    route: req.route?.path ?? 'unknown',  // Express route pattern, not actual path
  });
  res.on('finish', () => end({ code: res.statusCode }));
  next();
});
```

### Step 4 -- Configure Alertmanager Routing

Update your Alertmanager config to separate pages from tickets:

```yaml
route:
  group_by: ['alertname', 'service']
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 4h
  receiver: slack-payments-team
  routes:
    # Only critical alerts in production trigger PagerDuty
    - match:
        severity: critical
        environment: production
      receiver: pagerduty-payments-oncall
      group_wait: 1m       # Slight delay to group related alerts
      repeat_interval: 1h  # Re-page every hour if still firing

    # Warnings go to Slack only -- no page
    - match:
        severity: warning
        environment: production
      receiver: slack-payments-team
      repeat_interval: 12h

    # Never page for staging
    - match:
        environment: staging
      receiver: slack-payments-staging
      routes: []  # Override all sub-routes

inhibit_rules:
  # If all payment API pods are down, suppress individual endpoint alerts
  - source_match:
      alertname: PaymentsAPIAllPodsDown
    target_match_re:
      alertname: PaymentsAPI.*
    equal: ['service', 'environment']
```

### Step 5 -- Add the Runbook

Create `runbooks/payments-api-high-error-rate.md`:

```markdown
## PaymentsAPIHighErrorBurnRateCritical

### What is happening
The payments API is returning 5xx errors at a rate that will exhaust the
monthly error budget (43 minutes) within 2 hours.

### Immediate impact
Customers may see failed payment submissions. Revenue impact is likely.

### Diagnostic steps (execute in order)

1. Check the SLO dashboard for error rate breakdown by endpoint:
   https://grafana.internal/d/payments-api-slo

2. Identify which endpoint is failing:
   ```
   sum by (route) (rate(http_requests_total{service="payments-api",code=~"5.."}[5m]))
   ```

3. Check recent deployments (last 2 hours):
   https://grafana.internal/d/deployments?service=payments-api

4. Check downstream dependencies (Stripe, database):
   ```
   sum(rate(http_requests_total{service="payments-api",upstream="stripe",code=~"5.."}[5m]))
   ```

5. Examine error logs:
   ```
   {service="payments-api"} |= "error" | level="error" | json
   ```

### Remediation

- **Bad deployment:** Roll back with `kubectl rollout undo deployment/payments-api`
- **Database connection exhaustion:** Check pool usage; restart API pods if pool is stuck
- **Stripe outage:** Check status.stripe.com; enable maintenance mode if > 15 min
- **Spike in malformed requests:** Rate-limit by IP at ingress level

### Escalation
- 15 min no resolution: page payments-api tech lead
- 30 min no resolution: page on-call architect + notify VP Engineering
```

### Expected Outcome

With this change:
- **False positive pages eliminated:** Multi-window burn rate requires sustained errors across two time windows, not a momentary spike. Your 0.1% noise events will not exceed the 14.4x burn rate threshold.
- **Expected alert volume:** From ~8 pages/week down to 0--1 real incidents/week. The slow-burn warning catches degradation before it becomes a page.
- **Response quality:** Every page comes with a runbook link and burn rate context, so responders arrive with a diagnosis framework rather than raw panic.

### SLO Summary

| SLI | SLO | Error Budget (30d) | Critical Threshold |
|-----|-----|--------------------|--------------------|
| Success rate | 99.9% | 43.2 min | >14.4x burn over 1h+5m |
| p99 latency < 500ms | 99.9% | 43.2 min | >14.4x burn over 1h |
| Slow-burn warning | 99.9% | 43.2 min | >6x burn over 6h |
