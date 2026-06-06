---
name: convert-downsell-page
slash_command: false
pack: business-conversion
family: page_builder
description: |
  Author OTO recovery (downsell) pages: reduced-commitment offer after an OTO decline, with explicit acknowledgment of the prior "no" and a smaller, easier yes. Emits brief + paste-ready HTML/CSS.
  Use when an OTO has been declined and the user wants a softer recovery offer to capture buyers who balked at the upsell price or scope.
  Not for the original OTO (see /convert oto-page) or cross-sells (see /convert cross-sell-page).
triggers:
  - downsell page
  - oto recovery
  - downsell offer
  - convert downsell
  - reduced commitment offer
  - recovery upsell
negative_triggers:
  - oto page
  - cross-sell page
  - thank you page
  - audit my downsell
tags: [conversion, copy, page, downsell, oto, donahoe-method, html]
priority: 85
version: 1.0.0
author: Wayland Business Pack
license: MIT
metadata:
  wayland:
    related_skills: [convert, convert-oto-page, convert-cross-sell-page, convert-four-questions, convert-open, convert-three-locks, convert-bullets, convert-proof, convert-close, convert-chute, convert-voice, convert-bullshit-filter]
attribution:
  lineage: "The Donahoe Method (Wayland-owned operating system); references long-form direct-response funnel canon, Cialdini reciprocity and door-in-the-face concession psychology"
---

# Convert Downsell Page - OTO Recovery

> *"They said no. Don't pretend they didn't. Acknowledge the no, then offer something smaller that's genuinely easier to say yes to. Done right, the downsell rescues 15-30% of the buyers who balked. Done wrong, it makes the brand feel desperate."*

This skill builds the page that follows an OTO decline. Reduced-commitment psychology, explicit acknowledgment of the previous decision, and tight Method-applied copy.

## When to Use

Trigger phrases: `downsell page`, `oto recovery`, `convert downsell`, `reduced commitment offer`, `/convert downsell <product>`.

Use when:
- An OTO was just declined (the page that fires on click-through from the OTO's "No, thanks" link).
- A reduced-scope or reduced-price version of the OTO genuinely exists.
- The user wants to recover some of the lost OTO conversion.

## When NOT to Use

- **The original OTO page** → `/convert oto-page`.
- **Different-product cross-sell** → `/convert cross-sell-page`.
- **Generic thank-you page** → `/convert thank-you-page`.
- **Auditing existing downsell** → `/convert audit`.

## Inputs

Required:
1. **The flagship product** - what they bought first.
2. **The OTO they just declined** - referenced explicitly. The downsell page must acknowledge the no.
3. **The downsell product** - must be either: a reduced-scope version of the OTO, a payment-plan version, or a related smaller offer.
4. **Real "Why this is different from the OTO"** - what changed? Smaller scope? Easier price? Trial? If the answer is "same product cheaper," the original OTO price was wrong and should be re-examined.
5. **Accept URL + Decline URL.**

Optional:
- **Voice continuity notes from the flagship + OTO.**
- **`out_path`** - defaults via `build_report_path`.

## Workflow - All Eight Method Phases (post-decline compressed)

### Phase 0 - Four Questions (call `convert-four-questions`)

Reframed for post-decline:
- **Why You?** - Why this *smaller* thing, given they passed on the bigger thing?
- **Why Me?** - Inherited.
- **Why This?** - What's *different* about this offer vs. the OTO?
- **Why Now?** - The same one-time mechanic, but honest. Often: "you only see this because you already bought; closing this page = it's gone."

### Phase 1 - Temperature

**Hot-but-cooling.** They bought, then declined. Page must be very short - 200–500 words. Less is more.

### Phase 2 - Four-Layer Open (call `convert-open`)

Compressed and **acknowledgment-led**:
- Layer 1 = explicit acknowledgment of the no. *"Got it - the [OTO] wasn't the right fit. Hear me out for thirty seconds before you go..."*
- Layer 2 = side-door pivot to the smaller offer.
- Layer 3 = quick why-I'm-doing-this Skin in Game.
- Layer 4 = Fingerprint as one-line aside.

### Phase 3 - Three Locks

- **Want** = the smaller, easier scope. Sell the *easier* state, not the same state.
- **Trust** = inherited from flagship purchase. Almost no proof needed.
- **Excuse** = the math is even easier here. *"For $X you get the part of [OTO] that does [the most-asked-about thing]."*

### Phase 4 - Bullets

3–5 bullets only. Snapshot-heavy. Show what's *included* - and (briefly, honestly) what's *not*. Transparency about what's missing builds the trust this page needs.

### Phase 5 - Proof

One inherited Drive-By. No new proof block. The page stands on the trust already built.

### Phase 6 - Cascade Close

- Stack - small, conversational.
- Math - *"[smaller price] for [scoped feature]."*
- Safety Net - same guarantee mechanic.
- Door - Yes button, plain No-thanks decline link.

No P.S. - the page is short enough that a P.S. would feel redundant.

### Phase 7 - Greased Chute

Two paragraphs above the bullets, three paragraphs around the offer, button. That's it.

### Phase 8 - Voice + Bullshit Filter

The biggest filter test: *"Does this downsell exist because it's genuinely easier, or because we're trying to extract the buyer at any cost?"* If the latter, kill the downsell. Buyers detect desperation in milliseconds.

## Section Architecture

| # | Section | Lines |
|---|---------|-------|
| 1 | Acknowledgment open | 3–4 |
| 2 | Pivot paragraph | 1 |
| 3 | What this is (and what it's not) bullet block | 3–5 |
| 4 | Inherited proof / Drive-By | 1 |
| 5 | Stack + price + guarantee | 3–4 |
| 6 | Yes button + plain No-thanks link | - |

## HTML/CSS Reference Implementation

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>One quick alternative - {{BRAND}}</title>
  <meta name="description" content="{{META_DESCRIPTION}}">
  <meta property="og:title" content="{{HEADLINE}}">
  <meta property="og:description" content="{{META_DESCRIPTION}}">
  <meta property="og:type" content="website">
  <style>
    :root{--ink:#0e1116;--ink-soft:#3a3f47;--paper:#fbfaf6;--accent:#1f7a3a;--accent-ink:#fff;--rule:#e6e2d8;--max:620px}
    *,*::before,*::after{box-sizing:border-box}
    body{margin:0;font:18px/1.55 -apple-system,BlinkMacSystemFont,"Helvetica Neue",Arial,sans-serif;color:var(--ink);background:var(--paper)}
    main{max-width:var(--max);margin:0 auto;padding:24px 20px 64px}
    h1{font-size:clamp(22px,4vw,30px);line-height:1.2;margin:0 0 14px}
    h2{font-size:20px;margin:28px 0 10px}
    p{margin:0 0 16px}
    ul.bullets{list-style:none;padding:0;margin:0 0 20px}
    ul.bullets li{padding:8px 0 8px 26px;position:relative;border-bottom:1px solid var(--rule)}
    ul.bullets li::before{content:"";position:absolute;left:6px;top:16px;width:8px;height:8px;background:var(--accent);border-radius:50%}
    .stack{background:#fff;border:1px solid var(--rule);padding:18px;border-radius:8px;margin:0 0 18px}
    .cta{display:inline-block;padding:16px 24px;background:var(--accent);color:var(--accent-ink);text-decoration:none;font-weight:700;font-size:17px;border-radius:6px;border:0;cursor:pointer}
    .cta:focus-visible{outline:3px solid var(--ink);outline-offset:3px}
    .decline{display:inline-block;margin-top:12px;color:var(--ink-soft);font-size:14px;text-decoration:underline}
    .proof{font-size:14px;color:var(--ink-soft);border-top:1px solid var(--rule);padding-top:12px}
    @media (prefers-reduced-motion: reduce){html{scroll-behavior:auto}}
  </style>
</head>
<body>
<main>
  <h1>{{ACKNOWLEDGMENT_HEADLINE}}</h1>
  <p>{{COMPRESSED_OPEN_WITH_PIVOT}}</p>

  <h2>{{WHAT_THIS_IS_HEADER}}</h2>
  <ul class="bullets">
    <li>{{BULLET_INCLUDED_1}}</li>
    <li>{{BULLET_INCLUDED_2}}</li>
    <li>{{BULLET_INCLUDED_3}}</li>
    <li><em>Not included:</em> {{HONEST_OMISSION_LINE}}</li>
  </ul>

  <p class="proof">{{INHERITED_DRIVE_BY_PROOF_LINE}}</p>

  <div class="stack">
    <p>{{STACK_PARAGRAPH_SHORT}}</p>
    <p><strong>{{PRICE_LINE}}</strong></p>
    <p>{{GUARANTEE_LINE}}</p>
    <p>
      <a class="cta" href="{{ACCEPT_URL}}" aria-label="{{CTA_ARIA}}">{{CTA_YES_LABEL}}</a>
    </p>
    <p><a class="decline" href="{{DECLINE_URL}}">{{NO_THANKS_LABEL}}</a></p>
  </div>
</main>
</body>
</html>
```

CSS notes:
- The same green CTA as the OTO. Don't switch to a "louder" color here - that signals desperation.
- The "Not included" line is *italic* not bold. Honest, not screaming. The honesty *is* the conversion lever.
- Wider line-height for the body (1.55) because the page is short and the eye moves fast - extra breathing room helps comprehension.

## Output Template

```markdown
# Downsell Page - {{DOWNSELL_PRODUCT}}

**Flagship purchased:** {{FLAGSHIP}}
**OTO declined:** {{OTO}}
**Downsell offered:** {{DOWNSELL}} ({{REAL_DIFFERENCE_FROM_OTO}})
**Price:** {{DOWNSELL_PRICE}} (vs. OTO {{OTO_PRICE}})

## Phase 0–8 (compressed)
- Acknowledgment of the no (Layer 1)
- Pivot to smaller offer (Layer 2)
- Inherited trust (no new proof needed beyond 1 Drive-By)
- 3–5 bullets including ONE honest "not included" line
- Cascade Close: Stack + Math + Safety Net + Door + plain decline
- Voice Rules applied; Bullshit Filter is a separate downstream pass
- Ethics: downsell is genuinely easier, not desperation

## Final copy
- Acknowledgment headline: "{{H1}}"
- Open paragraph: "{{P}}"
- Bullets: {{LIST_INCLUDING_NOT_INCLUDED_LINE}}
- Inherited proof: "{{LINE}}"
- Stack: "{{P}}"
- Price line: "{{P}}"
- Guarantee: "{{P}}"
- Yes button: "{{LABEL}}"
- No-thanks: "{{LABEL}}"

## HTML reference
{{HTML_BLOCK}}

## Method coverage report
```
Method coverage report:
  Open:           full - acknowledgment-led Layer 1, Side Door pivot, light Skin in Game, Fingerprint aside
  Three Locks:    full - Want (smaller scope), Trust (inherited + 1 Drive-By), Excuse (easy math)
  Proof:          partial - inherited from flagship + 1 Drive-By line; no fresh proof block at this scale
  Bullets:        full - 3-5, Snapshot-heavy with one honest "not included" line
  Cascade Close:  partial - Stack / Math / Safety Net / Door + plain decline link; Vision and P.S./P.P.S. omitted (post-decline tone calls for less, not more)
  Greased Chute:  full - very short paragraphs, no walls of text, single-page eye flow
  Voice Rules:    full - first person, contractions, no marketing-speak, no desperation
  Temperature:    Hot (post-decline, attention partially open)

Ethics: downsell genuinely easier (not the OTO at a discount with the same scope)

Required next step: Run /convert bullshit-filter on this draft before shipping.
The Filter is a SEPARATE pass - this skill cannot grade its own output.
```

## Notes / Cross-Skill Composition

- The acknowledgment headline is non-negotiable. Pages that pretend the previous decline didn't happen feel manipulative.
- The "Not included" line is the secret weapon. Buyers expect spin; they get honesty; conversion lifts.
- If this downsell is also declined, route to the standard thank-you page (`/convert thank-you-page`). Do not chain a third reduced offer.
- Avoid stacking: flagship → OTO → downsell → second downsell. Two recovery offers feels desperate by the second one.

## Lineage

- Door-in-the-face concession psychology - Cialdini (Influence, 1984).
- Reciprocity / smaller-yes mechanics - same canon.
- Long-form direct-response funnel structure - informed by direct-mail "smaller offer letter" pattern.
- The Method itself - Wayland-owned operating system.
