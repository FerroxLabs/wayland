---
name: metrics-framework
description: |
  Builds a product metrics hierarchy with north star metric, L1/L2 supporting metrics, guardrail metrics, and instrumentation guidance using product analytics methodology. Use when the user asks about product metrics, north star metrics, metrics frameworks, product analytics, KPI hierarchies, or measurement strategies.
  Do NOT use for financial KPIs (use financial-kpis), A/B test metrics (use ab-test-design), or marketing analytics (use marketing-analytics-report).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "analysis planning strategy decision-making project-management"
  category: "business-strategy"
  subcategory: "product-management"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---
# Metrics Framework

## When to Use

**Use this skill when:**
- A product manager, founder, or team lead asks to build or redesign a metrics framework for their product -- including net-new frameworks, frameworks that have grown stale, or frameworks inherited from a previous team
- A user needs to identify or validate a North Star Metric (NSM) for their product and is uncertain whether their current candidate metric is actually capturing user value versus revenue signals
- A user wants to decompose a high-level goal into an actionable hierarchy of L1 and L2 metrics that individual teams can own and influence
- A user is experiencing a metrics proliferation problem -- too many dashboards, too many KPIs, no shared understanding of what actually matters -- and needs to consolidate and prioritize
- A user is planning a new product initiative and needs to define success criteria in advance of instrumentation and engineering work, so that measurement is built in from the start rather than bolted on later
- A user is preparing for a product review, board meeting, or OKR planning cycle and needs to establish which metrics represent genuine health versus vanity signals
- A user is building or scaling a data analytics function and needs a canonical metric taxonomy that analysts, engineers, and product managers can all align to

**Do NOT use this skill when:**
- The user needs financial KPIs for board or investor reporting (use `financial-kpis` -- financial frameworks use GAAP-aligned metrics like ARR, EBITDA, and gross margin in ways that differ from product analytics hierarchies)
- The user wants to design a specific A/B test with hypothesis, sample size, and power calculations (use `ab-test-design` -- experiment design is a separate discipline from metric definition)
- The user needs marketing attribution, campaign ROI, or channel-level analytics (use `marketing-analytics-report` -- marketing analytics focuses on top-of-funnel performance against spend, not product value delivery)
- The user is setting company-wide OKRs with objectives, key results, and initiative-level scoring (use `okr-setting` -- OKRs are a goal-setting framework; metrics frameworks are a measurement architecture)
- The user is asking about customer satisfaction research methodology, NPS survey design, or qualitative user research (this is user research, not product analytics)
- The user is asking how to implement a specific analytics tool like Mixpanel, Amplitude, or Segment (this is engineering configuration work, not framework design)

---

## Process

### Step 1: Gather Product and Business Context

Before proposing any metric, establish a complete picture of the product and its strategic context. A metrics framework built on incomplete context will produce misaligned metrics that measure the wrong things with precision.

- Determine **product type** precisely: B2B SaaS (team tool vs. individual tool matters), B2C app, marketplace (one-sided vs. two-sided), e-commerce, developer platform, media/content, or hybrid. The product type determines which metric patterns apply.
- Determine **business model**: pure subscription (per-seat or flat-rate), usage-based billing, transactional (take-rate on GMV), ad-supported, freemium-to-paid, or hybrid. The monetization model determines where the L1 monetization metric lives and how it connects to the NSM.
- Determine **product lifecycle stage**:
  - Pre-product-market-fit: focus on activation and retention signals above all else; acquisition metrics are premature
  - Growth stage (post-PMF): focus on efficient acquisition, activation, and expansion
  - Maturity stage: focus on retention depth, expansion revenue, and competitive differentiation metrics
  - Decline or repositioning: focus on retention of high-value cohorts and identifying expansion vectors
- Identify the **core value exchange**: What specific transformation does the product create for the user? Not "we help teams collaborate" but "teams using our product ship projects 30% faster than without it." The NSM must be the closest measurable proxy to this specific transformation.
- Ask for **existing metrics and their problems**: What are they tracking now? Why is it insufficient? Are metrics fragmented across tools? Are there conflicting metrics across teams? Understanding current failure modes prevents reinventing the same problems.
- Identify **key business questions** the metrics must answer: "Are we retaining teams past 90 days?" is a question. "Are we growing?" is not specific enough to generate a useful metric.
- Clarify **team structure and ownership capacity**: A 5-person startup cannot own 20 metrics. A 200-person product organization can have metrics tiered across squads. Calibrate the framework to the organization's ability to act on it.

### Step 2: Identify and Validate the North Star Metric

The North Star Metric (NSM) is the single metric that best represents the rate at which your product is delivering its core value to users. It is not the most important business metric -- that is revenue. It is the metric that, if consistently moving in the right direction, most reliably predicts long-term business health.

- Apply the **NSM validation test**: Ask five questions. If all five are "yes," the candidate NSM is valid:
  1. Does it measure user value, not just business extraction? (Revenue fails this test. "Tasks completed" passes.)
  2. Is it a leading indicator of retention and revenue, not a lagging output of them?
  3. Can product, engineering, and design teams directly influence it through their work?
  4. Would the entire company, from CEO to support, understand what it means without explanation?
  5. If this metric increases consistently while all guardrails hold, would the business be sustainably healthy in 12 months?
- Recognize **common NSM anti-patterns** and flag them explicitly:
  - **Revenue as NSM**: Revenue is a lagging indicator of value delivery and is influenced by pricing, sales, and marketing factors outside the product team's control. It cannot be an NSM.
  - **Registered users or total signups**: These are acquisition metrics. An empty stadium with 50,000 seats sold is not a sign of a healthy product.
  - **Page views or sessions**: These measure activity, not value. A confused user generates many page views. An efficient user generates fewer.
  - **App store ratings**: These are lagged, biased, and not actionable enough for operational use.
  - **DAU/MAU ratio (stickiness)** as NSM: Stickiness is an engagement metric, not a value delivery metric. It belongs at L1.
- Apply **product-type-specific NSM patterns**:
  - **B2B SaaS (team collaboration, project management, CRM)**: "Teams performing core workflow action weekly" -- not individual users, because B2B value is organizational, not individual. Example: "Teams with 3+ members who updated a project record in the last 7 days."
  - **B2B SaaS (individual productivity tool)**: "Users completing their core job-to-be-done weekly." Example for a writing tool: "Documents published per active user per week."
  - **Two-sided marketplace (e-commerce, services, freelance)**: "Successful transactions completed per week" -- because this is the only event that creates value for both sides simultaneously. GMV is acceptable if average transaction value is relatively stable.
  - **Consumer social app**: "Connected users who exchanged meaningful content in last 7 days" -- connection count alone is vanity; exchange is value.
  - **Media/content platform**: "Users who consumed X minutes of content in last 7 days" where X is a threshold validated by retention data (users who hit this threshold retain significantly better than those who do not).
  - **Developer/API platform**: "Developers with at least one successful API call in last 7 days." API call volume is too noisy; the "at least one" framing captures active developer retention.
  - **E-commerce**: "Repeat purchasers per rolling 30 days" -- first purchase is acquisition, repeat purchase is product value validated.
  - **Freemium SaaS**: "Free users who reached the value threshold in last 14 days" -- because conversion to paid follows reliably from this threshold.
- Test the NSM candidate against **the bowling pin question**: "If this metric grew 20% next quarter and nothing else changed, would we feel genuinely confident about the product?" If the team would still feel uncertain or would immediately ask "but what about X?", then X should probably be the NSM, or the NSM needs to be redefined.
- For **stage-specific NSM selection**: Early-stage products (fewer than 1,000 active users) often cannot compute statistically stable weekly metrics. In these cases, use monthly cadence and note explicitly that the NSM will be revisited when the user base reaches sufficient scale for weekly measurement.

### Step 3: Build the L1 Metrics Layer

L1 metrics are the direct drivers of the NSM. They decompose the NSM into components that different teams can own and optimize independently. The L1 layer should contain 3-5 metrics, not more.

- Use the **AARRR decomposition** (Acquisition, Activation, Retention, Revenue, Referral -- Pirate Metrics, Dave McClure) as a starting scaffold, but adapt it to the specific product. Not all products need all five. B2B products rarely have meaningful referral loops; developer tools may have strong referral effects.
- Alternatively, use the **value delivery chain** decomposition for products where AARRR does not fit: How does a new user become aware they need the product? How do they first experience value? How do they integrate the product into their workflow? How do they deepen their usage? How does deep usage convert to retained, paying users?
- For each L1 metric, define:
  - **The metric name** (simple, unambiguous, team-memorable)
  - **The exact formula** (no ambiguity about numerator and denominator, time window, user scope)
  - **The owning team** (acquisition typically owned by growth or marketing+product; activation and engagement by product; retention by product and customer success; monetization by product and revenue)
  - **The direction of relationship to the NSM** (does increasing this L1 metric directly increase the NSM? If not, it is not an L1 metric)
- Common L1 framework for **B2B SaaS**:
  - New team signups per month (Acquisition)
  - Activation rate: % of new teams completing the "aha moment" action within 14 days (Activation)
  - Core action frequency: average times per week the core workflow is performed by active teams (Engagement)
  - 90-day team retention rate (Retention)
  - Expansion: average seat count per team after 90 days, or net revenue retention if data is available (Monetization/Expansion)
- Common L1 framework for **consumer app**:
  - New installs from organic and paid channels (Acquisition)
  - Day-1 and Day-7 retention rates as proxies for activation (because consumer apps have an "aha moment" that must happen within the first session)
  - Weekly active users performing the core action (Engagement)
  - 30-day and 90-day retention curves (Retention)
  - If monetized: conversion to paid tier, or ARPU for ad-supported products (Monetization)
- Common L1 framework for **marketplace**:
  - New supply-side listings or providers activated per week (Supply Acquisition)
  - New demand-side users making first purchase per week (Demand Acquisition)
  - Listing quality rate: % of listings that receive at least one inquiry (Supply Quality)
  - Transaction conversion rate: % of sessions that result in a completed transaction (Demand Conversion)
  - Repeat transaction rate: % of buyers who transact again within 60 days (Retention)
- Flag **L1 metric conflicts** proactively: If acquisition is pushing volume while activation remains low, the metrics are telling contradictory stories. An effective L1 framework surfaces these tensions rather than hiding them.

### Step 4: Build the L2 Metrics Layer

L2 metrics are the granular, feature-level drivers that explain changes in L1 metrics. They are what individual product squads track day-to-day. They should be more volatile, more specific, and more directly responsive to product changes than L1 metrics.

- For each L1 metric, identify **2-4 L2 metrics** that explain variance in that L1. If the L1 metric changes unexpectedly, the L2 metrics should immediately reveal why.
- L2 metrics for **Activation (B2B SaaS)**:
  - Time from signup to first core action (median and P90 -- both matter because the tail reveals friction for the slowest users)
  - Onboarding flow completion rate (step-by-step funnel, not just final completion)
  - Template or guided flow adoption in first session (binary: used or not)
  - Second team member invited within 72 hours (because B2B tools are network goods -- single-user adoption is fragile)
- L2 metrics for **Engagement (B2B SaaS)**:
  - Feature breadth score: average number of distinct features used by active teams per month
  - Core action streak: percentage of active teams who performed the core action in 3 or more of the last 4 weeks (habit formation signal)
  - Collaboration events: comments, @mentions, file shares per active team per week (depth of team integration)
  - Mobile vs. desktop usage split (important for workflow integration -- if users need mobile access and it is low, that is an engagement ceiling)
- L2 metrics for **Retention (B2B SaaS)**:
  - Churn by cohort size: do larger teams churn less? (If yes, expansion is the priority retention lever)
  - Churn by activation status: what is the 90-day retention rate for activated vs. non-activated teams? (This quantifies the activation-retention link)
  - Resurrection rate: percentage of previously churned teams who become active again within 90 days
  - Last-seen distribution: what % of "active" teams last performed the core action 2+ weeks ago? (Early churn warning signal)
- L2 metrics for **Acquisition**:
  - Signup conversion rate by channel (organic search, paid, referral, direct -- broken out separately)
  - Time from ad click or landing page visit to account creation (funnel timing)
  - Signup-to-trial activation rate within 24 hours (speed of first value)
  - Invite virality coefficient: new signups generated per existing user per month (k-factor proxy)

### Step 5: Define Guardrail Metrics

Guardrail metrics are constraints, not goals. They define the boundaries within which optimization is safe. Every experiment and every product change must be evaluated against guardrails in addition to the target metric.

- Guardrails have **thresholds, not targets**. "Page load time P95 must remain below 3 seconds" is a guardrail. "Improve page load time to 1.5 seconds" is an optimization goal and belongs in a sprint or OKR, not a guardrail.
- Establish guardrails in **four categories**:
  - **Technical performance**: P95 page load time (web: < 3 seconds; mobile: < 2 seconds), API error rate (< 0.5%), uptime (>99.5% for SaaS), mobile crash-free session rate (> 99%)
  - **User experience quality**: Support ticket volume per active user per month (threshold set based on current baseline, not industry average -- set at 1.5x current rate as the breach threshold), NPS trend (guard against a declining trend over 2 consecutive quarters, not a specific score), task abandonment rate (flag if it exceeds 15% on any core workflow)
  - **Business health**: Gross margin floor (industry-specific -- for SaaS, guard below 65%; for marketplace, guard below 20% take-rate floor), CAC payback period ceiling (12 months for early-stage, 18 months for growth-stage -- beyond this, acquisition efficiency has eroded)
  - **Ethical and fairness guardrails** (frequently omitted but critical): Engagement time caps (for consumer apps, guard against addictive loops by monitoring if a segment of users exceeds 3x the median session time), notification unsubscribe rate (guard above 15% monthly -- signals spam-level communication)
- For each guardrail, define:
  - The specific threshold value
  - The measurement window (P95 of all requests in rolling 24 hours; not a daily average, which masks spikes)
  - What action is triggered if the threshold is breached (release halt, incident response, team alert)
  - Who is responsible for resolving a breach
- **Never set fewer than 4 guardrail metrics.** A framework with only target metrics and no guardrails incentivizes local optimization at the expense of overall product health. This is the "engagement at the cost of satisfaction" failure mode.

### Step 6: Define the Metrics Map (Hierarchy Visualization)

A metrics framework that exists only in a spreadsheet will not be used. The map creates a shared mental model across the organization.

- Present the hierarchy as a tree: NSM at the root, L1 metrics as first-level branches, L2 metrics as second-level leaves, guardrails as a separate row below the tree (not part of the optimization hierarchy).
- For each connection in the tree, note the **type of relationship**:
  - Multiplicative: NSM = L1a × L1b (e.g., NSM = Weekly Active Teams = New Teams Acquired × Activation Rate × Retention Rate, approximately)
  - Additive: NSM = L1a + L1b (e.g., for multi-product platforms, NSM may be the sum of active users across products)
  - Correlative (not formulaic): L1 and NSM move together but are not algebraically linked -- document this explicitly to prevent false assumptions
- Annotate each L1 metric with its **owning team** and the **current health signal** (green/yellow/red against target). This makes the map actionable in team reviews, not just decorative.
- Include a **diagnostic protocol**: "If the NSM declines, check L1 metrics in this order: Retention first (most impactful for SaaS), then Activation, then Acquisition." This prevents teams from optimizing acquisition when the real problem is churn.

### Step 7: Define Instrumentation and Data Infrastructure Plan

A metric without a defined instrumentation plan is a hypothesis, not a metric. This step makes the framework operationally real.

- For each metric in the framework (NSM, all L1, all L2, all guardrails), specify:
  - **Data source**: Product analytics event stream (Mixpanel, Amplitude, PostHog), operational database query, billing system, CRM, support platform, mobile SDK, or a computed field in the data warehouse
  - **Event or query definition**: The exact event name and properties, or the SQL logic. "Users who performed the `task_created` event at least once in the last 7 days, grouped by team_id where team member count >= 3" is a definition. "Active users" is not.
  - **Update cadence**: Real-time (stream-processed -- for crash rate, API error rate), daily (for most product metrics -- overnight batch jobs), weekly (for cohort retention curves -- these require full-week data windows), monthly (for LTV, NRR, expansion metrics)
  - **Dashboard location and owner**: Which dashboard, which page, and which person is responsible for reviewing and acting on it
  - **Alert configuration**: Absolute threshold alerts (crash rate exceeds 1%) and anomaly detection alerts (metric drops more than 2 standard deviations from the rolling 28-day average within a 24-hour window)
  - **Instrumentation status**: Is this metric already being tracked? Tracked but unreliably? Not tracked and needs new event instrumentation? Not tracked and requires a data pipeline build?
- Flag **instrumentation debt** explicitly: If more than 30% of the metrics in the framework require new instrumentation, prioritize a phased implementation. Phase 1: NSM and L1 metrics. Phase 2: L2 metrics. Phase 3: full guardrail automation.
- Specify **metric freshness requirements**: A guardrail for API error rate needs real-time alerting. A retention cohort analysis can run nightly. Mismatched freshness (running a retention cohort in real-time, wasting compute) or insufficient freshness (seeing a crash rate spike 24 hours after it occurred) are both instrumentation failures.

### Step 8: Create the Framework Review Protocol

A metrics framework that is not reviewed and updated becomes cargo cult measurement -- teams report numbers without questioning whether those numbers still represent reality.

- Specify a **quarterly review cadence** for the full framework, with a specific review agenda:
  - Has the product's core value proposition changed? Does the NSM still capture it?
  - Have any L2 metrics become so well-understood that they are now L1 candidates?
  - Are any guardrails being consistently breached without corrective action? If so, the threshold may be wrong.
  - Are any L1 or L2 metrics never discussed in team reviews? If so, they should be deprecated.
- Establish a **metric deprecation policy**: A metric that has not been referenced in a team decision in two consecutive quarters should be marked for review and likely removed.
- Note **leading indicators of framework obsolescence**: a product launch into a new user segment, a change in monetization model, a post-acquisition product integration, or a competitive shift that changes the core user behavior being measured.

---

## Output Format

```
## Product Metrics Framework: [Product Name]

**Product Type:** [SaaS / Marketplace / Consumer App / Developer Platform / E-commerce]
**Business Model:** [Subscription / Usage-based / Transactional / Ad-supported / Freemium]
**Lifecycle Stage:** [Pre-PMF / Growth / Maturity]
**Framework Version:** [v1.0] | **Last Updated:** [Date] | **Next Review:** [Date]

---

### North Star Metric

| Field              | Detail                                                                 |
|--------------------|------------------------------------------------------------------------|
| **Metric Name**    | [Short, memorable name]                                               |
| **Definition**     | [Exact definition: who counts, what action, what time window]         |
| **Formula**        | [Explicit calculation -- numerator, denominator, filters]             |
| **Data Source**    | [Tool and event name]                                                 |
| **Current Value**  | [Baseline with date]                                                  |
| **Target**         | [Target value and timeframe]                                          |
| **Rationale**      | [Why this metric proxies core user value delivery; what it excludes]  |
| **NSM Test**       | [Confirmation that all 5 NSM validation criteria are satisfied]       |

---

### L1 Metrics (Team-Level Drivers)

| L1 Metric        | Exact Definition                                           | Formula                              | Owner          | Current   | Target    | NSM Relationship        |
|------------------|------------------------------------------------------------|--------------------------------------|----------------|-----------|-----------|-------------------------|
| [Metric name]    | [Who, what action, what time window]                       | [Numerator / Denominator or count]   | [Team name]    | [Value]   | [Value]   | [Multiplicative/Additive/Correlative] |
| [Metric name]    | [Who, what action, what time window]                       | [Numerator / Denominator or count]   | [Team name]    | [Value]   | [Value]   | [Type]                  |
| [Metric name]    | [Who, what action, what time window]                       | [Numerator / Denominator or count]   | [Team name]    | [Value]   | [Value]   | [Type]                  |
| [Metric name]    | [Who, what action, what time window]                       | [Numerator / Denominator or count]   | [Team name]    | [Value]   | [Value]   | [Type]                  |

---

### L2 Metrics (Feature-Level Drivers)

**[L1 Metric: Activation]**
| L2 Metric                     | Exact Definition                                                 | Current   | Target    | Data Source         | Input/Output |
|-------------------------------|------------------------------------------------------------------|-----------|-----------|---------------------|--------------|
| [Metric name]                 | [Exact formula or query logic]                                   | [Value]   | [Value]   | [Tool/event name]   | [Input]      |
| [Metric name]                 | [Exact formula or query logic]                                   | [Value]   | [Value]   | [Tool/event name]   | [Output]     |

**[L1 Metric: Engagement]**
| L2 Metric                     | Exact Definition                                                 | Current   | Target    | Data Source         | Input/Output |
|-------------------------------|------------------------------------------------------------------|-----------|-----------|---------------------|--------------|
| [Metric name]                 | [Exact formula or query logic]                                   | [Value]   | [Value]   | [Tool/event name]   | [Input]      |

**[L1 Metric: Retention]**
| L2 Metric                     | Exact Definition                                                 | Current   | Target    | Data Source         | Input/Output |
|-------------------------------|------------------------------------------------------------------|-----------|-----------|---------------------|--------------|
| [Metric name]                 | [Exact formula or query logic]                                   | [Value]   | [Value]   | [Tool/event name]   | [Input]      |

*(Repeat section for each L1 metric)*

---

### Guardrail Metrics

| Category        | Guardrail Metric             | Exact Definition                                        | Threshold           | Measurement Window     | Owner          | Breach Response                                 |
|-----------------|------------------------------|---------------------------------------------------------|---------------------|------------------------|----------------|-------------------------------------------------|
| Performance     | [Metric name]                | [P95 latency / error rate / uptime definition]          | [< X or > Y]        | [Rolling 24h / 7d]     | [Team]         | [Specific action: halt release, alert, review]  |
| Quality         | [Metric name]                | [Support tickets per active user / NPS trend]           | [Threshold]         | [Window]               | [Team]         | [Action]                                        |
| Business        | [Metric name]                | [Gross margin / CAC payback]                            | [Floor/ceiling]     | [Monthly]              | [Team]         | [Action]                                        |
| Experience      | [Metric name]                | [Abandonment rate on core workflow]                     | [< X%]              | [Rolling 7d]           | [Team]         | [Action]                                        |

---

### Instrumentation Plan

| Metric           | Type     | Data Source           | Event / Query Definition                              | Freshness    | Dashboard       | Alert Condition                        | Instrumentation Status  |
|------------------|----------|-----------------------|-------------------------------------------------------|--------------|-----------------|----------------------------------------|-------------------------|
| [NSM]            | NSM      | [Tool]                | [Exact event + filter logic]                          | Daily        | [Link/name]     | [< -10% vs. prior 7d average]          | [Live / Needs build]    |
| [L1 metric]      | L1       | [Tool]                | [Exact definition]                                    | Daily        | [Location]      | [Condition]                            | [Status]                |
| [L2 metric]      | L2       | [Tool]                | [Exact definition]                                    | Daily/Weekly | [Location]      | [Condition]                            | [Status]                |
| [Guardrail]      | Guardrail| [Tool]                | [Exact definition]                                    | Real-time    | [Location]      | [Threshold breach]                     | [Status]                |

---

### Metrics Map

```
                          [NORTH STAR METRIC]
                    /              |               \
          [Acquisition]      [Retention]       [Engagement]
          /       \          /        \          /        \
      [L2-a]   [L2-b]   [L2-c]    [L2-d]   [L2-e]    [L2-f]

NSM Relationship Type: [Acquisition × Activation Rate × Retention Rate ≈ NSM]

GUARDRAILS (Constraints -- not optimization targets):
┌────────────────────────────────────────────────────────────────┐
│ Performance: [Threshold] | Quality: [Threshold]                │
│ Business: [Threshold]    | Experience: [Threshold]             │
└────────────────────────────────────────────────────────────────┘
```

---

### Diagnostic Protocol

**If NSM declines:**
1. Check [Retention first, or specify product-appropriate order] -- most common cause
2. If Retention is stable, check [Activation] -- is a recent cohort failing to activate?
3. If Activation is stable, check [Acquisition] -- is volume declining?
4. Cross-check guardrails -- is a technical or quality issue suppressing engagement?

**Review Schedule:**
- Weekly: NSM + L1 metrics in team review
- Monthly: Full L1 + L2 review with cohort breakdown
- Quarterly: Full framework review -- NSM validity, L1/L2 relevance, guardrail calibration
```

---

## Rules

1. **Define exactly one North Star Metric.** If someone insists on two NSMs -- "revenue AND engagement" -- explain that this means neither has been chosen. A framework with two NSMs forces teams to make trade-offs without clarity. All supporting metrics go into L1. Revenue belongs in L1 or guardrails, not as an NSM for a product team.

2. **Every metric must have an explicit formula with a defined time window, user scope, and denominator.** "Engagement rate" is not a metric. "Teams with 3+ distinct members who performed the `project_updated` event at least once in a rolling 7-day window, as a percentage of all teams with 3+ members who have been active in the last 30 days" is a metric. Ambiguous metric definitions create phantom alignment -- teams think they agree on a number while calculating it differently.

3. **Never exceed 5 L1 metrics.** More than 5 L1 metrics indicates that the team has not done the hard work of prioritization. Each additional L1 metric dilutes team attention. If more than 5 candidates exist, evaluate each against its causal relationship to the NSM and retain only the strongest drivers.

4. **Distinguish input metrics from output metrics and label them.** Output metrics (retention rate, NSM) reflect results of team decisions. Input metrics (onboarding completion rate, template usage in first session) are things teams can directly change through product work. Teams should track both but hold themselves accountable primarily to input metrics in sprint-level work, and output metrics in quarterly planning. Conflating the two creates accountability gaps.

5. **Guardrails must have breach response protocols, not just thresholds.** A guardrail metric without a defined response is a warning light with no action attached. Every guardrail must specify: who is notified, what is paused, and what investigation is triggered when the threshold is breached. For performance guardrails, this typically means a release freeze. For quality guardrails, it typically means a support escalation review.

6. **Never use rate metrics without specifying the denominator population precisely.** Activation rate calculated as "activations / signups (all time)" produces a meaningless cumulative number. Activation rate as "teams who completed the core activation event within 14 days of signup / all teams who signed up in the same 14-day window" is a cohort-correct metric. Cohort-correct denominators are mandatory for all rate metrics.

7. **Segment L2 metrics by user cohort before drawing conclusions.** An L2 metric like "time to first core action" has a median that may look acceptable while hiding a bimodal distribution: 60% of users convert in 5 minutes, 40% never convert. Always check P50, P75, and P90 for funnel and time-based L2 metrics before concluding the metric is healthy.

8. **Limit the total framework to 20 metrics maximum (1 NSM + 4-5 L1 + 8-12 L2 + 4-6 guardrails).** Beyond 20, the framework is a data dictionary, not a decision tool. Organizations that track 60+ metrics cannot prioritize, cannot diagnose, and cannot act. If the user wants to track more, help them build a separate "diagnostic library" that supplements the core framework but is not part of the operational hierarchy.

9. **Validate that each L1 metric is independently owned.** An L1 metric that is "everyone's responsibility" is no one's responsibility. If two L1 metrics would be owned by the same team, evaluate whether they should be collapsed into one more-precise metric or whether the team structure needs to reflect the metric separation.

10. **Require instrumentation confirmation before publishing a metric.** A metric should not appear in a framework document as "current value: unknown." Either find a way to measure it and establish a baseline before the framework launch, or explicitly mark it as "Phase 2 -- requires instrumentation" with a timeline. Frameworks with unmeasured metrics create false confidence that the full picture is understood.

11. **Do not use vanity metrics as guardrails to make them feel important.** App store rating, press mentions, and LinkedIn followers are not guardrail metrics. They are not actionable, not precise, and do not constrain product decisions in a meaningful way. Guardrails must be metrics that a product or engineering team can directly affect within a sprint cycle.

12. **When the product is pre-PMF, explicitly label the NSM as provisional.** Pre-PMF NSMs are hypotheses about what will matter. They should be reviewed on a 60-day cycle, not quarterly, because the product's core value proposition may pivot. Mark the entire framework "provisional" until the product has demonstrated consistent retention in at least three consecutive cohorts.

---

## Edge Cases

### Pre-Launch or Pre-PMF Product
The NSM cannot be computed because there are no users. Do not fabricate a framework that implies measurement exists where it does not.

- Define a **proxy NSM** based on the most specific leading behavior that beta users exhibit that the team believes correlates with long-term value delivery. For a B2B tool in closed beta with 50 teams: "Teams who voluntarily return to the product without a prompt within 7 days of first use."
- Build the L1/L2 layer entirely around **activation and early engagement signals** -- retention cohorts cannot be computed with fewer than 200 users.
- Mark the full framework as **provisional v0.1** with an explicit trigger for review: "This framework will be revisited 90 days after public launch or when the active user base reaches 500 units."
- Include a **PMF signal tracker** as a supplemental section: Sean Ellis PMF survey score ("How disappointed would you be if this product disappeared?" -- target >40% saying "very disappointed"), alongside Net Promoter Score from the beta cohort. These are not official framework metrics but inform when the framework should be formalized.

### Two-Sided Marketplace with Misaligned Supply and Demand Growth
Marketplaces have two user populations whose health metrics can diverge. A single NSM (completed transactions) will drop even if only one side of the market has a problem.

- Build **parallel L1 frameworks** for supply and demand, each reporting up to the shared NSM.
- Add a **marketplace balance guardrail**: the ratio of supply-side listings to demand-side active buyers should remain within a defined range (e.g., 2:1 to 8:1 listings per buyer -- category-specific). Both sides growing together is healthy; imbalance predicts either supply scarcity friction or supply excess waste.
- Track **fill rate** (demand requests that result in a completed transaction) as a separate L1 metric that captures the efficiency of supply-demand matching, independent of volume.
- Distinguish between **supply-constrained** and **demand-constrained** states: If fill rate is high but transaction volume is low, the problem is demand acquisition. If fill rate is low, the problem is supply quality or matching algorithm. The diagnostic protocol must explicitly route to the correct side.

### Mature Product with Flat or Declining Growth
An NSM designed for a growth-stage product often stalls as the product matures. New user acquisition slows because the addressable market is partially penetrated, but that does not mean the product is unhealthy.

- Shift the NSM from **growth-oriented** (new users, new teams) to **value-depth-oriented**: "Teams using 3+ product modules weekly" or "Users with a workflow integration active" -- metrics that capture embedded, habitual use rather than new acquisition.
- Introduce **Net Revenue Retention (NRR)** or **Gross Revenue Retention (GRR)** at L1 (not as the NSM, but as the most important L1 metric) because in a mature product, retaining and expanding existing customers creates more value than acquiring new ones at potentially declining margins.
- Add **competitive differentiation metrics** as new L2 elements: feature adoption rates for capabilities that exist only in this product, or user behavior that competitors cannot replicate.
- If the product is approaching decline: the framework should explicitly flag this and shift attention to **segmentation metrics** -- identifying which user cohorts remain highly engaged versus which are churning, so the business can decide whether to invest in retention, repositioning, or sunset.

### Developer Platform or API Product
Developer behavior metrics differ fundamentally from consumer or business user metrics. Developers evaluate products technically before committing, have long evaluation windows, and are extremely sensitive to reliability and documentation quality.

- The NSM should be **"developers with at least one successful API call in the last 7 days"** rather than API call volume (which one power user can inflate) or registered developers (which includes inactive evaluators).
- L1 metrics must include **time to first successful API call (TTFA)** as the activation metric -- this is the developer equivalent of the aha moment and is the single strongest predictor of developer retention. Benchmark: best-in-class developer platforms achieve TTFA under 15 minutes. If TTFA exceeds 45 minutes, the onboarding funnel needs architectural redesign, not incremental improvements.
- L2 metrics should include **documentation engagement**: which reference pages correlate most strongly with successful API calls? This is an unusual metric for non-developer products but is a primary growth lever for platforms.
- Guardrails are unusually strict: API P99 latency (not just P95), error rate, and uptime are existential metrics for developer platforms. A developer whose integration fails silently will churn without filing a support ticket. Set error rate guardrail at < 0.1% (not 0.5%), and P99 latency at < 500ms for synchronous endpoints.

### Product with Offline or Delayed Value Delivery (Health Tech, Education, Professional Certification)
The core value of the product -- improved health outcomes, learning achievement, professional advancement -- cannot be measured in-product on a weekly cadence. This creates a dangerous gap where teams optimize for in-product engagement proxies while the actual value delivery is unmeasured.

- Use a **two-tier NSM structure**: a **lagging outcome NSM** (measured periodically via survey, exam score, health assessment -- e.g., "% of active users who report skill improvement after 90 days") and a **leading proxy NSM** (the in-product behavior most strongly correlated with the lagging outcome -- e.g., "users who completed at least 3 practice sessions in the last 7 days").
- Document the **empirical relationship between proxy NSM and outcome NSM** explicitly, including the correlation coefficient and the time lag. If this relationship has not been empirically validated, flag it as an assumption and build a validation study into the roadmap.
- Add a **proxy validity guardrail**: if the correlation between the proxy NSM and the lagging outcome NSM degrades by more than a defined threshold across consecutive cohorts, the proxy NSM should be replaced. This prevents teams from optimizing a proxy metric that has decoupled from the actual outcome.
- Avoid using **time-on-product as an engagement metric** for these product types. Spending more time on an educational platform is not inherently good if the time is not producing learning. Use **completion events** and **assessment performance** instead.

### Post-Acquisition Integration of Two Products
After a merger or acquisition, two product teams often bring incompatible metrics frameworks. Teams fight about which NSM to use, whether to report combined or separate metrics, and how to attribute users who use both products.

- In the short term (first 6 months post-acquisition): **run parallel frameworks** for each product, mapped to their own NSMs. Do not force artificial consolidation before the integration architecture is defined.
- Define a **joint NSM** only after you can answer: do users who use both products retain significantly better than users of either product alone? If yes, the joint NSM should capture cross-product engagement. If no, the products serve independent value propositions and should retain separate NSMs.
- Add a **cannibalization guardrail**: track whether user adoption of the acquired product's key feature causes a decline in the corresponding feature usage in the acquiring product. This is an M&A-specific edge case that can produce misleading aggregate metrics.

---

## Example

**Input:**
"I need a metrics framework for our B2B project management SaaS. We have 2,000 teams on the platform. Our north star is probably something about active teams, but we haven't defined it precisely. The big problem is that teams sign up -- we're getting 200 new teams a month -- but 60% of them don't come back after the first month. Our L1 metrics are basically just signups and monthly active users but nobody agrees on what 'active' means. We don't have guardrails at all."

---

**Output:**

## Product Metrics Framework: ProjectFlow (B2B Project Management SaaS)

**Product Type:** B2B SaaS -- Team Collaboration Tool
**Business Model:** Per-seat subscription with freemium entry tier
**Lifecycle Stage:** Growth (post-PMF, scaling phase)
**Framework Version:** v1.0 | **Last Updated:** Current Quarter | **Next Review:** End of Next Quarter

---

### North Star Metric

| Field              | Detail |
|--------------------|--------|
| **Metric Name**    | Weekly Engaged Teams (WET) |
| **Definition**     | Teams in which at least 3 distinct members performed the `task_updated` or `comment_posted` event in a rolling 7-day window |
| **Formula**        | COUNT(DISTINCT team_id WHERE member_event_count >= 3 AND event_date >= TODAY - 7 AND event_type IN ('task_updated', 'comment_posted')) |
| **Data Source**    | Amplitude -- `task_updated` and `comment_posted` event stream, joined to teams table |
| **Current Value**  | 820 teams (41% of 2,000 total teams) |
| **Target**         | 1,300 teams (65% of current base) within 2 quarters |
| **Rationale**      | Captures team-level value delivery (collaborative use, not solo use), requires recurring behavior (7-day window excludes one-time users), requires multi-member engagement (a team using the tool together is the core value proposition). Excludes single-user teams to prevent inflation from trial accounts. Revenue and seat count are excluded because they lag this metric by 30-90 days. |
| **NSM Test**       | (1) Measures user value, not business extraction -- yes. (2) Leads retention and expansion -- yes: internal analysis shows 90-day retention rate for teams that reach WET status within 14 days of signup is 78% vs. 22% for teams that do not. (3) Influenced by product teams -- yes: onboarding, feature adoption, and engagement flows all directly affect it. (4) Universally understandable -- yes. (5) If it grows while guardrails hold, is the business sustainably healthy? -- yes. |

---

### L1 Metrics

| L1 Metric            | Exact Definition                                                                                           | Formula                                                                          | Owner           | Current        | Target              | NSM Relationship |
|----------------------|------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------|-----------------|----------------|---------------------|------------------|
| New Team Acquisition | Teams completing account setup (team created + at least 1 non-admin member invited) per calendar month    | COUNT(team_id WHERE setup_completed = TRUE AND month = reporting_month)           | Growth/Product  | 200 teams/mo   | 250 teams/mo (Q3)   | Additive input   |
| Activation Rate      | % of new teams (from same month cohort) that become WET within 14 days of signup                           | WET_within_14d / new_teams_in_cohort                                             | Product (Onboarding squad) | 28%      | 50% (Q3)            | Multiplicative   |
| Engagement Depth     | Median tasks updated per WET team per rolling 7-day window                                                 | MEDIAN(task_updated_count WHERE team IS WET AND window = last 7d)                | Product (Core squad) | 18 tasks/team/wk | 28 tasks/team/wk | Correlative      |
| 90-Day Team Retention | % of teams that became WET in a given month cohort and are still WET 90 days later                        | WET_at_day90 / WET_at_day1 (same cohort)                                         | Product + CS    | 38%            | 60% (Q4)            | Multiplicative   |
| Seat Expansion       | Average seat count per team after 90 days on platform                                                      | AVG(seat_count WHERE team_age_days >= 90)                                         | Revenue/Product | 4.1 seats      | 6.5 seats (Q4)      | Correlative      |

**Retention note**: The stated 60% first-month churn (meaning 40% first-month retention) is confirmed by the 38% 90-day WET retention rate above. This is the primary lever. Acquisition is not the constraint -- 200 new teams/month is reasonable. The constraint is activation and retention.

---

### L2 Metrics

**Under Activation Rate (28% -- priority focus)**

| L2 Metric                          | Exact Definition                                                                                          | Current     | Target     | Data Source                  | Type   |
|------------------------------------|-----------------------------------------------------------------------------------------------------------|-------------|------------|------------------------------|--------|
| Time to First Task Creation (P50)  | Median minutes from account setup completion to first `task_created` event, new teams in last 30d         | 22 min      | 8 min      | Amplitude -- `task_created`  | Input  |
| Time to First Task Creation (P90)  | P90 minutes to first `task_created` -- reveals tail friction                                              | 4.2 hrs     | 45 min     | Amplitude -- `task_created`  | Input  |
| Onboarding Flow Completion Rate    | % of new teams who complete all 5 onboarding checklist steps within 48h of signup                         | 31%         | 60%        | Amplitude -- `onboarding_step_completed` | Input |
| Second Member Invited (72h)        | % of new teams where a second member accepts an invite within 72h of signup                               | 29%         | 55%        | Backend event -- `invite_accepted` | Input |
| Template Adoption (First Session)  | % of new teams who apply a project template during their first session                                     | 12%         | 35%        | Amplitude -- `template_applied` | Input |

**Diagnostic note on Activation**: The P90 time to first task of 4.2 hours indicates a bimodal distribution. Fast activators (who likely understand project tools) convert quickly. Slow activators are likely hitting a comprehension or motivation barrier. The second-member invite rate (29%) is the likely root cause -- single users who sign up without immediately inviting colleagues have no social reinforcement to complete setup. Template adoption at 12% suggests users are starting from blank-canvas onboarding rather than guided starting points.

**Under 90-Day Team Retention (38% -- critical problem)**

| L2 Metric                          | Exact Definition                                                                                          | Current     | Target     | Data Source                     | Type    |
|------------------------------------|-----------------------------------------------------------------------------------------------------------|-------------|------------|---------------------------------|---------|
| WET Status at Day 30               | % of newly activated teams (WET within 14d) that are still WET at Day 30                                 | 62%         | 80%        | Amplitude cohort analysis       | Output  |
| Feature Breadth Score              | Average distinct feature modules used per WET team per month (out of 7 core modules)                      | 2.1         | 3.5        | Amplitude -- module-level events | Input  |
| Core Action Streak (3-of-4 weeks)  | % of WET teams that were WET in 3 or more of the last 4 rolling 7-day windows                            | 44%         | 65%        | Amplitude -- WET cohort query   | Output  |
| Churn by Team Size                 | 90-day retention rate segmented: teams with 2 members vs. 3-5 members vs. 6+ members                      | 2-member: 28% / 3-5: 51% / 6+: 74% | 6+ cohort maintained; grow 3-5 cohort to 65% | Backend teams table join | Output |
| Resurrection Rate (90d)            | % of teams that became inactive (not WET for 30+ days) and became WET again within 90 days               | 11%         | 20%        | Amplitude -- WET reactivation   | Output  |

**Diagnostic note on Retention**: The team-size segmentation reveals the retention problem clearly. 2-member teams retain at 28% -- these are effectively trial accounts where a manager signed up without organizational buy-in. 6+ member teams retain at 74% -- these are real organizational deployments. The fix is not retention campaigns targeting churned teams; it is preventing small teams from failing to expand past 2 members in the first 30 days. This reframes the problem as an expansion-within-activation problem, not a late-stage retention problem.

**Under New Team Acquisition (200/mo -- healthy, but quality matters)**

| L2 Metric                          | Exact Definition                                
