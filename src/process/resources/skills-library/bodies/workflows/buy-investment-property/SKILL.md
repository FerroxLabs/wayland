---
name: buy-investment-property
description: >-
  Guided workflow for purchasing a rental investment property from defining
  investment criteria and securing financing through property search, deal
  analysis, closing, and property management setup. Covers single-family,
  multi-family, and small commercial rental properties.

  Use when the user wants to buy investment property or needs a structured
  multi-step process for this goal.

  Do NOT use when the request is a single-step task or requires professional
  advice beyond educational guidance.
license: Apache-2.0
type: workflow
skills: "rental-property-investor first-home-buyer market-researcher contract-reviewer landlord-guide"
trigger_phrases: >-
  I want to buy a rental property help me invest in real estate how to buy an
  investment property become a landlord buy a rental house real estate investing
  for beginners
metadata:
  author: foundry-skills
  version: 1.0.0
  tags: home-buying investing step-by-step planning
  category: business-operations
  depends: "rental-property-investor first-home-buyer market-researcher contract-reviewer landlord-guide"
---
# Buy Investment Property

This workflow references financial information for educational purposes only. It is not financial advice. Consult a qualified financial advisor before making major financial decisions.

**Estimated time:** 8-16 weeks

Investment real estate can build long-term wealth through cash flow,
appreciation, tax benefits, and equity buildup. However, it is also one of
the most capital-intensive and management-intensive investment classes. This
workflow guides you through six stages: defining your investment criteria,
securing financing, searching for properties, analyzing deals, closing the
purchase, and setting up property management.

This workflow is designed for investors purchasing their first or second
rental property. More complex strategies (syndications, large multi-family,
commercial) require additional expertise beyond this scope.

By the end of this workflow you will have: clear investment criteria, secured
financing, an analyzed and purchased property, and a property management
system generating rental income.

## When to Use

- User wants to buy investment property
- User needs a structured, step-by-step process for buy investment property
- User wants to buy a rental property
- User wants to invest in real estate
- how to buy an investment property
- Do NOT use when: the request is outside the scope of buy investment property or requires professional advice beyond educational guidance
- Do NOT use for single-step tasks that one atomic skill can handle independently

## Prerequisites

Before starting this workflow, ensure:

- Sufficient capital for down payment (typically 20-25% for investment properties)
- Strong credit score (720+ preferred for best investment property rates)
- Stable primary income to qualify for the mortgage
- Emergency fund separate from investment capital
- Basic understanding of rental markets (or willingness to research)
- Tolerance for the risks and responsibilities of being a landlord

## Steps

**Step 1: Define Your Investment Criteria** (uses: rental-property-investor)

define clear, data-driven
investment criteria before searching for properties.

- Input: financial situation (capital, income, existing debt), Investment goals (cash flow, appreciation, tax benefits, or a combination), Geographic preferences and local market knowledge
- Output: Written criteria for property screening, Budget, return thresholds, and deal-breaker list, Target markets with supporting data
- Key focus: Investment strategy selection (cash flow, appreciation, value-add, house hack)

**Step 2: Secure Financing** (uses: first-home-buyer)

Use the First Home Buyer Guide skill adapted for investment property
financing. Investment property loans have different requirements than
primary residence loans.

- Input: `financial-parameters` from Step 1 (budget and down payment), `strategy-document` from Step 1 (investment type affects loan options), Credit score, income documentation, and existing debt
- Output: Comparison of 3-5 loan options with terms, Pre-approval from at least 2 lenders, Documented reserves meeting lender requirements
- Key focus: Investment property loan types (conventional, portfolio, DSCR, commercial)

**Step 3: Search for Properties** (uses: market-researcher)

conduct a systematic property search
based on your defined criteria.

- Input: `investment-criteria` from Step 1 (screening filters), `market-selection` from Step 1 (where to search), `financing-options` from Step 2 (budget constraints)
- Output: List of 10-20 properties passing initial screening, Rental comparables for target neighborhoods, Data on target neighborhoods (rents, vacancy, trends)
- Key focus: MLS search with investment-specific filters

**Step 4: Analyze Deals** (uses: rental-property-investor)

perform detailed
financial analysis on the top candidates.

- Input: `property-pipeline` from Step 3 (properties to analyze), `rent-comp-database` from Step 3 (rental income estimates), `financing-options` from Step 2 (loan terms for analysis)
- Output: Detailed financial analysis of top 3-5 properties, 5-year and 10-year pro formas for the best deals, Sensitivity analysis under adverse conditions
- Key focus: Income analysis (gross rent, vacancy allowance, other income)

**Step 5: Close the Purchase** (uses: contract-reviewer)

navigate the closing process for an
investment property.

- Input: `offer-strategy` from Step 4 (offer terms), `financing-options` from Step 2 (selected lender), `deal-analysis` from Step 4 (financial model)
- Output: Inspection report with negotiation items, Step-by-step closing timeline and responsibilities, Landlord insurance policy with appropriate coverage
- Key focus: Purchase agreement review (contingencies, timelines, responsibilities)

**Step 6: Set Up Property Management** (uses: landlord-guide)

set up property management
systems for the new investment property.

- Input: `deal-analysis` from Step 4 (rent targets and expense budget), `closing-documents` from Step 5 (property details), Property condition and any needed make-ready work
- Output: Self-manage or property manager with selection criteria, Written screening standards and process, State-appropriate lease agreement template
- Key focus: Self-manage vs. hire a property manager decision (based on scale, distance, time)

## Decision Points

- **After each step:** Evaluate output quality before proceeding. If output is insufficient, iterate on the current step before moving forward.
- **Mid-workflow:** If circumstances change significantly, re-evaluate earlier steps before continuing.

## Failure Handling

- **Falling in love with a property:** Emotional attachment supersedes the numbers. If the math does not work, walk away regardless of curb appeal.
- **Underestimating expenses:** Budget for vacancy (5-8%), maintenance (5-10%), CapEx reserves (5-10%), and management (8-10%) even if self-managing.
- **Skipping the inspection:** Investment properties need thorough inspections. Hidden problems destroy returns.
- **Insufficient reserves:** Unexpected costs are guaranteed. Maintain 6-12 months of expenses in reserve per property.
- **Not understanding landlord-tenant law:** Fair housing violations and improper eviction procedures create legal liability. Know your state and local laws.

## Expected Outcome

When this workflow is complete, the user will have:

1. Investment criteria are data-driven and specific
2. Financing is secured at competitive terms with adequate reserves
3. Property is purchased meeting all defined criteria
4. Financial analysis shows positive cash flow from month one
5. Property management systems are operational and efficient
6. Tenants are screened and placed with a proper lease agreement
7. Financial tracking separates investment from personal finances

## Output Format

```
BUY INVESTMENT PROPERTY TRACKER
===============================

[ ] Step 1: Define Your Investment Criteria
    Status: [pending/in-progress/complete]
[ ] Step 2: Secure Financing
    Status: [pending/in-progress/complete]
[ ] Step 3: Search for Properties
    Status: [pending/in-progress/complete]
[ ] Step 4: Analyze Deals
    Status: [pending/in-progress/complete]
[ ] Step 5: Close the Purchase
    Status: [pending/in-progress/complete]
[ ] Step 6: Set Up Property Management
    Status: [pending/in-progress/complete]

Timeline: ______ weeks
Overall Status: [IN PROGRESS / COMPLETE]
```

**Adaptation notes:**
- Adjust timeline based on user's availability and prior experience
- Steps may be reordered if dependencies allow parallel execution
- Skip optional steps if time or budget is constrained

## Edge Cases

- **Falling in love with a property:** Emotional attachment supersedes the numbers. If the math does not work, walk away regardless of curb appeal.
- **Underestimating expenses:** Budget for vacancy (5-8%), maintenance (5-10%), CapEx reserves (5-10%), and management (8-10%) even if self-managing.
- **Skipping the inspection:** Investment properties need thorough inspections. Hidden problems destroy returns.
- **Insufficient reserves:** Unexpected costs are guaranteed. Maintain 6-12 months of expenses in reserve per property.

## Example

**Input:** "I want to buy investment property and need a structured plan to follow step by step."

**Output:**

**Step 1 (rental-property-investor):** Define Your Investment Criteria -- produces concrete deliverables for this phase.

**Step 2 (first-home-buyer):** Secure Financing -- produces concrete deliverables for this phase.

**Step 3 (market-researcher):** Search for Properties -- produces concrete deliverables for this phase.

**Step 4 (rental-property-investor):** Analyze Deals -- produces concrete deliverables for this phase.

**Step 5 (contract-reviewer):** Close the Purchase -- produces concrete deliverables for this phase.

**Step 6 (landlord-guide):** Set Up Property Management -- produces concrete deliverables for this phase.

**Result:** User has a complete buy investment property plan with all deliverables produced, validated, and ready for implementation.
