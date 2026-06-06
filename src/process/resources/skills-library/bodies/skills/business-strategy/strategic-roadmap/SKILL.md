---
name: strategic-roadmap
description: |
  Produces a narrative and visual-ready strategic roadmap using horizon
  planning with 3-5 time-bounded phases, strategic themes, milestones,
  and resource allocation. Use when the user asks to create a strategic
  roadmap, plan multi-year strategy, structure long-term business goals,
  or define a phased growth plan with milestones.
  Do NOT use for product feature roadmap (use product-roadmap in product
  management), quarterly OKR setting (use okr-setting), or business plan
  with financial projections (use business-plan).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "strategy planning project-management"
  category: "business-strategy"
  subcategory: "strategy-planning"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---
# Strategic Roadmap

## When to Use

Use this skill when the user's request matches one of these specific scenarios:

- The user asks to build a multi-year strategic roadmap for a company, business unit, or division -- typically spanning 1-5 years with phased milestones
- The user wants to structure long-term business ambitions (reaching a new revenue tier, entering a new market, shifting business model) into a sequenced execution plan
- The user needs to communicate strategic direction to multiple audiences -- board, investors, leadership, and employees -- and wants a structured narrative framework
- The user is conducting an annual or biannual strategic planning cycle and needs to translate strategic themes into a time-bound execution architecture
- The user wants to use horizon planning (H1/H2/H3) to explicitly separate optimization work from growth bets from future exploration, with distinct investment allocations
- The user is preparing for a board presentation, fundraise, or strategic offsite and needs a credible, structured view of where the organization is going and how it will get there
- The user wants to align a leadership team around shared priorities, sequence decisions, and surface dependencies between major strategic initiatives

**Do NOT use this skill when:**

- The user wants to plan product features and releases by sprint or quarter -- use `product-roadmap`, which handles feature sequencing, tech debt, and release planning at the product level
- The user is setting quarterly OKRs for teams -- use `okr-setting`, which structures key results with measurement cadences at the team and individual level
- The user needs a business plan with financial projections, unit economics, or a funding narrative -- use `business-plan`, which handles pro forma financials, market sizing, and investor storytelling
- The user is doing a post-mortem or retrospective on a past strategy -- use `retrospective-analysis`, which focuses on what happened versus what was planned
- The user needs a project plan with task-level Gantt dependencies -- use `project-plan`, which handles work breakdown structures and day-to-day execution sequencing
- The user wants to evaluate whether to pursue a specific strategic option -- use `strategic-options-analysis`, which compares alternatives using scenario modeling

---

## Process

### Step 1: Gather Strategic Context Before Producing Anything

Never begin building the roadmap without these inputs. If any are missing, ask explicitly before proceeding -- a roadmap built on assumed context will fail validation with the user's leadership team.

- **Organization baseline:** Current ARR or revenue, team headcount, number of products or business lines, primary customer segment, and geographic presence. These ground the feasibility of H2/H3 initiatives.
- **Strategic vision:** The north star -- a single crisp statement of where the organization intends to be at the end of the roadmap horizon. It must be specific enough to exclude options (e.g., "the operating system for independent insurance brokers in North America" is a vision; "a leading platform in our space" is not).
- **Time horizon:** Confirm whether the user wants a 1-year, 2-year, 3-year, or 5-year roadmap. Time horizon determines how far H3 experiments extend and how much uncertainty to carry explicitly.
- **Strategic themes:** Ask the user for 3-5 named strategic priorities. If the user lists more than 5, flag this as a focus problem and work with them to consolidate. Themes should name the strategic bet, not a function (e.g., "international expansion" not "marketing").
- **Constraints:** Budget envelope or funding horizon, key hires planned or blocked, regulatory deadlines, partner dependencies, product infrastructure limitations.
- **Audience for this version:** Board/investors, leadership team, all-employees, or a specific external partner. The same underlying roadmap produces different communication outputs for each audience.
- **Known change events:** Series rounds, acquisitions, product launches, leadership changes, or market events (e.g., a competitor's known product release) that anchor timing decisions.

---

### Step 2: Define the Three Horizons With Precision

The Three Horizons framework originated at McKinsey and has been refined significantly in practice. Use it rigorously, not loosely. Each horizon has a distinct management logic, not just a different timeline.

- **Horizon 1 -- Defend and optimize the core:** Focus is on protecting and extracting full value from existing revenue-generating activities. Typical time frame: months 0-12 for a 3-year roadmap, months 0-8 for a 2-year roadmap. Key management actions: process optimization, sales efficiency, pricing refinement, churn reduction, cost restructuring. Success is measured by operational metrics. Typical investment share: 60-70% of total resources.
- **Horizon 2 -- Scale emerging and adjacent opportunities:** Focus is on businesses or models that are beginning to generate revenue or have cleared proof-of-concept. Typical time frame: months 6-24 for a 3-year roadmap. Key management actions: hiring for new capability, channel expansion, geographic expansion, new customer segment penetration, partnership scaling. Success is measured by growth metrics -- new ARR from new segments, revenue from new geographies, adoption in new channels. Typical investment share: 20-30%.
- **Horizon 3 -- Create future options:** Focus is not on generating revenue but on creating strategic optionality. Experiments, R&D investments, early-stage pilots, market sensing, and capability building that positions the organization for a future that does not yet exist. Typical time frame: months 12-36+. Key management actions: small funding of experiments, partnership exploration, talent acquisition for future capabilities, acquisitions of early-stage companies or IP. Success is measured by learning metrics -- number of validated hypotheses, pilot results, options created. Typical investment share: 5-15%.
- **Investment allocation must always sum to 100%.** State it explicitly in the output. A 70/20/10 split is a reasonable default for an established business. A 50/30/20 split signals aggressive transformation. An 85/10/5 split signals a business focused on defense.
- **H1 and H2 overlap deliberately.** H2 work should begin while H1 is still running -- typically at the 6-month mark. This overlap is intentional and must appear in the timeline, not as an error.

---

### Step 3: Structure Each Horizon With Themes, Initiatives, and Milestones

This is where most roadmaps fail. Themes are strategic categories. Initiatives are the specific programs of work. Milestones are binary checkpoints that prove an initiative delivered.

- **Name themes precisely.** A theme should describe the strategic outcome being pursued, not the department responsible. "Customer retention" is a theme. "Customer success team" is not. "Platform interoperability" is a theme. "Engineering roadmap" is not.
- **Each initiative needs five attributes:** (1) a specific name that describes the work, (2) a named owner (role, not team), (3) a quarter-based timeline (Q1-Q3, not "mid-year"), (4) a milestone that is binary -- it either happened or it didn't -- and (5) the estimated resource requirement in headcount or budget percentage.
- **Limit initiatives per theme.** No theme should have more than 5 initiatives per horizon. If a theme has more, it is either too broad or the initiatives are too granular. Reframe or consolidate.
- **Sequence initiatives deliberately.** Within a horizon, order initiatives by dependency. Infrastructure and capability-building initiatives come before market-facing initiatives that depend on them. A go-to-market initiative requiring a localized product cannot precede the localization initiative.
- **Distinguish between initiatives and projects.** An initiative is a strategic-level program of work that could span a team and multiple months. A project is a tactical execution unit within an initiative. The roadmap captures initiatives; project plans capture projects.
- **Use a standard milestone format:** verb + noun + quantifiable outcome. "Launch self-serve trial experience with >500 signups in first 30 days" is a milestone. "Self-serve done" is not.

---

### Step 4: Define Success Metrics With Horizon-Appropriate Measurement Logic

The most common error in strategic roadmaps is applying the same metric type across all horizons. Each horizon requires a fundamentally different measurement approach.

- **H1 metrics are operational and financial.** The business already knows how to measure these. Net revenue retention (NRR), gross margin percentage, customer acquisition cost (CAC) payback period, sales cycle length, employee attrition rate, operational cost as % of revenue. For SaaS businesses, NRR above 110% is the critical H1 signal of a healthy core.
- **H2 metrics are market penetration and growth-rate metrics.** Revenue from new segments, logo count in new geographies, growth rate of a new channel relative to the old channel, time to first value (TTFV) in a new motion (e.g., PLG versus sales-led). These metrics are expected to show high growth rates from a small base -- a new geographic market generating $500K from zero is a strong signal even if total contribution is small.
- **H3 metrics are learning and options metrics.** Number of experiments completed, number of hypotheses validated, ratio of pivots to kills to continues, time to learning (how quickly a pilot generates actionable signal). H3 does not have revenue targets -- attempting to hold H3 to revenue targets destroys exploration and creates incentives to pursue safe bets instead of high-variance experiments.
- **Every metric needs a baseline and a target.** "Increase retention" is not a metric. "Increase NRR from 102% to 115% by Q4" is a metric. If no baseline exists, the first H1 milestone should be establishing the measurement system.
- **Include leading indicators alongside lagging indicators.** A lagging indicator tells you what happened. A leading indicator tells you what is likely to happen. For each primary metric, identify one leading indicator that provides 6-8 weeks of forward signal. For ARR growth, a leading indicator is pipeline coverage ratio. For NRR, a leading indicator is customer health score trend.

---

### Step 5: Map Dependencies and Identify Critical Path

Strategic roadmaps fail in execution when dependencies are invisible. Making dependencies explicit is the primary mechanism for preventing sequencing disasters.

- **Identify four types of dependencies:** (1) Hard sequential -- initiative B cannot start until initiative A completes (e.g., international product localization must complete before international go-to-market launch); (2) Hard resource -- two initiatives compete for the same scarce resource (e.g., both require the same engineering team); (3) Soft knowledge -- initiative B benefits from learnings from initiative A but is not blocked (e.g., AI feature development benefits from data quality initiative learnings); (4) External dependencies -- partner decisions, regulatory approvals, market events outside the organization's control.
- **Surface cross-horizon dependencies.** The most critical dependencies are those where an H2 initiative depends on an H1 initiative. If the H1 initiative slips, the entire H2 timeline shifts. These must be called out explicitly and assigned escalation owners.
- **Define go/no-go gates.** At key decision points (typically end of each horizon's first quarter), define the conditions that must be met for H2 or H3 investment to be released. This prevents sunk-cost escalation on a failing H1 while still allowing H2 preparation to begin.
- **Identify the critical path.** The critical path is the sequence of dependent milestones that determines the earliest possible completion date for the roadmap's primary goal. If any milestone on the critical path slips, the goal date slips. Name the critical path explicitly.

---

### Step 6: Assess Risks and Define Pivot Triggers

A roadmap without a risk register and explicit pivot conditions is a wish list. Risks must be named, not euphemized.

- **For each horizon, identify 2-3 risks using the format:** Risk event + probability (low/medium/high) + impact if it materializes + mitigation action + early warning signal.
- **Distinguish between strategy risks and execution risks.** A strategy risk questions whether the direction is right (e.g., target market does not respond to PLG motion). An execution risk questions whether the plan can be delivered (e.g., key hire cannot be made in time). Both belong in the roadmap but require different responses.
- **Define pivot triggers explicitly using the format:** "If [observable condition] by [date/milestone], then [specific strategic response]." Examples: "If NRR does not improve from 102% to 108% by Q2, conduct a full customer success model review before releasing H2 investment." "If international pilot does not reach 10 paying logos by Q5, reduce H2 international allocation by 50% and redirect to US expansion."
- **Set a roadmap review cadence.** For a 2-3 year roadmap, quarterly reviews of H1/H2 metrics and a semi-annual full roadmap review are standard. For a 1-year roadmap, monthly reviews of H1 metrics and a quarterly full review.
- **Include a resource reallocation rule.** Define explicitly what would trigger shifting budget from H3 to H1 (e.g., a revenue shortfall of >15% against plan) and what would trigger accelerating H2 (e.g., a competitive threat that shortens the window for a market bet).

---

### Step 7: Build the Communication Narrative

The strategic roadmap is not only a planning artifact -- it is a communication tool. The narrative frame determines whether people understand the strategy or just see a table of initiatives.

- **Write the strategic narrative in three paragraphs.** Paragraph 1: Where we are today (current state + core challenge or opportunity). Paragraph 2: What we are doing about it (the three-horizon plan in plain language, naming the major bets). Paragraph 3: What success looks like (the vision realized with specific outcomes).
- **Board/investor version:** Lead with the primary financial goal and the date by which it will be achieved. Show the investment allocation as a capital deployment decision. Present milestones as evidence of progress toward the financial goal. Remove initiative-level detail.
- **Leadership team version:** Full initiative detail, named owners, dependencies, metrics, and decision points. This is the operating version of the roadmap.
- **All-employees version:** Lead with the "why" before the "what." Connect each strategic theme to purpose and customer impact. Name the themes and their outcomes without initiative-level detail. Show employees how their current work connects to H1 outcomes.
- **Visual-ready format guidance:** The narrative roadmap produces a table-based structure that can be directly transferred into a swimlane Gantt (tools like Miro, Lucidchart, or PowerPoint), a horizon-column layout, or a timeline view. Structure the output so that columns map cleanly to quarters and rows map to themes.

---

### Step 8: Validate Internal Consistency Before Delivering

Before presenting the roadmap, run these consistency checks:

- Investment allocation sums to 100%
- Every initiative has a named owner, a quarter-based timeline, and a binary milestone
- No strategic theme appears in more than two horizons (themes evolve from H1 to H2, not persist identically across all three)
- Metrics differ by horizon type (operational in H1, growth in H2, learning in H3)
- At least one H2 initiative has a named H1 dependency
- The vision statement is specific enough to exclude alternatives
- The total number of strategic themes is 3-5 (never more)
- At least one pivot trigger is defined

---

## Output Format

```
## Strategic Roadmap: [Organization Name]

**Vision:** [Single specific statement of where the organization intends to be at roadmap completion]
**Time Horizon:** [X years / X quarters]
**Current State:** [Revenue, team size, market position, business model]
**Primary Goal:** [The single most important outcome this roadmap achieves]
**Created:** [Date]
**Audience:** [Board | Leadership Team | All-Employees | Investors]

---

### Strategic Narrative

[Paragraph 1 -- Where we are today: current state, core challenge or opportunity driving the strategy]

[Paragraph 2 -- What we are doing: the three-horizon plan in plain language, naming the major bets and their sequencing logic]

[Paragraph 3 -- What success looks like: the vision realized with specific outcomes by roadmap completion]

---

### Investment Allocation

| Horizon | Strategic Focus | % of Resources | Time Frame | Investment Rationale |
|---------|----------------|---------------|------------|---------------------|
| H1: Core | [Defend and optimize what generates revenue today] | [60-70%] | [Months 0-12] | [Why this % is right given current state] |
| H2: Growth | [Scale the bets that are beginning to prove out] | [20-30%] | [Months 6-24] | [Why this % and why starting now] |
| H3: Future | [Create strategic options for the next era] | [5-15%] | [Months 12-36+] | [What options we are creating and why] |
| **Total** | | **100%** | | |

---

### Strategic Themes Overview

| Theme | Horizon(s) | Strategic Objective | Primary Metric |
|-------|-----------|---------------------|---------------|
| [Theme 1] | H1 | [What this theme achieves] | [How we measure success] |
| [Theme 2] | H1, H2 | [What this theme achieves] | [How we measure success] |
| [Theme 3] | H2 | [What this theme achieves] | [How we measure success] |
| [Theme 4] | H2, H3 | [What this theme achieves] | [How we measure success] |
| [Theme 5] | H3 | [What this theme achieves] | [How we measure success] |

---

### Horizon 1: [Name the Core Bet] (Months 0-12 / Q1-Q4)

**Goal:** [Specific, measurable outcome at end of H1 -- e.g., "Reach $X ARR at >Y% NRR through sales efficiency and retention improvements"]
**Investment:** [X% of total resources / $Xm / X FTEs]

#### Initiatives

| Theme | Initiative | Owner (Role) | Timeline | Milestone | Resource |
|-------|-----------|-------------|----------|-----------|----------|
| [Theme 1] | [Specific initiative name] | [VP/Director/Lead role] | Q1-Q2 | [Binary deliverable with number] | [X FTEs / $X] |
| [Theme 1] | [Specific initiative name] | [Role] | Q1-Q3 | [Binary deliverable] | [Resource] |
| [Theme 2] | [Specific initiative name] | [Role] | Q2-Q4 | [Binary deliverable] | [Resource] |
| [Theme 2] | [Specific initiative name] | [Role] | Q1-Q4 | [Binary deliverable] | [Resource] |

#### Success Metrics

| Metric | Metric Type | Baseline | Target (Month 12) | Leading Indicator | Measurement Frequency |
|--------|------------|---------|-------------------|-------------------|-----------------------|
| [e.g., Net Revenue Retention] | Lagging | [X%] | [Y%] | [Customer health score trend] | Monthly |
| [e.g., CAC Payback Period] | Lagging | [X months] | [Y months] | [Pipeline coverage ratio] | Monthly |
| [e.g., Gross Margin %] | Lagging | [X%] | [Y%] | [Support cost per customer trend] | Quarterly |

---

### Horizon 2: [Name the Growth Bet] (Months 6-24 / Q3-Q8)

**Goal:** [Specific, measurable outcome at end of H2 -- e.g., "Generate $Xm ARR from [new segment/geography/channel]"]
**Investment:** [X% of total resources]
**H1 Dependencies:** [Which H1 initiatives must complete before H2 begins, and their planned completion date]

#### Initiatives

| Theme | Initiative | Owner (Role) | Timeline | Milestone | Dependency |
|-------|-----------|-------------|----------|-----------|-----------|
| [Theme 3] | [Specific initiative name] | [Role] | Q3-Q5 | [Binary deliverable with number] | [H1 initiative it depends on] |
| [Theme 3] | [Specific initiative name] | [Role] | Q5-Q8 | [Binary deliverable] | [Dependency] |
| [Theme 4] | [Specific initiative name] | [Role] | Q4-Q7 | [Binary deliverable] | [Dependency] |

#### Go/No-Go Gate

**Gate Date:** [End of Q[X]]
**Required Conditions to Release H2 Investment:**
- [H1 metric 1] must be at or above [threshold]
- [H1 initiative] must be complete
- [External condition, if applicable]

**If gate conditions are not met:** [Specific contingency -- delay H2 by X months, redirect X% to H1, or pursue alternative H2 initiative]

#### Success Metrics

| Metric | Metric Type | Target (Month 24) | Leading Indicator | Measurement Frequency |
|--------|------------|-------------------|-------------------|-----------------------|
| [e.g., ARR from new geography] | Growth | [$Xm] | [Logo count in new market] | Monthly |
| [e.g., PLG-sourced ARR %] | Growth | [X%] | [Trial-to-paid conversion rate] | Weekly |

---

### Horizon 3: [Name the Future Bet] (Months 12-36 / Q5+)

**Goal:** [Options created, not revenue generated -- e.g., "Validate AI-powered analytics as a viable product direction with >3 paying design partners"]
**Investment:** [X% of total resources]
**Character:** [Exploratory | R&D | Market-sensing | Acquisition-ready]

#### Experiments and Investments

| Theme | Initiative / Experiment | Owner (Role) | Timeline | Learning Goal | Success Condition |
|-------|------------------------|-------------|----------|---------------|-------------------|
| [Theme 4/5] | [Experiment name] | [Role] | Q5-Q7 | [Specific hypothesis being tested] | [What result proves the hypothesis] |
| [Theme 5] | [Experiment name] | [Role] | Q6-Q10 | [Hypothesis] | [Success condition] |

#### Learning Metrics

| Metric | Target | What a Good Result Looks Like |
|--------|--------|-------------------------------|
| Experiments completed | [X] | All experiments return actionable signal within 60 days |
| Hypotheses validated | [X of Y] | At least [X]% of hypotheses validated or productively killed |
| Design partners enrolled | [X] | [X] design partners active with measurable usage |

---

### Dependencies Map

| Initiative | Depends On | Dependency Type | Risk if Dependency Slips |
|-----------|-----------|----------------|--------------------------|
| [H2 Initiative] | [H1 Initiative] complete | Hard sequential | H2 launch delays by [X months] |
| [H2 Initiative] | [H1 Initiative] learnings | Soft knowledge | H2 enters market without key positioning data |
| [H3 Experiment] | [H2 Initiative] infrastructure | Hard resource | H3 experiment cannot run without [X capability] |
| [H2 Initiative] | [External: Partner/Regulatory] | External | Timeline entirely dependent on [party] |

**Critical Path:**
[Initiative A] (Q1-Q2) --> [Initiative B] (Q2-Q4) --> [H2 Launch Initiative] (Q5-Q7) --> [Primary Goal Achievement] (Q8)

---

### Risk Register

| Risk | Horizon | Probability | Impact | Mitigation | Early Warning Signal | Decision Point |
|------|---------|------------|--------|------------|---------------------|---------------|
| [Specific risk event] | H1 | Medium | [What happens if this materializes] | [Specific preventive or responsive action] | [Observable early signal] | [Date or milestone to review] |
| [Specific risk event] | H2 | High | [Impact] | [Mitigation] | [Signal] | [Decision point] |
| [Specific risk event] | H3 | Low | [Impact] | [Mitigation] | [Signal] | [Decision point] |

**Pivot Triggers:**
- If [observable condition] by [date/milestone], then [specific strategic response with resource reallocation]
- If [observable condition] by [date/milestone], then [specific strategic response]
- If [observable condition] by [date/milestone], accelerate [initiative] by [timeframe]

**Resource Reallocation Rules:**
- Shift H3 to H1 if: [condition, e.g., H1 ARR misses plan by >15% for two consecutive quarters]
- Accelerate H2 if: [condition, e.g., a direct competitor announces entry into target new market]
- Kill H3 experiment if: [condition, e.g., design partner pilot shows <20% activation rate at 30 days]

---

### Roadmap Review Schedule

| Review Type | Frequency | Participants | Inputs Required | Output |
|------------|-----------|-------------|----------------|--------|
| H1 Metrics Review | Monthly | Leadership team | H1 metric dashboard | Go/no-go signal on H2 gate |
| Full Roadmap Review | Quarterly | Leadership team + board | All horizon metrics, risk register | Roadmap adjustments, resource reallocation decisions |
| Annual Strategic Refresh | Annually | Leadership team | Competitive landscape, market data, H3 learnings | Updated roadmap for next period |

---

### Communication Summaries

**Board / Investor Version (3 sentences):**
[Primary financial goal] by [date]. We are investing [H1%] to protect and grow our core, [H2%] to enter [new market/motion/segment], and [H3%] to build options in [future area]. Key milestones: [H1 milestone] by [Q], [H2 milestone] by [Q], primary goal of [goal] by [final Q].

**Leadership Team Version (5 sentences):**
[Current state narrative]. Our H1 focus is [core theme] with [owner] driving [key initiative] to reach [H1 goal] by [date]. H2 begins in [quarter] when [H1 dependency] is complete, with [role] leading [H2 initiative] targeting [H2 goal]. H3 experiments in [theme] begin in [quarter] to validate [hypothesis]. The full leadership team reviews progress [monthly/quarterly] and the roadmap will be refreshed [date].

**All-Employees Version (2-3 sentences):**
[Purpose statement connecting strategy to why the company exists]. Over the next [X years], we are focused on three things: [Theme 1 in plain language], [Theme 2 in plain language], and [Theme 3 in plain language]. Your work on [H1 work] directly builds the foundation that makes everything else possible.
```

---

## Rules

1. **Never produce a roadmap without vision, current state, and time horizon.** These three inputs are non-negotiable. Without them, the initiative sequencing, investment allocation, and milestone targeting will be fabricated. Ask explicitly if any are missing.

2. **All three horizons must appear in every roadmap, even if H3 is minimal.** A roadmap with only H1 and H2 is an operating plan, not a strategic roadmap. H3 forces explicit acknowledgment that the current strategy will eventually require renewal. Even a single exploratory initiative counts as H3 if it creates future optionality.

3. **Investment allocation must sum to exactly 100% and be explicitly justified.** Do not produce a default 70/20/10 split without checking whether it fits the organization's strategic posture. A company in a burning competitive race may need 50/40/10. A company in turnaround may need 85/10/5. The allocation is a strategic decision, not a template default.

4. **Every initiative must have a named role-owner, a quarter-based timeline, and a binary milestone.** Initiatives without owners are aspirations, not commitments. Timelines stated as "mid-year" or "later in the period" are not acceptable -- pin them to a quarter. Milestones must be binary: either the deliverable exists or it does not.

5. **Strategic themes must be named for the strategic outcome, not the function or department.** "Revenue growth" is not a theme -- it is a goal that every theme should contribute to. "Market expansion into Southeast Asia" is a theme. "Product-led growth motion" is a theme. Naming themes after functions (e.g., "Engineering," "Marketing") confuses strategy with organizational structure.

6. **Never allow more than 5 strategic themes across the entire roadmap.** More than 5 themes is evidence that strategic prioritization has not occurred -- the organization is describing all of its activities rather than making choices. When a user presents more than 5, explicitly flag the problem and work to consolidate before proceeding.

7. **H1 metrics must be operational; H2 metrics must be growth-rate based; H3 metrics must be learning-based.** Applying ARR targets to H3 experiments destroys exploration. Applying learning metrics to H1 creates cover for operational underperformance. The measurement logic must match the nature of the work in each horizon.

8. **Cross-horizon dependencies must be made explicit and assigned an escalation owner.** The most dangerous roadmap failure mode is an H2 initiative that quietly depends on an H1 initiative that is slipping. Every H2 initiative with an H1 dependency must be named in the dependencies map with a clear statement of what happens to H2 if H1 slips.

9. **Pivot triggers must be specific and observable, not vague.** "If things aren't working" is not a pivot trigger. A pivot trigger must name a specific metric, a specific threshold, and a specific date or milestone -- and then prescribe a specific strategic response, not a generic review.

10. **The communication version must be adapted for the stated audience before delivery.** A board version that includes initiative-level detail with named FTE owners is the wrong artifact. An all-employees version that leads with financial metrics before purpose is the wrong artifact. If the user has not stated an audience, ask before producing the communication summary sections.

---

## Edge Cases

### Early-Stage Company (Pre-Revenue to $3M ARR)

At this stage, the Three Horizons framework applies differently. H1 is product-market fit -- the entire organization's survival depends on a single question: does this product solve a real problem well enough that customers pay for it and stay? H1 investment should be 80%+ of resources. H2 should be conditional -- articulate one growth bet that becomes relevant only after PMF is established (typically evidenced by NRR above 100% and CAC payback under 18 months in a cohort of at least 20 customers). H3 should be articulated as vision experiments only -- no meaningful investment until H1 is proven. Milestones in H1 should be PMF signals, not revenue targets: qualitative interview results, retention cohorts, and engagement metrics. Flag this in the roadmap explicitly: "H2 investment does not begin until [specific PMF signal] is achieved."

### Turnaround or Crisis Situation

When the organization is in distress (revenue declining, cash runway under 12 months, major customer losses), the standard horizon framework must be reconfigured around survival. H1 becomes stabilization: cash preservation, emergency cost reduction, retention of the most critical customers and talent. H2 becomes recovery: rebuilding the capabilities and customer trust lost during the crisis, reestablishing a growth engine. H3 becomes strategic renewal: identifying whether the original strategy should be resumed or whether the organization needs a fundamentally different direction. Investment allocation in a turnaround may be 90/8/2 -- nearly everything goes to stopping the bleeding. The roadmap must include a "runway gate" -- an explicit milestone at which point H2 investment is only released if the business has stabilized to a defined standard (e.g., monthly cash burn reduced to under $X, or NRR stabilized above 95%).

### Multi-Business-Unit Company

When the user's organization has multiple distinct business units or product lines, a single roadmap must sit at the portfolio level, not at the business unit level. The portfolio roadmap contains themes that cut across business units (e.g., "platform consolidation," "shared data infrastructure," "international expansion of the portfolio"). Each business unit should then have its own horizon plan that cascades from the portfolio roadmap. The output should include an explicit statement of how the portfolio-level themes translate into business-unit priorities. Do not attempt to merge business-unit-level initiative details into the portfolio roadmap -- it will become unmanageably large.

### Roadmap Without a Clear Vision Statement

If the user cannot provide a specific vision statement -- a clear description of where the organization intends to be at the end of the roadmap horizon -- do not fabricate one. Instead, surface this as a strategic prerequisite. Offer to help the user develop the vision statement first by asking: "What is the most important thing this organization needs to be true in [X years] that is not true today?" and "What would you be willing to give up in order to achieve that?" A roadmap built on an ambiguous vision will produce strategic drift because initiative prioritization requires a clear decision criterion.

### One-Year Compressed Roadmap

When the user only wants a 1-year roadmap, compress the Three Horizons into a quarterly structure rather than an annual one. H1 = Q1-Q2 (optimize and stabilize the core). H2 = Q2-Q3 (launch growth bets with clear metrics). H3 = Q3-Q4 (run 1-2 experiments that create optionality for the following year's H2). The investment logic still applies -- define the allocation even at this compressed scale. The critical adjustment is that go/no-go gates must be set at the 6-week mark within Q1, not at the end of Q1 -- a one-year roadmap cannot afford a full quarter of diagnostic delay.

### Highly Regulated Industry

When the user's organization operates in a regulated environment (financial services, healthcare, legal, energy), external dependencies -- regulatory approvals, compliance certifications, licensing timelines -- become first-class roadmap inputs, not footnotes. Map regulatory milestones into the initiative timeline directly. A regulatory approval process that takes 12-18 months effectively creates a hard constraint on when H2 market-facing initiatives can launch, regardless of internal readiness. Create a separate "regulatory timeline" row in the dependencies map and make it visible to every initiative it gates. Risk register entries for regulatory delays should carry high impact ratings by default.

### User Presents More Than 5 Strategic Themes

This is a prioritization failure, not a planning failure, and it requires direct intervention before building the roadmap. Say explicitly: "You have listed [X] themes. A strategic roadmap with more than 5 themes cannot be prioritized -- every theme competes with every other theme for resources and leadership attention. The purpose of a roadmap is to make choices, not list everything you want to do. Let's consolidate before proceeding." Offer a consolidation framework: group themes by the horizon they primarily belong to, then ask the user to name the single most important theme in each horizon. What remains after consolidation is the real strategy.

### Requesting a Visual-Ready Output

When the user indicates they want to present the roadmap in a visual format (PowerPoint, Miro, Lucidchart, Figma), annotate the output with visual-structuring guidance. Note which tables translate into swimlane Gantt rows, which initiative rows represent Gantt bars, and which milestones should be rendered as diamond-shaped gate markers. Recommend a color-coding convention: H1 in one color (typically blue), H2 in a second color (typically green), H3 in a third (typically orange or purple). Strategic themes become swimlane labels. This guidance is additive -- produce the full structured output first, then add a "Visual-Ready Notes" section at the end.

---

## Example

**Input:** "We're a $10M ARR B2B SaaS analytics platform for e-commerce retailers. 65 employees, US-focused, sales-led motion. We need a 3-year strategic roadmap. Our goal is $50M ARR. Three themes we care about: (1) build a self-serve product-led growth motion alongside our existing sales-led business, (2) expand internationally starting with the UK and Australia, (3) develop AI-powered predictive analytics capabilities. Audience is our leadership team."

---

## Strategic Roadmap: Omni Analytics

**Vision:** The analytics platform that every global e-commerce brand runs on -- the first system they open every morning, whether they have a 2-person team or 200.
**Time Horizon:** 3 years (12 quarters)
**Current State:** $10M ARR, 65 employees, US-market-only, 100% sales-led GTM, average ACV $80K, NRR 107%, CAC payback 22 months
**Primary Goal:** Reach $50M ARR with a diversified GTM (PLG + sales-led) and multi-geography presence by end of Year 3
**Created:** [Current date]
**Audience:** Leadership Team

---

### Strategic Narrative

Omni Analytics has built a defensible position in the US mid-market e-commerce analytics space with $10M ARR, a 107% NRR signal that proves real value delivery, and a sales-led motion that works but is capital-intensive and geographically constrained. The core challenge is that our current growth engine -- field sales into US mid-market -- cannot reach $50M ARR without a structural expansion. CAC payback at 22 months means we are capital-limited in how fast we can grow through sales alone, and we are entirely exposed to US market conditions with no international revenue diversification.

Our strategy operates on three horizons. In Year 1, we optimize the existing sales-led engine -- reducing CAC payback to under 18 months, improving NRR to 115%, and building the product data instrumentation that a PLG motion requires. This is not glamorous work, but without it, H2 and H3 collapse. In Year 2, we launch two major growth bets simultaneously: a self-serve trial experience targeting smaller e-commerce brands below our current ACV floor, and an international expansion starting with the UK (language-compatible, large e-commerce market) and Australia (shared timezone advantages for sales coverage). In Year 3, we deploy AI-powered predictive analytics -- demand forecasting, inventory optimization signals, customer churn prediction -- as a premium capability that increases ACV for existing accounts and creates a new acquisition channel for data-sophisticated buyers.

By the end of Year 3, $50M ARR comes from three sources: $30M from an optimized US sales-led + PLG combined motion, $12M from international markets, and $8M from AI-powered premium tier upsells. The business will have diversified its GTM risk, expanded its addressable market, and built a technical moat in predictive analytics that competitors cannot replicate quickly.

---

### Investment Allocation

| Horizon | Strategic Focus | % of Resources | Time Frame | Investment Rationale |
|---------|----------------|---------------|------------|---------------------|
| H1: Core Optimization | Optimize sales efficiency, NRR, and build PLG foundation | 65% | Months 0-12 (Q1-Q4) | Current engine must become capital-efficient before we can fund two major bets simultaneously |
| H2: Dual Growth Bets | Launch PLG self-serve + UK/Australia international | 25% | Months 9-24 (Q3-Q8) | PLG reduces CAC concentration risk; international diversifies geographic risk |
| H3: AI Premium Capability | Build and validate AI-powered predictive analytics | 10% | Months 18-36 (Q7-Q12) | Creates technical moat and ACV expansion path; requires data infrastructure from H1/H2 |
| **Total** | | **100%** | | |

---

### Strategic Themes Overview

| Theme | Horizon(s) | Strategic Objective | Primary Metric |
|-------|-----------|---------------------|---------------|
| Sales Engine Efficiency | H1 | Reduce CAC payback from 22 to under 16 months; improve NRR from 107% to 115% | NRR, CAC Payback Period |
| PLG Self-Serve Motion | H1 (foundation), H2 (launch) | Build and launch self-serve trial targeting <$20K ACV segment | PLG-sourced ARR as % of total |
| International Expansion | H2 | Generate $12M ARR from UK and Australia by Year 3 | International ARR |
| AI Predictive Analytics | H3 | Validate and launch premium predictive analytics tier with >$120K ACV | Premium tier ARR, ACV uplift |

---

### Horizon 1: Optimize the Core Engine (Q1-Q4, Year 1)

**Goal:** Reach $16M ARR by end of Q4 with NRR at or above 113%, CAC payback under 18 months, and PLG infrastructure operational
**Investment:** 65% of total resources / approximately 42 FTE-equivalents and $6.5M operating budget

#### Initiatives

| Theme | Initiative | Owner (Role) | Timeline | Milestone | Resource |
|-------|-----------|-------------|----------|-----------|----------|
| Sales Engine Efficiency | Redesign ICP scoring and outbound playbook with top-performer analysis | VP Sales | Q1-Q2 | New ICP scoring model live; outbound pipeline coverage at 3x quota | 2 FTE (RevOps + Sales Enablement) |
| Sales Engine Efficiency | Hire and ramp 5 mid-market AEs with $900K individual quotas | VP Sales | Q1-Q3 | 5 AEs hired, onboarded, and carrying full pipelines by Q3 | 5 FTE |
| Sales Engine Efficiency | Implement revenue operations tooling (CRM hygiene + forecasting model) | VP RevOps | Q1-Q2 | Forecast accuracy within 10% variance for two consecutive months | 1 FTE + $80K tooling |
| NRR Improvement | Build customer health scoring model with 6-week leading indicator signal | VP Customer Success | Q1-Q2 | Health scores live for 100% of accounts; at-risk accounts identified | 2 FTE (CS Ops + Data) |
| NRR Improvement | Launch structured QBR program for top 60 accounts by ARR | VP Customer Success | Q2-Q4 | 90% of top-60 accounts in active QBR cycle by Q4 | 3 FTE (CSMs) |
| PLG Foundation | Instrument product with usage analytics (event tracking, activation funnel) | VP Product | Q1-Q3 | 100% of core product flows tracked; activation funnel baseline established | 3 FTE (Engineering + Product) |
| PLG Foundation | Design and build self-serve trial environment (sandboxed, no sales required) | VP Product + VP Engineering | Q2-Q4 | Trial environment live; internal dogfooding complete; first external beta cohort of 20 | 6 FTE (Engineering) |

#### Success Metrics

| Metric | Metric Type | Baseline | Target (Month 12) | Leading Indicator | Frequency |
|--------|------------|---------|-------------------|-------------------|-----------| 
| ARR | Lagging | $10M | $16M | Monthly new ARR bookings vs. plan | Monthly |
| Net Revenue Retention | Lagging | 107% | 113% | Customer health score trend (% accounts at green) | Monthly |
| CAC Payback Period | Lagging | 22 months | 18 months | New logo ACV vs. fully loaded acquisition cost | Quarterly |
| Sales-qualified pipeline coverage | Leading | 2.1x quota | 3.0x quota | Outbound activity rates by AE | Weekly |
| Product activation rate (existing users) | Leading | Baseline TBD (Q1) | 60% activate within 14 days of provisioning | Feature adoption by cohort | Monthly |

---

### Horizon 2: Launch Dual Growth Bets (Q3-Q8, Months 9-24)

**Goal:** Generate $8M ARR from PLG self-serve and $5M ARR from UK/Australia by end of Q8; combined new-motion ARR of $13M representing 26% of total
**Investment:** 25% of total resources
**H1 Dependencies:** PLG trial environment must be live (Q4 milestone) before PLG GTM launch (Q5). UK product localization (GDPR compliance, GBP pricing) must complete before UK GTM launch. International legal entity formation must begin Q2 to be ready for Q5 operations.

#### Initiatives

| Theme | Initiative | Owner (Role) | Timeline | Milestone | Dependency |
|-------|-----------|-------------|----------|-----------|-----------|
| PLG Self-Serve Motion | Launch PLG self-serve with freemium-to-paid conversion targeting $0-$20K ACV segment | VP Growth | Q5-Q6 | 500 trial signups in first 30 days; trial-to-paid conversion >8% by day 90 | PLG trial environment (Q4 H1 milestone) |
| PLG Self-Serve Motion | Build in-product upgrade and expansion flows (usage-triggered upsells) | VP Product | Q5-Q7 | In-product upgrade flows drive 15% of new PLG revenue without sales assist | PLG usage instrumentation live (Q3 H1 milestone) |
| PLG Self-Serve Motion | Hire PLG-specific growth team (Growth PM, Growth Engineer, Content) | VP Growth | Q4-Q5 | Team hired and onboarded; 90-day growth experiment backlog defined | None (can begin Q4) |
| International Expansion | UK entity formation and GDPR compliance certification | CFO + Legal | Q2-Q5 | UK legal entity operational; data processing agreements compliant | None (begin immediately in H1) |
| International Expansion | UK product localization (GBP pricing, GDPR data residency, UK-specific integrations) | VP Engineering | Q3-Q5 | UK instance live with data residency in London region; 3 UK-native integrations available | Legal entity (Q5 dependency) |
| International Expansion | UK GTM launch: hire 2 UK-based AEs and 1 UK CSM | VP Sales (International) | Q5-Q6 | 2 AEs and 1 CSM hired; first 10 UK logos signed by Q7 | UK product localization (Q5) |
| International Expansion | Australia GTM launch (follow-on to UK learnings) | VP Sales (International) | Q7-Q8 | First 5 Australia logos signed by Q8 | UK GTM results inform playbook; Q6 review |

#### Go/No-Go Gate

**Gate Date:** End of Q4 (Month 12)
**Required Conditions to Release Full H2 Investment:**
- NRR is at or above 110% (not yet at 113% target, but trending correctly)
- CAC payback is at or below 20 months (trending toward 18-month target)
- PLG trial environment is live and internal dogfooding has produced an activation rate signal
- UK legal entity formation has been initiated (this has a 6-month lead time and cannot wait for a Q4 gate)

**If gate conditions are not met:** If NRR is below 105% at Q4, delay PLG launch by one quarter and redirect 10% of H2 budget to H1 CS capabilities. If PLG trial environment is not live, delay PLG GTM launch by one quarter -- do not launch a broken trial experience.

#### Success Metrics

| Metric | Metric Type | Target (Month 24) | Leading Indicator | Frequency |
|--------|------------|-------------------|-------------------|-----------| 
| PLG-sourced ARR | Growth | $8M | Trial signup volume + trial-to-paid conversion rate | Weekly (signups), Monthly (ARR) |
| International ARR (UK + AU) | Growth | $5M | Logo count + average ACV in new markets | Monthly |
| PLG trial-to-paid conversion | Growth | >10% at 90 days | Day-14 activation rate within trial | Weekly |
| International NRR (UK) | Growth | >105% (early signal) | UK customer health score trend | Monthly |

---

### Horizon 3: AI Predictive Analytics Premium Tier (Q7-Q12, Months 18-36)

**Goal:** Validate AI predictive analytics as a premium capability by Q10; launch to general availability by Q11; generate $5M ARR from premium tier by Q12 with ACV uplift of >$40K per upgraded account
**Investment:** 10% of total resources
**Character:** Exploratory through Q9, productized from Q10

#### Experiments and Investments

| Theme | Initiative / Experiment | Owner (Role) | Timeline | Learning Goal | Success Condition |
|-------|------------------------|-------------|----------|---------------|-------------------|
| AI Predictive Analytics | Recruit 6 design partners from existing enterprise accounts for demand forecasting pilot | VP Product + VP CS | Q7-Q8 | Does AI-powered demand forecasting reduce stockout rate by >20% for pilot accounts? | 6 design partners active; >4 of 6 show measurable stockout reduction |
| AI Predictive Analytics | Build demand forecasting MVP using account transaction data (internal ML team) | VP Engineering (ML lead) | Q7-Q9 | Can we build a model that achieves >80% forecast accuracy at 30-day horizon with standard e-commerce data? | Model accuracy validated against held-out data; design partners confirm utility |
| AI Predictive Analytics | Pilot customer churn prediction module with top 20 CS-managed accounts | VP CS + VP Product | Q8-Q9 | Does a churn prediction model surfaced to CSMs improve 60-day save rate vs. current health scoring? | Save rate improves by >15% in pilot group vs. control |
| AI Predictive Analytics | Define and validate premium tier pricing (ACV uplift + packaging) | VP Revenue + VP Product | Q9-Q10 | What premium price point maximizes revenue while maintaining >60% attach rate among qualifying accounts? | Pricing model validated with >3 design partner commitments at target price |
| AI Predictive Analytics | GA launch of AI Premium tier with in-product upgrade flow | VP Product + VP Growth | Q11 | Launch | $1M ARR committed at launch; >20 accounts upgraded in first 60 days |

#### Learning
