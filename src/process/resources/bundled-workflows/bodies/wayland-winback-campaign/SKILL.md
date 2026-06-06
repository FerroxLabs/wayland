---
name: wayland-winback-campaign
description: >-
  Design a winback campaign end to end: define and segment lapsed customers,
  build the comeback offer, then write the email sequence that re-engages them,
  with review gates before shipping.

  Use when the user wants a structured multi-step process to re-engage lapsed or
  one-time customers with a segmented offer and a timed email sequence.

  Do NOT use for a single re-engagement email or a question one atomic skill can
  answer.
license: Apache-2.0
type: workflow
skills: "commerce-winback funnels-offer"
metadata:
  author: wayland
  version: 1.0.0
  tags: commerce ecommerce retention winback email segmentation step-by-step
  category: marketing
  depends: "commerce-winback funnels-offer"
---
# Winback Campaign

**Estimated time:** 20-30 minutes

This workflow designs a winback campaign that re-engages lapsed customers. It
defines how "lapsed" is scoped, segments those customers so each group is
targeted differently, builds the comeback offer that gives them a reason to
return, and writes the email sequence that delivers it. Review gates let the
user refine the offer and the sequence before shipping.

## When to Use

- User wants to re-engage lapsed or one-time customers with a campaign
- User can describe how lapsed is defined, the customer count, and top products
- Do NOT use for a single one-off re-engagement email

## Steps

**Step 1: Gather the winback brief** (uses: commerce-winback)

Tell the user you will design their winback campaign. Then gather: how lapsed
customers are defined (e.g. 90 days with no purchase, or one-time buyers only),
the approximate count of lapsed customers, and the top-selling product line.
Capture this as the brief that drives segmentation, offer, and sequence. Do not
proceed without the lapsed definition and the top product line.

- Input: user-provided lapsed definition, customer count, top product line
- Output: a structured winback brief
- Key focus: pin down the lapsed definition before segmenting

**Step 2: Infer the segments** (uses: commerce-winback)

From the brief, infer the lapsed-customer segments worth targeting differently
(e.g. high-value vs. one-time, recently lapsed vs. long-dormant, single-category
vs. multi-category buyers). Present the segments and the reasoning for treating
each differently. Let the user confirm or adjust before the offer is built.

- Input: winback brief from Step 1
- Output: distinct lapsed-customer segments with targeting rationale
- Key focus: segments must justify different offer/messaging treatment

**Step 3: Build the winback offer** (uses: funnels-offer)

Build the comeback offer that gives lapsed customers a reason to return,
tailored to the segments where it matters. Present the offer (the hook, the
incentive, and any segment-specific variants). Show it. Then ask whether to
refine the offer or proceed to the email sequence; if they refine, revise
against their feedback and re-show, for up to three rounds, before advancing.

- Input: winback brief and the segments from Step 2
- Output: the winback offer with any segment-specific variants
- Key focus: the offer is a genuine reason to return, matched to each segment

**Step 4: Write the email sequence** (uses: commerce-winback)

Write the winback email sequence that delivers the offer across the segments:
the touches, their timing, the subject lines, and the body copy, adapting tone
and incentive per segment as needed. Show the full sequence. Then ask whether to
ship the campaign or refine the sequence; if they refine, revise and re-show, up
to two rounds, before completing.

- Input: the winback offer and the segments
- Output: a full winback email sequence (touches, timing, subjects, copy)
- Key focus: deliver the offer with the right cadence per segment

**Step 5: Assemble the winback campaign** (uses: commerce-winback)

Compile the final deliverable: a Winback Campaign document bringing together the
segments, the offer, and the email sequence so the user can load it into their
ESP and run it. Present it as the shipped artifact.

- Input: segments, offer, and email sequence from prior steps
- Output: a complete Winback Campaign document
- Key focus: one implementation-ready campaign document
