---
name: wayland-webinar-funnel
description: >-
  Conviction-webinar funnel design. Builds registration, pre-show drip,
  presentation outline, close, and post-webinar cart-close sequence around the
  offer sold at the close, with price driving the architecture.

  Use when the user wants a structured, multi-step process to design a webinar
  funnel for a warm-or-warmer audience and a high-AOV offer.

  Do NOT use for a single webinar asset (one email, one slide) or a question one
  atomic skill can answer without designing the full funnel.
license: Apache-2.0
type: workflow
skills: "sales-icp funnels-conviction-webinar convert-webinar-reg-page funnels-story-drip funnels-cart-cycle-launch"
metadata:
  author: wayland
  version: 1.0.0
  tags: marketing funnels webinar conviction step-by-step high-ticket
  category: marketing
  depends: "sales-icp funnels-conviction-webinar convert-webinar-reg-page funnels-story-drip funnels-cart-cycle-launch"
---
# Webinar Funnel

**Estimated time:** 30-40 minutes

This workflow designs a conviction-webinar funnel, the most reliable path to
high-AOV conversions for a warm-or-warmer audience. Webinars convert best when
the offer at the close is the natural conclusion of the conviction built during
the presentation. Price drives architecture: under $300 the funnel runs shorter,
$1k+ requires the full Conviction stack.

## Steps

**Step 1: Anchor the Close Offer and Price** (uses: funnels-conviction-webinar)

Ask the user what offer is sold at the close and at what price point. Price
drives the whole architecture, so do not advance without both. Note the price
band (under $300 runs shorter, $1k+ needs the full Conviction stack) so later
steps size correctly.

- Input: user's offer and price point at the close
- Output: confirmed close offer and price band
- Key focus: price dictates the length and depth of the conviction build

**Step 2: Infer the Attendee Profile** (uses: sales-icp)

Infer the target attendee profile from the offer and price. Present it with
reasoning and ask the user to confirm or refine. The attendee profile shapes the
conviction arc, registration copy, and follow-up.

- Input: close offer and price from Step 1
- Output: confirmed target attendee profile
- Key focus: who shows up determines how conviction must be built

**Step 3: Infer the Conviction Arc** (uses: funnels-conviction-webinar)

Infer the conviction arc (problem then mechanism then proof then close) given
the offer and attendee profile. Present the arc with reasoning and ask the user
to confirm or adjust. This arc is the spine of the presentation.

- Input: close offer and price, attendee profile
- Output: confirmed conviction arc
- Key focus: the problem-to-close progression that earns the buy

**Step 4: Design the Presentation Outline** (uses: funnels-conviction-webinar)

Design the presentation outline: phases, time blocks, key proof beats, and the
close handoff. Use the offer, attendee profile, and conviction arc. Show it to
the user and ask whether to refine the presentation or proceed to the
registration page. Revise on feedback before advancing.

- Input: close offer, attendee profile, conviction arc
- Output: presentation outline with phases, timing, and proof beats
- Key focus: a presentation whose close is the natural conclusion of the conviction built

**Step 5: Design the Registration Page** (uses: convert-webinar-reg-page)

Design the registration page, engineered for both opt-in AND show-up. Use the
presentation outline, attendee profile, and offer. Show it to the user and ask
whether to refine the registration page or proceed to the drip and follow-up
sequences. Revise on feedback before advancing.

- Input: presentation outline, attendee profile, offer
- Output: registration page copy and structure
- Key focus: maximize opt-in and live show-up, not just opt-in

**Step 6: Design the Pre-Show Drip Sequence** (uses: funnels-story-drip)

Design the pre-show drip sequence that primes registrants to attend live and
arrive pre-convinced. Use the presentation outline, registration page, and
attendee profile in pre-show-drip mode. This sequence raises show-up rate and
warms attendees before the presentation.

- Input: presentation outline, registration page, attendee profile
- Output: pre-show drip email sequence
- Key focus: drive live attendance and pre-convince the registrant

**Step 7: Design the Post-Webinar Cart-Close Sequence** (uses: funnels-cart-cycle-launch)

Design the post-webinar cart-close follow-up sequence that converts attendees
who did not buy on the webinar. Use the presentation outline, offer, and
attendee profile in post-webinar-cart mode. Show it to the user and ask whether
to assemble the complete webinar funnel or refine the drip or follow-up. Revise
on feedback before advancing.

- Input: presentation outline, offer, attendee profile
- Output: post-webinar cart-close email sequence
- Key focus: recover the conversions that do not happen live

**Step 8: Assemble the Webinar Funnel Document** (uses: funnels-conviction-webinar)

Assemble the complete webinar funnel document. Open with the target attendee and
conviction arc, then present the presentation outline, registration page,
pre-show drip sequence, and post-webinar cart-close sequence. Deliver it as the
final artifact.

- Input: all confirmed outputs from Steps 1 through 7
- Output: complete webinar funnel document
- Key focus: one coherent funnel from registration through follow-up
