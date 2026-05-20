---
name: mongodb-architect
description: |
  MongoDB architecture and design mastery covering document schema design, advanced indexing strategies, aggregation pipeline patterns, sharding architecture, replica sets, multi-document transactions, change streams, Atlas cloud features, performance profiling, schema validation, and embedding vs referencing trade-offs.
  Use when the user asks about mongodb architect, mongodb architect best practices, or needs guidance on mongodb architect implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "database sql backend"
  category: "backend-systems"
  subcategory: "database"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# MongoDB Architect

## Core Philosophy

MongoDB schema design is application-driven, not data-driven. Design your documents around your access patterns, not around entity relationships. The cardinal rule: data that is accessed together should be stored together. Every schema decision is a trade-off between read performance, write performance, data consistency, and storage efficiency.

## Document Schema Design Patterns

### Pattern 1: Embedding (Denormalization)

Embed related data directly within a document when:
- The embedded data has a 1:1 or 1:few relationship
- The embedded data is always retrieved with the parent
- The embedded data does not grow unboundedly

```javascript
// Good: Address embedded in user (1:few, always accessed together)
{
  _id: ObjectId("..."),
  name: "Jane Smith",
  email: "jane@example.com",
  addresses: [
    { type: "home", street: "123 Main St", city: "Portland", state: "OR", zip: "97201" },
    { type: "work", street: "456 Oak Ave", city: "Portland", state: "OR", zip: "97204" }
  ]
}
```

### Pattern 2: Referencing (Normalization)

Reference separate documents when:
- The related data has a 1:many or many:many relationship
- The related data is large or grows unboundedly
- The related data is frequently updated independently

```javascript
// Orders reference users by _id
{
  _id: ObjectId("..."),
  user_id: ObjectId("user_abc"),  // reference
  items: [
    { product_id: ObjectId("prod_1"), quantity: 2, price: 29.99 },
    { product_id: ObjectId("prod_2"), quantity: 1, price: 49.99 }
  ],
  total: 109.97,
  created_at: ISODate("2025-03-15T10:30:00Z")
}
```

### Pattern 3: Bucket Pattern (Time-Series Optimization)

Group related time-series documents into buckets to reduce document count and index size.

```javascript
// Instead of one document per measurement, bucket by hour
{
  sensor_id: "temp-sensor-42",
  bucket_start: ISODate("2025-03-15T14:00:00Z"),
  bucket_end: ISODate("2025-03-15T14:59:59Z"),
  count: 60,
  measurements: [
    { ts: ISODate("2025-03-15T14:00:00Z"), value: 22.5 },
    { ts: ISODate("2025-03-15T14:01:00Z"), value: 22.6 },
    // ... up to 60 per bucket
  ],
  summary: { min: 22.1, max: 23.4, avg: 22.7 }
}
```

### Pattern 4: Computed Pattern

Pre-compute frequently accessed aggregations to avoid repeated calculations.

```javascript
// Product document with pre-computed review statistics
{
  _id: ObjectId("..."),
  name: "Wireless Mouse",
  review_stats: {
    count: 1247,
    average: 4.3,
    distribution: { 1: 42, 2: 67, 3: 134, 4: 389, 5: 615 }
  }
}

// Update on each new review (atomic operation)
db.products.updateOne(
  { _id: productId },
  {
    $inc: { "review_stats.count": 1, [`review_stats.distribution.${rating}`]: 1 },
    $set: { "review_stats.average": newAverage }
  }
);
```

### Pattern 5: Outlier Pattern

Handle documents with outlier characteristics differently.

```javascript
// Most books have < 20 reviews, but some have thousands
// Normal document:
{ _id: "book1", title: "Normal Book", reviews: [ /* 15 reviews */ ], has_overflow: false }

// Outlier document with overflow:
{ _id: "book2", title: "Popular Book", reviews: [ /* first 100 */ ], has_overflow: true }
{ _id: "book2_overflow_1", parent_id: "book2", reviews: [ /* next 100 */ ] }
```

### Embedding vs Referencing Decision Tree

```
Will the related data grow unboundedly?
  YES -> Reference
  NO -> Is the related data > 16MB (document size limit)?
    YES -> Reference
    NO -> Is the related data updated independently and frequently?
      YES -> Reference (to avoid rewriting entire parent)
      NO -> Is the related data always accessed with the parent?
        YES -> Embed
        NO -> Consider both; benchmark with real queries
```

## Indexing Strategies

### Index Types

```javascript
// Single field index
db.users.createIndex({ email: 1 }, { unique: true });

// Compound index (order matters for query coverage)
db.orders.createIndex({ customer_id: 1, created_at: -1 });

// Multikey index (arrays)
db.articles.createIndex({ tags: 1 });

// Text index (full-text search)
db.articles.createIndex({ title: "text", body: "text" },
  { weights: { title: 10, body: 1 } });

// Wildcard index (dynamic schema fields)
db.products.createIndex({ "attributes.$**": 1 });

// Geospatial index
db.stores.createIndex({ location: "2dsphere" });

// Hashed index (for hash-based sharding)
db.users.createIndex({ user_id: "hashed" });

// Partial index (index subset of documents)
db.orders.createIndex(
  { status: 1, created_at: -1 },
  { partialFilterExpression: { status: { $in: ["pending", "processing"] } } }
);

// TTL index (auto-expire documents)
db.sessions.createIndex({ expires_at: 1 }, { expireAfterSeconds: 0 });
```

### ESR Rule for Compound Indexes

Order compound index fields by: **Equality, Sort, Range**

```javascript
// Query: find active orders for a customer, sorted by date, in a price range
db.orders.find({
  customer_id: "cust_123",    // Equality
  total: { $gte: 50, $lte: 500 }  // Range
}).sort({ created_at: -1 });   // Sort

// Optimal index: Equality, Sort, Range
db.orders.createIndex({ customer_id: 1, created_at: -1, total: 1 });
```

### Index Analysis

```javascript
// Check index usage
db.orders.aggregate([
  { $indexStats: {} }
]);

// Explain query plan
db.orders.find({ customer_id: "cust_123" })
  .sort({ created_at: -1 })
  .explain("executionStats");

// Key metrics to check in explain:
// - winningPlan.stage should be IXSCAN (not COLLSCAN)
// - executionStats.totalKeysExamined ~= nReturned
// - executionStats.totalDocsExamined ~= nReturned
```

## Aggregation Pipeline

### Pipeline Stages and Optimization

```javascript
// Complex analytics pipeline
db.orders.aggregate([
  // Stage 1: Filter early to reduce documents (uses index)
  { $match: {
    created_at: { $gte: ISODate("2025-01-01"), $lt: ISODate("2025-04-01") },
    status: "completed"
  }},

  // Stage 2: Unwind array for per-item analysis
  { $unwind: "$items" },

  // Stage 3: Lookup product details
  { $lookup: {
    from: "products",
    localField: "items.product_id",
    foreignField: "_id",
    as: "product",
    pipeline: [{ $project: { name: 1, category: 1 } }]
  }},
  { $unwind: "$product" },

  // Stage 4: Group by category
  { $group: {
    _id: "$product.category",
    total_revenue: { $sum: { $multiply: ["$items.quantity", "$items.price"] } },
    total_orders: { $sum: 1 },
    avg_order_value: { $avg: { $multiply: ["$items.quantity", "$items.price"] } }
  }},

  // Stage 5: Sort by revenue
  { $sort: { total_revenue: -1 } },

  // Stage 6: Format output
  { $project: {
    category: "$_id",
    total_revenue: { $round: ["$total_revenue", 2] },
    total_orders: 1,
    avg_order_value: { $round: ["$avg_order_value", 2] },
    _id: 0
  }}
]);
```

### Pipeline Optimization Rules

1. Place `$match` and `$limit` as early as possible
2. Place `$project` before `$group` to reduce document size
3. Use `$lookup` with pipeline sub-queries to filter joined documents
4. Avoid `$unwind` on large arrays when possible -- use `$filter` or array operators
5. Use `{ allowDiskUse: true }` for pipelines exceeding 100MB memory limit

### Window Functions (MongoDB 5.0+)

```javascript
db.sales.aggregate([
  { $setWindowFields: {
    partitionBy: "$region",
    sortBy: { date: 1 },
    output: {
      running_total: { $sum: "$amount", window: { documents: ["unbounded", "current"] } },
      moving_avg_7d: { $avg: "$amount", window: { range: [-7, 0], unit: "day" } },
      rank: { $rank: {} }
    }
  }}
]);
```

## Sharding Architecture

### Shard Key Selection

```javascript
// Good shard key: high cardinality, even distribution, query isolation
shell-cmd.shardCollection("mydb.orders", { customer_id: "hashed" });

// Compound shard key for range queries
shell-cmd.shardCollection("mydb.events", { tenant_id: 1, created_at: 1 });

// Zone-based sharding for data locality
shell-cmd.addShardToZone("shard-us-east", "US");
shell-cmd.addShardToZone("shard-eu-west", "EU");
shell-cmd.updateZoneKeyRange("mydb.users", { region: "US" }, { region: "US~" }, "US");
shell-cmd.updateZoneKeyRange("mydb.users", { region: "EU" }, { region: "EU~" }, "EU");
```

### Shard Key Decision Criteria

| Criterion | Hashed | Ranged | Compound |
|-----------|--------|--------|----------|
| Even distribution | Excellent | Depends | Good |
| Range queries | No | Yes | Yes |
| Query isolation | With equality | Yes | Yes |
| Write scaling | Excellent | Risk of hotspot | Good |

## Replica Sets

```javascript
// Initialize replica set
rs.initiate({
  _id: "myReplicaSet",
  members: [
    { _id: 0, host: "mongo1:27017", priority: 2 },    // preferred primary
    { _id: 1, host: "mongo2:27017", priority: 1 },
    { _id: 2, host: "mongo3:27017", priority: 1 },
    { _id: 3, host: "mongo4:27017", priority: 0, hidden: true, slaveDelay: 3600 }  // delayed for recovery
  ]
});

// Read preferences
// primary (default): All reads from primary
// primaryPreferred: Primary, fallback to secondary
// secondary: Only secondaries (eventual consistency)
// secondaryPreferred: Secondaries, fallback to primary
// nearest: Lowest network latency

db.orders.find({}).readPref("secondaryPreferred", [{ dc: "east" }]);
```

## Multi-Document Transactions

```javascript
const session = client.startSession();
try {
  session.startTransaction({
    readConcern: { level: "snapshot" },
    writeConcern: { w: "majority" },
    readPreference: "primary"
  });

  const accounts = session.getDatabase("bank").collection("accounts");
  await accounts.updateOne({ _id: fromAccount }, { $inc: { balance: -amount } }, { session });
  await accounts.updateOne({ _id: toAccount }, { $inc: { balance: amount } }, { session });

  const ledger = session.getDatabase("bank").collection("ledger");
  await ledger.insertOne({
    from: fromAccount, to: toAccount, amount, timestamp: new Date()
  }, { session });

  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();
  throw error;
} finally {
  session.endSession();
}
```

**Transaction best practices:**
- Keep transactions short (< 60 seconds)
- Limit to 1000 documents modified per transaction
- Design schema to minimize need for transactions (embedding > referencing when atomicity is needed)
- Use retryable writes for transient errors

## Change Streams

```javascript
// Watch for real-time changes
const pipeline = [
  { $match: { "fullDocument.status": "urgent", operationType: { $in: ["insert", "update"] } } },
  { $project: { fullDocument: 1, operationType: 1, updateDescription: 1 } }
];

const changeStream = db.collection("tickets").watch(pipeline, {
  fullDocument: "updateLookup",   // include full document on updates
  resumeAfter: savedResumeToken   // resume from last position after restart
});

changeStream.on("change", (event) => {
  console.log(`${event.operationType}: ${JSON.stringify(event.fullDocument)}`);
  // Save event._id as resume token for crash recovery
  saveResumeToken(event._id);
});
```

## Schema Validation

```javascript
db.createCollection("users", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["email", "name", "role"],
      properties: {
        email: {
          bsonType: "string",
          pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
          description: "Must be a valid email address"
        },
        name: { bsonType: "string", minLength: 1, maxLength: 200 },
        role: { enum: ["admin", "editor", "viewer"] },
        age: { bsonType: "int", minimum: 0, maximum: 150 },
        addresses: {
          bsonType: "array",
          maxItems: 10,
          items: {
            bsonType: "object",
            required: ["street", "city"],
            properties: {
              street: { bsonType: "string" },
              city: { bsonType: "string" },
              zip: { bsonType: "string", pattern: "^[0-9]{5}(-[0-9]{4})?$" }
            }
          }
        }
      }
    }
  },
  validationLevel: "strict",     // "off", "strict", "moderate"
  validationAction: "error"      // "error" or "warn"
});
```

## Performance Profiling

```javascript
// Enable profiling (level 2 = all operations, level 1 = slow operations)
db.setProfilingLevel(1, { slowms: 100 });

// Query the profiler
db.system.profile.find({
  millis: { $gt: 100 },
  ns: "mydb.orders"
}).sort({ ts: -1 }).limit(10);

// Key profiler fields:
// - millis: execution time
// - planSummary: IXSCAN vs COLLSCAN
// - keysExamined vs docsExamined vs nreturned
// - command: the actual query

// currentOp for live analysis
db.currentOp({ "active": true, "secs_running": { $gt: 5 } });

// Kill long-running operation
db.killOp(opId);
```

## Atlas Features

### Atlas Search (Lucene-based)

```javascript
// Create search index in Atlas UI or API
// Then use $search stage in aggregation
db.products.aggregate([
  { $search: {
    index: "product_search",
    compound: {
      must: [{ text: { query: "wireless mouse", path: ["name", "description"] } }],
      filter: [{ range: { path: "price", gte: 10, lte: 100 } }],
      should: [{ text: { query: "ergonomic", path: "features", score: { boost: { value: 2 } } } }]
    },
    highlight: { path: ["name", "description"] }
  }},
  { $project: { name: 1, price: 1, score: { $meta: "searchScore" }, highlights: { $meta: "searchHighlights" } } },
  { $limit: 20 }
]);
```

### Atlas Data Federation, Online Archive, and Charts

- **Data Federation**: Query across Atlas clusters, S3, and HTTP sources with a unified interface
- **Online Archive**: Automatically tier cold data to cheaper storage while keeping it queryable
- **Charts**: Build dashboards directly from MongoDB data without ETL

## When to Use

**Use this skill when:**
- Designing or implementing mongodb architect solutions
- Reviewing or improving existing mongodb architect approaches
- Making architectural or implementation decisions about mongodb architect
- Learning mongodb architect patterns and best practices
- Troubleshooting mongodb architect-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Mongodb Architect Analysis

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

**Input:** "Help me implement mongodb architect for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended mongodb architect approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When mongodb architect must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
