---
name: caching-strategies
description: |
  Guides expert-level caching strategies implementation: optimization and database decision frameworks, production-ready patterns, and concrete templates for caching strategies workflows.
  Use when the user asks about caching strategies, caching strategies configuration, or backend best practices for caching projects.
  Do NOT use when the user needs a different backend infrastructure capability -- check sibling skills in the backend infrastructure subcategory.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "backend optimization database"
  category: "backend-systems"
  subcategory: "backend-infrastructure"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Caching Strategies

## When to Use

**Use this skill when:**
- User is experiencing slow database query times (consistently above 50ms for reads) and wants to reduce load without scaling hardware
- User is building a read-heavy API (reads outpacing writes by 5:1 or more) and needs to reduce backend latency
- User wants to implement a specific caching pattern -- cache-aside, write-through, write-behind, read-through, or refresh-ahead -- and needs guidance selecting and implementing the right one
- User asks about cache invalidation strategies, TTL configuration, or cache key design for a specific application
- User is experiencing cache stampede, thundering herd, or stale data problems in a production system
- User wants to add distributed caching (Redis, Memcached) to a multi-instance application and needs consistency guidance
- User is evaluating whether to cache at the CDN edge, application layer, database query layer, or object layer
- User needs to design a cache warming strategy before a high-traffic event (product launch, sale, scheduled broadcast)

**Do NOT use this skill when:**
- User needs guidance on full-text search indexing -- that is a separate indexing and search skill even though Elasticsearch and similar tools can cache query results
- User is asking about HTTP cache-control headers and CDN configuration for static assets -- refer to the CDN and edge networking skill
- User needs session storage design -- session management has distinct consistency and security requirements addressed in the auth and session management skill
- User is asking about database query optimization, index tuning, or query plan analysis -- those optimizations should precede caching decisions
- User needs message queue or event streaming patterns -- Redis Streams and similar tools overlap with caching but are addressed in the event-driven architecture skill
- User is asking about in-browser localStorage or IndexedDB caching for frontend state -- refer to the frontend state management skill

---

## Process

### 1. Profile the Workload Before Designing Any Cache

Never design a cache for a workload you have not measured. Guessing cache placement wastes engineering effort and can make performance worse.

- Measure the current p50, p95, and p99 read latency for the data access paths the user cares about. Anything below 10ms typically does not need caching -- the overhead of a cache round-trip may exceed the savings.
- Identify the read-to-write ratio for each data entity. A ratio below 3:1 often makes write-through or write-behind caching counter-productive because invalidation overhead dominates.
- Identify hotspot keys -- the top 1% of keys that account for 50%+ of read volume. These are the highest-ROI targets. In most OLTP applications, 80% of reads target 20% or fewer distinct records.
- Measure database connection pool saturation. If pool exhaustion is the bottleneck, caching reduces connection demand more than it reduces latency, which changes your TTL and eviction strategy.
- Distinguish between cacheable and non-cacheable data: user-specific personalized data is cacheable with per-user keys; write-heavy counters (inventory, likes) require special patterns (probabilistic counting or write-behind); financial ledger data typically must not be cached without explicit consistency guarantees.
- Determine deployment topology: single-process, multi-process on one host, or multi-instance distributed. Single-process can use in-process caches (caffeine, lru-cache); multi-instance requires a shared external store.

---

### 2. Select the Caching Layer

There are five distinct caching layers, each with different latency characteristics, consistency properties, and implementation complexity. Match the layer to the data access pattern.

- **In-process memory cache** (Caffeine for JVM, lru-cache or node-lru-cache for Node.js, functools.lru_cache for Python): sub-millisecond access, zero network cost, no consistency across instances. Use for immutable reference data (country codes, feature flags loaded at startup, compiled templates). Maximum practical size: 100MB-500MB depending on heap configuration.
- **Sidecar/local cache with TTL** (same libraries, but with expiration): suitable for data that is slightly stale-tolerant (user profile attributes, configuration values). TTLs in the 30s-300s range prevent stale data accumulation without excessive invalidation traffic.
- **Distributed cache** (Redis standalone, Redis Cluster, Memcached): network round-trip adds 0.5ms-2ms latency on co-located infrastructure. Shared across all application instances -- correct choice for user sessions, rate limiting state, shared computation results. Redis is preferred over Memcached for most new deployments because it supports data structures (sorted sets, hashes, streams), persistence options, and Lua scripting for atomic operations.
- **Database query cache / ORM-level cache** (Hibernate second-level cache, Django's per-view cache, ActiveRecord query caching): reduces repeated identical queries within a request/response cycle. Rarely the right primary caching strategy but useful as a secondary layer for ORM-heavy applications.
- **CDN / reverse proxy cache** (Nginx proxy_cache, Varnish, AWS CloudFront): appropriate for API responses that are identical across many users (public product listings, news feeds, reference data). Requires correct `Cache-Control` and `Vary` headers. Not covered in depth here -- use in conjunction with this skill but refer to the CDN skill for header configuration.

For most production web applications, the right answer is a **two-level cache**: in-process LRU for hot reference data combined with Redis for shared mutable state.

---

### 3. Select the Cache Pattern

The pattern determines how data gets into the cache, how writes are handled, and what happens on a miss. Each pattern has specific use cases.

**Cache-Aside (Lazy Loading):**
- The application checks the cache first; on a miss, it fetches from the database, writes to the cache, and returns the result.
- Ideal for read-heavy, write-infrequent data where the full dataset is too large to pre-populate.
- Cache is only populated with data actually requested -- naturally filters to hot data.
- Downside: first request after TTL expiry incurs full database latency (the "cold start" problem). Mitigate with staggered TTLs or probabilistic early recomputation.
- TTL guideline: 5 minutes for moderately dynamic data; 1-24 hours for reference data; never infinite TTL unless the data is truly immutable.

**Read-Through:**
- Cache sits in front of the database and handles misses transparently. The application only ever calls the cache; the cache calls the database on a miss.
- Reduces application code complexity -- no conditional cache-check logic scattered through the codebase.
- Requires a cache client library that supports this pattern (Redis with a data loader, or a dedicated cache proxy). Spring Cache abstraction and Rails `Rails.cache.fetch` implement this pattern.
- Subtle difference from cache-aside: the cache -- not the application -- is responsible for hydration. This matters for testability and separation of concerns.

**Write-Through:**
- Every write goes to the cache AND the database synchronously before acknowledging the write.
- Guarantees cache consistency at the cost of increased write latency (two writes per mutation).
- Use when read latency matters more than write latency and data consistency is required -- user account details, product prices.
- Anti-pattern: applying write-through to high-write-rate data (event counters, analytics) -- the cache fills with rarely-read data and write throughput drops.

**Write-Behind (Write-Back):**
- Writes go to the cache immediately and are asynchronously flushed to the database.
- Dramatically improves write throughput (10x-100x) at the cost of durability risk -- data in cache but not yet persisted is lost on cache failure.
- Appropriate for: leaderboard scores, page view counters, shopping cart updates where eventual persistence (within seconds) is acceptable.
- Requires a reliable flush mechanism: Redis persistence (AOF with `appendfsync everysec`) plus a background flush worker, or a dedicated write buffer with acknowledgment.
- NEVER use write-behind for financial transactions, order records, or any data where loss is unacceptable.

**Refresh-Ahead (Prefetch):**
- Cache proactively refreshes entries before they expire, based on predicted access patterns or scheduled refresh.
- Eliminates the cold-start latency spike entirely -- no user ever waits for a cache miss.
- Correct for: homepage content, top-N product listings, exchange rates, any data with predictable high demand.
- Implementation: background job that refreshes the cache on a schedule shorter than the TTL. If TTL = 5 minutes, refresh every 3 minutes.
- Overhead: computes and stores values that may never be requested. Only worthwhile for the top 0.1%-1% of hot keys.

---

### 4. Design Cache Keys

Poor key design causes cache pollution, incorrect sharing of data across users, and difficult invalidation. Apply these practices:

- Use a consistent naming convention: `{namespace}:{entity}:{identifier}:{version}`. Example: `catalog:product:84729:v2`.
- Include a version segment when schema changes require cache busting across all entries simultaneously. Increment the version in configuration and all old keys become orphaned (they expire via TTL rather than requiring explicit deletion).
- Namespace by tenant ID in multi-tenant applications: `tenant:{tid}:user:{uid}:profile`. Prevents cross-tenant data leakage and enables tenant-specific cache flush.
- Hash long or composite keys: if a cache key is constructed from a complex query (e.g., a filtered product search with 12 parameters), hash the canonical parameter string with SHA-256 and use the hex digest as the key. This prevents key length issues (Redis key maximum: 512MB, but keys longer than 100 characters become a memory and comparison overhead).
- Never include sensitive data (passwords, tokens, PII) in cache keys -- they appear in monitoring, logs, and Redis KEYS scans.
- Use Redis SCAN instead of KEYS for pattern-based invalidation in production. KEYS blocks the server for the duration of the scan -- catastrophic on large keyspaces.

---

### 5. Configure TTL and Eviction Policy

TTL and eviction are the primary knobs controlling cache effectiveness and memory safety.

**TTL Selection Framework:**
- **Immutable reference data** (country codes, currency symbols): 24h-7d TTL, or no TTL with version-based invalidation.
- **Slowly changing configuration** (feature flags, pricing tiers): 60s-300s TTL with an explicit invalidation trigger on write.
- **User-specific data** (profile, preferences): 5m-30m TTL; shorter if the user expects immediate reflection of changes.
- **Computed aggregates** (dashboard stats, report summaries): 1m-15m TTL depending on freshness requirements.
- **Real-time data** (inventory counts, live scores): 1s-10s TTL or skip caching entirely and use event-driven updates.

**TTL Jitter:** Add ±10-20% random jitter to all TTLs to prevent synchronized expiration (cache stampede). If 10,000 sessions are all cached with TTL=3600, they expire simultaneously at the hour mark, flooding the database. Jitter staggers the expiration across the TTL window.

**Redis Eviction Policies:**
- `allkeys-lru`: evict least recently used key from all keys when memory is full. Best for general-purpose caching.
- `volatile-lru`: evict LRU key from only keys with a TTL set. Use when the cache also holds non-evictable persistent data.
- `allkeys-lfu`: evict least frequently used. Better than LRU for Zipf-distributed access patterns (highly skewed hotspot workloads).
- `noeviction`: return an error when memory is full. NEVER use this for a cache -- only appropriate for Redis used as a primary data store.
- `volatile-ttl`: evict the key with the shortest remaining TTL. Useful when you want natural expiry to drive eviction.
- Set a `maxmemory` limit in Redis configuration. For a dedicated cache instance, set this to 70-80% of the host's available RAM to leave headroom for Redis internal overhead.

---

### 6. Handle Cache Failure and Consistency Hazards

A cache that causes outages when it fails, or that serves incorrect data, is worse than no cache.

**Cache Miss Storms (Thundering Herd):**
- Occurs when many concurrent requests simultaneously miss the same key (e.g., after a cache restart or a mass expiry).
- Solution -- mutex/lock-based population: before fetching from the database, acquire a distributed lock (Redis SET with NX and EX flags). The first request holds the lock and populates the cache; subsequent requests wait briefly and then hit the now-warm cache. Lock TTL should be slightly longer than the expected database fetch time.
- Alternative -- probabilistic early expiration (XFetch algorithm): each cache fetch computes a probability of preemptive refresh based on remaining TTL and fetch cost. As expiry approaches, the cache proactively recomputes before the TTL fires.

**Stale-While-Revalidate:**
- Return the stale cached value immediately while triggering an async background refresh.
- Eliminates latency spikes entirely. Acceptable only when momentary staleness (seconds to minutes) is tolerable.
- Implement with a "shadow TTL": store two TTLs -- a soft TTL (when to start background refresh) and a hard TTL (when to evict). Serve stale data between soft and hard TTL.

**Cache Stampede on Cold Start:**
- When deploying a new cache or flushing all keys, the database receives the full traffic load until the cache warms.
- Mitigate with a cache warming script that pre-populates the top-N keys from database before directing traffic to the new instances.
- Alternatively, use a read-through pattern with request coalescing: collapse multiple simultaneous misses for the same key into a single database request.

**Split-Brain / Inconsistent Reads in Redis Cluster:**
- Redis Cluster uses async replication. A write acknowledged by the primary may not be replicated before a failover, causing a new primary to serve stale data.
- For strong consistency requirements, use Redis with `WAIT numreplicas timeout` to block until the specified number of replicas acknowledge the write.
- For most web applications, this level of consistency is unnecessary. Accept the small staleness window and design the application logic accordingly.

---

### 7. Implement Cache Monitoring and Observability

An unmonitored cache is a liability. These metrics determine whether the cache is working correctly.

**Key Metrics to Track:**
- **Hit rate**: (hits / (hits + misses)). A healthy cache hit rate depends on the use case -- 80%+ for general object caching; 95%+ for aggressively pre-populated reference data. A hit rate below 50% suggests key design problems, excessive TTL shortness, or insufficient cache capacity.
- **Eviction rate**: high eviction rates indicate the cache is undersized for the working set. Increase `maxmemory` or reduce the number of cached entities.
- **Memory usage**: track `used_memory` vs `maxmemory`. Alert at 85% to give time to respond before eviction becomes aggressive.
- **Miss penalty latency**: measure the p95 latency of cache-miss code paths separately from cache-hit paths. This reveals whether the miss fallback is becoming a bottleneck.
- **Key expiration rate**: sudden spikes indicate synchronized TTL expiration -- add jitter.
- **Connection pool usage**: Redis connection pools are commonly undersized. Each application thread that can make a concurrent Redis call needs a connection. Pool exhaustion causes latency spikes that look like Redis latency but are actually queuing delay.

**Instrumentation approach:**
- Wrap cache operations in a thin instrumentation layer that records hit/miss/error to your metrics system (Prometheus, Datadog, CloudWatch).
- Log cache invalidation events with the key and triggering operation to aid debugging of stale data reports.
- Set alerts for: hit rate dropping below threshold, memory exceeding 85%, connection pool exhaustion.

---

### 8. Document the Caching Architecture Decision

Cache design decisions have long-term maintenance implications. Document them explicitly.

- Record the pattern chosen (cache-aside vs. write-through vs. write-behind), the rationale, and the alternatives considered.
- Specify which data entities are cached, at which layer, with what TTL, and the invalidation trigger for each.
- Document the eviction policy and the reasoning for the `maxmemory` setting.
- Note consistency guarantees (eventual, strong, session-consistent) and the business justification for each choice.
- Include a runbook section: what to do when the cache is down (graceful degradation to database), when hit rate drops suddenly, and how to force a full cache flush safely.

---

## Output Format

```
## Caching Architecture Analysis

### Workload Profile
| Data Entity         | Access Pattern      | Read:Write Ratio | Cacheable | Notes                     |
|---------------------|---------------------|------------------|-----------|---------------------------|
| [entity name]       | [random/sequential] | [X:1]            | [yes/no]  | [staleness tolerance]     |

### Recommended Caching Stack
- **Layer 1 (in-process):** [library] -- for [entity types], TTL [duration]
- **Layer 2 (distributed):** [Redis/Memcached config] -- for [entity types], TTL [duration]
- **Eviction policy:** [policy name] -- rationale: [reason]
- **maxmemory:** [value and % of host RAM]

### Pattern Selection
| Data Entity         | Pattern        | TTL     | Invalidation Trigger        | Consistency Guarantee |
|---------------------|----------------|---------|-----------------------------|-----------------------|
| [entity name]       | [pattern name] | [value] | [event or schedule]         | [eventual/strong]     |

### Cache Key Schema
| Entity              | Key Template                          | Example                          |
|---------------------|---------------------------------------|----------------------------------|
| [entity name]       | [namespace]:[entity]:[id]:[version]   | catalog:product:84729:v2         |

### Implementation Notes
- **Thundering herd mitigation:** [mutex lock / probabilistic refresh / stale-while-revalidate]
- **TTL jitter:** [±X% on all TTLs]
- **Cold start strategy:** [warming script / request coalescing / gradual traffic shift]

### Monitoring Targets
| Metric              | Warning Threshold | Critical Threshold | Action                     |
|---------------------|-------------------|--------------------|----------------------------|
| Hit rate            | < 80%             | < 60%              | Review key design, TTL     |
| Memory usage        | > 75%             | > 85%              | Increase maxmemory or scale|
| Eviction rate       | > 100/min         | > 1000/min         | Cache is undersized        |
| Connection pool     | > 70% utilized    | > 90% utilized     | Increase pool size         |

### Implementation Skeleton
[Language-specific code for the chosen pattern]
```

---

## Rules

1. **Never design a cache before measuring the workload.** A cache applied to a non-bottleneck path wastes memory and adds operational complexity with zero user-visible benefit. Always get query latency numbers first.

2. **Never cache data with a read:write ratio below 3:1 using write-through.** The write overhead and invalidation churn exceed the read latency savings. Use cache-aside with short TTL or skip caching for write-heavy entities.

3. **Never use Redis `KEYS *` in production for any purpose.** It blocks the entire Redis event loop for the duration of the scan, causing latency spikes across all consumers. Always use `SCAN` with a cursor and a COUNT hint (e.g., `SCAN 0 MATCH prefix:* COUNT 100`).

4. **Always add TTL jitter of ±10-20%.** Synchronized expiration of large numbers of keys causes cache stampede and sudden database load spikes. This rule applies to every TTL set in every cache layer.

5. **Never use write-behind caching for data where loss is unacceptable.** Write-behind sacrifices durability for throughput. Financial records, order history, authentication events, and audit logs must be written synchronously to the database regardless of the performance cost.

6. **Always set a `maxmemory` limit on Redis when used as a cache.** Without this, Redis will consume all available host memory and cause OOM failures affecting co-located processes. Set `maxmemory` to 70-80% of available RAM and pair it with an appropriate eviction policy.

7. **Never store sensitive data in a shared cache without encryption or access controls.** Redis in default configuration has no authentication and no encryption at rest. PII, authentication tokens, and session data stored in a shared Redis must use Redis ACLs and TLS transport. Consider whether shared cache access logging meets your compliance requirements.

8. **Always implement graceful cache degradation.** When the cache is unavailable, the application must fall back to the database with appropriate circuit breaker logic. Never let a cache failure cascade into a full application outage. The database should always be able to serve traffic at degraded but functional throughput.

9. **Never use a single cache key for data shared across tenants in a multi-tenant system.** A single shared key means tenant A's data can be returned to tenant B, creating a data leak. Always namespace keys by tenant ID and verify ownership before returning cached data.

10. **Always benchmark cache hit rate after deployment and at 30-day intervals.** Access patterns drift over time as usage evolves. A cache designed for the initial workload may have poor hit rates six months later due to new features, changed query patterns, or a shifted user base. Treat hit rate monitoring as a permanent operational responsibility, not a post-launch verification step.

---

## Edge Cases

### Hot Key Concentration (Cache Hotspot)
A single Redis key receiving tens of thousands of requests per second saturates the CPU of the single Redis node that owns that key slot. This is common for global reference data (top-rated products, homepage configuration) and viral content.

**Handling:**
- Replicate the hot key across N shards using a suffix: `product:84729:shard:{0..N-1}`. Round-robin or randomly select the shard on each read. N=8-16 is typically sufficient to distribute a hotspot.
- For read-only hot keys, use local in-process caching with a short TTL (5s-30s) as an L1 cache in front of Redis. This reduces Redis load by the number of threads per application instance.
- Monitor Redis per-key access rates using `redis-cli --hotkeys` (requires LFU eviction policy enabled) to identify hotspots before they cause saturation.

### Cache Poisoning After a Bug Deploy
A bug in application code writes incorrect data to the cache. The bug is fixed in the next deploy but the corrupted cache entries persist until their TTL expires.

**Handling:**
- Maintain a cache version segment in all key templates (`v1`, `v2`). When a data corruption event is identified, increment the version in configuration and redeploy. All old keys are orphaned and expire via TTL; new keys are populated with correct data.
- For immediate mitigation without a version bump, use `SCAN` with `UNLINK` (async delete, non-blocking) to purge affected key patterns.
- Never use `FLUSHALL` or `FLUSHDB` in production without understanding the cold-start consequence. A full flush on a large cache can collapse database performance for several minutes while the cache warms.

### Large Object Caching (>1MB Values)
Storing objects larger than 1MB in Redis increases network serialization time, disrupts Redis pipeline efficiency, and can trigger slow log entries.

**Handling:**
- Compress large values before storing using LZ4 or Snappy compression. Both offer 2x-5x compression ratios on JSON payloads with compression times under 1ms for objects up to 10MB.
- Consider whether the large object can be decomposed into smaller cacheable units. A 5MB user activity feed can be cached as individual post objects (1-5KB each) referenced by a cached sorted set of IDs, enabling partial invalidation.
- For objects genuinely requiring large storage (rendered HTML fragments, report PDFs), use object storage (S3-compatible) with a CDN in front rather than Redis.
- Redis slow log threshold default is 10ms (`slowlog-log-slower-than 10000`). Review the slow log when caching large objects to confirm serialization is not causing outlier latency.

### Cache in Database Read Replicas Environment
Some teams use a cache to reduce read replica lag effects -- if stale data from a replica is cached, it may be served long after the replica has caught up, creating longer effective staleness than the replica lag alone.

**Handling:**
- When using cache-aside in a replica-reads architecture, set the cache TTL to be shorter than the maximum acceptable staleness, not shorter than the replica lag. If replica lag is 500ms but business logic tolerates 30-second staleness, a 30-second TTL is correct.
- For writes that require immediately consistent reads (post-write read-your-own-writes scenarios), bypass both the cache and the replica: route the read immediately after a write to the primary, and populate the cache from the primary response.
- Tag cache entries with the source replication position (LSN/binlog position) if the application needs to know whether a cache entry came from a replica that has since fallen behind.

### Distributed Cache Consistency During Rolling Deploys
During a rolling deploy that changes cache key schemas, data serialization formats, or TTL policies, multiple application versions run simultaneously and write to the same cache.

**Handling:**
- Treat rolling deploy as a multi-version compatibility window. New code must be able to read cache entries written by the old code for the duration of the rollout (typically 5-30 minutes).
- Use envelope versioning in cached values: wrap the serialized payload in a versioned envelope (`{"v": 2, "data": {...}}`). New code checks the envelope version and handles both old and new formats during the compatibility window.
- If a schema change is not backward-compatible, increment the key version prefix before deploying. Old keys expire via TTL; new code populates new versioned keys. The deploy incurs a cold-start penalty but avoids deserialization errors.
- Never change the serialization library (e.g., switching from JSON to MessagePack) without a versioned key migration plan.

### Multi-Region Caching Consistency
Applications deployed across multiple geographic regions with a Redis cache per region face cross-region consistency challenges when a write in Region A must be reflected in Region B's cache.

**Handling:**
- Accept regional staleness for most data. A product price updated in Region A will propagate to Region B's cache when that region's TTL expires. For most e-commerce, content, and social data, this is acceptable.
- For data that must be globally consistent (e.g., account suspension status, rate limit state), use a single authoritative Redis instance with read replicas in each region. Accept the cross-region read latency (~50ms-150ms for geographically distributed regions) for these specific high-consistency keys.
- Use event streaming (Kafka, AWS EventBridge) to propagate cache invalidation messages cross-region. When Region A writes a user record, publish an invalidation event; Region B's consumer deletes or refreshes the corresponding cache key.
- Never use Redis Cluster to span regions across a WAN link. Cluster gossip protocol and replication are not designed for high-latency, unreliable links. Use separate clusters per region with application-level coordination.

---

## Example

**Input:** "We have a product catalog API backed by PostgreSQL. There are 500,000 products. Read traffic is approximately 50,000 requests/minute during peak. About 95% of those reads target the same 10,000 products. Writes (price updates, stock changes) happen at about 200/minute. Product page response time is currently 180ms p50, 420ms p95. We are running 8 Node.js application instances. We want to get p50 below 20ms."

---

**Output:**

## Caching Architecture Analysis

### Workload Profile

| Data Entity         | Access Pattern       | Read:Write Ratio | Cacheable | Notes                                      |
|---------------------|----------------------|------------------|-----------|--------------------------------------------|
| Product detail      | Heavily skewed (Zipf)| 250:1            | Yes       | 10K hot products out of 500K total         |
| Product price       | Hot subset same 10K  | 250:1            | Yes       | Staleness tolerance: 30s acceptable        |
| Stock availability  | Hot subset           | 150:1            | Yes       | Staleness tolerance: 5s; never cache 0-stock as "in-stock" |
| Product images/media| CDN-served           | --               | CDN layer | Out of scope for this analysis             |

**Assessment:** The 95%/10K hotspot concentration is ideal for caching. A 10,000-product cache at ~2KB per serialized product record = 20MB -- trivially small for in-process or Redis caching. This is a textbook Zipf distribution; even an L1 in-process cache with a 60-second TTL will absorb most traffic before it reaches PostgreSQL.

---

### Recommended Caching Stack

- **Layer 1 (in-process LRU):** `node-lru-cache` with max 15,000 items, TTL 60 seconds with ±10s jitter -- for product detail and price, hot path only.
- **Layer 2 (distributed):** Redis standalone (single instance sufficient at this write rate; Redis Cluster overhead is not justified below 100K writes/minute), `maxmemory 2gb`, `allkeys-lfu` eviction policy (LFU is better than LRU for Zipf-distributed hotspot access).
- **TTL on Redis:** Product detail: 300s ±30s. Product price: 30s ±5s. Stock availability: 10s ±2s.
- **maxmemory:** 2GB on a 4GB host (50%, conservative -- this is a small working set; leave headroom for Redis overhead and future growth).

---

### Pattern Selection

| Data Entity          | Pattern               | TTL            | Invalidation Trigger                  | Consistency Guarantee |
|----------------------|-----------------------|----------------|---------------------------------------|-----------------------|
| Product detail       | Read-through (L1+L2)  | L1: 60s, L2: 300s | Price/stock update event            | Eventual (≤ 310s max staleness) |
| Product price        | Cache-aside + write-through | L1: 30s, L2: 30s | Price update webhook/event | Eventual (≤ 35s) |
| Stock availability   | Cache-aside           | 10s ±2s        | Stock mutation event                  | Eventual (≤ 12s) |

**Note on write-through for prices:** Price updates happen at 200/minute -- the write overhead is negligible. The consistency improvement (cache updated immediately on write) eliminates the window where users see stale prices without complex invalidation logic.

---

### Cache Key Schema

| Entity              | Key Template                              | Example                              |
|---------------------|-------------------------------------------|--------------------------------------|
| Product detail      | `catalog:product:{productId}:v3`          | `catalog:product:84729:v3`           |
| Product price       | `catalog:price:{productId}:v1`            | `catalog:price:84729:v1`             |
| Stock availability  | `catalog:stock:{productId}:v1`            | `catalog:stock:84729:v1`             |

Version suffix `v3` on product detail allows a full cache bust by incrementing to `v4` in a config variable -- all `v3` keys expire naturally via TTL.

---

### Thundering Herd Mitigation

For a 10,000 product working set with 8 Node.js instances, synchronized TTL expiration at peak traffic (50K RPM) could send up to 6,250 RPM to PostgreSQL in a worst case. Jitter alone is sufficient at this scale -- no distributed mutex needed.

If traffic were 10x higher, implement a per-key mutex using Redis SET NX:
```javascript
// Pseudo-mutex to prevent stampede on high-traffic keys
const lockKey = `lock:catalog:product:${productId}`;
const acquired = await redis.set(lockKey, '1', 'NX', 'EX', 5);
if (!acquired) {
  // Wait up to 200ms for the lock holder to populate cache
  await sleep(50 + Math.random() * 150);
  return getProductFromCacheOrDB(productId); // retry
}
```

---

### Implementation Skeleton (Node.js)

```javascript
import { LRUCache } from 'lru-cache';
import { createClient } from 'redis';

// Layer 1: In-process LRU
const l1Cache = new LRUCache({
  max: 15_000,
  ttl: 60_000, // 60 seconds base; jitter applied on set
  ttlResolution: 1000,
});

// Layer 2: Redis
const redis = createClient({ url: process.env.REDIS_URL });
await redis.connect();

const JITTER_FACTOR = 0.15; // ±15%

function withJitter(ttlSeconds) {
  const jitter = (Math.random() * 2 - 1) * JITTER_FACTOR;
  return Math.round(ttlSeconds * (1 + jitter));
}

async function getProduct(productId) {
  const l1Key = `product:${productId}`;

  // L1 hit
  const l1Hit = l1Cache.get(l1Key);
  if (l1Hit) {
    metrics.increment('cache.l1.hit');
    return l1Hit;
  }
  metrics.increment('cache.l1.miss');

  // L2 hit
  const redisKey = `catalog:product:${productId}:v3`;
  const l2Hit = await redis.get(redisKey);
  if (l2Hit) {
    metrics.increment('cache.l2.hit');
    const parsed = JSON.parse(l2Hit);
    // Populate L1 from L2 hit
    l1Cache.set(l1Key, parsed, { ttl: withJitter(60) * 1000 });
    return parsed;
  }
  metrics.increment('cache.l2.miss');

  // Database fallback
  const product = await db.query(
    'SELECT * FROM products WHERE id = $1',
    [productId]
  );

  if (!product) return null;

  // Populate both layers
  const serialized = JSON.stringify(product);
  await redis.setEx(redisKey, withJitter(300), serialized);
  l1Cache.set(l1Key, product, { ttl: withJitter(60) * 1000 });

  return product;
}

// Write-through for price updates
async function updatePrice(productId, newPrice) {
  // 1. Write to database first (source of truth)
  await db.query(
    'UPDATE products SET price = $1 WHERE id = $2',
    [newPrice, productId]
  );

  // 2. Update cache synchronously (write-through)
  const redisKey = `catalog:price:${productId}:v1`;
  await redis.setEx(redisKey, withJitter(30), JSON.stringify({ price: newPrice }));

  // 3. Invalidate product detail cache to force refresh with new price
  await redis.unlink(`catalog:product:${productId}:v3`);
  l1Cache.delete(`product:${productId}`);
}
```

---

### Monitoring Targets

| Metric              | Warning Threshold | Critical Threshold | Action                                      |
|---------------------|-------------------|--------------------|---------------------------------------------|
| L1 hit rate         | < 70%             | < 50%              | Increase LRU max size; check hotspot shift  |
| L2 hit rate         | < 85%             | < 70%              | Review TTL settings; check eviction rate    |
| Redis memory usage  | > 1.5GB (75%)     | > 1.7GB (85%)      | Evaluate working set size; scale memory     |
| Redis eviction rate | > 50/min          | > 500/min          | Cache undersized for working set            |
| DB query rate (RPM) | > 5,000           | > 15,000           | Cache miss storm or cache failure           |
| p95 response time   | > 50ms            | > 200ms            | Investigate cache layer; check L2 latency  |

---

### Expected Outcome

With this two-layer cache implementation:
- The top 10,000 products (95% of traffic) will be served from L1 in-process memory at sub-millisecond latency after warm-up.
- PostgreSQL query rate drops from ~50,000 RPM to approximately 500-2,000 RPM (misses, TTL expirations, cold keys).
- p50 latency target of < 20ms is achievable -- the L1 cache hit path adds only 0.1-0.5ms overhead, well within the budget.
- p95 will depend on the L2 Redis path for L1 misses -- expect 5-15ms for Redis-served responses on co-located infrastructure.
- Write-through on prices ensures no stale price window exceeds 12 seconds (stock) to 35 seconds (product detail) for the worst-case dual-TTL scenario.
