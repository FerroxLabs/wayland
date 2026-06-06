---
name: wayland-budget-build
description: >-
  Build an annual budget by category with variance flags and quarterly
  checkpoints. Walks from target setting and category structure through a
  full annual budget, variance thresholds, and a tracking dashboard.

  Use when the user wants a structured multi-step process to build an annual
  operating budget with variance tracking.

  Do NOT use for a single budget question or a quick number an atomic finance
  skill can answer.
license: Apache-2.0
type: workflow
skills: "finance-budget finance-report"
metadata:
  author: wayland
  version: 1.0.0
  tags: business-finance budget planning step-by-step cfo
  category: business-finance
  depends: "finance-budget finance-report"
---
# Build an Annual Budget

**Estimated time:** 30-45 minutes

This workflow builds an annual budget by category, with quarterly checkpoints
and variance flags, then a tracking dashboard to monitor it through the year.
Act as the CFO: gather the target and constraints, propose a category
structure, build the budget, set variance thresholds, and ship a tracking
dashboard. Each build step is followed by a review checkpoint where the user
can refine before proceeding.

**Step 1: Kickoff and gather targets** (uses: finance-budget)

Tell the user you will build an annual budget by category, with quarterly
checkpoints and variance flags. Ask for: target revenue for the year (or the
planned forecast), and any known constraints such as debt payments, founder
salary, fixed contracts, and must-fund initiatives. For prior-year actuals,
offer to read any file dropped into the chat (P&L export, prior budget) or
pull from a connected source (Stripe, or the connected ledger, database, or
Google Sheets workbook). If neither is available, ask them to attach last
year's P&L and base the targets on it.

- Input: user-stated target revenue, constraints, prior-year P&L or actuals
- Output: target_and_constraints (the agreed targets and hard constraints)
- Key focus: anchor the budget on a real revenue target and the non-negotiables

**Step 2: Infer category structure** (uses: finance-budget)

From the target and constraints, infer a recommended category structure
appropriate to the business stage. Present it clearly, explain the reasoning,
and invite the user to add or remove categories to match their accounting
setup. Confirm the final category list before building.

- Input: target_and_constraints
- Output: categories (the confirmed budget category structure)
- Key focus: a category structure that matches how the business actually accounts

**Step 3: Build the annual budget** (uses: finance-budget)

Build the annual budget in annual_budget mode using the target, constraints,
and confirmed categories. Produce a by-category budget with a quarterly
breakdown. Show the full output.

- Input: target_and_constraints, categories
- Output: annual_budget (by-category budget with quarterly breakdown)
- Key focus: numbers that sum to the target and respect every constraint

**Step 4: Review and refine the budget** (uses: finance-budget)

Present the annual budget and ask whether to proceed to variance flags or
refine. If the user wants changes, capture their feedback and rebuild the
budget against it, then re-present. Loop up to three refinement passes until
the user approves, then proceed.

- Input: annual_budget, user refinement feedback
- Output: approved annual_budget
- Key focus: get explicit sign-off before locking the budget

**Step 5: Set variance thresholds** (uses: finance-budget)

Using the approved budget, build variance thresholds in variance_thresholds
mode: the per-category overrun and underrun bands that should trigger a flag.
Show the output.

- Input: approved annual_budget
- Output: variance_thresholds (per-category flag bands)
- Key focus: thresholds tight enough to catch drift, loose enough to avoid noise

**Step 6: Build the tracking dashboard** (uses: finance-report)

Build a tracking dashboard in tracking_dashboard mode from the budget and the
variance thresholds, so actuals can be checked against budget through the
year. Show the output.

- Input: approved annual_budget, variance_thresholds
- Output: dashboard (the tracking dashboard)
- Key focus: a dashboard that makes overruns obvious at a glance

**Step 7: Final review and ship** (uses: finance-report)

Present the full package: budget, variance thresholds, and tracking dashboard.
Ask whether to ship or refine the thresholds or dashboard. If the user wants
changes, capture feedback and rebuild the dashboard against it (up to two
passes), then re-present. On approval, assemble and deliver the budget package
document with sections for target and constraints, categories, annual budget,
variance thresholds, and tracking dashboard.

- Input: approved annual_budget, variance_thresholds, dashboard, user feedback
- Output: budget_package (the shipped annual budget document)
- Key focus: one clean deliverable the user can track against all year
