---
name: serverless-patterns
description: |
  Guides expert-level serverless patterns implementation: cloud and architecture decision frameworks, production-ready patterns, and concrete templates for serverless patterns workflows.
  Use when the user asks about serverless patterns, serverless patterns configuration, or backend best practices for serverless projects.
  Do NOT use when the user needs a different backend infrastructure capability -- check sibling skills in the backend infrastructure subcategory.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "backend cloud architecture"
  category: "backend-systems"
  subcategory: "backend-infrastructure"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Serverless Patterns

## When to Use

**Use this skill when:**
- User is designing or refactoring a cloud function architecture and needs to choose between event-driven, fan-out, saga, or aggregator patterns
- User is experiencing cold start latency, timeout cascades, or function chaining bottlenecks and needs targeted remediation patterns
- User is building a system with functions that need to coordinate state across multiple invocations (orchestration vs. choreography decision)
- User asks how to handle idempotency, partial failures, or retry storms in a distributed serverless system
- User wants to implement a backend-for-frontend (BFF) pattern, strangler fig migration, or event sourcing architecture using serverless compute
- User is choosing between synchronous API gateway invocation, asynchronous queue-triggered functions, and stream-processing triggers for a specific workload
- User needs to design a multi-region active-active or active-passive serverless deployment with failover guarantees
- User is hitting AWS Lambda concurrency limits, GCP Cloud Functions quota walls, or Azure Functions plan restrictions and needs architectural remediation

**Do NOT use this skill when:**
- User needs container orchestration decisions (Kubernetes, ECS task definitions) -- use the container-orchestration skill
- User needs API gateway configuration specifics (rate limiting, authentication, routing rules) without the broader serverless pattern context -- use the api-gateway skill
- User is asking about serverless databases (DynamoDB table design, Firestore data modeling) as a primary concern -- use the serverless-data-modeling skill
- User needs CI/CD pipeline design for deploying serverless functions -- use the deployment-pipelines skill
- User is asking about infrastructure-as-code tooling choices (CDK vs. Terraform vs. SAM) without an architectural pattern question -- use the iac-tooling skill
- User needs general cloud cost optimization without a specific pattern focus -- use the cloud-cost-optimization skill
- User is asking about WebSocket or long-polling server implementations where serverless is fundamentally inappropriate for the workload

---

## Process

### 1. Characterize the Workload Profile

Before recommending any pattern, extract the following signal from the user's description:

- **Invocation trigger type** -- HTTP request (synchronous, latency-sensitive), event stream (Kinesis, Kafka, Pub/Sub -- throughput-sensitive), queue message (SQS, Cloud Tasks -- at-least-once delivery), scheduled (cron-like), or storage event (S3 put, GCS object finalize)
- **Execution duration distribution** -- p50/p99 execution times matter. Functions exceeding 15 minutes on AWS Lambda require Step Functions or Fargate offload. GCP Cloud Functions gen2 supports up to 60 minutes; Azure Durable Functions have no hard timeout on activity functions
- **Concurrency profile** -- bursty (marketing email blast triggers 50,000 simultaneous invocations) vs. steady-state (1,000 req/sec continuous). Bursty workloads require concurrency throttle design to protect downstream dependencies
- **Statefulness requirement** -- stateless (pure transformation, no coordination needed), ephemeral state (within a single invocation), or durable state (must survive function restarts -- requires external state store or orchestrator)
- **Failure tolerance** -- can the operation be retried without side effects (idempotent), or does a partial execution require compensation logic (saga pattern)?
- **Payload size** -- Lambda hard limit is 6 MB synchronous / 256 KB async; SQS message limit is 256 KB. Payloads exceeding limits require the claim-check pattern (store payload in S3, pass reference)

### 2. Apply the Pattern Selection Decision Tree

Work through this decision framework in order:

- **Is coordination of multiple functions required?**
  - YES and you need visibility/retries/timeouts per step -- use **Orchestration (Step Functions / Durable Functions / Cloud Workflows)**
  - YES but you want loose coupling and independent deployability -- use **Choreography via event bus (EventBridge, Cloud Pub/Sub, Azure Event Grid)**
  - NO -- proceed to trigger type

- **What is the trigger type?**
  - HTTP/API -- evaluate **BFF pattern** (one function per client type) vs. **monolithic function** (single Express/Fastify app packaged as Lambda) vs. **fine-grained single-purpose functions**
  - Queue/stream -- evaluate **competing consumers pattern** (parallel function instances draining a queue) vs. **fan-out/fan-in** (splitter + worker pool + aggregator)
  - Schedule -- evaluate **scheduled job pattern** with idempotency guard vs. **offset schedule pattern** to avoid thundering herd at :00 minutes

- **Does the operation mutate external state?**
  - YES -- apply **transactional outbox pattern** or **saga pattern** depending on whether you can tolerate eventual consistency
  - NO -- stateless transformation is safe with simple retry logic

- **Is cold start latency acceptable?**
  - p99 cold start budget > 500ms -- standard provisioned execution, optimize package size
  - p99 cold start budget < 200ms -- use **provisioned concurrency** (AWS), **minimum instances** (GCP gen2), or **always-warm** (Azure Premium plan); also evaluate moving to edge runtime (Cloudflare Workers, Lambda@Edge) for sub-50ms cold starts
  - Real-time gaming, HFT, or sub-10ms requirements -- serverless is architecturally inappropriate; recommend containerized always-on service

### 3. Design the Idempotency Strategy

Every serverless function that mutates state must have an explicit idempotency strategy because at-least-once delivery is the default for all major cloud event systems:

- **Idempotency key sources** -- use `messageId` (SQS), `eventId` (EventBridge), `messageId` (Pub/Sub), or a client-supplied `X-Idempotency-Key` header for HTTP triggers
- **Idempotency store options** -- DynamoDB conditional writes (PutItem with `attribute_not_exists(pk)` condition) for AWS; Firestore transactions for GCP; Redis with NX SET for cross-cloud or self-managed
- **TTL on idempotency records** -- set TTL equal to the maximum retry window plus a 2x safety buffer. SQS standard queues retry for up to 4 days; set idempotency record TTL to 10 days
- **Idempotency at the boundary only** -- apply idempotency checks at the outermost function entry point, not deep inside business logic. This prevents double-processing even if internal sub-calls fail and the whole function is retried
- **Conditional idempotency** -- read operations do not need idempotency guards. Only writes, sends, and external API calls require protection

### 4. Implement the Chosen Pattern with Production Hardening

For each selected pattern, apply these production requirements:

- **Dead Letter Queues (DLQs)** -- every async-triggered function MUST have a DLQ configured. Lambda async invocations retry twice by default before dropping the event permanently without a DLQ. Set maximum receive count on SQS source queues to 3-5 before routing to DLQ
- **Timeout alignment** -- function timeout must be shorter than the visibility timeout of the source queue (SQS default 30 seconds) or the ack deadline (Pub/Sub default 10 seconds). Lambda timeout + 5 second buffer = SQS visibility timeout minimum. If function timeout is 60 seconds, set SQS visibility timeout to at least 65 seconds
- **Batch size tuning** -- SQS Lambda trigger batch size of 10 is a reasonable default for most workloads. For high-throughput streams (Kinesis), start at batch size 100 with bisect-on-error enabled so a single bad record doesn't block the shard
- **Power tuning** -- Lambda power tuning is a quantitative exercise. Use the AWS Lambda Power Tuning open-source tool (or equivalent for GCP/Azure) to test 256 MB, 512 MB, 1024 MB, and 1769 MB (1 vCPU allocation point) configurations. CPU-bound functions frequently achieve 50% lower cost at 1769 MB due to the speed improvement outweighing the higher memory price
- **Structured logging** -- emit JSON logs with `requestId`, `correlationId`, `functionName`, `functionVersion`, `duration`, and business-specific fields. Avoid string concatenation logs that cannot be queried in CloudWatch Insights, GCP Log Explorer, or Azure Monitor
- **Distributed tracing** -- instrument with OpenTelemetry or the native SDK (X-Ray, Cloud Trace, Application Insights). Propagate trace context across async boundaries by embedding `traceId` and `spanId` in event payloads and message attributes

### 5. Design the Error Handling and Retry Topology

Serverless error handling is topological -- the retry behavior depends on where in the invocation chain the error occurs:

- **Synchronous (API Gateway -> Lambda)** -- no automatic retry. The caller receives the error response directly. Implement circuit breaker at the API Gateway or client level using exponential backoff with jitter: `delay = min(cap, base * 2^attempt) + random_jitter`
- **Asynchronous (SNS/EventBridge -> Lambda)** -- Lambda retries twice with 1-minute and 2-minute delays. After 3 total attempts, the event goes to the DLQ if configured, or is silently dropped. Always configure a DLQ on the Lambda function's event source mapping AND on the SNS topic/EventBridge rule
- **Queue-triggered (SQS -> Lambda)** -- Lambda does NOT retry on its own. SQS re-queues the message after the visibility timeout expires. Configure `maxReceiveCount` on the source queue (3-5 is appropriate for most cases). After exceeding this count, SQS routes to the DLQ automatically
- **Partial batch failures** -- for SQS batch processing, return `batchItemFailures` from the Lambda handler with the specific `itemIdentifier` values that failed. This prevents the entire batch from being re-processed when only some records failed. Without this, a single bad record causes all 10 batch items to retry
- **Poison message handling** -- implement a DLQ processor function that parses failed messages, extracts the failure reason from the `ApproximateFirstReceiveTimestamp` and `ApproximateReceiveCount` attributes, emits a metric/alert, and either quarantines or requeues with manual review flag

### 6. Validate Performance, Cost, and Operational Characteristics

Before finalizing the design, quantify these dimensions:

- **Cold start impact** -- measure cold start frequency as a percentage of total invocations. If cold starts exceed 5% of invocations for a user-facing function, apply provisioned concurrency or minimum instances. Calculate the cost of provisioned concurrency vs. the revenue impact of cold start latency degradation
- **Cost modeling** -- serverless cost = (invocation count * per-invocation price) + (GB-seconds * GB-second price) + (data transfer). For AWS Lambda: $0.20 per 1M requests + $0.0000166667 per GB-second. A function running 100ms at 512MB costs $0.0000000083 per invocation. At 10M invocations/day, monthly cost is ~$2,490 for compute alone. Model at realistic p50 duration, not worst-case
- **Concurrency limit planning** -- AWS default regional Lambda concurrency is 1,000 (soft limit, increasable). Reserve 200 for critical functions, distribute the remainder. A single SQS queue with batch size 10 processing at maximum can consume 100 concurrent Lambda invocations per second. Calculate peak concurrency requirements and request limit increases before launching
- **Observability baseline** -- establish these four signals before going to production: (1) invocation count, (2) error rate %, (3) duration p50/p95/p99, (4) throttle count. Set alarms on error rate > 1% and throttle count > 0 for user-facing functions

### 7. Document the Architecture Decision

Produce a concise ADR (Architecture Decision Record) capturing:

- **Context** -- the workload characteristics identified in step 1
- **Decision** -- the specific pattern(s) selected and why
- **Alternatives considered** -- at minimum two alternatives with their disqualifying trade-offs
- **Consequences** -- operational implications, monitoring requirements, cost estimates, and any known limitations
- **Review trigger** -- a specific threshold (e.g., "revisit if monthly invocation count exceeds 500M" or "revisit if p99 latency exceeds 2 seconds") that should prompt re-evaluation of the architecture

---

## Output Format

```
## Serverless Pattern Analysis

### Workload Classification
| Dimension            | Observed Value              | Implication                          |
|----------------------|-----------------------------|--------------------------------------|
| Trigger type         | [HTTP / Queue / Stream / Schedule / Event] | [Pattern constraint]       |
| Execution duration   | [p50: Xms, p99: Xms]        | [Timeout recommendation]             |
| Concurrency profile  | [Bursty / Steady / Batch]   | [Throttle / reserve strategy]        |
| Statefulness         | [Stateless / Ephemeral / Durable] | [Orchestration requirement]     |
| Failure tolerance    | [Idempotent / Compensating] | [Retry / saga strategy]              |
| Payload size         | [< 256KB / 256KB-6MB / > 6MB] | [Claim-check requirement]          |

### Selected Pattern(s)
**Primary Pattern:** [Pattern Name]
**Supporting Patterns:** [Pattern Names]

**Rationale:** [2-3 sentences linking workload characteristics to pattern selection]

### Architecture Diagram (ASCII)
```
[Trigger] --> [Function A] --> [Queue/Stream] --> [Function B] --> [State Store]
                    |                                    |
                    v                                    v
                  [DLQ]                              [DLQ]
```

### Implementation Template

#### Function Handler (TypeScript/Node.js)
```typescript
import { Context, SQSEvent, SQSBatchResponse } from 'aws-lambda';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';

const dynamodb = new DynamoDBClient({ region: process.env.AWS_REGION });
const IDEMPOTENCY_TABLE = process.env.IDEMPOTENCY_TABLE!;
const IDEMPOTENCY_TTL_SECONDS = 10 * 24 * 60 * 60; // 10 days

export const handler = async (
  event: SQSEvent,
  context: Context
): Promise<SQSBatchResponse> => {
  const batchItemFailures: { itemIdentifier: string }[] = [];

  for (const record of event.Records) {
    try {
      const idempotencyKey = record.messageId;
      await acquireIdempotencyLock(idempotencyKey);
      await processRecord(JSON.parse(record.body));
    } catch (error) {
      if (isIdempotencyConflict(error)) {
        // Already processed -- skip silently
        continue;
      }
      console.error(JSON.stringify({
        level: 'ERROR',
        messageId: record.messageId,
        error: (error as Error).message,
        requestId: context.awsRequestId,
      }));
      batchItemFailures.push({ itemIdentifier: record.messageId });
    }
  }

  return { batchItemFailures };
};

async function acquireIdempotencyLock(key: string): Promise<void> {
  const ttl = Math.floor(Date.now() / 1000) + IDEMPOTENCY_TTL_SECONDS;
  await dynamodb.send(new PutItemCommand({
    TableName: IDEMPOTENCY_TABLE,
    Item: {
      pk: { S: key },
      ttl: { N: ttl.toString() },
      processedAt: { S: new Date().toISOString() },
    },
    ConditionExpression: 'attribute_not_exists(pk)',
  }));
}
```

#### Infrastructure Configuration (AWS CDK TypeScript)
```typescript
const processorFn = new lambda.Function(this, 'RecordProcessor', {
  runtime: lambda.Runtime.NODEJS_20_X,
  handler: 'index.handler',
  code: lambda.Code.fromAsset('dist'),
  timeout: cdk.Duration.seconds(60),
  memorySize: 512,
  reservedConcurrentExecutions: 50,
  environment: {
    IDEMPOTENCY_TABLE: idempotencyTable.tableName,
    POWERTOOLS_SERVICE_NAME: 'record-processor',
  },
  tracing: lambda.Tracing.ACTIVE,
});

const eventSourceMapping = processorFn.addEventSource(
  new SqsEventSource(sourceQueue, {
    batchSize: 10,
    maxBatchingWindow: cdk.Duration.seconds(5),
    reportBatchItemFailures: true,  // Critical: enables partial batch failure
  })
);

processorFn.addEventSource(
  new SqsEventSource(dlq, { batchSize: 1 })  // DLQ processor -- one at a time
);
```

### Configuration Reference
| Parameter                    | Value          | Reasoning                                        |
|------------------------------|----------------|--------------------------------------------------|
| Function timeout             | 60s            | p99 execution + 10s buffer                       |
| SQS visibility timeout       | 65s            | Function timeout + 5s                            |
| Batch size                   | 10             | Balanced throughput vs. blast radius             |
| Memory                       | 512 MB         | Validated via power tuning                       |
| Reserved concurrency         | 50             | Protects downstream DB from thundering herd      |
| Max receive count (SQS)      | 3              | 3 attempts before DLQ                            |
| DLQ alarm threshold          | > 0 messages   | Immediate alert on any dead letter               |
| Idempotency TTL              | 10 days        | Covers SQS max retention (4 days) * 2.5x buffer |

### Cost Estimate
| Metric                  | Value               |
|-------------------------|---------------------|
| Est. daily invocations  | [X]                 |
| Avg duration            | [X ms]              |
| Memory                  | [X MB]              |
| Monthly compute cost    | ~$[X]               |
| Monthly request cost    | ~$[X]               |
| Provisioned concurrency | $[X] (if applicable)|
| **Total monthly est.**  | **~$[X]**           |

### ADR Summary
**Context:** [One sentence describing workload]
**Decision:** [Selected pattern with one-sentence rationale]
**Alternatives Rejected:** [Alt 1 -- reason]; [Alt 2 -- reason]
**Review Trigger:** [Specific threshold metric]
```

---

## Rules

1. **NEVER configure SQS visibility timeout less than the Lambda function timeout.** If Lambda runs for 60 seconds but SQS visibility timeout is 30 seconds, SQS will re-queue the message mid-execution, causing the message to be processed simultaneously by two Lambda invocations. Set visibility timeout = function timeout + 5-second minimum buffer.

2. **ALWAYS enable `reportBatchItemFailures` on SQS event source mappings.** Without it, a single failed record in a batch of 10 causes all 10 records to be retried. This is the most common source of duplicate processing and cascading retry storms in production Lambda deployments.

3. **NEVER chain synchronous Lambda invocations more than two levels deep.** Lambda-invoking-Lambda synchronously multiplies costs (both functions bill for the full duration of the downstream call), creates nested timeout cascades, and makes error handling nearly impossible. Use Step Functions, SQS, or EventBridge for any coordination requiring more than two hops.

4. **ALWAYS implement idempotency before enabling async event sources.** SNS, EventBridge, SQS standard queues, and Kinesis all guarantee at-least-once delivery. Writing a Lambda function that can be safely invoked multiple times with the same input is a correctness requirement, not an optimization.

5. **NEVER set Lambda reserved concurrency to 0 on a production function without understanding that this disables the function entirely.** `reservedConcurrentExecutions: 0` is the API call to throttle a function to zero invocations. It is distinct from "no reservation" which allows the function to use the regional pool. Use 0 intentionally only as an emergency kill switch.

6. **ALWAYS use the claim-check pattern when event payloads may exceed 256 KB.** SQS standard message limit is 256 KB; SNS is 256 KB; EventBridge is 256 KB. Lambda async invocation payload limit is 256 KB. Store large payloads in S3 with a pre-signed URL or SSE-S3 key reference in the event. Do not attempt to compress oversized payloads as a workaround -- size limits apply to the raw message bytes.

7. **NEVER rely on Lambda execution environment reuse for guaranteed state.** The Lambda execution environment is reused opportunistically between warm invocations, but there is no guarantee of reuse between any two specific invocations. Store any state that must persist across invocations in DynamoDB, ElastiCache, or another external store. Caching database connections in the module initialization scope is safe and recommended -- but treat it as an optimization, not a correctness guarantee.

8. **ALWAYS use Step Functions for workflows that require human approval steps, timeouts exceeding 15 minutes, or coordination of more than three Lambda functions.** Step Functions Express Workflows cost $1.00 per 1M state transitions with a maximum duration of 5 minutes. Standard Workflows cost $0.025 per 1K state transitions with a maximum duration of 1 year. Use Express for high-frequency short-lived orchestration; use Standard for long-running business processes.

9. **NEVER deploy Lambda functions without explicitly setting `reservedConcurrentExecutions` for functions that protect a downstream resource with a connection limit.** RDS PostgreSQL has a connection limit of roughly `LEAST(DBInstanceClassMemory/9531392, 5000)`. A db.t3.medium has ~170 max connections. Unbounded Lambda concurrency can exhaust this in seconds during a traffic spike, causing cascading failures. Reserve Lambda concurrency to a value that keeps downstream connection usage below 80% of the limit.

10. **ALWAYS version and alias Lambda functions in production deployments.** Direct references to `$LATEST` in event source mappings, API Gateway integrations, and Step Functions state machines mean any deployment immediately affects all traffic. Use aliases (`prod`, `canary`) with weighted routing to enable canary deployments, instant rollback via alias pointer change, and stable ARN references in infrastructure configurations.

---

## Edge Cases

### Cold Start Amplification During Scale-Out Events

When a burst of traffic (marketing email, viral social media mention, scheduled report at business open) triggers simultaneous scale-out from zero, all new execution environments initialize concurrently. Each initialization includes: VPC ENI attachment (adds 1-10 seconds if Lambda is VPC-attached), runtime initialization (~50-200ms for Node.js/Python, ~500ms-2s for JVM), and handler initialization (module loading, SDK client instantiation, connection establishment).

**Handling:** Pre-warm with scheduled EventBridge rules that invoke the function every 5 minutes with a synthetic `{"source": "warmup"}` event that returns early without processing. For predictable bursts (daily batch jobs, scheduled reports), set provisioned concurrency to activate 10 minutes before the expected burst using Application Auto Scaling scheduled actions. For VPC-attached functions, evaluate whether VPC attachment is actually required -- many functions attached to VPCs for RDS access can use RDS Proxy over the public endpoint with IAM authentication, eliminating the ENI penalty entirely.

### Fan-Out Amplification and Downstream Throttling

A fan-out pattern that processes a single trigger by creating 1,000 SQS messages, each processed by a Lambda function, can create a concurrency spike of 1,000 simultaneous invocations. If those functions each call DynamoDB, the downstream throughput can hit provisioned capacity limits (or on-demand scaling lag), causing DynamoDB to return `ProvisionedThroughputExceededException` or throttle errors that get retried, further amplifying load.

**Handling:** Implement a token bucket or sliding window rate limiter at the fan-out coordinator using DynamoDB atomic counters or Redis INCR/DECR. Set Lambda reserved concurrency on the worker function to limit maximum simultaneous downstream pressure. Use SQS delay queues with a 0-5 second random jitter on message `DelaySeconds` to spread the invocation wave. Monitor DynamoDB consumed capacity units relative to provisioned/on-demand limits with 80% threshold alarms.

### Saga Pattern with Partial Failures Across External APIs

A distributed transaction involving three external API calls (e.g., charge payment, reserve inventory, send confirmation email) where the second step succeeds but the third fails requires compensating transactions. Lambda's lack of persistent state means the saga coordinator must externalize its progress.

**Handling:** Use Step Functions Standard Workflow as the saga orchestrator. Each step is an activity that calls the external API. Define compensating steps as explicit error handler states using `Catch` blocks -- if `SendEmailState` fails, the workflow transitions to `ReverseInventoryReservationState` then `RefundPaymentState`. Store the saga instance ID in DynamoDB at the start of the workflow to enable idempotent re-execution if the Step Functions execution itself fails. Never implement saga compensation logic inside a Lambda function's catch block -- the function may timeout before completing all compensation steps.

### Multi-Region Active-Active with Event Deduplication

In an active-active multi-region deployment where EventBridge Global Endpoints or Kinesis cross-region replication replicates events to a secondary region, the secondary region's Lambda functions may process the same event that the primary already processed. This is not a retry -- it is geographic replication -- so the SQS message ID will differ but the business event ID will be identical.

**Handling:** Use a business-level idempotency key (e.g., `orderId`, `transactionId`, `correlationId`) rather than the infrastructure-level message ID as the idempotency key. Store idempotency records in a globally replicated store (DynamoDB Global Tables with `GLOBAL_TABLES_V2` replication, or a globally accessible Redis cluster) so that a record processed in `us-east-1` prevents re-processing in `eu-west-1`. Set DynamoDB Global Tables conflict resolution to "last writer wins" for idempotency records but verify your business semantics are consistent with this.

### Lambda Function as Monolith vs. Nano-Function Decomposition

Teams sometimes package an entire Express.js application into a single Lambda function ("Lambda monolith" pattern using `@vendia/serverless-express` or equivalent). Other teams decompose to one function per API route ("nano-functions"). Both extremes have production problems: the monolith has a large deployment package (slower cold starts, harder to right-size memory), the nano-function approach has hundreds of IAM roles, CloudWatch Log groups, and deployment targets to manage.

**Handling:** Evaluate based on domain boundaries, not route count. A group of routes sharing a data store, shared middleware, and similar memory/timeout requirements should be co-located in one function. Routes with wildly different performance profiles (e.g., a 5ms health check vs. a 30-second PDF generation) should be separated so the PDF function's high memory allocation does not cost money for the health check invocations. A practical starting point: one Lambda per domain aggregate (orders, customers, inventory) with internal routing, then split individual endpoints out only when they have demonstrably different operational requirements.

### Kinesis Shard Iterator Poisoning

A malformed record in a Kinesis stream that consistently fails Lambda processing will block the shard iterator at that record's position indefinitely. Unlike SQS, Kinesis does not have a native DLQ -- the iterator does not advance past a failed record until the `bisectBatchOnFunctionError` option routes around it or the record expires (24-hour default, up to 7 days with extended retention).

**Handling:** Always enable `bisectBatchOnFunctionError: true` on the Kinesis event source mapping. This causes Lambda to split the failing batch in half and retry each half separately, isolating the bad record. Also configure `destinationConfig.onFailure` pointing to an SQS queue or SNS topic to capture failed records before they expire. Implement record-level schema validation at the Lambda handler entry point and emit a metric (`kinesis.record.schema_invalid`) rather than throwing an exception for schema errors -- let schema-invalid records succeed silently (log and metric) rather than block the shard.

### Lambda Behind API Gateway with Response Streaming

API Gateway has a 29-second integration timeout that cannot be increased. Lambda response streaming (introduced as a feature in 2023) allows Lambda to stream partial responses over HTTP, but this requires Lambda Function URLs or API Gateway HTTP APIs with payload format version 2.0. REST APIs do not support streaming.

**Handling:** For operations that may take longer than 29 seconds (LLM inference, report generation, batch data export), use an async pattern: the synchronous API call creates a job record in DynamoDB and returns a `202 Accepted` with a `jobId`. A separate Lambda function processes the job asynchronously (triggered by DynamoDB Streams or SQS). The client polls a `/jobs/{jobId}/status` endpoint or uses WebSockets via API Gateway WebSocket APIs (which support connections up to 2 hours) for push notification on completion.

---

## Example

**Input:** "We're building an order processing system for an e-commerce platform. When a customer places an order, we need to: validate payment via a third-party payment API, reserve inventory in our RDS PostgreSQL database, send a confirmation email via SendGrid, and publish an `order.created` event for downstream services like analytics and fulfillment. We're on AWS. We expect peak load of 500 orders/minute during Black Friday. How should we structure this?"

---

**Output:**

## Serverless Pattern Analysis

### Workload Classification
| Dimension            | Observed Value                    | Implication                                            |
|----------------------|-----------------------------------|--------------------------------------------------------|
| Trigger type         | HTTP (synchronous API call)       | Customer waits for response -- latency matters         |
| Execution duration   | p50: ~800ms, p99: ~3,000ms        | Well within Lambda 15min limit; 10s timeout sufficient |
| Concurrency profile  | Bursty (Black Friday: 500 req/min)| ~8-9 concurrent Lambda invocations at peak; manageable |
| Statefulness         | Durable (multi-step transaction)  | Saga pattern required for compensation logic           |
| Failure tolerance    | Non-idempotent (payment charge)   | Must prevent double-charge; saga with compensation     |
| Payload size         | < 10 KB per order                 | No claim-check required                                |

**Peak concurrency calculation:** 500 orders/minute = 8.3 orders/second. At p99 duration of 3 seconds, in-flight concurrency = 8.3 * 3 = ~25 concurrent Lambda invocations at Black Friday peak. Well within the 1,000 regional default. Reserve 50 to provide 2x buffer.

### Selected Pattern(s)
**Primary Pattern:** Saga Orchestration via Step Functions Standard Workflow
**Supporting Patterns:** Transactional Outbox (for `order.created` event), Idempotency Guard (for payment API call), Claim-Check (not needed -- payloads are small)

**Rationale:** Four sequential steps with external side effects (payment charge, inventory reservation, email send, event publish) require a durable coordinator that can execute compensation logic if any step fails after a previous step has already succeeded. Step Functions Standard Workflow provides visibility, retries per-state, and compensation via `Catch` blocks. The synchronous HTTP response can return after the payment validation step completes, with the remaining steps executed asynchronously -- this reduces the customer-perceived latency from ~3 seconds to ~500ms.

### Architecture Diagram (ASCII)
```
POST /orders
      |
      v
[API Gateway] --> [OrderEntry Lambda]
                       |
                       +--> [DynamoDB: Create order record, status=PENDING]
                       |
                       +--> [Step Functions: Start execution (async)]
                       |
                       +--> Return 202 Accepted {orderId, status: "processing"}
                             
[Step Functions Standard Workflow]
      |
      v
[ValidatePaymentState] --> [PaymentAPI Lambda] --> Stripe/Adyen API
      |
      | SUCCESS                              FAILURE
      v                                         |
[ReserveInventoryState] --> [InventoryLambda] --> RDS PostgreSQL
      |                                          |
      | SUCCESS                              FAILURE
      v                                         v
[SendConfirmationState] --> [EmailLambda] --> SendGrid   [CompensatePaymentState] --> Refund
      |
      v
[PublishOrderEventState] --> [EventBridge: order.created]
      |                                (fan-out to analytics, fulfillment)
      v
[UpdateOrderStatusState] --> [DynamoDB: status=CONFIRMED]


Compensation path (Step Functions Catch):
ReserveInventoryState FAIL --> CompensatePaymentState --> UpdateOrderStatus(FAILED)
SendConfirmationState FAIL --> (no compensation needed -- order is confirmed, email is retry-only)
```

### Implementation Template

#### Step Functions State Machine Definition (Amazon States Language)
```json
{
  "Comment": "Order processing saga",
  "StartAt": "ValidatePayment",
  "States": {
    "ValidatePayment": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:us-east-1:123456789:function:validate-payment",
      "ResultPath": "$.paymentResult",
      "Retry": [{
        "ErrorEquals": ["PaymentServiceUnavailable"],
        "IntervalSeconds": 2,
        "MaxAttempts": 3,
        "BackoffRate": 2.0
      }],
      "Catch": [{
        "ErrorEquals": ["PaymentDeclined", "PaymentFraudBlocked"],
        "Next": "MarkOrderFailed",
        "ResultPath": "$.error"
      }],
      "Next": "ReserveInventory"
    },
    "ReserveInventory": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:us-east-1:123456789:function:reserve-inventory",
      "ResultPath": "$.inventoryResult",
      "Retry": [{
        "ErrorEquals": ["States.TaskFailed"],
        "IntervalSeconds": 1,
        "MaxAttempts": 2,
        "BackoffRate": 1.5
      }],
      "Catch": [{
        "ErrorEquals": ["InsufficientInventory", "States.ALL"],
        "Next": "CompensatePayment",
        "ResultPath": "$.error"
      }],
      "Next": "SendConfirmationEmail"
    },
    "CompensatePayment": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:us-east-1:123456789:function:refund-payment",
      "Retry": [{
        "ErrorEquals": ["States.ALL"],
        "IntervalSeconds": 5,
        "MaxAttempts": 5,
        "BackoffRate": 2.0
      }],
      "Next": "MarkOrderFailed"
    },
    "SendConfirmationEmail": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:us-east-1:123456789:function:send-confirmation",
      "Catch": [{
        "ErrorEquals": ["States.ALL"],
        "Next": "PublishOrderEvent",
        "ResultPath": "$.emailError"
      }],
      "Next": "PublishOrderEvent"
    },
    "PublishOrderEvent": {
      "Type": "Task",
      "Resource": "arn:aws:states:::events:putEvents",
      "Parameters": {
        "Entries": [{
          "EventBusName": "orders-bus",
          "Source": "com.example.orders",
          "DetailType": "order.created",
          "Detail.$": "$.order"
        }]
      },
      "Next": "MarkOrderConfirmed"
    },
    "MarkOrderConfirmed": {
      "Type": "Task",
      "Resource": "arn:aws:states:::dynamodb:updateItem",
      "Parameters": {
        "TableName": "orders",
        "Key": { "orderId": { "S.$": "$.order.orderId" } },
        "UpdateExpression": "SET #s = :confirmed",
        "ExpressionAttributeNames": { "#s": "status" },
        "ExpressionAttributeValues": { ":confirmed": { "S": "CONFIRMED" } }
      },
      "End": true
    },
    "MarkOrderFailed": {
      "Type": "Task",
      "Resource": "arn:aws:states:::dynamodb:updateItem",
      "Parameters": {
        "TableName": "orders",
        "Key": { "orderId": { "S.$": "$.order.orderId" } },
        "UpdateExpression": "SET #s = :failed",
        "ExpressionAttributeNames": { "#s": "status" },
        "ExpressionAttributeValues": { ":failed": { "S": "FAILED" } }
      },
      "End": true
    }
  }
}
```

#### OrderEntry Lambda Handler (TypeScript)
```typescript
import { APIGatewayProxyHandler } from 'aws-lambda';
import { SFNClient, StartExecutionCommand } from '@aws-sdk/client-sfn';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { v4 as uuidv4 } from 'uuid';

const sfn = new SFNClient({ region: process.env.AWS_REGION });
const dynamo = new DynamoDBClient({ region: process.env.AWS_REGION });

export const handler: APIGatewayProxyHandler = async (event) => {
  const idempotencyKey = event.headers['x-idempotency-key'];
  if (!idempotencyKey) {
    return { statusCode: 400, body: JSON.stringify({ error: 'x-idempotency-key header required' }) };
  }

  const orderId = uuidv4();
  const order = { orderId, ...JSON.parse(event.body!), createdAt: new Date().toISOString() };

  // Create order record atomically -- conditional write prevents duplicate processing
  try {
    await dynamo.send(new PutItemCommand({
      TableName: process.env.ORDERS_TABLE!,
      Item: {
        pk: { S: orderId },
        idempotencyKey: { S: idempotencyKey },
        status: { S: 'PENDING' },
        order: { S: JSON.stringify(order) },
        ttl: { N: String(Math.floor(Date.now() / 1000) + 90 * 24 * 60 * 60) },
      },
      ConditionExpression: 'attribute_not_exists(idempotencyKey)',
    }));
  } catch (err: any) {
    if (err.name === 'ConditionalCheckFailedException') {
      // Idempotent -- return existing order
      return { statusCode: 200, body: JSON.stringify({ orderId, status: 'already_submitted' }) };
    }
    throw err;
  }

  await sfn.send(new StartExecutionCommand({
    stateMachineArn: process.env.ORDER_STATE_MACHINE_ARN!,
    name: `order-${orderId}`,   // Unique name prevents duplicate SF executions
    input: JSON.stringify({ order }),
  }));

  return {
    statusCode: 202,
    body: JSON.stringify({ orderId, status: 'processing' }),
  };
};
```

### Configuration Reference
| Parameter                           | Value          | Reasoning                                                    |
|-------------------------------------|----------------|--------------------------------------------------------------|
| OrderEntry Lambda timeout           | 10s            | DynamoDB + SFN start call; 10s is generous                   |
| OrderEntry Lambda memory            | 256 MB         | No CPU-intensive work; I/O bound                             |
| OrderEntry reserved concurrency     | 50             | 2x Black Friday peak; protects DynamoDB on-demand scaling lag|
| ValidatePayment Lambda timeout      | 8s             | Stripe/Adyen p99 < 3s; 8s gives 2.5x headroom               |
| ReserveInventory Lambda timeout     | 15s            | RDS query + Lambda + 5s buffer; set RDS Proxy keepalive < 15s|
| Step Functions type                 | Standard       | Long-running potential (retries); audit trail required       |
| SFN execution name format           | `order-{uuid}` | Unique name prevents duplicate SF executions on API retry    |
| EventBridge bus                     | Custom bus     | Isolates order events from default bus; dedicated IAM policy |
| DynamoDB orders table billing       | On-demand      | Bursty Black Friday traffic; no capacity planning required   |
| RDS reserved concurrency (Inventory)| 20             | RDS Proxy max connections / safety factor                    |

### Cost Estimate (Monthly, Normal Operations)
| Metric                              | Value                     |
|-------------------------------------|---------------------------|
| Est. daily orders (non-peak)        | 50,000 orders/day         |
| Step Functions state transitions    | ~8 per order * 1.5M = 12M |
| SFN Standard cost                   | ~$0.30 (12M * $0.025/1K)  |
| Lambda invocations (5 per order)    | 7.5M invocations          |
| Lambda compute (avg 500ms @ 256MB)  | ~$3.13/month              |
| DynamoDB on-demand reads/writes     | ~$4.50/month              |
| EventBridge events                  | ~$0.15/month              |
| **Total monthly est. (non-peak)**   | **~$8.08/month**          |
| **Black Friday week (10x volume)**  | **~$20 additional**       |

### ADR Summary
**Context:** E-commerce order placement requires four sequential steps with external side effects, peak load of 500 orders/minute, and zero tolerance for double-charges.

**Decision:** Step Functions Standard Workflow as saga orchestrator with synchronous API returning 202 after order record creation; customer experience decoupled from backend processing duration.

**Alternatives Rejected:** (1) Synchronous chained Lambda -- 29-second API Gateway timeout insufficient for retry scenarios; no compensation capability; (2) Choreography via EventBridge -- correlation of compensation events across saga steps is significantly more complex to implement correctly and observe in production.

**Review Trigger:** Revisit if monthly order volume exceeds 10M (Step Functions Standard costs grow linearly; evaluate Express Workflows for the short-duration happy path and Standard only for compensation branches) or if order processing p99 exceeds 5 seconds under normal load.
