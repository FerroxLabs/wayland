---
name: get-out-of-debt
description: >-
  Guided workflow for eliminating debt systematically from comprehensive debt
  audit and strategy selection through creditor negotiation, execution
  discipline, and prevention planning. Covers credit cards, student loans,
  medical debt, personal loans, and other consumer debt.

  Use when the user wants to get out of debt or needs a structured multi-step
  process for this goal.

  Do NOT use when the request is a single-step task or requires professional
  advice beyond educational guidance.
license: Apache-2.0
type: workflow
skills: "debt-strategist debt-elimination-strategist negotiation-coach budget-builder savings-planner"
trigger_phrases: >-
  I want to get out of debt help me pay off my debt how to become debt-free
  eliminate my credit card debt pay off student loans debt payoff plan
metadata:
  author: foundry-skills
  version: 1.0.0
  tags: debt-management budgeting personal-finance step-by-step planning
  category: business-operations
  depends: "debt-strategist debt-elimination-strategist negotiation-coach budget-builder savings-planner"
---
# Get Out Of Debt

This workflow references financial information for educational purposes only. It is not financial advice. Consult a qualified financial advisor before making major financial decisions.

**Estimated time:** 4-8 weeks to plan, 12-60 months to execute

Debt can feel overwhelming, but it is a solvable problem with the right
strategy and consistent execution. This workflow guides you through five
stages: auditing all debt honestly, selecting the optimal payoff strategy,
negotiating with creditors for better terms, executing the plan with
accountability, and building systems to prevent future debt accumulation.

This workflow is designed for consumer debt (credit cards, student loans,
medical bills, personal loans, car loans). Mortgage debt is a separate
category and is not the focus here, though the principles apply.

By the end of this workflow you will have: a complete debt inventory, a
prioritized payoff plan, improved creditor terms, an execution system, and
prevention strategies for staying debt-free.

## When to Use

- User wants to get out of debt
- User needs a structured, step-by-step process for get out of debt
- User wants to get out of debt
- User wants to pay off my debt
- how to become debt-free
- Do NOT use when: the request is outside the scope of get out of debt or requires professional advice beyond educational guidance
- Do NOT use for single-step tasks that one atomic skill can handle independently

## Prerequisites

Before starting this workflow, ensure:

- Willingness to face the full picture of your debt (total balances, interest rates)
- A source of income (the plan requires money to direct toward debt)
- Commitment to changing spending habits alongside paying down debt
- Openness to making temporary lifestyle adjustments
- No minimum or maximum debt amount required (the workflow scales)

## Steps

**Step 1: Audit All Debt** (uses: debt-strategist)

create a complete and honest inventory of
all debt. Many people underestimate their total debt because they avoid
looking at the full picture.

- Input: All known debts (credit cards, student loans, medical bills, personal loans, auto loans), Monthly income from all sources, Current monthly expenses and minimum payments
- Output: Complete list of all debts with balances, rates, and terms, Total debt, total minimum payments, total monthly interest cost, Credit report findings including errors to dispute
- Key focus: Comprehensive debt listing (every creditor, balance, interest rate, minimum payment)

**Step 2: Select Your Payoff Strategy** (uses: debt-elimination-strategist)

select and configure the
optimal payoff strategy for your situation.

- Input: `debt-inventory` from Step 1 (debts to prioritize), `debt-summary` from Step 1 (total burden and interest costs), `dti-ratio` from Step 1 (severity assessment)
- Output: Selected method with debt payoff order, Month-by-month projection showing balance reduction, Sources of extra money for accelerated payoff
- Key focus: Avalanche method (highest interest rate first -- mathematically optimal)

**Step 3: Negotiate Better Terms** (uses: negotiation-coach)

negotiate better terms with creditors.
Even small rate reductions can save thousands over the payoff period.

- Input: `debt-inventory` from Step 1 (accounts to negotiate), `credit-report-review` from Step 1 (leverage and context), `payoff-strategy` from Step 2 (how better terms change the plan)
- Output: Outcomes of creditor negotiations with new terms, Prepared scripts for each type of negotiation, Balance transfer strategy with timeline and fees
- Key focus: Interest rate reduction requests (call each credit card issuer)

**Step 4: Execute the Plan** (uses: budget-builder)

create the execution framework that turns
the strategy into consistent action. The hardest part is not the plan --
it is following the plan month after month.

- Input: `payoff-strategy` from Step 2 (the plan to follow), `extra-payment-plan` from Step 2 (where extra money comes from), `negotiation-results` from Step 3 (improved terms)
- Output: Monthly budget optimized for maximum debt payoff, All payments automated with calendar reminders, Visual debt payoff tracking system
- Key focus: Budget restructuring around debt payoff (debt payment as the top priority)

**Step 5: Prevent Future Debt** (uses: savings-planner)

build the financial systems that prevent
future debt accumulation. Getting out of debt is an accomplishment;
staying out is the real victory.

- Input: `execution-budget` from Step 4 (budget habits to maintain), `debt-inventory` from Step 1 (understanding what led to the debt), Financial behaviors and triggers identified during the process
- Output: Specific strategies to avoid future debt accumulation, Fully funded emergency reserve plan, Planned savings for predictable expenses
- Key focus: Root cause analysis (what spending patterns created the debt?)

## Decision Points

- **After each step:** Evaluate output quality before proceeding. If output is insufficient, iterate on the current step before moving forward.
- **Mid-workflow:** If circumstances change significantly, re-evaluate earlier steps before continuing.

## Failure Handling

- **Avoiding the full picture:** Not listing every debt delays progress. Total honesty in Step 1 is essential.
- **No emergency fund during payoff:** Without a mini emergency fund, the first unexpected expense sends you back to credit cards.
- **Strategy without execution:** The best plan means nothing without consistent monthly action. Automate everything possible.
- **Debt fatigue:** Long payoff periods are mentally exhausting. Celebrate milestones and track progress visually.
- **Adding new debt while paying off old:** Commit to no new consumer debt during the payoff period.

## Expected Outcome

When this workflow is complete, the user will have:

1. Every debt is documented with current balance, rate, and terms
2. A clear payoff strategy is selected and the timeline is projected
3. Creditor negotiations improve terms where possible
4. Consistent monthly execution reduces debt according to the plan
5. An emergency fund prevents new debt from unexpected expenses
6. Prevention systems address the root causes of debt accumulation
7. The user achieves a specific, dated debt-free milestone

## Output Format

```
GET OUT OF DEBT TRACKER
=======================

[ ] Step 1: Audit All Debt
    Status: [pending/in-progress/complete]
[ ] Step 2: Select Your Payoff Strategy
    Status: [pending/in-progress/complete]
[ ] Step 3: Negotiate Better Terms
    Status: [pending/in-progress/complete]
[ ] Step 4: Execute the Plan
    Status: [pending/in-progress/complete]
[ ] Step 5: Prevent Future Debt
    Status: [pending/in-progress/complete]

Timeline: ______ weeks
Overall Status: [IN PROGRESS / COMPLETE]
```

**Adaptation notes:**
- Adjust timeline based on user's availability and prior experience
- Steps may be reordered if dependencies allow parallel execution
- Skip optional steps if time or budget is constrained

## Edge Cases

- **Avoiding the full picture:** Not listing every debt delays progress. Total honesty in Step 1 is essential.
- **No emergency fund during payoff:** Without a mini emergency fund, the first unexpected expense sends you back to credit cards.
- **Strategy without execution:** The best plan means nothing without consistent monthly action. Automate everything possible.
- **Debt fatigue:** Long payoff periods are mentally exhausting. Celebrate milestones and track progress visually.


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

**Input:** "I want to get out of debt and need a structured plan to follow step by step."

**Output:**

**Step 1 (debt-strategist):** Audit All Debt -- produces concrete deliverables for this phase.

**Step 2 (debt-elimination-strategist):** Select Your Payoff Strategy -- produces concrete deliverables for this phase.

**Step 3 (negotiation-coach):** Negotiate Better Terms -- produces concrete deliverables for this phase.

**Step 4 (budget-builder):** Execute the Plan -- produces concrete deliverables for this phase.

**Step 5 (savings-planner):** Prevent Future Debt -- produces concrete deliverables for this phase.

**Result:** User has a complete get out of debt plan with all deliverables produced, validated, and ready for implementation.
