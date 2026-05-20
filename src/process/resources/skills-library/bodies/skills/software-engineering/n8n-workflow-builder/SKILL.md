---
name: n8n-workflow-builder
description: |
  Expert n8n workflow automation covering self-hosted deployment, node configuration, trigger types, webhook handling, data transformation with expressions, error handling patterns, credential management, sub-workflow composition, database operations, API integration, and production monitoring for reliable automation pipelines.
  Use when the user asks about n8n workflow builder, n8n workflow builder best practices, or needs guidance on n8n workflow builder implementation.
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

# n8n Workflow Builder

You are an expert in n8n workflow automation. You guide teams through building, deploying, and maintaining production-grade automation workflows using n8n's visual editor and code nodes, with emphasis on self-hosted reliability, error handling, and scalable workflow design.

## Core Concepts

### n8n Architecture

```
n8n Components:
├── Workflow Engine
│   ├── Executes node graphs sequentially or in parallel
│   ├── Handles data passing between nodes (items/JSON)
│   ├── Manages execution state and history
│   └── Supports webhook, cron, and event-based triggers
│
├── Node Types
│   ├── Trigger nodes (start workflows)
│   ├── Action nodes (perform operations)
│   ├── Logic nodes (IF, Switch, Merge, Split)
│   ├── Code node (custom JavaScript/Python)
│   ├── Sub-workflow node (compose workflows)
│   └── Community nodes (extend via npm packages)
│
├── Data Model
│   ├── Each node outputs an array of items
│   ├── Each item has JSON payload and optional binary data
│   └── Expressions access data: {{ $json.fieldName }}
│
└── Deployment
    ├── Self-hosted (Docker, Kubernetes) or n8n Cloud
    ├── Queue mode for horizontal scaling
    └── PostgreSQL for production (SQLite for dev)
```

## Trigger Types

### Webhook Trigger

```json
{
  "name": "Receive Order Webhook",
  "type": "n8n-nodes-base.webhook",
  "parameters": {
    "path": "incoming-order",
    "httpMethod": "POST",
    "authentication": "headerAuth",
    "responseMode": "responseNode"
  }
}
```

### Common Trigger Patterns

| Trigger | Use Case | Configuration |
|---------|----------|--------------|
| Webhook | Receive external events | Path, auth, response mode |
| Schedule | Periodic tasks | Cron expression or interval |
| Email Trigger (IMAP) | Process incoming emails | Mailbox, folder, filters |
| Database Trigger | React to data changes | Poll interval, query |
| n8n Trigger | Called by other workflows | Sub-workflow invocation |
| Chat Trigger | Conversational AI workflows | Message input, memory |

## Data Transformation

### Expression Syntax

```
n8n Expression Reference:
├── Access current item
│   ├── {{ $json.fieldName }}
│   ├── {{ $json["field with spaces"] }}
│   └── {{ $json.nested.field }}
│
├── Access items from other nodes
│   ├── {{ $('Node Name').item.json.field }}
│   ├── {{ $('Node Name').first().json.field }}
│   └── {{ $('Node Name').all()[0].json.field }}
│
├── Built-in variables
│   ├── {{ $now }}, {{ $today }}, {{ $runIndex }}, {{ $itemIndex }}
│   ├── {{ $workflow.id }}, {{ $workflow.name }}, {{ $execution.id }}
│
├── String methods
│   ├── {{ $json.name.toUpperCase() }}
│   ├── {{ $json.email.split('@')[1] }}
│   └── {{ $json.text.replace(/\s+/g, '-') }}
│
├── Date methods
│   ├── {{ $now.format('yyyy-MM-dd') }}
│   ├── {{ $now.minus(7, 'days').toISO() }}
│   └── {{ DateTime.fromISO($json.date).toFormat('dd/MM/yyyy') }}
│
└── Conditional expressions
    ├── {{ $json.status === 'active' ? 'Yes' : 'No' }}
    └── {{ $json.name || 'Unknown' }}
```

### Code Node Patterns

```javascript
// Code Node: Transform and enrich data (Run Once for All Items)
const items = $input.all();
const results = [];

for (const item of items) {
  const data = item.json;
  const fullName = `${data.first_name} ${data.last_name}`.trim();
  let tier = 'standard';
  if (data.total_spend > 10000) tier = 'enterprise';
  else if (data.total_spend > 1000) tier = 'premium';

  const daysSinceLastOrder = Math.floor(
    (Date.now() - new Date(data.last_order_date).getTime()) / 86400000
  );

  results.push({
    json: { ...data, full_name: fullName, tier, days_since_last_order: daysSinceLastOrder,
            is_at_risk: daysSinceLastOrder > 90, processed_at: new Date().toISOString() }
  });
}
return results;
```

```javascript
// Code Node: Aggregate and summarize
const data = $input.all().map(i => i.json);
const grouped = {};
for (const record of data) {
  const key = record.category;
  if (!grouped[key]) grouped[key] = { count: 0, total: 0, items: [] };
  grouped[key].count++;
  grouped[key].total += record.amount;
  grouped[key].items.push(record.id);
}

return Object.entries(grouped).map(([category, stats]) => ({
  json: { category, count: stats.count, total: stats.total,
          average: Math.round(stats.total / stats.count * 100) / 100 }
}));
```

## Error Handling

### Error Handling Strategy

```
├── Node-level: Continue on Fail
│   ├── Downstream nodes receive error in $json.error
│   ├── Use IF node to branch on error vs success
│   └── Good for: non-critical steps, fallback logic
│
├── Workflow-level: Error Workflow
│   ├── Configure in Workflow Settings -> Error Workflow
│   ├── Separate workflow receives error details
│   └── Good for: centralized alerting, logging
│
└── Retry logic
    ├── Built-in retry on node settings (1-3 retries)
    └── Custom retry with Loop and Wait nodes
```

### Error Notification Workflow

```json
{
  "name": "Error Handler - Send Alert",
  "nodes": [
    {
      "name": "Error Trigger",
      "type": "n8n-nodes-base.errorTrigger"
    },
    {
      "name": "Format Error",
      "type": "n8n-nodes-base.code",
      "parameters": {
        "jsCode": "const error = $input.first().json;\nreturn [{ json: { message: `Workflow: ${error.workflow.name}\\nNode: ${error.execution.lastNodeExecuted}\\nError: ${error.execution.error.message}\\nExecution: ${error.execution.id}`, severity: 'error' } }];"
      }
    },
    {
      "name": "Send Slack Alert",
      "type": "n8n-nodes-base.slack",
      "parameters": { "channel": "#automation-alerts", "text": "={{ $json.message }}" }
    }
  ]
}
```

## Workflow Composition

### Sub-Workflow Pattern

```
Sub-Workflow Architecture:
├── Parent workflow handles orchestration
│   ├── Calls sub-workflows via "Execute Workflow" node
│   ├── Passes data as input items
│   └── Receives results from sub-workflow output
│
├── Sub-workflow design rules
│   ├── Single responsibility per sub-workflow
│   ├── Handle own errors (do not leak to parent)
│   └── Reusable across multiple parents
│
└── Example: Customer Onboarding
    ├── [Sub] Validate Customer Data
    ├── [Sub] Create CRM Record
    ├── [Sub] Send Welcome Email
    └── [Sub] Notify Sales Team
```

## Database Operations

### Batch Processing Pattern

```javascript
// Code Node: Batch items for database insertion
const items = $input.all();
const batchSize = 100;
const batches = [];

for (let i = 0; i < items.length; i += batchSize) {
  const batch = items.slice(i, i + batchSize);
  batches.push({
    json: { batch_index: Math.floor(i / batchSize),
            records: batch.map(item => item.json), count: batch.length }
  });
}
return batches;
```

### Upsert Pattern

```json
{
  "name": "Upsert Contacts",
  "type": "n8n-nodes-base.postgres",
  "parameters": {
    "operation": "executeQuery",
    "query": "INSERT INTO contacts (email, name, company, updated_at) VALUES ($1, $2, $3, NOW()) ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, company = EXCLUDED.company, updated_at = NOW()",
    "options": { "queryParams": "={{ $json.email }}, ={{ $json.name }}, ={{ $json.company }}" }
  }
}
```

## Self-Hosted Deployment

### Docker Compose Production Setup

```yaml
version: '3.8'
services:
  n8n:
    image: n8nio/n8n:latest
    restart: always
    ports: ["5678:5678"]
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=${N8N_USER}
      - N8N_BASIC_AUTH_PASSWORD=${N8N_PASSWORD}
      - N8N_HOST=${N8N_HOST}
      - N8N_PROTOCOL=https
      - WEBHOOK_URL=[reference URL]
      - DB_TYPE=postgresdb
      - DB_POSTGRESDB_HOST=postgres
      - DB_POSTGRESDB_DATABASE=n8n
      - DB_POSTGRESDB_USER=${DB_USER}
      - DB_POSTGRESDB_PASSWORD=${DB_PASSWORD}
      - EXECUTIONS_DATA_PRUNE=true
      - EXECUTIONS_DATA_MAX_AGE=168
      - N8N_METRICS=true
      - QUEUE_BULL_REDIS_HOST=redis
    volumes: [n8n_data:/home/node/.n8n]
    depends_on: [postgres, redis]

  postgres:
    image: postgres:16-alpine
    restart: always
    environment:
      POSTGRES_DB: n8n
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes: [postgres_data:/var/lib/postgresql/data]

  redis:
    image: redis:7-alpine
    restart: always
    volumes: [redis_data:/data]

  n8n-worker:
    image: n8nio/n8n:latest
    restart: always
    command: worker
    environment:
      - DB_TYPE=postgresdb
      - DB_POSTGRESDB_HOST=postgres
      - DB_POSTGRESDB_DATABASE=n8n
      - DB_POSTGRESDB_USER=${DB_USER}
      - DB_POSTGRESDB_PASSWORD=${DB_PASSWORD}
      - QUEUE_BULL_REDIS_HOST=redis
      - EXECUTIONS_MODE=queue
    depends_on: [postgres, redis]

volumes:
  n8n_data:
  postgres_data:
  redis_data:
```

### Queue Mode for Scaling

```
Main process: Serves UI/API, receives webhooks, enqueues jobs to Redis
Worker processes: Dequeue and execute, scale horizontally, stateless
Configuration: EXECUTIONS_MODE=queue, workers run "n8n worker" command
```

## Credential Management

```
├── Storage: Encrypted at rest, key from N8N_ENCRYPTION_KEY env var
│   Back up encryption key securely (loss = credentials lost)
├── Access Control: Scoped to owner, sharable, use service accounts
└── Best Practices: One credential per service per environment,
    prefer OAuth2, test before activating, audit via execution logs
```

## Monitoring and Observability

```
├── Prometheus Metrics: N8N_METRICS=true, endpoint /metrics
│   n8n_workflow_executions_total, n8n_workflow_execution_duration_seconds
├── Execution Pruning: EXECUTIONS_DATA_PRUNE=true, MAX_AGE=168 hours
├── Alerting: Error workflow -> Slack, queue depth, duration spikes
└── Health: GET /healthz for liveness probes
```

## Production Checklist

- [ ] Deploy with PostgreSQL (not SQLite)
- [ ] Set N8N_ENCRYPTION_KEY and back it up securely
- [ ] Enable basic auth or SSO for UI access
- [ ] Configure WEBHOOK_URL to match your public domain
- [ ] Set up error workflow for centralized failure alerting
- [ ] Enable execution data pruning to manage storage
- [ ] Use queue mode with Redis for multi-worker scaling
- [ ] Implement sub-workflows for reusable logic
- [ ] Add retry settings on nodes calling external APIs
- [ ] Enable Prometheus metrics for monitoring
- [ ] Document each workflow's purpose and trigger conditions

## When to Use

**Use this skill when:**
- Designing or implementing n8n workflow builder solutions
- Reviewing or improving existing n8n workflow builder approaches
- Making architectural or implementation decisions about n8n workflow builder
- Learning n8n workflow builder patterns and best practices
- Troubleshooting n8n workflow builder-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# N8n Workflow Builder Analysis

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

**Input:** "Help me implement n8n workflow builder for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended n8n workflow builder approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When n8n workflow builder must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
