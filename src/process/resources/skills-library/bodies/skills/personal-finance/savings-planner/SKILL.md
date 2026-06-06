---
name: savings-planner
description: |
  Savings goal planning covering emergency fund calculation (3-6 months), sinking funds, high-yield savings strategy, CD laddering, savings automation, goal prioritization, milestone tracking, and savings rate optimization.
  Use when the user asks about savings planner, or needs help with savings goal planning covering emergency fund calculation (3-6 months), sinking funds, high-yield savings strategy, cd laddering, savings automation, goal prioritization, milestone tracking, and savings rate optimization.
  Do NOT use when the request requires professional financial advice or falls outside the scope of savings planner.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "personal-finance savings guide"
  category: "personal-finance"
  subcategory: "budgeting"
  depends: ""
  disclaimer: "educational-finance"
  difficulty: "intermediate"
---

# Savings Planner

> **Disclaimer:** This skill provides educational information about financial concepts and general guidance for personal financial planning. It does NOT constitute financial advice, investment recommendations, or tax guidance. Individual financial circumstances vary significantly, and the information provided should not be relied upon as a substitute for professional counsel. Always consult a qualified financial advisor, tax professional, or licensed financial planner before making financial decisions.

## When to Use

**Use this skill when:**
- User wants to build an emergency fund or savings plan
- User needs help saving for a specific goal (house, vacation, purchase)
- User wants to automate their savings strategy
- User needs to choose between savings vehicles (HYSA, CD, money market)

**Do NOT use this skill when:**
- User wants investment growth beyond simple savings -- use investment-advisor
- User needs a full budget -- use budget-builder (savings plan comes after budget)
- User needs retirement-specific savings -- use retirement-planner

## Process

1. **Step 1:** Define savings goal: amount, deadline, and purpose
2. **Step 2:** Calculate monthly savings target based on timeline
3. **Step 3:** Select appropriate savings vehicle based on timeline and access needs
4. **Step 4:** Design automation strategy: accounts, transfers, frequency
5. **Step 5:** Build tracking system with milestones and adjustment triggers

## Purpose

This skill helps users build a structured savings plan with clear goals, appropriate vehicles, and automated systems. It covers emergency funds, short-term goals, and medium-term savings using strategies that maximize interest while maintaining accessibility.

---

## Questions to Ask the User First

1. **Current savings:** How much do you currently have saved (excluding retirement accounts)?
2. **Monthly income:** What is your take-home pay?
3. **Monthly expenses:** What are your essential monthly expenses?
4. **Current savings rate:** How much are you saving per month currently?
5. **Emergency fund status:** Do you have an emergency fund? How many months of expenses does it cover?
6. **Savings goals:** What are you saving for? List each goal with target amount and target date.
7. **Debt status:** Do you have high-interest debt? (Debt above 6-7% should generally be prioritized over savings beyond emergency fund)
8. **Where is savings kept:** Checking account? Savings account? What interest rate?
9. **Risk tolerance for savings:** Are you comfortable with CDs or bonds for medium-term goals, or do you want everything liquid?
10. **Automation comfort:** Are you comfortable setting up automatic transfers?

---

## Step 1: Emergency Fund Calculator

### Determining Your Emergency Fund Target

```
EMERGENCY FUND CALCULATOR
==========================

MONTHLY ESSENTIAL EXPENSES
  Housing (rent/mortgage):        $__________
  Utilities:                      $__________
  Groceries:                      $__________
  Transportation:                 $__________
  Insurance premiums:             $__________
  Minimum debt payments:          $__________
  Medical (regular):              $__________
  Phone:                          $__________
  Childcare:                      $__________
  TOTAL MONTHLY ESSENTIALS:       $__________

MONTHS OF COVERAGE NEEDED
  Dual income, stable jobs:                 3 months
  Single income, stable job:                4-5 months
  Single income, variable/contract work:    6 months
  Self-employed or seasonal:                6-9 months
  Single parent:                            6 months
  Approaching major life change:            6 months

  YOUR MULTIPLIER: ______ months

EMERGENCY FUND TARGET: $__________ x ______ = $__________
CURRENT EMERGENCY FUND:                       $__________
GAP TO FILL:                                  $__________
```

### Emergency Fund Building Tiers

If starting from zero, build in stages:

```
TIER 1: Starter Fund
  Target: $1,000 (or one month's essential expenses)
  Priority: HIGHEST -- before everything except minimum debt payments
  Timeline: 1-3 months (aggressive saving, sell unused items, side work)

TIER 2: Basic Fund
  Target: 3 months of essential expenses
  Priority: HIGH -- alongside moderate debt payoff
  Timeline: 6-12 months

TIER 3: Full Fund
  Target: 6 months of essential expenses
  Priority: MEDIUM -- after high-interest debt is eliminated
  Timeline: 12-24 months

TIER 4: Extended Fund (optional)
  Target: 9-12 months (for high-risk situations)
  Priority: As needed based on life circumstances
```

### Where to Keep Your Emergency Fund

**Requirements:** Liquid (accessible within 1-2 business days), FDIC insured, NOT invested in the stock market.

**Best option: High-Yield Savings Account (HYSA)**

```
HYSA COMPARISON TEMPLATE
=========================
Bank/Institution    | APY     | Min Balance | Fees | FDIC | Access
--------------------|---------|------------|------|------|--------
__________________  | _____%  | $_________ | ___  | Y/N  | ________
__________________  | _____%  | $_________ | ___  | Y/N  | ________
__________________  | _____%  | $_________ | ___  | Y/N  | ________

Popular options to research:
  - Marcus by Goldman Sachs
  - Ally Bank
  - Discover Online Savings
  - Capital One 360 Performance Savings
  - Wealthfront Cash Account
  - SoFi Savings

Current top HYSA rates: typically 4-5% APY (as of 2024)
vs. typical checking account: 0.01-0.05% APY

On $10,000: HYSA earns ~$400-500/year vs. ~$1-5 in checking
```

---

## Step 2: Sinking Funds

Sinking funds are dedicated savings for known upcoming expenses. They prevent budget "surprises."

```
SINKING FUND PLANNER
=====================

Goal / Expense          | Total Amount | Target Date  | Months | Monthly Amount
------------------------|-------------|-------------|--------|---------------
Car maintenance/repair  | $__________ | ____________ | ______ | $__________
Holiday gifts           | $__________ | ____________ | ______ | $__________
Annual insurance premium| $__________ | ____________ | ______ | $__________
Vacation                | $__________ | ____________ | ______ | $__________
Property tax            | $__________ | ____________ | ______ | $__________
Back to school          | $__________ | ____________ | ______ | $__________
Home maintenance        | $__________ | ____________ | ______ | $__________
Medical deductible      | $__________ | ____________ | ______ | $__________
New phone/tech          | $__________ | ____________ | ______ | $__________
Pet expenses            | $__________ | ____________ | ______ | $__________
Clothing seasonal       | $__________ | ____________ | ______ | $__________

TOTAL MONTHLY SINKING FUND CONTRIBUTIONS: $__________

Formula: Total Amount / Months Until Needed = Monthly Contribution
```

### Sinking Fund Organization

Options for keeping sinking funds separate:
1. **Multiple HYSA sub-accounts:** Some banks (Ally, Capital One) allow labeled "buckets" within one account
2. **Separate savings accounts:** One per major goal (free at online banks)
3. **Spreadsheet tracking:** Single account but tracked in a spreadsheet by category
4. **Envelope app:** Apps like YNAB or Goodbudget track virtual envelopes

---

## Step 3: CD Laddering Strategy

For savings you will not need for 6-24 months, CD laddering earns higher rates while maintaining partial liquidity.

```
CD LADDER EXAMPLE ($12,000 total)
==================================

Step 1: Divide savings into equal portions
  $3,000 in a 3-month CD
  $3,000 in a 6-month CD
  $3,000 in a 9-month CD
  $3,000 in a 12-month CD

Step 2: As each CD matures, reinvest in a 12-month CD
  Month 3:  First $3,000 matures --> reinvest in 12-month CD
  Month 6:  Second $3,000 matures --> reinvest in 12-month CD
  Month 9:  Third $3,000 matures --> reinvest in 12-month CD
  Month 12: Fourth $3,000 matures --> reinvest in 12-month CD

Result: After 12 months, you have four 12-month CDs maturing every
3 months. You always have access to some portion within 3 months.

CD LADDER WORKSHEET
===================
CD #  | Amount     | Term     | APY    | Maturity Date | Reinvest?
------|-----------|----------|--------|--------------|----------
1     | $________ | ________ | _____% | ____________ | Y/N
2     | $________ | ________ | _____% | ____________ | Y/N
3     | $________ | ________ | _____% | ____________ | Y/N
4     | $________ | ________ | _____% | ____________ | Y/N
```

**When to use CDs:**
- You have more emergency fund than needed and want to earn more
- Saving for a goal 6-24 months away
- You want guaranteed returns with no market risk
- Current CD rates are attractive compared to HYSA rates

**When NOT to use CDs:**
- You need full liquidity (emergency fund core)
- HYSA rates are similar to CD rates (the liquidity cost is not worth it)
- Goals are under 3 months away

---

## Step 4: Savings Automation

Automation is the single most effective savings strategy. Remove willpower from the equation.

```
AUTOMATION SETUP CHECKLIST
===========================
[ ] Set up direct deposit split:
    __% or $______ to checking (for bills and spending)
    __% or $______ to HYSA (for emergency fund / savings goals)
    __% or $______ to investment account (if applicable)

[ ] Set up automatic transfers (day after payday):
    $______ to emergency fund (until fully funded)
    $______ to sinking fund account
    $______ to goal-specific savings account

[ ] Set up automatic bill payments:
    All fixed bills on autopay
    Savings transfers treated as non-negotiable bills

[ ] Set up automatic retirement contributions:
    401k percentage: ____%
    IRA automatic monthly: $__________

AUTOMATION SCHEDULE
===================
Pay day: __________
Day after pay: all automatic transfers execute
Bills due: spread across the month to match cash flow
Review day: __________ (monthly check-in)
```

### The "Pay Yourself First" Principle

Savings transfers should happen BEFORE discretionary spending, not after. Treat savings like a bill:

1. Income arrives in checking
2. Automated transfers move savings out immediately
3. What remains is available for spending
4. You never "see" the savings money, so you do not miss it

---

## Step 5: Goal Prioritization

When you have multiple savings goals, prioritize them:

```
SAVINGS GOAL PRIORITY FRAMEWORK
=================================

PRIORITY 1 -- ESSENTIAL (fund these first)
  [ ] Starter emergency fund ($1,000)
  [ ] Minimum debt payments (not savings, but non-negotiable)
  [ ] Employer 401k match (free money -- never skip this)

PRIORITY 2 -- CRITICAL (fund these second)
  [ ] Full emergency fund (3-6 months)
  [ ] High-interest debt payoff (above 6-7%)

PRIORITY 3 -- IMPORTANT (fund these third)
  [ ] Retirement savings (beyond match, up to 15% of income)
  [ ] Sinking funds for known upcoming expenses

PRIORITY 4 -- GOALS (fund these fourth)
  [ ] Down payment on home
  [ ] Car replacement fund
  [ ] Education savings (self or children)
  [ ] Vacation fund
  [ ] Other goals: __________

PRIORITY 5 -- ASPIRATIONAL (fund these last)
  [ ] Early retirement acceleration
  [ ] Large purchase goals
  [ ] Investment property savings
  [ ] Financial independence target
```

### Splitting Between Goals

If you have $500/month for savings after essentials:

```
GOAL ALLOCATION EXAMPLE
========================
Emergency fund (not yet full):     60% = $300/month
Vacation fund (trip in 8 months):  20% = $100/month
Car replacement sinking fund:      20% = $100/month

Once emergency fund is full:
Vacation fund:                     40% = $200/month
Car replacement:                   30% = $150/month
Down payment savings:              30% = $150/month
```

---

## Step 6: Milestone Tracking

```
SAVINGS MILESTONE TRACKER
===========================

GOAL: ________________________
Target amount: $__________
Monthly contribution: $__________
Start date: __________
Target date: __________

Milestone        | Amount     | Target Date | Actual Date | Status
10% saved        | $_________ | ___________ | ___________ | [ ]
25% saved        | $_________ | ___________ | ___________ | [ ]
50% saved        | $_________ | ___________ | ___________ | [ ]
75% saved        | $_________ | ___________ | ___________ | [ ]
90% saved        | $_________ | ___________ | ___________ | [ ]
100% COMPLETE    | $_________ | ___________ | ___________ | [ ]

Notes / Adjustments:
__________________________________________________________
__________________________________________________________
```

### Celebrate Milestones (Without Derailing Progress)

At each 25% milestone, celebrate with a small, budgeted reward:
- 25%: Favorite meal at home ($15-30)
- 50%: Activity you enjoy ($25-50)
- 75%: Small treat ($50-100)
- 100%: Meaningful celebration appropriate to the goal

---

## Step 7: Savings Rate Optimization

### What Is a Savings Rate?

```
SAVINGS RATE CALCULATION
=========================
Total monthly savings and investments:
  Emergency fund contributions:     $__________
  Retirement contributions:         $__________
  Employer match:                   $__________
  Sinking fund contributions:       $__________
  Other savings:                    $__________
  Extra debt payments (above min):  $__________
  TOTAL SAVINGS:                    $__________

Gross monthly income:               $__________

SAVINGS RATE: Total Savings / Gross Income x 100 = ____%
```

### Savings Rate Benchmarks

| Savings Rate | Assessment | Retirement Timeline |
|-------------|-----------|-------------------|
| Under 5% | Danger zone | Retirement may not be possible without changes |
| 5-10% | Minimum | Standard retirement at 65-67 |
| 10-15% | Good | Comfortable retirement at 62-65 |
| 15-20% | Very good | Early-ish retirement possible (55-60) |
| 20-30% | Excellent | Significant financial freedom |
| 30-50% | Exceptional | Early retirement (45-55) possible |
| 50%+ | FIRE territory | Financial independence in 10-17 years |

### Increasing Your Savings Rate

```
SAVINGS RATE IMPROVEMENT PLAN
===============================
Current savings rate: ____%
Target savings rate: ____%
Gap: ____% = $__________ per month

STRATEGIES TO CLOSE THE GAP:
[ ] Increase by 1% of income every quarter (barely noticeable)
[ ] Direct 50-100% of any raise to savings
[ ] Automate an increase on a set date every 6 months
[ ] Apply one-time windfalls (tax refund, bonus) entirely to savings
[ ] Reduce one spending category by $__________ per month
[ ] Add income through side work: $__________ per month

Timeline to reach target rate: ______ months
```

---

## Savings vs. Investing Decision Framework

```
TIME HORIZON DECISION
=====================
When will you need this money?

Under 1 year:    --> HYSA or money market
1-2 years:       --> HYSA, CDs, or short-term Treasury bills
2-5 years:       --> Conservative mix (CDs, bonds, maybe 20% stocks)
5-10 years:      --> Moderate mix (50/50 stocks and bonds)
10+ years:       --> Aggressive mix (70-90% stocks)
Retirement:      --> Follow investment advisor skill guidance

RULE: Money you CANNOT afford to lose should never be in the stock market.
Short-term goals belong in savings vehicles, not investments.
```

---

## Output Format

When delivering a savings plan, provide:

1. **Current snapshot** -- Existing savings, current rate, emergency fund status
2. **Emergency fund recommendation** -- Target amount, current gap, building timeline
3. **Goal inventory** -- All goals listed with amounts, timelines, and priorities
4. **Monthly allocation plan** -- Exact dollar amounts to each goal
5. **Automation setup** -- Specific transfers to set up
6. **Vehicle recommendations** -- HYSA, CDs, or other for each goal
7. **Milestone schedule** -- Key checkpoints with dates
8. **Savings rate trajectory** -- Current rate, target, and plan to improve

## Example

**Input:** "I want to save $20,000 for a house down payment in 2 years. I currently have $3,000 saved. Where should I keep the money?"

**Output:**

## Savings Plan: House Down Payment

**Goal:** $20,000 | **Current:** $3,000 | **Gap:** $17,000 | **Timeline:** 24 months

### Monthly Savings Target
$17,000 / 24 months = $709/month

### Where to Keep It
| Option | APY (typical) | Access | Best For |
|--------|--------------|--------|----------|
| **High-Yield Savings (HYSA)** | 4.5-5.0% | Immediate | THIS GOAL |
| CD (2-year) | 4.5-5.0% | Locked | Only if you will not need it early |
| Money Market | 4.0-4.5% | Immediate | Alternative to HYSA |
| Regular savings | 0.01-0.5% | Immediate | NOT recommended |

**Recommendation:** High-yield savings account (HYSA). Your timeline is short and you need guaranteed principal -- no stocks or bonds for 2-year goals.

### Automation Setup
1. Open HYSA at an online bank (Marcus, Ally, or Discover typically offer top rates)
2. Set up automatic transfer: $355 on the 1st and 15th of each month
3. Direct any windfalls (tax refund, bonus) to this account

### Projected Timeline with Interest
| Month | Balance (with ~4.5% APY) |
|-------|-------------------------|
| Month 6 | $7,300 |
| Month 12 | $11,700 |
| Month 18 | $16,200 |
| Month 24 | $20,800 |

You will actually reach ~$20,800 with interest, giving you an $800 buffer for closing costs.

## Edge Cases

- **Incomplete information:** Ask clarifying questions before proceeding. Do not assume details the user has not provided.
- **Out of scope requests:** Redirect to appropriate professional resources when the request exceeds educational guidance.
- **Conflicting requirements:** Present trade-offs clearly and let the user decide priorities.
