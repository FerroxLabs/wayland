---
name: investment-fee-analyzer
description: |
  Calculates the long-term cost of investment fees including expense ratios,
  advisor fees, and transaction costs. Expresses fee impact as both dollar
  amounts and percentage of final portfolio value over the user's time horizon.
  Use when the user asks about investment fees, wants to compare fund costs,
  or wants to understand how fees affect long-term returns.
  Do NOT use for choosing specific funds or products, understanding account
  types (use investment-account-types), or building a portfolio allocation
  (use portfolio-allocation-framework).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "investing personal-finance analysis"
  category: "personal-finance"
  subcategory: "investing"
  depends: ""
  disclaimer: "educational-finance"
  difficulty: "intermediate"
---
# Investment Fee Analyzer

> **Disclaimer:** This skill provides educational information about investment fees and their mathematical impact on long-term wealth accumulation. It does NOT constitute financial advice, investment recommendations, or tax guidance. Fee analysis is one input among many in investment decision-making. Always consult a qualified financial advisor, CPA, or licensed financial planner before making investment decisions. Past performance does not predict future results, and assumed return rates are mathematical constructs, not predictions.

---

## When to Use

**Use this skill when:**
- The user asks how expense ratios, advisor fees, or transaction costs affect their portfolio over time -- especially when they want to see the dollar impact, not just the percentage
- The user is comparing two or more funds or fee structures and wants a side-by-side mathematical analysis (e.g., a 0.03% index fund vs. a 0.75% actively managed fund)
- The user wants to understand "fee drag" -- the compounding opportunity cost created by fees extracted from an investment account year after year
- The user receives an advisor proposal and wants to understand what the stated AUM fee actually costs them in dollars over 10, 20, or 30 years
- The user wants to calculate the break-even outperformance required for a higher-fee fund or advisor to justify its additional cost
- The user is evaluating robo-advisor platforms and wants to compare their all-in annual costs (platform fee + fund expense ratios) to a do-it-yourself approach
- The user wants to express fee impact in relatable terms -- months of contributions consumed by fees, percentage of total growth surrendered, or the "fee equivalent salary" they effectively pay their fund manager each year

**Do NOT use this skill when:**
- The user wants specific fund or product recommendations -- never name or recommend specific funds, ETFs, or fund families (the math here is agnostic to specific products)
- The user wants to understand which account type to use for tax-advantaged investing -- use `investment-account-types` instead, since account structure affects after-tax returns independently of fees
- The user is building or rebalancing a portfolio allocation -- use `portfolio-allocation-framework`; fee analysis is an input to portfolio construction, not a substitute for it
- The user needs to calculate how much to save for retirement -- use `retirement-savings-calculator`; fee analysis modifies the growth rate but does not set savings targets
- The user is analyzing hedge fund or private equity fee structures as a primary request -- these involve carried interest, hurdle rates, and clawback provisions that require specialized treatment (note this limitation and refer them to professional counsel)
- The user is asking about tax efficiency or tax-loss harvesting -- these affect after-tax returns but are not fee analysis (use a tax-aware investing framework)

---

## Process

### Step 1: Identify and Classify All Fee Types Present

Before calculating anything, catalog every fee the user is facing. Fees fall into distinct structural categories that compound differently:

- **Expense ratio (ER):** The most significant ongoing cost for most retail investors. Expressed as an annual percentage of assets, deducted daily from fund NAV before returns are reported. A 0.50% ER means the fund shaves approximately 0.00137% off NAV every trading day. Because it is deducted before reported returns, investors often underestimate its drag -- the fund's published return already reflects the ER, but comparing a 0.03% fund to a 0.75% fund requires modeling the difference explicitly.
- **Investment advisor / AUM fee:** Charged quarterly or monthly on total assets under management. A 1.00% AUM fee charged quarterly means 0.25% is deducted each quarter. These fees compound separately from the ER because they are charged on the gross balance, not on returns. Total all-in cost = ER + AUM fee.
- **Front-end load:** A one-time sales charge assessed at the time of purchase, deducted before investment. A 5.75% front-end load on a $10,000 investment means only $9,425 is actually invested. Model this as a reduction in starting principal.
- **Back-end load (CDSC -- contingent deferred sales charge):** Charged at redemption, typically on a declining schedule (e.g., 5% if redeemed in year 1, 4% in year 2, down to 0% after year 6). For long-horizon analysis, confirm whether the CDSC schedule expires before the user's time horizon.
- **12b-1 fee:** A marketing and distribution fee embedded within a fund's expense ratio, ranging from 0.25% to 1.00%. It is part of the total ER but worth calling out because it funds advisor compensation, not investment management.
- **Transaction costs / commissions:** Per-trade fees. While most major brokerage platforms have eliminated commissions on ETF and stock trades, these still appear in certain no-transaction-fee mutual fund programs, 401(k) plans with limited fund menus, and bond trading (bid-ask spread is a transaction cost even without an explicit commission).
- **Bid-ask spread:** Relevant for ETFs traded intraday. An ETF with a 0.05% bid-ask spread costs approximately 0.05% on entry and 0.05% on exit. For buy-and-hold investors making infrequent trades, this is negligible. For frequent traders, it compounds.
- **Account/platform fees:** Fixed dollar fees (e.g., $20/year account maintenance, $75 IRA transfer fee). These matter most for small accounts where the fixed fee is a large percentage of assets.
- **Wrap fees:** An all-inclusive annual fee (typically 1.0--3.0%) that bundles advisory, trading, and custody. Identify whether an advisor is quoting a wrap fee or unbundled fees.

Ask the user to provide the fees for each scenario they want to compare. If they do not know where to find them, explain:
- Expense ratios: Fund fact sheet, prospectus, or fund screener (look for "net expense ratio" not "gross expense ratio" -- the net figure reflects any contractual fee waivers)
- Advisor fees: Client agreement or ADV Part 2A, which registered investment advisors must provide
- 401(k) fees: Plan's annual fee disclosure (ERISA 404a-5 notice), or the plan's fund lineup on the provider's website

### Step 2: Gather Calculation Inputs

Collect the following parameters precisely -- small input differences produce large output differences over long horizons:

- **Starting investment amount (P₀):** Current lump sum or initial investment. Confirm whether this is before or after any front-end load.
- **Periodic contribution (C):** Monthly amount added to the portfolio. If the user contributes annually (e.g., maxing an IRA once per year), convert to annual and note the timing assumption (beginning vs. end of year affects results by roughly one year's growth rate).
- **Contribution growth rate (optional but valuable):** Many investors increase contributions over time as their income grows. A 2--3% annual contribution increase meaningfully changes long-horizon results. Ask if relevant.
- **Time horizon (T):** Years to the target date. For retirement projections, clarify whether T is to retirement date or to death/end of portfolio life -- decumulation fees matter too.
- **Assumed gross return rate (r):** The pre-fee, pre-tax nominal return assumption. This is a user-provided assumption, not a prediction. Common reference points: the broad U.S. equity market has historically returned approximately 10% nominal annually before fees over long periods; a 60/40 portfolio has historically returned approximately 8--9% nominal. Use whatever rate the user provides, but flag if it appears unrealistic (below 2% or above 15% for diversified portfolios).
- **Fee scenarios (minimum two):** At least two complete fee structures to compare. Label them clearly (Low-Fee, High-Fee, or Scenario A/B/C).
- **Tax treatment (optional):** Whether the account is tax-deferred (traditional IRA/401k), tax-exempt (Roth), or taxable. Fees in taxable accounts may be partially tax-deductible in some circumstances (this is outside scope -- refer to tax professional), but the fee drag calculation is the same regardless of account type.

### Step 3: Build the Core Mathematical Model

Use the following methodology, which models fees correctly as a continuous annual drag on compound growth:

**Net annual return (per scenario):**
```
r_net = r_gross - ER - AUM_fee - (fixed_fees / average_balance)
```

For fixed dollar fees (account maintenance fees), convert to a percentage by dividing by the projected average balance for that year. For large portfolios, fixed fees become negligible; for accounts under $10,000, a $30/year fee can represent 0.30%+.

**Front-end load adjustment:**
```
P₀_adjusted = P₀ × (1 - front_end_load_rate)
```

**End-of-year balance formula with monthly contributions:**

Use the future value of a growing annuity with monthly compounding. For annual approximation (sufficient for most users):
```
FV_year_n = P₀_adjusted × (1 + r_net)^n + C_annual × [((1 + r_net)^n - 1) / r_net]
```

Where C_annual = monthly contribution × 12, and the annuity assumes end-of-year contributions (conservative). For beginning-of-year contributions, multiply the annuity term by (1 + r_net).

**For monthly precision (preferred when contributions are monthly):**
```
Monthly rate: r_m = (1 + r_net)^(1/12) - 1

FV_month_m = P₀_adjusted × (1 + r_m)^m + C_monthly × [((1 + r_m)^m - 1) / r_m]
```

**No-fee baseline:**
Calculate the same formula with r_net = r_gross and no load adjustment. This baseline represents the hypothetical portfolio with zero fees, used to calculate total fee cost.

**Total estimated fees paid:**
```
Total fees = FV_no_fee - FV_scenario
```

This is the opportunity cost framing -- it captures not just what was paid in fees, but what those fee dollars would have grown to if they had remained invested.

**Fee cost as percentage of no-fee final value:**
```
Fee drag % = (Total fees / FV_no_fee) × 100
```

### Step 4: Build the Year-by-Year Comparison Table

Calculate balances at years 0, 5, 10, 15, 20, 25, and the user's final year (if it does not fall on a 5-year mark). For each row:

- Balance under each fee scenario (in dollars)
- Absolute dollar difference between scenarios
- Difference expressed as a percentage of the lower-fee scenario's balance

Key inflection points to highlight in commentary:
- The year the cumulative fee difference crosses $10,000, $50,000, $100,000 -- these dollar thresholds make the abstract percentage feel concrete
- The year the fee difference exceeds one year's worth of contributions -- a powerful framing for many users

### Step 5: Calculate the "Fee Cost in Human Terms"

Transform the raw dollar difference into relatable metrics:

- **Equivalent months of contributions:** Total fee difference ÷ monthly contribution = months of saving that fees consumed
- **Percentage of total growth surrendered:** Total fee difference ÷ (FV_no_fee - total_contributions) -- this measures what fraction of the investing effort (not just the ending balance) was consumed by fees
- **Annualized fee cost in today's dollars:** For long-horizon analyses, the total fee cost divided by the number of years gives a rough "annual fee cost" that can be compared to tangible spending items
- **Fee cost per $1 of contribution:** Total fee difference ÷ total contributions -- tells the user how many cents in lost wealth they paid per dollar they invested

### Step 6: Break-Even Outperformance Analysis

When comparing a higher-fee option to a lower-fee one, calculate the required annual gross return premium for the higher-fee option to match the lower-fee option's net outcome:

**Required outperformance = Higher fee rate - Lower fee rate**

In most cases, this equals the fee difference exactly -- if Fund B costs 0.65% more per year, it must return 0.65% more per year, every year, just to break even. This is not an approximation; it is mathematically exact for the net return calculation.

However, the *probability* of achieving this consistently compounds negatively over time:
- Achieving 0.65% annual outperformance for 5 years: Requires consistent edge
- Achieving 0.65% annual outperformance for 25 years: Statistically very rare even among professional fund managers
- Cite as context: S&P SPIVA reports have historically found that a significant majority of actively managed funds (typically 80--90% over 15+ year periods) underperform their benchmark net of fees -- present this as a documented research finding, not as advice

Add sensitivity analysis showing how the required outperformance changes if the fee difference is larger or smaller:

| Fee Difference | Required Annual Outperformance | 20-Year Compounded Impact |
|---------------|-------------------------------|--------------------------|
| 0.25% | 0.25% per year | ~5% of final portfolio |
| 0.50% | 0.50% per year | ~10% of final portfolio |
| 1.00% | 1.00% per year | ~18% of final portfolio |
| 1.50% | 1.50% per year | ~26% of final portfolio |

### Step 7: Frame Limitations and Contextual Nuance

A fee analysis is mathematically complete but contextually incomplete. Always include:

- **The equal-returns assumption is the central caveat.** The analysis only answers: "If both options achieve the same gross return, what is the cost of higher fees?" It does not answer whether a higher-fee option will achieve the same gross return or a better one.
- **Services bundled with higher fees:** An AUM-based advisor may provide financial planning, tax-loss harvesting, behavioral coaching during market volatility, estate planning coordination, and insurance review. These services have real value that is not captured in a fee comparison. The user must determine whether those services justify the fee.
- **Tax-loss harvesting in taxable accounts:** Some robo-advisors and advisors offer automated tax-loss harvesting, which can add 0.20--0.80% in annual after-tax return for investors in higher tax brackets. If this is a differentiator, the fee comparison should be adjusted to reflect the estimated after-tax benefit.
- **Behavioral value:** Research on investor behavior (the "behavior gap" documented by DALBAR and others) suggests that investors in advised accounts may achieve better net returns due to reduced panic selling and drift prevention -- potentially worth 1.0--1.5% annually according to some research. This is a legitimate counterargument to pure fee minimization.
- **Fee analysis assumes continuous investment.** It assumes no withdrawals, no strategy changes, and no account closures. Real-world factors alter the outcome.

---

## Output Format

```
## Investment Fee Impact Analysis

> Analysis generated based on user-provided inputs. Return rate is an
> assumption, not a prediction. See Important Context section.

---

### Your Inputs

| Parameter                  | Value              |
|----------------------------|--------------------|
| Starting investment        | $[amount]          |
| Monthly contribution       | $[amount]/month    |
| Annual contribution total  | $[amount]/year     |
| Time horizon               | [N] years          |
| Target year                | [current year + N] |
| Assumed gross return       | [r]% per year      |
| Front-end load (if any)    | [rate]% or None    |

---

### Fee Scenarios

| Fee Component              | [Scenario A Name] | [Scenario B Name] | [Scenario C Name] |
|----------------------------|------------------:|------------------:|------------------:|
| Expense ratio              | [rate]%           | [rate]%           | [rate]%           |
| Advisor / AUM fee          | [rate]%           | [rate]%           | [rate]%           |
| 12b-1 fee (if separate)    | [rate]%           | [rate]%           | [rate]%           |
| Fixed annual fees          | $[amount]         | $[amount]         | $[amount]         |
| Front-end load             | [rate]%           | [rate]%           | [rate]%           |
| **Total annual % cost**    | **[rate]%**       | **[rate]%**       | **[rate]%**       |
| **Net return after fees**  | **[rate]%**       | **[rate]%**       | **[rate]%**       |

---

### Portfolio Growth Comparison

| Year | [Scenario A] | [Scenario B] | Difference (A vs B) | Diff as % of A |
|-----:|-------------:|-------------:|--------------------:|---------------:|
| 0    | $[amount]    | $[amount]    | $0                  | 0.0%           |
| 5    | $[amount]    | $[amount]    | $[amount]           | [%]            |
| 10   | $[amount]    | $[amount]    | $[amount]           | [%]            |
| 15   | $[amount]    | $[amount]    | $[amount]           | [%]            |
| 20   | $[amount]    | $[amount]    | $[amount]           | [%]            |
| 25   | $[amount]    | $[amount]    | $[amount]           | [%]            |
| [N]  | $[amount]    | $[amount]    | $[amount]           | [%]            |

**Key milestone:** The fee difference crosses $[threshold] by year [Y].

---

### Fee Impact Summary

| Metric                                    | [Scenario A]  | [Scenario B]  |
|-------------------------------------------|---------------|---------------|
| Final portfolio value                     | $[amount]     | $[amount]     |
| Total contributions made                  | $[amount]     | $[amount]     |
| Total net growth (value minus contrib.)   | $[amount]     | $[amount]     |
| Estimated total fees paid (opportunity)   | $[amount]     | $[amount]     |
| Fees as % of no-fee final value           | [%]           | [%]           |
| Fees as % of total growth earned          | [%]           | [%]           |

**Fee cost between scenarios:**
- Dollar difference (A vs B): **$[amount]** over [N] years
- Equivalent to: **[X] months** ([Y] years) of your $[C]/month contribution
- Equivalent to: **[Z] cents** in lost wealth per dollar contributed

---

### Break-Even Analysis

For [Scenario B] to match [Scenario A]'s final portfolio value, [Scenario B]
must consistently outperform [Scenario A] by exactly **[fee_diff]% per year,
every year** for all [N] years.

| Horizon   | Required Annual Outperformance |
|-----------|-------------------------------|
| 5 years   | [fee_diff]%/year              |
| 10 years  | [fee_diff]%/year              |
| 20 years  | [fee_diff]%/year              |
| [N] years | [fee_diff]%/year              |

Context: The required outperformance percentage is constant regardless of
time horizon -- but the probability of achieving it consistently for longer
periods is lower. S&P SPIVA data has historically found that the majority of
actively managed funds fail to beat their benchmark net of fees over 15-year
periods.

---

### Sensitivity: What If Gross Returns Differ?

| If [Scenario B] gross return is... | [Scenario B] final value | Still behind [Scenario A]? |
|------------------------------------|-------------------------:|---------------------------|
| [r - 0.65]% (underperforms)        | $[amount]                | Yes, by $[amount]          |
| [r]% (equal, base case)            | $[amount]                | Yes, by $[amount]          |
| [r + fee_diff]% (break-even)       | $[amount]                | No, equal                  |
| [r + fee_diff + 0.50]% (exceeds)   | $[amount]                | No, ahead by $[amount]     |

---

### Important Context

1. **Equal-returns assumption:** This analysis assumes both scenarios
   achieve [r]% gross return before fees. This is the standard method
   for isolating fee impact. It does not mean both options will achieve
   the same return in practice.

2. **Bundled services:** Higher-fee options may include financial
   planning, tax-loss harvesting, behavioral coaching, and account
   management. These services are not captured in this analysis.

3. **Tax-loss harvesting offset:** If applicable, tax-loss harvesting
   in a taxable account can offset some or all of an advisor fee for
   investors in higher tax brackets (22%+ marginal rate). Ask your
   advisor for their estimated annual tax alpha.

4. **Fee drag grows with portfolio size:** The dollar cost of fees
   increases as the portfolio grows. A [fee]% fee on a $[starting]
   portfolio is $[small_dollar]/year. On a $[later_balance] portfolio
   in year [Y], it is $[large_dollar]/year.

5. **This analysis does not recommend a course of action.** It shows
   the mathematical impact of fees under stated assumptions.

---

### Next Steps
- [ ] Locate your exact fee schedule: fund fact sheet (expense ratio),
      advisor agreement (AUM fee), and account statements (fixed fees)
- [ ] Confirm whether expense ratios shown are "net" (after waivers)
      or "gross" -- use net for current-year analysis
- [ ] If evaluating an advisor, ask specifically: "What is your all-in
      annual cost including fund expense ratios?"
- [ ] Reassess annually -- as your portfolio grows, the dollar impact
      of fees increases even if the percentage stays the same
- [ ] For taxable accounts, ask whether tax-loss harvesting or direct
      indexing is available and what the estimated annual tax benefit is
```

---

## Rules

1. **Never recommend specific funds, fund families, brokerages, or robo-advisor platforms by name.** The analysis is fee-structure agnostic. Use "Scenario A / Scenario B" or descriptive labels like "Low-Cost Index Fund" and "Active Fund" based on what the user describes -- never brand names.

2. **Always model fees as a reduction to the gross return rate, not as a separate line-item subtraction from the ending balance.** Modeling fees as a drag on the compounding rate (r_net = r_gross - fees) is mathematically correct. Subtracting fees from the final balance as a lump sum dramatically underestimates the true cost because it ignores the lost compounding on the fee dollars over the entire period.

3. **Always show fee impact in three forms:** (1) absolute dollar difference at end of horizon, (2) percentage of the lower-fee scenario's final balance, and (3) at least one "human-scale" equivalent such as months of contributions. Single-format output (dollars only or percentages only) fails to communicate the full weight of the number.

4. **Always include the no-fee baseline in your internal calculation** even if you do not show it in the output table. The no-fee baseline is required to correctly calculate "total fees paid" as an opportunity cost. Reporting only "annual fee percentage" without this baseline understates the cumulative impact.

5. **Never state that lower fees always lead to better outcomes.** The equal-returns assumption is a modeling convenience, not a factual claim. Actively managed funds, advisors, or higher-cost platforms may deliver sufficient value to justify their fees. Present the math; state the break-even requirement; let the user decide.

6. **For front-end loads, always reduce the starting principal before projecting growth.** A 5.75% front-end load on $50,000 means $47,125 is actually invested. Projecting from the full $50,000 overstates returns and understates the load's impact.

7. **For CDSC / back-end loads, check the user's time horizon against the load schedule.** If the user's 20-year horizon exceeds the CDSC expiration (typically 6 years), the back-end load is irrelevant to the analysis. If the horizon is shorter than the expiration, model the CDSC as a reduction in final value.

8. **Round dollar amounts to whole dollars; express fee percentages to two decimal places; express growth percentages to one decimal place.** Showing $56,488 (not $56,487.83) and 0.75% (not 0.7500%) is appropriate precision for a planning tool. False precision misleads.

9. **If the user provides only one fee scenario, prompt for a second before calculating.** A single-scenario fee analysis cannot produce meaningful comparison output. Ask: "What are you comparing this to? A lower-cost alternative, or self-directed investing with no advisor fee?" If the user insists on single-scenario analysis, compare it against a hypothetical zero-fee baseline as the second scenario and label it clearly.

10. **Flag any assumed gross return above 12% or below 2% with an explicit note.** Returns outside this range for diversified long-term portfolios are historically unusual. Do not refuse to calculate -- the user may have a specific reason -- but note: "A [rate]% assumed return is [above the historical long-term average / below typical assumptions for a diversified portfolio]. The fee impact analysis is mathematically correct at any assumed return, but the absolute dollar figures depend heavily on this assumption."

11. **For fixed dollar fees (e.g., $25/year account fee), convert to an annual percentage cost using the starting balance for year 1, then the projected balance for each subsequent year.** Fixed fees become smaller as a percentage as the portfolio grows, which means they matter most for small accounts early in the investment period.

12. **When the fee difference between scenarios is less than 0.10% per year, explicitly state that the mathematical difference is modest and that other factors may dominate the decision.** At a 0.05% fee difference on a $50,000 portfolio, the dollar impact is $25/year -- note this in plain terms so the user does not obsess over a negligible difference.

---

## Edge Cases

### User Does Not Know Their Fees

This is extremely common. Many investors do not know their expense ratios or have never read their advisor agreement. Handle in three steps:

1. **Guide them to the source.** For mutual funds and ETFs: the fund's "Summary Prospectus" and fund fact sheet show the net expense ratio -- look for the table labeled "Annual Fund Operating Expenses." For advisors: the ADV Part 2A (required for registered investment advisors) contains the fee schedule. For 401(k) plans: the annual 404a-5 fee disclosure, which must be provided to all plan participants by law.

2. **Offer reference ranges as a starting point.** Broad-market index ETFs typically range from 0.03% to 0.20%. Actively managed equity mutual funds typically range from 0.50% to 1.50%. Target-date funds vary widely: 0.10% to 0.75%. AUM-based advisors typically charge 0.50% to 1.50% on top of fund expenses. Use these ranges to create a "likely low" and "likely high" scenario while the user gathers their actual figures.

3. **Build the framework now, apply the numbers later.** Provide the full output using the user's best estimates, and include a next step item to "replace estimated fees with your actual fee schedule and rerun the analysis."

### User Is Comparing a Fee-Based Advisor to Self-Directed Investing

This is a loaded comparison because fee-only advisors provide services beyond investment management. Handle carefully:

- Include the full advisor cost in Scenario B: their AUM fee (typically 0.75--1.25%) PLUS the expense ratios of the funds they select. Many users do not realize they pay both layers.
- In the Important Context section, explicitly list services the advisor may provide that self-directed investors must supply themselves: tax-loss harvesting, rebalancing, financial planning, insurance review, estate coordination, behavioral coaching during downturns, and beneficiary/account maintenance.
- Reference the "advisor alpha" research: Vanguard's "Advisor's Alpha" framework estimates that a competent advisor can add approximately 1.5% in net annual return through behavioral coaching, asset allocation, withdrawal sequencing, and tax efficiency -- though this is contested and varies by investor. Present this as a framework for the user's own evaluation, not as a finding that justifies any particular fee.
- Do not resolve the comparison. The math shows the fee cost. The user must weigh whether the services justify it.

### Very Large Portfolio (Over $500,000)

For large portfolios, percentage-based fees translate into significant annual dollar costs that many users do not viscerally understand:

- Lead with annual dollar cost, not the percentage. A 1.00% AUM fee on a $1,000,000 portfolio is $10,000/year -- state this prominently.
- Show the fee in "hourly rate equivalent" if helpful: $10,000/year for advisory services is $833/month or approximately $192/week. Some users find this framing clarifying.
- Note that at large asset levels, advisor fee negotiation is common. AUM fees of 1.00% are sometimes negotiable to 0.75% or lower for accounts above $500,000--$1,000,000. This is a factual observation about industry practice, not advice.
- The break-even analysis becomes critical for large portfolios because even 0.10% fee differences produce thousands of dollars per year in cost. Show the fee impact sensitivity table with more precision.

### User Asks About 401(k) Plan Fees

401(k) fee analysis has unique layers that retail brokerage analysis does not:

- **Plan administrative fees:** These are paid by either the employer or the employees (via asset-based fees charged against the plan). The 404a-5 disclosure breaks these out.
- **Fund expense ratios:** Often higher than retail equivalents for the same fund family -- institutional share classes reduce this, but many small-plan participants have access to only retail share classes.
- **Revenue sharing / 12b-1 fees:** Some 401(k) plans use funds with higher expense ratios that kick back part of the expense ratio to the plan administrator as compensation. This is disclosed in the 404a-5 but often obscure.
- Advise the user to look at the 404a-5 "designated investment alternatives" table, which shows the expense ratio for every fund option in their plan. The analysis methodology is identical once these numbers are obtained.

### Fees Vary Over Time (Tiered AUM Schedules)

Many advisors use tiered fee schedules: e.g., 1.00% on the first $500,000, 0.75% on the next $500,000, 0.50% above $1,000,000. Handling:

- For the opening year, use the fee tier applicable to the current balance.
- As the portfolio grows through the projection, the effective (blended) fee rate decreases. Calculate the blended rate at each 5-year milestone.
- Blended rate example: $750,000 portfolio under a 1.00% / 0.75% / 0.50% tier schedule = (1.00% × $500K + 0.75% × $250K) / $750K = (5,000 + 1,875) / 750,000 = 0.917% blended rate.
- Note that tiered schedules reduce the fee advantage of lower-fee alternatives over time, which slightly narrows the fee gap in later years.

### User Is Analyzing a Target-Date Fund vs. a DIY Equivalent

Target-date funds bundle asset allocation management and automatic glide path rebalancing into a single product fee. The comparison to DIY requires an important adjustment:

- A target-date fund at 0.15% expense ratio is not directly comparable to a single equity fund at 0.03% expense ratio -- the target-date fund includes bonds and the glide path mechanism.
- The correct comparison is the target-date fund's ER vs. a weighted average of the underlying asset class ETFs the user would need to hold to replicate the allocation (e.g., 70% equity ETF at 0.03% + 30% bond ETF at 0.04% = blended 0.033%).
- The fee difference then represents the "convenience premium" for not managing the allocation manually.
- Note: the target-date fund's glide path is automatic, which eliminates rebalancing behavioral risk. This has value, as noted in the advisor-alpha context above.

### Multi-Account or Household Fee Analysis

If the user has multiple accounts (taxable brokerage, traditional IRA, Roth IRA, spouse's 401(k)), each with different fee structures:

- Calculate each account separately using its own fee scenario and time horizon.
- Sum the total fee impact across all accounts.
- Note that for AUM-based advisors, households often qualify for lower blended rates than individual accounts -- the user should confirm whether their advisor fees reflect household aggregation.
- This is a more complex analysis -- offer to walk through each account individually and then sum the results.

---

## Example

**User input:** "I'm 38 years old and have $85,000 in my IRA. I contribute $600/month. I'm deciding between keeping my current actively managed fund at a 0.82% expense ratio plus a 1.00% AUM fee from my advisor, versus moving to a self-directed index fund approach at 0.05% with no advisor. My investment horizon is 27 years to age 65. Assume 7% gross annual return. What's the real cost difference?"

**Output:**

## Investment Fee Impact Analysis

> Return rate of 7.00% is a user-provided assumption, not a prediction. Actual results will differ. This analysis isolates the mathematical impact of fees and does not constitute a recommendation.

---

### Your Inputs

| Parameter                  | Value                              |
|----------------------------|------------------------------------|
| Starting investment        | $85,000                            |
| Monthly contribution       | $600/month                         |
| Annual contribution total  | $7,200/year                        |
| Time horizon               | 27 years (to age 65)               |
| Target year                | 2052                               |
| Assumed gross return       | 7.00% per year (nominal, pre-fee)  |
| Front-end load             | None stated                        |

---

### Fee Scenarios

| Fee Component              | Scenario A: Self-Directed | Scenario B: Advised Approach |
|----------------------------|-------------------------:|-----------------------------:|
| Expense ratio              | 0.05%                    | 0.82%                        |
| Advisor / AUM fee          | 0.00%                    | 1.00%                        |
| **Total annual % cost**    | **0.05%**                | **1.82%**                    |
| **Net return after fees**  | **6.95%**                | **5.18%**                    |

**Note:** The advised approach has a 1.77% annual fee difference. This is the combined cost of the expense ratio differential (0.77%) and the advisor fee (1.00%). Both layers are charged on the full account balance each year, making the total all-in cost the relevant number for this comparison.

---

### Portfolio Growth Comparison

| Year | Age | Scenario A (0.05%) | Scenario B (1.82%) | Difference   | A advantage |
|-----:|----:|-------------------:|-------------------:|-------------:|------------:|
| 0    | 38  | $85,000            | $85,000            | $0           | 0.0%        |
| 5    | 43  | $163,204           | $151,118           | $12,086      | 8.0%        |
| 10   | 48  | $271,877           | $237,853           | $34,024      | 14.3%       |
| 15   | 53  | $420,498           | $355,083           | $65,415      | 18.4%       |
| 20   | 58  | $621,511           | $511,740           | $109,771     | 21.5%       |
| 25   | 63  | $901,088           | $719,133           | $181,955     | 25.3%       |
| 27   | 65  | $1,018,756         | $799,421           | $219,335     | 27.4%       |

**Key milestones:**
- The fee difference crosses $10,000 by approximately year 5
- The fee difference crosses $100,000 by approximately year 20
- The fee difference exceeds $200,000 by retirement at year 27

---

### Fee Impact Summary

| Metric                                    | Scenario A      | Scenario B      |
|-------------------------------------------|-----------------|-----------------|
| Final portfolio value                     | $1,018,756      | $799,421        |
| Total contributions made                  | $279,400        | $279,400        |
| Total net growth                          | $739,356        | $520,021        |
| Estimated total fees paid (opportunity)   | ~$6,200         | ~$225,635       |
| Fees as % of no-fee final value           | ~0.6%           | ~21.9%          |
| Fees as % of total growth earned          | ~0.8%           | ~33.5%          |

**Fee cost between scenarios:**
- Dollar difference (A vs B): **$219,335** over 27 years
- Equivalent to: **365 months** (30.4 years) of your $600/month contribution
- Equivalent to: **78 cents** in lost potential wealth per dollar contributed in Scenario B vs. Scenario A

**Reading this:** The advised approach does not just cost 1.77% per year in a vacuum -- it costs $219,335 in final wealth compared to the self-directed approach, assuming both achieve 7.00% gross returns. That difference represents contributions you would have had to make for more than 30 additional years to compensate.

---

### Break-Even Analysis

For Scenario B (the advised approach) to match Scenario A's final portfolio value of $1,018,756, it must consistently achieve a gross return of exactly **8.77% per year** -- which is 1.77% above the 7.00% base assumption -- every single year for all 27 years.

| Horizon   | Required Annual Gross Return (Scenario B) | Required Outperformance vs. 7% |
|-----------|------------------------------------------:|-------------------------------:|
| 5 years   | 8.77%                                     | +1.77%/year                    |
| 10 years  | 8.77%                                     | +1.77%/year                    |
| 20 years  | 8.77%                                     | +1.77%/year                    |
| 27 years  | 8.77%                                     | +1.77%/year                    |

The required annual outperformance is constant at 1.77% per year -- because that is the fee difference. The longer the horizon, the lower the historical probability of any active manager achieving this consistently.

**Context (not a recommendation):** S&P SPIVA data has historically found that roughly 80--90% of actively managed U.S. equity funds underperform their benchmark index net of fees over 15+ year periods. This finding is relevant to evaluating whether the active fund component of the advised portfolio is likely to cover the fee gap -- but it does not determine what any individual fund will do.

---

### Sensitivity: What If Scenario B Achieves Different Gross Returns?

| Scenario B gross return | Scenario B final value | vs. Scenario A ($1,018,756) |
|-------------------------|----------------------:|----------------------------:|
| 5.50% (underperforms)   | $672,801              | Behind by $345,955          |
| 7.00% (equal, base)     | $799,421              | Behind by $219,335          |
| 7.50% (modest edge)     | $858,340              | Behind by $160,416          |
| 8.77% (break-even)      | $1,018,756            | Equal                       |
| 9.50% (strong edge)     | $1,121,490            | Ahead by $102,734           |

---

### Important Context

1. **Equal-returns assumption:** This analysis models both scenarios at 7.00% gross return before fees. In reality, the advised portfolio's fund selection, tax management, and allocation decisions will produce a different gross return than the index fund approach -- higher or lower. This analysis answers the question: "What does the 1.77% fee gap cost, assuming everything else is equal?"

2. **What the advisor fee may cover:** A 1.00% AUM fee in a full-service relationship often includes financial planning, tax optimization, insurance review, estate coordination, rebalancing, and behavioral coaching during volatility. These services have real -- and in some cases, substantial -- value. Vanguard's Advisor's Alpha research estimates competent advisors can add approximately 1.50% in net annual value through these services, though the actual value is highly dependent on advisor quality and client behavior. This analysis does not quantify those benefits.

3. **Tax-loss harvesting offset (if applicable):** In a taxable account, an advisor offering systematic tax-loss harvesting might generate 0.30--0.80% in annual after-tax benefit for investors in the 24%+ federal bracket. This IRA example does not apply since IRAs are tax-deferred -- but if a taxable account is being analyzed, this factor should be considered.

4. **Fee drag grows with portfolio size:** In year 1, the 1.82% fee on an $85,000 portfolio is $1,547/year. By year 20, when the Scenario B portfolio reaches approximately $512,000, that same 1.82% is $9,318/year -- a cost that exceeds the annual contribution amount. The dollar impact of a constant fee percentage increases dramatically as the portfolio grows.

5. **This analysis does not constitute advice.** It shows that the current fee arrangement has a projected 27-year cost of $219,335 in opportunity cost under the equal-returns assumption. What to do with that information -- weigh it against services received, negotiate fees, change structure, or maintain the current approach -- is the user's decision, ideally made with full information and professional counsel.

---

### Next Steps
- [ ] Obtain your exact fee schedule: your advisor's ADV Part 2A (the fee table on pages 4--6 typically), and your current fund's "net expense ratio" from the fund fact sheet
- [ ] Ask your advisor: "What is my total all-in annual cost, including fund expense ratios inside my account?" A good advisor will provide this number directly
- [ ] Ask your advisor what specific services are included in the 1.00% fee and what the estimated annual value of those services is
- [ ] If your account is in a taxable (non-IRA) account, ask whether tax-loss harvesting is part of the service and what the estimated annual tax benefit has been
- [ ] Revisit this analysis annually -- at $100,000 increments in portfolio size, recalculate the annual dollar fee cost to keep the number concrete
- [ ] If you negotiate fees, re-run this analysis at the new fee rate to see the revised cost difference
