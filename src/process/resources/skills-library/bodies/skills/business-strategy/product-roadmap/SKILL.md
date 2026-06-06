---
name: product-roadmap
description: |
  Creates product roadmaps using the Now/Next/Later framework with themes, initiatives, rationale, and stakeholder communication structure. Use when the user asks about product roadmaps, feature prioritization timelines, product planning, roadmap presentations, or quarterly planning.
  Do NOT use for project timelines with Gantt charts, sprint planning (use user-story-writing), strategic business roadmaps (use strategic-roadmap), or prioritization scoring (use prioritization-framework).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "planning strategy agile project-management template"
  category: "business-strategy"
  subcategory: "product-management"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Product Roadmap

## When to Use

**Use this skill when:**
- A user asks to create or restructure a product roadmap for any audience -- engineering teams, executives, customers, investors, or board members
- A user needs to organize a backlog of features, initiatives, or investments into a Now/Next/Later or quarterly framework with strategic rationale
- A user wants to communicate product strategy and sequencing decisions to stakeholders with clear business justification
- A user is preparing for quarterly planning, annual planning, or a mid-year roadmap review and needs to align priorities across teams
- A user needs a roadmap to resolve disagreements between stakeholders about what gets built next and in what order
- A user is building a new product and needs a roadmap structure to guide early discovery and validation work
- A user wants to present a roadmap at an investor meeting, board review, or company all-hands and needs the framing and narrative to hold up under scrutiny
- A user has an existing roadmap that has drifted from business goals and needs a structured reset

**Do NOT use this skill when:**
- The user needs to score and numerically rank individual features using weighted criteria such as RICE, ICE, or Kano -- use `prioritization-framework` instead
- The user needs sprint-level story breakdown, acceptance criteria, or engineering task decomposition -- use `user-story-writing` instead
- The user needs a strategic business roadmap covering company-level initiatives, OKRs, hiring plans, or market expansion -- use `strategic-roadmap` instead
- The user needs a detailed Product Requirements Document (PRD) for a specific initiative -- use `prd-writing` instead
- The user is asking for a Gantt chart, project timeline with milestones and owners, or a critical-path analysis -- use a project-management skill instead
- The user needs to run a discovery sprint, job-to-be-done analysis, or user research plan -- those are inputs to this process, not the process itself

---

## Process

### 1. Gather Roadmap Context Before Writing Anything

Do not produce a roadmap without enough context. Ask clarifying questions if any of the following are missing:

- **Product identity:** What is the product? Who are its users? Is it B2B SaaS, B2C app, internal tooling, hardware-plus-software, marketplace, API platform, or something else? The framing changes dramatically by product type.
- **Product stage:** Early-stage (pre-product-market-fit), growth (scaling a working model), or mature (optimizing and defending)? Stage determines how specific "Later" items should be and how much the roadmap should emphasize discovery vs. delivery.
- **North star metric:** What is the single metric the product most needs to move? Examples by stage -- early-stage: "weekly active users or activation rate"; growth: "net revenue retention or expansion revenue"; mature: "gross margin or NPS". Every initiative on the roadmap should connect to this metric directly or indirectly.
- **Audience for this roadmap:** Is this for the engineering team (needs technical detail), leadership/board (needs business impact and strategic alignment), customers (needs outcome language, no jargon), or investors (needs market positioning and growth signal)? The same underlying content needs different presentation layers.
- **Team capacity:** How many engineers, designers, and PMs are available? What percentage of engineering capacity is already consumed by technical debt, on-call obligations, or existing commitments? A common mistake is building a roadmap that implicitly requires 150% of available capacity.
- **Time horizon:** Are you planning one quarter (13 weeks), two quarters, or a full year? Now/Next/Later is relative, not absolute. Define what "Now," "Next," and "Later" mean in calendar terms for this specific team.
- **Known constraints:** Hard deadlines (regulatory, contractual, seasonal), external dependencies (third-party API releases, partner integrations), or organizational constraints (freeze periods, leadership changes, budget cycles).
- **Input sources:** What data is available? Customer interviews, NPS verbatims, churn analysis, sales win/loss interviews, support ticket themes, analytics, competitive moves? The quality of available inputs should be reflected in confidence levels throughout the roadmap.

If the user cannot answer several of these, note the gaps explicitly in the roadmap output so stakeholders know what assumptions were made.

---

### 2. Define Strategic Themes

Themes are the skeleton of the roadmap. They prevent the roadmap from becoming a feature list masquerading as strategy.

- Define 3-5 themes. Fewer than 3 usually means the strategy is too narrow or too vague. More than 5 usually means the team is spread too thin and lacks real prioritization.
- Each theme should map to exactly one primary business objective. Business objectives fall into roughly six categories: acquisition (get new users or customers), activation (help users reach first value), retention (keep users engaged and renewing), revenue expansion (increase spend from existing customers), operational efficiency (reduce cost or time to serve), and platform/infrastructure (enable future capabilities). Label each theme with its primary objective.
- Themes should be outcome-oriented, not output-oriented. "Enterprise readiness" is better than "Build SSO and audit logs." "Reduce time-to-insight" is better than "Improve onboarding." The distinction matters because outcome themes can be satisfied by multiple possible initiatives, preserving flexibility.
- Each theme needs a measurable key metric so the roadmap can later be evaluated for success. "Reduce churn" is not measurable enough. "Reduce monthly churn rate from 4.2% to 2.8% by end of Q3" is.
- Validate theme balance: if 70% of planned initiatives fall under one theme, either that theme deserves a different label (it might be two themes) or the business is not investing proportionally. Make the imbalance explicit and justified.
- For mature products, always include at least one theme for technical health (reliability, scalability, developer productivity, security compliance). Teams that omit this theme accumulate debt that will appear as incidents and slowdowns in future quarters.

---

### 3. Inventory and Classify Initiatives

For each candidate initiative, capture a consistent set of attributes before placing it on the roadmap:

- **Initiative name:** A short, specific label. "Improve reports" is too vague. "Scheduled report delivery via email" is specific enough that two different engineers would build roughly the same thing.
- **One-sentence description:** What it is and what problem it solves. Write this in user-benefit language: "Allow users to receive weekly reports by email automatically, eliminating the need to log in to check recurring data."
- **Theme alignment:** Which theme does this serve? If an initiative serves two themes equally, it's probably two initiatives. If it serves no theme, it either belongs on a different roadmap or the themes are wrong.
- **Expected impact:** Be as specific as data allows. "Estimated to reduce first-week drop-off by 15-20% based on survey data showing 43% of churned users never set up a second dashboard." Ranges are fine; vague language ("will improve UX") is not.
- **Effort estimate:** Use T-shirt sizing with calibrated definitions for your team. A reasonable default: S = 1-5 engineering days, M = 1-3 engineering weeks, L = 1-2 engineering months, XL = 2+ engineering months. Always clarify that these are estimates, not commitments.
- **Confidence level:** High = validated through user research, data analysis, or pilot results. Medium = reasonable hypothesis supported by qualitative signals or analogous cases. Low = directional guess, exploratory, or based on one data point.
- **Dependencies:** Technical (requires completing a data model migration first), cross-team (requires platform team to expose an API), external (requires a third-party vendor contract), or regulatory (requires legal review).
- **Status:** Not started, in discovery, in design, in development, in QA, shipped, or paused.

---

### 4. Apply the Now/Next/Later Framework

The Now/Next/Later framework is intentionally asymmetric in specificity. Resist the pressure to make Later items as specific as Now items -- that specificity would be false precision.

**Now (current quarter or active sprint cycle):**
- Initiatives must be committed: teams assigned, discovery complete, work actively scoped or in progress.
- Every Now item needs a named team or named person responsible.
- Now items should represent no more than 70-80% of team capacity for the period. The remaining 20-30% absorbs unplanned work, bug fixes, and team overhead. A 100%-loaded "Now" will fail.
- Limit Now to what can realistically ship in the defined period. A common pathology is 12 items in Now when the team can deliver 4. This destroys roadmap credibility.
- Include effort estimates and current status for every Now item. Stakeholders need to be able to track progress.

**Next (1-2 quarters out):**
- Initiatives should be validated but not fully scoped. Discovery work (user interviews, technical spikes, design exploration) should be underway or planned.
- Avoid assigning specific engineers to Next items -- that creates premature commitments and discourages replanning when circumstances change.
- Next items should be specific enough to plan resourcing but flexible enough to be de-scoped, split, or resequenced without breaking trust.
- Flag all open dependencies. If a Next item depends on something not in Now, resolve that dependency first or move the Next item to Later.
- Target 5-10 initiatives in Next. More than that suggests the team has not actually prioritized; every item on the list carries implied commitment weight with stakeholders.

**Later (3+ quarters out):**
- Express Later primarily at the theme or capability level, not initiative level. "Expand internationalization to support Japanese and Korean" is a capable Later item. "Build a custom calendar date picker with Japanese locale support" is initiative-level detail that does not belong here.
- Later is where you place items that are strategically important but whose design, scope, and sequencing should remain flexible until they approach Now.
- Do not include more than 8-10 items in Later. If there are 30 items, you have a wish list, not a roadmap. Cull it.
- Pair each Later item with a brief rationale: why does this matter strategically, and what would cause it to move forward into Next?

**Not Doing (explicit deprioritization list):**
- This section is as important as the three horizons. It demonstrates analytical rigor and prevents the roadmap from ballooning.
- For each item in "Not Doing," provide a specific reason: insufficient demand signal (include data), team capacity constraints, strategic misalignment, or a deliberate decision to wait for a technology to mature.
- Items explicitly deprioritized with rationale help deflect recurring stakeholder requests. Instead of relitigating every quarter, you can point to the documented decision.

---

### 5. Validate the Roadmap for Internal Consistency

Before presenting any roadmap, run these checks:

- **Dependency chain check:** Walk through every Next and Later item. Does any Next item have a dependency on something not in Now? If yes, either move the dependency into Now (if capacity allows) or move the Next item to Later.
- **Capacity sanity check:** Sum the effort estimates for all Now items. Does the total fit within available team capacity at 70-80% utilization? If not, move the overflow to Next.
- **Theme balance check:** Count initiatives and estimate effort by theme. Is the allocation of effort consistent with stated business priorities? If retention is the top priority but 60% of effort is in new features, the roadmap contradicts the strategy.
- **Technical debt ratio:** Industry benchmarks suggest 15-25% of engineering capacity should be allocated to technical health (refactoring, infrastructure, security, tooling) for a product in steady growth. Less than 15% tends to accumulate incidents. More than 35% signals the product may need a more serious architectural intervention before feature development continues.
- **Confidence distribution check:** If all Now items are Medium or Low confidence, the team is building without sufficient validation. Move Low-confidence Now items to In-Discovery status or reframe them as discovery sprints rather than delivery commitments.
- **Vision alignment:** For each theme, ask: if we execute all the initiatives under this theme perfectly, does it meaningfully advance the product vision? If not, the theme is operational maintenance dressed up as strategy.

---

### 6. Format for the Audience

The same roadmap content requires different presentation layers for different audiences. Produce the base roadmap first, then adapt the view:

- **Engineering team view:** Include technical initiatives, infrastructure work, and internal tooling. Show status, assigned team, dependencies, and effort estimates. Engineers need to see the technical debt allocation and understand sequencing logic. They do not need the business impact narrative -- they need enough context to make good implementation decisions.
- **Leadership and executive view:** Suppress initiative-level detail in Next and Later. Lead with themes and business objectives. Use business metrics as the success language, not feature descriptions. Include the capacity trade-off section and the "Not Doing" list. Executives need to be able to answer: "Does this roadmap advance our business goals, and is it credible given our resources?"
- **Customer-facing view (public or customer advisory board):** Strip all internal jargon, technical initiatives, and infrastructure work. Frame everything as user outcomes: "You'll be able to..." not "We are building..." Never include specific dates for Next or Later. Avoid any initiative that has not yet been validated -- customers anchor on roadmap items and feel betrayed if they don't ship.
- **Investor view:** Emphasize the connection between product investment and market opportunity. Frame themes in terms of competitive differentiation and addressable market expansion. Include the north star metric and directional targets. Investors are assessing whether the team is making intelligent bets with capital, so the strategic logic of sequencing matters more than operational detail.

---

### 7. Define Governance, Review Cadence, and Change Communication

A roadmap without a governance model degrades within 6-8 weeks. Establish the following before circulating:

- **Review cadence:** Monthly check-ins for Now items (are they on track?), quarterly replanning sessions for the full roadmap. Quarterly replanning should include a retrospective on the previous quarter's Now items: what shipped, what slipped, and why.
- **Who can move items:** Define who has authority to move an initiative from Later to Next (PM plus engineering lead), from Next to Now (PM plus engineering lead plus team capacity confirmation), and to remove an item entirely (PM with stakeholder notification).
- **Change communication protocol:** When an item in Now is descoped or delayed, notify affected stakeholders within 24-48 hours with a specific reason and a revised expectation. Stakeholders who learn about changes through rumor or accident lose trust in the roadmap process. When an item is added to Now mid-quarter, communicate what it is replacing.
- **Where it lives:** The roadmap should have a single source of truth -- whether that is a dedicated product management tool, a shared wiki, or a structured document. Link all stakeholder presentations back to the live version. Avoid emailing static slides as the primary distribution format; they immediately go stale and fragment into conflicting versions.
- **Roadmap health signals:** A healthy roadmap has fewer than 20% of Now items slipping quarter-over-quarter. If more than 20% of Now items are consistently sliding to Next, the root cause is usually over-allocation, under-scoped items, or excessive unplanned work -- each requiring a different intervention.

---

### 8. Deliver the Roadmap with a Narrative

A roadmap without a narrative is just a table. Write a brief framing paragraph that answers three questions:

- What is the product trying to accomplish in this period and why does it matter now?
- What is the most important trade-off the team is making (i.e., what is being prioritized over what, and why)?
- What would need to be true for this roadmap to succeed?

This narrative paragraph should be 4-6 sentences maximum and should appear at the top of any roadmap presentation. It is the first thing stakeholders read and the frame through which they interpret every subsequent item.

---

## Output Format

```markdown
## Product Roadmap: [Product Name]
**Version:** [e.g., Q2 2026 -- Last updated: April 3, 2026]
**Author:** [PM name or team]
**Distribution:** [Engineering | Leadership | Customers | Investors -- choose one]

---

### Roadmap Narrative
[4-6 sentences answering: What are we accomplishing and why now? What is the key trade-off?
What must be true for this roadmap to succeed?]

---

### Product Vision and North Star
**Vision:** [One-sentence statement of the product's purpose and future state]
**North star metric:** [The single metric most correlated with product success]
**Current baseline:** [Current value of the north star metric]
**Target by end of horizon:** [Target value and timeframe]
**Time horizon covered:** [e.g., Q2-Q4 2026]

---

### Strategic Themes

| # | Theme | Business Objective | Key Metric | Current Baseline | Target |
|---|-------|-------------------|------------|-----------------|--------|
| 1 | [Theme name -- outcome-oriented] | [Acquisition/Activation/Retention/Revenue/Efficiency/Platform] | [Specific metric] | [Current value] | [Target value] |
| 2 | [Theme name] | [Objective] | [Metric] | [Baseline] | [Target] |
| 3 | [Theme name] | [Objective] | [Metric] | [Baseline] | [Target] |
| 4 | [Theme name -- technical health] | [Platform/Efficiency] | [Metric] | [Baseline] | [Target] |

---

### Now: [Quarter and Year, e.g., Q2 2026]
*Committed work. Teams assigned, discovery complete, actively in progress or scheduled.*
*Capacity check: [X] of [Y] available team-weeks allocated ([Z]% utilization)*

| Initiative | Theme | One-Line Description | Impact | Effort | Team | Status | Confidence |
|-----------|-------|---------------------|--------|--------|------|--------|------------|
| [Initiative name] | [#] | [What it is and the problem it solves] | [Specific metric impact] | [S/M/L/XL] | [Team or person] | [In progress / In design / In QA] | High |
| [Initiative name] | [#] | [Description] | [Impact] | [S/M/L/XL] | [Team] | [In discovery] | High |

**Now -- Open Risks:**
- [Any dependency, blocker, or uncertainty that could affect Now delivery]

---

### Next: [e.g., Q3-Q4 2026]
*Planned and validated. Discovery underway. Flexible on scope and sequencing.*
*Note: No delivery dates committed. Sequence may change as Now items complete and we learn more.*

| Initiative | Theme | One-Line Description | Impact | Effort | Open Dependencies | Confidence |
|-----------|-------|---------------------|--------|--------|------------------|------------|
| [Initiative name] | [#] | [Description] | [Impact] | [S/M/L/XL] | [Dependency or "None"] | Medium |
| [Initiative name] | [#] | [Description] | [Impact] | [S/M/L/XL] | [Dependency] | Medium |

---

### Later: [e.g., 2027 and beyond]
*Directional and strategic. Theme-level intent. Details will be defined when items move to Next.*

| Theme | Strategic Direction | Why It Matters | What Would Accelerate It |
|-------|--------------------|-----------------|-----------------------------|
| [#] | [Capability or direction, not feature spec] | [Strategic rationale] | [Signal or trigger that would move this to Next] |
| [#] | [Direction] | [Rationale] | [Trigger] |

---

### Not Doing (and Why)

| Initiative | Reason for Deprioritization | Revisit Condition |
|-----------|---------------------------|-------------------|
| [Item requested or considered] | [Specific reason: data, capacity, strategy] | [What would change this decision] |
| [Item] | [Reason] | [Condition] |

---

### Capacity and Investment Allocation

**Team:** [X] engineers, [Y] designers, [Z] PMs
**Available capacity this quarter:** ~[N] team-weeks (after accounting for meetings, on-call, holidays)

| Investment Category | % of Capacity | Rationale |
|--------------------|--------------:|-----------|
| New feature development | [X]% | [Why this allocation] |
| Product improvements / UX debt | [Y]% | [Why] |
| Technical debt and infrastructure | [Z]% | [Why -- industry benchmark: 15-25%] |
| Discovery and research | [W]% | [Why] |
| **Total** | **100%** | |

---

### Assumptions and Dependencies

| Assumption / Dependency | Type | Risk Level | Owner | Mitigation |
|------------------------|------|-----------|-------|------------|
| [e.g., Platform team delivers Auth API by end of April] | External dependency | High | [Name] | [Contingency plan] |
| [e.g., Mid-market demand signal holds based on 12 sales interviews] | Assumption | Medium | PM | [Revalidate with 5 more interviews before Next quarter] |

---

### Roadmap Governance

**Review cadence:** [Monthly check-in on Now items | Quarterly replanning for full roadmap]
**Replanning authority:** [Who can move items between horizons and under what conditions]
**Change communication:** [How and when stakeholders are notified of changes]
**Source of truth location:** [Link or tool name where live roadmap is maintained]
**Last full replanning session:** [Date]
**Next scheduled replanning:** [Date]
```

---

## Rules

1. **Never assign specific calendar dates to Next or Later items.** Dates on unvalidated items create implicit delivery contracts with stakeholders. Use relative horizons (next quarter, H2, next fiscal year) and explicitly state that items will be scoped and dated only when they move into Now.

2. **Every initiative must map to exactly one theme, and every theme must map to a business objective.** An initiative with no theme is a feature request wearing roadmap clothes. A theme with no business objective is internal vocabulary, not strategy. Remove or reclassify both.

3. **"Now" must pass a capacity sanity check.** Sum effort estimates for all Now items. They should not exceed 70-80% of available team capacity. Reserve the remaining 20-30% explicitly for unplanned work, bug escalations, and overhead. If the math doesn't work, move items to Next -- do not inflate capacity assumptions.

4. **Confidence levels must be honest and evidence-based.** High confidence requires user research data, analytics evidence, or a completed technical spike. Medium confidence requires at least qualitative signal from multiple sources (3+ customer interviews, sales call themes, NPS verbatims). Low confidence is a directional bet. Mislabeling Low as High is the most common source of roadmap credibility collapse.

5. **The "Not Doing" section is mandatory.** A roadmap without explicit deprioritization will continuously accumulate items from stakeholders who never see their requests formally declined. Each "Not Doing" entry requires a specific reason and a revisit condition -- not a vague "low priority."

6. **Later items should be theme-level or capability-level, not initiative-level.** The moment you write feature-level detail for items 9+ months away, you invite stakeholders to anchor on that detail and hold you accountable for it. Keep Later deliberately high-level to preserve strategic flexibility.

7. **Technical debt allocation must be explicit and percentage-bounded.** It should appear as a named investment category with a percentage of capacity. Teams that hide technical debt inside feature initiatives lose visibility into true velocity and accumulate compounding risk. Industry reference: below 15% of capacity on technical health in a growth-stage product is unsustainably low.

8. **The roadmap must include a written narrative, not just tables.** Tables answer "what." Narratives answer "why" and "why now." A roadmap presented without a framing narrative will be interpreted differently by different stakeholders, producing misalignment that the roadmap was supposed to prevent.

9. **Format must match audience.** Engineering views include technical initiatives, infrastructure work, dependencies, and effort. Executive views suppress initiative-level detail in Next/Later and lead with themes and business metrics. Customer-facing views remove all internal work and use outcome language ("You will be able to..."). Presenting the engineering view to customers or the executive view to engineers both produce confusion and erode trust.

10. **Review and replan at a defined cadence -- quarterly at minimum.** A roadmap that is not replanned after a quarter of new learning is not a living strategic document; it is a historical artifact. At each quarterly replan, explicitly assess: what shipped vs. slipped, what changed in the market or with customers, and whether the themes still reflect the right bets. Update the version date and changelog so stakeholders can see when and why the roadmap changed.

11. **Dependencies must be called out explicitly and owned.** Every cross-team, external, or technical dependency in Now or Next must have a named owner and a mitigation plan. Untracked dependencies are the most common cause of Now items slipping to Next without warning.

12. **Balance themes across the acquisition-to-retention funnel.** A growth-stage product that allocates 90% of roadmap effort to acquisition features while neglecting activation and retention is filling a leaky bucket. If a product has greater than 3% monthly churn, retention themes should receive at minimum 30-40% of roadmap effort until churn is below 2%.

---

## Edge Cases

### New Product With No User Data or Market Validation

When a product has no existing users, no analytics, and limited customer research, treat the roadmap as a validated learning plan rather than a delivery plan.

- "Now" should consist almost entirely of discovery and validation activities: user interview sprints (target 8-12 interviews per major assumption), smoke-test landing pages, clickable prototypes for usability testing, or a concierge MVP for 3-5 reference customers.
- Mark every initiative as Low confidence and document the specific assumption being tested.
- "Next" is conditional: define what would need to be true from Now's discovery work for each Next item to be validated and promoted. Example: "If 6 of 10 target customers confirm they would switch from their current tool for this capability, move the core workflow redesign to Next."
- "Later" should be minimal -- a pre-PMF product should not plan 3 years out.
- The roadmap review cadence should be monthly, not quarterly, because the learning rate is higher and assumptions change faster.

### Platform or Infrastructure Team Serving Internal Customers

Platform teams have a roadmap structure problem: their "users" are internal engineering teams, not end customers. Standard user-benefit framing breaks down.

- Replace user-facing outcome language with platform capability language: "Enable mobile teams to ship features 30% faster by abstracting authentication logic" instead of "Users will have a better login experience."
- Themes map to platform dimensions: reliability and uptime guarantees, developer experience and time-to-integrate, scalability and cost efficiency, compliance and security posture.
- "Now" items should be tied to formal service-level commitments made to internal customer teams. Include the internal team name that is depending on each Now item.
- Include an intake and triage process in the Governance section. Platform teams without a public intake process get ad-hoc requests inserted directly into Now without capacity checks.
- Show the roadmap to internal customers at the same cadence you would show a product roadmap to external stakeholders -- quarterly reviews where internal teams can see what is coming and plan accordingly.

### Roadmap for a Product Being Wound Down or Sunset

Sunset roadmaps require a complete inversion of the standard structure and extreme clarity in communication.

- "Now" is: maintenance of critical bugs only, customer migration support tooling, data export capabilities, and documentation for migration paths.
- "Next" is: feature freeze announcement (with date), deprecation of non-critical integrations, final security patches.
- "Later" is: hard shutdown date with specific milestones (final data export deadline, support end date, infrastructure decommission date).
- The "Not Doing" section must prominently state: no new feature development of any kind.
- The stakeholder communication section is the most important part of a sunset roadmap. Define exactly which customers are affected, who will contact them, by when, with what migration alternatives, and what SLA support covers through the end-of-life date.
- Avoid softening language like "winding down" or "transitioning focus." Use explicit, unambiguous language so customers and engineers understand the commitment level has ended.

### Multiple Products or Product Lines Sharing One Team

When a single engineering team serves multiple product lines or customer segments, resource contention must be made explicit in the roadmap.

- Create a unified capacity view that shows percentage allocation across products before any initiative-level detail. Example: "Team allocation this quarter: Product A 45%, Product B 30%, Platform/infrastructure 20%, Unplanned/on-call 5%."
- Each product stakeholder must be able to see the full allocation picture. A product owner who sees only their product's roadmap section will feel short-changed without understanding the competing claims on the team.
- Sequence dependencies across products: if Product A's Next item depends on a capability being built for Product B's Now item, make that connection explicit.
- When a high-priority request arrives for one product, make the trade-off explicit and immediate: "Adding X to Product A's Now means removing Y from Product B's Now or extending the timeline by N weeks." Never silently absorb additional scope.
- Consider creating separate audience-specific views: a combined leadership view showing resource allocation across all products, and individual product views for each product's stakeholders with only their relevant section plus the overall capacity context.

### Rapidly Evolving Market Requiring Frequent Replanning

In markets with fast competitive moves, regulatory changes, or high uncertainty (early-stage AI tooling, newly regulated categories, crisis-driven pivots), the standard quarterly cycle is too slow.

- Compress the time horizons: Now = current 2-3 week sprint, Next = next 4-8 weeks, Later = anything beyond 2 months.
- Implement a weekly lightweight review for Now items (15-minute standup format: what is on track, what is blocked, what has changed in the market this week that might affect Next).
- Keep the full replanning session monthly instead of quarterly.
- Add a "Watchlist" section below Later: items not on the roadmap but being monitored for rapid inclusion if a specific trigger occurs. Example: "Competitor launches bulk import feature -- if churn signals appear within 4 weeks, promote our batch import initiative from Watchlist to Now immediately."
- Communicate the compressed cadence explicitly to stakeholders so that changes in Next items are expected, not surprising. Frame the roadmap explicitly as "current best understanding subject to weekly updates" rather than "quarterly plan."

### Stakeholder Conflict Over Roadmap Priorities

When multiple senior stakeholders (sales leader, engineering head, and marketing leader, for example) have competing views on what should be in Now, the roadmap becomes a political document rather than a strategic one.

- Before producing the roadmap, establish the decision rights framework: who has final say over product priority? Typically this is the CPO or Head of Product, with input but not veto from other functions.
- Use the themes as the escalation layer: rather than debating individual features, align stakeholders on theme priority order first. If everyone agrees retention is Theme 1 and acquisition is Theme 2, individual feature conflicts often resolve themselves.
- For any item where stakeholders remain in conflict after theme alignment, run a lightweight prioritization exercise (RICE scoring or a simple 2x2 impact vs. effort matrix) to ground the discussion in shared criteria rather than positional advocacy.
- Document the decision and the rationale in the Governance section. When a stakeholder challenges the roadmap in 3 months, pointing to a written record of the decision and the reasoning is far more effective than reconstructing the argument.
- If the conflict is between product investment and technical debt investment specifically, use the technical debt capacity benchmark (15-25%) as a neutral reference point rather than a PM judgment call.

### Annual Planning With Incomplete Input Data

Many organizations do annual planning before the previous year's results are finalized, before customer research for the coming year is complete, and before budget is confirmed. This creates pressure to fake precision.

- Structure the annual roadmap in two tiers: a high-confidence H1 plan (Now and early Next) with initiative-level detail, and a directional H2 plan (later Next and Later) expressed at the theme level with explicit assumption flags.
- List every major assumption the H2 plan depends on -- for example, "Assumes team grows from 6 to 9 engineers by Q3," or "Assumes enterprise pricing tier is approved in budget cycle." These assumptions become tracking items for the Q1 replanning session.
- Avoid the trap of filling the full annual roadmap with initiative-level detail just because stakeholders expect it. An honest roadmap that clearly marks later quarters as directional is more valuable than a false-precision document that will be rebuilt in April anyway.
- At each quarterly replanning session, explicitly update assumptions, validate or invalidate H2 items, and promote or demote them based on new information.

---

## Example

**Input:** "I'm the PM for a B2B SaaS project management tool. We have a team of 5 engineers (mix of senior and mid-level), 1 product designer, and it's just me as PM. The product has been live for 18 months, has about 140 business customers, average contract size is $8,400/year, and our monthly churn is running at 3.8% -- way too high. We're also seeing a lot of interest from larger companies (50-200 person teams) but we're losing deals because we don't have SSO, audit logs, or role-based permissions. Sales is pushing hard for those features. Meanwhile, engineering is warning me we have serious performance issues -- our task search times out for any project with more than 500 tasks. I need to plan Q3 and Q4 2026. What should the roadmap look like?"

---

**Output:**

## Product Roadmap: WorkStream (Project Management Platform)
**Version:** Q3-Q4 2026 -- Last updated: June 15, 2026
**Author:** Product Management
**Distribution:** Internal -- Leadership and Engineering

---

### Roadmap Narrative

WorkStream's most urgent challenge entering H2 2026 is a 3.8% monthly churn rate that is quietly eroding our installed base while sales works to grow it -- at this rate, we are losing roughly 5 customers per month and fighting to stand still. The key trade-off this half is sequencing: we could chase mid-market expansion immediately with the enterprise features sales is requesting, but doing so before fixing the retention problem would mean selling larger contracts into a leaky product. Instead, we are sequencing churn-reduction interventions first in Q3, layering in enterprise readiness in parallel where it can be done without additional scope pressure, and delivering the full mid-market feature set in Q4 when the product is stable enough to sustain higher-value accounts. For this plan to succeed, three things must be true: engineering's search performance fix must ship in the first 6 weeks of Q3, churn interviews scheduled for June must surface actionable root causes, and the sales pipeline for mid-market accounts must hold so Q4 investment is justified.

---

### Product Vision and North Star

**Vision:** Give every team -- from 5-person startups to 200-person departments -- a single place where projects don't fall through the cracks.
**North star metric:** Weekly active projects per account (WAP/account) -- a project is "active" if it has at least one task updated in the last 7 days
**Current baseline:** 4.2 active projects per account per week
**Target by end of Q4 2026:** 6.8 active projects per account per week
**Time horizon covered:** Q3 2026 (July-September) and Q4 2026 (October-December)

---

### Strategic Themes

| # | Theme | Business Objective | Key Metric | Current Baseline | Target (EOY 2026) |
|---|-------|-------------------|------------|-----------------|-------------------|
| 1 | Stop the bleed: reduce churn | Retention | Monthly churn rate | 3.8% | <2.0% |
| 2 | Enterprise readiness | Revenue expansion / Acquisition | Win rate on 50-200 seat deals | ~18% (est. from sales data) | >40% |
| 3 | Performance and reliability | Platform / Retention | Task search P95 latency; Uptime | 12.4s P95 search; 99.6% uptime | <1.5s P95; 99.9% uptime |
| 4 | Onboarding and activation | Activation / Retention | % of new accounts reaching 5+ active projects in week 1 | 22% | 45% |

**Theme rationale:** Theme 1 and Theme 3 are directly linked -- exit interviews suggest performance issues are a top-3 churn reason. Themes 1 and 4 address the retention problem from two angles: keeping current users and getting new users to value faster. Theme 2 is the growth investment, sequenced after retention work because mid-market customers will scrutinize reliability more, not less.

---

### Now: Q3 2026 (July -- September 2026)
*Committed work. Teams assigned, discovery complete, actively scoped.*
*Capacity check: ~60 team-weeks available (5 engineers x 13 weeks x 85% productive time, after meetings and on-call). 47 team-weeks allocated = 78% utilization. 13 team-weeks reserved for unplanned work and bug escalations.*

| Initiative | Theme | One-Line Description | Impact | Effort | Team | Status | Confidence |
|-----------|-------|---------------------|--------|--------|------|--------|------------|
| Task search re-architecture | 3 | Rebuild search index using Postgres full-text search with pagination; eliminate timeout for projects >500 tasks | Eliminate #1 reported performance complaint; estimated to recover 0.8% churn/month based on exit interviews | L (14 team-weeks) | Backend team (2 engineers) | Technical spike complete; implementation ready | High |
| Churn interview program (10 accounts) | 1 | Conduct structured 30-minute exit interviews with 10 churned accounts from last 60 days; synthesize into top 5 fixable root causes | Grounds Q4 retention initiatives in validated root causes rather than guesses | S (2 team-weeks -- PM time + 1 designer for concept testing) | PM + Designer | Recruiting underway; 6 of 10 confirmed | High |
| Role-based permissions (3-tier: Admin, Member, Viewer) | 2 | Implement three permission tiers; required by 100% of mid-market prospects in active pipeline | Unblocks 11 deals in pipeline estimated at $340K ARR | M (10 team-weeks) | Full-stack team (2 engineers) | Design complete; engineering scoped | High |
| In-app onboarding checklist with sample project | 4 | Replace blank-slate first experience with a guided checklist and pre-populated sample project matching user's stated use case | Benchmark: similar products report 35-50% improvement in week-1 activation after guided onboarding | S (5 team-weeks) | Designer (design complete) + 1 engineer | In development | High |
| Critical bug backlog clearance (Q3 sprint) | 3 | Resolve top 12 bugs by severity from support queue; 4 are customer-blocking, 8 are significant UX degraders | Estimated 0.3% churn reduction based on ticket-to-churn correlation analysis | S (4 team-weeks) | Rotating (1 engineer dedicated per 3-week sprint) | Ongoing | High |

**Now -- Open Risks:**
- Task search re-architecture depends on a schema migration that will require a 2-4 hour read-only maintenance window. Customer communication plan must be ready by July 14.
- Role-based permissions requires data model changes that may conflict with the search re-architecture migration if both are deployed in the same 2-week window. Engineering to confirm merge order by July 7.
- If churn interviews reveal a root cause not currently on the roadmap (e.g., integration gaps), we will re-evaluate Q4 Next items in the August replanning session.

---

### Next: Q4 2026 (October -- December 2026)
*Planned and validated through sales pipeline data, support ticket analysis, and partial churn interview results. Scope flexible; will be finalized in September replanning.*
*Note: No delivery dates committed for these items. Sequencing will be confirmed based on Q3 outcomes.*

| Initiative | Theme | One-Line Description | Impact | Effort | Open Dependencies | Confidence |
|-----------|-------|---------------------|--------|--------|------------------|------------|
| SSO / SAML integration | 2 | Integrate SAML 2.0 SSO; support Okta and Azure AD as the two most requested IdPs | Required by 9 of 11 pipeline deals; primary reason for mid-market loss per sales | M (8 team-weeks) | Role-based permissions must ship in Q3 (SSO requires permission tiers to enforce) | High |
| Proactive at-risk account intervention (health score + PM alert) | 1 | Build account health score (based on WAP/account, login frequency, task completion rate); alert PM when account drops below threshold for 2 consecutive weeks | Enables Customer Success to intervene before churn, not after. Estimated to reduce churn 0.5-1.0% if CS acts within 5 days | M (9 team-weeks) | Requires WAP/account metric instrumentation (already in Now as part of search work) | Medium |
| Audit log (read-only, 90-day retention) | 2 | Provide admin-accessible log of all permission changes, project deletions, and member additions/removals | Required by compliance-sensitive mid-market accounts; blocks 4 of 11 pipeline deals | S-M (6 team-weeks) | Role-based permissions (Q3) | High |
| Onboarding personalization by use case (3 tracks) | 4 | Extend Q3 onboarding checklist with 3 distinct tracks: software development, marketing campaigns, and professional services | Target: lift week-1 activation from 45% (Q3 target) to 60%; use cases cover 74% of current customer base | M (8 team-weeks) | Q3 onboarding checklist must ship and have 4+ weeks of data before building personalization on top | Medium |
| Guest / external collaborator access | 2 | Allow accounts to invite non-paying external collaborators (clients, contractors) with limited Viewer-only access | Requested by 34% of accounts in NPS survey (Q1 2026); also a viral growth mechanic -- guests see the product and may convert | M (10 team-weeks) | Role-based permissions (Q3) | Medium |

---

### Later: 2027 and Beyond
*Directional and strategic. Theme-level intent only. Details will be defined when items enter Next.*

| Theme | Strategic Direction | Why It Matters | What Would Accelerate It |
|-------|--------------------|-----------------|-----------------------------|
| 2 | Enterprise admin console: centralized billing, user provisioning, and usage analytics for IT administrators | Mid-market at 200+ seats requires IT governance capabilities that go beyond team-level admin | 3+ closed mid-market deals at 150+ seats where IT buyer explicitly requires this; target Q1 2027 |
| 1 | Automated re-engagement sequences for dormant projects | Projects that go dormant are a leading indicator of account churn 60-90 days later; automated nudges could recapture engagement before CS intervention is needed | Churn interview data from Q3 confirms project abandonment (vs. feature gaps) as top-3 churn driver |
| 4 | Integrations marketplace: Slack, Jira, Google Workspace, and Zapier | Reduces switching cost and increases daily habit formation by embedding WorkStream into existing workflows | Top integration requests reach 30% of active accounts; currently at 19% for Slack, 14% for Google Workspace |
| 3 | Real-time collaboration (live cursor and simultaneous editing on task boards) | Table-stakes feature for next competitive tier; differentiates from async-only tools in enterprise evaluation shortlists | Real-time capability appears in competitive losses at rate >35%; currently at 22% |

---

### Not Doing (and Why)

| Initiative | Reason for Deprioritization | Revisit Condition |
|-----------|---------------------------|-------------------|
| Mobile app (iOS/Android) | Usage analytics show 3.1% of sessions on mobile; insufficient demand to justify 3-4 months of engineering for a 5-person team. Not a table-stakes expectation in our B2B segment. | Mobile session share exceeds 12%, or 3+ enterprise churns cite mobile access as primary reason |
| Time tracking and billing module | Requested by 8 accounts; builds into a different product category (PSA software) requiring dedicated PM focus we don't have. Risk of over-complicating the core PM product. | 25+ accounts request it, or a dedicated PM role is added to the team |
| AI task suggestion / auto-assignment | Interesting directional bet but requires a data foundation (activity history, workload data) that doesn't exist yet. Building AI features on thin data produces poor models and erodes user trust. | 12+ months of normalized activity data per account available; model accuracy >70% in internal testing |
| White-label / OEM version for resellers | Two reseller inquiries in Q1 2026; not enough signal to justify the architectural complexity of multi-tenant branding customization | 5+ signed LOIs from reseller partners or a strategic partnership deal that justifies dedicated investment |

---

### Capacity and Investment Allocation

**Team:** 5 engineers (2 senior, 3 mid-level), 1 designer, 1 PM
**Available capacity Q3 2026:** ~60 team-weeks

| Investment Category | % of Capacity | Team-Weeks | Rationale |
|--------------------|--------------:|------------|-----------|
| New feature development | 38% | 23 | Role-based permissions, onboarding checklist |
| Product improvements and UX debt | 13% | 8 | Bug backlog, onboarding UX |
| Technical debt and infrastructure | 23% | 14 | Search re-architecture (above 15-25% benchmark this quarter because the debt is actively causing churn) |
| Discovery and research | 3% | 2 | Churn interview program (PM + designer time) |
| Unplanned buffer | 22% | 13 | On-call, escalations, unscoped requests |
| **Total** | **100%** | **60** | |

*Note: Technical debt allocation is above the 15-25% benchmark this quarter due to the search performance issue actively contributing to churn. This is a one-quarter exception, not a baseline.*

---

### Assumptions and Dependencies

| Assumption / Dependency | Type | Risk Level | Owner | Mitigation |
|------------------------|------|-----------|-------|------------|
| Churn interviews (10 accounts) confirm performance and onboarding as top root causes | Assumption | Medium | PM | If interviews reveal a different root cause (e.g., pricing, integration gaps), August replanning session will adjust Q4 Next items |
| Role-based permissions ships by end of August to unblock SSO in Q4 | Internal dependency | High | Engineering Lead | Two-engineer allocation confirmed; scope locked; no new requirements accepted |
| Sales pipeline of 11 mid-market deals holds through Q3 | External assumption | Medium | Sales Lead | Monitor weekly; if pipeline drops below 5 deals, rebalance Theme 2 effort toward retention |
| Schema migration for search can be executed with a maintenance window acceptable to enterprise customers | Technical assumption | Medium | Backend Lead | Customer advisory communication plan ready by July 14; fallback is a phased migration approach with zero-downtime cutover |

---

### Roadmap Governance

**Monthly check-in (Now items):** First Monday of each month, 30 minutes. PM + Engineering Lead review: what shipped, what is blocked, what has changed.
**Quarterly replanning:** Week of September 15. Full team. Inputs: churn interview synthesis, Q3 delivery retrospective, updated pipeline data from sales, any market or competitive changes. Output: confirmed Q4 Now plan.
**Change authority:** PM + Engineering Lead can resequence Next items. Moving an item into Now mid-quarter requires PM + Engineering Lead + notification to affected stakeholders within 48 hours, including what is being displaced.
**Change communication:** Customers are not on this distribution. Any changes affecting external-facing commitments (e.g., features promised to a specific account by sales) require Sales Lead notification before the change is made.
**Source of truth:** Notion workspace > Product > Roadmap > H2 2026 (live document). This presentation is a snapshot. Do not distribute the slide version as the authoritative source.
**Last full replanning session:** June 10, 2026
**Next scheduled replanning:** September 15, 2026
