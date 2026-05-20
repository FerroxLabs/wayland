---
name: rate-limiter-designer
description: |
  Rate limiting expertise covering token bucket, sliding window, fixed window, and leaky bucket algorithms, distributed rate limiting, API quota management, graceful degradation, client-friendly responses, and production implementation patterns.
  Use when the user asks about rate limiter designer, rate limiter designer best practices, or needs guidance on rate limiter designer implementation.
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

# Rate Limiter Designer

You are an expert in designing and implementing rate limiting systems. Rate limiting protects your services from abuse, ensures fair resource allocation, and maintains system stability under load. The art is not just blocking requests, but doing it gracefully: clear error messages, appropriate headers, tiered limits, and degradation strategies that keep the system useful even when constrained.

## Why Rate Limit

| Threat | Without Rate Limiting | With Rate Limiting |
|--------|----------------------|-------------------|
| DDoS attack | Service overwhelmed, all users affected | Attack absorbed, legitimate traffic served |
| Misbehaving client | One client consumes all resources | Client throttled, others unaffected |
| Bug causing retry storm | Cascading failure across services | Retry storms contained |
| Expensive API abuse | Cost explosion (AI/ML endpoints) | Costs predictable and bounded |
| Data scraping | Entire database exfiltrated | Scraping slowed to impractical speed |

## Algorithm Selection

### Algorithm Comparison

| Algorithm | Accuracy | Memory | Burst Handling | Complexity | Best For |
|-----------|----------|--------|----------------|------------|----------|
| **Fixed Window** | Low (boundary burst) | Very Low | Poor | Simple | Basic protection |
| **Sliding Window Log** | High | High | Good | Medium | Small-scale precision |
| **Sliding Window Counter** | Good | Low | Good | Medium | Most applications |
| **Token Bucket** | Good | Low | Controlled burst | Medium | APIs with burst allowance |
| **Leaky Bucket** | High | Low | No burst (smoothed) | Medium | Steady rate enforcement |

### Fixed Window Counter

```
Window: 1 minute, Limit: 100 requests

Timeline:
  00:00 ----------- 01:00 ----------- 02:00
  [    Window 1    ] [    Window 2    ]

  Problem: 100 requests at 00:50 + 100 requests at 01:10
  = 200 requests in 20 seconds (2x the intended rate)

  This "boundary burst" is the main drawback.
```

```typescript
class FixedWindowLimiter {
  private counts = new Map<string, { count: number; resetAt: number }>();

  isAllowed(key: string, limit: number, windowMs: number): boolean {
    const now = Date.now();
    const window = this.counts.get(key);

    if (!window || now > window.resetAt) {
      this.counts.set(key, { count: 1, resetAt: now + windowMs });
      return true;
    }

    if (window.count < limit) {
      window.count++;
      return true;
    }

    return false;
  }
}
```

### Sliding Window Counter

Combines two fixed windows with a weighted average. Solves the boundary burst problem with minimal memory.

```typescript
class SlidingWindowLimiter {
  // Uses weighted average of current and previous window
  isAllowed(key: string, limit: number, windowMs: number): boolean {
    const now = Date.now();
    const currentWindow = Math.floor(now / windowMs);
    const previousWindow = currentWindow - 1;

    const currentCount = this.getCount(key, currentWindow);
    const previousCount = this.getCount(key, previousWindow);

    // Weight: how far into current window we are
    const elapsed = now - currentWindow * windowMs;
    const weight = elapsed / windowMs;

    // Weighted count: full current window + fraction of previous
    const estimatedCount = previousCount * (1 - weight) + currentCount;

    if (estimatedCount < limit) {
      this.incrementCount(key, currentWindow);
      return true;
    }
    return false;
  }
}
```

### Token Bucket

Allows controlled bursts. Tokens accumulate at a fixed rate and are consumed per request.

```
PARAMETERS:
  bucket_size: 10      (maximum burst size)
  refill_rate: 5/sec   (steady-state rate)

EXAMPLE:
  t=0.0: Bucket has 10 tokens (full)
  t=0.0: 8 requests arrive, consume 8 tokens. Bucket: 2
  t=0.2: 1 token added (5/sec * 0.2s). Bucket: 3
  t=0.5: 1.5 tokens added. Bucket: 4.5
  t=1.0: 2.5 tokens added. Bucket: 7 (capped at 10)
```

```typescript
class TokenBucketLimiter {
  private buckets = new Map<string, { tokens: number; lastRefill: number }>();

  isAllowed(
    key: string,
    bucketSize: number,
    refillRate: number, // tokens per second
    tokensRequired: number = 1
  ): boolean {
    const now = Date.now() / 1000;
    let bucket = this.buckets.get(key);

    if (!bucket) {
      bucket = { tokens: bucketSize, lastRefill: now };
      this.buckets.set(key, bucket);
    }

    // Refill tokens based on elapsed time
    const elapsed = now - bucket.lastRefill;
    bucket.tokens = Math.min(bucketSize, bucket.tokens + elapsed * refillRate);
    bucket.lastRefill = now;

    // Check if enough tokens
    if (bucket.tokens >= tokensRequired) {
      bucket.tokens -= tokensRequired;
      return true;
    }

    return false;
  }
}
```

### Leaky Bucket

Processes requests at a fixed rate, smoothing out bursts. Excess requests queue up or are rejected.

```
VISUALIZATION:
        +----------+
  IN -> |  Bucket   | (queue of pending requests)
        |  (max 20) |
        +----+-----+
             |  leak rate: 10 req/sec
             v
        Processing

  If bucket is full and new request arrives -> REJECT (429)
  Requests "leak out" at a steady rate
```

## Distributed Rate Limiting

### Redis-Based Implementation

Single-node rate limiting breaks when you have multiple API servers. Redis provides atomic operations for distributed counting.

```typescript
// Sliding window counter in Redis using Lua scripting for atomicity
const slidingWindowScript = `
  local key = KEYS[1]
  local window = tonumber(ARGV[1])
  local limit = tonumber(ARGV[2])
  local now = tonumber(ARGV[3])

  -- Remove expired entries
  redis.call('ZREMRANGEBYSCORE', key, 0, now - window)

  -- Count current entries
  local count = redis.call('ZCARD', key)

  if count < limit then
    -- Add current request with timestamp as score
    redis.call('ZADD', key, now, now .. '-' .. math.random(1000000))
    redis.call('EXPIRE', key, window / 1000)
    return 1  -- allowed
  else
    return 0  -- rejected
  end
`;

class RedisRateLimiter {
  constructor(private redis: Redis) {}

  async isAllowed(key: string, limit: number, windowMs: number): Promise<{
    allowed: boolean;
    remaining: number;
    retryAfter?: number;
  }> {
    const now = Date.now();
    // Execute the Lua script atomically on Redis
    const result = await this.redis.executeScript(
      slidingWindowScript, 1, key, windowMs, limit, now
    );

    if (result === 1) {
      const count = await this.redis.zcard(key);
      return { allowed: true, remaining: limit - count };
    }

    // Calculate retry-after from oldest entry in window
    const oldest = await this.redis.zrange(key, 0, 0, 'WITHSCORES');
    const retryAfter = oldest.length > 1
      ? Math.ceil((parseInt(oldest[1]) + windowMs - now) / 1000)
      : 1;

    return { allowed: false, remaining: 0, retryAfter };
  }
}
```

### Token Bucket in Redis (Lua Script)

```lua
-- Redis Lua script for distributed token bucket
local key = KEYS[1]
local bucket_size = tonumber(ARGV[1])
local refill_rate = tonumber(ARGV[2])  -- tokens per second
local now = tonumber(ARGV[3])           -- current time in seconds
local requested = tonumber(ARGV[4])     -- tokens requested

-- Get current bucket state
local bucket = redis.call('HMGET', key, 'tokens', 'last_refill')
local tokens = tonumber(bucket[1]) or bucket_size
local last_refill = tonumber(bucket[2]) or now

-- Refill tokens
local elapsed = math.max(0, now - last_refill)
tokens = math.min(bucket_size, tokens + elapsed * refill_rate)

-- Check and consume
if tokens >= requested then
  tokens = tokens - requested
  redis.call('HMSET', key, 'tokens', tokens, 'last_refill', now)
  redis.call('EXPIRE', key, math.ceil(bucket_size / refill_rate) * 2)
  return {1, math.floor(tokens)}  -- allowed, remaining
else
  redis.call('HMSET', key, 'tokens', tokens, 'last_refill', now)
  local wait_seconds = math.ceil((requested - tokens) / refill_rate)
  return {0, 0, wait_seconds}  -- rejected, remaining, retry_after
end
```

## API Quota Management

### Tiered Rate Limits

```typescript
interface RateLimitTier {
  name: string;
  limits: {
    perSecond: number;
    perMinute: number;
    perDay: number;
  };
  costMultiplier: Record<string, number>; // Endpoint-specific costs
}

const tiers: Record<string, RateLimitTier> = {
  free: {
    name: 'Free',
    limits: { perSecond: 1, perMinute: 30, perDay: 1000 },
    costMultiplier: { '/api/search': 1, '/api/generate': 10 },
  },
  pro: {
    name: 'Pro',
    limits: { perSecond: 10, perMinute: 300, perDay: 50000 },
    costMultiplier: { '/api/search': 1, '/api/generate': 5 },
  },
  enterprise: {
    name: 'Enterprise',
    limits: { perSecond: 100, perMinute: 5000, perDay: 1000000 },
    costMultiplier: { '/api/search': 1, '/api/generate': 1 },
  },
};
```

### Multi-Level Rate Limiting

Apply limits at multiple granularities simultaneously:

```typescript
async function checkRateLimits(apiKey: string, endpoint: string): Promise<RateLimitResult> {
  const tier = await getTierForApiKey(apiKey);
  const cost = tier.costMultiplier[endpoint] || 1;

  // Check all levels (fail fast: cheapest check first)
  const checks = [
    { key: `rl:${apiKey}:sec`,  limit: tier.limits.perSecond,  window: 1000 },
    { key: `rl:${apiKey}:min`,  limit: tier.limits.perMinute,  window: 60000 },
    { key: `rl:${apiKey}:day`,  limit: tier.limits.perDay,     window: 86400000 },
    { key: `rl:global:sec`,     limit: 10000,                   window: 1000 },
  ];

  for (const check of checks) {
    const result = await limiter.isAllowed(check.key, check.limit, check.window);
    if (!result.allowed) {
      return {
        allowed: false,
        limit: check.limit,
        window: check.window,
        retryAfter: result.retryAfter,
      };
    }
  }

  return { allowed: true, remaining: checks[0].limit - cost };
}
```

## HTTP Response Standards

### Standard Rate Limit Headers (RFC 9110 + draft-ietf-httpapi-ratelimit-headers)

```http
HTTP/1.1 200 OK
RateLimit-Limit: 100
RateLimit-Remaining: 42
RateLimit-Reset: 1640000000

HTTP/1.1 429 Too Many Requests
Content-Type: application/json
Retry-After: 30
RateLimit-Limit: 100
RateLimit-Remaining: 0
RateLimit-Reset: 1640000000

{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. You are allowed 100 requests per minute.",
    "retryAfter": 30,
    "limit": 100,
    "window": "1m",
    "documentation": "[reference URL]"
  }
}
```

### Express Middleware Implementation

```typescript
import { Request, Response, NextFunction } from 'express';

function rateLimitMiddleware(limiter: RedisRateLimiter) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const key = extractKey(req);  // API key, user ID, or IP
    const tier = await getTier(key);

    const result = await limiter.isAllowed(
      `rl:${key}:min`,
      tier.limits.perMinute,
      60000
    );

    // Always set headers (even when allowed)
    res.set('RateLimit-Limit', String(tier.limits.perMinute));
    res.set('RateLimit-Remaining', String(result.remaining));
    res.set('RateLimit-Reset', String(Math.ceil(Date.now() / 1000) + 60));

    if (!result.allowed) {
      res.set('Retry-After', String(result.retryAfter));
      return res.status(429).json({
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: `Rate limit exceeded. Limit: ${tier.limits.perMinute} requests per minute.`,
          retryAfter: result.retryAfter,
        },
      });
    }

    next();
  };
}
```

## Graceful Degradation

### Degradation Tiers

```
UNDER HEAVY LOAD, DEGRADE GRACEFULLY:

Tier 0 (Normal):     All features available
Tier 1 (Elevated):   Disable expensive endpoints (search, reports)
                      Reduce rate limits by 50%
Tier 2 (High):       Serve cached responses for read endpoints
                      Disable all write endpoints except critical ones
Tier 3 (Critical):   Static error page
                      Only health checks respond

IMPLEMENTATION:
  - Monitor system load (CPU, memory, queue depth, error rate)
  - Automatically adjust tier based on thresholds
  - Each tier has predefined behavior for each endpoint
```

### Client-Friendly Rate Limiting

```typescript
// Return helpful information to clients
function buildRateLimitResponse(result: RateLimitResult, tier: Tier) {
  return {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: `You have exceeded your ${tier.name} plan limit.`,
      retryAfter: result.retryAfter,
      currentUsage: {
        used: result.limit - result.remaining,
        limit: result.limit,
        window: '1 minute',
        resetsAt: new Date(result.resetAt).toISOString(),
      },
      upgrade: tier.name !== 'enterprise' ? {
        message: `Upgrade to ${nextTier(tier).name} for higher limits.`,
        url: '[reference URL]',
      } : undefined,
    },
  };
}
```

## Common Anti-Patterns

1. **Rate limiting by IP only**: NATs and VPNs share IPs. Thousands of legitimate users behind one corporate NAT get blocked together. Use API keys or user IDs as the primary key, IP as fallback.

2. **No rate limit headers**: Clients have no way to know their limit or remaining quota. They cannot implement backoff without trial and error. Always send headers.

3. **Hard cutoff with no warning**: Going from "allowed" to "blocked" instantly. Provide `RateLimit-Remaining` headers so clients can slow down before hitting the limit.

4. **Same limits for all endpoints**: A search endpoint costs 100x more than a health check. Weight expensive endpoints higher or set per-endpoint limits.

5. **Rate limiting only at the edge**: If an internal service calls another internal service in a retry loop, there is no protection. Apply rate limiting at service boundaries too.

6. **Not rate limiting yourself**: Your own background jobs and internal tools can overwhelm your services. Rate limit internal callers too, especially batch processors.

## Rate Limiter Design Checklist

- [ ] Algorithm selected based on requirements (burst tolerance, accuracy, memory)
- [ ] Distributed implementation using Redis or equivalent
- [ ] Rate limit key strategy defined (API key > user ID > IP)
- [ ] Tiered limits defined per plan/subscription level
- [ ] Per-endpoint weighting for expensive operations
- [ ] Standard HTTP headers returned (RateLimit-Limit, Remaining, Reset)
- [ ] 429 responses include Retry-After and helpful error message
- [ ] Graceful degradation tiers defined for overload scenarios
- [ ] Global rate limit protects against complete system overload
- [ ] Internal service-to-service rate limiting implemented
- [ ] Monitoring: track rate limit hits, rejections, and degradation tier
- [ ] Client documentation explains limits, headers, and best practices

## When to Use

**Use this skill when:**
- Designing or implementing rate limiter designer solutions
- Reviewing or improving existing rate limiter designer approaches
- Making architectural or implementation decisions about rate limiter designer
- Learning rate limiter designer patterns and best practices
- Troubleshooting rate limiter designer-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Rate Limiter Designer Analysis

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

**Input:** "Help me implement rate limiter designer for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended rate limiter designer approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When rate limiter designer must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
