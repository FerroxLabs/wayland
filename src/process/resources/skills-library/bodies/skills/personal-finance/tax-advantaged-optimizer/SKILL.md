---
name: tax-advantaged-optimizer
description: |
  Explains the decision framework for choosing and prioritizing tax-advantaged
  accounts including employer-sponsored plans, individual retirement accounts,
  and health savings accounts. Helps the user evaluate which accounts to fund
  based on their situation without prescribing specific actions.
  Use when the user asks about prioritizing retirement account contributions,
  maximizing tax-advantaged savings, or deciding between different account types.
  Do NOT use for understanding account structures (use investment-account-types),
  choosing investments within accounts (use portfolio-allocation-framework),
  or filing taxes (use tax-filing-prep).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "tax-planning investing personal-finance retirement-planning"
  category: "personal-finance"
  subcategory: "tax-planning"
  depends: ""
  disclaimer: "educational-finance"
  difficulty: "intermediate"
---
# Tax Advantaged Optimizer

> **Disclaimer:** This skill provides educational information about tax-advantaged account structures and general financial planning frameworks. It does NOT constitute financial advice, tax advice, investment recommendations, or legal guidance. Tax laws change annually, income thresholds are adjusted for inflation, and individual circumstances vary significantly. Always consult a qualified financial advisor, CPA, or licensed financial planner before making contribution or allocation decisions. All figures referenced in this skill reflect U.S. tax law as of 2024-2025 and should be independently verified for the current tax year.

---

## When to Use

**Use this skill when:**
- The user asks how to prioritize contributions across multiple tax-advantaged accounts -- for example, "should I max my 401(k) or Roth IRA first?"
- The user wants a framework for deciding between Traditional and Roth contributions across any account type (401k, IRA, 403(b))
- The user asks about maximizing total tax-advantaged savings capacity across employer plans, IRAs, and HSAs
- The user has a change in income, filing status, or employer benefits and wants to reassess their contribution strategy
- The user is self-employed and wants to understand which retirement account structures offer the highest contribution limits
- The user is approaching contribution deadlines (IRA deadline is Tax Day of the following year; 401k/HSA deadlines are December 31) and wants to optimize remaining capacity
- The user has received an employer match change or new HSA eligibility and wants to reassess their current allocations
- The user asks about catch-up contribution rules after turning 50 (or 60-63 under SECURE 2.0 rules)
- The user is trying to reduce current-year AGI to qualify for other tax benefits (deductible IRA, child tax credit phase-outs, ACA subsidies, student loan income-driven repayment thresholds)

**Do NOT use this skill when:**
- The user wants to understand the mechanical structure of account types -- use `investment-account-types` for explanations of how 401(k)s, IRAs, and HSAs work
- The user wants to choose specific investments within their accounts (equities, bonds, funds) -- use `portfolio-allocation-framework`
- The user wants to calculate a total retirement savings target or model retirement income -- use `retirement-savings-calculator`
- The user needs help completing a tax return or understanding which forms to file -- use `tax-filing-prep`
- The user is asking about Social Security optimization strategies -- use `social-security-optimizer`
- The user is asking about pension income, defined benefit plans, or COLA adjustments -- that is a separate domain
- The user is a non-U.S. person asking about retirement accounts in another jurisdiction -- this skill covers U.S. tax law only; redirect to a local tax professional

---

## Process

### Step 1: Build the Complete Account Inventory

Before any analysis, map every account the user has access to. Missing an account type leads to incomplete optimization.

- Ask directly: "Do you have access to an employer-sponsored plan (401k, 403b, 457b, SIMPLE IRA)? Does your employer offer both Traditional and Roth versions of that plan?"
- Ask about HSA eligibility: "Are you enrolled in a High-Deductible Health Plan (HDHP)?" The 2024 HDHP minimum deductible is $1,600 for self-only / $3,200 for family. If yes, HSA is available.
- Ask about IRA access: income level matters. The 2024 Roth IRA phase-out begins at $146,000 MAGI for single filers and $230,000 for married filing jointly. Traditional IRA deductibility phases out between $77,000-$87,000 (single, covered by workplace plan) and $123,000-$143,000 (MFJ, one spouse covered).
- Ask about self-employment income -- even a side business with W-2 primary employment opens access to a Solo 401(k) or SEP-IRA on the self-employment income separately.
- Identify any old employer plans still sitting with former employers. These create rollover decisions.
- Ask about the 457(b) if they work for government or certain nonprofits -- the 457(b) has a separate $23,000 limit in 2024 that does NOT combine with 401k/403b limits, effectively doubling contribution room.
- Note if the user is 50+ (catch-up eligible), 60-63 (SECURE 2.0 enhanced catch-up of $11,250 for 401k in 2025 vs. standard $7,500), or under 50.

### Step 2: Collect the Employer Match Formula

The employer match is the single highest-impact variable in this analysis. Gather it precisely.

- Ask for the exact match formula: "Does your employer match contributions, and if so, what is the formula?" Common structures include:
  - Dollar-for-dollar up to a percentage of salary (e.g., 100% match on first 3%)
  - Partial match up to a percentage (e.g., 50% match on first 6% -- net 3% of salary)
  - Tiered match (e.g., 100% on first 3%, then 50% on next 2% -- net 4% of salary)
  - Fixed dollar contribution regardless of employee contribution
- Calculate the annual match value in dollars using the user's stated salary.
- Calculate the minimum employee contribution required to capture the full match.
- Note the vesting schedule -- common structures are immediate vesting, 3-year cliff vesting (0% until year 3, then 100%), or 6-year graded (20% per year from year 2-6). The unvested match is not truly the user's money yet.
- If the user has fewer years at the employer than the vesting cliff, the effective match value is reduced.
- Flag if the employer uses a "true-up" contribution at year-end (relevant if the user front-loads contributions early in the year and runs out of room before year-end matching periods).

### Step 3: Establish the Tax Rate Context

The Traditional vs. Roth decision is fundamentally a tax rate arbitrage calculation. Get the relevant rates.

- Identify the user's approximate current marginal federal tax bracket. The 2024 brackets are: 10% ($0-$11,600 single), 12% ($11,601-$47,150), 22% ($47,151-$100,525), 24% ($100,526-$191,950), 32% ($191,951-$243,725), 35% ($243,726-$609,350), 37% (over $609,350). Married filing jointly thresholds are approximately double for most brackets.
- Ask about state income tax rate -- some states have no income tax (TX, FL, WA, NV, WY, AK, SD), which changes the Traditional vs. Roth calculus. In a no-income-tax state, the federal bracket analysis is the whole picture.
- Assess the user's income trajectory: early career with expected significant income growth favors Roth; peak earner approaching retirement with expected income drop favors Traditional.
- Ask about expected retirement income sources: Social Security estimates, pension income, expected IRA/401k withdrawal rates. High expected retirement income means high retirement tax rates -- a factor against Traditional.
- Note that Required Minimum Distributions (RMDs) begin at age 73 under SECURE 2.0, and a large pre-tax balance creates forced income that can push retirees into higher brackets and affect Medicare IRMAA surcharges and Social Security taxation. Roth accounts (except inherited Roth IRAs for non-spouse beneficiaries) have no RMDs for the original owner.
- Flag the tax diversification principle: having money in all three tax buckets (pre-tax, Roth, taxable) provides flexibility to control retirement taxable income in any given year.

### Step 4: Calculate Available Contribution Room

Build a precise table of where the user stands against 2024 limits. Use these verified 2024 figures:

- 401(k) / 403(b) / 457(b) employee deferral: $23,000 (2024), $23,500 (2025)
- 401(k) catch-up (age 50+): additional $7,500 (2024), $7,500 (2025 standard); ages 60-63 get $11,250 (2025) under SECURE 2.0
- IRA (Traditional + Roth combined): $7,000 (2024-2025), $1,000 catch-up for age 50+
- HSA self-only: $4,150 (2024), $4,300 (2025)
- HSA family: $8,300 (2024), $8,550 (2025)
- HSA catch-up (age 55+): additional $1,000
- SEP-IRA: lesser of 25% of W-2 compensation or $69,000 (2024)
- Solo 401(k) total: up to $69,000 (2024) -- employee deferral of $23,000 plus employer profit-sharing contribution of up to 25% of net self-employment income
- SIMPLE IRA employee deferral: $16,000 (2024), $16,500 (2025), catch-up $3,500
- Note that 401k + 403b combined employee deferrals share the $23,000 limit if the user has multiple jobs. The 457(b) limit is separate.

For each account, show: limit, current contribution, remaining capacity, and deadline.

### Step 5: Build the Prioritization Decision Tree

Present the framework as a series of yes/no questions the user works through -- not a prescribed order. The standard waterfall used by fee-only financial planners is:

**Tier 1 -- Employer Match Capture**
Question: Does your employer offer a match, and are you contributing enough to capture the full match?
- If no match exists, skip to Tier 2.
- If yes and not fully captured: the match is an immediate guaranteed return equal to the match rate (50% match = 50% immediate return, 100% match = 100% immediate return) before any investment growth. This is typically the highest-returning step regardless of tax bracket.
- Calculate the exact contribution needed. If the match is 50% on the first 6% of a $80,000 salary, the contribution needed is $4,800/year to receive $2,400 in match -- a 50% return before day one.

**Tier 2 -- HSA Funding (if eligible)**
Question: Are you eligible for an HSA by virtue of HDHP enrollment?
- If yes: the HSA offers a triple tax advantage unavailable anywhere else -- pre-tax contributions, tax-free growth, tax-free qualified medical expense withdrawals. This is functionally a stealth Roth IRA for healthcare costs with an additional feature: after age 65, non-medical withdrawals are taxed as ordinary income (like a Traditional IRA), so the worst case is Traditional IRA treatment.
- High-income earners at 32%+ brackets should prioritize HSA over IRA because the combined federal + state + FICA tax savings on HSA contributions made via payroll deduction can approach 37-40% effective savings rate on those dollars.
- Evaluate whether to pay current medical expenses out of pocket and preserve HSA as an investment vehicle -- this requires a sufficient liquid emergency fund outside the HSA.

**Tier 3 -- IRA Funding (Roth or Traditional)**
Question: Are you eligible for a deductible Traditional IRA or a Roth IRA (check income limits)?
- The IRA offers investment optionality not available in employer plans -- access to any brokerage and any asset class, including individual stocks, low-cost index funds, and alternative assets through specialized custodians.
- For users who are not covered by a workplace plan, the Traditional IRA is fully deductible at any income level.
- For users above the Roth IRA income limit: flag the Backdoor Roth IRA as a workaround -- contribute to a non-deductible Traditional IRA, then convert to Roth. This is legitimate but requires careful attention to the pro-rata rule if the user has other pre-tax Traditional IRA balances.
- For users between the deductibility phase-out range who are covered by a workplace plan: neither traditional IRA (non-deductible) nor the Roth IRA may offer ideal tax treatment -- in this band, returning to the employer plan may be better.

**Tier 4 -- Additional Employer Plan Contributions**
Question: Is there remaining capacity in the employer plan beyond the match threshold?
- Contributions above the match threshold still provide tax deferral but no immediate guaranteed return.
- The employer plan's investment menu quality matters here. A plan with low-cost index funds (expense ratios under 0.10%) is far more valuable than a plan with actively managed funds averaging 0.75%+.
- For very high earners: the 401(k) after-tax bucket (not Roth -- truly after-tax) enables the Mega Backdoor Roth strategy. If the plan allows after-tax contributions and in-service withdrawals or in-plan Roth conversions, the total 415(c) limit of $69,000 (2024) minus employee deferrals and employer match creates additional Roth-eligible space.

**Tier 5 -- Taxable Brokerage Account**
- After all tax-advantaged room is used, a taxable brokerage account provides unlimited contribution capacity with full flexibility.
- Long-term capital gains rates (0%, 15%, 20%) and qualified dividend rates are favorable for many investors.
- Tax-loss harvesting and asset location strategies make taxable accounts more efficient than the pre-tax comparison suggests.

### Step 6: Conduct the Traditional vs. Roth Analysis

This is the most nuanced decision. Present the analysis as a structured comparison, not a recommendation.

- **The core math:** At the same marginal tax rate in and out, Traditional and Roth are mathematically equivalent. The difference arises only if current vs. future rates diverge. Pre-tax dollar invested now grows and is taxed at the future rate. After-tax (Roth) dollar is taxed now but grows tax-free.
- **Factors favoring Traditional (pre-tax):** Current bracket is 24%+ and expected retirement effective rate is lower; income is at peak career level; large deductions are not available to reduce current taxable income another way; state has income tax that may not apply in retirement state.
- **Factors favoring Roth (after-tax):** Current bracket is 22% or below; early career with income growth expected; employer plan has limited investment options, making IRA more attractive and the Roth version preserves future flexibility; user wants to avoid RMDs; user has concerns about future tax law changes; user wants to leave tax-free money to heirs (Roth is more estate-efficient).
- **The certainty argument for Roth:** Tax rates are known today. Future rates are uncertain. Tax law has trended upward historically when deficits are high. Some advisors recommend Roth as a hedge against tax law risk.
- **The RMD argument:** A large pre-tax balance forces income at age 73 regardless of need. RMD income can push Social Security benefits into taxable territory (up to 85% of SS is taxable at higher incomes), trigger Medicare IRMAA surcharges, and increase the effective marginal cost of each dollar of pre-tax balance. This is a planning risk for disciplined savers.
- **Tax diversification as a default:** If the user genuinely cannot predict future rates, maintaining contributions in both buckets provides optionality to optimize withdrawals in retirement.

### Step 7: Model the Scenarios and Present the Summary

Build 2-3 concrete allocation scenarios based on the user's available savings and accounts. Each scenario should show:
- Monthly contribution to each account
- Annual contribution total per account
- Employer match captured
- Total tax-advantaged space used
- Remaining capacity in each account
- The tax treatment and timing of each dollar

Flag what happens to remaining savings if all tax-advantaged room is used.

Note explicitly what this analysis does not cover:
- Asset location strategy (which account should hold bonds vs. equities vs. REITs for tax efficiency)
- Roth conversion ladder timing for early retirement (FIRE strategies)
- 72(t) SEPP distributions for accessing pre-59.5 funds without penalty
- Net Unrealized Appreciation (NUA) for employer stock in 401k plans
- State-specific deductions for 529 contributions (sometimes prioritized before IRA if state match is significant)

---

## Output Format

```
## Tax-Advantaged Account Optimization Analysis

> All figures reference 2024-2025 U.S. tax law. Verify current-year limits and 
> income thresholds before acting. This is an educational framework, not financial advice.

---

### Section 1: Account Inventory and Contribution Room

| Account | Access | 2024 Limit | Current Annual | Remaining | Deadline |
|---------|--------|----------:|---------------:|----------:|----------|
| 401(k) Traditional | Yes | $23,000 | $X,XXX | $X,XXX | Dec 31 |
| 401(k) Roth | Yes/No | (combined with above) | $X,XXX | $X,XXX | Dec 31 |
| Traditional IRA | Yes | $7,000 | $X,XXX | $X,XXX | Apr 15, 2025 |
| Roth IRA | Yes/No* | $7,000 | $X,XXX | $X,XXX | Apr 15, 2025 |
| HSA (self-only / family) | Yes/No | $4,150 / $8,300 | $X,XXX | $X,XXX | Apr 15, 2025† |
| 457(b) | Yes/No | $23,000 | $X,XXX | $X,XXX | Dec 31 |
| Taxable Brokerage | Yes | No limit | $X,XXX | Unlimited | N/A |

*Roth IRA: phase-out begins at $146,000 MAGI (single) / $230,000 (MFJ) for 2024
†HSA deadline matches IRA for prior-year contributions; 401k/457 close Dec 31

**Total tax-advantaged capacity this year:** $XX,XXX
**Current annual contributions:** $XX,XXX  
**Remaining tax-advantaged room:** $XX,XXX

---

### Section 2: Employer Match Analysis

| Element | Detail |
|---------|--------|
| Match formula | [Describe exactly] |
| Annual salary | $XX,XXX |
| Contribution to capture full match | $X,XXX/year ($XXX/month) |
| Annual employer match value | $X,XXX |
| Effective immediate return on match contribution | XX% |
| Vesting schedule | [Cliff / Graded / Immediate -- detail] |
| Years until fully vested | X years |
| Effective vested match value today | $X,XXX |

**Match gap:** Are you currently capturing the full match? [Yes / No -- $X,XXX short]

---

### Section 3: Tax Rate Context

| Factor | Your Situation | Implication |
|--------|---------------|-------------|
| Current federal marginal bracket | XX% | [Pre-tax vs Roth signal] |
| State income tax rate | XX% (or None) | [Adds to/subtracts from pre-tax value] |
| Combined current marginal rate | XX% | |
| Income trajectory | [Early career / Peak / Declining] | [Roth / Traditional signal] |
| Expected retirement income sources | [SS, pension, withdrawals] | [High/Low retirement rate expectation] |
| Risk of RMD bracket creep | [High / Moderate / Low] | [Roth argument weight] |
| Tax law uncertainty preference | [Certainty vs. optimization] | [Roth hedge vs. Traditional math] |

**Traditional vs. Roth signal for your situation:** [Pre-tax leaning / Roth leaning / Split/diversify -- with specific reasoning]

---

### Section 4: Prioritization Decision Tree

Work through each tier in order:

**Tier 1 -- Employer Match Capture**
- Required contribution for full match: $X,XXX/year
- Current contribution status: [Capturing / Not capturing / No match available]
- Decision: [Adjust to $XXX/month to capture full match / Already optimized / N/A]

**Tier 2 -- HSA Funding**
- HDHP enrolled: [Yes / No / Unknown]
- If yes: Annual limit: $X,XXX ([self-only/family])
- Triple tax advantage value at your XX% bracket: ~$X,XXX in equivalent tax savings at maximum funding
- Decision: [Fund to limit / Not eligible / Evaluate HDHP switch at open enrollment]

**Tier 3 -- IRA Funding**
- Roth IRA eligible at current MAGI: [Yes / No / Partial (phase-out)]
- Traditional IRA deductible at current income: [Yes / No / Partial]
- IRA advantage over employer plan: [Investment menu flexibility / better fund options]
- Decision: [Roth IRA to limit / Non-deductible + Backdoor conversion / Traditional IRA / Skip]

**Tier 4 -- Additional Employer Plan Contributions**
- Remaining 401k room after match contribution: $X,XXX
- Plan investment menu quality: [Low-cost index funds available / Limited options]
- Decision: [Fund additional room / Stop at match due to poor fund options]

**Tier 5 -- Taxable Brokerage (if applicable)**
- Tax-advantaged capacity remaining: $X,XXX
- Taxable account treatment: LTCG at [0% / 15% / 20%] based on income
- Decision: [Fund taxable after exhausting all above tiers]

---

### Section 5: Allocation Scenarios

**Monthly savings available: $X,XXX/month ($XX,XXX/year)**

| Scenario | 401k/Mo | IRA/Mo | HSA/Mo | Taxable/Mo | Match/Mo | Annual Tax-Adv | Notes |
|----------|--------:|-------:|-------:|-----------:|---------:|---------------:|-------|
| A: Match + Roth IRA | $XXX | $XXX | $0 | $XXX | $XXX | $XX,XXX | Roth-forward, good flexibility |
| B: Pre-tax heavy | $XXX | $XXX | $0 | $XXX | $XXX | $XX,XXX | Max current deduction |
| C: Match + HSA + IRA | $XXX | $XXX | $XXX | $XXX | $XXX | $XX,XXX | Triple advantage if HSA eligible |

**Scenario comparison notes:**
- Scenario A generates approximately $X,XXX in federal tax savings this year
- Scenario B generates approximately $X,XXX in federal tax savings this year
- Scenario C generates approximately $X,XXX in federal tax savings this year

---

### Section 6: Key Risks and Flags

| Risk | Status | Action |
|------|--------|--------|
| Backdoor Roth pro-rata trap | [Relevant / Not applicable] | [Note if any pre-tax IRA balance exists] |
| IRMAA / Medicare surcharge threshold | [High balance trajectory / Low risk] | [Flag if on track for high pre-tax balance] |
| RMD bracket creep | [High risk / Moderate / Low] | [Consider Roth allocation to reduce future pre-tax mass] |
| Vesting cliff risk | [Leaving employer possible] | [Confirm vested status before relying on match] |
| Income phase-out proximity | [Near Roth limit / Clear] | [Monitor MAGI for Roth eligibility] |
| Employer plan fund expense ratios | [Low / High] | [Flag if avg ER > 0.40% -- may favor IRA over excess 401k] |

---

### Section 7: Action Checklist

- [ ] Confirm exact match formula and vesting schedule with HR (in writing if possible)
- [ ] Verify 2024 Roth IRA eligibility based on final MAGI with a tax professional
- [ ] Determine HSA eligibility based on your specific health plan's deductible and out-of-pocket limits
- [ ] Review your 401(k) fund menu expense ratios -- compare against index fund alternatives
- [ ] Set or adjust payroll deferral percentage to capture full employer match by year-end
- [ ] Evaluate whether a Backdoor Roth IRA is appropriate (check for existing pre-tax IRA balances first)
- [ ] Schedule IRA contributions early in the year (more time in market)
- [ ] Verify all 2024 limits and income thresholds at IRS.gov before filing season
- [ ] Reassess annually: income changes, employer benefit changes, tax law changes

---

### Section 8: What This Analysis Does NOT Cover

The following require separate analysis or professional guidance:
- Asset location: which account type should hold bonds, REITs, international funds
- Roth conversion ladder strategy for early retirement access
- Mega Backdoor Roth: requires plan-specific after-tax contribution and in-plan conversion rules
- 72(t) SEPP: structured penalty-free early withdrawals
- Net Unrealized Appreciation (NUA) for employer stock distributions
- 529 plan vs. IRA tradeoffs if education funding is also a goal
- Roth conversion timing in low-income years (career break, early retirement)
```

---

## Rules

1. **Never state a specific contribution limit as a current fact without framing it as a 2024 or 2025 figure that should be independently verified.** Limits adjust for inflation annually via IRS Revenue Procedures. Stating "$23,000" without a year qualifier risks being wrong in future tax years.

2. **Never prescribe a single "correct" prioritization order.** The academically standard waterfall (match → HSA → IRA → additional 401k → taxable) is a heuristic, not a universal rule. A 37% bracket earner with a poor employer plan fund menu may rationally skip Tier 4 entirely. Always present the decision tree as questions, not commands.

3. **Never give a Traditional vs. Roth recommendation.** Always present it as a framework with factors on each side. The correct answer depends on current bracket, expected future bracket, state tax at retirement, Social Security income level, estate planning goals, and personal risk tolerance toward tax law uncertainty -- none of which can be fully captured in this framework.

4. **Always surface the pro-rata rule risk before mentioning the Backdoor Roth IRA.** A user with $50,000 in a pre-tax Traditional IRA who contributes $7,000 non-deductible and converts will be taxed on approximately 87% of the conversion. This is a common and costly mistake. Check for existing pre-tax IRA balances before mentioning the backdoor strategy.

5. **Always note the 457(b) limit independence when the user works in government or qualifying nonprofit.** The 457(b) contribution limit does NOT count against the 401k/403b limit. This is one of the most underutilized pieces of information for eligible employees -- they can contribute $23,000 to a 403(b) AND $23,000 to a 457(b) simultaneously.

6. **Always distinguish between employee deferral limits and total 415(c) limits.** The $23,000 (2024) employee deferral limit is separate from the $69,000 total annual additions limit under IRC 415(c). Employer match plus employee contributions plus after-tax contributions together must stay under $69,000. Users attempting the Mega Backdoor Roth need to understand both limits.

7. **Always check vesting schedule before treating employer match as current compensation.** An employee with 2 years at a company under a 3-year cliff vesting schedule has $0 vested employer match. If they leave, they forfeit it. This changes the effective return calculation on match contributions.

8. **Flag IRMAA and Social Security taxation thresholds when users are high earners with large pre-tax balances.** Medicare IRMAA surcharges begin at $103,000 MAGI (single) / $206,000 (MFJ) in 2024 and create bracket-like marginal cost spikes. Up to 85% of Social Security benefits become taxable above $34,000 combined income (single). A large pre-tax IRA/401k balance converted to RMDs can unexpectedly push retirees into these traps.

9. **Never omit the HSA analysis if the user mentions an HDHP.** The HSA is the only triple-tax-advantaged account in the U.S. tax code and is frequently overlooked. At a 22% marginal bracket, fully funding an HSA family limit ($8,300 in 2024) produces approximately $1,826 in federal tax savings plus applicable state savings plus the 7.65% FICA savings if contributed via payroll deduction. This is often the highest-impact dollar for middle-income earners.

10. **Always disclose what the framework does NOT cover.** Asset location, Roth conversion ladders, Mega Backdoor Roth mechanics, 72(t) distributions, and NUA treatment are all related but distinct optimization layers. Presenting the contribution prioritization framework without noting these downstream decisions can leave the user thinking optimization is complete when it has only begun.

---

## Edge Cases

### Case 1: User Has Income Near the Roth IRA Phase-Out Range

The 2024 Roth IRA phase-out for single filers runs from $146,000 to $161,000 MAGI; for MFJ it runs from $230,000 to $240,000. In the phase-out band, a partial Roth IRA contribution is allowed.

- Calculate the partial allowable contribution: (($161,000 - MAGI) / $15,000) × $7,000 for a single filer. Round down to nearest $10; minimum $200 if any contribution is allowed.
- Users in the phase-out band should monitor their MAGI carefully -- year-end bonuses, capital gains distributions from mutual funds, or employer stock vesting events can push them out of eligibility after contributions are made.
- If they go over the limit, excess contributions are subject to a 6% excise tax per year until removed. Flag the correction mechanism: withdraw the contribution plus earnings before the tax deadline (including extensions), or recharacterize to a non-deductible Traditional IRA contribution.
- If MAGI will clearly exceed $161,000 (single) / $240,000 (MFJ), pivot immediately to the Backdoor Roth IRA analysis -- but check for existing pre-tax IRA balances first (Rule 4 above).

### Case 2: Self-Employed User (Full or Side Business)

Self-employment income creates unique retirement account access with significantly higher limits.

- A Solo 401(k) allows the self-employed person to act as both employer and employee. As employee: defer up to $23,000 (2024) in elective deferrals plus $7,500 catch-up if 50+. As employer: contribute up to 25% of net self-employment income (net Schedule C income minus half of SE tax) as a profit-sharing contribution. Total cannot exceed $69,000 (2024).
- A SEP-IRA allows only the employer contribution (25% of net SE income, max $69,000) -- simpler to administer but no employee elective deferral, making it inferior for lower-income years or those who want Roth access. SEP-IRA does not have a Roth option.
- SIMPLE IRA is available only to businesses with 100 or fewer employees and has a lower limit ($16,000 employee deferral in 2024) -- generally inferior to Solo 401k for single-person businesses.
- If the user also has a W-2 job with a 401k, the combined employee elective deferral across ALL 401k/403b plans is still $23,000 total. The employer profit-sharing contribution on self-employment income can still be added on top, up to the 415(c) limit.
- The Solo 401(k) Roth option (if adopted by the plan) allows after-tax employee deferrals within the $23,000 limit with no income restrictions.

### Case 3: User Has Pre-Tax IRA Balance and Wants to Do Backdoor Roth

This is the most technically dangerous edge case in the Backdoor Roth strategy.

- The pro-rata rule under IRC 408(d)(2) requires that any IRA distribution or conversion is treated as coming proportionally from all IRA balances (Traditional, SEP, SIMPLE combined) -- not just the non-deductible account.
- Example: User has $93,000 in a rollover Traditional IRA + contributes $7,000 non-deductible = $100,000 total IRA basis. Converting $7,000 to Roth: 93% ($6,510) is taxable, only 7% ($490) is tax-free. This defeats the purpose.
- Solution options: roll the existing pre-tax IRA into a current employer's 401k plan (if the plan accepts incoming rollovers -- not all do), which removes it from the IRA pro-rata calculation. Then the non-deductible contribution converts cleanly.
- Users cannot simply "isolate" their non-deductible IRA contributions by holding them in a separate account -- the IRS aggregates all IRAs for pro-rata purposes. Account separation is irrelevant.

### Case 4: User is Age 60-63 (SECURE 2.0 Enhanced Catch-Up)

SECURE 2.0 Act created a new super catch-up for ages 60, 61, 62, and 63 starting in 2025.

- Standard catch-up for age 50+ in a 401(k): $7,500 (2025)
- Enhanced catch-up for ages 60-63 specifically: $11,250 (2025), which is the greater of $10,000 or 150% of the regular catch-up amount, indexed for inflation
- At age 64, the user reverts to the standard $7,500 catch-up
- SECURE 2.0 also requires that catch-up contributions for employees earning over $145,000 (indexed) in the prior year must be designated as Roth catch-up contributions starting in 2026 (implementation delayed from original 2024 date)
- HSA catch-up: $1,000 additional per year starting at age 55, not indexed for inflation, available to each eligible spouse separately if both have individual HDHPs

### Case 5: User Has a 401(k) from a Former Employer

Old employer plans present a multi-option decision that affects both optimization and future backdoor Roth access.

- Option 1 -- Leave in former employer plan: preserves protections under ERISA (stronger creditor protection than IRAs in many states), may have access to institutional share class funds not available elsewhere, but reduces flexibility and contributes to the pre-tax IRA balance problem for backdoor Roth purposes.
- Option 2 -- Roll to current employer's 401(k): consolidates accounts, removes from IRA pro-rata calculation (enabling backdoor Roth), but the new plan must accept incoming rollovers and may have different (potentially worse) investment options.
- Option 3 -- Roll to Traditional IRA: maximum investment flexibility, any brokerage, any asset class. But this increases pre-tax IRA balance and can trap backdoor Roth users.
- Option 4 -- Roll to Roth IRA (Roth conversion): taxable event in the year of conversion -- the full pre-tax balance becomes ordinary income. May make sense in a low-income year (job transition, leave of absence, early retirement before Social Security/RMDs begin).
- Never cash out: a direct distribution triggers income tax plus 10% early withdrawal penalty if under 59.5. On a $50,000 balance in the 22% bracket with the 10% penalty, the user loses $16,000 immediately -- $10,000 in tax and $5,000 in penalty plus state tax.

### Case 6: User's Employer Offers Mega Backdoor Roth

This is a high-value but plan-specific strategy that requires very specific plan features.

- Requires: (1) plan allows after-tax (non-Roth) employee contributions above the $23,000 deferral limit, AND (2) plan allows either in-service withdrawals of after-tax contributions OR in-plan Roth conversions.
- Space available: $69,000 (2024 415c limit) minus employee deferrals ($23,000) minus employer match (e.g., $4,000) = $42,000 in after-tax contribution room.
- Process: contribute after-tax dollars to the plan, then immediately convert (in-plan) or withdraw and roll to a Roth IRA. Only the small amount of growth between contribution and conversion is taxable.
- Fewer than 50% of large plans offer this feature -- the user must check their Summary Plan Description (SPD) explicitly for "after-tax contributions" and "in-service distributions" or "in-plan Roth conversions."
- High-income earners at the 32%+ bracket for whom the Roth IRA income limit is irrelevant (they use the backdoor anyway) can effectively make massive Roth contributions via this route.

### Case 7: User Has Very Limited Savings (Under $500/Month)

When contribution capacity is severely constrained, full optimization across all account types is neither possible nor practical.

- Prioritize in strict order of impact per dollar: first, capture every dollar of employer match (the match is a 50-100% guaranteed return). Second, fully fund an HSA if eligible (triple advantage). Third, contribute whatever remains to a Roth IRA if eligible (Roth over Traditional at lower incomes where the current bracket is 12% or below -- few people are in the 12% bracket in retirement, making Roth conversion or current Roth contribution favorable).
- Avoid analysis paralysis -- a modest but consistent contribution to one or two accounts beats perfectly optimizing across five accounts with no actual contributions.
- Flag that as income grows, the user should revisit this framework annually and expand to additional tiers.

---

## Example

**User Input:** "I'm 34, single, make $105,000/year, and can save $1,500/month. My employer offers a 401k with a 100% match on the first 4% of salary, and I think it has Roth 401k too. I'm enrolled in an HDHP at work. I also have a Roth IRA that I've been contributing $200/month to. I'm trying to figure out if I'm doing this optimally."

**Output:**

## Tax-Advantaged Account Optimization Analysis

> Figures reference 2024 U.S. tax law. Verify all limits and income thresholds before acting.

---

### Section 1: Account Inventory and Contribution Room

| Account | Access | 2024 Limit | Current Annual | Remaining | Deadline |
|---------|--------|----------:|---------------:|----------:|----------|
| 401(k) -- Traditional or Roth | Yes | $23,000 | Calculating below | $23,000 - current | Dec 31, 2024 |
| Roth IRA | Yes* | $7,000 | $2,400 ($200/mo) | $4,600 | Apr 15, 2025 |
| HSA (self-only, HDHP enrolled) | Yes | $4,150 | Unknown | Up to $4,150 | Apr 15, 2025† |
| Taxable Brokerage | Yes | No limit | Unknown | Unlimited | N/A |

*Roth IRA: At $105,000 MAGI (single), you are well below the $146,000 phase-out start. You are fully eligible for the $7,000 limit. Verify final MAGI with a tax professional since AGI adjustments (like HSA or traditional 401k contributions) may affect your MAGI.

†HSA allows prior-year contributions until Tax Day if you had HDHP coverage in the prior year.

**At your $105,000 salary, your estimated 2024 federal marginal bracket is 22%** (the 22% bracket for single filers runs from approximately $47,151 to $100,525, but with pre-tax 401k/HSA contributions bringing down taxable income, verify whether you cross into the 24% bracket without them).

---

### Section 2: Employer Match Analysis

| Element | Detail |
|---------|--------|
| Match formula | 100% match on first 4% of salary |
| Annual salary | $105,000 |
| 4% of salary | $4,200/year |
| Employer match value at 4% contribution | $4,200/year ($350/month) |
| Effective immediate return on these dollars | 100% before any market return |
| Contribution needed per month | $350/month to capture full match |
| Vesting schedule | Confirm with HR -- structure unknown |

**Match gap assessment:** At $350/month to your 401k, you capture $4,200 in employer match annually. This is the single highest-return action available to you -- a 100% immediate return on $4,200.

**Current 401k status unknown** -- do you know your current payroll deferral percentage? If you are currently contributing less than 4% of salary ($350/month or $4,200/year), you are leaving free money on the table. This is the first item to fix.

---

### Section 3: Tax Rate Context

| Factor | Your Situation | Implication |
|--------|---------------|-------------|
| Estimated federal marginal bracket | 22% | Moderate -- pre-tax contributions save 22 cents per dollar |
| Pre-tax contributions reducing taxable income | 401k Traditional + HSA would reduce AGI | May keep you comfortably in 22% bracket |
| State income tax rate | Unknown -- confirm your state | Adds to pre-tax value if applicable |
| Income trajectory at age 34 | Likely early-to-mid career; income growth probable | Mild Roth signal -- paying 22% now may be lower than future rate |
| Expected retirement income | Unknown -- SS + withdrawals | Moderate uncertainty |
| RMD risk at current age | Very long horizon -- low urgency | But Roth contributions now compound for 30+ years tax-free |
| Roth IRA income limit risk | Clear of phase-out ($105k vs. $146k threshold) | No backdoor strategy needed currently |

**Traditional vs. Roth signal at your situation:** At 22%, the case for Roth is moderate but real. You are likely at or below your peak lifetime marginal rate given a 30+ year career ahead. Tax-free Roth growth over 30 years is substantially more valuable than at shorter horizons. A reasonable split -- Traditional 401k to capture match + HSA + Roth IRA -- gives you both current tax savings and future tax-free income. This is a decision for you and a financial planner to finalize.

---

### Section 4: Prioritization Decision Tree

**Tier 1 -- Employer Match Capture**
- Required contribution: $350/month (4% of $105,000)
- This captures $4,200/year in employer match -- a 100% guaranteed return
- Status: Confirm your current deferral percentage. If below 4%, increase immediately.
- Decision: Contribute at least $350/month to your 401(k). Choose Traditional or Roth variant within the plan based on Section 3 analysis.

**Tier 2 -- HSA Funding**
- HDHP enrolled: Yes
- 2024 self-only HSA limit: $4,150/year ($346/month)
- Triple tax advantage: contributions pre-tax, growth tax-free, qualified medical withdrawals tax-free
- At your 22% bracket: $4,150 × 22% = $913 federal tax savings. If your state has income tax, add that savings. If funded via payroll deduction, you also avoid 7.65% FICA taxes ($4,150 × 7.65% = $317 additional savings). Total potential tax savings on full HSA funding: approximately $1,230+ annually.
- After 65, HSA withdrawals for any purpose are taxed as ordinary income -- worst case, it behaves like a Traditional IRA but without RMDs. Best case (medical expenses), it is completely tax-free.
- If you can pay current medical expenses from your checking account and invest the HSA, the account becomes a stealth retirement account. This requires a sufficient liquid emergency fund to cover out-of-pocket medical costs.
- Decision: Fund the HSA to $4,150/year ($346/month). This is an exceptional use of $346/month given the triple tax advantage.

**Tier 3 -- Roth IRA Funding**
- Eligible at $105,000 MAGI: Yes
- Current contribution: $200/month ($2,400/year) -- $4,600 remaining capacity
- IRA advantage over additional 401k contributions: access to any brokerage and any index fund, not limited to your employer plan menu
- At age 34, a Roth IRA contribution has 30+ years of tax-free compounding runway
- Decision: Increase Roth IRA to $583/month ($7,000/year). The $383/month increase uses remaining IRA capacity and captures the full benefit of tax-free growth.

**Tier 4 -- Additional 401(k) Contributions**
- After Tier 1 (match): $350/month used
- Remaining 401k capacity: $23,000 - $4,200 = $18,800/year ($1,567/month remaining)
- With $1,500/month total and Tiers 1-3 costing $350 + $346 + $583 = $1,279/month, you have $221/month remaining
- Decision: Apply remaining $221/month ($2,652/year) to additional 401(k) contributions. This provides additional pre-tax deferral at 22%.

**Tier 5 -- Taxable Brokerage**
- Not yet needed -- your $1,500/month is fully absorbed by tax-advantaged accounts. Good problem to have.
- If income increases in future years and you exhaust Tiers 1-4, taxable brokerage is the next step.

---

### Section 5: Proposed Allocation Scenarios

**Monthly savings available: $1,500/month ($18,000/year)**

| Account | Current | Scenario A (Optimized) | Change |
|---------|---------:|----------------------:|-------:|
| 401(k) -- at least to match threshold | Unknown | $350/month (4% of salary) | Confirm/adjust |
| HSA (self-only) | $0 | $346/month ($4,150/year) | +$346 |
| Roth IRA | $200/month | $583/month ($7,000/year) | +$383 |
| Additional 401(k) above match | Unknown | $221/month | Adjust |
| Taxable Brokerage | Unknown | $0 | N/A |
| **Total** | **$1,500** | **$1,500** | |
| **Employer match received** | Unknown | **$350/month ($4,200/yr)** | |

**Total tax-advantaged accounts at full Scenario A funding:**

| Account | Annual Contribution | Source |
|---------|-----------:|--------|
| 401(k) employee | $6,852 ($350 match + $221 additional) | Your payroll |
| 401(k) employer match | $4,200 | Employer |
| HSA | $4,150 | Your payroll/direct |
| Roth IRA | $7,000 | Your bank account |
| **Total tax-advantaged** | **$22,202** | |

You are using $22,202 of tax-advantaged capacity in this scenario, against your $1,500/month/$18,000/year personal savings contribution. The remaining $4,202 is employer match -- money you receive on top of your contributions.

**Estimated 2024 federal tax savings from pre-tax contributions in Scenario A:**
- 401k Traditional (if traditional): $6,852 × 22% = approximately $1,507
- HSA via payroll: $4,150 × (22% + 7.65%) = approximately $1,230
- **Total estimated federal + FICA tax reduction: approximately $2,737**

Note: If you choose Roth 401k for the employer plan portion, you lose the $1,507 in current-year 401k tax savings in exchange for tax-free withdrawals in retirement. This is the core Traditional vs. Roth trade-off to evaluate with your tax professional.

---

### Section 6: Key Risks and Flags

| Risk | Status | Action |
|------|--------|--------|
| 401k match not being captured | Unknown -- confirm current deferral | Verify your current 401k contribution percentage with HR or your paycheck |
| HSA not currently funded | Not contributing | Enroll in payroll HSA deduction ASAP -- prior-year contributions also possible until April 15 |
| Roth IRA under-funded | $2,400/year vs. $7,000 limit | Increase to $583/month or make lump-sum contribution before April 15 |
| Pro-rata Backdoor Roth risk | Not applicable now (income is below phase-out) | Monitor MAGI annually as income grows |
| IRMAA / RMD creep | Very long horizon -- not urgent | Factor into Roth allocation decision over time |
| 401k plan fund quality | Unknown | Review your plan's investment menu; compare expense ratios of available funds to Vanguard/Fidelity index fund benchmarks (target ER under 0.10% for index funds) |
| Year-end true-
