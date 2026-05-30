---
name: wayland-listing-optimize
description: >-
  Audit and optimize a single product listing end to end: diagnose the
  conversion bottleneck, run a full audit, rewrite the listing, and produce an
  A/B test plan to validate the change.

  Use when the user wants a structured multi-step process to improve one
  listing's copy, structure, and conversion levers.

  Do NOT use for a quick catalog triage pass (use listing-audit-pick) or a
  single-line copy tweak.
license: Apache-2.0
type: workflow
skills: "commerce-listing commerce-description"
metadata:
  author: wayland
  version: 1.0.0
  tags: commerce ecommerce listing optimization conversion ab-test step-by-step
  category: marketing
  depends: "commerce-listing commerce-description"
---
# Listing Optimization

**Estimated time:** 20-30 minutes

This workflow takes one product listing from its current state to an optimized,
test-ready version. It diagnoses the primary conversion bottleneck, runs a full
audit, rewrites the listing copy and structure, and produces an A/B test plan so
the rewrite can be validated rather than assumed. Review gates let the user
refine the audit, the rewrite, and the test plan before shipping.

## When to Use

- User wants to improve a specific listing's conversion performance
- User can paste the listing (URL or content) and ideally some metrics
- Do NOT use for catalog-wide triage or trivial edits

## Steps

**Step 1: Capture the listing** (uses: commerce-listing)

Tell the user you will optimize their listing, then ask them to paste it (a URL
or the copy/paste content). Ask them to include current conversion numbers
(sessions, conversion rate, AOV) if they have them. Capture this as the listing
input that drives the audit. Do not proceed without the listing content.

- Input: user-pasted listing (URL or content), optional conversion metrics
- Output: the captured listing input
- Key focus: get the actual listing plus any real numbers before diagnosing

**Step 2: Infer the primary bottleneck** (uses: commerce-listing)

From the listing (and any metrics provided), infer the single primary conversion
bottleneck: e.g. weak hero/title, poor imagery, unclear value proposition, price
objection, or thin/scannability-poor copy. Present the inferred bottleneck and
the reasoning. Ask the user to confirm or override based on data they hold,
since they may know things the listing text does not reveal.

- Input: listing input from Step 1
- Output: the confirmed primary bottleneck with reasoning
- Key focus: name one bottleneck; let real data override the inference

**Step 3: Run the full audit** (uses: commerce-listing)

Run a full audit of the listing through the lens of the confirmed bottleneck:
title, hero, imagery, description structure, social proof, pricing, and CTA.
Diagnose each with concrete observations. Show the audit. Then ask whether to
refine the audit or proceed to the rewrite; if they refine, take the feedback
and revise the audit, re-showing it, for up to two rounds before advancing.

- Input: listing input and confirmed bottleneck
- Output: a full diagnostic audit across all listing elements
- Key focus: tie diagnoses to the bottleneck; fold in refinement feedback

**Step 4: Rewrite the listing** (uses: commerce-description)

Produce an optimized rewrite of the listing that fixes what the audit flagged:
stronger title/hero, clearer value proposition, scannable structure, sharper CTA,
and copy that addresses the bottleneck. Show the rewritten listing. Then ask
whether to refine the rewrite or proceed to the A/B test plan; if they refine,
revise against their feedback and re-show, for up to three rounds, before
advancing.

- Input: listing input and the audit from Step 3
- Output: a fully rewritten, optimized listing
- Key focus: every change traces to an audit finding; incorporate feedback

**Step 5: Build the A/B test plan** (uses: commerce-listing)

Create an A/B test plan that pits the original listing against the rewrite:
a clear hypothesis, the primary metric, required sample size, expected test
duration, and the success threshold. Show the plan. Then ask whether to ship the
optimization package or refine the A/B plan; if they refine, revise and re-show,
up to two rounds, before completing.

- Input: original listing and the rewrite from Step 4
- Output: an A/B test plan (hypothesis, metric, sample size, duration, threshold)
- Key focus: make the rewrite testable, not assumed correct

**Step 6: Assemble the optimization package** (uses: commerce-listing)

Compile the final deliverable: a Listing Optimization package stating the
bottleneck, the audit, the rewritten listing, and the A/B test plan in one
document the user can act on. Present it as the shipped artifact.

- Input: bottleneck, audit, rewrite, and A/B plan from prior steps
- Output: a complete Listing Optimization package
- Key focus: one implementation-ready document
