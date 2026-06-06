---
name: funnels-build-campaign
slash_command: false
pack: business-funnels
family: composite
description: |
  Subordinate composite called by /launch - orchestrates the funnels family (offer + ladder + lead magnet + tripwire + sequence) and hands off to convert-* skills for asset authoring. Internal to the campaign-suite super-composite, not the top-level user entry.
  Use when /launch routes here as part of its DAG, OR when a power user wants only the funnels half (architecture without assets).
  Not for top-level campaign builds (use /launch instead - /launch is the user-facing entry that includes both architecture AND assets).
triggers:
  - funnels build-campaign
  - architecture only build
  - funnels architecture pass
  - architecture without assets
  - design the funnel architecture for my product
  - skip-assets campaign architecture
negative_triggers:
  - build my campaign
  - launch my product
  - agency replacement
  - build the whole thing
  - everything for the launch
  - end-to-end campaign
  - one-shot launch
  - audit my live url
  - cro teardown
  - finance campaign reporting
  - shopify sales report
tags: [funnels, composite, campaign, donahoe-method]
priority: 80
version: 1.0.0
author: Wayland Business Pack
license: MIT
metadata:
  wayland:
    related_skills: [funnels, funnels-offer, funnels-offer-stack, funnels-offer-pricing, funnels-offer-guarantee, funnels-ascension-ladder, funnels-lead-magnet, funnels-tripwire, funnels-conviction-webinar, funnels-cart-cycle-launch, funnels-story-drip, funnels-daily-pivot, funnels-architecture-audit, convert-sales-page, convert-vsl, convert-vsl-page, convert-lead-magnet-page, convert-bridge-page, convert-oto-page, convert-downsell-page, convert-thank-you-page, convert-webinar-reg-page, convert-bullets, convert-voice, convert-bullshit-filter, convert-audit]
attribution:
  lineage: "Wayland Business Suite (Original) - The Campaign Build composite orchestrates the full funnels family + delegates asset authoring to the convert-* family, producing an agency-equivalent campaign in 15-30 minutes via parallel delegate_task fan-out"
---

# Funnels Build Campaign - The End-to-End Composite

> *"This is the AI-replaces-the-agency moment. One product brief in. A full launch-ready campaign out."*

This is the **composite** skill that builds an entire direct-response campaign end-to-end. It orchestrates the funnels family for architecture (offer + ladder + sequence) + delegates to the convert-* family for asset authoring (sales page, VSL, OTO, etc.) + ships back the full campaign deliverable.

Expected runtime: 15-30 minutes wall-clock with parallel delegation. Output: ~80-120 pages of campaign artifacts.

## When to Use

Trigger phrases: "build my campaign", "build full campaign", "full campaign build", "launch a new product", "build me a launch", "build me a sales engine", "agency replacement", "end-to-end campaign", "campaign architecture", "build the whole thing", "one-shot launch", "30-minute campaign build", `/funnel build-campaign <product>`.

Use when:
- The user has a product (or a clear product concept) and wants the full launch-ready campaign delivered
- The user has 15-30 minutes of compute time and wants to fan out parallel work
- The user needs the "agency-replacement" deliverable - copy, page structure, email sequences, the works

Do NOT use for:
- Single-skill needs (use the specific skill - `funnels-offer`, `convert-sales-page`, etc.)
- URL audit / CRO teardown (use `market-funnel`)
- Iterative one-piece-at-a-time work (use the relevant single skill)
- A full-launch *campaign strategy* across channels (use `market-launch` for channel-level orchestration)

## Inputs

1. **Product description** - what's being sold, who buys it, what problem it solves
2. **Audience** - the One Person at Rung 2 (core offer level)
3. **Existing assets** - anything the user already has (lead magnets, course content, swipe files, recordings)
4. **Sales model preference** - webinar-led OR launch-led (informs Phase 1 path)
5. **Target price for core offer** - informs ladder pricing
6. **Time horizon** - when does the campaign go live?
7. **Capacity** - can the user fulfill DFY services (capacity-limited) or only digital products?

## The 4-Phase DAG

The composite runs in 4 phases, executed STRICTLY SEQUENTIALLY at the phase level. Within each phase, internal parallelism is capped at `max_concurrent_children: 4` (per-phase cap, not global). Phases 2 and 3 do NOT run concurrently with each other - Phase 3 starts only after Phase 2 completes. This avoids the global-pool starvation issue where P2 (4 children) + P3 (concurrent) would consume the entire delegation pool.

### Phase 1 - Architecture (sequential, ~5 min)

**Job:** lock the offer, ladder, and conversion sequence model. Phase 2 + 3 depend on Phase 1.

| Step | Skill | Output |
|------|-------|--------|
| 1.1 | `funnels-offer` | The Irresistible Stack - core offer with value-equation engineering, mechanism, deliverable |
| 1.2 | `funnels-offer-stack` | Bonus stack - 5–7 named bonuses with objection mapping |
| 1.3 | `funnels-offer-pricing` | Pricing levers - anchor + contrast + payment plan + decoy if multi-tier |
| 1.4 | `funnels-offer-guarantee` | Guarantee statement in Donahoe Voice |
| 1.5 | `funnels-ascension-ladder` | 5-rung ladder map with bridge offers |
| 1.6 | `funnels-lead-magnet` | Rung 0 magnet design |
| 1.7 | `funnels-tripwire` | Rung 1 tripwire design + front-end revenue stack (bump + OTO + downsell) |
| 1.8 | **Branch decision:** webinar-led OR launch-led | |
| 1.8a | If webinar: `funnels-conviction-webinar` | 4-stage webinar script |
| 1.8b | If launch: `funnels-cart-cycle-launch` | 3-stage cart-cycle launch architecture |

**Phase 1 output:** the architecture document - offer + ladder + sequence model, all locked.

### Phase 2 - Asset Authoring (parallel via delegate_task, ~10-15 min)

**Job:** convert-* pack delegations for each asset. Fans out 7-9 parallel children.

Phase 2 receives the locked architecture from Phase 1 and delegates to convert-* skills via `delegate_task`. Each delegate gets:
- The locked offer (from Phase 1)
- The relevant section of the architecture
- The audience + voice rules
- Any existing assets the user supplied

Cap parallelism at 4 children at a time (per playbook risk-mitigation: avoid context-overflow on parallel orchestration).

| Asset | Skill (delegated) | Receives |
|-------|------------------|---------|
| Lead-magnet opt-in page | `convert-lead-magnet-page` | magnet name, audience, opt-in form fields |
| Bridge page (advertorial) | `convert-bridge-page` | ad-to-offer warm-up copy |
| Webinar registration page (if webinar-led) | `convert-webinar-reg-page` | webinar promise, presenter credibility |
| Sales page | `convert-sales-page` | full offer + stack + guarantee + price |
| VSL script + page | `convert-vsl` + `convert-vsl-page` | 18-min VSL aligned to the offer |
| OTO page | `convert-oto-page` | OTO offer (post-tripwire AND post-core) |
| Downsell page | `convert-downsell-page` | OTO recovery offer |
| Thank-you page | `convert-thank-you-page` | post-purchase delivery + referral CTA |

Each asset comes back with structured brief + clean HTML/CSS reference + Donahoe Method audit footer.

### Phase 3 - Sequence Authoring (parallel via delegate_task, ~5 min - runs AFTER Phase 2 completes)

**Job:** funnels family email sequences.

| Asset | Skill | Output |
|-------|-------|--------|
| Welcome / nurture sequence (5-day Story-Drip) | `funnels-story-drip` | 5 emails with Donahoe Voice |
| Daily pivot ongoing sequence (10-15 emails) | `funnels-daily-pivot` | rolling daily emails for mature-list cadence |
| Cart-window emails (if launch-led) | `funnels-daily-pivot` (cart-window mode) | 5-7 emails through cart cycle |
| Webinar sequence (if webinar-led) | `funnels-daily-pivot` | reg → reminder → live → replay → cart-close |

### Phase 4 - Audit Pass (sequential, ~3-5 min)

**Job:** verify the campaign is structurally sound + every asset passes the Donahoe Method.

| Step | Skill | Output |
|------|-------|--------|
| 4.1 | `funnels-architecture-audit` | full architecture review of the campaign as built |
| 4.2 | `convert-audit` (run on each page) | Donahoe Method audit on every page asset |
| 4.3 | TM grep gate | verify no banned trademark phrases anywhere user-facing |
| 4.4 | Bullshit Filter pass | every piece of generated copy passes the filter |

## Workflow

### Phase 0 - Confirm inputs + branch decision

- Lock the product description + audience + price target + time horizon + capacity
- Decide webinar-led OR launch-led (informs Phase 1.8)
  - Webinar-led: best for $497–$2,997 single offers, strong personality, single-conversion-event preference
  - Launch-led: best for $497+ offers with engaged email list, JV/affiliate partners, anticipation-driven audiences

### Phase 1 - Run architecture (sequential)

Execute steps 1.1 through 1.8. Each step's output feeds the next. Sequential because dependencies are tight (price depends on stack value; stack depends on objections; objections depend on audience).

### Phase 2 - Fan out asset authoring

Issue parallel `delegate_task` calls to 4 convert-* skills at a time. Wait for batch to return; issue next batch. Cap at 9 total assets.

### Phase 3 - Fan out sequence authoring (sequential AFTER Phase 2)

Issue parallel `delegate_task` calls to funnels email skills (cap 4 internal children). Phase 3 starts only after Phase 2 completes - they do NOT run concurrently, to avoid exceeding the delegation pool's `max_concurrent_children: 4`.

### Phase 4 - Audit pass

Run architecture audit + per-asset Donahoe Method audit + TM grep. Compile into a single audit footer for the campaign.

### Phase 5 - Compile + ship

Compile all artifacts into the campaign deliverable. Output: a structured directory of artifacts (or a single mega-doc with all sections) that the user can hand to a designer / developer / marketer for execution.

## Output template

```markdown
# Campaign Build: <Product Name>

**Product:** <name>
**Audience:** <One Person>
**Sales model:** <webinar-led | launch-led>
**Build date:** <YYYY-MM-DD>
**Total artifacts:** <count>
**Total runtime:** <minutes>

---

## Phase 1 - Architecture (complete)

### 1.1 The Irresistible Stack
<Full output from `funnels-offer`>

### 1.2 Bonus Stack
<Full output from `funnels-offer-stack`>

### 1.3 Pricing Architecture
<Full output from `funnels-offer-pricing`>

### 1.4 Guarantee Architecture
<Full output from `funnels-offer-guarantee`>

### 1.5 Ascension Ladder
<Full output from `funnels-ascension-ladder`>

### 1.6 Lead Magnet
<Full output from `funnels-lead-magnet`>

### 1.7 Tripwire
<Full output from `funnels-tripwire`>

### 1.8 Conversion Sequence
<Full output from `funnels-conviction-webinar` OR `funnels-cart-cycle-launch`>

---

## Phase 2 - Asset Library (complete)

### 2.1 Lead-Magnet Opt-In Page
<Brief + HTML/CSS from `convert-lead-magnet-page`>

### 2.2 Bridge Page
<Brief + HTML/CSS from `convert-bridge-page`>

### 2.3 Webinar Registration Page (if webinar-led)
<Brief + HTML/CSS from `convert-webinar-reg-page`>

### 2.4 Sales Page
<Brief + HTML/CSS from `convert-sales-page`>

### 2.5 VSL Script + Page
<Script + page from `convert-vsl` + `convert-vsl-page`>

### 2.6 OTO Page (post-tripwire)
<Brief + HTML/CSS from `convert-oto-page`>

### 2.7 OTO Page (post-core)
<Brief + HTML/CSS from `convert-oto-page`>

### 2.8 Downsell Page
<Brief + HTML/CSS from `convert-downsell-page`>

### 2.9 Thank-You Page
<Brief + HTML/CSS from `convert-thank-you-page`>

---

## Phase 3 - Email Sequences (complete)

### 3.1 Welcome / Nurture (5-day Story-Drip)
<5 emails from `funnels-story-drip`>

### 3.2 Daily Pivot Ongoing (10-15 emails)
<Rolling email pack from `funnels-daily-pivot`>

### 3.3 Cart-Window / Launch Cadence (if launch-led)
<Cart-window emails from `funnels-daily-pivot` cart-mode>

### 3.4 Webinar Sequence (if webinar-led)
<Reg → reminder → live → replay → cart-close from `funnels-daily-pivot`>

---

## Phase 4 - Audit Pass

### 4.1 Architecture Audit
<Full output from `funnels-architecture-audit`>

### 4.2 Per-Page Donahoe Method Audit
| Page | Method audit | Bullshit Filter | Voice rules | Notes |
|------|-------------|----------------|------------|-------|
| Lead-magnet page | <PASS/FAIL> | <PASS/FAIL> | <PASS/FAIL> | |
| Bridge page | | | | |
| Webinar reg / sales page | | | | |
| VSL + page | | | | |
| OTO (×2) | | | | |
| Downsell | | | | |
| Thank-you | | | | |

### 4.3 TM Grep Gate
- Banned phrases checked: <count>
- Hits found: 0
- Status: run separately via `convert-bullshit-filter` (coaching pass)

### 4.4 Bullshit Filter Summary
- Total copy artifacts: <count>
- Filter passes: <count>
- Filter failures: 0

---

## What to Do Next

1. **Hand off Phase 2 HTML/CSS** to your designer/developer/Webflow build
2. **Hand off Phase 3 email content** to your ESP (ConvertKit, ActiveCampaign, etc.)
3. **Schedule Phase 1.6 lead-magnet creation** (~3-7 days production)
4. **Schedule Phase 1.7 tripwire creation** (~3-7 days production)
5. **Schedule Phase 1.8 conversion event** (live webinar date OR launch start date)
6. **30-day post-launch:** rerun `funnels-architecture-audit` for the post-mortem

---

## Compositional Notes

This composite's children:

- **Phase 1 (architecture, sequential):**
  - `funnels-offer` (Irresistible Stack)
  - `funnels-offer-stack` (bonus stack)
  - `funnels-offer-pricing` (pricing levers)
  - `funnels-offer-guarantee` (guarantee design)
  - `funnels-ascension-ladder` (ladder map)
  - `funnels-lead-magnet` (Rung 0)
  - `funnels-tripwire` (Rung 1)
  - `funnels-conviction-webinar` OR `funnels-cart-cycle-launch` (conversion sequence)

- **Phase 2 (asset authoring, parallel - delegate_task):**
  - `convert-lead-magnet-page`
  - `convert-bridge-page`
  - `convert-webinar-reg-page` (if webinar-led)
  - `convert-sales-page`
  - `convert-vsl` + `convert-vsl-page`
  - `convert-oto-page` (×2 - post-tripwire + post-core)
  - `convert-downsell-page`
  - `convert-thank-you-page`
  - All assets pass through `convert-bullets`, `convert-voice`, `convert-bullshit-filter`

- **Phase 3 (sequences, parallel - delegate_task):**
  - `funnels-story-drip` (5-day welcome)
  - `funnels-daily-pivot` (ongoing + cart-window + webinar cadence variants)

- **Phase 4 (audit, sequential):**
  - `funnels-architecture-audit`
  - `convert-audit` (per-page)
  - TM grep gate
  - Bullshit Filter summary

## Lineage

The Campaign Build composite is Wayland-owned. It orchestrates:

- *The Donahoe Method* (cross-pack with `convert-*`) - applied to every piece of generated copy via `convert-voice` and `convert-bullshit-filter`
- *The Irresistible Stack* (Wayland-coined, lineage Hormozi + Kennedy + Sugarman + Halbert + Schwartz) - Phase 1.1
- *The Ascension Ladder* (Wayland-coined, lineage Brunson + Hormozi + Kern + Stu McLaren) - Phase 1.5
- *The Conviction Webinar* (Wayland-coined, lineage Brunson + Kern + Pagan + Stu McLaren) - Phase 1.8a (if webinar-led)
- *The Cart-Cycle Launch* (Wayland-coined, lineage Walker + Kern + Brunson + Pagan) - Phase 1.8b (if launch-led)
- *The Story-Drip Sequence* (Wayland-coined, lineage Brunson + Drayton Bird + Halbert) - Phase 3.1
- *The Daily Pivot Email* (Wayland-coined, lineage Brunson + Halbert + Settle) - Phase 3.2

The composite's value is the orchestration: any single skill produces one piece. The composite produces the full launch-ready campaign by orchestrating all 16 funnels skills + 8-12 convert skills via `delegate_task` parallel fan-out, with audit gates at every layer.
```

## DAG Visualization

```
                    [User input: product brief]
                              │
                              ▼
                  ┌───────────────────────┐
                  │ Phase 0: confirm + branch │
                  └───────────────────────┘
                              │
                              ▼
                  ┌───────────────────────┐
                  │ Phase 1: ARCHITECTURE  │ (sequential, ~5 min)
                  │  funnels-offer        │
                  │   ↓ funnels-offer-stack│
                  │   ↓ funnels-offer-pricing│
                  │   ↓ funnels-offer-guarantee│
                  │   ↓ funnels-ascension-ladder│
                  │   ↓ funnels-lead-magnet│
                  │   ↓ funnels-tripwire   │
                  │   ↓ webinar-OR-launch  │
                  └───────────────────────┘
                              │
                ┌─────────────┴─────────────┐
                ▼                           ▼
    ┌────────────────────┐      ┌────────────────────┐
    │ Phase 2: ASSETS     │      │ Phase 3: SEQUENCES  │
    │ (parallel ~10-15min)│      │ (parallel ~5 min)   │
    │ delegate_task ×9    │      │ delegate_task ×4    │
    │  to convert-*       │      │  to funnels-*       │
    └────────────────────┘      └────────────────────┘
                │                           │
                └─────────────┬─────────────┘
                              ▼
                  ┌───────────────────────┐
                  │ Phase 4: AUDIT         │ (sequential, ~3-5 min)
                  │  funnels-architecture-audit│
                  │  convert-audit (×9)    │
                  │  TM grep + Bullshit Filter│
                  └───────────────────────┘
                              │
                              ▼
                       [Campaign deliverable]
                  (~80-120 pages of artifacts,
                   ready for design/dev/email)
```

## Notes

- **Single most common Campaign Build pitfall:** running it without locked inputs. The composite assumes the product, audience, price target, sales model are decided. If they're not - back up to `funnels-offer` for the offer brief, `funnels-ascension-ladder` for the ladder, and decide webinar-vs-launch BEFORE running this composite.
- **Parallelism cap:** 4 children at a time per delegate_task batch. Higher = context overflow + race conditions. Lower = serializes for no benefit. 4 is the sweet spot.
- **Webinar-led vs launch-led** is the highest-leverage early decision. Webinar-led = single conversion event, fast to deploy, best for $497–$2,997 single offers. Launch-led = 14-21 day event, slower to deploy, best for $497+ offers with engaged list + JV partners.
- **The composite produces 80-120 pages of artifacts.** That's a real deliverable - not a summary. Plan for it: the user needs a place to put the output (a folder, a Notion DB, a campaign GitHub repo).
- **TM hygiene at composite scope:** the audit pass (Phase 4) runs the TM grep over EVERY artifact produced. This is the suite-wide gate that catches any sub-skill that slipped a banned phrase through. Composite is the last line of defense for trademark hygiene.
- **Trademark hygiene reminder:** never use "Perfect Webinar", "Product Launch Formula", "PLF", "Grand Slam Offer", "$100M Offers", "$100M Leads", "Soap Opera Sequence", "Seinfeld Email", "Mass Control", "DotCom Secrets", "Expert Secrets", "Traffic Secrets", "ClickFunnels", "No B.S.", "Magnetic Marketing", "Don't Make Me Think", "One Funnel Away" anywhere in any artifact this composite produces. The Wayland fusion names are used everywhere user-facing. The canonical authors (Brunson, Walker, Hormozi, Kern, Pagan, Stu McLaren, Drayton Bird, Halbert, Schwartz, Cialdini, Sutherland, Kennedy, Settle) are cited by name in the lineage sections of skill bodies - fair use educational citation - but the branded *phrases* never appear in user-facing output.
