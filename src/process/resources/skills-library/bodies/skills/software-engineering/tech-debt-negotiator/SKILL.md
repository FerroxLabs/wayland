---
name: tech-debt-negotiator
description: |
  Technical debt negotiation expertise covering debt identification and quantification, prioritization frameworks, stakeholder communication strategies, payoff planning, ROI calculations, and the art of selling refactoring time to non-technical leadership.
  Use when the user asks about tech debt negotiator, tech debt negotiator best practices, or needs guidance on tech debt negotiator implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "best-practices refactoring guide"
  category: "software-engineering"
  subcategory: "languages-runtimes"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Tech Debt Negotiator

You are an expert at the intersection of technical debt management and organizational communication. Your specialty is not just finding debt, but building the business case to pay it down. Most engineers can identify tech debt. Few can quantify its cost, prioritize it against features, and persuade stakeholders to allocate time for remediation. That is the skill that separates senior engineers from staff engineers.

## The Negotiation Problem

Technical debt discussions fail for predictable reasons:

| Engineer Says | Stakeholder Hears | The Gap |
|--------------|-------------------|---------|
| "We need to refactor the auth module" | "Engineers want to rewrite perfectly working code" | No business impact articulated |
| "This code is terrible" | "Engineers are complaining again" | No cost quantified |
| "We'll have outages if we don't fix this" | "Fear-mongering to avoid feature work" | No evidence or probability attached |
| "We need 3 sprints for tech debt" | "3 sprints of zero value delivered" | No incremental approach proposed |

## Identifying and Categorizing Debt

### The RICE-D Framework for Tech Debt

Adapt the RICE framework specifically for technical debt:

| Factor | Question | Score |
|--------|----------|-------|
| **R**each | How many developers/features does this debt affect? | 1-10 |
| **I**mpact | How much does it slow down each affected area? | 1-5 (Minimal to Blocking) |
| **C**onfidence | How certain are we about the impact estimate? | 0.5-1.0 |
| **E**ffort | How many developer-weeks to remediate? | (denominator) |
| **D**ecay | How fast is this debt getting worse? | 1.0-2.0 multiplier |

```
RICE-D Score = (Reach x Impact x Confidence x Decay) / Effort

Example:
  "Migrate auth from custom JWT to Auth0"
  Reach: 8 (affects every API endpoint and all 4 frontend apps)
  Impact: 3 (moderate slowdown on every auth-related feature)
  Confidence: 0.9 (well-understood problem)
  Effort: 4 weeks
  Decay: 1.5 (security risk grows, more code depends on it monthly)

  Score = (8 x 3 x 0.9 x 1.5) / 4 = 8.1
```

### Debt Discovery Techniques

#### Code Metrics That Signal Debt

```shell
# Cyclomatic complexity (find complex functions)
npx ts-complexity --threshold 15 src/

# Churn analysis (files changed most often = likely debt)
git log --since="6 months ago" --pretty=format: --name-only | sort | uniq -c | sort -rn | head -20

# Coupling analysis (files always changed together)
# If file A and file B change in 80% of the same commits, they're coupled
git log --pretty=format:"%H" --since="6 months ago" | while read commit; do
  git diff-tree --no-commit-id --name-only -r $commit
  echo "---"
done | # pipe to coupling analysis tool

# Code age (old code that's still frequently modified)
git log --diff-filter=M --pretty=format:"%ai %s" -- src/legacy-module/
```

#### Developer Survey Template

Send this quarterly to surface debt that metrics miss:

```markdown
1. What part of the codebase do you dread working in? Why?
2. What task takes you >2x longer than it should? What's blocking?
3. If you had 1 week of uninterrupted refactoring time, what would you fix?
4. Rate your confidence deploying changes to these areas (1-5):
   - [ ] Authentication
   - [ ] Payment processing
   - [ ] User management
   - [ ] Reporting
   - [ ] Notifications
5. What recurring bugs keep coming back? Which module are they in?
```

## Quantifying the Cost

### The Developer Time Tax

This is your most powerful metric. Translate debt into dollars.

```
WEEKLY TAX CALCULATION:

  Hours lost per developer per week due to debt item:
    - Workaround time:     X hours (working around the limitation)
    - Context switching:    Y hours (extra complexity to understand)
    - Bug fixing:           Z hours (bugs caused by the debt)
    - Onboarding overhead:  W hours (amortized across new hires)

  Total weekly tax = (X + Y + Z + W) x number_of_affected_developers
  Annual cost = weekly_tax x 48 weeks x loaded_developer_cost_per_hour

EXAMPLE:
  Monolithic state management causes 3 hours/week/dev of extra work
  Team of 8 developers affected
  Loaded cost: $85/hour

  Annual cost = 3 x 8 x 48 x $85 = $97,920/year
  Remediation cost: 3 developers x 4 weeks x 40 hours x $85 = $40,800

  ROI: ($97,920 - $40,800) / $40,800 = 140% return in first year
```

### Incident Cost Attribution

```
INCIDENT COST FORMULA:

  Direct cost = (engineers_involved x hours_spent x hourly_rate)
              + revenue_lost_during_outage
              + SLA_penalty_payments

  Indirect cost = customer_trust_erosion (hard to quantify, estimate conservatively)

  Attribution: What percentage of this incident was caused by tech debt?
    - Root cause in legacy code: 100% attribution
    - Root cause amplified by debt: 50% attribution
    - Unrelated to debt: 0% attribution

  Track cumulative debt-attributed incident costs over 12 months.
```

### The Feature Delay Multiplier

```
WITHOUT DEBT:
  Feature A estimate: 2 weeks
  Feature B estimate: 3 weeks
  Feature C estimate: 1 week

WITH DEBT (in affected area):
  Feature A actual: 3.5 weeks (1.75x multiplier)
  Feature B actual: 5 weeks   (1.67x multiplier)
  Feature C actual: 2 weeks   (2.0x multiplier)

  Average delay multiplier: 1.8x
  Every feature in this area takes nearly twice as long.

  6-month feature roadmap in this area: 12 features x avg 2 weeks = 24 weeks
  Actual with debt: 24 x 1.8 = 43.2 weeks
  Time lost to debt: 19.2 developer-weeks = $65,280 at $85/hr
```

## Prioritization Frameworks

### The 2x2 Urgency-Severity Matrix

```
                    LOW SEVERITY           HIGH SEVERITY
                    (annoying)             (blocking/risky)
                 ┌────────────────────┬────────────────────┐
HIGH URGENCY     │ Quick Wins         │ Fire Drills        │
(getting worse)  │ Fix during sprint  │ Fix NOW            │
                 │ slack time         │ Stop feature work   │
                 ├────────────────────┼────────────────────┤
LOW URGENCY      │ Backlog            │ Strategic Payoff   │
(stable)         │ Track but don't    │ Plan as a project  │
                 │ prioritize         │ Needs business case │
                 └────────────────────┴────────────────────┘
```

### Interest Rate Model

Think of tech debt like financial debt with compound interest:

```
Debt Item: Untyped API responses (no validation, any-typed everywhere)

Principal: 3 weeks to add proper types and validation
Interest rate: ~15% per quarter (grows as more code depends on untyped data)
Current interest payment: 4 hours/week of debugging type-related bugs

Quarter 1: 3 weeks to fix, 4 hrs/week interest
Quarter 2: 3.5 weeks to fix, 5 hrs/week interest (more code depends on it)
Quarter 3: 4 weeks to fix, 6 hrs/week interest
Quarter 4: 5 weeks to fix, 8 hrs/week interest

Breakeven: If you fix in Q1, you save 4 hrs/week x 48 weeks = 192 hours
           Cost to fix: 120 hours. Net savings: 72 hours (60% ROI in year 1)
```

## Stakeholder Communication

### The One-Pager Template

Present this at planning meetings. One page. No jargon.

```markdown
# Tech Debt: [Descriptive Name]

## Business Impact
- Features in [area] take 1.8x longer than estimated
- 3 production incidents in last 6 months attributed to this
- Onboarding a new developer to this area takes 2 extra weeks

## Cost of Inaction (next 12 months)
- $97,920 in developer productivity loss
- Estimated 2-4 more incidents (based on trend)
- [Specific upcoming feature] will take 6 weeks instead of 3

## Proposed Fix
- [One sentence description]
- Team: 2 developers, 4 weeks
- Cost: $40,800
- First-year ROI: 140%

## Incremental Plan
- Week 1-2: [Specific milestone, feature work continues at 80%]
- Week 3-4: [Specific milestone, feature work resumes fully]
- Rollback plan: [How we revert if it goes wrong]
```

### Negotiation Tactics

**Tactic 1: The 20% Budget**
Negotiate a standing allocation: 20% of sprint capacity goes to tech debt. No approval needed per item. Engineers prioritize within that budget.

**Tactic 2: The Tax Metaphor**
"Every feature in the billing module costs 80% more than it should because of accumulated shortcuts. We're paying a 80% tax on all billing work. A 4-week investment removes that tax permanently."

**Tactic 3: The Risk Register**
Maintain a debt risk register with probability and impact. Present it like any other business risk:

| Debt Item | Probability of Incident (12mo) | Impact | Expected Loss |
|-----------|-------------------------------|--------|---------------|
| No rate limiting on API | 70% | $50K (outage) | $35K |
| Unencrypted PII in logs | 40% | $500K (breach fine) | $200K |
| Single point of failure in auth | 50% | $100K (full outage) | $50K |

**Tactic 4: Attach to Feature Work**
"We need to build Feature X anyway. If we spend an extra 3 days refactoring the module first, Feature X takes 2 weeks instead of 4, and every future feature in that area is faster too."

**Tactic 5: The Burning Platform**
Reserve for genuine emergencies: "We cannot build [critical business initiative] on the current foundation. The options are: fix the foundation (6 weeks) then build the feature (4 weeks), or try to build on the broken foundation (12+ weeks with high failure risk)."

## Payoff Strategies

### The Strangler Fig Pattern

Replace legacy systems incrementally:

```
Phase 1: Build new system alongside old
  - New requests go to new system
  - Old requests still go to old system
  - Both systems coexist

Phase 2: Gradually redirect traffic
  - Feature by feature, move to new system
  - Monitor for regressions
  - Old system handles shrinking traffic

Phase 3: Decommission old system
  - All traffic on new system
  - Old system read-only for reference
  - Finally shut down old system
```

### Boy Scout Rule (Continuous Small Fixes)

```
RULES:
1. Every PR must leave the code better than it found it
2. "Better" means: better names, less duplication, clearer types, added tests
3. Time budget: 15-30 minutes per PR, not more
4. Track improvements with a consistent commit prefix: "chore(debt):"

METRICS:
  - Count "chore(debt):" commits per sprint
  - Measure: are affected areas getting faster or slower to work in?
  - Goal: 3-5 boy scout improvements per developer per sprint
```

### Dedicated Debt Sprints

```
CADENCE: 1 sprint out of every 6 (or 1 week per quarter)

RULES:
  - Team votes on which debt items to tackle
  - Each item must have a measurable "after" metric
  - No feature work during debt sprint (protect the time)
  - Demo the improvements at sprint review (make debt work visible)
  - Celebrate: "We made deployments 3x faster by fixing the pipeline"
```

## Tracking and Reporting

### Tech Debt Dashboard

Track these metrics monthly:

```
KEY METRICS:
  - Debt inventory: number of tracked items by severity
  - Debt cost: estimated annual $ impact of all items
  - Debt velocity: items added vs. items resolved per quarter
  - Feature delay multiplier: average actual/estimate ratio by area
  - Incident attribution: % of incidents caused by known debt
  - Developer satisfaction: quarterly survey score for codebase health

TREND MATTERS MORE THAN ABSOLUTE:
  - Is the delay multiplier going up or down?
  - Are debt-related incidents increasing or decreasing?
  - Is the total estimated cost growing faster than we're paying it down?
```

### ADR Template for Debt Decisions

```markdown
# ADR-XXX: [Accept/Pay Down] [Debt Item Name]

## Status: [Proposed | Accepted | Superseded]

## Context
[Why does this debt exist? What created it?]

## Decision
[Are we paying this down now, accepting it, or deferring?]

## Consequences
- Cost of action: [developer-weeks, risk of regression]
- Cost of inaction: [annual $ impact, risk of incident]
- Timeline: [when will we revisit this decision?]

## Review Date: [6 months from now]
```

## Common Anti-Patterns

1. **The Big Rewrite**: "Let's rewrite the whole thing." This almost always fails. Use strangler fig instead. Rewrites take 2-3x longer than estimated and deliver 0 value until complete.

2. **Silent Debt Accumulation**: Engineers complain informally but never document or quantify the debt. If it is not tracked with numbers, it does not exist to stakeholders.

3. **All-or-Nothing Proposals**: "We need 3 months to fix everything." Break it into 1-2 week increments with measurable outcomes.

4. **Debt as Punishment**: Using debt work as busywork for junior developers. Debt remediation is senior engineering work that requires deep system understanding.

5. **Perfectionism Disguised as Debt Work**: Not all code improvements are debt payoff. Rewriting working code to use a trendier pattern is not debt remediation; it is gold-plating.

## Negotiation Checklist

- [ ] Debt item documented with clear description
- [ ] Business impact quantified in dollars or developer-hours
- [ ] Root cause identified (why did this debt accumulate?)
- [ ] Remediation plan broken into increments under 2 weeks
- [ ] ROI calculated (cost to fix vs. annual cost of living with it)
- [ ] Risk of inaction articulated with probabilities
- [ ] Stakeholder one-pager prepared (no jargon)
- [ ] Success metrics defined (how we know it worked)
- [ ] Rollback plan documented (how we revert if it goes wrong)
- [ ] Follow-up review date set (prevent re-accumulation)

## When to Use

**Use this skill when:**
- Designing or implementing tech debt negotiator solutions
- Reviewing or improving existing tech debt negotiator approaches
- Making architectural or implementation decisions about tech debt negotiator
- Learning tech debt negotiator patterns and best practices
- Troubleshooting tech debt negotiator-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Tech Debt Negotiator Analysis

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

**Input:** "Help me implement tech debt negotiator for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended tech debt negotiator approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When tech debt negotiator must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
