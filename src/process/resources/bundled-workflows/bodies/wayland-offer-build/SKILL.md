---
name: wayland-offer-build
description: >-
  Guided offer build using The Donahoe Method. Works through four locks in
  sequence: positioning, stack, pricing, and guarantee, with expert-level
  reasoning the user confirms or overrides at each lock.

  Use when the user wants a structured, multi-step process to build or sharpen
  a sales offer from a single product one-liner into a complete offer document.

  Do NOT use for single-step copy edits or questions a single atomic skill can
  answer without building the full four-lock offer.
license: Apache-2.0
type: workflow
skills: "sales-icp market-funnel convert-temperature funnels-offer convert-three-locks funnels-offer-stack funnels-offer-pricing funnels-offer-guarantee"
metadata:
  author: wayland
  version: 1.0.0
  tags: marketing funnels offer pricing step-by-step donahoe-method
  category: marketing
  depends: "sales-icp market-funnel convert-temperature funnels-offer convert-three-locks funnels-offer-stack funnels-offer-pricing funnels-offer-guarantee"
---
# Offer Build (The Donahoe Method)

**Estimated time:** 25-35 minutes

This workflow guides the user through building a complete sales offer using The
Donahoe Method. The build runs through four locks in order: positioning, stack,
pricing, and guarantee. At each lock the agent presents expert-level reasoning
and lets the user confirm or override before advancing.

Every Method offer starts with a one-line crystallization of what is being
sold. That one-liner is the seed every downstream decision references. The
Method demands "Who is this FOR?" before "What is this?", because the same
offer sells differently to a Cool prospect than a Hot one.

## Steps

**Step 1: Crystallize the Offer One-Liner** (uses: funnels-offer)

Ask the user what they are selling, in one sentence. If they cannot name a
primary offer yet, ask for the audience instead and back into a one-liner.
Capture the result as the seed every later step references. Do not advance
until there is a single, concrete one-line statement of the offer.

- Input: user's product or audience description
- Output: a one-line crystallization of the offer
- Key focus: if you cannot say what you are selling in one sentence, you cannot sell it

**Step 2: Infer the Target Audience** (uses: sales-icp)

Using the one-liner, infer the primary target audience (the ICP). Present the
inferred audience plus the reasoning that produced it, then ask the user to
confirm or name who else fits. The Method requires knowing who the offer is FOR
before refining what it is.

- Input: offer one-liner from Step 1
- Output: confirmed primary target audience
- Key focus: surface the reasoning so the user can fight it, then lock the ICP

**Step 3: Infer the Traffic Source** (uses: market-funnel)

Infer the most likely first-touch channel for this audience and offer. Present
it with reasoning. Ask the user if they are already running a different channel
(own list, partner JV, podcast, paid, etc.), since that changes the architecture
downstream. Confirm or override.

- Input: offer one-liner from Step 1, target audience from Step 2
- Output: confirmed primary traffic source
- Key focus: the real first-touch channel, not the idealized one

**Step 4: Infer Audience Temperature** (uses: convert-temperature)

Classify the audience temperature on the Ice Cold / Cool / Warm / Hot / Boiling
scale given the audience and traffic source. Present the classification, the
reasoning, and the Method implication (wrong temperature equals wrong copy:
Cool audiences need Stack-then-Story, Hot audiences want the Door open).
Confirm or correct.

- Input: offer one-liner, target audience, traffic source from prior steps
- Output: confirmed audience temperature plus its copy implication
- Key focus: temperature dictates copy strategy for every later lock

**Step 5: Build the Positioning (Want lock)** (uses: funnels-offer)

Build the core positioning: the angle that makes this offer different in the
prospect's mind. Use the one-liner, audience, temperature, and traffic source
as inputs. Show the positioning to the user and ask whether it nails the
difference. If they want changes, take their feedback and revise the
positioning before advancing (up to a few refinement passes).

- Input: one-liner, audience, temperature, traffic source
- Output: core positioning statement and angle
- Key focus: the differentiated angle in the prospect's mind, refined to the user's satisfaction

**Step 6: Infer Top Objections (Excuse-lock targets)** (uses: convert-three-locks)

From the confirmed positioning, audience, and temperature, infer the top four
to six objections this prospect will raise. These are the Excuse-lock targets
that the stack must neutralize. Present them with reasoning and ask the user to
confirm or add objections they have heard from real prospects.

- Input: positioning from Step 5, audience, temperature
- Output: confirmed list of top objections
- Key focus: the Excuse lock kills offers; name what must be neutralized

**Step 7: Build the Offer Stack (Trust + Want locks)** (uses: funnels-offer-stack)

Build the offer stack so that each component is engineered to neutralize a
specific objection from Step 6. Use positioning, audience, temperature, and the
objection list as inputs. Show the stack to the user and ask whether to refine
components, bonuses, or order, or proceed to pricing. Revise on feedback before
advancing.

- Input: positioning, audience, temperature, objections
- Output: the offer stack mapped component-to-objection
- Key focus: the stack is the value-perception lever; every component disarms one objection

**Step 8: Build the Pricing** (uses: funnels-offer-pricing)

Build the pricing recommendation, including the LTV / CAC math. Use the stack,
positioning, audience, and temperature as inputs. Show pricing to the user with
the math and ask whether it looks right or needs adjustment (price ceiling,
floor, or known constraints). Revise on feedback before advancing.

- Input: offer stack, positioning, audience, temperature
- Output: pricing recommendation with LTV / CAC math
- Key focus: pricing that pencils out against the offer's economics

**Step 9: Build the Guarantee (Excuse-lock breaker)** (uses: funnels-offer-guarantee)

Build the guarantee that breaks the Excuse lock, the final piece of the four
locks. Use the stack, pricing, positioning, audience, and objections as inputs.
Show the guarantee to the user and ask whether to assemble the complete offer
document or revise the guarantee first. Revise on feedback before advancing.

- Input: offer stack, pricing, positioning, audience, objections
- Output: the guarantee that neutralizes residual risk
- Key focus: the Excuse-lock breaker that removes the last reason not to buy

**Step 10: Assemble the Complete Offer Document** (uses: funnels-offer)

Assemble the full offer document from all confirmed pieces. Include target
audience, traffic source, and temperature at the top, then positioning (Want
lock), top objections (Excuse-lock targets), the offer stack (Trust plus Want),
pricing with the math, and the guarantee (Excuse-lock breaker). Deliver it as
the final artifact, built using The Donahoe Method.

- Input: all confirmed outputs from Steps 1 through 9
- Output: complete offer document covering all four locks
- Key focus: a single coherent document the user can act on immediately
