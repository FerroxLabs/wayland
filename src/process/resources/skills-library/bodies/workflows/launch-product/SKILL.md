---
name: launch-product
description: |
  Guides the user through a complete product launch from market research
  through product definition, go-to-market strategy, launch execution,
  sales enablement, analytics review, and post-launch iteration. Use when
  the user is launching a new product or major feature and needs an
  end-to-end process covering strategy, execution, and measurement.
  Do NOT use for ongoing product management (use prd-writing or
  product-roadmap directly), for marketing campaigns without a product
  launch (use create-marketing-campaign), or for SaaS-specific technical
  deployment (use launch-saas in software workflows).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "strategy marketing sales entrepreneurship planning step-by-step"
  category: "business-operations"
  depends: "market-research-brief prd-writing go-to-market-strategy product-launch-checklist sales-playbook-section marketing-analytics-report ab-test-design"
  disclaimer: "none"
  difficulty: "advanced"
---

# Launch a Product

A seven-step workflow that takes a product from market research through definition, go-to-market strategy, launch execution, sales enablement, analytics review, and post-launch optimization. Each step builds on the previous one's output, with decision points that adapt the process for B2B vs B2C, bootstrapped vs funded, and competitive urgency.

**Estimated time:** 4-16 weeks (depending on product complexity, team size, and market readiness)

## When to Use

- User is preparing to launch a new product, service, or major feature
- User needs a structured process that covers both strategy and execution
- User wants to coordinate marketing, sales, and product teams around a launch
- User is a founder or product manager leading a launch for the first time
- Do NOT use when: the user is doing ongoing product management without a launch event (use prd-writing), running a marketing campaign without a new product (use create-marketing-campaign), or deploying software infrastructure (use deploy-to-production)

## Prerequisites

Before starting this workflow, ensure:

1. **Product or feature concept:** The user has a defined product, service, or feature to launch. It does not need to be fully built, but the core value proposition must be clear enough to research.
2. **Target market hypothesis:** The user has a hypothesis about who will buy this product and why. The workflow validates and refines this hypothesis, but it needs a starting point.
3. **Team and resource clarity:** The user knows who is available to work on the launch (solo founder, small team, or cross-functional organization) and has a rough budget range.
4. **Timeline constraints:** The user has either a target launch date or a competitive window. The workflow adapts its depth and parallelization based on time pressure.

## Steps

**Step 1: Market Research** (uses: market-research-brief)

Validate the market opportunity and refine the target customer profile before investing in product definition or marketing. Market research prevents the most expensive launch failure: building for the wrong audience.

- Input: Product concept, target market hypothesis, competitive landscape assumptions, and any existing customer data or feedback
- Output: A market research brief containing: validated target customer segments ranked by opportunity size, competitive positioning map showing where the product fits, unmet needs the product addresses (validated against real customer signals, not assumptions), market size estimates for the primary segment, and pricing sensitivity signals
- Key focus: The output must distinguish between what the team believes about the market and what the research confirms. Every assumption from the prerequisites should be explicitly validated or invalidated. Invalidated assumptions require a strategy pivot before proceeding to Step 2.

**Step 2: Product Definition** (uses: prd-writing)

Define what the product does, for whom, and what success looks like. The PRD translates market research into a concrete product specification that aligns the entire team on scope, priorities, and launch criteria.

- Input: Market research brief from Step 1, existing product features or prototype (if any), technical constraints, and launch timeline
- Output: A product requirements document containing: user stories prioritized by customer segment value, feature scope for launch (must-have vs nice-to-have), success metrics and launch criteria (what numbers must be true for the launch to be considered successful), technical requirements and dependencies, and a launch-ready checklist defining "done"
- Key focus: The PRD must define the minimum viable launch scope. Feature creep is the primary cause of launch delays. Every feature in the "must-have" list should map directly to a validated customer need from Step 1's research. Features that map to assumptions (not validated needs) go to "nice-to-have."

**Step 3: Go-to-Market Strategy** (uses: go-to-market-strategy)

Design the strategy for reaching the target customer with the right message through the right channels. The GTM strategy bridges the gap between having a product and having customers.

- Input: Market research brief from Step 1, PRD from Step 2 (especially target segments and value proposition), budget and team resources, and launch timeline
- Output: A go-to-market strategy containing: positioning statement and messaging hierarchy for each target segment, channel strategy ranked by expected ROI (owned, earned, paid), pricing strategy with competitive benchmarks, launch timeline with phase gates (pre-launch teasers, launch day, post-launch follow-up), and partner or distribution channel strategy (if applicable)
- Key focus: The messaging hierarchy must connect product features to customer benefits to emotional outcomes. "Our product has feature X" is a feature statement. "Feature X saves you 3 hours per week on task Y" is a benefit. "Stop spending your evenings on task Y" is an emotional outcome. The GTM strategy should produce all three layers.

**Step 4: Launch Execution** (uses: product-launch-checklist)

Execute the launch according to the GTM strategy. The launch checklist ensures nothing falls through the cracks during the high-pressure launch window when multiple workstreams converge.

- Input: Go-to-market strategy from Step 3, PRD launch criteria from Step 2, all creative assets and marketing materials prepared during pre-launch, and team assignments
- Output: A completed launch checklist containing: pre-launch tasks verified (landing page live, email sequences loaded, social content scheduled, press outreach sent), launch day tasks executed (product made available, announcement published, team monitoring channels), post-launch tasks queued (follow-up emails, early customer outreach, support team briefed), and a launch day timeline with hourly assignments and contingencies
- Key focus: The launch checklist is a coordination document, not a strategy document. Every item should be a binary yes/no task with a responsible owner and a deadline. The checklist should include rollback procedures -- if the launch reveals a critical issue in the first 4 hours, what gets paused, what gets pulled, and who makes the call.

**Step 5: Sales Enablement** (uses: sales-playbook-section)

Equip the sales team (or the founder doing sales) with the materials and playbook needed to convert launch interest into revenue. Sales enablement ensures the demand generated by marketing converts into actual customers.

- Input: Go-to-market messaging from Step 3, product features and use cases from Step 2, competitive positioning from Step 1, and early launch feedback (if available from Step 4)
- Output: A sales playbook section containing: elevator pitch and 30/60/90-second versions, objection handling scripts for the top 5 expected objections, competitive comparison talking points (what to say when prospects mention competitors), demo flow or product walkthrough guide, pricing conversation framework, and a qualification checklist (how to identify high-fit prospects quickly)
- Key focus: The objection handling scripts must address real objections from market research (Step 1), not hypothetical ones. If Step 1 revealed that prospects worry about integration complexity, the sales playbook must have a specific integration-concern response. Generic "we are the best solution" responses fail.

**Step 6: Analytics Review** (uses: marketing-analytics-report)

Measure launch performance against the success metrics defined in Step 2 and the channel expectations from Step 3. The analytics review is the feedback loop that determines whether the launch succeeded, partially succeeded, or needs intervention.

- Input: Success metrics from the PRD (Step 2), channel strategy and expected ROI from the GTM (Step 3), actual launch data (traffic, signups, conversions, revenue, engagement), and sales pipeline data from Step 5
- Output: A marketing analytics report containing: actual vs expected performance for each success metric, channel-by-channel performance analysis (which channels delivered, which underperformed), customer acquisition cost and conversion funnel analysis, cohort analysis of early adopters (who are they, how did they find the product, what do they do first), and a prioritized list of optimization opportunities
- Key focus: The report must distinguish between launch-day vanity metrics (pageviews, social shares) and business metrics (signups, activations, revenue). A launch with 10,000 pageviews and 50 signups tells a different story than a launch with 2,000 pageviews and 200 signups. Focus the analysis on conversion rates through the funnel, not top-of-funnel volume.

**Step 7: Post-Launch Iteration** (uses: ab-test-design)

Design and execute experiments to optimize the product, messaging, and channels based on launch analytics. Post-launch iteration turns a one-time launch event into a continuous improvement cycle.

- Input: Analytics report from Step 6, optimization opportunities identified, customer feedback from early adopters, and remaining budget and resources
- Output: An A/B testing plan containing: 3-5 prioritized experiments ranked by expected impact and effort, hypothesis and success criteria for each experiment, test design (control vs variant, sample size, duration), measurement plan aligned with the success metrics from Step 2, and an iteration roadmap showing the sequence and dependencies of experiments
- Key focus: Prioritize experiments by expected revenue impact, not by ease of implementation. A landing page headline test is easy but may have modest impact. A pricing experiment is harder but may have 10x the revenue impact. Use the ICE framework (Impact, Confidence, Ease) to rank experiments. Run no more than 2-3 concurrent experiments to maintain statistical validity.

## Output Format

```
## Product Launch Plan: [Product Name]

### Market Research Summary
- **Target Segment:** [primary customer segment]
- **Market Size:** [TAM/SAM/SOM estimates]
- **Competitive Position:** [where the product fits in the market]
- **Validated Needs:** [top 3 customer needs confirmed by research]
- **Invalidated Assumptions:** [assumptions disproved during research]

### Product Definition
- **Launch Scope:** [must-have features for launch]
- **Success Metrics:**
  - [Metric 1]: [target] by [date]
  - [Metric 2]: [target] by [date]
  - [Metric 3]: [target] by [date]
- **Launch Criteria:** [what must be true to launch]

### Go-to-Market Strategy
- **Positioning:** [one-sentence positioning statement]
- **Primary Channel:** [channel] -- [expected ROI rationale]
- **Pricing:** [pricing model and competitive benchmark]
- **Launch Timeline:** Pre-launch [dates] | Launch day [date] | Post-launch [dates]

### Launch Checklist Status
- Pre-launch: [X/Y] tasks complete
- Launch day: [scheduled/in-progress/complete]
- Post-launch: [X/Y] tasks queued

### Sales Enablement
- **Elevator Pitch:** [30-second version]
- **Top Objections Addressed:** [count]
- **Competitive Comparisons:** [count] competitors covered

### Analytics Report
- **Overall:** [launch success assessment]
- **Key Metrics vs Target:**
  | Metric           | Target | Actual | Status       |
  |------------------|--------|--------|--------------|
  | [metric 1]       | [val]  | [val]  | [met/missed] |
  | [metric 2]       | [val]  | [val]  | [met/missed] |
- **Best Channel:** [channel] ([conversion rate])
- **Worst Channel:** [channel] ([conversion rate])

### Post-Launch Experiments
| Priority | Experiment           | Hypothesis                    | Impact | Status  |
|----------|---------------------|-------------------------------|--------|---------|
| 1        | [experiment name]   | [if X then Y]                 | High   | Planned |
| 2        | [experiment name]   | [if X then Y]                 | Medium | Planned |
```

## Decision Points

- **After Step 1 (B2B vs B2C):** B2B launches emphasize sales enablement (Step 5) and require longer pre-launch relationship-building. B2C launches emphasize marketing channels (Step 3) and require broader reach with simpler messaging. The GTM strategy in Step 3 branches significantly based on this distinction.
- **After Step 1 (pre-revenue vs revenue-generating):** If the product is the company's first revenue source, pricing strategy in Step 3 requires extra validation through customer discovery. If the company already has revenue, the launch can leverage existing customer relationships for early adoption and testimonials.
- **After Step 2 (bootstrapped vs funded):** Bootstrapped launches must prioritize low-cost, high-ROI channels in Step 3 (organic content, community, partnerships) over paid acquisition. Funded launches can run paid channels in parallel with organic for faster feedback loops.
- **After Step 3 (competitive window urgency):** If a competitor is launching a similar product within the same window, accelerate Steps 4-5 by running them in parallel. Accept lower polish in exchange for market timing. If no competitive pressure exists, run Steps 4-5 sequentially for higher quality.
- **After Step 4 (soft launch reveals positioning problem):** If the soft launch reveals that the messaging does not resonate (high bounce rate, low engagement), return to Step 3 and revise the positioning before scaling. Do not increase spend on channels that are not converting -- fix the message first.
- **After Step 6:** If analytics show one channel dramatically outperforming others, reallocate budget from underperforming channels immediately. Do not wait for the formal iteration cycle in Step 7 to make obvious budget allocation shifts.

## Failure Handling

- **Step 1 fails (market too small or too competitive):** If market research reveals the total addressable market is too small to support the business or the competitive landscape is dominated by entrenched players with no clear gap, do not proceed. Options: (a) pivot the target segment to an adjacent market with less competition, (b) narrow the product focus to a specific niche the competitors underserve, or (c) redefine the product concept entirely. This is the cheapest point to pivot -- every subsequent step increases sunk cost.

- **Step 2 scope creep delays launch:** If the PRD grows beyond what can be built in the timeline, apply the MoSCoW method ruthlessly. Move everything except the top 3 must-have features to post-launch. A launched product with 3 features beats an unlaunched product with 15 features every time. The post-launch iteration in Step 7 handles feature expansion based on real customer data.

- **Step 4 reveals fundamental positioning problem (direction change):** If the soft launch shows that customers do not understand the product's value (high traffic but near-zero conversions), the problem is in Step 3's positioning, not Step 4's execution. Pause the launch. Return to Step 3 with the soft launch data as new input. Re-test revised messaging with a small audience before resuming the full launch. This is the most common mid-workflow direction change.

- **Step 5 finds sales team unprepared:** If the sales team cannot articulate the product's value proposition or handle common objections after receiving the playbook, the problem may be in Step 3's messaging clarity, not the sales team's competence. Schedule a joint session between marketing (Step 3 owner) and sales to align on messaging. Revise the playbook with sales team input.

- **Step 6 shows metrics below threshold:** If launch metrics are below the success criteria defined in Step 2 by more than 50%, escalate to Step 7 immediately with a focus on diagnosing root cause rather than optimizing incrementally. Below-threshold performance usually indicates a strategic problem (wrong segment, wrong channel, wrong price), not a tactical one (headline copy, ad creative).

- **User wants to change direction mid-workflow:** If the direction change occurs before Step 4 (pre-launch), the cost is primarily time and planning effort. Restart from the step that introduced the new direction. If the direction change occurs after Step 4 (post-launch), all launch materials, sales enablement, and initial analytics are sunk costs. Evaluate whether the pivot requires a full relaunch (Steps 1-7) or can be addressed through the iteration cycle (Step 7).

## Expected Outcome

When this workflow is complete, the user will have:

1. Validated market research confirming the target segment, competitive position, and customer needs
2. A scoped product requirements document with clear launch criteria and success metrics
3. A go-to-market strategy with positioning, channels, pricing, and launch timeline
4. A completed launch with all pre-launch, launch-day, and post-launch tasks executed
5. A sales playbook equipping the team to convert launch interest into revenue
6. An analytics report measuring actual performance against success metrics
7. A post-launch experimentation plan for continuous improvement based on real data

## Edge Cases

- **User is launching a free product or open-source project.** Steps 5 (sales enablement) and pricing elements of Step 3 are significantly simplified. Replace revenue metrics in Step 2 with adoption metrics (downloads, active users, community contributions). The analytics in Step 6 focuses on activation and retention rather than conversion to revenue.
- **User is a solo founder with no team.** Collapse Steps 4 and 5 into a single execution step. The solo founder is both the marketer and the salesperson. Simplify the launch checklist to tasks one person can execute in a single day. Extend the timeline to account for sequential execution of tasks that teams would parallelize.
- **User is launching a product update, not a new product.** Skip Step 1 (market research exists from the original launch). Start at Step 2 with a reduced PRD focused on the delta between old and new. Steps 3-7 still apply but with existing customer communication (update emails, changelog) as the primary channel rather than new customer acquisition.
- **User is relaunching after a failed first launch.** Step 1 must include a post-mortem of the first launch failure. Steps 2-3 should explicitly address what changed (new features, new positioning, new channels) and why it will work this time. Avoid repeating the same channels and messaging that failed the first time.
- **Product requires regulatory approval before launch.** Insert a regulatory compliance checkpoint between Steps 2 and 3. The GTM strategy in Step 3 must account for the approval timeline, and the launch checklist in Step 4 must include regulatory sign-off as a hard gate before any public announcement.

## Example

**Input:** "We are a 5-person B2B SaaS startup launching a project management tool for remote design teams. We have a working beta with 30 users. We are bootstrapped with a $10,000 marketing budget and want to launch in 6 weeks."

**Output:**

## Product Launch Plan: DesignFlow

### Market Research Summary
- **Target Segment:** Remote design teams at companies with 10-100 employees, currently using generic PM tools (Asana, Monday) that lack design-specific workflows
- **Market Size:** SAM of 45,000 design teams in the target company size range
- **Competitive Position:** Niche alternative to generic PM tools; competes on design workflow specificity rather than feature breadth
- **Validated Needs:** (1) Design review workflows with version comparison, (2) Asset handoff tracking between designers and developers, (3) Sprint planning adapted for creative work (less rigid than engineering sprints)
- **Invalidated Assumptions:** Initial assumption that freelance designers are a target segment was invalidated -- freelancers prefer lightweight tools with no team overhead

### Product Definition
- **Launch Scope:** Design review workflows, asset handoff tracking, team dashboard (3 must-have features from beta feedback)
- **Success Metrics:**
  - 200 signups by week 2 post-launch
  - 50 activated teams (completed onboarding) by week 4
  - 15% trial-to-paid conversion by week 8
- **Launch Criteria:** All 3 core features stable, onboarding flow tested with 10 beta users, pricing page live

### Go-to-Market Strategy
- **Positioning:** "Project management built for how design teams actually work"
- **Primary Channel:** Design community content (Dribbble, Figma Community, design Slack groups) -- low cost, high intent audience
- **Pricing:** $12/user/month (positioned below Asana Business at $25, above free tools)
- **Launch Timeline:** Pre-launch weeks 1-4 (beta testimonials, waitlist, content) | Launch day week 5 | Post-launch weeks 6-8

### Launch Checklist Status
- Pre-launch: 18/18 tasks complete (landing page, email sequences, 5 beta testimonials, 3 community posts scheduled)
- Launch day: Scheduled for Monday 9 AM ET
- Post-launch: 12 tasks queued (follow-up emails, design community AMAs, beta user referral program)

### Sales Enablement
- **Elevator Pitch:** "DesignFlow is project management built for design teams -- design reviews, asset handoffs, and creative sprints in one tool, at half the price of generic PM software."
- **Top Objections Addressed:** 5 (switching cost, Figma integration, team size limits, data migration, pricing vs free alternatives)
- **Competitive Comparisons:** 3 competitors covered (Asana, Monday, Linear)

### Analytics Report (Week 2)
- **Overall:** On track -- signups ahead of target, activation below target
- **Key Metrics vs Target:**
  | Metric                    | Target | Actual | Status |
  |---------------------------|--------|--------|--------|
  | Signups (week 2)          | 200    | 247    | Met    |
  | Activated teams (week 2)  | 25     | 18     | Behind |
  | Design community referrals| 50     | 72     | Met    |
- **Best Channel:** Figma Community post (4.2% signup conversion rate)
- **Worst Channel:** Twitter/X ads (0.3% conversion -- paused spend)

### Post-Launch Experiments
| Priority | Experiment                    | Hypothesis                                         | Impact | Status  |
|----------|------------------------------|-----------------------------------------------------|--------|---------|
| 1        | Onboarding flow simplification| Reducing setup steps from 7 to 4 increases activation by 30% | High   | Running |
| 2        | Community-led demo sessions   | Live demos convert 3x better than self-serve trial  | High   | Planned |
| 3        | Annual pricing option         | Offering 20% annual discount increases trial-to-paid by 5pp | Medium | Planned |
