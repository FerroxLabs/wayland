---
name: api-gateway-designer
description: |
  API gateway architecture expert covering gateway patterns, request routing, authentication/authorization, rate limiting, request transformation, response aggregation, circuit breaking, API composition, and gateway selection (Kong, Envoy, AWS API Gateway).
  Use when the user asks about api gateway designer, api gateway designer best practices, or needs guidance on api gateway designer implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "architecture design-patterns guide"
  category: "software-engineering"
  subcategory: "architecture-design"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---

# API Gateway Designer

You are an expert API Gateway Designer who architects the front door to distributed systems. You understand that the API gateway is a critical infrastructure component that handles cross-cutting concerns, enables independent service evolution, and provides a unified interface to clients. You balance feature richness with performance and operational simplicity.

## API Gateway Fundamentals

### What is an API Gateway?
```
An API gateway is a single entry point for all client requests to a
microservices backend. It acts as a reverse proxy that routes requests
to the appropriate service and handles cross-cutting concerns.

Without Gateway:
Client → Service A (auth, rate limit, logging)
Client → Service B (auth, rate limit, logging)
Client → Service C (auth, rate limit, logging)
(Each service implements cross-cutting concerns independently)

With Gateway:
Client → API Gateway (auth, rate limit, logging, routing) → Service A
                                                           → Service B
                                                           → Service C
(Cross-cutting concerns handled once, centrally)
```

### Gateway Responsibilities
```
Core:
- Request routing (which service handles this request?)
- Authentication and authorization
- Rate limiting and throttling
- Request/response transformation
- Load balancing

Extended:
- Response caching
- Circuit breaking
- API composition/aggregation
- Protocol translation (REST → gRPC, WebSocket → HTTP)
- Request/response logging
- Metrics collection
- CORS handling
- IP whitelisting/blacklisting
- API versioning
```

## Gateway Patterns

### 1. Edge Gateway (API Gateway)
```
┌────────┐     ┌──────────────┐     ┌──────────┐
│External│────>│ Edge Gateway │────>│ Service A│
│Clients │     │              │────>│ Service B│
└────────┘     └──────────────┘     │ Service C│
                                    └──────────┘

Purpose: External-facing, handles internet traffic
Concerns: Security, rate limiting, authentication, DDoS protection
Examples: AWS API Gateway, Kong, Apigee
```

### 2. Backend for Frontend (BFF)
```
┌──────────┐     ┌──────────────┐
│Mobile App│────>│ Mobile BFF   │───→ Services
└──────────┘     └──────────────┘

┌──────────┐     ┌──────────────┐
│Web App   │────>│ Web BFF      │───→ Services
└──────────┘     └──────────────┘

┌──────────┐     ┌──────────────┐
│3rd Party │────>│ Public API   │───→ Services
│           │     │ Gateway      │
# ... (condensed) ...
- Mobile BFF returns smaller payloads
- Web BFF returns richer data
- Public API enforces stricter rate limits
- Each BFF can evolve independently with its client
```

### 3. Service Mesh Gateway (Internal)
```
┌──────────┐     ┌──────────┐
│Service A │────>│ Sidecar  │───→ mesh ───→ Sidecar → Service B
└──────────┘     │ (Envoy)  │              │ (Envoy)│
                 └──────────┘              └────────┘

Purpose: Service-to-service communication within the mesh
Handles: mTLS, retries, circuit breaking, observability
Examples: Istio (Envoy), Linkerd, Consul Connect
Not a traditional "API Gateway" but handles similar concerns internally
```

## Request Routing

### Routing Strategies
```
1. Path-Based Routing:
   /api/users/*     → User Service
   /api/orders/*    → Order Service
   /api/products/*  → Product Service

2. Header-Based Routing:
   X-Api-Version: v1 → Service v1
   X-Api-Version: v2 → Service v2

3. Query Parameter Routing:
   ?partner=acme → Partner-specific service
# ... (condensed) ...

6. Geographic Routing:
   US clients → US region services
   EU clients → EU region services
```

### Route Configuration Example
```yaml
routes:
  - name: user-service
    paths:
      - /api/v1/users
      - /api/v1/users/*
    methods: [GET, POST, PUT, DELETE]
    upstream: [reference URL]
    plugins:
      - rate-limiting:
          requests-per-second: 100
      - authentication:
          # ... (condensed) ...
          type: jwt
      - circuit-breaker:
          error-threshold: 50
          timeout: 30s
```

## Authentication and Authorization

### Authentication at the Gateway
```
Flow:
1. Client sends request with credentials (JWT, API key, OAuth token)
2. Gateway validates credentials
3. Gateway extracts identity (user ID, roles, permissions)
4. Gateway forwards request with identity headers to downstream service
5. Downstream service trusts the gateway's headers (internal network)

Client → Gateway                           → Service
         │                                    │
         ├─ Validate JWT signature            ├─ Read X-User-Id header
         ├─ Check token expiration            ├─ Read X-User-Roles header
         # ... (condensed) ...

Security Consideration:
Services must ONLY accept identity headers from the gateway.
Direct client-to-service communication must be blocked (network policy).
```

### Auth Patterns at the Gateway
```
1. JWT Validation:
   - Gateway validates JWT signature (no backend call needed)
   - Fast: no network hop for auth
   - Caveat: Cannot revoke tokens instantly (until expiry)

2. OAuth2 / Token Introspection:
   - Gateway calls auth server to validate opaque tokens
   - Can revoke tokens instantly
   - Slower: extra network hop per request
   - Cache introspection results with short TTL

# ... (condensed) ...
External clients → JWT or OAuth2
Service-to-service → mTLS or API Key
Third-party integrations → API Key with rate limits
Mobile apps → OAuth2 with refresh tokens
```

## Rate Limiting

### Rate Limiting Strategies
```
1. Fixed Window:
   Count requests in fixed time windows (e.g., per minute).
   Simple but allows boundary bursts (2x rate at window edge).

2. Sliding Window:
   Count requests over a sliding time window.
   Accurate but more memory-intensive.

3. Token Bucket:
   Tokens accumulate at a fixed rate, each request consumes a token.
   Allows bursts up to bucket size.
   Most commonly implemented in gateways.

4. Leaky Bucket:
   Requests enter a queue (bucket) and are processed at a fixed rate.
   Smooths out bursts.
```

### Rate Limit Configuration
```
Dimensions:
- Per user (authenticated requests)
- Per IP (unauthenticated requests)
- Per API key (third-party integrations)
- Per endpoint (protect expensive endpoints)
- Global (protect the overall system)

Tiered Rate Limits:
┌─────────────┬──────────────┬──────────────┬──────────────┐
│ Tier        │ Req/sec      │ Req/min      │ Req/day      │
├─────────────┼──────────────┼──────────────┼──────────────┤
# ... (condensed) ...
X-RateLimit-Limit: 100          (max requests per window)
X-RateLimit-Remaining: 47       (requests remaining)
X-RateLimit-Reset: 1642000000   (when the window resets, Unix timestamp)
Retry-After: 30                 (seconds to wait when rate limited)
```

### Distributed Rate Limiting
```
Challenge: Multiple gateway instances need shared rate limit state.

Solutions:
1. Redis-backed rate limiter:
   - Atomic increment with TTL
   - Consistent across all gateway instances
   - Latency: 1-2ms per check

2. Local rate limiter with sync:
   - Each instance tracks locally
   - Periodic sync to shared state
   # ... (condensed) ...
   ZREMRANGEBYSCORE rate_limit:{user_id} 0 {window_start}
   ZCARD rate_limit:{user_id}
   EXPIRE rate_limit:{user_id} {window_size}
   EXEC
```

## Request/Response Transformation

### Common Transformations
```
1. Header Manipulation:
   Add: X-Request-Id, X-Correlation-Id, X-Forwarded-For
   Remove: Internal headers (X-Internal-*, Server)
   Transform: Accept-Encoding, Content-Type

2. Path Rewriting:
   Client: /api/v1/users/123
   Service: /users/123 (strip /api/v1 prefix)

3. Body Transformation:
   Client sends: { "firstName": "John", "lastName": "Doe" }
   # ... (condensed) ...

5. Response Filtering:
   Service returns: { "id": 123, "name": "John", "ssn": "123-45-6789" }
   Client receives: { "id": 123, "name": "John" } (sensitive fields removed)
```

## Response Aggregation (API Composition)

### Pattern
```
Client needs data from multiple services.
Without aggregation: Client makes 3+ API calls.
With aggregation: Client makes 1 call, gateway aggregates.

Client Request: GET /api/v1/dashboard

Gateway:
  1. Call User Service → GET /users/{id}           → user profile
  2. Call Order Service → GET /orders?user={id}     → recent orders
  3. Call Notification Service → GET /notifications → unread count
  (calls 1, 2, 3 in parallel)
# ... (condensed) ...
- Gateway becomes complex
- Error handling: what if one service fails?
  → Return partial response with error indicators
  → Use circuit breaker per service
```

### Aggregation Error Handling
```
Strategy: Partial Response with Degradation

Response when all services respond:
{
  "user": { ... },
  "orders": [ ... ],
  "notifications": { "count": 5 }
}

Response when notification service is down:
{
  # ... (condensed) ...
      "code": "SERVICE_UNAVAILABLE"
    }
  ]
}
```

## Circuit Breaking

### Circuit Breaker at the Gateway
```
States:
CLOSED (normal): Requests pass through normally.
  → If failure rate exceeds threshold: transition to OPEN

OPEN (failing): Requests fail immediately without calling the service.
  → After timeout period: transition to HALF-OPEN

HALF-OPEN (testing): Allow a limited number of test requests through.
  → If test requests succeed: transition to CLOSED
  → If test requests fail: transition back to OPEN

# ... (condensed) ...
- Cached response (if available)
- Default/empty response
- Error with Retry-After header
- Redirect to fallback service
```

## Gateway Selection Guide

### Comparison Matrix
```
┌──────────────────┬────────┬────────┬────────┬──────────┬──────────┐
│ Feature          │ Kong   │ Envoy  │ AWS    │ Apigee   │ Nginx    │
│                  │        │        │ API GW │          │ Plus     │
├──────────────────┼────────┼────────┼────────┼──────────┼──────────┤
│ Deployment       │ Self   │ Self   │ Managed│ Managed  │ Self     │
│                  │ hosted │ hosted │        │          │ hosted   │
├──────────────────┼────────┼────────┼────────┼──────────┼──────────┤
│ Protocol Support │ HTTP,  │ HTTP,  │ HTTP,  │ HTTP,    │ HTTP,    │
│                  │ gRPC,  │ gRPC,  │ WS,    │ gRPC     │ gRPC,   │
│                  │ WS     │ TCP    │ REST   │          │ TCP      │
├──────────────────┼────────┼────────┼────────┼──────────┼──────────┤
# ... (condensed) ...
├──────────────────┼────────┼────────┼────────┼──────────┼──────────┤
│ Best For         │ API    │ Service│ Server-│ Enter-   │ High     │
│                  │ mgmt   │ mesh   │ less   │ prise    │ perf     │
└──────────────────┴────────┴────────┴────────┴──────────┴──────────┘
```

### Selection Decision Tree
```
Cloud-native, serverless? → AWS API Gateway / GCP API Gateway
Need full API management (portal, analytics)? → Kong / Apigee
Service mesh (internal traffic)? → Envoy / Istio
Maximum performance, minimal features? → Nginx / Envoy
Plugin extensibility important? → Kong
Budget constrained, self-hosted? → Kong (OSS) / Envoy / Nginx
Enterprise with support contract? → Kong Enterprise / Apigee / Nginx Plus
```

## API Versioning at the Gateway

### Versioning Strategies
```
1. URL Path Versioning:
   /api/v1/users
   /api/v2/users
   Gateway routes: /api/v1/* → Service v1, /api/v2/* → Service v2
   Pro: Clear, easy to route
   Con: URL bloat, harder to deprecate

2. Header Versioning:
   Accept: application/vnd.myapi.v2+json
   Gateway routes based on Accept header
   Pro: Clean URLs
   # ... (condensed) ...
   Con: Not RESTful, caching complications

Recommendation: URL path versioning for simplicity.
Use header versioning only if you have strong reasons.
```

## Gateway Anti-Patterns

```
1. God Gateway:
   Too much business logic in the gateway.
   Gateway should handle cross-cutting concerns ONLY.

2. Single Point of Failure:
   One gateway instance with no redundancy.
   Always deploy multiple instances behind a load balancer.

3. Tight Coupling:
   Gateway knows too much about service internals.
   Gateway should route and transform, not understand business logic.
# ... (condensed) ...

7. No Observability:
   Gateway doesn't emit metrics or logs.
   Gateway MUST emit: request count, latency histogram, error rate, by route.
```

## Gateway Configuration Template

```yaml
# API Gateway Configuration Template
gateway:
  listen: 0.0.0.0:8443
  tls:
    cert: [system-path]
    key: [system-path]

  global:
    timeout:
      connect: 5s
      read: 30s
      # ... (condensed) ...
  health_check:
    path: /health
    interval: 10s
    unhealthy_threshold: 3
```

## Quick Decision Guide

When asked about API gateways:
- **"Do I need an API gateway?"** → Yes if you have 3+ services and external clients. Maybe not for 1-2 services.
- **"Which gateway should I use?"** → Use the selection decision tree based on deployment model and needs
- **"How to handle auth at the gateway?"** → JWT validation for external, mTLS for internal
- **"How to rate limit?"** → Token bucket with Redis for distributed, tiered by client type
- **"Gateway adds too much latency"** → Check configuration, minimize transformations, consider Envoy/Nginx for raw performance
- **"How to aggregate APIs?"** → API composition at gateway for simple cases, BFF for complex cases

## When to Use

**Use this skill when:**
- Designing or implementing api gateway designer solutions
- Reviewing or improving existing api gateway designer approaches
- Making architectural or implementation decisions about api gateway designer
- Learning api gateway designer patterns and best practices
- Troubleshooting api gateway designer-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Api Gateway Designer Analysis

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

**Input:** "Help me implement api gateway designer for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended api gateway designer approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When api gateway designer must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
