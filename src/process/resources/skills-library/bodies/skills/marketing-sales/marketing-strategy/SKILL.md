---
name: marketing-strategy
description: |
  Produces a completed marketing strategy document using STP (Segmentation,
  Targeting, Positioning) framework with goals, audience definition, channel
  mix, budget allocation, and KPIs. Use when the user asks to create a
  marketing strategy, plan marketing for a product or company, define
  marketing goals and channels, or structure a marketing plan.
  Do NOT use for go-to-market launch planning (use go-to-market-strategy),
  single campaign planning (use campaign-planning), or brand positioning
  statement only (use brand-positioning).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "marketing strategy planning analysis"
  category: "marketing-sales"
  subcategory: "marketing"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Marketing Strategy

## When to Use

Use this skill when the user needs a structured, multi-horizon marketing strategy document that integrates audience definition, channel architecture, budget allocation, and performance measurement into a single coherent plan.

**Use this skill when:**
- The user asks to create a marketing strategy, marketing plan, or annual/quarterly marketing roadmap
- The user needs to align marketing investments with specific business goals (revenue targets, user growth, market share)
- The user wants to define and prioritize target segments and develop differentiated positioning for each
- The user needs a channel mix recommendation with budget allocation across multiple channels over a defined period
- The user is building marketing infrastructure from scratch -- no formal strategy exists and they need a full framework
- The user wants to audit and restructure their existing marketing approach after a pivot, funding round, or market expansion
- The user needs to present a marketing plan to leadership, investors, or a board and requires a structured, defensible document
- The user is entering a new market or launching into a new customer segment and needs a strategic framework (not just a launch checklist)

**Do NOT use this skill when:**
- The user needs a time-bound launch plan for a specific product release -- use `go-to-market-strategy` instead, which covers launch sequencing, launch day activities, and pre/post-launch coordination
- The user needs a brief for a single campaign (one ad campaign, one email campaign, one event) -- use `campaign-planning` instead
- The user only wants a brand positioning statement, brand voice definition, or brand identity framework -- use `brand-positioning` instead
- The user needs a detailed content calendar with specific post topics and publishing cadence -- use `content-strategy` after the marketing strategy is established
- The user needs a sales enablement plan or sales-to-marketing handoff framework -- this is a component of the strategy but warrants its own treatment if it is the primary request
- The user needs competitive analysis only without the full strategy context -- handle as a standalone research task

---

## Process

### Step 1: Gather Required Inputs Before Producing Anything

Do not begin drafting the strategy until you have clear answers on each of the following. If the user's prompt is missing critical information, ask targeted questions before proceeding. Insufficient input produces a generic, unusable strategy.

**Required inputs:**
- **Company/product description:** What it does, how it makes money, how long it has been in market
- **Business objectives the marketing must support:** Revenue target, user/customer count, market share percentage, fundraising milestone -- marketing goals must trace directly to these
- **Current state:** Existing customers, current monthly traffic, current leads per month, what marketing (if any) is already happening and its results
- **Target market hypothesis:** Who currently buys, who the company believes should buy, any segments already tested
- **Total marketing budget:** Monthly and/or annual figure; whether headcount costs are included or separate
- **Time horizon:** Is this a 90-day sprint, a 12-month annual plan, or a rolling quarterly plan?
- **Business model:** B2B vs. B2C, SaaS vs. transactional vs. marketplace, average contract value (ACV) or average order value (AOV), sales cycle length -- these determine which channels and tactics are viable
- **Team and execution capacity:** Number of marketers, in-house vs. agency, availability of design and engineering support

**Soft inputs to probe if available:**
- Competitive landscape: 2-3 named direct competitors and how customers currently solve the problem
- Existing brand perception or customer research
- Seasonal patterns or event-driven spikes relevant to the business
- Geographic focus (local, national, global)

If the user provides a brief prompt with partial information (e.g., "create a marketing strategy for my B2B SaaS"), use what is given and clearly flag assumptions in the strategy document so the user can validate or correct them.

---

### Step 2: Apply the STP Framework -- Segmentation, Targeting, Positioning

This is the analytical foundation of the entire strategy. Do not skip or compress this step. Every channel decision and message downstream flows from the targeting and positioning work here.

**Segmentation -- divide the addressable market into distinct groups:**
- Use at least two segmentation dimensions. Firmographic (B2B: company size, industry, revenue band, headcount, geography) and behavioral (job-to-be-done, current solution being replaced, buying trigger) together produce actionable segments. Demographic alone (B2C: age, gender, income) is necessary but insufficient -- layer in psychographic (values, identity, risk tolerance) and behavioral (purchase frequency, use case, platform behavior).
- For B2B, always identify both the economic buyer (who signs the contract) and the end user (who uses the product daily) -- they are often different people with different needs and require different messaging.
- Name each segment with a concrete label, not a letter or number. "Architecture Firm Operations Manager" is useful. "Segment A" is not.
- Estimate segment size where possible. For B2B: use industry data sources like US Census NAICS codes, LinkedIn Audience insights, or industry association membership figures to estimate the number of addressable firms. For B2C: use platform audience size tools, survey data, or published market research.

**Targeting -- select 1-3 priority segments:**
- Score each segment on three criteria: (1) Size and growth trajectory -- is it large enough and growing?, (2) Fit -- does the product solve the segment's problem better than alternatives?, (3) Accessibility -- can you reach them cost-effectively through available channels?
- Select one primary segment as the 80% focus. Trying to serve three segments equally with a limited budget produces diluted messaging and poor results.
- For early-stage companies or limited budgets (under $10K/month), recommend targeting a single segment exclusively for the first 6 months, then expanding.
- Document explicitly why segments are deferred -- this prevents stakeholder pressure from diluting the focus later.

**Positioning -- define how the product should be perceived by each targeted segment:**
- Use the Geoffrey Moore positioning template as a structural guide: "For [target customer] who [has this problem], [product name] is a [category] that [primary benefit]. Unlike [alternative], [product] [key differentiator]."
- Positioning is not a tagline -- it is an internal strategic statement that drives all messaging decisions. Do not confuse the two.
- Each targeted segment may require a different positioning emphasis even if the product is identical. A project management tool might position on "compliance and audit trail" for enterprise buyers and "save 4 hours per week" for individual users.
- Validate that the positioning is defensible: can competitors credibly claim the same thing? If yes, the positioning is not differentiated enough.

---

### Step 3: Set Marketing Objectives Using the SMART-C Framework

Standard SMART (Specific, Measurable, Achievable, Relevant, Time-bound) objectives, with an added C for **Cascading** -- each marketing objective must trace explicitly to a business objective.

**Structure exactly 3-5 objectives covering the full funnel:**
- **Awareness objective:** Reach metric (unique monthly website visitors from target segments, social reach, share of voice vs. competitors). Example baseline source: Google Analytics, SEMrush organic traffic data.
- **Acquisition/demand objective:** Lead volume metric (marketing-qualified leads per month, free trial signups, demo requests). This is the primary demand generation metric.
- **Conversion objective:** New customers or users per month, conversion rate from MQL to customer, revenue attributed to marketing.
- **Retention objective (if applicable):** Net revenue retention, email engagement rate among customers, community participation rate. Retention marketing is often under-resourced -- including it in objectives ensures budget allocation.
- **Efficiency objective (optional but valuable for maturing businesses):** Customer acquisition cost (CAC), marketing-sourced pipeline as % of total pipeline, return on ad spend (ROAS).

**Set baselines before setting targets:**
- If the company has no data, use industry benchmarks as proxies. B2B SaaS conversion rates: 2-5% of website visitors start a trial, 15-25% of trials convert to paid. B2C e-commerce: 1-3% conversion rate from session to purchase, 15-25% email open rate.
- Target growth rates should be ambitious but internally consistent. If you set a 3x traffic goal, you need a 3x lead goal only if conversion rate stays flat -- if you are also improving conversion rate, the relationship changes. Reconcile the math.

---

### Step 4: Design the Channel Mix

Channel selection is where most marketing strategies fail -- teams either spread budget too thin across too many channels or concentrate entirely on one channel and create fragility.

**Map channels to the buyer journey stages:**

| Journey Stage | B2B Primary Channels | B2C Primary Channels |
|---------------|---------------------|---------------------|
| Awareness | SEO/content, LinkedIn ads, podcast sponsorships, industry events, PR | Paid social (Meta, TikTok), influencer, SEO/content, PR, OOH |
| Consideration | Webinars, comparison content, case studies, email nurture, retargeting | Email, retargeting, review sites (G2, Trustpilot), YouTube |
| Decision | Free trial, demo, sales outreach, bottom-funnel paid search (brand + competitor keywords) | Discount offers, cart abandonment email, paid search (branded), live chat |
| Retention | Customer success emails, in-app campaigns, community, customer newsletter, expansion offers | Loyalty program, post-purchase email flows, SMS, personalized recommendations |

**Channel selection decision rules:**
- For B2B with ACV under $5,000: Inbound-led (content + SEO + paid search) is the primary engine. Sales outreach is a secondary motion.
- For B2B with ACV $5,000-$50,000: Inbound + outbound hybrid. SDR-assisted demos, ABM for named accounts, community for bottom-up adoption.
- For B2B with ACV above $50,000: Enterprise motion. Relationship-driven channels dominate -- events, executive roundtables, field marketing, ABM, and strategic partnerships.
- For B2C with AOV under $50: Paid social and email are the primary channels. High volume, short cycle, and emotional purchase triggers make these channels efficient.
- For B2C with AOV above $200: Add paid search (high-intent) and retargeting. Longer consideration phase justifies nurture investment.

**Specify every channel at the tactic level, not the channel level:**
- "LinkedIn advertising" is not specific enough. "LinkedIn single image ads targeting Operations Managers at architecture firms with 10-50 employees, promoting a free project management template, driving to a dedicated landing page" is a channel tactic.
- Each tactic needs: the specific format or mechanism, the audience it reaches, what it asks the audience to do (the conversion action), and the expected volume output.

**Limit the channel set based on budget:**
- Under $3K/month: Maximum 2-3 channels. Spread across more channels produces insufficient scale in any single channel.
- $3K-$10K/month: 3-5 channels. At this range, paid search + one organic channel + email is a typical foundation.
- $10K-$30K/month: 5-7 channels. Full funnel coverage becomes achievable. Add a retention channel and an experimentation line.
- Above $30K/month: 7-10 channels with dedicated experimentation budget. Multi-touch attribution becomes critical at this scale.

---

### Step 5: Allocate Budget with Explicit Rationale

Budget allocation is a strategic decision, not an accounting exercise. Every allocation choice reveals a strategic priority.

**Standard allocation frameworks by business stage:**

*Early stage (pre-product-market fit, under 12 months old):*
- 50-60% toward 1-2 channels for testing and learning, not broad awareness
- 20-30% toward content and organic infrastructure (compounding long-term asset)
- 15% experimentation buffer
- Avoid heavy paid advertising investment before conversion rates are known -- you will overpay to find product-market fit

*Growth stage (PMF confirmed, scaling):*
- 40-50% toward the 1-2 proven acquisition channels with positive ROI
- 20-25% toward brand and awareness-building channels
- 10-15% toward retention and expansion marketing
- 10-15% experimentation on new channels

*Mature/established:*
- 30-40% toward performance/paid channels (defending and expanding market share)
- 25-30% toward brand and content (maintaining category authority)
- 15-20% toward customer marketing, community, and advocacy
- 10-15% toward new market/segment experiments

**Fixed vs. variable cost breakdown:**
- Fixed costs (subscriptions, tools, agency retainers, headcount if included): Must be paid regardless of performance. List these explicitly. Common tools: marketing automation platform ($500-$2,000/month for HubSpot, Klaviyo, or Marketo depending on tier), SEO tools ($100-$400/month for Ahrefs or SEMrush), ad management tools ($200-$600/month), analytics ($0 for GA4, $250-$500/month for Mixpanel or Amplitude at starter tiers).
- Variable costs (ad spend, content production per piece, event sponsorship fees): Scale up or down based on performance. Separate these clearly so the user knows what is controllable.
- Always include a 10-15% experimentation line. This is non-negotiable -- without it, teams never test new channels and the strategy becomes stale within 6 months.

**Calculate required efficiency metrics to validate the budget makes sense:**
- If budget is $8,000/month and the goal is 100 new customers/month, that is a target CAC of $80. Is that consistent with the ACV? For a $1,200/year SaaS product, CAC of $80 gives a CAC:LTV ratio of roughly 1:15 -- excellent. For a $120/year product, $80 CAC is likely unworkable. Flag this math explicitly.
- Payback period check: At what monthly budget level does the company break even on customer acquisition? If CAC payback exceeds 18 months, the acquisition channels need to be more efficient or the pricing model needs to change -- flag this as a strategic risk.

---

### Step 6: Build the Measurement Framework

Measurement architecture determines whether the strategy improves over time or degrades into guesswork.

**Layer the measurement system into three tiers:**

*Tier 1 -- Business metrics (reviewed monthly, owned by leadership):*
- Revenue attributed to marketing (marketing-sourced pipeline, closed-won from marketing leads)
- Customer acquisition cost (blended and by channel)
- Marketing-influenced retention rate or NRR impact

*Tier 2 -- Channel metrics (reviewed weekly, owned by channel managers):*
- Paid: ROAS, CPC, CTR, Quality Score, cost per MQL by campaign
- Organic/SEO: Organic sessions, keyword ranking position for 10-20 target terms, domain authority trend
- Email: Open rate (benchmark: 20-25% B2B, 15-20% B2C), click rate (benchmark: 2-4%), unsubscribe rate (flag if above 0.5%)
- Content: Page sessions, time on page, scroll depth, conversion rate to next stage
- Social: Reach, engagement rate, link clicks, follower growth rate

*Tier 3 -- Operational metrics (reviewed weekly, owned by execution team):*
- Content production: Posts published vs. planned, backlog status
- Ad campaigns: Spend pacing vs. budget, impression share, frequency (if above 4x, creative fatigue risk)
- Email: List growth rate, list hygiene (bounce rate below 2%)

**Define optimization triggers explicitly:**
- If paid channel ROAS falls below [threshold] for 3 consecutive weeks, pause that ad set and reallocate to the top-performing variant
- If organic traffic growth is flat for 2 consecutive months, audit for technical SEO issues (crawlability, Core Web Vitals, index coverage) before producing more content
- If email CTR falls below 1.5% over a 30-day period, run an A/B test on subject lines and CTA copy before continuing the same sequence
- If lead-to-customer conversion rate drops more than 20% below baseline, investigate whether lead quality has degraded (audience targeting shift) or whether the sales/product handoff has broken

**Set the review cadence and make it specific:**
- Weekly (30 min): Paid spend pacing, top-performing content, any anomalies in conversion rates
- Monthly (2-3 hours): Full funnel metrics review, channel performance vs. targets, budget reallocation decisions, upcoming content calendar approval
- Quarterly (half-day): Strategic review -- are the objectives still the right ones? Has the competitive landscape shifted? Should a channel be sunset or added? Recalibrate targets if necessary.

---

### Step 7: Identify Risks and Dependencies

A strategy without a risk register is incomplete. Marketing strategies routinely fail not because the tactics were wrong but because critical dependencies were not surfaced.

**Common risks to assess and document:**
- **Attribution risk:** If the measurement stack is not set up (UTM parameters, GA4 goals, CRM integration), the strategy cannot be optimized. Identify what tracking infrastructure must be built before launch -- this is often a blocker.
- **Content production bottleneck:** If the strategy depends on 4 blog posts per month and 2 case studies per quarter but the team has no dedicated writer, the strategy will underperform. Be explicit about execution requirements.
- **Paid channel dependency risk:** If more than 50% of the budget is in a single paid channel (e.g., Google Ads), a policy change, account suspension, or auction dynamics shift could collapse the pipeline. Flag this concentration risk.
- **Seasonality:** Does the target industry have a fiscal year that affects buying cycles? Architecture and construction, education, retail, and healthcare all have distinct buying seasons. Plan budget and content around these patterns.
- **Sales capacity:** If marketing generates 80 leads/month but sales can only handle 30 demos/month, the strategy creates waste. Align lead volume targets to sales capacity explicitly.

---

### Step 8: Assemble the Strategy Document

Compile all outputs from Steps 1-7 into the structured format below. Order matters: context first, then the analytical foundation (STP), then objectives, then the execution plan (channels, budget), then measurement.

Before finalizing, check internal consistency:
- Do the channel tactics logically serve the target segments identified in STP?
- Does the total budget math reconcile across the budget table?
- Does the lead volume from the channel mix support the conversion objective in the goals table?
- Is there a retention channel even if the user did not ask for one? (Always include it -- its absence is a strategic gap.)
- Are all objectives measurable with a named tool or data source?

---

## Output Format

```
## Marketing Strategy: [Company/Product Name]

**Period:** [Q1 2025 / FY2025 / etc.]
**Budget:** [$X/month | $X annual total]
**Business Objective This Strategy Serves:** [e.g., Grow ARR from $1.2M to $3M by December 2025]
**Business Model:** [B2B SaaS / B2C e-commerce / etc.]
**Average Contract Value / AOV:** [$X]
**Sales Cycle Length:** [X days/weeks/months]
**Geographic Focus:** [US / EMEA / Global / etc.]
**Prepared:** [Date]

---

### Assumptions and Constraints
> List 3-5 key assumptions the strategy depends on, and any hard constraints.
> Example: "Assumes a 2% website-to-trial conversion rate based on industry benchmarks
> (no historical data available). Assumes no dedicated design resource -- all creative
> will use template-based tools. Sales team capacity is capped at 40 demos/month."

---

### 1. Market Segmentation (STP Analysis)

**Segmentation Criteria Used:** [e.g., Firmographic: company size, industry vertical;
Behavioral: current solution being replaced, buying trigger]

| Segment Name | Description | Economic Buyer | End User | Est. Addressable Size | Priority | Rationale |
|-------------|-------------|---------------|---------|----------------------|----------|-----------|
| [Primary segment name] | [Specific description: who, what pain, what triggers purchase] | [Title/role] | [Title/role if different] | [# of firms or people] | #1 | [Why this segment first: size, fit, accessibility] |
| [Secondary segment name] | [Specific description] | [Title/role] | [Title/role] | [# of firms or people] | #2 | [Why second: lower priority because X] |
| [Deferred segment name] | [Specific description] | [Title/role] | [Title/role] | [# of firms or people] | Deferred | [Why not now: wrong CAC, low urgency, competitive disadvantage] |

**Positioning Statements by Target Segment:**

*Primary Segment -- [Segment Name]:*
> "For [specific target customer description] who [problem/frustration with current solution],
> [Product Name] is a [category] that [primary benefit]. Unlike [most common alternative],
> [Product Name] [key differentiator that is defensible and specific]."

*Secondary Segment -- [Segment Name]:*
> "[Same format, different emphasis reflecting what this segment values most]"

---

### 2. Marketing Objectives

**Linking Logic:** [Business objective] requires [X new customers/year], which at a
[X%] trial-to-paid conversion rate requires [X trials/month], which at a [X%]
website-to-trial rate requires [X monthly visitors from target segments].

| # | Objective | Funnel Stage | Metric | Tracking Source | Current Baseline | 12-Month Target | Milestone: Month 6 |
|---|----------|-------------|--------|----------------|-----------------|-----------------|-------------------|
| 1 | [Awareness objective] | Awareness | [Specific metric, e.g., monthly organic sessions from architecture industry keywords] | [Google Analytics 4 / SEMrush] | [Current figure] | [Target figure] | [6-month checkpoint] |
| 2 | [Demand generation objective] | Acquisition | [e.g., MQLs per month (demo request or free trial)] | [CRM: HubSpot / Salesforce] | [Current figure] | [Target figure] | [6-month checkpoint] |
| 3 | [Conversion objective] | Conversion | [e.g., New paying customers per month] | [CRM + billing system] | [Current figure] | [Target figure] | [6-month checkpoint] |
| 4 | [Retention objective] | Retention | [e.g., Monthly email engagement rate among customers / NRR] | [Email platform / billing] | [Current figure] | [Target figure] | [6-month checkpoint] |
| 5 | [Efficiency objective] | Cross-funnel | [e.g., Blended CAC, ROAS, marketing-sourced % of pipeline] | [CRM + ad platforms] | [Current figure] | [Target figure] | [6-month checkpoint] |

---

### 3. Channel Strategy

**Channel Architecture Overview:**
[2-3 sentences explaining the overall channel logic: why these channels, how they
interconnect, and what the primary growth engine is vs. supporting channels.]

| Channel | Journey Stage | Specific Tactic | Target Audience Reached | Conversion Action | Monthly Budget | Expected Monthly Output | Primary KPI | Secondary KPI |
|---------|-------------|----------------|------------------------|------------------|---------------|------------------------|------------|--------------|
| [Channel 1 -- e.g., SEO / Content Marketing] | Awareness + Consideration | [e.g., 4 long-form blog posts/month targeting bottom-of-funnel keywords like "best project management software for architects"; 1 pillar page/quarter] | [e.g., Architecture firm principals searching for solutions] | [e.g., Free template download / newsletter signup] | [$X] | [e.g., 1,200 organic sessions/month by Month 6] | [Organic sessions] | [MQL from organic] |
| [Channel 2 -- e.g., Paid Search] | Decision | [e.g., Google Search campaigns on high-intent terms: "architecture project management software", "alternative to [competitor]", branded keywords] | [e.g., Buyers in active evaluation] | [e.g., Free trial signup] | [$X] | [e.g., 40 trial signups/month at $50 CPA] | [Trial CPA] | [Trial-to-paid conversion rate] |
| [Channel 3 -- e.g., LinkedIn Advertising] | Awareness + Consideration | [e.g., Sponsored content targeting Operations Managers and Principals at architecture firms 10-100 employees; lead gen form campaigns for case study download] | [e.g., Architecture firm decision-makers] | [e.g., Case study download = MQL] | [$X] | [e.g., 25 MQLs/month at $80-120 CPL] | [CPL] | [MQL-to-demo rate] |
| [Channel 4 -- e.g., Email Marketing] | Consideration + Retention | [e.g., 5-email drip sequence for trial users; monthly newsletter for customers; win-back sequence for churned trials] | [e.g., Trial users and existing customers] | [e.g., Trial conversion, expansion purchase] | [$X] | [e.g., 20% trial-to-paid lift from nurture sequence] | [Trial conversion rate from email] | [Customer email engagement rate] |
| [Channel 5 -- e.g., Community / Events] | Awareness + Advocacy | [e.g., Sponsorship of AIA (American Institute of Architects) chapter events; presence at ArchEx and Facades+ conferences; LinkedIn Group participation] | [e.g., Architecture professionals at in-person events] | [e.g., Demo booking at event, card scan to CRM] | [$X] | [e.g., 15 qualified demos/quarter from events] | [Demos from events] | [Brand recall in target community] |
| [Channel 6 -- e.g., Referral Program] | Acquisition | [e.g., Customer referral program: $100 credit for referrer, $50 credit for new signup; in-app prompt at 30-day mark] | [e.g., Satisfied customers referring peers] | [e.g., Referred signup] | [$X] | [e.g., 10-15 referred signups/month at Month 6+] | [Referred signups/month] | [Referral conversion rate] |

---

### 4. Budget Allocation

**Budget Logic:** [1-2 sentences on the allocation philosophy -- e.g., "Budget is weighted
toward proven demand capture channels (paid search) in the first 6 months while organic
content builds. Allocation shifts toward organic and retention in months 7-12 as content
scales and customer base grows."]

**CAC Validation:**
- Target new customers per month: [X]
- Total monthly budget: $[X]
- Implied blended CAC: $[X / X = $X]
- Product ACV/AOV: $[X]
- Implied LTV (at [X] year average retention): $[X]
- CAC:LTV ratio: [X:1] -- [Acceptable / Needs attention / Unsustainable -- flagging as risk]
- CAC payback period: [X months]

| Budget Category | Specific Line Items | Monthly | Annual | % of Total |
|-----------------|-------------------|---------|--------|-----------|
| Content Marketing | Freelance writer ($X/post x 4), content strategist time, design ($X/month template tools) | $[X] | $[X] | [X%] |
| Paid Search (Google Ads) | Search campaign ad spend, [optional: agency management fee or in-house time allocation] | $[X] | $[X] | [X%] |
| Paid Social (LinkedIn) | Sponsored content ad spend, lead gen forms | $[X] | $[X] | [X%] |
| Email Marketing | Platform cost ([tool name] at $X/month for [X] contacts), automation setup (one-time build) | $[X] | $[X] | [X%] |
| Community and Events | Event sponsorships, travel, booth materials (annualized to monthly) | $[X] | $[X] | [X%] |
| Referral Program | Incentive credits budget | $[X] | $[X] | [X%] |
| Tools and Infrastructure | SEO tool ($X), analytics ($X), CRM ($X if not counted in headcount) | $[X] | $[X] | [X%] |
| Experimentation Buffer | New channel tests, creative testing, opportunistic sponsorships | $[X] | $[X] | [10-15%] |
| **Total** | | **$[X]** | **$[X]** | **100%** |

**Phase Allocation (if strategy has distinct phases):**

| Phase | Months | Budget Emphasis | Shift vs. Prior Phase |
|-------|--------|----------------|----------------------|
| Phase 1: Foundation | Months 1-3 | [e.g., 60% paid channels, 30% content build, 10% experiments] | N/A -- establishing baseline |
| Phase 2: Scale | Months 4-9 | [e.g., 50% paid, 35% content + SEO, 15% retention] | Shift 10% from paid to organic as content scales |
| Phase 3: Optimize | Months 10-12 | [e.g., 45% paid, 30% organic, 20% retention/advocacy, 5% experiments] | Increase retention spend as customer base grows |

---

### 5. Measurement Framework

**Measurement Stack:** [List the tools: e.g., GA4 for web analytics, HubSpot CRM for
lead tracking, Google Ads + LinkedIn Campaign Manager for paid channel data, Ahrefs for SEO,
Klaviyo for email metrics. Note any gaps -- tools that need to be set up before launch.]

**Full-Funnel KPI Dashboard:**

| KPI | Funnel Stage | Target (Month 6) | Target (Month 12) | Tracking Source | Reporting Frequency | Optimization Trigger |
|-----|-------------|-----------------|-------------------|----------------|--------------------|--------------------|
| Monthly organic sessions | Awareness | [X] | [X] | GA4 | Weekly | If flat for 8 consecutive weeks, audit technical SEO and content gap |
| Paid search CPC | Awareness/Decision | Under $[X] | Under $[X] | Google Ads | Weekly | If CPC rises above $[X], adjust bid strategy and review Quality Scores |
| MQLs per month | Acquisition | [X] | [X] | HubSpot | Weekly | If below 70% of target for 3 weeks, review landing page conversion rates |
| Trial-to-paid conversion rate | Conversion | [X%] | [X%] | Billing + CRM | Monthly | If drops >15% from baseline, investigate onboarding friction or pricing objections |
| CAC (blended) | Efficiency | $[X] | $[X] | CRM + budget tracker | Monthly | If blended CAC exceeds $[X], pause lowest-ROAS channel and reallocate |
| Email CTR (nurture sequence) | Conversion | [X%] | [X%] | Email platform | Monthly | If below 1.5%, A/B test CTAs and subject lines before sending further emails |
| Customer LTV at 12 months | Retention | $[X] | $[X] | Billing | Quarterly | If LTV trend declines, escalate to product/CS review |
| Net Promoter Score / CSAT | Advocacy | [X] | [X] | Survey tool | Quarterly | If NPS below [X], delay referral program launch |

**Review Cadence:**
- **Weekly (30 min):** Paid spend pacing vs. monthly budget, CTR and CPC by campaign, lead volume vs. weekly target, any anomalous traffic spikes or drops
- **Monthly (2-3 hours):** Full objective scorecard vs. targets, channel-by-channel ROI review, budget reallocation decisions, content production status, upcoming campaign planning approval
- **Quarterly (half-day):** STP validation (are we reaching the right segments?), competitive landscape update, objective recalibration, phase transition review, experimentation results and decisions on what to scale or kill

---

### 6. Risks and Dependencies

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| [e.g., Tracking infrastructure not in place at launch -- UTMs, GA4 goals, CRM integration] | High | High -- strategy cannot be optimized without data | [Build tracking setup checklist as pre-launch dependency; assign owner and deadline] |
| [e.g., Content production bottleneck -- no dedicated writer] | Medium | Medium -- organic channel underperforms | [Engage freelance writer before Month 1; build 6-week content pipeline before publishing begins] |
| [e.g., Paid channel concentration -- >50% budget in Google Ads] | Low | High | [Maintain LinkedIn as secondary paid channel; monitor Google Ads account health weekly] |
| [e.g., Sales capacity insufficient to handle lead volume target] | Medium | High -- leads go stale, CAC rises | [Cap MQL target at sales capacity ceiling of [X] demos/month; revisit after sales team scales] |
| [e.g., Seasonality -- target industry slows in summer months] | Certain | Medium | [Reduce paid spend by 20% in July-August; use that period for content production and SEO work] |
```

---

## Rules

1. **Never produce a strategy before collecting business objectives, budget, and target market.** A strategy without these three inputs is decoration. If any are missing from the user's prompt, ask before drafting. Flag any inputs that are assumed rather than provided.

2. **The STP section must be completed before channel decisions are made.** Channel selection is only meaningful after you know who you are targeting. Recommending LinkedIn before confirming the audience is B2B professionals, for example, is premature -- reverse-engineering channels from segments is the correct order.

3. **Every marketing objective must be expressed as a number, not a direction.** "Increase brand awareness" fails this rule. "Increase monthly organic sessions from architecture-industry keywords from 200 to 3,000 by December" passes. If the user pushes back on setting specific numbers, use industry benchmarks to establish provisional targets and clearly mark them as estimates.

4. **Every channel must be specified at the tactic level, not the channel label level.** "Social media" is not a tactic. "LinkedIn Sponsored Content targeting Operations Directors at firms with 10-50 employees, running carousel ads featuring an ROI calculator, with a lead gen form as the conversion action" is a tactic. Vague channel mentions lead to vague execution and no accountability.

5. **The budget math must reconcile internally.** Before finalizing, verify: (a) the channel budget line items sum to the total, (b) the implied CAC is consistent with the ACV and business model, and (c) the lead volume expected from the channel mix is consistent with the conversion objective. If the math does not work, say so explicitly and recommend adjustments.

6. **Include a retention channel in every strategy, even if the user did not ask for it.** Retention marketing is the highest-ROI marketing activity for any company with an existing customer base. A strategy that only covers acquisition ignores compounding. At minimum, include email-based customer marketing with a modest budget.

7. **Budget concentration above 50% in any single paid channel must be flagged as a risk.** Single-channel dependency is a structural fragility -- algorithm changes, policy violations, or auction dynamics shifts can collapse pipeline overnight. Always recommend a secondary channel as a hedge.

8. **Organic-only channel strategies require explicit timeline expectations.** Content marketing, SEO, and community-building are compounding channels -- they take 6-12 months to produce meaningful traffic. Never imply that an organic strategy will generate leads in Month 1. Set phased expectations: awareness and SEO foundation in months 1-3, first meaningful organic traffic in months 4-6, consistent pipeline contribution in months 9-12.

9. **Segment targeting rationale must be documented and specific.** "We target this segment because they are a good fit" is insufficient. The rationale must explain: why this segment over alternatives (size, accessibility, willingness to pay), which specific problem the product solves for them better than current alternatives, and what evidence or hypothesis supports this choice.

10. **Distinguish between marketing-sourced and marketing-influenced revenue in measurement.** Marketing-sourced: the lead originated from a marketing channel with no prior sales outreach. Marketing-influenced: the prospect was in the pipeline before marketing touched them, but marketing activity accelerated or contributed to the close. Both matter, but conflating them overstates marketing's contribution and leads to budget decisions based on inflated attribution.

11. **Experimentation budget is not optional.** A 10-15% experimentation line must appear in every budget. Marketing channels have lifecycles -- what works today will decay. Without a dedicated testing budget, strategies become brittle and teams default to repeating what worked last year instead of finding what works next year.

12. **For B2B with sales cycles longer than 60 days, include sales-marketing alignment details.** Specify the MQL definition (what signals qualify a lead for sales follow-up), the SLA for sales follow-up on MQLs, and the feedback loop from sales back to marketing on lead quality. Without this, the strategy generates leads that sales ignores and marketing never improves.

---

## Edge Cases

### Very Small Budget (Under $2,500/month)
Paid advertising at this budget level is rarely viable as a primary channel for B2B -- the minimum effective spend for Google Search in a competitive B2B category is typically $1,500-$2,500/month, and that leaves nothing for content or tools. Recommended approach: select one organic acquisition channel (SEO/content or community) and invest the majority of the budget there. Supplement with email marketing (low cost, high ROI). Use referral/word-of-mouth mechanics to amplify whatever organic reach is built. Set clear expectations: at under $2,500/month with no existing audience, an organic-only strategy will take 9-12 months to generate consistent pipeline. Flag this tradeoff explicitly and consider whether the user's business stage is appropriate for a formal marketing strategy at all -- sometimes the correct answer is "do 10 unscalable things to find product-market fit before formalizing a strategy."

### B2B With Sales Cycle Longer Than 6 Months (Enterprise, Complex or Regulated Industries)
Enterprise marketing is fundamentally different from SMB marketing. The buyer journey involves 6-10 stakeholders on average (per Gartner B2B research), multi-stage approvals, security reviews, legal, and procurement. Channel implications: (a) Content must address different roles -- technical evaluators need different material than economic buyers. (b) Events and in-person relationship-building have disproportionate impact on enterprise deals -- allocate 20-30% of budget here. (c) Account-Based Marketing (ABM) is more efficient than broad demand generation -- define a target account list (TAL) of 50-200 named accounts and run coordinated campaigns across email, LinkedIn, paid display, and direct mail toward those specific accounts. (d) Marketing KPIs shift from lead volume to pipeline influence -- track marketing-influenced pipeline as % of total pipeline (target: 40-60% in a mature ABM motion). Do not use lead volume as the primary success metric.

### Brand New Company With No Existing Traffic, Brand, or Customer Base
The absence of existing data is itself a data point -- it means all numbers in the strategy are assumptions based on benchmarks. The first 90 days should be treated as a measurement-building phase, not a revenue-driving phase. Prioritize: (a) Tracking infrastructure (GA4, UTM standards, CRM setup) before spending a dollar on acquisition. (b) Early customer development -- 20-30 conversations with target segment members before writing a word of content. (c) A single focused channel experiment (not 5 channels simultaneously) to establish a data baseline. Avoid brand awareness campaigns entirely at this stage -- they are impossible to measure and do not produce the learning needed to optimize. Revise the strategy at 90 days once real conversion data is available.

### User Only Wants Organic / No Paid Budget
This is a legitimate constraint, not a limitation to apologize for. Organic strategies compound over time and produce defensible moats that paid strategies cannot replicate. Structure the strategy around the three pillars of sustainable organic growth: (1) SEO and content -- long-form content targeting high-intent keywords, structured so each piece captures a specific buyer query at a specific journey stage; aim for 8-12 well-optimized pieces before expecting meaningful traffic. (2) Community -- identify the 2-3 online communities where the target segment is already active (industry Slack groups, LinkedIn communities, Reddit, forums, industry association networks) and build a genuine presence through participation before promoting the product. (3) Referral and word-of-mouth mechanics -- build referral loops into the product experience itself (in-app sharing prompts, milestone emails that encourage social sharing). Set explicit timeline expectations in the strategy document: meaningful traffic in month 4-6, consistent pipeline in month 9-12, compounding returns in year 2+.

### E-Commerce / Direct-to-Consumer Business
DTC marketing strategy differs structurally from B2B in three key ways: purchase cycles are compressed (hours to days, not weeks to months), emotional and identity-based positioning drives conversion more than feature/benefit messaging, and the retention economics are often more important than acquisition economics (repeat purchase rate and lifetime value are the numbers that determine whether the business is viable). Channel implications: (a) Paid social (Meta ads in particular) is typically the primary acquisition channel for DTC -- allocate 35-50% of total budget here. (b) Email and SMS flows are the highest-ROI retention channels -- abandon cart flow, post-purchase sequence, and reactivation flow are non-negotiable. (c) Influencer and UGC (user-generated content) strategies are often more cost-efficient than brand-produced creative for DTC. (d) The primary efficiency metric is ROAS (return on ad spend) per channel, not CAC -- most DTC operators target 3-5x ROAS on paid channels at scale. Track new customer ROAS and returning customer ROAS separately.

### Multiple Products Targeting Different Segments Simultaneously
When a company sells multiple products or the same product to fundamentally different segments (e.g., both SMB and enterprise, or B2B and B2C), a single unified strategy will produce positioning conflicts and channel inefficiency. Recommended structure: create one unified budget and objective table, but build separate STP analyses and separate channel tactics for each product/segment combination. Flag where budgets compete for shared resources (e.g., a single company blog that must serve two audiences) and provide a decision framework for prioritization. Generally recommend: optimize for the segment with the highest LTV first, use the same infrastructure (website, email platform) for both, but produce separate content and ad creative for each.

### International or Multi-Market Strategy
If the geographic scope extends beyond a single country, channel availability, cost structures, and audience behaviors differ significantly. Google Search dominates in the US, UK, and Australia, but Naver dominates in South Korea and Baidu in China. LinkedIn ad CPMs vary by country -- US and Western Europe are 3-5x more expensive than Southeast Asia or Latin America. Localization requirements add significant content cost -- machine translation is inadequate for professional B2B content; budget for native-speaker review at minimum. Recommended approach: prioritize a primary market for the first 6 months (typically the home market or the market with the clearest product-market fit signal), prove the channel model and unit economics, then apply the learned playbook to secondary markets with localization adjustments. Do not attempt simultaneous multi-market launches on limited budgets.

### Replatforming From One Marketing Tool Stack to Another (Mid-Strategy)
If the user's existing marketing infrastructure is being migrated (e.g., switching from HubSpot to Salesforce Marketing Cloud, or from Mailchimp to Klaviyo), the strategy must account for a 30-90 day disruption period during which historical data is not available, email lists may have reduced deliverability (domain warming required), and attribution will have gaps. Recommendations: (a) Begin any marketing tool migration at least 60 days before a planned campaign launch, never mid-campaign. (b) Export all historical data from the old platform before decommissioning -- segment lists, campaign performance data, UTM histories. (c) Run the old and new platform in parallel for at least 30 days to validate data parity before full cutover. (d) Adjust monthly performance targets downward by 20-30% during the migration window to account for disruption.

---

## Example

**Input:** "We need a marketing strategy for our B2B SaaS. We sell project management software built specifically for architecture firms. Currently have 500 paying users, all from word of mouth. Goal is 2,000 users in 12 months. Budget is $8,000/month. No dedicated marketing team yet -- I'm the founder doing everything. We've been around 2 years, good product retention, but zero formal marketing."

---

## Marketing Strategy: StructurePM

**Period:** January -- December 2025 (12-month annual plan)
**Budget:** $8,000/month | $96,000 annual
**Business Objective:** Grow from 500 to 2,000 paying users (+1,500 net new users) in 12 months
**Business Model:** B2B SaaS -- architecture industry vertical
**Pricing Assumption:** $120/user/month (seat-based), avg. firm size 8 users = ~$960/month ACV per firm
**Sales Cycle Estimate:** 14-30 days (SMB motion, trial-led)
**Geographic Focus:** United States
**Prepared:** January 2025

---

### Assumptions and Constraints

> 1. No historical marketing data exists -- all benchmarks drawn from B2B SaaS industry norms and vertical SaaS comparable products
> 2. Founder is sole marketing executor for Months 1-3; freelance support assumed from Month 4
> 3. Assumes existing product conversion rate from trial to paid is approximately 20-25% (consistent with well-onboarded vertical SaaS)
> 4. Sales cycle is self-serve with optional founder-led demo -- no dedicated sales team
> 5. StructurePM website currently has minimal SEO optimization and no blog content; organic traffic is below 300 sessions/month

---

### 1. Market Segmentation (STP Analysis)

**Segmentation Criteria Used:** Firmographic (firm size by headcount, project volume); Behavioral (current tool being replaced -- spreadsheets vs. generic PM tools; buying trigger -- firm growth, project complexity, client compliance requirement)

| Segment Name | Description | Economic Buyer | End User | Est. Addressable Size | Priority | Rationale |
|-------------|-------------|---------------|---------|----------------------|----------|-----------|
| Growing small architecture firms (5-25 staff) | Managing 15-40 concurrent projects; currently using Excel, Basecamp, or Asana; feeling the pain of scaling without architecture-specific workflows | Principal or Managing Partner | Project Architects and Project Managers | ~22,000 firms in the US (AIA 2023 census data) | #1 | Largest addressable segment; highest acute pain around scaling; self-serve buying motion fits solo sales capacity; word-of-mouth referrals confirm this is already the core user |
| Mid-size firms (25-100 staff) | Multi-office, complex project portfolios; beginning to need formal audit trails for AIA contract compliance and owner reporting | Operations Director or COO | Project Managers, BIM coordinators | ~7,500 firms in the US | #2 | Higher ACV per firm; longer evaluation cycle but higher retention; accessible via professional association channels (AIA chapters, SMPS) |
| Solo practitioners and 1-4 person studios | Managing 3-8 projects simultaneously; price-sensitive; often uses free tools | Owner/Architect | Owner/Architect (same person) | ~45,000 registered architects in small practices | Deferred | Low ACV relative to support cost; high churn risk; dilutes product positioning; revisit in Year 2 with a lower-tier pricing plan |

**Positioning Statements:**

*Primary Segment -- Growing Small Architecture Firms:*
> "For architecture firm principals managing a growing project load who are frustrated that generic project management tools like Asana and Basecamp don't understand how architecture projects actually work -- phases, drawing sets, RFIs, submittals, and owner meetings -- StructurePM is the project management platform built for architects that lets your team manage every project phase without customizing templates yourself. Unlike Asana or Monday.com, StructurePM comes pre-configured for the AIA project delivery workflow so your team is productive on Day 1."

*Secondary Segment -- Mid-Size Firms:*
> "For operations directors at architecture firms with 25-100 staff who need real-time project health visibility across multiple principals and project managers, StructurePM is the firm-wide project intelligence platform that gives leadership the dashboards and reporting they need without requiring principals to change how they manage their own projects. Unlike Deltek or BST Global, StructurePM deploys in days, not months, and requires no implementation consultant."

---

### 2. Marketing Objectives

**Linking Logic:** 1,500 net new users in 12 months at an average of 8 users per firm = ~188 net new firms. At 25% trial-to-paid conversion, we need 750 trials over 12 months = ~63 trials/month. At 3% website-to-trial conversion, we need ~2,100 targeted visitors/month by Month 12 (building from ~300 today).

| # | Objective | Funnel Stage | Metric | Tracking Source | Current Baseline | 12-Month Target | Month 6 Milestone |
|---|----------|-------------|--------|----------------|-----------------|-----------------|-------------------|
| 1 | Build organic search visibility among architects evaluating PM tools | Awareness | Monthly organic sessions from architecture + PM keywords | GA4 + Ahrefs | ~300/month | 3,500/month | 1,200/month |
| 2 | Generate qualified trial signups from target segments | Acquisition | Free trial signups per month | GA4 goals +
