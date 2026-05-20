---
name: expense-analyzer
description: |
  Spending pattern identification and expense optimization through subscription auditing, fixed vs variable cost analysis, cost-per-use calculations, lifestyle inflation detection, comparison to median spending by category, and savings opportunity discovery.
  Use when the user asks about expense analyzer, or needs help with spending pattern identification and expense optimization through subscription auditing, fixed vs variable cost analysis, cost-per-use calculations, lifestyle inflation detection, comparison to median spending by category, and savings opportunity discovery.
  Do NOT use when the request requires professional financial advice or falls outside the scope of expense analyzer.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "personal-finance expenses guide"
  category: "personal-finance"
  subcategory: "budgeting"
  depends: ""
  disclaimer: "educational-finance"
  difficulty: "intermediate"
---

# Expense Analyzer

> **Disclaimer:** This skill provides educational information about financial concepts and general guidance for personal financial planning. It does NOT constitute financial advice, investment recommendations, or tax guidance. Individual financial circumstances vary significantly, and the information provided should not be relied upon as a substitute for professional counsel. Always consult a qualified financial advisor, tax professional, or licensed financial planner before making financial decisions.

## When to Use

**Use this skill when:**
- User wants to analyze their spending patterns and find savings
- User needs help categorizing and understanding where their money goes
- User wants to identify unnecessary subscriptions or spending leaks
- User needs a spending audit to prepare for budgeting

**Do NOT use this skill when:**
- User wants a budget built -- use budget-builder after the analysis
- User needs investment analysis -- use investment-related skills
- User wants business expense tracking -- use business accounting skills

## Process

1. **Step 1:** Collect 3 months of transaction data from bank and credit card statements
2. **Step 2:** Categorize every transaction into needs, wants, savings, and debt
3. **Step 3:** Calculate spending percentages and compare to benchmarks
4. **Step 4:** Identify top 5 savings opportunities ranked by potential monthly impact
5. **Step 5:** Produce spending summary with actionable recommendations

## Purpose

This skill helps users understand where their money goes, identify wasteful spending, find optimization opportunities, and make informed decisions about their expenses. It goes beyond simple tracking to provide analytical frameworks that reveal hidden patterns and actionable savings.

---

## Questions to Ask the User First

1. **Data availability:** Do you have access to your last 3 months of bank and credit card statements? (Minimum 1 month, ideal 3-6 months)
2. **Income:** What is your monthly take-home pay?
3. **Household size:** How many people in your household?
4. **Location:** What metro area or region do you live in? (Affects median spending comparisons)
5. **Financial goals:** What are you trying to achieve? (Reduce spending? Find waste? Save for something specific?)
6. **Known pain points:** Are there categories where you already suspect you overspend?
7. **Subscriptions:** Can you list all your recurring subscriptions and memberships?
8. **Cash spending:** Do you use cash frequently? (Cash is harder to track)
9. **Recent changes:** Have you had any major lifestyle changes in the past year (new job, move, raise, baby)?
10. **Willingness to change:** Are you open to making significant changes, or looking for small optimizations only?

---

## Step 1: Comprehensive Expense Categorization

Have the user log or report all spending from the analysis period:

```
EXPENSE CATEGORIZATION TEMPLATE (Monthly Average)
==================================================

HOUSING
  Rent / Mortgage:                    $__________
  Property tax:                       $__________
  Home insurance:                     $__________
  HOA fees:                           $__________
  Maintenance / Repairs:              $__________
  SUBTOTAL:                           $__________  ( ___% of income)

TRANSPORTATION
  Car payment:                        $__________
  Gas:                                $__________
  Insurance:                          $__________
  Maintenance:                        $__________
  Parking / Tolls:                    $__________
  Public transit:                     $__________
  Rideshare (Uber/Lyft):             $__________
  SUBTOTAL:                           $__________  ( ___% of income)

FOOD
  Groceries:                          $__________
  Dining out / Takeout:               $__________
  Coffee shops:                       $__________
  Alcohol:                            $__________
  Work lunches:                       $__________
  SUBTOTAL:                           $__________  ( ___% of income)

UTILITIES
  Electric:                           $__________
  Gas / Heating:                      $__________
  Water / Sewer:                      $__________
  Internet:                           $__________
  Cell phone:                         $__________
  SUBTOTAL:                           $__________  ( ___% of income)

INSURANCE & HEALTH
  Health insurance premium:           $__________
  Medical / Dental / Vision (OOP):    $__________
  Prescriptions:                      $__________
  Life insurance:                     $__________
  SUBTOTAL:                           $__________  ( ___% of income)

SUBSCRIPTIONS & MEMBERSHIPS
  Streaming (Netflix, Spotify, etc.): $__________
  Gym / Fitness:                      $__________
  News / Magazines:                   $__________
  Software / Apps:                    $__________
  Amazon Prime / Costco:              $__________
  Other memberships:                  $__________
  SUBTOTAL:                           $__________  ( ___% of income)

PERSONAL & LIFESTYLE
  Clothing:                           $__________
  Personal care / Beauty:             $__________
  Hobbies:                            $__________
  Entertainment (events, movies):     $__________
  SUBTOTAL:                           $__________  ( ___% of income)

DEBT PAYMENTS
  Credit card minimums:               $__________
  Student loans:                      $__________
  Personal loans:                     $__________
  Other debt:                         $__________
  SUBTOTAL:                           $__________  ( ___% of income)

MISCELLANEOUS
  Gifts:                              $__________
  Pet expenses:                       $__________
  Children expenses:                  $__________
  Charitable giving:                  $__________
  Education:                          $__________
  Other:                              $__________
  SUBTOTAL:                           $__________  ( ___% of income)

TOTAL MONTHLY SPENDING:               $__________
MONTHLY INCOME:                        $__________
SURPLUS / DEFICIT:                     $__________
SAVINGS RATE:                          ____%
```

---

## Step 2: Subscription Audit

### Full Subscription Inventory

```
SUBSCRIPTION AUDIT
==================
Service              | Monthly Cost | Last Used    | Usage Frequency | Keep?
---------------------|-------------|------------- |-----------------|------
___________________  | $__________ | ____________ | Daily/Weekly/   | Y/N
                     |             |              | Monthly/Rarely  |
___________________  | $__________ | ____________ | ____________    | Y/N
___________________  | $__________ | ____________ | ____________    | Y/N
___________________  | $__________ | ____________ | ____________    | Y/N
___________________  | $__________ | ____________ | ____________    | Y/N
___________________  | $__________ | ____________ | ____________    | Y/N
___________________  | $__________ | ____________ | ____________    | Y/N
___________________  | $__________ | ____________ | ____________    | Y/N

TOTAL MONTHLY SUBSCRIPTIONS: $__________
ANNUAL SUBSCRIPTION COST: $__________

Subscriptions to cancel:
  1. ______________ -- saves $__________/month
  2. ______________ -- saves $__________/month
  3. ______________ -- saves $__________/month

Subscriptions to downgrade:
  1. ______________ from $____ to $____ plan

TOTAL MONTHLY SAVINGS: $__________
ANNUAL SAVINGS: $__________
```

### Subscription Red Flags
- Not used in the past 30 days
- Duplicate services (two streaming, two cloud storage)
- Free trials that converted to paid
- Annual renewals you skipped about
- Price increases you accepted passively

---

## Step 3: Fixed vs. Variable Cost Analysis

```
COST STRUCTURE ANALYSIS
========================

FIXED COSTS (same every month, hard to change quickly)
  Housing:              $__________
  Car payment:          $__________
  Insurance:            $__________
  Debt minimums:        $__________
  Phone plan:           $__________
  Internet:             $__________
  Subscriptions:        $__________
  TOTAL FIXED:          $__________  ( ___% of income)

VARIABLE COSTS (change monthly, within your control)
  Groceries:            $__________
  Dining out:           $__________
  Gas:                  $__________
  Entertainment:        $__________
  Shopping:             $__________
  Personal care:        $__________
  TOTAL VARIABLE:       $__________  ( ___% of income)

TARGET: Fixed costs should be under 50-60% of take-home pay
Current fixed cost ratio: ____%

If over 60%: You have limited flexibility. Focus on reducing fixed costs
(refinance, move, sell car, switch insurance, renegotiate).

If under 50%: Good structure. Optimize variable costs for additional savings.
```

---

## Step 4: Cost-Per-Use Analysis

For major purchases and memberships, calculate cost per use:

```
COST-PER-USE CALCULATOR
========================
Item / Membership        | Total Cost  | Uses per Month | Monthly CPU | Verdict
------------------------|-------------|----------------|-------------|--------
Gym membership          | $__________ | ____________   | $__________ | ________
Streaming service       | $__________ | ____________   | $__________ | ________
Clothing item           | $__________ | ____________   | $__________ | ________
Kitchen gadget          | $__________ | ____________   | $__________ | ________
Car (vs. rideshare)     | $__________ | ____________   | $__________ | ________

Formula: Monthly cost / Number of uses per month = Cost per use

BENCHMARKS:
  Gym: Under $5/visit = good value; Over $15/visit = reconsider
  Streaming: Under $1/hour watched = good value
  Clothing: Under $1/wear for everyday items; Under $5/wear for special items
  Car: Compare total car costs/month to equivalent rideshare costs
```

---

## Step 5: Lifestyle Inflation Detection

```
LIFESTYLE INFLATION CHECK
==========================
Compare your spending when you earned less vs. now:

                        When I earned    Now I earn     Spending
Category                $__________/yr   $__________/yr Change
Housing:                $__________      $__________    +$__________
Car:                    $__________      $__________    +$__________
Food:                   $__________      $__________    +$__________
Entertainment:          $__________      $__________    +$__________
Shopping:               $__________      $__________    +$__________
Other:                  $__________      $__________    +$__________

Total spending increase:                               +$__________
Income increase:                                       +$__________
% of raise consumed by lifestyle inflation:            ____%

TARGET: Keep lifestyle inflation under 50% of any raise.
Invest/save the other 50%+ of income increases.
```

### Lifestyle Inflation Warning Signs
- Upgrading cars shortly after raises
- Moving to more expensive housing without need
- Increasing dining out frequency
- Shopping as recreation
- Normalizing premium everything (coffee, groceries, flights)

---

## Step 6: Comparison to Median Spending

Compare user spending to Bureau of Labor Statistics Consumer Expenditure Survey averages:

```
SPENDING vs. NATIONAL MEDIAN (approximate percentages of after-tax income)
==========================================================================
Category            | Median % | Your % | Difference | Status
Housing             | 33%      | ____%  | __________ | Over/Under/Normal
Transportation      | 16%      | ____%  | __________ | Over/Under/Normal
Food                | 13%      | ____%  | __________ | Over/Under/Normal
Insurance/Pension   | 12%      | ____%  | __________ | Over/Under/Normal
Healthcare          | 8%       | ____%  | __________ | Over/Under/Normal
Entertainment       | 5%       | ____%  | __________ | Over/Under/Normal
Clothing            | 3%       | ____%  | __________ | Over/Under/Normal
Other               | 10%      | ____%  | __________ | Over/Under/Normal

Note: Medians vary significantly by region, household size, and income level.
Spending above median is not inherently bad if it aligns with your values.
```

---

## Step 7: Savings Opportunity Finder

### Quick Wins (immediate impact, low effort)

```
SAVINGS OPPORTUNITIES
=====================

IMMEDIATE (this week):
[ ] Cancel unused subscriptions:                    saves $__________/mo
[ ] Call cell phone provider for better rate:       saves $__________/mo
[ ] Switch to generic medications:                  saves $__________/mo
[ ] Cancel premium tiers you don't fully use:       saves $__________/mo

SHORT-TERM (this month):
[ ] Shop auto/home insurance quotes:                saves $__________/mo
[ ] Switch to high-yield savings account:           earns $__________/mo
[ ] Meal prep 2 days per week:                      saves $__________/mo
[ ] Set up automatic savings transfer:              saves $__________/mo

MEDIUM-TERM (next quarter):
[ ] Refinance high-interest debt:                   saves $__________/mo
[ ] Negotiate salary or find better-paying work:    earns $__________/mo
[ ] Switch to a cheaper phone plan:                 saves $__________/mo
[ ] Reduce dining out by 50%:                       saves $__________/mo

LONG-TERM (next year):
[ ] Downsize housing:                               saves $__________/mo
[ ] Eliminate car payment (buy used next time):      saves $__________/mo
[ ] Move to lower cost-of-living area:              saves $__________/mo

TOTAL POTENTIAL MONTHLY SAVINGS: $__________
TOTAL POTENTIAL ANNUAL SAVINGS:  $__________
```

### The Latte Factor (Reframed)

Small daily expenses add up, but do not obsess over them at the expense of big wins:

```
Daily expense  | Monthly cost | Annual cost | 10-year cost (invested at 7%)
$5/day coffee  | $150         | $1,825      | ~$25,000
$15/day lunch  | $450         | $5,475      | ~$75,000
$10/day misc   | $300         | $3,650      | ~$50,000

BUT: One insurance renegotiation might save $100/month ($17,000 over 10 years)
     One salary negotiation might add $5,000/year ($69,000 over 10 years)

Focus on big wins first, then optimize the small stuff.
```

---

## Spending Alignment Check

The most important question: Does your spending reflect your values?

```
VALUE ALIGNMENT EXERCISE
========================
List your top 5 values/priorities:
1. __________
2. __________
3. __________
4. __________
5. __________

Now list your top 5 spending categories:
1. __________ ($__________)
2. __________ ($__________)
3. __________ ($__________)
4. __________ ($__________)
5. __________ ($__________)

Do these lists align? If your values say "family and health" but your
spending says "dining out and subscriptions," there is an opportunity
to realign spending with what truly matters to you.
```

---

## Output Format

When delivering expense analysis, provide:

1. **Spending summary** -- Total spending, savings rate, income vs. expenses
2. **Category breakdown** -- With percentages and comparison to medians
3. **Top 3 problem areas** -- Categories most over benchmark or misaligned with goals
4. **Subscription audit results** -- What to cancel, downgrade, or keep
5. **Quick wins** -- Immediate actions with estimated savings
6. **Strategic recommendations** -- Longer-term structural changes
7. **Monthly savings potential** -- Total estimated savings from all recommendations
8. **Value alignment note** -- Does spending match stated priorities?

## Example

**Input:** "I feel like I am spending too much but I do not know where. My take-home is $5,000/month and I only save $200. Here are my main expenses: rent $1,400, car payment $350, groceries $600, dining out $500, subscriptions $180, utilities $200, gas $150, shopping $400, insurance $250."

**Output:**

## Expense Analysis Report

**Monthly take-home:** $5,000
**Current savings:** $200 (4%)
**Total tracked expenses:** $4,030
**Unaccounted:** $770 (potential cash spending or missed categories)

### Spending Breakdown
| Category | Amount | % of Income | Benchmark | Status |
|----------|--------|-------------|-----------|--------|
| Housing | $1,400 | 28% | 25-30% | OK |
| Transportation | $500 | 10% | 10-15% | OK |
| Groceries | $600 | 12% | 8-10% | HIGH |
| Dining out | $500 | 10% | 5-7% | HIGH |
| Shopping | $400 | 8% | 3-5% | HIGH |
| Subscriptions | $180 | 3.6% | 1-2% | HIGH |
| Utilities | $200 | 4% | 3-5% | OK |
| Insurance | $250 | 5% | 4-6% | OK |

### Top 5 Savings Opportunities
| Rank | Action | Monthly Savings |
|------|--------|----------------|
| 1 | Reduce dining out to $250/mo (cook 2 extra meals/week) | $250 |
| 2 | Reduce shopping to $200/mo (30-day rule on purchases over $50) | $200 |
| 3 | Audit subscriptions -- cancel unused (target $80/mo) | $100 |
| 4 | Reduce groceries to $450/mo (meal planning, store brand staples) | $150 |
| 5 | Track the $770 unaccounted spending | $200-400 |

**Potential monthly savings:** $900-$1,100
**New savings rate:** $1,100-$1,300/mo (22-26% of income)

## Edge Cases

- **Incomplete information:** Ask clarifying questions before proceeding. Do not assume details the user has not provided.
- **Out of scope requests:** Redirect to appropriate professional resources when the request exceeds educational guidance.
- **Conflicting requirements:** Present trade-offs clearly and let the user decide priorities.
