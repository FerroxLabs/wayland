---
name: wayland-budget-variance-check
description: >-
  Monthly budget variance check. Compares current-month actuals to the active
  budget and flags overruns in a single deterministic pass.

  Use when the user wants a structured pass that loads actuals, computes
  variance against a budget, and surfaces overrun flags.

  Do NOT use when there are no actuals to load; halt rather than emit an empty
  variance report.
license: Apache-2.0
type: workflow
skills: "finance-cashflow finance-budget finance-report"
metadata:
  author: wayland
  version: 1.0.0
  tags: business-finance budget variance deterministic cfo
  category: business-finance
  depends: "finance-cashflow finance-budget finance-report"
---
# Monthly Budget Variance Check

**Estimated time:** about 30 seconds

A deterministic monthly variance pass: load current-month actuals, compare
them to the active budget, and flag overruns. Data source is the current-month
actuals (bank CSVs, P&L export) plus the active budget file. For interactive
runs, prefer a file dropped into the chat or a connected source (Stripe, or
the connected ledger, database, or Google Sheets). If actuals are missing,
halt rather than emit an empty variance report.

**Step 1: Load current-month actuals** (uses: finance-cashflow)

Load the current-month actuals from the actuals directory in month_to_date
mode. This is the directory of bank CSVs and the P&L export. If no actuals can
be loaded, halt the workflow and tell the user actuals are required; do not
fabricate or proceed with an empty set.

- Input: actuals_dir (directory with current-month actuals)
- Output: actuals (parsed month-to-date actuals)
- Key focus: halt on missing data rather than report on nothing

**Step 2: Compute budget variance** (uses: finance-budget)

Compare the loaded actuals against the active budget in variance_report mode,
using the budget file path provided. Produce a per-category variance report
showing budget, actual, and delta. If the budget cannot be read, halt.

- Input: actuals, budget_path (active annual budget YAML or markdown)
- Output: variance_report (per-category budget-vs-actual variance)
- Key focus: accurate budget-to-actual deltas per category

**Step 3: Flag overruns** (uses: finance-report)

From the variance report, produce overrun flags in overrun_flags mode: the
categories that have exceeded their budget and by how much, ordered by
severity. Present the flags as the deliverable.

- Input: variance_report
- Output: flags (overrun flags ranked by severity)
- Key focus: surface the few overruns that actually need attention
