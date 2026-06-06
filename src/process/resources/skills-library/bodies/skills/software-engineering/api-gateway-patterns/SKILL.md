---
name: api-gateway-patterns
description: |
  Guides expert-level api gateway patterns implementation: api-design and backend decision frameworks, production-ready patterns, and concrete templates for api gateway patterns workflows.
  Use when the user asks about api gateway patterns, api gateway patterns configuration, or architecture best practices for api projects.
  Do NOT use when the user needs a different architecture design capability -- check sibling skills in the architecture design subcategory.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "architecture api-design backend"
  category: "software-engineering"
  subcategory: "architecture-design"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# API Gateway Patterns

## When to Use

**Use this skill when:**
- A user is designing or refactoring the entry point for a microservices architecture and needs to decide which gateway topology to use (single gateway, Backend for Frontend, multi-tier, etc.)
- A user asks how to implement cross-cutting concerns -- authentication, rate limiting, request transformation, observability -- without duplicating that logic across dozens of services
- A user needs to decide between a self-hosted API gateway (Kong, Envoy, NGINX), a cloud-managed gateway (AWS API Gateway, Azure API Management, Google Cloud Apigee), or a service mesh sidecar pattern
- A user is experiencing reliability issues at the edge -- thundering herds, cascading failures, or uneven traffic distribution across backend replicas -- and needs gateway-level mitigation strategies
- A user is building a mobile or single-page application that aggregates data from multiple microservices and wants to reduce chatty network round trips via request aggregation or BFF pattern
- A user needs to enforce API versioning, deprecation, or traffic shaping (canary releases, blue/green at the edge) for a production API surface
- A user is evaluating whether to add a service mesh (Istio, Linkerd) alongside or instead of a traditional API gateway and needs a clear decision framework
- A user is migrating a monolith to microservices and needs the strangler fig pattern at the routing layer

**Do NOT use this skill when:**
- The user needs help designing internal service-to-service communication contracts without an external-facing edge component -- use an internal RPC/gRPC design skill instead
- The user is asking about REST API design principles (resource naming, HTTP status codes, HATEOAS) without a gateway component -- use an API design skill
- The user needs help with database schema design or query optimization -- this skill does not cover data access patterns
- The user is asking about frontend routing, React Router, or SPA navigation -- this is a client-side concern unrelated to gateway infrastructure
- The user wants a general microservices decomposition strategy (how to split a domain into services) without a gateway question -- use a microservices decomposition skill
- The user is asking about Kubernetes networking primitives (ClusterIP, NodePort, LoadBalancer) without a gateway -- use a Kubernetes networking skill
- The user needs CI/CD pipeline design for deploying gateways -- use a deployment pipeline skill, though this skill's output can inform deployment strategy

---

## Process

### Step 1: Establish the Traffic Topology and Entry Point Requirements

Before selecting any pattern, characterize the traffic entering the system.

- **Identify client types.** Distinguish between browser SPA clients, native mobile apps (iOS/Android), third-party API consumers, internal microservice-to-microservice calls, and IoT devices. Each client type has different payload size expectations, connection persistence requirements (WebSockets vs. HTTP/1.1 vs. HTTP/2), and retry behavior.
- **Quantify expected load.** Determine peak requests per second (RPS), expected p99 latency budget (a common production target is p99 < 200ms at the gateway), and payload sizes. A gateway handling 50,000 RPS has fundamentally different configuration requirements than one handling 500 RPS.
- **Map the upstream service inventory.** List every backend service the gateway will route to, including their protocols (HTTP/REST, gRPC, WebSocket, GraphQL), expected response times, and failure rates. This mapping determines whether aggregation or simple proxying is the right approach.
- **Identify cross-cutting requirements.** Make an explicit list of capabilities that must exist at the edge: authentication (OAuth2/JWT validation, API key check), authorization (RBAC, scope enforcement), rate limiting (per-user, per-plan, per-IP), TLS termination, request/response transformation, logging and tracing, CORS handling, and caching. These requirements heavily influence pattern selection.
- **Determine latency budget allocation.** A total API latency budget of, say, 300ms means the gateway layer should consume no more than 10--20ms for routing and policy enforcement, leaving 280ms for upstream services. Lua-based plugins in Kong or WASM filters in Envoy can add 1--5ms per plugin; a chain of 10 plugins at 3ms each consumes 30ms of budget.

### Step 2: Select the Gateway Topology Pattern

Apply the decision framework below to choose between the four primary topologies.

- **Single Gateway (Monolithic Gateway):** Use when all clients are of the same type, the service count is below ~20, the team is smaller than 10 engineers, and operational simplicity is the priority. A single NGINX Plus or Kong gateway in front of all services is the correct starting point. Drawback: the gateway becomes a bottleneck for team velocity -- every team's routing change goes through the same configuration.
- **Backend for Frontend (BFF):** Use when client types diverge significantly in data shape requirements. Deploy one gateway instance per client surface: one BFF for the mobile app (optimized for bandwidth -- smaller payloads, aggressive caching), one for the web SPA (richer payloads, longer cache TTLs), one for partner API consumers (versioned, schema-validated). Each BFF is owned by the team that owns the client. Netflix, SoundCloud, and Spotify pioneered this pattern at scale.
- **Multi-Tier Gateway (Edge + Internal):** Use when you have a public-facing edge concern (DDoS protection, TLS termination, global CDN routing) separate from internal API management concerns (service discovery, circuit breaking, auth). The edge tier is a global load balancer or CDN with basic routing rules. The internal tier is a full-featured API gateway handling policy enforcement. AWS CloudFront + AWS API Gateway is the canonical managed implementation.
- **Service Mesh with Gateway Ingress:** Use when you need east-west (service-to-service) traffic management in addition to north-south (client-to-gateway) management. The gateway handles external traffic; the service mesh (Istio Ingress Gateway or Linkerd Gateway) handles internal routing, mTLS, and retries. Adds significant operational complexity -- only appropriate for organizations with platform engineering teams of 3+ dedicated engineers.

### Step 3: Design the Authentication and Authorization Pattern

Authentication at the gateway is one of the most consequential architectural decisions.

- **JWT validation at the gateway:** The gateway validates the JWT signature (RS256 or ES256 -- avoid HS256 for distributed systems because it requires sharing the secret), checks expiration, and forwards the decoded claims as HTTP headers (e.g., `X-User-Id`, `X-User-Roles`) to upstream services. Upstream services trust these headers, eliminating the need for each service to perform its own token validation. This is the dominant pattern for stateless microservices. Configure the gateway to reject tokens with `exp` within 0 seconds (no clock skew tolerance beyond 30--60 seconds).
- **OAuth2 token introspection:** For opaque tokens (not JWTs), the gateway calls an introspection endpoint on the Authorization Server for each request. This is expensive -- introspection calls add 5--50ms per request. Mitigate with short-TTL caching of introspection results (30--120 seconds TTL, keyed on token hash). Only use introspection when token revocation must be near-real-time.
- **API key management:** For third-party developer access, issue API keys stored in the gateway's key store (Kong's key-auth plugin, AWS API Gateway usage plans). Associate keys with rate limit tiers: free tier (100 req/day), standard tier (10,000 req/day), premium tier (unlimited with fair-use SLA). Never pass raw API keys to upstream services.
- **mTLS for machine-to-machine:** Service-to-service calls that pass through the gateway should use mutual TLS with client certificates managed by a certificate authority (SPIFFE/SPIRE is the standard for short-lived, automatically rotated certificates). Configure the gateway to require and verify client certificates for designated machine client routes.

### Step 4: Design Rate Limiting and Traffic Shaping

Rate limiting without proper design causes legitimate users to be throttled while adversaries adapt.

- **Choose the rate limiting algorithm.** Token bucket allows short bursts above the sustained rate (appropriate for interactive APIs). Fixed window is simple but creates thundering herds at window boundaries (avoid for high-traffic APIs). Sliding window log is accurate but memory-intensive. Sliding window counter is a practical compromise -- Kong's rate-limiting-advanced plugin implements this. Use token bucket as the default.
- **Define rate limit dimensions.** Apply limits in layers: global rate limit (protects all upstream services from gateway overload, e.g., 100,000 RPS total), per-route limit (protects specific services, e.g., `/search` endpoint at 5,000 RPS), per-consumer limit (prevents API key abuse, e.g., 1,000 req/min per key), per-IP limit (prevents anonymous abuse, e.g., 100 req/min per IP).
- **Use a distributed counter store.** Single-instance rate limiting does not work when the gateway is horizontally scaled. Use Redis with the `INCR` + `EXPIRE` pattern or Redis Lua scripts for atomic counter operations. Set Redis connection pool size to at least 20 connections per gateway instance. Configure a fallback policy (allow or deny) when Redis is unavailable -- defaulting to allow is safer for user experience but riskier for abuse; choose based on abuse profile.
- **Return standard rate limit headers.** Always include `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` (Unix timestamp), and `Retry-After` on 429 responses. Clients that respect these headers will back off gracefully instead of hammering the gateway.
- **Circuit breaking at the gateway.** Configure a circuit breaker per upstream service: open after 5 consecutive 5xx responses or when error rate exceeds 50% over a 10-second window, half-open after 30 seconds, close after 2 consecutive successes. Return `503 Service Unavailable` with a `Retry-After: 30` header when the circuit is open.

### Step 5: Design Request/Response Transformation and Aggregation

Transformation logic belongs at the gateway only when it is client-specific shaping, not business logic.

- **Header manipulation:** Strip internal headers before forwarding upstream (e.g., `X-Internal-Debug`, `X-Forwarded-For` normalization). Inject correlation IDs (`X-Request-Id` or `X-Correlation-Id`) using UUID v4 at the gateway if not already present. Propagate trace context (`traceparent` per W3C Trace Context spec, or `X-B3-TraceId` for Zipkin-compatible systems).
- **Protocol translation:** Use the gateway to translate between REST/HTTP and gRPC (Envoy's gRPC-JSON transcoding or Kong's grpc-gateway plugin). Translate between WebSocket and HTTP long-polling for legacy clients. Never put business logic in protocol translation -- it should be purely structural transformation.
- **Request aggregation (fan-out):** When a single client request requires data from 3+ microservices, implement aggregation at the BFF layer using parallel upstream calls with a timeout. Set a hard deadline of total_timeout = max_upstream_latency + 50ms buffer. Use the GraphQL federation pattern (Apollo Router as the gateway) when aggregation relationships are complex and evolve frequently. For simpler cases, a custom BFF with parallel HTTP calls suffices.
- **Response caching:** Cache GET responses at the gateway for endpoints where freshness tolerance exceeds 1 second. Use Varnish or built-in Kong proxy-cache plugin. Set cache keys based on URI + relevant query params + `Authorization` header hash (never cache per raw auth token). Configure `Cache-Control: max-age` upstream to drive gateway TTL, or override with gateway-level TTL policies. Never cache responses to requests with `Authorization` headers at a shared cache layer without per-user cache isolation.
- **Content negotiation:** Handle `Accept: application/json` vs `Accept: application/xml` at the gateway for legacy clients by transforming JSON responses from modern upstream services. Use XSLT or jq-based transformations. Document the overhead -- JSON-to-XML transformation adds 2--15ms depending on payload size.

### Step 6: Implement Observability at the Gateway Layer

The gateway is the single best place to collect API-level telemetry because all traffic passes through it.

- **Structured access logging.** Log every request with: timestamp (ISO8601), method, path (stripped of PII query params), status code, upstream service name, upstream latency (ms), total gateway latency (ms), client IP (hashed if GDPR-applicable), user ID (from decoded JWT claims), request size (bytes), response size (bytes), and request ID. Output as structured JSON to stdout for log aggregation (Fluentd, Logstash). Log at INFO level for 2xx/3xx, WARN for 4xx, ERROR for 5xx.
- **Metrics emission.** Emit the following Prometheus metrics from the gateway: `gateway_requests_total` (counter, labels: method, route, status_class, upstream_service), `gateway_request_duration_seconds` (histogram, buckets: 5ms, 10ms, 25ms, 50ms, 100ms, 250ms, 500ms, 1s, 2.5s), `gateway_upstream_errors_total` (counter, labels: upstream_service, error_type), `gateway_rate_limit_hits_total` (counter, labels: consumer, route). Set scrape interval to 15 seconds.
- **Distributed tracing.** Inject or propagate trace context on every request. Configure sampling at 1--5% for high-traffic APIs (10,000+ RPS), 100% for low-traffic or debugging scenarios. Send spans to a collector (Jaeger, Zipkin, or OpenTelemetry Collector). Tag gateway spans with: upstream service name, route ID, consumer ID, plugin execution times.
- **Alerting thresholds.** Alert on: p99 latency > 500ms sustained for 5 minutes, error rate (5xx) > 1% over 5 minutes, circuit breaker open for any upstream, rate limit hit rate > 10% of total requests, Redis connection pool saturation > 80%.

### Step 7: Design for High Availability and Deployment

A gateway with a single point of failure is an unacceptable production architecture.

- **Horizontal scaling.** Run a minimum of 3 gateway instances across 3 availability zones (for cloud deployments). Use a load balancer (AWS ALB, GCP Load Balancing) in front of the gateway tier with health checks every 10 seconds. Gateway instances must be stateless -- all shared state (rate limit counters, session data) lives in external Redis or etcd.
- **Configuration management.** Store gateway configuration in version control (GitOps). Use Kong's declarative configuration (deck tool) or Envoy's xDS API driven by a control plane (Istio Pilot). Never make manual configuration changes to production gateways -- all changes go through pull request + CI validation + automated deployment. Configuration drift is a leading cause of gateway outages.
- **Canary and blue/green at the gateway.** Implement traffic splitting at the gateway routing layer: route 5% of traffic to the new service version, 95% to the stable version. Use weighted round-robin upstream load balancing. Monitor error rates for both versions for 15--30 minutes before promoting the canary. This eliminates the need for DNS-based blue/green switching for most scenarios.
- **Graceful degradation.** Define fallback responses for each critical upstream: return a cached stale response (if available and acceptable), return a predetermined static response, or return a 503 with a descriptive error body (including `X-Error-Service` header identifying which upstream failed). Never let an upstream failure propagate as a generic 500 from the gateway.
- **TLS configuration.** Terminate TLS at the gateway. Use TLS 1.2 minimum (TLS 1.3 preferred). Configure cipher suites to exclude RC4, DES, 3DES, and export ciphers. Use HSTS with `max-age=31536000; includeSubDomains; preload`. Rotate certificates automatically with cert-manager (Kubernetes) or AWS Certificate Manager. Set certificate expiry alerts at 30 days and 7 days.

### Step 8: Validate, Test, and Document the Gateway Configuration

Gateway configuration bugs cause production outages that are difficult to diagnose without proper testing.

- **Contract testing.** Write consumer-driven contract tests (using Pact or similar) that validate the gateway's routing rules produce the expected upstream calls. Run these in CI on every configuration change.
- **Load testing.** Before any significant traffic increase, load test the gateway with k6 or Locust at 2x expected peak RPS. Validate that p99 latency stays within budget, rate limiting fires at the correct thresholds, and circuit breakers open and recover correctly.
- **Chaos engineering.** Inject upstream failures (using Toxiproxy or Chaos Monkey) and verify: circuit breakers open at the correct thresholds, fallback responses are returned correctly, alerts fire within expected time windows, and the gateway continues serving other routes unaffected.
- **Configuration validation.** Use `deck validate` for Kong, `envoy --mode validate` for Envoy, or `kic --dry-run` for Kubernetes Ingress Controller configurations before deploying. Prevent syntactically invalid configurations from ever reaching production.
- **Document with OpenAPI + gateway overlay.** Maintain an OpenAPI 3.x spec for the public API surface exposed by the gateway. Add gateway-specific extensions (`x-rate-limit`, `x-auth-required`, `x-cache-ttl`) as vendor extensions to document gateway behavior alongside API contracts. Publish this documentation to a developer portal (Backstage, Redoc).

---

## Output Format

When providing API gateway pattern guidance, structure the response as follows:

```
## API Gateway Pattern Analysis

### Traffic Profile
| Dimension              | Value                          | Notes                                  |
|------------------------|-------------------------------|----------------------------------------|
| Client Types           | [list]                        | Drives BFF vs. single gateway decision |
| Peak RPS               | [number]                      | Sizing and rate limit baseline         |
| p99 Latency Budget     | [ms]                          | Gateway overhead target: <10% of total |
| Protocol(s)            | [REST/gRPC/WebSocket/GraphQL] | Drives protocol translation needs      |
| Upstream Service Count | [number]                      | Affects routing complexity             |

### Selected Pattern
**Pattern:** [Single Gateway | BFF | Multi-Tier | Service Mesh Ingress]
**Rationale:** [2-4 sentences explaining why this pattern fits the specific profile above]

### Cross-Cutting Concern Configuration

| Concern         | Mechanism                              | Configuration                                      |
|-----------------|----------------------------------------|----------------------------------------------------|
| Authentication  | [JWT Validation / API Key / mTLS]      | [Algorithm, cache TTL, header forwarding spec]     |
| Rate Limiting   | [Token Bucket / Sliding Window]        | [Per-consumer limit, per-route limit, Redis config]|
| Circuit Breaker | [Error threshold / timeout config]     | [Open threshold, half-open delay, fallback]        |
| Caching         | [Cache-Control / gateway-level TTL]    | [TTL value, cache key spec, invalidation strategy] |
| Observability   | [Prometheus metrics / trace context]   | [Sampling rate, log fields, alert thresholds]      |
| TLS             | [Termination config]                   | [Min version, cipher policy, cert rotation]        |

### Routing Rules

| Route Pattern         | Upstream Service    | Auth Required | Rate Limit        | Circuit Breaker |
|-----------------------|---------------------|---------------|-------------------|-----------------|
| GET /api/v1/[resource]| [service-name]:[port]| JWT (scope)  | 1000 req/min/user | 5xx > 50%/10s   |
| POST /api/v1/[action] | [service-name]:[port]| JWT + RBAC   | 100 req/min/user  | 5xx > 20%/10s   |

### Implementation Artifacts

#### Gateway Configuration Snippet
```yaml
# [Kong / Envoy / NGINX config for the primary route]
[concrete configuration block]
```

#### Redis Rate Limit Configuration
```
[Connection pool settings, key schema, fallback policy]
```

#### Observability Setup
```
[Prometheus scrape config, alert rule examples]
```

### Trade-off Summary
| Decision           | Chosen Approach       | Alternative Considered | Reason for Choice               |
|--------------------|-----------------------|------------------------|---------------------------------|
| [decision point]   | [chosen]              | [alternative]          | [specific technical rationale]  |

### Operational Runbook (Brief)
- **Scale up:** [specific trigger metric and action]
- **Circuit breaker open:** [diagnosis steps and recovery procedure]
- **Rate limit spike:** [investigation steps]
- **Certificate expiry:** [rotation procedure]
```

---

## Rules

1. **NEVER put business logic in the gateway.** Request routing, authentication verification, rate limiting, and structural transformation are gateway concerns. Calculating a discount, resolving a product recommendation, or evaluating business rules must happen in upstream services. A gateway that embeds business logic becomes a deployment bottleneck and violates service ownership.

2. **ALWAYS keep gateway instances stateless.** Any state required for consistent behavior across gateway replicas (rate limit counters, session tokens, circuit breaker state) must live in an external store (Redis, etcd). Gateway instances that store local state produce split-brain rate limiting, inconsistent routing decisions, and impossible-to-debug production issues.

3. **NEVER trust upstream-originated `X-Forwarded-*` headers from untrusted sources.** Attackers can spoof `X-Forwarded-For` to bypass IP-based rate limits. Strip and rewrite `X-Forwarded-For` at the gateway using the actual connection's source IP. Only propagate headers from trusted upstream layers (load balancer to gateway).

4. **ALWAYS validate JWT signatures at the gateway, not just decode them.** An unsigned JWT (algorithm `none`) or a weak HS256 JWT is trivially forged. Pin the gateway to RS256 or ES256, fetch the JWKS from the authorization server at startup and on a 60-minute rotation schedule, and reject any token signed with an unexpected algorithm.

5. **NEVER set rate limits without testing them against real traffic patterns.** A rate limit of 100 req/min per user sounds reasonable until you realize your mobile app makes 8 API calls per user interaction, meaning 12 user interactions saturate the limit. Analyze real traffic from staging or production logs before setting limits. Common safe starting points: 1,000 req/min for interactive user sessions, 10,000 req/min for server-to-server, adjusted down from there based on abuse profile.

6. **ALWAYS use health check endpoints that test real upstream connectivity.** A gateway health check that returns 200 without probing upstream services gives false confidence. Implement a `/health/ready` endpoint that checks database connectivity (if applicable), Redis connectivity, and at least one critical upstream service availability. Return 503 if any critical dependency is unhealthy, causing the load balancer to route traffic away from the unhealthy instance.

7. **NEVER cache responses that contain per-user data in a shared cache without cache key isolation.** Cache keys must include a user-identifying component (hashed user ID or consumer ID) when the response content differs per user. Failure to do this causes data leakage -- user A receives user B's cached response. This is a catastrophic security failure.

8. **ALWAYS version the API at the routing layer, not only in the URL path.** Support both URL-based versioning (`/v1/`, `/v2/`) and `Accept` header versioning (`Accept: application/vnd.api+json;version=2`). Plan for at least a 6-month deprecation runway when retiring a version -- announce at least 90 days in advance with `Deprecation` and `Sunset` response headers per RFC 8594.

9. **NEVER configure timeouts that are longer than the client's timeout.** If a mobile client has a 5-second HTTP timeout and the gateway upstream timeout is 30 seconds, the client will disconnect before the gateway finishes, wasting resources on a response nobody will receive. Set gateway upstream timeouts to 80% of the known client timeout, or to a value derived from the p99 upstream response time + 2 standard deviations.

10. **ALWAYS test gateway configuration changes in a staging environment with production-mirrored traffic before deploying.** Use traffic shadowing (Envoy's `mirror` policy or NGINX `mirror` directive) to replay a percentage of production traffic to the staging gateway and compare response status codes and latencies. A configuration change that produces even a 0.1% increase in error rate on mirrored traffic should be investigated before production deployment.

---

## Edge Cases

### Legacy Monolith Coexistence (Strangler Fig Pattern)
When a monolith is being incrementally replaced by microservices, the gateway must route some paths to the monolith and others to new services simultaneously. Configure the gateway with explicit route matching priority: more-specific routes (e.g., `/api/orders/`) route to the new orders microservice, and a catch-all route (`/`) forwards everything else to the monolith. Use a fallback routing strategy where the gateway can try the new service and fall back to the monolith on 404 or 503 responses -- this allows partial migration without client changes. Track which routes still hit the monolith using a dedicated `X-Routed-To: monolith` response header for monitoring. Do not attempt to migrate all routes simultaneously; migrate one bounded context at a time.

### Multi-Region Active-Active Deployments
When the gateway must operate across multiple geographic regions with active-active traffic routing, rate limit state cannot be globally consistent without unacceptable cross-region latency (a Redis write from us-east-1 to eu-west-1 adds 80--120ms, making synchronous global rate limiting impossible). Use regional rate limits with a factor applied: if the global limit is 1,000 req/min, configure each of 3 regions at 600 req/min (60% each, totaling 180% of global -- this over-counts but prevents region failures from concentrating all traffic into one region and blowing the global limit). Use global approximate counting only for abuse detection, not strict enforcement. Route users to their nearest region using latency-based DNS (Route53 or Cloud DNS with latency routing policies) to minimize cross-region state conflicts.

### gRPC and HTTP/2 Protocol Handling
gRPC uses HTTP/2 with long-lived streaming connections. Many traditional API gateways (NGINX without special configuration, HAProxy pre-2.0) handle HTTP/2 poorly, treating each stream as a separate connection and failing to honor gRPC flow control. When your gateway must support gRPC: use Envoy (natively HTTP/2 aware), Kong with the grpc-gateway plugin, or the Kubernetes Gateway API with an HTTP/2-capable data plane. Configure the gateway with `grpc_read_timeout`, `grpc_send_timeout`, and `grpc_connect_timeout` separately from HTTP/1.1 timeouts, because gRPC streaming calls may legitimately last minutes or hours. Never set a blanket connection timeout that kills long-running gRPC streams prematurely.

### Handling Asymmetric Traffic Spikes (Flash Crowds)
When a single event (marketing campaign launch, viral content, scheduled batch job triggering callbacks) causes traffic to spike 10--50x above baseline within seconds, standard auto-scaling cannot respond fast enough (EC2/GKE scale-out takes 2--5 minutes minimum). The gateway must absorb the spike without cascading failures. Strategies in priority order: (1) pre-scale gateway instances before known events, (2) configure priority queuing at the gateway -- authenticated paying users get higher priority than anonymous requests, (3) enable request shedding at a configurable RPS threshold (return 429 to lowest-priority traffic), (4) use a queue-based load leveling pattern where the gateway writes requests to a queue (SQS, Kafka) instead of synchronously calling the upstream, and the upstream drains the queue at its sustainable rate. The synchronous-to-asynchronous shift requires client cooperation (polling or webhook callbacks) -- design this escape hatch into the API contract from the start.

### Certificate Pinning and Client Certificate Validation (Zero Trust)
In zero-trust network architectures where the gateway must validate that all callers present a valid client certificate, the certificate revocation mechanism becomes critical. OCSP stapling reduces per-request revocation check overhead (the gateway caches the OCSP response and attaches it to the TLS handshake, avoiding real-time OCSP lookups). OCSP stapling responses are valid for 24--48 hours -- configure the gateway to refresh them every 12 hours. For short-lived certificates issued by SPIFFE/SPIRE (TTL of 1 hour), traditional CRL and OCSP are impractical; rely on expiry-based revocation instead (a compromised cert expires within 1 hour). Configure the gateway to reject client certificates with `notAfter` within 0 seconds and alert when a service presents a certificate expiring within 2 hours (indicating a broken auto-rotation).

### GraphQL Gateway Specifics
A GraphQL gateway (Apollo Router, GraphQL Mesh, Hasura) behaves differently from a REST gateway in ways that break standard gateway patterns. Specifically: all GraphQL requests use POST to a single endpoint (`/graphql`), making URL-based rate limiting and route-specific policies useless. Implement query complexity analysis -- calculate a complexity score based on field depth and list multipliers (e.g., depth 1 = 1 point, each nested level multiplies by 3, list fields multiply by their `first`/`limit` argument). Reject queries with complexity > 1000. Implement query depth limiting (max depth 10 is a common default). For persistent queries (trusted clients submit a query hash instead of full query text), use an allow-list approach -- only pre-registered query hashes are accepted in production, preventing arbitrary query injection. Rate limit on query complexity units rather than request count: a consumer gets 10,000 complexity units per minute rather than a flat request count.

### WebSocket Connection Management
WebSocket connections are long-lived (minutes to hours), which means a gateway handling 10,000 concurrent WebSocket connections holds 10,000 persistent upstream connections simultaneously. This exhausts file descriptor limits and upstream connection pools far faster than equivalent HTTP/1.1 traffic. Configure: OS-level `ulimit -n` to at least 65,536 per gateway process, `net.ipv4.tcp_keepalive_time` to 60 seconds (detect dead connections faster than the default 7200 seconds), and upstream WebSocket connection timeouts to close idle connections after 5 minutes if the application layer has its own heartbeat mechanism. Use sticky sessions (consistent hashing by session ID) to route WebSocket reconnects to the same upstream instance -- WebSocket state is usually stored in memory on the upstream server, and a reconnect to a different instance will fail the connection unless state is externalized to Redis. Never use round-robin load balancing for WebSocket upstreams.

### API Gateway in Serverless / Function-as-a-Service Environments
When upstream services are serverless functions (AWS Lambda, Google Cloud Functions), cold starts introduce latency spikes that break standard circuit breaker configurations. A cold start can add 500ms--3000ms to the first request after a function scales from zero. Configure: circuit breaker error counting to exclude requests with latency > 3000ms from error rate calculation during scale-from-zero scenarios (use a separate slow-request counter), provision minimum instances (Lambda Provisioned Concurrency) for critical path functions to eliminate cold starts on hot paths, and set the gateway upstream timeout to at least 5 seconds for Lambda-backed routes (not the 200ms appropriate for pre-warmed containers). Use the gateway's caching aggressively for Lambda-backed read endpoints -- every cached response avoids a Lambda invocation, reducing both cost and cold start exposure.

---

## Example

**Input:** "We're building a B2B SaaS platform. We have 12 microservices, a React web app, and partner companies that integrate with our API programmatically. We need to handle authentication, rate limiting by plan tier, and we're worried about one service going down taking the whole platform with it. We're on AWS. What gateway pattern should I use and how do I configure it?"

**Output:**

## API Gateway Pattern Analysis

### Traffic Profile
| Dimension              | Value                                  | Notes                                             |
|------------------------|----------------------------------------|---------------------------------------------------|
| Client Types           | Web SPA, B2B partner API consumers    | Two distinct consumer profiles -- BFF candidate   |
| Peak RPS (estimated)   | 2,000--5,000 (size-up at onboarding)  | Start with headroom; add capacity at 70% sustained|
| p99 Latency Budget     | 300ms total, <30ms gateway overhead   | B2B SLA typically 99.9% < 500ms                  |
| Protocols              | REST/JSON (HTTP/1.1 + HTTP/2)         | No gRPC or WebSocket complexity initially         |
| Upstream Service Count | 12 services                           | Within single-gateway range; BFF adds team clarity|

### Selected Pattern
**Pattern:** Multi-Tier with BFF Layer

**Rationale:** The two distinct client types (web SPA vs. B2B API consumers) justify separate BFF instances -- the web SPA BFF can perform request aggregation (reducing round trips for the React app) while the partner API BFF enforces strict versioning, plan-based rate limiting, and schema validation that partners depend on for stability. Both BFFs sit behind an AWS ALB edge tier that handles TLS termination, DDoS mitigation, and geographic routing. This separates concerns cleanly: the edge tier is managed infrastructure, and the BFF tier is application-owned and deployed via the application team's CI/CD pipeline.

The 12 upstream microservices make a single gateway viable, but the BFF split is justified because partner API stability guarantees would otherwise conflict with the React app's need for rapid iteration on aggregation endpoints.

### Cross-Cutting Concern Configuration

| Concern         | Mechanism                                    | Configuration                                                                                                     |
|-----------------|----------------------------------------------|-------------------------------------------------------------------------------------------------------------------|
| Authentication  | JWT Validation (RS256, JWKS endpoint)        | Fetch JWKS every 60 min; forward `X-User-Id`, `X-Org-Id`, `X-Plan-Tier` as headers; reject `alg: none`          |
| Rate Limiting   | Token Bucket, Redis-backed, per-consumer key | Free: 1,000 req/hr; Growth: 10,000 req/hr; Enterprise: 100,000 req/hr; Redis cluster with 3 nodes + sentinel     |
| Circuit Breaker | Error rate threshold per upstream            | Open: >50% 5xx in 10s window (min 10 requests); Half-open: 30s; Close: 3 consecutive successes; fallback: 503   |
| Caching         | Gateway-level proxy cache (Kong)             | GET endpoints: 30s TTL; cache key = method + path + query params + `X-Org-Id` hash; no caching on POST/PUT/DELETE|
| Observability   | Prometheus + structured JSON logs            | Metrics scrape every 15s; traces at 5% sampling (Jaeger); p99 alert at >300ms for 5 min; 5xx alert at >1%       |
| TLS             | Termination at ALB                           | TLS 1.2 minimum, TLS 1.3 preferred; HSTS max-age=31536000; cert rotation via AWS ACM (auto-renewal)              |

### Routing Rules

| Route Pattern              | Upstream Service         | Auth Required              | Rate Limit                   | Circuit Breaker          |
|----------------------------|--------------------------|----------------------------|------------------------------|--------------------------|
| `GET /api/v1/reports/*`    | reporting-service:8080   | JWT (scope: reports:read)  | Per plan tier                | 5xx > 50% / 10s window   |
| `POST /api/v1/orders`      | order-service:8080       | JWT (scope: orders:write)  | 100 req/min per org          | 5xx > 20% / 10s window   |
| `GET /api/v1/catalog/*`    | catalog-service:8080     | JWT (scope: catalog:read)  | Per plan tier + 30s cache    | 5xx > 50% / 10s window   |
| `POST /api/v1/webhooks/*`  | webhook-service:8080     | mTLS client cert           | 1,000 req/min per partner    | 5xx > 30% / 10s window   |
| `GET /health/ready`        | internal health check    | None                       | None (exempt)                | None                     |

### Implementation Artifacts

#### Kong Declarative Configuration (deck format) -- Partner BFF core routing

```yaml
_format_version: "3.0"

services:
  - name: order-service
    url: http://order-service.internal:8080
    connect_timeout: 5000     # 5 seconds -- Lambda or cold-start safe if needed
    write_timeout: 10000
    read_timeout: 10000
    routes:
      - name: create-order
        methods: [POST]
        paths: [/api/v1/orders]
        strip_path: false
    plugins:
      - name: jwt
        config:
          key_claim_name: kid
          claims_to_verify: [exp, nbf]
          uri_param_names: []          # disable JWT in query params -- header only
      - name: rate-limiting-advanced
        config:
          limit: [100]
          window_size: [60]
          window_type: sliding
          identifier: consumer
          namespace: order-service
          sync_rate: 2                 # sync to Redis every 2 seconds
          strategy: redis
          redis:
            host: redis-cluster.internal
            port: 6379
            timeout: 200               # fail fast -- 200ms Redis timeout
            database: 0
          error_code: 429
          error_message: "Rate limit exceeded. See X-RateLimit-Reset for retry time."
      - name: response-transformer
        config:
          add:
            headers:
              - "X-Gateway-Version: 2024-01"
      - name: correlation-id
        config:
          header_name: X-Request-Id
          generator: uuid#counter
          echo_downstream: true
      - name: prometheus
        config:
          per_consumer: true
          status_code_metrics: true
          latency_metrics: true
          bandwidth_metrics: true

  - name: catalog-service
    url: http://catalog-service.internal:8080
    connect_timeout: 3000
    write_timeout: 5000
    read_timeout: 5000
    routes:
      - name: get-catalog
        methods: [GET]
        paths: [/api/v1/catalog]
        strip_path: false
    plugins:
      - name: proxy-cache
        config:
          response_code: [200]
          request_method: [GET]
          content_type: ["application/json"]
          cache_ttl: 30
          strategy: memory
          cache_control: false         # gateway controls TTL, not upstream headers
```

#### Redis Rate Limit Key Schema and Fallback Policy

```
Key format:  ratelimit:{namespace}:{identifier}:{window_start_unix}
Example key: ratelimit:order-service:consumer:org_abc123:1704067200
Value:       integer counter (INCR)
TTL:         window_size_seconds * 2  (double TTL prevents early expiry edge cases)

Connection pool per gateway instance: 20 connections minimum
Max pool size: 50 connections
Connection timeout: 200ms
Command timeout: 100ms

Fallback policy (Redis unreachable): ALLOW
Rationale: Availability > strict rate limiting; log all requests during Redis outage
           for retrospective abuse analysis. Alert fires within 60s of Redis failure.

Sentinel config (high availability):
  sentinel_master_name: mymaster
  sentinel_addresses:
    - redis-sentinel-1.internal:26379
    - redis-sentinel-2.internal:26379
    - redis-sentinel-3.internal:26379
```

#### Prometheus Alert Rules

```yaml
groups:
  - name: api-gateway
    interval: 30s
    rules:
      - alert: GatewayHighErrorRate
        expr: |
          sum(rate(kong_http_requests_total{code=~"5.."}[5m]))
          /
          sum(rate(kong_http_requests_total[5m])) > 0.01
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "API Gateway 5xx rate exceeded 1% for 5 minutes"
          runbook: "Check circuit breaker status; inspect upstream service logs"

      - alert: GatewayHighLatency
        expr: |
          histogram_quantile(0.99,
            sum(rate(kong_request_latency_ms_bucket[5m])) by (le, route)
          ) > 300
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Gateway p99 latency above 300ms on route {{ $labels.route }}"

      - alert: RedisConnectionPoolSaturation
        expr: |
          kong_redis_connections_active / kong_redis_connections_total > 0.80
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "Redis connection pool at {{ $value | humanizePercentage }} capacity"
```

### Trade-off Summary

| Decision                       | Chosen Approach                        | Alternative Considered              | Reason for Choice                                                             |
|--------------------------------|----------------------------------------|-------------------------------------|-------------------------------------------------------------------------------|
| Single vs. BFF gateway         | BFF (web SPA + partner API separation) | Single gateway with route policies  | Partner API stability guarantees conflict with SPA rapid iteration cadence    |
| Self-hosted Kong vs. AWS APIGW | Self-hosted Kong on ECS Fargate        | AWS API Gateway                     | AWS APIGW costs scale per-request; at 5,000 RPS Kong has 60--70% lower cost  |
| JWT vs. API key for partners   | JWT (RS256) primary + API key fallback | API key only                        | JWT carries plan tier claims, eliminating per-request authorization lookups   |
| Synchronous vs. queue-backed   | Synchronous for all routes initially   | SQS-backed for high-write endpoints | Simpler to operate; revisit if order-service becomes the saturation bottleneck|
| Redis rate limit TTL strategy  | 2x window TTL                          | Exact window TTL                    | Prevents race condition where counter expires mid-window, resetting the count |

### Operational Runbook (Brief)

- **Scale up trigger:** CPU > 70% sustained 10 minutes OR p99 > 200ms sustained 5 minutes -- add 2 ECS Fargate tasks per gateway type (web BFF, partner BFF); pre-scale 30 minutes before known high-traffic events
- **Circuit breaker open:** Check `GET /status` on the affected upstream service; inspect CloudWatch logs for the upstream ECS task; if service is healthy, check for slow queries (RDS slow query log); close the breaker manually only after confirming upstream recovery via `/health/ready`
- **Rate limit spike:** Query `redis-cli KEYS "ratelimit:*:org_*"` to identify the offending org; check whether it is legitimate load growth (upgrade plan) or abuse (block via gateway consumer policy); review `X-RateLimit-Remaining` headers in access logs to confirm pattern
- **Certificate expiry alert (30 days):** ACM handles auto-renewal -- verify auto-renewal is enabled in ACM console; if manual cert, initiate renewal via Let's Encrypt / internal CA; update Kong certificate object via `deck sync` after renewal
- **Redis node failure:** Sentinel promotes replica automatically within 30 seconds; verify promotion with `redis-cli -p 26379 SENTINEL masters`; add replacement node within 2 hours to restore full sentinel quorum
