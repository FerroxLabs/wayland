---
name: loan-comparison
description: |
  Compares 2-4 loan options by computing total cost of borrowing (principal plus total interest), monthly payment, effective APR, and total amount repaid for each. Produces a side-by-side comparison matrix so the user can evaluate loan offers on equal terms.
  Use when the user is comparing loan offers, evaluating financing options, or wants to understand the true cost of borrowing for different loan terms or rates.
  Do NOT use for debt consolidation analysis (use debt-consolidation-analysis), credit score interpretation, or investment comparison.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "personal-finance debt-management analysis budgeting"
  category: "personal-finance"
  subcategory: "debt-management"
  depends: ""
  disclaimer: "educational-finance"
  difficulty: "intermediate"
---
# Loan Comparison

> **Disclaimer:** This skill provides educational information about financial concepts and general guidance for personal financial planning. It does NOT constitute financial advice, investment recommendations, or tax guidance. Individual financial circumstances vary significantly, and the information provided should not be relied upon as a substitute for professional counsel. Always consult a qualified financial advisor, tax professional, or licensed financial planner before making significant financial decisions.

---

## When to Use

**Use this skill when:**
- The user has received 2--4 distinct loan offers (personal loans, auto loans, student loans, small business loans, or mortgages without tax/insurance escrow complexity) and wants an objective side-by-side comparison
- The user asks "which loan costs less overall?" or "what is the true cost of this loan?" -- indicating they need total-cost analysis, not just rate comparison
- The user is evaluating the same loan amount across lenders with different rates, terms, or fee structures and cannot determine which offer is genuinely cheaper
- The user wants to understand the APR vs. interest rate distinction because a lender quoted both numbers and they differ
- The user is choosing between loan terms -- for example, 36-month vs. 60-month auto financing -- and wants to quantify the tradeoff between monthly affordability and total interest paid
- The user received a low-rate offer with points or origination fees and wants to know whether the fee is worth paying to secure the lower rate (break-even analysis)
- The user is comparing a 0% promotional financing offer against a standard loan with a cash-back incentive (net cost comparison)

**Do NOT use when:**
- The user wants to consolidate multiple existing debts into one new loan -- use `debt-consolidation-analysis`, which accounts for current balances, remaining terms, and blended interest rates across existing obligations
- The user has existing loans and wants a payoff strategy (avalanche vs. snowball method) -- use `debt-payoff-planner`
- The user wants to understand why their credit score affects the rate they are being offered -- use `credit-score-explainer`
- The user is comparing a full mortgage with PITI (principal, interest, taxes, insurance) and escrow accounts -- use `mortgage-analysis`, which handles PMI thresholds, escrow adjustments, and amortization schedules specific to home lending
- The user wants to compare borrowing against investing (i.e., "should I take out a loan or use savings?") -- use `borrow-vs-invest-analysis`
- The user has fewer than two concrete loan offers with actual rate and term data -- gather the information first before running any comparison

---

## Process

### Step 1: Collect Complete Loan Parameters for Each Option

Before any calculation, obtain all input variables. Incomplete inputs produce misleading comparisons. Ask for the following for each loan (2--4 options):

- **Principal:** The amount actually disbursed to the borrower. If an origination fee is deducted from the loan (rather than added to it), the disbursed amount differs from the face amount -- clarify which is which.
- **Stated interest rate vs. APR:** Many lenders quote both. The stated rate drives the amortization math. The APR includes fees annualized over the term. If the user only has one number, ask whether it includes fees.
- **Loan term:** In months. Convert years to months (3 years = 36 months, 5 years = 60 months, 30 years = 360 months).
- **Fee structure:** Origination fees (flat dollar or percentage of principal), discount points (mortgage context -- each point = 1% of loan amount, typically reduces rate by 0.125%--0.25%), application fees, prepayment penalty terms, and any mandatory insurance products bundled into the loan.
- **Rate type:** Fixed, variable (ARM), or hybrid. For variable-rate products, ask for the index (SOFR, Prime), margin, initial rate, adjustment frequency, rate cap per period, and lifetime cap.
- **Payment frequency:** Monthly is standard; some lenders offer bi-weekly (26 payments/year, effectively 13 monthly payments -- accelerates payoff and reduces total interest).
- **Whether fees are financed or paid upfront:** This changes the effective principal for amortization purposes.

If the user cannot provide all fields, flag the gaps explicitly and state what assumption you are making (e.g., "Assuming no prepayment penalty since none was mentioned").

---

### Step 2: Calculate Monthly Payment Using Standard Amortization

Use the standard fixed-rate amortization formula for every fixed-rate loan:

**Monthly Payment (M) = P × [r(1+r)^n] / [(1+r)^n -- 1]**

Where:
- P = principal (if fees are financed, add financed fees to P)
- r = periodic interest rate = stated annual rate ÷ 12
- n = total number of monthly payments

**Key calculation notes:**
- Use the stated interest rate (not APR) for the amortization formula. APR is a disclosure metric, not an amortization driver.
- For a rate of 7.5% annual: r = 0.075 ÷ 12 = 0.00625
- For 0% promotional loans: monthly payment = P ÷ n (no interest component). Flag the post-promotional-period rate separately.
- For bi-weekly payment structures: use r = annual rate ÷ 26, n = term in bi-weekly periods. Monthly-equivalent = bi-weekly payment × 26 ÷ 12.
- Round the calculated monthly payment to the nearest cent for precision, but display rounded to the nearest dollar in the summary table.
- Verify your calculation against known benchmarks: a $10,000 loan at 6% for 60 months should yield a monthly payment of approximately $193.

---

### Step 3: Compute Total Interest and Total Cost of Borrowing

For each option:

- **Total payments made** = Monthly payment × n (number of months)
- **Total interest paid** = Total payments -- original principal (the face amount, not the disbursed amount if fees were deducted)
- **Total fees** = Sum of all upfront and financed fees (origination, points, application, mandatory insurance)
- **Total cost of borrowing** = Total interest + total fees
- **Total amount repaid** = Principal + total interest + total fees

**Important distinctions:**
- If a $300 origination fee is financed into the loan, the borrower pays interest on that fee for the entire term. A $300 fee financed into a 60-month loan at 9% costs approximately $370 in total (fee + interest on fee). Show this as part of total interest, not a flat fee.
- If fees are paid upfront out of pocket, they do not accrue interest but still represent real cash outflow. Include them in total cost but not in the amortization calculation.
- Points paid at closing in a mortgage context are prepaid interest -- they are deductible in some tax situations. Flag this for the user to verify with a tax professional but do not adjust calculations for tax effects without explicit instruction.

---

### Step 4: Calculate Effective APR for Each Option

The effective APR normalizes loans with different fee structures onto a common basis. It answers: "If this loan had no fees but cost the same total amount, what would the rate be?"

**Effective APR calculation method (CFPB-consistent approach):**

1. Start with the actual net disbursement to the borrower (loan amount minus upfront fees, or loan amount if fees are financed).
2. Keep the same monthly payment calculated from the face amount.
3. Solve for the monthly rate (r) that makes the present value of all monthly payments equal to the net disbursement, using IRR iteration.
4. Multiply the monthly rate by 12 to get effective APR.

**Practical shortcut for modest fees (under 3% of principal):**

Effective APR ≈ Stated Rate + (Annual Fee Cost / Average Outstanding Balance)

For a $15,000 loan at 8.5% for 36 months with a $300 origination fee:
- Average balance ≈ $15,000 × 0.55 (rough midpoint adjustment) ≈ $8,250
- Annual fee cost = $300 ÷ 3 years = $100/year
- Fee add-on ≈ $100 / $8,250 ≈ 1.2%
- Effective APR ≈ 8.5% + 1.2% ≈ 9.7% (the exact IRR method yields ~9.3% for this case; the shortcut overstates slightly)

**Always use the IRR method when precision matters.** Present effective APR rounded to two decimal places. Flag when the effective APR materially exceeds the stated APR (more than 0.5 percentage points is significant for personal loans; more than 0.25 points for mortgages where amounts are large).

---

### Step 5: Calculate Break-Even Period for Fee vs. Rate Trade-offs

When one option has lower rate but higher fees, calculate the break-even month -- the point at which cumulative interest savings from the lower rate offset the higher upfront fee:

**Break-even months = Upfront fee differential / Monthly payment differential**

More precisely:
- Calculate monthly interest cost under each option at each month of the amortization schedule (interest portion = outstanding balance × monthly rate)
- Accumulate the monthly interest savings of the lower-rate option
- The break-even month is when accumulated savings first exceed the fee paid for that lower rate

**Practical application:**
- If a mortgage with 1 point ($2,500 on a $250,000 loan) saves $15/month in interest, break-even = $2,500 / $15 = 167 months (nearly 14 years). Points are not worth it unless the borrower holds the loan 14+ years.
- If a personal loan with a $200 origination fee saves $18/month vs. a no-fee option, break-even = $200 / $18 = 11 months. Fee is worth it if the loan runs longer than 11 months (which it will for a 36-month loan).
- For shorter personal loans (12--36 months), break-even math usually favors no-fee options because the fee recovery period is a large fraction of the total term.

---

### Step 6: Handle Variable-Rate Loans -- Scenario Analysis

Never compare a variable-rate loan to a fixed-rate loan using only the initial rate. The initial rate is a teaser; the actual cost depends on rate movements.

**Build three scenarios for variable-rate options:**
- **Best case:** Rate stays flat at the initial rate for the entire term
- **Base case:** Rate rises by the average historical adjustment for that index (for SOFR-indexed loans, use 3--4 annual adjustments of 0.25--0.50% as a reasonable stress test)
- **Worst case:** Rate increases to the lifetime cap immediately after the initial period and stays there

Calculate total cost under each scenario. Present the range of outcomes alongside the fixed-rate options. Use this framing: "Variable-rate Option B costs between $X and $Y depending on rate movements, versus fixed-rate Option A which costs a certain $Z."

For variable-rate loans, also flag:
- The adjustment frequency (6-month vs. 12-month resets)
- The rate floor (some loans cannot go below the initial rate)
- Whether there is a prepayment penalty that would lock the borrower into the variable rate

---

### Step 7: Build and Present the Comparison Matrix

Organize results in the structured format defined in the Output Format section. Sequence the narrative as:

1. **Loan terms recap** -- confirm all inputs so the user can spot any errors
2. **Monthly payment comparison** -- most users anchor on this first
3. **Total cost comparison** -- redirect attention here as the primary decision metric
4. **Effective APR comparison** -- the rate-normalized view
5. **Break-even analysis** -- only if fee structures differ between options
6. **Tradeoff narrative** -- plain-language summary of what the numbers mean
7. **Decision factors beyond cost** -- qualitative considerations the math cannot capture

---

### Step 8: Deliver Key Findings With Specific Guidance

After presenting the matrix, provide a structured narrative that answers the user's actual question. Structure the findings around three axes:

- **Lowest monthly payment:** Name the option and the dollar amount. Explain what drives it (longer term, lower rate, or both) and quantify the total cost penalty for choosing it.
- **Lowest total cost:** Name the option and total amount repaid. Quantify the monthly payment premium the user pays to achieve that savings.
- **Lowest effective APR:** This is the cleanest apples-to-apples rate comparison once fees are normalized. It is not always the same as lowest total cost if terms differ.

When the lowest-monthly-payment option and the lowest-total-cost option are different (the most common scenario with term differences), explicitly state: "Choosing Option [X] over Option [Y] saves you $[Z] per month but costs you $[W] more over the life of the loan. At $[Z]/month savings, it would take [W/Z] months to spend those savings elsewhere to break even." This reframes the decision as an opportunity cost problem.

---

## Output Format

```
## Loan Comparison Analysis

> **Note:** All calculations assume stated rates are annual nominal rates compounded
> monthly. Effective APR calculated using IRR method to account for fees.
> [Note any missing information and assumptions made.]

---

### Loan Terms Summary
| Parameter              | [Lender/Option Name 1] | [Lender/Option Name 2] | [Lender/Option Name 3] |
|------------------------|------------------------|------------------------|------------------------|
| Face Amount            | $XX,XXX                | $XX,XXX                | $XX,XXX                |
| Stated Interest Rate   | X.XX%                  | X.XX%                  | X.XX%                  |
| Lender-Quoted APR      | X.XX%                  | X.XX%                  | X.XX%                  |
| Loan Term              | XX months (X yrs)      | XX months (X yrs)      | XX months (X yrs)      |
| Rate Type              | Fixed / Variable       | Fixed / Variable       | Fixed / Variable       |
| Origination Fee        | $XXX (X.X% of principal)| $0                    | $XXX (X.X%)            |
| Discount Points        | X points ($XXX)        | None                   | None                   |
| Other Fees             | $XXX [describe]        | $0                     | $0                     |
| Fees Financed or Upfront| Upfront / Financed    | N/A                    | Upfront / Financed     |
| Prepayment Penalty     | Yes -- [describe] / No | Yes / No               | Yes / No               |
| Payment Frequency      | Monthly                | Monthly                | Monthly                |

---

### Monthly Payment Comparison
| Metric                        | [Option 1]  | [Option 2]  | [Option 3]  |
|-------------------------------|-------------|-------------|-------------|
| Monthly Payment               | $X,XXX      | $X,XXX      | $X,XXX      |
| vs. Lowest Payment Option     | +$XXX       | Lowest      | +$XXX       |
| Annual Payment Burden         | $X,XXX      | $X,XXX      | $X,XXX      |

---

### Total Cost of Borrowing
| Metric                        | [Option 1]  | [Option 2]  | [Option 3]  |
|-------------------------------|-------------|-------------|-------------|
| Principal (face amount)       | $XX,XXX     | $XX,XXX     | $XX,XXX     |
| Total Interest Paid           | $X,XXX      | $X,XXX      | $X,XXX      |
| Total Fees (all-in)           | $XXX        | $0          | $XXX        |
| **Total Amount Repaid**       | **$XX,XXX** | **$XX,XXX** | **$XX,XXX** |
| **Total Cost of Borrowing**   | **$X,XXX**  | **$X,XXX**  | **$X,XXX**  |
| vs. Cheapest Option (total)   | +$XXX       | Cheapest    | +$XXX       |
| Effective APR                 | X.XX%       | X.XX%       | X.XX%       |
| Cost per $1,000 borrowed      | $XX.XX      | $XX.XX      | $XX.XX      |

---

### Break-Even Analysis (if applicable -- options with different fee structures)
| Metric                        | [Option 1 vs. Option 2]             |
|-------------------------------|-------------------------------------|
| Fee differential              | $XXX more for Option 1              |
| Monthly payment savings       | $XX less per month with Option 1    |
| Break-even point              | XX months into the loan             |
| Loan term                     | XX months                           |
| Verdict                       | Fee worth paying / Not worth paying |

---

### Variable Rate Scenario Analysis (include only if a variable-rate option is present)
| Scenario                      | [Variable Option]   | [Fixed Option for Reference] |
|-------------------------------|---------------------|------------------------------|
| Best Case (rate flat)         | $XX,XXX total       | $XX,XXX total                |
| Base Case (moderate increases)| $XX,XXX total       | $XX,XXX total                |
| Worst Case (rate hits cap)    | $XX,XXX total       | $XX,XXX total                |
| Fixed option beats variable when| Rate rises above X.XX% | Always certain          |

---

### Summary Scorecard
| Criterion                     | Winner      | Margin      |
|-------------------------------|-------------|-------------|
| Lowest monthly payment        | [Option X]  | $XXX/month  |
| Lowest total cost             | [Option X]  | $XXX less   |
| Lowest effective APR          | [Option X]  | X.XX%       |
| Shortest payoff term          | [Option X]  | XX months   |
| Fewest restrictions           | [Option X]  | [describe]  |

---

### Tradeoff Analysis

**Monthly affordability vs. total cost:**
Choosing [lowest-payment option] over [lowest-total-cost option] saves $XXX per month
but costs $X,XXX more over the life of the loan. The additional monthly savings would
need to be invested or used productively to justify the higher total cost.

**Fee impact:**
[Option with fees] carries a $XXX origination fee that raises its effective APR from
X.XX% to X.XX% -- a difference of X.XX percentage points. After accounting for fees,
[Option X] is cheaper / more expensive than it appears from the stated rate alone.

**Term impact:**
The [XX]-month option vs. the [XX]-month option represents [X] additional months of
payments. Those extra payments cost $X,XXX in additional interest while freeing up
$XXX/month during the shorter-term payoff.

---

### Decision Factors Beyond Cost
These factors cannot be captured in the comparison matrix but may be decisive:

- [ ] **Monthly cash flow:** Can you comfortably absorb $[higher payment] without
      straining your monthly budget? A loan that is technically cheaper but creates
      cash-flow stress is not the better choice.
- [ ] **Prepayment flexibility:** If you anticipate paying off the loan early (bonus,
      inheritance, sale of asset), a prepayment penalty on a lower-rate loan could
      eliminate its cost advantage. Verify exact penalty terms in writing.
- [ ] **Variable rate risk tolerance:** If any option is variable-rate, consider
      your ability to absorb payments at the lifetime cap rate before choosing it.
- [ ] **Lender reliability:** Rate and term mean nothing if the lender has poor
      service, unexpected fees at funding, or opaque terms. Verify terms in the
      Loan Estimate or Truth in Lending disclosure document before signing.
- [ ] **Tax considerations:** Interest on certain loan types (mortgages, some student
      loans, some business loans) may be tax-deductible. This changes the after-tax
      effective cost. Consult a tax professional.
- [ ] **Opportunity cost of upfront fees:** Fees paid upfront are dollars not invested
      elsewhere. For large fees (1%+ of a large loan), consider whether you could
      earn more than the interest savings by investing those dollars instead.
```

---

## Rules

1. **Use stated rate for amortization, APR only as a comparison metric.** Never use the APR figure to calculate monthly payments. APR is a disclosure number that annualizes fees -- it is not the rate applied to the outstanding balance each month. Using APR in the amortization formula produces incorrect payment calculations.

2. **Never recommend a specific loan or lender.** Present the full comparison matrix and let the user draw their own conclusions. Acceptable: "Option C has the lowest total cost." Not acceptable: "You should choose Option C" or "Bank X is your best bet."

3. **Always show both monthly payment AND total cost prominently.** These two metrics are almost always in tension. Users who anchor only on monthly payment systematically underestimate the true cost of longer-term loans. Make the total cost figure impossible to miss -- bold it, put it first in the findings, and state the dollar difference explicitly.

4. **Normalize fees into effective APR when comparing options.** A loan at 7.5% with a 2% origination fee is more expensive than a loan at 8.0% with no fees for most standard terms. Never allow a stated-rate comparison to stand without resolving the fee question first.

5. **Require at least two complete loan offers before running any comparison.** If the user provides only one offer, acknowledge the information, explain what additional data is needed, and offer to compare against a no-fee alternative at the same rate as a baseline -- but clearly label it a hypothetical, not an actual offer.

6. **Flag variable-rate loans with a visible warning and present scenario analysis.** A single-point comparison of a variable-rate loan against a fixed-rate loan using only the initial rate is misleading. It will almost always make the variable option look artificially favorable. Scenario analysis is not optional when variable rates are involved.

7. **Never assume fees are zero unless explicitly confirmed.** Many lenders bury fees. If the user says "they quoted me 6.5% APR and 6.2% interest rate," there are fees -- the APR/rate gap is the evidence. Calculate the implied fee from that gap and surface it.

8. **Confirm whether loan amounts are identical before comparing per-loan totals.** Comparing a $20,000 loan total cost against a $22,000 loan total cost is not a fair comparison. If principals differ, normalize using cost-per-$1,000-borrowed or explicitly note the principal difference and its effect on total interest.

9. **Never omit the "Decision Factors Beyond Cost" section.** Cost optimization is the primary task, but the cheapest loan is not always the right loan. Prepayment penalties, cash-flow constraints, and tax implications can reverse a cost-based decision. Always include qualitative factors.

10. **Be explicit about all assumptions and flag all missing data.** If the user did not provide a prepayment penalty status, state "Prepayment penalty: Not disclosed -- verify before signing." If the user did not clarify whether fees are upfront or financed, state your assumption and show the sensitivity: "Assuming fees are paid upfront. If financed, total interest increases by approximately $[X]."

11. **Round intermediate calculations to 4 decimal places; present final results rounded to the nearest dollar.** Rounding errors compound in amortization math. Intermediate rounding of the monthly rate (e.g., using 0.007 instead of 0.00708333) can produce payment figures off by several dollars over long terms. Show final results rounded for readability, but compute precisely.

12. **For loans with different terms, explicitly state the absolute dollar cost of each additional year.** When a user considers extending a loan from 36 to 60 months to reduce payments, the additional interest cost over those 24 extra months should be expressed as a specific dollar amount, not just a percentage -- dollar amounts are more behaviorally salient and harder to rationalize away.

---

## Edge Cases

### Loans with Different Principal Amounts
If the user is comparing a $18,000 offer from one lender against a $20,000 offer from another (e.g., because one lender will not finance the full amount, or one requires a down payment), do not compare total interest figures directly -- they are not comparable. Instead:
- Calculate cost-per-$1,000 borrowed for each option: (Total interest / Principal) × 1,000
- Separately note the absolute amount of interest and the absolute monthly payment
- Ask the user to clarify: "Are you trying to borrow a fixed amount, or are the loan amounts genuinely different?" The answer changes the comparison framework entirely.

### 0% Promotional Rate Offers
These require a two-phase analysis. Phase 1: During the promotional period (typically 12--24 months for credit cards or retail financing), the loan costs nothing in interest -- monthly payment = principal ÷ promo months. Phase 2: If any balance remains after the promotional period, the post-promotional rate (commonly 24.99%--29.99% for retail/credit card products) applies, often retroactively to the original balance in some contracts. Always:
- Calculate the required monthly payment to pay off the full balance before the promo ends
- Calculate the worst-case total cost if the balance is not fully paid off and the full rate kicks in
- Compare both phases to the standard loan option
- Flag deferred interest contracts (where interest accrues from day one but is waived only if fully paid off) vs. true 0% contracts (where no interest accrues during the promotional period)

### Cash Rebate vs. Low-Rate Financing (Auto Loans)
Manufacturers frequently offer a choice: 0% financing for 60 months OR a $2,500--$3,500 cash rebate applied to the purchase price with standard financing. This is a real comparison problem with a quantifiable answer:
- Option 1: 0% for 60 months on the full sticker price (e.g., $28,000) -- monthly payment = $467, total interest = $0
- Option 2: $2,500 rebate applied at signing, finance $25,500 at 6.9% for 60 months -- monthly payment = $503, total interest = $4,071, total cost = $25,500 + $4,071 = $29,571
- Option 1 total cost = $28,000; Option 2 total cost = $29,571 -- the 0% financing saves $1,571 despite the rebate
- The break-even rate where 0% and rebate+rate are equivalent can be solved algebraically: typically, the rebate financing only wins when market rates are low (under 3--4%) and the rebate is large relative to the purchase price
- Always run both options when a user presents this scenario

### Mortgage with Discount Points
Points are prepaid interest. One point = 1% of loan amount. The rate reduction per point varies by lender and market conditions -- typically 0.125% to 0.25% per point. The analysis requires:
- Calculate monthly payment savings from the rate reduction
- Calculate break-even: upfront point cost ÷ monthly savings = break-even months
- Compare break-even to expected loan duration (how long will the borrower keep this mortgage before selling or refinancing?)
- Rule of thumb: if break-even exceeds 5 years (60 months) on a purchase mortgage, points are not worth it for most borrowers given typical refinancing and mobility patterns
- For refinances, break-even analysis is critical -- a refinance that costs $4,000 and saves $120/month breaks even in 33 months; if the borrower will move in 24 months, the refinance destroys value
- Note that mortgage interest and points may be tax-deductible -- flag this for the user without adjusting the calculation

### Variable Rate Loan in the Comparison
Treat initial-rate comparison as misleading by default. Required disclosures:
- State the initial rate, index (SOFR, Prime Rate), margin, adjustment frequency, initial rate cap, periodic cap, and lifetime cap
- Run three scenarios: rate flat at initial, rate increases 1% per year until cap, rate jumps immediately to lifetime cap
- Calculate monthly payment at each cap level (use the standard formula with remaining balance and remaining term at the time of adjustment)
- For short-term personal loans (12--36 months), the variable rate risk is lower because the term is short. For 5-7-year personal loans or variable-rate mortgages (ARMs), the risk exposure is significant and must be quantified
- Example for a 5/1 ARM: the first 5 years are fixed; years 6--30 adjust annually. The post-adjustment payment could be calculated at the cap rate and shown alongside the fixed-rate alternative

### Bi-Weekly Payment Option
Some lenders (especially mortgage and auto lenders) offer bi-weekly payment programs. These are often presented as a way to save interest, but the math is nuanced:
- True bi-weekly: 26 payments of half the monthly payment per year = 13 full monthly payment equivalents per year (vs. 12 for standard monthly). The extra payment goes entirely to principal, accelerating payoff and reducing total interest.
- Pseudo-bi-weekly: The lender withdraws funds every two weeks but only applies them monthly -- no benefit, sometimes accompanied by a fee. Confirm which type is offered.
- Quantify the actual savings: on a $300,000 mortgage at 7% for 30 years, true bi-weekly payments reduce the term by approximately 4-5 years and save roughly $60,000--$70,000 in interest. This is a dramatic enough difference to include as a separate row in the comparison if the user is evaluating mortgage options.
- If one lender offers bi-weekly and another does not, compare them on an equivalent basis (monthly-payment version for both) first, then show the bi-weekly option's total cost separately as an enhancement scenario.

### User Wants to Include "Pay Cash" as an Option
Add a cash column to the comparison. Key points:
- Total cost of cash = face price of purchase only (zero interest, zero fees)
- Opportunity cost = what those dollars could have earned if invested rather than spent (the user should verify this with a financial advisor, but you can illustrate: $15,000 invested at 5% for 3 years grows to approximately $17,364 -- so the opportunity cost of using cash is approximately $2,364 in foregone growth)
- Cash is the cheapest borrowing option by definition if the alternative rate is positive, but it depletes liquid savings and eliminates the ability to deploy those funds elsewhere
- Present cash as a comparison baseline: "Cash saves $X,XXX in interest versus the cheapest loan option, but depletes your liquid reserves by $XX,XXX."

---

## Example

**Input:** "I'm trying to get a $25,000 personal loan. I have three offers. First National Bank is offering 9.25% fixed for 48 months with a $500 origination fee paid upfront. Meridian Credit Union is offering 8.75% fixed for 60 months with no fees. Online Lender Direct is offering 10.5% fixed for 36 months with no fees. They also mentioned a bi-weekly payment option but I'm not sure what that means. Which should I choose? I'm worried about my monthly budget."

---

**Output:**

## Loan Comparison Analysis

> **Assumptions made:** All rates are annual nominal rates compounded monthly. First National Bank origination fee ($500) is paid upfront and not financed into the loan. Prepayment penalty terms were not disclosed -- verification before signing is recommended for all three lenders. Bi-weekly option analyzed as a separate scenario for Direct Lender only (clarification on whether it is true or pseudo bi-weekly is recommended before selecting it).

---

### Loan Terms Summary
| Parameter              | First National Bank     | Meridian Credit Union   | Online Lender Direct    |
|------------------------|-------------------------|-------------------------|-------------------------|
| Face Amount            | $25,000                 | $25,000                 | $25,000                 |
| Stated Interest Rate   | 9.25%                   | 8.75%                   | 10.50%                  |
| Lender-Quoted APR      | Not provided            | 8.75%                   | 10.50%                  |
| Loan Term              | 48 months (4 yrs)       | 60 months (5 yrs)       | 36 months (3 yrs)       |
| Rate Type              | Fixed                   | Fixed                   | Fixed                   |
| Origination Fee        | $500 (2.0% of principal)| $0                      | $0                      |
| Other Fees             | None disclosed          | None disclosed          | None disclosed          |
| Fees Financed or Upfront| Upfront                | N/A                     | N/A                     |
| Prepayment Penalty     | Not disclosed -- verify | Not disclosed -- verify | Not disclosed -- verify |
| Payment Frequency      | Monthly                 | Monthly                 | Monthly                 |

---

### Monthly Payment Calculation Detail

**First National Bank:** P = $25,000, r = 9.25% ÷ 12 = 0.77083%/month, n = 48
- M = 25,000 × [0.007708 × (1.007708)^48] / [(1.007708)^48 -- 1]
- (1.007708)^48 = 1.44697
- M = 25,000 × [0.007708 × 1.44697] / [1.44697 -- 1]
- M = 25,000 × 0.011152 / 0.44697
- M = 25,000 × 0.024946 = **$624/month**

**Meridian Credit Union:** P = $25,000, r = 8.75% ÷ 12 = 0.72917%/month, n = 60
- M = 25,000 × [0.007292 × (1.007292)^60] / [(1.007292)^60 -- 1]
- (1.007292)^60 = 1.54097
- M = 25,000 × [0.007292 × 1.54097] / [0.54097]
- M = 25,000 × 0.011235 / 0.54097
- M = 25,000 × 0.020768 = **$519/month**

**Online Lender Direct:** P = $25,000, r = 10.50% ÷ 12 = 0.875%/month, n = 36
- M = 25,000 × [0.00875 × (1.00875)^36] / [(1.00875)^36 -- 1]
- (1.00875)^36 = 1.36983
- M = 25,000 × [0.00875 × 1.36983] / [0.36983]
- M = 25,000 × 0.011986 / 0.36983
- M = 25,000 × 0.032408 = **$810/month**

---

### Monthly Payment Comparison
| Metric                        | First National Bank | Meridian Credit Union | Online Lender Direct |
|-------------------------------|---------------------|-----------------------|----------------------|
| Monthly Payment               | $624                | $519                  | $810                 |
| vs. Lowest Payment Option     | +$105               | Lowest                | +$291                |
| Annual Payment Burden         | $7,488              | $6,228                | $9,720               |

---

### Total Cost of Borrowing
| Metric                        | First National Bank | Meridian Credit Union | Online Lender Direct |
|-------------------------------|---------------------|-----------------------|----------------------|
| Principal (face amount)       | $25,000             | $25,000               | $25,000              |
| Total Interest Paid           | $4,952              | $6,140                | $4,176               |
| Total Fees (all-in)           | $500                | $0                    | $0                   |
| **Total Amount Repaid**       | **$30,452**         | **$31,140**           | **$29,176**          |
| **Total Cost of Borrowing**   | **$5,452**          | **$6,140**            | **$4,176**           |
| vs. Cheapest Total Cost       | +$1,276             | +$1,964               | Cheapest             |
| Effective APR                 | 10.64%              | 8.75%                 | 10.50%               |
| Cost per $1,000 borrowed      | $218.08             | $245.60               | $167.04              |

**Effective APR note for First National Bank:** The stated rate is 9.25%, but the $500 upfront origination fee raises the effective APR. Using the IRR method: the lender receives $500 at closing but disburses only $24,500 net. Solving for the rate that equates $24,500 present value to 48 payments of $624 yields an effective monthly rate of 0.8867%, or an effective APR of approximately 10.64% -- a full 1.39 percentage points above the stated rate.

---

### Break-Even Analysis
| Metric                                          | First National Bank vs. Online Lender Direct |
|-------------------------------------------------|----------------------------------------------|
| Fee differential                                | $500 more for First National Bank            |
| Monthly payment: FNB vs. Direct                 | $624 vs. $810 (FNB is $186 cheaper/month)    |
| Break-even calculation                          | $500 ÷ $186 = 2.7 months                     |
| Loan term                                       | 48 months (FNB) vs. 36 months (Direct)       |
| Verdict                                         | Fee is trivial relative to payment difference |

Note: The break-even comparison above is between options with different terms, so the fee analysis is secondary to the term-driven payment and cost differences. The more meaningful break-even is between FNB (48 months, 9.25%, $500 fee) and a hypothetical no-fee version of FNB. Stripping the fee: without the $500 fee, FNB's effective APR would be 9.25% -- still higher than Meridian's 8.75% but for a shorter term. The fee costs FNB the effective-APR comparison against Meridian.

---

### Summary Scorecard
| Criterion                     | Winner                 | Margin                           |
|-------------------------------|------------------------|----------------------------------|
| Lowest monthly payment        | Meridian Credit Union  | $519/month ($105 less than FNB)  |
| Lowest total cost             | Online Lender Direct   | $4,176 total interest + $0 fees  |
| Lowest effective APR          | Meridian Credit Union  | 8.75%                            |
| Shortest payoff term          | Online Lender Direct   | 36 months (done 1 yr earlier)    |
| Lowest stated rate            | Meridian Credit Union  | 8.75%                            |
| Best rate after fee adjustment| Meridian Credit Union  | 8.75% effective (no fees)        |

---

### Tradeoff Analysis

**The core conflict:** The cheapest total-cost loan (Online Lender Direct at $4,176 in interest+fees) requires the highest monthly payment ($810). The lowest monthly payment option (Meridian Credit Union at $519/month) costs the most overall ($6,140 in interest). These two objectives cannot be satisfied by the same loan.

**Meridian Credit Union (lowest monthly payment, highest total cost):**
Monthly payment is $291 less than Direct and $105 less than First National Bank. However, the 60-month term means 24 extra payments compared to Direct, and those extra payments cost $1,964 in additional interest. That is the price of the lower monthly payment -- $1,964 spread over 24 months = $82 per month in hidden interest cost. The effective "discount" on the monthly payment is only $291 -- $82 = $209/month in genuine cash-flow relief.

**Online Lender Direct (highest monthly payment, lowest total cost):**
The 36-month term and 10.5% rate create the highest monthly burden ($810/month) but eliminate $1,964 in interest compared to Meridian. The loan is also fully repaid 12 months sooner than First National Bank and 24 months sooner than Meridian, freeing up cash flow after month 36.

**First National Bank (middle position, damaged by the fee):**
The 9.25% stated rate is competitive, but the $500 origination fee pushes the effective APR to 10.64% -- above Online Lender Direct's 10.5%. First National Bank is not the cheapest in any category after fee adjustment. It is outperformed on monthly payment by Meridian and outperformed on total cost by Direct.

**Bi-weekly payment scenario for Online Lender Direct:**
If the bi-weekly option is a true bi-weekly program (26 half-payments per year), you would make the equivalent of 13 full monthly payments per year instead of 12. For a 36-month loan at 10.5%, this effect is modest -- you would complete the loan in approximately 33 months instead of 36 and save approximately $310 in interest, reducing total cost to roughly $3,866. Confirm with the lender whether this is a true bi-weekly (funds applied immediately upon receipt) or a pseudo bi-weekly (funds held and applied monthly, potentially for a fee). If it is pseudo bi-weekly, there is no mathematical benefit.

---

### Decision Factors Beyond Cost

You mentioned concern about monthly budget -- this is the right thing to focus on alongside total cost. Use this framework:

- [ ] **Monthly cash flow test:** Can you absorb $810/month (Online Lender Direct) without straining essential expenses? If that figure causes cash-flow stress or eliminates your emergency fund contributions, the lower-cost loan may not be the right choice for your situation. $519/month (Meridian) provides the most breathing room.
- [ ] **24-month budget horizon:** If you expect your income to increase or a major expense to end within 24 months, the higher payment of Online Lender Direct may become comfortable mid-term -- in which case the total-cost savings of $1,964 argue for choosing it now.
- [ ] **Prepayment option:** If any of these lenders allows penalty-free prepayment, you could take Meridian's lower payment and make additional principal payments whenever cash flow allows -- functionally reducing the term and total interest without committing to the higher mandatory payment of Online Lender Direct. Verify this before deciding.
- [ ] **Origination fee cash position:** First National Bank requires $500 at closing. If that $500 depletes emergency savings or is money you do not currently have liquid, that is a practical disqualifier regardless of the rate math.
- [ ] **Lender reliability:** Verify all three lenders against CFPB complaint records and state licensing databases. Rate quotes are not binding until you have a signed Loan Estimate or Truth in Lending Disclosure (Regulation Z document). Get the final terms in writing before committing.
- [ ] **Tax considerations:** Personal loan interest is generally not tax-deductible. This comparison requires no tax adjustment, but confirm the use of proceeds does not qualify for any deduction (e.g., if funds are used for a home improvement on your primary residence, a home equity product might be more appropriate and potentially deductible -- consult a tax professional).

**Bottom line for your situation:** Given your stated budget concern, the decision is between Meridian Credit Union ($519/month, $6,140 total cost) for cash-flow protection and Online Lender Direct ($810/month, $4,176 total cost) for maximum interest savings. First National Bank is not competitive in either dimension after fee adjustment and can be deprioritized. The $1,964 difference in total cost is meaningful, but only if $810/month is genuinely sustainable. If there is any doubt about the $810/month affordability, Meridian's lower payment and the option to make extra principal payments when available may be the more prudent path.
