---
name: metric-framework
description: |
  Designs a metric framework with a goal hierarchy mapping north star metric to primary metrics to diagnostic metrics. Defines each level and maps relationships as a tree structure with directional influence arrows.
  Use when the user asks to build a metric tree, create a measurement hierarchy, connect KPIs to a north star metric, or design a goal-metric alignment structure.
  Do NOT use for defining individual KPIs with formulas and owners (use kpi-definition), dashboard layout design (use bi-dashboard-spec), or personal OKRs (use okr-builder in productivity).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "analysis data-science planning"
  category: "data-analysis"
  subcategory: "business-intelligence"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Metric Framework

## When to Use

**Use this skill when:**
- The user wants to build or redesign a metric tree that connects team-level operational metrics to a company-wide outcome -- including cases where they have a pile of existing KPIs and no coherent structure
- The user needs to select a north star metric and understand which of their current measures should be primary drivers versus diagnostic indicators versus input metrics
- The user is asking how their different KPIs "relate to each other" or why their metrics seem to contradict each other (e.g., engagement is up but revenue is flat)
- The user is setting up measurement infrastructure for a new product, business unit, or growth motion and needs the structural design before any individual KPI definitions or dashboards are created
- The user wants to align multiple teams (growth, product, marketing, customer success) around a shared measurement hierarchy so teams stop optimizing in silos
- The user is auditing an existing metric system and wants to identify orphan metrics, redundant metrics, or metrics that no one owns
- The user is preparing for a board presentation or OKR cycle and needs to show how team-level metrics ladder up to company-level outcomes
- A company has recently pivoted and needs to rebuild their measurement architecture to match the new business model

**Do NOT use when:**
- The user wants detailed KPI definitions with formulas, data sources, calculation logic, owners, and targets -- that is per-metric work handled by `kpi-definition`
- The user wants a dashboard layout with panel arrangement, refresh cadence, chart types, and filter logic -- that is `bi-dashboard-spec`
- The user wants personal OKRs, individual goal-setting, or 1:1 performance review metrics -- that is `okr-builder` in the productivity category
- The user wants to set business reporting schedules, meeting cadences, or stakeholder distribution lists for reports -- that is `business-reporting-cadence`
- The user wants to run a statistical analysis or causal inference study on whether one metric actually drives another -- that is a data-science task, not a framework design task
- The user is asking how to instrument their product or data pipeline to collect the data underlying a metric -- that is `data-instrumentation-spec`

---

## Process

### Step 1 -- Establish Business Context Before Any Metric Discussion

Gather the minimum viable context before proposing any metric names. Skipping this leads to generic frameworks that no team will actually use.

- **Business model:** Determine whether the company generates value through subscription, transactional, advertising, marketplace two-sided, usage-based/consumption, or professional services. The business model dictates which metrics are structural (must exist) versus optional.
- **Stage:** Pre-PMF companies (typically under $1M ARR or under 1,000 weekly active users) should use activation-and-retention-focused frameworks. Growth-stage companies (PMF confirmed, scaling GTM) add acquisition and expansion metrics. Mature companies add efficiency, margin, and market share metrics.
- **Audience and decision rights:** A framework for the executive team is shallower (L1 + L2). A framework for the product team needs L3 diagnostic detail. A framework for an engineering team needs L4 input metrics. Know who will read and act on each level.
- **Primary growth lever:** Ask whether the company's current focus is acquisition (getting new users/customers), activation (converting signups to active users), retention (keeping active users), monetization (extracting revenue from active users), or referral (using existing users to acquire new ones). This determines which branch of the tree needs the most depth.
- **Existing metrics:** Ask the user to list the 5-10 metrics they currently track. This prevents you from designing a framework that ignores established organizational behavior, and it reveals orphan metrics that need to be integrated.

### Step 2 -- Select the North Star Metric with Structured Elimination

The north star metric (NSM) is a single number that captures how much core value your product is delivering to the market right now. It is not revenue, not growth rate, not a composite index. Use the following selection method:

- **The value-delivery test:** The NSM must represent a completed unit of value delivered to a customer -- not an input or an output of a transaction. For a ride-sharing app it is "completed rides," not "rides requested" and not "revenue per ride." Ask the user: "What action or outcome represents a customer actually receiving the value your product promises?"
- **The influence test:** At least 3-4 different teams must be able to take actions that plausibly move the NSM within a quarter. If only one team can move it, it is a primary metric for that team, not a company-level north star.
- **The correlation test:** The NSM should historically correlate with long-term revenue and retention -- not perfectly (that would make it a revenue proxy) but meaningfully. If the number doubles, total revenue should reasonably be expected to grow over the following 6-12 months.
- **Standard NSM patterns by business model:**
  - **B2B SaaS:** "Accounts with 3+ active users completing core workflow weekly" or "Teams publishing X artifact per week" -- team-level activation, not individual DAU
  - **Consumer subscription (streaming, fitness):** "Subscribers completing 2+ sessions per week" or "Weekly sessions per paying subscriber" -- frequency of value consumption
  - **Marketplace (two-sided):** "Successful transactions per week" or "GMV from repeat buyers" -- the completed match, not supply or demand in isolation
  - **E-commerce (non-subscription):** "Customers placing 2+ orders in rolling 90 days" (repeat buyer rate captures LTV better than total orders)
  - **Advertising-funded:** "Daily active users completing at least one content consumption session of 5+ minutes" -- session depth, not just visits
  - **Usage-based SaaS (data, compute, API):** "API calls or compute units consumed per paying customer per week" -- consumption tied to billing
  - **Professional services / consulting:** "Engagements with client-confirmed milestone delivery in the quarter" -- outcome delivery, not hours billed
- **When the user proposes revenue as the NSM:** Acknowledge it is natural but redirect. Revenue is a consequence of value delivery, not value delivery itself. A company can grow revenue short-term by raising prices, cutting support, or one-time deals -- none of which improve the NSM candidates above. The only exception is a pure financial services product where the financial return IS the value delivered (e.g., a yield optimization tool for treasurers).

### Step 3 -- Decompose the NSM into Primary Metrics (Level 2)

Primary metrics are the direct mathematical or causal levers of the north star. They are not "important metrics" -- they are specifically the components you would need to change to move the NSM.

- **Use a stock-and-flow decomposition first:** Most NSMs can be decomposed as: Active Users (t) = Active Users (t-1) × Retention Rate + New Activations + Reactivations. This gives you the structural primary metrics before you look at anything else.
- **Limit to 3-5 primary metrics.** If you have more than 5, the NSM is too broad, or you are conflating primary metrics with diagnostic metrics. Collapse by asking: "Does this metric directly add to or subtract from the NSM, or does it explain why one of the other primaries moved?" The latter is a diagnostic metric.
- **Assign ownership at L2 before finalizing.** If two proposed primary metrics belong to the same team, consider whether one can be demoted to L3 under the other. Each primary metric should have a single team owner who has the headcount and budget to actually move it.
- **Check for mathematical decomposability:** The primary metrics must cover the NSM completely. If NSM = New Activations + Retained Active Users, then those two primaries account for 100% of the NSM. You should be able to write an approximate formula: NSM ≈ f(P1, P2, P3) where improving any Pi with others held constant increases NSM.
- **Common decomposition patterns:**
  - NSM (Weekly Active Users) = New Activations + (Previous WAU × Weekly Retention Rate) + Reactivations
  - NSM (Completed Transactions) = Demand (active buyers) × Supply (active sellers) × Match Rate × Completion Rate
  - NSM (Weekly Revenue per Active Customer) = Avg Order Value × Purchase Frequency × Active Customer Base

### Step 4 -- Build Diagnostic Metrics (Level 3) for Each Primary

Diagnostic metrics explain why a primary metric moved. They are the investigative tools a team reaches for when a primary metric alert fires.

- **Each primary metric needs 2-4 diagnostics.** Under 2 diagnostics means the primary metric is not granular enough to be actionable. Over 4 diagnostics means the primary is too broad and should be split.
- **Diagnostic metrics must point to specific team actions.** A diagnostic metric that no one can act on is a vanity metric masquerading as a diagnostic. For each L3 metric, ask: "If this dropped 10% this week, what specific product, engineering, or marketing action would the owning team take?"
- **Cover the funnel stages within the primary.** For an activation primary metric, diagnostics should cover: top of funnel (signup quality), mid-funnel (onboarding steps), and bottom of funnel (first value moment). For a retention primary metric, diagnostics cover: engagement depth, product stickiness indicators, and leading churn signals.
- **Use rate metrics at L3, not raw counts.** Raw counts at L3 are often confounded by volume changes at L2. If New Activations drops, you want to know whether the drop was in Signup-to-Activation Rate or in raw signup volume -- these have entirely different remedies.
- **Common diagnostic metric categories:**
  - **For activation primaries:** Time to First Value (median hours/days), Onboarding Step Completion Rate, Feature Discovery Rate, Setup Completion Rate
  - **For retention primaries:** Depth of Use (features used per user per week), Session Frequency (sessions per user per week), Integration Adoption Rate, NPS or CSAT trend, Ticket Volume per Active User
  - **For acquisition primaries:** Channel-by-Channel Conversion Rate, Cost per Activated User by Channel, Organic vs. Paid Signup Mix
  - **For monetization primaries:** Trial-to-Paid Conversion Rate, Expansion Revenue Rate (net revenue retention above 100%), Discount Rate, Average Contract Value trend

### Step 5 -- Add Input Metrics (Level 4) for Operational Teams

Input metrics are optional but valuable for engineering, growth, and data teams that need daily leading indicators. Use them selectively -- not every branch needs L4 depth.

- **Input metrics are things teams control directly, not outcomes they hope to achieve.** "Number of A/B tests launched per sprint" is an input metric. "A/B test win rate" is a diagnostic metric. "Activation Rate" is a primary metric.
- **Input metrics are leading indicators of L3 diagnostics.** The lag between an input metric action and its effect on the L3 diagnostic should be measurable and ideally under 4 weeks. If the lag is over a quarter, the input metric is too decoupled to be useful in a weekly operational review.
- **Typical input metrics by function:**
  - Product/Engineering: Features shipped per sprint, experiment velocity (experiments started per month), bug fix cycle time, API latency p99
  - Growth/Marketing: Landing page variants tested per week, email sequences launched, paid channel spend by cohort
  - Customer Success: Onboarding calls completed per week, QBR completion rate, customer health score review completion
- **Flag input metrics as advisory, not accountable.** Input metrics should appear in team dashboards but NOT in executive reviews. They are too operational for company-level review and too easily gamed if teams are held accountable to them at senior levels.

### Step 6 -- Document Relationships, Mechanisms, and Trade-offs

A metric tree without documented relationships is just a list. The value is in explicitly mapping HOW metrics connect.

- **For every parent-child pair, write the mechanism sentence:** "Improving [child metric] increases [parent metric] because [specific causal pathway]." If you cannot write a plausible mechanism, the relationship is spurious correlation, not a structural driver. Remove it.
- **Identify inverse relationships (counter-metrics):** Many optimizations improve one metric at the expense of a sibling. Classic examples:
  - Shortening the onboarding flow improves Signup-to-Activation Rate but can hurt long-term Feature Breadth Score (users skip depth)
  - Aggressive email re-engagement improves Reactivation Rate but can increase unsubscribe rate and hurt future email deliverability
  - Pricing experiments that increase Average Contract Value often reduce Trial-to-Paid Conversion Rate
- **Identify guardrail metrics:** These are metrics that must not deteriorate as a result of optimizing primary or diagnostic metrics. Common guardrails: NPS/CSAT floor, refund rate ceiling, support ticket rate ceiling, data privacy incident rate. Document them in the framework even though they are not in the main tree -- they are boundary conditions.
- **Document the flywheel if one exists:** Marketplaces and platforms often have reinforcing loops. Draw these explicitly: "More sellers → wider product selection → higher buyer conversion → more GMV → attractive payouts → more sellers." A flywheel means some metrics have both direct and indirect effects on the NSM.

### Step 7 -- Validate Structural Integrity of the Full Framework

Before finalizing, run the framework through a structural checklist. Unvalidated frameworks contain silent errors that corrupt team behavior for months.

- **No orphan metrics:** Every metric in the framework must connect to exactly one parent. Metrics that "matter but don't fit" should be documented as guardrail metrics, not left floating.
- **No circular dependencies:** If improving Metric A requires improving Metric B, and improving Metric B requires improving Metric A, you have a definitional problem. Resolve by identifying which is the input and which is the output.
- **Coverage completeness check:** Ask: "If the NSM dropped 20% next week and we only had L2 and L3 metrics to explain it, could we identify the root cause?" If the answer is no, you are missing a diagnostic branch.
- **No metric appears at two levels:** A metric that is both a primary and a diagnostic is a sign of framework confusion. Resolve by deciding which level it belongs at and demoting or promoting it.
- **Validate ownership is real:** Ask whether the named owner of each L2 metric has (a) a team that tracks it in an existing system, (b) budget and headcount to run experiments on it, and (c) it is in their existing job description or OKRs. If all three are no, the metric is unowned in practice regardless of what the document says.
- **The 2x test for the NSM:** Ask the user: "If the NSM doubled in 12 months, would that be cause for celebration across the entire company?" If the answer is "yes, but..." -- if there are conditions under which doubling the NSM would be a bad thing -- then the NSM definition needs to be refined to exclude those cases.

### Step 8 -- Assign Review Cadence and Escalation Logic

A framework without a review process is documentation, not a management system.

- **Daily tracking (automated):** L4 input metrics and L3 diagnostic metrics for active growth experiments. These live in automated dashboards with threshold alerts -- they should not require a human meeting to review.
- **Weekly review:** L2 primary metrics reviewed in the appropriate team standup or weekly sync. The review format should be: current value vs. prior week vs. 4-week rolling average. A 10% week-over-week drop in any L2 metric should trigger an automatic diagnostic review of its L3 children.
- **Monthly review:** Full tree including L3 diagnostics reviewed in a cross-functional product/growth review. This is where trend analysis (not just point-in-time) and cohort comparisons matter most.
- **Quarterly review:** The framework structure itself -- add, remove, or reclassify metrics. This is where you ask whether the current NSM is still the right NSM given business stage evolution, and whether any L3 metrics have become important enough to promote to L2.
- **Document alert thresholds explicitly:** For each L2 primary metric, define: Green (normal range), Yellow (monitor closely, review in next standup), Red (immediate investigation, escalate to leadership). Thresholds should be based on historical variance, not arbitrary percentages. A metric with high natural variance (±15% week-over-week) should have wider thresholds than a stable metric (±3% week-over-week).

---

## Output Format

```
## Metric Framework: [Company or Product Name]
**Business Model:** [One line description]
**Stage:** [Pre-PMF / Growth / Scale / Mature]
**Framework Audience:** [Who uses this -- executive, product, growth, all of the above]
**Last Reviewed:** [Date or TBD]

---

### North Star Metric (Level 1)

**Metric Name:** [Precise, unambiguous name]
**Definition:** [One sentence -- what exactly is counted and over what time window]
**Formula:** [Exact formula or pseudocode]
**Measurement Unit:** [Users / Teams / Transactions / etc.]
**Current Benchmark:** [Current value if known, or industry benchmark, or TBD]
**Why This NSM:** [2-3 sentences: why this captures value delivery, why not revenue, 
                    why it can be influenced by multiple teams]
**Exclusions:** [What does NOT count -- e.g., "Excludes internal test accounts, 
                  bot traffic, and accounts marked as churned"]

---

### Metric Tree

Level 1 (North Star): [North Star Metric Name]
|
+-- Level 2 (Primary): [Primary Metric 1] -- OWNER: [Team Name]
|   |
|   +-- Level 3 (Diagnostic): [Diagnostic 1a] -- OWNER: [Team/Role]
|   +-- Level 3 (Diagnostic): [Diagnostic 1b] -- OWNER: [Team/Role]
|   +-- Level 3 (Diagnostic): [Diagnostic 1c] -- OWNER: [Team/Role]
|   |
|   +-- Level 4 (Input, optional): [Input Metric 1a-i] -- OWNER: [Team/Role]
|
+-- Level 2 (Primary): [Primary Metric 2] -- OWNER: [Team Name]
|   |
|   +-- Level 3 (Diagnostic): [Diagnostic 2a] -- OWNER: [Team/Role]
|   +-- Level 3 (Diagnostic): [Diagnostic 2b] -- OWNER: [Team/Role]
|   +-- Level 3 (Diagnostic): [Diagnostic 2c] -- OWNER: [Team/Role]
|
+-- Level 2 (Primary): [Primary Metric 3] -- OWNER: [Team Name]
|   |
|   +-- Level 3 (Diagnostic): [Diagnostic 3a] -- OWNER: [Team/Role]
|   +-- Level 3 (Diagnostic): [Diagnostic 3b] -- OWNER: [Team/Role]
|
+-- Level 2 (Primary): [Primary Metric 4 if needed] -- OWNER: [Team Name]
    |
    +-- Level 3 (Diagnostic): [Diagnostic 4a] -- OWNER: [Team/Role]
    +-- Level 3 (Diagnostic): [Diagnostic 4b] -- OWNER: [Team/Role]

---

### Metric Definitions Table

| Level | Metric Name | Type | Definition | Drives | Formula / Calculation | Owner |
|-------|-------------|------|------------|--------|-----------------------|-------|
| L1 | [NSM] | North Star | [Definition] | Company | [Formula] | Executive |
| L2 | [Primary 1] | Primary | [Definition] | [NSM] | [Formula] | [Team] |
| L2 | [Primary 2] | Primary | [Definition] | [NSM] | [Formula] | [Team] |
| L3 | [Diagnostic 1a] | Diagnostic | [Definition] | [Primary 1] | [Formula] | [Team] |
| L3 | [Diagnostic 1b] | Diagnostic | [Definition] | [Primary 1] | [Formula] | [Team] |
| L3 | [Diagnostic 2a] | Diagnostic | [Definition] | [Primary 2] | [Formula] | [Team] |
| L4 | [Input 1a-i] | Input | [Definition] | [Diagnostic 1a] | [Formula / Count] | [Team] |

---

### Relationship Map

| Parent Metric | Child Metric | Direction | Mechanism | Lag (approx.) |
|---------------|-------------|-----------|-----------|----------------|
| [NSM] | [Primary 1] | Positive | [How child directly adds to parent] | Immediate |
| [NSM] | [Primary 2] | Positive | [How child directly adds to parent] | Immediate |
| [Primary 1] | [Diagnostic 1a] | Positive | [Specific causal pathway] | 1-2 weeks |
| [Primary 1] | [Diagnostic 1b] | Negative (lower = better) | [Specific causal pathway] | 1 week |
| [Primary 2] | [Diagnostic 2a] | Positive | [Specific causal pathway] | 2-4 weeks |

---

### NSM Decomposition Formula

[NSM Name] ≈ [Primary 1] + ([Previous Period NSM] × [Retention Rate]) + [Primary 3]

Or: [NSM] = f([P1], [P2], [P3]) where:
- P1 contributes approximately [X]% of NSM movement in normal periods
- P2 contributes approximately [Y]% of NSM movement in normal periods
- P3 contributes approximately [Z]% of NSM movement in normal periods

---

### Guardrail Metrics (Do Not Degrade)

| Guardrail Metric | Floor / Ceiling | What It Protects Against |
|-----------------|-----------------|--------------------------|
| [Metric Name] | Must stay above [threshold] | [Risk it prevents] |
| [Metric Name] | Must stay below [threshold] | [Risk it prevents] |

---

### Trade-offs and Inverse Relationships

| Metric A | Metric B | Nature of Tension | Management Approach |
|----------|----------|-------------------|---------------------|
| [Primary 1] | [Primary 2] | [Description of how optimizing A can hurt B] | [How to balance -- composite metric, priority rules, time-boxing] |
| [Diagnostic 1a] | [Diagnostic 1b] | [Description of tension] | [Management approach] |

---

### Flywheel (if applicable)

[Describe the reinforcing loop in plain text, if a flywheel exists]
Step 1: [More X leads to...]
Step 2: [...which causes Y, which leads to...]
Step 3: [...which brings back more X]

---

### Review Cadence and Alert Thresholds

| Metric | Review Frequency | Review Forum | Green Range | Yellow Range | Red Threshold |
|--------|-----------------|--------------|-------------|--------------|---------------|
| [NSM] | Weekly | Executive Weekly | [Range] | [Range] | [Value] |
| [Primary 1] | Weekly | [Team] Standup | [Range] | [Range] | [Value] |
| [Primary 2] | Weekly | [Team] Standup | [Range] | [Range] | [Value] |
| [Diagnostic 1a] | Daily (automated) | Dashboard alert | [Range] | [Range] | [Value] |

---

### Framework Audit Log

| Date | Change | Rationale | Approved By |
|------|--------|-----------|-------------|
| [Date] | Initial framework created | [Context] | [Name/Role] |
```

---

## Rules

1. **Never allow more than one north star metric.** If the user insists on two, ask: "If you could only improve one of these for the next 6 months, which would matter more?" The answer is the NSM. The other becomes a primary metric beneath it, or belongs to a separate product's framework.

2. **Revenue and profit are not valid north star metrics** for product-led or usage-led businesses. They are output metrics with long attribution chains that no single team controls cleanly. The only exception is a fintech or financial services product where the financial return to the customer IS the product's core value delivery.

3. **Primary metrics must be mathematically derivable from the NSM,** not just correlated with it. If you cannot write "NSM = f(P1, P2, P3)" with a plausible formula, your L2 metrics are not true primary metrics -- they are likely diagnostics for an unstated primary metric you have not yet identified.

4. **Every metric in the framework must have a named owner** (a specific team, not a vague "cross-functional" assignment). Unowned metrics stop being tracked within 60 days in most organizations. If no one can be named as the owner, the metric should be placed in the guardrail section or removed.

5. **Diagnostic metrics must be rate-based, not raw count-based,** because raw counts are confounded by volume changes at the level above them. "Onboarding completion rate" (%) is a diagnostic metric. "Number of users who completed onboarding" is not -- it moves whenever acquisition moves, even if the onboarding funnel is unchanged.

6. **Never build L4 input metrics for all branches.** L4 exists for teams that need daily operational visibility -- typically growth, engineering, and content teams actively running experiments. Including L4 everywhere inflates the framework to 30+ metrics, which no team will actually use. L4 depth belongs only in the one or two branches where the team has the highest short-term leverage.

7. **Document every inverse relationship explicitly.** The most common framework failure mode is a team optimizing a L3 metric in ways that damage a sibling L3 metric or a neighboring L2 metric. If the framework does not name the trade-off, the team that discovers it will hide it. Naming it forces an explicit conversation about prioritization.

8. **Metric names must include their unit of measurement and time window.** "Engagement" is not a metric. "Sessions per active user per week" is a metric. "Retention" is not a metric. "Week-over-week retention rate (users active in week N who were also active in week N-1)" is a metric. Ambiguous names produce different interpretations across teams, leading to arguments about numbers rather than actions.

9. **The framework structure must be reviewed every quarter, not just the metric values.** Business stage evolution, product pivots, and team reorganizations invalidate metric ownership and sometimes entire branches. A metric tree that was right at Series A may actively mislead at Series B. Build the quarterly structure review into the cadence from day one.

10. **Do not include more than 15 total metrics in the core framework** (L1 through L3). If the framework exceeds 15, it cannot be reviewed in a single meeting, teams stop caring about metrics outside their branch, and the north star loses its unifying power. Use guardrail metrics and the audit log to document additional metrics of interest without adding them to the core tree.

11. **Validate that L3 diagnostics have different time lags from their L2 parents.** If a diagnostic metric moves at exactly the same time as its primary metric, it is not a diagnostic -- it is just a restatement of the same measure. True diagnostics are leading indicators of their parent (they move 1-4 weeks before the primary metric changes significantly) or they are decompositions of the primary that explain the source of movement after the fact.

12. **Do not use composite indexes as any level of the tree.** A composite index (weighted sum of multiple sub-scores) obscures root cause analysis. When a composite score drops, you cannot tell which component drove it. Use the individual components as separate metrics at the appropriate level, and use the composite only as a communication tool for non-analytical stakeholders -- clearly labeled as a summary view, not a metric to be tracked and acted on.

---

## Edge Cases

**Pre-revenue startup (no paying customers yet):**
The NSM should be based on activation and engagement, not revenue. Use a "completed core action" metric: the specific action that represents a user experiencing the product's value for the first time (e.g., "users who sent their first message," "teams that completed their first project plan," "users who ran their first analysis"). L2 primary metrics cover: new activated users (acquisition + activation), 4-week retention of activated users, and referral or viral coefficient if the product has a social component. Place any revenue-related metrics (conversion to paid, willingness-to-pay survey scores) at L3 as validation signals. The framework should be explicitly designed to answer one question: "Are we delivering enough value that, if we charged for it, people would pay?"

**Internal platform or infrastructure team (no external end-users):**
The "customer" is another internal team, and the NSM must reflect their success, not the platform team's output. A good internal platform NSM is "teams achieving their delivery goals using this platform" -- measuring adoption + outcome, not just adoption. L2 primary metrics typically cover: reliability (p99 latency, uptime), adoption (internal teams with active usage this week), developer productivity (deployment frequency, time-to-onboard a new team), and incident prevention (mean time to detect, mean time to resolve). Avoid vanity metrics like "tickets closed" or "API calls served" -- these measure activity, not value.

**Multi-sided marketplace with supply-demand imbalance:**
When supply and demand are severely imbalanced, the NSM should reflect the constrained side. If the marketplace has too few sellers, the NSM should weight supply-side health (e.g., "active sellers completing transactions per week"). If the marketplace has excess supply and insufficient demand, the NSM should weight demand-side health (e.g., "buyers completing at least 2 transactions per month"). The L2 metrics must explicitly cover both sides of the marketplace with separate ownership -- a supply team and a demand team. Document the flywheel: the mechanism by which improvements on one side reinforce the other side. Without the flywheel documentation, teams optimize their side independently and can accidentally create a worse imbalance.

**Company going through a business model transition (e.g., transactional to subscription):**
Run two parallel frameworks during the transition period -- one for the legacy model and one for the new model. The legacy NSM is a lagging indicator of existing revenue; the new NSM captures the forward-looking health of the new business. Set an explicit sunset date for the legacy framework (typically 12-18 months into the transition). Mixing metrics from both models in a single tree creates false trade-offs and confuses ownership. The executive team needs to see both trees side by side until the new model crosses a threshold (e.g., 40% of revenue) that makes the legacy tree less relevant.

**Framework designed for a team that doesn't control its own data infrastructure:**
Some teams (particularly at large enterprises) cannot add new tracking, change event schemas, or create new data tables without a multi-month engineering request. In this case, design the ideal framework first, then audit each metric against data availability. Mark each metric as: Green (available today in existing tools), Yellow (available with a <30 day engineering request), or Red (requires major instrumentation work, >90 days). For Red metrics, substitute a proxy metric that is available today and document the proxy status explicitly. A proxy metric is better than a gap, but it must be labeled as a proxy so that the team knows to replace it when instrumentation is complete.

**User insists their business needs two north star metrics:**
This is the most common pushback and it almost always reflects one of three underlying problems. First, the user is confusing a long-term NSM (value delivery) with a short-term growth metric (acquisition). In this case, the long-term metric is the true NSM and the short-term metric is a L2 primary. Second, the user runs two genuinely distinct products with different value propositions -- in this case, each product needs its own framework and a company-level summary shows how both contribute to a company-level outcome. Third, the user is describing the two sides of a marketplace (buyers and sellers) -- in this case, the NSM is the completed transaction that benefits both sides, and buyer-side and seller-side metrics are L2 primaries. Walk the user through this diagnosis explicitly before accepting a dual-NSM structure.

**Metric framework being rebuilt after a failed first attempt:**
The most common reasons first frameworks fail: metrics were assigned to teams that couldn't act on them, no one tracked the diagnostics between monthly reviews (too infrequent), the NSM was too abstract to feel actionable to product teams, or the framework was never formally adopted (no review cadence, no escalation logic). When rebuilding, start by auditing which metrics from the failed framework were actually tracked and used -- those are the real baseline. Keep what worked, redesign what didn't, and explicitly address the adoption failure mode in the new framework's review cadence design.

**Framework for a non-profit or mission-driven organization:**
The NSM for a non-profit is a mission outcome proxy, not a revenue metric. Examples: "Households with sustained access to clean water per quarter" (water access NGO), "Students reaching proficiency level in target skill per cohort" (education non-profit), "Volunteer hours of meaningful impact delivered per month" (volunteering platform). The L2 primary metrics cover program delivery (outputs), beneficiary reach (scale), and sustainability (funding and volunteer capacity). Efficiency metrics (cost per beneficiary, overhead ratio) belong at L3 as diagnostic metrics, not at L2 -- treating efficiency as a primary metric leads organizations to cut programs that are expensive but high-impact.

---

## Example

**Input:** "We're building a two-sided marketplace for freelance data scientists and companies that need short-term data projects. We're post-launch, have about 200 active freelancers and 80 active client companies, and we're focused on growth. We want a metric framework. Our revenue comes from a 15% commission on every project completed."

---

## Metric Framework: DataMatch (Freelance Data Science Marketplace)

**Business Model:** Two-sided marketplace -- commission-based (15% of project value on completed projects)
**Stage:** Early Growth (post-launch, pre-scale -- demand-constrained)
**Framework Audience:** Executive team (L1-L2), Product and Growth teams (L1-L3), Operations team (L3-L4)
**Last Reviewed:** Initial framework

---

### North Star Metric (Level 1)

**Metric Name:** Weekly Completed Projects
**Definition:** The count of distinct projects where a freelancer delivered a final artifact (code, model, analysis, or report) AND the client marked the project as complete or auto-closed after 7 days without dispute, in the past 7 calendar days.
**Formula:**
```
Weekly Completed Projects =
  COUNT(projects)
  WHERE delivery_status = 'completed'
  AND (client_confirmed = TRUE OR auto_close_date BETWEEN [today-7] AND [today])
  AND dispute_flag = FALSE
```
**Measurement Unit:** Projects per week
**Current Benchmark:** ~18 completed projects/week (at current scale); target 50/week at 6 months
**Why This NSM:** A completed project is the unit of value delivered simultaneously to both sides of the marketplace -- the freelancer earns income, the client receives a data deliverable. It is directly tied to commission revenue (NSM × avg. project value × 15% = weekly gross revenue) but is not revenue itself, making it influenceable by product, matching, and trust improvements, not just pricing. It requires both supply (an available freelancer) and demand (a funded project scope), making it a true two-sided health indicator.
**Exclusions:** Excludes projects cancelled before work started, projects in active dispute, internal test projects, and projects under $200 value (below minimum quality threshold).

---

### Metric Tree

```
Level 1 (North Star): Weekly Completed Projects
|
+-- Level 2 (Primary): Active Client Demand Rate -- OWNER: Demand Growth Team
|   |
|   +-- Level 3 (Diagnostic): Client Signup to First Project Post Rate (%) -- OWNER: Demand Growth
|   +-- Level 3 (Diagnostic): Projects Posted per Active Client per Month -- OWNER: Demand Growth
|   +-- Level 3 (Diagnostic): Project Scope Completion Rate (% of posted projects with full brief) -- OWNER: Demand Growth
|   +-- Level 3 (Diagnostic): Client Repeat Project Rate (% of clients posting 2+ projects in 90 days) -- OWNER: Demand Growth
|
+-- Level 2 (Primary): Match-to-Hire Rate -- OWNER: Product Team (Matching)
|   |
|   +-- Level 3 (Diagnostic): Median Time to First Proposal (hours) -- OWNER: Product / Supply Ops
|   +-- Level 3 (Diagnostic): Proposal Acceptance Rate (%) -- OWNER: Product (Matching Algorithm)
|   +-- Level 3 (Diagnostic): Freelancer Response Rate within 24h (%) -- OWNER: Supply Operations
|   +-- Level 3 (Diagnostic): Client Interview-to-Hire Conversion Rate (%) -- OWNER: Product
|
+-- Level 2 (Primary): Project Completion Rate -- OWNER: Product Team (Trust & Safety)
|   |
|   +-- Level 3 (Diagnostic): On-Time Delivery Rate (%) -- OWNER: Operations
|   +-- Level 3 (Diagnostic): Milestone Completion Rate (% of milestones hit on schedule) -- OWNER: Operations
|   +-- Level 3 (Diagnostic): Dispute Rate per Completed Project (%) -- OWNER: Trust & Safety
|   +-- Level 3 (Diagnostic): Client Satisfaction Score post-project (avg. 1-5) -- OWNER: Operations
|
+-- Level 2 (Primary): Active Freelancer Supply Rate -- OWNER: Supply Growth Team
    |
    +-- Level 3 (Diagnostic): Freelancer Signup to First Bid Rate (%) -- OWNER: Supply Growth
    +-- Level 3 (Diagnostic): Bids per Active Freelancer per Week -- OWNER: Supply Growth
    +-- Level 3 (Diagnostic): Freelancer Retention Rate (% active in both this week and last week) -- OWNER: Supply Growth
    |
    +-- Level 4 (Input): Freelancer onboarding calls completed per week -- OWNER: Supply Ops
    +-- Level 4 (Input): Skill verification reviews completed per week -- OWNER: Supply Ops
```

---

### Metric Definitions Table

| Level | Metric Name | Type | Definition | Drives | Formula / Calculation | Owner |
|-------|-------------|------|------------|--------|-----------------------|-------|
| L1 | Weekly Completed Projects | North Star | Projects delivered and confirmed by client in past 7 days | Revenue | COUNT(projects WHERE complete AND not disputed, 7d window) | Executive |
| L2 | Active Client Demand Rate | Primary | Number of client companies with at least 1 open project posted this week | NSM | COUNT(clients WHERE projects_posted_7d >= 1) | Demand Growth |
| L2 | Match-to-Hire Rate | Primary | % of posted projects where a freelancer is hired within 5 business days of posting | NSM | Hired Projects / Total Posted Projects (5-day window) | Product - Matching |
| L2 | Project Completion Rate | Primary | % of hired projects that reach completed status (vs. cancelled or stalled) | NSM | Completed Projects / Hired Projects (rolling 30d) | Product - Trust |
| L2 | Active Freelancer Supply Rate | Primary | Number of freelancers who submitted at least 1 bid this week | NSM | COUNT(freelancers WHERE bids_submitted_7d >= 1) | Supply Growth |
| L3 | Client Signup to First Project Post Rate | Diagnostic | % of newly registered client accounts that post their first project within 14 days | Active Client Demand | First-post clients (14d) / New signups cohort | Demand Growth |
| L3 | Projects Posted per Active Client per Month | Diagnostic | Average number of projects posted by clients who posted at least once in the month | Active Client Demand | Total projects posted / Active clients (monthly) | Demand Growth |
| L3 | Project Scope Completion Rate | Diagnostic | % of posted projects that include all 5 required brief fields (timeline, budget, skills, description, data access plan) | Active Client Demand | Complete briefs / Total posted projects | Demand Growth |
| L3 | Client Repeat Project Rate | Diagnostic | % of active clients who post a second or subsequent project within 90 days of their first | Active Client Demand | Repeat-posting clients / All clients with first post 90d ago | Demand Growth |
| L3 | Median Time to First Proposal | Diagnostic | Median hours between project posting and first freelancer bid received | Match-to-Hire Rate | MEDIAN(first_bid_time - posting_time) in hours | Product / Supply Ops |
| L3 | Proposal Acceptance Rate | Diagnostic | % of freelancer proposals that result in a client interview or hire | Match-to-Hire Rate | Interviews + Hires / Total proposals submitted | Product - Matching |
| L3 | Freelancer Response Rate within 24h | Diagnostic | % of invited-to-bid freelancers who respond within 24 hours | Match-to-Hire Rate | Responses within 24h / Total invitations sent | Supply Operations |
| L3 | Client Interview-to-Hire Conversion | Diagnostic | % of projects where at least one interview was held that subsequently resulted in a hire | Match-to-Hire Rate | Hired projects / Interviewed projects | Product |
| L3 | On-Time Delivery Rate | Diagnostic | % of milestones delivered on or before agreed deadline | Project Completion Rate | On-time milestones / Total milestones | Operations |
| L3 | Milestone Completion Rate | Diagnostic | % of agreed milestones that are completed (vs. skipped or renegotiated down) | Project Completion Rate | Completed milestones / Agreed milestones | Operations |
| L3 | Dispute Rate per Completed Project | Diagnostic | % of completed projects that generate a formal dispute within 7 days of completion | Project Completion Rate | Disputed projects / Completed projects (30d) | Trust & Safety |
| L3 | Client Satisfaction Score | Diagnostic | Average post-project rating given by clients on a 1-5 scale | Project Completion Rate | AVG(client_rating) on completed projects | Operations |
| L3 | Freelancer Signup to First Bid Rate | Diagnostic | % of newly approved freelancers who submit at least 1 bid within 7 days of approval | Active Freelancer Supply | First-bid freelancers (7d post-approval) / Approved freelancers | Supply Growth |
| L3 | Bids per Active Freelancer per Week | Diagnostic | Average bids submitted per freelancer who bid at least once this week | Active Freelancer Supply | Total bids / Bidding freelancers (7d window) | Supply Growth |
| L3 | Freelancer Weekly Retention Rate | Diagnostic | % of freelancers active (bidding) last week who are also active this week | Active Freelancer Supply | Freelancers active both weeks / Freelancers active last week | Supply Growth |
| L4 | Freelancer onboarding calls/week | Input | Count of onboarding video calls completed with newly approved freelancers per week | Freelancer First Bid Rate | COUNT(onboarding_calls_completed, 7d) | Supply Ops |
| L4 | Skill verifications completed/week | Input | Count of freelancer skill assessments reviewed and scored per week | Freelancer First Bid Rate | COUNT(skill_reviews_completed, 7d) | Supply Ops |

---

### NSM Decomposition Formula

```
Weekly Completed Projects ≈
  Active Client Demand Rate (projects available)
  × Match-to-Hire Rate (% of projects that get a freelancer hired)
  × Project Completion Rate (% of hired projects that finish)

Or in stock-flow terms:
Weekly Completed Projects =
  (Active Projects in Pipeline × Match-to-Hire Rate × Completion Rate)
  + (Reactivated Stalled Projects that complete this week)

Approximate contribution at current stage:
- Active Client Demand Rate: drives ~60% of NSM variance (demand-constrained marketplace)
- Match-to-Hire Rate: drives ~25% of NSM variance
- Project Completion Rate: drives ~15% of NSM variance
- Active Freelancer Supply: indirect -- constrains Match-to-Hire Rate when supply is insufficient
```

---

### Guardrail Metrics (Do Not Degrade)

| Guardrail Metric | Floor / Ceiling | What It Protects Against |
|-----------------|-----------------|--------------------------|
| Dispute Rate per Completed Project | Must stay below 5% | Protects marketplace trust and prevents revenue clawbacks |
| Client Satisfaction Score | Must stay above 3.8 / 5.0 average | Protects client repeat purchase rate and word-of-mouth |
| Freelancer Platform Rating (avg. satisfaction with platform experience) | Must stay above 3.5 / 5.0 | Protects supply-side retention; freelancers leave for direct sourcing if platform feels adversarial |
| Fraud-flagged project rate | Must stay below 1% | Protects commission revenue integrity and legal exposure |

---

### Relationship Map

| Parent Metric | Child Metric | Direction | Mechanism | Approx. Lag |
|---------------|-------------|-----------|-----------|-------------|
| Weekly Completed Projects | Active Client Demand Rate | Positive | More open projects in the pipeline means more opportunities to complete; demand is the binding constraint at current stage | 1-2 weeks |
| Weekly Completed Projects | Match-to-Hire Rate | Positive | A project that doesn't get a freelancer hired never completes; every point of improvement in hire rate directly adds completions to the pipeline | 1-3 weeks |
| Weekly Completed Projects | Project Completion Rate | Positive | Of projects that get hired, a higher share reaching completion directly multiplies the NSM | 2-4 weeks |
| Weekly Completed Projects | Active Freelancer Supply Rate | Positive (indirect) | More active freelancers reduces time-to-first-proposal and increases proposal diversity, improving Match-to-Hire Rate; supply is not the binding constraint today but becomes one above ~80 active clients | 2-4 weeks (via Match-to-Hire) |
| Active Client Demand Rate | Client Signup to First Project Post Rate | Positive | Clients who post quickly have higher lifetime project volume; poor activation means paid or organic acquisition spend is wasted | 1-2 weeks |
| Active Client Demand Rate | Projects per Active Client per Month | Positive | Increasing project frequency per client grows total demand without new acquisition cost | 2-4 weeks |
| Active Client Demand Rate | Project Scope Completion Rate | Positive | Well-specified project briefs attract more freelancer bids and better-matched proposals, increasing the chance the client posts again after a successful first hire | 1-2 weeks |
| Match-to-Hire Rate | Median Time to First Proposal | Negative (lower is better) | Clients who wait over 48 hours for first proposal have significantly higher abandonment rates (estimated 35% abandonment if no proposal in 48h vs. 8% if proposal within 6h) | Same week |
| Match-to-Hire Rate | Proposal Acceptance Rate | Positive | Higher quality proposals (better-matched skills, clear relevance to brief) reduce client decision friction and increase hire probability | 1 week |
| Match-to-Hire Rate | Client Interview-to-Hire Rate | Positive | Reducing friction between interview and hire decision (e.g., simplified contract flow) directly improves the rate at which interested clients convert | 1-2 weeks |
| Project Completion Rate | On-Time Delivery Rate | Positive | Late delivery is the leading predictor of project cancellation; 65% of projects that miss a first milestone never complete | 2-3 weeks |
| Project Completion Rate | Dispute Rate | Negative (lower is better) | Disputes halt payment, freeze project status, and count against completion; high dispute rate reflects scope clarity failures at project-start | 1-3 weeks |
| Active Freelancer Supply | Freelancer First Bid Rate | Positive | Freelancers who bid quickly after approval establish the bidding habit; those who don't bid in the first 7 days have less than 20% chance of ever becoming active | 1 week |
| Active Freelancer Supply | Freelancer Weekly Retention | Positive | Retention of active supply is 4-6x cheaper than reacquisition; losing experienced freelancers hurts proposal quality faster than raw supply numbers suggest | Ongoing |

---

### Trade-offs and Inverse Relationships

| Metric A | Metric B | Nature of Tension | Management Approach |
|----------|----------|-------------------|---------------------|
| Proposal Acceptance Rate | Bids per Active Freelancer per Week | Encouraging higher bid volume per freelancer can flood clients with low-quality proposals, reducing acceptance rate | Set a minimum proposal quality score threshold (requires NLP or manual review) before surfacing bids to clients; track acceptance rate segmented by bid volume tier |
| Match-to-Hire Rate (speed) | Project Completion Rate (quality) | Aggressively reducing time-to-hire may result in worse freelancer-project fit, increasing dispute rate and incomplete projects | Monitor completion rate by hire-speed cohort; flag projects hired in under 12 hours as a watch cohort for the first 4 weeks |
| Client Repeat Project Rate | Dispute Rate per Project | Pressuring clients to post again quickly (re-engagement sequences) before a dispute is resolved creates a poisoned second project experience | Gate re-engagement sequences on: no active dispute, client satisfaction score >= 4, project marked fully complete |
| Freelancer First Bid Rate | Freelancer Weekly Retention | Optimizing onboarding to get fast first bids can front-load activity before freelancers are fully profile-complete, resulting in lower proposal acceptance and faster burnout | Require skill verification completion before enabling bidding, even if this delays first bid by 2-3 days |

---

### Flywheel

DataMatch operates a
