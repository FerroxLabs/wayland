---
name: pl-analysis
description: |
  Performs profit and loss (P&L) statement analysis including variance analysis, trend identification, margin analysis, and actionable recommendations. Use when the user asks about P&L analysis, income statement review, profit margin analysis, variance analysis, or financial performance review.
  Do NOT use for building a financial model from scratch (use financial-model-structure), personal budget review (use budget-planning), or tax preparation.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "analysis report strategy planning spreadsheets"
  category: "business-strategy"
  subcategory: "finance-accounting"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# P&L Analysis

## When to Use

**Use this skill when:**
- The user shares an income statement (monthly, quarterly, or annual) and asks for analysis, interpretation, or commentary
- The user asks for variance analysis comparing actual results to budget, forecast, prior quarter, or prior year same period
- The user wants to understand why their margins changed -- gross margin compression, SG&A creep, or EBITDA deterioration
- The user is preparing a board package, investor update, or management review and needs structured financial commentary
- The user wants to identify cost-cutting opportunities, revenue quality issues, or leverage points in their cost structure
- The user needs to assess whether underperformance is structural (requires strategy change) versus timing (self-correcting) versus one-time (non-recurring)
- The user is evaluating a business and needs a diagnostic read of its financial health from income statement data
- The user asks about operating leverage, contribution margin, or fixed vs. variable cost structure as it relates to P&L performance

**Do NOT use this skill when:**
- The user needs to build a financial model, three-statement model, or DCF from scratch -- use `financial-model-structure`
- The user wants personal budgeting or household expense analysis -- use `budget-planning`
- The user needs unit economics, CAC/LTV analysis, or per-customer profitability -- use `unit-economics`
- The user needs cash flow analysis or working capital assessment -- the P&L does not show cash timing; a cash flow statement is required for that work
- The user needs tax preparation, tax optimization, or deferred tax analysis -- this is outside the scope of P&L performance analysis and requires a CPA
- The user needs a full business valuation -- P&L analysis is an input to valuation, not a substitute; use a dedicated valuation skill
- The user needs to restate financials for GAAP/IFRS compliance -- that requires an accountant, not an analytical framework

---

## Process

### Step 1: Gather Data and Establish the Analytical Frame

Before touching numbers, establish exactly what you are analyzing and why the answer matters.

- Ask for the actual P&L for the period(s) in question. Ideal minimum: three periods of history (e.g., Q1, Q2, Q3 of current year) plus at least one comparison baseline (budget, prior year same period, or both).
- Establish the comparison type the user needs: budget vs. actual (performance management), prior period sequential (momentum analysis), or year-over-year same period (seasonality-adjusted performance).
- Clarify the business model: SaaS, manufacturing, retail, professional services, marketplace, and others have fundamentally different cost structures and appropriate margin benchmarks.
- Identify the audience: a board wants a 3-metric summary and strategic implications; a CFO wants line-item explanations and root causes; a department head wants their specific cost center compared to allocation.
- Ask about known one-time items upfront: restructuring charges, legal settlements, asset write-downs, deferred revenue recognition events, or pandemic-era distortions in prior periods. Flag these before analysis, not after.
- Confirm the revenue recognition method: is revenue recognized on delivery, on contract milestone, on cash receipt, or ratably over a subscription period? This determines whether a revenue miss is a real demand issue or a timing/recognition artifact.
- Establish the reporting currency and whether any FX translation adjustments are embedded in the numbers (this matters for international businesses and can create phantom variances).

### Step 2: Standardize and Reclassify the P&L Structure

Raw P&L data from accounting systems rarely matches the analytical format needed. Standardize it before analysis.

- Map the raw P&L into the five canonical layers: Revenue, Cost of Revenue (COGS), Gross Profit, Operating Expenses (OpEx), and Operating Income (EBIT). Then add EBITDA and Net Income as derived metrics.
- For revenue, separate recurring from non-recurring. In a SaaS business: subscription MRR/ARR is recurring; professional services and one-time setup fees are non-recurring. In a product company: repeat customers vs. one-time large deals.
- For COGS, apply the strict rule: COGS includes only costs that are directly variable with revenue delivery -- materials, direct labor, hosting and infrastructure for SaaS, fulfillment, payment processing fees. Costs that are fixed regardless of revenue volume (office rent, salaries of support overhead, admin) belong in OpEx, not COGS. Misclassification is the most common cause of misleading gross margin figures.
- Separate OpEx into S&M (Sales and Marketing), R&D (Research and Development), and G&A (General and Administrative). If the business reports by department rather than function, map departments to these three buckets. Document every reclassification assumption explicitly.
- Identify D&A (Depreciation and Amortization) line items -- they may be embedded in COGS, in each OpEx category, or shown as a separate line. Extract them to calculate EBITDA correctly.
- Add-back any stock-based compensation (SBC) if the user wants to show non-GAAP operating metrics. SBC is a real cost but a non-cash one; separating it allows visibility into cash-generative operations. Always show both GAAP and non-GAAP versions when SBC is material.
- Calculate every margin percentage as the line item divided by total revenue, not segment revenue. This preserves comparability across periods.

### Step 3: Execute Variance Analysis

Variance analysis is the mechanical core of the work. Do it rigorously and consistently.

- Calculate three variance columns for every material line item: dollar variance (Actual minus Budget or Actual minus Prior Period), percentage variance ((Actual - Baseline) / Baseline), and favorable/unfavorable (F/U) flag. Apply the correct sign convention: for revenue lines, actual above baseline is Favorable; for expense lines, actual above baseline is Unfavorable.
- Define and state the materiality threshold before listing variances. For businesses under $1M annual revenue, a line item needs to be at least $5,000 or 10% off baseline to warrant commentary. For $1M--$10M revenue businesses, use $25,000 or 5%. For businesses over $10M, use $100,000 or 3%. Apply the threshold that yields 3--8 items for commentary -- too few and the analysis is superficial; too many and it loses focus.
- For each material variance, force a decomposition into its components. A revenue variance has three possible sources: volume (units sold), price (ASP change), and mix (shift between high-margin and low-margin products). A cost variance has two sources: rate (the unit cost changed) and volume (more or fewer units were consumed). Always identify which component dominates.
- Apply the bridge analysis technique for the most material item: start with budget/baseline, add the volume effect, add the price or rate effect, add the mix effect, and land on actual. The sum must reconcile to the total variance. This prevents vague explanations like "revenue was lower due to fewer sales."
- Classify every variance into one of three types: Timing (will self-correct within 1--2 quarters, e.g., a deal that slipped from Q3 to Q4), Structural (reflects a real change in the business trajectory, e.g., pricing pressure, competitive dynamics, cost inflation), or One-Time (non-recurring, e.g., a legal settlement, a severance payment, a customer churn from bankruptcy). Structural variances require the most attention because they affect all future periods.
- Flag variances where expense growth outpaces revenue growth -- this is the leading indicator of operating leverage deterioration. Calculate the expense-to-revenue ratio for S&M and R&D specifically; if S&M is growing faster than revenue, payback periods are lengthening.

### Step 4: Conduct Margin Analysis

Margins are the most information-dense signals in a P&L. Analyze each layer separately before connecting them.

- **Gross margin analysis:** Gross margin is the most fundamental indicator of business model health. Calculate gross margin percentage for each period in the dataset. A contracting gross margin means the cost to deliver the product or service is rising relative to what customers pay -- this is serious and almost always structural. A 1pp gross margin decline on a $10M revenue business = $100K annualized, compounding.
  - Benchmark gross margins against industry norms: SaaS typically 65--80%; professional services 30--50%; hardware/physical products 20--45%; retail 25--50%; marketplaces 50--70% on net revenue. Use these to flag whether a business is structurally well-positioned or facing fundamental margin pressure.
  - Calculate the gross margin bridge: if gross margin moved from 68% to 63%, determine how much came from revenue mix shift vs. COGS unit cost increases vs. pricing changes.

- **Operating leverage analysis:** Examine whether OpEx grew faster or slower than revenue. If revenue grew 15% but S&M grew 25%, that is negative operating leverage and a warning sign. Calculate each OpEx line as a percentage of revenue and track the trend. Healthy scaling businesses show OpEx ratios declining over time even as absolute spend increases.

- **EBITDA margin:** This is the proxy for cash generation from operations. Track EBITDA margin trajectory across all available periods. A business with contracting EBITDA margins is either growing into its cost structure (potentially acceptable for early-stage) or losing operational control (serious for mature businesses).

- **Contribution margin vs. operating margin:** If you have data to calculate contribution margin (revenue minus variable costs only), do so. It tells you the margin available to cover fixed costs after serving each incremental unit of revenue. This matters for breakeven analysis and pricing decisions.

- **Net margin and below-the-line items:** Net margin includes interest expense, taxes, and any non-operating income. If net margin is moving significantly while operating margin is stable, the cause is below-the-line. Flag this explicitly -- P&L analysis should not conflate operational performance with financing decisions.

### Step 5: Identify the 3--5 Primary Drivers

Distill the analysis into a focused set of causes. An analysis with 12 "key drivers" has no key drivers.

- Rank all material variances by absolute dollar impact. Select the top 3--5 that collectively explain at least 80% of the total variance from baseline.
- For each driver, answer four questions: What specifically happened? (The "what" -- e.g., "hosting costs increased $40K due to unplanned data migration") Why did it happen? (The "why" -- e.g., "legacy infrastructure migration accelerated from Q4 into Q3") Is it recurring? (Timing, structural, or one-time classification) What does it mean for the next 1--2 quarters? (Forward impact with a specific dollar estimate where possible)
- Distinguish between a symptom and a cause. "Revenue was below budget" is a symptom. "Enterprise pipeline conversion rate dropped from 22% to 14% due to elongated procurement cycles in the financial services vertical" is a cause. Push to the cause level.
- Look for compound effects: a revenue miss that also causes variable COGS to underspend creates a partial natural offset but also reduces the scale coverage of fixed costs -- this double effect on operating income is larger than the revenue miss alone.
- Flag any drivers that are interconnected. S&M overspend combined with a revenue miss can indicate either a lag effect (spend now, revenue later) or an efficiency deterioration (spend more, get less). These have opposite strategic implications and must be disambiguated.

### Step 6: Develop Specific, Quantified Recommendations

Generic recommendations destroy the value of good analysis. Every recommendation must pass the "so what" test.

- Tie each recommendation explicitly to a specific finding number or variance item. No recommendation should exist without a traceable root cause.
- Every recommendation must be actionable within the next 90 days. "Improve revenue" is not a recommendation. "Accelerate Q4 close of the 8 enterprise deals currently in final negotiation (combined ARR $280K) to recover 60% of the Q3 revenue miss" is a recommendation.
- Quantify the estimated impact: revenue upside, cost savings, or margin improvement, in dollars per period. Use ranges where precise numbers are unavailable (e.g., "$15K--$25K per quarter"). Label all estimates and their assumptions.
- Assign a priority using a 2x2 framework: Impact (High/Low) crossed with Effort (Low/High). High impact, low effort recommendations are "Quick Wins" and go first. High impact, high effort are "Strategic Investments." Low impact regardless of effort are deprioritized or omitted.
- Distinguish between immediate actions (this month), tactical adjustments (this quarter), and strategic reviews (next planning cycle). Mixing timeframes in a single recommendations list creates paralysis.
- Where recommendations conflict or require trade-offs (e.g., cutting S&M to save costs vs. maintaining S&M spend to recover revenue), call out the trade-off explicitly. The analyst's job is to surface the decision clearly, not to hide complexity.

### Step 7: Format the Output for the Stated Audience

The same analysis needs different packaging for different consumers.

- **Board and investor audience:** Lead with the 2--3 sentence executive summary. Use a single high-level P&L table (no more than 8--10 line items). Emphasize margin trend direction and strategic implications. End with the top 2 decisions that require board input or approval. Omit line-item granularity.
- **CFO and executive management audience:** Include the full variance table, margin trend table, all 3--5 drivers with root cause analysis, and the full recommendations matrix with priorities and estimated impact. This is the default format.
- **Department head audience:** Scope the analysis to their cost center only. Show their budget allocation, actual spend, variance, and a comparison to headcount and project milestones they own. Connect cost overruns to specific initiatives they can control.
- **Investor due diligence audience:** Add quality-of-earnings notes alongside the P&L. Call out any revenue recognition choices, non-cash charges, and addbacks that affect comparable EBITDA. Use LTM (last twelve months) and NTM (next twelve months) framing rather than point-in-time.

---

## Output Format

```
## P&L Analysis: [Company / Business Unit] -- [Period] vs. [Comparison Baseline]
**Prepared for:** [Audience]
**Analysis type:** [Actual vs. Budget | Actual vs. Prior Period | YoY Same Period]
**Materiality threshold applied:** [Dollar amount] or [Percentage]

---

### Executive Summary
[2--3 sentences covering: overall performance verdict (beat/miss/in-line), 
primary driver of any gap, and the most important action required. 
Example: "Q3 revenue missed budget by 10% ($50K), driven by a conversion rate 
decline in the enterprise segment, while gross margin improved 2pp to 70% 
indicating healthy unit economics. The shortfall was fully absorbed into 
operating income due to simultaneous COGS efficiency, but S&M overspend of 
$20K (20% above budget) with no corresponding revenue return is the critical 
issue requiring immediate audit."]

---

### P&L with Variance Analysis

| Line Item                    | Actual ($) | Budget ($) | Var ($)   | Var (%)  | F/U | Type       |
|------------------------------|-----------|-----------|----------|---------|-----|------------|
| **Total Revenue**            |           |           |          |         |     |            |
| -- Recurring Revenue         |           |           |          |         |     |            |
| -- Non-Recurring Revenue     |           |           |          |         |     |            |
| **Cost of Revenue (COGS)**   |           |           |          |         |     |            |
| **Gross Profit**             |           |           |          |         |     |            |
| *Gross Margin %*             |    X.X%   |    X.X%   | X.Xpp    |         |     |            |
| Sales & Marketing            |           |           |          |         |     |            |
| Research & Development       |           |           |          |         |     |            |
| General & Administrative     |           |           |          |         |     |            |
| **Total OpEx**               |           |           |          |         |     |            |
| *OpEx as % of Revenue*       |    X.X%   |    X.X%   | X.Xpp    |         |     |            |
| **EBITDA**                   |           |           |          |         |     |            |
| *EBITDA Margin %*            |    X.X%   |    X.X%   | X.Xpp    |         |     |            |
| D&A                          |           |           |          |         |     |            |
| **Operating Income (EBIT)**  |           |           |          |         |     |            |
| Interest & Non-Op Items      |           |           |          |         |     |            |
| Taxes                        |           |           |          |         |     |            |
| **Net Income**               |           |           |          |         |     |            |
| *Net Margin %*               |    X.X%   |    X.X%   | X.Xpp    |         |     |            |

F = Favorable, U = Unfavorable
Type = One-Time (OT) | Timing (T) | Structural (S)

---

### Margin Trend Analysis (Multi-Period)

| Metric                   | [Period -3] | [Period -2] | [Period -1] | Current  | Trend Direction        |
|--------------------------|------------|------------|------------|---------|------------------------|
| Gross Margin %           |            |            |            |         | Expanding / Contracting / Flat |
| S&M as % of Revenue      |            |            |            |         | Improving / Worsening  |
| R&D as % of Revenue      |            |            |            |         | Improving / Worsening  |
| G&A as % of Revenue      |            |            |            |         | Improving / Worsening  |
| EBITDA Margin %          |            |            |            |         | Expanding / Contracting |
| Net Margin %             |            |            |            |         | Expanding / Contracting |

**Trend interpretation:** [1--2 sentences explaining what the trend pattern means 
collectively -- e.g., "Gross margin is expanding while OpEx ratios are also rising, 
indicating the business is investing ahead of revenue scale -- acceptable if 
revenue acceleration is anticipated within 1--2 quarters, problematic if not."]

---

### Variance Bridge (Top Material Item)

Starting point (Budget): $[X]
+ Volume effect:         $[X] ([explain: X fewer/more units at budgeted ASP])
+ Price/Rate effect:     $[X] ([explain: ASP $X below/above budget])
+ Mix effect:            $[X] ([explain: X% higher weighting to lower-margin product])
= Actual:                $[X]
Total variance:          $[X] ([X]%) [F/U]

---

### Key Variance Drivers

**Driver 1: [Line Item] -- [F/U] $[X] ([X]%) -- [Type: OT/T/S]**
- **Root cause:** [Specific, one-level-deeper explanation beyond "costs were higher"]
- **Volume vs. rate/price decomposition:** [Which dominated?]
- **Forward impact:** [Dollar estimate of ongoing impact per quarter if structural, 
  or resolution timeline if timing]
- **Watch indicator:** [The specific metric to track to confirm this resolves or escalates]

**Driver 2: [Line Item] -- [F/U] $[X] ([X]%) -- [Type: OT/T/S]**
- **Root cause:** [Specific explanation]
- **Volume vs. rate/price decomposition:** [Which dominated?]
- **Forward impact:** [Dollar estimate or timeline]
- **Watch indicator:** [Specific metric]

**Driver 3: [Line Item] -- [F/U] $[X] ([X]%) -- [Type: OT/T/S]**
- **Root cause:** [Specific explanation]
- **Volume vs. rate/price decomposition:** [Which dominated?]
- **Forward impact:** [Dollar estimate or timeline]
- **Watch indicator:** [Specific metric]

[Add Driver 4 and Driver 5 if applicable]

---

### Quality-of-Earnings Notes
[Include only when relevant -- skip section if not applicable]
- **Non-recurring items included in revenue:** [Describe and quantify]
- **Non-cash charges in COGS or OpEx:** [SBC, D&A, impairments -- amounts]
- **Revenue recognition judgments:** [Any deferred revenue acceleration, 
  bill-and-hold arrangements, percent-of-completion estimates]
- **Adjusted EBITDA vs. GAAP EBITDA:** [Addback items and amounts]

---

### Recommendations

| #  | Action (Specific)                        | Linked Driver | Est. Impact    | Timeframe | Priority        |
|----|------------------------------------------|---------------|----------------|-----------|-----------------|
| 1  | [Concrete action with named owner/system]| Driver [X]    | $[X]--$[X]/qtr | [Month]   | Quick Win       |
| 2  | [Concrete action]                        | Driver [X]    | $[X]/qtr       | [Quarter] | Quick Win       |
| 3  | [Concrete action]                        | Driver [X]    | $[X]--$[X]/yr  | [Quarter] | Strategic       |
| 4  | [Concrete action]                        | Driver [X]    | $[X]/yr        | Next cycle| Monitor Only    |

Priority Key: Quick Win (High impact, low effort) | Strategic (High impact, high effort) | 
Optimize (Low impact, low effort) | Deprioritize (Low impact, high effort)

---

### Data Gaps and Assumptions
- [List any reclassifications made to standardize the P&L]
- [Note any line items where data was unavailable and how the analysis was adjusted]
- [Flag where estimates were used rather than reported figures]
```

---

## Rules

1. **Never conflate percentage change with percentage point change.** Gross margin moving from 62% to 67% is a 5pp improvement, not an 8.1% improvement. Always express margin movements in percentage points (pp). Reserve percentage change language for absolute values like revenue (revenue grew 8%).

2. **Apply consistent sign conventions throughout.** Expenses are shown as negative numbers in the P&L table (parenthetical or with minus signs). Favorable variances are positive for revenue lines (actual exceeds budget) and positive for expense lines (actual is below budget, meaning less was spent). Never mix conventions in a single table.

3. **Never accept a variance explanation that is tautological.** "Revenue was below budget because we sold less" is not an explanation -- it is a restatement. Force the analysis to one causal level deeper: was it a volume shortfall (fewer deals closed), an ASP shortfall (deals closed at lower prices), a mix shift (more small deals, fewer large), or a recognition timing issue?

4. **State the materiality threshold explicitly before listing variances and apply it consistently.** Do not mention a $3,000 variance in G&A while omitting a $4,000 favorable variance in COGS. Use the defined threshold for all lines without exception.

5. **Separate recurring from non-recurring revenue before calculating any margins.** A $50K one-time consulting engagement in a SaaS company's quarter inflates reported gross margin if it sits above the COGS line. Adjusted gross margin excluding one-time items is the operative health metric for ongoing operations.

6. **Do not allow COGS misclassification to pass unchallenged.** If a business is reporting COGS that includes items that are clearly fixed-cost (executive salaries of the delivery team, all office rent), note it and calculate an adjusted gross margin with a correct COGS. Misclassified COGS inflates gross margin and obscures true unit economics.

7. **Tag every variance as Timing, Structural, or One-Time -- never leave the type blank.** This classification is the most actionable output of variance analysis. Structural variances require strategy changes; timing variances require monitoring; one-time variances require reforecasting. Unclassified variances create confusion about what action to take.

8. **Calculate operating leverage explicitly.** Divide the percentage change in operating income (or EBITDA) by the percentage change in revenue. A ratio above 1.0 means the business has positive operating leverage and is scaling efficiently. A ratio below 1.0 means OpEx is growing faster than revenue -- flag this regardless of whether absolute operating income is positive.

9. **When comparing to prior year for seasonal businesses, always flag any structural changes that make the comparison non-representative.** A business that added a new product line, made an acquisition, changed pricing, or shifted its sales model in the past 12 months cannot be compared directly to prior year without adjusting for those changes first.

10. **Never present a recommendation without an estimated dollar impact and a timeframe.** "Review vendor contracts" is a task, not a recommendation. A recommendation must specify the action, the expected outcome, and the approximate financial magnitude. If a precise estimate is impossible, provide a range and explain what drives the width of the range.

11. **Cross-check internal consistency before presenting the analysis.** Revenue minus COGS must equal Gross Profit. Gross Profit minus Total OpEx must equal EBIT. Verify that the numbers foot and cross before presenting. A P&L that does not foot destroys credibility regardless of the quality of the commentary.

12. **When EBITDA is calculated, always show the D&A addback explicitly.** Many users conflate EBIT and EBITDA. Showing the D&A addback line makes the derivation transparent and allows the user to verify the calculation independently.

---

## Edge Cases

### 1. No Budget or Comparison Baseline Available

When only a single period of actuals is provided, period-over-period comparison is impossible in the traditional sense. Switch the analysis mode to structure analysis: focus on what the current cost structure implies rather than how it changed.

- Calculate all margin percentages and compare to industry benchmarks for the stated business model. A B2B SaaS company reporting 48% gross margin should be flagged against the 65--80% industry norm with a specific explanation of what typically drives the gap (unusually high hosting costs, significant professional services revenue mixed in, overloaded COGS classification).
- Calculate the implied breakeven revenue at the current cost structure: divide total fixed costs by gross margin percentage to find the revenue level at which operating income reaches zero.
- Identify the fixed vs. variable cost split within the available data. Expenses that scale with headcount (salaries, benefits) are quasi-fixed. Expenses that scale with revenue (commissions, payment processing, AWS usage-based pricing) are variable.
- Be explicit that this analysis is structural, not comparative, and note that adding even one prior period would enable trend detection.

### 2. Highly Seasonal Business (Retail, Tax Services, Agriculture, Events)

Sequential quarter-over-quarter comparison is meaningless for a seasonal business and will generate false alarms. Q1 for a ski resort will always look terrible compared to Q4.

- Default to year-over-year same-period comparison (Q3 this year vs. Q3 last year) for all seasonal businesses.
- If YoY data is not available but sequential quarters are, calculate a seasonality index for each quarter using any available historical data and apply it before comparing. A Q1 that is typically 40% of Q4 revenues should be evaluated against that expectation, not against Q4 in absolute terms.
- Flag deseasonalized trends explicitly. If revenue grew 12% YoY in Q3 but the prior year Q3 included a one-time large event booking, the underlying deseasonalized growth is lower -- calculate it.
- For businesses where seasonality is compressing or shifting (climate effects on ski resorts, shifting consumer behavior), note that the historical seasonality index may not be reliable going forward.

### 3. Multi-Segment or Multi-Product P&L

Consolidated P&L analysis can be deeply misleading when segments have different margin profiles, growth rates, and cost structures.

- Decompose the analysis by segment before rolling up to consolidated. If Segment A has 75% gross margins and 20% revenue growth while Segment B has 30% gross margins and is flat, the blended consolidated gross margin is declining for mix reasons even though both segments are individually healthy.
- Calculate the mix shift effect explicitly: if Segment B's share of total revenue grew from 30% to 40%, calculate how much of the consolidated gross margin change is attributable purely to mix rather than to operational changes in either segment.
- Apply the "segment P&L reconciliation" test: the sum of all segment revenues and segment gross profits must equal the consolidated figures. Any difference is unallocated corporate overhead or intercompany eliminations -- flag it.
- For businesses with shared infrastructure across segments (shared G&A, shared engineering), note that segment operating margins may not fully reflect the cost-to-serve of each segment if overhead allocation methodology is arbitrary.

### 4. Startup or Pre-Profitability Business with Negative Margins

Standard P&L analysis framed around margin improvement is appropriate only when the losses are a strategic choice with a visible path to profitability. Undifferentiated losses require a different frame.

- Calculate burn multiple: net cash burned in the period divided by net new ARR added. A burn multiple below 1.5x is efficient for an early-stage business; above 2.5x is a warning sign regardless of revenue growth rate.
- Calculate months of runway implied by the current burn rate against known cash balance, if the user provides it.
- Identify the contribution margin breakeven: at what revenue level does gross profit cover variable selling and marketing costs? This is the first profitability milestone to target, before full operating breakeven.
- Track "improvement trajectory" rather than absolute levels: if gross margin improved from -15% to -5% to +12% over three consecutive quarters, the trajectory is the relevant signal. Absolute level is less important than rate of improvement.
- Distinguish between losses that are funding growth (S&M spend that generates demonstrably profitable customer cohorts) and losses that reflect structural cost problems (COGS above revenue, G&A that is disproportionate to revenue scale). The former is a feature of the growth strategy; the latter is a fundamental problem.

### 5. Acquisition-Related P&L Distortions

When a business has made an acquisition in the analysis window, the P&L is not comparable across periods on a reported basis without adjustment.

- Identify any acquisition-related line items: purchase price amortization (PPA) charges in COGS or OpEx, acquisition-related transaction costs in G&A, integration-related severance in any department.
- Calculate organic-only growth rates by removing acquired revenue and acquired costs from the current period before comparing to the pre-acquisition baseline.
- Flag that amortization of acquired intangibles can depress EBIT and net income for years post-acquisition without any operational cash impact -- EBITDA is the more relevant operating metric in this context.
- Note that comparative margins pre- and post-acquisition will reflect the margin profile of the acquired entity, which may be structurally different. A high-margin acquirer buying a low-margin target will see consolidated margins compress even if integration is proceeding as planned.

### 6. Non-Standard or Recast P&L Formats

Accounting systems (QuickBooks, NetSuite, Xero, Sage) often generate P&L reports in formats that do not match analytical conventions -- expenses listed without sign, COGS mixed with OpEx, multiple revenue lines without subtotals.

- Reclassify all items before analysis. Document each reclassification with a brief rationale: "Moved $18K of engineering contractor costs from G&A to R&D on the basis that these are product development expenses."
- Watch for double-counting: some accounting setups report "Total Expenses" as a subtotal that includes COGS, meaning COGS is added to OpEx twice when calculating Net Income. Verify that Net Income = Revenue - COGS - OpEx - Other Items and that the arithmetic foots.
- If a user provides a report with only top-level buckets (Total Revenue, Total Expenses, Net Income), note the analytical limitations clearly. Gross margin cannot be calculated without separating COGS from OpEx. Offer to ask follow-up questions to obtain the missing breakdown.
- When formats cannot be fully reconciled, do the analysis at the level of detail available and specify exactly what additional data would unlock each additional analytical dimension.

### 7. FX and Multi-Currency P&L

A P&L that blends results across geographies in different currencies can show phantom variances that are entirely attributable to exchange rate movements rather than operational performance.

- Ask whether the P&L is reported in a single functional currency with FX translation already applied, or whether it is a multi-currency consolidated report. If translated, ask what exchange rates were used (period-average for income statement items is standard under ASC 830 / IAS 21).
- Calculate the FX impact on revenue by applying the prior period exchange rate to the current period foreign currency revenues. The difference between this constant-currency revenue and the reported revenue is the FX effect.
- Report revenue performance in both "as reported" (including FX) and "constant currency" (holding rates flat) terms. A business that grew reported revenue by 3% but constant-currency revenue by 9% has strong underlying performance masked by FX headwinds.
- Note that operating margins calculated on translated P&Ls can be distorted if costs are in a different currency than revenues (a common pattern for companies with USD revenues but local-currency cost bases in lower-cost geographies).

---

## Example

**Input:** "Can you analyze our Q3 P&L? We're a B2B SaaS company. Here's the data:

Revenue: Subscription $1,840K actual vs $2,000K budget. Professional Services $210K actual vs $150K budget. Total Revenue $2,050K actual vs $2,150K budget.

COGS: Hosting/Infrastructure $185K actual vs $170K budget. Customer Success salaries $220K actual vs $200K budget. Professional Services delivery $168K actual vs $120K budget. Total COGS $573K actual vs $490K budget.

OpEx: Sales & Marketing $620K actual vs $580K budget. R&D $410K actual vs $400K budget. G&A $195K actual vs $180K budget.

Prior quarters: Q1 Total Revenue $1,820K, Gross Profit $1,190K. Q2 Total Revenue $1,940K, Gross Profit $1,280K.

D&A is $45K per quarter, included in G&A. One-time item: $38K legal settlement paid in Q3, included in G&A actual."

---

**Output:**

## P&L Analysis: B2B SaaS Company -- Q3 Actual vs. Budget

**Prepared for:** Management team
**Analysis type:** Actual vs. Budget, with sequential trend (Q1--Q3)
**Materiality threshold applied:** $15,000 or 5%, whichever is first breached

---

### Executive Summary

Q3 total revenue of $2,050K missed budget by $100K (4.7%), driven entirely by a $160K shortfall in subscription revenue that was partially offset by a $60K professional services outperformance. Gross margin deteriorated to 72.1% from a 72.1% budget target -- but this masks two opposing forces: subscription gross margin held while professional services margins compressed severely due to delivery cost overruns. More critically, excluding a $38K one-time legal settlement, adjusted G&A was in line with budget, but reported EBIT missed plan by $253K. The primary action required is an immediate review of professional services pricing and scoping -- delivery costs of $168K against $210K in revenue represents a 20.0% PS gross margin compared to the 20.0% budget implied margin, but the absolute overspend on delivery is a structural risk if PS volume grows.

---

### P&L with Variance Analysis

| Line Item                          | Actual ($K) | Budget ($K) | Var ($K) | Var (%)  | F/U | Type |
|------------------------------------|------------|------------|---------|---------|-----|------|
| **Subscription Revenue**           | 1,840       | 2,000       | (160)   | (8.0%)  | U   | T/S  |
| **Professional Services Revenue**  | 210         | 150         | 60      | 40.0%   | F   | T    |
| **Total Revenue**                  | 2,050       | 2,150       | (100)   | (4.7%)  | U   |      |
| Hosting / Infrastructure           | (185)       | (170)       | (15)    | (8.8%)  | U   | S    |
| Customer Success Salaries          | (220)       | (200)       | (20)    | (10.0%) | U   | S    |
| PS Delivery Costs                  | (168)       | (120)       | (48)    | (40.0%) | U   | S    |
| **Total COGS**                     | (573)       | (490)       | (83)    | (16.9%) | U   |      |
| **Gross Profit**                   | 1,477       | 1,660       | (183)   | (11.0%) | U   |      |
| *Gross Margin %*                   | 72.1%       | 77.2%       | (5.1pp) |         | U   |      |
| Sales & Marketing                  | (620)       | (580)       | (40)    | (6.9%)  | U   | S    |
| Research & Development             | (410)       | (400)       | (10)    | (2.5%)  | F   | --   |
| G&A (reported)                     | (195)       | (180)       | (15)    | (8.3%)  | U   | OT   |
| *-- of which: Legal settlement*    | (38)        | --          | (38)    |         | U   | OT   |
| *G&A adjusted (ex-settlement)*     | (157)       | (180)       | 23      | 12.8%   | F   | S    |
| **Total OpEx**                     | (1,225)     | (1,160)     | (65)    | (5.6%)  | U   |      |
| *OpEx as % of Revenue*             | 59.8%       | 54.0%       | (5.8pp) |         | U   |      |
| **EBITDA (reported)**              | 252         | 500         | (248)   | (49.6%) | U   |      |
| *D&A addback*                      | 45          | 45          | --      |         |     |      |
| **EBIT (reported)**                | 207         | 455         | (248)   | (54.5%) | U   |      |
| **EBITDA adjusted (ex-settlement)**| 290         | 500         | (210)   | (42.0%) | U   |      |
| *EBITDA Margin % (reported)*       | 12.3%       | 23.3%       | (11.0pp)|         | U   |      |
| *EBITDA Margin % (adjusted)*       | 14.1%       | 23.3%       | (9.2pp) |         | U   |      |
| **Net Income (reported)**          | 207         | 455         | (248)   | (54.5%) | U   |      |
| *Net Margin % (reported)*          | 10.1%       | 21.2%       | (11.1pp)|         | U   |      |

F = Favorable, U = Unfavorable | OT = One-Time, T = Timing, S = Structural

*Note: No interest or tax figures provided; Net Income approximated as EBIT. Actual net income will differ if the business carries debt or has tax obligations.*

---

### Margin Trend Analysis (Q1--Q3)

| Metric                     | Q1         | Q2         | Q3 Actual  | Q3 Budget  | Trend Direction            |
|----------------------------|-----------|-----------|-----------|-----------|----------------------------|
| Gross Margin %             | 65.4%      | 65.9%      | 72.1%      | 77.2%      | Expanding but below budget |
| S&M as % of Revenue        | N/A*       | N/A*       | 30.2%      | 27.0%      | Above target               |
| R&D as % of Revenue        | N/A*       | N/A*       | 20.0%      | 18.6%      | Slightly above target      |
| G&A as % of Revenue        | N/A*       | N/A*       | 9.5%       | 8.4%       | Above target (legal event) |
| EBITDA Margin % (reported) | N/A*       | N/A*       | 12.3%      | 23.3%      | Below target               |
| Net Margin % (reported)    | N/A*       | N/A*       | 10.1%      | 21.2%      | Below target               |

*Q1 and Q2 OpEx detail not provided. Gross profit provided for trend analysis only.

**Trend interpretation:** Gross margin has improved 6.7pp from Q1 (65.4%) to Q3 (72.1%), which is a strong positive signal on unit economics -- the core subscription product is getting more efficient to deliver. However, Q3 gross margin fell 5.1pp below the 77.2% budget, entirely driven by professional services delivery cost overruns and CS headcount growing ahead of revenue. The improvement from Q1 to Q3 indicates the trajectory is right; the miss versus budget indicates execution gaps in Q3 specifically.

---

### Variance Bridge: Gross Margin % (Actual 72.1% vs. Budget 77.2%)

```
Budget Gross Margin %:                              77.2%
-- Effect of subscription revenue shortfall
   ($160K less revenue, subscription COGS flat):   (5.7pp)  [Fixed COGS costs now spread over smaller revenue base]
+ Effect of PS revenue outperformance
   ($60K incremental PS revenue at low margin):    +0.8pp   [PS gross margin ~20%, dilutive to blended margin]
-- Infrastructure cost overrun ($15K):             (0.7pp)
-- CS salaries above budget ($20K):                (1.0pp)
-- PS delivery overrun ($48K):                     (2.3pp)
+ Natural offset from lower revenue base:          +3.8pp   [COGS ratios improve slightly on mixed volume]
= Actual Gross Margin %:                            72.1%
Variance:                                          (5.1pp)  Unfavorable
```

---

### Key Variance Drivers

**Driver 1: Subscription Revenue Shortfall -- Unfavorable ($160K) (8.0%) -- Type: Timing / Structural (TBD)**
- **Root cause:** Subscription revenue missed budget by $160K. Without pipeline data, the decomposition is: (a) volume effect -- fewer new logos or net negative churn reduced recurring base, (b) price effect -- discounting on renewals or new deals below target ASP, or (c) recognition timing -- contracts signed but not yet recognized. All three have different implications.
- **Volume vs. price decomposition:** Requires ARR/MRR bridge data. Priority next step is to obtain: beginning ARR, new ARR added, expansion ARR, churn ARR, and ending ARR for Q3 vs. budget.
- **Forward impact:** At the current run rate, if the $160K monthly shortfall reflects a lower ARR base (structural), annualized subscription revenue shortfall is $640K -- 8.0% below the implied annual budget. If timing, Q4 revenue should catch up. This distinction is the most important open question from this analysis.
- **Watch indicator:** Monthly ARR reconciliation for October. If new ARR added in October matches budget, Q3 was likely a timing issue. If new ARR continues below budget, declare the variance structural and reforecast the annual P&L.

**Driver 2: Professional Services Delivery Cost Overrun -- Unfavorable ($48K) (40.0%) -- Type: Structural**
- **Root cause:** PS delivery costs of $168K on $210K of PS revenue yields a PS gross margin of 20.0% ($42K gross profit). Budget implied delivery costs of $120K on $150K revenue also yields 20.0% gross margin ($30K gross profit). However, the absolute PS delivery cost grew 40% while PS revenue grew 40% -- the margins held but the absolute overrun on delivery created $48K more COGS than budgeted. The structural risk is that the $210K PS revenue at 20% gross margin is substantially diluting the subscription business which likely carries 80%+ gross margins.
- **Volume vs. rate decomposition:** Volume drove most of the COGS increase (more PS engagements); the rate appears consistent with budget. This is actually a mix problem disguised as a COGS overrun -- the business is selling more of its lower-margin PS work.
- **Forward impact:** Every $100K of incremental PS revenue adds approximately $80K of COGS. If PS as a percentage of total revenue continues to grow (from 7.3% of budget to 10.2% of actual in Q3), blended gross margins will compress by approximately 1.5pp per 5pp shift in PS revenue mix.
- **Watch indicator:** PS revenue as a percentage of total bookings in Q4. If PS mix continues above 10% of revenue, set a minimum PS gross margin floor (recommend 35%+) by repricing or more disciplined scoping.

**Driver 3: Customer Success Salaries Above Budget -- Unfavorable ($20K) (10.0%) -- Type: Structural**
- **Root cause:** CS salary costs exceeded budget by $20K (10%). This is likely a headcount-driven variance: either a hire made ahead of schedule or a compensation adjustment not reflected in the budget. A 10% budget overrun in CS is a yellow flag because CS costs should scale with customer count, not with revenue -- in a SaaS business, CS hired ahead of revenue is acceptable, but it should be a conscious decision, not a budget surprise.
- **Rate vs. volume decomposition:** Likely a volume effect (one additional FTE) rather than a rate effect (unplanned salary increase). At $200K budgeted CS salary for the quarter, budget implies approximately 3--4 CS headcount at typical SaaS CS compensation. A $20K overrun suggests one partial-quarter hire.
- **Forward impact:** If this hire was made to manage increased customer load, it is a permanent $80K annualized cost increase. If it was backfill for attrition not reflected in budget, it is neutral to plan for the remainder of the year.
- **Watch indicator:** CS headcount as of quarter-end vs. budgeted headcount. Confirm with the CS team leader whether the overage represents net new capacity or backfill.

**Driver 4: Sales & Marketing Overspend -- Unfavorable ($40K) (6.9%) -- Type: Structural**
- **Root cause:** S&M exceeded budget by $40K (6.9%) in a quarter where subscription revenue missed budget by $160K (8.0%). This is the most concerning combination in the analysis: more was spent on sales and marketing than planned, and less subscription revenue was generated. S&M efficiency deteriorated in Q3. Budget implied an S&M-to-subscription-revenue ratio of 29.0% ($580K / $2,000K). Actual ratio was 33.7% ($620K / $1,840K).
- **Efficiency implication:** The incremental $40K of S&M spend did not generate incremental subscription revenue -- it is entirely plausible it was invested in pipeline that will convert in Q4. However, until Q4 results are known, the working assumption must be that S&M efficiency declined.
- **Forward impact:** If the $40K represents a campaign that front-loads cost for Q4 pipeline (timing), the ratio will normalize. If it represents structural S&M cost inflation (more expensive channels, lower close rates, inflated headcount), this ratio will persist and EBITDA margins will compress by approximately 4--5pp below the original plan.
- **Watch indicator:** Q4 pipeline generation from Q3 S&M activity. Request marketing's Q3 campaign spend with attributed pipeline generated for each channel. Calculate cost-per-qualified-opportunity vs. budget.

---

### Quality-of-Earnings Notes
- **One-time item in G&A:** $38K legal settlement is non-recurring. Adjusted G&A of $157K is $23K below budget, indicating strong underlying G&A control.
- **Adjusted EBITDA:** Adjusted for the $38K settlement, EBITDA is $290K (14.1% margin). The 9.2pp gap to budget on adjusted EBITDA is a cleaner measure of operational underperformance than the reported 11.0pp gap.
- **Professional Services revenue quality:** PS revenue of $210K is non-recurring in nature and should not be included in ARR/MRR calculations. If investors or the board are assessing subscription ARR trajectory, PS revenue inflates headline revenue growth and depresses apparent gross margins.
- **COGS classification note:** Customer Success salaries ($220K) are classified in COGS. This is standard practice for SaaS companies where CS is directly tied to service delivery and retention. If CS is predominantly serving as an expansion sales function (upsells), a portion may be reclassifiable to S&M. Verify with management.

---

### Recommendations

| #  | Action                                                                                         | Linked Driver | Est. Impact       | Timeframe     | Priority     |
|----|-----------------------------------------------------------------------------------------------|---------------|-------------------|---------------|--------------|
| 1  | Obtain ARR bridge for Q3 (new, expansion, churn) to classify subscription miss as timing vs. structural; reforecast annual P&L accordingly | Driver 1 | Determines $0--
