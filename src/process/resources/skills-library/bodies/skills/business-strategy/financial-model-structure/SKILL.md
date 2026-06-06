---
name: financial-model-structure
description: |
  Builds a three-statement financial model architecture with revenue model, cost structure, P&L, balance sheet, and cash flow statement linked by core assumptions. Use when the user asks about financial modeling, building a financial model, startup financial projections, or structuring financial statements.
  Do NOT use for personal budgeting (use budget-planning), tax planning (use tax-preparation), or investment portfolio analysis.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "planning analysis strategy spreadsheets report"
  category: "business-strategy"
  subcategory: "finance-accounting"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---
# Financial Model Structure

## When to Use

**Use this skill when:**
- The user explicitly asks to build a three-statement financial model -- income statement, balance sheet, and cash flow statement -- linked through shared assumptions
- The user needs startup financial projections for fundraising (seed, Series A/B, venture debt), board reporting, or a lender package (SBA, bank covenant compliance)
- The user wants to model a specific business type (SaaS, e-commerce, marketplace, services, manufacturing, hardware, media/content) with drivers specific to that vertical
- The user has partial financial data (actuals for some periods) and needs a forward-looking model that anchors to those actuals and projects forward
- The user needs scenario analysis or sensitivity tables to stress-test key assumptions before presenting to investors or a board
- The user wants to understand how their unit economics (CAC, LTV, payback period, contribution margin) roll up into a company-level P&L and cash position
- The user is building a financial model for a capital allocation decision -- hiring plan, geographic expansion, product line extension -- and needs to see the full cash impact

**Do NOT use this skill when:**
- The user needs personal budgeting, household cash flow, or debt paydown planning -- use `budget-planning` instead
- The user needs tax return preparation, tax optimization strategies, or entity structure advice for tax purposes -- use `tax-preparation` instead
- The user is asking for investment portfolio analysis, stock valuation, or DCF analysis for an acquisition target -- use `investment-analysis` or `dcf-valuation` instead
- The user only needs a standalone P&L review or variance analysis of existing statements -- use `pl-analysis` instead
- The user only needs to calculate unit economics in isolation (LTV, CAC, payback period, contribution margin) without rolling up to a full model -- use `unit-economics` instead
- The user needs accounting help to close books, categorize transactions, or reconcile accounts -- use `accounting-reconciliation` instead

---

## Process

### Step 1: Clarify Model Purpose, Scope, and Audience

Before building a single cell, establish the constraints that govern every architectural decision.

- **Identify the primary audience and their frame of reference.** A seed investor cares about TAM capture rate, payback period, and runway. A bank loan officer cares about DSCR (debt service coverage ratio, target >1.25x), tangible net worth, and cash conversion cycle. A board cares about actuals-to-budget variance and rolling 12-month forecast. Each audience requires different emphasis in the model.
- **Pin down the time horizon and granularity.** The standard convention is monthly for year 1 (or the next 12 months), then quarterly for year 2, then annual for years 3-5. For capital-intensive businesses or businesses with seasonal working capital swings, extend monthly granularity through year 2. Never show less than 3 years for a fundraising model.
- **Establish whether the model is a bottoms-up or tops-down build.** Bottoms-up anchors every revenue line to a specific activity (customers x price, reps x quota). Tops-down anchors to market share capture (TAM x penetration %). Investors heavily prefer bottoms-up because every assumption can be interrogated independently. Use tops-down only as a sanity check against the bottoms-up result, not as the primary methodology.
- **Identify available actuals.** If the company has 6-24 months of operating history, the model must show actuals in left-hand columns and projections in right-hand columns with a clear "actuals/forecast" dividing line. This changes the assumptions sheet -- historical growth rates become an anchor for forward assumptions.
- **Clarify the exit or decision point the model is being built toward.** A Series A raise implies the model must demonstrate a credible path to a specific revenue milestone (often $1-2M ARR for SaaS Series A) and justify a specific funding amount tied to runway. A profitability decision implies the model must show the crossover point at which EBITDA turns positive.
- **Determine the business model archetype** because this dictates which sheet to build first:
  - SaaS / subscription: Start with the cohort-based customer count model
  - E-commerce / transactional: Start with the traffic and conversion funnel
  - Marketplace: Start with GMV build-up with separate supply and demand acquisition
  - Services / professional services: Start with the headcount and utilization model
  - Manufacturing / hardware: Start with unit volume and BOM (bill of materials) cost

---

### Step 2: Build the Assumptions Sheet as the Single Source of Truth

Every hardcoded number in the model lives here and only here. Every formula in every other sheet references this sheet.

- **Structure the assumptions sheet in functional blocks:** (1) Revenue assumptions, (2) Cost and headcount assumptions, (3) Working capital assumptions, (4) CapEx and depreciation assumptions, (5) Financing assumptions (debt terms, equity raise schedule), (6) Tax rate and other policy assumptions.
- **Apply strict color coding.** Blue font on white background = hardcoded assumption (input cell). Black font = formula (never edit directly). Gray background = calculated reference. This is not cosmetic -- it is the mechanism that prevents model errors during scenario switching. Every investment bank and serious finance team uses this convention.
- **Date all assumptions.** Note when the assumption was last updated and its source (e.g., "2.9% Stripe processing fee -- confirmed Q1 2024," "Industry benchmark: SaaS hosting $2-5 per user per month").
- **Include a separate block for sensitivity flags.** These are the 3-5 assumptions that the model is most sensitive to -- typically pricing, churn rate, and new customer acquisition pace for a SaaS business. Label them explicitly. These become the axes of the sensitivity table in step 8.
- **Do not aggregate assumptions prematurely.** Bad: "Revenue growth rate: 30% YoY." Good: "New customer adds per month: 20; Monthly churn rate: 3%; Plan mix Pro/Basic: 35%/65%; Average price per plan." The aggregated growth rate is a result, not an input.
- **For headcount, build a separate headcount tab.** List every role, start date, annual salary, benefits load (typically 15-20% of salary for fully loaded cost), and whether the role is capitalized (R&D eligible for capitalization in some accounting treatments) or expensed. The headcount tab feeds both the P&L (as OpEx line items by department) and the cash flow statement (timing of payroll).

---

### Step 3: Build the Revenue Model with Full Driver Decomposition

Revenue is the most consequential and most scrutinized part of any model. It must be built from first principles, not from a growth rate.

**For SaaS / Subscription businesses:**
- Build a cohort waterfall. Each month's new customers form a cohort. Apply monthly churn to the beginning cohort balance. Add expansion revenue as a percentage of cohort MRR (net revenue retention > 100% means expansion exceeds churn -- the benchmark for strong SaaS is NRR above 110-120%). This produces a monthly customer count and MRR by cohort.
- The summary formula is: Ending Customers = Beginning Customers + New Customers -- Churned Customers. Ending MRR = Beginning MRR + New MRR + Expansion MRR -- Churned MRR. These are two separate calculations and they diverge when customers downgrade without leaving.
- Show ARR as a point-in-time metric (MRR x 12 at end of period), not as a sum of monthly revenues. This is a common model error -- ARR is a run-rate, not a cumulative.
- Separate new logo revenue from expansion revenue from reactivation revenue. Investors want to see these independently because they have different cost of acquisition.

**For E-commerce / Transactional businesses:**
- Build the funnel: Total website sessions → conversion rate → orders → average order value → gross revenue → return rate → net revenue. Apply this to paid and organic channels separately because they have different CAC, conversion rates, and customer lifetime value profiles.
- Repeat purchase modeling: Apply a repeat purchase rate (e.g., 35% of Month 1 buyers make a second purchase within 90 days) to create a returning customer revenue stream that compounds over time. This is often the difference between a model that shows breakeven and one that doesn't.
- Show gross merchandise value (GMV) vs. net revenue explicitly if there are marketplace-like elements (third-party sellers, affiliate fees).

**For Marketplace businesses:**
- Model supply and demand acquisition separately with separate CAC assumptions for each side.
- Revenue = GMV x blended take rate. Show GMV prominently -- it is the primary valuation metric for marketplaces. Break take rate into buyer-side fees, seller-side fees, and payment processing revenue if applicable.
- Model liquidity metrics: listings per market, fill rate, time-to-match. These operationally drive GMV and must be translated into assumptions.

**For Services / Professional Services:**
- Revenue formula: Billable Headcount x Utilization Rate x Average Billing Rate. Utilization benchmark: 65-75% for boutique consulting, 75-85% for staffing/outsourcing. Below 60% utilization is a loss.
- Model the bench cost explicitly -- staff who are hired but not yet billable are a real cost and a common model omission. Bench time is especially high in the first 90 days after hiring.
- Show revenue per employee (RPE) as a sanity check. A well-run services firm typically generates $150K-$300K RPE. If the model shows $500K+ RPE, the utilization or billing rate assumptions are probably wrong.

---

### Step 4: Build the Cost Structure with Correct COGS / OpEx Classification

The COGS vs. OpEx line is not just accounting convention -- it directly determines reported gross margin, which investors use to benchmark the business against comps.

- **COGS / Cost of Revenue includes:** Any cost that is directly incurred to deliver the product or service to a customer -- hosting and infrastructure (for SaaS), payment processing fees, customer onboarding labor, direct materials and manufacturing (for hardware), shipping and fulfillment (for physical products), third-party API costs that are consumed per transaction. Salary costs that belong in COGS: customer success (if primarily onboarding/delivery-focused), implementation engineers, data center operations.
- **OpEx includes:** Sales and Marketing (including salaries of sales reps and SDRs, commission, ad spend, events, PR), Engineering/R&D (product development salaries, tools), General and Administrative (executive salaries, finance, HR, legal, office, insurance, accounting fees). Note: Some companies capitalize a portion of R&D under ASC 350 -- flag this if the company is heading toward an audit.
- **Gross margin benchmarks by category:** SaaS: 65-80% gross margin is healthy; below 60% indicates infrastructure or onboarding cost problems. E-commerce: 30-50% gross margin is typical; below 25% is thin and requires very high volume. Marketplace: 70-90% gross margin is common because marginal costs are low. Services: 25-45% gross margin (billing rate minus direct labor cost). Hardware: 30-50% gross margin depending on BOM and volume.
- **Build costs as formulas linked to drivers, never as static numbers.** Hosting = customer count x cost per customer per month. Sales commissions = new MRR x commission rate x 12 (for annualized deals) or new MRR x commission rate (for monthly). This makes scenarios meaningful -- when you toggle the customer acquisition assumption, costs respond appropriately.
- **Model stock-based compensation (SBC) separately.** SBC is a real cash cost (it dilutes equity) but is non-cash on the P&L (expensed but added back in operating cash flow). Track the annual grant value, vesting schedule, and show SBC as its own P&L line so investors can calculate both GAAP and adjusted EBITDA.
- **Build the headcount plan with start-month precision.** A $150K engineering hire who starts in month 7 costs $75K in year 1, not $150K. This sounds obvious but is wrong in a large fraction of startup models that simply multiply headcount by annual salary.

---

### Step 5: Construct the Income Statement with Correct Linkages

The P&L is the output of the revenue model and cost structure -- it should contain almost no hardcoded numbers, only formulas pulling from other sheets.

- **P&L structure for most businesses:**
  - Revenue (total from revenue model, broken into segments)
  - Less: Cost of Revenue = Gross Profit
  - Gross Margin % (Gross Profit / Revenue) -- show this on every single period
  - Less: Sales and Marketing
  - Less: Research and Development / Engineering
  - Less: General and Administrative
  - = Operating Income (EBIT)
  - Add back: Depreciation and Amortization (to calculate EBITDA separately)
  - Less: Interest Expense (on debt)
  - = Pre-Tax Income (EBT)
  - Less: Income Tax (apply effective tax rate to positive EBT only -- losses do not generate a cash tax benefit for most early-stage companies without prior profits to offset)
  - = Net Income
- **Show EBITDA as a labeled subtotal.** It is the primary operating performance metric used by investors and lenders. For companies with significant D&A, EBIT and EBITDA will diverge materially.
- **Do not show interest income on cash balances unless the balance is above $1M and the rate is meaningful.** Modeling interest income on $50K of cash is noise and signals a lack of judgment.
- **For pre-revenue or early-stage companies:** Show the monthly burn rate explicitly on the P&L or as a summary metric below it. Burn rate = cash consumed per month from operations. Net burn = net change in cash per month. Investors care deeply about the trajectory of burn relative to revenue growth.
- **Deferred revenue treatment:** For annual SaaS contracts, a customer who pays $1,200 upfront generates $100/month in recognized revenue and $1,100 in deferred revenue on the balance sheet. Model this correctly -- cash from annual contracts will appear in the cash flow statement before the revenue appears in the P&L.

---

### Step 6: Construct the Balance Sheet with Mechanical Linkages

The balance sheet is the most technically demanding statement to build correctly. It is a cumulative stock, not a flow -- every period's ending balance feeds the next period's beginning balance.

- **Assets block:**
  - Cash: Must equal ending cash from the cash flow statement -- this is the primary mechanical link between the two statements.
  - Accounts Receivable: Revenue x (DSO / 365) for annual, or Revenue x (DSO / 30) for monthly. For B2B SaaS with net-30 terms, DSO is typically 35-45 days. For direct-to-consumer SaaS (credit card billing), AR is near zero. For B2B services, DSO is often 45-75 days and is a major cash flow drag.
  - Inventory (if applicable): COGS x (Inventory Days / 365). Hardware and physical product companies should model seasonal inventory builds explicitly.
  - Prepaid Expenses: Model as a percentage of operating expenses (typically 3-8%) -- annual software licenses, insurance premiums, event deposits.
  - Fixed Assets (Property, Plant, Equipment): Prior period net PP&E + CapEx purchases -- Depreciation. Use straight-line depreciation for most assets. Useful life assumptions: servers and computing equipment 3-5 years, office furniture and fixtures 7 years, leasehold improvements over lease term.
- **Liabilities block:**
  - Accounts Payable: COGS x (DPO / 365). Stretching payables (increasing DPO) generates cash -- this is a legitimate working capital lever but must be modeled explicitly.
  - Accrued Expenses: Typically payroll accrual (wages earned but not yet paid, 2-4 weeks of payroll) and other accruals. Model as a percentage of operating expenses.
  - Deferred Revenue: Previous deferred revenue + new billings -- revenue recognized in the period. This is a source of cash for companies with annual billing and a model frequently built incorrectly.
  - Debt: Prior balance + new borrowings -- principal repayments. Show the full amortization schedule for each debt facility separately. For venture debt, note the draw schedule and any conversion features.
- **Equity block:**
  - Paid-In Capital: Accumulated equity raised from investors.
  - Retained Earnings: Prior retained earnings + current period net income (or loss). For a startup, this will be a growing negative number (accumulated deficit).
  - The balance check row: Total Assets -- Total Liabilities -- Total Equity = 0. If this is not zero, the model is broken. This check must be visible and labeled.

---

### Step 7: Construct the Cash Flow Statement Using the Indirect Method

The cash flow statement reconciles net income (an accrual accounting concept) to actual cash. Build it using the indirect method, which starts from net income and adjusts.

- **Operating Cash Flow:**
  - Start with net income
  - Add back all non-cash charges: D&A, stock-based compensation, amortization of debt issuance costs
  - Adjust for working capital changes: An increase in AR is a use of cash (subtract). A decrease in AP is also a use of cash (subtract). An increase in deferred revenue is a source of cash (add). An increase in inventory is a use of cash (subtract). The working capital changes are calculated as: (Prior period balance -- current period balance) for assets (because an asset increase means cash went out), and (Current period balance -- prior period balance) for liabilities.
  - The common mistake is getting the sign convention backward on working capital changes. If AR increases from $50K to $80K, operating cash flow decreases by $30K -- the company earned the revenue but did not collect it in cash.
- **Investing Cash Flow:**
  - Capital expenditures (cash paid for PP&E): Always negative (cash outflow). Pull from the CapEx schedule.
  - Purchases of intangible assets or capitalized software development costs.
  - Any cash from asset disposals (usually zero for early-stage companies).
- **Financing Cash Flow:**
  - Equity raised: Cash from new investor rounds. List by round if multiple raises are modeled.
  - Debt proceeds and repayments: Show gross draws and gross repayments separately, not just net. Lenders will scrutinize this.
  - Founder capital injections (if applicable for very early-stage models).
- **Ending cash reconciliation:** Beginning cash + total net cash change = ending cash. The ending cash must exactly equal the cash line on the balance sheet. Build this as a check cell labeled "Cash Reconciliation" that shows TRUE when the model balances and flags visually (e.g., red cell fill) when it does not.
- **Free cash flow:** Show FCF as a separate calculated metric: Operating Cash Flow -- CapEx. This is a standard metric that investors and lenders use independently of EBITDA.

---

### Step 8: Add Scenario Analysis and Sensitivity Tables

A model without scenario analysis is a single-point forecast, which is nearly always wrong. The goal is to define the range of plausible outcomes, not to prove a single projection.

- **Build a scenario toggle using a named cell (e.g., a dropdown or a cell labeled "Scenario: 1=Downside, 2=Base, 3=Upside").** Use INDEX or CHOOSE formulas in the assumptions sheet to pull the appropriate assumption set based on the toggle. This means you have three complete sets of assumptions but a single model structure.
- **Define scenario logic correctly:** Do not create scenarios by applying a uniform percentage multiplier to all assumptions (e.g., "Upside = Base x 1.2"). This produces nonsensical results for cost assumptions and ignores real-world dynamics. Instead, vary assumptions that actually drive the scenario difference:
  - Downside: Higher churn (e.g., 7% vs. 3% base), lower new customer acquisition (e.g., 10/month vs. 20/month), delayed fundraise by 3 months, higher COGS (infrastructure costs don't scale down as expected).
  - Base: Most likely assumptions based on current trajectory and bottoms-up analysis.
  - Upside: Lower churn, higher new customer acquisition through a specific channel (e.g., partnership deal closes), 10% price increase implemented in Q3 of year 2.
- **Build a two-variable sensitivity table.** The most useful sensitivity table for a startup shows ending cash or EBITDA across a grid of two key variables -- typically new customer acquisition rate vs. monthly churn rate, or gross margin vs. revenue growth rate. This immediately shows investors how robust the model is.
- **Run a runway sensitivity.** Show how many months of runway exist under each scenario. For a startup raising capital, the model must demonstrate that the raise being requested provides at least 18-24 months of runway in the base case and 12-15 months in the downside case. Below 12 months of post-raise runway is a red flag for investors.
- **Label scenarios descriptively, not just "Upside/Base/Downside."** Example: Base = "Organic growth, no enterprise deals"; Upside = "2 enterprise deals close in Q2 Year 2 at $24K ACV"; Downside = "Churn spikes to 7% for 6 months due to competitive entrant." Named scenarios make the analysis credible and show the team understands their business drivers.

---

## Output Format

When delivering a financial model structure to a user, output the following. Populate every table cell with real calculated values, not placeholders. If values are unknown, use explicit assumptions with clear labels.

```
## Financial Model: [Company Name]
### Last Updated: [Date] | Built For: [Purpose] | Prepared By: [Author/AI]

---

### Model Configuration

| Parameter | Value |
|-----------|-------|
| Purpose | [Fundraising / Board Reporting / Internal Planning / Lender Package] |
| Time Horizon | [X years: Monthly Year 1, Quarterly Year 2, Annual Years 3-5] |
| Business Model | [SaaS / E-commerce / Marketplace / Services / Manufacturing] |
| Stage | [Pre-revenue / Early Revenue ($X ARR) / Growth / Profitable] |
| Audience | [Seed Investors / Series A / Board / Bank] |
| Primary Metric | [ARR / GMV / Revenue / EBITDA / DSCR] |
| Scenario Active | [Downside / Base / Upside] |

---

### Assumptions Sheet

#### Revenue Assumptions
| Assumption | [Period 1] | [Period 2] | [Period 3] | Driver Type | Source / Benchmark |
|------------|-----------|-----------|-----------|-------------|-------------------|
| [Price - Tier A] | $X/mo | $X/mo | $X/mo | Per contract | Competitive analysis |
| [Price - Tier B] | $X/mo | $X/mo | $X/mo | Per contract | Competitive analysis |
| [Plan mix % Tier B] | X% | X% | X% | Upsell execution | Industry: 25-35% |
| [New customers/month] | X | X | X | CAC budget / conversion | Bottoms-up pipeline |
| [Monthly gross churn] | X% | X% | X% | Product maturity | SaaS benchmark: 2-5% |
| [Expansion MRR rate] | X% | X% | X% | Upsell motion | Best-in-class: 10-20% |
| [Net Revenue Retention] | X% | X% | X% | Calculated | Healthy: >100%, Elite: >120% |

#### Headcount Plan
| Role | Dept | Start Month | Annual Salary | Benefits Load | Total Loaded Cost | COGS or OpEx |
|------|------|-------------|---------------|--------------|-------------------|--------------|
| Co-Founder / CEO | G&A | Month 1 | $X | 15% | $X | OpEx |
| Co-Founder / CTO | Engineering | Month 1 | $X | 15% | $X | OpEx |
| Software Engineer | Engineering | Month X | $X | 18% | $X | COGS/OpEx |
| Account Executive | Sales | Month X | $X + commission | 18% | $X | OpEx |
| Customer Success | COGS | Month X | $X | 18% | $X | COGS |

#### COGS Assumptions
| Cost Component | [Period 1] | [Period 2] | [Period 3] | Driver | Benchmark |
|----------------|-----------|-----------|-----------|--------|-----------|
| Hosting / infrastructure | $X/user/mo | $X/user/mo | $X/user/mo | Per active user | $2-5/user SaaS |
| Payment processing | X% of rev | X% of rev | X% of rev | % of revenue | 2.9% + $0.30 Stripe |
| Support labor | $X | $X | $X | Headcount | Per FTE |
| Third-party APIs | $X | $X | $X | Per transaction | Per vendor pricing |

#### Working Capital Assumptions
| Assumption | Value | Rationale |
|------------|-------|-----------|
| Days Sales Outstanding (DSO) | X days | B2B net-30 typical: 35-45 days |
| Days Payable Outstanding (DPO) | X days | Vendor terms: 30-45 days |
| Inventory Days (if applicable) | X days | Target: [X turns/year] |
| Deferred Revenue (billing cycle) | X months | Annual billing = ~11 months deferred |

#### Financing Assumptions
| Event | Timing | Amount | Terms |
|-------|--------|--------|-------|
| Current cash on hand | Month 0 | $X | -- |
| Seed raise | Month X | $X | $Xm pre-money, X% dilution |
| Venture debt (if applicable) | Month X | $X | X% interest, X-year term |

---

### Income Statement (Profit and Loss)

#### Year 1 -- Monthly Detail (showing quarterly summaries)

| Line Item | Q1 | Q2 | Q3 | Q4 | Full Year 1 | % Rev |
|-----------|----|----|----|----|-------------|-------|
| **Revenue -- Tier A** | $X | $X | $X | $X | $X | X% |
| **Revenue -- Tier B** | $X | $X | $X | $X | $X | X% |
| **Total Revenue** | $X | $X | $X | $X | $X | 100% |
| Cost of Revenue | ($X) | ($X) | ($X) | ($X) | ($X) | X% |
| **Gross Profit** | $X | $X | $X | $X | $X | |
| **Gross Margin %** | X% | X% | X% | X% | **X%** | |
| Sales and Marketing | ($X) | ($X) | ($X) | ($X) | ($X) | X% |
| Research and Development | ($X) | ($X) | ($X) | ($X) | ($X) | X% |
| General and Administrative | ($X) | ($X) | ($X) | ($X) | ($X) | X% |
| Stock-Based Compensation | ($X) | ($X) | ($X) | ($X) | ($X) | X% |
| **Total Operating Expenses** | ($X) | ($X) | ($X) | ($X) | ($X) | X% |
| **EBITDA** | ($X) | ($X) | ($X) | ($X) | ($X) | X% |
| Depreciation and Amortization | ($X) | ($X) | ($X) | ($X) | ($X) | |
| **EBIT (Operating Income)** | ($X) | ($X) | ($X) | ($X) | ($X) | |
| Interest Expense | ($X) | ($X) | ($X) | ($X) | ($X) | |
| **Pre-Tax Income** | ($X) | ($X) | ($X) | ($X) | ($X) | |
| Income Tax | $0 | $0 | $0 | $0 | $0 | |
| **Net Income / (Loss)** | ($X) | ($X) | ($X) | ($X) | ($X) | |
| *Net Burn Rate* | ($X) | ($X) | ($X) | ($X) | -- | |

#### Years 1-5 -- Annual Summary

| Line Item | Year 1 | Year 2 | Year 3 | Year 4 | Year 5 |
|-----------|--------|--------|--------|--------|--------|
| **Total Revenue** | $X | $X | $X | $X | $X |
| *YoY Growth* | -- | X% | X% | X% | X% |
| **Gross Profit** | $X | $X | $X | $X | $X |
| **Gross Margin** | X% | X% | X% | X% | X% |
| **EBITDA** | ($X) | ($X) | $X | $X | $X |
| **EBITDA Margin** | (X%) | (X%) | X% | X% | X% |
| **Net Income** | ($X) | ($X) | ($X) | $X | $X |

---

### Balance Sheet

| Line Item | Year 1 | Year 2 | Year 3 |
|-----------|--------|--------|--------|
| **ASSETS** | | | |
| Cash and Cash Equivalents | $X | $X | $X |
| Accounts Receivable (net) | $X | $X | $X |
| Inventory | $X | $X | $X |
| Prepaid Expenses | $X | $X | $X |
| Total Current Assets | **$X** | **$X** | **$X** |
| Property, Plant and Equipment (gross) | $X | $X | $X |
| Less: Accumulated Depreciation | ($X) | ($X) | ($X) |
| PP&E (net) | $X | $X | $X |
| Capitalized Software (net) | $X | $X | $X |
| Other Long-Term Assets | $X | $X | $X |
| **TOTAL ASSETS** | **$X** | **$X** | **$X** |
| **LIABILITIES** | | | |
| Accounts Payable | $X | $X | $X |
| Accrued Expenses | $X | $X | $X |
| Deferred Revenue (current) | $X | $X | $X |
| Current Portion of Debt | $X | $X | $X |
| Total Current Liabilities | **$X** | **$X** | **$X** |
| Long-Term Debt | $X | $X | $X |
| Deferred Revenue (long-term) | $X | $X | $X |
| **TOTAL LIABILITIES** | **$X** | **$X** | **$X** |
| **EQUITY** | | | |
| Paid-In Capital | $X | $X | $X |
| Accumulated Deficit | ($X) | ($X) | ($X) |
| **TOTAL EQUITY** | **$X** | **$X** | **$X** |
| **TOTAL LIABILITIES + EQUITY** | **$X** | **$X** | **$X** |
| **BALANCE CHECK (must = 0)** | **$0** | **$0** | **$0** |

---

### Cash Flow Statement (Indirect Method)

| Line Item | Year 1 | Year 2 | Year 3 |
|-----------|--------|--------|--------|
| **OPERATING ACTIVITIES** | | | |
| Net Income / (Loss) | ($X) | ($X) | $X |
| + Depreciation and Amortization | $X | $X | $X |
| + Stock-Based Compensation | $X | $X | $X |
| -- Increase in Accounts Receivable | ($X) | ($X) | ($X) |
| -- Increase in Prepaid Expenses | ($X) | ($X) | ($X) |
| + Increase in Accounts Payable | $X | $X | $X |
| + Increase in Deferred Revenue | $X | $X | $X |
| + Increase in Accrued Expenses | $X | $X | $X |
| **Net Operating Cash Flow** | **($X)** | **($X)** | **$X** |
| **INVESTING ACTIVITIES** | | | |
| Capital Expenditures | ($X) | ($X) | ($X) |
| Capitalized Software Development | ($X) | ($X) | ($X) |
| **Net Investing Cash Flow** | **($X)** | **($X)** | **($X)** |
| **FINANCING ACTIVITIES** | | | |
| Proceeds from Equity Raise | $X | $X | $0 |
| Proceeds from Debt | $X | $0 | $0 |
| Debt Repayments | ($X) | ($X) | ($X) |
| **Net Financing Cash Flow** | **$X** | **($X)** | **($X)** |
| **NET CHANGE IN CASH** | **$X** | **($X)** | **$X** |
| Beginning Cash | $X | $X | $X |
| **ENDING CASH** | **$X** | **$X** | **$X** |
| *Balance Sheet Cash (verify match)* | $X | $X | $X |
| **CASH RECONCILIATION CHECK** | **TRUE** | **TRUE** | **TRUE** |
| | | | |
| **Free Cash Flow (OCF -- CapEx)** | ($X) | ($X) | $X |

---

### Scenario Summary

| Metric | Downside | Base | Upside |
|--------|----------|------|--------|
| Year 1 Revenue | $X | $X | $X |
| Year 3 Revenue | $X | $X | $X |
| Year 3 ARR (if SaaS) | $X | $X | $X |
| Year 3 EBITDA | ($X) | $X | $X |
| Year 3 EBITDA Margin | (X%) | X% | X% |
| Cash at End of Year 1 | $X | $X | $X |
| Cash at End of Year 2 | $X | $X | $X |
| Months of Runway (from funding) | X | X | X |
| Key Downside Assumption | [Higher churn, lower new adds] | -- | -- |
| Key Upside Assumption | -- | -- | [Enterprise deals, lower churn] |

---

### Key Metrics Dashboard

| Metric | Year 1 | Year 2 | Year 3 | Benchmark |
|--------|--------|--------|--------|-----------|
| ARR / Annual Revenue | $X | $X | $X | -- |
| YoY Growth Rate | -- | X% | X% | Series A SaaS: >100% Y2 |
| Gross Margin | X% | X% | X% | SaaS target: >65% |
| EBITDA Margin | (X%) | (X%) | X% | Breakeven by Y3 = good |
| Monthly Burn (avg Year 1) | $X | $X | $X | <$100K/mo for seed |
| LTV (Customer Lifetime Value) | $X | $X | $X | -- |
| CAC (Blended) | $X | $X | $X | -- |
| LTV/CAC Ratio | X | X | X | Target: >3x |
| CAC Payback Period | X months | X months | X months | Target: <18 months |
| Net Revenue Retention | X% | X% | X% | Elite: >120% |
| Rule of 40 (Growth% + EBITDA%) | X | X | X | Target: >40 |
| Headcount | X | X | X | -- |
| Revenue per Employee | $X | $X | $X | SaaS avg: $150-250K |

---

### Model Integrity Checks

| Check | Year 1 | Year 2 | Year 3 | Status |
|-------|--------|--------|--------|--------|
| Balance Sheet balances (A = L + E) | TRUE | TRUE | TRUE | PASS |
| Cash reconciles (CFS to BS) | TRUE | TRUE | TRUE | PASS |
| No hardcoded values in statements | -- | -- | -- | VERIFY |
| All negative EBIT periods show $0 tax | TRUE | TRUE | -- | PASS |
| Deferred revenue movement ties to billings | TRUE | TRUE | TRUE | PASS |
```

---

## Rules

1. **Every number in the three financial statements must trace to a named assumption cell.** If a number cannot be explained as the output of a formula referencing the assumptions sheet, it does not belong in the model. "Hardcoding" a revenue or cost figure directly into a statement cell is a model-breaking error that makes scenario analysis meaningless and destroys investor trust.

2. **The balance check and cash reconciliation check are non-negotiable structural requirements.** Do not deliver a model without both. If the balance sheet does not balance, stop and identify the error before proceeding. The most common causes of imbalance are: (a) forgetting to link net income to retained earnings, (b) CapEx appearing in investing cash flow but not updating PP&E on the balance sheet, (c) equity raises recorded in financing cash flow but not in paid-in capital, (d) deferred revenue flows that are not mirrored between the P&L and balance sheet.

3. **COGS and OpEx must be classified according to how the business actually incurs the cost, not how it is convenient to model.** Customer success engineers who onboard customers belong in COGS. An HR manager belongs in G&A. Misclassifying COGS as OpEx artificially inflates gross margin -- the most commonly benchmarked metric in SaaS -- and will be caught by experienced investors or auditors.

4. **Pre-revenue and early-revenue models must show monthly granularity for at least 24 months.** Annual granularity masks the month-by-month cash profile that determines whether the company reaches key milestones before running out of money. A model that shows Year 1 cash of $500K could be hiding a Month 7 cash balance of $0 if the company front-loads spending. Monthly cash is the real risk metric.

5. **Do not model income taxes as a cash expense in any period where the company has a cumulative net operating loss (NOL).** Most early-stage companies accumulate NOLs that offset future taxable income. However, do not model the NOL deferred tax asset on the balance sheet without a separate note -- GAAP requires a valuation allowance against deferred tax assets for companies without a history of profitability, which nets the asset to zero.

6. **Scenario analysis must vary assumptions independently and asymmetrically.** Revenue downside should not automatically trigger proportional cost reduction -- costs are often stickier than revenue, especially headcount. A realistic downside scenario has revenue miss by 30% while costs come down only 10-15% because the company takes several months to respond with layoffs or expense reductions. This is the scenario that causes companies to run out of cash.

7. **Annual contract value (ACV) and cash timing must be modeled correctly for B2B SaaS with annual billing.** If a customer signs a $12,000 annual contract in Month 4, the cash arrives in Month 4, but revenue is recognized at $1,000/month for 12 months. This creates a deferred revenue balance that is a liability on the balance sheet. Models that recognize revenue at the time of cash receipt (cash basis) are wrong for accrual accounting and will produce a balance sheet that does not balance.

8. **Founder salaries and benefits must be modeled even if founders are currently taking no salary.** Show market-rate salaries as an assumption, note the current below-market salary, and include the step-up in projections at a specified date. Investors know that zero-salary founders is temporary, and a model that permanently assumes $0 founder cost is misleading about the long-run cost structure of the business.

9. **Do not model a single "revenue growth rate" assumption.** Growth rate is an output, not an input. All revenue growth must emerge from specific driver assumptions (new customers, churn, price changes, new product revenue) that the user can validate against operational data. A model driven by a single percentage growth rate is a spreadsheet, not a financial model.

10. **For fundraising models, the model must demonstrate that the funding amount requested covers at least 18-24 months of runway in the base case and ends with the company having reached a clear subsequent funding milestone.** A model that shows the company running out of money 14 months post-raise is a fundraising red flag. Show the runway math explicitly: ending cash / monthly net burn = months of runway.

---

## Edge Cases

### Pre-Revenue Startup With No Operating History

The model has no actuals anchor, so every assumption is speculative. The correct approach is to build the model around the single most important variable: months until cash runs out (runway). Structure the assumptions around the minimum viable hypothesis: when does the first customer pay, how much does the company spend to reach that point, and what burn rate is sustainable on the available capital? Show the revenue ramp from month 1 of product launch with explicit customer acquisition assumptions (e.g., founder outreach to 50 prospects per month, 10% conversion to paid, $X ACV). Revenue model must include a "months to first revenue" assumption as a hard input that shifts the entire revenue curve left or right. The P&L is nearly irrelevant for the first 12-18 months -- the cash flow statement is the primary document. Gross margin benchmarks from comparable companies should be used as a sanity check on COGS assumptions even before the company has real cost data.

### Hardware or Physical Product Business With Manufacturing COGS

The bill of materials (BOM) must be itemized at the component level for at least the first version of the product, then rolled up into a per-unit COGS. The BOM typically includes: component costs, assembly and manufacturing labor, quality testing, packaging, and inbound freight. Apply a manufacturing overhead allocation (typically 15-25% of direct costs) for shared equipment, facility, and supervision costs. Model production volume separately from sales volume -- the company produces inventory in batches before selling it, which creates a timing difference between cash outflow (production) and cash inflow (sale). Inventory builds before a product launch are the most common cause of cash crunches in hardware startups. Model the inventory turnover ratio (target: 4-8x per year for hardware) and show inventory days explicitly. Working capital management is the dominant cash flow story -- COGS, DSO, DPO, and inventory days together determine whether the business generates or consumes cash at scale.

### Two-Sided Marketplace With Separate Supply and Demand Acquisition

Revenue is a take rate applied to GMV, but GMV itself is the product of supply-side inventory and demand-side usage. These two sides have different acquisition costs, different churn rates, and different engagement economics. Build three separate models: a supply model (sellers/providers: count, activity rate, average listings), a demand model (buyers/customers: count, purchase frequency, average order value), and a transaction model that connects the two (fill rate, match rate, or liquidity metric). GMV = active buyers x purchase frequency x average order value. This is the bottoms-up calculation. The take rate applied to GMV produces net revenue. Show GMV as a prominent top-line metric even though it is not the accounting revenue line -- most marketplace valuations are a multiple of GMV. Acquisition cost for both sides must be shown separately and the blended CAC should be calculated as (total S&M spend) / (new transactions or new active users per period).

### Services or Consulting Business Where Revenue Is Entirely Headcount-Dependent

The revenue ceiling at any point in time is literally bounded by the number of billable people the company employs times their maximum billable hours. Model this constraint explicitly. The utilization rate (billable hours / total available hours) is the single most important operational metric. For a professional services firm, 100% utilization is impossible -- vacations, internal meetings, business development, and training consume 20-35% of time. A utilization assumption above 80% is heroic; above 85% causes burnout and attrition. The gross margin formula is: (Billing Rate -- Fully Loaded Cost per Hour) x Billable Hours. If a senior consultant is billed at $200/hour and costs $80/hour fully loaded, gross margin is 60% -- but only at full utilization. At 65% utilization, the effective gross margin drops to approximately 30% because the cost is fixed. Model bench time (hired but not yet assigned) as a direct cost. Also model the lag between signing a new contract and generating revenue -- for large enterprise services contracts, there is often a 30-90 day mobilization period before billing begins.

### Company With Significant Existing Debt (Lender Audience)

When the model is being built for a bank, SBA lender, or private credit fund, the key output metrics change entirely. The lender cares about: DSCR (annual operating cash flow / total annual debt service, with a target of >1.25x), leverage ratio (total debt / EBITDA, maximum typically 4-5x for growth businesses), tangible net worth (total equity minus intangibles minus goodwill), and current ratio (current assets / current liabilities, target >1.5x). Show all of these ratios explicitly on the dashboard. Model the full debt amortization schedule with monthly principal and interest payments. For revolving credit facilities, model the draw and repayment schedule based on working capital seasonality. DSCR must remain above the covenant threshold in every modeled period -- if it dips below in the downside scenario, flag this explicitly and describe the mitigants (cash reserves, covenant waiver process, equity injection capability).

### International Operations or Multi-Currency Revenue

Multi-currency models require a functional currency designation (the currency in which the entity primarily operates) and explicit foreign exchange rate assumptions for each material currency. Revenue earned in foreign currencies must be translated at the period average rate for the P&L and at the spot rate on the balance sheet date for balance sheet items. The translation difference goes to other comprehensive income (OCI), not net income -- a common modeling error is running it through the P&L. If foreign currency revenue exceeds 20% of total revenue, model at least two FX scenarios: base (current spot rates) and stress (10-15% adverse move in key currency pairs). Show the sensitivity of EBITDA to a 10% move in the primary foreign currency pair -- this is a standard disclosure for public companies and useful for international startups.

### Model Shows Structural Profitability Issues That the User Has Not Acknowledged

Sometimes the model honestly assembled from the user's assumptions shows that the business never reaches profitability in the modeled period, or reaches breakeven only with heroic assumptions. Do not smooth or adjust assumptions to force a breakeven result. Instead: (1) show the model results honestly, (2) identify the specific structural issue (e.g., "gross margin of 35% combined with sales cycles that imply $800 CAC on a $500 ACV product means the unit economics never close"), (3) present the specific assumption that would need to change to reach breakeven (e.g., "gross margin must reach 60% or ACV must reach $900 to achieve payback within 18 months"), (4) note whether that assumption change is operationally plausible. A well-constructed model that surfaces a fundamental business problem is more valuable than a model that hides it.

---

## Example

**Input:** "I'm building a B2B SaaS company that sells a project management tool to marketing agencies. We charge $299/month for teams up to 10 users and $599/month for unlimited users. We launched 6 months ago and have 42 paying customers -- about 70% on the Basic plan and 30% on the Pro plan. We're raising a $1.5M seed round. We currently have 2 founders (no salaries yet) and $180K in the bank. Our monthly burn is about $12K (infrastructure and some contractors). We need a full 3-year model."

**Output:**

## Financial Model: [Marketing Agency SaaS] -- Seed Round
### Built For: $1.5M Seed Round | Business Model: B2B SaaS | Stage: Early Revenue

---

### Model Configuration

| Parameter | Value |
|-----------|-------|
| Purpose | Fundraising -- Seed Round ($1.5M target) |
| Time Horizon | 36 months monthly + Year 3 annual summary |
| Business Model | B2B SaaS, subscription (monthly billing assumed) |
| Stage | Early Revenue -- 42 customers, ~$14K MRR at launch |
| Primary Audience | Seed investors (VCs, angels, pre-seed funds) |
| Primary Metrics | ARR, MRR growth, Net Revenue Retention, Gross Margin, Runway |
| Scenario Active | Base Case |

---

### Assumptions Sheet

#### Current State (Month 0 -- Model Anchor)

| Metric | Value |
|--------|-------|
| Total customers | 42 |
| Basic plan customers (70%) | 29 |
| Pro plan customers (30%) | 13 |
| Current MRR | $29 x $299 + $13 x $599 = $8,671 + $7,787 = **$16,458** |
| Current ARR (run rate) | **$197,500** |
| Cash on hand | $180,000 |
| Monthly burn (current) | $12,000 |
| Months of runway (pre-raise) | **15 months** |

*Note: Founders
