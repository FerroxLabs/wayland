---
name: financial-independence-plan
description: >-
  Guided workflow for creating a comprehensive financial independence plan from
  current financial assessment through budgeting, investment strategy, tax
  optimization, and timeline projection. Covers the FIRE methodology adapted for
  individual circumstances and risk tolerances.

  Use when the user wants to financial independence plan or needs a structured
  multi-step process for this goal.

  Do NOT use when the request is a single-step task or requires professional
  advice beyond educational guidance.
license: Apache-2.0
type: workflow
skills: "fire-planner expense-analyzer index-fund-strategist tax-assistant"
trigger_phrases: >-
  I want to achieve financial independence help me plan for FIRE how to retire
  early create a financial independence plan build wealth for early retirement
  how long until I can retire
metadata:
  author: foundry-skills
  version: 1.0.0
  tags: investing budgeting retirement-planning savings step-by-step planning
  category: business-operations
  depends: "fire-planner expense-analyzer index-fund-strategist tax-assistant"
---
# Financial Independence Plan

This workflow references financial information for educational purposes only. It is not financial advice. Consult a qualified financial advisor before making major financial decisions.

**Estimated time:** 3-6 weeks

Financial independence is the point where your investment income covers
your living expenses, making work optional. This workflow guides you through
the systematic process of assessing your current position, optimizing your
budget for maximum savings rate, building an investment strategy, optimizing
for tax efficiency, and projecting your timeline to financial independence.

This is not a get-rich-quick scheme. Financial independence typically takes
10-25 years of disciplined saving and investing. The workflow is honest
about the math while helping you optimize every variable in the equation.

By the end of this workflow you will have: a complete financial snapshot,
an optimized budget, an investment strategy, a tax optimization plan, and
a projected timeline to financial independence.

## When to Use

- User wants to financial independence plan
- User needs a structured, step-by-step process for financial independence plan
- User wants to achieve financial independence
- User wants to plan for FIRE
- how to retire early
- Do NOT use when: the request is outside the scope of financial independence plan or requires professional advice beyond educational guidance
- Do NOT use for single-step tasks that one atomic skill can handle independently

## Prerequisites

Before starting this workflow, ensure:

- Stable income (employment, self-employment, or business)
- Basic financial accounts (checking, savings, at least one investment account)
- Willingness to track spending and make budget adjustments
- Long-term mindset and patience (this is measured in years, not months)
- No specific savings amount required (the workflow works from any starting point)

## Steps

**Step 1: Assess Your Current Financial Position** (uses: fire-planner)

conduct a comprehensive financial assessment.
This is the foundation every other step builds on.

- Input: income (all sources), Current savings and investment account balances, Monthly expenses (rough estimate is fine -- Step 2 will refine)
- Output: Complete net worth, income, and expense summary, Target financial independence number with methodology, Current savings rate with breakdown
- Key focus: Net worth calculation (all assets minus all liabilities)

**Step 2: Optimize Your Budget for Savings Rate** (uses: expense-analyzer)

optimize spending and maximize the savings
rate. The savings rate is the most powerful variable in the FI equation.

- Input: `financial-snapshot` from Step 1 (current spending and income), `savings-rate` from Step 1 (current rate to improve), `fi-number` from Step 1 (target that determines required savings)
- Output: Revised budget with targeted savings rate, Specific actions to reduce spending with dollar impact, Strategies for increasing income
- Key focus: Expense tracking setup (every dollar for at least 30 days)

**Step 3: Build Your Investment Strategy** (uses: index-fund-strategist)

design an investment portfolio
aligned with your financial independence timeline.

- Input: `financial-snapshot` from Step 1 (current investment positions), `optimized-budget` from Step 2 (monthly investment amount), `fi-number` from Step 1 (target to reach through investing)
- Output: Written investment policy statement with asset allocation, Which accounts to fund and in what order, Specific fund recommendations with expense ratios
- Key focus: Investment philosophy education (passive indexing, diversification, compound growth)

**Step 4: Optimize Tax Efficiency** (uses: tax-assistant)

minimize the tax drag on your path to
financial independence. Tax optimization can add years to or remove years
from your FI timeline.

- Input: `investment-policy` from Step 3 (investments to optimize for taxes), `account-strategy` from Step 3 (tax-advantaged account usage), `optimized-budget` from Step 2 (income and deductions)
- Output: Comprehensive tax optimization plan, Tax-efficient placement of investments across account types, Roth conversion ladder strategy for early access
- Key focus: Tax-advantaged account maximization (401k, IRA, HSA, 529)

**Step 5: Project Your Timeline and Monitor** (uses: fire-planner)

project your financial independence timeline
and establish a monitoring cadence.

- Input: `fi-number` from Step 1 (target), `optimized-budget` from Step 2 (savings rate), `investment-policy` from Step 3 (expected returns)
- Output: Projected timeline with conservative, moderate, and optimistic scenarios, Key milestones with projected dates, How variables affect the timeline
- Key focus: Timeline projection using multiple return scenarios (conservative, moderate, optimistic)

## Decision Points

- **After each step:** Evaluate output quality before proceeding. If output is insufficient, iterate on the current step before moving forward.
- **Mid-workflow:** If circumstances change significantly, re-evaluate earlier steps before continuing.

## Failure Handling

- **Obsessing over the FI number without living:** Financial independence is a means, not an end. Do not sacrifice the present entirely for the future.
- **Ignoring tax optimization:** Tax drag can add years to the timeline. Asset location and Roth conversions are powerful levers.
- **Trying to beat the market:** Decades of data show that low-cost index funds outperform most active strategies. Stay the course.
- **Inflexible plans:** Life changes. Build flexibility into the plan and revisit annually.
- **Not accounting for healthcare:** Early retirees must fund their own health insurance. Budget for this before traditional Medicare eligibility.

## Expected Outcome

When this workflow is complete, the user will have:

1. A complete financial picture exists with nothing overlooked
2. Savings rate is optimized through conscious spending aligned with values
3. Investment strategy is diversified, low-cost, and tax-efficient
4. Tax optimization reduces drag on wealth accumulation
5. Timeline is projected under realistic assumptions
6. Monitoring cadence keeps the plan on track through life changes
7. The plan is sustainable and does not require extreme deprivation

## Output Format

```
FINANCIAL INDEPENDENCE PLAN TRACKER
===================================

[ ] Step 1: Assess Your Current Financial Position
    Status: [pending/in-progress/complete]
[ ] Step 2: Optimize Your Budget for Savings Rate
    Status: [pending/in-progress/complete]
[ ] Step 3: Build Your Investment Strategy
    Status: [pending/in-progress/complete]
[ ] Step 4: Optimize Tax Efficiency
    Status: [pending/in-progress/complete]
[ ] Step 5: Project Your Timeline and Monitor
    Status: [pending/in-progress/complete]

Timeline: ______ weeks
Overall Status: [IN PROGRESS / COMPLETE]
```

**Adaptation notes:**
- Adjust timeline based on user's availability and prior experience
- Steps may be reordered if dependencies allow parallel execution
- Skip optional steps if time or budget is constrained

## Edge Cases

- **Obsessing over the FI number without living:** Financial independence is a means, not an end. Do not sacrifice the present entirely for the future.
- **Ignoring tax optimization:** Tax drag can add years to the timeline. Asset location and Roth conversions are powerful levers.
- **Trying to beat the market:** Decades of data show that low-cost index funds outperform most active strategies. Stay the course.
- **Inflexible plans:** Life changes. Build flexibility into the plan and revisit annually.


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

**Input:** "I want to financial independence plan and need a structured plan to follow step by step."

**Output:**

**Step 1 (fire-planner):** Assess Your Current Financial Position -- produces concrete deliverables for this phase.

**Step 2 (expense-analyzer):** Optimize Your Budget for Savings Rate -- produces concrete deliverables for this phase.

**Step 3 (index-fund-strategist):** Build Your Investment Strategy -- produces concrete deliverables for this phase.

**Step 4 (tax-assistant):** Optimize Tax Efficiency -- produces concrete deliverables for this phase.

**Step 5 (fire-planner):** Project Your Timeline and Monitor -- produces concrete deliverables for this phase.

**Result:** User has a complete financial independence plan plan with all deliverables produced, validated, and ready for implementation.
