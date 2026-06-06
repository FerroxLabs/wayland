---
name: plan-retirement-lifestyle
description: >-
  Comprehensive retirement lifestyle planning workflow covering vision creation,
  location selection, financial sustainability, health optimization, and social
  engagement for a fulfilling and well-prepared transition into retirement.

  Use when the user wants to plan retirement lifestyle or needs a structured
  multi-step process for this goal.

  Do NOT use when the request is a single-step task or requires professional
  advice beyond educational guidance.
license: Apache-2.0
type: workflow
skills: "life-coach goal-setter retirement-planner habit-tracker"
trigger_phrases: >-
  I want to plan my retirement help me plan for retirement retirement lifestyle
  planning what to do in retirement preparing for retirement retirement
  transition plan
metadata:
  author: foundry-skills
  version: 1.0.0
  tags: >-
    retirement-planning habits personal-finance health-wellness step-by-step
    planning
  category: life-event
  depends: "life-coach goal-setter retirement-planner habit-tracker"
  disclaimer: educational-finance
  difficulty: intermediate
---
# Plan Retirement Lifestyle

This workflow references financial information for educational purposes only. It is not financial advice. Consult a qualified financial advisor before making major financial decisions.

**Estimated time:** 3-12 months planning

Retirement is not just a financial event -- it is a complete lifestyle
redesign. Most retirement planning focuses exclusively on money, neglecting
the equally important questions of purpose, location, health, and social
connection. People who retire without a lifestyle plan often face an identity
crisis, social isolation, and declining health despite having adequate savings.

This workflow addresses all five pillars of retirement: vision (what do you
want your days to look like), location (where to live), finances (can you
afford it sustainably), health (maintaining physical and mental wellness),
and social life (staying connected and purposeful).

By the end of this workflow you will have: a clear retirement vision, a
chosen location, a sustainable financial plan, a health optimization strategy,
and an active social and purpose-driven lifestyle plan.

> **DISCLAIMER**: This workflow provides general information for educational
> purposes only. It is not personalized financial, legal, or medical advice.
> Consult qualified professionals (financial advisor, estate attorney, physician)
> for guidance specific to your situation. Retirement planning involves complex
> financial decisions that depend on your individual circumstances.

## When to Use

- User wants to plan retirement lifestyle
- User needs a structured, step-by-step process for plan retirement lifestyle
- User wants to plan my retirement
- User wants to plan for retirement
- retirement lifestyle planning
- Do NOT use when: the request is outside the scope of plan retirement lifestyle or requires professional advice beyond educational guidance
- Do NOT use for single-step tasks that one atomic skill can handle independently

## Prerequisites

Before starting this workflow, ensure:

- Within 1-10 years of intended retirement (or recently retired)
- Basic awareness of current retirement savings and income sources
- Willingness to think about retirement beyond just finances
- Openness to making lifestyle changes for health and social wellness
- Partner alignment (if applicable -- retirement affects both people)

## Steps

**Step 1: Create Your Retirement Vision** (uses: life-coach)

help the user envision their ideal retirement
beyond the financial question.

- Input: Current age and intended retirement age, Current daily routine and what the user enjoys vs. tolerates, Interests, hobbies, and activities they want to pursue
- Output: Detailed picture of ideal retirement lifestyle, Activities, roles, and pursuits that provide purpose, Identified fears with mitigation strategies
- Key focus: Daily rhythm design: what does an ideal Tuesday look like in retirement?

**Step 2: Choose Your Location** (uses: goal-setter)

evaluate whether to stay in place, downsize, or
relocate for retirement. Location shapes every aspect of retirement quality.

- Input: `retirement-vision` from Step 1 (lifestyle needs drive location choice), Current home situation (own, rent, paid off, mortgage remaining), Proximity needs (family, grandchildren, friends, healthcare)
- Output: Stay vs. move decision with supporting rationale, Ranked priorities for retirement location, Tax implications of current vs. potential locations
- Key focus: Stay vs. move analysis: does the current home serve retirement needs?

**Step 3: Build a Sustainable Financial Plan** (uses: retirement-planner)

create a financial plan that sustains
the desired lifestyle for 25-35 years. Running out of money in retirement
is the worst-case scenario.

- Input: `retirement-vision` from Step 1 (lifestyle determines spending needs), `location-analysis` from Step 2 (location affects costs and taxes), Current retirement savings, investments, and expected income sources
- Output: All income sources with amounts and timing, Tax-efficient withdrawal plan from retirement accounts, Annual budget with essential and discretionary categories
- Key focus: Retirement income inventory: Social Security, pensions, 401k/IRA, other investments

**Step 4: Optimize Your Health** (uses: habit-tracker)

establish health habits that support an active,
independent retirement for as long as possible. Health is the foundation
everything else depends on.

- Input: `retirement-vision` from Step 1 (activities require certain health levels), Current health status and any chronic conditions, Current exercise, nutrition, and sleep habits
- Output: Exercise, nutrition, and preventive care plan, Weekly exercise schedule including strength and balance work, Screening and appointment schedule
- Key focus: Physical activity plan: 150 minutes moderate exercise per week minimum

**Step 5: Build Your Social and Purpose Network** (uses: goal-setter)

create a rich social life and purpose-driven
schedule. Social isolation is one of the biggest health risks in retirement.

- Input: `retirement-vision` from Step 1 (purpose and social goals), `purpose-plan` from Step 1 (activities that provide meaning), `location-analysis` from Step 2 (community resources available)
- Output: Regular weekly schedule with activities and social commitments, Recurring social activities and community involvement, Volunteer, mentor, learn, and create activities
- Key focus: Regular activities: 3-4 scheduled weekly activities that involve other people

## Decision Points

- **After Step 1:** How close are you to retirement?
  - If **5-10 years away**: Maximum planning time. Can make significant financial and health improvements.
  - If **1-5 years away**: Focused planning. Financial optimization and lifestyle design are priority.
  - If **Within 1 year**: Urgent planning. Focus on financial readiness and first-year lifestyle design.
  - If **Already retired**: Lifestyle optimization. Adjust existing plan or create one if missing.
- **After Step 2:** What is your location plan for retirement?
  - If **Stay in current home**: Evaluate aging-in-place modifications. Assess ongoing costs vs. retirement budget.
  - If **Downsize locally**: Reduce housing costs and maintenance. Stay in familiar community.
  - If **Relocate to new city/state**: Full research required. Visit and trial-live before committing. Tax implications.
  - If **Snowbird (two locations)**: Budget for two homes. Consider renting one. Logistics of seasonal migration.

## Failure Handling

- **Planning only finances:** Money enables retirement but does not define it. Purpose, health, and relationships matter as much as the portfolio.
- **Underestimating healthcare costs:** Healthcare is often the largest retirement expense after housing. Plan for it comprehensively.
- **Social isolation:** Losing work colleagues without replacing social connections leads to depression and cognitive decline. Build community intentionally.
- **No structure:** Complete freedom sounds appealing but often leads to purposeless drifting. Build a weekly structure with flexibility.
- **Ignoring health:** Start health habits before retirement. It is harder to build them in an unstructured environment.

## Expected Outcome

When this workflow is complete, the user will have:

1. A retirement vision exists that excites rather than frightens the user
2. Financial plan sustains the desired lifestyle for 25-35 years
3. Health habits are established that support independence and vitality
4. Social connections prevent isolation and provide community
5. Purpose-driven activities provide meaning and structure
6. The user feels confident and excited about retirement
7. Partner alignment is achieved on the shared retirement lifestyle

## Output Format

```
PLAN RETIREMENT LIFESTYLE TRACKER
=================================

[ ] Step 1: Create Your Retirement Vision
    Status: [pending/in-progress/complete]
[ ] Step 2: Choose Your Location
    Status: [pending/in-progress/complete]
[ ] Step 3: Build a Sustainable Financial Plan
    Status: [pending/in-progress/complete]
[ ] Step 4: Optimize Your Health
    Status: [pending/in-progress/complete]
[ ] Step 5: Build Your Social and Purpose Network
    Status: [pending/in-progress/complete]

Timeline: ______ weeks
Overall Status: [IN PROGRESS / COMPLETE]
```

**Adaptation notes:**
- Adjust timeline based on user's availability and prior experience
- Steps may be reordered if dependencies allow parallel execution
- Skip optional steps if time or budget is constrained

## Edge Cases

- **Planning only finances:** Money enables retirement but does not define it. Purpose, health, and relationships matter as much as the portfolio.
- **Underestimating healthcare costs:** Healthcare is often the largest retirement expense after housing. Plan for it comprehensively.
- **Social isolation:** Losing work colleagues without replacing social connections leads to depression and cognitive decline. Build community intentionally.
- **No structure:** Complete freedom sounds appealing but often leads to purposeless drifting. Build a weekly structure with flexibility.

## Example

**Input:** "I want to plan retirement lifestyle and need a structured plan to follow step by step."

**Output:**

**Step 1 (life-coach):** Create Your Retirement Vision -- produces concrete deliverables for this phase.

**Step 2 (goal-setter):** Choose Your Location -- produces concrete deliverables for this phase.

**Step 3 (retirement-planner):** Build a Sustainable Financial Plan -- produces concrete deliverables for this phase.

**Step 4 (habit-tracker):** Optimize Your Health -- produces concrete deliverables for this phase.

**Step 5 (goal-setter):** Build Your Social and Purpose Network -- produces concrete deliverables for this phase.

**Result:** User has a complete plan retirement lifestyle plan with all deliverables produced, validated, and ready for implementation.
