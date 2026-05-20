---
name: rest-api-implementation
description: |
  Guides expert-level rest api implementation implementation: api-design and frameworks decision frameworks, production-ready patterns, and concrete templates for rest api implementation workflows.
  Use when the user asks about rest api implementation, rest api implementation configuration, or api-design best practices for rest projects.
  Do NOT use when the user needs a different backend infrastructure capability -- check sibling skills in the backend infrastructure subcategory.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "api-design frameworks web-development"
  category: "backend-systems"
  subcategory: "backend-infrastructure"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# REST API Implementation

## When to Use

**Use this skill when:**
- User is designing or building a new REST API from scratch and needs guidance on resource modeling, endpoint structure, HTTP semantics, and versioning strategy
- User has an existing API with pain points -- inconsistent naming, poor error messages, versioning problems, authentication gaps -- and wants to refactor toward production-grade patterns
- User needs to choose between REST and other API paradigms (GraphQL, gRPC, tRPC) and wants a structured comparison for their use case
- User is implementing specific REST concerns: pagination, filtering, sorting, bulk operations, idempotency keys, rate limiting, or HATEOAS links
- User needs production-readiness guidance: authentication middleware, request validation, structured error responses, OpenAPI documentation generation, or HTTP caching headers
- User is building an API gateway or aggregation layer that needs to expose a clean REST interface over internal services
- User is debugging API design problems such as N+1 query exposure, chatty APIs causing excessive round trips, or clients breaking on schema changes

**Do NOT use this skill when:**
- User needs help designing a GraphQL schema, resolvers, or subscriptions -- use the GraphQL schema design skill instead
- User is building event-driven or message-broker integrations (Kafka, RabbitMQ, NATS) -- use the async messaging skill
- User needs gRPC service definition, Protobuf schema design, or bidirectional streaming -- use the gRPC implementation skill
- User is asking about WebSocket-based real-time communication -- use the real-time API skill
- User needs database schema design independent of API exposure -- use the database modeling skill
- User needs API gateway infrastructure (load balancing, service mesh, Istio configuration) -- use the infrastructure gateway skill
- User is asking about frontend HTTP client patterns (Axios, fetch wrappers, SWR, React Query) -- use the HTTP client integration skill

---

## Process

### Step 1: Establish the API's Resource Model

Before writing a single endpoint, define the domain resources and their relationships. This is the foundation everything else builds on.

- Identify the core domain entities by asking: what are the nouns in this system? (e.g., `users`, `orders`, `products`, `shipments`). Resources should be plural nouns, never verbs.
- Map entity relationships: one-to-one, one-to-many, many-to-many. Sub-resources (nested routes) are appropriate only when the child resource has no independent identity outside the parent -- for example `/orders/{orderId}/line-items` is correct because line items do not exist without an order; `/orders/{orderId}/products` is wrong because products exist independently and should be linked, not nested.
- Distinguish between resources (persistent domain objects with stable IDs) and actions (operations that do not map neatly to CRUD). Actions like `POST /orders/{orderId}/cancel` or `POST /payments/{paymentId}/refund` are acceptable as sub-resource verbs when there is no clean resource mapping.
- Decide on identifier strategy: use UUIDs (v4 or v7) for public-facing IDs to prevent enumeration attacks, internal surrogate keys for database joins. Never expose sequential integer IDs in public APIs.
- Define the canonical URL structure: `/{version}/{collection}/{id}/{sub-collection}/{sub-id}`. Keep nesting depth to a maximum of 2 levels. Anything deeper signals a modeling problem.

### Step 2: Define HTTP Semantics and Method Contracts

Each HTTP method has specific behavioral contracts that clients and intermediaries (proxies, CDNs) rely on. Violating these breaks caching, retry logic, and idempotency assumptions.

- **GET** -- safe and idempotent. Must never mutate state. Use for all reads. Supports conditional requests via `If-None-Match` (ETag) and `If-Modified-Since`.
- **POST** -- neither safe nor idempotent. Use for resource creation (returns 201 + `Location` header) and non-idempotent actions. For idempotent POST operations (payment submissions, job dispatches), require an `Idempotency-Key` header and store key-to-response mappings for at least 24 hours.
- **PUT** -- idempotent, full replacement. The request body must contain the complete resource representation. Use when clients have the full state. Appropriate for settings objects, configuration documents.
- **PATCH** -- partial update. Use JSON Merge Patch (RFC 7396) for simple field updates or JSON Patch (RFC 6902) for precise array and structural operations. Never use PATCH for operations that are not idempotent.
- **DELETE** -- idempotent. Should return 204 (no content) on success. A second DELETE on the same resource should return 404 or 204, never 500. Implement soft deletes at the database layer; expose only logical deletion in the API.
- **HEAD** -- identical to GET but no response body. Support HEAD on all GET endpoints automatically -- it allows clients to check existence and freshness without transferring payload.
- **OPTIONS** -- support on all endpoints for CORS preflight. Never implement custom logic in OPTIONS handlers.

### Step 3: Design Status Code and Error Response Strategy

Inconsistent status codes and vague error messages are the single most common API usability problem. Define and document a strict contract.

- Use the full HTTP status code vocabulary correctly:
  - 200 OK -- successful GET, PUT, PATCH with response body
  - 201 Created -- successful POST that creates a resource; include `Location: /resources/{id}` header
  - 202 Accepted -- async operation started; include a status polling URL
  - 204 No Content -- successful DELETE or PUT/PATCH with no response body
  - 400 Bad Request -- malformed request syntax, failed validation
  - 401 Unauthorized -- missing or invalid authentication credentials
  - 403 Forbidden -- authenticated but not authorized; the resource exists but access is denied
  - 404 Not Found -- resource does not exist; also use when intentionally hiding existence from unauthorized callers
  - 409 Conflict -- optimistic lock failure, duplicate resource creation, state machine violation
  - 410 Gone -- resource was permanently deleted (supports client cache invalidation)
  - 422 Unprocessable Entity -- request is syntactically valid but semantically invalid (business rule violation)
  - 429 Too Many Requests -- rate limit exceeded; include `Retry-After` header in seconds
  - 500 Internal Server Error -- unhandled server error; never leak stack traces
  - 503 Service Unavailable -- temporary downtime; include `Retry-After` header
- Standardize error response body using RFC 7807 (Problem Details for HTTP APIs):
  ```json
  {
    "type": "https://api.example.com/errors/validation-failed",
    "title": "Request Validation Failed",
    "status": 422,
    "detail": "The 'email' field must be a valid email address.",
    "instance": "/users",
    "errors": [
      { "field": "email", "code": "INVALID_FORMAT", "message": "Must match RFC 5322 format" },
      { "field": "birthDate", "code": "FUTURE_DATE", "message": "Birth date cannot be in the future" }
    ],
    "traceId": "01HX4T2Z3M8K9P1Q"
  }
  ```
- Include a machine-readable `code` string alongside the human-readable `message` so clients can handle errors programmatically without parsing strings.
- Always include a `traceId` or `requestId` that links to your distributed tracing system (Jaeger, Zipkin, Datadog APM). Log the same ID server-side.

### Step 4: Implement Versioning Strategy

Versioning is a commitment, not an afterthought. Decide before you accept the first external consumer.

- **URL path versioning** (`/v1/users`, `/v2/users`) -- most common, most visible, easiest to route at the gateway layer, easy to test in a browser. Recommended for public APIs and APIs consumed by mobile clients that cannot set headers. The version prefix should be a major version only (not `/v1.2/`).
- **Header versioning** (`Accept: application/vnd.example.v2+json`) -- cleaner URLs, follows HTTP content negotiation semantics, but harder to test and harder to document. Appropriate for internal APIs where clients are controlled.
- **Query parameter versioning** (`/users?version=2`) -- avoid for anything other than experimental APIs; it pollutes URLs, breaks caching, and is easy to omit accidentally.
- Define a deprecation lifecycle: deprecated versions receive a `Deprecation: true` header and a `Sunset: <date>` header (RFC 8594) on every response. Minimum deprecation window is 6 months for external APIs, 3 months for internal APIs.
- Never make breaking changes within a version. A breaking change is: removing a field, changing a field's type, changing a status code meaning, removing an endpoint, changing required/optional semantics of a field. Adding new optional fields, new endpoints, and new optional query parameters are non-breaking.
- Use the Tolerant Reader pattern guidance for clients: design response schemas to include unknown fields silently rather than throwing validation errors.

### Step 5: Implement Authentication, Authorization, and Security Headers

Authentication and authorization are not optional hardening -- they are core API infrastructure.

- For service-to-service APIs, use OAuth 2.0 Client Credentials flow with short-lived JWTs (15-minute expiry). For user-facing APIs, use Authorization Code flow with PKCE. Never use API keys alone for user authentication.
- Validate JWTs on every request: verify signature against the JWKS endpoint, check `exp`, `iss`, `aud`, and `nbf` claims. Reject tokens with `alg: none`. Cache the JWKS public keys with a 1-hour TTL but support key rotation via cache invalidation.
- Implement scope-based and/or role-based access control. Return 403 (not 401) when the token is valid but the scope is insufficient. Include the required scope in the error response so clients can request re-authorization.
- Apply rate limiting at two levels: per-IP (prevents abuse) and per-API-key/user (enforces quotas). Typical starting limits: 100 requests/minute per IP for unauthenticated endpoints, 1000 requests/minute per authenticated client. Always return `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `X-RateLimit-Reset` headers on every response.
- Set security headers on all responses:
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains` (HTTPS only)
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Content-Security-Policy: default-src 'none'` (for APIs that return HTML error pages)
  - `Cache-Control: no-store` for authenticated endpoints
- Sanitize all inputs before passing to storage layers. Apply allowlist validation (not denylist) on all string fields. Use parameterized queries unconditionally -- no exceptions for admin endpoints.

### Step 6: Implement Pagination, Filtering, and Sorting

Collection endpoints must support pagination from day one. Retrofitting pagination onto an unpaginated API breaks existing clients.

- **Cursor-based pagination** -- recommended for large, frequently-updated collections. The cursor encodes the position in the result set (typically a base64-encoded composite of the sort field value and the record ID to handle ties). Parameters: `cursor` (opaque string) and `limit` (default 20, max 100). Response includes `nextCursor` and `prevCursor`. Stable under concurrent inserts/deletes.
- **Offset-based pagination** -- simpler to implement and supports jump-to-page navigation. Use `page` (1-indexed) and `pageSize` (default 20, max 100). Response includes `total`, `page`, `pageSize`, `totalPages`. Suffers from drift when records are inserted/deleted during pagination -- acceptable for low-mutation datasets.
- Never paginate using `offset` and `limit` directly on large tables without a cursor; `OFFSET 10000` on a 10-million-row table causes full table scans.
- Filtering: accept filter parameters as query strings (`?status=active&createdAfter=2024-01-01`). For complex filtering, accept a structured filter object via POST body to a dedicated search endpoint (`POST /users/search`). Never build dynamic SQL from filter parameter names.
- Sorting: `?sort=createdAt:desc,name:asc`. Whitelist sortable fields explicitly -- only allow sorting on indexed columns. Reject unsupported sort fields with 400.
- Always include a `Link` header with `rel="next"`, `rel="prev"`, `rel="first"`, `rel="last"` for cursor and offset pagination (RFC 5988). This allows generic HTTP clients to follow pagination without parsing the body.

### Step 7: Implement Caching, Idempotency, and Async Patterns

These three capabilities define the reliability profile of a production API.

**Caching:**
- Set `ETag` headers on GET responses (hash of the response body or the resource's `updatedAt` timestamp). Support `If-None-Match` conditional requests to return 304 Not Modified and save bandwidth.
- Set `Cache-Control` headers explicitly:
  - Public, slow-changing data: `Cache-Control: public, max-age=300, stale-while-revalidate=60`
  - User-specific data: `Cache-Control: private, max-age=0, must-revalidate`
  - Security-sensitive: `Cache-Control: no-store`
- Use `Vary: Accept, Accept-Encoding, Authorization` to prevent cache poisoning when response varies by these headers.

**Idempotency:**
- Accept an `Idempotency-Key` header (UUID, max 255 chars) on POST and PATCH endpoints that trigger side effects (payments, emails, job dispatch).
- Store the key in a fast store (Redis with 24-hour TTL) mapped to the response status code and body. On a duplicate request, return the stored response immediately without re-executing the operation.
- Return `409 Conflict` if the same Idempotency-Key is received while the first request is still being processed (prevents thundering herd on retries).

**Async operations:**
- For operations exceeding 500ms expected duration, return 202 Accepted immediately with a job resource:
  ```json
  { "jobId": "job_01HX4T2Z", "status": "pending", "statusUrl": "/jobs/job_01HX4T2Z" }
  ```
- The `/jobs/{jobId}` endpoint returns `status: pending | processing | complete | failed` with a result or error payload when terminal. Include `retryAfter` (seconds) when status is `pending` or `processing`.

### Step 8: Generate and Maintain OpenAPI Documentation

Documentation is not separate from implementation -- it is part of the API contract.

- Define your API using OpenAPI 3.1 (YAML or JSON). Code-generate server stubs or validation middleware from the spec to keep implementation and documentation synchronized. The spec is the single source of truth.
- Annotate every endpoint with: `summary`, `description`, `operationId` (camelCase, globally unique), `tags` (for grouping), `security` requirements, and `x-rateLimit` extensions.
- Document every response code (not just 200). Document every error schema. Clients need to know what a 422 looks like for each endpoint, not just a generic schema.
- Use `$ref` to define reusable schemas, parameters, and response objects. Do not inline the same schema in 10 places -- changes become impossible to maintain.
- Generate interactive documentation (Swagger UI, Redoc) and publish it at `/docs` or `/api-docs`. Gate it behind authentication in production if the API is internal.
- Implement contract testing: use tools like Dredd or Schemathesis to run automated tests against the OpenAPI spec. This catches implementation drift where the code returns fields not in the spec or accepts inputs the spec says are invalid.

---

## Output Format

When helping a user design or review a REST API, structure your response as follows:

```
## REST API Design Review: [API Name]

### Resource Model

| Resource          | URL Pattern                          | Parent         | ID Type |
|-------------------|--------------------------------------|----------------|---------|
| Users             | /v1/users                            | --             | UUID v4 |
| Orders            | /v1/orders                           | --             | UUID v4 |
| Order Line Items  | /v1/orders/{orderId}/line-items      | Order          | UUID v4 |
| Products          | /v1/products                         | --             | UUID v4 |

### Endpoint Inventory

| Method | Path                              | Auth     | Idempotent | Paginated | Description                        |
|--------|-----------------------------------|----------|------------|-----------|-------------------------------------|
| GET    | /v1/users                         | Required | Yes        | Cursor    | List users                          |
| POST   | /v1/users                         | Required | No*        | --        | Create user (*use Idempotency-Key)  |
| GET    | /v1/users/{userId}                | Required | Yes        | --        | Get user by ID                      |
| PATCH  | /v1/users/{userId}                | Required | No*        | --        | Partial update (*use Idempotency-Key)|
| DELETE | /v1/users/{userId}                | Required | Yes        | --        | Soft delete user                    |

### Status Code Matrix

| Scenario                    | Status | Headers to Include           |
|-----------------------------|--------|------------------------------|
| Resource created            | 201    | Location, ETag               |
| Async job accepted          | 202    | Location (job URL)           |
| Successful delete           | 204    | --                           |
| Validation failure          | 422    | --                           |
| Auth token missing/invalid  | 401    | WWW-Authenticate             |
| Valid token, no permission  | 403    | --                           |
| Rate limit exceeded         | 429    | Retry-After, X-RateLimit-*   |

### Versioning Decision
[Version strategy with rationale based on API's consumer profile]

### Authentication Strategy
[OAuth flow selection with scope definition]

### Pagination Strategy
[Cursor or offset with rationale and parameter names]

### Caching Strategy
[Cache-Control directives per resource type]

### Error Response Contract
[RFC 7807 schema with domain-specific error codes]

### OpenAPI Spec Skeleton
[YAML skeleton with paths, schemas, and security definitions]

### Identified Issues and Recommendations
[Numbered list of specific problems found, each with a concrete fix]
```

---

## Rules

1. **Never use verbs in resource URL paths for CRUD operations.** `POST /createUser` and `GET /getOrderById` are wrong. The HTTP method IS the verb. Exceptions are narrow and must be sub-resource actions (`POST /orders/{id}/cancel`) where no clean resource noun exists.

2. **Never return 200 with an error payload.** Patterns like `{ "success": false, "error": "not found" }` with status 200 break every HTTP client, proxy, monitoring tool, and CDN. Status codes are part of the API contract and must be correct.

3. **Never expose database internals in the API.** This includes: sequential integer IDs (enumeration attacks), database error messages in error responses (information leakage), column names as field names without deliberate review, and database-specific types like PostgreSQL `JSONB` annotations.

4. **Always version from v1 on the first external consumer.** There is no such thing as an unversioned public API -- you have a v1 whether you label it or not. Adding versioning retroactively after clients exist is a breaking change.

5. **Never silently truncate or ignore invalid input.** If a client sends an unknown query parameter, an extra body field, or an out-of-range value, either return a 400 validation error (strict mode) or document explicitly that extra fields are ignored (lenient mode). Choose one mode and apply it consistently.

6. **Always return consistent pagination envelope structure.** Mix of paginated and non-paginated collection responses, or pagination metadata in inconsistent locations (sometimes in body, sometimes in headers), breaks client SDKs. Define one pagination contract and apply it to every collection endpoint.

7. **Never use HTTP headers to carry domain data.** Request routing headers (`X-Forwarded-For`), tracing headers (`X-Request-ID`, `X-Trace-ID`), and caching directives belong in headers. Business data (user preferences, filter criteria, resource fields) belongs in the request body or query string. Clients cannot easily log, debug, or replay requests where data is in custom headers.

8. **Always document the 429 and 503 retry contract explicitly.** Every API will rate-limit and occasionally go down. If the retry behavior is not documented and the `Retry-After` header is not set, clients will implement exponential backoff guesswork, hammering the API when it comes back up and causing cascading failures.

9. **Never treat PATCH as a synonym for PUT.** PATCH with missing fields should update only those fields; PUT with missing fields should null them out (or return 400 if they are required). Mixing these semantics breaks clients that expect either contract.

10. **Always include `Content-Type: application/json` and validate it on input.** Reject requests with `Content-Type: application/x-www-form-urlencoded` or `text/plain` when JSON is expected. Return 415 Unsupported Media Type. This prevents a class of security vulnerabilities including CSRF via form submission and content-type confusion attacks.

11. **Never let collection endpoints return unbounded results.** Even if a collection has only 50 records today, enforce a maximum `pageSize` (100 is typical) and a default (20 is typical) from day one. A query that worked against 50 records will catastrophically fail against 5 million.

12. **Always propagate and log a correlation ID.** Accept `X-Request-ID` or `X-Correlation-ID` from clients. If absent, generate one. Echo it in every response. Include it in every log line, every downstream service call, and every error response body. Without this, debugging production incidents across a microservices architecture is nearly impossible.

---

## Edge Cases

### Legacy Client Compatibility During Version Migration

When deprecating v1 in favor of v2, some clients (especially mobile apps that cannot be force-updated) will continue sending v1 requests for 12-18 months.

- Run v1 and v2 in parallel. Route at the API gateway level using the URL prefix, not at the application level. This allows independent deployment and scaling.
- Maintain a transformation layer (anti-corruption layer) that converts v1 request shapes to v2 internal models and converts v2 responses back to v1 shapes. Keep this transformation layer thin and tested.
- Instrument v1 usage by client version (read from `User-Agent` or a client identifier header). Use this data to prove to stakeholders when it is safe to decommission v1.
- Never add new features to a deprecated version. If a client on v1 needs a new feature, they must migrate to v2.

### Bulk Operations and Batch Endpoints

Individual-resource endpoints at scale create N+1 HTTP request patterns. When clients need to create or update hundreds of records, individual POST calls are impractical.

- Implement `POST /users/batch` (or `POST /batch/users`) that accepts an array of up to 500 records (enforce with validation). Return a mixed-response body where each item includes its own status code (200, 201, 422, etc.) -- this is the JSON-API batch pattern. The HTTP status of the response itself is 207 Multi-Status.
- Implement the batch operation transactionally when all-or-nothing is required (financial postings). Implement it non-transactionally with per-item status codes when partial success is acceptable (bulk imports).
- For very large bulk operations (10,000+ records), reject the request at the synchronous endpoint and require a file upload approach: accept a pre-signed S3 URL upload, then return a job ID for async processing.
- Always set an explicit maximum batch size and return 400 if it is exceeded. Document the limit in the OpenAPI spec.

### Optimistic Concurrency and Conflict Handling

Without concurrency control, two clients updating the same resource simultaneously will silently overwrite each other's changes (the "lost update" problem).

- Implement optimistic locking using ETags. On GET, return `ETag: "v5"` where the value is the resource version (hash, timestamp, or version counter). On PATCH or PUT, require `If-Match: "v5"`. If the current version differs, return 412 Precondition Failed with a descriptive error.
- On 409 Conflict (state machine violations, duplicate creation), include in the error response the current state of the conflicting resource so the client can decide what to do without making an additional GET request.
- For high-contention resources, consider returning 409 with a `retryAfter` hint (in milliseconds) and the conflicting resource ID so clients can implement intelligent retry.
- Never silently accept the last writer in a multi-writer scenario. Either implement optimistic locking or last-write-wins semantics -- but last-write-wins must be explicit and documented, not accidental.

### Content Negotiation and Internationalization

- Support `Accept: application/json` and `Accept: application/problem+json` (RFC 7807) content negotiation. Return 406 Not Acceptable for unsupported Accept values.
- For APIs serving international users, accept `Accept-Language` headers and return localized error messages accordingly. Machine-readable error codes must remain in English regardless of language; only the human-readable `message` field is translated.
- When accepting date/time values, require ISO 8601 format with timezone offset (e.g., `2024-03-15T10:30:00Z` or `2024-03-15T10:30:00+05:30`). Never accept ambiguous date strings like `03/15/2024`. Store and return all timestamps in UTC.
- For currency values, always accept and return amounts as integers in the smallest currency unit (cents, pence, fen) alongside a `currency` field (ISO 4217 code). Never use floating-point for money.

### High-Throughput Write Endpoints

Some write endpoints receive traffic spikes (e-commerce checkout, ticket sales, flash sales) that exceed direct database write capacity.

- Implement write buffering: accept the POST, write to a queue (Redis, Kafka), return 202 Accepted with a job status URL. The response time is now bounded by queue write latency (sub-millisecond) instead of database write latency.
- Use idempotency keys to prevent duplicate queue entries on client retries. The idempotency store must be checked before enqueuing, not after.
- For endpoints that must be synchronous (the client cannot accept 202), implement database connection pooling with PgBouncer or similar, enforce a per-endpoint rate limit below the database's write capacity, and return 503 with a `Retry-After` header when the limit is hit rather than allowing requests to queue up and time out.
- Set appropriate HTTP timeouts. If the synchronous write cannot complete within 10 seconds, return 504 Gateway Timeout rather than holding the connection open. Document the expected p99 latency in the API documentation.

### API Consumers with Inconsistent HTTP Client Implementations

Mobile apps (especially older iOS and Android versions), some server-side HTTP clients, and certain corporate proxies exhibit non-standard HTTP behavior.

- Some older HTTP clients do not follow 307 Temporary Redirect correctly for POST requests (they incorrectly reissue a GET). Avoid redirects on write endpoints entirely.
- Some clients ignore `Content-Type` on responses and try to parse everything as the type they expect. Always set `Content-Type: application/json; charset=utf-8` explicitly, including on error responses.
- Some corporate proxies strip custom headers. If `X-Request-ID` is critical for your debugging workflow, also echo it in the response body (inside the error response's `traceId` field) as a fallback.
- Some HTTP clients (particularly OkHttp on Android pre-2022) do not handle 204 No Content responses with a body gracefully -- they throw a parse error. Never include a body with 204 responses, even a `{}` empty object.

### Database Schema Evolution Without API Breaking Changes

The API contract and the database schema evolve independently. Changes to one must not force changes to the other.

- Use a DTO (Data Transfer Object) or Presenter layer between your domain model and your API response serializer. This allows you to add columns to the database without exposing them in the API, and to rename API fields without renaming database columns.
- When adding a new required database column, use a three-phase migration: (1) add column as nullable, deploy API, (2) backfill existing rows, (3) add NOT NULL constraint. This prevents 500 errors during the migration window.
- When renaming a field in the API (between versions), do not rely on the database column rename -- keep the old column and add a new one, populate both, then remove the old one after the old API version is decommissioned.
- Use an explicit serialization contract (not `SELECT *`) in every query. `SELECT *` causes silent breakage when columns are added or reordered.

---

## Example

**Input:** "I'm building a REST API for an e-commerce platform. We have a Node.js backend (Express), PostgreSQL database, and Redis cache. The API will serve both a web frontend and a mobile app. We expect around 500 requests/second at peak. We have a team of 4 engineers. What does a production-ready implementation look like?"

---

**Output:**

## REST API Design Review: E-Commerce Platform API

### Resource Model

| Resource         | URL Pattern                                   | Parent   | ID Type  | Notes                                      |
|------------------|-----------------------------------------------|----------|----------|--------------------------------------------|
| Users            | /v1/users                                     | --       | UUID v4  | Customers and admins via `role` field       |
| Products         | /v1/products                                  | --       | UUID v4  | Public read, admin write                   |
| Categories       | /v1/categories                                | --       | UUID v4  | Hierarchical via `parentCategoryId`        |
| Carts            | /v1/carts/{cartId}                            | --       | UUID v4  | Anonymous and authenticated carts          |
| Cart Items       | /v1/carts/{cartId}/items                      | Cart     | UUID v4  | Items exist only within a cart             |
| Orders           | /v1/orders                                    | --       | UUID v4  | Created from cart checkout                 |
| Order Items      | /v1/orders/{orderId}/items                    | Order    | UUID v4  | Immutable after order creation             |
| Payments         | /v1/payments                                  | --       | UUID v4  | One-to-one with orders                     |
| Shipments        | /v1/shipments                                 | --       | UUID v4  | Linked to orders via `orderId`             |

Products and Categories are NOT nested under each other even though a product belongs to a category -- they both have independent existence and are linked via a foreign key, not a URL hierarchy.

---

### Endpoint Inventory

| Method | Path                              | Scopes Required       | Idempotent | Paginated | Status Codes          |
|--------|-----------------------------------|-----------------------|------------|-----------|-----------------------|
| GET    | /v1/products                      | public                | Yes        | Cursor    | 200, 400              |
| POST   | /v1/products                      | products:write        | No*        | --        | 201, 400, 401, 403, 422 |
| GET    | /v1/products/{productId}          | public                | Yes        | --        | 200, 404              |
| PATCH  | /v1/products/{productId}          | products:write        | No*        | --        | 200, 400, 401, 403, 404, 409, 412, 422 |
| DELETE | /v1/products/{productId}          | products:write        | Yes        | --        | 204, 401, 403, 404    |
| POST   | /v1/carts                         | public                | Yes*       | --        | 201, 422              |
| POST   | /v1/carts/{cartId}/items          | cart:write            | No*        | --        | 201, 400, 404, 422    |
| DELETE | /v1/carts/{cartId}/items/{itemId} | cart:write            | Yes        | --        | 204, 404              |
| POST   | /v1/orders                        | orders:write          | No*        | --        | 202, 400, 409, 422    |
| GET    | /v1/orders/{orderId}              | orders:read           | Yes        | --        | 200, 401, 403, 404    |
| POST   | /v1/orders/{orderId}/cancel       | orders:write          | Yes*       | --        | 200, 401, 403, 404, 409 |
| POST   | /v1/payments                      | payments:write        | No*        | --        | 202, 400, 422         |
| GET    | /v1/jobs/{jobId}                  | -- (token in URL)     | Yes        | --        | 200, 404              |

\* Use `Idempotency-Key` header.

---

### Status Code Matrix

| Scenario                                   | Status | Required Headers                              |
|--------------------------------------------|--------|-----------------------------------------------|
| Product created                            | 201    | `Location: /v1/products/{id}`, `ETag: "v1"`   |
| Order checkout initiated (async)           | 202    | `Location: /v1/jobs/{jobId}`                  |
| Cart item deleted                          | 204    | --                                            |
| Unknown `productId` in PATCH              | 404    | --                                            |
| Order cancel on already-shipped order     | 409    | Current order state in response body          |
| PATCH with stale ETag                     | 412    | `ETag` of current version                     |
| Validation error on product creation      | 422    | --                                            |
| Invalid JWT                               | 401    | `WWW-Authenticate: Bearer error="invalid_token"` |
| Valid JWT, missing `products:write` scope | 403    | --                                            |
| Rate limit hit                            | 429    | `Retry-After: 30`, `X-RateLimit-Limit: 1000`, `X-RateLimit-Remaining: 0`, `X-RateLimit-Reset: 1715000400` |

---

### Versioning Decision

**Strategy: URL path versioning (`/v1/`).**

Rationale: The API serves a mobile app that cannot be force-updated on day one. URL versioning is visible in server logs and easily routed at the API gateway (Nginx/AWS API Gateway) without needing header inspection. Mobile clients on v1 will coexist with web clients on v2 during a transition window. Register all endpoints under `/v1/` from the start even if there is no v2 planned -- retrofitting the version prefix later is a breaking change.

Deprecation process: When v2 ships, add `Deprecation: true` and `Sunset: 2026-01-01` headers to all v1 responses. Track v1 usage by client version using the `User-Agent` header in Datadog dashboards. Decommission v1 only when v1 traffic drops below 1% of total traffic AND mobile app store analytics show less than 1% of active users on a version that cannot upgrade.

---

### Authentication Strategy

**Web frontend:** OAuth 2.0 Authorization Code flow with PKCE. Access token TTL: 15 minutes. Refresh token TTL: 30 days (sliding). Store access token in memory (not localStorage). Store refresh token in an httpOnly, Secure, SameSite=Strict cookie.

**Mobile app:** OAuth 2.0 Authorization Code flow with PKCE. Access token TTL: 15 minutes. Refresh token TTL: 90 days (sliding). Store both tokens in the platform secure keychain (iOS Keychain, Android Keystore).

**Admin service-to-service:** OAuth 2.0 Client Credentials flow. Access token TTL: 15 minutes. No refresh token -- re-authenticate on expiry.

**JWT validation middleware (Express):**

```javascript
import { createRemoteJWKSet, jwtVerify } from 'jose';

const JWKS = createRemoteJWKSet(
  new URL('https://auth.example.com/.well-known/jwks.json'),
  { cacheMaxAge: 3_600_000 } // 1 hour TTL
);

export async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({
      type: 'https://api.example.com/errors/unauthorized',
      title: 'Authentication Required',
      status: 401,
      detail: 'Bearer token is missing or malformed.',
      traceId: req.traceId,
    });
  }

  try {
    const { payload } = await jwtVerify(authHeader.slice(7), JWKS, {
      issuer: 'https://auth.example.com',
      audience: 'https://api.example.com',
    });
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({
      type: 'https://api.example.com/errors/unauthorized',
      title: 'Invalid Token',
      status: 401,
      detail: 'The provided token is expired, revoked, or has an invalid signature.',
      traceId: req.traceId,
    });
  }
}

export function requireScope(...scopes) {
  return (req, res, next) => {
    const tokenScopes = (req.user.scope || '').split(' ');
    const hasAll = scopes.every(s => tokenScopes.includes(s));
    if (!hasAll) {
      return res.status(403).json({
        type: 'https://api.example.com/errors/forbidden',
        title: 'Insufficient Scope',
        status: 403,
        detail: `This endpoint requires the following scopes: ${scopes.join(', ')}`,
        traceId: req.traceId,
      });
    }
    next();
  };
}
```

---

### Pagination Strategy

**Cursor-based pagination for all collection endpoints.**

Rationale: Products and orders are updated frequently. Offset pagination drifts when records are inserted mid-pagination (a customer gets the same product twice or misses one). At 500 req/s, `OFFSET 5000` on the products table will cause noticeable query latency as the table grows. Cursor pagination uses an index seek instead of a full scan.

**Cursor encoding:**

The cursor encodes the last-seen `createdAt` timestamp and `id` (for tie-breaking). It is base64url-encoded JSON, opaque to the client.

```javascript
// Encode cursor
const cursor = Buffer.from(JSON.stringify({
  createdAt: lastItem.createdAt,
  id: lastItem.id,
})).toString('base64url');

// Decode cursor
const { createdAt, id } = JSON.parse(Buffer.from(cursor, 'base64url').toString());
```

**Query pattern (PostgreSQL):**

```sql
SELECT * FROM products
WHERE
  (created_at, id) < (:cursorCreatedAt, :cursorId)
  AND deleted_at IS NULL
ORDER BY created_at DESC, id DESC
LIMIT :limit + 1;  -- fetch one extra to determine if nextCursor exists
```

**Response envelope:**

```json
{
  "data": [ /* array of product objects */ ],
  "pagination": {
    "nextCursor": "eyJjcmVhdGVkQXQiOiIyMDI0LTAzLTE1VDEwOjMwOjAwWiIsImlkIjoiMDE4ZTQ1YTItN2IzYy03ZThlLWI4MzMtMzE0ZWI3NzllMDJjIn0",
    "prevCursor": null,
    "limit": 20,
    "hasMore": true
  }
}
```

---

### Caching Strategy

| Resource Type         | Cache-Control Directive                                    | ETag Strategy                    |
|-----------------------|------------------------------------------------------------|----------------------------------|
| Product detail (GET)  | `public, max-age=60, stale-while-revalidate=300`           | Hash of product fields           |
| Product list (GET)    | `public, max-age=30, stale-while-revalidate=60`            | Hash of result set               |
| Order detail (GET)    | `private, max-age=0, must-revalidate`                      | Version counter                  |
| Cart detail (GET)     | `private, max-age=0, must-revalidate`                      | Hash of cart contents            |
| Payment detail (GET)  | `private, no-store`                                        | None                             |
| User profile (GET)    | `private, max-age=60, must-revalidate`                     | Hash of user fields              |

Redis cache strategy for product reads: cache product JSON at key `product:{uuid}` with 5-minute TTL. On PATCH/DELETE, invalidate the key synchronously before returning the response. Use Redis pipeline for batch invalidation on bulk updates.

---

### Error Response Contract

All errors follow RFC 7807. Machine-readable error codes follow the pattern `RESOURCE_REASON`:

```json
{
  "type": "https://api.example.com/errors/validation-failed",
  "title": "Request Validation Failed",
  "status": 422,
  "detail": "2 validation errors prevented the product from being created.",
  "instance": "/v1/products",
  "errors": [
    {
      "field": "price",
      "code": "PRODUCT_PRICE_NEGATIVE",
      "message": "Price must be a positive integer in cents (e.g., 1999 for $19.99)."
    },
    {
      "field": "sku",
      "code": "PRODUCT_SKU_DUPLICATE",
      "message": "A product with SKU 'WIDGET-42' already exists."
    }
  ],
  "traceId": "01HX4T2Z3M8K9P1Q"
}
```

Error code registry (maintain this in a shared constants file):

| Code                       | Status | Scenario                                        |
|----------------------------|--------|-------------------------------------------------|
| `PRODUCT_NOT_FOUND`        | 404    | Product ID does not exist or is deleted         |
| `PRODUCT_PRICE_NEGATIVE`   | 422    | Price field is zero or negative                 |
| `PRODUCT_SKU_DUPLICATE`    | 409    | SKU already exists in the catalog               |
| `ORDER_INVALID_STATE`      | 409    | Cancellation attempted on shipped order         |
| `CART_ITEM_OUT_OF_STOCK`   | 422    | Product has insufficient inventory              |
| `PAYMENT_ALREADY_CAPTURED` | 409    | Duplicate payment attempt detected              |
| `RATE_LIMIT_EXCEEDED`      | 429    | Too many requests                               |
| `IDEMPOTENCY_CONFLICT`     | 409    | Duplicate Idempotency-Key with different body   |

---

### OpenAPI Spec Skeleton

```yaml
openapi: "3.1.0"
info:
  title: E-Commerce Platform API
  version: "1.0.0"
  description: >
    Production API for the e-commerce web and mobile clients.
    All timestamps are ISO 8601 UTC. All monetary values are integers in cents.

servers:
  - url: https://api.example.com/v1

security:
  - bearerAuth: []

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

  schemas:
    Product:
      type: object
      required: [id, sku, name, priceInCents, currency, categoryId, createdAt, updatedAt]
      properties:
        id:
          type: string
          format: uuid
        sku:
          type: string
          maxLength: 64
        name:
          type: string
          maxLength: 255
        priceInCents:
          type: integer
          minimum: 1
          description: Price in the smallest currency unit (e.g., 1999 = $19.99)
        currency:
          type: string
          pattern: "^[A-Z]{3}$"
          description: ISO 4217 currency code
        categoryId:
          type: string
          format: uuid
        createdAt:
          type: string
          format: date-time
        updatedAt:
          type: string
          format: date-time

    ProblemDetail:
      type: object
      required: [type, title, status, traceId]
      properties:
        type:
          type: string
          format: uri
        title:
          type: string
        status:
          type: integer
        detail:
          type: string
        instance:
          type: string
        errors:
          type: array
          items:
            type: object
            properties:
              field:
                type: string
              code:
                type: string
              message:
                type: string
        traceId:
          type: string

    CursorPagination:
      type: object
      properties:
        nextCursor:
          type: string
          nullable: true
        prevCursor:
          type: string
          nullable: true
        limit:
          type: integer
        hasMore:
          type: boolean

  parameters:
    ProductId:
      name: productId
      in: path
      required: true
      schema:
        type: string
        format: uuid
    IdempotencyKey:
      name: Idempotency-Key
      in: header
      required: false
      schema:
        type: string
        maxLength: 255

paths:
  /products:
    get:
      operationId: listProducts
      summary: List products
      tags: [Products]
      security: []
      parameters:
        - name: cursor
          in: query
          schema:
            type: string
        - name: limit
          in: query
          schema:
            type: integer
            minimum: 1
            maximum: 100
            default: 20
        - name: categoryId
          in: query
          schema:
            type: string
            format: uuid
        - name: sort
          in: query
          schema:
            type: string
            enum: [createdAt:desc, createdAt:asc, price:desc, price:asc, name:asc]
            default: createdAt:desc
      responses:
        "200":
          description: Paginated product list
          headers:
            ETag:
              schema:
                type: string
            Link:
              schema:
                type: string
              description: RFC 5988 pagination links
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      $ref: "#/components/schemas/Product"
                  pagination:
                    $ref: "#/components/schemas/CursorPagination"
        "400":
          description: Invalid query parameters
          content:
            application/problem+json:
              schema:
                $ref: "#/components/schemas/ProblemDetail"

    post:
      operationId: createProduct
      summary: Create a product
      tags: [Products]
      parameters:
        - $ref: "#/components/parameters/IdempotencyKey"
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [sku, name, priceInCents, currency, categoryId]
              properties:
                sku:
                  type: string
                  maxLength: 64
                name:
                  type: string
                  maxLength: 255
                priceInCents:
                  type: integer
                  minimum: 1
                currency:
                  type: string
                  pattern: "^[A-Z]{3}$"
                categoryId:
                  type: string
                  format: uuid
      responses:
        "201":
          description: Product created
          headers:
            Location:
              schema:
                type: string
            ETag:
              schema:
                type: string
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Product"
        "422":
          description: Validation failed
          content:
            application/problem+json:
              schema:
                $ref: "#/components/schemas/ProblemDetail"
```

---

### Identified Issues and Recommendations

**For a new implementation, apply these patterns from day one:**

1. **
