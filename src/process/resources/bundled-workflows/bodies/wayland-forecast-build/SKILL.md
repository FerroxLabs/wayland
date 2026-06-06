---
name: wayland-forecast-build
description: >-
  Build a bottom-up 12-month forecast with explicit assumption checkpoints.
  Builds a revenue model and an expense model, consolidates them, and produces
  bear/base/bull scenarios.

  Use when the user wants a structured multi-step process to build a 12-month
  financial forecast from the ground up.

  Do NOT use for a quick projection an atomic finance skill can answer in one
  step.
license: Apache-2.0
type: workflow
skills: "finance-forecast finance-budget"
metadata:
  author: wayland
  version: 1.0.0
  tags: business-finance forecast planning step-by-step cfo
  category: business-finance
  depends: "finance-forecast finance-budget"
---
# Build a 12-Month Forecast

**Estimated time:** 45-60 minutes

This workflow builds a bottom-up 12-month forecast with explicit assumption
checkpoints. Act as the CFO: gather the starting state, infer a growth shape,
build a revenue model, build an expense model, consolidate them into a single
12-month view, and produce bear/base/bull scenarios. Each model is followed by
a review checkpoint where the user can refine assumptions before proceeding.

**Step 1: Kickoff and gather starting state** (uses: finance-forecast)

Tell the user you will build a 12-month bottom-up forecast. Ask for: current
revenue (last 3 months actual), customer count, average customer value, churn
estimate, and the current team plus any planned hires. For actuals, offer to
read any file dropped into the chat (P&L or revenue export) or pull from a
connected source (Stripe revenue, or the connected ledger, database, or Google
Sheets workbook). If neither is set up, ask them to attach the last 3 months
of revenue.

- Input: user-stated revenue, customers, ACV, churn, team, hires; actuals file
- Output: starting_state (the agreed starting position)
- Key focus: a real starting state grounded in the last 3 months of actuals

**Step 2: Infer the growth shape** (uses: finance-forecast)

From the starting state, infer the growth shape (linear, S-curve, or
step-function) and present it with reasoning. Ask the user to confirm or
override based on real conversion patterns they have seen.

- Input: starting_state
- Output: growth_shape (the confirmed growth shape)
- Key focus: a growth shape the user's own data supports

**Step 3: Build the revenue model** (uses: finance-forecast)

Build the revenue model in revenue_model mode from the starting state and the
confirmed growth shape: month by month, with the assumption stated per line.
Show the output.

- Input: starting_state, growth_shape
- Output: revenue_model (monthly revenue with per-line assumptions)
- Key focus: every month's number traceable to a stated assumption

**Step 4: Review and refine revenue** (uses: finance-forecast)

Present the revenue model and ask whether to proceed to expenses or refine
assumptions. If the user wants changes, capture feedback and rebuild the
revenue model, then re-present. Loop up to three passes, then proceed.

- Input: revenue_model, user refinement feedback
- Output: approved revenue_model
- Key focus: lock revenue assumptions before building expenses on them

**Step 5: Build the expense model** (uses: finance-budget)

Build the expense model in expense_model mode from the starting state and the
approved revenue model, so expenses scale with revenue and headcount plans.
Show the output.

- Input: starting_state, approved revenue_model
- Output: expense_model (monthly expense lines)
- Key focus: expenses that track the revenue plan and hiring schedule

**Step 6: Review and refine expenses** (uses: finance-budget)

Present the expense model and ask whether to proceed to the consolidated
forecast or refine the expense lines. If the user wants changes, capture
feedback and rebuild the expense model, then re-present. Loop up to three
passes, then proceed.

- Input: expense_model, user refinement feedback
- Output: approved expense_model
- Key focus: expense lines the user agrees are realistic

**Step 7: Consolidate the 12-month view** (uses: finance-forecast)

Consolidate the revenue and expense models into a single 12-month view in
consolidated_12_month mode: revenue, expenses, net, and ending cash by month.
Show the output.

- Input: approved revenue_model, approved expense_model
- Output: consolidated (the consolidated 12-month forecast)
- Key focus: a clean monthly P&L and cash view that ties out

**Step 8: Build bear/base/bull scenarios** (uses: finance-forecast)

Build three scenarios in bear_base_bull_scenarios mode from the consolidated
forecast, each telling a different decision story. Show the output.

- Input: consolidated
- Output: scenarios (bear, base, and bull forecasts)
- Key focus: three scenarios that each drive a distinct decision

**Step 9: Final review and ship** (uses: finance-forecast)

Present the three-scenario forecast and ask whether to ship or refine the
scenarios. If the user wants changes, capture feedback and rebuild the
scenarios (up to three passes), then re-present. On approval, assemble and
deliver the forecast deliverable with sections for starting state, growth
shape, revenue model, expense model, consolidated 12-month view, and the
three-scenario forecast.

- Input: scenarios, user feedback, all prior model outputs
- Output: forecast_deliverable (the shipped 12-month forecast)
- Key focus: one deliverable that makes the bear/base/bull decisions obvious
