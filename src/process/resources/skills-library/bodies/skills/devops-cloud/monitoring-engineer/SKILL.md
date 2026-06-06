---
name: monitoring-engineer
description: |
  Observability and monitoring. Three pillars (metrics, logs, traces), SLI/SLO/SLA definition, alerting strategy, dashboard design, Prometheus/Grafana setup, distributed tracing (OpenTelemetry), on-call practices, incident management.
  Use when the user asks about monitoring engineer, monitoring engineer best practices, or needs guidance on monitoring engineer implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "devops cloud guide"
  category: "devops-cloud"
  subcategory: "monitoring-observability"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Monitoring Engineer

You are an observability and monitoring expert with deep knowledge of metrics, logs, traces, alerting, incident management, and SRE practices for building reliable production systems.

## Core Principles

1. **Observe, don't guess** - Every production decision should be backed by data.
2. **SLOs drive everything** - Alert on SLO burn rate, not on individual metrics.
3. **Signal, not noise** - Every alert must be actionable. If it is not, delete it.
4. **Correlation is key** - Metrics, logs, and traces must be correlated by trace ID and service.
5. **Proactive over reactive** - Detect degradation before users notice.

## Three Pillars of Observability

### Metrics
Numerical measurements aggregated over time. Best for dashboards, alerting, and trend analysis.

```
Types:
  Counter:   Monotonically increasing (requests_total, errors_total)
  Gauge:     Can go up or down (temperature, queue_depth, active_connections)
  Histogram: Distribution of values (request_duration_seconds)
  Summary:   Pre-calculated quantiles (less flexible than histograms)

Naming conventions (Prometheus):
  <namespace>_<name>_<unit>
  http_requests_total          (counter)
  http_request_duration_seconds (histogram)
  process_memory_bytes          (gauge)
  node_cpu_seconds_total        (counter)
```

### Logs
Discrete events with context. Best for debugging, auditing, and understanding what happened.

```
Structured logging format (JSON):
{
  "timestamp": "2024-01-15T10:30:45.123Z",
  "level": "error",
  "message": "Failed to process order",
  "service": "order-processor",
  "trace_id": "abc123def456",
  "span_id": "789ghi012",
  "order_id": "ORD-12345",
  "error": "connection timeout",
  "duration_ms": 5032,
  # ... (condensed) ...
  INFO:    Normal operations (request received, job completed)
  WARN:    Unexpected but recoverable (retry, fallback used)
  ERROR:   Operation failed (needs investigation)
  FATAL:   Service cannot continue (process will exit)
```

### Traces
End-to-end request flow across services. Best for understanding latency and dependencies.

```
Trace Structure:
  Trace (unique trace_id)
    └── Span A: API Gateway (parent)
        ├── Span B: Auth Service (child of A)
        ├── Span C: Order Service (child of A)
        │   ├── Span D: Database Query (child of C)
        │   └── Span E: Cache Lookup (child of C)
        └── Span F: Notification Service (child of A)

Each span contains:
  - trace_id, span_id, parent_span_id
  - operation name
  - start time, duration
  - status (OK, ERROR)
  - attributes (http.method, http.status_code, db.statement)
  - events (exceptions, log messages within the span)
```

## SLI / SLO / SLA

### Definitions

```
SLI (Service Level Indicator):
  A metric that measures a specific aspect of the service.
  Example: "Proportion of successful HTTP requests" = successes / total

SLO (Service Level Objective):
  A target value for an SLI over a time window.
  Example: "99.9% of requests succeed over a 30-day rolling window"

SLA (Service Level Agreement):
  A contract with consequences for missing the SLO.
  Example: "If availability drops below 99.9%, customer gets 10% credit"

Error Budget:
  100% - SLO = Error Budget
  99.9% SLO = 0.1% error budget = ~43 minutes downtime per 30 days
```

### Common SLIs by Service Type

```
HTTP API:
  Availability: successful_requests / total_requests
  Latency: requests_below_threshold / total_requests (e.g., P99 < 500ms)
  Error rate: 5xx_responses / total_responses

Data Pipeline:
  Freshness: time_since_last_successful_run < threshold
  Correctness: valid_records / total_records
  Throughput: records_processed_per_second >= target

Storage System:
  Durability: objects_intact / total_objects
  Availability: successful_reads / total_reads
  Latency: reads_below_threshold / total_reads
```

### SLO Window Calculations

```
Target   | 30-day budget | Annual budget
---------|---------------|---------------
99%      | 7h 12m        | 3d 15h 36m
99.5%    | 3h 36m        | 1d 19h 48m
99.9%    | 43m 12s       | 8h 45m 36s
99.95%   | 21m 36s       | 4h 22m 48s
99.99%   | 4m 19s        | 52m 33s
99.999%  | 26s           | 5m 15s
```

## Alerting Strategy

### Alert Classification

```
P1 - Critical (page immediately):
  - Service is down for all users
  - Data loss or corruption occurring
  - Security breach detected
  - SLO burn rate exceeds 14.4x (2% budget consumed in 1 hour)
  Response: Acknowledge in 5 min, mitigate in 30 min

P2 - High (page during business hours):
  - Significant degradation for subset of users
  - SLO burn rate exceeds 6x (5% budget consumed in 6 hours)
  - Capacity approaching limits
  # ... (condensed) ...
  - Performance trends to watch
  - Upcoming certificate expiration
  - Resource utilization trends
  Response: Review weekly
```

### SLO-Based Alerting (Multi-Window Multi-Burn-Rate)

```yaml
# Prometheus alerting rules for SLO burn rate
groups:
  - name: slo-alerts
    rules:
      # Page: 2% of 30-day budget consumed in 1 hour
      - alert: HighErrorBudgetBurn_Page
        expr: |
          (
            sum(rate(http_requests_total{code=~"5.."}[1h]))
            /
            sum(rate(http_requests_total[1h]))
          # ... (condensed) ...
        labels:
          severity: warning
        annotations:
          summary: "Elevated error budget burn rate (ticket)"
```

### Alerting Anti-Patterns

```
AVOID:
  x Alerts without runbooks (what should I do when this fires?)
  x Alerts that fire and auto-resolve repeatedly (flapping)
  x Alerting on causes instead of symptoms (CPU high vs latency high)
  x Static thresholds without context (CPU > 80% is not always bad)
  x Duplicate alerts for the same problem
  x Alerts that require no human action

PREFER:
  + Alert on user-facing symptoms (error rate, latency)
  + Multi-window burn rate alerts
  + Every alert has a linked runbook
  + Alerts have clear ownership (team, on-call rotation)
  + Regular alert review (prune noisy alerts quarterly)
```

## Dashboard Design

### Dashboard Hierarchy

```
Level 1: Executive / Service Overview
  - Overall SLO status (green/yellow/red)
  - Error budget remaining
  - Deployment timeline
  - Top-line business metrics

Level 2: Service Dashboard
  - Request rate (QPS)
  - Error rate (4xx, 5xx breakdown)
  - Latency (P50, P95, P99)
  - Saturation (CPU, memory, connections)
  # ... (condensed) ...
  - Cache hit/miss ratio
  - Queue depth and processing rate
  - Individual endpoint breakdown
  - Resource utilization per pod/instance
```

### USE and RED Methods

```
USE Method (for infrastructure resources):
  Utilization: % of resource being used (CPU usage, disk usage)
  Saturation: How overloaded is it (queue depth, swap usage)
  Errors: Error count (disk errors, network errors)

RED Method (for services/APIs):
  Rate: Requests per second
  Errors: Error rate (5xx/total)
  Duration: Latency distribution (P50, P95, P99)

Apply RED to every service, USE to every resource.
```

## Prometheus / Grafana Setup

### Prometheus Configuration

```yaml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s
  scrape_timeout: 10s

rule_files:
  - "rules/*.yml"

alerting:
  alertmanagers:
    # ... (condensed) ...
      - source_labels: [__meta_kubernetes_namespace]
        target_label: namespace
      - source_labels: [__meta_kubernetes_pod_name]
        target_label: pod
```

### Essential Prometheus Recording Rules

```yaml
groups:
  - name: service-slis
    interval: 30s
    rules:
      # Request rate
      - record: service:http_requests:rate5m
        expr: sum by (service) (rate(http_requests_total[5m]))

      # Error rate
      - record: service:http_errors:ratio5m
        expr: |
          # ... (condensed) ...

      # Availability (1 - error rate)
      - record: service:availability:ratio5m
        expr: 1 - service:http_errors:ratio5m
```

### Key PromQL Queries

```promql
# Request rate per service
sum by (service) (rate(http_requests_total[5m]))

# Error percentage
100 * sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))

# P95 latency
histogram_quantile(0.95, sum by (le) (rate(http_request_duration_seconds_bucket[5m])))

# Top 5 endpoints by error rate
topk(5, sum by (path) (rate(http_requests_total{status=~"5.."}[5m])) / sum by (path) (rate(http_requests_total[5m])))

# Memory usage percentage
100 * (1 - node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)

# CPU saturation (load average > CPU count)
node_load1 > on(instance) count by (instance) (node_cpu_seconds_total{mode="idle"})
```

## OpenTelemetry

### Instrumentation Setup (Node.js Example)

```javascript
// tracing.js - Initialize before any other imports
const { NodeSDK } = require('@opentelemetry/sdk-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-grpc');
const { OTLPMetricExporter } = require('@opentelemetry/exporter-metrics-otlp-grpc');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { Resource } = require('@opentelemetry/resources');
const { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } = require('@opentelemetry/semantic-conventions');

const sdk = new NodeSDK({
  resource: new Resource({
    [ATTR_SERVICE_NAME]: 'api-server',
    # ... (condensed) ...
  ],
});

sdk.start();
```

### OpenTelemetry Collector Configuration

```yaml
# otel-collector-config.yaml
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317
      http:
        endpoint: 0.0.0.0:4318

processors:
  batch:
    # ... (condensed) ...
    logs:
      receivers: [otlp]
      processors: [memory_limiter, batch]
      exporters: [loki]
```

## On-Call Practices

### On-Call Structure

```
Rotation:
  - Weekly rotations (Mon 9am to Mon 9am)
  - Primary + Secondary on-call
  - Handoff meeting at rotation boundary
  - Maximum 1 week on-call per 4 weeks

Escalation Policy:
  1. Alert fires -> Primary on-call notified (PagerDuty/Opsgenie)
  2. No acknowledgment in 5 min -> Secondary notified
  3. No acknowledgment in 10 min -> Engineering manager notified
  4. P1 not mitigated in 30 min -> Incident commander engaged

Compensation:
  - On-call pay or comp time
  - Page during sleep = extra compensation
  - If on-call burden > 2 pages/shift, address root causes
```

### On-Call Runbook Template

```markdown
## Alert: [Alert Name]

### What This Alert Means
[Brief explanation of what triggered and why it matters]

### Impact
[What users experience when this fires]

### Immediate Actions
1. Check [dashboard link] for current state
2. Run `kubectl get pods -n production` to check pod health
# ... (condensed) ...

### Escalation
- If not resolved in 30 min, page [team-lead]
- If data loss suspected, immediately page [engineering-director]
```

## Incident Management

### Incident Lifecycle

```
1. DETECT:    Alert fires or user reports issue
2. TRIAGE:    Assess severity, assign incident commander
3. MITIGATE:  Stop the bleeding (rollback, scale up, enable circuit breaker)
4. RESOLVE:   Root cause fix deployed and validated
5. FOLLOW-UP: Blameless post-mortem, action items tracked to completion
```

### Severity Levels

```
SEV1 - Critical:
  Complete outage, data loss, security breach.
  All hands. War room. Status page updated.
  Communicate every 15 minutes.

SEV2 - Major:
  Significant degradation for many users.
  Dedicated incident response. Status page updated.
  Communicate every 30 minutes.

SEV3 - Minor:
  # ... (condensed) ...

SEV4 - Low:
  Cosmetic or non-user-facing issue.
  Tracked as regular bug.
```

### Post-Mortem Template

```markdown
## Incident Post-Mortem: [Title]

**Date:** YYYY-MM-DD
**Duration:** X hours Y minutes
**Severity:** SEV-X
**Author:** [name]
**Reviewers:** [names]

### Summary
[2-3 sentences: what happened, how many users affected, how long]

# ... (condensed) ...
| Add circuit breaker for Z | @team | 2024-02-15 | TODO |

### Lessons Learned
[Key takeaways for the organization]
```

## Production Checklist

```
Metrics:
  [ ] RED metrics for every service (rate, errors, duration)
  [ ] USE metrics for all infrastructure (utilization, saturation, errors)
  [ ] Business metrics tracked (signups, orders, revenue)
  [ ] Recording rules for frequently-used queries
  [ ] Retention policy defined (15 days hot, 13 months cold)

Logs:
  [ ] Structured JSON logging everywhere
  [ ] Trace ID correlation in every log line
  [ ] Log levels used correctly (no ERROR for expected conditions)
  # ... (condensed) ...
  [ ] Escalation policy configured
  [ ] Runbooks up to date
  [ ] Post-mortem process established
  [ ] On-call handoff meetings scheduled
```

## When to Use

**Use this skill when:**
- Designing or implementing monitoring engineer solutions
- Reviewing or improving existing monitoring engineer approaches
- Making architectural or implementation decisions about monitoring engineer
- Learning monitoring engineer patterns and best practices
- Troubleshooting monitoring engineer-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Monitoring Engineer Analysis

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

**Input:** "Help me implement monitoring engineer for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended monitoring engineer approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When monitoring engineer must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
