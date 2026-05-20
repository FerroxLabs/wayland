---
name: lean-canvas
description: |
  Completes a Lean Canvas for a specific business idea covering problem, solution, unique value proposition, unfair advantage, customer segments, key metrics, channels, cost structure, and revenue streams. Use when the user asks about Lean Canvas, one-page business model, lean startup canvas, or business model canvas for startups.
  Do NOT use for a traditional business plan (use business-plan), idea validation experiments (use idea-validation), or MVP scoping (use mvp-definition).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "entrepreneurship strategy planning template analysis"
  category: "business-strategy"
  subcategory: "entrepreneurship"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---
# Lean Canvas

## When to Use

**Use this skill when:**
- The user asks to create, complete, or fill out a Lean Canvas for a specific business idea, product, or startup concept
- The user wants a one-page business model overview and mentions terms like "one-page plan," "lean startup canvas," or "Ash Maurya's canvas"
- The user wants to map out the core assumptions of a new business before writing a formal plan or building anything
- The user wants to compare two or more business model directions side by side to decide which to pursue
- The user has a business idea and wants to stress-test it by surfacing the riskiest assumptions before investing significant time or money
- The user is preparing for an investor conversation, accelerator application, or co-founder recruiting pitch and needs a concise model summary
- The user wants to document a pivot or a new strategic direction for an existing business in a structured format

**Do NOT use this skill when:**
- The user needs a detailed, multi-section business plan with executive summary, market analysis, operations plan, and projected financials (use `business-plan`)
- The user wants to design specific validation experiments or interviews to test a hypothesis (use `idea-validation`)
- The user needs to scope the features and acceptance criteria for a minimum viable product (use `mvp-definition`)
- The user asks for a 3-year or 5-year financial model with P&L, cash flow, or cap table projections (use `financial-model-structure`)
- The user is analyzing a large, established enterprise rather than a startup or new venture -- the Lean Canvas is designed for early-stage uncertainty, not mature business operations
- The user explicitly asks for a Business Model Canvas (Osterwalder's nine-block canvas) -- while related, it has different boxes and a different focus; clarify which framework they want before proceeding

---

## Process

### Step 1: Extract the Core Business Idea Before Touching the Canvas

Before filling a single box, build a complete picture of what the user knows. Ask targeted questions if any critical element is missing.

- Ask the user to describe the product or service in one or two sentences, then probe: what does a customer actually do with it on day one?
- Identify whether this is a B2B, B2C, B2B2C, or marketplace model -- this determines which boxes carry the most risk and which channels are realistic
- Determine current stage: idea only, prototype exists, paying customers, post-revenue -- the canvas should reflect actual evidence, not aspirational guesses
- Ask what prompted the idea: did the founder experience this problem personally, observe it in others, or identify a market gap analytically? Personal pain points are stronger early signals than analytical gaps
- Note any existing assets: domain expertise, existing audience, patents, code, supplier relationships, or customer commitments -- these directly feed the Unfair Advantage box
- If the user has already attempted a canvas and wants a review, read their version first before suggesting changes

### Step 2: Fill Box 1 -- Problem (Including Existing Alternatives)

This is the most important box. An unclear problem statement makes every other box unreliable.

- List exactly three problems in priority order from most to least painful, from the customer's point of view -- not the founder's technical achievement
- Each problem must be specific enough to test: "restaurants waste food" is testable; "food waste is a global issue" is not
- For each problem, assign a rough frequency (daily, weekly, monthly) and intensity (annoying vs. workflow-blocking vs. business-threatening) -- problems that are both frequent and intense justify premium pricing
- List existing alternatives: these are how the customer solves the problem today without your product -- spreadsheets, pen and paper, existing software, hiring a person, doing nothing. The absence of existing alternatives signals a problem that may not be painful enough to act on
- The existing alternative is also your true competition. A restaurant POS startup does not compete with other POS startups first -- it competes with the restaurant owner's current Excel spreadsheet or cash register
- Red flag: if the founder says "there is no existing solution," push back. Every painful problem has a workaround, even if it is inefficient

### Step 3: Fill Box 2 -- Customer Segments (Including Early Adopter)

Specificity here determines whether the rest of the canvas is actionable or hypothetical.

- Reject vague segments like "small businesses," "young professionals," or "healthcare companies." Force specificity along at least two dimensions: company size + vertical (B2B), or demographic + behavior + life situation (B2C)
- A well-defined segment should be reachable: you should be able to name a publication they read, a conference they attend, a community they participate in, or an ad targeting parameter that describes them
- Identify the early adopter -- the subset of the segment who will pay before the product is perfect because the problem is so acute they cannot wait. Early adopters are often: first-time buyers of the category, people who have recently experienced the problem acutely, or people who have already tried to DIY a solution
- For B2B: distinguish the buyer (who signs the contract and pays) from the user (who operates the product) and from the champion (who advocates internally). These can be three different people with different motivations
- For marketplaces: the canvas must address both sides. Pick one side as the primary focus for this canvas -- typically the harder-to-acquire side or the side that pays

### Step 4: Fill Box 3 -- Unique Value Proposition

This is the single hardest box to write well, and most founders write it too early before they understand the problem deeply.

- The UVP is a single sentence that communicates: (1) what you do, (2) who it is for, and (3) why it is meaningfully better than the best existing alternative
- Use the Ash Maurya formula as a starting point: "[Verb] [outcome] for [target customer] [differentiator clause]" -- example: "Get all your design work done for a flat monthly fee -- no hiring, no per-project bidding"
- Test the UVP with the "so what" test: read it out loud. If a stranger's natural reaction is "so what," it is not compelling. If their reaction is "wait, how does that work?" or "I need that," it is working
- Avoid buzzwords: "disruptive," "AI-powered," "end-to-end solution," "seamless," "innovative" -- these consume space without communicating value
- The UVP is not a tagline and not a mission statement. It is a value claim that a rational customer in the target segment would find credible and motivating
- If the user cannot write a clear UVP, this often signals that the Problem or Customer Segment boxes need more work first. The UVP is downstream of understanding the customer's problem acutely

### Step 5: Fill Boxes 4, 5, 8 -- Solution, Channels, Key Metrics

These three boxes form the operational backbone of the canvas.

**Solution:**
- Map each solution element directly to a numbered problem from Box 1. If a solution element does not address a stated problem, it does not belong on the canvas
- Keep solutions minimal -- this is the core approach or mechanic, not a feature list. "Automated invoice reconciliation using bank transaction data" is a solution. A list of 12 features is a product roadmap
- If the solution requires a technology that does not exist yet or a partnership that has not been secured, flag this as a dependency and note the risk level
- Distinguish between the solution (what it does) and the delivery mechanism (how it is built). The canvas needs the what, not the how

**Channels:**
- Separate acquisition (finding new customers) from delivery (how customers use the product). The Channels box covers acquisition and activation
- For each channel, assess: cost per lead (paid ads: $5-50; content/SEO: $0 but 6-12 months; outbound: $50-200 in labor), conversion rate, and time to first result
- Early-stage startups should bias toward unscalable, high-touch channels first (direct outreach, personal network, founder-led sales) -- these provide learning, not just customers
- For B2B with ACV above $10,000/year, direct sales and partnerships are usually more effective than inbound marketing alone
- For B2C with LTV below $100, paid acquisition is usually not viable until organic and referral loops are established and conversion rates are measured

**Key Metrics:**
- Use the AARRR framework (Acquisition, Activation, Retention, Referral, Revenue) as a checklist -- the canvas should capture at least one metric from Acquisition, Retention, and Revenue
- Metrics must be measurable today, not theoretical. "Brand awareness" is not a key metric. "Weekly active users" is
- Choose the One Metric That Matters (OMTM) for the current stage: pre-revenue startups should track activation rate; post-revenue startups should track MRR growth rate or net revenue retention
- For subscription businesses, key metrics are MRR, churn rate (monthly target below 2% for B2C, below 1% for B2B), and LTV:CAC ratio (healthy at 3:1 or above)
- For transactional/marketplace businesses, key metrics are GMV, take rate, repeat transaction rate, and supplier/buyer balance ratio

### Step 6: Fill Boxes 6, 7 -- Revenue Streams and Cost Structure

These two boxes are the reality check on whether the business can survive financially.

**Revenue Streams:**
- Name the pricing model explicitly: subscription (monthly/annual), usage-based (per transaction, per API call, per seat), one-time purchase, freemium with paid upgrade, commission/take rate, or hybrid
- Include a specific price point or range -- even a rough estimate forces financial discipline. "Premium pricing" is not a revenue model
- Calculate revenue per customer per month and multiply by target customer count at 12 months to produce a rough Year 1 revenue target -- this surfaces whether the model is worth building
- For subscription: note monthly vs. annual billing preference. Annual contracts reduce churn and improve cash flow but require a higher trust threshold from the customer
- For marketplace/commission models: model the take rate (typically 10-30% depending on category) and note whether it is buyer-side, seller-side, or split

**Cost Structure:**
- Separate fixed costs (exist regardless of customer count: salaries, SaaS tools, rent, legal) from variable costs (scale with customers: hosting, payment processing at 2.5-3.5%, customer support hours, cost of goods sold)
- For software businesses, common fixed monthly costs at early stage: $200-500 for infrastructure, $100-300 for SaaS tools, $500-2000 for part-time contractors if applicable
- Calculate breakeven: the number of paying customers needed to cover total monthly fixed costs at the chosen price point, before factoring in variable costs
- Burn rate is the monthly fixed cost total when revenue is near zero. Knowing burn rate enables runway calculation: cash on hand ÷ monthly burn = months of runway
- Identify the unit economics: (Revenue per customer per month) -- (Variable cost per customer per month) = Contribution margin per customer. Contribution margin must be positive for the business to scale

### Step 7: Fill Box 9 -- Unfair Advantage

This is the most intellectually honest box on the canvas, and the most frequently misused.

- An unfair advantage is something that cannot be easily bought or copied by a well-funded competitor. The test: "If a startup with $10M raised tomorrow to do exactly this, could they neutralize this advantage in 12 months?" If yes, it is not an unfair advantage
- Real unfair advantages include: proprietary data sets (years of transaction history, sensor data, user behavior data), genuine network effects (the product becomes more valuable as more users join, and switching costs increase), an exclusive distribution partnership or regulatory license, a founder's insider access to a specific community or market, deep domain expertise that takes years to acquire, or a brand built over time that carries trust in a specific niche
- Things that are NOT unfair advantages: passion, a great team, being first to market, a clever idea, working harder than competitors, or a patent that has not yet been defended
- If no unfair advantage exists -- which is normal for most early-stage startups -- write "None yet" and articulate what could become one as the business matures (e.g., "Proprietary dataset of X after 10,000 transactions," "Network effects if supplier count exceeds 50 in a geography")
- Honesty in this box increases credibility with investors. Investors know when founders are inflating the Unfair Advantage box, and dishonesty here raises red flags about self-awareness

### Step 8: Review for Internal Consistency and Produce the Canvas Assessment

A complete canvas has internal logic -- every box connects to adjacent boxes. Run this consistency checklist before delivering the output.

- **Problem → Customer Segment:** Are these problems actually experienced by the stated segment, not just assumed? Can the founder name three specific people in the segment who have expressed this problem?
- **Solution → Problem:** Is every solution element mapped to a numbered problem? Are there solutions without corresponding problems (scope creep)?
- **UVP → Existing Alternatives:** Does the UVP directly address why this is better than the existing alternatives named in Box 1? If the UVP would not convince someone currently using the existing alternative to switch, rewrite it
- **Channels → Customer Segment:** Can you actually reach this segment via these channels? Test this by asking: does this segment read that publication, use that platform, attend that conference?
- **Revenue → Cost:** Does the contribution margin at the stated price point support profitable growth, or does it require massive scale to break even?
- **Key Metrics → Business Model:** Are the metrics tied to the revenue model? A subscription business without a churn metric is missing critical information
- After the consistency check, produce the Canvas Assessment section: identify the single riskiest assumption, propose the cheapest first experiment to test it, and assign a confidence level (High / Medium / Low) based on current evidence

---

## Output Format

```
## Lean Canvas: [Business Idea Name]
**Version:** 1.0 | **Date:** [Date] | **Stage:** [Idea / Pre-revenue / Early traction / Post-revenue]

---

### Problem                                    | Solution
---------------------------------------------|-----------------------------------------------
1. [Most painful, most frequent problem]     | 1. [Core mechanic addressing Problem 1]
2. [Second most painful problem]             | 2. [Core mechanic addressing Problem 2]
3. [Third problem]                           | 3. [Core mechanic addressing Problem 3]
                                             |
**Existing Alternatives:**                   | **Key Metrics**
- [How customers solve Problem 1 today]      | - [Acquisition metric]
- [How customers solve Problem 2 today]      | - [Activation metric]
- [How customers solve Problem 3 today]      | - [Retention metric]
                                             | - [Revenue metric (MRR, GMV, conversion)]

---

### Unique Value Proposition
**Headline:** [Single sentence: outcome + audience + differentiation vs. existing alternatives]
**Tagline (optional):** [Shorter version for marketing use]

---

### Unfair Advantage                          | Channels
---------------------------------------------|-----------------------------------------------
[Current advantage OR "None yet"]           | **Acquisition:**
                                             | - [Channel 1: type, estimated CPL, timeline]
**Could become:**                            | - [Channel 2: type, estimated CPL, timeline]
- [What could develop into an advantage      | **Delivery/Activation:**
  over time and how]                         | - [How customers access the product]

---

### Customer Segments                         | Revenue Streams
---------------------------------------------|-----------------------------------------------
**Primary segment:**                         | **Pricing model:** [Subscription / Transactional /
[Specific description with 2+ dimensions]   | Usage-based / Commission / Other]
                                             |
**Early adopter:**                           | - [Tier 1]: $[X]/month -- [what is included]
[Subset most desperate for solution, and    | - [Tier 2]: $[X]/month -- [what is included]
 why they will buy before product is        |
 perfect]                                   | **Revenue per customer per month:** $[X]
                                             | **Target MRR at month 12:** $[X]
**B2B note (if applicable):**               | **Estimated LTV:** $[X] (based on [X]-month
Buyer: [role] | User: [role] | Champion:    | avg retention)
[role]                                       |

---

### Cost Structure
| Category         | Item                          | Monthly Cost     |
|------------------|-------------------------------|------------------|
| Fixed            | [Salaries / Contractor fees]  | $[X]/month       |
| Fixed            | [Infrastructure / Hosting]    | $[X]/month       |
| Fixed            | [SaaS tools]                  | $[X]/month       |
| Variable         | [Per-customer cost]           | $[X]/customer    |
| Variable         | [Payment processing]          | [X]% of revenue  |

**Monthly burn rate (zero revenue):** $[X]/month
**Contribution margin per customer:** $[revenue] -- $[variable cost] = $[X]/customer
**Breakeven:** [X] paying customers at $[X]/month covers fixed costs
**Unit economics verdict:** [Positive / Negative / Depends on scale threshold of X customers]

---

### Canvas Assessment

| Item                      | Detail                                                                 |
|---------------------------|------------------------------------------------------------------------|
| **Riskiest assumption**   | [The single belief that, if wrong, invalidates the entire canvas]      |
| **First experiment**      | [Cheapest, fastest way to test the riskiest assumption -- specific]    |
| **Second assumption**     | [The next most critical untested belief]                               |
| **Confidence level**      | [High / Medium / Low] -- [Reason: what evidence exists or is missing]  |
| **Next canvas review**    | [After what milestone or experiment should this canvas be revised?]    |
```

---

## Rules

1. **Never fill boxes with vague generalities.** "Great customer service" is not a solution. "Response to every support ticket within 2 hours with a named account manager" is. Every box entry must be specific enough that someone could test, observe, or measure it independently.

2. **Always fill the canvas in Lean Canvas order** -- Problem, Customer Segments, UVP, Solution, Channels, Revenue, Costs, Key Metrics, Unfair Advantage. This order is intentional: it forces problem-first thinking and prevents founders from starting with a solution in search of a problem.

3. **The Problem box must name existing alternatives, not competitors.** Competitors are other startups. Existing alternatives are how the customer solves the problem today without your startup. Conflating these two causes founders to underestimate how hard it is to change behavior.

4. **The UVP must pass the stranger test.** Read it aloud to someone unfamiliar with the business. If they do not understand who it is for and why it matters within ten seconds, it needs rewriting. Acronyms, technical terms, and category jargon that are unfamiliar to the target customer must be removed.

5. **The Customer Segment must name the early adopter separately from the total addressable market.** The early adopter is not the entire market. Trying to serve the entire segment on day one is a common failure mode. If the user cannot describe the early adopter in one specific sentence, they do not yet know enough about their market to build.

6. **Key Metrics must be lagging indicators tied to the revenue model, not vanity metrics.** Page views, downloads, social followers, and press mentions are not key metrics for a Lean Canvas. Every metric listed must directly indicate whether the business model is working. If you cannot explain why a metric would change your decisions, remove it.

7. **The Unfair Advantage box requires honesty above all else.** If no real advantage exists, write "None yet" and propose what could develop into one. Writing false advantages ("our team is passionate") does not fool investors, and it trains the founder to avoid the hard thinking that actually creates defensibility.

8. **The Cost Structure must include a breakeven calculation.** A canvas without a breakeven number has no financial reality check. Breakeven = Monthly fixed costs ÷ (Revenue per customer per month -- Variable cost per customer per month). If breakeven requires more than 500 customers to achieve at the stated price point for a pre-seed startup, flag this as a structural concern.

9. **The canvas must be dated and versioned.** Business assumptions change as evidence arrives. A canvas without a date is disconnected from the learning process. Instruct the user to re-examine the canvas after each major experiment, customer interview batch (minimum 5-10 interviews), or product release.

10. **The Canvas Assessment is mandatory, not optional.** The Lean Canvas is a hypothesis document. Delivering a canvas without identifying the riskiest assumption and a first experiment treats the canvas as a finished plan rather than a starting point for learning. Every canvas output must end with an assessment section.

---

## Edge Cases

### Two-Sided Marketplace

A marketplace has two distinct customer populations: supply-side (providers, sellers, service givers) and demand-side (buyers, customers, service receivers). A single canvas that conflates both sides produces inaccurate problem statements and unrealistic channel plans.

- Create two separate canvas versions -- one for each side -- and present them together. Label them clearly: "[Product Name] Canvas: Supply Side" and "[Product Name] Canvas: Demand Side"
- The Problem, Customer Segment, Key Metrics, and Channels boxes will differ significantly between the two sides
- Revenue typically comes from one side (usually demand) while the other side (usually supply) is subsidized. Note which side pays and which side receives free or subsidized access, and why
- The chicken-and-egg problem is the riskiest assumption for most marketplaces: suppliers will not join without buyers, and buyers will not join without suppliers. Name this explicitly in the Canvas Assessment and propose a sequencing strategy (e.g., build supply in one geographic cluster before opening demand)
- Network effects, when they develop, typically become the primary Unfair Advantage for a marketplace. Note this in the Unfair Advantage box as a future development, not a current asset

### Multiple Competing Customer Segments

When a product could serve several distinct segments (e.g., both small businesses and enterprise teams, or both consumers and B2B buyers), the founder must choose a primary focus or create multiple canvases.

- Never let a customer segment box contain "anyone who needs X" or multiple fundamentally different segment types. The UVP, channels, and pricing will differ too much to be coherent
- Create a separate canvas for each segment being considered. Compare the canvases on four dimensions: (1) problem severity and willingness to pay, (2) accessibility via channels, (3) competitive intensity, and (4) strategic value over time
- The segment with the highest problem severity, a reachable acquisition channel, and the clearest path to breakeven within 12 months is usually the right starting point
- Note that the segment chosen first often determines the product's identity and pricing anchoring for years. A product built for small businesses often struggles to move upmarket to enterprise without a significant rebuild -- this is a strategic choice, not just a sales decision

### Pivot from an Existing Business

When the user is pivoting an existing product rather than starting from zero, the canvas must capture the discontinuity between old and new direction while preserving existing assets.

- Fill the canvas for the new direction completely and independently -- do not carry assumptions forward from the old model without explicitly validating them
- Audit what carries over: existing customer relationships (are they relevant to the new segment?), technology (does any existing code or infrastructure apply?), domain knowledge, brand equity, and revenue contracts
- Items that genuinely carry over and are non-replicable by a new entrant belong in the Unfair Advantage box. Assets that any well-funded competitor could acquire do not
- Flag assumptions that the founder believes to be true based on the old business but have not been tested in the new context -- these are particularly dangerous because they feel validated but are not

### Pre-Revenue, Idea-Only Stage

When the user has no evidence of any kind -- no customer conversations, no prototype, no revenue -- the canvas should be clearly labeled as a hypothesis document.

- Mark the confidence level as Low across most boxes and note which boxes are based on founder assumptions vs. observed customer behavior
- The Canvas Assessment should be weighted heavily toward the first two experiments needed before the canvas can be revised with real data
- Encourage the user to conduct at minimum 10 structured customer discovery conversations (not demos, not pitches -- listening sessions) before treating any canvas box as validated
- Flag the Problem box as the highest priority for validation: everything else on the canvas is built on the assumption that the stated problem is real, frequent, and worth solving. If problem validation fails, the entire canvas should be rebuilt from scratch

### Non-Profit, Social Enterprise, or Mission-Driven Venture

The Lean Canvas adapts to non-profit and social enterprise models with targeted modifications.

- Revenue Streams should capture all income types: earned income (product/service sales), grants (foundation, government), donations (individual), and in-kind contributions -- each is treated as a separate stream with different reliability and renewal characteristics
- Cost Structure must distinguish between program costs (direct delivery of mission) and operating costs (organizational overhead). Funders typically scrutinize the ratio; a healthy overhead ratio for social enterprises is generally 20-35% of total budget
- Key Metrics should include both financial sustainability metrics (reserve ratio, grant renewal rate, earned income as a percentage of total revenue) and impact metrics (people served, outcomes achieved, cost per beneficiary)
- The UVP typically addresses two audiences: beneficiaries (who receive the service) and funders/donors (who finance it). Consider writing a UVP for each audience
- Unfair Advantage may include: a trusted brand within a specific community, long-standing relationships with program participants, or a founder with lived experience of the problem -- these create credibility that new entrants cannot replicate quickly

### Deep Tech, Research-Based, or Hardware Startups

These businesses have longer lead times to market and different risk profiles than pure software startups.

- The Solution box should describe the real-world customer experience, not the technology. The technology goes in the Unfair Advantage box (if it creates a genuine moat) and the Channels box may need to include regulatory approval pathways or distribution partnerships as steps before customer reach
- Cost Structure is more complex: R&D costs, prototype costs, manufacturing costs (for hardware), and regulatory compliance costs must all be captured. Breakeven timelines may be 36-60 months rather than 12 months
- Key Metrics for deep tech should include technical milestones (TRL level, prototype performance benchmarks, regulatory submission dates) alongside commercial metrics -- technical risk and commercial risk are both active
- The riskiest assumption for most deep tech ventures is not technical feasibility but commercial viability: does the customer value the performance improvement enough to change suppliers, retrain staff, or change procurement processes? This assumption belongs prominently in the Canvas Assessment

---

## Example

**Input:** "I want to build a SaaS tool for independent restaurant owners that automatically analyzes their POS sales data, identifies their most and least profitable menu items, and recommends weekly pricing or menu changes. Most restaurant owners I've talked to just look at their POS end-of-day report and have no idea if they're actually making money on each dish."

---

## Lean Canvas: MenuProfit -- Restaurant Menu Intelligence SaaS
**Version:** 1.0 | **Date:** [Current] | **Stage:** Idea / Pre-revenue (5 customer discovery interviews completed)

---

### Problem | Solution
---|---
1. Restaurant owners cannot identify which menu items lose money after food cost, labor, and prep time are accounted for -- end-of-day POS reports show revenue, not profit per dish | 1. Automated menu profitability analysis: integrates with POS, calculates true margin per dish including food cost % and prep time
2. Pricing decisions are made on gut feel or competitor observation rather than data -- owners have not raised prices in 12-18 months despite food cost inflation of 15-25% since 2021 | 2. Weekly pricing recommendation engine: flags underpriced high-demand items and overstocked low-margin items based on sales velocity + food cost data
3. Menu engineering (the practice of structuring menus to guide customers toward high-margin items) is known in the industry but requires expensive consultants ($2,000-5,000 per engagement) or internal expertise most independent operators do not have | 3. Monthly menu engineering report: uses BCG-style four-quadrant analysis (Stars, Plowhorses, Puzzles, Dogs) to prioritize which items to promote, reprice, re-engineer, or remove
| |
**Existing Alternatives:** | **Key Metrics**
- Manual spreadsheet tracking (used by ~20% of independent operators; time-consuming, rarely updated) | - New POS integrations connected per month (acquisition)
- POS built-in reporting (shows sales volume, not profitability; lacks food cost data) | - % of users completing first profitability report within 7 days of signup (activation)
- Restaurant consultant engagement (expensive, one-time, not ongoing) | - Monthly active users running at least one report per week (retention)
- Ignoring the problem entirely (majority of independent operators) | - Monthly Recurring Revenue (MRR) and MRR growth rate

---

### Unique Value Proposition
**Headline:** Know exactly which dishes make you money -- and which ones are quietly killing your margins -- in 10 minutes a week.
**Tagline:** Menu intelligence for independent restaurants. No spreadsheets. No consultants.

---

### Unfair Advantage | Channels
---|---
**Current:** None established. | **Acquisition:**
| - Direct outreach to independent restaurant owners via Instagram and Facebook (targeting: restaurant owner + independent business + specific metro area); estimated CPL $15-40
**Could develop into:** | - Partnership with POS companies (Toast, Square for Restaurants) as a third-party integration in their app marketplaces -- free distribution to existing POS user bases
- Proprietary benchmarking dataset: after 500+ restaurants, MenuProfit will hold industry-specific food cost benchmarks by cuisine type and market size that no new entrant can replicate quickly | - Content marketing: SEO-targeted articles on "restaurant food cost percentage," "menu engineering guide," "how to price a menu" -- high-intent search terms, 6-12 month horizon
- POS integration depth: deep integrations with 3-5 major POS systems create switching costs once set up | - Restaurant industry associations and trade shows (NRA Show, regional operator groups)
- Restaurant owner community trust: independent operators are a high-referral community if the product demonstrably saves money | **Activation:**
| - Self-serve onboarding with POS OAuth connection; first profitability report generated automatically within 15 minutes of signup

---

### Customer Segments | Revenue Streams
---|---
**Primary segment:** | **Pricing model:** Monthly SaaS subscription (annual option available at 2 months free)
Independent restaurant owners operating 1-3 locations with annual revenue of $500K-$3M, using a cloud POS system (Toast, Square, Lightspeed, Clover) | |
| - **Starter:** $79/month -- 1 location, weekly profitability reports, pricing recommendations
**Early adopter:** | - **Growth:** $149/month -- up to 3 locations, menu engineering reports, food cost benchmarking vs. industry
Independent restaurant owners who: (1) have already tried to track food costs manually and found it too time-consuming, (2) experienced margin pressure from 2021-2024 food cost inflation and are actively seeking a solution, or (3) are recently opened (0-24 months) and trying to optimize before habits are formed | - **Annual discount:** 2 months free on annual prepay (improves cash flow and reduces monthly churn)
| |
**B2B structure:** | **Revenue per customer per month:** $79-149
Buyer = Owner/operator (signs up, pays) | **Target MRR at month 12:** $20,000 (approx. 160-200 active subscribers)
User = Owner + head chef (use the reports) | **Estimated LTV:** $2,370 (30-month avg retention at $79/month -- based on comparable restaurant SaaS benchmarks)
Champion = Head chef who wants data to negotiate menu decisions with the owner |

---

### Cost Structure
| Category | Item | Monthly Cost |
|---|---|---|
| Fixed | Founder salary (1 technical founder, below-market) | $5,000/month |
| Fixed | Infrastructure / hosting (AWS, database) | $300/month |
| Fixed | POS API access fees (per-integration licensing) | $200/month |
| Fixed | SaaS tools (analytics, support, billing via Stripe) | $200/month |
| Variable | Stripe payment processing | 2.9% + $0.30/transaction |
| Variable | Customer support time (est. 30 min/customer/month at $30/hr contractor rate, scales down with documentation) | $15/customer/month |

**Monthly burn rate (zero revenue):** ~$5,700/month
**Contribution margin per customer (Starter tier):** $79 revenue -- $15 variable cost -- $2.30 payment processing = ~$61.70/customer
**Breakeven:** ~$5,700 ÷ $61.70 ≈ 93 paying customers at Starter pricing
**Unit economics verdict:** Positive contribution margin from first customer. Breakeven achievable within 9-12 months at a reasonable growth rate. LTV:CAC ratio depends heavily on acquisition channel -- at $40 CPL and 5% trial-to-paid conversion, CAC = $800, LTV:CAC = 2.97:1 (slightly below the healthy 3:1 threshold; improving activation rate to 8% conversion brings this to 4.7:1).

---

### Canvas Assessment

| Item | Detail |
|---|---|
| **Riskiest assumption** | Independent restaurant owners will pay $79/month for automated profitability reports when most have never tracked food costs digitally -- the behavior change required (connecting POS, inputting food costs, acting on weekly reports) may exceed what time-constrained owners will actually do, regardless of stated interest in the concept |
| **First experiment** | Build a no-code prototype: connect a CSV export from Toast or Square to a Google Sheets template that auto-calculates margin per dish. Offer this manually as a "white-glove audit" to 10 restaurant owners for $0 or a small fee ($50-100 one-time). Measure: do they complete the food cost data input? Do they act on the recommendations? Do they say they would pay $79/month for this automatically? Target: 6 of 10 owners complete the process AND 4 of 10 express willingness to pay monthly |
| **Second riskiest assumption** | POS integration will work reliably across the target POS platforms. Toast, Square, and Lightspeed all have different data schemas, API rate limits, and terms of service for third-party applications. Integration complexity may significantly increase development cost and time to launch |
| **Confidence level** | **Medium-Low.** Five customer discovery interviews confirm the problem exists and owners express interest. No payment validation has occurred yet. No prototype has been tested. POS integration feasibility has not been scoped. |
| **Next canvas review** | After completing 10 manual profitability audits (white-glove experiment) and receiving at least 3 verbal commitments to pay -- or after discovering that owners will not complete the food cost input step, which would require revisiting the Solution box fundamentally |
