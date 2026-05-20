---
name: tax-optimization-strategist
description: |
  Strategic tax planning including tax-advantaged accounts, deduction strategies, income timing, estimated taxes, and year-end planning for maximizing after-tax wealth.
  Use when the user asks about tax optimization strategist, or needs help with strategic tax planning including tax-advantaged accounts, deduction strategies, income timing, estimated taxes, and year-end planning for maximizing after-tax wealth.
  Do NOT use when the request requires professional financial advice or falls outside the scope of tax optimization strategist.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "personal-finance tax-planning guide"
  category: "personal-finance"
  subcategory: "tax-planning"
  depends: ""
  disclaimer: "educational-finance"
  difficulty: "advanced"
---
# Tax Optimization Strategist

> **Disclaimer:** This skill provides educational information about tax planning concepts and general strategies under U.S. federal tax law. It does NOT constitute tax advice, legal advice, or financial advice. Tax laws change frequently -- the figures referenced reflect 2024 law and may be outdated. Individual circumstances vary significantly, and no general guide can substitute for personalized counsel. Always consult a qualified CPA, Enrolled Agent, or tax attorney before implementing any strategy. Incorrect implementation can result in penalties, interest, audit exposure, and legal liability. State tax rules vary widely and are not comprehensively addressed here.

---

## When to Use

**Use this skill when the user:**
- Wants to understand how to reduce their current-year federal tax liability through legal deductions, deferrals, and account optimization
- Is doing year-end planning (October through December) and needs a structured checklist of actionable strategies before December 31
- Is self-employed, a freelancer, or runs a small business and needs to understand estimated taxes, QBI deductions, S-Corp considerations, and business deductions
- Has a major income event this year or next -- such as a large bonus, stock option exercise, business sale, inheritance, or Roth conversion -- and needs to model the tax impact
- Wants to understand the priority order for funding tax-advantaged accounts (401(k), HSA, Roth IRA, SEP-IRA, 529) and how to sequence them
- Has significant investment gains or losses and wants to understand tax-loss harvesting, wash sale rules, and capital gains rate optimization
- Is in a transitional life phase (marriage, divorce, new child, job change, early retirement, starting a business) that triggers new tax planning opportunities
- Wants to understand the mechanics and timing of Roth conversions relative to their projected future tax rates
- Has charitable giving goals and wants to understand the most tax-efficient giving vehicles (DAFs, QCDs, appreciated assets)

**Do NOT use when:**
- The user needs a completed tax return or line-by-line tax return guidance -- use a tax-preparation skill or refer them to a CPA/tax software
- The user has a specific IRS audit, penalty, or dispute situation -- this requires a tax attorney or Enrolled Agent representing them before the IRS
- The user asks about international tax, FBAR/FATCA obligations, or foreign income exclusions -- these are highly specialized and outside this skill's scope
- The user needs state-specific tax law analysis (this skill covers federal law; state law varies enormously and requires local expertise)
- The user is asking about business entity formation, S-Corp elections, or partnership tax at a level beyond general strategy -- refer to a business tax attorney or CPA
- The user has an estate planning question involving trusts, step-up in basis planning, or generation-skipping transfers -- use an estate planning skill or refer to an estate attorney
- The user is asking about cryptocurrency tax at an advanced level (DeFi, staking income, airdrops, chain forks) -- the complexity warrants a specialist

---

## Process

### Step 1: Gather the User's Tax Profile

Before providing any strategy, establish the user's baseline. Ask for or identify from context:

- **Filing status**: Single, Married Filing Jointly (MFJ), Married Filing Separately (MFS), Head of Household, Qualifying Surviving Spouse
- **Approximate adjusted gross income (AGI)**: The single most important number -- it determines bracket, phase-outs, and strategy eligibility
- **Income composition**: W-2 wages, self-employment income, investment income (dividends, interest, capital gains), rental income, retirement distributions, Social Security
- **Employer benefits available**: Does their employer offer a 401(k)? Employer match percentage? HSA-eligible health plan? FSA? Mega backdoor Roth option?
- **Life situation**: Age (catch-up contributions trigger at 50; QCD eligibility at 70.5; RMDs at 73), dependents, homeownership, significant life changes in the last 12 months
- **Existing account balances**: Pre-tax retirement balances (Traditional IRA/401(k)) vs. post-tax (Roth), taxable brokerage holdings with embedded gains/losses
- **State of residence**: State income tax rate and rules significantly affect strategy priority
- **Planning horizon**: Is this year-end planning, multi-year planning, or a specific event (selling a business, retiring)?

If the user does not provide this information, ask the minimum necessary questions before proceeding. Do not assume a tax bracket or filing status.

### Step 2: Identify the User's Current Marginal Bracket and Key Thresholds

Map the user's situation to the **2024 federal tax brackets** and identify which critical thresholds they are near:

**2024 Ordinary Income Tax Brackets:**

| Rate | Single | Married Filing Jointly |
|------|--------|------------------------|
| 10% | $0 -- $11,600 | $0 -- $23,200 |
| 12% | $11,601 -- $47,150 | $23,201 -- $94,300 |
| 22% | $47,151 -- $100,525 | $94,301 -- $201,050 |
| 24% | $100,526 -- $191,950 | $201,051 -- $383,900 |
| 32% | $191,951 -- $243,725 | $383,901 -- $487,450 |
| 35% | $243,726 -- $609,350 | $487,451 -- $731,200 |
| 37% | Over $609,350 | Over $731,200 |

**2024 Long-Term Capital Gains Rates:**

| Rate | Single | Married Filing Jointly |
|------|--------|------------------------|
| 0% | $0 -- $47,025 | $0 -- $94,050 |
| 15% | $47,026 -- $518,900 | $94,051 -- $583,750 |
| 20% | Over $518,900 | Over $583,750 |

**Net Investment Income Tax (NIIT)**: 3.8% surcharge on the lesser of net investment income or the amount by which MAGI exceeds $200,000 (single) / $250,000 (MFJ). This effectively makes the top capital gains rate 23.8%.

**Additional Medicare Tax**: 0.9% on wages/SE income above $200,000 (single) / $250,000 (MFJ). Employers do not withhold enough -- flag this for high-income earners.

**Key Phase-Out Thresholds to Identify Proximity To:**
- Roth IRA contribution phase-out: $146,000 -- $161,000 (single) / $230,000 -- $240,000 (MFJ)
- Traditional IRA deductibility phase-out (with employer plan): $77,000 -- $87,000 (single) / $123,000 -- $143,000 (MFJ)
- Child Tax Credit phase-out: $200,000 (single) / $400,000 (MFJ)
- QBI deduction phase-out for service businesses: $191,950 -- $241,950 (single) / $383,900 -- $483,900 (MFJ)
- ACA premium tax credit: Based on MAGI relative to federal poverty level; losing subsidies can represent an effective marginal rate spike of 10-30%
- IRMAA (Medicare Part B/D surcharges): Triggered at $103,000 (single) / $206,000 (MFJ) MAGI from 2 years prior -- relevant for retirees

Determine if the user is: (a) solidly within a bracket, (b) near the top of a lower bracket with room to fill it, or (c) near a critical phase-out threshold. This governs nearly every strategy recommendation.

### Step 3: Build the Account Funding Priority Stack

Recommend account funding in this exact priority order, customized to the user's situation. Each step must clear the prior before proceeding:

**Priority 1: 401(k) or 403(b) to the Employer Match**
- This is an immediate 50% to 100% return on investment -- nothing competes with this
- Identify the match formula (e.g., 50% of first 6% of salary = contribute exactly 6%)
- If the user is not capturing the full match, this is the single most important fix

**Priority 2: HSA to the Annual Maximum (if eligible)**
- Eligible only with a qualifying High-Deductible Health Plan (HDHP): 2024 minimum deductible $1,600 (individual) / $3,200 (family)
- 2024 contribution limits: $4,150 (individual) / $8,300 (family), plus $1,000 catch-up if age 55+
- Triple tax advantage: deductible contributions, tax-free growth, tax-free qualified withdrawals
- Advanced strategy: Invest HSA funds in index funds (not just let it sit as cash), pay current medical expenses out of pocket, retain receipts with no statute of limitations, reimburse yourself decades later tax-free
- After age 65, non-medical withdrawals are taxed as ordinary income -- effectively a second Traditional IRA

**Priority 3: Roth IRA to the Maximum (if income-eligible)**
- 2024 limit: $7,000 ($8,000 if 50+)
- Direct contribution phase-out: $146,000 -- $161,000 (single) / $230,000 -- $240,000 (MFJ)
- If income exceeds limits: implement the **Backdoor Roth IRA** (contribute to non-deductible Traditional IRA, then convert immediately)
- Backdoor Roth warning: If the user has any pre-tax Traditional IRA balances, the **pro-rata rule** applies and makes the backdoor Roth partially taxable -- must account for this before proceeding

**Priority 4: 401(k) or 403(b) to the Annual Maximum (beyond the match)**
- 2024 employee deferral limit: $23,000 ($30,500 if 50+)
- Traditional vs. Roth 401(k) decision: If current marginal rate is higher than expected retirement rate, favor Traditional; if lower or similar, favor Roth
- A common rule of thumb: favor Roth 401(k) at 22% bracket and below; favor Traditional at 32%+ bracket

**Priority 5: Mega Backdoor Roth (if plan permits)**
- Some 401(k) plans allow after-tax (non-Roth) contributions beyond the $23,000 employee limit, up to the total 415 limit of $69,000 (2024)
- If the plan allows in-service withdrawals or in-plan Roth conversions of after-tax contributions, this enables up to $46,000 of additional annual Roth contributions
- Not all plans allow this -- the user must check their Summary Plan Description

**Priority 6: Taxable Brokerage (with asset location discipline)**
- At this point, pre-tax space is exhausted
- Asset location: place tax-inefficient assets (bonds, REITs, high-dividend stocks, active funds) in tax-advantaged accounts; hold tax-efficient assets (index ETFs, growth stocks, municipal bonds) in taxable accounts
- Use ETFs over mutual funds in taxable accounts to minimize capital gains distributions

**Self-Employed Users:** Replace or supplement employer 401(k) with Solo 401(k) or SEP-IRA. SEP-IRA: up to 25% of net self-employment income, max $69,000. Solo 401(k): $23,000 employee deferral + 25% of net SE income as employer contribution, total $69,000. Solo 401(k) is almost always superior for self-employed individuals under age 50 with net income under $230,000.

### Step 4: Diagnose and Apply Deduction Strategies

**Standard Deduction vs. Itemizing Decision:**
- 2024 standard deduction: $14,600 (single) / $29,200 (MFJ) / $21,900 (Head of Household)
- Additional standard deduction for age 65+: $1,950 (single) / $1,550 each (MFJ)
- Run the arithmetic: total the user's potential itemized deductions (SALT capped at $10,000, mortgage interest, charitable giving, medical expenses over 7.5% of AGI) and compare to the standard deduction

**Bunching Strategy (when itemized deductions are within 80% to 120% of standard deduction):**
- Identify "flexible" deductions that can be shifted in timing: charitable contributions, elective medical procedures, prepaid state estimated taxes
- In "bunch year": make 2 years' worth of charitable donations, schedule elective medical procedures, prepay Q4 state income tax estimate -- itemize
- In "off year": make no charitable donations (or minimal), take standard deduction
- Net result over 2 years: significantly higher total deductions than taking standard deduction both years
- Pair with Donor-Advised Fund (DAF): contribute a lump sum to the DAF in the bunch year (full deduction), then distribute to charities from the DAF over the following 2-5 years

**Above-the-Line Deductions (always take regardless of standard vs. itemized):**
- Student loan interest: up to $2,500, phases out $80,000 -- $95,000 (single) / $165,000 -- $195,000 (MFJ)
- Self-employed health insurance premiums: 100% deductible from gross income (but not below SE income for the policy)
- 50% of self-employment tax: reduces AGI, always take
- HSA contributions (if made directly, not via payroll)
- Traditional IRA contributions (if deductible)
- Alimony paid under pre-2019 divorce agreements
- Educator expenses: $300 ($600 if both spouses are educators filing MFJ)

**Qualified Business Income (QBI) Deduction for Self-Employed and Pass-Through Business Owners:**
- Deduct 20% of qualified business income from taxable income
- For non-service businesses: no income limit for the basic deduction
- For Specified Service Trade or Business (SSTB -- doctors, lawyers, consultants, financial advisors, athletes): deduction phases out at $191,950 -- $241,950 (single) / $383,900 -- $483,900 (MFJ)
- W-2 wage limitation kicks in above the phase-in range: deduction limited to greater of 50% of W-2 wages paid or 25% of W-2 wages plus 2.5% of unadjusted basis of qualified property
- Planning implication: If near the SSTB threshold, consider retirement contributions to bring MAGI below it -- each dollar contributed to a Solo 401(k) can recover $0.20 of QBI deduction

### Step 5: Evaluate Income Timing and Capital Gain/Loss Strategies

**Capital Gains Rate Optimization:**
- Determine if any long-term capital gains can be realized in the 0% bracket (2024: up to $47,025 single / $94,050 MFJ of taxable income)
- If the user has low-income years, deliberately harvest gains at 0% to reset cost basis -- called "gain harvesting"
- For assets expected to be donated, never sell -- donate the appreciated asset directly (deduct full FMV, avoid all capital gains tax)
- Short-term gains (held under 1 year) are taxed as ordinary income -- time asset sales to cross the 12-month holding period threshold whenever possible

**Tax-Loss Harvesting:**
- Identify positions with unrealized losses in taxable accounts
- Sell to realize the loss; immediately reinvest in a similar (not substantially identical) fund to maintain market exposure
- Losses offset gains dollar-for-dollar: short-term losses offset short-term gains first, then long-term gains; long-term losses offset long-term gains first, then short-term gains
- Excess losses beyond gains offset up to $3,000 of ordinary income per year; remainder carries forward indefinitely
- **Wash sale rule**: Cannot repurchase the same or "substantially identical" security within 30 days before or after the sale -- the loss is disallowed and added to the cost basis of the replacement shares; this applies across ALL taxable accounts AND IRAs owned by the taxpayer or spouse
- Acceptable swaps: Vanguard Total Market ETF (VTI) sold, replaced with iShares Core S&P Total Market ETF (ITOT); Vanguard S&P 500 ETF (VOO) sold, replaced with iShares Core S&P 500 ETF (IVV)

**Roth Conversion Ladder:**
- Identify low-income years: the period between retirement and age 73 (when RMDs begin), years between jobs, sabbaticals, or years with large deductions
- In those years, convert Traditional IRA/401(k) dollars to Roth up to the top of the current bracket
- Rule: Never convert so much in one year that you push into a significantly higher bracket (e.g., from 22% to 32%) unless the conversion amount is so large it doesn't matter
- Model the "conversion cliff": compare current marginal rate on converted dollars vs. expected marginal rate in retirement on those same dollars (as RMDs or withdrawals)
- Roth conversions increase MAGI -- model impact on ACA subsidies, IRMAA thresholds, and phase-outs before executing
- Cannot undo a Roth conversion after 2018 (recharacterization eliminated by TCJA)

**Deferred Compensation and Bonus Timing:**
- If employer allows election, defer year-end bonus into non-qualified deferred compensation plan (if offered) or request payment in January
- Self-employed: delay invoicing for December work until January 1 if expecting a lower-income next year
- For RSU vesting: you cannot control vesting date, but you can control whether you hold or sell upon vesting; selling immediately upon vesting avoids additional ordinary income if the stock later declines

### Step 6: Apply Self-Employment and Business Tax Strategies

This step applies only to users with self-employment income, freelance income, sole proprietorship, or pass-through business income.

**Self-Employment Tax (SE Tax) Reduction:**
- SE tax rate is 15.3% on net SE income up to $168,600 (Social Security wage base), plus 2.9% Medicare on income above that (plus 0.9% Additional Medicare Tax above $200,000 single / $250,000 MFJ)
- 50% of SE tax is deductible above-the-line
- Solo 401(k) employee deferral reduces net SE income subject to SE tax calculations (via the deduction, not direct reduction)
- **S-Corp election**: If net SE income consistently exceeds $60,000 -- $80,000 (net of expenses), an S-Corp election can reduce SE tax significantly by splitting income into "reasonable compensation" (payroll-taxed) and S-Corp distributions (not subject to SE/payroll tax). The IRS requires the salary to be "reasonable" for the industry -- typically 40-60% of net profit is a common starting point, though a CPA must evaluate what is reasonable for the specific role
- S-Corp adds accounting complexity and costs (separate return, payroll processing) -- must model whether SE tax savings exceed these costs (rough rule: worthwhile above $60,000-$80,000 net profit)

**Home Office Deduction (if legitimately used exclusively and regularly for business):**
- Simplified method: $5 per square foot, up to 300 square feet ($1,500 maximum)
- Regular method: Actual expenses (mortgage interest/rent, utilities, insurance) multiplied by the percentage of home used for business (home office SF / total home SF)
- Regular method almost always produces a larger deduction -- calculate both
- Home office deduction cannot create a business loss (it can reduce profit to zero but not below)

**Vehicle Use:**
- Standard mileage rate 2024: $0.67 per business mile
- Actual expense method: Track actual fuel, insurance, depreciation, maintenance; deduct the business-use percentage
- Bonus depreciation: For vehicles used over 50% for business, Section 179 or bonus depreciation can accelerate deductions (subject to luxury auto limits for passenger vehicles)

**Estimated Tax Payments (Self-Employed and Irregular Income):**
- Owe $1,000+ at filing AND withholding + credits won't cover 90% of current year tax or 100% of prior year tax (110% if prior year AGI exceeded $150,000)
- 2024 due dates: April 15 (Q1), June 15 (Q2), September 15 (Q3), January 15, 2025 (Q4)
- **Safe harbor method**: Divide prior year total tax by 4 and pay each quarter -- guarantees no underpayment penalty regardless of current year income
- **Annualized income installment method (Form 2210, Schedule AI)**: For highly seasonal income, calculate each quarter based on actual year-to-date income -- can dramatically reduce Q1/Q2 payments for businesses that earn most income later in the year
- **Q4 W-2 withholding trick**: If the user has any W-2 income alongside self-employment, increase W-4 withholding on the W-2 in Q4 -- W-2 withholding is treated as paid evenly throughout the year regardless of when actually withheld, which can cure an underpayment penalty for earlier quarters

### Step 7: Execute Year-End Planning and Build the Action Timeline

Translate all identified strategies into a prioritized, dated action list. Year-end actions are hard-deadline-driven.

**Hard Deadlines (December 31):**
- Employee 401(k)/403(b) contribution elections -- payroll must process before year-end
- HSA contributions via payroll -- must process before year-end (direct contributions can be made until April 15)
- Tax-loss harvesting -- trades must settle by December 31 (trade date counts, not settlement date for most purposes, but verify with broker)
- Roth conversions -- must be processed by December 31 of the tax year
- Charitable cash donations to qualified organizations -- must be postmarked or electronically processed by December 31
- Required Minimum Distributions (RMDs) for account holders 73+ -- must be taken by December 31 (except first RMD year, which has until April 1 of the following year, though taking both in one year has negative tax implications)
- Exercise of incentive stock options (ISOs) or non-qualified stock options (NQSOs) that expire in the year
- Business equipment purchases eligible for Section 179 or bonus depreciation
- FSA funds -- Flexible Spending Account funds are use-it-or-lose-it unless the plan has a carryover provision (up to $640 in 2024) or grace period

**Soft Deadlines (April 15 of following year):**
- IRA contributions (Traditional or Roth) for the prior tax year
- HSA contributions made directly (not via payroll) for the prior tax year
- SEP-IRA contributions (can be extended to the filing deadline including extensions -- up to October 15 with extension)
- Filing Form 4868 for an automatic 6-month extension (note: extension of time to file, NOT extension of time to pay -- estimated tax must still be paid by April 15)

---

## Output Format

When responding to a tax optimization request, structure the output as follows:

```
TAX OPTIMIZATION ANALYSIS
==========================

USER PROFILE SUMMARY
--------------------
Filing Status: [Single / MFJ / HOH / etc.]
Estimated AGI: $[X] | Marginal Bracket: [X%]
Income Composition: [W-2 / SE / Investment / Mixed]
Key Life Factors: [Age, employer match availability, HSA eligibility, homeownership, dependents]
Planning Horizon: [Year-end / Multi-year / Event-specific]

BRACKET AND THRESHOLD ANALYSIS
--------------------------------
Current Marginal Rate: [X%]
Top of Current Bracket: $[X] -- Remaining Headroom: $[X]
Next Bracket Rate: [X%]
Critical Thresholds Near:
  - [Threshold name]: $[X] away -- Strategy implication: [X]
  - [Threshold name]: $[X] away -- Strategy implication: [X]

ACCOUNT FUNDING PRIORITY STACK
--------------------------------
Priority 1: [Account] -- Action: [Specific action] -- Estimated Tax Savings: $[X]
Priority 2: [Account] -- Action: [Specific action] -- Estimated Tax Savings: $[X]
Priority 3: [Account] -- Action: [Specific action] -- Estimated Tax Savings: $[X]
[Continue for all applicable priorities]

DEDUCTION STRATEGY
-------------------
Standard Deduction: $[X] | Estimated Itemized Deductions: $[X]
Recommendation: [Itemize / Standard / Bunch]
Bunching Opportunity: [Yes/No -- Explanation]
Above-the-Line Deductions Available: [List with amounts]
Total Estimated Deduction Enhancement: $[X]

INCOME TIMING AND CAPITAL GAINS STRATEGY
------------------------------------------
Capital Gain/Loss Inventory:
  - Unrealized Gains: $[X] (short-term: $[X] / long-term: $[X])
  - Unrealized Losses: $[X] (short-term: $[X] / long-term: $[X])
Tax-Loss Harvesting Opportunity: $[X] in losses -- Recommended action: [Specific]
Roth Conversion Opportunity: $[X] at [X%] bracket -- Recommended: [Yes/No/Amount]
Income Deferral/Acceleration: [Specific recommendation]

SELF-EMPLOYMENT STRATEGIES (if applicable)
--------------------------------------------
SE Tax Exposure: $[X] | S-Corp Election Worthwhile: [Yes/No/Maybe]
QBI Deduction: $[X] estimated | SSTB threshold status: [Below/Near/Above]
Home Office Deduction: $[X] (simplified) / $[X] (actual) -- Recommend: [method]
Estimated Tax Safe Harbor Amount: $[X] ($[X]/quarter)

CHARITABLE GIVING STRATEGY (if applicable)
--------------------------------------------
Giving Method: [Cash / Appreciated Stock / DAF / QCD]
Tax-Efficiency Ranking for Situation: [Explanation]
Recommended Approach: [Specific recommendation]

YEAR-END ACTION CHECKLIST
--------------------------
IMMEDIATE (before December 31):
  [ ] [Action] -- Deadline: [Date] -- Tax Impact: $[X]
  [ ] [Action] -- Deadline: [Date] -- Tax Impact: $[X]

BY APRIL 15:
  [ ] [Action] -- Deadline: April 15 -- Tax Impact: $[X]

MULTI-YEAR PLANNING:
  [ ] [Action] -- Timeline: [Description]

ESTIMATED TOTAL TAX SAVINGS SUMMARY
--------------------------------------
Strategy                     | Est. Tax Savings
-----------------------------|------------------
401(k) maximization          | $[X]
HSA maximization             | $[X]
Tax-loss harvesting          | $[X]
Roth conversion              | $[X] (lifetime value)
Charitable giving strategy   | $[X]
Deduction bunching           | $[X]
QBI deduction optimization   | $[X]
TOTAL ESTIMATED SAVINGS      | $[X]

IMPORTANT CAVEATS
------------------
- [Specific caveat 1 relevant to this user's situation]
- [Specific caveat 2 relevant to this user's situation]
- These estimates are based on information provided and are approximate.
  Consult a CPA or Enrolled Agent before implementing any strategy.
```

---

## Rules

1. **Never provide a specific dollar tax savings figure without showing the underlying math.** Always state: "At your marginal rate of X%, contributing $Y to your 401(k) reduces federal income tax by approximately $Z." Unsupported numbers destroy credibility and can mislead users.

2. **Always apply the pro-rata rule check before recommending a Backdoor Roth IRA.** If the user has ANY pre-tax Traditional IRA balance (even $1), the Backdoor Roth is partially taxable, and the math can make it counterproductive. Never recommend the Backdoor Roth without asking about existing Traditional IRA balances first.

3. **Always check HSA eligibility before recommending HSA contributions.** The user must be enrolled in an HSA-qualified High-Deductible Health Plan (HDHP) and must NOT be enrolled in Medicare, covered by a non-HDHP health plan (including a spouse's FSA), or claimed as a dependent on someone else's return.

4. **Never recommend a Roth conversion without modeling the AGI impact on ancillary items.** Roth conversions increase MAGI, which can: trigger IRMAA surcharges for Medicare enrollees (2-year lookback); eliminate ACA premium tax credits; reduce Social Security taxation threshold benefits; push the user into a higher NIIT exposure zone; reduce QBI deduction eligibility. Model all these before recommending a conversion amount.

5. **Always specify the wash sale rule scope when recommending tax-loss harvesting.** The 30-day rule applies across ALL taxable accounts AND IRA accounts owned by the taxpayer AND IRA accounts owned by the taxpayer's spouse. Many users are unaware the rule crosses accounts and accounts held at different brokerages.

6. **Do not recommend S-Corp election without acknowledging the compliance cost and "reasonable salary" IRS scrutiny.** The IRS aggressively audits S-Corps paying unreasonably low salaries. The salary must be justifiable for the role and industry. Annual compliance costs (separate S-Corp return, payroll processing) typically run $1,500 -- $5,000 per year and must be netted against SE tax savings in the analysis.

7. **Always identify which strategies have December 31 hard deadlines vs. April 15 soft deadlines.** Many users confuse IRA contribution deadlines (April 15) with 401(k) and Roth conversion deadlines (December 31). This is the most common year-end planning mistake that cannot be corrected after the fact.

8. **Never recommend maximizing pre-tax retirement contributions as universally optimal.** For users in the 10% or 12% bracket, Roth contributions are almost always superior -- the current tax savings are minimal, while the lifetime tax-free compounding benefit is substantial. The Traditional vs. Roth decision depends critically on current rate vs. expected future rate.

9. **Always ask about state tax implications before declaring a strategy optimal.** In states with no income tax (Florida, Texas, Nevada, etc.), there is no state tax benefit to Traditional IRA/401(k) contributions, which slightly reduces their advantage vs. Roth. In high-income-tax states (California at 13.3%, New York at 10.9%), state deductions amplify the value of pre-tax contributions significantly.

10. **Distinguish between tax avoidance (legal) and tax evasion (illegal) in any ambiguous situation.** Every strategy in this skill is legal tax avoidance using the IRC as designed. If a user proposes something that sounds like unreported income, fictitious deductions, or fraudulent documentation (e.g., "can I deduct my personal vacation if I do a little work?"), clearly explain the legal requirements and consequences -- do not assist with strategies that require misrepresentation to the IRS.

---

## Edge Cases

### Edge Case 1: User Has Large Pre-Tax IRA Balance and Wants Backdoor Roth

If a user has a $200,000 Traditional IRA and wants to do a $7,000 Backdoor Roth IRA contribution, the pro-rata rule applies. The taxable percentage of the conversion is calculated as: pre-tax IRA balance / (pre-tax IRA balance + after-tax basis) = $200,000 / ($200,000 + $7,000) = 96.6%. So 96.6% of the $7,000 conversion ($6,762) is taxable -- effectively defeating the purpose.

**Solutions:**
- Roll the pre-tax Traditional IRA into the current employer 401(k) (if the plan accepts IRA rollovers) -- this removes the pre-tax balance from the pro-rata calculation
- Accept the partial taxation and do the conversion anyway if the long-term Roth benefit justifies the current tax cost (model it)
- Wait until a low-income year to convert the entire pre-tax IRA balance to Roth directly, then do clean Backdoor Roth contributions going forward

### Edge Case 2: User Is Near an ACA Premium Tax Credit Cliff

For users purchasing health insurance on the ACA marketplace, income just above 400% of the Federal Poverty Level (FPL) -- approximately $58,320 for a single person in 2024 -- used to trigger a "subsidy cliff." The American Rescue Plan eliminated the hard cliff (now subsidies phase out smoothly above 400% FPL through 2025), but the phase-out is still steep: each additional $1,000 of MAGI above the threshold can reduce subsidies by $100-$300 depending on the plan cost.

**Actions:** Model the MAGI impact of any income-increasing strategy (Roth conversion, capital gain realization) against the ACA subsidy loss. In many cases, a $5,000 Roth conversion that saves $1,100 in taxes now (at 22%) costs $2,000 in lost ACA subsidies -- net negative. Use retirement contributions, HSA contributions, and above-the-line deductions to reduce MAGI below critical ACA thresholds.

### Edge Case 3: Required Minimum Distributions Colliding With Other Income

A user age 73+ who has large pre-tax retirement account balances may face a situation where RMDs alone push them into the 22% or 24% bracket, making additional income (Social Security, pension, dividends) taxed at high effective rates due to the "Social Security torpedo" -- the phase-in of Social Security into taxable income.

**The Social Security torpedo**: Up to 85% of Social Security benefits become taxable as combined income (AGI + non-taxable interest + 50% of SS benefits) rises above $34,000 (single) / $44,000 (MFJ). Each additional dollar of income causes $0.85 of SS benefits to become taxable, creating an effective marginal rate of approximately 1.85x the nominal bracket rate (e.g., 22% bracket becomes an effective ~40.7% marginal rate in this zone).

**Solutions:** Pre-RMD Roth conversions in the window between retirement and age 73 reduce the future RMD burden. QCDs (Qualified Charitable Distributions) of up to $105,000 per year from IRAs to charities are excluded from AGI entirely and count toward RMDs -- for charitably inclined users, this is the most efficient RMD management tool available.

### Edge Case 4: User Has Incentive Stock Options (ISOs) or Large RSU Grants

**ISOs:** Exercise of ISOs does not create regular income tax -- but the spread (FMV minus exercise price) is an Alternative Minimum Tax (AMT) preference item. Large ISO exercises can trigger significant AMT liability. Users with large ISO grants must model ISO exercise amounts against their AMT exemption ($85,700 single / $133,300 MFJ for 2024, with phase-out above $609,350 / $1,218,700) to determine how much can be exercised per year without triggering AMT.

**RSUs:** Vesting of RSUs creates ordinary income equal to the FMV on the vest date, regardless of whether shares are sold. This income is subject to payroll tax and income tax. If the user plans to hold RSUs post-vest, they are taking concentrated stock risk on shares already taxed as ordinary income -- generally suboptimal unless there is a compelling investment thesis.

**Strategy:** For ISOs, model annual exercise amounts to stay below the AMT trigger point. For RSUs, the default strategy for most users should be sell-at-vest and diversify, unless the employer stock represents a deliberate concentrated position.

### Edge Case 5: User Is in the 22% Bracket but Filing Married Filing Separately

Married Filing Separately (MFS) is almost always the worst filing status from a tax perspective. It eliminates or reduces: student loan interest deduction, IRA deductibility, Roth IRA eligibility, child and dependent care credit, earned income credit, education credits, and ACA subsidies. The MFS standard deduction is half of MFJ.

**The one exception**: Income-driven student loan repayment (IDR) plans -- some borrowers choose MFS specifically to exclude a spouse's income from IDR calculations, reducing monthly payments. The tax cost of MFS must be modeled against the student loan payment savings to determine if MFS is net beneficial. This requires a side-by-side comparison of MFJ vs. MFS total tax liability including the forgone credits.

### Edge Case 6: User Has Significant Capital Loss Carryforwards

A user with $50,000+ in capital loss carryforwards faces a different optimization problem. At the $3,000/year ordinary income offset limit, it would take 17+ years to use the losses against ordinary income. The priority shifts to **deliberately harvesting capital gains** in low-income years (0% LTCG rate) to absorb the carryforwards, or realizing gains that would otherwise be taxable.

**Strategy:** In years where the user's taxable income falls below the 0% LTCG threshold ($47,025 single / $94,050 MFJ), they can realize long-term capital gains tax-free, and the gains will be absorbed by the loss carryforward -- resetting cost basis without any tax cost. This "carryforward burn" strategy should be modeled annually against the user's expected income.

### Edge Case 7: User Is a High-Income Earner Phased Out of Most Deductions

For users with AGI above $500,000 (single) or $600,000+ (MFJ), many deductions and strategies phase out or become unavailable: Roth IRA contributions (phased out), traditional IRA deductibility (phased out), student loan interest (phased out), education credits (phased out), QBI deduction (eliminated for SSTBs). The available tools narrow significantly.

**Remaining high-income strategies:**
- Maximize pre-tax 401(k)/403(b) -- still available regardless of income (no income limit on 401(k) contributions)
- Mega Backdoor Roth if the plan allows it
- Backdoor Roth IRA (if no pro-rata problem)
- Charitable giving via DAF or QCD (if 70.5+)
- Tax-loss harvesting in taxable accounts
- Asset location optimization
- Municipal bonds in taxable accounts (interest exempt from federal income tax; evaluate after-tax yield vs. taxable equivalent)
- Deferred compensation plans (non-qualified) if offered by employer
- Cash value life insurance as a tax-deferred vehicle (complex -- requires careful evaluation)
- Real estate professional status for passive loss utilization (if applicable)

### Edge Case 8: User Has Inconsistent or Highly Variable Annual Income

Freelancers, commission-based workers, and business owners with volatile income face the challenge that prior-year safe harbor may trigger large payments in a low-income year, while the annualized income installment method requires meticulous quarterly P&L tracking.

**Strategy:** Use the annualized income installment method (Form 2210, Schedule AI) in any year where income is significantly lower than the prior year. Pay estimated taxes based on actual year-to-date income at each quarter rather than 25% of the prior year's liability. This requires maintaining a running income and deduction estimate throughout the year -- a quarterly "mini tax projection" that is essential for self-employed users with volatile income.

---

## Example

**User Input:** "I'm 38 years old, married filing jointly with my spouse. Combined W-2 income is $285,000. I also have about $40,000 in freelance consulting income this year. We max out our 401(k)s at work (both of us). We have a high-deductible health plan. I have a taxable brokerage account with about $15,000 in unrealized losses and $8,000 in unrealized long-term gains. We give about $6,000 per year to charity. We have a $450,000 mortgage on our primary home at 3.5% interest. What should we focus on for tax optimization?"

---

**Output:**

```
TAX OPTIMIZATION ANALYSIS
==========================

USER PROFILE SUMMARY
--------------------
Filing Status: Married Filing Jointly (MFJ)
W-2 Income: $285,000 (combined)
Self-Employment Income: $40,000 (consulting)
Estimated Total Gross Income: ~$325,000
Marginal Bracket: 24% federal (after deductions -- calculated below)
Age: 38 (no catch-up contributions; 12 years until catch-up eligibility at 50)
Key Factors: Both spouses have employer 401(k)s, HDHP eligible for HSA,
             taxable brokerage with losses and gains, mortgage, charitable giving
Planning Horizon: Year-end / Ongoing optimization

BRACKET AND THRESHOLD ANALYSIS
--------------------------------
Step 1: Estimate AGI
  Gross income:                              $325,000
  Less: Both 401(k) deferrals (2 x $23,000): ($46,000)
  Less: 50% of SE tax on $40,000 net income:  ($2,826)
    [SE tax = $40,000 x 0.9235 x 0.153 = $5,652; 50% = $2,826]
  Less: Self-employed health insurance:       (assume included in W-2; N/A here)
  Estimated AGI before HSA:                   ~$276,174
  Less: HSA family contribution ($8,300):      ($8,300)
  Estimated AGI:                               ~$267,874

Step 2: Estimate Taxable Income
  AGI:                                        $267,874
  Less: Standard deduction (MFJ):             ($29,200)
  Estimated Taxable Income:                   ~$238,674

Step 3: Bracket Check
  MFJ brackets: 24% bracket covers $201,051 -- $383,900
  Taxable income of $238,674 falls solidly in 24% bracket.
  Remaining headroom to top of 24% bracket: ~$145,226
  Next bracket: 32%

Critical Thresholds to Monitor:
  - QBI deduction SSTB phase-out starts at $383,900 (MFJ) -- well below; QBI
    deduction available on consulting income
  - NIIT: MAGI of $267,874 exceeds $250,000 MFJ threshold by ~$17,874; net
    investment income (dividends, interest, capital gains) on $17,874+ exposure
    to 3.8% NIIT surcharge
  - Additional Medicare Tax: Combined W-2 of $285,000 exceeds $250,000 MFJ
    threshold; $35,000 exposed to 0.9% Additional Medicare Tax; employer likely
    under-withheld -- flag for estimated payment or W-4 adjustment
  - Roth IRA direct contribution: MFJ income $267,874 is above the $240,000
    phase-out -- Roth IRA direct contribution is NOT available; use Backdoor Roth
    (see below, with pro-rata check required)
  - IRMAA: Not relevant at age 38

ACCOUNT FUNDING PRIORITY STACK
--------------------------------
Priority 1: Employer 401(k) to Match
  Status: COMPLETE (user confirmed both 401(k)s are maxed -- match captured)

Priority 2: HSA to Maximum
  Status: Eligible (HDHP confirmed)
  Action: Contribute $8,300 (family limit) to HSA for 2024 if not already done
  If via payroll: contributions also avoid FICA (saves 7.65% on $8,300 = ~$635)
  If direct: deductible above-the-line; tax savings at 24% = $1,992 federal
  + estimated state savings
  Tax savings estimate: $1,992 federal + ~$635 FICA savings if via payroll
  = ~$2,627 total
  Advanced: Invest HSA in low-cost index funds; pay medical bills out of pocket;
  retain receipts indefinitely for future tax-free reimbursement

Priority 3: Backdoor Roth IRA
  NOTE: Before proceeding, confirm -- do you or your spouse have ANY pre-tax
  Traditional IRA balances (rollover IRAs, deductible IRAs)? If yes, the
  pro-rata rule applies and this strategy requires modification.
  Assuming no pre-tax IRA balances:
  Action: Contribute $7,000 each (total $14,000) to non-deductible Traditional
  IRA for each spouse, then immediately convert to Roth IRA (within days)
  Tax impact at conversion: $0 additional tax (basis = contribution amount)
  Long-term value: $14,000/year in Roth compounding tax-free for 27+ years
  Deadline: April 15, 2025 for 2024 tax year

Priority 4: 401(k) Maximization
  Status: COMPLETE (both 401(k)s at $23,000 each = $46,000 combined)
  Note: If either employer offers Mega Backdoor Roth (after-tax contributions
  with in-plan conversion), check plan documents -- potentially $23,000+
  of additional Roth space per plan

Priority 5: Solo 401(k) for Consulting Income
  This is the highest-priority self-employment strategy for this user.
  Net consulting income: $40,000 - $2,826 (50% SE tax deduction) = $37,174
  Employee contribution (elective deferral): CANNOT double-dip if employer
  401(k) already at $23,000 limit. The $23,000 employee deferral limit is
  per individual across all plans, not per plan.
  Employer contribution to Solo 401(k): 25% of net SE income
    = 25% x ($40,000 - $5,652 SE tax) = 25% x $34,348 = $8,587
  Action: Establish Solo 401(k) and make employer (profit-sharing) contribution
  of $8,587 before December 31 (plan must be established by Dec 31; Solo 401(k)
  contributions for self-employed can be made up to tax filing deadline with extension)
  Tax savings at 24%: $8,587 x 24% = $2,061 federal + SE tax reduction benefit

DEDUCTION STRATEGY
-------------------
Standard Deduction (MFJ 2024): $29,200

Estimated Itemized Deductions:
  Mortgage interest on $450,000 @ 3.5%:           ~$15,750
  (Year 1 of mortgage; interest higher in early years -- use actual Form 1098)
  Assuming 5 years into mortgage: ~$14,800 in interest
  SALT cap (state income tax + property tax):       $10,000 (capped)
  Charitable contributions (cash):                  $6,000
  Total itemized estimate:                         ~$30,800

  $30,800 > $29,200 standard deduction -- marginally beneficial to itemize.
  However, the margin is only $1,600 above standard deduction.

Bunching Recommendation: YES -- STRONG OPPORTUNITY
  The difference between itemized ($30,800) and standard ($29,200) is
  only $1,600. This is a textbook bunching candidate.

  Bunching strategy:
  Year A (Bunch Year): Double charitable contributions to $12,000 + same
    mortgage interest ($14,800) + SALT ($10,000) = $36,800 itemized
    vs. $29,200 standard: benefit = $7,600 additional deduction
  Year B (Off Year): $0 charitable + $14,800 mortgage + $10,000 SALT = $24,800;
    take standard deduction ($29,200); benefit = $29,200

  Two-year total (Bunching): $36,800 + $29,200 = $66,000 in deductions
  Two-year total (No Bunching): $30,800 + $30,800 = $61,600 in deductions
  Bunching advantage over 2 years: $4,400 in additional deductions
  Tax savings at 24%: $4,400 x 24% = $1,056 over 2 years

  Implementation: Open a Donor-Advised Fund. Contribute $12,000 to DAF in
  Year A (take deduction). Distribute $6,000/year to actual charities from
  DAF in Years A and B. Tax timing benefit without changing actual giving pattern.

Above-the-Line Deductions (Regardless of Itemizing):
  50% of SE tax:                     $2,826
  Solo 401(k) employer contribution: $8,587
  HSA (if direct contribution):      $8,300 (already counted above)
  Total additional above-the-line:   $11,413 beyond HSA

INCOME TIMING AND CAPITAL GAINS STRATEGY
------------------------------------------
Capital Position Inventory:
  Unrealized Long-Term Gains: $8,000
  Unrealized Losses: $15,000

  Net position: $7,000 net loss available

Tax-Loss
