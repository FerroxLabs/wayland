---
name: api-documenter
description: |
  Expert API documentation covering OpenAPI/Swagger specification, endpoint documentation, request/response examples, authentication docs, error code reference, SDK documentation, interactive API explorers, versioning docs, and changelog.
  Use when the user asks about api documenter, api documenter best practices, or needs guidance on api documenter implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "technical-writing documentation api-design"
  category: "writing"
  subcategory: "technical-writing"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# API Documenter

## Overview

This skill provides comprehensive expertise in creating clear, complete, and developer-friendly API documentation. It covers the full spectrum from OpenAPI specification authoring through interactive documentation portals, covering endpoint descriptions, authentication guides, error references, SDK documentation, and versioning strategies that help developers integrate quickly and confidently.

## OpenAPI/Swagger Specification

### Complete OpenAPI 3.1 Template

```yaml
openapi: 3.1.0
info:
  title: Product Catalog API
  description: |
    The Product Catalog API provides programmatic access to manage products,
    categories, and inventory. It supports full CRUD operations with pagination,
    filtering, and search capabilities.

    ## Getting Started
    1. [Create an API key](#section/Authentication)
    2. Make your first request to `GET /products`
    # ... (condensed) ...
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ErrorResponse'
```

## Endpoint Documentation Structure

### Template for Each Endpoint

```markdown
## Create a Product

Creates a new product in the catalog. The product will be immediately
available in search results and listing endpoints.

### Request

`POST /v2/products`

#### Headers

# ... (condensed) ...
#### 201 Created

The product was created successfully.

```json
{
  "id": "prod_8a7b6c5d",
  "name": "Wireless Headphones",
  "description": "Noise-cancelling Bluetooth headphones",
  "price": 79.99,
  "category_id": "cat_1a2b3c4d",
  "sku": "WH-NC-001",
  "metadata": {},
  "created_at": "2025-01-15T10:30:00Z",
  "updated_at": "2025-01-15T10:30:00Z"
}
```

#### Error Responses

| Status | Code              | Description                          |
|--------|-------------------|--------------------------------------|
| 400    | VALIDATION_ERROR  | Invalid or missing required fields    |
| 401    | UNAUTHORIZED      | Missing or invalid authentication     |
| 409    | DUPLICATE_SKU     | A product with this SKU already exists|
| 429    | RATE_LIMITED      | Too many requests                     |
```

## Authentication Documentation

### Authentication Guide Template

```markdown
# Authentication

The API supports two authentication methods:

## Bearer Token (Recommended for applications)

Obtain a JWT token by authenticating with your credentials:

```shell
HTTP client request -X POST [reference URL] \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "your_client_id",
    "client_secret": "your_client_secret"
  }'
```

Response:
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIs...",
  "token_type": "bearer",
  "expires_in": 3600,
  "refresh_token": "dGhpcyBpcyBhIHJlZnJlc2g..."
}
```

Use the token in subsequent requests:
```shell
HTTP client request [reference URL] \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..."  # Example only -- not a real token
```

### Token Lifecycle
- Access tokens expire after **1 hour**
- Use the refresh token to obtain a new access token
- Refresh tokens expire after **30 days**
- Revoke tokens via `DELETE /auth/token`

## API Key (For server-to-server)

Generate an API key in the [Dashboard]([reference URL]).

```shell
HTTP client request [reference URL] \
  -H "X-API-Key: sk_test_EXAMPLE_KEY_REPLACE_ME"
```

### Security Best Practices
- Never expose API keys in client-side code
- Rotate keys every 90 days
- Use environment variables, not hardcoded values
- Set IP allowlists for production keys
```

## Error Code Reference

### Comprehensive Error Catalog

```markdown
# Error Reference

All errors follow a consistent format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable description",
    "details": [...],
    "request_id": "req_abc123"
  }
}
```

## Client Errors (4xx)

| Code                  | HTTP | Description                                 | Resolution                                      |
|-----------------------|------|---------------------------------------------|-------------------------------------------------|
| VALIDATION_ERROR      | 400  | Request body failed validation              | Check `details` array for specific field errors  |
| INVALID_PARAMETER     | 400  | Query parameter has invalid value           | Verify parameter type and allowed values         |
| UNAUTHORIZED          | 401  | Authentication missing or invalid           | Provide valid token or API key                   |
| TOKEN_EXPIRED         | 401  | JWT token has expired                       | Refresh the token via POST /auth/token/refresh   |
| FORBIDDEN             | 403  | Authenticated but lacks permission          | Contact admin for role/permission update          |
| NOT_FOUND             | 404  | Requested resource does not exist           | Verify the resource ID                           |
# ... (condensed) ...
|-----------------------|------|---------------------------------------------|-------------------------------------------------|
| INTERNAL_ERROR        | 500  | Unexpected server error                     | Retry with exponential backoff; contact support  |
| SERVICE_UNAVAILABLE   | 503  | Temporary maintenance                       | Retry after `Retry-After` header duration         |
| GATEWAY_TIMEOUT       | 504  | Upstream service timeout                    | Retry the request                                 |
```

## SDK Documentation Pattern

### SDK Quick Start Template

```markdown
# Python SDK

## Installation

```shell
install via pip: example-sdk
```

## Quick Start

```python
from example_sdk import Client

client = Client(api_key="sk_test_EXAMPLE_KEY_REPLACE_ME")

# List products
products = client.products.list(limit=10)
for product in products:
    print(f"{product.name}: ${product.price}")

# Create a product
new_product = client.products.create(
    name="Wireless Headphones",
    price=79.99,
    category_id="cat_1a2b3c4d",
)
print(f"Created: {new_product.id}")

# Error handling
from example_sdk.exceptions import ValidationError, NotFoundError

try:
    product = client.products.get("nonexistent_id")
except NotFoundError:
    print("Product not found")
except ValidationError as e:
    print(f"Validation failed: {e.details}")
```

## Configuration

```python
client = Client(
    api_key="sk_test_EXAMPLE_KEY_REPLACE_ME",
    base_url="[reference URL]",  # Supersede for staging
    timeout=30,        # Request timeout in seconds
    max_retries=3,     # Automatic retries on 5xx / network errors
)
```
```

## Interactive API Explorer

### Tool Comparison

| Tool | Best For | Hosting |
|------|----------|---------|
| Swagger UI | OpenAPI rendering, try-it-out | Self-hosted or SwaggerHub |
| Redoc | Beautiful read-only documentation | Self-hosted or Redocly |
| Stoplight | Full documentation platform | Cloud or self-hosted |
| Postman | Interactive collections, team sharing | Cloud + desktop app |
| Readme.io | Developer hub with metrics | Cloud (SaaS) |

### Documentation Site Configuration (Redoc)

```html
<!DOCTYPE html>
<html>
<head>
  <title>Product API Documentation</title>
  <meta charset="utf-8"/>
  <link rel="icon" type="image/png" href="/favicon.png">
  <link href="[reference URL]" rel="stylesheet">
</head>
<body>
  <redoc
    spec-url="/openapi.yaml"
    # ... (condensed) ...
  ></redoc>
  <script src="[reference URL]"></script>
</body>
</html>
```

## Versioning Documentation

### Versioning Strategy Communication

```markdown
# API Versioning

## Version Policy

This API uses **URL path versioning**. The current version is **v2**.

- **Major versions** (v1 → v2): Breaking changes, 12-month migration window
- **Minor updates**: Additive changes within a version, no migration needed
- **Deprecation notice**: Minimum 6 months before sunsetting a version

## What Counts as a Breaking Change
# ... (condensed) ...
| v1 Endpoint | v2 Endpoint | Changes |
|-------------|-------------|---------|
| GET /v1/products | GET /v2/products | Pagination now uses cursor-based, response wrapper added |
| POST /v1/products | POST /v2/products | `category` (string) → `category_id` (uuid) |
```

## API Changelog

### Changelog Format

```markdown
# API Changelog

## 2025-01-15 - v2.1.0

### Added
- `GET /v2/products/search` - Full-text search endpoint with relevance scoring
- `metadata` field on Product object (arbitrary key-value pairs)
- `Idempotency-Key` header support on all POST endpoints

### Changed
- Default pagination limit increased from 10 to 20
# ... (condensed) ...
- `category` field replaced with `category_id` (UUID reference)

### Migration Guide
See [v1 to v2 Migration Guide](/docs/migration/v1-to-v2)
```

## Documentation Quality Checklist

- [ ] Every endpoint has a clear summary and description
- [ ] All parameters document type, required status, and constraints
- [ ] Request and response bodies include realistic examples
- [ ] Authentication is documented with copy-pasteable code
- [ ] Error codes are cataloged with resolution guidance
- [ ] Rate limits are documented by plan tier
- [ ] Pagination behavior is explained (cursor vs. offset)
- [ ] Webhooks are documented with payload examples
- [ ] SDK quick starts are provided for top languages
- [ ] Changelog is maintained with every release
- [ ] Interactive "Try it" functionality is available
- [ ] API spec passes OpenAPI linting (Spectral or similar)
- [ ] Versioning policy is clearly communicated
- [ ] Deprecation timeline is visible for sunset features

## When to Use

**Use this skill when:**
- Designing or implementing api documenter solutions
- Reviewing or improving existing api documenter approaches
- Making architectural or implementation decisions about api documenter
- Learning api documenter patterns and best practices
- Troubleshooting api documenter-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Api Documenter Analysis

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

**Input:** "Help me implement api documenter for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended api documenter approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When api documenter must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
