---
name: convert-thank-you-page
slash_command: false
pack: business-conversion
family: page_builder
description: |
  Author thank-you pages with a deliberate secondary-offer stack: deliver the promised asset, calibrate next-step CTA, and use the under-leveraged post-conversion surface to lift downstream metrics. Emits brief + paste-ready HTML/CSS.
  Use when the user needs a thank-you page after opt-in or post-purchase that does more than say "thanks" - it bridges to the next step.
  Not for OTOs (see /convert oto-page), downsells (see /convert downsell-page), or cross-sells (see /convert cross-sell-page).
triggers:
  - thank you page
  - thanks page
  - post-opt-in page
  - confirmation page
  - convert thank-you
  - secondary offer page
  - delivery page
negative_triggers:
  - oto page
  - downsell page
  - cross-sell page
  - sales page
  - audit my thank you page
tags: [conversion, copy, page, donahoe-method, html]
priority: 85
version: 1.0.0
author: Wayland Business Pack
license: MIT
metadata:
  wayland:
    related_skills: [convert, convert-oto-page, convert-cross-sell-page, convert-lead-magnet-page, convert-squeeze-page, convert-four-questions, convert-open, convert-three-locks, convert-bullets, convert-proof, convert-close, convert-chute, convert-voice, convert-bullshit-filter]
attribution:
  lineage: "The Donahoe Method (Wayland-owned operating system); references reciprocity-after-conversion canon, Cialdini commitment-and-consistency, post-conversion attention-window literature"
---

# Convert Thank-You Page - Delivery + Secondary Offer Stack

> *"The thank-you page is the most under-leveraged surface in most funnels. The visitor just said yes. They trust you more in this five-second window than they will at any point until they get a result. Use it."*

This skill builds the thank-you page: deliver the promise, set the next-step expectation, and stack a secondary offer or invitation that fits the moment.

## When to Use

Trigger phrases: `thank you page`, `thanks page`, `post-opt-in page`, `confirmation page`, `delivery page`, `/convert thank-you <context>`.

Use when:
- A visitor just submitted a form (lead magnet, squeeze, webinar reg) or completed a purchase.
- The page needs to (1) deliver/confirm the promise and (2) carry forward toward the next funnel step.
- The user wants to use the post-conversion attention window.

## When NOT to Use

- **Immediate post-checkout upgrade** → `/convert oto-page`.
- **OTO recovery** → `/convert downsell-page`.
- **Days-later lateral offer** → `/convert cross-sell-page`.
- **The lead-magnet opt-in page itself** → `/convert lead-magnet-page`.
- **Auditing existing thank-you page** → `/convert audit`.

## Inputs

Required:
1. **What just happened** - opt-in for a lead magnet? Webinar registration? Purchase confirmation?
2. **The deliverable** - what they should expect (download link visible, email arrived, calendar invite, etc.) and within what time window.
3. **The next step** - what's the *one* thing the user should do next? (Watch a welcome video, book a call, join a community, browse a related offer.)
4. **One person + Nerve** (One Person Rule, post-conversion version).

Optional:
- **Secondary offer** - if there's a relevant tripwire / book / micro-course / call booking.
- **Brand voice notes from the prior page.**
- **Calendar booking embed code** (if the next step is a call).
- **`out_path`** - defaults via `build_report_path`.

## Workflow - All Eight Method Phases (compressed; this is a confirmation page first, conversion page second)

### Phase 0 - Four Questions (call `convert-four-questions`)

For thank-you pages, the Four Questions reframe:
- **Why You?** - Why does the next step matter for *you* given what you just did?
- **Why Me?** - Inherited.
- **Why This?** - Why this *specific* next step (and not "follow us on social").
- **Why Now?** - The window matters: "while you're here..." or "before the email arrives..."

### Phase 1 - Temperature

The visitor is **Hot** - they just converted. Page length 200–600 words. Focus is delivery + one calibrated next step, not a second sales pitch.

### Phase 2 - Four-Layer Open (call `convert-open`)

Compressed and confirmation-led:
- Layer 1 = explicit confirmation. *"You're in. Here's what happens next."*
- Layer 2 = side-door pivot to the next step.
- Layer 3 = light Skin in the Game.
- Layer 4 = Fingerprint as one-line aside.

### Phase 3 - Three Locks

- **Want** = the next-step state ("by Friday, you'll have implemented step 1").
- **Trust** = inherited fully.
- **Excuse** = the next step is usually low-friction (watch a video, book a call) so the Excuse is built in.

### Phase 4 - Bullets

3–5 bullets only, listing what the visitor should expect. Mostly utility bullets (when the email arrives, what to look for, what to do first).

### Phase 5 - Proof

Optional. One Drive-By is enough if there's a secondary offer. If the page is delivery-only, no proof needed.

### Phase 6 - Cascade Close

The "next step" CTA is the close:
- Vision close on what the next step delivers.
- Door = the button.

If a secondary offer exists, a compact Stack + Math + Safety Net block sits below the next-step CTA - *clearly subordinated visually* so it doesn't compete with delivery.

### Phase 7 - Greased Chute

Top half = delivery + next step. Bottom half = optional secondary offer. The two halves should not blur together.

### Phase 8 - Voice + Bullshit Filter

The biggest filter test: *"Does the secondary offer actually serve the visitor at this moment, or am I just refusing to leave money on the table?"* If the latter, drop the secondary offer entirely and let the page be a clean thank-you.

## Section Architecture

| # | Section | Purpose |
|---|---------|---------|
| 1 | Confirmation headline | Layer 1 |
| 2 | What happens next (3-5 bullets) | Delivery clarity |
| 3 | Inline delivery (download link / video / instructions) | Promise fulfilled |
| 4 | Next-step CTA (the *one* action) | Cascade Close core |
| 5 | (Optional) Secondary offer block | Calibrated stack |
| 6 | One-line Fingerprint aside | Voice anchor |

## HTML/CSS Reference Implementation

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>You're in - {{BRAND}}</title>
  <meta name="description" content="{{META_DESCRIPTION}}">
  <meta property="og:title" content="{{HEADLINE}}">
  <meta property="og:description" content="{{META_DESCRIPTION}}">
  <meta property="og:type" content="website">
  <style>
    :root{--ink:#0e1116;--ink-soft:#3a3f47;--paper:#fbfaf6;--accent:#1f7a3a;--accent-ink:#fff;--rule:#e6e2d8;--max:680px}
    *,*::before,*::after{box-sizing:border-box}
    body{margin:0;font:18px/1.6 -apple-system,BlinkMacSystemFont,"Helvetica Neue",Arial,sans-serif;color:var(--ink);background:var(--paper)}
    main{max-width:var(--max);margin:0 auto;padding:24px 20px 64px}
    .confirm{background:#e8f5ec;border:1px solid #b6dec3;color:#0f3c1f;padding:14px 18px;border-radius:6px;font-weight:600;margin:0 0 24px}
    h1{font-size:clamp(26px,5vw,36px);line-height:1.18;margin:0 0 14px}
    h2{font-size:22px;margin:32px 0 12px}
    p{margin:0 0 16px}
    ul.bullets{list-style:none;padding:0;margin:0 0 24px}
    ul.bullets li{padding:8px 0 8px 26px;position:relative;border-bottom:1px solid var(--rule)}
    ul.bullets li::before{content:"";position:absolute;left:6px;top:16px;width:8px;height:8px;background:var(--accent);border-radius:50%}
    .deliver{background:#fff;border:1px solid var(--rule);padding:18px;border-radius:8px;margin:0 0 28px}
    .cta{display:inline-block;padding:18px 26px;background:var(--accent);color:var(--accent-ink);text-decoration:none;font-weight:700;font-size:18px;border-radius:6px}
    .cta:focus-visible{outline:3px solid var(--ink);outline-offset:3px}
    .secondary{margin-top:48px;padding:24px;background:#fff;border:1px dashed var(--rule);border-radius:8px;font-size:16px;color:var(--ink-soft)}
    .secondary h2{margin-top:0;color:var(--ink);font-size:20px}
    .secondary .cta{padding:12px 18px;font-size:15px;background:var(--ink);color:#fff}
    .ps{font-style:italic;color:var(--ink-soft);margin-top:32px}
    @media (prefers-reduced-motion: reduce){html{scroll-behavior:auto}}
  </style>
</head>
<body>
<main>
  <div class="confirm" role="status" aria-live="polite">{{CONFIRMATION_LINE_E_G_CHECK_YOUR_INBOX}}</div>

  <h1>{{HEADLINE_YOURE_IN}}</h1>
  <p>{{SIDE_DOOR_PIVOT_PARAGRAPH}}</p>

  <h2>What happens next</h2>
  <ul class="bullets">
    <li>{{BULLET_TIMING_OF_DELIVERABLE}}</li>
    <li>{{BULLET_WHAT_TO_LOOK_FOR}}</li>
    <li>{{BULLET_WHAT_TO_DO_FIRST}}</li>
  </ul>

  <div class="deliver">
    <p>{{INLINE_DELIVERY_OR_INSTRUCTIONS}}</p>
    <p><a class="cta" href="{{NEXT_STEP_URL}}" aria-label="{{CTA_ARIA}}">{{CTA_NEXT_STEP_VISION}}</a></p>
  </div>

  <p>{{ONE_LINE_FINGERPRINT_ASIDE}}</p>

  <!-- OPTIONAL: secondary offer block. Visually subordinated (dashed border, smaller CTA, ink-on-white). -->
  <aside class="secondary">
    <h2>{{SECONDARY_OFFER_HEADER}}</h2>
    <p>{{SECONDARY_OFFER_BODY_50_TO_100_WORDS}}</p>
    <p><a class="cta" href="{{SECONDARY_URL}}">{{SECONDARY_CTA_LABEL}}</a></p>
  </aside>

  <p class="ps"><strong>P.S.</strong> {{ONE_LINE_RECLOSE_OR_REASSURANCE}}</p>
</main>
</body>
</html>
```

CSS notes:
- The green confirmation banner at the top resolves the "did it work?" anxiety in one glance. Without it, visitors second-guess and refresh.
- The secondary offer is **visually subordinated** - dashed border, smaller CTA, ink-on-white instead of green-on-white. This is deliberate. A secondary offer that competes visually with the next-step CTA cannibalizes the primary outcome.
- Inline delivery (download link / video / instructions) sits in a white card right next to the next-step CTA so the eye moves: confirm → delivered → next step.

## Output Template

```markdown
# Thank-You Page - {{CONTEXT_OPT_IN_OR_PURCHASE}}

**What just happened:** {{DESCRIPTION}}
**Deliverable:** {{WHAT_THEY_GET}} - within {{TIMEFRAME}}
**Next step (the one):** {{NEXT_STEP}}
**Secondary offer (optional):** {{SECONDARY_OR_NONE}}

## Phase 0–8 (compressed)
- Four Questions: post-conversion versions
- Open: confirmation-led, pivot to next step
- Locks: Want (next-step state) / Trust (inherited) / Excuse (low-friction)
- Bullets: 3–5 utility bullets
- Cascade Close: Vision + Door (next-step CTA) + optional subordinated secondary stack
- Voice: full pass; Filter run separately as a coaching pass via `convert-bullshit-filter` before ship

## Final copy
- Confirmation banner: "{{LINE}}"
- Headline: "{{H1}}"
- Side-door pivot paragraph: "{{P}}"
- "What happens next" bullets: {{LIST}}
- Inline delivery line: "{{P}}"
- Next-step CTA: "{{LABEL}}"
- Fingerprint aside: "{{LINE}}"
- (Optional) Secondary offer header / body / CTA: {{IF_PRESENT}}
- P.S.: "{{P}}"

## HTML reference
{{HTML_BLOCK}}

## Method coverage report
```
Open:        partial - confirmation-led; Side Door pivot, Skin-in-Game, Fingerprint aside present
Three Locks: compressed - Want (next-step state), Trust (inherited from prior page), Excuse (low-friction next step)
Proof:       partial - optional Drive-By only (no full proof rhythm; not applicable post-conversion)
Bullets:     compressed - 3–5 utility bullets only (not the full Bullet System)
Cascade Close: compressed - Vision + Door (next-step CTA); optional subordinated secondary Stack/Math if a secondary offer is present
Greased Chute: full - confirm → delivery → next step → optional secondary
Voice Rules: full - first person, contractions, no marketing-speak
Temperature: post-conversion (typically Boiling - recently bought; minimal copy)

Required next step: Run /convert bullshit-filter on this draft before shipping.
The Filter is a SEPARATE coaching pass - this skill cannot grade its own output.

Ethics check: secondary offer (if present) genuinely fits the moment, not bolted on for AOV.
```
```

## Notes / Cross-Skill Composition

- The post-opt-in thank-you page is the most under-leveraged surface in most funnels. Even just adding a *single* calibrated next-step CTA (book a call, watch the welcome video) lifts downstream conversion measurably.
- For the post-purchase thank-you page that follows a flagship + OTO sequence, this page should be clean delivery - the OTO/downsell already did the conversion work.
- For webinar-reg thank-you pages, the next-step CTA should usually be "add to calendar" + watch a 90-second prep video.
- Secondary offers belong here only if they genuinely serve the moment. When in doubt, drop them.

## Lineage

- Post-conversion attention-window leverage - direct-response info-marketing tradition.
- Reciprocity at the moment of conversion - Cialdini (Influence, 1984).
- Commitment-and-consistency next-step framing - same canon.
- The Method itself - Wayland-owned operating system.
