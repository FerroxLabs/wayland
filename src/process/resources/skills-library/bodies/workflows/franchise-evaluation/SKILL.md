---
name: franchise-evaluation
description: >-
  Guided workflow for evaluating and launching a franchise business from initial
  research and self-assessment through Franchise Disclosure Document analysis,
  financing, location selection, and operational launch. Covers the complete
  franchise investigation process for first-time franchisees.

  Use when the user wants to franchise evaluation or needs a structured
  multi-step process for this goal.

  Do NOT use when the request is a single-step task or requires professional
  advice beyond educational guidance.
license: Apache-2.0
type: workflow
skills: "swot-analyzer contract-reviewer budget-builder market-researcher business-planner"
trigger_phrases: >-
  I want to buy a franchise help me evaluate a franchise how to become a
  franchisee franchise investment analysis is this franchise worth buying
  franchise due diligence
metadata:
  author: foundry-skills
  version: 1.0.0
  tags: entrepreneurship step-by-step planning
  category: business-operations
  depends: "swot-analyzer contract-reviewer budget-builder market-researcher business-planner"
---
# Franchise Evaluation

This workflow references financial information for educational purposes only. It is not financial advice. Consult a qualified financial advisor before making major financial decisions.

**Estimated time:** 8-16 weeks

Buying a franchise offers a middle path between starting a business from
scratch and buying an existing business. You get a proven system, brand
recognition, and operational support, but you also commit significant
capital and accept operational restrictions. The decision to buy a franchise
is one of the largest financial commitments most people will make.

This workflow guides you through five stages: researching franchise
opportunities and assessing personal fit, analyzing the Franchise Disclosure
Document, securing financing, evaluating locations, and launching operations.
The process is designed to be thorough because the cost of a bad franchise
decision is severe.

By the end of this workflow you will have: a vetted franchise selection, a
thorough FDD analysis, secured financing, a selected location, and an
operational launch plan.

## When to Use

- User wants to franchise evaluation
- User needs a structured, step-by-step process for franchise evaluation
- User wants to buy a franchise
- User wants to evaluate a franchise
- how to become a franchisee
- Do NOT use when: the request is outside the scope of franchise evaluation or requires professional advice beyond educational guidance
- Do NOT use for single-step tasks that one atomic skill can handle independently

## Prerequisites

Before starting this workflow, ensure:

- Significant capital for investment (franchise costs range from $50K to $500K+)
- Willingness to follow a system (franchising is not entrepreneurship -- it is operation)
- Business or management experience (preferred but not always required)
- Time for thorough investigation (rushing franchise decisions is dangerous)
- Support from family or partners (this affects lifestyle significantly)
- Understanding that you are buying a job, not just an investment

## Steps

**Step 1: Research and Self-Assessment** (uses: swot-analyzer)

evaluate both your personal fit for
franchising and the franchise opportunities you are considering.

- Input: professional background, skills, and experience, Available investment capital (liquid and total net worth), Lifestyle preferences (work hours, travel, hands-on vs. management)
- Output: Personal readiness evaluation for franchise ownership, Top 3-5 franchises with initial evaluation, SWOT analysis for each shortlisted franchise
- Key focus: Personal franchise readiness assessment (are you a franchisee temperament?)

**Step 2: Analyze the Franchise Disclosure Document** (uses: contract-reviewer)

systematically analyze the Franchise
Disclosure Document. The FDD is 200-400 pages of critical information
and must be reviewed with professional legal counsel.

- Input: `franchise-shortlist` from Step 1 (franchises to investigate), `swot-analyses` from Step 1 (known risks and opportunities), FDDs received from franchise systems (required 14 days before signing)
- Output: Comprehensive analysis of each FDD item with red flags, Complete fee analysis (initial, ongoing, marketing, technology), Notes from calls with existing and former franchisees
- Key focus: Item 1-4: Franchisor background, litigation, and bankruptcy history

**Step 3: Secure Financing** (uses: budget-builder)

develop a comprehensive financing plan for
the franchise investment.

- Input: `fdd-analysis` from Step 2 (Item 7 total investment estimate), `fee-structure` from Step 2 (ongoing costs), `financial-qualification` from Step 1 (available capital)
- Output: Capital sources and amounts for the total investment, 3-year projected income statement and cash flow, Months to break-even and ROI timeline
- Key focus: Total capital requirement (Item 7 investment + working capital + personal reserves)

**Step 4: Evaluate and Select Location** (uses: market-researcher)

evaluate and select the optimal location
for the franchise. Many franchises succeed or fail based on location.

- Input: `fdd-analysis` from Step 2 (territory requirements and restrictions), `financing-plan` from Step 3 (build-out budget), `validation-summary` from Step 2 (location insights from existing franchisees)
- Output: Evaluation of top 3-5 potential sites, Target customer density and spending data per site, Terms comparison for finalist locations
- Key focus: Territory analysis (protected territory, population density, demographics)

**Step 5: Launch Operations** (uses: business-planner)

execute the franchise launch, from
training through grand opening and initial operations.

- Input: `fdd-analysis` from Step 2 (franchisor training and support), `financing-plan` from Step 3 (capital deployed), `build-out-plan` from Step 4 (location ready)
- Output: Detailed timeline from training to grand opening, Staffing requirements, recruitment, and training schedule, Pre-opening and grand opening marketing campaign
- Key focus: Franchisor initial training completion (typically 1-4 weeks)

## Decision Points

- **After each step:** Evaluate output quality before proceeding. If output is insufficient, iterate on the current step before moving forward.
- **Mid-workflow:** If circumstances change significantly, re-evaluate earlier steps before continuing.

## Failure Handling

- **Not reading the FDD thoroughly:** The FDD contains everything you need to know. Skipping items leads to expensive surprises.
- **Insufficient validation calls:** Talk to at least 10-15 existing and former franchisees. They are the real source of truth.
- **Investing money you cannot lose:** Franchise investments can fail. Do not bet your house, retirement, or family's financial security on a single franchise.
- **Choosing based on brand alone:** A famous brand does not guarantee a profitable franchise. Unit economics matter more than brand recognition.
- **Skipping the franchise attorney:** Franchise law is specialized. A general attorney may miss critical franchise-specific issues.

## Expected Outcome

When this workflow is complete, the user will have:

1. Personal fit for franchising is honestly assessed and confirmed
2. The FDD is thoroughly analyzed with professional legal review
3. Franchisee validation calls confirm the franchisor's claims
4. Financing is secured without over-leveraging personal finances
5. Location is selected based on data, not convenience
6. Operations launch smoothly following franchisor systems
7. Break-even is achieved within the projected timeline
8. The franchise generates the expected return on investment

## Output Format

```
FRANCHISE EVALUATION TRACKER
============================

[ ] Step 1: Research and Self-Assessment
    Status: [pending/in-progress/complete]
[ ] Step 2: Analyze the Franchise Disclosure Document
    Status: [pending/in-progress/complete]
[ ] Step 3: Secure Financing
    Status: [pending/in-progress/complete]
[ ] Step 4: Evaluate and Select Location
    Status: [pending/in-progress/complete]
[ ] Step 5: Launch Operations
    Status: [pending/in-progress/complete]

Timeline: ______ weeks
Overall Status: [IN PROGRESS / COMPLETE]
```

**Adaptation notes:**
- Adjust timeline based on user's availability and prior experience
- Steps may be reordered if dependencies allow parallel execution
- Skip optional steps if time or budget is constrained

## Edge Cases

- **Not reading the FDD thoroughly:** The FDD contains everything you need to know. Skipping items leads to expensive surprises.
- **Insufficient validation calls:** Talk to at least 10-15 existing and former franchisees. They are the real source of truth.
- **Investing money you cannot lose:** Franchise investments can fail. Do not bet your house, retirement, or family's financial security on a single franchise.
- **Choosing based on brand alone:** A famous brand does not guarantee a profitable franchise. Unit economics matter more than brand recognition.

## Example

**Input:** "I want to franchise evaluation and need a structured plan to follow step by step."

**Output:**

**Step 1 (swot-analyzer):** Research and Self-Assessment -- produces concrete deliverables for this phase.

**Step 2 (contract-reviewer):** Analyze the Franchise Disclosure Document -- produces concrete deliverables for this phase.

**Step 3 (budget-builder):** Secure Financing -- produces concrete deliverables for this phase.

**Step 4 (market-researcher):** Evaluate and Select Location -- produces concrete deliverables for this phase.

**Step 5 (business-planner):** Launch Operations -- produces concrete deliverables for this phase.

**Result:** User has a complete franchise evaluation plan with all deliverables produced, validated, and ready for implementation.
