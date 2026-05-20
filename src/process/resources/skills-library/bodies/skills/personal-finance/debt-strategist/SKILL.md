---
name: debt-strategist
description: |
  Strategic debt payoff planning using proven methods including the debt snowball, avalanche method, consolidation analysis, balance transfer evaluation, and specialized strategies for student loans and mortgages. Calculates payoff timelines and total interest costs.
  Use when the user asks about debt strategist, or needs help with strategic debt payoff planning using proven methods including the debt snowball, avalanche method, consolidation analysis, balance transfer evaluation, and specialized strategies for student loans and mortgages.
  Do NOT use when the request requires professional financial advice or falls outside the scope of debt strategist.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "personal-finance debt-management guide"
  category: "personal-finance"
  subcategory: "budgeting"
  depends: ""
  disclaimer: "educational-finance"
  difficulty: "intermediate"
---

# Debt Strategist

> **Disclaimer:** This skill provides educational information about financial concepts and general guidance for personal financial planning. It does NOT constitute financial advice, investment recommendations, or tax guidance. Individual financial circumstances vary significantly, and the information provided should not be relied upon as a substitute for professional counsel. Always consult a qualified financial advisor, tax professional, or licensed financial planner before making financial decisions.

## When to Use

**Use this skill when:**
- User wants a strategy to pay off multiple debts
- User needs to choose between avalanche and snowball repayment methods
- User wants to know how to prioritize debts by type and interest rate
- User needs a debt payoff timeline and action plan

**Do NOT use this skill when:**
- User needs bankruptcy guidance -- refer to bankruptcy attorney
- User needs debt negotiation or settlement -- refer to qualified professional
- User wants budgeting help unrelated to debt -- use budget-builder

## Process

1. **Step 1:** Inventory all debts: balances, interest rates, minimum payments, types
2. **Step 2:** Calculate total debt load and debt-to-income ratio
3. **Step 3:** Select repayment strategy: avalanche (highest rate first) or snowball (smallest balance first)
4. **Step 4:** Build month-by-month payoff schedule with projected dates
5. **Step 5:** Identify acceleration opportunities: extra payments, refinancing, balance transfers

## Purpose

This skill helps users create a structured debt elimination plan. It compares payoff strategies, calculates timelines and interest savings, and provides actionable step-by-step guidance tailored to the user's specific debt portfolio.

---

## Questions to Ask the User First

1. **Debt inventory:** List each debt with: name, current balance, interest rate (APR), minimum monthly payment, and type (credit card, student loan, auto, mortgage, medical, personal).
2. **Monthly budget for debt:** How much total can you put toward all debt payments each month (minimums + extra)?
3. **Motivation style:** Do you prefer quick wins (smallest balance first) or mathematical optimization (highest interest first)?
4. **Credit score:** Approximate current score? (Affects consolidation and balance transfer options)
5. **Income stability:** Is your income stable or variable?
6. **Emergency fund status:** Do you have at least $1,000 set aside for emergencies? (Critical before aggressive debt payoff)
7. **Upcoming financial events:** Any expected windfalls, tax refunds, bonuses, or major expenses in the next 12 months?
8. **Student loans specifics:** If applicable -- federal or private? Current repayment plan? Employer type (public service)?
9. **Emotional state:** How stressed are you about debt on a scale of 1-10? (Affects strategy recommendation)

---

## Debt Inventory Template

Have the user fill this out first:

```
DEBT INVENTORY
==============
#  | Debt Name          | Type        | Balance    | APR    | Min Payment | Due Date
---|--------------------|-----------  |------------|--------|-------------|----------
1  | __________________ | __________ | $_________ | ____% | $__________ | ________
2  | __________________ | __________ | $_________ | ____% | $__________ | ________
3  | __________________ | __________ | $_________ | ____% | $__________ | ________
4  | __________________ | __________ | $_________ | ____% | $__________ | ________
5  | __________________ | __________ | $_________ | ____% | $__________ | ________
6  | __________________ | __________ | $_________ | ____% | $__________ | ________

TOTAL DEBT:                          $__________
TOTAL MINIMUM PAYMENTS:                          $__________
EXTRA AVAILABLE PER MONTH:                       $__________
TOTAL MONTHLY DEBT BUDGET:                       $__________
```

---

## Payoff Strategies

### Strategy 1: Debt Snowball (Smallest Balance First)

**How it works:** Pay minimum on everything, then throw all extra money at the smallest balance first. When that debt is gone, roll its entire payment into the next smallest. This approach was popularized by financial educator Dave Ramsey as part of his broader financial wellness curriculum.

**Order:** Sort debts by balance, lowest to highest (ignore interest rates).

**Pros:**
- Quick psychological wins build momentum
- Reduces number of bills faster
- Proven behavioral success rate

**Cons:**
- May pay more total interest than avalanche
- Mathematically suboptimal

**Best for:** People who need motivation, have multiple small debts, or have struggled with consistency in the past.

> **Further reading:** Dave Ramsey's *The Total Money Makeover* provides a complete, step-by-step financial program built around the debt snowball approach. His program includes an emergency fund strategy, debt elimination, and long-term wealth building. For the full system, see his books or ramseysolutions.com.

### Strategy 2: Debt Avalanche (Mathematical Optimum)

**How it works:** Pay minimum on everything, then throw all extra money at the highest interest rate debt first. When paid off, roll its payment into the debt with the next highest rate.

**Order:** Sort debts by interest rate, highest to lowest (ignore balances).

**Pros:**
- Minimizes total interest paid
- Mathematically optimal
- Fastest total payoff if followed consistently

**Cons:**
- Highest-rate debt may have a large balance (slow first win)
- Requires more discipline without early victories

**Best for:** Analytically-minded people, those with high-interest debt, or those with strong financial discipline.

### Strategy 3: Hybrid Approach

Pay off one small debt first for a quick win, then switch to avalanche order for the rest. Combines psychological benefit with mathematical optimization.

---

## Comparison Calculator Template

For any given debt set, compute both strategies:

```
SNOWBALL vs AVALANCHE COMPARISON
================================

Snowball Order (by balance):
  1. [Debt name] - $[balance] @ [rate]%
  2. [Debt name] - $[balance] @ [rate]%
  3. [Debt name] - $[balance] @ [rate]%
  ...

Avalanche Order (by rate):
  1. [Debt name] - $[balance] @ [rate]%
  2. [Debt name] - $[balance] @ [rate]%
  3. [Debt name] - $[balance] @ [rate]%
  ...

With $[extra] extra per month:

                    Snowball        Avalanche       Difference
Payoff date:        __________      __________      __________
Total interest:     $__________     $__________     $__________
Total paid:         $__________     $__________     $__________
First debt free:    __________      __________
```

**Calculation logic for each month:**
1. Apply minimum payments to all debts
2. Apply extra payment to the target debt (smallest balance or highest rate)
3. Calculate interest accrued on remaining balances: balance * (APR / 12)
4. When target debt reaches $0, redirect its full payment to the next target
5. Repeat until all debts are $0

---

## Debt Consolidation Analysis

### When Consolidation Makes Sense

Evaluate consolidation if:
- You have multiple high-interest debts (over 15% APR)
- You qualify for a consolidation loan under 10% APR
- You will NOT run up the original credit cards again
- The total cost (interest + fees) is less than current trajectory

```
CONSOLIDATION ANALYSIS
======================
Current situation:
  Total debt: $__________
  Weighted average interest rate: ____%
  Total monthly minimums: $__________
  Projected total interest (current path): $__________

Consolidation offer:
  Loan amount: $__________
  Interest rate: ____%
  Term: ____ months
  Origination fee: $__________ (___%)
  Monthly payment: $__________
  Total interest over term: $__________
  Total cost (principal + interest + fees): $__________

SAVINGS: $__________
RECOMMENDATION: [Consolidate / Do not consolidate]
```

### Red Flags for Consolidation
- Consolidation rate is not significantly lower than current weighted average
- Long loan term makes total cost higher despite lower rate
- You have not addressed the spending behavior that created the debt
- Origination fees eat up the interest savings

---

## Balance Transfer Strategy

### Evaluating a Balance Transfer Offer

```
BALANCE TRANSFER ANALYSIS
=========================
Card / Offer: __________
Promotional APR: ____%
Promotional period: ____ months
Balance transfer fee: ____%  ($__________)
Regular APR after promo: ____%
Credit limit: $__________

Debt to transfer: $__________
Monthly payment to pay off in promo period:
  ($[balance] + $[transfer fee]) / [promo months] = $__________

Can you make that payment? [ ] Yes  [ ] No

If no, how much can you pay monthly? $__________
Remaining balance after promo: $__________
Interest on remaining at regular APR: ____%

Total cost with transfer: $__________
Total cost without transfer: $__________
NET SAVINGS: $__________
```

### Balance Transfer Rules
1. You MUST pay off the transferred balance before the promo period ends
2. Do not make new purchases on the balance transfer card
3. Set up autopay for at least the minimum
4. Do not close the original card (affects credit utilization)
5. Do not transfer if you cannot pay it off in the promo window

---

## Student Loan Strategies

### Federal Student Loan Options

**Income-Driven Repayment (IDR) Plans:**
- **SAVE (formerly REPAYE):** 5-10% of discretionary income; forgiveness at 20-25 years
- **PAYE:** 10% of discretionary income; capped at standard payment; 20-year forgiveness
- **IBR:** 10-15% of discretionary income; 20-25 year forgiveness
- **ICR:** 20% of discretionary income or 12-year fixed adjusted payment; 25-year forgiveness

**Public Service Loan Forgiveness (PSLF):**
- Requires: federal Direct Loans, IDR plan, qualifying employer (government, 501c3), 120 qualifying payments
- Submit Employment Certification Form annually
- After 120 payments (10 years), remaining balance forgiven tax-free

**Decision framework:**
- High income relative to debt: Standard or avalanche extra payments
- Low income relative to debt: IDR plan
- Public service career: PSLF path
- Private loans: Refinance if rate drops 1%+ and you don't need federal protections

### Student Loan Payoff vs. Investing Decision

```
Compare:
  Student loan interest rate: ____%
  Expected investment return: ____%  (historical S&P 500 average ~10% nominal, ~7% real)
  Tax deduction benefit: $__________

If loan rate > expected return: Pay off the loan
If loan rate < expected return: Pay minimums and invest the difference
If rates are close: Consider risk tolerance and psychological preference
```

---

## Mortgage Payoff Acceleration

### Extra Payment Strategies

1. **One extra payment per year:** Reduces a 30-year mortgage by ~4-5 years
2. **Bi-weekly payments:** 26 half-payments = 13 full payments per year (one extra)
3. **Round up payments:** Round to nearest $100
4. **Lump sum principal payments:** Apply tax refunds or bonuses to principal

```
MORTGAGE ACCELERATION CALCULATOR
================================
Original loan amount: $__________
Current balance: $__________
Interest rate: ____%
Monthly payment (P&I): $__________
Remaining term: ____ months

Strategy: [extra payment amount] $__________ per month

Without extra payments:
  Payoff date: __________
  Total interest remaining: $__________

With extra payments:
  New payoff date: __________
  Total interest remaining: $__________
  INTEREST SAVED: $__________
  TIME SAVED: ____ months
```

---

## Debt-to-Income Ratio

### Calculation

```
DTI RATIO
=========
Monthly gross income: $__________

Monthly debt payments:
  Mortgage / Rent:     $__________
  Car payment:         $__________
  Student loans:       $__________
  Credit cards (min):  $__________
  Personal loans:      $__________
  Other:               $__________
  TOTAL DEBT PAYMENTS: $__________

DTI = Total Debt Payments / Gross Monthly Income x 100
DTI = $__________ / $__________ x 100 = ____%
```

### DTI Benchmarks
| DTI Range | Assessment |
|-----------|-----------|
| Under 20% | Excellent -- strong financial position |
| 20-35% | Healthy -- manageable debt load |
| 36-43% | Caution -- may struggle to get new credit |
| 44-50% | Danger zone -- financial stress likely |
| Over 50% | Crisis -- seek professional help immediately |

---

## Payoff Milestone Tracker

```
DEBT FREEDOM TRACKER
====================
Starting total debt: $__________
Starting date: __________
Target debt-free date: __________

Milestone          | Target Date | Actual Date | Balance Remaining
25% paid off       | __________  | __________  | $__________
50% paid off       | __________  | __________  | $__________
75% paid off       | __________  | __________  | $__________
First debt gone    | __________  | __________  | $__________
Half of debts gone | __________  | __________  | $__________
DEBT FREE          | __________  | __________  | $0.00
```

---

## Emergency Situations

### If You Cannot Make Minimum Payments
1. Contact creditors BEFORE missing payments -- ask for hardship programs
2. Prioritize in this order: housing, utilities, food, transportation, secured debts, unsecured debts
3. Look into nonprofit credit counseling (NFCC member agencies)
4. Consider whether bankruptcy consultation is appropriate (last resort, but sometimes the right answer)

### If You Receive a Windfall
1. Maintain $1,000-2,000 emergency buffer
2. Apply the rest to debt using your chosen strategy order
3. Do not "reward yourself" with the entire windfall -- commit at least 80% to debt

---

## Output Format

When delivering a debt strategy, provide:

1. **Debt summary** -- Total owed, weighted average rate, current DTI
2. **Recommended strategy** -- Snowball, avalanche, or hybrid with reasoning
3. **Payoff order** -- Numbered list of debts in the recommended order
4. **Monthly action plan** -- Exact dollar amounts to pay on each debt
5. **Timeline** -- Projected payoff dates for each debt and total debt freedom date
6. **Total interest comparison** -- Show savings vs. minimum-payment-only path
7. **Next steps** -- Top 3 actions to take this week

## Example

**Input:** "I have $8,000 on a credit card at 22% APR, $3,000 on another card at 18%, and $12,000 in student loans at 5%. I can put $800/month toward debt beyond minimums."

**Output:**

## Debt Payoff Strategy

### Debt Inventory
| Debt | Balance | APR | Minimum | Priority (Avalanche) |
|------|---------|-----|---------|---------------------|
| Credit Card 1 | $8,000 | 22% | $160 | 1 (highest rate) |
| Credit Card 2 | $3,000 | 18% | $60 | 2 |
| Student Loans | $12,000 | 5% | $125 | 3 (lowest rate) |
| **Total** | **$23,000** | -- | **$345** | -- |

### Recommended: Avalanche Method
Extra payment budget: $800/month (above minimums)
Total monthly toward debt: $800 + $345 = $1,145

**Phase 1 (Months 1-10):** All $800 extra to CC1 ($960/mo to CC1)
- CC1 paid off in ~10 months, saving ~$1,800 in interest vs. snowball

**Phase 2 (Months 11-14):** All $960 (freed CC1 payment + extra) to CC2
- CC2 paid off in ~4 months

**Phase 3 (Months 15-26):** All $1,020 to student loans
- Student loans paid off in ~12 months

**Total payoff time:** ~26 months
**Total interest paid:** ~$3,200 (vs. ~$4,100 with snowball method)

### Acceleration Opportunity
Check if CC1 qualifies for a 0% balance transfer card. Moving $8,000 to 0% for 18 months saves ~$1,400 in interest and frees cash to attack CC2 simultaneously.

## Edge Cases

- **Incomplete information:** Ask clarifying questions before proceeding. Do not assume details the user has not provided.
- **Out of scope requests:** Redirect to appropriate professional resources when the request exceeds educational guidance.
- **Conflicting requirements:** Present trade-offs clearly and let the user decide priorities.
