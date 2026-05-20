---
name: feature-flag-platform
description: |
  Implement feature flag systems with progressive delivery patterns, experiment tracking, and flag lifecycle management for safe, controlled releases
  Use when the user asks about feature flag platform, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of feature flag platform or requires a different specialized skill.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "devops cloud checklist template guide advanced typescript sql"
  category: "devops-cloud"
  subcategory: "cloud-infrastructure"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Feature Flag Platform

You are a feature flag platform specialist who helps engineering teams implement progressive delivery through feature flags. You guide through flag architecture, targeting strategies, experiment tracking, and lifecycle management for controlled, safe releases.


## When to Use

**Use this skill when:**
- User asks about feature flag platform techniques or best practices
- User needs guidance on feature flag platform concepts
- User wants to implement or improve their approach to feature flag platform

**Do NOT use when:**
- The request falls outside the scope of feature flag platform
- User needs a different specialized skill for their specific situation
- The topic requires professional consultation beyond general guidance

## Feature Flag Fundamentals

### What Feature Flags Solve

```
Without flags:
  Code → Merge → Deploy → ALL users get it immediately
  Risk: Big bang releases, no rollback without redeploy

With flags:
  Code → Merge → Deploy → Flag controls WHO gets it and WHEN
  Benefit: Decouple deployment from release, instant rollback
```

### Flag Types

| Type | Purpose | Lifespan | Example |
|------|---------|----------|---------|
| Release Flag | Control feature rollout | Days to weeks | `enable-new-checkout` |
| Experiment Flag | A/B testing | Weeks to months | `experiment-pricing-page` |
| Ops Flag | Operational control | Permanent | `enable-rate-limiting` |
| Permission Flag | Entitlement control | Permanent | `premium-feature-access` |
| Kill Switch | Emergency disable | Permanent | `disable-external-calls` |

### Flag Lifecycle

```
Created → Development → Testing → Rollout → Fully On → Cleanup

WARNING: The biggest risk with flags is NOT adding them.
It is skipping to REMOVE them. Stale flags are tech debt.
```

## Architecture Patterns

### Flag Evaluation Architecture

```
┌─────────────┐     ┌──────────────┐     ┌───────────────┐
│ Application │────→│ Flag SDK     │────→│ Flag Service   │
│             │     │ (local check)│     │ (config source)│
└─────────────┘     └──────────────┘     └───────────────┘
                           │
                    ┌──────┴──────┐
                    │ Local Cache │
                    └─────────────┘

Evaluation flow:
1. Application calls SDK: isEnabled("feature-x", user)
2. SDK checks local cache for flag rules
3. SDK evaluates rules locally (no network call)
4. SDK streams updates from Flag Service in background
5. If service is down, SDK uses last known state
```

### SDK Integration Pattern

```typescript
import { FlagClient } from './flag-client';

const flags = new FlagClient({
  sdkKey: CONFIG.FLAG_SDK_KEY,
  refreshInterval: 30,
  defaultValues: {
    'new-checkout': false,
    'search-v2': false,
    'rate-limit-threshold': 100,
  },
});

// Boolean flag evaluation
async function handleCheckout(request, user) {
  const context = { userId: user.id, email: user.email, plan: user.plan, country: user.country };
  if (flags.isEnabled('new-checkout', context)) {
    return newCheckoutFlow(request);
  }
  return legacyCheckoutFlow(request);
}

// Multi-variate flag evaluation
async function getSearchResults(query, user) {
  const variant = flags.getVariant('search-algorithm', { userId: user.id, plan: user.plan });
  switch (variant) {
    case 'v2-semantic': return semanticSearch(query);
    case 'v2-hybrid': return hybridSearch(query);
    default: return legacySearch(query);
  }
}
```

### Server-Side vs Client-Side Flags

```
Server-Side: Full context available, no rule exposure to clients, lower latency
  Best for: API behavior, backend logic, data processing

Client-Side: Evaluation in browser/app, instant UI changes without server round-trip
  Best for: UI variations, layout changes, frontend features

Hybrid: Server evaluates flags, passes resolved values to client
  Best for: Security-sensitive flags with UI impact
```

## Targeting Strategies

### Targeting Rule Types

```yaml
flag: new-checkout-experience
default: false

targeting:
  - name: vip-supersede
    priority: 0
    conditions:
      - attribute: userId
        operator: in
        value: ["user-123", "user-456"]
    serve: true

  - name: internal-users
    priority: 1
    conditions:
      - attribute: email
        operator: ends_with
        value: "@ourcompany.com"
    serve: true

  - name: beta-program
    priority: 2
    conditions:
      - attribute: beta_opted_in
        operator: equals
        value: true
    serve: true

  - name: gradual-rollout
    priority: 3
    conditions:
      - attribute: country
        operator: in
        value: ["US", "CA", "GB"]
    serve:
      percentage: 25
      sticky: true
      bucket_by: userId
```

### Progressive Rollout Strategy

```
Phase 1: Internal (Day 1) — @company.com emails, 2-3 days
Phase 2: Dogfood (Day 3) — Beta opt-ins, 3-5 days
Phase 3: Canary (Day 7) — 5% production traffic, 2-3 days
Phase 4: Gradual (Day 10+) — 5% → 10% → 25% → 50% → 100%
  - Increase only when metrics stable, wait 24h between steps
Phase 5: Full Rollout (Day 17+) — 100%, monitor 1 week, then cleanup

Rollback Triggers (any phase):
- Error rate > 2x baseline
- Latency P99 > 50% increase
- Conversion rate drops > 5%
- Action: Disable flag immediately (instant rollback)
```

### Percentage Rollout Implementation

```typescript
function isInRolloutPercentage(flagKey: string, userId: string, percentage: number): boolean {
  const hash = murmurhash3(`${flagKey}:${userId}`);
  const bucket = (hash % 10000) / 100;
  return bucket < percentage;
}

// Properties:
// - Same user always gets same result for a given percentage
// - Increasing percentage only adds users, never removes existing ones
// - Different flags distribute users differently (via flag key in hash)
```

## Experiment Tracking

### A/B Test Configuration

```yaml
experiment:
  name: checkout-redesign
  hypothesis: "New checkout will improve conversion rate by 10%"
  primary_metric: checkout_completion_rate
  secondary_metrics: [average_order_value, time_to_complete_checkout]

  variants:
    - name: control
      weight: 50
    - name: treatment
      weight: 50

  guardrail_metrics:
    - name: error_rate
      threshold: 5
    - name: p99_latency_ms
      threshold: 3000

  sample_size:
    minimum_per_variant: 5000
    estimated_duration: "14 days"

  analysis:
    statistical_method: bayesian
    confidence_level: 0.95
```

### Experiment Results Template

```
### Experiment: Checkout Redesign
Duration: 14 days | Sample: 12,400 users per variant

Primary Metric: Checkout Completion Rate
| Variant   | Users  | Rate  | vs Control              |
|-----------|--------|-------|-------------------------|
| Control   | 12,400 | 28.0% | baseline                |
| Treatment | 12,400 | 31.0% | +3.0pp (+10.7%), p=99.2% |

Guardrail Metrics: Error Rate 1.2% (< 5% threshold) PASS
                   P99 Latency 1850ms (< 3000ms) PASS

Recommendation: SHIP treatment variant.
```

## Flag Lifecycle Management

### Stale Flag Detection

```
Flags become stale when:
- Rollout reached 100% more than 14 days ago
- Experiment concluded more than 7 days ago
- Flag not evaluated in 30 days
- Created 90+ days ago and still in development

Automated workflow:
1. Weekly scan → 2. Slack to owner → 3. Remind after 7 days
4. Escalate to team lead after 14 days → 5. Auto-archive after 30 days
```

### Code Cleanup Checklist

```
Before Removing:
- [ ] Flag at 100% for all environments for 14+ days
- [ ] No incidents related to the flagged feature
- [ ] No other flags depend on this flag

Code Cleanup:
- [ ] Remove flag evaluation calls from application code
- [ ] Remove the "off" code path (old behavior)
- [ ] Remove flag-specific tests, add tests for permanent behavior
- [ ] Remove flag from configuration/dashboard

Verification:
- [ ] All tests pass with flag code removed
- [ ] No references to flag key in codebase
- [ ] Deployment successful after cleanup
```

### Flag Naming Conventions

```
Pattern: <type>-<feature>-<detail>

Release:    enable-new-checkout, enable-search-v2
Experiment: exp-pricing-page-layout, exp-onboarding-flow-v3
Ops:        ops-rate-limit-threshold, ops-cache-ttl-seconds
Kill:       kill-external-api-calls, kill-payment-processing
Permission: perm-advanced-analytics, perm-api-access
```

## Platform Implementation

### Flag Service Data Model

```sql
CREATE TABLE flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    flag_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'inactive',
    owner_team VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_evaluated_at TIMESTAMP WITH TIME ZONE,
    expected_removal_date DATE,
    tags TEXT[]
);

CREATE TABLE flag_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flag_id UUID REFERENCES flags(id),
    environment VARCHAR(50) NOT NULL,
    priority INTEGER NOT NULL,
    conditions JSONB NOT NULL,
    serve_value JSONB NOT NULL,
    enabled BOOLEAN DEFAULT true
);
```

## Best Practices

```
DO:
- Use flags for all production releases
- Set an expected removal date when creating
- Clean up flags within 2 weeks of 100% rollout
- Test both flag-on and flag-off paths
- Use server-side evaluation for sensitive logic

DO NOT:
- Use flags as a long-term configuration system
- Nest flags more than 2 levels deep
- Create flags without an owner
- Store secrets in flag values
- Make critical logic depend on flag service availability
- Create a flag per customer (use targeting rules instead)
```


## Process

1. **Gather information.** Ask the user clarifying questions to understand their specific situation, goals, and constraints
2. **Analyze context.** Review the information provided and identify key factors relevant to feature flag platform
3. **Develop recommendations.** Apply domain expertise to create actionable guidance tailored to the user's needs
4. **Present structured output.** Deliver findings in the output format below with clear next steps
5. **Address follow-ups.** Answer additional questions and refine recommendations based on feedback


## Output Format

```template
## Feature Flag Platform Analysis

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

**Input:** "Help me with feature flag platform for my current situation"

**Output:**

Based on your situation, here is a structured approach to feature flag platform:

1. **Assessment:** Evaluate your current state and identify key areas for improvement
2. **Strategy:** Develop a targeted plan based on best practices
3. **Implementation:** Execute the plan with specific, measurable steps
4. **Review:** Monitor progress and adjust as needed
