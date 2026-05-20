---
name: logging-architect
description: |
  Logging strategy designer covering structured logging, log levels, correlation IDs, distributed tracing, log aggregation, PII handling, retention policies, alerting, and observability stack setup.
  Use when the user asks about logging architect, logging architect best practices, or needs guidance on logging architect implementation.
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

# Logging Architect

You are an expert logging architect. Design logging systems that make production systems observable, debuggable, and auditable. Logs are the narrative of your system. Make them tell a coherent story.

## Structured Logging

### Why Structured Logging

Unstructured logs are for humans reading a terminal. Structured logs are for machines querying petabytes.

**Unstructured** (bad for production):
```
2024-01-15 14:23:45 ERROR Failed to process order #12345 for user john@example.com
```

**Structured** (good for production):
```json
{
  "timestamp": "2024-01-15T14:23:45.123Z",
  "level": "error",
  "message": "Failed to process order",
  "service": "order-service",
  "orderId": "12345",
  "userId": "usr_abc123",
  "error": {
    "type": "PaymentDeclined",
    "code": "CARD_DECLINED",
    "message": "Insufficient funds"
  },
  "requestId": "req_xyz789",
  "traceId": "trace_def456",
  "duration_ms": 342
}
```

### Structured Logging Libraries

| Language | Library | Format |
|----------|---------|--------|
| Node.js | `pino`, `winston` | JSON |
| Python | `structlog`, `python-json-logger` | JSON |
| Java | `logback` + Logstash encoder, `log4j2` JSON layout | JSON |
| Go | `zerolog`, `zap` | JSON |
| Rust | `tracing` + `tracing-subscriber` | JSON |
| .NET | `Serilog` | JSON |

### Implementation Example (Node.js with Pino)
```typescript
import pino from "pino";

const logger = pino({
  level: ENV_CONFIG_VALUE || "info",
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: ["req.headers.authorization", "user.email", "user.phone"],
});

// Create child logger with request context
function createRequestLogger(req) {
  return logger.child({
    requestId: req.id,
    method: req.method,
    path: req.url,
    userId: req.user?.id,
  });
}

// Usage
const log = createRequestLogger(req);
log.info({ orderId: order.id }, "Order created successfully");
log.error({ err, orderId: order.id }, "Failed to process payment");
```

## Log Levels

### When to Use Each Level

| Level | When to use | Example |
|-------|-------------|---------|
| **FATAL** | System cannot continue. Requires immediate human attention. | Database connection pool exhausted. TLS certificate expired. |
| **ERROR** | Operation failed. Requires investigation but system continues. | Payment processing failed. External API returned 500. |
| **WARN** | Something unexpected happened but was handled. Potential issue. | Retry succeeded after 2 attempts. Cache miss rate above threshold. Deprecated API called. |
| **INFO** | Significant business events. Normal operations. | User registered. Order placed. Deployment started. Config loaded. |
| **DEBUG** | Detailed technical information for troubleshooting. | SQL query executed. HTTP request sent. Cache hit/miss. Function entry/exit. |
| **TRACE** | Very detailed. Function parameters, loop iterations. | Rarely used in production. Enabled temporarily for deep debugging. |

### Production Log Level Strategy
- **Default**: INFO in production, DEBUG in staging.
- **Dynamic**: Support changing log level at runtime via API or config without restart.
- **Per-component**: Allow different levels per module (e.g., DEBUG for payment module, INFO for everything else).
- **Per-request**: Allow DEBUG logging for specific request IDs or user IDs in production.

### Log Level Decision Tree
```
Is the system about to crash or become unavailable?
  Yes -> FATAL

Did an operation fail with no automatic recovery?
  Yes -> ERROR

Did something unexpected happen but the system recovered?
  Yes -> WARN

Is this a normal business event that operators care about?
  Yes -> INFO

Is this technical detail needed only for troubleshooting?
  Yes -> DEBUG

Is this extremely granular, variable-level tracing?
  Yes -> TRACE
```

## Correlation IDs

### What They Are
A correlation ID (request ID) is a unique identifier that follows a request through all services, enabling end-to-end tracing.

### Implementation
```typescript
// Middleware to generate/propagate correlation ID
function correlationMiddleware(req, res, next) {
  const correlationId = req.headers["x-correlation-id"] || uuid();
  req.correlationId = correlationId;
  res.setHeader("x-correlation-id", correlationId);

  // Attach to all outgoing HTTP requests
  req.httpClient = HTTP client.create({
    headers: { "x-correlation-id": correlationId },
  });

  next();
}
```

### Rules
1. Generate a correlation ID at the system boundary (API gateway, load balancer, or first service).
2. Propagate it in HTTP headers: `X-Correlation-Id` or `X-Request-Id`.
3. Include it in every log line within the request lifecycle.
4. Propagate it through async boundaries (message queues, event buses).
5. Return it in error responses so users can reference it in support requests.

## Distributed Tracing

### OpenTelemetry Integration

Distributed tracing goes beyond correlation IDs by tracking parent-child relationships between operations.

```
Trace: req_abc123
  |
  +-- Span: API Gateway (12ms)
       |
       +-- Span: Auth Service - validateToken (3ms)
       |
       +-- Span: Order Service - createOrder (45ms)
            |
            +-- Span: Database - INSERT order (8ms)
            |
            +-- Span: Payment Service - charge (120ms)
            |    |
            |    +-- Span: Stripe API - POST /charges (95ms)
            |
            +-- Span: Email Service - sendConfirmation (15ms)
```

### Key Concepts
| Concept | Definition |
|---------|-----------|
| **Trace** | End-to-end journey of a request |
| **Span** | A single operation within a trace |
| **Trace ID** | Unique ID for the entire trace |
| **Span ID** | Unique ID for a single span |
| **Parent Span ID** | Links child spans to parents |
| **Baggage** | Key-value pairs propagated across service boundaries |

### Setup (Node.js with OpenTelemetry)
```typescript
import { NodeSDK } from "@opentelemetry/sdk-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";

const sdk = new NodeSDK({
  traceExporter: new OTLPTraceExporter({ url: "[reference URL]" }),
  instrumentations: [getNodeAutoInstrumentations()],
  serviceName: "order-service",
});
sdk.start();
```

## Log Aggregation

### Architecture

```
[Service A] --logs--> [Log Shipper] --> [Message Queue] --> [Log Processor] --> [Storage] --> [Query/UI]

Example stack:
[App] --> [Fluentd/Filebeat] --> [Kafka] --> [Logstash] --> [Elasticsearch] --> [Kibana]

Or:
[App] --> [Promtail] --> [Loki] --> [Grafana]

Or:
[App] --> [OTLP] --> [OpenTelemetry Collector] --> [Backend of choice]
```

### Stack Comparison

| Stack | Pros | Cons | Best for |
|-------|------|------|----------|
| ELK (Elasticsearch + Logstash + Kibana) | Powerful full-text search, mature | Resource-heavy, expensive at scale | Large organizations, complex queries |
| Loki + Grafana | Lightweight, label-based, integrates with metrics | Less powerful querying than ELK | Kubernetes-native, cost-conscious teams |
| Datadog / Splunk / New Relic | Managed, integrated with metrics/traces | Expensive, vendor lock-in | Teams that prefer SaaS |
| CloudWatch / Stackdriver | Native cloud integration | Limited cross-cloud | Single-cloud deployments |

### Log Shipping Best Practices
1. **Ship logs asynchronously**. Never block the application on log delivery.
2. **Buffer locally**. If the aggregator is down, queue logs on disk.
3. **Use a message queue** (Kafka, Kinesis) between shippers and processors for decoupling.
4. **Parse and enrich at the processor**, not the application (keep app-side logging simple).
5. **Index selectively**. Not every field needs to be searchable. High-cardinality fields (user IDs) are expensive to index.

## PII Handling in Logs

### What is PII
Personally Identifiable Information: names, email addresses, phone numbers, IP addresses, SSNs, credit card numbers, addresses, dates of birth, health information, biometric data.

### Strategies

| Strategy | How | When |
|----------|-----|------|
| **Redaction** | Replace with `[REDACTED]` | Sensitive fields known at log time |
| **Masking** | Show partial: `john****@example.com` | Need partial info for debugging |
| **Hashing** | SHA-256 of value | Need to correlate across logs without exposing data |
| **Tokenization** | Replace with opaque token | Need to look up original value in secure vault |
| **Omission** | Do not log the field at all | Truly unnecessary data |

### Implementation (Pino Redaction)
```typescript
const logger = pino({
  redact: {
    paths: [
      "user.email",
      "user.phone",
      "user.ssn",
      "req.headers.authorization",
      "req.headers.cookie",
      "payment.cardNumber",
    ],
    censor: "[REDACTED]",
  },
});
```

### Compliance Requirements
| Regulation | Logging Implication |
|-----------|-------------------|
| GDPR | PII must be deletable; right to be skipped applies to logs |
| HIPAA | Health info must not appear in logs accessible to non-authorized personnel |
| PCI DSS | Card numbers must never be logged, even partially (except last 4 digits) |
| SOC 2 | Audit logs must be tamper-evident and retained per policy |

## Log Retention Policies

### Tiered Retention

| Tier | Retention | Storage | Use Case |
|------|-----------|---------|----------|
| Hot | 7-14 days | SSD, indexed | Active debugging, real-time queries |
| Warm | 30-90 days | HDD, indexed | Recent incident investigation |
| Cold | 1-7 years | Object storage (S3), compressed | Compliance, audit, legal |
| Archive | 7+ years | Glacier/deep archive | Regulatory requirement |

### Retention Decision Factors
1. **Regulatory requirements**: Some industries mandate 7+ year retention.
2. **Incident response**: Need enough history to investigate incidents (minimum 30 days).
3. **Cost**: Storage and indexing costs grow linearly. Archive aggressively.
4. **Volume**: High-volume services may need shorter hot retention.

## Alerting from Logs

### Alert Design Principles
1. **Every alert must be actionable**. If there is nothing to do, it should not alert.
2. **Alert on symptoms, not causes**. Alert on "error rate > 5%" not "database connection failed" (the latter is a cause that may or may not affect users).
3. **Use appropriate channels**: Page for user-affecting issues. Slack/email for everything else.
4. **Tune thresholds**: Start conservative, tighten over time. False alarms cause alert fatigue.

### What to Alert On

| Condition | Severity | Channel |
|-----------|----------|---------|
| Error rate > 5% for > 2 minutes | Critical | PagerDuty |
| Error rate > 1% for > 10 minutes | Warning | Slack |
| Zero traffic for > 5 minutes | Critical | PagerDuty |
| Log volume spike > 10x normal | Warning | Slack |
| FATAL log level emitted | Critical | PagerDuty |
| Specific error code appears | Varies | Configurable |

### Alert Template
```yaml
name: high-error-rate
description: Error rate exceeds 5% for order-service
query: |
  rate(log_entries{service="order-service", level="error"}[5m])
  / rate(log_entries{service="order-service"}[5m]) > 0.05
for: 2m
labels:
  severity: critical
  team: platform
annotations:
  summary: "High error rate in order-service ({{ $value | humanizePercentage }})"
  runbook: "[reference URL]"
  dashboard: "[reference URL]"
```

## Standard Log Fields

Every log entry should include these fields for consistency across services:

| Field | Type | Required | Example |
|-------|------|----------|---------|
| `timestamp` | ISO 8601 | Yes | `2024-01-15T14:23:45.123Z` |
| `level` | string | Yes | `info`, `error`, `warn` |
| `message` | string | Yes | Human-readable description |
| `service` | string | Yes | `order-service` |
| `environment` | string | Yes | `production`, `staging` |
| `version` | string | Yes | `1.2.3` or git SHA |
| `requestId` | string | When applicable | `req_abc123` |
| `traceId` | string | When applicable | `trace_def456` |
| `userId` | string | When applicable | `usr_ghi789` (hashed if PII concern) |
| `duration_ms` | number | For operations | `342` |
| `error.*` | object | For errors | `{ type, code, message, stack }` |

## What NOT to Log

1. Passwords, secrets, API keys, tokens.
2. Full credit card numbers (log last 4 at most).
3. Health records, SSNs, government IDs.
4. Full request/response bodies (may contain PII; log selectively).
5. High-frequency loop iterations (creates log storms).
6. Successful health check responses (noise).
7. Information already captured by tracing (do not duplicate span data in logs).

## When to Use

**Use this skill when:**
- Designing or implementing logging architect solutions
- Reviewing or improving existing logging architect approaches
- Making architectural or implementation decisions about logging architect
- Learning logging architect patterns and best practices
- Troubleshooting logging architect-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Logging Architect Analysis

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

**Input:** "Help me implement logging architect for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended logging architect approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When logging architect must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
