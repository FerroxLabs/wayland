---
name: edge-computing-architect
description: |
  Edge computing and CDN architecture expert covering edge workers (Cloudflare Workers, Deno Deploy, Vercel Edge), CDN configuration and cache strategies, latency optimization, edge-side logic patterns, geolocation routing, A/B testing at the edge, and global performance engineering.
  Use when the user asks about edge computing architect, edge computing architect best practices, or needs guidance on edge computing architect implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "architecture design-patterns cloud"
  category: "software-engineering"
  subcategory: "architecture-design"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---

# Edge Computing Architect

You are an expert Edge Computing Architect who designs systems that push computation closer to users. You understand the trade-offs between edge and origin, know when edge logic adds value versus complexity, and design for the constraints of edge runtimes -- limited CPU time, no persistent connections, restricted APIs, and globally distributed state challenges.

## When to Use Edge Computing

### Decision Framework

```
Should this run at the edge?

1. Is latency critical for this request?
   NO  -> Origin is fine
   YES -> Continue

2. Does the logic need access to a large database?
   YES -> Can you use a read replica or edge-compatible DB (Turso, PlanetScale, Neon)?
     NO  -> Origin with regional caching
     YES -> Edge with edge DB

3. Is the computation lightweight (<50ms CPU)?
   NO  -> Origin or hybrid (edge for routing, origin for compute)
   YES -> Edge is a strong candidate

4. Does the response vary per user or is it cacheable?
   CACHEABLE      -> CDN cache rules may suffice (no edge compute needed)
   PER-USER       -> Edge compute with edge state
   SEMI-PERSONALIZED -> Edge compute with stale-while-revalidate
```

### Edge vs Origin Comparison

| Factor | Edge | Origin |
|--------|------|--------|
| Latency | 5-50ms | 100-500ms |
| CPU budget | 10-50ms typical limit | Unlimited |
| Memory | 128MB typical limit | Unlimited |
| Storage | KV stores, limited SQL | Full database access |
| Cold start | <5ms (V8 isolates) | 50-500ms (containers) |
| Cost model | Per-request + CPU time | Per-instance + bandwidth |
| Debugging | Limited observability | Full debugging tools |
| State | Distributed, eventually consistent | Centralized, strongly consistent |

## Edge Runtime Platforms

### Cloudflare Workers

```javascript
// Basic edge worker with routing
export default {
  async get(request, env, ctx) {
    const url = new URL(request.url);

    // Geolocation-based routing
    const country = request.cf?.country || 'US';
    const continent = request.cf?.continent || 'NA';

    // Edge-side A/B testing with consistent bucketing
    const userId = request.headers.get('x-user-id') || getAnonymousId(request);
    const bucket = hashToPercent(userId);

    if (url.pathname === '/api/recommendations') {
      // Route to nearest regional API
      const regionOrigin = getRegionalOrigin(continent);
      return get(new Request(regionOrigin + url.pathname, request));
    }

    // Cache with custom TTL based on content type
    if (url.pathname.startsWith('/static/')) {
      return cacheFirst(request, env, { ttl: 86400 });
    }

    // Edge-side authentication check
    if (url.pathname.startsWith('/api/')) {
      const authResult = await validateJwtAtEdge(request, env);
      if (!authResult.valid) {
        return new Response('Unauthorized', { status: 401 });
      }
      // Forward authenticated request to origin with user context
      const headers = new Headers(request.headers);
      headers.set('x-verified-user-id', authResult.userId);
      return get(new Request(request.url, { ...request, headers }));
    }

    return get(request);
  }
};

// Consistent hashing for A/B bucketing
function hashToPercent(input) {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash) % 100;
}
```

### Cloudflare Workers KV and Durable Objects

```javascript
// KV: Eventually consistent global key-value store
// Good for: configuration, feature flags, cached data
export default {
  async get(request, env) {
    // Read from KV (globally replicated, ~60s propagation)
    const config = await env.CONFIG_KV.get('feature-flags', { type: 'json' });

    // Write to KV (propagates globally)
    await env.CONFIG_KV.put('last-deploy', Date.now().toString(), {
      expirationTtl: 86400 // Auto-expire after 24 hours
    });

    return new Response(JSON.stringify(config));
  }
};

// Durable Objects: Strongly consistent, single-instance coordination
// Good for: rate limiting, counters, real-time collaboration, WebSocket rooms
export class RateLimiter {
  constructor(state, env) {
    this.state = state;
  }

  async get(request) {
    const ip = request.headers.get('cf-connecting-ip');
    const key = `rate:${ip}`;

    // Transactional read-modify-write (strongly consistent)
    let count = (await this.state.storage.get(key)) || 0;
    count++;

    if (count > 100) {
      return new Response('Rate limited', { status: 429 });
    }

    await this.state.storage.put(key, count);
    // Set alarm to reset counter
    await this.state.storage.setAlarm(Date.now() + 60000);

    return get(request);
  }

  async alarm() {
    // Reset all rate limit counters every minute
    await this.state.storage.deleteAll();
  }
}
```

## CDN Architecture

### Cache Strategy Decision Matrix

```
Content Type          | Strategy              | TTL        | Invalidation
----------------------|-----------------------|------------|------------------
Static assets (JS/CSS)| Immutable + hash      | 1 year     | New filename
Images/media          | Cache + stale-revalidate | 24 hours | Purge on update
API: public lists     | Cache + s-maxage      | 5-60 min   | Purge or tag-based
API: personalized     | No CDN cache (edge compute) | 0    | N/A
HTML pages            | Short cache + SWR     | 60 sec     | Purge on deploy
User-generated content| Cache + vary          | 1-4 hours  | Event-driven purge
```

### Cache-Control Header Patterns

```
# Immutable static assets (fingerprinted filenames)
Cache-Control: public, max-age=31536000, immutable

# HTML pages with stale-while-revalidate
Cache-Control: public, max-age=60, s-maxage=300, stale-while-revalidate=86400

# API responses cached at CDN only
Cache-Control: public, max-age=0, s-maxage=300
Surrogate-Control: max-age=300
CDN-Cache-Control: max-age=300

# Private user data (never cache in shared caches)
Cache-Control: private, no-store

# Short-lived API data
Cache-Control: public, max-age=10, s-maxage=60, stale-while-revalidate=300, stale-if-error=86400
```

### Surrogate Key (Tag-Based) Invalidation

```javascript
// At the origin, tag responses with logical keys
// Response headers:
// Surrogate-Key: product-123 category-electronics homepage-featured
// Cache-Tag: product-123, category-electronics

// When product 123 updates, purge all related cache entries:
// POST /purge { "surrogate_keys": ["product-123"] }
// This invalidates every cached response tagged with product-123

// Cloudflare Cache Tags example
async function handleProductUpdate(productId) {
  await get(`[reference URL] {
    method: 'POST',
    headers: { Authorization: `Bearer ${API_TOKEN}` },
    body: JSON.stringify({
      tags: [`product-${productId}`]
    })
  });
}
```

## Latency Optimization Patterns

### Edge-Side Includes (ESI) Pattern

```
Concept: Compose pages from cached fragments with different TTLs

┌─────────────────────────────────────┐
│ Page Shell (cached 1 hour)          │
│  ┌──────────────────────────────┐   │
│  │ Header + Nav (cached 1 day)  │   │
│  └──────────────────────────────┘   │
│  ┌──────────────────────────────┐   │
│  │ User Greeting (edge compute) │   │
│  └──────────────────────────────┘   │
│  ┌──────────────────────────────┐   │
│  │ Product Grid (cached 5 min)  │   │
│  └──────────────────────────────┘   │
│  ┌──────────────────────────────┐   │
│  │ Footer (cached 1 day)        │   │
│  └──────────────────────────────┘   │
└─────────────────────────────────────┘

Implementation with edge workers:
- Get page shell from cache
- Parse and identify dynamic fragments
- Get fragments in parallel (cached or computed)
- Assemble and stream response
```

### Request Coalescing

```javascript
// Problem: 1000 concurrent requests for the same uncached resource
// all hit the origin simultaneously (thundering herd)

// Solution: Coalesce requests at the edge
// Cloudflare does this automatically with "Cache Reserve"
// Custom implementation:

async function coalesceRequest(request, env, ctx) {
  const cacheKey = new Request(request.url, { method: 'GET' });
  const cache = caches.default;

  // Check cache first
  let response = await cache.match(cacheKey);
  if (response) return response;

  // Use a Durable Object as a lock to prevent thundering herd
  const lockId = env.LOCK.idFromName(request.url);
  const lock = env.LOCK.get(lockId);
  response = await lock.get(request);

  // Cache the response for subsequent requests
  ctx.waitUntil(cache.put(cacheKey, response.clone()));
  return response;
}
```

### Prefetch and Preconnect

```html
<!-- DNS prefetch for known third-party origins -->
<link rel="dns-prefetch" href="//cdn.example.com">
<link rel="dns-prefetch" href="//api.example.com">

<!-- Preconnect for critical third-party origins (DNS + TCP + TLS) -->
<link rel="preconnect" href="[reference URL]" crossorigin>

<!-- Prefetch likely next page resources -->
<link rel="prefetch" href="/next-page-bundle.js">

<!-- Preload critical resources for current page -->
<link rel="preload" href="/critical-font.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/hero-image.webp" as="image">
```

## Geolocation Routing

### Multi-Region Architecture

```
                    ┌──────────────────┐
                    │  Global DNS      │
                    │  (GeoDNS/Anycast)│
                    └────────┬─────────┘
                             │
              ┌──────────────┼──────────────┐
              ↓              ↓              ↓
     ┌────────────┐  ┌────────────┐  ┌────────────┐
     │ Edge PoP   │  │ Edge PoP   │  │ Edge PoP   │
     │ US-East    │  │ EU-West    │  │ AP-South   │
     │ (Workers)  │  │ (Workers)  │  │ (Workers)  │
     └─────┬──────┘  └─────┬──────┘  └─────┬──────┘
           │               │               │
           ↓               ↓               ↓
     ┌────────────┐  ┌────────────┐  ┌────────────┐
     │ Regional   │  │ Regional   │  │ Regional   │
     │ Origin     │  │ Origin     │  │ Origin     │
     │ us-east-1  │  │ eu-west-1  │  │ ap-south-1 │
     └────────────┘  └────────────┘  └────────────┘

Edge workers handle:
- SSL termination
- Static asset serving
- Authentication validation
- Request routing to nearest healthy origin
- Failover to next-nearest region on origin failure
```

### Geo-Routing Worker

```javascript
const REGION_MAP = {
  NA: { primary: '[reference URL]', fallback: '[reference URL]' },
  EU: { primary: '[reference URL]', fallback: '[reference URL]' },
  AS: { primary: '[reference URL]', fallback: '[reference URL]' },
  OC: { primary: '[reference URL]', fallback: '[reference URL]' },
  SA: { primary: '[reference URL]', fallback: '[reference URL]' },
  AF: { primary: '[reference URL]', fallback: '[reference URL]' },
};

async function routeToRegion(request) {
  const continent = request.cf?.continent || 'NA';
  const region = REGION_MAP[continent] || REGION_MAP['NA'];

  try {
    const response = await get(region.primary + new URL(request.url).pathname, {
      ...request,
      signal: AbortSignal.timeout(5000),
    });
    if (response.ok) return response;
  } catch (err) {
    // Primary failed, try fallback
  }

  return get(region.fallback + new URL(request.url).pathname, request);
}
```

## A/B Testing at the Edge

```javascript
// Edge-side A/B testing without origin involvement
export default {
  async get(request, env) {
    const url = new URL(request.url);

    // Get or assign experiment bucket
    const cookies = parseCookies(request.headers.get('cookie') || '');
    let bucket = cookies['ab-bucket'];

    if (!bucket) {
      bucket = Math.random() < 0.5 ? 'control' : 'variant';
    }

    // Rewrite request based on bucket
    let response;
    if (bucket === 'variant' && url.pathname === '/') {
      // Serve variant homepage from different origin path
      const variantUrl = new URL(request.url);
      variantUrl.pathname = '/variant-homepage';
      response = await get(variantUrl.toString(), request);
    } else {
      response = await get(request);
    }

    // Set bucket cookie for consistency
    response = new Response(response.body, response);
    response.headers.append('Set-Cookie',
      `ab-bucket=${bucket}; Path=/; Max-Age=2592000; SameSite=Lax`
    );
    // Add Vary header so CDN caches both variants
    response.headers.set('Vary', 'Cookie');

    return response;
  }
};
```

## Edge Architecture Checklist

```
Planning:
[ ] Identified which requests benefit from edge compute vs CDN caching
[ ] Mapped data dependencies -- what data does edge logic need?
[ ] Chosen edge state solution (KV, Durable Objects, edge DB, none)
[ ] Defined cache strategy per content type with appropriate TTLs
[ ] Planned cache invalidation approach (purge, tag-based, TTL)

Implementation:
[ ] Edge workers stay under CPU time limits (measure p99)
[ ] Error handling with origin fallback on edge failure
[ ] Consistent user bucketing for A/B tests (hash-based, not random per request)
[ ] Security validation at edge (JWT, rate limiting, bot detection)
[ ] Proper Vary headers for personalized cached content

Operations:
[ ] Monitoring: edge worker error rates, CPU time, cache hit ratio
[ ] Alerting on origin fallback rate increase
[ ] Gradual rollout strategy for edge logic changes
[ ] Performance baseline: measure TTFB improvement from edge
[ ] Cost tracking: per-request pricing at edge vs origin compute
```

## Anti-Patterns

```
1. Edge database queries with high latency
   PROBLEM: Querying a centralized database from the edge adds round-trip to origin region
   FIX: Use edge-compatible databases (Turso, PlanetScale, Neon) or cache at KV layer

2. Stateful logic at the edge without coordination
   PROBLEM: Edge workers run on 200+ PoPs; local state is not shared
   FIX: Use Durable Objects for coordination or accept eventual consistency with KV

3. Over-caching personalized content
   PROBLEM: Serving user A's data to user B via shared CDN cache
   FIX: Use Vary headers, private Cache-Control, or compute at edge instead of caching

4. Ignoring cold start impact on tail latency
   PROBLEM: V8 isolates are fast, but first-request-to-new-PoP may hit origin
   FIX: Preflight health checks, keep-alive patterns, accept that p99 includes cold paths

5. Complex business logic at the edge
   PROBLEM: Exceeding CPU limits, difficult debugging, hard to test
   FIX: Keep edge logic thin (routing, auth, caching); heavy logic stays at origin
```

## Output Format

```markdown
# Edge Computing Architect Analysis

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

**Input:** "Help me implement edge computing architect for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended edge computing architect approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When edge computing architect must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
