---
name: wayland-build-financial-model
description: >-
  Build a 3-statement financial model (P&L, Cash Flow, Balance Sheet) with
  explicit assumption blocks and sensitivity analysis. The agent infers the core
  assumptions that drive the model, builds a forward P&L month by month, ties in
  cash flow and balance sheet, then runs bear/base/bull sensitivity on the key
  variables.

  Use when the user wants a structured multi-step process to produce a complete,
  assumption-driven 3-statement model with sensitivity analysis.

  Do NOT use for a single number lookup, a one-line projection, or a question one
  atomic finance skill can answer.
license: Apache-2.0
type: workflow
skills: "pitch-fin-model finance-pl finance-cashflow finance-balance-sheet"
metadata:
  author: wayland
  version: 1.0.0
  tags: finance modeling fundraising projections sensitivity step-by-step planning
  category: finance
  depends: "pitch-fin-model finance-pl finance-cashflow finance-balance-sheet"
---
# Build a Financial Model

**Estimated time:** 60-90 minutes

This workflow builds a 3-statement financial model with explicit assumptions and
sensitivity analysis. The arc is: gather the brief, infer the assumption blocks
that drive everything, build a forward P&L, tie in cash flow and balance sheet,
then run sensitivity (bear/base/bull) on the key assumptions. Review checkpoints
let the user refine the P&L assumptions, the tied statements, and the
sensitivity before shipping.

Generative steps are driven by `pitch-fin-model` (assumptions, sensitivity) and
the finance statement skills `finance-pl`, `finance-cashflow`, and
`finance-balance-sheet`.

## Steps

**Step 1: Kickoff and Brief** (uses: pitch-fin-model)

Open the workflow and gather the brief. Ask the user for: business stage,
current revenue and burn, planning horizon (12 / 24 / 36 months), and any known
constraints or commitments. Explain that you will build a P&L, cash flow, and
balance sheet with assumption blocks and sensitivity. Do not proceed until you
have the stage, the numbers, and the horizon.

- Input: user-provided stage, current revenue/burn, planning horizon, constraints
- Output: a captured brief block
- Key focus: get the horizon and current run-rate numbers nailed down first

**Step 2: Infer Assumption Blocks** (uses: pitch-fin-model)

From the brief, infer the core assumption blocks: the variables that drive the
whole model (growth rate, CAC, churn, margins, hiring plan, etc.). Present the
inferred assumptions with reasoning and invite the user to override with what
they actually want to vary.

- Input: the brief from Step 1
- Output: the core assumption blocks, confirmed or overridden by the user
- Key focus: surface the few variables everything else depends on

**Step 3: Build Forward P&L** (uses: finance-pl)

Run `finance-pl` in forward-P&L mode using the brief and the confirmed
assumptions. Produce a month-by-month forward P&L with each assumption cited
inline so the user can trace any number back to its driver. Show the P&L.

- Input: the brief from Step 1, the assumption blocks from Step 2
- Output: a month-by-month forward P&L with inline assumption citations
- Key focus: every line traceable to an assumption; no unsourced numbers

**Step 4: Review and Refine P&L** (uses: finance-pl)

Present the forward P&L and ask the user to refine the assumptions or proceed to
cash flow and balance sheet. If they refine, re-run the P&L step with the prior
P&L plus feedback and the assumptions, then present again. Allow up to three
refinement passes.

- Input: the forward P&L from Step 3, user feedback, the assumption blocks
- Output: approved (possibly revised) forward P&L
- Key focus: lock the P&L assumptions before deriving the other statements

**Step 5: Build Cash Flow** (uses: finance-cashflow)

Run `finance-cashflow` in forward-cash-flow mode, deriving the cash flow
statement from the approved P&L and the assumptions. Account for timing
differences between revenue/expense recognition and cash movement.

- Input: the approved forward P&L from Step 4, the assumption blocks
- Output: a forward cash flow statement tied to the P&L
- Key focus: cash timing, not just accrual; reconcile to the P&L

**Step 6: Build Balance Sheet** (uses: finance-balance-sheet)

Run `finance-balance-sheet` to build the balance sheet from the P&L, the cash
flow, and the assumptions, so all three statements tie together (cash flows to
the cash line, retained earnings reflects cumulative net income, etc.). Show the
cash flow and balance sheet together.

- Input: the forward P&L, the cash flow from Step 5, the assumption blocks
- Output: a balance sheet that ties the three statements together
- Key focus: the three statements must reconcile, not just coexist

**Step 7: Review and Refine Statements** (uses: finance-balance-sheet)

Present the tied cash flow and balance sheet and ask the user to refine or
proceed to sensitivity. If they refine, re-run the balance-sheet step with the
prior balance sheet plus feedback, the P&L, and the cash flow, then present
again. Allow up to two refinement passes.

- Input: the balance sheet from Step 6, user feedback, the P&L, the cash flow
- Output: approved (possibly revised) tied statements
- Key focus: confirm the statements reconcile before stress-testing them

**Step 8: Run Sensitivity Analysis** (uses: pitch-fin-model)

Run `pitch-fin-model` in sensitivity-analysis mode over the three statements and
the assumptions. Produce bear / base / bull scenarios on the key assumptions,
showing how each scenario moves runway, revenue, and the bottom line. Show the
analysis.

- Input: the P&L, cash flow, balance sheet, and assumption blocks
- Output: bear / base / bull sensitivity on the key assumptions
- Key focus: vary the few assumptions that matter; show the impact on runway

**Step 9: Final Review and Ship** (uses: pitch-fin-model)

Present the sensitivity analysis and ask the user to ship the model or refine
the sensitivity. If they refine, re-run the sensitivity step with the prior
analysis plus feedback and the assumptions, then present again (up to two
passes). On ship, assemble the final model (assumptions, forward P&L, cash flow,
balance sheet, sensitivity) and output it.

- Input: the sensitivity analysis from Step 8, user decision
- Output: the assembled financial model
- Key focus: deliver a complete, reconciled, stress-tested model

## Expected Outcome

A complete 3-statement financial model: explicit assumption blocks, a
month-by-month forward P&L, a reconciled cash flow and balance sheet, and a
bear/base/bull sensitivity analysis, assembled into one model package.
