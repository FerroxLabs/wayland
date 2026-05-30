---
name: wayland-full-funnel-design
description: >-
  Full-stack direct-response funnel design. Maps entry through backend
  (lead-magnet, tripwire, core offer, backend continuity) with copy specs and a
  complete ascension ladder, validated against unit economics at every stage.

  Use when the user wants a structured, multi-step process to design a complete
  funnel architecture around an offer, from first-touch to lifetime value.

  Do NOT use for a single funnel stage in isolation or a question one atomic
  funnel skill can answer; use the dedicated single-stage skill instead.
license: Apache-2.0
type: workflow
skills: "sales-icp market-funnel funnels-offer-pricing funnels-lead-magnet funnels-tripwire funnels-offer funnels-continuity funnels-ascension-ladder"
metadata:
  author: wayland
  version: 1.0.0
  tags: marketing funnels architecture ascension-ladder step-by-step direct-response
  category: marketing
  depends: "sales-icp market-funnel funnels-offer-pricing funnels-lead-magnet funnels-tripwire funnels-offer funnels-continuity funnels-ascension-ladder"
---
# Full Funnel Design

**Estimated time:** 30-40 minutes

This workflow designs a full-stack direct-response funnel: entry through
backend, with the ascension ladder mapped and the math attached. A funnel is
the SYSTEM for selling an offer, so the build starts from an offer at the top of
mind and works outward through each stage. A funnel that does not pencil out at
projected CAC is wishful thinking, so the agent surfaces economic assumptions
early and lets the user fight them.

## Steps

**Step 1: Anchor the Offer** (uses: funnels-offer)

Ask the user for the offer at the top of mind, in one sentence. If they do not
have a primary offer yet, ask for the audience and back into one. A funnel
without an offer at the top is infrastructure for nothing, so do not advance
until there is a concrete offer or audience to design around.

- Input: user's offer or audience description
- Output: anchor offer (or audience to back an offer from)
- Key focus: the funnel exists to sell THIS offer; name it first

**Step 2: Infer the Target Audience** (uses: sales-icp)

Infer the primary target audience from the anchor offer. Present the inferred
target plus reasoning and ask the user to confirm or expand. This audience
drives every stage that follows.

- Input: anchor offer from Step 1
- Output: confirmed primary target audience
- Key focus: lock who the funnel is FOR before designing stages

**Step 3: Infer the Traffic Mix** (uses: market-funnel)

Infer the likely traffic mix for this funnel given the offer and audience.
Present it with reasoning. Ask the user if they have an existing list, a
pre-built audience, or a partner JV path, since any of those changes the
architecture. Confirm or override.

- Input: anchor offer, target audience
- Output: confirmed traffic mix
- Key focus: the real acquisition path, which dictates entry-stage design

**Step 4: Infer the Unit Economics** (uses: funnels-offer-pricing)

Infer the unit economics for the funnel design (target CAC, AOV, contribution
margin, payback) from the offer and audience. Present the assumptions clearly
and invite the user to override with real numbers. These numbers gate every
stage decision downstream.

- Input: anchor offer, target audience
- Output: confirmed unit-economics assumptions
- Key focus: a funnel that does not pencil out at projected CAC is wishful thinking

**Step 5: Design the Entry Stage (Trust lock)** (uses: funnels-lead-magnet)

Design the entry stage: the lead-magnet that breaks the Trust lock and earns
first-touch opt-in. Use the offer, audience, and traffic mix. Show it to the
user and ask whether to refine the entry stage or move on to the tripwire.
Revise on feedback before advancing.

- Input: anchor offer, audience, traffic mix
- Output: entry-stage lead-magnet design
- Key focus: break the Trust lock and capture the lead at first touch

**Step 6: Design the Tripwire (Excuse lock)** (uses: funnels-tripwire)

Design the tripwire: the low-risk first transaction that breaks the Excuse lock
and converts a lead into a buyer. Use the offer, audience, traffic mix, and unit
economics. Show it and ask whether to refine the tripwire or proceed to the
core offer. Revise on feedback before advancing.

- Input: anchor offer, audience, traffic mix, economics
- Output: tripwire design
- Key focus: the low-risk first transaction that turns leads into buyers

**Step 7: Design the Core Offer (Want lock)** (uses: funnels-offer)

Design the core offer: the primary transaction that breaks the Want lock. Use
the offer, audience, the tripwire design, and unit economics. Show it and ask
whether to refine the core offer or build the backend continuity. Revise on
feedback before advancing.

- Input: anchor offer, audience, tripwire design, economics
- Output: core offer design
- Key focus: the primary transaction the whole funnel is built to drive

**Step 8: Design the Backend / Continuity** (uses: funnels-continuity)

Design the backend continuity that drives lifetime value beyond the core
transaction. Use the core offer, audience, and unit economics. This stage turns
a one-time buyer into recurring revenue.

- Input: core offer, audience, economics
- Output: backend continuity design
- Key focus: lifetime value, the part of the funnel that compounds

**Step 9: Map the Ascension Ladder** (uses: funnels-ascension-ladder)

Map the complete ascension ladder across entry, tripwire, core, and backend,
with the math at each rung. Use all four stage designs plus the unit economics.
Show the ladder to the user and ask whether to assemble the funnel architecture
or refine the ladder and backend. Revise on feedback before advancing.

- Input: entry, tripwire, core, backend designs, economics
- Output: full ascension ladder with per-rung math
- Key focus: how a buyer climbs from first touch to highest value, with the numbers

**Step 10: Assemble the Funnel Architecture Document** (uses: funnels-ascension-ladder)

Assemble the complete funnel architecture document. Open with target audience,
traffic mix, and unit economics, then present each stage in order: entry (Trust
lock), tripwire (Excuse lock), core offer (Want lock), backend continuity
(lifetime value), and the full ascension ladder. Deliver it as the final
artifact.

- Input: all confirmed outputs from Steps 1 through 9
- Output: complete funnel architecture document
- Key focus: one coherent end-to-end architecture the user can build from
