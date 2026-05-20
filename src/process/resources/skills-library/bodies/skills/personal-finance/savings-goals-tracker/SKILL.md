---
name: savings-goals-tracker
description: |
  Maps multiple savings goals (vacation, down payment, education, large purchase) against available monthly surplus, prioritizes competing goals, and creates a funded allocation plan with timelines for each goal. Produces a savings tracker with monthly contribution amounts and milestone dates.
  Use when the user has multiple savings goals and needs to decide how to split available funds across them.
  Do NOT use for emergency fund planning (use emergency-fund-planner), investment allocation, or retirement planning.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "budgeting personal-finance savings goal-setting"
  category: "personal-finance"
  subcategory: "budgeting"
  depends: ""
  disclaimer: "educational-finance"
  difficulty: "beginner"
---
# Savings Goals Tracker

> **Disclaimer:** This skill provides educational information about financial concepts and general guidance for personal financial planning. It does NOT constitute financial advice, investment recommendations, or tax guidance. Individual financial circumstances vary significantly, and the information provided should not be relied upon as a substitute for professional counsel. Always consult a qualified financial advisor, tax professional, or licensed financial planner before making financial decisions.

---

## When to Use

**Use this skill when the user:**
- Has two or more named savings goals competing for the same monthly surplus and needs to know how much to put toward each
- Asks how long it will take to reach a savings target given their current or planned monthly contribution
- Has a hard-deadline goal (vacation departing in June, tuition due in August) alongside open-ended aspirational goals and cannot fully fund both simultaneously
- Wants to build a month-by-month savings roadmap with projected balances so they can track progress and catch drift early
- Just completed one savings goal (paid off a specific debt, funded a vacation) and wants to redistribute those freed-up dollars across remaining goals
- Is trying to decide between funding one goal quickly (sequential) versus advancing all goals at once (parallel) and needs to see the tradeoff in numbers
- Received a windfall -- bonus, tax refund, inheritance, sale of an asset -- and wants to apply it optimally across existing savings goals

**Do NOT use when:**
- The user's primary need is sizing or building an emergency fund -- use `emergency-fund-planner`, which applies the 3-to-6-month-expenses methodology specific to that goal
- The user has no working budget yet and does not know their monthly surplus -- use `budget-planning` first to establish income minus expenses before this skill can produce meaningful allocations
- The goal involves any form of investment return, expected capital appreciation, or dollar-cost averaging -- even a house down payment managed in an investment account falls under investing skills, not this skill
- The user is planning for retirement (time horizon longer than 20 years, involving tax-advantaged accounts like 401(k) or IRA) -- use retirement planning skills
- The user wants to reduce debt rather than accumulate savings -- use `debt-payoff-planner`, which uses avalanche or snowball methodology applied to liability reduction
- The user's only goal is tracking daily or monthly spending categories -- use `expense-tracking-setup`
- The user wants to know whether to invest their surplus rather than save it -- that is a risk-tolerance and asset-allocation question outside this skill's scope

---

## Process

### Step 1 -- Inventory Every Savings Goal

Collect the following for EACH goal before doing any calculation. Do not skip fields; a missing deadline or current balance will make the funding plan unreliable.

- **Goal name:** Use the user's own language ("Europe trip," not "vacation"). Specificity matters for motivation and for distinguishing goals with similar characters.
- **Target amount:** The total dollars needed to declare the goal complete. For a vacation, this should include flights, hotel, spending money, and travel insurance -- not just the flight alone. For a house down payment, confirm whether they mean 3.5% (FHA minimum), 10%, or 20% (to avoid PMI) since these can vary by 400% on the same home price.
- **Current balance saved toward this goal:** Distinguish money already earmarked for this specific goal from general checking account balance. Do not count money that serves double-duty (emergency fund, bill float) as progress toward a savings goal.
- **Deadline:** Distinguish between hard deadlines (tuition due date, lease start, flight departure), soft deadlines (Christmas, "by next summer"), and open-ended targets ("someday," "within a few years").
- **Deadline flexibility:** Hard deadlines cannot move. Soft deadlines can flex 1-3 months without meaningful consequence. Open-ended goals can be extended without penalty but should still receive a planning horizon for calculation purposes -- assign a default of 36 months if the user says "no rush."
- **Amount flexibility:** Can the user reduce the target? A $3,000 vacation can become $2,200 if needed. A $20,000 car down payment is more fixed if tied to loan qualification thresholds.
- **Priority rank:** Ask the user to rank goals relative to each other on a 1-to-N scale. This is NOT the same as the tier system applied later. User preference and mathematical urgency sometimes diverge, and both should be visible in the output.

---

### Step 2 -- Establish the True Monthly Surplus

The quality of the entire plan depends on an accurate surplus figure. Apply these verification steps:

- **Start with net monthly income** (after taxes, benefits deductions, and any mandatory retirement contributions already in place).
- **Subtract actual recurring expenses**, not budgeted ones. Ask the user to use their last two months of bank or credit card statements rather than what they think they spend. People systematically underestimate variable categories (groceries, dining, personal care) by 15-30%.
- **Subtract any current savings contributions** that are already automated (automatic transfer to existing accounts, automatic investment contributions). These are not part of the free surplus unless the user is willing to redirect them.
- **Check for irregular expenses:** Property taxes paid annually, car registration, insurance premiums paid semi-annually, holiday gifts, annual subscriptions. Divide these by 12 and subtract from monthly surplus as a "sinking fund reserve" that is already spoken for.
- **Apply a 5-10% planning buffer.** Unexpected expenses occur every month on average. A surplus of $700 should be planned as $630-$665 to avoid the plan breaking on the first minor variance.
- **Identify expected changes within 12 months:** Known raise effective date, lease renewal with rent increase, loan payoff freeing up cash, new childcare expense starting. Note these but do not include them in the base plan -- show them as optional upside scenarios.

---

### Step 3 -- Classify Goals into Funding Tiers

Apply this tier system after collecting user priority -- it is based on math and consequence, not preference:

**Tier 1 -- Non-Negotiable (Fixed Deadline, Fixed Amount, Real Consequences for Missing):**
Examples: tuition payment due by a specific date, security deposit for a signed lease, a wedding with booked vendors, a medical procedure scheduled. Missing a Tier 1 goal has financial or contractual consequences. Fund these first, always, regardless of user preference.

**Tier 2 -- Time-Sensitive (Soft Deadline, Moderate Consequence for Missing):**
Examples: a vacation booked but not yet paid for, a car replacement before winter, holiday gifts. Missing a Tier 2 deadline is inconvenient and may cost some money (rebooking fees, higher prices later) but is not catastrophic. These get funded next.

**Tier 3 -- Aspirational (Open-Ended or Multi-Year, No Near-Term Consequence):**
Examples: house down payment, education fund, dream trip, home renovation. Missing a Tier 3 timeline has no immediate consequence but delays life goals. Fund these after Tier 1 and Tier 2 are covered.

**Override rule:** If the user's stated priority conflicts with the tier, surface the conflict explicitly. ("You ranked the down payment as your #1 priority, but the vacation has a hard departure in 4 months and will be lost if not funded. I'll fund the vacation as Tier 2 first. Want to proceed?")

---

### Step 4 -- Calculate the Mathematics for Each Goal

Run these calculations for every goal before building the allocation plan:

- **Remaining amount** = Target Amount -- Current Balance Saved
- **Months available** = Number of full months between today and the deadline (round down for hard deadlines; if today is April 15 and the deadline is June 1, that is 1.5 months -- treat as 1 month for a hard deadline, 2 months for a soft one)
- **Required monthly contribution (RMC)** = Remaining Amount / Months Available
- **Funded check:** Compare RMC against the available surplus share. If RMC for a single goal exceeds the entire available surplus, flag it immediately before proceeding.
- **Sum of all RMCs** = Total monthly savings required if all goals are funded in parallel by their deadlines
- **Gap amount** = Sum of all RMCs -- Available Monthly Surplus (a positive gap means a shortfall; a negative gap means the user has slack)
- **Sequential completion order:** If funding sequentially, calculate when Goal 1 completes, then rerun Goal 2's RMC using (Goal 1 completion date + today) as the new start date, with that freed contribution added to Goal 2's monthly amount.

**Handling open-ended goals without deadlines:** Assign a default planning horizon of 36 months for calculation purposes but label it as an assumed horizon. Then calculate the RMC. Also show what the contribution would need to be at 24 months and 48 months so the user can see the sensitivity.

---

### Step 5 -- Choose and Recommend a Funding Strategy

There are four main strategies. Recommend the one that fits the user's tier structure and gap analysis, but present the alternatives with their tradeoffs:

**Strategy A -- Full Parallel Funding:**
Every goal receives its required monthly contribution simultaneously. Use this only when the sum of all RMCs is less than or equal to the available surplus. Advantage: all goals advance on schedule. Disadvantage: requires the most surplus; no buffer for variance.

**Strategy B -- Tiered Parallel Funding:**
Tier 1 goals receive full RMC. Tier 2 goals receive full or proportional RMC. Tier 3 goals receive whatever remains. This is the most common real-world scenario. Tier 3 timelines will extend beyond their original estimates -- calculate the new expected completion dates explicitly.

**Strategy C -- Sequential Funding (Waterfall Method):**
Fund Goal 1 to completion, then redirect that full monthly amount plus any surplus to Goal 2, and so on. Monthly savings compound per goal because each completed goal's contribution rolls forward. Use this when goals are all Tier 3, or when the surplus is too small to meaningfully advance multiple goals at once. Minimum useful parallel contribution is approximately $50/month per goal -- below that, sequential is more motivating and nearly as efficient.

**Strategy D -- Hybrid (Parallel for Tier 1/2, Sequential for Tier 3):**
This is the default recommendation when goals span multiple tiers. Fund all time-sensitive goals in parallel, then use the waterfall method for the aspirational queue. Present this as the plan unless the user's gap analysis forces a different approach.

**Slack allocation rule:** If the sum of all RMCs is less than the available surplus (the user has slack), do not just leave it unallocated. Offer to accelerate the lowest-tier goal's timeline or build a small buffer contribution into each goal. Unallocated surplus often drifts into lifestyle inflation rather than savings.

---

### Step 6 -- Resolve Funding Shortfalls

When the gap is positive (total RMC exceeds available surplus), present options in this order -- do not just say the plan is impossible:

1. **Extend the timeline of lower-tier goals.** Recalculate Tier 3 completion dates assuming only the leftover surplus after Tier 1 and Tier 2 are funded. Show the new expected dates numerically.
2. **Reduce the target amount.** For flexible-amount goals, identify how much the target can shrink to fit the available monthly contribution. For example: "At $200/month, you can fund a $1,600 vacation in 8 months instead of $2,400 in 12 months -- would a shorter trip work?"
3. **Stage the goal.** Break large goals into phases. A $25,000 down payment becomes "Phase 1: accumulate $5,000 (closing cost buffer) in 12 months, Phase 2: continue building toward 10% down over the following 30 months."
4. **Identify surplus expansion levers.** Ask the user whether any known income increase or expense reduction is expected within 6 months. Do not project it into the plan, but note it as an upside scenario.
5. **Find one-time accelerators.** Tax refunds (average U.S. federal refund is approximately $3,000), annual bonuses, side income, items to sell. Treat these as optional injections that can close gaps without changing the base monthly plan.

---

### Step 7 -- Build the Tracking Plan and Review Cadence

A savings plan without a tracking structure fails within 2-3 months as life disrupts contributions. Include these components:

- **Month-by-month projection table** for at least 6 months (or through the first goal's completion, whichever is longer). Show running balance per goal at end of each month.
- **Progress bar representation** using percentage (Current Balance / Target x 100). This is the single most motivating data point for ongoing engagement.
- **Milestone markers** in the projection table: the month a goal reaches 25%, 50%, 75%, and 100% is worth calling out explicitly.
- **Reallocation trigger:** Define exactly what happens to freed-up monthly contributions when a goal is completed. Write this as a specific instruction ("When the vacation goal is funded, redirect the $400/month to the laptop goal, increasing its monthly contribution from $100 to $500").
- **Review cadence:** Monthly balance check (5 minutes: update actuals vs. projection). Quarterly full review (30 minutes: re-examine priorities, adjust for life changes). Annual reset (reassign tiers, add new goals, recalibrate surplus).
- **Variance rule:** If actual balance is more than 10% below projection in any given month, the plan needs a correction -- not just a catch-up in the next month. Identify whether the cause is a one-time event (medical bill, car repair) or a structural issue (surplus was overestimated).

---

### Step 8 -- Present the Emergency Fund Check

Before finalizing any plan, verify emergency fund status. This is a gatekeeping step, not optional:

- **No emergency fund at all:** Insert "Emergency Fund Starter" as a mandatory Goal 0 before all other goals. Set the starter target at $1,000 (covers most common single financial shocks). Direct the full surplus to this goal until it is funded. Timeline: if the surplus is $400/month, this takes 2.5 months. Only then begin the goals plan.
- **Starter fund exists ($500-$1,500) but not a full 3-month fund:** Allow the goals plan to proceed in parallel, but reserve 10-15% of the monthly surplus for continued emergency fund building. Do not let this compete with Tier 1 goals; reduce Tier 3 contributions instead.
- **Full emergency fund already in place:** Confirm verbally and proceed. Do not re-analyze its size -- that is `emergency-fund-planner`'s job.
- **User resists the emergency fund check:** Document the check in the output ("Note: Emergency fund status not confirmed. If no emergency fund exists, a single unexpected expense will likely interrupt this savings plan.") and continue.

---

## Output Format

Produce the following sections in this exact order. All amounts rounded to the nearest whole dollar. All percentages rounded to one decimal place.

```
## Savings Goals Plan -- [Month Year]

> Emergency Fund Status: [Confirmed / Not confirmed / Building -- $X saved of $Y target]

---

### Your Monthly Savings Capacity

| Metric                                    | Amount    |
|-------------------------------------------|-----------|
| Monthly after-tax income                  | $X,XXX    |
| Monthly fixed + variable expenses         | $X,XXX    |
| Irregular expense reserve (annual ÷ 12)   | $XXX      |
| Planning buffer (5-10%)                   | $XXX      |
| **Available monthly surplus (usable)**    | **$XXX**  |

---

### Goals Inventory

| # | Goal Name          | Target    | Currently Saved | Remaining  | Deadline         | Deadline Type | Priority  |
|---|--------------------|-----------|-----------------|------------|------------------|---------------|-----------|
| 1 | [Goal Name]        | $X,XXX    | $X,XXX          | $X,XXX     | [Month Year]     | Hard/Soft/Open| Tier 1/2/3|
| 2 | [Goal Name]        | $X,XXX    | $XXX            | $X,XXX     | [Month Year]     | Hard/Soft/Open| Tier 1/2/3|
| 3 | [Goal Name]        | $X,XXX    | $0              | $X,XXX     | Open (~36 mo)    | Open          | Tier 3    |
|   | **TOTALS**         | $XX,XXX   | $X,XXX          | **$XX,XXX**|                  |               |           |

---

### Funding Gap Analysis

| Metric                                         | Amount    |
|------------------------------------------------|-----------|
| Total remaining across all goals               | $XX,XXX   |
| Required monthly (all goals funded in parallel)| $XXX      |
| Available monthly surplus                      | $XXX      |
| **Gap (positive = shortfall, negative = slack)**| **$XXX** |
| Funding status                                 | [Fully Funded / Shortfall / Slack Available] |

---

### Recommended Strategy: [Strategy Name]

**Why this strategy:** [2-3 sentence explanation of why this strategy fits this user's specific tier mix and gap analysis.]

**Alternative considered:** [Name the alternative strategy and one-sentence reason it was not chosen.]

---

### Monthly Allocation Plan

| Goal Name          | Monthly Contribution | Funding Mode          | Months Remaining | Projected Completion |
|--------------------|---------------------|-----------------------|------------------|----------------------|
| [Goal 1]           | $XXX                | Parallel -- Full RMC  | X months         | [Month Year]         |
| [Goal 2]           | $XXX                | Parallel -- Partial   | X months         | [Month Year]         |
| [Goal 3]           | $XXX                | Sequential -- Phase 2 | X months (est.)  | [Month Year]         |
| **Total Allocated**| **$XXX**            |                       |                  |                      |
| **Unallocated Slack** | **$XXX**         | [Recommend: buffer / accelerate Goal X] | |              |

---

### Progress Snapshot (Today)

| Goal Name          | Progress Bar         | Current   | Target    | % Complete |
|--------------------|----------------------|-----------|-----------|------------|
| [Goal 1]           | ████░░░░░░ 40%       | $X,XXX    | $X,XXX    | 40.0%      |
| [Goal 2]           | ██░░░░░░░░ 0%        | $0        | $X,XXX    | 0.0%       |
| [Goal 3]           | ░░░░░░░░░░ 0%        | $0        | $X,XXX    | 0.0%       |

---

### Month-by-Month Projection

| Month     | [Goal 1]   | [Goal 2]  | [Goal 3]  | Total Cumulative |
|-----------|------------|-----------|-----------|-----------------|
| Month 1   | $X,XXX     | $XXX      | $XXX      | $X,XXX          |
| Month 2   | $X,XXX     | $XXX      | $XXX      | $X,XXX          |
| Month 3   | $X,XXX ✓   | $XXX      | $XXX      | $X,XXX          |
| Month 4   | COMPLETE   | $X,XXX    | $XXX      | $X,XXX          |
| Month 5   | --         | $X,XXX    | $XXX      | $X,XXX          |
| Month 6   | --         | $X,XXX    | $XXX      | $X,XXX          |

✓ = Milestone month  COMPLETE = Goal reached, contribution reallocated

---

### Reallocation Triggers

When **[Goal 1]** is funded (projected [Month Year]):
→ Redirect $[XXX]/month to [Goal 2], bringing its monthly contribution from $[XXX] to $[XXX].
→ New projected completion for [Goal 2]: [Month Year].

When **[Goal 2]** is funded (projected [Month Year]):
→ Redirect $[XXX]/month to [Goal 3], bringing its monthly contribution from $[XXX] to $[XXX].
→ New projected completion for [Goal 3]: [Month Year].

---

### Sensitivity Analysis

| Scenario                                    | Impact on [Lowest-Priority Goal]          |
|---------------------------------------------|------------------------------------------|
| Contribute $50/month more (e.g., small cut) | Completes [X] months earlier             |
| Contribute $100/month more                  | Completes [X] months earlier             |
| One-time $500 injection (tax refund, etc.)  | Reduces timeline by [X] months           |
| Miss 1 month of contributions               | Extends by [X] months -- recalibrate     |
| Surplus drops by 20% unexpectedly           | Extend [Goal X] deadline by [X] months, or reduce target by $[XXX] |

---

### Review Checklist

| Frequency  | Action                                                                 |
|------------|------------------------------------------------------------------------|
| Monthly    | Update actual balances; compare to projection; flag any >10% variance  |
| Quarterly  | Re-rank goals if life has changed; adjust surplus estimate if needed   |
| At completion | Activate next reallocation trigger; add new goal if desired       |
| Annually   | Full reset -- re-tier all goals, recalculate surplus, add new goals    |
```

---

## Rules

1. **Always verify the emergency fund before allocating to any goal.** If the user has no emergency fund, insert a $1,000 starter as a mandatory first goal. A savings plan built on a zero emergency fund will be interrupted by the first car repair or medical co-pay. This is not optional.

2. **Never accept the user's stated surplus at face value without a reasonability check.** If someone says their surplus is $2,000/month on a $55,000/year income, the math does not hold -- net monthly income would be approximately $3,800, leaving $1,800 for all living expenses, which is implausible in most U.S. cities. Surface the discrepancy politely and ask for clarification rather than building a plan on a flawed foundation.

3. **Distinguish hard deadlines from soft ones in every calculation.** A tuition payment due October 1st requires the money to be available September 25th -- not October 1st. Build in a 5-business-day buffer for hard deadlines that involve transfers or account processing time.

4. **Never allocate zero to a Tier 1 goal.** Even if funding the Tier 1 goal requires putting $0 toward every other goal for several months, Tier 1 goals receive their full required monthly contribution first. The plan should be sequenced, not compromised.

5. **Show the cost of a shortfall in concrete time, not just dollars.** "You have a $150/month shortfall" is less motivating than "If the shortfall is not resolved, your vacation goal will be delayed from June to November -- 5 months later." Always translate dollar gaps into timeline consequences.

6. **Round monthly contributions to whole dollars.** Do not produce contribution amounts like $217.43/month. Round to the nearest $5 or $10 for practical usability. Reallocate rounding differences to the highest-priority goal.

7. **Never prescribe which goals the user should have, remove, or downsize.** Offer the mathematical tradeoffs when goals exceed available surplus, but let the user decide. Saying "you don't really need that vacation" is outside the scope of this skill and likely to erode trust.

8. **Present the sensitivity analysis for the lowest-priority goal.** Users can influence their outcomes through small behavioral changes. Showing that $50 extra per month shaves 4 months off the down payment timeline is more actionable than the aggregate plan alone.

9. **Do not count windfalls as recurring income in the base plan.** A tax refund, bonus, or inheritance can appear in the sensitivity analysis as an optional accelerator but must not be baked into the monthly contribution calculation. Plans built on non-guaranteed income break when that income does not materialize.

10. **When two goals have the same hard deadline and the combined RMC exceeds surplus, flag it as a critical constraint immediately** -- before building any further plan. Do not bury this conflict inside a table. State it plainly in a clearly labeled conflict notice, then offer resolution options: reduce one target, extend one deadline (even a hard one, if the user accepts the consequences), or identify an income/windfall accelerator.

11. **The minimum meaningful monthly contribution to any single goal is $25.** Below this, the psychological overhead of tracking a goal with negligible monthly progress outweighs the benefit. If leftover surplus would allocate less than $25 to a goal, either hold it as an unallocated buffer or round it into the next-highest-priority goal until the surplus grows.

12. **Label all open-ended goal timelines as estimates, not commitments.** A "36-month assumed horizon" for a down payment goal should always carry a label like "(est. -- adjust quarterly)" because the user's life will change more than the math can predict at this time horizon.

---

## Edge Cases

### Surplus Is Insufficient for Even Tier 1 Goals
If the user's available monthly surplus cannot fund a Tier 1 goal by its hard deadline even with 100% allocation, the plan must immediately escalate. Do not produce a partial funding plan that implies the goal is achievable when it is not. Instead: (1) calculate the exact shortfall in total dollars, (2) state the minimum monthly contribution needed and what that requires cutting from expenses, (3) identify whether a lump-sum accelerator (tax refund, selling an item, a short-term side gig) could close the gap, (4) if none of these are viable, state clearly that the deadline cannot be met at the current income-to-expense ratio and suggest using `budget-planning` before returning to this skill.

### User Wants to Save for Something With a Variable Cost Target
Some goals have uncertain targets -- a house down payment in a rising market, a car whose price depends on what is available, college tuition 10 years from now. Apply a 10-15% cost buffer on top of the user's stated target for medium-term goals (1-5 years) and a 20-25% buffer for long-term goals (5+ years). Label the buffer explicitly: "Target: $25,000 + 15% buffer = $28,750 planning target." This prevents the user from reaching their "number" and discovering it is no longer enough.

### User Has Already Started Multiple High-Yield Savings Accounts for Each Goal
This is the ideal setup and should be affirmed. When a user has separate, labeled savings accounts per goal, the plan should map contribution amounts directly to each account. Note that high-yield savings accounts (HYSAs) typically compound interest monthly, which marginally accelerates progress. For simplicity, do not model interest in the projection table -- that makes balances slightly better than projected, which is a positive variance to celebrate rather than a problem to fix. Mention this as a bonus.

### User Has a Windfall to Allocate Immediately
Follow this allocation sequence: (1) top up the emergency fund to 1-month expenses first if it is below that threshold, (2) then apply to Tier 1 goals in full until they are complete or the windfall is exhausted, (3) then apply to Tier 2 goals, (4) then Tier 3 goals in priority order. Show the before-and-after timeline comparison explicitly -- the user should see concretely how many months the windfall eliminates from each goal's timeline. Do not recommend what to do with any windfall remainder beyond the goals in scope.

### User's Income Is Irregular (Freelancer, Commission-Based, Seasonal)
A fixed monthly contribution plan breaks down when income varies month to month by 50% or more. Instead of a fixed monthly amount, build a percentage-based plan. Define each goal's allocation as a percentage of that month's actual surplus rather than a fixed dollar amount. For example: "Vacation: 45% of surplus this month. Laptop: 10% of surplus. Down payment: 35% of surplus. Buffer: 10%." The timelines will be expressed as ranges ("10-16 months depending on income variance") rather than single dates. Ask the user for their average monthly surplus AND their low-income month estimate -- use the low-income month estimate as the base for the plan's Tier 1 calculations.

### One Goal Is Partially Funded Through a Non-Cash Mechanism
Sometimes a goal is partially "funded" through credit card rewards points (e.g., $400 toward a flight), employer travel benefits, gift contributions from family, or a matching program. These reduce the cash savings target but should not be counted until the user is certain they will be redeemed for this goal. Treat confirmed, already-earned rewards as a deduction from the remaining amount with a label: "Target: $3,000. Cash needed: $2,600 (assumes $400 in confirmed travel rewards redeemed)." Flag unearned or speculative contributions as footnotes only.

### User Completes a Goal and Wants to Add a New One Mid-Plan
When a user returns having completed a goal and wants to add a new savings target, restart the process from Step 1 for the new goal only. Do not rebuild the entire plan. Slot the new goal into the existing tier structure based on its deadline and consequence profile. Update the monthly allocation table and reallocation triggers to reflect the addition. Remind the user that the new goal's addition may delay previously projected completion dates for existing Tier 3 goals.

### User Has Conflicting Stated Priorities and Mathematical Realities
A common scenario: the user ranks "house down payment" as #1 but also has a vacation with a booked, non-refundable flight departing in 3 months that needs $1,400 more. The math says the vacation must receive priority contribution, but the user's stated priority disagrees. Handle this by naming the conflict directly: "Your stated #1 is the down payment, but the vacation has a hard deadline in 3 months with a non-refundable booking -- if the vacation isn't funded, you lose the booking cost. I'm recommending the vacation as Tier 2 for the next 3 months, then shifting full focus to the down payment. Does that work for you?" Always get explicit user agreement before overriding a stated priority.

---

## Example

**Input:** "I take home about $4,200/month after taxes. My expenses run around $3,400/month including rent, food, utilities, and subscriptions -- but I also pay $600 for car insurance once in June and $300 for an Amazon Prime-type annual membership every January. I have $400 already saved toward a Paris trip ($4,500 target, need to pay by March, which is 5 months away). I also want a new laptop for $1,200 (no rush, maybe by fall) and I'm trying to save for a house down payment -- I think I need about $30,000 for a 10% down on a $300,000 home. I have a $2,000 emergency fund already. My income might go up $300/month in 6 months but nothing is confirmed."

---

**Output:**

## Savings Goals Plan -- November 2024

> Emergency Fund Status: Confirmed -- $2,000 in place. Note: A starter fund exists but a full 3-to-6-month fund ($10,200-$20,400 based on your expenses) is not yet in place. Emergency fund growth is NOT included in this plan -- use emergency-fund-planner to address this separately if desired.

---

### Your Monthly Savings Capacity

| Metric                                    | Amount   |
|-------------------------------------------|----------|
| Monthly after-tax income                  | $4,200   |
| Monthly fixed + variable expenses         | $3,400   |
| Irregular expense reserve ($900/yr ÷ 12)  | $75      |
| Planning buffer (5%)                      | $37      |
| **Available monthly surplus (usable)**    | **$688** |

**Irregular expense detail:** Car insurance $600 in June + $300 annual membership = $900/year = $75/month reserved. This money is set aside monthly and is not available for goal savings.

**Income note:** A potential $300/month raise in approximately 6 months is noted but NOT included in the base plan. If and when it materializes, you could accelerate the down payment by roughly 10 months. Revisit the plan at that point.

---

### Goals Inventory

| # | Goal Name       | Target   | Currently Saved | Remaining | Deadline         | Deadline Type | Tier   |
|---|-----------------|----------|-----------------|-----------|------------------|---------------|--------|
| 1 | Paris Trip      | $4,500   | $400            | $4,100    | March 2025 (~5 mo)| Hard        | Tier 2 |
| 2 | Laptop          | $1,200   | $0              | $1,200    | Sept 2025 (~10 mo)| Soft        | Tier 3 |
| 3 | House Down Pmt  | $33,000* | $0              | $33,000   | Open (~36 mo est.)| Open        | Tier 3 |
|   | **TOTALS**      | $38,700  | $400            | **$38,300**|                 |               |        |

*$30,000 target + 10% planning buffer ($3,000) = $33,000 planning target. Home prices and required down payment amounts shift. The buffer protects against arriving at your number and finding it is no longer sufficient.

---

### Funding Gap Analysis

| Metric                                              | Amount    |
|-----------------------------------------------------|-----------|
| Total remaining across all goals                    | $38,300   |
| Required monthly (all goals parallel, original timelines) | $990 |
| Available monthly surplus                           | $688      |
| **Gap (positive = shortfall)**                      | **$302**  |
| Funding status                                      | Shortfall -- parallel funding not fully achievable at current surplus |

**Breakdown of the $990 parallel requirement:**
- Paris Trip: $4,100 ÷ 5 months = $820/month (hard deadline -- this is non-negotiable)
- Laptop: $1,200 ÷ 10 months = $120/month
- Down payment: $33,000 ÷ 36 months = $917/month (open-ended -- this drives the majority of the gap)

The core issue: funding the Paris trip at its required $820/month leaves only $688 -- $820 = -$132/month in surplus. The Paris trip alone exceeds available surplus. This requires immediate resolution before building the rest of the plan.

**Conflict Notice -- Paris Trip Underfunding:**
At $688/month total surplus, even allocating every dollar to the Paris Trip produces only $688 x 5 = $3,440 plus the $400 already saved = $3,840 by March -- $660 short of the $4,500 target. Action required: choose one of the following options:
- **Option 1:** Reduce the Paris trip budget from $4,500 to $3,840 (shorter itinerary, fewer splurges, economy class)
- **Option 2:** Identify a one-time $660 injection before March (tax refund submitted early, item sold, etc.)
- **Option 3:** Extend the trip payment deadline by 1 month to April (confirm with airline and hotel whether this is possible)

**For this plan, we assume Option 1: Paris trip budget reduced to $3,840, bringing the remaining amount to $3,440.**

---

### Recommended Strategy: Hybrid Tiered (Tier 2 Priority + Sequential Tier 3)

**Why this strategy:** The Paris trip has a hard payment deadline in 5 months and cannot be funded in parallel with meaningful down payment contributions at this surplus level. All available monthly surplus is directed to Paris first. After Paris is funded in Month 5, contributions waterfall to the laptop (fully funded in approximately 4 months), then the remainder flows entirely to the down payment.

**Alternative considered:** Full parallel funding across all three goals was evaluated but requires $990/month -- $302 more than available surplus. Parallel funding of just Paris and Laptop was also considered, but the laptop contribution would be only $68/month, extending the laptop goal by 8+ months with minimal benefit. Sequential funding is more efficient in this case.

---

### Monthly Allocation Plan

| Goal Name          | Monthly Contribution | Funding Mode             | Months Remaining | Projected Completion |
|--------------------|---------------------|--------------------------|------------------|----------------------|
| Paris Trip         | $688                | Sequential -- 100% surge | 5 months         | March 2025           |
| Laptop             | $0 now → $688 later | Sequential -- Phase 2    | ~2 months (est.) | May 2025             |
| House Down Pmt     | $0 now → $688 later | Sequential -- Phase 3    | ~44 months (est.)| Jan 2028 (est.)      |
| **Total Allocated**| **$688**            |                          |                  |                      |
| **Unallocated Slack** | **$0**           | None -- fully committed to Paris surge |       |                      |

**Note on Laptop:** Once Paris is complete (Month 5), all $688/month flows to the $1,200 laptop. It funds in under 2 months. Then the full $688/month shifts to the down payment.

**Note on Down Payment:** $688/month starting approximately Month 7 (May 2025) toward $33,000 = approximately 48 months to completion without any raises or windfalls. If the anticipated $300/month raise materializes in Month 6, down payment monthly contribution becomes $988/month and the timeline compresses to approximately 34 months (July 2027). Revisit the plan when the raise is confirmed.

---

### Progress Snapshot (November 2024)

| Goal Name       | Progress Bar          | Current | Target   | % Complete |
|-----------------|-----------------------|---------|----------|------------|
| Paris Trip      | █░░░░░░░░░ 10%        | $400    | $3,840   | 10.4%      |
| Laptop          | ░░░░░░░░░░ 0%         | $0      | $1,200   | 0.0%       |
| House Down Pmt  | ░░░░░░░░░░ 0%         | $0      | $33,000  | 0.0%       |

---

### Month-by-Month Projection

| Month      | Paris Trip   | Laptop   | Down Payment | Total Cumulative |
|------------|-------------|----------|--------------|-----------------|
| Nov 2024   | $1,088       | $0       | $0           | $1,088          |
| Dec 2024   | $1,776       | $0       | $0           | $1,776          |
| Jan 2025   | $2,464       | $0       | $0           | $2,464          |
| Feb 2025   | $3,152       | $0       | $0           | $3,152          |
| Mar 2025   | $3,840 ✓     | $0       | $0           | $3,840          |
| Apr 2025   | COMPLETE     | $688     | $0           | $4,528          |
| May 2025   | --           | $1,200 ✓ | $176         | $5,904          |
| Jun 2025   | --           | COMPLETE | $864         | $6,768          |
| Jul 2025   | --           | --       | $1,552       | $8,152          |
| Aug 2025   | --           | --       | $2,240       | $8,840          |

✓ = Goal reached. COMPLETE = Contribution reallocated to next goal.

*April 2025: Paris complete at end of March. Full $688/month to Laptop in April. Laptop is $488 short at start of April. Laptop funded by mid-May; remaining May surplus of $176 begins down payment.*

---

### Reallocation Triggers

When **Paris Trip** is funded (end of March 2025):
→ Redirect $688/month entirely to the Laptop starting April 2025.
→ Laptop remaining at that point: $1,200 (no contributions made during Paris phase).
→ Laptop fully funded mid-May 2025 (1.7 months at $688/month).

When **Laptop** is funded (approximately mid-May 2025):
→ Redirect the full $688/month to House Down Payment starting June 2025.
→ If the $300/month raise has arrived by this point, redirect $988/month to down payment.
→ New projected down payment completion: approximately January 2028 at $688/month, or approximately September 2027 at $988/month.

---

### Sensitivity Analysis

| Scenario                                            | Impact on House Down Payment              |
|-----------------------------------------------------|------------------------------------------|
| $300/month raise confirmed (Month 6)                | Timeline shortens from 44 to ~34 months -- saves ~10 months |
| One-time $3,000 tax refund applied in April 2025    | Reduces down payment timeline by ~4 months |
| Spend $50/month less (streaming, dining out, etc.)  | Shaves ~3 months off down payment timeline |
| Miss 2 months of contributions (emergency, etc.)    | Down payment extends by 2 months -- recalibrate at next quarterly review |
| Surplus drops by 20% to $550/month                  | Down payment timeline extends from 44 to ~55 months -- consider revisiting target or timeline |
| Home prices rise 10%, needing $36,300 instead        | Add ~5 months at current contribution rate; buffer partially absorbs this |

---

### Review Checklist

| Frequency     | Action                                                                                      |
|---------------|---------------------------------------------------------------------------------------------|
| Monthly       | Log actual balance for Paris Trip account; compare to projection; flag any gap >10%         |
| March 2025    | Confirm Paris fully funded; activate Laptop reallocation trigger immediately                |
| May 2025      | Confirm Laptop funded; activate Down Payment reallocation trigger; check raise status        |
| Quarterly     | Re-examine down payment target if home prices in your area have shifted significantly        |
| Annually      | Full reset -- re-tier all goals, recalculate surplus, add new goals, check emergency fund size |
| If raise confirmed | Return to this plan and rebuild the down payment projection with $988/month as the new base |
