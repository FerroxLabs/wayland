---
name: api-designer
description: |
  REST and GraphQL API design expertise covering REST maturity model, resource naming, pagination patterns, filtering and sorting, HATEOAS, versioning strategies, error response formats, rate limiting headers, and OpenAPI specification.
  Use when the user asks about api designer, api designer best practices, or needs guidance on api designer implementation.
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
  difficulty: "intermediate"
---

# API Designer

## Purpose

Design consistent, intuitive, and evolvable HTTP APIs. This skill covers REST API design from resource modeling through error handling, pagination, versioning, and documentation with OpenAPI. GraphQL design considerations are included for comparison and hybrid architectures.

## REST Maturity Model (Richardson)

```
Level 0: The Swamp of POX
  - Single endpoint, single HTTP method (POST)
  - RPC-style: POST /api { "action": "getUser", "id": 123 }
  - Avoid this.

Level 1: Resources
  - Multiple endpoints, one per resource
  - POST /users, POST /users/123/delete
  - Still misusing HTTP methods.

Level 2: HTTP Verbs (TARGET for most APIs)
  - Resources + correct HTTP methods
  - GET /users, POST /users, PUT /users/123, DELETE /users/123
  - Correct status codes (200, 201, 204, 400, 404, etc.)

Level 3: HATEOAS (Hypermedia)
  - Level 2 + hypermedia controls in responses
  - Clients discover actions from response links
  - Full REST (rarely implemented in practice)
```

## Resource Naming Conventions

### Rules

```
1. Use NOUNS, not verbs
   GOOD: GET /users
   BAD:  GET /getUsers

2. Use PLURAL nouns
   GOOD: /users, /orders, /products
   BAD:  /user, /order, /product

3. Use kebab-case for multi-word resources
   GOOD: /order-items, /user-profiles
   BAD:  /orderItems, /user_profiles

4. Nest resources to show relationships (max 2 levels)
   GOOD: /users/123/orders
   BAD:  /users/123/orders/456/items/789/reviews  (too deep)

5. Use query parameters for filtering, not path segments
   GOOD: GET /orders?status=pending&userId=123
   BAD:  GET /orders/pending/user/123

6. Actions on resources (when necessary)
   POST /orders/123/cancel    (state transition)
   POST /users/123/verify     (trigger action)
```

### Standard HTTP Methods

```
GET     /resources          -> List resources (200)
GET     /resources/:id      -> Get single resource (200 or 404)
POST    /resources          -> Create resource (201 with Location header)
PUT     /resources/:id      -> Full replace (200 or 204)
PATCH   /resources/:id      -> Partial update (200 or 204)
DELETE  /resources/:id      -> Delete resource (204 or 200)

HEAD    /resources/:id      -> Same as GET but no body (check existence)
OPTIONS /resources          -> Available methods (CORS preflight)
```

### Standard Status Codes

```
2xx SUCCESS:
  200 OK                    -> GET, PUT, PATCH with response body
  201 Created               -> POST (include Location header)
  204 No Content            -> DELETE, PUT/PATCH with no response body

3xx REDIRECTION:
  301 Moved Permanently     -> Resource permanently at new URL
  304 Not Modified          -> Conditional GET (ETag match)

4xx CLIENT ERROR:
  400 Bad Request           -> Validation error, malformed request
  401 Unauthorized          -> Missing or invalid authentication
  403 Forbidden             -> Authenticated but not authorized
  404 Not Found             -> Resource does not exist
  405 Method Not Allowed    -> HTTP method not supported
  409 Conflict              -> Resource state conflict (duplicate, version)
  422 Unprocessable Entity  -> Valid syntax but semantic errors
  429 Too Many Requests     -> Rate limit exceeded

5xx SERVER ERROR:
  500 Internal Server Error -> Unexpected server failure
  502 Bad Gateway           -> Upstream service failure
  503 Service Unavailable   -> Temporary (include Retry-After header)
  504 Gateway Timeout       -> Upstream timeout
```

## Pagination Patterns

### Offset-Based Pagination

```
REQUEST:
  GET /users?page=2&per_page=20

RESPONSE:
  {
    "data": [...],
    "pagination": {
      "page": 2,
      "per_page": 20,
      "total_items": 157,
      "total_pages": 8,
      "has_next": true,
      "has_prev": true
    },
    "links": {
      "first": "/users?page=1&per_page=20",
      "prev":  "/users?page=1&per_page=20",
      "next":  "/users?page=3&per_page=20",
      "last":  "/users?page=8&per_page=20"
    }
  }

PROS:
  - Simple to implement
  - Allows jumping to arbitrary page
  - Total count available

CONS:
  - Inconsistent with inserts/deletes during pagination
  - Poor performance on large offsets (OFFSET N is O(N))
  - Items can be skipped or duplicated between pages
```

### Cursor-Based Pagination (Recommended for Large Datasets)

```
REQUEST:
  GET /users?limit=20&after=eyJ0IjoxNjk...

RESPONSE:
  {
    "data": [...],
    "pagination": {
      "has_next": true,
      "has_prev": true,
      "next_cursor": "eyJ0IjoxNjk...",
      "prev_cursor": "eyJ0IjoxNjg..."
    }
  }

PROS:
  - Consistent pagination (no skips/dupes)
  - Efficient for any position in dataset
  - Works well with real-time data

CONS:
  - Cannot jump to arbitrary page
  - No total count (requires separate query)
  - Cursor is opaque (not user-friendly)

CURSOR IMPLEMENTATION:
  Encode the last item's sort key(s) as base64:
  { "created_at": "2025-01-15T10:30:00Z", "id": "abc123" }
  -> base64 -> "eyJ0IjoxNjk..."

SQL:
  WHERE (created_at, id) < (:cursor_created_at, :cursor_id)
  ORDER BY created_at DESC, id DESC
  LIMIT :limit + 1  -- get one extra to check has_next
```

### Keyset Pagination

```
REQUEST:
  GET /users?limit=20&created_before=2025-01-15T10:30:00Z&id_before=abc123

RESPONSE:
  Same as cursor-based but with explicit keys instead of opaque cursor.

PROS: Transparent and debuggable
CONS: Exposes sort implementation
```

## Filtering and Sorting

### Filtering Patterns

```
Simple equality:
  GET /users?status=active&role=admin

Operators (LHS brackets):
  GET /orders?amount[gte]=100&amount[lte]=500
  GET /users?name[contains]=john
  GET /orders?created_at[after]=2025-01-01

Multiple values (comma-separated OR):
  GET /users?role=admin,editor

Search:
  GET /users?q=john+doe

Nested fields (dot notation):
  GET /users?address.city=Austin
```

### Sorting

```
Single sort:
  GET /users?sort=created_at
  GET /users?sort=-created_at     (descending with - prefix)

Multi-sort:
  GET /users?sort=-created_at,name  (primary: created_at desc, secondary: name asc)

Alternative format:
  GET /users?sort_by=created_at&sort_order=desc
```

### Field Selection (Sparse Fieldsets)

```
GET /users?fields=id,name,email        (only return these fields)
GET /users?include=orders,profile       (include related resources)
GET /users?exclude=password_hash        (exclude sensitive fields)
```

## Error Response Format

### Standard Error Envelope

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request body contains invalid data.",
    "details": [
      {
        "field": "email",
        "code": "INVALID_FORMAT",
        "message": "Must be a valid email address."
      },
      {
        "field": "age",
        "code": "OUT_OF_RANGE",
        "message": "Must be between 13 and 120.",
        "meta": { "min": 13, "max": 120 }
      }
    ],
    "request_id": "req_abc123xyz",
    "documentation_url": "[reference URL]"
  }
}
```

### Error Code Taxonomy

```
AUTHENTICATION:
  AUTH_REQUIRED          -> 401: No credentials provided
  AUTH_INVALID           -> 401: Invalid credentials
  AUTH_EXPIRED           -> 401: Token expired

AUTHORIZATION:
  FORBIDDEN              -> 403: Insufficient permissions
  RESOURCE_FORBIDDEN     -> 403: No access to this resource

VALIDATION:
  VALIDATION_ERROR       -> 400/422: Input validation failed
  INVALID_FORMAT         -> 400: Wrong data format
  MISSING_FIELD          -> 400: Required field missing

RESOURCE:
  NOT_FOUND              -> 404: Resource does not exist
  ALREADY_EXISTS         -> 409: Duplicate resource
  CONFLICT               -> 409: State conflict (version mismatch)
  GONE                   -> 410: Resource permanently deleted

RATE_LIMIT:
  RATE_LIMIT_EXCEEDED    -> 429: Too many requests

SERVER:
  INTERNAL_ERROR         -> 500: Unexpected error
  SERVICE_UNAVAILABLE    -> 503: Temporary outage
```

## Versioning Strategies

### Decision Matrix

```
STRATEGY              MECHANISM                   WHEN TO USE
-----------------------------------------------------------------------
URL Path              /v1/users, /v2/users        Simple, explicit, most common
Header                Accept: application/vnd.    More "RESTful", harder to test
                      api.v2+json
Query Param           /users?version=2            Easy migration, but ugly

RECOMMENDATION: URL path versioning (/v1/) for simplicity and clarity.
```

### Versioning Rules

```
1. Only bump major version for BREAKING changes:
   - Removing a field
   - Changing field type
   - Changing resource structure
   - Changing error format

2. NON-BREAKING changes (no version bump):
   - Adding new fields (with defaults)
   - Adding new endpoints
   - Adding new query parameters
   - Adding new enum values

3. Support at most 2 versions simultaneously
   v1 (deprecated, sunset date set) and v2 (current)

4. Include deprecation headers:
   Sunset: Sat, 01 Mar 2026 00:00:00 GMT
   Deprecation: true
   Link: <[reference URL]>; rel="successor-version"
```

## Rate Limiting Headers

```
Response headers for rate-limited endpoints:

X-RateLimit-Limit: 100          # Max requests per window
X-RateLimit-Remaining: 67       # Remaining requests in window
X-RateLimit-Reset: 1705312800   # Unix timestamp when window resets
Retry-After: 30                 # Seconds to wait (when 429 returned)

Alternative (IETF draft standard):
RateLimit-Policy: 100;w=3600    # 100 requests per 3600 seconds
RateLimit-Limit: 100
RateLimit-Remaining: 67
RateLimit-Reset: 42             # Seconds until reset (not timestamp)
```

## HATEOAS

```json
{
  "id": "ord_123",
  "status": "pending",
  "total": 99.99,
  "links": {
    "self":    { "href": "/orders/ord_123", "method": "GET" },
    "cancel":  { "href": "/orders/ord_123/cancel", "method": "POST" },
    "pay":     { "href": "/orders/ord_123/pay", "method": "POST" },
    "items":   { "href": "/orders/ord_123/items", "method": "GET" }
  }
}

// After payment, links change:
{
  "id": "ord_123",
  "status": "paid",
  "links": {
    "self":    { "href": "/orders/ord_123", "method": "GET" },
    "refund":  { "href": "/orders/ord_123/refund", "method": "POST" },
    "receipt": { "href": "/orders/ord_123/receipt", "method": "GET" }
    // "cancel" and "pay" no longer available
  }
}
```

## OpenAPI Specification

```yaml
openapi: 3.1.0
info:
  title: Users API
  version: 1.0.0
  description: User management API
  contact:
    email: api@example.com

servers:
  - url: [reference URL]
    description: Production
  - url: [reference URL]
    description: Staging

paths:
  /users:
    get:
      operationId: listUsers
      summary: List all users
      tags: [Users]
      parameters:
        - name: page
          # ... (condensed) ...
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

security:
  - BearerAuth: []
```

## API Design Checklist

- [ ] Resources are nouns (plural), not verbs
- [ ] HTTP methods used correctly (GET reads, POST creates, etc.)
- [ ] Status codes are semantic and consistent
- [ ] Pagination implemented (cursor-based for large datasets)
- [ ] Filtering uses query parameters with consistent operators
- [ ] Sorting supports multiple fields with direction prefix
- [ ] Error responses follow standard envelope format
- [ ] Rate limiting headers included on all responses
- [ ] API versioned via URL path (/v1/)
- [ ] OpenAPI specification maintained and accurate
- [ ] Authentication returns 401, authorization returns 403
- [ ] Created resources return 201 with Location header
- [ ] Idempotency keys supported for POST operations
- [ ] Request IDs included in error responses for debugging
- [ ] Deprecation communicated via Sunset header

## When to Use

**Use this skill when:**
- Designing or implementing api designer solutions
- Reviewing or improving existing api designer approaches
- Making architectural or implementation decisions about api designer
- Learning api designer patterns and best practices
- Troubleshooting api designer-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Api Designer Analysis

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

**Input:** "Help me implement api designer for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended api designer approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When api designer must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
