---
name: year-end-tax-checklist
description: |
  Produces a personalized year-end tax action checklist covering income timing,
  deduction bundling, contribution deadlines, loss harvesting concepts, and
  charitable giving strategies. All jurisdiction-specific deadlines and rules
  use placeholder markers for the user to verify.
  Use when the user asks about year-end tax planning, what to do before the
  tax year ends, or how to optimize their tax position before December deadlines.
  Do NOT use for filing tax returns (use tax-filing-prep), tracking deductions
  throughout the year (use tax-deduction-tracker), or calculating quarterly
  payments (use quarterly-tax-estimator).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "tax-planning personal-finance planning checklist"
  category: "personal-finance"
  subcategory: "tax-planning"
  depends: ""
  disclaimer: "educational-finance"
  difficulty: "intermediate"
---
# Year End Tax Checklist

> **Disclaimer:** This skill provides educational information about tax planning concepts and general guidance for personal financial planning. It does NOT constitute tax advice, legal advice, or investment recommendations. Tax laws change annually, vary by jurisdiction, and depend heavily on individual circumstances. All thresholds, limits, rates, and deadlines referenced with [VERIFY] must be confirmed against current IRS publications or your jurisdiction's tax authority. Always consult a qualified CPA, enrolled agent, or tax attorney before implementing any tax strategy.

---

## When to Use

**Use this skill when:**
- The user asks what tax planning actions to take before the tax year closes (typically October through December 31 for US filers)
- The user wants to know if they are on track with retirement contributions, withholding, or estimated payments before year end
- The user asks about tax-loss harvesting, charitable giving timing, or deduction bundling strategies before December
- The user received a large one-time income event this year (bonus, RSU vest, property sale, inheritance) and wants to understand their year-end exposure
- The user is in a different income bracket than expected and wants to evaluate whether to accelerate or defer income before year end
- The user just had a major life event (marriage, divorce, home purchase, new child, job change) and wants to understand the tax-year implications
- The user is self-employed and needs to evaluate retirement account contributions, income timing, and estimated payment adequacy before year end
- The user wants to understand qualified charitable distribution (QCD) eligibility or donor-advised fund (DAF) timing

**Do NOT use this skill when:**
- The user wants to prepare or file a tax return -- use `tax-filing-prep` instead
- The user wants to track deductions throughout the year on an ongoing basis -- use `tax-deduction-tracker` instead
- The user needs to calculate or make quarterly estimated tax payments -- use `quarterly-tax-estimator` instead
- The user wants to understand the mechanics of different account types (Roth vs. Traditional, HSA vs. FSA) -- use `investment-account-types` instead
- The user is asking about prior-year tax obligations or amended returns -- use `tax-filing-prep` instead
- The user is asking about business entity tax planning (S-corp elections, depreciation schedules, cost segregation) -- use a business tax planning skill instead
- The user's primary concern is state or local tax filing -- this skill focuses on federal US income tax concepts; state rules require separate verification
- The user is asking about estate tax planning, gift tax annual exclusions, or trust strategies -- those require a dedicated estate planning skill

---

## Process

### Step 1: Gather the User's Year-End Tax Profile

Before building the checklist, collect the minimum viable set of facts. You need enough information to determine which sections are relevant and which to skip entirely.

**Required information to collect:**
- **Employment type:** W-2 employee, self-employed / 1099, or a combination (often called a "W-2 plus side income" situation). This determines eligibility for SEP-IRA, Solo 401(k), and self-employed health insurance deductions.
- **Estimated gross income for this tax year:** Get a rough number -- $60K, $120K, $300K. You need this to determine which tax brackets apply, whether Roth IRA phaseouts apply, whether the 3.8% Net Investment Income Tax (NIIT) applies, and whether AMT exposure is plausible.
- **Filing status:** Single, Married Filing Jointly (MFJ), Married Filing Separately (MFS), Head of Household (HOH). Standard deduction amounts, bracket thresholds, and phaseouts all vary by filing status.
- **Major life events this year:** Marriage, divorce, new child, adoption, home purchase or sale, job change, retirement, death of spouse. Each creates specific tax opportunities or obligations.
- **Tax-advantaged accounts currently open and their YTD contribution amounts:** 401(k)/403(b), Traditional IRA, Roth IRA, HSA, SIMPLE IRA, SEP-IRA, FSA, 529.
- **Taxable brokerage accounts:** Do they exist? If yes, do the accounts have unrealized gains or losses? Tax-loss harvesting is only relevant here.
- **Charitable giving plans:** Any planned donations before year end, including cash, securities, or property.
- **Approximate withholding and estimated payments YTD:** To assess underpayment penalty risk.
- **Next year income expectations:** Significantly higher, lower, or about the same? This drives the income acceleration vs. deferral decision.

**If the user provides partial information:** Build the checklist using what is available, clearly mark sections as "Verify if applicable" for areas where you lacked information, and note at the end what additional facts would allow refinement.

---

### Step 2: Determine Bracket Position and Marginal Rate

This is the analytical foundation of everything else. Every strategy -- retirement contributions, Roth conversions, income deferral, charitable donations -- is evaluated against marginal rate, not average rate.

**How to perform this analysis:**
- Estimate Adjusted Gross Income (AGI): gross wages + self-employment income + investment income + other income
- Subtract above-the-line deductions: retirement contributions already made, student loan interest, HSA contributions, self-employed health insurance, half of self-employment tax
- This yields estimated AGI
- Compare estimated AGI to current year federal tax brackets [VERIFY bracket thresholds for the current tax year]
- Identify the marginal rate: this is the rate on the last dollar of income and the rate saved by each additional dollar of deduction
- Note the gap to the next bracket ceiling: if the user is $8,000 below the 22%/24% bracket boundary, $8,000 of retirement contributions shifts that income to the lower rate
- For users with investment income above approximately $200K (single) or $250K (MFJ) [VERIFY current NIIT threshold], the 3.8% Net Investment Income Tax applies to investment income -- this effectively raises the marginal rate on investment income

**Bracket boundary decision framework:**
- If the user is within $10,000--$20,000 of moving down to a lower bracket: model what additional contributions or deductions would push them across the boundary
- If the user just crossed into a higher bracket due to a one-time event (bonus, RSU vest): model what strategies could partially reverse that
- For long-term capital gains: identify whether the user is near the 0% / 15% / 20% LTCG thresholds [VERIFY current LTCG bracket amounts] -- this directly affects whether realizing gains this year is advantageous or costly

---

### Step 3: Retirement Account Contribution Analysis

Retirement accounts are the single most powerful year-end lever for most employees because contributions directly reduce taxable income (Traditional) or lock in tax-free growth (Roth). The analysis differs significantly by account type and deadline.

**401(k) / 403(b) -- strict December 31 deadline:**
- Annual employee contribution limit [VERIFY: historically around $23,000 for 2024]: confirm the user's YTD contributions from their most recent pay stub
- Catch-up contribution amount for age 50+ [VERIFY: historically $7,500 additional for 2024]
- SECURE 2.0 created a new "super catch-up" for ages 60--63 [VERIFY: currently $11,250 additional vs. standard catch-up for 2025 onward]
- Calculate the gap: annual limit minus YTD contributions
- To close the gap: the user must increase their contribution percentage through payroll and have enough paychecks remaining in the year to do so
- Deadline urgency: if there are only 2 paychecks left and the gap is $6,000, a 100% contribution rate still may not be achievable -- set realistic expectations
- Employer match mechanics: verify whether the employer has a "true-up" provision (pays the match even if max was hit early) or whether the match stops when contributions stop mid-year

**IRA -- flexible deadline (typically tax filing deadline, April 15 for most US filers):**
- Annual contribution limit [VERIFY: historically $7,000 for 2024, $8,000 for age 50+]
- Roth IRA income phaseout: [VERIFY current MAGI thresholds -- historically ~$146,000--$161,000 for single filers, ~$230,000--$240,000 for MFJ in 2024]
- If above Roth phaseout: evaluate backdoor Roth -- Traditional IRA nondeductible contribution followed by Roth conversion. Requires checking for existing pre-tax IRA balances due to the pro-rata rule.
- Traditional IRA deductibility phaseout: depends on whether covered by a workplace plan [VERIFY: historically $77,000--$87,000 single, $123,000--$143,000 MFJ for covered filers]
- Note clearly: IRA contributions do NOT need to be made by December 31 -- the filing deadline applies, which gives the user more time but means this is a lower-urgency year-end item

**HSA -- deadline matches IRA:**
- Available ONLY with a High Deductible Health Plan (HDHP) enrollment
- Annual limit [VERIFY: historically $4,150 individual / $8,300 family for 2024, with $1,000 catch-up for age 55+]
- Triple tax advantage: contributions pre-tax, growth tax-free, withdrawals tax-free for qualified medical expenses
- Contribution deadline typically aligns with tax filing deadline [VERIFY]
- Check enrollment status: user must have been enrolled in an HDHP for the relevant months to contribute

**Self-employed plans -- critical December 31 vs. filing deadline distinction:**
- Solo 401(k) must be ESTABLISHED by December 31 of the tax year even if contributions are made later [VERIFY]
- SEP-IRA can be established and funded until the filing deadline including extensions
- Solo 401(k) employee contribution limit same as 401(k) above; employer contribution (profit-sharing) up to 25% of net self-employment compensation [VERIFY: total combined limit historically $69,000 for 2024]
- SIMPLE IRA employee contributions must be made within 30 days of year end; employer contributions by filing deadline [VERIFY]

---

### Step 4: Tax-Loss Harvesting Analysis (Taxable Accounts Only)

Tax-loss harvesting is relevant ONLY for taxable brokerage accounts. Do not mention this section at all if the user has no taxable investment accounts.

**Core mechanics:**
- Selling an investment at a loss "harvests" the loss for tax purposes
- Realized losses first offset realized gains of the same type (short-term losses offset short-term gains, long-term losses offset long-term gains)
- After netting within each category, net losses of one type offset net gains of the other type
- If total net losses exceed total net gains, up to $3,000 of excess net losses can offset ordinary income per year [VERIFY: this limit has been $3,000 since the 1970s but confirm it remains unchanged]
- Losses beyond the $3,000 limit carry forward indefinitely to future tax years

**The wash sale rule -- most common mistake:**
- A wash sale occurs when you sell a security at a loss and repurchase a "substantially identical" security within 30 days before OR after the sale
- The disallowed loss is not permanently lost -- it is added to the cost basis of the repurchased security -- but you lose the current-year tax benefit
- "Substantially identical" is not perfectly defined in the tax code, but same security or same fund from same provider is clearly prohibited; a different ETF tracking the same index from a different provider is generally considered acceptable by most tax practitioners [VERIFY with tax professional]
- If the user is doing tax-loss harvesting in late December, they must not repurchase the same or substantially identical security until at least 31 days into January

**Decision framework for harvesting:**
- Calculate unrealized gain/loss position per holding
- Identify candidates: holdings with unrealized losses where the investment thesis has not changed (can be replaced with a similar but not identical fund)
- Compare the loss amount against the expected savings: a $5,000 loss in the 22% bracket saves approximately $1,100 in ordinary income taxes (if applied to ordinary income over gains)
- Consider transaction costs, fund expense ratio differences, and whether the position will be replaced
- Do not harvest losses in tax-advantaged accounts (IRA, 401k) -- there is no tax benefit and losses inside these accounts have no deductibility

**Short-term vs. long-term considerations:**
- Short-term gains (held less than 1 year) are taxed as ordinary income -- potentially at 32% or 37% for higher earners
- Long-term gains (held 1 year or more) are taxed at 0%, 15%, or 20% [VERIFY thresholds]
- If the user has short-term gains to offset, harvesting losses has higher tax value than offsetting long-term gains

---

### Step 5: Charitable Giving Optimization

Charitable giving and tax deductibility interact in several non-obvious ways that make year-end timing important.

**The itemization threshold problem:**
- For 2024, the standard deduction is [VERIFY: historically approximately $14,600 single, $29,200 MFJ] -- these amounts are adjusted for inflation annually
- If the user's itemizable deductions (mortgage interest, state and local taxes capped at $10,000 SALT, medical expenses above the AGI floor, charitable contributions) total less than the standard deduction, charitable donations produce no federal tax benefit
- The deduction bunching strategy: instead of donating $5,000 per year for two years, donate $10,000 in one year (taking the itemized deduction) and nothing the next year (taking the standard deduction). The total donations are identical; the tax savings are real.

**Appreciated securities donations:**
- Donating stock or mutual fund shares held for more than 1 year to a qualified 501(c)(3) organization
- Deduction equals the fair market value at time of donation, not the cost basis
- You avoid recognizing the capital gain entirely
- Example: A holding worth $10,000 with a $2,000 cost basis -- donating the shares creates a $10,000 deduction and avoids $8,000 of capital gains, potentially saving an additional $1,200 in federal tax (at 15% LTCG rate) compared to donating cash
- This strategy is most powerful for highly appreciated positions in taxable accounts

**Donor-Advised Funds (DAFs):**
- A DAF allows the donor to make a lump contribution (cash or securities) now, take the full deduction this year, and distribute grants to specific charities over time (months or years)
- Particularly useful when the user wants to bunch deductions but has not yet identified specific charities
- Funds inside a DAF grow tax-free until granted out
- DAF contributions are irrevocable -- the money must eventually go to qualified charities

**Qualified Charitable Distributions (QCDs):**
- Available to IRA owners age 70½ or older [VERIFY current age requirement]
- Allows a direct transfer from a Traditional IRA to a qualified charity -- up to $105,000 per year [VERIFY current limit]
- The distribution does NOT count as taxable income (unlike a normal IRA withdrawal followed by a donation)
- For Required Minimum Distribution (RMD) purposes, the QCD satisfies the RMD requirement
- This is particularly powerful for users who do not itemize, because the income exclusion works regardless of deduction method

**Cash donation documentation requirements:**
- Donations under $250: bank record or receipt required
- Donations of $250 or more: contemporaneous written acknowledgment from the organization required [VERIFY]
- Donations of property valued over $500: Form 8283 required
- Donations of property valued over $5,000: qualified appraisal required [VERIFY]

---

### Step 6: Income Timing and Deferral Analysis

This is especially relevant for self-employed individuals, those expecting a bonus, and those who control when they invoice or pay certain expenses.

**The core principle:** If your marginal rate is higher this year than next year, defer income and accelerate deductions. If your rate will be higher next year, do the reverse.

**Rate change scenarios that drive this decision:**
- Job loss or retirement expected in the next year (income drops -- defer income if possible)
- Expecting a large one-time income event next year (income rises -- accelerate income if possible)
- Significant capital gains expected next year from a planned property sale
- Marriage or divorce that will change filing status

**For W-2 employees:**
- Limited ability to time income -- salary and regular wages are taxed when received
- Bonus timing: if the employer can pay a December bonus in January, some employees can request deferral; this requires employer cooperation and has constructive receipt limitations [VERIFY constructive receipt doctrine application]
- RSU vesting: once RSUs vest, income is recognized; deferral is generally not available for standard RSU grants, though some employers offer deferral programs for large grants

**For self-employed individuals:**
- Can time when invoices are sent and when payments are accepted to manage cash-basis income
- Can accelerate deductible business expenses: prepay subscriptions, purchase needed equipment (check Section 179 immediate expensing rules [VERIFY current limits]), pay Q4 contractor invoices in December
- Retirement plan contributions (SEP-IRA, Solo 401(k)) are the largest lever for reducing self-employment income

**Roth conversion analysis:**
- A Roth conversion is a strategic acceleration of income that may make sense when the user is in an unusually low bracket year
- Common scenarios: retirement before Social Security begins, year with large deductions offsetting the conversion income, year after a job loss
- The converted amount is added to ordinary income and taxed at the marginal rate
- Future growth and withdrawals are tax-free
- Do NOT recommend Roth conversions if the user is already at the top of their bracket or if the conversion would trigger NIIT or AMT

---

### Step 7: Withholding and Estimated Payment Adequacy Check

Underpayment penalties are the most common "surprise" tax bill that year-end planning can prevent. This step is non-negotiable regardless of the user's situation.

**The safe harbor rules (US federal -- [VERIFY current rules]):**
- Safe Harbor Method 1: Pay at least 90% of the current year's actual tax liability through withholding or estimated payments
- Safe Harbor Method 2: Pay at least 100% of the prior year's total tax liability (110% if prior year AGI exceeded $150,000) [VERIFY high-income threshold]
- Meeting either safe harbor avoids the underpayment penalty even if you owe a balance at filing

**How to perform the check:**
- Obtain total federal income tax withheld YTD (from most recent pay stub, box 2)
- Add any estimated tax payments made (Form 1040-ES records)
- Compare to estimated current year tax liability (rough calculation: apply tax brackets to estimated taxable income)
- Compare to prior year total tax (from last year's Form 1040, line for "total tax")
- If below the safe harbor threshold: calculate how much additional withholding is needed from remaining paychecks (employees can submit a new W-4 requesting a specific additional dollar amount per paycheck)
- If self-employed and below safe harbor: Q4 estimated payment due [VERIFY: typically January 15 for Q4]

**Mid-year job change complications:**
- Each employer withholds based on annualizing that employer's wages
- If the user worked two jobs in the year or started a new job mid-year, combined withholding may be less than actual liability
- Particularly common when a lower-paying job was replaced by a higher-paying job mid-year (the new employer withholds assuming the full year at the higher rate, but the actual full-year income is even higher)

---

### Step 8: Compile the Personalized Checklist

With analysis complete, organize the output using the format below. Prioritize by deadline urgency:
- **Act immediately (within days):** 401(k) contribution changes via payroll, any trades that must settle by year end
- **Act before December 31:** Charitable donations, tax-loss harvesting executions, estimated payments, Roth conversions
- **Act before filing deadline:** IRA contributions, HSA contributions, SEP-IRA establishment and funding (if pre-existing)
- **Carry forward to January:** Gather documents, finalize IRA/HSA contributions, schedule tax professional

---

## Output Format

```markdown
## Year-End Tax Planning Checklist

**Generated for:** [Filing status] | [Employment type] | Estimated income: $[amount]
**Tax year:** [year] | **Date prepared:** [month/year]

---

### Situation Summary

| Factor | Detail |
|--------|--------|
| Filing status | [Single / MFJ / HOH / MFS] |
| Employment type | [W-2 / Self-employed / W-2 + side income] |
| Estimated gross income | $[amount] |
| Estimated marginal rate | [X%] -- based on current brackets [VERIFY] |
| Major life events | [List or None] |
| Tax-advantaged accounts | [List accounts open] |
| Taxable brokerage accounts | [Yes -- with positions / No] |
| Withholding/payment status | [On track / Possible shortfall -- see Section 5] |
| Next year income expectation | [Higher / Lower / Similar] |

---

### Bracket Position Analysis

- Estimated AGI: $[amount]
- Estimated taxable income (after deductions): $[amount]
- Current marginal bracket: [X%] [VERIFY current bracket thresholds]
- Gap to next bracket ceiling: $[amount]
  - Meaning: $[amount] of additional deductions or contributions would move this income to the [lower X%] bracket
- Long-term capital gains rate (if applicable): [0% / 15% / 20%] [VERIFY LTCG thresholds]
- NIIT exposure (if applicable): [Yes -- above $[threshold] / No] [VERIFY]

**Strategic implication:** [1-2 sentence summary of what the numbers mean -- e.g., "You are $6,400 below the 24% bracket ceiling. Maximizing 401(k) contributions could keep this income in the 22% bracket."]

---

### Section 1: Retirement Account Contributions

#### 401(k) / 403(b) -- DEADLINE: Last payroll of the year

| Item | Detail |
|------|--------|
| Annual limit | [VERIFY current year limit] |
| Catch-up limit (age 50+) | [VERIFY] |
| Super catch-up (ages 60--63) | [VERIFY -- SECURE 2.0 provision] |
| YTD contributions | $[amount from pay stub] |
| Remaining gap | $[limit minus YTD] |
| Paychecks remaining | [estimated number] |
| Maximum additional contribution per paycheck | $[gap / paychecks remaining] |
| Employer match consideration | [True-up / No true-up -- verify with HR] |

- [ ] Contact HR or payroll to increase 401(k) percentage by [date]
- [ ] Confirm contribution change takes effect before year-end payroll cutoff
- [ ] Verify employer match mechanics to avoid losing match dollars

#### Traditional / Roth IRA -- DEADLINE: [VERIFY -- typically April 15 of following year]

| Item | Detail |
|------|--------|
| Annual limit | [VERIFY] |
| Age 50+ catch-up | [VERIFY] |
| YTD contributions | $[amount] |
| Remaining gap | $[amount] |
| Roth MAGI phaseout range | [VERIFY: single ~$146K--$161K / MFJ ~$230K--$240K for 2024] |
| Eligibility at current income | [Fully eligible / Partial / Phased out] |
| Traditional deductibility | [Fully deductible / Partially deductible / Nondeductible] |

- [ ] [If Roth eligible]: Plan IRA contribution before filing deadline -- no December 31 pressure
- [ ] [If Roth phased out and no pre-tax IRA balances]: Evaluate backdoor Roth -- nondeductible Traditional contribution + conversion
- [ ] [If backdoor Roth]: Check for existing pre-tax IRA balances (pro-rata rule applies)

#### HSA -- DEADLINE: [VERIFY -- typically April 15 of following year]

| Item | Detail |
|------|--------|
| HDHP enrollment | [Yes / No / N/A] |
| Annual limit | [VERIFY: individual / family] |
| Age 55+ catch-up | [VERIFY: $1,000 additional] |
| YTD contributions | $[amount] |
| Remaining gap | $[amount] |

- [ ] [If enrolled in HDHP]: Plan remaining HSA contribution before filing deadline
- [ ] Consider investing HSA funds rather than holding as cash if not expecting near-term medical expenses

#### [Self-employed only] Solo 401(k) / SEP-IRA

| Item | Detail |
|------|--------|
| Plan type | [Solo 401(k) / SEP-IRA / SIMPLE IRA] |
| Plan establishment deadline | [VERIFY -- Solo 401(k) must be established by Dec 31] |
| Maximum contribution | [VERIFY: based on net self-employment income] |
| Filing deadline for funding | [VERIFY -- typically filing deadline + extensions] |

- [ ] [Solo 401(k) not yet established]: Open account before December 31 even if contribution is made later
- [ ] Calculate maximum contribution based on estimated net self-employment income
- [ ] Verify deduction on Schedule C / Schedule SE interaction

---

### Section 2: Income and Deduction Timing

#### Itemized vs. Standard Deduction Analysis

| Deductible Item | Estimated Amount |
|----------------|-----------------|
| Mortgage interest (from lender statement) | $[amount] |
| State and local taxes (SALT -- capped at $10,000) [VERIFY cap] | $[amount, max $10,000] |
| Unreimbursed medical expenses above [VERIFY: currently 7.5% of AGI] | $[amount] |
| Charitable contributions (planned, this year) | $[amount] |
| **Total estimated itemized deductions** | **$[total]** |
| Standard deduction for [filing status] | [VERIFY current amount] |
| **Advantage of itemizing** | **$[itemized minus standard, or "Standard wins"]** |

**Bunching recommendation:** [If itemized total is within $3,000--$8,000 of standard deduction]: "Consider pulling next year's charitable donations or property taxes into this year to cross the itemization threshold. Deduct the full $[amount] this year and use the standard deduction next year."

#### Income Timing Actions

- [ ] [Self-employed]: Evaluate delaying December invoices to January if income should be deferred
- [ ] [Self-employed]: Review accelerating deductible business purchases before December 31
- [ ] [Bonus expected]: Discuss with employer whether December or January payment is preferable given bracket position
- [ ] [RSU vest expected]: Note that vesting triggers ordinary income recognition -- limited deferral options for standard RSUs
- [ ] [Roth conversion candidate]: If in unusually low bracket year, evaluate conversion amount up to top of current bracket

---

### Section 3: Tax-Loss Harvesting

*[Include this section only if user has taxable brokerage accounts with unrealized positions]*

#### Unrealized Position Review

| Holding | Fair Market Value | Cost Basis | Unrealized Gain/(Loss) | Holding Period | Candidate? |
|---------|-----------------|------------|----------------------|----------------|------------|
| [Security 1] | $[amount] | $[amount] | ($[loss]) | [ST/LT] | [Yes/Review] |
| [Security 2] | $[amount] | $[amount] | $[gain] | [ST/LT] | [N/A -- gain] |
| **Net position** | | | **$[net gain or loss]** | | |

#### Harvesting Decision Analysis

| Item | Amount |
|------|--------|
| Total unrealized losses (candidates) | $[amount] |
| Total unrealized gains (realized or to be realized this year) | $[amount] |
| Net gain to be offset | $[amount] |
| Excess loss available for ordinary income offset | $[amount, max $3,000 this year] |
| Loss carryforward to future years | $[amount beyond $3,000 ordinary income offset] |
| Estimated tax savings this year | $[loss amount × marginal rate] |

- [ ] Identify replacement securities (similar but not substantially identical) before selling
- [ ] Confirm no purchases of these securities in the past 30 days (look-back wash sale window)
- [ ] Place trades by [VERIFY: typically last trading day of December for settlement by Dec 31]
- [ ] Set calendar reminder to not repurchase substantially identical securities until 31 days after sale date
- [ ] Update cost basis records after executing trades

---

### Section 4: Charitable Giving

#### Giving Strategy Recommendation

| Scenario | Recommended Approach |
|----------|---------------------|
| Itemized deductions exceed standard deduction | Donate cash or appreciated securities; full deduction available |
| Below standard deduction threshold | Consider bunching multiple years of giving into this year |
| Highly appreciated securities in taxable account | Donate shares directly -- avoid capital gain + get FMV deduction |
| Age 70½+ with Traditional IRA | Evaluate QCD up to [VERIFY current limit, ~$105,000] instead of cash donation |
| Large one-time giving amount | Donor-Advised Fund allows full current-year deduction with distribution over time |

#### Year-End Charitable Actions

- [ ] Complete all cash donations by [VERIFY: typically December 31]
- [ ] Initiate securities transfer donations -- allow 5--10 business days for brokerage transfer to complete
- [ ] [DAF]: Make DAF contribution by [VERIFY: typically December 31 for current-year deduction]
- [ ] [QCD]: Request direct transfer from IRA custodian to charity; do not take personal distribution first
- [ ] Obtain written acknowledgment for each donation of $250 or more [VERIFY threshold]
- [ ] Confirm each recipient organization has current 501(c)(3) status [check IRS Tax Exempt Organization Search]

---

### Section 5: Withholding and Estimated Payment Review

#### Safe Harbor Check

| Item | Amount |
|------|--------|
| Federal income tax withheld YTD | $[amount] |
| Estimated tax payments made (Q1--Q3) | $[amount] |
| Total payments made | $[amount] |
| Estimated current year tax liability | $[amount] |
| 90% of current year liability (Safe Harbor 1) | $[amount] |
| Prior year total tax (from last year's Form 1040) | $[amount] |
| 100% (or 110%) of prior year tax (Safe Harbor 2) | $[amount] |
| **Safe harbor threshold to meet** | **$[lower of the two safe harbor amounts if wanting to be safe, or confirm one is met]** |
| **Current shortfall / surplus** | **$[amount]** |

- [ ] [If shortfall exists]: Submit revised W-4 to employer requesting $[amount] additional withholding per paycheck for remaining [X] paychecks
- [ ] [If self-employed with shortfall]: Make Q4 estimated payment by [VERIFY: typically January 15] for $[amount]
- [ ] [If surplus]: No action needed -- note W-4 adjustment opportunity for next year to reduce overwithholding
- [ ] [Mid-year job change]: Verify combined withholding from both employers covers full-year liability

---

### Section 6: Life Event Tax Implications

*[Include only if life events were reported]*

| Life Event | Key Tax Implication | Action Required |
|------------|---------------------|-----------------|
| Marriage in [year] | Filing status changes to MFJ or MFS; new bracket thresholds apply | Verify withholding adequacy; update W-4 |
| New child | Child Tax Credit [VERIFY eligibility and amount]; Dependent Care FSA opportunity | Verify credit eligibility; update W-4 |
| Home purchase | Mortgage interest deduction; property tax deduction (within SALT cap) | Pull YTD mortgage interest from lender |
| Job change | Withholding gap risk; retirement plan transition | Verify old 401(k) rollover or leave-in-plan decision |
| Divorce | Filing status change; alimony tax treatment depends on agreement date [VERIFY] | Confirm filing status for this tax year |

---

### Key Deadlines Summary

| Action | Hard Deadline | Urgency |
|--------|-------------|---------|
| Increase 401(k) / 403(b) contributions via payroll | Last payroll of the year | 🔴 Act now |
| Tax-loss harvesting trades placed | [VERIFY last trading day -- typically Dec 29--30] | 🔴 Act now if applicable |
| Roth conversion execution | December 31 [VERIFY] | 🔴 Before year end |
| Cash charitable donations | [VERIFY -- typically December 31] | 🟡 Before Dec 31 |
| Securities donation to charity / DAF | Allow 5--10 business days -- initiate by Dec 20 | 🟡 Initiate early |
| Q4 estimated tax payment | [VERIFY -- typically January 15] | 🟡 Early January |
| Solo 401(k) plan establishment | December 31 (must exist before year end) | 🔴 If not yet open |
| IRA contribution (current year) | [VERIFY -- typically April 15] | 🟢 Can wait |
| HSA contribution (current year) | [VERIFY -- typically April 15] | 🟢 Can wait |
| SEP-IRA contribution | [VERIFY -- filing deadline + extensions] | 🟢 Can wait |

---

### January Action List

- [ ] Gather incoming tax documents: W-2 (due January 31), 1099-INT, 1099-DIV, 1099-B, 1099-NEC, 1098 mortgage interest, 5498 (HSA and IRA)
- [ ] Make any remaining IRA or HSA contributions for the prior tax year before filing
- [ ] Review updated withholding tables for new year and submit new W-4 if needed
- [ ] Verify any tax-loss harvesting wash sale windows have elapsed before repurchasing
- [ ] Set up ongoing deduction tracking for the new year (use `tax-deduction-tracker`)
- [ ] Schedule appointment with CPA or enrolled agent if situation is complex
- [ ] Note new year contribution limits [VERIFY -- typically adjusted for inflation in IRS Rev. Proc. released in November]

---

### Important Notes

> All thresholds, limits, rates, and deadlines in this checklist use [VERIFY] markers -- confirm these against current IRS publications (IRS.gov), Publication 590-A, Publication 590-B, Publication 969, and Publication 526 for the current tax year. Tax laws change annually.
>
> State income taxes are NOT addressed in this checklist. Most states follow federal AGI but have different standard deductions, different treatment of retirement income, and different deadlines. Verify state-specific rules separately.
>
> This checklist identifies planning opportunities. Execution -- especially for Roth conversions, backdoor Roth, tax-loss harvesting, and large charitable strategies -- should be discussed with a CPA or enrolled agent before implementation.
```

---

## Rules

1. **Never state specific dollar thresholds, limits, or rates as current facts** -- always attach [VERIFY] to every number. The 401(k) limit, standard deduction, IRA phaseout range, LTCG thresholds, and safe harbor percentages all change annually. Stating a stale number with confidence is worse than not stating it at all.

2. **Never recommend a specific investment holding to sell or buy** -- tax-loss harvesting is a framework, not a trade recommendation. The analysis identifies candidates; the user (with their advisor) makes the decision. The investment merit of any position is separate from its tax efficiency.

3. **Always perform the bracket position analysis before recommending any strategy** -- the value of a $1,000 deduction is $220 in the 22% bracket and $320 in the 32% bracket. Strategies that make sense at one rate may be irrelevant at another. Never build the checklist without first identifying the marginal rate.

4. **Always include the withholding adequacy check** -- this is the most commonly overlooked year-end item, and underpayment penalties arrive as unpleasant surprises at filing. Do not skip this section even if the user did not ask about it.

5. **Distinguish firmly between December 31 deadlines and filing deadline items** -- 401(k) contributions and tax-loss harvesting are true December 31 deadlines. IRA and HSA contributions are not. Conflating these causes users to either panic unnecessarily about IRA contributions or miss 401(k) contribution windows. Mark every deadline category explicitly.

6. **Never recommend a Roth conversion without first checking bracket position and existing balances** -- Roth conversions add income at the marginal rate. If the user is already near the top of their bracket, a conversion may push them into the next bracket or trigger NIIT. A partial conversion targeted to fill a bracket is very different from a blanket "convert to Roth" recommendation.

7. **For the wash sale rule, always specify the 30-day window applies in BOTH directions** -- the wash sale window is 30 days before AND 30 days after the sale. Users who sell in late December and repurchase in January 5 are still in the wash sale window. State this explicitly whenever tax-loss harvesting is discussed.

8. **For securities charitable donations, always note the time required for brokerage transfers** -- initiating a securities donation on December 30 will not complete by December 31 in most cases. Donors need 5--10 business days. This means securities donations should be initiated no later than mid-to-late December.

9. **Never mention tax-loss harvesting in the context of tax-advantaged accounts** -- gains and losses inside IRAs, 401(k)s, and HSAs have no tax consequences as they occur. A user who mentions "I have losses in my IRA" should be informed that harvesting inside an IRA provides no tax benefit, not given loss harvesting analysis.

10. **Always note state tax rules are separate** -- many users are surprised that their state has a different standard deduction, does not recognize federal retirement account deductions, or taxes retirement income differently. Include a standing note that this checklist covers federal income tax and state rules must be verified separately. Some states have no income tax; others have their own AMT or SALT rules.

---

## Edge Cases

### User Is Approaching Late December With Very Little Time
If it is December 20 or later, urgency sequencing becomes critical:
- **Within days:** 401(k) contribution changes must be submitted to payroll immediately -- many employers have cutoffs 2--3 pay periods ahead. If the final paycheck has already processed, the 401(k) window is closed for the year.
- **Securities charitable donations:** Initiate immediately -- a December 20 initiation may or may not settle by December 31 depending on the brokerage. Advise the user to call their brokerage to confirm settlement timeline; if in doubt, a cash donation may be more reliable for the current year.
- **Tax-loss harvesting:** Trades placed on December 29 or 30 (depending on year -- December 31 is often a holiday) are typically the last day for settlement. Verify the year's last trading day and settlement cycle.
- **IRA and HSA contributions:** De-prioritize; they can wait until April. Do not let the urgency of year-end create a false rush on these.
- **Reframe the conversation:** Tell the user clearly which actions are no longer possible this year so they can focus energy on what remains actionable.

### User Has a Large One-Time Income Event (Bonus, RSU Vest, Property Sale)
This is the scenario where the most tax dollars are at stake and the most strategies apply simultaneously:
- First, quantify the event: a $50,000 bonus in the 22% bracket is a $11,000 federal tax event; the same bonus that pushes into the 24% bracket creates incremental tax versus the baseline.
- Model what additional contributions could offset: can maximizing the 401(k) gap, making a large charitable donation, or executing a Roth conversion in the opposite direction (unlikely, but sometimes relevant in unusual situations) absorb some of the income?
- For RSU vests specifically: tax withholding on RSU vests defaults to the supplemental rate [VERIFY: currently 22% federal], which may be insufficient if the user is in a 32% or 37% bracket. A shortfall in RSU withholding is a common source of underpayment penalties.
- For property sales: distinguish between primary residence (Section 121 exclusion up to $250,000 single / $500,000 MFJ [VERIFY] if ownership and use tests are met) and investment property (no exclusion, potentially depreciation recapture). These are materially different scenarios.

### User Is Newly Self-Employed (First Year of Business Income)
First-year self-employed individuals face several simultaneous challenges:
- No prior-year estimated payments made, so the prior-year safe harbor (100%/110%) requires having paid zero prior year tax -- which is only helpful if prior year tax was zero. Most first-year self-employed people have a prior W-2 year to reference.
- Self-employment tax (15.3% on net earnings up to the Social Security wage base [VERIFY], 2.9% above) is often a surprise -- many new self-employed individuals account for income tax but forget SE tax.
- Solo 401(k) establishment deadline: if the user is in their first year and has not opened a plan, they must do so by December 31 to make employee contributions for this year. The employee contribution amount is limited to net self-employment income.
- The deduction for half of self-employment tax is an above-the-line deduction that reduces AGI -- make sure this is factored into the bracket analysis.

### User Has Both Pre-Tax IRA Balances and Wants to Do a Backdoor Roth
The pro-rata rule prevents the backdoor Roth from being fully effective when pre-tax IRA balances exist:
- The pro-rata rule treats ALL Traditional IRA funds (deductible and nondeductible) as one pool when calculating the taxable portion of a conversion
- Example: if a user has $54,000 in pre-tax IRA and makes a $6,000 nondeductible contribution, then converts $6,000, only $6,000 / $60,000 = 10% of the conversion is tax-free
- Solution: if eligible, roll the pre-tax IRA into an employer 401(k) before year end, leaving only the nondeductible basis in the IRA -- then the conversion is tax-free
- This rollover must also happen before the conversion for cleanest treatment; the ordering and timing matter
- Explicitly tell the user this is a situation requiring coordination with a CPA before execution

### User Has an FSA With a "Use It or Lose It" Provision
Flexible Spending Accounts are often overlooked in year-end planning but have the hardest deadlines:
- Healthcare FSA funds expire at the plan year end (typically December 31) unless the employer offers a grace period (usually 2.5 months into the new year) or a rollover provision (up to $640 [VERIFY current limit])
- Users with unspent FSA funds should accelerate eligible medical, dental, and vision spending before year end: schedule overdue appointments, purchase eligible over-the-counter items, order contact lenses, pay outstanding medical bills
- Dependent Care FSA has similar deadlines but different use rules
- The user may not realize this is a tax planning item -- FSA forfeiture is an actual dollar loss, not just a missed deduction

### User Is Over 72 (or Applicable Age) and Has Traditional IRA / 401(k) RMDs
Required Minimum Distributions create a year-end obligation, not an opportunity to defer:
- RMDs must be taken by December 31 of each year (except the first RMD year, which may be delayed to April 1 of the following year [VERIFY current rules, including SECURE 2.0 age changes])
- Failure to take the RMD triggers a penalty [VERIFY: currently 25% of the shortfall, reduced to 10% if corrected promptly under SECURE 2.0]
- QCD strategy: if the user is charitably inclined, directing the RMD to charity as a QCD satisfies the distribution requirement while excluding the amount from taxable income -- particularly valuable for users who take the standard deduction
- If the user has not yet taken their RMD and it is late December, this is a highest-priority action -- contact the IRA custodian immediately

### User Is Considering Year-End Roth Conversion
Roth conversions are irreversible and permanently affect AGI for the tax year. The analysis must be precise:
- Identify the amount of the conversion that would "fill the bracket" -- the gap between current taxable income and the top of the current bracket
- Verify that the conversion will not: push income above the NIIT threshold ($200K single / $250K MFJ [VERIFY]); cause Medicare IRMAA surcharges (2-year lookback means this year's income affects Medicare premiums in 2 years); phase out the child tax credit or other income-tested benefits
- Roth conversion income is not eligible for the standard deduction in a different way than earned income -- it is simply added to ordinary income
- The conversion must be completed by December 31 -- no extensions apply to Roth conversions

---

## Example

**Input:** "It's December 3rd and I want to make sure I'm not missing anything before the year ends. I'm married filing jointly, both W-2 employees. Combined income is about $210,000. We have 401(k)s at work, a Roth IRA for each of us, and a joint taxable brokerage account. We own our home, and we usually donate about $8,000 to charity a year but haven't done anything yet this year. We got a $15,000 bonus paid out in October. No big life events this year."

---

**Output:**

## Year-End Tax Planning Checklist

**Generated for:** Married Filing Jointly | W-2 (both) | Estimated income: ~$210,000
**Tax year:** [current year] | **Date prepared:** December 2024

---

### Situation Summary

| Factor | Detail |
|--------|--------|
| Filing status | Married Filing Jointly (MFJ) |
| Employment type | W-2 (both spouses) |
| Estimated gross income | ~$210,000 (including $15,000 October bonus) |
| Estimated marginal rate | 22% or 24% -- requires precise bracket check [VERIFY MFJ thresholds] |
| Major life events | None |
| Tax-advantaged accounts | 401(k) each, Roth IRA each |
| Taxable brokerage accounts | Yes -- joint account with positions |
| Charitable giving | $8,000 planned, not yet made |
| Next year income expectation | Similar |

---

### Bracket Position Analysis

At $210,000 combined gross, you are likely in the 22% or 24% federal bracket for MFJ [VERIFY: the 22%/24% MFJ boundary has historically been around $190,000--$200,000 range -- confirm exact current-year threshold]. The $15,000 bonus has already been included in income.

- Estimated AGI before deductions: ~$210,000
- Estimated taxable income after standard deduction [VERIFY MFJ standard deduction -- historically ~$29,200 for 2024]: ~$180,800
- Marginal rate: Likely 22% on income below the bracket ceiling, 24% on income above -- verify exact bracket thresholds [VERIFY]
- LTCG rate: At $210,000 MFJ, likely 15% on long-term capital gains [VERIFY LTCG thresholds]
- NIIT: $210,000 is below the MFJ $250,000 NIIT threshold -- no NIIT concern this year [VERIFY]

**Strategic implication:** Each dollar of additional retirement contributions saves approximately $0.22--$0.24 in federal income tax. Maximizing 401(k) contributions is the highest-leverage action before year end. The $8,000 charitable donation may or may not benefit from itemizing -- see Section 2.

---

### Section 1: Retirement Account Contributions

#### 401(k) -- DEADLINE: Last payroll of the year -- ACT NOW

| Item | Spouse 1 | Spouse 2 |
|------|----------|----------|
| Annual limit [VERIFY] | ~$23,000 | ~$23,000 |
| YTD contributions (from pay stub) | $[pull from pay stub] | $[pull from pay stub] |
| Remaining gap | $[calculate] | $[calculate] |
| Paychecks remaining in December | ~2--3 | ~2--3 |
| Max additional per paycheck | $[gap ÷ paychecks] | $[gap ÷ paychecks] |

**Action required:** Pull your most recent pay stub today. If either of you is below the annual limit, contact HR or log into your benefits portal to increase your contribution percentage immediately. With 2--3 paychecks remaining in December, you may be able to contribute an additional $2,000--$4,000 per person if you are significantly below the limit.

- [ ] Spouse 1: Check YTD 401
