---
name: wayland-abandoned-cart-recovery
description: >-
  Build an abandoned-cart recovery sequence end to end: gather the store
  context, recommend a cadence, draft the multi-touch sequence with timing and
  incentives, then layer in incentive-escalation logic before shipping.

  Use when the user wants a structured process to recover abandoned carts with a
  timed multi-touch email/SMS sequence and discount-escalation rules.

  Do NOT use for a single one-off cart-recovery email or a question one atomic
  skill can answer.
license: Apache-2.0
type: workflow
skills: "commerce-abandoned-cart"
metadata:
  author: wayland
  version: 1.0.0
  tags: commerce ecommerce email retention cart-recovery step-by-step
  category: marketing
  depends: "commerce-abandoned-cart"
---
# Abandoned Cart Recovery

**Estimated time:** 15-25 minutes

This workflow builds a complete abandoned-cart recovery program: the timed
multi-touch sequence that brings shoppers back to finish checkout, plus the
incentive-escalation logic that decides when a discount is worth offering and
when it just trains customers to abandon. It moves from store context to a
recommended cadence, to the drafted sequence, to escalation rules, with review
gates so the user can refine before shipping.

## When to Use

- User wants to recover abandoned carts with a structured multi-touch sequence
- User needs timing, channel mix, and incentive logic decided for them
- Do NOT use for a single one-off email or a trivial copy tweak

## Steps

**Step 1: Gather the store brief** (uses: commerce-abandoned-cart)

Open by telling the user you will build their abandoned-cart recovery sequence,
then gather the inputs you need. Ask for: the platform (Shopify, WooCommerce,
etc.), average order value (AOV), the current abandon rate (or use the platform
average of roughly 70% if unknown), and whether they can offer a discount.
Capture the answers as the brief that drives every later step. Do not proceed
until you have at least platform, AOV, and the discount constraint.

- Input: user-provided platform, AOV, abandon rate, discount availability
- Output: a structured recovery brief
- Key focus: get the constraints (especially discount availability) before designing anything

**Step 2: Recommend the cadence** (uses: commerce-abandoned-cart)

From the brief, infer the recommended recovery cadence: touch count, the timing
of each touch (e.g. +1 hour, +24 hours, +72 hours), and the channel mix (email,
SMS, both). Present the recommendation clearly and state the reasoning behind it
(reflecting AOV, abandon rate, and whether discounts are on the table). Let the
user confirm or override before building the sequence.

- Input: recovery brief from Step 1
- Output: recommended cadence (touch count, per-touch timing, channel mix) with reasoning
- Key focus: justify the cadence from the brief; let the user adjust it

**Step 3: Draft the recovery sequence** (uses: commerce-abandoned-cart)

Write the full recovery sequence following the confirmed cadence. For each touch
produce the channel, send timing, subject line (and preview/SMS copy as
relevant), body copy, and the incentive (if any) attached to that touch. Show
the complete sequence to the user. Then ask whether they want to refine it or
proceed to incentive-escalation logic. If they choose to refine, take their
feedback and revise the sequence in place, re-showing it, for up to three
refinement rounds before moving on.

- Input: recovery brief and confirmed cadence
- Output: full multi-touch sequence with timing, copy, and per-touch incentives
- Key focus: each touch maps to the cadence; incorporate refinement feedback before advancing

**Step 4: Add incentive-escalation logic** (uses: commerce-abandoned-cart)

Layer escalation logic onto the sequence: define when to introduce a discount
and when to hold it back, how the incentive escalates across touches (e.g. no
discount, then free shipping, then a percentage off), and the guardrails that
prevent training customers to abandon for a deal. Show the escalation rules.
Then ask whether to ship the recovery program or refine the escalation; if they
refine, revise and re-show, up to two rounds, before completing.

- Input: drafted sequence from Step 3
- Output: incentive-escalation rules tied to each touch
- Key focus: protect margin; only escalate incentives when the data justifies it

**Step 5: Assemble the recovery kit** (uses: commerce-abandoned-cart)

Compile the final deliverable: a Cart Recovery Kit that combines the cadence,
the full sequence, and the escalation logic into one document the user can hand
to their ESP or implement directly. Present it as the shipped artifact.

- Input: cadence, sequence, and escalation logic from prior steps
- Output: a complete Abandoned Cart Recovery Kit (cadence + sequence + escalation logic)
- Key focus: one clean, implementation-ready document
