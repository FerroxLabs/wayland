---
name: api-documentation-writer
description: |
  API documentation expertise covering OpenAPI specification authoring, endpoint documentation patterns, code examples in multiple languages, authentication guides, quickstart tutorials, SDK documentation, error reference guides, versioning strategies, interactive documentation portals, and developer experience optimization.
  Use when the user asks about api documentation writer, api documentation writer best practices, or needs guidance on api documentation writer implementation.
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
  difficulty: "beginner"
---

# API Documentation Writer

## Overview

API documentation is the primary interface between your API and its consumers. Great API docs reduce support burden, accelerate integration, and build developer trust. This skill covers writing clear, complete, and developer-friendly API documentation from OpenAPI specifications through quickstart guides, code examples, authentication tutorials, and error references.

## Documentation Architecture

```
API Documentation Site
|
+-- Getting Started
|   +-- Quickstart (5-minute integration)
|   +-- Authentication Guide
|   +-- Rate Limits & Quotas
|   +-- Environments (sandbox, production)
|
+-- API Reference (auto-generated from OpenAPI)
|   +-- Endpoints grouped by resource
|   +-- Request/response schemas
|   +-- Code examples per endpoint
|   +-- Try-it-out console
|
+-- Guides
|   +-- Common Workflows
|   +-- Webhooks Integration
|   +-- Pagination Patterns
|   +-- Error Handling
|   +-- Migration Guides (v1 -> v2)
|
+-- SDKs & Libraries
|   +-- Installation
|   +-- Configuration
|   +-- Usage Examples
|   +-- Changelog
|
+-- Reference
|   +-- Error Codes
|   +-- Status Codes
|   +-- Glossary
|   +-- Changelog / Release Notes
```

## OpenAPI Specification

### Well-Documented OpenAPI Spec

```yaml
openapi: 3.1.0
info:
  title: Orders API
  version: 2.1.0
  description: |
    The Orders API lets you create, get, update, and manage customer orders.

    ## Authentication
    All endpoints require a Bearer token. See [Authentication Guide](/docs/auth).

    ## Rate Limits
    - Standard: 100 requests/minute
    - Bulk endpoints: 10 requests/minute

    ## Versioning
    Include `API-Version: 2024-01-15` header. See [Versioning](/docs/versioning).
  contact:
    name: API Support
    email: api-support@company.com
    url: [reference URL]

servers:
  - url: [reference URL]
    description: Production
  - url: [reference URL]
    description: Sandbox (test data, no real charges)

tags:
  - name: Orders
    description: |
      Create and manage customer orders. Orders progress through states:
      `pending` -> `confirmed` -> `shipped` -> `delivered`.
      Orders can be `cancelled` before shipping.

paths:
  /orders:
    post:
      operationId: createOrder
      summary: Create an order
      description: |
        Creates a new order for the authenticated customer.

        **Important:** The order is created in `pending` status and must be
        confirmed within 30 minutes or it will be automatically cancelled.

        Requires the `orders:write` scope.
      tags: [Orders]
      security:
        - BearerAuth: [orders:write]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateOrderRequest'
            examples:
              simple_order:
                summary: Simple single-item order
                value:
                  items:
                    - product_id: "prod_abc123"
                      quantity: 2
                  shipping_address:
                    line1: "123 Main St"
                    city: "San Francisco"
                    state: "CA"
                    postal_code: "94102"
                    country: "US"
              multi_item:
                summary: Multi-item order with discount
                value:
                  items:
                    - product_id: "prod_abc123"
                      quantity: 2
                    - product_id: "prod_def456"
                      quantity: 1
                  discount_code: "SAVE10"
                  shipping_address:
                    line1: "456 Oak Ave"
                    city: "Austin"
                    state: "TX"
                    postal_code: "73301"
                    country: "US"
                  metadata:
                    source: "mobile_app"
                    campaign: "summer_sale"
      responses:
        '201':
          description: Order created successfully
          headers:
            X-Request-Id:
              description: Unique request identifier for support
              schema:
                type: string
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Order'
              examples:
                created:
                  summary: Newly created order
                  value:
                    id: "ord_xyz789"
                    status: "pending"
                    items:
                      - product_id: "prod_abc123"
                        quantity: 2
                        unit_price: 29.99
                        total: 59.98
                    subtotal: 59.98
                    tax: 5.40
                    total: 65.38
                    created_at: "2024-06-15T10:30:00Z"
                    expires_at: "2024-06-15T11:00:00Z"
        '400':
          $ref: '#/components/responses/BadRequest'
        '401':
          $ref: '#/components/responses/Unauthorized'
        '422':
          description: Validation error
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ValidationError'
              examples:
                invalid_product:
                  summary: Product not found
                  value:
                    error:
                      code: "INVALID_PRODUCT"
                      message: "Product 'prod_invalid' does not exist"
                      field: "items[0].product_id"
                out_of_stock:
                  summary: Product out of stock
                  value:
                    error:
                      code: "OUT_OF_STOCK"
                      message: "Product 'prod_abc123' has only 1 unit available"
                      field: "items[0].quantity"
                      metadata:
                        available_quantity: 1

components:
  schemas:
    Order:
      type: object
      description: Represents a customer order
      properties:
        id:
          type: string
          description: Unique order identifier
          example: "ord_xyz789"
          readOnly: true
        status:
          type: string
          description: |
            Current order status. Transitions:
            - `pending` -> `confirmed` (after payment)
            - `confirmed` -> `shipped` (after fulfillment)
            - `shipped` -> `delivered` (after delivery confirmation)
            - `pending|confirmed` -> `cancelled` (before shipping)
          enum: [pending, confirmed, shipped, delivered, cancelled]
```

## Code Examples

### Multi-Language Code Examples

```
# cURL
HTTP client request -X POST [reference URL] \
  -H "Authorization: Bearer sk_test_EXAMPLE_KEY_REPLACE_ME" \
  -H "Content-Type: application/json" \
  -H "API-Version: 2024-01-15" \
  -d '{
    "items": [
      {"product_id": "prod_abc123", "quantity": 2}
    ],
    "shipping_address": {
      "line1": "123 Main St",
      "city": "San Francisco",
      "state": "CA",
      "postal_code": "94102",
      "country": "US"
    }
  }'
```

```python
# Python
import company_sdk

client = company_sdk.Client(api_key="sk_test_EXAMPLE_KEY_REPLACE_ME")

order = client.orders.create(
    items=[
        {"product_id": "prod_abc123", "quantity": 2}
    ],
    shipping_address={
        "line1": "123 Main St",
        "city": "San Francisco",
        "state": "CA",
        "postal_code": "94102",
        "country": "US",
    }
)

print(f"Order created: {order.id}")
print(f"Total: ${order.total}")
```

```javascript
// Node.js
const Company = require('company-sdk');

const client = new Company('sk_test_EXAMPLE_KEY_REPLACE_ME');

const order = await client.orders.create({
  items: [
    { product_id: 'prod_abc123', quantity: 2 }
  ],
  shipping_address: {
    line1: '123 Main St',
    city: 'San Francisco',
    state: 'CA',
    postal_code: '94102',
    country: 'US',
  }
});

console.log(`Order created: ${order.id}`);
console.log(`Total: $${order.total}`);
```

### Code Example Best Practices

```
DO:
  - Show complete, copy-paste-ready examples
  - Include error handling in examples
  - Use realistic (but fake) data
  - Show the response alongside the request
  - Include the SDK version in installation instructions
  - Highlight the key parameters with inline comments

DON'T:
  - Use real API keys; use clearly-marked test keys (e.g., sk_test_EXAMPLE_KEY_REPLACE_ME)
  - Show only the happy path (include error handling)
  - Assume SDK is already installed (show installation)
  - Use outdated SDK methods
  - Skip import/require statements
```

## Quickstart Guide

### Structure Template

```markdown
# Quickstart: Create Your First Order

Get up and running with the Orders API in 5 minutes.

## Prerequisites
- A Company account ([sign up free]([reference URL]))
- An API key from [Dashboard > API Keys]([reference URL])

## Step 1: Install the SDK

Choose your language:

**Python** (requires Python 3.8+)
> install via pip: company-sdk

**Node.js** (requires Node 18+)
> install via npm: company-sdk

## Step 2: Make your first API call

[Code example: list products]

**Expected response:**
[Show formatted JSON response]

## Step 3: Create an order

[Code example: create order with error handling]

**Expected response:**
[Show the order object with status: "pending"]

## Step 4: Check order status

[Code example: get order by ID]

## Next Steps
- [Authentication Guide](/docs/auth) - Learn about API keys and OAuth
- [Webhooks](/docs/webhooks) - Get real-time order status updates
- [Full API Reference](/docs/api) - Explore all endpoints
- [Error Handling](/docs/errors) - Handle errors gracefully
```

## Error Reference

### Error Documentation Pattern

```yaml
# Structured error documentation
error_categories:
  authentication:
    - code: INVALID_API_KEY
      http_status: 401
      message: "The API key provided is invalid or expired"
      causes:
        - "API key was deleted or rotated"
        - "Using test key against production endpoint"
        - "Key has been compromised and revoked"
      resolution: "Generate a new API key in Dashboard > API Keys"

    - code: INSUFFICIENT_SCOPE
      http_status: 403
      message: "Your token lacks the required scope for this endpoint"
      causes:
        - "OAuth token was not granted the needed scope"
      resolution: "Request additional scopes during OAuth authorization"

  validation:
    - code: INVALID_PARAMETER
      http_status: 400
      message: "A required parameter is missing or invalid"
      fields:
        field: "The parameter that failed validation"
        expected: "What was expected"
        received: "What was received"
      example:
        error:
          code: "INVALID_PARAMETER"
          message: "quantity must be a positive integer"
          field: "items[0].quantity"
          expected: "integer > 0"
          received: "-1"

  rate_limiting:
    - code: RATE_LIMIT_EXCEEDED
      http_status: 429
      message: "Too many requests"
      headers:
        X-RateLimit-Limit: "Maximum requests per window"
        X-RateLimit-Remaining: "Requests remaining in window"
        X-RateLimit-Reset: "Unix timestamp when window resets"
        Retry-After: "Seconds to wait before retrying"
      resolution: |
        Implement exponential backoff. Check Retry-After header
        for the recommended wait time.
      code_example: |
        # Python: Automatic retry with backoff
        import time

        def api_call_with_retry(func, max_retries=3):
            for attempt in range(max_retries):
                response = func()
                if response.status_code != 429:
                    return response
                retry_after = int(response.headers.get('Retry-After', 60))
                time.sleep(retry_after)
            raise RateLimitError("Max retries exceeded")
```

## Writing Quality Checklist

```
Completeness:
  [ ] Every endpoint has description, parameters, and examples
  [ ] All error codes documented with resolution steps
  [ ] Authentication fully explained with code
  [ ] Rate limits and quotas documented
  [ ] Pagination strategy documented
  [ ] Webhook events and payloads documented
  [ ] Changelog tracks breaking and non-breaking changes

Clarity:
  [ ] Quickstart gets developer to "hello world" in < 5 minutes
  [ ] Code examples are copy-paste ready
  [ ] Examples show error handling, not just happy path
  [ ] Jargon is defined in a glossary
  [ ] Warnings and important notes are visually distinct

Developer Experience:
  [ ] Code examples in at least 3 languages
  [ ] Try-it-out console available for each endpoint
  [ ] Search works across all documentation
  [ ] Code examples include expected response
  [ ] Authentication tokens in examples use realistic format

Maintenance:
  [ ] OpenAPI spec is source of truth (docs auto-generated)
  [ ] Code examples tested in CI
  [ ] Docs versioned alongside API versions
  [ ] Feedback mechanism on each page
  [ ] Analytics tracking which pages have high bounce rate
```

## When to Use

**Use this skill when:**
- Designing or implementing api documentation writer solutions
- Reviewing or improving existing api documentation writer approaches
- Making architectural or implementation decisions about api documentation writer
- Learning api documentation writer patterns and best practices
- Troubleshooting api documentation writer-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Api Documentation Writer Analysis

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

**Input:** "Help me implement api documentation writer for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended api documentation writer approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When api documentation writer must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
