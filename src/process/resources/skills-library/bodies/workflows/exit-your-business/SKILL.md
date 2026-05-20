---
name: exit-your-business
description: >-
  Guided workflow for business owners planning an exit, from business valuation
  and preparation through marketing the business, negotiating the sale, and
  managing the transition. Covers sale to a third party, management buyout, and
  succession planning.

  Use when the user wants to exit your business or needs a structured multi-step
  process for this goal.

  Do NOT use when the request is a single-step task or requires professional
  advice beyond educational guidance.
license: Apache-2.0
type: workflow
skills: "competitive-analyst business-planner negotiation-master contract-reviewer"
trigger_phrases: >-
  I want to sell my business help me exit my business how to value my company
  plan a business exit succession planning for my business prepare my business
  for sale
metadata:
  author: foundry-skills
  version: 1.0.0
  tags: strategy step-by-step planning
  category: business-operations
  depends: "competitive-analyst business-planner negotiation-master contract-reviewer"
---
# Exit Your Business

This workflow references financial information for educational purposes only. It is not financial advice. Consult a qualified financial advisor before making major financial decisions.

**Estimated time:** 6-18 months

Exiting a business is one of the most significant financial events in an
owner's life. Whether selling to a third party, executing a management
buyout, or transitioning to a successor, the process requires careful
preparation to maximize value and ensure a smooth transition. Most
business owners only do this once, and mistakes are expensive.

This workflow guides you through five stages: valuing your business,
preparing it for sale, marketing to potential buyers, negotiating the
deal terms, and managing the ownership transition. The entire process
typically takes 6-18 months from decision to closing.

By the end of this workflow you will have: a defensible business valuation,
a sale-ready business, an active buyer process, negotiated deal terms, and
a completed ownership transition.

## When to Use

- User wants to exit your business
- User needs a structured, step-by-step process for exit your business
- User wants to sell my business
- User wants to exit my business
- how to value my company
- Do NOT use when: the request is outside the scope of exit your business or requires professional advice beyond educational guidance
- Do NOT use for single-step tasks that one atomic skill can handle independently

## Prerequisites

Before starting this workflow, ensure:

- An operating business with at least 2-3 years of financial history
- Clear ownership structure (no unresolved partner disputes)
- Willingness to invest 6-18 months in the exit process
- Financial records that are organized and accurate
- Realistic expectations about valuation and timeline
- Understanding that the process will require professional advisors

## Steps

**Step 1: Value Your Business** (uses: competitive-analyst)

develop a defensible business valuation
and understand how your business compares to market standards.

- Input: Business financials for the past 3-5 years (revenue, profit, cash flow), Industry and market context, Business model and competitive position
- Output: Valuation range using multiple methodologies, Adjusted SDE/EBITDA with documented add-backs, Strengths and weaknesses affecting valuation
- Key focus: Financial performance analysis (revenue trends, profit margins, cash flow)

**Step 2: Prepare the Business for Sale** (uses: business-planner)

prepare the business for maximum value
at sale. Preparation typically takes 6-12 months and can significantly
increase the sale price.

- Input: `business-valuation` from Step 1 (current value and improvement opportunities), `value-driver-analysis` from Step 1 (what to strengthen), Business operations and management structure
- Output: Prioritized actions to increase business value, Documented processes and systems, Team capability to operate without the owner
- Key focus: Reducing owner dependence (delegate decisions, document processes, strengthen management)

**Step 3: Market the Business** (uses: business-planner)

develop and execute a marketing strategy
that reaches qualified buyers while maintaining confidentiality.

- Input: `business-valuation` from Step 1 (asking price basis), `growth-narrative` from Step 2 (buyer pitch), `operations-documentation` from Step 2 (due diligence materials)
- Output: Professional CIM presenting the business opportunity, Qualification requirements for potential buyers, Channels and outreach plan for finding buyers
- Key focus: Deciding whether to use a business broker (recommended for most sales)

**Step 4: Negotiate the Deal** (uses: negotiation-master)

evaluate offers and negotiate deal
terms that protect your interests.

- Input: `business-valuation` from Step 1 (negotiation anchor), Letters of Intent (LOIs) from interested buyers, `buyer-criteria` from Step 3 (qualified buyers)
- Output: Side-by-side analysis of buyer offers, Agreed deal structure with tax implications, Key terms negotiated with outcomes
- Key focus: LOI evaluation and comparison (price, structure, terms, contingencies)

**Step 5: Manage the Transition** (uses: contract-reviewer)

navigate from LOI through closing and
post-closing transition.

- Input: `deal-structure` from Step 4 (agreed terms), `term-negotiation-log` from Step 4 (negotiated provisions), `operations-documentation` from Step 2 (transition materials)
- Output: Comprehensive checklist from LOI to closing, Post-closing transition responsibilities and timeline, Messaging and timing for staff notification
- Key focus: Due diligence management (responding to buyer requests, maintaining confidentiality)

## Decision Points

- **After each step:** Evaluate output quality before proceeding. If output is insufficient, iterate on the current step before moving forward.
- **Mid-workflow:** If circumstances change significantly, re-evaluate earlier steps before continuing.

## Failure Handling

- **Unrealistic valuation expectations:** What you think your business is worth and what a buyer will pay are often different. Trust the data and comparables.
- **Selling unprepared:** Rushing to market without preparation leaves money on the table. Invest 6-12 months in preparation.
- **Confidentiality breaches:** If employees, customers, or competitors learn about the sale prematurely, it can damage the business and the deal.
- **Ignoring tax implications:** The difference between an asset sale and a stock sale can mean hundreds of thousands in taxes. Get tax advice early.
- **Earn-out overreliance:** Earn-outs shift risk to the seller and depend on buyer management. Maximize cash at closing.

## Expected Outcome

When this workflow is complete, the user will have:

1. Business valuation is realistic and supported by multiple methodologies
2. The business is prepared with reduced owner dependence and clean financials
3. Qualified buyers are identified and engaged confidentially
4. Deal terms are negotiated to protect the seller's interests
5. The transaction closes and proceeds are received
6. Employees and customers transition smoothly to new ownership
7. The seller has a plan for managing proceeds and the next life chapter

## Output Format

```
EXIT YOUR BUSINESS TRACKER
==========================

[ ] Step 1: Value Your Business
    Status: [pending/in-progress/complete]
[ ] Step 2: Prepare the Business for Sale
    Status: [pending/in-progress/complete]
[ ] Step 3: Market the Business
    Status: [pending/in-progress/complete]
[ ] Step 4: Negotiate the Deal
    Status: [pending/in-progress/complete]
[ ] Step 5: Manage the Transition
    Status: [pending/in-progress/complete]

Timeline: ______ weeks
Overall Status: [IN PROGRESS / COMPLETE]
```

**Adaptation notes:**
- Adjust timeline based on user's availability and prior experience
- Steps may be reordered if dependencies allow parallel execution
- Skip optional steps if time or budget is constrained

## Edge Cases

- **Unrealistic valuation expectations:** What you think your business is worth and what a buyer will pay are often different. Trust the data and comparables.
- **Selling unprepared:** Rushing to market without preparation leaves money on the table. Invest 6-12 months in preparation.
- **Confidentiality breaches:** If employees, customers, or competitors learn about the sale prematurely, it can damage the business and the deal.
- **Ignoring tax implications:** The difference between an asset sale and a stock sale can mean hundreds of thousands in taxes. Get tax advice early.


### Timeline Considerations

This workflow is designed to be completed sequentially, but experienced users may parallelize some steps. Key dependencies:

- Each step builds on outputs from previous steps
- Steps involving external parties may have variable timelines
- Budget constraints may require phasing steps across multiple weeks or months
- Regular progress reviews between steps help catch issues early

### Success Indicators

Track these signals to confirm the workflow is on track:

- Each step produces a concrete, reviewable deliverable
- User confidence increases as steps are completed
- Deliverables from early steps remain valid as later steps are executed
- No critical assumptions from earlier steps are invalidated
- External feedback (where applicable) is incorporated before proceeding

## Example

**Input:** "I want to exit your business and need a structured plan to follow step by step."

**Output:**

**Step 1 (competitive-analyst):** Value Your Business -- produces concrete deliverables for this phase.

**Step 2 (business-planner):** Prepare the Business for Sale -- produces concrete deliverables for this phase.

**Step 3 (business-planner):** Market the Business -- produces concrete deliverables for this phase.

**Step 4 (negotiation-master):** Negotiate the Deal -- produces concrete deliverables for this phase.

**Step 5 (contract-reviewer):** Manage the Transition -- produces concrete deliverables for this phase.

**Result:** User has a complete exit your business plan with all deliverables produced, validated, and ready for implementation.
