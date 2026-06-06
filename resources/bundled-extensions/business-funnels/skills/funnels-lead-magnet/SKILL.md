---
name: funnels-lead-magnet
slash_command: false
pack: business-funnels
family: funnel_sequence
description: |
  Design and select the lead magnet - the free asset that converts traffic to email list. Picks format (PDF / checklist / template / mini-course / quiz / calculator / discovery-call / sample-chapter), names it, structures it, and matches conversion benchmarks per type to audience awareness level.
  Use when the user has traffic but no opt-in yet, or when their existing lead magnet is converting below benchmark and needs a redesign.
  Not for designing the opt-in PAGE that sells the magnet (use /convert lead-magnet-page) or the tripwire offer below it (use /funnel tripwire).
triggers:
  - design my lead magnet
  - lead magnet
  - opt-in offer
  - free offer
  - what should my freebie be
  - bait piece
  - free PDF guide
  - quiz funnel
  - free training
  - free checklist
  - downloadable guide
  - email magnet
negative_triggers:
  - audit my live url
  - shopify free gift with purchase
  - finance free trial
  - subscription free trial code
tags: [funnels, lead-magnet, opt-in, top-of-funnel, ladder]
priority: 90
version: 1.0.0
author: Wayland Business Pack
license: MIT
metadata:
  wayland:
    related_skills: [funnels, funnels-ascension-ladder, funnels-tripwire, convert-lead-magnet-page, convert-squeeze-page, convert-bullets, convert-voice]
attribution:
  lineage: "Wayland Business Suite (Original) - lead-magnet methodology grounded in canonical conversion benchmarks per type, Schwartz awareness-level matching, and Halbert bait-piece direct-mail tradition"
---

# Funnels Lead Magnet - Top-of-Funnel Bait

> *"A lead magnet is a promise the rest of the funnel has to keep."*

This skill designs **Rung 0** of The Ascension Ladder - the free asset that converts cold or warm traffic into an email subscriber. Most lead magnets fail not because they're bad assets but because they're mismatched to the audience's awareness level, or because they over-promise at the opt-in stage and under-deliver at the magnet itself.

## When to Use

Trigger phrases: "design my lead magnet", "lead magnet", "opt-in offer", "what should my freebie be", "bait piece", "free PDF guide", "quiz funnel", `/funnel lead-magnet <topic>`.

Use when:
- The user has traffic but no opt-in mechanism, or the existing one is converting below benchmark
- The user is starting from scratch and needs to pick the right magnet format for their audience
- A magnet is converting fine on opt-in but downstream nurture-to-sale conversion is dead (likely magnet/audience mismatch)
- The user wants to test a quiz/calculator/audit format vs their existing PDF

Do NOT use for:
- Designing the *page* that sells the magnet (use `convert-lead-magnet-page` or `convert-squeeze-page`)
- Designing the tripwire offer below the magnet (use `funnels-tripwire`)
- Designing the email nurture sequence after opt-in (use `funnels-story-drip`)
- Auditing an existing opt-in URL (use `market-funnel <url>`)

## Inputs

1. **Audience** - the One Person, with their awareness level (Schwartz Levels 1–5)
2. **Source of traffic** - cold ads / warm email / affiliate / organic / referral
3. **Downstream offer** - what the magnet leads to (tripwire? core? high-ticket call?)
4. **Existing assets** - anything the user already has that can be repurposed (recordings, swipe files, audits, blog content)
5. **Capacity** - can the user produce + maintain the magnet over time? (Discovery calls have a capacity ceiling.)

## Lead Magnet Taxonomy (16 types with benchmarks)

Each entry: opt-in benchmark, best-fit awareness level, downstream offer fit, production cost.

| Magnet | Opt-in rate | Best for awareness level | Downstream fit | Production cost |
|--------|-------------|-------------------------|----------------|-----------------|
| **PDF guide / ebook** | 10–25% | L2–L3 (problem/solution-aware) | Tripwire / core offer | Med (10–40 hrs) |
| **Checklist** | 20–40% | L2 (problem-aware) | Tripwire / core | Low (3–10 hrs) |
| **Template** | 25–45% | L3–L4 (solution/product-aware doers) | Core / premium | Low–Med |
| **Swipe file** | 25–45% | L3–L4 (copywriters, marketers) | Core / premium | Low (assemble existing) |
| **Mini-course (email)** | 15–35% | L1–L3 (any) | Tripwire / core | Med (write 5–7 emails) |
| **Mini-course (video)** | 15–30% | L2–L3 | Core / high-ticket call | High (record 3–7 videos) |
| **Challenge (5-day, 30-day)** | 30–60% | L2–L3 | Core / premium | High (live delivery) |
| **Quiz** | 35–60% | Any (segments by result) | Personalized to result | High (build + branching) |
| **Free trial (SaaS)** | 5–15% | L4 (product-aware) | Core subscription | Low (existing SaaS) |
| **Free + shipping** | 5–15% | L3–L4 | Tripwire upsell at order form | Med (physical fulfillment) |
| **Sample chapter** | 15–30% | L2–L3 | Book / course | Low (excerpt existing) |
| **Calculator** | 25–50% | L3–L4 (data-driven) | High-ticket call / premium | High (build calculator) |
| **Audit / scorecard** | 20–40% | L3–L4 (B2B services) | Discovery call / high-ticket | Med–High |
| **Discovery call (no-cost)** | 1–5% | L4–L5 (most-aware) | High-ticket only | High (capacity-limited) |
| **Video training (30–60 min)** | 15–30% | L2–L3 | Core / webinar | Med–High |
| **Cheat sheet** | 25–45% | L2–L3 (technical / quick-reference) | Tripwire / core | Low |

**Selection rule:** match magnet effort to buyer's awareness level. Unaware/problem-aware buyers want low-commitment, fast-win magnets (checklists, cheat sheets). Product-aware buyers will commit to higher-friction magnets (audits, discovery calls).

## The Magnet-Naming Pattern

The name is 80% of the opt-in rate. Generic names ("Free Newsletter") collapse opt-in below 5%. Specific names ("47-Headline Swipe File") routinely opt-in 25–45%.

**Wayland naming pattern:** *The [Specific Number] [Outcome-Noun] [Format]*

Examples (strong):
- *The 47-Headline Conversion Vault* (number + outcome + format)
- *The 30-Day Sales-Page Sprint Checklist* (timeframe + outcome + format)
- *The 7-Question Offer Audit* (number + outcome + format)
- *The 12-Email Nurture Swipe Pack* (number + outcome + format)

Examples (weak):
- *Free Marketing Guide* - no specificity
- *Subscribe to my newsletter* - no outcome
- *The Ultimate Resource* - vague + cliche
- *Get Started PDF* - no outcome, no number

## The 24-Hour Win Rule

*The 24-hour-win principle (Wayland synthesis from Halbert bait-piece tradition + Hormozi time-delay lever).* The magnet must produce a real, measurable, reportable win for the buyer within 24 hours of opt-in. Magnets that take >7 days to produce value are too far from the conversion moment to drive trust.

The win doesn't need to be the *full* outcome - just a small, concrete, "I did the thing and got the result" moment. A checklist that someone uses in 10 minutes. A template that they fill out in an hour. A calculator that gives them a number they didn't have. A cheat sheet they reference once.

If the magnet's promise requires >7 days of work to realize, it's not a lead magnet - it's a course. Different rung.

## The Anti-Bait Rule

The magnet's promise must be *kept*. Over-promising at the opt-in stage and under-delivering at the magnet kills downstream conversion. The buyer's first interaction with you is the magnet - if it disappoints, no nurture sequence saves it.

**Anti-bait test:** *"If I subscribed for this magnet, would I tell a friend it was actually as good as the headline promised?"* If no, redesign the magnet OR weaken the headline.

## Workflow

### Phase 0 - Confirm inputs

- Lock the audience (One Person + awareness level Schwartz L1–L5)
- Identify the traffic source (cold ads vs warm email vs etc.)
- Identify the downstream offer (what the magnet leads to)
- Inventory existing assets

### Phase 1 - Pick the magnet format

Walk the taxonomy table. Filter by:
1. Awareness-level match
2. Downstream offer fit
3. Production cost vs user's capacity
4. Existing assets that could anchor the format

Pick 2–3 candidates. The user picks the final.

### Phase 2 - Name the magnet

Apply the naming pattern. Generate 3 candidate names. Score each on specificity + outcome-clarity + format-clarity.

### Phase 3 - Structure the magnet

For the chosen format, define:
- **Sections / parts** - what's inside
- **Length / scope** - pages, items, minutes, modules
- **24-hour win** - the specific result the buyer gets within 24h
- **Anti-bait test** - does the magnet keep the promise of the headline?
- **Repurposable assets** - what existing material gets adapted

### Phase 4 - Define the bridge to next rung

The magnet's job isn't to deliver value alone - it's to set up the next rung. Define:
- The exact CTA inside the magnet (last page, last email, last video)
- The bridge to the tripwire OR core OR discovery call
- The follow-up email sequence's first message (handoff to `funnels-story-drip`)

### Phase 5 - Ship the magnet brief

## Output template

```markdown
# Lead Magnet: <Magnet Name>

**Audience:** <One Person + awareness level>
**Traffic source:** <cold / warm / etc.>
**Downstream offer:** <tripwire / core / high-ticket / etc.>
**Date:** <YYYY-MM-DD>

## Format Decision

**Format chosen:** <PDF / checklist / quiz / calculator / etc.>
**Why this format:** <2–3 sentences>
**Expected opt-in rate:** <range from taxonomy table>

## The Name

**Final name:** <The Specific-Number Outcome-Noun Format>
**Alternative names considered:** <2–3 alternatives>

## The 24-Hour Win

**The win:** <one sentence - what the buyer can DO within 24h of opt-in>
**Anti-bait test:** PASSED - magnet keeps the promise of the name

## Magnet Structure

| Section / Part | Content | Length | Purpose |
|---------------|--------|--------|---------|
| 1 | <name> | <pages/min> | <purpose> |
| 2 | <name> | <pages/min> | <purpose> |
| 3 | <name> | <pages/min> | <purpose> |
| ... | | | |

**Total length:** <X pages / Y minutes>

## Bridge to Next Rung

- **Last-page / last-email CTA:** "<exact CTA copy>"
- **Bridge offer:** <tripwire name OR call-booking link OR core offer>
- **Follow-up email sequence:** handoff to `funnels-story-drip`

## Production Plan

- **Existing assets to repurpose:** <list>
- **New content to create:** <list with hours estimate>
- **Format / design:** <PDF in Canva / quiz in Outgrow / calculator in webflow / etc.>
- **Hosting / delivery:** <ConvertKit / ActiveCampaign / etc.>
- **Total production hours:** <X>

## Compositional notes

- Hand off the magnet brief to the user's authoring workflow
- Hand off the opt-in page to `convert-lead-magnet-page` or `convert-squeeze-page`
- Hand off the post-opt-in email sequence to `funnels-story-drip`
- Hand off the bridge to the tripwire to `funnels-tripwire`
- Hand off the magnet's last-page CTA copy to `convert-bullets` for tight bullet writing
```

## Notes

- **Single most common lead-magnet mistake:** generic naming. "Free Marketing Guide" collapses opt-in to <5%. "The 47-Headline Conversion Vault" hits 25–45%. Same content, 5–10x opt-in rate.
- **Second most common mistake:** the magnet has no 24-hour win. Buyers download, never use, the email sequence never reaches engagement, the funnel dies.
- **Third most common mistake:** discovery-call lead magnets used on cold traffic. Discovery calls work as a magnet only on L4–L5 (most-aware) audiences. On cold traffic, a discovery call has 1–3% opt-in vs 25–45% on a checklist - same audience, wildly different commitment threshold.
- **Quiz funnels deserve special mention:** highest opt-in rates (35–60%) and best lead segmentation. But production cost is high (build + branching logic + per-result follow-ups). When a quiz fits, it's the strongest magnet on the list - but don't pick it just because the opt-in rate is high.
- **TM hygiene:** Schwartz, Halbert appear in body for lineage. Conversion benchmarks pulled from canonical industry consensus - flagged as folklore-leaning where evidence is thin.
