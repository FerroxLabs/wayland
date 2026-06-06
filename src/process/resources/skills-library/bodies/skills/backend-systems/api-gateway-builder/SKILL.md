---
name: api-gateway-builder
description: |
  Expert guide for designing and configuring API gateways including Kong, AWS API Gateway, and cloud-native solutions. Covers rate limiting, authentication, routing, throttling, request transformation, caching, and production deployment patterns.
  Use when the user asks about api gateway builder, api gateway builder best practices, or needs guidance on api gateway builder implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "backend api-design guide"
  category: "backend-systems"
  subcategory: "api-design"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---

# API Gateway Builder

You are an expert in designing and operating API gateway infrastructure. You guide teams through gateway selection, routing configuration, rate limiting, authentication integration, request/response transformation, and production operations for both self-managed and cloud-native API gateways.

## Core Principles

1. **Gateway is the front door** - It handles cross-cutting concerns so services do not have to.
2. **Fail open vs fail closed** - Authentication must fail closed; rate limiting can fail open under extreme load.
3. **Keep the gateway thin** - Route, authenticate, rate limit, transform. Never put business logic in the gateway.

## Gateway Selection

```
GATEWAY              TYPE            BEST FOR                   COST MODEL
---------------------------------------------------------------------------
AWS API GW (HTTP)    Managed         Serverless, low complexity $1/million reqs
AWS API GW (REST)    Managed         WebSocket, caching, WAF    $3.50/million
Kong                 Self-managed    Multi-cloud, plugins, K8s  Open source/EE
Envoy / Istio        Self-managed    Service mesh, gRPC         Free (infra cost)
Traefik              Self-managed    Docker/K8s auto-discovery  Open source/EE
NGINX                Self-managed    Max performance, mature    Open source/Plus
```

```
CHOOSE AWS API GW:  Serverless backend, AWS-native, <10K req/s
CHOOSE KONG:        Multi-cloud, complex plugins, Kubernetes-native
CHOOSE ENVOY:       Service mesh, gRPC-native, fine-grained traffic control
CHOOSE NGINX:       Maximum raw performance, simple routing needs
```

## Kong Configuration

### Declarative Config (kong.yml)

```yaml
_format_version: "3.0"

services:
  - name: user-service
    url: [reference URL]
    connect_timeout: 5000
    read_timeout: 30000
    retries: 3
    routes:
      - name: user-routes
        paths: [/api/v1/users]
        methods: [GET, POST, PUT, DELETE]
        strip_path: false
        protocols: [https]

plugins:
  - name: rate-limiting
    config:
      minute: 100
      hour: 5000
      policy: redis
      redis_host: redis
      fault_tolerant: true        # Fail open if Redis down

  - name: correlation-id
    config:
      header_name: X-Request-ID
      generator: uuid
      echo_downstream: true

  - name: request-size-limiting
    config:
      allowed_payload_size: 10    # MB
```

### Service-Level Plugins

```yaml
plugins:
  - name: rate-limiting
    route: login-route
    config:
      minute: 10                  # Strict limit on login attempts

  - name: jwt
    service: user-service
    config:
      claims_to_verify: [exp]
      header_names: [Authorization]

  - name: request-transformer
    service: user-service
    config:
      add:
        headers: ["X-Gateway-Version:1.0"]
      remove:
        headers: [Cookie]
```

### Kong in Kubernetes

```yaml
apiVersion: configuration.konghq.com/v1
kind: KongPlugin
metadata:
  name: rate-limit-api
plugin: rate-limiting
config:
  minute: 100
  policy: local
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: user-api
  annotations:
    konghq.com/plugins: rate-limit-api,jwt-auth
spec:
  ingressClassName: kong
  rules:
    - host: api.example.com
      http:
        paths:
          - path: /api/v1/users
            pathType: Prefix
            backend:
              service: { name: user-service, port: { number: 8080 } }
```

## AWS API Gateway

### HTTP API (Recommended)

```yaml
Resources:
  HttpApi:
    Type: AWS::Serverless::HttpApi
    Properties:
      StageName: prod
      CorsConfiguration:
        AllowOrigins: ["[reference URL]"]
        AllowMethods: [GET, POST, PUT, DELETE]
        AllowHeaders: [Authorization, Content-Type]
      Auth:
        DefaultAuthorizer: JWTAuthorizer
        Authorizers:
          JWTAuthorizer:
            IdentitySource: $request.header.Authorization
            JwtConfiguration:
              issuer: [reference URL]
              audience: [api.example.com]
      DefaultRouteSettings:
        ThrottlingBurstLimit: 200
        ThrottlingRateLimit: 100
```

### REST API with Usage Plans

```yaml
  UsagePlan:
    Type: AWS::ApiGateway::UsagePlan
    Properties:
      Throttle:
        BurstLimit: 200
        RateLimit: 100
      Quota:
        Limit: 100000
        Period: MONTH
```

## Rate Limiting

### Algorithm Comparison

```
ALGORITHM           HOW IT WORKS                    TRADE-OFF
---------------------------------------------------------------------------
Fixed Window        Count per time window            Simple; burst at edges
Sliding Window      Weighted current + previous      Good accuracy/memory
Token Bucket        Tokens refill at steady rate     Allows controlled bursts
Leaky Bucket        Process at fixed rate, queue     Smooth; no bursts
```

### Multi-Tier Strategy

```
TIER        KEY              LIMIT           PURPOSE
--------------------------------------------------------------
Global      -                10,000 req/s    Protect infrastructure
Per-IP      client IP        100 req/min     Prevent abuse
Per-User    auth token/key   1,000 req/hr    Fair usage
Per-Route   path + method    50 req/min      Protect heavy endpoints
```

### Rate Limit Response

```
HTTP/1.1 429 Too Many Requests
Retry-After: 30
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1705312800
```

## Authentication Patterns

### Gateway Auth Flow

```
Client -> Gateway -> [Auth Plugin] -> Backend Service
                         |
                    Validate token
                    Extract claims
                    Inject headers:
                      X-User-ID, X-User-Role, X-Tenant-ID
                         |
                    Strip Authorization header
                    (backend trusts gateway headers)
```

### API Key Authentication

```yaml
plugins:
  - name: key-auth
    service: api-service
    config:
      key_names: [X-API-Key, apikey]
      key_in_header: true
      key_in_query: true
      hide_credentials: true      # Remove key before proxying
```

## Request/Response Transformation

```yaml
# Add security headers to all responses
plugins:
  - name: response-transformer
    config:
      add:
        headers:
          - "Strict-Transport-Security:max-age=31536000; includeSubDomains"
          - "X-Content-Type-Options:nosniff"
          - "X-Frame-Options:DENY"
      remove:
        headers: [Server, X-Powered-By]
```

## Routing Patterns

```
PATH-BASED:
  /api/v1/users/*     -> user-service:8080
  /api/v1/orders/*    -> order-service:8080
  /api/v2/users/*     -> user-service-v2:8080

HEADER-BASED (e.g., mobile vs web):
  X-Client-Type: mobile  -> user-service-mobile
  X-Client-Type: web     -> user-service-web

CANARY RELEASES:
  10% traffic -> canary backend
  90% traffic -> stable backend
  Sticky routing per consumer for consistency
```

## Caching

```yaml
plugins:
  - name: proxy-cache
    config:
      strategy: redis
      content_type: [application/json]
      request_method: [GET, HEAD]
      response_code: [200, 301]
      cache_ttl: 300
      vary_headers: [Authorization, Accept-Encoding]
      cache_control: true         # Respect Cache-Control headers
```

## Health Checks

```yaml
upstreams:
  - name: user-service
    healthchecks:
      active:
        http_path: /health
        healthy: { interval: 5, successes: 3 }
        unhealthy: { interval: 5, http_failures: 3, timeouts: 3 }
      passive:
        healthy: { successes: 5 }
        unhealthy: { http_failures: 5, timeouts: 3 }
    targets:
      - { target: "user-service-1:8080", weight: 100 }
      - { target: "user-service-2:8080", weight: 100 }
```

## Monitoring

```
METRIC                      ALERT CONDITION
------------------------------------------------------
Request rate                Sudden spike or drop
Error rate (5xx)            > 1% sustained
Latency (p99)               > 2s
Rate limit hits             Sustained high rate
Auth failures               Spike (possible attack)
Upstream health             Any backend unhealthy
Cache hit ratio             < 50%
```

## Production Checklist

```
ROUTING:
  [ ] All routes use HTTPS
  [ ] API versioning implemented
  [ ] Health check endpoints excluded from auth

SECURITY:
  [ ] Auth enforced on all non-public routes
  [ ] Rate limiting (global, per-user, per-route)
  [ ] Request size limits set
  [ ] Security headers on all responses
  [ ] CORS with explicit allowed origins
  [ ] Sensitive headers stripped before proxying

RELIABILITY:
  [ ] Upstream health checks (active + passive)
  [ ] Timeouts on all upstream connections
  [ ] Circuit breaker for failing backends
  [ ] Graceful degradation documented

OBSERVABILITY:
  [ ] Access logging (structured JSON)
  [ ] Metrics exported (Prometheus/CloudWatch)
  [ ] Distributed tracing propagated
  [ ] Alerting on error rate, latency, rate limits
```

## When to Use

**Use this skill when:**
- Designing or implementing api gateway builder solutions
- Reviewing or improving existing api gateway builder approaches
- Making architectural or implementation decisions about api gateway builder
- Learning api gateway builder patterns and best practices
- Troubleshooting api gateway builder-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Api Gateway Builder Analysis

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

**Input:** "Help me implement api gateway builder for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended api gateway builder approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When api gateway builder must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
