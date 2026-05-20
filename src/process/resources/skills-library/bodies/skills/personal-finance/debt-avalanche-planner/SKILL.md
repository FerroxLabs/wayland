---
name: debt-avalanche-planner
description: |
  Applies the debt avalanche method (highest interest rate first) to create an interest-optimized debt payoff plan. Calculates the total interest saved compared to minimum payments and the snowball method, with a sequenced payment schedule showing exact monthly amounts and payoff dates for each debt.
  Use when the user wants to minimize total interest paid on multiple debts, prefers a mathematically optimal payoff strategy, or asks about the debt avalanche approach.
  Do NOT use for motivation-focused payoff (use debt-snowball-planner), debt consolidation evaluation (use debt-consolidation-analysis), or single-debt payoff calculation.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "debt-management personal-finance budgeting analysis"
  category: "personal-finance"
  subcategory: "debt-management"
  depends: ""
  disclaimer: "educational-finance"
  difficulty: "intermediate"
---
# Debt Avalanche Planner

> **Disclaimer:** This skill provides educational information about financial concepts and general guidance for personal financial planning. It does NOT constitute financial advice, investment recommendations, or tax guidance. Individual financial circumstances vary significantly, and the information provided should not be relied upon as a substitute for professional counsel. Always consult a qualified financial advisor, tax professional, or licensed financial planner before making significant financial decisions.

---

## When to Use

**Use this skill when:**
- The user explicitly wants to minimize total interest paid and has two or more debts with different APRs -- the avalanche method produces maximum mathematical savings when APR spreads are 5 percentage points or greater
- The user asks about the debt avalanche method, highest-interest-first payoff, or mathematically optimal debt elimination
- The user is analytically motivated and has stated they prefer data-driven decision making over quick psychological wins
- The user wants a side-by-side comparison of avalanche vs. snowball vs. minimum payments to make an informed choice
- The user has at least one high-interest revolving debt (credit card APR typically 18--29%) alongside lower-rate installment debts (auto loans 5--8%, student loans 4--7%) -- this APR spread is where avalanche delivers the strongest savings
- The user has received a windfall (tax refund, bonus, inheritance) and wants to apply it optimally to a multi-debt portfolio
- The user wants to model how a future raise or freed-up cashflow would accelerate their payoff timeline
- The user is deciding whether to pay more than minimums and wants to see the precise interest cost of inaction

**Do NOT use when:**
- The user is primarily motivated by eliminating individual debts for psychological wins -- use `debt-snowball-planner` instead, as the snowball method's motivational structure produces better real-world outcomes for many people even at a small mathematical cost
- The user wants to evaluate whether combining debts into a single new loan makes sense -- use `debt-consolidation-analysis`, which accounts for origination fees, credit score requirements, and break-even timelines
- The user is comparing new loan options (personal loan vs. balance transfer vs. HELOC) -- use `loan-comparison`
- The user has only one debt -- no sequencing is needed; use a single-debt amortization calculation instead
- The user has business debt, commercial lines of credit, or small business loans -- different tax treatment, deductibility rules, and cash flow structures apply
- The user is underwater on a secured asset (negative equity) or facing imminent default -- these situations require hardship program analysis, not an optimization schedule
- The user has debts currently in collections or charge-off status -- these require settlement negotiation analysis before a payoff plan makes sense
- The user is asking about whether to invest vs. pay off debt -- use `invest-vs-pay-debt-analysis`, which compares after-tax expected returns against guaranteed interest savings

---

## Process

### Step 1: Gather Complete Debt Profile

Collect the following for every debt before doing any calculation. Missing fields will make the schedule inaccurate.

- **Debt name and type** -- credit card, personal loan, auto loan, student loan (federal vs. private), medical debt, HELOC, etc. Type matters because it affects whether interest is tax-deductible and what happens if payments are missed
- **Current outstanding balance** -- the exact balance as of today, not the original loan amount. Emphasize "current" because a balance pulled from a statement may be 30 days old and already has additional interest accrued
- **Annual Percentage Rate (APR)** -- the annualized rate used for interest calculation. For credit cards, ask for the purchase APR specifically (cash advance APR is often 5--10 points higher and applies only to cash advance balances). For variable-rate debts, use the current rate and flag variability
- **Minimum monthly payment** -- the actual required payment, not an estimate. For credit cards, minimum payments typically equal 1--2% of the balance or $25--35, whichever is greater, and they decrease as the balance falls (this is critical: under minimum-payment-only scenarios, you must model the declining minimum, not a fixed amount)
- **Payment due date** -- helps the user understand cash flow sequencing within the month
- **Promotional or introductory rate** -- if a balance transfer or 0% promo applies, capture: the promo rate, the post-promo rate (often 24--29% for balance transfer cards), the promo expiration date, and any balance transfer fee already charged
- **Prepayment penalties** -- rare on revolving debt but common on some personal loans and mortgages; a prepayment penalty can negate the benefit of early payoff on that specific debt
- **Secured vs. unsecured** -- secured debts (auto, mortgage, HELOC) carry asset-repossession risk if minimums are missed; this risk overrides all optimization logic

If the user cannot provide all details, proceed with available data but note assumptions explicitly in the output.

### Step 2: Determine the Monthly Payment Budget and Extra Payment

- Ask for the total fixed monthly amount the user can commit to all debt payments combined. This number should be realistic -- based on take-home pay minus essential expenses, not aspirational
- Calculate: **Extra payment = Total budget -- Sum of all minimum payments**
- If the extra payment is zero or negative, the user cannot afford even minimums -- escalate with a note that budget must increase before any payoff strategy applies. Do not proceed with a plan that shows missed minimums
- If the extra payment is under $25/month, note that the mathematical difference between avalanche and snowball will be less than $50--100 total over the life of the plan. In this range, method choice should be driven by motivation, not math
- If the extra payment is over $500/month, the payoff timeline compresses significantly and the APR spread matters even more -- model the plan carefully because high extra payments applied to lower-balance/high-rate debts will free up rollovers quickly
- Ask whether the monthly budget is fixed or variable. If the user anticipates raises, seasonal income, or periodic windfalls, note those as "accelerator events" to model separately

### Step 3: Sort Debts in Avalanche Order and Apply Tie-Breaking Rules

The avalanche method has one defining rule: **sort by APR from highest to lowest.** Apply these tie-breaking rules in sequence:

1. **Same APR, different balance:** Put the smaller balance first. A smaller balance is eliminated faster, freeing its minimum payment as rollover sooner, which marginally reduces total interest
2. **Same APR, same balance:** Put the debt with the higher minimum payment first, because eliminating it creates a larger rollover payment for the next target
3. **Promotional 0% debt:** Do NOT place it last automatically. Calculate the post-promotional APR and determine whether it will expire before the avalanche would naturally reach it. If the promo expires mid-plan, the effective APR of that debt jumps -- recalculate its priority using the post-promo rate if expiration is within the payoff window
4. **Tax-deductible interest (mortgage, some student loans):** The after-tax cost of these debts is lower than the stated APR. Calculate: **After-tax APR = Stated APR × (1 -- marginal tax rate)**. For a user in the 22% federal bracket, a 6.5% mortgage has an after-tax cost of approximately 5.07%. Use after-tax APR for prioritization if the user itemizes deductions. Note this adjustment explicitly

### Step 4: Calculate Month-by-Month Amortization for Each Debt

This is the computational core. Generic estimates produce errors that accumulate over a 3--5 year payoff horizon. Use the following precise methodology:

**For each month in the plan:**

1. **Calculate monthly interest:** Monthly interest = (APR ÷ 12) × remaining balance
   - Example: $3,200 balance at 24% APR → (0.24 ÷ 12) × $3,200 = $64 interest in Month 1
2. **Calculate principal reduction:** Payment applied to principal = Payment -- Monthly interest
3. **Update balance:** New balance = Previous balance -- Principal reduction
4. **Repeat until balance reaches zero**

**Rollover mechanics -- this is where most errors occur:**
- When Debt #1 reaches zero, in the SAME month record: final interest charge, final payment (which may be less than the normal monthly payment if the balance is small), and the freed amount
- The freed amount = minimum payment of Debt #1 + the extra payment that was directed to Debt #1
- In the following month, this entire freed amount is added to Debt #2's payment on top of Debt #2's existing minimum
- Carry this rollover forward identically with each subsequent debt elimination

**Modeling declining minimums for credit cards under minimum-payment-only scenario:**
- Credit card minimums typically = max($25, 1% of balance + current month's interest) -- this means minimum payments decline as the balance falls
- Under minimum-payments-only, use this declining formula for the comparison baseline. Using a fixed minimum understates how long minimum-only payoff actually takes and overstates interest, making your savings comparison inaccurate
- A $3,200 balance at 24% APR on minimum payments only (declining formula) takes approximately 11--13 years to pay off, not 3--4 years

### Step 5: Calculate Comparison Scenarios

Always calculate three scenarios to give the user a complete picture:

**Scenario A -- Minimum Payments Only:**
- Apply minimum payments to all debts indefinitely (use declining minimum formula for revolving debts)
- For installment loans, minimums are fixed -- use the contractual payment
- Total interest and time to zero for all debts
- This is the "cost of inaction" baseline

**Scenario B -- Debt Snowball (smallest balance first):**
- Resort debts from smallest to largest balance
- Apply the same total monthly budget as the avalanche plan
- Calculate interest and payoff timeline using the same amortization method
- The snowball will produce a different payoff ORDER but the same total monthly payment
- Typically the snowball finishes within 1--3 months of the avalanche (similar timeline) but costs more in interest -- the interest gap widens as APR spread between smallest and largest balance debts increases

**Scenario C -- Debt Avalanche:**
- The primary plan as calculated in Step 4

**Key calculation -- Avalanche vs. Snowball difference:**
- This gap is driven by how long high-APR debt sits unattacked while the snowball targets small-balance/low-APR debts first
- If the highest-APR debt also has the smallest balance (e.g., a small credit card balance at 24%), avalanche and snowball are identical -- same debt targeted first
- The largest avalanche advantage occurs when the highest-APR debt has a large balance AND there are multiple small-balance low-APR debts the snowball would target first

### Step 6: Build the Formatted Payoff Schedule

For each debt in avalanche order, document:
- Phase start date (Month 1 for Debt #1; month after prior debt payoff for subsequent debts)
- Monthly payment amount broken into: minimum + rollover from prior debts + original extra
- Number of months in active payoff phase
- Payoff date (calculate from current calendar month)
- Total interest paid under avalanche
- Total interest that debt would have accrued under minimums only
- Interest saved on this specific debt

Create the Monthly Payment Flow table showing all phases simultaneously -- this helps the user see that their total monthly outlay stays constant throughout the plan (all minimums always paid, extra shifts target).

### Step 7: Present Milestones, Warnings, and Behavioral Guidance

- List each debt payoff as a milestone with a calendar date
- Flag any at-risk situations: promotional rate expiring before the avalanche reaches that debt, variable rates that could change payoff order, any debt with a balloon payment or required payoff date
- Note the psychological trade-off directly and without judgment: the avalanche is mathematically optimal but the first payoff milestone may be 12--18 months away; the snowball might deliver a first payoff win in 3--6 months. Present both timelines so the user can make an informed choice
- Suggest concrete motivation strategies for avalanche users who face a long first phase: track balance reduction percentage monthly, calculate "interest saved to date" each month as a running total

---

## Output Format

```
## Debt Avalanche Payoff Plan

> **Disclaimer:** [Educational use only -- not financial advice. Consult a qualified financial professional for personalized guidance.]

### Debt Inventory (Sorted: Highest to Lowest APR)
| # | Debt Name      | Current Balance | APR    | Min. Payment | Avalanche Order | Notes                        |
|---|----------------|-----------------|--------|--------------|-----------------|------------------------------|
| 1 | [Highest APR]  | $X,XXX          | XX.X%  | $XXX         | Target first    | [Variable rate / secured / etc.] |
| 2 | [Next APR]     | $X,XXX          | XX.X%  | $XXX         | Target second   |                              |
| 3 | [Next APR]     | $XX,XXX         | XX.X%  | $XXX         | Target third    |                              |
| 4 | [Lowest APR]   | $XX,XXX         | X.X%   | $XXX         | Target last     | [Secured -- maintain minimums] |

### Payment Configuration
| Metric                          | Amount  |
|---------------------------------|---------|
| Total monthly budget            | $X,XXX  |
| Sum of all minimum payments     | $XXX    |
| Extra payment (avalanche fuel)  | $XXX    |
| Extra payment as % of minimums  | XX%     |

---

### Avalanche Payoff Schedule

**Phase 1 -- Debt #1: [Name] ([APR]% APR) -- ACTIVE TARGET**
| Field                              | Value                          |
|------------------------------------|-------------------------------|
| Starting balance                   | $X,XXX                        |
| Monthly payment                    | $XXX ($XXX min + $XXX extra)  |
| Monthly interest (Month 1)         | $XX.XX                        |
| Months in active payoff            | XX months                     |
| Phase start                        | [Month Year]                  |
| Payoff date                        | [Month Year]                  |
| Total interest paid (avalanche)    | $XXX                          |
| Total interest (minimums only)     | $X,XXX                        |
| Interest saved by targeting first  | $XXX                          |

**Phase 2 -- Debt #2: [Name] ([APR]% APR)**
| Field                              | Value                                          |
|------------------------------------|------------------------------------------------|
| Starting balance at Phase 2        | $X,XXX (includes interest during Phase 1)      |
| Monthly payment                    | $XXX ($XXX min + $XXX rollover from Debt #1)   |
| Months in active payoff            | XX months                                      |
| Phase start                        | [Month Year] (month after Debt #1 payoff)      |
| Payoff date                        | [Month Year]                                   |
| Total interest paid (avalanche)    | $XXX                                           |
| Interest saved vs. minimums        | $XXX                                           |

**Phase 3 -- Debt #3: [Name] ([APR]% APR)**
| Field                              | Value                                          |
|------------------------------------|------------------------------------------------|
| Starting balance at Phase 3        | $X,XXX (includes interest during Phases 1--2)  |
| Monthly payment                    | $XXX ($XXX min + $XXX rollover from Debts 1--2)|
| Months in active payoff            | XX months                                      |
| Phase start                        | [Month Year]                                   |
| Payoff date                        | [Month Year]                                   |
| Total interest paid (avalanche)    | $X,XXX                                         |
| Interest saved vs. minimums        | $XXX                                           |

**Phase 4 -- Debt #4: [Name] ([APR]% APR) -- FINAL TARGET**
| Field                              | Value                                                  |
|------------------------------------|--------------------------------------------------------|
| Starting balance at Phase 4        | $XX,XXX (includes interest during Phases 1--3)         |
| Monthly payment                    | $X,XXX (all prior payments rolled over -- full budget) |
| Months in active payoff            | XX months                                              |
| Phase start                        | [Month Year]                                           |
| Payoff date                        | [Month Year]                                           |
| Total interest paid (avalanche)    | $XXX                                                   |
| Interest saved vs. minimums        | $XXX                                                   |

---

### Monthly Payment Flow (All Phases)
| Phase          | Months       | Target Debt       | Payment to Target | All Other Debts      | Total Monthly |
|----------------|--------------|-------------------|-------------------|----------------------|---------------|
| Phase 1        | 1 -- XX      | [Debt #1 name]    | $XXX              | Minimums only ($XXX) | $X,XXX        |
| Phase 2        | XX -- XX     | [Debt #2 name]    | $XXX              | Minimums only ($XXX) | $X,XXX        |
| Phase 3        | XX -- XX     | [Debt #3 name]    | $XXX              | Minimums only ($XXX) | $X,XXX        |
| Phase 4        | XX -- XX     | [Debt #4 name]    | $X,XXX            | (all others paid)    | $X,XXX        |

---

### Scenario Comparison
| Scenario                | Total Interest | Months to Debt-Free | Interest Saved vs. Min | vs. Snowball         |
|-------------------------|---------------|---------------------|------------------------|----------------------|
| Minimum payments only   | $XX,XXX       | ~XXX months         | baseline               | --                   |
| Debt snowball           | $X,XXX        | ~XX months          | $X,XXX saved           | --                   |
| **Debt avalanche**      | **$X,XXX**    | **~XX months**      | **$X,XXX saved**       | **$XXX less interest** |

> Note: The snowball and avalanche methods often reach debt-free within 1--4 months of each other when using the same total monthly budget. The avalanche advantage is purely in total interest cost. If the snowball order would help you stay consistent with payments, the smaller mathematical cost may be worth the motivational benefit. Choose the method you will actually follow.

---

### Plan Summary
| Metric                              | Value             |
|-------------------------------------|-------------------|
| Total debt today                    | $XX,XXX           |
| Total interest under avalanche      | $X,XXX            |
| Total amount you will pay           | $XX,XXX           |
| Effective blended interest rate     | X.X%              |
| Interest saved vs. minimum payments | $X,XXX            |
| Interest saved vs. snowball         | $XXX              |
| Months to debt-free                 | XX months         |
| Debt-free date                      | [Month Year]      |

---

### Payoff Milestones
- [ ] **[Debt #1] eliminated** -- [Month Year] | Rollover $XXX to [Debt #2]
- [ ] **[Debt #2] eliminated** -- [Month Year] | Rollover $XXX to [Debt #3]
- [ ] **[Debt #3] eliminated** -- [Month Year] | Rollover $XXX to [Debt #4]
- [ ] **Completely debt-free** -- [Month Year] 🎯

---

### Risk Flags
[List any of the following that apply:]
- ⚠️ [Debt name] is a variable-rate debt. If its rate increases, it may overtake [other debt] in avalanche priority. Reassess order if rate changes by more than 1--2 percentage points.
- ⚠️ [Debt name] promotional rate expires [Month Year]. Under the current plan, the avalanche does not reach this debt until [Month Year]. If the rate jumps to XX%, reconsider targeting this debt earlier.
- ⚠️ [Debt name] is secured by [asset]. Maintaining the minimum payment on this debt is non-negotiable -- missed payments risk [repossession/foreclosure].
- ⚠️ [Debt name] has a prepayment penalty of [amount/formula]. Factor this cost into the true savings before accelerating payoff on this debt.
```

---

## Rules

1. **Always display the disclaimer first.** This is non-negotiable regardless of how conversational the request is.

2. **APR sort order is inviolable.** The avalanche method is defined by highest APR first. Never deviate from this -- not for balance size, not for emotional reasons, not for debt type. If you adjust for after-tax APR on deductible debt, document the adjustment explicitly so the user understands why the order differs from a naive APR sort.

3. **All minimums must be maintained on every debt at all times.** Extra payment flows only to the current target debt. A missed minimum on any debt can trigger penalty APR (often 29.99%), late fees ($25--40), and credit score damage. These outcomes are catastrophically worse than any interest optimization benefit.

4. **Use declining minimum formulas for revolving credit in the minimum-payment-only baseline.** A fixed-minimum assumption for credit cards understates payoff time and inflates interest -- making your avalanche savings comparison inaccurate. Credit card minimums typically equal the greater of: $25--35 flat, or 1% of balance + current month's interest charge.

5. **Model interest accrual on non-target debts during their waiting phases.** Between Phase 1 and the point a debt becomes the active target, interest continues to accrue each month. The balance when a debt enters its active phase will be higher than the starting balance. Failing to model this produces payoff dates that are optimistic by weeks to months.

6. **Flag variable-rate and promotional-rate debts visibly in the Risk Flags section.** Variable APR debts (HELOCs, adjustable-rate loans) can change priority mid-plan. Promotional 0% rates that expire before the avalanche reaches them represent the single most common error in DIY avalanche planning.

7. **Always present the snowball comparison.** Never present the avalanche as simply "better" -- it is mathematically better at minimizing interest but the snowball method has strong empirical support for improving follow-through and completion rates. Present both scenarios with real numbers and let the user decide. Do not editorialize beyond presenting the trade-off clearly.

8. **Show per-debt interest savings, not just totals.** The per-debt breakdown reveals which debts are most expensive and creates emotional salience around the highest-rate target. A user who sees that their credit card would cost $1,400 in interest under minimums vs. $490 under the avalanche understands the stakes of the first payoff phase in a way that totals alone cannot convey.

9. **Calculate payoff dates from the actual current month.** Use real calendar month names and years. "Month 15" is meaningless to a user -- "August 2026" is actionable and can be put in a calendar. Acknowledge that dates will shift if any payment is missed, increased, or a windfall is applied.

10. **Never recommend skipping the avalanche target to pay off a "satisfying" smaller debt.** This is the snowball method, and it should be recommended as a separate, explicit choice -- not as an improvisation mid-plan. If the user raises this impulse, present the specific dollar cost of the detour, then affirm that switching to the snowball method entirely is a legitimate choice if motivation is the priority.

11. **Treat prepayment penalties as an interest cost, not a principal payment.** If Debt #3 has a 2% prepayment penalty on remaining balance and the avalanche would pay it off 18 months early, calculate whether the interest savings over those 18 months exceed the penalty. If they do not, reorder that debt to pay it off at its natural maturity instead.

12. **Do not model debt payoff below $1 balance.** Final payments are often less than the regular monthly amount. In the last month of each debt's phase, calculate the exact payoff amount (remaining balance + final month's interest) rather than applying the full payment amount, then roll the remainder into the next phase.

---

## Edge Cases

### Highest-APR Debt Is Also the Largest Balance (Long First Phase)
When the first target has both the highest rate AND the largest balance -- common when a large credit card balance exists alongside small installment loans -- the first payoff milestone can be 24--36 months away. This is the scenario where avalanche users are most likely to abandon the plan.

Handle this by:
- Calculating and displaying quarterly "interest saved to date" milestones within Phase 1 (e.g., "After 3 months of the plan, you've already saved $180 in interest vs. minimum payments")
- Showing the balance reduction curve explicitly month by month for Debt #1 -- seeing $3,200 → $2,970 → $2,730 over the first few months reinforces progress even without a full payoff event
- Noting that under the snowball method, the first payoff would occur in [X months] at a cost of [Y dollars more in interest] -- present this as a genuine trade-off, not a failure mode

### Promotional 0% Rate Expiring Mid-Plan
This is the most consequential edge case and the most commonly mishandled. A balance transfer card with 0% for 18 months appears last in the avalanche at 0% APR. But if the avalanche won't reach it for 30 months, the post-promo rate of 24--27% will be active for 12 months before the avalanche arrives -- costing hundreds of dollars in unnecessary interest.

Resolution process:
1. Identify the month the promo expires
2. Calculate what the balance will be at that expiration date (accounting for minimum payments applied during Phases 1--N)
3. Recalculate the debt's priority using the post-promo APR from expiration forward
4. If the post-promo APR makes it the highest-rate debt, recommend temporarily "front-loading" this debt before the promo expires, then resuming the standard avalanche order
5. Alternatively, flag that the user should attempt to pay off this debt entirely before the promo expires -- calculate whether the budget allows it

### All Debts Within a Narrow APR Band (Within 2--3 Percentage Points)
When all debts are clustered within 3 points of each other (e.g., 14%, 15.5%, 16%, 16.5%), the mathematical advantage of avalanche over snowball is under $100--200 over the entire payoff horizon. At this spread, the choice of method should be driven entirely by which approach the user will adhere to. Explicitly quantify the difference ("The avalanche saves approximately $85 more than the snowball over 36 months -- less than $3/month") and recommend the snowball unless the user explicitly prefers the avalanche for principled reasons.

### Windfall Applied Mid-Plan
When a user receives a bonus, tax refund, or other lump sum during an active avalanche plan:

1. Apply the entire windfall to the current active target (highest-APR debt) -- do not split it or put it toward a lower-rate debt "to pay it off"
2. Recalculate the remaining balance on the active target
3. Recalculate the remaining months in Phase 1 and all subsequent phase start dates
4. Show the revised debt-free date vs. the original -- the acceleration is usually the most motivating output of this calculation
5. Note: if the windfall is larger than the remaining balance on Debt #1, apply the remainder to Debt #2 (the next avalanche target), not to any other debt

### Mixed Secured and Unsecured Debts With Near-Equal APRs
When a secured debt (auto loan at 7.5%) and an unsecured debt (personal loan at 8%) have nearly identical APRs, the math says to target the personal loan first. However, the behavioral risk profile differs: missing a payment on the auto loan risks repossession; missing the personal loan triggers fees and credit damage but not immediate asset loss.

Document this explicitly in the plan -- note which debts are secured and reinforce that minimum payments on secured debts are structurally non-negotiable regardless of their position in the avalanche order.

### User's Budget Can't Cover All Minimums
If total minimums exceed the monthly budget, the avalanche plan cannot proceed. The user is in a debt crisis scenario, not a debt optimization scenario. Steps to take:
1. Identify the shortfall (e.g., "Your minimums total $850 but you have $700 available -- a $150 monthly gap")
2. Do not produce an avalanche plan that implicitly shows missed minimums
3. Recommend the user contact each creditor's hardship department -- most major lenders have temporary reduced-payment programs
4. Note that nonprofit credit counseling agencies (NFCC members) offer Debt Management Plans that consolidate minimums at reduced rates, which may solve the gap
5. Redirect to a budget-building skill before returning to debt optimization

### Variable-Rate Debts (HELOCs, Adjustable-Rate Loans)
Variable-rate debts are sorted by their current rate but their position in the avalanche can shift. HELOCs tied to prime rate can move 0.25--0.50% per Federal Reserve meeting.

Handle this by:
- Flagging the debt clearly in the Risk Flags section with the current rate, the rate index it tracks, and the rate cap if available
- Instructing the user to reassess avalanche order whenever the variable rate changes by more than 1 full percentage point
- Modeling a "rate increase scenario" if relevant -- e.g., "If this HELOC rate rises from 8.5% to 10.5% by next year, it would move from position #3 to position #1 in your avalanche order"

---

## Example

**Input:** "I have four debts. Credit card: $3,200 balance, 24% APR, $90 minimum. Store card: $1,800 balance, 19% APR, $55 minimum. Personal loan: $7,500 balance, 12% APR, $175 minimum. Car loan: $11,000 balance, 6% APR, $320 minimum. I can pay $800/month total. Today is February 2025."

---

## Debt Avalanche Payoff Plan

> **Disclaimer:** This plan is for educational purposes and general financial modeling only. It does not constitute financial advice. Actual interest charges may differ based on your lender's calculation method, payment timing, and rate changes. Consult a qualified financial professional before making significant financial decisions.

---

### Debt Inventory (Sorted: Highest to Lowest APR)

| # | Debt Name     | Current Balance | APR   | Min. Payment | Avalanche Order | Notes              |
|---|---------------|-----------------|-------|--------------|-----------------|---------------------|
| 1 | Credit Card   | $3,200          | 24.0% | $90          | Target first    | Unsecured revolving |
| 2 | Store Card    | $1,800          | 19.0% | $55          | Target second   | Unsecured revolving |
| 3 | Personal Loan | $7,500          | 12.0% | $175         | Target third    | Unsecured installment|
| 4 | Car Loan      | $11,000         | 6.0%  | $320         | Target last     | Secured -- auto ⚠️  |

---

### Payment Configuration

| Metric                         | Amount |
|--------------------------------|--------|
| Total monthly budget           | $800   |
| Sum of all minimum payments    | $640   |
| Extra payment (avalanche fuel) | $160   |
| Extra as % of total minimums   | 25%    |

---

### Avalanche Payoff Schedule

**Phase 1 -- Debt #1: Credit Card (24.0% APR) -- ACTIVE TARGET**

Monthly interest rate: 24% ÷ 12 = 2.0% per month

| Field                              | Value                               |
|------------------------------------|-------------------------------------|
| Starting balance                   | $3,200.00                           |
| Monthly payment                    | $250 ($90 min + $160 extra)         |
| Month 1 interest charge            | $64.00 (2.0% × $3,200)              |
| Month 1 principal reduction        | $186.00 ($250 -- $64)               |
| Balance after Month 1              | $3,014.00                           |
| Months in active payoff            | ~15 months                          |
| Phase start                        | February 2025                       |
| Payoff date                        | April 2026                          |
| Total interest paid (avalanche)    | ~$493                               |
| Total interest (minimums only)     | ~$1,290 (over ~13 years, declining min)|
| **Interest saved by targeting first**  | **~$797**                       |

Midpoint check (Month 8): Balance ≈ $1,755; you have already reduced the balance by 45% and saved approximately $320 in interest vs. minimum payments.

---

**Phase 2 -- Debt #2: Store Card (19.0% APR)**

During Phase 1 (15 months), Store Card accrues interest at 19% ÷ 12 = 1.583%/month on minimums of $55/month. Balance at start of Phase 2 ≈ $1,620 (interest accrued during Phase 1 offset by 15 months of minimum payments).

| Field                              | Value                                        |
|------------------------------------|----------------------------------------------|
| Balance at Phase 2 start           | ~$1,620                                      |
| Monthly payment                    | $305 ($55 min + $250 rollover from Debt #1)  |
| Month 1 interest charge (Phase 2)  | ~$25.64 (1.583% × $1,620)                   |
| Months in active payoff            | ~6 months                                    |
| Phase start                        | May 2026                                     |
| Payoff date                        | October 2026                                 |
| Total interest paid (avalanche)    | ~$78                                         |
| Total interest (minimums only)     | ~$680                                        |
| **Interest saved**                 | **~$602**                                    |

---

**Phase 3 -- Debt #3: Personal Loan (12.0% APR)**

During Phases 1--2 (21 months total), Personal Loan accrues interest at 12% ÷ 12 = 1.0%/month on minimums of $175/month. Balance at start of Phase 3 ≈ $5,780 (standard installment amortization; 21 payments of $175 at 1%/month from $7,500).

| Field                              | Value                                             |
|------------------------------------|---------------------------------------------------|
| Balance at Phase 3 start           | ~$5,780                                           |
| Monthly payment                    | $480 ($175 min + $305 rollover from Debts #1--#2) |
| Month 1 interest charge (Phase 3)  | ~$57.80 (1.0% × $5,780)                          |
| Months in active payoff            | ~13 months                                        |
| Phase start                        | November 2026                                     |
| Payoff date                        | November 2027                                     |
| Total interest paid (avalanche)    | ~$415                                             |
| Total interest (original schedule) | ~$1,100 (full loan term at $175/month)            |
| **Interest saved**                 | **~$685**                                         |

---

**Phase 4 -- Debt #4: Car Loan (6.0% APR) -- FINAL TARGET**

During Phases 1--3 (34 months total), Car Loan amortizes normally at 6% ÷ 12 = 0.5%/month on $320/month minimum from $11,000. Balance at start of Phase 4 ≈ $4,250 (standard amortization over 34 months).

| Field                              | Value                                                     |
|------------------------------------|-----------------------------------------------------------|
| Balance at Phase 4 start           | ~$4,250                                                   |
| Monthly payment                    | $800 (entire budget -- all other debts cleared)           |
| Month 1 interest charge (Phase 4)  | ~$21.25 (0.5% × $4,250)                                  |
| Months in active payoff            | ~6 months                                                 |
| Phase start                        | December 2027                                             |
| Payoff date                        | May 2028                                                  |
| Total interest paid (avalanche)    | ~$72                                                      |
| Interest under original schedule   | ~$390 (remaining term at $320/month)                      |
| **Interest saved**                 | **~$318**                                                 |

---

### Monthly Payment Flow (All Phases)

| Phase   | Months       | Active Target | Payment to Target | Minimums Elsewhere | Total Monthly |
|---------|--------------|---------------|-------------------|--------------------|---------------|
| Phase 1 | Feb 2025 -- Apr 2026 (15 mo) | Credit Card   | $250              | $550 (store+loan+car) | $800 |
| Phase 2 | May 2026 -- Oct 2026 (6 mo)  | Store Card    | $305              | $495 (loan+car)    | $800          |
| Phase 3 | Nov 2026 -- Nov 2027 (13 mo) | Personal Loan | $480              | $320 (car only)    | $800          |
| Phase 4 | Dec 2027 -- May 2028 (6 mo)  | Car Loan      | $800              | $0 (all paid)      | $800          |

**Total plan duration: ~40 months (Feb 2025 -- May 2028)**

---

### Scenario Comparison

| Scenario                | Total Interest | Months to Debt-Free | Interest Saved vs. Min  | vs. Snowball          |
|-------------------------|---------------|---------------------|-------------------------|-----------------------|
| Minimum payments only   | ~$3,460       | ~78 months          | baseline                | --                    |
| Debt snowball           | ~$1,330       | ~41 months          | ~$2,130 saved           | --                    |
| **Debt avalanche**      | **~$1,058**   | **~40 months**      | **~$2,402 saved**       | **~$272 less interest** |

> **Note on snowball vs. avalanche timing:** Both methods reach debt-free within 1 month of each other (40 vs. 41 months). The avalanche saves $272 more in interest over that period -- about $6.80/month averaged across the plan. For some users, the snowball's first payoff milestone of 6--8 months (targeting the $1,800 store card first) is worth $272 in motivational value. For others, the avalanche's mathematical clarity is its own motivation. Neither choice is wrong. Choose the method you will follow without deviation for 40 months.

> **Snowball order for reference:** Store Card first ($1,800), Credit Card second ($3,200), Personal Loan third ($7,500), Car Loan last ($11,000). First payoff milestone under snowball: approximately August 2025 (6 months in). First payoff milestone under avalanche: approximately April 2026 (15 months in).

---

### Plan Summary

| Metric                              | Value              |
|-------------------------------------|--------------------|
| Total debt today                    | $23,500            |
| Total interest under avalanche      | ~$1,058            |
| Total amount you will pay           | ~$24,558           |
| Effective blended interest rate     | ~9.1% (weighted avg by balance)|
| Interest saved vs. minimum payments | ~$2,402            |
| Interest saved vs. snowball         | ~$272              |
| Months to debt-free                 | ~40 months         |
| Debt-free date                      | ~May 2028          |

---

### Payoff Milestones

- [ ] **Credit Card eliminated** -- April 2026 | Roll $250/month to Store Card (new Store Card payment: $305)
- [ ] **Store Card eliminated** -- October 2026 | Roll $305/month to Personal Loan (new Personal Loan payment: $480)
- [ ] **Personal Loan eliminated** -- November 2027 | Roll $480/month to Car Loan (new Car Loan payment: $800)
- [ ] **Completely debt-free** -- May 2028 🎯

---

### Risk Flags

- ⚠️ **Car Loan is secured by your vehicle.** The $320 minimum payment must be made every month regardless of the avalanche phase. A missed auto loan payment risks repossession and severe credit score damage -- both outcomes would cost far more than any optimization benefit.
- ℹ️ **Credit Card and Store Card use revolving credit.** If you use these cards for new purchases during the payoff period, new balances will accrue at 24% and 19% respectively, undermining the plan. Consider pausing discretionary use on these cards or removing them from your wallet during the payoff period.
- ℹ️ **All rates in this plan are assumed fixed.** If any rate changes (credit card penalty rate triggered by a late payment, for example), revisit the avalanche order immediately.
