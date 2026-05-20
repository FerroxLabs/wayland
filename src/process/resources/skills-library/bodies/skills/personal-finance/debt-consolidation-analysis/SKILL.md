---
name: debt-consolidation-analysis
description: |
  Evaluates whether consolidating multiple debts into a single loan is mathematically advantageous. Compares the total cost of keeping debts separate versus consolidating by calculating total interest, monthly payments, and payoff timelines under both scenarios. Produces a side-by-side comparison with a clear recommendation framework.
  Use when the user asks about debt consolidation, combining debts, balance transfers, or whether a consolidation loan makes sense for their situation.
  Do NOT use for debt payoff sequencing (use debt-snowball-planner or debt-avalanche-planner), comparing new loan offers (use loan-comparison), or business debt restructuring.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "debt-management personal-finance analysis budgeting"
  category: "personal-finance"
  subcategory: "debt-management"
  depends: ""
  disclaimer: "educational-finance"
  difficulty: "intermediate"
---
# Debt Consolidation Analysis

> **Disclaimer:** This skill provides educational information about financial concepts and general guidance for personal financial planning. It does NOT constitute financial advice, investment recommendations, or tax guidance. Individual financial circumstances vary significantly -- debt consolidation involves real legal and financial commitments with lasting consequences. The information provided should not be relied upon as a substitute for professional counsel. Always consult a qualified financial advisor, certified financial planner (CFP), or licensed credit counselor before making significant debt decisions.

---

## When to Use

**Use this skill when:**
- The user has two or more debts with different interest rates and asks whether combining them into a single loan makes financial sense
- The user has received a specific consolidation loan offer (personal loan, home equity loan, HELOC, or balance transfer card) and wants a side-by-side cost comparison against keeping their debts separate
- The user is paying only minimums on multiple high-rate credit cards and wants to understand whether a lower-rate consolidation loan would save money over the payoff period
- The user asks specifically about a 0% balance transfer card offer and whether the transfer fee is worth the interest savings during the promotional period
- The user has recently experienced a credit score improvement and wants to know whether they now qualify for a lower-rate product that could reduce total debt cost
- The user is overwhelmed by multiple due dates and minimum payments and wants to evaluate the trade-off between simplification cost and mathematical efficiency
- The user wants to compare whether a debt management plan (DMP) offered by a nonprofit credit counseling agency is better or worse than a private consolidation loan
- The user has a mix of high-rate and moderate-rate debts and wants to identify which debts are worth consolidating versus which to leave alone

**Do NOT use when:**
- The user wants a sequenced payoff plan without consolidation -- use `debt-snowball-planner` or `debt-avalanche-planner`; those skills optimize payoff order for existing debts as-is
- The user wants to compare two or more new loan products unrelated to existing debt -- use `loan-comparison`
- The user needs a full budget built from income and expenses -- use `budget-planning`; consolidation analysis requires knowing what debts exist, not building a full financial picture
- The user has exclusively business debt -- use business finance restructuring skills; business debt involves entity liability, tax treatment, and creditor negotiation dynamics that are outside personal finance scope
- The user is asking whether to declare bankruptcy -- consolidation analysis is irrelevant when debts are not serviceable; redirect to credit counseling and legal consultation guidance
- The user's only debt is a mortgage or auto loan -- secured installment debt at standard market rates is almost never a candidate for consolidation; it has its own refinancing logic
- The user has already consolidated and now wants to pay it off faster -- use `debt-avalanche-planner` focused on the single consolidated loan

---

## Process

### Step 1: Gather Complete Current Debt Inventory

Before any math, collect precise data on every debt being evaluated. Missing or approximated inputs produce misleading comparisons.

- **Required for each debt:** Name or type (credit card, personal loan, medical debt, private student loan), current outstanding balance, annual percentage rate (APR), current minimum monthly payment, and remaining term in months (or the full original term if the debt is revolving)
- **For revolving debts (credit cards):** Ask whether the user is currently carrying a balance or paying in full monthly. Only debts carrying a month-to-month balance are consolidation candidates. A card paid in full monthly should be excluded from the analysis.
- **Ask about prepayment penalties:** Some personal loans and older student loans have prepayment penalties -- typically 1-3% of the remaining balance. These are real costs if the user plans to pay off a debt early by consolidating it.
- **Ask whether any debts are currently in collections or past due:** Past-due debts complicate consolidation because lenders may refuse to pay off accounts in collections directly, and settlement amounts differ from face value.
- **Calculate the weighted average APR immediately** after gathering debt data. This is the single most important benchmark for evaluating any consolidation offer. Formula: Sum(each balance × its APR) ÷ total balance. This represents the effective blended rate the user is currently paying across all debts.
- **Note any debts that are secured:** Mortgages, car loans, and home equity loans have collateral behind them. Flag these separately -- they behave differently and are generally not candidates for unsecured consolidation.
- **Ask about any pending rate changes:** Introductory rates on credit cards that are scheduled to increase, or variable-rate loans tied to an index, can change the "keep separate" math significantly.

### Step 2: Gather and Categorize the Consolidation Offer

Different consolidation vehicles have fundamentally different cost structures, risk profiles, and failure modes. Identify which type is being evaluated before calculating anything.

- **Unsecured personal loan:** Most common consolidation vehicle. Fixed rate, fixed term (typically 24-84 months), origination fee of 0-8% of loan amount depending on credit profile. The user takes the loan proceeds and pays off the individual debts. Rate range: 6-36% APR depending on credit score -- a borrower with a 750+ FICO score may qualify for 7-10%, while a 620-score borrower may see 20-28%, potentially higher than their current debts.
- **Balance transfer credit card (0% promotional):** The user transfers existing card balances to a new card with a promotional 0% APR period (typically 12-21 months). Balance transfer fee is almost always 3-5% of transferred amount, charged upfront. The critical question is whether the user can pay the full balance within the promo period. The standard APR after the promo period (often 19-29%) applies to any remaining balance.
- **Home equity loan or HELOC:** Secured by the user's home. Typically offers the lowest rate (often prime + 0.5-2%), but converts unsecured consumer debt to secured debt backed by the user's primary asset. A home equity loan is a fixed lump sum with fixed payments; a HELOC is a revolving line of credit with variable rate. Both require the user to have sufficient equity (generally lender requires at least 20% equity remaining post-withdrawal). Closing costs: typically $500-$2,500 or 2-5% of loan amount.
- **Debt management plan (DMP) via nonprofit credit counselor:** Not technically a loan. The agency negotiates reduced interest rates (often 6-10% on credit cards) and the user makes one monthly payment to the agency, which distributes to creditors. Setup fee: typically $25-75 one-time. Monthly fee: $25-55/month. Plans run 3-5 years. The user cannot use the enrolled cards during the plan period. Compare total DMP cost (reduced interest + all fees over plan duration) against the personal loan option.
- **For any offer, capture:** Total loan amount or transfer limit, APR (fixed or variable), loan term in months, monthly payment amount, ALL fees expressed in dollars (calculate percentage fees against the loan amount immediately), rate type (fixed/variable), if variable -- the index used (SOFR, Prime) and the margin, any promotional period and the post-promotional rate.

### Step 3: Calculate the "Keep Separate" Baseline -- Two Scenarios

The most common analytical mistake is comparing consolidation only against minimum payments. This makes consolidation look artificially better by using an intentionally suboptimal baseline. Always calculate both baselines.

- **Baseline A -- Minimum payments only:** Calculate the total interest paid and total months to payoff for each individual debt at its current minimum payment. For credit cards, minimum payments typically decline as the balance declines (most issuers set minimum at 1-2% of balance or $25-35, whichever is greater). Use a consistent minimum: either assume the current minimum is fixed for the life of the debt (a slight overestimate of time but computationally clean) or model the declining minimum (more accurate, but requires iterative calculation). Note which assumption you are using.
- **Baseline B -- Avalanche method at the consolidation loan's monthly payment amount:** This is the correct apples-to-apples comparison. Take the monthly payment that the consolidation loan would require (e.g., $220/month) and apply it to the existing debts using the avalanche method -- maximum payment to the highest-rate debt, minimums to all others, rolling the freed payment to the next highest rate as each debt is cleared. Calculate total interest paid and total months to payoff under this scenario.
- **Why Baseline B matters:** If the user could pay $220/month toward their debts anyway, they might not need the consolidation loan at all. If consolidation at $220/month beats the avalanche at $220/month, that is a genuine mathematical advantage. If it does not, consolidation is only valuable for simplification -- not savings.
- **Calculating interest for revolving debts without a fixed term:** Use the standard amortization formula or the iterative payment-by-payment approach. For a rough estimate, the formula for months to payoff is: n = -log(1 - (r × B)/P) ÷ log(1 + r), where B = current balance, P = monthly payment, r = monthly interest rate (APR ÷ 12). Total interest = (P × n) - B.
- **For the minimum payment scenario,** total interest is often 40-80% of the original balance for high-rate credit card debt. A $5,000 balance at 22% APR with minimum-only payments often takes 18-22 years and costs $5,000-$7,000 in interest alone. Making these numbers explicit is often the most valuable part of the analysis.

### Step 4: Calculate the Full Cost of Consolidation

Total cost of consolidation is NOT just the total interest paid on the new loan. Every fee is a real dollar cost that reduces the savings.

- **Total interest paid on the consolidation loan:** Use the standard amortization formula. For a fixed-rate installment loan: Monthly payment P = L × [r(1+r)^n] ÷ [(1+r)^n - 1], where L = loan amount, r = monthly rate, n = term in months. Total interest = (P × n) - L.
- **Origination fee:** Typically 1-8% of loan amount, deducted from loan proceeds at funding (meaning the user receives less than the face value) or added to the loan balance. A 3% origination fee on an $8,500 loan costs $255 -- this is money the user pays regardless of how quickly they pay off the loan. If the fee is added to the loan balance rather than deducted from proceeds, recalculate total interest on the higher principal.
- **Balance transfer fee:** Typically 3-5% charged upfront on the total transferred amount. On a $10,000 transfer at 3%, the user owes $10,300 on day one. This fee is effectively paying for the interest savings in advance.
- **Prepayment penalties on retired debts:** If any current debt has a prepayment penalty (1-3% of remaining balance), include that in the consolidation cost.
- **For a HELOC or home equity loan:** Include all closing costs -- appraisal ($300-$500), title search, origination fee, recording fees. These can total $1,000-$3,500 and only make sense if the total debt being consolidated is large enough to generate savings that exceed this threshold.
- **For balance transfers with promotional periods:** Calculate in two phases. Phase 1: balance × transfer fee (paid upfront). Phase 2 (if balance remains after promo): calculate interest on the remaining balance at the post-promo APR for the remaining months until payoff. Total cost = transfer fee + Phase 2 interest. If the user can reasonably pay off the full balance within the promo period, Phase 2 cost is $0 -- but flag explicitly what the required monthly payment would be to achieve this.
- **Total consolidation cost = Total interest + All fees + Any prepayment penalties on retired debts**

### Step 5: Build the Break-Even Analysis

The break-even point tells the user how many months of consolidation payments it takes to recoup the upfront fees. This is particularly important for balance transfer fees and origination fees.

- **Monthly savings** = Monthly interest accruing under "keep separate" scenario minus monthly interest accruing on the consolidation loan for the same month. In month 1, this is approximately: (weighted average APR ÷ 12) × total balance minus (consolidation APR ÷ 12) × loan amount.
- **Simple break-even** = Upfront fees ÷ monthly interest savings. If the origination fee is $255 and the user saves $80/month in interest, break-even is approximately month 4. If break-even is beyond month 12, flag it as a slow-recovering fee cost.
- **If the user might pay off the loan or move before the break-even point** -- for example, if they expect to receive a large payment, inherit money, or know they plan to refinance -- consolidation may not recover its fees in time.
- **For promotional balance transfers:** The break-even is not just about fees -- it is about whether the full balance can be eliminated before the post-promo rate kicks in. Calculate the required monthly payment to zero the balance by end of promo period: payment = (balance + transfer fee) ÷ promo months. Flag whether this is achievable given the user's budget.

### Step 6: Assess Qualitative and Risk Factors

The math tells one story. The behavioral and structural risks tell another. Both matter for a complete analysis.

- **Behavioral risk -- freed credit lines:** This is the single most common reason debt consolidation fails. When credit card balances are paid off by a consolidation loan, the credit lines remain open and available. Research on debt consolidation outcomes consistently shows that a meaningful percentage of consolidators (estimated 70% or more in some studies) accumulate new credit card debt within two years, ending up with both the consolidation loan AND new card balances. This must be flagged prominently, not buried. The concrete mitigation is to close the paid-off card accounts immediately -- or at minimum, freeze the cards physically or via the issuer's app. Note the credit score implication: closing accounts reduces total available credit and may temporarily lower the credit score by 10-30 points, which is an acceptable tradeoff for behavioral protection.
- **Secured vs. unsecured distinction:** If the consolidation vehicle is a home equity loan or HELOC, the user is pledging their home as collateral. Missing payments on a home equity product can result in foreclosure. This risk escalation -- from credit card debt (unsecured, worst outcome is collections and credit damage) to home equity debt (secured, worst outcome is losing the home) -- must be stated explicitly and prominently. This conversion is only appropriate when the interest savings are substantial AND the user has stable income.
- **Variable rate risk:** A variable-rate consolidation product tied to an index like SOFR or Prime can increase in cost if rates rise. For a 5-year loan, rates could shift by 2-4 percentage points over the term. Calculate the cost scenario if the rate increases by 2% over the loan term to illustrate the range of possible outcomes.
- **Loan term extension risk:** A consolidation loan that extends the payoff timeline significantly (e.g., replacing 3-year debts with a 7-year consolidation loan) can increase total interest paid even at a lower rate. Always compare total cost, not just monthly payment. Show the trade-off explicitly: "Monthly payment drops by $X, but total cost increases by $Y over the additional Z months."
- **Impact on credit score:** Applying for a new loan generates a hard inquiry (typically -5 to -10 points temporarily). Opening a new installment account changes the credit mix. However, if consolidation reduces total revolving utilization (the ratio of revolving balances to revolving limits), it can improve the credit score by 20-50 points within 1-3 billing cycles, since utilization is approximately 30% of FICO score weight. Model the likely utilization impact.

### Step 7: Synthesize and Present the Framework

Do not prescribe a decision. Present the complete analysis with explicit identification of which scenario is mathematically superior and which risk factors are present.

- **Identify the mathematical verdict clearly:** State whether consolidation costs less or more in total than the avalanche baseline. Use dollar amounts, not percentages. "$325 less in total cost than the avalanche method" is actionable. "Consolidation is better" is not.
- **Identify the simplification value explicitly:** Count the number of payments being eliminated. Reducing from 5 creditors to 1 has genuine administrative value -- fewer due dates, fewer login accounts, reduced risk of missed payments. This value is real but unquantifiable -- present it as a factor without assigning a dollar value.
- **State the key decision criteria in ranked order of importance:** (1) Is the consolidation rate genuinely lower than weighted average APR? (2) Does total cost beat the avalanche baseline? (3) Is the break-even within a reasonable timeframe? (4) Is the monthly payment manageable without straining the budget? (5) Is the user confident they will not accumulate new debt on freed credit lines?
- **Flag if consolidation is inappropriate:** If the consolidation APR is higher than the weighted average APR of current debts, consolidation is mathematically disadvantageous regardless of payment simplification. State this clearly.
- **Provide action steps for both paths** -- proceeding with consolidation and declining it. The user deserves useful next steps regardless of their choice.

---

## Output Format

```
## Debt Consolidation Analysis

> Disclaimer: This analysis is educational and does not constitute financial advice.
> All calculations are estimates based on inputs provided. Consult a qualified financial
> professional before making debt-related decisions.

---

### Current Debt Inventory

| Debt            | Type          | Balance    | APR    | Min. Payment | Remaining Term | Secured? |
|-----------------|---------------|-----------|--------|--------------|----------------|---------|
| [Debt name]     | [Credit card] | $X,XXX    | XX.X%  | $XXX         | ~XX months     | No      |
| [Debt name]     | [Personal]    | $X,XXX    | XX.X%  | $XXX         | XX months      | No      |
| [Debt name]     | [Medical]     | $X,XXX    | XX.X%  | $XXX         | XX months      | No      |
| **Total**       |               | **$XX,XXX** |      | **$XXX**     |                |         |

**Weighted Average APR:** XX.X%
*(Calculated as: sum of each balance × its APR, divided by total balance)*

---

### Consolidation Vehicle Details

| Detail                          | Value                    |
|---------------------------------|--------------------------|
| Vehicle type                    | [Personal loan / Balance transfer / Home equity / DMP] |
| Loan amount / Transfer limit    | $XX,XXX                  |
| APR                             | XX.X%                    |
| Rate type                       | [Fixed / Variable (Index + Margin)] |
| Term                            | XX months                |
| Monthly payment                 | $XXX                     |
| Origination / transfer fee      | $XXX (X.X% of balance)   |
| Other fees (closing, etc.)      | $XXX                     |
| **Total upfront fees**          | **$XXX**                 |
| Promotional period (if any)     | XX months at 0% / N/A    |
| Post-promotional APR            | XX.X% / N/A              |

---

### Cost Comparison -- Three Scenarios

All three scenarios evaluated at the same monthly payment total: **$XXX/month**

| Scenario                        | Total Interest | Total Fees | **Total Cost** | Months to Payoff |
|---------------------------------|---------------|-----------|----------------|-----------------|
| Keep separate -- minimums only  | $X,XXX        | $0        | **$X,XXX**     | ~XX months      |
| Keep separate -- avalanche      | $X,XXX        | $0        | **$X,XXX**     | ~XX months      |
| **Consolidate**                 | **$X,XXX**    | **$XXX**  | **$X,XXX**     | **XX months**   |

*Avalanche scenario applies $XXX/month to debts in rate order: [highest-rate debt first]*
*Minimum payments scenario assumes current minimums held constant*

---

### Savings Analysis vs. Each Baseline

| Metric                               | vs. Minimums  | vs. Avalanche |
|--------------------------------------|--------------|---------------|
| Interest difference                  | Save $X,XXX  | Save / Pay $XXX |
| Fee cost of consolidation            | ($XXX)       | ($XXX)        |
| **Net savings / (cost)**             | **$X,XXX**   | **$XXX**      |
| Monthly interest savings (month 1)   | $XXX/month   | $XXX/month    |
| Break-even point (fees recovered)    | Month XX     | Month XX      |
| Months remaining after break-even    | XX months    | XX months     |

---

### Monthly Cash Flow Comparison

| Scenario                         | Monthly Payment | Delta vs. Current |
|----------------------------------|----------------|-------------------|
| Current total (all minimums)     | $XXX           | baseline          |
| Consolidation loan payment       | $XXX           | +/- $XXX          |
| Avalanche at same payment level  | $XXX           | Same              |

*If consolidation payment is lower than current minimums: extra $XXX/month freed for other goals*
*If consolidation payment is higher than current minimums: user must budget for the increase*

---

### Risk Register

| Risk Factor                          | Level           | Details                                                |
|--------------------------------------|----------------|--------------------------------------------------------|
| Rate structure                       | [Low/Med/High]  | Fixed = Low; Variable tied to [index] = Med-High       |
| Freed credit lines -- new spending   | [Med/High]      | $XX,XXX in card credit freed; close cards to mitigate  |
| Collateral risk                      | [Low/High]      | Unsecured = Low; Home equity = High (foreclosure risk) |
| Promotional rate expiration          | [N/A/Med/High]  | Post-promo rate: XX%; requires $XXX/month to clear     |
| Extended term -- higher total cost   | [Low/Med/High]  | Term extends by XX months; adds $XXX total interest    |
| Prepayment penalties on old debts    | [None/$XXX]     | [Debt name] has X% prepayment penalty = $XXX           |
| Credit score impact                  | Temporary -XX pts | Hard inquiry + new account; offset by lower utilization |

---

### Decision Criteria Checklist

**Mathematical factors (check each that applies):**
- [ ] Consolidation APR (XX.X%) is LOWER than weighted average APR (XX.X%) -- primary test
- [ ] Total consolidation cost ($X,XXX) is LESS than avalanche cost ($X,XXX) -- apples-to-apples test
- [ ] Break-even point (month XX) falls before the midpoint of the loan term (month XX)
- [ ] Monthly consolidation payment ($XXX) is manageable within the current budget
- [ ] If promotional balance transfer: full balance clearable within promo period at $XXX/month

**Risk factors (check each that applies):**
- [ ] One or more freed credit lines will remain open (behavioral risk present)
- [ ] Consolidation vehicle is secured by an asset (elevated collateral risk)
- [ ] Loan term is variable rate (rate increase risk present)
- [ ] Consolidation extends total payoff timeline by more than 12 months
- [ ] Fees exceed 50% of projected interest savings

---

### Mathematical Verdict

**Consolidation vs. Minimum Payments:** [Saves / Costs] approximately $X,XXX
**Consolidation vs. Avalanche Method:** [Saves / Costs] approximately $XXX
**Primary driver of [savings/cost]:** [Lower rate / Fees / Extended term / Rate type]
**Consolidation is mathematically:** [Clearly favorable / Marginally favorable / Neutral / Unfavorable]

---

### Recommendation Framework

[Present the complete picture: the mathematical outcome, the most significant risk factors present,
and the key behavioral requirement if the user proceeds. Do NOT prescribe a choice.
State what the math shows, what the risks are, and what the user must do to make consolidation
work IF they choose to proceed. End with two clear action paths.]

---

### Action Path A: If Proceeding with Consolidation
- [ ] Obtain all loan terms in writing; verify APR, term, and all fees match the offer discussed
- [ ] Confirm whether origination fee is deducted from proceeds or added to balance (affects calculation)
- [ ] Close or freeze credit card accounts immediately upon payoff -- do not leave lines open
- [ ] Set up autopay to prevent late fees and rate penalty triggers
- [ ] Note the loan payoff date: [Month, Year] -- schedule a calendar reminder
- [ ] Do not open new revolving credit during the payoff period
- [ ] If variable rate: set a calendar reminder to review the rate every 6 months

### Action Path B: If Not Proceeding
- [ ] Apply the avalanche method using $XXX/month across current debts (see `debt-avalanche-planner`)
- [ ] Target [highest-rate debt] first at rate XX.X%, then [next debt] at XX.X%
- [ ] Revisit consolidation options in 6 months if credit score improves
- [ ] Consider a nonprofit credit counseling DMP if interest rate reduction is the primary goal
```

---

## Rules

1. **Always calculate the weighted average APR before evaluating any consolidation offer.** The weighted average is the only valid benchmark for the consolidation rate. Comparing the consolidation rate to the highest individual debt rate overstates the benefit; comparing it to the lowest rate understates it.

2. **Always compare consolidation to the avalanche method at the same monthly payment -- not only to minimum payments.** Comparing consolidation only to minimum payments is a form of false advertising that makes any consolidation look better than it is. The avalanche baseline is the honest comparison: it asks "could the user achieve similar savings without consolidating?"

3. **Include every fee in the total consolidation cost.** Origination fees, balance transfer fees, prepayment penalties on retired debts, and closing costs on home equity products are all real dollar costs. Never present interest savings without netting out fees. A consolidation that saves $600 in interest but costs $500 in fees saves $100 net -- not $600.

4. **Never present a monthly payment reduction as a benefit without also presenting the total cost impact.** A lower monthly payment is meaningless or harmful if it is achieved by extending the loan term such that total interest increases. Always show both monthly payment AND total cost in every comparison scenario.

5. **For any variable-rate consolidation product, calculate a stress scenario at +2% APR.** Variable rates tied to SOFR or Prime can and do increase. A HELOC at 7.5% that rises to 9.5% over five years changes the cost analysis substantially. The user must see both the base case and the stressed case before deciding.

6. **Flag the behavioral risk of freed credit lines as a primary risk, not a footnote.** This is not a minor consideration -- it is the most common failure mode for debt consolidation. State it clearly in the Risk Register with a dollar amount: "If you carry a $5,000 average balance on the freed cards at 22% APR, you will owe $1,100/year more in interest on top of your consolidation payment." The mitigation (closing the accounts) must accompany the risk.

7. **If the consolidation vehicle is secured by real property (home equity loan or HELOC), state explicitly that the user is converting unsecured debt to secured debt.** This must appear as a prominent standalone statement, not embedded in a table. Credit card debt is unsecured -- the worst outcome for non-payment is collections and credit damage. Home equity debt non-payment can result in foreclosure. A user who cannot make payments has far better options with unsecured debt.

8. **For balance transfer offers, calculate the required monthly payment to zero the balance within the promotional period.** If the user cannot reasonably meet that payment, the post-promotional rate applies to the remaining balance. A 0% balance transfer that ends with a $4,000 balance at 26.99% APR was not a good deal. Calculate the post-promo interest on the estimated remaining balance.

9. **Do not include secured installment debts (mortgage, auto loan) in the consolidation calculation unless the user explicitly requests it.** These debts typically have rates below the consolidation loan rate, have specialized treatment, and are not candidates for unsecured consolidation. Including them inflates the "total debt" figure and distorts the weighted average APR calculation.

10. **If the consolidation APR is higher than the weighted average APR of current debts, state this clearly as a mathematical disqualifier.** The user may still choose to consolidate for simplification, but they must understand they are paying a premium for that simplicity. Calculate the simplification cost explicitly: "Consolidation at XX.X% costs approximately $XXX more than the avalanche method -- this is the dollar cost of consolidating to one payment."

11. **Never recommend specific lenders, financial institutions, or branded credit products.** Describe product types (personal loan, balance transfer card, HELOC) and rate ranges based on credit profile, not specific products or issuers.

12. **When a user cannot provide exact remaining term for a revolving debt, calculate it using the standard formula** and state the assumption used. Do not skip this calculation or leave it as "unknown" -- an estimated term based on current balance, APR, and minimum payment is far more useful than a blank.

---

## Edge Cases

### Consolidation APR Is Higher Than Weighted Average APR
The consolidation offer fails the primary mathematical test. State the verdict directly: "The consolidation APR of XX.X% is higher than your weighted average APR of XX.X%. Consolidating at this rate will cost more in total interest than the avalanche method." Calculate the exact additional cost. The only remaining argument for consolidation is simplification -- trading dollars for convenience. Quantify that trade-off: "Consolidation would cost approximately $XXX more than the avalanche method, which is the dollar cost of having one payment instead of [N] payments." Present this tradeoff factually and let the user decide. Do not recommend consolidation in this scenario without explicitly flagging the mathematical cost.

### 0% Promotional Balance Transfer Offer
This is a specialized case that requires phase-by-phase analysis rather than a single APR calculation. Phase 1: Calculate the transfer fee (typically 3-5% of transferred amount). Phase 2: Determine the required monthly payment to eliminate the full balance (including the transfer fee) within the promotional period -- this is: (balance + transfer fee) ÷ promo months. Phase 3: If the user cannot make that payment, calculate estimated remaining balance at promo expiration and apply the post-promotional APR (often 19-29%) for the remaining payoff period. Total cost = transfer fee + post-promo interest. Compare this total to the avalanche method. Key flag: If the user currently has a credit score below approximately 680, they may not qualify for the best 0% offers or may face a lower transfer limit than their total balance -- ask about credit score and transfer limit. Also note that balance transfers typically cannot be used to pay off a card from the same issuer.

### Highly Dominant Single Debt (One Debt Is 75%+ of Total Balance)
When one debt accounts for 75% or more of the total balance, the weighted average APR is heavily influenced by that single debt's rate, and consolidation is essentially about replacing that one debt with a new loan. The analysis simplifies significantly -- compare the consolidation rate directly to the dominant debt's rate and note that the smaller debts are almost irrelevant to the outcome. If the dominant debt already has a rate below the consolidation rate (for example, an existing personal loan at 14% APR is the dominant debt), consolidation is particularly unlikely to save money. Highlight this efficiency: "Your [debt name] at $X,XXX comprises XX% of your total balance at XX% APR. Consolidation primarily needs to beat this rate -- the smaller debts have limited impact on the outcome."

### Debt Management Plan (DMP) as the Consolidation Alternative
A nonprofit credit counseling DMP is fundamentally different from a consolidation loan -- it is not new credit. The agency negotiates reduced interest rates directly with creditors (often achieving 6-10% on credit cards versus original 18-28% rates) and the user pays the agency one monthly amount distributed to creditors. Calculate DMP cost as: total interest across all enrolled debts at the negotiated rate + total monthly fees over the plan duration (typically $25-55/month × 36-60 months = $900-$3,300 in fees). Compare this against both the personal loan consolidation and the avalanche method. Key advantages of DMP: no new loan application (no credit impact from inquiry), creditors accept the plan even with damaged credit, and the structured nature of the plan limits behavioral risk (you cannot use the enrolled cards). Key disadvantage: enrolled cards are closed or frozen for the duration, which temporarily impacts credit score. DMPs are often the best option when the user's credit score is too damaged to qualify for a meaningful rate reduction via personal loan.

### Consolidation Loan Term Significantly Longer Than Current Debts
This is common when a user's current debts are 2-3 years from payoff but the consolidation offer is for 5-7 years. Even at a meaningfully lower rate, extending the term can increase total interest paid. Example: $8,000 at 22% APR with 30 months remaining costs approximately $2,900 in total interest at current trajectory. A consolidation loan at 12% APR over 60 months costs approximately $2,750 in interest -- only $150 less despite a 10 percentage point rate reduction. Show this arithmetic explicitly: "The lower rate saves $XXX in interest per year, but the longer term means you pay that lower rate for XX more months -- the net effect is [savings/cost] of $XXX." The monthly payment will be lower, but this is achieved by stretching the timeline, not by genuine cost reduction.

### Mix of Secured and Unsecured Debts
If the user lists a mix of secured debts (mortgage at 4.5%, car loan at 6.5%) and unsecured debts (credit cards at 19-24%), isolate the two groups immediately. Explain that secured debts at standard market rates should not be included in the consolidation analysis for two reasons: (1) their rates are typically below what an unsecured personal loan would offer, so including them would increase the weighted average APR calculation and make consolidation look less effective than it is, and (2) they have their own refinancing mechanisms (mortgage refinance, auto loan refinance) with specific qualification criteria. Run the analysis using only the unsecured debts. If the user specifically wants to include a car loan or other secured debt, note clearly that doing so via a personal loan converts secured debt to unsecured debt (which is actually a risk reduction, but may not save money given the typically lower rates on auto loans).

### User Has Already Consolidated Once and Is Back in Credit Card Debt
This is the behavioral failure mode in action. The user previously consolidated, did not close the freed credit cards, accumulated new balances, and is now considering consolidating again. This pattern is the strongest possible indicator of behavioral risk. Do not refuse to run the analysis -- run it fully. But add a prominent behavioral assessment section: "You have consolidated credit card debt previously. The most important factor in this analysis is not the math -- it is addressing the spending pattern that led to new card debt after the last consolidation. A second consolidation provides no mathematical benefit if the same pattern recurs." Suggest: (1) closing all credit card accounts permanently before consolidating, (2) considering a DMP which prevents card use as a structural constraint, (3) addressing budget deficits that may be driving the card spending.

### Partial Consolidation -- Consolidating Only Some Debts
The consolidation offer may not cover all debts (the loan limit is lower than total balance) or it may only be mathematically worthwhile to consolidate the highest-rate debts. Run the analysis with only the debts that will be consolidated and recalculate the weighted average APR of the remaining unconsolidated debts separately. Present two post-consolidation scenarios: (1) the consolidated loan payment plus minimum payments on remaining debts, and (2) the consolidated loan payment plus an accelerated payoff on remaining debts. Note that partial consolidation still reduces payment count, but by less than full consolidation.

---

## Example

**Input:** "I have three credit cards: Card A with $4,500 at 22% APR, minimum payment $125. Card B with $2,800 at 18% APR, minimum payment $80. Card C with $1,200 at 24% APR, minimum payment $40. I was offered a personal loan to consolidate all three: $8,500 at 11% fixed APR for 48 months. They told me the monthly payment would be $220 and there's a 3% origination fee. Should I consolidate?"

**Output:**

## Debt Consolidation Analysis

> Disclaimer: This analysis is educational and does not constitute financial advice. All figures are estimates based on inputs provided. Consult a qualified financial professional before making debt decisions.

---

### Current Debt Inventory

| Debt      | Type        | Balance    | APR   | Min. Payment | Est. Remaining Term | Secured? |
|-----------|-------------|-----------|-------|--------------|---------------------|---------|
| Card A    | Credit card | $4,500    | 22.0% | $125         | ~58 months          | No      |
| Card B    | Credit card | $2,800    | 18.0% | $80          | ~52 months          | No      |
| Card C    | Credit card | $1,200    | 24.0% | $40          | ~46 months          | No      |
| **Total** |             | **$8,500** |       | **$245**     | ~58 months (longest)| No      |

**Weighted Average APR:** 20.7%
*Calculation: (($4,500 × 22%) + ($2,800 × 18%) + ($1,200 × 24%)) ÷ $8,500 = ($990 + $504 + $288) ÷ $8,500 = $1,782 ÷ $8,500 = 20.97%, rounded to 20.7%*

All three debts are unsecured consumer revolving debt -- all three are appropriate consolidation candidates.

---

### Consolidation Vehicle Details

| Detail                       | Value                    |
|------------------------------|--------------------------|
| Vehicle type                 | Unsecured personal loan  |
| Loan amount                  | $8,500                   |
| APR                          | 11.0%                    |
| Rate type                    | Fixed                    |
| Term                         | 48 months                |
| Monthly payment              | $220.49 (~$220)          |
| Origination fee              | $255 (3.0% of $8,500)    |
| Other fees                   | None stated              |
| **Total upfront fees**       | **$255**                 |
| Promotional period           | None                     |
| Post-promotional APR         | N/A                      |

*Note: Verify with lender whether the $255 origination fee is deducted from proceeds (meaning $8,245 is disbursed to pay off $8,500 in debts -- leaving a $255 shortfall) or added to the loan balance (making the effective principal $8,755 with slightly higher total interest). The analysis below assumes the fee is a direct cost paid separately, and the full $8,500 in debts is retired.*

---

### Cost Comparison -- Three Scenarios

All three scenarios evaluated at the same effective monthly outflow: **$245/month** (current total minimums).
For the consolidation scenario, the payment is $220 -- $25/month LESS than current minimums.

#### Scenario A: Keep Separate -- Minimum Payments Only ($245/month total, declining minimums)
Using standard iterative calculation with minimums approximately fixed at current amounts:
- Card A ($4,500, 22% APR, $125/month): ~58 months, ~$2,785 interest
- Card B ($2,800, 18% APR, $80/month): ~52 months, ~$1,300 interest
- Card C ($1,200, 24% APR, $40/month): ~46 months, ~$595 interest
- **Total interest (minimum payments): ~$4,680 | Total months: ~58 | Total cost: ~$4,680**

#### Scenario B: Keep Separate -- Avalanche Method at $245/month
Apply $245/month total: minimums to all debts, extra $0 (minimums already sum to $245) -- since total minimums equal $245, the avalanche at $245/month is essentially the same as minimum payments in the first month. However, as lower-balance debts clear, freed minimum payments roll to higher-rate debts.

*Refined avalanche at $245/month fixed:*
- Priority order: Card C (24%) → Card A (22%) → Card B (18%)
- Card C clears in ~36 months using $40/month minimum, but with freed payments from other cleared debts rolling in, this accelerates
- Running the iterative avalanche calculation at constant $245/month total:
  - Card C ($1,200, 24%, gets $40 min + any freed funds): clears ~month 34
  - Card A ($4,500, 22%, gets $125 + freed from C after month 34): clears ~month 48
  - Card B ($2,800, 18%, gets $80 + freed from C and A): clears ~month 58
- **Total interest (avalanche at $245/month): ~$3,490 | Total months: ~58 | Total cost: ~$3,490**

*Note: The avalanche only modestly beats minimum payments here because total monthly payment ($245) barely exceeds total minimums ($245) -- there is almost no surplus to accelerate with. The real difference would emerge if the user could pay more than minimums.*

#### Scenario C: Consolidate at $220/month for 48 Months
- Total interest: ($220 × 48) - $8,500 = $10,560 - $8,500 = **$2,060**
- Origination fee: **$255**
- **Total cost: $2,060 + $255 = $2,315 | Total months: 48**

---

### Cost Comparison Summary Table

| Scenario                        | Total Interest | Total Fees | **Total Cost** | Months to Payoff |
|---------------------------------|---------------|-----------|----------------|-----------------|
| Keep separate -- minimums only  | ~$4,680       | $0        | **~$4,680**    | ~58 months      |
| Keep separate -- avalanche      | ~$3,490       | $0        | **~$3,490**    | ~58 months      |
| **Consolidate at 11% fixed**    | **~$2,060**   | **$255**  | **~$2,315**    | **48 months**   |

---

### Savings Analysis

| Metric                                   | vs. Minimums  | vs. Avalanche |
|------------------------------------------|--------------|---------------|
| Interest difference                      | Save ~$2,620 | Save ~$1,430  |
| Fee cost of consolidation                | ($255)       | ($255)        |
| **Net savings**                          | **~$2,365**  | **~$1,175**   |
| Month 1 interest savings (vs. avg rate)  | ~$70/month   | ~$70/month    |
| Break-even point (fees ÷ monthly savings)| ~Month 4     | ~Month 4      |
| Months remaining after break-even        | 44 months    | 44 months     |

*The $255 origination fee is recovered within approximately 4 months of monthly interest savings (~$70/month × 4 = $280). This is an exceptionally fast break-even.*

---

### Monthly Cash Flow Comparison

| Scenario                         | Monthly Payment | Delta vs. Current |
|----------------------------------|----------------|-------------------|
| Current total minimums           | $245           | baseline          |
| Consolidation loan payment       | $220           | **-$25/month**    |
| Avalanche at $245/month          | $245           | Same              |

*Consolidation reduces monthly payment by $25. This is a modest cash flow benefit. However, the more significant benefit is the total cost reduction of ~$1,175 versus the avalanche and ~$2,365 versus minimums. The monthly payment comparison understates the advantage.*

---

### Risk Register

| Risk Factor                          | Level    | Details                                                                   |
|--------------------------------------|---------|---------------------------------------------------------------------------|
| Rate structure                       | **Low** | Fixed at 11% for 48 months -- no rate increase risk                       |
| Freed credit lines -- new spending   | **High**| $8,500 in card credit lines freed; Cards A, B, C remain open             |
| Collateral risk                      | **Low** | Unsecured personal loan -- no asset at risk; worst case is credit damage  |
| Promotional rate expiration          | **N/A** | No promotional period                                                     |
| Extended term vs. current debts      | **Low** | Consolidation pays off in 48 months vs. ~58 months under minimums -- shorter |
| Prepayment penalties on old debts    | **None**| No penalties reported                                                     |
| Credit score impact                  | Minimal | Hard inquiry (-5 to -10 pts temporarily); utilization drop may offset     |

**Critical behavioral risk detail:** Upon consolidation, Cards A, B, and C will have combined available credit of approximately $8,500+. If you carry even a moderate balance on these cards after consolidation -- say $3,000 at an average of 21.3% APR -- that adds ~$640/year in new interest on top of your $220 consolidation payment. Within 18 months you would have erased the financial benefit of consolidation entirely.

---

### Decision Criteria Checklist

**Mathematical factors:**
- [x] Consolidation APR (11.0%) is LOWER than weighted average APR (20.7%) -- 9.7 percentage points lower
- [x] Total consolidation cost ($2,315) is LESS than avalanche cost ($3,490) -- saves ~$1,175
- [x] Break-even point (month 4) falls well before the midpoint of the loan term (month 24)
- [x] Monthly consolidation payment ($220) is lower than current minimums ($245) -- reduces cash flow pressure
- [ ] Balance transfer promotional period: N/A

**Risk factors:**
- [x] Three freed credit lines will remain open -- behavioral risk is present and elevated
- [ ] Consolidation vehicle is secured by an asset -- NOT present (unsecured loan)
- [ ] Variable rate -- NOT present (fixed rate)
- [ ] Consolidation extends total payoff timeline -- NOT present (shorter: 48 vs. 58 months)
- [ ] Fees exceed 50% of projected savings -- NOT present ($255 fees vs. ~$1,175+ savings)

---

### Mathematical Verdict

**Consolidation vs. Minimum Payments:** Saves approximately **$2,365 net** (after fees)
**Consolidation vs. Avalanche Method:** Saves approximately **$1,175 net** (after fees)
**Primary driver of savings:** Lower rate (11% vs. 20.7% weighted average) -- 9.7 percentage point spread
**Term impact:** Consolidation is 10 months SHORTER than minimum payments -- no term extension penalty
**Consolidation is mathematically:** **Clearly favorable on all criteria**

Every mathematical test favors consolidation: the rate is substantially lower, total cost beats even the optimized avalanche method, the term is shorter, and the upfront fee is recovered in four months. The 9.7 percentage point rate reduction on $8,500 generates meaningful savings across a 48-month term.

---

### Recommendation Framework

The math makes a strong case for this consolidation: the 11% fixed rate represents a 9.7 percentage point reduction from your weighted average APR of 20.7%, the $255 origination fee is recovered in approximately four months, and you will be debt-free two to ten months sooner than under the keep-separate scenarios. On purely financial grounds, this consolidation offer is well-structured.

The one significant concern is behavioral, not mathematical. Once Cards A, B, and C are paid off, they will have open credit lines available. The most common way consolidation fails is not through bad math -- it is through accumulating new card balances after consolidation, ending up with both a consolidation loan and new credit card debt. If you close or freeze all three cards immediately upon consolidation, you eliminate this risk structurally. If you believe you may use the freed credit lines for new purchases, the consolidation will not achieve its financial purpose.

Two clear paths forward are outlined below.

---

### Action Path A: If Proceeding with Consolidation
- [ ] Obtain the full loan agreement in writing; confirm 11% fixed APR, 48-month term, $220.49 monthly payment, and 3% origination fee ($255)
- [ ] Confirm with the lender whether the $255 fee is deducted from disbursement or added to the balance -- if added, recalculate total cost
- [ ] Request that loan proceeds be disbursed directly to Card A, Card B, and Card C issuers (many personal loan lenders offer direct payoff as a service)
- [ ] **Close or request account closure for Cards A, B, and C immediately after payoff** -- do not leave them open; accept the temporary minor credit score impact as worthwhile protection
- [ ] Set up autopay for the $220 consolidation payment before the first due date -- a single missed payment on a personal loan can trigger penalty rates and late fees
- [ ] Note your debt-free date: 48 months from the loan origination date. Set a calendar reminder.
- [ ] The $25/month freed up versus current minimums can be directed to an emergency fund or applied as extra principal to retire the loan faster

### Action Path B: If Not
