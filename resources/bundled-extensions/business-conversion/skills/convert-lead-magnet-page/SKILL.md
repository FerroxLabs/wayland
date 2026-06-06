---
name: convert-lead-magnet-page
slash_command: false
pack: business-conversion
family: page_builder
description: |
  Author lead-magnet (free → email) opt-in pages: longer than a squeeze, full Method-compressed argument for why the freebie is worth the email. Emits brief + paste-ready HTML/CSS.
  Use when the user has a substantive free asset (guide, training, swipe file, audit, calculator) and needs a page that converts cold-to-cool traffic into email subscribers.
  Not for super-short single-promise opt-ins (see /convert squeeze-page) or post-opt-in delivery pages (often fold into /convert thank-you-page).
triggers:
  - lead magnet page
  - free guide page
  - free training page
  - free download page
  - opt-in landing page
  - convert lead-magnet-page
  - free resource page
negative_triggers:
  - squeeze page
  - sales page
  - audit my lead magnet page
  - thank you page
tags: [conversion, copy, page, lead-magnet, donahoe-method, html]
priority: 90
version: 1.0.0
author: Wayland Business Pack
license: MIT
metadata:
  wayland:
    related_skills: [convert, convert-squeeze-page, convert-thank-you-page, convert-four-questions, convert-temperature, convert-open, convert-three-locks, convert-bullets, convert-proof, convert-close, convert-chute, convert-voice, convert-bullshit-filter]
attribution:
  lineage: "The Donahoe Method (Wayland-owned operating system); references long-form lead-magnet opt-in canon, Schwartz awareness levels, Caples headline formulas, Cialdini reciprocity"
---

# Convert Lead-Magnet Page - Free → Email Opt-In

> *"A lead magnet page is a sales page where the price is the email. Same Method, same locks, same close - but the currency is permission instead of money."*

This skill builds the page that converts visitors into email subscribers in exchange for a substantive free asset. Longer than a squeeze, shorter than a sales page - the full Method, scaled for a lower-friction yes.

## When to Use

Trigger phrases: `lead magnet page`, `free guide page`, `free training page`, `opt-in landing page`, `/convert lead-magnet-page <topic>`.

Use when:
- The user has a *substantive* free asset (15–60 minute training, 20+ page guide, full swipe file, calculator/tool, mini-audit).
- Cold-to-cool traffic needs more persuasion than a squeeze provides.
- The lead magnet is the front of a longer email-driven funnel.

## When NOT to Use

- **Super-short single-promise opt-in** → `/convert squeeze-page` (60–120 words).
- **Pre-sell content for cold traffic** → `/convert bridge-page`.
- **Post-opt-in delivery + secondary offer** → `/convert thank-you-page`.
- **Webinar registration** → `/convert webinar-reg-page`.

## Inputs

Required:
1. **The lead magnet** - what's being given away. Format, length, deliverable.
2. **The promise** - the specific outcome the lead magnet delivers (not "tips" - *"the exact 6-email cold sequence that's pulled $1.4M for our agency clients"*).
3. **One person + Nerve** (One Person Rule).
4. **Form destination + post-opt-in URL.**

Optional:
- **Brand colors / logo + lead-magnet cover image.**
- **One full proof beat** - Anecdote + Receipt.
- **Backend offer hint** - what the email sequence eventually pitches (informs what kind of lead the magnet should attract).
- **`out_path`** - defaults via `build_report_path`.

## Workflow - All Eight Method Phases

### Phase 0 - Four Questions

- **Why You?** - Why this person, today, needs *this* lead magnet.
- **Why Me?** - Drive-By credibility, one beat.
- **Why This?** - Why this lead magnet vs. the dozen other free guides on the same topic.
- **Why Now?** - Often "free + curiosity" + one real-time reason ("course launches Tuesday - this prepares you").

### Phase 1 - Temperature

Lead-magnet pages typically run **Cool to Warm**. Page length 400–900 words. For Ice Cold traffic, place a `/convert bridge-page` upstream.

### Phase 2 - Four-Layer Open (call `convert-open`)

Full Open, but condensed:
- Layer 1 = Nerve Strike headline (the pain the magnet addresses).
- Layer 2 = Side Door subhead/opening paragraph.
- Layer 3 = Skin in the Game in 1–2 sentences.
- Layer 4 = Fingerprint as a one-line aside or distinctive opening phrase.

### Phase 3 - Three Locks

- **Want** = the outcome the magnet delivers.
- **Trust** = one Anecdote + one Drive-By. Lighter than a sales page; the price is just an email.
- **Excuse** = built in (free), but reinforce: "no upsell on the next page" or "no credit card" - whatever's true.

### Phase 4 - Bullets (call `convert-bullets`)

5–8 bullets. Mostly Keyhole + Snapshot ("Inside, you'll see..."). Each bullet sounds like a chapter or module title from the magnet itself.

### Phase 5 - Proof (call `convert-proof`)

One Anecdote (someone who got the magnet and used it) + one Drive-By. The page is too short for a heavy proof block.

### Phase 6 - Cascade Close (call `convert-close`)

Compressed cascade:
- Stack - what's in the magnet.
- Vision - paint the state after using it.
- Math - "free" + the implicit cost-of-not-knowing.
- Safety Net - "if it's not useful, unsubscribe in one click."
- Door - the form button.

### Phase 7 - Greased Chute (call `convert-chute`)

Lead-magnet pages often die in the middle. Section transitions must pull forward. The form should be visible above the fold *and* repeated near the bottom.

### Phase 8 - Voice + Bullshit Filter

Most common failure: the lead magnet over-promises and the page over-claims. Rein in claims to what the magnet actually delivers. Over-promise = unsubscribe by email #2.

## Section Architecture

| # | Section | Purpose |
|---|---------|---------|
| 1 | Headline (Nerve Strike) | Open Layer 1 |
| 2 | Subhead + opening paragraph | Layers 2–3 |
| 3 | Top form + button | First-fold opt-in |
| 4 | What's inside (bullets, 5–8) | Want lock |
| 5 | One Anecdote + Drive-By proof | Trust lock |
| 6 | Mock-up / cover image | Visual anchor |
| 7 | Reassurance line | Excuse lock (no upsell, no credit card, etc.) |
| 8 | Bottom form + button (repeat) | Second close |
| 9 | One-line P.S. | Reclose |

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
    :root{--ink:#0e1116;--ink-soft:#3a3f47;--paper:#fbfaf6;--accent:#c0392b;--accent-ink:#fff;--rule:#e6e2d8;--max:680px}
    *,*::before,*::after{box-sizing:border-box}
    body{margin:0;font:18px/1.6 -apple-system,BlinkMacSystemFont,"Helvetica Neue",Arial,sans-serif;color:var(--ink);background:var(--paper)}
    main{max-width:var(--max);margin:0 auto;padding:24px 20px 64px}
    h1{font-size:clamp(28px,5vw,40px);line-height:1.18;margin:0 0 14px}
    h2{font-size:22px;margin:32px 0 12px}
    p{margin:0 0 16px}
    p.subhead{font-size:20px;color:var(--ink-soft);margin:0 0 20px}
    .form-card{background:#fff;border:1px solid var(--rule);padding:18px;border-radius:8px;margin:0 0 28px}
    form{display:grid;grid-template-columns:1fr;gap:10px}
    @media(min-width:480px){form{grid-template-columns:1fr auto}}
    label.sr{position:absolute;left:-9999px}
    input[type=email]{padding:14px;font-size:17px;border:1px solid var(--rule);border-radius:6px;background:#fff}
    input[type=email]:focus-visible{outline:3px solid var(--accent);outline-offset:1px}
    button.cta{padding:14px 22px;background:var(--accent);color:var(--accent-ink);border:0;border-radius:6px;font-size:17px;font-weight:700;cursor:pointer}
    button.cta:focus-visible{outline:3px solid var(--ink);outline-offset:3px}
    .mock{display:block;width:100%;max-width:240px;margin:18px 0;border-radius:6px;box-shadow:0 6px 24px rgba(0,0,0,.12)}
    ul.bullets{list-style:none;padding:0;margin:0 0 24px}
    ul.bullets li{padding:8px 0 8px 26px;position:relative;border-bottom:1px solid var(--rule)}
    ul.bullets li::before{content:"";position:absolute;left:6px;top:16px;width:8px;height:8px;background:var(--accent);border-radius:50%}
    /* Default: Conversational Proof - never announces itself (Method Framework 2) */
    figure.proof{margin:1.2em 0;padding-left:1.5em;border-left:2px solid currentColor;font-style:italic;opacity:.92}
    figure.proof blockquote, figure.proof p{margin:0;border:0;padding:0}
    figure.proof figcaption{display:inline;font-size:.9em;font-style:normal;margin-left:.5em;opacity:.7;color:var(--ink-soft)}
    /* Opt-in: blocked framing - Hot/Boiling audiences only */
    figure.proof.block{margin:1.5em 0;padding:1em 1.2em;background:rgba(0,0,0,.04);border-left:4px solid var(--accent);border-radius:4px;font-style:normal;opacity:1}
    figure.proof.block blockquote{margin:0 0 .5em 0}
    figure.proof.block figcaption{display:block;opacity:.75;font-size:.85em;margin-top:.4em;margin-left:0}
    .reassure{font-size:14px;color:var(--ink-soft);text-align:center}
    .ps{border-top:2px solid var(--rule);padding-top:18px;margin-top:32px;font-style:italic;color:var(--ink-soft)}
    @media (prefers-reduced-motion: reduce){html{scroll-behavior:auto}}
  </style>
</head>
<body>
<main>
  <h1>{{HEADLINE_NERVE_STRIKE}}</h1>
  <p class="subhead">{{SUBHEAD_LAYERS_2_3}}</p>

  <div class="form-card">
    <form action="{{FORM_ACTION_URL}}" method="post" novalidate>
      <label class="sr" for="email-top">Email address</label>
      <input id="email-top" type="email" name="email" placeholder="you@example.com" autocomplete="email" required aria-required="true">
      <button class="cta" type="submit" aria-label="{{CTA_ARIA}}">{{CTA_VISION_DOOR}}</button>
    </form>
    <p class="reassure">{{REASSURE_NO_UPSELL_NO_CC}}</p>
  </div>

  <img class="mock" src="{{LEAD_MAGNET_COVER_URL}}" alt="{{LEAD_MAGNET_TITLE_ALT}}" loading="lazy">

  <h2>{{INSIDE_HEADER}}</h2>
  <ul class="bullets">
    <li>{{BULLET_KEYHOLE_1}}</li>
    <li>{{BULLET_SNAPSHOT_1}}</li>
    <li>{{BULLET_KEYHOLE_2}}</li>
    <li>{{BULLET_SNAPSHOT_2}}</li>
    <li>{{BULLET_5}}</li>
    <li>{{BULLET_6}}</li>
  </ul>

  <figure class="proof"><blockquote>{{ANECDOTE}}</blockquote><figcaption>{{NAMECHECK}}</figcaption></figure>
  <p>{{DRIVE_BY_LINE}}</p>

  <div class="form-card">
    <h2>{{BOTTOM_FORM_HEADER}}</h2>
    <form action="{{FORM_ACTION_URL}}" method="post" novalidate>
      <label class="sr" for="email-bottom">Email address</label>
      <input id="email-bottom" type="email" name="email" placeholder="you@example.com" autocomplete="email" required aria-required="true">
      <button class="cta" type="submit" aria-label="{{CTA_ARIA}}">{{CTA_VISION_DOOR}}</button>
    </form>
    <p class="reassure">{{REASSURE_NO_UPSELL_NO_CC}}</p>
  </div>

  <aside class="ps">
    <p><strong>P.S.</strong> {{ONE_LINE_RECLOSE}}</p>
  </aside>
</main>
</body>
</html>
```

CSS notes:
- The cover image is a load-bearing visual anchor on lead-magnet pages - pages without one convert measurably worse on cold-to-cool traffic. Provide an actual mock, not a placeholder rectangle.
- Two forms: top + bottom. Same form action. The bottom form converts the readers who scrolled the bullets and the Anecdote.
- The reassurance line ("no spam, unsubscribe anytime") sits *under* both forms, not above. Above the form, it pre-introduces a doubt the reader didn't have.

## Output Template

```markdown
# Lead-Magnet Page - {{LEAD_MAGNET_TITLE}}

**Promise:** {{ONE_LINE}}
**Format:** {{PDF / VIDEO / TEMPLATE / etc.}} ({{LENGTH}})
**One person:** {{NAME}}, {{NERVE}}
**Temperature:** {{COOL/WARM}}
**Form posts to:** {{ENDPOINT}}
**Post-opt-in URL:** {{URL}}

## Phase 0–8
- Four Questions answers
- Open layers (compressed)
- Locks: Want / Trust / Excuse
- Bullets: 5–8 (Keyhole + Snapshot heavy)
- Proof: 1 Anecdote + 1 Drive-By
- Cascade Close: Stack/Vision/Math/Safety/Door + P.S.
- Voice Rules applied; Bullshit Filter is a separate downstream pass

## Final copy
- Headline: "{{H1}}"
- Subhead: "{{SUBHEAD}}"
- Bullets: {{LIST}}
- Anecdote: "{{P}}"
- Drive-By line: "{{LINE}}"
- Top button: "{{CTA}}"
- Bottom form header: "{{H2}}"
- Bottom button: "{{CTA}}"
- Reassurance line: "{{LINE}}"
- P.S.: "{{P}}"

## HTML reference
{{HTML_BLOCK}}

## Method coverage report
```
Method coverage report:
  Open:           full - all 4 layers (compressed); Fingerprint lives in voice across the page
  Three Locks:    partial - Want (the outcome) full; Trust (1 Anecdote + 1 Drive-By) light; Excuse (free + reassurance line) micro-loaded
  Proof:          partial - 1 Anecdote + 1 Drive-By; full proof block lives downstream on the paid offer page
  Bullets:        full - 5-8 bullets, Keyhole / Snapshot mix with specificity
  Cascade Close:  partial - Stack / Vision / Math / Safety Net / Door + P.S. compressed for a free opt-in (no P.P.S., math reframed as "no cost")
  Greased Chute:  full - short paragraphs, form repeated mid-page and bottom for second close
  Voice Rules:    full - first person, contractions, no marketing-speak
  Temperature:    {{COOL / WARM}}

Required next step: Run /convert bullshit-filter on this draft before shipping.
The Filter is a SEPARATE pass - this skill cannot grade its own output.
```

## Notes / Cross-Skill Composition

- For Ice Cold traffic, bridge through `/convert bridge-page` first.
- The post-opt-in URL should fold into `/convert thank-you-page` (delivery + secondary-offer stack) - that's the single biggest under-leveraged surface on most funnels.
- Lead-magnet quality is the conversion lever above all others. A weak magnet behind a great page underperforms a strong magnet behind a mediocre page.
- The match between lead-magnet topic and the eventual paid offer determines whether the email sequence converts. Mismatched magnet → list that won't buy.

## Lineage

- Lead-magnet opt-in canon - direct-response info-marketing.
- Headline mechanics - Caples (Tested Advertising Methods, 1932).
- Reciprocity (free value → permission to follow up) - Cialdini (Influence, 1984).
- Awareness-level fit (typically targets levels 2–3) - Schwartz (Breakthrough Advertising, 1966).
- The Method itself - Wayland-owned operating system.
