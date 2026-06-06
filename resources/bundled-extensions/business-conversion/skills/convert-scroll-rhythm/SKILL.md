---
name: convert-scroll-rhythm
slash_command: false
pack: business-conversion
family: visual_conversion
description: |
  Orchestrate scroll depth across a long-form direct-response page: map zones to The Three Locks (Want → Trust → Excuse), engineer reading-pattern flow (F-pattern body / Z-pattern hero), place CTA anchors at decision points, and pace section transitions for The Greased Chute.
  Use when designing the visual flow of a sales page, VSL page, or long bridge page where each scroll position must serve a specific Method lock.
  Not for hero-only spec (use /convert above-fold) and not for short single-purpose pages (use /convert squeeze).
triggers:
  - scroll rhythm
  - scroll-depth design
  - page flow design
  - how should the page flow
  - section order for sales page
  - three locks layout
  - want trust excuse flow
  - donahoe scroll rhythm
negative_triggers:
  - just the hero
  - just the proof section
  - audit an existing page
tags: [conversion, page, scroll, donahoe-method, three-locks, greased-chute, visual]
priority: 80
version: 1.0.0
author: Wayland Business Pack
license: MIT
metadata:
  wayland:
    related_skills: [convert, convert-above-fold, convert-three-locks, convert-chute, convert-proof-stack, convert-mobile, convert-sales-page]
attribution:
  lineage: "The Donahoe Method - Three Locks (Want / Trust / Excuse) + Greased Chute (Wayland-owned operating system); Nielsen Norman Group eye-tracking research on F-pattern (2006) and Z-pattern (2020) reading flows"
---

# Convert Scroll-Rhythm - Scroll-Depth Orchestration Aligned to The Three Locks

> *"Three things must happen - roughly in this order - before someone buys. Think of them as three locks on a door. You need to open all three."* - The Donahoe Method, Framework 3

Scroll position is not a layout problem. It's a persuasion problem. Every screen the reader scrolls past is a chance to open one of the locks (Want → Trust → Excuse) or lose them. This skill maps scroll zones to Method locks and engineers the rhythm of momentum that connects them.

## When to Use

Trigger phrases: "scroll rhythm", "scroll-depth design", "page flow design", "how should the page flow", "section order for sales page", "three locks layout", "want trust excuse flow", `/convert scroll-rhythm <product>`.

Use when:
- Designing the section order of a long-form sales page or VSL page
- The page has the right copy but a wrong order - proof appears too early, the close lands too soon, the Excuse never gets opened
- Mapping CTA anchor frequency across the page (where do CTAs go and why?)
- Diagnosing why a long page loses readers at a specific scroll depth

Do NOT use for:
- Above-fold-only spec - use `/convert above-fold`
- Single-purpose pages (squeeze, opt-in) - they don't have scroll rhythm; they have one screen
- Auditing an existing live page - use `/market landing <url>` for CRO teardown
- Generating the actual section copy - use `/convert sales-page` (this skill specs the *order*, sales-page writes the *content*)

## The Three Locks (Donahoe Method, Framework 3)

Every long-form page must open three locks in roughly this order:

1. **Lock 1 - The Want.** Sell the *state*, not the product. Sensory, visceral, specific.
2. **Lock 2 - The Trust.** They want it; now they need to believe it's possible - and that you can deliver. Built through Conversational Proof + voice authority.
3. **Lock 3 - The Excuse.** They want it, they believe it; now they need the rational argument they'll use to justify the buy. Math, comparisons, risk reversal.

Miss any lock and the door stays closed. Get the *order* wrong and the locks fight each other (e.g., closing on math before they want it = tone-deaf).

## Scroll Zones (the Method's three thirds)

A long-form direct-response page divides into three vertical thirds. Each third owns one Lock.

```
+----------------------------+
|        TOP THIRD            |  ← Lock 1: Want
|  Hero (Open + 5-sec test)   |     Promise + first proof + CTA #1
|  Want zone                  |     ~Pattern: Z-pattern hero,
|                             |              F-pattern body
+----------------------------+
|       MIDDLE THIRD          |  ← Lock 2: Trust
|  Pain → solution            |     Proof rhythm, mechanism reveal,
|  Mechanism, bonuses         |     CTA #2 + CTA #3
|  Trust zone                 |     ~Pattern: F-pattern dominant
+----------------------------+
|       BOTTOM THIRD          |  ← Lock 3: Excuse
|  Stack → Math → Safety Net  |     Cascade Close + P.S. + P.P.S.
|  Door + FAQ                 |     CTA #4, #5, #N
|  Excuse zone                |     ~Pattern: F-pattern + scannable
+----------------------------+
```

For impulse offers (<~$100), price reveals near the top. For considered offers ($100+), price delays until the Trust zone is fully opened.

## Inputs

Required:
1. **Product / offer** - what we're selling (informs price-reveal placement)
2. **Asset type** - long-form sales page / VSL page / bridge page / advertorial
3. **Market temperature** - Ice Cold / Cool / Warm / Hot / Boiling (from `convert-temperature`); changes total length and zone proportions
4. **Primitives that have already run** - outputs from `convert-open`, `convert-three-locks`, `convert-bullets`, `convert-proof`, `convert-close` are pulled in if available

Optional:
- **Existing section list** - if the user has copy in hand, this skill reorders it
- **Brand visual constraints** - colors, image style, max page length
- `out_path` - caller-controlled output. Defaults via `build_report_path("business-conversion", instruction)`

## The Section Skeleton (mapped to Locks)

A canonical Donahoe-Method long-form sales page has 14-18 sections. This skill emits the full ordered list with which Lock each serves.

| # | Section | Lock | Reading pattern | CTA? |
|---|---------|------|------------------|------|
| 1 | Hero - Headline / Subhead / CTA / Trust strip | Want | Z-pattern | CTA #1 |
| 2 | Open continued (Layers 2-4 unspooled) | Want | F-pattern | - |
| 3 | The pain expanded - agitate the nerve | Want | F-pattern | - |
| 4 | The vision - paint the state they want | Want | F + image | - |
| 5 | Bridge - "here's what changed" | Want → Trust | F-pattern | - |
| 6 | The mechanism - why this works (unique) | Trust | F + diagram | CTA #2 |
| 7 | Proof block 1 - Anecdote + Receipt | Trust | F-pattern | - |
| 8 | What you get - bullets (Keyhole / Flip / Snapshot / Scar mix) | Trust | scannable | - |
| 9 | Proof block 2 - Snapshot case study | Trust | F + image | CTA #3 |
| 10 | Bonus stack - visible value addition | Excuse | scannable | - |
| 11 | The Stack close - sum the value | Excuse | F-pattern | - |
| 12 | The Vision close - paint the state again | Excuse | F + image | - |
| 13 | The Math close - make the arithmetic obvious | Excuse | scannable | CTA #4 |
| 14 | The Safety Net - guarantee | Excuse | F-pattern | - |
| 15 | The Door - final CTA | Excuse | dominant CTA | CTA #5 |
| 16 | P.S. - recloses from new angle | Excuse | F-pattern | CTA #6 |
| 17 | P.P.S. - recaps strongest proof | Excuse | F-pattern | CTA #7 |
| 18 | FAQ - kills last objections | Excuse | scannable | CTA #8 |

Total CTA anchors: 5-8. The minimum on long-form is 3; the typical is 5-9.

## Reading Patterns (NN-g eye-tracking canon)

Two patterns dominate. Choose per-section, not per-page.

### Z-pattern - visual hero zones

Eyes: top-left → top-right → diagonal down-left → bottom-right.

Where: hero, sub-heroes (e.g., "What you get" feature blocks), final close zones with strong visual.

Implication: place CTA at the visual end of the Z (typically bottom-right or bottom-center). Logo / lead element at top-left.

### F-pattern - text-dense zones

Eyes scan top horizontally, then down the left side, then horizontal stripes that get progressively shorter.

Where: open body, pain agitation, mechanism reveal, proof blocks, FAQ.

Implications:
- Lead each paragraph with the strongest words on the left edge
- Bold key phrases (the eye picks up bolded fragments while skipping body)
- Use sub-headlines aggressively - the F's horizontal stripes track sub-heads, not body text
- Short paragraphs (1-3 sentences) - Donahoe Voice Rule meets visual reality

*Source: F-pattern (NN-g eye-tracking, Nielsen 2006, replicated 2020); Z-pattern (NN-g landing-page studies).*

## CTA Anchor Frequency

| Page length | Min CTAs | Typical CTAs | Placement rule |
|-------------|----------|--------------|----------------|
| 1,500-3,000 words | 3 | 4-5 | Hero + after mechanism + final |
| 3,000-6,000 words | 5 | 6-7 | Hero + after each Lock opens + close |
| 6,000+ words | 7 | 8-12 | Hero + every 2-4 screens + multi-layer close + P.S. + P.P.S. + FAQ |

Anchors are CTAs in the visual flow. They are NOT identical buttons spammed - they are different "doors" pointing to the same action. CTA #1 might be "See how it works" (low-friction), CTA #4 "Start my trial" (commitment), CTA #7 "Click here to lock my spot" (urgency). Same destination; different entry copy matched to where the reader is in the locks.

## Greased Chute Mechanics (Framework 6)

Between sections, momentum dies unless engineered. Three moves:

### 1. Open loops at section endings

Never end a section with a conclusion. End with a tease. Examples:
- *"That's how the front end works. But what happens next is where most people get this wrong..."*
- *"And that was just the first 30 days. What happened in month two changed how I priced everything..."*

### 2. Curiosity-bridged sub-heads

Sub-heads (the F-pattern's stripe markers) should pull, not summarize. Compare:
- ✗ "Module 3 Overview" (summary; F-pattern eye skips)
- ✓ "The 4-minute morning routine that printed leads while I slept" (curiosity; F-pattern eye stops)

### 3. Section-length variance

If three sections in a row are the same length (~150 words each), the reader's eye predicts the rhythm and tunes out. Vary: short (50w) → long (300w) → short (80w) → medium (180w). Visual rhythm = engagement.

## Workflow

### Step 1 - Pull the Method skill outputs

Check what's already run for this product. Pull outputs from:
- `convert-temperature` - informs total page length (Ice Cold = 4-6,000 words; Hot = 1-2,000 words)
- `convert-open` - informs Sections 1-2
- `convert-three-locks` - direct input for the Want / Trust / Excuse content
- `convert-bullets` - informs Section 8
- `convert-proof` - informs Sections 7 + 9
- `convert-close` - informs Sections 11-17

If those haven't run, ask: *"Want me to spec the rhythm with placeholder section content, or run the writing skills first?"* Recommend the latter for fresh builds.

### Step 2 - Set the zone proportions

Default proportions by temperature:

| Temperature | Want zone | Trust zone | Excuse zone |
|-------------|-----------|------------|-------------|
| Ice Cold    | 35%       | 45%        | 20%         |
| Cool        | 30%       | 45%        | 25%         |
| Warm        | 25%       | 40%        | 35%         |
| Hot         | 20%       | 35%        | 45%         |
| Boiling     | 10%       | 25%        | 65%         |

Cold readers need more Want building (they don't yet care). Hot readers need more Excuse closing (they're already convinced; they need to justify).

### Step 3 - Draft the section list with Lock mapping

Use the canonical 14-18 section skeleton. Mark each section's Lock. Trim sections that don't fit the temperature (a Boiling page may compress Sections 3-4 into a single bridge sentence).

### Step 4 - Place CTA anchors

Apply the CTA frequency table. Each anchor gets specific copy matched to its position:
- Anchor 1 (hero, Want): low-friction, value-loaded ("Watch the 18-min training")
- Anchor 2 (mechanism, Trust): mechanism-tied ("See the system inside")
- Anchor 3 (proof block, Trust): commitment-shifting ("Lock my spot")
- Anchor 4 (Math close, Excuse): math-tied ("Less than $1/day - claim my seat")
- Anchor 5 (Door, Excuse): blunt ("Click here. You're in.")
- Anchor 6 (P.S.): re-frame ("Yes - I want this.")

### Step 5 - Pick reading pattern per section

Apply the Z-pattern / F-pattern table. Hero + sub-heroes + visual close = Z; everything else = F.

### Step 6 - Engineer the Greased Chute transitions

For each section ending, draft the open-loop bridge to the next section. Pull Donahoe Transition System (Framework 8) moves: Comparison Bomb / Escalation / Aside Bomb / Interrupt / Dismiss / Diagnostic / Assumed Agreement / Internal Moment / Admission / Energy Drop.

### Step 7 - Mobile compression note

On mobile, the three-thirds collapse to a single column. Section dividers become more important (visual breaks the eye uses to chunk). Sticky bottom CTA bar appears once the reader scrolls past Section 5 (Trust zone entry).

### Step 8 - Emit the spec

Output the ordered section list, Lock mapping, CTA anchors, reading patterns, transition bridges, and a vertical-flow diagram.

## Output Template

```markdown
# Scroll Rhythm: <Product>

**Asset:** <long-form sales page / VSL page / bridge>
**Temperature:** <Ice Cold / Cool / Warm / Hot / Boiling>
**Total length target:** <word count range>
**Zone proportions:** Want <X%> / Trust <Y%> / Excuse <Z%>

---

## Vertical flow (top → bottom)

```
[ Hero - Z-pattern ]                  ← Lock 1 / Want / CTA #1
   ↓ (open loop transition)
[ Open body - F-pattern ]             ← Lock 1 / Want
   ↓ (Diagnostic transition)
[ Pain agitate - F ]                  ← Lock 1 / Want
   ↓ (Internal Moment transition)
[ Vision paint - F + image ]          ← Lock 1 / Want
   ↓ (Energy Drop transition)
[ Bridge - F ]                        ← Lock 1 → 2 handoff
   ↓ (Aside Bomb transition)
[ Mechanism - F + diagram ]           ← Lock 2 / Trust / CTA #2
   ↓ (Comparison Bomb transition)
[ Proof Block 1 - F ]                 ← Lock 2 / Trust
   ↓ (Escalation transition)
[ What you get bullets - scannable Z ]← Lock 2 / Trust
   ↓ (Aside Bomb transition)
[ Proof Block 2 - F + image ]         ← Lock 2 / Trust / CTA #3
   ↓ (Diagnostic transition)
[ Bonus stack - scannable ]           ← Lock 3 / Excuse opens
   ↓ (Assumed Agreement transition)
[ Stack close - F ]                   ← Lock 3 / Excuse
   ↓ (Vision Close transition)
[ Vision close - F + image ]          ← Lock 3 / Excuse
   ↓ (Math transition)
[ Math close - scannable ]            ← Lock 3 / Excuse / CTA #4
   ↓ (Admission transition)
[ Safety Net - F ]                    ← Lock 3 / Excuse
   ↓ (Door transition)
[ Door - dominant CTA ]               ← Lock 3 / Excuse / CTA #5
   ↓
[ P.S. - F ]                          ← Lock 3 / Excuse / CTA #6
   ↓
[ P.P.S. - F ]                        ← Lock 3 / Excuse / CTA #7
   ↓
[ FAQ - scannable ]                   ← Lock 3 / Excuse / CTA #8
```

## Section-by-section spec

| # | Section | Lock | Pattern | Word range | CTA | Transition out |
|---|---------|------|---------|------------|-----|-----------------|
| 1 | Hero | Want | Z | 80-120 | #1 | Open loop: "but the weird part is..." |
| 2 | Open body | Want | F | 200-400 | - | Diagnostic: "So what's the problem?" |
| 3 | Pain agitate | Want | F | 300-500 | - | Internal Moment: "I was sitting there and it hit me..." |
| ... | ... | ... | ... | ... | ... | ... |

## CTA anchor specs

| # | Position | Copy | Microcopy | Rationale |
|---|----------|------|-----------|-----------|
| 1 | Hero | <quoted> | <quoted> | Low-friction Want anchor |
| 2 | After mechanism | <quoted> | <quoted> | Trust opens; mechanism-tied |
| 3 | After Proof Block 2 | <quoted> | <quoted> | Commitment shift |
| 4 | Math close | <quoted> | <quoted> | Excuse opens; arithmetic-tied |
| 5 | Door | <quoted> | <quoted> | Blunt close |
| 6 | P.S. | <quoted> | <quoted> | Re-frame angle |
| 7 | P.P.S. | <quoted> | <quoted> | Strongest-proof recap |
| 8 | FAQ | <quoted> | <quoted> | Last-objection close |

## Reading-pattern map (visual rhythm)

- **Z-pattern zones:** Hero, "What you get" bullets, Door section
- **F-pattern zones:** Open body, pain, mechanism, proof blocks, Stack/Vision/Math close, Safety Net, P.S./P.P.S., FAQ

## Mobile compression notes

- All three-thirds collapse to single column
- Sub-heads grow in importance - they become the F-pattern stripe markers in narrow viewports
- Sticky bottom CTA bar appears past Section 5
- Section visual dividers (12-24px hairline rules + 32-48px white space) carry rhythm in absence of horizontal layout
- Trust strip wraps; bullets stay full-width

---

## How to deploy

1. Use this section list as the skeleton for `/convert sales-page <product>` - that skill writes the actual copy into each section.
2. Pair with `/convert above-fold` for Sections 1's hero spec.
3. Pair with `/convert proof-stack` for visual proof blocks (Sections 7, 9).
4. Pair with `/convert mobile` for full mobile compression of every section.
5. Pair with `/convert chute` to draft the actual transition copy for each section break.
6. Run `/convert audit` on the full page when copy is in.
```

## Pitfalls

- **Lock-order violation.** Closing on Math (Excuse) before the Trust lock has actually opened reads as cold. Reorder sections; never compress Trust to "save space."
- **CTA spam.** Eight identical buttons feels like begging. Each CTA is a different door; vary copy and lean on the lock the reader is in at that scroll depth.
- **Section-length monotony.** Three 200-word sections in a row = reader checks out. Vary deliberately.
- **Mechanism too late.** The unique mechanism reveal (Section 6) can't wait until the close. Trust is built on mechanism; without it, the reader doesn't believe.
- **Proof at the start.** Frontloading proof (Anecdote / Receipt) before the Want is built is the most common error. Want first; trust second; *because* trust requires want to be already in motion.
- **No P.S.** Skipping the P.S. and P.P.S. drops 5-15% of conversions on long-form pages (folklore-leaning, varies). The P.S. is a final close - never optional on long-form.

## Lineage

- **The Three Locks** - Donahoe Method, Framework 3 (Wayland-owned operating system)
- **The Greased Chute** - Donahoe Method, Framework 6
- **F-pattern reading** - Nielsen Norman eye-tracking studies (Nielsen, 2006; replicated 2020)
- **Z-pattern reading** - Nielsen Norman Group landing-page heuristics
- **CTA anchor frequency** - direct-response canon (long-form sales letter conventions; supported by NN-g scroll-depth research)
- **Price-reveal rule** (impulse vs considered) - direct-response category conventions

## Notes

- Scroll-rhythm spec is *upstream* of the actual copy. This skill specs the order; `/convert sales-page` writes the content into the order.
- The temperature-based zone proportions are starting points, not laws. A Hot-traffic offer with a long, education-heavy mechanism may stretch the Trust zone past 35%. Use the proportions as defaults; override with reason.
- The FAQ at the bottom is genuinely the last close. Treat each FAQ answer as a micro-Cascade-Close - never just informational.
- Sticky bottom CTA on mobile is the single highest-leverage move on long-form mobile pages. Don't omit it.
- This skill composes with: `convert-above-fold` (hero spec), `convert-three-locks` (the lock content), `convert-chute` (transition copy), `convert-proof-stack` (proof block visuals), `convert-mobile` (mobile compression of the whole flow).
