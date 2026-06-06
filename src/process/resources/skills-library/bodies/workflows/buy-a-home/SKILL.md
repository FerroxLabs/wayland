---
name: buy-a-home
description: |
  Guides the user through the complete home-buying process from financial
  preparation through closing and move-in, chaining budgeting, credit,
  mortgage, inspection, and legal skills across multiple categories.
  Use when the user wants to buy a house, purchase a home, or navigate the
  home-buying process end to end.
  Do NOT use for refinancing an existing mortgage, investment property
  analysis, or commercial real estate purchases.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "home-buying personal-finance planning checklist step-by-step"
  category: "life-event"
  depends: "budget-planning credit-score-improvement mortgage-comparison home-buying-checklist contract-basics-explainer home-safety-inspection lease-agreement-reviewer moving-checklist"
  disclaimer: "educational-finance"
  difficulty: "advanced"
---

# Buy a Home

This workflow references personal finance skills for educational purposes only. It is not financial advice. Consult a qualified financial advisor before making major financial commitments.

This workflow references legal literacy skills. It is not legal advice. Consult appropriate professionals for legal matters in your jurisdiction.

**Estimated time:** 3-9 months (depending on local market conditions and mortgage pre-approval timeline)

**Geographic variation note:** Steps 3, 5, 6, and 7 vary significantly by country, state, and local jurisdiction. Property transfer laws, closing customs, inspection requirements, and tax implications differ across regions. Research your local requirements before beginning those steps.

## When to Use

- User wants to buy their first home or purchase a new primary residence
- User needs a structured, end-to-end process for navigating the home-buying journey
- User wants to understand the financial, legal, and logistical phases of purchasing a home
- Do NOT use when: refinancing an existing mortgage, evaluating investment properties, or purchasing commercial real estate

## Prerequisites

Before starting this workflow, ensure:

1. Stable income source verified (at least 2 years of employment history for most lenders)
2. General awareness of the geographic area where you want to purchase
3. Rough timeline established (urgent relocation vs. planned purchase within 6-12 months)
4. Access to recent financial documents: pay stubs, tax returns, bank statements

## Steps

**Step 1: Establish Your Home-Buying Budget** (uses: budget-planning)

Build a dedicated home-buying budget that accounts for down payment savings, closing costs, ongoing mortgage payments, property taxes, insurance, and maintenance reserves. This step establishes the financial boundaries that govern every subsequent decision.

- Input: Current income, existing debts, monthly expenses, savings balance, target down payment percentage
- Output: Maximum affordable monthly housing payment, total down payment target, closing cost reserve estimate, monthly maintenance budget
- Key focus: Separate the "what a lender will approve" number from the "what you can comfortably afford" number. Factor in property taxes and insurance, which are often 20-40% on top of the mortgage payment.

**Step 2: Improve Your Credit Position** (uses: credit-score-improvement)

Optimize your credit score before applying for mortgage pre-approval. Even a 20-point improvement can shift your interest rate by 0.25-0.5%, which translates to thousands of dollars over a 30-year mortgage.

- Input: Current credit score, credit report details, timeline until mortgage application
- Output: Prioritized action list for credit improvement, estimated score improvement timeline, items to dispute or resolve
- Key focus: Prioritize actions by impact-per-month since mortgage timeline is fixed. Avoid opening new credit lines or making large purchases that increase debt-to-income ratio.

**Step 3: Compare Mortgage Options** (uses: mortgage-comparison)

Evaluate mortgage products across lenders using the budget from Step 1 and the credit profile from Step 2. Compare fixed vs. adjustable rates, conventional vs. government-backed loans, and varying term lengths.

- Input: Budget constraints from Step 1, credit score from Step 2, property type and location preferences
- Output: Ranked lender comparison with APR, monthly payment, total cost, and pre-approval letters from top 2-3 lenders
- Key focus: Compare total cost of the loan (not just monthly payment). Factor in PMI if down payment is below 20%. Get pre-approved, not just pre-qualified, as pre-approval carries more weight in competitive markets.

**Step 4: Execute the Home Search** (uses: home-buying-checklist)

Systematically search for properties using the budget ceiling from Step 1 and the pre-approval from Step 3. Use the checklist to evaluate each property against your must-have criteria, nice-to-have preferences, and deal-breakers.

- Input: Pre-approval amount from Step 3, location preferences, property requirements (bedrooms, square footage, lot size, school district)
- Output: Shortlisted properties with evaluation scores, showing notes, and comparison matrix
- Key focus: Distinguish must-haves from nice-to-haves before touring properties. Track showing feedback systematically. Set a maximum number of properties to view before making an offer to avoid analysis paralysis.

**Step 5: Review the Purchase Contract** (uses: contract-basics-explainer)

Understand the key clauses, contingencies, and obligations in the purchase agreement before signing. This step translates legal language into decision-relevant information.

- Input: Draft purchase agreement or offer template from your agent, state-specific contract requirements
- Output: Annotated contract with flagged clauses, list of contingencies to include (inspection, financing, appraisal), negotiation points identified
- Key focus: Ensure inspection contingency, financing contingency, and appraisal contingency are included. Understand earnest money deposit terms and conditions under which it is refundable. Identify any unusual clauses or seller-favorable terms.

**Step 6: Inspect the Property** (uses: home-safety-inspection)

Conduct a thorough property inspection to identify safety issues, structural problems, and maintenance needs that affect the purchase decision or negotiation position.

- Input: Property access, inspection contingency timeline from Step 5 contract
- Output: Categorized inspection findings (safety critical, major repair, minor maintenance, cosmetic), estimated repair costs, items for seller negotiation
- Key focus: Focus on structural, electrical, plumbing, HVAC, and roof condition. Distinguish between issues that are deal-breakers, issues that justify price reduction, and issues that are normal maintenance. Get specialist inspections for any red flags (foundation, termite, radon, mold).

**Step 7: Finalize Financing and Review Closing Documents** (uses: lease-agreement-reviewer)

Review the closing disclosure, loan documents, and title documents before the closing date. This step uses document-review skills to ensure the final terms match what was agreed upon during the mortgage process.

- Input: Closing disclosure from lender, title report, final loan documents, terms agreed in Step 3
- Output: Verified closing cost breakdown, confirmed loan terms match pre-approval, flagged discrepancies, list of documents to bring to closing
- Key focus: Compare the closing disclosure against the loan estimate from Step 3. Verify interest rate, loan amount, closing costs, and escrow amounts. Flag any new fees or changed terms. Confirm title is clear and title insurance is in place.

**Step 8: Execute the Move** (uses: moving-checklist)

Plan and execute the physical move into the new home, coordinating logistics, utilities, address changes, and the post-move setup.

- Input: Closing date, current lease termination date, inventory of belongings, new home address
- Output: Complete moving timeline, utility transfer schedule, address change checklist, first-week priority list for the new home
- Key focus: Overlap between closing and move-in dates to avoid homelessness gaps. Schedule utility connections for the day of closing. Change address with postal service, banks, insurance, and employers. Plan the first 48 hours in the new home (essentials box, cleaning, safety checks).

## Decision Points

- **After Step 1:** If total affordable monthly payment (including taxes and insurance) is below the minimum viable home price in your target area, STOP. Either increase savings timeline, expand geographic search, or re-evaluate budget priorities before proceeding. Do not proceed to Step 2 with an unrealistic budget.
- **After Step 3:** If pre-approval amount is significantly lower than expected based on Step 1 budget, revisit Step 1 to adjust expectations or return to Step 2 for further credit improvement before continuing the search.
- **After Step 4:** If no properties meet criteria within budget after 30+ showings, reassess: expand geographic area, adjust must-have list, or increase budget ceiling (returning to Step 1 to verify affordability).
- **After Step 5:** If contract terms are unacceptable and seller will not negotiate, walk away and return to Step 4. Earnest money should be refundable at this stage if contingencies are properly written.
- **After Step 6:** If inspection reveals major structural issues (foundation, roof, electrical), three paths: (a) negotiate repair credits and proceed, (b) request seller complete repairs before closing, (c) invoke inspection contingency and walk away. For first-time buyers, path (c) is often wisest for major structural issues.
- **After Step 7:** If closing disclosure shows terms different from the loan estimate by more than tolerance thresholds, delay closing and escalate with lender. Do not sign documents with unexplained cost increases.

## Failure Handling

- **Step 1 fails (budget reveals insufficient savings):** This is the most common early failure. Recovery: create a 6-12 month savings plan using budget-planning, then re-enter at Step 1. This delay is far better than buying beyond your means.
- **Step 2 fails (credit issues too severe for timeline):** If credit repair requires 6+ months but timeline is shorter, explore FHA loans (lower credit requirements) in Step 3, or delay the purchase. Do not proceed with a high interest rate to "fix it later" -- refinancing is not guaranteed.
- **Step 3 fails (mortgage pre-approval denied):** Identify the denial reason (debt-to-income, credit score, employment gap). Address the specific issue and reapply in 3-6 months. Consider alternative lenders, credit unions, or government-backed programs. Do not apply to many lenders in rapid succession as each hard inquiry affects credit score.
- **Step 4 fails (no suitable properties found):** Widen the search radius, adjust timeline to wait for new inventory, or revisit the must-have list from Step 4. Market timing matters: low inventory months (winter in many regions) yield fewer options but less competition.
- **Step 5 fails (contract negotiation breaks down):** Return to Step 4 shortlist. Having multiple candidate properties reduces the pressure to accept unfavorable terms on any single property.
- **Step 6 fails (inspection reveals critical defects):** If defects are in the "walk away" category (foundation failure, extensive water damage, environmental contamination), use the inspection contingency to exit the contract with earnest money returned. Return to Step 4. This is the contingency doing its job, not a failure.
- **Step 7 fails (closing disclosure discrepancies):** Federal law requires the lender provide the closing disclosure 3 business days before closing. Use this time to dispute any discrepancies. If the lender cannot resolve them, you have the legal right to delay closing.
- **Step 8 fails (moving logistics break down):** Have a backup moving plan (reserve a second moving date, keep essential items in a go-bag, arrange temporary housing if closing delays occur). Closing delays are common -- build 3-5 buffer days into the moving timeline.
- **Direction change (user decides to rent instead):** Steps 1-2 are still valuable (budgeting and credit improvement help with any financial goal). Sunk costs are limited to any inspection fees and appraisal fees paid, which are typically under $1,000 combined.

## Output Format

```
HOME-BUYING WORKFLOW TRACKER
=============================

Phase 1: Financial Preparation
  [ ] Step 1: Budget established
      - Maximum monthly payment: $______
      - Down payment target: $______
      - Closing cost reserve: $______
  [ ] Step 2: Credit optimized
      - Starting score: ______
      - Current score: ______
      - Target score: ______

Phase 2: Mortgage and Search
  [ ] Step 3: Mortgage pre-approved
      - Lender: ________________
      - Rate: ______%
      - Pre-approval amount: $______
  [ ] Step 4: Property selected
      - Address: ________________
      - Price: $______
      - Offer amount: $______

Phase 3: Contract and Inspection
  [ ] Step 5: Contract reviewed
      - Contingencies: inspection / financing / appraisal
      - Earnest money: $______
  [ ] Step 6: Inspection passed
      - Critical issues: ______
      - Negotiated credits: $______

Phase 4: Closing and Move
  [ ] Step 7: Closing documents verified
      - Closing date: ______
      - Final loan amount: $______
  [ ] Step 8: Move complete
      - Move-in date: ______
      - Utilities connected: [ ]
      - Address changed: [ ]

Status: [IN PROGRESS / COMPLETE]
Total timeline: ______ months
```

## Edge Cases

- **Self-employed buyers:** Lenders require 2 years of tax returns and may average income. Prepare documentation early and expect stricter scrutiny during Step 3. Consider working with lenders experienced in self-employed mortgages.
- **Co-buying with non-spouse:** Legal ownership structure matters significantly. Add a co-ownership agreement review to Step 5. Consult a real estate attorney about tenancy types (joint tenancy, tenants in common).
- **Buying in a seller's market:** Steps 4-5 compress. Prepare to make offers quickly with fewer contingencies (risky) or offer above asking price. Pre-inspection before making an offer can speed up the process but costs money if the offer fails.
- **Buying with gift funds for down payment:** Lenders require a gift letter documenting the source and confirming no repayment obligation. Prepare this documentation before Step 3 to avoid delays during underwriting.
- **Condominiums and HOAs:** Add HOA document review to Step 5. Review HOA financials, special assessment history, and rules. HOA fees affect the monthly budget calculated in Step 1.
- **New construction purchases:** Step 6 (inspection) becomes a phased process: foundation inspection, framing inspection, and final inspection. Timeline extends and the builder's warranty replaces some inspection-based negotiations.
- **VA or FHA loan buyers:** Government-backed loans have specific property requirements (VA minimum property requirements, FHA appraisal standards) that affect Step 4 property selection and Step 6 inspection outcomes.

## Expected Outcome

When this workflow is complete, the user will have:

1. A realistic home-buying budget with verified affordability limits
2. An optimized credit profile for the best available mortgage terms
3. A secured mortgage with favorable terms verified against market alternatives
4. A purchased home that passed thorough inspection and contract review
5. A smooth transition into the new home with utilities, address changes, and logistics handled
6. Documentation of every financial and legal decision for future reference (tax records, warranty tracking, insurance)

## Example

**Input:** First-time home buyer with $40,000 saved, household income of $95,000, credit score of 695, targeting a 3-bedroom home in a mid-sized city with a 6-month timeline.

**Output:**

**Step 1 (budget-planning):**
Budget analysis reveals: $2,200 maximum comfortable monthly housing payment (28% of gross income). With $40,000 saved, $8,000 is reserved for closing costs and moving expenses, leaving $32,000 for down payment. At 10% down, target purchase price is $320,000. At 20% down, target is $160,000. The buyer chooses a $280,000 target with 10% down, accepting PMI.

**Step 2 (credit-score-improvement):**
Credit review shows a 695 score with two old collections and high utilization on one card. Action plan: dispute the older collection (past statute of limitations), pay down the high-utilization card. Estimated improvement: 30-45 points over 3 months, potentially reaching 730+ for better rates.

**Step 3 (mortgage-comparison):**
Three lenders compared. Credit union offers 6.25% fixed 30-year with 0.5% origination fee. Online lender offers 6.5% with no origination. Local bank offers 6.375% with rate lock for 60 days. Credit union wins on total cost. Pre-approval secured for $295,000.

**Step 4 (home-buying-checklist):**
After 12 showings over 6 weeks, three properties shortlisted. Property B scores highest: 3-bed/2-bath, $275,000, good school district, minor cosmetic updates needed. Offer submitted at $268,000 with standard contingencies.

**Step 5 (contract-basics-explainer):**
Contract reviewed. Inspection contingency (10 days), financing contingency (21 days), and appraisal contingency included. Earnest money: $5,000, refundable under all three contingencies. Seller accepts at $272,000. Contract signed.

**Step 6 (home-safety-inspection):**
Inspection reveals: functional HVAC (5 years old), minor plumbing leak under kitchen sink ($200 fix), aging water heater (2-3 years remaining). No structural issues. Buyer negotiates $500 credit for plumbing repair. Proceeds to closing.

**Step 7 (lease-agreement-reviewer):**
Closing disclosure reviewed 4 days before closing. Loan amount, rate, and closing costs match the estimate within tolerance. Title search is clear. One fee ($150 courier fee) was not on the original estimate -- lender explains and buyer accepts.

**Step 8 (moving-checklist):**
Move scheduled for 2 days after closing. Utilities transferred. Address changed with postal service, banks, employer, and insurance. First weekend: deep clean, change locks, test smoke detectors, unpack essentials. Settling-in checklist completed within 10 days.

**Result:** First-time buyer purchased a $272,000 home with 10% down, 6.25% fixed rate, after 5 months of preparation and 2 months of active searching. Total out-of-pocket at closing: $35,800 (down payment + closing costs). Monthly payment: $2,050 including taxes and insurance.
