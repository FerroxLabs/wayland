---
name: unit-economics
description: |
  Calculates unit economics for a business including customer acquisition cost (CAC), lifetime value (LTV), LTV/CAC ratio, payback period, and gross margin per unit. Use when the user asks about unit economics, CAC, LTV, customer lifetime value, payback period, or cost per acquisition.
  Do NOT use for full financial modeling (use financial-model-structure), personal finance calculations, or investment analysis.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "analysis strategy planning entrepreneurship spreadsheets"
  category: "business-strategy"
  subcategory: "finance-accounting"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Unit Economics

## When to Use

**Use this skill when:**
- User asks to calculate, audit, or pressure-test unit economics for an existing or planned business
- User wants to compute CAC, LTV, LTV/CAC ratio, CAC payback period, or gross margin per unit from raw inputs
- User needs to present unit economics to investors, a board, or an acquirer and wants the numbers framed correctly
- User is trying to decide whether to increase or decrease customer acquisition spend and needs an economic framework to guide that decision
- User wants to identify which operational lever -- churn reduction, ARPU expansion, or CAC reduction -- will most efficiently improve their unit economics
- User has received investor feedback that their unit economics are weak and wants to understand what needs to change
- User is comparing unit economics across cohorts, channels, or customer segments to identify where the business is most and least profitable
- User is modeling what unit economics need to look like for a business to be sustainable (target-state modeling for pre-revenue businesses)

**Do NOT use this skill when:**
- User needs a full three-statement financial model with P&L, balance sheet, and cash flow projections -- use `financial-model-structure` instead
- User is asking about personal budgeting, personal loan calculations, or household finance -- use `budget-planning` instead
- User needs a full pricing strategy analysis (price elasticity, competitive pricing, price anchoring) -- use `pricing-strategy` instead
- User needs revenue or ARR forecasting by cohort over multiple periods -- use `revenue-forecasting` instead
- User is asking about portfolio-level investment analysis, IRR, or MOIC -- use investment analysis skills instead
- User is asking about corporate finance topics like WACC, DCF valuation, or capital structure -- those are valuation skills, not unit economics
- User wants a full competitive market analysis -- unit economics is one input into competitive analysis, not a substitute for it
- User only wants a definition of terms with no actual calculation -- answer directly without invoking this skill's full process

---

## Process

### Step 1: Define the Business Model and the Unit

Before any number is calculated, establish what the "unit" is. This is the most commonly skipped step and the most consequential.

- **SaaS / subscription (B2B or B2C):** The unit is one customer account. For multi-seat or usage-based SaaS, distinguish whether you are measuring at the seat level, the account level, or the dollar of ARR. Account-level is standard unless the user has a strong reason otherwise.
- **E-commerce (transactional or DTC):** Two valid unit definitions exist. Per-order unit economics measures the economics of a single purchase (useful for contribution margin analysis). Per-customer unit economics aggregates all purchases from one customer over their lifetime (useful for acquisition economics). Clarify with the user which is needed. Often both are required.
- **Marketplace:** Define economics for both the demand side (buyers) and supply side (sellers/providers) separately. The unit on each side is one active participant -- "active" defined by the platform's own engagement threshold (e.g., one purchase per quarter for buyers, one listing accepted per month for sellers).
- **Consumer app or social platform:** The unit is one monthly active user (MAU) or daily active user (DAU), depending on the monetization model. For ad-supported apps, revenue is derived from impressions or clicks per user per period, not from a subscription fee.
- **Services / agency / consulting:** The unit is one client engagement or one retained client. Revenue is typically project-based or retainer-based. LTV is bounded by average contract length, which is usually shorter and more predictable than subscription churn.
- **Hardware + software (bundled):** The unit is one device sold, but LTV must include the recurring software or consumable revenue stream attached to the device. CAC must include any dealer or distributor costs embedded in the channel.
- **Physical retail (single location or chain):** The unit is one store-visit transaction or one loyalty customer, depending on what the user is optimizing. Transaction-level economics is closer to contribution margin analysis; customer-level is true unit economics.

**Confirm the unit definition explicitly in your output.** If the user's description is ambiguous, ask one clarifying question before proceeding.

---

### Step 2: Gather and Organize Raw Inputs

Prompt the user for the following data, grouped by what is needed for each calculation. Accept whatever subset they can provide and calculate what is possible with available data.

**For CAC:**
- Total sales and marketing spend (all-in: ad spend, agency fees, sales salaries, commissions, tools, events, content production)
- Number of new customers acquired in the same period
- Whether they have spend broken out by channel (organic search, paid search, paid social, referral, outbound/SDR, partnerships, events)
- Whether the sales team cost is fully loaded (salary + benefits + equity dilution equivalent + tools + allocated management)

**For LTV:**
- Average Revenue Per User/Account (ARPU) or Average Revenue Per Customer per period
- Monthly (or annual) churn rate, or average customer lifespan if they track it directly
- Direct cost per customer per period (hosting, payment processing, direct customer support labor, COGS for physical goods)
- Whether there is significant expansion revenue (upsells, seat additions, usage overages) -- this materially changes LTV

**For Gross Margin:**
- Revenue per unit (one order, one customer-month, one transaction)
- Direct variable costs per unit (infrastructure, payment fees, fulfillment, returns/refunds, direct labor)
- Distinguish clearly: gross margin excludes sales, marketing, G&A, and R&D. Those belong below gross margin in the income statement.

**For Payback Period:**
- CAC (calculated above)
- Monthly gross profit per customer (ARPU x Gross Margin %)

If churn data is unavailable, ask for average contract length or average customer tenure. If ARPU is unavailable, ask for total revenue and total active customers in the same period. If gross margin percentage is unavailable, ask for revenue and the line items the user considers "cost of goods sold."

---

### Step 3: Calculate Customer Acquisition Cost (CAC)

**Blended CAC formula:**

```
CAC = Total Sales & Marketing Spend (period) / New Customers Acquired (same period)
```

Critical inclusions in the numerator:
- All paid advertising (search, social, display, retargeting, podcast, TV/radio if applicable)
- Sales team fully loaded cost: base salary + variable compensation + payroll taxes + benefits + equity (use Black-Scholes value or FMV if available, otherwise exclude with a note) + sales tools (CRM, sequencing tools, data enrichment) + travel and entertainment
- Marketing team fully loaded cost (same fully loaded methodology)
- Agency or contractor fees for marketing execution
- Content production (photography, video, copywriting) amortized over its useful life
- Events and trade shows (net of any revenue from event sponsorships)
- Referral and affiliate payouts (these are acquisition costs)
- PR and communications costs (if the primary objective is awareness/acquisition)

Critical exclusions from the numerator:
- Customer success, onboarding, and account management costs (these are retention costs, not acquisition costs -- some analysts allocate a portion to CAC, which is defensible but must be disclosed)
- Product development and engineering (never CAC)
- G&A and finance overhead (never CAC)
- Costs to re-acquire or upsell existing customers (separate metric -- retention and expansion efficiency)

**New-to-paid CAC vs. new-to-free CAC:**
For freemium or free-trial models, calculate both:
- New-to-free CAC = Total S&M Spend / All new signups (including free users)
- New-to-paid CAC (effective CAC) = Total S&M Spend / Paid conversions only

**Channel-level CAC:**
If channel data is available, calculate CAC for each channel separately. This is the most actionable version of CAC for operators because it reveals where to reallocate budget. Common channels:

| Channel | Typical CAC characteristic |
|---|---|
| Organic/SEO | Low direct cost, high content/time investment; low marginal CAC |
| Paid search (SEM) | Medium CAC, highly measurable, scales but CPCs rise with competition |
| Paid social (Meta, TikTok, LinkedIn) | CAC highly variable by audience; LinkedIn CAC often 5-10x Meta for B2B |
| Referral/word-of-mouth | Often the lowest CAC channel but hard to scale intentionally |
| Outbound SDR/BDR | High fully loaded cost per lead; best for high-ACV B2B deals |
| Partner/channel sales | CAC lower on paper but partner margin and co-marketing costs must be included |
| Product-led growth (PLG) | Lowest CAC when working; measure carefully to avoid under-attributing S&M costs |

**Attribution caveat:** Multi-touch attribution means some customers were influenced by multiple channels. Be explicit about whether the user is using first-touch, last-touch, or multi-touch attribution, as this changes channel-level CAC significantly.

---

### Step 4: Calculate Lifetime Value (LTV)

Choose the LTV formula that best matches the available data and business model. Always state which formula is being used and why.

**Formula 1 -- Simple LTV (subscription with steady-state churn):**
```
LTV = (ARPU × Gross Margin %) / Monthly Churn Rate
```
Use when: Monthly churn rate is relatively stable, no significant expansion revenue, business has been operating long enough to have representative churn data (at least 6 months).

**Formula 2 -- LTV with expansion revenue (SaaS with net revenue retention above 100%):**
```
LTV = (ARPU × Gross Margin %) / (Gross Churn Rate - Net Expansion Rate)
```
If Net Revenue Retention (NRR) > 100%, the denominator becomes negative, implying theoretically infinite LTV. In this case, cap at a 5-year horizon and note that expanding cohorts make this a lower-bound estimate, not an upper bound.

**Formula 3 -- Cohort-based LTV (e-commerce, marketplace, non-subscription):**
```
LTV = Sum of (Gross Profit per order × Orders per customer) over observed cohort lifetime
```
This requires actual cohort data. Track a group of customers acquired in the same month and sum all gross profit generated by that cohort over their observed lifetime. Normalize by cohort size. This is the most accurate method but requires at least 12-24 months of transaction history.

**Formula 4 -- Average Order Value (AOV) based LTV (e-commerce without subscription):**
```
LTV = AOV × Purchase Frequency × Gross Margin % × Average Customer Lifespan (years)
```
Use when cohort data is not available. Requires estimates or historical averages for purchase frequency and lifespan. Less precise but directionally useful.

**Churn rate guidance:**
- Monthly churn rate = Customers lost in month / Customers at start of month
- Annual churn rate ≠ 12 × Monthly churn rate. The correct conversion: Annual Churn = 1 - (1 - Monthly Churn)^12
- Average customer lifespan = 1 / Monthly Churn Rate (in months)
- If churn rate is below 0.5% per month (6% annual), cap LTV at 60 months (5 years) to prevent absurdly large LTV numbers driven by tiny denominators. Disclose the cap.
- Distinguish gross churn (customers lost) from net revenue churn (revenue lost accounting for expansion). They tell different stories. Gross churn is for customer count LTV; net revenue churn is for revenue LTV.

**Expansion revenue treatment:**
If the business has meaningful upsell, cross-sell, or usage-based expansion:
- Calculate expansion revenue rate as % of ARR per month
- Subtract expansion rate from gross churn rate in the denominator (Formula 2 above)
- Examples: Snowflake (usage-based, NRR ~130%), Salesforce (seat expansion, NRR ~110%), HubSpot (tier upsell, NRR ~110%)

---

### Step 5: Calculate CAC Payback Period

**Formula:**
```
CAC Payback Period (months) = CAC / (ARPU × Gross Margin %)
```
This is the number of months of gross profit needed to recover the acquisition investment.

**Benchmarks by business type:**

| Business Type | Excellent | Good | Acceptable | Concerning |
|---|---|---|---|---|
| B2C SaaS / subscription | < 3 months | 3-6 months | 6-9 months | > 12 months |
| B2B SaaS (SMB) | < 6 months | 6-12 months | 12-18 months | > 18 months |
| B2B SaaS (Enterprise) | < 12 months | 12-18 months | 18-24 months | > 30 months |
| E-commerce (repeat purchase) | < 2 months | 2-4 months | 4-8 months | > 12 months |
| Marketplace | < 6 months | 6-12 months | 12-18 months | > 24 months |
| Consumer app (ad-supported) | < 3 months | 3-9 months | 9-12 months | > 18 months |

**Why payback period matters more than LTV/CAC in some contexts:**
LTV/CAC is a long-run efficiency ratio. CAC payback period is a cash flow and working capital metric. A business with LTV/CAC of 5 but a 30-month payback period needs to fund 30 months of operating losses per customer before breaking even on that customer. High-growth businesses that rely on debt or equity to fund growth must keep payback period short. For capital-efficient or bootstrapped businesses, payback period is often the binding constraint.

**Discounted LTV:**
For businesses with long payback periods, present a discounted LTV using a cost of capital rate (typically 10-15% for venture-backed companies). Discounted LTV = Sum of monthly gross profit per customer × discount factor for each month. This is more conservative and more accurate for comparing unit economics across businesses with different payback profiles.

---

### Step 6: Calculate Gross Margin per Unit

**Formula:**
```
Gross Margin per Unit = Revenue per Unit - Direct Costs per Unit
Gross Margin % = (Gross Margin per Unit / Revenue per Unit) × 100
```

**Direct cost inclusions by business type:**

| Business Type | Typical Direct Cost Components |
|---|---|
| SaaS | Cloud/hosting (AWS, GCP, Azure), payment processing (2.5-3.5% of revenue), CDN costs, third-party API costs embedded in product, direct customer support labor for onboarding |
| E-commerce | Product COGS, fulfillment and warehouse labor, shipping, packaging, payment processing, returns handling and restocking |
| Marketplace | Payment processing, fraud and trust & safety costs, direct customer support labor, escrow and payout costs |
| Consumer app | Hosting and infrastructure, content licensing costs (if any), payment processing for in-app purchases |
| Services | Direct labor (billable hours × fully loaded rate), direct materials, subcontractor costs |
| Hardware | Component costs, manufacturing labor, warranty reserve, import duties, shipping to customer |

**Gross margin benchmarks by sector:**

| Sector | Typical Range | Best-in-class |
|---|---|---|
| Pure SaaS | 70-80% | 85%+ (e.g., Veeva, Zoom) |
| B2B SaaS (with professional services) | 60-72% | 78%+ |
| E-commerce (branded DTC) | 40-60% | 65%+ |
| E-commerce (reseller/marketplace) | 20-40% | 50%+ |
| Marketplace (take-rate model) | 60-80% | 85%+ |
| Consumer subscription | 50-70% | 80%+ |
| Physical goods + SaaS bundle | 45-65% | 70%+ |
| Services / consulting | 30-55% | 60%+ |

Never calculate LTV from revenue alone without applying gross margin. LTV calculated from revenue is technically "revenue LTV" -- it overstates the true economics and is misleading in investor presentations. Always use gross profit in the LTV numerator.

---

### Step 7: Perform Sensitivity Analysis and Identify Levers

Sensitivity analysis converts unit economics from a snapshot into a decision tool. Run the following scenarios:

**Standard sensitivity grid (run all three):**
1. Churn reduction: Show LTV and LTV/CAC at current churn, current churn - 1 percentage point, and current churn - 2 percentage points
2. ARPU expansion: Show LTV and LTV/CAC at current ARPU, +10%, and +20%
3. CAC reduction: Show payback period and LTV/CAC at current CAC, -10%, and -20%

**Lever efficiency analysis:**
Calculate the percentage improvement in each input required to move LTV/CAC from its current value to 3.0 (if below) or to confirm it is already above 3.0. This tells the operator which lever requires the smallest relative change to reach a healthy state. Often, a 1% churn reduction has far more LTV impact than a 20% CAC reduction, but this varies significantly by current churn rate.

**Maximum viable CAC:**
Given current LTV, calculate the maximum CAC the business can sustain at different LTV/CAC targets:
- Max CAC at LTV/CAC = 3.0: LTV / 3
- Max CAC at LTV/CAC = 5.0: LTV / 5

This gives the go-to-market team a clear spending ceiling per customer acquired.

---

### Step 8: Synthesize and Provide Prioritized Recommendations

Do not end the analysis with just numbers. Provide a prioritized set of recommendations based on the analysis.

**Recommendation prioritization framework:**
- Identify which single metric (churn, ARPU, CAC) is furthest from benchmark and has the most LTV/CAC impact per unit of change
- Distinguish short-term levers (tactical, weeks to months to implement) from structural levers (strategic, months to quarters)
- If LTV/CAC < 1.0, the business cannot grow its way to health -- it needs to fix unit economics before scaling spend
- If LTV/CAC is 1.0 to 3.0, identify whether it is a churn problem, a monetization problem, or a CAC efficiency problem -- different root causes require different solutions
- If LTV/CAC > 5.0, check whether the business is under-investing in growth -- a ratio above 5-6 in a competitive market may indicate the company is leaving market share on the table
- Always recommend a monitoring cadence (monthly for early-stage, quarterly for mature businesses) and specific thresholds that should trigger a re-evaluation

---

## Output Format

```
## Unit Economics Analysis: [Business Name or Type]

### Unit Definition
- **Unit:** [one customer account / one order / one active buyer / one engaged user]
- **Business model:** [B2B SaaS / DTC e-commerce / marketplace / consumer subscription / services]
- **Analysis period:** [Month/Quarter/Year -- be specific]
- **LTV formula selected:** [Simple / Expansion-adjusted / Cohort-based / AOV-based -- with rationale]
- **Data confidence:** [High (12+ months actual data) / Medium (3-12 months) / Low (< 3 months or estimates)]

---

### Customer Acquisition Cost (CAC)

| Component | Period Spend | Notes |
|-----------|--------------|-------|
| Paid advertising (all channels) | $[X] | [Channel breakdown if available] |
| Sales team -- fully loaded | $[X] | [Headcount, base + variable + benefits + tools] |
| Marketing team -- fully loaded | $[X] | [Headcount] |
| Agency / contractor fees | $[X] | |
| Events and trade shows | $[X] | [Net of event revenue if applicable] |
| Referral / affiliate payouts | $[X] | |
| Other S&M costs | $[X] | [Specify] |
| **Total S&M Spend** | **$[X]** | |
| New customers acquired | [X] | [Paid only / all channels] |
| **Blended CAC** | **$[X]** | |

#### Channel-Level CAC (if data available)
| Channel | Spend | New Customers | CAC | % of Total Spend |
|---------|-------|---------------|-----|-----------------|
| Organic / SEO | $[X] | [X] | $[X] | [X]% |
| Paid search | $[X] | [X] | $[X] | [X]% |
| Paid social | $[X] | [X] | $[X] | [X]% |
| Outbound / SDR | $[X] | [X] | $[X] | [X]% |
| Referral / affiliate | $[X] | [X] | $[X] | [X]% |
| Partner / channel | $[X] | [X] | $[X] | [X]% |
| **Total / Blended** | **$[X]** | **[X]** | **$[X]** | 100% |

---

### Gross Margin per Unit

| Component | Per Customer / Per Period | Notes |
|-----------|--------------------------|-------|
| Revenue per unit (ARPU) | $[X]/mo | |
| Infrastructure / hosting | ($[X]/mo) | |
| Payment processing ([X]% of rev) | ($[X]/mo) | |
| Direct support labor | ($[X]/mo) | [If allocated per customer] |
| Other direct costs | ($[X]/mo) | [Specify] |
| **Gross Profit per Unit** | **$[X]/mo** | |
| **Gross Margin %** | **[X]%** | [Benchmark: X% for this sector] |

---

### Lifetime Value (LTV)

| Component | Value | Calculation |
|-----------|-------|-------------|
| ARPU | $[X]/mo | |
| Gross Margin % | [X]% | |
| Gross Profit per Customer/month | $[X]/mo | ARPU × GM% |
| Monthly Churn Rate | [X]% | |
| Average Customer Lifespan | [X] months | 1 / Churn Rate |
| Expansion Revenue Rate | [X]%/mo | [If applicable] |
| **LTV** | **$[X]** | Gross Profit / (Churn - Expansion Rate) |
| *LTV cap applied?* | *[Yes / No]* | *[Cap at 60 months if churn < 0.5%/mo]* |

---

### Key Metrics Summary

| Metric | Calculated Value | Benchmark for This Business Type | Assessment |
|--------|-----------------|----------------------------------|------------|
| **LTV** | $[X] | N/A | |
| **CAC (Blended)** | $[X] | N/A | |
| **LTV/CAC Ratio** | [X.X]x | 3.0x-5.0x | [Healthy / Below target / Above target] |
| **CAC Payback Period** | [X] months | [Sector benchmark] | [Assessment] |
| **Gross Margin %** | [X]% | [Sector range]% | [Above / At / Below benchmark] |
| **Max Viable CAC (at 3x LTV/CAC)** | $[X] | -- | [Headroom: $X above / below current CAC] |

---

### Sensitivity Analysis

#### Churn Impact on LTV and LTV/CAC
| Monthly Churn Rate | Avg Customer Lifespan | LTV | LTV/CAC | Payback (months) |
|--------------------|-----------------------|-----|---------|-----------------|
| [X-2]% | [Y] months | $[Z] | [R]x | [P] |
| [X-1]% | [Y] months | $[Z] | [R]x | [P] |
| **[X]% (current)** | **[Y] months** | **$[Z]** | **[R]x** | **[P]** |
| [X+1]% | [Y] months | $[Z] | [R]x | [P] |

#### ARPU Expansion Impact
| ARPU Scenario | LTV | LTV/CAC | Payback (months) |
|---------------|-----|---------|-----------------|
| Current ($[X]) | $[Z] | [R]x | [P] |
| +10% ($[X × 1.1]) | $[Z] | [R]x | [P] |
| +20% ($[X × 1.2]) | $[Z] | [R]x | [P] |

#### CAC Reduction Impact (LTV unchanged)
| CAC Scenario | LTV/CAC | Payback (months) |
|--------------|---------|-----------------|
| Current ($[X]) | [R]x | [P] |
| -10% ($[X × 0.9]) | [R]x | [P] |
| -20% ($[X × 0.8]) | [R]x | [P] |

---

### Lever Efficiency Summary
| Lever | Change Required to Reach LTV/CAC = 3.0x | Relative Difficulty |
|-------|----------------------------------------|---------------------|
| Reduce churn | [X]% reduction (from [A]% to [B]%) | [Low / Medium / High] |
| Increase ARPU | [X]% increase (from $[A] to $[B]) | [Low / Medium / High] |
| Reduce CAC | [X]% reduction (from $[A] to $[B]) | [Low / Medium / High] |

---

### Recommendations

**Priority 1 -- [Most impactful lever]:**
[2-4 sentences with specific, actionable guidance based on the numbers. Name the exact metric, the target to hit, and the approach to get there.]

**Priority 2 -- [Second lever]:**
[2-4 sentences with specific guidance.]

**Priority 3 -- Monitoring and thresholds:**
- Track these metrics: [list specific metrics] on a [monthly / quarterly] basis
- Alert threshold: Re-evaluate strategy if LTV/CAC drops below [X]x or payback exceeds [X] months
- Next milestone: [Specific target -- e.g., "Reach LTV/CAC of 3.0x by Q3 by reducing churn to 2%"]
```

---

## Rules

1. **Never calculate LTV from revenue without applying gross margin.** "Revenue LTV" is not LTV. Gross margin must be embedded in the LTV numerator. If a user presents LTV figures based on revenue, note the error, recalculate with gross margin, and explain the difference.

2. **Always specify the formula used for LTV and why it was selected.** There are at least four valid LTV formulas. Using the wrong one for the business model produces misleading results. A cohort-based LTV for a SaaS business with stable churn is unnecessary complexity; using a simple LTV formula for an e-commerce business with highly seasonal, non-stationary purchasing patterns is an error.

3. **Fully loaded costs are mandatory for CAC.** A CAC number that excludes sales team salaries, tools, or management overhead is materially understated and will mislead planning decisions. If the user resists including full costs, calculate both a "fully loaded CAC" and a "media-only CAC" and label them explicitly -- but never present the media-only version as the definitive CAC.

4. **Churn rate must be defined precisely before calculating LTV.** Gross churn, net revenue churn (net churn), logo churn, and seat churn are different metrics that produce dramatically different LTV values. A business with 5% gross churn but -5% net revenue churn (NRR of 105%) has an expanding revenue base per cohort -- the simple LTV formula will understate true LTV and must be replaced with an expansion-adjusted formula.

5. **Cap LTV at 60 months when monthly churn rate is below 0.5%.** Below this threshold, the 1/churn formula produces LTV values that are not economically meaningful and that no reasonable investor or operator should plan around. Apply the cap, disclose it clearly, and note that the actual LTV may be higher if the business sustains low churn long-term.

6. **Payback period benchmarks are business-model-specific and must not be applied generically.** An 18-month payback period is concerning for a B2C consumer app and acceptable for an enterprise SaaS business with 5-year contracts. Always pair the payback period number with the correct benchmark for the business type.

7. **LTV/CAC above 5.0x is not automatically positive.** In competitive markets, a ratio above 5-6x often signals under-investment in growth and may indicate the company is ceding market share. Present both the efficiency interpretation (strong unit economics) and the growth-investment interpretation (may be leaving growth on the table) and let the user decide.

8. **Channel-level CAC must reflect realistic attribution.** If the user attributes all customers to paid channels but has significant organic and direct traffic, blended CAC is more accurate than an inflated paid-channel CAC. Do not let the user present paid channel CAC as if it were total CAC without noting the attribution method.

9. **Do not present early-stage unit economics (fewer than 6 months of data) as statistically meaningful.** With small customer cohorts, a single churned enterprise customer can move monthly churn rate by multiple percentage points. Mark all numbers from thin datasets as "directional estimates" and recommend the time horizon at which the numbers will become reliable (typically 12+ months and 50+ customers for meaningful churn analysis).

10. **Negative unit economics require escalation, not dismissal.** When LTV/CAC < 1.0, do not conclude the business is unviable -- conclude that the business cannot scale at current economics. Calculate the minimum improvement in each lever required to reach break-even on a per-customer basis, and determine whether those improvements are operationally achievable. Many businesses that are unit-economics-negative at seed stage achieve healthy unit economics by Series B through scale-driven CAC reduction and product-driven churn improvement.

11. **Always separate blended CAC from channel CAC if channel-level data exists.** Blended CAC is a backward-looking performance metric. Channel CAC is a forward-looking budget allocation tool. Both are needed. The most common analytical mistake is optimizing blended CAC by cutting expensive channels without recognizing that those channels serve different customer segments with different LTV profiles.

12. **Expansion revenue changes everything -- always ask about it.** For SaaS businesses, net revenue retention (NRR) above 100% means each cohort generates more revenue over time, not less. This fundamentally changes LTV calculation and can turn a business with seemingly poor unit economics (based on initial ARPU and gross churn) into an extremely efficient one. Never omit the NRR / expansion revenue question for any B2B SaaS analysis.

---

## Edge Cases

### Pre-Revenue or Pre-Launch Business: Target Unit Economics Modeling
No actual data exists. Do not attempt to calculate unit economics from assumptions as if they were real -- label everything as a projection and build a target-state model.

- Ask the user for their target customer segment and intended pricing
- Source industry benchmarks for churn (e.g., B2B SaaS SMB: 2-4%/month; B2B SaaS Mid-Market: 1-2%/month; B2B SaaS Enterprise: 0.5-1%/month)
- Source gross margin benchmarks for their sector (see the gross margin benchmark table in Step 6)
- Calculate the maximum CAC the business can sustain at LTV/CAC = 3.0x given the assumed LTV
- Present this as: "For this business to meet investor-standard unit economics at 3x LTV/CAC, CAC must be below $X. This implies a maximum fully loaded S&M spend per acquired customer of $X."
- Clearly label: "Projection based on industry benchmarks. No actual customer data available."

### Marketplace with Two-Sided Economics
Calculate unit economics for each side separately, then present a combined view.

- **Demand side (buyers):** CAC includes all demand-generation spend. LTV is based on gross profit per buyer × purchase frequency × average lifespan.
- **Supply side (sellers/providers):** CAC includes outbound sales, onboarding costs, and supply-side marketing. LTV is based on take-rate revenue generated by that seller over their active lifespan.
- **Combined view:** Present a "combined unit economics" metric: (Buyer LTV + Seller LTV attributable to that buyer) / (Buyer CAC + allocated Seller CAC). Marketplaces often have lower CAC on one side and higher LTV on the other -- the analysis must capture both.
- Note that network effects create non-linear LTV: as the marketplace grows, individual buyer LTV increases because supply quality and availability improve. This is real but very difficult to quantify in early-stage analysis -- flag it as a qualitative upside factor rather than embedding it in the model.

### Freemium Model with Free-to-Paid Conversion
Freemium unit economics require careful cost allocation or CAC is severely understated.

- Calculate free user cost: (Total S&M spend + Product cost attributable to serving free users) / Total free signups = Cost per free signup
- Calculate effective paid CAC: Total S&M spend / Paid conversions. This is what matters for unit economics.
- The free tier has its own cost structure. If the average free user consumes $3/month in infrastructure and 25% convert in 6 months, the cost per eventual paid customer includes 6 × $3 = $18 of free-tier costs in addition to the S&M CAC.
- Present both metrics: effective CAC (S&M only) and fully-loaded CAC (including free tier costs). Investors typically accept effective CAC but appreciate visibility into the free-tier cost.

### SaaS Business with Negative Net Revenue Churn (NRR > 100%)
This is the most economically powerful scenario in SaaS and must not be handled with the simple LTV formula.

- Use the expansion-adjusted LTV formula: LTV = Gross Profit / (Gross Churn Rate - Monthly Expansion Rate)
- Example: Gross churn 3%/month, monthly expansion rate 4%/month → denominator = -1%. The denominator is negative, implying the cohort is growing, not shrinking.
- In this case, cap LTV at 60 months and calculate the actual cumulative gross profit of a cohort over 60 months using the monthly expansion and gross churn rates explicitly (build a month-by-month table).
- Report NRR as a headline metric alongside LTV/CAC: "NRR of 120% means the revenue base from existing customers grows 20% annually without any new customer acquisition." This context is critical for investors.

### Very High-ACV Enterprise Deals with Low Volume
Enterprise SaaS often has 3-10 new customers per quarter, not 20 per month. Standard CAC and payback formulas break down at this volume.

- Calculate CAC at the deal level, not the monthly-aggregate level: Total S&M spend in the quarter / Deals closed in the quarter. Note that the sales cycle for enterprise may span 2-4 quarters -- attribute S&M costs to the quarter deals are closed, not the quarter spend occurred, or use a rolling 4-quarter average spend in the numerator.
- Use annual contract value (ACV) instead of monthly ARPU for all calculations. Convert to monthly for payback period calculations.
- Include implementation and onboarding costs in CAC for enterprise deals -- they are often $10,000-$100,000 per deal and are economically part of the customer acquisition cost (the contract cannot be recognized until the customer is onboarded).
- LTV for enterprise is often better estimated using contract duration and renewal probability rather than churn rate, because enterprise customers often have 3-year contracts. LTV = ACV × Gross Margin % × Average Contract Duration × Renewal Rate.

### Deteriorating Unit Economics Across Cohorts
If the user has cohort data and unit economics are getting worse over time (newer cohorts churning faster or having lower LTV than older cohorts), this signals a structural problem that must be called out explicitly.

- Calculate LTV separately for cohorts from 6 months ago, 12 months ago, and 18+ months ago
- If LTV is declining across cohorts, identify potential causes: customer segment drift (acquiring lower-quality customers), product-market fit erosion, competitive pressure, or pricing changes
- Do NOT present the blended or trailing-average LTV as representative -- it will overstate the economics of current customer acquisition by mixing in older, higher-LTV cohorts
- Recommend the user track LTV-at-6-months as a leading indicator (rather than waiting 24 months to see full LTV) by benchmarking how much gross profit each cohort generates in its first 6 months and tracking whether that number is stable, improving, or deteriorating

### Negative Gross Margin per Unit
If direct costs exceed revenue on a per-unit basis (a common finding in early-stage hardware, delivery, and marketplace businesses), LTV becomes negative and the entire LTV/CAC framework breaks down.

- Do not attempt to calculate LTV/CAC. The business is subsidizing each customer -- acquiring more customers makes the problem worse, not better.
- Instead, calculate: (a) the break-even volume needed for infrastructure/hosting costs to fall below revenue through economies of scale, and (b) the price increase required to achieve positive unit margins at current cost structure.
- Frame the output as a "path to positive unit economics" analysis rather than a unit economics scorecard.
- This scenario is common and not automatically fatal -- AWS, Uber, and DoorDash all had negative unit margins at early stages -- but it must be clearly identified and a credible path to positive margins must exist.

---

## Example

**Input:** "We run a B2B SaaS company selling project management software to mid-market professional services firms (50-500 employees). We spend $12,000/month on Google Ads, $8,000/month on LinkedIn Ads, and we have 2 SDRs who cost us $6,500/month each fully loaded. We also spend $3,000/month on marketing tools (HubSpot, Clearbit, Gong). Last month we closed 15 new accounts. Our average account pays $450/month. Our hosting and infrastructure runs about $40/account/month and we use Stripe which charges us 2.7% per transaction. Our monthly churn is about 2.5%, but our expansion revenue from seat additions averages about 0.8% of ARR per month. We've been operating for about 18 months."

**Output:**

## Unit Economics Analysis: B2B SaaS -- Mid-Market Professional Services

### Unit Definition
- **Unit:** One customer account (company-level)
- **Business model:** B2B SaaS, subscription, mid-market (50-500 employee firms)
- **Analysis period:** Current monthly run rate (18 months operating history)
- **LTV formula selected:** Expansion-adjusted LTV (gross churn - monthly expansion rate) -- selected because expansion revenue of 0.8%/month is material and the simple formula would understate LTV
- **Data confidence:** High -- 18 months of operating data provides statistically meaningful churn and expansion rates

---

### Customer Acquisition Cost (CAC)

| Component | Monthly Spend | Notes |
|-----------|--------------|-------|
| Google Ads | $12,000 | Paid search |
| LinkedIn Ads | $8,000 | Paid social -- B2B targeting |
| SDR team (2 reps, fully loaded) | $13,000 | $6,500/rep × 2 (salary + benefits + tools) |
| Marketing tools (HubSpot, Clearbit, Gong) | $3,000 | CRM, enrichment, conversation intelligence |
| **Total S&M Spend** | **$36,000** | |
| New accounts closed | 15 | |
| **Blended CAC** | **$2,400** | $36,000 / 15 |

#### Channel-Level CAC (Estimated Attribution)
| Channel | Spend | New Customers | CAC | % of Total Spend |
|---------|-------|---------------|-----|-----------------|
| Google Ads | $12,000 | ~6 | ~$2,000 | 33% |
| LinkedIn Ads | $8,000 | ~3 | ~$2,667 | 22% |
| Outbound SDR | $13,000 | ~5 | ~$2,600 | 36% |
| Inbound (HubSpot/tools-driven) | $3,000 | ~1 | ~$3,000 | 8% |
| **Total / Blended** | **$36,000** | **15** | **$2,400** | 100% |

*Note: Channel attribution is estimated based on your spend breakdown. First-touch or last-touch attribution would change these numbers. Google Ads currently has the best cost efficiency at ~$2,000 CAC vs. LinkedIn at ~$2,667.*

---

### Gross Margin per Unit

| Component | Per Account / Month | Notes |
|-----------|---------------------|-------|
| Average Revenue Per Account (ARPA) | $450/mo | |
| Infrastructure / hosting | ($40/mo) | Direct infrastructure cost |
| Payment processing (Stripe 2.7%) | ($12/mo) | $450 × 2.7% = $12.15, rounded |
| **Gross Profit per Account** | **$398/mo** | $450 - $40 - $12 |
| **Gross Margin %** | **88.4%** | $398 / $450 |

*Benchmark: B2B SaaS gross margins typically run 70-80%. At 88.4%, this business is above benchmark -- consistent with a software-only product without significant direct support labor costs per account. This is a strong foundation for unit economics.*

---

### Lifetime Value (LTV)

| Component | Value | Calculation |
|-----------|-------|-------------|
| ARPA | $450/mo | |
| Gross Margin % | 88.4% | |
| Gross Profit per Account/month | $398/mo | $450 × 88.4% |
| Gross Churn Rate | 2.5%/mo | |
| Monthly Expansion Revenue Rate | 0.8%/mo | Seat additions |
| Net Churn Rate (denominator) | 1.7%/mo | 2.5% - 0.8% |
| Average "Effective" Customer Lifespan | 58.8 months | 1 / 1.7% |
| **LTV (Expansion-Adjusted)** | **$23,412** | $398 / 0.017 |
| *LTV cap applied?* | *No* | Effective lifespan of 58.8 months is just under the 60-month cap; no cap needed |

*Comparison: If we had used the simple LTV formula ignoring expansion (LTV = $398 / 0.025), LTV would have been $15,920. The expansion revenue adds $7,492 (47%) to LTV. This is why asking about expansion revenue is critical -- it is not a small adjustment.*

---

### Key Metrics Summary

| Metric | Calculated Value | Benchmark for Mid-Market B2B SaaS | Assessment |
|--------|-----------------|-----------------------------------|------------|
| **LTV** | $23,412 | -- | |
| **CAC (Blended)** | $2,400 | -- | |
| **LTV/CAC Ratio** | **9.8x** | 3.0x-5.0x | Above target range -- possible under-investment in growth |
| **CAC Payback Period** | **6.0 months** | 12-18 months (mid-market SaaS) | Excellent -- well ahead of benchmark |
| **Gross Margin %** | **88.4%** | 70-80% (B2B SaaS) | Above benchmark -- strong cost structure |
| **Max Viable CAC (at 3x LTV/CAC)** | $7,804 | -- | **$5,404 headroom above current $2,400 CAC** |
| **Max Viable CAC (at 5x LTV/CAC)** | $4,682 | -- | **$2,282 headroom above current $2,400 CAC** |

---

### Sensitivity Analysis

#### Churn Impact on LTV and LTV/CAC
| Monthly Churn Rate | Effective Net Churn | LTV | LTV/CAC | Payback (months) |
|--------------------|--------------------|----|---------|-----------------|
| 1.5% (improved) | 0.7% | $56,857 | 23.7x | 6.0 |
| 2.0% | 1.2% | $33,167 | 13.8x | 6.0 |
| **2.5% (current)** | **1.7%** | **$23,412** | **9.8x** | **6.0** |
| 3.0% | 2.2% | $18,091 | 7.5x | 6.0 |
| 4.0% | 3.2% | $12,438 | 5.2x | 6.0 |

*Note: Payback period does not change with churn -- it only depends on ARPA, gross margin, and CAC. LTV is highly sensitive to small churn changes at these levels.*

#### ARPA Expansion Impact
| ARPA Scenario | Gross Profit/mo | LTV | LTV/CAC | Payback (months) |
|---------------|----------------|-----|---------|-----------------|
| Current ($450) | $398 | $23,412 | 9.8x | 6.0 |
| +10% ($495) | $438 | $25,765 | 10.7x | 5.5 |
| +20% ($540) | $477 | $28,059 | 11.7x | 5.0 |

#### CAC Reduction / Increase Impact (LTV = $23,412)
| CAC Scenario | LTV/CAC | Payback (months) |
|--------------|---------|-----------------|
| +100% ($4,800 -- doubled) | 4.9x | 12.1 |
| +50% ($3,600) | 6.5x | 9.0 |
| **Current ($2,400)** | **9.8x** | **6.0** |
| -10% ($2,160) | 10.8x | 5.4 |
| -20% ($1,920) | 12.2x | 4.8 |

---

### Lever Efficiency Summary
| Lever | Change Required to Reach LTV/CAC = 3.0x | Change Required to Reach LTV/CAC = 5.0x | Assessment |
|-------|----------------------------------------|----------------------------------------|------------|
| Reduce churn | Already at 9.8x -- no reduction needed | Already exceeds 5x | Irrelevant at current ratios |
| Increase ARPA | Already at 9.8x -- no increase needed | Already exceeds 5x | Irrelevant at current ratios |
| **Increase CAC (invest more in growth)** | CAC can increase to **$7,804** | CAC can increase to **$4,682** | **The real question is growth investment** |

---

### Recommendations

**Priority 1 -- Significantly increase growth investment.**
The most important insight from this analysis is not that unit economics are strong -- it is that the business appears to be dramatically under-investing in customer acquisition. With a current LTV/CAC of 9.8x and a max viable CAC of $7,804 (at 3x LTV/CAC), the company could nearly triple its S&M spend from $36,000/month to roughly $100,000/month and still be within investor-standard efficiency thresholds. The 6-month payback period means capital deployed into customer acquisition is returned in half a year. At this rate, faster growth is the economically correct decision -- not capital conservation.

**Priority 2 -- Scale Google Ads before LinkedIn.**
Channel CAC analysis shows Google Ads is generating customers at ~$2,000 vs. LinkedIn at ~$2,667. Given the significant headroom below the max viable CAC of $7,804, both channels can be scaled substantially, but Google Ads should be prioritized first. Test increasing Google Ads budget by $5,000-$10,000/month and measure whether CAC remains below $3,500 as spend scales (CAC typically rises as you exhaust the best keywords). If Google Ads CAC remains below $4,000 at higher spend, continue scaling before adding LinkedIn budget.

**Priority 3 -- Protect expansion revenue rate.**
Expansion revenue of 0.8%/month is adding $7,492 to LTV per customer (47% of total LTV). This is driven by seat additions. Protect and grow this by implementing a formal expansion motion: customer success check-ins at month 3 and month 6, proactive seat-addition prompts when accounts approach their seat limit, and a designated expansion revenue owner
