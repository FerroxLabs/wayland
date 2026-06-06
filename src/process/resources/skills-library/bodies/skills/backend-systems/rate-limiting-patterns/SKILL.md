---
name: rate-limiting-patterns
description: |
  Guides expert-level rate limiting patterns implementation: security and optimization decision frameworks, production-ready patterns, and concrete templates for rate limiting patterns workflows.
  Use when the user asks about rate limiting patterns, rate limiting patterns configuration, or security best practices for rate projects.
  Do NOT use when the user needs a different backend infrastructure capability -- check sibling skills in the backend infrastructure subcategory.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "security optimization backend"
  category: "backend-systems"
  subcategory: "backend-infrastructure"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Rate Limiting Patterns

## When to Use

**Use this skill when:**
- User needs to protect an API endpoint from abuse, DDoS amplification, or runaway clients consuming disproportionate resources
- User is designing a multi-tenant SaaS platform and needs to enforce per-customer quotas (e.g., 1,000 API calls/day on the free tier, 100,000 on pro)
- User has an existing system experiencing "thundering herd" problems -- many clients retrying simultaneously after an outage, overwhelming recovery
- User needs to implement backpressure in a microservices architecture to prevent a slow downstream service from cascading failures upstream
- User is building a login, registration, or password-reset endpoint and needs brute-force protection with IP-based and account-based throttling
- User is adding rate limiting to a message queue consumer, webhook processor, or batch job to control throughput against third-party APIs with their own rate limits
- User asks about token bucket, leaky bucket, sliding window, or fixed window algorithms by name
- User needs to coordinate rate limiting state across multiple horizontally-scaled application instances using a shared store

**Do NOT use this skill when:**
- User needs circuit breaker patterns for downstream failure handling -- that is a separate resilience pattern (see circuit-breaker-patterns skill)
- User needs API gateway configuration for routing, authentication middleware, or TLS termination -- rate limiting at the gateway level is a thin wrapper around the patterns here but gateway config is its own skill
- User needs database connection pooling limits -- those are resource pool constraints, not rate limiting
- User needs load balancing algorithms or autoscaling policies -- those address capacity, not request control
- User is asking about content delivery network edge caching -- CDN throttling is vendor-specific and distinct from application-level rate limiting
- User needs queue-depth-based backpressure inside a Kafka or RabbitMQ consumer pipeline -- see message-queue-patterns skill
- User needs to audit or log access attempts for compliance purposes alone, without a throttling requirement

---

## Process

### 1. Classify the Rate Limiting Problem

Before selecting an algorithm, identify which of these four problem classes applies:

- **Abuse prevention** -- External clients (users, bots, scrapers) sending more requests than your system can or should serve. The primary constraint is fairness and security. Identity granularity is per-IP, per-user, or per-API-key.
- **Quota enforcement** -- Business-rule limits that gate feature access by plan tier. The primary constraint is accurate accounting over a billing period (hourly, daily, monthly). Identity granularity is per-account or per-organization.
- **Throughput control** -- Your own system calling a third-party API with published rate limits (e.g., Stripe allows 100 req/s in live mode, Twilio allows 1 req/s per phone number). The constraint is compliance with the upstream limit, not fairness.
- **Backpressure / load shedding** -- Your own services protecting themselves from traffic spikes that exceed safe operating capacity. The constraint is system stability. Identity granularity is often the entire inbound traffic stream, not per-client.

Each class maps to different algorithm choices and storage strategies. Mixing these up leads to over-engineered solutions (applying a distributed sliding window to a simple single-server throughput control problem) or under-engineered ones (using a fixed window for quota enforcement, producing double-the-quota edge effects).

### 2. Select the Algorithm

Choose based on the problem class, burst tolerance, and accuracy requirements:

**Fixed Window Counter**
- Divide time into fixed slots (e.g., each minute starts at :00). Increment a counter per slot. Reset when the slot expires.
- Implementation: one Redis `INCR` + `EXPIRE` per request. Extremely cheap at ~0.1ms round-trip.
- Fatal flaw: a client can send 2x the limit by sending the full quota at 11:59:59 and the full quota again at 12:00:00. This is the "window boundary burst" problem.
- Use when: internal throughput controls where burst spikes are acceptable and implementation simplicity matters. NOT for abuse prevention.

**Sliding Window Log**
- Store a timestamped log of every request in the window. On each new request, evict entries older than the window and count remaining entries.
- Implementation: Redis sorted set with `ZADD` (score = timestamp in milliseconds), `ZREMRANGEBYSCORE` to evict, `ZCARD` to count. Wrap in a Lua script or pipeline for atomicity.
- Cost: O(log N) per request plus memory proportional to requests-per-window. At 1,000 req/window per user, storage is acceptable. At 100,000 req/window, the sorted set becomes expensive.
- Use when: strict accuracy is required and per-client request volumes are moderate. Best for abuse prevention and authentication endpoints.

**Sliding Window Counter (Approximate)**
- Hybrid of fixed window and sliding window log. Track counts for the current and previous fixed windows. Interpolate: `count = previous_window_count * ((window_size - elapsed_in_current_window) / window_size) + current_window_count`.
- Implementation: two counters in Redis, ~0.15ms. Accuracy is within 0.1% of the true sliding window for most traffic distributions.
- Use when: abuse prevention at scale where the log approach would use too much memory. This is the algorithm Redis's own rate limiting modules use by default.

**Token Bucket**
- A bucket holds up to `capacity` tokens. Tokens refill at a fixed rate (e.g., 100 tokens/second). Each request consumes one or more tokens. If the bucket is empty, the request is rejected or queued.
- Key parameters: `capacity` (maximum burst size), `refill_rate` (sustained throughput).
- Implementation: store `(token_count, last_refill_timestamp)` in Redis. On each request: compute tokens earned since last refill, add to stored count (capped at capacity), attempt to consume, store updated state. Lua script for atomicity.
- Use when: you want to allow controlled bursts up to `capacity` while enforcing a sustained `refill_rate`. Ideal for API quota enforcement and third-party API throughput control.
- Example configuration: a client is allowed 20 burst requests and 5 req/s sustained. Set `capacity=20`, `refill_rate=5`.

**Leaky Bucket**
- Requests enter a queue (the bucket). A worker drains the queue at a fixed rate. If the queue is full, new requests are rejected.
- This enforces a perfectly smooth output rate regardless of bursty input -- the "leak" is constant.
- Implementation: a queue + rate-limited consumer. In application code, often implemented as a semaphore or async queue with a fixed drain interval.
- Use when: you need to call a downstream API at exactly N req/s with no bursts allowed (e.g., a legacy SMS gateway that cannot tolerate even short spikes). Not suitable for user-facing latency-sensitive endpoints because queuing adds variable delay.

**Concurrency Limiting (Inflight Request Counting)**
- Limit the number of simultaneous in-progress requests, not the rate over time. Use a semaphore counter: increment on request start, decrement on completion.
- This is the correct pattern for protecting CPU-bound or DB-bound endpoints where response time, not throughput, determines system stress.
- Implementation: Redis `INCR` / `DECR` with a ceiling check, or an in-process semaphore for single-instance services.
- Use when: your endpoint does expensive computation (ML inference, PDF generation, complex DB queries) and the risk is resource exhaustion from concurrent load, not request rate.

### 3. Choose Identity Granularity and Key Structure

The key structure determines what you are limiting and at what resolution:

- **IP-based:** `rl:{endpoint}:ip:{ip_address}` -- Effective for unauthenticated abuse but trivially bypassed by botnets with many IPs. Always use as one layer, never as the only layer.
- **User/account-based:** `rl:{endpoint}:user:{user_id}` -- The correct primary key for authenticated APIs. Survives IP rotation.
- **API-key-based:** `rl:{endpoint}:key:{api_key_hash}` -- Use the key's hash, never the raw key, as part of a Redis key to avoid key leakage through monitoring tools.
- **Tenant-based:** `rl:tenant:{tenant_id}` -- Aggregate all users within an organization against a shared quota. Critical for multi-tenant SaaS.
- **Endpoint-specific:** Always include the endpoint or endpoint category in the key. A user exhausting their image-upload quota should not affect their ability to read data. Use endpoint categories to group related paths: `rl:write:user:{user_id}`, `rl:read:user:{user_id}`, `rl:auth:ip:{ip}`.
- **Layered keys:** For robust abuse prevention, apply multiple keys simultaneously: `rl:login:ip:{ip}` (10 attempts/minute per IP) AND `rl:login:account:{username_hash}` (5 attempts/15 minutes per account). An attacker who rotates IPs still hits the per-account limit.

### 4. Design the Response Strategy

Rate limiting decisions are useless without a consistent response strategy:

- **HTTP 429 Too Many Requests** is the correct status code. Never use 503 for rate limiting -- that signals server unavailability, not client throttling.
- **Required response headers:**
  - `Retry-After: <seconds>` -- When the client can retry. This is the single most important header. Without it, well-behaved clients will use exponential backoff with arbitrary timing.
  - `X-RateLimit-Limit: <N>` -- The total limit in the current window.
  - `X-RateLimit-Remaining: <N>` -- Tokens/requests remaining.
  - `X-RateLimit-Reset: <unix_timestamp>` -- When the window resets (for fixed/sliding window) or when the bucket will have capacity again (for token bucket).
- **Soft vs. hard limits:** Consider implementing a soft limit at 80% of quota that adds a warning header (`X-RateLimit-Warning: approaching limit`) but still serves the request. This gives API consumers time to throttle themselves before hitting the hard limit.
- **Queuing vs. rejection:** For internal service-to-service calls, prefer queuing short waits (up to 200ms) before rejecting. For user-facing APIs, prefer immediate 429 rejection to avoid holding connections.
- **Dry-run mode:** Before enforcing limits on production traffic, run your limiter in "log only" mode for 24-48 hours. Record what would have been rejected. This calibrates thresholds without impacting legitimate users.

### 5. Select the Storage Backend

Rate limiting state must be fast, atomic, and -- for multi-instance deployments -- shared:

- **In-process memory (single instance only):** A HashMap with AtomicInteger counters. Sub-microsecond access. Suitable for single-process services, local development, or where approximate limiting per-instance is acceptable. State is lost on restart and not shared across instances.
- **Redis (the industry standard for distributed rate limiting):**
  - Use Redis 6+ for ACL support. Redis 7+ for client-side caching optimizations.
  - Always wrap counter operations in Lua scripts to ensure atomicity. A `GET` followed by `INCR` is a TOCTOU race condition.
  - Use `MULTI`/`EXEC` transactions only when Lua is not available. Lua is faster because it avoids round-trips.
  - Set key TTLs equal to the window size plus a 10% buffer to handle clock skew. A 60-second window gets a 66-second TTL.
  - For token bucket, store state as a Redis Hash: `HSET rl:key tokens 20 last_refill 1700000000000`.
  - Deploy Redis with replication but understand that replica reads introduce slight staleness. For rate limiting, always read and write to the primary.
  - Connection pool size: for rate limiting, each application thread needs at most one Redis connection in flight at a time. Pool size = (number of application threads) * 1.2 as a starting point.
- **Database (PostgreSQL, MySQL):** Acceptable for quota enforcement where the window is hours or days and you tolerate 1-5ms write latency. Use `INSERT ... ON CONFLICT DO UPDATE` (upsert) for atomic counter increments. Not acceptable for per-request abuse prevention (too slow).
- **Distributed caches (Memcached):** Supports atomic increment via the `incr` command but lacks Lua scripting, sorted sets for sliding window logs, and TTL-per-key precision. Use only for fixed window counters if Redis is unavailable.
- **Sticky sessions / consistent hashing:** If Redis is unavailable and you must use local memory, use consistent hashing to route the same client always to the same instance. This is fragile and should be a last resort.

### 6. Implement Atomicity and Handle Race Conditions

Rate limiting is fundamentally a concurrency problem. Every implementation must address these races:

- **The check-then-act race:** Thread A reads count=99 (limit=100), Thread B reads count=99, both write 100. Result: 101 requests processed. Solution: use atomic operations -- Redis `INCR` returns the new value in one operation.
- **Distributed clock skew:** Across multiple servers, clocks can differ by 10-50ms. This affects sliding window accuracy. Use Redis server-side timestamps (Lua's `redis.call('TIME')`) rather than client-supplied timestamps for window boundaries.
- **Key expiry race:** A key expires between your `EXISTS` check and your `INCR`. Solution: always use `INCR` and `EXPIRE` together in a Lua script; never check existence first.
- **The canonical Redis Lua script for sliding window counter:**

```lua
-- KEYS[1] = current window key, KEYS[2] = previous window key
-- ARGV[1] = window size in seconds, ARGV[2] = limit, ARGV[3] = current timestamp
local curr_key = KEYS[1]
local prev_key = KEYS[2]
local window = tonumber(ARGV[1])
local limit = tonumber(ARGV[2])
local now = tonumber(ARGV[3])
local window_start = now - (now % window)
local elapsed = now - window_start
local prev_weight = (window - elapsed) / window

local curr_count = tonumber(redis.call('GET', curr_key) or 0)
local prev_count = tonumber(redis.call('GET', prev_key) or 0)
local count = math.floor(prev_count * prev_weight + curr_count)

if count >= limit then
  return {0, limit - count, window - elapsed}
end

local new_count = redis.call('INCR', curr_key)
if new_count == 1 then
  redis.call('EXPIRE', curr_key, window * 2)
end
return {1, limit - new_count - math.floor(prev_count * prev_weight), window - elapsed}
```

- Return values: `{allowed, remaining, retry_after_seconds}`

### 7. Configure Thresholds Based on Real Traffic Analysis

Threshold selection is where most implementations fail. Never guess limits:

- **Capture baseline traffic** before configuring limits. Instrument your endpoints to record p50, p95, p99 request rates per user/IP over a 7-day window. Your limit should exceed the p99 legitimate user rate by at least 2x.
- **Common starting points (adjust based on your data):**
  - Public unauthenticated endpoints: 60 req/min per IP, 300 req/5min per IP
  - Authentication endpoints (login, password reset): 5 attempts/15min per account, 20 attempts/15min per IP
  - Standard authenticated API reads: 1,000 req/min per user
  - Authenticated API writes: 100 req/min per user
  - Expensive endpoints (search, reports, exports): 10 req/min per user
  - Webhooks received from third parties: match their published retry policy (e.g., if they retry 3x over 5 minutes, accept at least 5 req/5min from their IP range)
- **Burst sizing:** Set token bucket capacity at 10-20% of the per-minute rate. If your sustained limit is 60 req/min (1 req/s), a burst capacity of 10-12 tokens absorbs legitimate spikes without enabling sustained abuse.
- **Alerting thresholds:** Alert when any single key exceeds 50% of its limit within the first 20% of the window. This early warning catches runaway clients before they hit the hard limit and disrupt themselves.

### 8. Test and Validate Rate Limiting Behavior

Rate limiting bugs are silent -- they either fail open (no limiting) or fail closed (blocking legitimate traffic):

- **Test the boundary exactly:** Send exactly N requests (the limit) and verify the Nth succeeds. Send N+1 and verify the 429. Off-by-one errors are common in window boundary calculations.
- **Test window rollover:** Send the limit, wait for the window to expire, send again -- verify the counter resets. Common bug: using wall-clock time vs. server time causes mismatches.
- **Test concurrent requests:** Use a load testing tool (k6, Gatling, or Apache Bench) to send 50 concurrent requests when the limit is 10. Verify that exactly 10 succeed and 40 return 429. Failures indicate race conditions.
- **Test Redis failure mode:** What happens when Redis is unreachable? You must have an explicit policy: fail open (allow all requests) or fail closed (reject all requests). Document and test this. Most systems fail open for rate limiting because the alternative (complete outage) is worse.
- **Test header accuracy:** Verify `X-RateLimit-Remaining` decrements correctly, `X-RateLimit-Reset` is a valid future timestamp, and `Retry-After` reflects the actual wait time.
- **Load test threshold calibration:** Replay 7 days of production traffic at 10x speed through the configured limiter in staging. Measure false-positive rate (legitimate requests blocked). Target below 0.1% false positives.

---

## Output Format

```
## Rate Limiting Design: [Service/Endpoint Name]

### Problem Classification
- Problem Class: [Abuse Prevention | Quota Enforcement | Throughput Control | Backpressure]
- Traffic Pattern: [Authenticated | Unauthenticated | Mixed]
- Scale: [Single-instance | Multi-instance | Multi-region]
- Sensitivity: [User-facing latency-critical | Background/async | Internal service]

### Algorithm Selection

| Algorithm           | Burst Tolerance | Memory Cost | Accuracy | Complexity | Recommended For        |
|---------------------|-----------------|-------------|----------|------------|------------------------|
| Fixed Window        | High (2x burst) | O(1)        | Low      | Low        | Internal throughput    |
| Sliding Window Log  | None            | O(N)        | Exact    | Medium     | Auth endpoints         |
| Sliding Window Approx| Minimal        | O(1)        | ~99.9%   | Medium     | General abuse prevention|
| Token Bucket        | Configurable    | O(1)        | Exact    | Medium     | API quota enforcement  |
| Leaky Bucket        | None (queued)   | O(queue)    | Exact    | High       | Smooth downstream calls|
| Concurrency Limit   | N/A             | O(1)        | Exact    | Low        | CPU/DB-bound endpoints |

**Selected Algorithm:** [Algorithm name]
**Rationale:** [2-3 sentences explaining the specific choice based on the problem]

### Key Structure
```
Primary key:   rl:[endpoint_category]:[identity_type]:[identity_value]
Secondary key: rl:[endpoint_category]:ip:[ip_address]   (layered, if applicable)
Example:       rl:auth:user:u_a3f9b2
Example:       rl:write:key:sha256(api_key)[:8]
```

### Threshold Configuration
| Endpoint / Category | Limit | Window | Burst Capacity | Algorithm   |
|---------------------|-------|--------|----------------|-------------|
| [endpoint]          | [N]   | [Xs]   | [B]            | [algorithm] |

### Response Strategy
- Success headers: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset
- Rejection status: 429 Too Many Requests
- Rejection headers: Retry-After, X-RateLimit-Limit, X-RateLimit-Reset
- Failure mode (backend unavailable): [Fail open | Fail closed] with rationale
- Soft limit warning at [X]% of quota: [Yes/No]

### Storage Configuration
- Backend: [Redis / In-process / Database]
- Key TTL: [window_size * 2] seconds
- Atomicity mechanism: [Lua script / MULTI-EXEC / atomic operations]
- Connection pool size: [N]
- Failure handling: [circuit breaker config / fallback policy]

### Implementation

```[language]
[Complete, runnable implementation for the selected algorithm]
```

### Test Plan
- [ ] Boundary test: Nth request succeeds, N+1 returns 429
- [ ] Window rollover test: counter resets after window expiry
- [ ] Concurrent request test: N concurrent requests, exactly [limit] succeed
- [ ] Backend failure test: behavior when Redis is unreachable
- [ ] Header accuracy test: Retry-After reflects actual wait time
- [ ] False positive rate: target < 0.1% of legitimate traffic blocked
```

---

## Rules

1. **NEVER use a fixed window algorithm for authentication endpoints.** The 2x-burst-at-boundary vulnerability directly enables brute-force attacks that a naive fixed window will not catch. A 10-attempt/minute fixed window allows 20 attempts in a 2-second span at the minute boundary. Always use sliding window log or sliding window approximate for auth.

2. **NEVER perform rate limit state reads and writes as separate non-atomic operations.** A `GET` followed by `SET` or `INCR` creates a TOCTOU race condition that allows clients to exceed limits under concurrent load. Always use atomic operations -- Redis Lua scripts are the standard solution.

3. **ALWAYS return `Retry-After` in the 429 response.** Without this header, well-behaved clients implement arbitrary exponential backoff that creates unpredictable retry storms. With it, clients can schedule exact retries, reducing retry traffic by 60-80%.

4. **NEVER rate limit on raw IP address alone for authenticated endpoints.** IP addresses are shared (NAT, corporate proxies, carrier-grade NAT) and easily rotated (botnets, VPNs). IP-only limits will block entire offices or fail to stop distributed attackers. Always combine IP limits as a secondary layer on top of per-user or per-key limits.

5. **ALWAYS store API keys or sensitive identifiers as hashes in rate limit keys.** If your monitoring tool, slow log, or error tracker captures Redis key names, a raw API key embedded in a key name constitutes a credential leak. Use `sha256(api_key)` or a truncated version as the key component.

6. **NEVER set rate limit thresholds without measuring actual traffic first.** Limits set by intuition will either be too restrictive (causing false positives for legitimate users) or too permissive (failing to stop abuse). Capture p99 legitimate request rates over at least 7 days and set limits at 2x-3x that value.

7. **ALWAYS define and test the failure mode when the rate limit backend is unavailable.** Unplanned Redis downtime with no explicit failure policy causes undefined behavior -- some implementations will fail open (no limiting), others will throw unhandled exceptions that return 500 errors. Document and test this explicitly. For user-facing APIs, fail open is usually correct. For authentication endpoints, fail closed (or route to a secondary limiter) is safer.

8. **NEVER share a single rate limit counter across multiple endpoint categories.** A user exhausting their write quota by uploading files should not prevent them from making read requests or checking their account status. Segment limits by endpoint category (reads, writes, auth, expensive operations) with independent counters.

9. **ALWAYS set Redis key TTLs to at least 2x the window size.** A TTL equal to the window size creates a race condition: the key expires while you are mid-window, resetting the counter prematurely. Add a 100% buffer. For a 60-second window, use a 120-second TTL. The small memory overhead is worth the correctness guarantee.

10. **NEVER implement rate limiting inside a database transaction that also performs business logic.** The rate limit check-and-increment must be the first operation before any database writes, external calls, or expensive computation. If the rate check is inside a transaction, a slow query or lock contention in the business logic holds the connection while the rate limit state is unresolved, creating cascading latency under load.

---

## Edge Cases

**Distributed multi-region deployments with Redis replication lag:**
When your application runs in multiple geographic regions (e.g., us-east-1 and eu-west-1), a global Redis primary in one region introduces 40-150ms cross-region latency on every rate-checked request. Solutions in priority order: (1) Use Redis Cluster with consistent hashing so most rate limit keys are resolved locally. (2) Accept per-region limiting -- each region enforces the full limit independently, giving users up to N * regions requests globally. This is acceptable for abuse prevention but not quota enforcement. (3) For quota enforcement, use eventual consistency via a periodic sync: local Redis instances for real-time checking, async aggregation to a central store every 5 seconds, with a 10-15% headroom buffer to absorb the sync lag. Never use Redis Replication (primary-replica) for rate limiting reads -- replica lag means you may read stale counts and allow over-limit requests.

**Rate limiting WebSocket connections and streaming endpoints:**
HTTP request-level rate limiting does not apply to long-lived WebSocket connections or server-sent event streams. Apply rate limiting at three points: (1) connection establishment -- limit how many connections per user can be opened per minute using a concurrency limiter; (2) message rate within a connection -- apply a per-connection token bucket with capacity=50 and refill_rate=10 msg/s, enforced in-process without a Redis round-trip per message; (3) total active connection count -- enforce a global concurrency limit of max_concurrent_connections_per_user=5. When the message rate limit is hit, close the connection with WebSocket close code 1008 (Policy Violation) rather than simply dropping messages silently.

**Mobile and browser clients behind carrier-grade NAT (CGNAT):**
Mobile carriers increasingly use CGNAT, where millions of mobile users share a single public IP address. An IP-based limit of 60 req/min would trigger constantly for a popular API in a mobile app. Detect CGNAT IPs by checking against published CGNAT ranges (100.64.0.0/10) and cellular ASN ranges. For detected CGNAT sources, either (1) elevate the per-IP limit 10x while applying stricter per-user/device-token limits, or (2) disable IP-based limiting entirely for unauthenticated traffic from these sources and rely solely on per-device-token or per-session limits. Log the CGNAT detection decision for audit purposes.

**Rate limit evasion via distributed clients:**
A sophisticated attacker who controls many IPs (botnet) or many accounts (account farming) can distribute requests to stay under per-IP and per-user limits. Countermeasures: (1) Add a global endpoint-level rate limit that caps total requests regardless of identity -- if your endpoint normally receives 10,000 req/min and suddenly sees 50,000, something is wrong. (2) Apply behavioral fingerprinting signals beyond IP and user-id: User-Agent consistency, request timing entropy, TLS fingerprint (JA3 hash). Feed these signals into a separate abuse detection layer that can dynamically adjust rate limit thresholds for suspicious clients. (3) Implement progressive penalties -- a client that has hit the rate limit 3 times in the last hour gets a 5-minute timeout instead of the standard window-reset time.

**Third-party API rate limit compliance with retry logic:**
When your system calls a third-party API with published limits (e.g., GitHub API: 5,000 req/hr for authenticated requests, 60 req/hr for unauthenticated), implement a leaky bucket or token bucket client-side before making calls. Key details: (1) Respect the `X-RateLimit-Remaining` and `X-RateLimit-Reset` headers in responses -- use them to refill your local bucket rather than relying solely on your own calculations. (2) When you receive a 429, do not immediately retry -- read the `Retry-After` header and sleep exactly that duration. Implement this with a scheduled retry queue, not a blocking sleep. (3) Reserve 10% of quota as a buffer (never consume more than 90% of stated limit) to account for clock skew and concurrent callers. (4) If the API uses burst-then-throttle behavior (allows 100 req in first 10 seconds, then 1 req/s for remainder of minute), model this as a token bucket with `capacity=100`, `refill_rate=1`.

**Rate limit bypass via HTTP method and path variations:**
Naively keyed rate limiters that use the literal request path will miss variations: `/api/v1/users` vs `/api/v1/users/` (trailing slash), `/API/V1/USERS` (case variation), `/api/v1/users?page=1` vs `/api/v1/users?page=2` (query parameters). Always normalize before keying: lowercase the path, strip trailing slashes, and exclude query parameters from the rate limit key (limit the endpoint, not the parameterized variant). For REST APIs, normalize HTTP methods: `GET /users/123` and `HEAD /users/123` should share the read quota counter. `POST`, `PUT`, `PATCH`, and `DELETE` should share a write quota counter regardless of path parameters.

**Burst traffic from legitimate automated clients (CI pipelines, data imports):**
CI pipelines, bulk data importers, and automated reporting jobs are legitimate but high-volume. They should not be treated as abuse. Solutions: (1) Issue separate API keys for automated clients with higher rate limits appropriate to their use case. Tag these keys with a `client_type=automation` label and configure separate, higher limits for that key category. (2) Provide a "bulk" endpoint that accepts batched operations (up to 100 items per request) and counts as one request against the rate limit -- this reduces the request rate by 100x for the same work. (3) Implement a request queue endpoint: the client submits a job, receives a job ID, polls for completion. The queue enforces rate limits internally without exposing the limit to the client. This is the correct pattern for large data exports that may take minutes to complete.

**Redis eviction under memory pressure:**
Redis uses LRU/LFU eviction when `maxmemory` is reached. If rate limiting keys are evicted, counters reset, allowing clients to bypass limits for the eviction period. Prevention: (1) Use a dedicated Redis instance (or dedicated database index `SELECT 1`) for rate limiting, isolated from caching workloads that are the primary source of memory pressure. (2) Configure `maxmemory-policy noeviction` for the rate limiting Redis instance -- this causes writes to fail rather than silently evicting keys. Your application must handle `OOM` errors from Redis as a "fail open" scenario. (3) Set conservative `maxmemory` limits (80% of available RAM) with alerting at 70% to give time to respond before eviction begins. (4) Estimate memory requirements: each sliding window counter pair uses ~100 bytes in Redis. For 1 million active users each with 5 endpoint categories and a 60-second window, that is ~500 MB -- size your instance accordingly.

---

## Example

**Input:** "We have a multi-tenant REST API built with Node.js and Express. We use Redis for session storage already. We're seeing some tenants hammering our AI-generated report endpoint -- it triggers expensive LLM calls that cost us about $0.50 each. We want to protect it without breaking our legitimate power users. We have 3 application instances behind a load balancer."

**Output:**

## Rate Limiting Design: AI Report Generation Endpoint

### Problem Classification
- **Problem Class:** Quota Enforcement + Abuse Prevention (hybrid -- cost protection + fairness)
- **Traffic Pattern:** Authenticated (tenant API keys)
- **Scale:** Multi-instance (3 nodes, shared Redis already deployed)
- **Sensitivity:** Latency-tolerant (report generation takes 5-30 seconds anyway, 1ms Redis overhead is negligible)

### Algorithm Selection

The report endpoint has two distinct concerns: preventing runaway abuse within a short window (abuse prevention) and enforcing a daily cost budget per tenant (quota enforcement). Use a **two-layer token bucket** approach:

| Layer | Algorithm | Window | Limit | Purpose |
|-------|-----------|--------|-------|---------|
| Burst protection | Token Bucket | Per-minute sustained | 5 req/min | Prevent rapid-fire abuse |
| Daily quota | Token Bucket | 24-hour rolling | 100 req/day | Cost budget per tenant |

**Selected Algorithm:** Token Bucket (two independent buckets per tenant)
**Rationale:** Token bucket allows you to configure burst capacity separately from sustained rate, which is critical here. A tenant who has been idle all morning should be able to run 10 reports quickly (burst=10) while still being capped at 5/min sustained. The daily quota bucket uses a 24-hour window that aligns with billing cycles and gives tenants predictable budget management.

### Key Structure

```
Per-minute bucket:  rl:report:burst:tenant:{tenant_id}
Daily quota bucket: rl:report:daily:tenant:{tenant_id}
Abuse guard (IP):   rl:report:ip:{ip_address}   (secondary, 30 req/hour per IP)

Examples:
  rl:report:burst:tenant:t_8f2a1c
  rl:report:daily:tenant:t_8f2a1c
  rl:report:ip:198.51.100.42
```

### Threshold Configuration

| Layer | Limit | Window | Burst Capacity | TTL |
|-------|-------|--------|----------------|-----|
| Per-minute sustained | 5 req/min | 60s | 10 tokens | 120s |
| Daily quota | 100 req/day | 86,400s | 20 tokens (morning burst) | 172,800s |
| IP guard | 30 req/hr | 3,600s | 15 tokens | 7,200s |

**Threshold rationale:** The current "power users" sending the most reports -- measure their 7-day p99 rate first. If your top legitimate user sends 8 reports in a 5-minute burst occasionally, set burst capacity to 12. The 100/day limit is derived from `$50/day budget per tenant / $0.50 per report`. Adjust for your actual cost targets.

### Response Strategy
- Success: `200 OK` with `X-RateLimit-Limit: 100`, `X-RateLimit-Remaining: 87`, `X-RateLimit-Reset: 1700086400`
- Soft warning at 80% of daily quota: Add `X-RateLimit-Warning: 80 of 100 daily reports used`
- Rejection: `429 Too Many Requests` with `Retry-After: 47` (seconds until bucket refills)
- Rejection body: `{"error": "rate_limit_exceeded", "limit_type": "daily_quota", "resets_at": 1700086400, "limit": 100, "message": "Daily report quota exhausted. Quota resets at midnight UTC."}`
- Failure mode (Redis unavailable): **Fail open** -- allow the request but log a `RATE_LIMIT_BYPASS` event with tenant ID and timestamp. Alert on-call if bypass rate exceeds 1% of requests. The cost of a brief window of unmetered requests is less than a full outage for all tenants.

### Storage Configuration
- Backend: Existing Redis instance (use database index 1 to isolate from session data in index 0)
- Atomicity: Lua scripts for all counter operations
- Connection pool: 6 connections (3 app instances * 2 connections each for rate limit operations)
- Key TTL: 2x window size for all keys (burst: 120s, daily: 172,800s, IP: 7,200s)

### Implementation

```javascript
// rateLimiter.js -- Token Bucket via Redis Lua Script
const Redis = require('ioredis');

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: 6379,
  db: 1,  // Isolated from session storage
  lazyConnect: true,
  maxRetriesPerRequest: 1,  // Fail fast for rate limiting
  connectTimeout: 500,       // 500ms max -- fail open if Redis is slow
});

// Token bucket Lua script -- atomic check-and-consume
const TOKEN_BUCKET_SCRIPT = `
local key = KEYS[1]
local capacity = tonumber(ARGV[1])
local refill_rate = tonumber(ARGV[2])   -- tokens per second
local now = tonumber(ARGV[3])           -- unix timestamp in milliseconds
local requested = tonumber(ARGV[4])     -- tokens to consume (usually 1)

local data = redis.call('HMGET', key, 'tokens', 'last_refill')
local tokens = tonumber(data[1])
local last_refill = tonumber(data[2])

if tokens == nil then
  tokens = capacity
  last_refill = now
end

-- Refill tokens based on elapsed time
local elapsed_seconds = (now - last_refill) / 1000
local refill_amount = elapsed_seconds * refill_rate
tokens = math.min(capacity, tokens + refill_amount)

if tokens < requested then
  -- Calculate when enough tokens will be available
  local tokens_needed = requested - tokens
  local wait_seconds = tokens_needed / refill_rate
  redis.call('HSET', key, 'tokens', tokens, 'last_refill', now)
  redis.call('PEXPIRE', key, math.ceil(capacity / refill_rate * 1000 * 2))
  return {0, math.floor(tokens), math.ceil(wait_seconds)}
end

tokens = tokens - requested
redis.call('HSET', key, 'tokens', tokens, 'last_refill', now)
redis.call('PEXPIRE', key, math.ceil(capacity / refill_rate * 1000 * 2))
return {1, math.floor(tokens), 0}
`;

const tokenBucket = redis.defineCommand('tokenBucket', {
  numberOfKeys: 1,
  lua: TOKEN_BUCKET_SCRIPT,
});

async function checkReportRateLimit(tenantId, ipAddress) {
  const now = Date.now();
  const results = { allowed: true, limitType: null, retryAfter: 0, remaining: {} };

  try {
    // Layer 1: IP abuse guard (30/hr, burst 15)
    const ipKey = `rl:report:ip:${ipAddress}`;
    const [ipAllowed, ipRemaining, ipWait] = await redis.tokenBucket(
      ipKey, 15, 30 / 3600, now, 1
    );

    if (!ipAllowed) {
      return { allowed: false, limitType: 'ip_guard', retryAfter: ipWait, remaining: {} };
    }

    // Layer 2: Per-minute burst limit (5/min sustained, burst 10)
    const burstKey = `rl:report:burst:tenant:${tenantId}`;
    const [burstAllowed, burstRemaining, burstWait] = await redis.tokenBucket(
      burstKey, 10, 5 / 60, now, 1
    );

    if (!burstAllowed) {
      return {
        allowed: false,
        limitType: 'burst_limit',
        retryAfter: burstWait,
        remaining: { burst: 0 }
      };
    }

    // Layer 3: Daily quota (100/day, burst 20)
    const dailyKey = `rl:report:daily:tenant:${tenantId}`;
    const [dailyAllowed, dailyRemaining, dailyWait] = await redis.tokenBucket(
      dailyKey, 20, 100 / 86400, now, 1
    );

    if (!dailyAllowed) {
      return {
        allowed: false,
        limitType: 'daily_quota',
        retryAfter: dailyWait,
        remaining: { burst: burstRemaining, daily: 0 }
      };
    }

    return {
      allowed: true,
      remaining: { burst: burstRemaining, daily: dailyRemaining }
    };

  } catch (err) {
    // Redis unavailable -- fail open, log for audit
    console.error('RATE_LIMIT_BYPASS', { tenantId, ipAddress, error: err.message, ts: now });
    return { allowed: true, failedOpen: true, remaining: {} };
  }
}

// Express middleware
function reportRateLimitMiddleware(req, res, next) {
  const tenantId = req.auth.tenantId;    // set by auth middleware
  const ipAddress = req.ip;

  checkReportRateLimit(tenantId, ipAddress).then(result => {
    // Always set informational headers
    if (result.remaining.daily !== undefined) {
      res.set('X-RateLimit-Limit', '100');
      res.set('X-RateLimit-Remaining', String(result.remaining.daily));

      // Soft warning at 80% consumed
      if (result.remaining.daily <= 20) {
        res.set('X-RateLimit-Warning', `${100 - result.remaining.daily} of 100 daily reports used`);
      }
    }

    if (!result.allowed) {
      res.set('Retry-After', String(Math.ceil(result.retryAfter)));
      return res.status(429).json({
        error: 'rate_limit_exceeded',
        limit_type: result.limitType,
        retry_after: Math.ceil(result.retryAfter),
        message: result.limitType === 'daily_quota'
          ? 'Daily report quota exhausted. Quota resets on a rolling 24-hour basis.'
          : 'Too many requests. Please slow down.',
      });
    }

    next();
  }).catch(err => {
    // Middleware error -- fail open
    console.error('Rate limit middleware error:', err);
    next();
  });
}

module.exports = { reportRateLimitMiddleware };
```

### Test Plan

```javascript
// Key test cases for the report rate limiter

describe('Report Rate Limiter', () => {

  it('allows exactly 100 daily requests then blocks', async () => {
    const tenant = 'test_tenant_daily';
    // Send 100 requests with large gaps (avoid burst limit)
    for (let i = 0; i < 100; i++) {
      const result = await checkReportRateLimit(tenant, '10.0.0.1');
      expect(result.allowed).toBe(true);
      // Advance Redis time mock by 60 seconds between each
    }
    const result = await checkReportRateLimit(tenant, '10.0.0.1');
    expect(result.allowed).toBe(false);
    expect(result.limitType).toBe('daily_quota');
    expect(result.retryAfter).toBeGreaterThan(0);
  });

  it('allows burst of 10 then enforces 5/min sustained', async () => {
    const tenant = 'test_tenant_burst';
    // First 10 should succeed immediately
    for (let i = 0; i < 10; i++) {
      const result = await checkReportRateLimit(tenant, '10.0.0.2');
      expect(result.allowed).toBe(true);
    }
    // 11th should fail (burst exhausted)
    const result = await checkReportRateLimit(tenant, '10.0.0.2');
    expect(result.allowed).toBe(false);
    expect(result.limitType).toBe('burst_limit');
    // After 12 seconds (1 token refill at 5/min = 1 per 12s), should succeed
    await advanceTime(12000);
    const retryResult = await checkReportRateLimit(tenant, '10.0.0.2');
    expect(retryResult.allowed).toBe(true);
  });

  it('fails open when Redis is unavailable', async () => {
    await redis.disconnect();
    const result = await checkReportRateLimit('any_tenant', '10.0.0.3');
    expect(result.allowed).toBe(true);
    expect(result.failedOpen).toBe(true);
    await redis.connect();
  });

  it('isolates limits between tenants', async () => {
    // Exhaust tenant A's daily quota
    for (let i = 0; i < 100; i++) { /* ... */ }
    // Tenant B should be unaffected
    const result = await checkReportRateLimit('tenant_b', '10.0.0.4');
    expect(result.allowed).toBe(true);
  });
});
```

**Expected outcome for the Express setup:**
- Tenant hammering the endpoint hits the burst limit after 10 rapid requests and receives clear `Retry-After` guidance
- Power users with spread-out usage are unaffected -- they never come close to 5/min sustained
- A tenant who uses 80 of their 100 daily reports starts seeing the `X-RateLimit-Warning` header and can implement client-side budget management
- Redis outage is transparent to users -- the application logs the bypass events for post-incident review
- Three application instances share state via the existing Redis instance with no additional infrastructure cost
