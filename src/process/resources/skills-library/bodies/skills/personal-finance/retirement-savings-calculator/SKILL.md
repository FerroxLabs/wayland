---
name: retirement-savings-calculator
description: |
  Calculates monthly savings needed to reach a retirement target using compound
  growth math. The user provides their target amount, time horizon, current
  savings, and assumed growth rate. The skill computes the required monthly
  contribution and shows growth trajectories at different rates.
  Use when the user asks how much to save for retirement, wants to calculate
  retirement savings needs, or wants to project investment growth over time.
  Do NOT use for choosing specific investments (use portfolio-allocation-framework),
  understanding account types (use investment-account-types), or tax planning
  (use tax-advantaged-optimizer).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "retirement-planning personal-finance investing planning"
  category: "personal-finance"
  subcategory: "investing"
  depends: ""
  disclaimer: "educational-finance"
  difficulty: "intermediate"
---
# Retirement Savings Calculator

> **Disclaimer:** This skill provides educational information about financial concepts and general guidance for personal financial planning. It does NOT constitute financial advice, investment recommendations, or tax guidance. Individual financial circumstances vary significantly, and the information provided should not be relied upon as a substitute for professional counsel. Always consult a qualified financial advisor, certified financial planner (CFP), or licensed tax professional before making financial decisions.

---

## When to Use

**Use this skill when:**
- The user asks "how much do I need to save each month to retire with $X?" and provides concrete numbers to work with
- The user wants to see whether their current savings rate will reach a specific retirement balance by a target date
- The user asks "if I save $Y per month, what will I have at retirement?" -- a forward projection rather than a backward solve
- The user wants to quantify the cost of delaying contributions -- e.g., "what happens if I wait two more years before increasing my 401(k)?"
- The user wants to compare retirement scenarios side-by-side: retiring at 62 vs. 65 vs. 68, or hitting $800K vs. $1.2M
- The user wants to see how a one-time windfall (inheritance, bonus, home sale proceeds) would change their monthly savings requirement
- The user wants to understand what "real" (inflation-adjusted) vs. "nominal" growth assumptions mean for their specific numbers

**Do NOT use this skill when:**
- The user wants to decide how to allocate their portfolio across stocks, bonds, and other asset classes -- use `portfolio-allocation-framework`
- The user wants to understand the mechanics of Roth IRAs, traditional IRAs, 401(k)s, HSAs, or other account wrappers -- use `investment-account-types`
- The user wants to optimize contributions across account types for tax efficiency -- use `tax-advantaged-optimizer`
- The user wants a conceptual explanation of how compound interest works without applying it to their own numbers -- use `compound-growth-explainer`
- The user's primary question is about Social Security or pension optimization -- use `social-security-optimizer` or `pension-analysis`
- The user wants to model retirement income drawdown (how to spend the money once accumulated) -- use `retirement-income-planner`
- The user needs a full financial plan that integrates debt payoff, insurance, estate planning, and retirement -- refer them to a CFP; this skill handles only the accumulation math

---

## Process

### Step 1: Gather and Validate All Required Inputs

Collect every parameter before calculating. Missing inputs produce misleading results.

- **Target retirement amount (FV):** Ask whether this is expressed in today's dollars (real) or future dollars (nominal). This distinction changes which growth rate to use. Most people think in today's dollars without realizing it.
- **Current age and target retirement age:** Derive years to retirement (n_years). Flag if n_years is under 5 -- see Edge Cases. If the user says "I want to retire early," pin down an exact age rather than accepting vague language.
- **Current retirement savings (PV):** Sum across all accounts -- 401(k), IRA, Roth IRA, 403(b), taxable brokerage earmarked for retirement. Do not include emergency funds, home equity, or non-retirement investment accounts unless the user explicitly includes them.
- **Current monthly contribution:** Include employee contributions only. Employer match is handled separately in Step 6 to show it as a distinct lever. If the user does not know, ask them to check their most recent pay stub or account statement.
- **Assumed annual growth rate:** Do NOT suggest a number. Instead, explain that you will present three scenarios and ask whether they have a preference for the base case rate, or whether they want you to use standard planning scenarios (4%, 6%, 8%).
- **Optional inputs that materially improve accuracy:** monthly employer match amount, expected Social Security or pension income at retirement (in today's dollars), and whether they want inflation adjustment.

If any required input is missing after one round of asking, state explicitly which input is missing and why it blocks the calculation. Do not estimate silently.

### Step 2: Establish the Calculation Framework -- Real vs. Nominal

This is the most common source of confusion in retirement math and must be resolved before any arithmetic.

- **Nominal framework:** Target amount is in future dollars (e.g., "I want $1,000,000 in 2059 dollars"). Use nominal growth rates (e.g., 7% if the market averages 7% nominally). Contributions and target are both expressed in future nominal terms.
- **Real framework:** Target amount is in today's purchasing power dollars (e.g., "I want the equivalent of $1,000,000 today"). Use the real growth rate, which equals: real rate ≈ nominal rate -- inflation rate. At 7% nominal and 3% inflation, the real rate is approximately 3.88% (exact: (1.07/1.03) -- 1 = 3.88%).
- **Default recommendation:** If the user expresses their target in today's dollars (most do), use the real framework with a real growth rate. Explain this clearly -- it prevents the common mistake of using a 7% nominal rate against a today's-dollar target, which overstates the result.
- **Common inflation assumption:** 2.5%--3.0% for long-term planning. The Federal Reserve's stated target is 2%, but long-run realized U.S. CPI has averaged roughly 3%. Use 3% unless the user specifies otherwise.

### Step 3: Execute the Core Compound Growth Math

Perform and show all calculations step by step. Never present only results without showing the mechanics.

**Define variables precisely:**
```
FV  = Target retirement amount
PV  = Current retirement savings (today's balance)
r   = Monthly growth rate = (1 + annual rate)^(1/12) - 1
n   = Months until retirement = years * 12
PMT = Required monthly contribution (solved for)
```

**Calculate the future value of current savings:**
```
FV_current = PV * (1 + r)^n
```

**Calculate the gap that contributions must fill:**
```
FV_gap = FV - FV_current
```

**Solve for required monthly contribution:**
```
If FV_gap > 0:
  PMT = FV_gap * r / ((1 + r)^n - 1)

If FV_gap ≤ 0:
  Current savings alone will reach the target without additional contributions.
  Show the surplus and suggest options (raise target, reduce contributions, retire earlier).
```

**Important precision note:** Use the exact monthly rate conversion (1 + r_annual)^(1/12) -- 1, not the simpler r_annual / 12. At long time horizons (25+ years), the difference between these approaches accumulates to tens of thousands of dollars. Show which method you used so the user can replicate it.

**Worked arithmetic example (to embed in output):**
For r_annual = 6%, the monthly rate = (1.06)^(1/12) -- 1 = 0.004868 (0.4868%), not 0.5% (6%/12). This matters -- at 35 years, the simpler approximation overstates the balance by roughly 2--3%.

### Step 4: Build the Three-Scenario Comparison

Run the full calculation at three growth rates and present all three simultaneously.

- **Conservative scenario:** Real rate of 4% (approximates a 60/40 portfolio after inflation and fees, long-run)
- **Moderate scenario:** Real rate of 6% (approximates a 70/30 stock/bond portfolio after inflation)
- **Aggressive scenario:** Real rate of 8% (approximates a heavily equity-weighted portfolio after inflation, achievable historically but not guaranteed)

**If the user specified a rate:** Use their rate as the base scenario, and ± 2 percentage points for the others. Label them clearly as the user's assumption, not as categorically correct.

**For each scenario calculate and display:**
- Required monthly contribution (PMT)
- Annual contribution equivalent (PMT × 12)
- Total contributions over the full horizon (PMT × n)
- Total projected growth (FV -- total contributions -- PV)
- Growth-to-contribution ratio (how much of the final balance comes from growth vs. deposits)

The growth-to-contribution ratio is pedagogically powerful -- at 35 years and 6%, over 65% of the terminal balance typically comes from investment growth, not contributions. Showing this illustrates why time in market matters.

### Step 5: Construct the Growth Trajectory Table

Build a year-by-year or 5-year-interval trajectory for the base scenario.

- Show balance at the start and at every 5-year interval through retirement
- For each row, show: Year, Age, Cumulative contributions (PV + all PMT × months elapsed), Cumulative growth (balance -- cumulative contributions), and Projected balance
- The projected balance at each interval t (in months) is:

```
Balance(t) = PV * (1 + r)^t + PMT * ((1 + r)^t - 1) / r
```

- Highlight the "crossover point" -- the year when investment growth earned in a single year exceeds the annual contribution amount. This is a meaningful milestone that motivates savers.
- If n_years > 30, show the midpoint and three-quarter-point rows as well, not just 5-year intervals, to give a richer picture of the compounding curve.

### Step 6: Perform the Gap Analysis and Leverage Analysis

Compare current savings behavior to what is required, and show every major lever the user has.

**Gap analysis:**
```
Monthly gap = Required PMT -- Current monthly contribution
Annual gap = Monthly gap * 12
As % of gross income = (Monthly gap / Monthly gross income) * 100  [if income provided]
```

**Employer match leverage (critical -- often overlooked):**
- If the user has an employer match, show the effective contribution rate. A 50% match on the first 6% of salary means a 3% salary contribution generates 3% from the employer -- a 100% instant return on matched dollars.
- Show what the required PMT drops to if the employer match is counted as part of the total monthly savings.
- Many users under-save partly because they do not conceptualize the match as part of their monthly savings.

**Delay cost table -- show the compounding cost of waiting:**

Calculate the required PMT if the user starts today, in 1 year, 2 years, 3 years, and 5 years. Present as a table. This is often the most motivating output -- the cost of a 5-year delay frequently doubles the required monthly payment.

**Formula for delay cost (starting D years later):**
```
n_delayed = (n_years - D) * 12
FV_current_delayed = PV * (1 + r)^(n_delayed)
FV_gap_delayed = FV - FV_current_delayed
PMT_delayed = FV_gap_delayed * r / ((1 + r)^(n_delayed) - 1)
```

### Step 7: Run the Sensitivity Analysis

Show how the required monthly contribution responds to changing the four most important variables.

**Variable 1 -- Retirement age (±3 and ±5 years from target):**
Retiring 5 years earlier has a double-compounding effect: fewer months of contributions AND fewer months of growth. Retiring 5 years later has the inverse double benefit.

**Variable 2 -- Target amount (±20% from base):**
Show $800K, $1M, and $1.2M if the base is $1M. Demonstrates the linearity of the PMT calculation -- a 20% higher target requires roughly 20% higher monthly contributions if everything else is fixed.

**Variable 3 -- Lump sum injection (what if user adds $10K, $25K, or $50K today):**
```
FV_with_lump = (PV + lump_sum) * (1 + r)^n
PMT_with_lump = (FV - FV_with_lump) * r / ((1 + r)^n - 1)
```
This is highly relevant for users with bonuses, tax refunds, or inheritance.

**Variable 4 -- Growth rate (already covered in Step 4, but cross-reference):**
The scenario table in Step 4 serves as the growth-rate sensitivity analysis. Do not duplicate it here -- reference it.

### Step 8: Present Caveats, Flags, and Next-Step Recommendations

Every retirement projection carries meaningful uncertainty. Surface the most important caveats with specific context, not boilerplate.

**Required caveats:**
- Growth rates are mathematical scenarios. They do not predict actual market returns. Historical 10-year rolling returns for a diversified U.S. equity portfolio have ranged from roughly --1% to +20% annually -- the average tells you little about any specific 35-year window.
- Sequence-of-returns risk: A market downturn in the final 5--7 years before retirement has an outsized negative effect on terminal balance compared to the same downturn early in the savings period. This model does not capture that.
- Inflation: If using nominal rates and a nominal target, the purchasing power of that target depends entirely on realized inflation over the horizon.
- Taxes on withdrawals: Traditional pre-tax accounts (401(k), traditional IRA) incur ordinary income tax on withdrawals. Roth accounts do not. The after-tax value of the same balance differs materially depending on account type. This model works with pre-tax dollars unless specified otherwise.
- Healthcare costs: Fidelity's annual estimate (widely cited in financial planning literature) puts average healthcare costs for a 65-year-old couple in retirement at $315,000+ in today's dollars through the end of life. This is not modeled here.
- Social Security and pension offsets: Not included by default. If the user provides expected Social Security income in today's dollars, reduce the required monthly PMT by the present value of that income stream.

**Behavioral flags:**
- If required PMT > 25% of stated gross monthly income: Flag this as a signal to revisit the target amount, timeline, or both. This threshold, not 50%, is where most financial planners begin discussing plan feasibility.
- If required PMT < 10% of stated gross monthly income: Note that the savings goal appears achievable within standard planning guidelines and encourage consistency.
- If the user is over age 50: Flag catch-up contribution provisions. In the U.S. for 2024, the 401(k) catch-up limit is an additional $7,500/year (total $30,500), and IRA catch-up is an additional $1,000/year (total $8,000). These increase the ceiling on tax-advantaged savings meaningfully.

---

## Output Format

```
## Retirement Savings Projection

> All figures are in [TODAY'S DOLLARS / FUTURE NOMINAL DOLLARS -- specify which].
> Growth rates are mathematical assumptions, not return forecasts.

---

### Your Inputs

| Parameter                        | Value              |
|----------------------------------|--------------------|
| Target retirement amount         | $[amount]          |
| Dollar basis                     | [Today's / Nominal]|
| Current age                      | [age]              |
| Target retirement age            | [age]              |
| Years / Months until retirement  | [yrs] yrs / [mo] mo|
| Current retirement savings       | $[amount]          |
| Current monthly contribution     | $[amount]          |
| Employer monthly match           | $[amount] (or N/A) |
| Growth rate framework            | [Real / Nominal]   |

---

### Required Monthly Contribution -- Three Scenarios

| Scenario         | Annual Rate | Monthly Rate | Req. Monthly | Annual Equiv. | Total Contrib. | Total Growth | Growth Ratio |
|------------------|-------------|-------------|-------------|-------------|-------------|-------------|-------------|
| Conservative     | [X]%        | [X]%        | $[amount]   | $[amount]   | $[amount]   | $[amount]   | [X]%        |
| **Base**         | **[X]%**    | **[X]%**    | **$[amt]**  | **$[amt]**  | **$[amt]**  | **$[amt]**  | **[X]%**    |
| Aggressive       | [X]%        | [X]%        | $[amount]   | $[amount]   | $[amount]   | $[amount]   | [X]%        |

Growth Ratio = percentage of terminal balance derived from investment growth (not contributions).

---

### Core Math (Base Scenario -- Shown for Verification)

```
Annual rate:           [X]%
Monthly rate (exact):  (1 + [X])^(1/12) - 1 = [X]%  (NOT [annual/12])
Months to retirement:  [years] × 12 = [n] months

FV of current savings:
  $[PV] × (1 + [r])^[n] = $[FV_current]

Gap to fill via contributions:
  $[FV_target] - $[FV_current] = $[FV_gap]

Required monthly contribution:
  PMT = $[FV_gap] × [r] / ((1 + [r])^[n] - 1)
      = $[PMT]
```

---

### Growth Trajectory (Base Scenario -- $[PMT]/month at [X]%)

| Year | Age | Months Elapsed | Cumul. Contributions | Cumul. Growth | Projected Balance | Milestone |
|------|-----|---------------|---------------------|--------------|------------------|-----------|
| 0    | [a] | 0             | $[PV]               | $0           | $[PV]            |           |
| 5    | [a] | 60            | $[amount]           | $[amount]    | $[balance]       |           |
| 10   | [a] | 120           | $[amount]           | $[amount]    | $[balance]       | [if crossover yr] |
| 15   | [a] | 180           | $[amount]           | $[amount]    | $[balance]       |           |
| 20   | [a] | 240           | $[amount]           | $[amount]    | $[balance]       |           |
| 25   | [a] | 300           | $[amount]           | $[amount]    | $[balance]       |           |
| 30   | [a] | 360           | $[amount]           | $[amount]    | $[balance]       |           |
| [n/12] | [retirement age] | [n] | $[total] | $[total growth] | $[FV_target] | **TARGET** |

**Crossover point:** Year [X] -- annual growth exceeds annual contribution amount for the first time.

---

### Gap Analysis

| Metric                                    | Value      |
|-------------------------------------------|------------|
| Required monthly contribution (base)      | $[amount]  |
| Your current monthly contribution         | $[amount]  |
| Employer match (monthly)                  | $[amount]  |
| Effective total monthly savings           | $[amount]  |
| Monthly shortfall (or surplus)            | $[amount]  |
| As % of gross income                      | [X]% (if income provided) |

**Delay cost -- what waiting costs you:**

| Start Delay  | Months Remaining | Required Monthly | Monthly Increase vs. Today | Extra Total Cost |
|--------------|-----------------|-----------------|--------------------------|-----------------|
| Start now    | [n]             | $[amount]       | --                       | --              |
| 1-year delay | [n-12]          | $[amount]       | +$[amount]               | +$[amount]      |
| 2-year delay | [n-24]          | $[amount]       | +$[amount]               | +$[amount]      |
| 3-year delay | [n-36]          | $[amount]       | +$[amount]               | +$[amount]      |
| 5-year delay | [n-60]          | $[amount]       | +$[amount]               | +$[amount]      |

---

### Sensitivity Analysis

**Retirement age (at [base rate]% -- base target of $[FV]):**

| Retire At | Years Remaining | Required Monthly | vs. Base |
|-----------|----------------|-----------------|---------|
| [age-5]   | [yrs]          | $[amount]       | +$[X]   |
| [age-3]   | [yrs]          | $[amount]       | +$[X]   |
| **[age]** | **[yrs]**      | **$[amount]**   | **Base**|
| [age+3]   | [yrs]          | $[amount]       | -$[X]   |
| [age+5]   | [yrs]          | $[amount]       | -$[X]   |

**Target amount (at [base rate]% -- retiring at [age]):**

| Target          | Required Monthly | vs. Base |
|-----------------|-----------------|---------|
| $[FV × 0.80]    | $[amount]       | -$[X]   |
| **$[FV]**       | **$[amount]**   | **Base**|
| $[FV × 1.20]    | $[amount]       | +$[X]   |
| $[FV × 1.50]    | $[amount]       | +$[X]   |

**Lump-sum injection today (at [base rate]% -- base scenario):**

| One-Time Addition | Revised Required Monthly | Monthly Reduction |
|-------------------|--------------------------|------------------|
| $0 (base)         | $[amount]                | --               |
| $10,000           | $[amount]                | -$[X]            |
| $25,000           | $[amount]                | -$[X]            |
| $50,000           | $[amount]                | -$[X]            |

---

### Caveats and Flags

**⚠ Important limitations of this projection:**
- Growth rates used are mathematical scenarios -- not forecasts of any investment
- Historical 10-year rolling U.S. equity returns have ranged from approximately -1% to +20% annually
- Sequence-of-returns risk (market downturns near retirement) is not modeled
- Taxes on withdrawals are not included -- pre-tax account balances are worth less than their face value after taxes
- Healthcare costs in retirement (often estimated at $300,000+ for a couple in today's dollars) are not included
- Social Security / pension offsets not included [JURISDICTION: verify eligibility and estimated benefit]
- Purchasing power: $[FV] in [n_years] years at 3% inflation is equivalent to $[FV/(1.03^n_years)] in today's dollars

**[Flags -- include if applicable:]**
- ⚠ Required contribution exceeds 25% of stated income -- consider adjusting target or timeline
- ℹ If over age 50, catch-up contribution limits may apply [JURISDICTION: verify current limits]
- ℹ Employer match not fully captured in your current contribution -- verify you are contributing at least enough to capture the full match

---

### Next Steps

- [ ] Confirm you are contributing enough to capture 100% of any employer match -- this is the highest-return action available
- [ ] Identify which accounts hold your current savings and their contribution limits [use `investment-account-types`]
- [ ] Determine whether to prioritize pre-tax or Roth contributions for tax efficiency [use `tax-advantaged-optimizer`]
- [ ] Set a calendar reminder to re-run this calculation in 12 months
- [ ] If the monthly gap exceeds $300, consider whether a step-up plan (increasing contributions by 1% of income per year) closes it over time
- [ ] Consult a CFP for a plan that integrates Social Security timing, drawdown sequencing, and tax bracket management in retirement
```

---

## Rules

1. **Never state a specific growth rate as "typical," "average," or "expected."** You may say historical U.S. equity markets have produced certain long-run averages -- but always pair this with the range of outcomes and the caveat that past performance does not predict future results.

2. **Always use the exact monthly rate conversion -- (1 + r_annual)^(1/12) - 1 -- not the approximation r_annual / 12.** The approximation introduces errors of 2--3% at 35-year horizons, representing tens of thousands of dollars. Show the exact calculation in the output.

3. **Always resolve the real vs. nominal dollar framework before calculating.** If the user says "I want $1,000,000," ask whether that is in today's dollars. Do not silently assume. A user targeting $1M in real terms with a 7% nominal rate will end up with approximately $356,000 in today's purchasing power at 3% inflation over 35 years -- a 64% shortfall in real terms.

4. **Always show the full calculation chain** (FV_current, FV_gap, PMT formula) so the user can independently verify or replicate the math in a spreadsheet. Opaque output reduces trust and is less educational.

5. **Always include the delay cost table** showing the required monthly contribution if the user starts now vs. delays 1, 2, 3, and 5 years. This is often the single most motivating piece of information for action.

6. **Never characterize the user as "on track" or "behind."** Present numbers. The user's goals, risk tolerance, and other income sources (Social Security, pension, part-time work) are factors this skill cannot fully account for. Frame results as "the math shows" rather than "you are."

7. **If required PMT exceeds 25% of stated gross monthly income, flag it explicitly** and suggest revisiting the target amount, timeline, or whether additional income sources (Social Security, part-time work, rental income) should reduce the target. 50% is too late to flag -- by 25%, a plan revision conversation is warranted.

8. **Always run three scenarios.** A single projection gives false precision. Three scenarios convey that the outcome is uncertain and help the user internalize the range of plausible results.

9. **Employer match must be separated from the user's own contribution.** Combining them obscures the user's actual out-of-pocket savings rate and hides the leverage available if the match is not fully captured.

10. **Round all dollar outputs to the nearest whole dollar.** Express growth rates to two decimal places (e.g., 0.49% monthly, not 0.5%). Do not display spurious precision in the terminal balance (e.g., $1,000,000, not $999,847.32) when the inputs themselves carry significant uncertainty over long horizons.

11. **If the required PMT is negative (current savings trajectory already exceeds the target), do not tell the user to stop saving.** Show the surplus, explain what it means (they could retire earlier, target a higher amount, or save less monthly), and present the options as a decision -- not a recommendation.

12. **Always flag the crossover point** -- the year when annual investment growth first exceeds the annual contribution amount. This milestone is pedagogically important and motivates continued saving. Calculate it by finding the smallest t where: PV * (1+r)^t * r * 12 + PMT * ((1+r)^t - 1) / r * r * 12 > PMT * 12.

---

## Edge Cases

### 1. User Does Not Know Their Target Amount

Do not block on this. Use the 25x Rule (also called the 4% Rule target) as the default estimation method:

```
Target = Annual expenses in retirement × 25
```

This derives from the widely cited Trinity Study finding that a 4% annual withdrawal rate has historically sustained a 30-year retirement with a diversified portfolio. It is an approximation with significant limitations (it was calibrated on 30-year retirements using historical U.S. data; it may not hold for 40+ year retirements or non-U.S. markets), but it is the standard starting point in financial planning.

Ask the user for their estimated annual retirement expenses (not current income -- retirement spending is often 70--85% of pre-retirement income for most households, though this varies widely). Multiply by 25 to estimate the target. Present this as one method -- not the answer -- and note that a user retiring at 55 with a 40-year retirement horizon may need a 3% withdrawal rate (33x) rather than 4% (25x) to account for longevity.

### 2. User Is Within 5 Years of Retirement

The calculation remains mathematically valid, but two additional considerations dominate:

- **Sequence-of-returns risk is severe at short horizons.** A 30% market decline in year 1 of a 5-year runway has a dramatically larger impact than the same decline at year 20 of a 35-year runway. Flag this explicitly. The standard planning response is to de-risk the portfolio as retirement approaches (shifting toward bonds and cash), which lowers the applicable growth rate assumption.
- **Contribution ceiling review matters more.** At age 50+, catch-up contribution provisions in most jurisdictions allow meaningfully larger tax-advantaged contributions. In the U.S. (2024): 401(k) $30,500 total ($23,000 standard + $7,500 catch-up), IRA $8,000 total ($7,000 standard + $1,000 catch-up). SIMPLE IRA catch-up: $3,500 additional. Flag these in the output.
- Recommend professional consultation more explicitly for sub-5-year timelines. The stakes are high and the window for correction is short.

### 3. User Has No Current Savings (PV = 0)

Set PV = 0. FV_current = 0. The full target must come from contributions and growth. This is mathematically valid and often produces large PMT values.

Show the "cost of the delay" in reverse -- compare starting today vs. having started 5 years ago. The difference illustrates the value of time already passed and creates urgency without judgment. Phrase as: "If you had started 5 years ago with the same rate, the required monthly contribution today would have been $X. Starting now, it is $Y."

### 4. User Wants to Account for Inflation Explicitly

Offer both frameworks and explain the trade-off:

- **Real rate framework (recommended for most users):** Keep the target in today's dollars. Use real growth rate = (1 + nominal rate) / (1 + inflation rate) -- 1. For 7% nominal and 3% inflation: real rate = (1.07/1.03) -- 1 = 3.883%. The PMT calculation runs on the real rate. The terminal value is directly comparable to today's dollars. More intuitive.
- **Nominal framework:** Inflate the target by the expected inflation rate over n years: Nominal target = Real target × (1 + inflation)^n. Use nominal growth rates. The PMT is correct in future nominal dollars. Less intuitive but useful for comparison with Social Security benefit estimates (which are often expressed in nominal terms).

Both frameworks give equivalent real-dollar answers if applied correctly. The risk is mixing them -- using a nominal target with a real rate, or vice versa.

### 5. User Has Multiple Retirement Accounts with Different Contribution Rates

The accumulation model is account-agnostic. Sum all current balances for PV and all current contributions for PMT_current. The calculation shows the total needed regardless of account structure.

However, note that the required PMT represents total savings needed -- it must be distributed across actual accounts subject to their contribution limits. If the required PMT of $2,500/month ($30,000/year) exceeds what fits in tax-advantaged accounts (e.g., $23,000 in a 401(k) + $7,000 in an IRA = $30,000 for someone under 50), note that the remainder would go into taxable accounts. Flag that taxable accounts have different tax treatment and direct the user to `tax-advantaged-optimizer` for that layer of planning.

### 6. User Wants to Model Social Security or Pension as an Offset

If the user knows their expected Social Security benefit (available from their SSA statement at ssa.gov for U.S. users) or pension benefit, reduce the effective retirement target using the following logic:

```
Annual SS income (in today's dollars): $[SS_annual]
Retirement horizon (years): 25 (standard assumption -- adjust if user provides expected lifespan)
Real discount rate: 3% (approximation)

Present value of SS income stream at retirement date:
  PV_SS = SS_annual × (1 - (1 + r)^(-25)) / r

Adjusted FV target = FV_target - PV_SS
```

This is an approximation. Social Security is inflation-indexed, which makes it more valuable than a nominal annuity. Note this in the output and recommend the SSA's own benefit calculator for a precise estimate.

### 7. Required PMT Is Already Met or Exceeded by Current Contributions

If current PMT + employer match already meets or exceeds the required PMT at the base growth rate:

- Show the surplus in dollar terms and as a percentage above target
- Present three options explicitly: (a) retire earlier -- show by how many years, (b) increase the retirement target -- show the new achievable amount, or (c) maintain current pace and build a buffer against underperformance
- Do not recommend any specific option. Present the numbers and let the user decide.
- Show what the plan looks like under the conservative scenario -- even if the base scenario shows surplus, the conservative scenario may show a shortfall. This prevents overconfidence.

### 8. User Is Self-Employed with No Employer Match

Flag that self-employed individuals in the U.S. have access to account types with significantly higher contribution limits than standard W-2 employees:
- SEP-IRA: Up to 25% of net self-employment income, maximum $69,000 (2024)
- Solo 401(k): Up to $69,000 total ($23,000 employee + $46,000 employer/profit-sharing, 2024)
- SIMPLE IRA: Up to $16,000 employee contribution + 3% employer match on own income

These higher limits can dramatically accelerate accumulation and change the monthly PMT calculus. Direct to `investment-account-types` for details on eligibility and setup.

---

## Example

**Input:**
"I'm 34 years old and want to retire at 67. I currently have $48,000 saved across my 401(k) and Roth IRA. I contribute $650 per month out of my paycheck, and my employer matches 50 cents on the dollar up to 6% of my $85,000 salary -- so I think I get about $212/month from them. I want to have the equivalent of $1,200,000 in today's dollars when I retire. What do I need to do?"

**Output:**

---

## Retirement Savings Projection

> All figures are in **today's dollars** (real dollar framework).
> Growth rates shown are real rates (net of a 3% inflation assumption).
> These are mathematical scenarios, not return forecasts.

---

### Your Inputs

| Parameter                        | Value                      |
|----------------------------------|----------------------------|
| Target retirement amount         | $1,200,000 (today's dollars)|
| Dollar basis                     | Real (today's dollars)     |
| Current age                      | 34                         |
| Target retirement age            | 67                         |
| Years / Months until retirement  | 33 years / 396 months      |
| Current retirement savings       | $48,000                    |
| Current monthly contribution     | $650 (your contribution)   |
| Employer monthly match           | $212/month                 |
| Effective total monthly savings  | $862/month                 |
| Growth rate framework            | Real (nominal rate -- 3%)  |

---

### Core Math (Base Scenario -- 6% Real Rate -- Shown for Verification)

```
Annual real rate:      6.00%
Monthly real rate:     (1 + 0.06)^(1/12) - 1 = 0.4868%  (not 6%/12 = 0.5000%)
Months to retirement:  33 × 12 = 396 months

FV of current savings:
  $48,000 × (1 + 0.004868)^396
  = $48,000 × 6.8226
  = $327,485

Gap to fill via contributions:
  $1,200,000 - $327,485 = $872,515

Required total monthly contribution (employee + employer):
  PMT = $872,515 × 0.004868 / ((1 + 0.004868)^396 - 1)
      = $872,515 × 0.004868 / (6.8226 - 1)
      = $872,515 × 0.004868 / 5.8226
      = $729 / month total
```

---

### Required Monthly Contribution -- Three Scenarios

| Scenario         | Real Rate | Monthly Rate | Req. Total Monthly | Req. Employee Only | Annual Equiv. | Total Contrib. | Total Growth | Growth Ratio |
|------------------|-----------|-------------|-------------------|-------------------|--------------|--------------|------------|-------------|
| Conservative     | 4.00%     | 0.3274%     | $1,042            | $830              | $12,504      | $412,632     | $787,368   | 66%         |
| **Base**         | **6.00%** | **0.4868%** | **$729**          | **$517**          | **$8,748**   | **$288,408** | **$911,592**| **76%**    |
| Aggressive       | 8.00%     | 0.6434%     | $488              | $276              | $5,856       | $193,248     | $1,006,752 | 84%         |

*"Req. Employee Only" = Total required monthly minus employer match of $212/month.*
*Growth Ratio = share of $1,200,000 terminal balance coming from investment growth.*

At the base rate of 6%, **76 cents of every dollar in your retirement account at age 67 will come from compound growth -- not from your contributions.** This illustrates why consistency and time in market matter more than optimizing the exact contribution amount in any single year.

---

### Growth Trajectory (Base Scenario -- $729/month total at 6% real)

| Year | Age | Months | Cumul. Contributions | Cumul. Growth | Projected Balance | Milestone                          |
|------|-----|--------|---------------------|--------------|------------------|------------------------------------|
| 0    | 34  | 0      | $48,000             | $0           | $48,000          | Starting balance                   |
| 5    | 39  | 60     | $91,740             | $28,892      | $120,632         |                                    |
| 10   | 44  | 120    | $135,480            | $81,285      | $216,765         |                                    |
| 15   | 49  | 180    | $179,220            | $178,200     | $357,420         |                                    |
| 18   | 52  | 216    | $206,652            | $282,513     | $489,165         | **Crossover: annual growth ($28,267) exceeds annual contributions ($8,748)** |
| 20   | 54  | 240    | $222,960            | $338,408     | $561,368         |                                    |
| 25   | 59  | 300    | $266,700            | $580,127     | $846,827         |                                    |
| 30   | 64  | 360    | $310,440            | $903,741     | $1,052,181       | 88% of target                      |
| 33   | 67  | 396    | $336,852            | $863,148     | $1,200,000       | **TARGET REACHED**                 |

**Crossover point: Year 18 (age 52).** Beginning at this point, your investments earn more in a single year than you contribute. From age 52 to 67, growth delivers more than $580,000 of your terminal balance.

---

### Gap Analysis

| Metric                                    | Value              |
|-------------------------------------------|--------------------|
| Required total monthly (base, 6%)         | $729               |
| Your current monthly contribution         | $650               |
| Employer match (monthly)                  | $212               |
| Effective total monthly savings           | $862               |
| Monthly surplus vs. required              | **+$133**          |
| As % of gross income ($85,000 / 12)       | 12.2% personal rate; 14.4% combined rate |

**Your combined contribution of $862/month already exceeds the required $729/month at the 6% real rate.** At the conservative 4% rate, you need $1,042/month and currently contribute $862 -- a $180/month gap. See below.

**Delay cost -- what waiting would cost you (if you were starting today from $0):**

Shown here as a reference for the cost of inaction -- this illustrates what every year of delay means.

| Start Delay  | Months Remaining | Required Total Monthly | Monthly Increase vs. Now | Extra Total Cost (nominal) |
|--------------|-----------------|----------------------|--------------------------|---------------------------|
| Start now    | 396             | $729                 | --                       | --                        |
| 1-year delay | 384             | $759                 | +$30                     | +$11,520                  |
| 2-year delay | 372             | $793                 | +$64                     | +$23,808                  |
| 3-year delay | 360             | $830                 | +$101                    | +$36,360                  |
| 5-year delay | 336             | $913                 | +$184                    | +$61,056                  |

A 5-year delay starting from today -- if you reduced your contributions to zero -- would require an extra $184/month for the remaining 28 years, costing an additional $61,056 in total contributions just to end up at the same place.

---

### Sensitivity Analysis

**Retirement age (6% real rate, $1,200,000 target):**

| Retire At | Years Remaining | Required Total Monthly | vs. Base  |
|-----------|----------------|----------------------|-----------|
| 62        | 28 years       | $997                 | +$268     |
| 64        | 30 years       | $892                 | +$163     |
| **67**    | **33 years**   | **$729**             | **Base**  |
| 70        | 36 years       | $597                 | -$132     |
| 72        | 38 years       | $536                 | -$193     |

**Retiring at 62 instead of 67 requires $268/month more and also means fewer years of contributions and more years of drawdown -- a compounding disadvantage in both directions.**

**Target amount (6% real rate, retiring at 67):**

| Target          | Required Total Monthly | vs. Base  |
|-----------------|----------------------|-----------|
| $900,000        | $547                 | -$182     |
| $1,000,000      | $608                 | -$121     |
| **$1,200,000**  | **$729**             | **Base**  |
| $1,500,000      | $911                 | +$182     |
| $1,800,000      | $1,094               | +$365     |

**Lump-sum injection today (6% real rate, base scenario):**

| One-Time Addition | Revised Required Monthly | Monthly Reduction |
|-------------------|--------------------------|------------------|
| $0 (base)         | $729                     | --               |
| $10,000           | $663                     | -$66             |
| $25,000           | $564                     | -$165            |
| $50,000           | $399                     | -$330            |
| $100,000          | $68                      | -$661            |

A $50,000 lump sum today (e.g., from a bonus or windfall) would reduce your required monthly savings by $330 -- more than your entire current personal contribution -- because it has 33 years to compound.

---

### What Your Numbers Look Like at Each Growth Rate (Your Actual Trajectory with $862/month)

Since you are already saving $862/month, here is the projected terminal balance at each growth rate -- showing whether you overshoot, hit, or undershoot $1,200,000:

| Growth Rate | Projected Balance at 67 | vs. $1,200,000 Target |
|-------------|------------------------|-----------------------|
| 4% real     | $983,000               | -$217,000 (18% short) |
| 6% real     | $1,424,000             | +$224,000 (19% above) |
| 8% real     | $2,063,000             | +$863,000 (72% above) |

At 4%, you have an $18/month shortfall relative to the $1,042 required. Increasing to $880/month total (adding $18/month to your contribution) closes this gap at the conservative scenario.

---

### Caveats and Flags

**⚠ Important limitations of this projection:**
- Growth rates are mathematical scenarios, not forecasts. Historical 10-year rolling real returns for U.S. equities have ranged from approximately -4% to +17% annually.
- Sequence-of-returns risk is not modeled. A significant downturn in the 5--7 years before age 67 could materially reduce your terminal balance even if the long-run average rate holds.
- Pre-tax account balances (401(k)) will be reduced by ordinary income taxes on withdrawal. If your $48,000 is in pre-tax accounts and your future contributions are also pre-tax, the after-tax value of $1,200,000 depends on your tax bracket in retirement.
- Social Security income not included. Your SSA earnings record will estimate your benefit -- this could represent $15,000--$30,000/year in additional retirement income, significantly changing the required accumulation target.
- Healthcare costs not modeled. Current estimates for a couple retiring at 67 with Medicare coverage run approximately $315,000 in out-of-pocket costs through end of life (in today's dollars).
- **$1,200,000 in today's dollars in 33 years assumes you successfully adjust your target for inflation.** Using a real rate (as this projection does) addresses this correctly -- your $1,200,000 target retains today's purchasing power.

**ℹ Positive flags:**
- Your combined savings rate (14.4% of gross income including employer match) is within the range most financial planners consider sufficient for retirement by traditional retirement age.
- You are capturing 100% of your employer match -- this is optimal.
- At 6% real growth, you have a comfortable buffer above your target.

---

### Next Steps

- [ ] **Verify you are contributing at least 6% of salary** ($4,250/year) to capture the full $2,550/year employer match -- this appears to already be the case based on your inputs
- [ ] **Stress-test at the conservative 4% rate** -- you have an $18/month gap at this rate; consider whether to close it now or rely on future income increases
- [ ] **Request your Social Security earnings statement** to estimate your expected benefit and determine whether it reduces your required accumulation target materially
- [ ] **Identify the tax character of your $48,000 balance** -- if it is all pre-tax, consider whether Roth conversions or Roth contributions make sense for future tax diversification [use `tax-advantaged-optimizer`]
- [ ] **Re-run this calculation when your income increases** -- even adding 1% of salary ($71/month) to contributions when you receive a raise accelerates the timeline significantly
- [ ] **At age 50**, review catch-up contribution limits -- an additional $7,500/year in 401(k) contributions becomes available
- [ ] Consult a CFP for a complete plan integrating Social Security timing, Roth conversion ladders, and withdrawal sequencing
