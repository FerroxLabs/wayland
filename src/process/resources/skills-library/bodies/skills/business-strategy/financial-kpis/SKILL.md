---
name: financial-kpis
description: |
  Defines financial KPI frameworks with metric name, formula, target, data source, review cadence, and accountability assignment for business performance tracking. Use when the user asks about financial KPIs, business metrics, key performance indicators, financial dashboards, or metric definition documents.
  Do NOT use for product metrics (use metrics-framework), P&L analysis (use pl-analysis), or personal finance tracking (use budget-planning).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "analysis planning strategy report spreadsheets"
  category: "business-strategy"
  subcategory: "finance-accounting"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Financial KPIs

## When to Use

**Use this skill when:**
- A founder, CFO, or finance lead asks to define, document, or redesign the financial KPIs their business tracks
- A user wants to build a board-ready financial scorecard or monthly financial dashboard with metric definitions, formulas, and targets
- A user needs to establish which financial metrics to track for a specific business model (SaaS, e-commerce, marketplace, professional services, manufacturing, media)
- A user wants to create a KPI dictionary or metric definition document so the entire organization uses consistent formulas and data sources
- A user needs to establish a review cadence and accountability structure for financial performance monitoring across executive, board, and department levels
- A user is preparing for a fundraise and wants to identify the metrics investors in their space expect to see defined and tracked
- A user wants to add financial alert thresholds (red/yellow/green) so the team knows when a metric requires immediate action versus monitoring

**Do NOT use this skill when:**
- The user needs product engagement metrics, activation rates, feature adoption, or DAU/MAU analysis -- use `metrics-framework` instead
- The user wants to analyze an existing P&L line by line, identify expense anomalies, or reconcile budget versus actuals -- use `pl-analysis` instead
- The user needs personal finance tracking, household budgeting, or individual investment tracking -- use `budget-planning` instead
- The user wants to build a full integrated financial model (3-statement model, DCF, scenario analysis) -- use `financial-model-structure` instead
- The user is asking about a single metric definition in isolation with no need for a broader framework -- answer directly without invoking this full skill
- The user wants to track HR or headcount metrics exclusively (use an HR analytics framework instead)
- The user needs a custom investor data room with financial exhibits -- this skill defines KPIs, it does not format investor decks

---

## Process

### Step 1: Gather Business Context Before Selecting Any Metrics

Never present a generic list of KPIs without understanding the business first. Ask explicitly for the following, or infer from conversation context:

- **Business model:** SaaS (B2B or B2C), e-commerce (owned inventory or dropship), marketplace (two-sided or aggregator), professional services (project-based or retainer), manufacturing (made-to-order or inventory-based), media/content, fintech/financial services. The business model determines which metrics are meaningful.
- **Stage:** Pre-revenue (burn and runway only), seed/early revenue (unit economics emerging), Series A-B (growth efficiency), Series C+ or mature (margin optimization and capital efficiency). Never present a full 15-metric dashboard to a pre-revenue company.
- **Reporting audience:** Board and investors care about different metrics than department heads. Investors want rule of 40, LTV/CAC, and burn multiple. Department heads want budget variance, headcount productivity, and segment margin.
- **Current tracking state:** What metrics are already tracked? In what system? In Excel/Google Sheets, a BI tool (Looker, Tableau, Metabase), an accounting package (QuickBooks, Xero, NetSuite), or a purpose-built tool (Mosaic, Cube, Causal)? This determines whether data sources are realistic.
- **Decision context:** What decisions are these metrics meant to support? Hiring decisions? Marketing spend allocation? Board fundraising narrative? Pricing changes? KPIs should be directly tied to decisions, not vanity tracking.
- **Pain points:** What metric is being misunderstood or calculated inconsistently across the team today? Gross margin and NRR are the most frequently miscalculated metrics in early-stage companies.

### Step 2: Select the Right KPI Categories for the Business Type

Choose KPIs from the following categories, weighted by business model relevance. The total set should be 10-15 metrics for operational dashboards and 6-8 for board packages. More metrics are a sign of unclear priorities.

**Revenue metrics** (every business):
- Total revenue (GAAP) -- recognize when earned, not when invoiced or collected
- Revenue growth rate (MoM for early stage, YoY for mature stage)
- Recurring vs. non-recurring revenue split (critical for valuation multiple)
- Revenue by segment or product line (required once multiple offerings exist)

**Profitability metrics** (every business):
- Gross profit and gross margin % -- this is the single most important margin metric; anything below 40% signals a structural cost problem in software businesses
- Contribution margin by segment -- revenue minus directly attributable variable costs
- EBITDA and EBITDA margin -- most relevant for businesses with >$5M revenue
- Net income margin -- GAAP net profit divided by total revenue

**Unit economics** (required for venture-backed or high-growth businesses):
- Customer Acquisition Cost (CAC) -- all S&M spend divided by new customers acquired in the same period (match the time period)
- LTV (Lifetime Value) -- for SaaS: ARPU divided by monthly churn rate; for transactional: average order value × purchase frequency × gross margin × customer lifespan
- LTV/CAC ratio -- target >3x for SaaS, >2x for e-commerce; below 1x means you are destroying value with each customer acquired
- CAC payback period -- months of gross profit needed to recover the cost to acquire the customer; target <12 months for SaaS, <6 months for high-velocity e-commerce

**Cash and liquidity metrics** (every business, especially startups):
- Cash balance (point in time)
- Net burn rate -- total cash out minus total cash in per month; do not confuse with gross burn (total cash out only)
- Runway months -- current cash divided by net burn rate; minimum safe threshold is 12 months, comfortable is 18+ months
- Current ratio -- current assets divided by current liabilities; below 1.0 is a liquidity warning
- Days Sales Outstanding (DSO) -- average receivables divided by average daily revenue; high DSO in B2B means collections are lagging

**Efficiency and capital metrics** (growth and mature stage):
- Burn multiple -- net burn divided by net new ARR; below 1.0 is exceptional, above 2.0 requires explanation at Series B+
- Revenue per employee -- total revenue divided by full-time headcount; $150K-$200K is a reasonable Series A target, $300K+ is excellent
- Rule of 40 -- ARR growth rate % plus EBITDA margin %; the combined score should exceed 40 for healthy SaaS businesses
- CapEx as % of revenue -- relevant for businesses with physical assets; above 10% in a software company signals infrastructure overcapitalization

**SaaS-specific retention metrics:**
- MRR and ARR -- MRR is total monthly recurring revenue; ARR is MRR × 12 (not the sum of annual contracts, which is a common error)
- Net Revenue Retention (NRR) -- the single most important SaaS growth metric after ARR growth; measures expansion minus churn as a % of prior period ARR; above 120% is world-class, 100-110% is healthy, below 95% is a red flag
- Gross Revenue Retention (GRR) -- NRR excluding expansion revenue; measures pure churn; should be >85% for B2B SaaS, >75% for B2C SaaS
- Monthly logo churn -- number of customers churned divided by starting customer count; 2-3% monthly is high for B2B, acceptable for very low-ACV products
- Expansion MRR rate -- net new MRR from upsell/cross-sell as % of starting MRR; a healthy expansion engine means the sales team does not need to find all growth from new customers

**E-commerce and marketplace-specific metrics:**
- Average Order Value (AOV) -- total revenue divided by total orders
- Repeat purchase rate -- % of customers who make a second purchase within 90 days or within a defined window
- Inventory turnover -- COGS divided by average inventory; below 4x annually in retail is concerning
- GMV (Gross Merchandise Value) -- total transaction value flowing through the marketplace before the take rate
- Take rate -- marketplace revenue divided by GMV; most two-sided marketplaces run 10-25% take rates
- Return rate -- units returned divided by units sold; above 20% in apparel or above 8% in electronics signals product or description quality issues

### Step 3: Define Every KPI with Full Specification

A metric name without a complete definition is worse than no metric at all -- different team members will calculate it differently and compare incompatible numbers. For every KPI, document all of the following attributes:

- **Name:** Unambiguous. "Revenue" is ambiguous. "Net Revenue (GAAP, excluding refunds)" is unambiguous.
- **Formula:** The exact mathematical expression. Define every variable in the formula. For example: MRR = (sum of all active subscription monthly recurring amounts as of the last day of the month, excluding one-time fees, setup fees, and professional services revenue).
- **Numerator definition:** Specify inclusions and exclusions explicitly. Gross margin is most frequently miscalculated because teams disagree on what belongs in COGS.
- **Denominator definition:** Specify the time period (beginning of period? end of period? average? trailing twelve months?).
- **Data source:** Name the specific system and report. "Stripe MRR report" or "QuickBooks Profit & Loss, month-to-date, cash basis" is acceptable. "Accounting system" is not.
- **Calculation frequency:** Daily, weekly, monthly, quarterly. Some metrics (cash balance) update daily; others (NRR) are only meaningful on a trailing twelve-month basis.
- **Target:** A specific number, not a direction. "Higher" is not a target. "$1.5M ARR by December 31" is a target.
- **Target rationale:** Where did the target come from? Board-approved plan? Industry benchmark? Historical growth rate extrapolation? Investor expectation? If you cannot explain where a target came from, it is not credible.
- **Red threshold:** The value at which this metric requires immediate escalation or corrective action.
- **Yellow threshold:** The value at which this metric requires monitoring and a recovery plan.
- **Green threshold:** The value at which this metric is on track.
- **Owner:** A named role (not a team). "VP of Sales" is an owner. "Sales team" is not.
- **Review meeting:** The specific recurring meeting where this metric is discussed, who presents it, and what decision it informs.

### Step 4: Apply Business-Model-Specific KPI Selection Principles

**SaaS (B2B, subscription):**
Core 8: ARR, MRR Growth %, NRR, GRR, CAC, CAC Payback, Burn Multiple, Rule of 40.
Supporting: LTV/CAC, ARR per Employee, Gross Margin, Monthly Churn, Expansion MRR %.
Avoid: revenue metrics that mix recurring and non-recurring without labeling; using ACV as a proxy for ARR without adjusting for mid-year starts.

**E-commerce (direct-to-consumer):**
Core 8: Revenue, Gross Margin %, CAC (blended and by channel), Repeat Purchase Rate, AOV, Return Rate, Contribution Margin, Cash Conversion Cycle.
Supporting: Revenue per Visit, Email List Monetization Rate, Inventory Turnover.
Avoid: confusing gross revenue (before refunds) with net revenue; including shipping revenue in AOV calculations unless standard for the business.

**Marketplace:**
Core 8: GMV, Take Rate, Net Revenue, Liquidity Rate (% of supply-side listings that transact in 30 days), Supply CAC, Demand CAC, Gross Margin, Contribution Margin per Transaction.
Supporting: Repeat transaction rate (supply side), Repeat transaction rate (demand side), Average Transaction Value.
Avoid: using GMV as a revenue proxy for margin discussions; conflating platform revenue with marketplace take rate revenue.

**Professional Services:**
Core 8: Revenue, Gross Margin %, Utilization Rate (billable hours / total available hours), Average Billing Rate (revenue / total billed hours), Revenue per Employee, Pipeline Coverage (pipeline value / quota), Project Margin %, DSO.
Supporting: Backlog months (contracted but unearned revenue / average monthly revenue), Proposal win rate, Realization rate (actual billed hours / hours worked).
Avoid: treating utilization rate targets above 80% as sustainable -- industry benchmarks show above 85% leads to burnout and turnover.

**Manufacturing / Hardware:**
Core 8: Revenue, Gross Margin %, Inventory Turns, DSO, Days Payable Outstanding (DPO), Operating Margin %, CapEx % of Revenue, Cash Conversion Cycle (DSO + DII - DPO).
Supporting: Return on Assets (operating income / total assets), Defect rate (financial impact), Overhead absorption rate.
Avoid: omitting depreciation from COGS in gross margin calculations for capital-intensive businesses -- it materially distorts the margin.

**Fintech / Financial Services:**
Core metrics vary by type, but add: Net Interest Margin (lending), Loss Rate / Default Rate (lending), AUM (asset management), Revenue per AUM (asset management), Combined Ratio (insurance), Claims Ratio (insurance). These are not optional additions -- they are the primary financial health indicators in these models.

### Step 5: Set Targets with Explicit Rationale and Benchmark Context

Every target must have a source. There are four acceptable target-setting methods:

1. **Board-approved plan / budget:** The target is the number from the annual operating plan. Note the approval date. This is the most common source.
2. **Historical trend extrapolation:** Take the last 6-12 months of actuals, fit a trend line, and set the target at the trend line value plus a management stretch of 5-15%. Document the trend data used.
3. **Industry benchmarks:** Use published benchmark sources appropriate to the business type. For SaaS, OpenView SaaS Benchmarks, Bessemer Cloud Index, SaaS Capital data, and KeyBanc SaaS Survey provide publicly available percentile data. For e-commerce, use industry reports from relevant analyst firms. Always note the benchmark source and the quartile being targeted.
4. **Investor / covenant requirement:** For debt-financed companies, revenue or EBITDA covenants from lenders may define hard targets. These must be tracked separately with red thresholds set at the covenant level.

Red/Yellow/Green thresholds should be set as follows:
- Green: At or above target
- Yellow: Within 10-20% below target (the exact band should be set based on volatility -- for a metric that normally moves 5% per month, a 10% miss is significant; for one that moves 20%, a 10% miss is noise)
- Red: More than 20% below target OR at a level that creates business risk regardless of target (e.g., runway below 9 months is red regardless of plan)

### Step 6: Design the Review Cadence with Explicit Meeting Assignments

Cadence design is as important as metric selection. A well-defined metric that is never reviewed in a structured forum does not drive decisions.

**Daily (operational teams only):**
- Cash balance -- relevant for companies with less than 6 months runway or active fundraise
- Revenue bookings -- relevant for high-velocity sales teams closing multiple deals per day
- Refund rate / fraud rate -- relevant for high-volume e-commerce or fintech

**Weekly (leadership team):**
- MRR or revenue run rate (for high-growth companies)
- New customer count / logo adds
- Net burn rate
- Pipeline and bookings (for sales-driven businesses)
- Assigned to: leadership standup or weekly operating review; owner presents their metric

**Monthly (executive team + board materials):**
- Full P&L review with budget variance
- All operating KPIs (full 10-15 metric set)
- Department-level budget versus actual
- Cash flow statement review
- Assigned to: monthly finance review meeting; CFO or finance lead presents; executive team attends

**Quarterly (board and investors):**
- Full KPI dashboard with trend (trailing 4 quarters minimum)
- Benchmark comparisons against industry quartiles
- Target versus actual for the quarter with variance explanation
- Updated full-year forecast
- Capital and burn projection
- Assigned to: board meeting; CEO and CFO present

**Annually:**
- Full KPI target reset for the coming year
- Benchmark refresh (new data published annually for most benchmark sources)
- Metric set review -- retire metrics that are no longer decision-relevant, add metrics for new business lines
- Assigned to: annual planning process; CFO leads, CEO approves, board ratifies

### Step 7: Build the KPI Document with Decision Utility as the Primary Goal

The document must serve two purposes simultaneously: a reference document that can be read by anyone to understand how a metric is defined, and an action document that tells the reader what to do when a metric is off track.

Structure the document in three sections:
1. **Dashboard summary table** -- all KPIs with current value, target, status (red/yellow/green), and trend. This is what goes in the board deck.
2. **KPI definition cards** -- one card per metric with all attributes. This is the reference document.
3. **Review calendar** -- a table showing what is reviewed when, by whom, and in what meeting.

When presenting, start with the dashboard summary. Executives read top-down. Lead with the status, not the definitions.

---

## Output Format

```
## Financial KPI Framework: [Company Name]
**Prepared for:** [Audience -- Board / Executive Team / Department Heads]
**As of:** [Month, Year]
**Business model:** [SaaS / E-commerce / Services / etc.]
**Stage:** [Seed / Series A / Growth / Mature]

---

### Part 1: KPI Dashboard Summary

| # | KPI Category | Metric | Current | Target | Status | Trend (3-mo) |
|---|-------------|--------|---------|--------|--------|--------------|
| 1 | Revenue | [Metric] | [Value] | [Target] | 🟢/🟡/🔴 | ↑ / → / ↓ |
| 2 | Revenue | [Metric] | [Value] | [Target] | 🟢/🟡/🔴 | ↑ / → / ↓ |
| 3 | Profitability | [Metric] | [Value] | [Target] | 🟢/🟡/🔴 | ↑ / → / ↓ |
| 4 | Profitability | [Metric] | [Value] | [Target] | 🟢/🟡/🔴 | ↑ / → / ↓ |
| 5 | Unit Economics | [Metric] | [Value] | [Target] | 🟢/🟡/🔴 | ↑ / → / ↓ |
| 6 | Unit Economics | [Metric] | [Value] | [Target] | 🟢/🟡/🔴 | ↑ / → / ↓ |
| 7 | Cash & Liquidity | [Metric] | [Value] | [Target] | 🟢/🟡/🔴 | ↑ / → / ↓ |
| 8 | Cash & Liquidity | [Metric] | [Value] | [Target] | 🟢/🟡/🔴 | ↑ / → / ↓ |
| 9 | Efficiency | [Metric] | [Value] | [Target] | 🟢/🟡/🔴 | ↑ / → / ↓ |
| 10 | Efficiency | [Metric] | [Value] | [Target] | 🟢/🟡/🔴 | ↑ / → / ↓ |

**Metrics requiring immediate attention:** [List red-status metrics with one-sentence context]

---

### Part 2: KPI Definitions

#### [#]. [Metric Name]

| Attribute | Specification |
|-----------|--------------|
| **Category** | [Revenue / Profitability / Unit Economics / Cash / Efficiency] |
| **Formula** | [Full mathematical expression with every variable defined] |
| **Inclusions** | [What is explicitly counted in the numerator/denominator] |
| **Exclusions** | [What is explicitly excluded -- this prevents the most common mismatches] |
| **Data source** | [Specific system and report name -- e.g., "Stripe dashboard > MRR report, last day of month"] |
| **Calculation frequency** | [Daily / Weekly / Monthly / Quarterly / Trailing 12 months] |
| **Target** | [Specific numeric target] |
| **Target rationale** | [Board plan / benchmark source / historical trend] |
| **Green (on track)** | [Value range or threshold] |
| **Yellow (watch)** | [Value range or threshold] |
| **Red (action required)** | [Value range or threshold] |
| **Owner** | [Named role, not a team] |
| **Review meeting** | [Meeting name, frequency, presenter] |
| **Alert action** | [What should happen when this metric hits Red -- who is notified, what meeting is convened] |

*(Repeat block for each KPI)*

---

### Part 3: Review Calendar

| Cadence | Metrics Reviewed | Meeting Name | Day/Time | Presenter | Attendees | Output |
|---------|-----------------|-------------|----------|-----------|-----------|--------|
| Daily | [List] | [Meeting] | [Day/Time] | [Role] | [Roles] | [What is produced] |
| Weekly | [List] | [Meeting] | [Day/Time] | [Role] | [Roles] | [What is produced] |
| Monthly | [List] | [Meeting] | [Day/Time] | [Role] | [Roles] | [What is produced] |
| Quarterly | [List] | [Meeting] | [Day/Time] | [Role] | [Roles] | [What is produced] |
| Annually | [List] | [Meeting] | [Period] | [Role] | [Roles] | [What is produced] |

---

### Part 4: Benchmark Context

| KPI | Company Current | Industry Median | Top Quartile | Benchmark Source | Our Target Percentile |
|-----|----------------|----------------|-------------|-----------------|----------------------|
| [Metric] | [Value] | [Value] | [Value] | [Source, year] | [Target percentile] |

---

### Part 5: Metric Change Log

| Date | Metric | Change | Reason | Approved By |
|------|--------|--------|--------|-------------|
| [Date] | [Metric name] | [What changed -- formula, target, data source] | [Why] | [Who approved] |
```

---

## Rules

1. **Every KPI must have an exact formula with every variable defined.** "Gross margin" without a definition of what belongs in COGS is not a KPI -- it is an argument waiting to happen. The most common gross margin errors: (a) excluding cloud infrastructure costs from SaaS COGS, (b) excluding merchant processing fees from e-commerce COGS, (c) excluding customer success salaries from SaaS COGS. Gross margin for software businesses should include: hosting/infrastructure, customer support, customer success costs directly attributable to delivery, and third-party software costs embedded in the product.

2. **Do not confuse ARR with ACV.** ARR is MRR multiplied by 12, calculated as of a specific date using all active subscriptions. Annual Contract Value (ACV) is the annualized value of contracts signed during a period, which is a bookings metric, not a revenue metric. These are frequently conflated in investor conversations and board decks, and the confusion materially misrepresents the business.

3. **Net Revenue Retention must be calculated on a cohort basis over a defined trailing period.** The standard definition is: take the ARR from customers active 12 months ago, measure what that same cohort contributes today (including expansion, contraction, and churn), and divide by the starting ARR. Do not include revenue from customers acquired in the past 12 months -- that inflates NRR by mixing cohort retention with new customer growth.

4. **CAC must be calculated with the correct time-lag adjustment.** Marketing spend in Month 1 does not generate customers in Month 1 -- it generates customers 1-3 months later depending on sales cycle length. For businesses with a 2-month average sales cycle, divide total S&M spend from 2 months ago by new customers acquired this month. Using same-month spend and same-month customers systematically overstates CAC efficiency in periods of accelerating spend and understates it in periods of decelerating spend.

5. **Burn multiple must use net burn, not gross burn.** Net burn = total cash out minus total cash in from operations. Gross burn = total cash out only. Gross burn is relevant for understanding cash consumption; net burn is relevant for understanding capital efficiency. A company with $500K gross burn and $400K revenue has $100K net burn -- reporting $500K burn to the board misrepresents the efficiency of the business.

6. **Limit the board KPI package to 6-8 metrics maximum.** Board members are generalists evaluating multiple portfolio companies. A 15-metric dashboard requires 45 minutes to review properly and will be skimmed in 5. Choose the 6-8 metrics that most directly indicate whether the company is on track to achieve its strategic objectives. The full 10-15 metric dashboard belongs in the monthly operating review, not the board deck.

7. **All KPI targets must be connected to a source.** An undocumented target is a target that will be renegotiated under pressure. Document whether the target came from the board-approved budget, a lender covenant, a benchmark percentile, or a management decision. This creates accountability and prevents goalpost-moving when performance is disappointing.

8. **Every metric must have a named human owner, not a team or department.** "Finance team owns gross margin" means no one owns gross margin. "CFO owns gross margin, with VP Engineering accountable for the infrastructure cost component of COGS" is an ownership structure that can drive action.

9. **Pre-revenue and pre-product-market-fit companies need a minimal KPI set.** A 5-person pre-revenue startup should track exactly four metrics: cash balance, net burn rate, runway months, and one leading indicator of product-market fit (could be weekly active users, pilot customer count, or letters of intent signed). Adding revenue efficiency metrics before there is revenue creates the illusion of rigor while wasting time. Expand the KPI set as revenue materializes.

10. **Rule of 40 is a summary metric, not a primary metric.** It tells you whether the growth/profitability tradeoff is in an acceptable zone, but it does not tell you what to do. A company at Rule of 35 with 80% growth and negative 45% EBITDA margin is in a very different position than a company at Rule of 35 with 10% growth and positive 25% EBITDA margin. Always show the component metrics alongside Rule of 40.

11. **Cash runway must be calculated on a forward-looking basis, not historical average burn.** If burn is accelerating (headcount additions in the pipeline, large marketing campaigns committed), the runway calculated on trailing 3-month average burn will overstate actual runway. Use the projected monthly burn for each future month based on known committed spend. This is particularly important in the 12 months following a fundraise when hiring plans are aggressive.

12. **Financial KPIs must be based on GAAP or clearly labeled as non-GAAP.** Cash-basis accounting, unearned deferred revenue, and GAAP adjustments for stock-based compensation all affect metric values. When presenting metrics based on non-GAAP definitions (adjusted EBITDA excluding SBC is the most common), label them explicitly. Investors and acquirers will reconcile to GAAP numbers, and unexplained differences create distrust.

---

## Edge Cases

**Very early-stage startup with fewer than 6 months of operating data:**
Do not build a full KPI framework when there is insufficient historical data to identify trends. A KPI without a trend is less useful than a KPI with 12 months of trend data. For pre-Series A companies, recommend tracking exactly: (1) cash balance and net burn (weekly), (2) runway months (monthly), (3) one revenue metric if revenue exists, and (4) one leading indicator specific to the business model (paid pilots, LOIs signed, activated users depending on model). Document the metric framework now so it is ready to expand at the 6-month mark, but do not pretend a green/yellow/red status means anything when there is no trend to evaluate it against.

**Company with no dedicated finance function:**
When a non-finance founder asks for a KPI framework and the company has no CFO, controller, or finance hire, the data source step is the critical failure point. Before defining target metrics, audit what data actually exists and in what form. A metric whose data source is "I would need to manually calculate this each month" will not be tracked consistently. For these companies, prioritize metrics that can be pulled automatically from existing systems (Stripe dashboard for MRR, QuickBooks for P&L metrics, Google Analytics or Shopify for e-commerce metrics). The right KPI framework is the one that will actually be maintained, not the theoretically ideal one.

**Multi-entity or multi-currency business:**
Consolidated metrics must specify the FX treatment explicitly. Common choices: (a) report in functional currency of the parent entity, converting subsidiary metrics at the period-end spot rate; (b) report in functional currency using average rate for the period for income statement metrics and spot rate for balance sheet metrics; (c) report segment metrics in local currency and provide a consolidated view in USD. Each choice is defensible, but mixing approaches within the same KPI set is not. Establish the FX policy once and enforce it across all metrics.

**Company transitioning business models (e.g., perpetual license to SaaS):**
Track both the legacy model metrics and the new model metrics in parallel during the transition period. Do not try to combine them into a single revenue metric -- it will obscure whether the transition is succeeding. Define explicit milestones: (1) the date when new-model ARR crosses legacy model annual revenue, (2) the percentage of total revenue that is recurring versus non-recurring, and (3) the gross margin trajectory as the mix shifts. Set separate targets for legacy and new-model metrics, and define the crossover point as a key strategic milestone in the KPI framework.

**Seasonally volatile business (retail, travel, events, agriculture):**
Year-over-year comparisons are more meaningful than month-over-month for highly seasonal businesses. For a business where Q4 represents 40% of annual revenue, a 30% MoM revenue decline in January is not a red-flag event -- it is expected seasonal normalization. Design the KPI thresholds to account for seasonality by using year-over-year comparisons as the primary trend metric, seasonal indices to adjust monthly targets (if Q4 is always 2x the average month, target for Q4 should be 2x the annual average monthly target), and cumulative YTD tracking to smooth seasonal volatility in status assessments.

**Regulated industry (banking, insurance, lending, healthcare):**
Add regulatory financial metrics as first-class KPIs, not footnotes. For banks and credit unions: Tier 1 Capital Ratio (regulatory minimum 6%, well-capitalized threshold 8%), Net Interest Margin, Non-Performing Loan Ratio, Efficiency Ratio (non-interest expense / net revenue; below 60% is healthy). For insurance: Combined Ratio (loss ratio + expense ratio; below 100% means underwriting profit), Claims Ratio, Expense Ratio. For lending: Default Rate, Loss Reserve Ratio, Yield on Loans. These metrics carry covenant implications and regulatory reporting obligations -- treat them as hard constraints, not aspirational targets.

**Company preparing for acquisition or IPO (12-18 months out):**
The KPI framework must be aligned to how the company will be valued in the transaction. For SaaS acquisitions, buyers apply revenue multiples to ARR and scrutinize NRR, gross margin, and CAC payback above all other metrics. For IPOs, the SEC requires specific financial disclosures and the company must demonstrate consistent GAAP financial reporting. Begin transitioning all metrics to GAAP-compliant definitions at least 18 months before a planned liquidity event. Identify any non-GAAP metrics currently in use and quantify the reconciliation impact. Common issues: deferred revenue recognition timing, capitalized software development costs affecting gross margin, and earnout structures affecting revenue recognition.

**Non-profit or grant-funded organization:**
Replace revenue growth and profitability metrics with mission-delivery efficiency metrics. The financial KPI equivalents for non-profits are: (1) Program Expense Ratio -- program expenses as % of total expenses; above 75% is considered efficient by most charity evaluators; (2) Administrative Cost Ratio -- G&A as % of total expenses; below 15% is generally acceptable; (3) Fundraising Efficiency -- revenue generated per dollar of fundraising expense; above $3 per dollar is good; (4) Reserve Months -- unrestricted net assets divided by average monthly operating expenses; 3-6 months is the equivalent of runway; (5) Grant Utilization Rate -- % of grant funding deployed versus total grant received for each active grant; underspending grants has consequences in subsequent funding cycles.

---

## Example

**Input:** "We're a Series A B2B SaaS company. $1.4M ARR, growing about 12% month over month, 210 customers, 28 employees. Average contract is around $6,700 ACV. We're preparing for our first formal board meeting next month and need to define the financial KPIs we'll track and report. We use Stripe for billing, QuickBooks for accounting, and HubSpot CRM. The board is three people -- two VCs and one independent director."

---

## Financial KPI Framework: [Company]
**Prepared for:** Board of Directors (2 VC members, 1 independent director)
**As of:** October 2024
**Business model:** B2B SaaS, subscription
**Stage:** Series A
**Reporting systems:** Stripe (billing), QuickBooks Online (accounting), HubSpot (CRM)

---

### Part 1: KPI Dashboard Summary

| # | Category | Metric | Current | Target (EOY) | Status | Trend (3-mo) |
|---|----------|--------|---------|-------------|--------|--------------|
| 1 | Revenue | ARR | $1.4M | $2.4M | 🟡 | ↑ |
| 2 | Revenue | MRR Growth (MoM) | 12% | 12% | 🟢 | → |
| 3 | Profitability | Gross Margin | 74% | 78% | 🟡 | ↑ |
| 4 | Retention | Net Revenue Retention | 108% | 115% | 🟡 | ↑ |
| 5 | Retention | Gross Revenue Retention | 87% | 90% | 🟡 | → |
| 6 | Unit Economics | CAC (blended) | $5,100 | <$4,000 | 🔴 | → |
| 7 | Unit Economics | CAC Payback Period | 14 months | <12 months | 🔴 | → |
| 8 | Unit Economics | LTV/CAC | 2.4x | >3.0x | 🟡 | ↑ |
| 9 | Cash | Net Burn Rate | $82K/mo | <$70K/mo | 🟡 | ↑ improving |
| 10 | Cash | Cash Runway | 21 months | >18 months | 🟢 | Stable |
| 11 | Efficiency | Burn Multiple | 1.9x | <1.5x | 🟡 | Improving |
| 12 | Efficiency | ARR per Employee | $50K | $70K | 🟡 | ↑ |
| 13 | Efficiency | Rule of 40 | 44 | >40 | 🟢 | ↑ |

**Metrics requiring immediate attention:**
- **CAC ($5,100 vs. $4,000 target):** S&M spend increased 35% in Q3 ahead of a new market segment push; new customer volume has not yet increased proportionally. Next review point: November CAC with full Q3 cohort reflected.
- **CAC Payback (14 months vs. 12-month target):** Directly tied to elevated CAC above. Gross margin improvement on track to bring payback period down as CAC normalizes.

---

### Part 2: KPI Definitions

#### 1. Annual Recurring Revenue (ARR)

| Attribute | Specification |
|-----------|--------------|
| **Category** | Revenue |
| **Formula** | ARR = Sum of all active subscription MRRs as of the last calendar day of the month × 12 |
| **Inclusions** | All active recurring subscription fees; multi-year contracts recognized at the annualized monthly amount |
| **Exclusions** | One-time implementation fees; professional services fees; usage-based overages above the subscription floor; refunded amounts |
| **Data source** | Stripe Dashboard > Revenue Recognition > Subscription MRR Report, pulled on the last business day of each month. Reconcile monthly to QuickBooks deferred revenue schedule. |
| **Calculation frequency** | Monthly snapshot (last day of month), reported at every board meeting |
| **Target** | $2.4M ARR by December 31, 2024 |
| **Target rationale** | Board-approved Series A operating plan; represents 71% ARR growth from January 2024 starting ARR of $1.4M |
| **Green** | ARR growth on or above the monthly milestone path to $2.4M EOY |
| **Yellow** | ARR trailing EOY milestone by 5-15% |
| **Red** | ARR trailing EOY milestone by more than 15%, or negative net ARR change in any month |
| **Owner** | CEO (strategic accountability); CFO (data integrity) |
| **Review meeting** | Monthly: Finance review meeting (CFO presents); Quarterly: Board meeting (CEO presents) |
| **Alert action** | Red status triggers an unscheduled CFO + CEO call within 48 hours and a board memo within one week |

---

#### 2. MRR Growth Rate (Month over Month)

| Attribute | Specification |
|-----------|--------------|
| **Category** | Revenue |
| **Formula** | MRR Growth % = (MRR This Month -- MRR Last Month) / MRR Last Month × 100 |
| **Inclusions** | New MRR from new customers; expansion MRR from existing customers upgrading; contraction and churn reduce MRR and are reflected in the net figure |
| **Exclusions** | One-time fees; non-recurring revenue |
| **Data source** | Stripe MRR report, month-end; reconcile to QuickBooks monthly revenue recognition |
| **Calculation frequency** | Monthly |
| **Target** | 12% MoM growth, sustained through EOY 2024 |
| **Target rationale** | 12% MoM = approximately 290% ARR growth on an annualized basis; required to reach $2.4M EOY from $1.4M today |
| **Green** | ≥12% MoM |
| **Yellow** | 8-11.9% MoM |
| **Red** | Below 8% MoM for two consecutive months |
| **Owner** | VP Sales (new MRR); VP Customer Success (expansion and retention impact) |
| **Review meeting** | Weekly: Leadership standup (CEO reviews); Monthly: Finance review; Quarterly: Board |
| **Alert action** | Two consecutive red months trigger a sales pipeline and retention deep-dive review |

---

#### 3. Gross Margin

| Attribute | Specification |
|-----------|--------------|
| **Category** | Profitability |
| **Formula** | Gross Margin % = (Net Revenue -- COGS) / Net Revenue × 100 |
| **Inclusions in COGS** | AWS/GCP/Azure hosting and infrastructure; third-party SaaS tools embedded in product delivery (e.g., Twilio, SendGrid, Segment); customer support salaries and benefits (support engineers, onboarding specialists); customer success manager time directly attributable to implementation and onboarding (not ongoing relationship management) |
| **Exclusions from COGS** | Sales salaries; marketing spend; G&A; R&D/engineering salaries for new product development; customer success relationship management costs (these belong in S&M) |
| **Data source** | QuickBooks Profit & Loss report, accrual basis, month-to-date. Infrastructure costs pulled from AWS Cost Explorer monthly. |
| **Calculation frequency** | Monthly |
| **Target** | 78% gross margin by December 2024 |
| **Target rationale** | Current 74%; improvement driven by infrastructure cost optimization project underway and revenue scaling over fixed infrastructure. Top-quartile B2B SaaS gross margin is 78-82% per OpenView 2023 SaaS Benchmarks. |
| **Green** | ≥78% |
| **Yellow** | 72-77.9% |
| **Red** | Below 72% (signals structural COGS issue or revenue recognition problem) |
| **Owner** | CFO (overall); VP Engineering (infrastructure cost component) |
| **Review meeting** | Monthly: Finance review meeting; Quarterly: Board |
| **Alert action** | Red status triggers COGS line-item review by CFO and VP Engineering within two weeks |

---

#### 4. Net Revenue Retention (NRR)

| Attribute | Specification |
|-----------|--------------|
| **Category** | Retention |
| **Formula** | NRR = (Starting ARR of 12-month-ago cohort + Expansion -- Contraction -- Churn from that cohort) / Starting ARR of that cohort × 100 |
| **Inclusions** | All ARR changes from customers who were active 12 months ago: upsells to higher tiers, seat expansions, add-on modules, price increases; minus downgrades, seat reductions, and full cancellations |
| **Exclusions** | ARR from customers acquired in the past 12 months (this is the most critical exclusion -- mixing new customer revenue inflates NRR) |
| **Data source** | Stripe subscription history export, processed in CFO's NRR tracking spreadsheet (Google Sheets link: [internal link]) reconciled quarterly to QuickBooks |
| **Calculation frequency** | Monthly, reported as trailing 12-month figure |
| **Target** | 115% NRR |
| **Target rationale** | Current 108%; 115% is the median for high-performing Series A B2B SaaS companies per SaaS Capital 2023 data. At 115% NRR, revenue from the existing customer base grows 15% annually with zero new customer acquisition. |
| **Green** | ≥115% |
| **Yellow** | 100-114.9% (growing, but below target) |
| **Red** | Below 100% (existing customer base is contracting in revenue terms -- structurally dangerous regardless of new customer growth) |
| **Owner** | VP Customer Success |
| **Review meeting** | Monthly: CS team weekly review (VP CS presents); Monthly: Finance review; Quarterly: Board |
| **Alert action** | Red status immediately triggers a full customer health audit and executive escalation process |

---

#### 5. Customer Acquisition Cost (CAC)

| Attribute | Specification |
|-----------|--------------|
| **Category** | Unit Economics |
| **Formula** | CAC = Total Sales & Marketing Spend (2 months prior) / New Customers Acquired (this month) |
| **Inclusions in S&M spend** | All sales salaries and commissions; all marketing salaries; paid advertising; events and conferences; marketing software (HubSpot subscription); sales tools (LinkedIn Sales Navigator, Outreach, etc.); agency fees for marketing |
| **Exclusions from S&M spend** | Customer success costs (post-sale); product marketing costs allocated to retention |
| **Time-lag adjustment** | Given average sales cycle of approximately 2 months (from HubSpot closed-won stage timestamps), divide S&M spend from 2 months prior by new customers acquired this month. Recalibrate the lag quarterly using actual average deal close time from HubSpot. |
| **Data source** | QuickBooks S&M expense report for the lag period; HubSpot for new customer count (closed-won, this month) |
| **Calculation frequency** | Monthly |
| **Target** | CAC below $4,000 by EOY 2024 |
| **Target rationale** | Current $5,100; target based on achieving LTV/CAC of 3.0x with current LTV of ~$12,000 |
| **Green** | ≤$4,000 |
| **Yellow** | $4,001-$5,000 |
| **Red** | Above $5,000 (current level; requires active management) |
| **Owner** | VP Sales (sales efficiency component); VP Marketing (demand generation efficiency component) |
| **Review meeting** | Monthly: Finance review; Quarterly: Board with trend chart |
| **Alert action** | Red status for two consecutive months triggers S&M spend audit and channel-level CAC breakdown |

---

#### 6. Cash Runway

| Attribute | Specification |
|-----------|--------------|
| **Category** | Cash & Liquidity |
| **Formula** | Runway Months = Current Cash Balance / Projected Monthly Net Burn Rate (forward-looking, not trailing average) |
| **Inclusions in net burn** | All cash outflows from operations; cash inflows from customer payments; excludes one-time financing events (fundraise proceeds) from the denominator |
| **Forward-looking adjustment** | Runway is calculated using projected burn for each of the next 6 months based on committed headcount, known vendor contracts, and approved budget. Not a simple trailing 3-month average -- that method overstates runway when hiring is accelerating. |
| **Data source** | QuickBooks cash balance (bank reconciliation, as of last business day of month); 6-month burn projection maintained in CFO's rolling cash model (Google Sheets) |
| **Calculation frequency** | Monthly; updated weekly if runway drops below 12 months |
| **Target** | Maintain ≥18 months runway at all times |
| **Target rationale** | 18 months provides enough time to either achieve profitability or raise the next round without distressed fundraising. Board-established minimum. |
| **Green** | ≥18 months |
| **Yellow** | 12-17.9 months (initiate next fundraise planning) |
| **Red** | Below 12 months (fundraise must be active, not planned) |
| **Owner** | CFO |
| **Review meeting** | Weekly: Leadership standup; Monthly: Finance review; Quarterly: Board |
| **Alert action** | Yellow status triggers fundraise readiness review with CEO and board chair within 30 days |

---

#### 7. Burn Multiple

| Attribute | Specification |
|-----------|--------------|
| **Category** | Efficiency |
| **Formula** | Burn Multiple = Net Cash Burn (monthly) / Net New ARR (monthly) |
| **Net cash burn definition** | Total cash out from operations minus total cash in from customer payments for the same month (not gross burn) |
| **Net new ARR definition** | New ARR from new customers + expansion ARR -- churned ARR -- contracted ARR for the same month |
| **Interpretation** | A burn multiple of 1.5x means the company spends $1.50 in net cash to generate $1.00 of net new ARR. Below 1.0x is capital-efficient. Above 2.0x requires explanation at Series B and above. |
| **Data source** | Net burn: QuickBooks cash flow statement, operating activities only; Net new ARR: Stripe MRR movement report |
| **Calculation frequency** | Monthly; reported as trailing 3-month average to smooth volatility |
| **Target** | <1.5x burn multiple |
| **Target rationale** | Current 1.9x; 1.5x is the Series A benchmark for capital efficiency per Bessemer Cloud benchmarks. At 1.5x with $82K net burn, net new ARR should be approximately $55K/month ($660K net new ARR annually). |
| **Green** | ≤1.5x |
| **Yellow** | 1.5-2.0x |
| **Red** | Above 2.0x |
| **Owner** | CFO (overall); CEO (strategic allocation of capital between growth and efficiency) |
| **Review meeting** | Monthly: Finance review; Quarterly: Board |
| **Alert action** | Red status triggers a headcount and S&M spend review to identify efficiency improvements |

---

### Part 3: Review Calendar

| Cadence | Metrics | Meeting Name | Timing | Presenter | Attendees | Output |
|---------|---------|-------------|--------|-----------|-----------|--------|
| Weekly | MRR, net burn, new customer count | Leadership Standup | Every Monday, 9am | VP Sales (MRR), CFO (burn) | CEO, CFO, VP Sales, VP CS, VP Eng | Verbal update; red flags escalated to CEO same day |
| Monthly | All 13 KPIs + budget variance | Monthly Finance Review | First Tuesday of month, 2pm | CFO | Executive team | Written memo + KPI dashboard; distributed to board within 5 business days |
| Quarterly | All 13 KPIs + trailing 4Q trends + benchmarks | Board Meeting | Quarterly per board calendar | CEO (strategy narrative), CFO (metrics) | Board + executives | Board deck; KPI slides in standard format; updated benchmark
