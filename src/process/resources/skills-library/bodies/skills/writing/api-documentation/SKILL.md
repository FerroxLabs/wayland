---
name: api-documentation
description: |
  Creates API reference documentation with endpoint descriptions, HTTP methods,
  parameters, request/response JSON examples, error codes, and authentication
  details. Use when the user needs to document a REST API, write endpoint
  references, or create developer-facing API docs. Do NOT use for user guides
  (use `user-guide`), tutorials (use `tutorial-writing`), or README files
  (use `readme-writing`).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "technical-writing documentation guide"
  category: "writing"
  subcategory: "technical-writing"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# API Documentation

## When to Use

- User wants to document a REST API or set of endpoints
- User asks for API reference documentation or endpoint descriptions
- User needs to write developer-facing docs with request/response examples
- User wants to create a structured API reference from code or specs
- User needs to document authentication, rate limits, or error codes for an API
- Do NOT use when the user wants a step-by-step tutorial for using the API (use `tutorial-writing` instead)
- Do NOT use when the user wants a general user guide (use `user-guide` instead)
- Do NOT use when the user wants a project README (use `readme-writing` instead)
- Do NOT use when the user wants to design an API (that is API design, not documentation)

## Process

1. **Collect API context.** Ask the user for:
   - API name and base URL pattern (e.g., `/api/v2/`)
   - Authentication method (API key, OAuth 2.0, Bearer token, none)
   - Endpoints to document (method + path for each)
   - Request parameters (path, query, header, body) for each endpoint
   - Response structure (JSON schema or example payloads)
   - Error codes and their meanings
   - Rate limiting rules if applicable
   - Versioning strategy (URL path, header, query param)

2. **Organize by resource, not by HTTP method.** Group endpoints by the resource they act on:
   - All `/users` endpoints together (GET list, GET single, POST create, PUT update, DELETE remove)
   - Within each resource, order by CRUD: Create (POST), Read (GET), Update (PUT/PATCH), Delete (DELETE)
   - Place authentication and common parameters in a standalone section before individual endpoints

3. **Document each endpoint with the full contract.** For every endpoint:
   - HTTP method and path with path parameters highlighted
   - One-line description of what the endpoint does (not what it "can" do)
   - Parameters table: name, location (path/query/header/body), type, required/optional, description
   - Request body example as formatted JSON with realistic data (not `"string"` or `"value"`)
   - Success response with status code and full JSON example
   - Error responses with status codes, error body structure, and when each occurs
   - Authentication requirements specific to this endpoint if they differ from the default

4. **Write error documentation that developers can act on.** For each error:
   - HTTP status code
   - Error code (application-specific if applicable)
   - Description of what triggered the error
   - How to fix it -- the specific correction, not "check your request"
   - Example error response body

5. **Add operational sections.** Beyond endpoint references:
   - Authentication section with complete setup steps and example headers
   - Rate limiting section with limits, headers, and what happens when exceeded
   - Pagination section with cursor or offset pattern and example navigation
   - Versioning section explaining how to target specific API versions
   - Common headers table (Content-Type, Accept, Authorization, custom headers)

6. **Validate completeness.** Before finalizing:
   - Every endpoint has at least one request example and one response example
   - Every parameter has a type and description
   - Every error code has a fix instruction
   - Authentication flow is documented end-to-end
   - No placeholder values remain (replace `{id}` placeholders with realistic example values in examples)

## Output Format

```
# [API Name] API Reference

## Base URL

`[scheme]://[host]/[base-path]`

## Authentication

[Authentication method description]

**Request header:**
```
Authorization: Bearer [token]
```

**Obtaining a token:**
1. [Step to get credentials]
2. [Step to exchange for token]

## Common Headers

| Header | Value | Required | Description |
|--------|-------|----------|-------------|
| Content-Type | application/json | Yes | Request body format |
| Authorization | Bearer {token} | Yes | Authentication token |
| Accept | application/json | No | Response format preference |
| X-Request-ID | UUID | No | Client-generated request tracking ID |

## Rate Limits

| Tier | Requests/minute | Burst |
|------|----------------|-------|
| Free | 60 | 10 |
| Pro | 600 | 100 |

Rate limit headers returned on every response:
- `X-RateLimit-Limit`: Maximum requests per window
- `X-RateLimit-Remaining`: Requests remaining
- `X-RateLimit-Reset`: Unix timestamp when the window resets

---

## [Resource Name]

### [HTTP Method] [Path]

[One-line description of what this endpoint does.]

**Parameters:**

| Name | In | Type | Required | Description |
|------|----|------|----------|-------------|
| [param] | path | string | Yes | [Description] |
| [param] | query | integer | No | [Description with default value] |
| [param] | body | object | Yes | [Description] |

**Request example:**

```json
{
  "[field]": "[realistic value]",
  "[field]": [realistic value]
}
```

**Response: 200 OK**

```json
{
  "id": "[realistic-id]",
  "[field]": "[realistic value]",
  "created_at": "2024-01-15T09:30:00Z"
}
```

**Response: 400 Bad Request**

```json
{
  "error": {
    "code": "[ERROR_CODE]",
    "message": "[Human-readable description]",
    "field": "[field that caused the error]"
  }
}
```

**Response: 404 Not Found**

```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "[Resource] with ID [id] does not exist."
  }
}
```

---

## Error Reference

| Status | Code | Description | Fix |
|--------|------|-------------|-----|
| 400 | VALIDATION_ERROR | Request body failed validation | Check required fields and types |
| 401 | INVALID_TOKEN | Bearer token is expired or malformed | Refresh the token using [endpoint] |
| 403 | INSUFFICIENT_SCOPE | Token lacks required permission | Request [scope] when generating token |
| 404 | NOT_FOUND | Requested resource does not exist | Verify the resource ID |
| 429 | RATE_LIMITED | Request rate exceeded | Wait until X-RateLimit-Reset timestamp |
| 500 | INTERNAL_ERROR | Server-side failure | Retry with exponential backoff |

## Pagination

[Pagination pattern description]

**Request:**
`GET /[resource]?cursor=[cursor_value]&limit=25`

**Response includes:**
```json
{
  "data": [...],
  "pagination": {
    "next_cursor": "[opaque-cursor-string]",
    "has_more": true
  }
}
```

To retrieve the next page, pass `next_cursor` as the `cursor` query parameter.
```

## Rules

1. NEVER use placeholder values like `"string"`, `"value"`, or `123` in JSON examples -- use realistic data that demonstrates the field's actual content
2. NEVER document what an endpoint "can" do -- state what it does ("Creates a user" not "Can be used to create a user")
3. NEVER omit error responses -- every endpoint must document at least 400, 401, and 404 responses where applicable
4. ALWAYS show the full JSON body in examples, not truncated with `...` or comments like "// more fields"
5. ALWAYS include the HTTP status code with every response example
6. ALWAYS list parameters in a table with name, location, type, required flag, and description
7. Group endpoints by resource, not by HTTP method -- developers think in resources
8. Include realistic timestamps, UUIDs, and identifiers in all examples
9. Document rate limits with exact numbers, not vague "limited" or "throttled" language
10. Every error code must include a "Fix" column telling the developer exactly what to change

## Edge Cases

- **Endpoints with file uploads:** Document the multipart/form-data content type, file size limits, accepted MIME types, and show a command-line example since JSON examples do not apply to file uploads.
- **Webhooks:** Document the webhook payload structure, delivery headers (signature, timestamp), retry policy, and expected response from the receiver. Include a signature verification example.
- **Batch endpoints:** Document the maximum batch size, partial failure behavior (does one failure fail the batch or return mixed results?), and the response structure for mixed success/failure.
- **Deprecated endpoints:** Mark with a deprecation notice at the top of the endpoint section, include the removal date, and link to the replacement endpoint with a migration example.
- **Endpoints with polymorphic responses:** Document each response variant with the discriminator field that determines which shape is returned. Show a complete example of each variant.
- **Long-running operations:** Document the polling pattern -- initial request returns a job ID, polling endpoint returns status, and final response includes the result or error.

## Example

**Input:** "Document a user management API with CRUD endpoints. Base URL is /api/v1/. Uses Bearer token auth. Users have id, email, name, role, and created_at fields."

**Output:**

# User Management API Reference

## Base URL

`[scheme]://[host]/api/v1`

## Authentication

All requests require a Bearer token in the Authorization header.

**Request header:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Obtaining a token:**
1. Generate an API key from the Settings > API Keys page
2. Exchange the API key for a Bearer token via `POST /api/v1/auth/token`

## Common Headers

| Header | Value | Required | Description |
|--------|-------|----------|-------------|
| Content-Type | application/json | Yes | Request body format |
| Authorization | Bearer {token} | Yes | Authentication token |
| Accept | application/json | No | Response format preference |

---

## Users

### POST /api/v1/users

Creates a new user account.

**Parameters:**

| Name | In | Type | Required | Description |
|------|----|------|----------|-------------|
| email | body | string | Yes | User email address. Must be unique. |
| name | body | string | Yes | Full name. 1-200 characters. |
| role | body | string | No | User role. One of: `admin`, `editor`, `viewer`. Default: `viewer`. |

**Request example:**

```json
{
  "email": "maria.chen@example.com",
  "name": "Maria Chen",
  "role": "editor"
}
```

**Response: 201 Created**

```json
{
  "id": "usr_8a3b2c1d4e5f",
  "email": "maria.chen@example.com",
  "name": "Maria Chen",
  "role": "editor",
  "created_at": "2024-03-15T14:22:08Z"
}
```

**Response: 400 Bad Request**

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email address is not valid.",
    "field": "email"
  }
}
```

**Response: 409 Conflict**

```json
{
  "error": {
    "code": "DUPLICATE_EMAIL",
    "message": "A user with email maria.chen@example.com already exists.",
    "field": "email"
  }
}
```

### GET /api/v1/users

Returns a paginated list of all users.

**Parameters:**

| Name | In | Type | Required | Description |
|------|----|------|----------|-------------|
| cursor | query | string | No | Pagination cursor from previous response |
| limit | query | integer | No | Results per page. 1-100. Default: 25. |
| role | query | string | No | Filter by role: `admin`, `editor`, `viewer` |

**Request example:**

```
GET /api/v1/users?role=editor&limit=10
```

**Response: 200 OK**

```json
{
  "data": [
    {
      "id": "usr_8a3b2c1d4e5f",
      "email": "maria.chen@example.com",
      "name": "Maria Chen",
      "role": "editor",
      "created_at": "2024-03-15T14:22:08Z"
    }
  ],
  "pagination": {
    "next_cursor": "eyJpZCI6InVzcl84YTNi",
    "has_more": true
  }
}
```

### GET /api/v1/users/{id}

Returns a single user by ID.

**Parameters:**

| Name | In | Type | Required | Description |
|------|----|------|----------|-------------|
| id | path | string | Yes | User ID (format: `usr_` prefix + 12 alphanumeric characters) |

**Response: 200 OK**

```json
{
  "id": "usr_8a3b2c1d4e5f",
  "email": "maria.chen@example.com",
  "name": "Maria Chen",
  "role": "editor",
  "created_at": "2024-03-15T14:22:08Z"
}
```

**Response: 404 Not Found**

```json
{
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "User with ID usr_invalid123 does not exist."
  }
}
```

### PUT /api/v1/users/{id}

Updates an existing user. Sends the full user object -- omitted fields are set to their defaults.

**Parameters:**

| Name | In | Type | Required | Description |
|------|----|------|----------|-------------|
| id | path | string | Yes | User ID |
| email | body | string | Yes | Updated email address |
| name | body | string | Yes | Updated full name |
| role | body | string | No | Updated role. Default: current value. |

**Request example:**

```json
{
  "email": "maria.chen@newdomain.com",
  "name": "Maria Chen-Rodriguez",
  "role": "admin"
}
```

**Response: 200 OK**

```json
{
  "id": "usr_8a3b2c1d4e5f",
  "email": "maria.chen@newdomain.com",
  "name": "Maria Chen-Rodriguez",
  "role": "admin",
  "created_at": "2024-03-15T14:22:08Z"
}
```

### DELETE /api/v1/users/{id}

Permanently deletes a user account. This action cannot be undone.

**Parameters:**

| Name | In | Type | Required | Description |
|------|----|------|----------|-------------|
| id | path | string | Yes | User ID |

**Response: 204 No Content**

No response body.

**Response: 404 Not Found**

```json
{
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "User with ID usr_invalid123 does not exist."
  }
}
```

---

## Error Reference

| Status | Code | Description | Fix |
|--------|------|-------------|-----|
| 400 | VALIDATION_ERROR | Request body failed schema validation | Check the `field` value in the error response and correct the input |
| 401 | INVALID_TOKEN | Bearer token is expired or malformed | Generate a new token via POST /api/v1/auth/token |
| 403 | INSUFFICIENT_SCOPE | Token lacks permission for this operation | Request admin scope when generating the token |
| 404 | USER_NOT_FOUND | No user exists with the given ID | Verify the user ID with GET /api/v1/users |
| 409 | DUPLICATE_EMAIL | Email address is already registered | Use a different email or update the existing user |
| 429 | RATE_LIMITED | Too many requests in the current window | Wait until the X-RateLimit-Reset timestamp |
| 500 | INTERNAL_ERROR | Unexpected server failure | Retry the request with exponential backoff |
