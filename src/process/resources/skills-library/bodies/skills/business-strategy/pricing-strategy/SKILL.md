---
name: pricing-strategy
description: |
  Analyzes pricing options using cost-plus, value-based, and competitive pricing frameworks with a structured recommendation for product or service pricing decisions. Use when the user asks about pricing strategy, how to price a product, pricing models, value-based pricing, or competitive pricing analysis.
  Do NOT use for personal finance calculations, unit economics analysis (use unit-economics), or full financial modeling (use financial-model-structure).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "strategy analysis planning sales marketing"
  category: "business-strategy"
  subcategory: "finance-accounting"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Pricing Strategy

## When to Use

**Use this skill when:**
- A user asks how to price a new product or service and needs a structured methodology rather than a gut-check number
- A user wants to evaluate whether their current pricing is too low, too high, or structured incorrectly for their market
- A user wants to compare pricing models -- subscription vs. usage-based vs. per-seat vs. freemium vs. one-time purchase -- and needs help choosing the right one
- A user needs to build a tiered pricing structure (good-better-best) and wants guidance on tier design, fencing, and anchoring
- A user is preparing a pricing page, sales deck, or investor pitch and needs the rationale for a specific price point
- A user wants to understand willingness-to-pay research methods (Van Westendorp, Gabor-Granger, conjoint analysis) and how to apply findings
- A user wants to restructure enterprise pricing with a discount matrix, volume tiers, or annual vs. monthly commitment incentives
- A user is entering a new market segment and needs to evaluate whether to price at parity, premium, or penetration relative to incumbents

**Do NOT use this skill when:**
- The user needs revenue projections or financial forecasts tied to pricing scenarios -- use `revenue-forecasting` instead
- The user is asking about unit economics, contribution margin, or LTV/CAC ratios -- use `unit-economics` instead
- The user needs a full three-statement financial model -- use `financial-model-structure` instead
- The user is asking about personal budget planning or personal finance calculations -- use `budget-planning` instead
- The user's question is purely about sales compensation tied to price tiers -- use a sales-compensation skill instead
- The user wants an M&A valuation or asset pricing (securities, real estate, business acquisitions) -- this skill covers product and service pricing only

---

## Process

### Step 1: Establish the Pricing Context

Before any analysis begins, gather the critical inputs that shape every subsequent decision. Missing even one of these will produce a flawed recommendation.

- **What is being priced:** Classify as SaaS (per-seat, usage-based, or platform), physical product (manufactured good, consumable, hardware), professional service (project-based, retainer, hourly), marketplace (take rate), or API/developer product (credit-based, rate-limited tiers)
- **Customer segment and size:** Consumer (B2C), small business (1-50 employees), mid-market (51-500), or enterprise (500+). Pricing architecture is fundamentally different across these -- enterprise pricing is relationship-based and negotiable; consumer pricing must convert at the point of display
- **Cost structure:** Collect direct variable costs per unit (COGS), allocated overhead per unit, and customer acquisition cost (CAC) -- even rough estimates. If the user has no cost data, prompt for revenue size and team size to estimate
- **Stage and goals:** Early-stage companies often need to choose between penetration pricing (low price to gain users and data) and premium positioning (high price to signal quality and fund operations). A Series A SaaS company has different pricing imperatives than a bootstrapped lifestyle business
- **Current pricing problems:** If repricing an existing product, identify the symptom -- high churn, low conversion, sales cycle friction, margin erosion, tier migration stalls, or competitive loss rate. The problem type shapes which dimension of the analysis matters most
- **Sales motion:** Self-serve (pricing page converts), sales-assisted (pricing is a starting point for negotiation), or enterprise (custom quotes). Self-serve pricing must do all the work; enterprise pricing needs a floor and ceiling with room in between

---

### Step 2: Perform Cost-Plus Analysis (The Price Floor)

Cost-plus is not a pricing strategy on its own -- but it is a mandatory constraint. Pricing below cost is a deliberate, time-limited strategy (penetration, loss-leading) that must be named as such, never accidental.

- **Direct variable costs per unit:** For SaaS, this is hosting/infrastructure, payment processing (Stripe charges 2.9% + $0.30 per transaction, which at a $20/month price equals ~$0.88, or 4.4%), third-party API costs (SMS, email, maps, AI model inference), and customer success labor allocated per account
- **Allocated fixed costs per unit:** R&D, G&A, and sales & marketing costs divided by expected unit volume at a given pricing tier. This is necessarily an estimate -- use current actuals and project forward at realistic growth rates
- **Cost of goods sold (COGS) margin benchmark by category:** SaaS gross margins typically run 70-85%; physical goods 30-60%; professional services 40-60%; marketplaces 60-80% on take rate. If calculated margins fall outside these ranges, question the cost assumptions
- **Cost-plus formula:** Total unit cost ÷ (1 -- Target Gross Margin %) = Cost-plus price. A $3.00/unit cost at a target 75% gross margin gives a floor of $3.00 ÷ 0.25 = $12.00/unit. This is NOT the recommended price -- it is the minimum viable price
- **Cash-basis cost floor:** For early-stage products with heavy R&D amortization, also calculate the cash-basis floor (excluding non-cash depreciation/amortization) to understand near-term survival price vs. long-term sustainable price
- **Red flag:** If cost-plus analysis produces a floor higher than competitive market prices, the unit economics are broken at the proposed scale. Flag this explicitly and suggest either a cost reduction path or a niche premium positioning that justifies a price above market

---

### Step 3: Perform Value-Based Analysis (The Price Ceiling)

Value-based pricing is the most powerful framework when done correctly and the most abused when done lazily. "Our product is valuable" is not value-based pricing. A specific, quantified customer outcome is.

- **Identify the economic buyer and their problem:** The person who signs the contract (not the user) cares about cost savings, revenue generation, risk reduction, or compliance. Map the value to their P&L line, not to the user's convenience
- **Quantify the status quo cost:** What does the customer spend today to address this problem? This includes direct costs (tool subscriptions, labor hours × hourly rate, materials), indirect costs (opportunity cost of slow processes, revenue lost from errors), and risk costs (regulatory fines, insurance premiums, churn from a poor experience)
- **Use the Economic Value to Customer (EVC) model:** EVC = Reference Value + Differentiation Value. Reference value is the cost of the next-best alternative (including doing nothing). Differentiation value is the additional value your product creates above that baseline. Price should capture 10-40% of EVC depending on switching costs, competitive intensity, and the customer's awareness of the value
- **Common value quantification examples:**
  - A tool that saves a 10-person team 2 hours/week: 10 people × 2 hrs × 52 weeks × $50/hr = $52,000/year in recovered labor value. At a 15% capture rate: $7,800/year or $650/month for the team
  - Software that reduces customer churn by 0.5%: For a business with $2M ARR, that is $10,000/year retained revenue. At a 30% capture rate: $3,000/year or $250/month
  - A tool that replaces two SaaS subscriptions totaling $200/month: Consolidation value justifies pricing up to $160-180/month (10-20% discount on replaced cost, plus switching cost incentive)
- **Willingness-to-pay research methods:**
  - **Van Westendorp Price Sensitivity Meter (PSM):** Ask four questions: At what price is this too cheap (suspect quality)? Too expensive (would not buy)? Expensive but would consider? A good value? Plot the curves -- the "Acceptable Price Range" is between the intersection of "too cheap" and "too expensive" curves
  - **Gabor-Granger:** Test a range of prices with a sample audience. Present each price and ask purchase intent (definitely/probably/probably not/definitely not). Plot the demand curve -- each price drop below the peak-revenue price must be justified by volume lift
  - **Conjoint analysis:** Most rigorous but most expensive. Buyers rate product configurations with different price/feature combinations. Statistical analysis extracts willingness-to-pay per feature. Use for major pricing architecture decisions, not routine adjustments
  - **Customer interviews:** Ask "What's your budget for this category?" (not "What would you pay?"). Ask "What would make this a no-brainer at [2x current price]?" to identify value gaps
- **Apply a reality check:** If value-based analysis produces a price more than 3-5x the competitive market, investigate whether the value quantification is realistic or whether buyer psychology will reject the price regardless of the math

---

### Step 4: Perform Competitive Pricing Analysis (Market Context)

Competitive analysis defines the gravitational field that pricing must operate within. Even a clearly superior product faces conversion headwinds if priced at 10x the nearest alternative without a compelling narrative.

- **Build a competitor pricing map:** For 3-6 direct and adjacent competitors, record: plan names, price per unit/seat/month, annual vs. monthly discount (typically 15-25% for annual commitment), free tier existence, enterprise pricing availability, and the primary gating feature between tiers
- **Classify each competitor:** Price leader (lowest in market, wins on cost), value leader (mid-price, broad feature set), premium player (highest price, superior outcomes or brand), or niche specialist (specific segment at specific price). Understanding their strategy reveals their weaknesses
- **Identify pricing model mismatches:** If you are evaluating per-seat pricing but major competitors use per-project or usage-based pricing, this is a structural opportunity. Customers who are heavy users of competitor products will do math -- model their specific usage to show whether your pricing model saves them money
- **Detect artificial price anchoring:** Many SaaS products publish inflated enterprise prices on pricing pages to make mid-tier prices look reasonable. Identify this pattern to understand how competitors are using anchoring and whether the recommended pricing can exploit the same technique
- **Look for pricing page psychology signals:** How many tiers? Where is the "Most Popular" badge? What is the ratio between the cheapest and most expensive published tiers? (Typical SaaS: 3-5 tiers, 4:1 to 8:1 price ratio between lowest and highest published tier.) These signals tell you what conversion behavior competitors are optimizing for
- **Note competitive pricing velocity:** Has a competitor recently changed pricing? Price increases after a period of growth often signal rising infrastructure costs or a move upmarket. Price cuts often signal churn problems or a competitive response. Recent changes should be flagged as volatility risk

---

### Step 5: Evaluate and Select the Pricing Model

The pricing model -- how the customer pays, not just how much -- is often more important than the specific number. The right model aligns customer value realization with payment, reduces friction at the conversion point, and scales naturally with customer success.

**Flat-rate subscription:**
- Structure: Single price for access to all (or most) features, billed monthly or annually
- Best for: Products with homogeneous usage patterns, consumer apps, simple B2B tools with a single persona
- Weakness: Revenue ceiling with each customer; no natural upsell path. Customers who extract 10x the value pay the same as low-usage customers
- Threshold: Consider flat-rate when 80%+ of customers have similar usage and feature needs

**Tiered subscription (Good-Better-Best):**
- Structure: 2-4 tiers with increasing feature sets, usage limits, or service levels
- Best for: SaaS products with multiple distinct customer personas (e.g., solo user, small team, department, enterprise)
- Design principle: Each tier's fence should map to a real behavioral difference in how customers use the product -- not arbitrary feature gates
- Anchoring rule: The middle tier should offer the best perceived value-per-dollar. The top tier should exist partly to make the middle tier look reasonable (anchor effect)
- Typical tier ratios: Tier 1 to Tier 2: 2.5-4x price increase. Tier 2 to Tier 3: 2-3x price increase. Wider spreads signal the tiers are too far apart; narrower spreads reduce upgrade motivation

**Usage-based / consumption pricing:**
- Structure: Pay per API call, per GB stored, per transaction, per message sent, per AI token consumed
- Best for: Infrastructure products (AWS charges per GB/compute hour), developer APIs, products where usage directly correlates with customer value and varies widely across accounts
- Revenue characteristics: Higher revenue ceiling than flat-rate (large customers pay proportionally) but more volatile month-to-month. Build monthly minimum commitments or base fees to protect revenue floor
- Common mistake: Pure usage-based pricing with no minimum creates free-rider risk and budget anxiety for customers. Add a free tier up to a threshold plus overage billing, or a base fee that includes a usage allowance

**Per-seat / per-user pricing:**
- Best for: Collaboration and communication tools where value scales directly with team size (Slack, Figma, Notion, Salesforce)
- Weakness: Seat pricing creates incentives for customers to limit adoption (sharing logins, reducing seat count at renewal) -- this caps the network effect that made the product valuable
- Mitigation: Consider per-seat pricing with a minimum seat threshold (e.g., minimum 5 seats) to protect revenue floor, plus admin accounts free of charge to reduce expansion friction
- When not to use: Products where a single power user extracts all the value (analytics tools used by one analyst for a whole company) -- per-seat becomes price-gouging optics

**Freemium:**
- Structure: Permanently free tier with limited features/capacity, plus paid upgrade
- Works when: Product has viral distribution (sharing outputs pulls in new users), network effects (more users = more value), or a genuine "try before you buy" evaluation cycle that requires real usage
- Failure mode: Freemium without virality or network effects creates a large, costly free user base with 1-3% conversion. Calculate: if free users cost $0.50/month to serve and you have 10,000 free users, that is $60,000/year before a single paid conversion
- Conversion benchmarks: Consumer freemium: 1-5% free-to-paid. B2B freemium: 3-8% free-to-paid (higher because business users have budget and stronger ROI motivation)
- Design the free tier to create an "aha moment" (genuine value) but include a natural constraint that drives upgrade (storage limit, export limit, collaboration limit, branding removal)

**Hybrid (base + overage):**
- Structure: Monthly base fee covering a defined usage allowance, plus per-unit overage fee above the threshold
- Best for: Products with a core value proposition that all customers use plus variable consumption (cloud storage, email sending volume, API calls)
- Pricing design: The base fee should cover 80-90% of customers' typical usage. Overages should be priced at a per-unit rate approximately 20-30% higher than the effective per-unit rate within the base tier, to incentivize upgrading to the next tier rather than perpetually paying overage

**Outcome-based / success-fee pricing:**
- Structure: Price tied directly to a measurable customer outcome (% of revenue generated, % of cost saved, % of churn prevented)
- Rare but powerful when: The outcome is clearly measurable, the vendor has high confidence in delivery, and the customer's ROI is so strong that it justifies sharing upside
- Risk: Requires contractual clarity on how outcomes are measured. Can create misaligned incentives if the metric is gameable. Use only when the product's causal contribution to the outcome is undeniable

---

### Step 6: Build the Pricing Recommendation

With all three analytical dimensions complete, synthesize into a specific, justified recommendation.

- **State the recommended price point or structure explicitly:** Do not hedge with "somewhere between $X and $Y." Give a specific recommended price and a specific rationale. The user can move from there -- but they need an anchor
- **Map the recommendation to the three-way range:** Show explicitly: cost floor is $X, recommended price is $Y (positioned at Z% above floor), value ceiling is $W. The gap between recommended price and value ceiling is the "headroom" available for future price increases or premium tier creation
- **Calculate margin at the recommended price:** Gross margin = (Price -- Variable Cost per Unit) ÷ Price. State this as a percentage and compare to the category benchmark (70-85% for SaaS, etc.)
- **Identify the key pricing risk:** Every pricing recommendation carries a primary risk. Name it: conversion risk (price may be too high to convert self-serve), churn risk (price increase may trigger non-renewal), margin risk (price may be too low to fund growth), or competitive risk (a competitor may undercut)
- **Address annual vs. monthly pricing:** Standard SaaS practice is to offer a 15-20% discount for annual upfront payment. This improves cash flow, reduces churn (annual contracts have 3-5x lower churn rates than monthly), and locks in customer commitment. Always model both
- **Define the "do not go below" floor:** Especially important for sales-assisted pricing. The published price is an anchor; discounting is expected in enterprise sales. Define the maximum discount floor (typically 20-40% off list for enterprise), below which margin becomes unsustainable or the product is devalued

---

### Step 7: Design Tier Structure (When Recommending Tiered Pricing)

Tier design is where pricing strategy becomes pricing architecture. Poor tier design costs as much revenue as poor price points.

- **Name tiers after outcomes, not superlatives:** "Starter / Growth / Scale" or "Individual / Team / Business" outperform "Basic / Pro / Enterprise" because they tell the buyer which tier is for them, not how good the tier is. Never use Good/Better/Best as actual names
- **The three-tier default:** Three tiers is the cognitive default. Two tiers forces a binary choice; four+ tiers creates paralysis. If a fourth tier is needed (usually for enterprise/custom), present it differently (no price listed, "Contact Sales" CTA) to avoid contaminating the self-serve decision
- **Fences must be natural, not arbitrary:** A feature fence should map to a real capability the customer needs as they grow. Storage limits, team member counts, project counts, and integration access are natural fences. Removing a feature from the free/low tier that everyone needs (like CSV export or API access) creates resentment, not upgrades
- **The price anchoring effect:** Present tiers in order from highest to lowest (right to left on a pricing page). The first tier seen sets the anchor -- subsequent tiers look cheaper by comparison. If presenting in a recommendation, always state this ordering explicitly
- **Middle-tier engineering:** The middle tier (typically the "Most Popular" tier) should satisfy 50-60% of your target customers. If fewer than 30% would naturally land on the middle tier, the tiers are misaligned with actual customer segmentation
- **Upgrade paths must be frictionless:** Every tier should have one clear, compelling reason to upgrade to the next tier that aligns with growth (more users, more data, more automation). If the upgrade trigger is not obvious, the tier fence is too subtle

---

### Step 8: Build the Implementation and Testing Plan

A pricing strategy without a rollout plan is incomplete. Pricing changes affect sales, customer success, finance, and marketing simultaneously.

- **Timing:** Pricing changes are easiest at natural renewal cycles (annual contract renewals) or product launches. Avoid mid-contract increases for existing customers except in extraordinary circumstances (inflation clauses, usage spike overages)
- **Grandfathering decisions:** Locking existing customers to old pricing protects NPS and reduces churn risk but creates a split customer base with different economics. Standard practice: grandfather existing customers for 12-24 months, then migrate with 30-60 days notice and a clear rationale (added features, improved infrastructure). Never grandfather indefinitely
- **A/B testing pricing:** For self-serve products, run price tests on new cohorts only (never show two prices to the same customer in the same session -- this is deceptive). Test one variable at a time: price point, tier structure, annual discount percentage, or free trial length. Run tests for at least 4-6 weeks to capture full conversion cycles
- **Soft launch / beta pricing:** Offer early customers a discounted "founding price" with a clear sunset date. This generates early revenue, creates urgency, and provides conversion data before public launch. Typical founding discount: 30-50% below planned launch price, capped at first 50-100 customers
- **Sales team enablement:** If pricing is sales-assisted, document: the price list, the discount matrix (who can approve what discount level), the approved competitive response (what to say/offer when a prospect mentions a specific competitor), and the handling for "your price is too high" objections

---

## Output Format

```
## Pricing Strategy: [Product/Service Name]

### Pricing Context
- **Product type:** [SaaS / Physical Product / Professional Service / Marketplace / API]
- **Pricing model evaluated:** [Subscription / Usage-based / Per-seat / Freemium / One-time / Hybrid]
- **Target segment:** [Consumer / SMB / Mid-market / Enterprise]
- **Sales motion:** [Self-serve / Sales-assisted / Enterprise contract]
- **Business goal:** [Penetrate market / Maximize margin / Maximize revenue / Move upmarket]
- **Current pricing (if any):** [Existing price and identified problem with it]

---

### Analysis Framework

#### 1. Cost-Plus Analysis (Price Floor)
| Cost Component | Per Unit/Month | Notes |
|---------------|---------------|-------|
| Infrastructure / hosting | $[X] | [e.g., AWS cost per active user] |
| Third-party APIs / services | $[X] | [e.g., Stripe, Twilio, OpenAI per unit] |
| Payment processing | $[X] | [2.9% + $0.30 per transaction] |
| Customer support allocation | $[X] | [support hours × blended rate ÷ customers] |
| Allocated G&A overhead | $[X] | [overhead ÷ projected unit volume] |
| **Total variable cost per unit** | **$[X]** | |
| Target gross margin ([X]%) | -- | [Benchmark for category: SaaS 70-85%] |
| **Cost-plus price (floor)** | **$[X]** | = Total cost ÷ (1 -- target margin%) |

**Cash-basis floor (excluding amortization):** $[X]
**Key cost risk:** [What cost is most uncertain or likely to increase?]

---

#### 2. Value-Based Analysis (Price Ceiling)
| Value Dimension | Calculation | Annual Value |
|----------------|-------------|-------------|
| Labor cost replaced or saved | [X] hrs/wk × $[Y]/hr × 52 | $[Z]/year |
| Tool/subscription costs replaced | [Tool 1] + [Tool 2] | $[Z]/year |
| Revenue uplift enabled | [Metric] × [% improvement] × [$ per unit] | $[Z]/year |
| Risk/compliance cost avoided | [Risk event] × [probability] | $[Z]/year |
| **Total Economic Value to Customer (EVC)** | | **$[Z]/year** |
| Value capture rate | [10-30% typical; justify if higher] | [X]% |
| **Value-based price (ceiling)** | EVC × capture rate | **$[Z]/year ($[Z]/mo)** |

**Willingness-to-pay research available:** [Yes -- source/method / No -- interview-based estimate]
**Reality check:** [Is the value-based ceiling within 3-5x of competitive market prices? Y/N -- explain]

---

#### 3. Competitive Landscape
| Competitor | Plan Name | Price | Model | Key Differentiators vs. Us |
|-----------|-----------|-------|-------|---------------------------|
| [Comp 1] | [Plan] | $[X]/mo | [per-seat/flat/usage] | [What they do better/worse] |
| [Comp 2] | [Plan] | $[X]/mo | [per-seat/flat/usage] | [What they do better/worse] |
| [Comp 3] | [Plan] | $[X]/mo | [per-seat/flat/usage] | [What they do better/worse] |
| [Adjacent tool being replaced] | [Plan] | $[X]/mo | [model] | [Why customers use this instead] |

**Competitive position of recommended price:**
- vs. cheapest competitor: [X]% [above / below]
- vs. market median: [X]% [above / below]
- Positioning rationale: [Why this positioning is defensible -- what differentiation justifies the premium or why discounting is strategic]

---

### Recommended Pricing

#### Selected Pricing Model: [Model Name]
**Rationale:** [2-3 sentences explaining why this model fits the product, customer segment, and business goal better than alternatives evaluated]

#### Tier Structure (if tiered pricing)
| Tier Name | Monthly Price | Annual Price | Target Persona | Core Features | Upgrade Fence |
|-----------|--------------|-------------|---------------|---------------|---------------|
| [Tier 1 Name] | $[X]/mo | $[Y]/yr ([Z]% off) | [Who this is for] | [Feature set] | [What limits growth at this tier] |
| [Tier 2 Name] | $[X]/mo | $[Y]/yr ([Z]% off) | [Who this is for] | [Feature set] | [What limits growth at this tier] |
| [Tier 3 Name] | $[X]/mo | $[Y]/yr ([Z]% off) | [Who this is for] | [Feature set] | -- (top tier) |
| Enterprise | Custom | Custom | [Segment] | All features + [custom items] | -- |

**Anchoring note:** [Which tier is the target "most popular" tier and why the structure directs buyers there]

#### Price Positioning Summary
| Dimension | Value | Notes |
|-----------|-------|-------|
| Cost floor (cost-plus) | $[X]/mo | Minimum viable price |
| Recommended price (primary tier) | $[X]/mo | [X]% above cost floor |
| Value ceiling | $[X]/mo | Maximum defensible price |
| Gross margin at recommended price | [X]% | vs. [category] benchmark of [X-X]% |
| Annual contract equivalent | $[X]/yr | [X]% discount vs. monthly |

---

### Implementation Plan

#### Rollout Sequence
1. [Step 1 -- e.g., Internal alignment: sales, CS, finance sign-off on new pricing]
2. [Step 2 -- e.g., Update pricing page and billing system simultaneously]
3. [Step 3 -- e.g., Communicate to existing customers with [X]-day notice]
4. [Step 4 -- e.g., Grandfather existing customers for [X] months at current price]
5. [Step 5 -- e.g., Sales team briefed with objection-handling playbook]

#### Existing Customer Transition
- **Grandfathering period:** [X months at current price]
- **Migration path:** [How customers move from old to new pricing]
- **At-risk customers:** [Segment most likely to churn at new price and retention strategy]

#### Validation Approach
- **Test method:** [A/B test on new signups / cohort pricing / beta price with sunset date]
- **Test duration:** [Minimum X weeks to capture full conversion cycle]
- **Success metrics:** [Conversion rate, ARPU, tier mix, churn rate]
- **Decision threshold:** [What data would trigger a price adjustment]

---

### Risks and Mitigations
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| [Risk 1] | [H/M/L] | [H/M/L] | [Specific action] |
| [Risk 2] | [H/M/L] | [H/M/L] | [Specific action] |
| [Risk 3] | [H/M/L] | [H/M/L] | [Specific action] |
```

---

## Rules

1. **Never skip the cost floor.** If the user has no cost data, derive it from proxies -- team size, infrastructure provider pricing, industry benchmarks. A pricing recommendation without a cost floor could advise selling below cost. This is the single most common pricing mistake in early-stage companies.

2. **Value-based analysis must name a specific, quantified customer outcome.** "Our product saves time" is not a value-based analysis. "Our product saves a 10-person team 3 hours per week at a blended labor rate of $60/hour, creating $93,600/year in recovered capacity" is a value-based analysis. Never produce a value ceiling without showing the math.

3. **Competitive analysis must include the alternative of doing nothing.** The "do nothing" or "status quo" option is always a competitor. It has a price of $0 and a switching cost of $0. If the product cannot beat the value of the status quo plus the switching cost, no amount of competitive positioning will save the pricing strategy.

4. **Pricing model selection must be justified against at least two alternatives.** Do not simply recommend "tiered SaaS pricing" without explaining why usage-based or per-seat was evaluated and rejected. Pricing model choice has larger long-term revenue implications than the specific price point.

5. **Annual vs. monthly discounting must always be addressed for subscription products.** The standard 15-20% discount for annual upfront payment is not just a revenue tactic -- it is a churn reduction mechanism. Annual customers churn at 3-5x lower rates than monthly customers. The effective CAC on an annual contract is significantly lower. Always model both.

6. **Tier fences must be behavioral, not punitive.** A fence that takes away functionality the customer already uses (downgrading features on a free tier after adding them) destroys trust. The correct fence design limits capacity (how much) or access (which segment-appropriate capabilities), not core usability.

7. **Never recommend a price without an implementation plan.** A price is not a strategy -- it is a number. The strategy includes how it is communicated, when it takes effect, what happens to existing customers, and how it will be tested. Incomplete pricing work leads to customer churn, sales confusion, and metric disconnects.

8. **If the recommended price is more than 2x the cost floor, explain the margin compression risk.** High gross margins invite competitive entry. A product with 90% gross margins at $50/month is a target for a competitor to enter at $25/month and still be profitable. Margin this high should be accompanied by moat analysis (switching costs, network effects, proprietary data).

9. **Do not grandfather customers indefinitely.** Permanent grandfathering creates a two-tier customer base that distorts metrics (blended ARPU), creates sales compensation complexity, and sends the signal to new customers that if they wait, they can get the old price. State a specific migration timeline whenever a grandfather recommendation is made.

10. **Flag the pricing model fit for the customer's sales motion.** Usage-based pricing with complex metering does not work in a self-serve, low-touch motion unless the meter is crystal clear and predictable (no "bill shock"). Per-seat pricing does not work in enterprise deals without a minimum seat commitment. Mismatches between pricing model and sales motion cause sales cycle friction that no price point can fix.

11. **Freemium must pass a cost-of-free-users test.** Before recommending freemium, calculate: (estimated free users at steady state) × (cost to serve per free user per month) = monthly free-tier operating cost. Divide by expected free-to-paid conversion rate to get the effective acquisition cost via freemium. If this is higher than the product's other acquisition channels, freemium is destroying margin, not building pipeline.

12. **For physical products, pricing must include channel margin.** If a product sells through distributors, retailers, or resellers, the price to the end consumer must embed the channel margin (typically 30-50% retail markup, 15-30% distributor margin). A manufacturer pricing at $20 cost-plus targeting $40 MSRP through a retailer gets $28 wholesale -- not $40. Always model channel economics separately from direct pricing.

---

## Edge Cases

### Commodity or Near-Commodity Products with Many Competitors

When a product category has dozens of functionally similar competitors and no strong differentiation, value-based pricing's ceiling collapses toward the market price floor. Cost efficiency becomes the dominant variable.

- Conduct a rigorous cost-structure comparison vs. the lowest-cost competitor. If your COGS is higher, the strategy is either cost reduction or finding a defensible niche before pricing
- Look for micro-differentiation that enables a modest premium: service quality (speed, reliability), convenience (easier onboarding, better integrations), or brand trust in regulated industries
- Avoid racing to the bottom on price alone -- price cuts are matched immediately in commodity markets and result in margin destruction across the entire category
- Consider whether bundling (adding adjacent services), private labeling for specific verticals, or a platform strategy can escape commodity pricing dynamics
- If the analysis confirms true commodity status, the honest recommendation is a cost-leadership strategy with volume pricing, not a premium pricing strategy

### Novel Product with No Direct Competitors

When a product creates a new category, there are no competitive reference points. This is a pricing opportunity and a pricing challenge simultaneously.

- Anchor pricing to the cost of the alternative approach -- the manual process, the incumbent workaround, or the "hire someone to do this" cost. This gives buyers a reference frame
- Avoid underpricing novel products out of fear. First-mover pricing signals the category's value to subsequent entrants. If you price at $29/month, every competitor entering after you will price at $19-39/month. If you price at $199/month, the competitive floor is higher
- Consider an anchored launch strategy: publish a higher price, offer a founding-member discount for early adopters, and use the "founding price" framing to create urgency without permanently cheapening the product
- Plan for a price increase 12-18 months after launch as the product matures and the value proposition is proven. Novel products are often underpriced at launch; the data from early customers should inform a structured price increase
- If Van Westendorp or Gabor-Granger research is possible before launch (even with 20-30 beta users), run it. For a novel product, any empirical willingness-to-pay data is more valuable than theoretical EVC modeling

### Two-Sided Marketplace Pricing

Marketplaces must price both supply and demand sides. Standard single-product pricing analysis does not apply directly.

- Identify the "scarce side" -- the side that is harder to attract and retain. In a freelance marketplace, that is typically high-quality supply (skilled freelancers). The scarce side gets subsidized pricing or free access to build liquidity
- The take rate (% of transaction value charged to one or both sides) is the primary pricing lever. Typical marketplace take rates: food delivery 15-30%, staffing/freelance 10-20%, physical goods 3-15%, SaaS marketplace 15-30%
- Split the take rate between buyer and seller based on price sensitivity. Sellers (supply) are typically less price-sensitive on a per-transaction basis because they care about volume. Buyers are often more price-sensitive but less visible to competitors. A common structure: 0% buyer fee, 15-20% seller fee
- Calculate combined unit economics: (GMV per transaction × take rate) -- (cost to service transaction) = contribution per transaction. Model at realistic GMV per transaction for the category
- Liquidity is more important than margin in early-stage marketplace pricing. Consider zero take rate for the first 6-12 months to build transaction volume, then introduce fees once supply and demand have a habit of transacting on the platform

### Enterprise Pricing with Procurement and Legal Involvement

Enterprise deals ($50K+ ACV) do not convert from a pricing page. They require a different architecture entirely.

- Publish a price list as an anchor (even if every deal is negotiated). The published list price should be set 30-40% above the expected negotiated price to give procurement something to "win" during negotiation
- Build a documented discount authority matrix: Sales rep can approve up to 10% discount; Sales manager up to 20%; VP Sales up to 30%; CEO approval required above 30%. Without this matrix, every enterprise deal gravitates toward maximum discount
- Define standard deal terms that enable pricing consistency: payment terms (net 30 is standard), multi-year discount structure (5-10% for 2-year, 10-15% for 3-year), volume tiers (price per seat decreases at 50, 100, 250, 500+ seats), and professional services packaging
- Never provide pricing before understanding the customer's budget range and decision timeline. Enterprise buyers who are not in active procurement will use your pricing to benchmark competitors or to internally justify doing nothing
- Identify economic buyer vs. technical buyer vs. champion early. The economic buyer's priority is ROI and risk; price the proposal in their language (payback period, cost per outcome) not in your language (features and seats)

### Repricing an Existing Product with an Installed Base

Raising prices on existing customers is the highest-risk pricing action. It requires more care than launching new pricing.

- Segment the existing customer base before any communication: identify customers who will immediately see the new pricing as fair (heavy users, clear ROI), customers who are borderline (moderate usage, price-sensitive), and customers who are at-risk (low usage, limited perceived value, churnable)
- For at-risk customers, proactively reach out before announcing the price increase -- not to offer discounts, but to re-establish value. Customer success should demonstrate usage and outcomes data before pricing conversations happen
- The announcement must lead with what has improved, not with the new price. "We've added X, Y, and Z since you signed up -- here is how to get the most from them. As part of this investment, pricing is changing on [date]" outperforms "We are increasing prices."
- Grandfather strategically: offer the old price for 12 months with a clear end date. Unclear grandfathering ("as long as you stay on your current plan") creates indefinite price freezes that become operational liabilities
- Build a churn projection before announcing: estimate what percentage of each segment will churn, multiply by their ARPU, and compare to the revenue gain from successful migrations. A price increase that nets negative revenue because of churn is not a price increase -- it is a revenue reduction with extra friction

### Pricing for Developer / API Products

Developer pricing has unique characteristics that break standard B2B SaaS frameworks.

- Developers evaluate pricing with high precision: they will calculate the exact cost of their use case before committing. Usage-based pricing must be completely transparent with a pricing calculator on the documentation page
- Free tiers are nearly mandatory for developer tools -- developers will not adopt a paid product they cannot test for free at zero commitment. Design the free tier to be genuinely useful for development and testing, but constrain it at the scale that matters for production (rate limits, monthly call volume, storage)
- Credit-based pricing (pre-purchased credits) works well for AI/ML APIs because it turns variable usage cost into predictable spend for the developer's employer, while preserving usage-based economics for the vendor. Typical credit shelf life: 12 months
- Pricing page documentation should include a worked example for the top 3 use cases with estimated monthly cost. Ambiguity in API pricing is the top reason developers choose a competitor -- even if the competitor is more expensive, certainty is valued
- Enterprise procurement for developer tools often comes through a "land and expand" motion: an individual developer adopts the free tier, builds a production application, usage scales, and then the finance team is brought in to formalize the relationship. Design the self-serve to enterprise handoff (usage alerts, account executive outreach trigger at a usage threshold) explicitly

---

## Example

**Input:** "We're building a B2B SaaS product that automates contract review for in-house legal teams at mid-market companies (200-2,000 employees). It uses AI to flag risky clauses, suggest standard alternatives, and track contract obligations. Right now we have 12 beta customers paying $500/month flat. Our infrastructure costs are about $800/month total across all 12 customers. We don't have a clear sense if $500 is right -- some customers seem to love it and some seem lukewarm. Competitors include Ironclad (enterprise, $2K-10K/month+), ContractPodAi (enterprise, similar), and some lighter tools like Juro ($200-400/month per user) and SpotDraft ($300-600/month). Our differentiator is the AI clause analysis and obligation tracking -- we think this is significantly better than alternatives."

---

**Output:**

## Pricing Strategy: Contract Review AI -- B2B SaaS for In-House Legal Teams

### Pricing Context
- **Product type:** B2B SaaS -- AI-assisted legal workflow
- **Pricing model currently in use:** Flat-rate subscription ($500/month)
- **Target segment:** Mid-market legal teams (200-2,000 employee companies)
- **Sales motion:** Sales-assisted (legal buyers require demos and trust-building; self-serve is unlikely)
- **Business goal:** Move from beta pricing to a defensible, growth-ready pricing structure that captures more value from high-ROI customers while converting lukewarm accounts
- **Current pricing problem:** $500/month flat-rate does not differentiate by usage, team size, or contract volume -- heavy users generating 10x the value pay the same as light users, creating both underpricing and perceived overpricing simultaneously

---

### Analysis Framework

#### 1. Cost-Plus Analysis (Price Floor)

| Cost Component | Per Customer/Month | Notes |
|---------------|-------------------|-------|
| AI inference (LLM API calls per contract reviewed) | $18 | ~60 contracts/month per customer × $0.30/contract at current model pricing |
| Cloud infrastructure (storage, compute) | $8 | $0.067 per GB × avg storage + compute allocation |
| Third-party integrations (DocuSign, Salesforce connectors) | $4 | API licensing proportioned per account |
| Payment processing | $15 | 2.9% on $500 = $14.50 rounded |
| Customer success allocation | $45 | 1 CSM at $90K/year managing 20 accounts |
| Engineering / bug support allocation | $20 | Allocated from engineering headcount |
| **Total variable cost per customer** | **$110/month** | |
| Target gross margin (75% SaaS benchmark) | -- | Minimum defensible for SaaS at this stage |
| **Cost-plus price (floor)** | **$440/month** | = $110 ÷ (1 -- 0.75) |

**Cash-basis floor (excluding deferred R&D):** ~$320/month
**Key cost risk:** AI inference costs are the most volatile component -- as contract review volume scales per customer, inference costs scale proportionally. Current pricing does not meter this exposure.

**Observation:** Current $500/month barely exceeds the cost-plus floor of $440/month. At 75% target gross margin, the product is generating only ~12% gross margin per account. This confirms underpricing is a structural problem, not a perception problem.

---

#### 2. Value-Based Analysis (Price Ceiling)

| Value Dimension | Calculation | Annual Value |
|----------------|-------------|-------------|
| Outside counsel review replaced | 2 hrs/contract × $400/hr × 60 contracts/month × 12 months | $576,000/year |
| Capture rate realistic (external counsel is not fully replaced) | 20% displacement assumption | $115,200/year |
| In-house paralegal time saved | 1 hr/contract × $75/hr blended rate × 60 contracts/mo × 12 mo | $54,000/year |
| Risk exposure reduced (1 bad clause caught avoids avg $25K dispute) | 2 flagged/month × 12 × $25K × 10% probability of dispute | $60,000/year |
| Obligation tracking -- missed deadline prevention | 1 missed obligation per quarter × $15K avg remediation | $60,000/year |
| **Total EVC (economic value to customer)** | | **~$289,200/year** |
| Value capture rate (15% -- legal buyers are cost-conscious, procurement scrutiny high) | | 15% |
| **Value-based price (ceiling)** | | **~$43,380/year ($3,615/month)** |

**Adjusted for segment size (200-2,000 employees):** Larger companies in the range (1,000+ employees) with 150+ contracts/month can sustain $4,000-6,000/month. Smaller companies at the low end (200 employees, 20 contracts/month) have a more defensible ceiling of $1,500-2,000/month.

**Reality check:** Value ceiling of $3,615/month is well within the competitive range (Ironclad starts at $2,000/month, enterprise tools at $10,000+). This ceiling is realistic. The current $500/month flat rate is capturing only 13% of the value ceiling -- significant headroom exists.

---

#### 3. Competitive Landscape

| Competitor | Plan | Price | Model | Key Differentiators vs. Us |
|-----------|------|-------|-------|---------------------------|
| Ironclad | Base platform | $2,000-4,000/mo | Platform + modules | Full CLM (contract lifecycle); no AI clause risk scoring; enterprise only; 6-month implementation |
| ContractPodAi | Enterprise | $3,000-8,000/mo | Per-seat enterprise | Full CLM + AI; complex; overkill for mid-market; 9-12 month deployment |
| Juro | Team | $200-400/user/mo | Per-seat | Contract creation focused, not review focused; no AI risk analysis; lighter tool |
| SpotDraft | Business | $300-600/mo flat | Flat-rate | Good contract management; AI review less sophisticated; newer market entrant |
| Manual process (outside counsel) | -- | $400-600/hr outside counsel | N/A | Full legal judgment but 10-100x more expensive for volume review |

**Competitive position of recommended pricing:**
- vs. enterprise CLMs (Ironclad, ContractPodAi): Positioned as accessible mid-market alternative at 40-60% of their entry price with faster time-to-value (days vs. months)
- vs. lighter tools (Juro, SpotDraft): Positioned as AI-quality premium, differentiated on clause risk analysis and obligation tracking
- Pricing gap identified: No strong competitor owns the $1,000-2,500/month mid-market legal AI contract review space. This is the target positioning zone.

---

### Recommended Pricing

#### Selected Pricing Model: Tiered Subscription -- Per-Account with Contract Volume Fencing

**Rationale:** Per-seat pricing (used by Juro) is inappropriate because legal teams have 1-5 users but review volume varies 5-10x across companies of the same size. A flat per-seat model would leave revenue on the table from high-volume accounts. Usage-based (per contract reviewed) creates budget unpredictability that legal buyers -- who manage tightly budgeted departments -- will reject. A tiered subscription model with contract volume as the primary fence aligns payment with the value driver (volume of contracts reviewed), provides predictability for the customer, and allows ARPU to scale naturally as companies grow into higher tiers.

---

#### Tier Structure

| Tier Name | Monthly Price | Annual Price | Target Persona | Core Features | Upgrade Fence |
|-----------|--------------|-------------|---------------|---------------|---------------|
| **Essentials** | $900/mo | $9,180/yr (15% off) | In-house counsel at 200-500 employee company; 10-30 contracts/month | AI clause flagging, 5 risk categories, obligation tracker, up to 30 contracts/month, 2 user seats | Contract volume: 30/month; seat limit: 2 |
| **Professional** | $2,000/mo | $20,400/yr (15% off) | Legal team of 2-5 at 500-1,500 employee company; 30-100 contracts/month | All Essentials + custom clause library, redline suggestions, Salesforce/DocuSign integration, 100 contracts/month, 5 user seats, priority support | Contract volume: 100/month; seat limit: 5; no custom playbook |
| **Scale** | $3,800/mo | $38,760/yr (15% off) | Legal team of 5-10 at 1,000-2,000 employee company; 100-300 contracts/month | All Professional + custom AI playbook training, obligation workflow automation, unlimited contracts, 15 seats, dedicated CSM, API access | No contract volume cap; custom playbook build-out |
| **Enterprise** | Custom | Custom | 2,000+ employees, complex multi-entity structure | All Scale + multi-entity, custom SLA, legal hold, SSO, custom implementation | -- |

**Anchoring strategy:** Present tiers right to left (Scale → Professional → Essentials) on the pricing page and in sales decks. The $3,800 Scale anchor makes Professional at $2,000 look like strong value. The "Most Popular" badge should be placed on Professional -- it is the target tier for the majority of the addressable market.

---

#### Price Positioning Summary

| Dimension | Value | Notes |
|-----------|-------|-------|
| Cost floor (cost-plus, 75% GM) | $440/month | Current pricing barely clears this |
| Recommended entry price (Essentials) | $900/month | 105% above cost floor; defensible for small accounts |
| Recommended core price (Professional) | $2,000/month | Primary revenue driver; 4.5x cost floor; strong margin |
| Value ceiling (mid-market avg) | $3,615/month | Professional tier captures 55% of EVC -- highly defensible |
| Gross margin -- Essentials | 88% | ($900 -- $110) ÷ $900 |
| Gross margin -- Professional | 94% | ($2,000 -- $110) ÷ $2,000 |
| Annual contract discount | 15% | Standard SaaS; improves cash position and reduces churn |

**Note on current beta customers at $500/month:** At the new pricing
