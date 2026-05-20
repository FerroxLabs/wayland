---
name: mortgage-comparison
description: |
  Compares mortgage options by computing total cost of borrowing, monthly payment,
  break-even point for paying points, and fixed vs. adjustable rate risk factors.
  All calculations use terms the user provides from their actual loan offers.
  Produces a side-by-side comparison with total cost analysis.
  Use when the user asks about comparing mortgage offers, fixed vs. ARM loans,
  whether to pay points, or wants to see the total cost of different mortgage options.
  Do NOT use for the overall home buying process (use home-buying-checklist),
  general major purchase decisions (use major-purchase-decision), or investment
  account types (use investment-account-types).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "home-buying personal-finance analysis planning"
  category: "personal-finance"
  subcategory: "major-purchases"
  depends: ""
  disclaimer: "educational-finance"
  difficulty: "intermediate"
---
# Mortgage Comparison Analysis

> **Disclaimer:** This skill provides educational information about mortgage mathematics and general guidance for personal financial planning. It does NOT constitute financial advice, mortgage advice, investment recommendations, or tax guidance. Individual financial circumstances vary significantly. Always consult a qualified mortgage professional, financial advisor, and tax professional before making mortgage decisions.

## When to Use

**Use this skill when:**
- The user has two or more actual Loan Estimate documents and wants a side-by-side mathematical comparison
- The user is deciding whether to pay discount points to buy down their interest rate
- The user is evaluating a fixed-rate mortgage against an adjustable-rate mortgage (ARM) for the same loan amount
- The user wants to compare 15-year vs. 30-year terms on the same loan and understand total interest cost
- The user is deciding whether to put down more money to eliminate PMI and wants to know if the math supports it
- The user received a lender credit offer (negative points) and wants to understand the true cost trade-off
- The user wants to understand how refinancing timing affects whether points paid now will ever break even
- The user needs to calculate remaining balance at a specific future date (for a planned sale or refinance)

**Do NOT use this skill when:**
- The user is asking whether to buy a home at all -- that is a broader financial planning question (use `home-buying-checklist` and `major-purchase-decision`)
- The user needs help understanding what documents to gather, how escrow works, or what happens at closing -- those are process questions (use `home-buying-checklist`)
- The user is asking about homeowner's insurance comparison -- that is a separate analysis (use `insurance-comparison`)
- The user wants to evaluate whether to pay off a mortgage early vs. invest -- that is an opportunity cost framework question (use `major-purchase-decision` or `portfolio-allocation-framework`)
- The user is asking general questions about what mortgage rates are "good" right now -- never quote current market rates as facts
- The user needs help with investment property financing (different tax treatment, qualification requirements, and risk profile)
- The user is asking about HELOC or home equity loan options -- those are separate products with different structures

---

## Process

### Step 1: Collect and Validate Loan Terms for Each Option

Request all terms needed before performing any calculations. If the user only has partial information, ask specifically for what is missing.

**For every loan option, collect:**
- Loan principal (purchase price minus down payment -- confirm the user has this right; a common error is using the purchase price instead of the financed amount)
- Annual interest rate (the NOTE rate, not the APR -- these are different; APR is used for comparison per federal TILA but is not used in payment calculations)
- Loan term in years (most common: 15, 20, 25, or 30; verify it is not a non-standard term like 40 years)
- Loan type: fixed-rate or ARM
- Discount points paid (can be positive = buying rate down, zero = par pricing, or negative = lender credit)
- Origination charges and closing costs (ask if they have the Loan Estimate; Section A is origination charges, Sections B/C/E/F/H are other costs)
- Whether PMI or MIP is required, and if so, the monthly premium and at what LTV it terminates

**For ARM loans, additionally collect:**
- Initial fixed period (e.g., 5/1 ARM means 5-year fixed period, then adjusts annually)
- Index (commonly SOFR, formerly LIBOR; some older products still use LIBOR-derived indices -- flag this)
- Margin (typically 2.00% to 3.00% above the index; this is fixed for the life of the loan)
- Initial cap: maximum rate change at the FIRST adjustment (commonly 2% or 5%)
- Periodic cap: maximum rate change at any SUBSEQUENT adjustment (commonly 2%)
- Lifetime cap: maximum rate change over the life of the loan from the START rate (commonly 5% or 6%)
- Floor: the minimum rate the ARM can ever reach (typically equal to the start rate or the margin)

**Validation checks before calculating:**
- Confirm the loan amount is less than the county conforming loan limit if it is presented as a conventional loan (conforming limit changes annually -- do not state a specific number as current)
- If the loan amount exceeds conforming limits, it is a jumbo loan and PMI rules differ
- Confirm the down payment percentage implied by the loan amount and purchase price -- PMI is required on conventional loans with less than 20% down
- For FHA loans, note that MIP has both an upfront component (financed into the loan) and a monthly component; treat the financed UFMIP as additional loan principal

---

### Step 2: Calculate Monthly Principal and Interest Payment

Use the standard mortgage amortization formula precisely. Show every step.

**The amortization payment formula:**
```
M = P * [r(1 + r)^n] / [(1 + r)^n - 1]

Where:
  M = monthly principal and interest payment
  P = loan principal (amount borrowed)
  r = monthly interest rate = annual rate / 12 (as a decimal, not percentage)
  n = total number of monthly payments = loan term in years * 12
```

**Working through the formula carefully:**
- Convert the annual rate to a decimal first: 6.5% becomes 0.065
- Divide by 12 for the monthly rate: 0.065 / 12 = 0.0054167
- Calculate (1 + r)^n: this is the compound growth factor; for a 30-year loan this is (1.0054167)^360
- The numerator is r * (1 + r)^n
- The denominator is (1 + r)^n - 1
- Multiply by P

**Common calculation errors to avoid:**
- Using the APR instead of the note rate in the payment formula -- APR includes fees and will produce a wrong answer
- Forgetting to convert percentage to decimal (using 6.5 instead of 0.065)
- Using annual rate directly instead of monthly rate (dividing by 12)
- Rounding the monthly rate too aggressively before completing the calculation -- carry at least 6 decimal places

**For zero-interest-rate edge case:** If r = 0 (which should not happen in a real mortgage but could arise from user error), the formula simplifies to M = P / n.

---

### Step 3: Calculate Total Cost of Borrowing

Total cost of borrowing is the single most important comparison metric -- not the monthly payment, not the rate, and not the APR alone. Calculate it precisely for each option.

**Total cost components:**
```
Total P&I payments  = M * n
Total interest paid = (M * n) - P
PMI total paid      = monthly PMI * months until PMI cancels
Points cost         = points * P / 100  (each point = 1% of loan amount)
Closing costs       = sum of all fees paid at closing
Total cost          = Total interest + PMI total + Points cost + Closing costs
```

**For PMI calculation, determine cancellation timing:**
- On conventional loans, PMI cancels when the loan balance reaches 80% LTV based on original value (per the Homeowners Protection Act)
- To find cancellation month: use amortization schedule to find when balance drops below 80% of original appraised value
- Shortcut formula: balance after n payments = P * [(1+r)^n - (1+r)^k] / [(1+r)^n - 1] where k is the payment number
- For FHA loans originated after June 2013 with less than 10% down, MIP remains for the FULL LOAN TERM -- this is a significant cost difference vs. conventional PMI that must be shown explicitly

**Holding-period adjusted total cost:**
- If the user mentions they plan to sell or refinance within a specific timeframe, calculate total cost for THAT holding period, not the full loan term
- Balance at the end of the holding period is a "recovered cost" -- subtract it from total payments to get true holding-period cost
- Holding period cost = (M * k) + upfront costs - balance remaining after k payments
  where k = planned holding period in months

---

### Step 4: Perform Points Break-Even Analysis

Any time points appear (including lender credits, which are negative points), perform this analysis. It is one of the most practically useful calculations in mortgage comparison.

**Standard break-even calculation:**
```
Upfront cost of points  = points * loan amount / 100
Monthly payment savings = payment without points - payment with points
Simple break-even       = upfront cost / monthly savings  (in months)
```

**The simple break-even is not enough -- perform the time-value-adjusted analysis:**
The upfront cost of points represents money that could have been kept in savings or invested. The true break-even must account for the opportunity cost of that cash.

```
Monthly opportunity cost = upfront cost * monthly investment return rate
Effective monthly savings = payment savings - monthly opportunity cost
True break-even (months) = upfront cost / effective monthly savings
```

Use a conservative investment return assumption (e.g., 4-5% annually = 0.33-0.42% monthly for a high-yield savings comparison, or 6-7% annually for a long-term investment comparison). Present both the simple break-even and the opportunity-cost-adjusted break-even.

**Cumulative savings at key intervals:**
Calculate the actual dollar savings (or loss) at: 2 years, 5 years, 7 years, 10 years, and full loan term.

```
Cumulative savings at k months = (monthly savings * k) - upfront cost
```

If this number is negative, the user has not yet broken even. If positive, that is the realized savings.

**For lender credits (negative points):**
- A lender credit means the lender pays some closing costs in exchange for a higher interest rate
- The analysis inverts: the user saves upfront but pays more each month
- Frame as: "How many months until the higher monthly payment costs more than the credit received?"
- Break-even: credit amount / monthly payment increase = months until the credit is "used up"

---

### Step 5: Analyze Fixed vs. ARM Risk and Total Cost

ARM analysis requires calculating three scenarios, not just the initial payment.

**Scenario 1 -- Initial period (best case for ARM):**
- Calculate the monthly payment during the fixed period using the start rate
- Calculate total savings vs. the fixed-rate option during this period: (fixed payment - ARM payment) * initial period months

**Scenario 2 -- Moderate adjustment (expected case):**
- Assume the rate adjusts at the first adjustment by the full periodic cap (typically +2%)
- Calculate the new monthly payment on the remaining balance at that point
- To find remaining balance after the initial period: use the amortization balance formula
- Recalculate payment: M_new = balance * [r_new(1 + r_new)^n_remaining] / [(1 + r_new)^n_remaining - 1]

**Scenario 3 -- Worst case (rate hits lifetime cap):**
- Add the lifetime cap to the start rate (e.g., 6.00% start rate + 5% lifetime cap = 11.00% maximum)
- Calculate the worst-case monthly payment on the remaining balance at cap
- This shows the maximum possible payment the borrower could ever face

**ARM savings depletion analysis:**
```
Initial ARM savings (during fixed period) = (fixed payment - ARM start payment) * fixed period months
Months to deplete savings at cap rate    = initial savings / (ARM cap payment - fixed payment)
Total holding period at which ARM breaks even vs. fixed = initial period + depletion months
```

If the borrower plans to stay longer than this breakeven, the fixed rate is safer and cheaper. If they plan to sell before the initial period ends, the ARM saves money.

**ARM-specific risk flags to always include:**
- Identify the index used and note that index rates are unpredictable
- Note that the margin is permanent -- the ARM rate can only go as low as the margin
- For 5/1, 7/1, or 10/1 ARMs: explicitly state when the first adjustment occurs
- For 5/6 or other 6-month adjustment ARMs: payment can change every 6 months after the fixed period -- note the increased uncertainty vs. annual adjustment products

---

### Step 6: Build the Amortization Snapshot

A snapshot of remaining loan balance at key future dates makes abstract numbers concrete and helps the user understand their equity position.

**Calculate remaining balance after k payments:**
```
Balance_k = P * [(1 + r)^n - (1 + r)^k] / [(1 + r)^n - 1]
```

**Report balance at:** 5 years (60 payments), 7 years (84 payments), 10 years (120 payments), and at mid-term (e.g., year 15 for a 30-year loan).

**Calculate equity at each snapshot:**
```
Equity = Purchase price - Remaining balance
(Note: this is equity from loan paydown only -- does not include appreciation)
```

**Key insight to highlight:** In early years, the vast majority of each payment is interest. For a 30-year loan at 6.5%, approximately 91% of the first payment is interest. After 5 years, a borrower has paid down only about 5.5% of the original loan principal. This helps the user understand why total interest is so high and why term matters.

---

### Step 7: Factor in PMI Economics and the "Larger Down Payment" Decision

If the user's loan requires PMI or if they are near the 20% down threshold, calculate the PMI economics explicitly.

**Conventional PMI cost range:** PMI rates vary by LTV, credit score, and loan type. Common ranges:
- 95% LTV (5% down): approximately 0.80% to 1.20% of loan amount annually
- 90% LTV (10% down): approximately 0.40% to 0.80% annually
- 85% LTV (15% down): approximately 0.20% to 0.50% annually
- These are educational ranges; the actual rate is on the Loan Estimate

**Calculating PMI cancellation month:**
- Find when the scheduled amortization brings balance to 80% LTV
- PMI cancellation LTV trigger = original purchase price * 0.80
- Solve for k: P * [(1+r)^n - (1+r)^k] / [(1+r)^n - 1] = 0.80 * original purchase price
- This typically requires iterating through the amortization schedule month by month

**For the "pay more down to eliminate PMI" analysis:**
```
Additional down payment needed = (Loan amount) - (Purchase price * 0.80)
Total PMI paid over life = monthly PMI * months until PMI cancels
Net cost of NOT paying more down = Total PMI paid - investment earnings on the additional down payment
```

If total PMI paid exceeds the investment earnings on the extra down payment, paying more down is the better choice mathematically. If investment returns would exceed PMI cost, keeping the money invested is better. Show both scenarios and note that this depends on assumed investment returns, which are uncertain.

---

### Step 8: Produce the Summary with Decision Framework

After all calculations, organize findings with a clear decision framework. Never recommend a specific option, but do organize the analysis to highlight meaningful trade-offs.

**Decision framework dimensions:**
1. **Monthly cash flow:** Which option is most manageable month to month? The lowest P&I option may still have PMI or other costs that change the ranking.
2. **Total cost (full term):** Which option costs the least if the loan runs to maturity?
3. **Total cost (holding period):** If the user has a realistic holding period in mind, recalculate for that specific timeframe.
4. **Upfront cash required:** Sum of down payment, points, and closing costs. Compare to the user's available liquid assets.
5. **Risk profile:** Fixed = predictable; ARM = lower initial cost but uncertainty. Rate exposure in an ARM should be quantified, not just described.

---

## Output Format

```
## Mortgage Comparison Analysis

### Loan Details

| Feature                   | Option A        | Option B        | Option C (if applicable) |
|---------------------------|-----------------|-----------------|--------------------------|
| Loan amount               | $[amount]       | $[amount]       | $[amount]                |
| Purchase price            | $[amount]       | $[amount]       | $[amount]                |
| Down payment              | $[amount] ([%]) | $[amount] ([%]) | $[amount] ([%])          |
| Interest rate (note rate) | [rate]%         | [rate]%         | [rate]%                  |
| APR (from Loan Estimate)  | [rate]%         | [rate]%         | [rate]%                  |
| Loan type                 | [Fixed/ARM]     | [Fixed/ARM]     | [Fixed/ARM]              |
| Loan term                 | [years] years   | [years] years   | [years] years            |
| Points                    | [#] ($[cost])   | [#] ($[cost])   | [#] ($[cost])            |
| Closing costs             | $[amount]       | $[amount]       | $[amount]                |
| Total upfront cash        | $[amount]       | $[amount]       | $[amount]                |
| PMI required?             | [Yes/No]        | [Yes/No]        | [Yes/No]                 |
| Monthly PMI               | $[amount]       | $[amount]       | $[amount]                |

---

### Monthly Payment Calculation (Showing Work)

**[Option A Name]: $[P] at [rate]% fixed for [n] years**
- Monthly rate r = [rate]% / 12 = [r decimal]
- Number of payments n = [years] × 12 = [n]
- (1 + r)^n = [value]
- Numerator: r × (1+r)^n = [value]
- Denominator: (1+r)^n - 1 = [value]
- P&I payment = $[P] × ([numerator] / [denominator]) = **$[M]/month**

**[Option B Name]: $[P] at [rate]% for [n] years**
[Same structure]

---

### Monthly Payment Summary

| Component              | Option A      | Option B      | Option C      |
|------------------------|-------------:|-------------:|-------------:|
| Principal & Interest   | $[amount]     | $[amount]     | $[amount]     |
| PMI (monthly)          | $[amount]     | $[amount]     | $[amount]     |
| **Total monthly PIMI** | **$[amount]** | **$[amount]** | **$[amount]** |
| Monthly difference     | [base]        | $[+/-] vs. A  | $[+/-] vs. A  |

*(PIMI = Principal, Interest, Mortgage Insurance -- not including property taxes or homeowner's insurance, which are the same for all options)*

---

### Total Cost of Borrowing (Full Loan Term)

| Metric                          | Option A      | Option B      | Option C      |
|---------------------------------|-------------:|-------------:|-------------:|
| Total P&I payments              | $[amount]     | $[amount]     | $[amount]     |
| Total interest paid             | $[amount]     | $[amount]     | $[amount]     |
| Total PMI paid                  | $[amount]     | $[amount]     | $[amount]     |
| PMI cancels at month            | [month]       | [month]       | [month]       |
| Discount points paid            | $[amount]     | $[amount]     | $[amount]     |
| Closing costs                   | $[amount]     | $[amount]     | $[amount]     |
| **Total cost of borrowing**     | **$[amount]** | **$[amount]** | **$[amount]** |
| Difference from lowest-cost     | $[+amount]    | [Lowest]      | $[+amount]    |

---

### Total Cost for Planned Holding Period: [X] Years (if provided)

| Metric                              | Option A      | Option B      |
|-------------------------------------|-------------:|-------------:|
| Payments made ([X years] × 12)      | $[amount]     | $[amount]     |
| Remaining loan balance at year [X]  | $[amount]     | $[amount]     |
| **Net cost during holding period**  | **$[amount]** | **$[amount]** |
| Upfront costs (points + closing)    | $[amount]     | $[amount]     |
| **Total holding-period cost**       | **$[amount]** | **$[amount]** |

*(Net cost = Total payments - Principal recovered via remaining balance)*

---

### Points Break-Even Analysis

**[Option with points] vs. [Option without points]:**

| Metric                                          | Value          |
|-------------------------------------------------|-------------:|
| Cost of [X] point(s)                            | $[amount]      |
| Monthly P&I savings from lower rate             | $[amount]/mo   |
| Simple break-even                               | [X] months ([X.X] years) |
| Opportunity cost of points (at [Y]% return)     | $[amount]/mo   |
| Adjusted break-even (with opportunity cost)     | [X] months ([X.X] years) |

**Cumulative savings (after subtracting point cost):**

| Holding Period | Simple Savings  | Opp.-Cost Adjusted |
|----------------|----------------:|-------------------:|
| 2 years        | $[amount]        | $[amount]           |
| 5 years        | $[amount]        | $[amount]           |
| 7 years        | $[amount]        | $[amount]           |
| 10 years       | $[amount]        | $[amount]           |
| Full term      | $[amount]        | $[amount]           |

*(Negative values = points have not yet broken even; positive = net savings realized)*

---

### Fixed vs. ARM Analysis (if applicable)

**ARM structure: [X/Y ARM] -- [X]-year fixed period, then adjusts every [Y] month(s)**
- Index: [SOFR/other]
- Margin: [X.XX]% (permanent)
- Caps: [X]% initial / [X]% periodic / [X]% lifetime
- Maximum possible rate: [start rate]% + [lifetime cap]% = [max rate]%
- Minimum possible rate (floor): [floor rate]%

| Scenario                                  | ARM Payment   | Fixed Payment | ARM Monthly Advantage |
|-------------------------------------------|-------------:|-------------:|----------------------:|
| Initial period ([X] years)                | $[amount]     | $[amount]     | $[savings] lower      |
| First adjustment (+[periodic cap]%)       | $[amount]     | $[amount]     | $[+/-]                |
| Lifetime cap rate ([max rate]%)           | $[amount]     | $[amount]     | $[amount] HIGHER      |

**ARM total savings analysis:**
- Total ARM savings during initial fixed period: $[amount]
- Months after first adjustment until those savings are depleted (at cap rate): [X] months
- If you sell or refinance before year [X+Y]: ARM wins by approximately $[amount]
- If you stay beyond year [X+Y] and rates hit the cap: Fixed wins by approximately $[amount]

---

### Amortization Snapshot (Remaining Loan Balance)

| Year End | Option A Balance | Equity (A) | Option B Balance | Equity (B) |
|----------|----------------:|----------:|----------------:|----------:|
| Year 5   | $[amount]        | $[amount]  | $[amount]        | $[amount]  |
| Year 7   | $[amount]        | $[amount]  | $[amount]        | $[amount]  |
| Year 10  | $[amount]        | $[amount]  | $[amount]        | $[amount]  |
| Year 15  | $[amount]        | $[amount]  | $[amount]        | $[amount]  |
| Year 20  | $[amount]        | $[amount]  | $[amount]        | $[amount]  |
| Payoff   | $0               | Full equity| $0               | Full equity|

*(Equity = Purchase price - Remaining balance, based on paydown only, not appreciation)*

*Interest composition note: In the first payment, approximately [X]% of the payment is interest and [Y]% is principal. By year [mid-term], that ratio is approximately [X]%/[Y]%.*

---

### PMI Analysis (if applicable)

| Metric                                    | Option A      | Option B      |
|-------------------------------------------|-------------:|-------------:|
| Current LTV                               | [%]           | [%]           |
| PMI monthly premium                       | $[amount]     | $[amount]     |
| Balance reaches 80% LTV at month          | [month #]     | [month #]     |
| Total PMI paid                            | $[amount]     | $[amount]     |
| Additional down payment to eliminate PMI  | $[amount]     | $[amount]     |

---

### Summary Table

| Decision Dimension          | Lowest/Best Option | Amount         |
|-----------------------------|-------------------|---------------|
| Lowest monthly payment      | Option [X]        | $[amount]/mo  |
| Lowest total cost (30 yr)   | Option [X]        | $[amount]      |
| Lowest total cost (held [X] yrs) | Option [X]   | $[amount]      |
| Lowest upfront cash needed  | Option [X]        | $[amount]      |
| Lowest rate risk            | Option [X]        | [Fixed]        |

**Key trade-offs:**
- Monthly payment vs. total cost: Option [X] is cheapest monthly but costs $[amount] more over the loan life
- Points decision: Points break even at [X] years; planned holding period is [Y] years, so [paying/not paying] points [saves/costs] $[amount]
- ARM vs. Fixed: ARM saves $[amount] during the initial period; fixed becomes advantageous if you stay beyond [X] years

---

### Additional Factors

- **Mortgage interest deductibility:** Subject to current tax law limits. Verify current rules with a tax professional. [JURISDICTION: rules change; the mortgage interest deduction is subject to the $750,000 debt limit on loans originated after Dec. 2017 under current law, but verify current status]
- **PMI deductibility:** [JURISDICTION: verify current status; this deduction has expired and been reinstated multiple times]
- **Prepayment penalty:** Verify whether any option includes a prepayment penalty; these are rare on conventional loans but appear on some portfolio and non-QM products
- **Rate lock expiration:** Confirm the lock period and expiration date for each offer; typically 30-60 days
- **Float-down option:** Ask whether any offer includes a float-down provision if rates drop before closing

---

### Next Steps

- [ ] Locate the Loan Estimate for each option and verify all figures above against Section A (origination) and Sections B/C/H (other fees)
- [ ] Confirm the rate lock period and expiration date with each lender
- [ ] Ask each lender: "Is there a prepayment penalty on this loan?"
- [ ] If considering an ARM: ask the lender what the current index value is and calculate the fully-indexed rate (index + margin) today
- [ ] Determine your realistic holding period -- this changes the optimal choice when points are involved
- [ ] Discuss with a financial advisor or HUD-approved housing counselor before signing
```

---

## Rules

1. **Never recommend a specific option** -- present all calculations neutrally and let the user apply their own priorities (cash flow vs. total cost vs. risk tolerance). The role is to compute and explain, not decide.

2. **Never state current market rates as factual benchmarks** -- do not say things like "6.5% is above average right now." Rate environments change; stating current rates as fact will be wrong as soon as markets move. Use only the rates the user provides.

3. **Always use the note rate (not APR) in payment calculations** -- the APR is a standardized disclosure rate that includes fees amortized over the loan term; using it instead of the note rate in the amortization formula produces a mathematically incorrect payment.

4. **Always show the total cost of borrowing, not just the monthly payment** -- monthly payment comparisons systematically favor longer terms and higher rates because lower payments feel cheaper. A 30-year loan at 6.5% has a lower payment than a 15-year at 6.0% but costs dramatically more in total interest. Always show both.

5. **Always calculate the opportunity-cost-adjusted break-even for points** -- the simple break-even ignores the fact that money paid for points could have been invested. A 3-year simple break-even becomes a 3.8-year adjusted break-even at a 5% opportunity cost assumption. This distinction matters.

6. **For ARM analysis, always calculate the worst-case (cap) payment** -- presenting only the initial ARM payment without the cap scenario omits the most important risk information. The cap payment must always appear alongside the initial payment.

7. **Never omit PMI from total cost comparisons** -- PMI on a 90% LTV conventional loan can add $80-$200/month and tens of thousands of dollars over the cancellation period. Omitting it makes certain options appear artificially cheaper.

8. **Distinguish between the Loan Estimate APR and the note rate** -- the Loan Estimate is the official federal disclosure document (required within 3 business days of application under TRID rules). When users have Loan Estimates, encourage them to compare the total Loan Costs from Section A + B + C + E + F + H, not just the rate on page 1.

9. **Recalculate for the user's planned holding period if they provide one** -- the optimal choice on a full 30-year basis is often the wrong choice for someone who plans to sell in 7 years. Holding-period total cost is the most practically relevant metric when a sale or refinance is anticipated.

10. **Flag FHA MIP vs. conventional PMI as a structural difference, not just a cost difference** -- FHA MIP with less than 10% down stays for the full loan term; conventional PMI cancels at 80% LTV. This is not just a monthly cost difference -- it is a permanent vs. temporary cost that fundamentally changes which product is cheaper over time. Always note this distinction explicitly.

11. **Do not conflate points with origination fees** -- discount points are prepaid interest that lower the rate; origination fees are the lender's compensation. They are both in Section A of the Loan Estimate but serve different economic functions. Points enter the break-even analysis; origination fees are a fixed cost that should be included in closing costs.

12. **For adjustable-rate mortgages, always state when the first adjustment occurs** -- a 5/1 ARM first adjusts in month 61, not month 13. Users often conflate the adjustment period label with the frequency of adjustment. State the exact month of the first adjustment and the exact months of subsequent adjustments.

---

## Edge Cases

### User Has Only One Loan Offer

Do not tell the user to get more offers (that is out of scope). Instead, perform the following comparisons on the single offer:
- The loan as offered vs. the same loan 0.5 points cheaper (to show what a rate reduction would cost in monthly savings and break-even)
- The 30-year term vs. a 15-year term on the same loan amount (calculate the rate differential the user would need to ask about)
- The offered rate with the current points vs. the same rate with one fewer or one additional point
- If the loan has PMI: calculate the paydown required to eliminate PMI and the total PMI cost if they don't pay it down

### User Has More Than Three Options

The comparison table scales to any number of columns, but cognitive load increases sharply beyond three. Suggest the user eliminate obvious outliers first:
- If two options have the same rate but different closing costs, the lower-closing-cost option dominates -- remove the higher-cost version
- If one option has a higher rate AND higher closing costs than another, it is dominated and can be eliminated
- Rank all options by total cost of borrowing (full term) first, then surface the top 2-3 for detailed analysis
- Always preserve the option with the lowest monthly payment and the option with the lowest total cost in the final comparison, even if they are not the same option

### ARM With an Interest-Only Period

Some ARMs (particularly 10/1 products) include an initial interest-only period before converting to fully amortizing payments. This creates a payment cliff at conversion.

- During the interest-only period: payment = P * r (interest only, no principal reduction)
- At conversion, the remaining balance is the FULL original principal (no paydown has occurred)
- The fully amortizing payment must repay the full original balance over the REMAINING term
- Recalculate: M_converted = P * [r_adj(1+r_adj)^n_remaining] / [(1+r_adj)^n_remaining - 1]
- Show the payment before conversion, at conversion (at start rate), and at cap rate -- the jump can be dramatic
- Flag negative amortization features (where minimum payment is less than interest accruing) as carrying specific risk of growing loan balance

### User Plans to Refinance Before Term

Reframe the entire analysis around the holding period:
- Total cost to refinance date = payments made + closing costs + points - balance recovered
- The lower-rate option (with higher points) often loses to the higher-rate option (with lower points) on a 3-year holding period even if it wins on a 30-year basis
- ARM vs. Fixed: if the user will refinance before the ARM's initial fixed period ends, the ARM almost certainly wins on total cost -- quantify exactly how much
- Note the risk: the planned refinance may not be possible (rates could be higher, financial circumstances could change, property could decline in value)

### FHA Loan vs. Conventional Loan Comparison

This requires special treatment because the loan structures differ fundamentally:
- FHA has an upfront MIP of 1.75% of the loan amount, typically financed into the loan -- the effective loan balance is higher than the purchase price minus down payment
- Recalculate: FHA loan balance = (purchase price - down payment) + (1.75% * loan amount)
- FHA monthly MIP for loans with less than 10% down persists for the FULL LOAN TERM regardless of equity buildup -- there is no automatic cancellation
- For a 30-year FHA loan at 90% LTV, the total MIP cost over 30 years often exceeds $30,000-$40,000 on a $300,000+ loan -- this must appear explicitly in the total cost comparison
- Conventional loans with 10% down and PMI may have lower total cost even if the monthly payment is initially higher, once PMI cancellation is factored in

### User Is Near the 20% Down Payment Threshold

If the user could put down a slightly larger amount to cross the 80% LTV threshold and eliminate PMI entirely:
- Calculate the exact additional cash needed: Additional down = Current loan amount - (Purchase price * 0.80)
- Calculate total PMI that would be paid if NOT crossing the threshold (per the amortization schedule cancellation date)
- Compare: Is the additional down payment less than or greater than the total PMI that would be paid?
- Also calculate the opportunity cost of that additional down payment at a conservative return rate
- Net decision: if additional cash needed < total PMI and the money is available, paying down to 80% LTV is mathematically favorable assuming no better use for that cash exists
- Note: some lenders allow a "split loan" (80-10-10 structure -- 80% first mortgage, 10% second mortgage, 10% down) as an alternative to PMI; this is worth asking about but requires a separate analysis

### User Has a Jumbo Loan

Jumbo loans (above the conforming loan limit) differ in important ways:
- PMI is typically not available from standard PMI carriers -- lenders use alternative structures
- Rate premium over conforming is typically 0.25% to 0.75%, though this varies significantly
- Some jumbo lenders offer 80-10-10 splits to stay under the conforming limit on the first mortgage
- Do not state the current conforming loan limit as a fixed number -- it changes annually and varies by county; instruct the user to verify the current limit for their county

---

## Example

**Input:** "I have three mortgage offers for a $420,000 home. I'm putting $84,000 down so the loan amount is $336,000. Option 1: 6.875% fixed 30-year, no points, $3,800 closing costs. Option 2: 6.375% fixed 30-year, 1.5 points, $4,200 closing costs. Option 3: 5.875% fixed for 7 years (7/1 ARM), then adjusts annually, margin is 2.75%, caps are 5/2/5, $3,600 closing costs, no points. I plan to stay about 8-10 years. No PMI since I'm at exactly 20% down."

---

## Mortgage Comparison Analysis

> **Disclaimer:** The following analysis is educational only and does not constitute financial or mortgage advice. Always verify figures against your official Loan Estimate documents and consult qualified professionals before making mortgage decisions.

---

### Loan Details

| Feature                   | Option 1: Fixed (no pts) | Option 2: Fixed (1.5 pts) | Option 3: 7/1 ARM         |
|---------------------------|--------------------------|---------------------------|---------------------------|
| Loan amount               | $336,000                 | $336,000                  | $336,000                  |
| Purchase price            | $420,000                 | $420,000                  | $420,000                  |
| Down payment              | $84,000 (20.0%)          | $84,000 (20.0%)           | $84,000 (20.0%)           |
| Interest rate (note rate) | 6.875%                   | 6.375%                    | 5.875% (initial)          |
| Loan type                 | Fixed                    | Fixed                     | 7/1 ARM                   |
| Loan term                 | 30 years                 | 30 years                  | 30 years                  |
| Points                    | 0 ($0)                   | 1.5 ($5,040)              | 0 ($0)                    |
| Closing costs             | $3,800                   | $4,200                    | $3,600                    |
| Total upfront cash needed | $87,800                  | $93,440                   | $87,600                   |
| PMI required?             | No (20% down)            | No (20% down)             | No (20% down)             |

---

### Monthly Payment Calculation (Showing Work)

**Option 1: $336,000 at 6.875% fixed for 30 years**
- Annual rate: 6.875% = 0.06875
- Monthly rate r = 0.06875 / 12 = 0.0057292
- Number of payments n = 30 × 12 = 360
- (1 + 0.0057292)^360 = 7.7524
- Numerator: 0.0057292 × 7.7524 = 0.044408
- Denominator: 7.7524 - 1 = 6.7524
- M = $336,000 × (0.044408 / 6.7524) = $336,000 × 0.006577
- **Monthly P&I payment: $2,210**

**Option 2: $336,000 at 6.375% fixed for 30 years**
- Annual rate: 6.375% = 0.06375
- Monthly rate r = 0.06375 / 12 = 0.0053125
- (1 + 0.0053125)^360 = 6.8684
- Numerator: 0.0053125 × 6.8684 = 0.036488
- Denominator: 6.8684 - 1 = 5.8684
- M = $336,000 × (0.036488 / 5.8684) = $336,000 × 0.006219
- **Monthly P&I payment: $2,090**

**Option 3: $336,000 at 5.875% for initial 7-year period**
- Annual rate: 5.875% = 0.05875
- Monthly rate r = 0.05875 / 12 = 0.0048958
- (1 + 0.0048958)^360 = 5.8935
- Numerator: 0.0048958 × 5.8935 = 0.028851
- Denominator: 5.8935 - 1 = 4.8935
- M = $336,000 × (0.028851 / 4.8935) = $336,000 × 0.005896
- **Monthly P&I payment during initial period: $1,981**

---

### Monthly Payment Summary

| Component              | Option 1 (Fixed) | Option 2 (Fixed+Pts) | Option 3 (ARM initial) |
|------------------------|----------------:|--------------------:|----------------------:|
| Principal & Interest   | $2,210           | $2,090               | $1,981                 |
| PMI                    | $0               | $0                   | $0                     |
| **Total monthly**      | **$2,210**       | **$2,090**           | **$1,981**             |
| Monthly vs. Option 2   | +$120 more       | Lowest fixed         | $109 lower initially   |

---

### Total Cost of Borrowing (Full 30-Year Term)

| Metric                      | Option 1       | Option 2       | Option 3 (ARM -- initial rate only, not meaningful at full term) |
|-----------------------------|---------------:|---------------:|---:|
| Total P&I payments (360 mo) | $795,600        | $752,400        | Note below |
| Total interest paid         | $459,600        | $416,400        | N/A at full term |
| Points paid                 | $0              | $5,040          | $0 |
| Closing costs               | $3,800          | $4,200          | $3,600 |
| **Total cost of borrowing** | **$463,400**    | **$425,640**    | *See ARM analysis below* |
| Difference from Option 2    | +$37,760 more   | Lowest fixed    | -- |

*Note: Option 3 (ARM) cannot be meaningfully compared over 30 years because the rate after year 7 is unknown. The ARM analysis below provides the correct framework.*

---

### Points Break-Even Analysis: Option 1 vs. Option 2

| Metric                                            | Value              |
|---------------------------------------------------|------------------:|
| Cost of 1.5 points on Option 2                    | $5,040             |
| Additional closing costs for Option 2 vs. Option 1| $400               |
| Total extra upfront cost for Option 2             | $5,440             |
| Monthly P&I savings (Option 1 - Option 2)         | $120/month         |
| Simple break-even                                 | 45.3 months (3.8 years) |
| Opportunity cost of $5,440 at 5% annual return    | ~$22.67/month      |
| Effective monthly savings after opportunity cost  | $120 - $23 = $97/month |
| Opportunity-cost-adjusted break-even              | 56.1 months (4.7 years) |

**Cumulative savings of Option 2 over Option 1 (after recovering upfront cost):**

| Holding Period      | Simple Savings  | Opp.-Cost Adjusted |
|---------------------|----------------:|-------------------:|
| 2 years (24 mo)     | -$2,560 (not recovered) | -$3,096      |
| 3 years (36 mo)     | -$1,120         | -$1,932             |
| 4 years (48 mo)     | +$320            | -$816              |
| 5 years (60 mo)     | +$1,760          | +$300              |
| 7 years (84 mo)     | +$4,640          | +$2,508             |
| 10 years (120 mo)   | +$9,160          | +$6,100             |
| Full 30 years       | +$37,760         | +$26,840            |

*At your 8-10 year expected holding period: Option 2 saves approximately $4,600-$6,100 depending on whether you account for the opportunity cost of the points.*

---

### Fixed vs. ARM Analysis: Option 1 / Option 2 vs. Option 3

**ARM Structure: 7/1 ARM**
- Fixed period: 84 months (first adjustment in month 85 -- July of year 8)
- After month 84: adjusts every 12 months
- Margin: 2.75% (permanent for life of loan)
- Caps: 5% initial / 2% periodic / 5% lifetime
- Start rate: 5.875%
- Maximum possible rate: 5.875% + 5% lifetime cap = **10.875%**
- Minimum possible rate (floor): 5.875% (the start rate serves as the floor in most structures -- verify with lender)
- Fully-indexed rate today would be: current index value + 2.75% margin (ask the lender what the current index value is)

**Remaining balance at end of year 7 (month 84):**
```
Balance_84 = $336,000 × [(1.0048958)^360 - (1.0048958)^84] / [(1.0048958)^360 - 1]
           = $336,000 × [5.8935 - 1.5022] / [5.8935 - 1]
           = $336,000 × 4.3913 / 4.8935
           = $336,000 × 0.8974
           = $301,528
```

**Payment scenarios after first adjustment (on $301,528 remaining balance, 276 months left):**

*Scenario A -- First adjustment at +2% periodic cap (rate becomes 7.875%):*
- r_new = 7.875% / 12 = 0.0065625
- M = $301,528 × [0.0065625 × (1.0065625)^276] / [(1.0065625)^276 - 1]
- (1.0065625)^276 = 6.1208
- M = $301,528 × [0.0065625 × 6.1208] / [6.1208 - 1] = $301,528 × 0.040175 / 5.1208
- **Payment at 7.875%: approximately $2,362/month**

*Scenario B -- Rate hits full 5% initial cap immediately at first adjustment (rate becomes 10.875%):*
- r_cap = 10.875% / 12 = 0.0090625
- (1.0090625)^276 = 12.0558
- M = $301,528 × [0.0090625 × 12.0558] / [12.0558 - 1] = $301,528 × 0.10926 / 11.0558
- **Payment at worst-case cap: approximately $2,977/month**

| Scenario                             | ARM Payment   | Option 1 Payment | Monthly Difference |
|--------------------------------------|-------------:|----------------:|-------------------:|
| Months 1-84 (initial 7-year period)  | $1,981        | $2,210           | **$229 lower**     |
| First adjustment at +2% (7.875%)     | $2,362        | $2,210           | $152 higher        |
| Worst case: 5% cap (10.875%)         | $2,977        | $2,210           | $767 higher        |

**ARM savings and depletion analysis vs. Option 1:**
- Total ARM savings during 84-month initial period: $229 × 84 = **$19,236**
- If rate adjusts to 7.875% at month 85: ARM is now $152/month MORE expensive
- Months to deplete $19,236 in savings at $152/month overage: $19,236 / $152 = 127 months = 10.6 years
- ARM overall break-even vs. Option 1 (if rate adjusts to 7.875%): month 84 + 127 months = **month 211 (year 17.6)**
- If rate hits full cap at 10.875%: depletion months = $19,236 / $767 = 25 months; overall break-even = month 109 **(year 9.1)**

**ARM savings and depletion analysis vs. Option 2:**
- ARM savings vs. Option 2 per month in initial period: $
