---
name: convert-oto-page
slash_command: false
pack: business-conversion
family: page_builder
description: |
  Author One-Time Offer pages: post-purchase upgrade with single accept/decline decision, urgency framing, and tight Method-applied copy. Emits brief + paste-ready HTML/CSS with one-click yes/no markup.
  Use when the user has a flagship product purchased and needs an immediate post-checkout upgrade page.
  Not for cross-sells (see /convert cross-sell-page) or downsells (see /convert downsell-page) and not for cold-traffic sales pages.
triggers:
  - oto page
  - one-time offer page
  - upsell page
  - post-purchase upgrade
  - convert oto
  - immediate upsell
negative_triggers:
  - downsell page
  - cross-sell page
  - sales page
  - audit my oto
  - thank you page
tags: [conversion, copy, page, oto, donahoe-method, html]
priority: 90
version: 1.0.0
author: Wayland Business Pack
license: MIT
metadata:
  wayland:
    related_skills: [convert, convert-downsell-page, convert-cross-sell-page, convert-four-questions, convert-open, convert-three-locks, convert-bullets, convert-proof, convert-close, convert-chute, convert-voice, convert-bullshit-filter, convert-checkout-page]
attribution:
  lineage: "The Donahoe Method (Wayland-owned operating system); references post-purchase upgrade canon (long-form direct-response one-shot pages), Cialdini commitment-and-consistency, Hormozi-style stack framing in conversational mode"
---

# Convert OTO Page - One-Time Offer

> *"They just bought. The buying brain is open. You have one shot to offer them something that genuinely makes the first thing better. If you waste this moment with a bait-and-switch, the refund email arrives by Tuesday."*

This skill builds the post-checkout One-Time Offer page - Method-applied, conversion-tight, ethically framed.

## When to Use

Trigger phrases: `oto page`, `one-time offer page`, `upsell page`, `post-purchase upgrade`, `/convert oto <product>`.

Use when:
- The user just purchased a flagship offer.
- An additional product or upgrade exists that genuinely complements what they bought.
- The user wants to convert this moment without breaking trust.

## When NOT to Use

- **OTO recovery (the page they see if they decline)** → `/convert downsell-page`.
- **Different-product upsell (later in the customer relationship)** → `/convert cross-sell-page`.
- **Pre-purchase sales page** → `/convert sales-page`.
- **Auditing existing OTO** → `/convert audit`.

## Inputs

Required:
1. **The flagship product** - what they just bought (you have to reference it specifically).
2. **The OTO product** - what's on this page. Must genuinely complement.
3. **Price + scarcity** - *real* one-time pricing. If they can find it elsewhere at the same price, the urgency is fake and the page fails.
4. **One person + Nerve** - same as flagship's brief.
5. **Accept URL** (one-click upgrade if billing supports it) and **Decline URL** (next step in the funnel).

Optional:
- **Existing flagship sales page** - for voice continuity.
- **`out_path`** - defaults via `build_report_path`.

## Workflow - All Eight Method Phases (post-purchase compressed)

The buyer is warm-to-hot. Trust is mostly already established. The page is short - 400–800 words. The Excuse lock does most of the work.

### Phase 0 - Four Questions

Reframed for post-purchase:
- **Why You?** - Why does the OTO matter for the *specific* purchase they just made?
- **Why Me?** - Already mostly answered. Light Drive-By only.
- **Why This?** - What does the OTO add that the flagship can't, and why is it the right next step?
- **Why Now?** - *Real* one-time-only reason. Bundling logistics, capacity, pricing transition. Never fake.

### Phase 1 - Temperature

Post-purchase = **Boiling-adjacent**. They already trusted you with their money. Page length 400–800 words. Direct, not pitchy.

### Phase 2 - Four-Layer Open (call `convert-open`)

Compressed:
- Layer 1 = a specific *thank-you-and-pivot* line that names the purchase.
- Layer 2 = the side-door pivot to the OTO.
- Layer 3 = light Skin in the Game (often "the question I always get next is...").
- Layer 4 = your Fingerprint as a one-line aside.

### Phase 3 - Three Locks

- **Want** = the upgrade itself, framed as completion of the flagship.
- **Trust** = mostly inherited. One micro-proof line.
- **Excuse** = the bulk of the page. Math: "what they save in time / mistakes / dollars."

### Phase 4 - Bullets

5–7 bullets. Mostly Snapshot + Keyhole. The Flip is risky here (don't undermine the flagship they just bought).

### Phase 5 - Proof

One Anecdote ("after I added this to the program, the average customer's results jumped from X to Y..."). One Drive-By. Done.

### Phase 6 - Cascade Close

- Stack - what's added, conversationally.
- Vision - paint where the OTO takes them beyond the flagship's outcome.
- Math - the numbers (time saved, results lifted, dollar comparison).
- Safety Net - usually inherits the flagship's guarantee, plus a no-questions cancel option.
- Door - the Yes button.

Plus a **No, thanks** decline link (small, plain text, below the button - not styled as a button).

### Phase 7 - Greased Chute

Short paragraphs. Open loop into the price reveal. Decline link should not be the visual anchor.

### Phase 8 - Voice + Bullshit Filter

The biggest filter test for OTO copy: *"Is this offer real, or am I manufacturing a moment to extract more money?"* If the answer isn't "this genuinely makes their first thing better," kill the OTO. Trust matters more than the marginal AOV.

## Section Architecture

| # | Section | Purpose |
|---|---------|---------|
| 1 | Receipt-of-purchase confirmation | Anchor what they just bought |
| 2 | Compressed Open (3–4 sentences) | Pivot to the OTO |
| 3 | The promise (one paragraph) | Want lock |
| 4 | 5–7 bullets | Make the upgrade tangible |
| 5 | One proof beat | Trust lock |
| 6 | Stack + price + math (Excuse lock) | Cascade Close core |
| 7 | Yes button + plain No-thanks link | Door + decline path |
| 8 | One-line P.S. (optional) | Reclose if room |

## HTML/CSS Reference Implementation

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Add this before you go - {{BRAND}}</title>
  <meta name="description" content="{{META_DESCRIPTION}}">
  <meta property="og:title" content="{{HEADLINE}}">
  <meta property="og:description" content="{{META_DESCRIPTION}}">
  <meta property="og:type" content="website">
  <style>
    :root{--ink:#0e1116;--ink-soft:#3a3f47;--paper:#fbfaf6;--accent:#1f7a3a;--accent-ink:#fff;--rule:#e6e2d8;--max:680px}
    *,*::before,*::after{box-sizing:border-box}
    body{margin:0;font:18px/1.55 -apple-system,BlinkMacSystemFont,"Helvetica Neue",Arial,sans-serif;color:var(--ink);background:var(--paper)}
    main{max-width:var(--max);margin:0 auto;padding:24px 20px 80px}
    .receipt{background:#fff;border:1px solid var(--rule);padding:14px 16px;border-radius:6px;font-size:14px;color:var(--ink-soft);margin:0 0 24px}
    h1{font-size:clamp(24px,4.5vw,34px);line-height:1.18;margin:0 0 14px}
    h2{font-size:22px;margin:32px 0 12px}
    p{margin:0 0 16px}
    ul.bullets{list-style:none;padding:0;margin:0 0 24px}
    ul.bullets li{padding:8px 0 8px 26px;position:relative;border-bottom:1px solid var(--rule)}
    ul.bullets li::before{content:"";position:absolute;left:6px;top:16px;width:8px;height:8px;background:var(--accent);border-radius:50%}
    .stack{background:#fff;border:1px solid var(--rule);padding:20px;border-radius:8px;margin:0 0 24px}
    /* OTO pages serve Hot/Boiling traffic post-purchase - blocked framing is appropriate default here. */
    /* Conversational variant kept for OTOs aimed at Warm post-purchase buyers (e.g., low-emotion-tempo SaaS). */
    figure.proof{margin:1.5em 0;padding:1em 1.2em;background:rgba(0,0,0,.04);border-left:4px solid var(--accent);border-radius:4px}
    figure.proof blockquote{margin:0 0 .5em 0}
    figure.proof figcaption{display:block;opacity:.75;font-size:.85em;margin-top:.4em;color:var(--ink-soft)}
    /* Opt-in: Conversational Proof for cooler-temperature OTOs (Method Framework 2 default everywhere else) */
    figure.proof.conversational{margin:1.2em 0;padding:0 0 0 1.5em;background:transparent;border-left:2px solid currentColor;border-radius:0;font-style:italic;opacity:.92}
    figure.proof.conversational blockquote{margin:0;border:0;padding:0}
    figure.proof.conversational figcaption{display:inline;font-size:.9em;font-style:normal;margin-left:.5em;margin-top:0}
    .cta{display:inline-block;padding:18px 26px;background:var(--accent);color:var(--accent-ink);text-decoration:none;font-weight:700;font-size:18px;border-radius:6px;border:0;cursor:pointer}
    .cta:focus-visible{outline:3px solid var(--ink);outline-offset:3px}
    .decline{display:inline-block;margin-top:14px;color:var(--ink-soft);font-size:14px;text-decoration:underline}
    .ps{border-top:2px solid var(--rule);padding-top:18px;margin-top:32px;font-style:italic;color:var(--ink-soft)}
    @media (prefers-reduced-motion: reduce){html{scroll-behavior:auto}}
  </style>
</head>
<body>
<main>
  <p class="receipt" role="status">{{ORDER_CONFIRMATION_LINE_REFERENCING_FLAGSHIP_PURCHASE}}</p>

  <h1>{{HEADLINE_PIVOT}}</h1>
  <p>{{COMPRESSED_OPEN_PARAGRAPH}}</p>

  <h2>{{PROMISE_HEADER}}</h2>
  <p>{{WANT_PARAGRAPH}}</p>

  <ul class="bullets">
    <li>{{BULLET_SNAPSHOT_1}}</li>
    <li>{{BULLET_KEYHOLE_1}}</li>
    <li>{{BULLET_SNAPSHOT_2}}</li>
    <li>{{BULLET_KEYHOLE_2}}</li>
    <li>{{BULLET_5}}</li>
  </ul>

  <figure class="proof"><blockquote>{{ANECDOTE_OR_RECEIPT}}</blockquote><figcaption>{{NAMECHECK}}</figcaption></figure>

  <div class="stack">
    <h2>{{STACK_HEADER}}</h2>
    <p>{{STACK_PARAGRAPH_CONVERSATIONAL}}</p>
    <p><strong>{{PRICE_LINE_WITH_REAL_REASON_FOR_ONE_TIME}}</strong></p>
    <p>{{MATH_JUSTIFICATION_PARAGRAPH}}</p>
    <p>{{INHERITED_OR_EXTENDED_GUARANTEE_LINE}}</p>
    <p>
      <a class="cta" href="{{ACCEPT_URL}}" aria-label="{{CTA_ARIA}}">{{CTA_YES_VISION_DOOR}}</a>
    </p>
    <p><a class="decline" href="{{DECLINE_URL}}">{{NO_THANKS_LINK_TEXT}}</a></p>
  </div>

  <aside class="ps">
    <p><strong>P.S.</strong> {{ONE_LINE_RECLOSE}}</p>
  </aside>
</main>
</body>
</html>
```

CSS notes:
- The accent is intentionally **green** here (the buying-brain "yes" color) - distinct from the flagship sales page red. This is small but matters: the OTO should feel like a confirmation, not a second pitch.
- The "No thanks" link is plain text. If you button-style it, you raise its visual weight to match the Yes button - and conversion drops.
- The order-confirmation line uses `role="status"` so screen readers announce it as a confirmation, not as a heading.

## Output Template

```markdown
# OTO Page - {{OTO_PRODUCT}}

**Flagship just purchased:** {{FLAGSHIP}}
**OTO offered here:** {{OTO_PRODUCT}}
**Real "Why Now":** {{REAL_REASON}}
**Price:** {{ONE_TIME_PRICE}} (vs. retail {{RETAIL_PRICE}} = {{SAVINGS}})

## Phase 0–8 (compressed)
- Why You / Me / This / Now → answers
- Open layers → 3–4 sentences
- Bullets → 5–7 (Sn-heavy)
- Proof → 1 Anecdote + 1 Drive-By
- Cascade Close → Stack + Math + Safety Net + Door + plain decline link
- Voice Rules applied; Bullshit Filter is a separate downstream pass

## Final copy
- Receipt line: "{{LINE}}"
- Headline pivot: "{{H1}}"
- Open paragraph: "{{P}}"
- Promise: "{{P}}"
- Bullets: {{LIST}}
- Proof: "{{P}}"
- Stack: "{{P}}"
- Price line: "{{P}}"
- Math: "{{P}}"
- Guarantee: "{{P}}"
- Yes button: "{{LABEL}}"
- No-thanks: "{{LABEL}}"
- P.S.: "{{P}}"

## HTML reference
{{HTML_BLOCK}}

## Method coverage report
```
Method coverage report:
  Open:           partial - compressed Open with pivot from purchase; Layers 1-3 in 3-4 sentences, Layer 4 inherited from flagship voice
  Three Locks:    full - Want (the new outcome), Trust (inherited from flagship + 1 proof), Excuse (the math reframe)
  Proof:          partial - 1 Anecdote + 1 Drive-By; heavier proof inherited from flagship purchase decision
  Bullets:        full - 5-7 bullets, Snapshot / Keyhole mix
  Cascade Close:  partial - Stack / Math / Safety Net / Door + plain decline link + P.S.; Vision and P.P.S. compressed because the buyer is post-purchase
  Greased Chute:  full - short paragraphs, decline visually subordinate, single-page eye flow
  Voice Rules:    full - first person, contractions, no marketing-speak; voice continuous with flagship
  Temperature:    Hot (post-purchase, attention window open)

Ethics: OTO genuinely complements flagship (not bait-and-switch)

Required next step: Run /convert bullshit-filter on this draft before shipping.
The Filter is a SEPARATE pass - this skill cannot grade its own output.
```

## Notes / Cross-Skill Composition

- The OTO must reference the flagship by name in the receipt line. Generic OTO copy that ignores what they just bought reads like a separate funnel - and trust drops.
- If this OTO is declined, the next page should be `/convert downsell-page` (reduced-commitment OTO recovery) OR the standard thank-you page (`/convert thank-you-page`). Pick one in the funnel architecture.
- Avoid stacking more than two OTOs. After the second decline, route to the thank-you page.
- The "No, thanks" link must work. Broken decline links are one of the most common funnel-credibility leaks.

## Lineage

- Post-purchase upgrade canon - long-form direct-response one-shot offer pattern.
- Commitment-and-consistency psychology (the foot-in-the-door mechanism that makes OTO conversion possible) - Cialdini (Influence, 1984).
- Conversational stack framing - Wayland-style adaptation of value-equation logic, expressed in plain prose.
- The Method itself - Wayland-owned operating system.
