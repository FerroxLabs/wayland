---
name: logging-patterns
description: |
  Guides expert-level logging patterns implementation: debugging and best-practices decision frameworks, production-ready patterns, and concrete templates for logging patterns workflows.
  Use when the user asks about logging patterns, logging patterns configuration, or devops best practices for logging projects.
  Do NOT use when the user needs a different devops cloud capability -- check sibling skills in the devops cloud subcategory.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "devops debugging best-practices"
  category: "devops-cloud"
  subcategory: "devops-cloud"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Logging Patterns

## When to Use

**Use this skill when:**
- User is designing or implementing a structured logging strategy for a new or existing application and needs guidance on log levels, formats, and output destinations
- User is debugging a production incident and needs to understand what logging instrumentation would have made the problem diagnosable faster
- User wants to implement distributed tracing correlation across microservices using trace IDs and span IDs in log entries
- User is migrating from unstructured (printf-style) logging to structured JSON logging and needs a concrete migration plan
- User needs to implement log sampling, rate limiting, or log aggregation pipelines to manage high-volume log output without overwhelming storage or alerting systems
- User asks about log retention policies, log levels by environment, or log redaction/masking strategies for sensitive data (PII, tokens, secrets)
- User wants to integrate application logs with an observability stack (ELK, Loki/Grafana, Datadog, OpenTelemetry)
- User needs to implement context propagation -- carrying request IDs, user IDs, or tenant IDs through async call chains

**Do NOT use this skill when:**
- User needs help with metrics collection (histograms, counters, gauges) -- use the metrics-and-alerting skill
- User needs help configuring distributed tracing infrastructure (Jaeger, Zipkin, Tempo) itself -- use the distributed-tracing skill
- User is asking about log-based security information and event management (SIEM) integrations -- use the security-monitoring skill
- User needs help with infrastructure-level logging (kernel logs, cloud provider audit logs like CloudTrail/Cloud Audit Logs) -- use the cloud-audit-logging skill
- User wants to build a log aggregation pipeline from scratch (Fluent Bit configuration, Logstash pipelines) -- use the log-aggregation-pipelines skill
- User needs general debugging advice not related to instrumentation strategy

---

## Process

### 1. Audit the Current Logging State

Before recommending any pattern, understand what already exists.

- Determine the logging library in use: Java (Log4j2, Logback, SLF4J), Python (stdlib logging, structlog, loguru), Node.js (Winston, Pino, Bunyan), Go (zap, zerolog, slog), or Ruby (semantic_logger). Each has different configuration models.
- Identify whether output is currently unstructured text, structured JSON, or mixed. Mixed is the hardest state -- parsers break on edge cases constantly.
- Check whether log levels are being applied consistently or whether developers have scattered `console.log` / `print` statements throughout the codebase with no level control.
- Identify the downstream consumer: file-based log rotation (logrotate), a sidecar log collector (Fluent Bit, Filebeat, Vector), stdout to a container runtime, or direct SDK shipping (Datadog agent, New Relic SDK).
- Determine whether any sensitive data (passwords, API keys, PII like email addresses or SSNs, session tokens, credit card numbers) is currently being logged. This is a compliance and security blocker that must be fixed before any other improvement.
- Ask about current log volume: orders of magnitude matter. Under 10K logs/second can use synchronous appenders; above that, async buffered appenders with backpressure handling become critical.

---

### 2. Establish the Log Level Taxonomy

Define exactly which log level means what in this codebase, with numeric severity and production behavior.

- **TRACE (5):** Fine-grained debug information -- method entry/exit, loop iterations, variable state. NEVER enabled in production. Extremely high volume. Useful during local development and staging test runs only.
- **DEBUG (10):** Developer-facing diagnostic information -- SQL queries executed, cache hit/miss decisions, branching logic outcomes. Disabled in production by default. Enable temporarily via dynamic log level APIs during incident investigation (feature in Log4j2, structlog processors, Pino's `logger.level` mutation).
- **INFO (20):** Normal application lifecycle events -- service startup with version and configuration summary, successful authentication, job completion with duration and record count, feature flag state at startup. Enabled in production. Roughly 80-90% of production logs should be INFO or below in a well-instrumented service.
- **WARN (30):** Unexpected but handled situations -- a retry attempt (log with attempt number and delay), a fallback to a secondary data source, a deprecated API call from a client, a resource pool approaching capacity (e.g., connection pool at 80% utilization). Does not require immediate action but should be monitored.
- **ERROR (40):** A specific operation failed and it is affecting a user or system function. Requires human attention within business hours. Always include the exception/stack trace, the operation that failed, and all relevant context (request ID, user ID, input parameters that are safe to log).
- **FATAL/CRITICAL (50):** The application cannot continue operating -- database connection pool exhausted, required configuration missing at startup, unrecoverable out-of-memory condition. Should trigger immediate paging. Typically followed by process exit.

**Decision rule:** If you are debating between WARN and ERROR, ask: "Is a user experiencing a degraded or failed experience right now?" Yes = ERROR. No = WARN.

---

### 3. Design the Structured Log Schema

Every log entry must be a machine-parseable JSON object with a consistent field schema across all services in the system.

Define the mandatory base fields that every log entry must contain, regardless of service:

```
timestamp    -- ISO 8601 with milliseconds and timezone: "2024-03-15T14:23:45.123Z"
level        -- string: "INFO", "WARN", "ERROR" (uppercase, not numeric)
service      -- service name, matches deployment label: "payment-processor"
version      -- semantic version of the deployed artifact: "2.4.1"
environment  -- "production", "staging", "development" -- NEVER infer from hostname
message      -- human-readable description, present tense, no interpolation of IDs
                Good: "Payment authorization failed"
                Bad:  "Payment 12345 failed for user abc at 14:23"
trace_id     -- distributed trace ID (W3C traceparent format or UUID v4), null if unavailable
span_id      -- current span ID for distributed tracing correlation
request_id   -- unique ID per inbound request, propagated from gateway or generated at entry point
```

Define optional context fields that must follow consistent naming conventions:

```
user_id      -- internal UUID, NOT email, NOT username (those are PII)
tenant_id    -- for multi-tenant systems
duration_ms  -- numeric, for any operation with measurable latency
error        -- nested object with: { type, message, stack } for ERROR level entries
http         -- nested object with: { method, path, status_code, duration_ms }
db           -- nested object with: { query_type, table, duration_ms, rows_affected }
```

**Never** embed IDs in the message string. Put them in dedicated fields. This is the single most important rule for enabling log queries like `trace_id:"abc-123"` in your log aggregator.

---

### 4. Implement Context Propagation

Context propagation -- threading request-scoped data through the entire call chain -- is what separates useful logs from useless logs.

- **Thread-local / AsyncLocal storage:** In Java, use MDC (Mapped Diagnostic Context) from SLF4J. In Python, use `contextvars.ContextVar`. In Node.js (async code), use `AsyncLocalStorage` from the `async_hooks` module. In Go, pass a context-enriched `context.Context` with values attached.
- Inject `request_id` and `trace_id` at the HTTP middleware/filter layer before any business logic executes. This ensures every log line emitted during request handling automatically carries these IDs without developers explicitly passing them.
- For async tasks, background jobs, and message queue consumers, propagate the originating `trace_id` from the message header or job payload into the worker's context at task start. This links the worker's logs to the originating request logs.
- For gRPC services, use gRPC metadata headers to propagate trace context. For message queues (Kafka, RabbitMQ, SQS), embed `trace_id` in the message envelope/header, not the payload.
- Clear the context at the end of each request to prevent context leaking between requests in thread pool environments. In Java MDC: call `MDC.clear()` in a finally block or servlet filter cleanup.

**Example middleware pattern (Node.js):**
```javascript
// At the entry point of every HTTP request:
const store = new Map();
store.set('request_id', req.headers['x-request-id'] ?? crypto.randomUUID());
store.set('trace_id', req.headers['traceparent'] ?? crypto.randomUUID());
asyncLocalStorage.run(store, () => next());

// In the logger:
const ctx = asyncLocalStorage.getStore();
const base = {
  request_id: ctx?.get('request_id'),
  trace_id: ctx?.get('trace_id'),
};
```

---

### 5. Implement Log Sanitization and Redaction

Sensitive data in logs creates compliance violations (GDPR, PCI-DSS, HIPAA) and security vulnerabilities.

- Build a sanitization layer that runs as a log processor/interceptor before any log entry leaves the process. Do NOT rely on developers manually remembering to redact fields.
- Maintain an explicit allowlist of fields that MAY be logged, rather than a denylist of fields to block. Allowlists are safer than denylists because new sensitive fields get blocked by default.
- Redact these categories unconditionally: passwords, API keys, OAuth tokens, session tokens, credit card numbers (PAN), Social Security Numbers, full email addresses, phone numbers, physical addresses, date of birth. For PCI-DSS compliance, card numbers must show at most last 4 digits: `****-****-****-1234`.
- For user-identifying data that is necessary for debugging, log the internal UUID (`user_id`) instead of the email or name.
- Apply a regex scrubbing pass to catch secrets that end up embedded in query strings, stack traces, or error messages. Common patterns to catch: `(?i)(password|passwd|secret|token|key|authorization)[\s:=]+\S+`, credit card patterns `\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b`.
- Test your sanitization layer with a dedicated unit test suite that uses known-sensitive strings and asserts they do not appear in the log output.

---

### 6. Configure Log Sampling and Rate Limiting

High-throughput systems can generate millions of log lines per second. Logging everything at INFO level in a service handling 50,000 requests/second generates 50,000+ log entries per second, which at ~500 bytes each is 25 MB/s -- 2.1 TB/day per service instance.

- **Head-based sampling:** Decide at request entry whether to log at full verbosity for this request (e.g., log 1% of successful requests at INFO, 100% of requests that result in errors). Implemented by setting a sampling flag in the request context.
- **Tail-based sampling:** Buffer logs for a request window (typically 5-30 seconds), then decide whether to emit based on whether the request completed with an error. More accurate than head-based but requires memory buffering. Useful for catching the rare slow/error case in a high-volume success path.
- **Rate limiting per log site:** Limit repetitive log lines at specific code locations. Log4j2's `BurstFilter`, structlog's `rate_limit_processor`, or Pino's `transport` layer can suppress duplicate log entries when the same message fires more than N times in T seconds. A good default: emit first 10 occurrences, then suppress with a summary "suppressed N similar messages" every 60 seconds.
- **Dynamic log levels:** Production systems should support changing the log level of a running service without restart. Implement a `/admin/log-level` HTTP endpoint (protected by authentication) that mutates the root logger level at runtime. This allows enabling DEBUG logging for 5 minutes during incident investigation, then restoring INFO level.
- **Always log at 100%:** ERROR, FATAL, and any log entry with a `trace_id` that has been marked for full sampling. Sampling should only apply to the happy path.

---

### 7. Design Observability Integration Points

Logs are one of the three pillars of observability (logs, metrics, traces). Design log entries to integrate with the other pillars.

- Emit a structured log entry at the completion of every external call (outbound HTTP, database query, cache operation, message queue publish/consume) with fields: `duration_ms`, `success: true/false`, `destination`, and for HTTP calls: `status_code`. This log entry is the foundation for deriving latency histograms and error rate metrics from logs if dedicated metrics instrumentation is not yet in place.
- Ensure every ERROR log entry has a `trace_id` field so that when an alert fires, the on-call engineer can immediately pivot from the alert to the full distributed trace in Jaeger/Tempo/Zipkin.
- For OpenTelemetry-integrated systems, use the OTel Log Bridge API to correlate log records with the active span automatically. The OTel SDK injects `trace_id` and `span_id` into log records when a span is active, eliminating manual propagation.
- Emit a structured startup log at severity INFO that includes: service name, version, environment, all feature flags active, configuration source (file path, config service URL), and startup duration in milliseconds. This entry is invaluable for debugging "works in staging, broken in production" issues caused by configuration drift.
- Define log-based metrics in your aggregator (Loki's `log_range_queries`, Datadog's `log_to_metric`, Elasticsearch's `transform`): error rate per service (count of `level:ERROR` entries per minute), P95 duration extracted from `duration_ms` fields, and circuit breaker open events.

---

### 8. Validate and Operationalize

Before declaring the logging implementation production-ready:

- Write a log output validation test that instantiates the service, performs representative operations, captures log output, and asserts: required fields are present, no sensitive data patterns appear, timestamps are valid ISO 8601, log levels match expected severity for each operation type.
- Verify that your log aggregation pipeline (Fluent Bit / Vector / Filebeat) can parse the JSON format without errors. A single malformed log line can cause a log shipper to drop the entire batch in strict mode -- test with intentionally malformed entries.
- Set up a log-based alert in your monitoring system for the error rate metric derived from logs. Alert threshold: if `error_rate > 1%` of requests over a 5-minute window, fire a warning. If `> 5%`, fire a critical page.
- Document the log query patterns that engineers will use during incidents: how to find all logs for a specific `trace_id`, how to find all errors for a specific `user_id` in the last hour, how to see all logs from a deployment in the 10 minutes following rollout.
- Create a runbook entry for "Logs not appearing in aggregator" covering: check container stdout output, verify Fluent Bit/Vector is running and has no parse errors, check log aggregator ingest quota/rate limit, verify time synchronization (logs with future timestamps are often dropped by aggregators with a default time window of ±15 minutes).

---

## Output Format

For each logging pattern recommendation, produce the following structured output:

---

### Logging Strategy Summary

| Dimension | Decision | Rationale |
|-----------|----------|-----------|
| Log format | Structured JSON | Machine-parseable, enables field-based queries |
| Minimum prod level | INFO | DEBUG disabled, ERROR+WARN+INFO emitted |
| Sensitive data | Allowlist approach | Blocks unknown fields by default |
| Context propagation | AsyncLocalStorage / MDC | Automatic injection, no per-call threading |
| Sampling strategy | Head-based 10%, 100% errors | Balances cost with observability |
| Output destination | stdout to container runtime | Decoupled from collection infrastructure |
| Volume estimate | ~X MB/hour per instance | Based on RPS and average entry size |

---

### Base Log Schema

```json
{
  "timestamp": "2024-03-15T14:23:45.123Z",
  "level": "INFO",
  "service": "service-name",
  "version": "1.0.0",
  "environment": "production",
  "message": "Human-readable description of what happened",
  "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736",
  "span_id": "00f067aa0ba902b7",
  "request_id": "01HV2X3KQJG9Y8MFNPWZ4BSDQ",
  "user_id": "usr_a1b2c3d4",
  "duration_ms": 142,
  "error": {
    "type": "DatabaseConnectionError",
    "message": "Connection refused on port 5432",
    "stack": "DatabaseConnectionError: Connection refused...\n  at connect (db.js:45)"
  }
}
```

---

### Logger Configuration Snippet

Provide a complete, runnable configuration for the identified logging library. Use the pattern below as a template structure:

```
[language/framework]-specific configuration block
Including:
  - Async appender configuration with buffer size and overflow policy
  - JSON formatter configuration with all required fields
  - Context enrichment (MDC, contextvars, AsyncLocalStorage) setup
  - Sensitive field filtering processor
  - Log level configuration per environment
  - Output destination (stdout for containers, file with rotation for legacy)
```

---

### Sensitive Data Redaction Rules

| Category | Pattern | Replacement |
|----------|---------|-------------|
| API keys / tokens | `(token\|key\|secret\|password)[\s:=]+\S+` | `[REDACTED]` |
| Credit card PAN | `\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b` | `****-****-****-XXXX` |
| Email addresses | `[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}` | `[EMAIL REDACTED]` |
| SSN (US) | `\b\d{3}-\d{2}-\d{4}\b` | `[SSN REDACTED]` |
| Bearer tokens | `Bearer\s+[A-Za-z0-9\-._~+/]+=*` | `Bearer [REDACTED]` |

---

### Volume and Cost Estimate

```
Requests per second (RPS):        [X]
Average log entries per request:   [Y]
Average entry size (bytes):        [Z]
Log entries per day:               X * Y * 86,400
Raw log volume per day:            X * Y * Z * 86,400 bytes
After 10% head sampling:           [calculated]
After gzip compression (~5:1):     [calculated]
Estimated storage cost (30 days):  [calculated at $0.03/GB for S3-tier]
```

---

## Rules

1. **NEVER log at ERROR level for expected or handled business conditions.** A user entering an incorrect password is not an ERROR -- it is an INFO or WARN event. Reserve ERROR for genuinely unexpected failures that require engineering attention. Over-alerting on false ERRORs causes alert fatigue and means real errors get missed.

2. **NEVER interpolate sensitive values into the message string.** The message field is often indexed as plain text and stored separately from structured fields. Even if the structured `user_email` field is redacted by a processor, an interpolated message like `"User john.doe@example.com logged in"` will leak PII.

3. **ALWAYS use a structured logging library -- never raw string formatting.** `console.log("Request failed: " + error.message)` produces unstructured output that cannot be reliably parsed. Even a minimal structured wrapper (Pino in Node.js with default config, Python's `structlog.get_logger()`) is acceptable. The transition cost is low; the observability benefit is enormous.

4. **NEVER use synchronous file appenders in high-throughput production services.** Synchronous logging blocks the request thread while waiting for disk I/O. Use async appenders (Log4j2 AsyncLogger, Logback AsyncAppender, Pino's async transport) with a ring buffer. Set the ring buffer size to at least 262,144 (256K entries) and configure `DISCARD` policy for overflow on non-ERROR entries rather than blocking.

5. **ALWAYS include duration_ms on every external call log entry.** Without duration, you cannot distinguish a timeout from a fast failure. Latency data in logs is cheap to capture (two `Date.now()` calls) and enables ad-hoc latency analysis without requiring a separate metrics system.

6. **NEVER log inside tight loops without rate limiting.** A `for` loop processing 100,000 records that logs one INFO entry per record generates 100K log entries per invocation. Use a `log_every_n_records` pattern: log once at the start, once at the end (with total count and duration), and log individual record errors only when they occur.

7. **ALWAYS configure log rotation or enforce log-to-stdout for containerized services.** Unrotated log files filling a disk are among the most common causes of production outages. In containers: write to stdout/stderr only. In VMs/bare metal: configure logrotate with `rotate 7`, `daily`, `compress`, `maxsize 500M`, `missingok`, `notifempty`, `copytruncate`.

8. **NEVER use the root logger directly in library code.** Libraries should obtain a named logger (`logging.getLogger(__name__)` in Python, `LoggerFactory.getLogger(MyClass.class)` in Java) and never configure handlers or level on the root logger. Library log configuration is the application's responsibility, not the library's. Libraries that configure the root logger interfere with the application's logging setup.

9. **ALWAYS validate that log entries are actually reaching the aggregator before declaring an incident resolved.** During incidents, log shippers can fall behind or drop entries under load. After resolving an incident, query the log aggregator for the time window of the incident and verify coverage is complete. Gaps indicate entries were dropped during the incident -- a secondary problem to investigate.

10. **NEVER rely on log ordering to understand causality across services.** Distributed systems have clock skew (typically 1-50ms, but can be seconds on poorly configured hosts). Always use `trace_id` correlation to reconstruct causality across service boundaries, not timestamp ordering. Use timestamps only for rough ordering within a single service instance.

---

## Edge Cases

### High-Frequency Event Loops and Batch Processing

Services that process millions of records per job -- ETL pipelines, message queue consumers, bulk import jobs -- cannot emit one log entry per record. The volume will overwhelm the aggregation pipeline and make the logs useless anyway (too many entries to read). Use the bookend pattern: one INFO entry at job start with total record count and configuration, one INFO entry at job end with records processed, records failed, records skipped, and total duration in milliseconds. Emit individual ERROR entries for each failed record (up to a cap of 1,000 errors -- after that, emit a WARN entry saying "error cap reached, suppressing remaining record errors" plus a final ERROR summary). This pattern gives full diagnostics without destroying the aggregation pipeline.

### Multi-Tenant SaaS Applications

In multi-tenant systems, log entries must include `tenant_id` as a mandatory base field, not an optional context field. All log-based queries during tenant-reported incidents start with `tenant_id` filtering. Additionally, implement per-tenant log isolation: some enterprise tenants have contractual requirements that their log data not be commingled with other tenants' data in shared aggregation infrastructure. This requires routing log entries to tenant-specific storage buckets or indices based on `tenant_id`, implemented at the log shipper (Fluent Bit routing rules, Vector's `route` transform). Never implement this routing in application code -- it tightly couples the application to infrastructure decisions.

### Exception and Stack Trace Logging

Stack traces are multi-line strings that break structured JSON parsing when naively concatenated. Never put a raw stack trace in the `message` field. Instead, serialize the error as a nested object: `{"error": {"type": "NullPointerException", "message": "Cannot read property of null", "stack": "...\n..."}}`. In JSON, the newlines in the stack trace are escaped as `\n` characters within the string value, keeping the log entry as a single line. Configure your log aggregator to expand `error.stack` for display. For Java stack traces, use `ThrowableProxyConverter` in Logback or the `%xThrowable` pattern in Log4j2 to serialize the full cause chain including suppressed exceptions.

### Kubernetes and Container Log Management

In Kubernetes, all application logs should go to stdout/stderr -- never to files inside the container. The kubelet captures stdout/stderr and routes it through the container runtime log driver. Key considerations: (1) Kubernetes keeps only the last 2 container log files by default (configurable via `containerLogMaxFiles` and `containerLogMaxSize` in the kubelet config -- default 10Mi per file). High-log-volume services will lose older logs from the node before they are shipped. Set up a DaemonSet-based log shipper (Fluent Bit is the standard choice for its low memory footprint -- typically 50MB resident vs Fluentd's 200MB+) that ships logs to the aggregator with minimal buffering latency. (2) Pod restarts lose the previous container's stdout buffer. If a pod OOMKills and restarts, the last logs before the OOM event may be lost. For debugging OOM events specifically, also capture the `/proc/[pid]/status` memory metrics in structured log entries periodically.

### Asynchronous and Event-Driven Architectures

In event-driven systems (Kafka consumers, SQS workers, event sourcing architectures), the originating `request_id` from the upstream HTTP request is not available in the consumer. Establish a convention: embed a `correlation_id` (which carries the value of the original `request_id`) in every event/message envelope when the event is published. The consumer extracts this `correlation_id` and injects it into its logging context at task start. This creates a causal chain: HTTP request log (`request_id: "A"`) -> Kafka event log (`correlation_id: "A"`) -> consumer processing log (`correlation_id: "A"`). Without this, incidents in event-driven systems are nearly impossible to trace to their origin.

### Log Schema Evolution and Backward Compatibility

Log schemas evolve as services evolve. Log aggregators (Elasticsearch, Loki) that auto-detect field types will break when a field changes type (e.g., `user_id` was a numeric integer in v1, is now a UUID string in v2). Define a schema versioning strategy: include a `schema_version` field in every log entry, and treat log schema changes as breaking changes that require coordination with the aggregation pipeline team. For Elasticsearch specifically, adding a new field is safe (dynamic mapping will infer the type). Changing an existing field's type will cause mapping conflicts and dropped entries. In this case, rename the field (e.g., `user_id_v2: "uuid-string"`) and run both fields in parallel for one release cycle before removing the old one.

### Log Verbosity in Third-Party Libraries

Third-party libraries and frameworks often emit DEBUG or INFO log entries at extremely high volume -- Hibernate's SQL logging, Spring's request mapping logging, AWS SDK's HTTP request/response logging. These library logs can dominate your log volume and obscure application-level logs. Configure explicit log level overrides for noisy namespaces: in Logback/Log4j2, set the package-level logger for `com.amazonaws.request` to WARN, `org.hibernate.SQL` to WARN (enable it explicitly only during local debugging), and `org.springframework.web` to WARN. Document these suppressions with the reason -- "suppressed to prevent 50x log volume increase from SDK HTTP debug output" -- so they are not accidentally removed.

---

## Example

**Input:** "We're building a Node.js microservice for payment processing. It handles ~500 requests/second in production. We need to set up logging properly from the start. The service makes calls to a Postgres database and a third-party payment gateway API. We're deploying to Kubernetes. What logging patterns should we implement?"

---

**Output:**

**Context Assessment:**
- 500 RPS, payment domain (PCI-DSS compliance required), Kubernetes deployment, external dependencies (Postgres, payment gateway)
- Critical requirements: PCI-DSS compliance (no card data in logs), trace correlation with payment gateway calls, latency visibility on all external calls, structured logs to stdout for Kubernetes
- Volume estimate: 500 RPS * ~3 log entries/request * 500 bytes avg = 750KB/s = 63GB/day raw. After 20% sampling of successful payments + 100% error logging + gzip: ~4GB/day. Manageable.

---

**Recommended Library:** Pino (Node.js)

Pino is the correct choice for this service: it is 5-8x faster than Winston in benchmarks (important at 500 RPS), outputs NDJSON natively, has built-in `redact` option for PCI compliance, and supports `AsyncLocalStorage` for request context propagation. Winston is acceptable for lower-throughput services but its synchronous transport behavior makes it risky at this volume.

---

**Logger Setup:**

```javascript
// logger.js -- Central logger configuration
import pino from 'pino';
import { AsyncLocalStorage } from 'async_hooks';

export const asyncLocalStorage = new AsyncLocalStorage();

const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  // PCI-DSS: redact all known sensitive paths unconditionally
  redact: {
    paths: [
      'payload.card_number',
      'payload.cvv',
      'payload.card_holder_name',
      'body.password',
      'headers.authorization',
      'headers["x-api-key"]',
      'error.config.headers.authorization',
    ],
    censor: '[PCI-REDACTED]',
  },
  // Formatters: keep level as string, inject context from AsyncLocalStorage
  formatters: {
    level: (label) => ({ level: label.toUpperCase() }),
    log: (object) => {
      const ctx = asyncLocalStorage.getStore();
      return {
        ...object,
        service: 'payment-processor',
        version: process.env.SERVICE_VERSION ?? 'unknown',
        environment: process.env.NODE_ENV ?? 'development',
        request_id: ctx?.get('request_id') ?? null,
        trace_id: ctx?.get('trace_id') ?? null,
        tenant_id: ctx?.get('tenant_id') ?? null,
      };
    },
  },
  // Async transport: do not block request thread on stdout writes
  transport:
    process.env.NODE_ENV === 'development'
      ? {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'SYS:standard' },
        }
      : undefined, // In production: raw NDJSON to stdout (Kubernetes captures it)
  timestamp: pino.stdTimeFunctions.isoTime, // "2024-03-15T14:23:45.123Z"
  base: null, // Remove pino's default pid/hostname fields (not needed in Kubernetes)
});

export default logger;
```

---

**HTTP Middleware -- Context Injection:**

```javascript
// middleware/requestContext.js
import { asyncLocalStorage } from '../logger.js';
import crypto from 'crypto';

export function requestContextMiddleware(req, res, next) {
  const store = new Map();

  // Accept trace ID from upstream gateway (W3C traceparent) or generate new
  const traceparent = req.headers['traceparent'];
  const traceId = traceparent
    ? traceparent.split('-')[1]           // Extract trace-id from W3C format
    : crypto.randomUUID().replace(/-/g, '');

  store.set('request_id', req.headers['x-request-id'] ?? crypto.randomUUID());
  store.set('trace_id', traceId);
  store.set('tenant_id', req.headers['x-tenant-id'] ?? null);

  asyncLocalStorage.run(store, () => next());
}
```

---

**Payment Gateway Call -- Instrumentation Pattern:**

```javascript
// services/paymentGateway.js
import logger from '../logger.js';

export async function authorizePayment(payload) {
  const startMs = Date.now();
  const operationId = crypto.randomUUID();

  // Log intent, not data -- never log payload contents for payment operations
  logger.info({
    event: 'payment_authorization_started',
    operation_id: operationId,
    amount_cents: payload.amount_cents,       // Amount is safe to log
    currency: payload.currency,               // Currency is safe to log
    payment_method_type: payload.method_type, // "card", "ach" -- not card details
    // Never log: card_number, cvv, card_holder_name, billing_address
  }, 'Payment authorization started');

  try {
    const response = await gatewayClient.authorize(payload);
    const durationMs = Date.now() - startMs;

    logger.info({
      event: 'payment_authorization_succeeded',
      operation_id: operationId,
      gateway_transaction_id: response.transaction_id,
      authorization_code: response.auth_code,
      amount_cents: payload.amount_cents,
      currency: payload.currency,
      duration_ms: durationMs,
      http: {
        status_code: response.status,
        duration_ms: durationMs,
        destination: 'payment-gateway',
      },
    }, 'Payment authorization succeeded');

    return response;
  } catch (error) {
    const durationMs = Date.now() - startMs;

    // Determine if this is a client error (bad card) or system error (gateway down)
    const isClientError = error.code === 'CARD_DECLINED' || error.code === 'INSUFFICIENT_FUNDS';

    // Client errors are WARN -- expected business outcomes
    // Gateway errors are ERROR -- infrastructure failure requiring attention
    const logMethod = isClientError ? 'warn' : 'error';

    logger[logMethod]({
      event: 'payment_authorization_failed',
      operation_id: operationId,
      amount_cents: payload.amount_cents,
      currency: payload.currency,
      duration_ms: durationMs,
      error: {
        type: error.constructor.name,
        code: error.code,
        message: error.message,
        // Stack trace only for unexpected errors (not card declines)
        stack: isClientError ? undefined : error.stack,
      },
      http: {
        status_code: error.statusCode ?? 0,
        duration_ms: durationMs,
        destination: 'payment-gateway',
      },
    }, isClientError ? 'Payment declined by gateway' : 'Payment gateway error');

    throw error;
  }
}
```

---

**Startup Log Entry:**

```javascript
// server.js -- emit structured startup log before accepting requests
logger.info({
  event: 'service_started',
  config: {
    port: process.env.PORT ?? 3000,
    log_level: process.env.LOG_LEVEL ?? 'info',
    db_pool_size: parseInt(process.env.DB_POOL_SIZE ?? '10'),
    payment_gateway_url: process.env.GATEWAY_URL, // URL is safe, not credentials
    feature_flags: {
      new_retry_logic: process.env.FF_NEW_RETRY === 'true',
      enhanced_fraud_check: process.env.FF_FRAUD_CHECK === 'true',
    },
  },
  startup_duration_ms: Date.now() - processStartTime,
}, 'Payment processor service started');
```

---

**Resulting Log Entry (example production output):**

```json
{"timestamp":"2024-03-15T14:23:45.123Z","level":"INFO","service":"payment-processor","version":"2.4.1","environment":"production","message":"Payment authorization succeeded","request_id":"01HV2X3KQJG9Y8MFNPWZ4BSDQ","trace_id":"4bf92f3577b34da6a3ce929d0e0e4736","tenant_id":"tenant_acme","event":"payment_authorization_succeeded","operation_id":"550e8400-e29b-41d4-a716-446655440000","gateway_transaction_id":"txn_3P2kX","authorization_code":"AUTH_OK","amount_cents":4999,"currency":"USD","duration_ms":187,"http":{"status_code":200,"duration_ms":187,"destination":"payment-gateway"}}
```

---

**Logging Strategy Summary for This Service:**

| Dimension | Decision | Rationale |
|-----------|----------|-----------|
| Log format | NDJSON via Pino | Single line per entry, Kubernetes compatible, 5x faster than Winston |
| Minimum prod level | INFO | DEBUG disabled; toggle via `/admin/log-level` endpoint during incidents |
| PCI compliance | Pino `redact` option + field allowlist | Automated, not reliant on developer discipline |
| Context propagation | AsyncLocalStorage in HTTP middleware | Automatic injection, zero per-call overhead |
| Sampling | 100% (at 500 RPS, volume is manageable) | Re-evaluate if service scales to >5K RPS |
| Output destination | stdout (Kubernetes runtime) | Fluent Bit DaemonSet ships to aggregator |
| Sensitive data policy | Amount/currency safe; card data never logged | PCI-DSS requirement, enforced in redact config |
| Card decline events | WARN level | Expected business outcome, not infrastructure failure |
| Gateway errors | ERROR level | Requires on-call engineer attention |
| Volume estimate | ~4GB/day compressed | 500 RPS * 3 entries * 500 bytes * 86,400s / 5 gzip ratio |
