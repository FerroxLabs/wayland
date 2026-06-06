---
name: wayland-cashflow-review
description: >-
  Interactive cashflow review. Parses bank actuals, computes forecast variance
  and a 30-day projection with red/yellow/green status, then turns it into
  action recommendations.

  Use when the user wants a structured multi-step cashflow review from raw bank
  data to a shipped review document.

  Do NOT use for a single cashflow lookup an atomic finance skill can answer.
license: Apache-2.0
type: workflow
skills: "finance-cashflow finance-forecast finance-report"
metadata:
  author: wayland
  version: 1.0.0
  tags: business-finance cashflow forecast step-by-step cfo
  category: business-finance
  depends: "finance-cashflow finance-forecast finance-report"
---
# Cashflow Review

**Estimated time:** 20-30 minutes

This workflow runs an interactive cashflow review: bank actuals to forecast
variance to a 30-day projection with red/yellow/green status, ending in action
recommendations. Act as the CFO. Each build step is followed by a review
checkpoint where the user can refine the categorization, assumptions, or
recommendations before proceeding.

**Step 1: Kickoff and point at the data** (uses: finance-cashflow)

Tell the user you will run a cashflow review. Ask them to point you at the
data: bank CSV(s), credit-card exports, AR aging, by path or pasted contents,
and to say which file is what. Offer to read any file dropped into the chat or
pull from a connected source (Stripe payouts, or the connected ledger,
database, or Google Sheets workbook). If neither is set up, ask them to attach
the bank export.

- Input: user-provided bank CSVs, CC exports, AR aging, or connected source
- Output: data_inputs (the located data and what each file is)
- Key focus: know exactly which file is which before parsing

**Step 2: Infer the review period** (uses: finance-cashflow)

From the data, infer the review period and present it with reasoning. Invite
the user to override if they want a different window, for example just the last
30 days. Confirm the period before parsing.

- Input: data_inputs
- Output: review_period (the confirmed review window)
- Key focus: align the window with the data and the user's intent

**Step 3: Parse actuals** (uses: finance-cashflow)

Parse the data in parse_actuals mode for the confirmed period: inflows by
category, outflows by category, and net cash position. Show the output.

- Input: data_inputs, review_period
- Output: actuals (categorized inflows, outflows, net position)
- Key focus: clean categorization that the user recognizes as correct

**Step 4: Review and refine categorization** (uses: finance-cashflow)

Present the parsed actuals and ask whether to proceed to variance and forecast
or refine the categorization. If the user wants changes, capture feedback and
re-parse against it, then re-present. Loop up to two refinement passes, then
proceed on approval.

- Input: actuals, user refinement feedback
- Output: approved actuals
- Key focus: get categorization right before forecasting on top of it

**Step 5: Variance and 30-day projection** (uses: finance-forecast)

Compute variance versus the prior period plus a 30-day projection in
variance_plus_30day_projection mode. Attach red/yellow/green status flags based
on cash floor and burn rate. Show the output.

- Input: approved actuals, review_period
- Output: variance_forecast (variance plus 30-day projection with status)
- Key focus: status flags grounded in cash floor and burn, not vibes

**Step 6: Review and refine the forecast** (uses: finance-forecast)

Present the variance and projection. Ask whether to proceed to recommendations
or override assumptions. If the user overrides, capture the new assumptions and
rebuild the forecast, then re-present. Loop up to three passes, then proceed.

- Input: variance_forecast, user assumption overrides
- Output: approved variance_forecast
- Key focus: assumptions the user stands behind before recommending action

**Step 7: Action recommendations** (uses: finance-report)

Produce cashflow recommendations in cashflow_recommendations mode from the
actuals and the approved forecast, each with a concrete action trigger. Show
the output.

- Input: approved actuals, approved variance_forecast
- Output: recommendations (actions with triggers)
- Key focus: recommendations that name the trigger and the move

**Step 8: Final review and ship** (uses: finance-report)

Present the recommendations with their action triggers and ask whether to ship
or refine. If the user wants changes, capture feedback and rebuild the
recommendations (up to two passes), then re-present. On approval, assemble and
deliver the cashflow review document with sections for actuals, variance plus
30-day projection, and recommendations.

- Input: approved recommendations, user feedback, review_period
- Output: cashflow_review_document (the shipped review)
- Key focus: one clean review document with the actions up front
