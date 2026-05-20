---
name: rest-api-design
description: |
  Guides expert-level rest api design implementation: api-design and best-practices decision frameworks, production-ready patterns, and concrete templates for rest api design workflows.
  Use when the user asks about rest api design, rest api design configuration, or api-design best practices for rest projects.
  Do NOT use when the user needs a different backend infrastructure capability -- check sibling skills in the backend infrastructure subcategory.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "api-design backend best-practices"
  category: "backend-systems"
  subcategory: "backend-infrastructure"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# REST API Design

## When to Use

**Use this skill when:**
- User is designing a new REST API from scratch and needs guidance on resource modeling, URL structure, HTTP semantics, versioning strategy, or response shape
- User is reviewing an existing API for correctness, consistency, or scalability issues before a major release or integration
- User asks about specific REST design questions: pagination strategies, error response formats, authentication flows, HATEOAS, idempotency, or partial updates
- User needs to design an API that will be consumed by multiple clients (mobile app, web SPA, third-party integrators) with different needs
- User is building a public or partner-facing API where backward compatibility, documentation quality, and developer experience are critical
- User is migrating a legacy RPC-style or SOAP API to REST and needs to map existing operations to resource-oriented patterns
- User needs to choose between REST, GraphQL, gRPC, or WebSockets for a given use case -- this skill covers the REST side of that decision

**Do NOT use this skill when:**
- User needs guidance on GraphQL schema design, resolvers, or subscriptions -- use the GraphQL API design skill
- User is implementing gRPC services with Protobuf definitions -- use the gRPC service design skill
- User needs WebSocket or Server-Sent Events patterns for real-time push communication
- User is asking about API gateway configuration, rate limiting infrastructure, or service mesh routing -- use infrastructure skills in the backend-infrastructure subcategory
- User needs help with OpenAPI/Swagger tooling, code generation, or documentation pipelines specifically -- use the API documentation skill
- User is asking about database schema design, which is a separate concern even though it influences API shape
- User needs authentication system implementation (OAuth2 flows, JWT signing, session management) beyond basic API security conventions -- use the auth-systems skill

---

## Process

### 1. Establish the API's Resource Model

Before writing a single endpoint, map the domain to resources -- the nouns that the API exposes.

- Identify the core entities in the domain (users, orders, products, invoices) and separate them from transactional operations
- Distinguish between primary resources (have an independent lifecycle, can be created/deleted independently) and sub-resources (only exist in the context of a parent -- e.g., `/orders/{orderId}/items`)
- Avoid "operation-as-resource" anti-patterns like `/api/getUser` or `/api/processPayment` -- these are RPC leaking into REST
- Map many-to-many relationships carefully: decide whether the relationship itself is a first-class resource (e.g., `/enrollments` instead of `/users/{id}/courses` when the enrollment has its own attributes like `enrolledAt`, `progress`)
- Limit nesting depth to 2 levels maximum: `/resources/{id}/sub-resources/{id}` is the practical ceiling -- deeper nesting creates brittle URLs and makes refactoring painful
- Document the resource model as a simple entity relationship map before designing any endpoints -- this prevents endpoint proliferation and inconsistency
- Use plural nouns for collection endpoints (`/users`, `/orders`) and singular noun + ID for instance endpoints (`/users/42`) -- this is the universal REST convention

### 2. Define URL Structure and HTTP Method Semantics

URL design and HTTP verb usage are the most visible part of an API's quality. Get these right first.

- Use lowercase kebab-case for URL segments: `/payment-methods`, not `/PaymentMethods` or `/payment_methods`
- Apply HTTP methods according to their defined semantics:
  - `GET` -- safe and idempotent, never has a body, never modifies state
  - `POST` -- creates a resource or triggers a process; not idempotent; returns `201 Created` with a `Location` header pointing to the new resource
  - `PUT` -- full replacement of a resource; must be idempotent; client sends the complete representation
  - `PATCH` -- partial update; use JSON Merge Patch (RFC 7396) for simple updates or JSON Patch (RFC 6902) for complex atomic operations; PATCH is not required to be idempotent but design it to be when possible
  - `DELETE` -- removes a resource; idempotent (deleting an already-deleted resource returns `204` or `404` -- choose one and be consistent)
- Reserve `POST` on a collection for creation; use `POST` on a specific resource URL only for actions that cannot be modeled as state changes (e.g., `/orders/{id}/cancel` as a POST is acceptable when "cancel" triggers side effects beyond a simple status field update)
- Never encode the action in the URL path for standard CRUD: `/users/42/delete` is wrong; `DELETE /users/42` is correct
- Use query parameters for filtering, sorting, searching, and pagination -- never for identity or resource addressing
- Use path parameters for resource identity and hierarchical relationships

### 3. Design Request and Response Schemas

Consistent, predictable schema design is the difference between an API developers love and one they work around.

- Choose a consistent envelope strategy: either always wrap responses in an envelope (`{ "data": {...}, "meta": {...} }`) or never wrap them -- inconsistency is worse than either choice
- The recommended envelope pattern for collections:
  ```json
  {
    "data": [ {...}, {...} ],
    "meta": {
      "total": 1482,
      "page": 3,
      "pageSize": 20,
      "hasNext": true
    }
  }
  ```
- For single-resource responses, a flat object is acceptable when there is no need for metadata; use an envelope when you need to attach metadata without polluting the resource representation
- Use `camelCase` for JSON field names if your primary client is JavaScript; use `snake_case` if your primary clients are Python or Ruby services -- pick one and enforce it with a linter
- Use ISO 8601 strings for all timestamps: `"2024-03-15T14:22:00Z"` -- never Unix timestamps as integers in a REST API (they are not human-readable and create timezone ambiguity)
- Use strings for all IDs that will be exposed externally, even if the underlying database uses integers -- this prevents numeric overflow issues in JavaScript (`Number.MAX_SAFE_INTEGER` is 2^53-1) and allows migration to UUIDs or ULID without breaking clients
- Design responses to include only what the client needs -- avoid over-fetching by default, but provide field selection via a `fields` query parameter for performance-sensitive endpoints
- Always include a `self` link in resource representations if you implement HATEOAS; if you do not implement full HATEOAS, at minimum include the canonical URL of the resource in responses

### 4. Design Error Responses

Error design is as important as success design -- it is what clients spend most of their error-handling code on.

- Adopt the RFC 9457 (Problem Details for HTTP APIs) format as the standard error response shape:
  ```json
  {
    "type": "https://api.example.com/errors/validation-failed",
    "title": "Validation Failed",
    "status": 422,
    "detail": "The 'email' field must be a valid email address.",
    "instance": "/users",
    "errors": [
      {
        "field": "email",
        "code": "INVALID_FORMAT",
        "message": "Must match pattern: ^[^@]+@[^@]+\\.[^@]+$"
      }
    ]
  }
  ```
- Use HTTP status codes precisely and consistently:
  - `400 Bad Request` -- malformed request syntax, invalid JSON, missing required fields
  - `401 Unauthorized` -- no credentials provided or credentials invalid (despite the name, this is authentication failure)
  - `403 Forbidden` -- authenticated but not authorized to perform this operation
  - `404 Not Found` -- resource does not exist; also use for resources the caller cannot see (to avoid enumeration attacks)
  - `409 Conflict` -- state conflict (e.g., optimistic locking failure, duplicate unique key)
  - `410 Gone` -- resource existed but has been permanently deleted (use when you want to signal permanent removal vs. `404`)
  - `422 Unprocessable Entity` -- syntactically valid request but semantically invalid (validation failures, business rule violations)
  - `429 Too Many Requests` -- rate limit exceeded; always include `Retry-After` header
  - `500 Internal Server Error` -- unexpected server error; never expose stack traces or internal details
- Include machine-readable error codes (not just HTTP status) so clients can programmatically distinguish between different types of the same status code
- For `422` validation errors, return ALL field errors in a single response -- do not make clients submit the form multiple times to discover all errors
- Never return `200 OK` with an error in the response body -- this is the RPC-over-HTTP anti-pattern

### 5. Design Pagination, Filtering, and Sorting

Every collection endpoint needs a complete query interface designed upfront.

- Choose a pagination strategy based on use case:
  - **Offset/Limit pagination** (`?page=3&pageSize=20` or `?offset=40&limit=20`): Simple to implement and debug; works well for admin UIs and non-real-time data; breaks on inserts during pagination (items skipped or repeated); do not use for > 10,000 rows without a cursor fallback
  - **Cursor-based pagination** (`?cursor=eyJpZCI6NDJ9&limit=20`): Stable under mutations; required for feeds, timelines, and large datasets; opaque cursor token (base64-encoded JSON) contains the sort key and ID of the last seen item; more complex to implement but the right choice for infinite scroll UIs
  - **Keyset pagination** (a form of cursor pagination): Uses `?afterId=42&limit=20`; only works when sorting by a unique, monotonic key like `id`; very efficient but inflexible for arbitrary sort orders
- Always enforce a maximum page size (recommend 100 items) to prevent denial-of-service via `?pageSize=999999`
- Filtering syntax: use field-specific query parameters for common filters (`?status=active&role=admin`) and a structured query language for complex cases
- Sorting: `?sort=createdAt:desc,lastName:asc` -- colon-separated field:direction pairs, comma-separated for multi-key sort
- Support sparse fieldsets with `?fields=id,name,email` to allow clients to reduce response payload size by 60-90% on large objects
- Always include the total count in paginated responses when offset pagination is used -- it enables page count display and progress indicators

### 6. Choose and Implement a Versioning Strategy

API versioning is unavoidable for any API with external consumers. Choose a strategy before publishing the first endpoint.

- **URL path versioning** (`/v1/users`, `/v2/users`): Highest visibility; easiest to route in gateways; allows completely different implementations per version; recommended for public APIs and APIs with many third-party consumers
- **Header versioning** (`Accept: application/vnd.myapi.v2+json` or `X-API-Version: 2`): Keeps URLs clean; harder to test in a browser or basic tools; recommended for internal APIs with controlled clients
- **Query parameter versioning** (`?version=2`): Easy to test; pollutes query string; caches must vary on this parameter -- avoid for new APIs
- Never use URL versioning below the major version level -- do not create `/v1.1/` endpoints; use `/v2/` only for breaking changes
- Define what constitutes a breaking change: removing fields, renaming fields, changing field types, removing endpoints, changing authentication requirements, making optional parameters required
- Define what is backward-compatible (non-breaking): adding new optional fields to responses, adding new optional request parameters, adding new endpoints, relaxing validation rules
- Maintain at least 2 major versions simultaneously and provide minimum 6 months deprecation notice for public APIs; 12 months for APIs with many consumers
- Use the `Sunset` header (RFC 8594) to communicate deprecation dates in responses: `Sunset: Sat, 31 Dec 2025 23:59:59 GMT`
- Use the `Deprecation` header to signal that an endpoint is deprecated without removing it

### 7. Design for Security and Idempotency

Security and idempotency must be designed in, not bolted on.

- Require HTTPS for all endpoints -- HTTP is not acceptable for any production API
- Use the `Authorization` header for bearer tokens -- never use query parameters for credentials (they appear in server logs and browser history)
- Implement idempotency keys for all non-idempotent operations that have side effects: payment creation, email sending, order placement
  - Client generates a UUID v4 and sends it in `Idempotency-Key: <uuid>` header
  - Server stores the key and the response for 24 hours; on retry, returns the cached response without re-executing
  - Return `422` if the same idempotency key is used with different request body (key collision or client bug)
- Implement optimistic locking for updates on resources subject to concurrent modification: use `ETag` headers on GET responses and require `If-Match: <etag>` on PUT/PATCH requests; return `412 Precondition Failed` when the ETag does not match
- Never expose internal database IDs in URLs when they are sequential integers -- use UUIDs or ULIDs to prevent enumeration attacks
- Apply object-level authorization on every endpoint -- validate that the authenticated user has permission to access the specific resource identified in the URL, not just the endpoint class
- Strip or mask sensitive fields (passwords, full credit card numbers, SSNs) from all API responses -- they should never appear in a REST response body even to authenticated admin users
- Set `Cache-Control: no-store` on responses containing sensitive or user-specific data

### 8. Document, Review, and Finalize the Contract

The API design is not complete until it is documented and reviewed.

- Write the OpenAPI 3.1 specification before or alongside implementation (design-first is preferred over code-first for new APIs) -- this enables parallel frontend and backend development
- Every endpoint must document: all path parameters, all query parameters, request body schema with examples, all possible response codes with schemas and examples, authentication requirements, rate limit behavior
- Conduct a design review checklist before publishing:
  - All HTTP methods match their semantic meaning
  - All status codes are used correctly and consistently
  - All error responses follow the standard error format
  - All collection endpoints have pagination
  - All mutation endpoints have CSRF protection or are token-only
  - Versioning strategy is applied consistently
  - No PII is exposed in URLs (IDs in paths are fine; names or emails in paths are not)
- Provide a sandbox environment with static example data that developers can use without credentials
- Generate and publish client SDKs for at least the primary consumer languages (typically TypeScript/JavaScript and Python) using OpenAPI code generation

---

## Output Format

When helping a user design or review a REST API, produce the following structured output:

```
## REST API Design Review / Specification

### Resource Model
| Resource | URL Pattern | Owned By | Sub-Resources |
|----------|-------------|----------|---------------|
| Users    | /users      | Root     | /users/{id}/sessions |
| Orders   | /orders     | Root     | /orders/{id}/items, /orders/{id}/events |

### Endpoint Inventory
| Method | URL                        | Description                     | Auth Required | Idempotent |
|--------|----------------------------|---------------------------------|---------------|------------|
| GET    | /v1/users                  | List users with pagination      | Yes (admin)   | Yes        |
| POST   | /v1/users                  | Create a new user               | Yes (admin)   | No         |
| GET    | /v1/users/{userId}         | Get a single user               | Yes (self/admin) | Yes     |
| PUT    | /v1/users/{userId}         | Replace full user resource      | Yes (self/admin) | Yes     |
| PATCH  | /v1/users/{userId}         | Partial update user fields      | Yes (self/admin) | Yes (design as idempotent) |
| DELETE | /v1/users/{userId}         | Soft-delete or hard-delete user | Yes (admin)   | Yes        |

### Request/Response Schema
#### Resource: [Name]
**GET /v1/[resources]/{id} Response (200 OK)**
```json
{
  "id": "string (UUID)",
  "field": "type -- description",
  "createdAt": "ISO 8601 timestamp",
  "updatedAt": "ISO 8601 timestamp",
  "_links": {
    "self": { "href": "/v1/resources/uuid" }
  }
}
```

**POST /v1/[resources] Request Body**
```json
{
  "requiredField": "type -- required, constraints",
  "optionalField": "type -- optional, default: null"
}
```

### Error Response Format
```json
{
  "type": "https://api.example.com/errors/[error-type]",
  "title": "Human-readable title",
  "status": 422,
  "detail": "Specific description of what went wrong",
  "instance": "/v1/[resources]",
  "errors": [
    { "field": "fieldName", "code": "ERROR_CODE", "message": "Description" }
  ]
}
```

### Pagination Design
- Strategy: [Offset/Cursor/Keyset] -- rationale: [reason]
- Page size: default [20], max [100]
- Parameters: [?page=&pageSize= OR ?cursor=&limit=]

### Versioning Decision
- Strategy: [URL path / Header / Query param] -- rationale: [reason]
- Current version: v[N]
- Breaking change policy: [description]

### Security Checklist
- [ ] HTTPS enforced
- [ ] Auth scheme documented (Bearer token / API key / OAuth2)
- [ ] Object-level authorization on all endpoints
- [ ] Idempotency keys on: [list of POST endpoints]
- [ ] No sensitive fields in responses
- [ ] Rate limiting: [N] requests per [window] per [client/user/IP]

### Known Trade-offs and Decisions
| Decision | Alternatives Considered | Reason Chosen |
|----------|------------------------|---------------|
| [decision] | [alt1, alt2] | [rationale] |
```

---

## Rules

1. **Never use verbs in URL paths for standard CRUD operations.** `/api/createUser`, `/api/getUserById`, and `/api/deleteOrder` are RPC endpoints masquerading as REST. The HTTP method IS the verb. The only acceptable verb-in-path pattern is for non-CRUD actions that cannot be modeled as state changes on a resource, such as `POST /orders/{id}/cancel` or `POST /accounts/{id}/activate`.

2. **Never return `200 OK` for an error condition.** Returning `{ "success": false, "error": "Not found" }` with a `200` status is the most common REST anti-pattern. HTTP status codes are the API's primary signaling mechanism for clients, proxies, and monitoring tools. Use them correctly. A `404` with an empty body is better than a `200` with an error payload.

3. **Never expose your database schema directly as your API schema.** Column names, join table names, internal status integers, and sequential numeric IDs are implementation details. The API schema is a contract; the database schema is an implementation. They should evolve independently. Mapping layers (DTOs, serializers) are not over-engineering -- they are the correct boundary.

4. **Always paginate collection endpoints that can return more than 20 items.** An unpaginated collection is a denial-of-service vector and a performance time bomb. Enforce a hard maximum page size of 100 records. Design pagination from day one -- retrofitting it onto a live API requires a breaking change.

5. **Never break backward compatibility without a version increment and deprecation period.** Removing a field from a response, renaming a field, changing a field's type, or making a previously optional field required are all breaking changes. Adding new optional fields to responses is backward-compatible. Design response schemas with additive extensibility in mind: do not use `additionalProperties: false` in your OpenAPI spec unless you are certain you want to break clients when you add fields.

6. **Always use the correct HTTP status code for creation: `201 Created` with a `Location` header.** `POST /users` should return `201`, not `200`. The `Location` header should contain the URL of the created resource: `Location: /v1/users/abc-123`. This allows clients to navigate to the new resource without parsing the response body.

7. **Never design a `PATCH` endpoint that requires the full resource.** A `PATCH` that requires all fields is just a `PUT` with the wrong method. `PATCH` must accept partial representations. Use JSON Merge Patch (RFC 7396) for simple field updates -- send only the fields that should change, send `null` to clear a field. Use JSON Patch (RFC 6902) for array operations and complex atomic changes.

8. **Always validate and document idempotency behavior explicitly.** Every endpoint should have a documented answer to: "What happens if this request is sent twice?" `GET`, `PUT`, and `DELETE` must be idempotent by design. `POST` endpoints that create resources or trigger side effects (payments, emails, webhooks) must implement idempotency keys. Document this in the API spec so clients can implement retry logic correctly.

9. **Never put filtering, sorting, or search logic in the URL path.** `/users/active` as a filter is a design mistake -- it creates an endpoint for every possible filter combination. `/users?status=active` is correct. Path segments should only contain resource type names and resource identifiers. Everything else belongs in query parameters.

10. **Always design for the client's read patterns, not the server's data model.** A common mistake is designing endpoints that mirror database tables one-to-one, forcing clients to make 10 requests to render a single screen. Consider providing composite resources or view-specific endpoints (e.g., `/dashboard/summary`) for high-traffic read paths. This is not a violation of REST -- it is pragmatic REST applied to real performance requirements.

---

## Edge Cases

### Legacy RPC-Style API Migration
When converting an existing RPC or SOAP API to REST, you cannot do a full rewrite. The migration must be incremental and backward-compatible. Start by identifying the cleanest 20% of the existing operations that map naturally to CRUD resources -- migrate those first. For operations with complex inputs/outputs (multi-step processes, bulk operations, report generation), design REST equivalents using the "resource-as-process" pattern: `POST /exports` creates an export job and returns `202 Accepted` with a job ID, then `GET /exports/{jobId}` returns the status. Do not try to force async operations into synchronous REST patterns. Maintain the old RPC endpoints during the transition period and use the `Deprecation` and `Sunset` headers to signal migration timelines.

### Bulk Operations
Standard REST does not define a native pattern for bulk creates, updates, or deletes. Three patterns exist, each with trade-offs:
- **Batch endpoint**: `POST /users/batch` with an array of user objects in the body. Return a `207 Multi-Status` response with per-item success/failure. Use this when partial success is acceptable and clients need per-item error details.
- **Async job pattern**: `POST /import-jobs` with a file or array payload. Returns `202 Accepted` with a job ID. Client polls `GET /import-jobs/{jobId}` for status. Use this for large datasets (> 1000 items) or when processing takes > 5 seconds.
- **Batch-as-transaction**: Process all items atomically; return `200` if all succeed or `400`/`422` if any fail. Use only when all-or-nothing semantics are required by the business logic (e.g., financial journal entries). Document the atomicity guarantee explicitly in the API spec.

### File Upload and Download
Files break the standard JSON REST pattern. Use the multipart/form-data approach for uploads under 10MB where the file accompanies metadata. For larger files or files that must be uploaded independently of their metadata:
1. `POST /files/upload-urls` -- client requests a presigned URL from the API
2. API returns a presigned S3/GCS/Azure URL valid for 15 minutes
3. Client uploads directly to object storage using the presigned URL
4. Client notifies the API via `POST /files` or `PATCH /resources/{id}` with the file reference
This two-phase pattern avoids routing large files through your API servers and supports resumable uploads. For downloads, redirect to a time-limited signed URL using `302 Found` rather than streaming the file through your API.

### Hierarchical Data and Recursive Resources
Some domains have recursive structures: folder hierarchies, comment threads, organizational charts, bill-of-materials trees. Do not model these as infinitely nested URLs. Instead, flatten the representation: each node stores a `parentId` reference, and the client constructs the hierarchy client-side. For cases where the entire subtree must be fetched efficiently, provide a `?include=descendants` query parameter on the single-resource GET endpoint. Alternatively, expose a `POST /trees/materialize` endpoint that accepts a root node ID and returns the full subtree as a flat list with parent references -- this is more efficient than recursive HTTP calls.

### API Behind an API Gateway with Rate Limiting
When your REST API sits behind an API gateway (Kong, AWS API Gateway, Apigee), the error response format may be overridden by the gateway for rate limit and auth errors before your code runs. Design your client documentation to account for two distinct error shapes: your application errors (RFC 9457 format) and gateway errors (often a simpler `{ "message": "..." }` format). Document which HTTP status codes can originate from the gateway layer. Configure the gateway to inject your error format where possible, or document the specific gateway error format clients will see. Always include `Retry-After` in `429` responses -- some gateways inject this automatically, but verify this in testing.

### Soft Delete vs. Hard Delete
Many domains require soft deletion (records are deactivated but not removed from the database) for audit trail, referential integrity, or regulatory reasons. REST design implications:
- `DELETE /resources/{id}` should return `204 No Content` regardless of whether it is a soft or hard delete -- the client's semantics are the same
- After a soft delete, `GET /resources/{id}` should return `404 Not Found` to external clients (do not expose the deleted record's data)
- If the client needs to confirm deletion, use `410 Gone` for soft-deleted records to signal permanent unavailability vs. never-existed `404`
- Provide an admin-only `GET /resources?includeDeleted=true` parameter if operational tooling needs access to deleted records
- Never expose a `deleted` boolean field on standard resource responses -- clients should not have to filter this themselves

### Eventual Consistency in Distributed Systems
When your REST API is backed by distributed systems (CQRS with separate read/write stores, multi-region replication, event-sourced systems), writes may not be immediately visible in read responses. Handle this honestly in the API:
- Return `202 Accepted` instead of `201 Created` when the write has been accepted but not yet committed to the read store
- Include a `X-Request-Id` header on all mutation responses and document that subsequent `GET` requests may take up to N seconds to reflect the change
- Provide a `?consistencyToken=<token>` parameter on GET endpoints that allows clients to request "read your own writes" semantics when the backend supports it
- Never return stale data without signaling it -- if you return the pre-mutation state of a resource in a `200` response after a `PUT`, include a `Warning` header or clearly document this behavior

---

## Example

**Input:** "I'm building an e-commerce API for a marketplace platform. We have buyers, sellers, products, and orders. Mobile apps and a web SPA will consume the API. We expect around 500K registered users and 10K orders per day. What does our REST API design look like?"

**Output:**

### REST API Design -- Marketplace Platform

---

### Resource Model

| Resource | URL Pattern | Lifecycle Owner | Sub-Resources | Notes |
|----------|-------------|-----------------|---------------|-------|
| Users | `/v1/users` | Root | `/sessions` | Buyers and sellers are both Users with a `role` field |
| Sellers | `/v1/sellers` | Root | `/sellers/{id}/products` | Seller profile (one-to-one with User) |
| Products | `/v1/products` | Seller | `/products/{id}/images`, `/products/{id}/variants` | Global product catalog |
| Orders | `/v1/orders` | Buyer | `/orders/{id}/items`, `/orders/{id}/events` | Orders are immutable after creation; use events for status |
| Cart | `/v1/cart` | Session/Buyer | `/cart/items` | Singleton resource per buyer; no collection endpoint needed |
| Reviews | `/v1/reviews` | Buyer | none | Addressable at root; linked to both product and buyer |

**Design note:** `Cart` is a singleton resource -- `GET /v1/cart` returns the authenticated buyer's current cart without requiring a cart ID in the URL. This is valid REST -- the identity comes from the authenticated principal.

---

### Endpoint Inventory

| Method | URL | Status Code | Auth | Idempotent | Notes |
|--------|-----|-------------|------|------------|-------|
| GET | `/v1/products` | 200 | None (public) | Yes | Filterable, paginated, searchable |
| POST | `/v1/products` | 201 | Seller JWT | No | Idempotency-Key required |
| GET | `/v1/products/{productId}` | 200 | None (public) | Yes | |
| PATCH | `/v1/products/{productId}` | 200 | Seller JWT (owner) | Yes | JSON Merge Patch |
| DELETE | `/v1/products/{productId}` | 204 | Seller JWT (owner) | Yes | Soft delete; hides from catalog |
| GET | `/v1/orders` | 200 | Buyer/Seller JWT | Yes | Buyer sees own orders; Seller sees orders for their products |
| POST | `/v1/orders` | 202 | Buyer JWT | No | Idempotency-Key required; async fulfillment |
| GET | `/v1/orders/{orderId}` | 200 | Buyer/Seller JWT | Yes | Object-level auth enforced |
| GET | `/v1/orders/{orderId}/events` | 200 | Buyer/Seller JWT | Yes | Immutable event log for order lifecycle |
| PUT | `/v1/cart/items/{productId}` | 200 | Buyer JWT | Yes | Upsert quantity; idempotent by design |
| DELETE | `/v1/cart/items/{productId}` | 204 | Buyer JWT | Yes | |
| POST | `/v1/orders/{orderId}/cancel` | 200 | Buyer JWT | No | Action endpoint -- has side effects beyond status change |

---

### Request/Response Schemas

#### Product Resource

**GET /v1/products/{productId} -- 200 OK**
```json
{
  "id": "01HQ2K4M7N3P8R9S0TVWXYZ123",
  "sellerId": "01HN8J2K4M7N3P8R9S0TVWX456",
  "name": "Handmade Ceramic Coffee Mug",
  "slug": "handmade-ceramic-coffee-mug-blue-12oz",
  "description": "Wheel-thrown stoneware mug, food-safe glaze",
  "priceCents": 2800,
  "currency": "USD",
  "status": "active",
  "inventory": {
    "quantity": 14,
    "trackInventory": true
  },
  "images": [
    { "id": "img_abc123", "url": "/v1/products/01HQ.../images/img_abc123", "isPrimary": true }
  ],
  "createdAt": "2024-03-01T10:00:00Z",
  "updatedAt": "2024-03-15T14:22:00Z",
  "_links": {
    "self": { "href": "/v1/products/01HQ2K4M7N3P8R9S0TVWXYZ123" },
    "seller": { "href": "/v1/sellers/01HN8J2K4M7N3P8R9S0TVWX456" },
    "reviews": { "href": "/v1/reviews?productId=01HQ2K4M7N3P8R9S0TVWXYZ123" }
  }
}
```

**Key decisions:** Price is stored as integer cents (`priceCents: 2800`) to avoid floating-point rounding errors -- never use floats for money. ID uses ULID format (sortable, URL-safe, no collision at 10M/s for 80 years). Status is a string enum, not an integer code.

#### Order Creation

**POST /v1/orders -- Request Body**
```json
{
  "items": [
    { "productId": "01HQ2K4M7N3P8R9S0TVWXYZ123", "quantity": 2 }
  ],
  "shippingAddressId": "addr_789xyz",
  "paymentMethodId": "pm_456abc"
}
```

**Headers required:**
```
Authorization: Bearer <buyer-jwt>
Idempotency-Key: 7f3a9c2e-4b81-4d5f-a2e3-8c6d9f1b0e47
Content-Type: application/json
```

**POST /v1/orders -- 202 Accepted Response**
```json
{
  "orderId": "01HR5M8N2P4R7S9TVWXYZ789",
  "status": "pending",
  "message": "Order received and queued for processing.",
  "_links": {
    "self": { "href": "/v1/orders/01HR5M8N2P4R7S9TVWXYZ789" },
    "events": { "href": "/v1/orders/01HR5M8N2P4R7S9TVWXYZ789/events" }
  }
}
```

**Why `202 Accepted`?** Order creation involves inventory reservation, payment authorization, and fraud checks. These cannot complete synchronously within an acceptable HTTP timeout. The client polls `/v1/orders/{id}/events` or uses a webhook to learn when the order transitions to `confirmed` or `failed`.

---

### Product Collection Endpoint

**GET /v1/products -- Query Parameters**
```
GET /v1/products
  ?category=ceramics
  &sellerId=01HN8J2K4M7N3P8R9S0TVWX456
  &status=active
  &minPriceCents=500
  &maxPriceCents=5000
  &sort=priceCents:asc,updatedAt:desc
  &cursor=eyJpZCI6IjAxSFEyS...", "updatedAt": "2024-03-10T00:00:00Z"}
  &limit=20
  &fields=id,name,priceCents,images
```

**200 OK Response**
```json
{
  "data": [
    {
      "id": "01HQ2K4M7N3P8R9S0TVWXYZ123",
      "name": "Handmade Ceramic Coffee Mug",
      "priceCents": 2800,
      "images": [{ "id": "img_abc123", "url": "...", "isPrimary": true }]
    }
  ],
  "meta": {
    "limit": 20,
    "hasNext": true,
    "nextCursor": "eyJpZCI6IjAxSFE...(base64 of {id, updatedAt} of last item)"
  }
}
```

**Pagination choice -- cursor over offset:** At 500K products, offset pagination with `OFFSET 240000 LIMIT 20` is a full table scan. Cursor pagination using the ULID as a keyset (`WHERE id > $cursor ORDER BY id LIMIT 20`) is an index seek -- O(log n) instead of O(n). Offset pagination is only used on the admin dashboard where dataset size is bounded and "jump to page 50" is a user requirement.

---

### Error Response Examples

**422 Unprocessable Entity -- Validation failure on product creation**
```json
{
  "type": "https://api.marketplace.com/errors/validation-failed",
  "title": "Validation Failed",
  "status": 422,
  "detail": "The request body contains 2 validation errors.",
  "instance": "/v1/products",
  "errors": [
    {
      "field": "priceCents",
      "code": "OUT_OF_RANGE",
      "message": "Price must be between 100 and 99999900 (cents)."
    },
    {
      "field": "name",
      "code": "MAX_LENGTH_EXCEEDED",
      "message": "Product name must be 200 characters or fewer. Received: 247 characters."
    }
  ]
}
```

**409 Conflict -- Idempotency key reuse with different body**
```json
{
  "type": "https://api.marketplace.com/errors/idempotency-key-conflict",
  "title": "Idempotency Key Conflict",
  "status": 409,
  "detail": "Idempotency key '7f3a9c2e-...' was previously used with a different request body. Generate a new idempotency key for this request.",
  "instance": "/v1/orders"
}
```

---

### Versioning Decision

**Strategy: URL path versioning** (`/v1/...`)

**Rationale:** Mobile app consumers cannot be forced to upgrade immediately -- iOS and Android apps in production may be 3-6 months behind the latest release. URL versioning allows the API gateway to route `/v1/` and `/v2/` to entirely separate deployments, enabling zero-downtime version transitions. Header versioning was rejected because it cannot be easily tested by partners using curl or Postman without additional tooling.

**Breaking change policy:**
- A new major version (`/v2/`) is required for: field removal, field rename, field type change, endpoint removal, auth requirement changes
- Additive changes (new optional fields, new endpoints, new optional parameters) are deployed to the current version without a version bump
- Deprecation timeline: 6 months notice minimum for `/v1/` endpoints before `/v2/` is the only version; `Sunset` and `Deprecation` headers added to deprecated endpoints on day of v2 launch

---

### Security Checklist

- [x] HTTPS enforced at load balancer; HTTP returns 301 redirect
- [x] Auth scheme: JWT Bearer tokens with 15-minute expiry; refresh tokens stored in httpOnly cookies for web, secure storage for mobile
- [x] Object-level authorization: all `/orders/{id}` and `/products/{id}` endpoints validate that `sub` claim in JWT matches resource owner
- [x] Idempotency keys required on: `POST /orders`, `POST /products`, `POST /reviews`
- [x] Sensitive fields excluded from all responses: `passwordHash`, `paymentCardNumber` (last 4 exposed as `cardLast4`), `taxId` (existence flagged as boolean `taxIdVerified`)
- [x] Rate limiting: 1000 requests/minute for authenticated buyers; 200 requests/minute for unauthenticated product browsing; 100 requests/minute for seller write operations -- enforced at API gateway with `Retry-After` header on `429`
- [x] Product IDs and User IDs are ULIDs -- not sequential integers; enumeration is not feasible

---

### Key Trade-off Decisions

| Decision | Alternatives Considered | Reason Chosen |
|----------|------------------------|---------------|
| Cursor pagination for products | Offset/limit pagination | Offset degrades past 50K rows; mobile infinite-scroll requires stable pagination under writes |
| `202 Accepted` for order creation | `201 Created` with synchronous response | Payment auth + inventory lock cannot complete in < 5s reliably; async prevents mobile timeout errors |
| ULID for resource IDs | UUID v4, sequential integers | ULIDs are sortable (useful for keyset pagination), URL-safe, non-enumerable, and monotonically increasing within a millisecond |
| Prices in cents (integer) | Decimal strings, float | Eliminates floating-point rounding; avoids currency library inconsistencies across mobile/web/backend |
| Singleton `/v1/cart` endpoint | `/v1/carts/{cartId}` | Buyers do not need to know their cart ID; auth token is the identity; simplifies mobile client state management |
| Flat user model with `role` field | Separate `/buyers` and `/sellers` endpoints | Most users are both buyers and sellers on the platform; separate resources would require dual registration and sync |
