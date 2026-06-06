---
name: revenue-forecasting
description: |
  Builds bottom-up revenue forecasts by customer segment with documented assumptions, sensitivity analysis, and confidence ranges. Use when the user asks about revenue forecasting, sales projections, revenue modeling, predicting future revenue, or building a revenue plan.
  Do NOT use for full financial modeling (use financial-model-structure), pricing strategy (use pricing-strategy), or analyzing historical P&L data (use pl-analysis).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "analysis planning strategy sales spreadsheets"
  category: "business-strategy"
  subcategory: "finance-accounting"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Revenue Forecasting

## When to Use

**Use this skill when:**
- The user asks to build a revenue forecast, sales projection, or revenue model for a specific business -- including early-stage startups, growth-stage companies, and established businesses planning for a new period
- The user needs revenue projections for a fundraising round (Seed through Series C+), board deck, annual operating plan (AOP), or lender package -- all require documented assumptions and defensible methodology
- The user wants a bottom-up revenue model broken down by customer segment, product tier, channel, or geography, rather than a single top-line number
- The user needs to understand which revenue assumptions carry the most risk and wants scenario analysis or sensitivity testing to communicate a confidence range
- The user is building an annual budget or reforecast and needs to allocate revenue targets across segments, teams, or quarters to create an accountable plan
- The user is preparing for a planning process and needs a structured methodology for estimating future revenue without a full financial model
- The user asks about cohort modeling, pipeline-weighted forecasting, churn-adjusted growth, or consumption-based revenue projection as specific techniques

**Do NOT use this skill when:**
- The user needs a complete three-statement financial model including income statement, balance sheet, and cash flow statement -- use `financial-model-structure` instead
- The user wants to set, test, or optimize their pricing strategy, price tiers, or packaging -- use `pricing-strategy` instead
- The user wants to analyze historical revenue, identify what drove past performance, or explain a variance versus prior periods -- use `pl-analysis` instead
- The user wants to calculate or benchmark unit economics such as LTV, CAC, payback period, or contribution margin -- use `unit-economics` instead
- The user wants to model customer acquisition costs or marketing spend efficiency -- revenue is the output, not the input, in those analyses
- The user is asking about revenue recognition rules under ASC 606 or IFRS 15 (when to recognize, not how much will be earned) -- that is an accounting policy question
- The user needs a territory or quota allocation model for a sales team -- that is a sales planning exercise, not a revenue forecast

---

## Process

### Step 1: Establish Forecast Parameters Before Building Anything

Ask or confirm these parameters before touching numbers. A mismatch between purpose and methodology produces a forecast that is technically correct and strategically useless.

- **Time horizon and granularity:** Operating forecasts run 12 months with monthly granularity. Strategic forecasts run 3 to 5 years with monthly Year 1, quarterly Year 2, and annual Years 3--5. Fundraising forecasts almost always need both: monthly for the first 12--18 months, annual through the end of the investor's expected hold period.
- **Purpose determines defensibility requirements:** A board forecast needs documented assumptions with confidence levels. A fundraising forecast needs a narrative connecting assumptions to the company's go-to-market motion. An internal budget needs segment-level targets that managers can own.
- **Business model determines the driver structure:** Identify the primary revenue model before choosing a methodology. SaaS subscriptions, transactional e-commerce, usage-based consumption, professional services, marketplace, and hybrid models all require different driver equations. The wrong driver structure produces a forecast with no operational meaning.
- **Available historical data:** Fewer than 3 months of data means the forecast is directional only -- label it as such and widen confidence intervals. 6--12 months enables trend analysis. 12+ months enables seasonal indexing and cohort analysis. Ask the user what data they have before assuming.
- **Currency, rounding, and presentation conventions:** Establish up front whether the output is in thousands or actuals, monthly or annual, MRR or ARR, recognized revenue or bookings. Mixing these creates silent errors.

### Step 2: Segment Revenue Into Independently Driven Streams

Revenue segments are only useful if each segment has a different primary growth driver. Segmentation that exists only in reporting -- not in the driver model -- is decoration.

- **Practical segmentation criteria:** Segments should differ by at least one of: price point, customer type (SMB vs. Enterprise), acquisition channel (self-serve vs. sales-assisted), product (core vs. add-on), or geography (if conversion, churn, or pricing differs by region). If two segments have identical drivers, consolidate them.
- **Maximum useful segments for a forecast:** For most businesses, 3--5 revenue segments is the right level. Fewer than 3 misses important differentiation. More than 6 creates false precision and makes the model hard to maintain.
- **Common segmentation approaches by model type:**
  - SaaS: By plan tier (Starter / Growth / Enterprise) or by motion (self-serve / sales-assisted)
  - Services: By engagement type (retainer / project / consulting) or by practice area
  - Marketplace: By supply category or geography if take rates differ
  - E-commerce: By product category or customer type (new vs. repeat)
  - Usage-based: By customer tier (free / paid / enterprise) since usage curves differ dramatically
- **Expansion revenue is a separate segment:** Net Revenue Retention (NRR) above 100% means existing customers are growing. Model upsells and expansions as a distinct revenue line with its own driver (e.g., average expansion per customer per quarter, or percentage of customers who upgrade annually). Bundling expansion with new customer acquisition masks the true growth engine.
- **Annual vs. monthly contracts create different revenue timing:** If a business sells both monthly and annual contracts, model them separately. Annual contracts create deferred revenue and lumpy cash -- the recognized revenue pattern differs from bookings.

### Step 3: Choose and Document the Primary Forecasting Methodology

Match the methodology to the data available, not to the output you want. Using a sophisticated methodology with poor data produces precise garbage.

- **Bottom-up (default for all businesses with any revenue data):** Build from the most granular observable unit -- individual customers, transactions, or usage events. The formula is: Opening count + new additions - churned/expired = closing count. Revenue = closing count x average revenue per unit. This produces a forecast grounded in operational reality and forces explicit assumptions about growth levers.
- **Cohort-based (preferred for subscription with 12+ months of data):** Group customers by acquisition month. Apply observed retention curves to project future revenue contribution from each cohort. Layer new cohort projections on top. This is the most accurate method for subscription businesses because it correctly accounts for the compounding effect of churn -- a 5% monthly churn rate does not simply reduce revenue by 5% per month on a growing base.
- **Pipeline-weighted (required for enterprise sales cycles of 60+ days):** Pull CRM stage distribution and apply historical win rates by stage. Example: Stage 1 (Discovery) = 15% probability, Stage 3 (Proposal Sent) = 45%, Stage 4 (Verbal Commit) = 75%, Closed Won = 100%. Apply these to the dollar value in each stage to produce expected revenue. Layer in projected new pipeline generation for deals not yet created. This method requires honest win rate data -- most sales organizations overestimate early-stage win rates by 20--40%.
- **Run-rate with adjustments (acceptable for stable businesses, never for high-growth):** Take the most recent 3-month average monthly revenue and project it forward with explicit adjustments for known changes. Only appropriate when growth is under 10% annually and business is stable. Flag as low-foresight methodology.
- **Top-down (sanity check only, never primary):** Start with Total Addressable Market (TAM), apply a target market share percentage, back into implied revenue. The implied market share required is almost always implausibly high when this method is used as a primary forecast. Use it to check whether the bottom-up output requires capturing an unrealistic share of the market.
- **Hybrid methodology:** Most real forecasts combine approaches. Example: Use pipeline-weighted forecasting for the enterprise segment (where deals are known), bottom-up cohort modeling for SMB self-serve, and run-rate for recurring services revenue. Document which methodology drives each segment.

### Step 4: Build the Driver Model for Each Segment

Every revenue assumption must connect to an observable, measurable business activity. Assumptions that cannot be tied to a metric cannot be monitored, cannot be improved, and cannot be defended.

- **SaaS / subscription driver equation:**
  - Opening customers (BOM) + new customers acquired -- customers churned = Closing customers (EOM)
  - Revenue = Closing customers x ARPU, or use beginning-of-month customers x ARPU to be conservative
  - Decompose new customers into: qualified leads x conversion rate, or marketing-sourced + sales-sourced separately if the channels have different unit economics
  - Decompose churn into: voluntary churn (cancellations) + involuntary churn (failed payments, typically 0.5--1.5% per month for credit card businesses) -- involuntary churn is often 20--30% of total churn and is recoverable with dunning processes
  - Model expansion MRR separately: number of customers who upgrade x average upgrade value x average months to first upgrade
  - Net MRR movement = New MRR + Expansion MRR -- Churned MRR -- Contraction MRR
- **E-commerce / transactional driver equation:**
  - Sessions x conversion rate x average order value = gross revenue
  - Gross revenue x (1 - return rate) = net revenue
  - Decompose sessions into: organic search, paid search, social, direct, email -- each with its own conversion rate and AOV because channel mix affects both metrics significantly
  - New vs. repeat customer split matters: repeat customers typically convert at 3--5x the rate of new visitors and have 20--40% higher AOV
  - Purchase frequency for repeat customers drives the cohort revenue curve -- model monthly active customers x repurchase rate x AOV separately from new customer revenue
- **Usage-based / consumption driver equation:**
  - Active customers x median usage units per customer x price per unit = revenue
  - Use median not mean -- usage distributions are right-skewed and a few high-usage customers inflate the mean significantly
  - Model the ramp period: new customers typically reach steady-state usage in 60--90 days. In month 1, a new customer may consume 30% of eventual steady-state; by month 3, 80--100%. Apply a ramp factor to new customer cohorts.
  - Contract minimums create a floor -- if customers pay a minimum commitment, recognized revenue may exceed actual usage in early months
- **Professional services / agency driver equation:**
  - Billable headcount x target utilization rate x average billing rate = billable revenue
  - Typical target utilization: 70--80% for client-facing roles. Actual utilization often runs 60--70%. Model actual, not target.
  - Account for ramp time for new hires: a new consultant reaches full billable utilization in 30--60 days
  - Project-based revenue is lumpy -- use a project pipeline weighted by probability of close and expected start date
  - Retainer revenue is highly predictable -- model separately as ARR equivalent
- **Marketplace driver equation:**
  - Gross Merchandise Value (GMV) = Active buyers x transactions per buyer x average order value
  - Revenue = GMV x take rate (platform commission)
  - Model supply (active sellers, listings) and demand (active buyers) separately -- the binding constraint determines growth
  - Supply-constrained marketplace: growth is driven by seller acquisition and activation rate
  - Demand-constrained marketplace: growth is driven by buyer acquisition and repeat purchase rate

### Step 5: Source and Document Every Assumption

An assumption without a source is a guess. A forecast built on undocumented guesses cannot be reviewed, improved, or trusted by any reader who did not build it.

- **Assign each assumption a source tier:**
  - **Tier 1 -- Contractual:** Signed contracts, committed purchase orders, active subscriptions. Confidence: 90--95%. These are the foundation of any near-term forecast.
  - **Tier 2 -- Historical trend:** Derived from 6+ months of consistent data. Stated as: "Based on trailing 3-month average of X, adjusted for Y." Confidence: 70--85%.
  - **Tier 3 -- Management estimate:** Leadership judgment informed by market knowledge and pipeline observation. Confidence: 50--65%. Any assumption at this tier should have a wider sensitivity band.
  - **Tier 4 -- Industry benchmark:** Derived from comparable company data, industry reports, or investor benchmarks. Confidence: 40--60%. Use only when no internal data exists. State the source category (e.g., "SaaS industry median for seed-stage B2B per OpenView benchmarks").
- **Key benchmarks to know for common assumption calibration:**
  - SaaS monthly churn: Early-stage B2B typically 3--7% monthly; mature B2B 1--2% monthly; consumer 5--12% monthly. Annual contract businesses show lower monthly churn because the measurement period differs.
  - B2B SaaS conversion (free trial to paid): 15--25% for product-led growth; 5--15% for sales-assisted trial
  - E-commerce conversion rate: 1--3% for cold traffic; 5--15% for returning visitors
  - Enterprise sales win rates by stage: These vary dramatically but rough benchmarks are Stage 1 (10--20%), Stage 2 (25--40%), Stage 3 (50--70%), verbal commit (75--90%)
  - Marketplace supply-to-demand ratio: Most successful marketplaces maintain 1.5--3x supply listings per active buyer transaction to avoid stockouts
- **Flag assumption interdependencies:** Some assumptions are correlated. If new customer acquisition increases aggressively (by adding sales headcount or increasing ad spend), churn may increase in the near term because faster growth often means lower-quality customer selection. If pricing increases, both conversion rate and churn rate typically move negatively. Document these dependencies so the scenario analysis reflects them.
- **Identify the most sensitive assumptions before building scenarios:** Run a quick mental test -- which three assumptions, if each were 20% worse than plan, would cause you to miss your revenue target by the largest amount? Those three are the headline sensitivity variables. For subscription businesses, these are almost always: new customer acquisition rate, monthly churn rate, and ARPU. For transactional businesses: traffic/sessions, conversion rate, and AOV.

### Step 6: Build the Forecast Month by Month

Build the model period by period, not in aggregate. Aggregating to annual numbers first and then backing into monthly patterns is backwards -- it forces you to assume the answer before doing the work.

- **Start from actuals, not from targets:** Begin with the most recent month of actual data as the opening position. If the user has provided specific numbers, use them exactly. If revenue is growing, the opening month's MRR is the correct starting point -- not a rounded number.
- **Apply driver changes incrementally:** For a subscription business, calculate: BOM customers + new customers this month -- churned customers this month = EOM customers. Then EOM customers x ARPU = month-end MRR. Carry EOM to next month's BOM. This creates the compounding effect that makes subscription revenue forecasts geometrically shaped, not linear.
- **Ramp-in assumptions gradually:** If the user assumes churn will improve from 5% to 2% over 12 months, do not jump to 2% in month 1. Ramp it linearly (or S-curved) over the forecast period. Sudden step-changes in assumptions signal unrealistic modeling.
- **For Year 2+ in strategic forecasts:** Switch to quarterly granularity. Apply annual growth rates to the Y1 exit rate -- do not start Y2 from the Y1 average, which significantly understates the true starting point for a growing business. A business that ends Y1 at $100K MRR has a $1.2M ARR run rate entering Y2, not a $900K run rate based on Y1 average MRR.
- **Calculate both recognized revenue and bookings if they differ:** For businesses with annual contracts or implementation fees, bookings (what was sold) and recognized revenue (what can be recorded on the income statement) differ. A $120K annual contract signed in Month 6 recognizes $10K/month for 12 months -- $60K in Y1, $60K in Y2. Always clarify which metric the forecast represents.
- **Cumulative revenue is not the same as ARR:** ARR (Annual Recurring Revenue) is exit MRR x 12 -- it is a point-in-time run rate, not a sum of the year's revenue. Clearly label tables to avoid confusion. Cumulative Y1 revenue and Y1 exit ARR will differ by 20--40% in a high-growth business.

### Step 7: Build Scenario Analysis and Sensitivity Tables

A point estimate is not a forecast. A real forecast communicates the range of probable outcomes and identifies which assumptions drive the most risk.

- **Three scenarios are the minimum; four is better for fundraising:**
  - **Conservative (Bear Case):** Key drivers miss plan by 15--25%. Represents a plausible downside scenario, not a catastrophe. Example: new customer acquisition is 20% below plan AND churn is 15% worse than planned. Show this scenario to investors to demonstrate you've stress-tested the model.
  - **Base Case:** Current trajectory maintained. This is not "everything goes right" -- it is the best estimate given available data.
  - **Optimistic (Bull Case):** Key drivers beat plan by 15--25%. Represents a realistic upside if the go-to-market executes well. Not a scenario where everything goes perfectly.
  - **Stretch (for internal use or fundraising):** Represents a scenario where a specific bet pays off -- a new channel opens, a large enterprise deal closes, a product launch accelerates self-serve signups. Only include if there is a concrete initiative that could drive this outcome. Label it clearly as a stretch target.
- **Scenario analysis must be internally consistent:** Do not build scenarios by changing one number in isolation. If you increase new customer growth by 25% (optimistic case), you should also increase CAC spending -- which increases costs. In a revenue-only forecast, flag that the optimistic scenario has cost implications not reflected here.
- **Sensitivity table format:** Show the impact of a single variable changing across a range (typically -30%, -20%, -10%, base, +10%, +20%, +30%) while all other variables stay at base. Present a separate table for each of the top 2--3 variables. Label the dollar impact, not just the percentage change, so the magnitude is immediately clear.
- **Confidence interval construction:** State a confidence interval explicitly. For a Tier 1--2 assumption base, "80th percentile range" is appropriate. For forecasts heavily dependent on Tier 3--4 assumptions, state a 60th percentile range. The interval should be asymmetric for high-growth businesses -- the upside from faster growth is larger than the downside from slower growth because of compounding.
- **Tornado chart narration (when visuals are not possible):** Rank the sensitivity variables from highest to lowest dollar impact. Describe the ranking in words: "The single most impactful assumption is new customer acquisition rate, which swings Y1 revenue by ±$82K at ±20%. The second most impactful is monthly churn, which swings Y1 revenue by ±$47K at the same range. ARPU, which is fixed by pricing, has no sensitivity."

---

## Output Format

```
## Revenue Forecast: [Company Name]
## Period: [Start Month, Year] through [End Month, Year]
## Prepared: [Date] | Version: [1.0]

---

### Forecast Parameters

| Parameter | Value |
|-----------|-------|
| Primary methodology | [Bottom-up / Cohort / Pipeline-weighted / Hybrid] |
| Secondary methodology | [Top-down sanity check / None] |
| Time horizon | [12 months / 3 years / 5 years] |
| Granularity | [Monthly Y1 / Quarterly Y2 / Annual Y3-Y5] |
| Revenue metric | [Recognized revenue / Bookings / ARR run rate] |
| Purpose | [Board reporting / Fundraising / Annual budget / Internal planning] |
| Historical data available | [X months] |
| Forecast confidence | [High / Medium / Directional estimate] |

---

### Business Model and Revenue Segments

**Business model:** [Subscription SaaS / Transactional e-commerce / Usage-based / Services / Marketplace / Hybrid]

| Segment | Current MRR/Revenue | % of Total | Primary Growth Driver | Forecast Method |
|---------|--------------------|-----------|-----------------------|-----------------|
| [Segment 1 -- e.g., SMB Self-Serve] | $[X] | [X]% | [e.g., Trial conversion rate] | [Bottom-up] |
| [Segment 2 -- e.g., Mid-Market Sales-Assisted] | $[X] | [X]% | [e.g., Pipeline close rate] | [Pipeline-weighted] |
| [Segment 3 -- e.g., Expansion/Upsell] | $[X] | [X]% | [e.g., Upgrade rate from Starter] | [Cohort-based] |
| **Total** | **$[X]** | **100%** | | |

---

### Driver Model

**[Segment 1 -- e.g., SMB Self-Serve] Driver Equation:**
BOM Customers + New Customers -- Churned Customers = EOM Customers
Revenue = EOM Customers x ARPU

**[Segment 2] Driver Equation:**
Pipeline Value x Win Rate by Stage = Expected Closed Revenue
[Specify stage-weighted calculation]

---

### Assumptions

| Assumption | Current Value | Y1 Target | Y2 Target | Data Source | Source Tier | Confidence | Sensitivity |
|------------|--------------|-----------|-----------|-------------|-------------|------------|-------------|
| [New customers/month -- Self-Serve] | [X] | [X] | [X] | [3-mo avg] | Tier 2 | Medium | **HIGH** |
| [Monthly voluntary churn] | [X]% | [X]% | [X]% | [Cohort analysis] | Tier 2 | Medium | **HIGH** |
| [Monthly involuntary churn] | [X]% | [X]% | [X]% | [Payment failure rate] | Tier 2 | High | Medium |
| [ARPU -- Starter plan] | $[X] | $[X] | $[X] | [Pricing page] | Tier 1 | High | Low |
| [ARPU -- Growth plan] | $[X] | $[X] | $[X] | [Pricing page] | Tier 1 | High | Low |
| [Upgrade rate Starter to Growth] | [X]% | [X]% | [X]% | [Historical] | Tier 2 | Medium | Medium |
| [Pipeline win rate -- Stage 3] | [X]% | [X]% | [X]% | [CRM data] | Tier 2 | Medium | **HIGH** |
| [Average deal size -- Enterprise] | $[X] | $[X] | $[X] | [Historical] | Tier 2 | Medium | Medium |

**Assumption Interdependencies:**
- [e.g., If acquisition rate increases 30%+ MoM, churn is expected to increase 0.5--1% in the following 2 months due to lower customer quality at scale]
- [e.g., ARPU and conversion rate are inversely correlated -- any price increase above $X is expected to reduce trial conversion by approximately Y%]

---

### Monthly Forecast -- Year 1

| Month | [Seg 1] Customers | [Seg 1] MRR | [Seg 2] Customers | [Seg 2] MRR | Expansion MRR | Total MRR | MoM Growth | Cumul. Revenue |
|-------|------------------|-------------|------------------|-------------|---------------|-----------|------------|----------------|
| M1 | [X] | $[X] | [X] | $[X] | $[X] | $[X] | [X]% | $[X] |
| M2 | [X] | $[X] | [X] | $[X] | $[X] | $[X] | [X]% | $[X] |
| M3 | [X] | $[X] | [X] | $[X] | $[X] | $[X] | [X]% | $[X] |
| M4 | [X] | $[X] | [X] | $[X] | $[X] | $[X] | [X]% | $[X] |
| M5 | [X] | $[X] | [X] | $[X] | $[X] | $[X] | [X]% | $[X] |
| M6 | [X] | $[X] | [X] | $[X] | $[X] | $[X] | [X]% | $[X] |
| M7 | [X] | $[X] | [X] | $[X] | $[X] | $[X] | [X]% | $[X] |
| M8 | [X] | $[X] | [X] | $[X] | $[X] | $[X] | [X]% | $[X] |
| M9 | [X] | $[X] | [X] | $[X] | $[X] | $[X] | [X]% | $[X] |
| M10 | [X] | $[X] | [X] | $[X] | $[X] | $[X] | [X]% | $[X] |
| M11 | [X] | $[X] | [X] | $[X] | $[X] | $[X] | [X]% | $[X] |
| M12 | [X] | $[X] | [X] | $[X] | $[X] | $[X] | [X]% | $[X] |
| **Y1 Total** | | | | | | **$[X]** | | **$[X]** |

**Y1 Exit MRR:** $[X] | **Implied Y1 Exit ARR:** $[X] | **Y1 Cumulative Revenue:** $[X]

---

### Annual Summary (Years 1--3 or 1--5)

| Year | Opening MRR | Exit MRR | Annual Revenue | YoY Growth | Exit ARR | Primary Growth Driver |
|------|------------|---------|---------------|-----------|---------|----------------------|
| Y1 | $[X] | $[X] | $[X] | -- | $[X] | [e.g., Self-serve acquisition] |
| Y2 | $[X] | $[X] | $[X] | [X]% | $[X] | [e.g., Sales motion scaling] |
| Y3 | $[X] | $[X] | $[X] | [X]% | $[X] | [e.g., Net revenue retention > 100%] |

---

### Scenario Analysis

| Scenario | Y1 Exit MRR | Y1 Revenue | Y2 Revenue | Key Assumption Changes | Plausibility |
|----------|------------|-----------|-----------|----------------------|--------------|
| **Conservative** | $[X] | $[X] | $[X] | [New cust -20%, churn +15%] | Plausible if [specific risk] |
| **Base** | $[X] | $[X] | $[X] | Current trajectory | Central estimate |
| **Optimistic** | $[X] | $[X] | $[X] | [New cust +20%, churn -10%] | Achievable if [specific action] |
| **Stretch** | $[X] | $[X] | $[X] | [Specific initiative: e.g., enterprise channel] | Requires [named initiative] to execute |

---

### Sensitivity Analysis -- Y1 Revenue Impact

**Variable 1: [New Customer Acquisition Rate]** (Highest impact)

| Change | Monthly New Customers | Y1 Revenue | vs. Base |
|--------|----------------------|-----------|---------|
| -30% | [X] | $[X] | -$[X] ([X]%) |
| -20% | [X] | $[X] | -$[X] ([X]%) |
| -10% | [X] | $[X] | -$[X] ([X]%) |
| **Base** | **[X]** | **$[X]** | -- |
| +10% | [X] | $[X] | +$[X] ([X]%) |
| +20% | [X] | $[X] | +$[X] ([X]%) |
| +30% | [X] | $[X] | +$[X] ([X]%) |

**Variable 2: [Monthly Churn Rate]** (Second highest impact)

| Change | Monthly Churn | Y1 Revenue | vs. Base |
|--------|--------------|-----------|---------|
| [Rows same as above] | | | |

**Variable 3: [ARPU / Win Rate / AOV]** (Third highest impact)

| Change | [Variable] | Y1 Revenue | vs. Base |
|--------|-----------|-----------|---------|
| [Rows same as above] | | | |

---

### Risk Register

| Risk | Direction | Probability | Revenue Impact | Mitigation |
|------|-----------|------------|----------------|------------|
| [e.g., Churn exceeds plan by 2%] | Downside | Medium | -$[X] Y1 revenue | [Improve onboarding, implement dunning] |
| [e.g., Sales hire ramp takes 60d longer] | Downside | Medium | -$[X] Y1 revenue | [Extend pipeline coverage ratio] |
| [e.g., New channel exceeds plan] | Upside | Low | +$[X] Y1 revenue | [Budget flexibility to accelerate] |

---

### Model Integrity Checks

- [ ] Opening balance matches most recent actuals
- [ ] Churn rate applied to correct base (beginning-of-month customers, not end)
- [ ] Annual revenue ≠ Exit MRR x 12 (correct: annual revenue is sum of 12 monthly MRR values)
- [ ] Scenario assumptions are internally consistent (not single-variable changes)
- [ ] All Tier 3 and Tier 4 assumptions are flagged with higher sensitivity bands
- [ ] Expansion revenue modeled separately from new customer revenue
```

---

## Rules

1. **Never apply a growth percentage directly to last year's revenue.** Applying "35% YoY growth" to a prior year total produces a number with no operational explanation. Every revenue growth projection must be derivable from underlying driver changes -- more customers, higher prices, better retention, or more usage. If the user only has a target growth rate, ask them to decompose it into driver assumptions before forecasting.

2. **Churn compounds, and it is almost always underestimated.** A 5% monthly churn rate does not mean 60% annual churn -- it means 46% annual churn (1 - 0.95^12). But the damage compounds further on a growing base: a company adding 20 customers per month with 5% monthly churn will plateau at roughly 400 customers regardless of how long it acquires at that rate (the equilibrium is new/churn = 20/0.05). Always show the churn math explicitly and check whether the assumed churn rate, if sustained, leads to a natural ceiling that contradicts the revenue trajectory.

3. **ARR is not the same as annual revenue.** ARR (Annual Recurring Revenue) = exit month MRR x 12. It is a run-rate metric representing the annualized value of current subscriptions. Annual revenue is the sum of all monthly revenues over the year. In a high-growth SaaS company growing 10% MoM, annual revenue will be approximately 60--70% of the exit ARR. Conflating them inflates the revenue number in investor materials and creates confusion.

4. **For subscription businesses, always model both gross and net churn.** Gross churn is the revenue lost from cancellations and downgrades. Net churn is gross churn minus expansion revenue. A company with 8% gross monthly revenue churn and 4% monthly expansion MRR has -4% net churn (negative churn), meaning existing customers are growing faster than others are leaving. This is a fundamentally different business trajectory than 8% gross churn with 0% expansion. Show both in any SaaS forecast.

5. **Pipeline-weighted forecasts require honest win rates, not aspiration rates.** Most teams report win rates based on opportunities that reached late stages, excluding deals lost before they were properly qualified. The true win rate from initial lead to closed revenue is almost always 30--50% lower than the stage-level win rates. When building pipeline-weighted forecasts, validate the win rates against actual closed revenue in prior periods, not against the sales team's expectations.

6. **Do not use ARPU as a static assumption without examining the mix shift.** ARPU can increase over time if the plan mix shifts toward higher-tier products, even if no individual price changes. It can decrease if growth is concentrated in lower-tier products. Always decompose ARPU into (number of customers at each tier x price at that tier) / total customers, and project the mix shift explicitly. A company with 80% Starter customers and 20% Growth customers today may have 60%/40% in 12 months if Growth plan acquisition is accelerating -- blended ARPU changes accordingly.

7. **Year 2+ projections must start from the Y1 exit rate, not the Y1 average.** A business ending Y1 at $150K MRR has $1.8M ARR entering Y2. If Y1 average MRR was $100K and Y2 is modeled as "100% growth over Y1 revenue," you will calculate $2.0M Y2 revenue starting from the wrong baseline. Always build Y2 from the EOM Month 12 position of the Y1 model.

8. **Label the forecast clearly by what it represents: bookings, recognized revenue, or billings.** A SaaS company that signs a $120K annual contract in July recognizes $10K/month -- $60K in the fiscal year. An agency that completes a $200K project in October recognizes $200K upon completion. Failing to distinguish these creates a forecast that appears to show much stronger early revenue than will appear on the income statement. When annual contracts or project-based revenue are involved, show both the bookings schedule and the recognized revenue schedule.

9. **Sensitivity analysis must show dollar impact, not just percentage impact.** A 20% miss on new customer acquisition sounds dramatic on a 15-customer/month base -- it means 3 fewer customers per month. The dollar impact may be modest. On a 200-customer/month growth company, a 20% miss means 40 fewer customers per month and a massive revenue shortfall. Always anchor sensitivity to dollar values so the materiality is immediately obvious.

10. **Flag any assumption that would require an implausible benchmark to be true.** Before finalizing the output, run a top-down sanity check: what market share does this revenue imply? What conversion rate does this traffic volume imply? What close rate does this pipeline imply? If any implied metric is outside the range of comparably-staged companies (e.g., 40% trial-to-paid conversion for a self-serve B2B product, when 15--25% is the industry norm), flag it explicitly and ask the user to confirm or revisit the assumption.

---

## Edge Cases

### Pre-Revenue or Seed-Stage Business (No Historical Data)

When there is no revenue history, the forecast is entirely assumption-driven. Every number is Tier 3 or Tier 4. Handle this situation carefully:
- Build from the go-to-market plan backward. If the user plans to hire 2 sales reps in Month 3, estimate their ramp time (typically 60--90 days for B2B SaaS AEs), their quota, and their expected attainment in ramp vs. fully ramped periods (commonly 50% attainment in months 1--3, 75% in months 4--6, 100% thereafter).
- Source benchmarks from comparable companies at the same stage. For SaaS, sources include OpenView SaaS Benchmarks, Bessemer Venture Partners metrics, and KeyBanc SaaS Survey data -- describe the benchmark category rather than citing a URL.
- Present a range, not a point estimate. Show what revenue would look like if the business hits the 25th, 50th, and 75th percentile of comparable company ramp curves.
- Label the entire forecast as "Directional Estimate -- Assumption-Driven." Confidence interval should span at least 3x between conservative and optimistic cases.
- Focus the output on what assumptions would need to be true to hit each scenario, not on the number itself. This is more useful for early-stage decisions than a false-precision point estimate.

### Highly Seasonal Business (Retail, E-Commerce, Travel, Tax, Education)

Seasonality that is not modeled explicitly will cause the forecast to be systematically wrong in predictable ways:
- Build a seasonal index using prior year monthly data if available. Seasonal index for a given month = (that month's revenue / annual average monthly revenue). A retailer might have a December index of 3.2x and a February index of 0.6x.
- Apply the seasonal index to the base trend: Forecast month = (annual trend forecast / 12) x seasonal index.
- If the business is growing, the seasonal pattern should be applied to the growing base, not the prior year absolute values. A business growing 30% YoY with a December peak will have a December that is 30% larger than last December in absolute terms.
- For businesses in their first year with no prior seasonal data, use industry seasonal patterns and label the seasonality assumption explicitly as benchmark-based.
- Be especially careful with annual recurring revenue metrics for seasonal businesses -- quoting ARR at the peak month dramatically overstates the true recurring run rate. Use an average of 3 months straddling the non-seasonal period as a more representative ARR.

### Business Transitioning Between Pricing Models (One-Time to Recurring or Upfront to Usage-Based)

This is one of the most dangerous forecasting scenarios because total revenue typically dips during the transition even when the business is healthy:
- Model both old and new revenue streams as completely separate segments. The old model declines as fewer one-time purchases occur. The new model grows as recurring or consumption revenue builds.
- Identify the crossover month (when recurring revenue exceeds the old model contribution). This is typically 12--24 months into the transition for an established business.
- Show the J-curve explicitly: in months 1--6 of transition, total revenue may decline 15--30% from peak before recovering. This is expected and should be framed as planned, not as a sign of distress.
- Calculate the value inflection point: at what point does the recurring stream's present value exceed what the old model would have generated? This is the key metric for justifying the transition to investors or the board.
- For investors evaluating this scenario, show both GAAP revenue and ARR run rate as separate metrics -- ARR will grow positively throughout the transition even when GAAP revenue dips.

### Enterprise Sales Concentration Risk (Top 3--5 Customers Represent >40% of Revenue)

Enterprise sales forecasts carry unique risks when a small number of large customers represent disproportionate revenue:
- Model each enterprise customer individually for any customer representing more than 5% of total revenue. These are named accounts, not statistical averages.
- For pipeline deals, use stage-specific win rates adjusted for deal-specific factors (incumbent vendor, relationship, competitive position). Do not apply generic win rates to individual large deals.
- Run a revenue concentration analysis: what happens to the forecast if the largest customer churns, delays renewal, or reduces their contract size by 30%? Show this as a named risk scenario, not just a sensitivity variable.
- Enterprise contracts often have minimum commitments that create a revenue floor but also optional expansion that creates upside. Model the floor (committed revenue) and the expansion (probability-weighted) separately.
- For renewal forecasts, note that enterprise churn is typically binary and lags -- customers often stay on for 2--3 renewal cycles even when unhappy, then leave suddenly. The apparent low churn rate in historical data may not predict future renewal rates accurately.

### Usage-Based / Consumption Pricing with High Customer Variability

Usage-based revenue forecasting is structurally different from seat-based SaaS because revenue per customer is not fixed:
- Segment customers by usage cohort: Low (bottom quartile), Medium (middle 50%), High (top quartile). Each cohort has a different average monthly consumption and a different growth trajectory. High-usage customers often have faster consumption growth rates.
- Apply a ramp curve to new customers. In month 1, a new customer typically uses 20--40% of their eventual steady-state consumption as they onboard and expand usage. Build a 3--6 month ramp factor into new customer revenue.
- Churn in usage-based models is often "quiet" -- customers don't cancel, they simply reduce usage. Define a minimum usage threshold below which a customer is effectively churned, even if still technically active.
- Forecast the number of active customers (above minimum usage threshold) separately from inactive customers. This produces a cleaner metric than "total contracted customers."
- Use median consumption per cohort for planning purposes. The mean is almost always inflated by one or two extremely high-usage outliers. Sensitivity-test what happens if those outlier customers reduce usage.

### Post-Acquisition Revenue Forecasting (M&A Integration)

When the user is forecasting revenue for a combined entity following an acquisition:
- Separate acquired revenue from organic revenue in every period. Investors and management need to understand the organic growth rate independently.
- Model customer overlap carefully. If both companies serve similar customer segments, there will be some customer loss at renewal due to consolidation, product confusion, or competitor entry during the distraction of integration. Model a 5--15% elevated churn in the 6--12 months post-acquisition for the acquired book of business.
- For the acquiree's revenue, reforecast from scratch using the acquiring company's methodology rather than simply extrapolating the target's historical growth rate. The target's growth rate was achieved under its own go-to-market motion, which may change materially under new ownership.
- Revenue synergies (cross-selling, new markets opened) should be modeled as a separate scenario with explicit probability weights. Synergies are reliably overestimated in acquisition cases. A reasonable assumption for cross-sell synergy realization is 20--30% of the projected synergy in Year 1, 60% in Year 2, 80% in Year 3.

---

## Example

**Input:** "We run a B2B SaaS platform for small law firms. We have two plans: Essentials at $79/month (aimed at solo/2-attorney firms) and Professional at $229/month (aimed at 3--10 attorney firms). Today we have 200 customers -- 140 Essentials, 60 Professional. We're acquiring about 22 new customers per month (65% Essentials, 35% Professional) through a mix of Google Ads and word-of-mouth. Monthly churn is running at 3.8% (it was 5.2% six months ago and has been improving as we fixed onboarding). About 4% of Essentials customers upgrade to Professional each month. We're building this forecast for a Series A pitch deck -- 24 months, monthly Year 1, annual Year 2."

---

## Revenue Forecast: LegalTech SaaS
## Period: Month 1 through Month 24 (Year 1 Monthly / Year 2 Annual)
## Prepared for: Series A Fundraising Deck | Version: 1.0

---

### Forecast Parameters

| Parameter | Value |
|-----------|-------|
| Primary methodology | Bottom-up (customer stock-flow model with upgrade tracking) |
| Secondary methodology | Top-down sanity check on market share implied |
| Time horizon | 24 months |
| Granularity | Monthly Y1, Annual Y2 |
| Revenue metric | Recognized MRR (monthly subscription, no annual contracts modeled) |
| Purpose | Series A fundraising -- investor-facing |
| Historical data available | 6+ months (improving churn trend over 6 months) |
| Forecast confidence | Medium (improving trend well-documented; growth rate has limited history) |

---

### Business Model and Revenue Segments

**Business model:** B2B SaaS subscription -- two plan tiers with upgrade path

| Segment | Current MRR | % of Total | Primary Growth Driver | Forecast Method |
|---------|------------|-----------|----------------------|----------------|
| Essentials ($79/mo) | $11,060 | 40% | New customer acquisition (14/mo) | Bottom-up stock-flow |
| Professional ($229/mo) | $13,740 | 50% | New customer acquisition (8/mo) + upgrades from Essentials | Bottom-up stock-flow + upgrade layer |
| Expansion (Essentials-to-Pro upgrades) | included above | 10% of total uplift | 4% monthly upgrade rate on Essentials base | Upgrade rate applied to Essentials EOM base |
| **Total** | **$24,800** | **100%** | | |

*Note: Expansion MRR from upgrades = Essentials EOM customers x 4% upgrade rate x ($229 - $79) = uplift per upgrading customer of $150/month*

---

### Driver Model

**Essentials Segment:**
- BOM Essentials + 14 new Essentials -- (BOM Essentials x 3.8% churn) -- (BOM Essentials x 4.0% upgrade) = EOM Essentials
- Monthly Revenue = EOM Essentials x $79

**Professional Segment:**
- BOM Professional + 8 new Professional + (BOM Essentials x 4.0% upgrades) -- (BOM Professional x 3.8% churn) = EOM Professional
- Monthly Revenue = EOM Professional x $229

**Total MRR = Essentials Revenue + Professional Revenue**

*Key mechanic: Essentials customers who upgrade become Professional customers. The upgrade rate simultaneously reduces the Essentials base and increases the Professional base.*

---

### Assumptions

| Assumption | Current Value | Y1 Target | Y2 Target | Data Source | Source Tier | Confidence | Sensitivity |
|------------|--------------|-----------|-----------|-------------|-------------|------------|-------------|
| New Essentials customers/month | 14 | 14 → 18 (ramp H2) | 22 | 3-mo avg + planned ad spend increase | Tier 2 | Medium | **HIGH** |
| New Professional customers/month | 8 | 8 → 10 (ramp H2) | 13 | 3-mo avg + planned ad spend increase | Tier 2 | Medium | **HIGH** |
| Monthly churn (all plans) | 3.8% | 3.8% → 3.0% (ramp over 12mo) | 2.5% | 6-month improving trend (from 5.2%) | Tier 2 | Medium | **HIGH** |
| Essentials-to-Professional upgrade rate | 4.0%/mo | 4.0% | 4.5% | 2-month observation | Tier 3 | Low-Medium | Medium |
| Essentials ARPU | $79 | $79 | $79 | Pricing page (fixed) | Tier 1 | High | Low |
| Professional ARPU | $229 | $229 | $229 | Pricing page (fixed) | Tier 1 | High | Low |
| New customer mix (% Essentials) | 65% | 65% | 60% | 3-mo avg | Tier 2 | Medium | Medium |

**Assumption Interdependencies:**
- Churn improvement is correlated with onboarding investment. If the engineering resources fixing onboarding are redirected, churn improvement stalls.
- Increasing paid acquisition (planned in H2 Y1) tends to increase early churn by 0.5--1.0% because paid traffic converts lower-intent customers. The acquisition ramp and churn improvement targets may partially offset each other.
- Upgrade rate has only 2 months of data. Widen sensitivity band to ±50% on this assumption.

---

### Monthly Forecast -- Year 1

Methodology note: Churn ramps linearly from 3.8% in M1 to 3.0% in M12. New customer acquisition ramps from 22/month (14 Ess + 8 Pro) in M1 to 28/month (18 Ess + 10 Pro) in M9, then holds.

| Month | Ess. Customers | Ess. MRR | Pro. Customers | Pro. MRR | Total MRR | MoM Growth | Cumul. Rev. |
|-------|---------------|---------|----------------|---------|-----------|------------|-------------|
| Start | 140 | $11,060 | 60 | $13,740 | $24,800 | -- | -- |
| M1 | 142 | $11,218 | 64 | $14,656 | $25,874 | +4.3% | $25,874 |
| M2 | 143 | $11,297 | 68 | $15,572 | $26,869 | +3.8% | $52,743 |
| M3 | 144 | $11,376 | 72 | $16,488 | $27,864 | +3.7% | $80,607 |
| M4 | 145 | $11,455 | 76 | $17,404 | $28,859 | +3.6% | $109,466 |
| M5 | 146 | $11,534 | 79 | $18,091 | $29,625 | +2.7% | $139,091 |
| M6 | 147 | $11,613 | 83
