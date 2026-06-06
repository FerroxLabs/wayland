---
name: marketing-analytics-report
description: |
  Produces a structured marketing analytics report with channel performance,
  customer acquisition cost, conversion rates, and actionable recommendations
  using marketing metrics methodology. Use when the user asks to create a
  marketing report, analyze campaign performance, review marketing metrics,
  build a marketing dashboard report, or present marketing results to
  stakeholders.
  Do NOT use for operations KPI dashboards (use ops-metrics-dashboard),
  financial P&L analysis (use finance skills), or product usage analytics
  (use product management skills).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "marketing analysis report planning"
  category: "marketing-sales"
  subcategory: "marketing"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Marketing Analytics Report

## When to Use

Use this skill when any of the following conditions apply:

- The user asks to create a monthly, quarterly, or annual marketing performance report for leadership, a board, or an internal marketing team
- The user wants to analyze marketing channel performance -- comparing spend efficiency, conversion rates, and customer acquisition across paid, organic, email, and partner channels
- The user needs to calculate or report on unit economics: CAC (customer acquisition cost), LTV:CAC ratio, payback period, or ROAS (return on ad spend) across campaigns or channels
- The user asks to translate raw marketing data (spend, impressions, clicks, leads, conversions) into structured analysis with recommendations
- The user wants to build or populate a marketing dashboard report to present results to a CMO, CEO, or board of directors
- The user needs to diagnose why a campaign or channel is underperforming and surface actionable remedies backed by data
- The user is preparing a budget reallocation proposal and needs performance evidence to justify shifting spend between channels

**Do NOT use this skill when:**

- The user needs an operations KPI dashboard (use `ops-metrics-dashboard`) -- operations metrics like throughput, SLA compliance, and fulfillment rates are a different domain
- The user wants a financial P&L analysis or margin analysis (use finance skills) -- revenue attribution in this skill is marketing-attributed, not total business revenue
- The user needs product usage analytics or engagement metrics for an existing user base (use product management skills) -- activation rates, feature adoption, and retention cohorts belong there
- The user wants a sales pipeline review including deal stages, win rates, and quota attainment (use `pipeline-review`) -- this skill covers marketing-generated pipeline creation, not the sales process itself
- The user needs a customer satisfaction or NPS analysis -- these are CX metrics, not marketing performance metrics
- The user asks for a media plan or campaign brief for a future campaign -- this skill analyzes past performance; planning is a separate skill

---

## Process

### Step 1 -- Gather Context Before Producing Anything

Never produce a report without first understanding the reporting context. Ask or infer the following:

- **Reporting period:** Week, month, quarter, or year. Monthly is the standard cadence for most teams; quarterly is standard for board reports.
- **Channels and campaigns in scope:** Paid search (Google Ads, Microsoft Ads), paid social (LinkedIn, Meta, TikTok, Pinterest), organic search (SEO), email (newsletters, drip, lifecycle), content/inbound, referral/affiliate, events, partner co-marketing.
- **Business model:** B2B SaaS (long sales cycle, MQL/SQL metrics, pipeline focus), B2C SaaS or subscription (trial-to-paid conversion), e-commerce (ROAS, AOV, repeat purchase), lead-gen (CPL focus). The business model determines which metrics dominate.
- **Audience for the report:** CMO/marketing team (tactical depth, channel-level), CEO/CFO (efficiency, ROI, budget justification), board (strategic, 1-page, LTV:CAC and growth rate), investors (growth trajectory, payback period, market penetration).
- **Targets or benchmarks:** Prior period actuals, stated goals (OKRs/targets), industry benchmarks. If no targets exist, use prior period as the baseline and note the absence of formal goals as a finding.
- **Data sources available:** Google Analytics 4, ad platform native reporting, CRM (Salesforce, HubSpot), marketing automation (Marketo, HubSpot), attribution tools (Northbeam, Triple Whale, Rockerbox), data warehouses (Snowflake, BigQuery), spreadsheet exports.
- **Attribution model in use:** Last-click, first-click, linear, time-decay, data-driven, or no formal model. The attribution model dramatically changes channel credit allocation -- always name it explicitly in the report.

If the user provides raw data without context, make reasonable inferences and state them. If critical context is missing (like the business model), ask one clarifying question before proceeding.

---

### Step 2 -- Calculate and Validate All Metrics Before Writing

Perform all calculations from the raw data before drafting the report. Do not populate tables with user-provided numbers if they are inconsistent -- verify them.

- **CAC per channel:** Channel spend ÷ new customers attributed to that channel. For B2B with long sales cycles, use pipeline-adjusted CAC (spend ÷ customers likely to close from current pipeline).
- **Blended CAC:** Total marketing spend ÷ total new customers across all channels. This is the headline efficiency number. Always report both blended and per-channel CAC.
- **ROAS:** Revenue attributed to marketing ÷ marketing spend. A ROAS of 3.0x means $3 returned for every $1 spent. For subscription businesses, use first-year revenue (MRR × 12) for a meaningful ROAS figure.
- **LTV:CAC ratio:** Customer LTV ÷ CAC. A ratio of 3:1 is the widely accepted benchmark for sustainable SaaS growth. Below 2:1 signals acquisition is too expensive or retention is too weak. Above 5:1 can indicate underinvestment in acquisition.
- **Payback period:** CAC ÷ monthly gross margin per customer. A 12-month payback is healthy for SMB SaaS; 18-24 months is acceptable for enterprise; below 6 months suggests strong unit economics.
- **Funnel conversion rates at each stage:** Calculate conversion rate as (output volume ÷ input volume) × 100 for every stage transition. Flag any stage where conversion dropped more than 20% vs. prior period as a potential bottleneck.
- **Channel efficiency index (optional but valuable):** Rank channels by CAC ascending. The channel with the lowest CAC and sufficient volume is the "lead channel" and should receive scaling consideration.

Cross-check math: total customers attributed to all channels should not exceed total new customers (double-counting is a common error with multi-touch attribution).

---

### Step 3 -- Write the Executive Summary First

The executive summary is the most important section. Many stakeholders read only this. Write it with the density of a Bloomberg brief and the clarity of a memo.

- **Lead with the headline number:** One sentence stating whether the period was above, at, or below target on the primary KPI (usually new customers or revenue). Include the gap in absolute and percentage terms.
- **State the three most important findings:** These are data-backed insights, not activities. "We ran LinkedIn campaigns" is an activity. "LinkedIn delivered the lowest CAC at $83, down 12% vs. prior quarter" is a finding. Each finding must cite a specific number.
- **Name the single most impactful recommendation:** This should be a specific, actionable decision -- not "improve conversion rates" but "reallocate $2K/month from Meta to Google Ads based on Google's 23% lower CAC." A stakeholder should be able to approve or reject it in 30 seconds.
- **Use traffic-light status indicators:** Green = within 5% of target or better. Yellow = 5-15% below target. Red = more than 15% below target. Apply consistently across every metric row in the dashboard section.
- **Keep the executive summary to 150 words or fewer.** If it runs longer, it is not a summary -- it is the report body.

---

### Step 4 -- Build the Performance Dashboard

The performance dashboard is a single-table overview that answers "how did we do?" before any channel detail is presented.

- Include these core KPIs in every report: total marketing spend, new customers, marketing-attributed revenue (if available), blended CAC, ROAS or MQL volume (depending on business model), and overall funnel conversion rate.
- Every row must have five columns: Target, Actual, vs. Target (%), vs. Prior Period (%), and Status (G/Y/R).
- Adapt supplemental metrics to the business model: e-commerce adds average order value and return purchase rate; B2B SaaS adds MQL volume, SQL volume, and pipeline created; e-commerce subscription adds trial-to-paid conversion rate.
- Do not include more than 8 rows in the summary dashboard -- additional metrics belong in channel tables. More rows dilute attention and obscure the headline story.
- Annotate any metric where the data source or attribution methodology is uncertain. A footnote such as "Revenue is last-click attributed; actual contribution may be higher with multi-touch" is better than presenting numbers with false confidence.

---

### Step 5 -- Report Channel Performance With Enough Depth to Make Decisions

For each active channel, report the data required to make a specific budget or optimization decision.

- **Universal metrics for all channels:** Spend, impressions or reach, clicks or sessions, leads or signups, customers acquired, CAC, and channel trend vs. prior period.
- **Channel-specific metrics that matter:**
  - Google Ads: Quality Score average, impression share, top-of-page rate, Search Lost IS (budget vs. rank), conversion rate by campaign type (branded vs. non-branded -- these behave completely differently and must not be blended)
  - LinkedIn: Lead Gen Form completion rate, Cost Per Lead (CPL) by audience segment, frequency, and engagement rate (not just clicks -- LinkedIn CPMs are high, so engagement per impression matters)
  - Meta (Facebook/Instagram): Frequency (anything above 3.5 in 7 days signals creative fatigue), CPM trends (rising CPMs indicate auction pressure), thumb-stop ratio for video (target above 25%)
  - Email: Open rate, click-to-open rate (CTOR is more meaningful than raw CTR), unsubscribe rate (above 0.5% per send is a warning sign), and reply rate for sequences
  - SEO/Organic: Sessions, goal completions from organic, keyword ranking movement (positions 1-3 vs. 4-10 vs. 11+), Core Web Vitals status if applicable
  - Paid social (TikTok, Pinterest): Cost Per Completed View (CPCV) for video, return visitor rate from paid
- **Assign an action verdict to every channel:** Scale (CAC is below blended average and volume can grow), Optimize (CAC is acceptable but conversion rate has room to improve), Test (new channel with insufficient data for verdict), or Pause (CAC consistently above LTV/target threshold for 2+ periods with no improvement trend).
- **Flag channel attribution overlap:** If running multiple channels simultaneously without a proper attribution model, note that channel-level CAC figures may double-count customers and should be treated as directional.

---

### Step 6 -- Conduct Funnel Analysis to Find the Bottleneck

Funnel analysis locates where volume is lost and where improvement has the highest leverage.

- Map the complete conversion path for your business model: for B2B SaaS -- Impressions → Clicks → Website Visitors → Free Trial/Demo Request → Marketing Qualified Lead (MQL) → Sales Qualified Lead (SQL) → Closed/Won. For e-commerce -- Impressions → Sessions → Product Page Views → Add to Cart → Checkout Initiated → Purchase.
- Calculate stage-to-stage conversion rates. The industry benchmark for SaaS visitor-to-trial is 2-5%; trial-to-paid is 15-25% for product-led, 30-50% for high-touch. E-commerce cart-to-purchase benchmarks are 65-70% for desktop, 50-55% for mobile. Flag any stage deviating more than 20% below benchmark.
- **Identify the primary bottleneck:** The bottleneck is the stage with the largest absolute volume loss (not just lowest conversion rate). Improving a 2% conversion rate to 4% doubles output at that stage -- that is the highest-leverage intervention regardless of where the lowest conversion rate sits.
- **Distinguish between traffic-quality problems and experience problems:** A low visitor-to-lead conversion rate could mean the traffic quality is poor (wrong audience), or the landing page is weak, or the offer is wrong. Use channel segmentation to separate these. If paid search visitors convert at 4% but paid social visitors convert at 1%, the traffic is different quality -- not the landing page.
- **Report on mobile vs. desktop funnel performance** if e-commerce or consumer-facing. Mobile-to-purchase conversion rates are typically 30-40% lower than desktop, but mobile may drive 60%+ of traffic. The gap is often where the most revenue is being left on the table.

---

### Step 7 -- Analyze Unit Economics and Sustainability

Unit economics determine whether the marketing program is building a sustainable business or burning cash at an unsustainable rate.

- **Calculate blended CAC and per-channel CAC.** Show both. Blended CAC is the business health number; per-channel CAC is the optimization number.
- **Report the LTV:CAC ratio if LTV data is available.** To calculate LTV for subscription: Average Revenue Per Account (ARPA) × Gross Margin % ÷ Churn Rate. For a $50/month SaaS with 70% gross margin and 2% monthly churn: LTV = $50 × 0.70 ÷ 0.02 = $1,750. A CAC of $200 gives an LTV:CAC of 8.75:1 -- excellent. A CAC of $700 gives 2.5:1 -- marginal.
- **Calculate payback period.** CAC ÷ (Monthly ARPA × Gross Margin %). Show whether this is improving or deteriorating over the trailing 3-6 months. A payback period increasing by more than 20% quarter-over-quarter is a serious efficiency alert.
- **Show the trend over 3-6 periods.** A single period's CAC is a data point; a trend is insight. CAC can be volatile month-to-month due to spend timing and sales cycle lag. A 3-month rolling average is more reliable than any single month.
- **For B2B SaaS, calculate pipeline-contribution metrics:** Marketing Sourced Pipeline (total ARR in pipeline from marketing-sourced opportunities), Marketing Influenced Pipeline (ARR in pipeline where marketing touched the account at any point), and Marketing's Win Rate (closed/won rate for marketing-sourced opportunities vs. other sources).

---

### Step 8 -- Write Specific, Ranked Recommendations

Recommendations are the primary deliverable of a marketing analytics report. Data presentation without recommendations is a dashboard, not an analysis.

- **Rank recommendations by expected impact, not by effort.** The highest-impact recommendation goes first regardless of difficulty. Note effort level separately.
- **Each recommendation requires four elements:** The specific action (not a direction), the supporting data that justifies it, the expected quantified impact (e.g., "+12 customers/month at flat spend"), and the owner (which team or role is responsible).
- **Structure recommendations across three categories:**
  - Scale (double down on what is working): Cite the channel or campaign with the best CAC and available headroom to absorb more spend without CPM/CPC inflation
  - Optimize (fix what is underperforming but salvageable): Identify specific experiments -- new ad creative, landing page tests, offer adjustments -- tied to the conversion stage that is underperforming
  - Cut or pause (stop what is clearly failing): Cite sustained poor performance over 2+ periods; do not recommend cutting based on one bad week
- **Include a budget reallocation table** if the data supports moving spend between channels. Show current allocation, proposed allocation, change in dollars, and expected impact in customers or pipeline.
- **Do not include more than 5 recommendations.** More than 5 means priorities are unclear. If there are many potential actions, rank them and present the top 5 only. The rest can appear in an appendix or backlog.

---

## Output Format

```
## Marketing Analytics Report: [Month/Quarter Year]

**Period:** [Start Date] to [End Date]
**Business Model:** [B2B SaaS / E-commerce / B2C Subscription / Lead Gen]
**Attribution Model:** [Last-click / Linear / Data-driven / No formal model -- last-click assumed]
**Prepared for:** [CMO / CEO / Board / Marketing Team]
**Prepared by:** [Author Name or Role]
**Report Date:** [Date]

---

### Executive Summary

**Overall Performance:** [One sentence: above/at/below target on primary KPI, including gap in absolute
and % terms]

**Top 3 Findings:**
1. [Finding 1 -- specific data point, channel or campaign, and business implication]
2. [Finding 2 -- specific data point, channel or campaign, and business implication]
3. [Finding 3 -- specific data point, channel or campaign, and business implication]

**Key Recommendation:** [Single most impactful specific action, citing the supporting data in one sentence]

---

### Performance Dashboard

| Metric | Target | Actual | vs. Target | vs. Prior Period | Status |
|--------|--------|--------|------------|-----------------|--------|
| Total Marketing Spend | $X | $X | +/-X% | +/-X% | 🟢/🟡/🔴 |
| New Customers | X | X | +/-X% | +/-X% | 🟢/🟡/🔴 |
| Marketing-Attributed Revenue | $X | $X | +/-X% | +/-X% | 🟢/🟡/🔴 |
| Blended CAC | $X | $X | +/-X% | +/-X% | 🟢/🟡/🔴 |
| ROAS (or Pipeline Created for B2B) | X:1 | X:1 | +/-X% | +/-X% | 🟢/🟡/🔴 |
| Overall Funnel Conversion (Visit-to-Customer) | X% | X% | +/-X% | +/-X% | 🟢/🟡/🔴 |
| [Model-specific KPI] | X | X | +/-X% | +/-X% | 🟢/🟡/🔴 |

**Status Key:** 🟢 Within 5% of target or better | 🟡 5-15% below target | 🔴 More than 15% below target

---

### Channel Performance

| Channel | Spend | Leads/Trials | Customers | CAC | ROAS | Conv. Rate | Trend | Action |
|---------|-------|-------------|-----------|-----|------|-----------|-------|--------|
| [Channel 1] | $X | X | X | $X | X:1 | X% | ↑/↓/→ (+/-X%) | Scale/Optimize/Test/Pause |
| [Channel 2] | $X | X | X | $X | X:1 | X% | ↑/↓/→ | Scale/Optimize/Test/Pause |
| [Channel 3] | $X | X | X | $X | X:1 | X% | ↑/↓/→ | Scale/Optimize/Test/Pause |
| **Total / Blended** | **$X** | **X** | **X** | **$X** | **X:1** | **X%** | | |

**Channel Highlights:**
- [Channel 1]: [2-3 sentence narrative explaining performance, key driver, and recommended action]
- [Channel 2]: [2-3 sentence narrative]
- [Channel 3]: [2-3 sentence narrative]

---

### Funnel Analysis

| Stage | Volume | Stage Conversion | vs. Prior Period | Bottleneck? |
|-------|--------|-----------------|-----------------|-------------|
| Impressions / Reach | X | -- | +/-X% | No |
| Website Sessions | X | X% of impressions | +/-X% | No |
| Leads / Trial Signups | X | X% of sessions | +/-X% | [Yes/No] |
| MQLs (B2B) or Add-to-Cart (E-comm) | X | X% of leads | +/-X% | [Yes/No] |
| SQLs / Checkout Initiated | X | X% of MQLs | +/-X% | [Yes/No] |
| Customers / Purchases | X | X% of SQLs | +/-X% | No |

**Primary Bottleneck:** [Stage name] -- [X% conversion vs. X% prior period / X% benchmark]
**Root Cause Hypothesis:** [Traffic quality issue vs. experience/offer issue -- explain the evidence]
**Recommended Intervention:** [Specific test or fix]

---

### Unit Economics

| Metric | Current Period | Prior Period | 3-Period Trend | Benchmark |
|--------|---------------|-------------|----------------|-----------|
| Blended CAC | $X | $X | Improving/Stable/Worsening | [Industry or internal target] |
| LTV (if available) | $X | $X | Trend | -- |
| LTV:CAC Ratio | X:1 | X:1 | Trend | 3:1 minimum; 5:1+ strong |
| CAC Payback Period | X months | X months | Trend | <12 mo. SMB; <24 mo. enterprise |
| Gross Margin | X% | X% | Trend | [Company target] |

**Unit Economics Commentary:** [2-3 sentences on whether the business is becoming more or less
efficient at acquiring customers, and what is driving the change]

---

### Recommendations

| Priority | Recommendation | Supporting Data | Expected Impact | Effort | Owner |
|----------|---------------|-----------------|-----------------|--------|-------|
| 1 | [Specific action with channel and tactic named] | [Exact data point] | [Quantified projection: +X customers, -$X CAC] | Low/Med/High | [Team/Role] |
| 2 | [Specific action] | [Data] | [Quantified impact] | Low/Med/High | [Team/Role] |
| 3 | [Specific action] | [Data] | [Quantified impact] | Low/Med/High | [Team/Role] |
| 4 | [Specific action] | [Data] | [Quantified impact] | Low/Med/High | [Team/Role] |
| 5 | [Specific action] | [Data] | [Quantified impact] | Low/Med/High | [Team/Role] |

---

### Budget Reallocation Proposal

*(Include only if channel data supports a specific reallocation)*

| Channel | Current Monthly Spend | Proposed Monthly Spend | Change | Rationale |
|---------|----------------------|----------------------|--------|-----------|
| [Highest-CAC channel] | $X | $X | -$X | CAC X% above blended average for X periods |
| [Lowest-CAC channel] | $X | $X | +$X | CAC X% below average; room to scale before CPM inflation |
| **Total** | **$X** | **$X** | **$0** | Budget-neutral reallocation |

**Projected Impact of Reallocation:** +X customers/month at flat total spend, reducing blended CAC
from $X to approximately $X.

---

### Data Quality Notes

*(Flag any limitation that affects how numbers should be interpreted)*

- **Attribution gaps:** [e.g., "Email assists are not captured in this report; actual email contribution
  is likely understated"]
- **Incomplete data:** [e.g., "LinkedIn conversion data is missing for the last 5 days of the period
  due to API sync issue -- estimated values used"]
- **Methodology changes:** [e.g., "MQL definition changed from 'any form fill' to 'form fill + 
  engagement score >50' this period -- MQL volume is not directly comparable to prior periods"]
```

---

## Rules

1. **Never produce a report without naming the attribution model.** Last-click, first-click, linear, and data-driven models allocate credit to channels completely differently. A Google Ads channel that looks like it drives 60% of conversions under last-click might contribute 20% under linear attribution. Always name the model and caveat the channel data accordingly.

2. **Always report both blended CAC and per-channel CAC.** Blended CAC answers "is the business efficient?" Per-channel CAC answers "where should I spend the next dollar?" Presenting only blended CAC masks which channels are dragging efficiency down and which are outperforming.

3. **Never interpret a single period in isolation.** One month of bad CAC can reflect an event (a sale, a brand push, a competitor promotion) rather than a structural problem. Always show trend across at least 2-3 periods before recommending a channel action. Two consecutive periods of deterioration is a signal; one is noise.

4. **Never blend branded and non-branded search performance.** Branded search (queries containing your company name) converts at 5-10x the rate of non-branded search and carries near-zero CAC because you are capturing demand you already created. Blending them inflates Google Ads performance and misrepresents true paid acquisition efficiency. Always report them separately.

5. **Always flag when marketing-attributed revenue does not equal total business revenue.** Marketing attribution captures the deals marketing can claim credit for -- it is not the company's total revenue. Reporting marketing-attributed revenue to a CFO or board without this caveat creates confusion and credibility problems.

6. **Do not recommend pausing a channel based on one bad period.** Channels have seasonal fluctuations, auction dynamics, and creative cycles. Pause recommendations require: CAC above the LTV-based maximum for 2+ consecutive periods, or a structural reason (audience saturation, platform policy change, targeting degradation) that explains why performance will not recover.

7. **Every data table must be followed by a narrative interpretation.** Raw numbers without context are not analysis. The interpretation must state the cause (not just the effect) and connect it to a business decision. "LinkedIn CAC increased 15%" is a data point. "LinkedIn CAC increased 15% because we exhausted the 25-45 director-level audience segment -- expanding to VP-level will reset CPMs but may reduce conversion quality" is analysis.

8. **LTV:CAC ratio benchmarks must account for the business model.** A 3:1 LTV:CAC ratio is the commonly cited benchmark for B2B SaaS, but it assumes healthy gross margins (70%+) and reasonable churn (less than 2% monthly). A marketplace business with 30% gross margin needs a 7:1 LTV:CAC to produce the same gross profit per customer. Always calculate LTV using gross margin, not revenue.

9. **Do not omit a metric because the number is unflattering.** Stakeholders who discover omitted bad metrics lose trust in future reports. If a metric is below target or deteriorating, report it with an explanation and a corrective recommendation. A red status indicator with a clear action plan is credible. A missing metric is suspicious.

10. **Board and investor reports must compress to a single page of narrative.** Board members read dozens of reports per week. The board report variant of this output format is: one-paragraph executive summary, performance dashboard table (no more than 6 rows), and top 3 recommendations in bullet form. The full channel analysis and funnel detail are appendix material -- available if requested, not presented by default.

---

## Edge Cases

### Early-Stage Company With Fewer Than 3 Months of Data

When there is insufficient history for trend analysis, the entire premise of "vs. prior period" collapses. Handle as follows: Use week-over-week comparisons instead of month-over-month to surface faster directional signals. Replace LTV:CAC ratio calculations with a modeled LTV based on assumed churn and ARPU (clearly labeled as a projection, not historical). Explicitly state that trends are preliminary and require 60-90 days before conclusions should drive significant budget decisions. Focus the report on learning hypotheses -- which channels show the most promise based on early cost and conversion signals -- rather than optimization decisions. Avoid recommending budget cuts or pauses until at least 2 full periods of data exist.

### B2B SaaS With a 3-6 Month Sales Cycle

Marketing spend in month 1 produces pipeline in month 1-2, but closed revenue in months 4-8. Reporting marketing-attributed revenue in the same period as spend produces a misleadingly negative ROI. Handle as follows: Report on leading indicators (MQLs, SQLs, pipeline ARR created) as the primary KPIs alongside closed revenue. Build a pipeline-to-revenue lag table showing the historical ratio of pipeline created to closed revenue, 90-180 days later. Calculate "projected marketing ROI" by applying the historical win rate to current-period pipeline rather than waiting for revenue to close. Clearly distinguish marketing-sourced pipeline (marketing was first touch) from marketing-influenced pipeline (marketing touched the account at any point in the cycle, but may not have been first touch).

### E-Commerce Business With Heavy Seasonality

November-December CAC figures for e-commerce are structurally different from January-March figures because auction prices rise during peak season while conversion rates also rise. Comparing November CAC to October CAC without context is misleading. Handle as follows: Always include a year-over-year comparison alongside the month-over-month comparison for seasonal businesses. Flag when a rising CAC is explained by rising CPMs industry-wide (check Meta and Google benchmark data) rather than campaign-specific degradation. For holiday periods, the relevant benchmark is "same period last year" -- not "prior month." Also add these e-commerce-specific metrics: cart abandonment rate (benchmark: 70% abandonment is normal; above 80% indicates a checkout friction problem), return rate by channel (high return rates from certain channels indicate ad creative is overpromising), and repeat purchase rate (month 2 and month 6 cohort repurchase rates measure LTV trajectory).

### Multiple Products or Business Lines Sharing a Marketing Budget

When a single marketing team and budget serves multiple products, blended CAC is almost meaningless -- a low-CAC consumer product and a high-CAC enterprise product blend into a number that describes neither. Handle as follows: Segment the entire report by product line before blending. Report channel performance for each product separately. Build a budget allocation table showing how spend is divided across products with the rationale (growth stage, strategic priority, LTV differences). Note that shared channels (brand search, organic) require an allocation methodology -- use revenue proportion, headcount proportion, or a deliberate strategic weighting, and document whichever method is used.

### The Attribution Model Changed Mid-Period

When a company migrates from last-click to data-driven attribution, or from Universal Analytics to GA4, the numbers are not comparable across the break point. Immediately surface this as a data quality issue in the report header and in every table that is affected. Present two versions of the comparison: the raw numbers (incomparable but what exists), and a rebased estimate that adjusts prior period data to the new model if that adjustment is possible. Do not present year-over-year or prior-quarter comparisons as if they are apples-to-apples. Mark any metric affected with a footnote. Recommend that the team establish a reconciliation period (typically 60 days of running both models in parallel) before trusting trend data under the new model.

### Stakeholder Requests a Report But Has No Formal Targets

Without targets, the traffic-light status system collapses. Handle as follows: Substitute industry benchmarks for missing internal targets -- SaaS CAC benchmarks by segment are widely available (SMB SaaS blended CAC typically $200-400; mid-market $1,000-3,000; enterprise $5,000+). Use prior-period performance as a de facto baseline and clearly label it as such. Add a recommendation to establish formal quarterly targets, specifying which metrics should have targets and why. A marketing team operating without targets is producing activity, not results -- naming this gap is a valuable contribution of the report itself. Where possible, back-calculate what targets should be given business-level revenue goals (if the company needs 100 new customers at $500 CAC budget, the required marketing budget is $50K -- work backward to show whether current spend and conversion rates can hit the business goal).

### Marketing Spend Includes Both Brand and Performance Spend

Brand advertising (awareness campaigns with no direct conversion objective) inflates spend without contributing to same-period customer acquisition. Including brand spend in CAC calculation produces an artificially high CAC that penalizes brand investment. Handle as follows: Separate brand spend from performance spend in all CAC calculations. Report them in separate rows of the channel table. Calculate performance CAC (performance spend only ÷ new customers) as the optimization metric. Report total marketing spend (brand + performance) as the business investment metric. Acknowledge that brand spend has a lagged halo effect on performance channels -- it typically reduces branded search CPCs and improves direct traffic conversion rates over 3-6 months -- but do not attempt to quantify this without a formal brand lift study.

---

## Example

**Input:** "Create a Q3 marketing analytics report for our B2B SaaS company. We sell project management software at $199/month per team (average 8 seats). Q3: spent $85K total -- Google Ads $30K, LinkedIn $35K, Content/SEO $12K, Email $8K. Generated 1,200 MQLs, 380 SQLs, 95 new customers. Q2 was: $75K spend, 950 MQLs, 290 SQLs, 72 customers. Our Q3 target was 110 customers. Average gross margin is 72%. Monthly churn is 1.8%. Audience: CMO and CFO."

**Preliminary Calculations (shown for transparency):**

- **Blended CAC Q3:** $85,000 ÷ 95 = $894
- **Blended CAC Q2:** $75,000 ÷ 72 = $1,042
- **CAC improvement Q3 vs. Q2:** ($1,042 - $894) ÷ $1,042 = 14.2% improvement
- **LTV:** ARPA × gross margin ÷ monthly churn = $199 × 8 seats × 0.72 ÷ 0.018 = $1,592 × 0.72 ÷ 0.018 = $63,680 (note: ARPA = $199 × 8 = $1,592/month per customer)
- **LTV:CAC ratio:** $63,680 ÷ $894 = 71.2:1 -- exceptionally strong; indicates significant underinvestment opportunity
- **Payback period:** $894 ÷ ($1,592 × 0.72) = $894 ÷ $1,146 = 0.78 months -- less than 1 month; exceptional
- **MQL-to-SQL conversion Q3:** 380 ÷ 1,200 = 31.7%
- **SQL-to-Customer conversion Q3:** 95 ÷ 380 = 25%
- **Overall funnel (MQL-to-Customer):** 95 ÷ 1,200 = 7.9%
- **vs. Q2 overall funnel:** Q2 was 72 ÷ 950 = 7.6% -- slight improvement
- **vs. Q3 target:** 95 ÷ 110 = 86.4% attainment -- 15 customers short; yellow status

**Note on channel-level CAC:** The input does not provide per-channel customer breakdowns. We will model channel CAC using industry-typical B2B SaaS SQL conversion rates (Google Ads: 28-32% SQL-to-customer; LinkedIn: 22-26%; Content: 18-22%; Email: 35-40%) and allocate MQL volume proportionally to spend weight. This is an estimate -- flag in report.

**Output:**

---

## Marketing Analytics Report: Q3 2024

**Period:** July 1, 2024 to September 30, 2024
**Business Model:** B2B SaaS -- team-based subscription ($199/month × avg. 8 seats = $1,592/month ARPA)
**Attribution Model:** Last-touch MQL attribution -- first-touch channel data not available; channel CAC figures are estimated (see Data Quality Notes)
**Prepared for:** CMO and CFO
**Prepared by:** Marketing Analytics
**Report Date:** October 4, 2024

---

### Executive Summary

**Overall Performance:** Below target -- 95 new customers vs. 110 target (86% attainment, 15 customers short), but Q3 represents a 32% quarter-over-quarter increase in new customer volume with a 14% improvement in blended CAC -- the most efficient quarter of acquisition in the company's history.

**Top 3 Findings:**

1. **Blended CAC dropped to $894, down from $1,042 in Q2 (14% improvement)** -- driven by higher SQL-to-customer conversion (25% in Q3 vs. 24.8% in Q2) and improved MQL-to-SQL conversion (31.7% vs. 30.5% in Q2). Efficiency is improving even as volume scales.

2. **LinkedIn ($35K spend, 41% of budget) is likely our highest-volume but highest-cost channel.** At estimated CAC of $1,020, LinkedIn runs above the blended average -- this is expected given the audience quality, but the budget weight is disproportionate to the per-channel ROI. Rebalancing toward Google Ads warrants investigation.

3. **LTV:CAC ratio of 71:1 and a sub-1-month payback period indicate severe underinvestment in marketing.** The company is acquiring customers for $894 who are worth over $60,000 in gross profit over their lifetime. The constraint is not whether acquisition is profitable -- it clearly is -- the constraint is how fast the company can scale acquisition spend while maintaining CAC below $2,000 (the threshold where LTV:CAC falls below 30:1, still exceptional).

**Key Recommendation:** Increase total marketing budget by $20-30K/month (from current $28K/month blended) allocated primarily to Google Ads where intent signal is strongest and estimated CAC is lowest. Current underinvestment is costing the company an estimated 20-30 customers per month at highly profitable unit economics.

---

### Performance Dashboard

| Metric | Q3 Target | Q3 Actual | vs. Target | vs. Q2 | Status |
|--------|-----------|-----------|------------|--------|--------|
| Total Marketing Spend | $85,000 | $85,000 | 0% | +$10K (+13%) | 🟢 |
| New Customers | 110 | 95 | -14% | +23 (+32%) | 🟡 |
| MQLs Generated | -- | 1,200 | -- | +250 (+26%) | 🟢 |
| SQLs Generated | -- | 380 | -- | +90 (+31%) | 🟢 |
| Blended CAC | $1,000 target | $894 | +10.6% better | -$148 (-14%) | 🟢 |
| MQL-to-SQL Conversion | 30% | 31.7% | +1.7 pts | +1.2 pts | 🟢 |
| SQL-to-Customer Conversion | 25% | 25.0% | On target | +0.2 pts | 🟢 |
| LTV:CAC Ratio | 30:1 min | 71:1 | +137% above min | Improving | 🟢 |
| CAC Payback Period | <12 months | <1 month | Exceptional | Stable | 🟢 |

**Status Key:** 🟢 Within 5% of target or better | 🟡 5-15% below target | 🔴 More than 15% below target

**Dashboard Commentary:** The primary miss is new customer volume (14% below target), not efficiency. Every efficiency metric is green and improving. The volume shortfall is most likely a capacity or budget constraint -- the funnel conversion rates are healthy, meaning adding more top-of-funnel volume would produce proportionally more customers.

---

### Channel Performance

*(Channel-level customer attribution is estimated; see Data Quality Notes)*

| Channel | Spend | Spend % | Est. MQLs | Est. Customers | Est. CAC | Trend | Action |
|---------|-------|---------|-----------|----------------|---------|-------|--------|
| Google Ads | $30,000 | 35% | 378 | 36 | ~$833 | ↑ Improving | Scale |
| LinkedIn | $35,000 | 41% | 441 | 34 | ~$1,029 | → Stable | Optimize |
| Content/SEO | $12,000 | 14% | 185 | 17 | ~$706 | ↑ Improving | Scale |
| Email/Lifecycle | $8,000 | 9% | 196 | 8 | ~$1,000 | → Stable | Optimize |
| **Total / Blended** | **$85,000** | **100%** | **1,200** | **95** | **$894** | **↑ Improving** | |

**Channel Narratives:**

- **Google Ads ($30K, est. CAC ~$833):** Paid search is capturing in-market demand -- users actively searching for project management software. The estimated CAC of $833 is 7% below blended average, making it the most efficient high-volume channel. Google Ads is currently under-budgeted relative to its performance. Key diagnostic needed: what percentage of spend is on branded vs. non-branded keywords? Branded search inflates performance metrics and must be separated to understand true acquisition efficiency.

- **LinkedIn ($35K, est. CAC ~$1,029):** LinkedIn carries the largest budget share but an estimated CAC 15% above blended average. This is not necessarily a failure -- LinkedIn's targeting precision for B2B buyers is unmatched, and the MQLs generated from LinkedIn likely have a higher average deal size and lower churn than those from other channels (this should be verified in CRM data). However, the 41% budget allocation to a channel with above-average CAC needs justification. Recommend testing whether reducing LinkedIn spend by $5K and reallocating to Google Ads changes overall customer volume. Also test LinkedIn Lead Gen Forms vs. landing page traffic -- LGF conversion rates are typically 2-3x higher than click-through-to-form.

- **Content/SEO ($12K, est. CAC ~$706):** Content has the lowest estimated CAC of any channel at $706 -- 21% below blended average -- but receives only 14% of budget, the third-lowest allocation. SEO compound returns mean that content investment this quarter reduces CAC in future quarters without incremental spend. The ROI case for increasing content investment is strong. Key caveat: content leads have longer nurture cycles and SEO results lag investment by 3-6 months, so this channel requires patience.

- **Email/Lifecycle ($8K, est. CAC ~$1,000):** Email spend includes tools and content creation. The email channel primarily works on leads already in the funnel -- it is a conversion accelerator, not a demand generation channel. The "CAC" attribution here may overstate the channel's independent contribution since email touches leads that originated elsewhere. Consider reclassifying email spend as a funnel nurture cost rather than a demand generation cost for cleaner channel CAC comparisons.

---

### Funnel Analysis

| Stage | Volume | Stage Conversion | vs. Q2 | Bottleneck? |
|-------|--------|-----------------|--------|-------------|
| Impressions / Ad Reach | ~4.2M | -- | +18% | No |
| Website Sessions (paid + organic) | ~28,000 | 0.67% of impressions | +22% | No |
| MQLs (form fills + engagement) | 1,200 | 4.3% of sessions | +26% | No |
| SQLs (sales-accepted leads) | 380 | 31.7% of MQLs | +31% | No |
| Customers (closed/won) | 95 | 25.0% of SQLs | +32% | No |

**Overall Funnel Conversion (Session-to-Customer):** 0.34% -- up from 0.28% in Q2 (+21%)

**Primary Bottleneck Assessment:** No severe bottleneck exists this quarter -- all stage conversions are at or above Q2 levels. The volume shortfall (95 vs. 110 target) is a **top-of-funnel volume problem**, not a conversion problem. The funnel is healthy; it simply needs more input.

**Bottleneck Calculation to Hit 110-Customer Target:** To achieve 110 customers at current conversion rates (31.7% MQL-to-SQL, 25% SQL-to-customer), we need: 110 ÷ 0.25 = 440 SQLs; 440 ÷ 0.317 = 1,388 MQLs. We generated 1,200 MQLs in Q3 -- we needed 188 more. At current cost-per-MQL of $70.83, that requires approximately $13,300 in additional marketing investment to hit the customer target at flat conversion rates.

**Funnel Health Watch Items:**
- MQL-to-SQL conversion at 31.7% is healthy (industry benchmark: 25-35% for B2B SaaS). No immediate concern.
- SQL-to-customer at 25% is on target. Monitor for sales team capacity constraints as volume scales -- this rate often degrades when sales reps are working more SQLs than their capacity allows.

---

### Unit Economics

| Metric | Q3 2024 | Q2 2024 | Trend | Benchmark |
|--------|---------|---------|-------|-----------|
| Blended CAC | $894 | $1,042 | ↑ Improving (-14%) | SMB B2B SaaS: $200-500; Mid-market: $1,000-3,000 |
| Monthly ARPA | $1,592 | $1,592 | → Stable | -- |
| LTV (ARPA × margin ÷ churn) | $63,680 | ~$61,200 | ↑ Improving | -- |
| LTV:CAC Ratio | 71:1 | 59:1 | ↑ Improving (+20%) | Strong: 5:1+; Exceptional: 20:1+ |
| CAC Payback Period | 0.78 months | 0.91 months | ↑ Improving | Healthy: <12 months; Exceptional: <3 months |
| Gross Margin | 72% | 72% | → Stable | 70%+ target for SaaS |

**Unit Economics Commentary:** The LTV:CAC ratio of 71:1 is extraordinary and points to a clear strategic implication: the company should be spending significantly more on marketing. A 71:1 ratio means the business earns $71 in gross profit over a customer's lifetime for every $1 spent acquiring them. Even if increased marketing spend caused CAC to triple to $2,700, the LTV:CAC ratio would still be 23:1 -- far above the 3:1 minimum healthy threshold. The most important question for the CMO and CFO is not "how do we reduce CAC further" but "how fast can we scale acquisition without degrading CAC past $2,000?" The 14% CAC improvement this quarter suggests the team has room to scale before hitting diminishing returns.

---

### Recommendations

| Priority | Recommendation | Supporting Data | Expected Impact | Effort | Owner |
|----------|---------------|-----------------|-----------------|--------|-------|
| 1 | Increase Google Ads budget by $15K/month; allocate to non-branded, high-intent search terms in 'project management software' and competitor segments | Est. CAC $833 (7% below blended); strong intent signal; channel is estimated under-budgeted at 35% of spend | +18 customers/month at $833 CAC; budget increase pays back in <1 month | Medium | Paid Media |
| 2 | Reduce LinkedIn budget by $5K/month; redirect to Content/SEO investment | LinkedIn CAC est. 15% above blended; Content CAC est. 21% below blended; reallocation is budget-neutral with better expected returns | -3 LinkedIn customers/month offset by +7 Content/SEO customers/month; net +4 customers at flat spend over 6-month horizon | Low | Paid Media + Content |
| 3 | Test LinkedIn Lead Gen Forms on 3 top-performing campaigns; replace landing page clicks with LGF for one month | B2B SaaS LGF vs. landing page benchmarks show 2-3x higher conversion rates; LinkedIn spend is $35K/month -- even 20% CPL improvement saves $7K/month | Potential 20-30% LinkedIn CPL reduction; estimated +5-8 MQLs/month at same spend | Low | Paid Media |
| 4 | Separate branded and non-branded Google Ads reporting immediately; do not blend in channel CAC calculation | Currently unable to assess true non-branded paid search efficiency; branded conversions inflate performance by an unknown amount; this is a reporting hygiene issue that distorts budget decisions | Accurate channel performance data enabling better budget allocation decisions | Low | Marketing Ops |
| 5 | Verify in CRM whether LinkedIn-sourced customers have higher ARPA, lower churn, or higher expansion revenue than Google Ads customers | LinkedIn CAC is above average, but may be justified if LinkedIn customers are higher quality (larger teams, lower churn); without this data, the LinkedIn budget reduction in Rec #2 may be wrong | If LinkedIn customers have 30%+ better LTV, LinkedIn CAC threshold should be raised and Rec #2 should be reversed | Low | Marketing Ops + Sales |

---

### Budget Reallocation Proposal

| Channel | Current Monthly Spend | Proposed Monthly Spend | Change | Rationale |
|---------|----------------------|----------------------|--------|-----------|
| Google Ads | $10,000 | $25,000 | +$15,000 | Lowest estimated CAC, strongest intent signal, most headroom to scale |
| LinkedIn | $11,667 | $6,667 | -$5,000 | CAC above blended
