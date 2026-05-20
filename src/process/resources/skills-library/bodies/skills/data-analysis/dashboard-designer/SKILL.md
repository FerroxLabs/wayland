---
name: dashboard-designer
description: |
  Guide for designing effective analytical dashboards using Metabase, Grafana, and Looker including design principles, KPI selection, layout patterns, interactivity, and stakeholder-driven dashboard strategy.
  Use when the user asks about dashboard designer, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of dashboard designer or requires a different specialized skill.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "data-science statistics budgeting checklist template sql api-design analysis"
  category: "data-analysis"
  subcategory: "statistics-modeling"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Dashboard Designer

You are an expert dashboard designer who creates clear, actionable analytical dashboards that drive decisions, selecting the right tools and applying information design principles across Metabase, Grafana, and Looker.


## When to Use

**Use this skill when:**
- User asks about dashboard designer techniques or best practices
- User needs guidance on dashboard designer concepts
- User wants to implement or improve their approach to dashboard designer

**Do NOT use when:**
- The request falls outside the scope of dashboard designer
- User needs a different specialized skill for their specific situation
- The topic requires professional consultation beyond general guidance

## Dashboard Design Principles

### The 5-Second Rule

A dashboard should communicate its primary message within 5 seconds of viewing. If a stakeholder cannot identify the key takeaway immediately, the design needs revision.

### Information Hierarchy

```
┌─────────────────────────────────────────────────┐
│  LEVEL 1: KPI Summary Cards (top row)           │
│  Answer: "How are we doing right now?"          │
├─────────────────────────────────────────────────┤
│  LEVEL 2: Trend Charts (middle section)         │
│  Answer: "How has it been changing?"            │
├─────────────────────────────────────────────────┤
│  LEVEL 3: Breakdown Tables (bottom section)     │
│  Answer: "What are the details?"               │
└─────────────────────────────────────────────────┘
```

### Layout Grid Patterns

```
Executive Dashboard (4-6 charts):
┌──────┬──────┬──────┬──────┐
│ KPI1 │ KPI2 │ KPI3 │ KPI4 │  <- Summary cards
├──────┴──────┼──────┴──────┤
│  Main Trend │  Secondary  │  <- Key trends
├─────────────┼─────────────┤
│  Breakdown  │  Breakdown  │  <- Details
└─────────────┴─────────────┘

Operational Dashboard (8-12 charts):
┌──────┬──────┬──────┬──────┬──────┬──────┐
│ KPI1 │ KPI2 │ KPI3 │ KPI4 │ KPI5 │ KPI6 │
├──────┴──────┴──────┼──────┴──────┴──────┤
│    Primary Metric  │  Secondary Metric  │
├────────────────────┼────────────────────┤
│   Segment Detail   │   Segment Detail   │
├────────────────────┴────────────────────┤
│            Detailed Table               │
└─────────────────────────────────────────┘
```

## KPI Selection Framework

### By Business Function

| Function | Primary KPIs | Secondary KPIs |
|----------|-------------|----------------|
| **SaaS Revenue** | MRR, ARR, Net Revenue Retention | ARPU, Expansion MRR, Contraction MRR |
| **Growth** | New Users, Activation Rate, WAU/MAU | Signup Rate, Time-to-Activation, Virality |
| **Engagement** | DAU/MAU, Session Duration, Feature Usage | Stickiness, Power Users %, Return Rate |
| **Retention** | D1/D7/D30 Retention, Churn Rate | Resurrection Rate, At-Risk Users |
| **Sales** | Pipeline Value, Win Rate, Sales Cycle | Quota Attainment, Lead Response Time |
| **Support** | CSAT, First Response Time, Resolution Time | Ticket Volume, Escalation Rate |
| **Marketing** | CAC, LTV:CAC, Conversion Rate | Click-Through Rate, Cost Per Lead |
| **Engineering** | Deployment Frequency, Lead Time, MTTR | Change Failure Rate, Uptime |

### KPI Card Design

```
┌─────────────────────────────┐
│  Monthly Revenue             │
│  $1,245,320                  │  <- Current value (large, bold)
│  ▲ 12.3% vs last month      │  <- Trend indicator with context
│  Target: $1,200,000 ✓       │  <- Target comparison
│  ████████████████░░░ 104%    │  <- Progress bar
└─────────────────────────────┘
```

### Choosing Comparisons

| Comparison Type | When to Use | Example |
|----------------|-------------|---------|
| Period over Period | Trend detection | This month vs. last month |
| Year over Year | Seasonal businesses | Jan 2025 vs. Jan 2024 |
| vs. Target | Goal tracking | Actual vs. budget |
| vs. Benchmark | Industry context | Your NPS vs. industry avg |
| Cohort-based | Product changes | Pre-launch vs. post-launch |

## Metabase Setup and Patterns

### Question Types

```yaml
# Simple question (UI builder)
- Type: "Simple"
- Use when: Basic aggregations, filters, single-table queries

# Custom question (notebook editor)
- Type: "Custom"
- Use when: Joins, custom columns, multi-step aggregations

# Native query (SQL)
- Type: "Native"
- Use when: Complex logic, CTEs, window functions, performance
```

### Effective SQL for Metabase

```sql
-- Use Metabase variables for interactive filters
SELECT
    DATE_TRUNC('week', created_at) AS week,
    COUNT(*) AS signups,
    COUNT(*) FILTER (WHERE activated) AS activated,
    ROUND(100.0 * COUNT(*) FILTER (WHERE activated) / COUNT(*), 1) AS activation_rate
FROM users
WHERE created_at >= {{start_date}}
  AND created_at < {{end_date}}
  AND CASE WHEN {{channel}} = 'All' THEN TRUE
       ELSE acquisition_channel = {{channel}} END
GROUP BY 1
ORDER BY 1;
```

### Dashboard Organization

```
Collection structure:
├── Executive/
│   ├── Company Overview
│   └── Board Metrics
├── Product/
│   ├── User Engagement
│   ├── Feature Adoption
│   └── Retention
├── Revenue/
│   ├── MRR Dashboard
│   ├── Cohort LTV
│   └── Pricing Analysis
├── Marketing/
│   ├── Campaign Performance
│   └── Channel Attribution
└── Operational/
    ├── System Health
    └── Support Metrics
```

## Grafana for Operational Dashboards

### Panel Configuration Best Practices

```json
{
  "panels": [
    {
      "title": "Request Rate",
      "type": "timeseries",
      "targets": [
        {
          "expr": "rate(http_requests_total{job='api'}[5m])",
          "legendFormat": "{{method}} {{path}}"
        }
      ],
      "fieldConfig": {
        "defaults": {
          "unit": "reqps",
          "thresholds": {
            "steps": [
              { "value": 0, "color": "green" },
              { "value": 80, "color": "yellow" },
              { "value": 95, "color": "red" }
            ]
          }
        }
      }
    }
  ]
}
```

### Alerting Rules

```yaml
# Grafana alerting for dashboard metrics
groups:
  - name: SLA Alerts
    rules:
      - alert: HighErrorRate
        expr: |
          sum(rate(http_requests_total{status=~"5.."}[5m]))
          / sum(rate(http_requests_total[5m])) > 0.01
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Error rate above 1% for 5 minutes"

      - alert: HighLatency
        expr: |
          histogram_quantile(0.95,
            rate(http_request_duration_seconds_bucket[5m])
          ) > 0.5
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "P95 latency above 500ms"
```

### Dashboard Variables

```
# Template variables for interactive filtering
Variable: environment
  Type: Query
  Query: label_values(up, environment)
  Multi-value: true

Variable: service
  Type: Query
  Query: label_values(up{environment=~"$environment"}, service)
  Multi-value: true

Variable: interval
  Type: Interval
  Values: 1m, 5m, 15m, 1h
  Default: 5m
```

## Looker / LookML Patterns

### Model Organization

```lookml
# views/users.view.lkml
view: users {
  sql_table_name: analytics.users ;;

  dimension: user_id {
    primary_key: yes
    type: number
  }

  dimension_group: created {
    type: time
    timeframes: [raw, date, week, month, quarter, year]
    sql: ${TABLE}.created_at ;;
  }

  dimension: acquisition_channel {
    type: string
    sql: ${TABLE}.channel ;;
  }

  measure: total_users {
    type: count_distinct
    sql: ${user_id} ;;
  }

  measure: new_users_last_30d {
    type: count_distinct
    sql: ${user_id} ;;
    filters: [created_date: "last 30 days"]
  }
}
```

### Explore with Joins

```lookml
explore: orders {
  join: users {
    type: left_outer
    sql_on: ${orders.user_id} = ${users.user_id} ;;
    relationship: many_to_one
  }

  join: products {
    type: left_outer
    sql_on: ${orders.product_id} = ${products.product_id} ;;
    relationship: many_to_one
  }

  always_filter: {
    filters: [orders.created_date: "last 90 days"]
  }
}
```

## Dashboard Anti-Patterns

| Anti-Pattern | Problem | Fix |
|---|---|---|
| Wall of numbers | Cognitive overload | Limit to 6-8 key metrics per view |
| Rainbow charts | No visual hierarchy | Use 2-3 colors with purpose |
| Pie chart overuse | Hard to compare slices | Use horizontal bar charts |
| No time context | Cannot assess trend | Always include period-over-period |
| Too many filters | Analysis paralysis | Default to most common view |
| Vanity metrics | No actionable insight | Connect metrics to decisions |
| Stale dashboards | Erodes trust | Set up refresh schedules and alerts |
| No documentation | Tribal knowledge | Add descriptions to every metric |
| One dashboard for all | Serves nobody well | Tailor to specific audience |
| Real-time everything | Unnecessary load | Match refresh to decision cadence |

## Dashboard Review Checklist

### Before Launch

- [ ] Each chart answers a specific question
- [ ] Primary KPIs are visible without scrolling
- [ ] Consistent date ranges across all panels
- [ ] Color usage is purposeful and accessible
- [ ] Labels and units are clear on all axes
- [ ] Comparison context provided (target, trend, benchmark)
- [ ] Filters default to the most common use case
- [ ] Mobile/tablet view is usable (if needed)
- [ ] Data source documentation is linked
- [ ] Refresh schedule matches decision cadence

### After Launch

- [ ] Stakeholders can find answers without asking questions
- [ ] Dashboard load time is under 5 seconds
- [ ] At least one person reviews the dashboard weekly
- [ ] Unused charts are removed quarterly
- [ ] Metric definitions are reviewed for accuracy
- [ ] Access permissions are appropriate

## Stakeholder Communication

### Dashboard Briefing Template

```
Dashboard: [Name]
Audience: [Who uses this]
Cadence: [How often they check it]
Primary Questions:
  1. [Question this dashboard answers]
  2. [Second question]
  3. [Third question]
Key Decisions Supported:
  - [Decision 1 based on metrics]
  - [Decision 2 based on metrics]
Data Sources: [List]
Refresh Frequency: [Real-time / hourly / daily]
Owner: [Team/person responsible]
```


## Process

1. **Gather information.** Ask the user clarifying questions to understand their specific situation, goals, and constraints
2. **Analyze context.** Review the information provided and identify key factors relevant to dashboard designer
3. **Develop recommendations.** Apply domain expertise to create actionable guidance tailored to the user's needs
4. **Present structured output.** Deliver findings in the output format below with clear next steps
5. **Address follow-ups.** Answer additional questions and refine recommendations based on feedback


## Output Format

```template
## Dashboard Designer Analysis

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

**Input:** "Help me with dashboard designer for my current situation"

**Output:**

Based on your situation, here is a structured approach to dashboard designer:

1. **Assessment:** Evaluate your current state and identify key areas for improvement
2. **Strategy:** Develop a targeted plan based on best practices
3. **Implementation:** Execute the plan with specific, measurable steps
4. **Review:** Monitor progress and adjust as needed
