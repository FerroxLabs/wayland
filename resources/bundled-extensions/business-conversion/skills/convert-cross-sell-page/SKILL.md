---
name: convert-cross-sell-page
slash_command: false
pack: business-conversion
family: page_builder
description: |
  Author post-purchase cross-sell pages: lateral product offer to existing customer, with relevance framing and tight Method-applied copy. Emits brief + paste-ready HTML/CSS.
  Use when the user has a customer who completed a flagship purchase (and any OTO sequence) and a related product the customer would benefit from.
  Not for immediate post-checkout upsells (see /convert oto-page) or downsells (see /convert downsell-page) and not for pre-purchase cold-traffic pages.
triggers:
  - cross sell page
  - cross-sell page
  - post-purchase upsell
  - related product page
  - convert cross-sell
  - lateral offer
  - customer cross-sell
negative_triggers:
  - oto page
  - downsell page
  - sales page
  - audit my cross-sell
  - thank you page
tags: [conversion, copy, page, donahoe-method, html]
priority: 80
version: 1.0.0
author: Wayland Business Pack
license: MIT
metadata:
  wayland:
    related_skills: [convert, convert-oto-page, convert-downsell-page, convert-thank-you-page, convert-four-questions, convert-temperature, convert-open, convert-three-locks, convert-bullets, convert-proof, convert-close, convert-chute, convert-voice, convert-bullshit-filter]
attribution:
  lineage: "The Donahoe Method (Wayland-owned operating system); references customer-LTV cross-sell canon, Cialdini reciprocity, behavioral-economics complementary-product bundling"
---

# Convert Cross-Sell Page - Post-Purchase Lateral Offer

> *"The cross-sell isn't an upsell. The buyer's already mid-implementation on the first thing. The job here is to show them the *next* product they'll naturally need - not to extract more dollars while the wallet's open."*

This skill builds the post-purchase cross-sell page: a related, lateral offer to an existing customer who's already past the OTO/downsell sequence.

## When to Use

Trigger phrases: `cross sell page`, `post-purchase upsell`, `related product page`, `convert cross-sell`, `/convert cross-sell <product>`.

Use when:
- The customer has completed flagship + any immediate OTO/downsell sequence.
- A related (not duplicate, not upgrade) product genuinely fits their next step.
- The user wants to maximize LTV without breaking trust.

Cross-sells fire days-to-weeks after purchase, often from email - not seconds after checkout.

## When NOT to Use

- **Immediate post-checkout upgrade** → `/convert oto-page`.
- **OTO recovery** → `/convert downsell-page`.
- **Pre-purchase cold sales page** → `/convert sales-page`.
- **Thank-you page secondary stack** → `/convert thank-you-page`.
- **Auditing existing cross-sell** → `/convert audit`.

## Inputs

Required:
1. **What they already own** - the flagship + any OTO/downsell items purchased.
2. **The cross-sell product** - must be lateral (not the same thing they own at a higher tier).
3. **Implementation timing** - where the customer is in their journey (week 1? month 3? after the first result?). Cross-sell copy hinges on this.
4. **One person + Nerve, post-purchase version** - the new pain that emerged *because* of the first product's success. *"You implemented [flagship]. Now you've got [new problem the cross-sell solves]."*

Optional:
- **Voice continuity from the flagship + earlier funnel.**
- **Existing customer Snapshot proof.**
- **`out_path`** - defaults via `build_report_path`.

## Workflow - All Eight Method Phases

### Phase 0 - Four Questions

Reframed for cross-sell:
- **Why You?** - Why does this matter *now* that you've used [flagship]?
- **Why Me?** - Inherited fully.
- **Why This?** - How does the cross-sell sit alongside the flagship - what specific gap does it close?
- **Why Now?** - Real reason connected to where they are in implementation.

### Phase 1 - Temperature

**Hot.** They're a customer. Page length 600–1,200 words. Less direct-response, more relationship-pivot.

### Phase 2 - Four-Layer Open (call `convert-open`)

The Open is **anchored to their journey**:
- Layer 1 = a specific Nerve Strike about the new problem that emerged from the first product's success. *"By week three with [flagship], most people hit a different wall - and it's the kind of wall that makes the first thing feel like it stopped working."*
- Layer 2 = casual side-door pivot.
- Layer 3 = "I built [cross-sell] for exactly this stage" Skin in the Game.
- Layer 4 = Fingerprint as one-line aside.

### Phase 3 - Three Locks

- **Want** = the new desired state, *adjacent* to the flagship's promise.
- **Trust** = mostly inherited; one customer Snapshot ("here's how someone past [flagship] used [cross-sell]") seals it.
- **Excuse** = math comparing "buy now bundled" vs. "buy later separately."

### Phase 4 - Bullets

5–8 bullets. Snapshot-heavy (similar customers + their results). One Flip is OK ("you'd think [flagship] alone would do it - and you're not wrong, until...").

### Phase 5 - Proof

One Anecdote (named customer, post-flagship) + one Receipt (specific result they got with the combo). Heavy enough to matter, light enough to not turn into a second sales page.

### Phase 6 - Cascade Close

- Stack - what's added.
- Vision - paint the combined state.
- Math - bundled-vs-separate price.
- Safety Net - guarantee mechanic.
- Door - Yes button + plain decline link.

P.S. is appropriate here (the page has more room than an OTO).

### Phase 7 - Greased Chute

Section transitions should pull forward without manufactured urgency. The customer is already loyal - pretending otherwise breaks voice.

### Phase 8 - Voice + Bullshit Filter

The biggest filter test: *"Would I email this to a customer I genuinely care about?"* If the cross-sell doesn't fit the customer's stage, kill it. Sending the wrong cross-sell trains the buyer to ignore future emails.

## Section Architecture

| # | Section | Purpose |
|---|---------|---------|
| 1 | Anchored open referencing flagship | Open + journey acknowledgment |
| 2 | The new problem (one paragraph) | Want lock - the *new* state |
| 3 | The cross-sell - what it is | Mechanism |
| 4 | 5–8 bullets | convert-bullets, Snapshot-heavy |
| 5 | Customer Anecdote + Receipt | Trust lock |
| 6 | Stack + bundled-vs-separate math | Excuse lock |
| 7 | Cascade Close | Vision → Math → Safety Net → Door |
| 8 | P.S. (recloses on the journey-fit) | Reclose |

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
  <style>
    :root{--ink:#0e1116;--ink-soft:#3a3f47;--paper:#fbfaf6;--accent:#1f7a3a;--accent-ink:#fff;--rule:#e6e2d8;--max:680px}
    *,*::before,*::after{box-sizing:border-box}
    body{margin:0;font:18px/1.6 -apple-system,BlinkMacSystemFont,"Helvetica Neue",Arial,sans-serif;color:var(--ink);background:var(--paper)}
    main{max-width:var(--max);margin:0 auto;padding:24px 20px 80px}
    .anchor{font-size:14px;color:var(--ink-soft);background:#fff;border:1px solid var(--rule);padding:10px 14px;border-radius:6px;margin:0 0 24px}
    h1{font-size:clamp(24px,4.5vw,34px);line-height:1.2;margin:0 0 14px}
    h2{font-size:22px;margin:32px 0 12px}
    p{margin:0 0 16px}
    ul.bullets{list-style:none;padding:0;margin:0 0 24px}
    ul.bullets li{padding:8px 0 8px 26px;position:relative;border-bottom:1px solid var(--rule)}
    ul.bullets li::before{content:"";position:absolute;left:6px;top:16px;width:8px;height:8px;background:var(--accent);border-radius:50%}
    /* Cross-sell pages serve Hot/Boiling post-purchase traffic - blocked framing is appropriate default. */
    figure.proof{margin:1.5em 0;padding:1em 1.2em;background:rgba(0,0,0,.04);border-left:4px solid var(--accent);border-radius:4px}
    figure.proof blockquote{margin:0 0 .5em 0}
    figure.proof figcaption{display:block;opacity:.75;font-size:.85em;margin-top:.4em;color:var(--ink-soft)}
    /* Opt-in: Conversational Proof for cooler-temperature cross-sells (Method Framework 2 default elsewhere) */
    figure.proof.conversational{margin:1.2em 0;padding:0 0 0 1.5em;background:transparent;border-left:2px solid currentColor;border-radius:0;font-style:italic;opacity:.92}
    figure.proof.conversational blockquote{margin:0;border:0;padding:0}
    figure.proof.conversational figcaption{display:inline;font-size:.9em;font-style:normal;margin-left:.5em;margin-top:0}
    .stack{background:#fff;border:1px solid var(--rule);padding:20px;border-radius:8px;margin:0 0 24px}
    .cta{display:inline-block;padding:18px 26px;background:var(--accent);color:var(--accent-ink);text-decoration:none;font-weight:700;font-size:18px;border-radius:6px}
    .cta:focus-visible{outline:3px solid var(--ink);outline-offset:3px}
    .decline{display:inline-block;margin-top:14px;color:var(--ink-soft);font-size:14px;text-decoration:underline}
    .ps{border-top:2px solid var(--rule);padding-top:18px;margin-top:32px;font-style:italic;color:var(--ink-soft)}
    @media (prefers-reduced-motion: reduce){html{scroll-behavior:auto}}
  </style>
</head>
<body>
<main>
  <p class="anchor" role="status">{{ANCHOR_LINE_REFERENCING_FLAGSHIP_OWNERSHIP}}</p>

  <h1>{{HEADLINE_NEW_PROBLEM_NERVE_STRIKE}}</h1>
  <p>{{OPEN_PARAGRAPH_PIVOT_TO_CROSS_SELL}}</p>

  <h2>{{NEW_PROBLEM_HEADER}}</h2>
  <p>{{NEW_WANT_PARAGRAPH}}</p>

  <h2>{{CROSS_SELL_HEADER}}</h2>
  <p>{{MECHANISM_BECAUSE_PARAGRAPH}}</p>

  <ul class="bullets">
    <li>{{BULLET_SNAPSHOT_1}}</li>
    <li>{{BULLET_SNAPSHOT_2}}</li>
    <li>{{BULLET_KEYHOLE_1}}</li>
    <li>{{BULLET_FLIP_OPTIONAL}}</li>
    <li>{{BULLET_5}}</li>
    <li>{{BULLET_6}}</li>
  </ul>

  <figure class="proof"><blockquote>{{ANECDOTE_FROM_POST_FLAGSHIP_CUSTOMER}}</blockquote><figcaption>{{NAMECHECK}}</figcaption></figure>

  <div class="stack">
    <h2>{{STACK_HEADER}}</h2>
    <p>{{STACK_PARAGRAPH}}</p>
    <p><strong>{{BUNDLED_PRICE}}</strong> - {{BUNDLED_VS_SEPARATE_MATH}}</p>
    <p>{{GUARANTEE_LINE}}</p>
    <p>
      <a class="cta" href="{{ACCEPT_URL}}" aria-label="{{CTA_ARIA}}">{{CTA_YES_VISION}}</a>
    </p>
    <p><a class="decline" href="{{DECLINE_URL}}">{{NO_THANKS_LABEL}}</a></p>
  </div>

  <aside class="ps">
    <p><strong>P.S.</strong> {{RECLOSE_ON_JOURNEY_FIT}}</p>
  </aside>
</main>
</body>
</html>
```

CSS notes:
- The "anchor" line at the top references what the customer already owns. Without this anchor, the page reads as a generic sales pitch.
- Same green CTA as OTO/downsell - visual continuity within the customer-purchase color family.

## Output Template

```markdown
# Cross-Sell Page - {{CROSS_SELL_PRODUCT}}

**They already own:** {{FLAGSHIP_AND_ANY_OTOS}}
**Cross-sell:** {{CROSS_SELL_PRODUCT}}
**Their journey stage:** {{WEEK_3 / MONTH_2 / POST_FIRST_RESULT / etc.}}
**The new pain:** {{NEW_NERVE}}

## Phase 0–8
- Four Questions: post-purchase versions
- Open: anchored to flagship
- Locks: Want (new state) / Trust (inherited + 1 Snapshot) / Excuse (bundled math)
- Bullets: 5–8, Snapshot-heavy
- Close: Cascade + P.S.
- Voice Rules applied; Bullshit Filter is a separate downstream pass

## Final copy
- Anchor line: "{{LINE}}"
- Headline: "{{H1}}"
- Open paragraph: "{{P}}"
- New problem header + paragraph: "{{P}}"
- Cross-sell header + mechanism: "{{P}}"
- Bullets: {{LIST}}
- Customer Anecdote: "{{P}}"
- Stack: "{{P}}"
- Bundled math: "{{P}}"
- Guarantee: "{{P}}"
- Yes button: "{{LABEL}}"
- No-thanks: "{{LABEL}}"
- P.S.: "{{P}}"

## HTML reference
{{HTML_BLOCK}}

## Method coverage report
```
Method coverage report:
  Open:           full - all 4 layers anchored to flagship ownership; Layer 1 surfaces the new pain, Layer 4 lives in voice continuity
  Three Locks:    full - Want (new state), Trust (inherited from purchase + 1 Snapshot), Excuse (bundled math)
  Proof:          partial - 1 customer Anecdote + Receipt; remaining trust inherited from flagship purchase
  Bullets:        full - 5-8 bullets, Snapshot-heavy with optional Flip
  Cascade Close:  full - Stack / Vision / Math / Safety Net / Door + decline link + P.S.
  Greased Chute:  full - paragraph rhythm, open loops at section breaks
  Voice Rules:    full - first person, contractions, no marketing-speak, no manufactured urgency
  Temperature:    Warm to Hot (existing customer, journey-stage match required)

Fit: cross-sell genuinely fits the customer's current journey stage

Required next step: Run /convert bullshit-filter on this draft before shipping.
The Filter is a SEPARATE pass - this skill cannot grade its own output.
```

## Notes / Cross-Skill Composition

- This page is usually delivered via email + dedicated landing URL, not as a funnel-flow redirect. The customer arrives here with intent - the page should respect that.
- For a delivery sequence into this page, route through `/funnel ladder` or the email pack.
- If the cross-sell doesn't fit the customer's stage, do not send. The wrong cross-sell at the wrong stage trains them to ignore future communication.
- For email-list-wide announcement of a new product (not stage-targeted), use `/convert sales-page` instead - different intent.

## Lineage

- Customer-LTV cross-sell canon - direct-response info-marketing back-end strategy.
- Reciprocity at the customer-relationship level - Cialdini (Influence, 1984).
- Complementary-product bundling - behavioral-economics literature on cross-category purchase patterns.
- The Method itself - Wayland-owned operating system.
