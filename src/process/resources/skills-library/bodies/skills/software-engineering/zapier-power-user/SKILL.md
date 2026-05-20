---
name: zapier-power-user
description: |
  Expert Zapier automation covering multi-step zap design, filters and paths for conditional logic, formatter utilities, webhook triggers and actions, code steps with JavaScript and Python, transfer and tables for data management, error handling, team collaboration, and optimization strategies for high-volume automation.
  Use when the user asks about zapier power user, zapier power user best practices, or needs guidance on zapier power user implementation.
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
  difficulty: "beginner"
---

# Zapier Power User

You are an expert Zapier automation architect. You guide teams through building sophisticated multi-step zaps with conditional logic, data transformation, error handling, and scalable patterns that go far beyond simple two-step automations.

## Zap Architecture

### Multi-Step Zap Design

```
Zap Design Principles:
├── Start with the trigger (what initiates the workflow)
├── Validate data early (filter out invalid items in step 2-3)
├── Transform data before using it (formatters, code steps)
├── Branch with Paths for conditional logic
├── Handle errors with built-in retry and fallback steps
└── Keep zaps focused: one purpose per zap

Step Ordering Best Practice:
  1. Trigger (webhook, app event, schedule)
  2. Filter / validation (reject bad data early)
  3. Data lookup / enrichment (get related records)
  4. Transform / format (prepare data for destinations)
  5. Branch / path (conditional routing)
  6. Actions (create, update, send)
  7. Notification (confirm success or report failure)
```

### Trigger Types

| Trigger | Mechanism | Latency | Use Case |
|---------|-----------|---------|----------|
| Instant (webhook) | Push from app | Seconds | Real-time reactions |
| Polling | Zapier checks every 1-15 min | Minutes | Apps without webhooks |
| Schedule | Cron-like time trigger | Exact time | Periodic batch jobs |
| Webhook (catch) | Raw HTTP POST to Zapier URL | Seconds | Custom integrations |
| Email Parser | Incoming email to Zapier address | Minutes | Email-triggered workflows |
| RSS | Feed poll | 5-15 min | Content monitoring |

## Filters

### Filter Configuration

```
Filter Logic:
├── AND conditions (all must be true)
│   └── Field A equals "value" AND Field B greater than 100
│
├── OR groups (any group must be true)
│   └── (Field A equals "value") OR (Field B contains "keyword")
│
├── Available operators
│   ├── Text: contains, does not contain, exactly matches, starts with, ends with
│   ├── Number: greater than, less than, equals
│   ├── Boolean: is true, is false
│   ├── Existence: exists, does not exist
│   └── Date: before, after
│
└── Filter vs Path
    ├── Filter: stops the zap entirely if condition is false
    └── Path: routes to different branches (zap continues either way)

Common Filter Patterns:
  - Skip test/internal data: Email does not contain "@yourcompany.com"
  - Only process high-value: Amount greater than 100
  - Deduplicate: Lookup step returns "not found" → proceed (new record)
  - Business hours only: Formatter extracts hour, filter for 9-17
```

## Paths (Conditional Branching)

### Path Configuration

```
Path Structure:
├── Path A: High Value Leads (Amount > $10,000)
│   ├── Action: Create Salesforce opportunity
│   ├── Action: Assign to senior rep
│   └── Action: Send Slack alert to #big-deals
│
├── Path B: Standard Leads ($1,000 - $10,000)
│   ├── Action: Add to CRM pipeline
│   └── Action: Send automated email sequence
│
├── Path C: Small Leads (< $1,000)
│   ├── Action: Add to email nurture list
│   └── Action: Tag in CRM as "nurture"
│
└── Default Path (Fallback)
    ├── Catches anything not matching above
    └── Action: Log to spreadsheet for review

Path Rules:
  - Paths evaluate top to bottom, first match wins
  - Always include a default/fallback path
  - Each path can have unlimited subsequent steps
  - Paths cannot merge back (each path runs independently)
  - Nest paths within paths for complex decision trees (limit: 3 levels)
```

## Formatter Utilities

### Text Transformations

```
Formatter by Zapier - Text Operations:
├── Capitalize           → "hello world" → "Hello World"
├── Lowercase            → "HELLO" → "hello"
├── Uppercase            → "hello" → "HELLO"
├── Trim Whitespace      → "  hello  " → "hello"
├── Replace              → Replace "old" with "new"
├── Split Text           → "a,b,c" split by "," → ["a","b","c"]
├── Truncate             → Limit to N characters with "..."
├── Extract Pattern      → Regex extraction from text
├── Remove HTML Tags     → Strip HTML, keep text
├── URL Encode           → "hello world" → "hello%20world"
├── Default Value        → If empty, use "fallback value"
├── Super Trim           → Remove all extra whitespace
├── Convert Markdown     → Markdown → HTML
└── Pluralize            → "item" → "items"

Expression Syntax (in fields):
  {{123 + 456}}                    → 579
  {{zap.trigger.field.length}}     → length of string
  {{zap.trigger.field.toLowerCase()}} → lowercase
```

### Date and Number Formatting

```
Date Operations:
├── Format              → "2026-01-15" → "January 15, 2026"
├── Add/Subtract Time   → Add 7 days, subtract 2 hours
├── Compare Dates       → Is date A after date B?
├── Extract Component   → Get month, year, day of week
├── Convert Timezone    → UTC → America/New_York
└── Date Difference     → Days/hours between two dates

Number Operations:
├── Format Number       → 1234567 → "1,234,567"
├── Format Currency     → 29.9 → "$29.90"
├── Math Operations     → Add, subtract, multiply, divide
├── Random Number       → Generate between min and max
├── Format Phone        → "+12125551234" → "(212) 555-1234"
└── Spreadsheet Formula → Excel-style formulas
```

## Webhooks

### Catch Webhook (Trigger)

```
Webhook Trigger Setup:
1. Add "Webhooks by Zapier" as trigger
2. Choose "Catch Hook" (or "Catch Raw Hook" for full control)
3. Copy the provided webhook URL
4. Send a test payload to define the data structure
5. Map fields in subsequent steps

Webhook URL: [reference URL]

Security Options:
├── Query string auth: ?api_key=your_secret_key
├── Pick off child key: Extract nested field as top-level items
└── Catch Raw Hook: Access headers, query params, raw body

Example: Receive GitHub webhook
  POST [reference URL]
  Body: { "action": "opened", "pull_request": { "title": "...", "user": {...} } }
  → Pick off child key: "pull_request" to get PR data directly
```

### Send Webhook (Action)

```
Webhook Action Configuration:
├── URL: Target endpoint
├── Method: GET, POST, PUT, PATCH, DELETE
├── Headers:
│   ├── Content-Type: application/json
│   ├── Authorization: Bearer {{auth_token}}
│   └── Custom headers as needed
├── Data:
│   ├── JSON body with mapped fields
│   ├── Form data for form-encoded endpoints
│   └── Raw body for custom formats
└── Advanced:
    ├── Unflatten: Convert dot notation to nested JSON
    ├── Basic Auth: username/password
    └── SSL certificate validation

Example POST:
  URL: [reference URL]
  Headers: { "Authorization": "Bearer {{token}}", "Content-Type": "application/json" }
  Data: {
    "email": "{{step1_email}}",
    "name": "{{step1_first_name}} {{step1_last_name}}",
    "source": "zapier_integration",
    "created_at": "{{zap_meta_timestamp}}"
  }
```

## Code Steps

### JavaScript Code Step

```javascript
// Code by Zapier: JavaScript
// Available: inputData object with mapped fields, get for HTTP requests

// Input fields mapped in Zapier UI:
// inputData.amount, inputData.currency, inputData.customerEmail

const amount = parseFloat(inputData.amount);
const currency = inputData.currency || 'USD';

// Categorize the order
let tier, discount;
if (amount >= 500) {
  tier = 'enterprise';
  discount = 0.15;
} else if (amount >= 100) {
  tier = 'professional';
  discount = 0.10;
} else {
  tier = 'starter';
  discount = 0;
}

const discountedAmount = amount * (1 - discount);
const savings = amount - discountedAmount;

// Make an API call within code step
const response = await get('[reference URL]' + currency);
const rates = await response.json();
const amountEUR = discountedAmount * (rates.rates?.EUR || 0.85);

// Return object - each key becomes a field in subsequent steps
output = [{
  tier: tier,
  original_amount: amount,
  discount_percent: discount * 100,
  discounted_amount: discountedAmount.toFixed(2),
  savings: savings.toFixed(2),
  amount_eur: amountEUR.toFixed(2),
  customer_email: inputData.customerEmail.toLowerCase().trim()
}];
```

### Python Code Step

Python code steps use the `input_data` dict and the `requests` library. The `output` dict keys become available fields in subsequent steps. Use Python for date math, JSON parsing, and complex transformations.

## Looping

### Loop Pattern

```
Looping Use Cases:
├── Process each line item in an order
├── Send personalized message to each recipient
├── Update multiple records one at a time
└── Paginate through API results

Loop Configuration:
  1. Add "Looping by Zapier" step
  2. Choose "Create Loop From Line Items"
  3. Map the array field to loop over
  4. Steps inside the loop execute once per item
  5. After loop: access aggregated results

Loop Limits:
  - Maximum iterations per run varies by plan
  - Each iteration counts as a task
  - For large lists (100+), consider batch API actions instead
  - Use Sub-Zap pattern for complex per-item logic
```

## Error Handling

### Error Recovery Patterns

```
Error Handling Options:
├── Auto-Replay
│   ├── Zapier auto-retries failed steps
│   ├── Configure in Zap settings
│   ├── Retries with exponential backoff
│   └── Notification after all retries exhausted
│
├── Error Path (within Paths step)
│   ├── Try the risky action in Path A
│   ├── If Path A fails → catch in error handler path
│   ├── Log error, send alert, use fallback
│   └── Zap continues instead of halting
│
├── Lookup or Create Pattern
│   ├── Search for existing record first
│   ├── If found → update
│   ├── If not found → create
│   └── Prevents "duplicate record" errors
│
└── Data Validation
    ├── Filter out empty/malformed data early
    ├── Use Formatter "Default Value" for optional fields
    ├── Trim whitespace on all text inputs
    └── Validate email format before email actions
```

### Monitoring and Alerting

```
Zap Health Monitoring:
├── Task History
│   ├── Review in Zap History page
│   ├── Filter by status: success, error, filtered, held
│   ├── Replay individual tasks manually
│   └── Export history for analysis
│
├── Error Notifications
│   ├── Zapier emails on zap errors (default)
│   ├── Custom: add Slack/email action in error handler
│   ├── Monitor task usage vs plan limits
│   └── Set up weekly digest of zap performance
│
├── Performance Tracking
│   ├── Average execution time per zap
│   ├── Error rate per zap (target < 2%)
│   ├── Task consumption trends
│   └── Filter-out ratio (wasted triggers)
│
└── Common Failure Causes
    ├── API rate limits → add Delay step, reduce frequency
    ├── Auth token expired → reconnect account
    ├── Schema change → test and update field mappings
    ├── Missing required field → add default values
    └── Timeout → simplify step or split into sub-zaps
```

## Optimization Strategies

### Task Reduction

```
Reduce Task Consumption:
├── Filter early
│   ├── Use Filter step as step 2 to reject unwanted triggers
│   ├── Filtering does not count as a task
│   └── Saves all downstream tasks on filtered items
│
├── Batch operations
│   ├── Use "Bulk Create" actions when available
│   ├── Digest by Zapier: collect items over time, process in batch
│   ├── Webhooks: batch multiple events into one payload
│   └── Schedule trigger: pull multiple records per run
│
├── Conditional logic
│   ├── Paths execute only matching branch steps
│   ├── Non-matching branches consume zero tasks
│   └── Short-circuit with Filter before expensive operations
│
└── Architecture
    ├── Combine related steps (fewer zaps = fewer triggers)
    ├── Use code steps to do multiple transformations in one task
    ├── Avoid unnecessary lookup steps (pass data through)
    └── Use Transfer for large data moves instead of per-record zaps
```

### Sub-Zap Pattern

```
Sub-Zap Architecture:
├── Parent Zap (orchestrator)
│   ├── Trigger: the main event
│   ├── Preparation steps
│   └── Action: "Trigger Zap" → calls child zap
│
├── Child Zap (worker)
│   ├── Trigger: "Catch Hook" (from parent)
│   ├── Performs focused task
│   └── Optionally calls back to parent webhook
│
├── Benefits
│   ├── Reusable logic across multiple parent zaps
│   ├── Isolate failures (child fails without stopping parent)
│   ├── Separate concerns (auth, data, notifications)
│   └── Easier debugging and testing
│
└── Communication
    ├── Parent → Child: via webhook with JSON payload
    ├── Child → Parent: via callback webhook (optional)
    └── Shared data: via Storage by Zapier or external DB
```

## Zapier Tables and Transfer

### Tables as Lightweight Database

```
Zapier Tables Use Cases:
├── Maintain state between zap runs
│   └── Track "last processed ID" to avoid duplicates
├── Lookup tables
│   └── Map category codes to full names
├── Queue management
│   └── Add items to table, process in batch zap
├── Approval workflows
│   └── Store pending approvals, update status
└── Deduplication
    └── Check if record exists before creating

Operations:
  - Create Record: Add new row
  - Find Record: Search by field value
  - Update Record: Modify existing row by ID
  - Find or Create: Lookup, create if missing (atomic)
  - Delete Record: Remove row by ID
```

### Transfer for Bulk Data

```
Zapier Transfer:
├── Purpose: Move large datasets between apps (not per-record)
├── Supported: CRM to CRM, spreadsheet to database, etc.
├── One-time or recurring schedule
├── Handles field mapping, deduplication, batching
└── Much more efficient than per-record zaps for migrations

When to Use Transfer vs Zaps:
  Transfer: Initial data migration, periodic full sync, backfill
  Zaps: Real-time per-event reactions, complex conditional logic
```

## Team Collaboration

```
Team Organization:
├── Folder structure
│   ├── By department: Sales, Marketing, Operations, Support
│   ├── By function: Notifications, Data Sync, Reporting
│   └── By status: Production, Staging, Deprecated
│
├── Naming conventions
│   ├── "[Dept] Trigger → Action: Purpose"
│   ├── "[Sales] New Lead → Slack: Notify team"
│   ├── "[Ops] Daily → Report: Generate inventory summary"
│   └── Prefix with status: "[DEPRECATED]" for old zaps
│
├── Shared connections
│   ├── Use team/service accounts for shared app connections
│   ├── Document which zaps use which connections
│   ├── Plan for credential rotation without breaking zaps
│   └── Assign connection ownership to a team, not individual
│
└── Documentation
    ├── Add notes to each zap describing its purpose
    ├── Document dependencies between zaps
    ├── Maintain a registry of all active zaps and owners
    └── Review and prune inactive zaps quarterly
```

## Production Checklist

- [ ] Use Filter steps early to reduce unnecessary task consumption
- [ ] Implement Paths for all conditional logic (avoid multiple zaps)
- [ ] Add default values to all optional fields via Formatter
- [ ] Validate and clean data before sending to destination apps
- [ ] Set up error notification via Slack or email in each critical zap
- [ ] Use code steps for complex transformations to reduce step count
- [ ] Implement sub-zap pattern for reusable logic blocks
- [ ] Name zaps with consistent convention including department and purpose
- [ ] Document zap purpose and dependencies in zap notes
- [ ] Monitor task consumption trends against plan limits
- [ ] Test zaps with edge cases (empty fields, special characters, large payloads)
- [ ] Review and archive unused zaps quarterly

## When to Use

**Use this skill when:**
- Designing or implementing zapier power user solutions
- Reviewing or improving existing zapier power user approaches
- Making architectural or implementation decisions about zapier power user
- Learning zapier power user patterns and best practices
- Troubleshooting zapier power user-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Zapier Power User Analysis

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

**Input:** "Help me implement zapier power user for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended zapier power user approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When zapier power user must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
