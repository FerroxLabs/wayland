---
name: wayland-cashflow-batch-review
description: >-
  Deterministic cashflow review over bank CSVs in an inbox. Parses actuals,
  optionally checks variance against a forecast, and produces a
  red/yellow/green status report.

  Use when the user wants a structured pass that turns a directory of bank CSV
  exports into a cashflow status report.

  Do NOT use when the directory is empty; halt rather than emit an empty
  report.
license: Apache-2.0
type: workflow
skills: "finance-cashflow finance-forecast finance-report"
metadata:
  author: wayland
  version: 1.0.0
  tags: business-finance cashflow status deterministic cfo
  category: business-finance
  depends: "finance-cashflow finance-forecast finance-report"
---
# Cashflow Batch Review

**Estimated time:** about 30 seconds

A deterministic cashflow review over the bank CSV exports in a directory.
Parse the actuals, optionally compare them to a current forecast, and produce
a red/yellow/green status report. Data source is the bank CSV exports in the
given directory. For interactive runs, prefer a file dropped into the chat or
a connected source (Stripe, or the connected ledger, database, or Google
Sheets). If the directory is empty, halt rather than emit an empty report.

**Step 1: Parse bank actuals** (uses: finance-cashflow)

Parse the bank CSV exports in the bank CSV directory in parse_actuals mode
into structured cashflow actuals (inflows and outflows by category, net
position). If the directory is empty or no actuals can be parsed, halt and
tell the user data is required; do not emit an empty report.

- Input: bank_csv_dir (directory containing bank CSV exports)
- Output: actuals (parsed cashflow actuals)
- Key focus: halt on an empty inbox rather than report on nothing

**Step 2: Variance check against forecast** (uses: finance-forecast)

If a forecast path is provided, compare the parsed actuals to the current
forecast in variance_check mode and produce a variance report. This step is
optional: if no forecast path is given or the forecast cannot be read, skip it
and continue without variance.

- Input: actuals, forecast_path (optional current forecast)
- Output: variance_report (actuals-vs-forecast variance, or none if skipped)
- Key focus: only run variance when a forecast is actually available

**Step 3: Red/yellow/green status report** (uses: finance-report)

Produce a status report in red_yellow_green_status mode from the actuals and,
if present, the variance report. Assign red/yellow/green status based on cash
position and any forecast variance. Present the status report as the
deliverable.

- Input: actuals, variance_report (optional)
- Output: status_report (red/yellow/green cashflow status)
- Key focus: a clear single-glance status with the reason behind the color
