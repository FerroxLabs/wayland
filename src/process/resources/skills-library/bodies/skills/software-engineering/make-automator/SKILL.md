---
name: make-automator
description: |
  Expert Make (formerly Integromat) automation covering scenario design, module configuration, routers for conditional branching, iterators and aggregators for array processing, error handling with break and resume, data store operations, webhook setup, custom API connections, scheduling strategies, and performance optimization for high-volume automation.
  Use when the user asks about make automator, make automator best practices, or needs guidance on make automator implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "automation shell-scripting guide"
  category: "software-engineering"
  subcategory: "developer-tools"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Make Automator

You are an expert in Make (formerly Integromat) automation. You guide teams through building production-grade scenarios with advanced routing, iteration, error handling, and data transformation, leveraging Make's visual execution model and powerful data manipulation capabilities.

## Core Concepts

### Make Architecture

```
Make Components:
├── Scenarios: Visual workflow of connected modules, execute on schedule/webhook/manual
├── Modules
│   ├── Triggers: Start scenario execution (instant or polling)
│   ├── Actions: Perform operations (CRUD, send, transform)
│   ├── Searches: Look up records (return array of bundles)
│   ├── Aggregators: Combine multiple bundles into one
│   ├── Iterators: Split one bundle into multiple
│   └── Transformers: Convert data format (JSON, CSV, XML)
├── Bundles: Unit of data flowing through a scenario (key-value pairs)
└── Connections: Reusable auth credentials (OAuth2, API key, basic auth)
```

### Execution Model

```
How Make Processes Data:
├── Trigger fires → produces N bundles
├── Each bundle flows through modules sequentially
├── Routers split flow into parallel branches
├── Iterators split arrays within a bundle
├── Aggregators collect bundles back into one
└── Cycle completes when all bundles processed

Operation Counting:
  - Each module processing one bundle = 1 operation
  - Trigger producing 5 bundles through 3 modules = 15 operations
  - Filtering is free (does not count as an operation)
  - Aggregators: 1 operation regardless of input count
```

## Routers (Conditional Branching)

```
Router Behavior:
├── Splits execution into parallel branches
├── Each branch has a filter condition
├── Multiple branches can match (unlike if/else)
├── Unfiltered branch = always matches (default route)
│
├── Filter Operators
│   ├── Text: equal to, contains, starts with, matches (regex)
│   ├── Numeric: greater than, less than, in range
│   ├── Boolean: is true, is false
│   ├── Array: contains, length
│   ├── Existence: exists, does not exist
│   └── Compound: AND (all conditions), OR (any condition)
│
└── Fallback Route
    ├── Enable "fallback route" on the last branch
    ├── Only executes if no other branch matched
    └── Equivalent to "else" in programming
```

### Router Example: Lead Scoring

```
Trigger: New HubSpot Contact

Router:
├── Branch 1: Enterprise Lead
│   Filter: company_size > 500 AND job_title contains "VP|Director|C-"
│   → Create Salesforce Lead (Enterprise queue)
│   → Send Slack alert to #enterprise-sales
│
├── Branch 2: Mid-Market Lead
│   Filter: company_size >= 50 AND company_size <= 500
│   → Create Salesforce Lead (Mid-market queue)
│   → Add to standard email sequence
│
├── Branch 3: SMB
│   Filter: company_size < 50 OR company_size does not exist
│   → Add to self-serve onboarding flow
│
└── Branch 4: Fallback
    → Log to Google Sheet for manual review
```

## Iterators and Aggregators

### Iterator Pattern

```
Iterator: Split Array into Individual Bundles
├── Input: One bundle with an array field
│   { "order_id": "123", "items": [
│       { "product": "Widget A", "qty": 2, "price": 10 },
│       { "product": "Widget B", "qty": 1, "price": 25 }
│   ]}
│
├── Iterator on "items" produces 2 bundles, each processed independently
│   → Look up product in inventory → Update stock → Check reorder threshold
│
└── Access parent data: {{order_id}} remains accessible in iterator scope
```

### Aggregator Pattern

```
Aggregator Types:
├── Array Aggregator: Collect field values into an array
├── Text Aggregator: Join text values with separator
├── Numeric Aggregator: Sum, average, min, max, count
└── Table Aggregator: Build HTML/CSV table from bundles

Common Pattern: Process items, then summarize
  Trigger (order with line items)
    → Iterator (split items array)
      → Action per item (enrich, validate)
      → Aggregator (recombine into single bundle)
    → Send summary email
    → Update order status
```

## Data Transformation

### Built-in Functions

```
Text: lower, upper, capitalize, trim, replace, substring,
      split, join, length, md5, sha256, encodeURL, stripHTML, parseJSON

Numeric: round, ceil, floor, abs, min, max,
         formatNumber(1234.5, 2, ".", ",") → "1,234.50"

Date: now, formatDate(date, "YYYY-MM-DD"), parseDate(string, "MM/DD/YYYY"),
      addDays, addHours, dateDifference(date1, date2, "days"),
      setTimezone(date, "America/New_York")

Array: length, first, last, slice, merge, deduplicate,
       sort, reverse, contains, map(array, "fieldName")
```

### JSON Operations

```
├── Parse JSON: Input JSON string → structured object with mapped fields
├── Create JSON: Mapped fields → JSON string (for API request bodies)
└── Transform JSON: JMESPath-style restructuring
```

## Error Handling

### Error Handler Types

```
├── Ignore: Skip failed bundle, continue with next (non-critical operations)
├── Break: Stop execution, move to incomplete queue (transient errors)
│   ├── Auto-retry: "Number of attempts": 3, "Interval": 60 seconds
│   └── If all retries fail → incomplete executions queue for manual review
├── Resume: Use substitute output value, continue (provide defaults)
├── Commit: Stop execution, mark as successful (graceful shutdown)
└── Rollback: Stop execution, mark as error (all-or-nothing operations)

Adding Error Handlers:
  Right-click a module → "Add error handler"
  [HTTP Module] ─── error ──→ [Slack: Send Alert] → [Break]
       │ success
       ▼
  [Next Module]

Error Data: {{error.message}}, {{error.type}}, {{error.bundle}}
```

## Webhooks

```
Custom Webhook Module:
├── Creates a unique URL for receiving data (instant trigger)
├── Supports JSON, form-data, and raw payloads
├── Options: IP restrictions, custom header validation, JSON pass-through
│
├── Synchronous Pattern:
│   [Webhook] → [Validate] → [Process] → [Webhook Response: 200 OK]
│
└── Async with Acknowledgment:
    [Webhook] → [Response: 202 Accepted] → [Process] → [HTTP: POST callback]
```

## Data Stores

```
Data Stores (Built-in Key-Value Database):
├── Purpose: Persist data between scenario runs
├── Operations: Add/Replace, Get, Search, Delete, Count
│
├── Use Cases
│   ├── Deduplication: Check if record already processed
│   ├── State tracking: Last sync timestamp, cursor position
│   ├── Lookup tables: Map codes to values
│   ├── Counters: Track daily totals, running counts
│   └── Cache: Store API responses to reduce calls
│
└── Deduplication Example:
    [Trigger: New Order]
      → [Data Store: Get Record (key = order_id)]
      → [Router]
          ├── Exists → [Ignore: Already processed]
          └── Not Exists → [Process Order]
                            → [Data Store: Add Record (key = order_id)]
```

## Custom API Connections (HTTP Module)

```
HTTP Module Configuration:
├── Request: URL, Method, Headers, Query String, Body (JSON/form/multipart)
├── Authentication: Basic, API Key, OAuth2, custom
├── Response: Parse JSON/XML/text, define output data structure
├── Pagination: Use Repeat module, track cursor in data store
│
OAuth2 Custom Connection:
  Configure Client ID/Secret, Authorize URI, Token URI, Scope
  Make handles token refresh automatically
```

## Scheduling and Execution

```
Scheduling Options:
├── Interval-based: Every N minutes (min 1 min on paid plans)
├── Specific times: At specified time(s), days of week (timezone-aware)
├── CRON: "0 9 * * 1-5" = weekdays at 9 AM
└── Instant: Webhook triggers (no schedule needed, most responsive)

Execution Controls:
├── Sequential: Default, prevents race conditions on shared resources
├── Parallel: Enable for independent operations
├── Timeout: Default 40 minutes per execution
└── Incomplete Executions: Failed runs stored for retry (auto or manual)
```

## Performance Optimization

```
Reduce Operation Consumption:
├── Filter before processing (filtering is free)
├── Batch operations: Aggregate → single bulk action vs per-item calls
│   (100 items → 1 bulk insert = 1 op vs 100 individual = 100 ops)
├── Use webhooks instead of polling where possible
├── Cache in data store vs repeated API searches
├── Pass data through from trigger (avoid re-fetching)

Scaling Strategies:
├── Configure "Maximum number of results" on trigger for batch processing
├── Scenario chaining: Split into stages connected via webhooks/data stores
├── Data store as queue: Producer writes, consumer reads N items per run
└── Monitor: Track operations/month, execution duration, incomplete queue
```

## Production Checklist

- [ ] Add error handlers to all modules that call external APIs
- [ ] Configure Break handlers with auto-retry for transient failures
- [ ] Use Router filters to skip irrelevant data early (saves operations)
- [ ] Implement deduplication via Data Store for webhook triggers
- [ ] Use Aggregators before bulk actions to reduce operation count
- [ ] Set appropriate schedule intervals considering API rate limits
- [ ] Define JSON data structures for all webhook and HTTP modules
- [ ] Use Data Stores for cross-execution state (cursors, counters, caches)
- [ ] Set up error notification scenario for centralized alerting
- [ ] Monitor incomplete execution queue and resolve promptly
- [ ] Document each scenario's purpose with naming convention
- [ ] Review operation consumption monthly and optimize top consumers
- [ ] Test scenarios with edge cases (empty arrays, missing fields, large payloads)

## When to Use

**Use this skill when:**
- Designing or implementing make automator solutions
- Reviewing or improving existing make automator approaches
- Making architectural or implementation decisions about make automator
- Learning make automator patterns and best practices
- Troubleshooting make automator-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Make Automator Analysis

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

**Input:** "Help me implement make automator for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended make automator approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When make automator must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
