---
name: convert-above-fold
slash_command: false
pack: business-conversion
family: visual_conversion
description: |
  Engineer above-fold hierarchy for direct-response pages: 5-second comprehension test, hero rhythm, primary CTA placement, and visual scaffolding for the Four-Layer Open. Produces a wireframe spec + paste-ready HTML/CSS for the first viewport.
  Use when designing or rebuilding the top-of-page that must answer "what / who / next" in five seconds while seating Layer 1 (Nerve Strike) of the Open.
  Not for full-page sales-page assembly (use /convert sales-page) and not for live-URL teardown (use /market landing).
triggers:
  - above the fold
  - above-fold hero
  - hero section design
  - first viewport
  - 5 second test
  - five second test
  - hero hierarchy
  - donahoe above fold
  - what who next
negative_triggers:
  - audit my hero on this url
  - rewrite my full sales page
  - score my landing page
tags: [conversion, page, above-fold, hero, donahoe-method, four-layer-open, visual]
priority: 80
version: 1.0.0
author: Wayland Business Pack
license: MIT
metadata:
  wayland:
    related_skills: [convert, convert-open, convert-sales-page, convert-scroll-rhythm, convert-mobile, convert-proof-stack]
attribution:
  lineage: "The Donahoe Method (Wayland-owned operating system); Steve Krug's 5-second comprehension test (2000) and Nielsen Norman Group's Jakob's Law as supporting visual canon"
---

# Convert Above-Fold - Hero Hierarchy Engineered for the Four-Layer Open

> *"Your opening has one job: make them keep reading."* - The Donahoe Method, Framework 1

The first viewport is where the Method either lands or dies. This skill engineers the above-fold zone so the visual hierarchy *carries* Layer 1 (Nerve Strike) of the Four-Layer Open and points the reader straight into Layer 2 (Side Door). Every pixel above the fold is in service of "make them keep reading."

## When to Use

Trigger phrases: "above the fold", "above-fold hero", "hero section design", "first viewport", "5 second test", "donahoe above fold", "what who next", `/convert above-fold <product>`.

Use when:
- Designing or rebuilding the hero zone of a sales page, VSL page, squeeze page, or lead-magnet page
- The reader currently fails the 5-second test ("what is this / who is it for / what do I do")
- The headline is right but the visual hierarchy is suffocating it
- Mobile and desktop hero need to be specced together (this skill handles both)

Do NOT use for:
- Full sales-page assembly - use `/convert sales-page`
- Auditing an existing live page - use `/market landing <url>`
- Generating only the headline copy - use `/convert open` (Layer 1 lives there)
- Scroll mechanics below the fold - use `/convert scroll-rhythm`

## The Five-Second Test (Krug, popularized 2000)

A first-time visitor must, within five seconds, be able to answer three questions cold:

1. **What is this?** - the product/offer/promise
2. **Who is it for?** - the one person we're writing to (Donahoe Voice Rule #1)
3. **What do I do next?** - the primary CTA

If any answer is missing or fuzzy, the hero fails. Test by showing the page to someone for five seconds, hiding it, and asking the three questions. Repeat with three different people. Cold answers only.

*The 5-second comprehension test (popularized by Steve Krug, 2000) and Jakob's Law (Nielsen Norman Group) - users prefer pages that work the way other pages they know already work. Don't reinvent the hero.*

## Inputs

Required:
1. **Product / offer name** - what we're selling
2. **The Nerve** - the specific raw pain (same input as `convert-open`); pulled from the Four-Layer Open if `convert-open` ran upstream
3. **Target reader** - the one person (Donahoe Voice Rule #1)
4. **Primary CTA** - what action we're asking for ("Start my 14-day trial", "Get my free teardown", "Watch the 18-minute training")

Optional:
- **Asset type** - sales page / VSL page / squeeze / lead-magnet / OTO (changes the hero pattern)
- **Brand context** - colors, typeface, voice (informs the styling without overriding the Method)
- **Existing hero copy** - if porting from an existing page; otherwise generated fresh
- `out_path` - caller-controlled output. Defaults via `build_report_path("business-conversion", instruction)`

## The Donahoe Above-Fold Anatomy

The hero serves the Open. Map each visual slot to a Method element.

### Slot 1 - The Nerve Strike Headline (top, dominant)

The headline IS Layer 1 of the Four-Layer Open. Specifications:

- One line on desktop, max two on mobile
- Specific, sensory, names the pain they already feel
- Type size: 48-72px desktop / 32-44px mobile (responsive clamp)
- Type weight: 700-900
- Line height: 1.05-1.15 (tight; this is a punch, not a paragraph)
- Color: highest-contrast text color in the design system (WCAG AA 4.5:1 minimum)

The headline is the only element that gets to be loud. Everything else supports it.

### Slot 2 - The Side Door Subhead (directly below)

The subhead lifts Layer 2 of the Open into the visual frame. This is the "I noticed something..." moment that signals "this is a conversation, not a pitch."

- 1-2 sentences, conversational tone
- Type size: 18-22px desktop / 16-18px mobile
- Type weight: 400-500
- Line height: 1.4-1.5
- Color: 70-80% opacity of the headline color (subordinate, not dim)

### Slot 3 - The Primary CTA (above-fold, thumb-reachable on mobile)

One CTA. One. Above-fold visitors have one decision to make.

- Button height: 56-64px desktop / 48-56px mobile (Apple HIG floor: 44pt; we exceed)
- Width: hug content + 32-48px horizontal padding; full-width on mobile <600px
- Color: brand accent with WCAG AA contrast (4.5:1) against background
- Copy: first-person + value-loaded ("Start MY trial" not "Submit"; "Get my teardown" not "Send")
- Microcopy underneath (12-14px, 60% opacity): handles the smallest objection ("No card required", "60-second video", "Used by 1,847 founders")

### Slot 4 - The Skin-in-Game Anchor (right column or beneath CTA)

Visual evidence of Layer 3 of the Open - the "why this person is telling you this." Options:

- Founder photo + 1-line credential drop ("I burned $84K figuring this out")
- A single specific number ("$2.4M tracked through this exact funnel")
- A single named testimonial fragment with photo (~80 chars max - full proof stack lives below the fold via `convert-proof-stack`)

The anchor is small. It's a wink, not a wall. Full proof comes below the fold.

### Slot 5 - Trust Strip (just below CTA, low-emphasis)

3-5 elements, single row, ~24-32px height each:
- Customer logos (if recognizable to the target reader)
- "As seen in" media bar (only if real)
- Star rating + review count ("4.9 / 312 reviews")
- Money-back guarantee badge

Trust strip is grayscale or 60% opacity. It's reassurance, not advertisement.

## Layout Patterns (pick one)

### Pattern A - Center Stack (default for cold traffic, lead-magnet, squeeze)

```
[          Headline          ]
[          Subhead           ]
[           CTA              ]
[       microcopy            ]
[       trust strip          ]
```

When to use: cold traffic, single-message pages, mobile-first audiences. Dead simple. Eyes go top → middle → CTA.

### Pattern B - Z-Pattern (default for warm traffic, longer sales pages)

```
[ Logo  ----------  Login   ]
[ Headline  →   Founder photo]
[       ↘                    ]
[ Subhead → CTA              ]
```

Eyes track top-left → top-right → diagonal → bottom-right CTA. Place the CTA at the visual end of the Z. Source: NN-g eye-tracking studies; landing pages.

### Pattern C - Asymmetric Hero (default for VSL, considered offers)

```
[ Headline               ][          ]
[ Subhead                ][   VIDEO  ]
[ CTA + microcopy        ][          ]
[ trust strip                        ]
```

Left column carries the Open layers; right column carries the video or hero image. Asymmetry creates visual hierarchy that resolves into the CTA.

## Workflow

### Step 1 - Pull the Open inputs

If `convert-open` already ran on this product, lift Layers 1-3 from its output. The headline is Layer 1; the subhead is a compressed Layer 2; the founder anchor is a compressed Layer 3.

If `convert-open` has not run, ask: *"Has the Four-Layer Open been generated for this product yet? If yes, paste it. If no, I'll run it first - the hero only works if the Open is locked."* Don't proceed without the Open inputs.

### Step 2 - Pick the layout pattern

Default rules:
- Lead-magnet / squeeze / cold-traffic → Pattern A (Center Stack)
- Long-form sales page (warm/hot traffic) → Pattern B (Z-Pattern)
- VSL page or considered offer with hero video → Pattern C (Asymmetric)

User override allowed; warn if the override creates known friction (e.g., Pattern C without a video tends to feel hollow).

### Step 3 - Spec the headline

Headline = Layer 1 of the Open compressed to one line. Test:
- Reads in <2 seconds at 48px type
- Names the pain the reader already feels
- No hedging, no marketing-speak ("leverage", "optimize", "revolutionary", "unlock potential" - banned by Voice Rules)
- Passes the Bullshit Filter: would I say this out loud to someone I'm trying to help?

### Step 4 - Spec the subhead

Subhead = Layer 2 of the Open. The casual observation, the "I noticed something..." Conversational. Specific. 1-2 sentences max in 18-22px type.

### Step 5 - Spec the CTA

One button. First-person. Value-loaded. Microcopy below to defuse the smallest objection.

CTA copy formula: `[Verb] my [outcome]` or `[Get/Start/Watch] [the specific deliverable]`

- ✓ "Start my 14-day trial"
- ✓ "Get my free funnel teardown"
- ✓ "Watch the 18-minute training"
- ✗ "Submit", "Click here", "Learn more", "Get started" (vague - what do I get?)

### Step 6 - Spec the trust strip

3-5 elements. Grayscale or 60% opacity. Real items only - never invent press logos or stats.

### Step 7 - Run the 5-second test (mentally)

Cover the rest of the page. Look at only the hero for 5 seconds. Answer:
- What is this?
- Who is it for?
- What do I do next?

If any answer is fuzzy, return to Step 3-5 and tighten.

### Step 8 - Mobile rendering check

The hero compresses on mobile. Single column. Headline shrinks to 32-44px. CTA goes full-width. Founder photo moves below the CTA or disappears. Trust strip wraps.

Test: at 375px viewport (iPhone SE baseline), can the user see headline + subhead + CTA *without scrolling*? If not, compress.

### Step 9 - Emit the spec + HTML

Output the wireframe, the slot-by-slot spec, paste-ready HTML/CSS, and the 5-second-test result.

## Output Template

```markdown
# Above-Fold Hero: <Product>

**Pattern:** Center Stack / Z-Pattern / Asymmetric
**Reader:** <one specific person>
**Nerve:** <the raw pain>
**Asset type:** <sales page / VSL / squeeze / lead-magnet>

---

## Wireframe (desktop, 1280px)

```
+---------------------------------------------------+
| [Logo]                                  [Login]   |
+---------------------------------------------------+
|                                                   |
|     <HEADLINE - Nerve Strike>                     |
|                                                   |
|     <Subhead - Side Door, 1-2 sentences>          |
|                                                   |
|     [  PRIMARY CTA  ]   ← microcopy               |
|                                                   |
|     ⭐⭐⭐⭐⭐  4.9 / 312    [logo] [logo] [logo]   |
+---------------------------------------------------+
```

## Wireframe (mobile, 375px)

```
+--------------------+
| [Logo]      [Menu] |
+--------------------+
| <HEADLINE>         |
| <Subhead>          |
|                    |
| [   FULL-W CTA  ]  |
| microcopy          |
|                    |
| ⭐ 4.9 / 312        |
| [logo][logo][logo] |
+--------------------+
```

## Slot specs

| Slot | Copy | Type | Color | Source layer |
|------|------|------|-------|--------------|
| Headline | <quoted> | 48-72px / 32-44px / 700-900 / lh 1.05 | <hex> | Open Layer 1 |
| Subhead | <quoted> | 18-22px / 16-18px / 400-500 / lh 1.4 | <hex 80%> | Open Layer 2 |
| CTA | <quoted> | 56-64px button / 48-56px mobile | <accent hex> | Method Cascade Door |
| Microcopy | <quoted> | 12-14px / 400 | <hex 60%> | Bullshit-Filter-passed |
| Trust strip | <list> | 24-32px | grayscale | Cialdini social proof |
| Founder anchor | <photo + 1-line> | 64x64 photo + 14-16px line | brand | Open Layer 3 |

## Paste-ready HTML/CSS

```html
<section class="hero">
  <div class="hero__inner">
    <h1 class="hero__headline"><!-- Nerve Strike, Layer 1 --></h1>
    <p class="hero__subhead"><!-- Side Door, Layer 2 --></p>
    <a class="hero__cta" href="#order"><!-- First-person value CTA --></a>
    <p class="hero__microcopy"><!-- objection defuser --></p>
    <ul class="hero__trust">
      <li>⭐ 4.9 / 312</li>
      <li><img src="logo-1.svg" alt="Logo 1"></li>
      <li><img src="logo-2.svg" alt="Logo 2"></li>
    </ul>
  </div>
</section>

<style>
  .hero { padding: clamp(48px, 8vw, 96px) 24px; }
  .hero__inner { max-width: 880px; margin: 0 auto; text-align: center; }
  .hero__headline { font-size: clamp(32px, 5.5vw, 64px); font-weight: 800;
                    line-height: 1.05; letter-spacing: -0.02em; margin: 0; }
  .hero__subhead { font-size: clamp(16px, 1.6vw, 20px); line-height: 1.5;
                   opacity: 0.8; margin: 16px auto 32px; max-width: 56ch; }
  .hero__cta { display: inline-block; padding: 18px 36px; font-size: 18px;
               font-weight: 700; border-radius: 12px; background: var(--accent);
               color: #fff; text-decoration: none; min-height: 56px; }
  .hero__cta:hover { transform: translateY(-1px); }
  .hero__microcopy { font-size: 13px; opacity: 0.6; margin-top: 12px; }
  .hero__trust { display: flex; gap: 24px; justify-content: center;
                 flex-wrap: wrap; margin-top: 32px; opacity: 0.7;
                 list-style: none; padding: 0; }
  @media (max-width: 600px) {
    .hero__cta { display: block; width: 100%; }
  }
</style>
```

## 5-Second Test result

| Question | Answer |
|----------|--------|
| What is this? | <one sentence the reader could give cold> |
| Who is it for? | <one sentence - does it match the One Person?> |
| What do I do next? | <the CTA, repeated back> |

PASS / FAIL.

## Mobile Test result

At 375px viewport: headline + subhead + CTA visible without scroll. PASS / FAIL.

---

## How this hero seats the Open

- Headline = Layer 1 (Nerve Strike) - visual dominance ensures the nerve hit lands first
- Subhead = Layer 2 (Side Door) - type weight + length signal "conversation"
- Founder anchor = Layer 3 (Skin in the Game) - small, specific, "this person has lived it"
- The whole hero's distinctive composition = Layer 4 (Fingerprint) - only-this-page feel

The Open's text continues immediately below the fold. The hero hands off to the body without breaking voice.

## How to deploy

1. Drop the HTML/CSS into the page template.
2. Pair with `convert-scroll-rhythm` to architect what happens at scroll position 1, 2, 3+.
3. Pair with `convert-proof-stack` to design the proof zone that opens after the hero.
4. Pair with `convert-mobile` to compress the entire page (not just the hero) for mobile.
5. Run `convert-audit` on the full draft before shipping.
```

## Pitfalls

- **Headline drift.** The headline in the hero must equal Layer 1 of the Open. If the page body's Layer 1 reads different from the visual headline, the reader feels a seam. Lock them.
- **CTA crowding.** Two above-fold CTAs feels like indecision. One above-fold CTA, then a secondary CTA can appear *after* the proof stack.
- **Stock photo trap.** The founder anchor is only-you. A stock photo in that slot signals fake. If a real founder photo isn't available, drop the slot - don't fake it.
- **Trust strip lying.** "As seen in" with logos the brand has not actually appeared in is the fastest credibility-killer on the web. Real items only.
- **Mobile compression cheating.** Hiding the subhead on mobile to fit the CTA is a common move; it strips Layer 2 of the Open. Don't. Compress the headline instead.
- **The vanity hero.** Beautiful gradient backgrounds with no Method scaffolding is design that erased the message. The hero is in service of the Open, not in service of itself.

## Lineage

- Visual scaffolding for **The Donahoe Method's Four-Layer Open** (Wayland-owned operating system) - every slot serves a layer
- *The 5-second comprehension test* (popularized by Steve Krug, 2000)
- *Jakob's Law* (Nielsen Norman Group) - users prefer hero patterns they already know
- Z-pattern reading (Nielsen Norman eye-tracking, 2006/2020)
- Apple HIG touch-target floor (44pt) for CTA sizing
- WCAG AA contrast (4.5:1) for color pairs

## Notes

- This is the visual Open. Pair it with `convert-open` (which it derives from), `convert-scroll-rhythm` (what comes next), `convert-proof-stack` (what fills the proof zone), and `convert-mobile` (which compresses the whole page).
- Hero design is downstream of the Open. If the Open is wrong, no hero design fixes it. Run `convert-open` first.
- The 5-second test is a hard gate. A page that fails it on three different testers is not ready to ship. Iterate Steps 3-5 until it passes cold.
- This skill emits HTML/CSS as a reference implementation, not a framework-coupled component. Paste into Webflow / Framer / Wix / Carrd / static HTML.
