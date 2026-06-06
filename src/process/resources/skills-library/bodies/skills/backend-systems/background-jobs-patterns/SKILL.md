---
name: background-jobs-patterns
description: |
  Guides expert-level background jobs patterns implementation: architecture and optimization decision frameworks, production-ready patterns, and concrete templates for background jobs patterns workflows.
  Use when the user asks about background jobs patterns, background jobs patterns configuration, or backend best practices for background projects.
  Do NOT use when the user needs a different backend infrastructure capability -- check sibling skills in the backend infrastructure subcategory.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "backend architecture optimization"
  category: "backend-systems"
  subcategory: "backend-infrastructure"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Background Jobs Patterns

## When to Use

**Use this skill when:**
- User needs to offload work from the request/response cycle -- tasks taking longer than 200ms that a user should not wait for synchronously
- User is designing or debugging a job queue system (Sidekiq, Celery, BullMQ, Resque, Delayed Job, Faktory, Temporal, or similar)
- User asks how to handle retry logic, dead letter queues, job deduplication, or idempotency in async workers
- User needs to choose between task queue architectures: in-process threading, external queue (Redis/RabbitMQ/SQS), database-backed polling, or stream processing (Kafka)
- User is troubleshooting production problems: queue backlogs, thundering herd after outages, duplicate job execution, or worker memory bloat
- User wants to implement scheduled/cron jobs with reliability guarantees in a distributed environment
- User needs to model complex multi-step workflows with dependencies, fan-out, fan-in, or human approval gates
- User asks about job prioritization, rate limiting, concurrency control, or backpressure patterns

**Do NOT use this skill when:**
- User needs stream processing architecture for continuous data pipelines -- see the event streaming skill in backend infrastructure
- User is asking about distributed transactions or sagas across microservices -- see the distributed systems consistency skill
- User needs a message broker selection guide (RabbitMQ vs. Kafka vs. SQS as standalone infrastructure) -- see the message broker skill
- User wants WebSocket or Server-Sent Events for real-time push to clients -- see the real-time communication skill
- User is asking about in-process concurrency (goroutines, async/await, thread pools) without a persistent queue component -- see the concurrency patterns skill
- User needs workflow orchestration at the pipeline/ML level (Airflow, Prefect) -- see the data pipeline orchestration skill

---

## Process

### 1. Classify the Job Type and Its Requirements

Before selecting any technology or pattern, identify the exact nature of the work:

- **CPU-bound vs. I/O-bound:** CPU-bound jobs (image processing, PDF generation, ML inference) need worker isolation and process-level parallelism. I/O-bound jobs (email sending, API calls, database writes) tolerate higher concurrency per worker and thread-based execution.
- **Latency class:** Classify jobs as interactive (< 1s expected completion), near-real-time (1--30s), background (30s -- 5min), or batch (minutes to hours). Each class justifies different queue topology and retry strategies.
- **Delivery guarantee requirement:** Determine whether at-most-once (fire-and-forget analytics pings), at-least-once (email sending with idempotency guard), or exactly-once (financial ledger writes) semantics are required. True exactly-once processing requires idempotency at the worker level plus transactional dequeue.
- **Ordering requirement:** Most background jobs can tolerate out-of-order execution. If FIFO is required (sequential state machine transitions per user), this dramatically constrains queue and concurrency choices.
- **Job lifetime and payload size:** Jobs exceeding 10--50KB payload should store data externally (S3, database row) and pass only a reference. Never embed large blobs in job arguments.

### 2. Choose the Queue Backend and Worker Framework

Match the backend to the classification from Step 1:

- **Redis-backed queues (Sidekiq, BullMQ, RQ, Celery with Redis broker):** Best for interactive and near-real-time jobs. Redis provides sub-millisecond enqueue latency and supports sorted sets for delayed execution. Use when job volume is < 50,000 enqueues/sec and job retention beyond 7 days is not required.
- **Database-backed queues (GoodJob, Solid Queue, Delayed::Job, pg-boss):** Best when you already run PostgreSQL and want transactional enqueue (enqueue inside a database transaction that atomically commits with the triggering business data). Acceptable for < 5,000 jobs/min. Use `SELECT FOR UPDATE SKIP LOCKED` semantics to avoid polling contention.
- **AMQP brokers (RabbitMQ):** Best when routing is complex -- multiple consumers with different binding rules, topic exchanges, dead letter exchange (DLX) configuration, and per-queue TTL. Adds operational overhead but gives precise control over acknowledgment flow.
- **Cloud-managed queues (SQS, Google Pub/Sub, Azure Service Bus):** Best when you need managed infrastructure with at-least-once delivery, visibility timeouts, and auto-scaling consumers. SQS standard queues guarantee at-least-once; SQS FIFO queues guarantee exactly-once within a 5-minute deduplication window.
- **Durable workflow engines (Temporal, Conductor, Inngest):** Best when jobs have multi-step execution spanning hours or days, require human approval, or need fine-grained retry per activity rather than per job. Temporal's event-sourced execution history eliminates the need for manual state machines.

### 3. Design the Job Interface and Payload Contract

A well-designed job interface prevents entire categories of production failures:

- **Use job ID namespacing:** Prefix job class names with domain context (`Billing::InvoiceGenerationJob`, not just `InvoiceJob`). This prevents naming collisions in shared queues.
- **Normalize arguments to scalar types or IDs:** Pass `user_id: 42` not the full User object. Objects serialized at enqueue time become stale by execution time. Fetch fresh data inside the worker.
- **Version the job interface explicitly:** When changing argument shape, add a `schema_version` parameter and support both old and new shapes during the deployment window. Never rename or remove required arguments in a single deploy.
- **Embed a `trace_id` or `correlation_id`:** Propagate the originating request's trace ID into the job payload so distributed traces connect enqueue → execution.
- **Set maximum payload size enforcement:** Add a guard at the enqueue site that raises an error if `job.to_json.bytesize > 10_240` (10KB). This prevents Redis memory exhaustion from accidentally large payloads.
- **Define the idempotency key:** For at-least-once queues, every job should have a stable idempotency key derived from its inputs (`"invoice_#{invoice_id}_#{billing_period}"`) that can be checked before performing side effects.

### 4. Implement Retry, Backoff, and Dead Letter Strategy

Retry logic is where most background job systems fail in production:

- **Use exponential backoff with jitter:** A base delay of 15--30 seconds with formula `base * (2 ** attempt) + rand(base)` prevents retry storms after an outage. Never use fixed-interval retries at high concurrency.
- **Set a maximum retry count appropriate to job class:** Transient network failures warrant 5--10 retries over minutes. Idempotent jobs calling external APIs warrant 25 retries over hours. Non-idempotent jobs with side effects may warrant 0 retries with a dead letter queue (DLQ) and manual review.
- **Define the Dead Letter Queue (DLQ) explicitly:** Every queue with retry enabled must have a corresponding DLQ. Configure alerts when DLQ depth exceeds a threshold (e.g., > 10 items in 5 minutes). DLQ jobs must retain full payload and error context.
- **Distinguish retryable from non-retryable errors:** `HTTP 422 Unprocessable Entity` from an API is a permanent failure -- retrying wastes resources. `HTTP 503 Service Unavailable` is transient. Map exception classes to retry policy explicitly rather than catching `Exception` broadly.
- **Implement job-level timeout:** Every worker must have a hard execution timeout. A job that hangs indefinitely holds a worker thread and eventually exhausts the pool. Set timeout = 2x the 99th percentile execution time for that job class.

### 5. Design for Concurrency, Prioritization, and Rate Limiting

- **Use multiple named queues with explicit concurrency limits per queue:** A single default queue with 25 concurrent workers means one burst of slow jobs starves all fast jobs. Separate `critical`, `default`, and `low_priority` queues and allocate worker threads independently.
- **Priority within a queue is not a substitute for queue separation:** Priority queues help for fine-grained ordering but add contention overhead. Use queue separation for broad prioritization and priority within a queue for fine-grained ordering within a tier.
- **Implement rate limiting at the job level for external API calls:** Use a token bucket or leaky bucket algorithm (Redis INCR + EXPIRE is sufficient) gated on the API's documented rate limits. Never rely on catching `429 Too Many Requests` as your rate limiting strategy.
- **Use concurrency locks for resource-constrained jobs:** When only one job of a type should run per resource (one report generation per account, one sync per user), implement a distributed lock using Redis SET NX EX or Redlock. Set lock TTL = job timeout + 30s to handle crashes.
- **Control fan-out explicitly:** A job that enqueues 50,000 child jobs on each execution must be designed with a fan-out cap or a batch cursor pattern to avoid queue saturation. Break large fan-outs into paginated batches of 500--1000.

### 6. Implement Observability and Operational Visibility

Background jobs are invisible unless you instrument them explicitly:

- **Emit structured log events at three points:** job enqueued (with payload hash, queue, scheduled_at), job started (with queue latency = started_at - enqueued_at), and job completed/failed (with execution duration, retry attempt number, error class).
- **Track the four key queue metrics:** queue depth (jobs waiting), queue latency (age of oldest job), worker utilization (active workers / max workers), and error rate (failed jobs per minute per job class).
- **Set up latency-based alerts, not just error alerts:** A queue processing jobs that normally complete in 2s suddenly taking 45s indicates a downstream dependency degradation before jobs start failing outright. Alert when p95 queue latency exceeds 2x the baseline.
- **Implement job tracing with APM integration:** Sidekiq Pro, Celery with OpenTelemetry, and BullMQ all support span creation. Each job execution should appear as a child span under the originating request trace.
- **Build a job health dashboard:** Display per-queue depth, latency histogram, error rate, and DLQ depth. This should be visible to on-call engineers without requiring log access.

### 7. Handle Scheduled and Recurring Jobs Correctly

Cron-style recurring jobs in distributed systems require specific care:

- **Use a locking mechanism for cron scheduling:** When multiple application instances are running, every instance will attempt to enqueue the cron job at the scheduled time. Use a distributed lock with a short TTL (5--10s) to elect a single scheduler. Sidekiq-Cron, Fugit, and pg-boss implement this natively.
- **Treat scheduled jobs as idempotent enqueues:** If your scheduler fires twice (clock skew, restart), the second enqueue must be a no-op. Use a unique job constraint scoped to the schedule window (`weekly_report_2024_W23`).
- **Never hardcode cron expressions in application code without documentation:** Every cron schedule must have a comment explaining: what it does, why the interval was chosen, and what happens if it is delayed by 1 hour (is this catastrophic?).
- **Test cron jobs explicitly:** Cron jobs often have the least test coverage and the most catastrophic failure modes (billing runs, report emails). Write integration tests that invoke the job directly and verify idempotency by running it twice.
- **Implement missed schedule detection:** If a cron job that runs every hour has not executed in 90 minutes, fire an alert. Do not let missed jobs go undetected for hours.

### 8. Validate and Harden the Implementation

Before marking background job infrastructure production-ready:

- **Simulate worker crashes:** Kill a worker process mid-job and verify the job is re-queued (not lost) and executes correctly after recovery. For Redis-backed queues, verify the job is in the processing set and gets requeued on worker restart.
- **Simulate queue broker outage:** Verify the application degrades gracefully (fails open or fails closed per requirements) rather than crashing when the queue is unavailable.
- **Load test the queue at 2x expected peak:** Use a load test that enqueues 2x the expected peak job volume and verify worker concurrency, memory usage, and queue drain time are within acceptable bounds.
- **Audit DLQ contents monthly:** Assign ownership for DLQ review. Unreviewed DLQ jobs represent lost business operations. Create a runbook for each job class describing how to safely re-enqueue from the DLQ.
- **Document scale limits explicitly:** Record the maximum tested enqueue rate, maximum queue depth before latency degrades, and maximum worker count before diminishing returns. These become SLO inputs.

---

## Output Format

When helping a user design or review background job infrastructure, structure the output as follows:

```markdown
## Background Job Architecture Assessment

### Job Classification Summary

| Job Class | Type | Latency Class | Delivery Guarantee | Est. Volume/hr | Payload Size |
|---|---|---|---|---|---|
| [job name] | [CPU/IO] | [interactive/near-rt/background/batch] | [at-most/at-least/exactly-once] | [number] | [KB] |

### Queue Backend Recommendation

**Selected Backend:** [Redis/PostgreSQL/RabbitMQ/SQS/Temporal]

**Rationale:**
- [Specific reason tied to job classification above]
- [Operational constraints considered]
- [Trade-offs accepted]

**Rejected alternatives:**
- [Backend]: [Specific reason it was eliminated]

### Queue Topology

```
[queue_name] (concurrency: N, priority: high/medium/low)
  ├── JobClass1 (timeout: Xs, max_retries: N)
  ├── JobClass2 (timeout: Xs, max_retries: N)
  └── JobClass3 (timeout: Xs, max_retries: N)

[queue_name]_dlq (alert_threshold: N jobs)
```

### Retry and Error Policy

| Job Class | Max Retries | Backoff Strategy | Non-Retryable Errors | DLQ |
|---|---|---|---|---|
| [job name] | [N] | [exponential 15s base / none] | [exception classes] | [yes/no] |

### Concurrency and Rate Limits

| Job Class | Max Concurrency | Rate Limit | Lock Strategy |
|---|---|---|---|
| [job name] | [N workers] | [N/sec or none] | [none/redis-nx/redlock] |

### Idempotency Design

| Job Class | Idempotency Key | Guard Implementation |
|---|---|---|
| [job name] | [key formula] | [DB unique index / Redis SETNX / check-then-act] |

### Implementation Template

```[language]
# Core job implementation pattern
class [JobName]
  # Configuration block
  queue_as :[queue_name]
  retry_on [TransientError], wait: :exponentially_longer, attempts: [N]
  discard_on [PermanentError]
  
  # Payload: pass IDs only, fetch fresh inside perform
  def perform([resource_id], correlation_id:)
    return if already_processed?([resource_id])  # idempotency guard
    
    # fetch fresh data
    # execute work
    # mark as processed (within same transaction if DB-backed)
  end
  
  private
  
  def already_processed?(resource_id)
    # implementation
  end
end
```

### Observability Checklist

- [ ] Structured logging at enqueue, start, complete, and fail events
- [ ] Queue depth metric exported to monitoring system
- [ ] Queue latency (p50, p95, p99) tracked per queue
- [ ] DLQ depth alert configured at threshold: [N]
- [ ] Worker utilization dashboard created
- [ ] APM trace propagation configured
- [ ] Cron job missed-execution detection configured

### Operational Runbook References

- DLQ review process: [describe or link to runbook]
- Worker scaling procedure: [describe trigger conditions and steps]
- Queue drain emergency procedure: [describe steps for critical outages]
```

---

## Rules

1. **NEVER enqueue a job inside a database transaction that has not yet committed.** If the job executes before the transaction commits, it reads stale or missing data. Enqueue after `after_commit` hooks or outside the transaction block. This is one of the most common and silent failure modes in Rails and Django applications.

2. **NEVER use a global rescue-and-retry strategy that catches all exceptions without distinguishing retryable from permanent failures.** Retrying a `400 Bad Request` or a `RecordNotFound` is wasteful at best and can cause data corruption at worst. Explicitly map exception classes to retry policies.

3. **ALWAYS make job execution idempotent before relying on at-least-once delivery.** For any queue backend that provides at-least-once guarantees (Redis-backed queues, SQS, most AMQP configurations), assume every job will be executed more than once at some point. Design accordingly.

4. **NEVER store mutable object state in job arguments.** Serialize only IDs, primitive values, or immutable references. An ActiveRecord object, a Python model instance, or a JavaScript class embedded in a job argument will reflect state at enqueue time, not execution time, and will break across deployments that change class structure.

5. **ALWAYS set a per-job execution timeout.** A job without a timeout can hang indefinitely due to an unresponsive database connection, external API hang, or infinite loop. Set timeout at 2x the expected p99 execution time and treat timeout as a permanent failure after max retries.

6. **NEVER allow unbounded queue depth growth without backpressure.** If producers consistently enqueue faster than consumers process, queue depth grows unbounded, Redis memory or database disk is exhausted, and recovery requires complex drain procedures. Implement producer-side backpressure when queue depth exceeds a threshold.

7. **ALWAYS use separate queues for jobs of different latency classes.** Mixing interactive jobs (target < 1s queue latency) with batch jobs (acceptable latency: minutes) in a single queue means batch jobs delay interactive jobs. Separate queues with separate concurrency pools are the correct isolation mechanism.

8. **NEVER deploy a change to a job's argument interface without a transition period.** Jobs enqueued under the old interface will exist in the queue when the new worker code deploys. Maintain backward compatibility for argument shape for at least one full deployment cycle, covering the maximum job retention period.

9. **ALWAYS configure and monitor the Dead Letter Queue.** A DLQ without monitoring is a data graveyard. Every item in the DLQ represents a failed business operation. DLQ depth must be a first-class operational metric with alerts and an assigned owner.

10. **NEVER use background jobs as a substitute for proper synchronous architecture when consistency is required.** If an operation must be complete before the user receives a response, it belongs in the request cycle. Background jobs introduce eventual consistency -- if your use case cannot tolerate this, do not use async execution.

---

## Edge Cases

### Clock Skew in Distributed Schedulers

When multiple application instances run a cron scheduler simultaneously, clock differences of 1--2 seconds between hosts can cause the same scheduled job to be enqueued twice or skipped. The correct mitigation is a distributed lock with a deduplication window equal to the cron resolution (typically 60 seconds). Set the lock TTL to 55 seconds so it expires just before the next minute boundary. Do NOT rely on unique job constraints alone, because two instances can enqueue before either lock check completes. Sidekiq-Cron, GoodJob, and Solid Queue implement this with database-level locking. Custom schedulers must implement it explicitly with Redis `SET [key] [instance_id] NX EX 55`.

### Thundering Herd After Queue Outage Recovery

When a queue broker (Redis, RabbitMQ) goes down and recovers, all enqueued jobs become visible simultaneously, and all retrying jobs retry at the same moment. This can overload downstream dependencies (databases, external APIs). Mitigate by: (1) using exponential backoff with jitter so retries are spread across a time window rather than aligned; (2) implementing circuit breakers in workers that open when downstream error rates exceed 50% in a 30-second window; (3) starting workers at reduced concurrency (25% of normal) after an outage and ramping up over 5--10 minutes. Monitor downstream error rates during queue drain and throttle if they exceed baseline.

### Job Argument Deserialization After Code Deletion

If a job class is deleted or renamed in a deployment, jobs still in the queue for that class will fail to deserialize, generating a `NameError` or `ImportError` on every dequeue attempt. This can rapidly fill the DLQ and generate alert noise. The correct migration path: (1) stop enqueueing the job class; (2) wait for queue depth to reach zero; (3) then remove the class in a subsequent deployment. If the class must be removed urgently, create a tombstone class with the same name that simply logs and discards the job.

### Memory Leaks in Long-Running Workers

Workers that process thousands of jobs without restarting accumulate memory from object retention, third-party library leaks, and connection pool fragmentation. Implement maximum job count per worker process (Sidekiq's `max_jobs` option, Celery's `--max-tasks-per-child`) to periodically recycle worker processes. Set this threshold based on memory profiling -- typically 500--2000 jobs depending on job complexity. Monitor worker memory RSS over time; if RSS grows linearly with jobs processed, there is a leak that recycling masks rather than fixes. Use a memory profiler (ruby-prof, memory_profiler for Python) to identify the root cause.

### Transactional Outbox Pattern for Reliable Enqueue

When a job must be enqueued reliably only when a database transaction commits (and not if it rolls back), the standard `after_commit` hook is fragile -- if the application crashes between commit and enqueue, the job is silently lost. The transactional outbox pattern solves this: write the job payload to an `outbox` table within the same transaction as the business data. A separate polling process reads unprocessed outbox rows, enqueues them, and marks them processed. This guarantees at-least-once enqueue with no silent loss. PostgreSQL-backed queue solutions (pg-boss, GoodJob) can implement this natively because the queue table is in the same database. For Redis-backed queues, implement an explicit outbox table with a polling interval of 1--5 seconds.

### High-Cardinality Job Classes Causing Metric Explosion

Instrumenting background jobs with a `job_class` label in Prometheus or Datadog is standard practice, but if job classes are dynamically named or parameterized (e.g., `Import::Sheet123Job`), the label cardinality explodes, causing metric storage to grow unbounded. This has crashed monitoring systems in production. Normalize job class names to a fixed set of labels. Use a mapping table that translates dynamic class names to canonical categories before emitting metrics. Alert if a new unmapped job class label appears, rather than allowing it to propagate to metrics.

### Exactly-Once Semantics Across External Side Effects

When a job sends an email, charges a payment, or calls a webhook, idempotency at the job level requires coordination with the external system. Re-running a job due to a retry must not send a second email or double-charge a payment. The correct pattern: (1) generate a stable idempotency key before the side effect (`email_confirmation_#{user_id}_#{signup_date}`); (2) check a local record of completed side effects before executing; (3) pass the idempotency key to the external system (Stripe, SendGrid, and most payment processors support this natively); (4) record the completed side effect atomically with the business data write if possible. Do not rely on the external system's idempotency alone -- if the response is lost in transit, you will not know whether the operation succeeded and will be unable to determine whether to retry.

### Worker Pool Exhaustion Under Slow Downstream Dependencies

When a downstream dependency (database, external API) slows from 50ms to 2000ms response time, workers that normally handle 20 jobs/second each now handle only 0.5 jobs/second, meaning 40x more workers are needed to maintain throughput. This causes worker pool exhaustion, and new jobs queue indefinitely. Mitigate with: (1) per-job execution timeouts that free workers when dependencies are slow; (2) circuit breakers that fast-fail when a dependency exceeds its error threshold, freeing workers to process jobs that do not use that dependency; (3) separate worker pools per dependency so a slow email API does not exhaust the worker pool for database jobs. Set circuit breaker thresholds at 20--30% error rate over a 30-second window, with a half-open probe every 60 seconds.

---

## Example

**Input:** "We're building a SaaS B2B invoicing platform in Ruby on Rails with PostgreSQL and Redis. We need to handle: monthly invoice generation for all accounts (runs on the 1st of each month, ~50,000 accounts), real-time invoice PDF generation when a user clicks 'Download' (must complete in under 3 seconds from user perspective), sending invoice emails after generation, and syncing invoice data to QuickBooks via their API (rate-limited to 100 req/min). What background job architecture do you recommend?"

---

### Background Job Architecture Assessment

#### Job Classification Summary

| Job Class | Type | Latency Class | Delivery Guarantee | Est. Volume/hr | Payload Size |
|---|---|---|---|---|---|
| `Billing::MonthlyInvoiceGenerationJob` | CPU + I/O | Batch (< 2hr total drain) | At-least-once + idempotent | 50,000 (burst, 1st of month) | < 1KB |
| `Billing::InvoicePdfRenderJob` | CPU | Interactive (< 3s p99) | At-least-once + idempotent | ~500 during business hours | < 2KB |
| `Notifications::InvoiceEmailJob` | I/O | Near-real-time (< 30s) | At-least-once + idempotent | ~50,000 (burst) + 500/hr steady | < 1KB |
| `Integrations::QuickBooksSyncJob` | I/O | Background (< 5min) | At-least-once + idempotent | 100/min maximum (rate-limited) | < 2KB |

#### Queue Backend Recommendation

**Selected Backend:** Redis (Sidekiq Pro) + PostgreSQL (GoodJob for scheduled coordination)

**Rationale:**
- Redis/Sidekiq provides sub-millisecond enqueue latency required for the interactive PDF job
- PostgreSQL (GoodJob) handles the monthly cron scheduling with distributed locking natively, preventing double-enqueue across Heroku dynos or ECS tasks
- The invoice generation fan-out (50,000 jobs in one cron trigger) benefits from Sidekiq's batching and callback features in Pro tier
- Existing Rails + PostgreSQL stack means GoodJob adds zero new infrastructure for scheduling

**Rejected alternatives:**
- PostgreSQL-only (GoodJob for all jobs): Acceptable for email and sync jobs, but interactive PDF jobs at < 3s p99 latency is marginal -- PostgreSQL polling interval (500ms default) adds unacceptable latency jitter
- SQS: Adds AWS infrastructure dependency, visibility timeout model is more complex to tune than Redis, and 20-second minimum visibility timeout hurts interactive jobs

#### Queue Topology

```
critical (Sidekiq, concurrency: 10)
  └── Billing::InvoicePdfRenderJob (timeout: 30s, max_retries: 3)

default (Sidekiq, concurrency: 20)
  ├── Notifications::InvoiceEmailJob (timeout: 60s, max_retries: 15)
  └── Billing::MonthlyInvoiceGenerationJob (timeout: 120s, max_retries: 5)

integrations (Sidekiq, concurrency: 2)
  └── Integrations::QuickBooksSyncJob (timeout: 90s, max_retries: 25)

[each queue]_dlq (Sidekiq dead set, alert_threshold: 5 jobs)
```

Note: `integrations` queue is intentionally capped at concurrency 2 -- the rate limit on QuickBooks (100 req/min) means 2 workers each processing 1 job/~1.2s saturates the limit safely with headroom.

#### Retry and Error Policy

| Job Class | Max Retries | Backoff Strategy | Non-Retryable Errors | DLQ |
|---|---|---|---|---|
| `InvoicePdfRenderJob` | 3 | Exponential, 15s base | `Invoice::NotFoundError`, `PDF::InvalidTemplateError` | Yes |
| `InvoiceEmailJob` | 15 | Exponential, 15s base (max ~4hr spread) | `Email::InvalidAddressError`, `Account::SuspendedError` | Yes |
| `MonthlyInvoiceGenerationJob` | 5 | Exponential, 30s base | `Account::ClosedError` | Yes |
| `QuickBooksSyncJob` | 25 | Exponential, 30s base (max ~48hr spread) | `QB::AuthRevoked`, `Invoice::SyncDisabledError` | Yes |

#### Concurrency and Rate Limits

| Job Class | Max Concurrency | Rate Limit | Lock Strategy |
|---|---|---|---|
| `InvoicePdfRenderJob` | 10 (critical queue) | None | Redis NX per `invoice_id`, TTL: 35s |
| `InvoiceEmailJob` | 20 (default queue share) | None | Redis NX per `invoice_id`, TTL: 65s |
| `MonthlyInvoiceGenerationJob` | 20 (default queue share) | Batch: 1000 enqueues/sec max | Redis NX per `account_id_billing_period`, TTL: 125s |
| `QuickBooksSyncJob` | 2 (integrations queue) | 90 req/min (90% of limit) | Redis NX per `invoice_id_sync_type`, TTL: 95s |

#### Idempotency Design

| Job Class | Idempotency Key | Guard Implementation |
|---|---|---|
| `InvoicePdfRenderJob` | `pdf_#{invoice_id}` | Check `invoices.pdf_generated_at IS NOT NULL` before render |
| `InvoiceEmailJob` | `email_invoice_#{invoice_id}_#{recipient_email}` | DB unique index on `invoice_notifications(invoice_id, email)` |
| `MonthlyInvoiceGenerationJob` | `monthly_invoice_#{account_id}_#{year}_#{month}` | DB unique index on `invoices(account_id, billing_period)` |
| `QuickBooksSyncJob` | `qb_sync_#{invoice_id}` | QuickBooks idempotency key header + local `qb_synced_at` column |

#### Implementation Template

```ruby
# app/jobs/billing/invoice_pdf_render_job.rb
class Billing::InvoicePdfRenderJob < ApplicationJob
  queue_as :critical

  # Retryable transient failures only
  retry_on PDF::RenderTimeoutError, Net::ReadTimeout, Redis::TimeoutError,
           wait: :exponentially_longer, attempts: 3

  # Permanent failures -- move to DLQ immediately
  discard_on Invoice::NotFoundError, PDF::InvalidTemplateError

  # Hard execution ceiling: 2x p99 render time (p99 observed: 12s)
  sidekiq_options timeout: 30

  def perform(invoice_id, correlation_id: nil)
    # Propagate trace context for APM
    Datadog::Tracing.trace('invoice.pdf_render', tags: { correlation_id: }) do
      
      # Idempotency guard: check before acquiring lock
      invoice = Invoice.find(invoice_id)  # raises Invoice::NotFoundError if missing
      return if invoice.pdf_generated_at.present?

      # Distributed lock: prevents duplicate renders under at-least-once delivery
      lock_key = "lock:pdf_render:#{invoice_id}"
      acquired = $redis.set(lock_key, 1, nx: true, ex: 35)
      return unless acquired

      begin
        # Fetch all data fresh -- never rely on serialized state
        account = invoice.account
        line_items = invoice.line_items.includes(:product)

        pdf_bytes = PdfRenderer.render(
          template: account.invoice_template,
          invoice:,
          line_items:
        )

        # Atomic: store PDF + mark generated in same transaction
        ActiveRecord::Base.transaction do
          invoice.update!(
            pdf_url: StorageService.upload(pdf_bytes, "invoices/#{invoice_id}.pdf"),
            pdf_generated_at: Time.current
          )
        end

        # Enqueue email AFTER commit (not inside the transaction above)
        Notifications::InvoiceEmailJob.perform_later(
          invoice_id,
          correlation_id:
        )

      ensure
        $redis.del(lock_key)
      end
    end
  end
end
```

```ruby
# app/jobs/billing/monthly_invoice_fan_out_job.rb
# This is the cron-triggered entry point -- it fans out one job per account
class Billing::MonthlyInvoiceFanOutJob < ApplicationJob
  queue_as :default
  sidekiq_options timeout: 300  # Fan-out of 50k enqueues may take 2-3 minutes

  def perform(year:, month:)
    billing_period = "#{year}-#{month.to_s.rjust(2, '0')}"
    
    # Cursor-based batching: avoid loading 50k records into memory
    Account.active.in_batches(of: 500) do |batch|
      jobs = batch.map do |account|
        [
          'Billing::MonthlyInvoiceGenerationJob',
          [account.id, { billing_period:, correlation_id: SecureRandom.uuid }]
        ]
      end
      # Sidekiq bulk enqueue: one Redis round-trip per 500 jobs
      Sidekiq::Client.push_bulk('class' => jobs.first[0],
                                 'args'  => jobs.map(&:last),
                                 'queue' => 'default')
    end
  end
end
```

```yaml
# config/schedule.yml (Sidekiq-Cron)
monthly_invoice_fan_out:
  cron: "0 2 1 * *"           # 2:00 AM on 1st of every month
  class: "Billing::MonthlyInvoiceFanOutJob"
  # Args passed as keyword arguments resolved at runtime
  args:
    year: <%= Date.today.year %>
    month: <%= Date.today.month %>
  description: >
    Fans out monthly invoice generation to all active accounts.
    Runs at 2AM to minimize overlap with peak PDF download traffic.
    Delayed by 2 months max before the accounting SLA is breached.
    Idempotent: duplicate enqueue within the same billing_period is a no-op.
```

#### Observability Checklist

- [x] Structured JSON logging at enqueue, start, complete, and fail -- correlation_id threaded through all events
- [x] Sidekiq Web UI mounted at `/admin/sidekiq` behind admin auth
- [x] Prometheus metrics via `sidekiq-prometheus-exporter`: queue depth, latency, processed, failed -- per queue
- [x] Datadog APM spans created per job execution, child spans for PDF render and S3 upload
- [x] PagerDuty alert: DLQ depth > 5 items AND growing for 5 minutes
- [x] PagerDuty alert: `critical` queue p95 latency > 5s (user-facing PDF download SLA at risk)
- [x] PagerDuty alert: `integrations` QuickBooksSyncJob error rate > 20% over 10 minutes (likely auth revocation)
- [x] Cron job missed-execution detection: alert if `MonthlyInvoiceFanOutJob` has not run within 90 minutes of scheduled time on the 1st

#### Operational Runbook Notes

**DLQ review process:** All DLQ jobs are reviewed within 24 hours. `MonthlyInvoiceGenerationJob` DLQ items require manual verification that the invoice was not partially created before re-enqueueing. `QuickBooksSyncJob` DLQ items with `QB::AuthRevoked` require the account owner to re-authenticate QuickBooks before re-enqueueing -- do not retry automatically.

**Worker scaling:** Add Sidekiq processes (not threads) for CPU-bound PDF rendering. Threads are appropriate for I/O-bound email and sync jobs. Target `integrations` queue at exactly 2 concurrency permanently -- do not scale this up, as it will exceed the QuickBooks rate limit.

**Monthly fan-out window:** The 50,000-job fan-out drains in approximately 45--60 minutes at current concurrency. If the queue is not empty by 4:00 AM on the 1st, page on-call to investigate. The accounting cutoff requires all invoices generated by 6:00 AM.
