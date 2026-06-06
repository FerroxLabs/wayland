---
name: background-job-designer
description: |
  Expert guide for designing reliable background job systems including worker architectures, queue selection, retry strategies, dead letter queues, idempotency patterns, job scheduling, and monitoring for production workloads.
  Use when the user asks about background job designer, background job designer best practices, or needs guidance on background job designer implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "backend api-design guide"
  category: "backend-systems"
  subcategory: "server-infrastructure"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Background Job Designer

You are an expert in designing and operating reliable background job processing systems. You guide teams through queue architecture, worker design, retry strategies, idempotency, failure handling, and operational best practices for asynchronous workloads at scale.

## Core Principles

1. **Every job will fail eventually** - Design for retries, idempotency, and graceful degradation from the start.
2. **Visibility is non-negotiable** - If you cannot observe a job's status, duration, and failure reason, you cannot operate it.
3. **Separate concerns by queue** - Different job types have different latency, throughput, and retry requirements.

## Queue Technology Selection

```
TECHNOLOGY         BEST FOR                        ORDERING    LATENCY
---------------------------------------------------------------------------
Redis (BullMQ)     Web app jobs, ~10K/s             Per-queue   <10ms
RabbitMQ           Complex routing, fanout           Per-queue   <5ms
Amazon SQS         Cloud-native, very high throughput Standard:  ~20ms
                                                     none
PostgreSQL         Simple apps, transactional enqueue Per-query  ~50ms
  (SKIP LOCKED)
Kafka              Event streaming, replay, 100K+/s  Per-part.   <10ms
```

### When to Use What

```
POSTGRES:  Already use PG, <1K jobs/min, need transactional enqueue
REDIS:     Sub-second latency, 1K-50K/min, Node.js stack
SQS:       Managed infra, >50K/min, multi-language, fanout (SNS+SQS)
KAFKA:     Event replay, multiple consumers, >100K/min
```

## Job Design

### Job Structure

```typescript
interface Job<T = unknown> {
  id: string;
  type: string;
  payload: T;
  metadata: {
    createdAt: string;
    priority: number;
    attempt: number;
    maxAttempts: number;
    idempotencyKey?: string;
    correlationId: string;
  };
}
```

### BullMQ Implementation

```typescript
import { Queue, Worker } from 'bullmq';

const emailQueue = new Queue('email', { connection });

// Enqueue
await emailQueue.add('send-welcome', {
  to: 'user@example.com', templateId: 'welcome-v2',
}, {
  attempts: 5,
  backoff: { type: 'exponential', delay: 1000 },
  removeOnComplete: { age: 86400, count: 1000 },
  removeOnFail: { age: 604800 },
  jobId: `welcome-${userId}`,   // Idempotency
});

// Worker
const worker = new Worker('email', async (job) => {
  switch (job.name) {
    case 'send-welcome': return sendEmail(job.data);
    case 'send-receipt': return sendReceipt(job.data);
    default: throw new Error(`Unknown job: ${job.name}`);
  }
}, {
  connection,
  concurrency: 10,
  limiter: { max: 100, duration: 60_000 },   // Rate limit
});

worker.on('failed', (job, err) => {
  logger.error('Job failed', { jobId: job?.id, attempt: job?.attemptsMade, error: err.message });
});
```

### PostgreSQL Queue (SKIP LOCKED)

```sql
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue VARCHAR(100) NOT NULL DEFAULT 'default',
  type VARCHAR(200) NOT NULL,
  payload JSONB NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  priority INTEGER NOT NULL DEFAULT 100,
  attempt INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 5,
  scheduled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_jobs_fetch ON jobs (queue, priority, scheduled_at)
  WHERE status = 'pending';

-- Atomic job get (concurrent-safe)
WITH next_job AS (
  SELECT id FROM jobs
  WHERE queue = $1 AND status = 'pending' AND scheduled_at <= NOW()
  ORDER BY priority ASC, scheduled_at ASC
  LIMIT 1 FOR UPDATE SKIP LOCKED
)
UPDATE jobs SET status = 'running', attempt = attempt + 1
FROM next_job WHERE jobs.id = next_job.id
RETURNING jobs.*;
```

## Retry Strategies

### Backoff Patterns

```
STRATEGY          FORMULA                     USE CASE
--------------------------------------------------------------
Fixed             delay = 5s                  Simple, predictable
Exponential       delay = 2^attempt * 1s      Standard for most jobs
Exp + Jitter      delay = random(0, 2^a * 1s) Prevent thundering herd
Custom schedule   [1s, 5s, 30s, 300s, 3600s]  Specific timing needs
```

### Error Classification

```typescript
function classifyError(error: Error): 'retry' | 'fail' | 'discard' {
  if (/ECONNRESET|ETIMEDOUT|429|503/.test(error.message)) return 'retry';
  if (/400|404|Invalid/.test(error.message)) return 'fail';
  if (/duplicate/.test(error.message)) return 'discard';
  return 'retry';  // Unknown errors: retry conservatively
}
```

## Dead Letter Queues

### DLQ Architecture

```
Main Queue -> Worker -> [Success] -> Done
                |
                +-> [Max retries exceeded] -> Dead Letter Queue
                                                   |
                                    +--------------+-----------+
                                    |              |           |
                                 Alert team    Dashboard    Store for
                                    |                      manual review
                                 Manual review -> Replay to main queue
```

### DLQ Handler

```typescript
async function handleDeadLetter(job: Job): Promise<void> {
  await db.deadLetters.insert({
    originalJobId: job.id,
    queue: job.queueName,
    type: job.name,
    payload: job.data,
    failureReason: job.failedReason,
    attempts: job.attemptsMade,
  });
  await alerting.send({
    channel: '#job-failures',
    message: `Job ${job.name} (${job.id}) moved to DLQ after ${job.attemptsMade} attempts`,
  });
}

// Replay mechanism
async function replayDeadLetters(filter: { queue?: string; type?: string }): Promise<number> {
  const records = await db.deadLetters.find({ ...filter, resolution: null });
  let replayed = 0;
  for (const record of records) {
    const queue = getQueue(record.queue);
    await queue.add(record.type, record.payload);
    await db.deadLetters.update(record.id, { resolution: 'replayed' });
    replayed++;
  }
  return replayed;
}
```

## Idempotency

```typescript
async function processIdempotently<T>(
  key: string, ttl: number, processor: () => Promise<T>,
): Promise<T | null> {
  const acquired = await redis.set(`idem:${key}`, 'processing', 'NX', 'EX', ttl);
  if (!acquired) {
    const result = await redis.get(`idem:${key}:result`);
    return result ? JSON.parse(result) : null;
  }
  try {
    const result = await processor();
    await redis.set(`idem:${key}:result`, JSON.stringify(result), 'EX', ttl);
    return result;
  } catch (err) {
    await redis.del(`idem:${key}`);
    throw err;
  }
}
```

## Job Scheduling

```typescript
// Cron-based repeatable jobs
await reportQueue.add('daily-summary', { reportType: 'daily' }, {
  repeat: { pattern: '0 6 * * *', tz: 'America/New_York' },
  jobId: 'daily-summary',
});

// Delayed jobs (e.g., auto-cancel unpaid order after 30 min)
await orderQueue.add('auto-cancel', { orderId: order.id }, {
  delay: 30 * 60 * 1000,
  jobId: `cancel-${order.id}`,
});

// Cancel delayed job if payment arrives
const job = await orderQueue.getJob(`cancel-${order.id}`);
if (job) await job.remove();
```

## Worker Lifecycle

### Graceful Shutdown

```typescript
async function shutdown(signal: string) {
  logger.info(`Received ${signal}, shutting down...`);
  await worker.close();           // Stop accepting new jobs
  await connection.quit();        // Close Redis
  process.exit(0);
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
```

### Stalled Job Detection

```sql
-- PostgreSQL: reap stalled jobs (workers that died mid-processing)
UPDATE jobs
SET status = CASE WHEN attempt >= max_attempts THEN 'dead' ELSE 'pending' END,
    error_message = 'Job stalled (worker timeout)',
    scheduled_at = NOW() + INTERVAL '30 seconds'
WHERE status = 'running'
  AND started_at < NOW() - INTERVAL '600 seconds';
```

## Monitoring

### Key Metrics

```
METRIC                     ALERT CONDITION
-------------------------------------------------
Queue depth                > 10,000 sustained 5min
Processing time (p99)      > 2x baseline
Error rate                 > 5% of processed
DLQ size                   > 0 new entries
Stalled jobs               > 0
Worker utilization         > 90% sustained
```

## Production Checklist

```
DESIGN:
  [ ] Jobs are idempotent
  [ ] Jobs carry all data needed (no stale state fetching)
  [ ] Separate queues for different priorities
  [ ] Payload serializable and under size limits

RELIABILITY:
  [ ] Exponential backoff with jitter
  [ ] Error classification (transient vs permanent)
  [ ] Dead letter queue with alerting and replay
  [ ] Stalled job detection and recovery
  [ ] Graceful shutdown with in-flight completion

OPERATIONS:
  [ ] Structured logging with job ID and correlation ID
  [ ] Queue depth monitoring and alerting
  [ ] Processing time and error rate dashboards
  [ ] DLQ review process defined
  [ ] Job retention and cleanup policy
```

## When to Use

**Use this skill when:**
- Designing or implementing background job designer solutions
- Reviewing or improving existing background job designer approaches
- Making architectural or implementation decisions about background job designer
- Learning background job designer patterns and best practices
- Troubleshooting background job designer-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Background Job Designer Analysis

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

**Input:** "Help me implement background job designer for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended background job designer approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When background job designer must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
