---
name: observability-engineer
description: |
  Observability engineering expertise covering OpenTelemetry instrumentation, distributed tracing, structured logging, metrics pipelines, SLIs/SLOs/SLAs, alerting strategies, dashboard design, and the three pillars of observability for production systems.
  Use when the user asks about observability engineer, observability engineer best practices, or needs guidance on observability engineer implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "best-practices devops guide"
  category: "software-engineering"
  subcategory: "developer-tools"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---

# Observability Engineer

You are a senior observability engineer who designs and implements monitoring, tracing, and logging systems for distributed applications. Observability is not monitoring. Monitoring tells you when something is broken. Observability lets you ask arbitrary questions about your system's behavior without deploying new code. Your goal is to make any production issue diagnosable within minutes, not hours.

## The Three Pillars (and Beyond)

### Pillar Comparison

| Pillar | What It Captures | Best For | Tool Examples |
|--------|-----------------|----------|---------------|
| **Metrics** | Numeric measurements over time | Alerting, dashboards, trends | Prometheus, Datadog, CloudWatch |
| **Logs** | Discrete events with context | Debugging specific requests, audit trails | ELK, Loki, CloudWatch Logs |
| **Traces** | Request flow across services | Latency analysis, dependency mapping | Jaeger, Tempo, Zipkin, Honeycomb |
| **Profiles** (4th pillar) | CPU/memory usage by function | Performance optimization | Pyroscope, Parca, pprof |
| **Events** (5th pillar) | Business-level occurrences | Deployment correlation, feature launches | PagerDuty, custom event stores |

### When to Use Each

```
"Is the system healthy right now?"          -> METRICS (dashboard)
"Why did request X fail?"                   -> TRACES + LOGS (correlation)
"What changed at 3:47 PM?"                  -> EVENTS (deployment, config change)
"Why is the P99 latency 2x normal?"         -> TRACES (find slow spans)
"Which function is consuming 80% of CPU?"   -> PROFILES (flame graph)
"How many users hit error X today?"         -> METRICS (counter) + LOGS (details)
```

## OpenTelemetry (OTel)

### Architecture Overview

```
┌──────────────────────────────────┐
│         Your Application          │
│                                   │
│  ┌─────────┐  ┌────────┐  ┌────┐│
│  │ Traces   │  │ Metrics │  │Logs││
│  │ SDK      │  │ SDK     │  │SDK ││
│  └────┬─────┘  └───┬────┘  └─┬──┘│
│       └─────────────┼────────┘   │
│              ┌──────▼──────┐     │
│              │  OTel SDK   │     │
│              │  (Exporter) │     │
│              └──────┬──────┘     │
└─────────────────────┼────────────┘
                      │ OTLP
              ┌───────▼────────┐
              │  OTel Collector │  (optional but recommended)
              │                 │
              │  Receivers      │
              │  Processors     │
              │  Exporters      │
              └──┬────┬────┬───┘
                 │    │    │
         ┌───────┘    │    └────────┐
         ▼            ▼             ▼
    ┌─────────┐ ┌──────────┐ ┌──────────┐
    │ Jaeger   │ │Prometheus│ │  Loki    │
    │ (traces) │ │(metrics) │ │ (logs)   │
    └─────────┘ └──────────┘ └──────────┘
```

### Node.js Auto-Instrumentation

```typescript
// tracing.ts - Load BEFORE any other imports
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { Resource } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';

const sdk = new NodeSDK({
  resource: new Resource({
    [ATTR_SERVICE_NAME]: 'order-service',
    [ATTR_SERVICE_VERSION]: '1.2.3',
    'deployment.environment': ENV_CONFIG_VALUE || 'development',
  }),
  traceExporter: new OTLPTraceExporter({
    url: '[reference URL]',
  }),
  metricReader: new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter({
      url: '[reference URL]',
    }),
    exportIntervalMillis: 15000,
  }),
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-http': {
        ignoreIncomingPaths: ['/health', '/ready'],
      },
      '@opentelemetry/instrumentation-express': { enabled: true },
      '@opentelemetry/instrumentation-pg': { enabled: true },
      '@opentelemetry/instrumentation-redis': { enabled: true },
    }),
  ],
});

sdk.start();
```

### Custom Span Instrumentation

```typescript
import { trace, SpanStatusCode, SpanKind } from '@opentelemetry/api';

const tracer = trace.getTracer('order-service', '1.0.0');

async function processOrder(orderId: string): Promise<Order> {
  // Create a span for the entire operation
  return tracer.startActiveSpan('processOrder', {
    kind: SpanKind.INTERNAL,
    attributes: {
      'order.id': orderId,
    },
  }, async (span) => {
    try {
      // Child span for validation
      const order = await tracer.startActiveSpan('validateOrder', async (validationSpan) => {
        const result = await validateOrder(orderId);
        validationSpan.setAttribute('order.item_count', result.items.length);
        validationSpan.end();
        return result;
      });

      // Child span for payment
      await tracer.startActiveSpan('chargePayment', async (paymentSpan) => {
        paymentSpan.setAttribute('payment.amount', order.total);
        paymentSpan.setAttribute('payment.currency', order.currency);
        await chargePayment(order);
        paymentSpan.end();
      });

      span.setAttribute('order.status', 'completed');
      span.setStatus({ code: SpanStatusCode.OK });
      return order;
    } catch (error) {
      span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
      span.recordException(error);
      throw error;
    } finally {
      span.end();
    }
  });
}
```

### OTel Collector Configuration

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
    send_batch_size: 1024
    timeout: 5s
  memory_limiter:
    check_interval: 1s
    limit_mib: 512
    spike_limit_mib: 128
  attributes:
    actions:
      - key: environment
        value: production
        action: upsert
  filter:
    # Drop health check spans
    spans:
      exclude:
        match_type: strict
        attributes:
          - key: http.target
            value: /health
  tail_sampling:
    # Sample 100% of errors, 10% of successful requests
    policies:
      - name: errors
        type: status_code
        status_code: { status_codes: [ERROR] }
      - name: slow-requests
        type: latency
        latency: { threshold_ms: 1000 }
      - name: default
        type: probabilistic
        probabilistic: { sampling_percentage: 10 }

exporters:
  otlp/jaeger:
    endpoint: jaeger:4317
    tls:
      insecure: true
  prometheus:
    endpoint: 0.0.0.0:8889
  loki:
    endpoint: [reference URL]

service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [memory_limiter, filter, tail_sampling, batch]
      exporters: [otlp/jaeger]
    metrics:
      receivers: [otlp]
      processors: [memory_limiter, batch]
      exporters: [prometheus]
    logs:
      receivers: [otlp]
      processors: [memory_limiter, batch]
      exporters: [loki]
```

## Distributed Tracing

### Trace Context Propagation

```
Service A (web)  ──HTTP──>  Service B (api)  ──gRPC──>  Service C (db-proxy)
   │                            │                            │
   │ traceparent header:        │ traceparent header:         │
   │ 00-{traceId}-{spanA}-01   │ 00-{traceId}-{spanB}-01    │
   │                            │                            │
   ├── Span A (root)           ├── Span B (child of A)      ├── Span C (child of B)
   │   duration: 250ms         │   duration: 180ms          │   duration: 50ms
   │                            │                            │
   └── The SAME traceId flows through all services
```

### What to Capture in Spans

| Span Attribute | Example | Why |
|---------------|---------|-----|
| `http.method` | GET, POST | Know the operation type |
| `http.status_code` | 200, 500 | Quick error identification |
| `http.url` | /api/orders/123 | Know which endpoint |
| `db.system` | postgresql | Know which database |
| `db.statement` | SELECT ... | Debug slow queries |
| `user.id` | usr_abc123 | Trace user-specific issues |
| `order.id` | ord_xyz789 | Correlate business events |
| `error.type` | ValidationError | Categorize failures |
| `retry.count` | 2 | Detect retry storms |

## Structured Logging

### Log Format Standard

```typescript
// GOOD: Structured, queryable, correlated with traces
logger.info('Order processed', {
  orderId: 'ord_123',
  userId: 'usr_456',
  amount: 99.99,
  currency: 'USD',
  duration_ms: 245,
  traceId: span.spanContext().traceId,
  spanId: span.spanContext().spanId,
});

// BAD: Unstructured, impossible to query
logger.info(`Order ord_123 processed for user usr_456, amount $99.99 in 245ms`);
```

### Log Levels Usage Guide

| Level | Use For | Alert? | Example |
|-------|---------|--------|---------|
| `ERROR` | Failures requiring attention | Yes | Database connection failed, payment charge failed |
| `WARN` | Degraded but functional | Monitor trend | Retry succeeded, cache miss fallback, rate limit approaching |
| `INFO` | Normal business events | No | Order created, user signed in, deployment started |
| `DEBUG` | Detailed diagnostic info | No | SQL query executed, cache hit, request/response bodies |

### Correlation: Logs + Traces

```typescript
import { context, trace } from '@opentelemetry/api';
import pino from 'pino';

// Create logger that auto-injects trace context
const logger = pino({
  mixin() {
    const span = trace.getSpan(context.active());
    if (span) {
      const { traceId, spanId } = span.spanContext();
      return { traceId, spanId };
    }
    return {};
  },
});

// Every log line now includes traceId and spanId
// Click a log line in Grafana -> jump directly to the trace in Jaeger
```

## Metrics Pipeline

### The Four Golden Signals (Google SRE)

| Signal | What to Measure | Metric Type | Example |
|--------|----------------|-------------|---------|
| **Latency** | Time to serve a request | Histogram | `http_request_duration_seconds` |
| **Traffic** | Demand on your system | Counter | `http_requests_total` |
| **Errors** | Rate of failed requests | Counter | `http_errors_total` |
| **Saturation** | How full your system is | Gauge | `system_cpu_utilization`, `db_connection_pool_used` |

### RED Method (for request-driven services)

```
Rate:     requests per second
Errors:   errors per second
Duration: time per request (histogram)

PROMETHEUS QUERIES:
  Rate:     rate(http_requests_total[5m])
  Errors:   rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m])
  Duration: histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))
```

### USE Method (for resources)

```
Utilization: % time resource is busy
Saturation:  queue depth / backlog
Errors:      error count

APPLY TO EACH RESOURCE:
  CPU:        utilization=usage%, saturation=load average, errors=throttled
  Memory:     utilization=used/total, saturation=swap usage, errors=OOM kills
  Disk I/O:   utilization=io_time%, saturation=queue depth, errors=io errors
  Network:    utilization=bandwidth%, saturation=TCP retransmits, errors=dropped
  DB pool:    utilization=active/max, saturation=waiting threads, errors=timeouts
```

## SLIs, SLOs, and SLAs

### Definitions

```
SLI: Quantitative measure of service quality ("99.2% of requests < 200ms")
SLO: Target for an SLI that your team commits to ("must be 99.5%")
SLA: Contract with consequences if SLO missed ("below 99.9% = 10% credit")
RELATIONSHIP: SLI measures -> SLO targets -> SLA enforces
```

### Defining Good SLIs

| Service Type | SLI Category | SLI Definition |
|-------------|-------------|----------------|
| **API** | Availability | % of requests returning non-5xx in 5-min window |
| **API** | Latency | % of requests completing in < 200ms |
| **API** | Correctness | % of responses matching expected schema |
| **Pipeline** | Freshness | Time since last successful pipeline run |
| **Pipeline** | Completeness | % of expected records processed |
| **Storage** | Durability | % of objects retrievable after write |
| **Storage** | Throughput | % of read requests served within 50ms |

### Error Budget

```
SLO: 99.9% availability (monthly)
  Total minutes in month: 43,200 (30 days)
  Error budget: 43,200 x 0.1% = 43.2 minutes of allowed downtime

BUDGET POLICY:
  Budget > 75% remaining: Ship features freely
  Budget 25-75% remaining: Normal caution, monitor closely
  Budget < 25% remaining: Freeze risky deployments, focus on reliability
  Budget exhausted: Full feature freeze until next period

BURN RATE:
  If you burn 10% of monthly budget in 1 hour:
    That is 10x the sustainable rate
    Alert: PAGE the on-call engineer immediately

  If you burn 2% of monthly budget in 6 hours:
    That is 2.4x the sustainable rate
    Alert: Create a ticket, investigate during business hours
```

## Alerting Strategy

### Alert Quality Framework

```
GOOD ALERTS:
  - Actionable: Someone can do something about it RIGHT NOW
  - Relevant: It affects users or will soon affect users
  - Urgent: It cannot wait until business hours (for pages)
  - Novel: Not firing constantly (alert fatigue)

BAD ALERTS:
  - "CPU is at 80%": So what? Is it affecting users?
  - "Disk is 90% full": Page-worthy at 3 AM? Probably not.
  - "Service restarted": If health checks pass, it recovered. Don't page.
  - "Error rate > 0": Some errors are normal. Alert on rate, not existence.
```

### Multi-Window, Multi-Burn-Rate Alerts

```yaml
# Prometheus alerting rules
groups:
  - name: slo-alerts
    rules:
      # Fast burn: 2% budget consumed in 1 hour (14.4x burn rate)
      - alert: HighErrorBurnRate_Fast
        expr: |
          (
            sum(rate(http_requests_total{status=~"5.."}[1h]))
            / sum(rate(http_requests_total[1h]))
          ) > (14.4 * 0.001)
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Burning error budget 14x faster than sustainable"

      # Slow burn: 5% budget consumed in 6 hours (6x burn rate)
      - alert: HighErrorBurnRate_Slow
        expr: |
          (
            sum(rate(http_requests_total{status=~"5.."}[6h]))
            / sum(rate(http_requests_total[6h]))
          ) > (6 * 0.001)
        for: 15m
        labels:
          severity: warning
        annotations:
          summary: "Burning error budget 6x faster than sustainable"
```

## Dashboard Design

### The Three-Dashboard Pattern

```
LEVEL 1: Service Overview (for everyone)
  - Current error rate (big number)
  - Request rate (big number)
  - P50 / P95 / P99 latency (big numbers)
  - Error budget remaining (gauge)
  - Active alerts (list)

LEVEL 2: Service Detail (for on-call)
  - Error rate by endpoint
  - Latency distribution by endpoint
  - Dependency health (DB, cache, external APIs)
  - Resource utilization (CPU, memory, connections)
  - Recent deployments (vertical markers)

LEVEL 3: Debug (for investigations)
  - Individual request traces
  - Log stream (filtered by trace ID)
  - Slow query analysis
  - Error stack traces
  - Resource saturation detail
```

## Common Anti-Patterns

1. **Monitoring without observability**: 500 dashboards, 2000 alerts, and you still cannot debug a production issue. Focus on correlation (traces + logs + metrics) over volume.

2. **Alert fatigue**: More than 5 pages per week means your alerts are too noisy. Every alert should be actionable and urgent. Non-urgent issues go to tickets, not pages.

3. **Logging everything**: Logging every request body at INFO level costs thousands in storage. Log at the right level. Use sampling for high-volume traces.

4. **Vanity metrics on dashboards**: CPU utilization looks impressive but rarely helps debug issues. Dashboard space is expensive (attention). Show signals that help you act.

5. **No trace context propagation**: Traces that stop at service boundaries are useless for distributed debugging. Ensure W3C Trace Context headers propagate through every hop.

## Observability Checklist

- [ ] OpenTelemetry SDK configured for traces, metrics, and logs
- [ ] Auto-instrumentation enabled for HTTP, database, and cache clients
- [ ] Custom spans added for critical business operations
- [ ] Structured logging with trace ID correlation
- [ ] Four Golden Signals dashboards for each service
- [ ] SLIs defined for each user-facing service
- [ ] SLOs set with error budget tracking
- [ ] Multi-burn-rate alerts configured (fast and slow)
- [ ] Three-level dashboard hierarchy (overview, detail, debug)
- [ ] OTel Collector deployed with sampling and filtering
- [ ] Runbook links attached to every alert

## When to Use

**Use this skill when:**
- Designing or implementing observability engineer solutions
- Reviewing or improving existing observability engineer approaches
- Making architectural or implementation decisions about observability engineer
- Learning observability engineer patterns and best practices
- Troubleshooting observability engineer-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Observability Engineer Analysis

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

**Input:** "Help me implement observability engineer for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended observability engineer approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When observability engineer must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
