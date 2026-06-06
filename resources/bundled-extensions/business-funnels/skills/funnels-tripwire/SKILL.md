---
name: funnels-tripwire
slash_command: false
pack: business-funnels
family: funnel_sequence
description: |
  Design the tripwire offer - a $1–$47 entry product that converts a subscriber into a buyer. Sets the price, format, immediate-value mechanic, OTO-bridge to the core offer, and the buyer-ID effect mechanics that make tripwire-buyers 5–10x more likely to ascend.
  Use when the user has email opt-ins but no buyer-ID yet, or when leads aren't ascending to the core offer because they've never paid anything.
  Not for designing the lead magnet above it (use /funnel lead-magnet) or the core offer below it (use /funnel offer).
triggers:
  - design my tripwire
  - tripwire offer
  - low-ticket entry product
  - buyer ID
  - first dollar
  - $7 product
  - $27 product
  - free plus shipping
  - my email list isn't buying
  - convert subscribers to buyers
  - entry-level product
  - micro-product
negative_triggers:
  - audit my live url
  - shopify upsell flow
  - finance entry-level product
  - free trial
tags: [funnels, tripwire, low-ticket, ladder, buyer-id]
priority: 90
version: 1.0.0
author: Wayland Business Pack
license: MIT
metadata:
  wayland:
    related_skills: [funnels, funnels-lead-magnet, funnels-offer, funnels-ascension-ladder, convert-checkout-page, convert-bump, convert-oto-page]
attribution:
  lineage: "Wayland Business Suite (Original) - tripwire methodology grounded in Brunson buyer-ID effect + Halbert 'first-dollar' direct-mail concept + Cialdini commitment-and-consistency + standard $1–$47 sweet-spot pricing"
---

# Funnels Tripwire - The First-Dollar Entry

> *"The first dollar a buyer pays you is worth more than the next $1,000 they'll pay anyone else."*

This skill designs **Rung 1** of The Ascension Ladder - the $1–$47 tripwire offer whose primary job is *not* revenue but **buyer-ID**: converting a free subscriber into a paid buyer, which makes them 5–10x more likely to ascend to the core offer and beyond.

## When to Use

Trigger phrases: "design my tripwire", "tripwire offer", "low-ticket entry product", "buyer ID", "first dollar", "$7 product", "free plus shipping", "my email list isn't buying", `/funnel tripwire <product>`.

Use when:
- The user has email opt-ins from a lead magnet but the list isn't converting to the core offer
- The user wants to skip Rung 1 ("just go straight to my core") and we need to make the case for why the tripwire matters
- The user has a tripwire but it's underperforming on take-rate or downstream ascension
- The user is building the ladder fresh and needs Rung 1 designed alongside Rung 0 + Rung 2

Do NOT use for:
- Designing the lead magnet above (use `funnels-lead-magnet`)
- Designing the core offer below (use `funnels-offer`)
- Designing the order-form bump on the tripwire purchase (use `convert-bump`)
- Designing the OTO ascension immediately post-tripwire (use `convert-oto-page`)

## The Buyer-ID Effect (the *whole* point of the tripwire)

*The buyer-ID principle (popularized by Russell Brunson; lineage to Gary Halbert's "first-dollar" direct-mail concept; Cialdini commitment-and-consistency).* Once a buyer hands over money - even $1 - three things change:

1. **Identity shift.** The buyer's self-concept moves from "browser" to "buyer." This shift triggers Cialdini's commitment-consistency: future purchases become consistent with the established identity.
2. **Card on file.** The transactional friction is gone. Subsequent offers (OTOs, upsells, core ascension) face zero new-buyer friction.
3. **Filter on intent.** Buyers who pay $7 are dramatically more qualified than free subscribers. The 5–10x ascension multiplier is real.

The tripwire's revenue is often *negative* once you account for fulfillment + payment processing - and that's fine. The tripwire's profit is in the OTO immediately downstream, plus the increased ascension probability for the next 12 months.

## Inputs

1. **Lead magnet** - the magnet feeding into the tripwire (handoff from `funnels-lead-magnet`)
2. **Core offer** - the offer the tripwire ascends to (handoff from `funnels-offer`)
3. **Audience** - the One Person at this rung
4. **Existing assets** - recordings, swipe files, mini-products that could be packaged into a tripwire
5. **Production capacity** - can the user fulfill physical (free + shipping) or only digital?

## The 5 Tripwire Formats

| Format | Price | Take rate | Production cost | Best for |
|--------|-------|----------|----------------|----------|
| **Mini-product (PDF + bonus)** | $7–$27 | 5–15% | Low | Info-products, courses |
| **Free + shipping (book)** | $0 + $7–$15 ship | 8–20% | Med (physical fulfill) | Authors, coaches, mature offers |
| **$1 trial (7-day)** | $1 → $X/mo | 5–10% | Med (cancel logic) | SaaS, software, membership |
| **Mini-course / video pack** | $17–$47 | 3–10% | Med (record 1–3 hrs) | Course sellers, coaches |
| **Paid quiz / audit** | $7–$27 | 8–18% | High (build) | B2B services, agencies |

**Sweet spot pricing:** $7, $17, $27. These three prices dominate the tripwire space because they're below the "I need to think about it" threshold for almost any income level + above the "$0.99 = junk" threshold.

- **$7** - fastest impulse-buy; broadest audience
- **$17** - middle; signals slightly more value than $7
- **$27** - highest; gates lower-quality buyers, raises take rate quality

## The Tripwire Construction Rules

### Rule 1 - Over-deliver on absolute terms

The tripwire must deliver value disproportionate to the price. The buyer's first paid interaction sets the belief threshold for every future ascension. A weak tripwire kills the ladder above it.

**Calibration:** the tripwire should feel like a $97 product priced at $7. *(Lineage: Halbert's bait-piece tradition + Hormozi's value-equation lever-1 applied at micro-scale.)*

### Rule 2 - One specific outcome

The tripwire delivers ONE specific, narrow, deliverable outcome - not a full transformation. The full transformation lives at Rung 2 (core offer).

Example for a copywriting business:
- **Wrong tripwire:** "Become a 6-figure copywriter" (overpromise - that's the core offer)
- **Right tripwire:** "Write your first cold-email sequence in 30 minutes using these 5 templates" (narrow, specific, deliverable, fast)

### Rule 3 - Immediate gratification

The tripwire delivers value within 60 minutes of purchase. *(Lineage: Hormozi time-delay lever; Halbert's "instant gratification" mail-order tradition.)* Digital delivery, immediate access, fast use. The buyer's first paid experience must be: "I paid, I used it, I won."

### Rule 4 - Direct adjacency to the core offer

The tripwire's outcome should be a *narrow slice* of the core offer's transformation. Solving 1/10th of the same problem. This makes the ascension natural: *"You loved the cold-email templates? The full course gives you 200+ templates across 8 sequences and the writing system that produces them."*

### Rule 5 - Mandatory order-form bump + OTO

The tripwire NEVER ships alone. It always ships with:
- **Order-form bump** (a $7–$27 add-on at checkout - usually a complementary template / swipe file / quick-win) - handoff to `convert-bump`
- **OTO immediately post-purchase** (a $47–$197 ascension to a deeper version) - handoff to `convert-oto-page`

The tripwire + bump + OTO together form the **front-end revenue stack**. Together they often:
- Cover the cost of paid traffic (the tripwire is the customer-acquisition mechanism)
- Pre-qualify buyers for the core offer (the bump and OTO take-rate predicts core-offer conversion)
- Establish the buyer's card-on-file (used for downstream OTOs across the ladder)

## Workflow

### Phase 0 - Confirm inputs

- Lock the lead magnet above (handoff from `funnels-lead-magnet`)
- Lock the core offer below (handoff from `funnels-offer`)
- Identify what 1/10th-slice of the core offer is the tripwire promise

### Phase 1 - Pick the format

Walk the 5-format table. Most digital-info tripwires land on **Mini-product (PDF + bonus)** at $17 or $27. Physical-product / book tripwires land on **Free + shipping**. SaaS lands on **$1 trial**.

### Phase 2 - Set the price

Default to the $17 or $27 sweet spot. Use $7 only for very-cold-traffic / commodity-priced markets. Use $47 only when the tripwire is materially substantial (a recorded 90-min training, etc.).

### Phase 3 - Define the outcome

The tripwire's promise: ONE specific, narrow, deliverable outcome. Apply the over-deliver rule and the adjacency rule. Generate the headline promise.

### Phase 4 - Structure the deliverable

For the chosen format, structure the contents - what specifically the buyer gets. Apply the immediate-gratification rule (deliver value within 60 minutes of purchase).

### Phase 5 - Design the front-end revenue stack

Specify:
- **Order-form bump** - name, price ($7–$27), purpose (complementary), take-rate target (30–50%)
- **OTO immediately post-purchase** - name, price ($47–$197), purpose (ascend to deeper version), take-rate target (10–30%)
- **Optional downsell** - name, price ($17–$47), purpose (recover OTO decliners), take-rate target (5–20%)

### Phase 6 - Define the bridge to core offer

The tripwire is not the end - it's the entry. Define:
- Email sequence post-tripwire-purchase (handoff to `funnels-story-drip`)
- The bridge offer to Rung 2 (typically a 7–14 day nurture + soft pitch)
- The "graduate" framing - *"You've done the cold-email piece. Ready for the full system?"*

## Output template

```markdown
# Tripwire Offer: <Name>

**Lead magnet above:** <name>
**Core offer below:** <name>
**Audience:** <One Person>
**Date:** <YYYY-MM-DD>

## Format + Price

**Format:** <mini-product / free+ship / $1 trial / mini-course / paid quiz>
**Price:** $<X> (<reasoning - why $7 vs $17 vs $27>)
**Take-rate target:** <X–Y>% of opt-ins
**Buyer-ID lift expected:** 5–10x ascension probability vs free subscriber

## The Promise

**Headline outcome:** "<one specific, narrow, fast outcome>"
**Time-to-result:** <minutes / hours - must be <24h>
**Adjacency to core:** <one sentence - how this is 1/10th of the core offer's transformation>

## Deliverable Structure

| Component | What it is | Format | Length |
|----------|-----------|--------|--------|
| Main deliverable | <name> | <PDF/video/template> | <pages/min> |
| Bonus 1 (mandatory) | <name> | <format> | <length> |
| Bonus 2 (optional) | <name> | <format> | <length> |

**Over-deliver test:** PASSED - feels like a $97 product at $<X>
**Anti-bait test:** PASSED - keeps the promise of the headline
**60-min gratification test:** PASSED - buyer extracts value within 60 min

## Front-End Revenue Stack

### Order-Form Bump
- **Name:** <bump name>
- **Price:** $<X>
- **Purpose:** complementary fast-win
- **Take-rate target:** 30–50%
- **Skill handoff:** `convert-bump`

### OTO (post-purchase)
- **Name:** <OTO name>
- **Price:** $<47–$197>
- **Purpose:** ascend to deeper version
- **Take-rate target:** 10–30%
- **Skill handoff:** `convert-oto-page`

### Downsell (optional)
- **Name:** <downsell name>
- **Price:** $<17–$47>
- **Purpose:** recover OTO decliners
- **Take-rate target:** 5–20%
- **Skill handoff:** `convert-downsell-page`

## Bridge to Core Offer

- **Email sequence:** handoff to `funnels-story-drip` (5–7 emails over 14 days)
- **Soft pitch trigger:** day <N>
- **Bridge framing:** "<copy: the 'graduate' framing from tripwire to core>"

## Compositional notes

- Hand off the tripwire deliverable creation to user's authoring workflow
- Hand off the order form / checkout to `convert-checkout-page`
- Hand off the order-form bump copy to `convert-bump`
- Hand off the OTO page to `convert-oto-page`
- Hand off the downsell page to `convert-downsell-page`
- Hand off the post-purchase email sequence to `funnels-story-drip`
- Hand off the bridge-to-core email to `funnels-daily-pivot` for ongoing soft pitches

## Lineage

The tripwire methodology synthesizes:
- *The buyer-ID effect (popularized by Russell Brunson; lineage to direct-mail buyer-list construction)* - the strategic purpose
- *Halbert's "first-dollar" concept (Boron Letters)* - the qualification threshold
- *Cialdini's commitment-and-consistency principle (Influence, 1984)* - the identity-shift mechanic
- *Hormozi's value-equation applied at micro-scale ($100M Offers)* - the over-deliver rule + immediate-gratification rule

The tripwire is not a Wayland-coined fusion name - the term "tripwire" is generic across direct-response and used freely. The mechanics are the value: most operators ship a tripwire without the front-end stack (bump + OTO) and miss 60–80% of the available revenue at this rung.
```

## Notes

- **Single most common tripwire mistake:** treating it as a revenue play. The tripwire's revenue is often near-zero net of payment processing and fulfillment. The profit is in the front-end stack (bump + OTO) and the downstream ascension lift.
- **Second most common mistake:** under-delivering on the tripwire to "save value for the core offer." This kills the ladder. The buyer's first paid experience determines whether they ascend. Over-deliver.
- **Third most common mistake:** skipping the tripwire and going free → core. The buyer-ID effect is real and 5–10x. Skipping Rung 1 leaks 60–80% of potential ascension revenue.
- **The $1 trial is the trickiest format.** SaaS-only. Watch the cancel-before-billed mechanics carefully - too easy = high churn; too hard = chargebacks. Calibrate.
- **TM hygiene:** Brunson, Halbert, Cialdini, Hormozi appear in body for educational lineage. The output uses generic "tripwire" terminology - no branded methodology phrases.
