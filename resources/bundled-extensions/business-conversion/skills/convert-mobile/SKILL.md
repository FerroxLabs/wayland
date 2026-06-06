---
name: convert-mobile
slash_command: false
pack: business-conversion
family: visual_conversion
description: |
  Compress the Donahoe Method into mobile-first single-column layouts: thumb-zone CTA placement, Fitts-sized touch targets, mobile reading-pattern adaptation, sticky bottom CTA, and Method-density preservation under 375px width.
  Use when designing or rebuilding mobile rendering of a sales page, VSL page, lead-magnet page, or any direct-response asset where mobile traffic dominates and the Method must hold without losing layers.
  Not for desktop-first spec (use /convert above-fold or /convert scroll-rhythm) and not for native mobile-app design.
triggers:
  - mobile sales page
  - mobile conversion
  - mobile thumb zone
  - thumb reachable cta
  - mobile-first design
  - small screen sales page
  - donahoe mobile
  - mobile compression
negative_triggers:
  - native ios app design
  - native android app design
  - audit my mobile page url
tags: [conversion, page, mobile, donahoe-method, accessibility, visual]
priority: 80
version: 1.0.0
author: Wayland Business Pack
license: MIT
metadata:
  wayland:
    related_skills: [convert, convert-above-fold, convert-scroll-rhythm, convert-proof-stack, convert-sales-page]
attribution:
  lineage: "The Donahoe Method (Wayland-owned operating system); Fitts's law (Paul Fitts, 1954) for touch-target sizing; Steven Hoober thumb-zone research (UXmatters, 2013) for mobile reachability mapping"
---

# Convert Mobile - Mobile-First Compression of the Donahoe Method

> *"60%+ of web traffic is mobile. The Method must hold there or it doesn't hold."* - Wayland conversion playbook

Mobile is not "the desktop page, but smaller." Mobile is a different reading device, a different interaction surface, a different physical posture. This skill takes any direct-response asset built with The Donahoe Method and engineers the mobile rendering so that every Method layer survives the 375px squeeze.

## When to Use

Trigger phrases: "mobile sales page", "mobile conversion", "mobile thumb zone", "thumb reachable cta", "mobile-first design", "small screen sales page", "donahoe mobile", "mobile compression", `/convert mobile <product>`.

Use when:
- Designing or rebuilding the mobile rendering of a long-form sales page, VSL page, squeeze, OTO, or lead-magnet page
- The desktop page exists but mobile feels broken, slow, or under-converting
- A net-new page where mobile is the primary or sole device
- Diagnosing why the mobile bounce rate is high and desktop is fine

Do NOT use for:
- Native iOS or Android app design (this is web-only)
- Desktop-only spec - use `/convert above-fold` + `/convert scroll-rhythm`
- Auditing a live URL - use `/market landing <url>`
- Generating the desktop page first - desktop is downstream of mobile in this skill's worldview, but if the user wants the full asset, route to `/convert sales-page`

## Why Mobile-First (the operating principle)

A mobile-first page works on every device. A desktop-first page that's "responsive" almost always loses something on mobile - a layer of the Open compressed away, a CTA pushed below the fold, a proof block that wraps awkwardly, a Cascade Close that fragments.

So: design the mobile version first. Then expand for tablet and desktop. Every Method layer must be present at 375px or it doesn't ship.

## The Mobile Operating Constraints

### Constraint 1 - The viewport

| Device class | Width | Design baseline |
|--------------|-------|-----------------|
| Smallest still-shipping | 320px | iPhone SE 1st gen - design must not break |
| Modern compact | 375px | iPhone SE 2/3, iPhone 12/13 mini - design baseline |
| Modern standard | 390-430px | iPhone 14/15, most Android - abundant space |
| Large mobile | 430px+ | iPhone Pro Max, large Android - extra space, treat as standard |

Design and test at **375px**. Verify nothing breaks at 320px.

### Constraint 2 - Fitts's law (1954) - touch target sizing

*Fitts's law (Paul Fitts, 1954): the time required to acquire a target = function of the distance to the target and the size of the target.*

Translation for mobile: bigger CTAs that are closer to the thumb get clicked. Specifications:

| Element | Minimum | Method-grade |
|---------|---------|--------------|
| Primary CTA height | 44pt (Apple HIG) | 56-64px |
| Primary CTA tap area | 44×44pt | 56×280px+ (full-width on mobile) |
| Secondary CTA / link | 44×44pt | 48×120px+ |
| Form input height | 40px | 48-56px |
| Tap-target spacing | 8px gap | 12-16px gap |
| Body text size | 16px (anti-zoom) | 17-18px (comfortable read) |
| Line height (body) | 1.4 | 1.5-1.6 |

Anything below the minimums creates rage-taps and abandonment. Method-grade is what we ship.

### Constraint 3 - The thumb zone (Hoober, 2013)

*Steven Hoober's research ("How Do Users Really Hold Mobile Devices?", UXmatters, 2013, replicated since) maps mobile reachability into three zones based on one-handed grip.*

```
+--------------------+
|      HARD          |  ← top corners - slow, awkward
|   ~~~~~~~~~~~~     |     (especially top-far-corner for the dominant thumb)
|--------------------|
|       OK           |  ← middle - comfortable
|                    |
|--------------------|
|      EASY          |  ← bottom-center - natural thumb arc
|     ~~~~~~~        |     (sticky CTA lives here)
+--------------------+
```

Application rules:
- **Primary CTAs in the EASY zone.** Sticky bottom CTA on long pages = +10-25% conversions vs top-fixed (varies, folklore-leaning).
- **Hamburger menus in the HARD zone are standard but ergonomically poor.** Accept the convention (Jakob's Law); don't reinvent.
- **Long-press destructive actions stay in the HARD zone** - friction is a feature there.

### Constraint 4 - Single-column composition

No multi-column layouts on mobile. The three-thirds of the desktop scroll-rhythm collapse to a single vertical column. Section ordering becomes the *only* visual hierarchy. Sub-heads do more work.

### Constraint 5 - Speed budget

Mobile loads on cellular. Web Vitals targets:
- **LCP** (Largest Contentful Paint) <2.5s; >4s is failure
- **CLS** (Cumulative Layout Shift) <0.1; layout shifts cause accidental taps
- **INP** (Interaction to Next Paint, replaces FID 2024) <200ms

Practical implications for Method assets:
- Hero image: WebP, <100KB, lazy-load below-fold images
- Hero video: poster-image preview only; lazy-load video chunk on user gesture
- No render-blocking JS in the hero
- Fonts: subset to characters used; preload primary font; system-font fallback

## Inputs

Required:
1. **Asset type** - long-form sales page / VSL page / squeeze / OTO / lead-magnet / bridge
2. **Method skills that have run** - outputs from `convert-open`, `convert-three-locks`, `convert-bullets`, `convert-proof`, `convert-close`
3. **Desktop spec (if exists)** - output from `convert-above-fold` and/or `convert-scroll-rhythm`

Optional:
- **Brand visual constraints** - colors, typography, image style
- **Existing mobile rendering** - for porting / compression
- **Primary device target** - if the audience skews iOS or Android (rarely matters; Hoober applies)
- `out_path` - caller-controlled output. Defaults via `build_report_path("business-conversion", instruction)`

## The Mobile Method Compression Rules

Every Method layer must survive. Six compression rules:

### Rule 1 - Open compression (Four-Layer Open)

Desktop hero shows Layer 1 (headline) + Layer 2 (subhead). Mobile shows the *same two*, just smaller type. Layers 3-4 unspool below in the body - same as desktop.

NEVER strip Layer 2 from mobile to fit the CTA. If the CTA doesn't fit, shrink the headline. The Open is sacred.

### Rule 2 - Three Locks compression (zone proportions)

Zone proportions hold on mobile. The Want / Trust / Excuse percentages from `convert-scroll-rhythm` do not change. Mobile is taller, but the proportional split holds.

What changes: section dividers (white space + hairline rules) become the only visual zone marker since horizontal layout is gone.

### Rule 3 - CTA anchor compression

Desktop typical CTA count holds. Long-form mobile gets 5-9 CTAs same as desktop, plus:

- **Sticky bottom CTA bar** appears once the reader scrolls past Section 5 (Trust zone entry). Always EASY-zone. Always full-width.
- **Inline CTAs** are full-width buttons (not centered narrow buttons) - easier thumb hit.
- **Final CTA + P.S. + P.P.S. + FAQ** all retain anchor presence.

### Rule 4 - Proof Stack compression

Logo bars wrap to 2 rows at 375px (3-4 logos per row). Video testimonials show poster image + play-on-tap (never autoplay; bandwidth hostile). Quote-photo-result cards stack vertically; never side-by-side on mobile. See `/convert proof-stack` for the proof-stack-specific rules.

### Rule 5 - Bullet System compression

Bullets keep the four types (Keyhole / Flip / Snapshot / Scar) and keep the rhythm - but the visual checkmark + bullet copy stacks vertically. Each bullet gets its own visual block (12-16px between blocks). No two-column bullet grids on mobile.

### Rule 6 - Cascade Close compression

The Stack → Vision → Math → Safety Net → Door cascade holds. The Math close in particular benefits from a visual "math card" style (highlighted pricing block with the comparison) - this is the section most likely to need redesign on mobile because desktop math tables collapse poorly.

## Workflow

### Step 1 - Pull the desktop spec + Method skill outputs

If `convert-above-fold` and `convert-scroll-rhythm` have run, lift their outputs. If not, ask the user whether to design mobile-first (we run those skills with mobile-first defaults) or compress an existing desktop spec.

### Step 2 - Map the section order to a vertical column

Take the section list from `convert-scroll-rhythm` (14-18 sections). For each section, define:
- Which mobile pattern it uses (full-width text, scannable bullet block, image+text card, video poster, etc.)
- Its compressed type sizes
- Its CTA presence (inline button or rely on sticky bar)
- Its visual divider (white space + optional hairline rule)

### Step 3 - Spec the hero compression

The hero pattern at 375px:

```
+----------------------+
| [Logo]      [Menu]   |  ← top bar, 56-64px tall
+----------------------+
|                      |
| <HEADLINE 32-44px>   |  ← Layer 1
|                      |
| <Subhead 16-18px>    |  ← Layer 2
|                      |
| [  FULL-WIDTH CTA ]  |  ← 56px+ tall, EASY zone within scroll
|   <microcopy 12px>   |
|                      |
| ⭐ 4.9 / 312          |  ← compressed trust strip
| [logo][logo][logo]   |
+----------------------+
```

Above the fold at 375px must contain: headline + subhead + CTA + microcopy. Trust strip can wrap to row 2 below the fold; logo + menu live in the top bar.

### Step 4 - Spec the sticky bottom CTA bar

```
+----------------------+
|  Body content        |
|  (scrolls)           |
|                      |
+----------------------+
|  [    STICKY CTA   ] |  ← appears past Section 5
|                      |
+----------------------+
```

Specifications:
- Appears once scrollY > [end of Section 5 / Trust zone entry]
- Disappears when in viewport with the inline CTA (avoids double-CTA visual clash)
- Background: solid color with 12-16px top padding for thumb safety
- 56-64px tall; full-width
- Copy: shortest CTA copy ("Get my access", "Start my trial")
- Disclaimer line above (12px, 60% opacity): "Used by 1,847 founders" or guarantee blurb

### Step 5 - Spec each section's mobile rendering

For each of the 14-18 sections from the desktop scroll-rhythm:

1. Type sizes (compressed): h2 = 26-32px, h3 = 20-24px, body = 17-18px
2. Section padding: 24-32px horizontal, 48-72px vertical between sections
3. Image / video treatment (poster, lazy-load, max width 100%)
4. Bullet / list treatment (vertical stack only)
5. Optional inline CTA (full-width)
6. Section divider (white space + optional hairline)

### Step 6 - Form mobile audit (if forms exist)

| Element | Method-grade mobile spec |
|---------|----------------------------|
| Field count | 3-5 max for lead-capture; one-per-screen for multi-step |
| Field height | 48-56px |
| Label | Floating or above-field; never placeholder-only |
| Input mode | `type="email"`, `type="tel"`, `type="url"` for native keyboards |
| Autofill | `autocomplete` attributes set correctly |
| Submit button | Full-width, 56px+, value-loaded copy |
| Error inline | Specific message; never wipe the form on submit error |
| Multi-step | Progress indicator at top |

### Step 7 - Speed audit checklist

- [ ] LCP image WebP, <100KB, preloaded if hero
- [ ] Below-fold images lazy-loaded
- [ ] Hero video: poster image only at first paint; play on user gesture
- [ ] Render-blocking JS removed from hero
- [ ] Fonts subset + preloaded
- [ ] CSS minified, critical CSS inlined for hero
- [ ] Third-party scripts deferred or async
- [ ] CDN serving static assets

### Step 8 - Read the page out loud, scrolling on a phone

Final check: pull up the page on an actual mobile device. Read out loud. Scroll with one thumb. Tap each CTA. The Method's voice rules require this - read aloud reveals the rhythm. Mobile reveals the friction.

### Step 9 - Emit the spec + paste-ready HTML/CSS

## Output Template

```markdown
# Mobile Spec: <Product>

**Asset:** <long-form sales page / VSL / squeeze / OTO / lead-magnet>
**Design baseline:** 375px viewport (verified at 320px)
**Total scroll length target:** <pixel range>

---

## Hero (mobile, 375px)

[Wireframe - same as Step 3 above]

**Type spec:**
- Headline: <quoted> - clamp(28px, 8vw, 44px) / 800 / lh 1.05
- Subhead: <quoted> - clamp(15px, 4vw, 18px) / 500 / lh 1.5 / opacity 0.8
- CTA: <quoted> - 56-64px tall, full-width, accent color, white text
- Microcopy: <quoted> - 12-13px / 400 / opacity 0.6
- Trust strip: ⭐ 4.9 / 312 + 3 logos at 24-28px tall

## Vertical section list (mobile)

| # | Section | Pattern | Type | Inline CTA | Notes |
|---|---------|---------|------|------------|-------|
| 1 | Hero | Stacked | h1 + p + button | Yes | (above) |
| 2 | Open body | Full-width text | p (17-18px) | - | F-pattern; bold key phrases |
| 3 | Pain agitate | Full-width text | p + h3 sub-heads | - | Aggressive sub-head spacing |
| 4 | Vision paint | Image + text card | img + p | - | Image first; text below; never side-by-side |
| ... | ... | ... | ... | ... | ... |

## Sticky bottom CTA bar

- Appears: scrollY > [Section 5 end pixel]
- Hides: when inline CTA in viewport
- Height: 64px
- Copy: <quoted shortest CTA>
- Disclaimer line: <quoted>

## Form spec (if applicable)

[Per Step 6 table]

## Speed audit checklist

[Per Step 7 list]

## Paste-ready mobile-first CSS skeleton

```css
/* Mobile-first base */
:root {
  --accent: #ff5722;
  --text: #111;
  --text-muted: rgba(17, 17, 17, 0.65);
  --bg: #fff;
  --hairline: rgba(17, 17, 17, 0.08);
}

* { box-sizing: border-box; }
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
  font-size: 17px;
  line-height: 1.6;
  color: var(--text);
  background: var(--bg);
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

/* Hero */
.hero { padding: 32px 24px 48px; }
.hero h1 {
  font-size: clamp(28px, 8vw, 44px);
  font-weight: 800;
  line-height: 1.05;
  letter-spacing: -0.02em;
  margin: 0 0 16px;
}
.hero p.subhead {
  font-size: clamp(15px, 4vw, 18px);
  line-height: 1.5;
  opacity: 0.8;
  margin: 0 0 24px;
}
.hero .cta {
  display: block;
  width: 100%;
  padding: 18px 24px;
  min-height: 56px;
  font-size: 17px;
  font-weight: 700;
  background: var(--accent);
  color: #fff;
  border: 0;
  border-radius: 12px;
  text-decoration: none;
  text-align: center;
}
.hero .microcopy {
  margin-top: 10px;
  font-size: 12px;
  opacity: 0.6;
  text-align: center;
}

/* Sections */
.section { padding: 48px 24px; }
.section h2 {
  font-size: clamp(24px, 6vw, 32px);
  line-height: 1.15;
  margin: 0 0 20px;
}
.section h3 {
  font-size: clamp(18px, 5vw, 22px);
  line-height: 1.25;
  margin: 28px 0 12px;
}
.section p { margin: 0 0 16px; }
.section + .section { border-top: 1px solid var(--hairline); }

/* Inline CTA */
.cta-inline {
  display: block;
  width: 100%;
  padding: 18px 24px;
  min-height: 56px;
  font-size: 17px;
  font-weight: 700;
  background: var(--accent);
  color: #fff;
  border-radius: 12px;
  text-align: center;
  text-decoration: none;
  margin: 24px 0;
}

/* Sticky bottom CTA */
.sticky-cta {
  position: fixed;
  bottom: 0; left: 0; right: 0;
  padding: 12px 16px env(safe-area-inset-bottom, 12px);
  background: var(--bg);
  border-top: 1px solid var(--hairline);
  z-index: 50;
}
.sticky-cta .btn {
  display: block;
  width: 100%;
  padding: 16px;
  min-height: 56px;
  font-size: 16px;
  font-weight: 700;
  background: var(--accent);
  color: #fff;
  border-radius: 12px;
  text-align: center;
  text-decoration: none;
}
.sticky-cta .disclaimer {
  font-size: 11px;
  opacity: 0.55;
  text-align: center;
  margin-bottom: 6px;
}

/* Bullets */
.bullets { list-style: none; padding: 0; margin: 24px 0; }
.bullets li {
  position: relative;
  padding: 12px 0 12px 32px;
  border-bottom: 1px solid var(--hairline);
  font-size: 17px;
  line-height: 1.5;
}
.bullets li::before {
  content: "✓";
  position: absolute; left: 0; top: 14px;
  font-weight: 800; color: var(--accent);
}

/* Tablet up */
@media (min-width: 768px) {
  .hero { padding: 64px 32px 80px; max-width: 720px; margin: 0 auto; }
  .section { max-width: 720px; margin: 0 auto; padding: 80px 32px; }
  .sticky-cta { display: none; } /* desktop has anchored CTAs in flow */
}
```

## Read-aloud test note

Pull the rendered page on a phone. Read it. Scroll with one thumb. Each CTA must be reachable. Each transition must read naturally. If the rhythm breaks, return to `/convert chute` for transition rewrites.

---

## How to deploy

1. Spec mobile first (this skill), then expand to desktop with `/convert above-fold` + `/convert scroll-rhythm`.
2. Pair with `/convert proof-stack` for mobile-specific proof block layouts.
3. Pair with `/convert sales-page` to write the actual content into the mobile-first frame.
4. Run `/convert audit` on the rendered page once content is in.
5. Run real-device check at 320px (smallest), 375px (baseline), 414px (typical).
```

## Pitfalls

- **Stripping Layer 2 to fit.** Common move: hide the subhead on mobile to save space for the CTA. Don't. Layer 2 is half of the Open's "side door"; without it, Layer 1 lands as a naked headline. Shrink the headline instead.
- **Tap target violations.** Anything under 44pt fails Apple HIG and frustrates the thumb. Method-grade is 56-64px. The cost of an extra 12px is negligible; the cost of a rage-tap is the conversion.
- **Sticky CTA collision.** Sticky CTAs that overlap a scrolling inline CTA confuse the user. Implement viewport detection: hide the sticky bar when the inline CTA is on screen.
- **Hamburger overload.** Mobile nav menus tend to grow until they're a sitemap. On a sales page, you don't want a sitemap. Cut nav to 2-3 items max - or remove it entirely on dedicated landing pages.
- **Image-heavy hero on mobile.** A 1200×800 hero image at full quality is a 600KB+ payload that wrecks LCP. WebP, smaller dimensions for mobile breakpoint, lazy-load below-fold.
- **Autoplay video on mobile.** Almost every browser blocks autoplay-with-sound and many block silent autoplay. Use a poster image; play on tap.
- **Long forms.** A 7-field form on mobile feels like a tax return. Each field reduces conversion ~7%. Cut to 3-5; multi-step if you must capture more.
- **Desktop-first responsive afterthought.** "We'll fix the mobile layout later" almost always strips a Method layer. Mobile-first is the rule, not the courtesy.

## Lineage

- **The Donahoe Method** (Wayland-owned operating system) - every Method layer (Open / Three Locks / Bullets / Cascade Close / Voice Rules) must survive mobile compression
- **Fitts's law** (Paul Fitts, 1954) - touch-target sizing
- **Apple Human Interface Guidelines** - 44pt minimum touch target floor
- **Steven Hoober thumb-zone research** - *"How Do Users Really Hold Mobile Devices?"* (UXmatters, 2013) for EASY/OK/HARD zone mapping
- **Jakob's Law** (Nielsen Norman Group) - mobile patterns users already know (hamburger top-corner, sticky bottom bar)
- **Google Web Vitals** - LCP / CLS / INP targets (2020+)
- **WCAG 2.1 AA** - touch target spacing (8px min) and contrast (4.5:1)

## Notes

- Mobile is downstream of nothing and upstream of everything. Spec mobile first, then expand.
- Sticky bottom CTA on long-form mobile is the single highest-leverage move. Not optional.
- Read-aloud test on an actual phone - not a desktop emulator - is the only real verification.
- The Method's density (proof every 2-3 sentences, mixed bullet types, multi-layer Cascade Close) holds on mobile if compressed thoughtfully. The mobile compression rules above protect each layer.
- This skill composes with `convert-above-fold` (hero spec, mobile-first), `convert-scroll-rhythm` (section order, zone proportions), `convert-proof-stack` (proof block mobile patterns), `convert-sales-page` (content into the frame), and `convert-audit` (verifies Method survival post-compression).
