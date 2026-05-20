---
name: navigate-divorce
description: >-
  Structured divorce navigation workflow covering legal preparation, financial
  separation, emotional well-being, co-parenting framework, and life rebuilding
  for moving through divorce with clarity, fairness, and resilience.

  Use when the user wants to navigate divorce or needs a structured multi-step
  process for this goal.

  Do NOT use when the request is a single-step task or requires professional
  advice beyond educational guidance.
license: Apache-2.0
type: workflow
skills: "contract-reviewer budget-builder life-coach communication-coach conflict-resolver"
trigger_phrases: >-
  I'm going through a divorce help me navigate divorce getting divorced what
  should I do divorce planning guide separating from my spouse how to handle a
  divorce
metadata:
  author: foundry-skills
  version: 1.0.0
  tags: legal-literacy parenting emotional-health step-by-step planning
  category: life-event
  depends: "contract-reviewer budget-builder life-coach communication-coach conflict-resolver"
---
# Navigate Divorce

This workflow references legal topics for educational purposes only. It is not legal advice. Consult appropriate legal professionals for matters in your jurisdiction.

**Estimated time:** 6-18 months

Divorce is one of life's most stressful experiences, involving simultaneous
legal, financial, emotional, and (if children are involved) co-parenting
challenges. Most people navigate it reactively, making costly mistakes driven
by emotion rather than strategy. This workflow provides structure through five
phases: legal preparation, financial separation, emotional well-being,
co-parenting framework, and life rebuilding.

This workflow is designed to help you act with clarity and fairness regardless
of how the other party behaves. It covers contested and uncontested divorces,
with and without children.

By the end of this workflow you will have: legal representation and strategy,
financial independence and security, emotional stability and support, a
co-parenting framework (if applicable), and a plan for your new life chapter.

> **DISCLAIMER**: This workflow provides general information for educational
> purposes only. It is not legal, financial, or therapeutic advice. Divorce
> laws vary significantly by jurisdiction. Consult a qualified family law
> attorney, financial advisor, and licensed therapist for guidance specific
> to your situation. If you are in an abusive situation, contact the National
> Domestic Violence Hotline (1-800-799-7233) or local equivalent immediately.

## When to Use

- User wants to navigate divorce
- User needs a structured, step-by-step process for navigate divorce
- I'm going through a divorce
- User wants to navigate divorce
- getting divorced what should I do
- Do NOT use when: the request is outside the scope of navigate divorce or requires professional advice beyond educational guidance
- Do NOT use for single-step tasks that one atomic skill can handle independently

## Prerequisites

Before starting this workflow, ensure:

- Decision to divorce is made (or seriously being considered)
- Basic understanding of your financial situation (or willingness to investigate)
- Access to important personal documents (or ability to obtain copies)
- Emotional readiness to begin the process (support resources identified)
- Safety considerations addressed (if domestic violence is a factor, prioritize safety first)

## Steps

**Step 1: Legal Preparation and Strategy** (uses: contract-reviewer)

understand the legal landscape and prepare
for the legal process. Knowledge is power in divorce proceedings.

- Input: jurisdiction (state/country) and marriage duration, Whether the divorce is likely contested or uncontested, Presence of children and custody considerations
- Output: Overview of the legal process, timeline, and strategy, Organized collection of all critical documents, Chosen attorney with engagement terms
- Key focus: Understanding divorce law basics in your jurisdiction (no-fault vs. fault, waiting periods)

**Step 2: Financial Separation and Security** (uses: budget-builder)

establish financial independence and prepare
for the asset division process. Financial mistakes during divorce are
permanent.

- Input: `document-vault` from Step 1 (financial records are in the vault), `legal-strategy` from Step 1 (legal framework for asset division), Current household income, expenses, assets, and debts
- Output: Complete listing of all marital and separate assets and debts, Temporary budget for the separation period, Projected budget for independent living
- Key focus: Complete financial inventory: all assets, debts, income streams, and accounts

**Step 3: Emotional Well-Being and Support** (uses: life-coach)

build emotional resilience through the divorce
process. Divorce triggers grief, anger, fear, and identity loss simultaneously.
Suppressing these emotions leads to worse decisions and slower recovery.

- Input: emotional state and primary concerns, Whether they initiated the divorce or it was the other party's decision, Existing support system (friends, family, therapist)
- Output: Therapy, support network, and daily practices, Communication boundaries with the ex-spouse, Values, interests, and goals for the new chapter
- Key focus: Acknowledging the grief cycle (denial, anger, bargaining, depression, acceptance)

**Step 4: Co-Parenting Framework** (uses: communication-coach)

build a co-parenting framework that
prioritizes the children's well-being above all else. The quality of the
co-parenting relationship has more impact on children's outcomes than the
divorce itself.

- Input: `boundary-framework` from Step 3 (communication boundaries), `legal-strategy` from Step 1 (custody arrangement context), Number and ages of children
- Output: Communication protocols, schedule, and decision-making framework, How handoffs work, what to communicate, and consistency rules, How disagreements are handled without involving children
- Key focus: Custody arrangement understanding (legal custody, physical custody, schedules)

**Step 5: Rebuild and Move Forward** (uses: conflict-resolver)

Use the Conflict Resolver skill (applied to internal conflicts and life
decisions) to actively build your post-divorce life. Surviving divorce is
not enough -- the goal is to build a life you are genuinely excited about.

- Input: `post-divorce-budget` from Step 2 (financial reality of the new chapter), `identity-exploration` from Step 3 (values and goals for the future), `co-parenting-plan` from Step 4 (ongoing responsibilities)
- Output: Goals, timeline, and action items for the post-divorce chapter, Plan for friendships, community, and social life, Career development and financial independence strategy
- Key focus: Housing: finding a home that is yours (not just a place you ended up)

## Decision Points

- **After Step 1:** What type of divorce process are you pursuing?
  - If **Uncontested (both agree on terms)**: Simplest path. May only need a mediator. Faster and cheaper.
  - If **Mediation (disagreements but willing to negotiate)**: Mediator helps negotiate terms. Less adversarial than litigation.
  - If **Collaborative (each has attorney, but no court)**: Attorneys work cooperatively. Court is the last resort if collaboration fails.
  - If **Contested (significant disagreements, possible litigation)**: Full legal representation essential. Longer timeline and higher cost. Protect yourself.
- **After Step 3:** Are children involved in this divorce?
  - If **Yes, minor children**: Co-parenting framework is critical. Children's well-being is the top priority.
  - If **Yes, adult children**: Adult children need communication but not a custody framework.
  - If **No children**: Skip co-parenting. Focus on financial separation and personal rebuilding.

## Failure Handling

- **Making decisions from anger:** Anger is valid. Decisions made from anger are not. Sleep on every major decision.
- **Neglecting financial details:** Understand every asset, debt, and account. What you do not know can cost you for years.
- **Using children as weapons or messengers:** This causes lasting harm to children. Communicate directly with the co-parent.
- **Rushing to date:** Heal first. The rebound relationship rarely works and often complicates the divorce.
- **Isolating yourself:** Divorce is not a shameful secret. Lean on your support system. Accept help.

## Expected Outcome

When this workflow is complete, the user will have:

1. Legal proceedings are managed strategically, not reactively
2. Financial separation is fair and documented, with post-divorce budget viable
3. Emotional well-being is actively maintained with professional support
4. Co-parenting (if applicable) prioritizes children's stability and well-being
5. The user is actively building a fulfilling post-divorce life
6. Decisions throughout the process were made from clarity, not emotion

## Output Format

```
NAVIGATE DIVORCE TRACKER
========================

[ ] Step 1: Legal Preparation and Strategy
    Status: [pending/in-progress/complete]
[ ] Step 2: Financial Separation and Security
    Status: [pending/in-progress/complete]
[ ] Step 3: Emotional Well-Being and Support
    Status: [pending/in-progress/complete]
[ ] Step 4: Co-Parenting Framework
    Status: [pending/in-progress/complete]
[ ] Step 5: Rebuild and Move Forward
    Status: [pending/in-progress/complete]

Timeline: ______ weeks
Overall Status: [IN PROGRESS / COMPLETE]
```

**Adaptation notes:**
- Adjust timeline based on user's availability and prior experience
- Steps may be reordered if dependencies allow parallel execution
- Skip optional steps if time or budget is constrained

## Edge Cases

- **Making decisions from anger:** Anger is valid. Decisions made from anger are not. Sleep on every major decision.
- **Neglecting financial details:** Understand every asset, debt, and account. What you do not know can cost you for years.
- **Using children as weapons or messengers:** This causes lasting harm to children. Communicate directly with the co-parent.
- **Rushing to date:** Heal first. The rebound relationship rarely works and often complicates the divorce.

## Example

**Input:** "I want to navigate divorce and need a structured plan to follow step by step."

**Output:**

**Step 1 (contract-reviewer):** Legal Preparation and Strategy -- produces concrete deliverables for this phase.

**Step 2 (budget-builder):** Financial Separation and Security -- produces concrete deliverables for this phase.

**Step 3 (life-coach):** Emotional Well-Being and Support -- produces concrete deliverables for this phase.

**Step 4 (communication-coach):** Co-Parenting Framework -- produces concrete deliverables for this phase.

**Step 5 (conflict-resolver):** Rebuild and Move Forward -- produces concrete deliverables for this phase.

**Result:** User has a complete navigate divorce plan with all deliverables produced, validated, and ready for implementation.
