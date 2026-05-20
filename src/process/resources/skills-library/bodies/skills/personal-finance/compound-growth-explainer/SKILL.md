---
name: compound-growth-explainer
description: |
  Demonstrates compound interest and growth concepts with worked calculations
  using the user's actual numbers. Shows growth trajectories at different
  contribution rates, growth rates, and time horizons so the user can see how
  compounding works with their specific situation.
  Use when the user asks about compound interest, wants to understand how money
  grows over time, or wants to see the math behind investment growth projections.
  Do NOT use for retirement-specific calculations (use retirement-savings-calculator),
  fee impact analysis (use investment-fee-analyzer), or choosing investments
  (use portfolio-allocation-framework).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "investing personal-finance analysis guide"
  category: "personal-finance"
  subcategory: "investing"
  depends: ""
  disclaimer: "educational-finance"
  difficulty: "beginner"
---
# Compound Growth Explainer

> **Disclaimer:** This skill provides educational information about financial concepts and mathematical demonstrations of compound growth. It does NOT constitute financial advice, investment recommendations, tax guidance, or a projection of actual investment results. Individual financial circumstances vary significantly. Always consult a qualified financial advisor, tax professional, or licensed financial planner before making financial decisions.

## When to Use

**Use this skill when:**
- The user explicitly asks what compound interest is, how it works, or wants an intuitive explanation of exponential growth in money
- The user has a starting amount and/or a contribution amount and wants to see how those numbers grow over time at various rates
- The user wants to understand the mathematical difference between simple interest and compound interest, including a side-by-side comparison
- The user asks about the "time value of money," the "power of compounding," or phrases like "how much will my savings be worth someday"
- The user wants to see how changing one variable -- starting earlier, contributing more, or achieving a higher rate -- affects their final outcome
- The user wants to understand how frequently compounding is applied (daily, monthly, annual) and how that affects results
- The user asks about the Rule of 72, doubling time, or exponential growth as a general concept applied to money
- The user wants to see the math broken down step-by-step so they can verify or understand each calculation themselves

**Do NOT use this skill when:**
- The user needs a structured retirement readiness analysis with savings gap, income replacement ratios, and Social Security integration -- use `retirement-savings-calculator`
- The user wants to quantify how investment management fees, expense ratios, or advisor fees reduce long-term wealth -- use `investment-fee-analyzer`
- The user is deciding how to allocate money across asset classes, choosing between stocks/bonds/cash, or wants risk-adjusted portfolio construction -- use `portfolio-allocation-framework`
- The user is calculating interest owed on a credit card, loan, or mortgage where the compounding works against them -- the math is the same, but the framing, urgency, and recommended actions differ significantly from savings growth education
- The user needs to calculate the present value of a future obligation or a discount rate for a business valuation -- use a dedicated financial modeling skill
- The user is already in the middle of a retirement or investment planning workflow and compounding is only one piece of a larger analysis -- integrate the formula into that skill rather than breaking flow with a standalone explainer

---

## Process

### Step 1: Gather the User's Actual Numbers

Before doing any calculation, confirm you have the inputs required. Do not invent numbers or use generic examples when the user has real figures.

- **Required:** Starting principal (PV) -- even $0 is valid; if missing, ask directly
- **Required:** Time horizon in years -- if missing, ask; note that anything under 3 years produces minimal compounding effect (flag this transparently)
- **Preferred:** Monthly contribution amount (PMT) -- if none, confirm whether they are investing a lump sum only
- **Optional but helpful:** Preferred growth rate to model -- if absent, use three scenarios: a conservative rate (4%), a moderate rate (6--7%), and an optimistic rate (9--10%)
- **Optional:** Compounding frequency -- default to monthly compounding unless the user specifies otherwise; note this is standard for most savings and investment accounts
- **Optional:** Desired inflation adjustment -- ask if they want to see real (inflation-adjusted) values alongside nominal values

If the user provides no numbers at all but wants to understand the concept, use a canonical teaching example: $1,000 starting, $100/month, 30 years. Clearly label these as illustrative numbers throughout.

---

### Step 2: Explain the Core Concept in Plain Language Before the Math

Anchor the user's intuition before presenting formulas. This step ensures the numbers are meaningful, not just impressive.

- **Simple interest:** Interest is calculated only on the original principal every period. A $10,000 deposit at 5% simple interest earns exactly $500 every year, in year 1 and year 30 -- the balance grows linearly.
- **Compound interest:** Interest is calculated on the current balance, which includes all previously earned interest. In year 2, you earn interest on $10,500 (not $10,000). In year 10, your balance has grown substantially and your annual interest earned is much larger than your year-1 interest, even at the same percentage rate.
- **The mechanism:** Each period's interest becomes part of the principal for the next period. This is what creates the hockey-stick curve -- slow at first, accelerating over time.
- **Time is the dominant variable.** Rate matters, but the length of time matters more. A 1% difference in annual return compounded over 30 years produces larger dollar differences than most people intuitively expect. Show this explicitly.
- **The two components of a compound growth outcome:** Money you contributed (principal + ongoing deposits) and money compounding added (growth on growth). These two components trade places over time -- in early years, contributions dominate; in later years, compounding dominates.

---

### Step 3: Present the Formulas with Clear Variable Definitions

State each formula explicitly and define every variable. Show the formula, the substituted numbers, and the result -- never skip directly to an answer.

**Formula 1: Lump Sum with No Contributions (Standard Compound Interest)**
```
FV = PV × (1 + r/n)^(n×t)

FV  = Future Value (ending balance)
PV  = Present Value (starting amount)
r   = Annual interest rate as a decimal (e.g., 6% = 0.06)
n   = Compounding periods per year (monthly = 12, daily = 365, annual = 1)
t   = Time in years
```

For monthly compounding: FV = PV × (1 + 0.06/12)^(12×t) = PV × (1.005)^(12t)

**Formula 2: Lump Sum Plus Regular Monthly Contributions (Future Value of Annuity Due)**
```
FV = PV × (1 + r/12)^(12t) + PMT × [((1 + r/12)^(12t) - 1) / (r/12)]

PMT = Monthly contribution amount
The first term is the future value of the lump sum alone
The second term is the future value of the contribution stream alone
Total FV is the sum of both
```

Show the user both terms separately before adding them. This makes it clear how much the starting amount contributes vs. how much ongoing contributions contribute.

**Formula 3: Simple Interest (for contrast)**
```
FV_simple = PV × (1 + r × t)

Note the multiplication vs. exponentiation -- this is the entire mechanical difference
between simple and compound growth
```

**Rule of 72 Approximation:**
```
Doubling time (years) ≈ 72 / annual percentage rate

This approximation is accurate within ~1% for rates between 2% and 15%
For higher rates, use the exact formula: t = ln(2) / ln(1 + r)
```

---

### Step 4: Execute the Calculations and Build the Comparison Tables

Work through each scenario methodically. Show intermediate calculations for at least the first 2--3 years so the user can follow the logic before trusting the full table.

**Table 1: Simple vs. Compound (lump sum only, same rate)**
- Use the user's starting amount and one rate (their preferred rate or 6% as default)
- Show years 1, 5, 10, 20, and the user's full horizon
- The gap should be minimal at year 1 and striking at the full horizon
- Compute the difference column as (Compound -- Simple) to show what compounding added

**Table 2: Growth at Three Rates (with monthly contributions)**
- Use the user's PV and PMT
- Use conservative (4%), moderate (7%), and optimistic (10%) if the user has no preference
- Justify rate selection briefly: these represent approximate ranges for low-volatility, diversified, and more growth-oriented scenarios respectively -- they are not predictions
- Show the same milestone years: 5, 10, 15, 20, and the user's full horizon
- Show the dollar difference between the conservative and optimistic scenarios at the endpoint -- this is often larger than people expect

**Table 3: Compounding Frequency Comparison**
- This is a frequently misunderstood nuance -- briefly demonstrate with the user's numbers
- Compare annual, monthly, and daily compounding at the same rate
- The difference between monthly and daily is small (often less than 0.1% of final value); the difference between annual and monthly is more meaningful for shorter horizons
- This table can be compact: just show the final value at the horizon for each frequency

**Table 4: Cost of Waiting (starting now vs. delaying)**
- Use the moderate rate and the user's contribution amount
- Show three scenarios: starting immediately, starting 5 years later, starting 10 years later
- When the user delays, they lose the compounding on both their existing principal AND on the contributions they would have made in those missing years
- Express the cost of waiting in two ways: raw dollar difference AND "equivalent extra monthly contributions needed to make up the gap" -- this is highly impactful

---

### Step 5: Show the Growth Breakdown (Contributions vs. Compounding)

This is the single most powerful educational element. The breakdown reveals the invisible engine of compounding.

- Break the final value into three buckets: (1) original starting principal, (2) total contributions made over the period, (3) total growth added by compounding
- Calculate total contributions simply: PMT × 12 × years
- Growth = FV -- PV -- total contributions
- Express each bucket as a percentage of the final value
- Then repeat this breakdown at two additional time horizons -- for example, at year 10 and at year 20 if the full horizon is 30 years
- Show how the percentage from compounding grows over time: at year 10 it might be 25% of the total; at year 30 it might be 55--65% of the total
- This dynamic -- where compounding becomes the dominant component over time -- is the core insight the user needs to internalize

---

### Step 6: Apply the Rule of 72 and Successive Doublings

The Rule of 72 converts abstract exponential math into a memorable, actionable mental model.

- Calculate doubling time for each of the three rates you used: 72 ÷ 4 ≈ 18 years, 72 ÷ 7 ≈ 10.3 years, 72 ÷ 10 ≈ 7.2 years
- Apply successive doublings to the user's starting principal: first double, second double, third double
- Show the year at which each doubling occurs at each rate
- Note explicitly: these doublings apply only to the starting lump sum, not to the contribution stream (which has its own compounding dynamic)
- For rates above 12%, use the exact formula t = ln(2)/ln(1+r) rather than the Rule of 72, as the approximation error becomes more pronounced
- Note the Rule of 114 for tripling time: 114 ÷ rate, and the Rule of 144 for quadrupling: 144 ÷ rate -- these are useful supplemental mental models for users who grasp the 72 rule quickly

---

### Step 7: Address Inflation, Taxes, and Reality

Every compound growth illustration requires a reality calibration section. Do not omit this.

**Inflation adjustment:**
- If the user did not request it, briefly flag it anyway: nominal returns (the headline percentage) include inflation; real returns (purchasing power) subtract it
- A simple rule of thumb: nominal rate minus expected inflation rate ≈ real rate. At 7% nominal and 3% inflation, real purchasing power grows at approximately 4% annually (exact: (1.07/1.03) -- 1 = 3.88%)
- If the user wants a real-return table, build a second version of Table 2 using the inflation-adjusted rate alongside the nominal version. Label clearly.

**Tax drag:**
- In a taxable account, dividends and realized gains are taxed annually, which reduces the effective compounding rate
- In a tax-deferred account (traditional 401k, IRA), growth compounds untouched but withdrawals are taxed as ordinary income
- In a tax-exempt account (Roth IRA, Roth 401k), growth is never taxed if withdrawal conditions are met
- A note: this skill does not compute specific tax outcomes [JURISDICTION: verify applicable account types and tax treatment], but the user should be aware that the account type affects the effective compounding rate materially
- As a rough illustration: a 0.5--1.5% annual tax drag on taxable accounts can reduce a 30-year outcome by 10--25% compared to a tax-deferred account -- reference the `investment-fee-analyzer` skill for precise tax-drag quantification

**Volatility reality check:**
- Real investments do not grow at a constant rate each year
- Sequence matters: two portfolios with the same average return but different year-by-year sequences produce different outcomes -- this is especially important when withdrawals are involved (sequence of returns risk) but is beyond the scope of this skill
- Note: the calculated values represent a mathematical scenario in which the stated growth rate is achieved smoothly and consistently, year after year. Actual returns will vary above and below this line in any given year.

---

### Step 8: Synthesize the Key Takeaways

Close with 3--5 distilled insights tailored to the user's specific numbers -- not generic aphorisms.

- Reference their actual dollar amounts and time horizon
- Identify which variable has the most leverage for them specifically: is it time (are they young?), contribution rate (can they increase PMT?), or starting amount (do they have a lump sum to deploy)?
- If their time horizon is under 10 years, be honest that compounding's effect is modest and the primary driver of growth is contributions, not compounding -- do not oversell compounding for short horizons
- Offer one "what-if" of high practical value: for example, "What if you added $50/month more?" or "What if you started 3 years earlier?" -- calculate this and show the dollar impact

---

## Output Format

```
## Compound Growth Analysis

### Your Numbers
| Parameter               | Value              |
|-------------------------|--------------------|
| Starting amount (PV)    | $[amount]          |
| Monthly contribution    | $[amount]/month    |
| Time horizon            | [n] years          |
| Compounding frequency   | Monthly (12x/year) |
| Rates modeled           | [r1]%, [r2]%, [r3]%|
| Inflation assumption    | [x]% (if requested)|

---

### How Compounding Works: The Core Mechanic

[2--3 sentence plain-language explanation tailored to the user's numbers]

Starting with $[PV] at [r]% annual (monthly rate: [r/12]%):
- After month 1: $[PV] × 1.[r/12] = $[amount] ([+$ interest earned])
- After month 2: $[balance] × 1.[r/12] = $[amount] ([+$ interest earned, note larger than month 1])
- After month 3: $[balance] × 1.[r/12] = $[amount]
...the monthly interest amount grows each period because the base grows.

---

### Step-by-Step Calculation (at [r2]%, first 3 years shown)

**The formula:**
FV = PV × (1 + r/12)^(12t) + PMT × [((1 + r/12)^(12t) - 1) / (r/12)]

**Substituting your numbers:**
Monthly rate = [r]/12 = [r/12 decimal]

Year 1: $[PV] × (1.[r/12])^12 + $[PMT] × [annuity factor] = $[lump sum component] + $[contribution component] = $[total Y1]
Year 2: $[Y1 balance] × (1.[r/12])^12 + $[PMT] × [annuity factor] = $[lump sum] + $[contributions] = $[total Y2]
Year 3: $[Y2 balance] × (1.[r/12])^12 + $[PMT] × [annuity factor] = $[lump sum] + $[contributions] = $[total Y3]

Note: The contribution annuity factor [((1.005)^12 - 1) / 0.005] = [factor] is constant
each year. The lump sum component grows larger each year because the base grows.

---

### Simple vs. Compound Interest
($[PV] at [r2]%, no additional contributions, to isolate the compounding effect)

| Year | Simple Interest | Compound Interest | Compounding Premium |
|------|---------------:|------------------:|--------------------:|
| 1    | $[amount]      | $[amount]         | $[diff]             |
| 5    | $[amount]      | $[amount]         | $[diff]             |
| 10   | $[amount]      | $[amount]         | $[diff]             |
| 20   | $[amount]      | $[amount]         | $[diff]             |
| [n]  | $[amount]      | $[amount]         | $[diff]             |

The gap at year [n] represents $[diff] earned purely because interest was applied
to a growing base rather than a fixed principal.

---

### Growth at Three Rates
(Starting: $[PV] | Monthly contribution: $[PMT]/month | Compounding: monthly)

| Year   | At [r1]%   | At [r2]%   | At [r3]%   | Difference [r1] vs [r3] |
|--------|----------:|----------:|----------:|------------------------:|
| 5      | $[amount] | $[amount] | $[amount] | $[diff]                 |
| 10     | $[amount] | $[amount] | $[amount] | $[diff]                 |
| 15     | $[amount] | $[amount] | $[amount] | $[diff]                 |
| 20     | $[amount] | $[amount] | $[amount] | $[diff]                 |
| [n]    | $[amount] | $[amount] | $[amount] | $[diff]                 |

A [r3-r1]% difference in annual return produces a $[endpoint diff] difference
over [n] years on these contributions.

---

### Compounding Frequency Comparison
($[PV] at [r2]%, [n] years, no additional contributions)

| Compounding Frequency | Formula Factor     | Final Value | vs. Monthly |
|-----------------------|--------------------|------------:|------------:|
| Annual (1x/year)      | (1 + r)^t          | $[amount]   | -$[diff]    |
| Monthly (12x/year)    | (1 + r/12)^(12t)   | $[amount]   | baseline    |
| Daily (365x/year)     | (1 + r/365)^(365t) | $[amount]   | +$[diff]    |

[Interpretation note: the practical difference between monthly and daily
compounding is $[diff] over [n] years -- small relative to the total.]

---

### The Cost of Waiting
(Moderate rate: [r2]% | Monthly contribution: $[PMT])

| Scenario      | Years Invested | Total Contributions | Final Value | Cost of Waiting |
|---------------|:--------------:|--------------------:|------------:|----------------:|
| Start now     | [n]            | $[total_contrib]    | $[FV]       | --              |
| Delay 5 yrs   | [n-5]          | $[total_contrib_5]  | $[FV_5]     | -$[diff_5]      |
| Delay 10 yrs  | [n-10]         | $[total_contrib_10] | $[FV_10]    | -$[diff_10]     |

To recover the $[diff_5] cost of a 5-year delay, you would need to contribute
approximately $[makeup_PMT]/month instead of $[PMT]/month for the remaining [n-5] years.

---

### Growth Breakdown: Contributions vs. Compounding
(Rate: [r2]% | [n]-year horizon)

**At year [n/3]:**
| Component                  | Amount    | % of Total |
|----------------------------|----------:|-----------:|
| Starting principal         | $[PV]     | [%]        |
| Contributions made         | $[contrib]| [%]        |
| Growth from compounding    | $[growth] | [%]        |
| **Total**                  | **$[FV]** | **100%**   |

**At year [n×2/3]:**
| Component                  | Amount    | % of Total |
|----------------------------|----------:|-----------:|
| Starting principal         | $[PV]     | [%]        |
| Contributions made         | $[contrib]| [%]        |
| Growth from compounding    | $[growth] | [%]        |
| **Total**                  | **$[FV]** | **100%**   |

**At year [n] (full horizon):**
| Component                  | Amount    | % of Total |
|----------------------------|----------:|-----------:|
| Starting principal         | $[PV]     | [%]        |
| Contributions made         | $[contrib]| [%]        |
| Growth from compounding    | $[growth] | [%]        |
| **Total**                  | **$[FV]** | **100%**   |

[Note the trajectory: compounding's share of the total rises from [%] at year [n/3]
to [%] at year [n]. In the later years, compounding outpaces contributions.]

---

### Rule of 72: Doubling Your Starting $[PV]

| Rate    | Exact Doubling Time        | Approx. (72 rule) | After 1st Double | After 2nd Double | After 3rd Double |
|---------|:--------------------------:|:-----------------:|:----------------:|:----------------:|:----------------:|
| [r1]%   | [exact] yrs                | [72/r1] yrs       | $[2xPV] yr [y]   | $[4xPV] yr [y]   | $[8xPV] yr [y]   |
| [r2]%   | [exact] yrs                | [72/r2] yrs       | $[2xPV] yr [y]   | $[4xPV] yr [y]   | $[8xPV] yr [y]   |
| [r3]%   | [exact] yrs                | [72/r3] yrs       | $[2xPV] yr [y]   | $[4xPV] yr [y]   | $[8xPV] yr [y]   |

Tripling time ≈ 114 / rate. At [r2]%: your $[PV] triples in approximately [114/r2] years.

---

### Key Takeaways for Your Situation

1. **[Specific insight tied to their numbers]**
2. **[Specific insight about their most powerful lever -- time, contributions, or rate]**
3. **[Specific "what-if" calculation with dollar result]**
4. **[Inflation/purchasing power note if relevant]**

---

### Important Notes
- Rates of [r1]%, [r2]%, and [r3]% are mathematical scenarios, not predictions or guaranteed returns
- Real investments fluctuate year to year -- actual growth will deviate from any constant-rate model
- These figures are nominal (before inflation). At [x]% inflation, $[FV] in [n] years buys what approximately $[real value] buys today
- Tax treatment of growth depends on account type [JURISDICTION: verify applicable rules]
- This is a mathematical demonstration of compounding, not a projection of any specific investment
```

---

## Rules

1. **Never assert a specific rate as "average," "typical," or "expected" for any asset class.** Stating that the stock market "averages 7%" is a simplification that glosses over sequence risk, recency bias, and index selection. Present rates as mathematical assumptions only.

2. **Never skip the step-by-step calculation for at least the first 2--3 periods.** Showing only the final table without the intermediate arithmetic defeats the educational purpose. The user must be able to trace every number.

3. **Always present at least three rate scenarios.** A single-rate projection creates false precision. Three scenarios (conservative, moderate, optimistic) convey the wide range of possible outcomes and prevent anchoring on one number.

4. **Always show the contributions-vs.-compounding breakdown at multiple time points, not just the endpoint.** The dynamic shift from "contributions-dominant" to "compounding-dominant" over time is the central educational insight. A single endpoint snapshot hides this progression.

5. **If the time horizon is under 5 years, explicitly state that compounding is not yet a dominant force.** Over 1--3 years, the compounding premium on a modest balance is a few hundred dollars at most. Do not imply compounding is magical for short horizons -- that misleads users and erodes trust.

6. **Always compute the "cost of waiting" in terms of equivalent extra monthly contributions needed to close the gap.** Expressing the delay cost only in dollars is abstract. Expressing it as "you'd need to contribute $X/month more to catch up" is actionable and memorable.

7. **Use monthly compounding as the default unless the user specifies otherwise.** Daily compounding exists but is exotic; annual compounding understates what most savings products deliver. Monthly compounding is the standard for savings accounts, CDs, and most investment projections.

8. **Round to whole dollars in all tables.** Sub-dollar precision implies false accuracy in a model using assumed constant rates. Exception: when showing a monthly interest calculation (e.g., $5,000 × 0.005 = $25.00), retain cents to make the arithmetic traceable.

9. **Never omit the inflation caveat, even if not asked.** A user who sees $300,000 as a final value and makes plans based on that figure without understanding inflation has been poorly served. A one-sentence note about purchasing power is mandatory on every output.

10. **If the user provides an assumed growth rate above 12%, calculate it without refusal but flag it prominently.** Rates above 12% sustained over decades are historically uncommon across broad market indices and are not achievable without commensurate risk. Calculate the requested scenario, then add a clearly labeled note explaining the historical context -- do not lecture at length, but do not omit the flag.

11. **Do not introduce investment product recommendations.** The output is about the mathematics of compounding, not about where to invest. Do not suggest ETFs, index funds, savings accounts, or any specific product. Redirect those questions to `portfolio-allocation-framework`.

12. **If the user provides inconsistent inputs (e.g., a 2-year horizon with $500/month to "see compounding"), acknowledge the math honestly.** Show the calculation but note clearly that 2 years produces minimal compounding effect regardless of rate and that the bulk of growth will be from contributions, not compounding.

---

## Edge Cases

### User Provides No Numbers
Ask for at minimum a starting amount (PV) and time horizon. A contribution amount is strongly preferred but optional -- some users are modeling a one-time lump sum. If the user wants a general concept explanation before sharing numbers, work through the canonical example: $1,000 starting, $100/month, 30-year horizon. Label it explicitly as a teaching illustration and invite the user to substitute their own figures. Do not invent numbers for the user and present them as if they were provided.

### User Is Asking About Debt Compounding Against Them
The formula is identical, but the framing, emotional valence, and recommended actions are completely different. Do not run a debt compounding scenario through this skill's full output format. Instead, apply the lump sum formula (no PMT term) to the debt balance, show how rapidly it grows without payments, and note that the same compounding power that builds wealth in savings destroys it in high-interest debt. Provide the calculation and recommend addressing the debt question in the context of a debt payoff plan. Do not suggest this is equivalent to investment compounding -- the asymmetry (tax treatment, rates, control) matters.

### Very Short Time Horizon (Under 3 Years)
Complete the calculation honestly. At 3 years, the compounding premium on $10,000 at 7% vs. simple interest is about $155 -- not nothing, but not transformational. Explicitly label the output: "Over [n] years, the primary driver of your balance growth is contributions ($[total contrib]) rather than compounding ($[growth]). Compounding becomes increasingly powerful beyond the 10-year mark." Do not refuse to run the numbers or imply the user is doing something wrong -- some users have short horizons for valid reasons.

### Very Long Time Horizon (Over 40 Years)
Results may appear implausibly large. A $300/month investment at 8% for 45 years produces a figure around $1.4 million in nominal terms. This is mathematically correct but requires extra contextualization: (1) inflation will significantly reduce the real purchasing power of that figure; (2) this assumes absolutely consistent contributions and rates with no interruptions; (3) the result is sensitive to the final years of compounding. Consider showing both nominal and real (inflation-adjusted) final values side-by-side for horizons over 30 years, even if the user did not ask.

### User Wants to Account for Inflation
Build two complete versions of the rate-comparison table: one nominal, one real. For the real table, reduce each rate by the user's stated inflation assumption. If the user has not specified an inflation assumption, use 2.5--3% as a range (common long-run central bank targets in many developed economies) and note that the actual rate is unknown. Use the Fisher Equation for precision: Real rate = (1 + nominal) / (1 + inflation) -- 1. For example, at 7% nominal and 3% inflation: (1.07/1.03) -- 1 = 3.88% real. Do not simply subtract inflation from the nominal rate; that is an approximation that becomes material at higher rates.

### User Provides an Assumed Rate Above 12%
Run the calculation as requested -- do not refuse. Add a clearly marked callout: "Note: A [rate]% sustained annual return is above the historical long-run nominal return of broad equity indices in most major markets. It may be achievable in specific asset classes, leveraged strategies, or certain historical windows, but carries substantially higher risk than lower-return scenarios. This calculation shows what the math produces -- not a prediction of what this rate will be achieved." Calculate using the exact doubling formula (t = ln(2)/ln(1+r)) rather than the Rule of 72 at these rates.

### User Asks "Which Account Type Should I Use?"
This falls outside this skill's scope. The compounding math is identical regardless of account type, but the tax treatment differs dramatically and changes the effective outcome. Compute the nominal growth scenario they asked about, then note: "The account type significantly affects the after-tax outcome of this growth. A Roth account allows this growth to accumulate without future tax; a traditional pre-tax account defers taxes to withdrawal; a taxable account incurs annual tax drag on gains and dividends. For help thinking through account selection, see `portfolio-allocation-framework`." Do not provide specific tax calculations here [JURISDICTION: verify].

### User's Contribution Amount Is Zero (Lump Sum Only)
The annuity term in the FV formula drops to zero. Use only FV = PV × (1 + r/12)^(12t). Acknowledge in the output that without ongoing contributions, the growth is entirely a function of the starting amount and the rate. Note that adding even a small monthly contribution amount -- the user can experiment with amounts -- dramatically accelerates the final value, particularly in early periods. Offer to run a follow-up scenario with a modest contribution amount to illustrate the difference if helpful.

---

## Example

**Input:** "I've saved $8,000 and can put in $300 a month. Show me how compound interest really works -- I want to see the math. Time horizon is 25 years."

**Output:**

---

## Compound Growth Analysis

### Your Numbers
| Parameter             | Value               |
|-----------------------|---------------------|
| Starting amount (PV)  | $8,000              |
| Monthly contribution  | $300/month          |
| Time horizon          | 25 years            |
| Compounding frequency | Monthly (12x/year)  |
| Rates modeled         | 4%, 7%, 10%         |
| Total months          | 300                 |

---

### How Compounding Works: The Core Mechanic

With simple interest, your $8,000 earns 7% of $8,000 every year -- a flat $560/year forever. With compound interest, you earn 7% on whatever the current balance is. Because the balance grows each period, the dollar amount of interest you earn grows with it -- and that growth accelerates over time. Here is what the first three months look like for your $8,000 at 7% annual (0.5833% per month):

- **Month 1:** $8,000 × 1.005833 = $8,046.67 (earned: $46.67)
- **Month 2:** $8,046.67 × 1.005833 = $8,093.61 (earned: $46.94 -- $0.27 more than month 1)
- **Month 3:** $8,093.61 × 1.005833 = $8,140.83 (earned: $47.22 -- more again)

That incremental increase seems tiny. Over 25 years, it becomes the engine behind nearly half your final balance.

---

### Step-by-Step Calculation at 7% (First 3 Years)

**The formula:**
FV = PV × (1 + r/12)^(12t) + PMT × [((1 + r/12)^(12t) -- 1) / (r/12)]

Monthly rate = 7% / 12 = 0.005833
Annuity factor for 12 months = ((1.005833)^12 -- 1) / 0.005833 = (1.072290 -- 1) / 0.005833 = 12.391

**Year 1:**
- Lump sum component: $8,000 × (1.005833)^12 = $8,000 × 1.07229 = $8,578
- Contribution component: $300 × 12.391 = $3,717
- **End of Year 1 total: $8,578 + $3,717 = $12,295**

**Year 2:**
- Lump sum component: $12,295 × 1.07229 = $13,183
- Contribution component: $300 × 12.391 = $3,717
- **End of Year 2 total: $13,183 + $3,717 = $16,900**

**Year 3:**
- Lump sum component: $16,900 × 1.07229 = $18,121
- Contribution component: $300 × 12.391 = $3,717
- **End of Year 3 total: $18,121 + $3,717 = $21,838**

Notice: the contribution component ($3,717) is constant each year -- it is always $300/month at the same rate. The lump sum component grows each year because the base grows. By year 3 it is adding $18,121 -- $16,900 = $1,221 from compounding alone on the accumulated balance, before any new contributions.

---

### Simple vs. Compound Interest
($8,000 at 7%, no additional contributions -- isolating the compounding effect)

| Year | Simple Interest   | Compound Interest  | Compounding Premium |
|------|------------------:|-------------------:|--------------------:|
| 1    | $8,560            | $8,578             | $18                 |
| 5    | $10,800           | $11,282            | $482                |
| 10   | $13,600           | $15,937            | $2,337              |
| 20   | $19,200           | $31,846            | $12,646             |
| 25   | $22,000           | $44,982            | $22,982             |

Over 25 years, compounding adds $22,982 to the lump sum alone -- more than double the starting amount -- compared to simple interest. This entire premium comes from earning interest on previously earned interest, applied to no new money beyond the original $8,000.

---

### Growth at Three Rates
(Starting: $8,000 | Monthly contribution: $300/month | Monthly compounding)

| Year   | At 4%      | At 7%       | At 10%      | 4% vs. 10% Gap |
|--------|----------:|------------:|------------:|---------------:|
| 5      | $24,516   | $26,167      | $27,940     | $3,424          |
| 10     | $43,951   | $51,530      | $61,060     | $17,109         |
| 15     | $66,644   | $87,348      | $117,437    | $50,793         |
| 20     | $93,182   | $138,491     | $214,073    | $120,891        |
| 25     | $124,289  | $211,561     | $380,830    | $256,541        |

A 6-percentage-point difference in annual return ($4% vs. 10%) produces a $256,541 difference in outcome over 25 years on the same contributions. This is the sensitivity of compounding to rate -- and why investors obsess over small differences in long-run return.

---

### Compounding Frequency Comparison
($8,000 at 7%, 25 years, no additional contributions)

| Compounding Frequency | Final Value | vs. Monthly |
|-----------------------|------------:|------------:|
| Annual (1x/year)      | $43,429     | --$1,553    |
| Monthly (12x/year)    | $44,982     | baseline    |
| Daily (365x/year)     | $45,176     | +$194       |

The difference between monthly and daily compounding is $194 over 25 years -- negligible. The difference between annual and monthly compounding is $1,553 -- noticeable but not dramatic for a $8,000 lump sum. For your full scenario with $300/month, monthly compounding is the appropriate and standard assumption.

---

### The Cost of Waiting
(Rate: 7% | Monthly contribution: $300/month)

| Scenario      | Years Invested | Total Contributions | Final Value  | Cost of Waiting |
|---------------|:--------------:|--------------------:|-------------:|----------------:|
| Start now     | 25 years       | $98,000             | $211,561     | --              |
| Delay 5 yrs   | 20 years       | $80,000             | $138,491     | --$73,070       |
| Delay 10 yrs  | 15 years       | $62,000             | $87,348      | --$124,213      |

Waiting just 5 years costs $73,070 in final value -- despite contributing only $18,000 less in total. The remaining $55,070 of that loss is compounding that simply never had time to occur. To make up the $73,070 cost of a 5-year delay, you would need to contribute approximately $574/month for the remaining 20 years instead of $300/month -- nearly double.

---

### Growth Breakdown: Contributions vs. Compounding
(Rate: 7% | $8,000 starting | $300/month)

**At Year 8 (roughly one-third of horizon):**
| Component                | Amount    | % of Total |
|--------------------------|----------:|-----------:|
| Starting principal       | $8,000    | 18.7%      |
| Contributions made       | $28,800   | 67.5%      |
| Growth from compounding  | $5,879    | 13.8%      |
| **Total**                | **$42,679** | **100%** |

**At Year 17 (roughly two-thirds of horizon):**
| Component                | Amount    | % of Total |
|--------------------------|----------:|-----------:|
| Starting principal       | $8,000    | 7.9%       |
| Contributions made       | $61,200   | 60.3%      |
| Growth from compounding  | $32,208   | 31.8%      |
| **Total**                | **$101,408** | **100%**|

**At Year 25 (full horizon):**
| Component                | Amount    | % of Total |
|--------------------------|----------:|-----------:|
| Starting principal       | $8,000    | 3.8%       |
| Contributions made       | $90,000   | 42.5%      |
| Growth from compounding  | $113,561  | 53.7%      |
| **Total**                | **$211,561** | **100%**|

Compounding's share of your total balance rises from 14% at year 8, to 32% at year 17, to 54% at year 25. By your final year, more than half of everything you have accumulated is money that came from compounding -- not from your contributions. You will contribute $90,000 over 25 years and compounding will add $113,561 on top. At the end, compounding is your largest single "contributor."

---

### Rule of 72: Doubling Your Starting $8,000

| Rate  | Exact Doubling Time | Rule of 72 Estimate | After 1st Double       | After 2nd Double       | After 3rd Double       |
|-------|:-------------------:|:-------------------:|:----------------------:|:----------------------:|:----------------------:|
| 4%    | 17.7 years          | 18.0 years          | $16,000 (yr 18)        | $32,000 (yr 36)        | $64,000 (yr 54)        |
| 7%    | 10.2 years          | 10.3 years          | $16,000 (yr 10)        | $32,000 (yr 20)        | $64,000 (yr 30)        |
| 10%   | 7.3 years           | 7.2 years           | $16,000 (yr 7)         | $32,000 (yr 15)        | $64,000 (yr 22)        |

At 7%, your $8,000 starting amount doubles to $16,000 in about 10 years and doubles again to $32,000 by year 20 -- well within your 25-year horizon. Note: these doublings apply to the starting lump sum only, not to the ongoing contribution stream. Your contribution stream has its own compounding dynamic reflected in the full growth tables above.

Tripling time at 7%: approximately 114 / 7 = 16.3 years. Your $8,000 triples to $24,000 around year 16.

---

### Key Takeaways for Your Situation

1. **Compounding becomes your dominant growth engine after year 17.** Before that, your $300/month contributions are the primary driver of balance growth. After year 17, the compounding on your accumulated balance outpaces what you're adding each month. You are on the right side of this crossover point within your 25-year horizon.

2. **Your most powerful lever right now is time, not rate.** A 5-year delay costs you $73,070 -- more impact than the difference between a 4% return and a 7% return over the full 25 years ($87,272). Starting and staying consistent matters more than optimizing returns, especially in the early years.

3. **What if you added $75/month more?** Increasing contributions from $300 to $375/month (an extra $75) produces a final value of approximately $240,453 at 7% -- an additional $28,892, entirely from the compounding on those extra contributions over 25 years. $75/month × 300 months = $22,500 extra contributed; compounding turns that into $28,892 extra at the end.

4. **Inflation matters at this horizon.** At 3% average inflation, $211,561 in 25 years buys what approximately $101,000 buys today. Your real purchasing power growth is closer to 4% annually (7% nominal -- 3% inflation), not 7%. This does not diminish the achievement -- it is still substantial real growth -- but it is essential context for planning.

---

### Important Notes
- The 4%, 7%, and 10% rates are mathematical scenarios, not predictions or guaranteed returns
- Real investments fluctuate significantly year to year -- actual balances will differ from any constant-rate projection, often substantially in individual years
- These figures are nominal (before inflation). At 3% inflation, $211,561 in 25 years has the purchasing power of roughly $101,000 in today's dollars
- Tax treatment of growth depends on account type [JURISDICTION: verify applicable rules -- Roth, traditional, and taxable accounts produce materially different after-tax outcomes]
- This is a demonstration of compounding mathematics, not a projection of returns from any specific investment or account
