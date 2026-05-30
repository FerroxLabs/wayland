---
name: wayland-pricing-stress-test
description: >-
  Stress-test pricing across bear/base/bull scenarios. Covers elasticity,
  contribution margin, and LTV/CAC implications, ending in a recommendation
  memo.

  Use when the user wants a structured multi-step process to test a price
  change across scenarios before committing.

  Do NOT use for a single pricing question an atomic finance skill can answer.
license: Apache-2.0
type: workflow
skills: "finance-pricing-review finance-forecast"
metadata:
  author: wayland
  version: 1.0.0
  tags: business-finance pricing scenarios step-by-step cfo
  category: business-finance
  depends: "finance-pricing-review finance-forecast"
---
# Pricing Stress-Test

**Estimated time:** 20-30 minutes

This workflow stress-tests pricing across three scenarios: elasticity,
contribution margin, and LTV/CAC implications, ending in a recommendation memo.
Act as the CFO: gather the pricing brief, infer elasticity, build bear/base/bull
scenarios, compute LTV/CAC per scenario, and write the recommendation. Build
steps are followed by review checkpoints where the user can refine before
proceeding.

**Step 1: Kickoff and gather the pricing brief** (uses: finance-pricing-review)

Tell the user you will stress-test pricing across three scenarios. Ask for:
current price, expected volume at that price, COGS or service-delivery cost per
unit, and channel CAC if known. For real volume and cost figures, offer to
read any file dropped into the chat (sales or COGS export) or pull from a
connected source (Stripe for price and volume, or the connected ledger,
database, or Google Sheets workbook). If neither is set up, ask them to attach
the export.

- Input: current price, volume, unit cost, CAC; sales/COGS file or source
- Output: pricing_brief (the agreed pricing inputs)
- Key focus: a brief grounded in real price, volume, and unit cost

**Step 2: Infer price elasticity** (uses: finance-pricing-review)

From the brief, infer the price elasticity for this segment and present it with
reasoning. Ask the user to override if they have real elasticity data.

- Input: pricing_brief
- Output: elasticity (the confirmed elasticity assumption)
- Key focus: an elasticity assumption the user accepts as reasonable

**Step 3: Build three scenarios** (uses: finance-pricing-review)

Build bear/base/bull scenarios in bear_base_bull mode from the brief and the
elasticity assumption: volume, revenue, and contribution margin per scenario.
Show the output.

- Input: pricing_brief, elasticity
- Output: scenarios (bear/base/bull with volume, revenue, margin)
- Key focus: contribution margin per scenario, not just top-line revenue

**Step 4: Review and refine scenarios** (uses: finance-pricing-review)

Present the three scenarios and ask whether to proceed to LTV/CAC or refine
assumptions. If the user wants changes, capture feedback and rebuild the
scenarios, then re-present. Loop up to three passes, then proceed.

- Input: scenarios, user refinement feedback
- Output: approved scenarios
- Key focus: scenarios the user trusts before layering LTV/CAC on them

**Step 5: LTV/CAC per scenario** (uses: finance-forecast)

Compute LTV/CAC per scenario in ltv_cac_per_scenario mode from the scenarios
and the brief, so each price point shows its unit-economics implication. Show
the output.

- Input: approved scenarios, pricing_brief
- Output: ltv_cac (LTV/CAC per scenario)
- Key focus: unit economics that reveal which price actually pays back

**Step 6: Recommendation memo** (uses: finance-pricing-review)

Write a recommendation in recommendation_memo mode from the scenarios and the
LTV/CAC analysis, showing the math behind the recommended price. Show the
output.

- Input: approved scenarios, ltv_cac
- Output: recommendation (the recommended price with reasoning)
- Key focus: a clear recommendation backed by the contribution-margin and
  LTV/CAC math

**Step 7: Final review and ship** (uses: finance-pricing-review)

Present the recommendation with the math behind it and ask whether to ship or
refine. If the user wants changes, capture feedback and rebuild the
recommendation (up to two passes), then re-present. On approval, assemble and
deliver the pricing stress-test memo with sections for the brief, elasticity
assumption, three scenarios, LTV/CAC per scenario, and the recommendation.

- Input: recommendation, user feedback, all prior outputs
- Output: pricing_memo (the shipped stress-test memo)
- Key focus: one memo that defends the price with the numbers
