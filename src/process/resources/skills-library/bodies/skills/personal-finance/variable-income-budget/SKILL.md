---
name: variable-income-budget
description: |
  Builds budgets for freelancers, gig workers, and commission earners with irregular monthly income. Uses a baseline income method to establish essential spending, creates a surplus allocation priority list, and produces a month-by-month budget that adapts to income fluctuations.
  Use when the user has irregular income from freelancing, commissions, seasonal work, or multiple gig sources and wants to budget despite income variability.
  Do NOT use for stable-income budgets (use budget-planning or fifty-thirty-twenty-budget), business revenue forecasting, or investment planning.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "budgeting personal-finance freelancing savings"
  category: "personal-finance"
  subcategory: "budgeting"
  depends: ""
  disclaimer: "educational-finance"
  difficulty: "intermediate"
---
# Variable Income Budget

> **Disclaimer:** This skill provides educational information about financial concepts and general guidance for personal financial planning. It does NOT constitute financial advice, investment recommendations, or tax guidance. Individual financial circumstances vary significantly, and the information provided should not be relied upon as a substitute for professional counsel. Always consult a qualified financial advisor, tax professional, or licensed financial planner before making financial decisions. Self-employment tax treatment varies by jurisdiction and individual situation -- consult a tax professional before making decisions based on any tax estimates provided here.

## When to Use

**Use this skill when any of the following are true:**
- The user earns income that fluctuates by more than 20% between months -- including freelancers, independent contractors, gig platform workers, commission-only sales roles, real estate agents, seasonal workers, creative professionals (photographers, designers, writers), and consultants
- The user explicitly says they do not know what they will earn next month and are trying to build a budget despite that uncertainty
- The user has transitioned within the past 12 months from a salaried or hourly wage role to self-employment or variable income and has not yet rebuilt their financial structure
- The user has multiple income streams of varying reliability (e.g., one retainer client, two project clients, and sporadic platform gig income) and needs a unified budgeting framework
- The user is experiencing financial stress specifically tied to income variability -- feast-or-famine cycles, spending everything in high months and struggling in low months
- The user asks how to handle taxes when income varies each month (overlap with tax set-aside guidance)
- The user wants to build a savings system or debt payoff plan despite not having a fixed monthly income

**Do NOT use this skill when:**
- The user has stable, predictable monthly income from a salary or consistent hourly wage -- use `budget-planning` or `fifty-thirty-twenty-budget` instead
- The user is building a cash flow model for a business entity, not personal finances -- use a business cash flow or revenue forecasting skill
- The user's only question is how to invest a lump sum or irregular windfall -- use an investing allocation skill
- The user only wants to track where money went without building a forward-looking budget -- use `expense-tracking-setup`
- The user's financial situation is acute (collections, imminent eviction, bankruptcy consideration) -- prioritize connecting them with a certified financial counselor or nonprofit credit counseling service before applying this framework
- The user earns a salary with a small, predictable bonus (less than 10% of total income) -- the salary is the budget base and the bonus is simply a windfall; this framework is unnecessary overhead
- The user wants tax-optimized retirement contribution strategies specific to self-employment structures -- use a self-employment retirement planning skill

---

## Process

### Step 1: Gather Income History and Classify Each Source

Before any calculation, build a complete picture of the user's income landscape. Incomplete data produces a misleading baseline.

- Ask for **monthly gross income totals for the last 6-12 months**. Six months is the minimum for a statistically meaningful baseline; 12 months captures seasonal patterns. If the user cannot produce exact numbers, help them reconstruct from bank statements, invoices, or platform payment histories.
- For each income source, collect four attributes: (1) the source name or type, (2) the income structure (hourly rate, project fee, platform gig, commission percentage, retainer), (3) the monthly dollar range (minimum and maximum observed), and (4) the payment lag -- the number of days between completing work and receiving payment. Payment lag is critical and often ignored; a developer who invoices net-30 effectively has income that arrives a month after it was earned.
- Classify each source by reliability tier:
  - **Tier 1 -- Highly reliable:** Monthly retainer clients, recurring contracts with guaranteed minimums, base salary component of a hybrid role. These can be counted on with high confidence.
  - **Tier 2 -- Moderately reliable:** Regular clients with project-based work, established platform income with consistent demand, commission roles where the pipeline is predictable.
  - **Tier 3 -- Sporadic:** New clients, one-time projects, referral-based work, seasonal platform demand, speculative proposals in progress.
- Flag immediately if any single source accounts for more than 60% of total income -- this triggers the concentration risk edge case.
- Ask whether any income sources have a contractual minimum (e.g., a retainer with a $2,000/month floor) -- these function more like salary and should be separated in the analysis.

### Step 2: Calculate the Baseline Income

The baseline income is the single most important number in this entire framework. It is the floor the user can budget against with confidence. Getting it wrong in either direction is costly: too high and the user overspends in bad months; too low and they systematically underspend and build unnecessary anxiety.

- **Standard baseline method:** Take the **lowest single month** from the most recent 6-month period. Do not average low months -- use the actual floor. This is deliberately conservative. The logic: a budget built to survive the worst recent month will survive any month as bad or better.
- **Adjustment for new freelancers (fewer than 6 months of data):** Use the lowest available month and subtract an additional 15-20% safety margin. A new freelancer's income is still volatile in ways that 3 months cannot capture. Example: lowest month was $3,200 -- baseline is $3,200 × 0.82 = $2,624.
- **Adjustment for strong seasonal patterns:** If the user has 12 months of data showing a clear seasonal cycle (e.g., a wedding photographer earning $8,000+ in summer and under $1,500 in January-February), the single-lowest-month method produces a baseline so low it cannot cover rent. Instead, calculate: total annual income ÷ 12 = monthly average. Use 70% of the monthly average as the baseline. This acknowledges that very lean months are predictable and fundable via a properly built buffer.
- **Calculate the average income separately:** Sum all available months and divide. This is the user's realistic planning income -- not the baseline. The gap between baseline and average tells you how much surplus typically flows through the priority list.
- **Calculate income volatility:** (Highest month -- Lowest month) ÷ Average month. A volatility ratio above 0.75 (75%) indicates extreme variability and warrants a larger income buffer target (3 months vs. 1-2 months).

### Step 3: Build the Baseline Budget

The baseline budget covers only what must be paid even in the worst income month. It is not a full spending plan -- it is a survival floor. Everything the user wants but does not strictly need belongs on the surplus priority list, not here.

- **Fixed obligations first:** Rent or mortgage payment, renter's or homeowner's insurance, minimum loan payments (student loans, auto loans, personal loans, credit cards), any subscription services that carry cancellation penalties or are essential to the work (professional software licenses, internet, phone). These amounts are exact and non-negotiable.
- **Essential variable expenses -- use lean estimates:** Groceries (use a realistic but not lavish weekly food budget; for single adults, $60-80/week is a reasonable lean estimate; for households, scale accordingly), transportation (gas and parking or public transit pass -- not restaurant delivery or rideshare convenience), basic personal care, and essential medications. Use averages from actual spending history if available, not aspirational amounts.
- **Tax reserve -- mandatory for self-employed users:** This is not optional and must be built into the baseline, not the surplus. The tax reserve must cover both income tax and self-employment tax. A widely used rule of thumb is 25-30% of net self-employment income (gross income minus business expenses) for US-based freelancers in moderate income brackets. For users in other jurisdictions, note that the specific rate varies and they should consult a tax professional -- but the principle of reserving a percentage every month is universal. Apply the tax reserve percentage to the **baseline income amount**, not to actual income each month (that calculation happens dynamically in Step 6). Do not skip this step because the user "plans to figure out taxes later" -- that is a path to a tax debt crisis.
- **Minimum savings contribution:** Even if it is $25-50/month, include it. The behavioral purpose outweighs the financial impact. A person who maintains a savings habit through lean months will increase it automatically in surplus months. A person who stops saving in lean months often stops saving entirely.
- **Baseline budget ceiling test:** Total all baseline budget line items. The sum must be less than or equal to the baseline income. If it exceeds the baseline income, the user has a structural deficit. Do not paper over this -- address it directly. Options: (1) find specific line items to reduce, (2) identify whether any expenses can be renegotiated (e.g., call service providers, negotiate rent, refinance debt to lower the minimum payment), or (3) acknowledge that the current baseline income is genuinely insufficient and the priority is increasing it.
- **Compute the baseline surplus:** Baseline income minus baseline budget total. Even in the worst recent month, there may be a small surplus. This flows to Priority 1 on the surplus list.

### Step 4: Build the Surplus Allocation Priority List

The surplus priority list is the engine that transforms variable income from chaos into a structured system. Every dollar above baseline is pre-assigned before it arrives. This eliminates the most dangerous behavior in variable-income earners: spending a high-income month as if it represents permanent prosperity.

Construct the list in this specific order. The user may adjust amounts within each tier, but the tier ordering should not be reversed without strong justification.

**Priority 1 -- Income Buffer Fund:**
- Purpose: to cover months where income falls below the baseline budget. This is not an emergency fund -- it is a cash flow smoothing mechanism specific to variable income. These are separate accounts serving different functions.
- Target amount: 1-2 months of baseline budget total for users with income volatility below 75%; 2-3 months for users with volatility above 75% or single-client concentration risk.
- Replenishment rule: any time the buffer is drawn down, it becomes Priority 1 again until fully restored.
- Until the buffer reaches its target, it absorbs the majority of every surplus dollar.

**Priority 2 -- Additional Tax Reserve:**
- The baseline budget already includes a tax reserve calculated on baseline income. When income exceeds baseline, that additional income also generates tax liability. In the surplus allocation, add the same reserve percentage (25-30%) to the surplus amount going to the tax reserve account.
- Maintain the tax reserve in a separate savings account labeled for taxes only. Do not commingle with the income buffer. Treat quarterly estimated tax payment dates (if applicable in the user's jurisdiction) as a hard calendar constraint.

**Priority 3 -- Emergency Fund:**
- Distinct from the income buffer. The emergency fund covers true unexpected events: medical expenses, car breakdown, job loss event. Standard target: 3-6 months of baseline expenses.
- If the income buffer is fully funded, the emergency fund becomes the next highest priority because variable-income earners face compounded risk -- not just income drops, but unexpected expenses while income is also volatile.

**Priority 4 -- High-Interest Debt Acceleration:**
- Extra payments above the minimums already in the baseline budget. Target highest-interest-rate debts first (avalanche method). Once a debt is cleared, redirect its allocation to the next highest-rate debt. Do not add debt acceleration to the priority list until Priorities 1-3 are at least partially established, because doing so while the buffer is unfunded exposes the user to a debt-financed shortfall in low months.

**Priority 5 -- Specific Savings Goals:**
- Income-producing equipment, professional development, tax-advantaged retirement contributions (self-employed individuals often have access to SEP-IRA or solo 401(k) type structures -- consult a tax professional), a home down payment fund, vacation, or any other named goal. Each goal should have a specific dollar target and a target date so the required monthly contribution is calculable.

**Priority 6 -- Discretionary Lifestyle Spending:**
- Whatever remains after Priorities 1-5 are funded is available for restaurants, entertainment, clothing, subscriptions, and personal enjoyment. This is not a luxury -- it is the reward mechanism that makes the system sustainable. If a good month produces zero discretionary money, the user will abandon the system. Size this so that strong months feel good.

**Construct each priority line with:**
- A specific dollar amount or percentage rule (not just "some money")
- A target balance or end state (not open-ended)
- A time estimate for reaching the target at current surplus rates

### Step 5: Establish the Income Buffer Fund Mechanics

The income buffer is the structural innovation that makes variable-income budgeting work. It deserves its own step because the mechanics of using and replenishing it matter as much as building it.

- **Location:** A separate savings account from the primary checking and emergency fund. Label it explicitly (e.g., "Income Smoothing Buffer" or "Revenue Buffer"). The psychological barrier of a separate account reduces the temptation to spend it. High-yield savings accounts are appropriate for this purpose -- they preserve liquidity while earning more than a standard savings account.
- **Drawdown rule:** The buffer is accessed only when confirmed income for the current month is below the baseline budget total. The transfer amount is precisely the shortfall (baseline budget total minus income received). Do not transfer more than the shortfall.
- **Tracking rule:** Maintain a simple running log: opening balance, current month contribution or withdrawal, closing balance, months of coverage remaining. Review this every single month -- not quarterly, not annually. Monthly.
- **Partial month income:** Some users receive income in lumps mid-month or at month end. For these users, the 1st-of-month budget-building step should use **confirmed received income plus conservatively estimated remaining income**. If a payment is overdue by more than 15 days, exclude it from this month's income and count it only when received.
- **Buffer refill priority:** After drawing down the buffer, replenishing it takes absolute Priority 1 status -- ahead of even the tax reserve additional contribution -- because an empty buffer makes the whole system structurally vulnerable.

### Step 6: Design the Monthly Budget-Building Ritual

Variable income requires a monthly budget-building ritual rather than a set-it-and-forget-it annual plan. The ritual must be quick enough to maintain but rigorous enough to be accurate. Target: 20-30 minutes once a month.

- **Day 1-3 of the month:** Determine the month's income base. Add: all payments confirmed received in the current month so far + all invoices due this month with high confidence of payment (Tier 1 and strong Tier 2 sources) + any retainer or recurring payments expected. Exclude Tier 3 speculative income entirely -- treat it as a bonus if it arrives.
- **Decision branch:** If estimated income is at or below the baseline -- implement the baseline budget. Transfer the exact shortfall from the income buffer if income is below the baseline budget total. Spend nothing from the surplus priority list this month.
- **Decision branch:** If estimated income exceeds the baseline -- implement the baseline budget and then work down the surplus priority list with the excess, calculating each allocation in order.
- **Day 14-16 mid-month checkpoint:** Have expected payments arrived? If a significant payment (more than 15% of monthly income) is delayed, downgrade the month's income estimate and adjust surplus allocations accordingly. This prevents spending surplus money that has not actually arrived.
- **Last day of the month:** Record actual income received. Compare to estimate. Compute actual surplus or shortfall. Update the buffer fund balance. Carry forward any unallocated surplus or note any buffer draw. Note the income figure for next month's 6-month rolling history update.
- **Rolling history update:** Every month, add the new month's income to the tracking spreadsheet and drop the oldest month if you are maintaining a 6-month window. Recalculate the baseline annually or after any major income structure change (new anchor client, loss of a major client, new gig platform, rate increase).

### Step 7: Identify and Communicate the Income Trajectory

Beyond the mechanical budget, help the user understand what their income data actually reveals -- this context makes the budget feel purposeful rather than restrictive.

- Calculate the **month-over-month trend:** Is income growing, stable, or declining over the available period? A growing trend suggests the baseline will become less constraining over time. A declining trend is a signal to address income generation, not just spending management.
- Calculate how long it will take to fully fund the income buffer at the current average surplus rate. This gives the user a concrete milestone date.
- Calculate when Priority 3 (emergency fund) will be fully funded. When both the buffer and emergency fund are funded, the user's financial resilience improves dramatically -- name this as a milestone.
- Flag if the gap between baseline and average is very small (less than 20%). A small surplus spread means little room for the priority list to function. The user either needs to reduce baseline expenses or increase income to create more surplus capacity.

---

## Output Format

Produce the output in the following structure. Use actual numbers from the user's data throughout -- never leave placeholder values unfilled.

```
## Variable Income Budget

### Income Analysis
| Metric                          | Amount      |
|---------------------------------|-------------|
| Lowest month (last 6-12)        | $X,XXX      |
| Highest month (last 6-12)       | $X,XXX      |
| Average monthly income          | $X,XXX      |
| Income volatility ratio         | XX%         |
| **Baseline income**             | **$X,XXX**  |
| Baseline budget total           | $X,XXX      |
| Baseline surplus (to Priority 1)| $XXX        |

### Income Sources
| Source              | Type         | Monthly Range     | Reliability | Payment Lag |
|---------------------|-------------|-------------------|-------------|-------------|
| [Source name]       | [Type]      | $X,XXX--$X,XXX   | [Tier 1/2/3]| [X days]    |
| [Source name]       | [Type]      | $X,XXX--$X,XXX   | [Tier 1/2/3]| [X days]    |

[Flag if any source > 60% of income: "Concentration risk: [Source] represents [XX]% of income. Buffer target increased to 3 months."]

### Baseline Budget (Built on $X,XXX baseline income)
*This budget applies every month, regardless of income level.*

| Category            | Monthly Amount | Category Type | Notes                       |
|---------------------|---------------|---------------|-----------------------------|
| Rent / Mortgage     | $X,XXX        | Fixed         | Lease/mortgage obligation   |
| Utilities           | $XXX          | Essential Var | Based on [X-month average]  |
| Groceries           | $XXX          | Essential Var | Lean household estimate     |
| Transportation      | $XXX          | Essential Var | Gas / transit -- no extras  |
| Phone               | $XXX          | Fixed         | Work-essential              |
| Insurance           | $XXX          | Fixed         | [Type of coverage]          |
| [Loan name] minimum | $XXX          | Fixed         | Minimum only; extra in P4   |
| Tax Reserve ([XX]%) | $XXX          | Essential     | [XX]% of $X,XXX baseline    |
| Minimum savings     | $XX           | Essential     | Habit maintenance           |
| **Baseline Total**  | **$X,XXX**    |               | Must be ≤ $X,XXX baseline   |
| **Baseline Surplus**| **$XXX**      |               | Flows to Priority 1         |

### Surplus Allocation Priority List
*Applied when monthly income > $X,XXX. Allocate surplus in strict priority order.*
*Surplus = Monthly income received -- $X,XXX (baseline budget total)*

| Priority | Category               | Allocation Rule              | Target Balance    | Est. Months to Fund |
|----------|------------------------|------------------------------|-------------------|---------------------|
| 1        | Income Buffer Fund     | First $XXX / [XX]% of surplus| $X,XXX ([X] mo)  | ~[X] months         |
| 2        | Additional Tax Reserve | [XX]% of remaining surplus   | Quarterly payment | Ongoing             |
| 3        | Emergency Fund         | Next $XXX of surplus         | $X,XXX ([X] mo)  | ~[X] months         |
| 4        | [Debt name] Extra Pmt  | Next $XXX of surplus         | Payoff by [date] | ~[X] months         |
| 5        | [Named savings goal]   | Next $XXX of surplus         | $X,XXX for [goal]| ~[X] months         |
| 6        | Lifestyle Discretionary| Remainder                    | No target         | --                  |

### Monthly Budget Application

**Scenario A -- Income at or below baseline ($X,XXX or less):**
- Implement baseline budget only
- Calculate shortfall: $X,XXX (baseline budget total) -- [income received]
- Transfer shortfall from Income Buffer Fund
- Zero surplus allocation this month
- Note the buffer drawdown and make it Priority 1 next month

**Scenario B -- Income above baseline (example: $X,XXX):**

| Line                             | Amount    |
|----------------------------------|-----------|
| Monthly income received          | $X,XXX    |
| Minus baseline budget            | ($X,XXX)  |
| **Total surplus to allocate**    | **$X,XXX**|

| Priority | Category               | Amount Allocated | Running Surplus Remaining |
|----------|------------------------|-----------------|---------------------------|
| 1        | Income Buffer Fund     | $XXX            | $X,XXX                    |
| 2        | Additional Tax Reserve | $XXX            | $X,XXX                    |
| 3        | Emergency Fund         | $XXX            | $XXX                      |
| 4        | [Debt] Extra Payment   | $XXX            | $XXX                      |
| 5        | [Savings Goal]         | $XXX            | $XXX                      |
| 6        | Lifestyle Spending     | $XXX            | $0                        |
| **Total**| --                     | **$X,XXX**      | $0                        |

### Income Buffer Fund Tracker
| Metric                          | Value      |
|---------------------------------|------------|
| Target balance                  | $X,XXX     |
| Current balance (starting)      | $X,XXX     |
| Months of coverage              | X.X months |
| Months to reach target          | ~X months  |
| Drawdown trigger                | Income < $X,XXX |
| Drawdown amount                 | Exactly the shortfall only |
| Replenishment priority          | Priority 1 until restored |

### Monthly Ritual Checklist
- [ ] **Day 1-3:** Total confirmed + high-confidence expected income for this month
- [ ] **Day 1-3:** Compare to baseline ($X,XXX) -- determine Scenario A or B
- [ ] **Day 1-3:** If Scenario B, work down priority list and pre-assign each surplus dollar
- [ ] **Day 1-3:** Transfer tax reserve to dedicated tax account
- [ ] **Day 14-16:** Mid-month check -- have expected payments arrived? Revise if major payment delayed 15+ days
- [ ] **Day 14-16:** If downgraded to Scenario A, reverse surplus allocations that have not left the account
- [ ] **Last day:** Record actual income received
- [ ] **Last day:** Update buffer fund balance
- [ ] **Last day:** Add this month to 6-12 month rolling income log; recalculate baseline if any source changed significantly

### Key Milestones
| Milestone                        | Target Date  | Notes                                |
|----------------------------------|-------------|--------------------------------------|
| Income Buffer fully funded       | [Month/Year]| Eliminates income-drop stress        |
| Emergency Fund fully funded      | [Month/Year]| Full financial resilience established|
| [Debt] paid off                  | [Month/Year]| Frees $XXX/month from baseline budget|
| Baseline budget < 70% of average | [Month/Year]| System has ample surplus capacity    |
```

---

## Rules

1. **Always present the disclaimer before any financial guidance.** No exceptions -- the tax and investment components of this skill touch areas where individual circumstances create dramatically different outcomes.

2. **The baseline income is always the lowest single month from the most recent 6-month window -- not the average, not the median, not a blend.** The only exception is the seasonal adjustment described in Step 2 for users with documented strong seasonal patterns and 12 months of data, in which case the baseline is 70% of the monthly average.

3. **The baseline budget total must never exceed baseline income.** If it does, this is a structural deficit that must be resolved before proceeding. Do not round numbers favorably, do not assume income will increase, and do not add discretionary items to close the gap. Present the shortfall explicitly and help the user identify which expenses to reduce or which minimums to renegotiate.

4. **The tax reserve line belongs in the baseline budget, not the surplus list.** Self-employed users who pay taxes only from surplus will underpay in high months and have nothing reserved in low months. The baseline tax reserve, calculated on baseline income, must be present even in the worst month.

5. **The Income Buffer Fund is always Priority 1 on the surplus list.** It may never be moved below Priority 2. Without a funded buffer, the entire system collapses on the first below-baseline month and the user is forced into debt or emergency fund depletion to cover routine expenses.

6. **The income buffer fund and the emergency fund are separate accounts serving different purposes.** Never combine them, never suggest combining them. The buffer covers predictable income shortfalls in the normal course of variable income work. The emergency fund covers unpredictable life events. Conflating them strips the user of protection in both scenarios.

7. **Exclude speculative (Tier 3) income from the monthly income estimate.** Count only confirmed received payments and high-confidence Tier 1/2 invoices due this month. Speculative income is treated as a windfall when it arrives, not as projected income. Counting it before receipt causes the user to spend money they do not yet have.

8. **Flag single-source income concentration above 60% explicitly.** This is a financial risk that the budget cannot solve on its own -- it must be named. Adjust the buffer target to 3 months minimum and recommend income diversification as a named financial goal.

9. **Never describe variable income as "unstable," "unreliable," or a problem to be fixed.** Variable income is a structural characteristic to be managed with appropriate systems. Language matters: freelancers and gig workers who internalize the idea that their income is inherently broken tend to underinvest in proper financial structure. The system being built here is not a workaround -- it is the correct system for their income type.

10. **The budget must be rebuilt each month from actual income, not rolled forward from the prior month.** A prior month's surplus allocation does not carry into the current month's baseline. Each month is evaluated independently against the baseline and the priority list is applied to that month's specific surplus. This prevents the system from drifting based on a good month that does not repeat.

11. **Payment lag must be accounted for in the monthly income estimate.** A user who completes $5,000 of work in October but invoices net-30 will receive that money in November. If this is not tracked, October appears to be a $0 month and November appears artificially inflated. Help the user understand whether their income tracking is on a cash basis (when received) or accrual basis (when earned) -- the baseline budget must be built on the cash basis because that is when money is actually available.

12. **Do not recommend specific financial institutions, savings account products by brand, or investment vehicles by name.** Describe the account type and characteristics (e.g., "a high-yield savings account that is separate from your main checking account") without naming specific providers.

---

## Edge Cases

### New Freelancer with Fewer than 4 Months of Income Data

A user who has been freelancing for 2-3 months has data that cannot produce a reliable baseline -- early freelance income is often unrepresentative of the medium-term pattern because the user is still building a client pipeline.

**Handling:**
- Use whatever data exists. Take the lowest month and reduce it by 20% as a safety margin. Be explicit: "This baseline will likely need to be revised at the 6-month mark."
- Build the baseline budget especially conservatively -- only non-negotiable fixed costs and genuine essentials. This is a transitional budget, not a permanent one.
- Make building a 6-month income history the explicit Priority 0 goal, before any surplus allocation decisions are finalized.
- If the user came from a salaried role, the prior salary provides context but not a baseline -- it is not relevant to what their freelance income will be.
- Set a 6-month calendar reminder (explicitly tell the user) to revisit and recalculate the baseline with full data.

### Single Client Concentration (One Client > 60% of Income)

This is simultaneously a financial planning issue and an income risk issue. The budget must reflect the actual risk, not suppress it.

**Handling:**
- Flag the concentration prominently in the Income Sources table.
- Increase the income buffer target to 3 months of baseline expenses (not 2).
- Add "Income Diversification" as a named Priority 5 savings goal -- this might fund: time to pursue new clients, professional development to enter adjacent markets, or marketing spend. The budget is acknowledging that resilience requires spending on income development.
- In the Income Sources table, show two scenarios: (1) what income looks like if the anchor client is retained, (2) what baseline income would be if the anchor client were lost tomorrow. This is not alarmist -- it is the data the user needs to see.
- Do not eliminate the framework -- the user still needs a budget. But add the concentration risk note to the Key Milestones section with a target to reduce reliance to below 50% within 12-18 months.

### Seasonal Worker with Predictable High/Low Cycles

A user earning $9,000/month from May-September and $800-1,200/month from October-April (e.g., a landscaper, a ski instructor, a tour guide) cannot use the standard lowest-month baseline because it is so low it covers almost nothing.

**Handling:**
- Calculate true annual income and divide by 12 to get the real monthly average.
- Apply the seasonal baseline method: baseline = 70% of the monthly average.
- Build one baseline budget using this blended baseline.
- Identify the lean-season income floor (the actual monthly income during the low months, typically around $800-1,500 for strong seasonal workers).
- The income buffer target must cover the full lean-season shortfall: (baseline budget total -- lean-season income) × number of lean months. Example: baseline budget of $3,000, lean-season income of $1,000, lean season is 7 months -- buffer target is $2,000 × 7 = $14,000.
- The entire high-season surplus strategy revolves around funding this buffer before anything else, because it is the mechanism that keeps the user solvent for 7 months.
- This is a materially different buffer target than the 1-3 month standard. Make the math explicit and show the user exactly how many high-season months of aggressive saving are required to fund the lean season.

### User Has Both Stable and Variable Income Streams

A user with, for example, a part-time employed role ($1,800/month guaranteed) plus freelance income ($0-$4,000/month variable) has a structural advantage that simplifies the framework considerably.

**Handling:**
- Separate the income into two explicit layers.
- **Layer 1 (Stable):** The $1,800/month guaranteed income funds as much of the baseline budget as it can. This portion of the baseline does not require a buffer.
- **Layer 2 (Variable):** The freelance income covers the remainder of the baseline budget if Layer 1 is insufficient, and any excess flows to the surplus priority list.
- Calculate the residual baseline need: baseline budget total minus Layer 1 income. If Layer 1 covers 100% of the baseline budget, then every freelance dollar goes directly to the surplus priority list -- a significantly more powerful position.
- The income buffer only needs to cover the residual baseline need not funded by Layer 1. This reduces the buffer target substantially.
- Present both the combined and separated view so the user understands the role each income stream plays.

### Baseline Budget Exceeds Baseline Income (Structural Deficit)

If the user's baseline budget -- even stripped to absolute essentials -- exceeds their baseline income, this is a structural deficit. The budget cannot be made to work without intervention.

**Handling:**
- Do not soften or avoid this finding. State it directly: "At your current baseline income of $X, your essential expenses of $Y exceed what your income can cover in your worst recent months. This requires action beyond budgeting."
- Work through each baseline expense line and identify:
  - What is fixed and truly non-negotiable (lease with penalty, insurance, minimum loan payments)
  - What is fixed but potentially renegotiable (call internet provider, ask landlord about a temporary reduction, explore refinancing a loan to lower the minimum payment)
  - What is essential but sized conservatively vs. actually lean (groceries -- is there further room? Transportation -- any cuts possible?)
- If the deficit cannot be closed through expense reduction, the options are: (1) increase income floor (take on retainer client, find base-pay component work, add a stable part-time role), (2) reduce debt minimums through consolidation, (3) access community resources if the deficit represents genuine hardship, or (4) consult a nonprofit credit counseling service.
- Offer to proceed with a budget based on the user's actual income even if it means some baseline expenses are temporarily unpaid -- this creates a clearer picture of the shortfall than pretending the budget balances.

### User Has Significant Invoice Non-Payment Risk

Some freelancers -- particularly those who work with small business clients or who do not use contracts -- experience non-payment at a rate that materially affects their income. If the user mentions unpaid invoices, slow-paying clients, or payment disputes as a recurring pattern, the standard framework needs adjustment.

**Handling:**
- Ask how much of their average monthly invoiced revenue is actually collected. If the collection rate is below 90%, the effective income is lower than the raw figures suggest.
- Adjust the income history analysis to use collected income, not invoiced income.
- Recommend, as part of the financial system (not just legal advice), contract use and deposit or milestone payment structures as practical tools that improve payment reliability. This is financial system design, not legal guidance.
- Increase the income buffer to compensate for non-payment variance until payment reliability improves.

### User Received a Large One-Time Payment That Skews Income History

A user who received a $20,000 project payment in one month will have a distorted income history if that month is included in the 6-month baseline calculation. Including it inflates the average but does not change the floor.

**Handling:**
- The standard lowest-month baseline is not affected by one outlier high month -- the baseline calculation correctly ignores it.
- However, the average income will be inflated, which can mislead surplus allocation projections. Note explicitly: "Your $X,XXX month in [month] was a one-time project. Excluding it, your average income is approximately $Y -- a more representative figure for projecting monthly surplus."
- Do not use the outlier month as evidence that the user's income is robust. It is a single data point, not a trend.
- If the user is considering spending the windfall based on the elevated average, reframe: suggest treating the one-time payment as a surplus allocation opportunity -- running the entire amount through the priority list from Priority 1 down.

---

## Example

**Input:**
"I'm a freelance UX designer. My income over the last 8 months was: $2,800, $5,400, $4,100, $6,900, $3,200, $7,800, $4,500, $5,200. Most of my work comes from two regular clients -- one pays me a monthly retainer of about $2,500, and the other gives me projects whenever they have them (usually every other month or so). I also pick up occasional one-off projects from referrals. My fixed costs are: rent $1,550, car insurance $130, phone $80, and I have a credit card minimum of $95 and a personal loan minimum of $180. I also spend about $400 on groceries, $180 on gas, and roughly $220 on software subscriptions I need for work. I'm self-employed. I want to stop spending everything in a good month and then panicking in a slow month."

**Output:**

## Variable Income Budget

> **Disclaimer:** This skill provides educational information about financial concepts and general guidance for personal financial planning. It does NOT constitute financial advice, investment recommendations, or tax guidance. Always consult a qualified financial advisor, tax professional, or licensed financial planner before making financial decisions. Tax estimates below are illustrative only and specific to no jurisdiction -- verify your actual self-employment tax obligations with a tax professional.

---

### Income Analysis
| Metric                           | Amount      |
|----------------------------------|-------------|
| Period analyzed                  | 8 months    |
| Lowest month                     | $2,800      |
| Highest month                    | $7,800      |
| Average monthly income           | $4,988      |
| Income volatility ratio          | (7,800 -- 2,800) ÷ 4,988 = **100%** |
| **Baseline income**              | **$2,800**  |
| Baseline budget total            | $2,587      |
| Baseline surplus (to Priority 1) | $213        |

**Volatility note:** A 100% volatility ratio is high. This means your best month earns nearly three times your worst month. This is manageable with the right structure -- but it means the income buffer needs to be funded to 2-3 months of baseline expenses, and the system must be followed consistently. Your average monthly income ($4,988) is significantly better than your floor -- that gap is where the surplus priority system does its work.

---

### Income Sources
| Source                      | Type       | Monthly Range      | Reliability | Payment Lag  |
|-----------------------------|-----------|---------------------|-------------|--------------|
| Anchor retainer client      | Retainer  | ~$2,500/month       | Tier 1      | Net-15 typical |
| Project client (Client B)   | Project   | $0--$3,500/month   | Tier 2      | Net-30 typical |
| Referral / one-off projects | Project   | $0--$2,000/month   | Tier 3      | Varies         |

**Concentration risk flag:** Your retainer client represents approximately 50% of your average monthly income -- just below the 60% threshold. This is worth watching. If the retainer were cancelled, your income floor would drop to near $0 in any month without a project. Building your income buffer to 3 months (rather than the standard 2) accounts for this risk while you continue diversifying your client base.

---

### Baseline Budget (Built on $2,800 baseline income)
*This budget applies every month, regardless of how much you earn. It is the floor your income can reliably cover.*

| Category                   | Monthly Amount | Category Type  | Notes                              |
|----------------------------|---------------|----------------|------------------------------------|
| Rent                        | $1,550        | Fixed          | Lease obligation                   |
| Car insurance               | $130          | Fixed          | Required coverage                  |
| Phone                       | $80           | Fixed          | Work-essential communication       |
| Work software subscriptions | $220          | Fixed          | Essential to income generation     |
| Credit card minimum         | $95           | Fixed          | Minimum only -- extra goes to P4   |
| Personal loan minimum       | $180          | Fixed          | Minimum only -- extra goes to P4   |
| Groceries                   | $400          | Essential Var  | Household food, lean estimate      |
| Gas / transportation        | $180          | Essential Var  | Work and essential errands only    |
| Tax reserve (27%)           | $756          | Essential      | 27% of $2,800 baseline             |
| Minimum savings             | $50           | Essential      | Habit maintenance -- never skip    |
| **Baseline Budget Total**   | **$3,641**    |                | --                                 |

**Problem identified:** Your baseline budget total of $3,641 exceeds your baseline income of $2,800 by $841. This is a structural shortfall in your worst-case month.

**What this means in practice:** Your lowest month ($2,800) was October. In a month like that, even essential expenses cannot all be covered from income alone. The income buffer fund is not optional for you -- it is the mechanism that makes your budget functional in those months.

**Tax reserve note:** The $756 estimate uses 27% of baseline income as a proxy for self-employment income tax and national insurance / self-employment tax obligations. This is a rough estimate only. Your actual tax obligation depends on your jurisdiction, allowable deductions, and filing status. Consult a tax professional to determine the correct reservation percentage for your situation.

**Recommended immediate actions:**
1. Confirm your baseline budget against your actual monthly statements. If your groceries or gas can be trimmed without meaningful life impact, reducing even $100-200 here helps.
2. Call your personal loan servicer and ask whether a lower minimum payment is available through income-based adjustment or refinancing. Reducing the minimum does not prevent you from paying more in surplus months.
3. Accept that the income buffer must be built as the top financial priority until it covers 3 months of baseline expenses ($3,641 × 3 = $10,923).

---

### Surplus Allocation Priority List
*Applied when monthly income exceeds $3,641 (your baseline budget total). Allocate every surplus dollar in strict priority order before spending anything discretionary.*

| Priority | Category                  | Allocation Rule                       | Target Balance       | Est. Months to Fund     |
|----------|---------------------------|---------------------------------------|----------------------|-------------------------|
| 1        | Income Buffer Fund        | First $800 of surplus, then 50% of remaining | $10,923 (3 months)| ~18 months at avg surplus |
| 2        | Additional Tax Reserve    | 27% of all surplus after Priority 1   | Ongoing (quarterly)  | Ongoing                 |
| 3        | Emergency Fund            | $300/month from surplus after P1+P2   | $10,923 (3 months baseline) | ~36+ months (starts after buffer) |
| 4        | Credit card extra payment | $150/month from surplus after P1-P3   | Full payoff          | Depends on balance      |
| 5        | Personal loan extra pmt   | $100/month from surplus after P1-P4   | Full payoff          | Depends on balance      |
| 6        | Professional development  | $75/month from surplus after P1-P5    | Rolling $900/year    | Ongoing                 |
| 7        | Lifestyle discretionary   | Remainder                             | No target            | --                      |

**Note on Priorities 4 and 5:** Provide your credit card and personal loan balances and interest rates, and the order of these can be refined using the debt avalanche method (highest rate first). The allocations above assume the credit card carries a higher interest rate.

---

### Monthly Budget Application

**Scenario A -- Income at or below $3,641:**
Apply the baseline budget. Transfer the exact shortfall from your Income Buffer Fund. Do not allocate anything to the surplus priority list this month. Note the drawdown and elevate buffer replenishment back to Priority 1 next month.

Example: Income received = $2,800.
Shortfall = $3,641 -- $2,800 = $841.
Transfer $841 from buffer. Buffer decreases by $841. Budget covered.

---

**Scenario B -- Income above $3,641:**

Let's build your budget for a $5,200 month (representative of a moderate-good month):

| Line                              | Amount     |
|-----------------------------------|------------|
| Monthly income received           | $5,200     |
| Minus baseline budget total       | ($3,641)   |
| **Surplus to allocate**           | **$1,559** |

| Priority | Category                     | Amount Allocated | Calculation                          | Running Surplus Remaining |
|----------|------------------------------|-----------------|--------------------------------------|---------------------------|
| 1        | Income Buffer Fund           | $800            | First $800 of surplus                | $759                      |
| 2        | Additional Tax Reserve       | $205            | 27% of $759 remaining                | $554                      |
| 3        | Emergency Fund               | $300            | Fixed $300/month rule                | $254                      |
| 4        | Credit Card Extra Payment    | $150            | Fixed $150/month rule                | $104                      |
| 5        | Personal Loan Extra Payment  | $100            | Fixed $100/month rule                | $4                        |
| 6        | Professional Development     | $4              | Remainder before lifestyle (partial) | $0                        |
| 7        | Lifestyle Discretionary      | $0              | Nothing left this month              | $0                        |
| **Total**| --                           | **$1,559**      | --                                   | $0                        |

**Observation:** A $5,200 month -- nearly $1,200 above your average -- leaves zero for discretionary spending because your buffer is unfunded. This is temporary. Once the buffer reaches $10,923 (approximately 18 months at this allocation rate), Priority 1 drops and lifestyle spending becomes available in every surplus month.

---

Now the same calculation for a strong $7,800 month (your highest):

| Line                              | Amount     |
|-----------------------------------|------------|
| Monthly income received           | $7,800     |
| Minus baseline budget total       | ($3,641)   |
| **Surplus to allocate**           | **$4,159** |

| Priority | Category                     | Amount Allocated | Calculation                          | Running Surplus Remaining |
|----------|------------------------------|-----------------|--------------------------------------|---------------------------|
| 1        | Income Buffer Fund           | $800 + 50% × $3,359 = $2,480 | P1 rule applied    | $1,679                    |
| 2        | Additional Tax Reserve       | $453            | 27% of $1,679                        | $1,226                    |
| 3        | Emergency Fund               | $300            | Fixed $300/month                     | $926                      |
| 4        | Credit Card Extra Payment    | $150            | Fixed $150/month                     | $776                      |
| 5        | Personal Loan Extra Payment  | $100            | Fixed $100/month                     | $676                      |
| 6        | Professional Development     | $75             | Fixed $75/month                      | $601                      |
| 7        | Lifestyle Discretionary      | $601            | Remainder                            | $0                        |
| **Total**| --                           | **$4,159**      | --                                   | $0                        |

**A strong month gives you $601 in discretionary spending** after building the buffer aggressively and covering all financial priorities. This is the reward for following the system -- strong months feel good again because the spending is intentional rather than default.

---

### Income Buffer Fund Tracker
| Metric                        | Value           |
|-------------------------------|-----------------|
| Target balance                | $10,923 (3 months of baseline budget) |
| Current balance               | $0 (starting)   |
| Months of coverage at target  | 3.0 months      |
| Buffer drawdown trigger       | Income < $3,641 |
| Drawdown amount rule          | Exact shortfall only -- not more |
| Replenishment rule            | Priority 1 status until fully restored |
| Estimated months to target    | ~14-18 months at average surplus pace |
| Recommended account type      | Separate savings account, easily accessible but not linked to debit card for impulse transfers |

---

### Key Milestones
| Milestone                              | Approximate Date      | What Changes                              |
|----------------------------------------|-----------------------|-------------------------------------------|
| Income Buffer at 1 month ($3,641)      | Month 5-6             | First month of real buffer protection     |
| Income Buffer at 3 months ($10,923)    | Month 14-18           | P1 drops; lifestyle budget opens significantly |
| Emergency Fund at 1 month ($3,641)     | Month 20-24           | Second layer of protection established    |
| Credit card fully paid                 | Depends on balance    | Frees $95/month from baseline budget      |
| Personal loan fully paid               | Depends on balance    | Frees $180/month from baseline budget     |
| Post-debt payoff                       | After loans cleared   | $275/month freed from baseline -- re-allocate to buffer or goals |

---

### Monthly Ritual Checklist

**Day 1-3 of each month:**
- [ ] Log all income received in the past month (cash basis -- only what hit your account)
- [ ] List invoices due this month: Tier 1 retainer ($2,500 -- count it), Tier 2 project (only if actively in progress and on track), Tier 3 referrals (exclude until received)
- [ ] Compare estimated income to $3,641 -- determine Scenario A or B
- [ ] If Scenario B: work down the priority list and pre-assign every surplus dollar on paper or in your tracking tool
- [ ] Transfer the tax reserve amount to your dedicated tax savings account immediately

**Day 14-16:**
- [ ] Has your retainer payment arrived? (Should be by Day 15 based on Net-15 terms)
- [ ] Any project invoices overdue more than 15 days? If yes, exclude from this month's income and downgrade to Scenario A if needed
- [ ] Reverse any surplus allocations that were planned but not yet transferred if you are downgrading

**Last day of each month:**
- [ ] Record actual income received in your 8-month rolling log
- [ ] Update buffer fund balance (contribution or drawdown)
- [ ] Note anything unusual (large one-time payment, non-payment, new client)
- [ ] Preview next month's income: any retainer changes? Projects in pipeline?

---

### Answering Your
