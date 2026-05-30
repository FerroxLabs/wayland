---
name: wayland-icp-build
description: >-
  Build an Ideal Customer Profile from existing customer data and market
  signals: infer segments, pick the best-fit segment, write the full profile,
  and define the disqualifiers.

  Use when the user wants to define who their best customers are and produce a
  reusable ICP document with explicit disqualifiers.

  Do NOT use for prepping a single discovery call (use wayland-discovery-prep)
  or building a cold outreach sequence (use wayland-outreach-build).
license: Apache-2.0
type: workflow
skills: "sales-coach sales-icp sales-qualify"
metadata:
  author: wayland
  version: 1.0.0
  tags: sales icp customer-profile segmentation qualification step-by-step
  category: sales
  depends: "sales-coach sales-icp sales-qualify"
---
# ICP Build

**Estimated time:** 30-45 minutes

This workflow builds an Ideal Customer Profile, the profile of the customers
worth pursuing. It works best with real customer data, but can build from
hypothesis if none exists (the result is weaker). The output is an ICP document:
data source, segments considered, best-fit segment, full profile, and
disqualifiers.

Run the sales-coach agent throughout. Each step feeds the next.

## Steps

**Step 1: Gather the Offer and Customer Data** (uses: sales-coach)

Ask the user for the offer and whatever data they have about existing
customers: a pasted list, a path to a CSV, or a description of their top five
best customers. Tell them that without real data you can still build from
hypothesis, but it will be weaker. This is an interactive step: ask, then wait
for the inputs before continuing.

- Input: user-provided offer and customer data (or hypothesis)
- Output: data_inputs (offer plus customer data or stated hypothesis)
- Key focus: get as much real customer data as the user can provide

**Step 2: Infer Customer Segments** (uses: sales-icp)

From the data (or hypothesis), infer the distinct customer segments. State the
inferred segments and your reasoning. Present them as an inference the user can
confirm or adjust.

- Input: data_inputs from Step 1
- Output: segments (the candidate customer segments, plus reasoning)
- Key focus: distinct, defensible segments grounded in the data

**Step 3: Identify the Best-Fit Segment** (uses: sales-icp)

From the inferred segments and the data, identify the best-fit segment using
willingness-to-pay, lifetime value, acquisition cost, and strategic fit. Show
the best-fit segment and the criteria behind it.

- Input: segments from Step 2, data_inputs from Step 1
- Output: best_segment (the chosen segment plus the fit criteria)
- Key focus: pick the segment with the best economics and strategic fit

**Step 4: Review and Refine the Best-Fit Segment** (uses: sales-icp)

Show the best-fit segment and ask the user to refine the criteria or proceed to
the full profile. If they want changes, fold their feedback back into the
selection (up to three passes) and re-present. Once approved, advance.

- Input: best_segment from Step 3, segments from Step 2, user feedback
- Output: approved best_segment
- Key focus: let the user adjust the criteria before profiling

**Step 5: Build the Full ICP Profile** (uses: sales-icp)

Build the full ICP profile of the best-fit segment: firmographics,
demographics, psychographics, pain points, success criteria, and current
alternatives. Show the profile to the user.

- Input: best_segment from Step 3
- Output: profile (the full ICP profile)
- Key focus: a complete, specific profile the team can target against

**Step 6: Review and Refine the Profile** (uses: sales-icp)

Show the full profile and ask the user to refine it or proceed to
disqualifiers. If they want changes, fold their feedback in (up to three passes)
and re-present. Once approved, advance.

- Input: profile from Step 5, best_segment from Step 3, user feedback
- Output: approved profile
- Key focus: a profile the user signs off on before defining who to avoid

**Step 7: Build the Disqualifiers** (uses: sales-qualify)

From the profile, build the disqualifiers: the prospects the user does NOT
want, even if those prospects ask to buy. Show the disqualifiers to the user.

- Input: profile from Step 5
- Output: disqualifiers (explicit anti-ICP criteria)
- Key focus: protect the pipeline from bad-fit deals up front

**Step 8: Final Review and Ship the ICP** (uses: sales-qualify)

Show the disqualifiers and ask the user to ship the ICP document or refine the
disqualifiers. If they want changes, fold their feedback in (up to two passes)
and re-present. When they ship, assemble the ICP document: data source,
segments considered, best-fit segment, full profile, and disqualifiers.

- Input: disqualifiers from Step 7, data_inputs, segments, best_segment, profile, user feedback
- Output: icp_document (the assembled Ideal Customer Profile)
- Key focus: deliver a reusable ICP the whole team can target against

## Expected Outcome

An Ideal Customer Profile document containing the data source, the segments
considered, the best-fit segment, the full ICP profile, and the disqualifiers.
