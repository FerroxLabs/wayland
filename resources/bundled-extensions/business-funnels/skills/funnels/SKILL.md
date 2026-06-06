---
name: funnels
pack: business-funnels
family: funnels_orchestrator
description: |
  Architect direct-response funnels and offers: irresistible-stack offer construction (Hormozi value equation + bonus stack + guarantee), value/ascension ladders, lead magnets, tripwires, conviction-webinar funnels, evergreen funnels, cart-cycle launches, high-ticket discovery-call sequences, story-drip and daily-pivot email cadences, continuity ladders, plus full-campaign composite.
  Use when the user needs to design the offer or the sequence - not when they want to write the page that sells it (use /convert) or audit a live URL (use /market funnel).
  Not for CRO leak analysis on an existing site URL - that's market-funnel.
triggers:
  - design my funnel
  - architect my funnel
  - build me an offer
  - design my offer
  - what should I charge
  - irresistible offer
  - irresistible stack
  - value ladder
  - ascension ladder
  - lead magnet
  - tripwire
  - webinar funnel
  - conviction webinar
  - evergreen webinar
  - launch sequence
  - cart-cycle launch
  - high ticket sales funnel
  - story drip sequence
  - daily pivot emails
  - continuity offer
  - membership funnel
  - audit my funnel architecture
  - is my offer wrong
  - hormozi value equation
  - stack bonuses
  - design my guarantee
negative_triggers:
  - cro audit my url
  - analyze my funnel url
  - my landing page is leaking
  - score my conversion rate
  - finance audit
  - subscription billing bug
tags: [funnels, offer, ladder, webinar, launch, lead-magnet, tripwire, continuity, donahoe-method]
priority: 100
version: 1.0.0
author: Wayland Business Pack
license: MIT
metadata:
  wayland:
    related_skills: [funnels-offer, funnels-offer-stack, funnels-offer-pricing, funnels-offer-guarantee, funnels-offer-audit, funnels-ascension-ladder, funnels-lead-magnet, funnels-tripwire, funnels-conviction-webinar, funnels-evergreen, funnels-cart-cycle-launch, funnels-high-ticket-call, funnels-story-drip, funnels-daily-pivot, funnels-continuity, funnels-architecture-audit, funnels-build-campaign, convert, convert-sales-page]
attribution:
  lineage: "Wayland Business Suite (Original) - fuses Hormozi value equation + Brunson belief-shift cadence + Walker pre-launch + Kern stick strategy + Pagan moving-the-free-line + Stu McLaren membership tiers + Kennedy magnetic-attraction + Schwartz market sophistication"
---

# Funnels - Funnel & Offer Architecture Orchestrator

Verb-style entry point for the Wayland funnels pack. The user types `/funnel <verb> <args>` and this skill dispatches to the corresponding sub-skill. Every sub-skill is auto-registered as its own flat slash command (`/funnel-offer`, `/funnel-conviction-webinar`, ...) so power users skip the verb.

This pack is the **architecture layer** of the Wayland Business Suite. While conversion handles assets (pages, copy), funnels handles the *structure*: what's the offer, how does it stack, what's the price, what's the sequence the customer moves through, what's the ladder of products they ascend?

## What this pack ships (18 skills)

### Family: offer architecture (5 skills) - THE PROMOTED FAMILY

Per the user's stated #1 leverage point: "offer architecture is the biggest problem for most people." This family is the centerpiece. Master skill produces **The Irresistible Stack** - synthesizes Hormozi value equation (math) + Kennedy magnetic offer + Sugarman psychological triggers + Halbert offer construction + Schwartz market sophistication.

### Family: funnel sequence (7 skills)

Wayland-coined fusion names that synthesize multiple canonical traditions. Trademark-clean, ≥2 lineage authors cited per fusion skill body.

### Family: continuity (1 skill) + audit + composite (2 skills)

## When to Use

Trigger this orchestrator when the user wants to **design the offer or the sequence** - not write the page that sells it. Typical invocations:

- `/funnel offer <product>` - Irresistible Stack offer construction (Hormozi-led)
- `/funnel offer-stack <product>` - bonus stacking + value math
- `/funnel offer-pricing <product>` - pricing levers (anchor, contrast, payments, splits)
- `/funnel offer-guarantee <product>` - guarantee design (conditional / unconditional / double / better-than)
- `/funnel offer-audit <existing-offer>` - score offer on 8 dimensions; identify weak lever
- `/funnel ascension-ladder <product>` - design tiered product ladder
- `/funnel lead-magnet <topic>` - lead magnet design (PDF / quiz / mini-course / template / sample-chapter / calculator / discovery-call)
- `/funnel tripwire <product>` - $1-$27 entry-product design
- `/funnel conviction-webinar <product>` - 4-stage high-ticket webinar architecture
- `/funnel evergreen <product>` - auto-webinar / evergreen funnel
- `/funnel cart-cycle-launch <product>` - pre-launch content + cart-window launch sequence
- `/funnel high-ticket-call <product>` - lead-magnet → discovery-call → close sequence + sales-call script
- `/funnel story-drip <product>` - multi-day narrative email arc
- `/funnel daily-pivot <product>` - daily story-pivots-to-pitch email format
- `/funnel continuity <product>` - subscription/membership conversion ladder
- `/funnel architecture-audit <existing-funnel>` - leak analysis at offer + sequence + ladder level
- `/funnel build-campaign <product>` - cross-pack composite: full campaign build calling /convert for assets

## Verbs

| Verb | Sub-skill | One-liner |
|------|-----------|-----------|
| `offer` | `funnels-offer` | The Irresistible Stack - master offer construction |
| `offer-stack` | `funnels-offer-stack` | Bonus stack + value-stack composition |
| `offer-pricing` | `funnels-offer-pricing` | Pricing levers (anchor/contrast/payments/splits) |
| `offer-guarantee` | `funnels-offer-guarantee` | Guarantee design + risk-reversal |
| `offer-audit` | `funnels-offer-audit` | Score offer on 8 dimensions |
| `ascension-ladder` | `funnels-ascension-ladder` | Tiered product ladder (free → low → core → high → continuity) |
| `lead-magnet` | `funnels-lead-magnet` | Lead-magnet design + selection (with conversion benchmarks per type) |
| `tripwire` | `funnels-tripwire` | $1-$27 entry-product design + buyer-ID psychology |
| `conviction-webinar` | `funnels-conviction-webinar` | 4-stage high-ticket webinar architecture (pre-frame → content → pitch → close) |
| `evergreen` | `funnels-evergreen` | Auto-webinar + evergreen scarcity mechanics |
| `cart-cycle-launch` | `funnels-cart-cycle-launch` | Pre-launch content + open-cart + close-cart sequence |
| `high-ticket-call` | `funnels-high-ticket-call` | Lead-magnet → discovery-call → close + full sales-call script |
| `story-drip` | `funnels-story-drip` | Multi-day narrative email arc |
| `daily-pivot` | `funnels-daily-pivot` | Daily story-pivots-to-pitch email format |
| `continuity` | `funnels-continuity` | Subscription/membership conversion ladder |
| `architecture-audit` | `funnels-architecture-audit` | Funnel architecture audit (NOT URL crawl) |
| `build-campaign` | `funnels-build-campaign` | Composite: full campaign - offer + ladder + lead magnet + tripwire + core page + OTO sequence |

## Inputs

- **First positional arg:** the verb
- **Remaining args:** passed through as the sub-skill's input (product description, offer brief, target audience, etc.)
- **`out_path`** *(optional):* explicit output file. Defaults via `build_report_path("business-funnels", instruction)`.

## Routing logic

1. Parse the first whitespace-delimited token as the verb. Lowercase it.
2. If the verb maps to a sub-skill in the table above, invoke via `delegate_task` with remaining args.
3. If the verb is `build-campaign` or another composite, run the cross-pack composite flow.
4. If the verb is unknown, list the table back to the user and ask which one they meant.

## Composite flows

### `/funnel build-campaign <product>`

Cross-pack full-campaign composite. Fans out:

**Phase 1 - Architecture (funnels):**
1. `funnels-offer <product>` - design The Irresistible Stack
2. `funnels-ascension-ladder <product>` - map the tiered ladder
3. `funnels-lead-magnet <product>` - pick + design the lead magnet
4. `funnels-tripwire <product>` - design the $1-$27 entry product
5. `funnels-conviction-webinar <product>` OR `funnels-cart-cycle-launch <product>` (depending on launch model) - design the conversion sequence

**Phase 2 - Assets (delegates to convert pack):**
6. `convert-lead-magnet-page` - opt-in page
7. `convert-bridge-page` - advertorial pre-sell
8. `convert-webinar-reg-page` OR `convert-sales-page` (depending on model) - main asset
9. `convert-vsl` + `convert-vsl-page` - VSL script + page
10. `convert-oto-page` + `convert-downsell-page` - post-purchase ladder

**Phase 3 - Sequence (back to funnels):**
11. `funnels-story-drip` - narrative email arc
12. `funnels-daily-pivot` - daily emails through cart-window

**Phase 4 - Audit:**
13. `funnels-architecture-audit` - full architecture review
14. `convert-audit` - Donahoe Method audit on every page

This is the "AI replaces the agency" composite. Expected runtime: 15-30 minutes wall-clock with parallel delegation; outputs ~80-120 pages of campaign artifacts.

## Cross-pack discipline

- **Funnels designs structure. Conversion writes copy.** If the user says "build me a sales page", route to `/convert sales-page` not here. If they say "design my funnel" or "what should I charge", route here.
- **Marketing audits live URLs. Funnels designs from scratch.** If the user says "analyze the funnel at acme.com", route to `/market funnel <url>` not here. If they say "design my funnel" without a URL, route here.
- **Hormozi math, Donahoe voice.** Offer-family skills use the Hormozi value equation (Dream Outcome × Likelihood / Time × Effort) as the math + Donahoe Method voice for any user-facing copy elements (pricing-page hero, guarantee statement, etc.).

## Trademark + lineage policy

This pack uses **Wayland-coined fusion names** for synthesized mechanisms. Trademarked phrases (Perfect Webinar, One Funnel Away, Product Launch Formula, Grand Slam Offer, ClickFunnels) NEVER appear in skill names, descriptions, or generated copy. Behavioral test enforces.

Each fusion skill cites ≥2 canonical lineage authors in body. Examples:

- `funnels-conviction-webinar` cites Brunson + Kern + Pagan + Stu McLaren
- `funnels-cart-cycle-launch` cites Walker + Kern + Brunson + Pagan
- `funnels-offer` (The Irresistible Stack) cites Hormozi + Kennedy + Sugarman + Halbert + Schwartz
- `funnels-ascension-ladder` cites Brunson + Hormozi + Kern + Stu McLaren

The fusion is genuinely the value: each Wayland skill ships the synthesis, not any single guru's branded variant.
