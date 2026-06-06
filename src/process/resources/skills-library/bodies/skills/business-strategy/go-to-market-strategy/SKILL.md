---
name: go-to-market-strategy
description: |
  Produces a completed go-to-market strategy document using STP (Segmentation,
  Targeting, Positioning) and AIDA frameworks covering target segment, channels,
  messaging, pricing, and launch sequence. Use when the user asks to create a
  GTM strategy, plan a product launch, define market entry approach, or structure
  a launch plan for a new product or feature.
  Do NOT use for ongoing marketing strategy (use marketing-strategy), brand
  positioning only (use brand-positioning), or competitive landscape analysis
  (use competitive-analysis).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "strategy marketing planning entrepreneurship"
  category: "business-strategy"
  subcategory: "strategy-planning"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Go-to-Market Strategy

## When to Use

Use this skill when the user's request maps to one of these specific launch scenarios:

- The user is launching a net-new product or service and needs a structured document covering segmentation, channels, messaging, pricing, and a sequenced launch plan
- The user is entering a new geographic market with an existing product and needs to adapt positioning, channel mix, and pricing for the new context
- The user is targeting a new customer segment with an existing product and needs a segment-specific motion, not just a marketing refresh
- The user is launching a significant new product feature and needs both an adoption motion for existing customers and a competitive acquisition motion for new prospects
- The user is at pre-product stage and needs a demand validation GTM -- a waitlist, beta, or early access program designed to confirm product-market fit before full launch
- The user explicitly asks to "create a GTM strategy," "plan a product launch," "define our go-to-market," "structure our launch plan," or "figure out how to get first customers"
- The user has a launch date, budget, or timeline constraint and needs a time-bounded plan rather than an evergreen marketing program

**Do NOT use this skill when:**
- The user needs ongoing campaign optimization or monthly marketing planning -- use `marketing-strategy` instead
- The user wants only a brand positioning statement or brand identity work -- use `brand-positioning` instead
- The user needs a full competitive landscape with market share analysis -- use `competitive-analysis` instead
- The user is asking for a full business plan including financials, operations, and hiring -- use `business-plan` instead
- The user needs sales process design, CRM setup, or quota modeling -- use `sales-process` instead
- The user is asking about ongoing customer retention, upsell, or expansion revenue strategy -- use `customer-success-strategy` instead
- The product is not yet defined well enough to have a target customer or core value proposition -- use `product-definition` or `value-proposition` first, then return to this skill

---

## Process

### Step 1: Collect All Required Context Before Producing Anything

Never generate a GTM strategy from partial inputs. A strategy built on assumptions wastes the user's time. Ask for all of the following in a single structured request if they are not already provided:

- **Product description:** Name, one-sentence description of what it does, and the core mechanism of value (what it replaces, automates, or enables)
- **Launch type:** Net-new product, new geographic market, new customer segment, feature expansion, or pre-product demand validation
- **Target customer hypothesis:** Who the user believes will buy -- even a rough sketch is useful for segmentation
- **Current state:** Existing customer base size, current brand awareness (none / niche / broad), sales team size and structure, existing channel assets (email list, social following, partnerships)
- **Budget:** Total GTM budget or monthly spend cap; if zero, note this explicitly -- zero-budget GTM follows a different channel logic entirely
- **Timeline:** Hard launch date, target quarter, or milestone-based timing (e.g., "before a major industry conference")
- **Pricing hypothesis:** What the user believes the price should be, or constraints they are working within (e.g., "must be under $99/mo to compete")
- **Success definition:** What a "successful launch" looks like to the user -- revenue, signups, trials, enterprise pipeline, press coverage, or some combination
- **Competitive context:** 2-3 named alternatives customers currently use, even imperfect substitutes -- this shapes positioning directly

If any of these inputs is missing, ask before proceeding. A well-framed clarifying question takes 30 seconds; a strategy built on a wrong assumption requires a full rebuild.

---

### Step 2: Size and Segment the Market Using STP

The goal of segmentation is to divide the addressable market into groups that differ meaningfully in their needs, willingness to pay, buying behavior, and reachability -- not just in demographics.

- **Define Total Addressable Market (TAM):** Use a top-down estimate (e.g., industry analyst data) plus a bottom-up estimate (e.g., number of companies with specific firmographic criteria × average contract value). Report both; they rarely agree and the gap is informative.
- **Define Serviceable Addressable Market (SAM):** Constrain TAM by geography, language, regulatory fit, go-to-market reach, and technical requirements. This is the realistic universe the product can serve at launch.
- **Define Serviceable Obtainable Market (SOM):** Apply a realistic capture rate given budget, team size, competitive intensity, and timeline. SOM is what the launch plan is actually sized against.
- **Segment by needs and buying behavior, not just demographics:** The most actionable segmentation criteria for GTM are: (a) the specific problem or job-to-be-done, (b) current solution they use and pain with it, (c) buying process (self-serve vs. sales-assisted vs. committee), (d) willingness to pay and budget authority, and (e) time-to-value expectation.
- **Evaluate each segment on five GTM criteria:** Segment size (is it large enough to matter?), willingness to pay (can they afford and justify the price?), accessibility (can you reach them efficiently?), competitive intensity (how entrenched are incumbents?), and strategic fit (does winning here create a platform for the next move?).
- **Identify 1-2 primary segments and 1-2 secondary/future segments:** Primary segments receive budget and attention. Secondary segments are documented but not resourced at launch. This is not rejection -- it is sequencing. The beachhead segment creates the case studies, reviews, and word-of-mouth that unlock the secondary segment later.
- **Document the "not yet" segments explicitly:** Record why each deprioritized segment is being deferred. This prevents internal scope creep during the launch and provides a clear expansion roadmap.

---

### Step 3: Define Positioning for Each Target Segment

Positioning is not the tagline -- it is the internal strategic logic that drives every external message. Each target segment may require a distinct positioning because their alternative solutions and decision criteria differ.

- **Use the STP positioning formula as a starting point:** "For [target customer] who [specific need or problem], [product name] is the [product category] that [primary differentiator], unlike [named alternative] which [key weakness]." This formula forces specificity about the competitive frame of reference.
- **Identify the competitive frame of reference:** What are customers comparing you to? The frame of reference may be a direct competitor, an indirect substitute (e.g., a spreadsheet), or the status quo (doing nothing). Different segments may have different frames of reference, which means different positioning statements.
- **Define points of difference (POD) and points of parity (POP):** PODs are the 1-3 attributes where your product is demonstrably superior to the competitive frame. POPs are table-stakes attributes -- features you must have to be in consideration but that do not differentiate you. Messaging should lead with PODs and not waste space on POPs.
- **Validate positioning against the "so what" test:** For every claimed benefit, ask "so what does that mean for the customer?" at least twice. "AI-powered" is not a benefit. "Cuts 3 hours of weekly research to 15 minutes" passes the test.
- **Test positioning against the insight-need-offer arc:** The positioning should surface from a customer insight (something true about their world), connect to an unmet or underserved need, and show how the product addresses that need better than alternatives.
- **Avoid repositioning the category unless you have the budget to educate:** Category creation (e.g., "the first platform for X") requires significant educational marketing spend. For most launches, fitting an existing category and then differentiating within it is faster and cheaper.

---

### Step 4: Build the Message Architecture Using AIDA

AIDA (Attention, Interest, Desire, Action) is the framework for moving a target customer from unawareness to purchase decision. Build a message hierarchy for each primary segment, not a single set of universal messages.

- **Attention:** The hook must interrupt the customer in their specific context. A LinkedIn headline, a Google ad, a forum post, and a cold email have different attention economies and different hooks. The attention message is not about the product -- it is about the customer's problem, identity, or aspiration. Use specificity: "You're losing 6 hours a week to manual data entry" outperforms "Work smarter, not harder."
- **Interest:** Once attention is captured, sustain it with problem resonance. Use the language the customer uses to describe their problem (gather this from customer interviews, Reddit threads, G2 reviews, and support tickets). Quantify the problem if possible -- "teams waste an average of $12K/year" creates urgency; "inefficiency costs money" does not.
- **Desire:** Convert interest into desire by making the benefit concrete, credible, and personal. Use a combination of (a) feature-benefit statements with specific outcomes, (b) social proof (customer quotes, case study metrics, user counts), and (c) proof points that reduce risk (free trial, money-back guarantee, trusted integrations). Desire is built on evidence, not claims.
- **Action:** The CTA must match the stage in the buying journey and the commitment level appropriate for that stage. Cold-audience CTAs should ask for low-commitment actions (download, free trial, demo request) not high-commitment ones (buy now, sign annual contract). Warm-audience CTAs can push harder. Every CTA must specify the destination, the next step, and what the customer gets in return.
- **Create 2-3 message variants per segment:** Vary the angle -- one variant leads with time savings, another leads with cost reduction, a third leads with social risk (e.g., "clients are noticing the quality gap"). These variants are used for A/B testing across channels.
- **Build the message hierarchy as a pyramid:** Single headline (one phrase capturing the core value) > three benefit pillars (each supporting the headline) > supporting evidence per pillar (stats, quotes, demos). All downstream creative pulls from this hierarchy so there is a single source of truth.

---

### Step 5: Design the Channel Strategy and Budget Allocation

Channel strategy answers two questions: where do target customers spend attention in each phase of their buying journey, and what is the most efficient way to reach them there within budget?

- **Map channels to the three stages of the buying journey:** Awareness (customer does not know the product exists), Consideration (customer is evaluating solutions), and Conversion (customer is ready to decide). Many GTM strategies over-invest in awareness and under-invest in conversion infrastructure.
- **Distinguish channel from tactic:** A "channel" is a category (e.g., search, email, community). A "tactic" is the specific execution within that channel (e.g., Google Search ads targeting "best AI writing tool for freelancers", a sponsored newsletter in a curated writing community, a cold email sequence to a list of 500 target accounts). Budget is allocated to tactics, not channels.
- **Apply the 70/20/10 budget rule:** 70% of budget to proven tactics with predictable returns (e.g., channels where you have benchmark data or industry norms), 20% to experimental tactics with higher upside, and 10% to one speculative tactic you cannot predict but want to learn from. This prevents both overly safe launches and reckless spending.
- **Specify CAC assumptions for each tactic:** Customer acquisition cost benchmarks by channel vary widely. For reference: paid search CPCs in competitive SaaS categories range from $15-$80; LinkedIn CPMs run $30-$60; influencer conversion rates typically run 0.5%-3% of total views; cold outbound email conversion rates run 1%-5% on qualified lists. Use industry benchmarks as floor estimates and adjust based on the user's historical data if available.
- **Calculate minimum viable channel budget:** For each paid tactic, determine the minimum spend needed to generate statistically meaningful data (typically 1,000-3,000 impressions for display, 500 clicks for search, 100 leads for email). If the budget is too small to run a tactic at a meaningful scale, cut it entirely and reallocate -- a channel underfunded below minimum viable scale generates noise, not signal.
- **For B2B with deal sizes above $5K ACV:** Prioritize account-based marketing (ABM) tactics -- targeted outbound to named accounts, LinkedIn ABM campaigns with audience match, event sponsorships, and sales development rep (SDR) outreach. Mass-market digital tactics are inefficient at this deal size; the math does not work.
- **For B2C or product-led growth (PLG) motions:** Prioritize top-of-funnel volume (content SEO, paid social, community) and conversion optimization (onboarding flow, activation email sequences, in-product prompts). The unit economics depend on low CAC and high activation rates, not on sales team efficiency.
- **Always designate a budget buffer (10-15%):** Reserve this for reallocation based on post-launch performance data. Committing 100% of budget pre-launch locks in assumptions that will be wrong. The buffer is the most important line item in the channel budget.

---

### Step 6: Design Pricing and Packaging for Launch

Pricing at launch has two distinct jobs: signal value to the market and create urgency to buy now. These sometimes pull in opposite directions and must be balanced deliberately.

- **Select a pricing model based on the product type and customer buying behavior:** Subscription (recurring SaaS) works when value compounds over time; usage-based works when value is directly proportional to usage volume; one-time purchase works for tools with stable, defined utility; freemium works when a viral/network loop or high product-led growth coefficient exists.
- **Anchor price to value, not cost:** Price anchoring to competitive alternatives (e.g., "a freelance editor charges $75/hour; this pays for itself in one hour of time saved") is more persuasive than cost-plus or market-average pricing. Identify the value anchor for each primary segment and make it explicit in pricing page copy.
- **Use tiered packaging to capture price variation across segments:** Three tiers is the dominant SaaS structure because it creates an anchor effect -- customers anchor to the middle tier, the high tier makes the middle look reasonable, and the low tier captures price-sensitive buyers. Name tiers by outcome (e.g., "Professional," "Team," "Scale") not by feature count.
- **Separate launch pricing from long-term pricing explicitly:** Launch pricing (early bird, founding member, beta rate) creates urgency and rewards early adopters. It should have a specific cap (first N customers or specific expiry date), a clear discount level (20%-50% off long-term pricing), and explicit communication that it is time-limited. Never offer launch pricing indefinitely -- it trains customers to wait for sales.
- **Test price sensitivity with Van Westendorp Price Sensitivity Meter (PSM):** If the user has access to a prospect list, even a quick 4-question survey asking at what price the product is "too cheap to trust," "a bargain," "starting to get expensive," and "too expensive" will reveal the acceptable price range and optimal price point. This takes less than one week and prevents pricing mistakes that are hard to reverse.
- **For enterprise sales (ACV > $15K):** Publish a "starting from" price rather than a full pricing page to preserve negotiation flexibility. Use pricing to qualify leads (buyers who engage with pricing pages are 3x more likely to convert) and to signal the tier of buyer you are targeting.

---

### Step 7: Build the Launch Sequence as a Phased Timeline

A launch is not a single event -- it is a 6-to-12-week sequence of coordinated activities. The sequence has three phases with distinct goals.

- **Pre-launch phase (T-8 to T-2 weeks for full launches; T-4 to T-2 weeks for feature launches):** The goal is to build anticipation, populate a warm audience, and stress-test all launch infrastructure. Key activities include: building and activating a waitlist, recruiting beta users from the target segment (aim for 20-50 for B2C, 5-15 for B2B), seeding influencers and press contacts, creating all launch-week content in advance (blog posts, social copy, email sequences, video), configuring tracking and analytics to ensure every conversion path is instrumented, and rehearsing any live demos or launch events.
- **Launch week (T-0 to T+7 days):** The goal is maximum coordinated signal in the market. Coordinate all owned, earned, and paid activities to land in the same 72-hour window. This creates compound reach -- when a prospect sees a press mention, a community post, and a friend's social share in the same week, the credibility effect multiplies. Key activities: email to waitlist on day 0, press and influencer coverage on days 0-2, paid campaigns activate on day 1 (after organic signal is live), community engagement on days 1-3, and a daily metrics review to catch technical issues immediately.
- **Post-launch optimization phase (T+1 to T+8 weeks):** The goal is to learn, optimize, and build compounding assets. Key activities include: weekly channel performance reviews against benchmarks (cut channels below 50% of target CAC within two weeks), publishing customer case studies as soon as the first compelling user outcomes appear (typically 2-3 weeks post-launch for B2C, 4-8 weeks for B2B), building and activating a referral program once the retention signal is positive (referral programs launched before product-market fit send bad-fit customers who churn), and building sales enablement materials (battle cards, ROI calculators, objection handling guides) if a sales motion exists.
- **Assign specific owners and hard deadlines to every activity:** Every item in the launch sequence must have a named owner (not "team" or "marketing") and a specific date. Activities without owners do not happen. Use a simple RACI model if the team is larger than four people.
- **Build a go/no-go gate for the launch date:** Define in advance the criteria under which the launch date would be delayed. Common gates: payment processing must be tested and live, onboarding flow must achieve >60% completion in beta testing, tracking must be verified on all conversion pages, and at least 3 customer testimonials must be collected. Launching with a broken checkout or broken onboarding is more damaging than a brief delay.

---

### Step 8: Define Success Metrics with Specific Numeric Targets

Metrics without targets are observations. Targets without tracking methods are wishes.

- **Structure metrics across three categories:** Leading indicators (early signals of launch health, measurable in days: landing page CVR, email open rate, trial signups), lagging indicators (business outcomes, measurable in weeks to months: trial-to-paid conversion rate, MRR, CAC), and health metrics (signals that the product is working, not just the marketing: activation rate, day-7 retention, NPS).
- **Set 30-day and 90-day targets for each metric:** 30-day targets measure launch execution quality. 90-day targets measure whether the GTM strategy is working. The gap between them reveals whether initial momentum is compounding or decaying.
- **Establish benchmark conversion rates for funnel health:** Typical B2C SaaS benchmarks for reference -- landing page CVR: 2-5% for cold traffic, 8-15% for warm traffic; free trial to paid conversion: 15-25%; email activation rate (new signups who complete core action): 40-60%; day-30 retention: 30-40%. B2B benchmarks differ significantly: MQL-to-SQL: 10-25%; SQL-to-close: 20-35%; free trial to paid: 8-15%.
- **Define the leading indicator for product-market fit:** For consumer products, this is typically day-7 retention above 30% or NPS above 40. For B2B SaaS, it is renewal rate above 85% in the first cohort. Build this metric into the post-launch dashboard from day one.
- **Specify the tracking method for every metric:** Naming a metric without naming the tool and event that captures it guarantees measurement gaps. Pair each metric with its source: product analytics (Mixpanel, Amplitude, or equivalent), payment system, CRM, or marketing platform. If a metric cannot be tracked at launch, either build the tracking before launch or remove the metric.

---

## Output Format

```
## Go-to-Market Strategy: [Product/Feature Name]

**Launch Type:** [Net-new product / Geographic expansion / New segment / Feature expansion / Demand validation]
**Target Launch Date:** [Date or T+X weeks from today]
**GTM Budget:** [$X total / $X per month]
**Primary Target Segment:** [One-sentence description]

---

### Market Sizing

| Market Level | Definition | Size Estimate | Method |
|--------------|-----------|---------------|--------|
| TAM | [Full global/national addressable market] | [$X or X customers] | [Top-down analyst estimate] |
| SAM | [Reachable market given geography, language, product fit] | [$X or X customers] | [Bottom-up: N accounts × ACV] |
| SOM | [Realistic capture in 12 months] | [$X or X customers] | [Budget / target CAC × timeline] |

---

### Market Segmentation (STP)

| Segment | Description | Size (SAM) | WTP | Accessibility | Competitive Intensity | Priority | Rationale |
|---------|------------|-----------|-----|--------------|----------------------|----------|-----------|
| [Segment 1] | [Who they are, job-to-be-done, current solution] | [X] | [High/Med/Low] | [High/Med/Low] | [High/Med/Low] | Primary | [Why first] |
| [Segment 2] | [Who they are, job-to-be-done, current solution] | [X] | [High/Med/Low] | [High/Med/Low] | [High/Med/Low] | Secondary | [Why second] |
| [Segment 3] | [Who they are, job-to-be-done, current solution] | [X] | [High/Med/Low] | [High/Med/Low] | [High/Med/Low] | Deferred | [When to revisit] |

---

### Positioning

**Competitive Frame of Reference:** [What customers compare this to -- named alternative or status quo]

**Positioning Statement (Primary Segment):**
For [target customer] who [specific need or pain], [product name] is the [product category] that [primary differentiator with outcome], unlike [named alternative] which [key weakness].

**Points of Difference (POD):**
1. [Differentiator 1] -- [specific customer outcome]
2. [Differentiator 2] -- [specific customer outcome]
3. [Differentiator 3] -- [specific customer outcome]

**Points of Parity (POP -- table stakes, do not lead with these):**
- [Feature/attribute that must exist to be in consideration]
- [Feature/attribute that must exist to be in consideration]

---

### Message Architecture (AIDA)

**Primary Segment: [Segment Name]**

**Message Pyramid:**
- **Headline (core value):** [Single phrase capturing the central value proposition]
- **Pillar 1:** [Benefit theme] -- [Supporting evidence / stat / proof point]
- **Pillar 2:** [Benefit theme] -- [Supporting evidence / stat / proof point]
- **Pillar 3:** [Benefit theme] -- [Supporting evidence / stat / proof point]

| AIDA Stage | Message | Channel Context | Variant A | Variant B |
|------------|---------|----------------|-----------|-----------|
| Attention | [Specific hook targeting a pain, identity, or aspiration] | [Where this appears: channel + format] | [Angle: time/cost] | [Angle: risk/quality] |
| Interest | [Problem statement with quantification] | [Long-form context: blog, email, landing page] | [Data-led] | [Story-led] |
| Desire | [Benefit statements + proof points] | [Landing page, demo, proposal] | [ROI-focused] | [Peer comparison] |
| Action | [CTA with low-commitment ask] | [End of funnel: trial, demo, download] | [Free trial CTA] | [Demo request CTA] |

**Secondary Segment: [Segment Name]**
[Repeat AIDA table for each active target segment]

---

### Channel Strategy

**Budget Allocation Framework (70/20/10):**
- Proven (70%): $[X] -- [channels with known benchmarks for this segment]
- Experimental (20%): $[X] -- [new channels with upside potential]
- Speculative (10%): $[X] -- [one high-risk / high-reward tactic]
- Buffer (15% of total): $[X] -- [reallocate by T+2 weeks based on performance]

| Channel | Stage | Tactic (specific) | Budget | Reach | CAC Target | Conv. Rate | Metric to Watch |
|---------|-------|------------------|--------|-------|-----------|------------|-----------------|
| [Channel 1] | Awareness | [Specific tactic, targeting, format] | [$X] | [Impressions/reach] | [$X] | [X%] | [CPM / CPC] |
| [Channel 2] | Awareness | [Specific tactic] | [$X] | [Visitors/mo] | [$X] | [X%] | [Organic rank] |
| [Channel 3] | Consideration | [Specific tactic] | [$X] | [Views/opens] | [$X] | [X%] | [CTR] |
| [Channel 4] | Conversion | [Specific tactic] | [$X] | [Visitors] | [$X] | [X%] | [Trial CVR] |
| [Channel 5] | Conversion | [Specific tactic] | [$X] | [Leads] | [$X] | [X%] | [Close rate] |
| Buffer | -- | Reallocate at T+2 weeks | [$X] | -- | -- | -- | -- |
| **TOTAL** | | | **[$X]** | | | | |

---

### Pricing and Packaging

**Pricing Model:** [Subscription / Usage-based / One-time / Freemium + paid / Hybrid]
**Price Anchor:** [The value comparison that justifies the price for the primary segment]
**Competitive Price Positioning:** [Premium / At parity / Value undercutting -- with rationale]

| Tier | Price | Billing | Key Features | Segment | Notes |
|------|-------|---------|-------------|---------|-------|
| [Tier 1 name] | [$X/mo] | [Monthly/Annual] | [Core features, limits] | [Segment] | [Entry-level use case] |
| [Tier 2 name] | [$X/mo] | [Monthly/Annual] | [All Tier 1 + additional] | [Segment] | [Primary target tier] |
| [Tier 3 name] | [$X/mo] | [Monthly/Annual] | [All features + support] | [Segment] | [Power user / enterprise] |
| **Launch Offer** | [$X/mo] | [Terms] | [Scope of offer] | [Early adopters] | Expires: [Date] or [First N customers] |

---

### Launch Sequence

**Go/No-Go Gate Criteria (must be met before T-0):**
- [ ] [Criterion 1 -- e.g., payment processing tested and live]
- [ ] [Criterion 2 -- e.g., onboarding flow >60% completion in beta]
- [ ] [Criterion 3 -- e.g., tracking verified on all conversion pages]
- [ ] [Criterion 4 -- e.g., 3+ customer testimonials collected]

**Pre-Launch: [Start date] to [T-2 weeks]**
| Activity | Owner | Deadline | Deliverable | Status |
|----------|-------|----------|-------------|--------|
| [Activity 1] | [Named role] | [Date] | [Specific output] | Not started |
| [Activity 2] | [Named role] | [Date] | [Specific output] | Not started |

**Launch Week: [T-0] to [T+7 days]**
| Activity | Owner | Deadline | Deliverable | Status |
|----------|-------|----------|-------------|--------|
| [Activity 1] | [Named role] | [Date/time] | [Specific output] | Not started |
| [Activity 2] | [Named role] | [Date/time] | [Specific output] | Not started |

**Post-Launch Optimization: [T+1 week] to [T+8 weeks]**
| Activity | Owner | Deadline | Deliverable | Status |
|----------|-------|----------|-------------|--------|
| [Activity 1] | [Named role] | [Date] | [Specific output] | Not started |
| [Activity 2] | [Named role] | [Date] | [Specific output] | Not started |

---

### Success Metrics Dashboard

| Metric | Category | 30-Day Target | 90-Day Target | Benchmark | Tracking Tool + Event |
|--------|----------|--------------|--------------|-----------|----------------------|
| [Metric 1] | Leading | [Value] | [Value] | [Industry norm] | [Tool: event name] |
| [Metric 2] | Leading | [Value] | [Value] | [Industry norm] | [Tool: event name] |
| [Metric 3] | Lagging | [Value] | [Value] | [Industry norm] | [Tool: event name] |
| [Metric 4] | Lagging | [Value] | [Value] | [Industry norm] | [Tool: event name] |
| [Metric 5] | Health | [Value] | [Value] | [Industry norm] | [Tool: event name] |

**PMF Signal Metric:** [The single metric that indicates product-market fit -- e.g., day-7 retention >30%, NPS >40, renewal rate >85%]
**Early Warning Metric:** [The leading indicator that will trigger a strategy review -- e.g., landing page CVR <1% by T+7 days]
```

---

## Rules

1. **Never generate a strategy without the nine required context inputs.** Product description, launch type, target customer hypothesis, current state, budget, timeline, pricing hypothesis, success definition, and competitive context must all be collected before writing a single section. Assumptions must be flagged explicitly in the output.

2. **Apply STP in strict order: segment first, then target, then position.** Positioning written before segmentation is tagline writing, not strategy. The positioning statement for each segment must reference the specific competitive frame of reference for that segment -- not a generic claim.

3. **Size the market at all three levels (TAM/SAM/SOM).** TAM-only sizing is a vanity number. SOM is what the launch plan is actually sized against and must be derived from the budget, target CAC, and timeline -- not from applying an arbitrary percentage to TAM.

4. **Every channel entry requires a specific tactic, not a channel category.** "LinkedIn" is not a tactic. "LinkedIn Sponsored Content targeting job titles 'Director of Operations' and 'VP Finance' at companies with 50-500 employees, driving to a 5-minute ROI calculator landing page" is a tactic. The difference determines whether execution is possible.

5. **Every tactic must have a CAC target.** If the blended budget divided by the target number of customers yields a CAC higher than the product's LTV (typically LTV:CAC ratio should be 3:1 or higher for healthy SaaS unit economics), the channel math does not work and the strategy must be revised -- not politely glossed over.

6. **Launch pricing must have explicit expiry terms.** Founding member pricing, early bird pricing, and beta pricing must specify either a hard expiry date or a customer count cap. Launch pricing without expiry is permanent discounting and trains the market to expect it.

7. **The launch sequence must have a named owner for every activity -- not "team" or "marketing."** Shared ownership is no ownership. If the user has not provided role names, use functional role labels (e.g., "Head of Marketing," "Product Manager") but flag that named owners must be assigned before the sequence is activated.

8. **Go/no-go gate criteria must be defined before the launch date is confirmed.** Common launch failures result from shipping with broken checkout flows, un-instrumented funnels, or zero customer proof. Define and document the gates explicitly.

9. **Post-launch optimization must include a week-2 channel performance review with explicit cut criteria.** Any channel delivering a CAC more than 2× the target at T+14 days should have its budget cut and reallocated to the buffer. This rule prevents the common mistake of riding underperforming channels because of sunk cost.

10. **Success metrics must distinguish between leading indicators, lagging indicators, and health metrics.** Reporting only lagging metrics (MRR, total customers) during the first 30 days is like navigating by looking in the rearview mirror. Leading indicators (landing page CVR, trial activation rate within 24 hours) tell you what the lagging metrics will look like in 60 days.

11. **Deprioritized segments must be documented with a specific re-engagement trigger.** "We will target enterprise customers later" is not a plan. "We will build an enterprise motion when MRR from SMB segment reaches $25K/month and we have 3 published case studies" is a plan.

12. **If budget is below $5K total, do not recommend paid channels without explicit caveat.** Paid channels below minimum viable scale generate noise, not signal, and waste money that could be better deployed in community and content. Flag this constraint and restructure around organic, product-led, and partnership channels.

---

## Edge Cases

### Pre-Product: Demand Validation GTM (Waitlist or Beta)

When the product is not yet built or is in early beta, the GTM objective shifts from conversion to validated demand. The channel strategy optimizes for email captures and beta applications, not for paid conversions.

- Replace the standard funnel metrics with: waitlist size, waitlist-to-beta-application rate, beta activation rate (% of beta users who complete the core action at least once), and qualitative signal count (the number of unprompted enthusiastic responses -- often called "superhero user" or "wow moment" signals).
- The pricing section is replaced with a pricing experiment: run a fake door test by showing a pricing page and recording what percentage of visitors click "Buy Now" even if the purchase flow redirects to a waitlist. This validates willingness to pay before building billing infrastructure.
- Post-launch optimization in this context means talking to beta users weekly (not analyzing dashboards) and iterating on the product until day-7 retention exceeds 30% for consumer or 60% for B2B before accelerating channel spend.
- The go/no-go gate for a demand-validation launch is simpler: a functioning landing page with clear value proposition, a working email capture, and a beta application or qualification form.

### Enterprise B2B: Long Sales Cycle (ACV > $15K, 3-12 Month Sales Cycle)

Mass-market digital channel tactics are inefficient for enterprise GTM. The channel math does not work: if a customer is worth $30K ACV and takes 6 months to close, a $15 LinkedIn click-to-content-download is not a meaningful unit of acquisition.

- Replace impression-based awareness tactics with account-based marketing (ABM): define a target account list (TAL) of 100-500 named accounts with specific firmographic and technographic fit criteria, then build campaigns that reach multiple stakeholders within each account (typically 5-10 decision influencers for enterprise purchases).
- The launch sequence extends to 6-12 months. Pre-launch includes 6-8 weeks of SDR list building and sequencing. Launch week is the beginning of outbound activation, not the peak. Post-launch spans the full sales cycle.
- Success metrics shift accordingly: replace "trial signups" with "qualified meetings booked," "opportunities created," and "pipeline value generated." 30-day targets cover pipeline top-of-funnel; 90-day targets cover SQL-to-close progress on early pipeline.
- Pricing must include a "starting from" anchor on the website (if displayed at all) and a formal procurement package including security questionnaire pre-fill, SOC 2 documentation, and reference customer list for the target industry vertical.

### Geographic Expansion: Same Product, New Market

The core segmentation logic changes for geographic expansion -- the product does not change, but the customer context, competitive landscape, regulatory environment, payment infrastructure, and channel mix may all differ substantially.

- Add a localization audit to the pre-launch phase: (a) language -- is full translation required or is English-language go-to-market acceptable in this market? (b) regulatory -- are there data residency, GDPR, or sector-specific compliance requirements? (c) payment -- does the target market predominantly use payment methods not currently supported (e.g., SEPA in Europe, Boleto in Brazil, UPI in India)? (d) cultural -- do brand tone, visual identity, and messaging metaphors translate without unintended meaning?
- Research market-specific competitive dynamics before applying the existing positioning. The primary competitor in the new market may be a local incumbent you have not analyzed, not the global competitors already in your battle cards.
- Apply a "local proof" requirement: launch in a new geographic market without local customer references, local case studies, or local pricing (in local currency) and conversion rates will be 30-60% below equivalent campaigns in the home market. Build 3-5 local beta customers before the public launch.
- Channel mix in new geographies may differ significantly from home market benchmarks. Research local social platform dominance (LinkedIn penetration, WhatsApp business use, regional equivalents), local search engine market share, and local influencer or media ecosystems before committing budget.

### Feature Launch: Expansion Within an Existing Product

A feature launch has two distinct audiences with two distinct GTM motions: existing customers (adoption) and prospects (competitive acquisition).

- For the existing customer motion: the primary channel is in-product (tooltips, onboarding modals, feature announcement banners) plus direct email to the existing user base. Segment the existing customer list by usage pattern and send targeted messaging to the subset most likely to benefit from the feature. Track: feature adoption rate (% of active users who try the feature within 30 days), feature retention (% who use it again within 14 days of first use), and NPS delta for feature users vs. non-users.
- For the competitive acquisition motion: the feature becomes a competitive wedge. Identify the specific competitor whose primary weakness the new feature addresses and build a "vs. [Competitor]" comparison page optimized for search terms like "[Competitor] alternative." This is often the highest-ROI piece of content a feature launch can produce.
- Do not cannibalize the existing customer relationship with overly aggressive upsell messaging around a feature launch. If the feature is behind a paywall, give existing customers a grace period (14-30 days) to experience the feature before requiring an upgrade.

### Zero-Budget Launch: No Paid Channel Access

When total GTM budget is effectively zero (under $2K), exclude all paid channel tactics and reframe the entire channel strategy around compounding assets.

- Prioritize in this order: (1) direct community participation -- be visibly and genuinely helpful in the 3-5 communities where the target segment gathers, without spamming or self-promoting excessively; (2) content SEO -- invest time (not money) in 8-12 high-quality articles targeting long-tail search terms with genuine informational value; (3) product-led growth -- ensure the product has a built-in sharing or referral mechanism (e.g., "powered by" attribution, share-to-export, collaborative features); (4) warm network outreach -- systematically contact the founder's or team's professional network for introductions to target customers; (5) strategic partnerships -- identify 2-3 non-competing tools that serve the same audience and negotiate content swaps, co-marketing, or integration listings.
- Be explicit with the user about the time cost trade-off: a zero-budget launch trading paid reach for time investment typically takes 2-3× longer to reach the same MRR milestone. A $10K launch that reaches $5K MRR in 60 days might take 150-180 days organically.
- Track organic growth metrics separately from paid equivalents so the user can make informed decisions about when to introduce budget.

### Product-Led Growth (PLG) First Motion

When the product is designed so that product usage itself drives acquisition (viral loops, collaboration invites, "powered by" attribution, or share-to-generate mechanics), the GTM strategy structure shifts substantially.

- The activation rate -- the percentage of new signups who complete the core value-generating action within 24 hours -- is the single most important metric. A PLG motion with a below-40% activation rate will not compound regardless of top-of-funnel volume. Fix activation before scaling acquisition.
- Channel strategy de-emphasizes traditional mid-funnel consideration channels (retargeting, nurture emails, sales outreach) in favor of viral coefficient optimization: (a) reduce friction in the sharing or invitation mechanism, (b) increase the value the inviter receives when their invitee activates, (c) track virality coefficient K (K = invitations sent per user × activation rate of invited users -- a K above 0.5 creates meaningful compounding; K above 1.0 creates exponential growth without paid acquisition).
- The launch sequence must include an "aha moment" experiment sprint: instrument the product to identify at what point in the onboarding flow users who retain long-term diverge from those who churn, then optimize the first-session experience to drive more users to that point faster.

### Undifferentiated or Commodity Market Entry

When entering a market with many established competitors offering functionally similar products, the positioning challenge is acute -- rational feature comparison will not win.

- Do not lead with feature comparison. Position on a narrower target audience with extreme specificity. "The project management tool for construction subcontractors" will outperform "a simpler project management tool" because the former speaks directly to an underserved segment that feels unseen by generic alternatives. This is called "niching down" or "beachhead strategy."
- Identify the segment most underserved by the existing competitive set -- not the largest segment, the most underserved one. The largest segment is where competition is fiercest. The most underserved segment has the highest willingness to try a new solution.
- Launch pricing must undercut parity pricing by 20-30% to overcome switching costs if the product is genuinely at parity on features. Alternatively, launch at parity or premium pricing but offer a significantly better onboarding experience, customer support SLA, or integration with a tool the target segment already uses -- these reduce perceived switching risk without requiring a price war.

---

## Example

**User Input:** "We've built a SaaS tool that automatically generates SOC 2 audit-ready documentation from a company's existing tech stack. It integrates with AWS, GitHub, Okta, and Jira. It reads configurations and produces the control documentation you need for a SOC 2 Type II audit. We're targeting seed-to-Series B startups. Price is $499/month. We have $35K for launch, want to launch in 8 weeks, and we have zero existing customers but the founder has 2,000 LinkedIn followers in the DevOps and security space. Our main competitors are manual consulting engagements ($25K-$80K per audit) and a larger, complex compliance platform that takes 3-4 months to implement."

---

## Go-to-Market Strategy: Automated SOC 2 Documentation Platform

**Launch Type:** Net-new product
**Target Launch Date:** T+8 weeks from today
**GTM Budget:** $35,000 total
**Primary Target Segment:** Series A startups with 20-100 employees preparing for their first SOC 2 Type II audit

---

### Market Sizing

| Market Level | Definition | Size Estimate | Method |
|--------------|-----------|---------------|--------|
| TAM | All US companies that need or will need SOC 2 compliance | ~180,000 companies / ~$4.2B addressable | Top-down: Gartner GRC market size, filtered to SOC 2 |
| SAM | US seed-to-Series B SaaS startups with 10-200 employees, AWS/GitHub infrastructure | ~22,000 companies | Bottom-up: Crunchbase/LinkedIn filter × avg $7,200 ACV |
| SOM | Reachable in 12 months given $35K launch budget and $500 CAC target | ~70 customers / $504K ARR | Budget ($35K) / target CAC ($500) = 70 customers; SOM = 70 × $499/mo × 12 |

---

### Market Segmentation (STP)

| Segment | Description | Size (SAM) | WTP | Accessibility | Competitive Intensity | Priority | Rationale |
|---------|------------|-----------|-----|--------------|----------------------|----------|-----------|
| Series A startups (20-100 employees) doing first SOC 2 | Engineering-led, first-time compliance, being pushed by enterprise prospects; currently choosing between consultants or building manually | ~8,000 companies | High -- a $25K consultant engagement makes $499/mo an easy comparison | High -- reachable via LinkedIn, DevOps communities, and VC portfolios | Medium -- consultant alternative is slow and expensive; larger platforms require long implementation | **Primary** | Clearest pain (enterprise deal blocked by audit), highest urgency, and most favorable competitive comparison |
| Series B companies (100-300 employees) with lapsed or expiring SOC 2 certification | Have done one audit already, understand the pain, need to renew; more complex environments | ~4,500 companies | High | Medium -- harder to reach cold; better via partnerships | Medium | **Secondary** | Larger deal potential and renewal motion; revisit at $25K MRR when customer success team exists |
| Enterprise (300+ employees) with dedicated compliance function | Have GRC teams, existing compliance platforms, procurement process | ~12,000 companies | High but procurement-gated | Low -- requires enterprise sales motion | High -- dedicated GRC platforms like Drata and Vanta well established | **Deferred** | Revisit when annual contract value exceeds $25K and SOC 2 is extended to ISO 27001 and HIPAA modules; trigger: $200K ARR |
| Seed-stage startups (<20 employees) | Not yet being asked for SOC 2 by customers; pain is abstract | ~9,000 companies | Low -- urgency is not present | High | Low | **Deferred** | Revisit with a "SOC 2 ready" lower tier ($99/mo) when bandwidth allows; trigger: end of year 1 |

---

### Positioning

**Competitive Frame of Reference:** Series A startups currently compare options between (a) hiring a compliance consultant for $25K-$80K per audit engagement, and (b) attempting to manually build documentation themselves using Google Docs and Notion templates.

**Positioning Statement (Primary Segment):**
For Series A startup CTOs and engineering leads who are blocking enterprise deals because they lack SOC 2 documentation, [Product] is the automated compliance documentation platform that generates audit-ready SOC 2 controls from your existing AWS, GitHub, Okta, and Jira configurations in days -- not months -- unlike $50K consultant engagements that take 4-6 months and require significant internal engineering time.

**Points of Difference (POD):**
1. Integration-driven automation -- pulls live configuration data rather than asking for manual input, meaning documentation stays current as infrastructure changes rather than going stale
2. Time-to-audit-ready -- customers reach an auditor-ready documentation package in 5-10 business days vs. 3-5 months for traditional methods
3. Price point accessible to startups -- at $499/month, the product pays for itself if it saves one week of an engineer's time (worth ~$4,000-$6,000 at startup salary rates)

**Points of Parity (POP -- table stakes, do not lead with these):**
- Supports all five SOC 2 Trust Service Criteria (Security, Availability, Processing Integrity, Confidentiality, Privacy)
- Audit firm-agnostic (works with any Big 4 or regional CPA firm conducting the audit)
- Role-based access controls so auditors can be given read-only access

---

### Message Architecture (AIDA)

**Primary Segment: Series A CTOs and Engineering Leads**

**Message Pyramid:**
- **Headline:** "Close enterprise deals faster -- get SOC 2 documentation done in days, not months"
- **Pillar 1:** Speed to audit-ready -- SOC 2 documentation generated from your existing integrations in 5-10 business days
- **Pillar 2:** No consultant required -- save $25K-$80K on outside consulting fees while retaining full control of the process
- **Pillar 3:** Built for engineering-first startups -- connects to the tools your team already uses (AWS, GitHub, Okta, Jira) and stays current automatically

| AIDA Stage | Message | Channel Context | Variant A | Variant B |
|------------|---------|----------------|-----------|-----------|
| Attention | "How many enterprise deals have you lost to a SOC 2 checkbox?" | LinkedIn feed ads targeting CTO/VP Engineering at Series A companies; cold email subject line | "Your competitor passed their SOC 2 audit last quarter" | "Enterprise prospects are asking for your SOC 2 -- here's the fastest path to it" |
| Interest | "The average Series A startup spends 4.5 months and $40K+ to complete their first SOC 2 Type II audit. Most of that time is manual documentation of controls that already exist in your AWS console and GitHub settings." | LinkedIn article, landing page above the fold, cold email body | Data-led: open with the $40K/4.5-month benchmark statistic | Story-led: "We talked to 50 startup CTOs -- every one of them said the same thing: the audit wasn't the hard part, the documentation was" |
| Desire | "Connect your AWS, GitHub, Okta, and Jira accounts. We read your existing configurations and generate the complete control documentation package your auditor needs. Customers reach audit readiness in an average of 7 business days." + customer quote from beta | Landing page below the fold, demo video, proposal deck | ROI-focused: "If this saves 3 weeks of an engineer's time, it pays for itself in the first month" | Risk-focused: "Your first-year SOC 2 documentation is the foundation for every renewal --
