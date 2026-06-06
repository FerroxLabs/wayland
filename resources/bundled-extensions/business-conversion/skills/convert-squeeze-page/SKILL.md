---
name: convert-squeeze-page
slash_command: false
pack: business-conversion
family: page_builder
description: |
  Author single-purpose opt-in (squeeze) pages: compressed Method, one promise, one form, one CTA. Emits brief + paste-ready HTML/CSS with accessible form markup.
  Use when the user wants email addresses in exchange for a single specific promise (lead magnet, waitlist, free training).
  Not for full long-form sales pages (see /convert sales-page) or the lead-magnet delivery page (see /convert lead-magnet-page).
triggers:
  - squeeze page
  - opt-in page
  - email capture page
  - waitlist page
  - convert squeeze
  - single field opt-in
  - lead capture page
negative_triggers:
  - lead magnet delivery page
  - sales page
  - audit my squeeze page
  - rewrite my opt-in
tags: [conversion, copy, page, squeeze-page, donahoe-method, html]
priority: 90
version: 1.0.0
author: Wayland Business Pack
license: MIT
metadata:
  wayland:
    related_skills: [convert, convert-lead-magnet-page, convert-four-questions, convert-temperature, convert-open, convert-three-locks, convert-bullets, convert-proof, convert-close, convert-chute, convert-voice, convert-bullshit-filter]
attribution:
  lineage: "The Donahoe Method (Wayland-owned operating system); references Halbert single-promise canon, Caples headline formulas, Schwartz market-sophistication framing"
---

# Convert Squeeze Page - Single-Purpose Opt-In

> *"A squeeze page has one job. One promise. One field. One button. If anything else is on the page, it's stealing attention from the one thing you asked them to do."*

This skill builds a compressed-Method opt-in page: above-fold only, no scroll required, no secondary CTAs.

## When to Use

Trigger phrases: `squeeze page`, `opt-in page`, `email capture page`, `waitlist page`, `/convert squeeze <topic>`.

Use when the goal is **email capture** in exchange for a single specific promise - a free guide, a waitlist seat, a free training, an early-access invitation.

## When NOT to Use

- **Long-form sales page** → `/convert sales-page`.
- **Page that delivers the lead magnet after opt-in** → `/convert lead-magnet-page`.
- **Webinar registration (different intent)** → `/convert webinar-reg`.
- **Auditing existing opt-in page** → `/convert audit`.

## Inputs

Required:
1. **The promise** - what specifically does the reader get for their email? Not "tips" - *"the exact 6-email cold sequence that's pulled $1.4M for our agency clients."*
2. **One person + Nerve** (One Person Rule).
3. **Form destination** - where does the email post? (ESP endpoint, webhook URL, ConvertKit form ID, etc.)
4. **Post-opt-in destination** - where do they land after submit? (Usually the lead-magnet page or a thank-you page.)

Optional:
- **Brand colors / logo.**
- **Single proof line** - one Drive-By or one Receipt to add micro-credibility.
- **`out_path`** - defaults via `build_report_path`.

## Workflow - All Eight Method Phases (radically compressed)

A squeeze page can be 60–120 words total. Every Method phase still applies - they just collapse to one or two sentences each.

### Phase 0 - Four Questions (call `convert-four-questions`)

Answer the four, then collapse them into a single headline + single subhead. The headline answers Why You. The subhead answers Why This.

### Phase 1 - Temperature (call `convert-temperature`)

Squeeze pages run cool to warm. For Ice Cold, the squeeze should be reached *after* a bridge page, not directly. For Hot/Boiling, you can drop the page entirely and use an inline form on the previous asset.

### Phase 2 - Four-Layer Open (call `convert-open`)

Compressed to 1–2 sentences:
- Headline = Layer 1 (Nerve Strike).
- Subhead = Layer 2 (Side Door) + Layer 3 (Skin in Game) compressed.
- Layer 4 (Fingerprint) lives in a single one-line aside under the button.

### Phase 3 - Three Locks (call `convert-three-locks`)

- **Want** = the headline + the promise.
- **Trust** = one Drive-By proof line below the form.
- **Excuse** = there isn't one - opting in is free, so the Excuse lock pre-opens itself.

### Phase 4 - Bullets (call `convert-bullets`)

3 bullets. ONE Keyhole, ONE Snapshot, ONE Flip - that's it. They sit between the subhead and the form. A squeeze with more than 3 bullets is no longer a squeeze.

### Phase 5 - Proof (call `convert-proof`)

One line. Drive-By format. *"From the team that's helped 14,000 SMBs ship paid traffic since 2014."* That's the entire proof budget.

### Phase 6 - Cascade Close (call `convert-close`)

The form is the close. Button label IS the door. Use the **Door** + **Vision** patterns: button copy paints the state, not the action.

- ✗ "Submit" / "Sign up"
- ✓ "Send me the guide" / "Get the cold-email sequence" / "Reserve my seat"

### Phase 7 - Greased Chute (call `convert-chute`)

There's no scroll, so chute = eye flow. Headline → subhead → bullets → form → proof line → reassurance line. The eye must move from one to the next without bouncing.

### Phase 8 - Voice + Bullshit Filter

Squeeze copy is the most exposed copy you'll write because it's so short. Every word is load-bearing. Read aloud twice.

## Section Architecture (above-fold only)

| # | Section | Lines |
|---|---------|-------|
| 1 | Headline (Nerve Strike) | 1 |
| 2 | Subhead (Side Door + Skin) | 1 |
| 3 | Three bullets (K + Sn + F) | 3 |
| 4 | Email field + button | 1 |
| 5 | Privacy/reassurance line | 1 |
| 6 | Drive-By proof line | 1 |

Total: ~80 words. Single column. Mobile-first.

## HTML/CSS Reference Implementation

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{{HEADLINE}} - {{BRAND}}</title>
  <meta name="description" content="{{META_DESCRIPTION}}">
  <meta property="og:title" content="{{HEADLINE}}">
  <meta property="og:description" content="{{META_DESCRIPTION}}">
  <meta property="og:type" content="website">
  <meta property="og:image" content="{{OG_IMAGE_URL}}">
  <style>
    :root{--ink:#0e1116;--ink-soft:#3a3f47;--paper:#fbfaf6;--accent:#c0392b;--accent-ink:#fff;--rule:#e6e2d8;--max:560px}
    *,*::before,*::after{box-sizing:border-box}
    body{margin:0;font:18px/1.55 -apple-system,BlinkMacSystemFont,"Helvetica Neue",Arial,sans-serif;color:var(--ink);background:var(--paper);min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px}
    main{max-width:var(--max);width:100%}
    h1{font-size:clamp(26px,5vw,38px);line-height:1.18;margin:0 0 12px}
    p.subhead{font-size:18px;color:var(--ink-soft);margin:0 0 20px}
    ul.bullets{list-style:none;padding:0;margin:0 0 24px}
    ul.bullets li{padding:8px 0 8px 24px;position:relative}
    ul.bullets li::before{content:"";position:absolute;left:4px;top:16px;width:8px;height:8px;background:var(--accent);border-radius:50%}
    form{display:grid;grid-template-columns:1fr;gap:10px;margin:0 0 12px}
    @media(min-width:480px){form{grid-template-columns:1fr auto}}
    label.sr{position:absolute;left:-9999px}
    input[type=email]{padding:16px 14px;font-size:17px;border:1px solid var(--rule);border-radius:6px;background:#fff;color:var(--ink)}
    input[type=email]:focus-visible{outline:3px solid var(--accent);outline-offset:1px}
    button.cta{padding:16px 22px;background:var(--accent);color:var(--accent-ink);border:0;border-radius:6px;font-size:17px;font-weight:700;cursor:pointer}
    button.cta:focus-visible{outline:3px solid var(--ink);outline-offset:3px}
    p.privacy{font-size:13px;color:var(--ink-soft);margin:0 0 18px}
    p.proof{font-size:14px;color:var(--ink-soft);border-top:1px solid var(--rule);padding-top:14px;margin:0}
    @media (prefers-reduced-motion: reduce){html{scroll-behavior:auto}}
  </style>
</head>
<body>
<main>
  <h1>{{HEADLINE_NERVE_STRIKE}}</h1>
  <p class="subhead">{{SUBHEAD_LAYER_2_PLUS_3}}</p>
  <ul class="bullets">
    <li>{{BULLET_KEYHOLE}}</li>
    <li>{{BULLET_SNAPSHOT}}</li>
    <li>{{BULLET_FLIP}}</li>
  </ul>
  <form action="{{FORM_ACTION_URL}}" method="post" novalidate>
    <label class="sr" for="email">Email address</label>
    <input id="email" type="email" name="email" placeholder="you@example.com" autocomplete="email" required aria-required="true">
    <button class="cta" type="submit" aria-label="{{CTA_ARIA}}">{{CTA_BUTTON_VISION_DOOR}}</button>
  </form>
  <p class="privacy">{{PRIVACY_LINE_NO_SPAM_REASSURANCE}}</p>
  <p class="proof">{{DRIVE_BY_PROOF_LINE}}</p>
</main>
</body>
</html>
```

## Output Template

```markdown
# Squeeze Page - {{TOPIC}}

**Promise:** {{ONE_LINE}}
**One person:** {{NAME}}, {{NERVE}}
**Temperature:** {{COOL/WARM}}
**Form posts to:** {{ENDPOINT}}
**Post-submit redirect:** {{URL}}

## Phase 0–8 (compressed)
- Why You: {{ANSWER}}
- Why Me: {{ANSWER}}
- Why This: {{ANSWER}}
- Why Now: {{ANSWER (often "free + curiosity")}}

## Final copy

- **Headline (L1):** "{{H1}}"
- **Subhead (L2+L3):** "{{SUBHEAD}}"
- **Bullet 1 (Keyhole):** "{{B1}}"
- **Bullet 2 (Snapshot):** "{{B2}}"
- **Bullet 3 (Flip):** "{{B3}}"
- **Button (Vision/Door):** "{{BUTTON}}"
- **Privacy line:** "{{PRIVACY}}"
- **Drive-By proof:** "{{PROOF}}"

## HTML reference
{{HTML_BLOCK}}

## Method coverage report
```
Method coverage report:
  Open:           partial - Layer 1 in headline, Layers 2-3 compressed into the subhead; Layer 4 (Fingerprint) lives across the asset chain, not on this page
  Three Locks:    partial - Want lock open via headline + bullets; Trust micro-loaded by 1 Drive-By line; Excuse not applicable (free opt-in pre-opens it)
  Proof:          partial - one Drive-By line only; full proof block is downstream
  Bullets:        partial - 3-5 max, Keyhole + Snapshot only (Flip and Scar omitted at this scale)
  Cascade Close:  partial - Door (the button) with Vision in the label; Stack / Math / Safety Net not applicable on a free opt-in
  Greased Chute:  full - vertical eye flow, headline → subhead → bullets → form, single viewport on mobile
  Voice Rules:    full - first person, contractions, no marketing-speak
  Temperature:    {{COOL / WARM}}

Required next step: Run /convert bullshit-filter on this draft before shipping.
The Filter is a SEPARATE pass - this skill cannot grade its own output.
```

## Notes / Cross-Skill Composition

- For Ice Cold traffic, route through `/convert bridge-page` *first*, then send to this squeeze. Direct Ice Cold → squeeze conversion rates collapse because the reader hasn't been decompressed enough to take even a low-friction action.
- The post-submit page should be the lead-magnet delivery page (`/convert lead-magnet-page`) or a thank-you page (`/convert thank-you-page`) with a secondary offer. Either way, the post-submit URL is part of the squeeze brief - never leave it as "default thank-you" because that's where downstream LTV is built.
- Avoid name-and-email forms unless personalization is absolutely required downstream. Single field beats two fields by 10–25% in most tests. If you must capture a name, ask for it in the welcome email instead - same data, lower opt-in friction.
- The button label is the most under-leveraged conversion lever on a squeeze page. "Send me the guide" beats "Submit" by an embarrassing margin. Make the label the **state** the reader wants ("Show me the system," "Reserve my seat") not the **action** of submitting a form.
- A privacy line that says "we hate spam too" reads as suspicious. The cliché itself raises doubt. Better: "One short email per week. Unsubscribe anytime." Specific beats generic.
- Mobile is where most squeeze pages die - the form sits below the fold on smaller phones. Test on a real device. The headline + subhead + bullets + form should all fit in the first viewport on a 375×667 screen, or you're losing 30%+ of mobile traffic before they even see the button.

## Failure modes to watch

A squeeze page can fail in exactly four ways. Walk this checklist before shipping:

1. **The promise is vague.** "Tips for growing your business" is not a promise - it's a category. *"The exact 6-email cold sequence that's pulled $1.4M for our agency clients"* is a promise. If the reader can't paraphrase the promise back in one sentence, the promise is too vague.
2. **The bullets are clever instead of specific.** Clever bullets that depend on wordplay underperform specific bullets that name a number, a page, or a person. Lead with the specific.
3. **The button label is generic.** "Sign up," "Submit," "Continue" - all dead. Replace with a Vision-flavored label that previews the post-opt-in state.
4. **The proof line is missing.** Even one Drive-By line under the form lifts conversion measurably on cold-to-cool traffic. Don't ship without it.

## Lineage

- Single-promise framing - Halbert direct-mail canon (Boron Letters, 1984).
- Headline mechanics - Caples (Tested Advertising Methods, 1932).
- Awareness-level fit (squeeze typically targets levels 2–3) - Schwartz (Breakthrough Advertising, 1966).
- The Method itself - Wayland-owned operating system.
