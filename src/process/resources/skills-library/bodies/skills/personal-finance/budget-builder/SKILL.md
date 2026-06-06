---
name: budget-builder
description: |
  Comprehensive budget creation and management skill using proven frameworks including the 50/30/20 rule, zero-based budgeting, and the envelope system. Guides users through income assessment, expense categorization, template creation, and ongoing budget review strategies.
  Use when the user asks about budget builder, or needs help with comprehensive budget creation and management skill using proven frameworks including the 50/30/20 rule, zero-based budgeting, and the envelope system.
  Do NOT use when the request requires professional financial advice or falls outside the scope of budget builder.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "personal-finance budgeting guide"
  category: "personal-finance"
  subcategory: "budgeting"
  depends: ""
  disclaimer: "educational-finance"
  difficulty: "intermediate"
---

# Budget Builder

> **Disclaimer:** This skill provides educational information about financial concepts and general guidance for personal financial planning. It does NOT constitute financial advice, investment recommendations, or tax guidance. Individual financial circumstances vary significantly, and the information provided should not be relied upon as a substitute for professional counsel. Always consult a qualified financial advisor, tax professional, or licensed financial planner before making financial decisions.

## When to Use

**Use this skill when:**
- User wants to create a personal or household budget from scratch
- User needs help choosing a budgeting framework (50/30/20, zero-based, envelope)
- User wants to analyze and restructure their current spending
- User needs budget templates for specific income patterns (biweekly, irregular)

**Do NOT use this skill when:**
- User needs investment portfolio advice -- use investment-related skills
- User wants business budgeting or P&L analysis -- use business finance skills
- User needs tax planning -- use tax-assistant skill

## Process

1. **Step 1:** Assess income structure, household size, and financial goals
2. **Step 2:** Categorize all expenses: fixed, variable, savings, and debt payments
3. **Step 3:** Select and apply appropriate budgeting framework based on user situation
4. **Step 4:** Build personalized budget template with tracking method
5. **Step 5:** Establish review cadence and adjustment strategies

## Purpose

This skill guides users through creating, implementing, and maintaining a personal or household budget. It uses proven budgeting frameworks adapted to each user's unique financial situation, income pattern, and goals. The skill produces actionable budget templates, tracking systems, and review cadences.

---

## Questions to Ask the User First

Before building any budget, gather the following information through conversation:

1. **Income structure:** Are you salaried, hourly, freelance, or a mix? How often are you paid (weekly, bi-weekly, semi-monthly, monthly)?
2. **Household size:** How many people does this budget cover? Any dependents?
3. **Current financial snapshot:** Do you have a rough idea of your monthly take-home income? Any existing debts?
4. **Goals:** What is the primary reason you want a budget? (Debt payoff, saving for a goal, reducing overspending, general awareness)
5. **Comfort with tools:** Do you prefer spreadsheets, apps (YNAB, Mint, EveryDollar), or pen-and-paper?
6. **Pain points:** Where do you feel money "disappears" each month?
7. **Irregular expenses:** Are there known irregular costs (annual insurance, holidays, car registration)?
8. **Previous attempts:** Have you tried budgeting before? What worked or didn't?

---

## Budgeting Frameworks

### Framework 1: The 50/30/20 Rule

The simplest starting point. Allocate after-tax income into three buckets:

| Category | Percentage | Examples |
|----------|-----------|----------|
| **Needs** | 50% | Housing, utilities, groceries, insurance, minimum debt payments, transportation |
| **Wants** | 30% | Dining out, entertainment, subscriptions, hobbies, travel |
| **Savings & Debt** | 20% | Emergency fund, retirement contributions, extra debt payments, investments |

**When to use:** Best for beginners or those who want a low-maintenance framework. Works well for stable, predictable incomes.

**Adjustment guidance:**
- High cost-of-living area: Needs may require 55-60%; reduce Wants to 20-25%
- Aggressive debt payoff: Shift to 50/20/30 (Needs/Wants/Savings+Debt)
- High income earners: Consider 40/20/40 to accelerate wealth building

### Framework 2: Zero-Based Budgeting

Every dollar of income is assigned a job. Income minus all allocated expenses equals exactly zero.

**Steps:**
1. Write down total monthly take-home income
2. List every expense category
3. Assign a dollar amount to each category
4. Subtract all assignments from income until you reach $0
5. If there is money left over, assign it (extra savings, debt, fun)
6. If you are over, reduce categories until balanced

**When to use:** Best for those who want maximum control, are paying off debt aggressively (Dave Ramsey recommends this), or have irregular income.

### Framework 3: The Envelope System

A cash-based or virtual-envelope approach where each spending category gets a fixed allocation.

**Steps:**
1. Identify variable spending categories (groceries, dining, entertainment, clothing, personal care)
2. Set a monthly limit for each
3. Place cash in physical envelopes or set up virtual envelopes in an app
4. When an envelope is empty, spending in that category stops for the month
5. Leftover amounts can roll over or be swept to savings

**When to use:** Best for those who overspend with cards, need tactile/visual feedback, or want to control specific problem categories.

---

## Step-by-Step Budget Building Workflow

### Step 1: Income Assessment

Calculate total reliable monthly take-home pay:

```
INCOME WORKSHEET
================
Primary job (after tax):          $__________
  If bi-weekly: (paycheck x 26) / 12 = monthly
  If semi-monthly: paycheck x 2 = monthly

Secondary job / side income:      $__________
Partner income (if joint budget):  $__________
Regular other income:              $__________
  (child support, rental income, etc.)

TOTAL MONTHLY TAKE-HOME:          $__________
```

**For irregular income (freelancers, gig workers):**
- Calculate average of last 6-12 months
- OR budget based on your lowest-earning month for safety
- Place surplus months' income into a buffer account

### Step 2: Expense Categorization

Organize all spending into categories. Review the last 3 months of bank and credit card statements.

```
FIXED EXPENSES (same every month)
=================================
Rent / Mortgage:                   $__________
Car payment:                       $__________
Insurance (health):                $__________
Insurance (auto):                  $__________
Insurance (renters/home):          $__________
Phone bill:                        $__________
Internet:                          $__________
Minimum debt payments:             $__________
Child care:                        $__________
Subscriptions (fixed):             $__________
Other fixed:                       $__________

SUBTOTAL FIXED:                    $__________

VARIABLE EXPENSES (fluctuate monthly)
=====================================
Groceries:                         $__________
Gas / Transportation:              $__________
Utilities (electric, water, gas):  $__________
Dining out:                        $__________
Entertainment:                     $__________
Clothing:                          $__________
Personal care:                     $__________
Household supplies:                $__________
Pets:                              $__________
Gifts:                             $__________
Miscellaneous:                     $__________

SUBTOTAL VARIABLE:                 $__________

SAVINGS & DEBT PAYOFF
=====================
Emergency fund:                    $__________
Retirement (beyond employer):      $__________
Extra debt payments:               $__________
Sinking funds:                     $__________
Investment contributions:          $__________

SUBTOTAL SAVINGS:                  $__________

TOTAL EXPENSES:                    $__________
INCOME - EXPENSES =                $__________
```

### Step 3: Apply Your Chosen Framework

Compare your totals against the chosen framework targets:

```
50/30/20 CHECK
==============
Monthly take-home:                 $__________

Needs target (50%):                $__________ | Actual: $__________ | Diff: $__________
Wants target (30%):                $__________ | Actual: $__________ | Diff: $__________
Savings target (20%):              $__________ | Actual: $__________ | Diff: $__________
```

### Step 4: Identify Adjustments

If categories are over-target, use this priority order for cuts:
1. Cancel unused subscriptions
2. Reduce dining out frequency
3. Optimize recurring bills (negotiate, switch providers)
4. Reduce discretionary shopping
5. Adjust transportation costs
6. Downsize housing (long-term)

### Step 5: Build Your Template

Choose a template format based on pay frequency.

---

## Budget Templates

### Monthly Budget Template

Best for: salaried employees paid monthly or semi-monthly.

```
MONTH: _____________ YEAR: _______

INCOME
  Take-home pay:          $__________
  Other income:           $__________
  TOTAL INCOME:           $__________

NEEDS (target: ___%)
  Housing:                $__________ [planned] $__________ [actual]
  Utilities:              $__________ [planned] $__________ [actual]
  Groceries:              $__________ [planned] $__________ [actual]
  Transportation:         $__________ [planned] $__________ [actual]
  Insurance:              $__________ [planned] $__________ [actual]
  Minimum debt payments:  $__________ [planned] $__________ [actual]
  Medical:                $__________ [planned] $__________ [actual]
  NEEDS SUBTOTAL:         $__________ [planned] $__________ [actual]

WANTS (target: ___%)
  Dining out:             $__________ [planned] $__________ [actual]
  Entertainment:          $__________ [planned] $__________ [actual]
  Shopping:               $__________ [planned] $__________ [actual]
  Subscriptions:          $__________ [planned] $__________ [actual]
  Hobbies:                $__________ [planned] $__________ [actual]
  WANTS SUBTOTAL:         $__________ [planned] $__________ [actual]

SAVINGS & DEBT (target: ___%)
  Emergency fund:         $__________ [planned] $__________ [actual]
  Retirement:             $__________ [planned] $__________ [actual]
  Extra debt payment:     $__________ [planned] $__________ [actual]
  Sinking funds:          $__________ [planned] $__________ [actual]
  SAVINGS SUBTOTAL:       $__________ [planned] $__________ [actual]

TOTAL ALLOCATED:          $__________
REMAINING (should be $0): $__________
```

### Bi-Weekly Budget Template

Best for: employees paid every two weeks (26 paychecks per year).

```
PAY PERIOD: _______ to _______  CHECK #: __ of 26

PAYCHECK AMOUNT:          $__________

THIS PAYCHECK COVERS:
  [ ] Rent/Mortgage        $__________
  [ ] Car payment          $__________
  [ ] Utilities            $__________
  [ ] Groceries (2 weeks)  $__________
  [ ] Gas                  $__________
  [ ] Insurance            $__________
  [ ] Debt payment         $__________
  [ ] Savings transfer     $__________
  [ ] Spending money       $__________
  [ ] Other: ___________   $__________

TOTAL ALLOCATED:           $__________
REMAINING:                 $__________
```

**Bi-weekly tip:** Two months per year have three paychecks. Plan these "bonus" checks in advance -- direct the entire extra check to savings or debt.

---

## Tracking Methods

### Method 1: Spreadsheet Tracking
- Update weekly (pick a day, make it a habit)
- Use conditional formatting to flag over-budget categories
- Keep a running total vs. planned amounts

### Method 2: App-Based Tracking
- **YNAB (You Need A Budget):** Best for zero-based budgeting, $14.99/mo
- **Mint (Credit Karma):** Free, auto-categorization, 50/30/20 friendly
- **EveryDollar:** Dave Ramsey's tool, free basic version
- **Goodbudget:** Digital envelope system

### Method 3: Cash Envelope Tracking
- Withdraw cash for variable categories at the start of each period
- Physical envelopes labeled by category
- When the cash is gone, the spending stops

---

## Budget Review Cadence

| Frequency | Action |
|-----------|--------|
| **Daily** (first month only) | Check account balances, log any spending |
| **Weekly** | Compare actual spending to plan for each category; adjust if needed |
| **Monthly** | Full reconciliation; calculate actual percentages; note wins and problem areas |
| **Quarterly** | Review goals progress; adjust category amounts for life changes; renegotiate bills |
| **Annually** | Full financial review; update income figures; set new annual goals; review insurance and subscriptions |

---

## Adjustment Strategies

### When You Overspend a Category
1. Identify the cause (one-time event vs. recurring pattern)
2. If one-time: borrow from another discretionary category this month
3. If recurring: increase that category's allocation and decrease another
4. Never borrow from savings categories to fund wants

### When Income Changes
- **Income increase:** Do not inflate lifestyle. Apply 50% of the raise to savings/debt, 50% to quality-of-life improvements
- **Income decrease:** Cut wants first, then optimize needs. Contact creditors proactively if debt payments are at risk

### When Life Changes
- **New baby:** Add childcare, diapers, medical costs; reduce dining and entertainment
- **Job loss:** Immediately switch to bare-bones budget (needs only); pause extra debt payments; preserve cash
- **Marriage:** Combine or coordinate budgets; discuss financial values; align on shared goals

---

## Common Budgeting Mistakes

1. **Not accounting for irregular expenses** -- Annual fees, holidays, and car repairs are predictable. Use sinking funds.
2. **Setting the budget too tight** -- Leave a small buffer or "miscellaneous" line. Perfection is the enemy of consistency.
3. **skipping to budget for fun** -- A budget without discretionary spending will fail. Give yourself permission to enjoy money.
4. **Only budgeting income, not tracking spending** -- A budget without tracking is just a wish list.
5. **Giving up after one bad month** -- Every month is a fresh start. Progress is not perfection.

---

## Sinking Funds Setup

A sinking fund is money set aside monthly for a known future expense:

```
SINKING FUND PLANNER
====================
Expense               | Total Needed | Months Away | Monthly Contribution
Car registration      | $__________  | __________  | $__________
Holiday gifts         | $__________  | __________  | $__________
Annual insurance      | $__________  | __________  | $__________
Vacation              | $__________  | __________  | $__________
Home maintenance      | $__________  | __________  | $__________
Back to school        | $__________  | __________  | $__________
Medical (deductible)  | $__________  | __________  | $__________

Formula: Total Needed / Months Away = Monthly Contribution
```

---

## Output Format

When delivering a completed budget to the user, provide:

1. **Summary dashboard** -- Total income, total allocated, percentages by category
2. **Detailed budget template** -- Filled in with their numbers in the appropriate template format
3. **Action items** -- Top 3 specific things to do this week to start
4. **Review schedule** -- When to check in next
5. **Warning flags** -- Any categories that look concerning (e.g., housing over 35% of income)

---

## Quick-Start for Users Who Just Want a Number

If the user just wants a quick answer:

```
Monthly take-home: $______

Needs (50%):    $______ -- housing, food, transport, insurance, minimum payments
Wants (30%):    $______ -- everything else you enjoy
Save/Debt (20%):$______ -- emergency fund, retirement, extra debt payoff

Start here. Track for one month. Adjust from there.
```

## Example

**Input:** "I make $4,500 per month after taxes. I just got my first apartment and I have no idea how to budget. I have $15,000 in student loans."

**Output:**

## Your Budget: 50/30/20 Framework

**Monthly take-home:** $4,500

### Allocation
| Category | Target | Amount | Items |
|----------|--------|--------|-------|
| **Needs (50%)** | $2,250 | $2,250 | Rent, utilities, groceries, insurance, loan minimums |
| **Wants (30%)** | $1,350 | $1,350 | Dining, entertainment, subscriptions, hobbies |
| **Save/Debt (20%)** | $900 | $900 | Emergency fund + extra loan payments |

### Detailed Needs Breakdown
- Rent: $1,200 (27% of income -- within healthy range)
- Utilities: $150
- Groceries: $300
- Car insurance: $120
- Phone: $60
- Student loan minimum: $200
- Renter's insurance: $20
- NEEDS TOTAL: $2,050 (leaves $200 buffer)

### Month 1-6 Priority: Emergency Fund
Direct $500/month to emergency fund until you reach $5,000 (roughly 1 month expenses). Put remaining $400 toward extra student loan payments.

### Month 7+: Debt Acceleration
Once emergency fund is set, redirect the full $900 to student loans. At $900/month extra (plus $200 minimum), the $15,000 balance clears in approximately 14 months.

### Tracking Method
Start with a free app (Mint or EveryDollar). Check spending every Sunday for 10 minutes. Adjust categories monthly based on actual spending.

## Edge Cases

- **Incomplete information:** Ask clarifying questions before proceeding. Do not assume details the user has not provided.
- **Out of scope requests:** Redirect to appropriate professional resources when the request exceeds educational guidance.
- **Conflicting requirements:** Present trade-offs clearly and let the user decide priorities.
