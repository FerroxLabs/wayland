---
name: debt-snowball-planner
description: |
  Applies the debt snowball method (smallest balance first) to create a sequenced debt payoff plan. Calculates specific monthly payment amounts for each debt, payoff dates, total interest paid, and the snowball effect as each debt is eliminated and its payment rolls to the next. Produces a complete month-by-month payoff schedule.
  Use when the user wants to pay off multiple debts using the snowball method, wants to see the psychological wins of eliminating debts quickly, or asks about the debt snowball approach.
  Do NOT use for interest-optimized payoff (use debt-avalanche-planner), debt consolidation evaluation (use debt-consolidation-analysis), or business debt management.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "debt-management personal-finance budgeting planning"
  category: "personal-finance"
  subcategory: "debt-management"
  depends: ""
  disclaimer: "educational-finance"
  difficulty: "beginner"
---
# Debt Snowball Planner

> **Disclaimer:** This skill provides educational information about financial concepts and general guidance for personal financial planning. It does NOT constitute financial advice, investment recommendations, or tax guidance. Individual financial circumstances vary significantly, and the information provided should not be relied upon as a substitute for professional counsel. Always consult a qualified financial advisor, tax professional, or licensed financial planner before making significant financial decisions.

---

## When to Use

**Use this skill when:**
- The user explicitly mentions the "debt snowball" method or "smallest balance first" payoff strategy
- The user has 2 or more distinct debts and feels overwhelmed -- they want a clear first win, not an abstract optimization
- The user has tried budgeting before and stalled because progress felt invisible; they need emotional momentum built into the plan
- The user has already been presented both snowball and avalanche approaches and chooses snowball, or expresses that motivation is more important than minimizing interest
- The user asks "what should I pay off first?" with no strong preference for interest minimization
- The user has a mix of small and large debts where knocking out 2-3 small balances quickly is genuinely feasible within 3-6 months
- The user wants a concrete, month-by-month action plan with specific dollar amounts rather than general advice

**Do NOT use when:**
- The user's primary goal is minimizing total interest paid -- use `debt-avalanche-planner` instead, where sorting by APR descending is the correct approach
- The user wants to roll multiple debts into a single new loan -- use `debt-consolidation-analysis` instead, which evaluates blended rates, fees, and break-even periods
- The user is comparing two specific loan products -- use `loan-comparison` instead
- The user has only one debt -- no sequencing is needed; calculate payoff timeline directly using amortization math
- The user has business debts, lines of credit tied to a business entity, or SBA loans -- business debt has tax deductibility, cash flow, and entity-liability considerations that require a separate framework
- The user is in active bankruptcy or considering it -- debt included in bankruptcy proceedings is subject to court orders, and a standard snowball plan is inapplicable
- The user's debt is entirely in collections with no established payment terms -- use `debt-collections-negotiation` first to establish what the actual payable amounts are before sequencing

---

## Process

### Step 1: Gather Complete Debt Information

Before doing any math, collect clean data on every debt. Missing or ambiguous inputs produce useless output.

For each debt, obtain:
- **Name or label** -- "Chase Visa," "student loan," "medical bill from St. Luke's" -- enough to be unambiguous in the output
- **Current outstanding balance** -- the balance as of today, not the original loan amount; this is what the amortization calculates on
- **Annual Percentage Rate (APR)** -- distinguish from APY; for monthly calculations, divide APR by 12 to get the periodic rate; if the user gives a range (e.g., "around 20%"), use the exact number if they can find it on a statement, since a 2% difference on a $5,000 balance affects payoff timeline by 1-2 months
- **Minimum monthly payment** -- as stated on the current statement, not a historical figure; minimums can decrease as balances drop on revolving accounts (credit cards), which complicates projections
- **Debt type** -- revolving (credit card, HELOC) vs. installment (auto, personal loan, student loan, mortgage); this matters because installment minimums are fixed while revolving minimums recalculate monthly
- **Any special conditions** -- 0% promotional APR with expiration date, deferred interest clauses, prepayment penalties, tax deductibility (mortgage interest, some student loan interest), or whether the debt is secured (auto, home) vs. unsecured

If any information is missing, ask before calculating. A guess at a $3,000 balance that is actually $5,000 shifts every downstream payoff date.

### Step 2: Determine the Total Monthly Payment Budget

The snowball only works if the user commits a fixed, consistent monthly amount to debt repayment.

- Ask for the **total monthly amount** they can reliably commit to all debt payments combined -- not optimistically, but sustainably for 2-4 years
- If they do not know, help them derive it: total take-home income minus fixed non-debt expenses (rent/mortgage, utilities, groceries, transportation, insurance, subscriptions) equals approximate maximum; a sustainable debt payment is typically no more than 36% of gross monthly income per the debt-to-income ratio standard used in lending, but for aggressive payoff, many people commit 20-30% of take-home
- Calculate the **sum of all required minimums** -- this is the floor; the monthly budget must exceed this or the plan is impossible without restructuring
- The **surplus above minimums** is the snowball accelerant -- this is the extra amount that targets the smallest debt; label it clearly
- If the surplus is less than $25/month, flag immediately: at that level, the first debt payoff will take so long that motivation typically collapses before the snowball starts rolling; suggest specific levers (cutting one subscription, a one-time cash infusion, selling an item) to reach at least $50-100 extra
- Treat the total budget as fixed even as debts pay off -- the point of the snowball is that freed minimums recycle into the next target, not back into the spending budget

### Step 3: Sort Debts by Balance -- Establish the Snowball Sequence

The snowball sequence is non-negotiable once established. Apply these rules in order:

1. **Primary sort: ascending balance** -- smallest outstanding balance is Debt #1, largest is last
2. **Tiebreaker for equal balances: higher APR first** -- when two balances are within $50 of each other, pay the higher-rate one first; the psychological difference is negligible but the interest savings are real
3. **Exception -- secured debts with foreclosure or repossession risk:** if the user is behind on a car payment or mortgage, those must be current before the snowball begins; falling behind on secured debt to accelerate unsecured debt payoff risks losing the asset and compounding the problem
4. **Exception -- deferred interest promotions expiring within the plan horizon:** a debt with deferred interest (common on medical financing, furniture, electronics) is not the same as 0% interest -- if not paid in full before the promo period ends, all deferred interest (often 25-30% of the original balance) is added at once; flag these explicitly and calculate whether the snowball reaches them before the deadline; if not, present the option to manually prioritize the deferred-interest debt
5. Number each debt in sequence and label it throughout the plan

### Step 4: Construct the Month-by-Month Amortization for Each Debt

This is the core calculation. For each debt in sequence:

**For installment debts (fixed payment, fixed rate):**
- Monthly interest = current balance × (APR ÷ 12)
- Principal reduction = monthly payment -- monthly interest
- New balance = current balance -- principal reduction
- Repeat until balance reaches zero
- Count the months; the final month's payment is often less than the full payment amount (fractional payoff) -- note this

**For revolving debts (credit cards with recalculating minimums):**
- Most card minimums recalculate as the greater of: (a) 1-2% of the balance plus interest, (b) a flat floor of $25-35, or (c) the full balance if under $25-35
- In a snowball plan, this creates a trap: as the card balance decreases, the required minimum drops -- but if you reduce your payment to match the new minimum, you lose snowball momentum
- **Critical rule:** hold the revolving debt's payment fixed at its original minimum throughout the snowball phase targeting that debt; do not let the bank's recalculating minimum reduce your actual payment
- When calculating a revolving debt's payoff period, use the fixed payment amount (not a declining minimum), otherwise the payoff timeline will be materially understated

**Calculating payoff months using the amortization formula:**
- For a fixed payment P on a balance B at monthly rate r: n = -ln(1 -- (B × r ÷ P)) ÷ ln(1 + r)
- Round up to the nearest whole month for the payoff date
- When a debt is paid off mid-month (days remaining in the month), for simplicity assume it pays off at the end of the month it reaches zero; the small overage reduces the next month's first payment by the corresponding amount

**Calculating total interest per debt:**
- Total paid = monthly payment × number of full months + final fractional payment
- Total interest = total paid -- original balance
- For 0% APR debts, total interest = $0 regardless of term

**Track the running balance table internally** (even if not shown to the user verbatim) to ensure numbers are accurate, especially for the first 2-3 months of high-APR revolving debts where interest can consume 60-80% of a minimum payment.

### Step 5: Build the Snowball Cascade

The snowball's power is in the cascade mechanism. Execute it precisely:

- **Phase 1:** Debt #1 receives (all minimums paid on other debts) + all surplus; the payment to Debt #1 is the snowball payment
- **When Debt #1 reaches $0:** the amount previously paid to Debt #1 (minimum + extra snowball) is added entirely to Debt #2's payment; Debt #2's new payment = its original minimum + Debt #1's full payment
- **When Debt #2 reaches $0:** Debt #3's new payment = its minimum + Debt #2's full prior payment (which already included Debt #1's freed payment)
- Continue cascading until the final debt receives the entire monthly budget as its payment
- Document each phase transition: the month it occurs, the new payment amount to the next target, and the cumulative snowball amount (the "rolling total" that has been freed from paid-off debts)
- The final debt's payment should approximately equal the total monthly budget, confirming the math is internally consistent

### Step 6: Calculate Total Interest, Comparative Summary, and Avalanche Delta

**Snowball totals:**
- Total interest = sum of interest across all individual debts
- Total amount paid = total debt + total interest
- Total months = sum of all phase durations (Debt 1 phase length + Debt 2 phase length + ... but phases are sequential, so it is additive, not overlapping)
- Debt-free date = current month + total months

**Avalanche comparison (estimate, not full calculation):**
- The avalanche method applies extra payments to the highest-APR debt first; it always saves more total interest than snowball
- To estimate the interest savings delta without running a full avalanche calculation: identify the highest-APR debt that is NOT the smallest balance; if this debt has a significantly higher rate than the smallest debt (e.g., 22% vs. 0%), the interest savings of the avalanche are meaningful (can be $200-800 on a typical $15,000-20,000 debt load); if rates are clustered within 3-4%, the difference is modest
- The snowball trades these interest savings for the earlier psychological win of eliminating the smallest debt sooner; quantify both the interest cost and the months-sooner figure for the first payoff
- Never advocate for one method -- present the tradeoff factually

**If the user has tax-advantaged debt (mortgage, student loans):**
- Note that mortgage interest may be deductible (for itemizers) and student loan interest may be partially deductible (up to $2,500 annually with income phase-outs); tax-deductibility effectively reduces the net interest rate, and the user should factor this in when deciding whether to allocate surplus to debt payoff vs. investing; this is a flag to consult a tax professional, not a detailed calculation

### Step 7: Present Milestones, Next Actions, and Behavioral Guardrails

The snowball is as much a behavioral system as a mathematical one. The output must reinforce the commitment mechanism:

- List each debt payoff as a named, dated milestone -- these are genuine goals, not abstract phases
- For each milestone, note the freed monthly cash flow that rolls forward
- Suggest a brief, non-financial celebration for each debt eliminated (acknowledge the accomplishment without spending the freed cash)
- Provide one concrete "next action today" -- not a vague suggestion, but a specific immediate step: "Log into your Credit Card A account and update the autopay amount to $280 starting next month"
- Include a behavioral warning: the most common snowball failure mode is "lifestyle creep" when the first debt is paid off -- the freed $205/month feels like discretionary income rather than debt fuel; explicitly name this risk in the output
- If the payoff timeline exceeds 48 months, note that the plan is still valid but the user should build a small emergency fund ($1,000-1,500) alongside the plan to avoid going deeper into debt when unexpected expenses arise; diverting 100% of surplus to debt without any buffer is fragile over multi-year timescales

---

## Output Format

```
## Debt Snowball Payoff Plan
*Plan generated: [Month Year] | Total budget: $X,XXX/month*

---

### Debt Inventory -- Snowball Order (Smallest to Largest Balance)

| # | Debt Name       | Balance  | APR    | Min. Payment | Type       | Special Flags        |
|---|-----------------|----------|--------|--------------|------------|----------------------|
| 1 | [Debt name]     | $X,XXX   | X.X%   | $XXX         | Revolving  | --                   |
| 2 | [Debt name]     | $X,XXX   | XX.X%  | $XXX         | Revolving  | --                   |
| 3 | [Debt name]     | $XX,XXX  | X.X%   | $XXX         | Installment| --                   |
| 4 | [Debt name]     | $XX,XXX  | X.X%   | $XXX         | Installment| --                   |

---

### Monthly Budget Breakdown

| Metric                              | Amount   |
|-------------------------------------|----------|
| Total monthly committed to debt     | $X,XXX   |
| Sum of all minimum payments         | $XXX     |
| Snowball accelerant (surplus)       | $XXX     |
| Surplus as % of total budget        | XX%      |
| ⚠ Flag (if applicable)             | [e.g., "Surplus under $50 -- consider increasing monthly commitment"] |

---

### Phase-by-Phase Payoff Schedule

#### Phase 1 -- Target: [Debt #1 Name]
*Starting balance: $X,XXX | APR: X.X% | Duration: Months 1-X*

| Month | Starting Balance | Payment | Interest Charged | Principal Paid | Ending Balance |
|-------|-----------------|---------|-----------------|----------------|----------------|
| 1     | $X,XXX.XX       | $XXX    | $X.XX           | $XXX.XX        | $X,XXX.XX      |
| 2     | $X,XXX.XX       | $XXX    | $X.XX           | $XXX.XX        | $X,XXX.XX      |
| ...   | ...             | ...     | ...             | ...            | ...            |
| [N]   | $XX.XX          | $XX.XX  | $0.XX           | $XX.XX         | $0.00          |

- **Total payment to this debt:** $X,XXX.XX
- **Total interest paid:** $XX.XX
- **Payoff date:** [Month Year]
- **Snowball amount freed:** $XXX/month → rolls entirely to [Debt #2 Name]

---

#### Phase 2 -- Target: [Debt #2 Name]
*Starting balance (at Phase 2 start): $X,XXX | APR: XX.X% | Duration: Months X-X*
*Payment = original minimum ($XXX) + snowball from Phase 1 ($XXX) = $XXX/month*

| Month | Starting Balance | Payment | Interest Charged | Principal Paid | Ending Balance |
|-------|-----------------|---------|-----------------|----------------|----------------|
| [N+1] | $X,XXX.XX       | $XXX    | $XX.XX          | $XXX.XX        | $X,XXX.XX      |
| ...   | ...             | ...     | ...             | ...            | ...            |
| [N+M] | $XXX.XX         | $XXX.XX | $X.XX           | $XXX.XX        | $0.00          |

- **Balance at Phase 2 start (after Phase 1 minimums paid):** $X,XXX.XX
- **Total payment to this debt:** $X,XXX.XX
- **Total interest paid:** $XXX.XX
- **Payoff date:** [Month Year]
- **Snowball amount freed:** $XXX/month → rolls to [Debt #3 Name]

---

[Repeat Phase block for each subsequent debt]

---

### Snowball Growth -- Visual Summary

| Phase    | Months      | Target Debt      | Your Payment | Snowball Grown By | Cumulative Freed |
|----------|-------------|------------------|--------------|-------------------|-----------------|
| Phase 1  | Months 1-X  | [Debt #1 name]   | $XXX         | Starting point    | $X (baseline)   |
| Phase 2  | Months X-X  | [Debt #2 name]   | $XXX         | +$XXX             | $XXX            |
| Phase 3  | Months X-X  | [Debt #3 name]   | $XXX         | +$XXX             | $XXX            |
| Phase 4  | Months X-X  | [Debt #4 name]   | $X,XXX       | +$XXX             | $X,XXX          |

---

### Debt Summary by Debt

| Debt Name    | Original Balance | Total Paid | Total Interest | Payoff Date   |
|--------------|-----------------|------------|----------------|---------------|
| [Debt #1]    | $X,XXX          | $X,XXX     | $XX            | [Month Year]  |
| [Debt #2]    | $X,XXX          | $X,XXX     | $XXX           | [Month Year]  |
| [Debt #3]    | $XX,XXX         | $XX,XXX    | $X,XXX         | [Month Year]  |
| [Debt #4]    | $XX,XXX         | $XX,XXX    | $X,XXX         | [Month Year]  |
| **TOTAL**    | **$XX,XXX**     | **$XX,XXX**| **$X,XXX**     | **[Month Year]** |

---

### Overall Summary

| Metric                         | Snowball Plan  | Avalanche Estimate |
|-------------------------------|----------------|-------------------|
| Total debt entering plan       | $XX,XXX        | $XX,XXX           |
| Total interest paid            | $X,XXX         | $X,XXX (est.)     |
| Interest savings vs. snowball  | --             | ~$XXX saved       |
| First debt eliminated          | [Month Year]   | [Month Year]      |
| Debt-free date                 | [Month Year]   | ~[Month Year]     |
| Total months                   | XX months      | ~XX months        |

*Avalanche figures are estimates. For a precise avalanche plan, use the debt-avalanche-planner skill.*

---

### Milestone Checklist

- [ ] **[Month Year] -- [Debt #1] PAID OFF** 🎯 First win. $XXX/month now fuels the snowball.
- [ ] **[Month Year] -- [Debt #2] PAID OFF** 🎯 Two debts gone. $XXX/month snowball now rolling.
- [ ] **[Month Year] -- [Debt #3] PAID OFF** 🎯 One debt left. Full $X,XXX/month on final target.
- [ ] **[Month Year] -- DEBT FREE** 🏁 Total interest paid: $X,XXX. Total saved vs. minimums-only: $X,XXX+.

---

### Your Next Action -- Today

1. [Specific, immediate action -- e.g., "Log into [Debt #1] account and set autopay to $XXX starting [next month]"]
2. [Second action -- e.g., "Pay minimums on Debts #2-4 by their due dates this month"]
3. [Optional acceleration action -- e.g., "Consider applying any year-end bonus or tax refund as a lump-sum to Debt #1 to eliminate it faster"]

---

### ⚠ Behavioral Warnings

- **Lifestyle creep risk:** When Debt #1 is paid off, the $XXX/month it freed will feel like extra income. It is not -- it is your snowball. Apply it immediately to Debt #2.
- **Revolving minimum trap:** Your credit card minimums will decrease as balances fall. Do not reduce your payments to match. Hold all payments at the amounts shown in this plan.
- **Emergency buffer:** If your plan runs longer than 24 months, consider maintaining a $1,000 emergency buffer to avoid new debt from unexpected expenses derailing the plan.
```

---

## Rules

1. **Always display the disclaimer before financial content.** The disclaimer is not optional. It appears first, every time, without exception.

2. **Never recommend specific lenders, debt settlement companies, credit counseling agencies, or financial products by name.** The plan is purely mathematical and behavioral. If a user asks about refinancing options, direct them to `debt-consolidation-analysis` rather than naming specific products.

3. **Sort strictly by ascending balance -- this IS the snowball method.** Any deviation from smallest-to-largest balance ordering (including sorting by APR) produces a different method entirely. The only permitted reordering exceptions are: (a) imminent deferred-interest deadline, (b) secured debt arrears risk, and (c) equal-balance tiebreaker by APR. Each exception must be explicitly disclosed to the user.

4. **Never reduce or suspend minimum payments on any debt for any reason.** Minimum payments are contractually required. Missing them triggers late fees ($25-40 typically), potential penalty APR increases (to 29.99% on many cards), and negative credit reporting after 30 days. The snowball accelerant is the surplus above minimums -- never the minimums themselves.

5. **For revolving debts, hold the payment fixed at the original minimum -- do not follow the bank's declining minimum.** A credit card with a $5,000 balance at 20% APR and a $100 minimum will have its minimum fall to ~$75 when the balance reaches $3,500. If the user follows the declining minimum, amortization extends by years and total interest paid can nearly double. State this rule explicitly in the output.

6. **Show the snowball cascade mechanism clearly.** The output must show, for each debt transition, the exact dollar amount of payment that rolls forward. "The $280/month you were paying Debt #2 now moves entirely to Debt #3" is the core teaching of the method and must be explicit and visible.

7. **Calculate using the correct monthly periodic rate.** Monthly rate = APR ÷ 12, not APR ÷ 365 × 30. A 22% APR card charges 1.833% per month, not 1.808% (daily rate × 30). The difference is small per month but compounds. Use APR ÷ 12 consistently.

8. **Note deferred-interest debts prominently.** A debt labeled "0% for 18 months" on a medical or retail financing account may carry deferred interest -- meaning if any balance remains at month 18, all 26-29% interest from month 1 is retroactively charged at once. This is categorically different from a true 0% loan. If the user mentions "0% financing" from a retail source, ask whether it is deferred interest or true 0% before including it in the plan.

9. **If total available budget is within $25 of the sum of minimums, flag this as a critical constraint before building the plan.** At $25 surplus, paying off a $1,000 balance at 0% takes 40 months; at that pace, the snowball provides almost no benefit over minimum-only payments. Suggest specific, concrete ways to find $50-100 extra per month rather than building a plan that will almost certainly fail.

10. **Include an avalanche comparison estimate in every output -- but present it neutrally.** The user chose snowball, and that is a valid choice. The comparison is informational, not prescriptive. State the estimated interest difference, the first-payoff-date difference, and note that both methods produce the same debt-free outcome; the tradeoff is emotional pacing vs. interest minimization. Never say one method is "better."

11. **When a lump sum is mentioned (tax refund, bonus, windfall), calculate the impact explicitly.** A $1,500 tax refund applied to a $1,800 debt at month 3 can eliminate that debt 2 phases early and restructure the entire cascade. Show the revised plan alongside the base plan if the user mentions a potential windfall.

12. **Always calculate the "minimum-only" baseline for comparison.** Users often do not know how long minimum-only payments would take. The contrast between "46 years and $12,000 in interest paying minimums" vs. "3.5 years and $1,500 in interest on the snowball plan" is one of the most motivating outputs you can produce. Calculate the minimum-only timeline for at least the highest-balance debt to illustrate the gap.

---

## Edge Cases

**Deferred-interest debt with expiration within the plan horizon**
Deferred-interest financing (common on medical bills billed through CareCredit, furniture, HVAC, dental) retroactively charges all interest from day 1 if any balance remains at the promo end date. If the snowball reaches this debt after the expiration, the user would owe the original balance plus potentially 26-29% retroactive interest -- a massive, avoidable cost. Calculate whether the snowball reaches this debt before expiration. If it does not, present two options: (A) maintain the strict snowball order and accept the rate increase, showing revised totals; (B) manually elevate the deferred-interest debt to the front of the queue, treating it as highest-priority regardless of balance, showing revised totals for that path. Let the user choose. Do not make the decision for them.

**Revolving minimums declining to the point of changing payoff math materially**
On a credit card with a 2% minimum calculation (the most common method), a $6,000 balance generates a $120 minimum. By the time the snowball reaches this card (say, 14 months later), the balance may have decreased to $5,400 from minimum payments, but the minimum is now ~$108. If the user is not aware to hold the payment at the higher amount, they lose momentum. In the output, specify the fixed payment amount for each phase and note explicitly: "Do not reduce this payment even if your card issuer's minimum falls below this amount."

**User has a debt with a prepayment penalty**
Some personal loans and auto loans include prepayment penalties, typically structured as a percentage of the remaining balance (1-3%) or a flat fee, assessed if the loan is paid off more than 12-24 months early. Before placing a prepayment-penalized debt in the snowball, calculate whether the penalty cost exceeds the interest savings of early payoff. If the penalty is $300 and the interest saved by early payoff is $180, it may be mathematically better to pay minimums on that debt while snowballing others. Flag this calculation explicitly and recommend the user verify their loan agreement.

**User receives a windfall mid-plan (tax refund, bonus, insurance settlement)**
Do not simply say "apply it to your smallest debt." Calculate the actual restructured plan. A $2,000 tax refund applied to the current target debt may eliminate it immediately and restructure the entire subsequent cascade. Show: (A) current plan with no windfall for reference, (B) revised plan with windfall applied as a lump sum to the current target debt, showing new payoff dates for all downstream debts and total interest savings. This is often the most motivating calculation in the entire output -- quantify the months and dollars saved.

**User has a 401(k) loan included in their debt list**
A 401(k) loan is structurally different from consumer debt: the "interest" paid goes back to the user's own account (not to a lender), there is no credit reporting impact, and the real risk is opportunity cost and the tax consequences of default (treated as a taxable distribution with 10% early withdrawal penalty if the user leaves their employer). Including a 401(k) loan in a snowball plan is mathematically valid, but note these distinctions. The "interest rate" on a 401(k) loan should be evaluated as opportunity cost (what the money would have earned invested) rather than a true cost, and the user should understand that aggressively paying down a 401(k) loan also reduces the retirement account balance growth. Flag this and suggest consulting a financial advisor on the prioritization of 401(k) loan repayment vs. other debts.

**Multiple debts with very similar balances bunched together**
If a user has five debts with balances of $1,100, $1,200, $1,250, $1,300, and $1,350, the snowball order matters very little psychologically (no early win is coming no matter what order) but the interest rate tiebreaker matters. In this case, sort by APR descending within the cluster. Acknowledge to the user that with this debt distribution, the snowball and avalanche methods produce nearly identical results, and there is no meaningful motivational advantage to the snowball for this specific debt mix.

**User is paying minimums only on some debts and has already missed payments on others**
Before building the snowball, address the missed payment situation. Debts with missed payments may be accruing penalty APR (often 29.99%), late fees, and reporting to credit bureaus. Bringing all accounts current is the prerequisite step -- the snowball cannot begin until all minimum payments are re-established. Calculate: (A) what it costs to bring all accounts current (arrears + fees), (B) how long it takes to do that from the current monthly budget, and (C) the revised start date for the snowball proper. This is an uncomfortable but necessary clarification that prevents building an unrealistic plan on an unstable foundation.

**User asks about pausing the snowball to invest (e.g., "should I put extra money in my 401(k) instead?")**
This is a common and legitimate question that falls outside the scope of this skill but must be handled gracefully. The general framework (not advice) is: high-interest debt (above 7-8% APR) almost always has a higher guaranteed return from payoff than expected market returns; low-interest debt (below 5-6%) may be reasonably serviced at minimums while investing the surplus; employer 401(k) match is a guaranteed 50-100% return and should generally be captured before aggressive debt payoff. Acknowledge the question, present this general framework, and direct the user to a financial advisor for personalized guidance. Do not build a hybrid invest-and-pay-debt plan within this skill.

---

## Example

**Input:** "I have four debts I'm trying to knock out. Medical bill: $840 balance, 0% interest, $50/month minimum. Store credit card: $2,650 balance, 24.99% APR, $65/month minimum. Car loan: $6,200 balance, 7.9% APR, $185/month minimum. Personal loan: $9,400 balance, 13.5% APR, $240/month minimum. I can put $700/month total toward all of these."

---

**Output:**

## Debt Snowball Payoff Plan
*Plan generated: March 2026 | Total monthly budget: $700/month*

---

### Debt Inventory -- Snowball Order (Smallest to Largest Balance)

| # | Debt Name       | Balance | APR    | Min. Payment | Type        | Special Flags     |
|---|-----------------|---------|--------|--------------|-------------|-------------------|
| 1 | Medical Bill    | $840    | 0.0%   | $50          | Installment | None              |
| 2 | Store Credit Card | $2,650 | 24.99% | $65          | Revolving   | Hold min fixed    |
| 3 | Car Loan        | $6,200  | 7.9%   | $185         | Installment | Verify no prepay penalty |
| 4 | Personal Loan   | $9,400  | 13.5%  | $240         | Installment | None              |

---

### Monthly Budget Breakdown

| Metric                              | Amount  |
|-------------------------------------|---------|
| Total monthly committed to debt     | $700    |
| Sum of all minimum payments         | $540    |
| Snowball accelerant (surplus)       | $160    |
| Surplus as % of total budget        | 22.9%   |

*Your $160 surplus is a workable snowball accelerant. At this level, you will eliminate the medical bill in under 4 months. If you can find an additional $50-75/month, the first payoff comes in 3 months instead and the cascade accelerates noticeably throughout the plan.*

---

### Minimum-Only Baseline (for comparison)

If you paid only the minimums on all four debts indefinitely:
- **Car loan** (fixed installment): paid off in approximately 38 months; total interest ~$870
- **Personal loan** (fixed installment): paid off in approximately 52 months; total interest ~$2,940
- **Store credit card** (revolving with declining minimums): would take **over 17 years** to pay off on declining minimums alone; total interest **over $5,400**
- **The snowball plan eliminates all four debts approximately 28 months sooner than the installment loans would close on minimums, and transforms the credit card from a 17-year problem into a 15-month phase**

---

### Phase-by-Phase Payoff Schedule

#### Phase 1 -- Target: Medical Bill
*Starting balance: $840 | APR: 0.0% | Payment: $210/month ($50 min + $160 surplus)*
*Duration: Months 1-4 (April 2026 -- July 2026)*

| Month | Starting Balance | Payment | Interest | Principal | Ending Balance |
|-------|-----------------|---------|----------|-----------|----------------|
| 1 (Apr 2026) | $840.00 | $210.00 | $0.00 | $210.00 | $630.00 |
| 2 (May 2026) | $630.00 | $210.00 | $0.00 | $210.00 | $420.00 |
| 3 (Jun 2026) | $420.00 | $210.00 | $0.00 | $210.00 | $210.00 |
| 4 (Jul 2026) | $210.00 | $210.00 | $0.00 | $210.00 | $0.00 |

- **Total paid:** $840.00
- **Total interest:** $0.00
- **Payoff date: July 2026**
- **Snowball freed: $210/month → rolls entirely to Store Credit Card in August 2026**

*During Phase 1, the store card, car loan, and personal loan are all paying minimums only. The store card balance is growing slightly each month because at $65/month, the 24.99% APR charges ~$55/month in interest -- only $10/month of principal is being reduced. This is why eliminating the medical bill quickly and launching the snowball on the credit card is so important.*

---

#### Phase 2 -- Target: Store Credit Card
*Starting balance at Phase 2 start (after 4 months of minimums): approximately $2,610*
*(4 months at 24.99% APR: ~$55/month interest -- $65/month payment = ~$10/month principal reduction × 4 months = ~$40 principal paid; $2,650 -- $40 = ~$2,610)*
*APR: 24.99% | Monthly rate: 2.082%*
*Payment: $275/month ($65 min + $210 snowball from Phase 1)*
*Duration: Months 5-18 (August 2026 -- September 2027)*

| Month | Starting Balance | Payment | Interest | Principal | Ending Balance |
|-------|-----------------|---------|----------|-----------|----------------|
| 5 (Aug 2026) | $2,610.00 | $275.00 | $54.34 | $220.66 | $2,389.34 |
| 6 (Sep 2026) | $2,389.34 | $275.00 | $49.76 | $225.24 | $2,164.10 |
| 7 (Oct 2026) | $2,164.10 | $275.00 | $45.07 | $229.93 | $1,934.17 |
| 8 (Nov 2026) | $1,934.17 | $275.00 | $40.28 | $234.72 | $1,699.45 |
| 9 (Dec 2026) | $1,699.45 | $275.00 | $35.40 | $239.60 | $1,459.85 |
| 10 (Jan 2027) | $1,459.85 | $275.00 | $30.41 | $244.59 | $1,215.26 |
| 11 (Feb 2027) | $1,215.26 | $275.00 | $25.31 | $249.69 | $965.57 |
| 12 (Mar 2027) | $965.57 | $275.00 | $20.11 | $254.89 | $710.68 |
| 13 (Apr 2027) | $710.68 | $275.00 | $14.80 | $260.20 | $450.48 |
| 14 (May 2027) | $450.48 | $275.00 | $9.38 | $265.62 | $184.86 |
| 15 (Jun 2027) | $184.86 | $186.71 | $1.85 | $184.86 | $0.00 |

*(Final month payment reduced to $186.71 -- remaining balance plus final interest; remaining $88.29 stays in budget and is applied to Phase 3 first payment)*

- **Total paid:** $3,536.71
- **Total interest on this debt:** ~$326.71
- **Payoff date: June 2027**
- **Snowball freed: $275/month → rolls to Car Loan in July 2027**

*Note: Your card issuer will send lower minimum payment notices as your balance falls (it may drop to $50 or $40 by month 10). Ignore those notifications. Maintain $275/month throughout this phase.*

---

#### Phase 3 -- Target: Car Loan
*Starting balance at Phase 3 start (after 15 months of $185/month minimums on a 7.9% APR installment loan):*
*Monthly rate: 0.658% | After 15 months of $185 payments:*
*Approximate balance: $6,200 × (1.00658)^15 -- $185 × [(1.00658)^15 -- 1] ÷ 0.00658 ≈ $4,390*
*Payment: $460/month ($185 min + $275 snowball from Phase 2)*
*Duration: Months 16-26 (July 2027 -- May 2028)*

| Month | Starting Balance | Payment | Interest | Principal | Ending Balance |
|-------|-----------------|---------|----------|-----------|----------------|
| 16 (Jul 2027) | $4,390.00 | $460.00 | $28.89 | $431.11 | $3,958.89 |
| 17 (Aug 2027) | $3,958.89 | $460.00 | $26.05 | $433.95 | $3,524.94 |
| 18 (Sep 2027) | $3,524.94 | $460.00 | $23.19 | $436.81 | $3,088.13 |
| 19 (Oct 2027) | $3,088.13 | $460.00 | $20.31 | $439.69 | $2,648.44 |
| 20 (Nov 2027) | $2,648.44 | $460.00 | $17.42 | $442.58 | $2,205.86 |
| 21 (Dec 2027) | $2,205.86 | $460.00 | $14.51 | $445.49 | $1,760.37 |
| 22 (Jan 2028) | $1,760.37 | $460.00 | $11.58 | $448.42 | $1,311.95 |
| 23 (Feb 2028) | $1,311.95 | $460.00 | $8.63 | $451.37 | $860.58 |
| 24 (Mar 2028) | $860.58 | $460.00 | $5.66 | $454.34 | $406.24 |
| 25 (Apr 2028) | $406.24 | $408.91 | $2.67 | $406.24 | $0.00 |

*(Final payment reduced to $408.91; remaining $51.09 applied to Phase 4 opening payment)*

- **Total paid:** $4,548.91
- **Total interest on this debt:** ~$148.91
- **Payoff date: April 2028**
- **Snowball freed: $460/month → rolls to Personal Loan in May 2028**

---

#### Phase 4 -- Target: Personal Loan (Final Debt)
*Starting balance at Phase 4 start (after 25 months of $240/month minimums on a 13.5% APR installment loan):*
*Monthly rate: 1.125% | After 25 months of $240 payments:*
*Approximate balance: ~$7,610*
*Payment: $700/month (full monthly budget -- $240 min + $460 snowball -- the entire $700 is now focused on one debt)*
*Duration: Months 26-39 (May 2028 -- June 2029)*

| Month | Starting Balance | Payment | Interest | Principal | Ending Balance |
|-------|-----------------|---------|----------|-----------|----------------|
| 26 (May 2028) | $7,610.00 | $700.00 | $85.61 | $614.39 | $6,995.61 |
| 27 (Jun 2028) | $6,995.61 | $700.00 | $78.70 | $621.30 | $6,374.31 |
| 28 (Jul 2028) | $6,374.31 | $700.00 | $71.71 | $628.29 | $5,746.02 |
| 29 (Aug 2028) | $5,746.02 | $700.00 | $64.64 | $635.36 | $5,110.66 |
| 30 (Sep 2028) | $5,110.66 | $700.00 | $57.50 | $642.50 | $4,468.16 |
| 31 (Oct 2028) | $4,468.16 | $700.00 | $50.27 | $649.73 | $3,818.43 |
| 32 (Nov 2028) | $3,818.43 | $700.00 | $42.96 | $657.04 | $3,161.39 |
| 33 (Dec 2028) | $3,161.39 | $700.00 | $35.56 | $664.44 | $2,496.95 |
| 34 (Jan 2029) | $2,496.95 | $700.00 | $28.09 | $671.91 | $1,825.04 |
| 35 (Feb 2029) | $1,825.04 | $700.00 | $20.53 | $679.47 | $1,145.57 |
| 36 (Mar 2029) | $1,145.57 | $700.00 | $12.89 | $687.11 | $458.46 |
| 37 (Apr 2029) | $458.46 | $463.62 | $5.16 | $458.46 | $0.00 |

*(Final payment $463.62; plan completes April 2029)*

- **Total paid:** $8,763.62
- **Total interest on this debt:** ~$1,363.62
- **Payoff date: April 2029**

---

### Snowball Growth -- Visual Summary

| Phase   | Months       | Target Debt       | Your Payment | Added From Snowball | Cumulative Monthly Freed |
|---------|-------------|-------------------|--------------|--------------------|-----------------------|
| Phase 1 | Months 1-4  | Medical Bill      | $210/month   | Starting point     | $0 base               |
| Phase 2 | Months 5-15 | Store Credit Card | $275/month   | +$210 (medical)    | $210 freed            |
| Phase 3 | Months 16-25| Car Loan          | $460/month   | +$275 (card)       | $485 freed            |
| Phase 4 | Months 26-37| Personal Loan     | $700/month   | +$460 (car)        | $700 freed (full budget) |

*By Phase 4, every dollar of your $700 monthly budget is hitting one debt. This is the snowball at full force.*

---

### Debt-by-Debt Summary

| Debt Name          | Original Balance | Total Paid    | Total Interest | Payoff Date   |
|--------------------|-----------------|---------------|----------------|---------------|
| Medical Bill       | $840            | $840          | $0             | July 2026     |
| Store Credit Card  | $2,650          | $3,537        | ~$327          | June 2027     |
| Car Loan           | $6,200          | $4,549*       | ~$149          | April 2028    |
| Personal Loan      | $9,400          | $8,764        | ~$1,364        | April 2029    |
| **TOTAL**          | **$19,090**     | **~$17,690**  | **~$1,840**    | **April 2029** |

*Car loan total paid is less than original balance because 15 months of minimums during Phases 1-2 reduced the principal significantly before the Phase 3 snowball accelerated payoff.*

---

### Overall Summary

| Metric                         | Snowball Plan    | Avalanche Estimate       |
|-------------------------------|------------------|--------------------------|
| Total debt entering plan       | $19,090          | $19,090                  |
| Total interest paid            | ~$1,840          | ~$1,500 (est.)           |
| Interest savings vs. snowball  | --               | ~$340 saved              |
| First debt eliminated          | July 2026 (4 mo) | ~Sept 2027 (18 mo)       |
| Debt-free date                 | April 2029       | ~March 2029              |
| Total months                   | 37 months        | ~36 months               |

*The avalanche method (targeting the 24.99% store card first) would save approximately $340 in total interest and finish about 1 month sooner. The snowball gives you a debt eliminated 14 months sooner than the avalanche would, providing a real, tangible early win. Both are valid strategies -- the $340 difference over 37 months is approximately $9/month. If early wins help you stay committed, the snowball more than earns that small premium.*

---

### Milestone Checklist

- [ ] **July 2026 -- Medical Bill PAID OFF** 🎯 One debt gone in 4 months. $210/month now fuels your credit card payoff.
- [ ] **June 2027 -- Store Credit Card PAID OFF** 🎯 Two debts eliminated. You've ended a potential 17-year debt. $275/month now attacks the car loan.
- [ ] **April 2028 -- Car Loan PAID OFF** 🎯 Three down. Your full $700/month is now aimed at one final debt.
- [ ] **April 2029 -- DEBT FREE** 🏁 Total paid: ~$17,690. Total interest: ~$1,840. This compares to $9,200+ in interest on minimum payments alone.

---

### Your Next Actions -- This Week

1. **Today:** Log into your store
