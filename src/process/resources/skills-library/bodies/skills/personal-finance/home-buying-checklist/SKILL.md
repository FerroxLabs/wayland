---
name: home-buying-checklist
description: |
  Produces a complete home buying process checklist covering financial preparation,
  mortgage pre-approval steps, house hunting strategy, offer and negotiation phases,
  inspection, and closing. This is a process guide that structures the entire
  home buying journey from initial readiness assessment through move-in.
  Use when the user asks about buying a home, the home buying process, or wants
  a checklist for purchasing a house.
  Do NOT use for mortgage comparison math (use mortgage-comparison), insurance
  decisions (use insurance-comparison), or investment account decisions
  (use investment-account-types).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "home-buying personal-finance planning checklist"
  category: "personal-finance"
  subcategory: "major-purchases"
  depends: ""
  disclaimer: "educational-finance"
  difficulty: "intermediate"
---

# Home Buying Checklist

> **Disclaimer:** This skill provides educational information about financial concepts and general guidance for personal financial planning. It does NOT constitute financial advice, investment recommendations, or tax guidance. Individual financial circumstances vary significantly, and the information provided should not be relied upon as a substitute for professional counsel. Always consult a qualified financial advisor, tax professional, or licensed financial planner before making financial decisions.

## When to Use

**Use this skill when:**
- User asks about the home buying process or what steps to take
- User wants a checklist for buying their first (or next) home
- User asks how to prepare financially for a home purchase
- User wants to understand the timeline and stages of buying a house
- User asks what happens between making an offer and closing

**Do NOT use this skill when:**
- User wants to compare specific mortgage options (use `mortgage-comparison`)
- User wants to compare insurance policies (use `insurance-comparison`)
- User wants general investment account guidance (use `investment-account-types`)
- User wants to decide between renting and buying (different analysis -- affordability + lifestyle factors)

## Process

1. **Assess the user's current position.** Determine where they are in the process:
   - **Pre-planning:** Not yet started, exploring the idea
   - **Financial preparation:** Saving for down payment, improving credit
   - **Ready to search:** Financially prepared, looking at properties
   - **In process:** Already making offers or under contract

2. **Build the Phase 1: Financial Readiness checklist.** Before looking at homes:

   **Credit Assessment:**
   - [ ] Check credit reports from all major bureaus [JURISDICTION: verify how to obtain free reports]
   - [ ] Identify and dispute any errors on credit reports
   - [ ] Note current credit score range
   - [ ] If score needs improvement, create a timeline (typically 3-6 months minimum for meaningful improvement)

   **Down Payment Preparation:**
   - [ ] Determine target down payment percentage [JURISDICTION: verify common requirements and programs]
   - [ ] Research first-time buyer programs [JURISDICTION: verify available programs]
   - [ ] Calculate total savings needed: down payment + closing costs + moving + emergency reserve
   - [ ] Set up a dedicated savings account for home purchase funds
   - [ ] Establish monthly savings target and timeline

   **Debt and Income Review:**
   - [ ] Calculate debt-to-income ratio: total monthly debt payments / gross monthly income
   - [ ] Lenders typically look for ratios below certain thresholds [JURISDICTION: verify DTI requirements]
   - [ ] Pay down high-interest debt if possible before applying
   - [ ] Avoid opening new credit accounts or making large purchases

   **Budget Estimation:**
   - [ ] Estimate maximum comfortable monthly payment (not just what a lender approves)
   - [ ] Include: mortgage principal + interest + property tax + insurance + HOA fees + maintenance
   - [ ] Rule of thumb: total housing costs should not exceed a comfortable percentage of gross income (user decides their limit)
   - [ ] Factor in utilities, repairs, and ongoing maintenance costs

3. **Build the Phase 2: Pre-Approval checklist.** Getting mortgage pre-approval:

   **Documentation Gathering:**
   - [ ] Recent pay stubs (typically 2-3 months) [JURISDICTION: verify requirements]
   - [ ] Tax returns (typically 2 years) [JURISDICTION: verify requirements]
   - [ ] Bank statements (typically 2-3 months)
   - [ ] Employment verification letter
   - [ ] Documentation for any additional income sources
   - [ ] Current debt statements (student loans, car loans, credit cards)

   **Pre-Approval Process:**
   - [ ] Apply with multiple lenders to compare (does not significantly impact credit if done within a focused window) [JURISDICTION: verify credit inquiry rules for mortgage shopping]
   - [ ] Compare pre-approval amounts, rates, and terms
   - [ ] Understand the difference between pre-qualification (estimate) and pre-approval (verified)
   - [ ] Get a pre-approval letter to strengthen offers

4. **Build the Phase 3: House Hunting checklist.** Finding the right property:

   **Define Requirements:**
   - [ ] Must-have features (bedrooms, bathrooms, location, school district, garage)
   - [ ] Nice-to-have features (separate from must-haves)
   - [ ] Deal-breakers (what would disqualify a property)
   - [ ] Target neighborhoods and commute requirements
   - [ ] Price range based on pre-approval and budget (these may differ -- use the lower)

   **Search Process:**
   - [ ] Consider working with a buyer's agent [JURISDICTION: verify agent compensation rules]
   - [ ] Attend open houses and schedule showings
   - [ ] Research comparable sales in target neighborhoods
   - [ ] Drive the commute at different times of day
   - [ ] Research neighborhood: schools, crime data, future development plans, HOA rules
   - [ ] Keep a comparison spreadsheet for properties visited

5. **Build the Phase 4: Making an Offer checklist.**

   **Offer Preparation:**
   - [ ] Research comparable recent sales to determine a competitive price
   - [ ] Decide on offer price, earnest money amount, and contingencies
   - [ ] Common contingencies: inspection, financing, appraisal [JURISDICTION: verify standard contingencies]
   - [ ] Set a timeline for the seller to respond
   - [ ] Consider including a personal letter to the seller (effectiveness varies by market)

   **Negotiation:**
   - [ ] Be prepared for counter-offers
   - [ ] Know your maximum price before negotiations begin
   - [ ] Negotiate repairs, closing cost credits, or included items separately from price
   - [ ] Get all agreements in writing

6. **Build the Phase 5: Under Contract checklist.** After offer acceptance:

   **Inspection:**
   - [ ] Schedule a professional home inspection within the contingency period [JURISDICTION: verify typical inspection timelines]
   - [ ] Attend the inspection in person if possible
   - [ ] Review the inspection report thoroughly
   - [ ] Identify critical issues vs. minor maintenance items
   - [ ] Negotiate repairs or credits based on inspection findings
   - [ ] Consider specialized inspections: pest, radon, sewer, structural [JURISDICTION: verify common regional concerns]

   **Appraisal:**
   - [ ] Lender orders an appraisal to confirm property value
   - [ ] If appraisal comes in below purchase price: renegotiate, make up the difference, or exercise appraisal contingency
   - [ ] Review the appraisal report for accuracy

   **Final Mortgage Processing:**
   - [ ] Lock your interest rate (if not already locked)
   - [ ] Provide any additional documentation requested by the lender
   - [ ] Review the Loan Estimate document [JURISDICTION: verify document name and timing requirements]
   - [ ] Do NOT change jobs, make large purchases, or open new credit accounts during this period

7. **Build the Phase 6: Closing checklist.** The final steps:

   **Pre-Closing:**
   - [ ] Review the Closing Disclosure document [JURISDICTION: verify document name and timing]
   - [ ] Compare Closing Disclosure to Loan Estimate -- flag significant differences
   - [ ] Arrange homeowner's insurance (required before closing)
   - [ ] Schedule a final walk-through of the property
   - [ ] Arrange funds for closing: certified check or wire transfer for closing costs and down payment
   - [ ] Verify the wire transfer instructions directly with the title company (wire fraud is a real risk)

   **At Closing:**
   - [ ] Review and sign all documents
   - [ ] Verify the numbers match the Closing Disclosure
   - [ ] Receive keys and access information
   - [ ] Get copies of all signed documents

   **After Closing:**
   - [ ] Change locks
   - [ ] Set up utilities in your name
   - [ ] File homestead exemption if applicable [JURISDICTION: verify availability and deadline]
   - [ ] Save all closing documents for tax purposes
   - [ ] Set up a home maintenance schedule and reserve fund

## Output Format

```
## Home Buying Checklist

### Your Current Position
- Stage: [pre-planning / financial preparation / ready to search / in process]
- Timeline target: [when you want to be in your new home]
- Budget range: $[amount] - $[amount]
- Down payment saved: $[amount] of $[target]

### Phase 1: Financial Readiness
**Timeline: [X] months before searching**

#### Credit
- [ ] Check credit reports from all bureaus [JURISDICTION: verify how to access]
- [ ] Dispute any errors found
- [ ] Current score range: ____
- [ ] Score improvement actions (if needed): ____

#### Down Payment
- [ ] Target down payment: $[amount] ([percentage]%)
- [ ] Closing costs estimate: $[amount] [JURISDICTION: verify typical range]
- [ ] Moving costs estimate: $[amount]
- [ ] Emergency reserve: $[amount]
- [ ] Total savings needed: $[amount]
- [ ] Monthly savings target: $[amount]
- [ ] Target date to reach goal: [date]

#### Debt and Income
- [ ] Current DTI ratio: ____% [JURISDICTION: verify target maximum]
- [ ] Debt reduction plan (if needed): ____
- [ ] Stable employment history documented

### Phase 2: Pre-Approval
**Timeline: 1-2 months before searching**

- [ ] Documents gathered (pay stubs, tax returns, bank statements)
- [ ] Applied with [X] lenders
- [ ] Pre-approval amount: $____
- [ ] Pre-approval rate: ____%
- [ ] Pre-approval letter obtained

### Phase 3: House Hunting
**Timeline: [X] weeks/months**

- [ ] Must-haves defined: ____
- [ ] Deal-breakers defined: ____
- [ ] Target neighborhoods: ____
- [ ] Agent selected (if using one)
- [ ] Properties viewed: [count]
- [ ] Top candidates: ____

### Phase 4: Making an Offer
- [ ] Comparable sales researched
- [ ] Offer price determined: $____
- [ ] Earnest money amount: $____
- [ ] Contingencies included: [inspection / financing / appraisal]
- [ ] Offer submitted: [date]
- [ ] Offer accepted: [date]

### Phase 5: Under Contract
**Timeline: typically 30-60 days [JURISDICTION: verify typical closing timeline]**

- [ ] Inspection scheduled: [date]
- [ ] Inspection completed and reviewed
- [ ] Repair negotiations completed
- [ ] Appraisal ordered by lender
- [ ] Appraisal received: $____
- [ ] Rate locked: ____%
- [ ] Final documentation submitted to lender
- [ ] Loan approved

### Phase 6: Closing
- [ ] Closing Disclosure reviewed [JURISDICTION: verify timing requirement]
- [ ] Homeowner's insurance arranged
- [ ] Final walk-through completed: [date]
- [ ] Closing funds arranged
- [ ] Wire instructions verified directly with title company
- [ ] Closing completed: [date]
- [ ] Keys received

### Post-Closing
- [ ] Locks changed
- [ ] Utilities transferred
- [ ] Homestead exemption filed [JURISDICTION: verify if applicable]
- [ ] Closing documents saved for tax records
- [ ] Home maintenance fund established

### Cost Summary
| Item | Estimated | Actual |
|------|----------:|-------:|
| Purchase price | $[amount] | $____ |
| Down payment | $[amount] | $____ |
| Closing costs | $[amount] | $____ |
| Inspection fees | $[amount] | $____ |
| Moving costs | $[amount] | $____ |
| Immediate repairs | $[amount] | $____ |
| **Total out of pocket** | **$[amount]** | **$____** |

### Monthly Cost Projection
| Expense | Amount |
|---------|-------:|
| Mortgage (P&I) | $[amount] |
| Property tax | $[amount] |
| Homeowner's insurance | $[amount] |
| HOA fees | $[amount] |
| Maintenance reserve | $[amount] |
| Utilities | $[amount] |
| **Total monthly housing** | **$[amount]** |
| As % of gross income | [%] |
```

## Rules

1. NEVER recommend specific lenders, real estate agents, or financial institutions
2. NEVER state specific interest rates, down payment requirements, or closing cost percentages as facts
3. ALWAYS use [JURISDICTION: verify] for all location-specific rules, programs, and requirements
4. ALWAYS include the full cost picture: down payment + closing costs + moving + reserves
5. ALWAYS separate what the user can afford from what a lender approves (these are different decisions)
6. Include the wire fraud warning at closing -- this is a real and growing risk
7. Present the checklist in chronological phases so the user can track progress
8. Include monthly cost projection beyond just the mortgage payment
9. Note that timelines vary significantly by market and jurisdiction
10. If the user asks "should I buy or rent," redirect to the framework: buying involves costs beyond the mortgage that must be compared to renting costs

## Edge Cases

- **First-time buyer with no experience:** Provide extra context on each phase. Explain terms (earnest money, contingency, appraisal, escrow) the first time they appear. Note that first-time buyer programs exist in many jurisdictions [JURISDICTION: verify].
- **User is relocating to a new area:** Add research steps: visit the area before buying, research neighborhoods using local data, consider renting first to learn the area. Note that remote buying adds risk.
- **Competitive seller's market:** Note that some contingencies may weaken an offer in competitive markets. The user must weigh the risk of waiving protections (inspection, appraisal) against competitive pressure. This is a personal risk decision, not something to prescribe.
- **User has a home to sell first:** Add a "sell first or buy first" decision point. Discuss bridge financing concept, contingent offers, and the timing challenges of coordinating two transactions.
- **Investment property purchase:** The checklist mostly applies but note that financing terms, down payment requirements, and tax treatment differ for non-primary residences [JURISDICTION: verify investment property rules].
- **User is already under contract:** Skip to the relevant phase. Focus on the under-contract and closing checklists. Ask if they have completed inspection and appraisal.

## Example

**Input:** "I want to start the process of buying my first home. I have about $30,000 saved and make $75,000 a year. Where do I start?"

**Output:**

## Home Buying Checklist

### Your Current Position
- Stage: Pre-planning / Financial preparation
- Savings: $30,000
- Annual income: $75,000 ($6,250/month gross)
- Timeline: To be determined based on readiness assessment below

### Phase 1: Financial Readiness Assessment

#### Down Payment and Costs Estimate
To estimate your purchasing power, consider this framework:

| Component | Conservative Estimate |
|-----------|---------------------:|
| Down payment | $30,000 could cover [JURISDICTION: verify minimum down payment requirements] |
| Closing costs | Typically a percentage of purchase price [JURISDICTION: verify typical range] |
| Moving costs | $2,000-$5,000 (varies widely) |
| Emergency reserve | 3-6 months of housing costs |
| Immediate home needs | $2,000-$5,000 (furniture, repairs, tools) |

Your $30,000 needs to cover ALL of these, not just the down payment. Calculate how much is available for the down payment after setting aside the other amounts.

#### Monthly Budget Check
| Expense | Estimated Monthly |
|---------|------------------:|
| Mortgage (P&I) at estimated price | $[depends on price and rate] |
| Property tax | [JURISDICTION: verify typical rate] |
| Homeowner's insurance | [Get quotes] |
| HOA fees (if applicable) | [Varies by property] |
| Maintenance reserve (1% of home value annually / 12) | $[calculate] |
| **Total estimated housing** | **$[calculate]** |
| Comfortable maximum (your choice) | $____ |

#### Credit Checklist
- [ ] Check all three credit reports [JURISDICTION: verify how to access free reports]
- [ ] Note your current score: ____
- [ ] If below lender thresholds, plan for improvement time
- [ ] Avoid new credit applications

### Immediate Next Steps
1. [ ] Check your credit reports and score
2. [ ] Calculate your total funds available after reserves (down payment budget)
3. [ ] Estimate your comfortable monthly payment
4. [ ] Research first-time buyer programs [JURISDICTION: verify available programs]
5. [ ] Begin the pre-approval process with 2-3 lenders
6. [ ] Start the full Phase 1-6 checklist above

### Key Questions to Answer
- What price range is realistic given your down payment and comfortable monthly payment?
- Are there first-time buyer programs in your area that could help?
- Is your credit score in the range lenders require?
- How long can you wait? (More time = more savings = more options)
