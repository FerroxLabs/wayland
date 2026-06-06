---
name: business-plan
description: |
  Produces a completed one-page business plan using Lean Canvas or traditional
  format covering problem, solution, market, revenue model, and key metrics.
  Use when the user asks to create a business plan, write a business plan
  summary, outline a business model, or structure a startup idea on paper.
  Do NOT use for pitch deck narrative (use sales-pitch-deck), financial
  modeling detail (use financial-model-structure in a future plan), or
  competitive landscape analysis (use competitive-analysis).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "strategy planning entrepreneurship"
  category: "business-strategy"
  subcategory: "strategy-planning"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Business Plan

## When to Use

Use this skill when any of the following conditions are true:

- The user explicitly asks to "write a business plan," "create a business plan," "build a business plan," or "document my startup idea"
- The user wants a Lean Canvas, one-page business plan, or business model summary for a new or existing venture
- The user needs to communicate their business model to stakeholders, co-founders, early employees, or advisors in a structured document
- The user wants to test whether their business idea holds together logically before investing time in pitches or financial models
- The user is preparing for an accelerator application, incubator program, or small business loan and needs a structured overview of the business
- The user asks to "outline my business model," "structure my startup idea," or "organize my value proposition on paper"
- The user needs to articulate their go-to-market strategy, revenue model, and key assumptions in a single coherent artifact

**Do NOT use this skill when:**
- The user needs a narrative investor pitch -- use `sales-pitch-deck` instead. Business plans inform pitches but are not pitch decks; they have different audiences and structures
- The user needs detailed multi-year financial projections with income statements, balance sheets, or DCF analysis -- use `financial-model-structure`
- The user needs a standalone competitive landscape analysis with Porter's Five Forces, market positioning maps, or SWOT -- use `competitive-analysis`
- The user needs a go-to-market strategy document with channel tactics, campaign plans, and funnel metrics -- use `go-to-market-strategy`
- The user needs a product roadmap or feature prioritization framework -- use `product-roadmap`
- The user already has a funded company and is updating a strategic plan -- use `strategic-plan` for multi-year corporate planning
- The user is writing a grant proposal or nonprofit funding narrative -- funding model differences are significant enough to warrant a separate skill

---

## Process

### Step 1: Collect Required Business Context Before Writing Anything

Never produce a business plan from a one-sentence prompt. Ask the user to confirm or provide the following inputs. If the user has already supplied most of this information in their prompt, extract it and ask only for what is missing.

- **Business name or working title** -- even a placeholder prevents anonymous-sounding output
- **One-sentence description** of what the business does (subject + verb + customer + outcome)
- **Target customer** -- who pays, not who uses (these are sometimes different, e.g., in B2B2C or freemium)
- **Core problem** -- one specific, painful, high-frequency problem the customer faces today; reject vague problem statements like "inefficiency" and push for specific cost, time, or risk pain points
- **Existing alternatives** -- how the customer solves the problem right now without this product; this is the true competitive set, which includes doing nothing, spreadsheets, or a workaround, not just named competitors
- **Revenue model category** -- subscription (SaaS), transactional (marketplace, e-commerce), usage-based, licensing, professional services, advertising, freemium, hardware + consumables, data monetization, or hybrid
- **Stage of business** -- one of: Idea (hypothesis only), Validation (customer discovery underway), Pre-revenue (product built, no paying customers), Revenue (paying customers, not yet profitable), or Scaling (unit economics proven, expanding)
- **Format preference** -- Lean Canvas (default for startups) or Traditional one-page (more appropriate for small businesses, SBA loan applications, or businesses with clear revenue history)

If the user is in the Idea or Validation stage, note that the plan will be heavily hypothesis-driven and should be treated as a living document updated with each customer discovery conversation.

---

### Step 2: Define the Problem and Customer with Surgical Precision

The business plan lives or dies on problem-market fit before product-market fit. Do not accept vague problem statements.

- **State exactly three problems** in descending order of urgency and frequency. The #1 problem should be the one the customer would pay to solve today. Problems #2 and #3 are often the secondary pains that compound the primary one.
- **Apply the "aspirin vs. vitamin" test** to the primary problem: aspirin solves an active, acute pain (customer is motivated to seek a solution); vitamins are nice-to-haves (customer may intend to buy but rarely does). Flag vitamin problems as high-risk assumptions.
- **Describe existing alternatives with specificity**: "Google Sheets and a weekly email" is a real answer. "Nothing" is almost never true -- there is always a workaround. Named competitors belong in the competitive analysis skill, but behavioral alternatives (how the customer copes today) belong here.
- **Define 1-2 customer segments** with enough specificity to be useful: include demographic details, job role or life stage, behavioral patterns, and the emotion associated with the problem (frustration, anxiety, embarrassment, financial stress). A segment description like "small business owners" is too broad; "independent restaurant owners with 1-3 locations who manage payroll manually" is actionable.
- **Identify early adopters** using the Lean Canvas principle: these are not typical customers but the subset who feel the problem most acutely, have already tried to solve it (evidence of active pain), and will forgive product imperfections in exchange for any relief. Early adopters are often found in communities, forums, or niche groups, not broad demographics.
- **Estimate segment size** using a top-down TAM/SAM/SOM framework or a bottom-up count. For TAM, use industry reports or government data as anchors. For SOM (serviceable obtainable market), the realistic 3-year capture -- a number below 5% of SAM is more credible to sophisticated readers than anything above 10%.

---

### Step 3: Build the Solution and Unique Value Proposition

This step maps solution to problem and extracts the single most important message the business needs to communicate.

- **Map every problem to a specific solution capability** -- not a feature description but an outcome the customer experiences. The solution table is a promise: "if you have this problem, we deliver this result."
- **Apply the job-to-be-done framing** (Clayton Christensen): customers do not buy products, they hire them to do a job. Write each solution entry as the job being done better, faster, cheaper, or more safely than the existing alternative.
- **Write the Unique Value Proposition (UVP) as a single sentence** following this formula: [Action verb] + [specific outcome] + [target customer] + [without the key trade-off or pain they currently accept]. Example: "Get a fully formatted legal contract reviewed and redlined in 4 hours -- without paying law firm hourly rates." The UVP must answer "why this, why now, why from you" in one sentence.
- **Validate the UVP against the "so what?" test**: read the UVP aloud and ask what a skeptical customer would say. If the response is "okay, but why does that matter?", the UVP is still feature-focused, not benefit-focused. Rewrite until the customer benefit is the subject of the sentence.
- **Include the high-level concept** (analogical positioning) only if it genuinely clarifies -- "Airbnb for X" is overused and often misleading. Use this framing only when the business model is structurally similar, not just superficially. "OpenTable for home repairs" works because the booking, inventory, and trust mechanics are genuinely analogous.
- **Distinguish MVP from full solution**: if the business is pre-revenue, note what the minimum viable solution is versus the full vision. This prevents the plan from promising features that do not exist and misleading readers.

---

### Step 4: Map Channels and Go-to-Market Logic

Channels determine whether a business can acquire customers profitably. Most plans fail here because they list channels without logic.

- **List exactly three channels** in priority order based on cost, reach, and fit with customer behavior. Do not list channels the founder wishes were true -- list channels where the target customer already spends time and money.
- **Apply the channel-customer alignment test**: for each channel, state (a) where the customer is when they experience the problem, (b) what triggers them to seek a solution, and (c) how this channel intersects that trigger moment. Channels that miss the trigger moment will underperform.
- **Categorize channels** by acquisition type: inbound (SEO, content, product-led growth, community), outbound (cold email, paid ads, SDR calls, direct mail), and partnerships (referral agreements, integrations, channel resellers, OEM relationships). Early-stage businesses with limited budgets should prioritize one inbound and one outbound channel before scaling.
- **Calculate channel economics** if data is available: cost per lead (CPL), conversion rate from lead to customer, and resulting CAC. If the business is pre-revenue, state benchmark CAC estimates from comparable businesses in the same category (e.g., B2B SaaS CAC is typically $500-$5,000 depending on ACV; consumer app CAC via paid social is typically $3-$30 depending on vertical).
- **Address the cold start problem** explicitly for marketplace and platform businesses: which side of the market do you acquire first, and how do you prevent the other side from arriving to an empty marketplace? Common strategies include supply-first seeding (hand-curating the supply side), demand-side waitlists (creating FOMO before supply is live), or geographic clustering (launching in one city to achieve density before expanding).
- **Note virality mechanics** if present: built-in referral loops (PayPal's $10/$10 referral), network effects (value increases with each user), or social proof triggers (public activity feeds). Organic virality dramatically changes CAC economics and should be highlighted if structurally present in the product.

---

### Step 5: Define Revenue Model and Unit Economics

The revenue model section must be specific enough that a reader can estimate whether the business is financially viable. Vague revenue models ("we'll charge for premium features") are plan-killers.

- **State the revenue model type** and the specific mechanism: how money moves from customer to business, when it is recognized, and whether it is recurring or transactional. Recurring revenue (subscriptions, retainers, usage-based with sticky customers) commands higher valuations than one-time transactional revenue.
- **Assign specific price points** even if they are estimates. Use market comparables to anchor pricing: similar SaaS tools in the B2B mid-market typically price between $50-$500 per seat per month; consumer subscriptions are typically $5-$30/month. If the founder has no pricing data, state the willingness-to-pay hypothesis and what validation would confirm it.
- **Calculate unit economics** for the primary revenue stream using three core metrics:
  - **CAC (Customer Acquisition Cost)**: total sales and marketing spend divided by new customers acquired in the same period. Pre-revenue businesses should estimate from channel benchmarks.
  - **LTV (Customer Lifetime Value)**: average revenue per customer per period × gross margin × average customer lifetime. For subscription businesses, LTV = (ARPU × Gross Margin) / Monthly Churn Rate. An LTV:CAC ratio below 3:1 is a warning sign; above 3:1 is generally healthy.
  - **Payback Period**: CAC divided by monthly gross profit per customer. Best-in-class SaaS businesses recover CAC in 12-18 months; consumer businesses in 6-12 months.
- **State gross margin** explicitly. Software businesses typically achieve 70-85% gross margins; marketplace businesses 50-70% (after payment processing); services businesses 30-60%; hardware 20-50%. Gross margin is the ceiling on all downstream profitability.
- **For marketplace or platform businesses**, add take rate (the percentage of GMV captured as revenue). Typical marketplace take rates range from 5-30% depending on the degree of value added by the platform. Justify the take rate relative to the value delivered -- if the platform saves the customer 10 hours and $500 in risk, a 15% fee on a $300 job is easily justified.
- **For freemium businesses**, state the conversion rate assumption from free to paid. Typical B2B freemium conversion rates are 2-8%; B2C is 1-5%. Validate whether the freemium tier is a genuine acquisition funnel or a cost center with no conversion path.

---

### Step 6: Define Key Metrics and the North Star Metric

Metrics define what success looks like and prevent the business from optimizing for the wrong thing.

- **Identify 3-5 key metrics** that are directly tied to business model health, not vanity metrics. Downloads, page views, and registered users are vanity metrics unless the business is advertising-supported. Revenue-linked metrics: Monthly Recurring Revenue (MRR), Average Revenue Per User (ARPU), Net Revenue Retention (NRR), Gross Merchandise Volume (GMV), or Jobs Completed.
- **Designate one North Star Metric (NSM)** -- the single metric that best captures the value the business delivers to customers and predicts long-term revenue health. Examples: Airbnb's NSM is "nights booked" (not revenue, because nights booked predicts both supply and demand health); Slack's NSM is "messages sent per team per day" (predicts retention and expansion revenue); a home services marketplace NSM is "completed jobs per week."
- **Use the AARRR framework** (Acquisition, Activation, Retention, Revenue, Referral) to ensure key metrics cover the full customer lifecycle -- not just acquisition. Most early-stage plans over-index on acquisition metrics and under-index on retention, which is the primary driver of LTV.
- **Set targets with time horizons** -- a metric without a target and deadline is not a metric, it is a wish. For each metric, state the current baseline (or "0 -- pre-launch"), the 6-month target, and the 12-month target.
- **Include retention metrics** specific to the business model: for SaaS, monthly churn rate below 2% is healthy, above 5% is a red flag. For marketplaces, repeat transaction rate above 40% in 90 days indicates strong retention. For consumer subscriptions, monthly churn above 3% creates a leaky bucket that no acquisition strategy can overcome.

---

### Step 7: Articulate Unfair Advantage, Cost Structure, and Milestones

This final step grounds the plan in reality -- resources required, what makes the business defensible, and what happens next.

- **Unfair advantage** must be something a well-funded competitor cannot buy tomorrow. The canonical unfair advantage categories are: proprietary data (collected through usage, grows with scale), network effects (each user makes the product more valuable for all others), switching costs (high cost for customers to leave once embedded), regulatory moats (licenses, patents, FDA approvals), community and brand trust (earned over years, not purchasable), and unique expertise or relationships that cannot be hired. "We have a great team" is not an unfair advantage -- it is an assumption. "Our CTO is the former head of fraud detection at Visa and built the only patented behavioral biometrics system in the market" is an unfair advantage.
- **If no unfair advantage exists yet**, state honestly: "None yet -- building toward [X] through [specific mechanism]." A plan that claims an unfair advantage that does not yet exist is less credible than one that acknowledges the gap and describes a credible path to building one.
- **Cost structure**: list the top 5 cost categories and assign realistic monthly estimates. The most common categories for early-stage businesses are: (1) people (salaries, contractors, equity), (2) customer acquisition (paid ads, events, sales costs), (3) infrastructure (hosting, APIs, tools, payments), (4) operations (customer support, fulfillment, insurance), and (5) compliance (legal, accounting, regulatory). Flag any cost categories that scale linearly with revenue (variable costs) vs. those that are fixed -- the distinction matters for profitability modeling.
- **Milestones**: write exactly 3-5 milestones covering the next 12-18 months. Each milestone must answer three questions: (a) what specifically will be accomplished, (b) by when, and (c) how will you know it is complete (the success metric). Milestones should follow a logical progression: from product validation, to first revenue, to unit economics proof, to market expansion. "Launch the product" is incomplete; "Launch beta to 100 paying customers at $99/month with a 30-day retention rate above 60% by [date]" is a milestone.
- **Identify the single riskiest assumption** embedded in the plan -- the one thing that must be true for the entire business to work. Naming this assumption builds credibility with sophisticated readers and focuses the team on what to validate first. Common riskiest assumptions: "customers will pay for this," "we can acquire customers at a cost below $X," "the supply side of the marketplace will join and remain active," "retention will be high enough to support the LTV model."

---

## Output Format

```
## Business Plan: [Business Name]

**One-liner:** [What the business does in one sentence -- subject + verb + customer + outcome]
**Stage:** [Idea | Validation | Pre-revenue | Revenue | Scaling]
**Format:** [Lean Canvas | Traditional]
**Prepared:** [Date]

---

### Problem
1. **[Primary Problem]:** [Specific description of the pain -- include frequency, cost, or emotional weight]
2. **[Secondary Problem]:** [How it compounds or relates to the primary problem]
3. **[Tertiary Problem]:** [Supporting pain that creates additional urgency]

**Existing Alternatives (how customers cope today):**
- [Behavioral alternative 1, e.g., "manual spreadsheet tracking"]
- [Behavioral alternative 2, e.g., "hired a part-time bookkeeper"]
- [Named competitor or category, if directly relevant]

**Riskiest Assumption:** [The single thing that must be true for the business to work]

---

### Customer Segments

| Segment | Profile | Emotional State | Size Estimate |
|---------|---------|----------------|---------------|
| Primary: [Name] | [Demographics, role, behavior, context] | [Frustration/anxiety/cost pain they feel] | [TAM/SAM/SOM or headcount] |
| Early Adopters: [Name] | [Why they feel the problem most acutely, what they have already tried] | [Urgency level] | [Reachable count or community size] |

---

### Solution

| Problem | Solution | Outcome for Customer |
|---------|----------|---------------------|
| [Problem 1] | [Specific product capability or service that addresses it] | [Measurable or felt result] |
| [Problem 2] | [Specific product capability or service] | [Measurable or felt result] |
| [Problem 3] | [Specific product capability or service] | [Measurable or felt result] |

**MVP (Minimum Viable Solution):** [What will exist at launch vs. what is future roadmap]

---

### Unique Value Proposition

> [Single sentence: action verb + specific outcome + target customer + without the key trade-off they currently accept]

**High-Level Concept:** [X for Y analogy, only if structurally accurate -- otherwise omit]

---

### Channels

| Channel | Type | Why It Fits This Customer | Estimated CAC |
|---------|------|--------------------------|---------------|
| [Channel 1] | [Inbound/Outbound/Partnership] | [Where this customer is when they feel the problem] | [$X or "TBD -- benchmark: $Y"] |
| [Channel 2] | [Inbound/Outbound/Partnership] | [Trigger moment this channel intercepts] | [$X or "TBD -- benchmark: $Y"] |
| [Channel 3] | [Inbound/Outbound/Partnership] | [Reach and fit rationale] | [$X or "TBD -- benchmark: $Y"] |

---

### Revenue Model

| Stream | Mechanism | Price Point | Gross Margin | Unit Economics |
|--------|-----------|-------------|--------------|----------------|
| [Primary stream] | [How money flows from customer to business] | [$X/mo, $X/unit, X% take rate] | [X%] | [CAC: $X | LTV: $X | Payback: X mo | LTV:CAC: X:1] |
| [Secondary stream, if applicable] | [Mechanism] | [Price] | [Margin %] | [Economics if available] |

**Revenue Model Notes:** [Any pricing assumptions, willingness-to-pay hypotheses, or validation needed]

---

### Key Metrics

**North Star Metric:** [The single metric that best predicts long-term business health] -- Target: [X by Month Y]

| Metric | Definition | Baseline | 6-Month Target | 12-Month Target |
|--------|-----------|---------|---------------|----------------|
| [Metric 1 -- Acquisition] | [Precise definition] | [Current value or 0] | [Target] | [Target] |
| [Metric 2 -- Retention] | [Precise definition] | [Current value or 0] | [Target] | [Target] |
| [Metric 3 -- Revenue] | [Precise definition] | [Current value or 0] | [Target] | [Target] |
| [Metric 4 -- Efficiency] | [Precise definition] | [Current value or 0] | [Target] | [Target] |

**Health Thresholds:**
- Monthly churn above [X%] is a red flag requiring immediate retention action
- LTV:CAC ratio below 3:1 triggers channel efficiency review
- [Business-model-specific threshold, e.g., "take rate below 10% is unsustainable given ops costs"]

---

### Unfair Advantage

**Current:** [What exists today that cannot be easily replicated -- or "None yet"]
**Building toward:** [Specific mechanism, timeline, and what triggers it to become defensible]

---

### Cost Structure

| Category | Description | Monthly Estimate | Fixed or Variable |
|----------|------------|-----------------|------------------|
| People | [Headcount, roles, or contractor breakdown] | [$X] | Fixed |
| Customer Acquisition | [Paid channels, events, sales costs] | [$X] | Variable |
| Infrastructure | [Hosting, APIs, tools, payment processing] | [$X] | Semi-variable |
| Operations | [Support, fulfillment, insurance, compliance] | [$X] | Mixed |
| Compliance & Legal | [Ongoing legal, accounting, regulatory] | [$X] | Fixed |
| **Total Monthly Burn** | | **[$X]** [Label as Projected if pre-revenue] | |

**Months of Runway at Current Burn (if applicable):** [X months]

---

### Milestones

| Milestone | Description | Target Date | Success Metric | Validates |
|-----------|------------|------------|----------------|-----------|
| [Milestone 1] | [Specific deliverable] | [Month/Year] | [Measurable outcome -- number, rate, or event] | [Which riskiest assumption this proves or disproves] |
| [Milestone 2] | [Specific deliverable] | [Month/Year] | [Measurable outcome] | [Assumption validated] |
| [Milestone 3] | [Specific deliverable] | [Month/Year] | [Measurable outcome] | [Assumption validated] |
| [Milestone 4, if applicable] | [Specific deliverable] | [Month/Year] | [Measurable outcome] | [Assumption validated] |
```

---

## Rules

1. **Never produce a plan without completing Step 1 context collection.** A business plan written from a one-sentence prompt will be generic and useless. If the user has not provided stage, target customer, problem specifics, and revenue model, ask for them before writing a single section.

2. **The Unique Value Proposition is exactly one sentence.** No bullet list, no paragraph, no "and also." If the plan requires more than one sentence to explain the UVP, the positioning is not yet clear enough. Force the reduction.

3. **Every problem must have a corresponding solution row.** An orphaned problem (stated in the Problem section but missing from the Solution table) signals either a gap in the product or a gap in the plan's logic. Both are disqualifying to a sophisticated reader.

4. **Existing alternatives must describe behavior, not just competitors.** "Existing alternative: Excel and a part-time admin" is more insightful than "Existing alternative: Competitor X." The behavioral alternative reveals the switching cost and the motivation to change.

5. **Revenue model must include a specific price point.** "TBD" or "competitive pricing" is not acceptable. If the founder has no pricing data, benchmark against comparable business models and label the figure as a hypothesis requiring validation. A wrong estimate with stated assumptions is more useful than a blank.

6. **Key metrics must be measurable quantities with targets and time horizons.** "Grow the user base" is not a metric. "Reach 1,000 Monthly Active Users (MAU) by Month 6, measured as users who complete at least one core action in a 30-day window" is a metric.

7. **Unfair advantage must pass the "can a well-funded competitor buy this tomorrow?" test.** If the answer is yes, it is not an unfair advantage -- it is a feature. Network effects, proprietary data, regulatory approvals, and deeply embedded switching costs pass this test. "Better UX," "lower price," and "passionate team" do not.

8. **Label all financial figures as "Projected" for pre-revenue businesses and state the key assumptions explicitly.** A pre-revenue plan that presents financial figures without labeling them as projections is misleading. State the 2-3 assumptions each figure rests on (e.g., "Projected CAC of $40 assumes 2% conversion from neighborhood forum posts at a $0.80 CPM").

9. **Milestones must include a "Validates" column.** Every milestone should test a specific assumption embedded in the business plan. A milestone that does not advance learning -- that is, one that produces output but does not resolve uncertainty -- is a false milestone. The Validates column forces each milestone to be tied to a real decision point.

10. **Do not include generic business advice, motivational language, or filler.** Every sentence in the output must contain specific information about this business. "Great companies start with a great team" belongs in a motivational poster. "Our founding team has a combined 15 years in home services operations and has previously managed a two-sided marketplace to $10M GMV" belongs in a business plan.

11. **For marketplace or two-sided platform businesses, both sides of the market must appear in the Customer Segments section.** A marketplace plan that only describes the demand side without addressing supply acquisition, supply economics, and supply quality control is incomplete. The chicken-and-egg problem must be acknowledged and addressed.

12. **The riskiest assumption must be named explicitly.** Every business plan embeds assumptions that, if wrong, invalidate the model. The most dangerous assumption is the one the founder is least willing to test because they believe it most strongly. Naming the riskiest assumption builds credibility with experienced readers and focuses early validation effort on the highest-leverage question.

---

## Edge Cases

### Pre-Idea or Validation Stage (No Product Built)
When the business is still a hypothesis, the plan functions as a structured set of testable assumptions rather than a description of a working business. Mark every solution element as a hypothesis. Add a "Validation Plan" subsection to the Milestones section that lists the top 3 customer discovery experiments (e.g., "conduct 20 problem interviews with restaurant owners in our target segment by [date]"), the hypothesis each experiment tests, and the threshold that would confirm or refute it (e.g., "if fewer than 14 of 20 interviewees name this as their top-3 problem, pivot problem definition"). Use Rob Fitzpatrick's "Mom Test" principles: validation interviews should ask about past behavior, not future intentions.

### Service Business (Consulting, Agency, Skilled Trades)
Service businesses have structurally different economics than software businesses. Revenue model entries should use hourly ($X/hr), project-based ($X per engagement), or retainer ($X/month for Y deliverables) pricing. Unit economics are margin per engagement (revenue minus direct labor and delivery costs) rather than MRR-based LTV. The gross margin benchmark for professional services is 35-55% after accounting for billable utilization rates (typically 65-75% for knowledge workers). Channels should emphasize referral and outbound relationship-building over paid acquisition, as service businesses typically achieve 60-80% of new revenue through referrals in years 2-5. The unfair advantage in service businesses is most commonly a specific methodology, proprietary framework, or access to a high-trust network that competitors cannot replicate.

### Marketplace or Platform Business (Two-Sided Networks)
Both the supply side and demand side must be fully described in the Customer Segments section with separate channel strategies and separate acquisition economics. State the chicken-and-egg strategy explicitly: supply-first (seed supply manually before opening to demand), demand-first (build a waitlist of buyers before signing up sellers), or simultaneous launch in a constrained geography (launch in one city to achieve density before expanding). Key metrics must include supply health metrics (e.g., active listings, supply-demand ratio, fill rate) in addition to demand metrics. Take rate must be justified relative to the platform's value contribution -- extracting 25% take rate on a marketplace where the platform provides no trust, payments, or logistics infrastructure will face supply-side revolt. Include a "liquidity" metric: the probability that a buyer can find a match in under X minutes/hours, which is the core value the platform delivers.

### Nonprofit or Social Enterprise
Replace "Revenue Model" with "Funding Model" and categorize by source: earned revenue (fees for service, product sales), philanthropic funding (grants, donations, major gifts), government contracts, and investment capital (program-related investments, social impact bonds). Key metrics must include impact metrics alongside financial sustainability metrics -- state the theory of change (if we do X, outcome Y will occur, which leads to impact Z) and the specific indicators used to measure each outcome. Unfair advantage in nonprofit contexts is most commonly mission credibility with a specific community (which takes years to build and cannot be purchased), access to a population that other organizations cannot reach, or deep government or funder relationships. Financial sustainability ratio (earned revenue as a percentage of total operating expenses) is a critical metric -- organizations below 30% earned revenue are highly dependent on philanthropic cycles.

### User Requests Traditional Format Instead of Lean Canvas
When the user explicitly requests traditional format (common for SBA loan applications, bank financing requests, or established businesses updating their plan), restructure the output into: (1) Executive Summary (half page max -- the entire plan in miniature), (2) Company Overview (legal structure, location, founding date, stage), (3) Problem and Market Opportunity (problem, customer segments, TAM/SAM/SOM), (4) Product or Service Description (what it is, how it works, IP or proprietary elements), (5) Go-to-Market and Sales Strategy (channels, sales process, pricing), (6) Operations (team, key processes, key vendors or partners), (7) Financial Highlights (revenue model, unit economics, burn rate, funding needed and use of funds), (8) Milestones and Risk Factors. Maintain the same specificity requirements -- the change is structural, not a license to be vague.

### Hardware or Physical Product Business
Add a "Supply Chain and Manufacturing" section to the Cost Structure that distinguishes between NRE (non-recurring engineering costs -- tooling, molds, certifications), COGS (bill of materials + manufacturing labor + logistics), and operating costs. Gross margin for hardware is typically 20-50% at scale and 5-20% at initial production volumes -- state the volume at which target margin is achieved. Regulatory and certification costs (FCC, CE, UL, FDA depending on product category) must appear in the cost structure. Channel strategy must address the distinction between DTC (direct-to-consumer via e-commerce), retail distribution (which requires minimum order quantities, margin for the retailer -- typically 40-50% -- and co-op marketing dollars), and OEM (original equipment manufacturer) partnerships.

### Highly Regulated Industry (Healthcare, Fintech, Legal, Education)
When the business operates in a regulated space, add a "Regulatory and Compliance" section. State the specific regulatory frameworks that apply (e.g., HIPAA for health data, PCI DSS for payment processing, SEC/FINRA for investment products, FERPA for student data). Identify any licenses, registrations, or approvals required before launch and the estimated timeline and cost to obtain them. Regulatory compliance is often a legitimate unfair advantage in regulated markets -- once obtained, it raises the barrier to entry for new competitors. Compliance costs must appear explicitly in the cost structure, and milestone timelines must account for regulatory approval timelines (FDA 510(k) clearance, for example, can take 3-12 months and must appear as a milestone, not a footnote).

### Existing Business Pivoting to a New Model
When an existing revenue-generating business is considering a pivot (new customer segment, new revenue model, new product line), the plan must address transition risk explicitly. Add a "Transition Economics" section that states: current revenue at risk from the pivot, the timeline over which new revenue will replace it, and the minimum runway required to survive the transition period. The riskiest assumption in a pivot plan is almost always "our existing customers will follow us to the new model" or "our existing distribution channels will work for the new product" -- both of which should be explicitly named and validated before the pivot is fully committed.

---

## Example

**Input:** "I want to create a business plan. My idea is a B2B SaaS tool for independent insurance agencies -- helps them manage client renewals and policy tracking in one place instead of juggling 5 spreadsheets and sticky notes. Agencies pay me monthly. I'm solo founder, pre-revenue, have 15 years in insurance operations, and have already talked to 12 agency owners who confirmed the pain. I want a Lean Canvas format."

---

## Business Plan: RenewalDesk

**One-liner:** RenewalDesk is a SaaS platform that gives independent insurance agencies a single system for tracking client policy renewals, automating reminder workflows, and eliminating the revenue leakage caused by missed or late renewals.
**Stage:** Pre-revenue (validation complete -- 12 discovery interviews conducted)
**Format:** Lean Canvas
**Prepared:** [Current Date]

---

### Problem
1. **Missed and late renewals cause direct revenue loss:** Independent agencies with 200-500 active policies manage renewal timelines across 5+ insurer portals and 2-4 spreadsheets, resulting in an estimated 3-8% of policies lapsing annually due to tracking failures -- each lapse costs the agency the full commission on that policy ($150-$800 per policy).
2. **No unified client communication record at renewal time:** Agents spend 45-90 minutes per renewal reconstructing client communication history from email, sticky notes, and spreadsheet comments to prepare for renewal conversations, creating a time cost that limits how many renewals a single agent can handle per week.
3. **Renewal pipeline has no visibility for agency principals:** Agency owners cannot see which renewals are on track, at risk, or overdue without manually querying each agent -- making revenue forecasting and workload distribution impossible without a weekly all-hands meeting.

**Existing Alternatives (how agencies cope today):**
- Multi-tab Excel workbooks with conditional formatting for date alerts (primary method for ~70% of agencies under 500 policies)
- Outlook calendar reminders set manually per policy (used alongside spreadsheets)
- Agency Management Systems (AMS) like Applied Epic or HawkSoft -- overpowered, $500-$2,000/month, designed for agencies with 2,000+ policies; renewal workflow is buried under 40+ modules
- Sticky notes and physical desk calendars (used as supplementary systems by 60% of interviewed agencies)

**Riskiest Assumption:** Agency owners will pay a monthly subscription fee for a standalone renewal tool rather than waiting for their existing AMS to add this feature, or building a more robust internal spreadsheet system.

---

### Customer Segments

| Segment | Profile | Emotional State | Size Estimate |
|---------|---------|----------------|---------------|
| Primary: Independent P&C Insurance Agencies | 1-10 agents, 200-1,500 active policies, not yet using an AMS or currently frustrated with their AMS renewal module; revenue $300K-$3M/year; owner-operated; licensed in 1-3 states | Anxious about missed renewals, frustrated by administrative overhead, embarrassed when clients lapse without warning | ~38,000 independent P&C agencies in the US with 1-10 agents (IIABA data); TAM ~$114M/year at $250/mo average; SAM (reachable via digital channels) ~$34M/year |
| Early Adopters: Growth-stage agencies adding their 3rd-5th agent | Owner has outgrown personal spreadsheet system, beginning to delegate renewals to staff but has no standardized process; actively Googling "insurance renewal tracking software"; willing to pay immediately for any working solution | High urgency -- feels the organizational pain daily; has already experienced at least one painful lapse in the past 12 months | ~8,000 agencies matching this profile; reachable via independent agent association forums and LinkedIn groups (IIABA, PIA member directories) |

---

### Solution

| Problem | Solution | Outcome for Customer |
|---------|----------|---------------------|
| Missed renewals causing policy lapses | Centralized renewal calendar with automated 90/60/30-day email and SMS alerts triggered by policy effective date; no manual setup per policy after initial import | Agencies reduce policy lapse rate from 3-8% to under 1%; estimated revenue saved: $4,000-$15,000/year per agency depending on book of business size |
| 45-90 minute per-renewal prep time | Unified client record that aggregates policy details, communication history, and renewal notes in one screen; one-click renewal summary exported as a PDF for client calls | Renewal prep time reduced to under 10 minutes per client; single agent can handle 40% more renewals per week |
| No pipeline visibility for agency owners | Principal dashboard showing renewal pipeline by agent, by status (on-track, at-risk, overdue), and by projected commission value; weekly digest email auto-generated every Monday | Agency principals can conduct renewal reviews in 15 minutes instead of a weekly all-hands; revenue forecast accuracy improves |

**MVP (Minimum Viable Solution):** Policy import via CSV, renewal calendar with automated email alerts at 90/60/30 days, and client notes field. Principal dashboard and SMS alerts are Phase 2 (Month 4-6 post-launch).

---

### Unique Value Proposition

> RenewalDesk gives independent insurance agencies a single renewal management system that eliminates policy lapses and cuts per-renewal prep time by 80% -- without the complexity or cost of a full Agency Management System.

**High-Level Concept:** "The renewal module that every AMS should have but doesn't, sold standalone."

---

### Channels

| Channel | Type | Why It Fits This Customer | Estimated CAC |
|---------|------|--------------------------|---------------|
| Independent agent association communities (IIABA, PIA state chapters) | Inbound/Partnership | Agency owners actively seek peer recommendations before purchasing any operations tool; association endorsement creates instant trust in a trust-driven industry | Projected: $80-$120 per trial signup; benchmark from comparable B2B niche SaaS: $200-$600 CAC |
| LinkedIn outbound to agency principals with 3-10 employees | Outbound | Agency owners are identifiable by role, company size, and license type on LinkedIn; direct outreach from a credentialed insurance operations professional (15-year background) will be well-received | Projected: $150-$250 per trial; includes sales time at opportunity cost |
| Content SEO targeting "insurance renewal tracking software" and "policy renewal management" | Inbound | These terms are searched by agency owners experiencing the exact problem; low competition in niche insurance operations search space | Projected: $30-$60 per organic trial at scale (Months 6-12); near zero early until content accumulates |

---

### Revenue Model

| Stream | Mechanism | Price Point | Gross Margin | Unit Economics |
|--------|-----------|-------------|--------------|----------------|
| Monthly SaaS subscription | Per-agency flat fee; one subscription per agency regardless of agent count (up to 10 agents) | $199/month (Tier 1: up to 500 policies); $349/month (Tier 2: 501-1,500 policies) | 85% (cloud hosting $8/agency/month; payment processing 2.9%) | Projected CAC: $200 | Projected LTV (24-month avg tenure, 3.5% mo. churn): $1,430 at $199/mo | LTV:CAC: 7.2:1 | Payback: ~1.5 months |
| Annual prepayment discount | Customer pays 12 months upfront at 2-month discount (10 months billed) | $1,990/year (Tier 1 annual) | 85% | Improves cash flow; reduces churn risk by ~40% for prepaid cohort (benchmark from comparable SMB SaaS) |

**Revenue Model Notes:** $199/month pricing validated against 8 of 12 discovery interview participants who named a willingness to pay between $100-$300/month. Two participants named $50-$100, two named $400+. Annual plan discount to be tested in Month 2-3 of revenue operations. Free trial of 14 days with no credit card required to reduce friction; conversion rate hypothesis: 25% of trial users convert (benchmark for SMB SaaS with strong product-problem fit: 20-35%).

---

### Key Metrics

**North Star Metric:** Active policy records managed on RenewalDesk -- Target: 50,000 policies under management by Month 12 (indicates both customer count and depth of usage per customer)

| Metric | Definition | Baseline | 6-Month Target | 12-Month Target |
|--------|-----------|---------|---------------|----------------|
| MRR (Monthly Recurring Revenue) | Sum of all active subscription fees in a calendar month | $0 (pre-revenue) | $15,000 (75 agencies) | $45,000 (200 agencies) |
| Monthly Churn Rate | Agencies that cancel in month / total agencies at start of month | N/A | <4% (acceptable during early iteration) | <2.5% (target steady state for SMB SaaS) |
| Trial-to-Paid Conversion Rate | Trials started in period that convert to paid within 14 days | N/A | 20% (initial hypothesis) | 28% (as onboarding improves) |
| Time-to-First-Renewal-Alert | Minutes from account creation to first automated renewal alert configured | N/A | <15 minutes (activation metric) | <8 minutes (with guided onboarding) |

**Health Thresholds:**
- Monthly churn above 5% requires immediate customer interview sprint to identify top cancellation reason
- LTV:CAC ratio below 3:1 triggers channel efficiency review and pricing experiment
- Trial-to-paid conversion below 15% triggers onboarding redesign sprint

---

### Unfair Advantage

**Current:** Founder has 15 years of insurance operations experience and has personally managed renewal workflows at independent agencies. This enables product decisions grounded in real workflow knowledge that an outsider building "insurance software" would take 2-3 years of customer research to acquire. Discovery interview access (12 interviews completed before a line of code was written) demonstrates founder distribution advantage -- the ability to get in front of the target customer without a marketing budget.

**Building toward:** Proprietary renewal performance benchmarking data (lapse rates, renewal timing patterns, agent productivity benchmarks) that becomes more accurate and valuable with each agency added to the platform. By Month 18, RenewalDesk will be the only source of independent agency renewal performance benchmarks in the market -- a data asset that can be used to justify pricing, attract media coverage in insurance trade press, and create a self-reinforcing acquisition loop.

---

### Cost Structure

| Category | Description | Monthly Estimate | Fixed or Variable |
|----------|------------|-----------------|------------------|
| People | Solo founder (sweat equity, no salary draw until $15K MRR); contract developer for MVP ($6,000/month for 4-month build) | $6,000 (build phase); $0 (post-launch, until $15K MRR) | Fixed (build phase) |
| Customer Acquisition | LinkedIn Sales Navigator ($100/mo), content tools ($50/mo), association membership dues ($200/mo), outreach tools ($80/mo) | $430 | Fixed |
| Infrastructure | AWS hosting ($150/mo), Stripe payment processing (2.9% of revenue), email delivery service ($30/mo), analytics ($50/mo) | $230 + 2.9% of revenue | Semi-variable |
| Customer Success | Help desk software ($50/mo), screen recording for onboarding ($20/mo), founder's time (10 hrs/week) | $70 | Fixed |
| Compliance & Legal | Insurance industry-specific data handling review (one-time $2,500 legal review); ongoing accounting ($300/mo) | $300 ongoing; $2,500 one-time | Fixed |
| **Total Monthly Burn (build phase)** | | **$7,030 [Projected]** | |
| **Total Monthly Burn (post-launch, pre-revenue)** | | **$1,030 [Projected]** | |

**Months of Runway:** Founder has $30,000 in personal savings allocated to this venture. At $7,030/month during 4-month build: $28,120 spent through MVP launch. Remaining $1,880 provides ~1.8 months post-launch runway at $1,030/month burn. First 10 paying customers ($1,990 MRR) cover ongoing burn. **Critical milestone: 10 paying customers within 60 days of launch.**

---

### Milestones

| Milestone | Description | Target Date | Success Metric | Validates |
|-----------|------------|------------|----------------|-----------|
| MVP Launch | CSV policy import, renewal calendar, automated 90/60/30 day email alerts, and basic client notes live and stable | Month 4 from start | 0 critical bugs; 5 beta agencies completing full policy import and receiving first automated alert | That the core product can be built by a solo founder + one contractor within budget and 4 months |
| First 10 Paying Customers | Convert beta agencies and discovery interview participants to paid subscriptions at $199/month | Month 6 from start | $1,990 MRR; average trial-to-paid conversion among beta cohort >= 20% | That agencies will pay $199/month for a standalone renewal tool (riskiest assumption) |
| 50 Paying Customers and CAC Validation | Scale from personal network to first channel-acquired customers via LinkedIn outbound and one IIABA state chapter partnership | Month 9 from start | $9,950 MRR; at least 20 of 50 customers acquired through a channel other than founder's personal network; CAC confirmed <= $250 | That customer acquisition is repeatable and economics are sustainable beyond founder's personal network |
| Churn Rate Stabilization | Identify and resolve top 2 cancellation drivers through monthly churned-customer interviews; implement retention improvements | Month 12 from start | Monthly churn rate at or below 2.5% for 3 consecutive months; NPS score >= 40 from active customer base | That the product has sufficient retention to support an LTV model justifying paid acquisition at scale |
