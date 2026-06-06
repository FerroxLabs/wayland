---
name: funnels-ascension-ladder
slash_command: false
pack: business-funnels
family: funnel_sequence
description: |
  Design a multi-rung product ladder - The Ascension Ladder - from free lead-magnet through tripwire, core offer, premium tier, and continuity. Maps prices, pass-through targets, ascension triggers, and the bridge offer between each rung.
  Use when the user has one product but no path for buyers to ascend, or when they're leaving money on the table because every customer enters and exits at the same rung.
  Not for designing a single offer (use /funnel offer), a single tripwire (use /funnel tripwire), or membership-only continuity (use /funnel continuity).
triggers:
  - value ladder
  - ascension ladder
  - product ladder
  - design my product ladder
  - tier my offers
  - free to high-ticket
  - offer ladder
  - upsell ladder
  - my customers buy once and never come back
  - missing rungs
  - low LTV
  - one-time-purchase business
negative_triggers:
  - audit my live url
  - subscription billing tier
  - shopify product catalog
  - finance pricing model
tags: [funnels, ladder, ascension, offer, continuity, irresistible-stack]
priority: 95
version: 1.0.0
author: Wayland Business Pack
license: MIT
metadata:
  wayland:
    related_skills: [funnels, funnels-offer, funnels-tripwire, funnels-lead-magnet, funnels-continuity, funnels-high-ticket-call, funnels-build-campaign]
attribution:
  lineage: "Wayland Business Suite (Original) - The Ascension Ladder methodology fuses Brunson value-ladder + Hormozi continuum-of-belief + Kern mass-control product structure + Stu McLaren membership-tier ladder"
---

# Funnels Ascension Ladder - The Ascension Ladder

> *"A flat business has one product. A profitable business has a ladder."*

This is the **architecture** skill for a tiered product portfolio - Wayland's fusion-named **The Ascension Ladder**. Where `funnels-offer` designs a single offer, this skill designs the *sequence* of offers a customer ascends across their lifecycle: free → tripwire → core → premium → continuity.

The Ascension Ladder is **Wayland-coined**. It synthesizes the value-ladder concept (popularized by Russell Brunson) + the continuum-of-belief structure (Hormozi) + Kern's mass-control product staging + Stu McLaren's membership-tier ladder mechanics into one buildable framework.

## When to Use

Trigger phrases: "value ladder", "ascension ladder", "product ladder", "design my product ladder", "tier my offers", "free to high-ticket", "my customers buy once and never come back", "missing rungs", "low LTV", `/funnel ascension-ladder <product>`.

Use when:
- The user has one product but no upgrade path for existing buyers
- LTV is dramatically lower than first-purchase revenue
- Customers buy once and disappear
- The user wants to add high-ticket but isn't sure how to bridge from current price tier
- The user is launching a new business and wants to design the full portfolio upfront

Do NOT use for:
- Designing a single offer (use `funnels-offer`)
- Designing a single rung in isolation (use `funnels-tripwire` for the tripwire rung, `funnels-continuity` for the continuity rung, `funnels-high-ticket-call` for the high-ticket rung)
- Auditing an existing ladder for leaks (use `funnels-architecture-audit`)
- Pricing decisions inside a single offer (use `funnels-offer-pricing`)

## Inputs

1. **Existing core product** (if any) - its price, audience, conversion rate
2. **Audience** - the One Person at the entry point
3. **Capability inventory** - what the operator can deliver (DFY, advisory, mastermind, software, info, physical, hybrid)
4. **Time horizon** - full ladder buildout in 30 days? 6 months? 12 months?
5. **Revenue mix target** - does the user want subscription-heavy, project-heavy, info-heavy, or balanced?
6. **Existing customer data** - what do current buyers ask for next?

## The 5-Rung Ladder Structure

The Ascension Ladder has five canonical rungs. Not every business needs all five - some businesses skip rung 2 (tripwire) for high-ticket B2B; some skip rung 5 (continuity) for project-based. But the five-rung map is the diagnostic: missing rungs = leaked revenue.

### Rung 0 - Free / Lead Magnet (entry)

**Price:** $0
**Purpose:** convert traffic → email subscriber, qualify intent
**Conversion target (cold):** 15–30%
**Format options:** PDF guide, swipe file, checklist, mini-course, quiz, calculator, audit, sample chapter, free training, discovery-call (no-cost)

*The lead-magnet entry-point principle (popularized in Brunson's value-ladder; lineage to direct-mail bait-piece tradition; Halbert's "free book offer" cadence)*. Hand off to `funnels-lead-magnet` for full design of this rung.

### Rung 1 - Tripwire ($1–$47)

**Price range:** $1–$47 (sweet spot $7–$27)
**Purpose:** convert subscriber → buyer (the buyer-ID effect)
**Conversion target:** 5–15% of lead-magnet opt-ins
**Format options:** mini-product (PDF + bonus), $1 trial, free-plus-shipping book, low-ticket course, paid quiz, $7 swipe-pack

*The tripwire principle (popularized by Brunson; lineage to Halbert's "first-dollar" buyer-ID concept).* Hand off to `funnels-tripwire` for full design.

The tripwire is the rung most operators skip. Cost: 30–50% lower long-term LTV. The buyer-ID effect - once a buyer has paid you anything, their probability of paying you more later is 5–10x a non-buyer subscriber. The tripwire's primary job is NOT revenue; it's qualification.

### Rung 2 - Core Offer ($97–$497)

**Price range:** $97–$497 (sweet spot $197–$297)
**Purpose:** flagship deliverable - the core problem solved
**Conversion target:** 8–20% of tripwire buyers (or 1–4% of opt-ins skipping tripwire)
**Format options:** 4–12 week course, single-product service, group coaching cohort, software lifetime access, info-product

The core offer is the most-marketed asset. Most operators have only this rung. Hand off to `funnels-offer` to design The Irresistible Stack for this rung.

### Rung 3 - Premium ($997–$2,997)

**Price range:** $997–$2,997 (sweet spot $1,497–$1,997)
**Purpose:** ascend the buyer who needs more depth, more done-for-you, more access
**Conversion target:** 5–15% of core buyers
**Format options:** premium course + 1-on-1, intensive cohort, done-with-you service, advisory retainer, deep mastermind

*The premium-tier principle (Hormozi continuum-of-belief; lineage to Pagan's "moving the free line" extended to paid tiers).* Premium is the *first* high-margin rung - the rung where margin > $500 per buyer makes paid acquisition viable.

### Rung 4 - High-Ticket / Continuity ($5K+ one-time OR $97–$497/mo recurring)

**Price range:** $5,000+ one-time OR $97–$497/month recurring
**Purpose:** stable LTV anchor; the rung that makes the whole ladder profitable
**Conversion target:** 10–30% of premium buyers ascend (one-time) OR 25–50% adopt continuity
**Format options:**
- **One-time high-ticket:** $5K–$25K mastermind, intensive, retainer, done-for-you
- **Continuity:** monthly community, software subscription, advisory retainer, content membership

Hand off to `funnels-high-ticket-call` for the one-time high-ticket version, `funnels-continuity` for the recurring version.

### The "Two Rungs Behind" Rule

*The two-rungs-behind principle (Wayland synthesis from Brunson + Stu McLaren membership-cadence work).* Every active rung should have the rung two-below it pre-built and pre-tested as the ascension feeder.

Example: if you're selling a $497 core offer, you should already have:
- A **lead magnet** (Rung 0) feeding into the tripwire
- A **tripwire** (Rung 1) feeding into the core offer

Don't try to build all 5 rungs simultaneously. Build the active rung + the two below it. Once those three are stable (60+ days of consistent metrics), build the next rung up.

## The Bridge Offer Between Rungs

Each rung-to-rung transition needs a **bridge offer** - the ascension trigger.

| Transition | Bridge offer |
|------------|-------------|
| Rung 0 → Rung 1 | Order-form bump on lead-magnet thank-you page; or post-opt-in email sequence with tripwire CTA |
| Rung 1 → Rung 2 | Order-form bump on tripwire OR OTO immediately post-tripwire-purchase OR 7-14 day nurture sequence |
| Rung 2 → Rung 3 | OTO immediately post-core-purchase OR application-based ascension OR "graduate offer" inside the core deliverable |
| Rung 3 → Rung 4 | Discovery call + application; OR mastermind invite-only ascension; OR continuity offer at the end of premium delivery |

Bridge offers are NOT just upsells - they're *contextual* offers that make sense at the moment they're presented. A premium-tier ascension offered at the moment of buying the core offer (when the buyer is at peak excitement) converts 3–5x better than the same offer presented 30 days later via cold email.

## The Continuum of Belief

*The continuum-of-belief principle (Hormozi $100M Leads; lineage to Schwartz market sophistication).* Each rung requires a higher belief threshold than the prior:

- **Rung 0** - "this person might know something useful"
- **Rung 1** - "this person delivers more than I expected for $7"
- **Rung 2** - "this person delivers a real outcome - I'm willing to pay $497"
- **Rung 3** - "this person can take me deeper - I'll pay $1,997"
- **Rung 4** - "this person is THE person - I'll pay $10K or commit monthly"

Each rung's content + delivery must EXCEED the prior rung's expectations to earn the next ascension. Under-delivering on Rung 1 kills the entire ladder above it.

## Workflow

### Phase 0 - Diagnose current state

1. Map existing rungs (inventory the user's actual products today)
2. Identify which rungs are missing
3. Compute current LTV vs hypothetical full-ladder LTV (estimate)
4. Identify the "active rung" (where most revenue is today)
5. Identify the "two below" rungs that should be built first

### Phase 1 - Design each rung

For each rung in the ladder, specify:

- **Name** of the offer
- **Price** (range from above)
- **Format** (course / service / DFY / etc.)
- **Conversion target** from the prior rung
- **Delivery mechanic** (how you actually deliver the deliverable)
- **Capability fit** (can the operator deliver this in their current capacity?)

### Phase 2 - Design the bridge offers

For each rung-to-rung transition:
- The exact ascension trigger (post-purchase OTO, email sequence, discovery call, etc.)
- The bridge-offer copy (handoff to `convert-cross-sell-page` or similar)
- The conversion target

### Phase 3 - Sequence the build order

If 3+ rungs are missing, sequence the build:
1. Build the active rung first (the one currently making most revenue)
2. Build the rung directly below the active rung (the feeder)
3. Build the rung directly above the active rung (the upsell)
4. Iterate to fill gaps once the 3-rung core is stable

### Phase 4 - Ship the ladder map

Use the output template below.

## Output template

```markdown
# The Ascension Ladder: <Business Name>

**Audience:** <One Person>
**Date:** <YYYY-MM-DD>
**Build horizon:** <30/90/365 days>

## Current State

| Rung | Status | Existing offer | Price | Notes |
|------|--------|---------------|-------|-------|
| 0 | <built/missing> | <name> | $0 | |
| 1 | <built/missing> | <name> | $<X> | |
| 2 | <built/missing> | <name> | $<X> | |
| 3 | <built/missing> | <name> | $<X> | |
| 4 | <built/missing> | <name> | $<X> | |

**Active rung:** <X>
**Estimated current LTV:** $<X>
**Estimated full-ladder LTV:** $<X>

## Designed Ladder

### Rung 0 - Lead Magnet
- **Name:** <The X-Outcome Format>
- **Price:** $0
- **Format:** <PDF / quiz / mini-course / etc.>
- **Conversion target (cold opt-in):** <X>%
- **Skill handoff:** `funnels-lead-magnet`

### Rung 1 - Tripwire
- **Name:** <product name>
- **Price:** $<X>
- **Format:** <format>
- **Conversion target (opt-in → tripwire):** <X>%
- **Bridge from Rung 0:** <order-form bump / OTO / email sequence>
- **Skill handoff:** `funnels-tripwire`

### Rung 2 - Core Offer
- **Name:** <product name>
- **Price:** $<X>
- **Format:** <format>
- **Conversion target (tripwire → core):** <X>%
- **Bridge from Rung 1:** <ascension trigger>
- **Skill handoff:** `funnels-offer` for full Irresistible Stack design

### Rung 3 - Premium
- **Name:** <product name>
- **Price:** $<X>
- **Format:** <format>
- **Conversion target (core → premium):** <X>%
- **Bridge from Rung 2:** <ascension trigger>
- **Skill handoff:** `funnels-offer` (for stack) + `convert-oto-page` (for ascension page)

### Rung 4 - High-Ticket / Continuity
- **Name:** <product name>
- **Price:** $<X> one-time OR $<Y>/month
- **Format:** <format>
- **Conversion target (premium → high-ticket):** <X>%
- **Bridge from Rung 3:** <ascension trigger>
- **Skill handoff:** `funnels-high-ticket-call` OR `funnels-continuity`

## Build Sequence

1. **Phase 1 (week 1–4):** Build/lock <active rung name>
2. **Phase 2 (week 5–8):** Build <feeder rung name>
3. **Phase 3 (week 9–12):** Build <ascension rung name>
4. **Phase 4 (month 4–6):** Fill remaining gaps + add continuity if missing

## Capability Notes

- **Existing assets that map to rungs:** <list>
- **New deliverables required:** <list>
- **Capacity risk:** <DFY services capped at N clients/month, etc.>

## Compositional notes

- Hand off Rung 0 to `funnels-lead-magnet` for full design
- Hand off Rung 1 to `funnels-tripwire` for full design
- Hand off Rung 2 to `funnels-offer` for The Irresistible Stack
- Hand off Rung 3 to `funnels-offer` (premium variant)
- Hand off Rung 4 to `funnels-high-ticket-call` (one-time) or `funnels-continuity` (recurring)
- Hand off the full ladder to `funnels-build-campaign` for end-to-end campaign authoring
- Hand off bridge offers to `convert-oto-page`, `convert-cross-sell-page`, and `convert-thank-you-page`

## Lineage

The Ascension Ladder synthesizes:
- *The value-ladder concept (popularized by Russell Brunson; lineage to direct-mail tier-offer tradition)* - the 5-rung structure
- *The continuum-of-belief principle (popularized by Alex Hormozi)* - why each rung requires a higher belief threshold
- *The mass-control product structure (Frank Kern)* - the bridge-offer mechanic between rungs
- *The membership-tier ladder (Stu McLaren membership cadence work)* - the continuity rung mechanics
- *Eben Pagan's "moving the free line"* - the ascension trigger psychology

The fusion is the value: no single canonical guru's ladder methodology covers all five rungs with bridge-offer mechanics + continuity-tier specifics + the two-rungs-behind build rule. Wayland's Ladder integrates them as one buildable framework.
```

## Notes

- **Single most common ladder mistake:** designing all 5 rungs in parallel and shipping none. Ship the active rung + 2 below first; everything else waits.
- **Second most common mistake:** under-delivering on Rung 1 (the tripwire). The tripwire is where the buyer's belief threshold gets set. Ship the BEST possible product at $7-$27 - that's the rung that earns the rest of the ladder.
- **Third most common mistake:** thinking continuity (Rung 4 recurring) is "passive income." Continuity has the highest churn risk and the highest delivery overhead. Ship continuity LAST, when the lower rungs are stable enough to fund the support cost.
- **TM hygiene:** Brunson, Hormozi, Kern, Stu McLaren, Pagan all appear in body for educational lineage. Their book titles (where applicable) appear in body but NOT in user-facing generated copy. The ladder map output uses Wayland's "Ascension Ladder" name throughout - no Brunson "value ladder" branding in the output.
