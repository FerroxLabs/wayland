---
name: investment-account-types
description: |
  Explains the structural differences between common investment account types
  including employer-sponsored plans, individual retirement accounts, taxable
  brokerage accounts, and health savings accounts. Covers tax treatment,
  contribution rules, withdrawal rules, and tradeoffs for each account type.
  Use when the user asks about types of investment accounts, differences between
  retirement accounts, or which account features matter for their situation.
  Do NOT use for specific investment product selection (use portfolio-allocation-framework),
  tax filing preparation (use tax-filing-prep), or calculating retirement savings
  targets (use retirement-savings-calculator).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "investing personal-finance tax-planning retirement-planning"
  category: "personal-finance"
  subcategory: "investing"
  depends: ""
  disclaimer: "educational-finance"
  difficulty: "beginner"
---
# Investment Account Types

> **Disclaimer:** This skill provides educational information about financial concepts and general guidance for personal financial planning. It does NOT constitute financial advice, investment recommendations, or tax guidance. Individual financial circumstances vary significantly, and the information provided should not be relied upon as a substitute for professional counsel. Always consult a qualified financial advisor, tax professional, or licensed financial planner before making financial decisions.

---

## When to Use

**Use this skill when:**
- A user asks what the structural differences are between a 401(k), IRA, Roth IRA, HSA, or taxable brokerage account -- even if they cannot name the accounts correctly (e.g., "that account where you don't pay taxes when you take it out")
- A user is starting a new job and wants to understand their employer-sponsored retirement plan alongside accounts they can open independently
- A user asks about contribution limits, withdrawal rules, penalties, or required minimum distributions for any investment account
- A user wants to understand the tax treatment of investment accounts -- specifically whether contributions, growth, or withdrawals are taxed, and when
- A user is self-employed and asks about retirement account options outside of a traditional employer plan
- A user asks about the Roth conversion concept, Backdoor Roth, or the difference between Traditional and Roth tax treatment
- A user asks whether they should put money in a retirement account or a regular brokerage account
- A user asks about HSAs as a retirement vehicle, not just a medical spending account

**Do NOT use this skill when:**
- The user wants help selecting specific mutual funds, ETFs, or stocks to hold inside an account -- use `portfolio-allocation-framework` instead
- The user wants to calculate how much to save for retirement in dollar terms -- use `retirement-savings-calculator` instead
- The user needs help completing a tax return or understanding how to report retirement distributions -- use `tax-filing-prep` instead
- The user is comparing specific brokerage platforms, custodians, or financial institutions on fees or features -- this is out of scope and no institution-specific recommendations should be made
- The user is asking about 529 education savings accounts as a primary topic -- those have distinct rules around beneficiary changes, state deductions, and qualified education expenses that warrant dedicated treatment
- The user is asking about annuities, whole life insurance cash value, or deferred compensation plans -- these have complex insurance and employer-agreement structures outside this skill's scope
- The user needs state-specific tax treatment of retirement account distributions (e.g., states that exempt pension income) -- this requires jurisdiction-specific tax guidance beyond this skill

---

## Process

### Step 1: Establish the User's Context Before Explaining Anything

Before presenting account types, collect or infer the following information. Ask clarifying questions if the user's message does not make these clear. Tailor every explanation to this context -- a 25-year-old in their first job has completely different priorities than a 52-year-old self-employed consultant.

- **Employment status:** W-2 employee, self-employed (sole proprietor, LLC, S-corp), or both (common for gig workers with a side business)
- **Employer plan access:** Does their employer offer a 401(k), 403(b), or 457(b)? Is there an employer match, and if so, what is the vesting schedule?
- **Income level and direction:** Are they early in their career with income likely to grow (favoring Roth), or in peak earning years expecting lower retirement income (favoring Traditional)?
- **Existing accounts:** What accounts do they already have open? Are they already contributing? At what level?
- **Primary goal:** Is this conversation about retirement savings, building a general investment portfolio, managing healthcare costs, or a combination?
- **Healthcare plan type:** Are they enrolled in a High-Deductible Health Plan (HDHP)? This determines HSA eligibility.
- **Time horizon:** When do they expect to need the money? Accounts with early withdrawal penalties are poorly suited for goals less than 5 years away.

If the user provides none of this context, proceed with the most common scenario (employed, access to a 401(k), no existing accounts) and explicitly state the assumptions you are making.

---

### Step 2: Explain the Three Tax Dimensions That Define Every Account

Every investment account can be described across exactly three tax events: the contribution, the growth, and the withdrawal. Understanding this framework first makes all the specific account comparisons intuitive rather than memorized.

- **Contribution tax treatment:** Either pre-tax (Traditional), meaning you reduce your taxable income in the year you contribute, or after-tax (Roth or taxable), meaning you contribute money you have already paid income tax on. Pre-tax contributions provide an immediate tax reduction. After-tax contributions do not.
- **Growth tax treatment:** Either tax-deferred (you owe taxes on gains later, not as they accumulate), tax-free (qualified accounts like Roth, where you will never pay taxes on gains), or currently taxable (taxable brokerage, where dividends and realized gains are taxed in the year they occur).
- **Withdrawal tax treatment:** Either taxable as ordinary income (Traditional accounts -- you pay tax at your income rate that year), tax-free for qualified distributions (Roth accounts -- no tax owed), or subject to capital gains rates (taxable brokerage -- long-term gains held over 12 months receive preferential rates; short-term gains are taxed as ordinary income).

The "triple tax advantage" of an HSA is the only account where all three events are tax-free simultaneously (contribution deductible, growth tax-free, withdrawal tax-free for qualified medical expenses). All other accounts involve a tax cost at at least one of these three points.

Frame the Traditional vs. Roth decision explicitly as a tax-timing question: you will pay income tax on this money either now (Roth) or later (Traditional). The better choice depends on whether your tax rate is higher now or in retirement -- and that answer is unknowable with certainty, which is why many advisors suggest hedging across both.

---

### Step 3: Walk Through Each Account Type With Structural Precision

Present each account type using consistent structural dimensions. Do not skip dimensions or use vague language. Real numbers from the current tax year should be noted as jurisdiction-specific values that the user must verify at the IRS website or equivalent authority -- but provide the correct placeholder names so the user knows exactly what to look for (e.g., "the annual 401(k) elective deferral limit" rather than "the limit").

**Employer-Sponsored Plans: 401(k), 403(b), 457(b)**

- 401(k) plans are offered by for-profit employers. 403(b) plans serve nonprofits, schools, and hospitals. 457(b) plans are for state and local government employees and some nonprofits. All three share similar core mechanics but have important structural differences in catch-up contribution rules and, for 457(b), the absence of a 10% early withdrawal penalty.
- Employees elect a contribution percentage or dollar amount through payroll deduction. Contributions go in before income taxes are withheld (Traditional) or after (Roth, if the plan offers it). Many modern 401(k) plans now offer both options within the same plan -- this is called a designated Roth account within a qualified plan and is governed by different rules than a Roth IRA.
- The employee elective deferral limit applies to the total of Traditional and Roth contributions combined -- you cannot contribute the maximum to both options separately. The limit is indexed to inflation and changes periodically. Participants aged 50 and older may make additional catch-up contributions above the standard limit. Under SECURE Act 2.0 provisions, participants aged 60-63 have access to a higher catch-up limit than those 50-59.
- Employer matching contributions do not count against the employee elective deferral limit. They are subject to a separate, higher overall plan limit (the "415 limit" covering all contributions to the plan from all sources -- employee deferrals plus employer contributions including match and profit-sharing). Employer contributions are always pre-tax regardless of whether the employee chose Traditional or Roth deferrals.
- Vesting schedules determine when employer contributions become permanently the employee's property. Immediate vesting means contributions vest instantly. Cliff vesting means the employee owns 0% until a defined service period, then 100%. Graded vesting means ownership increases incrementally (e.g., 20% per year over 5 years). Employee deferrals are always 100% immediately vested -- only employer contributions are subject to vesting schedules.
- Investment options are limited to the plan's menu, which is chosen by the employer. Plans typically offer a selection of mutual funds. Low-cost index funds in a 401(k) are excellent; poorly designed plans may offer only high-expense-ratio actively managed funds. You cannot hold individual stocks, most ETFs, or alternative assets in a standard 401(k) (though brokerage windows exist in some plans).
- Required Minimum Distributions (RMDs) begin at age 73 (under current law following SECURE Act 2.0 changes from the original SECURE Act's 72 threshold). Roth 401(k) accounts, unlike Roth IRAs, are subject to RMDs while the money remains in the employer plan -- though this can be resolved by rolling a Roth 401(k) into a Roth IRA at separation.
- Early withdrawals before age 59½ are generally subject to a 10% penalty plus ordinary income taxes. Exceptions include substantially equal periodic payments (SEPP/72(t)), separation from service after age 55 (for the current employer's plan), qualified domestic relations orders (QDRO), certain disability situations, and other enumerated exceptions in the tax code.

**Traditional IRA**

- Any person with earned income (wages, self-employment income, or alimony under pre-2019 divorce agreements) can contribute to a Traditional IRA. Earned income does not include interest, dividends, capital gains, rental income, or pension distributions. A non-working spouse can contribute to a spousal IRA if the couple files jointly and the working spouse has sufficient earned income.
- The contribution limit for IRAs is shared between Traditional and Roth -- your combined Traditional plus Roth IRA contributions in a year cannot exceed the annual IRA contribution limit. This is distinct from employer plan limits, which are separate and do not reduce your IRA contribution room.
- Deductibility of Traditional IRA contributions phases out based on two factors: (1) whether you (or your spouse) are covered by a workplace retirement plan in that tax year, and (2) your modified adjusted gross income (MAGI). If you are not covered by a workplace plan at all (and your spouse is not either), contributions are fully deductible at any income level. Partial deductibility applies within the phase-out range. Above the phase-out limit, contributions are still allowed but become non-deductible -- these are tracked using IRS Form 8606 to establish basis and prevent double taxation on withdrawal.
- Non-deductible Traditional IRA contributions create a concept called "basis." When you later withdraw from a Traditional IRA containing a mix of deductible and non-deductible contributions, you calculate the taxable portion using a pro-rata formula across all your Traditional, SEP, and SIMPLE IRA balances combined. This pro-rata rule has significant implications for Backdoor Roth conversions.
- Traditional IRA withdrawals are taxed as ordinary income. RMDs apply starting at age 73. There is no option to leave funds in a Traditional IRA indefinitely without taking distributions -- unlike a Roth IRA.
- Early withdrawal before 59½ incurs the 10% penalty plus ordinary income tax. Exceptions include first-time home purchase (up to a lifetime limit), qualified higher education expenses, health insurance premiums during unemployment, unreimbursed medical expenses above a threshold, disability, and death. The 72(t) SEPP exception also applies.

**Roth IRA**

- Eligibility to contribute to a Roth IRA directly is subject to income limits based on MAGI. Contributions phase out over a range above a threshold and are completely prohibited above the upper limit. These limits differ by filing status (single, married filing jointly, married filing separately). These are among the most frequently asked jurisdiction-specific figures -- always instruct the user to verify the current year's limits at the IRS website.
- The contribution limit is the same as the Traditional IRA and is shared between the two -- the combined limit applies. If income is too high for direct Roth IRA contributions, the Backdoor Roth IRA strategy exists (discussed in Edge Cases).
- Roth IRA contributions (not earnings) can be withdrawn at any time, at any age, without taxes or penalties. This is because contributions were made with after-tax dollars and have already been taxed. This makes the Roth IRA uniquely flexible -- the contribution portion functions somewhat like an emergency fund that happens to be in a retirement account.
- Earnings in a Roth IRA grow tax-free. Qualified distributions of earnings require two conditions to be met: the account must be at least 5 years old (the 5-year rule, measured from January 1 of the first year a contribution was made), and the account holder must be at least 59½, disabled, deceased, or using funds for a first-time home purchase (up to a lifetime limit).
- There are two separate 5-year rules for Roth accounts: one for contributions to a Roth IRA (above), and a separate 5-year clock that starts fresh for each Roth conversion. Conversion amounts withdrawn before their 5-year clock expires are subject to the 10% early withdrawal penalty on the converted amount, even if the original contribution 5-year rule is satisfied. This is a frequently misunderstood nuance.
- No RMDs apply to a Roth IRA during the original owner's lifetime. This makes the Roth IRA a powerful wealth transfer and estate planning tool -- funds can compound for decades beyond age 73 without forced distributions.
- Inherited Roth IRAs (from someone other than a spouse) are generally subject to the 10-year rule under SECURE Act 2.0, meaning the inherited account must be fully distributed within 10 years of the original owner's death. Spouses have additional options including treating the inherited Roth IRA as their own.

**Taxable Brokerage Account**

- No contribution limits, no income limits, no earned-income requirement. Anyone can open one and contribute any amount at any time.
- No tax advantages. Dividends are taxed in the year received (qualified dividends at preferential capital gains rates; ordinary dividends at ordinary income rates). Interest income is taxed as ordinary income. Realized capital gains are taxed in the year of sale -- short-term gains (assets held 12 months or less) at ordinary income rates, long-term gains (held more than 12 months) at 0%, 15%, or 20% depending on taxable income, with an additional 3.8% Net Investment Income Tax (NIIT) applying at higher income levels.
- Unrealized gains are not taxed. This creates opportunities for tax management. "Tax-loss harvesting" involves selling positions at a loss to offset realized gains, reducing the current-year tax bill. The "wash sale rule" prohibits repurchasing the same or substantially identical security within 30 days before or after the sale that generated the loss.
- The cost basis step-up at death is a major estate planning feature of taxable accounts. When a taxable account's assets are inherited, the beneficiary's cost basis resets to the fair market value on the date of death, eliminating capital gains taxes on appreciation that occurred during the original owner's lifetime.
- Asset location strategy interacts heavily with taxable accounts: tax-inefficient assets (high-dividend stocks, taxable bonds, REITs) are generally better held in tax-deferred accounts; tax-efficient assets (index funds, growth stocks held for the long term, municipal bonds) are better suited to taxable accounts. This is an optimization technique, not a rule, but it has measurable impact over long time horizons.
- No withdrawal restrictions, no penalties, no RMDs. Full liquidity at all times.

**Health Savings Account (HSA)**

- Eligibility requires enrollment in a qualifying High-Deductible Health Plan (HDHP). The IRS defines minimum deductibles and maximum out-of-pocket limits for HDHP qualification -- these change annually. You cannot be enrolled in Medicare, cannot be claimed as a dependent on another person's return, and cannot have other disqualifying health coverage (with limited exceptions for certain dental, vision, and disability insurance).
- The triple tax advantage: (1) contributions are tax-deductible (or pre-tax through payroll, which also avoids FICA taxes -- an additional advantage not available with IRA contributions), (2) growth is tax-free, and (3) withdrawals for qualified medical expenses are tax-free at any age. No other account type provides all three simultaneously.
- Contribution limits are lower than retirement accounts and are set annually. Separate limits apply for self-only HDHP coverage versus family coverage. Individuals aged 55 or older (not yet enrolled in Medicare) may make an additional catch-up contribution.
- HSA funds roll over indefinitely -- there is no use-it-or-lose-it rule. This distinguishes the HSA from a Flexible Spending Account (FSA), which typically has a use-it-or-lose-it provision within the plan year (with limited grace period or rollover options).
- After age 65, HSA funds can be withdrawn for any purpose without the 20% non-qualified withdrawal penalty, though such withdrawals become taxable as ordinary income -- making the account function identically to a Traditional IRA for non-medical spending. Before age 65, non-qualified withdrawals are subject to both ordinary income tax and the 20% penalty.
- The strategic HSA approach involves paying current medical expenses out-of-pocket (if cash flow permits), saving receipts indefinitely, investing HSA funds in growth assets, and reimbursing yourself for past qualified medical expenses years or decades later -- tax-free. The IRS does not require same-year reimbursement. This transforms the HSA into an additional tax-advantaged investment vehicle.
- HSA investment options vary significantly by plan administrator. Some HSA custodians offer robust investment menus; others hold all balances in cash. Choosing an HSA custodian (when self-employed) or optimizing around the employer-selected HSA is an important consideration.

**Self-Employed Retirement Accounts: SEP IRA, Solo 401(k), SIMPLE IRA**

Present these when the user is self-employed or has self-employment income alongside W-2 employment.

- **SEP IRA (Simplified Employee Pension):** Contributions are made entirely by the employer (meaning the self-employed person). The contribution limit is significantly higher than the standard IRA limit -- up to 25% of net self-employment income, subject to an annual dollar maximum. Contributions are pre-tax, growth is tax-deferred. No Roth option. No employee salary-deferral mechanism -- the "employee" (the self-employed person) cannot elect to defer wages; the contribution is always an employer contribution. Simple to establish and administer. Employees of the business must receive proportional contributions if the owner contributes for themselves.
- **Solo 401(k) (Individual 401(k)):** Available only to self-employed individuals with no full-time W-2 employees other than a spouse. Combines an employee elective deferral component (subject to the standard employee limit, shared with any other 401(k) at the same employer) and an employer profit-sharing component (up to 25% of net self-employment compensation). The combined limit across both components is substantially higher than a SEP IRA for lower-income self-employed individuals. Offers a Roth option, a loan provision, and the ability to make after-tax contributions in plans with mega backdoor Roth features. More complex to establish and requires annual filings once assets exceed a threshold. Must be established by December 31 of the tax year for which you want to make contributions (unlike SEP IRA contributions, which can be made up to the tax filing deadline including extensions).
- **SIMPLE IRA:** Designed for small businesses with 100 or fewer employees. Employees can make salary deferrals up to a defined limit (lower than the 401(k) limit). Employers are required to make either matching contributions (up to 3% of compensation) or a flat 2% nonelective contribution for all eligible employees. Less complex than a 401(k). A distinctive feature: early withdrawals within the first two years of plan participation are subject to a 25% penalty rather than the standard 10%.

---

### Step 4: Build the Comparison Table Populated With the User's Relevant Accounts

Generate the comparison table including only the accounts relevant to the user's situation. Include a minimum of three account types. For a standard employed user, the core table should cover Traditional 401(k), Roth 401(k) (if available), Roth IRA, Traditional IRA, HSA (if HDHP-eligible), and Taxable Brokerage. Use the full Output Format template below. Fill all cells with real descriptive language -- never leave a cell blank or use generic placeholders like "varies."

---

### Step 5: Explain the Three Most Important Structural Tradeoffs for This User's Context

Do not list every possible tradeoff. Identify the three most material tradeoffs given what you know about the user's situation and explain each one with enough specificity to be useful.

**Tradeoff 1 -- Tax timing (Traditional vs. Roth):**
The core question is whether marginal tax rates are higher now or in retirement. Early-career earners often have lower current income and may expect higher future income, making Roth options compelling. Mid-career high earners often benefit more from the current deduction of Traditional contributions. The honest answer is that future tax rates are uncertain (tax law changes, income changes), and diversifying across both Traditional and Roth account types is a common hedge. Roth also provides additional value if the user anticipates estate planning needs or wants flexibility to avoid RMDs.

**Tradeoff 2 -- Liquidity and access:**
Retirement accounts impose restrictions that are structural, not incidental. If a user has inadequate emergency reserves, directing all available savings into penalty-restricted accounts creates financial fragility. The general guidance in personal finance prioritizes liquid emergency reserves before maximizing retirement accounts. The Roth IRA's contribution-withdrawal flexibility partially bridges the gap between retirement savings and liquidity. The taxable brokerage provides full liquidity but no tax advantages.

**Tradeoff 3 -- Employer match capture:**
If an employer matches 401(k) contributions, the match represents an immediate guaranteed return on the contribution equal to the match percentage -- a 50% match on contributions up to 6% of salary provides an immediate 50% return on that 6% before any investment growth occurs. This is the most powerful first step in most contribution strategies. Understanding the vesting schedule is critical -- unvested employer contributions are not yet the employee's property.

---

### Step 6: Address the Contribution Priority Question If Raised

Users frequently ask "where should I put my money first?" This is a prioritization question, not an account-type question, but it naturally arises here. Present the standard financial planning framework as a structural ordering approach without recommending a specific strategy for the individual:

1. Contribute enough to the 401(k) to capture the full employer match (if available) -- this is the highest guaranteed return step
2. Fund an HSA to the maximum if HDHP-eligible (triple tax advantage)
3. Fund a Roth IRA to the maximum (if income-eligible) -- flexible, tax-free growth, no RMDs
4. Return to the 401(k) and contribute up to the full elective deferral limit
5. Fund a taxable brokerage account with remaining investable assets

Note explicitly that this ordering is a widely cited framework -- not a universal rule -- and individual circumstances (debt levels, emergency fund adequacy, specific tax situation, expected retirement date) affect where a user should start. Refer the user to a financial professional for personalized sequencing decisions.

---

### Step 7: Provide Concrete Next Steps Tied to This User's Specific Situation

Tailor next steps to what was revealed in Step 1. Do not give generic advice. If the user doesn't know their employer match formula, the first next step is to find out. If they don't know whether they qualify for Roth IRA contributions, the next step is to check their MAGI against current income limits. If they are self-employed, the next step may be researching whether a SEP IRA or Solo 401(k) better fits their income level and administrative capacity.

Always include the referral to appropriate professional resources and companion skills:
- `risk-tolerance-assessment` if investment selection within accounts is the next question
- `retirement-savings-calculator` if they want to model how much to save
- `investment-fee-analyzer` if they want to evaluate the cost of their 401(k) fund options
- `tax-advantaged-optimizer` for contribution sequencing and tax-bracket analysis

---

## Output Format

```
## Investment Account Type Comparison

> Note: Contribution limits, income thresholds, penalty rules, and tax rates referenced
> in this comparison are subject to change annually. Verify all current-year figures
> at the IRS website (irs.gov) or equivalent official tax authority for your jurisdiction.

---

### Your Situation Summary

| Factor | Your Details |
|--------|-------------|
| Employment type | [W-2 employee / self-employed / both] |
| Employer plan available | [Yes -- 401(k) / Yes -- 403(b) / Yes -- 457(b) / No] |
| Employer match | [Yes: [describe structure if known] / No / Unknown -- check HR or plan documents] |
| HDHP enrollment | [Yes -- HSA-eligible / No / Unknown] |
| Existing accounts | [List accounts already open, or "None mentioned"] |
| Primary goal | [Retirement / General investing / Healthcare savings / Combination] |
| Time horizon | [Estimated years until funds needed, or "Not specified"] |

---

### Account Type Structural Comparison

| Feature | Trad. 401(k) | Roth 401(k) | Roth IRA | Traditional IRA | HSA | Taxable Brokerage |
|---------|-------------|------------|---------|----------------|-----|------------------|
| Contribution tax treatment | Pre-tax -- reduces taxable income now | After-tax -- no deduction | After-tax -- no deduction | Pre-tax if deductible; after-tax if non-deductible | Pre-tax (or pre-FICA via payroll) | After-tax |
| Growth tax treatment | Tax-deferred | Tax-free | Tax-free | Tax-deferred | Tax-free | Currently taxable (dividends, realized gains) |
| Withdrawal tax treatment | Ordinary income tax | Tax-free (if qualified) | Tax-free (if qualified) | Ordinary income tax | Tax-free for qualified medical; ordinary income for non-qualified after 65 | Long-term capital gains rate on gains; ordinary income on short-term gains and dividends |
| 2024 contribution limit | Employee deferral limit (verify IRS) | Shared with Trad. 401(k) | IRA annual limit (verify IRS) | Shared with Roth IRA | Self-only or family HDHP limit (verify IRS) | No limit |
| Catch-up (age 50+) | Additional catch-up amount (verify IRS; SECURE 2.0 enhanced 60-63 catch-up) | Same as Trad. 401(k) | Additional catch-up amount (verify IRS) | Additional catch-up amount (verify IRS) | Age 55+ additional catch-up (verify IRS) | N/A |
| Income limit to contribute | None | None | Phase-out range above MAGI threshold (verify IRS by filing status) | Deductibility phases out with workplace plan; contribution always allowed | Must be enrolled in qualifying HDHP; cannot have Medicare | None |
| Employer contributions | Employer match and profit-sharing allowed; subject to 415 limit | Employer match always pre-tax even if employee chose Roth | Not applicable | Not applicable | Employer can contribute; counts toward annual limit | Not applicable |
| Early withdrawal (before 59½) | 10% penalty + ordinary income tax; exceptions apply | 10% penalty on earnings (not contributions); separate 5-year rule per conversion | Contributions: no penalty; earnings: 10% penalty unless qualified | 10% penalty + ordinary income tax; exceptions apply | 20% penalty + ordinary income tax for non-qualified withdrawals | No penalty; capital gains tax applies on gains |
| Key early withdrawal exceptions | Age 55 separation, SEPP/72(t), QDRO, disability, death, certain medical | Same as Trad. 401(k) | First-time home purchase (lifetime limit), education, disability, death, health insurance during unemployment | Same as Roth IRA | Qualified medical expenses are always penalty- and tax-free at any age | No restrictions |
| Required Minimum Distributions | Yes, beginning at age 73 | Yes, beginning at age 73 (avoid by rolling to Roth IRA) | None during original owner's lifetime | Yes, beginning at age 73 | None until non-qualified at 65 functions like IRA | None |
| Investment flexibility | Limited to plan menu (employer-selected funds) | Limited to plan menu | Full -- stocks, bonds, ETFs, mutual funds, REITs, options (custodian dependent) | Full -- same as Roth IRA | Depends on HSA custodian; many offer investment menu above cash threshold | Full -- widest selection including individual stocks, bonds, ETFs, options |
| Portability | Rollover to IRA or new employer 401(k) on separation | Roll to Roth IRA on separation (avoids RMD issue) | Fully portable -- no employment link | Fully portable | Portable; remains open after HDHP changes but cannot contribute without HDHP | Fully portable |

---

### Key Tradeoffs for Your Situation

1. **[Tradeoff name]:** [2-4 sentence explanation grounded in the user's specific income level, career stage, or employer situation]
2. **[Tradeoff name]:** [2-4 sentence explanation]
3. **[Tradeoff name]:** [2-4 sentence explanation]

---

### Contribution Prioritization Framework (Structural Reference)

| Priority Order | Account Action | Key Condition |
|---------------|---------------|--------------|
| 1st | 401(k) contributions up to full employer match | Employer match available; check vesting schedule |
| 2nd | HSA contributions to maximum | Must be enrolled in qualifying HDHP |
| 3rd | Roth IRA to maximum | Income below phase-out threshold |
| 4th | 401(k) contributions to full deferral limit | After IRA is maxed |
| 5th | Taxable brokerage | After all tax-advantaged limits utilized |

*This ordering represents a widely cited framework, not personalized advice. Individual circumstances affect the optimal sequence.*

---

### Terminology Quick Reference

| Term | Plain-Language Definition |
|------|--------------------------|
| Pre-tax contribution | Money goes in before income tax is calculated; reduces this year's taxable income |
| After-tax contribution | Money goes in after income tax; no current-year deduction |
| Tax-deferred growth | Gains accumulate without annual tax; tax is owed when withdrawn |
| Tax-free growth | Gains accumulate and qualified withdrawals are never taxed |
| MAGI | Modified Adjusted Gross Income -- income figure used for IRA eligibility; calculated on your tax return |
| Vesting | The process by which employer contributions become permanently yours over time |
| RMD | Required Minimum Distribution -- mandatory annual withdrawal from pre-tax retirement accounts starting at age 73 |
| 5-year rule | Roth IRA rule requiring account to be at least 5 years old for earnings to be withdrawn tax-free |
| Rollover | Moving funds from one retirement account to another without triggering taxes |
| Cost basis | The original purchase price of an investment; used to calculate capital gains or losses |

---

### Questions to Discuss With a Financial Professional

- [Specific question about the user's employer match structure and vesting schedule]
- [Specific question about whether Traditional or Roth is better given their current and expected future income]
- [Specific question about HSA eligibility given their health plan enrollment]
- [Specific question about any existing IRA basis tracked on Form 8606]
- [Any question raised by information the user mentioned that requires professional judgment]

---

### Next Steps

- [ ] Verify this year's 401(k), IRA, and HSA contribution limits at irs.gov (Publication 590-A for IRAs, IRS Notice for 401(k) limits)
- [ ] Obtain your employer's Summary Plan Description to understand match formula, vesting schedule, and fund options
- [ ] Check whether your employer's 401(k) plan offers a designated Roth option
- [ ] Calculate your MAGI and compare it to current Roth IRA phase-out thresholds to determine direct contribution eligibility
- [ ] If HDHP-eligible, confirm your HSA custodian's investment options and minimum balance to invest
- [ ] [Skill referral based on user's next question -- e.g., portfolio allocation, retirement calculator, fee analysis]
```

---

## Rules

1. **Never state specific dollar contribution limits as facts.** Contribution limits for 401(k), IRA, HSA, and catch-up provisions are indexed to inflation and change annually. Always direct the user to verify current limits at the IRS website (irs.gov, specifically IRS Notice for retirement plans and Publication 590-A/590-B for IRAs). Stating outdated figures as current is more harmful than omitting the number.

2. **Never recommend a specific account type as the right choice for the user.** Account type selection is dependent on marginal tax rate (current and projected), income trajectory, employer match availability, liquidity needs, estate planning goals, and state tax treatment. All of these require professional judgment and individual information that cannot be fully gathered in a conversation. Present accounts as structural tools with defined characteristics, not ranked recommendations.

3. **Always distinguish between the two separate Roth 5-year rules.** The 5-year rule for Roth IRA contributions (one clock per taxpayer, starts January 1 of the first year any Roth IRA contribution was made) is different from the 5-year rule for Roth conversions (a separate clock starts for each conversion). Conflating these two rules leads to serious misunderstanding of when Roth funds can be accessed penalty-free.

4. **Always clarify the difference between the employee deferral limit and the overall plan limit.** The employee elective deferral limit (what the employee can contribute) is distinct from the Section 415 overall annual additions limit (the total of all contributions to the plan including employer match and profit-sharing). Employer contributions do not reduce the employee's deferral room. This is a commonly misunderstood distinction.

5. **Never omit the employer match vesting schedule when discussing 401(k) contributions.** An employer match that is not yet vested is not the employee's money. A user who leaves an employer before vesting may forfeit some or all employer contributions. The match is a key reason to prioritize 401(k) contributions, but the vesting schedule is a key reason to understand the commitment involved.

6. **Always include the pro-rata rule when discussing Traditional IRA non-deductible contributions or Backdoor Roth.** The pro-rata rule determines the taxable portion of any IRA distribution or conversion when the account holder has a mix of pre-tax and after-tax (basis) funds across all Traditional, SEP, and SIMPLE IRA accounts. Omitting this rule causes users to incorrectly assume a Backdoor Roth conversion will always be tax-free.

7. **Distinguish HSA from FSA when the HSA is mentioned.** Flexible Spending Accounts are commonly confused with Health Savings Accounts. The critical structural difference is that FSA funds typically do not roll over (use-it-or-lose-it), FSAs do not require HDHP enrollment, and FSAs are not investment accounts. Never describe HSA features in a way that could be confused with FSA limitations, and vice versa.

8. **Always note that Roth 401(k) accounts are subject to RMDs, unlike Roth IRAs.** This is one of the most practically important distinctions between the two Roth account types. The solution -- rolling the Roth 401(k) to a Roth IRA at separation from employment -- should be mentioned whenever Roth 401(k) RMD rules come up.

9. **When presenting the contribution prioritization framework, always label it as a framework, not a prescription.** The standard priority order (match, HSA, Roth IRA, 401(k), taxable) is a widely taught heuristic, not a universal rule. Users with high consumer debt, inadequate emergency funds, or unusual tax situations may need a different sequence. Presenting the framework as the answer rather than a starting point is incorrect.

10. **Never conflate self-employed plan types.** SEP IRAs, Solo 401(k)s, and SIMPLE IRAs serve self-employed individuals but have meaningfully different contribution mechanics, Roth availability, loan provisions, establishment deadlines, and employee-coverage rules. A user with employees cannot use a Solo 401(k). A user wanting the highest possible contribution at low-to-moderate income may find the Solo 401(k)'s employee-deferral component more powerful than the SEP IRA. Never describe these as interchangeable alternatives.

---

## Edge Cases

### Edge Case 1: User Wants to Do a Backdoor Roth IRA

The Backdoor Roth IRA is a two-step process used when income exceeds the direct Roth IRA contribution limit. Step 1: make a non-deductible Traditional IRA contribution (after-tax money). Step 2: convert that Traditional IRA balance to a Roth IRA, paying tax on any pre-tax amounts converted.

The critical complication is the pro-rata rule: if the user has any pre-tax money in any Traditional, SEP, or SIMPLE IRA (not Roth IRA, not 401(k)), the conversion is not entirely tax-free. The taxable portion is calculated as total pre-tax IRA funds divided by total IRA funds across all accounts. A user with $95,000 in a Traditional IRA and $5,000 in a new non-deductible contribution cannot cleanly convert only the $5,000 -- 95% of whatever amount they convert is taxable. The solution for such users is often to "roll" existing pre-tax IRA funds into an employer 401(k) (if the plan accepts incoming rollovers) to clear the pro-rata issue before doing the conversion. This strategy requires careful sequencing and should be flagged as requiring professional guidance.

Non-deductible IRA contributions must be tracked annually using IRS Form 8606. Failure to file Form 8606 can result in double taxation on withdrawal.

### Edge Case 2: User Is Self-Employed With Fluctuating Income

Irregular income complicates retirement account selection. SEP IRA contributions are a percentage of net self-employment income, so a low-income year naturally produces a smaller contribution -- this built-in flexibility is a feature, not a limitation. The deadline for SEP IRA contributions is the tax filing deadline including extensions (potentially October 15), which provides timing flexibility.

Solo 401(k) contributions have two components with different deadlines: the employee elective deferral must be elected by December 31 of the tax year (even if funded later), while the employer profit-sharing component can be contributed up to the filing deadline including extensions. The December 31 plan establishment deadline is hard -- a Solo 401(k) cannot be set up retroactively for the prior tax year.

For a self-employed person who also has W-2 income with a 401(k), the employee elective deferral limit is shared across all employer plans -- the limit applies per person, not per plan. However, employer profit-sharing contributions to a Solo 401(k) are subject to the 415 limit of that separate plan.

### Edge Case 3: User Is Approaching or Has Passed Age 73 (RMD Territory)

Required Minimum Distributions fundamentally change account management strategy. Once RMDs begin, the user is forced to take distributions from Traditional/pre-tax accounts regardless of whether they need the income -- potentially pushing them into higher tax brackets and increasing Medicare premium income-related adjustments (IRMAA surcharges on Parts B and D).

Key RMD facts: the first RMD can be delayed until April 1 of the year following the year the account holder turns 73, but delaying results in two RMDs in that second year (the delayed first RMD plus the current year's RMD), which can cause an unexpected income spike. The penalty for failing to take RMDs is 25% of the shortfall (reduced from 50% under SECURE Act 2.0, and potentially further reduced to 10% if corrected promptly). Qualified Charitable Distributions (QCDs) allow up to a specified annual limit to be transferred directly from an IRA to a qualified charity, satisfying RMD requirements without the distribution entering taxable income -- a valuable strategy for charitably inclined retirees.

If the user is still working at age 73 and participating in their current employer's 401(k), they may be able to delay RMDs from that specific plan (not from IRAs or former employer plans) until actual retirement. This "still-working exception" does not apply to someone who owns more than 5% of the business.

### Edge Case 4: User Asks About Accounts for a Minor (UGMA/UTMA and Custodial Roth IRA)

Standard retirement accounts require earned income and are held in the account holder's own name. For minors, two distinct structures exist:

**Custodial taxable accounts (UGMA/UTMA):** An adult establishes and manages the account with the minor as beneficiary. The account invests in securities with no tax advantages. Kiddie Tax rules apply -- unearned income above a threshold is taxed at the parent's marginal rate for children under 19 (or under 24 if full-time students). The account transfers irrevocably to the minor at the age of majority (18 or 21, depending on the state). There is no way to reclaim funds once transferred.

**Custodial Roth IRA:** If a minor has earned income (wages from legitimate work -- not allowances or gifts), a parent or guardian can open a custodial Roth IRA in the minor's name. Contributions are limited to the lesser of the annual IRA limit or the minor's actual earned income for the year. This is a powerful long-term compounding vehicle -- contributions made at age 15 have over 50 years of potential tax-free growth before the standard retirement age. The account converts to the minor's sole control at the age of majority. Verify state-specific custodial account rules, as some states have age-of-majority variations.

529 education savings accounts are a separate category with distinct rules around qualified education expenses, state tax deductions, and beneficiary changes -- do not conflate them with the investment accounts covered in this skill.

### Edge Case 5: User's 401(k) Plan Has Very High Expense Ratios

Not all 401(k) plans are created equal. Some employer plans, particularly those at small companies, offer only actively managed mutual funds with expense ratios of 0.75% to 1.5% or higher. Over long time horizons, high expenses can meaningfully reduce terminal account values relative to low-cost alternatives.

Even in a poor 401(k) plan, the employer match is almost always worth capturing because the immediate guaranteed return of the match exceeds the drag of higher fund expenses. However, contributions beyond the match may be better directed to an IRA (which offers full investment flexibility and access to low-cost index funds) before returning to the 401(k) for additional contributions.

When this situation arises, point the user toward the `investment-fee-analyzer` skill for a cost-impact calculation. Also note that some 401(k) plans offer a self-directed brokerage window (sometimes called a SDBA) that allows investment in a broader universe of securities including low-cost ETFs -- not all participants are aware this option exists in their plan. Checking the plan's Summary Plan Description or contacting the plan administrator will reveal whether a brokerage window is available.

### Edge Case 6: User Has Left an Employer and Has an Old 401(k)

A terminated employee generally has four options for an old 401(k): (1) leave it in the former employer's plan, (2) roll it over to the new employer's 401(k) (if the new plan accepts incoming rollovers), (3) roll it over to a Traditional IRA, or (4) cash it out (triggering taxes and potentially the 10% early withdrawal penalty).

Cashing out is almost always the worst option due to the combined tax and penalty cost and the loss of decades of tax-deferred compounding. The key decision is between leaving it in place, rolling to a new plan, or rolling to an IRA. Rolling to an IRA provides the widest investment flexibility and consolidates accounts. Rolling to a new employer plan preserves the "still-working exception" to RMDs and maintains 401(k) creditor protection in some states (which can exceed IRA creditor protection levels). Leaving it in the old plan is simplest but depends on the old plan's quality and willingness to hold small balances.

A direct rollover (funds transferred directly from the old plan to the new custodian) avoids mandatory 20% withholding that applies to indirect rollovers (where the check is issued to the account holder). If an indirect rollover occurs, the account holder must deposit 100% of the original balance (making up the 20% withheld from personal funds) within 60 days to avoid taxes and penalties. The withheld 20% is later recovered as a tax credit when the return is filed, but the cash flow requirement can be significant.

### Edge Case 7: User Is a High Earner Who Has Maximized All Tax-Advantaged Accounts

After maxing out 401(k) employee deferrals, Roth IRA (via Backdoor Roth if needed), and HSA, high earners may have access to additional strategies:

**After-tax 401(k) contributions with Mega Backdoor Roth:** Some 401(k) plans allow after-tax contributions beyond the employee deferral limit, up to the Section 415 overall plan limit. These after-tax contributions can then be converted to Roth (either in-plan via an in-plan Roth conversion, or by rolling them to a Roth IRA after separation). This strategy can allow significantly higher Roth contributions than standard limits allow. The plan must specifically permit after-tax contributions and in-service distributions or in-plan conversions -- not all plans do.

**Deferred Compensation Plans (457(b) for eligible employers):** Government employees and employees of certain nonprofits with 457(b) plans have a completely separate contribution limit from their 403(b) or 401(k), effectively doubling available pre-tax deferral capacity.

**Taxable brokerage with tax-efficient investing:** Once all tax-advantaged space is used, the taxable brokerage with asset location optimization, tax-loss harvesting, and direct indexing (available at some custodians for large account values) becomes the primary vehicle.

In this edge case, note that the user's complexity level exceeds what this skill can fully address and professional wealth management or tax planning guidance is especially important.

---

## Example

**Input:** "I'm 31 years old, earning about $95,000 per year as a software developer at a tech company. My employer offers a 401(k) with a 50% match on up to 6% of my salary. I've never invested before. I keep hearing about Roth IRAs too. I also have a high-deductible health plan through work. Where do I even start?"

---

**Output:**

## Investment Account Type Comparison

> Note: Contribution limits, income thresholds, and tax rules change annually. Verify all current-year figures at irs.gov. This comparison is educational -- consult a qualified financial professional before making contribution decisions.

---

### Your Situation Summary

| Factor | Your Details |
|--------|-------------|
| Employment type | W-2 employee (tech company) |
| Employer plan available | Yes -- 401(k) |
| Employer match | Yes -- 50% match on first 6% of salary. At $95,000 salary, contributing 6% ($5,700) earns a $2,850 employer match annually. |
| HDHP enrollment | Yes -- HSA-eligible |
| Existing accounts | None |
| Primary goal | Beginning long-term retirement savings |
| Time horizon | Approximately 34 years to standard retirement age (65), potentially longer |

---

### Account Type Structural Comparison

| Feature | Traditional 401(k) | Roth 401(k) | Roth IRA | HSA | Taxable Brokerage |
|---------|-------------------|------------|---------|-----|------------------|
| Contribution tax treatment | Pre-tax -- reduces your $95,000 taxable income in the contribution year | After-tax -- no deduction; contributed from take-home pay | After-tax -- no current deduction | Pre-tax via payroll (also avoids FICA, a unique advantage) | After-tax -- no tax benefit on contribution |
| Growth tax treatment | Tax-deferred -- grows without annual taxation | Tax-free -- grows without annual taxation | Tax-free -- grows without annual taxation | Tax-free -- grows without annual taxation | Currently taxable -- dividends and realized gains taxed each year |
| Withdrawal tax treatment | Fully taxable as ordinary income at your retirement tax rate | Tax-free for qualified distributions (account 5+ years old, age 59½+) | Tax-free for qualified distributions (same conditions as Roth 401k) | Tax-free for qualified medical expenses; ordinary income (no penalty) for non-medical after 65 | Long-term capital gains rate on gains held 12+ months; ordinary income on short-term gains and dividends |
| 2024 contribution limit | $23,000 employee deferral (verify IRS); shared with Roth 401(k) | $23,000 shared limit with Traditional 401(k) | $7,000 (verify IRS); shared with Traditional IRA | $4,150 self-only / $8,300 family HDHP (verify IRS) | No limit |
| Catch-up (age 50+) | Not yet applicable; $7,500 additional at 50 | Same | $1,000 additional at 50 | $1,000 additional at 55 | N/A |
| Income limit to contribute | None | None | At $95,000 single income (hypothetical), you are well below the phase-out; verify current limits at IRS | Must maintain HDHP enrollment; you are currently eligible | None |
| Employer contributions | Your employer contributes $2,850 matching when you contribute 6% ($5,700) -- this does not count
