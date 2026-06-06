---
name: convert-vsl-page
slash_command: false
pack: business-conversion
family: page_builder
description: |
  Author the page that hosts a Video Sales Letter: video embed, headline + subhead above the player, buy-button reveal mechanics, supporting copy below the fold, and Method audit footer. Emits brief + paste-ready HTML/CSS.
  Use when the user has (or will record) a VSL and needs the page that delivers it to traffic.
  Not for the VSL script itself (see /convert vsl) and not for written long-form sales pages (see /convert sales-page).
triggers:
  - vsl page
  - vsl hosting page
  - vsl landing page
  - video sales letter page
  - page for my vsl
  - convert vsl-page
  - buy button reveal
negative_triggers:
  - write me a vsl script
  - audit my vsl page
  - just a sales page
tags: [conversion, copy, page, vsl, donahoe-method, html]
priority: 95
version: 1.0.0
author: Wayland Business Pack
license: MIT
metadata:
  wayland:
    related_skills: [convert, convert-vsl, convert-four-questions, convert-temperature, convert-open, convert-three-locks, convert-bullets, convert-proof, convert-close, convert-chute, convert-voice, convert-bullshit-filter, convert-checkout-page]
attribution:
  lineage: "The Donahoe Method (Wayland-owned operating system); references long-form direct-response VSL hosting conventions, Sugarman slippery slide for below-fold copy, Cialdini consistency principle for delayed CTA reveal"
---

# Convert VSL Page - The VSL Hosting Page

> *"The VSL does the selling. The page does three things: get them to press play, hold them while they watch, and put the door right where they expect it the moment they decide."*

This skill builds the page that wraps the video. The page applies a compressed Donahoe Method (the video carries most of it), with a deliberate buy-button reveal pattern that respects viewer trust.

## When to Use

Trigger phrases: `vsl page`, `vsl hosting page`, `page for my vsl`, `buy button reveal`, `/convert vsl-page <product>`.

Use when the VSL script exists (or will exist) and the user needs a page to deliver the video to traffic, with appropriate above-fold framing and below-fold reinforcement.

## When NOT to Use

- **Writing the VSL script** → `/convert vsl`.
- **Long-form written sales page (no video)** → `/convert sales-page`.
- **Webinar reg page (different intent - registering for a future event)** → `/convert webinar-reg`.
- **Checkout** → `/convert checkout-page`.
- **Auditing existing VSL page** → `/convert audit`.

## Inputs

Required:
1. **VSL video URL or embed code** - the video that lives on this page.
2. **Product / offer** - same brief as `convert-sales-page` requires.
3. **The one person + The Nerve** (One Person Rule).
4. **Reveal mechanic preference** - instant, time-delayed, or pixel-tracked. Default: time-delayed at the script's CTA timestamp (typically 13:00 for an 18-minute VSL).

Optional:
- **Existing VSL transcript** - for SEO + accessibility caption block.
- **Brand colors / logo.**
- **Below-fold proof assets** - testimonials, logo bar, screenshots.
- **`out_path`** - defaults via `build_report_path`.

## Workflow - All Eight Method Phases (compressed; the video carries most of the load)

### Phase 0 - Four Questions (call `convert-four-questions`)

The page's above-fold copy is a 1–2 sentence answer to **Why You** and **Why Me**. The video answers **Why This** and **Why Now**.

### Phase 1 - Temperature (call `convert-temperature`)

Page chrome scales with temperature:
- **Ice Cold/Cool** → page should look editorial, not commercial. No buy button visible until reveal. Headline + subhead sets up the video - does not pre-sell.
- **Warm** → headline can hint at the offer.
- **Hot/Boiling** → reveal can be immediate; visible CTA stack below the video from second one.

### Phase 2 - Four-Layer Open (call `convert-open`)

Above-the-player headline = compressed Layer 1 (Nerve Strike). Subhead = Layer 2 + Layer 3 in one line. Layer 4 (Fingerprint) lives in the video, not the page.

### Phase 3 - Three Locks Architecture (call `convert-three-locks`)

The page's Three Locks map:
- **Want** → headline + subhead + the play button itself.
- **Trust** → below-fold logo bar + testimonial block (only revealed alongside the buy button, OR placed below the fold for re-reassurance after the video ends).
- **Excuse** → below-fold guarantee block + FAQ.

### Phase 4 - Bullets (call `convert-bullets`)

Below-fold "what you'll learn in this video" bullet block (4–6 bullets, mixed types). Functions as second-chance hook for viewers who scroll past the player without pressing play.

### Phase 5 - Proof (call `convert-proof`)

Light proof above the video - a single Drive-By credential is enough ("...from the team that's helped 14,000 SMBs ship paid traffic since 2014"). Heavy proof below the fold + after CTA reveal.

### Phase 6 - Cascade Close (call `convert-close`)

The CTA stack below the video is the Cascade Close written down:
- Stack (one paragraph)
- Vision (one paragraph)
- Math (one paragraph)
- Safety Net (guarantee block)
- Door (the button)

Plus P.S. and P.P.S. below.

### Phase 7 - Greased Chute (call `convert-chute`)

Page-level chute = vertical momentum. Once the viewer scrolls past the video, the below-fold copy must read fast and tight. No walls of text. Open loops at section breaks.

### Phase 8 - Voice + Bullshit Filter (call `convert-voice` + `convert-bullshit-filter`)

The page voice must match the video's. Mismatched voice between page and presenter is one of the most damaging trust leaks.

## The Buy-Button Reveal Mechanic

Three options, in order of trust impact:

1. **Time-delayed reveal (default).** Button hidden until [t = video script's CTA timestamp]. JavaScript timer or video player event. The viewer who watches to the natural CTA moment finds the button right there.
2. **Pixel-tracked reveal.** Button hidden until video player reports playback reached `[t]`. Best fidelity. Requires player API access.
3. **Instant reveal.** Button visible from page load. Use only for Hot/Boiling traffic - visible CTA on cold-traffic VSL pages reads as desperate.

The reveal is announced in the script ("...click the button below this video right now..."). Page and script must be timed together.

## Section Architecture

| # | Section | Above/below fold | Method primitive |
|---|---------|------------------|------------------|
| 1 | Headline + subhead | Above | Open Layer 1+2 |
| 2 | Video player | Above (hero) | The full Method, in video form |
| 3 | Light proof line under the player | Above | Drive-By |
| 4 | (Reveal-controlled) CTA stack | Below player at reveal | Cascade Close |
| 5 | Bullet block - "what's covered" | Below fold | convert-bullets |
| 6 | Trust/proof block | Below fold | convert-proof |
| 7 | Guarantee block | Below fold | Safety Net |
| 8 | FAQ | Below fold | Lock 3 |
| 9 | P.S. + P.P.S. | Below fold | Cascade reclose |

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
  <meta property="og:type" content="video.other">
  <meta property="og:image" content="{{OG_IMAGE_URL}}">
  <style>
    :root {
      --ink:#0e1116; --ink-soft:#3a3f47; --paper:#fbfaf6;
      --accent:#c0392b; --accent-ink:#fff; --rule:#e6e2d8; --max:760px;
    }
    *,*::before,*::after{box-sizing:border-box}
    body{margin:0;font:18px/1.6 -apple-system,BlinkMacSystemFont,"Helvetica Neue",Arial,sans-serif;color:var(--ink);background:var(--paper)}
    main{max-width:var(--max);margin:0 auto;padding:24px 20px 96px}
    h1{font-size:clamp(26px,5vw,40px);line-height:1.18;margin:8px 0 12px}
    h2{font-size:clamp(20px,3.8vw,26px);margin:48px 0 12px}
    p.subhead{font-size:20px;color:var(--ink-soft);margin:0 0 20px}
    .player{position:relative;width:100%;aspect-ratio:16/9;background:#000;border-radius:8px;overflow:hidden;margin:8px 0 16px}
    .player iframe{position:absolute;inset:0;width:100%;height:100%;border:0}
    .drive-by{font-size:14px;color:var(--ink-soft);margin:0 0 24px}
    .cta-wrap{display:none;margin:24px 0;padding:24px;background:#fff;border:1px solid var(--rule);border-radius:8px}
    .cta-wrap.revealed{display:block}
    .cta{display:inline-block;padding:18px 28px;background:var(--accent);color:var(--accent-ink);text-decoration:none;font-weight:700;font-size:18px;border-radius:6px;border:0;cursor:pointer}
    .cta:focus-visible{outline:3px solid var(--ink);outline-offset:3px}
    ul.bullets{list-style:none;padding:0}
    ul.bullets li{padding:10px 0 10px 28px;position:relative;border-bottom:1px solid var(--rule)}
    ul.bullets li::before{content:"";position:absolute;left:6px;top:18px;width:10px;height:10px;background:var(--accent);border-radius:2px}
    /* Default: Conversational Proof - never announces itself (Method Framework 2) */
    figure.proof{margin:1.2em 0;padding-left:1.5em;border-left:2px solid currentColor;font-style:italic;opacity:.92}
    figure.proof blockquote, figure.proof p{margin:0;border:0;padding:0}
    figure.proof figcaption{display:inline;font-size:.9em;font-style:normal;margin-left:.5em;opacity:.7;color:var(--ink-soft)}
    /* Opt-in: blocked framing - Hot/Boiling audiences only */
    figure.proof.block{margin:1.5em 0;padding:1em 1.2em;background:rgba(0,0,0,.04);border-left:4px solid var(--accent);border-radius:4px;font-style:normal;opacity:1}
    figure.proof.block blockquote{margin:0 0 .5em 0}
    figure.proof.block figcaption{display:block;opacity:.75;font-size:.85em;margin-top:.4em;margin-left:0}
    details{border-bottom:1px solid var(--rule);padding:12px 0}
    details summary{cursor:pointer;font-weight:600}
    .ps{border-top:2px solid var(--rule);padding-top:24px;margin-top:48px;font-style:italic;color:var(--ink-soft)}
    @media (prefers-reduced-motion: reduce){html{scroll-behavior:auto}}
  </style>
</head>
<body>
<main>
  <header>
    <h1>{{HEADLINE_NERVE_STRIKE}}</h1>
    <p class="subhead">{{SUBHEAD_LAYER_2_PLUS_3}}</p>
    <div class="player">
      <iframe src="{{VSL_EMBED_URL}}" title="{{VSL_TITLE}}" loading="lazy" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>
    </div>
    <p class="drive-by">{{DRIVE_BY_CREDENTIAL_LINE}}</p>
  </header>

  <!-- CTA stack revealed at script timestamp -->
  <section id="cta" class="cta-wrap" aria-live="polite">
    <h2>{{CLOSE_HEADER}}</h2>
    <p>{{STACK_PARAGRAPH}}</p>
    <p>{{VISION_PARAGRAPH}}</p>
    <p>{{MATH_PARAGRAPH}}</p>
    <p><a class="cta" href="{{CHECKOUT_URL}}" aria-label="{{CTA_ARIA}}">{{CTA_PRIMARY}}</a></p>
    <p>{{DOOR_INSTRUCTION}}</p>
  </section>

  <section><h2>{{BULLET_HEADER}}</h2>
    <ul class="bullets">
      <li>{{BULLET_KEYHOLE_1}}</li>
      <li>{{BULLET_FLIP_1}}</li>
      <li>{{BULLET_SNAPSHOT_1}}</li>
      <li>{{BULLET_SCAR_1}}</li>
      <li>{{BULLET_5}}</li>
      <li>{{BULLET_6}}</li>
    </ul>
  </section>

  <section><h2>{{TRUST_HEADER}}</h2>
    <figure class="proof"><blockquote>{{ANECDOTE_OR_RECEIPT_1}}</blockquote><figcaption>{{NAMECHECK_1}}</figcaption></figure>
    <figure class="proof"><blockquote>{{ANECDOTE_OR_RECEIPT_2}}</blockquote><figcaption>{{NAMECHECK_2}}</figcaption></figure>
  </section>

  <section><h2>{{GUARANTEE_HEADER}}</h2><p>{{GUARANTEE_BODY}}</p></section>

  <section><h2>Questions you might be asking</h2>
    <details><summary>{{FAQ_Q1}}</summary><p>{{FAQ_A1}}</p></details>
    <details><summary>{{FAQ_Q2}}</summary><p>{{FAQ_A2}}</p></details>
    <details><summary>{{FAQ_Q3}}</summary><p>{{FAQ_A3}}</p></details>
  </section>

  <aside class="ps">
    <p><strong>P.S.</strong> {{PS_RECLOSE}}</p>
    <p><strong>P.P.S.</strong> {{PPS_GUARANTEE_RESTATE}}</p>
  </aside>
</main>

<script>
  // Default reveal mechanic: time-delayed at {{REVEAL_SECONDS}}.
  (function(){
    var ms = {{REVEAL_SECONDS}} * 1000;
    setTimeout(function(){
      var c = document.getElementById('cta');
      if (c) c.classList.add('revealed');
    }, ms);
  })();
</script>
</body>
</html>
```

Notes for the writer:
- The CTA reveal uses a setTimeout fallback. For pixel-precise reveal, replace with the video player's `timeupdate` API hook (Wistia, Vimeo, YouTube IFrame API, or Bunny all expose one).
- Keep the `<header>` minimal. The video does the work.
- The `aria-live="polite"` on the CTA wrap announces to screen readers when the button appears.
- Lazy-load the iframe; the page should be lightweight enough that the video itself is the slowest thing.

## Output Template

```markdown
# VSL Page - {{PRODUCT}}

**One person:** {{NAME}}, {{SITUATION}}
**The Nerve:** {{NERVE}}
**Temperature:** {{LEVEL}}
**Reveal mechanic:** {{TIME_DELAYED|PIXEL_TRACKED|INSTANT}} at {{TIMESTAMP}}
**Offer:** {{PRICE}} / {{COMPONENTS}} / {{GUARANTEE}}

## Phase 0 - Four Questions
- Why You / Why Me / Why This / Why Now → answers (Why This + Why Now mostly carried by the video)

## Phase 2 - Above-fold copy
- **Headline (Nerve Strike):** "{{H1}}"
- **Subhead (Layers 2–3):** "{{SUBHEAD}}"
- **Drive-By line under player:** "{{DRIVE_BY}}"

## Phase 3–7 - Below-fold copy
- Bullet block: {{4–6 bullets, typed}}
- Trust block: {{2 proof figures}}
- Guarantee block: {{full guarantee text}}
- FAQ: {{3 Q/A pairs}}
- P.S. / P.P.S.: {{recloses}}

## HTML reference
{{HTML_BLOCK}}

## Method coverage report
```
Method coverage report:
  Open:           partial - Layer 1 in headline, Layers 2-3 in subhead, Layer 4 lives inside the video; the page itself compresses the open
  Three Locks:    full - Want above the fold + in bullets, Trust in proof block, Excuse via guarantee + FAQ
  Proof:          full - Drive-By above the fold, heavier proof block below
  Bullets:        full - mixed types (Keyhole / Flip / Snapshot / Scar)
  Cascade Close:  full - Stack / Vision / Math / Safety Net / Door + P.S. + P.P.S. in spec order
  Greased Chute:  full - short paragraphs, open loops at section breaks, video reveal mechanic supports momentum
  Voice Rules:    full - first person, no marketing-speak; matches the VSL script voice
  Temperature:    {{COOL / WARM / HOT}}

Required next step: Run /convert bullshit-filter on this draft before shipping.
The Filter is a SEPARATE pass - this skill cannot grade its own output.
```

## Notes / Cross-Skill Composition

- This skill expects the VSL script to exist or be commissioned in the same conversation. If it doesn't, call `/convert vsl` first.
- For very cold traffic, consider routing through `/convert bridge-page` first to pre-warm before sending traffic to the VSL page.
- For paid-ads traffic, ensure the ad's promise matches the page headline and the video's open. Mismatch = bounce.
- Do not place a "Skip the video" link on cold-traffic pages. It signals you don't trust your own video.

## Lineage

- VSL hosting page conventions - long-form direct-response TV-to-web conversion canon.
- Slippery-slide below-fold pacing - Sugarman (The AdWeek Copywriting Handbook, 1998).
- Delayed-CTA / consistency-and-commitment psychology - Cialdini (Influence, 1984).
- The Method itself - Wayland-owned operating system.
