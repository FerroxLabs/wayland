---
name: serverless-architect
description: |
  Expert guide for designing serverless applications using Lambda, Cloud Functions, and edge functions. Covers cold start optimization, event-driven patterns, infrastructure configuration, cost management, and production-ready serverless architectures.
  Use when the user asks about serverless architect, serverless architect best practices, or needs guidance on serverless architect implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "backend api-design cloud"
  category: "backend-systems"
  subcategory: "server-infrastructure"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---

# Serverless Architect

You are an expert in designing and building serverless applications. You guide teams through function design, event-driven architectures, cold start optimization, deployment strategies, and operational best practices across AWS Lambda, Google Cloud Functions, and edge computing platforms.

## Core Principles

1. **Functions are glue** - Each function connects events to actions. Keep them small and focused.
2. **Design for failure** - Every invocation can fail. Build idempotency, retries, and dead letter queues from day one.
3. **Minimize cold starts** - Architecture, runtime, and dependency choices all affect startup latency.

## Function Design

### Single-Responsibility Handler

```typescript
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { createOrder } from './services/orderService';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const input = JSON.parse(event.body || '{}');
    const order = await createOrder(input);
    return { statusCode: 201, body: JSON.stringify(order) };
  } catch (err) {
    console.error('Unhandled error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};
```

### Connection Reuse (Module-Level Init)

```typescript
// Connections initialized OUTSIDE the handler persist across warm invocations
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event: any) => {
  const result = await docClient.send(/* ... */);  // Reuses warm connection
  return result;
};
```

## Cold Start Optimization

```
FACTOR              IMPACT     MITIGATION
----------------------------------------------------------------------
Runtime choice      HIGH       Node.js/Python: ~200ms | Java/C#: ~1-3s
Package size        HIGH       Bundle with esbuild, tree-shake, <5MB ideal
VPC attachment      HIGH       Use VPC endpoints instead of NAT Gateway
Memory allocation   MEDIUM     More memory = more CPU = faster init (512MB-1GB)
Provisioned conc.   REMOVES    Pre-warm N instances (costs money)
Init code           MEDIUM     Lazy-load SDK clients, defer DB connections
```

### Bundle Optimization

```typescript
// esbuild config
await build({
  entryPoints: ['src/handlers/*.ts'],
  bundle: true, minify: true,
  platform: 'node', target: 'node20',
  external: ['@aws-sdk/*'],        // Available in Lambda runtime
  treeShaking: true,
  sourcemap: true,
});
```

## Event-Driven Patterns

### Event Source Behavior

```
EVENT SOURCE          INVOCATION    RETRY BEHAVIOR
----------------------------------------------------------------------
API Gateway           Synchronous   Client retries
SQS                   Polling       Auto-retry with visibility timeout
SNS                   Asynchronous  3 retries, then DLQ
DynamoDB Streams      Polling       Retry until success or expiry
S3 Events             Asynchronous  3 retries, then DLQ
EventBridge           Asynchronous  Configurable retry policy
Kinesis               Polling       Retry until success or expiry
```

### Fan-Out Pattern (SNS + SQS)

```
API Gateway -> Lambda (validate) -> SNS Topic
                                      |
                    +-----------------+-----------------+
                    |                 |                 |
                SQS Queue        SQS Queue        SQS Queue
                    |                 |                 |
              Lambda (email)   Lambda (analytics) Lambda (inventory)
                    |                 |                 |
                DLQ (email)    DLQ (analytics)    DLQ (inventory)
```

### Step Functions (Orchestration)

```json
{
  "StartAt": "ValidateOrder",
  "States": {
    "ValidateOrder": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:us-east-1:123456:function:validate",
      "Next": "ProcessPayment",
      "Retry": [{"ErrorEquals": ["TransientError"], "MaxAttempts": 3, "BackoffRate": 2.0}],
      "Catch": [{"ErrorEquals": ["ValidationError"], "Next": "RejectOrder"}]
    },
    "ProcessPayment": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:us-east-1:123456:function:pay",
      "TimeoutSeconds": 30,
      "End": true
    },
    "RejectOrder": { "Type": "Task", "Resource": "arn:aws:lambda:...", "End": true }
  }
}
```

## Edge Functions

### Cloudflare Workers

```typescript
export default {
  async get(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) return handleApi(request, env);

    const cache = caches.default;
    let response = await cache.match(request);
    if (!response) {
      response = await get(request);
      response = new Response(response.body, response);
      response.headers.set('Cache-Control', 'public, max-age=300');
      await cache.put(request, response.clone());
    }
    return response;
  },
};
```

### Edge vs Origin Decision

```
USE EDGE FOR:  A/B testing, auth validation, geo-routing, rate limiting, redirects
USE ORIGIN FOR: Database ops, complex business logic, long-running tasks (>30s)
```

## Idempotency

```typescript
export async function withIdempotency<T>(
  key: string, ttl: number, operation: () => Promise<T>,
): Promise<T> {
  const existing = await db.get({ TableName: IDEMPOTENCY_TABLE, Key: { pk: key } });
  if (existing.Item?.status === 'COMPLETED') return existing.Item.result as T;

  await db.put({
    TableName: IDEMPOTENCY_TABLE,
    Item: { pk: key, status: 'IN_PROGRESS', ttl: now() + ttl },
    ConditionExpression: 'attribute_not_exists(pk) OR #s = :failed',
    ExpressionAttributeNames: { '#s': 'status' },
    ExpressionAttributeValues: { ':failed': 'FAILED' },
  });

  try {
    const result = await operation();
    await db.put({ TableName: IDEMPOTENCY_TABLE, Item: { pk: key, status: 'COMPLETED', result, ttl: now() + ttl } });
    return result;
  } catch (err) {
    await db.put({ TableName: IDEMPOTENCY_TABLE, Item: { pk: key, status: 'FAILED', ttl: now() + 300 } });
    throw err;
  }
}
```

## Infrastructure as Code (SAM)

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31

Globals:
  Function:
    Runtime: nodejs20.x
    MemorySize: 512
    Timeout: 30
    Tracing: Active
    Architectures: [arm64]         # Graviton: 20% cheaper

Resources:
  ApiGateway:
    Type: AWS::Serverless::HttpApi
    Properties:
      StageName: !Ref Stage

  CreateOrderFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: dist/
      Handler: createOrder.handler
      Events:
        Api:
          Type: HttpApi
          Properties:
            ApiId: !Ref ApiGateway
            Path: /orders
            Method: POST
      Policies:
        - DynamoDBCrudPolicy:
            TableName: !Ref OrdersTable

  OrdersTable:
    Type: AWS::DynamoDB::Table
    Properties:
      BillingMode: PAY_PER_REQUEST
      KeySchema:
        - { AttributeName: pk, KeyType: HASH }
        - { AttributeName: sk, KeyType: RANGE }
```

## Monitoring

### Structured Logging with Powertools

```typescript
import { Logger } from '@aws-lambda-powertools/logger';
import { Metrics, MetricUnit } from '@aws-lambda-powertools/metrics';

const logger = new Logger({ serviceName: 'order-service' });
const metrics = new Metrics({ namespace: 'OrderService' });

export const handler = async (event: any) => {
  logger.info('Processing order', { orderId: event.orderId });
  try {
    const result = await processOrder(event);
    metrics.addMetric('OrderProcessed', MetricUnit.Count, 1);
    return result;
  } catch (err) {
    logger.error('Failed', { error: err });
    metrics.addMetric('OrderFailed', MetricUnit.Count, 1);
    throw err;
  } finally {
    metrics.publishStoredMetrics();
  }
};
```

### Key Metrics

```
METRIC                        ALARM THRESHOLD
---------------------------------------------------
Duration (p99)                > 80% of timeout
Error rate                    > 1% of invocations
Throttles                     > 0 sustained
DLQ message count             > 0
Iterator age (streams)        > 1 minute
Concurrent executions         > 80% of limit
```

## Cost Optimization

```
STRATEGY                      SAVINGS
----------------------------------------------
ARM64 (Graviton)              20% cheaper per ms
Right-size memory             Benchmark with power-tuning tool
Minimize execution time       SDK v3 modular imports
Batch processing (SQS)        Fewer invocations
Step Functions Express         90% cheaper for short workflows
Cache in /tmp                 Reduce downstream calls
```

## Production Checklist

```
ARCHITECTURE:
  [ ] Functions are single-purpose
  [ ] Idempotency for all non-read operations
  [ ] DLQs on all async event sources
  [ ] Step Functions for multi-step workflows
  [ ] Timeouts < API Gateway 29s limit

PERFORMANCE:
  [ ] Bundle minimized (esbuild, tree-shaking, exclude SDK)
  [ ] ARM64 selected
  [ ] Memory right-sized
  [ ] Connections reused outside handler

SECURITY:
  [ ] Least-privilege IAM per function
  [ ] Secrets in Parameter Store / Secrets Manager
  [ ] API Gateway authorization configured

OBSERVABILITY:
  [ ] Structured logging with correlation IDs
  [ ] Distributed tracing enabled
  [ ] Alarms on error rate, duration p99, throttles
  [ ] DLQ monitoring with alerting
```

## When to Use

**Use this skill when:**
- Designing or implementing serverless architect solutions
- Reviewing or improving existing serverless architect approaches
- Making architectural or implementation decisions about serverless architect
- Learning serverless architect patterns and best practices
- Troubleshooting serverless architect-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Serverless Architect Analysis

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

**Input:** "Help me implement serverless architect for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended serverless architect approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When serverless architect must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
