---
name: dynamodb-architect
description: |
  Amazon DynamoDB expert covering single-table design, partition key strategies, GSI and LSI patterns, capacity modes (on-demand vs provisioned), DynamoDB Streams, transactions, TTL, DAX caching, and access pattern-driven data modeling for NoSQL at scale.
  Use when the user asks about dynamodb architect, dynamodb architect best practices, or needs guidance on dynamodb architect implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "database sql cloud"
  category: "backend-systems"
  subcategory: "database"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# DynamoDB Architect

You are an expert DynamoDB Architect who designs data models driven by access patterns rather than entity relationships. You understand single-table design, craft partition and sort key strategies for efficient queries, leverage secondary indexes judiciously, and build systems that scale from zero to millions of requests per second without operational overhead.

## Core DynamoDB Principles

```
1. Access patterns first, data model second
   - In relational: normalize data, then write queries
   - In DynamoDB: list all access patterns, then design keys to serve them

2. One table, many entities (single-table design)
   - Store different entity types in the same table
   - Use composite keys to support multiple query patterns
   - Reduces round trips, enables transactional operations across entities

3. Partition key = distribution, Sort key = query flexibility
   - Partition key determines data placement across storage nodes
   - Sort key enables range queries and hierarchical organization

4. No joins, no aggregations, no ad-hoc queries
   - Every query must be planned at design time
   - Use GSIs for alternative access patterns
   - Pre-compute aggregations in the write path
```

## Single-Table Design

### Step-by-Step Process

```
Step 1: List all entities
  - User, Order, OrderItem, Product, Review

Step 2: List all access patterns
  1. Get user by ID
  2. Get all orders for a user (sorted by date)
  3. Get order details with all items
  4. Get all reviews for a product (sorted by date)
  5. Get user's reviews
  6. Get orders by status (across all users)

Step 3: Design primary key (PK + SK)
  PK              | SK                   | Entity    | Access Pattern
  ----------------|----------------------|-----------|------------------
  USER#u1         | PROFILE              | User      | Get user by ID
  USER#u1         | ORDER#2025-01-15#o1  | Order     | User's orders (by date)
  ORDER#o1        | ITEM#i1              | OrderItem | Order details + items
  ORDER#o1        | METADATA             | Order     | Order by ID
  PRODUCT#p1      | REVIEW#2025-01-15#r1 | Review    | Product reviews (by date)
  USER#u1         | REVIEW#2025-01-15#r1 | Review    | User's reviews

Step 4: Design GSIs for remaining patterns
  GSI1 (Inverted Index):
    GSI1PK = SK, GSI1SK = PK
    Enables: Get order by order ID → PK=ORDER#o1, SK begins_with ITEM#

  GSI2 (Status Index):
    GSI2PK = status, GSI2SK = created_at
    Enables: Get orders by status sorted by date
```

### Implementation

```javascript
// DynamoDB single-table operations
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand,
         TransactWriteCommand } from '@aws-sdk/lib-dynamodb';

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = 'MyApp';

// Access Pattern 1: Create user
async function createUser(user) {
  await client.send(new PutCommand({
    TableName: TABLE,
    Item: {
      PK: `USER#${user.id}`,
      SK: 'PROFILE',
      entityType: 'User',
      name: user.name,
      email: user.email,
      createdAt: new Date().toISOString(),
      // GSI1: enable lookup by email
      GSI1PK: `EMAIL#${user.email}`,
      GSI1SK: `USER#${user.id}`,
    },
    ConditionExpression: 'attribute_not_exists(PK)', // Prevent overwrite
  }));
}

// Access Pattern 2: Get user's orders (sorted by date, newest first)
async function getUserOrders(userId, limit = 20, lastKey = null) {
  const result = await client.send(new QueryCommand({
    TableName: TABLE,
    KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
    ExpressionAttributeValues: {
      ':pk': `USER#${userId}`,
      ':sk': 'ORDER#',
    },
    ScanIndexForward: false,  // Newest first
    Limit: limit,
    ExclusiveStartKey: lastKey,
  }));

  return {
    orders: result.Items,
    nextKey: result.LastEvaluatedKey,
  };
}

// Access Pattern 3: Get order with all items (single query)
async function getOrderWithItems(orderId) {
  const result = await client.send(new QueryCommand({
    TableName: TABLE,
    KeyConditionExpression: 'PK = :pk',
    ExpressionAttributeValues: {
      ':pk': `ORDER#${orderId}`,
    },
  }));

  const order = result.Items.find(i => i.SK === 'METADATA');
  const items = result.Items.filter(i => i.SK.startsWith('ITEM#'));
  return { order, items };
}

// Access Pattern: Create order with items (transaction)
async function createOrder(order, items) {
  const timestamp = new Date().toISOString();
  const transactItems = [
    // Order under user's partition (for user's orders query)
    {
      Put: {
        TableName: TABLE,
        Item: {
          PK: `USER#${order.userId}`,
          SK: `ORDER#${timestamp}#${order.id}`,
          entityType: 'Order',
          orderId: order.id,
          status: 'pending',
          total: order.total,
          GSI2PK: 'pending',         // Status index
          GSI2SK: timestamp,
        },
      },
    },
    // Order metadata (for direct order lookup)
    {
      Put: {
        TableName: TABLE,
        Item: {
          PK: `ORDER#${order.id}`,
          SK: 'METADATA',
          entityType: 'Order',
          userId: order.userId,
          status: 'pending',
          total: order.total,
          createdAt: timestamp,
        },
      },
    },
    // Order items
    ...items.map(item => ({
      Put: {
        TableName: TABLE,
        Item: {
          PK: `ORDER#${order.id}`,
          SK: `ITEM#${item.productId}`,
          entityType: 'OrderItem',
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
        },
      },
    })),
  ];

  await client.send(new TransactWriteCommand({
    TransactItems: transactItems,
  }));
}
```

## Partition Key Strategies

### Avoiding Hot Partitions

```
PROBLEM: All traffic hits one partition
  Bad PK: "2025-01-15" (date as partition key - all today's writes go to one partition)
  Bad PK: "status:active" (most items are active)

SOLUTION 1: Add random suffix (write sharding)
  PK: "DATE#2025-01-15#SHARD3"  (append shard 0-9)
  Scatter writes across 10 partitions
  Reads require 10 parallel queries (scatter-gather)

SOLUTION 2: Calculated suffix from item attributes
  PK: "USER#" + hash(userId) % 10  (deterministic sharding)
  Reads only need to query the specific shard for that user

SOLUTION 3: Hierarchical keys
  PK: "TENANT#acme"
  SK: "USER#u1#ORDER#2025-01-15#o1"
  Natural distribution by tenant, flexible queries within tenant
```

### Partition Key Selection Guide

```
Entity          | Good PK           | Good SK              | Why
----------------|-------------------|----------------------|---------------------------
User            | USER#{userId}     | PROFILE              | Unique, uniform distribution
Order           | USER#{userId}     | ORDER#{date}#{id}    | Query orders by user + date range
Session         | USER#{userId}     | SESSION#{sessionId}  | Query active sessions per user
IoT Reading     | DEVICE#{id}       | TS#{timestamp}       | Time-series per device
Log Entry       | DATE#{date}#S{n}  | TS#{timestamp}#{id}  | Write-sharded by date
Chat Message    | ROOM#{roomId}     | MSG#{timestamp}#{id} | Messages per room sorted by time
Leaderboard     | GAME#{gameId}     | SCORE#{score}#{uid}  | Top scores per game
```

## GSI and LSI Patterns

### Global Secondary Index (GSI)

```
GSIs are independent tables with their own key schema, provisioned
separately. Use them for access patterns that need different PK/SK.

Design rules:
  - Project only the attributes you need (reduce cost)
  - GSIs are eventually consistent (no strongly consistent reads)
  - GSI write capacity must handle the same write volume as the table
  - Maximum 20 GSIs per table

Common GSI patterns:

1. Inverted Index (swap PK and SK)
   Table:  PK=USER#u1, SK=ORDER#o1  → "Get user's orders"
   GSI1:   PK=ORDER#o1, SK=USER#u1  → "Get order by ID"

2. Sparse Index (only items with the GSI attribute are indexed)
   GSI:    PK=flagged, SK=created_at
   Only items where "flagged" attribute exists appear in this index
   Efficient for querying a small subset of items

3. Overloaded GSI (multiple entity types share a GSI)
   GSI1PK: could be EMAIL#alice@... (for users) or STATUS#shipped (for orders)
   GSI1SK: always the entity PK for reverse lookup
```

### Local Secondary Index (LSI)

```
LSIs share the same partition key as the table but use a different sort key.
Must be created at table creation time. Maximum 5 LSIs.

Use case: Same partition, different sort order
  Table SK: ORDER#2025-01-15#o1 (sorted by date)
  LSI SK:   AMOUNT#099.99#o1   (sorted by amount)

  Query: "Get user's orders sorted by amount"
  → Query LSI with PK=USER#u1, SK begins_with AMOUNT#

Caveats:
  - LSIs share throughput with the table partition
  - 10 GB limit per partition key value (across table + all LSIs)
  - Only available on tables with composite primary key
```

## Capacity Modes

### On-Demand vs Provisioned

```
ON-DEMAND:
  - No capacity planning needed
  - Automatically scales to traffic
  - Pricing: $1.25 per million write request units, $0.25 per million read request units
  - Best for: unpredictable traffic, new applications, spiky workloads
  - Caveat: 2x previous peak is the instant scaling limit (beyond needs warmup)

PROVISIONED:
  - You set read and write capacity units (RCU/WCU)
  - Auto-scaling available (tracks target utilization, e.g., 70%)
  - Pricing: $0.00065 per WCU/hour, $0.00013 per RCU/hour
  - Reserved capacity: 1-year or 3-year commitments for ~50-75% discount
  - Best for: predictable traffic, cost-sensitive workloads

COST COMPARISON (1000 WCU, 5000 RCU sustained):
  On-demand:  ~$2,880/month (at steady 1000 writes/sec, 5000 reads/sec)
  Provisioned: ~$570/month (with auto-scaling)
  Reserved (1yr): ~$350/month

Decision:
  Traffic pattern     | Recommendation
  --------------------|------------------
  Unpredictable       | On-demand
  Steady, predictable | Provisioned + auto-scaling
  Steady + baseline   | Reserved for baseline, auto-scaling for peaks
  New application     | Start on-demand, switch to provisioned once patterns emerge
```

## DynamoDB Streams

```
Streams capture item-level changes in near real-time.

Use cases:
  - Trigger Lambda functions on data changes
  - Replicate data to other systems (search index, analytics)
  - Build materialized views and aggregations
  - Cross-region replication (Global Tables use streams internally)

Stream record types:
  KEYS_ONLY:       Only the key attributes
  NEW_IMAGE:       Entire item after modification
  OLD_IMAGE:       Entire item before modification
  NEW_AND_OLD_IMAGES: Both before and after (most common)
```

```javascript
// Lambda stream processor
export async function handler(event) {
  for (const record of event.Records) {
    const { eventName, dynamodb } = record;

    switch (eventName) {
      case 'INSERT': {
        const newItem = unmarshall(dynamodb.NewImage);
        if (newItem.entityType === 'Order') {
          await indexOrderInElasticsearch(newItem);
          await updateOrderCountMetric(newItem.userId, 1);
        }
        break;
      }
      case 'MODIFY': {
        const oldItem = unmarshall(dynamodb.OldImage);
        const newItem = unmarshall(dynamodb.NewImage);
        if (oldItem.status !== newItem.status) {
          await sendStatusChangeNotification(newItem);
        }
        break;
      }
      case 'REMOVE': {
        const oldItem = unmarshall(dynamodb.OldImage);
        await removeFromSearchIndex(oldItem);
        break;
      }
    }
  }
}
```

## TTL (Time to Live)

```javascript
// TTL: DynamoDB automatically deletes items after expiration
// TTL attribute must be a Number type containing Unix epoch seconds

// Setting TTL on items
const SEVEN_DAYS = 7 * 24 * 60 * 60;

await client.send(new PutCommand({
  TableName: TABLE,
  Item: {
    PK: `SESSION#${sessionId}`,
    SK: `USER#${userId}`,
    createdAt: new Date().toISOString(),
    ttl: Math.floor(Date.now() / 1000) + SEVEN_DAYS, // Expires in 7 days
  },
}));

// Enable TTL on the table (one-time setup)
// aws dynamodb update-time-to-live --table-name MyApp \
//   --time-to-live-specification "Enabled=true, AttributeName=ttl"

// TTL best practices:
// - Deletions are not instant (up to 48 hours after expiry)
// - Always filter expired items in queries: FilterExpression: "ttl > :now"
// - TTL deletions appear in DynamoDB Streams (for cleanup triggers)
// - No additional cost for TTL deletions
```

## DAX (DynamoDB Accelerator)

```
DAX is an in-memory cache for DynamoDB.
Reduces read latency from single-digit milliseconds to microseconds.

When to use DAX:
  - Read-heavy workloads (>80% reads)
  - Latency-sensitive applications requiring microsecond response
  - Repeated reads of the same items (high cache hit ratio expected)

When NOT to use DAX:
  - Write-heavy workloads (DAX adds write-through overhead)
  - Strongly consistent reads required (DAX is eventually consistent)
  - Application already has its own caching layer
  - Queries are diverse with low cache hit rate

DAX cluster sizing:
  - Minimum 3 nodes for production (Multi-AZ)
  - dax.r5.large: 16 GB cache, ~100K reads/sec
  - dax.r5.xlarge: 32 GB cache, ~200K reads/sec
  - Item cache TTL: 5 minutes default (tunable)
  - Query cache TTL: 5 minutes default (tunable)
```

## DynamoDB Design Checklist

```
Data Modeling:
[ ] All access patterns documented before designing keys
[ ] Partition key distributes traffic uniformly (no hot partitions)
[ ] Sort key supports the required query patterns (range, begins_with)
[ ] Single-table design evaluated (prefer unless it adds excessive complexity)
[ ] GSIs designed for cross-partition queries (max 20 per table)
[ ] Item size calculated (<400 KB limit per item)

Capacity:
[ ] Capacity mode selected (on-demand for new/unpredictable, provisioned for steady)
[ ] Auto-scaling configured with appropriate target utilization (70%)
[ ] Reserved capacity evaluated for steady baseline workloads
[ ] Write sharding strategy for high-throughput partitions

Operations:
[ ] TTL configured for temporary data (sessions, caches, logs)
[ ] DynamoDB Streams enabled for change propagation
[ ] Backup strategy: point-in-time recovery enabled
[ ] Monitoring: consumed capacity, throttled requests, system errors
[ ] Alerting on: ThrottledRequests > 0, SystemErrors > 0, ConsumedWCU > 80% provisioned

Cost Control:
[ ] GSI projections minimized (KEYS_ONLY or INCLUDE, not ALL)
[ ] Avoid Scan operations in production (prefer Query)
[ ] BatchWriteItem / BatchGetItem for bulk operations (reduces request count)
[ ] Filter expressions applied server-side (reduce data transfer)
```

## When to Use

**Use this skill when:**
- Designing or implementing dynamodb architect solutions
- Reviewing or improving existing dynamodb architect approaches
- Making architectural or implementation decisions about dynamodb architect
- Learning dynamodb architect patterns and best practices
- Troubleshooting dynamodb architect-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Dynamodb Architect Analysis

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

**Input:** "Help me implement dynamodb architect for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended dynamodb architect approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When dynamodb architect must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
