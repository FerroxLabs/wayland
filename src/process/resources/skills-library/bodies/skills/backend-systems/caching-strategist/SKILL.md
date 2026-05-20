---
name: caching-strategist
description: |
  Caching architecture expertise covering cache-aside, write-through, write-behind, read-through patterns, TTL strategies, cache invalidation, CDN caching, application caching, database query caching, distributed caching, and cache warming.
  Use when the user asks about caching strategist, caching strategist best practices, or needs guidance on caching strategist implementation.
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
  difficulty: "advanced"
---

# Caching Strategist

## Purpose

Design and implement caching strategies that dramatically improve application performance while maintaining data consistency. This skill covers caching patterns at every layer of the stack, from CDN edge caching through application and database levels.

## Caching Decision Framework

```
SHOULD I CACHE THIS?

Is the data read frequently?
  NO  -> Probably don't cache
  YES -> Is the data expensive to compute/get?
    NO  -> Light caching or skip (overhead may not be worth it)
    YES -> Definitely cache

Can the data be stale for any period?
  NO  -> Cache with synchronous invalidation (write-through)
  YES -> How long can it be stale?
    Seconds:   Short TTL (5-30s)
    Minutes:   Medium TTL (1-15min)
    Hours:     Long TTL (1-24hr)
    Days:      Very long TTL + explicit invalidation

Does stale data cause business problems?
  YES -> Use write-through or event-driven invalidation
  NO  -> Use TTL-based expiry (simpler)
```

## Caching Patterns

### Cache-Aside (Lazy Loading)

```
FLOW:
  1. Application checks cache
  2. Cache HIT -> return cached data
  3. Cache MISS -> get from database
  4. Store result in cache
  5. Return data

IMPLEMENTATION:
```

```ts
class UserService {
  async getUser(id: string): Promise<User> {
    const cacheKey = `user:${id}`;

    // 1. Check cache
    const cached = await this.cache.get(cacheKey);
    if (cached) return JSON.parse(cached);

    // 2. Get from database
    const user = await this.db.users.findById(id);
    if (!user) throw new NotFoundException('User not found');

    // 3. Store in cache
    await this.cache.set(cacheKey, JSON.stringify(user), { EX: 3600 }); // 1 hour TTL

    return user;
  }

  async updateUser(id: string, data: UpdateUserDto): Promise<User> {
    const user = await this.db.users.update(id, data);

    // Invalidate cache after write
    await this.cache.del(`user:${id}`);

    return user;
  }
}
```

```
PROS:
  - Only caches data that is actually requested
  - Cache failure doesn't block reads (falls back to DB)
  - Simple to implement

CONS:
  - First request for each item is slow (cache miss)
  - Stale data possible between write and invalidation
  - Cache stampede risk on popular keys
```

### Write-Through

```
FLOW:
  1. Application writes to cache AND database synchronously
  2. Reads always come from cache

IMPLEMENTATION:
```

```ts
class ProductService {
  async createProduct(data: CreateProductDto): Promise<Product> {
    // Write to database first
    const product = await this.db.products.create(data);

    // Write to cache synchronously
    await this.cache.set(`product:${product.id}`, JSON.stringify(product), { EX: 86400 });

    return product;
  }

  async getProduct(id: string): Promise<Product> {
    const cached = await this.cache.get(`product:${id}`);
    if (cached) return JSON.parse(cached);

    // Fallback to DB if cache miss (cold start or eviction)
    const product = await this.db.products.findById(id);
    if (product) {
      await this.cache.set(`product:${id}`, JSON.stringify(product), { EX: 86400 });
    }
    return product;
  }
}
```

```
PROS:
  - Cache is always consistent with database
  - No stale data (writes update both)
  - Simple mental model

CONS:
  - Write latency increases (must update both cache and DB)
  - Caches data that may never be read
  - Cache failure can block writes
```

### Write-Behind (Write-Back)

```
FLOW:
  1. Application writes to cache only
  2. Cache asynchronously writes to database (batch/delayed)
  3. Reads come from cache

IMPLEMENTATION:
```

```ts
class AnalyticsService {
  private writeBuffer: Map<string, { data: any; timestamp: number }> = new Map();

  async recordEvent(event: AnalyticsEvent): Promise<void> {
    const cacheKey = `analytics:${event.type}:${event.id}`;

    // Write to cache immediately
    await this.cache.set(cacheKey, JSON.stringify(event));

    // Buffer for batch write to database
    this.writeBuffer.set(cacheKey, { data: event, timestamp: Date.now() });
  }

  // Flush buffer periodically (e.g., every 5 seconds)
  @Scheduled('*/5 * * * * *')
  async flushToDatabase(): Promise<void> {
    if (this.writeBuffer.size === 0) return;

    const batch = Array.from(this.writeBuffer.values());
    this.writeBuffer.clear();

    await this.db.analytics.insertMany(batch.map(b => b.data));
  }
}
```

```
PROS:
  - Extremely fast writes (only cache, not DB)
  - Batching reduces database load
  - Good for high-throughput write workloads

CONS:
  - Risk of data loss if cache fails before flush
  - Complexity in handling failures and retries
  - Database reads are stale until flush
```

### Read-Through

## TTL Strategies

### TTL Decision Guide

```
DATA TYPE                       RECOMMENDED TTL
-------------------------------------------------
User session                    15min - 24hr (sliding)
User profile                   5min - 1hr
Product catalog                1hr - 24hr
Search results                 5min - 30min
Configuration/feature flags    30s - 5min
Dashboard stats                1min - 15min
Static content (about page)    24hr - 7 days
API rate limit counters        Window duration (1min, 1hr)
Authentication tokens          Match token expiry
Real-time data (stock prices)  1s - 10s (or no cache)
```

### Sliding TTL vs Fixed TTL

```
Fixed TTL:
  Set TTL on creation, expires at exact time regardless of access.
  Good for: data that should refresh periodically

Sliding TTL:
  Reset TTL on each access, expires only if not accessed.
  Good for: session data, frequently accessed items

Implementation:
  // Fixed TTL
  cache.set(key, value, { EX: 3600 }); // Always expires in 1 hour

  // Sliding TTL
  const value = await cache.get(key);
  if (value) {
    await cache.expire(key, 3600); // Reset TTL on each read
  }
```

## Cache Invalidation Patterns

### Event-Driven Invalidation

```ts
// Publisher: on data change, emit event
class OrderService {
  async updateOrder(id: string, data: UpdateOrderDto) {
    const order = await this.db.orders.update(id, data);
    await this.events.emit('order.updated', { orderId: id, userId: order.userId });
    return order;
  }
}

// Subscriber: invalidate cache on event
class OrderCacheInvalidator {
  @OnEvent('order.updated')
  async handleOrderUpdated({ orderId, userId }: OrderUpdatedEvent) {
    await Promise.all([
      this.cache.del(`order:${orderId}`),
      this.cache.del(`user:${userId}:orders`),
      this.cache.del(`dashboard:recent-orders`),
    ]);
  }
}
```

### Tag-Based Invalidation

```ts
// Store cache entries with tags
await cache.set('product:123', data, {
  EX: 3600,
  tags: ['products', 'category:electronics', 'vendor:acme'],
});

// Invalidate all entries with a tag
await cache.invalidateByTag('category:electronics');
// Removes all products in electronics category
```

### Versioned Cache Keys

```ts
// Use a version counter in the cache key
const version = await cache.get('products:version') || '1';
const cacheKey = `products:list:v${version}`;
const products = await cache.get(cacheKey);

// To invalidate all product caches, increment version
await cache.incr('products:version');
// All old keys become orphaned and expire naturally via TTL
```

## Cache Stampede Prevention

```
PROBLEM: When a popular cache key expires, hundreds of concurrent requests
all miss the cache and hit the database simultaneously.

SOLUTIONS:

1. Mutex/Lock Pattern:
```

```ts
async function getWithMutex(key: string, fetchFn: () => Promise<any>, ttl: number) {
  const cached = await cache.get(key);
  if (cached) return JSON.parse(cached);

  // Try to acquire lock
  const lockKey = `lock:${key}`;
  const acquired = await cache.set(lockKey, '1', { NX: true, EX: 10 });

  if (acquired) {
    try {
      const data = await fetchFn();
      await cache.set(key, JSON.stringify(data), { EX: ttl });
      return data;
    } finally {
      await cache.del(lockKey);
    }
  } else {
    // Wait and retry
    await sleep(100);
    return getWithMutex(key, fetchFn, ttl);
  }
}
```

```
2. Stale-While-Revalidate:
   Store data with a soft TTL (logical) and hard TTL (actual).
   Serve stale data while refreshing in background.

3. Pre-emptive Refresh:
   Refresh cache before TTL expires (at 80% of TTL).
   Requires background job or scheduled task.

4. Probabilistic Early Expiration:
   Each reader has a small probability of refreshing the cache
   before actual expiry, spreading the refresh load.
```

## CDN Caching

```
CACHE-CONTROL HEADER PATTERNS:

Static assets (hashed filenames):
  Cache-Control: public, max-age=31536000, immutable
  (Cache forever, filename changes on content change)

HTML pages:
  Cache-Control: public, max-age=0, s-maxage=3600, stale-while-revalidate=86400
  (CDN caches for 1hr, serves stale for 24hr while revalidating)

API responses:
  Cache-Control: public, max-age=60, s-maxage=300
  Vary: Authorization, Accept-Language
  (CDN caches for 5min, client caches for 1min)

Private data:
  Cache-Control: private, no-store
  (Never cache at CDN level)

SURROGATE KEYS (CDN-level tag invalidation):
  Response header: Surrogate-Key: product-123 category-electronics
  Purge: PURGE /api/products/* with Surrogate-Key tag
  Supported by: Fastly, Cloudflare, Varnish
```

## Distributed Caching (Redis)

### Redis Patterns

```ts
// String: Simple key-value
await redis.set('user:123', JSON.stringify(user), 'EX', 3600);
const user = JSON.parse(await redis.get('user:123'));

// Hash: Object with individual field access
await redis.hset('user:123', { name: 'John', email: 'john@example.com', role: 'admin' });
const name = await redis.hget('user:123', 'name');
const user = await redis.hgetall('user:123');

// Sorted Set: Leaderboard, ranking
await redis.zadd('leaderboard', score, playerId);
const top10 = await redis.zrevrange('leaderboard', 0, 9, 'WITHSCORES');

// List: Queue, recent items
await redis.lpush('recent:user:123', JSON.stringify(activity));
await redis.ltrim('recent:user:123', 0, 49); // Keep last 50
const recent = await redis.lrange('recent:user:123', 0, 9);

// Set: Unique collections, online users
await redis.sadd('online-users', userId);
await redis.srem('online-users', userId);
const onlineCount = await redis.scard('online-users');
const isOnline = await redis.sismember('online-users', userId);

// Pub/Sub: Cache invalidation broadcast
await redis.publish('cache-invalidation', JSON.stringify({ key: 'user:123' }));
```

### Redis Cluster Considerations

```
KEYS AND SLOTS:
  - Redis Cluster distributes keys across 16384 hash slots
  - Multi-key operations require all keys on same slot
  - Use hash tags to colocate related keys: {user:123}:profile, {user:123}:orders

MEMORY MANAGEMENT:
  - Set maxmemory policy: allkeys-lru (recommended for caches)
  - Monitor memory with INFO memory
  - Use OBJECT ENCODING to check memory efficiency
  - Consider Redis memory optimization: shorter keys, integer values

HIGH AVAILABILITY:
  - Redis Sentinel for automatic failover
  - Redis Cluster for horizontal scaling
  - Read replicas for read-heavy workloads
```

## Cache Warming

```ts
// Warm cache on application startup
async function warmCache() {
  console.log('Warming cache...');

  // Warm frequently accessed data
  const popularProducts = await db.products.findMany({
    where: { featured: true },
    take: 100,
  });
  await Promise.all(
    popularProducts.map(p =>
      cache.set(`product:${p.id}`, JSON.stringify(p), { EX: 3600 })
    )
  );

  // Warm configuration
  const config = await db.config.findMany();
  await cache.set('app:config', JSON.stringify(config), { EX: 86400 });

  # ... (condensed) ...
        EX: Math.floor((s.expiresAt.getTime() - Date.now()) / 1000),
      })
    )
  );

  console.log('Cache warmed successfully');
}
```

## Multi-Layer Caching

```
LAYER 1: Browser/Client Cache
  HTTP Cache-Control headers
  Service Worker cache
  TTL: varies by resource type

LAYER 2: CDN/Edge Cache
  Cloudflare, Fastly, CloudFront
  Geographically distributed
  TTL: minutes to hours

LAYER 3: Application Cache (in-process)
  In-memory LRU cache (node-cache, Caffeine)
  No network latency
  TTL: seconds to minutes
  Limit: bounded by process memory

LAYER 4: Distributed Cache (Redis/Memcached)
  Shared across application instances
  Network latency: 1-5ms
  TTL: minutes to hours
  Limit: cluster memory

LAYER 5: Database Query Cache
  PostgreSQL shared_buffers
  MySQL query cache (deprecated, use ProxySQL)
  Managed by database engine
```

## Caching Architecture Checklist

- [ ] Caching pattern selected per data type (cache-aside, write-through, etc.)
- [ ] TTL values defined based on data freshness requirements
- [ ] Cache invalidation strategy defined (event-driven, TTL, versioned)
- [ ] Cache stampede prevention implemented for hot keys
- [ ] CDN configured with correct Cache-Control headers
- [ ] Distributed cache (Redis) deployed with high availability
- [ ] Cache warming implemented for startup latency reduction
- [ ] Multi-layer caching considered (browser, CDN, app, Redis)
- [ ] Cache hit ratio monitored (target >90%)
- [ ] Memory limits and eviction policies configured
- [ ] Cache key naming convention documented and consistent
- [ ] Sensitive data excluded from caching (or encrypted)
- [ ] Fallback behavior defined for cache failures
- [ ] Cache metrics exposed (hits, misses, latency, memory)

## When to Use

**Use this skill when:**
- Designing or implementing caching strategist solutions
- Reviewing or improving existing caching strategist approaches
- Making architectural or implementation decisions about caching strategist
- Learning caching strategist patterns and best practices
- Troubleshooting caching strategist-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Caching Strategist Analysis

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

**Input:** "Help me implement caching strategist for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended caching strategist approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When caching strategist must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
