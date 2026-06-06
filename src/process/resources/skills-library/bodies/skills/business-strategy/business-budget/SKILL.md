---
name: business-budget
description: |
  Creates an annual business budget using zero-based budgeting methodology with department breakdown, fixed and variable cost separation, contingency allocation, and quarterly review cadence. Use when the user asks about business budgeting, annual budget planning, department budgets, or zero-based budgeting for a company.
  Do NOT use for personal household budgets (use budget-planning), financial modeling with P&L projections (use financial-model-structure), or pricing decisions (use pricing-strategy).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "planning strategy analysis spreadsheets checklist"
  category: "business-strategy"
  subcategory: "finance-accounting"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Business Budget

## When to Use

**Use this skill when:**
- A business owner, finance leader, or operations manager asks to build an annual operating budget from scratch
- A user wants to implement zero-based budgeting (ZBB) methodology, meaning every dollar of expense must be justified fresh rather than carried forward from prior year
- A user needs to break down company-wide spending into department-level budgets with individual line-item justification
- A user wants to allocate a known funding amount or revenue target across headcount, operations, and growth initiatives for the fiscal year
- A user needs to model fixed versus variable cost structure to understand how the company's expense base behaves as revenue scales
- A user is preparing a budget presentation for a board of directors, investors, or executive leadership team
- A user wants to establish budget guardrails, variance thresholds, and a quarterly review cadence before the fiscal year begins
- A user is rebuilding the budget mid-year after actuals have significantly diverged from plan

**Do NOT use this skill when:**
- The user needs a personal or household budget -- household budgets involve income allocation, debt payoff sequencing, and savings rate optimization, all handled by the `budget-planning` skill
- The user wants a full financial model with a three-statement structure (income statement, balance sheet, cash flow statement with linked projections) -- use `financial-model-structure`
- The user wants to analyze or diagnose an existing profit and loss statement to find cost problems or margin erosion -- use `pl-analysis`
- The user needs to set prices for products or services, determine markup, or run a pricing sensitivity analysis -- use `pricing-strategy`
- The user is building a startup pitch deck with forward-looking financial projections intended for investor fundraising -- that requires `investor-financial-projections`
- The user needs to perform a unit economics analysis (CAC, LTV, payback period) -- use `unit-economics`

---

## Process

### Step 1: Establish Budget Parameters and Constraints

Before touching numbers, gather the structural inputs that govern every downstream decision. Ambiguity here cascades into every department budget.

- Confirm the **fiscal year period** -- calendar year (Jan-Dec) or a custom fiscal year (e.g., Jul-Jun for retail and education businesses, Oct-Sep for many government contractors). All quarterly phasing depends on this.
- Determine the **budget methodology**: zero-based (every expense justified from scratch regardless of prior year spend), incremental (prior year actuals as baseline, then adjust), or driver-based (costs are modeled as a function of a business driver such as revenue per head or cost per customer). Default to zero-based unless the user explicitly has mature, stable expense categories -- zero-based forces intellectual honesty about what the business actually needs.
- Identify the **company stage**: pre-revenue startup (budget against cash runway), early growth (budget against revenue target with loss tolerance), scaling (budget to achieve specific EBITDA margin improvement), or mature (budget for cash generation, likely incremental approach).
- Confirm **headcount on Day 1** of the fiscal year and planned net new hires -- headcount is typically 60-80% of total operating expenses for knowledge-work businesses. This is the highest-leverage variable.
- Confirm any **hard constraints** upfront: hiring freeze, board-mandated expense ceiling, CapEx limit, target profitability threshold (e.g., "we must hit EBITDA breakeven by Q3"), or debt covenants that limit operating losses.
- Establish **currency** and whether international entities require separate entity budgets that will be consolidated (this affects currency risk, intercompany transfers, and transfer pricing).

---

### Step 2: Set the Revenue Baseline

The revenue assumption is the single most consequential input to any operating budget. Every expense ratio and margin target depends on it.

- Use the **approved revenue forecast** from the commercial team as the primary input. If no forecast exists, build one from the trailing 12-month actuals with an explicit growth rate assumption documented by source (e.g., "ARR growth assumption of 40% YoY based on Q4 pipeline coverage ratio of 3.2x").
- For SaaS or subscription businesses: revenue = beginning ARR + new ARR bookings -- churn -- contraction. Each component must be estimated separately. Never use a single "growth rate" on total revenue because it obscures the churn problem.
- For transactional businesses (e-commerce, professional services, retail): revenue = volume x average transaction value. Build separate assumptions for each driver, not a blended rate.
- Define **three scenarios**: Base (most likely, 50th percentile outcome), Upside (75th-80th percentile -- good execution, no major customer losses), and Downside (20th-25th percentile -- slippage, churn, macro headwinds). The operating budget is built on Base, but department heads should understand what Downside looks like for their spending.
- Document the revenue assumption in the budget header with its source and the date it was set. If the actual revenue assumption changes later, the budget must be formally re-baselined, not silently edited.
- Express revenue monthly for phasing purposes -- seasonal patterns, enterprise deal close timing, and implementation schedules all affect quarterly and monthly revenue, even if annual is fixed.

---

### Step 3: Build Cost of Goods Sold (COGS)

COGS is often the most misunderstood section of an operating budget because knowledge-work companies frequently mis-classify costs, inflating gross margin artificially.

- **COGS for SaaS/software**: hosting and infrastructure costs (AWS, GCP, Azure -- compute, storage, data transfer), third-party API costs that are directly consumed per customer, customer support headcount whose primary function is reactive support (not proactive success), payment processing fees, and any third-party software that is embedded in the product.
- **COGS for services firms**: direct labor (the people doing the billable work), subcontractors, direct travel and expenses billed to projects, software used exclusively for client delivery.
- **COGS for product/manufacturing**: raw materials, direct labor, manufacturing overhead (rent and utilities for production space), freight inbound, and inventory write-downs.
- A common misclassification: putting Customer Success headcount entirely in COGS when their work is split between reactive support (COGS) and proactive expansion (Sales/Marketing). Split the cost if the roles are genuinely different.
- Target gross margin benchmarks by business type: SaaS 70-85%, professional services 30-50%, hardware 30-50%, software + services hybrid 55-70%, e-commerce 25-45%. If the budget gross margin is significantly outside these ranges, flag it for investigation.
- COGS should be separated into fixed COGS (infrastructure base cost, support headcount floor) and variable COGS (costs that scale with customer count or usage). This matters for unit economics -- contribution margin per customer requires variable COGS separation.

---

### Step 4: Build Department-Level Budgets Using Zero-Based Methodology

Each department budget is built bottom-up: list every planned activity and resource, assign a cost to each, classify it, and justify it. The total is the sum of justified activities -- not a top-down allocation.

**Engineering / R&D:**
- Headcount: List every engineer by level (Junior, Mid, Senior, Staff, Principal) with fully loaded cost (salary + benefits + payroll tax + equity amortization). Fully loaded cost is typically 1.2-1.3x base salary for full-time employees in the US, 1.1-1.15x in most of Europe.
- Phase new hires to planned start dates -- a Senior Engineer at $180K base ($234K fully loaded) starting in April costs $175.5K in the budget year, not $234K. This distinction commonly creates $50K-$200K errors in headcount-heavy budgets.
- Infrastructure and cloud hosting belongs in COGS unless it is exclusively used for development/testing environments (development environments are R&D; production is COGS).
- Engineering tools: GitHub or GitLab ($19-$29/user/month), Jira ($7-$15/user/month), monitoring and observability (Datadog, New Relic -- $15-$25/host/month or per-user seat), CI/CD pipeline costs, security scanning tools.
- Contractor budget: define the scope -- are contractors filling a permanent headcount gap or executing a specific project? Contractor rates are typically 40-70% higher per hour than equivalent FTE hourly rate, but carry no benefits cost and terminate cleanly.

**Sales:**
- Headcount cost for sales is more complex than other departments: base salary + on-target earnings (OTE). The variable commission component is a function of quota attainment, which is tied to revenue performance.
- Budget commissions at 100% OTE attainment for conservatism -- this means if total sales headcount has $500K in base salary and $500K in commission upside, budget $1M total sales compensation.
- Sales tools: CRM (Salesforce at $75-$300/user/month for Enterprise tier; HubSpot at $45-$120/user/month), sales engagement platforms, conversation intelligence, data enrichment, contract management. For a 10-person sales team these tools commonly total $100K-$250K per year.
- Include ramp time for new sales hires: a typical mid-market AE requires 3-4 months to close their first deal. New sales headcount generates revenue starting in month 4-5, but costs start on day 1.
- Budget sales travel and entertainment (T&E) separately from tools. T&E for enterprise sales teams commonly runs $5,000-$15,000 per rep per year for domestic accounts, $20,000-$40,000 for reps covering international territories.

**Marketing:**
- Marketing budget benchmark: growth-stage B2B companies typically spend 15-25% of target revenue on marketing; enterprise-focus companies 10-15%; B2C and consumer companies 20-35%.
- Break marketing spend into subcategories with distinct drivers: paid acquisition (Google Ads, LinkedIn, Meta -- cost per lead x planned lead volume), content and SEO (primarily headcount and tools), events (conference sponsorships, owned events -- each with individual line items), PR/analyst relations (retainer or project cost), product marketing (headcount).
- Paid acquisition budget must be tied to a unit economics assumption: if cost per lead (CPL) is $150 and sales close rate is 20%, cost per opportunity is $750. If average contract value is $30K and win rate is 25%, cost per closed deal is $3,000. Marketing budget allocation should be sized to deliver the lead volume the sales team needs to hit quota, not the other way around.
- Marketing tools: Marketing automation (Marketo at $895-$3,195/month; HubSpot Marketing Hub $800-$3,600/month), analytics, SEO platforms ($200-$500/month), design and content tools.

**Customer Success / Support:**
- Determine the ratio of CSMs to accounts by ARR band -- a common model: one CSM per $2M-$4M ARR for high-touch enterprise, one CSM per $750K-$1.5M ARR for mid-market, and automated/tech-touch for SMB below a revenue threshold.
- Support staffing: model based on ticket volume per customer per month x average handle time x target SLA coverage. A common starting point: one support agent per 150-300 customers depending on product complexity and customer technical sophistication.
- Include a dedicated line for Customer Success tooling: CS platforms (Gainsight at $25-$40/user/month; ChurnZero similar), support ticketing (Zendesk, Intercom), knowledge base, and customer health monitoring.

**General & Administrative (G&A):**
- G&A is the cost center that scales the least with revenue and should decline as a percentage of revenue as the company grows. A mature public company targets 5-8% G&A as a % of revenue; a 50-person startup commonly runs 12-18%.
- Key G&A line items: legal (outside counsel retainer + transaction counsel for fundraising or M&A, contracts review), audit and accounting (external audit at $25K-$150K depending on size and complexity; bookkeeping and controller costs), insurance (D&O, E&O, general liability, cyber -- total annual premium commonly $20K-$100K for a 50-person startup), office rent and utilities (if applicable -- post-pandemic many companies have hybrid arrangements), and finance tooling (ERP, accounting software, expense management).
- Finance headcount: typically one Finance FTE per $8M-$15M revenue for early-stage; a VP of Finance or CFO is typically justified at $5M+ ARR for a growth company.

**People / HR:**
- Recruiting costs: either agency fees (typically 20-25% of first-year salary for executive/technical roles, 15-18% for professional roles) or in-house recruiting infrastructure (recruiting tools at $8,000-$20,000/year for an ATS like Greenhouse or Lever, plus recruiter headcount).
- Benefits: US companies budget $8,000-$18,000 per employee per year for medical, dental, and vision depending on plan generosity and employer contribution percentage. 401(k) match adds $1,500-$4,500 per employee per year at typical 3-4% match levels.
- L&D (learning and development): $500-$2,000 per employee per year is common; high-growth engineering organizations often invest $2,500-$5,000 per engineer.

---

### Step 5: Add Non-Departmental Budget Items

These items sit outside department operating budgets but are material to the total budget.

- **Capital Expenditures (CapEx)**: Major equipment purchases, leasehold improvements for office space, servers if running on-premise infrastructure, vehicle fleets. CapEx is not expensed in the year of purchase -- it is depreciated over the asset's useful life (3 years for computers and technology, 5-7 years for furniture and fixtures, 15-39 years for real estate improvements under GAAP). Budget the cash outflow in CapEx, but expense the depreciation in the OpEx sections.
- **Debt service**: If the company carries debt (venture debt, SBA loan, equipment financing), budget both the principal repayment and the interest expense. Interest is an income statement item; principal repayment is a cash outflow that does not hit EBITDA.
- **Income tax provision**: For profitable companies, budget 21% federal corporate tax (US C-corps) plus applicable state taxes. For pass-through entities (S-corps, LLCs), note that taxes are paid at the owner level -- they do not appear in the business budget.
- **Contingency reserve**: Include 5-8% of total operating budget for unplanned expenses. This is not a slush fund -- it is a risk buffer for specific categories: unplanned hiring to backfill attrition, emergency legal or compliance costs, infrastructure incidents, or market opportunities requiring fast capital deployment. Allocate the contingency reserve to the CFO/Finance function, not to individual departments. Releasing contingency to departments requires CFO approval.

---

### Step 6: Calculate Budget Summary Metrics

These metrics transform the budget from a collection of line items into a strategic document that answers the question: is this the right budget for the company's goals?

- **Gross margin %** = Gross Profit / Revenue. Benchmark against industry peers and prior year to confirm COGS classification is consistent.
- **Operating expense ratio** = Total OpEx / Revenue. For each department, also compute Dept Spend / Revenue to benchmark against industry (e.g., "sales at 18% of revenue is within the 15-22% range for our growth rate and ACV").
- **EBITDA margin %** = (Revenue - COGS - OpEx + D&A) / Revenue. This is the primary profitability metric for most operating budgets. Exclude non-cash items (depreciation, amortization, stock-based compensation) to see the true cash operating efficiency.
- **Headcount metrics**: Total headcount at start and end of year; average headcount for the year; fully loaded cost per head (total people costs including benefits, payroll tax, equity / average headcount); revenue per employee (Revenue / average headcount -- should trend up as the company scales).
- **Cash runway**: For companies not yet profitable, compute months of cash remaining = Current Cash Balance / Monthly Net Cash Burn. The operating budget directly drives burn rate. A target is maintaining 18+ months of runway at all times for venture-backed companies.
- **Magic Number** (SaaS): Net New ARR / Prior Quarter S&M Spend. A Magic Number above 0.75 indicates sales and marketing efficiency; above 1.0 is exceptional. If the budget implies a Magic Number below 0.5, the S&M budget may be oversized relative to revenue expectations.
- **Rule of 40** (SaaS): Revenue Growth Rate % + EBITDA Margin %. A score above 40 indicates a healthy balance of growth and profitability. Use the budgeted numbers to compute the target Rule of 40 score and assess whether the budget is strategically positioned correctly.

---

### Step 7: Build Quarterly Phasing

Annual totals that are evenly spread across quarters produce inaccurate budgets and useless variance analysis. Every category requires intentional phasing.

- **Revenue phasing**: Map to sales pipeline close dates, seasonal patterns, and contract renewal timing. Enterprise SaaS businesses commonly see Q4-heavy revenue close rates (25-35% of annual bookings in Q4 due to budget cycles). Retail peaks in Q4. Education SaaS peaks in Q3 (summer budget deployment).
- **Headcount phasing**: Plot every planned hire on a month-by-month basis. Compute the quarterly salary cost from the actual planned start date, not from January 1. A 10-person hiring plan starting monthly from January through October adds costs in a stair-step pattern -- Q1 might add 2 hires, Q2 adds 4, Q3 adds 3, Q4 adds 1. The quarterly cost distribution reflects this directly.
- **Marketing phasing**: Align paid acquisition spend to seasonal patterns and sales cycle timing. Pre-season spend precedes revenue by 1-3 months. Event budgets should be concentrated in the quarters of major industry events (e.g., SaaStr Annual in Q1, Dreamforce in Q3).
- **Fixed costs**: Spread evenly unless a known trigger changes the cost -- lease renewal, software contract annual true-up, insurance renewal.
- **Variable costs**: Phase as a percentage of phased revenue. If a variable cost is 3% of revenue and Q3 revenue is $900K, Q3 variable cost for that line is $27K.
- **CapEx**: Phase to project start dates. A server rack purchase in Q2 hits Q2 cash flow. Depreciation begins in Q2 and spreads across 36 months.

---

### Step 8: Establish Variance Management and Review Cadence

A budget without a monitoring plan is a wish list. Variance management is what converts the budget from a static document into a management tool.

- **Define materiality thresholds** for variance escalation: a common framework is flag any variance >10% or >$10,000 (whichever is smaller) on any line item per quarter. For headcount, any unplanned hire or backfill requires advance approval regardless of dollar amount.
- **Monthly review**: Department heads compare actuals (pulled from accounting system -- NetSuite, QuickBooks, Xero) against their budget line by line. They document explanation for any flagged variance and whether it is timing (will correct next period) or structural (will persist -- requires reforecast).
- **Quarterly business review (QBR)**: Leadership reviews the full consolidated budget vs actuals. Compute YTD variance in both dollars and percent. Compare revenue actuals to the three scenarios built in Step 2 to determine whether the business is tracking Base, Upside, or Downside. Adjust Q3 and Q4 spending plans accordingly.
- **Reforecast vs. budget**: The original budget is locked and preserved as the baseline. A reforecast adjusts the expected full-year result based on actuals to date. These are two distinct documents. Budget variance = Actual vs. Budget. Forecast variance = Actual vs. Latest Forecast.
- **Mid-year budget revision trigger**: If any of the following conditions are met, conduct a formal budget revision rather than incremental reforecast: revenue actuals are tracking >20% below or above budget through mid-year; a major unplanned event occurs (key customer loss, acquisition, pivot in business model, macroeconomic disruption); headcount plan changes by more than 15% net.

---

## Output Format

```
## Annual Business Budget: [Company Name] -- FY[Year]

### Budget Parameters
- **Fiscal year:** [Start date] to [End date]
- **Methodology:** Zero-based (every line item justified from scratch)
- **Revenue assumption:** $[X] ([source: management target / bottom-up forecast / approved board plan])
- **Revenue model:** [ARR/subscription / transactional / services / mixed]
- **Headcount plan:** [X] employees (Jan 1) → [X] employees (Dec 31) | Average: [X] for year
- **Target margins:** Gross [X]% | EBITDA [X]% | Net [X]%
- **Cash balance (start of year):** $[X] | **Implied runway:** [X] months at budgeted burn
- **Known constraints:** [e.g., Hiring freeze in Q4, CapEx cap of $200K, EBITDA breakeven required by Q3]

---

### Revenue Scenarios

| Scenario | Annual Revenue | Growth vs. Prior Year | Key Assumption |
|----------|---------------|----------------------|----------------|
| Upside | $[X] | [X]% | [e.g., Pipeline converts at 28% vs. base 22%] |
| **Base (Budget)** | **$[X]** | **[X]%** | **[e.g., Pipeline at 22% close rate, 5% churn]** |
| Downside | $[X] | [X]% | [e.g., 12% churn, new logo slowdown] |

Operating budget is built on Base scenario. Downside triggers [describe contingency action].

---

### Budget Summary

| Category | Annual Budget | % of Revenue | Prior Year Actual | YoY Change |
|----------|-------------|-------------|-------------------|------------|
| **Revenue** | $[X] | 100% | $[X] | [X]% |
| COGS -- Fixed | ($[X]) | [X]% | $[X] | [X]% |
| COGS -- Variable | ($[X]) | [X]% | $[X] | [X]% |
| **Gross Profit** | $[X] | [X]% | $[X] | [X]% |
| Engineering / R&D | ($[X]) | [X]% | $[X] | [X]% |
| Sales | ($[X]) | [X]% | $[X] | [X]% |
| Marketing | ($[X]) | [X]% | $[X] | [X]% |
| Customer Success | ($[X]) | [X]% | $[X] | [X]% |
| G&A | ($[X]) | [X]% | $[X] | [X]% |
| People / HR | ($[X]) | [X]% | $[X] | [X]% |
| **Total OpEx** | ($[X]) | [X]% | $[X] | [X]% |
| **EBITDA** | $[X] | [X]% | $[X] | [X] pts |
| D&A (non-cash, add back) | $[X] | [X]% | | |
| Interest and debt service | ($[X]) | [X]% | | |
| Tax provision | ($[X]) | [X]% | | |
| Contingency reserve ([X]%) | ($[X]) | [X]% | | |
| **Net Income (Budget)** | $[X] | [X]% | | |

---

### Key Metrics Dashboard

| Metric | Budget FY[Year] | Prior Year Actual | Industry Benchmark |
|--------|----------------|-------------------|-------------------|
| Gross Margin % | [X]% | [X]% | [X]% |
| EBITDA Margin % | [X]% | [X]% | [X]% |
| S&M as % of Revenue | [X]% | [X]% | [X]% |
| R&D as % of Revenue | [X]% | [X]% | [X]% |
| G&A as % of Revenue | [X]% | [X]% | [X]% |
| Revenue per Employee | $[X] | $[X] | $[X] |
| Fully Loaded Cost per Head | $[X] | $[X] | N/A |
| Rule of 40 Score | [X] | [X] | 40+ |
| Cash Runway (months) | [X] mo | [X] mo | 18+ mo |

---

### Department Budget: [Department Name]
**Department Head:** [Name/Role]
**Headcount:** [X] (start) → [X] (end) | Budget owner accountability confirmed: [Yes/No]

| Line Item | Type | Committed/ Discretionary | Q1 | Q2 | Q3 | Q4 | Annual | Justification |
|-----------|------|--------------------------|-----|-----|-----|-----|--------|---------------|
| [Headcount: Role, Level] | Fixed | Committed | $[X] | $[X] | $[X] | $[X] | $[X] | [Role, start date, business need] |
| [New hire: Role, Level] | Fixed | Committed | $[X] | $[X] | $[X] | $[X] | $[X] | [Planned start Q[X], enables X outcome] |
| [SaaS tool/platform] | Fixed | Committed | $[X] | $[X] | $[X] | $[X] | $[X] | [Contract renewal date, seats, per-unit cost] |
| [Variable expense] | Variable | Discretionary | $[X] | $[X] | $[X] | $[X] | $[X] | [Driver: scales with X metric] |
| [Travel & expenses] | Variable | Discretionary | $[X] | $[X] | $[X] | $[X] | $[X] | [$[X]/person x [X] people x [X] trips] |
| **Department Total** | | | $[X] | $[X] | $[X] | $[X] | $[X] | |
| -- of which Fixed | | | $[X] | $[X] | $[X] | $[X] | $[X] | |
| -- of which Variable | | | $[X] | $[X] | $[X] | $[X] | $[X] | |

*(Repeat this table for each department)*

---

### Headcount Plan

| Department | Jan 1 HC | Q1 Hires | Q2 Hires | Q3 Hires | Q4 Hires | Dec 31 HC | Avg HC | Fully Loaded Annual Cost |
|------------|---------|----------|----------|----------|----------|-----------|--------|--------------------------|
| Engineering | [X] | [X] | [X] | [X] | [X] | [X] | [X] | $[X] |
| Sales | [X] | [X] | [X] | [X] | [X] | [X] | [X] | $[X] |
| Marketing | [X] | [X] | [X] | [X] | [X] | [X] | [X] | $[X] |
| Customer Success | [X] | [X] | [X] | [X] | [X] | [X] | [X] | $[X] |
| G&A | [X] | [X] | [X] | [X] | [X] | [X] | [X] | $[X] |
| People / HR | [X] | [X] | [X] | [X] | [X] | [X] | [X] | $[X] |
| **Total** | **[X]** | **[X]** | **[X]** | **[X]** | **[X]** | **[X]** | **[X]** | **$[X]** |

---

### Quarterly Phasing -- Consolidated

| Category | Q1 | Q2 | Q3 | Q4 | Annual | Q1% | Q2% | Q3% | Q4% |
|----------|-----|-----|-----|-----|--------|-----|-----|-----|-----|
| Revenue | $[X] | $[X] | $[X] | $[X] | $[X] | [X]% | [X]% | [X]% | [X]% |
| Total COGS | ($[X]) | ($[X]) | ($[X]) | ($[X]) | ($[X]) | | | | |
| Gross Profit | $[X] | $[X] | $[X] | $[X] | $[X] | | | | |
| Total OpEx | ($[X]) | ($[X]) | ($[X]) | ($[X]) | ($[X]) | | | | |
| EBITDA | $[X] | $[X] | $[X] | $[X] | $[X] | | | | |
| Net Income | $[X] | $[X] | $[X] | $[X] | $[X] | | | | |
| Ending Headcount | [X] | [X] | [X] | [X] | -- | | | | |
| Cash Balance (est.) | $[X] | $[X] | $[X] | $[X] | $[X] | | | | |

---

### Variance Management Framework

| Review Cycle | Participants | Trigger Threshold | Action |
|-------------|-------------|------------------|--------|
| Monthly (last business day) | Dept heads + Finance | >10% or >$10K on any line item | Dept head provides written variance explanation within 5 business days |
| Quarterly (QBR) | Leadership team + CFO | Full budget vs. actuals review | Reforecast Q3-Q4 at Q2 review; approve/deny contingency releases |
| Mid-year revision | Board + CEO + CFO | Revenue >20% off plan, or major strategic event | Formal budget rebaseline, new board approval if required |

- **Materiality threshold for line items:** [X]% or $[X], whichever is smaller
- **Contingency release authority:** CFO approval required for any release >$[X]
- **Budget vs. reforecast:** Original budget is locked at [date]. Reforecast is maintained as a live document updated after each month close.
```

---

## Rules

1. **Always anchor every expense to the stated revenue assumption.** Express every major cost category as a percentage of revenue in addition to its dollar amount. An expense number without a revenue denominator has no strategic meaning -- it cannot be assessed for proportionality, benchmarked against industry, or evaluated for trade-off decisions.

2. **Never classify costs as fixed or variable based solely on intuition -- test against the actual cost driver.** A cost is truly variable only if it scales automatically with a defined business metric (e.g., AWS costs scale with active users; credit card processing fees scale with revenue). A cost that management could in theory reduce but that doesn't automatically contract is semi-variable or discretionary. Misclassifying a large semi-variable cost as purely variable understates the risk of a revenue shortfall.

3. **Phase headcount costs by actual planned start date, never by annual salary divided by 12.** A $150,000 base salary hire starting on October 1 costs $37,500 in the budget year, not $150,000. Failing to phase correctly overstates payroll expense, understates EBITDA, and creates false variance when actuals come in lower than budget early in the year.

4. **Preserve the original budget as a locked baseline even after reforecasting begins.** Never overwrite the original approved budget with updated assumptions. Budget vs. actuals variance must always be measured against the locked budget. Reforecast documents are separate. A company that continuously moves its budget target to match actuals has no accountability mechanism.

5. **Every zero-based line item must carry a business justification -- reject any item whose justification is "same as last year" or "standard cost."** Zero-based budgeting specifically requires that prior year spend cannot be grandfathered. The question is: if this expense did not exist today, would we create it? If the answer is not an obvious yes with a concrete business case, the item should be challenged or eliminated.

6. **Model sales compensation at 100% OTE attainment, not base salary alone.** Budget the full variable commission as if the sales team hits plan. If commissions are not budgeted at plan attainment, either the revenue target is not credible or the company is planning to fail to pay its salespeople. Both are management errors. Over-attainment commission costs (accelerators above 100% quota) should be budgeted as a contingency line in the Sales department.

7. **Do not budget CapEx as operating expense or mix depreciation timing with cash spend.** CapEx is a cash outflow that does not directly hit EBITDA in the period of purchase. Depreciation is the non-cash expense that flows through the P&L over the asset life. Both need to appear in the budget: CapEx in the cash section, depreciation in the relevant department's OpEx. Confusing the two creates EBITDA miscalculation that misleads management about profitability.

8. **Contingency reserve is not a department slush fund -- it must require CFO approval to release.** The contingency reserve (5-8% of total OpEx) is a corporate-level risk buffer. If department heads believe they can access contingency informally, it will be consumed before it is needed for genuine surprises. Establish a formal release process with written business case and CFO sign-off as minimum controls.

9. **Include a Downside scenario action plan alongside the Base budget.** A budget that only plans for success is strategically incomplete. At minimum, identify the top three discretionary expense categories that would be cut first in a downside scenario, the specific dollar amount that would be cut from each, and the revenue trigger that would activate cuts (e.g., "if Q2 revenue comes in below $650K, freeze all discretionary marketing spend and pause Q3 new hires"). This forces the team to think about operating leverage before a crisis.

10. **Validate headcount-driven cost assumptions against the actual fully loaded cost, not just base salary.** The fully loaded cost of a US employee is base salary + payroll taxes (FICA 7.65% employer share on first $168,600, then Medicare only above that threshold) + health/dental/vision benefits ($8,000-$18,000/year) + 401(k) match + equity grant amortization (for option grants, compute the annual Black-Scholes expense) + recruiting fee or in-house recruiting cost allocation. Ignoring these components understates people costs by 20-35%, which is the single most common source of budget overruns.

---

## Edge Cases

**Pre-revenue startup budgeting against a funding round:**
When no revenue exists or revenue is de minimis (under $100K), budget against total available cash rather than revenue. The primary output metric is months of runway: Cash Balance / Monthly Net Burn Rate. Target milestone-based budgeting -- map every major expense to the milestone it enables (e.g., engineering headcount enables product beta in Q2, which enables Series A raise in Q3). Any expense that cannot be traced to a milestone is a candidate for deferral. Present the budget as a waterfall: starting cash → planned spend by quarter → ending cash → implied milestone. The board wants to see that the plan gets to the next value-creation event before cash runs out, with at least a 2-3 month cushion.

**Seasonal business with significant cash flow variability:**
A company that generates 40% of its annual revenue in Q4 (retail, tax software, event companies) may run at a cash loss in Q1-Q3 even if the annual budget is profitable. The operating budget must be accompanied by a monthly cash flow forecast that shows whether the company needs a revolving credit facility or deferred payment terms with vendors to bridge through the slow season. Flag quarters where cash falls below a minimum operating threshold (typically 1.5-2 months of operating expenses). Do not reassure the user that the annual budget "works" without showing the quarterly and monthly cash position.

**Multi-entity or multi-currency business:**
If the company has subsidiaries or significant operations in multiple countries, build separate entity-level budgets in local currency before consolidating. Do not budget using a single consolidated currency without documenting the FX assumption (e.g., EUR/USD = 1.09). A 10% FX movement on €1M of European OpEx is a $100K budget variance that has nothing to do with operational performance -- it must be separated from operational variance in reporting. For entities with significant cross-border transactions, document intercompany transfer pricing assumptions and confirm they comply with applicable transfer pricing rules (the arm's length standard under OECD guidelines).

**Budget request produces a loss and management wants to hide the deficit:**
Never present a budget that conceals an operating loss through accounting manipulation, delayed COGS recognition, or by categorizing operating expenses as CapEx to improve EBITDA optics. If the budgeted expenses exceed revenue, show the gap explicitly in the summary: gross deficit, intended funding source (cash from balance sheet, new debt, equity raise), and the resulting impact on runway. Present a prioritized list of discretionary cuts that would close the gap, with the dollar amount for each. Presenting a dishonest budget to a board is a fiduciary failure; present the honest numbers with a clear-eyed action plan instead.

**Rapid headcount growth (doubling in one year) with mid-year hires:**
When headcount is planned to grow 50-100% in a year, the headcount phasing precision directly determines whether the budget is credible. Model every planned hire individually with a planned start month. Account for time-to-hire: typical time to hire for a Senior Engineer is 8-14 weeks from opening to start date; for an enterprise AE it is 6-10 weeks; for an executive it is 12-20 weeks. Budget for recruiting costs (agency fees or internal recruiter time) in the quarters preceding planned hire dates, not in the hire month. Account for ramp costs: new salespeople generating zero bookings for 3-4 months means Sales OpEx builds before revenue benefit arrives, compressing Q1-Q2 margins even if the annual budget is healthy.

**Company switching from calendar year to a custom fiscal year:**
A transition fiscal year (stub year) will be shorter than 12 months -- typically 6 or 9 months. Do not simply pro-rate an annual budget by dividing by 12 and multiplying by stub months. Fixed costs do not pro-rate (annual SaaS contracts, insurance premiums, and lease payments may fall entirely in the stub period or entirely outside it depending on renewal dates). Build the stub year budget line by line with attention to contract timing. Headcount costs should be computed from actual employment dates. Some depreciation schedules will span from the prior fiscal year, requiring a detailed CapEx sub-schedule.

**Budget approved late (after fiscal year has started):**
If the budget process runs past the fiscal year start date (common in companies with Q4 close delays, or early-stage companies without a formal process), departments are spending without approved guidance. Address this with two actions: first, issue a provisional spending authority memo authorizing departments to continue spending at prior year run rates (or a specified monthly cap) until the budget is approved; second, retroactively phase the budget from January 1 regardless of approval date so that Q1 actuals can be compared to the budget Q1 plan. Never skip Q1 variance analysis just because the budget was approved in February -- reconstruct what the plan would have been and hold the organization accountable to it.

---

## Example

**Input:** "We're a 30-person SaaS company doing $3M ARR. We're expecting to grow to $4.5M ARR by end of next year. We want to hire 10 more people -- 4 engineers, 3 salespeople, and 3 in G&A and people ops. Our current gross margin is about 74% and we want to improve it. We're venture-backed with $2.1M cash on hand and we need to make sure we have at least 12 months of runway."

---

## Annual Business Budget: Horizon SaaS, Inc. -- FY2026

### Budget Parameters
- **Fiscal year:** January 1, 2026 to December 31, 2026
- **Methodology:** Zero-based (all line items justified from scratch)
- **Revenue assumption:** $4,200,000 (base case -- $3,000,000 starting ARR growing to $4,500,000 exiting ARR, recognized ratably; average recognized ARR of $3,750,000 + $450,000 professional services)
- **Revenue model:** Annual recurring subscription + professional services (onboarding/implementation)
- **Headcount plan:** 30 (Jan 1) → 40 (Dec 31) | Average headcount: 36 for year
- **Target margins:** Gross 77%, EBITDA (12%), Net (15%)
- **Cash balance (Jan 1):** $2,100,000 | **Maximum monthly burn at budget:** $175,000 | **Implied runway:** 12 months
- **Constraints:** Maintain minimum 12-month runway at all times; no single-quarter cash burn above $525,000

---

### Revenue Scenarios

| Scenario | Annual Revenue | ARR Exit | Key Assumption |
|----------|---------------|----------|----------------|
| Upside | $4,600,000 | $5,200,000 | Close rate 26%, net revenue retention 108% |
| **Base (Budget)** | **$4,200,000** | **$4,500,000** | **Close rate 21%, net revenue retention 103%** |
| Downside | $3,500,000 | $3,600,000 | Close rate 16%, churn spikes to 12% |

**Downside trigger actions:** If Q2 revenue tracks below $900,000 (below downside annualized pace), freeze all discretionary marketing spend ($120K annualized), pause G&A hire #3 ($95K fully loaded), reduce event budget by 60% ($45K savings). Total identified discretionary cut: $260,000 annualized, reducing burn by ~$22K/month.

---

### Budget Summary

| Category | Annual Budget | % of Revenue | Notes |
|----------|-------------|-------------|-------|
| **Revenue** | $4,200,000 | 100% | Ratable ARR + PS fees |
| COGS -- Infrastructure (Fixed) | ($168,000) | 4.0% | AWS base + monitoring |
| COGS -- Support headcount (Fixed) | ($210,000) | 5.0% | 2 support engineers, fully loaded |
| COGS -- Variable hosting/API (Variable) | ($84,000) | 2.0% | Scales with active customer count |
| COGS -- Payment processing (Variable) | ($42,000) | 1.0% | 1% of subscription revenue |
| **Total COGS** | **($504,000)** | **12.0%** | |
| **Gross Profit** | **$3,696,000** | **88.0%** | +14 pts improvement from COGS optimization below |
| Engineering / R&D | ($1,050,000) | 25.0% | 10 engineers avg including 4 new hires |
| Sales | ($882,000) | 21.0% | 6 AEs avg including 3 new hires (OTE budgeted) |
| Marketing | ($462,000) | 11.0% | 2 headcount + demand gen + events |
| Customer Success | ($252,000) | 6.0% | 3 CSMs, 1:$1M ARR ratio |
| G&A | ($336,000) | 8.0% | Finance, legal, insurance, IT |
| People / HR | ($294,000) | 7.0% | Recruiting (10 hires) + benefits admin + L&D |
| **Total OpEx** | **($3,276,000)** | **78.0%** | |
| **EBITDA** | **$420,000** | **10.0%** | Pre-contingency |
| Contingency reserve (7%) | ($229,320) | 5.5% | CFO-controlled, board visibility |
| D&A (non-cash) | ($36,000) | 0.9% | Laptop depreciation + prior CapEx |
| Interest (venture debt) | ($0) | -- | No debt currently |
| **Net Income (Budget)** | **$154,680** | **3.7%** | |

**Note on gross margin improvement:** Current gross margin is 74%. The 88% budget target requires moving 2 support engineers from COGS to Customer Success (their work is 80% proactive success, not reactive support -- reclassification is appropriate and should be reviewed with the company's accountant) and renegotiating AWS reserved instance pricing (migrating 60% of compute to 1-year reserved instances saves approximately $58,000 vs. on-demand pricing). The 88% is achievable with these two changes; confirm before finalizing.

---

### Key Metrics Dashboard

| Metric | FY2026 Budget | FY2025 Estimated Actual | SaaS Benchmark (growth-stage) |
|--------|--------------|------------------------|-------------------------------|
| Gross Margin % | 88.0% | 74.0% | 75-85% |
| EBITDA Margin % | 10.0% | ~(8.0%) | (10)% to +10% at this ARR |
| S&M as % of Revenue | 21.0% | ~19.0% | 18-28% |
| R&D as % of Revenue | 25.0% | ~28.0% | 20-30% |
| G&A as % of Revenue | 8.0% | ~10.0% | 7-12% |
| Revenue per Employee | $116,667 | $100,000 | $100K-$150K (30-50 person SaaS) |
| Fully Loaded Cost per Head | $101,667 | $96,667 | -- |
| Rule of 40 Score | 50 (40% growth + 10% EBITDA) | ~28 | 40+ (healthy) |
| Cash Runway (months) | 12.1 | -- | 18+ target |

**Runway flag:** The budgeted runway of 12.1 months is at the minimum acceptable threshold. Two risk mitigants: (1) the company turns EBITDA-positive in this budget, meaning cash burn stops if the revenue plan is hit; (2) the Downside action plan identified above adds approximately 2 months of runway if triggered. Recommend discussing a $1.5M venture debt facility as a runway buffer -- the cost (typically 1-2% origination + prime+2% interest) is far cheaper than raising equity prematurely.

---

### Department Budget: Engineering / R&D
**Head:** VP Engineering | Headcount: 12 (Jan 1) → 16 (Dec 31) | Average: 14.0

| Line Item | Type | Committed/ Disc. | Q1 | Q2 | Q3 | Q4 | Annual | Justification |
|-----------|------|-----------------|-----|-----|-----|-----|--------|---------------|
| Existing engineers (12, fully loaded avg $95K) | Fixed | Committed | $285,000 | $285,000 | $285,000 | $285,000 | $1,140,000 | Current team; includes 1.25x gross-up for benefits/taxes |
| *Less: 2 support eng. moving to CS* | Fixed | Committed | ($47,500) | ($47,500) | ($47,500) | ($47,500) | ($190,000) | Reclassified to CS/COGS; see gross margin note |
| New Eng hire #1 -- Backend (start Feb 1) | Fixed | Committed | $19,792 | $23,750 | $23,750 | $23,750 | $91,042 | Feb start; builds API infrastructure for enterprise tier |
| New Eng hire #2 -- Frontend (start Mar 1) | Fixed | Committed | $0 | $23,750 | $23,750 | $23,750 | $71,250 | Mar start; accelerates dashboard product roadmap |
| New Eng hire #3 -- Platform/Infra (start May 1) | Fixed | Disc. | $0 | $11,875 | $23,750 | $23,750 | $59,375 | May start; depends on Q1 revenue meeting $750K threshold |
| New Eng hire #4 -- Senior Full Stack (start Aug 1) | Fixed | Disc. | $0 | $0 | $11,875 | $23,750 | $35,625 | Aug start; Q3 hire gated on Series A or Q2 revenue >$1.1M |
| Developer tools (GitHub Teams, Jira, Confluence) | Fixed | Committed | $7,200 | $7,200 | $8,400 | $8,400 | $31,200 | $19/user/month; cost increases in Q3 when hires #3-#4 onboard |
| Monitoring and observability (Datadog) | Fixed | Committed | $6,000 | $6,000 | $6,750 | $6,750 | $25,500 | $18/host/month; 9 hosts scaling to 12.5 avg |
|
