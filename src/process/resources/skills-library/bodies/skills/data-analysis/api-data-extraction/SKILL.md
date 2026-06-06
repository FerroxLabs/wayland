---
name: api-data-extraction
description: |
  Produces an API data extraction design covering authentication approach, pagination strategy, rate limit handling, response parsing specification, and error handling protocol. Describes the extraction logic without writing executable code.
  Use when the user asks to plan data extraction from an API, design an API integration for analytics, or document how to pull data from a third-party service into a data warehouse.
  Do NOT use for building application-level API clients (that is software engineering), designing the full ETL pipeline (use etl-pipeline-design), or setting up API endpoints (use api-design in software development).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "data-science analysis planning"
  category: "data-analysis"
  subcategory: "data-engineering"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---

# API Data Extraction

## When to Use

**Use this skill when:**
- User asks to plan data extraction from a third-party API (SaaS tool, social media platform, payment processor)
- User needs to design the extraction logic for an API-to-warehouse integration
- User wants to document pagination, rate limiting, and error handling for an API data source
- User asks how to reliably pull data from an API on a recurring schedule
- User needs to evaluate an API's data extraction capabilities before building the pipeline

**Do NOT use when:**
- User wants to build an application-level API client or SDK (that is software engineering)
- User wants to design the full ETL pipeline including transform and load (use `etl-pipeline-design`)
- User wants to design API endpoints for others to consume (use API design skills in software development)
- User wants to set up streaming data ingestion from webhooks (use `streaming-data-architecture`)

## Process

1. **Assess the API.** Gather key information:
   - **API documentation location:** Where is the API reference?
   - **API type:** REST, GraphQL, SOAP, or custom protocol
   - **Base endpoint:** The root URL pattern for data retrieval
   - **Available endpoints:** Which endpoints return the data needed
   - **Rate limits:** Requests per second/minute/hour; burst vs sustained limits
   - **Data format:** JSON, XML, CSV, or other response format
   - **Authentication method:** API key, OAuth 2.0, Basic Auth, JWT, HMAC
   - **Sandbox/test environment:** Is there a test API available for development?

2. **Design the authentication flow.** Based on the auth method:
   - **API Key:** Static key in header or query parameter. Store in secrets manager. Rotation policy.
   - **OAuth 2.0 (Client Credentials):** Token endpoint, client_id/secret, token expiry, refresh logic.
   - **OAuth 2.0 (Authorization Code):** Initial consent flow, access token storage, refresh token handling, token expiry monitoring.
   - **Basic Auth:** Username/password encoded in header. Least secure; note limitations.
   - For all methods: Where are credentials stored? How are they rotated? What happens when auth fails?

3. **Design the data retrieval strategy.** Define how data is fetched:
   - **Full extraction:** Pull all records each run. Simple but slow for large datasets.
   - **Incremental extraction:** Pull only new or updated records since the last run.
     - By timestamp: filter parameter (e.g., updated_since=2026-02-25T00:00:00Z)
     - By ID: retrieve records with ID greater than last known maximum
     - By cursor: use the API's cursor/token from the previous page
   - **Incremental key storage:** Where the last extraction point is stored (state table, file, pipeline metadata)
   - **Backfill strategy:** How to handle initial load or catch-up after a failure

4. **Design the pagination strategy.** Based on the API's pagination method:
   - **Offset-based:** page=1&limit=100, page=2&limit=100. Simple but can skip or duplicate records if data changes during extraction.
   - **Cursor-based:** next_cursor=abc123. More reliable for changing data. Store the cursor for resumption.
   - **Link header:** Follow the "next" URL in the response Link header. Cleanest but requires URL parsing.
   - **Keyset-based:** after_id=12345&limit=100. Most reliable for incremental extraction.
   - For all methods: What is the page size? How do you detect the last page? What is the total request count estimate?

5. **Design rate limit handling.** Based on the API's rate limits:
   - **Proactive throttling:** Space requests to stay under the limit (e.g., 1 request per 200ms for 5 req/sec limit)
   - **Reactive throttling:** Detect 429 (Too Many Requests) responses and back off
   - **Backoff strategy:** Fixed delay, exponential backoff (1s, 2s, 4s, 8s), or use Retry-After header
   - **Rate limit budget:** If multiple pipelines share the same API key, allocate rate budget across them
   - **Time-window awareness:** Some APIs reset limits at specific intervals (per minute, per hour, per day)

6. **Design the response parsing specification.** Define how responses are processed:
   - **Response structure:** Where is the data array in the response? (root level, data key, results key)
   - **Field mapping:** Which response fields map to which target fields
   - **Type conversion:** What types need conversion (string dates to timestamps, string numbers to decimals)
   - **Nested data handling:** How to flatten nested objects or arrays
   - **Null handling:** How missing or null fields are treated

7. **Design error handling.** Define the response to each error type:
   - **4xx client errors:** 400 (bad request), 401 (auth expired), 403 (forbidden), 404 (not found), 429 (rate limit)
   - **5xx server errors:** 500 (internal), 502 (bad gateway), 503 (service unavailable)
   - **Network errors:** Timeout, connection refused, DNS resolution failure
   - **Data errors:** Unexpected response format, missing required fields, schema change
   - For each: retry policy, maximum retries, logging, alerting

## Output Format

```
## API Data Extraction Design: [API Name]

### API Assessment

| Attribute | Value |
|-----------|-------|
| API type | [REST / GraphQL / SOAP] |
| Base endpoint | [Base URL pattern] |
| Data format | [JSON / XML / CSV] |
| Rate limit | [Requests per time window] |
| Authentication | [Method] |
| Documentation | [Reference location] |

### Authentication Design

- **Method:** [API Key / OAuth 2.0 / Basic Auth]
- **Credential storage:** [Secrets manager / Environment variable reference]
- **Token refresh:** [Strategy for token expiry -- if applicable]
- **Auth failure handling:** [What happens when auth fails]

### Data Retrieval Strategy

- **Extraction type:** [Full / Incremental]
- **Incremental key:** [Field used for incremental detection, if applicable]
- **State storage:** [Where last extraction point is recorded]
- **Backfill process:** [How to handle initial load or catch-up]
- **Endpoints used:**

| Endpoint | Method | Parameters | Returns | Use Case |
|----------|--------|------------|---------|----------|
| [path] | [GET/POST] | [key params] | [What it returns] | [Why this endpoint] |

### Pagination Design

- **Method:** [Offset / Cursor / Link header / Keyset]
- **Page size:** [Records per page]
- **Last page detection:** [How to know extraction is complete]
- **Estimated pages per run:** [Count based on data volume]
- **Resume on failure:** [How to restart from last successful page]

### Rate Limit Handling

- **Published limit:** [Rate limit from API docs]
- **Throttling strategy:** [Proactive / Reactive / Both]
- **Backoff method:** [Fixed / Exponential / Retry-After header]
- **Budget allocation:** [If shared with other pipelines]
- **Estimated extraction time:** [Based on data volume and rate limits]

### Response Parsing

**Response structure:**
```json
{
  "data": [ ... ],
  "pagination": { "next_cursor": "..." },
  "meta": { "total_count": N }
}
```

**Field mapping:**

| API Field | Target Column | Type Conversion | Notes |
|-----------|---------------|-----------------|-------|
| [api_field] | [target_col] | [Conversion] | [Notes] |

**Nested data handling:** [Flattening rules for nested objects/arrays]

### Error Handling

| Error | Detection | Action | Max Retries | Alert |
|-------|-----------|--------|-------------|-------|
| 401 Unauthorized | HTTP status 401 | Refresh token; retry | 1 | Critical if refresh fails |
| 429 Rate Limited | HTTP status 429 | Wait for Retry-After; backoff | 5 | Warning after 3rd retry |
| 500 Server Error | HTTP status 5xx | Exponential backoff | 3 | Critical after all retries |
| Timeout | No response in [N]s | Retry with same params | 3 | Warning |
| Schema change | Missing expected field | Log; continue with available fields | 0 | Warning |

### Extraction Summary

- **Estimated total requests per run:** [Count]
- **Estimated extraction time:** [Duration]
- **Estimated data volume per run:** [Rows and bytes]
- **Recommended schedule:** [Frequency and time]
```

## Rules

1. NEVER include actual API keys, tokens, or credentials in the extraction design -- use placeholder references to a secrets manager
2. ALWAYS specify the pagination strategy -- without it, the extraction will only retrieve the first page of results
3. Rate limit handling must be proactive (throttle before hitting limits), not only reactive (wait after getting a 429) -- proactive throttling is more reliable and does not risk API key suspension
4. The incremental extraction state (last timestamp, last ID, last cursor) must be stored durably outside the pipeline execution -- if the state is only in memory, a crash loses the extraction position
5. NEVER assume API response schemas are stable -- include a schema change detection strategy (log unexpected fields, alert on missing required fields)
6. Error handling must distinguish between retryable errors (429, 5xx, timeout) and non-retryable errors (400, 403, 404) -- retrying a 400 Bad Request wastes rate limit budget
7. Estimated extraction time must account for rate limits AND pagination -- the total time = (total pages x page request time) + (total requests / rate limit) whichever is larger
8. This skill produces the extraction DESIGN, not executable code -- describe the logic, parameters, and flow, not the implementation
9. Backfill strategy must be defined at design time -- every API extraction eventually needs a backfill (initial load, catch-up after downtime, schema migration)
10. ALWAYS include an extraction time estimate based on rate limits and data volume -- this determines whether the extraction fits within the pipeline's time window

## Edge Cases

- **API with no pagination (returns all records at once):** If the dataset is small (under 10,000 records), this is acceptable. If large, request from the API provider whether pagination is available but undocumented. If truly no pagination, design the extraction to handle large responses (streaming JSON parser, memory management).

- **API with inconsistent rate limits (varies by endpoint or plan):** Document rate limits per endpoint. Design the extraction to use the most restrictive limit as the default, with endpoint-specific overrides where documented. Monitor actual 429 responses to calibrate.

- **OAuth token expires during a long extraction:** Design the token refresh to happen proactively before expiry (refresh when 80% of the token lifetime has elapsed). If a 401 occurs mid-extraction, refresh the token and resume from the last successful page (do not restart from the beginning).

- **API returns data in a different timezone than expected:** Explicitly specify the timezone assumption in the extraction design. Convert all timestamps to UTC immediately upon extraction. Document the API's timezone behavior (UTC, server-local, or user-configured).

- **API deprecation or version change:** Include the API version in the extraction design. Monitor the API provider's deprecation notices. Design the extraction to be version-aware: specify the version in the request header or URL, and include a fallback plan for when the version is deprecated (upgrade timeline, breaking change assessment).

## Example

**Input:** "Design data extraction from the HubSpot CRM API to pull contact records into our data warehouse. We have about 50,000 contacts and need daily updates."

**Output:**

## API Data Extraction Design: HubSpot CRM Contacts

### API Assessment

| Attribute | Value |
|-----------|-------|
| API type | REST (HubSpot CRM API v3) |
| Base endpoint | /crm/v3/objects/contacts |
| Data format | JSON |
| Rate limit | 100 requests per 10 seconds (private app), 150,000 requests per day |
| Authentication | Private app access token (Bearer token in Authorization header) |
| Documentation | HubSpot Developer Docs - CRM API |

### Authentication Design

- **Method:** Private app access token (Bearer token)
- **Credential storage:** Stored in [SECRETS_MANAGER/hubspot_access_token]
- **Token refresh:** Private app tokens do not expire but can be rotated. Rotation triggered manually or via secrets manager policy (every 90 days).
- **Auth failure handling:** On 401 response, log the error and alert #data-engineering. Do not retry automatically -- token rotation requires manual action in HubSpot portal.

### Data Retrieval Strategy

- **Extraction type:** Incremental (retrieve contacts modified since last successful run)
- **Incremental key:** hs_lastmodifieddate property (HubSpot's built-in last-modified timestamp)
- **Filter:** Use the HubSpot Search API (/crm/v3/objects/contacts/search) with filter: hs_lastmodifieddate > [last_extraction_timestamp]
- **State storage:** Pipeline state table: pipeline_state.hubspot_contacts.last_modified_at (stored as ISO-8601 UTC)
- **Backfill process:** For initial load or catch-up, set last_modified_at to "1970-01-01T00:00:00Z" to retrieve all contacts. Estimated time for full 50K backfill: ~17 minutes at rate limit.
- **Endpoints used:**

| Endpoint | Method | Parameters | Returns | Use Case |
|----------|--------|------------|---------|----------|
| /crm/v3/objects/contacts/search | POST | filterGroups (hs_lastmodifieddate > timestamp), properties list, limit, after | Matching contacts with requested properties | Incremental extraction |
| /crm/v3/objects/contacts | GET | limit, after, properties | All contacts (paginated) | Full backfill only |

### Pagination Design

- **Method:** Cursor-based (HubSpot returns "paging.next.after" token in response)
- **Page size:** 100 contacts per page (HubSpot maximum)
- **Last page detection:** Response does not include "paging.next" object
- **Estimated pages per run:** ~5 pages for daily incremental (500 modified contacts/day); 500 pages for full backfill
- **Resume on failure:** Store the last successful page's "after" cursor alongside the extraction state. On restart, resume from the stored cursor.

### Rate Limit Handling

- **Published limit:** 100 requests per 10 seconds (10 req/sec effective), 150,000 requests per day
- **Throttling strategy:** Proactive -- space requests at minimum 100ms intervals (10 req/sec target)
- **Backoff method:** If 429 received, use Retry-After header value if present; otherwise exponential backoff starting at 1 second (1s, 2s, 4s, max 30s)
- **Budget allocation:** This pipeline uses ~5 pages/day (0.003% of daily limit). No budget contention expected. If other pipelines are added, revisit.
- **Estimated extraction time:** Daily incremental: ~5 requests x 100ms spacing = ~1 second (plus network latency, ~10 seconds total). Full backfill: ~500 requests at 10 req/sec = ~50 seconds (plus network, ~5 minutes total).

### Response Parsing

**Response structure:**
```json
{
  "total": 487,
  "results": [
    {
      "id": "123",
      "properties": {
        "email": "jane@example.com",
        "firstname": "Jane",
        "lastname": "Doe",
        "company": "Acme Corp",
        "lifecyclestage": "customer",
        "hs_lastmodifieddate": "2026-02-25T14:30:00.000Z"
      },
      "createdAt": "2025-01-15T10:00:00.000Z",
      "updatedAt": "2026-02-25T14:30:00.000Z"
    }
  ],
  "paging": {
    "next": {
      "after": "cursor_token_abc"
    }
  }
}
```

**Field mapping:**

| API Field | Target Column | Type Conversion | Notes |
|-----------|---------------|-----------------|-------|
| id | hubspot_contact_id | String to BIGINT | HubSpot's internal ID |
| properties.email | email | None (VARCHAR) | May be null for some contacts |
| properties.firstname | first_name | None (VARCHAR) | May be null |
| properties.lastname | last_name | None (VARCHAR) | May be null |
| properties.company | company_name | None (VARCHAR) | May be null |
| properties.lifecyclestage | lifecycle_stage | None (VARCHAR) | Enumerated: subscriber, lead, mql, sql, opportunity, customer, evangelist |
| properties.hs_lastmodifieddate | last_modified_at | String to TIMESTAMP (UTC) | Used as incremental key |
| createdAt | created_at | String to TIMESTAMP (UTC) | Contact creation date |

**Nested data handling:** The "properties" object is flattened: each property becomes a top-level column in the target table. Only the 7 properties listed above are extracted (specified in the request's "properties" parameter to minimize response size).

### Error Handling

| Error | Detection | Action | Max Retries | Alert |
|-------|-----------|--------|-------------|-------|
| 401 Unauthorized | HTTP status 401 | Log error; do NOT retry (manual token fix needed) | 0 | CRITICAL: "HubSpot token invalid" to #data-alerts |
| 429 Rate Limited | HTTP status 429 | Wait Retry-After seconds; exponential backoff | 5 | WARNING after 3rd occurrence in single run |
| 500/502/503 Server Error | HTTP status 5xx | Exponential backoff (1s, 2s, 4s, 8s) | 3 | CRITICAL after all retries fail |
| Timeout (no response in 30s) | Response timeout | Retry same request | 3 | WARNING |
| Unexpected response format | Missing "results" key | Log full response; skip page; continue | 0 | WARNING: "Schema change detected" |

### Extraction Summary

- **Estimated total requests per daily run:** 5-10 (incremental, ~500 modified contacts)
- **Estimated extraction time:** 10-30 seconds
- **Estimated data volume per run:** 500 contact records (~250 KB)
- **Recommended schedule:** Daily at 01:00 UTC (before the main ETL pipeline at 02:00 UTC)
