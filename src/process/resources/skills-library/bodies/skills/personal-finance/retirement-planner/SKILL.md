---
name: retirement-planner
description: |
  Comprehensive retirement planning using the 25x rule, 4% safe withdrawal rate, Social Security optimization, 401k employer match maximization, Roth vs Traditional IRA analysis, catch-up contributions, retirement age scenarios, and withdrawal strategies.
  Use when the user asks about retirement planner, or needs help with comprehensive retirement planning using the 25x rule, 4% safe withdrawal rate, social security optimization, 401k employer match maximization, roth vs traditional ira analysis, catch-up contributions, retirement age scenarios, and withdrawal strategies.
  Do NOT use when the request requires professional financial advice or falls outside the scope of retirement planner.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "personal-finance retirement-planning guide"
  category: "personal-finance"
  subcategory: "retirement-planning"
  depends: ""
  disclaimer: "educational-finance"
  difficulty: "intermediate"
---

# Retirement Planner

> **Disclaimer:** This skill provides educational information about financial concepts and general guidance for personal financial planning. It does NOT constitute financial advice, investment recommendations, or tax guidance. Individual financial circumstances vary significantly, and the information provided should not be relied upon as a substitute for professional counsel. Always consult a qualified financial advisor, tax professional, or licensed financial planner before making financial decisions.

## When to Use

**Use this skill when:**
- User wants to plan for retirement and understand how much they need to save
- User needs help choosing between retirement account types (401k, IRA, Roth)
- User wants to calculate their retirement readiness or savings gap
- User needs a retirement savings strategy based on their age and income

**Do NOT use this skill when:**
- User needs specific investment selection within retirement accounts -- use investment-advisor
- User needs Social Security optimization -- specialized topic beyond general planning
- User needs estate planning -- use estate planning skills

## Process

1. **Step 1:** Gather current financial snapshot: age, income, savings, employer benefits
2. **Step 2:** Estimate retirement needs using replacement ratio (70-80% of pre-retirement income)
3. **Step 3:** Calculate savings gap: what user has vs. what they need
4. **Step 4:** Recommend account types and contribution strategy
5. **Step 5:** Build year-by-year savings plan with milestones and adjustment triggers

## Purpose

This skill helps users calculate their retirement number, optimize retirement accounts, plan contribution strategies, and model different retirement age scenarios. It provides frameworks for making informed decisions about one of life's most important financial goals.

---

## Questions to Ask the User First

1. **Current age and desired retirement age:** How old are you now? When do you want to retire?
2. **Current retirement savings:** Total across all retirement accounts (401k, IRA, Roth, pension, etc.)?
3. **Current annual income:** Gross and take-home?
4. **Current savings rate:** How much are you contributing to retirement accounts annually?
5. **Employer match:** Does your employer match 401k contributions? What is the formula (e.g., 50% of first 6%)?
6. **Desired retirement lifestyle:** Do you expect to spend more, less, or the same as you do now in retirement?
7. **Monthly expenses today:** What do you spend per month currently?
8. **Social Security expectations:** Do you plan to factor in Social Security? Have you checked your estimated benefit at ssa.gov?
9. **Health considerations:** Any health factors that affect planning (early retirement before Medicare at 65)?
10. **Other income sources:** Pension, rental income, part-time work, inheritance expectations?
11. **Debt:** Will you be debt-free (including mortgage) by retirement?
12. **Risk tolerance:** Conservative, moderate, or aggressive investment approach?

---

## The Retirement Number

### The 25x Rule

Your retirement number is 25 times your expected annual retirement spending. This is derived from the 4% safe withdrawal rate.

```
RETIREMENT NUMBER CALCULATOR
=============================
Step 1: Estimate annual retirement spending
  Current annual spending:            $__________
  Adjustments for retirement:
    - Remove: commuting, work clothes,
      payroll taxes, retirement savings    -$__________
    + Add: healthcare, travel, hobbies     +$__________
  Estimated annual retirement spending:    $__________

Step 2: Calculate your retirement number
  Annual spending x 25 = retirement number
  $__________ x 25 = $__________

  THIS IS YOUR TARGET.

Step 3: Adjust for Social Security (optional)
  Expected annual SS benefit:         $__________
  Spending minus SS:                  $__________
  Adjusted retirement number (x25):   $__________
```

### The 4% Rule (Safe Withdrawal Rate)

**Origin:** The Trinity Study found that withdrawing 4% of your portfolio in year one, then adjusting for inflation each year, has historically sustained a portfolio for 30+ years with high probability.

**How it works:**
1. Year 1: Withdraw 4% of starting portfolio
2. Each subsequent year: Increase withdrawal by inflation rate
3. Portfolio should last 30 years with ~95% historical success rate

**Example:**
```
Portfolio: $1,000,000
Year 1 withdrawal: $40,000 (4%)
Year 2 (3% inflation): $41,200
Year 3 (3% inflation): $42,436
...and so on
```

**Conservative alternatives:**
- 3.5% withdrawal rate for 40+ year retirements (early retirees)
- 3.0% withdrawal rate for maximum safety
- Variable percentage: withdraw less in down markets, more in up markets

---

## Social Security Optimization

### Claiming Age Impact

```
SOCIAL SECURITY CLAIMING ANALYSIS
==================================
Full Retirement Age (FRA) benefit: $__________ /month

Claiming at 62 (earliest):
  Reduction: ~30% from FRA benefit
  Monthly: $__________
  Annual: $__________
  Break-even vs. FRA: approximately age 78-80

Claiming at FRA (66-67):
  Monthly: $__________
  Annual: $__________

Claiming at 70 (maximum):
  Increase: ~24-32% above FRA benefit (8% per year of delay)
  Monthly: $__________
  Annual: $__________
  Break-even vs. FRA: approximately age 80-82
```

**General guidance:**
- Expect to live past 80? Delay claiming as long as possible (up to 70)
- Need the income immediately? Claim earlier
- Married? Coordinate spousal strategies (higher earner delays, lower earner claims earlier)
- Health concerns? Earlier claiming may be appropriate

### Spousal Strategy

The higher-earning spouse should generally delay to 70. This maximizes:
1. The higher earner's benefit during both lifetimes
2. The survivor benefit (the surviving spouse gets the higher of the two benefits)

---

## 401(k) Employer Match Maximization

### Understanding Match Formulas

```
COMMON MATCH FORMULAS
=====================
Type A: "100% match on first 3%"
  Your salary: $80,000
  You contribute 3% ($2,400) --> Employer adds $2,400
  Total: $4,800 per year in retirement savings
  YOU MUST contribute at least 3% to get the full match.

Type B: "50% match on first 6%"
  Your salary: $80,000
  You contribute 6% ($4,800) --> Employer adds $2,400
  Total: $7,200 per year
  YOU MUST contribute at least 6% to get the full match.

Type C: "Dollar-for-dollar up to 4%"
  Your salary: $80,000
  You contribute 4% ($3,200) --> Employer adds $3,200
  Total: $6,400 per year
  YOU MUST contribute at least 4% to get the full match.

YOUR MATCH
==========
Match formula: __________
Salary: $__________
Minimum contribution to maximize match: ___% = $__________
Employer match amount: $__________
TOTAL ANNUAL BENEFIT: $__________

Not getting the full match = leaving $__________ of free money per year.
```

### Vesting Schedule
- **Immediate vesting:** Employer match is yours right away
- **Cliff vesting:** 100% vesting after X years (usually 3)
- **Graded vesting:** Partial vesting over time (e.g., 20% per year for 5 years)
- **Know your vesting schedule before leaving a job**

---

## Roth vs. Traditional IRA Deep Dive

```
ROTH vs TRADITIONAL COMPARISON
===============================
                        Traditional IRA       Roth IRA
Contribution limit      $7,000 (2024)         $7,000 (2024)
Catch-up (50+)         +$1,000               +$1,000
Tax on contributions    Deductible (if elig.)  Not deductible
Tax on growth           Tax-deferred           Tax-free
Tax on withdrawal       Ordinary income tax    Tax-free (if qualified)
RMDs                    Yes, starting age 73   None during owner's lifetime
Income limits           None for contributions MAGI limits apply
                        (deduction may phase   Single: $161k-$176k
                        out with employer plan) MFJ: $240k-$254k
Early withdrawal        10% penalty + taxes    Contributions: anytime tax-free
                        (before 59.5)          Earnings: 10% penalty + taxes
```

### Backdoor Roth IRA (for high earners)

If your income exceeds Roth IRA limits:
1. Contribute to a Traditional IRA (non-deductible)
2. Convert to Roth IRA shortly after
3. Pay tax on any gains between contribution and conversion (usually minimal)
4. **Warning:** Pro-rata rule applies if you have other pre-tax IRA balances

---

## Catch-Up Contributions

| Account | Standard Limit (2024) | Catch-Up (50+) | Total (50+) |
|---------|----------------------|----------------|-------------|
| 401(k) | $23,000 | +$7,500 | $30,500 |
| IRA (Traditional/Roth) | $7,000 | +$1,000 | $8,000 |
| HSA (individual) | $4,150 | +$1,000 (55+) | $5,150 |
| HSA (family) | $8,300 | +$1,000 (55+) | $9,300 |
| 403(b) | $23,000 | +$7,500 | $30,500 |
| SIMPLE IRA | $16,000 | +$3,500 | $19,500 |

**Strategy for late starters:** If you are behind on retirement savings, max every catch-up contribution available. The extra $8,500/year in a 401k + IRA can add $100,000+ over a decade with growth.

---

## Retirement Age Scenarios

Model different retirement ages to see the impact:

```
RETIREMENT AGE COMPARISON
==========================
Current age: ____  Current savings: $__________
Annual contribution: $__________  Expected return: ____%

Scenario A: Retire at 55 (early)
  Years to save: ____
  Portfolio at 55: $__________
  Years in retirement (to 90): 35
  Safe withdrawal (3.5%): $__________ /year
  Social Security: Delayed, not available until 62

Scenario B: Retire at 60
  Years to save: ____
  Portfolio at 60: $__________
  Years in retirement (to 90): 30
  Safe withdrawal (4%): $__________ /year
  Social Security: Available at 62 (reduced)

Scenario C: Retire at 65 (traditional)
  Years to save: ____
  Portfolio at 65: $__________
  Years in retirement (to 90): 25
  Safe withdrawal (4%): $__________ /year
  Social Security: Full benefit at FRA
  Medicare: Available

Scenario D: Retire at 67 (FRA)
  Years to save: ____
  Portfolio at 67: $__________
  Years in retirement (to 90): 23
  Safe withdrawal (4%): $__________ /year
  Social Security: Full FRA benefit
```

**Key considerations for early retirement (before 59.5):**
- 401k/IRA withdrawals face 10% penalty (exceptions: Rule of 55, 72(t) distributions, Roth contributions)
- No Medicare until 65 -- budget $500-2,000/month for health insurance
- Social Security reduced if claimed before FRA
- Longer time horizon requires more conservative withdrawal rate

---

## Withdrawal Strategies

### The Bucket Strategy

Divide retirement assets into three buckets:

```
BUCKET STRATEGY
===============
Bucket 1: SHORT-TERM (Years 1-3)
  Amount: 3 years of expenses = $__________
  Invested in: Cash, money market, short-term CDs
  Purpose: Steady income regardless of market

Bucket 2: MEDIUM-TERM (Years 4-10)
  Amount: 7 years of expenses = $__________
  Invested in: Bonds, balanced funds
  Purpose: Moderate growth, refills Bucket 1

Bucket 3: LONG-TERM (Years 11+)
  Amount: Remaining portfolio = $__________
  Invested in: Stock index funds
  Purpose: Growth to sustain decades of retirement
```

### Tax-Efficient Withdrawal Order

General guidance (varies by situation):
1. **First:** Required Minimum Distributions (RMDs) from Traditional accounts
2. **Second:** Taxable brokerage account (preferring long-term capital gains)
3. **Third:** Traditional 401k/IRA (taxed as ordinary income)
4. **Fourth:** Roth IRA (tax-free; let it grow as long as possible)

**Strategy:** Fill up lower tax brackets with Traditional withdrawals, preserve Roth for higher-bracket years or legacy.

---

## Retirement Readiness Checklist

```
RETIREMENT READINESS ASSESSMENT
================================
[ ] Retirement number calculated: $__________
[ ] Current savings on track (within 10% of target for age)
[ ] Employer match fully captured
[ ] Debt-free (or will be by retirement)
[ ] Emergency fund of 6-12 months
[ ] Health insurance plan for gap years (if retiring before 65)
[ ] Social Security strategy decided (claiming age)
[ ] Estate documents in place (will, POA, healthcare directive)
[ ] Withdrawal strategy planned
[ ] Investment allocation appropriate for timeline
[ ] Long-term care insurance considered
[ ] Housing plan for retirement established
```

---

## Output Format

When delivering retirement planning guidance, provide:

1. **Current snapshot** -- Age, savings, contribution rate, employer match status
2. **Retirement number** -- Target with and without Social Security
3. **Gap analysis** -- How much more you need to save, with timeline
4. **Account optimization** -- Which accounts to prioritize and how much in each
5. **Scenario comparison** -- At least two retirement age scenarios
6. **Action plan** -- Specific steps ranked by impact
7. **Annual review items** -- What to check each year
8. **Professional referral** -- When to engage a financial planner (especially near retirement)

## Example

**Input:** "I am 35, make $80,000/year, have $40,000 in my 401k and my employer matches 4%. Am I on track for retirement at 65?"

**Output:**

## Retirement Readiness Assessment

**Current:** Age 35, income $80,000, 401k balance $40,000, employer match 4%
**Target retirement:** Age 65 (30 years away)

### Retirement Income Target
- Pre-retirement income: $80,000
- Replacement ratio: 75% = $60,000/year in today's dollars
- Adjusted for inflation (2.5%, 30 years): ~$126,000/year in future dollars
- Nest egg needed (4% rule): $60,000 x 25 = $1,500,000 in today's dollars

### Current Trajectory
| Scenario | Monthly Contribution | Employer Match | Balance at 65 (7% return) |
|----------|---------------------|----------------|--------------------------|
| Current minimum | $267 (4%) | $267 (4%) | ~$920,000 |
| Recommended | $500 (7.5%) | $267 (4%) | ~$1,430,000 |
| On-track target | $600 (9%) | $267 (4%) | ~$1,620,000 |

### Verdict: Slightly behind, but very fixable

### Action Plan
1. **Immediately:** Increase 401k contribution from 4% to at least 9% ($600/mo)
2. **This year:** Open Roth IRA and contribute $500/month ($6,000/year)
3. **Annual:** Increase contribution by 1% each year with raises
4. **Milestone check:** At age 45, you should have ~$400,000 across accounts

### Account Priority
1. 401k to 4% match (free money -- you are doing this)
2. Roth IRA to max ($7,000/year) -- tax-free growth for 30 years
3. 401k above match to 15% total savings rate
4. HSA if available (triple tax advantage)

## Edge Cases

- **Incomplete information:** Ask clarifying questions before proceeding. Do not assume details the user has not provided.
- **Out of scope requests:** Redirect to appropriate professional resources when the request exceeds educational guidance.
- **Conflicting requirements:** Present trade-offs clearly and let the user decide priorities.
