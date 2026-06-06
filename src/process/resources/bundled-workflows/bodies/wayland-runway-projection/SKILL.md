---
name: wayland-runway-projection
description: >-
  Project runway across bear/base/bull scenarios with a date-of-zero per
  scenario and action triggers.

  Use when the user wants a structured multi-step process to project cash
  runway and set the rules for what to do as cash falls.

  Do NOT use for a single runway number an atomic finance skill can answer.
license: Apache-2.0
type: workflow
skills: "finance-forecast finance-cashflow finance-report"
metadata:
  author: wayland
  version: 1.0.0
  tags: business-finance runway cashflow step-by-step cfo
  category: business-finance
  depends: "finance-forecast finance-cashflow finance-report"
---
# Runway Projection

**Estimated time:** 15-25 minutes

This workflow projects runway across three scenarios, with a date-of-zero per
scenario and action triggers. Act as the CFO: gather the starting state, infer
the burn trajectory, build the three projections, and set the action triggers.
The projection step is followed by a review checkpoint where the user can
refine assumptions before proceeding.

**Step 1: Kickoff and gather starting state** (uses: finance-forecast)

Tell the user you will project runway across three scenarios with date-of-zero
and action triggers. Ask for: current cash, current monthly burn (or net burn
after revenue), and any committed inflows or outflows such as debt payments,
scheduled payroll, or an expected raise. For cash and burn figures, offer to
read any file dropped into the chat (bank export, P&L) or pull from a connected
source (Stripe payouts, or the connected ledger, database, or Google Sheets
workbook). If neither is set up, ask them to attach the bank export.

- Input: current cash, monthly burn, committed inflows/outflows; bank/P&L file
- Output: starting_state (the agreed cash and burn position)
- Key focus: a real cash and burn position, including committed commitments

**Step 2: Infer the burn trajectory** (uses: finance-cashflow)

From the starting state, infer the burn trajectory: whether burn is flat,
growing, or declining. Present it with reasoning so the user can sanity-check
the direction before projecting.

- Input: starting_state
- Output: trajectory (flat, growing, or declining burn)
- Key focus: get the direction of burn right, since it drives date-of-zero

**Step 3: Build the three projections** (uses: finance-forecast)

Build runway projections in runway_three_scenarios mode from the starting state
and the burn trajectory: a date-of-zero per scenario across bear/base/bull.
Show the output.

- Input: starting_state, trajectory
- Output: projections (date-of-zero per scenario)
- Key focus: a clear date-of-zero for each scenario

**Step 4: Review and refine projections** (uses: finance-forecast)

Present the three projections and ask whether to proceed to action triggers or
refine assumptions, for example expected revenue ramp or planned hires. If the
user wants changes, capture feedback and rebuild the projections, then
re-present. Loop up to three passes, then proceed.

- Input: projections, user refinement feedback
- Output: approved projections
- Key focus: projections the user agrees reflect the real plan

**Step 5: Build action triggers** (uses: finance-report)

Build action triggers in action_triggers mode from the approved projections:
"if cash hits X, do Y" decision rules tied to the date-of-zero. Show the
output.

- Input: approved projections
- Output: triggers (cash-level action rules)
- Key focus: concrete triggers that fire before it is too late to act

**Step 6: Final review and ship** (uses: finance-report)

Present the action triggers and ask whether to ship or refine. If the user
wants changes, capture feedback and rebuild the triggers (up to two passes),
then re-present. On approval, assemble and deliver the runway memo with
sections for starting state, burn trajectory, projections, and action triggers.

- Input: triggers, user feedback, all prior outputs
- Output: runway_memo (the shipped runway memo)
- Key focus: one memo with the date-of-zero and the triggers up front
