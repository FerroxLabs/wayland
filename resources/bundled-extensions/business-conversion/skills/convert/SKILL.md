---
name: convert
pack: business-conversion
family: conversion_orchestrator
description: |
  Author direct-response conversion assets via The Donahoe Method: sales pages, VSLs, squeeze pages, OTOs, downsells, lead-magnet pages, bridge pages, webinar reg, thank-you pages, plus the Method's copy primitives (open, proof, locks, bullets, close, chute, voice).
  Use when the user has a product or offer and needs fresh copy/pages built from a brief - not auditing existing assets.
  Not for analyzing or scoring existing copy on a URL - see /market copy or /market landing for those.
triggers:
  - convert
  - donahoe method
  - the donahoe method
  - write me a sales page
  - build me a sales page
  - write me a sales letter
  - vsl
  - video sales letter
  - squeeze page
  - opt-in page
  - oto page
  - downsell page
  - lead magnet page
  - bridge page
  - thank you page
  - webinar registration
  - apply the method
  - irresistible copy
  - direct response copy from scratch
negative_triggers:
  - audit my landing page
  - cro review
  - score my conversion
  - rewrite my copy
  - analyze the funnel at this url
tags: [conversion, copy, page, donahoe-method, sales-page, vsl, squeeze-page, oto]
priority: 100
version: 1.0.0
author: Wayland Business Pack
license: MIT
metadata:
  wayland:
    related_skills: [convert-sales-page, convert-vsl, convert-open, convert-proof, convert-three-locks, convert-bullets, convert-close, convert-chute, convert-voice, funnels-offer, funnels-build-campaign]
attribution:
  lineage: "Wayland Business Suite (Original) - built on The Donahoe Method, synthesizing Schwartz/Halbert/Caples/Ogilvy/Sugarman/Hormozi/Cialdini canon"
---

# Convert - Conversion Orchestrator (The Donahoe Method, encoded)

Verb-style entry point for the Wayland conversion pack. The user types `/convert <verb> <args>` and this skill dispatches to the corresponding sub-skill. Every sub-skill is auto-registered as its own flat slash command (`/convert-sales-page`, `/convert-vsl`, ...) so power users skip the verb. The orchestrator exists for English-style chaining (`/convert sales-page my-course`) and for composite flows that span multiple sub-skills.

## What this pack ships (33 skills)

This pack is the **conversion-asset authoring layer** of the Wayland Business Suite. Every page-building skill applies **The Donahoe Method** - 8 named frameworks + foundation + voice rules + temperature model - and emits both a structured brief AND a paste-ready HTML/CSS reference implementation.

The Method (full source: `.planning/research/conversion-pack-2026-05-03/the-donahoe-method.md`):

1. **The One Person Rule** - Always writing to one person, not an audience.
2. **The Four Questions** (diagnostic) - Why You / Why Me / Why This / Why Now.
3. **The Four-Layer Open** - Nerve Strike → Side Door → Skin in the Game → Fingerprint.
4. **Conversational Proof** - Claim → evidence (story/specific) → reason → move on. 5 types: Anecdote, Receipt, Drive-By, Namecheck, Because.
5. **The Three Locks** - Want, Trust, Excuse. All three must open before they buy.
6. **The Donahoe Bullet System** - Keyhole, Flip, Snapshot, Scar. Mixed for rhythm.
7. **The Cascade Close** - Stack → Vision → Math → Safety Net → Door + P.S. + P.P.S.
8. **The Greased Chute** - Engineer momentum: open loops, paragraph length, sentence rhythm, transition curiosity.
9. **Market Temperature** - Ice Cold / Cool / Warm / Hot / Boiling. Different copy per temp.
10. **The Donahoe Transition System** - 10 moves: Comparison Bomb, Escalation, Aside Bomb, Interrupt, Dismiss, Diagnostic, Assumed Agreement, Internal Moment, Admission, Energy Drop.
11. **The Donahoe Voice Rules** - Sentence mechanics + word choices + structural moves + the Bullshit Filter.

## When to Use

Trigger this orchestrator when the user wants to **build a conversion asset from a brief or product description**. Typical invocations:

- `/convert sales-page <product>` - long-form direct-response sales page (HTML + brief)
- `/convert vsl <product>` - video sales letter script (18-min structure + timestamps)
- `/convert squeeze <product>` - single-purpose opt-in page
- `/convert oto <product>` - One-Time Offer page
- `/convert downsell <product>` - OTO recovery page
- `/convert lead-magnet-page <product>` - free→email opt-in page
- `/convert bridge <product>` - advertorial / pre-sell content piece
- `/convert webinar-reg <event>` - webinar registration page
- `/convert thank-you <product>` - thank-you page with secondary offer
- `/convert audit <copy>` - Donahoe Method audit on existing copy
- `/convert package <product>` - composite full-asset build (research → primitives → page → visual → audit)

Do **NOT** trigger this orchestrator for:
- Auditing an existing live URL (use `/market landing <url>` or `/market copy <url>`)
- Analyzing a funnel's conversion path on a live site (use `/market funnel <url>`)
- Designing the offer structure itself (use `/funnel offer` - that's funnels pack territory)
- Designing the sequence the asset lives in (use `/funnel ladder`, `/funnel cart-cycle-launch`, `/funnel conviction-webinar`)

## Verbs

| Verb | Sub-skill | One-liner |
|------|-----------|-----------|
| `four-questions` | `convert-four-questions` | Run The Four Questions diagnostic (Why You / Me / This / Now) |
| `temperature` | `convert-temperature` | Classify reader temperature (Ice Cold / Cool / Warm / Hot / Boiling) |
| `open` | `convert-open` | Generate Four-Layer Open (Nerve Strike + Side Door + Skin in Game + Fingerprint) |
| `proof` | `convert-proof` | Apply Conversational Proof - claim → evidence → reason → move on; 5 types library |
| `locks` | `convert-three-locks` | Architect Want / Trust / Excuse persuasion sequence |
| `bullets` | `convert-bullets` | Generate bullets across 4 types (Keyhole / Flip / Snapshot / Scar) mixed for rhythm |
| `close` | `convert-close` | The Cascade Close - Stack → Vision → Math → Safety Net → Door + P.S. + P.P.S. |
| `chute` | `convert-chute` | Engineer momentum (open loops, rhythm, transitions, read-aloud test) |
| `transition` | `convert-transition` | Library of 10 transition moves; integrate into existing copy |
| `voice` | `convert-voice` | Apply Donahoe Voice Rules + Bullshit Filter |
| `fingerprint` | `convert-fingerprint` | Develop the only-you POV / contrarian take / vivid voice |
| `bullshit-filter` | `convert-bullshit-filter` | Pass any draft through "would I actually say this to someone I'm trying to help?" |
| `sales-page` | `convert-sales-page` | Long-form direct-response sales page (full Method + HTML/CSS) |
| `vsl` | `convert-vsl` | VSL script (18-min structure with timestamps) |
| `vsl-page` | `convert-vsl-page` | VSL hosting page + buy-button reveal mechanics |
| `squeeze` | `convert-squeeze-page` | Single-purpose opt-in page |
| `oto` | `convert-oto-page` | One-Time Offer page |
| `downsell` | `convert-downsell-page` | OTO recovery page |
| `bump` | `convert-bump` | Order-form bump micro-copy + checkbox HTML |
| `cross-sell` | `convert-cross-sell-page` | Post-purchase upsell with relevant bundles |
| `lead-magnet-page` | `convert-lead-magnet-page` | Free→email opt-in page |
| `thank-you` | `convert-thank-you-page` | Thank-you page with secondary-offer stack |
| `bridge` | `convert-bridge-page` | Advertorial / listicle / pre-sell content |
| `webinar-reg` | `convert-webinar-reg-page` | Webinar registration page |
| `checkout` | `convert-checkout-page` | Checkout micro-copy + trust signals |
| `above-fold` | `convert-above-fold` | Above-fold hierarchy + 5-second test |
| `scroll-rhythm` | `convert-scroll-rhythm` | Scroll-depth orchestration aligned to Three Locks |
| `mobile` | `convert-mobile` | Mobile thumb-zone + reading-pattern compression |
| `proof-stack` | `convert-proof-stack` | Visual proof stacking (testimonials, logo bars, video > text) |
| `audit` | `convert-audit` | Donahoe Method audit (8 frameworks scored) |
| `package` | `convert-package` | Composite - full sales asset end-to-end |
| `report` | `convert-report` | Aggregate prior runs into client-ready report |

## Inputs

- **First positional arg:** the verb (one of the table above)
- **Remaining args:** passed through as the sub-skill's input (product description, offer brief, target audience, etc.)
- **`out_path`** *(optional):* explicit output file. Defaults via `build_report_path("business-conversion", instruction)`.

## Routing logic

1. Parse the first whitespace-delimited token as the verb. Lowercase it.
2. If the verb maps to a sub-skill in the table above, invoke it via `delegate_task` with the remaining args as the goal and `out_path` injected if the caller supplied one.
3. If the verb is `package` or another composite, run the composite flow (see below).
4. If the verb is unknown, list the verb table back to the user and ask which one they meant. Do not guess.

## Composite flows

### `/convert package <product>`

The full sales-asset build end-to-end. Fans out the following sequence:

1. `convert-four-questions <product>` - diagnostic
2. `convert-temperature <product>` - temperature classification
3. Parallel: `convert-open` + `convert-three-locks` (architecture pass)
4. Parallel: `convert-bullets` + `convert-proof` + `convert-close` (component pass)
5. `convert-sales-page` (composes the above into the full page + HTML/CSS)
6. `convert-audit` (Method audit on the result)
7. `convert-report` (client-ready aggregate)

### `/convert quick <product>`

60-second compressed Method snapshot:
- 1 four-question answer set
- 1 temperature read
- 1 four-layer open
- 1 cascade close opener
- 5 bullet candidates (one per type)

For when the user wants a feel for what the Method produces before committing to a full asset.

## Cross-pack delegation

The conversion pack handles **assets**. The funnels pack handles **architecture**. They compose:

- `/convert sales-page` builds the page; `/funnel offer` designs what's sold on it.
- `/funnel build-campaign` cross-pack composite calls `/convert sales-page`, `/convert vsl`, `/convert squeeze` etc. as part of full-campaign delivery.
- For end-to-end ("AI replaces the agency"), use the suite-level `/launch <product>` composite (in business-campaign-suite meta-pack).

## The Donahoe Method as the operating system

Every writing skill (`convert-open`, `convert-proof`, etc.) and every page-builder calls them in proper order. Every page emits a Method coverage report - a footer that names which frameworks ran at full coverage, where coverage compressed, and where the asset's scale made a framework not applicable. The footer never grades its own work; it routes to a separate Bullshit Filter pass:

```
Method coverage report:
  Open:           full / partial / n-a - <one-line reasoning>
  Three Locks:    full / partial / n-a - <one-line reasoning>
  Proof:          full / partial / n-a - <one-line reasoning>
  Bullets:        full / partial / n-a - <one-line reasoning>
  Cascade Close:  full / partial / n-a - <one-line reasoning>
  Greased Chute:  full / partial / n-a - <one-line reasoning>
  Voice Rules:    full / partial / n-a - <one-line reasoning>
  Temperature:    <Ice Cold / Cool / Warm / Hot / Boiling>

Required next step: Run /convert bullshit-filter on this draft before shipping.
The Filter is a SEPARATE pass - this skill cannot grade its own output.
```

Without that footer + a Bullshit Filter coaching pass, the asset isn't done.

## Notes

- The Method is the **operating system**. Lineage authors (Schwartz, Halbert, Caples, Ogilvy, Sugarman, Hormozi, Cialdini) are cited as method-depth where their canonical concepts add specific value (e.g., Schwartz awareness levels in `convert-temperature`, Caples 35 headline formulas in `convert-open` Layer 1).
- All page-builder outputs must pass `convert-bullshit-filter` before delivery. If the filter fails, route back to the relevant writing skill for rewrite.
- HTML/CSS reference implementations target paste-ready usage in Webflow / Framer / Wix / Carrd / static HTML hosts. Modern semantic HTML, mobile-first CSS, no framework dependencies.
