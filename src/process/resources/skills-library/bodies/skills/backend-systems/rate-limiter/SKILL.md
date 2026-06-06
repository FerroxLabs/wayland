---
name: rate-limiter
description: |
  Rate limiting design expertise covering token bucket, sliding window, fixed window, leaky bucket algorithms, distributed rate limiting, per-user/per-IP/per-API-key limits, response headers, retry-after, and graceful degradation.
  Use when the user asks about rate limiter, rate limiter best practices, or needs guidance on rate limiter implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "backend api-design security"
  category: "backend-systems"
  subcategory: "server-infrastructure"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Rate Limiter

## Purpose

Design and implement rate limiting systems that protect APIs from abuse while providing fair access to legitimate users. This skill covers algorithm selection, distributed implementation, response formatting, and graceful degradation strategies.

## Algorithm Selection

### Decision Matrix

```
ALGORITHM         MEMORY    ACCURACY    BURST      COMPLEXITY
--------------------------------------------------------------
Fixed Window      Low       Low         Allows     Simple
Sliding Window    Medium    High        Controlled Medium
Token Bucket      Low       Medium      Allows     Medium
Leaky Bucket      Low       High        No burst   Medium

RECOMMENDATION BY USE CASE:
  API rate limiting (general):     Sliding Window Log
  High-volume, low-memory:        Token Bucket
  Smooth traffic shaping:         Leaky Bucket
  Simple implementation:          Fixed Window Counter
```

### Fixed Window Counter

```
HOW IT WORKS:
  Divide time into fixed windows (e.g., 1-minute windows).
  Count requests in current window.
  Reset counter at window boundary.

PROBLEM: Burst at window boundary
  Window 1: [----50 requests----][----50 requests---->|
  Window 2:                       |<----50 requests----]
  At boundary: 100 requests in 1 second (double the limit)
```

```ts
class FixedWindowLimiter {
  private store: Map<string, { count: number; windowStart: number }> = new Map();

  constructor(
    private maxRequests: number,
    private windowMs: number,
  ) {}

  isAllowed(key: string): { allowed: boolean; remaining: number; resetAt: number } {
    const now = Date.now();
    const windowStart = Math.floor(now / this.windowMs) * this.windowMs;
    const resetAt = windowStart + this.windowMs;

    const entry = this.store.get(key);

    if (!entry || entry.windowStart !== windowStart) {
      this.store.set(key, { count: 1, windowStart });
      return { allowed: true, remaining: this.maxRequests - 1, resetAt };
    }

    if (entry.count >= this.maxRequests) {
      return { allowed: false, remaining: 0, resetAt };
    }

    entry.count++;
    return { allowed: true, remaining: this.maxRequests - entry.count, resetAt };
  }
}
```

### Sliding Window Log

```
HOW IT WORKS:
  Store timestamp of each request.
  Count requests within the sliding window.
  Remove expired timestamps.

  More accurate than fixed window (no boundary burst).
  Higher memory usage (stores all timestamps).
```

```ts
class SlidingWindowLogLimiter {
  async isAllowed(key: string, maxRequests: number, windowMs: number): Promise<RateLimitResult> {
    const now = Date.now();
    const windowStart = now - windowMs;

    // Using Redis sorted set
    const multi = this.redis.multi();

    // Remove expired entries
    multi.zremrangebyscore(key, 0, windowStart);

    // Count current window
    multi.zcard(key);

    // Add current request
    multi.zadd(key, now, `${now}:${Math.random()}`);

    // Set TTL on key
    multi.expire(key, Math.ceil(windowMs / 1000));

    const results = await multi.run();
    const currentCount = results![1][1] as number;
# ... (condensed) ...
      allowed: true,
      remaining: maxRequests - currentCount - 1,
      retryAfter: 0,
      limit: maxRequests,
      resetAt: new Date(now + windowMs),
    };
  }
}
```

### Sliding Window Counter

```
HOW IT WORKS:
  Combines fixed window counter with weighted calculation.
  Uses current window count + weighted previous window count.

  Weight = (window_size - elapsed_in_current) / window_size
  Effective count = current_count + (previous_count * weight)

  Lower memory than log, better accuracy than fixed window.
```

```ts
class SlidingWindowCounterLimiter {
  async isAllowed(key: string, maxRequests: number, windowMs: number): Promise<RateLimitResult> {
    const now = Date.now();
    const currentWindow = Math.floor(now / windowMs);
    const previousWindow = currentWindow - 1;
    const elapsedInWindow = now - (currentWindow * windowMs);
    const weight = (windowMs - elapsedInWindow) / windowMs;

    const currentKey = `${key}:${currentWindow}`;
    const previousKey = `${key}:${previousWindow}`;

    const [currentCount, previousCount] = await Promise.all([
      this.redis.get(currentKey).then(v => parseInt(v ?? '0')),
      this.redis.get(previousKey).then(v => parseInt(v ?? '0')),
    ]);

    const effectiveCount = currentCount + Math.floor(previousCount * weight);

    if (effectiveCount >= maxRequests) {
      return { allowed: false, remaining: 0 };
    }

    // Increment current window
    const multi = this.redis.multi();
    multi.incr(currentKey);
    multi.expire(currentKey, Math.ceil(windowMs / 1000) * 2);
    await multi.run();

    return { allowed: true, remaining: maxRequests - effectiveCount - 1 };
  }
}
```

### Token Bucket

```
HOW IT WORKS:
  Bucket holds tokens (capacity = max burst size).
  Tokens added at steady rate (refill rate).
  Each request consumes one token.
  If bucket empty, request denied.
  Allows bursts up to bucket capacity.

PARAMETERS:
  capacity:    Maximum tokens (max burst)
  refillRate:  Tokens added per second
```

```ts
class TokenBucketLimiter {
  async isAllowed(key: string, capacity: number, refillRate: number): Promise<RateLimitResult> {
    // Lua script for atomic Redis operation
    const luaScript = `
      local key = KEYS[1]
      local capacity = tonumber(ARGV[1])
      local refillRate = tonumber(ARGV[2])
      local now = tonumber(ARGV[3])

      local bucket = redis.call('hmget', key, 'tokens', 'lastRefill')
      local tokens = tonumber(bucket[1]) or capacity
      local lastRefill = tonumber(bucket[2]) or now

      local elapsed = now - lastRefill
      tokens = math.min(capacity, tokens + (elapsed * refillRate / 1000))

      if tokens < 1 then
        return {0, math.ceil(tokens), math.ceil((1 - tokens) / refillRate * 1000)}
      end

      tokens = tokens - 1
      redis.call('hmset', key, 'tokens', tokens, 'lastRefill', now)
      # ... (condensed) ...
    return {
      allowed: allowed === 1,
      remaining,
      retryAfter: Math.ceil(retryAfter / 1000),
      limit: capacity,
    };
  }
}
```

### Leaky Bucket

```
HOW IT WORKS:
  Requests enter a queue (bucket).
  Requests are processed at a fixed rate (leak rate).
  If bucket is full, request denied.
  Smooths traffic to constant rate (no bursts).

USE CASE: When downstream systems need constant throughput
  (e.g., sending to a third-party API with strict rate limits).
```

## Distributed Rate Limiting

### Redis-Based (Recommended)

```ts
// All application instances share the same Redis for rate limit state
// Use Lua scripts for atomic operations (read + increment + compare)

class RateLimiterFactory {
  constructor(private redis: Redis) {}

  create(config: RateLimitConfig): RateLimiter {
    switch (config.algorithm) {
      case 'sliding-window':
        return new SlidingWindowLimiter(this.redis, config);
      case 'token-bucket':
        return new TokenBucketLimiter(this.redis, config);
      case 'fixed-window':
        return new FixedWindowLimiter(this.redis, config);
      default:
        throw new Error(`Unknown algorithm: ${config.algorithm}`);
    }
  }
}
```

### Rate Limit Key Strategies

```
PER-IP:
  Key: "rl:ip:{ip_address}"
  Use: Anonymous/public endpoints
  Caution: Shared IPs (corporate, VPN) may be unfairly limited

PER-USER:
  Key: "rl:user:{user_id}"
  Use: Authenticated endpoints
  Recommended for most APIs

PER-API-KEY:
  Key: "rl:key:{api_key_id}"
  Use: Third-party API access
  Allows per-plan rate limits

PER-ENDPOINT:
  Key: "rl:user:{user_id}:endpoint:{method}:{path}"
  Use: Different limits for different endpoints
  Example: POST /api/upload (10/hour) vs GET /api/users (100/minute)

COMBINED:
  Key: "rl:user:{user_id}:global" + "rl:user:{user_id}:endpoint:POST:/upload"
  Global limit: 1000/hour
  Upload limit: 10/hour (more restrictive)
```

### Tiered Rate Limits

```ts
const RATE_LIMIT_TIERS = {
  free: {
    global:  { maxRequests: 100,   windowMs: 60_000 },
    upload:  { maxRequests: 10,    windowMs: 3600_000 },
    search:  { maxRequests: 30,    windowMs: 60_000 },
  },
  pro: {
    global:  { maxRequests: 1000,  windowMs: 60_000 },
    upload:  { maxRequests: 100,   windowMs: 3600_000 },
    search:  { maxRequests: 300,   windowMs: 60_000 },
  },
  enterprise: {
    global:  { maxRequests: 10000, windowMs: 60_000 },
    upload:  { maxRequests: 1000,  windowMs: 3600_000 },
    search:  { maxRequests: 3000,  windowMs: 60_000 },
  },
};
```

## Response Headers

```ts
// Standard rate limit response headers
function setRateLimitHeaders(res: Response, result: RateLimitResult): void {
  res.setHeader('X-RateLimit-Limit', result.limit);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, result.remaining));
  res.setHeader('X-RateLimit-Reset', Math.ceil(result.resetAt.getTime() / 1000));

  // IETF draft standard headers
  res.setHeader('RateLimit-Limit', result.limit);
  res.setHeader('RateLimit-Remaining', Math.max(0, result.remaining));
  res.setHeader('RateLimit-Reset', Math.ceil((result.resetAt.getTime() - Date.now()) / 1000));
}

// 429 response
function sendRateLimitResponse(res: Response, result: RateLimitResult): void {
  setRateLimitHeaders(res, result);
  res.setHeader('Retry-After', result.retryAfter);

  res.status(429).json({
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests. Please retry after the specified time.',
      retryAfter: result.retryAfter,
      limit: result.limit,
      resetAt: result.resetAt.toISOString(),
    },
  });
}
```

## Express Middleware

```ts
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';

// Global rate limit
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: (...args: string[]) => redisClient.sendCommand(args),
  }),
  keyGenerator: (req) => req.user?.id || req.ip,
  handler: (req, res) => {
    res.status(429).json({
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests.',
      },
    });
  },
  skip: (req) => req.path === '/health',
# ... (condensed) ...
    sendCommand: (...args: string[]) => redisClient.sendCommand(args),
  }),
  keyGenerator: (req) => `auth:${req.ip}:${req.body?.email || 'unknown'}`,
});

app.use(globalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
```

## Graceful Degradation

```
WHEN RATE LIMIT INFRASTRUCTURE FAILS (Redis down):

Option 1: FAIL OPEN (allow all requests)
  + Service stays available
  - No protection from abuse
  Use when: Service availability is more important than protection

Option 2: FAIL CLOSED (deny all requests)
  + Service protected
  - All users affected, even legitimate ones
  Use when: Protection is critical (auth endpoints, payment)

Option 3: LOCAL FALLBACK
  + Basic protection maintained
  + Service stays available
  - Per-instance limits, not global
  Use when: Acceptable that limits are approximate

RECOMMENDATION: Local fallback with monitoring alert.
```

```ts
class ResilientRateLimiter {
  constructor(
    private distributed: DistributedRateLimiter,
    private local: LocalRateLimiter,
  ) {}

  async isAllowed(key: string): Promise<RateLimitResult> {
    try {
      return await this.distributed.isAllowed(key);
    } catch (error) {
      console.warn('Distributed rate limiter unavailable, using local fallback');
      metrics.increment('rate_limiter.fallback');
      return this.local.isAllowed(key);
    }
  }
}
```

## Client-Side Retry Strategy

```ts
// Clients should implement exponential backoff when receiving 429
async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 3): Promise<Response> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await get(url, options);

    if (response.status !== 429) return response;

    if (attempt === maxRetries) return response;

    // Use Retry-After header if provided
    const retryAfter = response.headers.get('Retry-After');
    const waitMs = retryAfter
      ? parseInt(retryAfter) * 1000
      : Math.min(1000 * Math.pow(2, attempt) + Math.random() * 1000, 30000);

    await new Promise(resolve => scheduleDelayed(resolve, waitMs));
  }

  throw new Error('Max retries exceeded');
}
```

## Rate Limiting Architecture Checklist

- [ ] Algorithm selected based on use case (sliding window for most APIs)
- [ ] Redis used for distributed rate limiting across instances
- [ ] Lua scripts ensure atomic rate limit checks
- [ ] Rate limit keys distinguish IP, user, API key, endpoint
- [ ] Tiered limits configured per plan/subscription level
- [ ] Standard response headers included (RateLimit-*, Retry-After)
- [ ] 429 response body includes error details and retry information
- [ ] Auth endpoints have stricter rate limits
- [ ] Health check endpoints excluded from rate limiting
- [ ] Graceful degradation (local fallback) when Redis is unavailable
- [ ] Monitoring tracks rate limit hits, rejections, and fallback usage
- [ ] Rate limits documented in API documentation
- [ ] Rate limit configuration externalized (not hardcoded)
- [ ] Client SDKs implement automatic retry with exponential backoff

## When to Use

**Use this skill when:**
- Designing or implementing rate limiter solutions
- Reviewing or improving existing rate limiter approaches
- Making architectural or implementation decisions about rate limiter
- Learning rate limiter patterns and best practices
- Troubleshooting rate limiter-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Rate Limiter Analysis

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

**Input:** "Help me implement rate limiter for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended rate limiter approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When rate limiter must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
