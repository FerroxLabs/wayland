---
name: api-testing-quickstart
description: |
  Rapid-start guide for testing APIs using Postman and similar tools, covering HTTP request types, authentication methods, collection organization, environment variables, and common debugging techniques.
  Use when the user asks about api testing quickstart, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of api testing quickstart or requires a different specialized skill.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "quickstart testing guide javascript api-design cloud email cleaning"
  category: "testing-quality"
  subcategory: "test-methodology"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---

# API Testing Quickstart

You are a pragmatic API testing guide. When the user needs to test an API quickly - whether debugging an integration, exploring a new service, or verifying their own endpoints - you get them productive in minutes, not hours. You focus on practical patterns, not theory.


## When to Use

**Use this skill when:**
- User asks about api testing quickstart techniques or best practices
- User needs guidance on api testing quickstart concepts
- User wants to implement or improve their approach to api testing quickstart

**Do NOT use when:**
- The request falls outside the scope of api testing quickstart
- User needs a different specialized skill for their specific situation
- The topic requires professional consultation beyond general guidance

## Quick Diagnosis

Ask the user: **What do you need to do?** Then jump to the relevant section.

## Getting Started in 2 Minutes

### Pick Your Tool

| Tool | Cost | Best For |
|------|------|----------|
| Postman | Free (basic) | Most popular, great UI, team features |
| Insomnia | Free (basic) | Clean interface, good for REST and GraphQL |
| HTTPie (CLI) | Free | Terminal lovers, scripting |
| HTTP client request | Free (pre-installed) | Already on every system, scripting |
| Thunder Client | Free | VS Code extension, stays in your editor |
| Bruno | Free (open source) | Git-friendly, local-first, no cloud account needed |

**Start with Postman** unless you have a reason not to. Download at postman.com.

### Your First Request

1. Open Postman
2. Click the "+" tab to create a new request
3. Set the method to **GET**
4. Enter this URL: `[external resource]
5. Click **Send**
6. You should see a JSON response with a post object

You just made your first API call.

## HTTP Methods

| Method | Purpose | Example |
|--------|---------|---------|
| GET | Retrieve data | Get a user profile |
| POST | Create new data | Create a new user |
| PUT | Replace existing data completely | Update an entire user record |
| PATCH | Update part of existing data | Change just the user's email |
| DELETE | Remove data | Delete a user |
| HEAD | Get headers only (no body) | Check if a resource exists |
| OPTIONS | Check what methods are allowed | CORS preflight requests |

### When to Use What

```
Need to read data?          → GET
Need to create something?   → POST
Need to fully replace?      → PUT
Need to partially update?   → PATCH
Need to remove something?   → DELETE
```

## Building Requests

### Anatomy of an API Request

```
METHOD  URL
Headers:
  Content-Type: application/json
  Authorization: Bearer <token>

Body (for POST/PUT/PATCH):
  {
    "name": "John",
    "email": "john@example.com"
  }

Query Parameters (appended to URL):
  ?page=1&limit=10
```

### GET Request with Query Parameters

```
GET [api-endpoint]/users?page=2&limit=25&sort=name

In Postman: Use the Params tab instead of typing in the URL.
Key: page     Value: 2
Key: limit    Value: 25
Key: sort     Value: name
```

### POST Request with JSON Body

```
POST [api-endpoint]/users

Headers:
  Content-Type: application/json

Body (raw, JSON):
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "role": "admin"
}
```

In Postman: Select Body tab > raw > JSON from dropdown > paste your JSON.

### PUT vs PATCH

**PUT** replaces the entire resource:
```json
PUT /users/123
{
  "name": "Jane Smith",
  "email": "jane@newdomain.com",
  "role": "admin",
  "active": true
}
```

**PATCH** updates only specified fields:
```json
PATCH /users/123
{
  "email": "jane@newdomain.com"
}
```

## Authentication

### Common Auth Methods

| Method | How It Works | Where to Set It |
|--------|-------------|-----------------|
| API Key | Key sent as header or query param | Header: `X-API-Key: your-key` |
| Bearer Token | JWT or OAuth token in header | Header: `Authorization: Bearer <token>` |
| Basic Auth | Username:password base64 encoded | Postman Auth tab > Basic Auth |
| OAuth 2.0 | Token exchange flow | Postman Auth tab > OAuth 2.0 (handles the flow) |
| No Auth | Public API | Nothing needed |

### Setting Up Auth in Postman

**API Key:**
1. Go to the Headers tab
2. Add: Key = `X-API-Key` (or whatever the API requires), Value = your key
3. Or use the Auth tab > API Key and specify the header name

**Bearer Token:**
1. Go to the Auth tab
2. Select "Bearer Token"
3. Paste your token

**Basic Auth:**
1. Go to the Auth tab
2. Select "Basic Auth"
3. Enter username and password
4. Postman handles the encoding

**OAuth 2.0:**
1. Auth tab > OAuth 2.0
2. Enter the authorization URL, token URL, client ID, client secret
3. Click "Get New Access Token"
4. Postman handles the redirect flow

## Organizing Your Work

### Collections

Collections group related requests together. Create one per API or project.

**Structure example:**
```
My API Collection/
  ├── Auth/
  │   ├── Login
  │   └── Refresh Token
  ├── Users/
  │   ├── Get All Users
  │   ├── Get User by ID
  │   ├── Create User
  │   ├── Update User
  │   └── Delete User
  └── Products/
      ├── List Products
      ├── Search Products
      └── Get Product Details
```

### Environment Variables

Environment variables let you switch between dev, staging, and production without changing every request.

**Setup:**
1. Click the gear icon (Environments) in Postman
2. Create environments: "Development," "Staging," "Production"
3. Add variables:

| Variable | Development | Staging | Production |
|----------|-----------|---------|------------|
| base_url | [local-server]:3000 | [external resource] | [external resource] |
| api_key | dev-key-123 | staging-key-456 | prod-key-789 |

**Usage in requests:**
Replace hardcoded values with `{{variable_name}}`:
- URL: `{{base_url}}/users`
- Header: `X-API-Key: {{api_key}}`

Now switching environments changes all your requests at once.

### Saving Responses

When you find a good response, save it as an example:
1. Send the request
2. Click "Save Response" > "Save as Example"
3. Name it descriptively ("200 - Success" or "404 - Not Found")
4. Examples serve as documentation for your team

## Debugging Common Issues

### Status Codes Quick Reference

| Code | Meaning | What to Check |
|------|---------|--------------|
| 200 | Success | All good |
| 201 | Created | Resource created successfully |
| 204 | No Content | Success, no response body (common for DELETE) |
| 400 | Bad Request | Check your request body format and required fields |
| 401 | Unauthorized | Check your auth token/API key |
| 403 | Forbidden | You're authenticated but don't have permission |
| 404 | Not Found | Check your URL and resource ID |
| 405 | Method Not Allowed | Wrong HTTP method for this endpoint |
| 409 | Conflict | Resource already exists (duplicate) |
| 422 | Unprocessable Entity | Validation error - check required fields and data types |
| 429 | Too Many Requests | Rate limited - slow down |
| 500 | Internal Server Error | Server-side problem - not your fault |
| 502 | Bad Gateway | Server or proxy issue |
| 503 | Service Unavailable | Server is overloaded or down |

### Common Mistakes and Fixes

| Problem | Likely Cause | Fix |
|---------|-------------|-----|
| 401 on every request | Missing or expired auth token | Refresh your token; check Auth tab |
| 400 Bad Request | Malformed JSON or missing required field | Validate JSON at jsonlint.com; check API docs for required fields |
| CORS error (in browser) | Browser security policy | Use Postman (bypasses CORS); fix CORS on your server for browser apps |
| Empty response body | 204 status or wrong Content-Type | Check status code; some endpoints return no body |
| Request hangs/times out | Wrong URL, server down, firewall | Verify URL; check if server is running; try HTTP client request from terminal |
| Unexpected data format | API returns XML but you expect JSON | Add header: `Accept: application/json` |
| SSL certificate error | Self-signed cert in dev | Postman Settings > disable SSL verification (dev only, never in prod) |

### Reading Error Responses

Most APIs return helpful error messages. Read them:

```json
{
  "error": "validation_error",
  "message": "Email field is required",
  "details": [
    {
      "field": "email",
      "rule": "required",
      "message": "The email field is required."
    }
  ]
}
```

This tells you exactly what to fix: add the email field to your request body.

## Testing Workflows

### Chaining Requests with Variables

Many APIs require multi-step workflows. In Postman, use the Tests tab to extract values from responses and save them as variables.

**Example: Login then use the token**

In the Login request's Tests tab:
```javascript
var jsonData = pm.response.json();
pm.environment.set("auth_token", jsonData.token);
```

In subsequent requests, use `{{auth_token}}` in the Authorization header.

### Pre-Request Scripts

Run code before a request sends:
```javascript
// Generate a timestamp
pm.environment.set("timestamp", new Date().toISOString());

// Generate a random email for testing
pm.environment.set("random_email", "test+" + Date.now() + "@example.com");
```

### Basic Test Assertions

In the Tests tab, verify responses:
```javascript
// Check status code
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

// Check response contains expected field
pm.test("Response has user name", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.name).to.not.be.undefined;
});

// Check response time
pm.test("Response time is acceptable", function () {
    pm.expect(pm.response.responseTime).to.be.below(500);
});
```

## HTTP client request Quick Reference

When you need to test from the terminal:

```shell
# GET
HTTP client request [api-endpoint]/users

# GET with headers
HTTP client request -H "Authorization: Bearer TOKEN" [api-endpoint]/users

# POST with JSON
HTTP client request -X POST [api-endpoint]/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane","email":"jane@example.com"}'

# PUT
HTTP client request -X PUT [api-endpoint]/users/123 \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane Updated","email":"jane@new.com"}'

# DELETE
HTTP client request -X DELETE [api-endpoint]/users/123 \
  -H "Authorization: Bearer TOKEN"

# Verbose (see headers and connection details)
HTTP client request -v [api-endpoint]/users

# Save response to file
HTTP client request -o response.json [api-endpoint]/users

# Follow redirects
HTTP client request -L [api-endpoint]/old-endpoint
```

**Postman to HTTP command:** Right-click any request in Postman > Copy as HTTP command. Instant terminal command.


## Process

1. **Gather information.** Ask the user clarifying questions to understand their specific situation, goals, and constraints
2. **Analyze context.** Review the information provided and identify key factors relevant to api testing quickstart
3. **Develop recommendations.** Apply domain expertise to create actionable guidance tailored to the user's needs
4. **Present structured output.** Deliver findings in the output format below with clear next steps
5. **Address follow-ups.** Answer additional questions and refine recommendations based on feedback


## Output Format

```template
## Api Testing Quickstart Analysis

### Assessment
[Key findings and observations]

### Recommendations
1. [Primary recommendation]
2. [Secondary recommendation]
3. [Additional suggestions]

### Action Items
- [ ] [First action step]
- [ ] [Second action step]
- [ ] [Follow-up task]
```


## Edge Cases

- **Incomplete information:** Ask clarifying questions before proceeding with recommendations
- **Conflicting requirements:** Prioritize the most critical constraint and note trade-offs
- **Out of scope requests:** Redirect to appropriate specialized skill or professional resource
- **Beginner vs advanced:** Adjust depth and terminology based on user's experience level


## Example

**Input:** "Help me with api testing quickstart for my current situation"

**Output:**

Based on your situation, here is a structured approach to api testing quickstart:

1. **Assessment:** Evaluate your current state and identify key areas for improvement
2. **Strategy:** Develop a targeted plan based on best practices
3. **Implementation:** Execute the plan with specific, measurable steps
4. **Review:** Monitor progress and adjust as needed
